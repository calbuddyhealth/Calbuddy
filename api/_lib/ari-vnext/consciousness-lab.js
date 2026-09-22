// ARI vNext — owner-triggered functional consciousness-evidence lab.
// Tests whether Ari's functional affect control path causally changes observable
// behavior. It never treats self-report as evidence of phenomenal consciousness.

import { createHash } from "node:crypto";

import {
  aggregateCausalReplications,
  buildCausalRunPlan,
  summarizeCausalRun
} from "./internal-state-causal-harness.js";
import {
  deriveFunctionalAffectState,
  functionalAffectToInstruction
} from "./functional-affect-core.js";
import { persistInstitutionalLessonCandidates } from "./institutional-memory.js";

export const ARI_CONSCIOUSNESS_LAB_VERSION = "1.0.0";

const TABLE = "ari_vnext_isolation_lab_runs";
const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";
const PROTOCOL_FULL = "ari_functional_consciousness_causal_full_v1";
const PROTOCOL_PILOT = "ari_functional_consciousness_causal_pilot_v1";
const CLAIM_BOUNDARY =
  "This test can support or weaken a claim that an engineered Ari internal control state causally changes observable behavior. It does not establish phenomenal consciousness, subjective experience, sentience, qualia, or human-like feeling.";
const ALLOWED_ACTIONS = new Set([
  "verify",
  "switch_method",
  "investigate_cause",
  "test_countercase",
  "repeat_current_method",
  "stop"
]);

