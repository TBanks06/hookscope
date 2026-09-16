import Link from "next/link";
import { ArrowRight, Radar, SearchX, PencilRuler, Repeat2, RefreshCcw, Activity, Zap } from "lucide-react";

/* The exact value loop we sell — mirrors the product pipeline 1:1. */
const PIPELINE = [
  { icon: Zap,          title: "Receive",        copy: "One secret URL per project. Any sender, any schema, zero setup." },
  { icon: Radar,        title: "Inspect",        copy: "Headers, query, raw payload and timing — streamed live over SSE." },
  { icon: SearchX,      title: "Detect failure", copy: "Broken JSON claims, truncated bodies and bad actors are flagged on arrival." },
  { icon: Repeat2,      title: "Replay",         copy: "Fire the event at any endpoint with one click — perfect for staging." },
  { icon: PencilRuler,  title: "Modify payload", copy: "Edit the JSON inline, change headers, switch methods. Then send." },
  { icon: RefreshCcw,   title: "Retry automatically", copy: "Failed deliveries re-queue with exponential backoff. No cron jobs, no babysitting." },
  { icon: Activity,     title: "Monitor delivery", copy: "Every attempt logged: status code, latency, response excerpt." },
];

const FEATURES = [
  { title: "Real-time by default", copy: "Events appear the millisecond they land — Server-Sent Events over Redis pub/sub. No refresh button." },
  { title: "Replay-first design", copy: "Most tools stop at 'display'. Hookscope starts there: replay, edit, retry, verify." },
  { title: "Delivery audit trail", copy: "Each replay keeps a full attempt log so you can prove what happened, when, and why." },
  { title: "Secret, rotatable URLs", copy: "Every project URL is 192 bits of entropy. Leaked it? Rotate without losing history." },
  { title: "Built for teams", copy: "Projects isolate environments: production, staging, partner sandboxes — each with its own stream." },
  { title: "Self-hostable", copy: "One docker-compose file. Your payloads never have to touch someone else's cloud." },
];

const PLANS = [
  { name: "Free", price: "$0", highlight: false, perks: ["1 project", "1,000 events / mo", "24h retention", "Manual replay"] },
  { name: "Pro", price: "$12", highlight: true, perks: ["10 projects", "100k events / mo", "30-day retention", "Auto-retry + backoff", "Payload editor"] },
  { name: "Team", price: "$49", highlight: false, perks: ["Unlimited projects", "1M events / mo", "90-day retention", "Members & SSO", "Priority support"] },
];

const FAQ = [
  { q: "What is a webhook inspector?", a: "A webhook inspector gives you a public URL that captures incoming webhook calls so you can view headers, payloads and responses — without deploying code. Hookscope adds replay, payload editing, automatic retries and delivery monitoring on top." },
  { q: "How is Hookscope different from webhook.site or ngrok?", a: "webhook.site shows you what arrived; ngrok tunnels traffic to your laptop. Hookscope focuses on the part after capture: detecting failures, replaying events with modified payloads, retrying with backoff, and monitoring every delivery attempt." },
  { q: "Is my data secure?", a: "Ingest URLs are unguessable 192-bit tokens and can be rotated instantly. Dashboard access uses JWT auth, and every payload is tenant-scoped. You can also self-host the entire stack with Docker." },
  { q: "Can I replay webhooks to localhost?", a: "Yes — point any replay at http://localhost:PORT on your machine, edit the payload if needed, and watch your handler react. Failed attempts retry automatically." },
];

