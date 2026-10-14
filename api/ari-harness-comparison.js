import { runAriVNext } from "./_lib/ari-vnext/orchestrator.js";
import { COMPARISON_CASES, COMPARISON_SCOPE, runComparisonPair } from "./_lib/ari-vnext/harness-comparison.js";
import { loadAriIntelligenceControls } from "../server/ari-intelligence-control-store.js";
import { resolveAriIntelligenceEntitlement } from "../server/ari-intelligence-entitlement.js";
import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Vary", "Authorization");
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ error: "Method not allowed." });
  try {
    const userId = await authenticateOwner(req);
    if (!userId) return res.status(403).json({ error: "Sign in with the Ari owner account." });
    if (req.method === "GET") {
      const rows = await db(`ari_harness_comparisons?user_id=eq.${userId}&order=created_at.desc&limit=72`);
      return res.status(200).json({ cases: COMPARISON_CASES, scope: COMPARISON_SCOPE, trials: rows });
    }
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    if (!UUID.test(body.trialId || "")) return res.status(400).json({ error: "Valid trial ID required." });
    if (body.action === "vote") {
      if (!["A", "B", "tie", "neither"].includes(body.preference)) return res.status(400).json({ error: "Invalid preference." });
      const rows = await db(`ari_harness_comparisons?user_id=eq.${userId}&trial_id=eq.${body.trialId}&status=eq.completed`, "PATCH", { preference: body.preference });
      return res.status(200).json({ success: rows.length > 0 });
    }
    if (body.action !== "run") return res.status(400).json({ error: "Unsupported action." });
    const task = COMPARISON_CASES.find(x => x.id === body.caseId);
    if (!task) return res.status(400).json({ error: "Choose a supplied test case." });
    const apiKey = process.env.ARI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Server OpenAI connection unavailable." });
    const controls = await loadAriIntelligenceControls({ userId });
    const entitlement = resolveAriIntelligenceEntitlement({ userId, controls });
    if (!entitlement.ownerEligible || !entitlement.advancedEnabled) return res.status(409).json({ error: "Enable owner intelligence before comparing." });
    const prepared = await runAriVNext({ userId, turnId: body.trialId, message: task.prompt,
      history: [], memory: "", preferences: {}, pendingAction: null,
      context: { intelligenceEntitlement: entitlement }, surface: "/ari-harness-comparison", createdAt: "2026-10-14T12:00:00.000Z"
    }, { prepareComparison: true });
    const claim = await db("rpc/reserve_ari_harness_comparison", "POST", { p_user: userId, p_trial: body.trialId, p_case: task.id });
    if (!claim.claimed) return res.status(claim.limit ? 429 : claim.row?.status === "running" ? 202 : 200).json({ replay: true, trial: claim.row || null, error: claim.limit ? "Daily pilot limit reached (24 pairs)." : null });
    let result;
    try {
      result = await runComparisonPair({ prepared, model: "gpt-6.1-sol", apiKey,
        url: process.env.ARI_RESPONSES_URL || process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses" });
      result.commit = process.env.VERCEL_GIT_COMMIT_SHA || "unknown";
      for (const item of result.candidates) {
        if (item.usage) await recordOpenAIUsage({ userId, endpoint: "/api/ari-harness-comparison", requestCategory: "owner_harness_comparison", model: item.model,
          responseData: { usage: item.usage }, providerRequestId: item.providerRequestId,
          metadata: { trialId: body.trialId, caseId: task.id, variant: item.variant, valid: item.valid, latencyMs: item.latencyMs } }).catch(() => {});
      }
    } catch {
      result = { valid: false, error: "Comparison failed. This trial will not be automatically retried." };
    }
    const rows = await db(`ari_harness_comparisons?user_id=eq.${userId}&trial_id=eq.${body.trialId}`, "PATCH", { status: result.valid ? "completed" : "failed", result });
    return res.status(200).json({ trial: rows[0] });
  } catch {
    return res.status(503).json({ error: "Comparison service unavailable. Reload results before retrying; an existing trial may already have consumed tokens." });
  }
}

async function authenticateOwner(req) {
  const token = /^Bearer\s+([^\s]+)$/i.exec(req.headers?.authorization || "")?.[1];
  const owner = String(process.env.ARI_OWNER_USER_ID || "").trim().toLowerCase();
  if (!token || !owner) return null;
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) return null;
  const user = await response.json();
  return String(user.id || "").toLowerCase() === owner ? user.id : null;
}
async function db(path, method = "GET", body) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !process.env.SUPABASE_URL) throw new Error("Storage unavailable");
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    method, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error("Storage operation failed");
  return response.json();
}
