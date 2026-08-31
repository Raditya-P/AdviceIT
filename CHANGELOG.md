# Changelog

All notable changes to the AdviceIT website are recorded here, starting at 2.0.0.
The version shown in the site footer, `package.json` and `src/lib/version.ts` move together.

## 2.5.0 (2026-08-27)

### Added

- **Modality factor** on the why content: visual (bars), textual (the generated sentences, which the
  instrument had been computing and discarding since 1.0.0), or hybrid. Two new cells, `feature-textual`
  and `feature-hybrid`, reachable by link and from the advisor picker but held out of the random pool,
  because modality is a separate within-subject study. Every row logs `explanationModality`.
- **Intent router** in front of the conversational explainer. Why, what would change it, how sure, why
  not X, how the advisor works, what an input means, and why a case was escalated are answered from the
  computations and labelled as computed rather than written. Everything else goes to the language model
  as before. The routed path needs no GPU, so the suggested questions work on any device. Rows log
  `llmRoutedTurns`, `llmIntents` and `llmModelAvailable`.
- **Comparison measures.** Six-item need for cognition and three-item ease-of-satisfaction before the
  trials, five explanation perception items at the exit. The need for cognition and ease items are
  transcribed from Table 2 of Szymanski et al. so the scores are directly comparable to theirs. The five
  perception wordings are ours and are marked in the source as needing a check against Tsai and
  Brusilovsky and Van Der Laan before data collection.
- **Free-text export** in the researcher dashboard: one utterance per row with its condition, ready for
  a coding tool.
- `scripts/intent-smoke.ts`: routing accuracy over a labelled bilingual set including out-of-scope
  questions that must fall through. Currently 29 of 29.
- `v1/ml/lookup_baseline_test.py`: what the lookup baseline can and cannot do.

### Changed

- The conversational condition no longer dead-ends without WebGPU. The routed answers work, and only the
  free-form path is unavailable, which is stated on the card and logged per row.

### Note for the paper

The lookup baseline test came back against the easy argument. The table covers 98.6 percent of held-out
cases and scores 88.8 percent, the same as the network. The reason to train models is not accuracy or
generalisation, it is that the table cannot produce a calibrated probability, a feature attribution, or
any sensitivity to age, and the study's conditions need all three. `docs/design-justification.md`
records this in full.

## 2.4.0 (2026-08-27)

### Added

- `docs/design-justification.md`: every interface and study decision mapped to the published work that
  supports it, with a verification status per source (read in full, taken from a read paper's reference
  list, or confirmed against the publisher). Seventeen sections, ten of them citing the Augment group at
  KU Leuven. The last section lists the decisions that are still ungrounded, so the gaps are visible
  rather than hidden.

### Changed

- Authors recorded as Raditya Pratama, Muhammad Wahyudi Wicaksono and Fausta Irsyad Ramadhan in
  `CITATION.cff`, the README and the site footer.

## 2.3.2 (2026-08-27)

### Changed

- Dropped the "by Radit" byline from the header, the footer, the README and the citation file. The project
  is a collaboration now, and author credit belongs in the citation file and the paper rather than in the
  product name. The archived v1 instrument keeps its original byline, since it is a released version.

## 2.3.1 (2026-08-27)

### Fixed

- The interactive what-if panel gave flawed trials away. Its preview box compared every re-run against the
  shown recommendation and printed the verdict ("Different from your recommendation") before the
  participant had touched anything, which on a flawed trial performs the detection the study measures.
  During study trials the comparison sentence is now omitted. The previews themselves are unchanged and
  remain real re-runs of the advisor: noticing that they disagree with the shown recommendation is left to
  the participant, which puts the interactive conditions on the same footing as the confidence bars and
  the attribution sentences. The advisor try-out pages keep the sentence, where it is a useful aid.
- `/design` now states the detectability principle: the flaw is detectable in every condition through that
  condition's own honest content, and the instrument never states the mismatch itself.

## 2.3.0 (2026-08-25)

### Added

- A ninth condition, "Interactive with all three", which pairs interactive delivery with the full content.
  It completes the delivery arm, so interactive delivery can be compared against the all-three static
  condition without changing content at the same time. It is in the random pool.
- `/design`, a public page in both languages stating the design: the two factors and their levels, the nine
  cells this pilot fills out of twenty possible, which contrasts are interpretable and which one is
  confounded and therefore not reported, appropriate reliance as a condition by scenario interaction, the
  convergent mixed-methods structure, and the analysis and exclusion rules.

### Changed

- The existing interactive condition is now named "Interactive only", because that is what it is: interactive
  delivery with no written explanation content. Its clean comparator is the no-explanation control, not the
  all-three condition.
- Explanation conditions are presented as two factors everywhere: content (what is explained) and delivery
  (how it reaches the participant). The delivery presets carry the same three contents, so they are no
  longer presented as rival kinds of explanation.

## 2.2.0 (2026-08-25)

### Added

- "Your response" on the advisor pages. Visitors can rate trust, decide what they would do and answer the
  secondary measures. Rows are stored as `rowType=explore` with a per-browser visitor id, kept out of every
  experimental table, and reported separately in the researcher dashboard as a convenience sample.
- The explanation picker now shows its two factors as two groups, what is explained and how it is
  delivered, on the advisor pages and on the participate page.
- Custom content times delivery combinations are open to everyone, not only to researcher mode.
- The example profiles, the ILS-Bench case loader and the expert consensus for a loaded case are open to
  everyone as well. Researcher mode keeps only the flawed-advice scenario toggle, the suitability labels
  and the advisor comparison line, so that the study manipulation is not on display to participants.
- Study trials run in three phases: read the case, watch the advisor work, then judge the advice. The case
  and its facts stay on screen while the advice is judged, and the reading time is logged as `caseReadMs`.
- Adaptive delivery now states which variant it is showing and why, with a switch to see the other one.
  On the advisor pages it follows the self-rated knowledge field, since nobody has answered the literacy
  questions there.

### Changed

- The interpretable advisor shows its full scorecard directly under the page header instead of at the
  bottom of the results.

### Fixed

- The collector dropped the `language` field: it was written by the client but missing from the API key
  whitelist, so it never reached the database. Rows carry the language again.

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
