import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../supabase/migrations/20261003074100_ari_circle_local_discovery_edit_v2.sql", import.meta.url),
  "utf8"
);

test("edited meetups stay anchored to the host's current Circle market", () => {
  assert.match(migration, /create or replace function public\.ari_circle_update_meetup/i);
  assert.match(migration, /safe_discovery_area := coalesce/i);
  assert.match(migration, /discovery_area=safe_discovery_area/i);
  assert.match(migration, /safe_lat := search_location\.approximate_latitude/i);
  assert.match(migration, /safe_lon := search_location\.approximate_longitude/i);
});

test("discovery area cannot become null after the backfill", () => {
  assert.match(migration, /set discovery_area = area/i);
  assert.match(migration, /alter column discovery_area set not null/i);
});

test("edit RPC keeps existing scheduling and capacity safeguards", () => {
  assert.match(migration, /Meetups cannot be edited after they start/i);
  assert.match(migration, /Open spots cannot be reduced below the number of people already going/i);
  assert.match(migration, /requested_starts_at > now\(\) \+ interval '60 days'/i);
});
