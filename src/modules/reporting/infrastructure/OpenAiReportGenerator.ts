import type { ReportGenerator } from "@/modules/reporting/domain/ReportGenerator";
import { TemplateReportGenerator } from "@/modules/reporting/infrastructure/TemplateReportGenerator";

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class OpenAiReportGenerator implements ReportGenerator {
  private readonly fallback = new TemplateReportGenerator();

  async generate(input: Parameters<ReportGenerator["generate"]>[0]) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return this.fallback.generate(input);
    }

    const prompt = [
      "Generate a professional incident report in markdown.",
      "Use ONLY provided facts. Do not invent values.",
      `Incident ID: ${input.incident.id}`,
      `Endpoint: ${input.incident.endpoint}`,
      `Risk Level: ${input.incident.riskLevel}`,
      `Risk Score: ${input.incident.riskScore}`,
      `Status: ${input.incident.status}`,
      `Created At: ${input.incident.createdAt}`,
      `Updated At: ${input.incident.updatedAt}`,
      `Reasons: ${input.incident.reasons.join("; ")}`,
      `Metrics: requests=${input.metrics.requestCount}, errorRate=${input.metrics.errorRate}%, p95=${input.metrics.p95LatencyMs}ms, p99=${input.metrics.p99LatencyMs}ms, window=${input.metrics.from} to ${input.metrics.to}`,
      "Format sections: Incident Summary, Evidence, Timeline, Recommended Next Steps."
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      return this.fallback.generate(input);
    }

    const payload = (await response.json()) as OpenAiChatResponse;
    const markdown = payload.choices?.[0]?.message?.content?.trim();
    if (!markdown) {
      return this.fallback.generate(input);
    }

    return {
      title: `Incident Report - ${input.incident.endpoint}`,
      markdown
    };
  }
}
