"use client";

/* The hand-off between the profile step and the recommendation. The advisor
   itself answers in milliseconds, so this screen paces the four things it
   does and then moves on. */

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { tr, useLang } from "@/lib/i18n";

const STEP_MS = 620;

export function Analyzing({ onDone, advisorName }: { onDone: () => void; advisorName: string }) {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const [stage, setStage] = useState(0);

  const stages = [
    t("Reading your answers", "Membaca jawaban Anda"),
    t("Deriving your suitability labels", "Menurunkan label kesesuaian Anda"),
    t("Running the advisor over the six outcomes", "Menjalankan penasihat pada enam hasil"),
    t("Computing the explanation", "Menghitung penjelasannya"),
  ];

  useEffect(() => {
    const timers = stages.map((_, i) => setTimeout(() => setStage(i + 1), STEP_MS * (i + 1)));
    const done = setTimeout(onDone, STEP_MS * stages.length + 320);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = Math.round((stage / stages.length) * 100);

  return (
    <div className="mx-auto max-w-xl py-16 text-center" role="status" aria-live="polite">
      <div className="relative mx-auto flex size-16 items-center justify-center">
        <span aria-hidden className="absolute inset-0 rounded-full bg-primary/10" />
        <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">
        {t("Analysing your profile", "Menganalisis profil Anda")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("Running on ", "Berjalan pada ")}
        {advisorName}
        {t(", entirely in your browser.", ", sepenuhnya di browser Anda.")}
      </p>

      <div aria-hidden className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(pct, 8)}%` }}
        />
      </div>

      <ul className="mt-6 space-y-2.5 text-left">
        {stages.map((s, i) => {
          const done = stage > i;
          const active = stage === i;
          return (
            <li
              key={s}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
              }`}
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                  done ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {done && <Check className="size-3" aria-hidden />}
              </span>
              {s}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
