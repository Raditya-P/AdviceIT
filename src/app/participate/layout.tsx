import type { Metadata } from "next";
import type { ReactNode } from "react";

/* The participate page is a client component, so its metadata lives here. */
export const metadata: Metadata = {
  title: "Take part in the study",
  description:
    "Judge an AI investment advisor on six short made-up cases. Anonymous, no account, about 15 minutes, in English or Bahasa Indonesia.",
};

export default function ParticipateLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
