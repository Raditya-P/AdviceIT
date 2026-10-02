import type { Metadata } from "next";
import type { ReactNode } from "react";
import { localTitle } from "@/lib/locale-server";

/* The dashboard page is a client component, so its metadata lives here. It
   is an internal tool and stays out of search results. */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await localTitle("Researcher dashboard", "Dasbor peneliti"),
    robots: { index: false, follow: false },
  };
}

export default function ResearcherLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
