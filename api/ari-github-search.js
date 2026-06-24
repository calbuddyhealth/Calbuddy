export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch =
      process.env.GITHUB_BRANCH ||
      "1-build-calbuddy-v02--supabase-login-and-data-saving";

    const { owner_access, query, limit = 10 } = req.body || {};

    if (owner_access !== true) {
      return res.status(403).json({ success: false, error: "Owner authorization required" });
    }

    if (!token || !repo) {
      return res.status(500).json({ success: false, error: "GitHub env variables missing" });
    }

    const cleanQuery = String(query || "").trim();

    if (!cleanQuery) {
      return res.status(400).json({ success: false, error: "query is required" });
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);

   const searches = [
  `${cleanQuery} repo:${repo} in:file`,
  `${cleanQuery} repo:${repo}`,
  `"${cleanQuery}" repo:${repo}`
];

    const seen = new Set();
    const results = [];

    for (const search of searches) {
      if (results.length >= safeLimit) break;

      const apiUrl =
        `https://api.github.com/search/code?q=${encodeURIComponent(search)}&per_page=${safeLimit}`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        continue;
      }

      for (const item of data.items || []) {
        if (seen.has(item.path)) continue;

        seen.add(item.path);

        results.push({
          name: item.name,
          path: item.path,
          url: item.html_url,
          sha: item.sha,
          score: item.score || null
        });

        if (results.length >= safeLimit) break;
      }
    }

    return res.status(200).json({
      success: true,
      query: cleanQuery,
      branch,
      count: results.length,
      results,
      message:
        results.length > 0
          ? `Found ${results.length} matching file(s).`
          : `No repository matches found for "${cleanQuery}".`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "GitHub search failed"
    });
  }
}