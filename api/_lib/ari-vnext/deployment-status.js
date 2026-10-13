// Read-only Vercel observations through the existing server-side GitHub integration.
// Never accept a user-selected repository, credentials, or API URL.
export async function readDeploymentStatus({ token, repo, environment = "production" } = {}) {
  const base = { operation: "deployment_status", source: "github_deployments", environment,
    observedAt: new Date().toISOString(),
    limitation: "GitHub-recorded Vercel status only; live runtime health, logs, and current production aliases are not verified." };
  if (!["production", "preview"].includes(environment)) return { ...base, success: false, code: "DEPLOYMENT_ENVIRONMENT_INVALID" };
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || "") || !token) return { ...base, success: false, code: "DEPLOYMENT_ACCESS_NOT_CONFIGURED" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const request = async path => {
    const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      method: "GET", cache: "no-store", signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }
    });
    if (!response.ok) {
      const error = new Error("Deployment read failed");
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid deployment response");
    return data;
  };
  try {
    // Vercel's GitHub integration uses these environment names. Its production
    // records can have production_environment=false, so do not rely on that flag.
    const label = environment === "production" ? "Production" : "Preview";
    const records = await request(`/deployments?environment=${label}&per_page=30`);
    const selected = records.filter(item => item?.creator?.login === "vercel[bot]" &&
      item.environment === label && Number.isSafeInteger(item.id) && item.id > 0).slice(0, 3);
    const deployments = await Promise.all(selected.map(async item => {
      const statuses = await request(`/deployments/${item.id}/statuses?per_page=1`);
      const status = statuses[0];
      return { id: item.id, sha: String(item.sha || "").slice(0, 64),
        ref: String(item.ref || "").slice(0, 180), createdAt: item.created_at || null,
        status: status?.state || "unknown", statusAt: status?.created_at || null,
        deploymentUrl: safeUrl(status?.environment_url), detailsUrl: safeUrl(status?.log_url) };
    }));
    return { ...base, success: true, deployments, recordsScanned: records.length,
      searchScope: `Up to 30 newest GitHub records in ${label}, returning up to 3 created by vercel[bot]. An empty result does not prove no deployments exist.` };
  } catch (error) {
    return { ...base, success: false,
      code: [401, 403, 404].includes(error.status) ? "DEPLOYMENT_ACCESS_UNAVAILABLE" : controller.signal.aborted ? "DEPLOYMENT_READ_TIMEOUT" : "DEPLOYMENT_READ_FAILED",
      httpStatus: error.status || null,
      message: "Could not read deployment records. Check the configured GitHub integration's repository access and Deployments read permission. Repository code search cannot resolve this status request." };
  } finally {
    clearTimeout(timer);
  }
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
