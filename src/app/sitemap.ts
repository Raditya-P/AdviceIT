import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* The public pages. /study is left out on purpose: the way in is
   /participate, which explains the session before it starts. Both
   languages share one address (the language is a cookie), so there are no
   per-language entries. */
const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/participate", priority: 0.9 },
  { path: "/advisor/ml", priority: 0.8 },
  { path: "/advisor/logit", priority: 0.8 },
  { path: "/about", priority: 0.7 },
  { path: "/design", priority: 0.6 },
  { path: "/training-data", priority: 0.6 },
  { path: "/references", priority: 0.4 },
  { path: "/privacy", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({
    url: p.path === "/" ? SITE_URL : `${SITE_URL}${p.path}`,
    changeFrequency: "monthly" as const,
    priority: p.priority,
  }));
}
