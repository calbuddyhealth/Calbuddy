import {
  claimNextChatgptBrowserJob,
  completeChatgptBrowserJob,
  heartbeatChatgptBrowserWorker,
  workerSecretMatches
} from "../server/ari-chatgpt-browser-bridge.js";

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, code: "METHOD_NOT_ALLOWED" });
  }

  const secret = bearer(req);
  if (!workerSecretMatches(secret)) {
    return res.status(401).json({ success: false, code: "CHATGPT_BROWSER_WORKER_UNAUTHORIZED" });
  }

  const ownerUserId = clean(process.env.ARI_OWNER_USER_ID, 200);
  if (!ownerUserId) {
    return res.status(503).json({ success: false, code: "OWNER_ID_NOT_CONFIGURED" });
  }

  const body = resolveBody(req);
  const operation = clean(body?.operation, 40).toLowerCase();
  const workerId = clean(body?.workerId, 120).toLowerCase();
  const version = clean(body?.version, 80);
  const sessionState = clean(body?.sessionState, 40).toLowerCase();

  if (!workerId) {
    return res.status(400).json({ success: false, code: "CHATGPT_BROWSER_WORKER_ID_REQUIRED" });
  }

  try {
    await heartbeatChatgptBrowserWorker({
      ownerUserId,
      workerId,
      version,
      sessionState,
      status: operation === "complete" ? "online" : "polling"
    });

    if (operation === "claim") {
      const job = await claimNextChatgptBrowserJob({ ownerUserId, workerId });
      return res.status(200).json({ success: true, job });
    }

    if (operation === "complete") {
      const result = await completeChatgptBrowserJob({
        ownerUserId,
        workerId,
        jobId: body?.jobId,
        leaseToken: body?.leaseToken,
        success: body?.success === true,
        responseText: body?.responseText,
        conversationUrl: body?.conversationUrl,
        errorCode: body?.errorCode,
        errorMessage: body?.errorMessage
      });
      return res.status(result?.success ? 200 : 409).json(result);
    }

    return res.status(400).json({ success: false, code: "CHATGPT_BROWSER_WORKER_OPERATION_INVALID" });
  } catch (error) {
    console.warn("[ARI ChatGPT Browser Worker]", error?.message || error);
    return res.status(500).json({
      success: false,
      code: "CHATGPT_BROWSER_WORKER_FAILED"
    });
  }
}

function bearer(req) {
  const header = String(req?.headers?.authorization || "").trim();
  return /^Bearer\s+/i.test(header) ? header.replace(/^Bearer\s+/i, "").trim() : "";
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
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-ChatGPT-Browser-Bridge", "v1");
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
