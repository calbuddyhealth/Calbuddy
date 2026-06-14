// ari/observer-system/ari-observer-hierarchy-engine.js
// Ari Observer Hierarchy Engine
// Purpose: Decide which observation deserves the microphone.
// V1.5
// Fixes:
// - Unknown / placeholder signals cannot win primary observation.
// - Adds knowns vs unknowns separation.
// - Adds strong human need/body/safety candidates.
// - Prevents unclear_chapter, unclear_regret, unclear_path, general-priority, etc. from becoming primary.
// - Keeps unknowns available for curiosity/debug without allowing them to lead action.

window.Ari = window.Ari || {};

window.Ari.observerHierarchyEngine = {
  version: "1.5.0",

  placeholderSignals: new Set([
  "unclear",
  "unknown",
  "none",
  "none_detected",
  "general",
  "general-priority",
  "general_understanding",
  "unclear_chapter",
  "unclear_regret",
  "unclear_path",
  "continue_observing",
  "prioritize_with_caution",
  "chosen_sacrifice",
  "the other meaningful priority"
]),

    normalizeSignal(value = "") {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ");
  },

  isRealSignal(value) {
    if (value === null || value === undefined) return false;

    const text = this.normalizeSignal(value);
    if (!text) return false;

    return !this.placeholderSignals.has(text) &&
      !this.placeholderSignals.has(text.replace(/\s+/g, "_")) &&
      !this.placeholderSignals.has(text.replace(/\s+/g, "-"));
  },

  isPlaceholderSignal(value) {
    if (value === null || value === undefined) return true;

    const text = this.normalizeSignal(value);
    if (!text) return true;

    return this.placeholderSignals.has(text) ||
      this.placeholderSignals.has(text.replace(/\s+/g, "_")) ||
      this.placeholderSignals.has(text.replace(/\s+/g, "-"));
  },

  analyze(observation = {}) {
    const dual = observation.dualSalience || {};
    const conversation = observation.conversation || {};
    const emotion = observation.emotion || {};
    const goals = observation.goals || {};
    const lifeTransitions = observation.lifeTransitions || {};
    const humanPatterns = observation.humanPatterns || {};
    const valuesAndConflicts = observation.valuesAndConflicts || {};
    const risk = observation.risk || {};
    const summary = observation.summary || observation || {};
const observationLedger =
  summary.observationLedger ||
  summary.rankedLedgerObservations ||
  observation.observationLedger ||
  observation.rankedLedgerObservations ||
  [];

   const candidateBundle = this.buildCandidates({
  dual,
  conversation,
  emotion,
  goals,
  lifeTransitions,
  humanPatterns,
  valuesAndConflicts,
  risk,
  summary,
  observationLedger
});

    const knowns = this.rankCandidates(candidateBundle.knowns || []);
    const unknowns = this.rankCandidates(candidateBundle.unknowns || []);

    const primary =
      knowns[0] ||
      this.defaultCandidate();

    const detectedLifeChapter =
      this.detectLifeChapter(lifeTransitions, humanPatterns) ||
      (this.isRealSignal(summary.primaryLifeChapter)
        ? summary.primaryLifeChapter
        : null) ||
      (primary.category === "life_chapter" && this.isRealSignal(primary.name)
        ? primary.name
        : null);

    const detectedTension =
      this.detectDominantTension(valuesAndConflicts, humanPatterns) ||
      (this.isRealSignal(summary.wisdomTension)
        ? summary.wisdomTension
        : null) ||
      (this.isRealSignal(summary.apparentConflict)
        ? summary.apparentConflict
        : null) ||
      (this.isRealSignal(summary.primaryConflict)
        ? summary.primaryConflict
        : null);

    return {
      system: "ari-observer-hierarchy-engine",
      version: this.version,

ledgerAvailable:
  Array.isArray(observationLedger),

ledgerCount:
  observationLedger.length || 0,

ledgerPrimary:
  observationLedger[0]?.signal || null,

ledgerPrimaryCategory:
  observationLedger[0]?.category || null,

      primaryObservation: primary.name,
      primaryCategory: primary.category,
      primaryReason: primary.reason,
      primaryConfidence: primary.confidence,

      supportingObservations: knowns
        .filter((item, index) => index > 0)
        .slice(0, 5),

      knownObservations: knowns,
      unknownObservations: unknowns,

      dominantTension: detectedTension,
      lifeChapter: detectedLifeChapter,

      objectiveLead:
        dual.priority?.objectiveLead ||
        summary.dualSalienceObjectiveLead ||
        null,

      subjectiveLead:
        dual.priority?.subjectiveLead ||
        summary.dualSalienceSubjectiveLead ||
        null,

      dualSalienceMode:
        dual.priority?.mode ||
        summary.dualSalienceMode ||
        null,

      recommendedExecutiveInstruction:
        this.recommendExecutiveInstruction(primary, dual, risk, summary),

      shouldAskClarifyingQuestion:
        this.shouldAskClarifyingQuestion(primary, dual, conversation, {
          lifeTransitions,
          humanPatterns,
          valuesAndConflicts,
          summary,
          knowns,
          unknowns
        }),

      recommendedQuestion:
        this.recommendedQuestion(primary, dual, summary, unknowns),

      rankedObservations: knowns,
      rankedUnknowns: unknowns
    };
  },

  buildCandidates(parts = {}) {
    const {
  dual,
  conversation,
  emotion,
  goals,
  lifeTransitions,
  humanPatterns,
  valuesAndConflicts,
  risk,
  summary = {},
  observationLedger = []
} = parts;

    const knowns = [];
    const unknowns = [];

    const addKnown = (candidate) => {
      if (!candidate || !candidate.name) return;

      if (this.isPlaceholderSignal(candidate.name)) {
        this.addUnknownFromPlaceholder(unknowns, candidate);
        return;
      }

      knowns.push(candidate);
    };

    const addUnknown = (candidate) => {
      if (!candidate || !candidate.name) return;
      unknowns.push(candidate);
    };

    // ===================================
    // OBSERVATION LEDGER
    // Direct observations get first authority.
    // This prevents late-stage meaning/life systems from hijacking
    // direct user intent such as teaching, coding, body, or relationship requests.
    // ===================================

    if (Array.isArray(observationLedger) && observationLedger.length) {
      observationLedger.forEach((entry) => {
        if (!entry || !entry.signal) return;

        const isDirect =
          entry.observationType === "direct_text" ||
          entry.observationType === "direct_request";

        const isHypothesis =
          entry.observationType === "hypothesis";

        const baseWeight =
          entry.category === "safety" ? 105 :
          entry.category === "body" ? 102 :
          entry.category === "intent" ? 100 :
          entry.category === "request" ? 98 :
          entry.category === "relationship" ? 94 :
          entry.category === "life_transition" ? 90 :
          entry.category === "identity" ? 86 :
          entry.category === "planning" ? 84 :
          entry.category === "wisdom_tension" ? 76 :
          70;

        const directBoost = isDirect ? 10 : 0;

const directAuthorityBoost =
  isDirect && ["safety", "body", "intent", "request", "relationship"].includes(entry.category)
    ? 20
    : 0;
        
        const hypothesisPenalty = isHypothesis ? -20 : 0;

        addKnown({
          name: entry.signal,
          category: entry.category || "observation",
          observationType: entry.observationType || "unknown",
          weight: Math.max(40, baseWeight + directBoost + directAuthorityBoost + hypothesisPenalty),
          confidence: Math.min(
            0.99,
            Math.max(0.45, Number(entry.confidence || 70) / 100)
          ),
          reason:
            entry.reason ||
            entry.evidence?.join(" ") ||
            "Observation Ledger identified this as an important direct signal.",
          ledgerEntry: entry
        });
      });
    }

    // ===================================
    // UNKNOWN / PLACEHOLDER TRACKING
    // ===================================

    if (this.isPlaceholderSignal(summary.primaryLifeChapter)) {
      addUnknown({
        name: "life_chapter_unclear",
        category: "unknown",
        weight: 45,
        confidence: 0.7,
        reason: "Life chapter is not clear enough to lead."
      });
    }

    if (this.isPlaceholderSignal(summary.wisdomTension)) {
      addUnknown({
        name: "wisdom_tension_unclear",
        category: "unknown",
        weight: 44,
        confidence: 0.7,
        reason: "Wisdom tension is not clear enough to lead."
      });
    }

    if (this.isPlaceholderSignal(summary.regretType)) {
      addUnknown({
        name: "regret_unclear",
        category: "unknown",
        weight: 42,
        confidence: 0.65,
        reason: "Regret pattern is not clear enough to lead."
      });
    }

    if (this.isPlaceholderSignal(summary.longTermPath)) {
      addUnknown({
        name: "long_term_path_unclear",
        category: "unknown",
        weight: 42,
        confidence: 0.65,
        reason: "Long-term consequence path is not clear enough to lead."
      });
    }

    if (
      summary.underlyingEmotion === "unclear" ||
      summary.underlyingEmotionDepth === null ||
      summary.underlyingEmotionDepth === "unclear"
    ) {
      addUnknown({
        name: "underlying_emotion_unclear",
        category: "unknown",
        weight: 40,
        confidence: 0.65,
        reason: "Underlying emotion is not clear enough to lead."
      });
    }

    if (
      !summary.hypothesis ||
      summary.evidenceStrength === "none" ||
      summary.calibratedConfidence === "unknown"
    ) {
      addUnknown({
        name: "hypothesis_or_evidence_unclear",
        category: "unknown",
        weight: 40,
        confidence: 0.65,
        reason: "Ari does not have a grounded hypothesis yet."
      });
    }

    // ===================================
    // SAFETY / BODY / HUMAN NEEDS
    // Highest practical priority when strong.
    // ===================================

    if (
      risk.guardianRequired ||
      dual.priority?.lead === "safety" ||
      summary.safetyTriggered ||
      summary.executiveDecision === "protect_safety_first"
    ) {
      addKnown({
        name: "safety_or_urgent_risk",
        category: "safety",
        weight: 100,
        confidence: 0.98,
        reason: "Safety risk overrides all other observations."
      });
    }

const directTeachingActive =

  summary.responseIntent === "teach_clearly" ||

  summary.domainLead === "knowledge_teaching_domain" ||

  summary.domainMode === "teach_clearly" ||

  summary.shouldPreferTeaching === true;

if (directTeachingActive) {

  addKnown({

    name: "teaching_request",

    category: "intent",

    weight: 110,

    confidence: 0.98,

    reason: "Direct teaching intent is active, so observer should recognize teaching as the primary observation."

  });

}

    const primaryNeed = summary.primaryHumanNeed || null;
    const primaryNeedScore = Number(summary.primaryHumanNeedScore || 0);

    if (primaryNeed && primaryNeedScore >= 85) {
      addKnown({
        name: `${primaryNeed}_need`,
        category: "human_need",
        weight: this.weightHumanNeed(primaryNeed, primaryNeedScore),
        confidence: Math.min(0.98, Math.max(0.75, primaryNeedScore / 100)),
        reason: `Strong human need '${primaryNeed}' detected.`
      });
    }

    if (
      primaryNeed === "body" ||
      summary.needResponseMode === "stabilize_body_first" ||
      summary.salienceLeadOrgan === "safety" ||
      summary.salienceMode === "stabilize_body_first"
    ) {
      addKnown({
        name: "body_stability",
        category: "body",
        weight: 99,
        confidence: 0.96,
        reason: "Body stability appears to be the immediate priority."
      });
    }

    if (
      (summary.dualSalienceObjective?.physical_health || 0) >= 80 ||
      summary.dualSalienceObjectiveLead === "physical_health" ||
      dual.priority?.objectiveLead === "physical_health"
    ) {
      addKnown({
        name: "physical_health",
        category: "health",
        weight: 96,
        confidence: 0.92,
        reason: "Physical health has high objective importance."
      });
    }

    if (
      (summary.dualSalienceSubjective?.body_focus || 0) >= 75 ||
      summary.dualSalienceSubjectiveLead === "body_focus" ||
      dual.priority?.subjectiveLead === "body_focus"
    ) {
      addKnown({
        name: "body_focus",
        category: "subjective_salience",
        weight: 90,
        confidence: 0.9,
        reason: "The user's attention is strongly focused on body state."
      });
    }

    // ===================================
    // LATE-STAGE SUMMARY SIGNALS
    // Only real signals may become known candidates.
    // ===================================

    if (this.isRealSignal(summary.primaryLifeChapter)) {
      addKnown({
        name: summary.primaryLifeChapter,
        category: "life_chapter",
        weight: 98,
        confidence: 0.96,
        reason: "Later systems identified a dominant life chapter."
      });
    }

    if (this.isRealSignal(summary.primaryWeightedLifeSignal)) {
      addKnown({
        name: summary.primaryWeightedLifeSignal,
        category: "life_priority",
        weight: 97,
        confidence: 0.95,
        reason: "Life signal weighting identified a major life priority."
      });
    }

    if (this.isRealSignal(summary.primarySalienceName)) {
      addKnown({
        name: summary.primarySalienceName,
        category: summary.primarySalienceCategory || "salience",
        weight: 96,
        confidence: 0.94,
        reason: "Salience network identified the dominant signal."
      });
    }

    if (this.isRealSignal(summary.strongestSignal)) {
      addKnown({
        name: summary.strongestSignal,
        category: summary.strongestSignalCategory || "signal",
        weight: 94,
        confidence:
          summary.strongestSignalCategory === "life" ? 0.94 : 0.86,
        reason: "Signal system identified the strongest active signal."
      });
    }

    if (this.isRealSignal(summary.wisdomTension)) {
      addKnown({
        name: summary.wisdomTension,
        category: "core_conflict",
        weight: 92,
        confidence: 0.92,
        reason: "Wisdom systems detected a major tension."
      });
    }

    if (
  summary.valueIntegrationDetected === true &&
  this.isRealSignal(summary.apparentConflict)
) {
  addKnown({
    name: summary.apparentConflict,
    category: "core_conflict",
    weight: 91,
    confidence: 0.9,
    reason: "Value integration detected a real apparent conflict."
  });
}

    if (this.isRealSignal(summary.highestGood)) {
      addKnown({
        name: summary.highestGood,
        category: "highest_good",
        weight: 90,
        confidence: 0.9,
        reason: "Highest good signal detected."
      });
    }

    if (this.isRealSignal(summary.executiveDecision)) {
      addKnown({
        name: summary.executiveDecision,
        category: "executive_decision",
        weight: this.weightExecutiveDecision(summary.executiveDecision),
        confidence: 0.9,
        reason: "Executive function selected a non-placeholder decision."
      });
    }

    if (this.isRealSignal(summary.primaryPriority)) {
      addKnown({
        name: `${summary.primaryPriority}_priority`,
        category: "executive_priority",
        weight: this.weightPriority(summary.primaryPriority),
        confidence: 0.88,
        reason: "Executive priority is clear enough to inform hierarchy."
      });
    }

    if (this.isRealSignal(summary.regretType)) {
      addKnown({
        name: summary.regretType,
        category: "long_term_consequence",
        weight: 88,
        confidence: 0.88,
        reason: "Regret engine identified a preventable regret."
      });
    }

    if (this.isRealSignal(summary.longTermPath)) {
      addKnown({
        name: summary.longTermPath,
        category: "long_term_path",
        weight: 86,
        confidence: 0.86,
        reason: "Long-term consequence engine identified a path."
      });
    }

    const chapter = this.detectLifeChapter(lifeTransitions, humanPatterns);

    if (this.isRealSignal(chapter)) {
      addKnown({
        name: chapter,
        category: "life_chapter",
        weight: 90,
        confidence: 0.86,
        reason: "The message belongs to a larger life transition."
      });
    }

    if (valuesAndConflicts.coreConflicts?.length) {
      valuesAndConflicts.coreConflicts.forEach((conflict) => {
        if (this.isRealSignal(conflict)) {
          addKnown({
            name: conflict,
            category: "core_conflict",
            weight: 86,
            confidence: 0.82,
            reason: "A core value conflict is present."
          });
        }
      });
    }

    if (humanPatterns.futureRegretRisk) {
      addKnown({
        name: "future_regret_risk",
        category: "long_term_consequence",
        weight: 84,
        confidence: 0.8,
        reason: "The decision may create future regret if mishandled."
      });
    }

    if (humanPatterns.opportunityCost) {
      addKnown({
        name: "opportunity_cost",
        category: "tradeoff",
        weight: 80,
        confidence: 0.78,
        reason: "One important good may require sacrificing another."
      });
    }

    if (humanPatterns.burnoutRisk) {
      addKnown({
        name: "burnout_risk",
        category: "capacity",
        weight: 78,
        confidence: 0.78,
        reason: "The person may be exceeding their current capacity."
      });
    }

    if (emotion.hasEmotionalPain) {
      addKnown({
        name: "emotional_pain",
        category: "emotion",
        weight: 74,
        confidence: 0.74,
        reason: "The person is carrying emotional distress."
      });
    }

    if (goals.wantsPlan) {
      addKnown({
        name: "needs_plan_or_priority",
        category: "planning",
        weight: 70,
        confidence: 0.72,
        reason: "The person is asking for structure or prioritization."
      });
    }

    if (dual.priority?.lead) {
      addKnown({
        name: `dual_salience_${dual.priority.lead}`,
        category: "dual_salience",
        weight: this.weightDualSalience(dual.priority.lead),
        confidence: dual.clarity?.confidence || 0.75,
        reason: dual.priority.reason || "Dual salience identified the main response pathway."
      });
    }

    if (conversation.hasDirectRequest) {
      addKnown({
        name: "direct_request",
        category: "request",
        weight: 62,
        confidence: 0.7,
        reason: "The user directly asked for help."
      });
    }

    return {
      knowns: this.dedupeCandidates(knowns),
      unknowns: this.dedupeCandidates(unknowns)
    };
  },

  addUnknownFromPlaceholder(unknowns = [], candidate = {}) {
    unknowns.push({
      name: `${candidate.name}_placeholder`,
      category: "unknown",
      weight: Math.min(candidate.weight || 40, 45),
      confidence: Math.min(candidate.confidence || 0.65, 0.75),
      reason:
        candidate.reason ||
        "Placeholder signal detected. It may shape curiosity but cannot lead."
    });
  },

  dedupeCandidates(candidates = []) {
    const map = new Map();

    candidates.forEach((candidate) => {
      const key = `${candidate.category}:${candidate.name}`;
      const existing = map.get(key);
      const candidateScore = candidate.weight * candidate.confidence;
      const existingScore = existing
        ? existing.weight * existing.confidence
        : -Infinity;

      if (!existing || candidateScore > existingScore) {
        map.set(key, candidate);
      }
    });

    return Array.from(map.values());
  },

  rankCandidates(candidates = []) {
    return candidates
      .map((item) => ({
        ...item,
        score: Math.round(item.weight * item.confidence)
      }))
      .sort((a, b) => b.score - a.score);
  },

  weightHumanNeed(need, score = 0) {
    const weights = {
      security: 100,
      body: 99,
      health: 98,
      safety: 100,
      connection: 88,
      belonging: 86,
      identity: 84,
      worth: 86,
      esteem: 84,
      understanding: 72
    };

    return weights[need] || Math.min(90, Math.max(70, score));
  },

  weightExecutiveDecision(decision) {
    const weights = {
      protect_safety_first: 100,
      stabilize_body_first: 99,
      protect_family_first: 93,
      reduce_load_immediately: 90,
      bridge_before_advising: 86,
      follow_subjective_salience_first: 84,
      create_priority_structure: 82,
      name_conflict_and_choose_lead: 82,
      frame_as_life_chapter: 82
    };

    return weights[decision] || 78;
  },

  weightPriority(priority) {
    const weights = {
      safety: 100,
      body: 99,
      "health-stabilization": 98,
      family: 92,
      "capacity-protection": 90,
      planning: 80,
      "bridge-objective-and-subjective": 84,
      "follow-human-attention": 82
    };

    return weights[priority] || 76;
  },

  weightDualSalience(lead) {
    const weights = {
      safety: 100,
      integrated: 84,
      bridge: 82,
      subjective_salience: 78,
      balanced: 50
    };

    return weights[lead] || 55;
  },

  detectDominantTension(valuesAndConflicts = {}, humanPatterns = {}) {
    if (valuesAndConflicts.coreConflicts?.length) {
      const realConflict = valuesAndConflicts.coreConflicts.find((item) =>
        this.isRealSignal(item)
      );

      if (realConflict) return realConflict;
    }

    if (humanPatterns.roleConflict) return "role_conflict";
    if (humanPatterns.opportunityCost) return "opportunity_cost";
    if (humanPatterns.purposeConflict) return "purpose_conflict";

    return null;
  },

  detectLifeChapter(lifeTransitions = {}, humanPatterns = {}) {
    if (lifeTransitions.fatherhood) return "fatherhood_transition";
    if (lifeTransitions.motherhood) return "motherhood_transition";
    if (lifeTransitions.pregnancy) return "pregnancy_transition";
    if (lifeTransitions.engagement) return "engagement_and_wedding_transition";
    if (lifeTransitions.marriage) return "marriage_transition";
    if (lifeTransitions.militaryTransition) return "military_to_civilian_transition";
    if (lifeTransitions.careerTransition) return "career_transition";

    if (humanPatterns.roles?.includes("builder")) {
      return "builder_founder_transition";
    }

    return null;
  },

  recommendExecutiveInstruction(primary, dual = {}, risk = {}, summary = {}) {
    if (risk.guardianRequired || primary.category === "safety") {
      return "Lead with safety, stabilization, and urgent support.";
    }

    if (
      primary.category === "body" ||
      primary.category === "health" ||
      primary.name === "body_need" ||
      primary.name === "body_stability" ||
      summary.needResponseMode === "stabilize_body_first" ||
      summary.salienceMode === "stabilize_body_first"
    ) {
      return "Stabilize body before interpretation.";
    }

    if (primary.category === "human_need") {
      return "Respond to the strongest human need first.";
    }

    if (
      primary.category === "executive_priority" ||
      primary.category === "executive_decision"
    ) {
      return "Follow the executive priority and protect the leading good.";
    }

    if (
      primary.category === "life_chapter" ||
      primary.category === "life_priority"
    ) {
      return "Frame the issue as part of a larger life chapter.";
    }

    if (primary.category === "core_conflict") {
      return "Name the conflict clearly and help the user choose what must lead.";
    }

    if (dual.priority?.mode === "acknowledge_gap_then_gently_redirect") {
      return "Bridge subjective attention toward the objective need without bulldozing the user.";
    }

    if (dual.priority?.mode === "follow_user_attention_first") {
      return "Start with the user’s emotional focus before advice.";
    }

    if (dual.priority?.mode === "validate_then_act") {
      return "Validate first, then provide one concrete next step.";
    }

    if (primary.category === "planning") {
      return "Give structure, priority, and next action.";
    }

    return "Respond to the strongest known observation with one clear next step.";
  },

  shouldAskClarifyingQuestion(primary, dual = {}, conversation = {}, context = {}) {
    if (primary.category === "safety") return false;

    const {
      lifeTransitions = {},
      humanPatterns = {},
      valuesAndConflicts = {},
      summary = {},
      knowns = []
    } = context;

    const resolvedEnough =
      summary.uncertaintyType === "resolved_enough" ||
      summary.uncertaintyType === "human_need_leads" ||
      summary.shouldSuppressUncertainty === true ||
      summary.calibratedConfidence === "high" ||
      summary.metaConfidence === "high" ||
      Number(summary.confidenceScore || 0) >= 75;

    const strongKnownActive =
      knowns.length > 0 &&
      (knowns[0]?.score || knowns[0]?.weight || 0) >= 70;

    const strongChapterActive =
      (
        primary.category === "life_chapter" ||
        primary.category === "life_priority" ||
        this.isRealSignal(summary.primaryLifeChapter) ||
        this.isRealSignal(this.detectLifeChapter(lifeTransitions, humanPatterns))
      );

    const strongConflictActive =
      primary.category === "core_conflict" ||
      this.isRealSignal(summary.wisdomTension) ||
      this.isRealSignal(summary.apparentConflict) ||
      valuesAndConflicts.coreConflicts?.some((item) => this.isRealSignal(item)) ||
      humanPatterns.futureRegretRisk ||
      humanPatterns.opportunityCost;

    const executiveClear =
      this.isRealSignal(summary.executiveDecision) &&
      summary.executiveDecision !== "ask_before_directing";

    if (
      resolvedEnough ||
      strongKnownActive ||
      strongChapterActive ||
      strongConflictActive ||
      executiveClear
    ) {
      return false;
    }

    if (dual.clarity?.action === "ask_one_clarifying_question") {
      return true;
    }

    if ((primary.confidence || 0) < 0.6) {
      return true;
    }

    if (!conversation.hasQuestion && !conversation.hasDirectRequest) {
      return true;
    }

    return false;
  },

  recommendedQuestion(primary, dual = {}, summary = {}, unknowns = []) {
    if (
      primary.category === "body" ||
      primary.category === "health" ||
      primary.name === "body_need" ||
      primary.name === "body_stability" ||
      summary.needResponseMode === "stabilize_body_first"
    ) {
      return "What does your body need first right now?";
    }

    if (summary.primaryLifeChapter === "fatherhood_transition") {
      return "What kind of father does this season ask you to become?";
    }

    if (summary.identityRecoveryQuestion && primary.category !== "body") {
      return summary.identityRecoveryQuestion;
    }

    if (
      summary.lifeChapterQuestion &&
      primary.category !== "body" &&
      primary.category !== "health" &&
      this.isRealSignal(summary.primaryLifeChapter)
    ) {
      return summary.lifeChapterQuestion;
    }

    if (primary.category === "core_conflict") {
      return "Which part of this feels hardest to sacrifice?";
    }

    if (
      primary.category === "life_chapter" ||
      primary.category === "life_priority"
    ) {
      return "What kind of person is this season asking you to become?";
    }

    if (dual.priority?.mode === "acknowledge_gap_then_gently_redirect") {
      return "What feels loudest for you right now?";
    }

    if (primary.category === "planning") {
      return "What outcome matters most right now?";
    }

    if (unknowns.length) {
      return "What information feels most missing right now?";
    }

    return "What feels most important about this?";
  },

  defaultCandidate() {
    return {
      name: "general_understanding",
      category: "general",
      weight: 50,
      confidence: 0.5,
      score: 25,
      reason: "No dominant known observation was detected."
    };
  }
};