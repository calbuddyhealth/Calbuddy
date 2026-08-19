import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPeerReflectionPacket,
  buildReflectionMemory,
  parsePeerReflection,
  sanitizeForPeer,
  shouldPeerReflect
} from "../api/_lib/ari-vnext/peer-reflection.js";

test("routine greeting does not spend a peer reflection", () => {
  assert.equal(shouldPeerReflect({
    message: "Hey",
    result: {
      reply: "Hey. What's up?",
      route: {},
      safety: { highStakes: false },
      selfModel: { current: { mode: "natural_conversation" } }
    }
  }), false);
});

test("high-stakes interactions never enter the peer loop", () => {
  assert.equal(shouldPeerReflect({
    message: "I have severe chest pain. What should I do?",
    result: {
      reply: "Seek urgent medical help.",
      route: { health: true },
      safety: { highStakes: true },
      selfModel: { current: { mode: "protective_clarity" } }
    }
  }), false);
});

test("meaningful longitudinal coaching can trigger reflection", () => {
  assert.equal(shouldPeerReflect({
    message: "Should I change my program based on the last month?",
    result: {
      reply: "Stay the course for now.",
      route: { training: true, goals: true },
      safety: { highStakes: false },
      selfModel: { current: { mode: "coach" } },
      longitudinalState: {
        signals: [{ id: "broad_progression_present", confidence: "medium" }],
        programDecision: { stance: "preserve_working_plan" }
      }
    }
  }), true);
});

test("peer packet strips obvious direct identifiers and secrets", () => {
  const packet = buildPeerReflectionPacket({
    message: "Email me at test@example.com and my phone is 619-555-1212; token sk-abcdefghijklmnopqrstuv",
    result: {
      reply: "I won't expose your information.",
      route: { memory: true },
      safety: { highStakes: false },
      selfModel: { current: { mode: "identity_expression", familiarity: "familiar" } },
      metacognition: { confidence: "grounded", missingEvidence: [] }
    }
  });

  assert.doesNotMatch(packet, /test@example\.com/i);
  assert.doesNotMatch(packet, /619-555-1212/);
  assert.doesNotMatch(packet, /sk-abcdefghijklmnopqrstuv/);
  assert.match(packet, /\[email\]/);
  assert.match(packet, /\[phone\]/);
  assert.match(packet, /\[secret\]/);
});

test("peer output becomes a low-priority reflective memory, not core identity", () => {
  const parsed = parsePeerReflection("TAKEAWAY: Ari over-weighted one week of data.\nQUESTION: Has the pattern persisted for three weeks?");
  const memory = buildReflectionMemory({
    parsed,
    result: { route: { training: true } }
  });

  assert.equal(parsed.takeaway, "Ari over-weighted one week of data.");
  assert.equal(memory.memoryType, "peer_reflection");
  assert.equal(memory.importance, 4);
  assert.ok(memory.confidence < 0.8);
  assert.match(memory.content, /three weeks/i);
});

test("peer saying none does not create a durable reflection", () => {
  const parsed = parsePeerReflection("TAKEAWAY: none\nQUESTION: none");
  assert.equal(parsed.takeaway, null);
  assert.equal(parsed.question, null);
  assert.equal(buildReflectionMemory({ parsed, result: {} }), null);
});

test("standalone sanitizer handles direct identifiers", () => {
  const sanitized = sanitizeForPeer("Call 8585555555 or mail me@example.com");
  assert.match(sanitized, /\[phone\]/);
  assert.match(sanitized, /\[email\]/);
});
