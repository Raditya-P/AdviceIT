"use client";

/* The advisor page: a three-step flow. Choose how the advice gets explained,
   describe the investor, then read the recommendation with that explanation.
   Nothing here is logged as study data. The researcher flag (?researcher=1)
   unlocks the scenario toggle, the labels and comparison line, the ILS-Bench
   case loader and the example dropdown. */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, GraduationCap, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADVISORS, logitMeta, mlMeta } from "@/lib/advisor/advisors";
import { applyFlawedScenario } from "@/lib/advisor/model";
import { labelValue } from "@/lib/advisor/strings";
import type { AdvisorResult } from "@/lib/advisor/types";
import { presetFor, presetLabel, specFor, type ContentPart, type Form } from "@/lib/conditions";
import { tr, useLang } from "@/lib/i18n";
import { Analyzing } from "./analyzing";
import { ExplanationArea } from "./explanation-area";
import { OutcomeGuide } from "./outcome-guide";
import { DEFAULT_PROFILE, ProfileForm, type FormProfile } from "./profile-form";
import { RecommendationCard, advisorDisplayName } from "./recommendation-card";
import { ScorecardTable } from "./scorecard";
import { StylePicker } from "./style-picker";
import { TryResponse } from "./try-response";

type Step = "style" | "profile" | "analyzing" | "result";

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
  const [step, setStep] = useState<Step>("style");
  const [profile, setProfile] = useState<FormProfile>(DEFAULT_PROFILE);
  const [preset, setPreset] = useState<string>("feature");
  const [content, setContent] = useState<ContentPart[]>(["feature"]);
  const [form, setForm] = useState<Form>("static");
  const [scenario, setScenario] = useState<"sound" | "flawed">("sound");
  const [profileSource, setProfileSource] = useState<"form" | "example" | "ils-bench" | "narrative">("form");
  const [shownAt, setShownAt] = useState(0);
  /* Adaptive delivery picks its variant from literacy. On the advisor pages
     nobody has answered the literacy questions, so it follows the self-rated
     knowledge field, and this switch lets a visitor see the other variant. */
  const [adaptiveView, setAdaptiveView] = useState<"auto" | "low" | "high">("auto");

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

  const autoLevel: "low" | "high" = profile.knowledge === "beginner" ? "low" : "high";
  const literacyLevel: "low" | "high" = adaptiveView === "auto" ? autoLevel : adaptiveView;
  const name = advisorDisplayName(advisorId, locale);

  const STEPS: { key: Step; label: string }[] = [
    { key: "style", label: t("Explanation", "Penjelasan") },
    { key: "profile", label: t("Your profile", "Profil Anda") },
    { key: "result", label: t("Recommendation", "Rekomendasi") },
  ];
  const activeIndex = step === "analyzing" ? 2 : STEPS.findIndex((s) => s.key === step);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Advisor identity */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{name}</h1>
          <Link
            href={advisorId === "ml" ? "/advisor/logit" : "/advisor/ml"}
            className="rounded-full border border-border/80 px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {advisorId === "ml"
              ? t("Switch to the interpretable advisor", "Beralih ke penasihat interpretable")
              : t("Switch to the AI advisor", "Beralih ke penasihat AI")}
          </Link>
        </div>
        <p className="max-w-3xl leading-relaxed text-muted-foreground">{advisorDescription(advisorId, locale)}</p>
        {advisorId === "logit" && (
          <div className="pt-2">
            <ScorecardTable />
          </div>
        )}
      </header>

      {/* Stepper */}
      <ol className="mt-8 flex items-center gap-2 sm:gap-3">
        {STEPS.map((s, i) => {
          const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "todo";
          const clickable = i < activeIndex;
          return (
            <li key={s.key} className="flex flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && setStep(s.key)}
                className={`flex items-center gap-2 rounded-full px-1 text-sm transition-colors ${
                  clickable ? "cursor-pointer hover:text-foreground" : "cursor-default"
                } ${state === "todo" ? "text-muted-foreground" : ""}`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    state === "active"
                      ? "bg-primary text-primary-foreground"
                      : state === "done"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`hidden sm:inline ${state === "active" ? "font-medium" : ""}`}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span aria-hidden className={`h-px flex-1 ${i < activeIndex ? "bg-primary/40" : "bg-border"}`} />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-9">
        {step === "style" && (
          <div className="space-y-8">
            <StylePicker
              preset={preset}
              onPreset={choosePreset}
              content={content}
              form={form}
              onToggleContent={toggleContent}
              onForm={chooseForm}
              researcher={researcher}
              scenario={scenario}
              onScenario={setScenario}
            />
            <div className="flex justify-end">
              <Button size="lg" className="h-12 rounded-full px-7" onClick={() => setStep("profile")}>
                {t("Continue to your profile", "Lanjut ke profil Anda")} <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        )}

        {step === "profile" && (
          <div className="space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("Tell the advisor about the investor", "Ceritakan tentang investornya kepada penasihat")}
              </h2>
              <p className="text-muted-foreground">
                {t(
                  "These are the questions a robo-advisor would ask before recommending anything. Everything here is hypothetical and nothing is stored.",
                  "Ini pertanyaan yang akan diajukan robo-advisor sebelum merekomendasikan apa pun. Semuanya bersifat hipotetis dan tidak ada yang disimpan.",
                )}
              </p>
            </div>
            <div className="panel p-6 sm:p-7">
              <ProfileForm profile={profile} onChange={setProfile} onSourceChange={setProfileSource} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" className="rounded-full" onClick={() => setStep("style")}>
                <ArrowLeft data-icon="inline-start" /> {t("Back to explanation styles", "Kembali ke gaya penjelasan")}
              </Button>
              <Button size="lg" className="h-12 rounded-full px-7" onClick={() => setStep("analyzing")}>
                {t("See the recommendation", "Lihat rekomendasinya")} <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        )}

        {step === "analyzing" && (
          <Analyzing
            advisorName={name}
            onDone={() => {
              setShownAt(Date.now());
              setStep("result");
            }}
          />
        )}

        {step === "result" && (
          <div className="space-y-6">
            <RecommendationCard result={result} researcher={researcher} showCompare={researcher} />

            <div className="rise space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("Explanation", "Penjelasan")}: {presetLabel(preset, locale)}
                </h2>
              </div>
              {form === "adaptive" && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm">
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <GraduationCap className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {literacyLevel === "low"
                      ? t(
                          "Showing the plain-language version, because the profile rates its financial knowledge as beginner.",
                          "Menampilkan versi bahasa sederhana, karena profil ini menilai pengetahuan keuangannya sebagai pemula.",
                        )
                      : t(
                          "Showing the detailed version, because the profile rates its financial knowledge as intermediate or advanced.",
                          "Menampilkan versi rinci, karena profil ini menilai pengetahuan keuangannya menengah atau mahir.",
                        )}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setAdaptiveView(literacyLevel === "low" ? "high" : "low")}
                  >
                    {literacyLevel === "low"
                      ? t("See the detailed version", "Lihat versi rinci")
                      : t("See the plain version", "Lihat versi sederhana")}
                  </Button>
                </div>
              )}
              <ExplanationArea
                result={result}
                content={content}
                form={form}
                literacyLevel={literacyLevel}
                researcherNote={researcher}
                showModelPicker
              />
            </div>

            <OutcomeGuide result={result} />

            {/* Profile recap */}
            <section className="rounded-2xl border border-border/70 bg-muted/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("The profile behind this", "Profil di balik ini")}
                </p>
                <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setStep("profile")}>
                  <Pencil data-icon="inline-start" /> {t("Edit", "Ubah")}
                </Button>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                {[
                  `${t("Age", "Usia")} ${profile.age}`,
                  `${profile.horizon} ${t("year horizon", "tahun horizon")}`,
                  `${t("Risk tolerance", "Toleransi risiko")}: ${labelValue(result.labels.tolerance)}`,
                  `${t("Risk capacity", "Kapasitas risiko")}: ${labelValue(result.labels.capacity)}`,
                  `${t("Liquidity need", "Kebutuhan likuiditas")}: ${labelValue(result.labels.liquidity)}`,
                ].map((chip) => (
                  <li key={chip} className="rounded-full border border-border/80 bg-background px-3 py-1">
                    {chip}
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-full" onClick={() => setStep("style")}>
                <RefreshCw data-icon="inline-start" /> {t("Try another explanation style", "Coba gaya penjelasan lain")}
              </Button>
              <Button variant="ghost" className="rounded-full" onClick={() => setStep("profile")}>
                {t("Change the profile", "Ubah profilnya")}
              </Button>
            </div>

            <TryResponse
              key={`${preset}|${form}|${content.join("+")}|${JSON.stringify(profile)}|${scenario}`}
              result={result}
              condition={preset}
              content={content}
              form={form}
              advisorId={advisorId}
              profileSource={profileSource}
              shownAt={shownAt}
            />

            {/* Study CTA */}
            <section className="cta-panel relative overflow-hidden rounded-[1.75rem] border border-border/70 px-6 py-10 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("Now the research question", "Sekarang pertanyaan penelitiannya")}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {t(
                  "Did that explanation help you judge the advice, or just make it feel convincing? Ten anonymous minutes with six cases is how we find out.",
                  "Apakah penjelasan tadi membantu Anda menilai sarannya, atau sekadar membuatnya terasa meyakinkan? Sepuluh menit anonim dengan enam kasus adalah cara kami mencari tahu.",
                )}
              </p>
              <Button asChild className="mt-5 h-11 rounded-full px-6">
                <Link href="/participate">
                  {t("Take part in the study", "Ikut serta dalam studi")} <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
