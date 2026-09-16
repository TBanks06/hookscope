/* Mirror of the FastAPI schemas — keep in sync with backend/app/schemas.py */

export type EventStatus = "received" | "invalid";
export type DeliveryStatus = "queued" | "sending" | "delivered" | "failed";

export interface WebhookEvent {
  id: string;
  project_id: string;
  received_at: string;
  method: string;
  path: string;
  content_type: string;
  size: number;
  status: EventStatus;
  source_ip: string | null;
  is_valid_json: boolean | null;
  truncated: boolean;
}

export interface WebhookEventDetail extends WebhookEvent {
  headers: Record<string, string>;
  query: Record<string, string>;
  body: string;
}

export interface Project { id: string; name: string; ingest_key: string; created_at: string; }

export interface Attempt {
  n: number; at: string;
  status_code?: number; latency_ms?: number; response?: string; error?: string;
}

export interface Delivery {
  id: string; event_id: string;
  target_url: string; method: string;
  status: DeliveryStatus;
  attempts: number; max_attempts: number;
  last_status_code: number | null; last_error: string | null; latency_ms: number | null;
  attempt_log: Attempt[];
  created_at: string; updated_at: string;
}

export interface EventPage { items: WebhookEvent[]; next_cursor: string | null; }
export interface Token { access_token: string; token_type: string; }
export interface User { id: string; email: string; created_at: string; }

/* Messages pushed over SSE: {"type": ..., "data": ...} */
export type LiveMessage =
  | { type: "event"; data: WebhookEvent }
  | { type: "event_deleted"; data: { id: string } }
  | { type: "delivery"; data: Delivery };
