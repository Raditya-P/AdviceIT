"use client";

/* The suitability profile form. Controlled: the parent owns the profile
   state. Includes the optional free-text description that the in-browser
   language model reads into the fields (facts extracted by the model, the
   judgement calls computed in code, fields it could not read left alone). */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { EXAMPLE_PROFILES } from "@/lib/advisor/model";
import type { RawProfile } from "@/lib/advisor/types";
import * as llm from "@/lib/llm";
import benchData from "@/data/ils_bench_cases.json";

export interface FormProfile extends RawProfile {
  tolerance: "low" | "medium" | "high";
  toleranceInconsistent: boolean;
  emergencyFund: boolean;
  incomeStable: boolean;
  debtObligations: boolean;
  nearTermNeed: boolean;
  knowledge: string;
}

export const DEFAULT_PROFILE: FormProfile = {
  age: 35,
  horizon: 15,
  tolerance: "medium",
  toleranceInconsistent: false,
  emergencyFund: true,
  incomeStable: true,
  debtObligations: false,
  nearTermNeed: false,
  knowledge: "intermediate",
};

interface IlsCase {
  id: string;
  narrative: string;
  evidence: string;
  tolerance: string;
  capacity: string;
  liquidity: string;
  portfolio: string;
  escalation: string;
}

