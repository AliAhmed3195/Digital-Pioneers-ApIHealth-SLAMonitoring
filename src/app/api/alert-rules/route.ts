import type { AlertRule } from "@/modules/alert-rules/domain/AlertRule";
import { alertRuleRepository } from "@/modules/alert-rules/infrastructure/InMemoryAlertRuleRepository";

type CreateRulePayload = {
  name?: string;
  endpoint?: string;
  maxP95LatencyMs?: number;
  maxErrorRate?: number;
  cooldownMinutes?: number;
  severity?: "LOW" | "MEDIUM" | "HIGH";
  enabled?: boolean;
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
  if (!payload.name || !payload.endpoint) {
    return Response.json({ error: "Name and endpoint are required." }, { status: 400 });
  }

  if (typeof payload.maxP95LatencyMs !== "number" || Number.isNaN(payload.maxP95LatencyMs)) {
    return Response.json({ error: "maxP95LatencyMs must be a number." }, { status: 400 });
  }

  if (typeof payload.maxErrorRate !== "number" || Number.isNaN(payload.maxErrorRate)) {
    return Response.json({ error: "maxErrorRate must be a number." }, { status: 400 });
  }

  const cooldownMinutes = payload.cooldownMinutes ?? 5;
  if (!Number.isInteger(cooldownMinutes) || cooldownMinutes < 1 || cooldownMinutes > 1440) {
    return Response.json({ error: "cooldownMinutes must be an integer between 1 and 1440." }, { status: 400 });
  }

  if (payload.maxP95LatencyMs < 1 || payload.maxP95LatencyMs > 60000) {
    return Response.json({ error: "maxP95LatencyMs must be between 1 and 60000." }, { status: 400 });
  }

  if (payload.maxErrorRate < 0 || payload.maxErrorRate > 100) {
    return Response.json({ error: "maxErrorRate must be between 0 and 100." }, { status: 400 });
  }

  const rule: AlertRule = {
    id: createRuleId(),
    name: payload.name.trim(),
    endpoint: payload.endpoint.trim(),
    maxP95LatencyMs: payload.maxP95LatencyMs,
    maxErrorRate: payload.maxErrorRate,
    cooldownMinutes,
    severity: payload.severity ?? "MEDIUM",
    enabled: payload.enabled ?? true
  };

  await alertRuleRepository.save(rule);
  return Response.json({ rule }, { status: 201 });
}
