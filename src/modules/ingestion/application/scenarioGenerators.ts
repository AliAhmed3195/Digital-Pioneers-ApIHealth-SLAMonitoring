import type { RawLogEvent } from "@/modules/ingestion/domain/RawLogEvent";
import type { SimulationScenario } from "@/modules/ingestion/domain/SimulationScenario";

type BuildScenarioLogsInput = {
  scenario: SimulationScenario;
  endpoint?: string;
  count?: number;
};

function createRequestId(prefix: string, index: number): string {
  return `${prefix}-${Date.now()}-${index}`;
}

function baseEvent(index: number, endpoint: string): RawLogEvent {
  return {
    timestamp: new Date(Date.now() - (120 - index) * 1000).toISOString(),
    endpoint,
    method: "POST",
    status: 200,
    latency_ms: 180 + (index % 6) * 8,
    request_id: createRequestId("req", index)
  };
}

export function buildScenarioLogs({
  scenario,
  endpoint = "/payments",
  count = 120
}: BuildScenarioLogsInput): RawLogEvent[] {
  const logs: RawLogEvent[] = [];
  for (let i = 0; i < count; i += 1) {
    const event = baseEvent(i, endpoint);

    if (scenario === "LATENCY_RAMP") {
      event.latency_ms = 180 + i * 12;
    }

    if (scenario === "ERROR_SPIKE") {
      const isSpikeWindow = i > Math.floor(count * 0.6);
      if (isSpikeWindow && i % 3 === 0) {
        event.status = 503;
        event.error = "upstream timeout";
        event.latency_ms = 1400 + (i % 5) * 120;
      }
    }

    if (scenario === "SLOW_NO_ERROR") {
      event.status = 200;
      event.latency_ms = 650 + (i % 8) * 30;
    }

    logs.push(event);
  }
  return logs;
}
