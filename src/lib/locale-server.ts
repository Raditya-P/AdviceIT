import { cookies } from "next/headers";
import { COOKIE, type Locale } from "@/lib/i18n";

/* Locale for server components, read from the same cookie the client
   toggle writes. The header calls router.refresh() on toggle so server
   pages re-render in the new language. */
export async function pageLocale(): Promise<Locale> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === "id" ? "id" : "en";
}
