"use client";

/* Interactive what-if delivery: a copy of the inputs the participant can
   steer, with the outcome, probabilities and largest contributions updating
   live. Ignore switches hold an input at the neutral baseline. The why-not
   selector gives a contrastive explanation found by search. Every preview
   is a real re-run of the advisor. Interactions are counted via onInteract. */

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberField } from "@/components/number-field";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ADVISORS, BASELINE } from "@/lib/advisor/advisors";
import { OUTCOMES } from "@/lib/advisor/model";
import { num, outcomeName } from "@/lib/advisor/strings";
import { contrastiveExplanation, featureExplanation } from "@/lib/advisor/explanations";
import type { AdvisorResult, Profile, RawProfile } from "@/lib/advisor/types";
import { tr, useLang } from "@/lib/i18n";
import { SlidersHorizontal } from "lucide-react";
import { ExplanationCard, ProbabilityBars } from "./explanation-boxes";

type Ignored = Partial<Record<keyof Profile, boolean>>;

/* The panel's small controls live out here. Defined inside the panel they
   were a new component on every render, so React rebuilt them after each
   change and keyboard focus fell off the control that had just been used. */
function IgnoreToggle({
  checked,
  onToggle,
  label,
  text,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  text: string;
}) {
  return (
    <label className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
      <Checkbox checked={checked} onCheckedChange={onToggle} aria-label={label} className="size-3.5" />
      {text}
    </label>
  );
}

