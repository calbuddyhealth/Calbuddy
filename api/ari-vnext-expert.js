import { buildCurrentTurn, cleanText } from "./_lib/ari-vnext/current-turn.js";
import { buildRelevantContext, routeContext } from "./_lib/ari-vnext/context-router.js";
import { deriveCoachingState } from "./_lib/ari-vnext/coaching-state.js";
import { deriveLongitudinalState } from "./_lib/ari-vnext/longitudinal-state.js";
import { retrieveRelevantMemories } from "./_lib/ari-vnext/memory-service.js";
import { deriveMetacognition } from "./_lib/ari-vnext/metacognition.js";
import { applyOutcomeLearning } from "./_lib/ari-vnext/outcome-learning.js";
import { classifySafety } from "./_lib/ari-vnext/safety-policy.js";
import { deriveScientificIntelligence } from "./_lib/ari-vnext/scientific-intelligence.js";

const AUTH_TIMEOUT_MS = 3500;

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed.", source: "ari_vnext_expert" });
  }

  const startedAt = Date.now();
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return res.status(auth.status || 401).json({
        success: false,
        error: auth.message || "Authentication required.",
        code: auth.code || "AUTH_REQUIRED",
        source: "ari_vnext_expert"
      });
    }

    const body = resolveBody(req);
    const turn = buildCurrentTurn(body, auth.userId);
    if (!turn.message) {
      return res.status(400).json({ success: false, error: "Message is required.", source: "ari_vnext_expert" });
    }

    const route = routeContext(turn);
    const safety = classifySafety(turn, route);
    let retrievedMemoryCount = 0;

    if (route.memory || route.training || route.nutrition || route.goals) {
      const retrieved = await retrieveRelevantMemories({
        userId: auth.userId,
        message: turn.message,
        limit: route.memory ? 6 : 5
      });
      retrievedMemoryCount = retrieved.memories.length;
      turn.memory = [turn.memory, retrieved.summary].filter(Boolean).join("\n").slice(0, 6000);
    }

    const relevantContext = buildRelevantContext(turn, route);
    const coachingState = deriveCoachingState({ turn, route, context: relevantContext });
    const longitudinalState = deriveLongitudinalState({ route, context: relevantContext });
    const metacognition = deriveMetacognition({
      route,
      context: relevantContext,
      safety,
      coachingState,
      longitudinalState
    });
    const rawScientific = deriveScientificIntelligence({
      turn,
      route,
      context: relevantContext,
      coachingState,
      longitudinalState,
      metacognition
    });
    const scientificIntelligence = applyOutcomeLearning(rawScientific, relevantContext?.relevantMemory || "");

    return res.status(200).json({
      success: true,
      ready: true,
      source: "ari_vnext_expert",
      userScoped: true,
      readOnly: true,
      route,
      metacognition,
      coachingState,
      longitudinalState,
      scientificIntelligence,
      consult: buildConsultSummary({ route, metacognition, longitudinalState, scientificIntelligence }),
      memoryCount: retrievedMemoryCount,
      timing: { totalMs: Date.now() - startedAt }
    });
  } catch (error) {
    console.error("[ARI vNext Expert]", error?.message || error);
    return res.status(normalizeStatus(error?.status)).json({
      success: false,
      ready: false,
      error: error?.message || "Ari expert intelligence could not complete the request.",
      source: "ari_vnext_expert",
      timing: { totalMs: Date.now() - startedAt }
    });
  }
}

function buildConsultSummary({ route = {}, metacognition = {}, longitudinalState = null, scientificIntelligence = null } = {}) {
  const hypotheses = Array.isArray(scientificIntelligence?.hypotheses) ? scientificIntelligence.hypotheses : [];
  const leading = hypotheses[0] || null;
  const alternative = hypotheses.find((item) => item.status === "credible_alternative") || hypotheses[1] || null;
  const experiment = scientificIntelligence?.experiment || null;
  const question = scientificIntelligence?.nextQuestion || null;

  return {
    domain: route.training ? "training" : route.nutrition ? "nutrition" : route.goals ? "goals" : "general",
    evidenceConfidence: metacognition?.confidence || "unknown",
    missingEvidence: Array.isArray(metacognition?.missingEvidence) ? metacognition.missingEvidence : [],
    programStance: longitudinalState?.programDecision?.stance || null,
    leadingHypothesis: leading ? compactHypothesis(leading) : null,
    credibleAlternative: alternative ? compactHypothesis(alternative) : null,
    highestValueQuestion: question
      ? { text: cleanText(question.text, 500), decisionValue: Number(question.decisionValue || 0), why: cleanText(question.why, 600) }
      : null,
    experiment: experiment
      ? {
          readiness: experiment.readiness || null,
          hypothesisId: experiment.hypothesisId || null,
          durationDays: Number.isFinite(Number(experiment.durationDays)) ? Number(experiment.durationDays) : null,
          intervention: cleanText(experiment.intervention || experiment.reason, 900),
          supportsHypothesisIf: cleanText(experiment.supportsHypothesisIf, 700) || null,
          weakensHypothesisIf: cleanText(experiment.weakensHypothesisIf, 700) || null
        }
      : null,
    outcomeLearningApplied: Boolean(scientificIntelligence?.outcomeLearning?.applied)
  };
}

function compactHypothesis(item = {}) {
  return {
    id: item.id || null,
    label: cleanText(item.label, 300),
    score: Number.isFinite(Number(item.score)) ? Number(item.score) : null,
    status: item.status || null,
    supportingEvidence: (Array.isArray(item.supportingEvidence) ? item.supportingEvidence : []).slice(0, 5),
    contradictingEvidence: (Array.isArray(item.contradictingEvidence) ? item.contradictingEvidence : []).slice(0, 4),
    unknowns: (Array.isArray(item.unknowns) ? item.unknowns : []).slice(0, 4),
    outcomeAdjustment: Number.isFinite(Number(item.outcomeAdjustment)) ? Number(item.outcomeAdjustment) : 0
  };
}

async function authenticateRequest(req) {
  const authorization = cleanText(req?.headers?.authorization, 6000);
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const accessToken = cleanText(match?.[1], 6000);
  if (!accessToken) return { authenticated: false, status: 401, code: "AUTH_TOKEN_MISSING", message: "A signed-in ARI session is required." };

  const supabaseUrl = cleanText(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const apiKey = cleanText(
    process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    6000
  );
  if (!supabaseUrl || !apiKey) {
    return { authenticated: false, status: 503, code: "AUTH_SERVICE_UNAVAILABLE", message: "ARI authentication service is not configured." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: apiKey, Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    const user = data?.user || data;
    const userId = cleanText(user?.id, 200);
    if (!response.ok || !userId) {
      return { authenticated: false, status: 401, code: "AUTH_TOKEN_INVALID", message: "The ARI session is no longer valid." };
    }
    return { authenticated: true, userId };
  } catch (error) {
    return {
      authenticated: false,
      status: 503,
      code: error?.name === "AbortError" ? "AUTH_VERIFICATION_TIMEOUT" : "AUTH_VERIFICATION_FAILED",
      message: "ARI could not verify the signed-in session."
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function resolveBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req?.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function normalizeStatus(status) {
  const number = Number(status);
  return Number.isFinite(number) && number >= 400 && number <= 599 ? Math.floor(number) : 500;
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Expert", "v1");
}
