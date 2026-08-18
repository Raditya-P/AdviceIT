# AdviceIT by Radit: design decisions

Why AdviceIT is built the way it is.

## Why an opaque and a transparent advisor

The AI advisor is a neural network trained on ILS-Bench, 400 investor cases whose suitability labels and recommended outcome were validated by a panel of four financial-domain experts. The interpretable rule-based advisor is a scorecard fitted on the same data. Having both was a deliberate research choice.

- Faithfulness. For the interpretable rule-based advisor the feature contributions are read from its weights, the counterfactual explanation is produced by re-running it, and the confidence is its calibrated probability. There is no gap between what the model did and what the explanation says.
- Isolation of the variable of interest. The study asks whether explanation style changes reliance. If explanations were approximations of a black box, differences between conditions could be caused by differences in explanation accuracy rather than style.
- Explainability of the instrument itself. Anyone can read `model.js` and reproduce a recommendation by hand.
- Realism. Deployed advisors are learned models whose explanations are post hoc. The network condition reproduces that situation: Shapley values, model-agnostic counterfactuals and calibrated probabilities are estimated from the model's behaviour, not read from rules. Comparing the two advisors turns explanation fidelity into a measurable factor.
- Inspectability of the ML pipeline. The training script is short numpy, seeded and reproducible, with cross-validated accuracy, calibration and reference baselines printed at every run. It is small enough to be explained line by line.
- Expert judgement rather than my own rules. Training on ILS-Bench means the network's decision to escalate to a human, and its portfolio choices, come from professionals' consensus. The rule-based advisor mirrors the escalation logic with one explicit rule so both advisors share the same outcome space.

## Why two pages rather than a switch

The two advisors are the two levels of the fidelity factor. Giving each its own page (the AI advisor as home, the rule-based advisor one click away in the navigation) makes each level a shareable URL, keeps the researcher controls to what varies within a page (explanation condition and scenario), and lets each page carry the panel that explains its advisor. Both pages share every script, so the logic cannot drift apart, and the shared log records which advisor produced each row.

## Why two advisors, both learned from the same data

A hand-set scorecard is transparent but invites the objection "your weights are made up", and real robo-advisor scoring rules are proprietary, so a hand-set one can never be more than illustrative. The neural network is learned but opaque. The interpretable rule-based advisor, a multinomial logistic regression fitted on the same expert data with the same inputs, is both learned and transparent, and its explanations are exact. Comparing the network with it makes explanation fidelity a factor with the origin of the rules held constant. The illustrative hand-set scorecard stays in `model.js` for reference and is not shown in the app.

## Why explanation conditions are content times delivery

Eight conditions in one list mixed two different things: what is explained (feature contributions, counterfactuals, confidence) and how it is delivered (as is, with steering controls, adapted to literacy, as a conversation). Separating them gives a cleaner control (a preset dropdown plus a Customise section), a cleaner design (two factors instead of one list), and it makes "hybrid" simply the case of more than one content part rather than a ninth condition. The single-content conditions are kept because they are the levels needed to attribute a hybrid effect to its parts.

## Why interactive, hybrid and adaptive conditions

Explaining is only half of human-centred AI. Letting people steer the inputs and ask "why not" (interactive), combining explanation types (hybrid), and adapting the explanation to the person's literacy (adaptive) are the conditions that connect the instrument to how explanation interfaces are studied in HCI: control, combination and personalisation, not just presentation.

## Why a full study flow and richer measures

An instrument that records one trial with three buttons is a demo. Consent, a validated literacy measure, fixed cases in a seeded order, sound and flawed trials, an attention check, a debrief, a real Adjust choice, an Ask-a-human option, understanding, confidence, mental demand and free-text reasons are what a study needs to be run and analysed. The Analytics page closes the loop.

## Why follow the ILS-Bench procedure

The benchmark defines a suitability-aware robo-advisor as a pipeline from investor language to structured labels to a portfolio or a human escalation. Following it gives AdviceIT a free-text entry point (the language model reads a description into the form), a shared label vocabulary for both advisors, and a way to compare the app case by case with an expert panel. It also makes the app a candidate system for the benchmark itself.

## Why an in-browser LLM

The conversational condition uses WebLLM to run an open-weight model on the participant's GPU rather than calling an API. That avoids API keys in a public repository, per-token costs, and third-party logging of participant conversations, and it keeps the instrument reproducible from a static folder. The model is grounded on the facts computed by the other explanation modules and its text is logged verbatim, so its faithfulness can be audited after the study. The cost is a one-time download and the requirement of a WebGPU browser.

## Why the researcher's laptop is the server

- Control: `serve.py` is a standard-library Python file. Responses land in a file on the researcher's own machine, not in a cloud service, which matches consent and data-management procedures well.
- Reproducibility: no database, no framework, no dependency that can change. The app itself is still a static folder that runs from GitHub Pages or from a double-click.
- Simplicity for review: an interviewer or reviewer can open one folder and see everything, including the training script and the server.

## Why the response controls and export

An instrument must record its dependent variables. The trust slider, the follow / adjust / reject choice and the decision timer are the study's outcomes. Recording them inside the tool avoids transcription errors and makes decision time measurable at all. CSV and JSON export are the data collection mechanism: at the end of a session the file is downloaded and stored with the study data. LocalStorage persistence protects against an accidental reload.

## Why participant links

A between-subjects study assigns each participant to one condition. Encoding the condition, the participant ID and the scenario in the URL means the researcher can generate one link per participant, the interface never reveals the condition, and the exported rows already carry the assignment. It also makes remote sessions possible with nothing more than a shared link.

## Why plain scripts and no framework

The app must open directly from the file system and from a GitHub Pages subpath, on a laptop and on a phone. Plain HTML, CSS and JavaScript with no build step meet that with zero dependencies, and keep every line explainable in an interview.

## Why deterministic

The same profile must always yield the same recommendation and explanations, so that trials are comparable across participants and the flawed scenario is a controlled manipulation rather than noise.
