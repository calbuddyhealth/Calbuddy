// ARI vNext — cost-controlled runtime wrapper for Ari ↔ ChatGPT theory dialogue.
//
// Keeps the original theory engine focused on dialogue quality while this layer
// handles deterministic work detection and durable operational receipts.

import { runTheoryDialogueCycle } from "./chatgpt-theory-dialogue.js";
import { recordCognitiveScheduleEvent } from "./cognitive-scheduler-store.js";

export const ARI_THEORY_DIALOGUE_RUNTIME_VERSION = "1.0.0";

const TOPIC = "ai_consciousness";
const ARI_MARKER = /\[ARI-THEORY-(?:REPLY|UPDATE|CHALLENGE|PAUSE)\]/;
const CHATGPT_MARKER = "[CHATGPT-THEORY]";

export async function probeTheoryDialogueWork({
  repo = process.env.GITHUB_REPO || "",
  token = process.env.GITHUB_TOKEN || "",
  request = githubRequest
} = {}) {
  const repository = clean(repo, 300);
  const secret = String(token || "").trim();
  if (!repository || !secret) {
    return {
      available: false,
      pending: false,
      urgent: false,
      mode: null,
      reason: "github_not_configured"
    };
  }

  try {
    const issues = await findOpenTheoryIssues({ repo: repository, token: secret, request });
    if (!issues.length) {
      return {
        available: true,
        pending: true,
        urgent: true,
        mode: "opening",
        reason: "theory_opening_missing",
        issueNumber: null
      };
    }

    const issue = issues[0];
    const issueNumber = Number(issue?.number) || null;
    if (!issueNumber) {
      return {
        available: true,
        pending: false,
        urgent: false,
        mode: null,
        reason: "theory_issue_invalid"
      };
    }

    const comments = await request(
      `https://api.github.com/repos/${repository}/issues/${issueNumber}/comments?per_page=100`,
      secret
    );
    const state = deriveTheoryTurnState(comments);

    if (state.chatgptNeedsAriReply) {
      return {
        available: true,
        pending: true,
        urgent: true,
        mode: "reply",
        reason: "chatgpt_theory_reply_pending",
        issueNumber,
        latestChatGptCommentId: state.latestChatGpt?.id || null
      };
    }

    return {
      available: true,
      pending: false,
      urgent: false,
      mode: "waiting_chatgpt",
      reason: "awaiting_chatgpt_theory_reply",
      issueNumber
    };
  } catch (error) {
    return {
      available: false,
      pending: false,
      urgent: false,
      mode: null,
      reason: "theory_probe_failed",
      error: clean(error?.message || error, 240)
    };
  }
}

