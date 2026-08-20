// ARI vNext — server-only persistence and lifecycle for adaptive strategies.

import {
  deriveAdaptiveStrategyContextDomains,
  deriveAdaptiveStrategyState,
  evaluateStrategyOutcome,
  normalizeAdaptiveStrategyProposal
} from "./adaptive-strategy.js";

const STRATEGY_TABLE = "ari_vnext_adaptive_strategies";
const USE_TABLE = "ari_vnext_strategy_uses";
const TIMEOUT_MS = 1100;

export async function prepareAdaptiveStrategiesForTurn({ userId, route = {}, message = "" } = {}) {
  const id = cleanUserId(userId);
  if (!id) return emptyPreparation();

  const feedbackResolution = await resolveLatestPendingStrategyUses({
    userId: id,
    feedback: classifyFeedback(message)
  });
  const rows = await loadActiveStrategyRows({ userId: id });
  return {
    state: deriveAdaptiveStrategyState({ strategies: rows, route }),
    feedbackResolution
  };
}

export async function recordAdaptiveStrategyUses({ userId, strategies = [], turnId, route = {} } = {}) {
  const id = cleanUserId(userId);
  const turn = clean(turnId, 220);
  const config = supabaseConfig();
  const active = (Array.isArray(strategies) ? strategies : [])
    .filter((item) => clean(item?.id, 120))
    .slice(0, 6);
  if (!id || !turn || !config || !active.length) return { stored: 0 };

  const contextDomains = [...deriveAdaptiveStrategyContextDomains(route)].slice(0, 8);
  const rows = active.map((item) => ({
    user_id: id,
    strategy_id: clean(item.id, 120),
    turn_id: turn,
    outcome: "pending",
    context_domains: contextDomains
  }));

  try {
    const params = new URLSearchParams({ on_conflict: "user_id,strategy_id,turn_id" });
    const response = await timedFetch(`${config.url}/rest/v1/${USE_TABLE}?${params.toString()}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "resolution=ignore-duplicates,return=minimal" }),
      body: JSON.stringify(rows)
    }, TIMEOUT_MS);
    return { stored: response.ok ? rows.length : 0 };
  } catch {
    return { stored: 0 };
  }
}

export async function upsertAdaptiveStrategyProposal({ userId, proposal, sourceModel = null } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  const normalized = normalizeAdaptiveStrategyProposal(proposal);
  if (!id || !config || !normalized) return { stored: false, reason: "invalid_proposal" };

  const existing = await loadStrategyByKey({ userId: id, strategyKey: normalized.strategyKey });
  if (existing?.status === "retired") {
    return { stored: false, reason: "retired_strategy_key_locked", strategy: existing };
  }

  if (["adopted", "practical_prior"].includes(existing?.status)) {
    const sameInstruction = canonical(existing.instruction) === canonical(normalized.instruction);
    if (!sameInstruction) {
      return { stored: false, reason: "mature_strategy_requires_new_key", strategy: existing };
    }
  }

  const now = new Date().toISOString();
  const row = existing
    ? {
        title: normalized.title,
        instruction: normalized.instruction,
        rationale: normalized.rationale,
        lesson_summary: normalized.lessonSummary || existing.lessonSummary || normalized.rationale,
        domains: normalized.domains,
        confidence: Math.min(1, Math.max(Number(existing.confidence || 0), normalized.confidence)),
        source_model: clean(sourceModel, 120) || existing.sourceModel || null,
        replaces_strategy_key: normalized.replacesStrategyKey,
        user_visible_summary: normalized.userVisibleSummary,
        updated_at: now
      }
    : {
        user_id: id,
        strategy_key: normalized.strategyKey,
        title: normalized.title,
        instruction: normalized.instruction,
        rationale: normalized.rationale,
        lesson_summary: normalized.lessonSummary || normalized.rationale,
        domains: normalized.domains,
        status: "testing",
        confidence: normalized.confidence,
        maturity_score: 0,
        source_model: clean(sourceModel, 120) || null,
        replaces_strategy_key: normalized.replacesStrategyKey,
        user_visible_summary: normalized.userVisibleSummary,
        metadata: {
          createdBy: "ari_adaptive_strategy_reflection",
          hiddenChainOfThoughtStored: false,
          practicalPriorEligible: true
        },
        updated_at: now
      };

  try {
    const response = existing
      ? await timedFetch(`${config.url}/rest/v1/${STRATEGY_TABLE}?id=eq.${encodeURIComponent(existing.id)}&user_id=eq.${id}`, {
          method: "PATCH",
          headers: serverHeaders(config.key, { Prefer: "return=representation" }),
          body: JSON.stringify(row)
        }, TIMEOUT_MS)
      : await timedFetch(`${config.url}/rest/v1/${STRATEGY_TABLE}`, {
          method: "POST",
          headers: serverHeaders(config.key, { Prefer: "return=representation" }),
          body: JSON.stringify(row)
        }, TIMEOUT_MS);
    const data = await response.json().catch(() => []);
    const saved = Array.isArray(data) ? data[0] : data;
    return response.ok && saved
      ? { stored: true, created: !existing, strategy: normalizeRow(saved) }
      : { stored: false, reason: "strategy_write_failed" };
  } catch {
    return { stored: false, reason: "strategy_write_failed" };
  }
}

async function resolveLatestPendingStrategyUses({ userId, feedback = "neutral" } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config) return { resolved: 0, feedback: "neutral", lifecycleChanges: [] };

  try {
    const params = new URLSearchParams({
      user_id: `eq.${id}`,
      outcome: "eq.pending",
      select: "id,strategy_id,turn_id,context_domains,created_at",
      order: "created_at.desc",
      limit: "12"
    });
    const response = await timedFetch(`${config.url}/rest/v1/${USE_TABLE}?${params.toString()}`, {
      headers: serverHeaders(config.key)
    }, TIMEOUT_MS);
    if (!response.ok) return { resolved: 0, feedback, lifecycleChanges: [] };
    const rows = await response.json().catch(() => []);
    if (!Array.isArray(rows) || !rows.length) return { resolved: 0, feedback, lifecycleChanges: [] };

    const latestTurnId = clean(rows[0]?.turn_id, 220);
    const latestUses = rows.filter((row) => clean(row?.turn_id, 220) === latestTurnId).slice(0, 6);
    const strategyIds = [...new Set(latestUses.map((row) => clean(row?.strategy_id, 120)).filter(Boolean))];
    if (!latestTurnId || !strategyIds.length) return { resolved: 0, feedback, lifecycleChanges: [] };

    const strategies = await loadStrategiesByIds({ userId: id, ids: strategyIds });
    const now = new Date();
    const lifecycleChanges = [];

    for (const strategy of strategies) {
      const maturityEvidence = await loadMaturityEvidence({
        userId: id,
        strategyId: strategy.id,
        currentTurnId: latestTurnId,
        currentFeedback: feedback
      });
      if (strategy.replacesStrategyKey) {
        const target = await loadStrategyByKey({ userId: id, strategyKey: strategy.replacesStrategyKey });
        maturityEvidence.replacementTargetStatus = target?.status || null;
      }

      const evaluated = evaluateStrategyOutcome(strategy, feedback, now, maturityEvidence);
      const next = evaluated.strategy;
      const patch = {
        status: next.status,
        confidence: next.confidence,
        maturity_score: next.maturityScore,
        trials: next.trials,
        positive_outcomes: next.positiveOutcomes,
        negative_outcomes: next.negativeOutcomes,
        neutral_outcomes: next.neutralOutcomes,
        last_used_at: next.lastUsedAt,
        adopted_at: next.adoptedAt,
        matured_at: next.maturedAt,
        retired_at: next.retiredAt,
        updated_at: now.toISOString()
      };
      const patchResponse = await timedFetch(
        `${config.url}/rest/v1/${STRATEGY_TABLE}?id=eq.${encodeURIComponent(strategy.id)}&user_id=eq.${id}`,
        {
          method: "PATCH",
          headers: serverHeaders(config.key, { Prefer: "return=representation" }),
          body: JSON.stringify(patch)
        },
        TIMEOUT_MS
      );
      const savedData = await patchResponse.json().catch(() => []);
      const saved = Array.isArray(savedData) ? savedData[0] : savedData;
      if (patchResponse.ok && saved && evaluated.statusChanged) {
        const normalized = normalizeRow(saved);
        lifecycleChanges.push({
          strategy: normalized,
          priorStatus: evaluated.priorStatus,
          nextStatus: evaluated.nextStatus,
          outcome: evaluated.outcome,
          maturityScore: evaluated.maturityScore
        });
        if (["adopted", "practical_prior"].includes(evaluated.nextStatus) && normalized.replacesStrategyKey) {
          await retireReplacedStrategy({ userId: id, strategyKey: normalized.replacesStrategyKey, now });
        }
      }
    }

    const useParams = new URLSearchParams({
      user_id: `eq.${id}`,
      turn_id: `eq.${latestTurnId}`,
      outcome: "eq.pending"
    });
    const useResponse = await timedFetch(`${config.url}/rest/v1/${USE_TABLE}?${useParams.toString()}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
      body: JSON.stringify({ outcome: feedback, resolved_at: now.toISOString() })
    }, TIMEOUT_MS);

    return {
      resolved: useResponse.ok ? latestUses.length : 0,
      feedback,
      turnId: latestTurnId,
      lifecycleChanges
    };
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI Adaptive Strategy] Outcome resolution failed:", error?.message || error);
    return { resolved: 0, feedback, lifecycleChanges: [] };
  }
}

