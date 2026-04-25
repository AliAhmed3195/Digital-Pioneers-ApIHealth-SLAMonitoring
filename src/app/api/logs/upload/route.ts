import { setSimulationState } from "@/modules/ingestion/application/SimulationState";
import { runDetectionCycle } from "@/modules/incidents/application/DetectionCycle";
import type { RawLogEvent } from "@/modules/ingestion/domain/RawLogEvent";
import { JsonLogSourceAdapter } from "@/modules/ingestion/infrastructure/JsonLogSourceAdapter";

function parseJsonLike(text: string): RawLogEvent[] | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as RawLogEvent[];
    }
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "logs" in parsed &&
      Array.isArray((parsed as { logs?: unknown }).logs)
    ) {
      return (parsed as { logs: RawLogEvent[] }).logs;
    }
  } catch {
    return null;
  }
  return null;
}

function parseNdjson(text: string): RawLogEvent[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const entries: RawLogEvent[] = [];
  for (const line of lines) {
    try {
      const item = JSON.parse(line) as RawLogEvent;
      entries.push(item);
    } catch {
      return [];
    }
  }
  return entries;
}

function parseCsv(text: string): RawLogEvent[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length < 2) {
    return [];
  }
  const headers = lines[0]?.split(",").map((item) => item.trim().toLowerCase()) ?? [];
  const looksLikeCsv =
    headers.length > 1 &&
    headers.some((header) =>
      ["timestamp", "time", "endpoint", "path", "route", "status", "status_code"].includes(
        header
      )
    );
  if (!looksLikeCsv) {
    return [];
  }
  const rows: RawLogEvent[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = lines[i]?.split(",").map((item) => item.trim()) ?? [];
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    rows.push({
      timestamp: row.timestamp || row.time,
      endpoint: row.endpoint || row.path || row.route,
      method: row.method,
      status: row.status ? Number(row.status) : undefined,
      latency_ms: row.latency_ms
        ? Number(row.latency_ms)
        : row.latency
          ? Number(row.latency)
          : undefined,
      request_id: row.request_id || row.requestid,
      error: row.error || row.error_message
    });
  }
  return rows;
}

function parseKeyValueLines(text: string): RawLogEvent[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const entries: RawLogEvent[] = [];
  const pairRegex = /([a-zA-Z_][a-zA-Z0-9_]*)=("[^"]*"|\S+)/g;
  for (const line of lines) {
    const row: Record<string, string> = {};
    let match: RegExpExecArray | null = pairRegex.exec(line);
    while (match) {
      const key = match[1] ?? "";
      const rawValue = match[2] ?? "";
      row[key] = rawValue.replace(/^"|"$/g, "");
      match = pairRegex.exec(line);
    }
    pairRegex.lastIndex = 0;
    if (Object.keys(row).length === 0) {
      continue;
    }
    entries.push({
      timestamp: row.timestamp || row.time,
      endpoint: row.endpoint || row.path || row.route,
      method: row.method,
      status: row.status ? Number(row.status) : undefined,
      latency_ms: row.latency_ms
        ? Number(row.latency_ms)
        : row.latency
          ? Number(row.latency)
          : undefined,
      request_id: row.request_id || row.requestId,
      error: row.error || row.error_message
    });
  }
  return entries;
}

