import { cleanText } from "./_lib/ari-vnext/current-turn.js";
import { resolveDecisionForExperiment } from "./_lib/ari-vnext/decision-journal.js";
import {
  cancelExperiment,
  closeExperiment,
  listUserExperiments,
  startExperiment,
  summarizeExperimentLedger
} from "./_lib/ari-vnext/experiment-ledger.js";

const AUTH_TIMEOUT_MS = 3500;

export default async function handler(req, res) {
  setHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed.", source: "ari_vnext_experiments" });
  }

  const startedAt = Date.now();
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return res.status(auth.status || 401).json({
        success: false,
        error: auth.message || "Authentication required.",
        code: auth.code || "AUTH_REQUIRED",
        source: "ari_vnext_experiments"
      });
    }

    const body = resolveBody(req);
    const action = cleanText(body?.action, 80).toLowerCase();

    if (action === "list") {
      const experiments = await listUserExperiments({
        userId: auth.userId,
        statuses: Array.isArray(body?.statuses) ? body.statuses.slice(0, 5) : [],
        limit: Number(body?.limit || 10)
      });
      return res.status(200).json({
        success: true,
        experiments,
        ledger: summarizeExperimentLedger(experiments),
        source: "ari_vnext_experiments",
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    if (action === "start") {
      const scientific = normalizeScientificPayload(body?.scientificIntelligence);
      if (!scientific) {
        return res.status(400).json({ success: false, error: "A valid Ari investigator experiment is required.", code: "EXPERIMENT_PAYLOAD_REQUIRED" });
      }
      const result = await startExperiment({
        userId: auth.userId,
        sourceTurnId: cleanText(body?.sourceTurnId, 200) || null,
        route: normalizeRoute(body?.route),
        scientificIntelligence: scientific
      });
      return res.status(result.success ? 200 : 409).json({ ...result, source: "ari_vnext_experiments", timing: { totalMs: Date.now() - startedAt } });
    }

    if (action === "complete") {
      const result = await closeExperiment({
        userId: auth.userId,
        experimentId: cleanText(body?.experimentId, 200),
        outcomeDirection: cleanText(body?.outcomeDirection, 40),
        result: normalizeResultPayload(body?.result),
        confidenceAfter: body?.confidenceAfter,
        evaluationSource: cleanText(body?.evaluationSource, 120) || "user_and_ari"
      });

      let decisionResolved = false;
      if (result.success && result?.experiment?.hypothesisId) {
        decisionResolved = await resolveDecisionForExperiment({
          userId: auth.userId,
          hypothesisId: result.experiment.hypothesisId,
          outcomeDirection: result.experiment.outcomeDirection || body?.outcomeDirection,
          outcome: {
            experimentId: result.experiment.id,
            result: result.experiment.result || normalizeResultPayload(body?.result),
            confidenceAfter: result.experiment.confidenceAfter ?? body?.confidenceAfter ?? null
          },
          source: "ari_vnext_experiment_ledger"
        });
      }

      return res.status(result.success ? 200 : 409).json({
        ...result,
        decisionResolved,
        source: "ari_vnext_experiments",
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    if (action === "cancel") {
      const result = await cancelExperiment({
        userId: auth.userId,
        experimentId: cleanText(body?.experimentId, 200),
        reason: cleanText(body?.reason, 500) || "cancelled_by_user"
      });
      return res.status(result.success ? 200 : 409).json({ ...result, source: "ari_vnext_experiments", timing: { totalMs: Date.now() - startedAt } });
    }

    return res.status(400).json({ success: false, error: "Unsupported experiment action.", code: "EXPERIMENT_ACTION_UNSUPPORTED" });
  } catch (error) {
    console.warn("[ARI vNext Experiments]", error?.message || error);
    return res.status(500).json({
      success: false,
      error: "Ari experiment ledger is temporarily unavailable.",
      source: "ari_vnext_experiments",
      timing: { totalMs: Date.now() - startedAt }
    });
  }
}

function normalizeScientificPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const experiment = value?.experiment;
  const hypotheses = Array.isArray(value?.hypotheses) ? value.hypotheses : [];
  if (!experiment || experiment?.readiness !== "ready" || !hypotheses.length) return null;

  const hypothesisId = cleanText(experiment?.hypothesisId, 120);
  const selected = hypotheses.find((item) => cleanText(item?.id, 120) === hypothesisId) || hypotheses[0];
  if (!cleanText(selected?.id, 120) || Number(selected?.score || 0) < 0.32) return null;

  return {
    experiment: {
      readiness: "ready",
      hypothesisId: cleanText(experiment?.hypothesisId, 120),
      hypothesis: cleanText(experiment?.hypothesis, 500),
      durationDays: clampInt(experiment?.durationDays, 1, 90, 14),
      intervention: cleanText(experiment?.intervention, 1800),
      holdConstant: arrayText(experiment?.holdConstant, 12, 400),
      measure: arrayText(experiment?.measure, 12, 400),
      baseline: normalizeResultPayload(experiment?.baseline),
      principle: cleanText(experiment?.principle, 900),
      supportsHypothesisIf: cleanText(experiment?.supportsHypothesisIf, 1600),
      weakensHypothesisIf: cleanText(experiment?.weakensHypothesisIf, 1600)
    },
    hypotheses: hypotheses.slice(0, 5).map((item) => ({
      id: cleanText(item?.id, 120),
      label: cleanText(item?.label, 500),
      score: clampNumber(item?.score, 0, 0.98, 0),
      status: cleanText(item?.status, 80)
    }))
  };
}

function normalizeRoute(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    training: source.training === true,
    nutrition: source.nutrition === true,
    goals: source.goals === true
  };
}

function normalizeResultPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}

function arrayText(value, maxItems, maxLength) {
  return (Array.isArray(value) ? value : []).slice(0, maxItems).map((item) => cleanText(item, maxLength)).filter(Boolean);
}

function clampInt(value, min, max, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

async function authenticateRequest(req) {
  const authorization = cleanText(req?.headers?.authorization, 6000);
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const accessToken = cleanText(match?.[1], 6000);
  if (!accessToken) return { authenticated: false, status: 401, code: "AUTH_TOKEN_MISSING", message: "A signed-in ARI session is required." };

  const supabaseUrl = cleanText(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const apiKey = cleanText(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, 6000);
  if (!supabaseUrl || !apiKey) return { authenticated: false, status: 503, code: "AUTH_SERVICE_UNAVAILABLE", message: "ARI authentication service is not configured." };

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
    if (!response.ok || !userId) return { authenticated: false, status: 401, code: "AUTH_TOKEN_INVALID", message: "The ARI session is no longer valid." };
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

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Experiment-Ledger", "v1");
}
