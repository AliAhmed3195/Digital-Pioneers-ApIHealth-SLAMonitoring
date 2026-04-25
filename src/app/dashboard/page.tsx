"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Activity,
  AlertTriangle,
  BellRing,
  Clock3,
  Gauge,
  Router,
  ShieldAlert,
  Timer
} from "lucide-react";
import { StatusChip } from "@/shared/ui/StatusChip";
import type { RiskLevel } from "@/shared/contracts/core";
import { useToast } from "@/shared/ui/ToastProvider";

type OverviewResponse = {
  activeScenario: string | null;
  updatedAt: string | null;
  kpis: {
    totalRequests: number;
    endpointCount: number;
    atRiskEndpoints: number;
    activeIncidents: number;
  };
  topContributors: Array<{
    endpoint: string;
    p95LatencyMs: number;
    errorRate: number;
  }>;
  correlationHints: Array<{
    endpoint: string;
    hint: string;
  }>;
  triggeredRules: Array<{
    ruleName: string;
    endpoint: string;
    severity: string;
    reason: string;
  }>;
};

type EndpointsResponse = {
  endpoints: Array<{
    endpoint: string;
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

type MonitorLatestResponse = {
  latest: {
    id: string;
    executedAt: string;
    windowFrom: string;
    windowTo: string;
    lookbackMinutes: number;
    totalLogs: number;
    result: {
      alerts: Array<{
        endpoint: string;
        severity: "info" | "warning" | "critical";
        message: string;
      }>;
      endpoints: Array<{
        endpoint: string;
        risk_level: "LOW" | "MEDIUM" | "HIGH";
        sla_breach_predicted: boolean;
      }>;
    };
  } | null;
  config?: {
    lookbackMinutes: number;
    cronSchedule: string;
  };
};

export default function DashboardPage() {
  const toast = useToast();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointsResponse["endpoints"]>([]);
  const [monitorLatest, setMonitorLatest] = useState<MonitorLatestResponse["latest"]>(null);
  const [monitorConfig, setMonitorConfig] = useState<MonitorLatestResponse["config"] | null>(null);
  const [isRunningMonitor, setIsRunningMonitor] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function loadDashboardData(): Promise<void> {
    const [overviewRes, endpointsRes, monitorRes] = await Promise.all([
      fetch("/api/health/overview", { cache: "no-store" }),
      fetch("/api/endpoints", { cache: "no-store" }),
      fetch("/api/monitor", { cache: "no-store" })
    ]);
    const overviewData = (await overviewRes.json()) as OverviewResponse;
    const endpointsData = (await endpointsRes.json()) as EndpointsResponse;
    const monitorData = (await monitorRes.json()) as MonitorLatestResponse;
    setOverview(overviewData);
    setEndpoints(endpointsData.endpoints);
    setMonitorLatest(monitorData.latest);
    setMonitorConfig(monitorData.config ?? null);
  }

  useEffect(() => {
    void loadDashboardData();
  }, []);

  async function runMonitorNow() {
    setIsRunningMonitor(true);
    try {
      const res = await fetch("/api/monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-monitor-ui": "1"
        },
        body: JSON.stringify({})
      });
      const payload = (await res.json()) as {
        run?: { result: { alerts: Array<unknown> } };
        email?: { sent?: boolean; reason?: string };
        error?: string;
      };
      if (!res.ok) {
        toast.error(payload.error || "Monitor run failed.");
        return;
      }
      const alertCount = payload.run?.result.alerts.length ?? 0;
      const emailNote = payload.email?.sent
        ? "Alert email sent."
        : payload.email?.reason
          ? `Email skipped: ${payload.email.reason}`
          : "Email status unavailable.";
      toast.success(`Monitor run completed. Alerts: ${alertCount}. ${emailNote}`);
      await loadDashboardData();
    } catch {
      toast.error("Monitor run failed due to a network/server error.");
    } finally {
      setIsRunningMonitor(false);
    }
  }

  const atRisk = endpoints.filter((item) => item.assessment.level !== "GREEN");

  const riskDistribution = [
    { name: "GREEN", value: endpoints.filter((item) => item.assessment.level === "GREEN").length },
    { name: "AMBER", value: endpoints.filter((item) => item.assessment.level === "AMBER").length },
    { name: "RED", value: endpoints.filter((item) => item.assessment.level === "RED").length }
  ];

  const chartColors = {
    GREEN: "#16a34a",
    AMBER: "#f59e0b",
    RED: "#ef4444"
  };

  const latencyTargetMs = 700;
  const latencyChartData = endpoints.map((item) => ({
    endpoint: item.endpoint,
    p95LatencyMs: item.metrics.p95LatencyMs,
    targetLatencyMs: latencyTargetMs
  }));

  const donutTotal = riskDistribution.reduce((sum, item) => sum + item.value, 0);
  const riskLegend = riskDistribution.map((item) => ({
    ...item,
    percent: donutTotal > 0 ? Math.round((item.value / donutTotal) * 100) : 0
  }));

  const uptime = endpoints.length > 0 ? Number((100 - (atRisk.length / endpoints.length) * 100).toFixed(2)) : 0;
  const avgP95 =
    endpoints.length > 0
      ? Math.round(endpoints.reduce((sum, item) => sum + item.metrics.p95LatencyMs, 0) / endpoints.length)
      : 0;
  const successRate = endpoints.length > 0 ? Number((100 - (overview?.kpis.atRiskEndpoints ?? 0) * 2.5).toFixed(1)) : 100;

  return (
    <main className="page">
      <h1>Dashboard</h1>
      <p className="muted">Live SLA overview and current risk posture.</p>

      <section className="insight-wrap">
        <div className="insight-head">
          <div>
            <h3 className="section-title">AI-Powered Insights</h3>
            <p className="muted">Real-time intelligent recommendations</p>
          </div>
          <div className="button-row">
            <button className="btn btn-primary" onClick={() => void runMonitorNow()} disabled={isRunningMonitor}>
              {isRunningMonitor ? "Running..." : "Run Monitor Now"}
            </button>
            <span className="insight-badge">Live Analysis</span>
          </div>
        </div>
        <div className="insight-grid">
          <article className="insight-card">
            <p className="insight-card-title">OPPORTUNITY</p>
            <p className="insight-card-value">{Math.max(1, overview?.kpis.endpointCount ?? 0)} healthy endpoints optimized</p>
          </article>
          <article className="insight-card">
            <p className="insight-card-title">ATTENTION</p>
            <p className="insight-card-value">{overview?.kpis.atRiskEndpoints ?? 0} endpoints need action</p>
          </article>
          <article className="insight-card">
            <p className="insight-card-title">PREDICTION</p>
            <p className="insight-card-value">Expected stability +{Math.max(3, 12 - (overview?.kpis.atRiskEndpoints ?? 0))}%</p>
          </article>
          <article className="system-health">
            <h4>System Health</h4>
            <p>Uptime: {uptime}%</p>
            <p>Response Time: {avgP95}ms</p>
            <p>Success Rate: {successRate}%</p>
          </article>
        </div>
      </section>

      <section className="card-grid">
        <article className="card">
          <div className="card-head">
            <div className="muted">Total Requests</div>
            <span className="card-icon"><Activity size={16} /></span>
          </div>
          <div className="kpi-value">{overview?.kpis.totalRequests ?? "-"}</div>
        </article>
        <article className="card">
          <div className="card-head">
            <div className="muted">Endpoints</div>
            <span className="card-icon"><Router size={16} /></span>
          </div>
          <div className="kpi-value">{overview?.kpis.endpointCount ?? "-"}</div>
        </article>
        <article className="card">
          <div className="card-head">
            <div className="muted">At-Risk Endpoints</div>
            <span className="card-icon"><ShieldAlert size={16} /></span>
          </div>
          <div className="kpi-value">{overview?.kpis.atRiskEndpoints ?? "-"}</div>
        </article>
        <article className="card">
          <div className="card-head">
            <div className="muted">Active Incidents</div>
            <span className="card-icon"><AlertTriangle size={16} /></span>
          </div>
          <div className="kpi-value">{overview?.kpis.activeIncidents ?? "-"}</div>
        </article>
        <article className="card">
          <div className="card-head">
            <div className="muted">Monitor Window</div>
            <span className="card-icon"><Clock3 size={16} /></span>
          </div>
          <div className="scenario-value">
            {monitorLatest ? `${new Date(monitorLatest.windowFrom).toLocaleTimeString()} - ${new Date(monitorLatest.windowTo).toLocaleTimeString()}` : "Not run yet"}
          </div>
        </article>
        <article className="card">
          <div className="card-head">
            <div className="muted">Monitor Alerts</div>
            <span className="card-icon"><BellRing size={16} /></span>
          </div>
          <div className="kpi-value">{monitorLatest?.result.alerts.length ?? 0}</div>
        </article>
        <article className="card">
          <div className="card-head">
            <div className="muted">Monitor Lookback</div>
            <span className="card-icon"><Timer size={16} /></span>
          </div>
          <div className="kpi-value">
            {monitorLatest?.lookbackMinutes ?? monitorConfig?.lookbackMinutes ?? "-"}m
          </div>
        </article>
        <article className="card">
          <div className="card-head">
            <div className="muted">Cron Schedule</div>
            <span className="card-icon"><Gauge size={16} /></span>
          </div>
          <div className="scenario-value">{monitorConfig?.cronSchedule ?? "*/15 * * * *"}</div>
        </article>
      </section>

      <section className="chart-grid">
        <article className="card chart-card chart-wide">
          <div className="chart-head">
            <div>
              <h3 className="section-title">Performance Analytics</h3>
              <p className="muted">Endpoint p95 latency against SLA target</p>
            </div>
          </div>
          {mounted ? (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer minWidth={300} minHeight={260}>
                <AreaChart data={latencyChartData} margin={{ left: 0, right: 8 }}>
                  <defs>
                    <linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6fa93e" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#6fa93e" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="endpoint" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="p95LatencyMs"
                    stroke="#4d7e1c"
                    fill="url(#latencyFill)"
                    strokeWidth={2.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="targetLatencyMs"
                    stroke="#86b94f"
                    strokeDasharray="5 5"
                    dot={false}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="muted">Loading chart...</p>
          )}
        </article>

        <article className="card chart-card">
          <div className="chart-head">
            <div>
              <h3 className="section-title">Risk Channels</h3>
              <p className="muted">Distribution by risk bucket</p>
            </div>
          </div>
          {mounted ? (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer minWidth={300} minHeight={260}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={95}
                    innerRadius={55}
                    label={false}
                  >
                    {riskDistribution.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={chartColors[entry.name as keyof typeof chartColors]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="muted">Loading chart...</p>
          )}
          <ul className="donut-legend">
            {riskLegend.map((item) => (
              <li key={item.name}>
                <span
                  className="legend-dot"
                  style={{ backgroundColor: chartColors[item.name as keyof typeof chartColors] }}
                />
                <span>{item.name}</span>
                <strong>{item.percent}%</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card chart-card">
        <div className="chart-head">
          <div>
            <h3 className="section-title">Error Rate Trend</h3>
            <p className="muted">Comparison across monitored endpoints</p>
          </div>
        </div>
        {mounted ? (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer minWidth={300} minHeight={260}>
              <LineChart data={endpoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="endpoint" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="metrics.errorRate"
                  stroke="#3c8f1f"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#3c8f1f" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="muted">Loading chart...</p>
        )}
      </section>

      <section className="card-grid">
        <article className="card">
          <h3>Top Contributors</h3>
          {overview?.topContributors?.length ? (
            <ul>
              {overview.topContributors.map((item) => (
                <li key={item.endpoint}>
                  {item.endpoint}: p95 {item.p95LatencyMs}ms, err {item.errorRate}%
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No contributors available.</p>
          )}
        </article>
        <article className="card">
          <h3>Correlation Hints</h3>
          {overview?.correlationHints?.length ? (
            <ul>
              {overview.correlationHints.map((item) => (
                <li key={`${item.endpoint}-${item.hint}`}>{item.hint}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No correlation hints available.</p>
          )}
        </article>
      </section>

      <section className="card">
        <h3>Triggered Alert Rules</h3>
        {overview?.triggeredRules?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Endpoint</th>
                  <th>Severity</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {overview.triggeredRules.map((rule) => (
                  <tr key={`${rule.ruleName}-${rule.endpoint}-${rule.reason}`}>
                    <td>{rule.ruleName}</td>
                    <td>{rule.endpoint}</td>
                    <td>{rule.severity}</td>
                    <td>{rule.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No rules are triggered.</p>
        )}
      </section>

      <section className="card">
        <h3>At-Risk Endpoints</h3>
        {atRisk.length === 0 ? (
          <p className="muted">No at-risk endpoints detected yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Risk</th>
                  <th>Score</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {atRisk.map((item) => (
                  <tr key={item.endpoint}>
                    <td>{item.endpoint}</td>
                    <td>
                      <StatusChip level={item.assessment.level} />
                    </td>
                    <td>{item.assessment.score}</td>
                    <td>{item.assessment.reasons[0] ?? "Risk detected."}</td>
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
