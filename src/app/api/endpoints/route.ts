import { runDetectionCycle } from "@/modules/incidents/application/DetectionCycle";

export async function GET(): Promise<Response> {
  const result = await runDetectionCycle();
  const endpoints = result.endpointRisk.map((item) => ({
    ...item,
    updatedAt: result.updatedAt
  }));
  return Response.json({
    activeScenario: result.activeScenario,
    updatedAt: result.updatedAt,
    endpoints
  });
}
