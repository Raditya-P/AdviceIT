import Link from "next/link";
import { ArrowRight, Brain, FileSearch, MessageSquareText, Scale, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { logitMeta, mlMeta } from "@/lib/advisor/advisors";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,--theme(--color-primary/8%),transparent)]"
          />
          <div className="mx-auto flex min-h-[62svh] max-w-6xl flex-col items-center justify-center gap-8 px-4 py-20 text-center">
            <Badge variant="secondary" className="gap-2">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              Open research study · pilot · anonymous
            </Badge>
            <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              When an AI gives you <span className="text-primary">financial advice</span>, what makes you trust it right?
            </h1>
            <p className="max-w-2xl text-balance text-lg text-muted-foreground">
              People follow flawed AI advice and reject sound advice every day. This study tests which explanations help
              people rely on AI investment advice appropriately. Try the advisors, then lend us ten minutes.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <Link href="/advisor/ml">
                  Try the AI advisor <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-6 text-base">
                <Link href="/advisor/logit">Try the interpretable rule-based advisor</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Ready to contribute?{" "}
              <Link href="/participate" className="font-medium text-primary underline underline-offset-4">
                Join the study
              </Link>{" "}
              · 10 to 15 minutes, fully anonymous
            </p>
          </div>
        </section>

        {/* Why this research */}
        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:gap-16">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight">What this research is for</h2>
              <p className="text-muted-foreground">
                Robo-advisors already manage real money, and explainable AI promises to make their advice
                understandable. But an explanation is only useful if it calibrates trust: helping you follow advice when
                it is sound and push back when it is flawed. Which explanation styles actually do that is an open
                question, and it is the question behind this instrument, built as a follow-up to a systematic
                literature review on trust and algorithm aversion in AI financial advice (SSRAAI 2026).
              </p>
              <p className="text-muted-foreground">
                Two advisors power the study, both trained on ILS-Bench, a benchmark of 400 investor cases validated by
                a panel of four financial-domain experts. One is a neural network whose explanations must be computed
                after the fact. One is an interpretable scorecard whose explanations are exact. Comparing them turns
                explanation faithfulness itself into something we can measure.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight">Why we need your responses</h2>
              <p className="text-muted-foreground">
                Models can be benchmarked automatically. Trust cannot. Whether an explanation helps a person rely on
                advice appropriately can only be learned from people making decisions, which is exactly what the study
                session records: you read short hypothetical cases, see the advisor&apos;s recommendation with one
                explanation style, and tell us what you would do.
              </p>
              <p className="text-muted-foreground">
                Everything is anonymous. No name, email or account data is collected, the cases are hypothetical, no
                real money is involved, and some recommendations are deliberately altered so that appropriate reliance
                can be measured at all. You are told which ones at the end.
              </p>
            </div>
          </div>
        </section>

        {/* The usual stuff: what is inside */}
        <section>
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-semibold tracking-tight">What you will find inside</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <Card key={f.title} className="border-border/60">
                  <CardContent className="space-y-2 pt-6">
                    <f.icon className="size-5 text-primary" />
                    <h3 className="font-medium">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Numbers strip */}
        <section className="border-y border-border/60 bg-muted/30">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 text-center md:grid-cols-4">
            <Stat value="400" label="expert-validated cases behind the advisors" />
            <Stat value={`${Math.round((mlMeta.cvAccuracy as number) * 100)}%`} label="cross-validated accuracy, AI advisor" />
            <Stat value={`${Math.round((logitMeta.cvAccuracy as number) * 100)}%`} label="cross-validated accuracy, interpretable advisor" />
            <Stat value="7" label="explanation styles you can experience" />
          </div>
        </section>

        {/* Final CTA */}
        <section>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-20 text-center">
            <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Ten minutes of your judgement is a datapoint no model can fake.
            </h2>
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href="/participate">
                Participate in the study <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">Anonymous · hypothetical cases · you see a debrief at the end</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="text-4xl font-semibold tracking-tight text-primary">{value}</div>
      <div className="mx-auto max-w-[22ch] text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Brain,
    title: "Two advisors, same expert data",
    text: "A neural network and an interpretable scorecard, both trained on the ILS-Bench expert consensus. One opaque, one transparent, so explanation faithfulness becomes a variable.",
  },
  {
    icon: ShieldCheck,
    title: "An advisor that knows its limits",
    text: "The experts refused to automate almost half of the cases. Both advisors learned that, and can answer Human review instead of a portfolio.",
  },
  {
    icon: SlidersHorizontal,
    title: "Explanations you can steer",
    text: "Move the inputs, switch inputs off, ask why not another outcome. Every preview is a real re-run of the model, nothing is faked.",
  },
  {
    icon: MessageSquareText,
    title: "A conversational explainer, in your browser",
    text: "An open-weight language model runs on your GPU through WebLLM, grounded only on the computed facts, and can read a free-text description into the form.",
  },
  {
    icon: Scale,
    title: "Sound and flawed advice",
    text: "Some study recommendations are deliberately shifted the wrong way while the explanation stays honest. Noticing the mismatch is the skill the study measures.",
  },
  {
    icon: FileSearch,
    title: "Full transparency",
    text: "The training data, the cross-validated results, the confusion matrix and every one of the 400 cases are on the Training data page. The scorecard's weights are printed in full.",
  },
];
