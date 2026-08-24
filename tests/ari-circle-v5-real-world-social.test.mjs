import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260824054500_ari_circle_v5_real_world_social.sql", "utf8");
const completionMigration = fs.readFileSync("supabase/migrations/20260824060000_ari_circle_v5_completion_queue.sql", "utf8");
const meetupHtml = fs.readFileSync("ari-circle-meetup.html", "utf8");
const meetupJs = fs.readFileSync("js/ari-circle/meetups/meetups-v5.js", "utf8");
const questHtml = fs.readFileSync("ari-circle-quests.html", "utf8");
const questJs = fs.readFileSync("js/ari-circle/quests/quests-v5.js", "utf8");
const shell = fs.readFileSync("js/ari-circle/v5-real-world.js", "utf8");
const profile = fs.readFileSync("js/ari-circle/profile/profile-v5-real-world.js", "utf8");
const happening = fs.readFileSync("js/ari-circle/feed/happening-v5.js", "utf8");
const css = fs.readFileSync("assets/css/ari-circle-v5-real-world.css", "utf8");

test("Real World XP is server-capped at 10 per day and 70 per week", () => {
  assert.match(migration, /greatest\(0,\s*10\s*-\s*day_total\)/i);
  assert.match(migration, /greatest\(0,\s*70\s*-\s*week_total\)/i);
  assert.match(migration, /'daily_cap',\s*10/i);
  assert.match(migration, /'weekly_cap',\s*70/i);
  assert.match(meetupHtml, /10\/day · 70\/week/);
});

test("XP is an append-only-style server ledger, not a client engagement counter", () => {
  assert.match(migration, /create table if not exists public\.ari_circle_xp_events/i);
  assert.match(migration, /idempotency_key text not null unique/i);
  assert.match(migration, /revoke all on table public\.ari_circle_xp_events from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.ari_circle_xp_events to service_role/i);
  assert.doesNotMatch(meetupJs, /ari_circle_xp_events/);
  assert.doesNotMatch(questJs, /ari_circle_xp_events/);
});

test("creating or joining a meetup does not award XP", () => {
  const createStart = migration.indexOf("ari_circle_create_meetup");
  const joinStart = migration.indexOf("ari_circle_join_meetup");
  const completeStart = migration.indexOf("ari_circle_complete_meetup");
  assert.ok(createStart >= 0 && joinStart > createStart && completeStart > joinStart);
  assert.doesNotMatch(migration.slice(createStart, joinStart), /ari_circle_award_xp_capped/);
  assert.doesNotMatch(migration.slice(joinStart, completeStart), /ari_circle_award_xp_capped/);
  assert.match(meetupHtml, /Creating, joining, posting, reacting, or checking in earns 0 XP/);
});

test("meetup XP requires every joined participant to Complete and at least two verified people", () => {
  assert.match(migration, /count\(\*\) filter \(where completed_at is null\)/i);
  assert.match(migration, /if incomplete_count > 0 then/i);
  assert.match(migration, /XP releases after every participant presses Complete/i);
  assert.match(migration, /if participant_count < 2 then/i);
  assert.match(migration, /At least two verified participants are required for XP/i);
});

test("meetup rewards are conservative: participant 4 XP and host 6 XP before caps", () => {
  assert.match(migration, /participant_xp smallint not null default 4/i);
  assert.match(migration, /host_bonus_xp smallint not null default 2/i);
  assert.match(migration, /m\.participant_xp \+ case when row_item\.role='host' then m\.host_bonus_xp else 0 end/i);
});

test("ended joined meetups stay available during the 48-hour mutual completion window", () => {
  assert.match(completionMigration, /m\.ends_at > now\(\) - interval '48 hours'/i);
  assert.match(completionMigration, /mine\.user_id=caller_id/i);
  assert.match(meetupJs, /Complete Meetup/);
  assert.match(meetupJs, /Waiting for everyone/);
});

test("community walking and civic events are supported without viewpoint rewards", () => {
  assert.match(meetupHtml, /Community Walk \/ Civic Event/);
  assert.match(meetupHtml, /peaceful civic marches/);
  assert.match(meetupHtml, /rewards verified participation—not a political viewpoint/i);
  assert.match(migration, /'community','volunteer'/);
});

test("Quests replace dangerous engagement competitions", () => {
  assert.match(questHtml, /Completion over competition/);
  assert.match(questHtml, /no “most hype wins,” no weight-loss contests, no dangerous stunt rewards, and no XP for likes or votes/i);
  assert.doesNotMatch(questHtml, /Most hype wins/);
  assert.doesNotMatch(questHtml, /Vote for a winner/);
});

test("XP-bearing Quests are tiny, leader-gated, and cannot self-verify", () => {
  assert.match(migration, /xp_reward smallint not null default 0 check \(xp_reward between 0 and 3\)/i);
  assert.match(migration, /XP-bearing Community Quests unlock for established Community Leaders/i);
  assert.match(migration, /XP-bearing quests require another person to verify completion/i);
  assert.match(migration, /if caller_id=target_user_id then raise exception 'You cannot verify your own XP-bearing completion'/i);
  assert.match(questJs, /Number\(option\.value\) > 0\) option\.disabled = !state\.canCreateXp/);
});

test("leadership comes from successful hosted meetups, not likes or followers", () => {
  assert.match(migration, /when hosted_count >= 50 then 'community_builder'/i);
  assert.match(migration, /when hosted_count >= 25 then 'community_leader'/i);
  assert.match(migration, /when hosted_count >= 10 then 'active_host'/i);
  assert.match(migration, /when hosted_count >= 3 then 'organizer'/i);
  assert.match(migration, /where m\.host_user_id = target_user_id and m\.status = 'completed'/i);
});

test("profiles show factual Real World XP reputation and active hosted meetups", () => {
  assert.match(profile, /VERIFIED MEETUPS/);
  assert.match(profile, /SUCCESSFUL HOSTS/);
  assert.match(profile, /COMMUNITY STATUS/);
  assert.match(profile, /HOSTING A MEETUP/);
  assert.match(profile, /active_hosted_meetup/);
  assert.doesNotMatch(profile, /Trust Score/i);
});

test("Feed keeps posts and Moments while adding live Happening discovery", () => {
  assert.match(happening, /HAPPENING/);
  assert.match(happening, /Do something in real life/);
  assert.match(happening, /ari_circle_list_meetups/);
  assert.match(happening, /ari-circle-meetup\.html/);
});

test("Circle V5 has one three-tab primary social loop and a premium safe-area visual system", () => {
  assert.match(shell, /Feed/);
  assert.match(shell, /Meet Up/);
  assert.match(shell, /Quests/);
  assert.match(shell, /ari-circle-partners\.html/);
  assert.match(shell, /ari-circle-challenges\.html/);
  assert.match(css, /--circle5-bg:\s*#050811/);
  assert.match(css, /\.circle-v5-bottom-nav/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /--circle5-gradient:/);
});
