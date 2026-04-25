import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type SLAThresholds = {
  targetP95LatencyMs: number;
  warningP95LatencyMs: number;
  criticalP95LatencyMs: number;
  warningErrorRate: number;
  criticalErrorRate: number;
};

export type AppSettings = {
  environment: "DEMO" | "PROD_SIM";
  globalTimeRange: "15m" | "1h" | "24h";
  piiMaskingEnabled: boolean;
  monitorLookbackMinutes: number;
  slaThresholds: SLAThresholds;
};

function resolveDefaultMonitorLookback(): number {
  const envValue = Number(process.env.MONITOR_LOOKBACK_MINUTES ?? 15);
  if (!Number.isFinite(envValue)) {
    return 15;
  }
  return Math.min(Math.max(Math.floor(envValue), 1), 240);
}

export const defaultAppSettings: AppSettings = {
  environment: "DEMO",
  globalTimeRange: "1h",
  piiMaskingEnabled: true,
  monitorLookbackMinutes: resolveDefaultMonitorLookback(),
  slaThresholds: {
    targetP95LatencyMs: 500,
    warningP95LatencyMs: 700,
    criticalP95LatencyMs: 1200,
    warningErrorRate: 2,
    criticalErrorRate: 5
  }
};

const settings: AppSettings = structuredClone(defaultAppSettings);
const stateDir = path.join(process.cwd(), ".runtime");
const settingsFilePath = path.join(stateDir, "app-settings.json");

function persistSettings(): void {
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), "utf-8");
}

function hydrateSettings(): void {
  if (!existsSync(settingsFilePath)) {
    persistSettings();
    return;
  }
  try {
    const raw = readFileSync(settingsFilePath, "utf-8");
    const parsed = JSON.parse(raw) as AppSettings;
    settings.environment = parsed.environment ?? defaultAppSettings.environment;
    settings.globalTimeRange = parsed.globalTimeRange ?? defaultAppSettings.globalTimeRange;
    settings.piiMaskingEnabled = parsed.piiMaskingEnabled ?? defaultAppSettings.piiMaskingEnabled;
    settings.monitorLookbackMinutes =
      parsed.monitorLookbackMinutes ?? defaultAppSettings.monitorLookbackMinutes;
    settings.slaThresholds = {
      ...defaultAppSettings.slaThresholds,
      ...parsed.slaThresholds
    };
  } catch {
    persistSettings();
  }
}

hydrateSettings();

export function getAppSettings(): AppSettings {
  return settings;
}

type AppSettingsUpdate = {
  environment?: "DEMO" | "PROD_SIM";
  globalTimeRange?: "15m" | "1h" | "24h";
  piiMaskingEnabled?: boolean;
  monitorLookbackMinutes?: number;
  slaThresholds?: Partial<SLAThresholds>;
};

export function updateAppSettings(partial: AppSettingsUpdate): AppSettings {
  if (partial.environment) {
    settings.environment = partial.environment;
  }
  if (partial.globalTimeRange) {
    settings.globalTimeRange = partial.globalTimeRange;
  }
  if (typeof partial.piiMaskingEnabled === "boolean") {
    settings.piiMaskingEnabled = partial.piiMaskingEnabled;
  }
  if (typeof partial.monitorLookbackMinutes === "number" && Number.isFinite(partial.monitorLookbackMinutes)) {
    settings.monitorLookbackMinutes = Math.min(Math.max(Math.floor(partial.monitorLookbackMinutes), 1), 240);
  }
  if (partial.slaThresholds) {
    settings.slaThresholds = {
      ...settings.slaThresholds,
      ...partial.slaThresholds
    };
  }
  persistSettings();
  return settings;
}

export function resetAppSettings(): AppSettings {
  settings.environment = defaultAppSettings.environment;
  settings.globalTimeRange = defaultAppSettings.globalTimeRange;
  settings.piiMaskingEnabled = defaultAppSettings.piiMaskingEnabled;
  settings.monitorLookbackMinutes = defaultAppSettings.monitorLookbackMinutes;
  settings.slaThresholds = { ...defaultAppSettings.slaThresholds };
  persistSettings();
  return settings;
}
