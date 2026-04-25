export type RuleSeverity = "LOW" | "MEDIUM" | "HIGH";

export type AlertRule = {
  id: string;
  name: string;
  endpoint: string | "*";
  maxP95LatencyMs: number;
  maxErrorRate: number;
  cooldownMinutes: number;
  severity: RuleSeverity;
  enabled: boolean;
};

export type TriggeredRule = {
  ruleId: string;
  ruleName: string;
  endpoint: string;
  severity: RuleSeverity;
  reason: string;
};
