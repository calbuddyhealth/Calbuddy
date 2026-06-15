// ari/reasoning/ari-reasoning-engine.js
// Ari Reasoning Engine
// Purpose: Produce structured reasoning without overriding the Situation Contract.
// V2.0.0

window.Ari = window.Ari || {};

window.AriReasoningEngine = {
  version: "2.0.0",

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

    const reasoning = this.blankReasoning({ primary, contract, executive });

    this.addRelevantFacts(reasoning, summary, observations);
    this.addAssumptions(reasoning, summary, primary);
    this.addTradeoffs(reasoning, summary, primary);
    this.addCounterfactuals(reasoning, summary, primary);
    this.addLikelyOutcomes(reasoning, summary, primary);
    this.addSystemsView(reasoning, summary, primary);
    this.addValueConflicts(reasoning, summary, primary);
    this.addRegretLens(reasoning, summary, primary);
    this.synthesizeRecommendation(reasoning, summary, primary);
    this.scoreConfidence(reasoning, summary, primary);
    this.checkContractViolations(reasoning, contract);
    this.finalize(reasoning);

    return {
      reasoningEngineRan: true,
      reasoningEngineVersion: this.version,
      reasoningSource: "ari-reasoning-engine",

      reasoning,
      reasoningAnswer: reasoning.answer,
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

      relevantFacts: [],
      assumptions: [],
      missingInformation: [],
      tradeoffs: [],
      counterfactuals: [],
      likelyOutcomes: [],

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
        regretRisk: "unknown"
      },

      recommendation: {
        summary: null,
        rationale: [],
        alternatives: []
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

    if (summary.situationContract?.risk?.type === "medical") {
      this.add(reasoning.relevantFacts, {
        fact: "Medical or body context is present.",
        evidence: "situation contract risk type",
        type: "contract_context",
        confidence: 0.9
      });
    }

    if (summary.executiveGoal) {
      this.add(reasoning.relevantFacts, {
        fact: summary.executiveGoal,
        evidence: "executive function",
        type: "executive_goal",
        confidence: 0.85
      });
    }
  },

  addAssumptions(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";

    if (primary === "executive_decision") {
      this.add(reasoning.assumptions, {
        assumption: "The user wants a recommendation, not just reflection.",
        risk: "low"
      });
    }

    if (text.includes("money") || text.includes("expenses")) {
      this.add(reasoning.assumptions, {
        assumption: "Money matters, but urgency is not fully known.",
        risk: "medium"
      });

      this.add(reasoning.missingInformation, {
        item: "How urgent the financial need is.",
        whyItMatters: "It changes whether money should outweigh time/presence."
      });
    }

    if (text.includes("pregnant")) {
      this.add(reasoning.assumptions, {
        assumption: "Pregnancy-related time and support are time-sensitive.",
        risk: "low"
      });
    }

    if (primary === "builder") {
      this.add(reasoning.assumptions, {
        assumption: "The user wants implementation help or debugging guidance.",
        risk: "low"
      });
    }

    if (primary === "teacher") {
      this.add(reasoning.assumptions, {
        assumption: "The user wants a clear explanation before deeper nuance.",
        risk: "low"
      });
    }
  },

  addTradeoffs(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";

    if (primary === "executive_decision") {
      if (text.includes("money") && (text.includes("time") || text.includes("pregnant"))) {
        this.add(reasoning.tradeoffs, {
          name: "money_vs_presence",
          sideA: "Extra income or resource stability.",
          sideB: "Protected time with partner/family.",
          likelyWinner: "presence_unless_money_is_urgent"
        });
      }
    }

    if (primary === "builder") {
      this.add(reasoning.tradeoffs, {
        name: "quick_patch_vs_clean_fix",
        sideA: "Fast patch solves the immediate issue.",
        sideB: "Cleaner fix prevents repeat bugs.",
        likelyWinner: "clean_fix_when_possible"
      });
    }

    if (primary === "teacher") {
      this.add(reasoning.tradeoffs, {
        name: "simple_vs_complete",
        sideA: "Simple answer is easier to understand.",
        sideB: "Complete answer is more precise.",
        likelyWinner: "simple_first_then_detail"
      });
    }
  },

  addCounterfactuals(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";

    if (primary === "executive_decision" && text.includes("shift")) {
      this.add(reasoning.counterfactuals, {
        option: "Take the extra shift",
        benefits: ["More money", "Less guilt about expenses"],
        costs: ["Less time with fiancée", "Possible regret if time together is already scarce"],
        bestWhen: "The money solves a real, immediate financial problem."
      });

      this.add(reasoning.counterfactuals, {
        option: "Decline the extra shift",
        benefits: ["More presence", "More relationship time during pregnancy"],
        costs: ["Less extra income"],
        bestWhen: "The money helps but is not essential."
      });
    }

    if (primary === "builder") {
      this.add(reasoning.counterfactuals, {
        option: "Patch only the visible error",
        benefits: ["Fast"],
        costs: ["May not fix root cause"],
        bestWhen: "You need a temporary unblock."
      });

      this.add(reasoning.counterfactuals, {
        option: "Trace the root cause",
        benefits: ["More reliable fix"],
        costs: ["Takes longer"],
        bestWhen: "The same issue could happen again."
      });
    }
  },

  addLikelyOutcomes(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";

    if (primary === "executive_decision" && text.includes("shift")) {
      this.add(reasoning.likelyOutcomes, {
        outcome: "Taking the shift improves money slightly but reduces limited time together.",
        probability: "medium_high"
      });

      this.add(reasoning.likelyOutcomes, {
        outcome: "Declining the shift protects connection but may leave some financial pressure.",
        probability: "medium_high"
      });
    }

    if (primary === "builder") {
      this.add(reasoning.likelyOutcomes, {
        outcome: "A concrete fix or debugging path will be more useful than reflection.",
        probability: "high"
      });
    }

    if (primary === "teacher") {
      this.add(reasoning.likelyOutcomes, {
        outcome: "A direct explanation will satisfy the request better than a clarifying question.",
        probability: "high"
      });
    }
  },

  addSystemsView(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";

    if (primary === "executive_decision" && text.includes("shift")) {
      reasoning.systemsView.upstream.push("Upcoming expenses create pressure.");
      reasoning.systemsView.downstream.push("Extra work may reduce recovery and relationship time.");
      reasoning.systemsView.secondOrderEffects.push(
        "Repeated extra shifts could normalize sacrificing presence for short-term relief."
      );
    }

    if (primary === "builder") {
      reasoning.systemsView.upstream.push("A bug usually comes from state, data flow, or incorrect assumptions.");
      reasoning.systemsView.downstream.push("Fixing only the symptom can allow the bug to recur.");
    }
  },

  addValueConflicts(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";

    if (primary === "executive_decision" && text.includes("money") && text.includes("pregnant")) {
      this.add(reasoning.valueConflicts, {
        conflict: "provider_vs_presence",
        valueA: "Providing financially",
        valueB: "Being present relationally",
        resolutionHint: "If finances are not urgent, presence should lead."
      });
    }

    if (primary === "builder") {
      this.add(reasoning.valueConflicts, {
        conflict: "speed_vs_stability",
        valueA: "Move fast",
        valueB: "Build reliably",
        resolutionHint: "Fix the root cause when the system is likely to reuse the pattern."
      });
    }
  },

  addRegretLens(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";

    if (primary === "executive_decision" && text.includes("shift")) {
      reasoning.regretLens.shortTerm =
        "Saying no may create short-term guilt about money.";

      reasoning.regretLens.longTerm =
        "Missing scarce time with a pregnant partner may create stronger long-term regret.";

      reasoning.regretLens.irreversibleLosses.push(
        "Specific relationship moments during pregnancy cannot be recreated later."
      );

      reasoning.regretLens.regretRisk = "presence_loss_higher_than_money_loss";
    }

    if (primary === "builder") {
      reasoning.regretLens.shortTerm =
        "A quick patch may feel efficient.";

      reasoning.regretLens.longTerm =
        "Not finding the root cause may create repeated debugging later.";

      reasoning.regretLens.regretRisk = "medium";
    }
  },

  synthesizeRecommendation(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";

    if (primary === "executive_decision" && text.includes("shift")) {
      reasoning.recommendation.summary =
        "Decline the extra shift unless the money solves a real immediate financial problem.";

      reasoning.recommendation.rationale = [
        "The money helps, but the urgency is unclear.",
        "Time with a pregnant partner is more time-sensitive.",
        "The likely long-term regret is higher on the presence side."
      ];

      reasoning.recommendation.alternatives = [
        "Take the shift only if it prevents a real financial problem.",
        "If you take it, protect a specific block of time before or after the shift."
      ];

      reasoning.answer =
        "The real priority is deciding which loss is harder to replace this weekend: the extra money or the time with her.\n\nIf the shift solves an immediate financial problem, take it — but protect a specific block of time with her before or after the shift.\n\nIf the money only helps a little, I’d lean toward saying no and spending the weekend with her. This pregnancy season is harder to get back than one extra shift.";

      return;
    }

    if (primary === "builder") {
      reasoning.recommendation.summary =
        "Give the user a concrete implementation or debugging step.";

      reasoning.recommendation.rationale = [
        "The contract selected builder.",
        "The user needs action, not reflection."
      ];

      reasoning.answer =
        summary.builderAnswer ||
        summary.codeAnswer ||
        summary.implementationAnswer ||
        "Here’s the practical fix.";

      return;
    }

    if (primary === "teacher") {
      reasoning.recommendation.summary =
        "Explain directly with a simple structure.";

      reasoning.recommendation.rationale = [
        "The user asked for understanding.",
        "Teaching should come before reflection."
      ];

      reasoning.answer =
        summary.teachingAnswer ||
        summary.knowledgeAnswer ||
        "Here’s the clear explanation.";

      return;
    }

    if (primary === "medical_context") {
      reasoning.recommendation.summary =
        "Address the medical context calmly without escalating unless red flags are present.";

      reasoning.answer =
        summary.medicalAnswer ||
        "This sounds medically relevant, but not automatically urgent based on what you described. The practical move is to monitor for red flags and contact a clinician if symptoms worsen or feel concerning.";

      return;
    }

    reasoning.recommendation.summary =
      "Answer the primary lane directly.";

    reasoning.answer =
      summary.directAnswer ||
      summary.humanTruth ||
      "Here’s the practical answer.";
  },

  scoreConfidence(reasoning, summary, primary) {
    let score = 60;

    if (reasoning.relevantFacts.length >= 3) {
      score += 15;
      reasoning.confidence.reasons.push("Multiple relevant facts are available.");
    }

    if (reasoning.tradeoffs.length > 0) {
      score += 10;
      reasoning.confidence.reasons.push("A clear tradeoff was identified.");
    }

    if (reasoning.counterfactuals.length > 0) {
      score += 8;
      reasoning.confidence.reasons.push("Counterfactual options were compared.");
    }

    if (reasoning.missingInformation.length > 0) {
      score -= 10;
      reasoning.confidence.uncertaintyDrivers.push(
        "Some decision-relevant information is missing."
      );
    }

    if (["safety", "risk_clarification"].includes(primary)) {
      score = Math.max(score, 90);
    }

    reasoning.confidence.score = this.clamp(score, 0, 100);
    reasoning.confidence.level =
      reasoning.confidence.score >= 85 ? "high" :
      reasoning.confidence.score >= 65 ? "medium" :
      "low";
  },

  checkContractViolations(reasoning, contract = {}) {
    const blocked = contract.blocked || [];
    const answer = this.normalize(reasoning.answer || "");

    blocked.forEach(lane => {
      if (lane === "life_chapter" && answer.includes("life chapter")) {
        reasoning.contractViolations.push("Mentioned life chapter despite block.");
      }

      if (lane === "deep_emotion" && answer.includes("what feeling")) {
        reasoning.contractViolations.push("Used deep emotion prompt despite block.");
      }
    });

    reasoning.obeyedContract = reasoning.contractViolations.length === 0;
  },

  finalize(reasoning) {
    reasoning.relevantFacts = this.uniqueObjects(reasoning.relevantFacts, "fact");
    reasoning.assumptions = this.uniqueObjects(reasoning.assumptions, "assumption");
    reasoning.tradeoffs = this.uniqueObjects(reasoning.tradeoffs, "name");
    reasoning.counterfactuals = this.uniqueObjects(reasoning.counterfactuals, "option");
    reasoning.likelyOutcomes = this.uniqueObjects(reasoning.likelyOutcomes, "outcome");
    reasoning.valueConflicts = this.uniqueObjects(reasoning.valueConflicts, "conflict");

    if (!reasoning.answer && reasoning.recommendation?.summary) {
      reasoning.answer = reasoning.recommendation.summary;
    }
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

  normalize(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  clamp(value, min = 0, max = 100) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.max(min, Math.min(max, number));
  }
};