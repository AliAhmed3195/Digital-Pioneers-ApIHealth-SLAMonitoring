import type { Incident } from "@/modules/incidents/domain/IncidentRepository";
import type { MetricWindow } from "@/shared/contracts/core";

export type GeneratedReport = {
  title: string;
  markdown: string;
};

export interface ReportGenerator {
  generate(input: { incident: Incident; metrics: MetricWindow }): Promise<GeneratedReport>;
}
