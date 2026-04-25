export type StoredReport = {
  id: string;
  incidentId: string;
  incidentTitle: string;
  endpoint: string;
  createdAt: string;
  title: string;
  markdown: string;
  source: "LLM" | "TEMPLATE";
};

export interface ReportRepository {
  save(report: StoredReport): Promise<void>;
  getById(id: string): Promise<StoredReport | null>;
  list(): Promise<StoredReport[]>;
}
