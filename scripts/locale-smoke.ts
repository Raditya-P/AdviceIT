/* Locale smoke test: the first-visit language (detectLocale) and the
   ?lang= / cookie value check (asLocale). */
import { asLocale, detectLocale } from "@/lib/locale";

let failures = 0;
const ok = (cond: boolean, label: string) => {
  if (!cond) failures++;
  console.log(`${cond ? "ok  " : "FAIL"} ${label}`);
};

// Country first.
ok(detectLocale("ID", null) === "id", "visitor in Indonesia, no browser preference -> id");
ok(detectLocale("ID", "en-US,en;q=0.9") === "id", "visitor in Indonesia with an English browser -> id");
ok(detectLocale(" id ", null) === "id", "country code is trimmed and case-insensitive");
ok(detectLocale("SG", "en-SG,en;q=0.9") === "en", "visitor in Singapore with an English browser -> en");

// Then the browser, in order of preference.
ok(detectLocale(null, "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7") === "id", "Indonesian browser abroad -> id");
ok(detectLocale("NL", "in-ID,in;q=0.9,en;q=0.8") === "id", "older Android code 'in' -> id");
ok(detectLocale("AU", "en-AU,en;q=0.9,id;q=0.8") === "en", "English ranked above Indonesian -> en");
ok(detectLocale("JP", "ja-JP,ja;q=0.9,id;q=0.8,en;q=0.7") === "id", "Japanese first, then Indonesian before English -> id");
ok(detectLocale("JP", "ja-JP,ja;q=0.9,en;q=0.8,id;q=0.7") === "en", "Japanese first, then English before Indonesian -> en");
ok(detectLocale(null, "en;q=0.5,id;q=0.9") === "id", "q-values decide, not the written order");
ok(detectLocale(null, "id;q=0,en") === "en", "q=0 means not wanted");
ok(detectLocale(null, "*") === "en", "wildcard only -> en");
ok(detectLocale(null, "fr-FR,fr;q=0.9") === "en", "neither language -> en");
ok(detectLocale(null, "id;q=abc,en;q=0.5") === "en", "malformed q-value is ignored");

// Nothing known: English, as before.
ok(detectLocale(null, null) === "en", "no country, no browser preference -> en");
ok(detectLocale("", "") === "en", "empty headers -> en");

// asLocale.
ok(asLocale("id") === "id" && asLocale("EN") === "en" && asLocale(" id ") === "id", "asLocale accepts id and en");
ok(asLocale("fr") === null && asLocale("") === null && asLocale(null) === null && asLocale(undefined) === null, "asLocale rejects anything else");

console.log(failures ? `\n${failures} failure(s)` : "\nall locale checks passed");
process.exit(failures ? 1 : 0);
