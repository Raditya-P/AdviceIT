import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, COOKIE_MAX_AGE, asLocale, detectLocale } from "@/lib/locale";

/* Settles the site language before a page renders.
   1. ?lang=id or ?lang=en, as used in the recruitment messages, sets the
      language and redirects to the same address without the parameter.
   2. A visitor who already has a language keeps it. The header toggle
      writes the same cookie, with the same options.
   3. On a first visit the language is picked from the visitor's country and
      browser (detectLocale), handed to this render through the request
      cookie, and remembered, so a study session cannot change language part
      way because the network or the VPN did. */
const COOKIE_OPTIONS = { path: "/", maxAge: COOKIE_MAX_AGE, sameSite: "lax" as const };

export function proxy(request: NextRequest) {
  const param = request.nextUrl.searchParams.get("lang");
  if (param !== null) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("lang");
    const res = NextResponse.redirect(url);
    const chosen = asLocale(param);
    if (chosen) res.cookies.set(COOKIE, chosen, COOKIE_OPTIONS);
    return res;
  }

  if (asLocale(request.cookies.get(COOKIE)?.value)) return NextResponse.next();

  const locale = detectLocale(request.headers.get("x-vercel-ip-country"), request.headers.get("accept-language"));
  request.cookies.set(COOKIE, locale);
  const res = NextResponse.next({ request: { headers: request.headers } });
  res.cookies.set(COOKIE, locale, COOKIE_OPTIONS);
  return res;
}

/* Pages only: not the API routes (they take the language from the request
   body), Next's own files, or anything with a file extension. */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
