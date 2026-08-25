"use client";

/* Interactive what-if delivery: a copy of the inputs the participant can
   steer, with the outcome, probabilities and largest contributions updating
   live. Ignore switches hold an input at the neutral baseline. The why-not
   selector gives a contrastive explanation found by search. Every preview
   is a real re-run of the advisor. Interactions are counted via onInteract. */

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ADVISORS, BASELINE } from "@/lib/advisor/advisors";
import { OUTCOMES } from "@/lib/advisor/model";
import { contrastiveExplanation, featureExplanation } from "@/lib/advisor/explanations";
import type { AdvisorResult, Profile, RawProfile } from "@/lib/advisor/types";
import { ExplanationCard, ProbabilityBars } from "./explanation-boxes";

type Ignored = Partial<Record<keyof Profile, boolean>>;

export function WhatIfPanel({
  result,
  onInteract,
}: {
  result: AdvisorResult;
  onInteract?: (kind: "move" | "whynot") => void;
}) {
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

  const IgnoreToggle = ({ k }: { k: keyof Profile }) => (
    <label className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
      <Checkbox checked={!!ignored[k]} onCheckedChange={() => toggleIgnore(k)} aria-label={`Ignore ${k}`} className="size-3.5" />
      ignore
    </label>
  );

  const Seg = ({
    options,
    value,
    onChange,
    name,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    name: string;
  }) => (
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

  return (
    <ExplanationCard title="Explore what would change the advice">
      <p className="text-muted-foreground">
        Move the controls to see how the advice would change. Tick ignore to see what the advisor would say if it did
        not know that input. Your actual profile and recommendation stay as they are.
      </p>
      <div className="grid gap-5 min-[680px]:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <div className="space-y-1.5">
            <Label>
              Age <IgnoreToggle k="age" />
            </Label>
            <Input
              type="number"
              min={18}
              max={80}
              value={whatIf.age}
              className="max-w-28"
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 18 && v <= 80) bump({ age: Math.round(v) });
              }}
              aria-label="What-if age"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Investment horizon: <span className="tabular-nums text-primary">{whatIf.horizon}</span> years
              <IgnoreToggle k="horizon" />
            </Label>
            <Slider
              min={1}
              max={40}
              step={1}
              value={[whatIf.horizon]}
              onValueChange={(v: number[]) => bump({ horizon: v[0] })}
              aria-label="What-if horizon"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Risk tolerance <IgnoreToggle k="tolerance" />
            </Label>
            <Seg
              name="What-if tolerance"
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
              value={whatIf.tolerance ?? "medium"}
              onChange={(v) => bump({ tolerance: v as RawProfile["tolerance"] })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Emergency fund <IgnoreToggle k="emergencyFund" />
            </Label>
            <Seg
              name="What-if emergency fund"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={whatIf.emergencyFund ? "yes" : "no"}
              onChange={(v) => bump({ emergencyFund: v === "yes" })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Income stability <IgnoreToggle k="incomeStable" />
            </Label>
            <Seg
              name="What-if income"
              options={[
                { value: "stable", label: "Stable" },
                { value: "variable", label: "Variable" },
              ]}
              value={whatIf.incomeStable ? "stable" : "variable"}
              onChange={(v) => bump({ incomeStable: v === "stable" })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Significant debt or obligations <IgnoreToggle k="debtObligations" />
            </Label>
            <Seg
              name="What-if debt"
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
              value={whatIf.debtObligations ? "yes" : "no"}
              onChange={(v) => bump({ debtObligations: v === "yes" })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Money needed in the near term <IgnoreToggle k="nearTermNeed" />
            </Label>
            <Seg
              name="What-if near-term need"
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
              value={whatIf.nearTermNeed ? "yes" : "no"}
              onChange={(v) => bump({ nearTermNeed: v === "yes" })}
            />
          </div>
        </div>

        <div className="min-w-0 space-y-3 rounded-xl bg-muted/50 p-4" aria-live="polite">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            With these inputs the advice would be
          </div>
          <div className="text-2xl font-semibold tracking-tight">{preview.portfolio.name}</div>
          <p className="text-xs text-muted-foreground">
            {preview.portfolio.name === result.portfolio.name
              ? `Same as your recommendation (${result.portfolio.name}).`
              : `Different from your recommendation (${result.portfolio.name}).`}
          </p>
          <ProbabilityBars probabilities={preview.probabilities} topIndex={preview.portfolioIndex} />
          {top3.length > 0 && (
            <div className="space-y-1 border-t pt-2">
              <p className="text-xs text-muted-foreground">Largest contributions ({fx.targetUnit}):</p>
              {top3.map((it) => (
                <div key={it.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    {it.label} <span className="text-xs text-muted-foreground">({it.valueText})</span>
                  </span>
                  <span className={`font-semibold tabular-nums ${it.points > 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {it.points > 0 ? `+${it.points}` : it.points}
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
          <SelectTrigger className="w-full max-w-72" aria-label="Why not another outcome">
            <SelectValue placeholder="Why not another outcome?" />
          </SelectTrigger>
          <SelectContent>
            {OUTCOMES.filter((o) => o.name !== result.portfolio.name).map((o) => (
              <SelectItem key={o.id} value={o.name}>
                Why not {o.name}?
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {whyNotAnswer && <p aria-live="polite">{whyNotAnswer}</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        Every preview is a real re-run of the same advisor. Interactions are counted in the study log.
      </p>
    </ExplanationCard>
  );
}
