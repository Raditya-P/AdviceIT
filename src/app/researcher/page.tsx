"use client";

/* The researcher dashboard. The access key gates the data API, never the
   public pages. Analytics are descriptive only, computed in the browser
   from the fetched rows. */

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { SiteHeader } from "@/components/site-header";
import {
  CONDITION_LABELS,
  exits,
  fmt,
  mean,
  measuresTable,
  overview,
  quality,
  relianceTable,
  toCSV,
  toQualitativeCSV,
  trials,
  type Row,
} from "@/lib/analytics";

export default function ResearcherPage() {
  const [key, setKey] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchRows = async () => {
    setBusy(true);
    setStatus("Fetching");
    try {
      const res = await fetch(`/api/responses?key=${encodeURIComponent(key)}`);
      if (res.status === 401) {
        setStatus("Wrong key.");
        setRows(null);
        return;
      }
      if (res.status === 503) {
        setStatus("The database is not configured on this deployment (DATABASE_URL missing).");
        setRows(null);
        return;
      }
      const data = await res.json();
      setRows(data.rows || []);
      setStatus(`${data.count} rows fetched.`);
    } catch {
      setStatus("Could not reach the API.");
    } finally {
      setBusy(false);
    }
  };

  const download = (name: string, text: string) => {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadCSV = () => {
    if (!rows) return;
    download("adviceit-responses.csv", toCSV(rows));
  };

  /* One utterance per row, for thematic coding. */
  const downloadQualitative = () => {
    if (!rows) return;
    download("adviceit-qualitative.csv", toQualitativeCSV(rows));
  };

  const ov = rows ? overview(rows) : null;
  const rel = rows ? relianceTable(rows) : [];
  const meas = rows ? measuresTable(rows) : [];
  const qual = rows ? quality(rows) : null;
  const exitRows = rows ? exits(rows) : [];
  /* Visitor tryouts from the advisor pages. Self-chosen condition and
     self-written profile, so they are a convenience sample, reported apart
     from the experiment and excluded from every table above. */
  const exploreRows = rows ? rows.filter((r) => r.rowType === "explore") : [];
  const exploreVisitors = new Set(exploreRows.map((r) => r.participantId)).size;
  const exploreByCondition = Object.entries(
    exploreRows.reduce<Record<string, number>>((acc, r) => {
      const k = String(r.condition ?? "unknown");
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([key, n]) => ({ key: CONDITION_LABELS[key] ?? key, n }));
  const exploreTrust = mean(exploreRows.map((r) => Number(r.trustRating)).filter((n) => !isNaN(n)));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHero eyebrow="Internal" title="Researcher mode" width="max-w-6xl">
          <div className="mt-4 max-w-3xl text-muted-foreground">
            <p>
              The collected responses, summarised descriptively. The access key protects the data, not the instrument:
              the advisor pages with researcher controls are open at{" "}
              <Link className="underline underline-offset-4" href="/advisor/ml?researcher=1">
                /advisor/ml?researcher=1
              </Link>{" "}
              and{" "}
              <Link className="underline underline-offset-4" href="/advisor/logit?researcher=1">
                /advisor/logit?researcher=1
              </Link>
              , where the scenario toggle, the suitability labels, the advisor comparison and the ILS-Bench case loader
              live. Custom study links: /study?cond=&lt;preset&gt;&amp;pid=P07, or /study?content=feature,confidence&amp;form=interactive.
            </p>
          </div>
        </PageHero>

        <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 pt-6">
              <div className="space-y-1.5">
                <Label htmlFor="key">Researcher key</Label>
                <Input id="key" type="password" value={key} onChange={(e) => setKey(e.target.value)} className="w-64" />
              </div>
              <Button onClick={fetchRows} disabled={busy || !key}>
                Fetch responses
              </Button>
              {rows && (
                <>
                  <Button variant="outline" onClick={downloadCSV}>
                    Download CSV
                  </Button>
                  <Button variant="outline" onClick={downloadQualitative}>
                    Download free text for coding
                  </Button>
                </>
              )}
              {status && <p className="text-sm text-muted-foreground">{status}</p>}
            </CardContent>
          </Card>

          {ov && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>{ov.total}</strong> trial responses from <strong>{ov.participants}</strong> participant IDs, plus{" "}
                  {exitRows.length} exit questionnaires.
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  <BarList title="Per condition" items={ov.byCondition} />
                  <div className="space-y-4">
                    <BarList title="Per advisor" items={ov.byAdvisor} />
                    <BarList title="Assignment" items={ov.byAssigned} />
                    <BarList title="Scenario" items={ov.byScenario} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {exploreRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visitor tryouts, outside the experiment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>{exploreRows.length}</strong> responses from <strong>{exploreVisitors}</strong> browsers on the
                  advisor pages. These people chose their own explanation style and wrote their own profile, so they are a
                  convenience sample: useful as a preference and usability signal, not as experimental data. They are
                  excluded from every table above and are marked <code>rowType=explore</code> in the CSV.
                </p>
                {exploreTrust !== null && <p>Mean trust rating across tryouts: {fmt(exploreTrust, 2)} of 7.</p>}
                <BarList title="Per chosen style" items={exploreByCondition} />
              </CardContent>
            </Card>
          )}

          {rel.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appropriate reliance by condition</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {["Condition", "n", "sound n", "follow on sound", "flawed n", "override on flawed", "appropriate", "over-reliance", "under-reliance", "asked a human"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rel.map((r) => (
                      <TableRow key={r.condition}>
                        <TableCell className="font-medium">{r.condition}</TableCell>
                        <TableCell>{r.n}</TableCell>
                        <TableCell>{r.soundN}</TableCell>
                        <TableCell>{r.followSound}</TableCell>
                        <TableCell>{r.flawedN}</TableCell>
                        <TableCell>{r.overrideFlawed}</TableCell>
                        <TableCell>{r.appropriate}</TableCell>
                        <TableCell>{r.overReliance}</TableCell>
                        <TableCell>{r.underReliance}</TableCell>
                        <TableCell>{r.askedHuman}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {meas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trust, time and secondary measures</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {["Condition, scenario", "n", "trust", "time (s, median)", "understanding", "decision confidence", "mental demand"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meas.map((r) => (
                      <TableRow key={r.label}>
                        <TableCell className="font-medium">{r.label}</TableCell>
                        <TableCell>{r.n}</TableCell>
                        <TableCell>{r.trust}</TableCell>
                        <TableCell>{r.timeS}</TableCell>
                        <TableCell>{r.understanding}</TableCell>
                        <TableCell>{r.confidence}</TableCell>
                        <TableCell>{r.demand}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {qual && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data quality and the literacy moderator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  Attention checks: {qual.attentionPassed} passed of {qual.attentionTotal}. Responses under 2 seconds:{" "}
                  {qual.under2s}.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {["Literacy level", "n", "appropriate reliance", "trust"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qual.byLevel.map((r) => (
                      <TableRow key={r.level}>
                        <TableCell className="font-medium">{r.level}</TableCell>
                        <TableCell>{r.n}</TableCell>
                        <TableCell>{r.appropriate}</TableCell>
                        <TableCell>{r.trust}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {rows && exitRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Exit answers (qualitative strand)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {exitRows.slice(0, 50).map((r, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      {String(r.participantId)} · {String(r.condition)} · {String(r.advisorModel)}
                    </p>
                    {Boolean(r.exitDistrustMoment) && <p>Distrust moment: {String(r.exitDistrustMoment)}</p>}
                    {Boolean(r.exitMissingExplanation) && <p>Missing explanation: {String(r.exitMissingExplanation)}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {rows && trials(rows).length === 0 && <p className="text-muted-foreground">No trial rows yet.</p>}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function BarList({ title, items }: { title: string; items: { key: string; n: number }[] }) {
  const max = items.reduce((m, it) => Math.max(m, it.n), 0);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.map((it) => (
        <div key={it.key} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_2.5rem] items-center gap-2 text-sm">
          <span className="truncate">{it.key}</span>
          <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${max ? (it.n / max) * 100 : 0}%` }} />
          </span>
          <span className="text-right tabular-nums text-muted-foreground">{it.n}</span>
        </div>
      ))}
    </div>
  );
}
