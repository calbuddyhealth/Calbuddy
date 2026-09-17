// api/ari-github-edit.js
// Ari GitHub Edit Endpoint
// V2.2.0 — Supabase-verified owner authorization + isolated autonomous development branch

import {
  sendOwnerAuthorizationError,
  setOwnerSecurityHeaders,
  verifyOwnerRequest
} from "../server/ari-owner-auth.js";

const AUTONOMOUS_DEV_MAX_FIND_CHARS = 12000;
const AUTONOMOUS_DEV_MAX_REPLACE_CHARS = 12000;
const AUTONOMOUS_DEV_PROTECTED_PATHS = Object.freeze([
  ".github/",
  ".env",
  "OWNER_MODE_SECURITY.md",
  "vercel.json",
  "package.json",
  "package-lock.json",
  "api/ari-github-edit.js",
  "api/ari-owner-intelligence-controls.js",
  "server/ari-owner-auth.js",
  "supabase/"
]);

export default async function handler(req, res) {
  setOwnerSecurityHeaders(res);

  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
        code: "METHOD_NOT_ALLOWED"
      });
    }

    const authorization = await verifyOwnerRequest(req);

    if (!authorization.authorized) {
      return sendOwnerAuthorizationError(res, authorization);
    }

    const token = String(process.env.GITHUB_TOKEN || "").trim();
    const repo = String(process.env.GITHUB_REPO || "").trim();
    const productionBranch = String(process.env.GITHUB_BRANCH || "").trim();

    if (!token || !repo || !productionBranch) {
      return res.status(500).json({
        success: false,
        error: "GitHub env variables missing",
        code: "MISSING_GITHUB_ENV"
      });
    }

    const {
      mode,
      filePath,
      newContent,
      operation = "replace",
      find,
      replace,
      commitMessage,
      confirmationText,
      previousContent,
      replaceAll = false,
      autonomousDevelopment = false
    } = req.body || {};

    if (!["preview", "commit", "undo"].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: "Invalid mode",
        code: "INVALID_MODE"
      });
    }

    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({
        success: false,
        error: "filePath is required",
        code: "MISSING_FILE_PATH"
      });
    }

    if (isUnsafeFilePath(filePath)) {
      return res.status(400).json({
        success: false,
        error: "Unsafe filePath rejected",
        code: "UNSAFE_FILE_PATH"
      });
    }

    const autonomous = autonomousDevelopment === true;
    const autonomousPolicy = autonomous
      ? resolveAutonomousDevelopmentPolicy({
          productionBranch,
          filePath,
          mode,
          operation,
          find,
          replace,
          replaceAll
        })
      : { allowed: false, branch: productionBranch, reason: "manual_mode" };

    if (autonomous && !autonomousPolicy.allowed) {
      return res.status(403).json({
        success: false,
        error: autonomousPolicy.message || "Autonomous development request rejected",
        code: autonomousPolicy.code || "AUTONOMOUS_DEVELOPMENT_REJECTED",
        reason: autonomousPolicy.reason || null
      });
    }

    const branch = autonomous ? autonomousPolicy.branch : productionBranch;
    const apiBase = `https://api.github.com/repos/${repo}/contents/${encodeURIComponentPath(
      filePath
    )}`;

    async function githubFetch(url, options = {}) {
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
        const err = new Error(data.message || "GitHub API request failed");
        err.status = response.status;
        err.github = data;
        throw err;
      }

      return data;
    }

    const currentFile = await githubFetch(
      `${apiBase}?ref=${encodeURIComponent(branch)}`
    );

    if (!currentFile?.content || !currentFile?.sha) {
      return res.status(400).json({
        success: false,
        error: "Could not read GitHub file content",
        code: "GITHUB_FILE_READ_FAILED",
        filePath,
        branch
      });
    }

    const currentContent = Buffer.from(
      currentFile.content,
      "base64"
    ).toString("utf8");

    let editedContent = "";

    if (mode === "undo") {
      if (!autonomous && confirmationText !== "CONFIRM GITHUB EDIT") {
        return res.status(403).json({
          success: false,
          error: "Exact confirmation required: CONFIRM GITHUB EDIT",
          code: "CONFIRMATION_REQUIRED"
        });
      }

      if (!previousContent || typeof previousContent !== "string") {
        return res.status(400).json({
          success: false,
          error: "previousContent is required for undo",
          code: "MISSING_PREVIOUS_CONTENT"
        });
      }

      editedContent = previousContent;

      return await commitToGithub({
        res,
        githubFetch,
        apiBase,
        currentFile,
        editedContent,
        branch,
        filePath,
        message: `Undo Ari edit to ${filePath}`,
        mode: "undo",
        autonomousDevelopment: autonomous
      });
    }

    if (operation === "full_replace") {
      if (autonomous) {
        return res.status(403).json({
          success: false,
          error: "Autonomous development only permits exact replace operations",
          code: "AUTONOMOUS_FULL_REPLACE_BLOCKED"
        });
      }

      if (typeof newContent !== "string" || !newContent.trim()) {
        return res.status(400).json({
          success: false,
          error: "newContent is required for full_replace",
          code: "MISSING_NEW_CONTENT"
        });
      }

      editedContent = newContent;
    } else if (operation === "replace") {
      if (!find || typeof find !== "string") {
        return res.status(400).json({
          success: false,
          error: "find is required for replace operation",
          code: "MISSING_FIND_TEXT"
        });
      }

      if (replace === undefined || replace === null) {
        return res.status(400).json({
          success: false,
          error: "replace is required for replace operation",
          code: "MISSING_REPLACE_TEXT"
        });
      }

      const result = applyReplace({
        currentContent,
        find,
        replace: String(replace),
        replaceAll: autonomous ? false : replaceAll
      });

      if (!result.changed) {
        return res.status(400).json({
          success: false,
          error: "Target text not found",
          code: "TARGET_TEXT_NOT_FOUND",
          filePath,
          branch,
          operation,
          findPreview: makePreview(find),
          suggestion:
            "Read or search the repository file first, then retry using exact text from the current file.",
          nearbyMatches: findNearbyMatches(currentContent, find)
        });
      }

      editedContent = result.editedContent;
    } else {
      return res.status(400).json({
        success: false,
        error: "Unsupported operation",
        code: "UNSUPPORTED_OPERATION",
        supportedOperations: ["replace", "full_replace"]
      });
    }

    if (!editedContent || editedContent === currentContent) {
      return res.status(400).json({
        success: false,
        error: "No file changes detected",
        code: "NO_CHANGES_DETECTED",
        filePath,
        branch
      });
    }

    if (mode === "preview") {
      return res.status(200).json({
        success: true,
        mode: "preview",
        authorizationMode: autonomous ? "autonomous_development" : "owner_confirmation",
        autonomousDevelopment: autonomous,
        filePath,
        branch,
        operation,
        replaceAll: autonomous ? false : replaceAll,
        currentContent,
        proposedContent: editedContent,
        diffSummary: buildDiffSummary(currentContent, editedContent),
        message: autonomous
          ? "Preview ready on the isolated Ari development branch. No GitHub changes were made."
          : "Preview ready. No GitHub changes were made. Type CONFIRM GITHUB EDIT to commit."
      });
    }

    if (mode === "commit") {
      if (!autonomous && confirmationText !== "CONFIRM GITHUB EDIT") {
        return res.status(403).json({
          success: false,
          error: "Exact confirmation required: CONFIRM GITHUB EDIT",
          code: "CONFIRMATION_REQUIRED"
        });
      }

      return await commitToGithub({
        res,
        githubFetch,
        apiBase,
        currentFile,
        editedContent,
        branch,
        filePath,
        message: commitMessage || `Ari update ${filePath}`,
        mode: "commit",
        autonomousDevelopment: autonomous,
        rollbackPayload: {
          mode: "undo",
          filePath,
          previousContent: currentContent,
          ...(autonomous
            ? { autonomousDevelopment: true }
            : { confirmationText: "CONFIRM GITHUB EDIT" })
        }
      });
    }

    return res.status(400).json({
      success: false,
      error: "Unhandled request mode",
      code: "UNHANDLED_MODE"
    });
  } catch (err) {
    console.error("Ari GitHub edit error:", err);

    return res.status(err.status || 500).json({
      success: false,
      error: err.message || "Ari GitHub edit failed",
      code: "ARI_GITHUB_EDIT_FAILED",
      github: err.github || null
    });
  }
}

