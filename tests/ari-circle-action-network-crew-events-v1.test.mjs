import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20260825195000_ari_circle_crews_v1_events.sql", import.meta.url),
  "utf8"
);

function stripSqlComments(sql = "") {
  return String(sql)
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const executable = stripSqlComments(migration);

test("Domain Events vocabulary expands explicitly to Crew without weakening Meetup/Mission facts", () => {
  for (const type of [
    "crew.created",
    "crew.invited",
    "crew.joined",
    "crew.declined",
    "crew.left",
    "crew.activated",
    "crew.archived"
  ]) {
    assert.match(migration, new RegExp(type.replace(".", "\\."), "i"));
  }
  assert.match(migration, /check \(subject_type in \('meetup','mission','crew'\)\)/i);
  assert.match(migration, /meetup\.accepted/i);
  assert.match(migration, /mission\.objective_reached/i);
});

test("the internal Domain Event writer remains trigger/service-only and recursively privacy-bounded", () => {
  assert.match(migration, /create or replace function public\.ari_circle_record_domain_event/i);
  assert.match(migration, /clean_subject_type not in \('meetup','mission','crew'\)/i);
  assert.match(migration, /clean_metadata::text ~\* '[^']*meeting_point[^']*latitude[^']*message[^']*proof_note[^']*xp[^']*payment[^']*premium[^']*popularity[^']*engagement/i);
  assert.match(migration, /revoke all on function public\.ari_circle_record_domain_event\(text,text,uuid,uuid,uuid,text,jsonb,interval\)\s+from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.ari_circle_record_domain_event\(text,text,uuid,uuid,uuid,text,jsonb,interval\)\s+to service_role/i);
});

test("Crew object transitions emit only creation, activation, and archive coordination facts", () => {
  assert.match(migration, /create or replace function public\.ari_circle_emit_crew_event\(\)/i);
  assert.match(migration, /if tg_op = 'INSERT' then[\s\S]*'crew\.created'/i);
  assert.match(migration, /when 'active' then 'crew\.activated'/i);
  assert.match(migration, /when 'archived' then 'crew\.archived'/i);
  assert.match(migration, /after insert or update of status on public\.ari_circle_crews/i);
});

test("Crew member transitions preserve causal actor/affected semantics", () => {
  assert.match(migration, /when 'invited' then 'crew\.invited'/i);
  assert.match(migration, /when 'active' then 'crew\.joined'/i);
  assert.match(migration, /when 'declined' then 'crew\.declined'/i);
  assert.match(migration, /when 'left' then 'crew\.left'/i);
  assert.match(migration, /actor_id := case when new\.status = 'invited' then coalesce\(new\.invited_by, owner_id\) else new\.user_id end/i);
  assert.match(migration, /affected_id := case when new\.status = 'invited' then new\.user_id else owner_id end/i);
  assert.match(migration, /if new\.role = 'owner' then return new/i);
});

test("Crew lifecycle events are never public discovery telemetry", () => {
  assert.match(migration, /e\.event_type in \('crew\.created','crew\.invited','crew\.joined','crew\.declined','crew\.left'\)[\s\S]*caller_id in \(e\.actor_user_id, e\.affected_user_id\)/i);
  assert.match(migration, /e\.event_type in \('crew\.activated','crew\.archived'\)[\s\S]*public\.ari_circle_crew_members[\s\S]*cm\.user_id = caller_id[\s\S]*cm\.status in \('invited','active'\)/i);
  assert.doesNotMatch(executable, /crew\.created[^;]+ari_circle_list_public|public_crew_event|broadcast_crew/i);
});

test("Crew event metadata is state-only and contains no social ranking or private coordination payload", () => {
  assert.match(migration, /jsonb_build_object\('crew_status', new\.status\)/i);
  assert.match(migration, /jsonb_build_object\('member_status', new\.status\)/i);
  for (const forbidden of [
    /jsonb_build_object\([^)]*meeting_point/i,
    /jsonb_build_object\([^)]*latitude/i,
    /jsonb_build_object\([^)]*message/i,
    /jsonb_build_object\([^)]*proof_note/i,
    /jsonb_build_object\([^)]*reward_xp/i,
    /jsonb_build_object\([^)]*premium/i,
    /jsonb_build_object\([^)]*popularity/i,
    /jsonb_build_object\([^)]*engagement/i
  ]) {
    assert.doesNotMatch(executable, forbidden);
  }
});

test("Crew candidacy itself is not manufactured into an event", () => {
  assert.doesNotMatch(executable, /crew\.candidate|crew\.suggested|crew\.recommended/i);
});

test("Crew trigger functions are not callable by normal clients", () => {
  for (const fn of ["ari_circle_emit_crew_event", "ari_circle_emit_crew_member_event"]) {
    assert.match(migration, new RegExp(`revoke all on function public\\.${fn}\\(\\) from public, anon, authenticated`, "i"));
    assert.match(migration, new RegExp(`grant execute on function public\\.${fn}\\(\\) to service_role`, "i"));
  }
});
