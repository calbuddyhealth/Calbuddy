import { runBackgroundAgentBatch } from "./_lib/ari-vnext/background-agent-runtime.js";

export const config = { maxDuration: 240 };

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Method not allowed." });
  }

  const cronSecret = clean(process.env.CRON_SECRET, 5000);
  const authorization = clean(req?.headers?.authorization, 6000);
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({
      success: false,
      code: "ARI_AGENT_WORKER_UNAUTHORIZED"
    });
  }

  if (String(process.env.ARI_DURABLE_AGENT_ASYNC_ENABLED || "true").trim().toLowerCase() === "false") {
    return res.status(200).json({
      success: true,
      version: "1.0.0",
      claimed: 0,
      completed: 0,
      reason: "async_agent_worker_disabled"
    });
  }

  const batchSize = intEnv("ARI_ASYNC_WORKER_BATCH_SIZE", 2, 1, 6);
  const visibilitySeconds = intEnv(
    "ARI_ASYNC_WORKER_VISIBILITY_SECONDS",
    300,
    60,
    900
  );

  try {
    const result = await runBackgroundAgentBatch({
      limit: batchSize,
      visibilitySeconds
    });
    console.info("[ARI Background Agent Worker]", {
      claimed: Number(result?.claimed || 0),
      completed: Number(result?.completed || 0),
      retried: Number(result?.retried || 0),
      deadlettered: Number(result?.deadlettered || 0),
      verifiersQueued: Number(result?.verifiersQueued || 0),
      resolversQueued: Number(result?.resolversQueued || 0),
      stoppedForRateLimit: result?.stoppedForRateLimit === true
    });
    return res.status(result?.success === false ? 500 : 200).json(result);
  } catch (error) {
    console.error("[ARI Background Agent Worker Fatal]", clean(error?.message || error, 500));
    return res.status(500).json({
      success: false,
      code: "ARI_AGENT_WORKER_FAILED",
      error: clean(error?.message || error, 300)
    });
  }
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Agent-Worker", "pgmq-v1");
}

function intEnv(name, fallback, min, max) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
