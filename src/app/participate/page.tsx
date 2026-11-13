"use client";

/* Taking part. One way in: the server places each participant in one of
   the five explanation conditions at consent (balanced assignment), so
   nobody chooses a style and every session is part of the experiment. The
   page says plainly what will happen, for people who have never taken part
   in an online study. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BookOpen, Clock3, Layers, Lock, MessageCircleQuestion, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PageTransition } from "@/components/page-transition";
import { tr, useLang } from "@/lib/i18n";
import { STUDY_CASES } from "@/lib/study";

export default function ParticipatePage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });

  /* The condition is decided on /study at consent, so the address a
     participant sees, and might pass on to a friend, never carries one. */
  const go = () => {
    setBusy(true);
    router.push("/study");
  };

  const FACTS = [
    { icon: Clock3, text: t("About 15 to 20 minutes", "Sekitar 15 sampai 20 menit") },
    { icon: Lock, text: t("Anonymous, no account", "Anonim, tanpa perlu akun") },
    { icon: Layers, text: t(`${STUDY_CASES} short stories`, `${STUDY_CASES} cerita singkat`) },
    { icon: Wallet, text: t("No real money involved", "Tanpa uang sungguhan") },
  ];

  const STEPS = [
    {
      icon: BookOpen,
      title: t("Read a short story", "Baca cerita singkat"),
      text: t(
        "Each story describes a made-up person: their age, savings, income and plans.",
        "Setiap cerita menggambarkan seseorang: usia, tabungan, pendapatan, dan rencananya.",
      ),
    },
    {
      icon: Sparkles,
      title: t("See the advisor's advice", "Lihat saran penasihat"),
      text: t(
        "An automated advisor suggests how this person could invest. Sometimes it also explains why.",
        "Penasihat otomatis menyarankan cara orang itu berinvestasi. Kadang penasihat juga menjelaskan alasannya.",
      ),
    },
    {
      icon: MessageCircleQuestion,
      title: t("Say what you would do", "Katakan apa yang akan Anda lakukan"),
      text: t(
        "Would you follow the advice, change it, reject it, or ask a person first? Answer as you really would.",
        "Apakah Anda akan mengikuti saran itu, mengubahnya, menolaknya, atau bertanya dulu ke seseorang? Jawablah sesuai yang benar-benar akan Anda lakukan.",
      ),
    },
  ];

  return (
    <>
      <SiteHeader />
      <PageTransition>
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/70">
          <div aria-hidden className="surface-glow drift" />
          <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <p className="rise text-xs font-semibold uppercase tracking-widest text-primary">
              {t("Take part", "Ikut serta")}
            </p>
            <h1 className="rise rise-1 mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {t("Help us find out when AI advice can be trusted", "Bantu kami mencari tahu kapan saran AI layak dipercaya")}
            </h1>
            <p className="rise rise-2 mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t(
                "You read short stories about made-up people, see what an automated advisor recommends for each, and tell us what you would do. A few quick questions before and after, and you are done.",
                "Anda membaca cerita singkat tentang orang rekaan, melihat saran dari penasihat otomatis untuk masing-masing, lalu memberi tahu kami apa yang akan Anda lakukan. Ditambah beberapa pertanyaan singkat di awal dan di akhir, dan selesai.",
              )}
            </p>
            <ul className="rise rise-3 mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {FACTS.map((f) => (
                <li key={f.text} className="flex items-center gap-2">
                  <f.icon className="size-4 text-primary" aria-hidden />
                  {f.text}
                </li>
              ))}
            </ul>
            <div className="rise rise-4 mt-9 flex flex-col items-center gap-3">
              <Button size="lg" className="h-12 rounded-full pl-8 pr-7 text-base" disabled={busy} onClick={go}>
                {t("Start the study", "Mulai penelitian")}
                <ArrowRight />
              </Button>
              <p className="max-w-md text-sm text-muted-foreground">
                {t(
                  "You will read what the study involves before anything starts, and you can stop at any time.",
                  "Anda akan membaca penjelasan tentang penelitian ini sebelum mulai, dan Anda bisa berhenti kapan saja.",
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <Reveal className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t("What happens", "Apa yang terjadi")}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t(`The same three steps, ${STUDY_CASES} times`, `Tiga langkah yang sama, ${STUDY_CASES} kali`)}
            </h2>
          </Reveal>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 90} className="panel p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">
                  {i + 1}. {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </Reveal>
            ))}
          </ol>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t(
              "Some people see explanations with the advice and some do not; that is part of the study. At the end we tell you what was tested.",
              "Sebagian peserta melihat penjelasan bersama sarannya dan sebagian tidak; itu memang bagian dari penelitian. Di akhir, kami memberi tahu apa yang diuji.",
            )}{" "}
            <Link href="/privacy" className="font-medium text-primary underline underline-offset-4">
              {t("What is recorded", "Data apa saja yang dicatat")}
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
      </PageTransition>
    </>
  );
}
