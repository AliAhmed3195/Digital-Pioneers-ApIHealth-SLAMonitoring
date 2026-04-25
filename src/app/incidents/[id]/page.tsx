"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StatusChip } from "@/shared/ui/StatusChip";
import type { RiskLevel } from "@/shared/contracts/core";
import { InlineSpinner, useToast } from "@/shared/ui/ToastProvider";

type IncidentResponse = {
  incident: {
    id: string;
    endpoint: string;
    title: string;
    status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
    riskLevel: RiskLevel;
    riskScore: number;
    reasons: string[];
    createdAt: string;
    updatedAt: string;
  };
};

export default function IncidentDetailPage() {
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const [incident, setIncident] = useState<IncidentResponse["incident"] | null>(null);
  const [error, setError] = useState<string>("");
  const [reportState, setReportState] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/incidents/${params.id}`, { cache: "no-store" });
      if (!res.ok) {
        setError("Incident not found.");
        return;
      }
      const data = (await res.json()) as IncidentResponse;
      setIncident(data.incident);
    }
    void load();
  }, [params.id]);

  return (
    <main className="page">
      <h1>Incident Details</h1>
      {error ? <p className="muted">{error}</p> : null}
      {!incident ? <InlineSpinner label="Loading incident details..." /> : (
        <>
          <section className="card-grid">
            <article className="card">
              <div className="muted">Incident ID</div>
              <div>{incident.id}</div>
            </article>
            <article className="card">
              <div className="muted">Endpoint</div>
              <div>{incident.endpoint}</div>
            </article>
            <article className="card">
              <div className="muted">Risk</div>
              <div className="status-text">
                <StatusChip level={incident.riskLevel} />
              </div>
            </article>
            <article className="card">
              <div className="muted">Risk Score</div>
              <div className="kpi-value">{incident.riskScore}</div>
            </article>
          </section>

          <section className="card">
            <h3 className="section-title">{incident.title}</h3>
            <p className="muted">Status: {incident.status}</p>
            <p className="muted">Created: {new Date(incident.createdAt).toLocaleString()}</p>
            <p className="muted">Updated: {new Date(incident.updatedAt).toLocaleString()}</p>
            <div className="button-row">
              <button
                className="btn btn-primary"
                disabled={isGenerating}
                onClick={async () => {
                  setIsGenerating(true);
                  setReportState("Generating report...");
                  try {
                    const res = await fetch("/api/reports/generate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ incidentId: incident.id })
                    });
                    if (!res.ok) {
                      setReportState("Failed to generate report.");
                      toast.error("Failed to generate report.");
                      return;
                    }
                    setReportState("Report generated. Open AI Reports page.");
                    toast.success("Incident report generated.");
                  } catch {
                    setReportState("Failed to generate report.");
                    toast.error("Failed to generate report.");
                  } finally {
                    setIsGenerating(false);
                  }
                }}
              >
                {isGenerating ? "Generating..." : "Generate Report"}
              </button>
              <a className="btn" href="/ai-reports">
                Open AI Reports
              </a>
            </div>
            {reportState ? <p className="muted">{reportState}</p> : null}
            <h4 className="section-title">Evidence/Reasons</h4>
            <ul>
              {incident.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
