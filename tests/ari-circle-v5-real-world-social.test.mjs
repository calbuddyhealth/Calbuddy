import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const meetupHtml = fs.readFileSync("ari-circle-meetup.html", "utf8");
const connect = fs.readFileSync("js/ari-circle/connect/connect-v1.js", "utf8");
const feedHtml = fs.readFileSync("ari-circle-feed.html", "utf8");
const shell = fs.readFileSync("js/ari-circle/v5-real-world.js", "utf8");
const menu = fs.readFileSync("js/ari-circle/circle-menu-v5.js", "utf8");
const gallery = fs.readFileSync("js/ari-circle/profile/profile-gallery-v1.js", "utf8");
const galleryMigration = fs.readFileSync("supabase/migrations/20260923160828_ari_circle_profile_gallery_v1.sql", "utf8");
const showcaseMigration = fs.readFileSync("supabase/migrations/20260925161000_ari_circle_profile_showcase_v2.sql", "utf8");
const connections = fs.readFileSync("js/ari-circle/connections/connections-controller.js", "utf8");

test("Connect prioritizes people doing things over configuration", () => {
  assert.match(meetupHtml, /Find something to do\./);
  assert.match(meetupHtml, /HAPPENING NOW/);
  assert.match(meetupHtml, /TODAY/);
  assert.match(meetupHtml, /TOMORROW/);
  assert.match(meetupHtml, /THIS WEEKEND/);
  assert.match(meetupHtml, /COMING UP/);
  assert.match(meetupHtml, /Anything/);
  assert.match(meetupHtml, /\+ Host/);
});

test("Connect reuses canonical meetup joins, requests, waitlists, rooms, and hosting", () => {
  assert.match(connect, /ari_circle_list_meetups/);
  assert.match(connect, /ari_circle_join_meetup/);
  assert.match(connect, /ari_circle_request_meetup/);
  assert.match(connect, /ari_circle_withdraw_meetup_request/);
  assert.match(connect, /ari_circle_review_meetup_request/);
  assert.match(connect, /ari_circle_create_meetup/);
  assert.match(connect, /ari-circle-meetup-room\.html/);
  assert.doesNotMatch(connect, /ari_circle_complete_meetup/);
});

test("legacy Feed route redirects to Connect instead of exposing an infinite posting surface", () => {
  assert.match(feedHtml, /window\.location\.replace\("ari-circle-meetup\.html"\)/);
  assert.match(feedHtml, /Feed is retired as a member-facing surface/);
});

test("Circle primary shell is Connect and Profile only", () => {
  assert.match(shell, /const VERSION = "5\.5\.0"/);
  assert.match(shell, /NAV_MODEL = "connect-profile-v1"/);
  assert.match(shell, /navLink\("connect", "ari-circle-meetup\.html", "Connect"\)/);
  assert.match(shell, /navLink\("profile", "ari-circle\.html", "Profile"\)/);
  assert.doesNotMatch(shell, /navLink\("feed"/);
  assert.doesNotMatch(shell, /navLink\("arinext"/);
  assert.doesNotMatch(menu, /label: "Quests"/);
});

test("profile showcase keeps exactly four slots and accepts photo video or text", () => {
  assert.match(galleryMigration, /position between 1 and 4/i);
  assert.match(galleryMigration, /unique \(user_id, position\)/i);
  assert.match(showcaseMigration, /content_type in \('image','video','text'\)/i);
  assert.match(showcaseMigration, /duration_seconds <= 30\.5/i);
  assert.match(showcaseMigration, /ari_circle_profile_showcase_set/i);
  assert.match(gallery, /\[1,2,3,4\]/);
  assert.match(gallery, /supportedTypes: Object\.freeze\(\["image","video","text"\]\)/);
  assert.match(gallery, /Photo · Video · Text/);
  assert.match(gallery, /MAX_VIDEO_SECONDS = 30/);
  assert.match(gallery, /MAX_TEXT_LENGTH = 600/);
});

test("only images use the existing moderation queue while text and short video publish directly", () => {
  assert.match(showcaseMigration, /if clean_type = 'image' then[\s\S]*pgmq\.send/);
  assert.match(showcaseMigration, /clean_type = 'text'[\s\S]*next_status := 'approved'/);
  assert.match(showcaseMigration, /next_decision := 'profile_showcase_video'/);
  assert.match(gallery, /Image uploaded\. Checking before it becomes visible to other people/);
});

test("profile relationship action is explicitly friendship", () => {
  assert.match(connections, /"Add Friend"/);
  assert.match(connections, /"Requested"/);
  assert.match(connections, /"Friends"/);
  assert.doesNotMatch(connections, /"Add to Circle"/);
});
