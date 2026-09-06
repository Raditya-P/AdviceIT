"use client";

/* The home page speaks to a participant first. Everything a researcher or
   reviewer needs lives one click away under /about, so that nobody arriving
   here has to read about Shapley values before they find out what they are
   being asked to do. */

import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, Eye, Lock, ShieldOff, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AdvicePreview } from "@/components/marketing/advice-preview";
import { tr, useLang } from "@/lib/i18n";

export default function HomePage() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });

  const FACTS = [
    { icon: Clock3, text: t("About 15 minutes", "Sekitar 15 menit") },
    { icon: Lock, text: t("Anonymous", "Anonim") },
    { icon: ShieldOff, text: t("No account needed", "Tanpa akun") },
    { icon: Wallet, text: t("No real money involved", "Tanpa uang sungguhan") },
  ];

  const STEPS = [
    {
      title: t("Read a short case", "Baca sebuah kasus singkat"),
      text: t(
        "A few sentences about a made-up person and their savings.",
        "Beberapa kalimat tentang seseorang rekaan dan tabungannya.",
      ),
    },
    {
      title: t("See what the AI advisor recommends", "Lihat apa yang direkomendasikan penasihat AI"),
      text: t(
        "With an explanation of why. Some recommendations are deliberately wrong.",
        "Disertai penjelasan mengapa. Sebagian rekomendasi sengaja dibuat keliru.",
      ),
    },
    {
      title: t("Say what you would do, and why", "Katakan apa yang akan Anda lakukan, dan mengapa"),
      text: t(
        "Follow it, adjust it, reject it, or ask a human. Six cases, then a debrief.",
        "Ikuti, sesuaikan, tolak, atau tanya manusia. Enam kasus, lalu debrief.",
      ),
    },
  ];

  const REASSURANCE = [
    {
      icon: Eye,
      title: t("You will be told which ones were wrong", "Anda akan diberi tahu mana yang keliru"),
      text: t(
        "At the end, the debrief names every recommendation that was deliberately flawed.",
        "Di akhir, debrief menyebutkan setiap rekomendasi yang sengaja dibuat keliru.",
      ),
    },
    {
      icon: Lock,
      title: t("Nothing about you is collected", "Tidak ada data tentang Anda yang dikumpulkan"),
      text: t(
        "No name, no email, no account. Only your answers about the made-up cases.",
        "Tanpa nama, tanpa email, tanpa akun. Hanya jawaban Anda tentang kasus rekaan.",
      ),
    },
    {
      icon: BookOpen,
      title: t("Everything is open", "Semuanya terbuka"),
      text: t(
        "The data the advisor learned from, how it was built, and how the study works are all published on this site.",
        "Data yang dipelajari penasihat, cara membangunnya, dan cara studi ini bekerja semuanya dipublikasikan di situs ini.",
      ),
    },
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="surface-glow" />
          <div aria-hidden className="surface-grid" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:py-28">
            <div className="space-y-7">
              <span className="rise inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur">
                <span className="inline-block size-1.5 rounded-full bg-primary" />
                {t("A research study, open to anyone", "Sebuah studi penelitian, terbuka untuk siapa saja")}
              </span>
              <h1 className="rise rise-1 text-balance text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
                {t("Know when to trust", "Tahu kapan harus memercayai")}{" "}
                <span className="text-gradient">{t("AI investment advice", "saran investasi AI")}</span>
              </h1>
              <p className="rise rise-2 max-w-xl text-lg leading-relaxed text-foreground">
                {t(
                  "This is a research simulation, not a financial service. The advisor here is real, the cases are made up, and nothing on this site is advice for your own money.",
                  "Ini simulasi penelitian, bukan layanan keuangan. Penasihatnya sungguhan, kasusnya rekaan, dan tidak ada apa pun di situs ini yang merupakan saran untuk uang Anda sendiri.",
                )}
              </p>
              <p className="rise rise-2 max-w-xl leading-relaxed text-muted-foreground">
                {t(
                  "We are studying which kinds of explanation help people follow good advice and catch bad advice. You can help by spending a few minutes judging what the advisor says.",
                  "Kami meneliti jenis penjelasan mana yang membantu orang mengikuti saran yang baik dan menangkap saran yang buruk. Anda bisa membantu dengan meluangkan beberapa menit menilai apa yang dikatakan penasihat.",
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
              <div className="rise rise-4 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
                  <Link href="/participate">
                    {t("Take part in the study", "Ikut serta dalam studi")} <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
                  <Link href="/advisor/ml">{t("Just try the advisor", "Coba dulu penasihatnya")}</Link>
                </Button>
              </div>
              <p className="rise rise-4 text-sm text-muted-foreground">
                {t("Researcher or reviewer?", "Peneliti atau reviewer?")}{" "}
                <Link href="/about#researchers" className="font-medium text-primary underline underline-offset-4">
                  {t("Start here instead", "Mulai dari sini")}
                </Link>
              </p>
            </div>
            <AdvicePreview />
          </div>
        </section>

        {/* What happens */}
        <section className="border-y border-border/70 bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("What happens", "Apa yang terjadi")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("Three steps, repeated six times", "Tiga langkah, diulang enam kali")}
              </h2>
            </div>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="panel lift p-6">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Why it matters, kept short */}
        <section>
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t("Why this matters", "Mengapa ini penting")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              {t("Trusting AI the right amount is a skill", "Memercayai AI secukupnya adalah sebuah keterampilan")}
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              {t(
                "Apps already give people investment advice generated by AI. Some people follow that advice even when it is wrong. Others ignore it even when it is right. Explanations are supposed to help, but nobody knows yet which kind actually does.",
                "Berbagai aplikasi sudah memberi orang saran investasi yang dihasilkan AI. Sebagian orang mengikutinya bahkan ketika keliru. Sebagian lain mengabaikannya bahkan ketika benar. Penjelasan seharusnya membantu, tetapi belum ada yang tahu jenis mana yang benar-benar membantu.",
              )}
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {t(
                "That is what your answers tell us. The advisor was built from cases reviewed by a panel of financial experts, and the study is run by a small research team, not a company.",
                "Itulah yang diberitahukan jawaban Anda kepada kami. Penasihatnya dibangun dari kasus yang ditinjau panel ahli keuangan, dan studi ini dijalankan tim peneliti kecil, bukan perusahaan.",
              )}
            </p>
          </div>
        </section>

        {/* Reassurance */}
        <section className="border-y border-border/70 bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="grid gap-5 md:grid-cols-3">
              {REASSURANCE.map((f) => (
                <article key={f.title} className="panel p-6">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-20 sm:px-6">
          <div className="cta-panel relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-border/70 px-6 py-16 text-center">
            <div aria-hidden className="surface-grid opacity-60" />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("Fifteen minutes of your judgement", "Lima belas menit penilaian Anda")}
              </h2>
              <p className="text-muted-foreground">
                {t(
                  "Six short cases, one kind of explanation, and a debrief that shows you which recommendations were wrong.",
                  "Enam kasus singkat, satu jenis penjelasan, dan debrief yang menunjukkan rekomendasi mana yang keliru.",
                )}
              </p>
              <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
                <Link href="/participate">
                  {t("Take part in the study", "Ikut serta dalam studi")} <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
