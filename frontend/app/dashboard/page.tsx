"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PauseCircle, Radio, RefreshCw, Search } from "lucide-react";
import clsx from "clsx";
import { api, ApiError, getToken, INGEST_BASE, setToken } from "@/lib/api";
import { useEventStream, useNow } from "@/lib/hooks";
import { EventTable } from "@/components/EventTable";
import { EventDrawer } from "@/components/EventDrawer";
import { CopyField } from "@/components/CopyField";
import type { Delivery, LiveMessage, Project, WebhookEvent } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();

  // --- data -------------------------------------------------------------
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [deliveriesByEvent, setDeliveriesByEvent] = useState<Record<string, Delivery[]>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"inspect" | "replay">("inspect");

  // --- UI state -----------------------------------------------------------
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paused, setPaused] = useState(false);
  const [connected, setConnected] = useState(false);
  const buffer = useRef<WebhookEvent[]>([]);   // holds arrivals while paused

  const project = projects.find((p) => p.id === projectId) ?? null;
  const now = useNow();

  // --- auth guard + bootstrap ------------------------------------------------
  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    (async () => {
      try {
        let list = await api.projects();
        if (list.length === 0) list = [await api.createProject("Default")]; // first-run onboarding
        setProjects(list);
        setProjectId(list[0].id);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) { setToken(null); router.replace("/login"); }
      }
    })();
  }, [router]);

  // --- initial load per project -------------------------------------------------
  useEffect(() => {
    if (!projectId) return;
    setEvents([]); setDeliveriesByEvent({}); setSelectedId(null);
    api.events(projectId).then((page) => setEvents(page.items)).catch(() => {});
  }, [projectId]);

  // --- live updates ---------------------------------------------------------------
  const onMessage = useCallback((m: LiveMessage) => {
    setConnected(true);
    if (m.type === "event") {
      const apply = () =>
        setEvents((prev) => (prev.some((e) => e.id === m.data.id) ? prev : [m.data, ...prev]));
      if (paused) buffer.current.push(m.data); else apply();
    } else if (m.type === "event_deleted") {
      setEvents((prev) => prev.filter((e) => e.id !== m.data.id));
    } else if (m.type === "delivery") {
      // upsert into the per-event list, newest first
      setDeliveriesByEvent((prev) => {
        const list = (prev[m.data.event_id] ?? []).filter((d) => d.id !== m.data.id);
        return { ...prev, [m.data.event_id]: [m.data, ...list] };
      });
    }
  }, [paused]);
  useEventStream(projectId, onMessage);

  // flushing the pause buffer when the user unpauses
  useEffect(() => {
    if (!paused && buffer.current.length) {
      const pending = buffer.current;
      buffer.current = [];
      setEvents((prev) => {
        const ids = new Set(prev.map((e) => e.id));
        return [...pending.filter((e) => !ids.has(e.id)), ...prev];
      });
    }
  }, [paused]);

  // --- derived ---------------------------------------------------------------
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return events.filter((e) => {
      if (statusFilter && e.status !== statusFilter) return false;
      if (needle && !`${e.path} ${e.content_type} ${e.source_ip ?? ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [events, q, statusFilter]);

  const lastDeliveryByEvent = useMemo(() => {
    const out: Record<string, Delivery | undefined> = {};
    for (const [k, v] of Object.entries(deliveriesByEvent)) out[k] = v[0];
    return out;
  }, [deliveriesByEvent]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this event permanently?")) return;
    await api.deleteEvent(id);              // SSE will also broadcast the deletion
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  if (!projectId) {
    return <main className="grid min-h-screen place-items-center text-sm text-zinc-500">Loading your workspace…</main>;
  }

  return (
    <div className="min-h-screen">
      {/* ── top bar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
            <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300">⚡</span>
            Hookscope
          </Link>

          {/* project switcher */}
          <select
            aria-label="Active project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm outline-none transition focus:border-emerald-400/50"
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          {/* live indicator: honest feedback about the SSE connection */}
          <span className="ml-auto hidden items-center gap-2 text-xs text-zinc-500 sm:flex" role="status">
            <span className={clsx("size-2 rounded-full", connected && !paused ? "bg-emerald-400 animate-pulse-dot" : "bg-zinc-600")} />
            {paused ? "Paused" : connected ? "Live" : "Connecting…"}
          </span>

          <button
            type="button"
            onClick={() => { setToken(null); router.replace("/login"); }}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* webhook URL — the one thing every new user needs immediately */}
        {project && (
          <section aria-label="Your webhook URL" className="mb-6">
            <CopyField label="Webhook URL" value={`${INGEST_BASE}/${project.ingest_key}`} />
            <p className="mt-2 text-xs text-zinc-600">
              Try it: <code className="font-mono">curl -X POST {INGEST_BASE}/{project.ingest_key} -H &apos;content-type: application/json&apos; -d &apos;{"{"}"hello":"world"{"}"}&apos;</code>
            </p>
          </section>
        )}

        {/* ── toolbar: search / filter / pause / refresh ─────────────── */}
        <section aria-label="Filters" className="mb-4 flex flex-wrap items-center gap-3">
          <label className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" aria-hidden />
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search content type, path, IP…"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
            />
          </label>

          <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400/50">
            <option value="">All statuses</option>
            <option value="received">Received</option>
            <option value="invalid">Invalid</option>
          </select>

          <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition active:scale-[.98]",
              paused ? "border-amber-400/40 bg-amber-400/10 text-amber-300" : "border-zinc-800 text-zinc-300 hover:border-zinc-600",
            )}>
            {paused ? <Radio className="size-4" /> : <PauseCircle className="size-4" />}
            {paused ? "Resume" : "Pause"}
          </button>

          <button type="button" onClick={() => api.events(projectId).then((p) => setEvents(p.items))}
            aria-label="Refresh events"
            className="grid size-10 place-items-center rounded-xl border border-zinc-800 text-zinc-400 transition hover:border-zinc-600 hover:text-white active:scale-90">
            <RefreshCw className="size-4" />
          </button>
        </section>

        {/* ── table / empty state ───────────────────────────────────── */}
        {visible.length === 0 ? (
          <section aria-label="No events" className="grid place-items-center rounded-2xl border border-dashed border-zinc-800 py-24 text-center animate-fade-in">
            <div className="max-w-md px-6">
              <p className="text-4xl" aria-hidden>📡</p>
              <h2 className="mt-4 text-lg font-semibold">Waiting for your first webhook</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Point any integration at your webhook URL above, or run the curl example.
                Events appear here <em>instantly</em> — no refresh needed.
              </p>
            </div>
          </section>
        ) : (
          <EventTable
            events={visible}
            selectedId={selectedId}
            lastDeliveryByEvent={lastDeliveryByEvent}
            onSelect={(id) => { setDrawerTab("inspect"); setSelectedId(id); }}
            onQuickReplay={(id) => { setDrawerTab("replay"); setSelectedId(id); }}
            onDelete={handleDelete}
          />
        )}

        <p className="mt-4 text-right text-xs text-zinc-600" aria-live="polite">
          {visible.length} event{visible.length === 1 ? "" : "s"} shown · updated {new Date(now).toLocaleTimeString()}
        </p>
      </main>

      {/* ── inspector drawer ────────────────────────────────────────── */}
      {selectedId && (
        <>
          <div aria-hidden onClick={() => setSelectedId(null)} className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm animate-fade-in" />
          <EventDrawer
            eventId={selectedId}
            projectId={projectId}
            deliveries={deliveriesByEvent[selectedId] ?? []}
            initialTab={drawerTab}
            onClose={() => setSelectedId(null)}
          />
        </>
      )}
    </div>
  );
}
