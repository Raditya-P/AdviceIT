"use client";

/* Browse all 400 ILS-Bench cases with search and outcome filter. Each row
   shows the expert consensus. "Open in the AI advisor" links to the
   playground so the narrative can be read into the form there. */

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
        <CardTitle className="text-base">Browse the cases</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShown(PAGE);
            }}
            placeholder="word in the narrative or a case ID"
            className="w-64"
            aria-label="Search narratives"
          />
          <Select
            value={outcome}
            onValueChange={(v) => {
              setOutcome(v);
              setShown(PAGE);
            }}
          >
            <SelectTrigger className="w-48" aria-label="Filter by outcome">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All outcomes</SelectItem>
              {OUTCOMES.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length === cases.length ? `All ${cases.length} cases.` : `${filtered.length} of ${cases.length} cases match.`}{" "}
          Each row shows the expert consensus.
        </p>
        <div className="space-y-3">
          {filtered.slice(0, shown).map((c) => (
            <div key={c.id} className={`rounded-xl border p-4 ${c.portfolio === "Human review" ? "bg-amber-50/60" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {c.id} <span className="ml-2 font-normal text-muted-foreground">tolerance {c.tolerance} · capacity {c.capacity} · liquidity {c.liquidity}</span>
                </p>
                <p className="text-sm font-medium text-primary">{c.portfolio}</p>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.narrative}</p>
              <Button asChild variant="ghost" size="sm" className="mt-1 -ml-2">
                <Link href="/advisor/ml?researcher=1">Open the AI advisor to try it</Link>
              </Button>
            </div>
          ))}
        </div>
        {shown < filtered.length && (
          <Button variant="outline" onClick={() => setShown((s) => s + PAGE)}>
            Show more
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
