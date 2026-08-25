"use client";

/* The interpretable rule-based advisor's whole scorecard: what every input
   value is worth, in points, for every outcome. Read straight from the
   fitted weights, nothing typed in by hand. */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { scorecard } from "@/lib/advisor/advisors";

export function ScorecardTable() {
  const sc = scorecard();
  return (
    <Accordion type="single" collapsible className="rounded-xl border px-4">
      <AccordionItem value="scorecard" className="border-0">
        <AccordionTrigger className="text-sm font-medium">
          The whole scorecard: what every input is worth, in points, for every outcome
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            These are the model&apos;s fitted weights, shown as they are. For any profile, exactly one row applies from
            each group. Add the applying rows, the age effect and the starting points in each column: the outcome with
            the largest total wins, and the totals are turned into the probabilities shown in the app. Points are
            log-odds, so a difference of about 1 point between two outcomes means roughly 3 to 1 odds.
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Input</TableHead>
                  {sc.outcomes.map((o) => (
                    <TableHead key={o} className="text-right text-xs">
                      {o}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sc.groups.flatMap((g) =>
                  g.rows.map((r, i) => (
                    <TableRow key={g.label + r.label}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {i === 0 ? `${g.label}: ` : ""}
                        {r.label}
                      </TableCell>
                      {r.points.map((p, j) => (
                        <TableCell
                          key={j}
                          className={`text-right tabular-nums ${p > 0 ? "text-emerald-700" : p < 0 ? "text-red-700" : "text-muted-foreground"}`}
                        >
                          {p > 0 ? `+${p}` : p}
                        </TableCell>
                      ))}
                    </TableRow>
                  )),
                )}
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
