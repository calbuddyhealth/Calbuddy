import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { estimateOpenAICost } from "../api/_lib/ai-provider-usage.js";
import {
  estimateBackgroundReservationUsd,
  getBackgroundAiBudgetStatus,
  reserveBackgroundAiBudget
} from "../api/_lib/background-ai-budget.js";
import {
  buildCognitiveCandidates,
  chooseCognitiveLane,
  runAriCognitiveScheduler,
  selectDeterministicCognitiveLane
} from "../api/_lib/ari-vnext/cognitive-scheduler.js";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";

test("GPT-5.6 family pricing is recorded correctly", () => {
  const usage = { inputTokens: 1_000_000, cachedInputTokens: 200_000, outputTokens: 100_000 };

  const sol = estimateOpenAICost({ model: "gpt-5.6-sol", usage });
  const terra = estimateOpenAICost({ model: "gpt-5.6-terra", usage });
  const luna = estimateOpenAICost({ model: "gpt-5.6-luna", usage });
  const alias = estimateOpenAICost({ model: "gpt-5.6", usage });

  assert.equal(sol.estimatedCostUsd, 5.28);
  assert.equal(terra.estimatedCostUsd, 2.84);
  assert.equal(luna.estimatedCostUsd, 0.284);
  assert.equal(alias.estimatedCostUsd, sol.estimatedCostUsd);
  assert.match(sol.pricingSource, /gpt-5\.6-sol$/);
});

test("background spend governor blocks when the daily limit is reached", async () => {
  const original = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ARI_BACKGROUND_DAILY_BUDGET_USD: process.env.ARI_BACKGROUND_DAILY_BUDGET_USD,
    ARI_BACKGROUND_MONTHLY_BUDGET_USD: process.env.ARI_BACKGROUND_MONTHLY_BUDGET_USD
  };

  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
  process.env.ARI_BACKGROUND_DAILY_BUDGET_USD = "1";
  process.env.ARI_BACKGROUND_MONTHLY_BUDGET_USD = "20";

  try {
    const now = new Date("2026-09-28T18:00:00.000Z");
    const status = await getBackgroundAiBudgetStatus({
      now,
      fetcher: async () => response([
        {
          created_at: "2026-09-28T10:00:00.000Z",
          usage_type: "background",
          request_category: "ari_autonomy_patch_proposal",
          estimated_cost_usd: 0.72
        },
        {
          created_at: "2026-09-28T12:00:00.000Z",
          usage_type: "reasoning_reflection",
          request_category: "agent_community_autonomy",
          estimated_cost_usd: 0.31
        },
        {
          created_at: "2026-09-27T08:00:00.000Z",
          usage_type: "reasoning_reflection",
          request_category: "agent_community_autonomy",
          model: "gpt-5.6-sol",
          input_tokens: 100000,
          cached_input_tokens: 0,
          output_tokens: 10000,
          total_tokens: 110000,
          estimated_cost_usd: 0,
          pricing_source: "unpriced_model:gpt-5.6-sol"
        },
        {
          created_at: "2026-09-27T12:00:00.000Z",
          usage_type: "chat",
          request_category: "interactive_owner_chat",
          estimated_cost_usd: 9.5
        }
      ])
    });

    assert.equal(status.allowed, false);
    assert.equal(status.reason, "daily_budget_reached");
    assert.equal(status.dailySpendUsd, 1.03);
    assert.equal(status.monthlySpendUsd, 1.63);
  } finally {
    restoreEnv(original);
  }
});

test("deterministic scheduler returns a zero-model no-op when no lane has material work", () => {
  const now = new Date("2026-09-29T03:00:00.000Z");
  const candidates = buildCognitiveCandidates({
    history: {
      startedAt: "2026-09-28T23:00:00.000Z",
      lanes: {
        repair: "2026-09-29T01:00:00.000Z",
        autonomy: "2026-09-29T01:00:00.000Z",
        experience: "2026-09-29T01:00:00.000Z",
        community: "2026-09-29T01:00:00.000Z",
        dreaming: "2026-09-29T01:00:00.000Z",
        theory: "2026-09-29T01:00:00.000Z"
      }
    },
    signals: emptySignals(),
    budget: { dailyCommittedUsd: 0.1, dailyLimitUsd: 1, monthlyCommittedUsd: 2, monthlyLimitUsd: 20 },
    now
  });

  const decision = selectDeterministicCognitiveLane({ candidates });
  assert.equal(decision.lane, "none");
  assert.equal(decision.decisionMode, "deterministic_noop");
  assert.equal(decision.modelCalls, 0);
  assert.equal(decision.needsModel, false);
});

