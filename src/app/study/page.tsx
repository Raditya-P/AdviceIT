import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { localTitle, pageLocale } from "@/lib/locale-server";
import { StudyEntry } from "./study-entry";

/* The way in is /participate, which explains the session first, so the
   session itself stays out of search results. */
export async function generateMetadata() {
  return {
    title: await localTitle("Study session", "Sesi penelitian"),
    robots: { index: false },
  };
}

export default async function StudyPage() {
  const locale = await pageLocale();
  return (
    <>
      <SiteHeader progress={false} />
      <main className="flex-1" data-motion="still">
        <Suspense
          fallback={
            <div className="mx-auto max-w-2xl px-4 py-10 text-muted-foreground">
              {locale === "id" ? "Menyiapkan sesi Anda" : "Preparing your session"}
            </div>
          }
        >
          <StudyEntry />
        </Suspense>
      </main>
    </>
  );
}
