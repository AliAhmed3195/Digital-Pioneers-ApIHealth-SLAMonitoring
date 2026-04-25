import { listReports } from "@/modules/reporting/application/ReportService";

export async function GET(): Promise<Response> {
  const reports = await listReports();
  return Response.json({ reports });
}
