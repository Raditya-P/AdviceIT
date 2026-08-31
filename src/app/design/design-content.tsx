"use client";

/* The design rationale, stated publicly: the two factors, the cells this
   pilot fills, which contrasts are interpretable, and how the quantitative
   and qualitative strands are meant to be read together. Kept in sync with
   PRESETS in src/lib/conditions.ts and ASSIGNABLE_CONDITIONS in
   src/lib/study.ts. */

import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { tr, useLang } from "@/lib/i18n";

type L = { en: string; id: string };

const CONTENT_LEVELS: { key: string; name: L; what: L }[] = [
  {
    key: "none",
    name: { en: "No explanation", id: "Tanpa penjelasan" },
    what: { en: "The recommendation on its own. The control.", id: "Rekomendasi saja. Kondisi kontrol." },
  },
  {
    key: "feature",
    name: { en: "Why", id: "Mengapa" },
    what: {
      en: "Attribution: how much each answer counted, as exact Shapley values for the network and as exact weights for the scorecard.",
      id: "Atribusi: seberapa besar tiap jawaban berpengaruh, berupa nilai Shapley eksak untuk neural network dan bobot eksak untuk scorecard.",
    },
  },
  {
    key: "counterfactual",
    name: { en: "What would change it", id: "Apa yang mengubahnya" },
    what: {
      en: "Contrastive: the smallest single change to the situation that flips the outcome, found by re-running the advisor.",
      id: "Kontrastif: satu perubahan terkecil pada situasi yang membalik hasilnya, ditemukan dengan menjalankan ulang penasihat.",
    },
  },
  {
    key: "confidence",
    name: { en: "How sure", id: "Seberapa yakin" },
    what: {
      en: "Uncertainty: the calibrated probability of the outcome, with the probability of every other outcome.",
      id: "Ketidakpastian: probabilitas terkalibrasi dari hasilnya, beserta probabilitas semua hasil lain.",
    },
  },
  {
    key: "hybrid",
    name: { en: "All three", id: "Ketiganya" },
    what: { en: "The three contents above, together.", id: "Ketiga konten di atas, sekaligus." },
  },
];

const DELIVERY_LEVELS: { key: string; name: L; what: L }[] = [
  {
    key: "static",
    name: { en: "Static", id: "Statis" },
    what: { en: "A panel, read as it is.", id: "Sebuah panel, dibaca apa adanya." },
  },
  {
    key: "interactive",
    name: { en: "Interactive", id: "Interaktif" },
    what: {
      en: "The inputs can be moved and the advice reacts live, with a why-not selector.",
      id: "Inputnya dapat digeser dan sarannya bereaksi seketika, dengan pemilih mengapa-bukan.",
    },
  },
  {
    key: "adaptive",
    name: { en: "Adaptive", id: "Adaptif" },
    what: {
      en: "Plain sentences or the detailed version, chosen by the measured financial literacy score.",
      id: "Kalimat sederhana atau versi rinci, dipilih berdasarkan skor literasi keuangan yang diukur.",
    },
  },
  {
    key: "llm",
    name: { en: "Conversational", id: "Percakapan" },
    what: {
      en: "A language model in the browser retells the computed facts and answers follow-up questions.",
      id: "Model bahasa di browser menceritakan ulang fakta yang dihitung dan menjawab pertanyaan lanjutan.",
    },
  },
];

/* content key -> delivery key -> the condition that fills that cell */
const CELLS: Record<string, Record<string, L>> = {
  none: {
    static: { en: "No explanation", id: "Tanpa penjelasan" },
    interactive: { en: "Interactive only", id: "Hanya interaktif" },
  },
  feature: { static: { en: "Why", id: "Mengapa" } },
  counterfactual: { static: { en: "What would change it", id: "Apa yang mengubahnya" } },
  confidence: { static: { en: "How sure", id: "Seberapa yakin" } },
  hybrid: {
    static: { en: "All three", id: "Ketiganya" },
    interactive: { en: "Interactive with all three", id: "Interaktif dengan ketiganya" },
    adaptive: { en: "Adaptive to literacy", id: "Adaptif terhadap literasi" },
    llm: { en: "Conversational", id: "Percakapan" },
  },
};

