import type { ReportGenerator } from "@/modules/reporting/domain/ReportGenerator";

export class TemplateReportGenerator implements ReportGenerator {
  async generate({ incident, metrics }: Parameters<ReportGenerator["generate"]>[0]) {
    const markdown = [
      `## Incident Summary`,
      `Incident \`${incident.id}\` affected endpoint \`${incident.endpoint}\` with risk level **${incident.riskLevel}** and score **${incident.riskScore}**.`,
      ``,
      `## Evidence`,
      `- Time window: ${metrics.from} to ${metrics.to}`,
      `- Request count: ${metrics.requestCount}`,
      `- Error rate: ${metrics.errorRate}%`,
      `- p95 latency: ${metrics.p95LatencyMs}ms`,
      `- p99 latency: ${metrics.p99LatencyMs}ms`,
      ``,
      `## Timeline`,
      `- Created: ${incident.createdAt}`,
      `- Last updated: ${incident.updatedAt}`,
      `- Current status: ${incident.status}`,
      ``,
      `## Recommended Next Steps`,
      `1. Validate upstream dependencies and service health for ${incident.endpoint}.`,
      `2. Add temporary alert sensitivity for this endpoint until stabilized.`,
      `3. Confirm post-fix metrics return below thresholds before closure.`
    ].join("\n");

    return {
      title: `Incident Report - ${incident.endpoint}`,
      markdown
    };
  }
}
