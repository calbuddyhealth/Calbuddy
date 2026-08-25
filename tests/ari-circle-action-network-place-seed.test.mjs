import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20260825224500_ari_circle_places_seed_san_diego_v1.sql", import.meta.url),
  "utf8"
);

function stripSqlComments(sql = "") {
  return String(sql)
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const executable = stripSqlComments(migration);

const expectedPlaces = [
  "Balboa Park",
  "Mission Bay Park",
  "Mission Trails Regional Park",
  "Tecolote Canyon Natural Park",
];

test("V6 launch seed starts Explore with a deliberately small public-place inventory", () => {
  for (const name of expectedPlaces) {
    assert.match(migration, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  assert.match(migration, /insert into public\.ari_circle_places/i);
  assert.match(migration, /'curated'/i);
  assert.match(migration, /'active'/i);
  assert.match(migration, /safe_public_place/i);
});

test("seed rows carry first-party curation provenance", () => {
  const citySources = migration.match(/https:\/\/www\.sandiego\.gov\//gi) || [];
  assert.equal(citySources.length, expectedPlaces.length);
  assert.match(migration, /'source_kind',\s*'city_of_san_diego'/i);
  assert.match(migration, /'curation_version',\s*'san-diego-v1'/i);
});

test("Place seed is retry-safe instead of duplicating launch destinations", () => {
  assert.match(migration, /where not exists\s*\(/i);
  assert.match(migration, /lower\(existing\.name\) = lower\(s\.name\)/i);
  assert.match(migration, /lower\(coalesce\(existing\.city, ''\)\) = lower\(s\.city\)/i);
});

test("seed supports real-world activity discovery without social or paid ranking signals", () => {
  assert.match(migration, /array\['walking','running'/i);
  assert.match(migration, /'hiking'/i);
  assert.match(migration, /'cycling'/i);
  assert.match(migration, /'outdoor'/i);
  assert.doesNotMatch(executable, /\b(user_location|presence|last_seen|followers|likes|views|premium|subscription|sponsor|paid_rank|popularity_score)\b/i);
});

test("seed coordinates stay inside the San Diego launch region", () => {
  const coordinatePairs = [
    [32.73172, -117.14698],
    [32.76986, -117.24725],
    [32.81988, -117.05658],
    [32.80140, -117.18844],
  ];
  for (const [lat, lon] of coordinatePairs) {
    assert.ok(lat > 32.5 && lat < 33.0);
    assert.ok(lon > -117.4 && lon < -116.9);
    assert.match(migration, new RegExp(String(lat).replace('.', '\\.'), "i"));
    assert.match(migration, new RegExp(String(lon).replace('.', '\\.'), "i"));
  }
});