function parsePipeGatewayLogs(text: string): RawLogEvent[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const entries: RawLogEvent[] = [];

  for (const line of lines) {
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
    const methodMatch = line.match(/\b(GET|POST|PUT|PATCH|DELETE)\b/i);
    const statusMatch = line.match(/Response:\s*\{"code":(\d+)/i);
    const apiNameMatch = line.match(/Api Name\s*:\s*(\/[a-zA-Z0-9/_-]+)/i);
    const pathMatch = line.match(/\|\s*(\/[a-zA-Z0-9/_-]+)\s*\|/);
    const endpoint = apiNameMatch?.[1] ?? pathMatch?.[1];

    const latencyMatch = line.match(/\|\s*(\d{1,6})\s*\|/);
    const requestIdMatch = line.match(/\|\s*([a-f0-9]{8,32})\s*\|\s*([a-f0-9]{8,32})\s*\|/i);

    if (!endpoint) {
      continue;
    }

    entries.push({
      timestamp: timestampMatch?.[1]?.replace(/\s+/, "T")
        ? `${timestampMatch[1]?.replace(/\s+/, "T")}Z`
        : undefined,
      endpoint: endpoint,
      method: methodMatch?.[1]?.toUpperCase(),
      status: statusMatch?.[1] ? Number(statusMatch[1]) >= 1 ? 200 : 500 : undefined,
      latency_ms: latencyMatch?.[1] ? Number(latencyMatch[1]) : undefined,
      request_id: requestIdMatch?.[1],
      error: line.includes("Response: {\"code\":0") ? "gateway response code 0" : undefined
    });
  }

  return entries;
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function extractEndpointFromLine(line: string): string | null {
  const apiName = line.match(/Api Name\s*:\s*(\/[a-zA-Z0-9/_-]+)/i)?.[1];
  if (apiName) return apiName;

  const requestUri = line.match(/"request_uri"\s*:\s*"([^"]+)"/i)?.[1];
  if (requestUri?.startsWith("/")) return requestUri;

  const txName = line.match(/Transaction Name\s*:\s*([a-zA-Z0-9_]+)/i)?.[1];
  if (txName) return `/transaction/${toKebabCase(txName)}`;

  const requestName = line.match(/\bRequest:\s*([a-zA-Z0-9_]+)/i)?.[1];
  if (requestName) return `/request/${toKebabCase(requestName)}`;

  const classMethod = line.match(/Class:\s*([a-zA-Z0-9_$.]+),\s*Method:\s*([a-zA-Z0-9_$.]+)/i);
  if (classMethod?.[1] && classMethod?.[2]) {
    return `/java/${toKebabCase(classMethod[1])}/${toKebabCase(classMethod[2])}`;
  }

  const methodOnly = line.match(/method\s+([a-zA-Z0-9_]+)\(\)/i)?.[1];
  if (methodOnly) return `/method/${toKebabCase(methodOnly)}`;

  const xmlTransactionCode = line.match(/<ccis:Transaction_Code>([^<]+)<\/ccis:Transaction_Code>/i)?.[1];
  if (xmlTransactionCode) return `/soap/transaction-${toKebabCase(xmlTransactionCode)}`;

  const soapMarker = line.match(/\bSoap\s+(Request|Response)\b/i)?.[1];
  if (soapMarker) return `/soap/${toKebabCase(soapMarker)}`;

  const genericPath = line.match(/(\/[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+){1,})/)?.[1];
  if (genericPath) return genericPath;

  return null;
}

function extractStatusFromLine(line: string): number | undefined {
  const statusCodeValue = line.match(/"statusCodeValue"\s*:\s*(\d{3})/i)?.[1];
  if (statusCodeValue) return Number(statusCodeValue);

  const responseCode = line.match(/Response:\s*\{"code":(\d+)/i)?.[1];
  if (responseCode) {
    return Number(responseCode) >= 1 ? 200 : 500;
  }

  const xmlResponseCode = line.match(/<ccis:Response_Code>([^<]+)<\/ccis:Response_Code>/i)?.[1];
  if (xmlResponseCode) {
    return xmlResponseCode === "000" ? 200 : 500;
  }

  if (/\bERROR\b/i.test(line)) return 500;
  if (/\bWARN\b/i.test(line)) return 429;
  if (/\bINFO\b/i.test(line) || /\bDEBUG\b/i.test(line)) return 200;
  return undefined;
}

function parseGenericTextLogs(text: string): RawLogEvent[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const entries: RawLogEvent[] = [];
  let lastEndpoint: string | null = null;

  for (const line of lines) {
    const timestamp =
      line.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?(?:,\d{3})?)/)?.[1] ??
      undefined;
    const endpoint: string | null = extractEndpointFromLine(line) ?? lastEndpoint;

    if (endpoint) {
      lastEndpoint = endpoint;
    }

    const shouldCapture =
      Boolean(endpoint) &&
      (/Request|Response|Transaction|Api Name|method|Class|Soap/i.test(line) || Boolean(timestamp));
    if (!shouldCapture || !endpoint) {
      continue;
    }

    const requestId =
      line.match(/\|\s*([a-f0-9]{8,32})\s*\|\s*([a-f0-9]{8,32})\s*\|/i)?.[1] ??
      line.match(/\|\s*([a-f0-9]{8,32})\s*\|/i)?.[1];

    const latencyValue = line.match(/\b(\d{1,5})\s*ms\b/i)?.[1];

    entries.push({
      timestamp: timestamp ? `${timestamp.replace(/\s+/, "T").replace(",", ".")}Z` : undefined,
      endpoint,
      method: line.match(/\b(GET|POST|PUT|PATCH|DELETE)\b/i)?.[1]?.toUpperCase(),
      status: extractStatusFromLine(line),
      latency_ms: latencyValue ? Number(latencyValue) : undefined,
      request_id: requestId
    });
  }

  return entries;
}

