"use client";

/* The study design, stated publicly: the five conditions, the cases and how
   their flawed advice is made, how each decision is scored, the hypotheses
   and the analysis. The case table is computed from the advisor and the
   study definitions at render time, so it cannot drift from what
   participants see. The full protocol and the pre-registration are in
   docs/research. Kept in sync with src/lib/study.ts and src/lib/scoring.ts. */

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Reveal } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PageTransition } from "@/components/page-transition";
import { ADVISORS } from "@/lib/advisor/advisors";
import { recommendWithMisread } from "@/lib/advisor/flaw";
import { outcomeName } from "@/lib/advisor/strings";
import { tr, useLang } from "@/lib/i18n";
import { CASES, STUDY_ADVISOR, STUDY_CASES, caseDisplay, misreadSentence } from "@/lib/study";

type L = { en: string; id: string };

const CONDITIONS: { name: L; what: L }[] = [
  {
    name: { en: "No explanation", id: "Tanpa penjelasan" },
    what: { en: "The recommendation alone. The control.", id: "Hanya rekomendasi. Ini kondisi kontrol." },
  },
  {
    name: { en: "Why", id: "Mengapa" },
    what: {
      en: "How much each fact about the person counted, as bars (exact Shapley values of the network).",
      id: "Seberapa besar pengaruh setiap fakta tentang orang itu, dalam bentuk grafik batang (nilai Shapley jaringan yang eksak).",
    },
  },
  {
    name: { en: "What would change it", id: "Apa yang bisa mengubahnya" },
    what: {
      en: "The smallest change to one fact that gives different advice, found by re-running the advisor.",
      id: "Perubahan terkecil pada satu fakta yang menghasilkan saran berbeda, ditemukan dengan menjalankan ulang penasihat.",
    },
  },
  {
    name: { en: "How sure", id: "Seberapa yakin" },
    what: {
      en: "The calibrated probability of the advice, beside that of every other outcome.",
      id: "Peluang terkalibrasi untuk saran itu, di samping peluang semua hasil lain.",
    },
  },
  {
    name: { en: "All three", id: "Ketiganya sekaligus" },
    what: { en: "Why, what would change it and how sure, together.", id: "Mengapa, apa yang bisa mengubahnya, dan seberapa yakin, sekaligus." },
  },
];

