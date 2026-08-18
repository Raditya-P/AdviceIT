/*
  AdviceIT by Radit, logit_model.js
  ---------------------------------------------------------------
  The interpretable advisor: a multinomial logistic regression fitted on
  ILS-Bench by ml/train_model.py, on the same 12 inputs and 6 outcomes as
  the neural network. Its coefficients are loaded from ml_weights.js
  (block "logit").

  Why it exists. The rule-based advisor is transparent but its weights are
  set by hand. The neural network is learned but opaque. This model is
  both learned from the expert data and transparent: every outcome has one
  coefficient per input, so the contribution of each input to the evidence
  for the recommended outcome is read directly from the coefficients, with
  no estimation. In XAI terms it is an interpretable-by-design model, the
  cleanest control for explanation fidelity next to the network.

  Explanations
    - feature-based: exact contributions in log-odds (the coefficient of
      the recommended outcome times the input, minus the same for the
      neutral baseline profile). They add up exactly to the change in
      evidence for the outcome between the baseline and this profile.
      Contributions are reported per suitability label (tolerance,
      capacity, liquidity need) and age, because those are the model's
      inputs.
    - counterfactuals: the model-agnostic search in explanations.js.
    - confidence: temperature-calibrated class probabilities.
*/

window.AdviceIT = window.AdviceIT || {};

