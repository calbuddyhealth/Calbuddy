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

    const { owner_access, query } = req.body || {};

    if (owner_access !== true) {
      return res.status(403).json({ error: "Owner authorization required" });
    }

    if (!token || !repo) {
      return res.status(500).json({ error: "GitHub env variables missing" });
    }

    if (!query || !String(query).trim()) {
      return res.status(400).json({ error: "query is required" });
    }

   const searchQuery = `${query} repo:${repo} in:file`;
    const apiUrl =
      `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}`;

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
        error: data.message || "GitHub search failed"
      });
    }

    const results = (data.items || []).slice(0, 10).map(item => ({
      name: item.name,
      path: item.path,
      url: item.html_url,
      sha: item.sha
    }));

    return res.status(200).json({
      success: true,
      query,
      branch,
      count: results.length,
      results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Something went wrong"
    });
  }
}