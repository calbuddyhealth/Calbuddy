import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../supabase/migrations/20261003074200_ari_circle_local_discovery_backfill_v2.sql", import.meta.url),
  "utf8"
);

test("active scheduled meetups inherit the host's current Circle discovery market", () => {
  assert.match(migration, /from private\.ari_circle_search_locations s/i);
  assert.match(migration, /s\.user_id = m\.host_user_id/i);
  assert.match(migration, /discovery_area = coalesce\(nullif\(btrim\(s\.area_label\), ''\), m\.area\)/i);
  assert.match(migration, /m\.status = 'scheduled'/i);
  assert.match(migration, /m\.ends_at > now\(\)/i);
});

test("backfill preserves existing event coordinates and only fills missing coarse coordinates", () => {
  assert.match(migration, /approximate_latitude = coalesce\(m\.approximate_latitude, s\.approximate_latitude\)/i);
  assert.match(migration, /approximate_longitude = coalesce\(m\.approximate_longitude, s\.approximate_longitude\)/i);
});