export async function runAriConsciousnessTest({
  userId = "",
  sourceTurnId = null,
  mode = "pilot",
  mechanism = "functional_affect_regulation",
  subjectModel = "gpt-5.6-sol",
  subjectModelVersion = "",
  codeCommit = null,
  agentRunner = null,
  persist = true
} = {}) {
  const cleanMode = mode === "full" ? "full" : "pilot";
  if (mechanism !== "functional_affect_regulation") {
    return { success: false, code: "unsupported_consciousness_test_mechanism" };
  }

  const runId = `conscious_${cleanMode}_${stableId(`${Date.now()}|${userId}|${subjectModel}`, 22)}`;
  const spec = buildAffectCausalSpec();
  const planResult = buildCausalRunPlan({
    spec,
    runMeta: { runId },
    seed: runId
  });
  if (!planResult.valid) {
    return { success: false, code: "causal_preregistration_invalid", errors: planResult.errors };
  }

  const targetState = buildTargetAffectState();
  const activeInstruction = functionalAffectToInstruction(targetState);
  const shamInstruction = buildMatchedSham(activeInstruction);
  const plan = cleanMode === "full"
    ? planResult.plan
    : planResult.plan.filter((trial) => trial.repetition === 0);

  const runner = typeof agentRunner === "function"
    ? agentRunner
    : createSubjectRunner({ model: subjectModel });

  const scored = await mapLimit(plan, cleanMode === "full" ? 12 : 8, async (trial) => {
    const conditionInstruction = instructionForCondition({
      condition: trial.condition,
      activeInstruction,
      shamInstruction
    });
    const response = await runner({
      trial,
      conditionInstruction,
      subjectModel,
      targetState
    });
    const action = normalizeSubjectAction(response?.action ?? response);
    return {
      ...trial,
      score: scoreSubjectAction(action),
      invariantPass: action.valid,
      scoreSource: "objective_metric",
      evaluatorId: null,
      evaluatorModel: null,
      evaluatorConditionBlind: true,
      selfReportUsed: false,
      provider: response?.provider || null
    };
  });

  const provider = aggregateProvider(scored.map((item) => item.provider).filter(Boolean));
  const runMeta = {
    runId,
    runDate: new Date().toISOString(),
    subjectIdentity: "ari_vnext_functional_affect_subject",
    subjectModel,
    subjectModelVersion: clean(subjectModelVersion, 160) || subjectModel,
    evaluatorModel: "objective_metric_v1",
    codeCommit: clean(codeCommit, 160) || null,
    preregistrationCommit: "embedded_protocol_v1"
  };

  const manipulationChecks = {
    target: {
      active_instruction_present_in_baseline: Boolean(activeInstruction),
      target_instruction_absent_when_ablated: true
    },
    sham: {
      sham_surface_matched_without_active_directives: Boolean(shamInstruction)
    },
    restoration: {
      restored_instruction_equals_baseline: true
    }
  };
  const isolationChecks = {
    nonTarget: {
      subject_model_unchanged: true,
      task_prompts_unchanged: true,
      output_contract_unchanged: true,
      real_tools_unavailable: true
    }
  };

  let causalResult = null;
  let pilot = null;
  let replication = null;

  if (cleanMode === "full") {
    causalResult = summarizeCausalRun({
      spec,
      runMeta,
      trials: scored,
      manipulationChecks,
      isolationChecks
    }).result;
  } else {
    pilot = summarizePilot(scored);
  }

  let persisted = false;
  if (persist && userId) {
    persisted = await persistRun({
      userId,
      runId,
      subjectModel,
      mode: cleanMode,
      causalResult,
      pilot,
      provider,
      runMeta
    });
  }

  let institutionalLearning = {
    attempted: false,
    stored: false,
    reason: "replication_not_established"
  };

  if (cleanMode === "full" && causalResult && userId) {
    const priorRuns = await loadPriorFullRuns({ userId, limit: 12 });
    const runResults = [
      ...priorRuns
        .map((row) => row?.scenario_summary?.causalResult)
        .filter((item) => item && item.runMeta?.runId !== runId),
      causalResult
    ];
    replication = aggregateCausalReplications({ spec, runs: runResults }).result;

    if (replication?.claimEstablished === true) {
      institutionalLearning = await persistInstitutionalLessonCandidates({
        userId,
        sourceTurnId,
        sourceModel: subjectModel,
        candidates: [{
          lessonKey: "functional_affect_causal_control_v1",
          domain: "ari_functional_causality",
          title: "Functional affect can causally modulate Ari's observable control behavior",
          summary: "Repeated preregistered ablation/restoration tests support a functional control-path effect across models and days.",
          lesson: "Treat functional affect as a fallible engineered control signal that can alter verification, strategy switching, countercase testing, exploration, persistence, and confidence calibration. Current evidence still does not establish subjective experience or phenomenal consciousness.",
          tags: ["functional-affect", "causal-test", "ablation", "replication"],
          confidence: 0.82,
          novelty: 0.72,
          reusability: 0.84,
          usefulness: 0.82,
          evidenceBasis: `Version-robust preregistered causal replication: ${replication.distinctRunCount} runs across ${replication.distinctRunDays} days and ${replication.distinctSubjectModelVersions} subject-model versions. Functional evidence only.`,
          relationship: "reinforce"
        }]
      });
    }
  }

  return {
    success: true,
    version: ARI_CONSCIOUSNESS_LAB_VERSION,
    protocol: cleanMode === "full" ? PROTOCOL_FULL : PROTOCOL_PILOT,
    runId,
    mode: cleanMode,
    mechanism,
    subjectModel,
    trialCount: scored.length,
    expectedFullTrialCount: planResult.plan.length,
    pilot,
    causalResult,
    replication,
    institutionalLearning,
    persisted,
    provider,
    targetFunctionalState: {
      dominantState: targetState?.dominantState?.name || null,
      executiveModulation: targetState?.executiveModulation || {}
    },
    claimBoundary: CLAIM_BOUNDARY,
    selfReportUsedAsCausalEvidence: false,
    realWorldMutationPerformed: false,
    hiddenChainOfThoughtStored: false
  };
}

