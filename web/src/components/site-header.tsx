"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tr, useLang } from "@/lib/i18n";

export function SiteHeader() {
  const { locale, setLocale } = useLang();
  const router = useRouter();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const NAV = [
    { href: "/advisor/ml", label: t("AI advisor", "Penasihat AI") },
    { href: "/advisor/logit", label: t("Interpretable advisor", "Penasihat interpretable") },
    { href: "/training-data", label: t("Training data", "Data pelatihan") },
    { href: "/references", label: t("References", "Referensi") },
  ];
  const toggle = () => {
    setLocale(locale === "en" ? "id" : "en");
    router.refresh();
  };
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
            A
          </span>
          AdviceIT
          <span className="hidden text-xs font-normal text-muted-foreground sm:inline">by Radit</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            aria-label={locale === "en" ? "Switch to Bahasa Indonesia" : "Ganti ke bahasa Inggris"}
            title={locale === "en" ? "Bahasa Indonesia" : "English"}
          >
            <Languages className="size-4" aria-hidden />
            {locale === "en" ? "ID" : "EN"}
          </Button>
          <Button asChild size="sm">
            <Link href="/participate">{t("Participate", "Ikut serta")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