async function loadMaturityEvidence({ userId, strategyId, currentTurnId, currentFeedback } = {}) {
  const id = cleanUserId(userId);
  const strategy = clean(strategyId, 120);
  const config = supabaseConfig();
  if (!id || !strategy || !config) return emptyMaturityEvidence();
  try {
    const params = new URLSearchParams({
      user_id: `eq.${id}`,
      strategy_id: `eq.${strategy}`,
      select: "turn_id,outcome,context_domains,created_at",
      order: "created_at.desc",
      limit: "40"
    });
    const response = await timedFetch(`${config.url}/rest/v1/${USE_TABLE}?${params.toString()}`, {
      headers: serverHeaders(config.key)
    }, TIMEOUT_MS);
    if (!response.ok) return emptyMaturityEvidence();
    const rows = await response.json().catch(() => []);
    if (!Array.isArray(rows)) return emptyMaturityEvidence();

    const normalized = rows.map((row) => {
      const isCurrent = clean(row?.turn_id, 220) === clean(currentTurnId, 220);
      const outcome = isCurrent && row?.outcome === "pending"
        ? normalizeOutcome(currentFeedback)
        : normalizeOutcome(row?.outcome);
      const domains = (Array.isArray(row?.context_domains) ? row.context_domains : ["conversation"])
        .map((item) => clean(item, 40))
        .filter(Boolean)
        .sort();
      return { outcome, contextKey: domains.join("+") || "conversation" };
    });
    const resolved = normalized.filter((item) => item.outcome !== "pending");
    const recent = resolved.slice(0, 6);
    return {
      distinctContextCount: new Set(resolved.map((item) => item.contextKey)).size,
      resolvedUseCount: resolved.length,
      recentResolvedCount: recent.length,
      recentNegativeCount: recent.filter((item) => item.outcome === "negative").length,
      replacementTargetStatus: null
    };
  } catch {
    return emptyMaturityEvidence();
  }
}

