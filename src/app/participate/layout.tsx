import type { Metadata } from "next";
import type { ReactNode } from "react";
import { localTitle } from "@/lib/locale-server";

/* The participate page is a client component, so its metadata lives here. */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await localTitle("Take part in the study", "Ikut penelitian"),
    description:
      "Judge an AI investment advisor on six short made-up cases. Anonymous, no account, about 15 minutes, in English or Bahasa Indonesia.",
  };
}

export default function ParticipateLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
