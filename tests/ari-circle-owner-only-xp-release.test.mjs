import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const meetup = fs.readFileSync("ari-circle-meetup.html", "utf8");
const feed = fs.readFileSync("ari-circle-feed.html", "utf8");
const profileLoader = fs.readFileSync("js/ari-circle/profile/profile-v3-loader.js", "utf8");
const connect = fs.readFileSync("js/ari-circle/connect/connect-v1.js", "utf8");
const retirement = fs.readFileSync("supabase/migrations/20260923121000_ari_circle_retire_xp_completion.sql", "utf8");

test("active Circle surfaces contain no XP presentation", () => {
  for (const source of [meetup, feed, profileLoader, connect]) {
    assert.doesNotMatch(source, /ari-circle-xp\.css/i);
    assert.doesNotMatch(source, /REAL WORLD XP/i);
    assert.doesNotMatch(source, /circle-v5-xp-chip/i);
    assert.doesNotMatch(source, /XP releases/i);
  }
});

test("Connect contains no meetup completion action", () => {
  assert.doesNotMatch(connect, /ari_circle_complete_meetup/);
  assert.doesNotMatch(connect, /Complete Meetup/);
  assert.doesNotMatch(connect, /viewer_completed/);
  assert.doesNotMatch(meetup, /meetupXpCard/);
});

test("database retirement migration prevents new XP awards", () => {
  assert.match(retirement, /create or replace function public\.ari_circle_award_xp_capped/i);
  assert.match(retirement, /select 0::integer/i);
  assert.match(retirement, /participant_xp set default 0/i);
  assert.match(retirement, /host_bonus_xp set default 0/i);
  assert.match(retirement, /xp_reward set default 0/i);
});

test("meetup completion RPC is no longer executable by Circle clients", () => {
  assert.match(retirement, /revoke all on function public\.ari_circle_complete_meetup\(uuid\)/i);
  assert.match(retirement, /from public, anon, authenticated/i);
  assert.match(retirement, /revoke all on function public\.ari_circle_xp_summary\(uuid\)/i);
});
