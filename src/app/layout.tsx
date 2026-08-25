import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { COOKIE, LanguageProvider, type Locale } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AdviceIT: explainable AI investment advice, studied with you",
    template: "%s · AdviceIT",
  },
  description:
    "An open research study on which explanations help people trust AI investment advice the right amount. Try two advisors trained on expert-validated data, then contribute a 10-minute session.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const jar = await cookies();
  const locale: Locale = jar.get(COOKIE)?.value === "id" ? "id" : "en";
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
