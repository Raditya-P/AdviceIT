"use client";

/* Plain-language background on the recommended outcome: what the mix is
   trying to do, and what each asset class in it actually is. Shown on the
   advisor pages only. The study trials leave it out, so that the explanation
   condition stays the only thing that varies between participants. */

import { ASSET_COLOR } from "@/components/allocation-bar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { assetNotes, outcomeGuide } from "@/lib/advisor/guide";
import type { AdvisorResult } from "@/lib/advisor/types";
import { tr, useLang } from "@/lib/i18n";

export function OutcomeGuide({ result }: { result: AdvisorResult }) {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const guide = outcomeGuide(result.portfolio.id, locale);
  const alloc = result.portfolio.allocation;
  const notes = assetNotes(locale).filter((n) => !alloc || alloc[n.key] > 0);

  return (
    <section className="panel overflow-hidden">
      <div className="space-y-2 border-b border-border/70 p-6">
        <h3 className="text-lg font-semibold tracking-tight">
          {t("What this recommendation means", "Apa arti rekomendasi ini")}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{guide.goal}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{guide.expect}</p>
      </div>

      {alloc && (
        <div className="p-2">
          <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("The building blocks", "Blok penyusunnya")}
          </p>
          <Accordion type="single" collapsible className="w-full">
            {notes.map((n) => (
              <AccordionItem key={n.key} value={n.key} className="border-border/70 px-4">
                <AccordionTrigger className="py-3.5 hover:no-underline">
                  <span className="flex flex-1 items-center gap-3 text-left">
                    <span
                      aria-hidden
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: ASSET_COLOR[n.key] }}
                    />
                    <span className="font-medium">{n.name}</span>
                    <span className="ml-auto mr-2 tabular-nums text-sm text-muted-foreground">{alloc[n.key]}%</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-4 text-sm leading-relaxed text-muted-foreground">
                  <p>{n.what}</p>
                  <p>
                    <span className="font-medium text-foreground">{t("For example", "Sebagai contoh")}: </span>
                    {n.examples}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t("Its job in the mix", "Perannya dalam campuran")}: </span>
                    {n.role}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      <p className="border-t border-border/70 bg-muted/40 px-6 py-4 text-xs leading-relaxed text-muted-foreground">
        {t(
          "These model portfolios are stylised teaching examples for the research, not products and not financial advice. Percentages are the allocation the advisor recommends, not a prediction of any return.",
          "Portofolio model ini adalah contoh ilustratif untuk penelitian, bukan produk dan bukan saran keuangan. Persentasenya adalah alokasi yang direkomendasikan penasihat, bukan ramalan imbal hasil apa pun.",
        )}
      </p>
    </section>
  );
}
