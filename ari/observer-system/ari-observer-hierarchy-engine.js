// ari/observer-system/ari-observer-hierarchy-engine.js
// Ari Observer Hierarchy Engine
// Purpose: Decide which observation deserves the microphone.
// V1.2
// Fixes:
// - Adds late-stage summary-aware hierarchy pass.
// - Allows hierarchy to use richer signals from salience, wisdom, life chapter, executive, and confidence.
// - Keeps early observer hierarchy behavior when no summary is provided.

window.Ari = window.Ari || {};

window.Ari.observerHierarchyEngine = {
  version: "1.2.0",

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

    const candidates = this.buildCandidates({
      dual,
      conversation,
      emotion,
      goals,
      lifeTransitions,
      humanPatterns,
      valuesAndConflicts,
      risk,
      summary
    });

    const ranked = this.rankCandidates(candidates);
    const primary = ranked[0] || this.defaultCandidate();

    const detectedLifeChapter =
      this.detectLifeChapter(lifeTransitions, humanPatterns) ||
      summary.primaryLifeChapter ||
      (primary.category === "life_chapter" ? primary.name : null);

    const detectedTension =
      this.detectDominantTension(valuesAndConflicts, humanPatterns) ||
      summary.wisdomTension ||
      summary.apparentConflict ||
      summary.primaryConflict ||
      null;

    return {
      system: "ari-observer-hierarchy-engine",
      version: this.version,

      primaryObservation: primary.name,
      primaryCategory: primary.category,
      primaryReason: primary.reason,
      primaryConfidence: primary.confidence,

      supportingObservations: ranked
        .filter((item, index) => index > 0)
        .slice(0, 5),

      dominantTension: detectedTension,
      lifeChapter: detectedLifeChapter,

      objectiveLead: dual.priority?.objectiveLead || summary.dualSalienceObjectiveLead || null,
      subjectiveLead: dual.priority?.subjectiveLead || summary.dualSalienceSubjectiveLead || null,
      dualSalienceMode: dual.priority?.mode || summary.dualSalienceMode || null,

      recommendedExecutiveInstruction:
        this.recommendExecutiveInstruction(primary, dual, risk, summary),

      shouldAskClarifyingQuestion:
        this.shouldAskClarifyingQuestion(primary, dual, conversation, {
          lifeTransitions,
          humanPatterns,
          valuesAndConflicts,
          summary
        }),

      recommendedQuestion:
        this.recommendedQuestion(primary, dual, summary),

      rankedObservations: ranked
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
      summary = {}
    } = parts;

    const candidates = [];

    if (
      risk.guardianRequired ||
      dual.priority?.lead === "safety" ||
      summary.safetyTriggered ||
      summary.executiveDecision === "protect_safety_first"
    ) {
      candidates.push({
        name: "safety_or_urgent_risk",
        category: "safety",
        weight: 100,
        confidence: 0.98,
        reason: "Safety risk overrides all other observations."
      });
    }

    // ===================================
    // LATE-STAGE SUMMARY SIGNALS
    // These are stronger than early observer guesses.
    // ===================================

    if (summary.primaryLifeChapter) {
      candidates.push({
        name: summary.primaryLifeChapter,
        category: "life_chapter",
        weight: 98,
        confidence: 0.96,
        reason: "Later systems identified a dominant life chapter."
      });
    }

    if (summary.primaryWeightedLifeSignal) {
      candidates.push({
        name: summary.primaryWeightedLifeSignal,
        category: "life_priority",
        weight: 97,
        confidence: 0.95,
        reason: "Life signal weighting identified a major life priority."
      });
    }

    if (summary.primarySalienceName) {
      candidates.push({
        name: summary.primarySalienceName,
        category: summary.primarySalienceCategory || "salience",
        weight: 96,
        confidence: 0.94,
        reason: "Salience network identified the dominant signal."
      });
    }

    if (summary.strongestSignal) {
      candidates.push({
        name: summary.strongestSignal,
        category: summary.strongestSignalCategory || "signal",
        weight: 94,
        confidence:
          summary.strongestSignalCategory === "life" ? 0.94 : 0.86,
        reason: "Signal system identified the strongest active signal."
      });
    }

    if (summary.wisdomTension) {
      candidates.push({
        name: summary.wisdomTension,
        category: "core_conflict",
        weight: 92,
        confidence: 0.92,
        reason: "Wisdom systems detected a major tension."
      });
    }

    if (summary.apparentConflict) {
      candidates.push({
        name: summary.apparentConflict,
        category: "core_conflict",
        weight: 91,
        confidence: 0.9,
        reason: "Value integration detected an apparent conflict."
      });
    }

    if (summary.highestGood) {
      candidates.push({
        name: summary.highestGood,
        category: "highest_good",
        weight: 90,
        confidence: 0.9,
        reason: "Highest good signal detected."
      });
    }

    if (summary.executiveDecision === "protect_family_first") {
      candidates.push({
        name: "protect_family_first",
        category: "executive_priority",
        weight: 93,
        confidence: 0.93,
        reason: "Executive function selected family as the leading priority."
      });
    }

    if (summary.primaryPriority === "family") {
      candidates.push({
        name: "family_priority",
        category: "executive_priority",
        weight: 92,
        confidence: 0.92,
        reason: "Executive priority is family."
      });
    }

    if (summary.regretType) {
      candidates.push({
        name: summary.regretType,
        category: "long_term_consequence",
        weight: 88,
        confidence: 0.88,
        reason: "Regret engine identified a preventable regret."
      });
    }

    if (summary.longTermPath) {
      candidates.push({
        name: summary.longTermPath,
        category: "long_term_path",
        weight: 86,
        confidence: 0.86,
        reason: "Long-term consequence engine identified a path."
      });
    }

    const chapter = this.detectLifeChapter(lifeTransitions, humanPatterns);

    if (chapter) {
      candidates.push({
        name: chapter,
        category: "life_chapter",
        weight: 90,
        confidence: 0.86,
        reason: "The message belongs to a larger life transition."
      });
    }

    if (valuesAndConflicts.coreConflicts?.length) {
      candidates.push({
        name: valuesAndConflicts.coreConflicts[0],
        category: "core_conflict",
        weight: 86,
        confidence: 0.82,
        reason: "A core value conflict is present."
      });
    }

    if (humanPatterns.futureRegretRisk) {
      candidates.push({
        name: "future_regret_risk",
        category: "long_term_consequence",
        weight: 84,
        confidence: 0.8,
        reason: "The decision may create future regret if mishandled."
      });
    }

    if (humanPatterns.opportunityCost) {
      candidates.push({
        name: "opportunity_cost",
        category: "tradeoff",
        weight: 80,
        confidence: 0.78,
        reason: "One important good may require sacrificing another."
      });
    }

    if (humanPatterns.burnoutRisk) {
      candidates.push({
        name: "burnout_risk",
        category: "capacity",
        weight: 78,
        confidence: 0.78,
        reason: "The person may be exceeding their current capacity."
      });
    }

    if (emotion.hasEmotionalPain) {
      candidates.push({
        name: "emotional_pain",
        category: "emotion",
        weight: 74,
        confidence: 0.74,
        reason: "The person is carrying emotional distress."
      });
    }

    if (goals.wantsPlan) {
      candidates.push({
        name: "needs_plan_or_priority",
        category: "planning",
        weight: 70,
        confidence: 0.72,
        reason: "The person is asking for structure or prioritization."
      });
    }

    if (dual.priority?.lead) {
      candidates.push({
        name: `dual_salience_${dual.priority.lead}`,
        category: "dual_salience",
        weight: this.weightDualSalience(dual.priority.lead),
        confidence: dual.clarity?.confidence || 0.75,
        reason: dual.priority.reason || "Dual salience identified the main response pathway."
      });
    }

    if (conversation.hasDirectRequest) {
      candidates.push({
        name: "direct_request",
        category: "request",
        weight: 62,
        confidence: 0.7,
        reason: "The user directly asked for help."
      });
    }

    return this.dedupeCandidates(candidates);
  },

  dedupeCandidates(candidates = []) {
    const map = new Map();

    candidates.forEach((candidate) => {
      const key = `${candidate.category}:${candidate.name}`;
      const existing = map.get(key);

      if (!existing || candidate.weight * candidate.confidence > existing.weight * existing.confidence) {
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
      return valuesAndConflicts.coreConflicts[0];
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
      primary.category === "life_chapter" ||
      primary.category === "life_priority" ||
      summary.primaryLifeChapter
    ) {
      return "Frame the issue as part of a larger life chapter.";
    }

    if (
      primary.category === "executive_priority" ||
      summary.executiveDecision === "protect_family_first"
    ) {
      return "Follow the executive priority and protect the leading good."
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

    return "Respond to the strongest observation with one clear next step.";
  },

  shouldAskClarifyingQuestion(primary, dual = {}, conversation = {}, context = {}) {
    if (primary.category === "safety") return false;

    const {
      lifeTransitions = {},
      humanPatterns = {},
      valuesAndConflicts = {},
      summary = {}
    } = context;

    const resolvedEnough =
      summary.uncertaintyType === "resolved_enough" ||
      summary.calibratedConfidence === "high" ||
      summary.metaConfidence === "high" ||
      Number(summary.confidenceScore || 0) >= 75;

    const strongChapterActive =
      primary.category === "life_chapter" ||
      primary.category === "life_priority" ||
      Boolean(summary.primaryLifeChapter) ||
      Boolean(this.detectLifeChapter(lifeTransitions, humanPatterns));

    const strongConflictActive =
      primary.category === "core_conflict" ||
      Boolean(summary.wisdomTension) ||
      Boolean(summary.apparentConflict) ||
      valuesAndConflicts.coreConflicts?.length > 0 ||
      humanPatterns.futureRegretRisk ||
      humanPatterns.opportunityCost;

    const executiveClear =
      Boolean(summary.executiveDecision) &&
      summary.executiveDecision !== "continue_observing" &&
      summary.executiveDecision !== "ask_before_directing";

    if (
      resolvedEnough ||
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

  recommendedQuestion(primary, dual = {}, summary = {}) {
    if (summary.primaryLifeChapter === "fatherhood_transition") {
      return "What kind of father does this season ask you to become?";
    }

    if (summary.identityRecoveryQuestion) {
      return summary.identityRecoveryQuestion;
    }

    if (summary.lifeChapterQuestion) {
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

    return "What feels most important about this?";
  },

  defaultCandidate() {
    return {
      name: "general_understanding",
      category: "general",
      weight: 50,
      confidence: 0.5,
      score: 25,
      reason: "No dominant observation was detected."
    };
  }
};