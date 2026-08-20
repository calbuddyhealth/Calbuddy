import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const temporaryGrant = fs.readFileSync(
  path.join(root, "supabase/migrations/20260820122500_restore_nutrition_plan_privileges.sql"),
  "utf8"
);
const deploymentGuard = fs.readFileSync(
  path.join(root, "supabase/migrations/20260820122600_hold_plan_cloud_until_client_sync.sql"),
  "utf8"
);
const syncRpc = fs.readFileSync(
  path.join(root, "supabase/migrations/20260820123500_nutrition_plan_cloud_sync_rpc.sql"),
  "utf8"
);
const syncIdentity = fs.readFileSync(
  path.join(root, "supabase/migrations/20260820124500_nutrition_plan_sync_identity_conflicts.sql"),
  "utf8"
);
const client = fs.readFileSync(path.join(root, "js/nutrition-transaction-client.js"), "utf8");

test("final migration state keeps direct Meal Plan browser DML closed", () => {
  assert.match(temporaryGrant, /grant select, insert, update, delete\s+on table public\.nutrition_plan_items\s+to authenticated/is);
  assert.match(deploymentGuard, /revoke select, insert, update, delete\s+on table public\.nutrition_plan_items\s+from authenticated/is);
  assert.doesNotMatch(syncIdentity, /grant\s+(?:select|insert|update|delete).*nutrition_plan_items.*authenticated/is);
});

test("authenticated Meal Plan access is scoped to user-bound RPCs", () => {
  assert.match(syncRpc, /v_user uuid := auth\.uid\(\)/);
  assert.match(syncRpc, /grant execute on function public\.ari_sync_nutrition_plans\(jsonb\) to authenticated/i);
  assert.match(syncRpc, /grant execute on function public\.ari_list_today_nutrition_plans\(\) to authenticated/i);
  assert.match(syncIdentity, /where id = v_requested_id\s+and user_id = v_user/is);
});

test("Meal Plan sync uses a dedicated stable identity instead of semantic source_ref", () => {
  assert.match(syncIdentity, /add column if not exists client_sync_key text/i);
  assert.match(syncIdentity, /nutrition_plan_items_user_date_sync_key_uidx/i);
  assert.match(syncIdentity, /client_sync_key = v_sync_key/i);
  assert.doesNotMatch(syncIdentity, /plan_date = v_date\s+and source_ref = v_source_ref/is);
});

test("browser adapter routes only nutrition_plan_items through the scoped bridge", () => {
  assert.match(client, /const TABLE = "nutrition_plan_items"/);
  assert.match(client, /ari_sync_nutrition_plans/);
  assert.match(client, /ari_list_today_nutrition_plans/);
  assert.match(client, /if \(clean\(tableName\) === TABLE\) return new PlanQuery\(\)/);
  assert.match(client, /return nativeFrom\(tableName\)/);
});
