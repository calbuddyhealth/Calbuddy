import {
  sendOwnerAuthorizationError,
  setOwnerSecurityHeaders,
  verifyOwnerRequest
} from "../server/ari-owner-auth.js";

export default async function handler(req, res) {
  setOwnerSecurityHeaders(res);

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      isOwner: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED"
    });
  }

  const authorization = await verifyOwnerRequest(req);

  if (!authorization.authorized) {
    return sendOwnerAuthorizationError(res, authorization);
  }

  return res.status(200).json({
    success: true,
    isOwner: true,
    authorizationMode: authorization.mode
  });
}
