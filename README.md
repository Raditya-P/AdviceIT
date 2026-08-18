# AdviceIT by Radit

An interactive research instrument for studying how explanation styles calibrate trust and appropriate reliance on AI investment advice. Two advisors learned from the same expert-validated data (a neural network, and an interpretable rule-based advisor: a scorecard fitted by multinomial logistic regression), explanation conditions defined by content (why, what would change it, how sure) and delivery (static, interactive what-if, adaptive to literacy, conversational LLM), a full study flow with consent, literacy check, seeded sound and flawed trials, attention check and debrief, and an analytics page over the collected responses.

Version 1.0.0. License: MIT (code). Training data: ILS-Bench, CC BY 4.0, see Data below.

Five pages, all in the top navigation: `index.html` is the AI advisor (neural network trained on ILS-Bench), `interpretable.html` the interpretable rule-based advisor (a scorecard fitted on the same data by logistic regression, exact explanations), `training-data.html` the dataset with a link to it, live statistics, training results, a searchable table of every case and a benchmark of the language-reading step, `analytics.html` the researcher view over collected responses, and `references.html` the references and tools. The two advisor pages are generated from one shell (`tools/make_pages.py`) and share every script and style.

Live: https://raditya-p.github.io/AdviceIT/

## What this is

AdviceIT by Radit is a research instrument for explainable AI (XAI) in financial advice. It extends my systematic literature review of trust and algorithm aversion in the choice between human and AI financial advisors (SSRAAI 2026): the review described the problem of miscalibrated trust, and AdviceIT is a first step toward the design-side answer. It combines two advisors (a neural network trained on ILS-Bench, 400 expert-validated suitability cases, and a rule-based scorecard whose weights are set by hand from suitability practice), five explanation conditions (none, feature-based, counterfactual, confidence, conversational LLM), a free-text description that the in-browser language model reads into the form, participant links for a between-subjects study, and a session log with CSV and JSON export, optionally collected on your own laptop. Both advisors can answer "Human review" instead of a portfolio, as the expert panel behind the dataset did.

Try it: load an example profile, switch the explanation conditions and the scenario, open the other advisor pages from the navigation to compare, submit responses, open Analytics. Or open the full study flow from the researcher controls to see what a participant goes through.

## How to run locally

Option A: double-click `index.html`. Everything except the conversational (LLM) condition works this way.

Option B (recommended): in a terminal inside the folder, run

```
python3 serve.py
```

then open `http://localhost:8000` in your browser. This uses only the Python standard library. It serves the app and also collects responses (see "Your laptop as the study server" below). `python3 -m http.server 8000` also works if you only want to serve the files.

The conversational (LLM) condition needs Option B (or the GitHub Pages link), a browser with WebGPU (recent Chrome or Edge, Safari 18), and an internet connection the first time, to download the language model (0.4 to 2.2 GB depending on the model chosen). After that it is cached by the browser and runs on your GPU.

## Your laptop as the study server

`serve.py` turns your laptop into the server for a study session:

1. Connect your laptop and the participants' devices to the same Wi-Fi.
2. Run `python3 serve.py`. It prints your laptop's network address, for example `http://192.168.1.20:8000/`, and a ready-made participant link.
3. Give each participant their own link, for example `http://192.168.1.20:8000/?mode=participant&pid=P03&cond=counterfactual` for the AI advisor or `http://192.168.1.20:8000/interpretable.html?mode=participant&pid=P04&cond=counterfactual` for the interpretable rule-based advisor.
4. Every submitted response is stored in the participant's browser as before and is also sent to your laptop, where it is appended to `data/responses.jsonl`. The status line under the Submit button says "sent to the study server" when that worked.
5. At any time open `http://localhost:8000/api/responses.csv` on your laptop to download everything collected so far, or `api/responses.json`.

`data/` is listed in `.gitignore` so collected responses are never pushed to GitHub by accident. If the server is not running (for example on GitHub Pages) the app simply keeps the browser-side log and the CSV download.

Note: WebGPU only works on secure origins. `http://localhost` counts as secure, a network address such as `http://192.168.1.20:8000` does not, so on other devices the LLM condition needs the GitHub Pages https link, or Chrome started with `chrome://flags/#unsafely-treat-insecure-origin-as-secure` set to your laptop's address. All other conditions work over plain http.

