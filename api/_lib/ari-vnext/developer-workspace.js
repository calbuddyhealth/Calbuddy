// ARI vNext — bounded owner developer execution workspace.
// Read/search/CI evidence is executed server-side for the authenticated owner
// turn. Writes are never performed here; edits remain confirmation-gated.

export const ARI_DEVELOPER_WORKSPACE_VERSION = "1.0.0";

const WORKFLOW_FILE = "ari-vnext-tests.yml";
const MAX_READ_BYTES = 420_000;
const MAX_SEARCH_RESULTS = 18;

const ALLOWED_PREFIXES = Object.freeze([
  "ari/",
  "api/",
  "rebirth/",
  "server/",
  "tests/",
  "docs/",
  "assets/",
  "supabase/migrations/",
  "calbuddy-core.js",
  "home.html",
  "index.html",
  "style.css",
  "package.json"
]);

const BLOCKED_PATHS = Object.freeze([
  /(^|\/)\.git(\/|$)/i,
  /(^|\/)node_modules(\/|$)/i,
  /(^|\/)secrets?(\/|$)/i,
  /(^|\/)credentials?(\/|$)/i,
  /(^|\/)private[-_]?keys?(\/|$)/i,
  /(^|\/)\.env(?:\.|$)/i,
  /\.(?:pem|key|p12|pfx|jks|keystore)$/i
]);

export async function executeDeveloperWorkspaceTool({
  applicationAction = "",
  arguments: args = {}
} = {}) {
  const config = configuration();
  if (!config.configured) {
    return {
      success: false,
      code: "DEVELOPER_WORKSPACE_NOT_CONFIGURED",
      message: "The repository developer workspace is not configured."
    };
  }

  if (applicationAction === "repo_read") {
    return await readRepositoryFile({
      ...config,
      filePath: args.filePath,
      branch: args.branch || config.branch,
      startLine: args.startLine,
      endLine: args.endLine
    });
  }

  if (applicationAction === "repo_search") {
    return await searchRepository({
      ...config,
      query: args.query,
      path: args.path,
      branch: args.branch || config.branch
    });
  }

  if (applicationAction === "repo_ci_status") {
    return await readCiStatus({
      ...config,
      branch: args.branch || config.branch,
      commitSha: args.commitSha
    });
  }

  return {
    success: false,
    code: "DEVELOPER_WORKSPACE_TOOL_UNSUPPORTED",
    message: "That developer workspace operation is not supported."
  };
}

export function developerToolResultToExecutionEvidence(result = {}, applicationAction = "") {
  if (!result || typeof result !== "object") return null;

  if (applicationAction === "repo_read") {
    return {
      observations: [{
        id: result?.evidenceId || null,
        kind: "repository_read",
        summary: result?.success
          ? `Read ${result.filePath} from ${result.branch} (${Number(result.lineCount || 0)} lines returned).`
          : `Repository read failed for ${result?.filePath || "unknown file"}: ${result?.code || "unknown error"}.`,
        source: result?.filePath || null,
        verified: result?.success === true
      }],
      artifacts: result?.success ? [{
        id: result?.evidenceId || null,
        kind: "repository_file",
        label: result.filePath,
        ref: result.filePath,
        verified: true
      }] : []
    };
  }

  if (applicationAction === "repo_search") {
    const paths = Array.isArray(result?.matches)
      ? result.matches.map(item => item?.filePath).filter(Boolean).slice(0, 6)
      : [];
    return {
      observations: [{
        id: result?.evidenceId || null,
        kind: "repository_search",
        summary: result?.success
          ? `Repository search for "${clean(result.query, 120)}" returned ${Number(result.resultCount || 0)} match(es)${paths.length ? `: ${paths.join(", ")}` : ""}.`
          : `Repository search failed: ${result?.code || "unknown error"}.`,
        source: "github_repository",
        verified: result?.success === true
      }]
    };
  }

  if (applicationAction === "repo_ci_status") {
    const status = result?.conclusion === "success"
      ? "passed"
      : result?.conclusion && result.conclusion !== "skipped"
        ? "failed"
        : "attempted";
    return {
      verification: {
        id: result?.evidenceId || null,
        requested: true,
        attempted: Boolean(result?.runId),
        status,
        summary: result?.runId
          ? `ARI vNext tests for ${result.branch} are ${result.status || "unknown"} with conclusion ${result.conclusion || "pending"} at ${clean(result.headSha, 12)}.`
          : result?.message || "No matching ARI vNext test run was found.",
        source: "github_actions"
      },
      artifacts: result?.htmlUrl ? [{
        id: result?.evidenceId || null,
        kind: "ci_run",
        label: `ARI vNext tests ${result.runId}`,
        url: result.htmlUrl,
        verified: result?.conclusion === "success"
      }] : []
    };
  }

  return null;
}

