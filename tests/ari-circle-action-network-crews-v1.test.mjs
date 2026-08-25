import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20260825194500_ari_circle_crews_v1.sql", import.meta.url),
  "utf8"
);

function stripSqlComments(sql = "") {
  return String(sql)
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const executable = stripSqlComments(migration);

test("Crews V1 persists private crew, membership, and verified shared-history state", () => {
  assert.match(migration, /create table if not exists public\.ari_circle_crews/i);
  assert.match(migration, /create table if not exists public\.ari_circle_crew_members/i);
  assert.match(migration, /create table if not exists public\.ari_circle_crew_activity_history/i);
  assert.match(migration, /origin text not null default 'repeated_activity'/i);
  assert.match(migration, /status text not null default 'forming' check \(status in \('forming','active','archived'\)\)/i);
  assert.match(migration, /source in \('founding_evidence','crew_activity'\)/i);
});

test("Crew tables are RLS-enabled and never directly exposed to normal clients", () => {
  for (const table of ["ari_circle_crews", "ari_circle_crew_members", "ari_circle_crew_activity_history"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(migration, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`, "i"));
    assert.match(migration, new RegExp(`grant select, insert, update, delete on table public\\.${table} to service_role`, "i"));
  }
  assert.doesNotMatch(migration, /grant\s+(?:select|insert|update|delete)[^;]+ari_circle_crew[^;]+to\s+(?:anon|authenticated)/i);
});

test("Crew candidacy is earned by the same exact group completing real Meetups together", () => {
  assert.match(migration, /create or replace function public\.ari_circle_list_crew_candidates/i);
  assert.match(migration, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(migration, /m\.status = 'completed'/i);
  assert.match(migration, /mp\.status = 'joined'/i);
  assert.match(migration, /mp\.completed_at is not null/i);
  assert.match(migration, /array_agg\(mp\.user_id order by mp\.user_id\) as member_ids/i);
  assert.match(migration, /having count\(\*\) between 3 and 8/i);
  assert.match(migration, /bool_or\(mp\.user_id = caller_id\)/i);
  assert.match(migration, /bool_and\(public\.ari_circle_user_is_adult\(mp\.user_id\)\)/i);
  assert.match(migration, /group by sg\.member_ids[\s\S]*having count\(distinct sg\.meetup_id\) >= 2/i);
});

test("Crew candidacy fails closed when any founding pair is blocked", () => {
  assert.match(migration, /unnest\(cg\.member_ids\) with ordinality a\(user_id, position_a\)/i);
  assert.match(migration, /cross join unnest\(cg\.member_ids\) with ordinality b\(user_id, position_b\)/i);
  assert.match(migration, /a\.position_a < b\.position_b/i);
  assert.match(migration, /public\.ari_circle_social_pair_is_blocked\(a\.user_id, b\.user_id\)/i);
});

test("Crew creation cannot accept an arbitrary member list", () => {
  assert.match(migration, /create or replace function public\.ari_circle_create_crew\(\s*requested_candidate_key text,\s*requested_name text,\s*requested_operation_id uuid/i);
  assert.doesNotMatch(migration, /create or replace function public\.ari_circle_create_crew\([^)]*member_ids/i);
  assert.match(migration, /from public\.ari_circle_list_crew_candidates\(20\) cc/i);
  assert.match(migration, /where cc\.candidate_key = clean_key/i);
  assert.match(migration, /caller_id = any\(candidate\.member_ids\)/i);
});

test("Crew creation is retry-aware and prevents duplicate active founding groups", () => {
  assert.match(migration, /creation_operation_id uuid not null unique/i);
  assert.match(migration, /where c\.creation_operation_id = requested_operation_id\s+and c\.owner_user_id = caller_id/i);
  assert.match(migration, /'replayed', true/i);
  assert.match(migration, /pg_advisory_xact_lock\(hashtextextended\(concat\(caller_id, ':crew:', clean_key\), 0\)\)/i);
  assert.match(migration, /unique index if not exists ari_circle_crews_active_member_fingerprint_idx[\s\S]*where status in \('forming','active'\)/i);
});

test("founding consent is explicit: creator active, everyone else only invited", () => {
  assert.match(migration, /case when candidate_user\.user_id = caller_id then 'owner' else 'member' end/i);
  assert.match(migration, /case when candidate_user\.user_id = caller_id then 'active' else 'invited' end/i);
  assert.match(migration, /create or replace function public\.ari_circle_respond_crew_invite\(\s*requested_crew_id uuid,\s*requested_accept boolean/i);
  assert.match(migration, /next_status := case when requested_accept then 'active' else 'declined' end/i);
});

test("a Crew activates only after at least three people explicitly become active members", () => {
  assert.match(migration, /where cm\.crew_id = requested_crew_id and cm\.status = 'active'/i);
  assert.match(migration, /if active_count >= 3 and crew\.status = 'forming' then/i);
  assert.match(migration, /set status = 'active', activated_at = coalesce\(activated_at, now\(\)\)/i);
});

test("invite acceptance rechecks blocking instead of trusting stale founding evidence", () => {
  assert.match(migration, /if requested_accept and exists \([\s\S]*other\.status = 'active'[\s\S]*public\.ari_circle_social_pair_is_blocked\(caller_id, other\.user_id\)/i);
  assert.match(migration, /raise exception 'Crew invitation is unavailable'/i);
});

test("founding history contains only exact-group verified completed Meetups", () => {
  assert.match(migration, /insert into public\.ari_circle_crew_activity_history\(crew_id, meetup_id, source\)/i);
  assert.match(migration, /m\.status = 'completed'/i);
  assert.match(migration, /mp\.completed_at is not null/i);
  assert.match(migration, /evidence\.member_ids = candidate\.member_ids/i);
  assert.match(migration, /'founding_evidence'/i);
});

test("members can leave without being coerced and owners archive instead of orphaning the Crew", () => {
  assert.match(migration, /create or replace function public\.ari_circle_leave_crew/i);
  assert.match(migration, /if membership\.role = 'owner' then raise exception 'Crew owners archive the Crew instead of leaving it'/i);
  assert.match(migration, /set status = 'left', left_at = now\(\)/i);
  assert.match(migration, /if active_count < 3 then[\s\S]*set status = 'forming'/i);
  assert.match(migration, /create or replace function public\.ari_circle_archive_crew/i);
  assert.match(migration, /crew\.owner_user_id <> caller_id/i);
});

test("Crew projection is caller-scoped and has no public directory", () => {
  assert.match(migration, /create or replace function public\.ari_circle_list_my_crews/i);
  assert.match(migration, /where mine\.user_id = caller_id/i);
  assert.match(migration, /mine\.status in \('invited','active'\)/i);
  assert.match(migration, /cm\.user_id = caller_id\s+or not public\.ari_circle_social_pair_is_blocked\(caller_id, cm\.user_id\)/i);
  assert.doesNotMatch(executable, /ari_circle_list_public_crews|ari_circle_discover_crews|crew_popularity/i);
});

test("Crews V1 cannot earn or buy social importance", () => {
  for (const forbidden of [
    /ari_circle_award_xp_capped/i,
    /\bfollowers?\b/i,
    /\blikes\b/i,
    /\breactions?\b/i,
    /\bpremium\b/i,
    /\bsubscription\b/i,
    /\bpayment\b/i,
    /\bpopularity\b/i,
    /\bengagement_(?:score|count|rate)\b/i,
    /\bpaid_rank\b/i,
    /\bstar_rating\b/i
  ]) {
    assert.doesNotMatch(executable, forbidden);
  }
});

test("Crews V1 stores no location, chat, proof, or contact payload", () => {
  for (const forbidden of [
    /\bmeeting_point\b/i,
    /\blatitude\b/i,
    /\blongitude\b/i,
    /\bmessage_body\b/i,
    /\bproof_note\b/i,
    /\bphone_number\b/i,
    /\bemail\b/i
  ]) {
    assert.doesNotMatch(executable, forbidden);
  }
});

test("every authenticated Crew RPC explicitly revokes default execution before granting its intended API surface", () => {
  for (const signature of [
    "ari_circle_list_crew_candidates\\(integer\\)",
    "ari_circle_create_crew\\(text,text,uuid\\)",
    "ari_circle_respond_crew_invite\\(uuid,boolean\\)",
    "ari_circle_leave_crew\\(uuid\\)",
    "ari_circle_archive_crew\\(uuid\\)",
    "ari_circle_list_my_crews\\(integer\\)"
  ]) {
    assert.match(migration, new RegExp(`revoke all on function public\\.${signature}\\s+from public, anon, authenticated`, "i"));
    assert.match(migration, new RegExp(`grant execute on function public\\.${signature}\\s+to authenticated, service_role`, "i"));
  }
  assert.doesNotMatch(migration, /grant execute on function public\.ari_circle_(?:list_crew_candidates|create_crew|respond_crew_invite|leave_crew|archive_crew|list_my_crews)[^;]+to anon/i);
});
