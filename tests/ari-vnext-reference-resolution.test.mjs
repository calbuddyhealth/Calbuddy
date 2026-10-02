import test from "node:test";
import assert from "node:assert/strict";

import { buildCurrentTurn } from "../api/_lib/ari-vnext/current-turn.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";

function routed(message, history = []) {
  return routeContext(buildCurrentTurn({ message, history }, "user-1"));
}

test("discourse markers such as well preserve recent conversational context", () => {
  const route = routed("Well the whole hugging situation could have been monitored better", [
    { role: "user", content: "AI experiments can keep guardrails while testing broader behavior." },
    { role: "assistant", content: "Good stopping rules and monitoring matter when experiments test system behavior." }
  ]);

  assert.equal(route.followUp, true);
  assert.equal(route.memory, true);
});

test("ambiguous public incident references enable selective web recovery", () => {
  const route = routed("Well the whole hugging situation could have been monitored better", [
    { role: "user", content: "We can experiment with AI guardrails instead of removing them." },
    { role: "assistant", content: "AI safety experiments need monitoring and explicit stopping rules." }
  ]);

  assert.equal(route.currentInfo, false);
  assert.equal(route.referenceResolutionSearch, true);
  assert.equal(route.webSearchRequired, true);
});

test("reference recovery also handles compact public elliptical phrases", () => {
  const route = routed("That experiment went on too long", [
    { role: "user", content: "I was talking about an AI safety lab and a public behavioral experiment." },
    { role: "assistant", content: "Monitoring and stopping rules determine whether the experiment remains acceptable." }
  ]);

  assert.equal(route.followUp, true);
  assert.equal(route.referenceResolutionSearch, true);
  assert.equal(route.webSearchRequired, true);
});

test("private interpersonal references never trigger web reference recovery", () => {
  const route = routed("Well the whole situation with my wife could have been handled better", [
    { role: "user", content: "We were talking about a difficult situation in my relationship." },
    { role: "assistant", content: "You can think through what happened without assuming motives." }
  ]);

  assert.equal(route.followUp, true);
  assert.equal(route.referenceResolutionSearch, false);
  assert.equal(route.webSearchRequired, false);
});

test("private clinical references never trigger web reference recovery", () => {
  const route = routed("That case was unusual", [
    { role: "user", content: "My patient had an unusual presentation at work." },
    { role: "assistant", content: "We should keep the discussion de-identified and clinically focused." }
  ]);

  assert.equal(route.referenceResolutionSearch, false);
  assert.equal(route.webSearchRequired, false);
});

test("ambiguous references without conversational context do not spend a web search", () => {
  const route = routed("That experiment went on too long");
  assert.equal(route.referenceResolutionSearch, false);
  assert.equal(route.webSearchRequired, false);
});
