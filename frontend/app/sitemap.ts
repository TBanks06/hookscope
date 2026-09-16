// app/sitemap.ts — keeps crawlers pointed at every indexable route
import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hookscope.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
