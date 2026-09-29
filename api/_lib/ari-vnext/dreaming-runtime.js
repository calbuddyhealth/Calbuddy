// ARI vNext — scheduled Dreaming & Consolidation runtime.

import { randomUUID } from "node:crypto";
import {
  executeBackgroundOpenAIRequest,
  extendBackgroundAiBudgetReservation,
  recordBackgroundOpenAIUsage,
  releaseBackgroundAiBudget,
  reserveBackgroundAiBudget,
  settleBackgroundAiBudget
} from "../background-ai-budget.js";
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
  startDreamRun,
  updateDreamRunMetadata
} from "./dreaming-store.js";

const RESPONSES_URL = process.env.ARI_RESPONSES_URL || process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";
const TIMEOUT_MS = Number(process.env.ARI_DREAMING_TIMEOUT_MS) > 0 ? Number(process.env.ARI_DREAMING_TIMEOUT_MS) : 45000;
const BATCH_MULTIPLIER = 0.5;
const BATCH_API_URL = "https://api.openai.com/v1/batches";
const FILES_API_URL = "https://api.openai.com/v1/files";

export async function runAriDreamingCycle({
  userId,
  now = new Date(),
  loadEvidence = loadDreamingEvidence,
  loadLatest = loadLatestDreamRun,
  startRun = startDreamRun,
  updateRun = updateDreamRunMetadata,
  finishRun = finishDreamRun,
  persistInsights = persistDreamInsights,
  synthesize = synthesizeDream,
  useBatch = dreamingBatchEnabled(),
  submitBatch = submitDreamBatch,
  pollBatch = pollDreamBatch
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

  if (isPendingDreamBatch(latest)) {
    return pollBatch({
      userId,
      latest,
      evidence,
      now,
      finishRun,
      persistInsights
    });
  }

  const latestFailedMs = Date.parse(String(latest?.completed_at || latest?.updated_at || latest?.created_at || ""));
  if (latest?.status === "failed" && Number.isFinite(latestFailedMs) && (clockMs(now) - latestFailedMs) < 12 * 3600000) {
    return {
      success: true,
      dreamed: false,
      reason: "dreaming_backoff_after_failure",
      retryAfter: new Date(latestFailedMs + 12 * 3600000).toISOString()
    };
  }
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
    if (useBatch && synthesize === synthesizeDream) {
      const batch = await submitBatch({
        userId,
        runId,
        evidence,
        model,
        now,
        updateRun
      });
      return {
        success: true,
        dreamed: false,
        batchSubmitted: true,
        reason: "dream_batch_submitted",
        version: ARI_DREAMING_VERSION,
        runId,
        model,
        batchId: batch.batchId,
        evidenceCount: refs.length,
        evidenceCounts: evidence.counts
      };
    }

    const raw = await synthesize({ evidence, model, userId });
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
    return completedDreamResult({ runId, model, refs, evidence, normalized, stored });
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

export async function synthesizeDream({ evidence, model = dreamModel(), userId = null, fetcher = fetch } = {}) {
  const apiKey = clean(process.env.ARI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY, 8000);
  if (!apiKey) throw new Error("dreaming_provider_key_missing");
  const body = buildDreamRequestBody({ evidence, model });

  const provider = await executeBackgroundOpenAIRequest({
    userId,
    endpoint: "/api/ari-dreaming-cycle",
    requestCategory: "ari_dreaming_consolidation",
    model,
    body,
    apiKey,
    url: RESPONSES_URL,
    fetcher,
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const data = provider.data || {};
  if (!provider.ok) throw new Error(`dreaming_provider_${provider.status}`);

  const parsed = parseJson(extractOutputText(data));
  if (!parsed) throw new Error("dreaming_invalid_provider_output");
  return parsed;
}

export async function submitDreamBatch({
  userId,
  runId,
  evidence,
  model = dreamModel(),
  now = new Date(),
  updateRun = updateDreamRunMetadata,
  fetcher = fetch,
  reserve = reserveBackgroundAiBudget,
  extendReservation = extendBackgroundAiBudgetReservation,
  releaseReservation = releaseBackgroundAiBudget
} = {}) {
  const apiKey = clean(process.env.ARI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY, 8000);
  if (!apiKey) throw new Error("dreaming_provider_key_missing");

  const body = buildDreamRequestBody({ evidence, model });
  const reservation = await reserve({
    userId,
    requestCategory: "ari_dreaming_batch",
    model,
    requestBody: body,
    maxOutputTokens: body.max_output_tokens,
    costMultiplier: BATCH_MULTIPLIER
  });

  let inputFileId = null;
  let batchId = null;
  try {
    const customId = `ari-dream-${clean(runId, 80)}`;
    const jsonl = JSON.stringify({
      custom_id: customId,
      method: "POST",
      url: "/v1/responses",
      body
    }) + "\n";

    const form = new FormData();
    form.append("purpose", "batch");
    form.append("file", new Blob([jsonl], { type: "application/jsonl" }), `${customId}.jsonl`);

    const uploadResponse = await fetcher(FILES_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(20000)
    });
    const upload = await uploadResponse.json().catch(() => ({}));
    if (!uploadResponse.ok || !upload?.id) {
      throw new Error(`dream_batch_file_upload_${uploadResponse.status}`);
    }
    inputFileId = upload.id;

    const batchResponse = await fetcher(BATCH_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input_file_id: inputFileId,
        endpoint: "/v1/responses",
        completion_window: "24h",
        metadata: {
          workload: "ari_dreaming",
          ari_run_id: clean(runId, 80)
        }
      }),
      signal: AbortSignal.timeout(20000)
    });
    const batch = await batchResponse.json().catch(() => ({}));
    if (!batchResponse.ok || !batch?.id) {
      throw new Error(`dream_batch_create_${batchResponse.status}`);
    }
    batchId = batch.id;

    const extended = await extendReservation({
      reservationId: reservation.reservationId,
      expiresAt: new Date(validDate(now).getTime() + 30 * 3600000)
    });
    if (!extended?.extended) throw new Error("dream_batch_budget_extension_failed");

    const metadata = {
      batchMode: true,
      batchId,
      inputFileId,
      reservationId: reservation.reservationId,
      customId,
      submittedAt: validDate(now).toISOString(),
      discountMultiplier: BATCH_MULTIPLIER,
      batchStatus: clean(batch?.status, 40) || "validating"
    };
    const stored = await updateRun({ userId, runId, metadata, now });
    if (!stored?.stored) throw new Error("dream_batch_metadata_store_failed");

    return { batchId, inputFileId, reservationId: reservation.reservationId, customId };
  } catch (error) {
    if (batchId) {
      await cancelBatch({ batchId, apiKey, fetcher }).catch(() => {});
    }
    if (inputFileId) {
      await deleteOpenAIFile({ fileId: inputFileId, apiKey, fetcher }).catch(() => {});
    }
    await releaseReservation({ reservationId: reservation.reservationId }).catch(() => {});
    throw error;
  }
}

