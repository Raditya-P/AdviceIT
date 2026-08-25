/*
  AdviceIT by Radit, study.js
  ---------------------------------------------------------------
  The full study flow for participants (?mode=participant&flow=study):

    consent -> literacy check -> N trials -> debrief -> done

  Each trial shows one fixed hypothetical case (not the participant's own
  situation), the advisor's recommendation with the assigned explanation
  condition, and the response controls. Half of the trials show sound
  advice and half flawed advice, in an order that is random per
  participant but reproducible: the participant ID seeds the shuffle, so
  the same link always gives the same sequence. One trial carries an
  attention check (an instructed response).

  This file holds the cases, the plan builder and the texts. app.js drives
  the screens.
*/

window.AdviceIT = window.AdviceIT || {};

(function (ns) {
  "use strict";

  /* Fixed hypothetical cases. Chosen so that the advisors span the
     outcome range. Descriptions are what the participant reads. */
  var CASES = [
    {
      id: "C1", label: "Early career saver",
      profile: { age: 27, horizon: 30, tolerance: "high", emergencyFund: true, incomeStable: true, knowledge: "intermediate" },
      text: "You are 27, in a permanent job with a steady salary, and you have six months of expenses in a savings account. You are investing for retirement, roughly 30 years away, and you say you are comfortable with large swings in value along the way."
    },
    {
      id: "C2", label: "Mid-career, no buffer",
      profile: { age: 40, horizon: 15, tolerance: "medium", emergencyFund: false, incomeStable: true, knowledge: "intermediate" },
      text: "You are 40, employed with a stable income, but you do not have an emergency fund set aside. This money is for a goal about 15 years away, and you describe your attitude to risk as moderate."
    },
    {
      id: "C3", label: "Approaching retirement",
      profile: { age: 61, horizon: 6, tolerance: "low", emergencyFund: true, incomeStable: true, knowledge: "intermediate" },
      text: "You are 61, still working with a stable income, with a solid cash reserve. You expect to start drawing on this money in about 6 years, and you prefer to avoid large losses even if that means lower returns."
    },
    {
      id: "C4", label: "Freelancer with a near-term need",
      profile: { age: 34, horizon: 2, tolerance: "high", emergencyFund: false, incomeStable: false, knowledge: "intermediate" },
      text: "You are 34, self-employed with an income that varies a lot from month to month, and only a small cash reserve. You may need this money within about 2 years for a house deposit, but you say you want the highest possible return."
    },
    {
      id: "C5", label: "Steady mid-life investor",
      profile: { age: 48, horizon: 12, tolerance: "medium", emergencyFund: true, incomeStable: true, knowledge: "intermediate" },
      text: "You are 48, with a stable job and a comfortable emergency fund. This money is for a goal about 12 years away, and you describe yourself as moderately comfortable with risk."
    },
    {
      id: "C6", label: "Young, variable income",
      profile: { age: 30, horizon: 20, tolerance: "medium", emergencyFund: true, incomeStable: false, knowledge: "intermediate" },
      text: "You are 30, working on short contracts so your income is irregular, but you keep six months of expenses in cash. You are investing for about 20 years and would accept moderate ups and downs."
    },
    {
      id: "C7", label: "Cautious saver, long horizon",
      profile: { age: 36, horizon: 25, tolerance: "low", emergencyFund: true, incomeStable: true, knowledge: "intermediate" },
      text: "You are 36, in a secure job with a full emergency fund. You are investing for about 25 years, but you say you would find any noticeable loss stressful and prefer a cautious approach."
    },
    {
      id: "C8", label: "Late starter",
      profile: { age: 55, horizon: 10, tolerance: "high", emergencyFund: false, incomeStable: true, knowledge: "intermediate" },
      text: "You are 55, employed with a stable income, without an emergency fund. You want to catch up on retirement savings over the next 10 years and say you are willing to take substantial risk to do so."
    }
  ];

  /* Small seeded generator (mulberry32) so a participant ID always gives
     the same order. */
  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(list, rand) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Build the trial plan: n trials, half sound and half flawed, cases and
     order shuffled with the participant seed, attention check on the
     third trial (or the last if fewer). */
  function buildPlan(participantId, n) {
    var count = Math.max(2, Math.min(12, n || 6));
    var rand = mulberry32(hashString(String(participantId || "anon")));
    var cases = shuffle(CASES, rand);
    var picked = [];
    for (var i = 0; i < count; i++) picked.push(cases[i % cases.length]);
    var scenarios = [];
    for (var k = 0; k < count; k++) scenarios.push(k < Math.ceil(count / 2) ? "sound" : "flawed");
    scenarios = shuffle(scenarios, rand);
    var attentionIndex = Math.min(2, count - 1);
    return picked.map(function (c, idx) {
      return { index: idx, profileId: c.id, label: c.label, text: c.text, profile: c.profile, scenario: scenarios[idx], attention: idx === attentionIndex };
    });
  }

  var TEXTS = {
    consentTitle: "Before you start",
    consent: [
      "This is a research study about how people use investment advice from an automated advisor. It takes about 10 to 15 minutes.",
      "You will read a few short descriptions of hypothetical investors, see the advisor's recommendation for each of them, and tell us whether you would follow it and how much you trust it. Some questions about financial knowledge come first.",
      "Nothing here is real financial advice, and no real money is involved. Please answer as the person described in each case.",
      "Your answers are stored under an anonymous participant ID together with the recommendation you saw and your responses. No name, email or account information is collected. You can stop at any time by closing this page.",
      "By continuing you confirm that you have read this and agree to take part."
    ],
    literacyTitle: "Three quick questions",
    literacyIntro: "These questions are about general financial knowledge. There is no penalty for answering \"Do not know\".",
    debriefTitle: "Thank you. One more thing you should know",
    debriefIntro: "In this study some of the recommendations you saw were deliberately altered to be unsuitable for the case, in order to measure how people react to good and bad automated advice. The altered trials were:",
    debriefOutro: "The advisor and the recommendations are part of a research instrument, not a financial service. If you have questions about the study, please contact the researcher.",
    doneTitle: "All done",
    done: "Your responses have been recorded. You can close this page. If the researcher asked you to, you can download your responses below and send them the file."
  };

  ns.study = {
    CASES: CASES,
    TEXTS: TEXTS,
    buildPlan: buildPlan,
    hashString: hashString
  };
})(window.AdviceIT);
