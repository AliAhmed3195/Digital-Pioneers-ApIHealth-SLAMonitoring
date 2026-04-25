import { incidentRepository } from "@/modules/incidents/infrastructure/InMemoryIncidentRepository";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Params): Promise<Response> {
  const { id } = await params;
  const incident = await incidentRepository.getById(id);
  if (!incident) {
    return Response.json({ error: "Incident not found." }, { status: 404 });
  }
  return Response.json({ incident });
}
