"use client";

/* The interpretable rule-based advisor's whole scorecard: what every input
   value is worth, in points, for every outcome. Read straight from the
   fitted weights, nothing typed in by hand. */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { scorecard } from "@/lib/advisor/advisors";
import { inputLabel, labelValue, outcomeName } from "@/lib/advisor/strings";
import { tr, useLang } from "@/lib/i18n";

function rowLabel(label: string, locale: "en" | "id") {
  if (locale === "en") return label;
  if (label === "every profile starts here") return "semua profil mulai dari sini";
  const age = label.match(/^per 10 years older than (\d+)$/);
  if (age) return `per 10 tahun lebih tua dari ${age[1]}`;
  return labelValue(label);
}

function groupLabel(label: string, locale: "en" | "id") {
  if (locale === "en") return label;
  if (label === "Starting points") return "Poin awal";
  return inputLabel(label);
}

export function ScorecardTable() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const sc = scorecard();
  return (
    <Accordion type="single" collapsible className="panel px-5">
      <AccordionItem value="scorecard" className="border-0">
        <AccordionTrigger className="text-sm font-medium">
          {t(
            "The whole scorecard: what every input is worth, in points, for every outcome",
            "Scorecard lengkap: nilai setiap input, dalam poin, untuk setiap hasil",
          )}
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {t(
              "These are the model's fitted weights, shown as they are. For any profile, exactly one row applies from each group. Add the applying rows, the age effect and the starting points in each column: the outcome with the largest total wins, and the totals are turned into the probabilities shown in the app. Points are log-odds, so a difference of about 1 point between two outcomes means roughly 3 to 1 odds.",
              "Inilah bobot hasil pemasangan model, ditampilkan apa adanya. Untuk profil mana pun, tepat satu baris berlaku dari setiap kelompok. Jumlahkan baris yang berlaku, efek usia, dan poin awal di setiap kolom: hasil dengan total terbesar menang, dan total itu diubah menjadi probabilitas yang tampil di aplikasi. Poin adalah log-odds, jadi selisih sekitar 1 poin antara dua hasil berarti peluang kira-kira 3 banding 1.",
            )}
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Input", "Input")}</TableHead>
                  {sc.outcomes.map((o) => (
                    <TableHead key={o} className="text-right text-xs">
                      {outcomeName(o)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sc.groups.flatMap((g) =>
                  g.rows.map((r, i) => (
                    <TableRow key={g.label + r.label}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {i === 0 ? `${groupLabel(g.label, locale)}: ` : ""}
                        {rowLabel(r.label, locale)}
                      </TableCell>
                      {r.points.map((p, j) => (
                        <TableCell
                          key={j}
                          className={`text-right tabular-nums ${p > 0 ? "text-primary" : p < 0 ? "text-destructive" : "text-muted-foreground"}`}
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
