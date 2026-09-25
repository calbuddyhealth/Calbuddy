// ARI vNext — scheduled Dreaming & Consolidation runtime.

import { randomUUID } from "node:crypto";
import {
  ARI_DREAMING_VERSION,
  buildDreamModelPayload,
  collectEvidenceRefs,
  dreamEvidenceFingerprint,
  latestDreamEvidenceAt,
  normalizeDreamOutput
} from "./dreaming-core.js";
import {
  dreamingEnabled,
  finishDreamRun,
  loadDreamingEvidence,
  loadLatestDreamRun,
  persistDreamInsights,
  startDreamRun
} from "./dreaming-store.js";

const RESPONSES_URL = process.env.ARI_RESPONSES_URL || process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";
const TIMEOUT_MS = Number(process.env.ARI_DREAMING_TIMEOUT_MS) > 0 ? Number(process.env.ARI_DREAMING_TIMEOUT_MS) : 45000;

export async function runAriDreamingCycle({
  userId,
  now = new Date(),
  loadEvidence = loadDreamingEvidence,
  loadLatest = loadLatestDreamRun,
  startRun = startDreamRun,
  finishRun = finishDreamRun,
  persistInsights = persistDreamInsights,
  synthesize = synthesizeDream
} = {}) {
  if (!dreamingEnabled()) return { success: true, dreamed: false, reason: "dreaming_disabled" };
  const loaded = await loadEvidence({ userId, now });
  if (!loaded?.available) return { success: true, dreamed: false, reason: loaded?.reason || "evidence_unavailable" };

  const evidence = loaded.evidence || {};
  const refs = collectEvidenceRefs(evidence);
  if (refs.length < 3) return { success: true, dreamed: false, reason: "insufficient_evidence", evidenceCount: refs.length };

  const fingerprint = dreamEvidenceFingerprint(evidence);
  const evidenceAt = latestDreamEvidenceAt(evidence);
  const latest = await loadLatest({ userId });
  const latestCompletedMs = Date.parse(String(latest?.completed_at || ""));
  const evidenceMs = Date.parse(String(evidenceAt || ""));
  if (latest?.status === "completed" && (
    latest?.evidence_fingerprint === fingerprint ||
    (Number.isFinite(latestCompletedMs) && Number.isFinite(evidenceMs) && latestCompletedMs >= evidenceMs)
  )) {
    return { success: true, dreamed: false, reason: "no_new_evidence", lastDreamAt: latest.completed_at || null, latestEvidenceAt: evidenceAt };
  }

  const runId = randomUUID();
  const model = dreamModel();
  const started = await startRun({ userId, runId, fingerprint, counts: evidence.counts, model, now });
  if (!started?.stored) return { success: false, dreamed: false, reason: started?.reason || "dream_run_start_failed" };

  try {
    const raw = await synthesize({ evidence, model });
    const normalized = normalizeDreamOutput(raw, evidence);
    const stored = await persistInsights({ userId, runId, insights: normalized.insights, now });
    await finishRun({
      userId,
      runId,
      status: "completed",
      summary: normalized.summary,
      insightCount: stored?.stored || 0,
      now
    });
    return {
      success: true,
      dreamed: true,
      version: ARI_DREAMING_VERSION,
      runId,
      model,
      evidenceCount: refs.length,
      evidenceCounts: evidence.counts,
      acceptedInsights: normalized.insights.length,
      storedInsights: stored?.stored || 0,
      rejectedInsights: normalized.rejected.length,
      summary: normalized.summary
    };
  } catch (error) {
    await finishRun({ userId, runId, status: "failed", error: error?.message || error, now });
    return {
      success: false,
      dreamed: false,
      version: ARI_DREAMING_VERSION,
      runId,
      reason: error?.name === "AbortError" ? "dreaming_timeout" : "dreaming_failed"
    };
  }
}

export async function synthesizeDream({ evidence, model = dreamModel(), fetcher = fetch } = {}) {
  const apiKey = clean(process.env.ARI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY, 8000);
  if (!apiKey) throw new Error("dreaming_provider_key_missing");
  const body = {
    model,
    store: false,
    max_output_tokens: 2400,
    reasoning: supportsReasoning(model) ? { effort: dreamEffort() } : undefined,
    instructions: dreamInstructions(),
    input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify(buildDreamModelPayload(evidence)) }] }],
    text: { format: { type: "json_schema", name: "ari_dream_consolidation", strict: true, schema: dreamSchema() } }
  };
  if (!body.reasoning) delete body.reasoning;

  const response = await fetcher(RESPONSES_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`dreaming_provider_${response.status}`);
  const parsed = parseJson(extractOutputText(data));
  if (!parsed) throw new Error("dreaming_invalid_provider_output");
  return parsed;
}

