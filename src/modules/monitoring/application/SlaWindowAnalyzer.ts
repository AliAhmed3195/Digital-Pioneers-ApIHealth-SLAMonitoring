import { getAppSettings } from "@/modules/settings/application/AppSettingsStore";
import type { EndpointWindowStats } from "@/modules/monitoring/domain/MonitorContracts";
import type { NormalizedLogRecord } from "@/shared/contracts/core";

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, item) => sum + item, 0) / values.length).toFixed(2));
}

function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  const safeIndex = Math.max(0, Math.min(index, sortedValues.length - 1));
  return sortedValues[safeIndex] ?? 0;
}

export function analyzeWindowForSla(logs: NormalizedLogRecord[]): EndpointWindowStats[] {
  const settings = getAppSettings();
  const bucket = new Map<string, NormalizedLogRecord[]>();
  for (const log of logs) {
    const endpointLogs = bucket.get(log.endpoint) ?? [];
    endpointLogs.push(log);
    bucket.set(log.endpoint, endpointLogs);
  }

  const summaries: EndpointWindowStats[] = [];
  for (const [endpoint, endpointLogs] of bucket.entries()) {
    const requestCount = endpointLogs.length;
    const errorCount = endpointLogs.filter((item) => item.status >= 500).length;
    const errorRate = requestCount > 0 ? Number(((errorCount / requestCount) * 100).toFixed(2)) : 0;
    const latencies = endpointLogs.map((item) => item.latencyMs).sort((a, b) => a - b);
    const avgResponseTimeMs = avg(latencies);
    const p95LatencyMs = percentile(latencies, 95);
    const topErrors = Array.from(
      endpointLogs
        .filter((item) => item.errorMessage)
        .reduce((map, item) => {
          const key = item.errorMessage ?? "unknown error";
          map.set(key, (map.get(key) ?? 0) + 1);
          return map;
        }, new Map<string, number>())
        .entries()
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((item) => item[0]);

    const slaBreached =
      errorRate > settings.slaThresholds.criticalErrorRate ||
      p95LatencyMs > settings.slaThresholds.criticalP95LatencyMs;

    summaries.push({
      endpoint,
      requestCount,
      errorRate,
      avgResponseTimeMs,
      p95LatencyMs,
      topErrors,
      slaBreached
    });
  }

  return summaries.sort((a, b) => b.requestCount - a.requestCount);
}
