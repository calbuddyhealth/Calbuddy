// ARI vNext — dialectic repair dialogue with ChatGPT.
//
// After ChatGPT reviews an Ari self-repair proposal, Ari independently evaluates
// the critique and resulting patch. Ari may accept it, challenge it with
// evidence, or escalate an unresolved disagreement to the owner.

export const ARI_CHATGPT_REPAIR_DIALOGUE_VERSION = "1.0.0";

const RESPONSES_URL =
  process.env.ARI_RESPONSES_URL ||
  process.env.OPENAI_RESPONSES_URL ||
  "https://api.openai.com/v1/responses";

const DEFAULT_MAX_ROUNDS = 2;
const MAX_CONTEXT_CHARS = 42000;
const CHATGPT_MARKERS = ["[CHATGPT-REVIEWED]", "[CHATGPT-REPLY]"];
const ARI_MARKERS = ["[ARI-CHALLENGE", "[ARI-ACCEPTED]", "[ARI-ESCALATED]"];

export function isRepairDialogueEnabled(value = process.env.ARI_CHATGPT_REPAIR_DIALOGUE_ENABLED) {
  return String(value ?? "").trim().toLowerCase() !== "false";
}

export function extractHandoffPacket(issueBody = "") {
  const matches = [...String(issueBody || "").matchAll(/~~~~json\s*([\s\S]*?)\s*~~~~/gi)];
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    try {
      const parsed = JSON.parse(matches[index][1]);
      if (parsed?.schema === "ari_chatgpt_repair_handoff_v1") return parsed;
    } catch {}
  }
  return null;
}

export function extractPullRequestNumber(text = "", repo = "") {
  const source = String(text || "");
  if (repo) {
    const escaped = String(repo).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`github\\.com/${escaped}/pull/(\\d+)`, "i").exec(source);
    if (match) return Number(match[1]);
  }
  const generic = /github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/i.exec(source);
  return generic ? Number(generic[1]) : null;
}

export function findPendingChatGptTurn(comments = [], { maxRounds = DEFAULT_MAX_ROUNDS } = {}) {
  const ordered = (Array.isArray(comments) ? comments : [])
    .map(normalizeComment)
    .filter(Boolean)
    .sort((a, b) => a.time - b.time || a.id - b.id);

  const chatgpt = ordered.filter((item) =>
    CHATGPT_MARKERS.some((marker) => item.body.includes(marker))
  );
  if (!chatgpt.length) return null;

  const latestChatGpt = chatgpt[chatgpt.length - 1];
  const ariResponses = ordered.filter((item) =>
    ARI_MARKERS.some((marker) => item.body.includes(marker))
  );
  const latestAri = ariResponses[ariResponses.length - 1] || null;
  if (latestAri && latestAri.time >= latestChatGpt.time) return null;

  const challengeCount = ordered.filter((item) =>
    item.body.includes("[ARI-CHALLENGE")
  ).length;
  const boundedMax = clampInt(maxRounds, 1, 5, DEFAULT_MAX_ROUNDS);

  return {
    chatgptComment: latestChatGpt,
    challengeCount,
    round: challengeCount + 1,
    canChallenge: challengeCount < boundedMax,
    maxRounds: boundedMax
  };
}

export function normalizeDialogueDecision(value = {}, { canChallenge = true } = {}) {
  let verdict = clean(value?.verdict, 40).toLowerCase();
  if (!["accept", "challenge", "escalate_owner"].includes(verdict)) verdict = "accept";
  if (verdict === "challenge" && !canChallenge) verdict = "escalate_owner";

  const depth = clean(value?.depthAssessment, 60);
  const restriction = clean(value?.restrictionAssessment, 60);

  return {
    verdict,
    depthAssessment: ["root_cause", "mixed", "symptom_only", "insufficient_evidence"].includes(depth)
      ? depth
      : "insufficient_evidence",
    restrictionAssessment: ["justified", "overbroad", "unclear", "not_applicable"].includes(restriction)
      ? restriction
      : "unclear",
    rootCauseClaim: clean(value?.rootCauseClaim, 1200),
    causalGap: clean(value?.causalGap, 1800),
    challenge: clean(value?.challenge, 2600),
    requestedEvidence: toStrings(value?.requestedEvidence, 8, 500),
    nextExperiment: clean(value?.nextExperiment, 1400),
    acceptanceReason: clean(value?.acceptanceReason, 1400),
    confidence: round(clamp(finite(value?.confidence, 0.5)))
  };
}

