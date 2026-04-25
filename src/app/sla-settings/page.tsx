"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/shared/ui/ToastProvider";

type SettingsResponse = {
  settings: {
    globalTimeRange: "15m" | "1h" | "24h";
    monitorLookbackMinutes: number;
    slaThresholds: {
      targetP95LatencyMs: number;
      warningP95LatencyMs: number;
      criticalP95LatencyMs: number;
      warningErrorRate: number;
      criticalErrorRate: number;
    };
  };
};

export default function SLASettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<SettingsResponse["settings"] | null>(null);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<{
    globalTimeRange: "15m" | "1h" | "24h";
    endpointCount: number;
    atRiskEndpoints: number;
    activeIncidents: number;
    riskSummary: { green: number; amber: number; red: number };
  } | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/sla-settings", { cache: "no-store" });
      const data = (await res.json()) as SettingsResponse;
      setSettings(data.settings);
    }
    void load();
  }, []);

  const validationErrors = useMemo(() => {
    if (!settings) return [];
    const errors: string[] = [];
    if (settings.slaThresholds.targetP95LatencyMs > settings.slaThresholds.warningP95LatencyMs) {
      errors.push("Target p95 latency must be less than or equal to warning p95 latency.");
    }
    if (settings.slaThresholds.warningP95LatencyMs > settings.slaThresholds.criticalP95LatencyMs) {
      errors.push("Warning p95 latency must be less than or equal to critical p95 latency.");
    }
    if (settings.slaThresholds.warningErrorRate > settings.slaThresholds.criticalErrorRate) {
      errors.push("Warning error rate must be less than or equal to critical error rate.");
    }
    return errors;
  }, [settings]);

  async function save() {
    if (!settings) {
      return;
    }
    if (validationErrors.length > 0) {
      setStatus("Fix validation errors before saving.");
      return;
    }
    setStatus("Saving settings...");
    setIsSaving(true);
    try {
      const res = await fetch("/api/sla-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          globalTimeRange: settings.globalTimeRange,
          monitorLookbackMinutes: settings.monitorLookbackMinutes,
          slaThresholds: settings.slaThresholds
        })
      });
      const payload = (await res.json()) as { error?: string; details?: string[] };
      if (!res.ok) {
        setStatus(payload.details?.join(" ") || payload.error || "Failed to save settings.");
        toast.error(payload.details?.join(" ") || payload.error || "Failed to save settings.");
        return;
      }
      setStatus("SLA settings saved successfully.");
      toast.success("SLA settings saved successfully.");
    } finally {
      setIsSaving(false);
    }
  }

  async function previewImpact() {
    if (!settings) return;
    if (validationErrors.length > 0) {
      setStatus("Fix validation errors before preview.");
      return;
    }
    setIsPreviewing(true);
    setStatus("Running preview...");
    try {
      const res = await fetch("/api/sla-settings/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          globalTimeRange: settings.globalTimeRange,
          monitorLookbackMinutes: settings.monitorLookbackMinutes,
          slaThresholds: settings.slaThresholds
        })
      });
      const data = (await res.json()) as { preview?: typeof preview };
      if (!res.ok || !data.preview) {
        setStatus("Unable to generate preview.");
        toast.error("Unable to generate preview.");
        return;
      }
      setPreview(data.preview);
      setStatus("Preview updated.");
      toast.success("Preview updated.");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function resetDefaults() {
    setStatus("Resetting to defaults...");
    const res = await fetch("/api/sla-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToDefault: true })
    });
    const data = (await res.json()) as SettingsResponse;
    if (!res.ok) {
      setStatus("Failed to reset defaults.");
      toast.error("Failed to reset defaults.");
      return;
    }
    setSettings(data.settings);
    setPreview(null);
    setStatus("Defaults restored.");
    toast.info("SLA settings reset to defaults.");
  }

  if (!settings) {
    return (
      <main className="page">
        <h1>SLA/SLO Settings</h1>
        <p className="muted">Loading settings...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>SLA/SLO Settings</h1>
      <p className="muted">Configure global time range and risk thresholds used by detection.</p>
      <section className="card">
        <p className="muted">
          These settings control how risk is computed across logs. Lower thresholds increase sensitivity
          and incident volume; higher thresholds reduce alert noise.
        </p>
      </section>

      <section className="card">
        <h3 className="section-title">Global Window</h3>
        <div className="button-row">
          <select
            className="input"
            value={settings.globalTimeRange}
            onChange={(event) =>
              setSettings({
                ...settings,
                globalTimeRange: event.target.value as "15m" | "1h" | "24h"
              })
            }
          >
            <option value="15m">Last 15m</option>
            <option value="1h">Last 1h</option>
            <option value="24h">Last 24h</option>
          </select>
          <input
            className="input"
            type="number"
            min={1}
            max={240}
            value={settings.monitorLookbackMinutes}
            onChange={(event) =>
              setSettings({
                ...settings,
                monitorLookbackMinutes: Number(event.target.value)
              })
            }
            placeholder="Monitor lookback (minutes)"
          />
        </div>
        <p className="muted">Monitor cycle ingests this many recent minutes of logs each run.</p>
      </section>

      <section className="card-grid">
        <article className="card">
          <h3 className="section-title">Latency Thresholds (ms)</h3>
          <div className="button-row">
            <input
              className="input"
              type="number"
              value={settings.slaThresholds.targetP95LatencyMs}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  slaThresholds: {
                    ...settings.slaThresholds,
                    targetP95LatencyMs: Number(event.target.value)
                  }
                })
              }
              placeholder="Target p95"
            />
            <input
              className="input"
              type="number"
              value={settings.slaThresholds.warningP95LatencyMs}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  slaThresholds: {
                    ...settings.slaThresholds,
                    warningP95LatencyMs: Number(event.target.value)
                  }
                })
              }
              placeholder="Warning p95"
            />
            <input
              className="input"
              type="number"
              value={settings.slaThresholds.criticalP95LatencyMs}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  slaThresholds: {
                    ...settings.slaThresholds,
                    criticalP95LatencyMs: Number(event.target.value)
                  }
                })
              }
              placeholder="Critical p95"
            />
          </div>
        </article>

        <article className="card">
          <h3 className="section-title">Error Rate Thresholds (%)</h3>
          <div className="button-row">
            <input
              className="input"
              type="number"
              step="0.1"
              value={settings.slaThresholds.warningErrorRate}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  slaThresholds: {
                    ...settings.slaThresholds,
                    warningErrorRate: Number(event.target.value)
                  }
                })
              }
              placeholder="Warning error rate"
            />
            <input
              className="input"
              type="number"
              step="0.1"
              value={settings.slaThresholds.criticalErrorRate}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  slaThresholds: {
                    ...settings.slaThresholds,
                    criticalErrorRate: Number(event.target.value)
                  }
                })
              }
              placeholder="Critical error rate"
            />
          </div>
        </article>
      </section>

      {validationErrors.length > 0 ? (
        <section className="card">
          <h3 className="section-title">Validation Checks</h3>
          {validationErrors.map((error) => (
            <p key={error} className="muted">
              - {error}
            </p>
          ))}
        </section>
      ) : null}

      {preview ? (
        <section className="card-grid">
          <article className="card">
            <div className="muted">Preview Window</div>
            <div className="scenario-value">{preview.globalTimeRange}</div>
          </article>
          <article className="card">
            <div className="muted">Endpoints Considered</div>
            <div className="kpi-value">{preview.endpointCount}</div>
          </article>
          <article className="card">
            <div className="muted">At-Risk Endpoints</div>
            <div className="kpi-value">{preview.atRiskEndpoints}</div>
          </article>
          <article className="card">
            <div className="muted">Active Incidents</div>
            <div className="kpi-value">{preview.activeIncidents}</div>
          </article>
          <article className="card">
            <div className="muted">Risk Mix (G/A/R)</div>
            <div className="scenario-value">
              {preview.riskSummary.green} / {preview.riskSummary.amber} / {preview.riskSummary.red}
            </div>
          </article>
        </section>
      ) : null}

      <section className="card">
        <div className="button-row">
          <button className="btn btn-secondary" onClick={() => void previewImpact()} disabled={isPreviewing || isSaving}>
            {isPreviewing ? "Previewing..." : "Preview Impact"}
          </button>
          <button className="btn btn-primary" onClick={() => void save()} disabled={isSaving || isPreviewing}>
            {isSaving ? "Saving..." : "Save SLA Settings"}
          </button>
          <button className="btn" onClick={() => void resetDefaults()} disabled={isSaving || isPreviewing}>
            Reset Defaults
          </button>
          {status ? <p className="muted">{status}</p> : null}
        </div>
      </section>
    </main>
  );
}
