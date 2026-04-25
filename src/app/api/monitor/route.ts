import {
  getLatestMonitorRun,
  listMonitorRuns,
  resolveMonitorLookbackMinutes,
  runMonitorCycle
} from "@/modules/monitoring/application/MonitorService";

type MonitorRunPayload = {
  lookbackMinutes?: number;
};

function isAuthorized(request: Request): boolean {
  const allowUiTrigger =
    process.env.MONITOR_ALLOW_UI_TRIGGER === "true" || process.env.NODE_ENV !== "production";
  if (allowUiTrigger && request.headers.get("x-monitor-ui") === "1") {
    return true;
  }

  const secrets = [process.env.MONITOR_CRON_SECRET, process.env.CRON_SECRET].filter(
    (item): item is string => Boolean(item)
  );
  if (secrets.length === 0) {
    return true;
  }
  const authHeader = request.headers.get("authorization");
  if (secrets.some((secret) => authHeader === `Bearer ${secret}`)) {
    return true;
  }
  const headerSecret = request.headers.get("x-monitor-secret");
  return secrets.includes(headerSecret ?? "");
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const includeHistory = url.searchParams.get("history") === "true";
  if (includeHistory) {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized monitor history access." }, { status: 401 });
    }
    const runs = await listMonitorRuns();
    return Response.json({ runs });
  }

  const latest = await getLatestMonitorRun();
  return Response.json({
    latest,
    config: {
      lookbackMinutes: resolveMonitorLookbackMinutes(),
      cronSchedule: process.env.MONITOR_CRON_SCHEDULE ?? "*/15 * * * *"
    }
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized monitor execution." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as MonitorRunPayload;
  const result = await runMonitorCycle({
    lookbackMinutes: payload.lookbackMinutes
  });

  return Response.json({
    run: result.run,
    email: result.email
  });
}
