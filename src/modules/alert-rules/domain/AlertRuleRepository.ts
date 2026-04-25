import type { AlertRule } from "@/modules/alert-rules/domain/AlertRule";

export interface AlertRuleRepository {
  list(): Promise<AlertRule[]>;
  save(rule: AlertRule): Promise<void>;
  getById(id: string): Promise<AlertRule | null>;
  delete(id: string): Promise<boolean>;
}
