"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Languages, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand";
import { tr, useLang } from "@/lib/i18n";

export function SiteHeader() {
  const { locale, setLocale } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const t = (en: string, id: string) => tr(locale, { en, id });
  const NAV = [
    { href: "/advisor/ml", label: t("AI advisor", "Penasihat AI") },
    { href: "/advisor/logit", label: t("Interpretable advisor", "Penasihat interpretable") },
    { href: "/about", label: t("About", "Tentang") },
    { href: "/about#researchers", label: t("For researchers", "Untuk peneliti") },
  ];
  const toggle = () => {
    setLocale(locale === "en" ? "id" : "en");
    router.refresh();
  };
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Logo size={28} wordmarkClass="text-[19px]" />
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href.split("#")[0] && !item.href.includes("#");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
                  active
                    ? "bg-secondary font-medium text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5">
          <details className="relative md:hidden">
            <summary
              className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("Menu", "Menu")}
            >
              <Menu className="size-5" aria-hidden />
            </summary>
            <nav className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-border/80 bg-background p-2 shadow-lg">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground hover:text-foreground"
            onClick={toggle}
            aria-label={locale === "en" ? "Switch to Bahasa Indonesia" : "Ganti ke bahasa Inggris"}
            title={locale === "en" ? "Bahasa Indonesia" : "English"}
          >
            <Languages className="size-4" aria-hidden />
            {locale === "en" ? "ID" : "EN"}
          </Button>
          <Button asChild size="sm" className="rounded-full px-4">
            <Link href="/participate">{t("Participate", "Ikut serta")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
