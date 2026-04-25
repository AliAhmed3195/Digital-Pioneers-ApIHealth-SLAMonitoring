import type {
  Incident,
  IncidentRepository
} from "@/modules/incidents/domain/IncidentRepository";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export class InMemoryIncidentRepository implements IncidentRepository {
  private readonly storage = new Map<string, Incident>();
  private readonly storageFilePath = path.join(process.cwd(), ".runtime", "incidents.json");

  constructor() {
    this.hydrate();
  }

  private hydrate(): void {
    try {
      const raw = readFileSync(this.storageFilePath, "utf-8");
      const parsed = JSON.parse(raw) as Incident[];
      for (const incident of parsed) {
        this.storage.set(incident.id, incident);
      }
    } catch {
      // Keep empty storage when no persisted data exists.
    }
  }

  private persist(): void {
    mkdirSync(path.dirname(this.storageFilePath), { recursive: true });
    const payload = JSON.stringify([...this.storage.values()], null, 2);
    writeFileSync(this.storageFilePath, payload, "utf-8");
  }

  async save(incident: Incident): Promise<void> {
    this.storage.set(incident.id, incident);
    this.persist();
  }

  async getById(id: string): Promise<Incident | null> {
    return this.storage.get(id) ?? null;
  }

  async list(): Promise<Incident[]> {
    return [...this.storage.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }
}

const globalForIncidents = globalThis as unknown as {
  __digitalPioneerIncidentRepository?: InMemoryIncidentRepository;
};

if (!globalForIncidents.__digitalPioneerIncidentRepository) {
  globalForIncidents.__digitalPioneerIncidentRepository = new InMemoryIncidentRepository();
}

export const incidentRepository = globalForIncidents.__digitalPioneerIncidentRepository;
