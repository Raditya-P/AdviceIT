/* The locale type and the cookie that carries it, shared by server and
   client code. They live outside i18n.tsx on purpose: that file is a client
   module, and a server component that imports a value from a "use client"
   file gets a client reference, not the value. Imported from there, the
   cookie name the layout looked up was never "adviceit-lang", so every first
   paint was in English whatever the visitor had chosen. */
export type Locale = "en" | "id";
export const COOKIE = "adviceit-lang";

/** One year, whether the visitor chose the language or it was picked for
 *  them on the first visit (src/proxy.ts). */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** "id" or "en" from a ?lang= or cookie value, otherwise null. */
export function asLocale(value: string | null | undefined): Locale | null {
  const v = (value ?? "").trim().toLowerCase();
  return v === "id" || v === "en" ? v : null;
}

/* The language for a first visit, before the visitor has chosen one.
   Indonesian for anyone connecting from Indonesia (Vercel puts the
   visitor's country on every request as x-vercel-ip-country). Otherwise
   whichever of Indonesian and English the browser ranks higher in
   Accept-Language; older Android phones send the retired code "in" for
   Indonesian. Otherwise English. */
export function detectLocale(country: string | null, acceptLanguage: string | null): Locale {
  if ((country ?? "").trim().toUpperCase() === "ID") return "id";
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part, order) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const q = qParam === undefined ? 1 : Number(qParam.slice(2));
      return { lang: tag.trim().toLowerCase().split("-")[0], q: Number.isFinite(q) ? q : 0, order };
    })
    .filter((x) => x.lang !== "" && x.q > 0)
    .sort((a, b) => b.q - a.q || a.order - b.order);
  for (const { lang } of ranked) {
    if (lang === "id" || lang === "in") return "id";
    if (lang === "en") return "en";
  }
  return "en";
}
