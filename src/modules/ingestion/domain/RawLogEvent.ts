export type RawLogEvent = {
  timestamp?: string;
  time?: string;
  endpoint?: string;
  path?: string;
  route?: string;
  method?: string;
  status?: number;
  status_code?: number;
  latency_ms?: number;
  latency?: number;
  response_time_ms?: number;
  request_id?: string;
  requestId?: string;
  error?: string;
  error_message?: string;
};
