import type { AlertRule } from "@/modules/alert-rules/domain/AlertRule";

export interface AlertRuleRepository {
  list(): Promise<AlertRule[]>;
  save(rule: AlertRule): Promise<void>;
}
