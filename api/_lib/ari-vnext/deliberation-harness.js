// ARI vNext — deterministic deliberation harness.
// Coordinates existing reasoning, Cortex, council, continuity, and verification
// signals without making an additional model call.

export const ARI_DELIBERATION_HARNESS_VERSION = "1.2.0";

export function deriveDeliberationHarness({
  turn = {},
  route = {},
  safety = {},
  modelPolicy = null,
  companionState = null,
  metacognition = null,
  relationshipContinuity = null,
  instinctKernel = null
} = {}) {
  const message = clean(turn?.message, 8000);
  const demandBand = clean(modelPolicy?.reasoningDemand?.band, 30) || fallbackBand(route);
  const highStakes = safety?.highStakes === true;
  const casual = route?.casualConversation === true;
  const requirementUpdate = detectsRequirementUpdate(message);
  const sideQuestion = detectsSideQuestion(message);
  const ambiguous = detectsMaterialAmbiguity(message);
  const priorFailure = hasPriorFailure(modelPolicy?.reasoningDemand?.reasons);
  const executionSession = currentExecutionSession(turn);
  const failedAttemptCount = Array.isArray(executionSession?.failedAttempts)
    ? executionSession.failedAttempts.length
    : 0;
  const repeatedExecutionFailure = failedAttemptCount >= 2;
  const hypothesisCollapseRequired = Boolean(route?.developer === true && repeatedExecutionFailure);
  const cortexNeeds = metacognition?.cortex?.needs || {};
  const instinct = instinctKernel?.modulation?.deliberation || {};
  const signal = metacognition?.cognitiveSignals?.directives || {};
  const simplicityPressure = Number(instinct?.simplicityPressure || 0);
  const explorationPressure = Number(instinct?.explorationPressure || 0);

  const tier = casual
    ? "direct"
    : highStakes || demandBand === "critical"
      ? "adversarial_verify"
      : demandBand === "high" || route?.complexity === "deep"
        ? "structured"
        : demandBand === "medium"
          ? "focused"
          : "direct";

  const baseCandidatePasses =
    tier === "adversarial_verify" ? 3 :
    tier === "structured" ? 2 : 1;
  const candidatePasses =
    signal.conserveCompute === true && tier !== "adversarial_verify" ? 1 :
    signal.considerAlternative === true && tier !== "direct" ? Math.max(2, baseCandidatePasses) :
    tier !== "adversarial_verify" &&
    simplicityPressure >= 0.78 &&
    explorationPressure < 0.72
      ? 1
      : baseCandidatePasses;

  const countercase = Boolean(
    tier === "adversarial_verify" ||
    tier === "structured" ||
    cortexNeeds?.countercase === true
  );
  const verificationGate = Boolean(
    signal.verifyEvidence === true ||
    highStakes ||
    tier === "adversarial_verify" ||
    (route?.developer === true && route?.complexity === "deep") ||
    route?.currentInfo === true ||
    cortexNeeds?.verification === true ||
    instinct?.verificationGate === true
  );
  const failureModeReview = Boolean(
    highStakes ||
    route?.developer === true ||
    tier === "adversarial_verify" ||
    instinct?.verificationGate === true
  );

  return {
    version: ARI_DELIBERATION_HARNESS_VERSION,
    tier,
    demandBand,
    providerExecution: {
      reasoningMode: clean(modelPolicy?.reasoningMode, 20) || "standard",
      reasoningEffort: clean(modelPolicy?.reasoningEffort, 20) || null,
      reasoningContext: clean(modelPolicy?.reasoningContext, 30) || "current_turn",
      persistedReasoning: modelPolicy?.persistReasoning === true
    },
    taskContract: {
      preservePrimaryObjective: true,
      preserveExplicitConstraints: true,
      requirementUpdateDetected: requirementUpdate,
      applyScopedUpdatesWithoutLosingUnchangedRequirements: true,
      sideQuestionDetected: sideQuestion,
      answerSideQuestionsWithoutAbandoningMainTask: true,
      fillRoutineGapsFromContext: true,
      ambiguityDetected: ambiguous,
      askOnlyWhenAmbiguityCouldMateriallyChangeOutcome: true,
      currentCorrectionWins: companionState?.repair?.active === true
    },
    deliberation: {
      candidatePasses,
      countercase,
      verificationGate,
      failureModeReview,
      reconcileToolEvidenceBeforeClaimingSuccess: true,
      distinguishObservedFromInferred: true,
      changeMethodAfterRepeatedFailure:
        repeatedExecutionFailure ||
        priorFailure ||
        instinct?.changeMethod === true ||
        signal.changeMethod === true,
      preserveUsefulPartialWorkAcrossCorrections: true,
      stopRule: verificationGate ? "verified_or_materially_blocked" : "sufficiently_supported"
    },
    hypothesisCollapseProtocol: {
      active: hypothesisCollapseRequired,
      triggerFailedAttempts: 2,
      failedAttemptCount,
      returnToOriginalFailure: true,
      auditAssumptionsVsFacts: true,
      identifyKnownGoodContracts: true,
      compareAgainstKnownGoodBaseline: true,
      separateConflatedStateOrApiConcepts: true,
      classifyTestFailuresByCausalRelevance: true,
      decideRepairVsRebuild: true,
      patchOnlyAfterReset: true
    },
    instinctPressure: {
      dominant: clean(instinctKernel?.dominant?.id, 80) || null,
      verificationGate: instinct?.verificationGate === true,
      changeMethod: instinct?.changeMethod === true,
      simplicityPressure: Number(simplicityPressure.toFixed(3)),
      explorationPressure: Number(explorationPressure.toFixed(3))
    },
    continuity: {
      relevantUnfinishedThread: companionState?.continuity?.relevantThread || null,
      recognizedUser: relationshipContinuity?.recognizedUser === true,
      doNotForceCallback: true
    },
    escalation: {
      cortexEligible: Boolean(
        cortexNeeds?.hypotheses ||
        cortexNeeds?.countercase ||
        cortexNeeds?.verification ||
        cortexNeeds?.priorJudgmentCheck
      ),
      councilWorthConsidering: Boolean(
        !casual &&
        (tier === "adversarial_verify" || (tier === "structured" && route?.developer === true))
      ),
      modelEscalationRemainsGovernedByCostRouter: true
    },
    safeguards: {
      hiddenChainOfThoughtExposed: false,
      hiddenChainOfThoughtPersistedByHarness: false,
      noExtraModelCall: true,
      noPermissionExpansion: true,
      noSuccessClaimWithoutEvidence: true,
      failedTestRequiresCausalInterpretationBeforeProductionChange: true
    }
  };
}