async function loadActiveStrategyRows({ userId } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config) return [];
  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    status: "in.(testing,adopted,practical_prior)",
    select: "id,strategy_key,title,instruction,rationale,lesson_summary,domains,status,confidence,maturity_score,trials,positive_outcomes,negative_outcomes,neutral_outcomes,source_model,replaces_strategy_key,user_visible_summary,first_proposed_at,last_used_at,adopted_at,matured_at,retired_at,updated_at",
    order: "updated_at.desc",
    limit: "18"
  });
  try {
    const response = await timedFetch(`${config.url}/rest/v1/${STRATEGY_TABLE}?${params.toString()}`, {
      headers: serverHeaders(config.key)
    }, TIMEOUT_MS);
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.map(normalizeRow).filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function loadStrategyByKey({ userId, strategyKey } = {}) {
  const id = cleanUserId(userId);
  const key = clean(strategyKey, 100);
  const config = supabaseConfig();
  if (!id || !key || !config) return null;
  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    strategy_key: `eq.${key}`,
    select: "*",
    limit: "1"
  });
  try {
    const response = await timedFetch(`${config.url}/rest/v1/${STRATEGY_TABLE}?${params.toString()}`, {
      headers: serverHeaders(config.key)
    }, TIMEOUT_MS);
    if (!response.ok) return null;
    const rows = await response.json().catch(() => []);
    return normalizeRow(Array.isArray(rows) ? rows[0] : rows);
  } catch {
    return null;
  }
}

