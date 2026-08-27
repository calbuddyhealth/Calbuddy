import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import {
  activeReferenceDomains,
  buildReferencePacket,
  REFERENCE_CONTEXT_VERSION
} from "../api/_lib/ari-vnext/reference-context.js";
import {
  buildRelevantContext,
  contextToText,
  routeContext
} from "../api/_lib/ari-vnext/context-router.js";
import { reviewDeterministicRoutineLogIntent } from "../api/_lib/ari-vnext/action-intent-verifier.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

function persistedMealReference() {
  return {
    referenceId: "ref_action_meal123",
    actionName: "log_meal",
    domain: "nutrition",
    entityType: "meal",
    label: "5 small red potatoes",
    state: "persisted",
    sourceTurnId: "turn-potatoes",
    canonical: {
      id: "meal-uuid-123",
      mutationId: "mutation-uuid-123",
      nutritionDate: "2026-08-27"
    },
    details: {
      calories: 300,
      quantity: 5,
      mealCategory: "Meal"
    },
    verification: {
      verifiedByTrustedExecutor: true,
      executorSuccess: true
    },
    updatedAt: new Date().toISOString()
  };
}

test("persisted app reference routes a bare follow-up back to its canonical domain", () => {
  const turn = {
    message: "Delete that.",
    history: [],
    context: {
      referenceState: {
        version: "1.1.0",
        references: [persistedMealReference()]
      }
    }
  };

  const route = routeContext(turn);
  assert.equal(route.followUp, true);
  assert.equal(route.nutrition, true);
  assert.equal(route.training, false);
  assert.deepEqual(activeReferenceDomains(turn.context.referenceState), ["nutrition"]);

  const packet = buildReferencePacket(turn, route);
  assert.equal(packet?.version, REFERENCE_CONTEXT_VERSION);
  assert.equal(packet?.candidates?.[0]?.kind, "app_reference");
  assert.equal(packet?.candidates?.[0]?.authoritative, true);
  assert.equal(packet?.candidates?.[0]?.canonical?.id, "meal-uuid-123");
  assert.equal(packet?.candidates?.[0]?.canonical?.mutationId, "mutation-uuid-123");
});

test("canonical app reference is preferred ahead of conversational candidates", () => {
  const turn = {
    message: "Change that.",
    history: [
      { role: "user", content: "I was also talking about a chicken bowl." },
      { role: "assistant", content: "The chicken bowl could be around 500 calories." }
    ],
    context: {
      referenceState: { references: [persistedMealReference()] }
    }
  };

  const route = routeContext(turn);
  const packet = buildReferencePacket(turn, route);
  assert.equal(packet?.candidates?.[0]?.kind, "app_reference");
  assert.equal(packet?.candidates?.[0]?.label, "5 small red potatoes");
  assert.ok(packet?.candidates?.some((candidate) => candidate.kind === "conversation_turn"));

  const relevant = buildRelevantContext(turn, route);
  const prompt = contextToText(relevant);
  assert.match(prompt, /verified persisted app_reference/i);
  assert.match(prompt, /CURRENT user message alone determines whether a mutation is authorized/i);
});

test("persisted reference identifies target but never authorizes a meal mutation by itself", () => {
  const turn = {
    message: "That was good.",
    history: [],
    context: {
      referenceState: { references: [persistedMealReference()] }
    }
  };
  const route = routeContext(turn);
  const review = reviewDeterministicRoutineLogIntent({
    turn,
    route,
    functionCall: { name: "propose_log_meal" },
    availableTools: ["propose_log_meal"]
  });

  assert.equal(route.nutrition, true);
  assert.equal(review, null);
  assert.equal(buildReferencePacket(turn, route)?.policy?.appReferencesNeverGrantWritePermission, true);
});

test("reference lifecycle stays bounded when app pointers and conversation are both dense", () => {
  const references = Array.from({ length: 20 }, (_, index) => ({
    ...persistedMealReference(),
    referenceId: `ref_action_${index}`,
    label: `Meal ${index}`,
    canonical: { id: `meal-${index}` },
    updatedAt: new Date(Date.now() - index * 1000).toISOString()
  }));
  const history = Array.from({ length: 16 }, (_, index) => ({
    role: index % 2 ? "assistant" : "user",
    content: `${index} ${"meal workout goal context ".repeat(80)}`
  }));
  const turn = {
    message: "Use that.",
    history,
    context: { referenceState: { references } }
  };
  const packet = buildReferencePacket(turn, routeContext(turn));

  assert.equal(packet?.active, true);
  assert.ok(JSON.stringify(packet).length <= 6200);
  assert.ok(packet?.candidates?.filter((candidate) => candidate.kind === "app_reference").length <= 8);
});

test("browser lifecycle is session-scoped and wraps trusted proposal plus execution boundaries", () => {
  const source = read("ari/vnext/ari-vnext-reference-state.js");
  new vm.Script(source, { filename: "ari-vnext-reference-state.js" });

  assert.match(source, /sessionStorage\.getItem/);
  assert.match(source, /sessionStorage\.setItem/);
  assert.doesNotMatch(source, /localStorage\.setItem\([^)]*reference/i);
  assert.match(source, /adapter\.createCalBuddyPendingAction = async function referenceAwareCreate/);
  assert.match(source, /adapter\.executeConfirmed = async function referenceAwareExecute/);
  assert.match(source, /verifiedByTrustedExecutor: true/);
  assert.match(source, /bridge\.buildContext = async function referenceAwareContext/);
  assert.match(source, /referenceState/);
});

test("runtime does not report vNext ready until reference lifecycle is installed", () => {
  const runtime = read("ari/runtime/ari-runtime-controller.js");
  assert.match(runtime, /ari-vnext-reference-state\.js\?v=1\.1\.0/);
  assert.match(runtime, /AriVNextReferenceState\?\.ready === true/);
  assert.match(runtime, /const VERSION = "1\.4\.0"/);
});
