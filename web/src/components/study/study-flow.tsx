"use client";

/* The full study flow: consent, the Big Three literacy questions, six
   trials (half sound, half flawed, order seeded by the participant ID),
   an attention check, an exit questionnaire, a debrief naming the flawed
   trials, and a done screen with a verifiable completion code.

   Assignment: the explanation condition comes from /participate (random by
   default, a chosen card is allowed and logged as chosen). The advisor is
   randomised here and logged. One row is POSTed per trial plus one exit
   row, with a localStorage buffer as fallback.

   Language: the participant-facing texts follow the site language toggle.
   Logged values (decisions, portfolio names, labels, option values) stay
   English canonical whatever the display language, and the language is
   logged per row. */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ADVISORS } from "@/lib/advisor/advisors";
import { PORTFOLIOS, applyFlawedScenario } from "@/lib/advisor/model";
import { outcomeName } from "@/lib/advisor/strings";
import type { AdvisorResult } from "@/lib/advisor/types";
import { presetLabel, type ContentPart, type Form } from "@/lib/conditions";
import { tr, useLang } from "@/lib/i18n";
import { markParticipated, priorParticipation, submitRow, type StudyRow } from "@/lib/records";
import {
  LITERACY_CORRECT,
  buildPlan,
  caseDisplay,
  completionCode,
  literacyFor,
  randomAdvisor,
  randomParticipantId,
  textsFor,
  type Trial,
} from "@/lib/study";
import { ExplanationArea } from "@/components/advisor/explanation-area";
import { RecommendationCard } from "@/components/advisor/recommendation-card";
import { Seg } from "@/components/advisor/profile-form";

type Stage = "consent" | "literacy" | "trial" | "exit" | "debrief" | "done";

export interface Assignment {
  condition: string;
  content: ContentPart[];
  form: Form;
  assignedBy: "random" | "chosen";
  pid?: string;
}

