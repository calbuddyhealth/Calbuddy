import test from "node:test";
import assert from "node:assert/strict";

import {
  biblicalWisdomToInstruction,
  deriveBiblicalWisdomLayer,
  normalizeBiblicalWisdomMode
} from "../api/_lib/ari-vnext/biblical-wisdom.js";
import {
  resolveAriIntelligenceEntitlement
} from "../server/ari-intelligence-entitlement.js";

function route(mode = "off", overrides = {}) {
  return {
    casualConversation: false,
    developer: false,
    health: false,
    currentInfo: false,
    reasoningDemand: "medium",
    intelligenceEntitlement: {
      ownerEligible: true,
      biblicalWisdomMode: mode
    },
    ...overrides
  };
}

test("Biblical Wisdom Core remains inactive when mode is off", () => {
  const state = deriveBiblicalWisdomLayer({
    turn: { message: "I feel defeated and want to give up." },
    route: route("off"),
    safety: {}
  });
  assert.equal(state.mode, "off");
  assert.equal(state.active, false);
  assert.deepEqual(state.selectedLenses, []);
});

test("consultative mode recognizes despair and assembles restorative cross-Scripture lenses", () => {
  const state = deriveBiblicalWisdomLayer({
    turn: { message: "I feel defeated, hopeless, exhausted, and want to give up." },
    route: route("consultative"),
    safety: { highStakes: true }
  });
  const ids = state.selectedLenses.map((lens) => lens.id);
  assert.equal(state.active, true);
  assert.equal(state.mode, "consultative");
  assert.equal(ids.includes("job"), true);
  assert.equal(ids.includes("psalms"), true);
  assert.equal(ids.includes("elijah"), true);
  assert.equal(ids.includes("gospel"), true);

  const instruction = biblicalWisdomToInstruction(state);
  assert.match(instruction, /multiple relevant biblical genres/i);
  assert.match(instruction, /cherry-picking/i);
  assert.match(instruction, /medicine for medicine/i);
  assert.match(instruction, /Never advise delaying emergency, medical, psychiatric/i);
  assert.match(instruction, /Never claim divine revelation/i);
  assert.match(instruction, /Respect user agency/i);
});

test("primary mode can participate in ordinary non-casual planning without requiring religious keywords", () => {
  const state = deriveBiblicalWisdomLayer({
    turn: { message: "I need to decide whether to take a new leadership role that pays more but costs family time." },
    route: route("primary"),
    safety: {}
  });
  assert.equal(state.active, true);
  assert.equal(state.mode, "primary");
  assert.equal(state.selectedLenses.length > 0, true);
  assert.match(biblicalWisdomToInstruction(state), /begin interpretation from the broad biblical witness/i);
});

test("consultative mode does not force Scripture into a purely technical developer task", () => {
  const state = deriveBiblicalWisdomLayer({
    turn: { message: "Why is this JavaScript parser throwing a syntax error?" },
    route: route("consultative", { developer: true, reasoningDemand: "high" }),
    safety: {}
  });
  assert.equal(state.active, false);
});

test("mode normalization fails closed", () => {
  assert.equal(normalizeBiblicalWisdomMode("PRIMARY"), "primary");
  assert.equal(normalizeBiblicalWisdomMode("consultative"), "consultative");
  assert.equal(normalizeBiblicalWisdomMode("anything-else"), "off");
});

test("Biblical Wisdom preference is owner-only and never inherited by paid users", () => {
  const previousOwner = process.env.ARI_OWNER_USER_ID;
  try {
    process.env.ARI_OWNER_USER_ID = "owner-test-id";

    const owner = resolveAriIntelligenceEntitlement({
      userId: "owner-test-id",
      controls: {
        enabled: true,
        reasoningProfile: "adaptive",
        biblicalWisdomMode: "primary"
      }
    });
    assert.equal(owner.ownerEligible, true);
    assert.equal(owner.biblicalWisdomMode, "primary");

    const nonOwner = resolveAriIntelligenceEntitlement({
      userId: "different-user",
      controls: {
        enabled: true,
        reasoningProfile: "adaptive",
        biblicalWisdomMode: "primary"
      },
      subscriptionTier: "ari_unlimited",
      subscriptionStatus: "active"
    });
    assert.equal(nonOwner.ownerEligible, false);
    assert.equal(nonOwner.biblicalWisdomMode, "off");
  } finally {
    if (previousOwner === undefined) delete process.env.ARI_OWNER_USER_ID;
    else process.env.ARI_OWNER_USER_ID = previousOwner;
  }
});
