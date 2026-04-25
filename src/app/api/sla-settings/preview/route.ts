import { runDetectionCycle } from "@/modules/incidents/application/DetectionCycle";
import { getAppSettings, type SLAThresholds } from "@/modules/settings/application/AppSettingsStore";

type PreviewPayload = {
  globalTimeRange?: "15m" | "1h" | "24h";
  slaThresholds?: Partial<SLAThresholds>;
};

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json()) as PreviewPayload;
  const current = getAppSettings();
  const effectiveThresholds = {
    ...current.slaThresholds,
    ...(payload.slaThresholds ?? {})
  };

  const preview = await runDetectionCycle({
    globalTimeRange: payload.globalTimeRange ?? current.globalTimeRange,
    slaThresholds: effectiveThresholds
  });

  const riskSummary = {
    green: preview.endpointRisk.filter((item) => item.assessment.level === "GREEN").length,
    amber: preview.endpointRisk.filter((item) => item.assessment.level === "AMBER").length,
    red: preview.endpointRisk.filter((item) => item.assessment.level === "RED").length
  };

  return Response.json({
    preview: {
      globalTimeRange: preview.globalTimeRange,
      endpointCount: preview.endpointRisk.length,
      atRiskEndpoints: preview.endpointRisk.filter((item) => item.assessment.level !== "GREEN").length,
      activeIncidents: preview.incidents.filter((item) => item.status !== "RESOLVED").length,
      riskSummary
    }
  });
}
