import type { RiskScorer } from "@/modules/risk/domain/RiskScorer";
import type { SLAThresholds } from "@/modules/settings/application/AppSettingsStore";
import type { MetricWindow, RiskAssessment } from "@/shared/contracts/core";
import { clamp } from "@/shared/utils";

export class ThresholdRiskScorer implements RiskScorer {
  constructor(private readonly thresholds: SLAThresholds) {}

  evaluate(window: MetricWindow): RiskAssessment {
    const reasons: string[] = [];
    let score = 0;

    if (window.errorRate >= this.thresholds.criticalErrorRate) {
      score += 60;
      reasons.push(`5xx error rate is high (${window.errorRate}%).`);
    } else if (window.errorRate >= this.thresholds.warningErrorRate) {
      score += 35;
      reasons.push(`5xx error rate is elevated (${window.errorRate}%).`);
    }

    if (window.p95LatencyMs >= this.thresholds.criticalP95LatencyMs) {
      score += 40;
      reasons.push(`p95 latency is critical (${window.p95LatencyMs}ms).`);
    } else if (window.p95LatencyMs >= this.thresholds.warningP95LatencyMs) {
      score += 25;
      reasons.push(`p95 latency is above target (${window.p95LatencyMs}ms).`);
    } else if (window.p95LatencyMs >= this.thresholds.targetP95LatencyMs) {
      // Target breach should still influence risk even before warning threshold.
      score += 15;
      reasons.push(`p95 latency is above target baseline (${window.p95LatencyMs}ms).`);
    }

    const boundedScore = clamp(score, 0, 100);

    if (boundedScore >= 70) {
      return { level: "RED", score: boundedScore, reasons };
    }
    if (boundedScore >= 35) {
      return { level: "AMBER", score: boundedScore, reasons };
    }
    return {
      level: "GREEN",
      score: boundedScore,
      reasons: reasons.length > 0 ? reasons : ["All SLA indicators are healthy."]
    };
  }
}
