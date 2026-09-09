import test from "node:test";
import assert from "node:assert/strict";
import { guardUnpreparedActionReply, actionReplyRequiresProposal } from "../api/_lib/ari-vnext/action-response.js";
import { runAriVNext } from "../api/_lib/ari-vnext/orchestrator.js";

test("a reply cannot substitute for an actual action proposal or save result", () => {
  for (const reply of [
    "I've logged your banana.",
    "Logged Banana — 105 calories.",
    "Saved your meal.",
    "Done — I saved that meal for you.",
    "I recorded your weight.",
    "Your meal has been logged.",
    "I’m ready to log the banana.",
    "I'll log that for you.",
    "Ready to log **a banana**. Confirm to save it.",
    "Please confirm the estimate to proceed."
  ]) {
    assert.equal(actionReplyRequiresProposal(reply), true, reply);
    const result = guardUnpreparedActionReply(reply);
    assert.equal(result.actionPreparation.code, "missing_action_proposal");
    assert.match(result.reply, /haven't saved/);
  }
});

test("ordinary nutrition, clarification, and honest failure replies pass through", () => {
  for (const reply of [
    "A medium banana is about 105 calories.",
    "How many bananas should I log?",
    "I haven't logged anything yet.",
    "I can't save that without a serving size.",
    "Your log shows two meals today.",
    "If I logged two bananas, that would be about 210 calories.",
    "You logged your lunch earlier.",
    "I logged into the app.",
    "I'm not ready to log without a serving size.",
    "I created a poem about a banana.",
    "I'll add a paragraph to the draft."
  ]) {
    assert.equal(actionReplyRequiresProposal(reply), false, reply);
    assert.equal(guardUnpreparedActionReply(reply).reply, reply);
  }
});

const bananaCall = {
  type: "function_call", name: "propose_log_meal", call_id: "test-call",
  arguments: JSON.stringify({ name: "Banana", quantity: 1, unit: "banana", servingSize: "1 medium", mealCategory: "Snack", calories: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4, notes: "Estimated nutrition." })
};
const textResponse = (text) => ({ output: [{ type: "message", content: [{ type: "output_text", text }] }] });

function mockProvider(t, responses) {
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only-no-network";
  t.after(() => {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  });
  const requests = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    requests.push(JSON.parse(options.body));
    assert.ok(responses.length, "Repair must be bounded");
    const response = responses.shift();
    return { ok: !response.failed, status: response.failed ? 503 : 200, json: async () => response };
  });
  return requests;
}

test("a cancelled meal is followed by a new proposal even if the model initially only promises to log", async (t) => {
  const requests = mockProvider(t, [
    textResponse("I'll log your banana."),
    { failed: true },
    { output: [bananaCall] }
  ]);
  const cancelled = await runAriVNext({
    turnId: "cancel-turn", message: "cancel it", history: [], context: {},
    pendingAction: { id: "old-meal", name: "log_meal", sourceTurnId: "old-turn", arguments: {} }
  });
  assert.equal(cancelled.action.type, "cancel_pending_action");
  assert.equal(requests.length, 0);
  const result = await runAriVNext({
    turnId: "new-meal-turn", message: "Log a banana", context: {}, pendingAction: null,
    history: [{ role: "user", content: "Cancel the earlier meal" }, { role: "assistant", content: cancelled.reply }]
  });
  assert.equal(result.pendingAction.name, "log_meal");
  assert.equal(result.pendingAction.arguments.name, "Banana");
  assert.equal(result.pendingAction.sourceTurnId, "new-meal-turn");
  assert.notEqual(result.pendingAction.id, "old-meal");
  assert.match(result.reply, /confirm to save/i);
  assert.equal(requests.length, 3);
});

test("continued phantom success is rejected after one repair attempt", async (t) => {
  const requests = mockProvider(t, [
    textResponse("I've logged your banana."), { failed: true },
    textResponse("Your meal has been logged.")
  ]);
  const result = await runAriVNext({ turnId: "no-proposal", message: "Log a banana", history: [], context: {} });
  assert.equal(result.pendingAction, null);
  assert.equal(result.action, null);
  assert.equal(result.actionPreparation.code, "missing_action_proposal");
  assert.match(result.reply, /haven't saved/);
  assert.equal(requests.length, 3);
});

test("an unavailable repair also reports an honest failure", async (t) => {
  mockProvider(t, [textResponse("I'll log your banana."), { failed: true }, { failed: true }]);
  const result = await runAriVNext({ turnId: "repair-failed", message: "Log a banana", history: [], context: {} });
  assert.equal(result.pendingAction, null);
  assert.equal(result.actionPreparation.code, "missing_action_proposal");
});

test("a valid meal proposal keeps the existing one-call fast path", async (t) => {
  const requests = mockProvider(t, [{ output: [bananaCall] }]);
  const result = await runAriVNext({ turnId: "valid-proposal", message: "Log a banana", history: [], context: {} });
  assert.equal(result.pendingAction.arguments.name, "Banana");
  assert.equal(requests.length, 1);
});