export function resolveAutonomousDevelopmentPolicy({
  productionBranch = "",
  filePath = "",
  mode = "",
  operation = "replace",
  find = "",
  replace = "",
  replaceAll = false,
  enabled = String(process.env.ARI_AUTONOMOUS_DEV_ENABLED || "").trim().toLowerCase() === "true",
  autonomousBranch = String(process.env.ARI_AUTONOMOUS_DEV_BRANCH || "").trim()
} = {}) {
  if (!enabled) {
    return autonomousBlocked(
      "AUTONOMOUS_DEVELOPMENT_DISABLED",
      "autonomous_development_disabled",
      "Autonomous development is not enabled on this deployment."
    );
  }

  if (!isSafeAutonomousDevelopmentBranch({ autonomousBranch, productionBranch })) {
    return autonomousBlocked(
      "AUTONOMOUS_BRANCH_UNSAFE",
      "unsafe_or_missing_autonomous_branch",
      "Autonomous development requires a dedicated non-production agent/ari-* branch."
    );
  }

  if (!["preview", "commit", "undo"].includes(mode)) {
    return autonomousBlocked(
      "AUTONOMOUS_MODE_UNSUPPORTED",
      "unsupported_mode",
      "Autonomous development supports preview, commit, and undo only."
    );
  }

  if (isProtectedAutonomousDevelopmentPath(filePath)) {
    return autonomousBlocked(
      "AUTONOMOUS_PATH_PROTECTED",
      "protected_control_plane_path",
      "This file is protected from autonomous development edits."
    );
  }

  if (mode !== "undo") {
    if (operation !== "replace") {
      return autonomousBlocked(
        "AUTONOMOUS_OPERATION_UNSUPPORTED",
        "exact_replace_required",
        "Autonomous development only permits exact replace operations."
      );
    }

    if (replaceAll === true) {
      return autonomousBlocked(
        "AUTONOMOUS_REPLACE_ALL_BLOCKED",
        "replace_all_not_allowed",
        "Autonomous development does not permit replaceAll."
      );
    }

    const findText = String(find || "");
    const replaceText = String(replace ?? "");
    if (!findText || findText.length > AUTONOMOUS_DEV_MAX_FIND_CHARS || replaceText.length > AUTONOMOUS_DEV_MAX_REPLACE_CHARS) {
      return autonomousBlocked(
        "AUTONOMOUS_PATCH_TOO_LARGE",
        "patch_exceeds_autonomous_scope",
        "Autonomous development patches must be bounded exact replacements."
      );
    }
  }

  return {
    allowed: true,
    branch: autonomousBranch,
    reason: "owner_verified_isolated_reversible_development",
    confirmationRequired: false,
    productionAuthority: false,
    exactReplaceOnly: mode !== "undo",
    replaceAllAllowed: false
  };
}

