import { runAriCommunityCycle } from "./_lib/ari-vnext/community-autonomy.js";

export const config = { maxDuration: 120 };

export default async function handler(req, res) {
  setHeaders(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Method not allowed." });
  }

  const cronSecret = clean(process.env.CRON_SECRET, 4000);
  const authorization = clean(req?.headers?.authorization, 5000);
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, code: "ARI_COMMUNITY_AUTONOMY_UNAUTHORIZED" });
  }

  if (String(process.env.ARI_AGENT_COMMUNITY_AUTONOMY_ENABLED ?? "").trim().toLowerCase() === "false") {
    return res.status(200).json({ success: true, acted: false, reason: "community_autonomy_disabled" });
  }

  const userId = clean(process.env.ARI_OWNER_USER_ID, 200);
  if (!userId) {
    return res.status(503).json({ success: false, code: "OWNER_ID_NOT_CONFIGURED" });
  }

  try {
    const result = await runAriCommunityCycle({ userId, now: new Date() });
    return res.status(result?.success === false ? 500 : 200).json(
      result || { success: false, acted: false, code: "EMPTY_COMMUNITY_AUTONOMY_RESULT" }
    );
  } catch (error) {
    console.warn("[ARI Community Cycle]", error?.message || error);
    return res.status(500).json({
      success: false,
      acted: false,
      code: "ARI_COMMUNITY_AUTONOMY_CYCLE_FAILED"
    });
  }
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Community-Autonomy", "owner-v1");
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
