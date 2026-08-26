import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const migration = read("supabase/migrations/20260826160000_ari_circle_search_location_v1.sql");
const controller = read("js/ari-circle/location/search-location-v1.js");
const meetup = read("ari-circle-meetup.html");
const explore = read("ari-circle-explore.html");
const v6 = read("ari-circle-v6.html");
const plist = read("ios/App/App/Info.plist");

test("search location is private, self-scoped, and adult-gated", () => {
  assert.match(migration, /create table if not exists private\.ari_circle_search_locations/i);
  assert.match(migration, /alter table private\.ari_circle_search_locations enable row level security/i);
  assert.match(migration, /revoke all on table private\.ari_circle_search_locations from public, anon, authenticated/i);
  assert.match(migration, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(migration, /where s\.user_id = caller_id/i);
});

test("exact device coordinates are never persisted", () => {
  assert.match(migration, /safe_lat := round\(requested_latitude, 2\)/i);
  assert.match(migration, /safe_lon := round\(requested_longitude, 2\)/i);
  assert.match(migration, /numeric\(6,2\)/i);
  assert.match(migration, /numeric\(7,2\)/i);
});

test("geolocation is requested only from explicit user action", () => {
  assert.match(controller, /Use current location/i);
  assert.match(controller, /navigator\.geolocation\.getCurrentPosition/i);
  assert.doesNotMatch(controller, /getCurrentPosition\([^)]*\)\s*;?\s*}\s*boot/i);
});

test("supported radii remain bounded", () => {
  for (const radius of [5, 10, 25, 50, 100]) {
    assert.match(migration, new RegExp(`\\b${radius}\\b`));
    assert.match(controller, new RegExp(`\\b${radius}\\b`));
  }
  assert.match(migration, /safe_radius not in \(5,10,25,50,100\)/i);
});

test("shared location UI is wired to For You, Explore, and Meet Up", () => {
  for (const html of [meetup, explore, v6]) {
    assert.match(html, /ari-circle-search-location-v1\.css\?v=1\.0\.0/);
    assert.match(html, /search-location-v1\.js\?v=1\.0\.0/);
  }
});

test("iOS disclosure states location is explicit and coarse", () => {
  assert.match(plist, /Use current location in ARI Circle/i);
  assert.match(plist, /coarse rounded search area/i);
  assert.match(plist, /exact location is not shown to other members/i);
});

test("manual area remains valid without GPS", () => {
  assert.match(migration, /if clean_source = 'manual_area'/i);
  assert.match(migration, /Enter a city, ZIP code, or general neighborhood/i);
  assert.match(controller, /city, ZIP code, or general neighborhood/i);
});

test("clearing the preference is supported", () => {
  assert.match(migration, /create or replace function public\.ari_circle_clear_my_search_location\(\)/i);
  assert.match(controller, /ari_circle_clear_my_search_location/);
});
