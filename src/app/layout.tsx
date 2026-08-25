import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Instrument_Sans, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { COOKIE, LanguageProvider, type Locale } from "@/lib/i18n";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const heading = Instrument_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AdviceIT: explainable AI investment advice, studied with you",
    template: "%s · AdviceIT",
  },
  description:
    "An open research study on which explanations help people trust AI investment advice the right amount. Try two advisors trained on expert-validated data, then contribute a 10-minute session.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const locale: Locale = jar.get(COOKIE)?.value === "id" ? "id" : "en";
  return (
    <html
      lang={locale}
      className={`${sans.variable} ${heading.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
