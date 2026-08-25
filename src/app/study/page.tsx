import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { StudyEntry } from "./study-entry";

export const metadata = { title: "Study session" };

export default function StudyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-10 text-muted-foreground">Preparing your session</div>}>
          <StudyEntry />
        </Suspense>
      </main>
    </>
  );
}
