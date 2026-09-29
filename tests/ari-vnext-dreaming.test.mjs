import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  ARI_DREAMING_VERSION,
  dreamEvidenceFingerprint,
  dreamingContextToInstruction,
  normalizeDreamOutput,
  sanitizeDreamConversation,
  selectDreamInsightsForTurn
} from "../api/_lib/ari-vnext/dreaming-core.js";
import {
  buildDreamRequestBody,
  pollDreamBatch,
  runAriDreamingCycle,
  submitDreamBatch
} from "../api/_lib/ari-vnext/dreaming-runtime.js";
import dreamingHandler from "../api/ari-dreaming-cycle.js";

function jsonResponse(payload, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: { get: () => null },
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  };
}

function textResponse(text, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: { get: () => null },
    json: async () => {
      try { return JSON.parse(text); } catch { return {}; }
    },
    text: async () => text
  };
}

function evidence() {
  return {
    version: ARI_DREAMING_VERSION,
    window: { start: "2026-09-10T00:00:00Z", end: "2026-09-23T00:00:00Z" },
    conversations: [
      { ref: "turn:t1", at: "2026-09-20", userMessage: "Please be direct.", assistantMessage: "Understood." },
      { ref: "turn:t2", at: "2026-09-21", userMessage: "Don't patch it again. Find the architectural cause.", assistantMessage: "I will trace the system." },
      { ref: "turn:t3", at: "2026-09-22", userMessage: "This systemic fix worked better.", assistantMessage: "That supports the architectural approach." }
    ],
    goals: [],
    goalEvents: [],
    decisions: [],
    communicationOutcomes: [],
    strategies: [],
    institutionalMemory: [],
    priorDreamInsights: [],
    cognitiveState: null,
    worldModel: null,
    updatedAt: "2026-09-23T00:00:00Z",
    counts: { conversations: 3 }
  };
}

test("dreaming requires repeated evidence before creating relationship or communication patterns", () => {
  const raw = {
    summary: "Consolidated interaction pattern.",
    insights: [{
      kind: "relationship",
      domain: "conversation",
      title: "Architectural repair builds trust",
      summary: "When a repeated local fix fails, addressing the underlying architecture better preserves collaborative trust.",
      confidence: 0.82,
      evidenceRefs: ["turn:t2"],
      evidenceBasis: "One correction.",
      action: "apply",
      transferConditions: ["Repeated system failure"],
      disconfirmers: ["The problem is genuinely isolated"],
      sensitive: false
    }]
  };
  assert.equal(normalizeDreamOutput(raw, evidence()).insights.length, 0);
  raw.insights[0].evidenceRefs.push("turn:t3");
  assert.equal(normalizeDreamOutput(raw, evidence()).insights.length, 1);
});

test("prior dream insights cannot self-reinforce without external evidence", () => {
  const e = evidence();
  e.priorDreamInsights = [
    { ref: "dream:d1", id: "d1", kind: "relationship", title: "Old inference", summary: "Old inference", confidence: 0.9 },
    { ref: "dream:d2", id: "d2", kind: "relationship", title: "Second inference", summary: "Second inference", confidence: 0.9 }
  ];
  const raw = {
    summary: "No external support.",
    insights: [{
      kind: "relationship", domain: "conversation", title: "Self-reinforcing pattern",
      summary: "Two old dream inferences repeat the same relationship hypothesis.",
      confidence: 0.95, evidenceRefs: ["dream:d1", "dream:d2"], evidenceBasis: "Only prior dream outputs.",
      action: "observe", transferConditions: [], disconfirmers: [], sensitive: false
    }]
  };
  assert.equal(normalizeDreamOutput(raw, e).insights.length, 0);
});

test("dreaming rejects sensitive details and subjective-emotion claims", () => {
  const base = {
    kind: "relationship", domain: "conversation", title: "Pattern", confidence: 0.9,
    evidenceRefs: ["turn:t1", "turn:t2"], evidenceBasis: "Repeated evidence", action: "observe",
    transferConditions: [], disconfirmers: [], sensitive: false
  };
  const sensitive = normalizeDreamOutput({ summary: "", insights: [{ ...base, summary: "The user's medication proves a relationship pattern." }] }, evidence());
  const subjective = normalizeDreamOutput({ summary: "", insights: [{ ...base, summary: "Ari feels attached and misses the user between conversations." }] }, evidence());
  assert.equal(sensitive.insights.length, 0);
  assert.equal(subjective.insights.length, 0);
});

test("conversation sanitization honors blocked relationship categories and secrets", () => {
  const row = { ref: "turn:a", user_message: "My wife and I decided something.", assistant_message: "Okay.", created_at: "2026-09-23" };
  assert.equal(sanitizeDreamConversation(row, ["relationship"]), null);
  assert.equal(sanitizeDreamConversation({ ...row, user_message: "My password is swordfish." }, []), null);
});