async function readRepositoryFile({
  token,
  repo,
  branch,
  filePath,
  startLine = null,
  endLine = null
} = {}) {
  const path = normalizePath(filePath);
  const validation = validatePath(path);
  if (!validation.valid) {
    return { success: false, code: validation.code, message: validation.message, filePath: path, branch };
  }

  const response = await githubFetch(
    `https://api.github.com/repos/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
    token
  );
  if (!response?.content || response?.type !== "file") {
    return {
      success: false,
      code: "REPOSITORY_FILE_NOT_READABLE",
      message: "The requested repository path did not resolve to a readable file.",
      filePath: path,
      branch
    };
  }

  const bytes = Buffer.from(String(response.content || ""), "base64");
  if (bytes.length > MAX_READ_BYTES) {
    return {
      success: false,
      code: "REPOSITORY_FILE_TOO_LARGE",
      message: "The requested file exceeds the bounded developer workspace read limit.",
      filePath: path,
      branch
    };
  }

  const content = bytes.toString("utf8");
  const lines = content.split("\n");
  const first = boundedLine(startLine, 1, lines.length, 1);
  const last = boundedLine(endLine, first, lines.length, lines.length);
  const selected = lines.slice(first - 1, last).join("\n");

  return {
    success: true,
    version: ARI_DEVELOPER_WORKSPACE_VERSION,
    operation: "repo_read",
    evidenceId: `repo_read:${response.sha || stableText(path + branch)}:${first}-${last}`,
    filePath: path,
    branch,
    sha: response.sha || null,
    startLine: first,
    endLine: last,
    lineCount: last - first + 1,
    fullFile: first === 1 && last === lines.length,
    content: selected
  };
}

async function searchRepository({
  token,
  repo,
  branch,
  query,
  path = ""
} = {}) {
  const text = clean(query, 180);
  if (text.length < 2) {
    return { success: false, code: "REPOSITORY_SEARCH_QUERY_REQUIRED", message: "A repository search query is required." };
  }

  const pathPrefix = normalizeOptionalPath(path);
  if (pathPrefix) {
    const validation = validatePath(pathPrefix, { allowPrefix: true });
    if (!validation.valid) {
      return { success: false, code: validation.code, message: validation.message, query: text };
    }
  }

  const branchData = await githubFetch(
    `https://api.github.com/repos/${repo}/branches/${encodeURIComponent(branch)}`,
    token
  );
  const treeSha = branchData?.commit?.commit?.tree?.sha;
  if (!treeSha) {
    return { success: false, code: "REPOSITORY_BRANCH_UNAVAILABLE", message: "The repository branch tree could not be resolved.", query: text, branch };
  }

  const tree = await githubFetch(
    `https://api.github.com/repos/${repo}/git/trees/${treeSha}?recursive=1`,
    token
  );
  const candidates = (Array.isArray(tree?.tree) ? tree.tree : [])
    .filter(item => item?.type === "blob" && Number(item?.size || 0) <= MAX_READ_BYTES)
    .map(item => String(item.path || ""))
    .filter(Boolean)
    .filter(candidate => !pathPrefix || candidate.startsWith(pathPrefix))
    .filter(candidate => validatePath(candidate).valid)
    .filter(candidate => searchable(candidate))
    .slice(0, 350);

  const needle = text.toLowerCase();
  const matches = [];

  for (const candidate of candidates) {
    if (matches.length >= MAX_SEARCH_RESULTS) break;
    if (candidate.toLowerCase().includes(needle)) {
      matches.push({ filePath: candidate, line: null, preview: "path match" });
      continue;
    }

    let file;
    try {
      file = await githubFetch(
        `https://api.github.com/repos/${repo}/contents/${encodePath(candidate)}?ref=${encodeURIComponent(branch)}`,
        token
      );
    } catch {
      continue;
    }
    if (!file?.content) continue;
    const content = Buffer.from(String(file.content), "base64").toString("utf8");
    const index = content.toLowerCase().indexOf(needle);
    if (index < 0) continue;
    const before = content.slice(0, index);
    const line = before.split("\n").length;
    const preview = content.slice(Math.max(0, index - 180), Math.min(content.length, index + needle.length + 260));
    matches.push({ filePath: candidate, line, preview: clean(preview, 520) });
  }

  return {
    success: true,
    version: ARI_DEVELOPER_WORKSPACE_VERSION,
    operation: "repo_search",
    evidenceId: `repo_search:${stableText(`${branch}|${pathPrefix}|${text}|${matches.map(item => item.filePath).join(",")}`)}`,
    query: text,
    path: pathPrefix || null,
    branch,
    resultCount: matches.length,
    matches
  };
}

