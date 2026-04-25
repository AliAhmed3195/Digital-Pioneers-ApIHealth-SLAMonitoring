import type {
  ReportRepository,
  StoredReport
} from "@/modules/reporting/domain/ReportRepository";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export class InMemoryReportRepository implements ReportRepository {
  private readonly storage = new Map<string, StoredReport>();
  private readonly storageFilePath = path.join(process.cwd(), ".runtime", "reports.json");

  constructor() {
    this.hydrate();
  }

  private hydrate(): void {
    try {
      const raw = readFileSync(this.storageFilePath, "utf-8");
      const parsed = JSON.parse(raw) as StoredReport[];
      for (const report of parsed) {
        this.storage.set(report.id, report);
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

  async save(report: StoredReport): Promise<void> {
    this.storage.set(report.id, report);
    this.persist();
  }

  async getById(id: string): Promise<StoredReport | null> {
    return this.storage.get(id) ?? null;
  }

  async list(): Promise<StoredReport[]> {
    return [...this.storage.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }
}

const globalForReports = globalThis as unknown as {
  __digitalPioneerReportRepository?: InMemoryReportRepository;
};

if (!globalForReports.__digitalPioneerReportRepository) {
  globalForReports.__digitalPioneerReportRepository = new InMemoryReportRepository();
}

export const reportRepository = globalForReports.__digitalPioneerReportRepository;
