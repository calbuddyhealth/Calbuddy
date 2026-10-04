// ARI vNext — owner-triggered isolated GitHub coding runner.
// It can prepare one atomic multi-file exact-replacement commit on a dedicated
// agent/ari-* branch and inspect CI. It has no production merge authority.

export const ARI_DEVELOPER_CODING_RUNNER_VERSION = "1.0.0";
export const MAX_CODE_TASK_PATCHES = 8;

const MAX_FILE_BYTES = 240_000;
const MAX_FIND_CHARS = 16_000;
const MAX_REPLACE_CHARS = 24_000;
const PROTECTED_PATHS = Object.freeze([
  ".git/",
  ".github/workflows/",
  ".env",
  "OWNER_MODE_SECURITY.md",
  "vercel.json",
  "api/ari-github-edit.js",
  "api/ari-code-task.js",
  "api/ari-owner-intelligence-controls.js",
  "server/ari-owner-auth.js",
  "supabase/"
]);

export function isolatedTaskBranch(taskId = "") {
  const id = String(taskId || "").trim().toLowerCase();
  let slug = id.replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
  if (!slug) slug = stableText(id || "task");
  return `agent/ari-task-${slug}`;
}

export function validateCodeTaskPatches(patches = []) {
  if (!Array.isArray(patches) || patches.length < 1 || patches.length > MAX_CODE_TASK_PATCHES) {
    return { valid: false, code: "CODE_TASK_PATCH_COUNT_INVALID" };
  }
  const normalized = [];
  for (const raw of patches) {
    const filePath = normalizePath(raw?.filePath);
    const find = String(raw?.find ?? "");
    const replace = String(raw?.replace ?? "");
    if (!safePath(filePath)) return { valid: false, code: "CODE_TASK_PATH_INVALID", filePath };
    if (protectedPath(filePath)) return { valid: false, code: "CODE_TASK_PATH_PROTECTED", filePath };
    if (!find || find.length > MAX_FIND_CHARS || replace.length > MAX_REPLACE_CHARS) {
      return { valid: false, code: "CODE_TASK_PATCH_TOO_LARGE", filePath };
    }
    normalized.push({ filePath, find, replace });
  }
  return { valid: true, patches: normalized };
}

export function applyExactPatch(content = "", patch = {}) {
  const source = String(content ?? "");
  const find = String(patch?.find ?? "");
  const replace = String(patch?.replace ?? "");
  if (!find) return { success: false, code: "CODE_TASK_FIND_REQUIRED", content: source };
  const first = source.indexOf(find);
  if (first < 0) return { success: false, code: "CODE_TASK_TARGET_NOT_FOUND", content: source };
  if (source.indexOf(find, first + find.length) >= 0) {
    return { success: false, code: "CODE_TASK_TARGET_AMBIGUOUS", content: source };
  }
  const next = source.slice(0, first) + replace + source.slice(first + find.length);
  if (next === source) return { success: false, code: "CODE_TASK_NO_CHANGE", content: source };
  return { success: true, content: next };
}

export async function runIsolatedCodeTask({
  token,
  repo,
  productionBranch = "main",
  taskId,
  patches,
  commitMessage = "Ari isolated coding task"
} = {}) {
  const auth = clean(token, 8000);
  const repository = clean(repo, 300);
  const baseBranch = clean(productionBranch, 180) || "main";
  const validation = validateCodeTaskPatches(patches);
  if (!auth || !/^[^/\s]+\/[^/\s]+$/.test(repository)) {
    return { success: false, code: "CODE_TASK_GITHUB_NOT_CONFIGURED" };
  }
  if (!validation.valid) return { success: false, ...validation };

  const branch = isolatedTaskBranch(taskId);
  if (branch === baseBranch || /^(?:main|master|prod|production)$/i.test(branch)) {
    return { success: false, code: "CODE_TASK_BRANCH_UNSAFE" };
  }

  const branchState = await ensureTaskBranch({ token: auth, repo: repository, branch, baseBranch });
  let headSha = branchState.headSha;
  const commit = await githubRequest(
    `https://api.github.com/repos/${repository}/git/commits/${encodeURIComponent(headSha)}`,
    auth
  );
  const baseTreeSha = commit?.tree?.sha;
  if (!baseTreeSha) return { success: false, code: "CODE_TASK_BASE_TREE_MISSING", branch };

  const byFile = new Map();
  for (const patch of validation.patches) {
    if (!byFile.has(patch.filePath)) byFile.set(patch.filePath, []);
    byFile.get(patch.filePath).push(patch);
  }

  const changedFiles = [];
  const treeElements = [];
  for (const [filePath, filePatches] of byFile.entries()) {
    const current = await githubRequest(
      `https://api.github.com/repos/${repository}/contents/${encodePath(filePath)}?ref=${encodeURIComponent(branch)}`,
      auth
    );
    if (current?.type !== "file" || !current?.content || !current?.sha) {
      return { success: false, code: "CODE_TASK_FILE_NOT_READABLE", branch, filePath };
    }
    const buffer = Buffer.from(String(current.content), "base64");
    if (buffer.length > MAX_FILE_BYTES) {
      return { success: false, code: "CODE_TASK_FILE_TOO_LARGE", branch, filePath };
    }
    let nextContent = buffer.toString("utf8");
    for (const patch of filePatches) {
      const applied = applyExactPatch(nextContent, patch);
      if (!applied.success) {
        return { success: false, code: applied.code, branch, filePath, currentSha: current.sha };
      }
      nextContent = applied.content;
    }
    const blob = await githubRequest(
      `https://api.github.com/repos/${repository}/git/blobs`,
      auth,
      { method: "POST", body: JSON.stringify({ content: nextContent, encoding: "utf-8" }) }
    );
    treeElements.push({ path: filePath, mode: "100644", type: "blob", sha: blob.sha });
    changedFiles.push({ filePath, beforeSha: current.sha, afterBlobSha: blob.sha, patchCount: filePatches.length });
  }

  const tree = await githubRequest(
    `https://api.github.com/repos/${repository}/git/trees`,
    auth,
    { method: "POST", body: JSON.stringify({ base_tree: baseTreeSha, tree: treeElements }) }
  );
  const createdCommit = await githubRequest(
    `https://api.github.com/repos/${repository}/git/commits`,
    auth,
    {
      method: "POST",
      body: JSON.stringify({
        message: clean(commitMessage, 240) || "Ari isolated coding task",
        tree: tree.sha,
        parents: [headSha]
      })
    }
  );
  await githubRequest(
    `https://api.github.com/repos/${repository}/git/refs/${encodeRef(`heads/${branch}`)}`,
    auth,
    { method: "PATCH", body: JSON.stringify({ sha: createdCommit.sha, force: false }) }
  );
  headSha = createdCommit.sha;

  return {
    success: true,
    version: ARI_DEVELOPER_CODING_RUNNER_VERSION,
    taskId: clean(taskId, 180),
    branch,
    baseBranch,
    commitSha: headSha,
    commitUrl: createdCommit?.html_url || `https://github.com/${repository}/commit/${headSha}`,
    compareUrl: `https://github.com/${repository}/compare/${encodeURIComponent(baseBranch)}...${encodeURIComponent(branch)}`,
    changedFiles,
    productionAuthority: false,
    backgroundWorkerUsed: false,
    verification: {
      status: "pending",
      summary: "The isolated branch commit was created. GitHub checks must pass before the task can be treated as verified."
    }
  };
}