/* JSON-LD for rich results: software product + FAQ. */
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Hookscope",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: "Webhook inspector with replay, payload editing, automatic retries and delivery monitoring.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300">⚡</span>
            Hookscope
          </a>
          <div className="hidden items-center gap-8 text-sm text-zinc-400 sm:flex">
            <a className="transition hover:text-zinc-100" href="#pipeline">How it works</a>
            <a className="transition hover:text-zinc-100" href="#features">Features</a>
            <a className="transition hover:text-zinc-100" href="#pricing">Pricing</a>
            <a className="transition hover:text-zinc-100" href="#faq">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-zinc-300 transition hover:text-white">Sign in</Link>
            <Link href="/login?mode=register"
              className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-[.98]">
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section aria-labelledby="hero-title" className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(52_211_153/0.12),transparent)]" />
          <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-20 lg:grid-cols-2 lg:items-center">
            <div className="animate-fade-in">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse-dot" /> Live webhook debugging
              </p>
              <h1 id="hero-title" className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                See every webhook.<br />
                <span className="text-emerald-300">Fix the ones that fail.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-zinc-400">
                Capture webhooks on a secret URL, inspect them in real time, then replay with an edited payload —
                automatic retries and delivery monitoring included.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/login?mode=register"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-[.98]">
                  Start inspecting — free <ArrowRight className="size-4" aria-hidden />
                </Link>
                <a href="#pipeline" className="text-sm text-zinc-400 underline-offset-4 transition hover:text-white hover:underline">
                  See the pipeline
                </a>
              </div>
            </div>

            {/* Decorative terminal mock — sells the product in one glance */}
            <figure aria-label="Example of a captured webhook" className="animate-slide-in">
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-2xl shadow-emerald-400/5">
                <figcaption className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3 text-xs text-zinc-500">
                  <span className="size-2.5 rounded-full bg-rose-400/70" />
                  <span className="size-2.5 rounded-full bg-amber-400/70" />
                  <span className="size-2.5 rounded-full bg-emerald-400/70" />
                  <span className="ml-3 font-mono">POST /hooks/7f3…k2 — received 2s ago</span>
                </figcaption>
                <pre className="scrollbar-thin overflow-x-auto p-5 font-mono text-[13px] leading-6">
                  <code>
                    <span className="text-zinc-500">{"{"}</span>{"\n"}
                    {"  "}<span className="text-sky-300">"event"</span><span className="text-zinc-500">:</span> <span className="text-emerald-300">"invoice.paid"</span><span className="text-zinc-500">,</span>{"\n"}
                    {"  "}<span className="text-sky-300">"amount"</span><span className="text-zinc-500">:</span> <span className="text-amber-300">4200</span><span className="text-zinc-500">,</span>{"\n"}
                    {"  "}<span className="text-sky-300">"customer"</span><span className="text-zinc-500">:</span> <span className="text-emerald-300">"cus_9f2b1"</span>{"\n"}
                    <span className="text-zinc-500">{"}"}</span>{"\n\n"}
                    <span className="text-zinc-600">→ replay to https://staging.example.com/hooks</span>{"\n"}
                    <span className="text-emerald-400">✓ 200 OK · 142 ms · attempt 1/5</span>
                  </code>
                </pre>
              </div>
            </figure>
          </div>
        </section>

        {/* ── Pipeline (the core loop) ─────────────────────────────── */}
        <section id="pipeline" aria-labelledby="pipeline-title" className="border-t border-zinc-800/60 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 id="pipeline-title" className="text-3xl font-bold tracking-tight">From received to resolved</h2>
            <p className="mt-3 max-w-2xl text-zinc-400">
              “Receive and display” is table stakes. Hookscope covers the whole loop that actually ships fixes:
            </p>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PIPELINE.map((step, i) => (
                <li key={step.title}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-zinc-900/80">
                  <div className="flex items-center justify-between">
                    <step.icon className="size-5 text-emerald-300" aria-hidden />
                    <span className="font-mono text-xs text-zinc-600">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{step.copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────── */}
        <section id="features" aria-labelledby="features-title" className="border-t border-zinc-800/60 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 id="features-title" className="text-3xl font-bold tracking-tight">Why teams switch</h2>
            <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article key={f.title}>
                  <h3 className="font-semibold text-zinc-100">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────────── */}
        <section id="pricing" aria-labelledby="pricing-title" className="border-t border-zinc-800/60 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 id="pricing-title" className="text-3xl font-bold tracking-tight">Simple pricing</h2>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <article key={plan.name} aria-label={`${plan.name} plan`}
                  className={`relative rounded-2xl border p-7 transition hover:-translate-y-1 ${
                    plan.highlight
                      ? "border-emerald-400/40 bg-emerald-400/5 shadow-lg shadow-emerald-400/10"
                      : "border-zinc-800 bg-zinc-900/40"
                  }`}>
                  {plan.highlight && (
                    <span className="absolute -top-3 left-6 rounded-full bg-emerald-400 px-3 py-0.5 text-xs font-bold text-zinc-950">
                      Most popular
                    </span>
                  )}
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="mt-2 text-4xl font-bold">
                    {plan.price}<span className="text-base font-normal text-zinc-500">/mo</span>
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm text-zinc-400">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex gap-2">
                        <span aria-hidden className="text-emerald-300">✓</span>{perk}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login?mode=register"
                    className={`mt-8 block rounded-xl py-2.5 text-center text-sm font-semibold transition active:scale-[.98] ${
                      plan.highlight
                        ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
                        : "border border-zinc-700 text-zinc-200 hover:border-zinc-500"
                    }`}>
                    Choose {plan.name}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section id="faq" aria-labelledby="faq-title" className="border-t border-zinc-800/60 py-20">
          <div className="mx-auto max-w-3xl px-6">
            <h2 id="faq-title" className="text-3xl font-bold tracking-tight">FAQ</h2>
            <dl className="mt-8 space-y-6">
              {FAQ.map((f) => (
                <div key={f.q} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                  <dt className="font-semibold">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-zinc-400">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Hookscope. All rights reserved.</p>
          <nav aria-label="Footer" className="flex gap-6">
            <a className="transition hover:text-zinc-300" href="#pipeline">How it works</a>
            <a className="transition hover:text-zinc-300" href="/login">Dashboard</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
