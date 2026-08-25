# Changelog

All notable changes to the AdviceIT website are recorded here, starting at 2.0.0.
The version shown in the site footer, `package.json` and `src/lib/version.ts` move together.

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
  instrument is archived in `v1/`, so one repository holds both versions.

## 1.0.0 (2026-08-25)

- Initial public website: Next.js port of the AdviceIT v1 static instrument with verified advisor
  logic (both training accuracies reproduced exactly, 22-check verification suite), hero homepage,
  advisor playgrounds, random-assignment participate flow with logged choice, six-trial study with
  attention check and debrief, Neon collector API, researcher dashboard with CSV export.
