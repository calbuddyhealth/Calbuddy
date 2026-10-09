// ARI vNext — episode-level economics for model-routing evaluation.
//
// Per-call price is not a useful routing target when retries and unreliable
// multi-step execution compound. These labels are stored beside the provider's
// measured token cost so offline aggregation can compare models by cost per
// verified successful episode without treating fluent prose as tool success.

export const ARI_TASK_ECONOMICS_VERSION = "1.0.0";

export function deriveTaskEconomics({ turn = {}, result = {} } = {}) {
  const verification = firstVerification(result);
  const actionType = clean(result?.action?.type, 120) || null;
  const developer = result?.route?.developer === true;
  const toolEpisode = Boolean(actionType || verification || developer);
  const verificationStatus = normalizeVerificationStatus(verification, result);
  const delivered = result?.success === true && Boolean(
    clean(result?.reply, 12000) || actionType || result?.provider?.id
  );
  const verifiedSuccess = verificationStatus === "passed";
  const failed = result?.success === false || verificationStatus === "failed";
  const outcome = failed
    ? "failed"
    : verifiedSuccess
      ? "verified_success"
      : toolEpisode
        ? delivered ? "delivered_unverified" : "incomplete"
        : delivered ? "conversation_delivered" : "incomplete";

  return {
    version: ARI_TASK_ECONOMICS_VERSION,
    episodeId: clean(turn?.turnId, 200) || null,
    conversationId: clean(turn?.conversationId, 200) || null,
    taskClass: developer ? "developer" : actionType ? "application_action" : "conversation",
    actionType,
    model: clean(result?.provider?.model || result?.modelPolicy?.model, 160) || null,
    costTier: clean(result?.modelPolicy?.costTier, 120) || null,
    providerAttempts: Math.max(1, Number(result?.provider?.recovery?.attempts || 1)),
    providerRecovered: result?.provider?.recovery?.recovered === true,
    verificationEligible: toolEpisode,
    verificationStatus,
    delivered,
    verifiedSuccess,
    outcome
  };
}

function firstVerification(result = {}) {
  return result?.executionEvidence?.verification ||
    result?.action?.executionEvidence?.verification ||
    result?.developerExecution?.verification ||
    result?.developerTask?.verification ||
    null;
}

function normalizeVerificationStatus(verification, result) {
  const explicit = clean(verification?.status, 40).toLowerCase();
  if (["passed", "failed", "pending", "unverified"].includes(explicit)) return explicit;
  if (result?.action?.verified === true) return "passed";
  if (result?.action?.verified === false) return "failed";
  return "not_applicable";
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
