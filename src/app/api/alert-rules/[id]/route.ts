import type { AlertRule, RuleSeverity } from "@/modules/alert-rules/domain/AlertRule";
import { alertRuleRepository } from "@/modules/alert-rules/infrastructure/InMemoryAlertRuleRepository";

type UpdateRulePayload = Partial<{
  name: string;
  endpoint: string;
  maxP95LatencyMs: number;
  maxErrorRate: number;
  cooldownMinutes: number;
  severity: RuleSeverity;
  enabled: boolean;
}>;

function isValidSeverity(value: unknown): value is RuleSeverity {
  return value === "LOW" || value === "MEDIUM" || value === "HIGH";
}

function validateRule(rule: AlertRule): string | null {
  if (!rule.name.trim()) return "Rule name is required.";
  if (!rule.endpoint.trim()) return "Endpoint is required.";
  if (rule.maxP95LatencyMs < 1 || rule.maxP95LatencyMs > 60000) {
    return "maxP95LatencyMs must be between 1 and 60000.";
  }
  if (rule.maxErrorRate < 0 || rule.maxErrorRate > 100) {
    return "maxErrorRate must be between 0 and 100.";
  }
  if (!Number.isInteger(rule.cooldownMinutes) || rule.cooldownMinutes < 1 || rule.cooldownMinutes > 1440) {
    return "cooldownMinutes must be an integer between 1 and 1440.";
  }
  if (!isValidSeverity(rule.severity)) {
    return "severity must be LOW, MEDIUM, or HIGH.";
  }
  return null;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;
  const existing = await alertRuleRepository.getById(id);
  if (!existing) {
    return Response.json({ error: "Rule not found." }, { status: 404 });
  }

  const payload = (await request.json()) as UpdateRulePayload;
  if (payload.severity && !isValidSeverity(payload.severity)) {
    return Response.json({ error: "Invalid severity." }, { status: 400 });
  }

  const updated: AlertRule = {
    ...existing,
    ...payload,
    name: payload.name?.trim() ?? existing.name,
    endpoint: payload.endpoint?.trim() ?? existing.endpoint
  };

  const error = validateRule(updated);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  await alertRuleRepository.save(updated);
  return Response.json({ rule: updated });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  return PUT(request, context);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;
  const deleted = await alertRuleRepository.delete(id);
  if (!deleted) {
    return Response.json({ error: "Rule not found." }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
