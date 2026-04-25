import { z } from "zod";

export const monitorAlertSeveritySchema = z.enum(["info", "warning", "critical"]);

export const monitorRiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const monitorEndpointAssessmentSchema = z.object({
  endpoint: z.string().min(1),
  risk_level: monitorRiskLevelSchema,
  sla_breach_predicted: z.boolean(),
  reason: z.string().min(1),
  recommended_action: z.string().min(1)
});

export const monitorAlertSchema = z.object({
  endpoint: z.string().min(1),
  message: z.string().min(1),
  severity: monitorAlertSeveritySchema
});

export const monitorResultSchema = z.object({
  timestamp: z.string().min(1),
  endpoints: z.array(monitorEndpointAssessmentSchema),
  incident_summary: z.string().min(1),
  alerts: z.array(monitorAlertSchema)
});
