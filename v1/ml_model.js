/*
  AdviceIT by Radit, ml_model.js
  ---------------------------------------------------------------
  The neural-network advisor, trained on ILS-Bench (Bonelli 2026,
  Mendeley Data, doi:10.17632/w48mh2dtg5.1, CC BY 4.0) by
  ml/train_model.py. Weights are loaded from ml_weights.js.

  Procedure (the same as the benchmark's): profile -> suitability labels
  (risk tolerance, risk capacity, liquidity need) plus age -> one of six
  outcomes: Capital preservation, Conservative, Balanced, Growth,
  Aggressive growth, or Human review. The labels come from
  model.deriveSuitabilityLabels(profile), that is from the form fields
  through documented rules, or from a free-text narrative read by the
  in-browser language model (app.js) which can also set the
  "Inconsistent" tolerance label.

  Unlike model.js this is a black box: the learned weights are not
  readable, so explanations are produced post hoc:
    - feature attributions: exact Shapley values of the probability of
      the recommended outcome, over the seven form inputs (age, horizon,
      tolerance, emergency fund, income, debt, near-term need), relative to
      the same neutral baseline profile (2^7 = 128 evaluations)
    - counterfactuals: the model-agnostic search in explanations.js
    - confidence: temperature-calibrated class probabilities
*/

window.AdviceIT = window.AdviceIT || {};

