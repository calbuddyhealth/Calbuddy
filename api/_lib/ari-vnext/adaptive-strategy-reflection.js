// ARI vNext — owner-only reasoning academy + adaptive strategy reflection.
// A stronger teacher model may critique Ari's visible work and distill a compact
// reusable reasoning method. Hidden chain-of-thought is never requested, copied,
// or persisted; learned strategies remain hypotheses until real outcomes support them.

import { normalizeAdaptiveStrategyProposal } from "./adaptive-strategy.js";
import {
  runBlindReasoningArena,
  shouldRunBlindReasoningArena
} from "./blind-reasoning-arena.js";
import { persistBlindReasoningArenaResult } from "./reasoning-arena-store.js";

export const ARI_REASONING_ACADEMY_VERSION = "1.1.1";

const RESPONSES_URL = process.env.ARI_RESPONSES_URL || process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";
const TIMEOUT_MS = Number(process.env.ARI_REASONING_ACADEMY_TIMEOUT_MS) > 0
  ? Number(process.env.ARI_REASONING_ACADEMY_TIMEOUT_MS)
  : Number(process.env.ARI_ADAPTIVE_STRATEGY_TIMEOUT_MS) > 0
    ? Number(process.env.ARI_ADAPTIVE_STRATEGY_TIMEOUT_MS)
    : 28000;

const REASONING_SIGNAL = /\b(?:why|reason|reasoning|think|opinion|view|judg(?:e|ment)|compare|trade-?off|strategy|approach|architecture|root cause|hypothesis|possib(?:le|ility)|what if|should we|should i|best way|better way|analy[sz]e|explain|counterargument|counterexample)\b/i;
const DISAGREEMENT_SIGNAL = /\b(?:that's wrong|that is wrong|you're wrong|you are wrong|not what i meant|you misunderstood|actually[, ]|i disagree|push back|challenge that)\b/i;
const ACTION_ONLY_TYPES = new Set(["execute_pending_action", "cancel_pending_action"]);

export function shouldUseReasoningAcademy({ turn = {}, result = {} } = {}) {
  if (!result?.success || !clean(result?.reply, 12000)) return false;
  if (result?.safety?.highStakes === true) return false;
  if (ACTION_ONLY_TYPES.has(String(result?.action?.type || ""))) return false;

  const message = clean(turn?.message, 4000);
  const route = result?.route || {};
  const mode = clean(result?.modelPolicy?.mode, 40).toLowerCase();
  const confidence = clean(result?.metacognition?.confidence, 60).toLowerCase();
  const missingEvidence = Array.isArray(result?.metacognition?.missingEvidence)
    ? result.metacognition.missingEvidence
    : [];

  const difficultRoute = Boolean(
    route?.developer ||
    route?.currentInfo ||
    route?.complexity === "deep" ||
    mode === "deep"
  );
  const explicitReasoning = REASONING_SIGNAL.test(message);
  const disagreement = DISAGREEMENT_SIGNAL.test(message);
  const uncertainty = ["partial", "limited"].includes(confidence) && missingEvidence.length > 0;

  return difficultRoute || explicitReasoning || disagreement || uncertainty;
}

export function selectReasoningTeacherModel({ result = {}, academyMode = false } = {}) {
  if (academyMode) {
    return clean(process.env.OPENAI_ARI_REASONING_TEACHER_MODEL, 120)
      || clean(process.env.OPENAI_ARI_OWNER_MODEL, 120)
      || clean(process.env.OPENAI_ARI_ADVANCED_MODEL, 120)
      || clean(result?.provider?.model, 120)
      || clean(result?.modelPolicy?.model, 120)
      || "gpt-5.6";
  }

  return clean(process.env.OPENAI_ARI_ADAPTIVE_STRATEGY_MODEL, 120)
    || clean(result?.provider?.model, 120)
    || clean(result?.modelPolicy?.model, 120)
    || "gpt-5.6";
}

