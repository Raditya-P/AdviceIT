"use client";

/* The advisor playground: the public "try" mode of an advisor page.
   Nothing here is logged as study data. The researcher flag (?researcher=1)
   unlocks the scenario toggle, the labels and comparison line, the ILS-Bench
   case loader and the example dropdown. */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADVISORS } from "@/lib/advisor/advisors";
import { applyFlawedScenario } from "@/lib/advisor/model";
import type { AdvisorResult } from "@/lib/advisor/types";
import { CONTENT_PARTS, FORMS, PRESETS, PRESET_LABELS, presetFor, specFor, type ContentPart, type Form } from "@/lib/conditions";
import { ExplanationArea } from "./explanation-area";
import { DEFAULT_PROFILE, ProfileForm, Seg, type FormProfile } from "./profile-form";
import { RecommendationCard } from "./recommendation-card";
import { ScorecardTable } from "./scorecard";

const FORM_LABELS: Record<Form, string> = {
  static: "Static",
  interactive: "Interactive what-if",
  adaptive: "Adaptive to literacy",
  llm: "Conversational (LLM)",
};

export function Playground({ advisorId, researcher }: { advisorId: "ml" | "logit"; researcher: boolean }) {
  const advisor = ADVISORS[advisorId];
  const [profile, setProfile] = useState<FormProfile>(DEFAULT_PROFILE);
  const [preset, setPreset] = useState<string>("feature");
  const [content, setContent] = useState<ContentPart[]>(["feature"]);
  const [form, setForm] = useState<Form>("static");
  const [scenario, setScenario] = useState<"sound" | "flawed">("sound");

  const result: AdvisorResult = useMemo(() => {
    const r = advisor.recommend(profile);
    return scenario === "flawed" ? applyFlawedScenario(r) : r;
  }, [advisor, profile, scenario]);

  const choosePreset = (name: string) => {
    if (name === "custom") return;
    const spec = specFor(name);
    setPreset(name);
    setContent([...spec.content]);
    setForm(spec.form);
  };
  const toggleContent = (part: ContentPart) => {
    const next = content.includes(part) ? content.filter((c) => c !== part) : [...content, part];
    setContent(next);
    setPreset(presetFor(next, form));
  };
  const chooseForm = (f: Form) => {
    setForm(f);
    setPreset(presetFor(content, f));
  };

  const literacyLevel = profile.knowledge === "beginner" ? "low" : "high";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <Card className="border-l-4 border-l-primary bg-muted/30">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="max-w-3xl space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{advisor.name}</h1>
            <p className="text-sm text-muted-foreground">{advisor.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={advisorId === "ml" ? "/advisor/logit" : "/advisor/ml"}>
                Switch to the {advisorId === "ml" ? "interpretable rule-based advisor" : "AI advisor"}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/training-data">About the training data</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Explanation and scenario controls */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Explanation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="preset">Preset</Label>
              <Select value={preset} onValueChange={choosePreset}>
                <SelectTrigger id="preset" className="w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Object.keys(PRESETS), "custom"].map((name) => (
                    <SelectItem key={name} value={name} disabled={name === "custom"}>
                      {PRESET_LABELS[name]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {researcher && (
              <div className="space-y-1.5">
                <Label>Scenario</Label>
                <Seg
                  name="Advice scenario"
                  options={[
                    { value: "sound", label: "Sound advice" },
                    { value: "flawed", label: "Flawed advice" },
                  ]}
                  value={scenario}
                  onChange={(v) => setScenario(v as "sound" | "flawed")}
                />
              </div>
            )}
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-primary">Customise</summary>
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Content</span>
                {CONTENT_PARTS.map((part) => (
                  <label key={part} className="flex items-center gap-1.5">
                    <Checkbox checked={content.includes(part)} onCheckedChange={() => toggleContent(part)} />
                    {PRESET_LABELS[part]}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery</span>
                <RadioGroup value={form} onValueChange={(v: string) => chooseForm(v as Form)} className="flex flex-wrap gap-4">
                  {FORMS.map((f) => (
                    <label key={f} className="flex items-center gap-1.5 text-sm">
                      <RadioGroupItem value={f} /> {FORM_LABELS[f]}
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <p className="text-xs text-muted-foreground">
                Content is what is explained. Delivery is how it is shown. A preset is one combination, and the study
                log records both parts.
              </p>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Investor profile</CardTitle>
            <p className="text-sm text-muted-foreground">Answer the questions a robo-advisor would ask. All fields are hypothetical.</p>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} onChange={setProfile} researcher={researcher} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <RecommendationCard result={result} researcher={researcher} showCompare={researcher} />
          <ExplanationArea
            result={result}
            content={content}
            form={form}
            literacyLevel={literacyLevel}
            researcherNote={researcher}
            showModelPicker
          />
          {advisorId === "logit" && <ScorecardTable />}
        </div>
      </div>

      <Card className="bg-primary/5">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <h2 className="text-xl font-semibold tracking-tight">Enjoyed poking at the advisor?</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Contribute to the research: a 10 to 15 minute anonymous session with six short cases. Your decisions are the
            data this study exists for.
          </p>
          <Button asChild>
            <Link href="/participate">
              Participate in the study <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