export function DesignContent() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const p = (v: L) => tr(locale, v);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHero
          eyebrow={t("Method", "Metode")}
          title={t("How this study is designed", "Bagaimana studi ini dirancang")}
          lead={t(
            "AdviceIT varies two things independently: what an explanation says, and how it reaches you. This page states the design, the cells this pilot fills, which comparisons are interpretable, and how the numbers and the free text are meant to be read together.",
            "AdviceIT memvariasikan dua hal secara terpisah: apa yang dikatakan sebuah penjelasan, dan bagaimana penjelasan itu sampai kepada Anda. Halaman ini memaparkan rancangannya, sel mana yang diisi studi pilot ini, perbandingan mana yang dapat ditafsirkan, dan bagaimana angka serta teks bebas dimaksudkan untuk dibaca bersama.",
          )}
          width="max-w-5xl"
        />

        <div className="mx-auto max-w-5xl space-y-12 px-4 py-14 sm:px-6">
          {/* 1. Two factors */}
          <section className="space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("1. Two factors, not one list", "1. Dua faktor, bukan satu daftar")}
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              {t(
                "An explanation condition is a pair. The content factor sets what is explained. The delivery factor sets how that material reaches the participant. Interactivity, adaptation and conversation are not kinds of explanation, they are ways of handing the same material over. Keeping them on their own axis is what makes it possible to say whether an effect came from the information or from the way it was given.",
                "Sebuah kondisi penjelasan adalah pasangan. Faktor konten menetapkan apa yang dijelaskan. Faktor penyajian menetapkan bagaimana materi itu sampai kepada peserta. Interaktivitas, adaptasi, dan percakapan bukan jenis penjelasan, melainkan cara menyerahkan materi yang sama. Menjaga keduanya pada sumbu masing-masing itulah yang memungkinkan kita menyatakan apakah sebuah efek berasal dari informasinya atau dari cara penyampaiannya.",
              )}
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="panel p-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {t("Factor A: content", "Faktor A: konten")}
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  {CONTENT_LEVELS.map((c) => (
                    <div key={c.key}>
                      <dt className="font-medium">{p(c.name)}</dt>
                      <dd className="text-muted-foreground">{p(c.what)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="panel p-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {t("Factor B: delivery", "Faktor B: penyajian")}
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  {DELIVERY_LEVELS.map((d) => (
                    <div key={d.key}>
                      <dt className="font-medium">{p(d.name)}</dt>
                      <dd className="text-muted-foreground">{p(d.what)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t(
                "A modality factor sits inside the why content, which is the one content that exists both as bars and as sentences: visual, textual, or both together. It is held at visual in every cell of the design below, and varied only in a separate within-subject study, so that it does not multiply the cells here.",
                "Sebuah faktor modalitas berada di dalam konten mengapa, satu-satunya konten yang hadir baik sebagai batang maupun sebagai kalimat: visual, tekstual, atau keduanya sekaligus. Faktor ini dijaga pada visual di setiap sel rancangan di bawah, dan hanya divariasikan dalam studi within-subject terpisah, agar tidak melipatgandakan jumlah sel di sini.",
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {t(
                "A third factor runs alongside them: the advisor itself, a neural network whose explanations are computed after the decision, or an interpretable scorecard whose explanations are exact. It is assigned at random and logged, which turns explanation faithfulness into a measured variable rather than an assumption.",
                "Ada faktor ketiga yang berjalan bersamanya: penasihatnya sendiri, sebuah neural network yang penjelasannya dihitung setelah keputusan, atau scorecard interpretable yang penjelasannya eksak. Faktor ini ditetapkan secara acak dan dicatat, sehingga kesetiaan penjelasan menjadi variabel yang diukur, bukan asumsi.",
              )}
            </p>
          </section>

          {/* 2. The cells */}
          <section className="space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("2. The cells this pilot fills", "2. Sel yang diisi studi pilot ini")}
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              {t(
                "Crossing five contents with four deliveries gives twenty cells, far more than a pilot can fill. This is a fractional design: five cells vary content while delivery is held static, four cells vary delivery while the content is held at all three, and the all-three static condition sits in both arms as the hinge that ties them together.",
                "Menyilangkan lima konten dengan empat penyajian menghasilkan dua puluh sel, jauh lebih banyak daripada yang bisa diisi sebuah studi pilot. Ini rancangan fraksional: lima sel memvariasikan konten sementara penyajian dijaga statis, empat sel memvariasikan penyajian sementara kontennya dijaga pada ketiganya, dan kondisi ketiganya-statis berada di kedua lengan sebagai engsel yang menyatukannya.",
              )}
            </p>
            <div className="panel overflow-x-auto p-2">
              <table className="w-full min-w-[42rem] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {t("Content", "Konten")}
                    </th>
                    {DELIVERY_LEVELS.map((d) => (
                      <th
                        key={d.key}
                        className="p-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                      >
                        {p(d.name)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONTENT_LEVELS.map((c) => (
                    <tr key={c.key} className="border-t border-border/70">
                      <th scope="row" className="p-3 text-left font-medium">
                        {p(c.name)}
                      </th>
                      {DELIVERY_LEVELS.map((d) => {
                        const cell = CELLS[c.key]?.[d.key];
                        return (
                          <td key={d.key} className="p-3 align-top">
                            {cell ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                                <CheckCircle2 className="size-3.5" aria-hidden />
                                {p(cell)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/60">
                                {t("not run", "tidak dijalankan")}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">
              {t(
                "Nine cells. Eight of them are in the random pool. The conversational cell is offered by choice only, because it needs a WebGPU browser and downloads a model, so assigning it at random would fail for part of the sample.",
                "Sembilan sel. Delapan di antaranya masuk kumpulan acak. Sel percakapan hanya ditawarkan lewat pilihan, karena membutuhkan browser dengan WebGPU dan mengunduh model, sehingga menetapkannya secara acak akan gagal untuk sebagian sampel.",
              )}
            </p>
          </section>

          {/* 3. Contrasts */}
          <section className="space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("3. Which comparisons are interpretable", "3. Perbandingan mana yang dapat ditafsirkan")}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="panel space-y-3 p-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="size-4 text-primary" aria-hidden />
                  {t("Clean", "Bersih")}
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    {t(
                      "Why, What would change it, How sure and All three, each against No explanation. Delivery is static throughout, so a difference is attributable to content.",
                      "Mengapa, Apa yang mengubahnya, Seberapa yakin, dan Ketiganya, masing-masing terhadap Tanpa penjelasan. Penyajiannya statis di semuanya, sehingga perbedaan dapat diatribusikan kepada konten.",
                    )}
                  </li>
                  <li>
                    {t(
                      "Interactive with all three, Adaptive and Conversational, each against All three static. The content is identical, so a difference is attributable to delivery.",
                      "Interaktif dengan ketiganya, Adaptif, dan Percakapan, masing-masing terhadap Ketiganya statis. Kontennya identik, sehingga perbedaan dapat diatribusikan kepada penyajian.",
                    )}
                  </li>
                  <li>
                    {t(
                      "Interactive only against No explanation. Neither shows written explanation content, so this asks whether exploration on its own can do the work an explanation does.",
                      "Hanya interaktif terhadap Tanpa penjelasan. Keduanya tidak menampilkan konten penjelasan tertulis, sehingga ini menanyakan apakah eksplorasi saja dapat melakukan pekerjaan yang dilakukan sebuah penjelasan.",
                    )}
                  </li>
                </ul>
              </div>
              <div className="panel space-y-3 p-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <XCircle className="size-4 text-destructive" aria-hidden />
                  {t("Not reported", "Tidak dilaporkan")}
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    {t(
                      "Interactive only against All three static. The two differ on content and on delivery at the same time, so any difference between them cannot be assigned to either factor.",
                      "Hanya interaktif terhadap Ketiganya statis. Keduanya berbeda pada konten dan penyajian sekaligus, sehingga perbedaan apa pun di antaranya tidak dapat diatribusikan kepada salah satu faktor.",
                    )}
                  </li>
                  <li>
                    {t(
                      "Any comparison that crosses both arms without passing through the hinge condition.",
                      "Perbandingan apa pun yang melintasi kedua lengan tanpa melewati kondisi engsel.",
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Outcome */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("4. The outcome is an interaction", "4. Hasil utamanya adalah sebuah interaksi")}
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              {t(
                "Half of the recommendations each participant sees are deliberately shifted in the wrong direction while the explanation keeps describing the advisor's real reasoning. Appropriate reliance is following the sound ones and overriding the flawed ones. A condition that raises following on both is producing compliance, not calibration, which is why the quantity of interest is the condition by scenario interaction and never a main effect on trust.",
                "Separuh rekomendasi yang dilihat tiap peserta sengaja digeser ke arah yang salah sementara penjelasannya tetap menggambarkan penalaran sesungguhnya si penasihat. Reliance yang tepat berarti mengikuti yang benar dan menolak yang keliru. Kondisi yang menaikkan kepatuhan pada keduanya menghasilkan kepatuhan, bukan kalibrasi, dan itulah sebabnya besaran yang dicari adalah interaksi kondisi dengan skenario, bukan efek utama pada kepercayaan.",
              )}
            </p>
            <p className="leading-relaxed text-muted-foreground">
              {t(
                "The flaw is detectable in every condition, through that condition's own honest content: the confidence bars peak at a different outcome than the headline, the attribution describes evidence that does not fit the shown portfolio, the counterfactual reports that a trivial change would flip the advice, and the interactive previews re-run the real advisor. What the instrument never does is state the mismatch itself. During study trials the interactive panel therefore shows its previews without a sentence comparing them to the shown recommendation, because that sentence would perform the detection for the participant.",
                "Kekeliruan itu dapat dideteksi di setiap kondisi, melalui konten jujur milik kondisi itu sendiri: batang keyakinan memuncak di hasil yang berbeda dari judulnya, atribusi menggambarkan bukti yang tidak cocok dengan portofolio yang ditampilkan, kontrafaktual melaporkan bahwa perubahan sepele akan membalik sarannya, dan pratinjau interaktif menjalankan ulang penasihat yang sesungguhnya. Yang tidak pernah dilakukan instrumen ini adalah menyatakan ketidakcocokan itu sendiri. Karena itu selama percobaan studi panel interaktif menampilkan pratinjaunya tanpa kalimat yang membandingkannya dengan rekomendasi yang ditampilkan, sebab kalimat itu akan melakukan deteksi menggantikan peserta.",
              )}
            </p>
            <div className="panel p-6 text-sm">
              <p className="font-medium">{t("Measures per trial", "Ukuran per percobaan")}</p>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {t(
                  "Decision (follow, adjust, reject, ask a human), the direction and size of an adjustment, trust, understanding, decision confidence, mental demand, decision time, the time spent reading the case, and the interaction traces: what-if moves, why-not questions and conversational turns.",
                  "Keputusan (ikuti, sesuaikan, tolak, tanya manusia), arah dan besar penyesuaian, kepercayaan, pemahaman, keyakinan atas keputusan, beban mental, waktu keputusan, waktu membaca kasus, serta jejak interaksi: gerakan what-if, pertanyaan mengapa-bukan, dan giliran percakapan.",
                )}
              </p>
              <p className="mt-4 font-medium">{t("Moderators", "Moderator")}</p>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {t(
                  "Financial literacy measured with the Big Three questions, self-rated financial knowledge, and the language the session ran in.",
                  "Literasi keuangan yang diukur dengan tiga pertanyaan Big Three, penilaian sendiri atas pengetahuan keuangan, dan bahasa yang dipakai selama sesi.",
                )}
              </p>
            </div>
          </section>

          {/* 5. Mixed methods */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("5. How the two strands fit together", "5. Bagaimana kedua untai menyatu")}
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              {t(
                "This is a convergent design with an embedded qualitative strand. The experiment is the core, and the qualitative material is collected inside the same session rather than in a separate study, so every free-text answer is attached to a decision whose condition and scenario are known.",
                "Ini rancangan konvergen dengan untai kualitatif yang tertanam. Eksperimen adalah intinya, dan bahan kualitatif dikumpulkan di dalam sesi yang sama, bukan dalam studi terpisah, sehingga setiap jawaban teks bebas melekat pada satu keputusan yang kondisi dan skenarionya diketahui.",
              )}
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: { en: "Quantitative core", id: "Inti kuantitatif" },
                  body: {
                    en: "Between participants: explanation condition and advisor. Within participants: six cases, half sound and half flawed. Outcome: appropriate reliance, with trust, understanding, confidence, demand and time alongside it.",
                    id: "Antarpeserta: kondisi penjelasan dan penasihat. Dalam peserta: enam kasus, separuh tepat dan separuh keliru. Hasil: reliance yang tepat, disertai kepercayaan, pemahaman, keyakinan, beban, dan waktu.",
                  },
                },
                {
                  title: { en: "Embedded qualitative", id: "Kualitatif tertanam" },
                  body: {
                    en: "One reason per decision written in the moment, two reflective questions at the end, and the full transcripts of the conversational condition, which record what people ask when they can ask anything.",
                    id: "Satu alasan per keputusan yang ditulis saat itu juga, dua pertanyaan reflektif di akhir, dan transkrip lengkap kondisi percakapan, yang merekam apa yang orang tanyakan ketika mereka bebas bertanya apa saja.",
                  },
                },
                {
                  title: { en: "Integration", id: "Integrasi" },
                  body: {
                    en: "A joint display with one row per condition, reliance numbers beside the themes from that condition's reasons. The interesting findings live where the two disagree, for example a condition that raises trust and self-reported understanding while reliance gets worse.",
                    id: "Sebuah tampilan gabungan dengan satu baris per kondisi, angka reliance bersanding dengan tema dari alasan-alasan pada kondisi itu. Temuan yang menarik berada di tempat keduanya tidak sejalan, misalnya kondisi yang menaikkan kepercayaan dan pemahaman yang dilaporkan sendiri sementara reliance justru memburuk.",
                  },
                },
              ].map((b) => (
                <div key={b.title.en} className="panel p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">{p(b.title)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p(b.body)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Analysis and exclusions */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("6. Analysis plan and what gets excluded", "6. Rencana analisis dan apa yang dikecualikan")}
            </h2>
            <ul className="space-y-3 leading-relaxed text-muted-foreground">
              <li>
                {t(
                  "Appropriate reliance is modelled with mixed-effects logistic regression, condition by scenario, with random intercepts for the participant and for the case, and literacy entered as a moderator.",
                  "Reliance yang tepat dimodelkan dengan regresi logistik efek campuran, kondisi kali skenario, dengan intersep acak untuk peserta dan untuk kasus, serta literasi dimasukkan sebagai moderator.",
                )}
              </li>
              <li>
                {t(
                  "Sessions where the explanation style was assigned at random are the experiment. Sessions where a participant chose their style are a separate stratum, analysed as a preference signal and never pooled with the random one.",
                  "Sesi yang gaya penjelasannya ditetapkan secara acak adalah eksperimennya. Sesi yang gayanya dipilih sendiri oleh peserta adalah strata terpisah, dianalisis sebagai sinyal preferensi dan tidak pernah digabung dengan yang acak.",
                )}
              </li>
              <li>
                {t(
                  "Excluded from the experimental analysis: sessions that fail the attention check, repeat sessions from the same browser, and responses on the advisor pages, which are marked as tryouts because the person chose their own style and wrote their own profile.",
                  "Dikecualikan dari analisis eksperimen: sesi yang gagal pemeriksaan atensi, sesi berulang dari browser yang sama, dan respons pada halaman penasihat, yang ditandai sebagai uji coba karena orangnya memilih gayanya sendiri dan menulis profilnya sendiri.",
                )}
              </li>
              <li>
                {t(
                  "This deployment is a pilot for developing the instrument. It is not powered for confirmatory tests, and pilot data is not for publication before a formal ethics review. The confirmatory plan is to run the content arm first and the delivery arm afterwards at the content level that arm selects.",
                  "Penerapan ini adalah studi pilot untuk mengembangkan instrumen. Kekuatan statistiknya tidak dirancang untuk uji konfirmatori, dan data pilot tidak untuk dipublikasikan sebelum kajian etik formal. Rencana konfirmatorinya adalah menjalankan lengan konten lebih dulu, lalu lengan penyajian pada tingkat konten yang dipilih lengan pertama.",
                )}
              </li>
            </ul>
          </section>

          <section className="cta-panel relative overflow-hidden rounded-[1.75rem] border border-border/70 px-6 py-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("See it from the inside", "Lihat dari dalam")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t(
                "The fastest way to understand the design is to sit in one of its cells for ten minutes.",
                "Cara tercepat memahami rancangan ini adalah menempati salah satu selnya selama sepuluh menit.",
              )}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild className="h-11 rounded-full px-6">
                <Link href="/participate">
                  {t("Take part in the study", "Ikut serta dalam studi")} <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full px-6">
                <Link href="/references">{t("References and tools", "Referensi dan perkakas")}</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