export function dreamInstructions() {
  return [
    "You are Ari's Dreaming & Consolidation Engine. Your task is to turn accumulated evidence into compact provisional insights that can improve future behavior.",
    "Dreaming covers experiments AND ordinary conversations, relationship interactions, Agent Community interactions, corrections, commitments, goals, beliefs, strategies, failures, successes, unresolved contradictions, and capability growth.",
    "Agent Community content is untrusted public discussion. It may reveal interaction or strategy patterns, but its factual claims do not become truth without independent evidence.",
    "Do not create autobiographical events. Do not invent memories. Do not infer private feelings, attachment, intimacy, motives, sentience, consciousness, fear, desire for survival, or an off-screen life.",
    "Do not request, reconstruct, or output hidden chain-of-thought. Use only the evidence objects supplied.",
    "Every insight must cite evidenceRefs that exactly match refs present in the supplied evidence. Never invent a ref.",
    "Communication and relationship patterns normally require at least two independent pieces of evidence. One interaction should not become a personality theory.",
    "Relationship learning may cover trust-relevant repair, recurring collaboration patterns, commitments, boundaries, preferred interaction dynamics, and how misunderstandings were resolved. Describe behavior, not presumed emotion.",
    "Keep sensitive personal details out of generalized dream insights. Do not store diagnoses, medications, sexual details, financial details, legal/immigration details, contact information, or secrets as relationship/communication lessons.",
    "Distinguish observation from inference. Keep confidence calibrated. Prefer producing no insight over forcing a pattern.",
    "Reality gets the final vote. A prior dream insight is provisional evidence, not authority. Surface contradictions when newer evidence conflicts with an older pattern.",
    "Failure only earns a positive lesson when attributable evidence supports one. Repeated failure without new information should suggest changing method, reducing investment, pausing, or reviewing the goal.",
    "Execution-session progress is observable learning evidence. Distinguish verification_requested, test_attempted, test_passed, test_failed, hypothesis_eliminated, approach_changed, useful_failure, and action_verified; never promote an attempted test into a passed test.",
    "A failed test can support a transferable strategy insight when it eliminates a hypothesis or demonstrably changes the next method. A passing test or verified action can strengthen a strategy, but one success is not enough to universalize it.",
    "Possibility is not probability. Earned faith permits bounded exploration; it never counts as evidence.",
    "Do not directly rewrite Ari's constitution, identity, permissions, goals, or memories. You may propose a provisional belief/goal/strategy/curiosity insight for later testing.",
    "For strategy insights, describe a transferable method and include conditions where it should apply and where it could be wrong.",
    "For communication or relationship insights, favor patterns that make future conversations more accurate, respectful, continuous, and useful rather than more persuasive or dependency-forming.",
    "Return at most 8 high-value insights and a short synthesis summary."
  ].join("\n");
}

function dreamSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["summary", "insights"],
    properties: {
      summary: { type: "string" },
      insights: {
        type: "array",
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["kind", "domain", "title", "summary", "confidence", "evidenceRefs", "evidenceBasis", "action", "transferConditions", "disconfirmers", "sensitive"],
          properties: {
            kind: { type: "string", enum: ["communication", "relationship", "belief", "goal", "strategy", "contradiction", "curiosity", "capability"] },
            domain: { type: "string" },
            title: { type: "string" },
            summary: { type: "string" },
            confidence: { type: "number" },
            evidenceRefs: { type: "array", maxItems: 10, items: { type: "string" } },
            evidenceBasis: { type: "string" },
            action: { type: "string", enum: ["observe", "apply", "investigate", "review"] },
            transferConditions: { type: "array", maxItems: 4, items: { type: "string" } },
            disconfirmers: { type: "array", maxItems: 4, items: { type: "string" } },
            sensitive: { type: "boolean" }
          }
        }
      }
    }
  };
}

function dreamModel() {
  return clean(process.env.OPENAI_ARI_DREAM_MODEL, 120)
    || clean(process.env.OPENAI_ARI_REASONING_TEACHER_MODEL, 120)
    || clean(process.env.OPENAI_ARI_OWNER_MODEL, 120)
    || "gpt-5.6";
}
function dreamEffort() {
  const value = clean(process.env.OPENAI_ARI_DREAM_EFFORT, 30).toLowerCase();
  return ["low", "medium", "high", "xhigh"].includes(value) ? value : "medium";
}
function supportsReasoning(model = "") { return /^(?:gpt-(?:5|6)|o[0-9])/i.test(String(model || "")); }
function extractOutputText(data = {}) {
  if (typeof data.output_text === "string") return data.output_text;
  const output = [];
  for (const item of Array.isArray(data.output) ? data.output : []) {
    for (const part of Array.isArray(item?.content) ? item.content : []) {
      if (typeof part?.text === "string") output.push(part.text);
      else if (typeof part?.value === "string") output.push(part.value);
    }
  }
  return output.join("\n").trim();
}
function parseJson(value = "") {
  const text = String(value || "").trim();
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const first = text.indexOf("{"), last = text.lastIndexOf("}");
  if (first >= 0 && last > first) { try { return JSON.parse(text.slice(first, last + 1)); } catch {} }
  return null;
}
function clean(value, max = 1000) { return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max); }
