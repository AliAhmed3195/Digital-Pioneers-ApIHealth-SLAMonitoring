import type { AlertRule } from "@/modules/alert-rules/domain/AlertRule";
import { alertRuleRepository } from "@/modules/alert-rules/infrastructure/InMemoryAlertRuleRepository";

type CreateRulePayload = {
  name?: string;
  endpoint?: string;
  maxP95LatencyMs?: number;
  maxErrorRate?: number;
  severity?: "LOW" | "MEDIUM" | "HIGH";
};

function createRuleId(): string {
  return `rule_${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET(): Promise<Response> {
  const rules = await alertRuleRepository.list();
  return Response.json({ rules });
}

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json()) as CreateRulePayload;
  if (
    !payload.name ||
    !payload.endpoint ||
    typeof payload.maxP95LatencyMs !== "number" ||
    typeof payload.maxErrorRate !== "number"
  ) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  const rule: AlertRule = {
    id: createRuleId(),
    name: payload.name,
    endpoint: payload.endpoint,
    maxP95LatencyMs: payload.maxP95LatencyMs,
    maxErrorRate: payload.maxErrorRate,
    cooldownMinutes: 5,
    severity: payload.severity ?? "MEDIUM",
    enabled: true
  };

  await alertRuleRepository.save(rule);
  return Response.json({ rule }, { status: 201 });
}
