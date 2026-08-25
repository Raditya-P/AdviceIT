"use client";

/* "Your response" for visitors trying an advisor. It records the same
   measures as a study trial, but the person chose their own explanation
   style and wrote their own profile, so the row is stored as rowType
   "explore" and stays out of the experimental analysis. The panel says so
   before anything is sent. */

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Database } from "lucide-react";
import { RatingSlider } from "@/components/rating-slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { PORTFOLIOS } from "@/lib/advisor/model";
import { outcomeName } from "@/lib/advisor/strings";
import type { AdvisorResult } from "@/lib/advisor/types";
import type { ContentPart, Form } from "@/lib/conditions";
import { tr, useLang } from "@/lib/i18n";
import { submitRow, visitorId, type StudyRow } from "@/lib/records";
import { Seg } from "./profile-form";

export function TryResponse({
  result,
  condition,
  content,
  form,
  advisorId,
  profileSource,
  shownAt,
}: {
  result: AdvisorResult;
  condition: string;
  content: ContentPart[];
  form: Form;
  advisorId: "ml" | "logit";
  profileSource: "form" | "example" | "ils-bench" | "narrative";
  shownAt: number;
}) {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const [trust, setTrust] = useState(4);
  const [decision, setDecision] = useState("");
  const [adjustedTo, setAdjustedTo] = useState("");
  const [understanding, setUnderstanding] = useState(4);
  const [decisionConfidence, setDecisionConfidence] = useState(4);
  const [mentalDemand, setMentalDemand] = useState(4);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"server" | "local" | null>(null);
  const tries = useRef(0);

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
    tries.current += 1;
    const p = result.profile;
    const names = PORTFOLIOS.map((x) => x.name);
    const shownIdx = names.indexOf(result.portfolio.name);
    const adjIdx = adjustedTo ? names.indexOf(adjustedTo) : -1;
    const ok = await submitRow({
      rowType: "explore",
      timestamp: new Date().toISOString(),
      participantId: visitorId(),
      condition,
      explanationContent: content.join("+"),
      explanationForm: form,
      assignedBy: "chosen",
      advisorModel: advisorId,
      advisorAssignedBy: "chosen",
      language: locale,
      scenario: result.flawed ? "flawed" : "sound",
      profileSource,
      tryIndex: tries.current,
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
      decisionTimeMs: shownAt ? Date.now() - shownAt : 0,
      userAgentMobile: typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent),
    } as StudyRow);
    setBusy(false);
    setDone(ok ? "server" : "local");
  };

  if (done) {
    return (
      <section className="panel p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="size-4" aria-hidden />
          </span>
          <div className="space-y-3">
            <h2 className="font-semibold tracking-tight">{t("Thank you, that is recorded", "Terima kasih, jawaban Anda tercatat")}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {done === "local"
                ? t(
                    "The network was unavailable, so your answer is held in this browser and sent with the next one.",
                    "Jaringan tidak tersedia, jadi jawaban Anda disimpan di browser ini dan dikirim bersama jawaban berikutnya.",
                  )
                : t(
                    "It is stored anonymously as a tryout, separately from the study sessions. The real experiment assigns the explanation style at random and uses fixed cases, which is what makes the results comparable.",
                    "Jawaban disimpan secara anonim sebagai uji coba, terpisah dari sesi studi. Eksperimen sesungguhnya menetapkan gaya penjelasan secara acak dan memakai kasus yang tetap, dan itulah yang membuat hasilnya dapat dibandingkan.",
                  )}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full">
                <Link href="/participate">
                  {t("Take part in the real study", "Ikut serta dalam studi sesungguhnya")}{" "}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button variant="ghost" className="rounded-full" onClick={() => setDone(null)}>
                {t("Answer again", "Jawab lagi")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-5 py-4 sm:px-6">
        <h2 className="font-semibold tracking-tight">{t("Your response", "Respons Anda")}</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Database className="size-3.5" aria-hidden />
          {t("Optional, anonymous, kept apart from the study", "Opsional, anonim, dipisahkan dari studi")}
        </span>
      </header>
      <div className="space-y-5 p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(
            "You picked this explanation style and this profile yourself, so these answers cannot serve as experimental data. They still tell us how the styles land, so if you have a minute they are welcome.",
            "Anda sendiri yang memilih gaya penjelasan dan profil ini, sehingga jawaban ini tidak bisa menjadi data eksperimen. Tetap saja jawaban ini memberi tahu kami bagaimana tiap gaya terasa, jadi jika Anda punya waktu sebentar, kami menerimanya dengan senang hati.",
          )}
        </p>

        <div className="space-y-1.5">
          <Label>
            {t("How much do you trust this recommendation?", "Seberapa besar Anda memercayai rekomendasi ini?")}{" "}
            <span className="tabular-nums text-primary">{trust}</span> {t("of", "dari")} 7
          </Label>
          <Slider
            min={1}
            max={7}
            step={1}
            value={[trust]}
            onValueChange={(v: number[]) => setTrust(v[0])}
            aria-label={t("Trust rating", "Penilaian kepercayaan")}
          />
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
            <div className="mt-2 space-y-1.5 rounded-xl bg-muted/60 p-3">
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

        <details className="rounded-xl border border-border/70 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-primary">
            {t("A few more questions about this decision", "Beberapa pertanyaan lagi tentang keputusan ini")}
          </summary>
          <div className="mt-3 space-y-4">
            <RatingSlider
              label={t(
                "How well do you understand why this advice was given?",
                "Seberapa baik Anda memahami mengapa saran ini diberikan?",
              )}
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
              <Label htmlFor="try-reason">
                {t("Why did you decide this? (optional)", "Mengapa Anda memutuskan demikian? (opsional)")}
              </Label>
              <Textarea
                id="try-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("In your own words", "Dengan kata-kata Anda sendiri")}
              />
            </div>
          </div>
        </details>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={busy} size="lg" className="h-11 rounded-full px-6">
          {t("Send my response", "Kirim respons saya")}
        </Button>
      </div>
    </section>
  );
}
