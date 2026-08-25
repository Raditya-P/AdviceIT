import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import bench from "@/data/ils_bench_cases.json";
import { classes, logitMeta, logitTemperature, mlMeta, mlTemperature } from "@/lib/advisor/advisors";
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

function count(cases: IlsCase[], field: keyof IlsCase, order: string[]) {
  const counts: Record<string, number> = {};
  for (const c of cases) counts[c[field]] = (counts[c[field]] || 0) + 1;
  return order.filter((k) => k in counts).map((k) => ({ key: k, n: counts[k] }));
}

export default function TrainingDataPage() {
  const cases = (bench as { cases: IlsCase[] }).cases;
  const total = cases.length;
  const hr = cases.filter((c) => c.portfolio === "Human review").length;
  const combos = new Set(cases.map((c) => `${c.tolerance}|${c.capacity}|${c.liquidity}`)).size;
  const authorAgree = cases.filter((c) => c.authorPortfolio === c.portfolio).length;
  const pct = (x: number, d = 1) => `${Math.round(x * 100 * 10 ** d) / 10 ** d} percent`;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight">ILS-Bench: the data behind the advisors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Both advisors are trained on ILS-Bench, published by Marco Bonelli (Ca&apos; Foscari University of
                Venice) on Mendeley Data, DOI{" "}
                <a className="underline underline-offset-4" href="https://doi.org/10.17632/w48mh2dtg5.1" target="_blank" rel="noopener">
                  10.17632/w48mh2dtg5.1
                </a>
                , licence CC BY 4.0: 400 AI-assisted synthetic investor narratives, no real client data, each reviewed
                by a panel of four independent financial-domain experts (a retired portfolio manager, a senior trader, a
                FinTech executive and a FinTech academic). The panel&apos;s consensus labels for risk tolerance, risk
                capacity, liquidity need and the recommended outcome are what the advisors learn from.
              </p>
              <p>
                Citation: Bonelli, M. (2026). ILS-Bench: Investor Language-to-Suitability Benchmark. Mendeley Data, V1.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">The 400 cases in numbers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <strong>{total}</strong> cases, <strong>{hr}</strong> sent to human review ({Math.round((hr / total) * 100)} percent),{" "}
                  <strong>{combos}</strong> distinct label combinations. The dataset author&apos;s own draft label equals the
                  consensus in {pct(authorAgree / total)} of cases.
                </p>
                <Bars title="Recommended outcome (consensus)" items={count(cases, "portfolio", OUTCOME_ORDER)} total={total} />
                <Bars title="Risk tolerance" items={count(cases, "tolerance", ["Low", "Moderate", "High", "Inconsistent"])} total={total} />
                <Bars title="Risk capacity" items={count(cases, "capacity", ["Low", "Moderate", "High"])} total={total} />
                <Bars title="Liquidity need" items={count(cases, "liquidity", ["Low", "Moderate", "High", "Urgent"])} total={total} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">The two advisors, trained by the same script</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Measure</TableHead>
                        <TableHead>AI advisor</TableHead>
                        <TableHead>Interpretable rule-based</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Cross-validated accuracy ({mlMeta.cvFolds}-fold, {mlMeta.cvRepeats} repeats)</TableCell>
                        <TableCell>{pct(mlMeta.cvAccuracy)} (sd {pct(mlMeta.cvAccuracySd)})</TableCell>
                        <TableCell>{pct(logitMeta.cvAccuracy)} (sd {pct(logitMeta.cvAccuracySd)})</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Cross-validated macro-F1</TableCell>
                        <TableCell>{mlMeta.cvMacroF1}</TableCell>
                        <TableCell>{logitMeta.cvMacroF1}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Calibration (temperature scaling)</TableCell>
                        <TableCell>t {mlTemperature}, ECE {mlMeta.eceBefore} to {mlMeta.eceAfter}</TableCell>
                        <TableCell>t {logitTemperature}, ECE {logitMeta.eceBefore} to {logitMeta.eceAfter}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Training accuracy, reproduced in the browser</TableCell>
                        <TableCell>{pct(mlMeta.trainAccuracy)}</TableCell>
                        <TableCell>{pct(logitMeta.trainAccuracy)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Architecture</TableCell>
                        <TableCell>12 inputs, two hidden layers of {mlMeta.hidden}, {classes.length} outputs</TableCell>
                        <TableCell>one linear layer, every weight readable</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Reference points from the same file (context, not advisors): always guessing the most common outcome{" "}
                  {pct(mlMeta.majorityBaselineAccuracy)}, memorising the most common outcome per label combination (a
                  lookup table, not the interpretable advisor: the advisor is a fitted scorecard with readable weights
                  and calibrated probabilities) {pct(mlMeta.lookupBaselineAccuracy)}, the author&apos;s draft labels{" "}
                  {pct(mlMeta.authorAgreementWithConsensus)}. Both advisors are trained by the seeded numpy script in
                  the repository, and the browser inference reproduces the Python training accuracy exactly.
                </p>
                <p className="text-xs text-muted-foreground">
                  The language-reading step (a small in-browser model reading the narratives) was benchmarked separately
                  in three iterations, from 25 to 70 percent outcome agreement with the panel on 100 cases against a 94
                  percent ceiling, with 54 of 59 human-review cases correctly escalated in the final run. The CSVs are
                  in the repository.
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

function Bars({ title, items, total }: { title: string; items: { key: string; n: number }[]; total: number }) {
  const max = items.reduce((m, it) => Math.max(m, it.n), 0);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.map((it) => (
        <div key={it.key} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_5rem] items-center gap-2">
          <span className="truncate">{it.key}</span>
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
