"use client";

/* Browse all 400 ILS-Bench cases with search and outcome filter. Each row
   shows the expert consensus. "Open in the AI advisor" links to the
   playground so the narrative can be read into the form there. The
   narratives themselves are the dataset and stay in English. */

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { labelValue, outcomeName } from "@/lib/advisor/strings";
import { tr, useLang } from "@/lib/i18n";
import bench from "@/data/ils_bench_cases.json";

interface IlsCase {
  id: string;
  narrative: string;
  tolerance: string;
  capacity: string;
  liquidity: string;
  portfolio: string;
}

const OUTCOMES = ["Capital preservation", "Conservative", "Balanced", "Growth", "Aggressive growth", "Human review"];
const PAGE = 25;

export function CasesBrowser() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const cases = (bench as { cases: IlsCase[] }).cases;
  const [q, setQ] = useState("");
  const [outcome, setOutcome] = useState("all");
  const [shown, setShown] = useState(PAGE);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return cases.filter((c) => {
      if (outcome !== "all" && c.portfolio !== outcome) return false;
      if (!query) return true;
      return c.id.toLowerCase().includes(query) || c.narrative.toLowerCase().includes(query);
    });
  }, [cases, q, outcome]);

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">{t("Browse the cases", "Jelajahi kasusnya")}</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShown(PAGE);
            }}
            placeholder={t("word in the narrative or a case ID", "kata dalam narasi atau ID kasus")}
            className="w-64"
            aria-label={t("Search narratives", "Cari narasi")}
          />
          <Select
            value={outcome}
            onValueChange={(v) => {
              setOutcome(v);
              setShown(PAGE);
            }}
          >
            <SelectTrigger className="w-48" aria-label={t("Filter by outcome", "Saring menurut hasil")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All outcomes", "Semua hasil")}</SelectItem>
              {OUTCOMES.map((o) => (
                <SelectItem key={o} value={o}>
                  {outcomeName(o)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length === cases.length
            ? t(`All ${cases.length} cases.`, `Semua ${cases.length} kasus.`)
            : t(`${filtered.length} of ${cases.length} cases match.`, `${filtered.length} dari ${cases.length} kasus cocok.`)}{" "}
          {t(
            "Each row shows the expert consensus. The narratives are the dataset itself and stay in English.",
            "Setiap baris menunjukkan konsensus ahli. Narasinya adalah dataset itu sendiri dan tetap berbahasa Inggris.",
          )}
        </p>
        <div className="space-y-3">
          {filtered.slice(0, shown).map((c) => (
            <div key={c.id} className={`rounded-xl border p-4 ${c.portfolio === "Human review" ? "bg-amber-50/60" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {c.id}{" "}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {t("tolerance", "toleransi")} {labelValue(c.tolerance)} · {t("capacity", "kapasitas")}{" "}
                    {labelValue(c.capacity)} · {t("liquidity", "likuiditas")} {labelValue(c.liquidity)}
                  </span>
                </p>
                <p className="text-sm font-medium text-primary">{outcomeName(c.portfolio)}</p>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.narrative}</p>
              <Button asChild variant="ghost" size="sm" className="mt-1 -ml-2">
                <Link href="/advisor/ml?researcher=1">{t("Open the AI advisor to try it", "Buka penasihat AI untuk mencobanya")}</Link>
              </Button>
            </div>
          ))}
        </div>
        {shown < filtered.length && (
          <Button variant="outline" onClick={() => setShown((s) => s + PAGE)}>
            {t("Show more", "Tampilkan lebih banyak")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
