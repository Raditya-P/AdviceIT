"use client";

/* Taking part. The primary action assigns a style at random, which is the
   methodologically clean path and is logged as "random". Picking a card is
   allowed and logged as "chosen", so the two strata stay separable in the
   analysis. "No explanation" is not a card, but it stays in the random pool
   as the control. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Clock3,
  Dices,
  Gauge,
  GraduationCap,
  Layers,
  Lock,
  MessageSquareText,
  Shuffle,
  SlidersHorizontal,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    title: "Hanya interaktif",
    tagline: "Geser sendiri inputnya, tanpa tulisan apa pun yang menjelaskan sarannya.",
  },
  "interactive-hybrid": {
    title: "Interaktif dengan ketiganya",
    tagline: "Ketiga penjelasan sekaligus, ditambah kendali untuk menggeser input dan melihat sarannya bereaksi.",
  },
  adaptive: { title: "Adaptif", tagline: "Penjelasan yang menyesuaikan diri dengan literasi keuangan Anda." },
  llm: { title: "Percakapan", tagline: "Mengobrol dengan penjelas yang berjalan sepenuhnya di browser Anda." },
};

/* Two factors, shown as two groups: the content presets change what is
   explained, the delivery presets change how the same three contents reach
   you. Card ids and logging are unchanged. */
const GROUPS: { key: string; items: string[] }[] = [
  { key: "content", items: ["feature", "counterfactual", "confidence", "hybrid"] },
  { key: "delivery", items: ["interactive-hybrid", "adaptive", "llm", "interactive"] },
];

const ICONS: Record<string, LucideIcon> = {
  feature: BarChart3,
  counterfactual: Shuffle,
  confidence: Gauge,
  hybrid: Layers,
  interactive: SlidersHorizontal,
  "interactive-hybrid": SlidersHorizontal,
  adaptive: GraduationCap,
  llm: MessageSquareText,
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

  const FACTS = [
    { icon: Clock3, text: t("About 15 minutes", "Sekitar 15 menit") },
    { icon: Lock, text: t("Anonymous, no account", "Anonim, tanpa akun") },
    { icon: Layers, text: t("Six made-up cases", "Enam kasus rekaan") },
    { icon: Wallet, text: t("No real money involved", "Tanpa uang sungguhan") },
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/70">
          <div aria-hidden className="surface-glow" />
          <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t("Take part", "Ikut serta")}
            </p>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {t("Help us find out what makes AI advice trustworthy", "Bantu kami menemukan apa yang membuat saran AI layak dipercaya")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t(
                "You read six short cases about made-up people. For each one, the advisor recommends something and explains why. You tell us what you would do. That is the whole session.",
                "Anda membaca enam kasus singkat tentang orang rekaan. Untuk tiap kasus, penasihat merekomendasikan sesuatu dan menjelaskan mengapa. Anda memberi tahu kami apa yang akan Anda lakukan. Itu saja sesinya.",
              )}
            </p>
            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {FACTS.map((f) => (
                <li key={f.text} className="flex items-center gap-2">
                  <f.icon className="size-4 text-primary" aria-hidden />
                  {f.text}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col items-center gap-3">
              <Button
                size="lg"
                className="h-12 rounded-full px-8 text-base"
                disabled={busy}
                onClick={() => go(randomCondition(), "random")}
              >
                <Dices data-icon="inline-start" />
                {t("Start the study", "Mulai studinya")}
              </Button>
              <p className="max-w-md text-sm text-muted-foreground">
                {t(
                  "We pick the kind of explanation you will see. You do not need to choose anything. Some people get a session with no explanation at all, and that is a normal part of the study.",
                  "Kami yang memilih jenis penjelasan yang akan Anda lihat. Anda tidak perlu memilih apa pun. Sebagian orang mendapat sesi tanpa penjelasan sama sekali, dan itu bagian normal dari studi.",
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <details className="group rounded-[1.5rem] border border-border/70 bg-muted/30 p-5 sm:p-6">
            <summary className="cursor-pointer list-none">
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-lg font-semibold tracking-tight">
                  {t("Prefer to choose the explanation style yourself?", "Ingin memilih sendiri gaya penjelasannya?")}
                </span>
                <span className="text-sm text-primary group-open:hidden">{t("Show the options", "Tampilkan pilihannya")}</span>
              </span>
              <span className="mt-1 block max-w-2xl text-sm text-muted-foreground">
                {t(
                  "Optional. The button above is the normal way in. If you choose a style here, we record that it was your choice and keep those sessions separate.",
                  "Opsional. Tombol di atas adalah jalan masuk yang biasa. Jika Anda memilih gaya di sini, kami mencatat bahwa itu pilihan Anda dan memisahkan sesi tersebut.",
                )}
              </span>
            </summary>
          <div className="mt-2">

          {GROUPS.map((group) => (
            <div key={group.key} className="mt-9 space-y-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {group.key === "content"
                    ? t("What is explained", "Apa yang dijelaskan")
                    : t("How it is delivered", "Bagaimana penyajiannya")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {group.key === "content"
                    ? t(
                        "Different material about the same recommendation, shown as a static panel.",
                        "Materi yang berbeda tentang rekomendasi yang sama, ditampilkan sebagai panel statis.",
                      )
                    : t(
                        "The same three contents, handed over in a different way. The last one drops the written explanation entirely.",
                        "Ketiga konten yang sama, disampaikan dengan cara berbeda. Yang terakhir menghilangkan penjelasan tertulis sepenuhnya.",
                      )}
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.filter((c) => group.items.includes(c.id)).map((c) => {
              const gpuBlocked = c.needsGpu && !llm.supported();
              const disp = locale === "id" ? (CARDS_ID[c.id] ?? c) : c;
              const Icon = ICONS[c.id] ?? Layers;
              return (
                <article
                  key={c.id}
                  className={`panel lift flex flex-col p-6 ${gpuBlocked ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    {c.needsGpu && (
                      <Badge variant="secondary" className="text-[11px]">
                        {t("needs a modern GPU browser", "butuh browser dengan GPU modern")}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{disp.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{disp.tagline}</p>
                  <Button
                    variant="outline"
                    className="mt-5 w-full rounded-full"
                    disabled={busy || gpuBlocked}
                    onClick={() => go(c.id, "chosen")}
                  >
                    {gpuBlocked
                      ? t("Not available in this browser", "Tidak tersedia di browser ini")
                      : t("Start with this style", "Mulai dengan gaya ini")}
                  </Button>
                </article>
              );
            })}
              </div>
            </div>
          ))}

          </div>
          </details>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t(
              "Either way, the session ends with a debrief that tells you which recommendations were deliberately wrong.",
              "Bagaimanapun caranya, sesi berakhir dengan debrief yang memberi tahu Anda rekomendasi mana yang sengaja dibuat keliru.",
            )}{" "}
            <Link href="/about#researchers" className="font-medium text-primary underline underline-offset-4">
              {t("Researchers: how the study is designed", "Peneliti: bagaimana studi ini dirancang")}
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
