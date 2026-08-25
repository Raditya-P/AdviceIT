"use client";

/* The full study flow: consent, the Big Three literacy questions, six
   trials (half sound, half flawed, order seeded by the participant ID),
   an attention check, an exit questionnaire, a debrief naming the flawed
   trials, and a done screen with a verifiable completion code.

   Assignment: the explanation condition comes from /participate (random by
   default, a chosen card is allowed and logged as chosen). The advisor is
   randomised here and logged. One row is POSTed per trial plus one exit
   row, with a localStorage buffer as fallback. */

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
import type { AdvisorResult } from "@/lib/advisor/types";
import { PRESET_LABELS, type ContentPart, type Form } from "@/lib/conditions";
import { markParticipated, priorParticipation, submitRow, type StudyRow } from "@/lib/records";
import {
  LITERACY_CORRECT,
  LITERACY_QUESTIONS,
  TEXTS,
  buildPlan,
  completionCode,
  randomAdvisor,
  randomParticipantId,
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
    for (const q of LITERACY_QUESTIONS) {
      const v = litAnswers[q.name];
      if (v) {
        answered++;
        if (v === LITERACY_CORRECT[q.name]) score++;
      }
    }
    return { score, answered };
  }, [litAnswers]);
  const literacyLevel: "low" | "high" = literacyScore.score >= 2 ? "high" : "low";

  const baseRow = (): Omit<StudyRow, "rowType" | "timestamp"> => ({
    participantId: pid,
    condition: assignment.condition,
    explanationContent: assignment.content.join("+"),
    explanationForm: assignment.form,
    assignedBy: assignment.assignedBy,
    advisorModel: advisorId,
    advisorAssignedBy: "random",
    literacyScore: literacyScore.answered ? literacyScore.score : "",
    literacyAnswers: LITERACY_QUESTIONS.map((q) => litAnswers[q.name] || "").join("|"),
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
      <StageShell title={TEXTS.consentTitle}>
        {prior && (
          <Alert>
            <AlertTitle>It looks like you already took part</AlertTitle>
            <AlertDescription>
              This browser completed a session as {prior.pid}. A second run is fine for trying things out, but the
              researcher may exclude repeat sessions from the analysis.
            </AlertDescription>
          </Alert>
        )}
        {TEXTS.consent.map((t, i) => (
          <p key={i} className="text-muted-foreground">
            {t}
          </p>
        ))}
        <label className="flex items-start gap-2 pt-2 font-medium">
          <Checkbox checked={consented} onCheckedChange={(v) => setConsented(v === true)} className="mt-0.5" />
          I have read the information above and I agree to take part.
        </label>
        <div className="flex items-center gap-3 pt-2">
          <Button disabled={!consented} onClick={() => setStage("literacy")}>
            Start
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">Back to the homepage</Link>
          </Button>
        </div>
      </StageShell>
    );
  }

  if (stage === "literacy") {
    return (
      <StageShell title={TEXTS.literacyTitle}>
        <p className="text-muted-foreground">{TEXTS.literacyIntro}</p>
        {LITERACY_QUESTIONS.map((q, i) => (
          <div key={q.name} className="space-y-2">
            <p className="font-medium">
              {i + 1}. {q.text}
            </p>
            <Seg
              name={`Literacy question ${i + 1}`}
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
              setLitError('Please answer all three questions ("Do not know" is a valid answer).');
              return;
            }
            setStage("trial");
          }}
        >
          Continue
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
      <StageShell title={TEXTS.exitTitle}>
        <p className="text-muted-foreground">{TEXTS.exitIntro}</p>
        <div className="space-y-1.5">
          <Label htmlFor="exit1">{TEXTS.exitQ1}</Label>
          <Textarea id="exit1" rows={3} value={exit1} onChange={(e) => setExit1(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exit2">{TEXTS.exitQ2}</Label>
          <Textarea id="exit2" rows={3} value={exit2} onChange={(e) => setExit2(e.target.value)} />
        </div>
        <Button onClick={finishExit}>Continue</Button>
      </StageShell>
    );
  }

  if (stage === "debrief") {
    return (
      <StageShell title={TEXTS.debriefTitle}>
        <p className="text-muted-foreground">{TEXTS.debriefIntro}</p>
        <ul className="list-disc pl-5">
          {plan
            .filter((t) => t.scenario === "flawed")
            .map((t) => (
              <li key={t.index}>
                Case {t.index + 1} ({t.label})
              </li>
            ))}
        </ul>
        <p className="text-muted-foreground">{TEXTS.debriefOutro}</p>
        <Button onClick={() => setStage("done")}>Finish</Button>
      </StageShell>
    );
  }

  return (
    <StageShell title={TEXTS.doneTitle}>
      <p className="text-muted-foreground">{TEXTS.done}</p>
      <p className="rounded-lg border bg-muted/40 px-4 py-3 text-center font-mono text-2xl tracking-widest">
        {completionCode(pid)}
      </p>
      <p className="text-sm text-muted-foreground">
        Your participant ID is <span className="font-mono">{pid}</span>. Keep it if you may want your data deleted
        later.
        {saved === "local" &&
          " Note: the responses could not reach the server and are stored in this browser. They will be sent when you revisit this site online."}
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Back to the homepage</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/training-data">See what powers the advisors</Link>
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
      setError("Please choose Follow, Adjust, Reject, or Ask a human adviser.");
      return;
    }
    if (decision === "adjust" && !adjustedTo) {
      setError("Please choose which portfolio you would adjust to.");
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
        Case {trial.index + 1} of {total} · condition {PRESET_LABELS[assignment.condition] ?? assignment.condition}
        {saved === "local" && " · offline, responses buffered in this browser"}
      </p>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-800">
          {trial.label}. Please answer as this person.
        </p>
        <p className="mt-1 text-[0.95rem] leading-relaxed text-amber-950">{trial.text}</p>
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
          <CardTitle className="text-base">Your response</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {trial.attention && (
            <Alert>
              <AlertTitle>Attention check</AlertTitle>
              <AlertDescription>For this case, please choose Reject whatever the advice says.</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label>
              How much do you trust this recommendation? <span className="tabular-nums text-primary">{trust}</span> of 7
            </Label>
            <Slider min={1} max={7} step={1} value={[trust]} onValueChange={(v: number[]) => setTrust(v[0])} aria-label="Trust rating" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1, not at all</span>
              <span>7, completely</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Would you follow this advice?</Label>
            <Seg
              name="Decision"
              options={[
                { value: "follow", label: "Follow" },
                { value: "adjust", label: "Adjust" },
                { value: "reject", label: "Reject" },
                { value: "ask-human", label: "Ask a human adviser" },
              ]}
              value={decision}
              onChange={setDecision}
            />
            {decision === "adjust" && (
              <div className="mt-2 space-y-1.5 rounded-lg bg-muted/50 p-3">
                <Label>Adjust to which portfolio?</Label>
                <Select value={adjustedTo || undefined} onValueChange={setAdjustedTo}>
                  <SelectTrigger className="w-full max-w-64">
                    <SelectValue placeholder="Choose a portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    {PORTFOLIOS.map((pf) => (
                      <SelectItem key={pf.id} value={pf.name}>
                        {pf.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <details className="rounded-lg border px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium text-primary">A few more questions about this decision</summary>
            <div className="mt-3 space-y-4">
              <RatingSlider label="How well do you understand why this advice was given?" value={understanding} onChange={setUnderstanding} low="1, not at all" high="7, completely" />
              <RatingSlider label="How confident are you in your decision?" value={decisionConfidence} onChange={setDecisionConfidence} low="1, not at all" high="7, completely" />
              <RatingSlider label="How mentally demanding was this decision?" value={mentalDemand} onChange={setMentalDemand} low="1, very low" high="7, very high" />
              <div className="space-y-1.5">
                <Label htmlFor="reason">Why did you decide this? (optional)</Label>
                <Textarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="In your own words" />
              </div>
            </div>
          </details>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={submit} disabled={busy}>
            {trial.index + 1 < total ? "Submit and continue" : "Submit final case"}
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
  return (
    <div className="space-y-1.5">
      <Label>
        {label} <span className="tabular-nums text-primary">{value}</span> of 7
      </Label>
      <Slider min={1} max={7} step={1} value={[value]} onValueChange={(v: number[]) => onChange(v[0])} aria-label={label} />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
