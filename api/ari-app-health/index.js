import {
  sendOwnerAuthorizationError,
  setOwnerSecurityHeaders,
  verifyOwnerRequest
} from "../../server/ari-owner-auth.js";

const GITHUB_API_VERSION = "2022-11-28";
const SWEEP_WORKFLOW = Object.freeze({
  id: "sweep",
  name: "ARI XP App Health Sweep",
  file: "app-health-sweep.yml"
});

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
  const branch = String(process.env.APP_HEALTH_BRANCH || "main").trim() || "main";

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
    error.githubMessage = data?.message || null;
    error.path = path;
    throw error;
  }

  return data;
}

function classifyStatus(status, conclusion) {
  if (["queued", "in_progress", "waiting", "requested", "pending"].includes(status)) {
    return "running";
  }
  if (status !== "completed") return "unknown";
  if (conclusion === "success") return "passed";
  if (conclusion === "neutral" || conclusion === "skipped") return "warning";
  return "failed";
}

function classifyRun(run) {
  if (!run) return "unknown";
  return classifyStatus(run.status, run.conclusion);
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
    url: run?.html_url || null,
    source: "workflow",
    validForCurrentCommit: false,
    inherited: false,
    impactedFiles: []
  };
}

function isRootFileWithExtension(file, extensions) {
  if (!file || file.includes("/")) return false;
  return extensions.some(extension => file.endsWith(extension));
}

function impactsWorkflow(workflowId, file) {
  const path = String(file || "");
  if (!path) return false;

  if (workflowId === "readiness") return true;

  if (workflowId === "ios") {
    if (["package.json", "package-lock.json", "capacitor.config.json"].includes(path)) return true;
    if (["scripts/", "ios/", "assets/", "js/"].some(prefix => path.startsWith(prefix))) return true;
    return isRootFileWithExtension(path, [".html", ".js", ".css", ".json"]);
  }

  if (workflowId === "ari-trust") {
    if ([
      "api/ari-vnext.js",
      "ari/runtime/ari-runtime-controller.js",
      "ari/intent/ari-central-intent-router.js",
      "js/auth.js",
      "js/nutrition-trust-layer.js",
      "js/nutrition-transaction-client.js",
      "js/ari-nutrition-data-quality.js"
    ].includes(path)) return true;

    if (["api/_lib/ari-vnext/", "ari/vnext/"].some(prefix => path.startsWith(prefix))) return true;
    if (path.startsWith("supabase/migrations/") && path.includes("nutrition") && path.endsWith(".sql")) return true;
    if (path.startsWith("tests/ari-vnext-") && path.endsWith(".test.mjs")) return true;
    if (path.startsWith("tests/nutrition-") && path.endsWith(".test.mjs")) return true;
    if (path === ".github/workflows/ari-vnext-tests.yml") return true;
  }

  return false;
}

function overallState(workflows, deployment) {
  if (deployment?.state === "failed") return "needs_attention";

  const states = workflows.map(item => item.state);
  if (states.includes("failed")) return "needs_attention";
  if (states.includes("running")) return "running";
  if (states.includes("stale") || states.includes("warning") || deployment?.state === "warning") return "warning";
  if (states.includes("unknown") || deployment?.state === "unknown") return "unknown";
  if (states.every(state => state === "passed") && deployment?.state === "passed") return "healthy";
  return "unknown";
}

async function getLatestRun(configuration, workflow) {
  const data = await githubRequest(
    configuration,
    `/actions/workflows/${encodeURIComponent(workflow.file)}/runs?branch=${encodeURIComponent(configuration.branch)}&per_page=1`
  );

  return Array.isArray(data?.workflow_runs) ? data.workflow_runs[0] || null : null;
}

