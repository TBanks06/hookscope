"use client";
import { useEffect, useMemo, useState } from "react";
import { X, Send, Sparkles, Minimize2, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { api, ApiError } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";
import { Json } from "./Json";
import { timeAgo } from "@/lib/time";
import type { Attempt, Delivery, WebhookEventDetail } from "@/lib/types";

interface Props {
  eventId: string;
  projectId: string;
  deliveries: Delivery[];          // kept fresh by the SSE stream in the parent
  initialTab?: "inspect" | "replay";
  onClose: () => void;
}

type Tab = "inspect" | "replay";

/** Right-hand inspector: headers/payload tabs + replay editor + delivery timeline. */
export function EventDrawer({ eventId, projectId, deliveries, initialTab = "inspect", onClose }: Props) {
  const [detail, setDetail] = useState<WebhookEventDetail | null>(null);
  const [tab, setTab] = useState<Tab>(initialTab);

  // Replay form state. Target URL is remembered per project — the #1 repeated action.
  const targetKey = `hookscope_target_${projectId}`;
  const [target, setTarget] = useState(() => localStorage.getItem(targetKey) ?? "");
  const [payload, setPayload] = useState<string | null>(null);   // null = "use original"
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch full event once when opened.
  useEffect(() => {
    let alive = true;
    api.event(eventId).then((d) => { if (alive) { setDetail(d); setPayload(d.body); } }).catch(() => {});
    return () => { alive = false; };
  }, [eventId]);

  // Close on Escape — the tiny UX detail people notice.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const payloadIsJson = useMemo(() => {
    try { JSON.parse(payload ?? ""); return true; } catch { return false; }
  }, [payload]);

  async function sendReplay() {
    if (!target || !detail) return;
    setSending(true);
    setError(null);
    try {
      localStorage.setItem(targetKey, target);
      await api.replay(detail.id, { target_url: target, payload: payload ?? undefined });
      setTab("replay"); // jump to the delivery timeline to watch it happen
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Replay failed");
    } finally {
      setSending(false);
    }
  }

  function pretty() {
    try { setPayload(JSON.stringify(JSON.parse(payload ?? ""), null, 2)); } catch { /* ignore */ }
  }
  function minify() {
    try { setPayload(JSON.stringify(JSON.parse(payload ?? ""))); } catch { /* ignore */ }
  }

  return (
    <aside aria-label="Event inspector" className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl animate-drawer-in">
      {/* header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          {detail && <StatusBadge status={detail.status} />}
          <h2 className="font-mono text-sm text-zinc-300">{detail?.method} {detail?.path}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close inspector"
          className="grid size-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white active:scale-90">
          <X className="size-4" />
        </button>
      </header>

      {/* tabs */}
      <nav aria-label="Inspector sections" className="flex gap-1 border-b border-zinc-800 px-6 pt-3">
        {(["inspect", "replay"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            aria-current={tab === t}
            className={clsx(
              "rounded-t-lg px-4 py-2 text-sm font-medium capitalize transition",
              tab === t ? "border-b-2 border-emerald-400 text-white" : "text-zinc-500 hover:text-zinc-300",
            )}>
            {t === "inspect" ? "Headers & payload" : `Replay${deliveries.length ? ` (${deliveries.length})` : ""}`}
          </button>
        ))}
      </nav>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
        {!detail && <p className="text-sm text-zinc-500">Loading…</p>}

        {detail && tab === "inspect" && (
          <div className="space-y-6">
            <section aria-label="Headers">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Headers</h3>
              <dl className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 font-mono text-[13px]">
                {Object.entries(detail.headers).map(([k, v]) => (
                  <div key={k} className="flex gap-3 border-b border-zinc-800/60 px-4 py-2 last:border-0">
                    <dt className="w-48 shrink-0 truncate text-sky-300">{k}</dt>
                    <dd className="min-w-0 break-all text-zinc-300">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {Object.keys(detail.query).length > 0 && (
              <section aria-label="Query string">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Query</h3>
                <Json value={JSON.stringify(detail.query)} />
              </section>
            )}

            <section aria-label="Payload">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Payload {detail.truncated && <span className="ml-2 text-amber-300">(truncated at 1 MB)</span>}
              </h3>
              {detail.body ? <Json value={detail.body} max-h-96 /> : <p className="text-sm text-zinc-600">Empty body</p>}
            </section>
          </div>
        )}

        {detail && tab === "replay" && (
          <div className="space-y-6">
            {/* replay form */}
            <section aria-label="Replay form" className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">Target URL</span>
                <input
                  type="url" required value={target} onChange={(e) => setTarget(e.target.value)}
                  placeholder="https://staging.example.com/hooks/stripe"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 font-mono text-sm text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
                />
              </label>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Payload (editable)</span>
                  <div className="flex items-center gap-2">
                    {/* live validity hint while editing */}
                    <span className={clsx("text-xs", payloadIsJson ? "text-emerald-300" : "text-amber-300")}>
                      {payloadIsJson ? "✓ valid JSON" : "not JSON"}
                    </span>
                    <button type="button" onClick={pretty} className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition hover:border-zinc-500 active:scale-95">
                      <Sparkles className="size-3" /> Pretty
                    </button>
                    <button type="button" onClick={minify} className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition hover:border-zinc-500 active:scale-95">
                      <Minimize2 className="size-3" /> Minify
                    </button>
                  </div>
                </div>
                <textarea
                  value={payload ?? ""} onChange={(e) => setPayload(e.target.value)} rows={10} spellCheck={false}
                  aria-label="Payload editor"
                  className="scrollbar-thin w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-[13px] leading-6 text-zinc-200 outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>

              {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}

              <button
                type="button" onClick={sendReplay} disabled={sending || !target}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="size-4" aria-hidden />
                {sending ? "Queuing…" : "Replay event"}
              </button>
              <p className="text-center text-xs text-zinc-600">Failed deliveries retry automatically with backoff (2s → 4s → 8s…).</p>
            </section>

            {/* delivery timeline */}
            <section aria-label="Delivery history">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Deliveries</h3>
              {deliveries.length === 0 && <p className="text-sm text-zinc-600">No replays yet.</p>}
              <ul className="space-y-3">
                {deliveries.map((d) => (
                  <li key={d.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <code className="max-w-[280px] truncate font-mono text-xs text-zinc-400" title={d.target_url}>
                        {d.method} {d.target_url}
                      </code>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      attempt {d.attempts}/{d.max_attempts}
                      {d.latency_ms != null && <> · {d.latency_ms} ms</>}
                      {d.last_error && <span className="text-rose-300"> · {d.last_error}</span>}
                    </p>
                    <AttemptLog attempts={d.attempt_log} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}

/** Collapsible per-attempt detail: status code, latency, response excerpt. */
function AttemptLog({ attempts }: { attempts: Attempt[] }) {
  const [open, setOpen] = useState(false);
  if (attempts.length === 0) return null;
  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs text-zinc-400 transition hover:text-zinc-200">
        <ChevronDown className={clsx("size-3.5 transition-transform", open && "rotate-180")} />
        {attempts.length} attempt{attempts.length > 1 ? "s" : ""}
      </button>
      {open && (
        <ol className="mt-2 space-y-2">
          {attempts.map((a) => (
            <li key={a.n} className="rounded-lg bg-zinc-950/70 p-3 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="text-zinc-500">#{a.n}</span>
                <span className={a.status_code && a.status_code < 300 ? "text-emerald-300" : "text-rose-300"}>
                  {a.status_code ?? "network error"}
                </span>
                {a.latency_ms != null && <span className="text-zinc-500">{a.latency_ms} ms</span>}
                <span className="ml-auto text-zinc-600">{timeAgo(a.at)}</span>
              </div>
              {a.error && <p className="mt-1 break-all text-rose-300/80">{a.error}</p>}
              {a.response && <pre className="scrollbar-thin mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all text-zinc-400">{a.response}</pre>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
