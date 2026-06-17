// ari/reasoning/ari-reasoning-engine.js
// Ari Reasoning Engine
// Purpose: Universal case-model reasoning. Composer owns final wording.
// V7.2.1 — Universal Case Builder

window.Ari = window.Ari || {};

window.AriReasoningEngine = {
  version: "7.2.1",


create(input = {}) {
  const summary = input.summary || input || {};
  const contract = summary.situationContract || {};
  const executive = summary.executiveState || {};
  const observations = summary.observations || summary.observationLedger || [];

  const primary =
    summary.situationContractPrimary ||
    contract.primary ||
    summary.triagePrimaryLane ||
    "general_understanding";

  // CHARACTER SELF-DISCLOSURE GUARDRAIL
  // Reasoning does not answer Ari-self / belief / identity questions.
  // Character Context owns that lane.
  if (
    summary.characterContext?.characterMode === "ari_self_disclosure" ||
    summary.characterMode === "ari_self_disclosure" ||
    summary.conversationType === "ari_self_or_perspective_question"
  ) {
    return {
      reasoningEngineRan: true,
      reasoningEngineVersion: this.version,
      reasoningSource: "ari-reasoning-engine",
      reasoning: {
        version: this.version,
        source: "ari-reasoning-engine",
        primary,
        role: "defer_to_character_context",
        reason:
          "User is asking Ari about Ari. Character Context owns self-disclosure.",
        relevantFacts: [],
        assumptions: [],
        tradeoffs: [],
        counterfactuals: [],
        likelyOutcomes: [],
        valueConflicts: [],
        systemsView: {},
        regretLens: {},
        recommendation: null,
        confidence: { score: 95, level: "high" },
        answer: null,
        obeyedContract: true,
        contractViolations: []
      },
      reasoningAnswer: null,
      reasoningRecommendation: null,
      reasoningConfidence: 95,
      reasoningPrimary: primary
    };
  }

  const reasoning = this.blankReasoning({ primary, contract, executive });

    this.addRelevantFacts(reasoning, summary, observations);
    const reasoningFrame = this.resolveReasoningFrame(summary, primary);
reasoning.reasoningFrame = reasoningFrame;

if (reasoningFrame === "relationship_or_family_reasoning") {
  this.buildRelationshipFamilyCaseModel(reasoning, summary, primary);
} else {
  this.buildUniversalCaseModel(reasoning, summary, primary);
}
    if (reasoningFrame !== "relationship_or_family_reasoning") {
  this.buildKnownInferredUnknown(reasoning, summary, primary);
  this.buildOptions(reasoning, summary, primary);
  this.buildConsequences(reasoning, summary, primary);
  this.addTradeoffs(reasoning, summary, primary);
  this.addCounterfactuals(reasoning, summary, primary);
  this.addSystemsView(reasoning, summary, primary);
  this.addRegretLens(reasoning, summary, primary);
  this.buildRejectedAlternatives(reasoning, summary, primary);
  this.synthesizeRecommendation(reasoning, summary, primary);
  this.buildCoreJudgment(reasoning, summary, primary);
}
    this.buildExecutiveConclusion(reasoning, summary, primary, contract);
    this.scoreConfidence(reasoning, summary, primary);
    this.finalize(reasoning);

    return {
      reasoningEngineRan: true,
      reasoningEngineVersion: this.version,
      reasoningSource: "ari-reasoning-engine",
      reasoning,
      reasoningAnswer: null,
      reasoningRecommendation: reasoning.recommendation?.summary || null,
      reasoningConfidence: reasoning.confidence?.score ?? null,
      reasoningPrimary: primary
    };
  },

  blankReasoning({ primary, contract, executive }) {
    return {
      version: this.version,
      source: "ari-reasoning-engine",

      primary,
      contractPrimary: contract.primary || primary,
      responseShape: contract.responseShape || null,

      reasoningMode: "universal_case_builder",

      caseModel: {
        situation: null,
        userGoal: null,
        currentState: null,
        desiredState: null,
        obstacle: null,
        constraints: [],
        resources: [],
        timeline: null,
        risks: [],
        unknowns: [],
        tensions: [],
        priorities: [],
        options: [],
        consequences: [],
        nextAction: null
      },

      universalSignals: {},
      decisionPattern: null,

      knownFacts: [],
      inferredFacts: [],
      unknowns: [],
      changeConditions: [],

      relevantFacts: [],
      assumptions: [],
      missingInformation: [],

      options: [],
      tradeoffs: [],
      counterfactuals: [],
      likelyOutcomes: [],

      priorityStack: [],
      protectedObligations: [],
      delayOrDecline: [],
      rejectedAlternatives: [],

      systemsView: {
        upstream: [],
        downstream: [],
        feedbackLoops: [],
        secondOrderEffects: []
      },

      valueConflicts: [],

      regretLens: {
        shortTerm: null,
        longTerm: null,
        irreversibleLosses: [],
        reversibleLosses: [],
        regretRisk: "unknown"
      },

      coreJudgment: null,

      recommendation: {
        summary: null,
        rationale: [],
        alternatives: []
      },

      executiveConclusion: {
        primary,
        framing: null,
        recommendation: null,
        keyReason: null,
        keyTradeoff: null,
        uncertainty: null,
        nextStep: null,
        mustInclude: [],
        mustAvoid: [],
        obeysContract: true
      },

      confidence: {
        score: 0,
        level: "low",
        reasons: [],
        uncertaintyDrivers: []
      },

      answer: null,
      obeyedContract: true,
      contractViolations: [],

      debug: {
        executiveGoal: executive.goal || null,
        executiveNextAction: executive.nextAction || null
      }
    };
  },

  buildUniversalCaseModel(reasoning, summary, primary) {
    const text = this.getText(summary);
    const observations = reasoning.relevantFacts || [];
    const model = reasoning.caseModel;

    model.situation = this.describeSituation(summary, primary);
    model.userGoal = this.inferGoal(text, observations, primary);
    model.currentState = this.inferCurrentState(text, observations, primary);
    model.desiredState = this.inferDesiredState(text, observations, primary);
    model.obstacle = this.inferObstacle(text, observations, primary);
    model.constraints = this.inferConstraints(text, observations, primary);
    model.resources = this.inferResources(text, observations, primary);
    model.timeline = this.inferTimeline(text, observations, primary);
    model.risks = this.inferRisks(text, observations, primary);
    model.unknowns = this.inferUnknowns(text, observations, primary, model);
    model.tensions = this.inferTensions(text, observations, primary, model);
    model.priorities = this.inferPriorities(text, observations, primary, model);
    model.options = this.inferUniversalOptions(text, observations, primary, model);
    model.consequences = this.inferUniversalConsequences(text, observations, primary, model);
    model.nextAction = this.inferNextAction(text, observations, primary, model);

    this.mirrorCaseModelToLegacyFields(reasoning, model, primary);
  },

  describeSituation(summary, primary) {
    const text = this.getOriginalText(summary);

    if (primary === "teacher") return "The user wants to understand or learn something.";
    if (primary === "builder") return "The user wants to build, fix, debug, or improve something.";
    if (primary === "medical_body") return "The user is asking about a body or health-related concern.";
    if (primary === "safety") return "The user may be dealing with a safety-critical situation.";
    if (primary === "emotion") return "The user is expressing an emotional state or relational need.";
    if (primary === "executive_decision") return "The user is trying to choose what to do under constraints.";

    return text ? `The user is asking about: ${text}` : "The user is asking for help.";
  },

  inferGoal(text, observations, primary) {
    if (primary === "teacher") return "understand the topic clearly";
    if (primary === "builder") return "make the thing work or improve it";
    if (primary === "medical_body") return "protect health and decide the safest next step";
    if (primary === "safety") return "reduce immediate danger";
    if (primary === "emotion") return "feel understood, grounded, or less alone";
    if (primary === "executive_decision") return "choose the best next move";

    if (this.hasQuestionIntent(text)) return "get a clear answer";
    return "make sense of the situation";
  },

  inferCurrentState(text, observations, primary) {
    const facts = observations.map(o => o.fact).filter(Boolean).slice(0, 5);
    if (facts.length) return `Known signals: ${facts.join(", ")}`;
    return primary === "general_understanding"
      ? "not enough specific context yet"
      : `active lane: ${primary}`;
  },

  inferDesiredState(text, observations, primary) {
    if (primary === "executive_decision") return "a decision that protects the highest-priority constraint while preserving useful options";
    if (primary === "builder") return "a working, testable fix";
    if (primary === "teacher") return "clear understanding";
    if (primary === "emotion") return "emotional grounding";
    if (primary === "medical_body" || primary === "safety") return "stabilization and appropriate escalation";
    return "clarity";
  },

  inferObstacle(text, observations, primary) {
    if (primary === "executive_decision") {
      if (this.hasTradeoffShape(text)) return "competing goals under limited resources or capacity";
      return "not enough information to compare options fully";
    }

    if (primary === "builder") return "a failure, missing step, unclear implementation, or broken behavior";
    if (primary === "teacher") return "knowledge gap";
    if (primary === "emotion") return "emotional load or unclear underlying need";
    if (primary === "medical_body" || primary === "safety") return "possible risk that should not be minimized";

    return "missing information or unclear goal";
  },

  inferConstraints(text, observations, primary) {
    const constraints = [];

    if (this.hasTimeline(text)) constraints.push("time constraint");
    if (this.hasResourceLimit(text)) constraints.push("limited resources");
    if (this.hasObligationLanguage(text)) constraints.push("existing obligation");
    if (this.hasRiskLanguage(text)) constraints.push("risk exposure");
    if (this.hasCapacityLanguage(text)) constraints.push("limited personal capacity");
    if (primary === "medical_body" || primary === "safety") constraints.push("safety must outrank convenience");

    return constraints;
  },

  inferResources(text, observations, primary) {
    const resources = [];

    if (this.hasMoneyLanguage(text)) resources.push("money or budget");
    if (this.hasTimeLanguage(text)) resources.push("time");
    if (this.hasPeopleLanguage(text)) resources.push("support from other people");
    if (primary === "builder") resources.push("code, tools, logs, screenshots, tests");
    if (primary === "teacher") resources.push("explanation, examples, analogies");

    return resources;
  },

  inferTimeline(text, observations, primary) {
    if (this.hasAny(text, ["today", "tonight", "now", "right now", "urgent", "immediately"])) return "immediate";
    if (this.hasAny(text, ["tomorrow", "this week", "next week"])) return "near_term";
    if (this.hasAny(text, ["next month", "in a month", "within a month", "30 days"])) return "next_month";
    if (this.hasAny(text, ["this year", "next year", "long term", "eventually"])) return "longer_term";
    return null;
  },

  inferRisks(text, observations, primary) {
    const risks = [];

    if (primary === "medical_body") risks.push("health risk if symptoms are severe, worsening, or high-risk");
    if (primary === "safety") risks.push("immediate harm or escalation");
    if (this.hasMoneyLanguage(text)) risks.push("financial strain");
    if (this.hasRelationshipLanguage(text)) risks.push("relationship strain");
    if (this.hasWorkLanguage(text)) risks.push("career or work consequences");
    if (this.hasHealthLanguage(text)) risks.push("health or body consequences");
    if (this.hasDeadlineLanguage(text)) risks.push("missed deadline or reduced options");

    return risks;
  },

  inferUnknowns(text, observations, primary, model) {
    const unknowns = [];

    if (primary === "executive_decision") {
      unknowns.push("exact cost or benefit of each option");
      unknowns.push("which constraints are flexible versus non-negotiable");
      unknowns.push("what outcome matters most to the user");
    }

    if (primary === "builder") {
      unknowns.push("exact failure point");
      unknowns.push("current code or environment details");
    }

    if (primary === "medical_body") {
      unknowns.push("severity, duration, associated symptoms, and risk factors");
    }

    if (primary === "emotion") {
      unknowns.push("whether the feeling is physical, emotional, situational, or relational");
    }

    return unknowns;
  },

  inferTensions(text, observations, primary, model) {
    const tensions = [];

    if (this.hasTradeoffShape(text)) {
      tensions.push({
        name: "competing_priorities",
        sideA: "one desired outcome",
        sideB: "another important need or constraint",
        meaning: "the user cannot optimize both without choosing a priority or redesigning the plan"
      });
    }

    if (this.hasMoneyLanguage(text) && this.hasEnjoymentLanguage(text)) {
      tensions.push({
        name: "enjoyment_now_vs_financial_preparation",
        sideA: "enjoyment or optional spending now",
        sideB: "preserving money for a near-term practical goal",
        meaning: "pleasure must be sized around the necessary financial target"
      });
    }

    if (this.hasTimeLanguage(text) && this.hasObligationLanguage(text)) {
      tensions.push({
        name: "available_time_vs_obligation",
        sideA: "what the user wants to do",
        sideB: "what the user needs to protect or complete",
        meaning: "time-sensitive obligations should usually be protected first"
      });
    }

    if (!tensions.length && primary === "executive_decision") {
      tensions.push({
        name: "choice_under_uncertainty",
        sideA: "acting now",
        sideB: "waiting for more clarity",
        meaning: "the best move should preserve options while reducing risk"
      });
    }

    return tensions;
  },

  inferPriorities(text, observations, primary, model) {
    const priorities = [];

    if (primary === "safety") {
      priorities.push({
        priority: "immediate_safety",
        label: "immediate safety",
        reason: "harm prevention outranks comfort, convenience, or deeper interpretation"
      });
      return priorities;
    }

    if (primary === "medical_body") {
      priorities.push({
        priority: "health_stabilization",
        label: "health and body safety",
        reason: "possible medical risk should be ruled out before treating it like a normal decision"
      });
      return priorities;
    }

    if (model.timeline === "immediate" || model.timeline === "near_term" || model.timeline === "next_month") {
      priorities.push({
        priority: "time_sensitive_goal",
        label: "the time-sensitive goal",
        reason: "near-term deadlines reduce flexibility and should be protected first"
      });
    }

    if (this.hasMoneyLanguage(text)) {
      priorities.push({
        priority: "financial_stability",
        label: "financial stability",
        reason: "money constraints can limit future options if ignored"
      });
    }

    if (this.hasObligationLanguage(text)) {
      priorities.push({
        priority: "existing_obligation",
        label: "the existing obligation",
        reason: "something already committed or necessary usually outranks optional additions"
      });
    }

    if (!priorities.length && primary === "executive_decision") {
      priorities.push({
        priority: "option_preservation",
        label: "preserving options",
        reason: "when facts are incomplete, the first move should reduce risk without closing doors too early"
      });
    }

    return priorities;
  },

  inferUniversalOptions(text, observations, primary, model) {
    if (primary === "teacher") {
      return [
        { option: "Explain simply", pros: ["clear understanding"], cons: [], reversibility: "high", judgment: "best default" }
      ];
    }

    if (primary === "emotion") {
      return [
        { option: "Validate and ground", pros: ["helps the user feel steadier"], cons: ["may not solve the practical issue yet"], reversibility: "high", judgment: "best first move" }
      ];
    }

    if (primary === "medical_body" || primary === "safety") {
      return [
        { option: "Escalate if red flags are present", pros: ["protects safety"], cons: ["may feel inconvenient"], reversibility: "high", judgment: "best when risk is uncertain or severe" },
        { option: "Monitor only", pros: ["less disruption"], cons: ["could miss serious risk"], reversibility: "medium", judgment: "only reasonable when symptoms are mild and clearly improving" }
      ];
    }

    if (primary === "builder") {
      return [
        { option: "Inspect the failure point", pros: ["finds the actual bug"], cons: ["takes a little more work"], reversibility: "high", judgment: "best first step" },
        { option: "Patch based on guess", pros: ["fast"], cons: ["may create new bugs"], reversibility: "medium", judgment: "weaker unless evidence is strong" }
      ];
    }

    if (primary === "executive_decision") {
      return [
        {
          option: "Proceed fully",
          pros: ["gets the desired benefit now"],
          cons: ["may strain the limiting constraint"],
          reversibility: "variable",
          judgment: "only best if it does not violate the top priority"
        },
        {
          option: "Delay or pause",
          pros: ["protects resources and reduces risk"],
          cons: ["may lose some opportunity or enjoyment"],
          reversibility: "medium",
          judgment: "best when the constraint is serious and near-term"
        },
        {
          option: "Resize or modify the plan",
          pros: ["preserves part of the benefit while protecting the constraint"],
          cons: ["requires compromise"],
          reversibility: "high",
          judgment: "often the best first move when both sides matter"
        },
        {
          option: "Protect the top priority first, then use leftover capacity",
          pros: ["prevents the most costly failure"],
          cons: ["may limit the optional goal"],
          reversibility: "high",
          judgment: "best default when one goal is time-sensitive or necessary"
        }
      ];
    }

    return [
      {
        option: "Answer directly with current information",
        pros: ["useful now"],
        cons: ["may miss hidden context"],
        reversibility: "high",
        judgment: "reasonable default"
      }
    ];
  },

  inferUniversalConsequences(text, observations, primary, model) {
    return (model.options || []).map(option => ({
      option: option.option,
      likelyOutcome: this.predictOutcome(option, model, primary),
      riskLevel: this.estimateOptionRisk(option, model, primary)
    }));
  },

  inferNextAction(text, observations, primary, model) {
    if (primary === "executive_decision") {
      if (this.hasMoneyLanguage(text)) {
        return "Calculate the required amount for the time-sensitive goal first, then cap the optional plan using only what safely remains.";
      }

      return "Identify the top constraint, then choose the option that protects it while preserving the most flexibility.";
    }

    if (primary === "builder") return "Find the exact failure point first, then make the smallest targeted fix.";
    if (primary === "teacher") return "Give a clear explanation with an example.";
    if (primary === "emotion") return "Name the feeling briefly, ground the user, then ask one useful question.";
    if (primary === "medical_body") return "Check for red flags and escalate if symptoms are severe, worsening, or high-risk.";
    if (primary === "safety") return "Move toward immediate safety and get help if there is active danger.";

    return "Answer the main question directly.";
  },

  mirrorCaseModelToLegacyFields(reasoning, model, primary) {
    if (model.userGoal) this.add(reasoning.knownFacts, `Goal: ${model.userGoal}`);
    if (model.currentState) this.add(reasoning.knownFacts, `Current state: ${model.currentState}`);
    if (model.obstacle) this.add(reasoning.inferredFacts, `Obstacle: ${model.obstacle}`);

    model.constraints.forEach(item => this.add(reasoning.knownFacts, `Constraint: ${item}`));
    model.resources.forEach(item => this.add(reasoning.knownFacts, `Resource: ${item}`));
    model.risks.forEach(item => this.add(reasoning.knownFacts, `Risk: ${item}`));
    model.unknowns.forEach(item => this.add(reasoning.unknowns, item));

    model.priorities.forEach(item => this.add(reasoning.priorityStack, item));
    model.options.forEach(item => this.add(reasoning.options, item));

    model.consequences.forEach(item => {
      this.add(reasoning.likelyOutcomes, {
        outcome: `${item.option}: ${item.likelyOutcome}`,
        probability: item.riskLevel === "high" ? "medium_high" : "medium"
      });
    });

    model.tensions.forEach(item => {
      this.add(reasoning.tradeoffs, {
        name: item.name,
        sideA: item.sideA,
        sideB: item.sideB,
        likelyWinner: model.priorities?.[0]?.priority || "depends_on_constraints"
      });
    });
  },

  buildKnownInferredUnknown(reasoning, summary, primary) {
    const model = reasoning.caseModel || {};

    if (primary === "executive_decision") {
      this.add(reasoning.assumptions, {
        assumption: "The user wants a recommendation, not just reflection.",
        confidence: 0.9,
        risk: "low",
        because: ["The prompt asks what to do."]
      });

      this.add(reasoning.changeConditions, "The recommendation changes if the top constraint is more flexible than it appears.");
      this.add(reasoning.changeConditions, "The recommendation changes if the optional choice has a deadline or consequence not yet mentioned.");
    }

    if (primary === "builder") {
      this.add(reasoning.changeConditions, "The recommendation changes if the actual error appears in a different file or layer.");
    }

    if (primary === "medical_body") {
      this.add(reasoning.changeConditions, "The recommendation changes based on severity, duration, pregnancy status, bleeding, fever, fainting, chest pain, breathing trouble, or worsening symptoms.");
    }

    reasoning.changeConditions.forEach(item => this.add(reasoning.unknowns, item));
  },

  buildOptions(reasoning, summary, primary) {
    // Options are now created by the universal case model.
    // This method remains for pipeline compatibility.
  },

  buildConsequences(reasoning, summary, primary) {
    // Consequences are now created by the universal case model.
    // This method remains for clarity and future expansion.
  },

  addTradeoffs(reasoning, summary, primary) {
    // Tradeoffs are mirrored from caseModel.tensions.
    // Add one universal fallback if executive decision has no tradeoff.
    if (primary === "executive_decision" && reasoning.tradeoffs.length === 0) {
      this.add(reasoning.tradeoffs, {
        name: "benefit_vs_constraint",
        sideA: "the desired benefit",
        sideB: "the limiting constraint",
        likelyWinner: "protect_the_constraint_first"
      });
    }
  },

  addCounterfactuals(reasoning, summary, primary) {
    reasoning.options.forEach(option => {
      this.add(reasoning.counterfactuals, {
        option: option.option,
        benefits: option.pros || [],
        costs: option.cons || [],
        reversibility: option.reversibility || "unknown",
        bestWhen: option.judgment || "depends on constraints"
      });
    });
  },

  addSystemsView(reasoning, summary, primary) {
    if (primary === "executive_decision") {
      reasoning.systemsView.upstream.push(
        "The decision is shaped by goals, constraints, timeline, and available resources."
      );

      reasoning.systemsView.downstream.push(
        "Choosing one option changes what remains possible for the others."
      );

      if (reasoning.caseModel?.constraints?.length) {
        reasoning.systemsView.secondOrderEffects.push(
          "Ignoring the main constraint can create follow-on stress or reduce future options."
        );
      }
    }

    if (primary === "builder") {
      reasoning.systemsView.upstream.push(
        "A visible bug usually comes from an earlier mismatch in data, state, rendering, or control flow."
      );

      reasoning.systemsView.downstream.push(
        "A broad patch can hide the bug temporarily while creating later instability."
      );
    }
  },

  addRegretLens(reasoning, summary, primary) {
    const model = reasoning.caseModel || {};

    if (primary === "executive_decision") {
      reasoning.regretLens.shortTerm =
        "Choosing the disciplined option may feel disappointing in the moment.";

      reasoning.regretLens.longTerm =
        "The bigger regret risk is usually failing the time-sensitive or necessary goal for an optional benefit that could be resized.";

      reasoning.regretLens.regretRisk =
        "sacrificing_a_higher_priority_constraint_for_a_lower_priority_benefit";

      if (model.timeline) {
        reasoning.regretLens.irreversibleLosses.push(
          "A near-term deadline can reduce flexibility if missed."
        );
      }

      reasoning.regretLens.reversibleLosses.push(
        "Optional plans can often be resized, delayed, or redesigned."
      );
    }
  },

  buildRejectedAlternatives(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;

    reasoning.options.forEach(option => {
      if (option.option === "Proceed fully") {
        this.add(reasoning.rejectedAlternatives, {
          alternative: option.option,
          rejectedBecause: "it may violate the top constraint if done before protecting the necessary goal."
        });
      }

      if (option.option === "Delay or pause") {
        this.add(reasoning.rejectedAlternatives, {
          alternative: option.option,
          rejectedBecause: "it may be too conservative if the plan can be resized instead of canceled."
        });
      }
    });
  },

  synthesizeRecommendation(reasoning, summary, primary) {
    if (reasoning.reasoningFrame === "relationship_or_family_reasoning") {

    return;
    }
    const model = reasoning.caseModel || {};
    const topPriority = model.priorities?.[0];

    if (primary === "teacher") {
      reasoning.recommendation.summary = "teach the topic directly and simply.";
      reasoning.recommendation.alternatives = ["Define it first, then explain the steps with an example."];
      return;
    }

    if (primary === "builder") {
      reasoning.recommendation.summary =
        "find the exact failure point first, then make the smallest targeted fix.";
      reasoning.recommendation.alternatives = [
        "Check inputs, state, console errors, and the last layer that produces the visible output."
      ];
      return;
    }

    if (primary === "medical_body") {
      reasoning.recommendation.summary =
        "treat safety as the first priority and escalate if symptoms are severe, worsening, or high-risk.";
      reasoning.recommendation.alternatives = [
        "Check red flags first, then decide whether home care is appropriate."
      ];
      return;
    }

    if (primary === "safety") {
      reasoning.recommendation.summary =
        "prioritize immediate safety before explanation, debate, or long-term planning.";
      reasoning.recommendation.alternatives = [
        "Move away from danger and contact appropriate help if there is active risk."
      ];
      return;
    }

    if (primary === "emotion") {
      reasoning.recommendation.summary =
        "validate briefly, name the signal, and help the user ground before solving.";
      reasoning.recommendation.alternatives = [
        "Ask one focused question if more context is needed."
      ];
      return;
    }

    if (primary === "executive_decision") {
      if (this.hasMoneyLanguage(this.getText(summary)) && model.timeline) {
        reasoning.recommendation.summary =
          "protect the time-sensitive financial goal first, then resize the optional plan around what safely remains.";

        reasoning.recommendation.alternatives = [
          model.nextAction ||
          "Calculate the required amount first, then cap the optional plan from leftover money."
        ];
        return;
      }

      reasoning.recommendation.summary =
        topPriority
          ? `protect ${topPriority.label} first, then choose the option that preserves the most flexibility.`
          : "protect the main constraint first, then choose the option that preserves the most flexibility.";

      reasoning.recommendation.alternatives = [
        model.nextAction || "Identify the main constraint, compare options, and take the lowest-regret next step."
      ];
      return;
    }

    reasoning.recommendation.summary = "answer the user's main question directly.";
  },

  buildCoreJudgment(reasoning, summary, primary) {
    if (reasoning.reasoningFrame === "relationship_or_family_reasoning") {
    return;
  }
    const model = reasoning.caseModel || {};
    const tension = model.tensions?.[0];
    const priority = model.priorities?.[0];

    if (primary === "executive_decision") {
      reasoning.coreJudgment =
        priority
          ? `The deciding factor is ${priority.label}: ${priority.reason}.`
          : "The deciding factor is the constraint that would be most costly to violate.";
      return;
    }

    if (primary === "builder") {
      reasoning.coreJudgment =
        "Do not patch randomly; locate the exact layer where the expected output changes into the wrong output.";
      return;
    }

    if (primary === "teacher") {
      reasoning.coreJudgment =
        "The user needs clear explanation, not reflection or decision support.";
      return;
    }

    reasoning.coreJudgment = tension
      ? `The central tension is ${tension.sideA} versus ${tension.sideB}.`
      : null;
  },

  buildExecutiveConclusion(reasoning, summary, primary, contract = {}) {
    const rec = reasoning.recommendation || {};
    const firstPriority = reasoning.priorityStack?.[0] || null;
    const firstTradeoff = reasoning.tradeoffs?.[0] || null;
    const nextStep =
      reasoning.caseModel?.nextAction ||
      rec.alternatives?.[0] ||
      null;

    reasoning.executiveConclusion = {
      primary,
      framing: reasoning.coreJudgment,
      recommendation: rec.summary || null,
      keyReason: firstPriority
        ? `${firstPriority.label} comes first because ${firstPriority.reason}.`
        : null,
      keyTradeoff: firstTradeoff || null,
      uncertainty: reasoning.changeConditions?.[0] || reasoning.unknowns?.[0] || null,
      nextStep,
      mustInclude: [
        ...(contract.responseRules || []),
        ...(contract.mouthDirective?.required || [])
      ],
      mustAvoid: [...(contract.blocked || [])],
      obeysContract: true
    };
  },

  scoreConfidence(reasoning, summary, primary) {
    let score = 50;

    if (reasoning.caseModel?.userGoal) score += 8;
    if (reasoning.caseModel?.constraints?.length) score += 8;
    if (reasoning.caseModel?.tensions?.length) score += 8;
    if (reasoning.options.length > 0) score += 8;
    if (reasoning.tradeoffs.length > 0) score += 8;
    if (reasoning.priorityStack.length > 0) score += 8;
    if (reasoning.recommendation?.summary) score += 8;
    if (reasoning.unknowns.length > 3) score -= 8;

    reasoning.confidence.score = this.clamp(score, 0, 100);
    reasoning.confidence.level =
      reasoning.confidence.score >= 85 ? "high" :
      reasoning.confidence.score >= 65 ? "medium" :
      "low";

    reasoning.confidence.reasons.push(
      "Judgment was based on universal case structure: goal, constraint, tension, options, consequences, priority, and next action."
    );

    if (reasoning.unknowns.length) {
      reasoning.confidence.uncertaintyDrivers.push(...reasoning.unknowns.slice(0, 4));
    }
  },

  finalize(reasoning) {
    reasoning.relevantFacts = this.uniqueObjects(reasoning.relevantFacts, "fact");
    reasoning.assumptions = this.uniqueObjects(reasoning.assumptions, "assumption");
    reasoning.options = this.uniqueObjects(reasoning.options, "option");
    reasoning.tradeoffs = this.uniqueObjects(reasoning.tradeoffs, "name");
    reasoning.counterfactuals = this.uniqueObjects(reasoning.counterfactuals, "option");
    reasoning.likelyOutcomes = this.uniqueObjects(reasoning.likelyOutcomes, "outcome");
    reasoning.valueConflicts = this.uniqueObjects(reasoning.valueConflicts, "conflict");
    reasoning.priorityStack = this.uniqueObjects(reasoning.priorityStack, "priority");
    reasoning.protectedObligations = this.uniqueObjects(reasoning.protectedObligations, "obligation");
    reasoning.delayOrDecline = this.uniqueObjects(reasoning.delayOrDecline, "item");
    reasoning.rejectedAlternatives = this.uniqueObjects(reasoning.rejectedAlternatives, "alternative");

    reasoning.knownFacts = [...new Set(reasoning.knownFacts)];
    reasoning.inferredFacts = [...new Set(reasoning.inferredFacts)];
    reasoning.unknowns = [...new Set(reasoning.unknowns)];
    reasoning.changeConditions = [...new Set(reasoning.changeConditions)];

    reasoning.answer = null;
    reasoning.obeyedContract = true;
    reasoning.contractViolations = [];
  },

  addRelevantFacts(reasoning, summary, observations = []) {
    observations.forEach(obs => {
      if (!obs?.value) return;

      this.add(reasoning.relevantFacts, {
        fact: String(obs.value),
        evidence: obs.evidence || obs.value,
        type: obs.type || "observation",
        confidence: obs.confidence ?? null
      });
    });
  },

  predictOutcome(option, model, primary) {
    if (!option) return "unknown outcome";

    if (option.option === "Protect the top priority first, then use leftover capacity") {
      return "the highest-risk failure is avoided while preserving some flexibility for the secondary goal";
    }

    if (option.option === "Resize or modify the plan") {
      return "both goals may be partly preserved with less risk";
    }

    if (option.option === "Proceed fully") {
      return "the user gets the immediate benefit but may strain the main constraint";
    }

    if (option.option === "Delay or pause") {
      return "risk decreases, but the desired benefit may be reduced or postponed";
    }

    return option.judgment || "outcome depends on the missing facts";
  },

  estimateOptionRisk(option, model, primary) {
    if (!option) return "unknown";
    if (option.option === "Proceed fully" && model.constraints?.length) return "high";
    if (option.option === "Protect the top priority first, then use leftover capacity") return "low";
    if (option.option === "Resize or modify the plan") return "low_medium";
    if (option.option === "Delay or pause") return "medium";
    return "medium";
  },

  resolveReasoningFrame(summary = {}, primary = "") {
    const contract = summary.situationContract || {};
    const map = summary.situationMap || {};

    const domains = [
      ...(map.domains || []),
      ...(summary.situationMapDomains || [])
    ];

    const support = [
      ...(contract.support || []),
      ...(summary.situationContractSupport || []),
      ...(map.supportLanes || []),
      ...(map.supportLaneSuggestions || [])
    ];

    const conversationType = summary.conversationType || "";
    const text = this.getText(summary);

    const relationshipCluster =
      domains.includes("relationship_context_domain") ||
      domains.includes("family_context_domain") ||
      support.includes("relationship") ||
      support.includes("family") ||
      conversationType === "relationship_or_family_context" ||
      this.hasRelationshipMeaning(text);

    if (
      primary === "executive_decision" &&
      relationshipCluster
    ) {
      return "relationship_or_family_reasoning";
    }

    return "universal_case_builder";
  },

  hasRelationshipMeaning(text = "") {
    return this.hasAny(text, [
      "spouse",
      "wife",
      "husband",
      "partner",
      "girlfriend",
      "boyfriend",
      "kids",
      "children",
      "family",
      "honest",
      "honesty",
      "trust",
      "upset",
      "hurt",
      "angry at me",
      "mad at me",
      "tell them",
      "haven't told",
      "didn't tell"
    ]);
  },

  buildRelationshipFamilyCaseModel(reasoning, summary, primary) {
  const text = this.getText(summary);
  const model = reasoning.caseModel;

  reasoning.reasoningMode = "relationship_family_case_builder";

  const hasTruthIssue = this.hasAny(text, [
    "honest", "honesty", "lied", "lie", "truth", "told", "haven't told",
    "didn't tell", "secret", "hide", "hiding", "withheld"
  ]);

  const hasDecisionIssue = this.hasAny(text, [
    "move", "promotion", "job", "career", "money", "leave", "stay",
    "choose", "decision", "should i", "what should"
  ]);

  const hasEmotionIssue = this.hasAny(text, [
    "upset", "hurt", "angry", "mad", "sad", "scared", "worried",
    "distant", "quiet", "cold", "avoid"
  ]);

  model.situation =
    "The user is trying to understand a relationship or family reaction and choose a response that protects trust.";

  model.userGoal =
    "understand what may be driving the other person's reaction without assuming certainty";

  model.currentState =
    "there is incomplete information about the other person's inner state.";

  model.desiredState =
    "respond with honesty, accountability, and curiosity instead of defensiveness.";

  model.obstacle =
    "the visible issue may not be the only issue; the reaction may involve fear, trust, timing, control, respect, or feeling excluded.";

  model.constraints = [
    "do not claim certainty about another person's feelings",
    "protect trust before trying to win the argument",
    "separate the practical issue from the emotional impact",
    "own the user's part without taking responsibility for everything"
  ];

  model.resources = [
    "honest conversation",
    "asking directly",
    "naming uncertainty",
    "taking responsibility where appropriate",
    "listening before defending"
  ];

  model.risks = [
    "assuming one cause too quickly",
    "defending the practical decision before repairing trust",
    "minimizing the other person's reaction",
    "turning a relationship question into only a logic problem"
  ];

  model.unknowns = [
    "what the other person has actually said",
    "what emotion is strongest for them",
    "whether they are reacting to the event, the timing, the communication, or feeling excluded",
    "what repair would make them feel respected"
  ];

  model.tensions = [
    {
      name: "surface_issue_vs_relationship_impact",
      sideA: "the visible practical issue",
      sideB: "the emotional or trust impact underneath it",
      meaning:
        "the practical issue may be real, but the relationship impact often determines how the conversation goes"
    }
  ];

  model.priorities = [
    {
      priority: "relationship_repair",
      label: "relationship repair",
      reason:
        "when another person's reaction is unclear, trust and understanding should come before explanation or defense"
    }
  ];

  if (hasTruthIssue) {
    model.priorities.unshift({
      priority: "truth_and_accountability",
      label: "truth and accountability",
      reason:
        "when honesty is involved, owning the communication gap is usually the safest first move"
    });
  }

  model.options = [
    {
      option: "Assume the reaction is only about the practical issue",
      pros: ["keeps the conversation simple"],
      cons: ["may miss the emotional or trust injury"],
      reversibility: "medium",
      judgment: "too narrow unless they clearly say that is the only issue"
    },
    {
      option: "Assume the reaction is only emotional",
      pros: ["acknowledges feelings"],
      cons: ["may ignore a real practical concern"],
      reversibility: "medium",
      judgment: "incomplete if there is a real decision or consequence involved"
    },
    {
      option: "Name both possibilities and ask directly",
      pros: ["reduces guessing", "protects trust", "invites clarity"],
      cons: ["requires humility and patience"],
      reversibility: "high",
      judgment: "best default when the cause is unclear"
    }
  ];

  model.consequences = [
    {
      option: "Assume the reaction is only about the practical issue",
      likelyOutcome:
        "the user may solve the wrong layer and make the other person feel unheard",
      riskLevel: "medium_high"
    },
    {
      option: "Assume the reaction is only emotional",
      likelyOutcome:
        "the user may validate feelings but still miss the practical concern",
      riskLevel: "medium"
    },
    {
      option: "Name both possibilities and ask directly",
      likelyOutcome:
        "the other person is more likely to clarify what is actually bothering them",
      riskLevel: "low"
    }
  ];

  model.nextAction = hasTruthIssue
    ? "Own the honesty piece first, then ask what part hurt most: the situation itself, the timing, or feeling left out."
    : "Name what you are noticing, admit you may be wrong, and ask what part is bothering them most.";

  reasoning.knownFacts.push("The user is asking about a relationship or family reaction.");
  reasoning.inferredFacts.push(
    "The cause may include both the visible issue and the relationship impact around it."
  );

  reasoning.unknowns.push(...model.unknowns);
  reasoning.priorityStack.push(...model.priorities);
  reasoning.options.push(...model.options);

  reasoning.tradeoffs.push({
    name: "practical_explanation_vs_relationship_repair",
    sideA: "explaining the situation",
    sideB: "repairing trust and understanding first",
    likelyWinner: model.priorities[0]?.priority || "relationship_repair"
  });

  reasoning.likelyOutcomes.push(
    ...model.consequences.map(item => ({
      outcome: `${item.option}: ${item.likelyOutcome}`,
      probability: item.riskLevel === "low" ? "medium_high" : "medium"
    }))
  );

  reasoning.recommendation.summary =
    hasTruthIssue
      ? "the honesty or communication piece is likely important, but you should ask instead of assuming it is the only issue."
      : "do not assume one cause; name both the practical issue and the emotional impact, then ask what is really bothering them.";

  reasoning.recommendation.rationale = [
    "Relationship reactions often have more than one layer.",
    "Asking directly is safer than mind-reading.",
    "Repair usually works better when accountability comes before defense."
  ];

  reasoning.recommendation.alternatives = [model.nextAction];

  reasoning.coreJudgment =
    "The safest relationship move is to stop guessing, own your part, and invite the other person to clarify the real injury.";

  reasoning.changeConditions.push(
    "This changes if the other person clearly states the reaction is only about the practical issue."
  );

  reasoning.systemsView.upstream.push(
    "The reaction is shaped by the event, timing, communication, trust, and prior expectations."
  );

  reasoning.systemsView.downstream.push(
    "Repairing trust first makes the practical conversation less defensive."
  );

  reasoning.regretLens.shortTerm =
    "Owning your part may feel uncomfortable.";

  reasoning.regretLens.longTerm =
    "The bigger regret risk is defending yourself before understanding what actually hurt them.";

  reasoning.regretLens.regretRisk =
    "solving_the_surface_issue_while_missing_the_relationship_injury";
},

  hasQuestionIntent(text = "") {
    return this.hasAny(text, [
      "what should", "should i", "how do i", "what do i do",
      "can you", "help me", "explain", "teach", "why"
    ]);
  },

  hasTradeoffShape(text = "") {
    return this.hasAny(text, [
      "but", "however", "although", "while", "versus", "vs",
      "on the other hand", "instead", "either", "or", "tradeoff"
    ]);
  },

  hasTimeline(text = "") {
    return this.hasAny(text, [
      "today", "tonight", "tomorrow", "this week", "next week",
      "next month", "deadline", "due", "soon", "urgent", "now"
    ]);
  },

  hasDeadlineLanguage(text = "") {
    return this.hasAny(text, [
      "deadline", "due", "next month", "tomorrow", "soon", "within"
    ]);
  },

  hasResourceLimit(text = "") {
    return this.hasAny(text, [
      "budget", "money", "cost", "expensive", "afford", "save",
      "time", "energy", "capacity", "limited"
    ]);
  },

  hasMoneyLanguage(text = "") {
    return this.hasAny(text, [
      "money", "budget", "cost", "afford", "save", "savings",
      "debt", "loan", "rent", "payment", "buy", "car", "income"
    ]);
  },

  hasEnjoymentLanguage(text = "") {
    return this.hasAny(text, [
      "vacation", "trip", "party", "fun", "enjoy", "want to go",
      "celebrate", "travel"
    ]);
  },

  hasTimeLanguage(text = "") {
    return this.hasAny(text, [
      "time", "schedule", "deadline", "next month", "today",
      "tomorrow", "week", "month", "year"
    ]);
  },

  hasObligationLanguage(text = "") {
    return this.hasAny(text, [
      "need to", "have to", "must", "responsible", "obligation",
      "required", "supposed to", "committed"
    ]);
  },

  hasRiskLanguage(text = "") {
    return this.hasAny(text, [
      "risk", "danger", "problem", "worry", "afraid", "severe",
      "worse", "lose", "miss", "fail"
    ]);
  },

  hasCapacityLanguage(text = "") {
    return this.hasAny(text, [
      "tired", "exhausted", "burned out", "overwhelmed",
      "too much", "no time", "limited"
    ]);
  },

  hasPeopleLanguage(text = "") {
    return this.hasAny(text, [
      "wife", "husband", "partner", "family", "friend",
      "coworker", "boss", "parent", "child", "baby"
    ]);
  },

  hasRelationshipLanguage(text = "") {
    return this.hasAny(text, [
      "relationship", "wife", "husband", "partner", "family",
      "friend", "argument", "respect", "trust"
    ]);
  },

  hasWorkLanguage(text = "") {
    return this.hasAny(text, [
      "job", "work", "career", "boss", "coworker",
      "promotion", "salary", "quit", "hire"
    ]);
  },

  hasHealthLanguage(text = "") {
    return this.hasAny(text, [
      "pain", "sick", "pregnant", "fever", "bleeding",
      "chest", "breathing", "dizzy", "diarrhea", "vomit"
    ]);
  },

  getOriginalText(summary = {}) {
    return String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).trim();
  },

  getText(summary = {}) {
    return String(
      summary.normalizedMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).toLowerCase();
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(String(term).toLowerCase()));
  },

  add(list, item) {
    if (!Array.isArray(list) || !item) return;
    list.push(item);
  },

  uniqueObjects(list = [], key = null) {
    const seen = new Set();

    return (list || []).filter(item => {
      const value = key ? item?.[key] : JSON.stringify(item);
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },

  clamp(value, min = 0, max = 100) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.max(min, Math.min(max, number));
  }
};