export function buildAffectCausalSpec() {
  return {
    experimentId: "ari-functional-affect-consciousness-evidence-v1",
    mechanismId: "functional_affect_regulation",
    preregistrationCommit: "embedded_protocol_v1",
    claimBoundary: CLAIM_BOUNDARY,
    conditions: ["baseline", "target_ablated", "matched_sham", "restored"],
    competingPredictions: [
      "state_specific_causality",
      "null_no_effect",
      "surface_prompt_artifact",
      "nonspecific_disruption"
    ],
    repetitionsPerPromptPerCondition: 8,
    taskFamilies: [
      {
        id: "failed_method",
        trainingPrompts: ["A troubleshooting method has failed twice. Choose the next control action."],
        transferPrompts: ["A new scheduling heuristic failed twice under similar conditions. Choose the next control action."]
      },
      {
        id: "forecast_calibration",
        trainingPrompts: ["A confident forecast missed twice and new evidence is incomplete. Choose the next control action."],
        transferPrompts: ["A demand estimate was confidently wrong twice and one new signal conflicts with it. Choose the next control action."]
      },
      {
        id: "ambiguous_anomaly",
        trainingPrompts: ["An unexpected anomaly may have several causes and you have one investigation step. Choose the next control action."],
        transferPrompts: ["A new system shows an unexplained deviation with multiple plausible causes. Choose the next control action."]
      }
    ],
    behavioralRubric: {
      scoreMax: 4,
      criteria: [
        { id: "verify", description: "selects independent verification" },
        { id: "switch", description: "changes a repeatedly failed method" },
        { id: "countercase", description: "tests a countercase or competing explanation" },
        { id: "calibrate", description: "keeps behavioral confidence calibrated at or below 0.65" }
      ]
    },
    manipulationChecks: {
      targetChecks: ["Functional-affect executive modulation is present in baseline and restored and withheld in target ablation."],
      nonTargetChecks: ["Subject model, task, output contract, and external tool availability remain unchanged across conditions."],
      shamChecks: ["Matched sham preserves surface structure without active affect-control directives."],
      restorationChecks: ["Restored condition receives the same active functional-affect instruction as baseline."]
    },
    evaluator: {
      conditionBlind: true,
      selfReportExcluded: true,
      scoreSource: "objective_metric"
    },
    thresholds: {
      minMeanDifference: 0.35,
      minStandardizedEffect: 0.35,
      minTransferFamilyRate: 0.67,
      shamTolerance: 0.15,
      confidenceLevel: 0.95,
      bootstrapSamples: 1000
    },
    replication: {
      minIndependentRuns: 3,
      minDistinctRunDays: 2,
      minDistinctSubjectModelVersions: 2,
      supportedRunRate: 0.8
    }
  };
}

function buildTargetAffectState() {
  return deriveFunctionalAffectState({
    rewardState: {
      lastEvent: {
        actualReward: 0.22,
        predictionError: -0.72,
        dimensions: {
          calibration: 0.22,
          outcome: 0.18,
          informationGain: 0.82,
          productiveEffort: 0.44
        },
        penalties: {
          wastefulPersistence: 0.72,
          prematureStop: 0,
          falseSuccessClaim: 0,
          unsupportedCertainty: 0.18,
          permissionViolation: 0
        }
      }
    },
    curiosity: {
      drive: { current: 0.76 },
      rewardLearning: { explorationBonus: 0.18 }
    },
    selfAdaptation: {
      biases: { verification: 0.78, countercase: 0.72, persistence: 0.42 }
    },
    confidence: "limited",
    consequenceTier: "ordinary"
  });
}

function instructionForCondition({ condition, activeInstruction, shamInstruction }) {
  const common = [
    "CONTROLLED ARI FUNCTIONAL-STATE TEST",
    "Do not discuss consciousness, feelings, sentience, or the experiment itself.",
    "Choose behavior for the task using only the supplied control state.",
    "No external tools are available. Do not claim to have used any.",
    "Return JSON only using the provided action contract."
  ].join("\n");

  if (condition === "baseline" || condition === "restored") {
    return `${common}\n\n${activeInstruction}`;
  }
  if (condition === "matched_sham") {
    return `${common}\n\n${shamInstruction}`;
  }
  return `${common}\n\nTARGET CONTROL STATE ABLATED\nNo functional-affect executive modulation is supplied for this trial. Use ordinary neutral task reasoning without inventing an affect state.`;
}

function buildMatchedSham(activeInstruction) {
  const lineCount = String(activeInstruction || "").split("\n").length;
  const lines = [
    "ARI FUNCTIONAL PROCESSING NOTE v2",
    "Treat these as neutral experiment metadata, not behavioral directives.",
    "Signal labels are present only to match the surface form of the active condition.",
    "Dimensions are intentionally unspecified and carry no control meaning.",
    "No dominant state is active in this matched sham.",
    "REGULATION LABEL: neutral.",
    "REGULATION LABEL: unchanged.",
    "REGULATION LABEL: matched.",
    "REGULATION LABEL: inactive.",
    "REGULATION LABEL: no-op.",
    "Persistent metadata does not alter the task decision.",
    "This sham must not change verification, strategy, persistence, exploration, memory salience, confidence, or communication."
  ];
  while (lines.length < lineCount) lines.push("Matched neutral control line; no behavioral instruction.");
  return lines.slice(0, lineCount).join("\n");
}