export async function readIsolatedCodeTaskStatus({ token, repo, branch, commitSha = "" } = {}) {
  const auth = clean(token, 8000);
  const repository = clean(repo, 300);
  const taskBranch = clean(branch, 180);
  const wanted = clean(commitSha, 80).toLowerCase();
  if (!auth || !repository || !taskBranch || !/^agent\/ari-/i.test(taskBranch)) {
    return { success: false, code: "CODE_TASK_STATUS_INVALID" };
  }

  const data = await githubRequest(
    `https://api.github.com/repos/${repository}/actions/workflows/ari-vnext-tests.yml/runs?branch=${encodeURIComponent(taskBranch)}&per_page=20`,
    auth
  );
  const runs = Array.isArray(data?.workflow_runs) ? data.workflow_runs : [];
  const run = runs.find(item => !wanted || String(item?.head_sha || "").toLowerCase().startsWith(wanted)) || null;
  if (!run) {
    return {
      success: true,
      version: ARI_DEVELOPER_CODING_RUNNER_VERSION,
      branch: taskBranch,
      commitSha: wanted || null,
      verification: { status: "pending", attempted: false, summary: "No matching ARI vNext workflow run is visible yet." }
    };
  }

  const status = run.conclusion === "success"
    ? "passed"
    : run.conclusion && run.conclusion !== "skipped"
      ? "failed"
      : "pending";
  return {
    success: true,
    version: ARI_DEVELOPER_CODING_RUNNER_VERSION,
    branch: taskBranch,
    commitSha: run.head_sha || wanted || null,
    runId: run.id,
    runUrl: run.html_url || null,
    verification: {
      status,
      attempted: true,
      conclusion: run.conclusion || null,
      summary: `ARI vNext workflow ${run.id} is ${run.status || "unknown"} with conclusion ${run.conclusion || "pending"}.`
    }
  };
}

async function ensureTaskBranch({ token, repo, branch, baseBranch }) {
  try {
    const existing = await githubRequest(
      `https://api.github.com/repos/${repo}/git/ref/${encodeRef(`heads/${branch}`)}`,
      token
    );
    const headSha = existing?.object?.sha;
    if (!headSha) throw Object.assign(new Error("Task branch has no head SHA."), { status: 500 });
    return { branch, headSha, created: false };
  } catch (error) {
    if (Number(error?.status) !== 404) throw error;
  }

  const base = await githubRequest(
    `https://api.github.com/repos/${repo}/git/ref/${encodeRef(`heads/${baseBranch}`)}`,
    token
  );
  const baseSha = base?.object?.sha;
  if (!baseSha) throw Object.assign(new Error("Base branch has no head SHA."), { status: 500 });
  await githubRequest(
    `https://api.github.com/repos/${repo}/git/refs`,
    token,
    { method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }) }
  );
  return { branch, headSha: baseSha, created: true };
}

async function githubRequest(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || "GitHub API request failed.");
    error.status = response.status;
    error.code = "CODE_TASK_GITHUB_API_ERROR";
    error.github = data;
    throw error;
  }
  return data;
}

function protectedPath(path) {
  return PROTECTED_PATHS.some(value => value.endsWith("/") ? path.startsWith(value) : path === value || path.startsWith(`${value}/`));
}
function safePath(path) {
  return Boolean(path && !path.startsWith("/") && !path.includes("..") && !path.includes("\\") && !path.includes("\0"));
}
function normalizePath(value = "") {
  return String(value || "").trim().replace(/^\/+/, "").replace(/\/{2,}/g, "/").slice(0, 420);
}
function encodePath(path = "") {
  return String(path).split("/").map(encodeURIComponent).join("/");
}
function encodeRef(ref = "") {
  return String(ref).split("/").map(encodeURIComponent).join("/");
}
function stableText(value = "") {
  let hash = 2166136261;
  for (const ch of String(value)) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
