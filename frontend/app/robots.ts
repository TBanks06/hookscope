// app/robots.ts
import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hookscope.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard"] }], // keep the app out of SERPs
    sitemap: `${SITE}/sitemap.xml`,
  };
}
