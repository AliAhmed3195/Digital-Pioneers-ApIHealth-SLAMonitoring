import type { TriggeredRule } from "@/modules/alert-rules/domain/AlertRule";
import { alertRuleRepository } from "@/modules/alert-rules/infrastructure/InMemoryAlertRuleRepository";
import type { EndpointMetrics } from "@/shared/contracts/core";

export async function evaluateAlertRules(
  endpointMetrics: EndpointMetrics[]
): Promise<TriggeredRule[]> {
  const rules = await alertRuleRepository.list();
  const triggers: TriggeredRule[] = [];

  for (const rule of rules) {
    if (!rule.enabled) {
      continue;
    }

    for (const metric of endpointMetrics) {
      if (rule.endpoint !== "*" && rule.endpoint !== metric.endpoint) {
        continue;
      }

      const exceededLatency = metric.window.p95LatencyMs > rule.maxP95LatencyMs;
      const exceededErrors = metric.window.errorRate > rule.maxErrorRate;
      if (!exceededLatency && !exceededErrors) {
        continue;
      }

      const reasons: string[] = [];
      if (exceededLatency) {
        reasons.push(`p95 ${metric.window.p95LatencyMs}ms > ${rule.maxP95LatencyMs}ms`);
      }
      if (exceededErrors) {
        reasons.push(`error ${metric.window.errorRate}% > ${rule.maxErrorRate}%`);
      }

      triggers.push({
        ruleId: rule.id,
        ruleName: rule.name,
        endpoint: metric.endpoint,
        severity: rule.severity,
        reason: reasons.join(", ")
      });
    }
  }

  return triggers;
}
