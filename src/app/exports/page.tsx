"use client";

import { useEffect, useMemo, useState } from "react";
import { InlineSpinner, useToast } from "@/shared/ui/ToastProvider";
import { PaginationControls } from "@/shared/ui/PaginationControls";

type ReportRow = {
  id: string;
  title: string;
  incidentId: string;
  incidentTitle: string;
  endpoint: string;
  source: "LLM" | "TEMPLATE";
  createdAt: string;
  markdown?: string;
};

export default function ExportsPage() {
  const toast = useToast();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<ReportRow["source"] | "ALL">("ALL");
  const [endpointFilter, setEndpointFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [statusText, setStatusText] = useState("");
  const [selectedMarkdown, setSelectedMarkdown] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      const data = (await res.json()) as { reports: ReportRow[] };
      setReports(data.reports);
      setSelectedId((current) => current || data.reports[0]?.id || "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  const endpointOptions = useMemo(
    () => Array.from(new Set(reports.map((report) => report.endpoint))).sort((a, b) => a.localeCompare(b)),
    [reports]
  );

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
        if (createdTime < from) return false;
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59`).getTime();
        if (createdTime > to) return false;
      }
      return true;
    });
  }, [reports, searchTerm, sourceFilter, endpointFilter, fromDate, toDate]);
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const paginatedReports = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, sourceFilter, endpointFilter, fromDate, toDate, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const selectedReport =
    reports.find((report) => report.id === selectedId) ??
    filteredReports[0] ??
    null;

  useEffect(() => {
    async function loadSelectedMarkdown() {
      if (!selectedReport) {
        setSelectedMarkdown("");
        return;
      }
      const res = await fetch(`/api/reports/${selectedReport.id}`);
      const data = (await res.json()) as { report?: ReportRow };
      setSelectedMarkdown(data.report?.markdown ?? "");
    }
    void loadSelectedMarkdown();
  }, [selectedReport?.id]);

  async function copySelectedMarkdown() {
    if (!selectedReport) return;
    setStatusText("");
    const res = await fetch(`/api/reports/${selectedReport.id}`);
    const data = (await res.json()) as { report?: ReportRow };
    if (!res.ok || !data.report?.markdown) {
      setStatusText("Unable to load markdown for copy.");
      toast.error("Unable to load markdown for copy.");
      return;
    }
    await navigator.clipboard.writeText(data.report.markdown);
    setStatusText("Markdown copied to clipboard.");
    toast.success("Markdown copied to clipboard.");
  }

  function downloadFilteredManifest() {
    const payload = filteredReports.map((item) => ({
      id: item.id,
      title: item.title,
      incidentId: item.incidentId,
      endpoint: item.endpoint,
      source: item.source,
      createdAt: item.createdAt
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reports-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Filtered export manifest downloaded.");
  }

  return (
    <main className="page">
      <h1>Reports & Exports</h1>
      <p className="muted">
        Export-ready workspace for generated reports with filtered downloads and quick artifact actions.
      </p>
      <section className="filter-bar">
        <div className="filter-row">
          <input
            className="input input-wide"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title, incident ID, endpoint..."
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
          <select className="input" value={endpointFilter} onChange={(event) => setEndpointFilter(event.target.value)}>
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
          <button className="btn" onClick={downloadFilteredManifest} disabled={filteredReports.length === 0}>
            Export Filtered JSON
          </button>
        </div>
      </section>

      <section className="card">
        <div className="button-row">
          <h3 className="section-title">Export Queue</h3>
          <span className="chip-soft chip-gray-soft">{filteredReports.length} results</span>
        </div>
        {loading ? (
          <InlineSpinner label="Loading export artifacts..." />
        ) : reports.length === 0 ? (
          <p className="muted">No reports generated yet. Create reports from incidents first.</p>
        ) : filteredReports.length === 0 ? (
          <p className="muted">No exports match active filters.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Endpoint</th>
                    <th>Source</th>
                    <th>Created</th>
                    <th>Download</th>
                    <th>PDF</th>
                    <th>Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReports.map((report) => (
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
                        <a className="btn" href={`/api/reports/${report.id}?format=md`}>
                          Download .md
                        </a>
                      </td>
                      <td>
                        <a className="btn btn-secondary" href={`/api/reports/${report.id}?format=pdf`}>
                          Download PDF
                        </a>
                      </td>
                      <td>
                        <button className="btn btn-secondary" onClick={() => setSelectedId(report.id)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              totalItems={filteredReports.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </section>

      {selectedReport ? (
        <section className="card">
          <div className="button-row">
            <h3 className="section-title">{selectedReport.title}</h3>
            <a className="btn" href={`/api/reports/${selectedReport.id}?format=md`}>
              Download Markdown
            </a>
            <a className="btn btn-secondary" href={`/api/reports/${selectedReport.id}?format=pdf`}>
              Download PDF
            </a>
            <a className="btn btn-secondary" href={`/api/reports/${selectedReport.id}`} target="_blank" rel="noreferrer">
              Open JSON
            </a>
            <button className="btn btn-secondary" onClick={() => void copySelectedMarkdown()}>
              Copy Markdown
            </button>
          </div>
          {statusText ? <p className="muted">{statusText}</p> : null}
          <p className="muted">
            Incident: {selectedReport.incidentId} | Endpoint: {selectedReport.endpoint} | Source:{" "}
            {selectedReport.source}
          </p>
          {selectedMarkdown ? <pre className="report-preview">{selectedMarkdown}</pre> : null}
        </section>
      ) : null}
    </main>
  );
}
