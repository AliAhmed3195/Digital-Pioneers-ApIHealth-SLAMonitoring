import { runDetectionCycle } from "@/modules/incidents/application/DetectionCycle";
import { incidentRepository } from "@/modules/incidents/infrastructure/InMemoryIncidentRepository";
import type { GeneratedReport, ReportGenerator } from "@/modules/reporting/domain/ReportGenerator";
import type { StoredReport } from "@/modules/reporting/domain/ReportRepository";
import { reportRepository } from "@/modules/reporting/infrastructure/InMemoryReportRepository";
import { OpenAiReportGenerator } from "@/modules/reporting/infrastructure/OpenAiReportGenerator";

const generator: ReportGenerator = new OpenAiReportGenerator();

function createReportId(): string {
  return `rep_${Math.random().toString(36).slice(2, 10)}`;
}

export async function generateReportForIncident(incidentId: string): Promise<StoredReport> {
  const incident = await incidentRepository.getById(incidentId);
  if (!incident) {
    throw new Error("INCIDENT_NOT_FOUND");
  }

  const detection = await runDetectionCycle();
  const endpointData = detection.endpointRisk.find(
    (item) => item.endpoint === incident.endpoint
  );
  if (!endpointData) {
    throw new Error("METRICS_NOT_AVAILABLE");
  }

  const generated: GeneratedReport = await generator.generate({
    incident,
    metrics: endpointData.metrics
  });

  const storedReport: StoredReport = {
    id: createReportId(),
    incidentId: incident.id,
    incidentTitle: incident.title,
    endpoint: incident.endpoint,
    createdAt: new Date().toISOString(),
    title: generated.title,
    markdown: generated.markdown,
    source: process.env.OPENAI_API_KEY ? "LLM" : "TEMPLATE"
  };

  await reportRepository.save(storedReport);
  return storedReport;
}

export async function listReports(): Promise<StoredReport[]> {
  return reportRepository.list();
}

export async function getReportById(id: string): Promise<StoredReport | null> {
  return reportRepository.getById(id);
}
