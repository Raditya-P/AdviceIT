"use client";

/* Two-language support (English, Bahasa Indonesia). The locale lives in a
   cookie so the server renders the right language on first paint, and in
   context so client components re-render on toggle. The provider also sets
   the module-level locale used by the explanation sentence generators
   (src/lib/advisor/strings.ts) before children render. */

import { createContext, useCallback, useContext, useState } from "react";
import { setStringsLocale } from "@/lib/advisor/strings";

export type Locale = "en" | "id";
export const COOKIE = "adviceit-lang";

const LangContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: "en",
  setLocale: () => {},
});

export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  // Keep the sentence generators in sync during render, on server and client.
  setStringsLocale(locale);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      document.cookie = `${COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
    } catch {
      /* no document during SSR */
    }
  }, []);
  return <LangContext.Provider value={{ locale, setLocale }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Pick the right variant: tr(locale, { en: "...", id: "..." }) */
export function tr<T>(locale: Locale, v: { en: T; id: T }): T {
  return locale === "id" ? v.id : v.en;
}
