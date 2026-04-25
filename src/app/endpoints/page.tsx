"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusChip } from "@/shared/ui/StatusChip";
import type { RiskLevel } from "@/shared/contracts/core";

type EndpointsResponse = {
  endpoints: Array<{
    endpoint: string;
    updatedAt: string | null;
    metrics: {
      requestCount: number;
      errorRate: number;
      p95LatencyMs: number;
    };
    assessment: {
      level: RiskLevel;
      score: number;
      reasons: string[];
    };
  }>;
};

type RiskFilter = "ALL" | RiskLevel;

function inferChannel(endpoint: string): string {
  const segment = endpoint.split("/").filter(Boolean)[0];
  return (segment ?? "general").toUpperCase();
}

function inferType(endpoint: string): string {
  const normalized = endpoint.toLowerCase();
  if (/(validate|auth|token|login|session)/.test(normalized)) return "AUTH";
  if (/(get|list|fetch|view)/.test(normalized)) return "READ";
  if (/(create|update|delete|process|pay|transfer|submit)/.test(normalized)) return "WRITE";
  return "OTHER";
}

export default function EndpointsPage() {
  const [rows, setRows] = useState<EndpointsResponse["endpoints"]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function loadEndpoints() {
    setLoading(true);
    try {
      const res = await fetch("/api/endpoints", { cache: "no-store" });
      const data = (await res.json()) as EndpointsResponse;
      setRows(data.endpoints);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEndpoints();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (
        searchTerm &&
        !`${row.endpoint} ${row.assessment.level}`.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      const inferredType = inferType(row.endpoint);
      const inferredChannel = inferChannel(row.endpoint);
      if (typeFilter !== "ALL" && inferredType !== typeFilter) return false;
      if (riskFilter !== "ALL" && row.assessment.level !== riskFilter) return false;
      if (channelFilter !== "ALL" && inferredChannel !== channelFilter) return false;

      const updatedAtMs = row.updatedAt ? Date.parse(row.updatedAt) : Number.NaN;
      if (fromDate && Number.isFinite(updatedAtMs)) {
        const from = new Date(`${fromDate}T00:00:00`).getTime();
        if (updatedAtMs < from) return false;
      }
      if (toDate && Number.isFinite(updatedAtMs)) {
        const to = new Date(`${toDate}T23:59:59`).getTime();
        if (updatedAtMs > to) return false;
      }
      return true;
    });
  }, [rows, searchTerm, typeFilter, riskFilter, channelFilter, fromDate, toDate]);

  const typeOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => inferType(row.endpoint)))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );
  const channelOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => inferChannel(row.endpoint)))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  return (
    <main className="page">
      <h1>Endpoints</h1>
      <p className="muted">Endpoint health metrics and SLA risk levels.</p>
      <section className="filter-bar">
        <div className="filter-row">
          <input
            className="input input-wide"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by endpoint or risk level..."
          />
          <select className="input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="ALL">All Types</option>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select className="input" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}>
            <option value="ALL">All Risk</option>
            <option value="GREEN">Green</option>
            <option value="AMBER">Amber</option>
            <option value="RED">Red</option>
          </select>
          <select className="input" value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}>
            <option value="ALL">All Channels</option>
            {channelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input className="input" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <input className="input" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          <button className="btn btn-secondary" onClick={() => void loadEndpoints()} disabled={loading}>
            Refresh
          </button>
          <button
            className="btn"
            onClick={() => {
              setSearchTerm("");
              setTypeFilter("ALL");
              setRiskFilter("ALL");
              setChannelFilter("ALL");
              setFromDate("");
              setToDate("");
            }}
          >
            Reset Filters
          </button>
        </div>
      </section>
      <section className="card">
        <div className="button-row">
          <h3 className="section-title">Endpoint Inventory</h3>
          <span className="chip-soft chip-gray-soft">{filteredRows.length} results</span>
        </div>
        {loading ? (
          <div className="upload-loader">
            <span className="spinner" />
            <p className="status-text">Loading endpoints...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <p className="muted">No endpoints match active filters.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Requests</th>
                  <th>Error %</th>
                  <th>p95 (ms)</th>
                  <th>Risk</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.endpoint}>
                    <td>
                      <span className="chip-soft chip-blue">{row.endpoint}</span>
                    </td>
                    <td>{row.metrics.requestCount}</td>
                    <td>{row.metrics.errorRate}</td>
                    <td>{row.metrics.p95LatencyMs}</td>
                    <td>
                      <StatusChip level={row.assessment.level} />
                    </td>
                    <td>
                      <Link className="btn btn-ghost" href={`/endpoints/${encodeURIComponent(row.endpoint)}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
