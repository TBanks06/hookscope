"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { LiveMessage } from "./types";

/**
 * Subscribes to the live SSE stream for a project.
 * The browser auto-reconnects (server sends `retry: 3000`).
 * The callback is kept in a ref so resubscribes only happen when projectId changes.
 */
export function useEventStream(projectId: string | null, onMessage: (m: LiveMessage) => void) {
  const cb = useRef(onMessage);
  cb.current = onMessage;

  useEffect(() => {
    if (!projectId) return;
    const es = new EventSource(api.streamUrl(projectId));
    es.onmessage = (e) => {
      try { cb.current(JSON.parse(e.data) as LiveMessage); } catch { /* ignore malformed frames */ }
    };
    // onerror intentionally empty: EventSource retries on its own.
    return () => es.close();
  }, [projectId]);
}

/** Re-render every `ms` so relative timestamps ("12s ago") stay fresh. */
export function useNow(ms = 15_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