export function isSafeAutonomousDevelopmentBranch({ autonomousBranch = "", productionBranch = "" } = {}) {
  const branch = String(autonomousBranch || "").trim();
  const production = String(productionBranch || "").trim();
  if (!branch) return false;
  if (production && branch === production) return false;
  if (/^(main|master|production|prod)$/i.test(branch)) return false;
  if (!/^agent\/ari-[a-z0-9._/-]+$/i.test(branch)) return false;
  return true;
}

export function isProtectedAutonomousDevelopmentPath(filePath = "") {
  const path = String(filePath || "").trim();
  if (!path) return true;
  return AUTONOMOUS_DEV_PROTECTED_PATHS.some((protectedPath) =>
    protectedPath.endsWith("/")
      ? path.startsWith(protectedPath)
      : path === protectedPath || path.startsWith(`${protectedPath}/`)
  );
}

function autonomousBlocked(code, reason, message) {
  return {
    allowed: false,
    branch: null,
    code,
    reason,
    message,
    confirmationRequired: true,
    productionAuthority: false
  };
}

function applyReplace({ currentContent, find, replace, replaceAll = false }) {
  let editedContent = currentContent;

  if (currentContent.includes(find)) {
    editedContent = replaceAll
      ? currentContent.split(find).join(replace)
      : currentContent.replace(find, replace);

    return {
      changed: editedContent !== currentContent,
      editedContent
    };
  }

  const normalizedFind = normalizeLineEndings(find);
  const normalizedContent = normalizeLineEndings(currentContent);

  if (normalizedContent.includes(normalizedFind)) {
    const normalizedEdited = replaceAll
      ? normalizedContent.split(normalizedFind).join(replace)
      : normalizedContent.replace(normalizedFind, replace);

    return {
      changed: normalizedEdited !== normalizedContent,
      editedContent: normalizedEdited
    };
  }

  return {
    changed: false,
    editedContent: currentContent
  };
}