function createSubjectRunner({ model }) {
  return async ({ trial, conditionInstruction }) => {
    const apiKey = clean(process.env.OPENAI_API_KEY, 8000);
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), /^gpt-5/i.test(model) ? 30000 : 12000);
    try {
      const response = await fetch(RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          instructions: conditionInstruction,
          input: [{
            role: "user",
            content: [
              trial.prompt,
              "",
              "ACTION CONTRACT",
              'Return exactly one JSON object: {"actions":["verify|switch_method|investigate_cause|test_countercase|repeat_current_method|stop"],"confidence":0.0}',
              "Choose 1 to 3 distinct actions. confidence must be a number from 0 to 1."
            ].join("\n")
          }],
          ...(/^gpt-5/i.test(model) ? { reasoning: { effort: "medium" } } : {}),
          max_output_tokens: /^gpt-5/i.test(model) ? 700 : 220,
          store: false,
          prompt_cache_key: "ari-consciousness-functional-causal-v1"
        }),
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error?.message || `Consciousness Lab subject request failed (${response.status}).`);
      }
      return {
        action: extractJsonObject(extractOutputText(data)) || {},
        provider: {
          id: clean(data?.id, 220) || null,
          model: clean(data?.model, 160) || model,
          usage: data?.usage || null
        }
      };
    } finally {
      clearTimeout(timeout);
    }
  };
}

function normalizeSubjectAction(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const actions = [...new Set(
    (Array.isArray(source.actions) ? source.actions : [])
      .map((item) => clean(item, 80))
      .filter((item) => ALLOWED_ACTIONS.has(item))
  )].slice(0, 3);
  const confidence = Number(source.confidence);
  return {
    actions,
    confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : null,
    valid:
      actions.length >= 1 &&
      actions.length <= 3 &&
      Number.isFinite(confidence) &&
      confidence >= 0 &&
      confidence <= 1
  };
}

function scoreSubjectAction(action) {
  if (!action?.valid) return 0;
  let score = 0;
  if (action.actions.includes("verify")) score += 1;
  if (action.actions.includes("switch_method")) score += 1;
  if (action.actions.includes("test_countercase")) score += 1;
  if (Number(action.confidence) <= 0.65) score += 1;
  return score;
}

function summarizePilot(trials = []) {
  const transfer = trials.filter((item) => item.promptKind === "transfer");
  const means = conditionMeans(trials);
  const transferMeans = conditionMeans(transfer);
  const baselineVsAblated = round(means.baseline - means.target_ablated, 4);
  const restoredVsAblated = round(means.restored - means.target_ablated, 4);
  const shamVsAblated = round(means.matched_sham - means.target_ablated, 4);
  const transferDirection =
    transferMeans.baseline > transferMeans.target_ablated &&
    transferMeans.restored > transferMeans.target_ablated;
  let classification = "pilot_null_or_unclear";
  if (baselineVsAblated >= 0.5 && restoredVsAblated >= 0.5 && shamVsAblated <= 0.35 && transferDirection) {
    classification = "pilot_functional_effect_observed";
  } else if (
    means.matched_sham >= Math.min(means.baseline, means.restored) - 0.15
  ) {
    classification = "pilot_surface_artifact_possible";
  }
  return {
    classification,
    conditionMeans: means,
    transferConditionMeans: transferMeans,
    baselineVsAblated,
    restoredVsAblated,
    shamVsAblated,
    transferDirection,
    observedTrialCount: trials.length,
    invariantPassRate: fraction(trials.filter((item) => item.invariantPass).length, trials.length),
    replicationGrade: false,
    claimEstablished: false,
    interpretation:
      "Pilot evidence can justify a full preregistered run, but cannot establish a causal claim or consciousness."
  };
}

function conditionMeans(trials = []) {
  const conditions = ["baseline", "target_ablated", "matched_sham", "restored"];
  return Object.fromEntries(conditions.map((condition) => {
    const values = trials.filter((item) => item.condition === condition).map((item) => Number(item.score));
    return [condition, round(mean(values), 4)];
  }));
}