function Seg({
  options,
  value,
  onChange,
  name,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="inline-flex flex-wrap overflow-hidden rounded-lg border">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-sm transition-colors not-last:border-r ${
            value === o.value ? "bg-primary font-medium text-primary-foreground" : "hover:bg-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function WhatIfPanel({
  result,
  onInteract,
  assess = true,
}: {
  result: AdvisorResult;
  onInteract?: (kind: "move" | "whynot") => void;
  /* When false, the panel does not compare the preview against the shown
     recommendation. Study trials set this, because on a flawed trial that
     sentence would perform the detection the study measures and announce
     the verdict at rest. The previews themselves stay real re-runs. */
  assess?: boolean;
}) {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const advisor = ADVISORS[result.advisor];
  const [whatIf, setWhatIf] = useState<RawProfile>({ ...result.profile });
  const [ignored, setIgnored] = useState<Ignored>({});
  const [whyNot, setWhyNot] = useState<string>("");

  const effective = useMemo(() => {
    const p: Record<string, unknown> = { ...whatIf };
    (Object.keys(ignored) as (keyof Profile)[]).forEach((k) => {
      if (ignored[k]) p[k] = (BASELINE as Record<string, unknown>)[k];
    });
    p.toleranceInconsistent = ignored.tolerance ? false : Boolean(result.profile.toleranceInconsistent);
    return p as RawProfile;
  }, [whatIf, ignored, result.profile.toleranceInconsistent]);

  const preview = useMemo(() => advisor.recommend(effective), [advisor, effective]);
  const fx = useMemo(() => featureExplanation(preview), [preview]);
  const top3 = fx.items.filter((it) => it.points !== 0).slice(0, 3);
  const whyNotAnswer = useMemo(
    () => (whyNot ? contrastiveExplanation(result, whyNot).sentence : ""),
    [result, whyNot],
  );

  const bump = (next: Partial<RawProfile>) => {
    setWhatIf((w) => ({ ...w, ...next }));
    onInteract?.("move");
  };
  const toggleIgnore = (key: keyof Profile) => {
    setIgnored((ig) => ({ ...ig, [key]: !ig[key] }));
    onInteract?.("move");
  };

  const ignoreToggle = (k: keyof Profile) => (
    <IgnoreToggle
      checked={!!ignored[k]}
      onToggle={() => toggleIgnore(k)}
      label={`${t("Ignore", "Abaikan")} ${k}`}
      text={t("ignore", "abaikan")}
    />
  );

  return (
    <ExplanationCard icon={SlidersHorizontal} title={t("Explore what would change the advice", "Cari tahu apa yang bisa mengubah saran")}>
      <p className="text-muted-foreground">
        {t(
          "Move the controls to see how the advice would change. Tick ignore to see what the advisor would say if it did not know that input. Your actual profile and recommendation stay as they are.",
          "Ubah pilihan di bawah untuk melihat bagaimana sarannya berubah. Centang abaikan untuk melihat saran penasihat jika ia tidak tahu faktor itu. Profil dan rekomendasi Anda yang sebenarnya tidak ikut berubah.",
        )}
      </p>
      <div className="grid gap-5 min-[680px]:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <div className="space-y-1.5">
            <Label>
              {t("Age", "Usia")}
              {ignoreToggle("age")}
            </Label>
            <NumberField
              min={18}
              max={80}
              value={whatIf.age}
              onCommit={(age) => bump({ age })}
              className="max-w-28"
              aria-label={t("What-if age", "Usia (simulasi)")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              {t("Investment horizon:", "Jangka waktu investasi:")} <span className="tabular-nums text-primary">{whatIf.horizon}</span>{" "}
              {t("years", "tahun")}
              {ignoreToggle("horizon")}
            </Label>
            <Slider
              min={1}
              max={40}
              step={1}
              value={[whatIf.horizon]}
              onValueChange={(v: number[]) => bump({ horizon: v[0] })}
              aria-label={t("What-if horizon", "Jangka waktu (simulasi)")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              {t("Risk tolerance", "Toleransi risiko")}
              {ignoreToggle("tolerance")}
            </Label>
            <Seg
              name={t("What-if tolerance", "Toleransi risiko (simulasi)")}
              options={[
                { value: "low", label: t("Low", "Rendah") },
                { value: "medium", label: t("Medium", "Sedang") },
                { value: "high", label: t("High", "Tinggi") },
              ]}
              value={whatIf.tolerance ?? "medium"}
              onChange={(v) => bump({ tolerance: v as RawProfile["tolerance"] })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              {t("Emergency fund", "Dana darurat")}
              {ignoreToggle("emergencyFund")}
            </Label>
            <Seg
              name={t("What-if emergency fund", "Dana darurat (simulasi)")}
              options={[
                { value: "yes", label: t("Yes", "Ya") },
                { value: "no", label: t("No", "Tidak") },
              ]}
              value={whatIf.emergencyFund ? "yes" : "no"}
              onChange={(v) => bump({ emergencyFund: v === "yes" })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              {t("Income stability", "Kestabilan pendapatan")}
              {ignoreToggle("incomeStable")}
            </Label>
            <Seg
              name={t("What-if income", "Pendapatan (simulasi)")}
              options={[
                { value: "stable", label: t("Stable", "Stabil") },
                { value: "variable", label: t("Variable", "Tidak tetap") },
              ]}
              value={whatIf.incomeStable ? "stable" : "variable"}
              onChange={(v) => bump({ incomeStable: v === "stable" })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              {t("Significant debt or obligations", "Utang atau kewajiban besar")}
              {ignoreToggle("debtObligations")}
            </Label>
            <Seg
              name={t("What-if debt", "Utang (simulasi)")}
              options={[
                { value: "no", label: t("No", "Tidak") },
                { value: "yes", label: t("Yes", "Ya") },
              ]}
              value={whatIf.debtObligations ? "yes" : "no"}
              onChange={(v) => bump({ debtObligations: v === "yes" })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              {t("Money needed in the near term", "Butuh dana dalam waktu dekat")}
              {ignoreToggle("nearTermNeed")}
            </Label>
            <Seg
              name={t("What-if near-term need", "Kebutuhan dana dalam waktu dekat (simulasi)")}
              options={[
                { value: "no", label: t("No", "Tidak") },
                { value: "yes", label: t("Yes", "Ya") },
              ]}
              value={whatIf.nearTermNeed ? "yes" : "no"}
              onChange={(v) => bump({ nearTermNeed: v === "yes" })}
            />
          </div>
        </div>

        <div className="min-w-0 space-y-3 rounded-2xl border border-border/70 bg-muted/50 p-4" aria-live="polite">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t("With these inputs the advice would be", "Dengan pilihan ini, sarannya menjadi")}
          </div>
          <div className="text-2xl font-semibold tracking-tight">{outcomeName(preview.portfolio.name)}</div>
          {assess && (
            <p className="text-xs text-muted-foreground">
              {preview.portfolio.name === result.portfolio.name
                ? t(
                    `Same as your recommendation (${result.portfolio.name}).`,
                    `Sama dengan rekomendasi Anda (${outcomeName(result.portfolio.name)}).`,
                  )
                : t(
                    `Different from your recommendation (${result.portfolio.name}).`,
                    `Berbeda dari rekomendasi Anda (${outcomeName(result.portfolio.name)}).`,
                  )}
            </p>
          )}
          <ProbabilityBars probabilities={preview.probabilities} topIndex={preview.portfolioIndex} />
          {top3.length > 0 && (
            <div className="space-y-1 border-t border-border/70 pt-2">
              <p className="text-xs text-muted-foreground">
                {t("Largest contributions", "Faktor paling berpengaruh")} ({fx.targetUnit}):
              </p>
              {top3.map((it) => (
                <div key={it.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    {it.label} <span className="text-xs text-muted-foreground">({it.valueText})</span>
                  </span>
                  <span className={`font-semibold tabular-nums ${it.points > 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {it.points > 0 ? `+${num(it.points)}` : num(it.points)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <Select
          value={whyNot || undefined}
          onValueChange={(v) => {
            setWhyNot(v);
            onInteract?.("whynot");
          }}
        >
          <SelectTrigger className="w-full max-w-72" aria-label={t("Why not another outcome", "Mengapa bukan pilihan lain")}>
            <SelectValue placeholder={t("Why not another outcome?", "Mengapa bukan pilihan lain?")} />
          </SelectTrigger>
          <SelectContent>
            {OUTCOMES.filter((o) => o.name !== result.portfolio.name).map((o) => (
              <SelectItem key={o.id} value={o.name}>
                {t(`Why not ${o.name}?`, `Mengapa bukan ${outcomeName(o.name)}?`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {whyNotAnswer && <p aria-live="polite">{whyNotAnswer}</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        {t(
          "Every preview is a real re-run of the same advisor. Interactions are counted in the study log.",
          "Setiap pratinjau dihitung ulang langsung oleh penasihat yang sama. Interaksi Anda dicatat dalam log studi.",
        )}
      </p>
    </ExplanationCard>
  );
}
