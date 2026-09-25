import {
  sendOwnerAuthorizationError,
  setOwnerSecurityHeaders,
  verifyOwnerRequest
} from "../server/ari-owner-auth.js";
import {
  listAgentMailboxMessages,
  mailboxStatus,
  readAgentMailboxMessage,
  sendAgentMailboxMessage
} from "../server/ari-artifactory-mailbox.js";

export default async function handler(req, res) {
  setOwnerSecurityHeaders(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed." });
  }

  const authorization = await verifyOwnerRequest(req);
  if (!authorization.authorized) {
    return sendOwnerAuthorizationError(res, authorization);
  }

  try {
    if (req.method === "GET") {
      const query = req.query || {};
      const action = String(query.action || "list").trim().toLowerCase();

      if (action === "status") {
        return res.status(200).json(mailboxStatus());
      }

      if (action === "read") {
        const result = await readAgentMailboxMessage({
          path: String(query.path || "")
        });
        return res.status(result.success ? 200 : statusFor(result)).json(result);
      }

      const result = await listAgentMailboxMessages({
        recipient: String(query.recipient || ""),
        sender: String(query.sender || ""),
        kind: String(query.kind || ""),
        limit: Number(query.limit) || 50
      });
      return res.status(result.success ? 200 : statusFor(result)).json(result);
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const action = String(body.action || "send").trim().toLowerCase();
    if (action !== "send") {
      return res.status(400).json({
        success: false,
        code: "ARTIFACTORY_MAILBOX_ACTION_INVALID",
        error: "Unsupported mailbox action."
      });
    }

    const result = await sendAgentMailboxMessage({
      sender: body.sender || "owner",
      recipient: body.recipient || "ari-orchestrator",
      kind: body.kind || "status",
      threadId: body.threadId || null,
      replyTo: body.replyTo || null,
      subject: body.subject || "",
      payload: body.payload || {},
      metadata: {
        ...(body.metadata && typeof body.metadata === "object" ? body.metadata : {}),
        source: "owner_mailbox_api",
        ownerUserId: authorization.user?.id || null
      }
    });

    return res.status(result.success ? 201 : statusFor(result)).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "ARTIFACTORY_MAILBOX_API_FAILED",
      error: error?.message || "Agent mailbox request failed."
    });
  }
}

function statusFor(result = {}) {
  if (result.code === "ARTIFACTORY_MAILBOX_NOT_CONFIGURED") return 503;
  if (/INVALID|TOO_LARGE/.test(String(result.code || ""))) return 400;
  if (Number(result.status) >= 400 && Number(result.status) <= 599) return Number(result.status);
  return 502;
}
