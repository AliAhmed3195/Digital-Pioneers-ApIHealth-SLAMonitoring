import { evaluateAlertRules } from "@/modules/alert-rules/application/AlertRuleEvaluator";
import { getSimulationState } from "@/modules/ingestion/application/SimulationState";
import { IncidentEngineService } from "@/modules/incidents/application/IncidentEngineService";
import { incidentRepository } from "@/modules/incidents/infrastructure/InMemoryIncidentRepository";
import { computeEndpointMetrics } from "@/modules/metrics/application/MetricsService";
import { ThresholdRiskScorer } from "@/modules/risk/infrastructure/ThresholdRiskScorer";
import {
  getAppSettings,
  type AppSettings,
  type SLAThresholds
} from "@/modules/settings/application/AppSettingsStore";

type DetectionOverrides = {
  globalTimeRange?: AppSettings["globalTimeRange"];
  slaThresholds?: Partial<SLAThresholds>;
};

function getRangeStartMs(globalTimeRange: AppSettings["globalTimeRange"], nowMs: number): number {
  if (globalTimeRange === "15m") return nowMs - 15 * 60 * 1000;
  if (globalTimeRange === "1h") return nowMs - 60 * 60 * 1000;
  return nowMs - 24 * 60 * 60 * 1000;
}

function filterLogsByTimeRange(
  logs: Awaited<ReturnType<typeof getSimulationState>>["logs"],
  globalTimeRange: AppSettings["globalTimeRange"]
) {
  const parsedTimes = logs.map((log) => Date.parse(log.timestamp)).filter((value) => Number.isFinite(value));
  const anchorMs = parsedTimes.length > 0 ? Math.max(...parsedTimes) : Date.now();
  const fromMs = getRangeStartMs(globalTimeRange, anchorMs);
  return logs.filter((log) => {
    const timestampMs = Date.parse(log.timestamp);
    return Number.isFinite(timestampMs) && timestampMs >= fromMs && timestampMs <= anchorMs;
  });
}

export async function runDetectionCycle(overrides?: DetectionOverrides) {
  const state = await getSimulationState();
  const storedSettings = getAppSettings();
  const settings: AppSettings = {
    ...storedSettings,
    ...overrides,
    slaThresholds: {
      ...storedSettings.slaThresholds,
      ...(overrides?.slaThresholds ?? {})
    }
  };
  const rangeFilteredLogs = filterLogsByTimeRange(state.logs, settings.globalTimeRange);
  const endpointMetrics = computeEndpointMetrics(rangeFilteredLogs);
  const scorer = new ThresholdRiskScorer(settings.slaThresholds);

  const endpointRisk = endpointMetrics.map((item) => ({
    endpoint: item.endpoint,
    metrics: item.window,
    assessment: scorer.evaluate(item.window)
  }));

  const incidentEngine = new IncidentEngineService(incidentRepository);
  const incidents = await incidentEngine.syncFromSnapshots(endpointRisk);
  const triggeredRules = await evaluateAlertRules(endpointMetrics);

  const topContributors = [...endpointRisk]
    .sort((a, b) => b.metrics.p95LatencyMs - a.metrics.p95LatencyMs)
    .slice(0, 3)
    .map((item) => ({
      endpoint: item.endpoint,
      p95LatencyMs: item.metrics.p95LatencyMs,
      errorRate: item.metrics.errorRate
    }));

  const correlationHints = endpointRisk
    .filter((item) => item.assessment.level !== "GREEN")
    .map((item) => ({
      endpoint: item.endpoint,
      hint: `Risk likely linked to elevated latency (${item.metrics.p95LatencyMs}ms) or error rate (${item.metrics.errorRate}%).`
    }));

  return {
    activeScenario: state.activeScenario,
    updatedAt: state.updatedAt,
    environment: settings.environment,
    globalTimeRange: settings.globalTimeRange,
    endpointRisk,
    incidents,
    triggeredRules,
    topContributors,
    correlationHints
  };
}
