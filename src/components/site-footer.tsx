"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { tr, useLang } from "@/lib/i18n";
import { VERSION } from "@/lib/version";

export function SiteFooter() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">AdviceIT by Radit</p>
          <p>
            {t(
              "A research instrument for explainable AI in financial advice. Nothing here is real financial advice.",
              "Instrumen penelitian untuk AI yang dapat dijelaskan dalam saran keuangan. Tidak ada saran keuangan sungguhan di sini.",
            )}
          </p>
          <p>
            Raditya Pratama · {t("MIT licence", "Lisensi MIT")} · v{VERSION} ·{" "}
            <a className="underline underline-offset-4 hover:text-foreground" href="https://github.com/Raditya-P/AdviceIT" target="_blank" rel="noopener">
              GitHub
            </a>{" "}
            ·{" "}
            <Link className="underline underline-offset-4 hover:text-foreground" href="/privacy">
              {t("Privacy and consent", "Privasi dan persetujuan")}
            </Link>
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/researcher">{t("Researcher mode", "Mode peneliti")}</Link>
        </Button>
      </div>
    </footer>
  );
}
