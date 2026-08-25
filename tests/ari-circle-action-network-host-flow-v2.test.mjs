import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const meetupHtml = await readFile(new URL("../ari-circle-meetup.html", import.meta.url), "utf8");
const meetupController = await readFile(new URL("../js/ari-circle/meetups/meetups-v5.js", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/20260826050000_ari_circle_host_flow_v2.sql", import.meta.url), "utf8");

test("Host Flow V2 controller remains valid browser JavaScript", () => {
  assert.doesNotThrow(() => new Function(meetupController));
  assert.match(meetupController, /const VERSION = "5\.3\.0"/);
  assert.match(meetupHtml, /meetups-v5\.js\?v=5\.3\.0/);
});

test("host request review is capacity-aware before decisions are shown", () => {
  assert.match(meetupController, /function guestSpotsOpen/);
  assert.match(meetupController, /await loadMeetups\(\);\s*state\.requestMeetup = state\.rows\.find/);
  assert.match(meetupController, /const openSpots = guestSpotsOpen\(row\)/);
  assert.match(meetupController, /Accept unlocks when a spot opens/);
  assert.match(meetupController, /data-permanent-disabled="true" disabled/);
  assert.match(meetupController, /canAccept \? "Accept" : "Full"/);
});

test("accepting a request refreshes capacity before rebuilding the request list", () => {
  assert.match(meetupController, /await loadMeetups\(\);\s*state\.requestMeetup = state\.rows\.find[\s\S]*?await loadRequests\(\);/);
  assert.doesNotMatch(meetupController, /Promise\.all\(\[loadRequests\(\), loadMeetups\(\)\]\)/);
});

test("Host progress is visible without exposing another user's private host summary", () => {
  assert.match(meetupController, /ari_circle_my_host_summary/);
  assert.match(meetupController, /remaining_to_next/);
  assert.match(meetupController, /verified_hosted_meetups/);
  assert.match(meetupController, /up to \+\$\{verifiedXp\} XP/);
  assert.doesNotMatch(meetupController, /ari_circle_my_host_summary[^\n]*target_user_id/);
});

test("Host status counts only completed meetups with a verified non-host participant", () => {
  assert.match(migration, /m\.status = 'completed'/);
  assert.match(migration, /p\.user_id <> m\.host_user_id/);
  assert.match(migration, /p\.status = 'joined'/);
  assert.match(migration, /p\.completed_at is not null/);
  assert.match(migration, /when hosted_count >= 50 then 'community_builder'/);
  assert.match(migration, /when hosted_count >= 25 then 'community_leader'/);
  assert.match(migration, /when hosted_count >= 10 then 'active_host'/);
  assert.match(migration, /when hosted_count >= 3 then 'organizer'/);
});

test("self-only Host summary preserves the existing XP incentive and tier roadmap", () => {
  assert.match(migration, /ari_circle_my_host_summary\(\)/);
  assert.match(migration, /caller_id uuid := auth\.uid\(\)/);
  assert.match(migration, /ari_circle_assert_adult_access\(\)/);
  assert.match(migration, /'participant_xp', 4/);
  assert.match(migration, /'host_bonus_xp', 2/);
  assert.match(migration, /'verified_host_xp', 6/);
  assert.match(migration, /revoke all on function public\.ari_circle_my_host_summary\(\) from public, anon/);
  assert.match(migration, /grant execute on function public\.ari_circle_my_host_summary\(\) to authenticated, service_role/);
});
