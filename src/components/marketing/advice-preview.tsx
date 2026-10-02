"use client";

/* The hero visual. It is not a mock-up: the card runs the real AI advisor on
   four example investors and shows what it actually answers for each, in
   turn, including the two strongest drivers from the exact Shapley values.

   The timing lives in CSS. The active dot fills over DWELL_MS and the end of
   that animation moves to the next example, so pausing (hover, keyboard
   focus or the pause button) is just pausing the animation, and under
   prefers-reduced-motion, where the fill does not run, the card stays on
   the first example until someone picks another. */

import { useMemo, useState, type CSSProperties } from "react";
import { Pause, Play, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { AllocationBar, AllocationLegend } from "@/components/allocation-bar";
import { AnimatedNumber } from "@/components/motion";
import { mlRecommend } from "@/lib/advisor/advisors";
import { featureExplanation } from "@/lib/advisor/explanations";
import { labelValue, outcomeName } from "@/lib/advisor/strings";
import type { RawProfile } from "@/lib/advisor/types";
import { tr, useLang, type Locale } from "@/lib/i18n";

const BASE = { incomeStable: true, debtObligations: false, nearTermNeed: false, knowledge: "intermediate" };

/* Four people the advisor answers differently: Growth, Aggressive growth,
   Balanced (where the horizon counts against the outcome) and Conservative. */
const EXAMPLES: RawProfile[] = [
  { ...BASE, age: 38, horizon: 18, tolerance: "medium", emergencyFund: true },
  { ...BASE, age: 26, horizon: 35, tolerance: "high", emergencyFund: true },
  { ...BASE, age: 42, horizon: 15, tolerance: "medium", emergencyFund: false },
  { ...BASE, age: 63, horizon: 5, tolerance: "low", emergencyFund: true },
];

const DWELL_MS = 6500;

/* The explanation sentences read the language set by the provider, so the
   runs are rebuilt when the language changes. */
function runAll(locale: Locale) {
  return EXAMPLES.map((profile) => {
    const result = mlRecommend(profile);
    const drivers = featureExplanation(result).items.slice(0, 2);
    return { profile, result, drivers, locale };
  });
}

function describe(p: RawProfile, locale: Locale) {
  const tol = labelValue(p.tolerance === "low" ? "Low" : p.tolerance === "high" ? "High" : "Moderate").toLowerCase();
  const parts =
    locale === "id"
      ? [`Usia ${p.age}`, `jangka waktu ${p.horizon} tahun`, `toleransi ${tol}`, ...(p.emergencyFund ? [] : ["tanpa dana darurat"])]
      : [`Age ${p.age}`, `${p.horizon}-year horizon`, `${tol} risk tolerance`, ...(p.emergencyFund ? [] : ["no emergency fund"])];
  return parts.join(" · ");
}

export function AdvicePreview() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const runs = useMemo(() => runAll(locale), [locale]);
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [holding, setHolding] = useState(false);
  const { profile, result, drivers } = runs[index];
  const pct = Math.round(result.topProbability * 100);
  const next = () => setIndex((i) => (i + 1) % runs.length);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHolding(true)}
      onMouseLeave={() => setHolding(false)}
      onFocus={() => setHolding(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHolding(false);
      }}
    >
      <div aria-hidden className="preview-glow" />
      <div className="panel rise rise-2 relative overflow-hidden p-6 sm:p-7">
        <p key={`who-${index}`} className="swap-in mb-4 min-h-[2lh] text-xs text-muted-foreground sm:min-h-0 sm:truncate">
          {describe(profile, locale)}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("Recommended outcome", "Hasil rekomendasi")}
            </p>
            <p key={`name-${index}`} className="swap-in mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {outcomeName(result.portfolio.name)}
            </p>
          </div>
          <div
            className="flex shrink-0 items-center gap-1.5 self-start rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
            title={t(
              "The advisor's calibrated confidence in this outcome. Not an expected return.",
              "Seberapa yakin penasihat pada hasil ini, setelah dikalibrasi. Ini bukan perkiraan imbal hasil.",
            )}
          >
            <ShieldCheck className="size-4" aria-hidden />
            <span className="text-xs font-normal text-muted-foreground">{t("confidence", "keyakinan")}</span>
            <span>
              <AnimatedNumber value={pct} />%
            </span>
          </div>
        </div>

        {result.portfolio.allocation && (
          <div className="mt-5 space-y-3">
            <AllocationBar allocation={result.portfolio.allocation} smooth />
            <AllocationLegend allocation={result.portfolio.allocation} animated />
          </div>
        )}

        <div className="mt-5 space-y-2 rounded-2xl border border-border/80 bg-background/70 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden />
            {t("What drove this", "Faktor penentunya")}
          </p>
          <ul key={`drivers-${index}`} className="space-y-1.5 text-sm">
            {drivers.map((d, i) => (
              <li
                key={d.key}
                className="swap-in flex min-h-[2lh] items-start justify-between gap-3 sm:min-h-0 sm:items-baseline"
                style={{ "--swap-delay": `${120 + i * 90}ms` } as CSSProperties}
              >
                <span className="line-clamp-2 text-muted-foreground sm:truncate">
                  {d.label}: <span className="text-foreground">{d.valueText}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    d.points >= 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {d.points >= 0 ? t("supports it", "mendukung") : t("weighs against it", "memberatkan")}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <p className="text-xs text-muted-foreground">
            {t(`Example investor ${index + 1} of ${runs.length}`, `Contoh investor ${index + 1} dari ${runs.length}`)}
          </p>
          <div className="flex items-center gap-1">
            <div className="flex items-center" role="group" aria-label={t("Example investors", "Contoh investor")}>
              {runs.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={t(`Example ${i + 1} of ${runs.length}`, `Contoh ${i + 1} dari ${runs.length}`)}
                  aria-current={i === index ? "true" : undefined}
                  className="group flex h-6 items-center px-1"
                >
                  <span
                    className={`relative block h-1.5 overflow-hidden rounded-full transition-all duration-500 ${
                      i === index ? "w-7 bg-primary/20" : "w-1.5 bg-border group-hover:bg-muted-foreground/40"
                    }`}
                  >
                    {i === index && (
                      <span
                        key={`fill-${index}`}
                        aria-hidden
                        className="dot-fill absolute inset-0 rounded-full bg-primary"
                        style={{ "--dot-ms": `${DWELL_MS}ms` } as CSSProperties}
                        data-paused={stopped || holding ? "" : undefined}
                        onAnimationEnd={next}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStopped((s) => !s)}
              aria-label={stopped ? t("Play the examples", "Putar contohnya") : t("Pause the examples", "Jeda contohnya")}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {stopped ? <Play className="size-3" aria-hidden /> : <Pause className="size-3" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      <div className="panel float-slow absolute -bottom-14 -left-4 hidden max-w-[18rem] items-start gap-2.5 p-3.5 text-sm sm:flex lg:-left-10">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <TrendingUp className="size-4" aria-hidden />
        </span>
        <p className="text-muted-foreground">
          {t(
            "Live output of the advisor computed in your browser.",
            "Hasil langsung dari penasihat, dihitung di browser Anda.",
          )}
        </p>
      </div>
    </div>
  );
}