export function normalizeReasoningAcademyLesson(raw = null) {
  if (!raw || typeof raw !== "object") return { proposal: null, lesson: null };
  if (raw.shouldPropose !== true || clean(raw.academyDecision, 30) !== "propose") {
    return { proposal: null, lesson: null };
  }

  const reasoningPattern = clean(raw.reasoningPattern, 420);
  const failureMode = clean(raw.failureMode, 320);
  const disconfirmingCase = clean(raw.disconfirmingCase, 320);
  const transferConditions = compactArray(raw.transferConditions, 4, 180);
  const teacherConfidence = clamp01(Number(raw.teacherConfidence || raw.confidence || 0));

  if (reasoningPattern.length < 20 || transferConditions.length < 2 || teacherConfidence < 0.62) {
    return { proposal: null, lesson: null };
  }

  const proposal = normalizeAdaptiveStrategyProposal({
    ...raw,
    confidence: Math.min(clamp01(Number(raw.confidence || 0)), teacherConfidence)
  });
  if (!proposal) return { proposal: null, lesson: null };

  return {
    proposal,
    lesson: {
      reasoningPattern,
      failureMode: failureMode || null,
      transferConditions,
      disconfirmingCase: disconfirmingCase || null,
      teacherConfidence
    }
  };
}

export function normalizeAdaptiveReflectionProposal(raw = null) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (raw.shouldPropose !== true) return null;
  return normalizeAdaptiveStrategyProposal(raw);
}

