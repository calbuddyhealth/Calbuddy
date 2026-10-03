import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../supabase/migrations/20261003074000_ari_circle_local_discovery_v2.sql", import.meta.url),
  "utf8"
);

test("meetups capture a private discovery market separately from the public area", () => {
  assert.match(migration, /add column if not exists discovery_area text/i);
  assert.match(migration, /set discovery_area = area/i);
  assert.match(migration, /safe_discovery_area := coalesce/i);
  assert.match(migration, /search_location\.area_label/i);
  assert.match(migration, /area, discovery_area/i);
});

test("new meetups keep coarse host search coordinates for radius discovery", () => {
  assert.match(migration, /search_location\.approximate_latitude is not null/i);
  assert.match(migration, /safe_lat := search_location\.approximate_latitude/i);
  assert.match(migration, /safe_lon := search_location\.approximate_longitude/i);
  assert.match(migration, /approximate_latitude, approximate_longitude/i);
});

test("discovery includes same market, typed area, or selected radius", () => {
  assert.match(migration, /coalesce\(m\.discovery_area,''\)/i);
  assert.match(migration, /lower\(m\.area\)/i);
  assert.match(migration, /c\.area_matches/i);
  assert.match(migration, /c\.distance_value <= search_location\.radius_miles::double precision/i);
  assert.match(migration, /when c\.area_matches then 1/i);
});

test("existing safety and host limits remain in the canonical create RPC", () => {
  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /active_hosted_count >= 5/i);
  assert.match(migration, /You can host up to 5 active or upcoming events at a time\./i);
  assert.match(migration, /requested_starts_at > now\(\) \+ interval '60 days'/i);
});

test("discovery market is not added to the public list return shape", () => {
  const listStart = migration.indexOf("create or replace function public.ari_circle_list_meetups");
  const listSql = migration.slice(listStart);
  const returnsStart = listSql.indexOf("returns table(");
  const returnsEnd = listSql.indexOf(")\nlanguage plpgsql", returnsStart);
  const returnShape = listSql.slice(returnsStart, returnsEnd);
  assert.doesNotMatch(returnShape, /discovery_area/i);
});
