import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildMemoryActionModelNote,
  buildVerifiedMemoryReply,
  isMemoryRecallRequest,
  prepareExplicitMemoryAction
} from "../api/_lib/ari-vnext/memory-action.js";
import { buildRelevantContext, contextToText } from "../api/_lib/ari-vnext/context-router.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("recall questions never become memory writes", () => {
  for (const message of [
    "Do you remember it?",
    "Do you remember the Jesus story?",
    "What do you remember about our Jesus story?",
    "Remember when we made that story?"
  ]) {
    assert.equal(isMemoryRecallRequest(message), true);
    const action = prepareExplicitMemoryAction(message);
    assert.equal(action.requested, false);
    assert.equal(action.requestedCount, 0);
    assert.equal(action.status, "recall_not_write");
  }
});

test("explicit multiline remember request becomes separate verified memory facts", () => {
  const action = prepareExplicitMemoryAction(`Please remember:\n- You're a psych nurse and Navy officer.\n- You're married to Emily.\n- Your baby is expected November 15, 2026.\n- You're resigning from the Navy November 30, 2026.`);

  assert.equal(action.requested, true);
  assert.equal(action.memoryOnly, true);
  assert.equal(action.requestedCount, 4);
  assert.deepEqual(action.facts, [
    "You're a psych nurse and Navy officer",
    "You're married to Emily",
    "Your baby is expected November 15, 2026",
    "You're resigning from the Navy November 30, 2026"
  ]);
});

test("mixed memory plus follow-up does not save the follow-up request as a fact", () => {
  const action = prepareExplicitMemoryAction(
    "Remember that I prefer evening workouts; and tell me what I should train tomorrow."
  );

  assert.equal(action.requested, true);
  assert.equal(action.memoryOnly, false);
  assert.deepEqual(action.facts, ["I prefer evening workouts"]);
});

test("question after a memory statement stays out of the saved fact", () => {
  const action = prepareExplicitMemoryAction(
    "Remember that I prefer evening workouts. What should I train tomorrow?"
  );

  assert.equal(action.requested, true);
  assert.equal(action.memoryOnly, false);
  assert.deepEqual(action.facts, ["I prefer evening workouts"]);
});

test("referential remember resolves only the immediately available user statement", () => {
  const action = prepareExplicitMemoryAction("I want you to remember that", {
    history: [
      { role: "assistant", content: "You are a cardiologist in Los Angeles." },
      { role: "user", content: "I'm a psych nurse at NMCSD and an active-duty O-3." },
      { role: "assistant", content: "Understood." }
    ]
  });

  assert.equal(action.requested, true);
  assert.equal(action.status, "pending");
  assert.equal(action.requestedCount, 1);
  assert.deepEqual(action.facts, ["I'm a psych nurse at NMCSD and an active-duty O-3"]);
  assert.doesNotMatch(action.facts.join(" "), /cardiologist|Los Angeles/i);
});

test("standalone referential token is never stored as a fake memory", () => {
  const action = prepareExplicitMemoryAction("Remember it", { history: [] });

  assert.equal(action.requested, true);
  assert.equal(action.requestedCount, 0);
  assert.equal(action.status, "no_facts");
  assert.deepEqual(action.facts, []);
});

test("memory capability and retrieved memory are always model-facing", () => {
  const context = buildRelevantContext({
    surface: "home",
    memory: "User memory: Jose works as a psychiatric nurse at NMCSD.",
    context: {
      memoryCapability: {
        persistentUserMemory: true,
        explicitRememberSupported: true,
        requestDetected: false,
        status: "not_requested",
        requestedCount: 0,
        storedCount: 0,
        failedCount: 0
      },
      userWorldModel: {
        sourceSummary: {
          curiosityState: { questions: Array.from({ length: 500 }, (_, i) => `question-${i}`) },
          autonomyRuntime: { recent: Array.from({ length: 500 }, (_, i) => `trace-${i}`) }
        }
      }
    }
  }, { casualConversation: false });

  assert.equal(context.memoryCapability.persistentUserMemory, true);
  assert.match(context.relevantMemory, /psychiatric nurse at NMCSD/);
});

test("large world model cannot truncate protected relevant memory", () => {
  const hugeTrace = "VERY_LARGE_AUTONOMY_TRACE ".repeat(2000);
  const text = contextToText({
    relevantMemory: "User memory: Jose works as a psychiatric nurse at NMCSD.",
    memoryCapability: {
      persistentUserMemory: true,
      explicitRememberSupported: true
    },
    userWorldModel: {
      identity: { displayName: "Jose" },
      sourceSummary: {
        durableMemoryLines: 24,
        curiosityState: { questions: [hugeTrace] },
        autonomyRuntime: { recent: [hugeTrace] }
      }
    }
  });

  assert.match(text, /psychiatric nurse at NMCSD/);
  assert.match(text, /persistentUserMemory/);
  assert.match(text, /PROTECTED CONTINUITY CONTEXT/);
  assert.ok(text.length <= 24000);
  assert.doesNotMatch(text, /VERY_LARGE_AUTONOMY_TRACE/);
});

test("verified acknowledgement reports actual save result and never denies memory capability", () => {
  const stored = buildVerifiedMemoryReply({
    requested: true,
    requestedCount: 3,
    storedCount: 3,
    failedCount: 0,
    status: "stored"
  });
  assert.equal(stored, "Got it — I saved 3 details to your persistent memory.");

  const failed = buildVerifiedMemoryReply({
    requested: true,
    requestedCount: 1,
    storedCount: 0,
    failedCount: 1,
    status: "failed"
  });
  assert.match(failed, /I have persistent memory/i);
  assert.doesNotMatch(failed, /don['’]?t have persistent memory|no persistent memory|memory-save control unavailable/i);
});

test("model note explicitly grounds Ari in verified memory capability and outcome", () => {
  const note = buildMemoryActionModelNote({
    requested: true,
    requestedCount: 2,
    storedCount: 2,
    failedCount: 0,
    status: "stored"
  });

  assert.match(note, /Persistent user memory is available/);
  assert.match(note, /Verified save status: stored/);
  assert.match(note, /Do not claim that persistent memory or a memory-save capability is unavailable/);
});

test("vNext verifies explicit memory before model generation and skips duplicate post-save", async () => {
  const source = await read("api/ari-vnext.js");
  const preflightIndex = source.indexOf("executeExplicitMemoryAction({");
  const modelIndex = source.indexOf("await runAriVNext(turn)");

  assert.ok(preflightIndex > 0);
  assert.ok(modelIndex > preflightIndex);
  assert.match(source, /explicitMemoryAction\.memoryOnly/);
  assert.match(source, /buildVerifiedMemoryReply\(explicitMemoryAction\)/);
  assert.match(source, /verified_memory_action_preflight/);
  assert.match(source, /persistentUserMemory: true/);
  assert.match(source, /memoryAction: explicitMemoryAction\.requested/);
});

test("Home renders minimal rich text safely without raw HTML injection", async () => {
  const source = await read("js/home.js");

  assert.match(source, /renderSafeAriMessageText\(body, text\)/);
  assert.match(source, /document\.createElement\("strong"\)/);
  assert.match(source, /document\.createTextNode/);
  assert.match(source, /document\.createElement\("br"\)/);
  assert.doesNotMatch(source, /body\.textContent = text/);
  assert.doesNotMatch(source, /innerHTML\s*=\s*text/);
});
