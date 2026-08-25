import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20260825160500_ari_circle_domain_events_v1_hardening.sql", import.meta.url),
  "utf8"
);

function stripSqlComments(sql = "") {
  return String(sql)
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const executable = stripSqlComments(migration);

test("host-approved Meetup requests emit an explicit private accepted event", () => {
  assert.match(migration, /'meetup\.accepted'/i);
  assert.match(migration, /when 'accepted' then 'meetup\.accepted'/i);
  assert.match(migration, /when new\.status in \('accepted','declined'\) then coalesce\(new\.reviewed_by, host_id\)/i);
  assert.match(migration, /when new\.status in \('accepted','declined','waitlisted'\) and actor_id = host_id then new\.user_id/i);
  assert.match(migration, /'meetup\.requested','meetup\.waitlisted','meetup\.accepted','meetup\.declined','meetup\.withdrawn'/i);
});

test("approval Meetups do not manufacture a misleading user-authored joined event", () => {
  assert.match(migration, /if coalesce\(m\.join_mode, 'instant'\) <> 'approval' then[\s\S]*?'meetup\.joined'/i);
  assert.match(migration, /Approval Meetups use the[\s\S]*?meetup\.accepted/i);
});

test("instant joins remain normal user-authored join events", () => {
  assert.match(migration, /'meetup\.joined','meetup',new\.meetup_id,new\.user_id,m\.host_user_id/i);
  assert.match(migration, /coalesce\(m\.join_mode, 'instant'\) <> 'approval'/i);
});

test("accepted events remain private to the involved host and applicant", () => {
  assert.match(migration, /e\.event_type in \([\s\S]*?'meetup\.accepted'[\s\S]*?\)[\s\S]*?caller_id in \(e\.actor_user_id, e\.affected_user_id\)/i);
  assert.doesNotMatch(migration, /e\.event_type in \('meetup\.created','meetup\.spot_opened','meetup\.accepted'\)/i);
});

test("metadata privacy scans nested JSON keys, not only top-level properties", () => {
  assert.match(migration, /clean_metadata::text ~\*/i);
  assert.match(migration, /meeting_point\|latitude\|longitude\|approximate_latitude\|approximate_longitude/i);
  assert.match(migration, /message\|message_body\|body\|proof_note/i);
  assert.match(migration, /email\|phone\|phone_number/i);
  assert.match(migration, /xp\|reward_xp\|payment\|premium\|subscription\|popularity\|engagement/i);
  assert.match(migration, /Private or ranking data cannot enter Circle domain events/i);
});

test("hardening preserves server-only writer authority and bounded retention", () => {
  assert.match(migration, /revoke all on function public\.ari_circle_record_domain_event\([\s\S]*?from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.ari_circle_record_domain_event\([\s\S]*?to service_role/i);
  assert.match(migration, /least\(interval '30 days', greatest\(interval '1 hour'/i);
  assert.doesNotMatch(executable, /grant execute on function public\.ari_circle_record_domain_event\([^;]+to authenticated/i);
});
