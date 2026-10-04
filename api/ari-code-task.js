// Owner-triggered ARI coding task endpoint. No scheduled/background execution.

import {
  sendOwnerAuthorizationError,
  setOwnerSecurityHeaders,
  verifyOwnerRequest
} from "../server/ari-owner-auth.js";
import {
  isolatedTaskBranch,
  readIsolatedCodeTaskStatus,
  runIsolatedCodeTask,
  validateCodeTaskPatches
} from "./_lib/ari-vnext/developer-coding-runner.js";

export const config = { maxDuration: 120 };

export default async function handler(req, res) {
  setOwnerSecurityHeaders(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, code: "METHOD_NOT_ALLOWED" });
  }

  const authorization = await verifyOwnerRequest(req);
  if (!authorization.authorized) return sendOwnerAuthorizationError(res, authorization);

  const token = clean(process.env.GITHUB_TOKEN, 8000);
  const repo = clean(process.env.GITHUB_REPO, 300);
  const productionBranch = clean(process.env.GITHUB_BRANCH, 180) || "main";
  if (!token || !repo) {
    return res.status(500).json({ success: false, code: "CODE_TASK_GITHUB_NOT_CONFIGURED" });
  }

  try {
    const action = clean(req.body?.action, 40).toLowerCase() || "run";
    const taskId = clean(req.body?.taskId, 180);
    if (!taskId) return res.status(400).json({ success: false, code: "CODE_TASK_ID_REQUIRED" });

    if (action === "status") {
      const branch = clean(req.body?.branch, 180) || isolatedTaskBranch(taskId);
      const result = await readIsolatedCodeTaskStatus({
        token,
        repo,
        branch,
        commitSha: clean(req.body?.commitSha, 80)
      });
      return res.status(result?.success === false ? 400 : 200).json(result);
    }

    if (action !== "run") {
      return res.status(400).json({ success: false, code: "CODE_TASK_ACTION_INVALID" });
    }

    const validation = validateCodeTaskPatches(req.body?.patches);
    if (!validation.valid) return res.status(400).json({ success: false, ...validation });

    const result = await runIsolatedCodeTask({
      token,
      repo,
      productionBranch,
      taskId,
      patches: validation.patches,
      commitMessage: clean(req.body?.commitMessage, 240) || `Ari coding task ${taskId}`
    });
    return res.status(result?.success === false ? 400 : 200).json(result);
  } catch (error) {
    console.error("Ari code task error:", clean(error?.message || error, 500));
    return res.status(Number(error?.status) >= 400 && Number(error?.status) < 600 ? Number(error.status) : 500).json({
      success: false,
      code: error?.code || "ARI_CODE_TASK_FAILED",
      error: clean(error?.message || error, 500)
    });
  }
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
