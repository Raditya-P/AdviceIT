"use client";

/* The hero visual. It is not a mock-up: the card runs the real AI advisor on
   one example profile and prints what it actually answers, including the two
   strongest drivers from the exact Shapley values. */

import { useMemo } from "react";
import { ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { AllocationBar, AllocationLegend } from "@/components/allocation-bar";
import { mlRecommend } from "@/lib/advisor/advisors";
import { featureExplanation } from "@/lib/advisor/explanations";
import { outcomeName } from "@/lib/advisor/strings";
import { tr, useLang } from "@/lib/i18n";

const EXAMPLE = {
  age: 38,
  horizon: 18,
  tolerance: "medium" as const,
  emergencyFund: true,
  incomeStable: true,
  debtObligations: false,
  nearTermNeed: false,
  knowledge: "intermediate",
};

export function AdvicePreview() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const { result, drivers } = useMemo(() => {
    const r = mlRecommend(EXAMPLE);
    const fx = featureExplanation(r);
    return { result: r, drivers: fx.items.slice(0, 2) };
  }, []);
  const pct = Math.round(result.topProbability * 100);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="preview-glow"
      />
      <div className="panel rise rise-2 relative overflow-hidden p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("Recommended outcome", "Hasil yang direkomendasikan")}
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{outcomeName(result.portfolio.name)}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
            <ShieldCheck className="size-4" aria-hidden />
            {pct}%
          </div>
        </div>

        {result.portfolio.allocation && (
          <div className="mt-5 space-y-3">
            <AllocationBar allocation={result.portfolio.allocation} />
            <AllocationLegend allocation={result.portfolio.allocation} />
          </div>
        )}

        <div className="mt-5 space-y-2 rounded-2xl border border-border/80 bg-background/70 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden />
            {t("What drove this", "Apa yang mendorongnya")}
          </p>
          <ul className="space-y-1.5 text-sm">
            {drivers.map((d) => (
              <li key={d.key} className="flex items-baseline justify-between gap-3">
                <span className="text-muted-foreground">
                  {d.label}: <span className="text-foreground">{d.valueText}</span>
                </span>
                <span
                  className={`shrink-0 tabular-nums font-medium ${d.points >= 0 ? "text-primary" : "text-muted-foreground"}`}
                >
                  {d.points >= 0 ? "+" : ""}
                  {d.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel float-slow absolute -bottom-7 -left-4 hidden max-w-[15rem] items-start gap-2.5 p-3.5 text-sm sm:flex md:-left-10">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <TrendingUp className="size-4" aria-hidden />
        </span>
        <p className="text-muted-foreground">
          {t(
            "Live output of the advisor, computed in your browser.",
            "Keluaran langsung dari penasihat, dihitung di browser Anda.",
          )}
        </p>
      </div>
    </div>
  );
}
