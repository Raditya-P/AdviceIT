import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { localTitle, pageLocale } from "@/lib/locale-server";

export async function generateMetadata() {
  return {
    title: await localTitle("References", "Referensi"),
    description: "The research, data and tools AdviceIT builds on.",
  };
}

type L = { en: string; id: string };
const SECTIONS: { title: L; refs: { text: string; use: L; href?: string }[] }[] = [
  {
    title: { en: "Dataset", id: "Dataset" },
    refs: [
      {
        text: "Bonelli, M. (2026). ILS-Bench: Investor Language-to-Suitability Benchmark. Mendeley Data, V1. Licence CC BY 4.0.",
        use: {
          en: "Training data for both advisors, the shared label vocabulary, the Human review outcome and the case browser.",
          id: "Data pelatihan kedua penasihat, istilah label yang dipakai bersama, hasil Tinjauan penasihat manusia, dan daftar kasus.",
        },
        href: "https://doi.org/10.17632/w48mh2dtg5.1",
      },
    ],
  },
  {
    title: { en: "Provenance", id: "Latar belakang" },
    refs: [
      {
        text: "Pratama, R., and co-authors (2026). Systematic literature review of trust and algorithm aversion in the choice between human and AI financial advisors. Presented at SSRAAI 2026.",
        use: {
          en: "The review that identified miscalibrated trust as the problem. AdviceIT is its design-side follow-up.",
          id: "Tinjauan pustaka yang menemukan bahwa masalahnya adalah kepercayaan yang tidak sepadan (miscalibrated trust). AdviceIT adalah tindak lanjutnya dari sisi rancangan.",
        },
      },
    ],
  },
  {
    title: { en: "Robo-advisory, risk and ethics", id: "Robo-advisor, risiko, dan etika" },
    refs: [
      {
        text: "Nahidi, N., and Zarifis, A. (Eds.) (2026). AI, FinTech, and the Future of Robo-Advisory: Risk Management and Ethical Considerations. Contributions to Finance and Accounting. Springer Nature Switzerland.",
        use: {
          en: "Domain background on AI-driven robo-advisory: the framing of suitability, escalation to a human adviser, and the ethics note and debrief in the study design.",
          id: "Latar belakang robo-advisor berbasis AI: cara memandang kesesuaian (suitability), pengalihan ke penasihat manusia, serta catatan etik dan penjelasan akhir (debrief) dalam rancangan studi.",
        },
        href: "https://doi.org/10.1007/978-3-032-18109-1",
      },
    ],
  },
  {
    title: { en: "Trust, reliance and algorithm aversion", id: "Kepercayaan, ketergantungan (reliance), dan keengganan terhadap algoritma" },
    refs: [
      {
        text: "Lee, J. D., and See, K. A. (2004). Trust in automation: Designing for appropriate reliance. Human Factors, 46(1), 50 to 80.",
        use: {
          en: "The notion of appropriate reliance and calibrated trust that the dependent variables operationalise.",
          id: "Konsep ketergantungan yang tepat (appropriate reliance) dan kepercayaan yang sepadan (calibrated trust), yang diukur oleh variabel terikat.",
        },
      },
      {
        text: "Dietvorst, B. J., Simmons, J. P., and Massey, C. (2015). Algorithm aversion: People erroneously avoid algorithms after seeing them err. Journal of Experimental Psychology: General, 144(1), 114 to 126.",
        use: {
          en: "Under-reliance, and the reason the flawed trials are debriefed.",
          id: "Ketergantungan yang terlalu rendah (under-reliance), dan alasan kasus yang keliru dijelaskan kepada peserta di akhir studi.",
        },
      },
      {
        text: "Bansal, G., Wu, T., Zhou, J., Fok, R., Nushi, B., Kamar, E., Ribeiro, M. T., and Weld, D. S. (2021). Does the whole exceed its parts? The effect of AI explanations on complementary team performance. CHI 2021.",
        use: {
          en: "Explanations can increase reliance on wrong advice, the reason sound and flawed trials are both needed.",
          id: "Penjelasan bisa membuat orang makin bergantung pada saran yang salah. Karena itu, kasus dengan saran yang tepat dan yang keliru sama-sama dibutuhkan.",
        },
      },
    ],
  },
  {
    title: {
      en: "The design of the explanations and the study",
      id: "Rancangan penjelasan dan studi",
    },
    refs: [
      {
        text: "Szymanski, M., Keyaerts, S., Conati, C., De Croon, R., Vanden Abeele, V., Verbert, K. (2025). Designing and Personalising Hybrid Health Explanations for Lay Users. ACM Transactions on Interactive Intelligent Systems.",
        use: {
          en: "The visual, textual and hybrid modality factor, the need for cognition and ease-of-satisfaction scales, and the three-phase study structure.",
          id: "Faktor bentuk penjelasan (visual, teks, dan gabungan), skala kebutuhan berpikir (need for cognition) dan kemudahan merasa puas (ease-of-satisfaction), serta struktur studi tiga tahap.",
        },
      },
      {
        text: "Szymanski, M., Millecamp, M., Verbert, K. (2021). Visual, Textual or Hybrid: The Effect of User Expertise on Different Explanations. IUI '21.",
        use: { en: "The original modality comparison.", id: "Studi asli yang membandingkan bentuk penjelasan." },
      },
      {
        text: "Samimi, R., Bhattacharya, A., Gosak, L., Stiglic, G., Verbert, K. (2025). Visual-Conversational Interface for Evidence-Based Explanation of Diabetes Risk Prediction. CUI '25.",
        use: {
          en: "The two-path conversational explainer: analytical questions answered from computation, the rest by a language model.",
          id: "Fitur percakapan dua jalur: pertanyaan analitis dijawab dari hasil perhitungan, sisanya oleh model bahasa.",
        },
        href: "https://doi.org/10.1145/3719160.3736616",
      },
      {
        text: "Millecamp, M., Htun, N. N., Conati, C., Verbert, K. (2019). To Explain or Not to Explain: The Effects of Personal Characteristics When Explaining Music Recommendations. IUI '19.",
        use: { en: "Personal characteristics as moderators of whether an explanation helps.", id: "Karakteristik pribadi sebagai faktor yang menentukan apakah sebuah penjelasan membantu (moderator)." },
      },
      {
        text: "Millecamp, M., Htun, N. N., Conati, C., Verbert, K. (2020). What's in a User? Towards Personalising Transparency for Music Recommender Interfaces. UMAP '20.",
        use: { en: "Interactive control over explanations.", id: "Kendali interaktif atas penjelasan." },
      },
      {
        text: "Bhattacharya, A., Ooge, J., Stiglic, G., Verbert, K. (2023). Directive Explanations for Monitoring the Risk of Diabetes Onset. IUI '23.",
        use: { en: "Explanations that say what to do, the basis for the actionable steps.", id: "Penjelasan yang menyebutkan apa yang perlu dilakukan, dasar dari langkah-langkah yang bisa langsung diterapkan." },
      },
      {
        text: "Liao, Q. V., Gruen, D., Miller, S. (2020). Questioning the AI: Informing Design Practices for Explainable AI User Experiences. CHI '20.",
        use: { en: "The question bank the conversational explainer's supported questions come from.", id: "Kumpulan pertanyaan (question bank) yang menjadi sumber pertanyaan yang bisa dijawab fitur percakapan." },
      },
      {
        text: "Buçinca, Z., Malaya, M. B., Gajos, K. Z. (2021). To Trust or to Think: Cognitive Forcing Functions Can Reduce Overreliance on AI in AI-assisted Decision-making. Proceedings of the ACM on Human-Computer Interaction 5 (CSCW1).",
        use: { en: "Reading the case before the advice is shown, and the analysis pause.", id: "Membaca kasus sebelum saran ditampilkan, dan jeda saat penasihat menganalisis." },
        href: "https://doi.org/10.1145/3449287",
      },
      {
        text: "Zhang, Y., Liao, Q. V., Bellamy, R. K. E. (2020). Effect of Confidence and Explanation on Accuracy and Trust Calibration in AI-Assisted Decision Making. FAT* '20.",
        use: { en: "The confidence condition, and why its effect is not assumed to be positive.", id: "Kondisi tingkat keyakinan, dan mengapa efeknya tidak dianggap pasti positif." },
        href: "https://doi.org/10.1145/3351095.3372852",
      },
      {
        text: "Schemmer, M., Kühl, N., Benz, C., Bartos, A., Satzger, G. (2023). Appropriate Reliance on AI Advice: Conceptualization and the Effect of Explanations. IUI '23.",
        use: { en: "How appropriate reliance is defined and measured.", id: "Cara mendefinisikan dan mengukur ketergantungan yang tepat." },
        href: "https://doi.org/10.1145/3581641.3584066",
      },
      {
        text: "Springer, A., Whittaker, S. (2020). Progressive Disclosure: When, Why, and How Do Users Want Algorithmic Transparency Information? ACM Transactions on Interactive Intelligent Systems 10 (4).",
        use: { en: "Detail on demand across the site.", id: "Rincian yang muncul saat dibutuhkan, di seluruh situs." },
        href: "https://doi.org/10.1145/3374218",
      },
      {
        text: "Lins de Holanda Coelho, G., Hanel, P. H. P., Wolf, L. J. (2020). The Very Efficient Assessment of Need for Cognition: Developing a Six-Item Version. Assessment 27 (8).",
        use: { en: "The six need for cognition items asked before the cases.", id: "Enam butir skala kebutuhan berpikir (need for cognition) yang ditanyakan sebelum kasus." },
        href: "https://doi.org/10.1177/1073191118793208",
      },
      {
        text: "Buell, R. W., Norton, M. I. (2011). The Labor Illusion: How Operational Transparency Increases Perceived Value. Management Science 57 (9).",
        use: { en: "The analysis screen, and why it is held constant across conditions.", id: "Layar analisis, dan mengapa layar itu dibuat sama di semua kondisi." },
        href: "https://doi.org/10.1287/mnsc.1110.1376",
      },
    ],
  },
  {
    title: { en: "Explainable AI methods", id: "Metode AI yang dapat dijelaskan (explainable AI)" },
    refs: [
      {
        text: "Rudin, C. (2019). Stop explaining black box machine learning models for high stakes decisions and use interpretable models instead. Nature Machine Intelligence, 1, 206 to 215.",
        use: {
          en: "The interpretable-by-design position behind the interpretable rule-based advisor and the fidelity factor.",
          id: "Pandangan bahwa model sebaiknya transparan sejak dirancang (interpretable by design), yang mendasari penasihat transparan berbasis aturan dan faktor kesetiaan penjelasan (fidelity).",
        },
      },
      {
        text: "Lundberg, S. M., and Lee, S.-I. (2017). A unified approach to interpreting model predictions. NeurIPS 2017.",
        use: {
          en: "SHAP: Shapley values as feature attributions relative to a baseline, computed exactly for the neural network.",
          id: "SHAP: nilai Shapley untuk mengukur sumbangan setiap faktor dibandingkan profil acuan, dihitung secara eksak untuk jaringan saraf.",
        },
      },
      {
        text: "Wachter, S., Mittelstadt, B., and Russell, C. (2017). Counterfactual explanations without opening the black box. Harvard Journal of Law and Technology, 31(2).",
        use: {
          en: "The counterfactual content and the contrastive why-not panel: smallest change that alters the outcome, found by search.",
          id: "Penjelasan kontrafaktual dan panel mengapa-bukan (why-not): perubahan terkecil yang mengubah hasil, ditemukan lewat pencarian.",
        },
      },
      {
        text: "Guo, C., Pleiss, G., Sun, Y., and Weinberger, K. Q. (2017). On calibration of modern neural networks. ICML 2017.",
        use: {
          en: "Temperature scaling and expected calibration error for the probabilities shown in the confidence content.",
          id: "Temperature scaling dan expected calibration error untuk peluang yang ditampilkan pada penjelasan tingkat keyakinan.",
        },
      },
    ],
  },
  {
    title: {
      en: "Human-centred explanation interfaces and measures",
      id: "Antarmuka penjelasan yang berpusat pada manusia, dan cara mengukurnya",
    },
    refs: [
      {
        text: "De Croon, R., and colleagues, Augment research group, KU Leuven (2025). Designing and personalising hybrid health explanations for lay users. ACM Transactions on Interactive Intelligent Systems.",
        use: {
          en: "The hybrid content and the adaptive delivery, and personalisation to a measured user characteristic.",
          id: "Penjelasan gabungan dan penyajian adaptif, serta penyesuaian dengan karakteristik pengguna yang diukur.",
        },
      },
      {
        text: "Lusardi, A., and Mitchell, O. S. (2011). Financial literacy around the world: An overview. Journal of Pension Economics and Finance, 10(4), 497 to 508.",
        use: {
          en: "The Big Three financial literacy questions used as the moderator and by the adaptive delivery.",
          id: "Tiga pertanyaan literasi keuangan (Big Three) yang dipakai sebagai moderator dan untuk penyajian adaptif.",
        },
      },
    ],
  },
];

