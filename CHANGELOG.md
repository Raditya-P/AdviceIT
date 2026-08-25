# Changelog

All notable changes to the AdviceIT website are recorded here, starting at 2.0.0.
The version shown in the site footer, `package.json` and `src/lib/version.ts` move together.

## 2.1.0 (2026-08-25)

### Added

- Sequential advisor pages: choose the explanation style, fill in the investor profile, watch a short
  analysis step, then read the recommendation. The step bar allows going back to any earlier step.
- "What this recommendation means" under every recommendation on the advisor pages: what the mix is
  trying to do, plus what each asset class in it is, with concrete examples of how people hold it. The
  study trials leave it out on purpose, so the explanation condition stays the only thing that varies.
- The home page hero now runs the real AI advisor on an example profile and prints its actual answer
  and two strongest drivers, rather than showing a mock-up.
- Shared page opener, allocation bar and legend components, and a small motion vocabulary (rise, lift,
  float, growing bars) that respects `prefers-reduced-motion`.

### Changed

- Typography fixed and upgraded: `--font-sans` was declared in the theme but never defined, so the whole
  site fell back to the browser default font. Body text is now Inter and headings are Instrument Sans.
- Light blue accent (#2f7fd0, the colour of the v1 instrument) replaces the default black-and-grey theme,
  with cool neutral greys, softer radii and a warm amber reserved for caution notes.
- Asset classes have their own colours instead of four opacities of one blue, so allocation bars read as
  four distinct classes.
- The coloured left border on the advisor and explanation cards is gone, replaced by an icon and a header
  rule.
- The header no longer shows a logo mark, has an active-page state, and the footer is a proper sitemap.
- Copy pass across the site. The home headline is now "Know when to trust AI investment advice", and
  the participate page opens with taking part rather than with "Meet the explanation styles".

## 2.0.0 (2026-08-25)

### Added

- Language toggle (EN and ID) in the header, switching the whole site to Bahasa Indonesia: homepage,
  participate page, the full study flow (consent, literacy questions, case narratives, trial questions,
  exit, debrief), both advisor playgrounds, the generated explanations (feature, counterfactual,
  contrastive, confidence, adaptive), the scorecard, training data, references and privacy pages.
- The conversational explainer replies in the chosen language (the grounding facts follow the site
  language and the model is instructed accordingly). The free-text reading step still works best with
  English descriptions and the form says so.
- The chosen language is stored in a cookie, applied on first paint server-side, and logged per study
  row as `language` so responses can be analysed per language.
- `src/lib/advisor/strings.ts`: locale template layer for every generated sentence. English output is
  byte-identical to 1.0.0, verified by the unchanged verification suite.
- Version number in the footer, this changelog.

### Changed

- Logged values stay English canonical in every language (decisions, portfolio names, suitability
  labels, option values), so the dataset needs no language-dependent recoding.
- Case narratives in the study have curated Indonesian translations (`CASES_ID`), as do the Big Three
  literacy questions and all consent, debrief and exit texts.

### Operations

- Neon database provisioned: schema from `db/schema.sql` applied, insert and read verified, credentials
  live only in `.env.local` (gitignored) and in Vercel environment variables.
- Repository consolidated: the website now sits at the root of `Raditya-P/AdviceIT` and the original static
  instrument is archived in `v1/`, so one repository holds both versions. The GitHub Pages copy of v1 stays
  live at `/AdviceIT/v1/`, and `/AdviceIT/` redirects to it until the Vercel address replaces it.
- The project README describes the instrument again, updated for 2.0, rather than only the deployment steps.

## 1.0.0 (2026-08-25)

- Initial public website: Next.js port of the AdviceIT v1 static instrument with verified advisor
  logic (both training accuracies reproduced exactly, 22-check verification suite), hero homepage,
  advisor playgrounds, random-assignment participate flow with logged choice, six-trial study with
  attention check and debrief, Neon collector API, researcher dashboard with CSV export.
