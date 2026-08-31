"use client";

/* The explanation content renderers: why (feature), what would change it
   (counterfactual), how sure (confidence), and the adaptive plain variant.
   All numbers come from src/lib/advisor/explanations.ts, which computes
   them from the advisor's actual behaviour and renders in the current
   site language. */

import { BarChart3, Gauge, Shuffle, Sparkles, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OUTCOMES } from "@/lib/advisor/model";
import { CF, FX, outcomeName } from "@/lib/advisor/strings";
import type { AdvisorResult } from "@/lib/advisor/types";
import type { Modality } from "@/lib/conditions";
import {
  confidenceExplanation,
  counterfactualExplanation,
  featureExplanation,
} from "@/lib/advisor/explanations";
import { tr, useLang } from "@/lib/i18n";

const signed = (v: number) => (v > 0 ? `+${v}` : String(v));

export function ExplanationCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center gap-2.5 border-b border-border/70 px-5 py-4 sm:px-6">
        {Icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
        )}
        <h3 className="font-semibold tracking-tight">{title}</h3>
      </header>
      <div className="space-y-3.5 p-5 text-sm sm:p-6">{children}</div>
    </section>
  );
}

export function FeatureBox({ result, modality = "visual" }: { result: AdvisorResult; modality?: Modality }) {
  const { locale } = useLang();
  const fx = featureExplanation(result);
  const showBars = modality === "visual" || modality === "hybrid";
  const showSentences = modality === "textual" || modality === "hybrid";
  const name = result.portfolio.name;
  const intro = result.advisor === "ml" ? FX.introMl(name) : FX.introLogit(name);
  const total =
    result.advisor === "ml"
      ? FX.totalMl(result.baselineScore, result.rawScore, name)
      : FX.totalLogit(result.baselineScore, result.rawScore, name, Math.round(result.topProbability * 100));
  return (
    <ExplanationCard icon={BarChart3} title={tr(locale, { en: "Why this recommendation", id: "Mengapa rekomendasi ini" })}>
      <p className="text-muted-foreground">{intro}</p>
      {showBars && (
      <ul className="space-y-1.5">
        {fx.items.map((it) => (
          <li key={it.key} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_3.5rem] items-center gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{it.label}</div>
              <div className="truncate text-xs text-muted-foreground">{it.valueText}</div>
            </div>
            <div aria-hidden className="relative h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
              {it.points !== 0 && (
                <div
                  className={`absolute inset-y-0.5 rounded-full ${it.points > 0 ? "left-1/2 bg-primary" : "right-1/2 bg-destructive"}`}
                  style={{ width: `${fx.maxAbs ? (Math.abs(it.points) / fx.maxAbs) * 50 : 0}%` }}
                />
              )}
            </div>
            <div className={`text-right font-semibold tabular-nums ${it.points > 0 ? "text-primary" : it.points < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {signed(it.points)}
            </div>
          </li>
        ))}
      </ul>
      )}
      {showSentences && (
        <ul className={`space-y-2 leading-relaxed ${showBars ? "border-t border-border/70 pt-3" : ""}`}>
          {fx.items.map((it) => (
            <li key={`s-${it.key}`}>{it.sentence}</li>
          ))}
        </ul>
      )}
      <p className="border-t border-border/70 pt-3 font-medium">{total}</p>
      <p className="text-xs text-muted-foreground">{fx.methodNote}</p>
    </ExplanationCard>
  );
}

/* The structured badge next to each counterfactual sentence. The stored
   change values are English canonical, translated here for display. */
const CF_INPUT_ID: Record<string, string> = {
  age: "usia",
  horizon: "horizon",
  "risk tolerance": "toleransi risiko",
  "emergency fund": "dana darurat",
  income: "pendapatan",
  debt: "utang",
  "near-term need": "kebutuhan jangka pendek",
};
const CF_VALUE_ID: Record<string, string> = {
  yes: "ya",
  no: "tidak",
  stable: "stabil",
  variable: "tidak tetap",
  significant: "besar",
  none: "tidak ada",
  Low: "Rendah",
  Medium: "Sedang",
  High: "Tinggi",
};
function cfValue(v: string, locale: "en" | "id") {
  if (locale === "en") return v;
  return CF_VALUE_ID[v] ?? v.replace(" years old", " tahun").replace(" years", " tahun").replace(" year", " tahun");
}

export function CounterfactualBox({ result }: { result: AdvisorResult }) {
  const { locale } = useLang();
  const cf = counterfactualExplanation(result);
  return (
    <ExplanationCard
      icon={Shuffle}
      title={tr(locale, { en: "What would change this recommendation", id: "Apa yang akan mengubah rekomendasi ini" })}
    >
      <p className="text-muted-foreground">{cf.intro}</p>
      {cf.sentences.length > 0 && (
        <ul className="list-disc space-y-1.5 pl-5">
          {cf.sentences.map((s, i) => (
            <li key={i}>
              {s}{" "}
              {cf.changes[i] && (
                <Badge variant="secondary" className="ml-1 align-middle text-[11px] font-medium">
                  {locale === "id" ? (CF_INPUT_ID[cf.changes[i].input] ?? cf.changes[i].input) : cf.changes[i].input}{" "}
                  {cfValue(cf.changes[i].from, locale)} {tr(locale, { en: "to", id: "menjadi" })}{" "}
                  {cfValue(cf.changes[i].to, locale)}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">{CF.rerunNote(result.advisor === "ml")}</p>
    </ExplanationCard>
  );
}

export function ProbabilityBars({ probabilities, topIndex }: { probabilities: number[]; topIndex: number }) {
  const { locale } = useLang();
  return (
    <ul className="space-y-1" aria-label={tr(locale, { en: "Probability of each outcome", id: "Probabilitas setiap hasil" })}>
      {probabilities.map((p, i) => {
        const pct = Math.round(p * 100);
        const top = i === topIndex;
        return (
          <li key={i} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_2.75rem] items-center gap-3 text-sm">
            <span className={`truncate ${top ? "font-semibold" : ""}`}>{outcomeName(OUTCOMES[i].name)}</span>
            <span aria-hidden className="h-3 overflow-hidden rounded-full bg-muted">
              <span className={`block h-full rounded-full transition-[width] duration-500 ${top ? "bg-primary" : "bg-primary/35"}`} style={{ width: `${pct}%` }} />
            </span>
            <span className={`text-right tabular-nums ${top ? "font-semibold" : "text-muted-foreground"}`}>{pct}%</span>
          </li>
        );
      })}
    </ul>
  );
}

export function ConfidenceBox({ result }: { result: AdvisorResult }) {
  const { locale } = useLang();
  const cx = confidenceExplanation(result);
  const tone =
    cx.label === "high"
      ? "bg-emerald-100 text-emerald-800"
      : cx.label === "moderate"
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";
  return (
    <ExplanationCard icon={Gauge} title={tr(locale, { en: "How sure is the model", id: "Seberapa yakin modelnya" })}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{cx.labelText}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{cx.detail}</span>
      </div>
      <p>{cx.sentence}</p>
      <ProbabilityBars probabilities={cx.probabilities} topIndex={result.portfolioIndex} />
      <p className="text-xs text-muted-foreground">
        {tr(locale, {
          en: "Note: confidence displays can increase or decrease reliance depending on how people read them. That effect is exactly what this study measures.",
          id: "Catatan: tampilan keyakinan dapat menaikkan atau menurunkan reliance tergantung cara orang membacanya. Efek itulah yang persis diukur studi ini.",
        })}
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
  modality = "visual",
}: {
  result: AdvisorResult;
  content: string[];
  level: "low" | "high";
  showNote?: string;
  modality?: Modality;
}) {
  const { locale } = useLang();
  const parts = content.length ? content : ["feature", "counterfactual", "confidence"];
  const fx = featureExplanation(result);
  const cf = counterfactualExplanation(result);
  const cx = confidenceExplanation(result);
  if (level === "high") {
    return (
      <div className="space-y-3">
        {parts.includes("feature") && <FeatureBox result={result} modality={modality} />}
        {parts.includes("counterfactual") && <CounterfactualBox result={result} />}
        {parts.includes("confidence") && <ConfidenceBox result={result} />}
        {showNote && <p className="text-xs text-muted-foreground">{showNote}</p>}
      </div>
    );
  }
  const items = fx.items.filter((it) => it.points !== 0);
  const name = result.portfolio.name;
  const sure =
    cx.label === "high"
      ? tr(locale, { en: "The advisor is quite sure about this.", id: "Penasihat cukup yakin tentang ini." })
      : cx.label === "moderate"
        ? tr(locale, { en: "The advisor is fairly sure, but not certain.", id: "Penasihat lumayan yakin, tetapi tidak pasti." })
        : tr(locale, { en: "The advisor is not very sure about this.", id: "Penasihat tidak terlalu yakin tentang ini." });
  return (
    <ExplanationCard icon={Sparkles} title={tr(locale, { en: "In short", id: "Singkatnya" })}>
      <div className="space-y-2 text-[0.95rem] leading-relaxed">
        {parts.includes("feature") && items.length > 0 && (
          <>
            <p>
              {locale === "id"
                ? `Alasan utama saran ini adalah ${items[0].label.toLowerCase()} Anda (${items[0].valueText}). Itu terhitung ${
                    items[0].points > 0 ? `mendukung ${outcomeName(name)}` : `melawan ${outcomeName(name)}`
                  }.`
                : `The main reason for this advice is your ${items[0].label.toLowerCase()} (${items[0].valueText}). It counted ${
                    items[0].points > 0 ? `in favour of ${name}` : `against ${name}`
                  }.`}
            </p>
            {items.length > 1 && (
              <p>
                {locale === "id"
                  ? `${items[1].label} Anda (${items[1].valueText}) juga berpengaruh, ${
                      items[1].points > 0 ? "mendukung." : "melawannya."
                    }`
                  : `Your ${items[1].label.toLowerCase()} (${items[1].valueText}) also mattered, ${
                      items[1].points > 0 ? "in favour." : "against it."
                    }`}
              </p>
            )}
          </>
        )}
        {parts.includes("counterfactual") && cf.sentences.length > 0 && <p>{cf.sentences[0]}</p>}
        {parts.includes("confidence") && <p>{sure}</p>}
        <p>
          {tr(locale, {
            en: "You can also choose to ask a human adviser.",
            id: "Anda juga bisa memilih bertanya kepada penasihat manusia.",
          })}
        </p>
      </div>
      {showNote && <p className="text-xs text-muted-foreground">{showNote}</p>}
    </ExplanationCard>
  );
}
