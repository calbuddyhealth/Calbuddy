import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = async (relative) => await readFile(new URL(`../${relative}`, import.meta.url), "utf8");
const wrapper = await read("api/_lib/ari-vnext/orchestrator.js");
const core = await read("api/_lib/ari-vnext/orchestrator-core.js");


test("Phase 9C preserves the mature single-action orchestrator as an unchanged core boundary", () => {
  assert.match(core, /parallel_tool_calls = false/);
  assert.match(core, /function findFunctionCall\(output = \[\]\)/);
  assert.match(core, /reviewExplicitApplicationIntent/);
  assert.match(core, /validateToolCall/);
  assert.match(core, /createPendingAction/);

  assert.match(wrapper, /from "\.\/orchestrator-core\.js"/);
  assert.match(wrapper, /if \(clauses\.length < 2\) return await runAriVNextCore\(turn\)/);
});

test("Phase 9C sends each bounded compound clause through the complete existing trust path independently", () => {
  assert.match(wrapper, /Promise\.all\(clauses\.map/);
  assert.match(wrapper, /runAriVNextCore\(\{/);
  assert.match(wrapper, /message: clause/);
  assert.match(wrapper, /pendingAction: null/);
  assert.match(wrapper, /result\?\.action\?\.type === "proposed_action"/);
  assert.match(wrapper, /BATCHABLE_OPERATIONS\.has\(name\)/);
});

test("Phase 9C creates one outer confirmation batch only after every sub-turn produced a trusted proposal", () => {
  assert.match(wrapper, /name: "compound_action_batch"/);
  assert.match(wrapper, /args: \{ actions: proposals \}/);
  assert.match(wrapper, /confirmationRequired: true/);
  assert.match(wrapper, /oneConfirmationRequired: true/);
  assert.match(wrapper, /canonicalPreflightRequired: true/);
});

test("Phase 9C compound detection is bounded and avoids treating ordinary multi-field updates as independent actions", () => {
  assert.match(wrapper, /MAX_COMPOUND_ACTIONS/);
  assert.match(wrapper, /STRONG_COMPOUND_SIGNAL/);
  assert.doesNotMatch(
    wrapper,
    /\\band\\s\+\(\?:log\|record\|save\|add\|change\|update/,
    "Plain 'and change/update' should not be a strong compound trigger because it often describes fields of one mutation."
  );
});

test("Phase 9C wrapper never executes app data directly", () => {
  assert.doesNotMatch(wrapper, /AriVNextActionAdapter|AriVNextOperationRegistry|CalBuddy\.executeAction/);
  assert.doesNotMatch(wrapper, /\.from\(|\.rpc\(|supabase/i);
  assert.doesNotMatch(wrapper, /\bfetch\s*\(/);
});

test("Phase 9C rejects duplicate and destructive same-target combinations before an outer pending action exists", () => {
  assert.match(wrapper, /duplicateKey/);
  assert.match(wrapper, /DESTRUCTIVE_OPERATIONS/);
  assert.match(wrapper, /both changes and removes the same saved item/);
  assert.match(wrapper, /pendingAction: null/);
});
