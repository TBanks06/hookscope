import { useMemo } from "react";

/* Minimal, dependency-free JSON syntax highlighter.
   Strategy: HTML-escape first, then wrap tokens in colored spans. */
function highlight(src: string): string {
  const escaped = src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match, str: string | undefined, colon: string | undefined, keyword: string | undefined) => {
      if (str !== undefined) {
        return colon
          ? `<span class="text-sky-300">${str}</span>${colon}`      // object key
          : `<span class="text-emerald-300">${str}</span>`;          // string value
      }
      if (keyword) return `<span class="text-rose-300">${keyword}</span>`;
      return `<span class="text-amber-300">${match}</span>`;         // number
    },
  );
}

/** Pretty-prints if possible, then highlights. Falls back to raw text. */
export function Json({ value, className = "" }: { value: string; className?: string }) {
  const html = useMemo(() => {
    try {
      return highlight(JSON.stringify(JSON.parse(value), null, 2));
    } catch {
      return highlight(value); // not JSON → render as-is (still escaped)
    }
  }, [value]);

  return (
    <pre
      className={`scrollbar-thin overflow-auto rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 font-mono text-[13px] leading-6 text-zinc-300 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
