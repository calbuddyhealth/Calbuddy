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
import { runAriDreamingCycle } from "../api/_lib/ari-vnext/dreaming-runtime.js";
import dreamingHandler from "../api/ari-dreaming-cycle.js";

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

test("Vercel schedules one daily owner dreaming cycle", () => {
  const config = JSON.parse(fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const dreamCron = config.crons.find(item => item.path === "/api/ari-dreaming-cycle");
  assert.ok(dreamCron);
  assert.equal(dreamCron.schedule, "13 12 * * *");
});

test("dreaming migration keeps the new tables server-only", () => {
  const sql = fs.readFileSync(new URL("../supabase/migrations/20260923114500_ari_dreaming.sql", import.meta.url), "utf8");
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on table public\.ari_vnext_dream_runs from public, anon, authenticated/i);
  assert.match(sql, /revoke all on table public\.ari_vnext_dream_insights from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update on table public\.ari_vnext_dream_insights to service_role/i);
});
