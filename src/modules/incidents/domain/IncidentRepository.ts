import type { RiskLevel } from "@/shared/contracts/core";

export type IncidentStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export type Incident = {
  id: string;
  signature: string;
  endpoint: string;
  title: string;
  riskLevel: RiskLevel;
  riskScore: number;
  reasons: string[];
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
};

export interface IncidentRepository {
  save(incident: Incident): Promise<void>;
  getById(id: string): Promise<Incident | null>;
  list(): Promise<Incident[]>;
}
