import type { MonitorRunRecord } from "@/modules/monitoring/domain/MonitorContracts";

class InMemoryMonitorRepository {
  private readonly runs: MonitorRunRecord[] = [];

  async save(run: MonitorRunRecord): Promise<void> {
    this.runs.unshift(run);
    if (this.runs.length > 100) {
      this.runs.length = 100;
    }
  }

  async latest(): Promise<MonitorRunRecord | null> {
    return this.runs[0] ?? null;
  }

  async list(): Promise<MonitorRunRecord[]> {
    return [...this.runs];
  }
}

export const monitorRepository = new InMemoryMonitorRepository();