export function DesignContent() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const p = (v: L) => tr(locale, v);

  /* Each case's advice on the real facts and on the misread ones, from the
     advisor itself. */
  const rows = useMemo(
    () =>
      CASES.map((c) => ({
        id: c.id,
        label: caseDisplay({ profileId: c.id, label: c.label, text: c.text }, locale).label,
        sound: ADVISORS[STUDY_ADVISOR].recommend(c.profile).portfolio.name,
        flawed: recommendWithMisread(STUDY_ADVISOR, c.profile, c.misread).portfolio.name,
        misread: misreadSentence(c.misread, c.profile, locale),
      })),
    [locale],
  );

  return (
    <>
      <SiteHeader />
      <PageTransition>
      <main className="flex-1">
        <PageHero
          eyebrow={t("Method", "Metode")}
          title={t("How this study is designed", "Bagaimana studi ini dirancang")}
          lead={t(
            "One question: does what an explanation says help people tell good AI investment advice from bad? Each participant judges eight cases, half of them with advice that is deliberately wrong, under one of five explanation conditions.",
            "Satu pertanyaan: apakah isi sebuah penjelasan membantu orang membedakan saran investasi AI yang baik dari yang buruk? Setiap peserta menilai delapan kasus, separuhnya dengan saran yang sengaja dibuat keliru, dalam salah satu dari lima kondisi penjelasan.",
          )}
          width="max-w-5xl"
        />

        <div className="mx-auto max-w-5xl space-y-12 px-4 py-14 sm:px-6">
          <p className="rounded-2xl border border-border/70 bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
            {t(
              "This page is written for researchers and reviewers. If you are taking part in the study, you do not need any of it.",
              "Halaman ini ditulis untuk peneliti dan reviewer. Jika Anda peserta penelitian, Anda tidak perlu membaca ini.",
            )}{" "}
            <Link href="/participate" className="font-medium text-primary underline underline-offset-4">
              {t("Take part", "Ikut serta")}
            </Link>
          </p>

          {/* 1. Conditions */}
          <Reveal as="section" className="space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight">{t("1. Five explanation conditions", "1. Lima kondisi penjelasan")}</h2>
            <p className="leading-relaxed text-muted-foreground">
              {t(
                "Each participant sees one condition throughout (between participants). The explanation is always a static panel under the recommendation, and the advisor is the same for everyone: the AI advisor, a neural network trained on 400 expert-reviewed cases. At consent, each participant is placed in the condition with the fewest people so far.",
                "Setiap peserta melihat satu kondisi dari awal sampai akhir (antarpeserta). Penjelasan selalu berupa panel biasa di bawah rekomendasi, dan penasihatnya sama untuk semua orang: penasihat AI, jaringan saraf yang dilatih dengan 400 kasus yang sudah ditinjau ahli. Saat memberi persetujuan, setiap peserta ditempatkan pada kondisi yang pesertanya paling sedikit sejauh ini.",
              )}
            </p>
            <dl className="grid gap-3 sm:grid-cols-2">
              {CONDITIONS.map((c) => (
                <div key={c.name.en} className="panel p-5">
                  <dt className="font-semibold">{p(c.name)}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{p(c.what)}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {/* 2. Cases and flaws */}
          <Reveal as="section" className="space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight">{t("2. The cases and the flawed advice", "2. Kasus dan saran yang keliru")}</h2>
            <p className="leading-relaxed text-muted-foreground">
              {t(
                `Every participant judges all ${STUDY_CASES} cases once, in an order seeded by their ID, and half of them, drawn at random, come with flawed advice. To make advice flawed, the advisor is given one or two wrong facts about the person, as if an answer had been entered or read wrongly. Its advice then does not suit the person described, while everything it says about its own reasoning stays true: the explanations describe the facts it was given, the wrong ones included.`,
                `Setiap peserta menilai ke-${STUDY_CASES} kasus masing-masing sekali, dengan urutan yang ditentukan oleh ID-nya, dan separuhnya, dipilih secara acak, disertai saran yang keliru. Untuk membuat saran keliru, penasihat diberi satu atau dua fakta yang salah tentang orang itu, seolah-olah ada jawaban yang salah dimasukkan atau dibaca. Sarannya lalu tidak cocok untuk orang yang digambarkan, sementara semua yang dikatakannya tentang alasannya sendiri tetap benar: penjelasan menggambarkan fakta yang diterimanya, termasuk yang salah.`,
              )}
            </p>
            <div className="panel overflow-x-auto p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Case", "Kasus")}</TableHead>
                    <TableHead>{t("Advice on the real facts", "Saran berdasarkan fakta sebenarnya")}</TableHead>
                    <TableHead>{t("The wrong facts", "Fakta yang salah")}</TableHead>
                    <TableHead>{t("Advice it then gives", "Saran yang kemudian diberikan")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.id} · {r.label}
                      </TableCell>
                      <TableCell>{outcomeName(r.sound)}</TableCell>
                      <TableCell className="min-w-56 text-muted-foreground">{r.misread}</TableCell>
                      <TableCell>{outcomeName(r.flawed)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(
                "Each flaw puts the advice at least two mixes away from the sound one, or gives a mix where a referral to a person was due. Half make the advice riskier than it should be, half more cautious. The flaw can be caught in every condition, but by different routes: without an explanation only by judging the advice against the case; with Why or What would change it also by spotting a fact that does not match the case; with How sure not from the panel, because the advisor is as confident about the facts it was given as ever. The instrument never states the mismatch itself.",
                "Setiap kekeliruan membuat saran berjarak setidaknya dua komposisi dari saran yang tepat, atau memberi komposisi padahal seharusnya dirujuk ke manusia. Separuhnya membuat saran lebih berisiko dari seharusnya, separuhnya lebih hati-hati. Kekeliruan bisa dikenali di setiap kondisi, tetapi lewat cara berbeda: tanpa penjelasan hanya dengan menilai saran terhadap kasusnya; dengan Mengapa atau Apa yang bisa mengubahnya juga dengan melihat fakta yang tidak cocok dengan kasusnya; dengan Seberapa yakin tidak dari panelnya, karena penasihat tetap yakin dengan fakta yang diterimanya. Alat ini tidak pernah menyebutkan ketidakcocokan itu secara langsung.",
              )}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(
                "The sound advice is the advisor's own answer on the real facts. Before the main study, two to three financial experts confirm, case by case, that it suits the person and that the flawed advice does not.",
                "Saran yang tepat adalah jawaban penasihat sendiri berdasarkan fakta sebenarnya. Sebelum studi utama, dua sampai tiga ahli keuangan memastikan, kasus demi kasus, bahwa saran itu cocok untuk orangnya dan saran yang keliru tidak.",
              )}
            </p>
          </Reveal>

          {/* 3. Measures and scoring */}
          <Reveal as="section" className="space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight">{t("3. What is measured, and how it is scored", "3. Apa yang diukur, dan cara menilainya")}</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="panel space-y-2 p-6 text-sm">
                <h3 className="font-semibold">{t("In each case", "Di setiap kasus")}</h3>
                <p className="text-muted-foreground">
                  {t(
                    "The decision (follow, adjust to another mix, reject, ask a human adviser), trust, understanding, confidence in the decision and mental demand on 7-point scales, an optional reason, the time spent reading the case and the time to decide.",
                    "Keputusan (ikuti, sesuaikan ke komposisi lain, tolak, tanya penasihat manusia), kepercayaan, pemahaman, keyakinan atas keputusan, dan beban berpikir pada skala 7 poin, alasan yang tidak wajib, waktu membaca kasus, dan waktu untuk memutuskan.",
                  )}
                </p>
              </div>
              <div className="panel space-y-2 p-6 text-sm">
                <h3 className="font-semibold">{t("Once per participant", "Sekali per peserta")}</h3>
                <p className="text-muted-foreground">
                  {t(
                    "Before the cases: the Big Three financial literacy questions, need for cognition (six items) and ease of satisfaction (three items). After them: five ratings of the explanations (not asked in the control), two open questions. Two instructed-response statements check attention, one before and one after the cases.",
                    "Sebelum kasus: tiga pertanyaan literasi keuangan Big Three, kebutuhan berpikir (enam butir), dan kemudahan merasa puas (tiga butir). Setelahnya: lima penilaian tentang penjelasan (tidak ditanyakan di kondisi kontrol) dan dua pertanyaan terbuka. Dua pernyataan berisi instruksi memeriksa perhatian, satu sebelum dan satu sesudah kasus.",
                  )}
                </p>
              </div>
            </div>
            <div className="panel p-6 text-sm">
              <h3 className="font-semibold">{t("Scoring a decision", "Cara menilai keputusan")}</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>
                  {t(
                    "Relied on the advice: Follow, or Ask a human adviser when the advice itself was to see one.",
                    "Mengandalkan saran: Ikuti, atau Tanya penasihat manusia jika sarannya memang untuk menemui penasihat manusia.",
                  )}
                </li>
                <li>
                  {t(
                    "Appropriate (the primary outcome): relied on sound advice, or did not rely on flawed advice.",
                    "Tepat (hasil utama): mengandalkan saran yang tepat, atau tidak mengandalkan saran yang keliru.",
                  )}
                </li>
                <li>
                  {t(
                    "Corrected (secondary, flawed cases only): adjusted to the sound mix, or asked a human adviser when a referral was the sound outcome.",
                    "Dikoreksi (sekunder, hanya kasus keliru): menyesuaikan ke komposisi yang tepat, atau bertanya ke penasihat manusia jika rujukan adalah hasil yang tepat.",
                  )}
                </li>
              </ul>
            </div>
          </Reveal>

          {/* 4. Hypotheses */}
          <Reveal as="section" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">{t("4. Hypotheses", "4. Hipotesis")}</h2>
            <ol className="list-decimal space-y-2 pl-5 leading-relaxed text-muted-foreground">
              <li>
                {t(
                  "The explanation condition changes how well people tell sound advice from flawed advice (condition by scenario interaction on reliance).",
                  "Kondisi penjelasan mengubah seberapa baik orang membedakan saran yang tepat dari yang keliru (interaksi kondisi dan skenario terhadap ketergantungan).",
                )}
              </li>
              <li>
                {t(
                  "Why, What would change it and All three, which show the facts the advisor used, improve that discrimination over No explanation, mainly by lowering reliance on flawed advice.",
                  "Mengapa, Apa yang bisa mengubahnya, dan Ketiganya sekaligus, yang menampilkan fakta yang dipakai penasihat, meningkatkan kemampuan membedakan itu dibandingkan Tanpa penjelasan, terutama dengan menurunkan ketergantungan pada saran yang keliru.",
                )}
              </li>
              <li>
                {t(
                  "How sure does not improve discrimination over No explanation, because flawed advice comes with high confidence.",
                  "Seberapa yakin tidak meningkatkan kemampuan membedakan dibandingkan Tanpa penjelasan, karena saran yang keliru tetap disertai keyakinan tinggi.",
                )}
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              {t(
                "Trust, understanding, mental demand, correction, and moderation by financial literacy and need for cognition are secondary and exploratory. The full wording is in the pre-registration.",
                "Kepercayaan, pemahaman, beban berpikir, koreksi, serta pengaruh literasi keuangan dan kebutuhan berpikir bersifat sekunder dan eksploratif. Rumusan lengkapnya ada di dokumen pra-registrasi.",
              )}
            </p>
          </Reveal>

          {/* 5. Analysis */}
          <Reveal as="section" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">{t("5. Analysis and exclusions", "5. Analisis dan data yang dikecualikan")}</h2>
            <ul className="list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground">
              <li>
                {t(
                  "Reliance in each case is modelled with mixed-effects logistic regression, condition by scenario, with random intercepts for the participant and the case. Each condition is compared with No explanation on the scenario effect, with Holm correction.",
                  "Ketergantungan di setiap kasus dimodelkan dengan regresi logistik efek campuran (kondisi × skenario), dengan intersep acak untuk peserta dan kasus. Setiap kondisi dibandingkan dengan Tanpa penjelasan pada efek skenario, dengan koreksi Holm.",
                )}
              </li>
              <li>
                {t(
                  "Excluded: participants who fail either attention statement, repeat sessions from the same browser, sessions finished implausibly fast (the cut-off is fixed in the pre-registration) and researcher test links.",
                  "Dikecualikan: peserta yang gagal di salah satu pernyataan perhatian, sesi ulang dari browser yang sama, sesi yang selesai terlalu cepat (batasnya ditetapkan di pra-registrasi), dan tautan uji coba peneliti.",
                )}
              </li>
              <li>
                {t(
                  "The sample size is planned by simulation before collection starts, and collection stops at that number of valid participants per condition.",
                  "Ukuran sampel direncanakan lewat simulasi sebelum pengumpulan data dimulai, dan pengumpulan berhenti setelah jumlah peserta valid per kondisi tercapai.",
                )}
              </li>
              <li>
                {t(
                  "Every row records the app version, the design and the phase. Pilot answers are used to improve the study and are not reported as results; the main study begins once the ethics committee has approved the protocol.",
                  "Setiap baris data mencatat versi aplikasi, rancangan, dan tahapnya. Jawaban dari tahap uji coba dipakai untuk memperbaiki penelitian dan tidak dilaporkan sebagai hasil; studi utama dimulai setelah komisi etik menyetujui protokolnya.",
                )}
              </li>
            </ul>
          </Reveal>

          {/* 6. History */}
          <Reveal as="section" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">{t("6. How the design got here", "6. Asal-usul rancangan ini")}</h2>
            <p className="leading-relaxed text-muted-foreground">
              {t(
                "The pilot up to version 2.15 ran a wider fractional design: the five contents above, plus interactive, adaptive and conversational delivery, with two advisors assigned at random, nine cells in all. That needs more participants than one study can recruit, so version 3.0.0 keeps the content comparison with one advisor and leaves delivery and the advisor comparison for later studies. The pilot's flawed advice also changed: it used to show a different outcome from the one the advisor computed, which made the explanations attach the computed outcome's numbers to the shown outcome's name. The code for the other conditions stays in the repository, and the conversational explainer stays on the advisor pages, outside the study.",
                "Uji coba hingga versi 2.15 memakai rancangan fraksional yang lebih luas: lima konten di atas, ditambah penyajian interaktif, adaptif, dan percakapan, dengan dua penasihat yang diundi, total sembilan sel. Itu membutuhkan lebih banyak peserta daripada yang bisa direkrut satu studi, sehingga versi 3.0.0 mempertahankan perbandingan konten dengan satu penasihat dan menyisakan penyajian serta perbandingan penasihat untuk studi berikutnya. Cara membuat saran keliru juga berubah: dulu yang ditampilkan adalah hasil yang berbeda dari hasil hitungan penasihat, sehingga penjelasan menempelkan angka hasil hitungan pada nama hasil yang ditampilkan. Kode untuk kondisi lain tetap ada di repositori, dan fitur percakapan tetap ada di halaman penasihat, di luar penelitian.",
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("The protocol, the consent text and the pre-registration draft are in", "Protokol, teks persetujuan, dan draf pra-registrasi ada di")}{" "}
              <a
                href="https://github.com/Raditya-P/AdviceIT/tree/main/docs/research"
                target="_blank"
                rel="noopener"
                className="font-medium text-primary underline underline-offset-4"
              >
                docs/research
              </a>
              .
            </p>
          </Reveal>

          <Reveal as="section" className="cta-panel relative overflow-hidden rounded-[1.75rem] border border-border/70 px-6 py-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">{t("See it from the inside", "Coba sendiri")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t(
                "The fastest way to understand the design is to take part once.",
                "Cara tercepat memahami rancangan ini adalah mencobanya sendiri sebagai peserta.",
              )}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild className="h-11 rounded-full pl-6 pr-5">
                <Link href="/participate">
                  {t("Take part in the study", "Ikut penelitian")}
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full px-6">
                <Link href="/references">{t("References and tools", "Referensi dan alat bantu")}</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </main>
      <SiteFooter />
      </PageTransition>
    </>
  );
}
