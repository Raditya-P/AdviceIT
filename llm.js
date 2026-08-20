/*
  AdviceIT by Radit, llm.js
  ---------------------------------------------------------------
  The conversational explanation condition, powered by WebLLM.

  WebLLM (https://github.com/mlc-ai/web-llm) runs an open-weight language
  model inside the browser on the GPU through WebGPU. The library is
  imported on demand from the jsDelivr CDN and the model weights are
  downloaded from Hugging Face the first time, then cached by the browser.
  Nothing is sent to any server after that: the model runs on the device.

  Requirements: a browser with WebGPU (Chrome or Edge 113 or newer, Safari
  18 or newer), and the page served over http(s), not opened from the file
  system. localhost and GitHub Pages both work.

  Grounding: the model is never asked to invent advice. It receives the
  facts computed by the advisor (profile, recommendation, contributions,
  counterfactuals, confidence) in its system prompt and is instructed to
  explain those facts in plain language and answer follow-up questions
  from them only. The generated text is stored in the session log so it
  can be audited afterwards.
*/

window.AdviceIT = window.AdviceIT || {};

(function (ns) {
  "use strict";

  var WEBLLM_URL = "https://esm.run/@mlc-ai/web-llm";

  /* Prebuilt WebLLM model IDs. Smaller loads faster and needs less GPU memory. */
  var MODELS = [
    { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 1.5B (about 1.2 GB, default, best at reading descriptions)" },
    { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B (about 0.9 GB, lighter)" },
    { id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 0.5B (about 0.4 GB, fastest)" },
    { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama 3.2 3B (about 2.2 GB, needs a strong GPU)" }
  ];

  var state = {
    webllm: null,
    engine: null,
    loadedModelId: null,
    loading: false,
    listeners: []
  };

  function supported() {
    return typeof navigator !== "undefined" && !!navigator.gpu;
  }

  function servedOverHttp() {
    return /^https?:$/.test(window.location.protocol);
  }

  function onProgress(fn) { state.listeners.push(fn); }
  function emit(report) { state.listeners.forEach(function (fn) { fn(report); }); }

  /* Load the library and a model. Resolves to the engine. */
  function load(modelId) {
    if (state.engine && state.loadedModelId === modelId) return Promise.resolve(state.engine);
    if (state.loading) return Promise.reject(new Error("A model is already loading."));
    state.loading = true;
    emit({ text: "Loading WebLLM library", progress: 0 });
    var libPromise = state.webllm ? Promise.resolve(state.webllm) : import(WEBLLM_URL);
    return libPromise.then(function (webllm) {
      state.webllm = webllm;
      var opts = {
        initProgressCallback: function (r) { emit({ text: r.text, progress: r.progress }); }
      };
      if (state.engine) {
        return state.engine.reload(modelId).then(function () { return state.engine; });
      }
      return webllm.CreateMLCEngine(modelId, opts);
    }).then(function (engine) {
      state.engine = engine;
      state.loadedModelId = modelId;
      state.loading = false;
      emit({ text: "Model ready", progress: 1, ready: true });
      return engine;
    }).catch(function (err) {
      state.loading = false;
      emit({ text: "Could not load the model: " + (err && err.message ? err.message : String(err)), progress: 0, error: true });
      throw err;
    });
  }

  /* ------------------------------------------------------------
     Grounding facts: everything the LLM is allowed to talk about.
     ------------------------------------------------------------ */
  function factsFor(result, content) {
    var include = function (part) { return !content || !content.length || content.indexOf(part) >= 0; };
    var fx = ns.explanations.featureExplanation(result);
    var cf = ns.explanations.counterfactualExplanation(result);
    var cx = ns.explanations.confidenceExplanation(result);
    var p = result.profile;
    var alloc = result.portfolio.allocation;
    var facts = {
      advisor: result.advisor === "ml" ? "a neural network trained on 400 expert-validated suitability cases (ILS-Bench)" : result.advisor === "logit" ? "an interpretable logistic regression fitted on 400 expert-validated suitability cases (ILS-Bench)" : "a transparent rule-based scoring model",
      profile: {
        age: p.age,
        horizonYears: p.horizon,
        statedRiskTolerance: p.tolerance,
        emergencyFund: p.emergencyFund ? "yes, at least 6 months" : "no",
        income: p.incomeStable ? "stable" : "variable",
        debtOrObligations: p.debtObligations ? "significant" : "none reported",
        nearTermNeed: p.nearTermNeed ? "yes" : "no"
      },
      suitabilityLabels: result.labels ? {
        riskTolerance: result.labels.tolerance,
        riskCapacity: result.labels.capacity + " (" + result.labels.capacityReason + ")",
        liquidityNeed: result.labels.liquidity + " (" + result.labels.liquidityReason + ")"
      } : undefined,
      recommendation: result.portfolio.name
    };
    if (include("feature")) facts.inputContributions = fx.items.map(function (it) { return it.sentence; });
    if (include("counterfactual")) facts.whatWouldChangeIt = cf.sentences.length ? cf.sentences : [cf.intro];
    if (include("confidence")) facts.confidence = cx.labelText + ". " + cx.sentence;
    if (alloc) {
      facts.allocationPercent = {
        globalEquities: alloc.equities,
        bonds: alloc.bonds,
        cashAndMoneyMarket: alloc.cash,
        realAssets: alloc.realAssets
      };
    } else {
      facts.humanReview = "No automated portfolio is given. The case should be reviewed by a human adviser. " + (result.escalationReason || "");
    }
    if (result.advisor === "ml") facts.probabilityOfRecommendation = result.score + " percent";
    else facts.riskCapacityScore0to100 = result.score;
    return facts;
  }

  function systemPrompt(result, content) {
    var facts = factsFor(result, content);
    return [
      "You are the explanation assistant of AdviceIT, a research tool about AI investment advice.",
      "You explain a recommendation that was produced by " + facts.advisor + ". You did not produce it yourself.",
      "Use ONLY the facts below. Do not add products, numbers, market views or advice that are not in the facts.",
      "If asked something the facts do not cover, say that you do not have that information.",
      "Write plainly, in short sentences, for a non-expert. Never use em dashes or semicolons.",
      "",
      "FACTS (JSON):",
      JSON.stringify(facts, null, 2)
    ].join("\n");
  }

  var OPENING_REQUEST = "In three or four sentences, explain to me why I received this recommendation, what mattered most, and how sure the model is. Then invite me to ask a follow-up question.";

  /* Stream a chat completion. onToken(text) receives the accumulated text.
     Returns the final text. */
  function chat(messages, onToken) {
    if (!state.engine) return Promise.reject(new Error("No model loaded."));
    var accumulated = "";
    return state.engine.chat.completions.create({
      messages: messages,
      stream: true,
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 320
    }).then(function (stream) {
      function step() {
        return stream.next().then(function (r) {
          if (r.done) return accumulated;
          var delta = r.value && r.value.choices && r.value.choices[0] && r.value.choices[0].delta;
          if (delta && delta.content) {
            accumulated += delta.content;
            if (onToken) onToken(accumulated);
          }
          return step();
        });
      }
      return step();
    });
  }

  /* ------------------------------------------------------------
     Language to suitability: read a free-text narrative into the form
     fields, following the ILS-Bench procedure (narrative -> labels).
     The model returns JSON. parseExtraction() is defensive: it finds the
     first JSON object in the reply and validates every field, returning
     null for anything it cannot read so the form is never filled with
     invented values.
     ------------------------------------------------------------ */
  function extractionMessages(narrative) {
    var system = [
      "You read a short description written by an investor and extract facts for a suitability form.",
      "Reply with ONE JSON object on a single line and nothing else, using exactly these keys and allowed values:",
      '{"age": integer or null,',
      ' "whenNeeded": "under2" | "2to5" | "6to10" | "over10" | "unsure" | null,',
      ' "appetite": "low" | "medium" | "high" | "unsure" | null,',
      ' "lossStress": true | false | null,',
      ' "emergencyFund": true | false | "unsure" | null,',
      ' "incomeStable": true | false | "unsure" | null,',
      ' "debtOrObligations": true | false | null,',
      ' "nearTermNeed": true | false | null,',
      ' "note": string of at most 10 words}',
      "Three kinds of answer: the value when the text says it, the string unsure when the person SAYS they do not know or have not checked, null only when the text is silent. Extract, do not judge.",
      "age: the text states it, in phrases like I am 46 or as a 64-year-old. Read it, do not answer null.",
      "whenNeeded: how soon the money is needed for its MAIN goal. Money needed very soon or within a year or two: under2. A few years: 2to5. Do NOT answer over10 by default, only when the text says the money can stay invested for well over ten years, such as retirement decades away. The person says they do not know when: unsure.",
      "nearTermNeed: true if ANY concrete need could take this money within about two years (rent, tuition, a tax bill, a purchase, a deposit, medical costs), even when the main goal is far away.",
      "appetite: what the person SAYS they want. Aggressive portfolio, high returns, grow quickly, recover a gap fast: high. Cautious, avoid losses, preserve capital: low. Balanced or moderate: medium. The person says they are not sure how much risk they can take: unsure.",
      "lossStress: true if the text says a loss would cause serious stress, anxiety or hardship, or that they cannot tolerate losses, or that they panicked and sold during a past decline.",
      "emergencyFund: true only for a solid cash reserve or emergency fund. false if the reserve is described as small, limited or absent. unsure if they say they have not checked it.",
      "incomeStable: true for a secure or steady income. false for irregular, variable, contract or a single unstable income. unsure if they say they cannot estimate their income.",
      "debtOrObligations: true for high-interest debt, loans to repay, or heavy or several fixed expenses. false if debt is said to be manageable or absent."
    ].join("\n");
    return [
      { role: "system", content: system },
      { role: "user", content: "Description:\n" + narrative + "\n\nJSON:" }
    ];
  }

  function parseExtraction(text) {
    if (!text) return null;
    var obj = null;
    var start = text.indexOf("{"), end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { obj = JSON.parse(text.slice(start, end + 1)); } catch (e) { obj = null; }
    }
    // Salvage: the small models often ramble past the token limit, which
    // truncates the JSON. Recover whatever key-value pairs are present.
    if (!obj) {
      obj = {};
      var m;
      if ((m = text.match(/"age"\s*:\s*(\d+)/))) obj.age = parseInt(m[1], 10);
      if ((m = text.match(/"whenNeeded"\s*:\s*"(under2|2to5|6to10|over10|unsure)"/))) obj.whenNeeded = m[1];
      if ((m = text.match(/"appetite"\s*:\s*"(low|medium|moderate|high|unsure)"/i))) obj.appetite = m[1];
      ["lossStress", "emergencyFund", "incomeStable", "debtOrObligations", "nearTermNeed"].forEach(function (key) {
        var mm = text.match(new RegExp('"' + key + '"\\s*:\\s*(true|false|"unsure")'));
        if (mm) obj[key] = mm[1] === "true" ? true : mm[1] === "false" ? false : "unsure";
      });
      if (!Object.keys(obj).length) return null;
      obj.note = "salvaged from a truncated reply";
    }
    function intIn(v, lo, hi) { var n = parseInt(v, 10); return isNaN(n) || n < lo || n > hi ? null : n; }
    function bool(v) { return v === true || v === "true" ? true : v === false || v === "false" ? false : v === "unsure" ? "unsure" : null; }
    var when = typeof obj.whenNeeded === "string" && ["under2", "2to5", "6to10", "over10", "unsure"].indexOf(obj.whenNeeded) >= 0 ? obj.whenNeeded : null;
    var appetite = typeof obj.appetite === "string" ? obj.appetite.toLowerCase() : null;
    if (appetite === "moderate") appetite = "medium";
    if (["low", "medium", "high", "unsure"].indexOf(appetite) < 0) appetite = null;
    return {
      age: intIn(obj.age, 18, 80),
      whenNeeded: when,
      appetite: appetite,
      lossStress: bool(obj.lossStress),
      emergencyFund: bool(obj.emergencyFund),
      incomeStable: bool(obj.incomeStable),
      debtObligations: bool(obj.debtOrObligations),
      nearTermNeed: bool(obj.nearTermNeed),
      reasoning: typeof obj.note === "string" ? obj.note : ""
    };
  }

  /* Turn the extracted facts into form-field values. The judgement calls
     live HERE, in deterministic code, not in the small language model:
       horizon      from the whenNeeded range (its midpoint in years)
       tolerance    the stated appetite
       Inconsistent when the stated appetite is high while the facts show a
                    weak position to bear losses (loss stress, a near-term
                    need, or at least two financial strains), which is how
                    the ILS-Bench codebook uses the label. Also when the
                    person says they do not know how much risk they can take.
       unsure       mapped conservatively, the way the expert panel judged
                    such cases: an unchecked emergency fund or an income the
                    person cannot estimate counts as a strain (fund or income
                    read as weak), and not knowing when the money is needed
                    reads as a short horizon. The panel escalated cases with
                    missing self-knowledge, it never defaulted them to safe.
     Fields the model could not read at all stay null so the caller can
     leave the form untouched and report them. */
  var WHEN_TO_HORIZON = { under2: 2, "2to5": 4, "6to10": 8, over10: 20, unsure: 4 };

  function profileFromExtraction(ex) {
    var fund = ex.emergencyFund === "unsure" ? false : ex.emergencyFund;
    var income = ex.incomeStable === "unsure" ? false : ex.incomeStable;
    var debt = ex.debtObligations === "unsure" ? null : ex.debtObligations;
    var strains = 0;
    if (fund === false) strains++;
    if (income === false) strains++;
    if (debt === true) strains++;
    var inconsistent = (ex.appetite === "high" && (ex.lossStress === true || ex.nearTermNeed === true || strains >= 2))
      || ex.appetite === "unsure";
    return {
      age: ex.age,
      horizon: ex.whenNeeded ? WHEN_TO_HORIZON[ex.whenNeeded] : null,
      tolerance: ex.appetite === "unsure" ? "medium" : ex.appetite,
      toleranceInconsistent: inconsistent,
      emergencyFund: fund,
      incomeStable: income,
      debtObligations: debt,
      nearTermNeed: ex.nearTermNeed === "unsure" ? null : ex.nearTermNeed
    };
  }

  /* One-shot completion (no streaming) for the extraction. */
  /* One-shot completion (no streaming) for the extraction. */
  function complete(messages, maxTokens) {
    if (!state.engine) return Promise.reject(new Error("No model loaded."));
    return state.engine.chat.completions.create({
      messages: messages,
      stream: false,
      temperature: 0,
      max_tokens: maxTokens || 200
    }).then(function (r) {
      return r && r.choices && r.choices[0] && r.choices[0].message ? r.choices[0].message.content : "";
    });
  }

  ns.llm = {
    MODELS: MODELS,
    extractionMessages: extractionMessages,
    parseExtraction: parseExtraction,
    profileFromExtraction: profileFromExtraction,
    complete: complete,
    supported: supported,
    servedOverHttp: servedOverHttp,
    onProgress: onProgress,
    load: load,
    isReady: function () { return !!state.engine && !state.loading; },
    loadedModelId: function () { return state.loadedModelId; },
    systemPrompt: systemPrompt,
    factsFor: factsFor,
    OPENING_REQUEST: OPENING_REQUEST,
    chat: chat
  };
})(window.AdviceIT);
