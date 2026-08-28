import assert from "node:assert/strict";
import test from "node:test";

import {
  COMPOUND_ACTION_VERSION,
  MAX_COMPOUND_ACTIONS,
  splitCompoundActionClauses
} from "../api/_lib/ari-vnext/compound-actions.js";

test("Phase 9C parser is explicitly bounded", () => {
  assert.equal(COMPOUND_ACTION_VERSION, "1.0.0");
  assert.equal(MAX_COMPOUND_ACTIONS, 4);
});

test("Phase 9C splits explicit then-separated mutations", () => {
  assert.deepEqual(
    splitCompoundActionClauses("Change that workout to 4 bench sets, then move squats before leg press", 2),
    ["Change that workout to 4 bench sets", "move squats before leg press"]
  );
});

test("Phase 9C preserves ordinary noun conjunctions while finding a later action verb", () => {
  assert.deepEqual(
    splitCompoundActionClauses("Change the chicken and rice bowl to 650 calories and remove the sauce", 2),
    ["Change the chicken and rice bowl to 650 calories", "remove the sauce"]
  );
});

test("Phase 9C can split semicolon-separated mutation clauses", () => {
  assert.deepEqual(
    splitCompoundActionClauses("Update lunch to 650 calories; delete yesterday's weigh-in", 2),
    ["Update lunch to 650 calories", "delete yesterday's weigh-in"]
  );
});

test("Phase 9C leaves a single ordinary request as one clause", () => {
  assert.deepEqual(
    splitCompoundActionClauses("Change the chicken and rice bowl to 650 calories", 2),
    ["Change the chicken and rice bowl to 650 calories"]
  );
});
