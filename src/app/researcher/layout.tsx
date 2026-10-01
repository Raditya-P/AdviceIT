import type { Metadata } from "next";
import type { ReactNode } from "react";

/* The dashboard page is a client component, so its metadata lives here. It
   is an internal tool and stays out of search results. */
export const metadata: Metadata = {
  title: "Researcher dashboard",
  robots: { index: false, follow: false },
};

export default function ResearcherLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