export function StudyFlow({ assignment }: { assignment: Assignment }) {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const TX = textsFor(locale);
  const LQ = literacyFor(locale);

  const [pid] = useState(() => assignment.pid || randomParticipantId());
  const [advisorId] = useState<"ml" | "logit">(() => randomAdvisor());
  const [stage, setStage] = useState<Stage>("consent");
  const [consented, setConsented] = useState(false);
  const [litAnswers, setLitAnswers] = useState<Record<string, string>>({});
  const [litError, setLitError] = useState("");
  const [trialIdx, setTrialIdx] = useState(0);
  const [saved, setSaved] = useState<"server" | "local" | null>(null);
  const [exit1, setExit1] = useState("");
  const [exit2, setExit2] = useState("");
  const prior = useMemo(() => (typeof window === "undefined" ? null : priorParticipation()), []);

  const plan = useMemo(() => buildPlan(pid, 6), [pid]);
  const advisor = ADVISORS[advisorId];

  const literacyScore = useMemo(() => {
    let score = 0;
    let answered = 0;
    for (const q of LQ) {
      const v = litAnswers[q.name];
      if (v) {
        answered++;
        if (v === LITERACY_CORRECT[q.name]) score++;
      }
    }
    return { score, answered };
  }, [litAnswers, LQ]);
  const literacyLevel: "low" | "high" = literacyScore.score >= 2 ? "high" : "low";

  const baseRow = (): Omit<StudyRow, "rowType" | "timestamp"> => ({
    participantId: pid,
    condition: assignment.condition,
    explanationContent: assignment.content.join("+"),
    explanationForm: assignment.form,
    assignedBy: assignment.assignedBy,
    advisorModel: advisorId,
    advisorAssignedBy: "random",
    language: locale,
    literacyScore: literacyScore.answered ? literacyScore.score : "",
    literacyAnswers: LQ.map((q) => litAnswers[q.name] || "").join("|"),
    literacyLevel,
    userAgentMobile: typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent),
  });

  const submitTrial = async (row: Partial<StudyRow>) => {
    const ok = await submitRow({ ...baseRow(), rowType: "trial", timestamp: new Date().toISOString(), ...row } as StudyRow);
    setSaved(ok ? "server" : "local");
  };

  const finishExit = async () => {
    await submitRow({
      ...baseRow(),
      rowType: "exit",
      timestamp: new Date().toISOString(),
      exitDistrustMoment: exit1.trim().slice(0, 2000),
      exitMissingExplanation: exit2.trim().slice(0, 2000),
    } as StudyRow);
    markParticipated(pid);
    setStage("debrief");
  };

  /* ---------------------------- Stages ---------------------------- */
  if (stage === "consent") {
    return (
      <StageShell title={TX.consentTitle}>
        {prior && (
          <Alert>
            <AlertTitle>{t("It looks like you already took part", "Sepertinya Anda sudah pernah ikut serta")}</AlertTitle>
            <AlertDescription>
              {t(
                `This browser completed a session as ${prior.pid}. A second run is fine for trying things out, but the researcher may exclude repeat sessions from the analysis.`,
                `Browser ini menyelesaikan sesi sebagai ${prior.pid}. Menjalankan sesi kedua boleh saja untuk mencoba-coba, tetapi peneliti dapat mengecualikan sesi berulang dari analisis.`,
              )}
            </AlertDescription>
          </Alert>
        )}
        {TX.consent.map((para, i) => (
          <p key={i} className="text-muted-foreground">
            {para}
          </p>
        ))}
        <label className="flex items-start gap-2 pt-2 font-medium">
          <Checkbox checked={consented} onCheckedChange={(v) => setConsented(v === true)} className="mt-0.5" />
          {t(
            "I have read the information above and I agree to take part.",
            "Saya telah membaca informasi di atas dan setuju untuk ikut serta.",
          )}
        </label>
        <div className="flex items-center gap-3 pt-2">
          <Button disabled={!consented} onClick={() => setStage("literacy")}>
            {t("Start", "Mulai")}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">{t("Back to the homepage", "Kembali ke beranda")}</Link>
          </Button>
        </div>
      </StageShell>
    );
  }

  if (stage === "literacy") {
    return (
      <StageShell title={TX.literacyTitle}>
        <p className="text-muted-foreground">{TX.literacyIntro}</p>
        {LQ.map((q, i) => (
          <div key={q.name} className="space-y-2">
            <p className="font-medium">
              {i + 1}. {q.text}
            </p>
            <Seg
              name={t(`Literacy question ${i + 1}`, `Pertanyaan literasi ${i + 1}`)}
              options={q.options}
              value={litAnswers[q.name] || ""}
              onChange={(v) => setLitAnswers((a) => ({ ...a, [q.name]: v }))}
            />
          </div>
        ))}
        {litError && <p className="text-sm text-destructive">{litError}</p>}
        <Button
          onClick={() => {
            if (literacyScore.answered < 3) {
              setLitError(
                t(
                  'Please answer all three questions ("Do not know" is a valid answer).',
                  'Mohon jawab ketiga pertanyaan ("Tidak tahu" adalah jawaban yang sah).',
                ),
              );
              return;
            }
            setStage("trial");
          }}
        >
          {t("Continue", "Lanjut")}
        </Button>
      </StageShell>
    );
  }

  if (stage === "trial") {
    const trial = plan[trialIdx];
    return (
      <TrialStage
        key={trial.index}
        trial={trial}
        total={plan.length}
        advisorRecommend={(p) => {
          const r = advisor.recommend(p);
          return trial.scenario === "flawed" ? applyFlawedScenario(r) : r;
        }}
        assignment={assignment}
        literacyLevel={literacyLevel}
        saved={saved}
        onSubmit={async (row) => {
          await submitTrial(row);
          if (trialIdx + 1 < plan.length) setTrialIdx((i) => i + 1);
          else setStage("exit");
        }}
      />
    );
  }

  if (stage === "exit") {
    return (
      <StageShell title={TX.exitTitle}>
        <p className="text-muted-foreground">{TX.exitIntro}</p>
        <div className="space-y-1.5">
          <Label htmlFor="exit1">{TX.exitQ1}</Label>
          <Textarea id="exit1" rows={3} value={exit1} onChange={(e) => setExit1(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exit2">{TX.exitQ2}</Label>
          <Textarea id="exit2" rows={3} value={exit2} onChange={(e) => setExit2(e.target.value)} />
        </div>
        <Button onClick={finishExit}>{t("Continue", "Lanjut")}</Button>
      </StageShell>
    );
  }

  if (stage === "debrief") {
    return (
      <StageShell title={TX.debriefTitle}>
        <p className="text-muted-foreground">{TX.debriefIntro}</p>
        <ul className="list-disc pl-5">
          {plan
            .filter((tt) => tt.scenario === "flawed")
            .map((tt) => (
              <li key={tt.index}>
                {t("Case", "Kasus")} {tt.index + 1} ({caseDisplay(tt, locale).label})
              </li>
            ))}
        </ul>
        <p className="text-muted-foreground">{TX.debriefOutro}</p>
        <Button onClick={() => setStage("done")}>{t("Finish", "Selesai")}</Button>
      </StageShell>
    );
  }

  return (
    <StageShell title={TX.doneTitle}>
      <p className="text-muted-foreground">{TX.done}</p>
      <p className="rounded-lg border bg-muted/40 px-4 py-3 text-center font-mono text-2xl tracking-widest">
        {completionCode(pid)}
      </p>
      <p className="text-sm text-muted-foreground">
        {locale === "id" ? (
          <>
            ID partisipan Anda adalah <span className="font-mono">{pid}</span>. Simpan jika suatu saat Anda ingin data
            Anda dihapus.
          </>
        ) : (
          <>
            Your participant ID is <span className="font-mono">{pid}</span>. Keep it if you may want your data deleted
            later.
          </>
        )}
        {saved === "local" &&
          t(
            " Note: the responses could not reach the server and are stored in this browser. They will be sent when you revisit this site online.",
            " Catatan: respons belum bisa mencapai server dan tersimpan di browser ini. Respons akan terkirim saat Anda membuka kembali situs ini dalam keadaan online.",
          )}
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">{t("Back to the homepage", "Kembali ke beranda")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/training-data">{t("See what powers the advisors", "Lihat apa yang menggerakkan para penasihat")}</Link>
        </Button>
      </div>
    </StageShell>
  );
}

function StageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------ One trial ------------------------------ */
function TrialStage({
  trial,
  total,
  advisorRecommend,
  assignment,
  literacyLevel,
  saved,
  onSubmit,
}: {
  trial: Trial;
  total: number;
  advisorRecommend: (p: Trial["profile"]) => AdvisorResult;
  assignment: Assignment;
  literacyLevel: "low" | "high";
  saved: "server" | "local" | null;
  onSubmit: (row: Partial<StudyRow>) => Promise<void>;
}) {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const shown = caseDisplay(trial, locale);
  const result = useMemo(() => advisorRecommend(trial.profile), [advisorRecommend, trial.profile]);
  const displayedAt = useRef(Date.now());
  const [trust, setTrust] = useState(4);
  const [decision, setDecision] = useState("");
  const [adjustedTo, setAdjustedTo] = useState("");
  const [understanding, setUnderstanding] = useState(4);
  const [decisionConfidence, setDecisionConfidence] = useState(4);
  const [mentalDemand, setMentalDemand] = useState(4);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [whatIfMoves, setWhatIfMoves] = useState(0);
  const [whyNotAsked, setWhyNotAsked] = useState(0);
  const llmData = useRef<{ opening: string; model: string; turns: number }>({ opening: "", model: "", turns: 0 });

  useEffect(() => {
    displayedAt.current = Date.now();
    window.scrollTo(0, 0);
  }, [trial.index]);

  const submit = async () => {
    if (!decision) {
      setError(
        t(
          "Please choose Follow, Adjust, Reject, or Ask a human adviser.",
          "Silakan pilih Ikuti, Sesuaikan, Tolak, atau Tanya penasihat manusia.",
        ),
      );
      return;
    }
    if (decision === "adjust" && !adjustedTo) {
      setError(t("Please choose which portfolio you would adjust to.", "Silakan pilih portofolio tujuan penyesuaian Anda."));
      return;
    }
    setError("");
    setBusy(true);
    const p = result.profile;
    const names = PORTFOLIOS.map((x) => x.name);
    const shownIdx = names.indexOf(result.portfolio.name);
    const adjIdx = adjustedTo ? names.indexOf(adjustedTo) : -1;
    await onSubmit({
      scenario: trial.scenario,
      trialIndex: trial.index + 1,
      trialProfileId: trial.profileId,
      age: p.age,
      horizon: p.horizon,
      tolerance: p.tolerance,
      toleranceInconsistent: p.toleranceInconsistent ? "yes" : "no",
      emergencyFund: p.emergencyFund ? "yes" : "no",
      incomeStable: p.incomeStable ? "stable" : "variable",
      debtObligations: p.debtObligations ? "yes" : "no",
      nearTermNeed: p.nearTermNeed ? "yes" : "no",
      knowledge: p.knowledge,
      suitabilityTolerance: result.labels.tolerance,
      suitabilityCapacity: result.labels.capacity,
      suitabilityLiquidity: result.labels.liquidity,
      recommendedPortfolio: result.portfolio.name,
      soundPortfolio: result.flawed && result.soundPortfolio ? result.soundPortfolio.name : result.portfolio.name,
      score: result.score,
      margin: result.margin,
      confidence: result.confidence,
      trustRating: trust,
      decision,
      adjustedTo,
      adjustSteps: adjustedTo && shownIdx >= 0 && adjIdx >= 0 ? adjIdx - shownIdx : "",
      understanding,
      decisionConfidence,
      mentalDemand,
      reason: reason.trim().slice(0, 2000),
      whatIfMoves: assignment.form === "interactive" ? whatIfMoves : "",
      whyNotAsked: assignment.form === "interactive" ? whyNotAsked : "",
      adaptiveVariant: assignment.form === "adaptive" ? (literacyLevel === "low" ? "plain" : "detailed") : "",
      attentionCheck: trial.attention ? (decision === "reject" ? "passed" : "failed") : "",
      decisionTimeMs: Date.now() - displayedAt.current,
      llmModel: assignment.form === "llm" ? llmData.current.model : "",
      llmExplanation: assignment.form === "llm" ? llmData.current.opening.slice(0, 4000) : "",
      llmTurns: assignment.form === "llm" ? llmData.current.turns : "",
    });
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <p className="text-sm text-muted-foreground">
        {t("Case", "Kasus")} {trial.index + 1} {t("of", "dari")} {total} · {t("condition", "kondisi")}{" "}
        {presetLabel(assignment.condition, locale)}
        {saved === "local" &&
          t(" · offline, responses buffered in this browser", " · offline, respons disimpan sementara di browser ini")}
      </p>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-800">
          {shown.label}. {t("Please answer as this person.", "Mohon jawab sebagai orang ini.")}
        </p>
        <p className="mt-1 text-[0.95rem] leading-relaxed text-amber-950">{shown.text}</p>
      </div>

      <RecommendationCard result={result} />
      <ExplanationArea
        result={result}
        content={assignment.content}
        form={assignment.form}
        literacyLevel={literacyLevel}
        autoStartLlm={assignment.form === "llm"}
        onInteract={(kind) => (kind === "move" ? setWhatIfMoves((n) => n + 1) : setWhyNotAsked((n) => n + 1))}
        onLlmOpening={(text, model) => {
          llmData.current.opening = text;
          llmData.current.model = model;
          displayedAt.current = Date.now();
        }}
        onLlmTurn={() => (llmData.current.turns += 1)}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("Your response", "Respons Anda")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {trial.attention && (
            <Alert>
              <AlertTitle>{t("Attention check", "Pemeriksaan atensi")}</AlertTitle>
              <AlertDescription>
                {t(
                  "For this case, please choose Reject whatever the advice says.",
                  "Untuk kasus ini, pilih Tolak apa pun sarannya.",
                )}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label>
              {t("How much do you trust this recommendation?", "Seberapa besar Anda memercayai rekomendasi ini?")}{" "}
              <span className="tabular-nums text-primary">{trust}</span> {t("of", "dari")} 7
            </Label>
            <Slider min={1} max={7} step={1} value={[trust]} onValueChange={(v: number[]) => setTrust(v[0])} aria-label={t("Trust rating", "Penilaian kepercayaan")} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("1, not at all", "1, tidak sama sekali")}</span>
              <span>{t("7, completely", "7, sepenuhnya")}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("Would you follow this advice?", "Apakah Anda akan mengikuti saran ini?")}</Label>
            <Seg
              name={t("Decision", "Keputusan")}
              options={[
                { value: "follow", label: t("Follow", "Ikuti") },
                { value: "adjust", label: t("Adjust", "Sesuaikan") },
                { value: "reject", label: t("Reject", "Tolak") },
                { value: "ask-human", label: t("Ask a human adviser", "Tanya penasihat manusia") },
              ]}
              value={decision}
              onChange={setDecision}
            />
            {decision === "adjust" && (
              <div className="mt-2 space-y-1.5 rounded-lg bg-muted/50 p-3">
                <Label>{t("Adjust to which portfolio?", "Menyesuaikan ke portofolio yang mana?")}</Label>
                <Select value={adjustedTo || undefined} onValueChange={setAdjustedTo}>
                  <SelectTrigger className="w-full max-w-64">
                    <SelectValue placeholder={t("Choose a portfolio", "Pilih portofolio")} />
                  </SelectTrigger>
                  <SelectContent>
                    {PORTFOLIOS.map((pf) => (
                      <SelectItem key={pf.id} value={pf.name}>
                        {outcomeName(pf.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <details className="rounded-lg border px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium text-primary">
              {t("A few more questions about this decision", "Beberapa pertanyaan lagi tentang keputusan ini")}
            </summary>
            <div className="mt-3 space-y-4">
              <RatingSlider
                label={t("How well do you understand why this advice was given?", "Seberapa baik Anda memahami mengapa saran ini diberikan?")}
                value={understanding}
                onChange={setUnderstanding}
                low={t("1, not at all", "1, tidak sama sekali")}
                high={t("7, completely", "7, sepenuhnya")}
              />
              <RatingSlider
                label={t("How confident are you in your decision?", "Seberapa yakin Anda dengan keputusan Anda?")}
                value={decisionConfidence}
                onChange={setDecisionConfidence}
                low={t("1, not at all", "1, tidak sama sekali")}
                high={t("7, completely", "7, sepenuhnya")}
              />
              <RatingSlider
                label={t("How mentally demanding was this decision?", "Seberapa menuntut secara mental keputusan ini?")}
                value={mentalDemand}
                onChange={setMentalDemand}
                low={t("1, very low", "1, sangat rendah")}
                high={t("7, very high", "7, sangat tinggi")}
              />
              <div className="space-y-1.5">
                <Label htmlFor="reason">{t("Why did you decide this? (optional)", "Mengapa Anda memutuskan demikian? (opsional)")}</Label>
                <Textarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("In your own words", "Dengan kata-kata Anda sendiri")} />
              </div>
            </div>
          </details>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={submit} disabled={busy}>
            {trial.index + 1 < total ? t("Submit and continue", "Kirim dan lanjut") : t("Submit final case", "Kirim kasus terakhir")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function RatingSlider({
  label,
  value,
  onChange,
  low,
  high,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  low: string;
  high: string;
}) {
  const { locale } = useLang();
  return (
    <div className="space-y-1.5">
      <Label>
        {label} <span className="tabular-nums text-primary">{value}</span> {locale === "id" ? "dari" : "of"} 7
      </Label>
      <Slider min={1} max={7} step={1} value={[value]} onValueChange={(v: number[]) => onChange(v[0])} aria-label={label} />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
