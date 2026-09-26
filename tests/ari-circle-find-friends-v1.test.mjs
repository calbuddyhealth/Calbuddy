import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const meetupHtml = fs.readFileSync("ari-circle-meetup.html", "utf8");
const friendsHtml = fs.readFileSync("ari-circle-friends.html", "utf8");
const friendsJs = fs.readFileSync("js/ari-circle/connections/find-friends-v1.js", "utf8");
const friendsCss = fs.readFileSync("assets/css/ari-circle-find-friends-v1.css", "utf8");
const shell = fs.readFileSync("js/ari-circle/v5-real-world.js", "utf8");
const menu = fs.readFileSync("js/ari-circle/circle-menu-v5.js", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260926004500_ari_circle_find_friends_local_v1.sql", "utf8");

test("Connect top bar prioritizes Host and Find Friends without duplicate hero copy", () => {
  assert.match(meetupHtml, /id="hostMeetupButton"[^>]*>Host</);
  assert.match(meetupHtml, /href="ari-circle-friends\.html">Find Friends <span aria-hidden="true">\+<\/span>/);
  assert.doesNotMatch(meetupHtml, /Find something to do\./);
});

test("Find Friends page has local radar, mutual suggestions, search, and profile navigation", () => {
  assert.match(friendsHtml, /data-ari-circle-search-location data-surface="friends"/);
  assert.match(friendsHtml, /LOCATION RADAR/);
  assert.match(friendsHtml, /Suggested for you/);
  assert.match(friendsHtml, /People nearby/);
  assert.match(friendsHtml, /id="friendsSearchForm"/);
  assert.match(friendsJs, /ari-circle\.html\?user=/);
  assert.match(friendsJs, /data-friend-add/);
  assert.match(friendsJs, /ari:circleSearchLocationChanged/);
  assert.match(friendsCss, /circle-friend-card__avatar/);
});

test("friend discovery backend uses private coarse location and mutual accepted connections without returning coordinates", () => {
  assert.match(migration, /private\.ari_circle_search_locations/);
  assert.match(migration, /viewer_friends/);
  assert.match(migration, /mc\.status = 'accepted'/);
  assert.match(migration, /distance_miles numeric/);
  assert.match(migration, /mutual_count integer/);
  assert.match(migration, /is_nearby boolean/);
  assert.match(migration, /is_suggested boolean/);

  const returnsBlock = migration.slice(
    migration.indexOf("returns table"),
    migration.indexOf("language plpgsql")
  );
  assert.doesNotMatch(returnsBlock, /approximate_latitude/);
  assert.doesNotMatch(returnsBlock, /approximate_longitude/);
  assert.doesNotMatch(returnsBlock, /private_area/);
});

test("Find Friends remains part of Connect navigation everywhere", () => {
  assert.match(shell, /path\.includes\("ari-circle-friends"\)/);
  assert.match(menu, /href: "ari-circle-friends\.html", label: "Discover Friends"/);
});
