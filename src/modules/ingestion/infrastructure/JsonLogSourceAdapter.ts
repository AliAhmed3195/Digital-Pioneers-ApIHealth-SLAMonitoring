import type { LogSourceAdapter } from "@/modules/ingestion/domain/LogSourceAdapter";
import type { RawLogEvent } from "@/modules/ingestion/domain/RawLogEvent";
import type { NormalizedLogRecord } from "@/shared/contracts/core";

export class JsonLogSourceAdapter implements LogSourceAdapter<RawLogEvent> {
  normalize(input: RawLogEvent): NormalizedLogRecord {
    const latencyValue =
      input.latency_ms ?? input.latency ?? input.response_time_ms ?? 0;
    const statusValue = input.status ?? input.status_code ?? 200;

    return {
      timestamp: input.timestamp ?? input.time ?? new Date().toISOString(),
      endpoint: input.endpoint ?? input.path ?? input.route ?? "/unknown",
      method: input.method ?? "GET",
      status: Number(statusValue),
      latencyMs: Number(latencyValue),
      requestId: input.request_id ?? input.requestId,
      errorMessage: input.error ?? input.error_message
    };
  }
}
