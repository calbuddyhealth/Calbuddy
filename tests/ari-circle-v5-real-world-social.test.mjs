import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260824054500_ari_circle_v5_real_world_social.sql", "utf8");
const completionMigration = fs.readFileSync("supabase/migrations/20260824060000_ari_circle_v5_completion_queue.sql", "utf8");
const hardeningMigration = fs.readFileSync("supabase/migrations/20260824064500_ari_circle_v5_advisor_hardening.sql", "utf8");
const meetupHtml = fs.readFileSync("ari-circle-meetup.html", "utf8");
const meetupJs = fs.readFileSync("js/ari-circle/meetups/meetups-v5.js", "utf8");
const questHtml = fs.readFileSync("ari-circle-quests.html", "utf8");
const questJs = fs.readFileSync("js/ari-circle/quests/quests-v5.js", "utf8");
const shell = fs.readFileSync("js/ari-circle/v5-real-world.js", "utf8");
const menu = fs.readFileSync("js/ari-circle/circle-menu-v5.js", "utf8");
const moderation = fs.readFileSync("js/ari-circle/real-world-moderation-v5.js", "utf8");
const profile = fs.readFileSync("js/ari-circle/profile/profile-v5-real-world.js", "utf8");
const happening = fs.readFileSync("js/ari-circle/feed/happening-v5.js", "utf8");
const authority = fs.readFileSync("assets/css/ari-circle-v5-visual-authority.css", "utf8");
const xpAuthority = fs.readFileSync("assets/css/ari-circle-xp.css", "utf8");

test("Real World XP is server-capped at 10 per day and 70 per week", () => {
  assert.match(migration, /greatest\(0,\s*10\s*-\s*day_total\)/i);
  assert.match(migration, /greatest\(0,\s*70\s*-\s*week_total\)/i);
  assert.match(migration, /'daily_cap',\s*10/i);
  assert.match(migration, /'weekly_cap',\s*70/i);
  assert.match(meetupHtml, /0 \/ 10 XP/);
  assert.match(meetupHtml, /0 \/ 70 XP/);
});

test("XP is a server ledger, not a client engagement counter", () => {
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
  assert.doesNotMatch(meetupHtml, /How XP works/);
});

test("meetup XP requires mutual completion and at least two verified people", () => {
  assert.match(migration, /count\(\*\) filter \(where completed_at is null\)/i);
  assert.match(migration, /if incomplete_count > 0 then/i);
  assert.match(migration, /XP releases after every participant presses Complete/i);
  assert.match(migration, /if participant_count < 2 then/i);
  assert.match(migration, /At least two verified participants are required for XP/i);
});

test("meetup rewards remain conservative before caps", () => {
  assert.match(migration, /participant_xp smallint not null default 4/i);
  assert.match(migration, /host_bonus_xp smallint not null default 2/i);
  assert.match(migration, /m\.participant_xp \+ case when row_item\.role='host' then m\.host_bonus_xp else 0 end/i);
});

test("ended joined meetups stay available during the 48-hour completion window", () => {
  assert.match(completionMigration, /m\.ends_at > now\(\) - interval '48 hours'/i);
  assert.match(completionMigration, /mine\.user_id=caller_id/i);
  assert.match(meetupJs, /Complete Meetup/);
  assert.match(meetupJs, /Waiting for everyone/);
});

test("community walking and civic events stay available without persistent explainer copy", () => {
  assert.match(meetupHtml, /Community Walk \/ Civic Event/);
  assert.match(migration, /'community','volunteer'/);
  assert.doesNotMatch(meetupHtml, /<summary>Community events<\/summary>/);
  assert.doesNotMatch(meetupHtml, /peaceful civic marches/);
});

test("meetup discovery copy does not claim proximity before geographic filtering exists", () => {
  assert.match(meetupHtml, /Upcoming meetups/);
  assert.match(meetupHtml, /Nothing scheduled yet\./);
  assert.doesNotMatch(meetupHtml, />Near you</i);
  assert.doesNotMatch(meetupHtml, /Nothing nearby yet/i);
});

test("Quests exclude winner-voting engagement mechanics", () => {
  assert.doesNotMatch(questHtml, /most hype wins/i);
  assert.doesNotMatch(questHtml, /Vote for a winner/i);
  assert.doesNotMatch(questHtml, /<summary>Verified XP<\/summary>/);
  assert.match(migration, /xp_reward smallint not null default 0 check \(xp_reward between 0 and 3\)/i);
});

test("Quest creation exposes only implemented Personal and Community scopes", () => {
  assert.match(questHtml, /<option value="community" selected>Community<\/option>/);
  assert.match(questHtml, /<option value="personal">Personal<\/option>/);
  assert.doesNotMatch(questHtml, /<option value="crew">/);
});

test("XP-bearing Quests are leader-gated and cannot self-verify", () => {
  assert.match(migration, /XP-bearing Community Quests unlock for established Community Leaders/i);
  assert.match(migration, /XP-bearing quests require another person to verify completion/i);
  assert.match(migration, /if caller_id=target_user_id then raise exception 'You cannot verify your own XP-bearing completion'/i);
  assert.match(questJs, /Number\(option\.value\) > 0\) option\.disabled = !state\.canCreateXp/);
});

