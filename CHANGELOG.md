# Changelog

All notable changes to the AdviceIT website are recorded here, starting at 2.0.0.
The version shown in the site footer, `package.json` and `src/lib/version.ts` move together.

## 2.12.0 (2026-10-01)

An audit pass, balanced assignment and a new mark. Most of it protects the data the study collects.

### Added

- **Balanced assignment.** Simple randomisation over sixteen cells (eight explanation conditions times
  two advisors) leaves a pilot-sized sample badly uneven, some cells with one or two people and others
  with seven or eight. A participant who starts through the plain way in is now placed, at consent, in
  the cell with the fewest people so far, ties broken at random, the way Gorilla's balanced randomiser
  and Qualtrics' "evenly present" work. A cell counts everyone who finished in it plus everyone given it
  in the last two hours, so an abandoned session gives its place back. `POST /api/assign` does this in
  one locked transaction, so two people starting at once cannot both land in the emptiest cell. If it
  cannot answer within four seconds the condition drawn in the browser stands, and every row records
  `assignmentMethod` as `balanced`, `simple` or `url`. No migration: assignments are rows of a new
  type, `assign`, in the existing table, and only the server can write them.
- **Dropout per condition.** The assign rows say who started in which cell, so the dashboard now shows
  started, finished and dropout per condition. A condition that loses more people than the others
  threatens the comparison on its own, and until now it was invisible.
- `scripts/sql-smoke.ts`, twenty checks that run the collector's own SQL on an in-memory Postgres
  (PGlite): a resent row is skipped and a new one is not, sixteen starts fill sixteen cells, abandoned
  sessions free their cell, finished ones keep it, chosen sessions never count. Each assignment case is
  built so the right rule and the wrong one pick different cells, so a regression cannot pass by luck.
- `scripts/records-smoke.ts`, nineteen checks on the response buffer against a fake collector: a row
  waits while offline, a 120-row backlog drains in accepted batches, long free text is split by size,
  a refused batch is dropped without blocking the rows behind it, a server error keeps everything.
  Restoring the old one-request buffer makes four of them fail, starting with "0 of 121 rows stored".
- Contact details in the consent and the debrief. Both promised that the researcher could be contacted
  and named nobody.
- A copy button for the completion code.
- Link previews: Open Graph and Twitter metadata and a preview image drawn at build time, so a link
  shared in a chat shows a card instead of a bare address. Page descriptions, `robots.txt`, a sitemap, a
  404 page in the site's own design, and `noindex` on the dashboard and the session page.
- Two analysis toggles on the dashboard, random assignment only and excluding participants who failed the
  attention check. The tables count duplicate rows once. The CSV downloads stay the raw rows.
- `npm run typecheck`, a Node 20.9 floor in `engines`, and a GitHub Actions workflow that runs the type
  check, lint, the six verification scripts and a production build on every push and pull request.

### Changed

- **A new mark.** A dial with three zones, too little trust, appropriate trust and too much, with the
  needle resting in the middle one, because that is the question the study asks. The zones are the
  slate, blue and amber of the site palette. It replaces the banknote, which read as a money app. The
  favicon follows the browser's light or dark tab, the copies in `public/brand` have the wordmark
  outlined from Instrument Sans so they render the same without the font, and the README opens with it.
- Functions run in Singapore (`sin1`, set in `vercel.json`), next to the participants and the Neon
  database in `ap-southeast-1`. They ran in Washington, so every saved response crossed the Pacific twice.
- The consent describes the session as it is: three knowledge questions and nine short statements before
  the cases, a few ratings and two open questions after.
- Participants in the no-explanation control no longer rate "the explanations" they never saw. They skip
  the five perception items, which stay empty and read as missing, not as low.
- The dashboard sends the key in an `Authorization` header instead of the query string, which request logs
  record. `?key=` still works for scripts. `GET /api/responses` returns pages of 1,000 rows with a `next`
  cursor, because the whole data set would pass the 4.5 MB response ceiling after a few hundred
  participants, and the dashboard follows the pages.
- CSV export prefixes text cells that start like a spreadsheet formula with an apostrophe. The free text
  comes from anonymous visitors.
- The 400 ILS-Bench cases (345 KB) load on the first click of "Load an ILS-Bench case" instead of shipping
  with every advisor and study page.
- The privacy page lists everything a session records, including the nine statements before the cases,
  the five explanation ratings at the end, the device type and the resume count.
