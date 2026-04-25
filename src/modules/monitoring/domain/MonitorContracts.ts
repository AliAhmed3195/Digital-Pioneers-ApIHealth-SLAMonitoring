export type MonitorRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type MonitorAlertSeverity = "info" | "warning" | "critical";

export type MonitorEndpointAssessment = {
  endpoint: string;
  risk_level: MonitorRiskLevel;
  sla_breach_predicted: boolean;
  reason: string;
  recommended_action: string;
};

export type MonitorAlert = {
  endpoint: string;
  message: string;
  severity: MonitorAlertSeverity;
};

export type MonitorResult = {
  timestamp: string;
  endpoints: MonitorEndpointAssessment[];
  incident_summary: string;
  alerts: MonitorAlert[];
};

export type MonitorRunRecord = {
  id: string;
  executedAt: string;
  windowFrom: string;
  windowTo: string;
  lookbackMinutes: number;
  totalLogs: number;
  result: MonitorResult;
};

export type EndpointWindowStats = {
  endpoint: string;
  requestCount: number;
  errorRate: number;
  avgResponseTimeMs: number;
  p95LatencyMs: number;
  topErrors: string[];
  slaBreached: boolean;
};
