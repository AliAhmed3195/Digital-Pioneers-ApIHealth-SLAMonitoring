import type { Incident, IncidentRepository } from "@/modules/incidents/domain/IncidentRepository";
import type { EndpointMetrics, RiskAssessment } from "@/shared/contracts/core";

export type EndpointRiskSnapshot = {
  endpoint: string;
  metrics: EndpointMetrics["window"];
  assessment: RiskAssessment;
};

function createIncidentId(): string {
  return `inc_${Math.random().toString(36).slice(2, 10)}`;
}

export class IncidentEngineService {
  constructor(private readonly repository: IncidentRepository) {}

  async syncFromSnapshots(snapshots: EndpointRiskSnapshot[]): Promise<Incident[]> {
    const incidents = await this.repository.list();
    const now = new Date().toISOString();

    for (const snapshot of snapshots) {
      const signature = `${snapshot.endpoint}:${snapshot.assessment.level}`;
      const activeIncident = incidents.find(
        (item) =>
          item.signature === signature &&
          (item.status === "OPEN" || item.status === "ACKNOWLEDGED")
      );

      if (snapshot.assessment.level === "GREEN") {
        const endpointActive = incidents.filter(
          (item) =>
            item.endpoint === snapshot.endpoint &&
            (item.status === "OPEN" || item.status === "ACKNOWLEDGED")
        );
        for (const item of endpointActive) {
          await this.repository.save({
            ...item,
            status: "RESOLVED",
            updatedAt: now
          });
        }
        continue;
      }

      if (activeIncident) {
        await this.repository.save({
          ...activeIncident,
          riskLevel: snapshot.assessment.level,
          riskScore: snapshot.assessment.score,
          reasons: snapshot.assessment.reasons,
          updatedAt: now
        });
        continue;
      }

      await this.repository.save({
        id: createIncidentId(),
        signature,
        endpoint: snapshot.endpoint,
        title: `${snapshot.endpoint} SLA risk detected`,
        riskLevel: snapshot.assessment.level,
        riskScore: snapshot.assessment.score,
        reasons: snapshot.assessment.reasons,
        status: "OPEN",
        createdAt: now,
        updatedAt: now
      });
    }

    return this.repository.list();
  }
}