async function loadStrategiesByIds({ userId, ids = [] } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  const safeIds = (Array.isArray(ids) ? ids : []).map((value) => clean(value, 120)).filter(Boolean).slice(0, 6);
  if (!id || !config || !safeIds.length) return [];
  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    id: `in.(${safeIds.join(",")})`,
    select: "*",
    limit: String(safeIds.length)
  });
  try {
    const response = await timedFetch(`${config.url}/rest/v1/${STRATEGY_TABLE}?${params.toString()}`, {
      headers: serverHeaders(config.key)
    }, TIMEOUT_MS);
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.map(normalizeRow).filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function retireReplacedStrategy({ userId, strategyKey, now = new Date() } = {}) {
  const id = cleanUserId(userId);
  const key = clean(strategyKey, 100);
  const config = supabaseConfig();
  if (!id || !key || !config) return false;
  try {
    const params = new URLSearchParams({
      user_id: `eq.${id}`,
      strategy_key: `eq.${key}`,
      status: "in.(adopted,practical_prior)"
    });
    const response = await timedFetch(`${config.url}/rest/v1/${STRATEGY_TABLE}?${params.toString()}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
      body: JSON.stringify({ status: "retired", retired_at: now.toISOString(), updated_at: now.toISOString() })
    }, TIMEOUT_MS);
    return response.ok;
  } catch {
    return false;
  }
}

function classifyFeedback(message) {
  const text = clean(message, 3000).toLowerCase();
  if (!text) return "neutral";
  if (/\b(that's wrong|you(?:'re| are) wrong|not what i (?:meant|asked|wanted)|you misunderstood|that doesn't make sense|that's not what i mean|that's worse|stop doing that|don't do that again|incorrect)\b/.test(text)) return "negative";
  if (/\b(exactly|that's better|that is better|much better|perfect|you got it|that's what i mean|that's what i wanted|good answer|i like that approach)\b/.test(text)) return "positive";
  return "neutral";
}

function normalizeRow(row) {
  if (!row || typeof row !== "object") return null;
  return {
    id: clean(row.id, 120),
    strategyKey: clean(row.strategy_key, 100),
    title: clean(row.title, 140),
    instruction: clean(row.instruction, 700),
    rationale: clean(row.rationale, 500),
    lessonSummary: clean(row.lesson_summary || row.rationale, 500),
    domains: Array.isArray(row.domains) ? row.domains.map((item) => clean(item, 40)).filter(Boolean) : ["general"],
    status: clean(row.status, 30) || "testing",
    confidence: Number(row.confidence || 0.65),
    maturityScore: Number(row.maturity_score || 0),
    trials: Math.max(0, Number(row.trials || 0)),
    positiveOutcomes: Math.max(0, Number(row.positive_outcomes || 0)),
    negativeOutcomes: Math.max(0, Number(row.negative_outcomes || 0)),
    neutralOutcomes: Math.max(0, Number(row.neutral_outcomes || 0)),
    sourceModel: clean(row.source_model, 120) || null,
    replacesStrategyKey: clean(row.replaces_strategy_key, 100) || null,
    userVisibleSummary: clean(row.user_visible_summary, 360),
    firstProposedAt: row.first_proposed_at || null,
    lastUsedAt: row.last_used_at || null,
    adoptedAt: row.adopted_at || null,
    maturedAt: row.matured_at || null,
    retiredAt: row.retired_at || null,
    updatedAt: row.updated_at || null
  };
}

function emptyPreparation() {
  return {
    state: {
      version: "0.3.0",
      ownerOnly: true,
      selfUpdating: true,
      nonRegressiveEvolution: true,
      practicalPriorMaturation: true,
      storesHiddenChainOfThought: false,
      domains: [],
      activeCount: 0,
      practicalPriorCount: 0,
      adoptedCount: 0,
      testingCount: 0,
      active: []
    },
    feedbackResolution: { resolved: 0, feedback: "neutral", lifecycleChanges: [] }
  };
}
function emptyMaturityEvidence() {
  return {
    distinctContextCount: 0,
    resolvedUseCount: 0,
    recentResolvedCount: 0,
    recentNegativeCount: 0,
    replacementTargetStatus: null
  };
}
function normalizeOutcome(value) {
  const outcome = clean(value, 20).toLowerCase();
  return ["pending", "positive", "negative", "neutral"].includes(outcome) ? outcome : "neutral";
}
function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
  return url && key ? { url, key } : null;
}
function serverHeaders(key, extra = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json", ...extra };
}
async function timedFetch(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal, cache: "no-store" }); }
  finally { clearTimeout(timer); }
}
function cleanUserId(value) {
  const id = clean(value, 80).toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : "";
}
function canonical(value) {
  return clean(value, 1000).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
