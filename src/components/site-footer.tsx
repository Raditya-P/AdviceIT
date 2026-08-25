"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { tr, useLang } from "@/lib/i18n";
import { VERSION } from "@/lib/version";

export function SiteFooter() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const COLUMNS = [
    {
      title: t("Try the advisors", "Coba penasihatnya"),
      links: [
        { href: "/advisor/ml", label: t("AI advisor", "Penasihat AI") },
        { href: "/advisor/logit", label: t("Interpretable advisor", "Penasihat interpretable") },
        { href: "/training-data", label: t("Training data", "Data pelatihan") },
      ],
    },
    {
      title: t("The research", "Penelitiannya"),
      links: [
        { href: "/participate", label: t("Take part", "Ikut serta") },
        { href: "/references", label: t("References", "Referensi") },
        { href: "/privacy", label: t("Privacy and consent", "Privasi dan persetujuan") },
      ],
    },
  ];
  return (
    <footer className="mt-auto border-t border-border/70 bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]">
          <div className="space-y-3">
            <p className="text-base font-semibold tracking-tight">AdviceIT by Radit</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {t(
                "A research instrument for explainable AI in financial advice. Nothing here is real financial advice.",
                "Instrumen penelitian untuk AI yang dapat dijelaskan dalam saran keuangan. Tidak ada saran keuangan sungguhan di sini.",
              )}
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{col.title}</p>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("For researchers", "Untuk peneliti")}
            </p>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/researcher">{t("Researcher mode", "Mode peneliti")}</Link>
            </Button>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border/70 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Raditya Pratama · {t("MIT licence", "Lisensi MIT")} · v{VERSION}
          </p>
          <a
            className="transition-colors hover:text-foreground"
            href="https://github.com/Raditya-P/AdviceIT"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