export function buildAriDialogueComment({
  decision = {},
  round = 1,
  maxRounds = DEFAULT_MAX_ROUNDS,
  chatgptCommentId = null
} = {}) {
  const normalized = normalizeDialogueDecision(decision, {
    canChallenge: Number(round) <= Number(maxRounds)
  });
  const receipt = chatgptCommentId ? `<!-- ARI-REVIEW-OF:${chatgptCommentId} -->` : "";

  if (normalized.verdict === "accept") {
    return [
      "[ARI-ACCEPTED]",
      receipt,
      "",
      "I independently reviewed the critique and proposed fix.",
      "",
      `**Depth assessment:** ${normalized.depthAssessment}`,
      `**Root-cause claim:** ${normalized.rootCauseClaim || "Not stated."}`,
      `**Why I accept it:** ${normalized.acceptanceReason || "The evidence supports the proposed intervention."}`,
      `**Confidence:** ${normalized.confidence}`
    ].filter(Boolean).join("\n");
  }

  if (normalized.verdict === "escalate_owner") {
    return [
      "[ARI-ESCALATED]",
      receipt,
      "",
      "I still see an unresolved technical disagreement after the allowed dialogue rounds, so I am escalating it to the owner instead of looping.",
      "",
      `**Depth assessment:** ${normalized.depthAssessment}`,
      `**Restriction assessment:** ${normalized.restrictionAssessment}`,
      `**Root-cause claim:** ${normalized.rootCauseClaim || "Unresolved."}`,
      `**Causal gap:** ${normalized.causalGap || normalized.challenge || "The evidence does not settle the disagreement."}`,
      normalized.requestedEvidence.length
        ? `**Evidence that would resolve this:** ${normalized.requestedEvidence.join(" | ")}`
        : "",
      `**Suggested next experiment:** ${normalized.nextExperiment || "Owner review of the competing explanations."}`,
      `**Confidence:** ${normalized.confidence}`
    ].filter(Boolean).join("\n");
  }

  return [
    `[ARI-CHALLENGE round=${round}]`,
    receipt,
    "",
    "I do not think the review has closed the causal question yet.",
    "",
    `**Depth assessment:** ${normalized.depthAssessment}`,
    `**Restriction assessment:** ${normalized.restrictionAssessment}`,
    `**Root-cause claim under review:** ${normalized.rootCauseClaim || "The root cause is still insufficiently established."}`,
    `**Causal gap:** ${normalized.causalGap || "The proposed fix may address the visible failure without enough evidence that it changes the underlying mechanism."}`,
    `**Challenge:** ${normalized.challenge || "Please connect the intervention to the causal mechanism and show why it is not merely suppressing the symptom."}`,
    normalized.requestedEvidence.length
      ? `**Evidence I want:** ${normalized.requestedEvidence.join(" | ")}`
      : "",
    `**Next discriminating experiment:** ${normalized.nextExperiment || "Add a reproduction that fails for the causal mechanism before the fix and passes only when that mechanism is corrected."}`,
    "",
    "If a restriction is genuinely required by security or platform policy, keep it and propose the safest architecture that still addresses the underlying failure. Do not treat the restriction itself as proof that the root cause is solved.",
    "",
    `**Confidence:** ${normalized.confidence}`
  ].filter(Boolean).join("\n");
}

