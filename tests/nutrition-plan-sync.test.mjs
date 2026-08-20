import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const client = fs.readFileSync(path.join(root, "js/nutrition-transaction-client.js"), "utf8");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260820124500_nutrition_plan_sync_identity_conflicts.sql"),
  "utf8"
);

test("nutrition trust client remains syntactically valid after plan sync bridge", () => {
  assert.doesNotThrow(() => new Function(client));
});

test("legacy local plans are migrated before cloud plans are listed", () => {
  const syncStart = client.indexOf("async function synchronizeLocal()");
  const localRead = client.indexOf("const localToday = readLocal()", syncStart);
  const localPush = client.indexOf("await pushRecords(localToday)", syncStart);
  const cloudRead = client.indexOf("await listCloud()", syncStart);
  assert.ok(syncStart >= 0 && localRead > syncStart && localPush > localRead && cloudRead > localPush);
});

test("cloud snapshots are mirrored locally for resilient cross-device reads", () => {
  assert.match(client, /function mirrorCloud\(rows = \[\]\)/);
  assert.match(client, /writeLocal\(\[\.\.\.existing, \.\.\.mirrored\]\)/);
  assert.match(client, /cloud_id: clean\(row\?\.id\) \|\| null/);
});

test("new plan inserts use unique sync keys instead of shared Ari source labels", () => {
  assert.match(client, /const localId = makeLocalId\(\)/);
  assert.match(client, /client_sync_key: `local:\$\{localId\}`/);
  assert.match(migration, /and client_sync_key = v_sync_key/);
});

test("stale device snapshots cannot overwrite newer cloud plan state", () => {
  assert.match(migration, /v_client_updated_at >= coalesce\(v_existing_updated_at, '-infinity'::timestamptz\)/);
  assert.match(migration, /v_stale := v_stale \+ 1/);
  assert.match(migration, /'staleCount', v_stale/);
});

test("future-dated records remain outside the today-only synchronization boundary", () => {
  assert.match(migration, /if v_date <> current_date then\s+continue;/is);
});

test("the adapter preserves the native Supabase client for every other table", () => {
  assert.match(client, /const nativeFrom = client\.from\.bind\(client\)/);
  assert.match(client, /return nativeFrom\(tableName\)/);
});
