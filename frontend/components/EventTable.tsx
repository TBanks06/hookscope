"use client";
import clsx from "clsx";
import { Play, Trash2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { useNow } from "@/lib/hooks";
import { formatBytes, timeAgo } from "@/lib/time";
import type { Delivery, WebhookEvent } from "@/lib/types";

interface Props {
  events: WebhookEvent[];
  selectedId: string | null;
  lastDeliveryByEvent: Record<string, Delivery | undefined>;
  onSelect: (id: string) => void;
  onQuickReplay: (id: string) => void;   // opens the drawer focused on the Replay tab
  onDelete: (id: string) => void;
}

/** Semantic <table> for the event stream. Rows animate in when freshly received. */
export function EventTable({ events, selectedId, lastDeliveryByEvent, onSelect, onQuickReplay, onDelete }: Props) {
  const now = useNow();

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Received webhooks, newest first</caption>
        <thead>
          <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium">Webhook</th>
            <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Size</th>
            <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">Delivery</th>
            <th scope="col" className="px-4 py-3 font-medium">Time</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => {
            const isNew = now - Date.parse(ev.received_at) < 5_000; // entrance animation window
            const delivery = lastDeliveryByEvent[ev.id];
            return (
              <tr
                key={ev.id}
                onClick={() => onSelect(ev.id)}
                aria-selected={selectedId === ev.id}
                className={clsx(
                  "cursor-pointer border-b border-zinc-800/60 transition-colors last:border-0",
                  isNew && "animate-slide-in",
                  selectedId === ev.id ? "bg-emerald-400/5" : "hover:bg-zinc-800/40",
                )}
              >
                <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                <td className="max-w-[280px] px-4 py-3">
                  <span className="font-mono text-xs">
                    <span className="mr-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-300">{ev.method}</span>
                    <span className="text-zinc-400">{ev.content_type || "—"}</span>
                  </span>
                </td>
                <td className="hidden px-4 py-3 font-mono text-xs text-zinc-500 md:table-cell">{formatBytes(ev.size)}</td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  {delivery ? <StatusBadge status={delivery.status} /> : <span className="text-zinc-600">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400" title={new Date(ev.received_at).toLocaleString()}>
                  {timeAgo(ev.received_at, now)}
                </td>
                <td className="px-4 py-3">
                  {/* stopPropagation: row click opens the inspector instead */}
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => onQuickReplay(ev.id)} aria-label="Replay this event"
                      className="grid size-7 place-items-center rounded-lg text-zinc-400 transition hover:bg-emerald-400/10 hover:text-emerald-300 active:scale-90">
                      <Play className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => onDelete(ev.id)} aria-label="Delete this event"
                      className="grid size-7 place-items-center rounded-lg text-zinc-400 transition hover:bg-rose-400/10 hover:text-rose-300 active:scale-90">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
