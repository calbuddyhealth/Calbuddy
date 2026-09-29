import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { estimateOpenAICost } from "../api/_lib/ai-provider-usage.js";
import { getBackgroundAiBudgetStatus } from "../api/_lib/background-ai-budget.js";
import { chooseCognitiveLane } from "../api/_lib/ari-vnext/cognitive-scheduler.js";

test("GPT-5.6 family pricing is recorded correctly", () => {
  const usage = { inputTokens: 1_000_000, cachedInputTokens: 200_000, outputTokens: 100_000 };

  const sol = estimateOpenAICost({ model: "gpt-5.6-sol", usage });
  const terra = estimateOpenAICost({ model: "gpt-5.6-terra", usage });
  const luna = estimateOpenAICost({ model: "gpt-5.6-luna", usage });
  const alias = estimateOpenAICost({ model: "gpt-5.6", usage });

  assert.equal(sol.estimatedCostUsd, 5.28);
  assert.equal(terra.estimatedCostUsd, 2.84);
  assert.equal(luna.estimatedCostUsd, 0.164);
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
      fetcher: async () => ({
        ok: true,
        json: async () => [
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
            created_at: "2026-09-27T12:00:00.000Z",
            usage_type: "chat",
            request_category: "interactive_owner_chat",
            estimated_cost_usd: 9.5
          }
        ]
      })
    });

    assert.equal(status.allowed, false);
    assert.equal(status.reason, "daily_budget_reached");
    assert.equal(status.dailySpendUsd, 1.03);
    assert.equal(status.monthlySpendUsd, 1.03);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("cognitive router has a deterministic no-provider fallback", async () => {
  const priorKey = process.env.ARI_PROVIDER_API_KEY;
  const priorOpenAiKey = process.env.OPENAI_API_KEY;
  delete process.env.ARI_PROVIDER_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const decision = await chooseCognitiveLane({
      userId: "owner",
      candidates: [
        { lane: "autonomy", overdueRatio: 2.2, priority: 1.3 },
        { lane: "dreaming", overdueRatio: 1.1, priority: 0.8 }
      ],
      budget: {}
    });
    assert.deepEqual(decision, {
      lane: "autonomy",
      reason: "deterministic_overdue_fallback"
    });
  } finally {
    if (priorKey === undefined) delete process.env.ARI_PROVIDER_API_KEY;
    else process.env.ARI_PROVIDER_API_KEY = priorKey;
    if (priorOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = priorOpenAiKey;
  }
});

test("Vercel crons consolidate autonomous AI loops behind one scheduler", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const paths = (config.crons || []).map((item) => item.path);

  assert.ok(paths.includes("/api/ari-cognitive-cycle"));
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