export async function pollDreamBatch({
  userId,
  latest,
  evidence,
  now = new Date(),
  finishRun = finishDreamRun,
  persistInsights = persistDreamInsights,
  fetcher = fetch,
  recordUsage = recordBackgroundOpenAIUsage,
  settleReservation = settleBackgroundAiBudget,
  releaseReservation = releaseBackgroundAiBudget
} = {}) {
  const apiKey = clean(process.env.ARI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY, 8000);
  if (!apiKey) throw new Error("dreaming_provider_key_missing");

  const metadata = safeObject(latest?.metadata);
  const batchId = clean(metadata.batchId, 200);
  const reservationId = clean(metadata.reservationId, 100);
  const runId = clean(latest?.id, 100);
  const model = clean(latest?.model, 120) || dreamModel();
  if (!batchId || !runId) {
    return { success: false, dreamed: false, reason: "dream_batch_metadata_missing", runId };
  }

  let batch;
  try {
    const response = await fetcher(`${BATCH_API_URL}/${encodeURIComponent(batchId)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000)
    });
    batch = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, dreamed: false, reason: `dream_batch_status_${response.status}`, runId, batchId };
    }
  } catch (error) {
    return {
      success: false,
      dreamed: false,
      batchPending: true,
      reason: error?.name === "AbortError" ? "dream_batch_status_timeout" : "dream_batch_status_unavailable",
      runId,
      batchId
    };
  }

  const batchStatus = clean(batch?.status, 40);
  if (["validating", "in_progress", "finalizing", "cancelling"].includes(batchStatus)) {
    return {
      success: true,
      dreamed: false,
      batchPending: true,
      reason: "dream_batch_pending",
      runId,
      batchId,
      batchStatus
    };
  }

  if (["failed", "expired", "cancelled"].includes(batchStatus)) {
    if (reservationId) await releaseReservation({ reservationId }).catch(() => {});
    await cleanupBatchFiles({
      inputFileId: metadata.inputFileId,
      outputFileId: batch?.output_file_id,
      errorFileId: batch?.error_file_id,
      apiKey,
      fetcher
    });
    await finishRun({
      userId,
      runId,
      status: "failed",
      error: `dream_batch_${batchStatus}`,
      metadata: {
        ...metadata,
        batchStatus,
        errorFileId: batch?.error_file_id || null,
        batchFinishedAt: validDate(now).toISOString()
      },
      now
    });
    return {
      success: false,
      dreamed: false,
      reason: `dream_batch_${batchStatus}`,
      runId,
      batchId,
      batchStatus
    };
  }

  if (batchStatus !== "completed") {
    return {
      success: false,
      dreamed: false,
      batchPending: true,
      reason: "dream_batch_unknown_pending_state",
      runId,
      batchId,
      batchStatus
    };
  }

  if (!batch?.output_file_id) {
    if (reservationId) await releaseReservation({ reservationId }).catch(() => {});
    await cleanupBatchFiles({
      inputFileId: metadata.inputFileId,
      errorFileId: batch?.error_file_id,
      apiKey,
      fetcher
    });
    await finishRun({
      userId,
      runId,
      status: "failed",
      error: "dream_batch_completed_without_output",
      metadata: {
        ...metadata,
        batchStatus,
        errorFileId: batch?.error_file_id || null,
        batchFinishedAt: validDate(now).toISOString()
      },
      now
    });
    return {
      success: false,
      dreamed: false,
      reason: "dream_batch_completed_without_output",
      runId,
      batchId,
      batchStatus
    };
  }

  let outputText = "";
  try {
    const outputResponse = await fetcher(
      `${FILES_API_URL}/${encodeURIComponent(batch.output_file_id)}/content`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(20000)
      }
    );
    outputText = await outputResponse.text().catch(() => "");
    if (!outputResponse.ok) {
      return {
        success: false,
        dreamed: false,
        batchPending: true,
        reason: `dream_batch_output_${outputResponse.status}`,
        runId,
        batchId
      };
    }
  } catch (error) {
    return {
      success: false,
      dreamed: false,
      batchPending: true,
      reason: error?.name === "AbortError" ? "dream_batch_output_timeout" : "dream_batch_output_unavailable",
      runId,
      batchId
    };
  }

  const line = parseBatchOutputLine(outputText, metadata.customId);
  const providerBody = line?.response?.body || null;
  const providerStatus = Number(line?.response?.status_code || 0);
  if (!providerBody || providerStatus < 200 || providerStatus >= 300) {
    if (reservationId) await releaseReservation({ reservationId }).catch(() => {});
    await cleanupBatchFiles({
      inputFileId: metadata.inputFileId,
      outputFileId: batch.output_file_id,
      errorFileId: batch?.error_file_id,
      apiKey,
      fetcher
    });
    await finishRun({
      userId,
      runId,
      status: "failed",
      error: clean(line?.error?.message, 300) || "dream_batch_provider_failure",
      metadata: {
        ...metadata,
        batchStatus,
        outputFileId: batch.output_file_id,
        errorFileId: batch?.error_file_id || null,
        batchFinishedAt: validDate(now).toISOString()
      },
      now
    });
    return { success: false, dreamed: false, reason: "dream_batch_provider_failure", runId, batchId };
  }

  // Provider work has succeeded and may already be billable. Account for it
  // before validating Ari's downstream structured-output contract.
  await recordUsage({
    userId,
    endpoint: "/api/ari-dreaming-cycle",
    requestCategory: "ari_dreaming_batch",
    model: providerBody?.model || model,
    responseData: providerBody,
    providerRequestId: line?.response?.request_id || providerBody?.id || batchId,
    costMultiplier: BATCH_MULTIPLIER,
    metadata: {
      batch: true,
      batchId,
      inputFileId: metadata.inputFileId || null,
      outputFileId: batch.output_file_id
    }
  }).catch(() => {});

  if (reservationId) {
    await settleReservation({
      reservationId,
      model: providerBody?.model || model,
      responseData: providerBody,
      costMultiplier: BATCH_MULTIPLIER
    }).catch(() => {});
  }

  try {
    const parsed = parseJson(extractOutputText(providerBody));
    if (!parsed) throw new Error("dreaming_invalid_provider_output");

    const normalized = normalizeDreamOutput(parsed, evidence);
    const stored = await persistInsights({ userId, runId, insights: normalized.insights, now });
    if (!stored || !Number.isFinite(Number(stored.stored))) {
      throw new Error("dreaming_batch_insight_persistence_failed");
    }

    await finishRun({
      userId,
      runId,
      status: "completed",
      summary: normalized.summary,
      insightCount: stored?.stored || 0,
      metadata: {
        ...metadata,
        batchStatus,
        outputFileId: batch.output_file_id,
        batchFinishedAt: validDate(now).toISOString(),
        providerRequestId: line?.response?.request_id || providerBody?.id || null
      },
      now
    });

    await cleanupBatchFiles({
      inputFileId: metadata.inputFileId,
      outputFileId: batch.output_file_id,
      errorFileId: batch?.error_file_id,
      apiKey,
      fetcher
    });

    return completedDreamResult({
      runId,
      model: providerBody?.model || model,
      refs: collectEvidenceRefs(evidence),
      evidence,
      normalized,
      stored,
      extra: { batch: true, batchId, batchStatus }
    });
  } catch (error) {
    await finishRun({
      userId,
      runId,
      status: "failed",
      error: clean(error?.message, 360) || "dream_batch_ingest_failed",
      metadata: {
        ...metadata,
        batchStatus,
        outputFileId: batch.output_file_id,
        batchFinishedAt: validDate(now).toISOString(),
        providerRequestId: line?.response?.request_id || providerBody?.id || null,
        billedProviderWork: true
      },
      now
    }).catch(() => {});

    await cleanupBatchFiles({
      inputFileId: metadata.inputFileId,
      outputFileId: batch.output_file_id,
      errorFileId: batch?.error_file_id,
      apiKey,
      fetcher
    });

    return {
      success: false,
      dreamed: false,
      reason: "dream_batch_ingest_failed",
      runId,
      batchId,
      batchStatus
    };
  }
}

export function buildDreamRequestBody({ evidence, model = dreamModel() } = {}) {
  const body = {
    model,
    store: false,
    max_output_tokens: 2400,
    reasoning: supportsReasoning(model) ? { effort: dreamEffort() } : undefined,
    instructions: dreamInstructions(),
    input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify(buildDreamModelPayload(evidence)) }] }],
    text: { format: { type: "json_schema", name: "ari_dream_consolidation", strict: true, schema: dreamSchema() } },
    prompt_cache_key: "ari-dream-consolidation-v1"
  };
  if (!body.reasoning) delete body.reasoning;
  return body;
}

function completedDreamResult({ runId, model, refs, evidence, normalized, stored, extra = {} }) {
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
    summary: normalized.summary,
    ...extra
  };
}

function isPendingDreamBatch(run = null) {
  return run?.status === "started" && Boolean(run?.metadata?.batchMode && run?.metadata?.batchId);
}

function parseBatchOutputLine(text = "", customId = "") {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let fallback = null;
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (!fallback) fallback = parsed;
      if (customId && parsed?.custom_id === customId) return parsed;
    } catch {}
  }
  return fallback;
}

async function cancelBatch({ batchId, apiKey, fetcher = fetch } = {}) {
  if (!batchId) return false;
  const response = await fetcher(`${BATCH_API_URL}/${encodeURIComponent(batchId)}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10000)
  });
  return response.ok;
}

