import { parseLogQuery } from "@/modules/query-assistant/application/parseLogQuery";

type QueryPayload = {
  query?: string;
};

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json()) as QueryPayload;
  if (!payload.query) {
    return Response.json({ error: "query is required." }, { status: 400 });
  }

  const filters = parseLogQuery(payload.query);
  return Response.json({ filters });
}
