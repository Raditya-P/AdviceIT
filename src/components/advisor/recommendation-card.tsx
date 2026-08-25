"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ADVISORS } from "@/lib/advisor/advisors";
import { ASSET_CLASSES } from "@/lib/advisor/model";
import type { AdvisorResult } from "@/lib/advisor/types";

const SEGMENT_STYLE: Record<string, string> = {
  equities: "bg-primary text-primary-foreground",
  bonds: "bg-primary/60 text-primary-foreground",
  cash: "bg-primary/25 text-foreground",
  realAssets: "bg-primary/80 text-primary-foreground",
};

export function RecommendationCard({
  result,
  researcher,
  showCompare,
}: {
  result: AdvisorResult;
  researcher?: boolean;
  showCompare?: boolean;
}) {
  const pf = result.portfolio;
  const ariaAlloc = pf.allocation
    ? ASSET_CLASSES.map((ac) => `${ac.label} ${pf.allocation![ac.key]} percent`).join(", ")
    : "no allocation, human review";
  const other = showCompare ? ADVISORS[result.advisor === "ml" ? "logit" : "ml"] : null;
  const otherOutcome = other ? other.recommend(result.profile).portfolio.name : null;
  const soundHere = result.flawed && result.soundPortfolio ? result.soundPortfolio.name : pf.name;

  return (
    <Card className="bg-gradient-to-b from-card to-muted/40">
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Recommended outcome
          </span>
          {researcher && <Badge variant="secondary">Advisor: {ADVISORS[result.advisor].name}</Badge>}
        </div>
        <h3 className="text-3xl font-semibold tracking-tight">{pf.name}</h3>

        {pf.allocation ? (
          <>
            <div role="img" aria-label={`Allocation: ${ariaAlloc}`} className="flex h-9 overflow-hidden rounded-lg border">
              {ASSET_CLASSES.map((ac) => {
                const pct = pf.allocation![ac.key];
                if (pct <= 0) return null;
                return (
                  <div
                    key={ac.key}
                    title={`${ac.label} ${pct}%`}
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
                  {ac.label}: {pf.allocation![ac.key]}%
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {result.escalationReason}
          </div>
        )}

        <p className="text-muted-foreground">{pf.summary}</p>

        {researcher && (
          <p className="text-xs text-muted-foreground">
            Suitability labels: tolerance {result.labels.tolerance}, capacity {result.labels.capacity}, liquidity need{" "}
            {result.labels.liquidity}.
            {otherOutcome && (
              <>
                {" "}
                The {other!.name.toLowerCase()} would answer: {otherOutcome}
                {otherOutcome === soundHere ? " (same outcome)" : ""}.
              </>
            )}
          </p>
        )}

        {researcher && result.flawed && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
            Flawed advice scenario active: this recommendation was deliberately shifted in the wrong direction (sound
            outcome: {result.soundPortfolio?.name}). Logged rows are marked as flawed.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
