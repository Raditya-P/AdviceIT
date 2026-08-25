"use client";

import { AlertTriangle, UserRound } from "lucide-react";
import { AllocationBar, AllocationLegend } from "@/components/allocation-bar";
import { Badge } from "@/components/ui/badge";
import { ADVISORS } from "@/lib/advisor/advisors";
import { escalationReason, labelValue, outcomeName, outcomeSummary } from "@/lib/advisor/strings";
import type { AdvisorResult } from "@/lib/advisor/types";
import { tr, useLang } from "@/lib/i18n";

export function advisorDisplayName(id: "ml" | "logit", locale: "en" | "id") {
  if (locale === "id") return id === "ml" ? "Penasihat AI" : "Penasihat interpretable berbasis aturan";
  return ADVISORS[id].name;
}

export function RecommendationCard({
  result,
  researcher,
  showCompare,
}: {
  result: AdvisorResult;
  researcher?: boolean;
  showCompare?: boolean;
}) {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const pf = result.portfolio;
  const other = showCompare ? ADVISORS[result.advisor === "ml" ? "logit" : "ml"] : null;
  const otherOutcome = other ? other.recommend(result.profile).portfolio.name : null;
  const soundHere = result.flawed && result.soundPortfolio ? result.soundPortfolio.name : pf.name;

  return (
    <section className="panel relative overflow-hidden p-6 sm:p-7">
      <div
        aria-hidden
        className="card-topglow"
      />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t("Recommended outcome", "Hasil yang direkomendasikan")}
          </span>
          {researcher && (
            <Badge variant="secondary">
              {t("Advisor", "Penasihat")}: {advisorDisplayName(result.advisor, locale)}
            </Badge>
          )}
        </div>

        <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">{outcomeName(pf.name)}</h3>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">{outcomeSummary(pf.id, pf.summary)}</p>

        {pf.allocation ? (
          <div className="space-y-3 pt-1">
            <AllocationBar allocation={pf.allocation} />
            <AllocationLegend allocation={pf.allocation} />
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
            <UserRound className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="leading-relaxed">
              {escalationReason(result.advisor, result.labels.tolerance, result.labels.capacity, result.labels.liquidity)}
            </p>
          </div>
        )}

        {researcher && (
          <p className="border-t border-border/70 pt-3 text-xs text-muted-foreground">
            {t("Suitability labels: tolerance", "Label kesesuaian: toleransi")} {labelValue(result.labels.tolerance)},{" "}
            {t("capacity", "kapasitas")} {labelValue(result.labels.capacity)},{" "}
            {t("liquidity need", "kebutuhan likuiditas")} {labelValue(result.labels.liquidity)}.
            {otherOutcome && (
              <>
                {" "}
                {locale === "id"
                  ? `${advisorDisplayName(result.advisor === "ml" ? "logit" : "ml", "id")} akan menjawab`
                  : `The ${other!.name.toLowerCase()} would answer`}
                : {outcomeName(otherOutcome)}
                {otherOutcome === soundHere ? t(" (same outcome)", " (hasil yang sama)") : ""}.
              </>
            )}
          </p>
        )}

        {researcher && result.flawed && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="leading-relaxed">
              {t(
                `Flawed advice scenario active: this recommendation was deliberately shifted in the wrong direction (sound outcome: ${result.soundPortfolio ? result.soundPortfolio.name : ""}). Logged rows are marked as flawed.`,
                `Skenario saran keliru aktif: rekomendasi ini sengaja digeser ke arah yang salah (hasil yang tepat: ${result.soundPortfolio ? outcomeName(result.soundPortfolio.name) : ""}). Baris log ditandai sebagai keliru.`,
              )}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
