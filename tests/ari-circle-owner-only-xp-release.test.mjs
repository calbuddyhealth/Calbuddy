import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../assets/css/ari-circle-xp.css", import.meta.url), "utf8");
const meetup = fs.readFileSync(new URL("../ari-circle-meetup.html", import.meta.url), "utf8");
const feed = fs.readFileSync(new URL("../ari-circle-feed.html", import.meta.url), "utf8");
const profileLoader = fs.readFileSync(new URL("../js/ari-circle/profile/profile-v3-loader.js", import.meta.url), "utf8");
const migration = fs.readFileSync(new URL("../supabase/migrations/20260914173500_ari_circle_owner_only_xp_release_gate.sql", import.meta.url), "utf8");

test("member Circle surfaces hide experimental XP while verified owner mode keeps it available", () => {
  assert.match(css, /data-circle-v5-nav=["']arinext["']/i);
  assert.match(css, /#meetupXpCard/);
  assert.match(css, /\.circle-v5-xp-chip/);
  assert.match(css, /\.circle-xp-profile-card/);
  assert.match(css, /#circleV5ActivityCard/);
  assert.match(css, /#createQuestButton/);
  assert.match(css, /section\[aria-labelledby=["']questListTitle["']\]/);
  assert.match(css, /\.circle-mission-v2-zero-xp/);
});

test("member-facing Circle entry points load the current owner-only XP stylesheet", () => {
  assert.match(meetup, /ari-circle-xp\.css\?v=1\.0\.2/i);
  assert.match(feed, /ari-circle-xp\.css\?v=1\.0\.2/i);
  assert.match(profileLoader, /ari-circle-xp\.css\?v=1\.0\.2/i);
  assert.doesNotMatch(meetup, /ari-circle-xp\.css\?v=1\.0\.1/i);
  assert.doesNotMatch(feed, /ari-circle-xp\.css\?v=1\.0\.1/i);
  assert.doesNotMatch(profileLoader, /ari-circle-xp\.css\?v=1\.0\.1/i);
});

test("server XP ledger rejects awards for non-owner accounts", () => {
  assert.match(migration, /create or replace function public\.ari_circle_xp_owner_enabled/i);
  assert.match(migration, /coalesce\(p\.owner_access, false\) = true/i);
  assert.match(migration, /if not public\.ari_circle_xp_owner_enabled\(target_user_id\) then return 0; end if;/i);
  assert.match(migration, /create or replace function public\.ari_circle_can_create_xp_quest/i);
  assert.match(migration, /select public\.ari_circle_xp_owner_enabled\(target_user_id\)/i);
});

test("member meetup completion copy no longer advertises XP", () => {
  assert.match(migration, /else 'Completion saved\. Waiting for everyone to confirm\.'/i);
  assert.match(migration, /else 'Meetup completed\.'/i);
  assert.match(migration, /else 'Meetup verified\.'/i);
});
