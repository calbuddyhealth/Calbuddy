import {
  sendOwnerAuthorizationError,
  setOwnerSecurityHeaders,
  verifyOwnerRequest
} from "../server/ari-owner-auth.js";
import {
  buildIntelligenceControlCookies,
  normalizeReasoningProfile,
  readIntelligenceControlCookies,
  resolveAriIntelligenceEntitlement
} from "../server/ari-intelligence-entitlement.js";

export default async function handler(req, res) {
  setOwnerSecurityHeaders(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ success: false, error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" });
  }

  const authorization = await verifyOwnerRequest(req);
  if (!authorization?.authorized) return sendOwnerAuthorizationError(res, authorization);

  if (req.method === "GET") {
    const controls = readIntelligenceControlCookies(req);
    return res.status(200).json({
      success: true,
      controls,
      entitlement: resolveAriIntelligenceEntitlement({
        userId: authorization.user?.id,
        controls
      }),
      ownerOnly: true,
      premiumRolloutEnabled: String(process.env.ARI_PREMIUM_ADVANCED_ENABLED || "").toLowerCase() === "true"
    });
  }

  const body = resolveBody(req);
  const enabled = body?.enabled === true;
  const reasoningProfile = normalizeReasoningProfile(body?.reasoningProfile);
  const controls = { enabled, reasoningProfile };

  res.setHeader("Set-Cookie", buildIntelligenceControlCookies(controls));

  return res.status(200).json({
    success: true,
    controls,
    entitlement: resolveAriIntelligenceEntitlement({
      userId: authorization.user?.id,
      controls
    }),
    message: enabled
      ? "Advanced Ari owner beta is enabled on this device."
      : "Advanced Ari owner beta is disabled on this device."
  });
}

function resolveBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req?.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}