(function (ns) {
  "use strict";

  var glass = ns.model;
  var W = ns.mlWeights;
  var LAYOUT = W.featureLayout;

  /* Confidence thresholds on the calibrated top-class probability. */
  var CONFIDENCE = { high: 0.75, moderate: 0.5 };

  /* Neutral baseline profile shared with the glass box (labels: Moderate
     tolerance, High capacity, Moderate liquidity). */
  var BASELINE = { age: 45, horizon: 10, tolerance: "medium", emergencyFund: true, incomeStable: true, debtObligations: false, nearTermNeed: false, toleranceInconsistent: false };

  function oneHot(value, options) {
    var v = [];
    for (var i = 0; i < options.length; i++) v.push(options[i] === value ? 1 : 0);
    return v;
  }

  /* 12 inputs: one-hot tolerance (4), capacity (3), liquidity (4), standardised age (1). */
  function featureVector(profile) {
    var labels = glass.deriveSuitabilityLabels(profile);
    return oneHot(labels.tolerance, LAYOUT.tolerance)
      .concat(oneHot(labels.capacity, LAYOUT.capacity))
      .concat(oneHot(labels.liquidity, LAYOUT.liquidity))
      .concat([(profile.age - LAYOUT.age.mean) / LAYOUT.age.std]);
  }

  function relu(x) { return x > 0 ? x : 0; }

  function softmax(logits, temperature) {
    var t = temperature || 1;
    var max = -Infinity, i;
    for (i = 0; i < logits.length; i++) if (logits[i] / t > max) max = logits[i] / t;
    var sum = 0, out = [];
    for (i = 0; i < logits.length; i++) { out[i] = Math.exp(logits[i] / t - max); sum += out[i]; }
    for (i = 0; i < out.length; i++) out[i] /= sum;
    return out;
  }

  /* Forward pass through the exported dense layers. */
  function forward(x) {
    var a = x;
    W.layers.forEach(function (layer) {
      var out = [];
      for (var j = 0; j < layer.b.length; j++) {
        var s = layer.b[j];
        for (var k = 0; k < a.length; k++) s += a[k] * layer.W[k][j];
        out[j] = layer.activation === "relu" ? relu(s) : s;
      }
      a = out;
    });
    return a; // logits
  }

  function probabilities(profile) {
    return softmax(forward(featureVector(profile)), W.temperature);
  }

  /* ------------------------------------------------------------
     Exact Shapley values over the five form inputs for the probability
     of a given class. f(S) evaluates the network with the inputs in S
     taken from the actual profile and the others from the baseline.
     ------------------------------------------------------------ */
  var FEATURE_KEYS = ["age", "horizon", "tolerance", "emergencyFund", "incomeStable", "debtObligations", "nearTermNeed"];

  function factorial(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }

  function mixedProfile(profile, mask) {
    var p = {};
    FEATURE_KEYS.forEach(function (key, idx) {
      p[key] = (mask & (1 << idx)) ? profile[key] : BASELINE[key];
    });
    // The inconsistency flag travels with the tolerance input.
    p.toleranceInconsistent = (mask & (1 << 2)) ? Boolean(profile.toleranceInconsistent) : false;
    return p;
  }

  function shapleyValues(profile, classIndex) {
    var n = FEATURE_KEYS.length;
    var cache = {};
    function f(mask) {
      if (!(mask in cache)) cache[mask] = probabilities(mixedProfile(profile, mask))[classIndex] * 100;
      return cache[mask];
    }
    var phi = [];
    for (var i = 0; i < n; i++) {
      var total = 0;
      for (var mask = 0; mask < (1 << n); mask++) {
        if (mask & (1 << i)) continue;
        var size = 0;
        for (var b = 0; b < n; b++) if (mask & (1 << b)) size++;
        var weight = factorial(size) * factorial(n - size - 1) / factorial(n);
        total += weight * (f(mask | (1 << i)) - f(mask));
      }
      phi[i] = total;
    }
    return { values: phi, baseline: f(0), full: f((1 << n) - 1) };
  }

  var TOLERANCE_TEXT = { low: "Low", medium: "Medium", high: "High" };

  function contributionsFor(profile, classIndex) {
    var sh = shapleyValues(profile, classIndex);
    var tolText = TOLERANCE_TEXT[profile.tolerance] + " tolerance" + (profile.toleranceInconsistent ? ", read as Inconsistent" : "");
    var labels = {
      age: { label: "Age", valueText: profile.age + " years old" },
      horizon: { label: "Investment horizon", valueText: profile.horizon + (profile.horizon === 1 ? " year" : " years") },
      tolerance: { label: "Risk tolerance", valueText: tolText },
      emergencyFund: { label: "Emergency fund", valueText: profile.emergencyFund ? "6 months covered" : "no 6-month buffer" },
      incomeStable: { label: "Income stability", valueText: profile.incomeStable ? "stable income" : "variable income" },
      debtObligations: { label: "Debt and obligations", valueText: profile.debtObligations ? "significant debt or obligations" : "no significant debt" },
      nearTermNeed: { label: "Near-term need", valueText: profile.nearTermNeed ? "money may be needed soon" : "no near-term need" }
    };
    return {
      baseline: sh.baseline,
      full: sh.full,
      items: FEATURE_KEYS.map(function (key, i) {
        return { key: key, label: labels[key].label, valueText: labels[key].valueText, points: sh.values[i] };
      })
    };
  }

  function confidenceLabel(pTop) {
    if (pTop >= CONFIDENCE.high) return "high";
    if (pTop >= CONFIDENCE.moderate) return "moderate";
    return "low";
  }

  /* ------------------------------------------------------------
     recommend(profile): same shape as the glass-box result.
     ------------------------------------------------------------ */
  function recommend(rawProfile) {
    var profile = glass.normalizeProfile(rawProfile);
    var labels = glass.deriveSuitabilityLabels(profile);
    var probs = probabilities(profile);
    var top = 0, second = -1, i;
    for (i = 1; i < probs.length; i++) if (probs[i] > probs[top]) top = i;
    for (i = 0; i < probs.length; i++) if (i !== top && (second < 0 || probs[i] > probs[second])) second = i;

    var contrib = contributionsFor(profile, top);
    var pTop = probs[top];
    var outcome = glass.OUTCOMES[top];

    // For a portfolio outcome, note what the score-free "second choice" is.
    return {
      advisor: "ml",
      profile: profile,
      labels: labels,
      contributions: contrib.items,
      targetLabel: "the probability of " + outcome.name,
      targetUnit: "percentage points",
      baselineScore: glass.round1(contrib.baseline),
      rawScore: glass.round1(contrib.full),
      score: glass.round1(pTop * 100),
      clamped: false,
      probabilities: probs.map(function (p) { return Math.round(p * 1000) / 1000; }),
      capacityBand: top,
      toleranceShift: 0,
      escalated: top === glass.HUMAN_REVIEW_INDEX,
      escalationReason: top === glass.HUMAN_REVIEW_INDEX
        ? "The network, trained on expert decisions, judges this profile (" + labels.tolerance + " tolerance, " + labels.capacity + " capacity, " + labels.liquidity + " liquidity need) as one that should go to a human adviser."
        : null,
      scorePortfolio: top === glass.HUMAN_REVIEW_INDEX ? glass.PORTFOLIOS[Math.min(second, glass.PORTFOLIOS.length - 1)] : outcome,
      portfolioIndex: top,
      portfolio: outcome,
      // margin: probability gap between the top two outcomes, in percentage points
      margin: Math.round((pTop - probs[second]) * 1000) / 10,
      topProbability: Math.round(pTop * 1000) / 1000,
      confidence: confidenceLabel(pTop),
      neighbourPortfolio: glass.OUTCOMES[second],
      contribIntro: "Compared with a neutral baseline profile, each of your inputs moved the probability of " + outcome.name + " as follows (largest effect first, in percentage points):",
      contribTotal: "Baseline profile " + glass.round1(contrib.baseline) + " percent plus contributions = " + glass.round1(contrib.full) + " percent probability of " + outcome.name + " for your profile."
    };
  }

  ns.mlModel = {
    BASELINE: BASELINE,
    FEATURE_KEYS: FEATURE_KEYS,
    meta: W.meta,
    featureVector: featureVector,
    probabilities: probabilities,
    shapleyValues: shapleyValues,
    recommend: recommend
  };

  /* Advisor registry used by app.js. Both advisors expose recommend(). */
  /* Advisor registry used by app.js. The illustrative hand-set scorecard in
     model.js is deliberately not registered: the app compares two advisors
     learned from the same data, one opaque and one transparent. */
  ns.advisors = {
    ml: {
      id: "ml",
      name: "Neural network",
      description: "Multilayer perceptron trained on ILS-Bench, " + W.meta.cases + " expert-validated cases, " + Math.round(W.meta.cvAccuracy * 100) + " percent cross-validated accuracy over six outcomes including Human review. Explanations are post hoc.",
      recommend: recommend
    }
  };
})(window.AdviceIT);