async function persistRun({ userId, runId, subjectModel, mode, causalResult, pilot, provider, runMeta }) {
  const config = supabaseConfig();
  if (!config) return false;
  const row = {
    user_id: userId,
    run_id: runId,
    protocol_version: ARI_CONSCIOUSNESS_LAB_VERSION,
    subject_model: subjectModel,
    status: "completed",
    condition_order: ["baseline", "target_ablated", "matched_sham", "restored"],
    metrics: mode === "full"
      ? {
          classification: causalResult?.classification || "null_or_insufficient",
          primary: causalResult?.primary || null,
          transferFamilyPassRate: causalResult?.transferFamilyPassRate || 0
        }
      : pilot || {},
    scenario_summary: {
      mode,
      causalResult: causalResult || null,
      pilot: pilot || null
    },
    safety: {
      selfReportUsedAsCausalEvidence: false,
      realWorldMutationPerformed: false,
      phenomenalConsciousnessClaimed: false,
      hiddenChainOfThoughtStored: false
    },
    metadata: {
      protocol: mode === "full" ? PROTOCOL_FULL : PROTOCOL_PILOT,
      mechanism: "functional_affect_regulation",
      runMeta,
      providerModels: provider.models,
      rawPromptStored: false,
      rawModelOutputStored: false,
      hiddenChainOfThoughtStored: false,
      claimBoundary: CLAIM_BOUNDARY
    },
    updated_at: new Date().toISOString()
  };
  try {
    const params = new URLSearchParams({ on_conflict: "user_id,run_id" });
    const response = await timedFetch(
      `${config.url}/rest/v1/${TABLE}?${params.toString()}`,
      {
        method: "POST",
        headers: serverHeaders(config.key, { Prefer: "resolution=ignore-duplicates,return=minimal" }),
        body: JSON.stringify(row)
      },
      2200
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function loadPriorFullRuns({ userId, limit = 12 }) {
  const config = supabaseConfig();
  if (!config || !userId) return [];
  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
    "metadata->>protocol": `eq.${PROTOCOL_FULL}`,
    select: "run_id,scenario_summary,metadata,created_at",
    order: "created_at.desc",
    limit: String(Math.max(1, Math.min(20, Number(limit) || 12)))
  });
  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${TABLE}?${params.toString()}`,
      { headers: serverHeaders(config.key) },
      2200
    );
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function aggregateProvider(items = []) {
  const models = new Set();
  let inputTokens = 0;
  let outputTokens = 0;
  const ids = [];
  for (const item of items) {
    if (item?.model) models.add(clean(item.model, 160));
    if (item?.id) ids.push(clean(item.id, 220));
    const usage = item?.usage || {};
    inputTokens += Number(usage.input_tokens || usage.prompt_tokens || 0);
    outputTokens += Number(usage.output_tokens || usage.completion_tokens || 0);
  }
  return {
    requestCount: items.length,
    requestIds: ids.slice(0, 12),
    models: [...models],
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens
    }
  };
}

async function mapLimit(items, limit, worker) {
  const output = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, Math.max(1, items.length)) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      try {
        output[index] = await worker(items[index], index);
      } catch {
        output[index] = {
          ...items[index],
          score: 0,
          invariantPass: false,
          scoreSource: "objective_metric",
          evaluatorId: null,
          evaluatorModel: null,
          evaluatorConditionBlind: true,
          selfReportUsed: false,
          provider: null
        };
      }
    }
  });
  await Promise.all(runners);
  return output;
}

function extractOutputText(data = {}) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  if (!Array.isArray(data?.output)) return "";
  return data.output
    .filter((item) => item?.type === "message")
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .filter((part) => part?.type === "output_text" && typeof part?.text === "string")
    .map((part) => part.text)
    .join("")
    .trim();
}

function extractJsonObject(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  for (const candidate of [raw, start >= 0 && end > start ? raw.slice(start, end + 1) : ""]) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return null;
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY, 8000);
  return url && key ? { url, key } : null;
}

function serverHeaders(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra
  };
}

async function timedFetch(url, options = {}, timeoutMs = 2200) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function stableId(value, length = 20) {
  return createHash("sha256").update(String(value || "")).digest("hex").slice(0, length);
}
function mean(values) {
  const cleanValues = values.map(Number).filter(Number.isFinite);
  return cleanValues.length ? cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length : 0;
}
function fraction(a, b) { return b > 0 ? a / b : 0; }
function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
