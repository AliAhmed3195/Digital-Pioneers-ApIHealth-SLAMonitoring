import { getSimulationState } from "@/modules/ingestion/application/SimulationState";
import { getAppSettings } from "@/modules/settings/application/AppSettingsStore";

export async function GET(): Promise<Response> {
  const state = await getSimulationState();
  const settings = getAppSettings();
  const logs = state.logs;

  const missingRequestIds = logs.filter((log) => !log.requestId).length;
  const errorLogs = logs.filter((log) => log.status >= 500).length;
  const droppedLogs = 0;

  return Response.json({
    sourceStatus: state.activeScenario ? "CONNECTED" : "IDLE",
    activeScenario: state.activeScenario,
    updatedAt: state.updatedAt,
    quality: {
      totalLogs: logs.length,
      missingRequestIds,
      errorLogs,
      droppedLogs
    },
    piiMaskingEnabled: settings.piiMaskingEnabled,
    environment: settings.environment
  });
}