test("urgent repair signal bypasses Luna", () => {
  const now = new Date("2026-09-29T03:00:00.000Z");
  const signals = emptySignals();
  signals.repair = { activityScore: 1, urgent: true, pendingCount: 1 };

  const candidates = buildCognitiveCandidates({
    history: { startedAt: "2026-09-28T00:00:00.000Z", lanes: {} },
    signals,
    budget: {},
    now
  });
  const decision = selectDeterministicCognitiveLane({ candidates });

  assert.equal(decision.lane, "repair");
  assert.equal(decision.reason, "urgent_signal");
  assert.equal(decision.modelCalls, 0);
});

test("starvation protection forces an otherwise quiet Dreaming lane", () => {
  const now = new Date("2026-09-29T03:00:00.000Z");
  const signals = emptySignals();
  const candidates = buildCognitiveCandidates({
    history: {
      startedAt: "2026-09-23T00:00:00.000Z",
      lanes: {
        repair: "2026-09-29T02:00:00.000Z",
        autonomy: "2026-09-29T02:00:00.000Z",
        experience: "2026-09-29T02:00:00.000Z",
        community: "2026-09-29T02:00:00.000Z",
        dreaming: "2026-09-26T00:00:00.000Z",
        theory: "2026-09-29T02:00:00.000Z"
      }
    },
    signals,
    budget: {},
    now
  });

  const decision = selectDeterministicCognitiveLane({ candidates });
  assert.equal(decision.lane, "dreaming");
  assert.equal(decision.reason, "starvation_protection");
  assert.equal(decision.modelCalls, 0);
});

test("Luna is used only as a single tie-break call for close eligible lanes", async () => {
  const original = {
    ARI_PROVIDER_API_KEY: process.env.ARI_PROVIDER_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  };
  process.env.ARI_PROVIDER_API_KEY = "test-provider-key";
  let calls = 0;

  try {
    const decision = await chooseCognitiveLane({
      userId: OWNER_ID,
      candidates: [
        eligibleCandidate("experience", 2.40),
        eligibleCandidate("community", 2.32)
      ],
      executeModel: async ({ body }) => {
        calls += 1;
        assert.equal(body.model, "gpt-5.6-luna");
        return {
          ok: true,
          data: {
            output_text: JSON.stringify({ lane: "experience", reason: "More concrete due follow-up evidence." })
          }
        };
      }
    });

    assert.equal(calls, 1);
    assert.equal(decision.lane, "experience");
    assert.equal(decision.decisionMode, "luna_ambiguity");
    assert.equal(decision.modelCalls, 1);
  } finally {
    restoreEnv(original);
  }
});

test("full scheduler no-op does not invoke the ambiguity model", async () => {
  let modelCalls = 0;
  let ledgerWrites = 0;
  const result = await runAriCognitiveScheduler({
    userId: OWNER_ID,
    now: new Date("2026-09-29T03:00:00.000Z"),
    collectSignals: async () => emptySignals(),
    loadEvents: async () => [
      { lane: "repair", createdAt: "2026-09-29T02:00:00.000Z" },
      { lane: "autonomy", createdAt: "2026-09-29T02:00:00.000Z" },
      { lane: "experience", createdAt: "2026-09-29T02:00:00.000Z" },
      { lane: "community", createdAt: "2026-09-29T02:00:00.000Z" },
      { lane: "dreaming", createdAt: "2026-09-29T02:00:00.000Z" },
      { lane: "theory", createdAt: "2026-09-29T02:00:00.000Z" }
    ],
    routeAmbiguity: async () => {
      modelCalls += 1;
      return { lane: "experience" };
    },
    recordEvent: async ({ lane, decisionMode }) => {
      ledgerWrites += 1;
      assert.equal(lane, null);
      assert.equal(decisionMode, "deterministic_noop");
      return { stored: true };
    }
  });

  assert.equal(modelCalls, 0);
  assert.equal(ledgerWrites, 1);
  assert.equal(result.acted, false);
  assert.equal(result.reason, "no_material_work");
});

