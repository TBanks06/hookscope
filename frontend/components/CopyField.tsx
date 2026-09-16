"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Read-only field with a copy button that flips into a green ✓ for 1.5s. */
export function CopyField({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2">
      {label && <span className="shrink-0 text-xs uppercase tracking-wider text-zinc-500">{label}</span>}
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300" title={value}>{value}</code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy to clipboard"}
        className={`grid size-7 shrink-0 place-items-center rounded-lg transition active:scale-90 ${
          copied ? "bg-emerald-400/20 text-emerald-300" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        }`}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}
