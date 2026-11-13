/* Sample-size planning for the main study, by simulation.

   Each simulated study has N participants in each of the five conditions.
   Every participant judges the eight cases, four with sound advice and four
   with flawed advice, and relies on each piece of advice with a probability
   set on the logit scale by: the scenario, the condition, a participant
   effect and a case effect. The analysis is a planning stand-in for the
   pre-registered mixed model: each participant's discrimination score (the
   share of sound advice relied on minus the share of flawed advice relied
   on) is compared between each explanation condition and No explanation
   with Welch's t test, Holm-corrected over the four comparisons.

   The defaults are assumptions, not estimates. Replace them with the pilot's
   figures (reliance on sound and flawed advice in the control, the spread
   between participants and between cases) before fixing the sample size:

     npx tsx scripts/power-sim.ts --sound 0.80 --flawed 0.55 --drop 0.15 --sdp 1.0 --sdc 0.5

   --sound    reliance on sound advice in the control
   --flawed   reliance on flawed advice in the control
   --drop     how much the "shows the facts" conditions (Why, What would
              change it, All three) lower reliance on flawed advice
   --sdp      participant spread, standard deviation on the logit scale
   --sdc      case spread, standard deviation on the logit scale
   --n        sample sizes per condition to try, comma separated
   --sims     simulated studies per sample size
*/

type Args = { sound: number; flawed: number; drop: number; sdp: number; sdc: number; n: number[]; sims: number };

function args(): Args {
  const a: Args = { sound: 0.8, flawed: 0.55, drop: 0.15, sdp: 1.0, sdc: 0.5, n: [40, 60, 80, 100, 120, 150], sims: 2000 };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i].replace(/^--/, "") as keyof Args;
    const v = argv[i + 1];
    if (k === "n") a.n = v.split(",").map(Number);
    else if (k in a) (a as Record<string, unknown>)[k] = Number(v);
  }
  return a;
}

/* Seeded so a run can be repeated exactly. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const logit = (p: number) => Math.log(p / (1 - p));
const expit = (x: number) => 1 / (1 + Math.exp(-x));

/* Two-sided p value of Student's t through the regularised incomplete beta
   function (continued fraction, Numerical Recipes). */
function lnGamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const ci of c) ser += ci / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
function betacf(a: number, b: number, x: number): number {
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
}
function incBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
function tTestP(t: number, df: number): number {
  return incBeta(df / 2, 0.5, df / (df + t * t));
}
function welch(x: number[], y: number[]): number {
  const mean = (v: number[]) => v.reduce((s, z) => s + z, 0) / v.length;
  const vari = (v: number[], m: number) => v.reduce((s, z) => s + (z - m) ** 2, 0) / (v.length - 1);
  const mx = mean(x);
  const my = mean(y);
  const vx = vari(x, mx) / x.length;
  const vy = vari(y, my) / y.length;
  const se = Math.sqrt(vx + vy);
  if (se === 0) return 1;
  const df = (vx + vy) ** 2 / (vx ** 2 / (x.length - 1) + vy ** 2 / (y.length - 1));
  return tTestP((mx - my) / se, df);
}
function holm(p: number[], alpha = 0.05): boolean[] {
  const order = p.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const reject = new Array(p.length).fill(false);
  for (let k = 0; k < order.length; k++) {
    if (order[k][0] <= alpha / (order.length - k)) reject[order[k][1]] = true;
    else break;
  }
  return reject;
}
function normal(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

const CONDITIONS = ["none", "feature", "counterfactual", "confidence", "hybrid"] as const;
/* Which conditions show the facts the advisor used, and so are expected to
   lower reliance on flawed advice (hypothesis 2). "confidence" is expected
   to leave it unchanged (hypothesis 3). */
const SHOWS_FACTS = new Set(["feature", "counterfactual", "hybrid"]);

function run(a: Args) {
  const base = { sound: logit(a.sound), flawed: logit(a.flawed) };
  const flawedWithFacts = logit(Math.max(0.01, a.flawed - a.drop)) - base.flawed;
  console.log(
    `Assumptions: reliance on sound ${a.sound}, on flawed ${a.flawed} in the control; ` +
      `flawed reliance ${a.drop} lower where the facts are shown; participant sd ${a.sdp}, case sd ${a.sdc} (logit); ${a.sims} studies each.`,
  );
  console.log("n per condition | Why | What would change it | All three | all three of these | How sure (should stay near 5%)");
  for (const n of a.n) {
    const rand = mulberry32(20261113 + n);
    const hits = { feature: 0, counterfactual: 0, hybrid: 0, all: 0, confidence: 0 };
    for (let s = 0; s < a.sims; s++) {
      const caseEffect = Array.from({ length: 8 }, () => normal(rand) * a.sdc);
      const scores: Record<string, number[]> = {};
      for (const c of CONDITIONS) {
        scores[c] = [];
        for (let i = 0; i < n; i++) {
          const person = normal(rand) * a.sdp;
          /* four sound and four flawed cases, which cases is random */
          const flawedSet = new Set<number>();
          while (flawedSet.size < 4) flawedSet.add(Math.floor(rand() * 8));
          let relSound = 0;
          let relFlawed = 0;
          for (let k = 0; k < 8; k++) {
            const flawed = flawedSet.has(k);
            let eta = (flawed ? base.flawed : base.sound) + person + caseEffect[k];
            if (flawed && SHOWS_FACTS.has(c)) eta += flawedWithFacts;
            if (rand() < expit(eta)) {
              if (flawed) relFlawed++;
              else relSound++;
            }
          }
          scores[c].push(relSound / 4 - relFlawed / 4);
        }
      }
      const tests = ["feature", "counterfactual", "confidence", "hybrid"].map((c) => welch(scores[c], scores.none));
      const rej = holm(tests);
      if (rej[0]) hits.feature++;
      if (rej[1]) hits.counterfactual++;
      if (rej[2]) hits.confidence++;
      if (rej[3]) hits.hybrid++;
      if (rej[0] && rej[1] && rej[3]) hits.all++;
    }
    const pc = (k: number) => `${Math.round((k / a.sims) * 100)}%`.padStart(4);
    console.log(
      `${String(n).padStart(15)} | ${pc(hits.feature)} | ${pc(hits.counterfactual).padStart(20)} | ${pc(hits.hybrid).padStart(9)} | ${pc(hits.all).padStart(18)} | ${pc(hits.confidence)}`,
    );
  }
}

run(args());
