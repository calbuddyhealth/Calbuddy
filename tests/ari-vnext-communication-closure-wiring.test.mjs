import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("communication closure is wired through cognition, model context, persistence, and migration", async () => {
  const [cognitive, contextRouter, api, migration] = await Promise.all([
    readFile(new URL("../api/_lib/ari-vnext/cognitive-loop.js", import.meta.url), "utf8"),
    readFile(new URL("../api/_lib/ari-vnext/context-router.js", import.meta.url), "utf8"),
    readFile(new URL("../api/ari-vnext.js", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260925093000_ari_communication_closure_engine.sql", import.meta.url), "utf8")
  ]);

  assert.match(cognitive, /deriveCommunicationClosureWorkspace/);
  assert.match(cognitive, /advanceCommunicationClosure/);
  assert.match(cognitive, /communicationClosure:\s*nextCommunicationClosure/);

  assert.match(contextRouter, /communicationClosureToInstruction/);
  assert.match(contextRouter, /cognitiveWorkspace\?\.communicationClosure/);

  assert.match(api, /persistCommunicationClosure/);
  assert.match(api, /summarizeCommunicationClosure/);
  assert.match(api, /communicationClosureStored/);
  assert.match(api, /decisionOutcomeLearning/);

  assert.match(migration, /ari_vnext_communication_closures/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on table public\.ari_vnext_communication_closures from anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.ari_vnext_communication_closures to service_role/i);
});