const TOOLS: { what: string; use: L; licence: L }[] = [
  {
    what: "Next.js, React, Tailwind CSS, shadcn/ui",
    use: { en: "The web application", id: "Aplikasi web" },
    licence: { en: "MIT and Apache 2.0", id: "MIT dan Apache 2.0" },
  },
  {
    what: "NumPy and Python",
    use: { en: "Training both advisors (seeded, reproducible)", id: "Melatih kedua penasihat (dengan seed tetap, bisa direproduksi)" },
    licence: { en: "BSD and PSF", id: "BSD dan PSF" },
  },
  {
    what: "WebLLM (MLC project)",
    use: {
      en: "The in-browser language model for the conversational delivery and the narrative reading. Ruan, C. F., and colleagues (2024), arXiv:2412.15803.",
      id: "Model bahasa di browser untuk fitur percakapan dan untuk membaca narasi. Ruan, C. F., dkk. (2024), arXiv:2412.15803.",
    },
    licence: { en: "Apache 2.0", id: "Apache 2.0" },
  },
  {
    what: "Qwen 2.5 1.5B Instruct",
    use: { en: "Default language model", id: "Model bahasa bawaan" },
    licence: {
      en: "Apache 2.0, Alibaba Cloud, weights via Hugging Face (MLC builds)",
      id: "Apache 2.0, Alibaba Cloud, bobot via Hugging Face (build MLC)",
    },
  },
  {
    what: "Llama 3.2 1B Instruct",
    use: { en: "Lighter alternative language model", id: "Model bahasa alternatif yang lebih ringan" },
    licence: { en: "Llama 3.2 Community License, Meta Platforms", id: "Llama 3.2 Community License, Meta Platforms" },
  },
  {
    what: "Neon and Vercel",
    use: { en: "Database and hosting of the study collector", id: "Basis data dan hosting untuk pengumpulan data studi" },
    licence: { en: "Service terms", id: "Ketentuan layanan" },
  },
  {
    what: "WebGPU, WCAG 2.1 AA",
    use: { en: "GPU access in the browser, accessibility target", id: "Akses GPU di browser, target aksesibilitas" },
    licence: { en: "W3C standards", id: "Standar W3C" },
  },
];

