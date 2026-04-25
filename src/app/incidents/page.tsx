"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusChip } from "@/shared/ui/StatusChip";
import { PaginationControls } from "@/shared/ui/PaginationControls";
import type { RiskLevel } from "@/shared/contracts/core";

type IncidentsResponse = {
  incidents: Array<{
    id: string;
    endpoint: string;
    title: string;
    status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
    riskLevel: RiskLevel;
    riskScore: number;
    updatedAt: string;
  }>;
};

function statusClass(status: IncidentsResponse["incidents"][number]["status"]): string {
  if (status === "RESOLVED") {
    return "chip-green-soft";
  }
  if (status === "ACKNOWLEDGED") {
    return "chip-orange-soft";
  }
  return "chip-red-soft";
}

type StatusFilter = "ALL" | "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
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

export default function IncidentsPage() {
  const [rows, setRows] = useState<IncidentsResponse["incidents"]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function loadIncidents() {
    setLoading(true);
    try {
      const res = await fetch("/api/incidents", { cache: "no-store" });
      const data = (await res.json()) as IncidentsResponse;
      setRows(data.incidents);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadIncidents();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (
        searchTerm &&
        !`${row.id} ${row.endpoint} ${row.title}`.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (riskFilter !== "ALL" && row.riskLevel !== riskFilter) return false;
      const inferredType = inferType(row.endpoint);
      const inferredChannel = inferChannel(row.endpoint);
      if (typeFilter !== "ALL" && inferredType !== typeFilter) return false;
      if (channelFilter !== "ALL" && inferredChannel !== channelFilter) return false;

      const updatedAtMs = Date.parse(row.updatedAt);
      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`).getTime();
        if (updatedAtMs < from) return false;
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59`).getTime();
        if (updatedAtMs > to) return false;
      }
      return true;
    });
  }, [rows, searchTerm, statusFilter, riskFilter, typeFilter, channelFilter, fromDate, toDate]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, statusFilter, riskFilter, channelFilter, fromDate, toDate, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
      <h1>Incidents</h1>
      <p className="muted">Detected incidents with lifecycle and risk context.</p>
      <section className="filter-bar">
        <div className="filter-row">
          <input
            className="input input-wide"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by incident ID, endpoint, or title..."
          />
          <select className="input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="ALL">All Types</option>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
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
          <button className="btn btn-secondary" onClick={() => void loadIncidents()} disabled={loading}>
            Refresh
          </button>
          <button
            className="btn"
            onClick={() => {
              setSearchTerm("");
              setTypeFilter("ALL");
              setStatusFilter("ALL");
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
          <h3 className="section-title">Incident Queue</h3>
          <span className="chip-soft chip-gray-soft">{filteredRows.length} results</span>
        </div>
        {loading ? (
          <div className="upload-loader">
            <span className="spinner" />
            <p className="status-text">Loading incidents...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <p className="muted">No incidents match active filters.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Endpoint</th>
                    <th>Risk</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>
                        <span className="chip-soft chip-purple">{row.endpoint}</span>
                      </td>
                      <td>
                        <StatusChip level={row.riskLevel} />
                      </td>
                      <td>{row.riskScore}</td>
                      <td>
                        <span className={`chip-soft ${statusClass(row.status)}`}>{row.status}</span>
                      </td>
                      <td>{new Date(row.updatedAt).toLocaleString()}</td>
                      <td>
                        <Link className="btn btn-ghost" href={`/incidents/${row.id}`}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              totalItems={filteredRows.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </section>
    </main>
  );
}
