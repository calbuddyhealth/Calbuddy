// ARI vNext — self-repair observation and ChatGPT handoff.
//
// Ari remains the diagnostician: she identifies a concrete failure, gathers
// repository evidence, and proposes a bounded fix. This module turns that
// proposal into an auditable GitHub issue for an independent ChatGPT review.
// It never edits code, merges branches, or changes production.

import { createHash } from "node:crypto";

export const ARI_CHATGPT_REPAIR_HANDOFF_VERSION = "1.0.0";

const MAX_GOALS = 4;
const MAX_TITLE = 120;
const MAX_BODY_TEXT = 5000;

export function isChatGptRepairHandoffEnabled(value = process.env.ARI_CHATGPT_REPAIR_HANDOFF_ENABLED) {
  return String(value ?? "").trim().toLowerCase() !== "false";
}

export function deriveSelfRepairGoals({ state = null, ciUpdate = null, maxGoals = MAX_GOALS } = {}) {
  const recent = Array.isArray(state?.recent) ? state.recent : [];
  const observations = [];

  if (ciUpdate?.commitSha && ["failed", "blocked"].includes(clean(ciUpdate.ciStatus, 40))) {
    const related = recent.find((item) => clean(item?.commitSha, 120) === clean(ciUpdate.commitSha, 120)) || {};
    observations.push({
      ...related,
      commitSha: ciUpdate.commitSha,
      ciStatus: ciUpdate.ciStatus,
      status: `ci_${ciUpdate.ciStatus}`,
      evidence: related?.ciEvidence || related?.evidence || `Repository CI reported ${ciUpdate.ciStatus} for ${ciUpdate.commitSha}.`,
      source: "current_ci_update"
    });
  }

  for (const item of recent) {
    const ciStatus = clean(item?.ciStatus, 40);
    const status = clean(item?.status, 80);
    const reason = clean(item?.reason, 140);
    const failureLike =
      ["failed", "blocked"].includes(ciStatus) ||
      /(?:^|_)failed(?:$|_)|(?:^|_)blocked(?:$|_)/i.test(status) ||
      /(?:failed|blocked|rejected|unavailable|validation_|outside_verified)/i.test(reason);

    if (!failureLike) continue;
    observations.push({ ...item, source: "autonomy_recent" });
  }

  const seen = new Set();
  const goals = [];

  for (const observation of observations) {
    const signature = [
      clean(observation.commitSha, 120),
      clean(observation.filePath, 500),
      clean(observation.reason, 140),
      clean(observation.ciStatus, 40),
      clean(observation.summary, 260)
    ].join("|");

    const key = hash(signature || JSON.stringify(observation)).slice(0, 16);
    if (seen.has(key)) continue;
    seen.add(key);

    const ciStatus = clean(observation.ciStatus, 40);
    const reason = clean(observation.reason, 140);
    const filePath = clean(observation.filePath, 500);
    const evidence = clean(observation.ciEvidence || observation.evidence || observation.summary, 700);
    const severity = ciStatus === "failed" ? 0.98 : ciStatus === "blocked" ? 0.94 : 0.9;

    goals.push({
      id: `ari_repair:${key}`,
      label: filePath
        ? `Diagnose and propose a repair for the observed failure affecting ${filePath}.`
        : "Diagnose and propose a repair for an observed Ari runtime or CI failure.",
      topic: "developer",
      domain: "ari_independence",
      status: "open",
      priority: severity,
      informationGain: 0.9,
      source: "self_observer",
      observedFailure: {
        at: clean(observation.at, 80) || null,
        status: clean(observation.status, 80) || null,
        reason: reason || null,
        ciStatus: ciStatus || null,
        commitSha: clean(observation.commitSha, 120) || null,
        branch: clean(observation.branch, 240) || null,
        filePath: filePath || null,
        summary: clean(observation.summary, 700) || null,
        evidence: evidence || null
      }
    });

    if (goals.length >= Math.max(1, Math.min(10, Number(maxGoals) || MAX_GOALS))) break;
  }

  return goals;
}