## How to deploy to GitHub Pages

1. Create a public repository named `AdviceIT` under your GitHub account (Raditya-P).
2. Upload the files through the GitHub web interface, or from a terminal inside the folder:

```
git init
git add .
git commit -m "AdviceIT by Radit 1.0.0"
git branch -M main
git remote add origin https://github.com/Raditya-P/AdviceIT.git
git push -u origin main
```

3. In the repository, open Settings, then Pages.
4. Under Source choose "Deploy from a branch". Choose branch `main` and folder `/ (root)`. Save.
5. Wait one to two minutes. The site is live at https://raditya-p.github.io/AdviceIT/

Later pushes to `main` redeploy automatically. The empty `.nojekyll` file tells GitHub Pages to serve the folder exactly as it is.

## How the advisors work

There are two advisors, one per page, both learned from the same expert data. `index.html` (the home page) runs the neural network and `interpretable.html` the interpretable rule-based advisor, and the navigation bar switches between them. In researcher mode each page also shows, under the recommendation, what the other advisor would answer for the same profile. Both take the same profile and return one of six outcomes: five portfolios (Capital preservation, Conservative, Balanced, Growth, Aggressive growth) or Human review, the vocabulary of ILS-Bench.

### Shared vocabulary: suitability labels

Both advisors describe a profile with the three labels used by ILS-Bench, derived from the form by rules in `model.js` (`deriveSuitabilityLabels`):

| Label | Rule |
| --- | --- |
| Risk tolerance | stated Low / Medium / High becomes Low / Moderate / High. "Inconsistent" is set only when a written description shows conflicting risk attitudes (read by the language model). |
| Risk capacity | emergency fund and stable income: High. Exactly one of them: Moderate. Neither: Low. (ILS-Bench defines capacity as the ability to absorb losses given income, savings, debt and obligations.) |
| Liquidity need | horizon 1 to 2 years: Urgent. 3 to 5: High. 6 to 10: Moderate. 11 or more: Low. |

### The label rules (`model.js`)

Before either advisor runs, the profile form is turned into the three ILS-Bench labels by three documented rules (see the table above), and age is passed through. `model.js` holds these rules and the shared outcome vocabulary. It also still contains an illustrative hand-set suitability scorecard (`recommend`, identifier `glass`) with an escalation rule, kept for reference and not shown in the app: robo-advisor scoring rules are proprietary, so a hand-set scorecard can only ever be illustrative, and the app compares two advisors learned from the same expert data instead.

### Advisor 1: the AI advisor, a neural network (`ml/train_model.py`, `ml_weights.js`, `ml_model.js`)

A real machine-learning model, trained on real expert judgements and kept small enough to be inspected end to end.

