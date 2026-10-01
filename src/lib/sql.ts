/* The collector's SQL, kept as plain text with numbered parameters so that
   scripts/sql-smoke.ts runs exactly these statements against an in-memory
   Postgres. Both API routes send them through the Neon driver. */

/* Stores one sanitised row, unless this participant already has a row of
   the same type, trial and client timestamp: that is a resend of a batch
   that was stored but whose answer never reached the browser.
   $1 participant, $2 row type, $3 condition, $4 advisor, $5 scenario,
   $6 payload JSON, $7 client timestamp, $8 trial index as text. */
export const INSERT_ROW = `
insert into responses (participant_id, row_type, condition, advisor, scenario, payload)
select $1, $2, $3, $4, $5, $6::jsonb
where not exists (
  select 1 from responses
  where participant_id = $1 and row_type = $2
    and payload->>'timestamp' is not distinct from $7
    and payload->>'trialIndex' is not distinct from $8
)
returning id`;

/* Balanced assignment runs as one transaction: this lock first, so two
   people starting at the same moment cannot both find the same cell the
   emptiest, then ASSIGN_PICK, then ASSIGN_READ. */
export const ASSIGN_LOCK = `select pg_advisory_xact_lock(20261001)`;

/* Puts a participant in the condition and advisor cell with the fewest
   people, ties broken at random, unless they already have a cell. A cell
   counts everyone who finished in it under random assignment, plus everyone
   given it in the last two hours who has not finished yet, the people
   probably still taking part. Someone who abandoned a session hours ago no
   longer holds a place, so dropout does not starve a cell.
   $1 participant, $2 the assignable conditions comma separated, $3 language. */
export const ASSIGN_PICK = `
with cells as (
  select c as condition, a as advisor
  from unnest(string_to_array($2, ',')) as c
  cross join unnest(array['ml', 'logit']) as a
),
holding as (
  select participant_id, condition, advisor
  from responses
  where row_type = 'exit' and payload->>'assignedBy' = 'random'
  union
  select s.participant_id, s.condition, s.advisor
  from responses s
  where s.row_type = 'assign' and s.created_at > now() - interval '2 hours'
    and not exists (
      select 1 from responses x where x.row_type = 'exit' and x.participant_id = s.participant_id
    )
),
counts as (
  select condition, advisor, count(*) as n from holding group by condition, advisor
),
pick as (
  select cells.condition, cells.advisor
  from cells
  left join counts on counts.condition = cells.condition and counts.advisor = cells.advisor
  order by coalesce(counts.n, 0), random()
  limit 1
)
insert into responses (participant_id, row_type, condition, advisor, payload)
select $1, 'assign', pick.condition, pick.advisor,
  jsonb_build_object(
    'rowType', 'assign',
    'participantId', $1::text,
    'condition', pick.condition,
    'advisorModel', pick.advisor,
    'assignedBy', 'random',
    'assignmentMethod', 'balanced',
    'language', $3::text,
    'timestamp', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  )
from pick
where not exists (select 1 from responses where participant_id = $1 and row_type = 'assign')`;

/* The participant's cell, whether ASSIGN_PICK just made it or an earlier
   request did. $1 participant. */
export const ASSIGN_READ = `
select condition, advisor from responses
where participant_id = $1 and row_type = 'assign'
order by id
limit 1`;