export default async function ReferencesPage() {
  const locale = await pageLocale();
  const pick = (v: L) => (locale === "id" ? v.id : v.en);
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHero
          eyebrow={pick({ en: "Credits", id: "Kredit" })}
          title={pick({ en: "References and tools", id: "Referensi dan alat bantu" })}
          lead={pick({
            en: "What AdviceIT directly builds on: the dataset the advisors are trained on, the works behind the design of the study and the explanations, and the software it runs on. Where a work informed a specific part, that part is named. Citations are kept in their original language.",
            id: "Dasar langsung yang dipakai AdviceIT: dataset untuk melatih para penasihat, karya ilmiah di balik rancangan studi dan penjelasannya, serta perangkat lunak yang menjalankannya. Jika sebuah karya memengaruhi bagian tertentu, bagian itu disebutkan. Sitasi ditulis dalam bahasa aslinya.",
          })}
        />
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-12 sm:px-6">
          {SECTIONS.map((s) => (
            <Card key={s.title.en}>
              <CardHeader>
                <CardTitle className="text-base">{pick(s.title)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {s.refs.map((r) => (
                  <div key={r.text} className="space-y-1 text-sm">
                    <p>
                      {r.text}{" "}
                      {r.href && (
                        <a className="text-primary underline underline-offset-4" href={r.href} target="_blank" rel="noopener">
                          {r.href.replace("https://", "")}
                        </a>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{pick(r.use)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {pick({ en: "Software, models and services", id: "Perangkat lunak, model, dan layanan" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{pick({ en: "What", id: "Nama" })}</TableHead>
                    <TableHead>{pick({ en: "Used for", id: "Dipakai untuk" })}</TableHead>
                    <TableHead>{pick({ en: "Licence", id: "Lisensi" })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TOOLS.map((tool) => (
                    <TableRow key={tool.what}>
                      <TableCell className="font-medium">{tool.what}</TableCell>
                      <TableCell>{pick(tool.use)}</TableCell>
                      <TableCell>{pick(tool.licence)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-3 text-xs text-muted-foreground">
                {pick({
                  en: "Everything else (the label rules, the explanation modules, the study machinery, the pages) is original code written for this project, released under the MIT licence.",
                  id: "Selebihnya (aturan label, modul penjelasan, sistem studi, dan halaman-halaman situs) adalah kode asli yang ditulis khusus untuk proyek ini, dirilis dengan lisensi MIT.",
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
