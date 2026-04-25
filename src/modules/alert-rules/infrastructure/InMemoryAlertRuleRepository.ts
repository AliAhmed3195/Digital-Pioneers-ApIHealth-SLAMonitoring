import type { AlertRule } from "@/modules/alert-rules/domain/AlertRule";
import type { AlertRuleRepository } from "@/modules/alert-rules/domain/AlertRuleRepository";

const seedRules: AlertRule[] = [
  {
    id: "rule-payments-high-risk",
    name: "Payments high latency or error",
    endpoint: "/payments",
    maxP95LatencyMs: 900,
    maxErrorRate: 2.5,
    cooldownMinutes: 5,
    severity: "HIGH",
    enabled: true
  }
];

export class InMemoryAlertRuleRepository implements AlertRuleRepository {
  private readonly storage = new Map<string, AlertRule>(
    seedRules.map((rule) => [rule.id, rule])
  );

  async list(): Promise<AlertRule[]> {
    return [...this.storage.values()];
  }

  async save(rule: AlertRule): Promise<void> {
    this.storage.set(rule.id, rule);
  }

  async getById(id: string): Promise<AlertRule | null> {
    return this.storage.get(id) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }
}

export const alertRuleRepository = new InMemoryAlertRuleRepository();