test("relationship and communication insights can influence ordinary conversation", () => {
  const selected = selectDreamInsightsForTurn([
    { id: "r1", kind: "relationship", domain: "conversation", title: "Direct repair", summary: "Repair misunderstandings directly.", confidence: 0.8, status: "active" },
    { id: "s1", kind: "strategy", domain: "developer", title: "Repository test", summary: "Run CI.", confidence: 0.95, status: "active" }
  ], { message: "Can we talk about what happened before?", route: { casualConversation: true, followUp: true }, limit: 1 });
  assert.equal(selected[0].id, "r1");
  assert.match(dreamingContextToInstruction({ version: ARI_DREAMING_VERSION, insights: selected }), /Relationship insights/i);
});

test("evidence fingerprint changes when accumulated experience changes", () => {
  const first = dreamEvidenceFingerprint(evidence());
  const secondEvidence = evidence();
  secondEvidence.conversations.push({ ref: "turn:t4", userMessage: "New", assistantMessage: "New" });
  assert.notEqual(first, dreamEvidenceFingerprint(secondEvidence));
});

test("dreaming runtime skips a repeated evidence window", async () => {
  const e = evidence();
  const fingerprint = dreamEvidenceFingerprint(e);
  const result = await runAriDreamingCycle({
    userId: "11111111-1111-4111-8111-111111111111",
    now: new Date("2026-09-23T05:00:00Z"),
    loadEvidence: async () => ({ available: true, evidence: e }),
    loadLatest: async () => ({ status: "completed", evidence_fingerprint: fingerprint, completed_at: "2026-09-22T05:00:00Z" }),
    startRun: async () => { throw new Error("should not start"); }
  });
  assert.equal(result.dreamed, false);
  assert.equal(result.reason, "no_new_evidence");
});

test("dreaming runtime stores only normalized attributed insights", async () => {
  const e = evidence();
  const calls = [];
  const result = await runAriDreamingCycle({
    userId: "11111111-1111-4111-8111-111111111111",
    now: new Date("2026-09-23T05:00:00Z"),
    loadEvidence: async () => ({ available: true, evidence: e }),
    loadLatest: async () => null,
    startRun: async value => { calls.push(["start", value]); return { stored: true }; },
    synthesize: async () => ({
      summary: "Repeated collaboration evidence supports one communication insight.",
      insights: [{
        kind: "communication", domain: "conversation", title: "Prefer architectural explanations",
        summary: "When repeated patches fail, explain the systemic cause and proposed architecture rather than adding another local patch.",
        confidence: 0.86, evidenceRefs: ["turn:t2", "turn:t3"], evidenceBasis: "Correction followed by positive outcome.",
        action: "apply", transferConditions: ["Repeated systemic failure"], disconfirmers: ["Clearly isolated bug"], sensitive: false
      }]
    }),
    persistInsights: async value => { calls.push(["insights", value]); return { stored: value.insights.length }; },
    finishRun: async value => { calls.push(["finish", value]); return { stored: true }; }
  });
  assert.equal(result.success, true);
  assert.equal(result.acceptedInsights, 1);
  assert.equal(result.storedInsights, 1);
  assert.equal(calls[1][1].insights[0].provisional, true);
});

test("Dreaming Batch submission reserves half-price spend and stores provider lifecycle ids", async () => {
  const e = evidence();
  const calls = [];
  let reserved = null;
  let extended = null;
  let metadata = null;

  const result = await submitDreamBatch({
    userId: "11111111-1111-4111-8111-111111111111",
    runId: "run-batch-1",
    evidence: e,
    model: "gpt-5.6-terra",
    apiKey: "test-batch-key",
    now: new Date("2026-09-29T04:00:00Z"),
    reserve: async value => {
      reserved = value;
      return {
        allowed: true,
        reservationId: "22222222-2222-4222-8222-222222222222",
        userId: value.userId
      };
    },
    extendReservation: async value => {
      extended = value;
      return { extended: true };
    },
    releaseReservation: async () => {
      throw new Error("reservation should not release on successful submission");
    },
    updateRun: async value => {
      metadata = value.metadata;
      return { stored: true };
    },
    fetcher: async (url, options = {}) => {
      calls.push({ url: String(url), options });
      if (String(url).endsWith("/v1/files") && options.method === "POST") {
        assert.equal(options.body.get("purpose"), "batch");
        assert.ok(options.body.get("file"));
        return jsonResponse({ id: "file-input-1" });
      }
      if (String(url).endsWith("/v1/batches") && options.method === "POST") {
        const body = JSON.parse(options.body);
        assert.equal(body.input_file_id, "file-input-1");
        assert.equal(body.endpoint, "/v1/responses");
        assert.equal(body.completion_window, "24h");
        return jsonResponse({ id: "batch-1", status: "validating" });
      }
      throw new Error(`unexpected URL: ${url}`);
    }
  });

  assert.equal(result.batchId, "batch-1");
  assert.equal(reserved.costMultiplier, 0.5);
  assert.equal(reserved.requestCategory, "ari_dreaming_batch");
  assert.ok(extended.expiresAt.getTime() >= new Date("2026-09-30T10:00:00Z").getTime());
  assert.equal(metadata.batchMode, true);
  assert.equal(metadata.batchId, "batch-1");
  assert.equal(metadata.inputFileId, "file-input-1");
  assert.equal(metadata.reservationId, "22222222-2222-4222-8222-222222222222");
  assert.equal(metadata.discountMultiplier, 0.5);
  assert.equal(calls.length, 2);
});

