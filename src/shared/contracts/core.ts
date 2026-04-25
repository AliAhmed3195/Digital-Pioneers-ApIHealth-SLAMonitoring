export type RiskLevel = "GREEN" | "AMBER" | "RED";

export type RiskAssessment = {
  level: RiskLevel;
  score: number;
  reasons: string[];
};

export type NormalizedLogRecord = {
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  latencyMs: number;
  requestId?: string;
  errorMessage?: string;
};

export type MetricWindow = {
  from: string;
  to: string;
  requestCount: number;
  errorRate: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
};

export type EndpointMetrics = {
  endpoint: string;
  window: MetricWindow;
};
