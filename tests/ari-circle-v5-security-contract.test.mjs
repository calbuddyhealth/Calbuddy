import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sql = fs.readFileSync("supabase/migrations/20260824054500_ari_circle_v5_real_world_social.sql", "utf8");
const guards = fs.readFileSync("supabase/migrations/20260824063000_ari_circle_v5_quest_xp_guards.sql", "utf8");

function functionBody(name, nextName) {
  const start = sql.indexOf(`create or replace function public.${name}`);
  assert.ok(start >= 0, `${name} must exist`);
  const end = nextName ? sql.indexOf(`create or replace function public.${nextName}`, start + 1) : sql.length;
  assert.ok(end > start, `${name} must have a bounded function body`);
  return sql.slice(start, end);
}

test("raw XP award helper is not executable by authenticated clients", () => {
  assert.match(sql, /revoke all on function public\.ari_circle_award_xp_capped\([^;]+\) from public, anon, authenticated;/i);
  assert.match(sql, /grant execute on function public\.ari_circle_award_xp_capped\([^;]+\) to service_role;/i);
});

test("Meet Up mutations bind the actor to auth.uid and enforce adult access", () => {
  const create = functionBody("ari_circle_create_meetup", "ari_circle_list_meetups");
  const join = functionBody("ari_circle_join_meetup", "ari_circle_leave_meetup");
  const leave = functionBody("ari_circle_leave_meetup", "ari_circle_cancel_meetup");
  const cancel = functionBody("ari_circle_cancel_meetup", "ari_circle_complete_meetup");
  const complete = functionBody("ari_circle_complete_meetup", "ari_circle_can_create_xp_quest");

  for (const body of [create, join, leave, cancel, complete]) {
    assert.match(body, /caller_id uuid := auth\.uid\(\)/i);
    assert.match(body, /perform public\.ari_circle_assert_adult_access\(\)/i);
  }

  assert.match(create, /host_user_id[\s\S]*caller_id/i);
  assert.match(cancel, /host_user_id=caller_id/i);
  assert.match(complete, /user_id=caller_id and status='joined'/i);
  assert.match(complete, /count\(\*\) filter \(where completed_at is null\)/i);
  assert.match(complete, /participant_count < 2/i);
});

test("Quest writes are adult-gated, actor-bound, externally verified for XP, and non-personal", () => {
  const create = functionBody("ari_circle_create_quest", "ari_circle_list_quests");
  const join = functionBody("ari_circle_join_quest", "ari_circle_submit_quest_completion");
  const submit = functionBody("ari_circle_submit_quest_completion", "ari_circle_verify_quest_completion");
  const verify = functionBody("ari_circle_verify_quest_completion", "ari_circle_profile_xp_activity");

  for (const body of [create, join, submit, verify]) {
    assert.match(body, /caller_id uuid := auth\.uid\(\)/i);
    assert.match(body, /perform public\.ari_circle_assert_adult_access\(\)/i);
  }

  assert.match(create, /not public\.ari_circle_can_create_xp_quest\(caller_id\)/i);
  assert.match(create, /reward > 0 and requested_verification_mode='self'/i);
  assert.match(guards, /check \(xp_reward = 0 or scope <> 'personal'\)/i);
  assert.match(guards, /check \(xp_reward = 0 or verification_mode <> 'self'\)/i);
  assert.match(verify, /if caller_id=target_user_id then raise exception/i);
  assert.match(verify, /caller_id<>q\.creator_user_id and not public\.ari_circle_can_create_xp_quest\(caller_id\)/i);
  assert.match(verify, /status='submitted'/i);
});

test("public XP/profile reads cannot bypass Circle visibility rules", () => {
  const summary = functionBody("ari_circle_xp_summary", "ari_circle_create_meetup");
  const activity = functionBody("ari_circle_profile_xp_activity");

  assert.match(summary, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(summary, /not public\.ari_circle_user_is_adult\(subject_id\)/i);
  assert.match(summary, /caller_id <> subject_id and not public\.ari_circle_can_view_user\(subject_id\)/i);
  assert.match(activity, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(activity, /caller_id<>target_user_id and not public\.ari_circle_can_view_user\(target_user_id\)/i);
});
