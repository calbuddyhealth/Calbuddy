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

test("Find Friends client script parses cleanly", () => {
  assert.doesNotThrow(() => new Function(friendsJs));
});

test("Connect top bar prioritizes Host and Find Friends without duplicate hero copy", () => {
  assert.match(meetupHtml, /id="hostMeetupButton"[\s\S]*circle-connect-action__label">Host<\/span>/);
  assert.match(meetupHtml, /href="ari-circle-friends\.html"[\s\S]*circle-connect-action__label">Find Friends<\/span>/);
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

test("Find Friends prevents iOS focus auto-zoom and releases focus before navigation", () => {
  assert.match(friendsCss, /circle-friends-search input[\s\S]*font:700 16px\/1\.2/);
  assert.match(friendsCss, /circle-friends-page input[\s\S]*font-size: 16px !important/);
  assert.match(friendsCss, /circle-friends-page select/);
  assert.match(friendsJs, /function settleVisualViewport\(\)/);
  assert.match(friendsJs, /settleVisualViewport\(\);[\s\S]*void load/);
  assert.match(friendsHtml, /ari-circle-find-friends-v1\.css\?v=1\.0\.2/);
  assert.match(friendsHtml, /find-friends-v1\.js\?v=1\.0\.1/);
});

test("Find Friends fits the mobile viewport without horizontal overflow", () => {
  assert.match(friendsHtml, /ari-circle-find-friends-v1\.css\?v=1\.0\.2/);
  assert.match(friendsCss, /body\.circle-friends-page \*[\s\S]*box-sizing:border-box/);
  assert.match(friendsCss, /body\.circle-friends-page \.circle-v5-page[\s\S]*width:100% !important[\s\S]*max-width:760px !important/);
  assert.match(friendsCss, /body\.circle-friends-page \.circle-friends-main[\s\S]*padding:10px 0 calc\(126px \+ env\(safe-area-inset-bottom\)\) !important/);
  assert.match(friendsCss, /@media \(max-width:620px\)[\s\S]*circle-friends-hero[\s\S]*grid-template-columns:minmax\(0,1fr\) !important/);
  assert.match(friendsCss, /ari-circle-location-card__actions[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
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