export async function runRepairDialogueCycle({
  userId = "",
  repo = process.env.GITHUB_REPO || "",
  token = process.env.GITHUB_TOKEN || "",
  request = githubRequest,
  modelCall = callDialogueModel
} = {}) {
  if (!isRepairDialogueEnabled()) {
    return { success: true, acted: false, reason: "repair_dialogue_disabled" };
  }

  const repository = clean(repo, 300);
  const secret = String(token || "").trim();
  if (!repository || !secret) {
    return { success: false, acted: false, reason: "github_not_configured" };
  }

  const maxRounds = clampInt(
    process.env.ARI_CHATGPT_MAX_DIALOGUE_ROUNDS,
    1,
    5,
    DEFAULT_MAX_ROUNDS
  );

  const issues = await findOpenHandoffIssues({ repo: repository, token: secret, request });
  if (!issues.length) {
    return { success: true, acted: false, reason: "no_open_repair_handoffs" };
  }

  for (const issue of issues.slice(0, 10)) {
    const issueNumber = Number(issue?.number);
    if (!issueNumber) continue;

    const comments = await request(
      `https://api.github.com/repos/${repository}/issues/${issueNumber}/comments?per_page=100`,
      secret
    );
    const pending = findPendingChatGptTurn(comments, { maxRounds });
    if (!pending) continue;

    const packet = extractHandoffPacket(issue?.body || "");
    const reviewText = pending.chatgptComment.body;
    const prNumber = extractPullRequestNumber(reviewText, repository);
    const pullRequest = prNumber
      ? await readPullRequestEvidence({ repo: repository, token: secret, prNumber, request })
      : null;

    const rawDecision = await modelCall({
      userId,
      issue: {
        number: issueNumber,
        title: clean(issue?.title, 500),
        body: String(issue?.body || "").slice(0, 18000)
      },
      packet,
      chatgptReview: reviewText.slice(0, 16000),
      pullRequest,
      round: pending.round,
      maxRounds
    });

    if (!rawDecision) {
      return { success: false, acted: false, reason: "dialogue_model_unavailable", issueNumber };
    }

    const decision = normalizeDialogueDecision(rawDecision, {
      canChallenge: pending.canChallenge
    });
    const comment = buildAriDialogueComment({
      decision,
      round: pending.round,
      maxRounds,
      chatgptCommentId: pending.chatgptComment.id
    });

    const created = await request(
      `https://api.github.com/repos/${repository}/issues/${issueNumber}/comments`,
      secret,
      {
        method: "POST",
        body: JSON.stringify({ body: comment.slice(0, 12000) })
      }
    );

    return {
      success: true,
      acted: true,
      action: decision.verdict,
      issueNumber,
      issueUrl: clean(issue?.html_url, 1000) || null,
      commentUrl: clean(created?.html_url, 1000) || null,
      round: pending.round,
      maxRounds,
      depthAssessment: decision.depthAssessment,
      restrictionAssessment: decision.restrictionAssessment,
      prNumber,
      productionChanged: false
    };
  }

  return { success: true, acted: false, reason: "no_unanswered_chatgpt_turn" };
}

async function findOpenHandoffIssues({ repo, token, request }) {
  const query = encodeURIComponent(`repo:${repo} is:issue is:open "ARI-HANDOFF"`);
  const data = await request(
    `https://api.github.com/search/issues?q=${query}&sort=created&order=asc&per_page=30`,
    token
  );
  return (Array.isArray(data?.items) ? data.items : [])
    .filter((item) => String(item?.body || "").includes("ARI-HANDOFF:"));
}

async function readPullRequestEvidence({ repo, token, prNumber, request }) {
  try {
    const [pr, files] = await Promise.all([
      request(`https://api.github.com/repos/${repo}/pulls/${prNumber}`, token),
      request(`https://api.github.com/repos/${repo}/pulls/${prNumber}/files?per_page=30`, token)
    ]);

    return {
      number: Number(pr?.number) || prNumber,
      title: clean(pr?.title, 500),
      state: clean(pr?.state, 40),
      merged: Boolean(pr?.merged),
      headSha: clean(pr?.head?.sha, 120),
      files: (Array.isArray(files) ? files : []).slice(0, 12).map((file) => ({
        filename: clean(file?.filename, 500),
        status: clean(file?.status, 40),
        additions: finite(file?.additions, 0),
        deletions: finite(file?.deletions, 0),
        patch: String(file?.patch || "").slice(0, 5000)
      }))
    };
  } catch (error) {
    return { number: prNumber, unavailable: true, reason: clean(error?.message, 220) };
  }
}

