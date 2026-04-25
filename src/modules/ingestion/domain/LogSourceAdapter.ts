import type { NormalizedLogRecord } from "@/shared/contracts/core";

export interface LogSourceAdapter<TInput> {
  normalize(input: TInput): NormalizedLogRecord;
}