- Security headers (`nosniff`, a referrer policy, a permissions policy) and no `x-powered-by`.

### Fixed

- **A browser could stop delivering rows for good.** The client sent its whole offline buffer in one
  request, and the collector refuses more than 50 rows. A shared lab machine that buffered past 50 during
  an outage had every later request refused, silently. The buffer now drains in batches the collector
  accepts, and a batch the server refuses as invalid is dropped instead of being resent for ever.
- **A failed insert could duplicate rows.** Rows were inserted one by one, so an error part way through
  stored some of the batch, and the client's retry stored them again. Each batch is now one transaction,
  and the collector skips a row it already holds (same participant, type, trial and client timestamp),
  so resending a batch whose answer was lost is harmless too.
- **Random assignment could leak through a shared link.** The start button put the drawn condition in the
  address (`/study?cond=none&by=random`). A participant who passed that link on sent the next person into
  the same cell, logged as random. The address no longer carries a drawn condition, so a shared link
  draws afresh. A chosen style still travels in the address, marked as chosen.
- **The advisor and participate pages failed hydration in every WebGPU browser** (React error 418, most
  Chrome and Edge visitors). Both read `navigator.gpu` while rendering, which the server cannot see. The
  check now goes through `useSyncExternalStore`, and so does the researcher-access check.
- **Keyboard focus fell off the what-if controls after every press.** Two of its components were defined
  inside the panel's render, so React rebuilt them on each change. This was the interactive condition.
- A researcher link with an unusual participant id (`?pid=P 07`) had every row refused by the collector
  while the participant was told the answers were saved. The id is now cleaned to what the collector
  accepts before the session starts.
- A hand-edited `?cond=toString` crashed the study page, because `in` also matches inherited object keys.
- A double click on the last button of the exit questionnaire could send the exit row twice.
- The request size cap is checked on the bytes received, not only on the declared length.
- `npm run lint` failed on twenty errors already on main. It passes now, which the new CI needs.
- The advisor page said the study takes ten minutes, everywhere else says fifteen. It said nothing is
  stored on a page that offers to store an optional response.

## 2.11.3 (2026-09-17)

### Changed

- Home page copy is tightened. Comma-heavy sentences are rewritten so a comma is only used where it
  carries grammatical weight, which suits the research framing better than the looser earlier wording.
  The count across the page drops from 55 to 4, all of them in one genuine list. Meaning is unchanged
  and the Indonesian copy is rewritten to match.

## 2.11.2 (2026-09-11)

### Fixed

- Minor UI fixes. Buttons that carry a trailing arrow had uneven left and right padding, and an extra
  space sat between the label and the icon in twenty places. The logo mark is larger, so it reads at
  the same weight as the wordmark, and the note now carries three figures with the middle one taller.

## 2.11.1 (2026-09-11)

### Changed

- The mark is redrawn. The note sits straight and carries a white head and shoulders silhouette in
  place of the brain, which was too large for the note and lost its shape at small sizes. The app icon
  and the copies in `public/brand` match.

## 2.11.0 (2026-09-11)

### Changed

- New logo. The mark is a brain in front of a banknote, replacing the A whose crossbar was a slider.
  `public/brand` gains a dark copy of the standalone mark.

## 2.10.0 (2026-09-09)

### Added

- **A study session survives leaving the page.** Someone who has answered four cases and closes the
  tab comes back to case five, in the same condition, with the same participant ID and advisor, and
  with the literacy and personal characteristics answers they already gave. A short notice at the top
  says where they left off and offers to start a new session instead. The exit questionnaire's free
  text is kept too, so a session abandoned on the last screen is not lost.
- Two fields per row, `sessionResumes` and `sessionElapsedMs`. A session run in one sitting has zero
  resumes and a short elapsed time. A session picked up three days later says so, which lets the
  analysis treat it separately rather than discover it by accident.
- `scripts/session-smoke.ts`, twenty-three checks over the session store: the round trip, the deadline,
  rejection of corrupt or foreign records, snapshot stability, and cleanup.

### Notes on the design

- **A session is resumed at the start of a case, never inside one.** Someone returning to case five
  reads its description again from the beginning. Resuming mid-case would either lose the reading time
  or record a judgement made from memory of a case read hours earlier, and case reading time is a
  measure in this study.
