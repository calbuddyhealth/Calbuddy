import { runAriCognitiveScheduler } from "./_lib/ari-vnext/cognitive-scheduler.js";
import {
  enqueueCognitiveTrigger,
  recordCognitiveScheduleEvent
} from "./_lib/ari-vnext/cognitive-scheduler-store.js";
import { probeTheoryDialogueWork } from "./_lib/ari-vnext/theory-dialogue-runtime.js";

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

    const now = new Date();
    const theoryWork = theoryLaneConfigured()
      ? await probeTheoryDialogueWork().catch((error) => ({
          available: false,
          pending: false,
          reason: "theory_probe_failed",
          error: clean(error?.message || error, 240)
        }))
      : null;

    let trigger = null;
    if (theoryWork?.pending === true) {
      trigger = {
        id: theoryTriggerId(theoryWork),
        lane: "theory",
        reason: clean(theoryWork?.reason, 240) || "theory_dialogue_pending"
      };
      await recordTheoryReceipt({
        userId,
        stage: "triggered",
        reason: trigger.reason,
        details: theoryWork
      });
    }

    const result = await runAriCognitiveScheduler({ userId, now, trigger });

    if (theoryWork?.pending === true) {
      await recordTheorySchedulerOutcome({ userId, theoryWork, result });
    }

    return res.status(result?.success === false ? 500 : 200).json({
      ...result,
      theoryWork: theoryWork ? compactTheoryWork(theoryWork) : null
    });
  } catch (error) {
    console.warn("[ARI Cognitive Scheduler]", error?.message || error);
    return res.status(500).json({
      success: false,
      acted: false,
      code: error?.code || "ARI_COGNITIVE_SCHEDULER_FAILED"
    });
  }
}

async function recordTheorySchedulerOutcome({ userId, theoryWork, result }) {
  const laneResult = result?.lane === "theory" ? result?.laneResult : null;

  if (!laneResult) {
    await recordTheoryReceipt({
      userId,
      stage: "failed",
      reason: clean(result?.reason || result?.decision?.reason, 240) || "theory_lane_not_run",
      details: {
        ...compactTheoryWork(theoryWork),
        schedulerLane: clean(result?.lane, 40) || null,
        budgetReason: clean(result?.budget?.reason, 120) || null
      }
    });
    return;
  }

  await recordTheoryReceipt({
    userId,
    stage: "model_called",
    reason: theoryWork?.mode === "opening" ? "generate_theory_opening" : "generate_theory_reply",
    details: compactTheoryWork(theoryWork)
  });

  if (laneResult?.success === false) {
    await recordTheoryReceipt({
      userId,
      stage: "failed",
      reason: clean(laneResult?.reason || laneResult?.code, 240) || "theory_cycle_failed",
      details: {
        ...compactTheoryWork(theoryWork),
        action: clean(laneResult?.action, 80) || null
      }
    });
    return;
  }

  if (laneResult?.action === "opened_theory_dialogue") {
    await recordTheoryReceipt({
      userId,
      stage: "opening_generated",
      reason: "theory_opening_generated",
      details: { issueNumber: Number(laneResult?.issueNumber) || null }
    });
    await recordTheoryReceipt({
      userId,
      stage: "github_issue_created",
      reason: "theory_issue_created",
      details: {
        issueNumber: Number(laneResult?.issueNumber) || null,
        issueUrl: clean(laneResult?.issueUrl, 1000) || null
      }
    });
    return;
  }

  if (String(laneResult?.action || "").startsWith("theory_")) {
    await recordTheoryReceipt({
      userId,
      stage: "reply_generated",
      reason: clean(laneResult?.action, 100) || "theory_reply_generated",
      details: {
        issueNumber: Number(laneResult?.issueNumber || theoryWork?.issueNumber) || null,
        ariTurn: Number(laneResult?.ariTurn) || null
      }
    });
    await recordTheoryReceipt({
      userId,
      stage: "github_comment_created",
      reason: "theory_comment_created",
      details: {
        issueNumber: Number(laneResult?.issueNumber || theoryWork?.issueNumber) || null,
        commentUrl: clean(laneResult?.commentUrl, 1000) || null
      }
    });
    return;
  }

  await recordTheoryReceipt({
    userId,
    stage: laneResult?.acted === true ? "completed" : "idle",
    reason: clean(laneResult?.reason, 240) || "theory_cycle_completed",
    details: {
      ...compactTheoryWork(theoryWork),
      action: clean(laneResult?.action, 100) || null
    }
  });
}

async function recordTheoryReceipt({ userId, stage, reason, details = {} }) {
  return recordCognitiveScheduleEvent({
    userId,
    lane: "theory",
    decisionMode: "theory_stage",
    reason: clean(`${stage}:${reason || ""}`, 400),
    score: null,
    candidates: [],
    signals: {
      theoryReceipt: {
        version: "1.0.0",
        topic: "ai_consciousness",
        stage: clean(stage, 80),
        reason: clean(reason, 240) || null,
        details: compactObject(details),
        recordedAt: new Date().toISOString()
      }
    },
    triggerId: null
  }).catch(() => ({ stored: false, reason: "receipt_write_failed" }));
}

function theoryLaneConfigured() {
  return String(process.env.ARI_CHATGPT_THEORY_DIALOGUE_ENABLED || "").trim().toLowerCase() === "true";
}

function theoryTriggerId(work = {}) {
  const issue = Number(work?.issueNumber) || 0;
  const comment = Number(work?.latestChatGptCommentId) || 0;
  return clean(`theory:${work?.mode || "work"}:${issue}:${comment}`, 80);
}

function compactTheoryWork(value = {}) {
  return {
    available: value?.available !== false,
    pending: value?.pending === true,
    urgent: value?.urgent === true,
    mode: clean(value?.mode, 40) || null,
    reason: clean(value?.reason, 160) || null,
    issueNumber: Number(value?.issueNumber) || null,
    latestChatGptCommentId: Number(value?.latestChatGptCommentId) || null,
    error: clean(value?.error, 220) || null
  };
}

function compactObject(value) {
  if (!value || typeof value !== "object") return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Cognitive-Scheduler", "v2.1");
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
