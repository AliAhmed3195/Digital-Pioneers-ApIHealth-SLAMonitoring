import { runDetectionCycle } from "@/modules/incidents/application/DetectionCycle";

export async function GET(): Promise<Response> {
  const result = await runDetectionCycle();
  return Response.json({
    activeScenario: result.activeScenario,
    updatedAt: result.updatedAt,
    incidents: result.incidents
  });
}
