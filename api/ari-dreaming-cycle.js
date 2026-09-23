import { runAriDreamingCycle } from "./_lib/ari-vnext/dreaming-runtime.js";

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
    return res.status(401).json({ success: false, code: "ARI_DREAMING_UNAUTHORIZED" });
  }
  if (String(process.env.ARI_DREAMING_ENABLED || "").trim().toLowerCase() === "false") {
    return res.status(200).json({ success: true, dreamed: false, reason: "dreaming_disabled" });
  }

  const userId = clean(process.env.ARI_OWNER_USER_ID, 200);
  if (!userId) return res.status(503).json({ success: false, code: "OWNER_ID_NOT_CONFIGURED" });

  try {
    const result = await runAriDreamingCycle({ userId, now: new Date() });
    return res.status(result?.success === false ? 500 : 200).json(result);
  } catch (error) {
    console.warn("[ARI Dreaming]", error?.message || error);
    return res.status(500).json({ success: false, dreamed: false, code: "ARI_DREAMING_CYCLE_FAILED" });
  }
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Dreaming", "owner-v1");
}
function clean(value, max = 1000) { return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max); }
