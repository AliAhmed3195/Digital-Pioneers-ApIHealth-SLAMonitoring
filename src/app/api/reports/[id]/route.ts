import { getReportById } from "@/modules/reporting/application/ReportService";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: Params): Promise<Response> {
  const { id } = await params;
  const report = await getReportById(id);
  if (!report) {
    return Response.json({ error: "Report not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  if (format === "md") {
    return new Response(report.markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${report.id}.md"`
      }
    });
  }

  return Response.json({ report });
}
