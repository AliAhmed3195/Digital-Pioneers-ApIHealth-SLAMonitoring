export type SimulationScenario =
  | "LATENCY_RAMP"
  | "ERROR_SPIKE"
  | "SLOW_NO_ERROR";

export const simulationScenarios: SimulationScenario[] = [
  "LATENCY_RAMP",
  "ERROR_SPIKE",
  "SLOW_NO_ERROR"
];
