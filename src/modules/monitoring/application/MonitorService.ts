import { analyzeWindowForSla } from "@/modules/monitoring/application/SlaWindowAnalyzer";
import { getLogsForRecentWindow } from "@/modules/monitoring/application/LogWindowReader";
import type { MonitorRunRecord } from "@/modules/monitoring/domain/MonitorContracts";
import { monitorRepository } from "@/modules/monitoring/infrastructure/InMemoryMonitorRepository";
import { generateMonitorLlmResult } from "@/modules/monitoring/infrastructure/LlmRiskClient";
import { sendBrevoAlertEmailIfNeeded } from "@/modules/monitoring/infrastructure/BrevoAlertEmailService";
import { getAppSettings } from "@/modules/settings/application/AppSettingsStore";

function createRunId(): string {
  return `mon_${Math.random().toString(36).slice(2, 10)}`;
}

function clampLookbackMinutes(value: number): number {
  if (!Number.isFinite(value)) {
    return 15;
  }
  return Math.min(Math.max(Math.floor(value), 1), 240);
}

export function resolveMonitorLookbackMinutes(inputLookback?: number): number {
  if (typeof inputLookback === "number") {
    return clampLookbackMinutes(inputLookback);
  }
  const settingsLookback = getAppSettings().monitorLookbackMinutes;
  const envRaw = Number(process.env.MONITOR_LOOKBACK_MINUTES ?? settingsLookback);
  return clampLookbackMinutes(envRaw);
}

export async function runMonitorCycle(input?: {
  lookbackMinutes?: number;
}): Promise<{
  run: MonitorRunRecord;
  email: { sent: boolean; reason?: string };
}> {
  const effectiveLookback = resolveMonitorLookbackMinutes(input?.lookbackMinutes);
  const window = await getLogsForRecentWindow(effectiveLookback);
  const endpointSummaries = analyzeWindowForSla(window.logs);
  const result = await generateMonitorLlmResult({
    windowFrom: window.fromIso,
    windowTo: window.toIso,
    summaries: endpointSummaries
  });

  const run: MonitorRunRecord = {
    id: createRunId(),
    executedAt: new Date().toISOString(),
    windowFrom: window.fromIso,
    windowTo: window.toIso,
    lookbackMinutes: effectiveLookback,
    totalLogs: window.logs.length,
    result
  };
  await monitorRepository.save(run);
  const email = await sendBrevoAlertEmailIfNeeded({
    monitorResult: result,
    windowFrom: run.windowFrom,
    windowTo: run.windowTo
  });

  return { run, email };
}

export async function getLatestMonitorRun(): Promise<MonitorRunRecord | null> {
  return monitorRepository.latest();
}

export async function listMonitorRuns(): Promise<MonitorRunRecord[]> {
  return monitorRepository.list();
}
