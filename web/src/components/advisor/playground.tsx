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
import { ADVISORS, logitMeta, mlMeta } from "@/lib/advisor/advisors";
import { applyFlawedScenario } from "@/lib/advisor/model";
import type { AdvisorResult } from "@/lib/advisor/types";
import { CONTENT_PARTS, FORMS, PRESETS, presetFor, presetLabel, specFor, type ContentPart, type Form } from "@/lib/conditions";
import { tr, useLang } from "@/lib/i18n";
import { ExplanationArea } from "./explanation-area";
import { DEFAULT_PROFILE, ProfileForm, Seg, type FormProfile } from "./profile-form";
import { RecommendationCard, advisorDisplayName } from "./recommendation-card";
import { ScorecardTable } from "./scorecard";

const FORM_LABELS: Record<Form, { en: string; id: string }> = {
  static: { en: "Static", id: "Statis" },
  interactive: { en: "Interactive what-if", id: "What-if interaktif" },
  adaptive: { en: "Adaptive to literacy", id: "Adaptif terhadap literasi" },
  llm: { en: "Conversational (LLM)", id: "Percakapan (LLM)" },
};

function advisorDescription(advisorId: "ml" | "logit", locale: "en" | "id") {
  if (locale === "en") return ADVISORS[advisorId].description;
  if (advisorId === "ml") {
    return `Neural network yang dilatih pada ILS-Bench, ${mlMeta.cases} kasus tervalidasi ahli, akurasi validasi silang ${Math.round(mlMeta.cvAccuracy * 100)} persen pada enam hasil termasuk Tinjauan manusia. Bobotnya tidak terbaca, sehingga penjelasan dihitung setelah keputusan.`;
  }
  return `Scorecard yang dipaskan pada data yang sama dengan regresi logistik multinomial, akurasi validasi silang ${Math.round((logitMeta.cvAccuracy as number) * 100)} persen. Satu bobot per input dan hasil, semua bobot terbaca, penjelasan eksak.`;
}

export function Playground({ advisorId, researcher }: { advisorId: "ml" | "logit"; researcher: boolean }) {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
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
            <h1 className="text-2xl font-semibold tracking-tight">{advisorDisplayName(advisorId, locale)}</h1>
            <p className="text-sm text-muted-foreground">{advisorDescription(advisorId, locale)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={advisorId === "ml" ? "/advisor/logit" : "/advisor/ml"}>
                {advisorId === "ml"
                  ? t("Switch to the interpretable rule-based advisor", "Beralih ke penasihat interpretable berbasis aturan")
                  : t("Switch to the AI advisor", "Beralih ke penasihat AI")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/training-data">{t("About the training data", "Tentang data pelatihan")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Explanation and scenario controls */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("Explanation", "Penjelasan")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="preset">{t("Preset", "Preset")}</Label>
              <Select value={preset} onValueChange={choosePreset}>
                <SelectTrigger id="preset" className="w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Object.keys(PRESETS), "custom"].map((name) => (
                    <SelectItem key={name} value={name} disabled={name === "custom"}>
                      {presetLabel(name, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {researcher && (
              <div className="space-y-1.5">
                <Label>{t("Scenario", "Skenario")}</Label>
                <Seg
                  name={t("Advice scenario", "Skenario saran")}
                  options={[
                    { value: "sound", label: t("Sound advice", "Saran tepat") },
                    { value: "flawed", label: t("Flawed advice", "Saran keliru") },
                  ]}
                  value={scenario}
                  onChange={(v) => setScenario(v as "sound" | "flawed")}
                />
              </div>
            )}
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-primary">{t("Customise", "Kustomisasi")}</summary>
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("Content", "Konten")}
                </span>
                {CONTENT_PARTS.map((part) => (
                  <label key={part} className="flex items-center gap-1.5">
                    <Checkbox checked={content.includes(part)} onCheckedChange={() => toggleContent(part)} />
                    {presetLabel(part, locale)}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("Delivery", "Penyajian")}
                </span>
                <RadioGroup value={form} onValueChange={(v: string) => chooseForm(v as Form)} className="flex flex-wrap gap-4">
                  {FORMS.map((f) => (
                    <label key={f} className="flex items-center gap-1.5 text-sm">
                      <RadioGroupItem value={f} /> {tr(locale, FORM_LABELS[f])}
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <p className="text-xs text-muted-foreground">
                {t(
                  "Content is what is explained. Delivery is how it is shown. A preset is one combination, and the study log records both parts.",
                  "Konten adalah apa yang dijelaskan. Penyajian adalah cara menampilkannya. Preset adalah satu kombinasi, dan log studi merekam keduanya.",
                )}
              </p>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("Investor profile", "Profil investor")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t(
                "Answer the questions a robo-advisor would ask. All fields are hypothetical.",
                "Jawab pertanyaan yang akan diajukan robo-advisor. Semua isian bersifat hipotetis.",
              )}
            </p>
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
          <h2 className="text-xl font-semibold tracking-tight">
            {t("Enjoyed poking at the advisor?", "Senang mengutak-atik penasihatnya?")}
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t(
              "Contribute to the research: a 10 to 15 minute anonymous session with six short cases. Your decisions are the data this study exists for.",
              "Berkontribusilah pada penelitian: sesi anonim 10 sampai 15 menit dengan enam kasus singkat. Keputusan Anda adalah data yang menjadi alasan studi ini ada.",
            )}
          </p>
          <Button asChild>
            <Link href="/participate">
              {t("Participate in the study", "Ikut serta dalam studi")} <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
