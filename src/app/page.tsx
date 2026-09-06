"use client";

/* The home page introduces the advisor first. A visitor should understand
   what the thing is by trying it, and only then be asked to help with the
   study. Everything a researcher or reviewer needs lives under /about. */

import Link from "next/link";
import { ArrowRight, Clock3, Cpu, Lock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AdvicePreview } from "@/components/marketing/advice-preview";
import { tr, useLang } from "@/lib/i18n";

export default function HomePage() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });

  const FACTS = [
    { icon: Cpu, text: t("Runs entirely in your browser", "Berjalan sepenuhnya di browser Anda") },
    { icon: Lock, text: t("Nothing about you is stored", "Tidak ada data tentang Anda yang disimpan") },
    { icon: Wallet, text: t("No real money involved", "Tanpa uang sungguhan") },
    { icon: Clock3, text: t("About two minutes to try", "Sekitar dua menit untuk mencoba") },
  ];

  const STEPS = [
    {
      title: t("Describe an investor", "Gambarkan seorang investor"),
      text: t(
        "Age, how long the money can stay invested, how much risk they can live with, and a few facts about their finances. Made up is fine.",
        "Usia, berapa lama uangnya bisa tetap diinvestasikan, seberapa besar risiko yang sanggup dijalani, dan beberapa fakta tentang keuangannya. Rekaan pun tidak apa-apa.",
      ),
    },
    {
      title: t("Get a recommendation", "Dapatkan rekomendasi"),
      text: t(
        "One of five investment mixes, from capital preservation to aggressive growth. Or, when the case calls for it, a referral to a human adviser.",
        "Satu dari lima campuran investasi, dari pelestarian modal sampai pertumbuhan agresif. Atau, bila kasusnya menuntut, rujukan ke penasihat manusia.",
      ),
    },
    {
      title: t("See why, in the style you choose", "Lihat mengapa, dengan gaya pilihan Anda"),
      text: t(
        "Which of your answers mattered, what would change the advice, how sure the advisor is, or a conversation about it. Then decide whether you would trust it.",
        "Jawaban Anda yang mana yang berpengaruh, apa yang akan mengubah sarannya, seberapa yakin penasihatnya, atau percakapan tentangnya. Lalu putuskan apakah Anda akan memercayainya.",
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
          <div className="relative mx-auto grid max-w-6xl items-start gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14 lg:pb-20 lg:pt-16">
            <div className="space-y-5">
              <span className="rise inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur">
                <span className="inline-block size-1.5 rounded-full bg-primary" />
                {t("A research simulation, not a financial service", "Simulasi penelitian, bukan layanan keuangan")}
              </span>
              <h1 className="rise rise-1 text-balance text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
                {t("Know when to trust", "Tahu kapan harus memercayai")}{" "}
                <span className="text-gradient">{t("AI investment advice", "saran investasi AI")}</span>
              </h1>
              <p className="rise rise-2 max-w-xl text-lg leading-relaxed text-foreground">
                {t(
                  "Meet an AI investment advisor that explains itself. Describe an investor, get a recommended mix, and see exactly why it was chosen.",
                  "Kenali penasihat investasi AI yang menjelaskan dirinya sendiri. Gambarkan seorang investor, dapatkan campuran yang direkomendasikan, dan lihat persis mengapa itu dipilih.",
                )}
              </p>
              <p className="rise rise-2 max-w-xl leading-relaxed text-muted-foreground">
                {t(
                  "The advisor is real. It learned from cases reviewed by a panel of financial experts. The investors are made up, and nothing here is advice for your own money.",
                  "Penasihatnya sungguhan. Ia belajar dari kasus yang ditinjau panel ahli keuangan. Investornya rekaan, dan tidak ada apa pun di sini yang merupakan saran untuk uang Anda sendiri.",
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
                <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
                  <Link href="/advisor/ml">
                    {t("Try the advisor", "Coba penasihatnya")} <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
                  <Link href="/participate">{t("Take part in the study", "Ikut serta dalam studi")}</Link>
                </Button>
              </div>
              <p className="rise rise-4 text-sm text-muted-foreground">
                {t("Researcher or reviewer?", "Peneliti atau reviewer?")}{" "}
                <Link href="/about#researchers" className="font-medium text-primary underline underline-offset-4">
                  {t("Start here instead", "Mulai dari sini")}
                </Link>
              </p>
            </div>
            <div className="lg:pt-4">
              <AdvicePreview />
            </div>
          </div>
        </section>

        {/* What the advisor does */}
        <section className="border-y border-border/70 bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("What the advisor does", "Apa yang dilakukan penasihat")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("Three steps from a person to a recommendation", "Tiga langkah dari seseorang ke sebuah rekomendasi")}
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
            <div className="mt-8">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/advisor/logit">
                  {t("There is also a fully transparent advisor to compare", "Ada juga penasihat yang sepenuhnya transparan untuk dibandingkan")}{" "}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Why it matters */}
        <section>
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("Why this matters", "Mengapa ini penting")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("Good advice is only useful if people can tell it from bad advice", "Saran yang baik hanya berguna jika orang bisa membedakannya dari saran yang buruk")}
              </h2>
            </div>
            <div className="space-y-5 leading-relaxed text-muted-foreground lg:pt-9">
              <p>
                {t(
                  "Investment apps increasingly recommend what to do with your money, and the recommendation comes from a model. When it is right, following it helps. When it is wrong, following it costs real money. Most people cannot tell which is which from the recommendation alone.",
                  "Aplikasi investasi makin sering merekomendasikan apa yang harus dilakukan dengan uang Anda, dan rekomendasi itu berasal dari sebuah model. Saat benar, mengikutinya membantu. Saat keliru, mengikutinya merugikan uang sungguhan. Kebanyakan orang tidak bisa membedakan keduanya dari rekomendasi saja.",
                )}
              </p>
              <p>
                {t(
                  "Explanations are meant to close that gap. Yet an explanation can also make wrong advice sound convincing. Which kinds of explanation help people judge, rather than simply persuade, is still an open question.",
                  "Penjelasan dimaksudkan untuk menutup celah itu. Namun penjelasan juga bisa membuat saran yang keliru terdengar meyakinkan. Jenis penjelasan mana yang membantu orang menilai, bukan sekadar membujuk, masih menjadi pertanyaan terbuka.",
                )}
              </p>
              <p>
                {t(
                  "This advisor exists to study that question the only way it can be studied: by watching how people decide. It was trained on cases reviewed by a panel of financial experts, and it is run by a small university research team.",
                  "Penasihat ini ada untuk meneliti pertanyaan itu dengan satu-satunya cara yang mungkin: dengan mengamati bagaimana orang memutuskan. Ia dilatih pada kasus yang ditinjau panel ahli keuangan, dan dijalankan tim peneliti kecil dari universitas.",
                )}
              </p>
            </div>
          </div>
        </section>

        {/* The study, once the advisor is understood */}
        <section className="px-4 pb-24 pt-4 sm:px-6">
          <div className="cta-panel relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-border/70 px-6 py-14 sm:px-10">
            <div aria-hidden className="surface-grid opacity-60" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {t("Then help the research", "Lalu bantu penelitiannya")}
                </p>
                <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                  {t("Judge the advisor on six short cases", "Nilai penasihatnya pada enam kasus singkat")}
                </h2>
                <p className="max-w-xl leading-relaxed text-muted-foreground">
                  {t(
                    "You read a case, see the advisor's recommendation with one kind of explanation, and say what you would do. Some recommendations are deliberately wrong, and the debrief at the end tells you which. About fifteen minutes, anonymous, no account.",
                    "Anda membaca sebuah kasus, melihat rekomendasi penasihat dengan satu jenis penjelasan, dan mengatakan apa yang akan Anda lakukan. Sebagian rekomendasi sengaja dibuat keliru, dan debrief di akhir memberi tahu yang mana. Sekitar lima belas menit, anonim, tanpa akun.",
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
                <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
                  <Link href="/participate">
                    {t("Take part in the study", "Ikut serta dalam studi")} <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
                  <Link href="/privacy">{t("What is recorded", "Apa yang direkam")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
