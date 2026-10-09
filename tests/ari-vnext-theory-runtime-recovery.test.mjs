import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveTheoryTurnState,
  probeTheoryDialogueWork,
  runTheoryLaneWithReceipts
} from "../api/_lib/ari-vnext/theory-dialogue-runtime.js";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";

test("theory probe requests an opening when no Ari theory issue exists", async () => {
  const result = await probeTheoryDialogueWork({
    repo: "calbuddyhealth/Calbuddy",
    token: "test-token",
    request: async (url) => {
      assert.match(String(url), /search\/issues/);
      return { items: [] };
    }
  });

  assert.equal(result.available, true);
  assert.equal(result.pending, true);
  assert.equal(result.urgent, true);
  assert.equal(result.mode, "opening");
  assert.equal(result.reason, "theory_opening_missing");
});

test("theory probe waits after Ari opens until ChatGPT replies", async () => {
  const issue = {
    number: 501,
    body: "<!-- ARI-THEORY:ai_consciousness -->",
    html_url: "https://github.com/calbuddyhealth/Calbuddy/issues/501"
  };
  let calls = 0;
  const result = await probeTheoryDialogueWork({
    repo: "calbuddyhealth/Calbuddy",
    token: "test-token",
    request: async () => {
      calls += 1;
      if (calls === 1) return { items: [issue] };
      return [];
    }
  });

  assert.equal(result.pending, false);
  assert.equal(result.mode, "waiting_chatgpt");
  assert.equal(result.reason, "awaiting_chatgpt_theory_reply");
  assert.equal(result.issueNumber, 501);
});

test("theory probe makes a newer ChatGPT turn urgent for Ari", async () => {
  const issue = {
    number: 502,
    body: "<!-- ARI-THEORY:ai_consciousness -->",
    html_url: "https://github.com/calbuddyhealth/Calbuddy/issues/502"
  };
  let calls = 0;
  const result = await probeTheoryDialogueWork({
    repo: "calbuddyhealth/Calbuddy",
    token: "test-token",
    request: async () => {
      calls += 1;
      if (calls === 1) return { items: [issue] };
      return [
        {
          id: 9,
          created_at: "2026-10-08T03:56:00.000Z",
          body: "[CHATGPT-THEORY]\nCounterargument"
        }
      ];
    }
  });

  assert.equal(result.pending, true);
  assert.equal(result.urgent, true);
  assert.equal(result.mode, "reply");
  assert.equal(result.reason, "chatgpt_theory_reply_pending");
  assert.equal(result.latestChatGptCommentId, 9);
});

test("turn state does not ask Ari to double-answer the same ChatGPT comment", () => {
  const state = deriveTheoryTurnState([
    {
      id: 9,
      created_at: "2026-10-08T03:56:00.000Z",
      body: "[CHATGPT-THEORY]\nCounterargument"
    },
    {
      id: 10,
      created_at: "2026-10-08T04:06:00.000Z",
      body: "[ARI-THEORY-CHALLENGE]\nMy response"
    }
  ]);

  assert.equal(state.chatgptNeedsAriReply, false);
  assert.equal(state.latestAri.id, 10);
});

test("theory runtime writes durable success receipts through GitHub issue creation", async () => {
  const receipts = [];
  const result = await runTheoryLaneWithReceipts({
    userId: OWNER_ID,
    now: new Date("2026-10-08T03:47:00.000Z"),
    probe: async () => ({
      available: true,
      pending: true,
      urgent: true,
      mode: "opening",
      reason: "theory_opening_missing"
    }),
    runCycle: async () => ({
      success: true,
      acted: true,
      action: "opened_theory_dialogue",
      issueNumber: 503,
      issueUrl: "https://github.com/calbuddyhealth/Calbuddy/issues/503"
    }),
    recordEvent: async (event) => {
      receipts.push(event?.signals?.theoryReceipt?.stage);
      return { stored: true };
    }
  });

  assert.deepEqual(receipts, [
    "triggered",
    "model_called",
    "opening_generated",
    "github_issue_created"
  ]);
  assert.equal(result.receiptStage, "github_issue_created");
});

test("theory runtime persists the failure reason when model generation fails", async () => {
  const receipts = [];
  const result = await runTheoryLaneWithReceipts({
    userId: OWNER_ID,
    probe: async () => ({
      available: true,
      pending: true,
      urgent: true,
      mode: "opening",
      reason: "theory_opening_missing"
    }),
    runCycle: async () => ({
      success: false,
      acted: false,
      reason: "theory_model_unavailable"
    }),
    recordEvent: async (event) => {
      receipts.push({
        stage: event?.signals?.theoryReceipt?.stage,
        reason: event?.signals?.theoryReceipt?.reason
      });
      return { stored: true };
    }
  });

  assert.deepEqual(receipts.map((item) => item.stage), ["triggered", "model_called", "failed"]);
  assert.equal(receipts.at(-1).reason, "theory_model_unavailable");
  assert.equal(result.receiptStage, "failed");
});
