import { SiteFooter } from "@/components/site-footer";
import { CountUp, Reveal } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { SiteHeader } from "@/components/site-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import bench from "@/data/ils_bench_cases.json";
import type { CSSProperties } from "react";
import { classes, logitMeta, logitTemperature, mlMeta, mlTemperature } from "@/lib/advisor/advisors";
import { localTitle, pageLocale } from "@/lib/locale-server";
import { CasesBrowser } from "./cases-browser";

export async function generateMetadata() {
  return {
    title: await localTitle("Training data", "Data pelatihan"),
    description: "ILS-Bench, the 400 expert-validated investor cases both advisors learned from, with live statistics, the cross-validated results and every case to browse.",
  };
}

interface IlsCase {
  id: string;
  narrative: string;
  tolerance: string;
  capacity: string;
  liquidity: string;
  suitabilityRisk: string;
  portfolio: string;
  authorPortfolio: string;
  reviewFlag: string;
}

const OUTCOME_ORDER = ["Capital preservation", "Conservative", "Balanced", "Growth", "Aggressive growth", "Human review"];

const KEY_ID: Record<string, string> = {
  "Capital preservation": "Perlindungan modal",
  Conservative: "Konservatif",
  Balanced: "Seimbang",
  Growth: "Pertumbuhan",
  "Aggressive growth": "Pertumbuhan agresif",
  "Human review": "Tinjauan penasihat manusia",
  Low: "Rendah",
  Moderate: "Sedang",
  High: "Tinggi",
  Inconsistent: "Tidak konsisten",
  Urgent: "Mendesak",
};

function count(cases: IlsCase[], field: keyof IlsCase, order: string[]) {
  const counts: Record<string, number> = {};
  for (const c of cases) counts[c[field]] = (counts[c[field]] || 0) + 1;
  return order.filter((k) => k in counts).map((k) => ({ key: k, n: counts[k] }));
}

