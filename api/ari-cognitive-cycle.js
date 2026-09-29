import { runAriCognitiveScheduler } from "./_lib/ari-vnext/cognitive-scheduler.js";
import { enqueueCognitiveTrigger } from "./_lib/ari-vnext/cognitive-scheduler-store.js";

export const config = { maxDuration: 180 };

export default async function handler(req, res) {
  setHeaders(res);
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ success: false, error: "Method not allowed." });
  }

  const cronSecret = clean(process.env.CRON_SECRET, 4000);
  const authorization = clean(req?.headers?.authorization, 5000);
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, code: "ARI_COGNITIVE_SCHEDULER_UNAUTHORIZED" });
  }

  if (String(process.env.ARI_COGNITIVE_SCHEDULER_ENABLED ?? "true").trim().toLowerCase() === "false") {
    return res.status(200).json({ success: true, acted: false, reason: "cognitive_scheduler_disabled" });
  }

  const userId = clean(process.env.ARI_OWNER_USER_ID, 200);
  if (!userId) {
    return res.status(503).json({ success: false, acted: false, code: "OWNER_ID_NOT_CONFIGURED" });
  }

  try {
    if (req.method === "POST") {
      const body = req?.body && typeof req.body === "object" ? req.body : {};
      const queued = await enqueueCognitiveTrigger({
        userId,
        lane: body?.lane,
        reason: body?.reason,
        priority: body?.priority || "urgent",
        payload: body?.payload || {},
        notBefore: body?.notBefore || null,
        expiresAt: body?.expiresAt || null
      });
      return res.status(queued?.queued ? 202 : 400).json({
        success: queued?.queued === true,
        queued: queued?.queued === true,
        trigger: queued?.trigger || null,
        reason: queued?.reason || null
      });
    }

    const result = await runAriCognitiveScheduler({ userId, now: new Date() });
    return res.status(result?.success === false ? 500 : 200).json(result);
  } catch (error) {
    console.warn("[ARI Cognitive Scheduler]", error?.message || error);
    return res.status(500).json({
      success: false,
      acted: false,
      code: error?.code || "ARI_COGNITIVE_SCHEDULER_FAILED"
    });
  }
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Cognitive-Scheduler", "v2");
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