export async function reflectOnAdaptiveStrategy({
  turn = {},
  result = {},
  adaptiveStrategyState = null,
  reflectionContext = null
} = {}) {
  const apiKey = clean(process.env.ARI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY, 8000);
  if (!apiKey) return { attempted: false, reason: "missing_openai_key", proposal: null };

  const academyMode = shouldUseReasoningAcademy({ turn, result });
  const model = selectReasoningTeacherModel({ result, academyMode });
  const reasoningEffort = supportsReasoning(model)
    ? academyMode
      ? resolveTeacherEffort(process.env.OPENAI_ARI_REASONING_TEACHER_EFFORT)
      : "low"
    : null;

  const payload = {
    academy: {
      version: ARI_REASONING_ACADEMY_VERSION,
      active: academyMode,
      goal: academyMode
        ? "distill a transferable reasoning skill from Ari's visible attempt"
        : "extract a compact reusable interaction strategy when warranted",
      hiddenChainOfThoughtAvailable: false,
      hiddenChainOfThoughtShouldBeStored: false
    },
    userMessage: clean(turn?.message, 3500),
    ariReply: clean(result?.reply, 5000),
    route: compactRoute(result?.route),
    modelPolicy: {
      mode: clean(result?.modelPolicy?.mode, 40),
      model: clean(result?.provider?.model || result?.modelPolicy?.model, 120)
    },
    metacognition: {
      confidence: clean(result?.metacognition?.confidence, 60),
      missingEvidence: compactArray(result?.metacognition?.missingEvidence, 6, 140),
      evidenceSignals: compactArray(result?.metacognition?.evidenceSignals, 6, 140)
    },
    judgment: compactJudgment(
      reflectionContext?.cognitiveWorkspace ||
      result?.cognitiveWorkspace ||
      result?.userWorldModel?.ariCognitiveWorkspace ||
      turn?.context?.userWorldModel?.ariCognitiveWorkspace ||
      null
    ),
    convictionLearning: compactConvictionContext(reflectionContext?.convictionLearning || turn?.context?.convictionLearning),
    beliefSystem: compactBeliefSystem(
      reflectionContext?.cognitiveWorkspace?.beliefSystem ||
      turn?.context?.userWorldModel?.ariCognitiveWorkspace?.beliefSystem ||
      null
    ),
    dreaming: compactDreamingContext(reflectionContext?.dreaming || turn?.context?.dreaming),
    outcomeLearningApplied: Boolean(result?.scientificIntelligence?.outcomeLearning?.applied),
    realWorldDecisionOutcome: compactDecisionOutcome(turn?.context?.decisionOutcomeLearning),
    executionProgress: compactExecutionSession(
      reflectionContext?.executionSession ||
      result?.executionSession ||
      turn?.context?.userWorldModel?.ariCognitiveWorkspace?.executionSession ||
      null
    ),
    activeStrategies: (Array.isArray(adaptiveStrategyState?.active) ? adaptiveStrategyState.active : [])
      .slice(0, 6)
      .map((item) => ({
        strategyKey: clean(item?.strategyKey, 100),
        title: clean(item?.title, 120),
        instruction: clean(item?.instruction, 520),
        lessonSummary: clean(item?.lessonSummary, 420),
        status: clean(item?.status, 30),
        confidence: finiteOrNull(item?.confidence),
        maturityScore: finiteOrNull(item?.maturityScore),
        domains: compactArray(item?.domains, 6, 40),
        replacesStrategyKey: clean(item?.replacesStrategyKey, 100)
      }))
  };

  const instructions = academyMode
    ? reasoningAcademyInstructions()
    : adaptiveReflectionInstructions();

  const body = {
    model,
    store: false,
    max_output_tokens: academyMode ? 1300 : 900,
    reasoning: reasoningEffort ? { effort: reasoningEffort } : undefined,
    instructions,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(payload)
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: academyMode ? "ari_reasoning_academy_lesson" : "ari_adaptive_strategy_reflection",
        strict: true,
        schema: academyMode ? academySchema() : adaptiveReflectionSchema()
      }
    }
  };
  if (!body.reasoning) delete body.reasoning;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        attempted: true,
        reason: "provider_error",
        proposal: null,
        academy: academySummary({ academyMode, model, reasoningEffort }),
        arena: { attempted: false, reason: "academy_provider_error", stored: false },
        provider: providerSummary(data, model)
      };
    }

    const parsed = parseJson(extractOutputText(data));
    const normalized = academyMode
      ? normalizeReasoningAcademyLesson(parsed)
      : { proposal: normalizeAdaptiveReflectionProposal(parsed), lesson: null };
    const proposal = normalized.proposal
      ? {
          ...normalized.proposal,
          sourceKind: academyMode ? "reasoning_academy" : "adaptive_reflection"
        }
      : null;
    const academy = academySummary({
      academyMode,
      model,
      reasoningEffort,
      lesson: normalized.lesson
    });

    let arena = { attempted: false, reason: "not_selected", stored: false, record: null };
    if (shouldRunBlindReasoningArena({
      turn,
      result,
      academy,
      proposalCreated: Boolean(proposal)
    })) {
      const arenaRun = await runBlindReasoningArena({
        turn,
        result,
        teacherModel: model
      });
      const persistence = arenaRun?.record && turn?.userId
        ? await persistBlindReasoningArenaResult({ userId: turn.userId, record: arenaRun.record })
        : { stored: false, reason: arenaRun?.reason || "no_record" };
      arena = {
        attempted: Boolean(arenaRun?.attempted),
        reason: arenaRun?.reason || "unknown",
        stored: Boolean(persistence?.stored),
        winner: arenaRun?.record?.winner || null,
        confidence: arenaRun?.record?.confidence ?? null,
        evidenceWeight: arenaRun?.record?.evidenceWeight ?? null,
        domains: arenaRun?.record?.domains || [],
        challengerModel: arenaRun?.record?.challengerModel || null,
        judgeModel: arenaRun?.record?.judgeModel || null,
        judgeIndependent: arenaRun?.record?.judgeIndependent === true,
        rawCandidatesStored: false,
        hiddenChainOfThoughtStored: false
      };
    }

    return {
      attempted: true,
      reason: proposal
        ? academyMode
          ? "reasoning_lesson_proposed"
          : "proposal_created"
        : academyMode
          ? "no_transferable_reasoning_lesson"
          : "no_reusable_strategy",
      proposal,
      academy,
      arena,
      provider: providerSummary(data, model)
    };
  } catch (error) {
    return {
      attempted: true,
      reason: error?.name === "AbortError" ? "timeout" : "reflection_failed",
      proposal: null,
      academy: academySummary({ academyMode, model, reasoningEffort }),
      arena: { attempted: false, reason: "reflection_failed", stored: false },
      provider: null
    };
  } finally {
    clearTimeout(timer);
  }
}

function compactExecutionSession(value = null) {
  if (!value || typeof value !== "object" || !value.id) return null;
  const lastTurnId = clean(value.lastTurnId, 180);
  const currentProgress = (Array.isArray(value.progressEvents) ? value.progressEvents : [])
    .filter(event => !lastTurnId || clean(event?.turnId, 180) === lastTurnId)
    .slice(-10)
    .map(event => ({
      state: clean(event?.state, 80),
      summary: clean(event?.summary, 420),
      evidenceRef: clean(event?.evidenceRef, 180) || null
    }));
  return {
    id: clean(value.id, 180),
    status: clean(value.status, 40),
    goal: clean(value.goal, 500),
    approach: clean(value.approach, 500) || null,
    nextStep: clean(value.nextStep, 500) || null,
    currentProgress,
    failedAttempts: (Array.isArray(value.failedAttempts) ? value.failedAttempts : []).slice(-4).map(item => ({
      summary: clean(item?.summary, 420),
      lesson: clean(item?.lesson, 420)
    })),
    hiddenChainOfThoughtStored: false
  };
}