export default async function TrainingDataPage() {
  const locale = await pageLocale();
  const t = (en: string, id: string) => (locale === "id" ? id : en);
  const keyLabel = (k: string) => (locale === "id" ? (KEY_ID[k] ?? k) : k);
  const cases = (bench as { cases: IlsCase[] }).cases;
  const total = cases.length;
  const hr = cases.filter((c) => c.portfolio === "Human review").length;
  const combos = new Set(cases.map((c) => `${c.tolerance}|${c.capacity}|${c.liquidity}`)).size;
  const authorAgree = cases.filter((c) => c.authorPortfolio === c.portfolio).length;
  const cvMeta = mlMeta as unknown as { confusion: number[][]; perClassRecall: Record<string, number> };
  const confusion = cvMeta.confusion ?? [];
  const recall = cvMeta.perClassRecall ?? {};
  /* Indonesian writes decimals with a comma. */
  const dec = (n: number | string) => (locale === "id" ? String(n).replace(".", ",") : String(n));
  const pct = (x: number, d = 1) => `${dec(Math.round(x * 100 * 10 ** d) / 10 ** d)} ${t("percent", "persen")}`;

  return (
    <>
      <SiteHeader />
      <PageTransition>
      <main className="flex-1">
        <PageHero
          eyebrow={t("Training data", "Data pelatihan")}
          title={t("ILS-Bench: the data behind the advisors", "ILS-Bench: data di balik para penasihat")}
          width="max-w-6xl"
        >
          <div className="mt-5 max-w-3xl space-y-3 text-muted-foreground">
              <p>
                {t(
                  "Both advisors are trained on ILS-Bench, published by Marco Bonelli (Ca' Foscari University of Venice) on Mendeley Data, DOI",
                  "Kedua penasihat dilatih dengan ILS-Bench, yang diterbitkan oleh Marco Bonelli (Ca' Foscari University of Venice) di Mendeley Data, DOI",
                )}{" "}
                <a className="underline underline-offset-4" href="https://doi.org/10.17632/w48mh2dtg5.1" target="_blank" rel="noopener">
                  10.17632/w48mh2dtg5.1
                </a>
                {t(
                  ", licence CC BY 4.0: 400 AI-assisted synthetic investor narratives, no real client data, each reviewed by a panel of four independent financial-domain experts (a retired portfolio manager, a senior trader, a FinTech executive and a FinTech academic). The panel's consensus labels for risk tolerance, risk capacity, liquidity need and the recommended outcome are what the advisors learn from.",
                  ", lisensi CC BY 4.0: 400 narasi investor rekaan yang dibuat dengan bantuan AI, tanpa data klien sungguhan. Setiap narasi ditinjau oleh empat ahli keuangan independen (mantan manajer portofolio, trader senior, eksekutif FinTech, dan akademisi FinTech). Para penasihat belajar dari label kesepakatan para ahli ini untuk toleransi risiko, kemampuan menanggung risiko, kebutuhan dana cepat, dan hasil yang direkomendasikan.",
                )}
              </p>
              <p>
                {t("Citation", "Sitasi")}: Bonelli, M. (2026). ILS-Bench: Investor Language-to-Suitability Benchmark.
                Mendeley Data, V1.
              </p>
          </div>
        </PageHero>

        <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">{t("The 400 cases in numbers", "400 kasus dalam angka")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  {locale === "id" ? (
                    <>
                      <strong><CountUp value={total} locale="id" /></strong> kasus, <strong><CountUp value={hr} locale="id" /></strong> diteruskan ke penasihat manusia (
                      <CountUp value={Math.round((hr / total) * 100)} locale="id" /> persen), <strong><CountUp value={combos} locale="id" /></strong> kombinasi label berbeda. Label
                      awal dari penulis dataset sama dengan kesepakatan ahli pada {pct(authorAgree / total)} kasus.
                    </>
                  ) : (
                    <>
                      <strong><CountUp value={total} /></strong> cases, <strong><CountUp value={hr} /></strong> sent to human review (
                      <CountUp value={Math.round((hr / total) * 100)} /> percent), <strong><CountUp value={combos} /></strong> distinct label combinations.
                      The dataset author&apos;s own draft label equals the consensus in {pct(authorAgree / total)} of
                      cases.
                    </>
                  )}
                </p>
                <Bars title={t("Recommended outcome (consensus)", "Hasil yang direkomendasikan (kesepakatan ahli)")} items={count(cases, "portfolio", OUTCOME_ORDER)} total={total} keyLabel={keyLabel} dec={dec} />
                <Bars title={t("Risk tolerance", "Toleransi risiko")} items={count(cases, "tolerance", ["Low", "Moderate", "High", "Inconsistent"])} total={total} keyLabel={keyLabel} dec={dec} />
                <Bars title={t("Risk capacity", "Kemampuan menanggung risiko")} items={count(cases, "capacity", ["Low", "Moderate", "High"])} total={total} keyLabel={keyLabel} dec={dec} />
                <Bars title={t("Liquidity need", "Kebutuhan dana cepat")} items={count(cases, "liquidity", ["Low", "Moderate", "High", "Urgent"])} total={total} keyLabel={keyLabel} dec={dec} />
              </CardContent>
            </Card>
            </Reveal>

            <Reveal delay={120}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("The two advisors, trained by the same script", "Dua penasihat, dilatih dengan skrip yang sama")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  {locale === "id"
                    ? `Penasihat AI: akurasi validasi silang ${pct(mlMeta.cvAccuracy)} pada ${total} kasus rekaan yang sudah ditinjau ahli. Penasihat transparan: ${pct(logitMeta.cvAccuracy)} pada kasus yang sama. Ini adalah angka uji pada satu dataset kecil, bukan akurasi di dunia nyata.`
                    : `AI advisor: ${pct(mlMeta.cvAccuracy)} cross-validated accuracy on ${total} expert-reviewed synthetic cases. Interpretable advisor: ${pct(logitMeta.cvAccuracy)} on the same cases. These are benchmark figures on one small dataset, not real-world accuracy.`}
                </p>
                <details className="rounded-xl border border-border/70 px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium text-primary">
                  {t("Full results table", "Tabel hasil lengkap")}
                </summary>
                <div className="mt-2 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Measure", "Ukuran")}</TableHead>
                        <TableHead>{t("AI advisor", "Penasihat AI")}</TableHead>
                        <TableHead>{t("Interpretable rule-based", "Transparan berbasis aturan")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          {t(
                            `Cross-validated accuracy (${mlMeta.cvFolds}-fold, ${mlMeta.cvRepeats} repeats)`,
                            `Akurasi validasi silang (${mlMeta.cvFolds}-fold, ${mlMeta.cvRepeats} kali pengulangan)`,
                          )}
                        </TableCell>
                        <TableCell>{pct(mlMeta.cvAccuracy)} (sd {pct(mlMeta.cvAccuracySd)})</TableCell>
                        <TableCell>{pct(logitMeta.cvAccuracy)} (sd {pct(logitMeta.cvAccuracySd)})</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">{t("Cross-validated macro-F1", "Macro-F1 validasi silang")}</TableCell>
                        <TableCell>{dec(mlMeta.cvMacroF1)}</TableCell>
                        <TableCell>{dec(logitMeta.cvMacroF1)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">{t("Calibration (temperature scaling)", "Kalibrasi (temperature scaling)")}</TableCell>
                        <TableCell>t {dec(mlTemperature)}, ECE {dec(mlMeta.eceBefore)} {t("to", "menjadi")} {dec(mlMeta.eceAfter)}</TableCell>
                        <TableCell>t {dec(logitTemperature)}, ECE {dec(logitMeta.eceBefore)} {t("to", "menjadi")} {dec(logitMeta.eceAfter)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          {t(
                            "Model training accuracy (on the cases it was trained on, so higher than cross-validation)",
                            "Akurasi pelatihan model (diukur pada kasus yang dipakai untuk melatihnya, jadi lebih tinggi daripada validasi silang)",
                          )}
                        </TableCell>
                        <TableCell>{pct(mlMeta.trainAccuracy)}</TableCell>
                        <TableCell>{pct(logitMeta.trainAccuracy)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">{t("Architecture", "Arsitektur")}</TableCell>
                        <TableCell>
                          {t(
                            `12 inputs, two hidden layers of ${mlMeta.hidden}, ${classes.length} outputs`,
                            `12 input, dua lapisan tersembunyi berukuran ${mlMeta.hidden}, ${classes.length} output`,
                          )}
                        </TableCell>
                        <TableCell>{t("one linear layer, every weight readable", "satu lapisan linear, semua bobotnya bisa dibaca")}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("AI advisor, cross-validated confusion matrix", "Penasihat AI: matriks kebingungan (confusion matrix) dari validasi silang")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "Rows are the expert consensus, columns are what the advisor answered on held-out cases. The diagonal is agreement.",
                      "Baris menunjukkan kesepakatan ahli, kolom menunjukkan jawaban penasihat pada kasus yang tidak dipakai saat pelatihan. Diagonalnya adalah jawaban yang sama.",
                    )}
                  </p>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">{t("Experts \\ advisor", "Ahli \\ penasihat")}</TableHead>
                          {classes.map((c) => (
                            <TableHead key={c} className="text-right text-xs">
                              {keyLabel(c)}
                            </TableHead>
                          ))}
                          <TableHead className="text-right text-xs">{t("Recall", "Recall")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {confusion.map((row, i) => (
                          <TableRow key={classes[i]}>
                            <TableCell className="whitespace-nowrap text-xs font-medium">{keyLabel(classes[i])}</TableCell>
                            {row.map((v, j) => (
                              <TableCell
                                key={j}
                                className={`text-right tabular-nums text-xs ${i === j ? "font-semibold text-primary" : v === 0 ? "text-muted-foreground/50" : ""}`}
                              >
                                {v}
                              </TableCell>
                            ))}
                            <TableCell className="text-right tabular-nums text-xs">{pct(recall[classes[i]] ?? 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                </details>
                <p className="text-xs text-muted-foreground">
                  {t(
                    `Reference points from the same file (context, not advisors): always guessing the most common outcome ${pct(mlMeta.majorityBaselineAccuracy)}, memorising the most common outcome per label combination (a lookup table, not the interpretable advisor: the advisor is a fitted scorecard with readable weights and calibrated probabilities) ${pct(mlMeta.lookupBaselineAccuracy)}, the author's draft labels ${pct(mlMeta.authorAgreementWithConsensus)}. Both advisors are trained by the seeded numpy script in the repository, and the browser inference reproduces the Python training accuracy exactly.`,
                    `Sebagai pembanding dari berkas yang sama (hanya konteks, bukan penasihat): selalu menebak hasil yang paling umum ${pct(mlMeta.majorityBaselineAccuracy)}, menghafal hasil paling umum untuk setiap kombinasi label (tabel pencarian, bukan penasihat transparan: penasihat itu adalah scorecard terlatih dengan bobot yang bisa dibaca dan probabilitas terkalibrasi) ${pct(mlMeta.lookupBaselineAccuracy)}, label awal dari penulis dataset ${pct(mlMeta.authorAgreementWithConsensus)}. Kedua penasihat dilatih dengan skrip numpy ber-seed di repositori, dan hasil di browser sama persis dengan akurasi pelatihan di Python.`,
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "The language-reading step (a small in-browser model reading the narratives) was benchmarked separately in three iterations, from 25 to 70 percent outcome agreement with the panel on 100 cases against a 94 percent ceiling, with 54 of 59 human-review cases correctly escalated in the final run. The CSVs are in the repository.",
                    "Tahap membaca teks (model kecil di browser yang membaca narasi) diuji terpisah dalam tiga putaran. Kecocokan hasilnya dengan panel ahli pada 100 kasus naik dari 25 menjadi 70 persen, dengan batas atas 94 persen, dan pada putaran terakhir 54 dari 59 kasus yang perlu ditinjau manusia berhasil diteruskan dengan benar. Berkas CSV-nya ada di repositori.",
                  )}
                </p>
              </CardContent>
            </Card>
            </Reveal>
          </div>

          <details className="group rounded-[1.5rem] border border-border/70 bg-muted/30 p-5 sm:p-6">
            <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-2">
              <span className="text-lg font-semibold tracking-tight">
                {t("Browse all 400 cases", "Lihat seluruh 400 kasus")}
              </span>
              <span className="text-sm text-primary group-open:hidden">{t("Open the browser", "Buka daftar kasus")}</span>
            </summary>
            <div className="mt-4">
              <CasesBrowser />
            </div>
          </details>
        </div>
      </main>
      <SiteFooter />
      </PageTransition>
    </>
  );
}

function Bars({
  title,
  items,
  total,
  keyLabel,
  dec,
}: {
  title: string;
  items: { key: string; n: number }[];
  total: number;
  keyLabel: (k: string) => string;
  dec: (n: number) => string;
}) {
  const max = items.reduce((m, it) => Math.max(m, it.n), 0);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.map((it, i) => (
        <div key={it.key} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_6.5rem] items-center gap-2">
          <span className="truncate">{keyLabel(it.key)}</span>
          <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-muted">
            <span
              className="reveal-grow block h-full rounded-full bg-primary"
              style={{ width: `${max ? (it.n / max) * 100 : 0}%`, "--grow-delay": `${260 + i * 70}ms` } as CSSProperties}
            />
          </span>
          <span className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
            {it.n} ({dec(Math.round((it.n / total) * 1000) / 10)}%)
          </span>
        </div>
      ))}
    </div>
  );
}
