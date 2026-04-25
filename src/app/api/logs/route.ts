import {
  clearSimulationState,
  getSimulationState
} from "@/modules/ingestion/application/SimulationState";
import { getAppSettings } from "@/modules/settings/application/AppSettingsStore";

export async function GET(): Promise<Response> {
  const state = await getSimulationState();
  const settings = getAppSettings();
  const logs = state.logs.map((log) => ({
    ...log,
    requestId: settings.piiMaskingEnabled ? undefined : log.requestId
  }));
  return Response.json({
    activeScenario: state.activeScenario,
    updatedAt: state.updatedAt,
    count: logs.length,
    logs
  });
}

export async function DELETE(): Promise<Response> {
  await clearSimulationState();
  return Response.json({ message: "Logs cleared." });
}