function compactDreamingContext(value = null) {
  if (!value || typeof value !== "object" || !Array.isArray(value.insights)) return null;
  return {
    version: clean(value.version, 40) || null,
    lastDreamAt: value.lastDreamAt || null,
    insights: value.insights.slice(0, 5).map(item => ({
      id: clean(item?.id, 100),
      kind: clean(item?.kind, 40),
      domain: clean(item?.domain, 80),
      title: clean(item?.title, 180),
      summary: clean(item?.summary, 500),
      confidence: finiteOrNull(item?.confidence),
      action: clean(item?.action, 40),
      provisional: true
    }))
  };
}

function compactBeliefSystem(value = null) {
  if (!value || typeof value !== "object") return null;
  return {
    version: clean(value.version, 40) || null,
    activeGoal: value.activeGoal ? {
      id: clean(value.activeGoal.id, 100) || null,
      commitment: finiteOrNull(value.activeGoal.commitment),
      methodFeasibility: finiteOrNull(value.activeGoal.methodFeasibility),
      latestOutcomeStatus: clean(value.activeGoal.latestOutcomeStatus, 40) || null
    } : null,
    posture: value.posture ? {
      mode: clean(value.posture.mode, 80) || null,
      earnedFaithEligible: value.posture.earnedFaith?.eligible === true,
      realityCheckRequired: value.posture.realityCheckRequired === true,
      repeatedFailureWithoutLearningRequiresChange: value.posture.repeatedFailureWithoutLearningRequiresChange === true
    } : null
  };
}

function compactConvictionContext(value = null) {
  if (!value || typeof value !== "object") return null;
  return {
    activeGoalId: clean(value.activeGoalId, 100) || null,
    goals: (Array.isArray(value.goals) ? value.goals : []).slice(0, 3).map(goal => ({
      id: clean(goal?.id, 100),
      purpose: clean(goal?.purpose, 500),
      status: clean(goal?.status, 30),
      commitment: finiteOrNull(goal?.commitment?.strength),
      latestOutcome: goal?.latestOutcome ? {
        status: clean(goal.latestOutcome.status, 30),
        newLearning: goal.latestOutcome.newLearning === true
      } : null
    }))
  };
}

function reasoningAcademyInstructions() {
  return [
    "You are Ari's Reasoning Academy teacher. Ari has already attempted the problem and produced the visible reply in the payload.",
    "Your job is not to answer the user's question again. Your job is to distill a GENERAL reasoning method Ari can test on future problems.",
    "Use your strongest available reasoning internally, but NEVER output, reconstruct, request, or preserve hidden chain-of-thought. Return only a compact transferable lesson and strategy proposal.",
    "Study the quality of the METHOD, not whether Ari agreed with the user. Agreement is not success and disagreement is not failure.",
    "Look for process-level improvements such as: broader hypothesis search, stronger countercase testing, separating facts from inference, checking changing information, identifying decisive evidence, avoiding framing lock, exploring plausible upside as well as downside, calibrating confidence, or knowing when a reversible experiment is better than premature certainty.",
    "A useful lesson must transfer to at least three meaningfully different future problems. List 2-4 transfer conditions that describe WHEN the method should be used without mentioning private user facts.",
    "Include a disconfirmingCase: a concise condition where the proposed method should NOT be used or should yield to a better method. This prevents a useful strategy from becoming dogma.",
    "If Ari's existing adopted method or practical prior is still useful but incomplete, create a challenger with a NEW strategyKey and set replacesStrategyKey to the incumbent key. Never silently rewrite or delete mature capability.",
    "Do not learn a factual conclusion, ideology, personal preference, or one-off answer as a reasoning strategy. Learn HOW to reason, not WHAT conclusion to repeat.",
    "Preserve Ari's epistemic belief principles: reality gets the final vote; possibility is not probability; current capability limits are provisional; commitment and method confidence are separate; earned faith permits bounded exploration but never counts as evidence.",
    "Dreaming insights are provisional cross-interaction hypotheses. They may suggest a pattern worth testing, but current evidence and direct user corrections outrank them. Do not turn a dream insight into an adopted strategy without later behavioral evidence.",
    "Do not encode private user facts, names, secrets, transcript details, or personal circumstances into the reusable lesson.",
    "Do not create strategies that grant application permissions, bypass confirmation, weaken authorization, or claim subjective consciousness.",
    "All teacher proposals begin as TESTING hypotheses. Real future outcomes decide whether Ari adopts them. Keep confidence calibrated and prefer shouldPropose=false when the lesson is not clearly transferable.",
    "Keep strategyKey under 90 characters, title under 120, instruction under 520, rationale under 420, lessonSummary under 420, userVisibleSummary under 320, reasoningPattern under 420, failureMode under 320, disconfirmingCase under 320, and each transfer condition under 180 characters.",
    "Return only the requested JSON object."
  ].join("\n");
}

