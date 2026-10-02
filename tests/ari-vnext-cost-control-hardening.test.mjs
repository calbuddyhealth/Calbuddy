import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  backgroundAiDisabledReason,
  isBackgroundAiEnabled,
  isBackgroundWorkerEnabled
} from "../api/_lib/background-ai-switch.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { resolveOwnerInteractiveModel } from "../api/_lib/ari-vnext/cost-router.js";
import {
  ARI_TURN_COMPUTE_GOVERNOR_VERSION,
  createTurnComputeGovernor,
  publicTurnComputeGovernor,
  reserveTurnCompute
} from "../api/_lib/ari-vnext/turn-compute-governor.js";

function owner() {
  return { ownerEligible: true, advancedEnabled: true };
}

test("background AI and workers are frozen by default and require explicit opt-in", () => {
  const before = {
    ARI_BACKGROUND_AI_ENABLED: process.env.ARI_BACKGROUND_AI_ENABLED,
    ARI_DURABLE_AGENT_ASYNC_ENABLED: process.env.ARI_DURABLE_AGENT_ASYNC_ENABLED
  };
  try {
    delete process.env.ARI_BACKGROUND_AI_ENABLED;
    delete process.env.ARI_DURABLE_AGENT_ASYNC_ENABLED;
    assert.equal(isBackgroundAiEnabled(), false);
    assert.equal(isBackgroundWorkerEnabled("ARI_DURABLE_AGENT_ASYNC_ENABLED"), false);
    assert.equal(backgroundAiDisabledReason("ARI_DURABLE_AGENT_ASYNC_ENABLED"), "background_ai_master_disabled");

    process.env.ARI_BACKGROUND_AI_ENABLED = "true";
    assert.equal(isBackgroundWorkerEnabled("ARI_DURABLE_AGENT_ASYNC_ENABLED"), false);
    process.env.ARI_DURABLE_AGENT_ASYNC_ENABLED = "true";
    assert.equal(isBackgroundWorkerEnabled("ARI_DURABLE_AGENT_ASYNC_ENABLED"), true);
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("turn compute governor keeps routine work single-pass and scales bounded supplemental compute", () => {
  const routine = createTurnComputeGovernor({
    route: { complexity: "fast", reasoningDemand: { band: "low" } },
    intelligenceEntitlement: owner(),
    message: "Hey"
  });
  const medium = createTurnComputeGovernor({
    route: { complexity: "standard", reasoningDemand: { band: "medium" } },
    intelligenceEntitlement: owner(),
    message: "Review this design."
  });
  const critical = createTurnComputeGovernor({
    route: { complexity: "deep", reasoningDemand: { band: "critical" } },
    intelligenceEntitlement: owner(),
    message: "Analyze this architecture failure."
  });
  const benchmark = createTurnComputeGovernor({
    route: { complexity: "deep", reasoningDemand: { band: "critical" } },
    intelligenceEntitlement: owner(),
    message: "Run a blind benchmark comparing Sol harness vs Astra."
  });

  assert.equal(routine.version, ARI_TURN_COMPUTE_GOVERNOR_VERSION);
  assert.equal(routine.maxCalls, 0);
  assert.equal(medium.maxCalls, 1);
  assert.equal(critical.maxCalls, 3);
  assert.equal(benchmark.explicitBenchmark, true);
  assert.ok(benchmark.maxCalls > critical.maxCalls);
});

test("explicit Astra benchmarks keep the primary answer on Sol even for deep tasks", () => {
  const route = routeContext({
    message: "Benchmark this deep repository architecture against Astra and compare the failure modes.",
    history: [],
    context: { intelligenceEntitlement: owner() }
  });
  assert.equal(route.astraBenchmarkIntent, true);

  const routing = resolveOwnerInteractiveModel({
    mode: "deep",
    route: {
      ...route,
      developer: true,
      solEscalationEligible: true,
      messageLength: 2400
    },
    reasoningProfile: "adaptive"
  });
  assert.equal(routing.model, process.env.OPENAI_ARI_OWNER_SOL_MODEL || "gpt-6.1-sol");
  assert.equal(routing.escalated, false);
  assert.equal(routing.reason, "sol_benchmark_primary");
});

test("supplemental reservations share one call and dollar ledger", () => {
  const governor = createTurnComputeGovernor({
    route: { reasoningDemand: { band: "medium" } },
    intelligenceEntitlement: owner(),
    message: "Review this."
  });
  const turn = { context: { turnComputeGovernor: governor } };

  const first = reserveTurnCompute({
    turn,
    category: "critic",
    model: "gpt-6-luna",
    inputChars: 2000,
    maxOutputTokens: 500
  });
  const second = reserveTurnCompute({
    turn,
    category: "extra_critic",
    model: "gpt-6-luna",
    inputChars: 2000,
    maxOutputTokens: 500
  });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, false);
  assert.equal(second.reason, "turn_call_cap");
  const publicState = publicTurnComputeGovernor(governor);
  assert.equal(publicState.usedSupplementalCalls, 1);
  assert.equal(publicState.blockedCount, 1);
});

test("repo hard-freezes background worker execution paths and declares no Vercel crons", async () => {
  const [agentWorker, moderationWorker, backgroundBudget, scheduler, vercel] = await Promise.all([
    readFile(new URL("../api/ari-agent-worker.js", import.meta.url), "utf8"),
    readFile(new URL("../api/ari-circle-moderation-worker.js", import.meta.url), "utf8"),
    readFile(new URL("../api/_lib/background-ai-budget.js", import.meta.url), "utf8"),
    readFile(new URL("../api/_lib/ari-vnext/cognitive-scheduler.js", import.meta.url), "utf8"),
    readFile(new URL("../vercel.json", import.meta.url), "utf8")
  ]);

  assert.match(agentWorker, /isBackgroundWorkerEnabled\("ARI_DURABLE_AGENT_ASYNC_ENABLED"\)/);
  assert.match(moderationWorker, /isBackgroundWorkerEnabled\("ARI_CIRCLE_MODERATION_WORKER_ENABLED"\)/);
  assert.match(backgroundBudget, /background_ai_master_disabled/);
  assert.match(scheduler, /isBackgroundAiEnabled\(\)/);
  assert.deepEqual(JSON.parse(vercel).crons, []);
});

test("turn governor is wired into live Ari and supplemental systems consume it", async () => {
  const [api, council, reflection, arena] = await Promise.all([
    readFile(new URL("../api/ari-vnext.js", import.meta.url), "utf8"),
    readFile(new URL("../api/_lib/ari-vnext/multi-agent-orchestrator.js", import.meta.url), "utf8"),
    readFile(new URL("../api/_lib/ari-vnext/adaptive-strategy-reflection.js", import.meta.url), "utf8"),
    readFile(new URL("../api/_lib/ari-vnext/blind-reasoning-arena.js", import.meta.url), "utf8")
  ]);

  assert.match(api, /createTurnComputeGovernor/);
  assert.match(api, /institutional_memory_learning/);
  assert.match(api, /agent_performance_learning/);
  assert.match(council, /reserveTurnCompute/);
  assert.match(reflection, /reserveTurnCompute/);
  assert.match(arena, /benchmark_astra_challenger/);
  assert.match(arena, /benchmarkKind:\s*astraBenchmark \? "sol_harness_vs_astra"/);
});
