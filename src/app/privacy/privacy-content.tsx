"use client";

import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { SiteHeader } from "@/components/site-header";
import { tr, useLang } from "@/lib/i18n";

export function PrivacyContent() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHero
          eyebrow={t("Transparency", "Transparansi")}
          title={t("Privacy and consent", "Privasi dan persetujuan")}
          width="max-w-2xl"
        />
        <div className="prose-sm mx-auto max-w-2xl space-y-4 px-4 py-12 sm:px-6">
          <p className="text-muted-foreground">
            {t(
              "AdviceIT is a research instrument run as a pilot study to develop the instrument itself. It is not a financial service, and nothing on this site is financial advice.",
              "AdviceIT adalah instrumen penelitian yang dijalankan sebagai studi pilot untuk mengembangkan instrumennya sendiri. Ini bukan layanan keuangan, dan tidak ada apa pun di situs ini yang merupakan saran keuangan.",
            )}
          </p>
          <h2 className="text-xl font-semibold">{t("What is collected", "Apa yang dikumpulkan")}</h2>
          <p className="text-muted-foreground">
            {t(
              "Only what you enter during a study session: your answers to the three financial-knowledge questions, the hypothetical cases you saw, the recommendation and explanation shown, your trust ratings and decisions, the optional free-text answers, and timing. Everything is stored under a random participant ID shown to you at the start and the end of the session.",
              "Hanya yang Anda masukkan selama sesi studi: jawaban Anda atas tiga pertanyaan pengetahuan keuangan, kasus hipotetis yang Anda lihat, rekomendasi dan penjelasan yang ditampilkan, penilaian kepercayaan dan keputusan Anda, jawaban teks bebas yang opsional, dan waktu. Semuanya disimpan di bawah ID partisipan acak yang ditunjukkan kepada Anda di awal dan akhir sesi.",
            )}
          </p>
          <h2 className="text-xl font-semibold">{t("What is not collected", "Apa yang tidak dikumpulkan")}</h2>
          <p className="text-muted-foreground">
            {t(
              "No name, no email, no account data, no IP-based profile, no advertising or analytics trackers. The conversational explainer runs entirely in your browser, so what you type to it never reaches a server. The try-mode advisor pages do not record anything at all.",
              "Tidak ada nama, tidak ada email, tidak ada data akun, tidak ada profil berbasis IP, tidak ada pelacak iklan atau analitik. Penjelas percakapan berjalan sepenuhnya di browser Anda, jadi apa yang Anda ketik kepadanya tidak pernah mencapai server. Halaman penasihat mode coba tidak merekam apa pun sama sekali.",
            )}
          </p>
          <h2 className="text-xl font-semibold">{t("Your rights", "Hak Anda")}</h2>
          <p className="text-muted-foreground">
            {t(
              "You can stop a session at any time by closing the page. You can have your data deleted by contacting the researcher and quoting your participant ID. Data from this pilot is used to develop and validate the instrument, and will not be used in a publication before a formal ethics review.",
              "Anda dapat menghentikan sesi kapan saja dengan menutup halaman. Anda dapat meminta data Anda dihapus dengan menghubungi peneliti dan menyebutkan ID partisipan Anda. Data dari pilot ini digunakan untuk mengembangkan dan memvalidasi instrumen, dan tidak akan dipakai dalam publikasi sebelum tinjauan etik formal.",
            )}
          </p>
          <h2 className="text-xl font-semibold">{t("Contact", "Kontak")}</h2>
          <p className="text-muted-foreground">Raditya Pratama · radityapratama2077@gmail.com</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
