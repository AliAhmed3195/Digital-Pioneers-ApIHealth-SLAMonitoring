"use client";

import { useEffect, useState } from "react";
import { InlineSpinner, useToast } from "@/shared/ui/ToastProvider";

type AdminDataResponse = {
  sourceStatus: "CONNECTED" | "IDLE";
  activeScenario: string | null;
  updatedAt: string | null;
  quality: {
    totalLogs: number;
    missingRequestIds: number;
    errorLogs: number;
    droppedLogs: number;
  };
  piiMaskingEnabled: boolean;
  environment: "DEMO" | "PROD_SIM";
};

export default function AdminDataPage() {
  const toast = useToast();
  const [data, setData] = useState<AdminDataResponse | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/data", { cache: "no-store" });
    const payload = (await res.json()) as AdminDataResponse;
    setData(payload);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateAdminSettings(partial: {
    environment?: "DEMO" | "PROD_SIM";
    piiMaskingEnabled?: boolean;
  }) {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial)
    });
    setStatus(res.ok ? "Admin settings updated." : "Failed to update settings.");
    if (res.ok) {
      toast.success("Admin settings updated.");
    } else {
      toast.error("Failed to update admin settings.");
    }
    await load();
  }

  if (!data || loading) {
    return (
      <main className="page">
        <h1>Admin/Data</h1>
        <InlineSpinner label="Loading admin diagnostics..." />
      </main>
    );
  }

  return (
    <main className="page">
      <h1>Admin/Data</h1>
      <p className="muted">Data quality, source health, and environment controls.</p>

      <section className="card-grid">
        <article className="card">
          <div className="muted">Source Status</div>
          <div className="kpi-value">
            <span className={`chip-soft ${data.sourceStatus === "CONNECTED" ? "chip-green-soft" : "chip-gray-soft"}`}>
              {data.sourceStatus}
            </span>
          </div>
        </article>
        <article className="card">
          <div className="muted">Active Scenario</div>
          <div className="kpi-value">
            <span className="chip-soft chip-blue">{data.activeScenario ?? "None"}</span>
          </div>
        </article>
        <article className="card">
          <div className="muted">Total Logs</div>
          <div className="kpi-value">{data.quality.totalLogs}</div>
        </article>
        <article className="card">
          <div className="muted">Missing Request IDs</div>
          <div className="kpi-value">{data.quality.missingRequestIds}</div>
        </article>
      </section>

      <section className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Error Logs (5xx)</td>
              <td>{data.quality.errorLogs}</td>
            </tr>
            <tr>
              <td>Dropped Logs</td>
              <td>{data.quality.droppedLogs}</td>
            </tr>
            <tr>
              <td>Last Updated</td>
              <td>{data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "N/A"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3 className="section-title">Admin Controls</h3>
        <div className="button-row">
          <select
            className="input"
            value={data.environment}
            onChange={(event) =>
              void updateAdminSettings({
                environment: event.target.value as "DEMO" | "PROD_SIM"
              })
            }
          >
            <option value="DEMO">Demo</option>
            <option value="PROD_SIM">Prod-sim</option>
          </select>
          <button
            className="btn"
            onClick={() =>
              void updateAdminSettings({
                piiMaskingEnabled: !data.piiMaskingEnabled
              })
            }
          >
            PII Masking: {data.piiMaskingEnabled ? "ON" : "OFF"}
          </button>
          {status ? <p className="muted">{status}</p> : null}
        </div>
      </section>
    </main>
  );
}
