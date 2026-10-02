import { cookies } from "next/headers";
import { COOKIE, type Locale } from "@/lib/locale";

/* Locale for server components, read from the same cookie the client
   toggle writes. The header calls router.refresh() on toggle so server
   pages re-render in the new language. */
export async function pageLocale(): Promise<Locale> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === "id" ? "id" : "en";
}

/** A page title in the visitor's language, for the browser tab.
 *  Descriptions stay English: crawlers and link previews never carry the
 *  cookie, so they would only ever see the English text anyway. */
export async function localTitle(en: string, id: string): Promise<string> {
  return (await pageLocale()) === "id" ? id : en;
}
