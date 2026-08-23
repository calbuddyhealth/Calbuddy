import {
  sendOwnerAuthorizationError,
  setOwnerSecurityHeaders,
  verifyOwnerRequest
} from "../../server/ari-owner-auth.js";

const GITHUB_API_VERSION = "2022-11-28";

const WORKFLOWS = Object.freeze([
  {
    id: "readiness",
    name: "ARI XP Readiness",
    file: "app-store-readiness-tests.yml",
    description: "Node tests and browser smoke tests across critical app surfaces."
  },
  {
    id: "ios",
    name: "iOS Native Validation",
    file: "ios-native-generate.yml",
    description: "Safari-to-iOS parity, Capacitor sync, simulator build, and release build."
  },
  {
    id: "ari-trust",
    name: "Ari + Nutrition Trust",
    file: "ari-vnext-tests.yml",
    description: "Ari vNext and nutrition trust/data-integrity deterministic tests."
  }
]);

function getGitHubConfiguration() {
  const token = String(process.env.GITHUB_TOKEN || "").trim();
  const repo = String(process.env.GITHUB_REPO || "").trim();
  const branch = String(process.env.GITHUB_BRANCH || "main").trim() || "main";

  return {
    token,
    repo,
    branch,
    configured: Boolean(token && repo && branch)
  };
}

async function githubRequest(configuration, path, options = {}) {
  const response = await fetch(
    `https://api.github.com/repos/${configuration.repo}${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${configuration.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        ...(options.headers || {})
      }
    }
  );

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data?.message || "GitHub request failed.");
    error.status = response.status;
    error.code = "GITHUB_ACTIONS_REQUEST_FAILED";
    throw error;
  }

  return data;
}

function classifyRun(run) {
  if (!run) return "unknown";
  if (run.status === "queued" || run.status === "in_progress" || run.status === "waiting" || run.status === "requested" || run.status === "pending") {
    return "running";
  }
  if (run.status !== "completed") return "unknown";
  if (run.conclusion === "success") return "passed";
  if (run.conclusion === "neutral" || run.conclusion === "skipped") return "warning";
  return "failed";
}

function normalizeRun(workflow, run) {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    workflowFile: workflow.file,
    state: classifyRun(run),
    status: run?.status || null,
    conclusion: run?.conclusion || null,
    runNumber: run?.run_number || null,
    event: run?.event || null,
    startedAt: run?.run_started_at || run?.created_at || null,
    updatedAt: run?.updated_at || null,
    headSha: run?.head_sha || null,
    url: run?.html_url || null
  };
}

function overallState(workflows) {
  const states = workflows.map(item => item.state);
  if (states.includes("failed")) return "needs_attention";
  if (states.includes("running")) return "running";
  if (states.every(state => state === "passed")) return "healthy";
  if (states.includes("warning")) return "warning";
  return "unknown";
}

async function getLatestRun(configuration, workflow) {
  const data = await githubRequest(
    configuration,
    `/actions/workflows/${encodeURIComponent(workflow.file)}/runs?branch=${encodeURIComponent(configuration.branch)}&per_page=1`
  );

  return Array.isArray(data?.workflow_runs) ? data.workflow_runs[0] || null : null;
}

async function getHealthSnapshot(configuration) {
  const runResults = await Promise.all(
    WORKFLOWS.map(async workflow => {
      try {
        return normalizeRun(workflow, await getLatestRun(configuration, workflow));
      } catch (error) {
        return {
          ...normalizeRun(workflow, null),
          error: error?.message || "Workflow status unavailable."
        };
      }
    })
  );

  let commitSha = null;
  try {
    const branchInfo = await githubRequest(
      configuration,
      `/branches/${encodeURIComponent(configuration.branch)}`
    );
    commitSha = branchInfo?.commit?.sha || null;
  } catch {
    commitSha = null;
  }

  return {
    success: true,
    overall: overallState(runResults),
    branch: configuration.branch,
    commitSha,
    checkedAt: new Date().toISOString(),
    workflows: runResults
  };
}

async function dispatchBugSweep(configuration) {
  const results = [];

  for (const workflow of WORKFLOWS) {
    try {
      const latest = await getLatestRun(configuration, workflow);
      const state = classifyRun(latest);

      if (state === "running") {
        results.push({
          id: workflow.id,
          name: workflow.name,
          accepted: true,
          alreadyRunning: true
        });
        continue;
      }

      await githubRequest(
        configuration,
        `/actions/workflows/${encodeURIComponent(workflow.file)}/dispatches`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref: configuration.branch })
        }
      );

      results.push({
        id: workflow.id,
        name: workflow.name,
        accepted: true,
        alreadyRunning: false
      });
    } catch (error) {
      results.push({
        id: workflow.id,
        name: workflow.name,
        accepted: false,
        alreadyRunning: false,
        error: error?.message || "Could not start workflow."
      });
    }
  }

  const failed = results.filter(item => !item.accepted);

  return {
    success: failed.length === 0,
    accepted: failed.length === 0,
    branch: configuration.branch,
    startedAt: new Date().toISOString(),
    results
  };
}

export default async function handler(req, res) {
  setOwnerSecurityHeaders(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const authorization = await verifyOwnerRequest(req);
  if (!authorization.authorized) {
    return sendOwnerAuthorizationError(res, authorization);
  }

  const configuration = getGitHubConfiguration();
  if (!configuration.configured) {
    return res.status(500).json({
      success: false,
      error: "GitHub Actions configuration is unavailable.",
      code: "APP_HEALTH_GITHUB_NOT_CONFIGURED"
    });
  }

  try {
    if (req.method === "GET") {
      return res.status(200).json(await getHealthSnapshot(configuration));
    }

    if (req.method === "POST") {
      if (String(req.body?.action || "") !== "run_sweep") {
        return res.status(400).json({
          success: false,
          error: "Unknown App Health action.",
          code: "INVALID_APP_HEALTH_ACTION"
        });
      }

      const result = await dispatchBugSweep(configuration);
      return res.status(result.success ? 202 : 502).json(result);
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed.",
      code: "METHOD_NOT_ALLOWED"
    });
  } catch (error) {
    return res.status(error?.status || 502).json({
      success: false,
      error: error?.message || "App Health could not reach GitHub Actions.",
      code: error?.code || "APP_HEALTH_UNAVAILABLE"
    });
  }
}