- **The condition travels with the session, not with the link.** A restored session carries its own
  condition, advisor and participant ID, so returning through a different link, or refreshing to see
  what else is on offer, cannot move anyone into another cell.
- **Nothing is written before consent.** The store is created when the person agrees to take part and
  deleted the moment the exit questionnaire is submitted. It expires on its own after a week, because a
  session spread over more than that is not the session the design assumes. The consent text and the
  privacy page both say this now, with a new section on the privacy page listing everything this site
  keeps in the browser.

## 2.9.2 (2026-09-07)

### Fixed

- The age field could not be typed into. It clamped to 18 to 80 on every keystroke, so typing "4" on
  the way to "45" snapped to 18 and the next digit made "185", which snapped to 80. The what-if panel's
  age field had the mirror image of the problem and silently rejected any keystroke that left the number
  out of range. Both now use a shared number field that keeps the typed text, applies the value as soon
  as it is in range, and clamps once when the field loses focus.

## 2.9.1 (2026-09-06)

### Changed

- The home page's explanations section is back to the four-card "Four ways to ask why" version from
  2.8.1. The split into content and delivery introduced in 2.8.3 is undone on the home page. The colour
  key on the outcomes section stays.

## 2.9.0 (2026-09-06)

Gap audit of the site and the code.

### Fixed

- The privacy page said the advisor pages record nothing at all. Since 2.2.0 the optional response panel
  there stores an anonymous tryout row, and the page now says so.
- The consent text said 10 to 15 minutes. With the two scales before the cases and the perception items
  after, the honest figure is about 15 minutes, and the consent, the participate page and the site
  description now agree on it.
- The participate page said "that is the whole session" before the questions before and after existed.
- The references page listed none of the works the explanation design and the study design rest on.
  Thirteen entries added under their own heading, each with the part of the site it supports.
- The README promised a confusion matrix on the training data page and there was none, although the
  data has always been in the exported weights. It is rendered now, cross-validated, with per-class
  recall.
- The design page's moderator list lacked need for cognition and ease-of-satisfaction.
- The researcher dashboard ignored the perception items and the personal characteristics. A table per
  condition now shows the five perception means, need for cognition and ease-of-satisfaction.

### Added

- A mobile menu. On small screens the navigation was hidden entirely, leaving only the language toggle
  and the participate button.

## 2.8.3 (2026-09-06)

### Changed

- The outcomes section on the home page now says what the bars are and carries a colour key for the four
  asset classes (global equities, bonds, cash and money market, real assets).
- The explanations section is split into the two parts an explanation actually has: what it explains
  (why, what would change it, how sure) and how it reaches you (static, interactive, adaptive,
  conversational). "Ask it" was a delivery type sitting in the content list, and the delivery types had no
  section at all.

## 2.8.2 (2026-09-06)

### Changed

- **The four response ratings are required, and they are buttons now.** Trust, understanding, decision
  confidence and mental demand are a row of seven large buttons each, always visible, and a submit with
  any of them unanswered is refused with the missing ones highlighted. The collapsed "a few more
  questions" panel is gone. A slider always shows a value, so a required slider would have logged untouched
  4s as answers; a button row can be genuinely blank until the person chooses. The free-text reason stays
  optional. Applies to study trials and to the try-out response panel alike.
- The sliders that remain (investment horizon, the what-if controls) have a thumb twice the size, a thicker
  track and a larger hit area.

### Note for the analysis

Rows collected before 2.8.2 have ratings that default to 4 when untouched. Rows from 2.8.2 on have no
default. Treat the two as separate batches if the pilot straddles the change.

## 2.8.1 (2026-09-06)

### Changed

- The three-step "What the advisor does" section is back on the home page, directly after the hero.
- "Why this matters" carries its two explanatory paragraphs again, beside the heading in the two-column
  layout, with the two-sentence summary as the lead. Section backgrounds re-alternated to suit.

## 2.8.0 (2026-09-06)

### Changed

- **Home page redesigned around the two advisors.** After the hero, which keeps its headline and loses one
  paragraph, the page is: the two advisors side by side, each with a visual computed from the real model
  (the AI advisor's contribution bars for an example investor, three rows of the interpretable advisor's
  actual scorecard), the four explanation styles, the five outcomes as real allocation bands plus the
  human-review option, a two-sentence "why this matters", and the study last. Every number and bar on
  the page comes from the advisors at render time, nothing is drawn.
