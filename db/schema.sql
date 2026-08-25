-- AdviceIT responses. Run once against your Neon database:
--   psql "$DATABASE_URL" -f db/schema.sql
create table if not exists responses (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  participant_id text not null,
  row_type text not null,
  condition text,
  advisor text,
  scenario text,
  payload jsonb not null
);
create index if not exists responses_participant_idx on responses (participant_id);
create index if not exists responses_created_idx on responses (created_at);
