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
    { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B (about 0.9 GB, default)" },
    { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 1.5B (about 1.2 GB, better wording)" },
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
      "You read a short description written by an investor and fill in a suitability form.",
      "Reply with ONE JSON object and nothing else, using exactly these keys:",
      '{"age": integer 18 to 80 or null, "horizonYears": integer 1 to 40 or null, "riskTolerance": "low" | "medium" | "high" | null,',
      ' "toleranceInconsistent": true | false, "emergencyFund": true | false | null, "incomeStable": true | false | null,',
      ' "debtOrObligations": true | false | null, "nearTermNeed": true | false | null, "reasoning": short string}',
      "Rules: use null when the text does not say. horizonYears is how many years until the money is needed for its main goal (retirement in decades means 20 or more).",
      "nearTermNeed is true when the money may be needed soon for anything concrete (rent, tuition, a tax bill, a purchase within a year or two), even if the stated goal is far away. false when the text says the money can stay invested.",
      "debtOrObligations is true when the text mentions high-interest debt, loans to repay, or heavy fixed expenses that leave little room. false when it says debt is manageable or absent.",
      "emergencyFund is true only if the text says there is a solid cash reserve or emergency fund, false if it says the reserve is small or absent. incomeStable is true for a secure or steady income, false for irregular or variable income.",
      "riskTolerance is the investor's stated willingness to accept swings.",
      "toleranceInconsistent is IMPORTANT and common: set it true whenever the text asks for high returns or an aggressive portfolio while ALSO showing a weak position to bear losses (money needed soon, small or no reserve, debt, irregular income, or saying a loss would cause serious stress). When in doubt between high tolerance and inconsistent, choose inconsistent."
    ].join("\n");
    return [
      { role: "system", content: system },
      { role: "user", content: "Description:\n" + narrative + "\n\nJSON:" }
    ];
  }

  function parseExtraction(text) {
    if (!text) return null;
    var start = text.indexOf("{"), end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    var obj;
    try { obj = JSON.parse(text.slice(start, end + 1)); } catch (e) { return null; }
    function intIn(v, lo, hi) { var n = parseInt(v, 10); return isNaN(n) || n < lo || n > hi ? null : n; }
    function bool(v) { return v === true || v === "true" ? true : v === false || v === "false" ? false : null; }
    var tol = typeof obj.riskTolerance === "string" ? obj.riskTolerance.toLowerCase() : null;
    if (tol === "moderate") tol = "medium";
    if (["low", "medium", "high"].indexOf(tol) < 0) tol = null;
    return {
      age: intIn(obj.age, 18, 80),
      horizon: intIn(obj.horizonYears, 1, 40),
      tolerance: tol,
      toleranceInconsistent: bool(obj.toleranceInconsistent) === true,
      emergencyFund: bool(obj.emergencyFund),
      incomeStable: bool(obj.incomeStable),
      debtObligations: bool(obj.debtOrObligations),
      nearTermNeed: bool(obj.nearTermNeed),
      reasoning: typeof obj.reasoning === "string" ? obj.reasoning : ""
    };
  }

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
