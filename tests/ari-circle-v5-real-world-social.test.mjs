import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const meetupHtml = fs.readFileSync("ari-circle-meetup.html", "utf8");
const connect = fs.readFileSync("js/ari-circle/connect/connect-v1.js", "utf8");
const feedHtml = fs.readFileSync("ari-circle-feed.html", "utf8");
const happening = fs.readFileSync("js/ari-circle/feed/happening-v5.js", "utf8");
const shell = fs.readFileSync("js/ari-circle/v5-real-world.js", "utf8");
const menu = fs.readFileSync("js/ari-circle/circle-menu-v5.js", "utf8");
const gallery = fs.readFileSync("js/ari-circle/profile/profile-gallery-v1.js", "utf8");
const galleryMigration = fs.readFileSync("supabase/migrations/20260923160828_ari_circle_profile_gallery_v1.sql", "utf8");
const connections = fs.readFileSync("js/ari-circle/connections/connections-controller.js", "utf8");

test("Connect prioritizes people doing things over configuration", () => {
  assert.match(meetupHtml, /Find something to do\./);
  assert.match(meetupHtml, /HAPPENING NOW/);
  assert.match(meetupHtml, /TODAY/);
  assert.match(meetupHtml, /THIS WEEKEND/);
  assert.match(meetupHtml, /COMING UP/);
  assert.match(meetupHtml, /Anything/);
  assert.match(meetupHtml, /\+ Host/);
  assert.doesNotMatch(meetupHtml, /Upcoming<\/button>/);
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

test("Feed is event-first while preserving friend text updates", () => {
  assert.match(feedHtml, /Share an update/);
  assert.match(feedHtml, /Updates from your people/);
  assert.doesNotMatch(feedHtml, /Camera \/ Library/);
  assert.doesNotMatch(feedHtml, /Make it a Moment/);
  assert.match(happening, /Join something/);
  assert.match(happening, /ari_circle_list_meetups/);
  assert.match(happening, /ari_circle_join_meetup/);
  assert.match(happening, /ari_circle_request_meetup/);
});

test("Circle primary shell is Feed and Connect only", () => {
  assert.match(shell, /const VERSION = "5\.4\.0"/);
  assert.match(shell, /navLink\("feed", "ari-circle-feed\.html", "Feed"\)/);
  assert.match(shell, /navLink\("connect", "ari-circle-meetup\.html", "Connect"\)/);
  assert.doesNotMatch(shell, /navLink\("arinext"/);
  assert.doesNotMatch(menu, /label: "Quests"/);
});

test("profile gallery enforces avatar plus four supporting photos", () => {
  assert.match(galleryMigration, /position between 1 and 4/i);
  assert.match(galleryMigration, /unique \(user_id, position\)/i);
  assert.match(gallery, /\[1,2,3,4\]/);
  assert.match(gallery, /profile-gallery/);
  assert.match(gallery, /profile_gallery_photo/);
});

test("profile relationship action is explicitly friendship", () => {
  assert.match(connections, /"Add Friend"/);
  assert.match(connections, /"Requested"/);
  assert.match(connections, /"Friends"/);
  assert.doesNotMatch(connections, /"Add to Circle"/);
});
