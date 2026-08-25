# AdviceIT (web)

The public research website of **AdviceIT by Radit**: an open study on which explanations help people trust AI
investment advice the right amount. Next.js App Router, TypeScript, Tailwind CSS 4, shadcn/ui (radix-nova), with the
verified advisor logic ported from the original static instrument (`../AdviceIT`, kept as the working archive).

Version 2.0.0 (see `CHANGELOG.md`). The whole site, including the study flow and the generated explanations, runs in
English and Bahasa Indonesia via the header toggle. Logged values stay English canonical and each row records the
participant's language.

Nothing on this site is financial advice.

## What is here

| Route | What it is |
| --- | --- |
| `/` | Hero homepage: try the two advisors, why the research exists, participate CTA, researcher-mode entry in the footer. |
| `/advisor/ml`, `/advisor/logit` | The advisor playgrounds (try mode, nothing recorded). `?researcher=1` unlocks the scenario toggle, suitability labels, advisor comparison, example profiles and the ILS-Bench case loader. |
| `/participate` | The seven explanation-style cards. Primary button assigns randomly (logged as `random`); choosing a card is allowed (logged as `chosen`). "No explanation" stays in the random pool as the control. |
| `/study` | The full flow: consent, Big Three literacy questions, six trials (half sound, half flawed, order seeded by the participant ID), one attention check, exit questionnaire, debrief, completion code. The advisor is randomised per participant. Researcher links: `/study?cond=<preset>&pid=P07` or `/study?content=feature,confidence&form=interactive`. |
| `/training-data` | ILS-Bench: description, citation, live statistics, the two-advisor results table, all 400 cases to browse. |
| `/researcher` | Key-gated dashboard: reliance, trust, time, secondary measures, attention checks, literacy moderator, exit answers, CSV download. |
| `/references`, `/privacy` | References and tools, privacy and consent. |
| `POST /api/responses` | The collector. Sanitised, capped, key-whitelisted rows into Neon. `GET` requires `RESEARCHER_KEY`. |

The advisors (a neural network and an interpretable logistic-regression scorecard, both trained on the expert-validated
ILS-Bench dataset), the explanation computations (exact Shapley values, counterfactual search, contrastive why-not,
calibrated confidence), the in-browser language model (WebLLM), and the seeded study plans are byte-for-byte ports of
the v1 logic. `scripts/verify.ts` re-checks all of it: both training accuracies reproduced exactly, Shapley efficiency,
counterfactual truth, plan seeding, the scorecard.

```bash
npx tsx scripts/verify.ts       # 22 checks, all must pass
npx tsx scripts/i18n-smoke.ts   # EN output byte-identical, ID translations complete
npx tsc --noEmit                # types
```

Note: production builds need roughly 2 GB of free memory. On small machines skip local builds entirely and let Vercel
build (below).

## Deploy: Vercel + Neon

**1. Create the database (Neon, free tier).**

- neon.tech, create a project, open the SQL editor and run the contents of `db/schema.sql` (one table, two indexes).
- Copy the pooled connection string (Connection details), it becomes `DATABASE_URL`.
- Already done for this deployment (2026-08-25): schema applied and roundtrip-tested, credentials in `.env.local`
  (gitignored, never commit it).

**2. Push this folder to GitHub.**

```bash
cd adviceit-web
git add -A && git commit -m "AdviceIT web 1.0.0"
git remote add origin https://github.com/Raditya-P/adviceit-web.git
git push -u origin main
```

**3. Import into Vercel (free Hobby tier).**

- vercel.com, Add New Project, import the `adviceit-web` repository. Framework is detected as Next.js, defaults are
  fine. The build runs on Vercel's machines.
- Project Settings, Environment Variables, add:
  - `DATABASE_URL` = the Neon pooled connection string
  - `RESEARCHER_KEY` = a long random string (this gates the collected data, keep it private)
- Deploy. The site is live at `https://<project>.vercel.app`. Later pushes to `main` redeploy automatically.
- Optional: add a custom domain under Settings, Domains.

**4. Smoke-test the deployment.**

- Open the homepage, try both advisors, run `/participate` into a full study session, and check the row count on
  `/researcher` with your key.
- The conversational condition and the narrative reading need a WebGPU browser (recent Chrome or Edge). They are
  excluded from random assignment automatically and the cards say so.

## Data

One table, `responses`: `participant_id`, `row_type` (`trial` or `exit`), `condition`, `advisor`, `scenario`,
`created_at`, and the full sanitised row as `payload` (jsonb). Rows are anonymous by construction: no name, email, IP
profile or tracker exists anywhere in the flow. Participants get a random ID and a completion code derived from it
(`completionCode` in `src/lib/study.ts` verifies claims). The client buffers rows in localStorage when the network or
the database is unavailable and flushes them on the next successful submit.

Assignment audit fields: `assignedBy` (`random` or `chosen`) for the explanation condition and `advisorAssignedBy`
(always `random`). Analyse the `random` stratum as the experiment; `chosen` rows are a quasi-experimental stratum and a
preference signal in their own right.

## Design notes

- Mixed methods: the quantitative core (reliance, trust, time, understanding, confidence, demand, literacy) plus
  embedded qualitative strands (per-trial reasons, the two exit questions, and the logged LLM transcripts in the
  conversational condition).
- This deployment is a pilot to develop the instrument. The consent text says so, and pilot data is not for
  publication before a formal ethics review.
- Training data: Bonelli, M. (2026). ILS-Bench, Mendeley Data, V1, doi:10.17632/w48mh2dtg5.1, CC BY 4.0.
- The v1 static instrument in `../AdviceIT` remains the reference implementation, including the language-reading
  benchmark tooling and the recorded benchmark CSVs.

Raditya Pratama · MIT licence
