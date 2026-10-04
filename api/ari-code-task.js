// Owner-triggered durable ARI coding tasks. No scheduled/background execution.

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
import {
  createAgentTaskSession,
  loadAgentTaskSession,
  updateAgentTaskSession
} from "./_lib/ari-vnext/agent-task-store.js";
import {
  createDeveloperTaskExecution,
  markDeveloperTaskVerification,
  normalizeDeveloperTaskExecution,
  planDeveloperEvidenceBatch,
  publicDeveloperTaskExecution,
  recordDeveloperTaskArtifact,
  recordDeveloperTaskEvidence
} from "./_lib/ari-vnext/developer-task-execution.js";

export const config = { maxDuration: 120 };

export default async function handler(req, res) {
  setOwnerSecurityHeaders(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, code: "METHOD_NOT_ALLOWED" });
  }

  const authorization = await verifyOwnerRequest(req);
  if (!authorization.authorized) return sendOwnerAuthorizationError(res, authorization);
  const userId = authorization.user?.id || "";

  const token = clean(process.env.GITHUB_TOKEN, 8000);
  const repo = clean(process.env.GITHUB_REPO, 300);
  const productionBranch = clean(process.env.GITHUB_BRANCH, 180) || "main";
  if (!token || !repo) {
    return res.status(500).json({ success: false, code: "CODE_TASK_GITHUB_NOT_CONFIGURED" });
  }

  try {
    const action = clean(req.body?.action, 40).toLowerCase() || "run";
    const taskId = clean(req.body?.taskId, 140);
    if (!taskId) return res.status(400).json({ success: false, code: "CODE_TASK_ID_REQUIRED" });
    const executionSessionId = `developer_task:${taskId}`.slice(0, 180);

    if (action === "start") {
      const task = await ensureTaskSession({ userId, executionSessionId, taskId, body: req.body || {} });
      return res.status(task?.success ? 200 : 500).json(task);
    }

    const loaded = await loadAgentTaskSession({ userId, executionSessionId });
    if (!loaded) {
      if (action === "run") {
        const created = await ensureTaskSession({ userId, executionSessionId, taskId, body: req.body || {} });
        if (!created.success) return res.status(500).json(created);
      } else {
        return res.status(404).json({ success: false, code: "CODE_TASK_NOT_FOUND" });
      }
    }

    let session = await loadAgentTaskSession({ userId, executionSessionId });
    let state = normalizeDeveloperTaskExecution(session?.plan?.developerTask);
    if (!state) return res.status(500).json({ success: false, code: "CODE_TASK_STATE_INVALID" });

    if (action === "status") {
      return res.status(200).json({ success: true, task: publicDeveloperTaskExecution(state), durableTaskId: session.id, backgroundWorkerUsed: false });
    }

    if (action === "batch") {
      return res.status(200).json({ success: true, batch: planDeveloperEvidenceBatch(state, req.body?.maxItems), task: publicDeveloperTaskExecution(state) });
    }

    if (action === "record_evidence") {
      const recorded = recordDeveloperTaskEvidence(state, req.body?.evidence || {});
      state = recorded.state;
      session = await persistTaskState({ userId, session, state });
      return res.status(200).json({ success: true, reused: recorded.reused, revisionChanged: recorded.revisionChanged, task: publicDeveloperTaskExecution(state), durableTaskId: session?.id || null });
    }

    if (action === "verify") {
      const branch = clean(req.body?.branch, 180) || isolatedTaskBranch(taskId);
      const latestCommit = [...state.artifacts].reverse().find(item => item?.kind === "code_commit");
      const commitSha = clean(req.body?.commitSha, 80) || clean(latestCommit?.revision, 80);
      const result = await readIsolatedCodeTaskStatus({ token, repo, branch, commitSha });
      const verificationStatus = result?.verification?.status === "passed"
        ? "passed"
        : result?.verification?.status === "failed"
          ? "failed"
          : result?.verification?.attempted === true ? "attempted" : "requested";
      const evidenceId = result?.runId ? `ci:${result.runId}` : `ci:${branch}:${commitSha || "pending"}`;
      const recorded = recordDeveloperTaskEvidence(state, {
        id: evidenceId,
        kind: "verification",
        source: result?.runUrl || branch,
        revision: result?.commitSha || commitSha || null,
        summary: result?.verification?.summary || "Verification status checked.",
        verified: verificationStatus === "passed"
      });
      const criterionIds = Array.isArray(req.body?.criterionIds)
        ? req.body.criterionIds
        : verificationStatus === "passed" && state.completionCriteria.length === 1
          ? [state.completionCriteria[0].id]
          : [];
      state = markDeveloperTaskVerification(recorded.state, {
        status: verificationStatus,
        summary: result?.verification?.summary || "Verification status checked.",
        evidenceRef: evidenceId,
        criterionIds
      });
      session = await persistTaskState({ userId, session, state });
      return res.status(result?.success === false ? 400 : 200).json({ success: result?.success !== false, verification: result, task: publicDeveloperTaskExecution(state), durableTaskId: session?.id || null });
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
    if (!result?.success) return res.status(400).json(result);

    state = recordDeveloperTaskArtifact(state, {
      id: `code_commit:${result.commitSha}`,
      kind: "code_commit",
      label: result.branch,
      locator: result.commitUrl,
      revision: result.commitSha,
      verified: false
    });
    state = markDeveloperTaskVerification(state, {
      status: "requested",
      summary: "The isolated commit exists; verification must pass before completion.",
      evidenceRef: `code_commit:${result.commitSha}`
    });
    session = await persistTaskState({ userId, session, state });

    return res.status(200).json({
      ...result,
      task: publicDeveloperTaskExecution(state),
      durableTaskId: session?.id || null,
      backgroundWorkerUsed: false
    });
  } catch (error) {
    console.error("Ari code task error:", clean(error?.message || error, 500));
    return res.status(Number(error?.status) >= 400 && Number(error?.status) < 600 ? Number(error.status) : 500).json({
      success: false,
      code: error?.code || "ARI_CODE_TASK_FAILED",
      error: clean(error?.message || error, 500)
    });
  }
}

