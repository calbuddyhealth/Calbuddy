export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch =
      process.env.GITHUB_BRANCH ||
      "1-build-calbuddy-v02--supabase-login-and-data-saving";

    const { owner_access, filePath } = req.body || {};

    if (owner_access !== true) {
      return res.status(403).json({ error: "Owner authorization required" });
    }

    if (!token || !repo) {
      return res.status(500).json({ error: "GitHub env variables missing" });
    }

    if (!filePath) {
      return res.status(400).json({ error: "filePath is required" });
    }

    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${encodeURIComponent(branch)}`;

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
        error: data.message || "GitHub read failed"
      });
    }

    const content = Buffer.from(data.content || "", "base64").toString("utf8");

    return res.status(200).json({
      success: true,
      filePath,
      branch,
      sha: data.sha,
      content
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Something went wrong"
    });
  }
}