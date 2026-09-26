import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAriDialogueComment,
  extractHandoffPacket,
  extractPullRequestNumber,
  findPendingChatGptTurn,
  normalizeDialogueDecision
} from "../api/_lib/ari-vnext/chatgpt-repair-dialogue.js";

test("extracts Ari repair handoff packet from issue body", () => {
  const packet = {
    schema: "ari_chatgpt_repair_handoff_v1",
    handoffKey: "abc123",
    proposer: "Ari"
  };
  const body = [
    "# Repair",
    "~~~~json",
    JSON.stringify(packet, null, 2),
    "~~~~"
  ].join("\n");

  assert.deepEqual(extractHandoffPacket(body), packet);
});

test("detects an unanswered ChatGPT review and tracks challenge rounds", () => {
  const comments = [
    {
      id: 1,
      created_at: "2026-09-26T04:56:00.000Z",
      body: "[CHATGPT-REVIEWED]\nInitial critique"
    }
  ];

  const pending = findPendingChatGptTurn(comments, { maxRounds: 2 });
  assert.equal(pending.round, 1);
  assert.equal(pending.canChallenge, true);
  assert.equal(pending.chatgptComment.id, 1);
});

test("does not re-answer ChatGPT after Ari has already responded", () => {
  const comments = [
    {
      id: 1,
      created_at: "2026-09-26T04:56:00.000Z",
      body: "[CHATGPT-REVIEWED]\nInitial critique"
    },
    {
      id: 2,
      created_at: "2026-09-26T05:06:00.000Z",
      body: "[ARI-CHALLENGE round=1]\nNeed root cause evidence"
    }
  ];

  assert.equal(findPendingChatGptTurn(comments, { maxRounds: 2 }), null);
});

test("Ari can challenge a symptom-only repair with a discriminating experiment", () => {
  const comment = buildAriDialogueComment({
    round: 1,
    maxRounds: 2,
    chatgptCommentId: 99,
    decision: {
      verdict: "challenge",
      depthAssessment: "symptom_only",
      restrictionAssessment: "overbroad",
      rootCauseClaim: "The handler is timing out.",
      causalGap: "The patch only increases the timeout and does not explain why work stalls.",
      challenge: "Show which operation blocks and why the proposed change removes that mechanism.",
      requestedEvidence: ["Trace the blocking call", "Regression reproducing the stall"],
      nextExperiment: "Inject a controlled slow dependency and compare the causal trace before and after.",
      acceptanceReason: "",
      confidence: 0.88
    }
  });

  assert.match(comment, /\[ARI-CHALLENGE round=1\]/);
  assert.match(comment, /symptom_only/);
  assert.match(comment, /causal gap/i);
  assert.match(comment, /controlled slow dependency/i);
  assert.match(comment, /ARI-REVIEW-OF:99/);
});

test("challenge becomes owner escalation after dialogue round budget is exhausted", () => {
  const normalized = normalizeDialogueDecision({
    verdict: "challenge",
    depthAssessment: "mixed",
    restrictionAssessment: "unclear",
    rootCauseClaim: "Competing causes remain.",
    causalGap: "Evidence is incomplete.",
    challenge: "Need another experiment.",
    requestedEvidence: [],
    nextExperiment: "Compare both hypotheses.",
    acceptanceReason: "",
    confidence: 0.7
  }, { canChallenge: false });

  assert.equal(normalized.verdict, "escalate_owner");
});

test("extracts repair pull request number from ChatGPT review", () => {
  const text = "I opened https://github.com/calbuddyhealth/Calbuddy/pull/412 with the revised fix.";
  assert.equal(extractPullRequestNumber(text, "calbuddyhealth/Calbuddy"), 412);
});
