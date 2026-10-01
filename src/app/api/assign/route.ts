/* Balanced assignment. A participant who starts a session through the
   random path is put, at consent, in the explanation condition and advisor
   cell with the fewest people so far, ties broken at random (the counting
   rule is in src/lib/sql.ts). Simple randomisation over sixteen cells
   leaves a pilot-sized sample badly uneven; this keeps the cells level.

   The assignment is written as an "assign" row in the responses table. Only
   this route writes that type, and set beside the exit rows it gives the
   dropout per condition. The same participant asking twice gets the same
   cell. Without a database the route answers 503, and the browser keeps the
   condition it drew itself, logged as assignmentMethod "simple". */

import { neon } from "@neondatabase/serverless";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { PARTICIPANT_ID_PATTERN } from "@/lib/records";
import { ASSIGN_LOCK, ASSIGN_PICK, ASSIGN_READ } from "@/lib/sql";
import { ASSIGNABLE_CONDITIONS } from "@/lib/study";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_BODY_BYTES = 1_000;

export async function POST(request: Request) {
  const url = process.env.DATABASE_URL;
  if (!url) return Response.json({ error: "storage not configured" }, { status: 503, headers: NO_STORE });
  if (rateLimited("assign", clientIp(request), 20, 10 * 60 * 1000)) {
    return Response.json({ error: "too many requests" }, { status: 429, headers: NO_STORE });
  }
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return Response.json({ error: "payload too large" }, { status: 413, headers: NO_STORE });
  }
  let body: { participantId?: unknown; language?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400, headers: NO_STORE });
  }
  const participantId = body?.participantId;
  if (typeof participantId !== "string" || !PARTICIPANT_ID_PATTERN.test(participantId)) {
    return Response.json({ error: "invalid participant id" }, { status: 400, headers: NO_STORE });
  }
  const language = body.language === "id" ? "id" : "en";
  const sql = neon(url);
  try {
    const results = await sql.transaction((txn) => [
      txn.query(ASSIGN_LOCK),
      txn.query(ASSIGN_PICK, [participantId, ASSIGNABLE_CONDITIONS.join(","), language]),
      txn.query(ASSIGN_READ, [participantId]),
    ]);
    const cell = results[2]?.[0] as { condition?: string; advisor?: string } | undefined;
    if (!cell?.condition || !cell.advisor) {
      return Response.json({ error: "no cell" }, { status: 500, headers: NO_STORE });
    }
    return Response.json({ condition: cell.condition, advisor: cell.advisor }, { headers: NO_STORE });
  } catch {
    return Response.json({ error: "assignment failed" }, { status: 500, headers: NO_STORE });
  }
}
