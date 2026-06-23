// api/ari-github-edit.js
// Ari GitHub Edit Endpoint
// V2.0.0 — Safer Replace / Better Errors / Preview First / Undo Ready

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
        code: "METHOD_NOT_ALLOWED"
      });
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch =
      process.env.GITHUB_BRANCH ||
      "1-build-calbuddy-v02--supabase-login-and-data-saving";

    if (!token || !repo) {
      return res.status(500).json({
        success: false,
        error: "GitHub env variables missing",
        code: "MISSING_GITHUB_ENV"
      });
    }

    const {
      owner_access,
      mode,
      filePath,
      newContent,
      operation = "replace",
      find,
      replace,
      commitMessage,
      confirmationText,
      previousContent,
      replaceAll = false
    } = req.body || {};

    if (owner_access !== true) {
      return res.status(403).json({
        success: false,
        error: "Owner authorization required",
        code: "OWNER_AUTH_REQUIRED"
      });
    }

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
      if (confirmationText !== "CONFIRM GITHUB EDIT") {
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
        mode: "undo"
      });
    }

    if (operation === "full_replace") {
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
        replaceAll
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
        filePath,
        branch,
        operation,
        replaceAll,
        currentContent,
        proposedContent: editedContent,
        diffSummary: buildDiffSummary(currentContent, editedContent),
        message:
          "Preview ready. No GitHub changes were made. Type CONFIRM GITHUB EDIT to commit."
      });
    }

    if (mode === "commit") {
      if (confirmationText !== "CONFIRM GITHUB EDIT") {
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
        rollbackPayload: {
          mode: "undo",
          filePath,
          previousContent: currentContent,
          confirmationText: "CONFIRM GITHUB EDIT"
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
  rollbackPayload = null
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
    filePath,
    branch,
    commit: result.commit?.html_url || null,
    rollbackPayload,
    message:
      mode === "undo"
        ? "Undo commit created. Vercel should redeploy automatically."
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