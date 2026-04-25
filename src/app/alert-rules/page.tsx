"use client";

import { useEffect, useState } from "react";
import { InlineSpinner, useToast } from "@/shared/ui/ToastProvider";
import { PaginationControls } from "@/shared/ui/PaginationControls";

type AlertRule = {
  id: string;
  name: string;
  endpoint: string;
  maxP95LatencyMs: number;
  maxErrorRate: number;
  cooldownMinutes: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  enabled: boolean;
};

export default function AlertRulesPage() {
  const toast = useToast();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [name, setName] = useState("Custom latency rule");
  const [endpoint, setEndpoint] = useState("/payments");
  const [maxP95LatencyMs, setMaxP95LatencyMs] = useState(850);
  const [maxErrorRate, setMaxErrorRate] = useState(2);
  const [cooldownMinutes, setCooldownMinutes] = useState(5);
  const [severity, setSeverity] = useState<AlertRule["severity"]>("MEDIUM");
  const [loading, setLoading] = useState(true);
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    if (!name.trim() || !endpoint.trim()) {
      toast.error("Rule name and endpoint are required.");
      return;
    }
    const res = await fetch("/api/alert-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        endpoint: endpoint.trim(),
        maxP95LatencyMs,
        maxErrorRate,
        cooldownMinutes,
        severity
      })
    });
    if (res.ok) {
      toast.success("Alert rule created.");
      setName("Custom latency rule");
      setEndpoint("/payments");
      setMaxP95LatencyMs(850);
      setMaxErrorRate(2);
      setCooldownMinutes(5);
      setSeverity("MEDIUM");
    } else {
      const payload = (await res.json()) as { error?: string };
      toast.error(payload.error ?? "Failed to create alert rule.");
    }
    await loadRules();
  }

  async function toggleRule(rule: AlertRule) {
    setSavingRuleId(rule.id);
    try {
      const res = await fetch(`/api/alert-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !rule.enabled })
      });
      if (res.ok) {
        toast.success(`Rule ${rule.enabled ? "disabled" : "enabled"}.`);
        await loadRules();
      } else {
        const payload = (await res.json()) as { error?: string };
        toast.error(payload.error ?? "Failed to update rule.");
      }
    } finally {
      setSavingRuleId(null);
    }
  }

  async function saveEditedRule() {
    if (!editingRule) return;
    setSavingRuleId(editingRule.id);
    try {
      const res = await fetch(`/api/alert-rules/${editingRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingRule.name,
          endpoint: editingRule.endpoint,
          maxP95LatencyMs: editingRule.maxP95LatencyMs,
          maxErrorRate: editingRule.maxErrorRate,
          cooldownMinutes: editingRule.cooldownMinutes,
          severity: editingRule.severity,
          enabled: editingRule.enabled
        })
      });
      if (res.ok) {
        toast.success("Rule updated.");
        setEditingRule(null);
        await loadRules();
      } else {
        const payload = (await res.json()) as { error?: string };
        toast.error(payload.error ?? "Failed to update rule.");
      }
    } finally {
      setSavingRuleId(null);
    }
  }

  async function deleteRule(ruleId: string) {
    setDeletingRuleId(ruleId);
    try {
      const res = await fetch(`/api/alert-rules/${ruleId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Rule deleted.");
        await loadRules();
      } else {
        const payload = (await res.json()) as { error?: string };
        toast.error(payload.error ?? "Failed to delete rule.");
      }
    } finally {
      setDeletingRuleId(null);
    }
  }
  const totalPages = Math.max(1, Math.ceil(rules.length / pageSize));
  const paginatedRules = rules.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
          <input
            value={maxP95LatencyMs}
            onChange={(event) => setMaxP95LatencyMs(Number(event.target.value))}
            className="input"
            type="number"
            min={1}
            max={60000}
            step={1}
            aria-label="Max p95 latency in milliseconds"
          />
          <input
            value={maxErrorRate}
            onChange={(event) => setMaxErrorRate(Number(event.target.value))}
            className="input"
            type="number"
            min={0}
            max={100}
            step={0.1}
            aria-label="Max error rate percentage"
          />
          <input
            value={cooldownMinutes}
            onChange={(event) => setCooldownMinutes(Number(event.target.value))}
            className="input"
            type="number"
            min={1}
            max={1440}
            step={1}
            aria-label="Cooldown minutes"
          />
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value as AlertRule["severity"])}
            className="input"
            aria-label="Rule severity"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
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
              <th>Cooldown (m)</th>
              <th>Severity</th>
              <th>Enabled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRules.map((rule) => (
              <tr key={rule.id}>
                <td>{rule.name}</td>
                <td>
                  <span className="chip-soft chip-blue">{rule.endpoint}</span>
                </td>
                <td>{rule.maxP95LatencyMs}</td>
                <td>{rule.maxErrorRate}</td>
                <td>{rule.cooldownMinutes}</td>
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
                <td>
                  <div className="button-row">
                    <button
                      className="btn"
                      onClick={() => setEditingRule(rule)}
                      disabled={savingRuleId === rule.id || deletingRuleId === rule.id}
                    >
                      Edit
                    </button>
                    <button
                      className="btn"
                      onClick={() => void toggleRule(rule)}
                      disabled={savingRuleId === rule.id || deletingRuleId === rule.id}
                    >
                      {savingRuleId === rule.id
                        ? "Saving..."
                        : rule.enabled
                          ? "Disable"
                          : "Enable"}
                    </button>
                    <button
                      className="btn"
                      onClick={() => void deleteRule(rule.id)}
                      disabled={savingRuleId === rule.id || deletingRuleId === rule.id}
                    >
                      {deletingRuleId === rule.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <PaginationControls
          totalItems={rules.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      {editingRule ? (
        <section className="card">
          <h3 className="section-title">Edit Rule</h3>
          <div className="button-row">
            <input
              value={editingRule.name}
              onChange={(event) =>
                setEditingRule((prev) => (prev ? { ...prev, name: event.target.value } : prev))
              }
              className="input"
              aria-label="Edit rule name"
            />
            <input
              value={editingRule.endpoint}
              onChange={(event) =>
                setEditingRule((prev) => (prev ? { ...prev, endpoint: event.target.value } : prev))
              }
              className="input"
              aria-label="Edit endpoint"
            />
            <input
              value={editingRule.maxP95LatencyMs}
              onChange={(event) =>
                setEditingRule((prev) =>
                  prev ? { ...prev, maxP95LatencyMs: Number(event.target.value) } : prev
                )
              }
              className="input"
              type="number"
              min={1}
              max={60000}
              step={1}
              aria-label="Edit max p95 latency"
            />
            <input
              value={editingRule.maxErrorRate}
              onChange={(event) =>
                setEditingRule((prev) =>
                  prev ? { ...prev, maxErrorRate: Number(event.target.value) } : prev
                )
              }
              className="input"
              type="number"
              min={0}
              max={100}
              step={0.1}
              aria-label="Edit max error rate"
            />
            <input
              value={editingRule.cooldownMinutes}
              onChange={(event) =>
                setEditingRule((prev) =>
                  prev ? { ...prev, cooldownMinutes: Number(event.target.value) } : prev
                )
              }
              className="input"
              type="number"
              min={1}
              max={1440}
              step={1}
              aria-label="Edit cooldown"
            />
            <select
              value={editingRule.severity}
              onChange={(event) =>
                setEditingRule((prev) =>
                  prev ? { ...prev, severity: event.target.value as AlertRule["severity"] } : prev
                )
              }
              className="input"
              aria-label="Edit severity"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
            <button
              className="btn btn-primary"
              onClick={() => void saveEditedRule()}
              disabled={savingRuleId === editingRule.id}
            >
              {savingRuleId === editingRule.id ? "Saving..." : "Save Changes"}
            </button>
            <button className="btn" onClick={() => setEditingRule(null)}>
              Cancel
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
