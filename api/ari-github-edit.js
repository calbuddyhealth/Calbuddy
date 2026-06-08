export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch =
      process.env.GITHUB_BRANCH ||
      "1-build-calbuddy-v02--supabase-login-and-data-saving";

    if (!token || !repo) {
      return res.status(500).json({ error: "GitHub env variables missing" });
    }

    const {
      owner_access,
      mode,
      filePath,
      newContent,
      commitMessage,
      confirmationText,
      previousContent
    } = req.body || {};

    if (owner_access !== true) {
      return res.status(403).json({ error: "Owner authorization required" });
    }

    if (!["preview", "commit", "undo"].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }

    if (!filePath) {
      return res.status(400).json({ error: "filePath is required" });
    }

    const apiBase = `https://api.github.com/repos/${repo}/contents/${filePath}`;

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
        throw new Error(data.message || "GitHub API request failed");
      }

      return data;
    }

    const currentFile = await githubFetch(
      `${apiBase}?ref=${encodeURIComponent(branch)}`
    );

    const currentContent = Buffer.from(
      currentFile.content || "",
      "base64"
    ).toString("utf8");

    if (mode === "preview") {
      return res.status(200).json({
        success: true,
        mode: "preview",
        filePath,
        branch,
        currentContent,
        proposedContent: newContent || "",
        message:
          "Preview ready. No GitHub changes were made. Type CONFIRM GITHUB EDIT to commit."
      });
    }

    if (mode === "commit") {
      if (confirmationText !== "CONFIRM GITHUB EDIT") {
        return res.status(403).json({
          error: "Exact confirmation required: CONFIRM GITHUB EDIT"
        });
      }

      if (!newContent) {
        return res.status(400).json({ error: "newContent is required" });
      }

      const encoded = Buffer.from(newContent, "utf8").toString("base64");

      const result = await githubFetch(apiBase, {
        method: "PUT",
        body: JSON.stringify({
          message: commitMessage || `Ari update ${filePath}`,
          content: encoded,
          sha: currentFile.sha,
          branch
        })
      });

      return res.status(200).json({
        success: true,
        mode: "commit",
        filePath,
        branch,
        commit: result.commit?.html_url || null,
        rollbackPayload: {
          mode: "undo",
          filePath,
          previousContent: currentContent,
          confirmationText: "CONFIRM GITHUB EDIT"
        },
        message: "GitHub commit created. Vercel should redeploy automatically."
      });
    }

    if (mode === "undo") {
      if (confirmationText !== "CONFIRM GITHUB EDIT") {
        return res.status(403).json({
          error: "Exact confirmation required: CONFIRM GITHUB EDIT"
        });
      }

      if (!previousContent) {
        return res.status(400).json({
          error: "previousContent is required for undo"
        });
      }

      const encoded = Buffer.from(previousContent, "utf8").toString("base64");

      const result = await githubFetch(apiBase, {
        method: "PUT",
        body: JSON.stringify({
          message: `Undo Ari edit to ${filePath}`,
          content: encoded,
          sha: currentFile.sha,
          branch
        })
      });

      return res.status(200).json({
        success: true,
        mode: "undo",
        filePath,
        branch,
        commit: result.commit?.html_url || null,
        message: "Undo commit created. Vercel should redeploy automatically."
      });
    }
  } catch (err) {
    console.error("Ari GitHub edit error:", err);
    return res.status(500).json({ error: err.message });
  }
}