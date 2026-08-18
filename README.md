<div align="center">

# AdviceIT by Radit

**An open research instrument for studying how explanations calibrate trust in AI investment advice.**

Two advisors learned from the same expert-validated data, one opaque and one transparent. Explanations you can compose from content and delivery. A study flow that measures whether people rely on advice appropriately. All in the browser.

[![Version](https://img.shields.io/badge/version-1.0.0-2f7fd0)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-1f7a4d)](LICENSE)
[![Data: CC BY 4.0](https://img.shields.io/badge/training%20data-ILS--Bench%20CC%20BY%204.0-7a5300)](https://doi.org/10.17632/w48mh2dtg5.1)
[![Stack](https://img.shields.io/badge/stack-vanilla%20JS%20%2B%20numpy-555)](#project-structure)
[![Runs in the browser](https://img.shields.io/badge/runs-in%20the%20browser-2f7fd0)](#quick-start)

**[Open the live app](https://raditya-p.github.io/AdviceIT/)** · [How it works](#how-it-works) · [Study design](docs/study-design.md) · [Design decisions](docs/design-decisions.md) · [Changelog](CHANGELOG.md)

</div>

---

## Why this exists

People trust AI financial advice the wrong amount. Some follow flawed advice, some reject sound advice. My systematic literature review on trust and algorithm aversion in the choice between human and AI financial advisors (SSRAAI 2026) described that problem. AdviceIT is the design-side follow-up: an instrument for asking **which way of explaining AI advice helps people rely on it appropriately, following it when it is sound and overriding it when it is flawed**, and whether financial literacy changes the answer.

It is a research instrument, not a financial service. Nothing here is investment advice.

## What is inside

| | |
| --- | --- |
| **Two advisors, same data** | A neural network (the AI advisor) and an interpretable rule-based advisor (a scorecard fitted by logistic regression), both trained on ILS-Bench, 400 investor cases whose suitability labels and outcomes were validated by a panel of four financial-domain experts. One opaque, one transparent, so explanation fidelity becomes a factor. |
| **Six outcomes** | Capital preservation, Conservative, Balanced, Growth, Aggressive growth, or **Human review**. The experts refused to automate almost half the cases. Both advisors learned when to hand off to a person. |
| **Explanations as content times delivery** | Content: *why* (exact contributions or exact Shapley values), *what would change it* (counterfactuals found by search), *how sure* (calibrated probabilities). Delivery: static, interactive what-if, adaptive to literacy, or conversational with a language model running in the browser. Eight named presets, any custom combination. |
| **Sound and flawed advice** | The flawed scenario shifts the recommendation two portfolios the wrong way while the explanation stays honest. Following sound advice and overriding flawed advice is appropriate reliance, computed per condition. |
| **A full study flow** | Consent, the Lusardi and Mitchell literacy questions, six fixed cases in an order seeded by the participant ID, an attention check, a debrief. Between-subjects assignment through the URL, hidden from the participant. |
| **Rich responses** | Trust, Follow / Adjust (to which portfolio) / Reject / Ask a human adviser, understanding, decision confidence, mental demand, free-text reason, decision time. |
| **Analytics** | Reliance, trust, time and secondary measures per condition and advisor, computed from the collected responses, with CSV export. |
| **Transparency about the AI** | A Training data page with the dataset, live statistics over the 400 cases, the cross-validated results and confusion matrix read from the exported weights, every case to browse, and a benchmark of the language-reading step. |

## Quick start

No installation, no build step.

```bash
# Option A: just open it
open index.html          # or double-click the file

# Option B: serve it (needed for the conversational condition and the language-reading benchmark)
python3 -m http.server 8000
# then open http://localhost:8000
```

The conversational delivery, the free-text reading and the benchmark run an open-weight language model **inside the browser** through [WebLLM](https://github.com/mlc-ai/web-llm). They need a WebGPU browser (recent Chrome or Edge, Safari 18), the page served over http, and an internet connection the first time to download the model (0.4 to 2.2 GB, then cached). Everything else works offline from a double-click.

Deploy anywhere that serves static files. The empty `.nojekyll` file makes GitHub Pages serve the folder as is.

## The pages

| Page | What it is |
| --- | --- |
| `index.html` | **AI advisor.** The neural network. Home page. |
| `interpretable.html` | **Interpretable rule-based advisor.** The scorecard fitted on the same data. Same shell, exact explanations. |
| `training-data.html` | **Training data.** ILS-Bench, its statistics, the training results, all 400 cases, the language-reading benchmark. |
| `analytics.html` | **Analytics.** The researcher view over collected responses. |
| `references.html` | **References.** The dataset, the essential literature behind the design, the tools and models. |

The two advisor pages are generated from one shell by `tools/make_pages.py`, so their logic cannot drift apart. In researcher mode each page also says what the other advisor would answer for the same profile.

## How it works

```mermaid
flowchart LR
    A[Profile form<br/>or free-text description] --> B[Suitability labels<br/>tolerance, capacity, liquidity need, age]
    B --> C1[AI advisor<br/>neural network]
    B --> C2[Interpretable rule-based advisor<br/>logistic regression scorecard]
    C1 --> D[Outcome<br/>five portfolios or Human review]
    C2 --> D
    D --> E[Explanation<br/>content x delivery]
    D --> S[Scenario<br/>sound or flawed]
    S --> E
    E --> F[Response<br/>trust, decision, measures]
    F --> G[Session log<br/>CSV, JSON, Analytics]
```

### 1. From the form to suitability labels

Both advisors speak the vocabulary of ILS-Bench. Three documented rules in `model.js` turn the form into it:

| Label | Rule |
| --- | --- |
| Risk tolerance | stated Low / Medium / High becomes Low / Moderate / High. *Inconsistent* only when a written description shows conflicting attitudes. |
| Risk capacity | emergency fund and stable income: High. One of them: Moderate. Neither: Low. |
| Liquidity need | horizon 1 to 2 years: Urgent. 3 to 5: High. 6 to 10: Moderate. 11 or more: Low. |

Age is the fourth input. Optionally, the in-browser language model reads a free-text description into the form fields, following the benchmark's own language-to-suitability procedure, filling only what it found and flagging inconsistent risk attitudes.

### 2. Two advisors, trained on expert judgements

Both are trained by `ml/train_model.py`, written from scratch in numpy, seeded and reproducible, and exported to `ml_weights.js` for inference in plain JavaScript.

| | AI advisor | Interpretable rule-based advisor |
| --- | --- | --- |
| Model | Multilayer perceptron, 12 inputs, two hidden layers of 16 units, 6 outputs | Multinomial logistic regression, 12 inputs, 6 outputs |
| Cross-validated accuracy (5-fold, 3 repeats) | **88.8 %** (sd 3.2), macro-F1 0.84 | **87.7 %** (sd 2.8), macro-F1 0.82 |
| Human review recall (out of fold) | 0.96 | comparable |
| Calibration (temperature scaling) | ECE 0.062 to 0.022 | ECE 0.047 to 0.019 |
| Training accuracy, reproduced in JS | 94.0 % | 92.2 % |
| Explanations | Post hoc: exact Shapley values, model-agnostic counterfactuals, calibrated probability | Exact: contributions read from the weights, same counterfactual search, calibrated probability |

Reference points from the same file: majority class 47.0 %, a lookup table over the label combinations 88.7 %, and the dataset author's own draft labels agreed with the expert consensus 88.2 % of the time. Once the labels are known, the mapping is largely rule-like. The value of the two learned advisors is elsewhere: expert-grounded escalation, calibrated probabilities, and a clean opaque-versus-transparent comparison with the origin of the rules held constant.

### 3. Explanations: content times delivery

An explanation condition is a combination of **what** is explained and **how** it is delivered. Both parts are logged, so they can be analysed as two factors.

| Content | How it is computed |
| --- | --- |
| Why (feature-based) | Interpretable advisor: contribution of each input to the evidence for the outcome, read from the weights, exact and additive in log-odds. AI advisor: exact Shapley values of the probability of the outcome over the five form inputs (all 32 coalitions, evaluated in the browser). Both reconcile to a printed total. |
| What would change it (counterfactual) | The advisor is re-run over each input's range to find the smallest single change that flips the outcome. Model-agnostic, true by construction, shown with change chips. |
| How sure (confidence) | Calibrated probability of the outcome with a bar per outcome, and a note that confidence displays can help or hurt calibration. |

| Delivery | What it adds |
| --- | --- |
| Static | The content as it is. |
| Interactive what-if | A copy of the inputs the participant can move, with the outcome, probabilities and contributions updating live. "Ignore this input" switches. A "why not X?" selector with a contrastive explanation found by search. Moves are logged. |
| Adaptive to literacy | Plain sentences for a low Big Three literacy score, bars and probabilities for a high score. The three literacy questions appear with this delivery. |
| Conversational | An open-weight model (Llama 3.2 or Qwen 2.5) in the browser through WebLLM, grounded on the ticked content as its only source, with a follow-up chat. Its text is logged verbatim. |

Presets: No explanation, Why, What would change it, How sure, All three (hybrid), Interactive what-if, Adaptive to literacy, Conversational. Anything else is Custom.

### 4. Measuring appropriate reliance

Sound advice is the advisor's real outcome. **Flawed advice** shifts it two portfolios in the wrong direction (a Human review outcome becomes an automated portfolio). The explanation still describes the advisor's real reasoning, so the mismatch is detectable. Every response records the scenario, the shown outcome and the sound one. Appropriate reliance is the follow rate on sound advice and the override rate on flawed advice.

### 5. Running a study

Researcher mode shows everything. Participant mode is entered through the URL and hides the researcher controls:

```
index.html?mode=participant&pid=P07&cond=counterfactual&scenario=flawed
index.html?mode=participant&pid=P08&content=feature,confidence&form=interactive
index.html?mode=participant&pid=P09&flow=study
```

- `cond` picks a preset (random among all but the conversational one if absent). `content` and `form` set a custom combination.
- `flow=study` runs the full procedure: consent, the three literacy questions, six fixed hypothetical cases in an order seeded by `pid`, half sound and half flawed, one attention check, a debrief that names the flawed cases. `trials=N` sets the length.
- Every response is appended to the session log (localStorage, CSV and JSON export). `analytics.html` turns the log into rates per condition.

## Reproduce the models

```bash
cd ml
pip install numpy openpyxl
python3 fetch_ils_bench.py     # downloads ILS-Bench from Mendeley Data, writes data/ils_bench_cases.csv and ../ils_bench_cases.js
python3 train_model.py         # cross-validates and trains both advisors, prints every number above, writes ../ml_weights.js
```

Both scripts are seeded. Re-running them reproduces the same weights file.

## Project structure

```
AdviceIT/
├── index.html              AI advisor (home)
├── interpretable.html      interpretable rule-based advisor (generated from index.html)
├── training-data.html      dataset, statistics, results, cases, benchmark
├── analytics.html          researcher analytics
├── references.html         references and tools
├── styles.css
├── app.js                  wiring: form, conditions, study flow, log
├── model.js                label rules, outcome vocabulary, example profiles
├── ml_model.js             neural-network advisor, exact Shapley values
├── logit_model.js          interpretable rule-based advisor
├── ml_weights.js           trained weights and training metadata (generated)
├── explanations.js         feature, counterfactual, contrastive, confidence
├── llm.js                  WebLLM: conversational delivery, narrative reading
├── study.js                study flow: cases, seeded plan, texts
├── session.js              session log, CSV and JSON export
├── training-data.js        training-data page renderer and benchmark
├── analytics.js            analytics page renderer
├── ils_bench_cases.js      the 400 cases (generated)
├── serve.py                optional local server that also collects responses
├── ml/
│   ├── fetch_ils_bench.py  download and extract the dataset
│   ├── train_model.py      train, cross-validate, calibrate, export
│   └── data/               ils_bench_cases.csv
├── tools/make_pages.py     regenerate the derived advisor page
├── docs/                   study-design.md, design-decisions.md
└── CITATION.cff, CHANGELOG.md, LICENSE
```

## Data

The advisors are trained on **ILS-Bench**: Bonelli, M. (2026). *ILS-Bench: Investor Language-to-Suitability Benchmark*. Mendeley Data, V1. https://doi.org/10.17632/w48mh2dtg5.1. Licence CC BY 4.0. Four hundred AI-assisted synthetic investor narratives, each validated by four independent financial-domain experts, with consensus labels for risk tolerance, risk capacity, liquidity need, suitability risk, recommended outcome and human escalation. No real client data. `ml/data/ils_bench_cases.csv` and `ils_bench_cases.js` are extracts of its Cases_Consensus sheet, unchanged apart from column selection.

## Study design in one paragraph

Between-subjects on explanation condition (content times delivery) and advisor type, with sound and flawed trials within each participant and financial literacy as a measured moderator. Dependent variables: appropriate reliance, trust, decision time, the adjusted portfolio, deferral to a human, and the secondary measures. Analysis: mixed-effects models with participant as random effect. Ethics: consent, hypothetical cases, no real advice, debrief about the flawed trials. Full text in [docs/study-design.md](docs/study-design.md), reasoning in [docs/design-decisions.md](docs/design-decisions.md).

## Limitations, plainly

- ILS-Bench is small (400 cases) and its narratives are synthetic, although the labels are expert-validated. Once the labels are known, the mapping to an outcome is largely rule-like.
- The language-reading step uses a small in-browser model. The benchmark on the Training data page makes its errors visible, but no run has been recorded yet.
- No participant data collected yet. Nothing here is a result. The interactive, adaptive and conversational deliveries and the study flow await their first pilot.
- Model portfolios are stylised, not calibrated to a regulatory suitability standard.

## Citing

If you use AdviceIT, please cite it (GitHub shows a "Cite this repository" button from `CITATION.cff`) and cite the dataset, Bonelli (2026), as well.

## Author

**Raditya Pratama** · radityapratama2077@gmail.com

Built as an extension of my SSRAAI 2026 systematic literature review on trust and algorithm aversion. Released under the MIT licence.
