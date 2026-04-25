import type { RiskLevel } from "@/shared/contracts/core";

type StatusChipProps = {
  level: RiskLevel;
};

export function StatusChip({ level }: StatusChipProps) {
  const className =
    level === "RED" ? "chip chip-red" : level === "AMBER" ? "chip chip-amber" : "chip chip-green";
  return <span className={className} aria-label={level} title={level} />;
}
