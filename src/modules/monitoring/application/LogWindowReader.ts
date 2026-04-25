import { getSimulationState } from "@/modules/ingestion/application/SimulationState";
import type { NormalizedLogRecord } from "@/shared/contracts/core";

function clampLookbackMinutes(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 15;
  }
  return Math.min(Math.max(Math.floor(value), 1), 240);
}

export async function getLogsForRecentWindow(lookbackMinutes = 15): Promise<{
  fromIso: string;
  toIso: string;
  logs: NormalizedLogRecord[];
}> {
  const minutes = clampLookbackMinutes(lookbackMinutes);
  const state = await getSimulationState();
  const allLogs = state.logs;

  const parsedTimes = allLogs
    .map((log) => Date.parse(log.timestamp))
    .filter((value) => Number.isFinite(value));
  const anchorMs = parsedTimes.length > 0 ? Math.max(...parsedTimes) : Date.now();
  const fromMs = anchorMs - minutes * 60 * 1000;

  const logs = allLogs.filter((log) => {
    const ts = Date.parse(log.timestamp);
    return Number.isFinite(ts) && ts >= fromMs && ts <= anchorMs;
  });

  return {
    fromIso: new Date(fromMs).toISOString(),
    toIso: new Date(anchorMs).toISOString(),
    logs
  };
}