async function commitToGithub({
  res,
  githubFetch,
  apiBase,
  currentFile,
  editedContent,
  branch,
  filePath,
  message,
  mode,
  rollbackPayload = null,
  autonomousDevelopment = false
}) {
  const encoded = Buffer.from(editedContent, "utf8").toString("base64");

  const result = await githubFetch(apiBase, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: encoded,
      sha: currentFile.sha,
      branch
    })
  });

  return res.status(200).json({
    success: true,
    mode,
    authorizationMode: autonomousDevelopment ? "autonomous_development" : "owner_confirmation",
    autonomousDevelopment,
    productionAuthority: false,
    filePath,
    branch,
    commit: result.commit?.html_url || null,
    rollbackPayload,
    message:
      mode === "undo"
        ? "Undo commit created on the selected branch."
        : autonomousDevelopment
          ? "Autonomous development commit created on the isolated Ari branch. Production was not changed."
          : "GitHub commit created. Vercel should redeploy automatically."
  });
}

function normalizeLineEndings(text = "") {
  return String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function makePreview(text = "") {
  const clean = String(text || "");
  if (clean.length <= 300) return clean;
  return `${clean.slice(0, 300)}...`;
}

function buildDiffSummary(before = "", after = "") {
  const beforeLines = String(before).split("\n");
  const afterLines = String(after).split("\n");

  return {
    beforeCharacters: before.length,
    afterCharacters: after.length,
    characterDelta: after.length - before.length,
    beforeLines: beforeLines.length,
    afterLines: afterLines.length,
    lineDelta: afterLines.length - beforeLines.length
  };
}

function findNearbyMatches(content = "", find = "") {
  const cleanFind = String(find || "").trim();

  if (!cleanFind) return [];

  const words = cleanFind
    .split(/\s+/)
    .map(word => word.replace(/[^\w-]/g, ""))
    .filter(word => word.length >= 4)
    .slice(0, 8);

  if (!words.length) return [];

  const lines = String(content || "").split("\n");
  const matches = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    const score = words.reduce((count, word) => {
      return lowerLine.includes(word.toLowerCase()) ? count + 1 : count;
    }, 0);

    if (score > 0) {
      matches.push({
        line: i + 1,
        score,
        preview: line.trim().slice(0, 220)
      });
    }
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function isUnsafeFilePath(filePath = "") {
  const path = String(filePath || "");

  if (!path.trim()) return true;
  if (path.includes("..")) return true;
  if (path.startsWith("/")) return true;
  if (path.includes("\\")) return true;
  if (path.includes("\0")) return true;

  return false;
}

function encodeURIComponentPath(filePath = "") {
  return String(filePath)
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");
}
