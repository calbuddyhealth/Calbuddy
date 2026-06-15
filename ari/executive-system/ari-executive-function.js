// ari/executive-system/ari-executive-function.js
// Ari Executive Function
// Purpose: Convert situation understanding into priority, goal, obstacle, next action,
// completion criteria, and user-facing executive answer.
// V2.1
// Upgrades:
// - Situation Contract aware.
// - Safety/body always override.
// - Builder/teacher/planning cannot be hijacked by uncertainty.
// - Adds executiveState.
// - Adds executiveAnswer for Composer V4.
// - Preserves legacy fields for old lab/debug compatibility.

window.Ari = window.Ari || {};

window.Ari.executiveFunction = {
  version: "2.1.0",

  evaluate(input = {}) {
    return this.decide(input);
  },

  decide(input = {}) {
    const summary = input.summary || input || {};

    const contract = summary.situationContract || {};

    const contractPrimary =
      summary.situationContractPrimary ||
      contract.primary ||
      summary.primaryLaneSuggestion ||
      null;

    const map = summary.situationMap || {};

    const riskLevel =
      summary.riskLevel ||
      contract.risk?.level ||
      map.riskLevel ||
      "none";

    const riskType =
      summary.riskType ||
      contract.risk?.type ||
      map.riskType ||
      "none";

    const responseShape =
      summary.responseShape ||
      contract.responseShape ||
      null;

    const clarityNeeded =
      contract.clarity?.needed === true ||
      summary.followUpNeeded === true ||
      map.shouldAskClarifyingQuestion === true;

    const priorities = [];

    const addPriority = (name, score, reason) => {
      if (!name) return;

      const existing = priorities.find(item => item.name === name);

      if (existing) {
        existing.score += score;
        if (reason && !existing.reasons.includes(reason)) {
          existing.reasons.push(reason);
        }
        return;
      }

      priorities.push({
        name,
        score,
        reasons: reason ? [reason] : []
      });
    };

    // 1. Situation Contract gets first vote.
    if (contractPrimary) {
      addPriority(
        this.priorityFromContract(contractPrimary),
        100,
        `Situation Contract selected '${contractPrimary}' as the primary lane.`
      );
    }

    // 2. Safety/body override.
    if (
      contractPrimary === "safety" ||
      riskLevel === "critical" ||
      summary.shouldUseSafetyResponse === true
    ) {
      addPriority(
        "safety",
        1000,
        "Safety risk is active and overrides all other priorities."
      );
    }

    // Important:
    // Pregnancy alone should NOT make medical-body primary.
    // Only urgent medical override, actual medical_body primary, or shouldUseMedicalResponse should.
    if (
      contractPrimary === "medical_body" ||
      summary.shouldUseMedicalResponse === true ||
      contract.risk?.override === "medical_urgent"
    ) {
      addPriority(
        "medical-body",
        900,
        "Body or medical stability must lead before interpretation."
      );
    }

    // 3. Situation Map support.
    (map.needs || []).forEach(need => {
      const mapped = this.priorityFromNeed(need);
      if (mapped) addPriority(mapped, 35, `Situation Map need detected: ${need}.`);
    });

    (map.domains || []).forEach(domain => {
      const mapped = this.priorityFromDomain(domain);
      if (mapped) addPriority(mapped, 30, `Situation Map domain detected: ${domain}.`);
    });

    (map.situations || []).forEach(situation => {
      const mapped = this.priorityFromSituation(situation);
      if (mapped) addPriority(mapped, 25, `Situation Map situation detected: ${situation}.`);
    });

    // 4. Legacy support signals.
    const observation = summary.observation || {};
    const life = observation.lifeTransitions || {};
    const patterns = observation.humanPatterns || {};
    const values = summary.values || {};
    const identity = summary.identity || {};

    const observerHierarchy =
      summary.observerHierarchy ||
      summary.hierarchy ||
      observation.observerHierarchy ||
      observation.hierarchy ||
      {};

    const hierarchyPrimary =
      summary.observerHierarchyPrimaryObservation ||
      observerHierarchy.primaryObservation ||
      null;

    const hierarchyCategory =
      summary.observerHierarchyPrimaryCategory ||
      observerHierarchy.primaryCategory ||
      null;

    const hierarchyInstruction =
      summary.observerHierarchyExecutiveInstruction ||
      observerHierarchy.recommendedExecutiveInstruction ||
      null;

    if (hierarchyPrimary && !contractPrimary) {
      addPriority(
        this.mapHierarchyToPriority(hierarchyPrimary, hierarchyCategory),
        45,
        `Observer hierarchy identified '${hierarchyPrimary}' as primary.`
      );
    }

    const dominantValue =
      values.dominantValue ||
      summary.integratedValue ||
      null;

    const dominantIdentity =
      identity.dominantIdentity?.name ||
      summary.resolvedLeadIdentity ||
      summary.leadIdentity ||
      null;

    if (
      life.fatherhood ||
      life.pregnancy ||
      dominantIdentity === "father" ||
      dominantValue === "family"
    ) {
      addPriority("family", 60, "Family or fatherhood transition is active.");
    }

    if (patterns.burnoutRisk) {
      addPriority("capacity-protection", 45, "Burnout/capacity risk detected.");
    }

    priorities.sort((a, b) => b.score - a.score);

    const primaryPriority = priorities[0] || {
      name: "general-priority",
      score: 10,
      reasons: ["No strong executive priority emerged."]
    };

    const secondaryPriorities = priorities.slice(1, 4);

    const executiveState = this.buildExecutiveState({
      summary,
      contract,
      contractPrimary,
      primaryPriority,
      responseShape,
      clarityNeeded,
      riskLevel,
      riskType
    });

    const thingsToDelay = this.getThingsToDelay({
      primaryPriority,
      contractPrimary,
      summary,
      map,
      observerHierarchy
    });

    const responseStrategy = this.getResponseStrategy({
      primaryPriority,
      executiveState,
      contractPrimary,
      clarityNeeded,
      responseShape
    });

    const executiveAnswer = this.createExecutiveAnswer({
      summary,
      contract,
      map,
      primaryPriority,
      secondaryPriorities,
      executiveState,
      responseStrategy
    });

    return {
      executiveFunctionRan: true,
      executiveFunctionVersion: this.version,

      primaryPriority,
      secondaryPriorities,
      thingsToDelay,

      executiveState,

      executiveGoal: executiveState.goal,
      executiveObstacle: executiveState.obstacle,
      executiveNextAction: executiveState.nextAction,
      executiveCompletionCriteria: executiveState.completionCriteria,
      executivePhase: executiveState.phase,

      executiveAnswer,

      executiveDecision: this.getExecutiveDecision(primaryPriority, contractPrimary),
      recommendedFocus: this.getRecommendedFocus(primaryPriority, executiveState, thingsToDelay),

      responseStrategy,
      responseStrategyMode: responseStrategy.mode,

      shouldAskClarifyingQuestion: responseStrategy.shouldAskClarifyingQuestion,
      shouldComfort: responseStrategy.shouldComfort,
      shouldTeach: responseStrategy.shouldTeach,
      shouldChallenge: responseStrategy.shouldChallenge,
      shouldCreatePlan: responseStrategy.shouldCreatePlan,
      recommendedQuestion: responseStrategy.recommendedQuestion,

      hierarchyInstruction,
      hierarchyPrimaryObservation: hierarchyPrimary,
      hierarchyCategory,

      reasoning: this.getReasoning({
        primaryPriority,
        priorities,
        contractPrimary,
        executiveState
      }),

      source: "ari-executive-function",
      version: this.version
    };
  },

  priorityFromContract(primary = null) {
    const map = {
      safety: "safety",
      risk_clarification: "risk-clarification",
      medical_body: "medical-body",
      medical_context: "medical-context",
      builder: "direct-build-help",
      teacher: "direct-teaching",
      executive_decision: "planning",
      emotion: "emotional-support",
      family: "family",
      relationship: "relationship",
      wisdom: "wisdom",
      memory: "memory-update",
      general_understanding: "general-priority"
    };

    return map[primary] || "general-priority";
  },

  priorityFromNeed(need = "") {
    const map = {
      stabilization: "safety",
      urgent_protection: "safety",
      risk_clarification: "risk-clarification",
      action_or_build_help: "direct-build-help",
      understanding: "direct-teaching",
      decision_support: "planning",
      emotional_attunement: "emotional-support",
      relationship_or_family_awareness: "family",
      protection_of_relationships: "family",
      context_sensitive_support: "medical-context",
      memory_acknowledgment: "memory-update",
      wisdom_or_value_clarity: "wisdom"
    };

    return map[need] || null;
  },

  priorityFromDomain(domain = "") {
    const map = {
      builder_domain: "direct-build-help",
      creative_building_domain: "direct-build-help",
      knowledge_domain: "direct-teaching",
      knowledge_learning_domain: "direct-teaching",
      teacher_domain: "direct-teaching",
      medical_body_domain: "medical-body",
      body_signal_domain: "medical-body",
      medical_context_domain: "medical-context",
      safety_domain: "safety",
      risk_clarification_domain: "risk-clarification",
      emotion_context_domain: "emotional-support",
      emotion_domain: "emotional-support",
      family_context_domain: "family",
      family_caregiving_domain: "family",
      relationship_context_domain: "relationship",
      relationship_connection_domain: "relationship",
      wisdom_values_domain: "wisdom",
      memory_preference_domain: "memory-update",
      financial_resource_domain: "resources",
      money_resources_domain: "resources",
      career_work_domain: "career-development",
      career_contribution_domain: "career-development"
    };

    return map[domain] || null;
  },

  priorityFromSituation(situation = "") {
    const map = {
      building_or_debugging_context: "direct-build-help",
      teaching_or_explanation_request: "direct-teaching",
      body_or_health_concern: "medical-body",
      body_symptom_mentioned: "medical-body",
      body_or_medical_context: "medical-context",
      risk_or_medical_context_only: "medical-context",
      active_risk_context: "safety",
      emotional_state_or_regulation_need: "emotional-support",
      emotion_language_present: "emotional-support",
      decision_or_tradeoff: "planning",
      tradeoff_or_competing_priorities: "planning",
      competing_priorities: "planning",
      family_or_caregiving_context: "family",
      family_context: "family",
      close_relationship_context: "relationship",
      close_person_context: "relationship",
      memory_or_preference_update: "memory-update",
      memory_or_preference_request: "memory-update",
      values_or_philosophy_question: "wisdom",
      work_or_role_context: "career-development",
      work_or_career_context: "career-development",
      money_or_resource_context: "resources"
    };

    return map[situation] || null;
  },

  buildExecutiveState({
    summary = {},
    contract = {},
    contractPrimary = null,
    primaryPriority = {},
    responseShape = null,
    clarityNeeded = false,
    riskLevel = "none",
    riskType = "none"
  } = {}) {
    const clarityQuestion =
      contract.clarity?.question ||
      summary.followUpQuestion ||
      summary.recommendedQuestion ||
      null;

    const templates = {
      safety: {
        goal: "Protect immediate safety.",
        obstacle: "Risk may require urgent stabilization before normal conversation.",
        nextAction: "Give a calm safety-first response and direct toward immediate support.",
        completionCriteria: "User has a clear immediate safety step.",
        phase: "stabilize"
      },

      "risk-clarification": {
        goal: "Clarify whether there is real danger before normal response.",
        obstacle: "Ari cannot safely interpret ambiguous risk language.",
        nextAction:
          clarityQuestion ||
          "Ask one direct safety clarification question.",
        completionCriteria: "User clarifies whether there is immediate danger.",
        phase: "clarify"
      },

      "medical-body": {
        goal: "Stabilize body or medical risk before interpretation.",
        obstacle: "Advice could be unsafe if urgent symptoms are underweighted.",
        nextAction: "Give body-first guidance and a concrete medical next step.",
        completionCriteria: "User knows whether to monitor, call a clinician, or seek urgent care.",
        phase: "stabilize"
      },

      "medical-context": {
        goal: "Keep medical context in view without letting it hijack the answer.",
        obstacle: "Medical words may be context rather than the actual user task.",
        nextAction: "Mention medical context only if it affects the practical decision.",
        completionCriteria: "User gets the main answer without unnecessary escalation.",
        phase: "contextualize"
      },

      "direct-build-help": {
        goal: "Help the user build, fix, or debug the thing directly.",
        obstacle: "Ari needs the relevant code, error, screenshot, or file context to be exact.",
        nextAction: "Ask for the exact code/error or give the next debugging step.",
        completionCriteria: "User has a concrete block to inspect, replace, or test.",
        phase: "execute"
      },

      "direct-teaching": {
        goal: "Explain the topic clearly.",
        obstacle: "Ari must answer directly instead of drifting into reflection.",
        nextAction: "Give a clear explanation with a simple example.",
        completionCriteria: "User understands the concept well enough to use it.",
        phase: "teach"
      },

      planning: {
        goal: "Create order and identify the next step.",
        obstacle: "Too many moving parts may blur the priority.",
        nextAction: "Sort the issue into priority, tradeoff, and next action.",
        completionCriteria: "User knows what to do first.",
        phase: "organize"
      },

      "emotional-support": {
        goal: "Reduce emotional load enough for the user to think clearly.",
        obstacle: "Advice too early may feel disconnected.",
        nextAction: "Name the emotional signal briefly, then offer one grounded step.",
        completionCriteria: "User feels understood and has one stabilizing next move.",
        phase: "attune"
      },

      family: {
        goal: "Protect family, caregiving, or relational responsibility.",
        obstacle: "Achievement, urgency, or self-pressure may compete with what cannot be replaced.",
        nextAction: "Name the protected priority and give one practical next step.",
        completionCriteria: "The response protects the relationship without ignoring reality.",
        phase: "protect"
      },

      relationship: {
        goal: "Protect connection and repair clarity.",
        obstacle: "Misunderstanding or emotional threat may escalate if handled coldly.",
        nextAction: "Acknowledge the relationship signal and guide one repair-oriented move.",
        completionCriteria: "User has a relationally safe next step.",
        phase: "repair"
      },

      wisdom: {
        goal: "Clarify the principle that should lead.",
        obstacle: "The user may be caught between competing goods.",
        nextAction: "Name the tension and identify the higher-order value.",
        completionCriteria: "User sees what principle should guide the choice.",
        phase: "discern"
      },

      "memory-update": {
        goal: "Preserve or update the user's stated preference/context.",
        obstacle: "Memory requests should not be treated like normal advice.",
        nextAction: "Acknowledge the memory/preference update.",
        completionCriteria: "The user's preference is recognized and handled.",
        phase: "remember"
      },

      "general-priority": {
        goal: "Respond to the user’s actual request without over-interpreting.",
        obstacle: "Ari may not have enough signal for a deeper interpretation.",
        nextAction: clarityNeeded
          ? clarityQuestion || "Ask one focused clarifying question."
          : "Give a direct, useful response.",
        completionCriteria: "User gets either a useful answer or the one missing detail needed.",
        phase: clarityNeeded ? "clarify" : "respond"
      }
    };

    const priorityName = primaryPriority?.name || "general-priority";
    const base = templates[priorityName] || templates["general-priority"];

    return {
      goal: base.goal,
      obstacle: base.obstacle,
      nextAction: base.nextAction,
      completionCriteria: base.completionCriteria,
      followUpNeeded: Boolean(clarityNeeded),
      phase: base.phase,

      priority: priorityName,
      contractPrimary,
      responseShape,
      riskLevel,
      riskType,

      source: "ari-executive-function"
    };
  },

  createExecutiveAnswer({
    summary = {},
    contract = {},
    map = {},
    primaryPriority = {},
    secondaryPriorities = [],
    executiveState = {},
    responseStrategy = {}
  } = {}) {
    const raw = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const text = raw.toLowerCase();

    const hasMoney =
      text.includes("money") ||
      text.includes("expenses") ||
      text.includes("bills") ||
      text.includes("cost");

    const hasPregnancyOrPartner =
      text.includes("pregnant") ||
      text.includes("fiancée") ||
      text.includes("fiancee") ||
      text.includes("wife") ||
      text.includes("partner");

    const hasTimeTogether =
      text.includes("time together") ||
      text.includes("barely get time") ||
      text.includes("missing time") ||
      text.includes("regret") ||
      text.includes("weekend");

    const hasExtraShift =
      text.includes("extra shift") ||
      text.includes("pick up") ||
      text.includes("work this weekend") ||
      text.includes("shift this weekend");

    if (
      primaryPriority?.name === "planning" &&
      hasMoney &&
      hasPregnancyOrPartner &&
      hasTimeTogether
    ) {
      return [
        "The real priority is deciding which loss is harder to replace this weekend: the extra money or the time with her.",
        "If the shift solves an immediate financial problem, take it — but protect a specific block of time with her before or after the shift.",
        "If the money only helps a little, I’d lean toward saying no and spending the weekend with her. This pregnancy season is harder to get back than one extra shift."
      ].join("\n\n");
    }

    if (
      primaryPriority?.name === "planning" &&
      hasMoney &&
      hasExtraShift
    ) {
      return [
        "Treat this as a tradeoff, not a guilt test.",
        "If the extra shift meaningfully protects your finances, take it and plan recovery time afterward.",
        "If it only adds a small cushion, skip it and protect your time, energy, and relationships."
      ].join("\n\n");
    }

    if (primaryPriority?.name === "planning") {
      return [
        "The priority is to separate the real constraint from the pressure around it.",
        "Pick the option that prevents the highest-cost consequence first.",
        "Then handle the secondary issue with one smaller next step instead of trying to solve everything at once."
      ].join("\n\n");
    }

    if (primaryPriority?.name === "family") {
      return [
        "The protected priority is your family stability.",
        "Do not let a replaceable opportunity quietly take time from something you cannot easily recover.",
        "Choose the next step that protects the relationship while still respecting real responsibilities."
      ].join("\n\n");
    }

    if (primaryPriority?.name === "resources") {
      return [
        "The priority is protecting your resources without letting money become the only value in the room.",
        "Separate what is financially necessary from what simply feels responsible.",
        "Then choose the option that protects the real need, not just the pressure."
      ].join("\n\n");
    }

    if (primaryPriority?.name === "medical-context") {
      return (
        "This is medically relevant context, but it does not automatically make the whole question medical. Keep it in view, but answer the actual decision first."
      );
    }

    return executiveState.nextAction || null;
  },

  getThingsToDelay({
    primaryPriority = null,
    contractPrimary = null,
    summary = {},
    map = {},
    observerHierarchy = {}
  } = {}) {
    const delay = [];

    const addDelay = (name, reason) => {
      if (!delay.some(item => item.name === name)) {
        delay.push({ name, reason });
      }
    };

    if (["safety", "medical-body"].includes(primaryPriority?.name)) {
      addDelay(
        "meaning-making",
        "Do not interpret deeply until safety/body stability is addressed."
      );
      addDelay(
        "teaching-or-coaching",
        "Do not teach broadly before urgent stabilization."
      );
    }

    if (primaryPriority?.name === "direct-build-help") {
      addDelay(
        "life-chapter-interpretation",
        "Do not let uncertainty, identity, or life-chapter engines hijack a build/debug request."
      );
      addDelay(
        "emotional-processing",
        "Do not process emotion unless the user asks for it or emotion is explicitly active."
      );
    }

    if (primaryPriority?.name === "direct-teaching") {
      addDelay(
        "reflective-questioning",
        "Do not ask a recovery question when the user asked to learn something."
      );
    }

    if (primaryPriority?.name === "family") {
      addDelay(
        "nonessential-expansion",
        "Avoid adding major new commitments while family/caregiving is primary."
      );
    }

    if (primaryPriority?.name === "capacity-protection") {
      addDelay(
        "extra-goals",
        "Reduce load before adding more ambition."
      );
    }

    if (observerHierarchy.shouldAskClarifyingQuestion) {
      addDelay(
        "overconfident-answer",
        "Ask one clarifying question before strong direction."
      );
    }

    return delay;
  },

  getResponseStrategy({
    primaryPriority = null,
    executiveState = {},
    contractPrimary = null,
    clarityNeeded = false,
    responseShape = null
  } = {}) {
    const strategy = {
      mode: "respond_to_priority",
      shouldAskClarifyingQuestion: false,
      shouldComfort: false,
      shouldTeach: false,
      shouldChallenge: false,
      shouldCreatePlan: false,
      recommendedQuestion: null,
      firstMove: "answer_primary_lane",
      tone: "steady"
    };

    const name = primaryPriority?.name;

    if (name === "safety") {
      return {
        ...strategy,
        mode: "urgent_safety_support",
        shouldComfort: true,
        firstMove: "stabilize_and_direct_to_safety",
        tone: "calm_direct"
      };
    }

    if (name === "risk-clarification") {
      return {
        ...strategy,
        mode: "risk_clarification",
        shouldAskClarifyingQuestion: true,
        recommendedQuestion: executiveState.nextAction,
        firstMove: "ask_direct_safety_question",
        tone: "calm_direct"
      };
    }

    if (name === "medical-body") {
      return {
        ...strategy,
        mode: "stabilize_body_first",
        shouldComfort: true,
        firstMove: "body_truth_then_action",
        tone: "calm_practical"
      };
    }

    if (name === "medical-context") {
      return {
        ...strategy,
        mode: "medical_context_without_hijack",
        firstMove: "keep_medical_context_secondary",
        tone: "calm_practical"
      };
    }

    if (name === "direct-build-help") {
      return {
        ...strategy,
        mode: "build_or_debug",
        shouldCreatePlan: true,
        firstMove: "give_debug_path_or_request_code",
        tone: "direct_practical"
      };
    }

    if (name === "direct-teaching") {
      return {
        ...strategy,
        mode: "teach_clearly",
        shouldTeach: true,
        firstMove: "explain_directly",
        tone: "clear"
      };
    }

    if (name === "planning") {
      return {
        ...strategy,
        mode: "create_priority_structure",
        shouldCreatePlan: true,
        firstMove: "organize_next_steps",
        tone: "clear"
      };
    }

    if (name === "emotional-support") {
      return {
        ...strategy,
        mode: "support_before_solution",
        shouldComfort: true,
        firstMove: "validate_emotional_signal",
        tone: "gentle"
      };
    }

    if (name === "family") {
      return {
        ...strategy,
        mode: "protect_family_first",
        shouldComfort: true,
        shouldChallenge: true,
        firstMove: "name_protected_priority",
        tone: "warm_direct"
      };
    }

    if (name === "relationship") {
      return {
        ...strategy,
        mode: "protect_relationship_stability",
        shouldComfort: true,
        firstMove: "protect_connection",
        tone: "warm_grounded"
      };
    }

    if (name === "wisdom") {
      return {
        ...strategy,
        mode: "clarify_guiding_principle",
        shouldChallenge: true,
        firstMove: "name_tension",
        tone: "wise_direct"
      };
    }

    if (clarityNeeded) {
      return {
        ...strategy,
        mode: "clarify_before_advising",
        shouldAskClarifyingQuestion: true,
        recommendedQuestion: executiveState.nextAction,
        firstMove: "ask_one_focused_question",
        tone: "curious"
      };
    }

    return strategy;
  },

  getExecutiveDecision(primaryPriority = null, contractPrimary = null) {
    const name = primaryPriority?.name;

    const decisions = {
      safety: "protect_safety_first",
      "risk-clarification": "ask_risk_clarification_first",
      "medical-body": "stabilize_body_first",
      "medical-context": "keep_medical_context_secondary",
      "direct-build-help": "help_directly_with_build_or_debug",
      "direct-teaching": "teach_directly",
      planning: "create_priority_structure",
      "emotional-support": "support_before_solution",
      family: "protect_family_first",
      relationship: "protect_relationship_stability",
      wisdom: "clarify_guiding_principle",
      "memory-update": "acknowledge_memory_request",
      "capacity-protection": "reduce_load_immediately",
      "career-development": "continue_growth_with_limits",
      resources: "protect_resources",
      "general-priority": "prioritize_with_caution"
    };

    return decisions[name] || "prioritize_with_caution";
  },

  getRecommendedFocus(primaryPriority = null, executiveState = {}, thingsToDelay = []) {
    if (!primaryPriority) {
      return "Gather more context before making a decision.";
    }

    return `${executiveState.goal} Next action: ${executiveState.nextAction}`;
  },

  mapHierarchyToPriority(primaryObservation, category) {
    const map = {
      safety_or_urgent_risk: "safety",
      provider_vs_present_parent: "family",
      ambition_vs_presence: "family",
      future_regret_risk: "wisdom",
      opportunity_cost: "planning",
      burnout_risk: "capacity-protection",
      emotional_pain: "emotional-support",
      needs_plan_or_priority: "planning",
      fatherhood_transition: "family",
      pregnancy_transition: "family",
      engagement_and_wedding_transition: "relationship",
      marriage_transition: "relationship",
      military_to_civilian_transition: "career-development",
      career_transition: "career-development",
      builder_founder_transition: "direct-build-help"
    };

    if (map[primaryObservation]) return map[primaryObservation];

    const categoryMap = {
      safety: "safety",
      core_conflict: "wisdom",
      long_term_consequence: "wisdom",
      tradeoff: "planning",
      capacity: "capacity-protection",
      life_chapter: "wisdom",
      emotion: "emotional-support",
      planning: "planning",
      request: "direct-build-help"
    };

    return categoryMap[category] || "general-priority";
  },

  getReasoning({
    primaryPriority = null,
    priorities = [],
    contractPrimary = null,
    executiveState = {}
  } = {}) {
    if (!primaryPriority) {
      return "No clear executive priority emerged.";
    }

    return `Ari selected '${primaryPriority.name}' because it scored highest. Contract primary: ${
      contractPrimary || "none"
    }. Executive goal: ${executiveState.goal}`;
  }
};