// ARI vNext — per-turn supplemental compute governor.
// The primary user-facing model call is not counted here. This ledger bounds
// extra council/reflection/benchmark calls spawned around a single user turn.

import { estimateOpenAICost } from "../ai-provider-usage.js";

export const ARI_TURN_COMPUTE_GOVERNOR_VERSION = "1.0.0";

export function createTurnComputeGovernor({
  route = {},
  safety = {},
  intelligenceEntitlement = null,
  message = ""
} = {}) {
  const owner = intelligenceEntitlement?.ownerEligible === true;
  const band = String(route?.reasoningDemand?.band || fallbackBand(route)).toLowerCase();
  const explicitBenchmark = /\b(?:blind benchmark|benchmark|compare .*astra|astra.*compare|versus astra|vs\.? astra)\b/i.test(String(message || ""));
  const highStakes = safety?.highStakes === true;

  if (!owner) {
    return baseState({ band, maxCalls: 0, maxUsd: 0, reason: "non_owner_no_supplemental_compute", explicitBenchmark });
  }

  if (highStakes) {
    return baseState({
      band,
      maxCalls: boundedInt(process.env.ARI_TURN_COMPUTE_HIGH_STAKES_MAX_CALLS, 1, 0, 4),
      maxUsd: positiveNumber(process.env.ARI_TURN_COMPUTE_HIGH_STAKES_MAX_USD, 0.12),
      reason: "high_stakes_bounded",
      explicitBenchmark: false
    });
  }

  if (explicitBenchmark) {
    return baseState({
      band,
      maxCalls: boundedInt(process.env.ARI_TURN_COMPUTE_BENCHMARK_MAX_CALLS, 4, 1, 8),
      maxUsd: positiveNumber(process.env.ARI_TURN_COMPUTE_BENCHMARK_MAX_USD, 1.25),
      reason: "explicit_benchmark_allowance",
      explicitBenchmark: true
    });
  }

  if (band === "critical") {
    return baseState({
      band,
      maxCalls: boundedInt(process.env.ARI_TURN_COMPUTE_CRITICAL_MAX_CALLS, 3, 0, 6),
      maxUsd: positiveNumber(process.env.ARI_TURN_COMPUTE_CRITICAL_MAX_USD, 0.35),
      reason: "critical_turn",
      explicitBenchmark: false
    });
  }

  if (band === "high") {
    return baseState({
      band,
      maxCalls: boundedInt(process.env.ARI_TURN_COMPUTE_HIGH_MAX_CALLS, 2, 0, 5),
      maxUsd: positiveNumber(process.env.ARI_TURN_COMPUTE_HIGH_MAX_USD, 0.18),
      reason: "high_turn",
      explicitBenchmark: false
    });
  }

  if (band === "medium") {
    return baseState({
      band,
      maxCalls: boundedInt(process.env.ARI_TURN_COMPUTE_MEDIUM_MAX_CALLS, 1, 0, 3),
      maxUsd: positiveNumber(process.env.ARI_TURN_COMPUTE_MEDIUM_MAX_USD, 0.08),
      reason: "medium_turn",
      explicitBenchmark: false
    });
  }

  return baseState({
    band,
    maxCalls: 0,
    maxUsd: 0,
    reason: "routine_single_pass",
    explicitBenchmark: false
  });
}

export function reserveTurnCompute({
  turn = {},
  category = "supplemental",
  model = "",
  inputChars = 0,
  maxOutputTokens = 800,
  minimumReservationUsd = 0.002
} = {}) {
  const ledger = turn?.context?.turnComputeGovernor;
  if (!ledger || ledger.version !== ARI_TURN_COMPUTE_GOVERNOR_VERSION) {
    return { allowed: false, reason: "turn_compute_governor_missing", reservationUsd: 0 };
  }

  const estimatedInputTokens = Math.max(1, Math.ceil(Number(inputChars || 0) / 4));
  const estimatedOutputTokens = Math.max(1, Math.ceil(Number(maxOutputTokens || 0) * 1.15));
  const estimate = estimateOpenAICost({
    model,
    usage: {
      inputTokens: estimatedInputTokens,
      cachedInputTokens: 0,
      outputTokens: estimatedOutputTokens
    }
  });
  const priced = Math.max(0, Number(estimate?.estimatedCostUsd) || 0);
  const reservationUsd = roundMoney(Math.max(priced, Number(minimumReservationUsd) || 0.002));

  if (ledger.usedCalls + 1 > ledger.maxCalls) {
    ledger.blocked.push({ category: clean(category, 120), reason: "turn_call_cap", reservationUsd });
    return { allowed: false, reason: "turn_call_cap", reservationUsd };
  }
  if (ledger.usedUsd + reservationUsd > ledger.maxUsd + 1e-9) {
    ledger.blocked.push({ category: clean(category, 120), reason: "turn_cost_cap", reservationUsd });
    return { allowed: false, reason: "turn_cost_cap", reservationUsd };
  }

  ledger.usedCalls += 1;
  ledger.usedUsd = roundMoney(ledger.usedUsd + reservationUsd);
  ledger.reservations.push({
    category: clean(category, 120),
    model: clean(model, 120) || null,
    reservationUsd,
    estimatedInputTokens,
    estimatedOutputTokens,
    pricingSource: estimate?.pricingSource || null
  });
  return {
    allowed: true,
    reason: "reserved",
    reservationUsd,
    remainingCalls: Math.max(0, ledger.maxCalls - ledger.usedCalls),
    remainingUsd: roundMoney(Math.max(0, ledger.maxUsd - ledger.usedUsd))
  };
}

export function publicTurnComputeGovernor(ledger = null) {
  if (!ledger || ledger.version !== ARI_TURN_COMPUTE_GOVERNOR_VERSION) return null;
  return {
    version: ledger.version,
    band: ledger.band,
    reason: ledger.reason,
    maxSupplementalCalls: ledger.maxCalls,
    usedSupplementalCalls: ledger.usedCalls,
    maxSupplementalUsd: roundMoney(ledger.maxUsd),
    reservedSupplementalUsd: roundMoney(ledger.usedUsd),
    blockedCount: ledger.blocked.length,
    explicitBenchmark: ledger.explicitBenchmark === true
  };
}

function baseState({ band, maxCalls, maxUsd, reason, explicitBenchmark }) {
  return {
    version: ARI_TURN_COMPUTE_GOVERNOR_VERSION,
    band,
    reason,
    explicitBenchmark: explicitBenchmark === true,
    maxCalls: Math.max(0, Number(maxCalls) || 0),
    maxUsd: roundMoney(Math.max(0, Number(maxUsd) || 0)),
    usedCalls: 0,
    usedUsd: 0,
    reservations: [],
    blocked: []
  };
}
function fallbackBand(route = {}) {
  if (route?.complexity === "deep") return "high";
  if (route?.complexity === "standard") return "medium";
  return "low";
}
function boundedInt(value, fallback, min, max) {
  const parsed = Math.floor(Number(value));
  return Math.max(min, Math.min(max, Number.isFinite(parsed) ? parsed : fallback));
}
function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}
function roundMoney(value) {
  return Number((Number(value) || 0).toFixed(6));
}
function clean(value, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}