async function readCiStatus({
  token,
  repo,
  branch,
  commitSha = ""
} = {}) {
  const response = await githubFetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${WORKFLOW_FILE}/runs?branch=${encodeURIComponent(branch)}&per_page=20`,
    token
  );
  const wantedSha = clean(commitSha, 80).toLowerCase();
  const runs = Array.isArray(response?.workflow_runs) ? response.workflow_runs : [];
  const run = runs.find(item => !wantedSha || String(item?.head_sha || "").toLowerCase().startsWith(wantedSha)) || null;

  if (!run) {
    return {
      success: true,
      version: ARI_DEVELOPER_WORKSPACE_VERSION,
      operation: "repo_ci_status",
      evidenceId: `repo_ci:${stableText(branch + wantedSha)}`,
      branch,
      commitSha: wantedSha || null,
      runId: null,
      status: "not_found",
      conclusion: null,
      message: "No matching ARI vNext test workflow run was found yet."
    };
  }

  return {
    success: true,
    version: ARI_DEVELOPER_WORKSPACE_VERSION,
    operation: "repo_ci_status",
    evidenceId: `repo_ci:${run.id}`,
    branch,
    commitSha: wantedSha || null,
    runId: run.id,
    status: run.status || null,
    conclusion: run.conclusion || null,
    headSha: run.head_sha || null,
    htmlUrl: run.html_url || null,
    createdAt: run.created_at || null,
    updatedAt: run.updated_at || null
  };
}

function configuration() {
  const token = clean(process.env.GITHUB_TOKEN, 8000);
  const repo = clean(process.env.GITHUB_REPO, 300);
  const branch = clean(process.env.GITHUB_BRANCH, 180) || "main";
  return { token, repo, branch, configured: Boolean(token && repo && branch) };
}

async function githubFetch(url, token, options = {}) {
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
    error.code = "GITHUB_API_ERROR";
    throw error;
  }
  return data;
}

function validatePath(path = "", { allowPrefix = false } = {}) {
  const value = normalizePath(path);
  if (!value || value.includes("..") || value.startsWith("/")) {
    return { valid: false, code: "REPOSITORY_PATH_INVALID", message: "The repository path is invalid." };
  }
  if (BLOCKED_PATHS.some(pattern => pattern.test(value))) {
    return { valid: false, code: "REPOSITORY_PATH_BLOCKED", message: "That repository path is blocked from Ari developer access." };
  }
  const allowed = ALLOWED_PREFIXES.some(prefix =>
    prefix.endsWith("/") ? value.startsWith(prefix) : value === prefix
  );
  if (!allowed && !allowPrefix) {
    return { valid: false, code: "REPOSITORY_PATH_OUT_OF_SCOPE", message: "That repository path is outside Ari's bounded developer workspace." };
  }
  if (!allowed && allowPrefix && !ALLOWED_PREFIXES.some(prefix => prefix.startsWith(value) || value.startsWith(prefix))) {
    return { valid: false, code: "REPOSITORY_PATH_OUT_OF_SCOPE", message: "That repository search path is outside Ari's bounded developer workspace." };
  }
  return { valid: true };
}

function normalizePath(value = "") {
  return String(value || "").trim().replace(/^\/+/, "").replace(/\\/g, "/").replace(/\/{2,}/g, "/").slice(0, 420);
}
function normalizeOptionalPath(value = "") {
  const path = normalizePath(value);
  return path && !path.endsWith("/") ? path : path;
}
function encodePath(path = "") {
  return String(path).split("/").map(encodeURIComponent).join("/");
}
function searchable(path = "") {
  return /\.(?:js|mjs|cjs|ts|tsx|jsx|json|html|css|scss|md|txt|sql|yml|yaml)$/i.test(path);
}
function boundedLine(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(number)));
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
