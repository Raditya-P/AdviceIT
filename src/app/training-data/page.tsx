import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import bench from "@/data/ils_bench_cases.json";
import { classes, logitMeta, logitTemperature, mlMeta, mlTemperature } from "@/lib/advisor/advisors";
import { pageLocale } from "@/lib/locale-server";
import { CasesBrowser } from "./cases-browser";

export const metadata = { title: "Training data" };

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
  "Capital preservation": "Preservasi modal",
  Conservative: "Konservatif",
  Balanced: "Seimbang",
  Growth: "Pertumbuhan",
  "Aggressive growth": "Pertumbuhan agresif",
  "Human review": "Tinjauan manusia",
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
  const pct = (x: number, d = 1) => `${Math.round(x * 100 * 10 ** d) / 10 ** d} ${t("percent", "persen")}`;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight">
                {t("ILS-Bench: the data behind the advisors", "ILS-Bench: data di balik para penasihat")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                {t(
                  "Both advisors are trained on ILS-Bench, published by Marco Bonelli (Ca' Foscari University of Venice) on Mendeley Data, DOI",
                  "Kedua penasihat dilatih pada ILS-Bench, diterbitkan oleh Marco Bonelli (Ca' Foscari University of Venice) di Mendeley Data, DOI",
                )}{" "}
                <a className="underline underline-offset-4" href="https://doi.org/10.17632/w48mh2dtg5.1" target="_blank" rel="noopener">
                  10.17632/w48mh2dtg5.1
                </a>
                {t(
                  ", licence CC BY 4.0: 400 AI-assisted synthetic investor narratives, no real client data, each reviewed by a panel of four independent financial-domain experts (a retired portfolio manager, a senior trader, a FinTech executive and a FinTech academic). The panel's consensus labels for risk tolerance, risk capacity, liquidity need and the recommended outcome are what the advisors learn from.",
                  ", lisensi CC BY 4.0: 400 narasi investor sintetis berbantuan AI, tanpa data klien sungguhan, masing-masing ditinjau panel empat ahli keuangan independen (manajer portofolio purnatugas, trader senior, eksekutif FinTech, dan akademisi FinTech). Label konsensus panel untuk toleransi risiko, kapasitas risiko, kebutuhan likuiditas, dan hasil yang direkomendasikan itulah yang dipelajari para penasihat.",
                )}
              </p>
              <p>
                {t("Citation", "Sitasi")}: Bonelli, M. (2026). ILS-Bench: Investor Language-to-Suitability Benchmark.
                Mendeley Data, V1.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("The 400 cases in numbers", "400 kasus dalam angka")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  {locale === "id" ? (
                    <>
                      <strong>{total}</strong> kasus, <strong>{hr}</strong> dikirim ke tinjauan manusia (
                      {Math.round((hr / total) * 100)} persen), <strong>{combos}</strong> kombinasi label berbeda. Label
                      draf penulis dataset sama dengan konsensus pada {pct(authorAgree / total)} kasus.
                    </>
                  ) : (
                    <>
                      <strong>{total}</strong> cases, <strong>{hr}</strong> sent to human review (
                      {Math.round((hr / total) * 100)} percent), <strong>{combos}</strong> distinct label combinations.
                      The dataset author&apos;s own draft label equals the consensus in {pct(authorAgree / total)} of
                      cases.
                    </>
                  )}
                </p>
                <Bars title={t("Recommended outcome (consensus)", "Hasil yang direkomendasikan (konsensus)")} items={count(cases, "portfolio", OUTCOME_ORDER)} total={total} keyLabel={keyLabel} />
                <Bars title={t("Risk tolerance", "Toleransi risiko")} items={count(cases, "tolerance", ["Low", "Moderate", "High", "Inconsistent"])} total={total} keyLabel={keyLabel} />
                <Bars title={t("Risk capacity", "Kapasitas risiko")} items={count(cases, "capacity", ["Low", "Moderate", "High"])} total={total} keyLabel={keyLabel} />
                <Bars title={t("Liquidity need", "Kebutuhan likuiditas")} items={count(cases, "liquidity", ["Low", "Moderate", "High", "Urgent"])} total={total} keyLabel={keyLabel} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("The two advisors, trained by the same script", "Dua penasihat, dilatih oleh skrip yang sama")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Measure", "Ukuran")}</TableHead>
                        <TableHead>{t("AI advisor", "Penasihat AI")}</TableHead>
                        <TableHead>{t("Interpretable rule-based", "Interpretable berbasis aturan")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          {t(
                            `Cross-validated accuracy (${mlMeta.cvFolds}-fold, ${mlMeta.cvRepeats} repeats)`,
                            `Akurasi validasi silang (${mlMeta.cvFolds}-fold, ${mlMeta.cvRepeats} ulangan)`,
                          )}
                        </TableCell>
                        <TableCell>{pct(mlMeta.cvAccuracy)} (sd {pct(mlMeta.cvAccuracySd)})</TableCell>
                        <TableCell>{pct(logitMeta.cvAccuracy)} (sd {pct(logitMeta.cvAccuracySd)})</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">{t("Cross-validated macro-F1", "Macro-F1 validasi silang")}</TableCell>
                        <TableCell>{mlMeta.cvMacroF1}</TableCell>
                        <TableCell>{logitMeta.cvMacroF1}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">{t("Calibration (temperature scaling)", "Kalibrasi (temperature scaling)")}</TableCell>
                        <TableCell>t {mlTemperature}, ECE {mlMeta.eceBefore} {t("to", "menjadi")} {mlMeta.eceAfter}</TableCell>
                        <TableCell>t {logitTemperature}, ECE {logitMeta.eceBefore} {t("to", "menjadi")} {logitMeta.eceAfter}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          {t("Training accuracy, reproduced in the browser", "Akurasi pelatihan, direproduksi di browser")}
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
                        <TableCell>{t("one linear layer, every weight readable", "satu lapisan linear, semua bobot terbaca")}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(
                    `Reference points from the same file (context, not advisors): always guessing the most common outcome ${pct(mlMeta.majorityBaselineAccuracy)}, memorising the most common outcome per label combination (a lookup table, not the interpretable advisor: the advisor is a fitted scorecard with readable weights and calibrated probabilities) ${pct(mlMeta.lookupBaselineAccuracy)}, the author's draft labels ${pct(mlMeta.authorAgreementWithConsensus)}. Both advisors are trained by the seeded numpy script in the repository, and the browser inference reproduces the Python training accuracy exactly.`,
                    `Titik acuan dari berkas yang sama (konteks, bukan penasihat): selalu menebak hasil paling umum ${pct(mlMeta.majorityBaselineAccuracy)}, menghafal hasil paling umum per kombinasi label (tabel lookup, bukan penasihat interpretable: penasihatnya adalah scorecard hasil pemasangan dengan bobot terbaca dan probabilitas terkalibrasi) ${pct(mlMeta.lookupBaselineAccuracy)}, label draf penulis ${pct(mlMeta.authorAgreementWithConsensus)}. Kedua penasihat dilatih oleh skrip numpy ber-seed di repositori, dan inferensi browser mereproduksi akurasi pelatihan Python secara eksak.`,
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "The language-reading step (a small in-browser model reading the narratives) was benchmarked separately in three iterations, from 25 to 70 percent outcome agreement with the panel on 100 cases against a 94 percent ceiling, with 54 of 59 human-review cases correctly escalated in the final run. The CSVs are in the repository.",
                    "Langkah pembacaan bahasa (model kecil dalam browser yang membaca narasi) diukur terpisah dalam tiga iterasi, dari 25 menjadi 70 persen kesesuaian hasil dengan panel pada 100 kasus terhadap plafon 94 persen, dengan 54 dari 59 kasus tinjauan manusia dieskalasi dengan benar pada putaran terakhir. Berkas CSV-nya ada di repositori.",
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          <CasesBrowser />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Bars({
  title,
  items,
  total,
  keyLabel,
}: {
  title: string;
  items: { key: string; n: number }[];
  total: number;
  keyLabel: (k: string) => string;
}) {
  const max = items.reduce((m, it) => Math.max(m, it.n), 0);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.map((it) => (
        <div key={it.key} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_5rem] items-center gap-2">
          <span className="truncate">{keyLabel(it.key)}</span>
          <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${max ? (it.n / max) * 100 : 0}%` }} />
          </span>
          <span className="text-right tabular-nums text-muted-foreground">
            {it.n} ({Math.round((it.n / total) * 1000) / 10}%)
          </span>
        </div>
      ))}
    </div>
  );
}
