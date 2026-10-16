import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  new URL("../supabase/migrations/20260926194800_restore_ari_reports_service_role_access.sql", import.meta.url),
  "utf8"
);
const setup = fs.readFileSync(
  new URL("../supabase/ARI_ACCOUNT_MEMORY_SAFETY_SETUP.txt", import.meta.url),
  "utf8"
);
const api = fs.readFileSync(
  new URL("../api/profile.js", import.meta.url),
  "utf8"
);

test("Help & Safety backend can rate-limit and create ari_reports with the service role", () => {
  assert.match(api, /rest\/v1\/ari_reports/i);
  assert.match(api, /ARI XP support rate-limit check failed/i);
  assert.match(migration, /grant select, insert, update on table public\.ari_reports to service_role/i);
  assert.match(setup, /grant select, insert, update on public\.ari_reports to service_role/i);
});