async function getLatestSweep(configuration) {
  try {
    const data = await githubRequest(
      configuration,
      `/actions/workflows/${encodeURIComponent(SWEEP_WORKFLOW.file)}/runs?branch=${encodeURIComponent(configuration.branch)}&per_page=1`
    );
    return Array.isArray(data?.workflow_runs) ? data.workflow_runs[0] || null : null;
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

async function getSweepJobs(configuration, runId) {
  if (!runId) return [];
  const data = await githubRequest(configuration, `/actions/runs/${encodeURIComponent(runId)}/jobs?per_page=100`);
  return Array.isArray(data?.jobs) ? data.jobs : [];
}

async function getChangedFiles(configuration, baseSha, headSha) {
  if (!baseSha || !headSha || baseSha === headSha) return [];
  const data = await githubRequest(
    configuration,
    `/compare/${encodeURIComponent(baseSha)}...${encodeURIComponent(headSha)}`
  );
  return Array.isArray(data?.files)
    ? data.files.map(file => file?.filename).filter(Boolean)
    : [];
}

function normalizeSweep(run, jobs = []) {
  if (!run) {
    return {
      state: "idle",
      status: null,
      conclusion: null,
      runNumber: null,
      headSha: null,
      url: null,
      title: null,
      startedAt: null,
      updatedAt: null,
      jobs: []
    };
  }

  return {
    state: classifyRun(run),
    status: run.status || null,
    conclusion: run.conclusion || null,
    runNumber: run.run_number || null,
    headSha: run.head_sha || null,
    url: run.html_url || null,
    title: run.display_title || run.name || null,
    startedAt: run.run_started_at || run.created_at || null,
    updatedAt: run.updated_at || null,
    jobs: jobs.map(job => ({
      id: job.id,
      name: job.name,
      state: classifyStatus(job.status, job.conclusion),
      status: job.status || null,
      conclusion: job.conclusion || null,
      startedAt: job.started_at || null,
      completedAt: job.completed_at || null,
      url: job.html_url || run.html_url || null
    }))
  };
}

function overlaySweepJobs(workflows, sweep) {
  if (!sweep?.headSha || !Array.isArray(sweep.jobs)) return workflows;

  const jobByName = new Map(sweep.jobs.map(job => [job.name, job]));

  return workflows.map(workflow => {
    const job = jobByName.get(workflow.name);
    if (!job || job.conclusion === "skipped") return workflow;

    return {
      ...workflow,
      state: job.state,
      status: job.status,
      conclusion: job.conclusion,
      runNumber: sweep.runNumber,
      startedAt: job.startedAt || sweep.startedAt,
      updatedAt: job.completedAt || sweep.updatedAt,
      headSha: sweep.headSha,
      url: job.url || sweep.url,
      source: "app_health_sweep",
      validForCurrentCommit: true,
      inherited: false,
      impactedFiles: []
    };
  });
}

function getDeploymentParity(currentCommitSha) {
  const deploymentSha = String(process.env.VERCEL_GIT_COMMIT_SHA || "").trim() || null;
  const environment = String(process.env.VERCEL_ENV || process.env.VERCEL_TARGET_ENV || "").trim() || null;

  if (!deploymentSha) {
    return {
      id: "deployment",
      name: "Production Deployment",
      state: "unknown",
      environment,
      commitSha: null,
      currentCommitSha,
      matchesMain: null,
      message: "Production commit metadata is unavailable in this deployment."
    };
  }

  const matchesMain = Boolean(currentCommitSha && deploymentSha === currentCommitSha);
  return {
    id: "deployment",
    name: "Production Deployment",
    state: matchesMain ? "passed" : "failed",
    environment,
    commitSha: deploymentSha,
    currentCommitSha,
    matchesMain,
    message: matchesMain
      ? "Production is serving the current main commit."
      : "Production is not serving the current main commit."
  };
}

async function getHealthSnapshot(configuration) {
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

  const latestRuns = await Promise.all(
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

  const compareCache = new Map();
  const loadChanges = async baseSha => {
    if (!baseSha || !commitSha || baseSha === commitSha) return [];
    if (!compareCache.has(baseSha)) {
      compareCache.set(baseSha, getChangedFiles(configuration, baseSha, commitSha).catch(() => null));
    }
    return await compareCache.get(baseSha);
  };

  const coverageAware = [];
  for (const workflow of latestRuns) {
    if (!commitSha || !workflow.headSha) {
      coverageAware.push(workflow);
      continue;
    }

    if (workflow.headSha === commitSha) {
      coverageAware.push({
        ...workflow,
        validForCurrentCommit: true,
        inherited: false
      });
      continue;
    }

    if (workflow.state === "passed") {
      const changedFiles = await loadChanges(workflow.headSha);
      if (changedFiles === null) {
        coverageAware.push({
          ...workflow,
          state: "stale",
          validForCurrentCommit: false,
          staleReason: "Could not verify whether newer changes affect this check."
        });
        continue;
      }

      const impactedFiles = changedFiles.filter(file => impactsWorkflow(workflow.id, file));
      if (impactedFiles.length === 0) {
        coverageAware.push({
          ...workflow,
          validForCurrentCommit: true,
          inherited: true,
          impactedFiles: []
        });
      } else {
        coverageAware.push({
          ...workflow,
          state: "stale",
          validForCurrentCommit: false,
          inherited: false,
          impactedFiles,
          staleReason: `${impactedFiles.length} relevant change${impactedFiles.length === 1 ? "" : "s"} landed after this pass.`
        });
      }
      continue;
    }

    coverageAware.push({
      ...workflow,
      validForCurrentCommit: workflow.headSha === commitSha
    });
  }

  let sweepRun = null;
  let sweepJobs = [];
  try {
    sweepRun = await getLatestSweep(configuration);
    sweepJobs = sweepRun?.id ? await getSweepJobs(configuration, sweepRun.id) : [];
  } catch {
    sweepRun = null;
    sweepJobs = [];
  }

  const sweep = normalizeSweep(sweepRun, sweepJobs);
  const workflows = sweep.headSha === commitSha
    ? overlaySweepJobs(coverageAware, sweep)
    : coverageAware;
  const deployment = getDeploymentParity(commitSha);

  return {
    success: true,
    overall: overallState(workflows, deployment),
    branch: configuration.branch,
    commitSha,
    checkedAt: new Date().toISOString(),
    workflows,
    deployment,
    sweep
  };
}

function dispatchErrorResponse(error) {
  if (error?.status === 403 || error?.status === 404) {
    return {
      status: 502,
      payload: {
        success: false,
        error: "Bug Sweep could not start because the configured GitHub credential cannot dispatch Actions. Grant Actions: Read and write permission for this repository.",
        code: "APP_HEALTH_ACTIONS_WRITE_REQUIRED"
      }
    };
  }

  if (error?.status === 422) {
    return {
      status: 502,
      payload: {
        success: false,
        error: "Bug Sweep could not start because GitHub rejected the workflow request. Verify that the App Health sweep workflow exists on the release branch and supports manual dispatch.",
        code: "APP_HEALTH_SWEEP_DISPATCH_REJECTED"
      }
    };
  }

  return {
    status: 502,
    payload: {
      success: false,
      error: error?.message || "Bug Sweep could not start.",
      code: error?.code || "APP_HEALTH_SWEEP_START_FAILED"
    }
  };
}

async function dispatchBugSweep(configuration, mode = "smart") {
  const normalizedMode = mode === "full" ? "full" : "smart";
  const latest = await getLatestSweep(configuration);
  const latestState = classifyRun(latest);

  if (latestState === "running") {
    return {
      success: true,
      accepted: true,
      alreadyRunning: true,
      mode: normalizedMode,
      runNumber: latest?.run_number || null,
      url: latest?.html_url || null
    };
  }

  const baseSha = latest?.head_sha || "";

  await githubRequest(
    configuration,
    `/actions/workflows/${encodeURIComponent(SWEEP_WORKFLOW.file)}/dispatches`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: configuration.branch,
        inputs: {
          mode: normalizedMode,
          base_sha: baseSha
        }
      })
    }
  );

  return {
    success: true,
    accepted: true,
    alreadyRunning: false,
    mode: normalizedMode,
    branch: configuration.branch,
    baseSha: baseSha || null,
    startedAt: new Date().toISOString()
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

      try {
        const result = await dispatchBugSweep(configuration, String(req.body?.mode || "smart"));
        return res.status(202).json(result);
      } catch (error) {
        const mapped = dispatchErrorResponse(error);
        return res.status(mapped.status).json(mapped.payload);
      }
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