export function buildRepairHandoffIssue({ goal = {}, proposal = {}, planning = {}, files = [], now = new Date() } = {}) {
  const handoffKey = hash(JSON.stringify({
    goalId: clean(goal?.id, 200),
    filePath: clean(proposal?.filePath, 500),
    find: String(proposal?.find || ""),
    replace: String(proposal?.replace || "")
  })).slice(0, 20);

  const titleText = clean(
    proposal?.summary ||
    goal?.label ||
    "Ari self-repair proposal",
    MAX_TITLE - 24
  );
  const title = `[ARI→CHATGPT] ${titleText}`.slice(0, MAX_TITLE);

  const reviewedFiles = (Array.isArray(files) ? files : [])
    .map((item) => clean(item?.path, 500))
    .filter(Boolean)
    .slice(0, 8);

  const packet = {
    schema: "ari_chatgpt_repair_handoff_v1",
    handoffKey,
    createdAt: toIso(now),
    proposer: "Ari",
    requestedReviewer: "ChatGPT",
    goal: {
      id: clean(goal?.id, 200) || null,
      label: clean(goal?.label, 500) || null,
      source: clean(goal?.source, 80) || null,
      observedFailure: goal?.observedFailure || null
    },
    proposal: {
      action: clean(proposal?.action, 40) || null,
      filePath: clean(proposal?.filePath, 500) || null,
      commitMessage: clean(proposal?.commitMessage, 160) || null,
      summary: clean(proposal?.summary, 1200) || null,
      evidence: clean(proposal?.evidence, 1800) || null,
      expectedBenefit: clean(proposal?.expectedBenefit, 1200) || null,
      confidence: finite(proposal?.confidence, 0.5),
      tests: (Array.isArray(proposal?.tests) ? proposal.tests : []).map((item) => clean(item, 240)).filter(Boolean).slice(0, 10),
      find: String(proposal?.find || ""),
      replace: String(proposal?.replace || "")
    },
    investigation: {
      summary: clean(planning?.summary, 1000) || null,
      searchQueries: (Array.isArray(planning?.searchQueries) ? planning.searchQueries : []).map((item) => clean(item, 160)).filter(Boolean).slice(0, 5),
      reviewedFiles
    }
  };

  const body = [
    `<!-- ARI-HANDOFF:${handoffKey} -->`,
    "# Ari self-repair proposal",
    "",
    "Ari detected a failure, investigated repository evidence, and proposed the bounded change below.",
    "",
    "## ChatGPT review contract",
    "",
    "- Independently inspect the current repository before accepting Ari's diagnosis.",
    "- Explicitly state what Ari got right, what was incomplete, and what the actual root cause appears to be.",
    "- If a code change is justified, implement the smallest safe fix on a separate branch and open a pull request.",
    "- Run or request the relevant tests/CI and report the result.",
    "- Do not merge to production. The owner remains the merge authority.",
    "- Do not weaken authentication, authorization, security boundaries, credential handling, billing controls, or provider/platform safeguards.",
    "",
    "## Ari's diagnosis",
    "",
    `**Summary:** ${safeText(packet.proposal.summary || "No summary supplied.")}`,
    "",
    `**Evidence:** ${safeText(packet.proposal.evidence || "No evidence supplied.")}`,
    "",
    `**Expected benefit:** ${safeText(packet.proposal.expectedBenefit || "Not specified.")}`,
    "",
    `**Confidence:** ${packet.proposal.confidence}`,
    "",
    `**Target file:** ${packet.proposal.filePath || "Not specified"}`,
    "",
    "## Ari's proposed exact replacement",
    "",
    "### Find",
    "~~~~text",
    packet.proposal.find,
    "~~~~",
    "",
    "### Replace",
    "~~~~text",
    packet.proposal.replace,
    "~~~~",
    "",
    "## Machine-readable handoff",
    "",
    "~~~~json",
    JSON.stringify(packet, null, 2),
    "~~~~"
  ].join("\n").slice(0, 64000);

  return { handoffKey, title, body, packet };
}

export async function createRepairHandoffIssue({
  repo = "",
  token = "",
  goal = {},
  proposal = {},
  planning = {},
  files = [],
  now = new Date(),
  request = githubRequest
} = {}) {
  const repository = clean(repo, 300);
  const secret = String(token || "").trim();
  if (!repository || !secret) return { success: false, reason: "github_not_configured" };

  const issue = buildRepairHandoffIssue({ goal, proposal, planning, files, now });
  const marker = `ARI-HANDOFF:${issue.handoffKey}`;

  try {
    const query = encodeURIComponent(`repo:${repository} is:issue is:open "${marker}"`);
    const existing = await request(`https://api.github.com/search/issues?q=${query}&per_page=10`, secret);
    const match = (Array.isArray(existing?.items) ? existing.items : []).find((item) =>
      String(item?.body || "").includes(marker)
    );

    if (match?.number) {
      return {
        success: true,
        created: false,
        deduplicated: true,
        handoffKey: issue.handoffKey,
        issueNumber: Number(match.number),
        issueUrl: clean(match.html_url, 1000) || null
      };
    }

    const created = await request(`https://api.github.com/repos/${repository}/issues`, secret, {
      method: "POST",
      body: JSON.stringify({
        title: issue.title,
        body: issue.body
      })
    });

    if (!created?.number) return { success: false, reason: "github_issue_create_failed" };

    return {
      success: true,
      created: true,
      deduplicated: false,
      handoffKey: issue.handoffKey,
      issueNumber: Number(created.number),
      issueUrl: clean(created.html_url, 1000) || null
    };
  } catch (error) {
    return {
      success: false,
      reason: clean(error?.message, 220) || "github_handoff_failed"
    };
  }
}

async function githubRequest(url, token, options = {}) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
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
    const error = new Error(clean(data?.message, 220) || `GitHub request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function hash(value = "") {
  return createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function safeText(value = "") {
  return clean(value, MAX_BODY_TEXT).replace(/\r?\n/g, " ");
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}
