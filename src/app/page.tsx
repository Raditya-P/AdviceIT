"use client";

/* The home page is about the two advisors. Every visual below is computed
   from the real models at render time, not drawn: the contribution bars,
   the scorecard rows and the allocation bands are the advisors' own
   numbers. The study comes last, once a visitor knows what is being judged. */

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  BarChart3,
  Clock3,
  Cpu,
  Gauge,
  Lock,
  MessageSquareText,
  Shuffle,
  UserRound,
  Wallet,
} from "lucide-react";
import { ASSET_COLOR, AllocationBar } from "@/components/allocation-bar";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AdvicePreview } from "@/components/marketing/advice-preview";
import { mlRecommend, scorecard } from "@/lib/advisor/advisors";
import { featureExplanation } from "@/lib/advisor/explanations";
import { ASSET_CLASSES, PORTFOLIOS } from "@/lib/advisor/model";
import { assetLabel, labelValue, outcomeName, outcomeSummary } from "@/lib/advisor/strings";
import { tr, useLang } from "@/lib/i18n";

const EXAMPLE = {
  age: 38,
  horizon: 18,
  tolerance: "medium" as const,
  emergencyFund: true,
  incomeStable: true,
  debtObligations: false,
  nearTermNeed: false,
  knowledge: "intermediate",
};

