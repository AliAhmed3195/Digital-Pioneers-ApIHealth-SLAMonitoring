export type ParsedQueryFilters = {
  timeRange: "last_15_minutes" | "last_1_hour" | "last_2_hours" | "last_24_hours";
  statusClass: "all" | "5xx" | "4xx";
  endpoint: string | null;
  minP95LatencyMs: number | null;
};

const defaultFilters: ParsedQueryFilters = {
  timeRange: "last_1_hour",
  statusClass: "all",
  endpoint: null,
  minP95LatencyMs: null
};

export function parseLogQuery(query: string): ParsedQueryFilters {
  const normalized = query.toLowerCase();
  const filters: ParsedQueryFilters = { ...defaultFilters };

  if (normalized.includes("last 15")) {
    filters.timeRange = "last_15_minutes";
  } else if (normalized.includes("last 2 hour")) {
    filters.timeRange = "last_2_hours";
  } else if (normalized.includes("last 24")) {
    filters.timeRange = "last_24_hours";
  }

  if (normalized.includes("5xx")) {
    filters.statusClass = "5xx";
  } else if (normalized.includes("4xx")) {
    filters.statusClass = "4xx";
  }

  const endpointMatch = normalized.match(/\/[a-z0-9-_]+/);
  if (endpointMatch?.[0]) {
    filters.endpoint = endpointMatch[0];
  }

  const latencyMatch = normalized.match(/p95\s*>\s*(\d+)/);
  if (latencyMatch?.[1]) {
    filters.minP95LatencyMs = Number(latencyMatch[1]);
  }

  return filters;
}
