import { generateReportForIncident } from "@/modules/reporting/application/ReportService";

type GeneratePayload = {
  incidentId?: string;
};

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json()) as GeneratePayload;
  if (!payload.incidentId) {
    return Response.json({ error: "incidentId is required." }, { status: 400 });
  }

  try {
    const report = await generateReportForIncident(payload.incidentId);
    return Response.json({ report });
  } catch (error) {
    if (error instanceof Error && error.message === "INCIDENT_NOT_FOUND") {
      return Response.json({ error: "Incident not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "METRICS_NOT_AVAILABLE") {
      return Response.json({ error: "Metrics unavailable for incident endpoint." }, { status: 422 });
    }
    return Response.json({ error: "Failed to generate report." }, { status: 500 });
  }
}
