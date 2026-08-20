import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auth = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const client = fs.readFileSync(path.join(root, "js/nutrition-transaction-client.js"), "utf8");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260820121000_nutrition_log_transaction.sql"),
  "utf8"
);

test("transaction client is valid JavaScript and loads after the canonical ledger bootstrap", () => {
  assert.doesNotThrow(() => new Function(client));
  assert.match(auth, /ARI_NUTRITION_TRANSACTION_SCRIPT_ID/);
  assert.match(auth, /js\/nutrition-transaction-client\.js\?v=1\.0\.0/);
  assert.ok(auth.indexOf("bootstrapCanonicalMealLedger();") < auth.indexOf("bootstrapNutritionTransactionClient();"));
  assert.match(client, /CalBuddy\.__ariMealLedgerSyncV1/);
});

test("signed-in meal logging does not silently fall back after a failed transaction", () => {
  assert.match(client, /ari_log_nutrition_meal/);
  assert.match(client, /if \(error\) \{/);
  assert.match(client, /throw new Error\(error\.message \|\| "The meal could not be saved\. Nothing was changed\."\)/);
  assert.doesNotMatch(client, /if \(error\).*canonicalFallback/s);
});

test("ordinary meal writes are mutation-journaled and idempotent", () => {
  assert.match(migration, /create or replace function public\.ari_log_nutrition_meal/);
  assert.match(migration, /where id = p_mutation_id\s+and user_id = v_user/);
  assert.match(migration, /insert into public\.meals/);
  assert.match(migration, /'log_meal'/);
  assert.match(migration, /insert into public\.ari_nutrition_mutations/);
  assert.match(migration, /'idempotent', true/);
});

test("ordinary meal writes return verified totals and can be undone", () => {
  assert.match(migration, /select coalesce\(sum\(calories\), 0\)/);
  assert.match(migration, /'todayCalories'/);
  assert.match(migration, /'undoAvailable', true/);
  assert.match(migration, /v_mutation\.action_type = 'log_meal'/);
  assert.match(migration, /delete from public\.meals/);
  assert.match(client, /CalBuddy\.undoNutritionMutation/);
  assert.match(client, /undo\.textContent = "Undo"/);
});

test("transaction RPCs are scoped to the authenticated user", () => {
  assert.match(migration, /v_user uuid := auth\.uid\(\)/);
  assert.match(migration, /user_id = v_user/);
  assert.match(migration, /revoke all on function public\.ari_log_nutrition_meal\(uuid, jsonb\) from public, anon/);
  assert.match(migration, /grant execute on function public\.ari_log_nutrition_meal\(uuid, jsonb\) to authenticated/);
});
