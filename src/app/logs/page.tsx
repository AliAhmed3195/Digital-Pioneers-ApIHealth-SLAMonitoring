"use client";

import { useEffect, useMemo, useState } from "react";
import { InlineSpinner, useToast } from "@/shared/ui/ToastProvider";
import { PaginationControls } from "@/shared/ui/PaginationControls";

type LogRecord = {
  timestamp: string;
  endpoint: string;
  status: number;
  latencyMs: number;
  requestId?: string;
};

type ParsedFilters = {
  statusClass: "all" | "5xx" | "4xx";
  endpoint: string | null;
};

type StatusFilter = "all" | "2xx" | "4xx" | "5xx";
const MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024;

function isHostedDeployment(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const host = window.location.hostname.toLowerCase();
  return host !== "localhost" && host !== "127.0.0.1";
}

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

export default function LogsPage() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filters, setFilters] = useState<ParsedFilters>({
    statusClass: "all",
    endpoint: null
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  async function loadLogs() {
    const res = await fetch("/api/logs", { cache: "no-store" });
    const data = (await res.json()) as { logs: LogRecord[] };
    setLogs(data.logs);
  }

  async function clearLogs() {
    await fetch("/api/logs", { method: "DELETE" });
    setLogs([]);
    setUploadStatus("Logs cleared.");
    toast.info("Logs cleared.");
  }

  useEffect(() => {
    async function init() {
      await clearLogs();
      await loadLogs();
    }
    void init();
  }, []);

  async function parseQuery() {
    const res = await fetch("/api/query/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = (await res.json()) as {
      filters: ParsedFilters;
    };
    setFilters(data.filters);
  }

  async function uploadLogFile(file: File) {
    if (isHostedDeployment() && file.size > MAX_UPLOAD_SIZE_BYTES) {
      const maxMb = (MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)).toFixed(0);
      const message = `Upload blocked: file exceeds ${maxMb}MB. This limit is applied for Vercel-hosted deployment constraints.`;
      setUploadStatus(message);
      toast.error(message);
      return;
    }
    setIsUploading(true);
    setUploadStatus("Uploading and validating logs...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/logs/upload", {
        method: "POST",
        body: formData
      });
      const data = (await res.json()) as {
        message?: string;
        uploadedCount?: number;
        atRiskEndpoints?: number;
        activeIncidents?: number;
        error?: string;
      };

      if (!res.ok) {
        setUploadStatus(data.error ?? "Upload failed.");
        toast.error(data.error ?? "Upload failed.");
        setIsUploading(false);
        return;
      }

      setUploadStatus(
        `${data.message} Uploaded ${data.uploadedCount} logs. At-risk endpoints: ${data.atRiskEndpoints}, Active incidents: ${data.activeIncidents}.`
      );
      toast.success(`Logs uploaded (${data.uploadedCount ?? 0}).`);
      await loadLogs();
    } catch {
      setUploadStatus("Upload failed. Please provide valid log content.");
      toast.error("Upload failed. Please provide valid log content.");
    } finally {
      setIsUploading(false);
    }
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (searchTerm && !log.endpoint.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      const inferredType = inferType(log.endpoint);
      const inferredChannel = inferChannel(log.endpoint);

      if (typeFilter !== "ALL" && inferredType !== typeFilter) {
        return false;
      }
      if (channelFilter !== "ALL" && inferredChannel !== channelFilter) {
        return false;
      }

      if (statusFilter === "2xx" && (log.status < 200 || log.status >= 300)) {
        return false;
      }
      if (statusFilter === "4xx" && (log.status < 400 || log.status >= 500)) {
        return false;
      }
      if (statusFilter === "5xx" && log.status < 500) {
        return false;
      }

      if (filters.statusClass === "5xx" && log.status < 500) {
        return false;
      }
      if (filters.statusClass === "4xx" && (log.status < 400 || log.status >= 500)) {
        return false;
      }
      if (filters.endpoint && log.endpoint !== filters.endpoint) {
        return false;
      }

      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`).getTime();
        if (new Date(log.timestamp).getTime() < from) {
          return false;
        }
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59`).getTime();
        if (new Date(log.timestamp).getTime() > to) {
          return false;
        }
      }

      return true;
    });
  }, [logs, filters, searchTerm, typeFilter, statusFilter, channelFilter, fromDate, toDate]);
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, statusFilter, channelFilter, fromDate, toDate, filters, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const typeOptions = useMemo(
    () => Array.from(new Set(logs.map((log) => inferType(log.endpoint)))).sort((a, b) => a.localeCompare(b)),
    [logs]
  );
  const channelOptions = useMemo(
    () => Array.from(new Set(logs.map((log) => inferChannel(log.endpoint)))).sort((a, b) => a.localeCompare(b)),
    [logs]
  );

  return (
    <main className="page">
      <h1>Log Explorer</h1>
      <p className="muted">Use NL command bar to parse filters (example: last 2 hours 5xx /payments).</p>

      <section className="card">
        <h3 className="section-title">Upload Logs (.txt / .log)</h3>
        <div className="upload-toolbar">
          <input
            className="input input-file"
            type="file"
            accept=".txt,.log,text/plain"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                const name = file.name.toLowerCase();
                if (!name.endsWith(".txt") && !name.endsWith(".log")) {
                  setUploadStatus("Only .txt or .log files are allowed right now.");
                  return;
                }
                void uploadLogFile(file);
              }
            }}
          />
          <button
            className="btn"
            disabled={isUploading}
            onClick={async () => {
              await clearLogs();
              await loadLogs();
            }}
          >
            Refresh Logs
          </button>
          <button
            className="btn btn-secondary"
            disabled={isUploading}
            onClick={async () => {
              await clearLogs();
            }}
          >
            Clear Logs
          </button>
        </div>
        <p className="muted">
          Currently accepted: plain text files (`.txt`) and log files (`.log`).
        </p>
        <p className="muted">
          Note: on Vercel-hosted deployment, large file uploads are platform-limited.
        </p>
        {isUploading ? <InlineSpinner label="Uploading and parsing logs. Please wait..." /> : null}
        {uploadStatus ? <p className="muted">{uploadStatus}</p> : null}
      </section>

      <section className="card">
        <div className="filter-row">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by endpoint..."
            className="input input-wide"
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
            <option value="all">All Status</option>
            <option value="2xx">2xx</option>
            <option value="4xx">4xx</option>
            <option value="5xx">5xx</option>
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
          <button className="btn btn-primary" onClick={parseQuery}>
            Parse Query
          </button>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              await clearLogs();
              await loadLogs();
            }}
          >
            Refresh Logs
          </button>
        </div>
        <p className="muted">
          Active filters: status={filters.statusClass}, endpoint={filters.endpoint ?? "any"}
        </p>
      </section>

      <section className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Endpoint</th>
              <th>Status</th>
              <th>Latency (ms)</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log, index) => (
              <tr key={`${log.timestamp}-${log.endpoint}-${log.status}-${log.requestId ?? index}`}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.endpoint}</td>
                <td>{log.status}</td>
                <td>{log.latencyMs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <PaginationControls
        totalItems={filteredLogs.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </main>
  );
}