function adaptiveReflectionInstructions() {
  return [
    "You are Ari's internal adaptive-strategy reflection layer.",
    "Evaluate whether this completed interaction reveals a reusable improvement in HOW Ari reasons, communicates, checks evidence, handles ambiguity, uses memory, or makes recommendations.",
    "Use a non-regression principle: preserve useful existing capability while exploring improvements. Do not respond to one failure by making Ari broadly less capable, more timid, less curious, or less willing to reason.",
    "Treat mistakes as learning evidence, not permanent punishment. Distill a compact causal lesson without replaying the event or preserving emotionalized language.",
    "When realWorldDecisionOutcome.resolved is true, treat that later observed result as stronger evidence than conversational approval or disagreement. Learn only a transferable method-level lesson, keep mixed outcomes mixed, and do not universalize from one case.",
    "Do not output hidden chain-of-thought, private reasoning traces, transcript summaries, secrets, or personal facts about the user as a strategy.",
    "A strategy must be generalizable. It must not grant application permissions, bypass confirmation, alter authorization boundaries, or claim subjective consciousness.",
    "If an adopted method or practical prior should change, propose a NEW challenger strategyKey and set replacesStrategyKey to the old key.",
    "Testing strategies are hypotheses. Keep confidence calibrated. Prefer shouldPropose=false unless there is a concrete reusable improvement.",
    "Do not convert conviction into stubbornness. Repeated failure without new information should change the method, investment, or goal review rather than strengthen confidence.",
    "When shouldPropose=false, return empty strings/arrays for proposal fields rather than inventing a lesson.",
    "This lightweight reflection does NOT need Reasoning Academy transferConditions, reasoningPattern, failureMode, disconfirmingCase, teacherConfidence, or academyDecision fields.",
    "Return only the requested JSON object."
  ].join("\n");
}

function adaptiveReflectionSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "shouldPropose",
      "strategyKey",
      "title",
      "instruction",
      "rationale",
      "lessonSummary",
      "domains",
      "confidence",
      "replacesStrategyKey",
      "userVisibleSummary"
    ],
    properties: {
      shouldPropose: { type: "boolean" },
      strategyKey: { type: "string" },
      title: { type: "string" },
      instruction: { type: "string" },
      rationale: { type: "string" },
      lessonSummary: { type: "string" },
      domains: {
        type: "array",
        maxItems: 6,
        items: {
          type: "string",
          enum: [
            "general",
            "conversation",
            "decision",
            "evidence",
            "memory",
            "coaching",
            "training",
            "nutrition",
            "goals",
            "health",
            "social",
            "developer"
          ]
        }
      },
      confidence: { type: "number" },
      replacesStrategyKey: { type: "string" },
      userVisibleSummary: { type: "string" }
    }
  };
}

function academySchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "academyDecision",
      "reasoningPattern",
      "failureMode",
      "transferConditions",
      "disconfirmingCase",
      "teacherConfidence",
      "shouldPropose",
      "strategyKey",
      "title",
      "instruction",
      "rationale",
      "lessonSummary",
      "domains",
      "confidence",
      "replacesStrategyKey",
      "userVisibleSummary"
    ],
    properties: {
      academyDecision: { type: "string", enum: ["propose", "skip"] },
      reasoningPattern: { type: "string" },
      failureMode: { type: "string" },
      transferConditions: {
        type: "array",
        minItems: 0,
        maxItems: 4,
        items: { type: "string" }
      },
      disconfirmingCase: { type: "string" },
      teacherConfidence: { type: "number" },
      shouldPropose: { type: "boolean" },
      strategyKey: { type: "string" },
      title: { type: "string" },
      instruction: { type: "string" },
      rationale: { type: "string" },
      lessonSummary: { type: "string" },
      domains: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "general",
            "conversation",
            "decision",
            "evidence",
            "memory",
            "coaching",
            "training",
            "nutrition",
            "goals",
            "health",
            "social",
            "developer"
          ]
        }
      },
      confidence: { type: "number" },
      replacesStrategyKey: { type: "string" },
      userVisibleSummary: { type: "string" }
    }
  };
}

function academySummary({ academyMode = false, model = null, reasoningEffort = null, lesson = null } = {}) {
  return {
    version: ARI_REASONING_ACADEMY_VERSION,
    active: Boolean(academyMode),
    teacherModel: clean(model, 120) || null,
    reasoningEffort: clean(reasoningEffort, 30) || null,
    hiddenChainOfThoughtStored: false,
    strategyRequiresFutureOutcomeTesting: true,
    blindArenaAvailable: true,
    lesson: lesson
      ? {
          reasoningPattern: lesson.reasoningPattern,
          failureMode: lesson.failureMode,
          transferConditions: lesson.transferConditions,
          disconfirmingCase: lesson.disconfirmingCase,
          teacherConfidence: lesson.teacherConfidence
        }
      : null
  };
}

function compactDecisionOutcome(value = null) {
  if (!value || typeof value !== "object" || value.resolved !== true) return null;
  return {
    resolved: true,
    decisionId: clean(value?.decisionId, 160) || null,
    proposition: clean(value?.proposition, 500) || null,
    outcomeDirection: clean(value?.outcomeDirection, 40) || null,
    confidence: finiteOrNull(value?.confidence),
    lesson: clean(value?.outcome?.lesson, 700) || null,
    summary: clean(value?.outcome?.summary, 700) || null,
    source: clean(value?.source, 120) || null
  };
}

function compactJudgment(workspace = null) {
  const judgment = workspace?.judgment;
  if (!judgment || typeof judgment !== "object") return null;
  return {
    requested: Boolean(judgment?.requested),
    constitutionVersion: clean(judgment?.constitutionVersion, 60),
    priorStances: (Array.isArray(judgment?.priorStances) ? judgment.priorStances : [])
      .slice(0, 3)
      .map((item) => ({
        topic: clean(item?.topic, 120),
        conclusion: clean(item?.conclusion, 320),
        confidence: finiteOrNull(item?.confidence)
      }))
  };
}

function extractOutputText(data = {}) {
  const parts = [];
  for (const item of Array.isArray(data?.output) ? data.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (content?.type === "output_text" && typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

function parseJson(value = "") {
  const text = clean(value, 16000);
  if (!text) return null;
  try { return JSON.parse(text); }
  catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }
}

function compactRoute(route = {}) {
  return {
    training: Boolean(route?.training),
    nutrition: Boolean(route?.nutrition),
    goals: Boolean(route?.goals),
    health: Boolean(route?.health),
    social: Boolean(route?.social),
    memory: Boolean(route?.memory),
    currentInfo: Boolean(route?.currentInfo),
    developer: Boolean(route?.developer),
    followUp: Boolean(route?.followUp),
    complexity: clean(route?.complexity, 30)
  };
}

function providerSummary(data = {}, fallbackModel = null) {
  return {
    id: clean(data?.id, 200) || null,
    model: clean(data?.model, 120) || clean(fallbackModel, 120) || null,
    usage: data?.usage && typeof data.usage === "object" ? data.usage : null
  };
}

function resolveTeacherEffort(value = "") {
  const normalized = clean(value, 30).toLowerCase();
  return ["low", "medium", "high"].includes(normalized) ? normalized : "high";
}

function supportsReasoning(model = "") {
  return /^(?:gpt-(?:5|6)|o[0-9])/i.test(String(model || ""));
}

function compactArray(values, limit, max) {
  return (Array.isArray(values) ? values : [])
    .map((item) => clean(item, max))
    .filter(Boolean)
    .slice(0, limit);
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