test("leadership comes from successful hosted meetups", () => {
  assert.match(migration, /when hosted_count >= 50 then 'community_builder'/i);
  assert.match(migration, /when hosted_count >= 25 then 'community_leader'/i);
  assert.match(migration, /when hosted_count >= 10 then 'active_host'/i);
  assert.match(migration, /when hosted_count >= 3 then 'organizer'/i);
  assert.match(migration, /where m\.host_user_id = target_user_id and m\.status = 'completed'/i);
});

test("profiles show factual Real World reputation and active hosted meetups", () => {
  assert.match(profile, /Verified meetups/);
  assert.match(profile, /Hosted meetups/);
  assert.match(profile, /Community status/);
  assert.match(profile, /HOSTING A MEETUP/);
  assert.match(profile, /active_hosted_meetup/);
  assert.match(profile, /circle-xp-level-ring/);
  assert.doesNotMatch(profile, /Trust Score/i);
});

test("shared XP visuals do not redefine XP award mechanics", () => {
  assert.match(xpAuthority, /Visual only: no XP math, caps, or award rules live here/);
  assert.match(xpAuthority, /circle-xp-profile-card/);
  assert.match(xpAuthority, /circle-xp-meetup-hud/);
  assert.match(xpAuthority, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(xpAuthority, /ari_circle_award_xp|ari_circle_xp_events/);
});

test("Feed keeps posts and Moments while adding live Happening discovery", () => {
  assert.match(happening, /HAPPENING/);
  assert.match(happening, /Do something in real life/);
  assert.match(happening, /ari_circle_list_meetups/);
  assert.match(happening, /ari-circle-meetup\.html/);
  assert.doesNotMatch(happening, />See all</);
  assert.doesNotMatch(happening, />Create a meetup</);
});

test("Circle has one simple three-tab primary navigation and final visual authority", () => {
  assert.match(shell, /const VERSION = "5\.3\.0"/);
  assert.match(shell, /navLink\("foryou", "ari-circle-v6\.html", "For You"\)/);
  assert.match(shell, /navLink\("meetup", "ari-circle-meetup\.html", "Meet Up"\)/);
  assert.match(shell, /navLink\("feed", "ari-circle-feed\.html", "Feed"\)/);
  assert.doesNotMatch(shell, /navLink\("quests"/);
  assert.match(shell, /brand\.setAttribute\("href", "ari-circle-v6\.html"\)/);
  assert.match(shell, /brand\.setAttribute\("aria-label", "ARI Circle For You"\)/);
  assert.doesNotMatch(shell, /ari-circle-partners\.html/);
  assert.doesNotMatch(shell, /ari-circle-challenges\.html/);
  assert.match(authority, /CONSOLIDATED VISUAL AUTHORITY/);
  assert.match(authority, /\.circle-v5-bottom-nav/);
  assert.match(authority, /safe-area-inset-bottom/);
  assert.match(authority, /--circle521-gradient:/);
});

test("secondary drawer avoids duplicating primary tabs", () => {
  assert.match(menu, /ari-circle-quests\.html/);
  assert.match(menu, /label: "Profile"/);
  assert.match(menu, /label: "Notifications"/);
  assert.match(menu, /label: "Discover Friends"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-meetup\.html"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-feed\.html"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-v6\.html"/);
});

test("Meet Up and Quests share the current adult-only shell and fail-closed publication moderation", () => {
  for (const html of [meetupHtml, questHtml]) {
    assert.match(html, /js\/ari-circle\/circle-menu-v5\.js\?v=2\.4\.3/);
    assert.match(html, /js\/ari-circle\/social-badges\.js\?v=1\.2\.0/);
    assert.match(html, /supabase-config\.js\?v=1\.1\.8/);
    assert.match(html, /id="ariCircleV5RealWorldScript" src="js\/ari-circle\/v5-real-world\.js\?v=5\.2\.4"/);
    assert.match(html, /id="ariCircleV5RealWorldModerationScript" src="js\/ari-circle\/real-world-moderation-v5\.js\?v=5\.1\.0"/);
    const moderationIndex = html.indexOf("real-world-moderation-v5.js");
    const controllerIndex = Math.max(html.indexOf("meetups-v5.js"), html.indexOf("quests-v5.js"));
    assert.ok(moderationIndex >= 0 && controllerIndex > moderationIndex);
  }
  assert.match(menu, /adult-only-guard\.js/);
  assert.match(menu, /v5-real-world\.js\?v=5\.3\.0/);
  assert.match(moderation, /ari_circle_create_meetup/);
  assert.match(moderation, /ari_circle_create_quest/);
  assert.match(moderation, /ari_circle_submit_quest_completion/);
  assert.match(moderation, /content-moderation\.js/);
  assert.match(moderation, /ARI_MODERATION_UNAVAILABLE/);
  assert.match(moderation, /client\.rpc = wrapped/);
});

test("V5 advisor hardening covers Quest creator and verifier foreign keys", () => {
  assert.match(hardeningMigration, /ari_circle_quests_creator_idx/i);
  assert.match(hardeningMigration, /ari_circle_quests\(creator_user_id, created_at desc\)/i);
  assert.match(hardeningMigration, /ari_circle_quest_members_verified_by_idx/i);
  assert.match(hardeningMigration, /ari_circle_quest_members\(verified_by, verified_at desc\)/i);
});