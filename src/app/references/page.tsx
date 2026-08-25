import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "References" };

const SECTIONS: { title: string; refs: { text: string; use: string; href?: string }[] }[] = [
  {
    title: "Dataset",
    refs: [
      {
        text: "Bonelli, M. (2026). ILS-Bench: Investor Language-to-Suitability Benchmark. Mendeley Data, V1. Licence CC BY 4.0.",
        use: "Training data for both advisors, the shared label vocabulary, the Human review outcome and the case browser.",
        href: "https://doi.org/10.17632/w48mh2dtg5.1",
      },
    ],
  },
  {
    title: "Provenance",
    refs: [
      {
        text: "Pratama, R., and co-authors (2026). Systematic literature review of trust and algorithm aversion in the choice between human and AI financial advisors. Presented at SSRAAI 2026.",
        use: "The review that identified miscalibrated trust as the problem. AdviceIT is its design-side follow-up.",
      },
    ],
  },
  {
    title: "Robo-advisory, risk and ethics",
    refs: [
      {
        text: "Nahidi, N., and Zarifis, A. (Eds.) (2026). AI, FinTech, and the Future of Robo-Advisory: Risk Management and Ethical Considerations. Contributions to Finance and Accounting. Springer Nature Switzerland.",
        use: "Domain background on AI-driven robo-advisory: the framing of suitability, escalation to a human adviser, and the ethics note and debrief in the study design.",
        href: "https://doi.org/10.1007/978-3-032-18109-1",
      },
    ],
  },
  {
    title: "Trust, reliance and algorithm aversion",
    refs: [
      {
        text: "Lee, J. D., and See, K. A. (2004). Trust in automation: Designing for appropriate reliance. Human Factors, 46(1), 50 to 80.",
        use: "The notion of appropriate reliance and calibrated trust that the dependent variables operationalise.",
      },
      {
        text: "Dietvorst, B. J., Simmons, J. P., and Massey, C. (2015). Algorithm aversion: People erroneously avoid algorithms after seeing them err. Journal of Experimental Psychology: General, 144(1), 114 to 126.",
        use: "Under-reliance, and the reason the flawed trials are debriefed.",
      },
      {
        text: "Bansal, G., Wu, T., Zhou, J., Fok, R., Nushi, B., Kamar, E., Ribeiro, M. T., and Weld, D. S. (2021). Does the whole exceed its parts? The effect of AI explanations on complementary team performance. CHI 2021.",
        use: "Explanations can increase reliance on wrong advice, the reason sound and flawed trials are both needed.",
      },
    ],
  },
  {
    title: "Explainable AI methods",
    refs: [
      {
        text: "Rudin, C. (2019). Stop explaining black box machine learning models for high stakes decisions and use interpretable models instead. Nature Machine Intelligence, 1, 206 to 215.",
        use: "The interpretable-by-design position behind the interpretable rule-based advisor and the fidelity factor.",
      },
      {
        text: "Lundberg, S. M., and Lee, S.-I. (2017). A unified approach to interpreting model predictions. NeurIPS 2017.",
        use: "SHAP: Shapley values as feature attributions relative to a baseline, computed exactly for the neural network.",
      },
      {
        text: "Wachter, S., Mittelstadt, B., and Russell, C. (2017). Counterfactual explanations without opening the black box. Harvard Journal of Law and Technology, 31(2).",
        use: "The counterfactual content and the contrastive why-not panel: smallest change that alters the outcome, found by search.",
      },
      {
        text: "Guo, C., Pleiss, G., Sun, Y., and Weinberger, K. Q. (2017). On calibration of modern neural networks. ICML 2017.",
        use: "Temperature scaling and expected calibration error for the probabilities shown in the confidence content.",
      },
    ],
  },
  {
    title: "Human-centred explanation interfaces and measures",
    refs: [
      {
        text: "De Croon, R., and colleagues, Augment research group, KU Leuven (2025). Designing and personalising hybrid health explanations for lay users. ACM Transactions on Interactive Intelligent Systems.",
        use: "The hybrid content and the adaptive delivery, and personalisation to a measured user characteristic.",
      },
      {
        text: "Lusardi, A., and Mitchell, O. S. (2011). Financial literacy around the world: An overview. Journal of Pension Economics and Finance, 10(4), 497 to 508.",
        use: "The Big Three financial literacy questions used as the moderator and by the adaptive delivery.",
      },
    ],
  },
];

const TOOLS: { what: string; use: string; licence: string }[] = [
  { what: "Next.js, React, Tailwind CSS, shadcn/ui", use: "The web application", licence: "MIT and Apache 2.0" },
  { what: "NumPy and Python", use: "Training both advisors (seeded, reproducible)", licence: "BSD and PSF" },
  { what: "WebLLM (MLC project)", use: "The in-browser language model for the conversational delivery and the narrative reading. Ruan, C. F., and colleagues (2024), arXiv:2412.15803.", licence: "Apache 2.0" },
  { what: "Qwen 2.5 1.5B Instruct", use: "Default language model", licence: "Apache 2.0, Alibaba Cloud, weights via Hugging Face (MLC builds)" },
  { what: "Llama 3.2 1B Instruct", use: "Lighter alternative language model", licence: "Llama 3.2 Community License, Meta Platforms" },
  { what: "Neon and Vercel", use: "Database and hosting of the study collector", licence: "Service terms" },
  { what: "WebGPU, WCAG 2.1 AA", use: "GPU access in the browser, accessibility target", licence: "W3C standards" },
];

export default function ReferencesPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">References and tools</h1>
            <p className="text-muted-foreground">
              What AdviceIT directly builds on: the dataset the advisors are trained on, the works behind the design of
              the study and the explanations, and the software it runs on. Where a work informed a specific part, that
              part is named.
            </p>
          </div>
          {SECTIONS.map((s) => (
            <Card key={s.title}>
              <CardHeader>
                <CardTitle className="text-base">{s.title}</CardTitle>
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
                    <p className="text-xs text-muted-foreground">{r.use}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Software, models and services</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>What</TableHead>
                    <TableHead>Used for</TableHead>
                    <TableHead>Licence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TOOLS.map((t) => (
                    <TableRow key={t.what}>
                      <TableCell className="font-medium">{t.what}</TableCell>
                      <TableCell>{t.use}</TableCell>
                      <TableCell>{t.licence}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-3 text-xs text-muted-foreground">
                Everything else (the label rules, the explanation modules, the study machinery, the pages) is original
                code written for this project, released under the MIT licence.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
