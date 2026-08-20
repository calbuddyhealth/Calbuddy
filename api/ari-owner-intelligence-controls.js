import {
  sendOwnerAuthorizationError,
  setOwnerSecurityHeaders,
  verifyOwnerRequest
} from "../server/ari-owner-auth.js";
import {
  normalizeReasoningProfile,
  resolveAriIntelligenceEntitlement
} from "../server/ari-intelligence-entitlement.js";
import {
  loadAriCommercialEntitlement,
  loadAriIntelligenceControls,
  saveAriIntelligenceControls
} from "../server/ari-intelligence-control-store.js";
import { ADVANCED_CONVERSATION_CONTRACT_VERSION } from "./_lib/ari-vnext/conversation-contract.js";

export default async function handler(req, res) {
  setOwnerSecurityHeaders(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ success: false, error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" });
  }

  const authorization = await verifyOwnerRequest(req);
  if (!authorization?.authorized) return sendOwnerAuthorizationError(res, authorization);

  const userId = authorization.user?.id;
  const commercial = await loadAriCommercialEntitlement({ userId });

  if (req.method === "GET") {
    const controls = await loadAriIntelligenceControls({ userId });
    return res.status(200).json({
      success: true,
      controls,
      entitlement: resolveAriIntelligenceEntitlement({
        userId,
        controls,
        subscriptionTier: commercial.subscriptionTier,
        subscriptionStatus: commercial.subscriptionStatus
      }),
      runtime: runtimeSummary(),
      ownerOnly: true,
      storage: "server",
      premiumRolloutEnabled: String(process.env.ARI_PREMIUM_ADVANCED_ENABLED || "").toLowerCase() === "true"
    });
  }

  const body = resolveBody(req);
  const controls = await saveAriIntelligenceControls({
    userId,
    enabled: body?.enabled === true,
    reasoningProfile: normalizeReasoningProfile(body?.reasoningProfile)
  });

  const entitlement = resolveAriIntelligenceEntitlement({
    userId,
    controls,
    subscriptionTier: commercial.subscriptionTier,
    subscriptionStatus: commercial.subscriptionStatus
  });

  return res.status(200).json({
    success: true,
    controls,
    entitlement,
    runtime: runtimeSummary(),
    storage: "server",
    premiumRolloutEnabled: String(process.env.ARI_PREMIUM_ADVANCED_ENABLED || "").toLowerCase() === "true",
    message: entitlement.advancedEnabled
      ? "Advanced Ari owner beta is enabled for your account."
      : "Advanced Ari owner beta is disabled for your account."
  });
}

function runtimeSummary() {
  return {
    advancedModel: process.env.OPENAI_ARI_ADVANCED_MODEL || "gpt-5.6",
    modelFamily: "GPT-5.6 Sol",
    responsesApi: true,
    conversationContractVersion: ADVANCED_CONVERSATION_CONTRACT_VERSION,
    serverBackedControls: true
  };
}

function resolveBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req?.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}
