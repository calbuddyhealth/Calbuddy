import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260826050000_ari_circle_host_flow_v2.sql", "utf8");
const hostFlowJs = fs.readFileSync("js/ari-circle/meetups/host-flow-v2.js", "utf8");
const meetupHtml = fs.readFileSync("ari-circle-meetup.html", "utf8");
const v6Html = fs.readFileSync("ari-circle-v6.html", "utf8");

test("Host status only counts completed meetups with a verified guest", () => {
  assert.match(migration, /m\.status = 'completed'/i);
  assert.match(migration, /p\.user_id <> m\.host_user_id/i);
  assert.match(migration, /p\.status = 'joined'/i);
  assert.match(migration, /p\.completed_at is not null/i);
  assert.match(migration, /when hosted_count >= 50 then 'community_builder'/i);
  assert.match(migration, /when hosted_count >= 25 then 'community_leader'/i);
  assert.match(migration, /when hosted_count >= 10 then 'active_host'/i);
  assert.match(migration, /when hosted_count >= 3 then 'organizer'/i);
});

test("Host progress RPC is self-derived and preserves the existing XP incentive", () => {
  assert.match(migration, /create or replace function public\.ari_circle_my_host_summary\(\)/i);
  assert.match(migration, /caller_id uuid := auth\.uid\(\)/i);
  assert.match(migration, /where m\.host_user_id = caller_id/i);
  assert.match(migration, /'verified_host_xp', 6/i);
  assert.match(migration, /grant execute on function public\.ari_circle_my_host_summary\(\) to authenticated, service_role/i);
});

test("Host Flow V2 surfaces progression and capacity-aware review without auto-accepting strangers", () => {
  assert.match(hostFlowJs, /ari_circle_my_host_summary/);
  assert.match(hostFlowJs, /remaining_to_next/);
  assert.match(hostFlowJs, /openGuestSpots/);
  assert.match(hostFlowJs, /data-request-decision=\\?"accept/i);
  assert.match(hostFlowJs, /No guest spots are open right now/i);
  assert.doesNotMatch(hostFlowJs, /ari_circle_review_meetup_request/);
  assert.doesNotMatch(hostFlowJs, /requested_decision:\s*["']accept["']/i);
});

test("Host Flow V2 is wired into Meet Up and V6 attention", () => {
  assert.match(meetupHtml, /js\/ari-circle\/meetups\/host-flow-v2\.js\?v=2\.0\.0/);
  assert.match(v6Html, /js\/ari-circle\/meetups\/host-flow-v2\.js\?v=2\.0\.0/);
  assert.match(hostFlowJs, /A spot opened in your meetup/);
  assert.match(hostFlowJs, /choose someone from the waitlist/i);
});
