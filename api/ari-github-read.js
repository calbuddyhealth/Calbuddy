// api/ari-github-read.js
// Ari GitHub Read Endpoint
// V2.0.0 — Safer File Reads / Better Errors / Branch-Aware

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

    const { owner_access, filePath } = req.body || {};

    if (owner_access !== true) {
      return res.status(403).json({
        success: false,
        error: "Owner authorization required",
        code: "OWNER_AUTH_REQUIRED"
      });
    }

    if (!token || !repo) {
      return res.status(500).json({
        success: false,
        error: "GitHub env variables missing",
        code: "MISSING_GITHUB_ENV"
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

    const apiUrl = `https://api.github.com/repos/${repo}/contents/${encodeURIComponentPath(
      filePath
    )}?ref=${encodeURIComponent(branch)}`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || "GitHub read failed",
        code: "GITHUB_READ_FAILED",
        filePath,
        branch,
        github: data
      });
    }

    if (Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: "Requested path is a directory, not a file.",
        code: "PATH_IS_DIRECTORY",
        filePath,
        branch,
        entries: data.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type
        }))
      });
    }

    if (!data.content || data.encoding !== "base64") {
      return res.status(400).json({
        success: false,
        error: "GitHub file content was not readable.",
        code: "UNREADABLE_CONTENT",
        filePath,
        branch,
        encoding: data.encoding || null
      });
    }

    const content = Buffer.from(data.content, "base64").toString("utf8");

    return res.status(200).json({
      success: true,
      filePath,
      branch,
      sha: data.sha,
      size: data.size || content.length,
      encoding: data.encoding,
      content,
      contentPreview: makePreview(content),
      message: `Read ${filePath} successfully.`
    });
  } catch (error) {
    console.error("Ari GitHub read error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Something went wrong",
      code: "ARI_GITHUB_READ_FAILED"
    });
  }
}

function makePreview(text = "") {
  const clean = String(text || "");
  if (clean.length <= 1200) return clean;
  return `${clean.slice(0, 1200)}...`;
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