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
import { ARI_ADAPTIVE_STRATEGY_VERSION } from "./_lib/ari-vnext/adaptive-strategy.js";
import {
  ARI_COGNITIVE_LOOP_VERSION,
  ARI_COGNITIVE_STATE_VERSION,
  isOwnerCognitiveLoopEnabled
} from "./_lib/ari-vnext/cognitive-loop.js";
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
      runtime: runtimeSummary(entitlement),
      cognitiveLoop: cognitiveLoopSummary(entitlement),
      adaptiveStrategyLayer: adaptiveStrategySummary(entitlement),
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
    runtime: runtimeSummary(entitlement),
    cognitiveLoop: cognitiveLoopSummary(entitlement),
    adaptiveStrategyLayer: adaptiveStrategySummary(entitlement),
    storage: "server",
    premiumRolloutEnabled: String(process.env.ARI_PREMIUM_ADVANCED_ENABLED || "").toLowerCase() === "true",
    message: entitlement.advancedEnabled
      ? "Advanced Ari owner beta is enabled for your account."
      : "Advanced Ari owner beta is disabled for your account."
  });
}

function runtimeSummary(entitlement = null) {
  const cognitiveLoopActive = isOwnerCognitiveLoopEnabled(entitlement);
  return {
    advancedModel: process.env.OPENAI_ARI_ADVANCED_MODEL || "gpt-5.6",
    modelFamily: "GPT-5.6 Sol",
    responsesApi: true,
    conversationContractVersion: ADVANCED_CONVERSATION_CONTRACT_VERSION,
    cognitiveLoopVersion: ARI_COGNITIVE_LOOP_VERSION,
    cognitiveStateVersion: ARI_COGNITIVE_STATE_VERSION,
    cognitiveLoopActive,
    cognitiveLoopOwnerOnly: true,
    adaptiveStrategyVersion: ARI_ADAPTIVE_STRATEGY_VERSION,
    adaptiveStrategyActive: cognitiveLoopActive,
    adaptiveStrategyOwnerOnly: true,
    serverBackedControls: true
  };
}

function cognitiveLoopSummary(entitlement = null) {
  return {
    available: entitlement?.cognitiveLoopAllowed === true,
    active: isOwnerCognitiveLoopEnabled(entitlement),
    ownerOnly: true,
    version: ARI_COGNITIVE_LOOP_VERSION,
    stateVersion: ARI_COGNITIVE_STATE_VERSION,
    storesHiddenChainOfThought: false
  };
}

function adaptiveStrategySummary(entitlement = null) {
  const active = isOwnerCognitiveLoopEnabled(entitlement);
  return {
    available: entitlement?.cognitiveLoopAllowed === true,
    active,
    ownerOnly: true,
    selfUpdating: true,
    version: ARI_ADAPTIVE_STRATEGY_VERSION,
    persistentStrategies: true,
    outcomeDrivenPromotion: true,
    automaticRetirement: true,
    applicationPermissionsUnchanged: true,
    storesHiddenChainOfThought: false
  };
}

function resolveBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req?.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}