export function Seg({
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
    <div role="radiogroup" aria-label={name} className="inline-flex flex-wrap overflow-hidden rounded-lg border bg-background">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3.5 py-2 text-sm transition-colors not-last:border-r ${
            value === o.value ? "bg-primary font-medium text-primary-foreground" : "hover:bg-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProfileForm({
  profile,
  onChange,
  researcher,
  showNarrative = true,
}: {
  profile: FormProfile;
  onChange: (p: FormProfile) => void;
  researcher?: boolean;
  showNarrative?: boolean;
}) {
  const [narrative, setNarrative] = useState("");
  const [narrativeStatus, setNarrativeStatus] = useState("");
  const [reading, setReading] = useState(false);
  const [ilsCase, setIlsCase] = useState<IlsCase | null>(null);

  const set = (next: Partial<FormProfile>) => onChange({ ...profile, ...next });

  const loadExample = (id: string) => {
    const ex = EXAMPLE_PROFILES.find((e) => e.id === id);
    if (!ex) return;
    setIlsCase(null);
    onChange({ ...DEFAULT_PROFILE, ...ex.profile, toleranceInconsistent: false } as FormProfile);
  };

  const loadIlsCase = () => {
    const cases = (benchData as { cases: IlsCase[] }).cases;
    const c = cases[Math.floor(Math.random() * cases.length)];
    setNarrative(c.narrative);
    setIlsCase(c);
    setNarrativeStatus("");
  };

  const readNarrative = async () => {
    const text = narrative.trim();
    if (!text) {
      setNarrativeStatus("Write or load a description first.");
      return;
    }
    if (!llm.supported()) {
      setNarrativeStatus("This browser has no WebGPU, the language model cannot run here.");
      return;
    }
    setReading(true);
    setNarrativeStatus(llm.isReady() ? "Reading the description" : "Loading the language model, then reading the description");
    const off = llm.onProgress((r) => {
      if (!llm.isReady()) setNarrativeStatus(r.text);
    });
    try {
      await llm.load(llm.MODELS[0].id);
      setNarrativeStatus("Reading the description");
      const reply = await llm.complete(llm.extractionMessages(text), 200);
      const ex = llm.parseExtraction(reply);
      if (!ex) {
        setNarrativeStatus("The model did not return anything readable. Try again or fill in the form by hand.");
        return;
      }
      const pf = llm.profileFromExtraction(ex);
      const filled: string[] = [];
      const missing: string[] = [];
      const next: Partial<FormProfile> = { toleranceInconsistent: pf.toleranceInconsistent };
      if (pf.age !== null) (next.age = pf.age), filled.push("age");
      else missing.push("age");
      if (pf.horizon !== null) (next.horizon = pf.horizon), filled.push("when the money is needed");
      else missing.push("when the money is needed");
      if (pf.tolerance) (next.tolerance = pf.tolerance), filled.push("risk tolerance");
      else missing.push("risk tolerance");
      if (pf.emergencyFund !== null) (next.emergencyFund = pf.emergencyFund), filled.push("emergency fund");
      else missing.push("emergency fund");
      if (pf.incomeStable !== null) (next.incomeStable = pf.incomeStable), filled.push("income");
      else missing.push("income");
      if (pf.debtObligations !== null) (next.debtObligations = pf.debtObligations), filled.push("debt");
      else missing.push("debt");
      if (pf.nearTermNeed !== null) (next.nearTermNeed = pf.nearTermNeed), filled.push("near-term need");
      else missing.push("near-term need");
      set(next);
      setNarrativeStatus(
        `Filled: ${filled.join(", ") || "nothing"}${missing.length ? `. Not found in the text: ${missing.join(", ")}, left as they were.` : "."}` +
          (pf.toleranceInconsistent ? " Risk attitude read as Inconsistent (high stated appetite against a weak position)." : ""),
      );
    } catch (err) {
      setNarrativeStatus("Could not read the description: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      off();
      setReading(false);
    }
  };

  return (
    <div className="space-y-5">
      {researcher && (
        <div className="space-y-1.5">
          <Label htmlFor="example-select">Load an example profile</Label>
          <Select onValueChange={loadExample}>
            <SelectTrigger id="example-select" className="w-full max-w-72">
              <SelectValue placeholder="Choose a profile" />
            </SelectTrigger>
            <SelectContent>
              {EXAMPLE_PROFILES.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>
                  {ex.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          min={18}
          max={80}
          value={profile.age}
          className="max-w-28"
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) set({ age: Math.min(80, Math.max(18, Math.round(v))) });
          }}
        />
        <p className="text-xs text-muted-foreground">18 to 80.</p>
      </div>

      <div className="space-y-1.5">
        <Label>
          Investment horizon: <span className="tabular-nums text-primary">{profile.horizon}</span> years
        </Label>
        <Slider min={1} max={40} step={1} value={[profile.horizon]} onValueChange={(v: number[]) => set({ horizon: v[0] })} aria-label="Investment horizon" />
        <p className="text-xs text-muted-foreground">How many years until you expect to need this money.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Risk tolerance</Label>
        <Seg
          name="Risk tolerance"
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
          value={profile.tolerance}
          onChange={(v) => set({ tolerance: v as FormProfile["tolerance"], toleranceInconsistent: false })}
        />
        {profile.toleranceInconsistent && (
          <p className="text-xs">
            <Badge variant="secondary" className="bg-amber-100 text-amber-900">
              Risk tolerance read as Inconsistent from the description
            </Badge>{" "}
            <button type="button" className="text-muted-foreground underline" onClick={() => set({ toleranceInconsistent: false })}>
              Clear
            </button>
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Emergency fund covering at least 6 months of expenses</Label>
        <Seg
          name="Emergency fund"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={profile.emergencyFund ? "yes" : "no"}
          onChange={(v) => set({ emergencyFund: v === "yes" })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Income stability</Label>
        <Seg
          name="Income stability"
          options={[
            { value: "stable", label: "Stable" },
            { value: "variable", label: "Variable" },
          ]}
          value={profile.incomeStable ? "stable" : "variable"}
          onChange={(v) => set({ incomeStable: v === "stable" })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Significant debt or large fixed obligations</Label>
        <Seg
          name="Debt and obligations"
          options={[
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
          ]}
          value={profile.debtObligations ? "yes" : "no"}
          onChange={(v) => set({ debtObligations: v === "yes" })}
        />
        <p className="text-xs text-muted-foreground">For example high-interest debt, or fixed expenses that leave little room. Lowers risk capacity.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Could you need this money much sooner than planned?</Label>
        <Seg
          name="Near-term need"
          options={[
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
          ]}
          value={profile.nearTermNeed ? "yes" : "no"}
          onChange={(v) => set({ nearTermNeed: v === "yes" })}
        />
        <p className="text-xs text-muted-foreground">For example rent, tuition or a tax bill within a year or two. Makes the liquidity need urgent whatever the horizon.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Financial knowledge, self-rated</Label>
        <Seg
          name="Financial knowledge"
          options={[
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "advanced", label: "Advanced" },
          ]}
          value={profile.knowledge}
          onChange={(v) => set({ knowledge: v })}
        />
        <p className="text-xs text-muted-foreground">Recorded only, it does not affect the recommendation. In the study it is a moderator variable.</p>
      </div>

      {showNarrative && (
        <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
          <Label htmlFor="narrative">Or describe your situation in your own words</Label>
          <Textarea
            id="narrative"
            rows={4}
            value={narrative}
            onChange={(e) => {
              setNarrative(e.target.value);
              setIlsCase(null);
            }}
            placeholder="For example: I am 52, saving for retirement in about 12 years, steady salary, six months of expenses in the bank, and I can live with market swings."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={readNarrative} disabled={reading}>
              Read description into the form
            </Button>
            {researcher && (
              <Button size="sm" variant="ghost" onClick={loadIlsCase}>
                Load an ILS-Bench case
              </Button>
            )}
          </div>
          {narrativeStatus && (
            <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
              {narrativeStatus}
            </p>
          )}
          {researcher && ilsCase && (
            <div className="space-y-1 rounded-lg border bg-background p-3 text-xs">
              <p className="font-semibold text-primary">{ilsCase.id} (ILS-Bench, expert consensus)</p>
              <p>
                Recommended outcome: {ilsCase.portfolio}
                {ilsCase.escalation === "Yes" ? " (escalate to a human)" : ""}
              </p>
              <p>
                Risk tolerance {ilsCase.tolerance}, risk capacity {ilsCase.capacity}, liquidity need {ilsCase.liquidity}
              </p>
              <p className="text-muted-foreground">Evidence the experts pointed to: {ilsCase.evidence}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            The in-browser language model reads the description and fills in the fields above, following the ILS-Bench
            language-to-suitability procedure. Check the fields before continuing.
          </p>
        </div>
      )}
    </div>
  );
}
