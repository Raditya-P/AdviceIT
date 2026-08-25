/* The data collector. POST stores study rows in Neon (anonymous, capped,
   key-whitelisted). GET returns all rows to the researcher and requires the
   RESEARCHER_KEY. Without a DATABASE_URL the POST answers 503 and the
   client keeps rows buffered in the participant's browser. */

import { neon } from "@neondatabase/serverless";

const ALLOWED_KEYS = new Set([
  "rowType", "timestamp", "participantId", "condition", "explanationContent", "explanationForm",
  "assignedBy", "advisorModel", "advisorAssignedBy", "scenario", "trialIndex", "trialProfileId",
  "age", "horizon", "tolerance", "toleranceInconsistent", "emergencyFund", "incomeStable",
  "debtObligations", "nearTermNeed", "knowledge", "suitabilityTolerance", "suitabilityCapacity",
  "suitabilityLiquidity", "recommendedPortfolio", "soundPortfolio", "score", "margin", "confidence",
  "trustRating", "decision", "adjustedTo", "adjustSteps", "understanding", "decisionConfidence",
  "mentalDemand", "reason", "literacyScore", "literacyAnswers", "literacyLevel", "whatIfMoves",
  "whyNotAsked", "adaptiveVariant", "attentionCheck", "decisionTimeMs", "llmModel", "llmExplanation",
  "llmTurns", "exitDistrustMoment", "exitMissingExplanation", "userAgentMobile",
]);

function sanitize(row: Record<string, unknown>): Record<string, unknown> | null {
  if (typeof row !== "object" || row === null) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (!ALLOWED_KEYS.has(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 5000);
    else if (typeof v === "number" && isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
  }
  if (typeof out.participantId !== "string" || !out.participantId || typeof out.rowType !== "string") return null;
  if (out.rowType !== "trial" && out.rowType !== "exit") return null;
  return out;
}

export async function POST(request: Request) {
  const url = process.env.DATABASE_URL;
  if (!url) return Response.json({ error: "storage not configured" }, { status: 503 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const rows = Array.isArray((body as { rows?: unknown[] })?.rows) ? (body as { rows: unknown[] }).rows : [];
  if (!rows.length || rows.length > 50) return Response.json({ error: "expected 1 to 50 rows" }, { status: 400 });
  const clean = rows.map((r) => sanitize(r as Record<string, unknown>)).filter((r): r is Record<string, unknown> => r !== null);
  if (!clean.length) return Response.json({ error: "no valid rows" }, { status: 400 });
  const sql = neon(url);
  for (const row of clean) {
    await sql`insert into responses (participant_id, row_type, condition, advisor, scenario, payload)
      values (${row.participantId as string}, ${row.rowType as string}, ${(row.condition as string) ?? null},
              ${(row.advisorModel as string) ?? null}, ${(row.scenario as string) ?? null}, ${JSON.stringify(row)}::jsonb)`;
  }
  return Response.json({ ok: true, stored: clean.length });
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!process.env.RESEARCHER_KEY || key !== process.env.RESEARCHER_KEY) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = process.env.DATABASE_URL;
  if (!url) return Response.json({ error: "storage not configured" }, { status: 503 });
  const sql = neon(url);
  const rows = await sql`select id, created_at, payload from responses order by created_at asc limit 20000`;
  return Response.json({ count: rows.length, rows: rows.map((r) => ({ id: r.id, createdAt: r.created_at, ...(r.payload as object) })) });
}
