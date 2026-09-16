import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hookscope.dev";

/* Central SEO: every page inherits this; pages override via their own `metadata`. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Hookscope — Webhook Inspector, Replay & Auto-Retry",
    template: "%s · Hookscope",
  },
  description:
    "Capture any webhook in one URL, inspect headers and payloads in real time, detect failures instantly, then replay with a modified payload and automatic retries.",
  keywords: [
    "webhook inspector", "webhook replay", "webhook testing", "webhook debugger",
    "webhook.site alternative", "ngrok alternative", "API debugging",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Hookscope",
    title: "Hookscope — See every webhook. Fix the ones that fail.",
    description:
      "Inspect, replay, modify and auto-retry webhooks with delivery monitoring — in real time.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#09090b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="bg-zinc-950 font-sans text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
