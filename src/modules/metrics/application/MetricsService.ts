import type { EndpointMetrics, MetricWindow, NormalizedLogRecord } from "@/shared/contracts/core";

function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  const safeIndex = Math.max(0, Math.min(index, sortedValues.length - 1));
  return sortedValues[safeIndex] ?? 0;
}

function toMetricWindow(logs: NormalizedLogRecord[]): MetricWindow {
  if (logs.length === 0) {
    const now = new Date().toISOString();
    return {
      from: now,
      to: now,
      requestCount: 0,
      errorRate: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0
    };
  }

  const sortedByTime = [...logs].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );
  const latencies = sortedByTime.map((item) => item.latencyMs).sort((a, b) => a - b);
  const errors = sortedByTime.filter((item) => item.status >= 500).length;

  return {
    from: sortedByTime[0]?.timestamp ?? new Date().toISOString(),
    to: sortedByTime[sortedByTime.length - 1]?.timestamp ?? new Date().toISOString(),
    requestCount: sortedByTime.length,
    errorRate: Number(((errors / sortedByTime.length) * 100).toFixed(2)),
    p95LatencyMs: percentile(latencies, 95),
    p99LatencyMs: percentile(latencies, 99)
  };
}

export function computeEndpointMetrics(
  logs: NormalizedLogRecord[]
): EndpointMetrics[] {
  const bucket = new Map<string, NormalizedLogRecord[]>();
  for (const log of logs) {
    const endpointLogs = bucket.get(log.endpoint) ?? [];
    endpointLogs.push(log);
    bucket.set(log.endpoint, endpointLogs);
  }

  const summaries: EndpointMetrics[] = [];
  for (const [endpoint, endpointLogs] of bucket.entries()) {
    summaries.push({
      endpoint,
      window: toMetricWindow(endpointLogs)
    });
  }

  return summaries.sort((a, b) => a.endpoint.localeCompare(b.endpoint));
}
