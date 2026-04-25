import type { MetricWindow, RiskAssessment } from "@/shared/contracts/core";

export interface RiskScorer {
  evaluate(window: MetricWindow): RiskAssessment;
}
