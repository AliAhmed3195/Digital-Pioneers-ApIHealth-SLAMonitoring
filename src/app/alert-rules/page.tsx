"use client";

import { useEffect, useState } from "react";
import { InlineSpinner, useToast } from "@/shared/ui/ToastProvider";

type AlertRule = {
  id: string;
  name: string;
  endpoint: string;
  maxP95LatencyMs: number;
  maxErrorRate: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  enabled: boolean;
};

export default function AlertRulesPage() {
  const toast = useToast();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [name, setName] = useState("Custom latency rule");
  const [endpoint, setEndpoint] = useState("/payments");
  const [loading, setLoading] = useState(true);

  async function loadRules() {
    setLoading(true);
    const res = await fetch("/api/alert-rules", { cache: "no-store" });
    const data = (await res.json()) as { rules: AlertRule[] };
    setRules(data.rules);
    setLoading(false);
  }

  useEffect(() => {
    void loadRules();
  }, []);

  async function createRule() {
    const res = await fetch("/api/alert-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        endpoint,
        maxP95LatencyMs: 850,
        maxErrorRate: 2.0,
        severity: "MEDIUM"
      })
    });
    if (res.ok) {
      toast.success("Alert rule created.");
    } else {
      toast.error("Failed to create alert rule.");
    }
    await loadRules();
  }

  return (
    <main className="page">
      <h1>Alert Rules</h1>
      <p className="muted">Manage threshold-based rules with severity and endpoint scope.</p>

      <section className="card">
        <h3>Create Rule</h3>
        <div className="button-row">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input"
          />
          <input
            value={endpoint}
            onChange={(event) => setEndpoint(event.target.value)}
            className="input"
          />
          <button className="btn btn-primary" onClick={createRule}>
            Add Rule
          </button>
        </div>
      </section>

      <section className="table-wrap">
        {loading ? <InlineSpinner label="Loading alert rules..." /> : null}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Endpoint</th>
              <th>Max p95</th>
              <th>Max Error %</th>
              <th>Severity</th>
              <th>Enabled</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td>{rule.name}</td>
                <td>
                  <span className="chip-soft chip-blue">{rule.endpoint}</span>
                </td>
                <td>{rule.maxP95LatencyMs}</td>
                <td>{rule.maxErrorRate}</td>
                <td>
                  <span
                    className={`chip-soft ${
                      rule.severity === "HIGH"
                        ? "chip-red-soft"
                        : rule.severity === "MEDIUM"
                          ? "chip-orange-soft"
                          : "chip-green-soft"
                    }`}
                  >
                    {rule.severity}
                  </span>
                </td>
                <td>
                  <span className={`chip-soft ${rule.enabled ? "chip-green-soft" : "chip-gray-soft"}`}>
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
