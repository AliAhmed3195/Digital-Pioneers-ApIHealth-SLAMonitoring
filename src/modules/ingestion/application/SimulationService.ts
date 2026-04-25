import { buildScenarioLogs } from "@/modules/ingestion/application/scenarioGenerators";
import { setSimulationState } from "@/modules/ingestion/application/SimulationState";
import type { SimulationScenario } from "@/modules/ingestion/domain/SimulationScenario";
import { JsonLogSourceAdapter } from "@/modules/ingestion/infrastructure/JsonLogSourceAdapter";
import type { NormalizedLogRecord } from "@/shared/contracts/core";

const adapter = new JsonLogSourceAdapter();

export async function runScenario(
  scenario: SimulationScenario,
  endpoint?: string
): Promise<NormalizedLogRecord[]> {
  const raw = buildScenarioLogs({ scenario, endpoint });
  const logs = raw.map((entry) => adapter.normalize(entry));
  await setSimulationState({ activeScenario: scenario, logs });
  return logs;
}
