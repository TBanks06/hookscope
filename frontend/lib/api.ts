/* Tiny typed API client. Token lives in localStorage (SPA dashboard pattern).
   For harder security posture, swap to httpOnly cookie sessions server-side. */
import type { Delivery, EventPage, Project, Token, User, WebhookEventDetail } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
export const INGEST_BASE = process.env.NEXT_PUBLIC_INGEST_BASE ?? "http://localhost:8000/api/v1/hooks";

const TOKEN_KEY = "hookscope_token";

export const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY));
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") message = data.detail;
    } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // auth
  register: (email: string, password: string) =>
    request<Token>("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<Token>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request<User>("/auth/me"),

  // projects
  projects: () => request<Project[]>("/projects"),
  createProject: (name: string) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify({ name }) }),

  // events
  events: (projectId: string, params: { status?: string; q?: string; cursor?: string } = {}) => {
    const qs = new URLSearchParams({ project_id: projectId, limit: "100" });
    if (params.status) qs.set("status", params.status);
    if (params.q) qs.set("q", params.q);
    if (params.cursor) qs.set("cursor", params.cursor);
    return request<EventPage>(`/events?${qs}`);
  },
  event: (id: string) => request<WebhookEventDetail>(`/events/${id}`),
  deleteEvent: (id: string) => request<void>(`/events/${id}`, { method: "DELETE" }),

  // replay / deliveries
  replay: (eventId: string, body: { target_url: string; payload?: string; headers?: Record<string, string>; method?: string }) =>
    request<Delivery>(`/events/${eventId}/replay`, { method: "POST", body: JSON.stringify(body) }),
  deliveries: (eventId: string) => request<Delivery[]>(`/events/${eventId}/deliveries`),

  // SSE — token in query because EventSource can't set headers
  streamUrl: (projectId: string) =>
    `${API_URL}/stream/${projectId}?token=${encodeURIComponent(getToken() ?? "")}`,
};
