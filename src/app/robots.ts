import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* Every public page may be crawled. The researcher dashboard and the data
   API are not pages anyone should land on from a search. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/researcher", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
