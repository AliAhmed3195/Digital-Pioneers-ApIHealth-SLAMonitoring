import { runDetectionCycle } from "@/modules/incidents/application/DetectionCycle";

export async function GET(): Promise<Response> {
  const result = await runDetectionCycle();

  const totalRequests = result.endpointRisk.reduce(
    (sum, item) => sum + item.metrics.requestCount,
    0
  );
  const atRiskEndpoints = result.endpointRisk.filter(
    (item) => item.assessment.level !== "GREEN"
  ).length;
  const activeIncidents = result.incidents.filter(
    (item) => item.status !== "RESOLVED"
  ).length;

  return Response.json({
    activeScenario: result.activeScenario,
    updatedAt: result.updatedAt,
    kpis: {
      totalRequests,
      endpointCount: result.endpointRisk.length,
      atRiskEndpoints,
      activeIncidents
    },
    topContributors: result.topContributors,
    correlationHints: result.correlationHints,
    triggeredRules: result.triggeredRules
  });
}