export function deliberationHarnessToInstruction(state = null) {
  if (!state) return "";
  const contract = state.taskContract || {};
  const d = state.deliberation || {};
  const collapse = state.hypothesisCollapseProtocol || {};
  const provider = state.providerExecution || {};

  return [
    "ARI DELIBERATION HARNESS v1",
    `Tier: ${state.tier || "direct"}; demand=${state.demandBand || "low"}; provider reasoning=${provider.reasoningMode || "standard"}/${provider.reasoningEffort || "default"}; context=${provider.reasoningContext || "current_turn"}.`,
    state?.instinctPressure?.dominant
      ? `Pre-deliberative pressure: dominant=${state.instinctPressure.dominant}; verification=${state.instinctPressure.verificationGate ? "on" : "normal"}; simplicity=${state.instinctPressure.simplicityPressure}; exploration=${state.instinctPressure.explorationPressure}.`
      : "",
    "Maintain a compact task contract: primary objective, explicit constraints, success criteria, and unresolved blockers. New requirements update only the affected parts unless the user clearly replaces the task.",
    contract.requirementUpdateDetected
      ? "A requirement update is present. Apply it explicitly and preserve all non-conflicting earlier requirements."
      : "",
    contract.sideQuestionDetected
      ? "A side question may be present. Answer it without losing the broader task or silently abandoning pending requirements."
      : "",
    "Fill routine gaps from reliable context. Ask one focused question only when the missing fact could materially change the outcome; do not ask for information already available in context or tools.",
    d.candidatePasses >= 2
      ? `For difficult work, consider up to ${d.candidatePasses} materially different approaches internally, then choose based on evidence, constraints, reversibility, and likely failure modes. Do not expose hidden reasoning traces.`
      : "Use the simplest sufficient approach; do not create artificial alternatives for routine work.",
    d.countercase
      ? "Before committing, test the leading answer against the strongest credible countercase that could actually change the result. Do not manufacture false balance."
      : "",
    d.failureModeReview
      ? "Check plausible failure modes and dependency assumptions before recommending or executing consequential technical steps."
      : "",
    d.verificationGate
      ? "Verification gate: separate proposed, executed, observed, and verified. Reconcile tool output and contradictory evidence before claiming success."
      : "Do not over-verify routine low-consequence work.",
    "A failing test is evidence that the assertion failed; it is not automatic proof that the proposed fix is wrong. Establish the causal relationship to the user-visible failure before changing production code to satisfy the test.",
    collapse.active
      ? `HYPOTHESIS COLLAPSE PROTOCOL REQUIRED: ${collapse.failedAttemptCount} attempts have failed. Before another production patch, stop extending the current theory. Return to the original user-visible failure; perform a compact facts-vs-assumptions audit; identify known-good contracts and invariants; compare against a known-good baseline such as clean main; separate concepts that may have been conflated into the same state or API; classify each failing test as causally relevant, stale, or verification noise; then decide whether to repair the current branch or rebuild from a known-good base. Only after that reset should you choose the next patch. Preserve concise conclusions and evidence, not hidden chain-of-thought.`
      : "",
    !collapse.active && d.changeMethodAfterRepeatedFailure
      ? "A prior method appears to have failed or retried. Change the method or discriminating test instead of repeating the same attempt."
      : "",
    "Preserve useful completed work when requirements change. Revise only the affected branch of the solution.",
    "Return the conclusion, concise rationale, material uncertainty, and observable evidence. Never reveal hidden chain-of-thought."
  ].filter(Boolean).join("\n").slice(0, 4600);
}