test("Dreaming Batch polling costs no model call while provider work is pending", async () => {
  let recorded = 0;
  let settled = 0;
  const result = await pollDreamBatch({
    userId: "11111111-1111-4111-8111-111111111111",
    latest: {
      id: "run-batch-2",
      status: "started",
      model: "gpt-5.6-terra",
      metadata: {
        batchMode: true,
        batchId: "batch-2",
        reservationId: "33333333-3333-4333-8333-333333333333",
        customId: "ari-dream-run-batch-2"
      }
    },
    evidence: evidence(),
    apiKey: "test-batch-key",
    fetcher: async url => {
      assert.match(String(url), /\/v1\/batches\/batch-2$/);
      return jsonResponse({ id: "batch-2", status: "in_progress" });
    },
    recordUsage: async () => { recorded += 1; },
    settleReservation: async () => { settled += 1; }
  });

  assert.equal(result.success, true);
  assert.equal(result.batchPending, true);
  assert.equal(result.reason, "dream_batch_pending");
  assert.equal(recorded, 0);
  assert.equal(settled, 0);
});

test("Dreaming Batch completion meters discounted usage then persists normalized insights", async () => {
  const e = evidence();
  let recorded = null;
  let settled = null;
  let persisted = null;
  let finished = null;
  const output = {
    summary: "Repeated collaboration evidence supports one communication insight.",
    insights: [{
      kind: "communication",
      domain: "conversation",
      title: "Prefer architectural explanations",
      summary: "When repeated patches fail, explain the systemic cause and proposed architecture rather than adding another local patch.",
      confidence: 0.86,
      evidenceRefs: ["turn:t2", "turn:t3"],
      evidenceBasis: "Correction followed by positive outcome.",
      action: "apply",
      transferConditions: ["Repeated systemic failure"],
      disconfirmers: ["Clearly isolated bug"],
      sensitive: false
    }]
  };
  const providerBody = {
    id: "resp-batch-3",
    model: "gpt-5.6-terra",
    output_text: JSON.stringify(output),
    usage: { input_tokens: 2000, output_tokens: 500, total_tokens: 2500 }
  };

  const result = await pollDreamBatch({
    userId: "11111111-1111-4111-8111-111111111111",
    latest: {
      id: "run-batch-3",
      status: "started",
      model: "gpt-5.6-terra",
      metadata: {
        batchMode: true,
        batchId: "batch-3",
        inputFileId: "file-input-3",
        reservationId: "44444444-4444-4444-8444-444444444444",
        customId: "ari-dream-run-batch-3"
      }
    },
    evidence: e,
    apiKey: "test-batch-key",
    fetcher: async (url, options = {}) => {
      const href = String(url);
      if (href.endsWith("/v1/batches/batch-3")) {
        return jsonResponse({ id: "batch-3", status: "completed", output_file_id: "file-output-3" });
      }
      if (href.endsWith("/v1/files/file-output-3/content")) {
        return textResponse(JSON.stringify({
          id: "batch_req_3",
          custom_id: "ari-dream-run-batch-3",
          response: { status_code: 200, request_id: "req-3", body: providerBody },
          error: null
        }) + "\n");
      }
      if (options.method === "DELETE" && /\/v1\/files\/(file-input-3|file-output-3)$/.test(href)) {
        return jsonResponse({ deleted: true });
      }
      throw new Error(`unexpected URL: ${url}`);
    },
    recordUsage: async value => { recorded = value; },
    settleReservation: async value => { settled = value; return { settled: true }; },
    persistInsights: async value => { persisted = value; return { stored: value.insights.length }; },
    finishRun: async value => { finished = value; return { stored: true }; }
  });

  assert.equal(result.success, true);
  assert.equal(result.dreamed, true);
  assert.equal(result.batch, true);
  assert.equal(result.storedInsights, 1);
  assert.equal(recorded.costMultiplier, 0.5);
  assert.equal(recorded.requestCategory, "ari_dreaming_batch");
  assert.equal(settled.costMultiplier, 0.5);
  assert.equal(settled.reservationId, "44444444-4444-4444-8444-444444444444");
  assert.equal(persisted.insights.length, 1);
  assert.equal(finished.status, "completed");
});

