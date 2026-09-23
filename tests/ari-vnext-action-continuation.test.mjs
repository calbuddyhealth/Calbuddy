import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  deriveAuthorizedActionContinuation,
  actionContinuationToInstruction
} from "../api/_lib/ari-vnext/action-continuation.js";

function turn(message, history = []) {
  return { message, history };
}

test("direct detail can continue the immediately preceding explicitly authorized meal log", () => {
  const state = deriveAuthorizedActionContinuation(turn(
    "I had a slice of pepperoni pizza",
    [
      { role: "user", content: "I had a slice of pizza. Log that." },
      { role: "assistant", content: "I need a clearer food or serving description before I can estimate it." }
    ]
  ));

  assert.equal(state.active, true);
  assert.equal(state.reason, "immediate_authorized_clarification");
  assert.match(actionContinuationToInstruction(state), /exact previously authorized action/i);
});

test("short entity-only detail can continue an immediately authorized clarification", () => {
  const state = deriveAuthorizedActionContinuation(turn(
    "Pepperoni, one slice",
    [
      { role: "user", content: "Log the pizza I ate." },
      { role: "assistant", content: "What kind of pizza and how many slices?" }
    ]
  ));
  assert.equal(state.active, true);
});

test("workout date clarification can continue the same authorized create request", () => {
  const state = deriveAuthorizedActionContinuation(turn(
    "Tomorrow",
    [
      { role: "user", content: "Create a leg workout for me." },
      { role: "assistant", content: "What day do you want the leg workout for?" }
    ]
  ));
  assert.equal(state.active, true);
});

test("standalone eating statement never inherits mutation permission", () => {
  const state = deriveAuthorizedActionContinuation(turn(
    "I had a slice of pepperoni pizza",
    []
  ));
  assert.equal(state.active, false);
});

test("an unrelated prior statement cannot authorize a write", () => {
  const state = deriveAuthorizedActionContinuation(turn(
    "Pepperoni, one slice",
    [
      { role: "user", content: "I ate pizza." },
      { role: "assistant", content: "What kind was it?" }
    ]
  ));
  assert.equal(state.active, false);
  assert.equal(state.reason, "previous_user_did_not_authorize_mutation");
});

test("unrelated conversation after a completed action does not inherit permission", () => {
  const state = deriveAuthorizedActionContinuation(turn(
    "Pepperoni pizza is my favorite",
    [
      { role: "user", content: "Log my pizza." },
      { role: "assistant", content: "Saved. Your pizza was logged." }
    ]
  ));
  assert.equal(state.active, false);
});

test("a fresh explicit mutation is authorized by its own current turn, not continuation", () => {
  const state = deriveAuthorizedActionContinuation(turn(
    "Log two slices instead",
    [
      { role: "user", content: "Log a slice of pizza." },
      { role: "assistant", content: "What kind of pizza?" }
    ]
  ));
  assert.equal(state.active, false);
  assert.equal(state.reason, "current_turn_has_own_authorization");
});

test("orchestrator and verifier both consume the canonical bounded-continuation module", () => {
  const orchestrator = fs.readFileSync("api/_lib/ari-vnext/orchestrator.js", "utf8");
  const verifier = fs.readFileSync("api/_lib/ari-vnext/action-intent-verifier.js", "utf8");

  assert.match(orchestrator, /deriveAuthorizedActionContinuation/);
  assert.match(orchestrator, /actionContinuation\?\.active === true/);
  assert.match(verifier, /deriveAuthorizedActionContinuation/);
  assert.match(verifier, /continuation\.authorizedUserMessage/);
  assert.match(verifier, /immediately preceding user already authorized one mutation/i);
});