function createFallbackEndpoint(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return `/unclassified/${toKebabCase(baseName || "uploaded-log")}`;
}

function synthesizeFallbackLogs(text: string, fallbackEndpoint: string): RawLogEvent[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0).slice(0, 5000);
  const now = new Date().toISOString();
  return lines.map((line, index) => ({
    timestamp: (() => {
      const rawTimestamp = line.match(
        /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?(?:,\d{3})?)/
      )?.[1];
      return rawTimestamp ? `${rawTimestamp.replace(/\s+/, "T").replace(",", ".")}Z` : now;
    })(),
    endpoint: extractEndpointFromLine(line) ?? fallbackEndpoint,
    status: extractStatusFromLine(line) ?? 200,
    method: line.match(/\b(GET|POST|PUT|PATCH|DELETE)\b/i)?.[1]?.toUpperCase() ?? "GET",
    request_id: line.match(/[a-f0-9]{12,32}/i)?.[0] ?? `line-${index}`
  }));
}

function parseLogText(text: string, fileName?: string): RawLogEvent[] {
  const directJson = parseJsonLike(text);
  if (directJson && directJson.length > 0) {
    return directJson;
  }

  const ndjson = parseNdjson(text);
  if (ndjson.length > 0) {
    return ndjson;
  }

  const pipeGateway = parsePipeGatewayLogs(text);
  if (pipeGateway.length > 0) {
    return pipeGateway;
  }

  const csv = parseCsv(text);
  if (csv.length > 0) {
    return csv;
  }

  const keyValue = parseKeyValueLines(text);
  if (keyValue.length > 0) {
    return keyValue;
  }

  const genericText = parseGenericTextLogs(text);
  if (genericText.length > 0) {
    return genericText;
  }

  if (fileName) {
    return synthesizeFallbackLogs(text, createFallbackEndpoint(fileName));
  }

  return synthesizeFallbackLogs(text, "/unclassified/uploaded-log");
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  let rawLogs: RawLogEvent[] = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "file is required." }, { status: 400 });
    }
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".txt") && !fileName.endsWith(".log")) {
      return Response.json(
        { error: "Only .txt or .log files are allowed for now." },
        { status: 400 }
      );
    }
    const text = await file.text();
    rawLogs = parseLogText(text, fileName);
  } else {
    const payload = (await request.json()) as { logs?: RawLogEvent[] };
    rawLogs = payload.logs ?? [];
  }

  if (!Array.isArray(rawLogs) || rawLogs.length === 0) {
    return Response.json(
      {
        error:
          "Unable to parse uploaded logs. Ensure .txt/.log file contains gateway or transaction log lines."
      },
      { status: 400 }
    );
  }

  const adapter = new JsonLogSourceAdapter();
  const normalizedLogs = rawLogs.map((item) => {
    const normalized = adapter.normalize(item);
    if (!normalized.endpoint || normalized.endpoint === "/unknown") {
      return {
        ...normalized,
        endpoint: "/unclassified/uploaded-log"
      };
    }
    return normalized;
  });
  await setSimulationState({
    activeScenario: "CUSTOM_UPLOAD",
    logs: normalizedLogs
  });

  const cycle = await runDetectionCycle();
  return Response.json({
    message: "Logs uploaded successfully.",
    uploadedCount: normalizedLogs.length,
    atRiskEndpoints: cycle.endpointRisk.filter((item) => item.assessment.level !== "GREEN").length,
    activeIncidents: cycle.incidents.filter((item) => item.status !== "RESOLVED").length
  });
}
