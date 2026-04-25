import { runScenario } from "@/modules/ingestion/application/SimulationService";
import { runDetectionCycle } from "@/modules/incidents/application/DetectionCycle";
import {
  simulationScenarios,
  type SimulationScenario
} from "@/modules/ingestion/domain/SimulationScenario";

type RunScenarioPayload = {
  scenario?: string;
  endpoint?: string;
};

function isSimulationScenario(value: string): value is SimulationScenario {
  return simulationScenarios.includes(value as SimulationScenario);
}

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json()) as RunScenarioPayload;
  if (!payload.scenario || !isSimulationScenario(payload.scenario)) {
    return Response.json(
      {
        error: "Invalid scenario. Allowed scenarios are LATENCY_RAMP, ERROR_SPIKE, SLOW_NO_ERROR."
      },
      { status: 400 }
    );
  }

  const logs = await runScenario(payload.scenario, payload.endpoint);
  const cycle = await runDetectionCycle();
  return Response.json({
    scenario: payload.scenario,
    count: logs.length,
    sample: logs.slice(0, 5),
    atRiskEndpoints: cycle.endpointRisk.filter((item) => item.assessment.level !== "GREEN")
      .length,
    activeIncidents: cycle.incidents.filter((item) => item.status !== "RESOLVED").length
  });
}
