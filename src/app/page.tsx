"use client";

import Link from "next/link";
import { ArrowRight, Brain, FileSearch, MessageSquareText, Scale, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { logitMeta, mlMeta } from "@/lib/advisor/advisors";
import { tr, useLang } from "@/lib/i18n";

export default function HomePage() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });

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
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,--theme(--color-primary/8%),transparent)]"
          />
          <div className="mx-auto flex min-h-[62svh] max-w-6xl flex-col items-center justify-center gap-8 px-4 py-20 text-center">
            <Badge variant="secondary" className="gap-2">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              {t("Open research study · pilot · anonymous", "Studi penelitian terbuka · pilot · anonim")}
            </Badge>
            <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              {locale === "id" ? (
                <>
                  Saat AI memberi Anda <span className="text-primary">saran keuangan</span>, apa yang membuat Anda
                  memercayainya dengan tepat?
                </>
              ) : (
                <>
                  When an AI gives you <span className="text-primary">financial advice</span>, what makes you trust it
                  right?
                </>
              )}
            </h1>
            <p className="max-w-2xl text-balance text-lg text-muted-foreground">
              {t(
                "People follow flawed AI advice and reject sound advice every day. This study tests which explanations help people rely on AI investment advice appropriately. Try the advisors, then lend us ten minutes.",
                "Setiap hari orang mengikuti saran AI yang keliru dan menolak saran yang tepat. Studi ini menguji penjelasan mana yang membantu orang mengandalkan saran investasi AI secara tepat. Coba kedua penasihatnya, lalu luangkan sepuluh menit untuk kami.",
              )}
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <Link href="/advisor/ml">
                  {t("Try the AI advisor", "Coba penasihat AI")} <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-6 text-base">
                <Link href="/advisor/logit">
                  {t("Try the interpretable rule-based advisor", "Coba penasihat interpretable berbasis aturan")}
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("Ready to contribute?", "Siap berkontribusi?")}{" "}
              <Link href="/participate" className="font-medium text-primary underline underline-offset-4">
                {t("Join the study", "Ikuti studinya")}
              </Link>{" "}
              {t("· 10 to 15 minutes, fully anonymous", "· 10 sampai 15 menit, sepenuhnya anonim")}
            </p>
          </div>
        </section>

        {/* Why this research */}
        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:gap-16">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight">
                {t("What this research is for", "Untuk apa penelitian ini")}
              </h2>
              <p className="text-muted-foreground">
                {t(
                  "Robo-advisors already manage real money, and explainable AI promises to make their advice understandable. But an explanation is only useful if it calibrates trust: helping you follow advice when it is sound and push back when it is flawed. Which explanation styles actually do that is an open question, and it is the question behind this instrument, built as a follow-up to a systematic literature review on trust and algorithm aversion in AI financial advice (SSRAAI 2026).",
                  "Robo-advisor sudah mengelola uang sungguhan, dan explainable AI menjanjikan saran yang dapat dipahami. Namun sebuah penjelasan hanya berguna jika ia mengalibrasi kepercayaan: membantu Anda mengikuti saran saat saran itu tepat dan menolaknya saat keliru. Gaya penjelasan mana yang benar-benar melakukannya masih menjadi pertanyaan terbuka, dan itulah pertanyaan di balik instrumen ini, yang dibangun sebagai tindak lanjut dari systematic literature review tentang kepercayaan dan algorithm aversion dalam saran keuangan AI (SSRAAI 2026).",
                )}
              </p>
              <p className="text-muted-foreground">
                {t(
                  "Two advisors power the study, both trained on ILS-Bench, a benchmark of 400 investor cases validated by a panel of four financial-domain experts. One is a neural network whose explanations must be computed after the fact. One is an interpretable scorecard whose explanations are exact. Comparing them turns explanation faithfulness itself into something we can measure.",
                  "Dua penasihat menggerakkan studi ini, keduanya dilatih pada ILS-Bench, benchmark berisi 400 kasus investor yang divalidasi panel empat ahli keuangan. Satu berupa neural network yang penjelasannya harus dihitung setelah keputusan. Satu lagi scorecard interpretable yang penjelasannya eksak. Membandingkan keduanya menjadikan kesetiaan penjelasan itu sendiri sesuatu yang dapat diukur.",
                )}
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight">
                {t("Why we need your responses", "Mengapa kami membutuhkan jawaban Anda")}
              </h2>
              <p className="text-muted-foreground">
                {t(
                  "Models can be benchmarked automatically. Trust cannot. Whether an explanation helps a person rely on advice appropriately can only be learned from people making decisions, which is exactly what the study session records: you read short hypothetical cases, see the advisor's recommendation with one explanation style, and tell us what you would do.",
                  "Model dapat diuji secara otomatis. Kepercayaan tidak. Apakah sebuah penjelasan membantu seseorang mengandalkan saran secara tepat hanya bisa dipelajari dari orang yang mengambil keputusan, dan itulah yang direkam sesi studi: Anda membaca kasus hipotetis singkat, melihat rekomendasi penasihat dengan satu gaya penjelasan, dan memberi tahu kami apa yang akan Anda lakukan.",
                )}
              </p>
              <p className="text-muted-foreground">
                {t(
                  "Everything is anonymous. No name, email or account data is collected, the cases are hypothetical, no real money is involved, and some recommendations are deliberately altered so that appropriate reliance can be measured at all. You are told which ones at the end.",
                  "Semuanya anonim. Tidak ada nama, email, atau data akun yang dikumpulkan, kasusnya hipotetis, tidak ada uang sungguhan, dan sebagian rekomendasi sengaja diubah agar reliance yang tepat dapat diukur. Anda diberi tahu yang mana di bagian akhir.",
                )}
              </p>
            </div>
          </div>
        </section>

        {/* What is inside */}
        <section>
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-semibold tracking-tight">
              {t("What you will find inside", "Apa yang akan Anda temukan di dalamnya")}
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <Card key={f.title} className="border-border/60">
                  <CardContent className="space-y-2 pt-6">
                    <f.icon className="size-5 text-primary" />
                    <h3 className="font-medium">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Numbers strip */}
        <section className="border-y border-border/60 bg-muted/30">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 text-center md:grid-cols-4">
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
              label={t("cross-validated accuracy, interpretable advisor", "akurasi validasi silang, penasihat interpretable")}
            />
            <Stat
              value="7"
              label={t("explanation styles you can experience", "gaya penjelasan yang dapat Anda coba")}
            />
          </div>
        </section>

        {/* Final CTA */}
        <section>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-20 text-center">
            <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {t(
                "Ten minutes of your judgement is a datapoint no model can fake.",
                "Sepuluh menit penilaian Anda adalah satu titik data yang tidak bisa dipalsukan model mana pun.",
              )}
            </h2>
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href="/participate">
                {t("Participate in the study", "Ikut serta dalam studi")} <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              {t(
                "Anonymous · hypothetical cases · you see a debrief at the end",
                "Anonim · kasus hipotetis · Anda melihat debrief di bagian akhir",
              )}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="text-4xl font-semibold tracking-tight text-primary">{value}</div>
      <div className="mx-auto max-w-[22ch] text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
