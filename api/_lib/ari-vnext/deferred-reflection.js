import { waitUntil } from "@vercel/functions";
import { buildAdaptiveReflectionPayload, reflectOnAdaptiveStrategy } from "./adaptive-strategy-reflection.js";
import { recordStrategyApplications, upsertAdaptiveStrategyProposal } from "./adaptive-strategy-store.js";
import { recordOpenAIUsage } from "../ai-provider-usage.js";

const TABLE = "ari_vnext_reflection_jobs";

export async function enqueueReflection({ turn, result, adaptiveStrategyState, reflectionContext } = {}) {
  const payload = buildAdaptiveReflectionPayload({ turn, result, adaptiveStrategyState, reflectionContext });
  // Persist a bounded, explicit allowlist; never serialize authorization, provider
  // continuity tokens, raw tool outputs, or the full cognitive workspace.
  const input = {
    preparedPayload: payload,
    turn: { userId: turn.userId, turnId: turn.turnId, message: payload.userMessage,
      context: { turnComputeGovernor: turn.context?.turnComputeGovernor } },
    result: { success: result.success, reply: payload.ariReply, route: result.route,
      safety: { highStakes: result.safety?.highStakes === true },
      action: result.action ? { type: result.action.type } : null,
      modelPolicy: payload.modelPolicy, metacognition: payload.metacognition },
    adaptiveStrategyState: { active: (adaptiveStrategyState?.active || []).map(item => ({ id: item.id, strategyKey: item.strategyKey })) }
  };
  if (JSON.stringify(input).length > 60000) return { queued: false, reason: "reflection_input_too_large" };
  try {
    const rows = await request(`${TABLE}?on_conflict=user_id,turn_id`, { method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: { user_id: turn.userId, turn_id: turn.turnId, input } });
    return { queued: Array.isArray(rows) && rows.length > 0, reason: rows?.length ? "queued_after_response" : "already_queued", jobId: rows?.[0]?.id || null };
  } catch { return { queued: false, reason: "reflection_queue_unavailable" }; }
}

// Called only after the response is sent. No new cron, polling, or worker loop.
// A queued job survives process loss and can be claimed on the next owner turn.
export function scheduleReflectionDrain(userId) {
  waitUntil(drainReflection(userId).catch(() => ({ completed: false, reason: "drain_failed" })));
}

export async function drainReflection(userId, dependencies = {}) {
  const reflect = dependencies.reflect || reflectOnAdaptiveStrategy;
  const propose = dependencies.propose || upsertAdaptiveStrategyProposal;
  const applications = dependencies.applications || recordStrategyApplications;
  const usage = dependencies.usage || recordOpenAIUsage;
  const jobs = await request("rpc/ari_claim_reflection_job", { method: "POST", body: { p_user_id: userId } });
  const job = Array.isArray(jobs) ? jobs[0] : null;
  if (!job) return { completed: false, reason: "no_queued_job" };
  let status = "failed", receipt = { reason: "reflection_failed" };
  try {
    const input = job.input;
    if (input?.turn?.userId !== userId || input?.turn?.turnId !== job.turn_id) throw new Error("reflection_identity_mismatch");
    const result = await reflect(input);
    if (result.provider?.usage) await usage({ userId, endpoint: "/api/ari-vnext", usageType: "reasoning_reflection",
      requestCategory: "ari_adaptive_strategy_reflection", model: result.provider.model,
      responseData: { id: result.provider.id, model: result.provider.model, usage: result.provider.usage },
      providerRequestId: result.provider.id || null, metadata: { turnId: job.turn_id, reflectionJobId: job.id, deferred: true, strategyProposalCreated: Boolean(result.proposal) } });
    const proposal = result.proposal ? await propose({ userId, proposal: result.proposal, sourceModel: result.provider?.model }) : { stored: false };
    const observed = await applications({ userId, turnId: job.turn_id, applications: result.applications || [] });
    const failed = ["timeout", "provider_error", "reflection_failed"].includes(result.reason) || Boolean(result.proposal && !proposal.stored);
    status = failed ? "failed" : result.attempted ? "completed" : "skipped";
    receipt = { reason: failed && result.proposal && !proposal.stored ? "proposal_persistence_failed" : result.reason,
      attempted: result.attempted === true, model: result.provider?.model || null,
      proposalStored: proposal.stored === true, applicationsStored: observed.stored || 0 };
  } catch { receipt = { reason: "reflection_or_persistence_failed" }; }
  await request(`${TABLE}?id=eq.${job.id}&user_id=eq.${userId}&status=eq.running`, {
    method: "PATCH", body: { status, input: {}, receipt, completed_at: new Date().toISOString() }
  });
  return { completed: status === "completed", status, receipt };
}

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("reflection_store_unavailable");
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(1200)
  });
  if (!response.ok) throw new Error("reflection_store_failed");
  return response.status === 204 ? null : await response.json();
}