export default function HomePage() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });

  /* Real numbers for the two advisor cards. */
  const { bars, rows, columns } = useMemo(() => {
    const fx = featureExplanation(mlRecommend(EXAMPLE));
    const bars = fx.items.filter((i) => i.points !== 0).slice(0, 4);
    const sc = scorecard();
    const group = sc.groups.find((g) => /capacity/i.test(g.label)) ?? sc.groups[0];
    const wanted = ["Conservative", "Balanced", "Growth"];
    const columns = wanted.map((w) => ({ name: w, index: sc.outcomes.indexOf(w) })).filter((c) => c.index >= 0);
    return { bars, rows: group.rows, columns };
  }, []);
  const maxAbs = Math.max(...bars.map((b) => Math.abs(b.points)), 1);

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

  const STYLES = [
    {
      icon: BarChart3,
      title: t("Why", "Mengapa"),
      text: t("Which of your answers pushed the advice, and by how much.", "Jawaban Anda yang mana yang mendorong saran, dan seberapa besar."),
    },
    {
      icon: Shuffle,
      title: t("What would change it", "Apa yang mengubahnya"),
      text: t("The smallest change to the situation that flips the advice.", "Perubahan terkecil pada situasi yang membalik sarannya."),
    },
    {
      icon: Gauge,
      title: t("How sure", "Seberapa yakin"),
      text: t("The advisor's confidence, with every other outcome shown beside it.", "Keyakinan penasihat, dengan setiap hasil lain ditampilkan di sampingnya."),
    },
    {
      icon: MessageSquareText,
      title: t("Ask it", "Tanyakan"),
      text: t("A conversation about the recommendation, grounded in the same numbers.", "Percakapan tentang rekomendasi, berpijak pada angka yang sama."),
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
          </div>
        </section>

        {/* Two advisors */}
        <section>
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("Two advisors", "Dua penasihat")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("Same data, two ways of thinking", "Data yang sama, dua cara berpikir")}
              </h2>
              <p className="text-muted-foreground">
                {t(
                  "Both learned from the same 400 cases reviewed by a panel of financial experts. One reasons like a network, the other like a checklist.",
                  "Keduanya belajar dari 400 kasus yang sama yang ditinjau panel ahli keuangan. Yang satu bernalar seperti jaringan, yang lain seperti daftar periksa.",
                )}
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {/* AI advisor */}
              <article className="panel lift flex flex-col p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t("Neural network", "Neural network")}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">{t("The AI advisor", "Penasihat AI")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(
                    "Learns the pattern in the cases and explains each recommendation afterwards, by working out how much every answer counted.",
                    "Mempelajari pola dalam kasus dan menjelaskan tiap rekomendasi setelahnya, dengan menghitung seberapa besar setiap jawaban berpengaruh.",
                  )}
                </p>
                <div className="mt-5 flex-1 space-y-2.5 rounded-2xl border border-border/80 bg-background/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("What counted, for one example investor", "Apa yang berpengaruh, untuk satu investor contoh")}
                  </p>
                  {bars.map((b) => (
                    <div key={b.key} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)] items-center gap-3 text-sm">
                      <span className="truncate">
                        {b.label} <span className="text-muted-foreground">{b.valueText}</span>
                      </span>
                      <span aria-hidden className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                        <span className="absolute inset-y-0 left-1/2 w-px bg-border" />
                        <span
                          className={`absolute inset-y-0.5 rounded-full ${b.points > 0 ? "left-1/2 bg-primary" : "right-1/2 bg-cash"}`}
                          style={{ width: `${(Math.abs(b.points) / maxAbs) * 50}%` }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
                <Button asChild className="mt-5 self-start rounded-full">
                  <Link href="/advisor/ml">
                    {t("Try the AI advisor", "Coba penasihat AI")}
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </article>

              {/* Interpretable advisor */}
              <article className="panel lift flex flex-col p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-widest text-bonds">{t("Scorecard", "Scorecard")}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">{t("The interpretable advisor", "Penasihat interpretable")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(
                    "A points table you can read in full. Every answer adds or removes points for each outcome, and the highest total wins. No step is hidden.",
                    "Tabel poin yang bisa Anda baca seluruhnya. Setiap jawaban menambah atau mengurangi poin untuk tiap hasil, dan total tertinggi menang. Tidak ada langkah yang disembunyikan.",
                  )}
                </p>
                <div className="mt-5 flex-1 rounded-2xl border border-border/80 bg-background/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("Three rows of the real table: risk capacity", "Tiga baris dari tabel sungguhan: kapasitas risiko")}
                  </p>
                  <table className="mt-2.5 w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground">
                        <th className="pb-1.5 text-left font-medium" />
                        {columns.map((c) => (
                          <th key={c.name} className="pb-1.5 text-right font-medium">{outcomeName(c.name)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.label} className="border-t border-border/60">
                          <td className="py-1.5 pr-2">{labelValue(r.label)}</td>
                          {columns.map((c) => {
                            const v = r.points[c.index];
                            return (
                              <td key={c.name} className={`py-1.5 text-right tabular-nums ${v > 0 ? "text-primary" : v < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                {v > 0 ? `+${v}` : v}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button asChild variant="outline" className="mt-5 self-start rounded-full">
                  <Link href="/advisor/logit">
                    {t("Try the interpretable advisor", "Coba penasihat interpretable")}
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </article>
            </div>
          </div>
        </section>

        {/* How it explains itself */}
        <section className="border-y border-border/70 bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("Explanations", "Penjelasan")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("Four ways to ask why", "Empat cara bertanya mengapa")}
              </h2>
              <p className="text-muted-foreground">
                {t("Pick any of them on the advisor page. Each is computed from the advisor's own numbers.", "Pilih salah satunya di halaman penasihat. Masing-masing dihitung dari angka penasihat sendiri.")}
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STYLES.map((s) => (
                <article key={s.title} className="panel lift p-6">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* What it can recommend */}
        <section>
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("Outcomes", "Hasil")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("Five mixes, and the option to say no", "Lima campuran, dan pilihan untuk berkata tidak")}
              </h2>
              <p className="text-muted-foreground">
                {t(
                  "Each bar shows how a mix splits the money across four kinds of asset.",
                  "Setiap batang menunjukkan bagaimana sebuah campuran membagi uang ke empat jenis aset.",
                )}
              </p>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {ASSET_CLASSES.map((ac) => (
                <li key={ac.key} className="flex items-center gap-2">
                  <span aria-hidden className="inline-block size-3 rounded-full" style={{ background: ASSET_COLOR[ac.key] }} />
                  <span className="font-medium">{assetLabel(ac.label)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-3">
              {PORTFOLIOS.map((pf) => (
                <div key={pf.id} className="panel grid items-center gap-3 p-4 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6 sm:p-5">
                  <div>
                    <p className="font-semibold tracking-tight">{outcomeName(pf.name)}</p>
                    <p className="text-xs text-muted-foreground">{outcomeSummary(pf.id, pf.summary)}</p>
                  </div>
                  {pf.allocation && <AllocationBar allocation={pf.allocation} height="h-8" animate={false} />}
                </div>
              ))}
              <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border px-4 py-4 sm:px-5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold tracking-tight">{outcomeName("Human review")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "When the case is not one a model should decide, the advisor says so and refers it to a person. The experts did the same with almost half the cases.",
                      "Ketika kasusnya bukan sesuatu yang seharusnya diputuskan model, penasihat mengatakannya dan merujuk ke seseorang. Para ahli pun berbuat sama pada hampir separuh kasus.",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why this matters */}
        <section className="border-y border-border/70 bg-muted/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("Why this matters", "Mengapa ini penting")}
              </p>
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("An explanation can help you judge advice, or just make it sound convincing", "Sebuah penjelasan bisa membantu Anda menilai saran, atau sekadar membuatnya terdengar meyakinkan")}
              </h2>
              <p className="text-muted-foreground">
                {t(
                  "Nobody yet knows which kinds do which. That is the question this advisor was built to answer.",
                  "Belum ada yang tahu jenis mana yang berbuat apa. Itulah pertanyaan yang menjadi alasan penasihat ini dibangun.",
                )}
              </p>
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
            </div>
          </div>
        </section>

        {/* The study */}
        <section className="px-4 pb-24 sm:px-6">
          <div className="cta-panel relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-border/70 px-6 py-14 sm:px-10">
            <div aria-hidden className="surface-grid opacity-60" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {t("The study", "Studinya")}
                </p>
                <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                  {t("Judge the advisor on six short cases", "Nilai penasihatnya pada enam kasus singkat")}
                </h2>
                <p className="max-w-xl leading-relaxed text-muted-foreground">
                  {t(
                    "Read a case, see the recommendation with one kind of explanation, say what you would do. Some recommendations are deliberately wrong, and the debrief tells you which. About fifteen minutes, anonymous, no account.",
                    "Baca sebuah kasus, lihat rekomendasinya dengan satu jenis penjelasan, katakan apa yang akan Anda lakukan. Sebagian rekomendasi sengaja dibuat keliru, dan debrief memberi tahu yang mana. Sekitar lima belas menit, anonim, tanpa akun.",
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
                <Button asChild size="lg" className="h-12 rounded-full pl-7 pr-6 text-base">
                  <Link href="/participate">
                    {t("Take part in the study", "Ikut serta dalam studi")}
                    <ArrowRight />
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
