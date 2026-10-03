import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../supabase/migrations/20261003114500_ari_circle_hiking_discovery_radius_v1.sql", import.meta.url),
  "utf8"
);

test("hiking meetup discovery expands to a 100 mile minimum", () => {
  assert.match(migration, /hiking_discovery_radius_miles constant double precision := 100\.0/i);
  assert.match(
    migration,
    /when c\.activity = 'hiking' then greatest\([\s\S]*coalesce\(search_location\.radius_miles, 25\)::double precision,[\s\S]*hiking_discovery_radius_miles/i
  );
});

test("non-hiking meetup discovery keeps the member-selected radius", () => {
  assert.match(
    migration,
    /else coalesce\(search_location\.radius_miles, 25\)::double precision/i
  );
});

test("expanded radius applies to both filtering and distance-first ranking", () => {
  const hikingBranches = migration.match(/when c\.activity = 'hiking' then greatest\(/g) || [];
  assert.equal(hikingBranches.length, 2);
  assert.match(migration, /where[\s\S]*c\.distance_value <= case/i);
  assert.match(migration, /order by[\s\S]*c\.distance_value <= case/i);
});

test("canonical meetup RPC remains privacy-safe and signature-compatible", () => {
  assert.match(
    migration,
    /create or replace function public\.ari_circle_list_meetups\(\s*requested_activity text default null,\s*requested_window text default 'upcoming',\s*result_limit integer default 30\s*\)/i
  );
  assert.doesNotMatch(migration, /navigator\.geolocation|getCurrentPosition|watchPosition/i);
  assert.doesNotMatch(migration, /meeting_point/i);
});
