import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [api, hostWindow, css, migration] = await Promise.all([
  read("api/ari-circle-place-search.js"),
  read("js/ari-circle/connect/host-window-v1.js"),
  read("assets/css/ari-circle-host-window-v1.css"),
  read("supabase/migrations/20261003080500_ari_circle_hiking_destination_search_v1.sql")
]);

test("place search is country-wide US with local bias instead of a San Diego-only catalog", () => {
  assert.match(api, /photon\.komoot\.io\/api/i);
  assert.match(api, /nominatim\.openstreetmap\.org\/search/i);
  assert.match(api, /countrycodes.*us/i);
  assert.match(api, /scope:\s*"US"/i);
  assert.match(api, /url\.searchParams\.set\("lat"/i);
  assert.match(api, /url\.searchParams\.set\("lon"/i);
});

test("hiking host form searches destinations and preserves manual fallback", () => {
  assert.match(hostWindow, /Trail & destination search/i);
  assert.match(hostWindow, /across the U\.S\./i);
  assert.match(hostWindow, /AriCircleSearchLocation.*getPreference/s);
  assert.match(hostWindow, /No exact place found\. You can still use the area you typed\./i);
  assert.match(hostWindow, /ari_circle_set_meetup_destination/i);
  assert.match(css, /circle-connect-destination-result/i);
});

test("destination coordinates are public-place coordinates and hiking gets a wider radius", () => {
  assert.match(migration, /destination_latitude numeric\(6,3\)/i);
  assert.match(migration, /destination_longitude numeric\(7,3\)/i);
  assert.match(migration, /never a member home\/device coordinate/i);
  assert.match(migration, /ari_circle_set_meetup_destination/i);
  assert.match(migration, /case when c\.activity='hiking'[\s\S]*greatest\(search_location\.radius_miles::double precision, 100\.0\)/i);
});
