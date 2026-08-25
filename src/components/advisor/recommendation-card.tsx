"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ADVISORS } from "@/lib/advisor/advisors";
import { ASSET_CLASSES } from "@/lib/advisor/model";
import { assetLabel, escalationReason, labelValue, outcomeName, outcomeSummary } from "@/lib/advisor/strings";
import type { AdvisorResult } from "@/lib/advisor/types";
import { tr, useLang } from "@/lib/i18n";

const SEGMENT_STYLE: Record<string, string> = {
  equities: "bg-primary text-primary-foreground",
  bonds: "bg-primary/60 text-primary-foreground",
  cash: "bg-primary/25 text-foreground",
  realAssets: "bg-primary/80 text-primary-foreground",
};

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
  const ariaAlloc = pf.allocation
    ? ASSET_CLASSES.map((ac) => `${assetLabel(ac.label)} ${pf.allocation![ac.key]} ${t("percent", "persen")}`).join(", ")
    : t("no allocation, human review", "tanpa alokasi, tinjauan manusia");
  const other = showCompare ? ADVISORS[result.advisor === "ml" ? "logit" : "ml"] : null;
  const otherOutcome = other ? other.recommend(result.profile).portfolio.name : null;
  const soundHere = result.flawed && result.soundPortfolio ? result.soundPortfolio.name : pf.name;

  return (
    <Card className="bg-gradient-to-b from-card to-muted/40">
      <CardContent className="space-y-3 pt-6">
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
        <h3 className="text-3xl font-semibold tracking-tight">{outcomeName(pf.name)}</h3>

        {pf.allocation ? (
          <>
            <div role="img" aria-label={`${t("Allocation", "Alokasi")}: ${ariaAlloc}`} className="flex h-9 overflow-hidden rounded-lg border">
              {ASSET_CLASSES.map((ac) => {
                const pct = pf.allocation![ac.key];
                if (pct <= 0) return null;
                return (
                  <div
                    key={ac.key}
                    title={`${assetLabel(ac.label)} ${pct}%`}
                    className={`flex items-center justify-center overflow-hidden whitespace-nowrap text-xs font-semibold ${SEGMENT_STYLE[ac.key]}`}
                    style={{ width: `${pct}%` }}
                  >
                    {pct >= 12 ? `${pct}%` : ""}
                  </div>
                );
              })}
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {ASSET_CLASSES.map((ac) => (
                <li key={ac.key} className="flex items-center gap-1.5">
                  <span aria-hidden className={`inline-block size-2.5 rounded-sm ${SEGMENT_STYLE[ac.key].split(" ")[0]}`} />
                  {assetLabel(ac.label)}: {pf.allocation![ac.key]}%
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {escalationReason(result.advisor, result.labels.tolerance, result.labels.capacity, result.labels.liquidity)}
          </div>
        )}

        <p className="text-muted-foreground">{outcomeSummary(pf.id, pf.summary)}</p>

        {researcher && (
          <p className="text-xs text-muted-foreground">
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
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
            {t(
              `Flawed advice scenario active: this recommendation was deliberately shifted in the wrong direction (sound outcome: ${result.soundPortfolio ? result.soundPortfolio.name : ""}). Logged rows are marked as flawed.`,
              `Skenario saran keliru aktif: rekomendasi ini sengaja digeser ke arah yang salah (hasil yang tepat: ${result.soundPortfolio ? outcomeName(result.soundPortfolio.name) : ""}). Baris log ditandai sebagai keliru.`,
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
