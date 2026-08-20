import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveAccountEntitlements,
  accountEntitlementsToInstruction
} from "../api/_lib/ari-vnext/account-entitlements.js";

const NOW = new Date("2026-08-20T18:45:00.000Z");

test("missing account state is unknown rather than a confident access denial", () => {
  const state = deriveAccountEntitlements(null, NOW);
  assert.equal(state.authorizationKnown, false);
  assert.equal(state.appAllowed, null);
  assert.equal(state.circleAllowed, null);
  assert.equal(state.teenMode, false);
});

test("verified inactive account remains a real denial", () => {
  const state = deriveAccountEntitlements({
    status: "paused",
    date_of_birth: "1990-05-01"
  }, NOW);
  assert.equal(state.authorizationKnown, true);
  assert.equal(state.appAllowed, false);
  assert.equal(state.circleAllowed, false);
});

test("Ari is told not to turn unavailable entitlement state into a denial", () => {
  const instruction = accountEntitlementsToInstruction(
    deriveAccountEntitlements(null, NOW)
  );
  assert.match(instruction, /could not be verified/i);
  assert.match(instruction, /unknown/i);
  assert.match(instruction, /not as denied/i);
  assert.match(instruction, /hard capability boundary/i);
});
