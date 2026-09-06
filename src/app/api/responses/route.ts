/* The data collector. POST stores rows in Neon (anonymous, capped,
   key-whitelisted). GET returns all rows to the researcher and requires the
   RESEARCHER_KEY. Without a DATABASE_URL the POST answers 503 and the
   client keeps rows buffered in the participant's browser.

   Three row types. "trial" and "exit" are the study proper, from /study.
   "explore" is a visitor trying an advisor on the advisor pages: same
   measures, but self-chosen condition and self-written profile, so it is a
   convenience sample kept out of the experimental analysis by row type. */

import { neon } from "@neondatabase/serverless";
import { createHash, timingSafeEqual } from "node:crypto";

/* Limits. A study session is six trial rows and one exit row, so anything
   beyond these is not a participant. The rate limiter is in-memory and
   therefore per serverless instance: it is a brake on casual abuse, not a
   guarantee, and the payload and row caps are what actually bound the cost. */
const MAX_BODY_BYTES = 256_000;
const MAX_ROWS = 50;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_POSTS = 60;
const PARTICIPANT_ID = /^[A-Za-z0-9_-]{1,40}$/;
const hits = new Map<string, { n: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  h.n += 1;
  return h.n > RATE_MAX_POSTS;
}

function clientIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

/* Constant-time comparison on fixed-length digests, so key length and
   prefix matches leak nothing through timing. */
function keyMatches(given: string | null, expected: string | undefined): boolean {
  if (!given || !expected) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

const NO_STORE = { "Cache-Control": "no-store" };

const ALLOWED_KEYS = new Set([
  "rowType", "timestamp", "participantId", "condition", "explanationContent", "explanationForm",
  "explanationModality", "assignedBy", "advisorModel", "advisorAssignedBy", "language", "scenario", "trialIndex", "trialProfileId",
  "age", "horizon", "tolerance", "toleranceInconsistent", "emergencyFund", "incomeStable",
  "debtObligations", "nearTermNeed", "knowledge", "suitabilityTolerance", "suitabilityCapacity",
  "suitabilityLiquidity", "recommendedPortfolio", "soundPortfolio", "score", "margin", "confidence",
  "trustRating", "decision", "adjustedTo", "adjustSteps", "understanding", "decisionConfidence",
  "mentalDemand", "reason", "literacyScore", "literacyAnswers", "literacyLevel", "nfcScore", "nfcAnswers",
  "easeOfSatisfaction", "easeAnswers", "percTrust", "percTransparency", "percPersuasiveness",
  "percUsefulness", "percSatisfaction", "whatIfMoves",
  "whyNotAsked", "adaptiveVariant", "attentionCheck", "decisionTimeMs", "llmModel", "llmExplanation",
  "llmTurns", "llmRoutedTurns", "llmIntents", "llmModelAvailable", "exitDistrustMoment", "exitMissingExplanation", "userAgentMobile", "caseReadMs",
  "profileSource", "tryIndex",
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
  if (typeof out.participantId !== "string" || !PARTICIPANT_ID.test(out.participantId) || typeof out.rowType !== "string") return null;
  if (out.rowType !== "trial" && out.rowType !== "exit" && out.rowType !== "explore") return null;
  return out;
}

export async function POST(request: Request) {
  const url = process.env.DATABASE_URL;
  if (!url) return Response.json({ error: "storage not configured" }, { status: 503, headers: NO_STORE });
  if (rateLimited(clientIp(request))) return Response.json({ error: "too many requests" }, { status: 429, headers: NO_STORE });
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return Response.json({ error: "payload too large" }, { status: 413, headers: NO_STORE });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const rows = Array.isArray((body as { rows?: unknown[] })?.rows) ? (body as { rows: unknown[] }).rows : [];
  if (!rows.length || rows.length > MAX_ROWS) return Response.json({ error: `expected 1 to ${MAX_ROWS} rows` }, { status: 400, headers: NO_STORE });
  const clean = rows.map((r) => sanitize(r as Record<string, unknown>)).filter((r): r is Record<string, unknown> => r !== null);
  if (!clean.length) return Response.json({ error: "no valid rows" }, { status: 400 });
  const sql = neon(url);
  for (const row of clean) {
    await sql`insert into responses (participant_id, row_type, condition, advisor, scenario, payload)
      values (${row.participantId as string}, ${row.rowType as string}, ${(row.condition as string) ?? null},
              ${(row.advisorModel as string) ?? null}, ${(row.scenario as string) ?? null}, ${JSON.stringify(row)}::jsonb)`;
  }
  return Response.json({ ok: true, stored: clean.length }, { headers: NO_STORE });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (!keyMatches(params.get("key"), process.env.RESEARCHER_KEY)) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }
  /* check=1 confirms the key without returning any data. The dashboard uses
     it to unlock researcher controls on the advisor pages. */
  if (params.get("check") === "1") return Response.json({ ok: true }, { headers: NO_STORE });
  const url = process.env.DATABASE_URL;
  if (!url) return Response.json({ error: "storage not configured" }, { status: 503, headers: NO_STORE });
  const sql = neon(url);
  const rows = await sql`select id, created_at, payload from responses order by created_at asc limit 20000`;
  return Response.json(
    { count: rows.length, rows: rows.map((r) => ({ id: r.id, createdAt: r.created_at, ...(r.payload as object) })) },
    { headers: NO_STORE },
  );
}