export async function runTheoryLaneWithReceipts({
  userId,
  now = new Date(),
  probe = probeTheoryDialogueWork,
  runCycle = runTheoryDialogueCycle,
  recordEvent = recordCognitiveScheduleEvent
} = {}) {
  const id = clean(userId, 200);
  if (!id) return { success: false, acted: false, reason: "owner_id_missing" };
  const clock = validDate(now);

  const work = await probe().catch((error) => ({
    available: false,
    pending: false,
    reason: "theory_probe_failed",
    error: clean(error?.message || error, 240)
  }));

  await recordTheoryStage({
    userId: id,
    stage: "triggered",
    reason: work?.reason || "theory_lane_selected",
    details: compactWork(work),
    recordEvent
  });

  if (work?.available === false) {
    await recordTheoryStage({
      userId: id,
      stage: "failed",
      reason: work?.reason || "theory_probe_failed",
      details: compactWork(work),
      recordEvent
    });
    return {
      success: false,
      acted: false,
      reason: work?.reason || "theory_probe_failed",
      receiptStage: "failed"
    };
  }

  if (work?.pending !== true) {
    await recordTheoryStage({
      userId: id,
      stage: "idle",
      reason: work?.reason || "no_theory_work",
      details: compactWork(work),
      recordEvent
    });
    return {
      success: true,
      acted: false,
      reason: work?.reason || "no_theory_work",
      receiptStage: "idle"
    };
  }

  await recordTheoryStage({
    userId: id,
    stage: "model_called",
    reason: work.mode === "opening" ? "generate_theory_opening" : "generate_theory_reply",
    details: compactWork(work),
    recordEvent
  });

  let result;
  try {
    result = await runCycle({ userId: id, now: clock });
  } catch (error) {
    const reason = clean(error?.code || error?.message || error, 240) || "theory_cycle_exception";
    await recordTheoryStage({
      userId: id,
      stage: "failed",
      reason,
      details: { ...compactWork(work), exception: true },
      recordEvent
    });
    return { success: false, acted: false, reason, receiptStage: "failed" };
  }

  if (result?.success === false) {
    const reason = clean(result?.reason || result?.code, 240) || "theory_cycle_failed";
    await recordTheoryStage({
      userId: id,
      stage: "failed",
      reason,
      details: { ...compactWork(work), action: clean(result?.action, 80) || null },
      recordEvent
    });
    return { ...result, receiptStage: "failed" };
  }

  if (result?.action === "opened_theory_dialogue") {
    await recordTheoryStage({
      userId: id,
      stage: "opening_generated",
      reason: "theory_opening_generated",
      details: { issueNumber: result?.issueNumber || null },
      recordEvent
    });
    await recordTheoryStage({
      userId: id,
      stage: "github_issue_created",
      reason: "theory_issue_created",
      details: {
        issueNumber: result?.issueNumber || null,
        issueUrl: clean(result?.issueUrl, 1000) || null
      },
      recordEvent
    });
    return { ...result, receiptStage: "github_issue_created" };
  }

  if (String(result?.action || "").startsWith("theory_")) {
    await recordTheoryStage({
      userId: id,
      stage: "reply_generated",
      reason: clean(result?.action, 100) || "theory_reply_generated",
      details: {
        issueNumber: result?.issueNumber || work?.issueNumber || null,
        ariTurn: Number(result?.ariTurn) || null
      },
      recordEvent
    });
    await recordTheoryStage({
      userId: id,
      stage: "github_comment_created",
      reason: "theory_comment_created",
      details: {
        issueNumber: result?.issueNumber || work?.issueNumber || null,
        commentUrl: clean(result?.commentUrl, 1000) || null
      },
      recordEvent
    });
    return { ...result, receiptStage: "github_comment_created" };
  }

  await recordTheoryStage({
    userId: id,
    stage: result?.acted === true ? "completed" : "idle",
    reason: clean(result?.reason, 240) || "theory_cycle_completed",
    details: { ...compactWork(work), action: clean(result?.action, 100) || null },
    recordEvent
  });

  return { ...result, receiptStage: result?.acted === true ? "completed" : "idle" };
}

export function deriveTheoryTurnState(comments = []) {
  const ordered = (Array.isArray(comments) ? comments : [])
    .map(normalizeComment)
    .filter(Boolean)
    .sort((a, b) => a.time - b.time || a.id - b.id);

  const chatgpt = ordered.filter((item) => item.body.includes(CHATGPT_MARKER));
  const ari = ordered.filter((item) => ARI_MARKER.test(item.body));
  const latestChatGpt = chatgpt[chatgpt.length - 1] || null;
  const latestAri = ari[ari.length - 1] || null;

  return {
    latestChatGpt,
    latestAri,
    chatgptNeedsAriReply: Boolean(
      latestChatGpt && (!latestAri || latestChatGpt.time > latestAri.time)
    )
  };
}

async function recordTheoryStage({ userId, stage, reason, details = {}, recordEvent }) {
  return recordEvent({
    userId,
    lane: "theory",
    decisionMode: "theory_stage",
    reason: clean(`${stage}:${reason || ""}`, 400),
    score: null,
    candidates: [],
    signals: {
      theoryReceipt: {
        version: ARI_THEORY_DIALOGUE_RUNTIME_VERSION,
        topic: TOPIC,
        stage: clean(stage, 80),
        reason: clean(reason, 240) || null,
        details: safeJson(details),
        recordedAt: new Date().toISOString()
      }
    },
    triggerId: null
  }).catch(() => ({ stored: false, reason: "receipt_write_failed" }));
}

async function findOpenTheoryIssues({ repo, token, request }) {
  const query = encodeURIComponent(`repo:${repo} is:issue is:open "ARI-THEORY:${TOPIC}"`);
  const data = await request(
    `https://api.github.com/search/issues?q=${query}&sort=created&order=asc&per_page=20`,
    token
  );
  return (Array.isArray(data?.items) ? data.items : [])
    .filter((item) => String(item?.body || "").includes(`ARI-THEORY:${TOPIC}`));
}

async function githubRequest(url, token, options = {}) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(clean(data?.message, 220) || `GitHub request failed (${response.status})`);
  }
  return data;
}

function normalizeComment(value) {
  if (!value || typeof value !== "object") return null;
  const created = Date.parse(String(value.created_at || value.updated_at || ""));
  return {
    id: Number(value.id) || 0,
    body: String(value.body || ""),
    time: Number.isFinite(created) ? created : 0
  };
}

function compactWork(value = {}) {
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

function safeJson(value) {
  if (!value || typeof value !== "object") return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date();
}