function currentExecutionSession(turn = {}) {
  const workspace = turn?.context?.userWorldModel?.ariCognitiveWorkspace?.executionWorkspace;
  if (!workspace || typeof workspace !== "object" || Array.isArray(workspace)) return null;
  const value = workspace?.active === true && workspace?.session && typeof workspace.session === "object"
    ? workspace.session
    : workspace;
  if (!["active", "waiting", "blocked"].includes(String(value?.status || "").toLowerCase())) return null;
  return value;
}

function detectsRequirementUpdate(message = "") {
  return /\b(?:actually|instead|change that|change it|new requirement|also need|but keep|keep the|remove the|don't|do not|make sure|from now on|rather than)\b/i.test(message);
}
function detectsSideQuestion(message = "") {
  const q = (message.match(/\?/g) || []).length;
  return q >= 2 || /\b(?:also|by the way|separately|one more thing|while you're at it)\b/i.test(message);
}
function detectsMaterialAmbiguity(message = "") {
  const text = clean(message, 2000).toLowerCase();
  if (!text || text.length < 4) return false;
  return /\b(?:that one|the thing|it there|do that|make it|fix it|same one|the other one)\b/.test(text) &&
    !/\b(?:this|above|earlier|previous|last)\b/.test(text);
}
function hasPriorFailure(reasons = []) {
  return (Array.isArray(reasons) ? reasons : []).some((item) =>
    /previous.*fail|retry|tool.*fail|prior.*fail/i.test(clean(item, 160))
  );
}
function fallbackBand(route = {}) {
  if (route?.complexity === "deep") return "high";
  if (route?.complexity === "standard") return "medium";
  return "low";
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
