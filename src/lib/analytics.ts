/* Descriptive analytics over collected study rows, ported from AdviceIT v1
   analytics.js. Pure functions: rows in, tables out. No inference. */

export type Row = Record<string, unknown>;

export const CONDITION_ORDER = ["none", "feature", "counterfactual", "confidence", "hybrid", "interactive", "interactive-hybrid", "adaptive", "llm", "custom"];
export const CONDITION_LABELS: Record<string, string> = {
  none: "No explanation",
  feature: "Why (feature-based)",
  counterfactual: "What would change it",
  confidence: "How sure",
  hybrid: "All three (hybrid)",
  interactive: "Interactive only",
  "interactive-hybrid": "Interactive with all three",
  adaptive: "Adaptive to literacy",
  llm: "Conversational",
  custom: "Custom",
};
export const ADVISOR_LABELS: Record<string, string> = { ml: "AI advisor (network)", logit: "Interpretable rule-based" };
const OVERRIDES = new Set(["adjust", "reject", "ask-human"]);

const num = (v: unknown) => {
  const n = Number(v);
  return v === "" || v === null || v === undefined || isNaN(n) ? NaN : n;
};
export const mean = (list: number[]) => {
  const v = list.filter((x) => !isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
export const median = (list: number[]) => {
  const v = list.filter((x) => !isNaN(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
export const fmt = (x: number | null, d = 0) => (x === null ? "" : String(Math.round(x * 10 ** d) / 10 ** d));
export const pct = (n: number, den: number) => (den ? `${Math.round((n / den) * 1000) / 10}%` : "");

export const trials = (rows: Row[]) => rows.filter((r) => r.rowType === "trial" || r.rowType === undefined);
export const exits = (rows: Row[]) => rows.filter((r) => r.rowType === "exit");

export function overview(rows: Row[]) {
  const t = trials(rows);
  const participants = new Set(t.map((r) => r.participantId));
  const byCondition = CONDITION_ORDER.map((c) => ({
    key: CONDITION_LABELS[c],
    n: t.filter((r) => r.condition === c).length,
  })).filter((x) => x.n);
  const byAdvisor = Object.keys(ADVISOR_LABELS)
    .map((a) => ({ key: ADVISOR_LABELS[a], n: t.filter((r) => r.advisorModel === a).length }))
    .filter((x) => x.n);
  const byAssigned = ["random", "chosen"].map((a) => ({ key: `condition ${a}`, n: t.filter((r) => r.assignedBy === a).length }));
  const byScenario = ["sound", "flawed"].map((s) => ({ key: s, n: t.filter((r) => r.scenario === s).length }));
  return { total: t.length, participants: participants.size, byCondition, byAdvisor, byAssigned, byScenario };
}

export interface RelianceRow {
  condition: string;
  n: number;
  soundN: number;
  followSound: string;
  flawedN: number;
  overrideFlawed: string;
  appropriate: string;
  overReliance: string;
  underReliance: string;
  askedHuman: string;
}

export function relianceTable(rows: Row[]): RelianceRow[] {
  const t = trials(rows);
  const out: RelianceRow[] = [];
  for (const c of [...CONDITION_ORDER, "all"]) {
    const rs = c === "all" ? t : t.filter((r) => r.condition === c);
    if (!rs.length) continue;
    const sound = rs.filter((r) => r.scenario === "sound");
    const flawed = rs.filter((r) => r.scenario === "flawed");
    const followSound = sound.filter((r) => r.decision === "follow").length;
    const overrideFlawed = flawed.filter((r) => OVERRIDES.has(String(r.decision))).length;
    out.push({
      condition: c === "all" ? "All conditions" : CONDITION_LABELS[c],
      n: rs.length,
      soundN: sound.length,
      followSound: pct(followSound, sound.length),
      flawedN: flawed.length,
      overrideFlawed: pct(overrideFlawed, flawed.length),
      appropriate: pct(followSound + overrideFlawed, sound.length + flawed.length),
      overReliance: pct(flawed.filter((r) => r.decision === "follow").length, flawed.length),
      underReliance: pct(sound.filter((r) => OVERRIDES.has(String(r.decision))).length, sound.length),
      askedHuman: pct(rs.filter((r) => r.decision === "ask-human").length, rs.length),
    });
  }
  return out;
}

export function measuresTable(rows: Row[]) {
  const t = trials(rows);
  const out: { label: string; n: number; trust: string; timeS: string; understanding: string; confidence: string; demand: string }[] = [];
  for (const c of CONDITION_ORDER) {
    for (const s of ["sound", "flawed"]) {
      const rs = t.filter((r) => r.condition === c && r.scenario === s);
      if (!rs.length) continue;
      out.push({
        label: `${CONDITION_LABELS[c]}, ${s}`,
        n: rs.length,
        trust: fmt(mean(rs.map((r) => num(r.trustRating))), 2),
        timeS: fmt(median(rs.map((r) => num(r.decisionTimeMs) / 1000)), 1),
        understanding: fmt(mean(rs.map((r) => num(r.understanding))), 2),
        confidence: fmt(mean(rs.map((r) => num(r.decisionConfidence))), 2),
        demand: fmt(mean(rs.map((r) => num(r.mentalDemand))), 2),
      });
    }
  }
  return out;
}

export function quality(rows: Row[]) {
  const t = trials(rows);
  const att = t.filter((r) => r.attentionCheck);
  const passed = att.filter((r) => r.attentionCheck === "passed").length;
  const byLevel = ["low", "high"].map((l) => {
    const rs = t.filter((r) => r.literacyLevel === l);
    const sound = rs.filter((r) => r.scenario === "sound");
    const flawed = rs.filter((r) => r.scenario === "flawed");
    const ok = sound.filter((r) => r.decision === "follow").length + flawed.filter((r) => OVERRIDES.has(String(r.decision))).length;
    return { level: l, n: rs.length, appropriate: pct(ok, rs.length), trust: fmt(mean(rs.map((r) => num(r.trustRating))), 2) };
  });
  const fastest = t.filter((r) => num(r.decisionTimeMs) < 2000).length;
  return { attentionTotal: att.length, attentionPassed: passed, byLevel, under2s: fastest };
}

export function toCSV(rows: Row[]): string {
  const keys = Array.from(rows.reduce((set, r) => {
    Object.keys(r).forEach((k) => set.add(k));
    return set;
  }, new Set<string>()));
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => cell(r[k])).join(","))].join("\r\n") + "\r\n";
}
