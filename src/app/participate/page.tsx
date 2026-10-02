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
import { useWebGpu } from "@/lib/use-webgpu";

const CARDS_ID: Record<string, { title: string; tagline: string }> = {
  feature: { title: "Mengapa", tagline: "Lihat faktor mana yang paling memengaruhi saran, dan seberapa besar." },
  counterfactual: {
    title: "Apa yang bisa mengubahnya",
    tagline: "Perubahan terkecil pada situasi Anda yang akan mengubah sarannya.",
  },
  confidence: {
    title: "Seberapa yakin",
    tagline: "Seberapa yakin penasihat, lengkap dengan peluang setiap hasil.",
  },
  hybrid: { title: "Ketiganya", tagline: "Mengapa, apa yang bisa mengubahnya, dan seberapa yakin, sekaligus." },
  interactive: {
    title: "Interaktif saja",
    tagline: "Ubah sendiri datanya dan lihat sarannya berubah, tanpa penjelasan tertulis.",
  },
  "interactive-hybrid": {
    title: "Interaktif dengan ketiga penjelasan",
    tagline: "Ketiga penjelasan sekaligus, ditambah tombol dan penggeser untuk mengubah data dan melihat sarannya berubah.",
  },
  adaptive: { title: "Adaptif", tagline: "Penjelasan yang disesuaikan dengan pengetahuan keuangan Anda." },
  llm: { title: "Percakapan", tagline: "Tanya jawab dengan asisten AI yang berjalan sepenuhnya di browser Anda." },
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
  const webGpu = useWebGpu();

  /* The random draw happens on /study itself, so the address a participant
     sees, and might pass on to a friend, never carries a condition. A shared
     /study link draws afresh rather than putting the next person in the same
     cell under the "random" label. A chosen style still travels in the URL,
     marked as chosen. */
  const go = (chosen?: string) => {
    setBusy(true);
    router.push(chosen ? `/study?cond=${chosen}&by=chosen` : "/study");
  };

  const FACTS = [
    { icon: Clock3, text: t("About 15 minutes", "Sekitar 15 menit") },
    { icon: Lock, text: t("Anonymous, no account", "Anonim, tanpa perlu akun") },
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
              {t("Help us find out what makes AI advice trustworthy", "Bantu kami mencari tahu kapan saran AI layak dipercaya")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t(
                "You read six short cases about made-up people. For each one, the advisor recommends something and explains why, and you tell us what you would do. A few short questions before and after, and that is the session.",
                "Anda akan membaca enam kasus singkat tentang orang rekaan. Di setiap kasus, penasihat memberi rekomendasi beserta alasannya, lalu Anda memberi tahu kami apa yang akan Anda lakukan. Ditambah beberapa pertanyaan singkat di awal dan di akhir, dan selesai.",
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
                onClick={() => go()}
              >
                <Dices data-icon="inline-start" />
                {t("Start the study", "Mulai penelitian")}
              </Button>
              <p className="max-w-md text-sm text-muted-foreground">
                {t(
                  "We pick the kind of explanation you will see. You do not need to choose anything. Some people get a session with no explanation at all, and that is a normal part of the study.",
                  "Kami yang menentukan jenis penjelasan yang akan Anda lihat, jadi Anda tidak perlu memilih apa pun. Sebagian peserta mendapat sesi tanpa penjelasan sama sekali, dan itu memang bagian dari penelitian.",
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
                <span className="text-sm text-primary group-open:hidden">{t("Show the options", "Tampilkan pilihan")}</span>
              </span>
              <span className="mt-1 block max-w-2xl text-sm text-muted-foreground">
                {t(
                  "Optional. The button above is the normal way in. If you choose a style here, we record that it was your choice and keep those sessions separate.",
                  "Opsional. Biasanya cukup lewat tombol di atas. Jika Anda memilih gaya di sini, kami mencatatnya sebagai pilihan Anda dan memisahkan sesi itu dalam analisis.",
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
                    : t("How it is delivered", "Cara penyajiannya")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {group.key === "content"
                    ? t(
                        "Different material about the same recommendation, shown as a static panel.",
                        "Isi penjelasan yang berbeda untuk rekomendasi yang sama, ditampilkan sebagai panel biasa.",
                      )
                    : t(
                        "The same three contents, handed over in a different way. The last one drops the written explanation entirely.",
                        "Isi yang sama, disajikan dengan cara berbeda. Yang terakhir sama sekali tanpa penjelasan tertulis.",
                      )}
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.filter((c) => group.items.includes(c.id)).map((c) => {
              const gpuBlocked = c.needsGpu && !webGpu;
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
                        {t("needs a modern GPU browser", "perlu browser dengan GPU modern")}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{disp.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{disp.tagline}</p>
                  <Button
                    variant="outline"
                    className="mt-5 w-full rounded-full"
                    disabled={busy || gpuBlocked}
                    onClick={() => go(c.id)}
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
              "Apa pun pilihannya, di akhir sesi kami akan memberi tahu rekomendasi mana yang sengaja dibuat keliru.",
            )}{" "}
            <Link href="/about#researchers" className="font-medium text-primary underline underline-offset-4">
              {t("Researchers: how the study is designed", "Untuk peneliti: cara penelitian ini dirancang")}
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
