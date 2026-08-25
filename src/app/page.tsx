"use client";

import Link from "next/link";
import {
  ArrowRight,
  Brain,
  FileSearch,
  MessageSquareText,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AdvicePreview } from "@/components/marketing/advice-preview";
import { logitMeta, mlMeta } from "@/lib/advisor/advisors";
import { tr, useLang } from "@/lib/i18n";

export default function HomePage() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });

  const STEPS = [
    {
      title: t("Pick or be assigned an explanation style", "Pilih atau ditetapkan satu gaya penjelasan"),
      text: t(
        "Random assignment keeps the research clean. Choosing one yourself is allowed, and recorded as your choice.",
        "Penetapan acak menjaga penelitian tetap bersih. Memilih sendiri diperbolehkan, dan dicatat sebagai pilihan Anda.",
      ),
    },
    {
      title: t("Read six short investor cases", "Baca enam kasus investor singkat"),
      text: t(
        "Each case comes with the advisor's recommendation and the explanation style you were given.",
        "Tiap kasus disertai rekomendasi penasihat dan gaya penjelasan yang Anda terima.",
      ),
    },
    {
      title: t("Decide what you would do", "Putuskan apa yang akan Anda lakukan"),
      text: t(
        "Follow it, adjust it, reject it or send it to a human adviser. Those decisions are the data.",
        "Ikuti, sesuaikan, tolak, atau serahkan ke penasihat manusia. Keputusan itulah datanya.",
      ),
    },
  ];

  const FEATURES = [
    {
      icon: Brain,
      title: t("Two advisors, same expert data", "Dua penasihat, data ahli yang sama"),
      text: t(
        "A neural network and an interpretable scorecard, both trained on the ILS-Bench expert consensus. One opaque, one transparent, so explanation faithfulness becomes a variable.",
        "Sebuah neural network dan sebuah scorecard interpretable, keduanya dilatih pada konsensus ahli ILS-Bench. Satu opak, satu transparan, sehingga kesetiaan penjelasan menjadi variabel.",
      ),
    },
    {
      icon: ShieldCheck,
      title: t("An advisor that knows its limits", "Penasihat yang tahu batasnya"),
      text: t(
        "The experts refused to automate almost half of the cases. Both advisors learned that, and can answer Human review instead of a portfolio.",
        "Para ahli menolak mengotomatiskan hampir separuh kasus. Kedua penasihat mempelajarinya, dan dapat menjawab Tinjauan manusia alih-alih sebuah portofolio.",
      ),
    },
    {
      icon: SlidersHorizontal,
      title: t("Explanations you can steer", "Penjelasan yang bisa Anda kendalikan"),
      text: t(
        "Move the inputs, switch inputs off, ask why not another outcome. Every preview is a real re-run of the model, nothing is faked.",
        "Geser inputnya, matikan sebagian input, tanyakan mengapa bukan hasil lain. Setiap pratinjau adalah eksekusi ulang model yang sungguhan, tidak ada yang dipalsukan.",
      ),
    },
    {
      icon: MessageSquareText,
      title: t("A conversational explainer, in your browser", "Penjelas percakapan, di browser Anda"),
      text: t(
        "An open-weight language model runs on your GPU through WebLLM, grounded only on the computed facts, and can read a free-text description into the form.",
        "Model bahasa open-weight berjalan di GPU Anda melalui WebLLM, hanya berpijak pada fakta yang dihitung, dan dapat membaca deskripsi teks bebas ke dalam formulir.",
      ),
    },
    {
      icon: Scale,
      title: t("Sound and flawed advice", "Saran yang tepat dan yang keliru"),
      text: t(
        "Some study recommendations are deliberately shifted the wrong way while the explanation stays honest. Noticing the mismatch is the skill the study measures.",
        "Sebagian rekomendasi studi sengaja digeser ke arah yang salah sementara penjelasannya tetap jujur. Menyadari ketidakcocokan itulah keterampilan yang diukur studi ini.",
      ),
    },
    {
      icon: FileSearch,
      title: t("Full transparency", "Transparansi penuh"),
      text: t(
        "The training data, the cross-validated results, the confusion matrix and every one of the 400 cases are on the Training data page. The scorecard's weights are printed in full.",
        "Data pelatihan, hasil validasi silang, confusion matrix, dan seluruh 400 kasus ada di halaman Data pelatihan. Bobot scorecard dicetak lengkap.",
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
                {t("Open research study · anonymous · 10 minutes", "Studi penelitian terbuka · anonim · 10 menit")}
              </span>
              <h1 className="rise rise-1 text-balance text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
                {t("Know when to trust", "Tahu kapan harus memercayai")}{" "}
                <span className="text-gradient">
                  {t("AI investment advice", "saran investasi AI")}
                </span>
              </h1>
              <p className="rise rise-2 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {t(
                  "AdviceIT is an open study on which explanations help people follow AI advice when it is sound and push back when it is not. Try the advisors, then give ten minutes to the research.",
                  "AdviceIT adalah studi terbuka tentang penjelasan mana yang membantu orang mengikuti saran AI saat saran itu tepat dan menolaknya saat keliru. Coba penasihatnya, lalu berikan sepuluh menit untuk penelitian ini.",
                )}
              </p>
              <div className="rise rise-3 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
                  <Link href="/advisor/ml">
                    {t("Try the AI advisor", "Coba penasihat AI")} <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
                  <Link href="/participate">{t("Take part in the study", "Ikut serta dalam studi")}</Link>
                </Button>
              </div>
              <p className="rise rise-4 text-sm text-muted-foreground">
                {t(
                  "No account, no personal data, hypothetical cases only.",
                  "Tanpa akun, tanpa data pribadi, hanya kasus hipotetis.",
                )}
              </p>
            </div>
            <AdvicePreview />
          </div>
        </section>

        {/* How a session works */}
        <section className="border-y border-border/70 bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("How a session works", "Bagaimana satu sesi berjalan")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("Three steps, ten minutes, fully anonymous", "Tiga langkah, sepuluh menit, sepenuhnya anonim")}
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

        {/* Why this research */}
        <section>
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:gap-16">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("The question", "Pertanyaannya")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                {t("What this research is for", "Untuk apa penelitian ini")}
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {t(
                  "Robo-advisors already manage real money, and explainable AI promises to make their advice understandable. But an explanation is only useful if it calibrates trust: helping you follow advice when it is sound and push back when it is flawed. Which explanation styles actually do that is an open question, and it is the question behind this instrument, built as a follow-up to a systematic literature review on trust and algorithm aversion in AI financial advice (SSRAAI 2026).",
                  "Robo-advisor sudah mengelola uang sungguhan, dan explainable AI menjanjikan saran yang dapat dipahami. Namun sebuah penjelasan hanya berguna jika ia mengalibrasi kepercayaan: membantu Anda mengikuti saran saat saran itu tepat dan menolaknya saat keliru. Gaya penjelasan mana yang benar-benar melakukannya masih menjadi pertanyaan terbuka, dan itulah pertanyaan di balik instrumen ini, yang dibangun sebagai tindak lanjut dari systematic literature review tentang kepercayaan dan algorithm aversion dalam saran keuangan AI (SSRAAI 2026).",
                )}
              </p>
              <p className="leading-relaxed text-muted-foreground">
                {t(
                  "Two advisors power the study, both trained on ILS-Bench, a benchmark of 400 investor cases validated by a panel of four financial-domain experts. One is a neural network whose explanations must be computed after the fact. One is an interpretable scorecard whose explanations are exact. Comparing them turns explanation faithfulness itself into something we can measure.",
                  "Dua penasihat menggerakkan studi ini, keduanya dilatih pada ILS-Bench, benchmark berisi 400 kasus investor yang divalidasi panel empat ahli keuangan. Satu berupa neural network yang penjelasannya harus dihitung setelah keputusan. Satu lagi scorecard interpretable yang penjelasannya eksak. Membandingkan keduanya menjadikan kesetiaan penjelasan itu sendiri sesuatu yang dapat diukur.",
                )}
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("Your part", "Peran Anda")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                {t("Why we need your responses", "Mengapa kami membutuhkan jawaban Anda")}
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {t(
                  "Models can be benchmarked automatically. Trust cannot. Whether an explanation helps a person rely on advice appropriately can only be learned from people making decisions, which is exactly what the study session records: you read short hypothetical cases, see the advisor's recommendation with one explanation style, and tell us what you would do.",
                  "Model dapat diuji secara otomatis. Kepercayaan tidak. Apakah sebuah penjelasan membantu seseorang mengandalkan saran secara tepat hanya bisa dipelajari dari orang yang mengambil keputusan, dan itulah yang direkam sesi studi: Anda membaca kasus hipotetis singkat, melihat rekomendasi penasihat dengan satu gaya penjelasan, dan memberi tahu kami apa yang akan Anda lakukan.",
                )}
              </p>
              <p className="leading-relaxed text-muted-foreground">
                {t(
                  "Everything is anonymous. No name, email or account data is collected, the cases are hypothetical, no real money is involved, and some recommendations are deliberately altered so that appropriate reliance can be measured at all. You are told which ones at the end.",
                  "Semuanya anonim. Tidak ada nama, email, atau data akun yang dikumpulkan, kasusnya hipotetis, tidak ada uang sungguhan, dan sebagian rekomendasi sengaja diubah agar reliance yang tepat dapat diukur. Anda diberi tahu yang mana di bagian akhir.",
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Numbers */}
        <section className="band-soft border-y border-border/70">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-14 sm:px-6 md:grid-cols-4">
            <Stat
              value="400"
              label={t("expert-validated cases behind the advisors", "kasus tervalidasi ahli di balik para penasihat")}
            />
            <Stat
              value={`${Math.round((mlMeta.cvAccuracy as number) * 100)}%`}
              label={t("cross-validated accuracy, AI advisor", "akurasi validasi silang, penasihat AI")}
            />
            <Stat
              value={`${Math.round((logitMeta.cvAccuracy as number) * 100)}%`}
              label={t(
                "cross-validated accuracy, interpretable advisor",
                "akurasi validasi silang, penasihat interpretable",
              )}
            />
            <Stat value="7" label={t("explanation styles you can experience", "gaya penjelasan yang dapat Anda coba")} />
          </div>
        </section>

        {/* Features */}
        <section>
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("Inside the instrument", "Di dalam instrumen")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("What you will find here", "Apa yang akan Anda temukan di sini")}
              </h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article key={f.title} className="panel lift p-6">
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
        <section className="px-4 pb-24 sm:px-6">
          <div className="cta-panel relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-border/70 px-6 py-16 text-center">
            <div aria-hidden className="surface-grid opacity-60" />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {t(
                  "Ten minutes of your judgement is a datapoint no model can fake.",
                  "Sepuluh menit penilaian Anda adalah satu titik data yang tidak bisa dipalsukan model mana pun.",
                )}
              </h2>
              <p className="text-muted-foreground">
                {t(
                  "Six short cases, one explanation style, a debrief at the end.",
                  "Enam kasus singkat, satu gaya penjelasan, debrief di bagian akhir.",
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="space-y-1 text-center">
      <div className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">{value}</div>
      <div className="mx-auto max-w-[24ch] text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