async function ensureTaskSession({ userId, executionSessionId, taskId, body = {} } = {}) {
  const existing = await loadAgentTaskSession({ userId, executionSessionId });
  if (existing?.plan?.developerTask) {
    return { success: true, created: false, durableTaskId: existing.id, task: publicDeveloperTaskExecution(existing.plan.developerTask), backgroundWorkerUsed: false };
  }
  const state = createDeveloperTaskExecution({
    taskId,
    executionSessionId,
    goal: body.goal || body.commitMessage || `Complete coding task ${taskId}`,
    completionCriteria: body.completionCriteria || [],
    questions: body.questions || []
  });
  const created = await createAgentTaskSession({
    userId,
    executionSessionId,
    conversationId: clean(body.conversationId, 180) || null,
    rootTurnId: clean(body.turnId, 180) || null,
    goal: state.goal,
    successCriteria: state.completionCriteria.map(item => item.label).join(" | ").slice(0, 1200),
    plan: { developerTask: state },
    maxRounds: 1
  });
  return { success: created.stored === true, created: created.reason === "created", durableTaskId: created.session?.id || null, task: publicDeveloperTaskExecution(created.session?.plan?.developerTask || state), backgroundWorkerUsed: false, reason: created.reason };
}

async function persistTaskState({ userId, session, state } = {}) {
  const result = await updateAgentTaskSession({
    userId,
    taskId: session.id,
    patch: {
      status: sessionStatus(state.stage),
      plan: { ...(session.plan || {}), developerTask: state },
      verification: state.verification,
      nextStep: state.nextStep,
      ...(state.stage === "verified" ? { completedAt: state.completedAt || new Date().toISOString() } : {})
    }
  });
  return result.session || session;
}

function sessionStatus(stage) {
  if (stage === "planning") return "planning";
  if (["investigating", "ready_to_change", "changed"].includes(stage)) return "running";
  if (stage === "verifying") return "verifying";
  if (stage === "verified") return "completed";
  if (stage === "abandoned") return "abandoned";
  if (stage === "failed") return "failed";
  return "waiting";
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
