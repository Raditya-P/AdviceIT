"use client";

/* The explanation content renderers: why (feature), what would change it
   (counterfactual), how sure (confidence), and the adaptive plain variant.
   All numbers come from src/lib/advisor/explanations.ts, which computes
   them from the advisor's actual behaviour. */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OUTCOMES } from "@/lib/advisor/model";
import type { AdvisorResult } from "@/lib/advisor/types";
import {
  confidenceExplanation,
  counterfactualExplanation,
  featureExplanation,
} from "@/lib/advisor/explanations";

const signed = (v: number) => (v > 0 ? `+${v}` : String(v));

export function ExplanationCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">{children}</CardContent>
    </Card>
  );
}

export function FeatureBox({ result }: { result: AdvisorResult }) {
  const fx = featureExplanation(result);
  return (
    <ExplanationCard title="Why this recommendation">
      <p className="text-muted-foreground">{result.contribIntro}</p>
      <ul className="space-y-1.5">
        {fx.items.map((it) => (
          <li key={it.key} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_3.5rem] items-center gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{it.label}</div>
              <div className="truncate text-xs text-muted-foreground">{it.valueText}</div>
            </div>
            <div aria-hidden className="relative h-3 overflow-hidden rounded-full bg-muted">
              <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
              {it.points !== 0 && (
                <div
                  className={`absolute inset-y-0.5 rounded-full ${it.points > 0 ? "left-1/2 bg-emerald-600" : "right-1/2 bg-red-600"}`}
                  style={{ width: `${fx.maxAbs ? (Math.abs(it.points) / fx.maxAbs) * 50 : 0}%` }}
                />
              )}
            </div>
            <div className={`text-right font-semibold tabular-nums ${it.points > 0 ? "text-emerald-700" : it.points < 0 ? "text-red-700" : "text-muted-foreground"}`}>
              {signed(it.points)}
            </div>
          </li>
        ))}
      </ul>
      <p className="border-t pt-2 font-medium">{result.contribTotal}</p>
      <p className="text-xs text-muted-foreground">{fx.methodNote}</p>
    </ExplanationCard>
  );
}

export function CounterfactualBox({ result }: { result: AdvisorResult }) {
  const cf = counterfactualExplanation(result);
  return (
    <ExplanationCard title="What would change this recommendation">
      <p className="text-muted-foreground">{cf.intro}</p>
      {cf.sentences.length > 0 && (
        <ul className="list-disc space-y-1.5 pl-5">
          {cf.sentences.map((s, i) => (
            <li key={i}>
              {s}{" "}
              {cf.changes[i] && (
                <Badge variant="secondary" className="ml-1 align-middle text-[11px] font-medium">
                  {cf.changes[i].input} {cf.changes[i].from} to {cf.changes[i].to}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Each statement was produced by re-running the same {result.advisor === "ml" ? "network" : "model"} with only that
        input changed.
      </p>
    </ExplanationCard>
  );
}

export function ProbabilityBars({ probabilities, topIndex }: { probabilities: number[]; topIndex: number }) {
  return (
    <ul className="space-y-1" aria-label="Probability of each outcome">
      {probabilities.map((p, i) => {
        const pct = Math.round(p * 100);
        const top = i === topIndex;
        return (
          <li key={i} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_2.75rem] items-center gap-3 text-sm">
            <span className={`truncate ${top ? "font-semibold" : ""}`}>{OUTCOMES[i].name}</span>
            <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-muted">
              <span className={`block h-full rounded-full ${top ? "bg-primary" : "bg-primary/40"}`} style={{ width: `${pct}%` }} />
            </span>
            <span className={`text-right tabular-nums ${top ? "font-semibold" : "text-muted-foreground"}`}>{pct}%</span>
          </li>
        );
      })}
    </ul>
  );
}

export function ConfidenceBox({ result }: { result: AdvisorResult }) {
  const cx = confidenceExplanation(result);
  const tone =
    cx.label === "high"
      ? "bg-emerald-100 text-emerald-800"
      : cx.label === "moderate"
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";
  return (
    <ExplanationCard title="How sure is the model">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{cx.labelText}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{cx.detail}</span>
      </div>
      <p>{cx.sentence}</p>
      <ProbabilityBars probabilities={cx.probabilities} topIndex={result.portfolioIndex} />
      <p className="text-xs text-muted-foreground">
        Note: confidence displays can increase or decrease reliance depending on how people read them. That effect is
        exactly what this study measures.
      </p>
    </ExplanationCard>
  );
}

/* Adaptive delivery: the ticked content as plain sentences for a low
   literacy level, or as the detailed boxes for a high one. */
export function AdaptiveBox({
  result,
  content,
  level,
  showNote,
}: {
  result: AdvisorResult;
  content: string[];
  level: "low" | "high";
  showNote?: string;
}) {
  const parts = content.length ? content : ["feature", "counterfactual", "confidence"];
  if (level === "high") {
    return (
      <div className="space-y-3">
        {parts.includes("feature") && <FeatureBox result={result} />}
        {parts.includes("counterfactual") && <CounterfactualBox result={result} />}
        {parts.includes("confidence") && <ConfidenceBox result={result} />}
        {showNote && <p className="text-xs text-muted-foreground">{showNote}</p>}
      </div>
    );
  }
  const fx = featureExplanation(result);
  const cf = counterfactualExplanation(result);
  const cx = confidenceExplanation(result);
  const items = fx.items.filter((it) => it.points !== 0);
  const name = result.portfolio.name;
  const sure =
    cx.label === "high"
      ? "The advisor is quite sure about this."
      : cx.label === "moderate"
        ? "The advisor is fairly sure, but not certain."
        : "The advisor is not very sure about this.";
  return (
    <ExplanationCard title="In short">
      <div className="space-y-2 text-[0.95rem] leading-relaxed">
        {parts.includes("feature") && items.length > 0 && (
          <>
            <p>
              The main reason for this advice is your {items[0].label.toLowerCase()} ({items[0].valueText}). It counted{" "}
              {items[0].points > 0 ? `in favour of ${name}` : `against ${name}`}.
            </p>
            {items.length > 1 && (
              <p>
                Your {items[1].label.toLowerCase()} ({items[1].valueText}) also mattered,{" "}
                {items[1].points > 0 ? "in favour." : "against it."}
              </p>
            )}
          </>
        )}
        {parts.includes("counterfactual") && cf.sentences.length > 0 && <p>{cf.sentences[0]}</p>}
        {parts.includes("confidence") && <p>{sure}</p>}
        <p>You can also choose to ask a human adviser.</p>
      </div>
      {showNote && <p className="text-xs text-muted-foreground">{showNote}</p>}
    </ExplanationCard>
  );
}
