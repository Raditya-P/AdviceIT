import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Instrument_Sans, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/lib/i18n";
import { COOKIE, type Locale } from "@/lib/locale";
import { localTitle } from "@/lib/locale-server";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_TITLE_ID, SITE_URL } from "@/lib/site";
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

/* The link preview is the study's recruitment poster: most people meet the
   site as a link pasted into a chat. Pages set their own title and
   description and inherit this card whole, image included (the image is
   drawn by opengraph-image.tsx). The tab title follows the visitor's
   language. The card stays English, since crawlers carry no cookie. */
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: await localTitle(SITE_TITLE, SITE_TITLE_ID),
      template: "%s · AdviceIT",
    },
    description: SITE_DESCRIPTION,
    applicationName: "AdviceIT",
    openGraph: {
      type: "website",
      siteName: "AdviceIT",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      locale: "en_US",
      alternateLocale: ["id_ID"],
    },
    twitter: { card: "summary_large_image" },
  };
}

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