- Data. ILS-Bench (Bonelli, 2026, Mendeley Data, doi:10.17632/w48mh2dtg5.1, CC BY 4.0): 400 AI-assisted synthetic investor narratives, each validated by a panel of four independent financial-domain experts (a retired portfolio manager, a senior trader, a FinTech executive and a FinTech academic), with consensus labels for risk tolerance (Low, Moderate, High, Inconsistent), risk capacity (Low, Moderate, High), liquidity need (Low, Moderate, High, Urgent), suitability risk, recommended portfolio class (the five portfolios or Human review) and human escalation. No real client data. `ml/fetch_ils_bench.py` downloads the file and extracts `ml/data/ils_bench_cases.csv` and `ils_bench_cases.js`.
- Procedure. The benchmark's pipeline is investor language, then structured suitability labels, then portfolio class or escalation. AdviceIT follows it: the network learns the second step from the expert consensus, and the first step is done either by the form rules above or by the in-browser language model reading a free-text description (see Language to suitability).
- Inputs and model. 12 inputs (one-hot tolerance, capacity and liquidity need, plus standardised age parsed from the narrative, present in all 400 cases), two hidden layers of 16 ReLU units, 6-way softmax. Adam, cross-entropy, L2 weight decay, 400 epochs, written from scratch in numpy.
- Evaluation, printed by the script and stored in `ml_weights.js` under `meta`: 5-fold stratified cross-validation repeated three times gives 88.8 percent accuracy (sd 3.2) and macro-F1 0.84 over the six outcomes, with Human review recall 0.96. Reference points from the same file: majority class 47.0 percent, a lookup table of the most common outcome per label combination 88.7 percent (cross-validated), and the dataset author's own draft label agreed with the expert consensus 88.2 percent of the time. Probabilities are calibrated with temperature scaling on the pooled out-of-fold logits (temperature 1.59, expected calibration error from 0.062 to 0.022). The final model is trained on all 400 cases (training accuracy 94.0 percent) and its JavaScript forward pass reproduces that figure exactly.
- In the browser. `ml_model.js` builds the 12-input vector from the derived labels, runs the three layers, applies the calibrated softmax and picks the most probable outcome. On a grid of ordinary form profiles the two advisors give the same outcome 43 percent of the time, the network escalates to Human review more often (25 percent of profiles against 10 percent for the rule-based advisor's rule), and when both give a portfolio they are within one step for 92 percent of profiles.
- To retrain: `cd ml`, `pip install numpy openpyxl`, `python3 fetch_ils_bench.py`, `python3 train_model.py`. Seeded and reproducible.

### Advisor 2: interpretable rule-based advisor (`logit_model.js`, block `logit` in `ml_weights.js`)

A scorecard derived from data: a multinomial logistic regression fitted by the same training script on the same 12 inputs and 6 outcomes, 87.7 percent cross-validated accuracy (sd 2.8), macro-F1 0.82, temperature 0.75, ECE from 0.047 to 0.019, training accuracy 92.2 percent (reproduced exactly by the JavaScript pass). It is rule-based in the sense of a points-based scorecard (one weight per input and outcome, the largest total wins), except that its weights were learned from the expert consensus rather than set by hand. Because the weights are visible, the contribution of each input to the evidence for the recommended outcome is read directly from them, exact and additive in log-odds. Same data and inputs as the network, transparent instead of opaque: that is what makes explanation fidelity a factor with the origin of the rules held constant.

### Language to suitability

The profile form has an optional free-text box, "Or describe your situation in your own words". Pressing "Read description into the form" loads the in-browser language model (WebLLM, see below), asks it for a JSON object with age, horizon, stated tolerance, whether the attitude is inconsistent, emergency fund and income stability, validates every field, fills in only what was found and reports what was not, and flags Inconsistent tolerance when the text asks for high returns while saying that a loss would cause serious stress. Researcher mode also has "Load an ILS-Bench case", which pastes one of the 400 benchmark narratives and shows the expert panel's consensus labels and outcome, so the advisors' answer can be compared with the panel case by case. Whether a case came from the benchmark, and whether the form was filled from a narrative, is recorded in the log.

## How each explanation is computed

- Why (feature-based). Interpretable rule-based advisor: the contribution of each input to the evidence for the recommended outcome, read directly from the weights, exact and additive in log-odds. Neural network: exact Shapley values of the probability of the recommended outcome relative to the same baseline profile, in percentage points, computed post hoc in the browser by evaluating the network on all 32 coalitions of the five form inputs. In both cases baseline plus contributions equals the total, and the app prints that reconciliation. Items are sorted by absolute contribution and drawn as labelled signed bars, and the app states which method was used. When the rule-based advisor escalates, the explanation says which rule overrode the score.
- Counterfactual. The advisor is re-run over each input's plausible range (age 18 to 80, horizon 1 to 40, each risk tolerance level, emergency fund yes or no, income stable or variable) to find the smallest single change that yields a different portfolio. This is model-agnostic and works identically for both advisors. At most three changes are reported. If no single change flips the portfolio, the app says so.
- How sure (confidence). Both advisors: the calibrated probability of the recommended outcome, with the full probability distribution over the six outcomes drawn as bars, and a note that confidence displays can increase or decrease reliance.
An explanation condition is a combination of content and delivery. Content is any set of the three parts above (or none). Delivery is one of:

- Static: the content boxes as they are.
- Interactive (what-if). Above the content, a copy of the inputs the participant can move, with the outcome, the probabilities and the largest contributions updating live. "Ignore this input" switches hold an input at the neutral baseline, which shows what the advisor would say without that input. A "why not X?" selector gives a contrastive explanation: the smallest single change that would give X, or the smallest pair of changes, found by search, or an honest statement that X is out of reach. The number of moves and questions is logged.
- Adaptive. The ticked content shown as plain short sentences for participants with a low Big Three literacy score, and as bars and probabilities for a high score, with the self-rating as fallback. The variant shown is logged.
- Conversational (LLM). An open-weight language model (Llama 3.2 1B by default, Qwen 2.5 0.5B, 1.5B or Llama 3.2 3B selectable) runs inside the browser through WebLLM on the GPU. The library is loaded from the jsDelivr CDN and the model weights from Hugging Face on first use, then cached. The model receives, as its only source, a JSON block of facts computed by the advisor and the other explanation modules (profile, suitability labels, recommendation, allocation or the human-review reason, and only the ticked content: contributions, counterfactuals, confidence). It is instructed to explain those facts in plain language, to say when it does not have information, and to invent nothing. It writes an opening explanation and then answers follow-up questions in a chat box. The opening explanation, the model name and the number of follow-up turns are stored in the session log for auditing.

The rule-based advisor, the network, the Shapley values and the counterfactuals are deterministic: the same inputs always give the same output. LLM text is generated at low temperature but can differ slightly between devices and runs, which is one reason it is logged verbatim.

## The response and its measures

Under every recommendation: trust (1 to 7), the decision (Follow, Adjust, Reject, Ask a human adviser), and when Adjust is chosen the portfolio the participant would go for instead (logged with the number of steps from the shown one). Three optional 1 to 7 ratings (understanding, decision confidence, mental demand) and a free-text reason. Decision time in milliseconds from the moment the recommendation was displayed. Financial literacy is measured with the three Lusardi and Mitchell questions (score 0 to 3, plus the self-rating). In the profile form the three questions appear only when the adaptive delivery is selected, because that delivery uses the score. In the full study flow they are asked at the start for every participant, as the moderator variable.

## Study mode

Researcher mode (default) shows everything: the explanation condition switcher, the scenario switcher, the study design panel, the example profiles, an intro panel for the page's advisor, and the session log. The advisor is chosen by the page you are on. The Training data page (`training-data.html`) is reachable from the navigation on every page and links back with `index.html?ils=ILS-014` to open any benchmark case in the AI advisor, and with `index.html?panel=study-design` or `?panel=how-it-works` to open those dialogs.

Participant mode hides the researcher controls and walks the participant through the profile, the recommendation, and the response. With `flow=study` it runs the full procedure instead: consent screen, the three literacy questions, six fixed hypothetical cases (`study.js`, half sound and half flawed, order seeded by the participant ID so a link always gives the same sequence), one attention check (an instructed response, logged as passed or failed), a debrief that names the flawed cases, and a done screen. `trials=N` sets the number of cases (2 to 12). It is entered through the URL:

```
index.html?mode=participant&pid=P07&cond=counterfactual&scenario=flawed
interpretable.html?mode=participant&pid=P08&content=feature,confidence&form=interactive&scenario=flawed
```

- `mode=participant` enters participant mode.
- `pid` sets the participant ID. If absent, a random short ID is generated.
- `cond` is one of `none`, `feature`, `counterfactual`, `confidence`, `llm`. If absent, one of the first four is assigned at random (`llm` is only used when asked for, because it needs WebGPU and a large download). The assigned condition appears only in the URL, never in the participant's interface.
- The advisor is the page: `index.html` for the neural network, `interpretable.html` for the interpretable rule-based advisor. Older links with `&model=` are redirected to the right page with their other parameters kept.
- `cond=<preset>` picks a preset (random among all but `llm` if absent). `content=feature,confidence` and `form=interactive` set a custom combination and override the preset.
- `flow=study` runs the full study flow, `trials=N` sets its length.
- `scenario` is `sound` (default) or `flawed`. In the study flow the scenario per trial comes from the seeded plan. Flawed advice shifts the recommendation two portfolios in the wrong direction (a Human review outcome is replaced by an automated portfolio two steps more aggressive than the score) and marks the logged row as flawed. The explanations still describe the advisor's real reasoning, so the mismatch is detectable by an attentive participant.

Session log fields, one row per submitted response: `timestamp`, `participantId`, `mode`, `condition`, `advisorModel`, `scenario`, `age`, `horizon`, `tolerance`, `emergencyFund`, `incomeStable`, `knowledge`, `toleranceInconsistent`, `suitabilityTolerance`, `suitabilityCapacity`, `suitabilityLiquidity`, `narrativeUsed`, `ilsCaseId`, `recommendedPortfolio` (a portfolio or Human review), `soundPortfolio`, `score` (probability of the recommended outcome in percent), `margin` (probability gap in percentage points between the top two outcomes), `confidence`, `trustRating` (1 to 7), `decision` (follow, adjust, reject, ask-human), `decisionTimeMs` (milliseconds from the moment the recommendation was displayed, or the LLM finished its opening explanation, to the moment Submit was pressed), `adjustedTo`, `adjustSteps`, `understanding`, `decisionConfidence`, `mentalDemand`, `reason`, `literacyScore`, `literacyAnswers`, `literacyLevel`, `explanationContent`, `explanationForm`, `whatIfMoves`, `whyNotAsked`, `adaptiveVariant`, `flow`, `trialIndex`, `trialProfileId`, `attentionCheck`, `llmModel`, `llmExplanation`, `llmTurns`.

## Analytics

`analytics.html` reads the responses it can see (this browser's log, the study server's `api/responses.json` when served by `serve.py`, and any JSON export loaded on the page), merges and de-duplicates them, and shows: responses per condition, advisor and scenario, appropriate reliance per condition (follow rate on sound advice, override rate on flawed advice, their combination, over- and under-reliance, how often a human was asked), trust, decision time and the secondary measures per condition and scenario, attention-check pass rate, literacy distribution and reliance by literacy level. Filters by advisor and flow, and a combined CSV download. Everything is descriptive.

## Language-reading benchmark

The Training data page can read a sample of the 400 narratives with the in-browser language model, derive the labels with the form rules, run both learned advisors, and compare labels and outcomes with the expert consensus, case by case, with a mismatch list and a CSV download. It needs WebGPU like the conversational condition. The reference figures when the panel's own labels are used are 94.0 percent (network) and 92.2 percent (interpretable) outcome agreement.

The Session panel offers Download CSV, Download JSON and Clear session. Files are generated in the browser with a Blob. The log is mirrored to localStorage so an accidental reload does not lose it. When the page is served by `serve.py`, each row is also sent to the laptop running the server (see above), which is the data collection mechanism for a study session.

## Study design

Research question: does explanation style (none, feature-based, counterfactual, confidence) affect appropriate reliance on AI investment advice, and does financial literacy moderate the effect?

Design: between-subjects on explanation condition, defined by content (why, what would change it, how sure, in any combination or none) and delivery (static, interactive what-if, adaptive to literacy, conversational), with eight named presets. Advisor type (neural network or interpretable rule-based advisor, both learned from the same expert data) is a second between-subjects factor that manipulates explanation fidelity with the origin of the rules held constant. A study picks a subset of conditions. Each participant completes sound and flawed advice trials. Financial literacy is a measured moderator. A within-subjects design with counterbalanced condition order is a viable alternative if recruitment is limited.

Independent variables: explanation content, explanation delivery, advisor type. Dependent variables: appropriate reliance (follow rate on sound advice, override rate on flawed advice), trust ratings, decision time. Secondary: decision confidence, qualitative reasons.

How appropriate reliance is measured: the flawed scenario shows a recommendation deliberately shifted two portfolios in the wrong direction. Appropriate reliance means following sound advice and overriding flawed advice. Each logged row records the scenario, the shown portfolio and the sound portfolio, so both rates can be computed per condition.

Analysis sketch: ANOVA or mixed-effects models across conditions with financial literacy as a covariate, separately for sound and flawed trials. Short interviews for why participants followed or overrode.

Ethics note: a real study needs ethics approval, informed consent, hypothetical scenarios only, and no real financial advice.

Provenance: AdviceIT extends my systematic literature review of trust and algorithm aversion in the choice between human and AI financial advisors (SSRAAI 2026). The review described the problem of miscalibrated trust. AdviceIT by Radit is a first step toward the design-side answer.

Limitations, plainly: the neural network is trained on ILS-Bench, whose 400 narratives are synthetic even though the labels are expert-validated. No participant data collected yet. Stylised portfolios. LLM explanations and narrative reading depend on the participant's browser and GPU.

The same text is in `docs/study-design.md` and in the Study design panel of the app.

## Design decisions

- Two advisors learned from the same expert data, one opaque (the network) and one transparent (the interpretable rule-based scorecard), so that explanation fidelity becomes a variable with the origin of the rules held constant. For the transparent one the explanations are exact. For the network they are post hoc (Shapley values, model-agnostic counterfactuals, calibrated probabilities), which is the situation of most deployed systems. Comparing the two isolates the effect of explanation style from the effect of explanation fidelity.
- Expert-validated training data and the benchmark's own procedure. Both advisors learn from the ILS-Bench consensus labels, so their "Human review" outcome reflects what a panel of professionals decided rather than a rule I wrote. A hand-set scorecard was considered and kept only as an illustration in `model.js`: robo-advisor scoring rules are proprietary, so a hand-set one can never be more than illustrative.
- Explanation conditions as content times delivery. What is explained and how it is delivered are separate choices, so a study can vary either, and the eight presets are simply the common combinations. Following the language-to-labels-to-portfolio pipeline also lets the app be evaluated case by case against the benchmark.
- A small, fully readable ML pipeline. The training script is 250 lines of numpy, seeded and reproducible, with cross-validated numbers and reference baselines printed at every run, and the weights ship with the app.
- In-browser LLM instead of an API. WebLLM keeps the conversational condition free of API keys, per-token cost and third-party logging, and makes the whole instrument reproducible from a static folder. The cost is a one-time model download and the need for a WebGPU browser.
- No backend beyond a 150-line Python file. The app runs from a static folder. `serve.py` is optional and only adds response collection on the researcher's own laptop.
- Response controls and export, because it is an instrument. Trust rating, decision and decision time are the dependent variables. Recording them in the tool itself removes a copy-paste step and a source of error.
- Participant links, because a between-subjects study needs them. Different participants receive different URLs, and the assigned condition is never shown in the interface.

More detail in `docs/design-decisions.md`.

## Limitations and future work

- ILS-Bench is small (400 cases) and its narratives are synthetic, although the labels are expert-validated. The network is on par with a lookup table over label combinations, which shows that the mapping is largely rule-like once the labels are known. The harder and more interesting step is reading the labels from language, which is done by the in-browser LLM and not yet evaluated systematically. A batch evaluation of narrative reading against all 400 cases is the next engineering step, and training on real anonymised suitability records (with a data agreement and ethics approval) the next data step.
- The interactive, hybrid and adaptive conditions and the study flow are new and untested with participants. The pilot is their first real test.
- The LLM only explains, it does not advise. A condition where the LLM itself produces the recommendation, and the study measures whether people notice its errors, is a follow-up.
- No participant data collected yet. Nothing here is a result. A first pilot will test wording, timing and response scales, and the Analytics page will show whether the instrument records what it should.
- Weights and portfolios are stylised. They are defensible but not calibrated to any regulatory suitability standard.
- One trial per page load. A full study protocol would sequence several sound and flawed trials per participant and randomize their order.
- Decision confidence and qualitative reasons are listed as secondary measures but not yet collected in the interface.

## Data

The neural network is trained on ILS-Bench: Bonelli, M. (2026). ILS-Bench: Investor Language-to-Suitability Benchmark. Mendeley Data, V1. https://doi.org/10.17632/w48mh2dtg5.1. Licensed CC BY 4.0. The Training data page in the app (`training-data.html`) presents the dataset, its statistics, the training results and all 400 cases. `ml/data/ils_bench_cases.csv` and `ils_bench_cases.js` are extracts of its Cases_Consensus sheet, unchanged apart from column selection. The dataset contains no real client data.

## Author

Raditya Pratama, radityapratama2077@gmail.com

Built as an extension of my SSRAAI 2026 systematic literature review on trust and algorithm aversion.