(function (ns) {
  "use strict";

  var glass = ns.model;
  var W = ns.mlWeights;
  var L = W.logit;
  var LAYOUT = W.featureLayout;
  var CONFIDENCE = { high: 0.75, moderate: 0.5 };
  var BASELINE = { age: 45, horizon: 10, tolerance: "medium", emergencyFund: true, incomeStable: true, toleranceInconsistent: false };

  function oneHot(value, options) {
    var v = [];
    for (var i = 0; i < options.length; i++) v.push(options[i] === value ? 1 : 0);
    return v;
  }

  function featureVector(profile) {
    var labels = glass.deriveSuitabilityLabels(profile);
    return oneHot(labels.tolerance, LAYOUT.tolerance)
      .concat(oneHot(labels.capacity, LAYOUT.capacity))
      .concat(oneHot(labels.liquidity, LAYOUT.liquidity))
      .concat([(profile.age - LAYOUT.age.mean) / LAYOUT.age.std]);
  }

  function logits(x) {
    var out = [];
    for (var j = 0; j < L.b.length; j++) {
      var s = L.b[j];
      for (var k = 0; k < x.length; k++) s += x[k] * L.W[k][j];
      out[j] = s;
    }
    return out;
  }

  function softmax(z, temperature) {
    var t = temperature || 1;
    var max = -Infinity, i;
    for (i = 0; i < z.length; i++) if (z[i] / t > max) max = z[i] / t;
    var sum = 0, out = [];
    for (i = 0; i < z.length; i++) { out[i] = Math.exp(z[i] / t - max); sum += out[i]; }
    for (i = 0; i < out.length; i++) out[i] /= sum;
    return out;
  }

  function probabilities(profile) {
    return softmax(logits(featureVector(profile)), L.temperature);
  }

  /* Exact contributions per input group to the log-odds of class k,
     relative to the baseline profile. Groups: tolerance (inputs 0..3),
     capacity (4..6), liquidity (7..10), age (11). */
  var GROUPS = [
    { key: "tolerance", label: "Risk tolerance", from: 0, to: 4 },
    { key: "capacity", label: "Risk capacity", from: 4, to: 7 },
    { key: "liquidity", label: "Liquidity need", from: 7, to: 11 },
    { key: "age", label: "Age", from: 11, to: 12 }
  ];

  function contributionsFor(profile, k) {
    var x = featureVector(profile);
    var xb = featureVector(BASELINE);
    var labels = glass.deriveSuitabilityLabels(profile);
    var baseLogit = logits(xb)[k];
    var fullLogit = logits(x)[k];
    var valueText = {
      tolerance: labels.tolerance + (profile.toleranceInconsistent ? " (read from the description)" : " (stated " + profile.tolerance + ")"),
      capacity: labels.capacity + " (" + labels.capacityReason + ")",
      liquidity: labels.liquidity + " (" + labels.liquidityReason + ")",
      age: profile.age + " years old"
    };
    var items = GROUPS.map(function (g) {
      var pts = 0;
      for (var i = g.from; i < g.to; i++) pts += L.W[i][k] * (x[i] - xb[i]);
      return { key: g.key, label: g.label, valueText: valueText[g.key], points: pts };
    });
    return { items: items, baseline: baseLogit, full: fullLogit };
  }

  function confidenceLabel(pTop) {
    if (pTop >= CONFIDENCE.high) return "high";
    if (pTop >= CONFIDENCE.moderate) return "moderate";
    return "low";
  }

  function recommend(rawProfile) {
    var profile = glass.normalizeProfile(rawProfile);
    var labels = glass.deriveSuitabilityLabels(profile);
    var probs = probabilities(profile);
    var top = 0, second = -1, i;
    for (i = 1; i < probs.length; i++) if (probs[i] > probs[top]) top = i;
    for (i = 0; i < probs.length; i++) if (i !== top && (second < 0 || probs[i] > probs[second])) second = i;
    var outcome = glass.OUTCOMES[top];
    var contrib = contributionsFor(profile, top);
    var pTop = probs[top];
    return {
      advisor: "logit",
      profile: profile,
      labels: labels,
      contributions: contrib.items,
      targetLabel: "the evidence for " + outcome.name,
      targetUnit: "log-odds points",
      baselineScore: glass.round1(contrib.baseline),
      rawScore: glass.round1(contrib.full),
      score: glass.round1(pTop * 100),
      clamped: false,
      probabilities: probs.map(function (p) { return Math.round(p * 1000) / 1000; }),
      capacityBand: top,
      toleranceShift: 0,
      escalated: top === glass.HUMAN_REVIEW_INDEX,
      escalationReason: top === glass.HUMAN_REVIEW_INDEX
        ? "The interpretable model, fitted on expert decisions, gives this profile (" + labels.tolerance + " tolerance, " + labels.capacity + " capacity, " + labels.liquidity + " liquidity need) its highest probability for Human review."
        : null,
      scorePortfolio: top === glass.HUMAN_REVIEW_INDEX ? glass.PORTFOLIOS[Math.min(second, glass.PORTFOLIOS.length - 1)] : outcome,
      portfolioIndex: top,
      portfolio: outcome,
      margin: Math.round((pTop - probs[second]) * 1000) / 10,
      topProbability: Math.round(pTop * 1000) / 1000,
      confidence: confidenceLabel(pTop),
      neighbourPortfolio: glass.OUTCOMES[second],
      contribIntro: "Compared with a neutral baseline profile, each input moved the evidence for " + outcome.name + " as follows (largest effect first, in log-odds points, read directly from the model's coefficients):",
      contribTotal: "Baseline evidence " + glass.round1(contrib.baseline) + " plus contributions = " + glass.round1(contrib.full) + " log-odds points for " + outcome.name + ", which the model turns into a " + Math.round(pTop * 100) + " percent probability."
    };
  }

  ns.logitModel = {
    BASELINE: BASELINE,
    meta: L.meta,
    featureVector: featureVector,
    probabilities: probabilities,
    recommend: recommend
  };

  ns.advisors = ns.advisors || {};
  ns.advisors.logit = {
    id: "logit",
    name: "Interpretable rule-based",
    description: "Scorecard derived from data: multinomial logistic regression fitted on ILS-Bench, " + Math.round(L.meta.cvAccuracy * 100) + " percent cross-validated accuracy. Learned from the same expert data as the network, but transparent: contributions are read from its weights.",
    recommend: recommend
  };
})(window.AdviceIT);
