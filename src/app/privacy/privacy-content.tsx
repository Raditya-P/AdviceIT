"use client";

import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { SiteHeader } from "@/components/site-header";
import { PageTransition } from "@/components/page-transition";
import { tr, useLang } from "@/lib/i18n";
import { CONTACT } from "@/lib/study";

export function PrivacyContent() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });
  return (
    <>
      <SiteHeader />
      <PageTransition>
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
              "AdviceIT adalah alat penelitian yang sedang diuji coba (studi pilot) untuk mengembangkan alat itu sendiri. AdviceIT bukan layanan keuangan, dan tidak ada isi situs ini yang merupakan saran keuangan.",
            )}
          </p>
          <h2 className="text-xl font-semibold">{t("What is collected", "Data yang dikumpulkan")}</h2>
          <p className="text-muted-foreground">
            {t(
              "Only what you enter during a study session: your answers to the three financial-knowledge questions and to nine short statements about how you think and what you expect from the advice, the hypothetical cases you saw, the recommendation and explanation shown, your trust ratings and decisions, your five ratings of the explanations at the end, the optional free-text answers, and timing. Alongside them we record the site language, whether the device was a mobile one, and whether the session was left and picked up again. Everything is stored under a random participant ID shown to you at the end of the session.",
              "Hanya yang Anda isi selama sesi penelitian: jawaban Anda untuk tiga pertanyaan pengetahuan keuangan dan sembilan pernyataan singkat tentang cara Anda berpikir dan harapan Anda terhadap saran, kasus rekaan yang Anda lihat, rekomendasi dan penjelasan yang ditampilkan, penilaian kepercayaan dan keputusan Anda, lima penilaian Anda tentang penjelasan di bagian akhir, jawaban tertulis yang tidak wajib, dan catatan waktu. Selain itu, kami mencatat bahasa situs, apakah Anda memakai ponsel, dan apakah sesi sempat ditinggalkan lalu dilanjutkan. Semuanya disimpan dengan ID peserta acak yang ditunjukkan kepada Anda di akhir sesi.",
            )}
          </p>
          <h2 className="text-xl font-semibold">{t("What is not collected", "Data yang tidak dikumpulkan")}</h2>
          <p className="text-muted-foreground">
            {t(
              "No name, no email, no account data, no IP-based profile, no advertising or analytics trackers. The conversational explainer runs entirely in your browser, so what you type to it never reaches a server. The advisor pages record nothing while you try them. If you choose to fill in the optional response panel there, that answer is stored anonymously as a tryout, marked separately from the study.",
              "Tidak ada nama, email, data akun, profil berdasarkan alamat IP, maupun pelacak iklan atau analitik. Fitur percakapan berjalan sepenuhnya di browser Anda, jadi apa yang Anda ketik tidak pernah sampai ke server. Halaman penasihat tidak mencatat apa pun saat Anda mencobanya. Jika Anda memilih mengisi formulir tanggapan yang tidak wajib di sana, jawaban itu disimpan secara anonim sebagai uji coba, terpisah dari data penelitian.",
            )}
          </p>
          <h2 className="text-xl font-semibold">{t("What stays in your browser", "Data yang hanya tersimpan di browser Anda")}</h2>
          <p className="text-muted-foreground">
            {t(
              "A study session is saved in this browser as you go, so that leaving part way through does not lose your answers. It holds your participant ID, the condition you were assigned, the answers you have given and how many cases you have finished. It never leaves your device, it is deleted the moment you finish the session, and it expires after a week on its own. Starting a new session from the participate page discards it. The site also remembers your language choice, and buffers answers here if the network is down so they can be sent on your next visit.",
              "Sesi penelitian disimpan di browser ini selama Anda mengerjakannya, jadi jawaban Anda tidak hilang jika Anda berhenti di tengah jalan. Yang disimpan adalah ID peserta Anda, kelompok tempat Anda ditempatkan, jawaban yang sudah Anda berikan, dan jumlah kasus yang sudah selesai. Data ini tidak pernah keluar dari perangkat Anda, langsung dihapus begitu sesi selesai, dan otomatis kedaluwarsa setelah satu minggu. Jika Anda memulai sesi baru dari halaman Ikut serta, data ini dibuang. Situs ini juga mengingat pilihan bahasa Anda, dan menyimpan jawaban sementara di sini jika internet terputus supaya bisa dikirim saat Anda berkunjung lagi.",
            )}
          </p>
          <h2 className="text-xl font-semibold">{t("Your rights", "Hak Anda")}</h2>
          <p className="text-muted-foreground">
            {t(
              "You can stop a session at any time by closing the page. You can have your data deleted by contacting the researcher and quoting your participant ID. Data from this pilot is used to develop and validate the instrument, and will not be used in a publication before a formal ethics review.",
              "Anda bisa menghentikan sesi kapan saja dengan menutup halaman. Anda bisa meminta data Anda dihapus dengan menghubungi peneliti dan menyebutkan ID peserta Anda. Data dari studi pilot ini dipakai untuk mengembangkan dan menguji alat ukur penelitian, dan tidak akan dipakai dalam publikasi sebelum ada tinjauan etik resmi.",
            )}
          </p>
          <h2 className="text-xl font-semibold">{t("Contact", "Kontak")}</h2>
          <p className="text-muted-foreground">
            {CONTACT.name} ·{" "}
            <a className="font-medium text-primary underline underline-offset-4" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </p>
        </div>
      </main>
      <SiteFooter />
      </PageTransition>
    </>
  );
}
