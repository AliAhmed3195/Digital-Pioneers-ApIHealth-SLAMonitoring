"use client";

import { useEffect, useMemo, useState } from "react";
import { InlineSpinner, useToast } from "@/shared/ui/ToastProvider";

type ReportRow = {
  id: string;
  incidentId: string;
  incidentTitle: string;
  endpoint: string;
  title: string;
  createdAt: string;
  source: "LLM" | "TEMPLATE";
  markdown: string;
};

type ReportsResponse = {
  reports: ReportRow[];
};

type IncidentOption = {
  id: string;
  endpoint: string;
  title: string;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
};

type IncidentsResponse = {
  incidents: IncidentOption[];
};

export default function AIReportsPage() {
  const toast = useToast();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<ReportRow["source"] | "ALL">("ALL");
  const [endpointFilter, setEndpointFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      const data = (await res.json()) as ReportsResponse;
      setReports(data.reports);
      if (data.reports.length > 0) {
        setSelectedId((current) => current || data.reports[0]?.id || "");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  useEffect(() => {
    async function loadIncidents() {
      const res = await fetch("/api/incidents", { cache: "no-store" });
      const data = (await res.json()) as IncidentsResponse;
      const available = data.incidents.filter((item) => item.status !== "RESOLVED");
      setIncidents(available);
      setSelectedIncidentId((current) => current || available[0]?.id || "");
    }
    void loadIncidents();
  }, []);

  async function generateSelectedReport() {
    if (!selectedIncidentId) {
      setStatusText("Select an incident before generating.");
      return;
    }
    setIsGenerating(true);
    setStatusText("Generating report...");
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId: selectedIncidentId })
      });
      const data = (await res.json()) as { report?: ReportRow; error?: string };
      if (!res.ok || !data.report) {
        setStatusText(data.error ?? "Failed to generate report.");
        toast.error(data.error ?? "Failed to generate report.");
        return;
      }
      setStatusText("Report generated successfully.");
      toast.success("AI report generated.");
      await loadReports();
      setSelectedId(data.report.id);
    } finally {
      setIsGenerating(false);
    }
  }

  const endpointOptions = useMemo(() => {
    return Array.from(new Set(reports.map((item) => item.endpoint))).sort((a, b) => a.localeCompare(b));
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (
        searchTerm &&
        !`${report.title} ${report.incidentId} ${report.incidentTitle} ${report.endpoint}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (sourceFilter !== "ALL" && report.source !== sourceFilter) {
        return false;
      }
      if (endpointFilter !== "ALL" && report.endpoint !== endpointFilter) {
        return false;
      }
      const createdTime = new Date(report.createdAt).getTime();
      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`).getTime();
        if (createdTime < from) {
          return false;
        }
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59`).getTime();
        if (createdTime > to) {
          return false;
        }
      }
      return true;
    });
  }, [reports, searchTerm, sourceFilter, endpointFilter, fromDate, toDate]);

  const selected =
    filteredReports.find((item) => item.id === selectedId) ??
    reports.find((item) => item.id === selectedId) ??
    null;

  return (
    <main className="page">
      <h1>AI Reports</h1>
      <p className="muted">Grounded incident reports generated from computed metrics and evidence.</p>
      <section className="card">
        <div className="button-row">
          <select
            className="input input-wide"
            value={selectedIncidentId}
            onChange={(event) => setSelectedIncidentId(event.target.value)}
          >
            {incidents.length === 0 ? <option value="">No active incidents available</option> : null}
            {incidents.map((incident) => (
              <option key={incident.id} value={incident.id}>
                {incident.id} | {incident.endpoint} | {incident.title}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => void generateSelectedReport()} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate Report"}
          </button>
        </div>
        {statusText ? <p className="muted">{statusText}</p> : null}
      </section>
      <section className="filter-bar">
        <div className="filter-row">
          <input
            className="input input-wide"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by report title, incident ID, or endpoint..."
          />
          <select
            className="input"
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value as ReportRow["source"] | "ALL")}
          >
            <option value="ALL">All Sources</option>
            <option value="LLM">LLM</option>
            <option value="TEMPLATE">Template</option>
          </select>
          <select
            className="input"
            value={endpointFilter}
            onChange={(event) => setEndpointFilter(event.target.value)}
          >
            <option value="ALL">All Endpoints</option>
            {endpointOptions.map((endpoint) => (
              <option key={endpoint} value={endpoint}>
                {endpoint}
              </option>
            ))}
          </select>
          <input className="input" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <input className="input" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          <button className="btn btn-secondary" onClick={() => void loadReports()} disabled={loading}>
            Refresh
          </button>
          <button
            className="btn"
            onClick={() => {
              setSearchTerm("");
              setSourceFilter("ALL");
              setEndpointFilter("ALL");
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
          <h3 className="section-title">Generated Reports</h3>
          <span className="chip-soft chip-gray-soft">{filteredReports.length} results</span>
        </div>
        {loading ? (
          <InlineSpinner label="Loading reports..." />
        ) : reports.length === 0 ? (
          <p className="muted">No reports generated yet. Generate one from Incident Details.</p>
        ) : filteredReports.length === 0 ? (
          <p className="muted">No reports match active filters. Adjust filters and try again.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Endpoint</th>
                  <th>Source</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.title}</td>
                    <td>
                      <span className="chip-soft chip-purple">{report.endpoint}</span>
                    </td>
                    <td>
                      <span className={`chip-soft ${report.source === "LLM" ? "chip-green-soft" : "chip-gray-soft"}`}>
                        {report.source}
                      </span>
                    </td>
                    <td>{new Date(report.createdAt).toLocaleString()}</td>
                    <td>
                      <button className="btn" onClick={() => setSelectedId(report.id)}>
                        Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected ? (
        <section className="card">
          <div className="button-row">
            <h3 className="section-title">{selected.title}</h3>
            <span className={`chip-soft ${selected.source === "LLM" ? "chip-green-soft" : "chip-gray-soft"}`}>
              {selected.source}
            </span>
            <a className="btn" href={`/api/reports/${selected.id}?format=md`}>
              Download Markdown
            </a>
          </div>
          <pre className="report-preview">{selected.markdown}</pre>
        </section>
      ) : null}
    </main>
  );
}
