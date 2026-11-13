"use client";

/* The home page, written for people who are new to investing: what the
   advisor does, how it explains itself, what it can recommend, and the
   study. Every visual is computed from the real advisor at render time,
   not drawn. Technical detail (the second, fully transparent advisor, the
   training results) is one link away, for those who want it. */

import Link from "next/link";
import { ArrowRight, BarChart3, Clock3, Cpu, Gauge, Lock, ShieldCheck, Shuffle, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PageTransition } from "@/components/page-transition";
import { AdvicePreview } from "@/components/marketing/advice-preview";
import { OutcomeShowcase } from "@/components/marketing/outcome-showcase";
import { Reveal, Spotlight } from "@/components/motion";
import { tr, useLang } from "@/lib/i18n";
import { FRAME } from "@/lib/layout";

export default function HomePage() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });

  const FACTS = [
    { icon: Cpu, text: t("Runs entirely in your browser", "Berjalan sepenuhnya di browser Anda") },
    { icon: Lock, text: t("Nothing about you is stored", "Tidak menyimpan data pribadi Anda") },
    { icon: Wallet, text: t("No real money involved", "Tanpa uang sungguhan") },
    { icon: Clock3, text: t("About two minutes to try", "Cukup sekitar dua menit") },
  ];

  const STEPS = [
    {
      title: t("Tell it about a person", "Ceritakan tentang seseorang"),
      text: t(
        "Their age, when they need the money, how they feel about risk, and a few facts about their savings and income. A made-up person is fine.",
        "Usianya, kapan uangnya dibutuhkan, bagaimana sikapnya terhadap risiko, dan sedikit gambaran tabungan serta pendapatannya. Orang rekaan juga boleh.",
      ),
    },
    {
      title: t("Get advice", "Dapatkan saran"),
      text: t(
        "One of five ways to split the money, from very safe to very adventurous. When a situation is too delicate for a computer, it says to see a human adviser instead.",
        "Salah satu dari lima cara membagi uang, dari yang sangat aman sampai yang sangat berani. Jika situasinya terlalu rumit untuk komputer, penasihat menyarankan Anda menemui penasihat manusia.",
      ),
    },
    {
      title: t("See why", "Lihat alasannya"),
      text: t(
        "Choose how it explains its advice, then decide whether you would trust it.",
        "Pilih cara penasihat menjelaskan sarannya, lalu putuskan apakah Anda memercayainya.",
      ),
    },
  ];

  const STYLES = [
    {
      icon: BarChart3,
      title: t("Why", "Mengapa"),
      text: t("Which facts about the person mattered most, and how much.", "Fakta mana tentang orang itu yang paling berpengaruh, dan seberapa besar."),
    },
    {
      icon: Shuffle,
      title: t("What would change it", "Apa yang bisa mengubahnya"),
      text: t("What would have to be different for the advice to change.", "Apa yang harus berbeda agar sarannya berubah."),
    },
    {
      icon: Gauge,
      title: t("How sure", "Seberapa yakin"),
      text: t("How sure the advisor is, next to the other options it considered.", "Seberapa yakin penasihat, di samping pilihan lain yang ia pertimbangkan."),
    },
  ];

  return (
    <>
      <SiteHeader />
      <PageTransition>
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="surface-glow drift" />
          <div aria-hidden className="surface-grid" />
          <Spotlight />
          <div className={`${FRAME} relative grid items-start gap-10 pb-16 pt-10 sm:pt-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14 lg:pb-20 lg:pt-16 xl:gap-20`}>
            <div className="@container space-y-5">
              <span className="rise inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur">
                <span className="inline-block size-1.5 rounded-full bg-primary" />
                {t("A research simulation. Not a financial service", "Simulasi penelitian. Bukan layanan keuangan")}
              </span>
              <h1 className="rise rise-1 text-balance text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-[length:min(3.75rem,10.4cqi)]">
                {t("Know when to trust", "Tahu kapan bisa memercayai")}{" "}
                <span className="text-gradient">{t("AI investment advice", "saran investasi AI")}</span>
              </h1>
              <p className="rise rise-2 max-w-xl text-lg leading-relaxed text-foreground">
                {t(
                  "Meet an AI investment advisor that explains itself. Describe an investor and get a recommended mix with the reasoning behind it.",
                  "Coba penasihat investasi AI yang menjelaskan sarannya. Isi profil seorang investor, lalu lihat komposisi portofolio yang disarankan beserta alasannya.",
                )}
              </p>
              <ul className="rise rise-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {FACTS.map((f) => (
                  <li key={f.text} className="flex items-center gap-2">
                    <f.icon className="size-4 text-primary" aria-hidden />
                    {f.text}
                  </li>
                ))}
              </ul>
              <div className="rise rise-4 flex flex-col gap-3 pt-1 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-full pl-7 pr-6 text-base">
                  <Link href="/advisor/ml">
                    {t("Try the advisor", "Coba penasihatnya")}
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
                  <Link href="/participate">{t("Take part in the study", "Ikut penelitian")}</Link>
                </Button>
              </div>
              <p className="rise rise-4 text-sm text-muted-foreground">
                {t("Researcher or reviewer?", "Anda peneliti atau penelaah?")}{" "}
                <Link href="/about#researchers" className="font-medium text-primary underline underline-offset-4">
                  {t("Start here instead", "Mulai dari sini")}
                </Link>
              </p>
            </div>
            <div className="min-w-0 lg:pt-4">
              <AdvicePreview />
            </div>
          </div>
        </section>

        {/* What the advisor does */}
        <section className="border-y border-border/70 bg-muted/40">
          <div className={`${FRAME} py-20`}>
            <Reveal className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("What the advisor does", "Cara kerja penasihat")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("Three steps from a person to a recommendation", "Tiga langkah dari profil sampai rekomendasi")}
              </h2>
            </Reveal>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal as="li" key={s.title} delay={i * 90} className="panel lift p-6">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* How it explains itself */}
        <section className="border-y border-border/70 bg-muted/40">
          <div className={`${FRAME} py-20`}>
            <Reveal className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("Explanations", "Penjelasan")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("Three ways it explains itself", "Tiga cara penasihat menjelaskan dirinya")}
              </h2>
              <p className="text-muted-foreground">
                {t("Every explanation comes from the advisor's own working, not from a script.", "Setiap penjelasan berasal dari perhitungan penasihat itu sendiri, bukan dari naskah yang sudah disiapkan.")}
              </p>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {STYLES.map((s, i) => (
                <Reveal as="article" key={s.title} delay={i * 80} className="panel lift p-6">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* What it can recommend */}
        <section>
          <div className={`${FRAME} py-20`}>
            <Reveal className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("Outcomes", "Pilihan hasil")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("Five mixes and the option to say no", "Lima komposisi portofolio, dan satu cara untuk berkata tidak")}
              </h2>
              <p className="text-muted-foreground">
                {t(
                  "Each bar shows how a mix splits the money across four kinds of asset.",
                  "Setiap batang menunjukkan cara satu komposisi membagi uang ke empat jenis aset.",
                )}
              </p>
            </Reveal>
            <Reveal className="mt-8">
              <OutcomeShowcase />
            </Reveal>
          </div>
        </section>

        {/* Where it comes from */}
        <section className="border-t border-border/70">
          <div className={`${FRAME} grid gap-6 py-16 md:grid-cols-3`}>
            {[
              {
                icon: Users,
                title: t("Built from expert judgement", "Dibangun dari penilaian ahli"),
                text: t(
                  "The advisor learned from 400 investor cases that four financial experts reviewed and agreed on.",
                  "Penasihat ini belajar dari 400 kasus investor yang sudah ditinjau dan disepakati oleh empat ahli keuangan.",
                ),
              },
              {
                icon: Cpu,
                title: t("Runs on your device", "Berjalan di perangkat Anda"),
                text: t(
                  "The advice is worked out in your browser. What you type on the advisor page is not sent anywhere.",
                  "Saran dihitung di browser Anda. Apa yang Anda ketik di halaman penasihat tidak dikirim ke mana pun.",
                ),
              },
              {
                icon: ShieldCheck,
                title: t("A research tool, not a service", "Alat penelitian, bukan layanan"),
                text: t(
                  "Nothing here is real financial advice. It exists to study how people judge advice from an AI.",
                  "Tidak ada saran keuangan sungguhan di sini. Situs ini dibuat untuk meneliti cara orang menilai saran dari AI.",
                ),
              },
            ].map((b, i) => (
              <Reveal key={b.title} delay={i * 80} className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <b.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold tracking-tight">{b.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
                </div>
              </Reveal>
            ))}
            <p className="text-sm text-muted-foreground md:col-span-3">
              {t("Curious how it was built?", "Ingin tahu cara pembuatannya?")}{" "}
              <Link href="/training-data" className="font-medium text-primary underline underline-offset-4">
                {t("The data and the results", "Data dan hasilnya")}
              </Link>
              {" · "}
              <Link href="/advisor/logit" className="font-medium text-primary underline underline-offset-4">
                {t("A second advisor whose every rule you can read", "Penasihat kedua yang semua aturannya bisa Anda baca")}
              </Link>
            </p>
          </div>
        </section>

        {/* Why this matters */}
        <section className="border-y border-border/70 bg-muted/40">
          <div className={`${FRAME} grid gap-10 py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20`}>
            <Reveal className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("Why this matters", "Mengapa ini penting")}
              </p>
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("An explanation can help you judge advice or just make it sound convincing", "Penjelasan bisa membantu Anda menilai saran, atau sekadar membuatnya terdengar meyakinkan")}
              </h2>
              <p className="text-muted-foreground">
                {t(
                  "Nobody yet knows which kinds do which. That is the question this advisor was built to answer.",
                  "Belum ada yang tahu penjelasan mana yang berdampak seperti apa. Penasihat ini dibuat untuk menjawab pertanyaan itu.",
                )}
              </p>
            </Reveal>
            <Reveal delay={140} className="space-y-5 leading-relaxed text-muted-foreground lg:pt-9">
              <p>
                {t(
                  "Investment apps increasingly recommend what to do with your money and the recommendation comes from a model. Following it helps when the model is right. Following it costs real money when the model is wrong. Most people cannot tell which is which from the recommendation alone.",
                  "Aplikasi investasi makin sering menyarankan apa yang sebaiknya Anda lakukan dengan uang Anda, dan saran itu dibuat oleh sebuah model. Kalau modelnya benar, mengikutinya menguntungkan. Kalau modelnya keliru, mengikutinya bisa membuat Anda rugi sungguhan. Dari rekomendasinya saja, kebanyakan orang tidak bisa membedakan keduanya.",
                )}
              </p>
              <p>
                {t(
                  "Explanations are meant to close that gap. Yet an explanation can also make wrong advice sound convincing. Which kinds of explanation help people judge rather than simply persuade is still an open question.",
                  "Penjelasan seharusnya membantu menutup celah itu. Namun penjelasan juga bisa membuat saran yang keliru terdengar meyakinkan. Penjelasan mana yang membantu orang menilai, bukan sekadar membujuk, masih belum diketahui.",
                )}
              </p>
            </Reveal>
          </div>
        </section>

        {/* The study */}
        <section className={`${FRAME} pb-24`}>
          <Reveal className="cta-panel relative overflow-hidden rounded-[2rem] border border-border/70 px-6 py-14 sm:px-10">
            <div aria-hidden className="surface-grid opacity-60" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {t("The study", "Penelitian")}
                </p>
                <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                  {t("Judge the advisor on eight short cases", "Nilai penasihatnya lewat delapan kasus singkat")}
                </h2>
                <p className="max-w-xl leading-relaxed text-muted-foreground">
                  {t(
                    "Read a case. See the recommendation with one kind of explanation. Say what you would do. Some recommendations are deliberately wrong and the debrief tells you which. The study is anonymous and takes about 15 to 20 minutes with no account needed.",
                    "Baca sebuah kasus, lihat rekomendasinya dengan satu jenis penjelasan, lalu katakan apa yang akan Anda lakukan. Sebagian rekomendasi sengaja dibuat keliru, dan di akhir kami beri tahu yang mana. Penelitian ini anonim, butuh sekitar 15 sampai 20 menit, dan tidak perlu membuat akun.",
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
                <Button asChild size="lg" className="h-12 rounded-full pl-7 pr-6 text-base">
                  <Link href="/participate">
                    {t("Take part in the study", "Ikut penelitian")}
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
                  <Link href="/privacy">{t("What is recorded", "Data apa saja yang dicatat")}</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
      </PageTransition>
    </>
  );
}
