"use client";

/* The seven explanation-style cards. The primary action assigns a style at
   random, which is the methodologically clean path and is logged as
   "random". Picking a card is allowed and logged as "chosen", so the two
   strata stay separable in the analysis. "No explanation" is not a card,
   but it stays in the random pool as the control. */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dices, Gpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CARDS } from "@/lib/conditions";
import { randomCondition } from "@/lib/study";
import * as llm from "@/lib/llm";

export default function ParticipatePage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const go = (condition: string, assignedBy: "random" | "chosen") => {
    setBusy(true);
    router.push(`/study?cond=${condition}&by=${assignedBy}`);
  };

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-semibold tracking-tight">Meet the explanation styles</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              In the study you will see the advisor&apos;s recommendations with one of these explanation styles. For the
              research to be clean, the style should be assigned at random. You can also pick one, and we record that it
              was your choice.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button size="lg" className="h-12 px-7 text-base" disabled={busy} onClick={() => go(randomCondition(), "random")}>
              <Dices data-icon="inline-start" /> Assign me randomly (recommended for the research)
            </Button>
            <p className="text-xs text-muted-foreground">
              Random assignment can also give you a control session without any explanation.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((c) => {
              const gpuBlocked = c.needsGpu && !llm.supported();
              return (
                <Card key={c.id} className={`transition-shadow hover:shadow-md ${gpuBlocked ? "opacity-60" : ""}`}>
                  <CardContent className="flex h-full flex-col gap-2 pt-6">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold tracking-tight">{c.title}</h2>
                      {c.needsGpu && (
                        <Badge variant="secondary" className="gap-1 text-[11px]">
                          <Gpu className="size-3" /> needs a modern GPU browser
                        </Badge>
                      )}
                    </div>
                    <p className="flex-1 text-sm text-muted-foreground">{c.tagline}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="self-start"
                      disabled={busy || gpuBlocked}
                      onClick={() => go(c.id, "chosen")}
                    >
                      {gpuBlocked ? "Not available in this browser" : "Choose this style"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            The advisor itself (AI or interpretable rule-based) is assigned at random either way. The session takes 10
            to 15 minutes and ends with a debrief.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