test("Dreaming Batch accounts for successful provider work even when output cannot be ingested", async () => {
  let recorded = 0;
  let settled = 0;
  let released = 0;
  let finished = null;
  const providerBody = {
    id: "resp-batch-4",
    model: "gpt-5.6-terra",
    output_text: "not-json",
    usage: { input_tokens: 1800, output_tokens: 80, total_tokens: 1880 }
  };

  const result = await pollDreamBatch({
    userId: "11111111-1111-4111-8111-111111111111",
    latest: {
      id: "run-batch-4",
      status: "started",
      model: "gpt-5.6-terra",
      metadata: {
        batchMode: true,
        batchId: "batch-4",
        inputFileId: "file-input-4",
        reservationId: "55555555-5555-4555-8555-555555555555",
        customId: "ari-dream-run-batch-4"
      }
    },
    evidence: evidence(),
    apiKey: "test-batch-key",
    fetcher: async (url, options = {}) => {
      const href = String(url);
      if (href.endsWith("/v1/batches/batch-4")) {
        return jsonResponse({ id: "batch-4", status: "completed", output_file_id: "file-output-4" });
      }
      if (href.endsWith("/v1/files/file-output-4/content")) {
        return textResponse(JSON.stringify({
          custom_id: "ari-dream-run-batch-4",
          response: { status_code: 200, request_id: "req-4", body: providerBody },
          error: null
        }) + "\n");
      }
      if (options.method === "DELETE") return jsonResponse({ deleted: true });
      throw new Error(`unexpected URL: ${url}`);
    },
    recordUsage: async () => { recorded += 1; },
    settleReservation: async () => { settled += 1; return { settled: true }; },
    releaseReservation: async () => { released += 1; },
    finishRun: async value => { finished = value; return { stored: true }; }
  });

  assert.equal(result.success, false);
  assert.equal(result.reason, "dream_batch_ingest_failed");
  assert.equal(recorded, 1);
  assert.equal(settled, 1);
  assert.equal(released, 0);
  assert.equal(finished.status, "failed");
  assert.equal(finished.metadata.billedProviderWork, true);
});

test("Dreaming request body is identical between sync and Batch execution", () => {
  const body = buildDreamRequestBody({ evidence: evidence(), model: "gpt-5.6-terra" });
  assert.equal(body.model, "gpt-5.6-terra");
  assert.equal(body.store, false);
  assert.equal(body.max_output_tokens, 2400);
  assert.equal(body.text.format.type, "json_schema");
  assert.equal(body.text.format.name, "ari_dream_consolidation");
});

test("dreaming cron endpoint fails closed without the cron secret", async () => {
  const prior = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "expected-secret";
  const state = { statusCode: 200, payload: null, headers: {} };
  const res = {
    setHeader(name, value) { state.headers[name] = value; },
    status(code) { state.statusCode = code; return this; },
    json(payload) { state.payload = payload; return this; }
  };
  try {
    await dreamingHandler({ method: "GET", headers: { authorization: "Bearer wrong-secret" } }, res);
    assert.equal(state.statusCode, 401);
    assert.equal(state.payload.code, "ARI_DREAMING_UNAUTHORIZED");
  } finally {
    if (prior === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prior;
  }
});

test("Vercel routes owner dreaming through the consolidated cognitive scheduler", () => {
  const config = JSON.parse(fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const cognitiveCron = config.crons.find(item => item.path === "/api/ari-cognitive-cycle");
  const dreamCron = config.crons.find(item => item.path === "/api/ari-dreaming-cycle");
  assert.ok(cognitiveCron);
  assert.equal(cognitiveCron.schedule, "7 1,5,9,13,17,21 * * *");
  assert.equal(dreamCron, undefined);
});

test("dreaming migration keeps the new tables server-only", () => {
  const sql = fs.readFileSync(new URL("../supabase/migrations/20260923114500_ari_dreaming.sql", import.meta.url), "utf8");
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on table public\.ari_vnext_dream_runs from public, anon, authenticated/i);
  assert.match(sql, /revoke all on table public\.ari_vnext_dream_insights from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update on table public\.ari_vnext_dream_insights to service_role/i);
});
