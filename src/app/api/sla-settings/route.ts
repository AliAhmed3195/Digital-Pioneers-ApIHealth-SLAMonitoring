import {
  getAppSettings,
  resetAppSettings,
  updateAppSettings
} from "@/modules/settings/application/AppSettingsStore";

type UpdateSettingsPayload = {
  globalTimeRange?: "15m" | "1h" | "24h";
  monitorLookbackMinutes?: number;
  slaThresholds?: {
    targetP95LatencyMs?: number;
    warningP95LatencyMs?: number;
    criticalP95LatencyMs?: number;
    warningErrorRate?: number;
    criticalErrorRate?: number;
  };
  resetToDefault?: boolean;
};

export async function GET(): Promise<Response> {
  return Response.json({ settings: getAppSettings() });
}

function validateThresholds(payload: UpdateSettingsPayload): string[] {
  const errors: string[] = [];
  const next = payload.slaThresholds;
  if (!next) {
    return errors;
  }

  const numericPairs: Array<[string, number | undefined]> = [
    ["targetP95LatencyMs", next.targetP95LatencyMs],
    ["warningP95LatencyMs", next.warningP95LatencyMs],
    ["criticalP95LatencyMs", next.criticalP95LatencyMs],
    ["warningErrorRate", next.warningErrorRate],
    ["criticalErrorRate", next.criticalErrorRate]
  ];
  for (const [name, value] of numericPairs) {
    if (typeof value !== "undefined" && (!Number.isFinite(value) || value < 0)) {
      errors.push(`${name} must be a non-negative number.`);
    }
  }

  const current = getAppSettings().slaThresholds;
  const merged = { ...current, ...next };
  if (merged.targetP95LatencyMs > merged.warningP95LatencyMs) {
    errors.push("targetP95LatencyMs must be <= warningP95LatencyMs.");
  }
  if (merged.warningP95LatencyMs > merged.criticalP95LatencyMs) {
    errors.push("warningP95LatencyMs must be <= criticalP95LatencyMs.");
  }
  if (merged.warningErrorRate > merged.criticalErrorRate) {
    errors.push("warningErrorRate must be <= criticalErrorRate.");
  }

  return errors;
}

function validateMonitorLookback(payload: UpdateSettingsPayload): string[] {
  const errors: string[] = [];
  if (typeof payload.monitorLookbackMinutes === "undefined") {
    return errors;
  }
  if (!Number.isFinite(payload.monitorLookbackMinutes)) {
    errors.push("monitorLookbackMinutes must be a valid number.");
    return errors;
  }
  if (payload.monitorLookbackMinutes < 1 || payload.monitorLookbackMinutes > 240) {
    errors.push("monitorLookbackMinutes must be between 1 and 240 minutes.");
  }
  return errors;
}

export async function PUT(request: Request): Promise<Response> {
  const payload = (await request.json()) as UpdateSettingsPayload;
  if (payload.resetToDefault) {
    const settings = resetAppSettings();
    return Response.json({ settings, message: "Settings reset to defaults." });
  }

  const validationErrors = validateThresholds(payload);
  const lookbackErrors = validateMonitorLookback(payload);
  const errors = [...validationErrors, ...lookbackErrors];
  if (errors.length > 0) {
    return Response.json({ error: "Invalid SLA settings.", details: errors }, { status: 400 });
  }

  const settings = updateAppSettings({
    globalTimeRange: payload.globalTimeRange,
    monitorLookbackMinutes: payload.monitorLookbackMinutes,
    slaThresholds: payload.slaThresholds
  });
  return Response.json({ settings });
}
