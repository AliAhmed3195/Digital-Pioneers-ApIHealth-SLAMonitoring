import type { NormalizedLogRecord } from "@/shared/contracts/core";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type SimulationState = {
  activeScenario: string | null;
  logs: NormalizedLogRecord[];
  updatedAt: string | null;
};

const state: SimulationState = {
  activeScenario: null,
  logs: [],
  updatedAt: null
};

const stateDir = path.join(process.cwd(), ".runtime");
const stateFilePath = path.join(stateDir, "simulation-state.json");

async function persistState(): Promise<void> {
  await mkdir(stateDir, { recursive: true });
  await writeFile(stateFilePath, JSON.stringify(state), "utf-8");
}

async function hydrateState(): Promise<void> {
  try {
    const raw = await readFile(stateFilePath, "utf-8");
    const parsed = JSON.parse(raw) as SimulationState;
    state.activeScenario = parsed.activeScenario;
    state.logs = parsed.logs ?? [];
    state.updatedAt = parsed.updatedAt;
  } catch {
    // Keep default in-memory state if no persisted file exists yet.
  }
}

export async function setSimulationState(next: {
  activeScenario: string;
  logs: NormalizedLogRecord[];
}): Promise<void> {
  state.activeScenario = next.activeScenario;
  state.logs = next.logs;
  state.updatedAt = new Date().toISOString();
  await persistState();
}

export async function getSimulationState(): Promise<SimulationState> {
  if (state.logs.length === 0 && state.activeScenario === null) {
    await hydrateState();
  }
  return state;
}

export async function clearSimulationState(): Promise<void> {
  state.activeScenario = null;
  state.logs = [];
  state.updatedAt = null;
  await persistState();
}
