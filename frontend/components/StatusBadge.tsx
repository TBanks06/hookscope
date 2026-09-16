import clsx from "clsx";
import type { DeliveryStatus, EventStatus } from "@/lib/types";

/* Single source of truth for status colors across table, drawer and timeline. */
const META: Record<EventStatus | DeliveryStatus, { label: string; dot: string; chip: string; pulse?: boolean }> = {
  received:  { label: "Received",  dot: "bg-emerald-400", chip: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/20" },
  invalid:   { label: "Invalid",   dot: "bg-amber-400",   chip: "text-amber-300 bg-amber-400/10 ring-amber-400/20" },
  queued:    { label: "Queued",    dot: "bg-sky-400",     chip: "text-sky-300 bg-sky-400/10 ring-sky-400/20" },
  sending:   { label: "Sending",   dot: "bg-violet-400",  chip: "text-violet-300 bg-violet-400/10 ring-violet-400/20", pulse: true },
  delivered: { label: "Delivered", dot: "bg-emerald-400", chip: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/20" },
  failed:    { label: "Failed",    dot: "bg-rose-400",    chip: "text-rose-300 bg-rose-400/10 ring-rose-400/20" },
};

export function StatusBadge({ status }: { status: EventStatus | DeliveryStatus }) {
  const m = META[status];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1", m.chip)}>
      <span aria-hidden className={clsx("size-1.5 rounded-full", m.dot, m.pulse && "animate-pulse")} />
      {m.label}
    </span>
  );
}