- The interpretable advisor is back in the header navigation.
- The About page no longer shows the logo and its explanation in the hero. The mark stays in the header,
  the footer and the browser tab.

## 2.7.0 (2026-09-06)

### Changed

- **The home page introduces the advisor first.** The primary button is "Try the advisor", the study is
  the secondary button and gets its own section at the end, after the visitor knows what the advisor is.
  The three steps now describe the advisor (describe an investor, get a recommendation, see why in the
  style you choose) rather than the study. The facts strip describes the site (runs in your browser,
  nothing stored, no real money, two minutes to try). A link to the fully transparent advisor sits under
  the steps.
- **Tighter hero.** Top padding roughly halved and the grid aligned to the top, so the headline starts
  where it did before the participant-facing copy was added.
- **No trust cues in the conversational condition during study sessions.** The "written by a language
  model, it can be wrong" label added in 2.6.0 is removed everywhere: a warning that exists only in one
  condition would confound the delivery contrast and suppress exactly the reliance the study measures.
  For the same reason the "computed by the advisor" badge on routed answers now shows only on the
  try-out pages, never in a study session. Consent and debrief remain the places that tell participants
  some advice is deliberately wrong.

## 2.6.2 (2026-09-06)

### Changed

- Copy pass for tone. The "Why this matters" section on the home page is rewritten as a two-column
  argument in three short paragraphs, with a heading that states the point rather than a slogan. Section
  headings across the home and About pages are plainer: "What a session looks like", "Design, data and
  methods", "Take part in the study". The home preview no longer prints raw attribution points beside the
  drivers, it says whether each one supports the recommendation or weighs against it.

## 2.6.1 (2026-09-06)

### Added

- A logo. The mark is an A whose crossbar is a slider with a knob: advice you can adjust, and trust you
  can calibrate. Brand blue square, white strokes, teal knob. The wordmark sets "Advice" in the foreground
  colour and "IT" in the brand blue, in the heading face. Both are inline SVG and text in
  `src/components/brand.tsx`, so they follow the theme. Static copies for slides and papers are in
  `public/brand` (mark, light logo, dark logo), and the mark is the site icon.

## 2.6.0 (2026-09-06)

Fifteen points of feedback from the team's QA review, applied.

### Changed

- **Participants first.** The home page now speaks to a participant: the headline is followed at once by
  "this is a research simulation, not a financial service", the facts strip (about 15 minutes, anonymous,
  no account, no real money) sits under it, and the two paths are one button each. The accuracy numbers,
  the feature cards and the Shapley, calibration and WebLLM vocabulary are gone from the front page.
- **Researchers one click deeper.** New `/about` page: what the site is in plain words, the team and each
  person's role, where the work comes from, and a "for researchers and reviewers" doorway to the design,
  the data, the references, the dashboard and the code. The header now reads Try the advisor, About, For
  researchers. The footer separates participant links from researcher links. `/design` opens with a note
  saying who it is for.
- **Taking part is one path.** The participate page's button is "Start the study" with "we pick the kind of
  explanation you will see". Choosing a style yourself is inside a collapsed panel marked optional.
- **Accuracy figures carry their context** everywhere, in one format: "88.8% cross-validated accuracy on
  400 expert-reviewed synthetic cases", never a rounded 89. The training-accuracy row on the data page is
  labelled as training accuracy and says why it is higher. The confidence figure in the home preview is
  labelled as the advisor's confidence, not a return.
- **Training data page opens with a summary.** The distributions and headline figures show first. The
  full results table and the 400-case browser sit behind disclosures.
- **Model-written chat answers are labelled** as written by a language model that can be wrong, the mirror
  of the "computed by the advisor" label on routed answers.
- **Team credit.** The About page states the roles: Raditya Pratama, lead developer and research design.
  Fausta Irsyad Ramadhan, AI ecosystem and core resources. Muhammad Wahyudi Wicaksono, quality assurance
  and research validation.

### Security

- `?researcher=1` no longer unlocks anything on its own. The researcher controls on the advisor pages
  open only after the dashboard has validated the key in the same browser session.
- The collector rate-limits by IP (best effort, per instance), caps the payload at 256 KB, pattern-checks
  participant ids, compares the researcher key in constant time, and marks every response `no-store`.
  `GET ?check=1` validates the key without returning data. The README documents the security model and
  its limits.

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
