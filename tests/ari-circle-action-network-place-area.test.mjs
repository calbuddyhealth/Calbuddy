import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20260825225000_ari_circle_places_area_terms_v1.sql", import.meta.url),
  "utf8"
);

function stripSqlComments(sql = "") {
  return String(sql)
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const executable = stripSqlComments(migration);

test("no-GPS Explore tokenizes comma-separated general areas", () => {
  assert.match(migration, /regexp_split_to_array\(clean_area, '\\s\*,\\s\*'\)/i);
  assert.match(migration, /unnest\(area_terms\)/i);
  assert.match(migration, /lower\(p\.area\) like \('%' \|\| term \|\| '%'\)/i);
  assert.match(migration, /lower\(coalesce\(p\.city, ''\)\) like \('%' \|\| term \|\| '%'\)/i);
  assert.match(migration, /lower\(coalesce\(p\.region, ''\)\) like \('%' \|\| term \|\| '%'\)/i);
});

test("specific area matches rank ahead of city and region matches", () => {
  assert.match(migration, /lower\(p\.area\)[\s\S]*then 3/i);
  assert.match(migration, /lower\(coalesce\(p\.city, ''\)\)[\s\S]*then 2/i);
  assert.match(migration, /lower\(coalesce\(p\.region, ''\)\)[\s\S]*then 1/i);
  assert.match(migration, /c\.area_match_score desc/i);
});

test("text area hardening keeps existing public-place and distance gates", () => {
  assert.match(migration, /p\.status = 'active'/i);
  assert.match(migration, /p\.safe_public_place = true/i);
  assert.match(migration, /p\.verification_state in \('curated','partner_verified'\)/i);
  assert.match(migration, /3958\.7613 \* 2 \* asin/i);
  assert.match(migration, /safe_radius not in \(5,10,25,50,100\)/i);
});

test("text matching does not persist location or introduce social ranking", () => {
  assert.doesNotMatch(executable, /insert\s+into\s+public\.ari_circle_action_intents/i);
  assert.doesNotMatch(executable, /update\s+public\.ari_circle_action_intents/i);
  assert.doesNotMatch(executable, /\b(presence|last_seen|followers|likes|views|premium|subscription|sponsor|paid_rank|popularity_score)\b/i);
});

test("Explore RPC remains adult-gated and unavailable to anonymous callers", () => {
  assert.match(migration, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(migration, /revoke all on function public\.ari_circle_list_places[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.ari_circle_list_places[\s\S]*to authenticated, service_role/i);
});