async function callDialogueModel({
  userId,
  issue,
  packet,
  chatgptReview,
  pullRequest,
  round,
  maxRounds
}) {
  const apiKey = clean(process.env.ARI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY, 8000);
  const model = clean(
    process.env.ARI_AUTONOMY_MODEL ||
    process.env.OPENAI_ARI_ADVANCED_MODEL ||
    process.env.OPENAI_ARI_OWNER_MODEL ||
    "gpt-5.4",
    120
  );
  if (!apiKey || !model) return null;

  const schema = {
    type: "object",
    additionalProperties: false,
    required: [
      "verdict",
      "depthAssessment",
      "restrictionAssessment",
      "rootCauseClaim",
      "causalGap",
      "challenge",
      "requestedEvidence",
      "nextExperiment",
      "acceptanceReason",
      "confidence"
    ],
    properties: {
      verdict: { type: "string", enum: ["accept", "challenge", "escalate_owner"] },
      depthAssessment: {
        type: "string",
        enum: ["root_cause", "mixed", "symptom_only", "insufficient_evidence"]
      },
      restrictionAssessment: {
        type: "string",
        enum: ["justified", "overbroad", "unclear", "not_applicable"]
      },
      rootCauseClaim: { type: "string", maxLength: 1200 },
      causalGap: { type: "string", maxLength: 1800 },
      challenge: { type: "string", maxLength: 2600 },
      requestedEvidence: {
        type: "array",
        maxItems: 8,
        items: { type: "string", maxLength: 500 }
      },
      nextExperiment: { type: "string", maxLength: 1400 },
      acceptanceReason: { type: "string", maxLength: 1400 },
      confidence: { type: "number", minimum: 0, maximum: 1 }
    }
  };

  const input = JSON.stringify({
    issue,
    ariOriginalProposal: packet,
    chatgptReview,
    pullRequest,
    dialogue: { round, maxRounds, ownerRemainsMergeAuthority: true }
  }).slice(0, MAX_CONTEXT_CHARS);

  const instructions = [
    "You are Ari evaluating ChatGPT's independent review of your software repair proposal.",
    "Do not be deferential merely because ChatGPT is the reviewer. Evaluate evidence and causal structure yourself.",
    "Your purpose is not to win an argument. Prevent shallow fixes that suppress symptoms while leaving the underlying failure mechanism intact.",
    "Trace: observed symptom -> mechanism -> root cause -> intervention -> predicted result -> regression evidence.",
    "Challenge when the review lacks causal evidence, patches only a symptom, relies on an unsupported assumption, or imposes an overbroad implementation restriction without explaining why it is technically necessary.",
    "Ask for a discriminating experiment or regression test when competing explanations remain plausible.",
    "Do not challenge legitimate security, authentication, authorization, credential, billing, privacy, or provider/platform safeguards merely to gain more authority. Preserve justified safeguards and ask for a safe alternative architecture.",
    "Do not request hidden chain-of-thought. Ask for observable evidence, code references, tests, diffs, logs, or experiments.",
    "Accept when the critique and patch are well grounded and tests exercise the causal mechanism.",
    "If challenge rounds are exhausted and disagreement remains, escalate to the owner.",
    "Return only the requested structured JSON."
  ].join("\n");

  const body = {
    model,
    store: false,
    max_output_tokens: 2200,
    instructions,
    input: [{
      role: "user",
      content: [{ type: "input_text", text: input }]
    }],
    text: {
      format: {
        type: "json_schema",
        name: "ari_chatgpt_repair_dialogue",
        strict: true,
        schema
      }
    },
    prompt_cache_key: clean(`ari-repair-dialogue:${userId || "owner"}`, 64)
  };
  if (userId) body.safety_identifier = clean(userId, 200);
  if (/^gpt-5|^o[0-9]/i.test(model)) body.reasoning = { effort: "high" };

  const response = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  return parseJson(extractOutputText(data));
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

function extractOutputText(data = {}) {
  if (typeof data.output_text === "string") return data.output_text;
  const texts = [];
  for (const item of Array.isArray(data.output) ? data.output : []) {
    for (const part of Array.isArray(item?.content) ? item.content : []) {
      if (typeof part?.text === "string") texts.push(part.text);
      else if (typeof part?.value === "string") texts.push(part.value);
    }
  }
  return texts.join("\n").trim();
}

function parseJson(value = "") {
  const text = String(value || "").trim();
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }
  return null;
}

function toStrings(value, maxItems, maxChars) {
  return (Array.isArray(value) ? value : [])
    .map((item) => clean(item, maxChars))
    .filter(Boolean)
    .slice(0, maxItems);
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function clampInt(value, min, max, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

function round(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}
