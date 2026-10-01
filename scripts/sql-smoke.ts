/* The collector's SQL, run against an in-memory Postgres (PGlite) built
   from db/schema.sql. These are the statements every response and every
   assignment go through, so the checks cover what would silently corrupt
   the data: a resent row stored twice, a genuinely new row skipped,
   balanced assignment filling one cell twice before the others once, an
   abandoned session holding its place for ever, and a repeated request
   moving someone to another cell. */

import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { ASSIGN_LOCK, ASSIGN_PICK, ASSIGN_READ, INSERT_ROW } from "@/lib/sql";
import { ASSIGNABLE_CONDITIONS } from "@/lib/study";

let failures = 0;
function ok(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`ok   ${name}`);
  else {
    failures++;
    console.log(`FAIL ${name} ${detail}`);
  }
}

type Cell = { condition: string; advisor: string };

async function main() {
  const db = new PGlite();
  await db.exec(readFileSync("db/schema.sql", "utf8"));

  const insert = async (row: Record<string, unknown>) => {
    const res = await db.query(INSERT_ROW, [
      row.participantId,
      row.rowType,
      row.condition ?? null,
      row.advisorModel ?? null,
      row.scenario ?? null,
      JSON.stringify(row),
      typeof row.timestamp === "string" ? row.timestamp : null,
      row.trialIndex === undefined ? null : String(row.trialIndex),
    ]);
    return res.rows.length;
  };
  const assign = (pid: string, conditions: readonly string[] = ASSIGNABLE_CONDITIONS) =>
    db.transaction(async (tx) => {
      await tx.query(ASSIGN_LOCK);
      await tx.query(ASSIGN_PICK, [pid, conditions.join(","), "en"]);
      return (await tx.query<Cell>(ASSIGN_READ, [pid])).rows[0];
    });
  /* With a single condition there are two cells, hybrid with each advisor,
     which makes the counting rule testable without luck: each case below
     is set up so that the right rule and the wrong one pick different cells. */
  const ONE = ["hybrid"];
  const age = (pid: string, interval: string) =>
    db.exec(`update responses set created_at = now() - interval '${interval}' where participant_id = '${pid}'`);
  const holder = async (pid: string, advisor: string, opts: { finished?: "random" | "chosen"; ageBy?: string } = {}) => {
    await db.query(
      `insert into responses (participant_id, row_type, condition, advisor, payload)
       values ($1, 'assign', 'hybrid', $2, jsonb_build_object('rowType', 'assign', 'assignedBy', 'random'))`,
      [pid, advisor],
    );
    if (opts.finished) {
      await insert({ rowType: "exit", participantId: pid, condition: "hybrid", advisorModel: advisor, assignedBy: opts.finished, timestamp: `t-${pid}` });
    }
    if (opts.ageBy) await age(pid, opts.ageBy);
  };
  const count = async (where: string) =>
    Number((await db.query<{ n: number }>(`select count(*)::int as n from responses where ${where}`)).rows[0].n);

  /* Storing rows. */
  const trial = { rowType: "trial", participantId: "P-AAA111", condition: "hybrid", advisorModel: "ml", scenario: "sound", trialIndex: 1, timestamp: "2026-10-01T10:00:00.000Z" };
  ok("a new row is stored", (await insert(trial)) === 1);
  ok("the same row sent again is skipped", (await insert(trial)) === 0);
  ok("the next trial is stored", (await insert({ ...trial, trialIndex: 2, timestamp: "2026-10-01T10:01:00.000Z" })) === 1);
  ok("same trial, later timestamp, is a new row", (await insert({ ...trial, timestamp: "2026-10-01T10:05:00.000Z" })) === 1);
  const exitRow = { rowType: "exit", participantId: "P-AAA111", condition: "hybrid", advisorModel: "ml", assignedBy: "random", timestamp: "2026-10-01T10:09:00.000Z" };
  ok("an exit row without a trial index is stored", (await insert(exitRow)) === 1);
  ok("the exit row sent again is skipped", (await insert(exitRow)) === 0);
  ok("another participant's identical row is stored", (await insert({ ...trial, participantId: "P-BBB222" })) === 1);
  ok("a row without condition or advisor is stored", (await insert({ rowType: "explore", participantId: "V-XYZ", timestamp: "2026-10-01T11:00:00.000Z" })) === 1);
  ok("the payload keeps every field", (await count(`payload->>'scenario' = 'sound' and payload->>'trialIndex' = '2'`)) === 1);
  await db.exec("delete from responses");

  /* Balanced assignment. */
  const cellsSeen = new Set<string>();
  for (let i = 0; i < 16; i++) {
    const c = await assign(`P-FILL${i}`);
    cellsSeen.add(`${c.condition}|${c.advisor}`);
  }
  ok("sixteen starts fill all sixteen cells once", cellsSeen.size === 16, `${cellsSeen.size} distinct`);
  ok("only assignable conditions are given", Array.from(cellsSeen).every((k) => (ASSIGNABLE_CONDITIONS as readonly string[]).includes(k.split("|")[0])));

  const first = await assign("P-FILL0");
  const again = await assign("P-FILL0");
  ok("asking twice gives the same cell", first.condition === again.condition && first.advisor === again.advisor);
  ok("asking twice writes one assign row", (await count(`participant_id = 'P-FILL0' and row_type = 'assign'`)) === 1);

  const payload = (await db.query<{ payload: Record<string, string> }>(`select payload from responses where participant_id = 'P-FILL3'`)).rows[0].payload;
  ok("the assign row is labelled", payload.rowType === "assign" && payload.assignmentMethod === "balanced" && payload.assignedBy === "random");
  ok("the assign row carries the cell", typeof payload.condition === "string" && (payload.advisorModel === "ml" || payload.advisorModel === "logit"));
  ok("the assign row timestamp is ISO", /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(payload.timestamp), payload.timestamp);

  /* Two sessions abandoned three hours ago no longer hold the ml cell, so
     it counts 0 against logit's 1. Were they still counted, ml would be 2. */
  await db.exec("delete from responses");
  await holder("P-GONE1", "ml", { ageBy: "3 hours" });
  await holder("P-GONE2", "ml", { ageBy: "3 hours" });
  await holder("P-HERE1", "logit");
  ok("abandoned sessions free their cell", (await assign("P-NEW1", ONE)).advisor === "ml");

  /* Two finished sessions keep the ml cell at 2 however old they are, so the
     newcomer goes to logit at 1. Were they dropped with age, ml would be 0. */
  await db.exec("delete from responses");
  await holder("P-DONE1", "ml", { finished: "random", ageBy: "3 days" });
  await holder("P-DONE2", "ml", { finished: "random", ageBy: "3 days" });
  await holder("P-HERE2", "logit");
  ok("finished sessions keep their place", (await assign("P-NEW2", ONE)).advisor === "logit");

  /* Two finished sessions where the participant chose the style are not in
     the experiment and must not fill the ml cell: ml counts 0, logit 1. */
  await db.exec("delete from responses");
  await holder("P-CHOSE1", "ml", { finished: "chosen", ageBy: "3 days" });
  await holder("P-CHOSE2", "ml", { finished: "chosen", ageBy: "3 days" });
  await holder("P-HERE3", "logit");
  ok("chosen sessions do not take a place", (await assign("P-NEW3", ONE)).advisor === "ml");

  /* A session still running holds its place: logit has one running, ml
     none, so the newcomer goes to ml. */
  await db.exec("delete from responses");
  await holder("P-RUN1", "logit");
  ok("running sessions hold their place", (await assign("P-NEW4", ONE)).advisor === "ml");

  console.log(failures ? `\n${failures} FAILURES` : "\nALL SQL CHECKS PASSED");
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