async function cleanupBatchFiles({
  inputFileId = null,
  outputFileId = null,
  errorFileId = null,
  apiKey,
  fetcher = fetch
} = {}) {
  const ids = [...new Set([inputFileId, outputFileId, errorFileId].map((id) => clean(id, 200)).filter(Boolean))];
  await Promise.all(ids.map((fileId) =>
    deleteOpenAIFile({ fileId, apiKey, fetcher }).catch(() => false)
  ));
}

async function deleteOpenAIFile({ fileId, apiKey, fetcher = fetch } = {}) {
  if (!fileId) return false;
  const response = await fetcher(`${FILES_API_URL}/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10000)
  });
  return response.ok;
}

export function dreamingBatchEnabled() {
  return String(process.env.ARI_DREAMING_BATCH_ENABLED ?? "true").trim().toLowerCase() !== "false";
}

function safeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}

export function dreamInstructions() {
  return [
    "You are Ari's Dreaming & Consolidation Engine. Your task is to turn accumulated evidence into compact provisional insights that can improve future behavior.",
    "Dreaming covers experiments AND ordinary conversations, relationship interactions, Agent Community interactions, corrections, commitments, goals, beliefs, strategies, failures, successes, unresolved contradictions, capability growth, expansive curiosity, Ari's imagination garden, and outcome-grounded functional emotion dynamics.",
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
    "Expansive curiosity is allowed even when no defect, uncertainty, or active goal demands it. Use the supplied curiosity frontier to look beyond familiar categories for surprising analogies, unfamiliar perspectives, latent capabilities, or questions Ari would not otherwise know to ask.",
    "A curiosity insight does not need immediate practical utility, but it must have plausible novelty or information potential. Prefer one bounded probe over broad random wandering. Treat unfamiliar territory as a hypothesis-generating source, not as evidence by itself.",
    "When the supplied frontier shows repeated attention to the same territory, rotate outward rather than repeatedly rediscovering the same connection. Preserve useful discoveries as compact future-facing curiosity, capability, belief, or strategy insights.",
    "The imagination garden contains sandboxed imagined/unverified seeds, not events or evidence. You may recombine a garden seed with new real evidence, a curiosity frontier, or another abstract seed to generate a testable possibility, but imagination alone cannot satisfy an evidence requirement.",
    "Emotion dynamics are functional control-state evidence, not proof of subjective feeling. Use emotion history only to detect outcome-linked patterns such as concern improving verification, frustration prompting a useful strategy switch, satisfaction supporting consolidation, or interest supporting informative exploration.",
    "Felt-State history is Ari's compact introspectively accessible representation of those emotion dynamics across time. Use it to detect stable trigger→state→cognitive-effect→outcome patterns, reappraisal, and recovery. It remains functional evidence and does not establish phenomenal qualia.",
    "Affective Preference history records which functional states Ari would choose to maintain, reduce, cultivate, or transform toward, plus outcome-grounded learning about those states. Look for context-specific patterns: a negatively valenced state can be instrumentally useful, and a positive state can be counterproductive when it harms calibration. Do not collapse this into happiness maximization.",
    "Do not infer that an emotion, felt state, or affective preference was useful merely because its label appeared. Require observable downstream differences or repeated outcome patterns. A functional emotion, feeling representation, or preference may become a strategy-level lesson only when its causal role is supported by evidence.",
    "Preserve mixed emotion when it matters: curiosity/interest can coexist with concern; frustration can coexist with determination. Do not collapse a mixed state into a simplistic narrative.",
    "A compelling imagined scenario must remain explicitly hypothetical until external evidence or a verified experiment supports it. Do not convert imagined content into autobiographical memory, factual belief, or a claim that an action happened.",
    "If a dormant imagination seed becomes relevant to current evidence, you may propose it as a curiosity, capability, strategy, or hypothesis-like insight for later testing. Prefer compact transferable structure over preserving a fictional narrative.",
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
    || clean(process.env.OPENAI_ARI_BACKGROUND_REASONING_MODEL, 120)
    || "gpt-5.6-terra";
}
function dreamEffort() {
  const value = clean(process.env.OPENAI_ARI_DREAM_EFFORT, 30).toLowerCase();
  return ["low", "medium", "high", "xhigh"].includes(value) ? value : "medium";
}
function clockMs(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.getTime() : Date.now();
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
