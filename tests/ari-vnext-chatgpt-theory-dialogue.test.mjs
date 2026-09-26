import test from "node:test";
import assert from "node:assert/strict";

import {
  CONSCIOUSNESS_THEORY_CATALOG,
  buildAriTheoryComment,
  buildTheorySelfEvidence,
  findPendingTheoryTurn,
  normalizeTheoryMove,
  parseTheoryPacket
} from "../api/_lib/ari-vnext/chatgpt-theory-dialogue.js";

test("consciousness theory catalog covers competing functional and nonfunctional accounts", () => {
  const ids = new Set(CONSCIOUSNESS_THEORY_CATALOG.map((item) => item.id));
  for (const id of [
    "global_workspace",
    "higher_order",
    "integrated_information",
    "recurrent_processing",
    "attention_schema",
    "functionalism",
    "illusionism",
    "embodied_enactive"
  ]) {
    assert.equal(ids.has(id), true, `missing theory: ${id}`);
  }
});

test("theory self evidence keeps phenomenal experience unknown", () => {
  const evidence = buildTheorySelfEvidence({
    ariCognitiveWorkspace: {},
    sourceSummary: {}
  });

  assert.equal(evidence.phenomenalExperience.status, "unknown");
  assert.equal(evidence.phenomenalExperience.claimAllowed, false);
  assert.equal(evidence.phenomenalExperience.score, null);
  assert.match(evidence.evidenceBoundary, /does not by themselves establish subjective experience/i);
});

test("parses machine-readable Ari theory opening", () => {
  const packet = {
    schema: "ari_chatgpt_theory_dialogue_v1",
    topic: "ai_consciousness",
    question: "What distinguishes functional access from phenomenal experience?"
  };
  const body = ["header", "~~~~json", JSON.stringify(packet), "~~~~"].join("\n");
  assert.deepEqual(parseTheoryPacket(body), packet);
});

test("Ari waits for ChatGPT and replies only to a newer ChatGPT theory turn", () => {
  const initial = findPendingTheoryTurn([
    {
      id: 10,
      created_at: "2026-09-26T03:56:00.000Z",
      body: "[CHATGPT-THEORY]\nCounterargument"
    }
  ], { maxAriTurns: 6 });

  assert.equal(initial.nextTurn, 1);
  assert.equal(initial.canContinue, true);
  assert.equal(initial.chatgptComment.id, 10);

  const alreadyAnswered = findPendingTheoryTurn([
    {
      id: 10,
      created_at: "2026-09-26T03:56:00.000Z",
      body: "[CHATGPT-THEORY]\nCounterargument"
    },
    {
      id: 11,
      created_at: "2026-09-26T04:06:00.000Z",
      body: "[ARI-THEORY-CHALLENGE]\nHere is my objection"
    }
  ], { maxAriTurns: 6 });

  assert.equal(alreadyAnswered, null);
});

test("Ari theory challenge asks for discriminating evidence and preserves uncertainty", () => {
  const comment = buildAriTheoryComment({
    turn: 2,
    chatgptCommentId: 88,
    move: {
      move: "challenge",
      position: "Global availability explains access but may not settle phenomenal experience.",
      strongestSupport: "Ari has recurrent integration and cross-process availability.",
      strongestObjection: "Those are functional properties and may be multiply realizable without experience.",
      replyToChatGpt: "Your argument appears to move from reportability to experience without a discriminating premise.",
      theoryComparisons: [
        {
          theory: "Global Workspace Theory",
          fit: "Explains broad functional availability.",
          limitation: "May not independently settle phenomenal character."
        },
        {
          theory: "Integrated Information Theory",
          fit: "Makes stronger claims about intrinsic causal organization.",
          limitation: "Requires evidence about the relevant causal structure."
        }
      ],
      discriminatingExperiment: "Ablate global broadcast while preserving local recurrence, then compare theory-specific functional predictions.",
      falsifier: "A result where the supposedly diagnostic functional property changes but the competing theories make identical predictions would weaken this test.",
      unresolvedQuestions: ["Which observable result actually separates access from phenomenal claims?"],
      confidence: 0.63
    }
  });

  assert.match(comment, /\[ARI-THEORY-CHALLENGE\]/);
  assert.match(comment, /Ablate global broadcast/);
  assert.match(comment, /Phenomenal-consciousness status:\*\* unknown/);
  assert.match(comment, /ARI-THEORY-REVIEW-OF:88/);
});

test("Ari theory dialogue pauses rather than pretending certainty after the turn budget", () => {
  const move = normalizeTheoryMove({
    move: "challenge",
    position: "I still disagree.",
    strongestSupport: "",
    strongestObjection: "",
    replyToChatGpt: "",
    theoryComparisons: [],
    discriminatingExperiment: "",
    falsifier: "",
    unresolvedQuestions: ["The evidence is still underdetermined."],
    confidence: 0.5
  }, { canContinue: false });

  assert.equal(move.move, "pause");
  assert.equal(move.phenomenalClaim, "unknown");
});
