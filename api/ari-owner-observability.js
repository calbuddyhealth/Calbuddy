import {
  sendOwnerAuthorizationError,
  setOwnerSecurityHeaders,
  verifyOwnerRequest
} from "../server/ari-owner-auth.js";
import {
  ARI_OWNER_DIAGNOSTICS_VERSION,
  loadRecentAriDiagnostics
} from "./_lib/ari-vnext/owner-diagnostics.js";

export default async function handler(req, res) {
  setOwnerSecurityHeaders(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" });
  }

  const authorization = await verifyOwnerRequest(req);
  if (!authorization?.authorized) return sendOwnerAuthorizationError(res, authorization);

  const result = await loadRecentAriDiagnostics({
    ownerAuthorization: authorization,
    subjectUserId: firstQueryValue(req?.query?.userId),
    limit: firstQueryValue(req?.query?.limit) || 25
  });

  if (!result.success) {
    return res.status(result.status || 503).json({
      success: false,
      code: result.code || "OBSERVABILITY_UNAVAILABLE",
      version: ARI_OWNER_DIAGNOSTICS_VERSION,
      ownerOnly: true
    });
  }

  return res.status(200).json(result);
}

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}
