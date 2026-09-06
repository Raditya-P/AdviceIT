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
      title: t("For participants", "Untuk peserta"),
      links: [
        { href: "/participate", label: t("Take part", "Ikut serta") },
        { href: "/advisor/ml", label: t("Try the AI advisor", "Coba penasihat AI") },
        { href: "/advisor/logit", label: t("Try the interpretable advisor", "Coba penasihat interpretable") },
        { href: "/privacy", label: t("Privacy and consent", "Privasi dan persetujuan") },
      ],
    },
    {
      title: t("For researchers", "Untuk peneliti"),
      links: [
        { href: "/about", label: t("About and team", "Tentang dan tim") },
        { href: "/design", label: t("Study design", "Rancangan studi") },
        { href: "/training-data", label: t("Training data and models", "Data pelatihan dan model") },
        { href: "/references", label: t("References", "Referensi") },
      ],
    },
  ];
  return (
    <footer className="mt-auto border-t border-border/70 bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]">
          <div className="space-y-3">
            <p className="text-base font-semibold tracking-tight">AdviceIT</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {t(
                "A research simulation about explaining AI investment advice, built by a team of three. Nothing here is real financial advice.",
                "Simulasi penelitian tentang menjelaskan saran investasi AI, dibangun tim beranggotakan tiga orang. Tidak ada saran keuangan sungguhan di sini.",
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
              {t("Data access", "Akses data")}
            </p>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/researcher">{t("Researcher dashboard", "Dasbor peneliti")}</Link>
            </Button>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border/70 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t("Pratama, Wicaksono and Ramadhan", "Pratama, Wicaksono, dan Ramadhan")} · {t("MIT licence", "Lisensi MIT")} · v{VERSION}
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
