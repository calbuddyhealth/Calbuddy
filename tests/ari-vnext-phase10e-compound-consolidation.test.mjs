import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  COMPOUND_PRIMARY_PLANNER_VERSION,
  analyzeCompoundPrimaryEligibility,
  validatePreparedCalls
} from "../api/_lib/ari-vnext/compound-primary-planner.js";
import { PREPARED_PRIMARY_VERSION } from "../api/_lib/ari-vnext/prepared-primary.js";

const read = async (relative) => await readFile(new URL(`../${relative}`, import.meta.url), "utf8");
const plannerSource = await read("api/_lib/ari-vnext/compound-primary-planner.js");
const preparedSource = await read("api/_lib/ari-vnext/prepared-primary.js");
const wrapper = await read("api/_lib/ari-vnext/orchestrator.js");
const core = await read("api/_lib/ari-vnext/orchestrator-core.js");

function baseTurn(message = "") {
  return {
    message,
    history: [],
    context: {
      accountEntitlements: { teenMode: false, circleAllowed: false },
      intelligenceEntitlement: { advancedEnabled: false, accessClass: "casual" }
    }
  };
}

test("Phase 10E consolidates only uniquely deterministic independent tools", () => {
  const clauses = [
    "Log my chicken bowl, 620 calories.",
    "Log my weight as 185 pounds."
  ];
  const analysis = analyzeCompoundPrimaryEligibility({
    turn: baseTurn(clauses.join(" Then ")),
    clauses
  });

  assert.equal(COMPOUND_PRIMARY_PLANNER_VERSION, "1.0.0");
  assert.equal(analysis.eligible, true);
  assert.deepEqual(
    analysis.clauseSpecs.map((item) => item.expectedToolName),
    ["propose_log_meal", "propose_log_weight"]
  );
  assert.deepEqual(
    analysis.clauseSpecs.map((item) => item.applicationAction),
    ["log_meal", "log_weight"]
  );
});

test("Phase 10E supports a deterministic single-domain goal command plus a routine log", () => {
  const clauses = [
    "Set my target weight to 180 pounds.",
    "Log my weight as 185 pounds."
  ];
  const analysis = analyzeCompoundPrimaryEligibility({
    turn: baseTurn(clauses.join(" Then ")),
    clauses
  });

  assert.equal(analysis.eligible, true);
  assert.deepEqual(
    analysis.clauseSpecs.map((item) => item.expectedToolName),
    ["propose_update_goal", "propose_log_weight"]
  );
});

test("Phase 10E falls back for reference-bound and destructive compound turns", () => {
  for (const clauses of [
    ["Delete the second one.", "Log my weight as 185 pounds."],
    ["Undo that meal.", "Log my 30 minute run."],
    ["Remove that workout.", "Set my calorie goal to 2200."]
  ]) {
    const analysis = analyzeCompoundPrimaryEligibility({
      turn: baseTurn(clauses.join(" Then ")),
      clauses
    });
    assert.equal(analysis.eligible, false);
  }
});

test("Phase 10E refuses duplicate same-tool clauses so arguments cannot be swapped", () => {
  const clauses = [
    "Log my chicken bowl, 620 calories.",
    "Log my oatmeal, 410 calories."
  ];
  const analysis = analyzeCompoundPrimaryEligibility({
    turn: baseTurn(clauses.join(" Then ")),
    clauses
  });

  assert.equal(analysis.eligible, false);
  assert.equal(analysis.reason, "duplicate_tool_requires_independent_interpretation");
});

test("Phase 10E refuses high-stakes, current-info, developer, and coaching clauses", () => {
  const cases = [
    ["Log my shoulder pain as an activity.", "Log my weight as 185 pounds."],
    ["Log my run, then check the current weather."],
    ["Set my calorie goal to 2200.", "Debug my API code."],
    ["Log my chicken bowl, 620 calories.", "Compare my training and nutrition progress."]
  ];

  for (const value of cases) {
    const clauses = value.length === 1 ? value[0].split(/, then /i) : value;
    const analysis = analyzeCompoundPrimaryEligibility({
      turn: baseTurn(clauses.join(" Then ")),
      clauses
    });
    assert.equal(analysis.eligible, false);
  }
});

test("Phase 10E accepts prepared calls only when count, order, tool, and JSON shape match exactly", () => {
  const specs = [
    { expectedToolName: "propose_log_meal", applicationAction: "log_meal" },
    { expectedToolName: "propose_log_weight", applicationAction: "log_weight" }
  ];
  const calls = [
    { type: "function_call", call_id: "call_meal", name: "propose_log_meal", arguments: '{"meal":"chicken"}' },
    { type: "function_call", call_id: "call_weight", name: "propose_log_weight", arguments: '{"weight":185}' }
  ];

  const valid = validatePreparedCalls(calls, specs);
  assert.equal(valid?.length, 2);
  assert.equal(valid?.[0]?.name, "propose_log_meal");
  assert.equal(valid?.[1]?.name, "propose_log_weight");

  assert.equal(validatePreparedCalls(calls.slice(0, 1), specs), null);
  assert.equal(validatePreparedCalls([...calls].reverse(), specs), null);
  assert.equal(validatePreparedCalls([{ ...calls[0], arguments: "{" }, calls[1]], specs), null);
});

test("Phase 10E prepared-primary injection replaces only the primary provider call", () => {
  assert.equal(PREPARED_PRIMARY_VERSION, "1.0.0");
  assert.match(preparedSource, /AsyncLocalStorage/);
  assert.match(preparedSource, /classifyOpenAIRequest\(requestBody\) !== "primary"/);
  assert.match(preparedSource, /phase10e_shared_compound_primary/);
  assert.match(preparedSource, /recordAvoidedModelCall/);
  assert.match(preparedSource, /type: "function_call"/);
  assert.doesNotMatch(preparedSource, /createPendingAction|validateToolCall|AriVNextOperationRegistry|supabase|\.rpc\(/i);
});

test("Phase 10E planner proposes arguments only and has no mutation authority", () => {
  assert.match(plannerSource, /reviewDeterministicRoutineLogIntent/);
  assert.match(plannerSource, /reviewDeterministicDirectMutation/);
  assert.match(plannerSource, /validatePreparedCalls/);
  assert.match(plannerSource, /shared_primary_shape_mismatch/);
  assert.doesNotMatch(plannerSource, /createPendingAction|AriVNextOperationRegistry|CalBuddy\.executeAction|supabase|\.rpc\(/i);
});

test("Phase 10E keeps every clause inside the mature Phase 8C/9 core and preserves fallback", () => {
  assert.match(core, /reviewExplicitApplicationIntent/);
  assert.match(core, /validateToolCall/);
  assert.match(core, /canonicalizeApplicationArguments/);
  assert.match(core, /createPendingAction/);

  assert.match(wrapper, /planCompoundPrimary/);
  assert.match(wrapper, /withPreparedPrimary/);
  assert.match(wrapper, /runAriVNextCore\(\{/);
  assert.match(wrapper, /independentCorePasses: true/);
  assert.match(wrapper, /sharedPrimaryUsed/);
  assert.match(wrapper, /ari_vnext_phase9c_compound_action_proposal/);
  assert.match(wrapper, /if \(clauses\.length < 2\) return await runAriVNextCore\(turn\)/);
  assert.doesNotMatch(wrapper, /AriVNextActionAdapter|AriVNextOperationRegistry|CalBuddy\.executeAction|supabase|\.rpc\(/i);
});
