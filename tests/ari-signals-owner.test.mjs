import assert from "node:assert/strict";
import test from "node:test";

import handler from "../api/ari-signals.js";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

function responseRecorder() {
  const headers = new Map();
  return {
    statusCode: 200,
    body: null,
    setHeader(name, value) { headers.set(String(name).toLowerCase(), value); },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    end() { return this; },
    header(name) { return headers.get(String(name).toLowerCase()); }
  };
}

function jsonResponse(status, value) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return value; }
  };
}

function configureEnv() {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_ANON_KEY = "anon-test-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key";
  process.env.ARI_OWNER_USER_ID = OWNER_ID;
  process.env.ARI_OWNER_EMAIL = "owner@example.com";
}

test("Ari Signals rejects an authenticated non-owner", async () => {
  configureEnv();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.match(String(url), /\/auth\/v1\/user$/);
    return jsonResponse(200, { id: OTHER_ID, email: "other@example.com" });
  };

  try {
    const req = { method: "GET", headers: { authorization: "Bearer valid-session" } };
    const res = responseRecorder();
    await handler(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body?.code, "OWNER_ACCESS_DENIED");
    assert.equal(res.header("x-ari-signals-mode"), "owner-only");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Ari Signals owner feed ranks actionable workflow signals", async () => {
  configureEnv();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const href = String(url);
    if (href.endsWith("/auth/v1/user")) {
      return jsonResponse(200, { id: OWNER_ID, email: "owner@example.com" });
    }
    if (href.includes("/rest/v1/ari_vnext_initiative_events")) {
      return jsonResponse(200, [{
        id: "signal-1",
        user_id: OWNER_ID,
        initiative_key: "meal-log-retry",
        reason_id: "tool_log_failed_retry",
        priority: "high",
        status: "surfaced",
        payload: {
          opener: "Meal logging needs a retry.",
          followUpPrompt: "Retry the meal log?",
          action: "retry_log",
          domain: "meals",
          context: "The meal logging workflow failed after the user confirmed the action.",
          ownerBrief: {
            whatItMeans: "The meal logging workflow failed after confirmation.",
            whySent: "A confirmed action still needs resolution.",
            relatedGoal: "Reliable meal logging",
            currentState: "The write did not complete.",
            requestFromJose: "Choose whether to retry or inspect the failure.",
            requestFromChatGPT: "Review the failed workflow and identify the safest retry path.",
            suggestedNextStep: "Inspect the failure receipt before retrying.",
            evidence: [{ type: "runtime_receipt", label: "Meal write failed", status: "failed" }]
          }
        },
        surfaced_at: new Date().toISOString(),
        engaged_at: null,
        dismissed_at: null,
        expires_at: null,
        updated_at: new Date().toISOString()
      }]);
    }
    if (href.includes("/rest/v1/ari_signal_preferences")) {
      return jsonResponse(200, []);
    }
    throw new Error(`Unexpected fetch: ${href}`);
  };

  try {
    const req = { method: "GET", headers: { authorization: "Bearer owner-session" } };
    const res = responseRecorder();
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.ownerMode, true);
    assert.equal(res.body?.version, "2.2.0-owner");
    assert.equal(res.body?.signals?.length, 1);
    assert.equal(res.body.signals[0].category, "workflow");
    assert.equal(res.body.signals[0].ownerOnly, true);
    assert.equal(res.body.signals[0].actionable, true);
    assert.equal(res.body.signals[0].attention, "act_now");
    assert.equal(res.body.signals[0].detail.relatedGoal, "Reliable meal logging");
    assert.match(res.body.signals[0].detail.whatItMeans, /failed after confirmation/i);
    assert.match(res.body.signals[0].detail.requestFromChatGPT, /safest retry path/i);
    assert.equal(res.body.signals[0].detail.evidence[0].label, "Meal write failed");
    assert.equal(res.body.attentionCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("existing autonomy signals without ownerBrief still get grounded details", async () => {
  configureEnv();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const href = String(url);
    if (href.endsWith("/auth/v1/user")) {
      return jsonResponse(200, { id: OWNER_ID, email: "owner@example.com" });
    }
    if (href.includes("/rest/v1/ari_vnext_initiative_events")) {
      return jsonResponse(200, [{
        id: "signal-old",
        user_id: OWNER_ID,
        initiative_key: "ari_autonomy:goal:existing",
        reason_id: "ari_autonomous_research_cycle",
        priority: "high",
        status: "surfaced",
        payload: {
          opener: "I need Jose + ChatGPT on one of my development goals.",
          context: "The goal needs a broader persistence change outside isolated branch authority.",
          followUpPrompt: "What I want help with: Goal: improve durable continuity. Evidence: the current store cannot represent the missing state.",
          action: "collaborate_on_autonomous_goal",
          domain: "development"
        },
        surfaced_at: new Date().toISOString(),
        engaged_at: null,
        dismissed_at: null,
        expires_at: null,
        updated_at: new Date().toISOString()
      }]);
    }
    if (href.includes("/rest/v1/ari_signal_preferences")) {
      return jsonResponse(200, []);
    }
    throw new Error(`Unexpected fetch: ${href}`);
  };

  try {
    const req = { method: "GET", headers: { authorization: "Bearer owner-session" } };
    const res = responseRecorder();
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    const signal = res.body?.signals?.[0];
    assert.equal(signal?.detail?.whatItMeans, "The goal needs a broader persistence change outside isolated branch authority.");
    assert.equal(signal?.detail?.relatedGoal, "improve durable continuity");
    assert.match(signal?.detail?.requestFromChatGPT || "", /improve durable continuity/i);
    assert.equal(signal?.detail?.evidence?.[0]?.label, "the current store cannot represent the missing state");
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("owner can resolve a grounded prediction review and close its Signal", async () => {
  configureEnv();
  const originalFetch = globalThis.fetch;
  const reviewPacket = {
    version: "1.0.0",
    decisionId: "decision-review-1",
    domain: "goals",
    kind: "prediction",
    proposition: "Normal session variability or measurement noise",
    originalPrediction: "The apparent change disappears or varies normally across comparable sessions.",
    successCriteria: "The apparent change disappears or varies normally across comparable sessions.",
    disconfirmingCriteria: "The same direction repeats across several comparable exposures.",
    hypothesisId: "normal_variability_or_measurement_noise",
    observationWindow: {
      startAt: "2026-09-23T00:00:00Z",
      reviewAt: "2026-09-25T00:00:00Z",
      horizonDays: 2,
      due: true
    },
    baseline: {
      available: true,
      metrics: ["Progression: 0 up, 1 stable, 1 down"],
      supportingEvidence: ["limited_decline_pattern"],
      contradictingEvidence: [],
      unknowns: []
    },
    currentEvidence: [{
      id: "performance_trajectory",
      label: "Comparable exercise trajectory: 1 up, 3 stable, 0 down",
      confidence: 0.84
    }],
    evidenceQuality: {
      label: "strong",
      score: 6,
      evidenceCount: 4,
      note: "Enough current observations exist for a meaningful review."
    },
    preliminaryVerdict: "supported",
    preliminaryRationale: "The pattern did not broaden across comparable exposures.",
    finalVerdictRequired: true,
    resolutionOptions: ["supported", "weakened", "mixed", "inconclusive"]
  };
  const signalRow = {
    id: "signal-review-1",
    user_id: OWNER_ID,
    initiative_key: "decision_prediction_due:review",
    reason_id: "decision_prediction_due",
    priority: "medium",
    status: "surfaced",
    payload: {
      opener: "Prediction ready for review: Normal session variability or measurement noise.",
      followUpPrompt: "Review the prediction against the new evidence.",
      action: "review_prediction",
      domain: "goals",
      context: "Observation window complete.",
      ownerBrief: {
        whatItMeans: "The observation window has ended.",
        whySent: "The review date is a trigger to compare evidence, not proof.",
        relatedGoal: "Normal session variability or measurement noise",
        currentState: "Evidence quality is strong.",
        suggestedNextStep: "Compare the evidence.",
        evidence: [],
        reviewPacket
      }
    },
    surfaced_at: "2026-09-25T04:00:00Z",
    engaged_at: null,
    dismissed_at: null,
    expires_at: null,
    updated_at: "2026-09-25T04:00:00Z"
  };

  let decisionPatchSeen = false;
  let signalDismissSeen = false;
  globalThis.fetch = async (url, init = {}) => {
    const href = String(url);
    const method = String(init?.method || "GET").toUpperCase();
    if (href.endsWith("/auth/v1/user")) {
      return jsonResponse(200, { id: OWNER_ID, email: "owner@example.com" });
    }
    if (href.includes("/rest/v1/ari_vnext_decisions") && method === "PATCH") {
      decisionPatchSeen = true;
      const body = JSON.parse(String(init.body || "{}"));
      assert.equal(body.outcome_direction, "supported");
      assert.equal(body.resolution_source, "owner_signal_prediction_review");
      assert.match(body.outcome?.lesson || "", /Increase confidence/i);
      return jsonResponse(200, [{
        id: "decision-review-1",
        user_id: OWNER_ID,
        turn_id: "turn-review",
        domain: "goals",
        decision_type: "predictive_assessment",
        proposition: "Normal session variability or measurement noise",
        confidence: 0.6,
        evidence: {},
        alternatives: [],
        provenance: [],
        prediction: reviewPacket,
        status: "resolved",
        outcome_direction: "supported",
        outcome: body.outcome,
        resolution_source: body.resolution_source,
        created_at: "2026-09-23T00:00:00Z",
        resolved_at: body.resolved_at,
        updated_at: body.updated_at
      }]);
    }
    if (href.includes("/rest/v1/ari_vnext_initiative_events") && method === "PATCH") {
      signalDismissSeen = true;
      return jsonResponse(200, [{ ...signalRow, status: "dismissed", dismissed_at: "2026-09-25T05:00:00Z" }]);
    }
    if (href.includes("/rest/v1/ari_vnext_initiative_events")) {
      return jsonResponse(200, [signalRow]);
    }
    throw new Error(`Unexpected fetch: ${method} ${href}`);
  };

  try {
    const req = {
      method: "POST",
      headers: { authorization: "Bearer owner-session" },
      body: { action: "resolve-prediction", signalId: "signal-review-1", verdict: "supported" }
    };
    const res = responseRecorder();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.success, true);
    assert.equal(res.body?.verdict, "supported");
    assert.match(res.body?.learning?.summary || "", /was supported/i);
    assert.equal(decisionPatchSeen, true);
    assert.equal(signalDismissSeen, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