test("atomic budget reservation calls the server-side reservation RPC before provider work", async () => {
  const original = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ARI_BACKGROUND_DAILY_BUDGET_USD: process.env.ARI_BACKGROUND_DAILY_BUDGET_USD,
    ARI_BACKGROUND_MONTHLY_BUDGET_USD: process.env.ARI_BACKGROUND_MONTHLY_BUDGET_USD
  };
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
  process.env.ARI_BACKGROUND_DAILY_BUDGET_USD = "1";
  process.env.ARI_BACKGROUND_MONTHLY_BUDGET_USD = "20";

  const calls = [];
  try {
    const reservation = await reserveBackgroundAiBudget({
      userId: OWNER_ID,
      requestCategory: "ari_test_background",
      model: "gpt-5.6-terra",
      requestBody: { model: "gpt-5.6-terra", input: "test", max_output_tokens: 1000 },
      fetcher: async (url, options = {}) => {
        calls.push({ url: String(url), options });
        if (String(url).includes("/ai_provider_usage_logs")) return response([]);
        if (String(url).includes("/ari_background_ai_budget_counters")) return response([]);
        if (String(url).includes("/rpc/ari_reserve_background_ai_budget")) {
          const body = JSON.parse(options.body);
          assert.equal(body.p_user_id, OWNER_ID);
          assert.equal(body.p_request_category, "ari_test_background");
          assert.ok(body.p_estimated_cost_usd > 0);
          return response({
            allowed: true,
            reason: "reserved",
            reservationId: "22222222-2222-4222-8222-222222222222",
            dailyCommittedUsd: body.p_estimated_cost_usd,
            monthlyCommittedUsd: body.p_estimated_cost_usd
          });
        }
        throw new Error(`unexpected URL: ${url}`);
      }
    });

    assert.equal(reservation.allowed, true);
    assert.equal(reservation.reservationId, "22222222-2222-4222-8222-222222222222");
    assert.ok(calls.some((item) => item.url.includes("/rpc/ari_reserve_background_ai_budget")));
  } finally {
    restoreEnv(original);
  }
});

test("web-search-capable background calls reserve more than token-only calls", () => {
  const base = estimateBackgroundReservationUsd({
    model: "gpt-5.6-terra",
    requestBody: { input: "same", max_output_tokens: 1000 }
  });
  const withSearch = estimateBackgroundReservationUsd({
    model: "gpt-5.6-terra",
    requestBody: { input: "same", max_output_tokens: 1000, tools: [{ type: "web_search" }] }
  });
  assert.ok(withSearch >= base + 0.05);
});

test("Vercel crons keep autonomous AI loops behind one hybrid scheduler", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const paths = (config.crons || []).map((item) => item.path);

  assert.ok(paths.includes("/api/ari-cognitive-cycle"));
  assert.ok(paths.includes("/api/ari-agent-worker"));
  for (const oldPath of [
    "/api/ari-experience-cycle",
    "/api/ari-autonomy-cycle",
    "/api/ari-dreaming-cycle",
    "/api/ari-community-cycle",
    "/api/ari-chatgpt-dialogue-cycle",
    "/api/ari-theory-dialogue-cycle"
  ]) {
    assert.equal(paths.includes(oldPath), false, `${oldPath} should not retain an independent cron`);
  }
});

test("hybrid scheduler migration keeps trigger and reservation state server-only", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/20260929032805_ari_hybrid_cognitive_scheduler.sql", import.meta.url),
    "utf8"
  );
  assert.match(sql, /ari_vnext_cognitive_schedule_events/);
  assert.match(sql, /ari_vnext_cognitive_triggers/);
  assert.match(sql, /ari_background_ai_budget_reservations/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /security invoker/i);
  assert.match(sql, /revoke execute[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant execute[\s\S]*to service_role/i);
});

function emptySignals() {
  return {
    repair: { activityScore: 0, urgent: false },
    autonomy: { activityScore: 0, urgent: false },
    experience: { activityScore: 0, urgent: false },
    community: { activityScore: 0, urgent: false },
    dreaming: { activityScore: 0, urgent: false },
    theory: { activityScore: 0, urgent: false }
  };
}

function eligibleCandidate(lane, score) {
  return {
    lane,
    eligible: true,
    urgent: false,
    starved: false,
    score,
    activityScore: 0.7,
    hoursSinceLastSelection: 13,
    overdueRatio: 1.1,
    starvationRatio: 0.4,
    signal: { reason: "test" }
  };
}

function response(payload, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: { get: () => null },
    json: async () => payload
  };
}

function restoreEnv(values) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
