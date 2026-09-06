"use client";

/* What AdviceIT is in plain words, who built it and in what roles, where it
   comes from, and the doorway for researchers and reviewers. Team roles are
   stated here rather than in the product name, so that the site reads as the
   team project it is. */

import Link from "next/link";
import { ArrowRight, BookOpen, Code2, Database, FlaskConical, Scale, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { tr, useLang } from "@/lib/i18n";
import { VERSION } from "@/lib/version";

export function AboutContent() {
  const { locale } = useLang();
  const t = (en: string, id: string) => tr(locale, { en, id });

  const TEAM = [
    {
      name: "Raditya Pratama",
      role: t("Lead developer and research design", "Pengembang utama dan rancangan penelitian"),
      text: t(
        "Built the website, the two advisors, the explanation methods and the study flow, and leads the research design.",
        "Membangun situs web, kedua penasihat, metode penjelasan, dan alur studi, serta memimpin rancangan penelitian.",
      ),
    },
    {
      name: "Fausta Irsyad Ramadhan",
      role: t("AI ecosystem and core resources", "Ekosistem AI dan sumber daya inti"),
      text: t(
        "Provides the infrastructure, compute and tooling the advisors and the site are built and served on.",
        "Menyediakan infrastruktur, komputasi, dan perkakas tempat para penasihat dan situs ini dibangun dan dijalankan.",
      ),
    },
    {
      name: "Muhammad Wahyudi Wicaksono",
      role: t("Quality assurance and research validation", "Penjaminan mutu dan validasi penelitian"),
      text: t(
        "Tests the instrument against the research objectives and reviews the flow, the wording and the measures.",
        "Menguji instrumen terhadap tujuan penelitian dan meninjau alur, redaksi, serta ukuran-ukurannya.",
      ),
    },
  ];

  const RESEARCH_LINKS = [
    {
      href: "/design",
      icon: FlaskConical,
      title: t("Study design", "Rancangan studi"),
      text: t("The factors, the cells, the contrasts and the analysis plan.", "Faktor, sel, kontras, dan rencana analisis."),
    },
    {
      href: "/training-data",
      icon: Database,
      title: t("Training data and models", "Data pelatihan dan model"),
      text: t("ILS-Bench, the two advisors, cross-validated results, every case.", "ILS-Bench, kedua penasihat, hasil validasi silang, setiap kasus."),
    },
    {
      href: "/references",
      icon: BookOpen,
      title: t("References", "Referensi"),
      text: t("The work each design decision rests on.", "Karya yang menjadi pijakan tiap keputusan rancangan."),
    },
    {
      href: "/researcher",
      icon: ShieldCheck,
      title: t("Researcher dashboard", "Dasbor peneliti"),
      text: t("Collected responses, key-gated, with CSV export.", "Respons yang terkumpul, dilindungi kunci, dengan ekspor CSV."),
    },
    {
      href: "https://github.com/Raditya-P/AdviceIT",
      icon: Code2,
      title: t("Source code", "Kode sumber"),
      text: t("Everything on this site, MIT licensed, with the verification suite.", "Semua yang ada di situs ini, berlisensi MIT, beserta rangkaian verifikasinya."),
    },
    {
      href: "/privacy",
      icon: Scale,
      title: t("Privacy and consent", "Privasi dan persetujuan"),
      text: t("What is recorded, what is not, and the consent text in full.", "Apa yang direkam, apa yang tidak, dan teks persetujuan selengkapnya."),
    },
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHero
          eyebrow={t("About", "Tentang")}
          title="AdviceIT"
          lead={t(
            "A research simulation about explaining AI investment advice, built by a team of three. It exists to find out which kinds of explanation help people follow good advice and catch bad advice. Nothing on this site is real financial advice.",
            "Simulasi penelitian tentang menjelaskan saran investasi AI, dibangun tim beranggotakan tiga orang. Situs ini ada untuk mencari tahu jenis penjelasan mana yang membantu orang mengikuti saran yang baik dan menangkap saran yang buruk. Tidak ada apa pun di situs ini yang merupakan saran keuangan sungguhan.",
          )}
          width="max-w-4xl"
        />

        <div className="mx-auto max-w-4xl space-y-14 px-4 py-14 sm:px-6">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">{t("What AdviceIT is", "Apa itu AdviceIT")}</h2>
            <p className="leading-relaxed text-muted-foreground">
              {t(
                "The site has a working AI advisor that recommends an investment mix for a made-up person. It also has several ways of explaining that recommendation. People who take part read six short cases, see the advisor's recommendation with one kind of explanation, and say what they would do. Half of the recommendations are deliberately wrong, and the study measures whether the explanation helped people notice.",
                "Situs ini punya penasihat AI yang berfungsi dan merekomendasikan campuran investasi untuk orang rekaan. Situs ini juga punya beberapa cara menjelaskan rekomendasi itu. Peserta membaca enam kasus singkat, melihat rekomendasi penasihat dengan satu jenis penjelasan, dan mengatakan apa yang akan mereka lakukan. Separuh rekomendasi sengaja dibuat keliru, dan studi ini mengukur apakah penjelasannya membantu orang menyadarinya.",
              )}
            </p>
            <p className="leading-relaxed text-muted-foreground">
              {t(
                "The advisor learned from 400 cases that were reviewed by a panel of four financial experts. Everything runs in your browser, nothing about you is collected, and the whole thing is open source.",
                "Penasihatnya belajar dari 400 kasus yang ditinjau panel empat ahli keuangan. Semuanya berjalan di browser Anda, tidak ada data tentang Anda yang dikumpulkan, dan seluruhnya bersifat sumber terbuka.",
              )}
            </p>
          </section>

          <section className="space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight">{t("The team", "Timnya")}</h2>
            <p className="leading-relaxed text-muted-foreground">
              {t(
                "AdviceIT is a team research project from the Department of Information Systems, Institut Teknologi Sepuluh Nopember, Surabaya. It grew out of a systematic literature review the three of us wrote together on trust and algorithm aversion in the choice between human and AI financial advisors.",
                "AdviceIT adalah proyek penelitian tim dari Departemen Sistem Informasi, Institut Teknologi Sepuluh Nopember, Surabaya. Proyek ini tumbuh dari systematic literature review yang kami bertiga tulis bersama tentang kepercayaan dan algorithm aversion dalam pilihan antara penasihat keuangan manusia dan AI.",
              )}
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {TEAM.map((m) => (
                <article key={m.name} className="panel p-5">
                  <h3 className="font-semibold tracking-tight">{m.name}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-primary">{m.role}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.text}</p>
                </article>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {t(
                "Roles as agreed within the team. Author order on any paper is decided per paper.",
                "Peran sesuai kesepakatan tim. Urutan penulis pada makalah ditentukan per makalah.",
              )}
            </p>
          </section>

          <section id="researchers" className="scroll-mt-24 space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("For researchers and reviewers", "Untuk peneliti dan reviewer")}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("Design, data and methods", "Rancangan, data, dan metode")}
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {t(
                  "The study design, the training data, the model results, the references and the collected responses are each published on their own page.",
                  "Rancangan studi, data pelatihan, hasil model, referensi, dan respons yang terkumpul masing-masing dipublikasikan di halamannya sendiri.",
                )}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {RESEARCH_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noopener" : undefined}
                  className="panel lift flex items-start gap-3 p-5"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <l.icon className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold tracking-tight">{l.title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{l.text}</span>
                  </span>
                </Link>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {t(`Version ${VERSION}. To cite the instrument, use the citation file in the repository.`, `Versi ${VERSION}. Untuk mengutip instrumen ini, gunakan berkas sitasi di repositori.`)}
            </p>
          </section>

          <section className="cta-panel relative overflow-hidden rounded-[1.75rem] border border-border/70 px-6 py-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">{t("Take part in the study", "Ikut serta dalam studi")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t("About fifteen minutes, anonymous, and no real money involved.", "Sekitar lima belas menit, anonim, dan tanpa uang sungguhan.")}
            </p>
            <Button asChild className="mt-5 h-11 rounded-full px-6">
              <Link href="/participate">
                {t("Take part in the study", "Ikut serta dalam studi")} <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
