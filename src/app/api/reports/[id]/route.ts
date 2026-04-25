import { getReportById } from "@/modules/reporting/application/ReportService";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

function sanitizeMarkdownToText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)")
    .replace(/^- /gm, "• ")
    .trim();
}

function wrapTextLines(text: string, maxCharsPerLine: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxCharsPerLine) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

async function createReportPdfBuffer(input: {
  title: string;
  endpoint: string;
  source: string;
  createdAt: string;
  markdown: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 48;
  const fontSize = 11;
  const lineHeight = 16;
  const maxCharsPerLine = 95;

  const bodyText = sanitizeMarkdownToText(input.markdown);
  const contentLines = wrapTextLines(bodyText, maxCharsPerLine);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  page.drawText(input.title || "Incident Report", {
    x: margin,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0.08, 0.16, 0.11)
  });
  y -= 24;

  const meta = [
    `Endpoint: ${input.endpoint}`,
    `Source: ${input.source}`,
    `Generated: ${new Date(input.createdAt).toLocaleString()}`
  ];
  for (const line of meta) {
    page.drawText(line, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.23, 0.29, 0.34)
    });
    y -= 14;
  }

  y -= 10;
  for (const line of contentLines) {
    if (y <= margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(line, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0.06, 0.09, 0.12)
    });
    y -= lineHeight;
  }

  return pdfDoc.save();
}

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
  if (format === "pdf") {
    const pdfBytes = await createReportPdfBuffer({
      title: report.title,
      endpoint: report.endpoint,
      source: report.source,
      createdAt: report.createdAt,
      markdown: report.markdown
    });
    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${report.id}.pdf"`
      }
    });
  }

  return Response.json({ report });
}
