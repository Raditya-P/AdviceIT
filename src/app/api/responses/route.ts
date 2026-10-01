/* The data collector. POST stores rows in Neon (anonymous, capped,
   key-whitelisted). GET returns the rows to the researcher, one page at a
   time, and requires the RESEARCHER_KEY. Without a DATABASE_URL the POST
   answers 503 and the client keeps rows buffered in the participant's
   browser.

   Three row types. "trial" and "exit" are the study proper, from /study.
   "explore" is a visitor trying an advisor on the advisor pages: same
   measures, but self-chosen condition and self-written profile, so it is a
   convenience sample kept out of the experimental analysis by row type. */

import { neon } from "@neondatabase/serverless";
import { createHash, timingSafeEqual } from "node:crypto";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { MAX_BODY_BYTES, MAX_ROWS_PER_POST, PARTICIPANT_ID_PATTERN } from "@/lib/records";
import { INSERT_ROW } from "@/lib/sql";

/* Limits. A study session is six trial rows and one exit row, so anything
   beyond these is not a participant. */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_POSTS = 60;

/* A serverless response has a size ceiling (4.5 MB on Vercel) that the
   whole data set passes after a few hundred participants, so GET returns
   pages of this many rows. */
const PAGE_ROWS = 1000;

/* Constant-time comparison on fixed-length digests, so key length and
   prefix matches leak nothing through timing. */
function keyMatches(given: string | null, expected: string | undefined): boolean {
  if (!given || !expected) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/* The key travels in an Authorization header. ?key= still works for
   scripts written against earlier versions, but a query string ends up in
   request logs, so the dashboard no longer sends it that way. */
function givenKey(request: Request, params: URLSearchParams): string | null {
  const bearer = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "");
  return bearer ? bearer[1].trim() : params.get("key");
}

const NO_STORE = { "Cache-Control": "no-store" };

const ALLOWED_KEYS = new Set([
  "rowType", "timestamp", "participantId", "condition", "explanationContent", "explanationForm",
  "explanationModality", "assignedBy", "assignmentMethod", "advisorModel", "advisorAssignedBy", "language", "scenario", "trialIndex", "trialProfileId",
  "age", "horizon", "tolerance", "toleranceInconsistent", "emergencyFund", "incomeStable",
  "debtObligations", "nearTermNeed", "knowledge", "suitabilityTolerance", "suitabilityCapacity",
  "suitabilityLiquidity", "recommendedPortfolio", "soundPortfolio", "score", "margin", "confidence",
  "trustRating", "decision", "adjustedTo", "adjustSteps", "understanding", "decisionConfidence",
  "mentalDemand", "reason", "literacyScore", "literacyAnswers", "literacyLevel", "nfcScore", "nfcAnswers",
  "easeOfSatisfaction", "easeAnswers", "percTrust", "percTransparency", "percPersuasiveness",
  "percUsefulness", "percSatisfaction", "whatIfMoves",
  "whyNotAsked", "adaptiveVariant", "attentionCheck", "decisionTimeMs", "llmModel", "llmExplanation",
  "llmTurns", "llmRoutedTurns", "llmIntents", "llmModelAvailable", "exitDistrustMoment", "exitMissingExplanation", "userAgentMobile", "caseReadMs",
  "profileSource", "tryIndex", "sessionResumes", "sessionElapsedMs",
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
  if (typeof out.participantId !== "string" || !PARTICIPANT_ID_PATTERN.test(out.participantId) || typeof out.rowType !== "string") return null;
  if (out.rowType !== "trial" && out.rowType !== "exit" && out.rowType !== "explore") return null;
  return out;
}

export async function POST(request: Request) {
  const url = process.env.DATABASE_URL;
  if (!url) return Response.json({ error: "storage not configured" }, { status: 503, headers: NO_STORE });
  if (rateLimited("responses", clientIp(request), RATE_MAX_POSTS, RATE_WINDOW_MS)) {
    return Response.json({ error: "too many requests" }, { status: 429, headers: NO_STORE });
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return Response.json({ error: "payload too large" }, { status: 413, headers: NO_STORE });
  /* The declared length is only a hint, and a chunked request has none, so
     the cap is checked again on the bytes actually received. */
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return Response.json({ error: "payload too large" }, { status: 413, headers: NO_STORE });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400, headers: NO_STORE });
  }
  const rows = Array.isArray((body as { rows?: unknown[] })?.rows) ? (body as { rows: unknown[] }).rows : [];
  if (!rows.length || rows.length > MAX_ROWS_PER_POST) {
    return Response.json({ error: `expected 1 to ${MAX_ROWS_PER_POST} rows` }, { status: 400, headers: NO_STORE });
  }
  const clean = rows.map((r) => sanitize(r as Record<string, unknown>)).filter((r): r is Record<string, unknown> => r !== null);
  if (!clean.length) return Response.json({ error: "no valid rows" }, { status: 400, headers: NO_STORE });
  const sql = neon(url);
  /* One transaction for the whole batch, so a failure stores nothing and a
     retry cannot leave half a batch stored twice. INSERT_ROW skips a row the
     database already holds. */
  let results: unknown[][];
  try {
    results = await sql.transaction((txn) =>
      clean.map((row) =>
        txn.query(INSERT_ROW, [
          row.participantId,
          row.rowType,
          row.condition ?? null,
          row.advisorModel ?? null,
          row.scenario ?? null,
          JSON.stringify(row),
          typeof row.timestamp === "string" ? row.timestamp : null,
          row.trialIndex === undefined ? null : String(row.trialIndex),
        ]),
      ),
    );
  } catch {
    return Response.json({ error: "storage failed" }, { status: 500, headers: NO_STORE });
  }
  const stored = results.filter((r) => r.length > 0).length;
  return Response.json({ ok: true, stored, duplicates: clean.length - stored }, { headers: NO_STORE });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (!keyMatches(givenKey(request, params), process.env.RESEARCHER_KEY)) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }
  /* check=1 confirms the key without returning any data. The dashboard uses
     it to unlock researcher controls on the advisor pages. */
  if (params.get("check") === "1") return Response.json({ ok: true }, { headers: NO_STORE });
  const url = process.env.DATABASE_URL;
  if (!url) return Response.json({ error: "storage not configured" }, { status: 503, headers: NO_STORE });
  /* Oldest first. Pass the returned `next` back as ?after= for the page
     that follows; `next` is null on the last page. */
  const after = Math.max(0, Math.floor(Number(params.get("after")) || 0));
  const sql = neon(url);
  const found = await sql`select id, created_at, payload from responses where id > ${after} order by id asc limit ${PAGE_ROWS + 1}`;
  const page = found.slice(0, PAGE_ROWS);
  const next = found.length > PAGE_ROWS ? Number(page[page.length - 1].id) : null;
  return Response.json(
    { count: page.length, next, rows: page.map((r) => ({ id: r.id, createdAt: r.created_at, ...(r.payload as object) })) },
    { headers: NO_STORE },
  );
}
