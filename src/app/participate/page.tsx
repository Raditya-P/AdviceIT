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
import { tr, useLang } from "@/lib/i18n";
import { randomCondition } from "@/lib/study";
import * as llm from "@/lib/llm";

const CARDS_ID: Record<string, { title: string; tagline: string }> = {
  feature: { title: "Mengapa", tagline: "Lihat input Anda yang mana yang mendorong saran, dan seberapa besar." },
  counterfactual: {
    title: "Apa yang mengubahnya",
    tagline: "Perubahan terkecil pada situasi Anda yang akan membalik sarannya.",
  },
  confidence: {
    title: "Seberapa yakin",
    tagline: "Keyakinan terkalibrasi si penasihat, dengan gambaran probabilitas lengkap.",
  },
  hybrid: { title: "Ketiganya", tagline: "Mengapa, apa yang mengubahnya, dan seberapa yakin, bersama-sama." },
  interactive: {
    title: "What-if interaktif",
    tagline: "Kendalikan sendiri inputnya dan lihat sarannya bereaksi seketika.",
  },
  adaptive: { title: "Adaptif", tagline: "Penjelasan yang menyesuaikan diri dengan literasi keuangan Anda." },
  llm: { title: "Percakapan", tagline: "Mengobrol dengan penjelas yang berjalan sepenuhnya di browser Anda." },
};

export default function ParticipatePage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });

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
            <h1 className="text-4xl font-semibold tracking-tight">
              {t("Meet the explanation styles", "Kenali gaya-gaya penjelasan")}
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {t(
                "In the study you will see the advisor's recommendations with one of these explanation styles. For the research to be clean, the style should be assigned at random. You can also pick one, and we record that it was your choice.",
                "Dalam studi Anda akan melihat rekomendasi penasihat dengan salah satu gaya penjelasan ini. Agar penelitiannya bersih, gaya sebaiknya ditetapkan secara acak. Anda juga boleh memilih satu, dan kami mencatat bahwa itu pilihan Anda.",
              )}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button size="lg" className="h-12 px-7 text-base" disabled={busy} onClick={() => go(randomCondition(), "random")}>
              <Dices data-icon="inline-start" />{" "}
              {t("Assign me randomly (recommended for the research)", "Tetapkan saya secara acak (disarankan untuk penelitian)")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t(
                "Random assignment can also give you a control session without any explanation.",
                "Penetapan acak juga bisa memberi Anda sesi kontrol tanpa penjelasan sama sekali.",
              )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((c) => {
              const gpuBlocked = c.needsGpu && !llm.supported();
              const disp = locale === "id" ? (CARDS_ID[c.id] ?? c) : c;
              return (
                <Card key={c.id} className={`transition-shadow hover:shadow-md ${gpuBlocked ? "opacity-60" : ""}`}>
                  <CardContent className="flex h-full flex-col gap-2 pt-6">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold tracking-tight">{disp.title}</h2>
                      {c.needsGpu && (
                        <Badge variant="secondary" className="gap-1 text-[11px]">
                          <Gpu className="size-3" /> {t("needs a modern GPU browser", "butuh browser dengan GPU modern")}
                        </Badge>
                      )}
                    </div>
                    <p className="flex-1 text-sm text-muted-foreground">{disp.tagline}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="self-start"
                      disabled={busy || gpuBlocked}
                      onClick={() => go(c.id, "chosen")}
                    >
                      {gpuBlocked
                        ? t("Not available in this browser", "Tidak tersedia di browser ini")
                        : t("Choose this style", "Pilih gaya ini")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {t(
              "The advisor itself (AI or interpretable rule-based) is assigned at random either way. The session takes 10 to 15 minutes and ends with a debrief.",
              "Penasihatnya sendiri (AI atau interpretable berbasis aturan) tetap ditetapkan secara acak. Sesi memakan waktu 10 sampai 15 menit dan diakhiri dengan debrief.",
            )}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
