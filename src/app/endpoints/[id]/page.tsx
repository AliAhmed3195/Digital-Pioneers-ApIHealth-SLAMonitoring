"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StatusChip } from "@/shared/ui/StatusChip";
import type { RiskLevel } from "@/shared/contracts/core";

type EndpointsResponse = {
  endpoints: Array<{
    endpoint: string;
    metrics: {
      from: string;
      to: string;
      requestCount: number;
      errorRate: number;
      p95LatencyMs: number;
      p99LatencyMs: number;
    };
    assessment: {
      level: RiskLevel;
      score: number;
      reasons: string[];
    };
  }>;
};

export default function EndpointDetailPage() {
  const params = useParams<{ id: string }>();
  const endpointId = decodeURIComponent(params.id);
  const [row, setRow] = useState<EndpointsResponse["endpoints"][number] | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/endpoints", { cache: "no-store" });
      const data = (await res.json()) as EndpointsResponse;
      setRow(data.endpoints.find((item) => item.endpoint === endpointId) ?? null);
    }
    void load();
  }, [endpointId]);

  return (
    <main className="page">
      <h1>Endpoint Details</h1>
      <p className="muted">{endpointId}</p>
      {!row ? (
        <p className="muted">Endpoint data not available yet.</p>
      ) : (
        <>
          <section className="card-grid">
            <article className="card">
              <div className="muted">Requests</div>
              <div className="kpi-value">{row.metrics.requestCount}</div>
            </article>
            <article className="card">
              <div className="muted">Error %</div>
              <div className="kpi-value">{row.metrics.errorRate}</div>
            </article>
            <article className="card">
              <div className="muted">p95 latency</div>
              <div className="kpi-value">{row.metrics.p95LatencyMs}ms</div>
            </article>
            <article className="card">
              <div className="muted">Risk</div>
              <div className="status-text">
                <StatusChip level={row.assessment.level} />
              </div>
            </article>
          </section>
          <section className="card">
            <h3 className="section-title">Risk Reasons</h3>
            <ul>
              {row.assessment.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
