import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { pageLocale } from "@/lib/locale-server";

/* Unknown addresses get the site's own chrome and the usual ways in,
   rather than a bare default page. Old links from recruitment posts are the
   likely way to arrive here. */
export default async function NotFound() {
  const locale = await pageLocale();
  const t = (en: string, id: string) => (locale === "id" ? id : en);
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHero
          eyebrow="404"
          title={t("This page does not exist", "Halaman ini tidak ada")}
          lead={t(
            "The link may be old or mistyped. These are the usual ways in.",
            "Tautannya mungkin sudah lama atau salah ketik. Ini jalan masuk yang biasa.",
          )}
          width="max-w-3xl"
        >
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full pl-7 pr-6">
              <Link href="/participate">
                {t("Take part in the study", "Ikut serta dalam studi")}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7">
              <Link href="/advisor/ml">{t("Try the advisor", "Coba penasihatnya")}</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-12 rounded-full px-7">
              <Link href="/">{t("Back to the homepage", "Kembali ke beranda")}</Link>
            </Button>
          </div>
        </PageHero>
      </main>
      <SiteFooter />
    </>
  );
}
