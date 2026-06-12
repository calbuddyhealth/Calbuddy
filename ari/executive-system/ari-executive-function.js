// ari/executive-system/ari-executive-function.js
// Ari Executive Function
// Purpose: Decide what deserves priority based on observation, hierarchy, dual salience, life signals, values, identity, conflict, and emotion.
// V1.3: Adds Observer Hierarchy + Dual Salience integration.

window.Ari = window.Ari || {};

window.Ari.executiveFunction = {
  version: "1.3.0",

  decide({
    observation = {},
    lifeSignals = {},
    values = {},
    identity = {},
    conflicts = {},
    emotion = {}
  } = {}) {
    const priorities = [];

    const addPriority = (name, score, reason) => {
      const existing = priorities.find((item) => item.name === name);

      if (existing) {
        existing.score += score;
        existing.reasons.push(reason);
        return;
      }

      priorities.push({
        name,
        score,
        reasons: [reason]
      });
    };

    const life = observation.lifeTransitions || {};
    const patterns = observation.humanPatterns || {};
    const dualSalience = observation.dualSalience || {};
    const observerHierarchy =
      observation.observerHierarchy ||
      observation.hierarchy ||
      {};

    const dominantValue = values.dominantValue;
    const valueList = values.values || [];

    const dominantIdentity = identity.dominantIdentity?.name;
    const conflictIntensity = conflicts.conflictIntensity;
    const primaryConflict =
      conflicts.primaryConflict?.name ||
      observerHierarchy.dominantTension ||
      "";
    const conflictNames = [
      ...(conflicts.conflicts || []).map((item) => item.name),
      ...(observation.valuesAndConflicts?.coreConflicts || [])
    ];

    const signalNames = lifeSignals.signalNames || [];
    const primaryLifeSignal = lifeSignals.primarySignal?.name || null;

    const hierarchyPrimary = observerHierarchy.primaryObservation || null;
    const hierarchyCategory = observerHierarchy.primaryCategory || null;
    const hierarchyInstruction =
      observerHierarchy.recommendedExecutiveInstruction || null;

    const dualLead = dualSalience.priority?.lead || null;
    const dualMode = dualSalience.priority?.mode || null;
    const objectiveLead = dualSalience.priority?.objectiveLead || null;
    const subjectiveLead = dualSalience.priority?.subjectiveLead || null;

    const familyConflictActive =
      primaryConflict === "family_vs_creation" ||
      primaryConflict === "provider_vs_present_parent" ||
      hierarchyPrimary === "provider_vs_present_parent" ||
      conflictNames.includes("family_vs_creation") ||
      conflictNames.includes("family_vs_achievement") ||
      conflictNames.includes("provider_vs_present_parent");

    const familySignalActive =
      life.fatherhood ||
      life.pregnancy ||
      life.familyTransition ||
      observerHierarchy.lifeChapter === "fatherhood_transition" ||
      observerHierarchy.lifeChapter === "pregnancy_transition" ||
      primaryLifeSignal === "family_transition" ||
      signalNames.includes("family_transition") ||
      dominantValue === "family" ||
      valueList.includes("family");

    const regretSignalActive =
      patterns.futureRegretRisk ||
      primaryConflict === "presence_vs_achievement" ||
      hierarchyPrimary === "future_regret_risk" ||
      conflictNames.includes("presence_vs_achievement") ||
      conflictNames.includes("family_vs_achievement");

    // 1. Safety always overrides.
    if (
      observation.risk?.guardianRequired ||
      dualLead === "safety" ||
      hierarchyCategory === "safety"
    ) {
      addPriority(
        "safety",
        120,
        "Safety or urgent risk signal overrides all other priorities."
      );
    }

    // 2. Observer Hierarchy gets a strong vote because it decides what deserves the microphone.
    if (hierarchyPrimary) {
      addPriority(
        this.mapHierarchyToPriority(hierarchyPrimary, hierarchyCategory),
        45,
        `Observer hierarchy identified '${hierarchyPrimary}' as the primary observation.`
      );
    }

    // 3. Dual Salience shapes priority when objective and subjective needs diverge.
    if (dualLead === "integrated") {
      addPriority(
        this.mapDualLeadToPriority(objectiveLead, subjectiveLead),
        35,
        "Dual salience found both objective and subjective importance are high."
      );
    }

    if (dualLead === "bridge") {
      addPriority(
        "bridge-objective-and-subjective",
        35,
        "Objective need is high, but the user’s attention is elsewhere; bridge before advising."
      );
    }

    if (dualLead === "subjective_salience") {
      addPriority(
        "follow-human-attention",
        30,
        "The user's emotional focus is the doorway to helping."
      );
    }

    if (dualLead === "balanced") {
      addPriority(
        "clarify-before-directing",
        25,
        "No dominant signal is strong enough; clarification is needed."
      );
    }

    // 4. Existing family-first correction preserved.
    if (familySignalActive) {
      addPriority(
        "family",
        60,
        "Family or major family transition is active and should organize the executive priority."
      );
    }

    if (familyConflictActive) {
      addPriority(
        "family",
        40,
        "Family is competing with creation, achievement, or provision, so family should lead this season."
      );
    }

    if (life.fatherhood || dominantIdentity === "father") {
      addPriority("family", 40, "Fatherhood or child-related transition is active.");
    }

    if (life.pregnancy) {
      addPriority("family", 35, "Pregnancy or incoming child transition is active.");
    }

    if (life.engagement || life.marriage) {
      addPriority("relationship", 25, "Marriage, wedding, or spouse transition is active.");
    }

    if (life.militaryTransition) {
      addPriority("military-transition", 25, "Military transition requires stability and planning.");
    }

    if (life.careerTransition || valueList.includes("growth")) {
      addPriority("career-development", 20, "Career or education growth is active.");
    }

    if (valueList.includes("creation")) {
      addPriority("creation", 15, "Creative mission or Ari Rebirth is active.");
    }

    if (valueList.includes("service")) {
      addPriority("service", 15, "Service/helping value is active.");
    }

    if (
      patterns.burnoutRisk ||
      conflictIntensity === "critical" ||
      hierarchyPrimary === "burnout_risk"
    ) {
      addPriority("capacity-protection", 35, "Burnout risk or critical conflict detected.");
    }

    // Future regret supports family when family is already active.
    if (regretSignalActive && familySignalActive) {
      addPriority(
        "family",
        30,
        "Future regret risk points toward protecting irreplaceable family presence."
      );
    } else if (regretSignalActive) {
      addPriority("regret-protection", 25, "Future regret risk detected.");
    }

    if (dominantValue === "family") {
      addPriority("family", 25, "Family is the dominant value.");
    }

    priorities.sort((a, b) => b.score - a.score);

    const primaryPriority = priorities[0] || null;
    const secondaryPriorities = priorities.slice(1, 4);

    const thingsToDelay = this.getThingsToDelay({
      primaryPriority,
      priorities,
      values,
      identity,
      conflicts,
      observation,
      observerHierarchy,
      dualSalience
    });

    const responseStrategy = this.getResponseStrategy({
      primaryPriority,
      observation,
      observerHierarchy,
      dualSalience
    });

    return {
      primaryPriority,
      secondaryPriorities,
      thingsToDelay,

      executiveDecision: this.getExecutiveDecision(primaryPriority),
      recommendedFocus: this.getRecommendedFocus(primaryPriority, thingsToDelay),

      responseStrategy,
      shouldAskClarifyingQuestion: responseStrategy.shouldAskClarifyingQuestion,
      shouldComfort: responseStrategy.shouldComfort,
      shouldTeach: responseStrategy.shouldTeach,
      shouldChallenge: responseStrategy.shouldChallenge,
      shouldCreatePlan: responseStrategy.shouldCreatePlan,
      recommendedQuestion: responseStrategy.recommendedQuestion,

      hierarchyInstruction,
      hierarchyPrimaryObservation: hierarchyPrimary,
      hierarchyCategory,
      dualSalienceLead: dualLead,
      dualSalienceMode: dualMode,
      objectiveLead,
      subjectiveLead,

      reasoning: this.getReasoning({
        primaryPriority,
        priorities,
        conflicts,
        identity,
        values,
        observerHierarchy,
        dualSalience
      }),

      source: "ari-executive-function",
      version: this.version
    };
  },

  mapHierarchyToPriority(primaryObservation, category) {
    const map = {
      safety_or_urgent_risk: "safety",
      provider_vs_present_parent: "family",
      ambition_vs_presence: "family",
      future_regret_risk: "regret-protection",
      opportunity_cost: "prioritize-tradeoff",
      burnout_risk: "capacity-protection",
      emotional_pain: "emotional-support",
      needs_plan_or_priority: "planning",
      fatherhood_transition: "family",
      pregnancy_transition: "family",
      engagement_and_wedding_transition: "relationship",
      marriage_transition: "relationship",
      military_to_civilian_transition: "military-transition",
      career_transition: "career-development",
      builder_founder_transition: "creation"
    };

    if (map[primaryObservation]) return map[primaryObservation];

    const categoryMap = {
      safety: "safety",
      core_conflict: "prioritize-conflict",
      long_term_consequence: "regret-protection",
      tradeoff: "prioritize-tradeoff",
      capacity: "capacity-protection",
      life_chapter: "life-chapter",
      emotion: "emotional-support",
      planning: "planning",
      request: "direct-help"
    };

    return categoryMap[category] || "general-priority";
  },

  mapDualLeadToPriority(objectiveLead, subjectiveLead) {
    if (objectiveLead === "safety") return "safety";

    if (
      objectiveLead === "physical_health" ||
      objectiveLead === "nutrition" ||
      objectiveLead === "sleep"
    ) {
      return "health-stabilization";
    }

    if (objectiveLead === "relationship") return "relationship";
    if (objectiveLead === "purpose") return "meaning";

    if (
      subjectiveLead === "anxiety" ||
      subjectiveLead === "fear" ||
      subjectiveLead === "sadness" ||
      subjectiveLead === "shame"
    ) {
      return "emotional-support";
    }

    return "integrated-support";
  },

  getThingsToDelay({
    primaryPriority = null,
    values = {},
    identity = {},
    conflicts = {},
    observation = {},
    observerHierarchy = {},
    dualSalience = {}
  } = {}) {
    const delay = [];
    const life = observation.lifeTransitions || {};
    const patterns = observation.humanPatterns || {};
    const primaryConflict =
      conflicts.primaryConflict?.name ||
      observerHierarchy.dominantTension ||
      "";
    const conflictNames = [
      ...(conflicts.conflicts || []).map((item) => item.name),
      ...(observation.valuesAndConflicts?.coreConflicts || [])
    ];

    const addDelay = (name, reason) => {
      if (!delay.some((item) => item.name === name)) {
        delay.push({ name, reason });
      }
    };

    if (
      primaryPriority?.name === "family" &&
      (
        primaryConflict === "provider_vs_present_parent" ||
        primaryConflict === "family_vs_creation" ||
        conflictNames.includes("provider_vs_present_parent") ||
        conflictNames.includes("family_vs_achievement") ||
        conflictNames.includes("family_vs_creation") ||
        patterns.opportunityCost
      )
    ) {
      addDelay(
        "career-or-creation-acceleration",
        "Protect family presence during a major life transition instead of maximizing career, creation, or achievement."
      );
    }

    if (
      primaryPriority?.name === "family" &&
      (identity.dominantIdentity?.name === "father" || life.fatherhood || life.pregnancy)
    ) {
      addDelay(
        "nonessential-expansion",
        "Avoid adding major new commitments during this family transition season."
      );
    }

    if (
      values.values?.includes("creation") &&
      (life.fatherhood || life.pregnancy) &&
      (
        patterns.lifeTransitionLoad?.level === "extreme" ||
        conflictNames.includes("family_vs_creation")
      )
    ) {
      addDelay(
        "creation-scaling",
        "Keep Ari Rebirth alive, but avoid large-scale expansion during a family transition season."
      );
    }

    if (
      values.values?.includes("growth") &&
      patterns.lifeTransitionLoad?.level === "extreme"
    ) {
      addDelay(
        "career-acceleration",
        "Career growth should continue, but not at full acceleration during extreme transition load."
      );
    }

    if (
      patterns.burnoutRisk ||
      primaryPriority?.name === "capacity-protection"
    ) {
      addDelay(
        "nonessential-expansion",
        "Avoid expanding optional goals while burnout risk is active."
      );
    }

    if (dualSalience.priority?.mode === "acknowledge_gap_then_gently_redirect") {
      addDelay(
        "direct-advice-too-soon",
        "Do not jump straight to advice before bridging from the user's subjective focus."
      );
    }

    if (observerHierarchy.shouldAskClarifyingQuestion) {
      addDelay(
        "overconfident-answer",
        "Ask a clarifying question before acting too confidently."
      );
    }

    return delay;
  },

  getResponseStrategy({
    primaryPriority = null,
    observation = {},
    observerHierarchy = {},
    dualSalience = {}
  } = {}) {
    const strategy = {
      mode: "respond_to_priority",
      shouldAskClarifyingQuestion: false,
      shouldComfort: false,
      shouldTeach: false,
      shouldChallenge: false,
      shouldCreatePlan: false,
      recommendedQuestion: null,
      firstMove: "name_the_priority",
      tone: "steady"
    };

    if (primaryPriority?.name === "safety") {
      return {
        ...strategy,
        mode: "urgent_safety_support",
        shouldComfort: true,
        firstMove: "stabilize_and_direct_to_safety",
        tone: "calm_direct"
      };
    }

    if (
      observerHierarchy.shouldAskClarifyingQuestion ||
      dualSalience.clarity?.action === "ask_one_clarifying_question" ||
      primaryPriority?.name === "clarify-before-directing"
    ) {
      strategy.shouldAskClarifyingQuestion = true;
      strategy.recommendedQuestion =
        observerHierarchy.recommendedQuestion ||
        "What feels most important about this?";
      strategy.mode = "clarify_before_advising";
      strategy.firstMove = "ask_one_focused_question";
      strategy.tone = "curious";
      return strategy;
    }

    if (dualSalience.priority?.mode === "acknowledge_gap_then_gently_redirect") {
      strategy.mode = "bridge_subjective_to_objective";
      strategy.shouldComfort = true;
      strategy.firstMove = "acknowledge_what_feels_loud";
      strategy.tone = "warm_grounded";
      return strategy;
    }

    if (dualSalience.priority?.mode === "follow_user_attention_first") {
      strategy.mode = "follow_subjective_salience";
      strategy.shouldComfort = true;
      strategy.firstMove = "start_with_user_attention";
      strategy.tone = "warm";
      return strategy;
    }

    if (dualSalience.priority?.mode === "validate_then_act") {
      strategy.mode = "validate_then_act";
      strategy.shouldComfort = true;
      strategy.firstMove = "validate_then_give_next_step";
      strategy.tone = "steady_warm";
      return strategy;
    }

    if (primaryPriority?.name === "family") {
      strategy.mode = "protect_family_first";
      strategy.shouldComfort = true;
      strategy.shouldChallenge = true;
      strategy.firstMove = "name_family_as_lead_priority";
      strategy.tone = "warm_direct";
      return strategy;
    }

    if (primaryPriority?.name === "planning") {
      strategy.mode = "create_priority_structure";
      strategy.shouldCreatePlan = true;
      strategy.firstMove = "organize_next_steps";
      strategy.tone = "clear";
      return strategy;
    }

    if (primaryPriority?.name === "emotional-support") {
      strategy.mode = "support_before_solution";
      strategy.shouldComfort = true;
      strategy.firstMove = "name_emotional_weight";
      strategy.tone = "gentle";
      return strategy;
    }

    if (primaryPriority?.name === "health-stabilization") {
      strategy.mode = "stabilize_health";
      strategy.shouldComfort = true;
      strategy.shouldTeach = true;
      strategy.firstMove = "address_health_need_calmly";
      strategy.tone = "calm_practical";
      return strategy;
    }

    if (primaryPriority?.name === "capacity-protection") {
      strategy.mode = "reduce_load";
      strategy.shouldChallenge = true;
      strategy.firstMove = "protect_capacity";
      strategy.tone = "direct_protective";
      return strategy;
    }

    return strategy;
  },

  getExecutiveDecision(primaryPriority = null) {
    if (!primaryPriority) {
      return "continue_observing";
    }

    const decisions = {
      safety: "protect_safety_first",
      family: "protect_family_first",
      relationship: "protect_relationship_stability",
      "military-transition": "stabilize_transition",
      "career-development": "continue_growth_with_limits",
      creation: "build_slowly_without_overextending",
      service: "serve_without_self-erasure",
      "capacity-protection": "reduce_load_immediately",
      "regret-protection": "protect_irreplaceable_moments",
      "bridge-objective-and-subjective": "bridge_before_advising",
      "follow-human-attention": "follow_subjective_salience_first",
      "clarify-before-directing": "ask_before_directing",
      planning: "create_priority_structure",
      "emotional-support": "support_before_solution",
      "health-stabilization": "stabilize_health_first",
      "prioritize-conflict": "name_conflict_and_choose_lead",
      "prioritize-tradeoff": "clarify_tradeoff",
      "life-chapter": "frame_as_life_chapter",
      "direct-help": "help_directly",
      "general-priority": "prioritize_with_caution"
    };

    return decisions[primaryPriority.name] || "prioritize_with_caution";
  },

  getRecommendedFocus(primaryPriority = null, thingsToDelay = []) {
    if (!primaryPriority) {
      return "Gather more context before making a decision.";
    }

    if (primaryPriority.name === "safety") {
      return "Prioritize immediate safety, stabilization, and urgent support.";
    }

    if (primaryPriority.name === "family") {
      return "Make family the primary focus for this season. Keep other identities alive, but do not let them compete equally.";
    }

    if (primaryPriority.name === "bridge-objective-and-subjective") {
      return "Start where the user’s attention is, then gently bridge toward the objective need.";
    }

    if (primaryPriority.name === "follow-human-attention") {
      return "Follow the user's lived emotional focus first; advice comes after connection.";
    }

    if (primaryPriority.name === "clarify-before-directing") {
      return "Ask one focused question before giving strong direction.";
    }

    if (primaryPriority.name === "capacity-protection") {
      return "Reduce load before adding ambition. Protect energy, sleep, relationships, and follow-through.";
    }

    if (primaryPriority.name === "regret-protection") {
      return "Prioritize choices that protect irreplaceable time and reduce future regret.";
    }

    return `Prioritize ${primaryPriority.name} while delaying: ${
      thingsToDelay.map((item) => item.name).join(", ") || "nothing major"
    }.`;
  },

  getReasoning({
    primaryPriority = null,
    priorities = [],
    conflicts = {},
    identity = {},
    values = {},
    observerHierarchy = {},
    dualSalience = {}
  } = {}) {
    if (!primaryPriority) {
      return "No clear executive priority emerged.";
    }

    return `Ari identified ${primaryPriority.name} as the leading priority because it scored highest against hierarchy, dual salience, values, identities, and conflicts. Hierarchy primary: ${
      observerHierarchy.primaryObservation || "unknown"
    }. Dual salience lead: ${
      dualSalience.priority?.lead || "unknown"
    }. Dominant value: ${
      values.dominantValue || "unknown"
    }. Dominant identity: ${
      identity.dominantIdentity?.name || "unknown"
    }. Conflict intensity: ${
      conflicts.conflictIntensity || "unknown"
    }.`;
  }
};