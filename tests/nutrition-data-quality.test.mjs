import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auth = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const quality = fs.readFileSync(path.join(root, "js/ari-nutrition-data-quality.js"), "utf8");

test("nutrition data-quality context is valid JavaScript and loads on Ari chat surfaces", () => {
  assert.doesNotThrow(() => new Function(quality));
  assert.match(auth, /ARI_NUTRITION_QUALITY_SCRIPT_ID/);
  assert.match(auth, /js\/ari-nutrition-data-quality\.js\?v=1\.0\.0/);
  assert.match(auth, /surface !== "home" && surface !== "nutrition"/);
});

test("Ari receives canonical ledger provenance and suspicious-record warnings", () => {
  assert.match(quality, /sourceOfTruth:\s*"public\.meals"/);
  assert.match(quality, /ledgerEvidence/);
  assert.match(quality, /dataQuality:\s*quality/);
  assert.match(quality, /warningCount/);
  assert.match(quality, /Treat those records as uncertain evidence/);
});

test("simple anomaly checks catch implausible meal-scale calories and macro mismatches", () => {
  assert.match(quality, /calories < 100/);
  assert.match(quality, /burrito\|bowl\|burger/);
  assert.match(quality, /protein \* 4 \+ carbs \* 4 \+ fat \* 9/);
  assert.match(quality, /calories and macros may describe different portions/i);
});
