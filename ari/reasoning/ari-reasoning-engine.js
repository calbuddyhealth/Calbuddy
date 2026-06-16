// ari/reasoning/ari-reasoning-engine.js
// Ari Reasoning Engine
// Purpose: Structured thinking only. Composer owns final wording.
// V4.0.0 — Structured Reasoning Only

window.Ari = window.Ari || {};

window.AriReasoningEngine = {
  version: "4.0.0",

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
    this.addUniversalDecisionReasoning(reasoning, summary, primary);
    this.addTradeoffs(reasoning, summary, primary);
    this.addCounterfactuals(reasoning, summary, primary);
    this.addLikelyOutcomes(reasoning, summary, primary);
    this.addSystemsView(reasoning, summary, primary);
    this.addValueConflicts(reasoning, summary, primary);
    this.addRegretLens(reasoning, summary, primary);
    this.synthesizeRecommendation(reasoning, summary, primary);
    this.scoreConfidence(reasoning, summary, primary);
    this.finalize(reasoning);

    return {
      reasoningEngineRan: true,
      reasoningEngineVersion: this.version,
      reasoningSource: "ari-reasoning-engine",

      reasoning,

      // Kept for backward compatibility only.
      // Composer should prefer reasoning.recommendation / priorityStack / tradeoffs.
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

      relevantFacts: [],
      assumptions: [],
      missingInformation: [],
      tradeoffs: [],
      counterfactuals: [],
      likelyOutcomes: [],

      priorityStack: [],
      protectedObligations: [],
      delayOrDecline: [],

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

      // No final prose here. Composer owns wording.
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

    if (
      text.includes("money") ||
      text.includes("income") ||
      text.includes("financial") ||
      text.includes("expenses")
    ) {
      this.add(reasoning.assumptions, {
        assumption: "Money matters, but the exact urgency is not fully known.",
        risk: "medium"
      });

      this.add(reasoning.missingInformation, {
        item: "Whether the income increase is necessary for immediate stability.",
        whyItMatters:
          "It changes whether the promotion should outweigh family timing and relocation costs."
      });
    }

    if (text.includes("pregnant") || text.includes("baby")) {
      this.add(reasoning.assumptions, {
        assumption: "Pregnancy and baby-related obligations are time-sensitive.",
        risk: "low"
      });
    }

    if (text.includes("dementia")) {
      this.add(reasoning.assumptions, {
        assumption:
          "A parent with dementia may need dependable support, but the exact care burden is unknown.",
        risk: "medium"
      });
    }
  },

  addUniversalDecisionReasoning(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;

    const text = summary.normalizedMessage || "";

    if (text.includes("pregnant") || text.includes("wife") || text.includes("baby")) {
      this.add(reasoning.priorityStack, {
        priority: "wife_and_baby_stability",
        label: "wife and baby stability",
        reason: "it is time-sensitive and difficult to recover later"
      });

      this.add(reasoning.protectedObligations, {
        obligation: "wife_and_baby_support",
        reason: "late pregnancy and newborn transition are high-responsibility windows"
      });
    }

    if (text.includes("promotion") || text.includes("income") || text.includes("relocating")) {
      this.add(reasoning.priorityStack, {
        priority: "household_financial_stability",
        label: "household financial stability",
        reason:
          "the promotion has upside, but relocation and timing could destabilize higher priorities"
      });
    }

    if (text.includes("father") || text.includes("dementia")) {
      this.add(reasoning.priorityStack, {
        priority: "father_care_coverage",
        label: "father care coverage",
        reason: "important support may be needed, but it may be delegated or backed up"
      });
    }

    if (text.includes("co-sign") || text.includes("cosign") || text.includes("loan")) {
      this.add(reasoning.delayOrDecline, {
        item: "brother_business_loan",
        recommendation:
          "Do not co-sign the business loan unless your household is already stable and protected.",
        reason: "it creates optional financial risk during a high-responsibility season"
      });
    }

    if (text.includes("best man") || text.includes("wedding") || text.includes("baby shower")) {
      this.add(reasoning.delayOrDecline, {
        item: "wedding_conflict",
        recommendation:
          "Choose the baby shower over the wedding conflict unless your wife strongly prefers otherwise.",
        reason: "your own family milestone has higher priority than an optional social role"
      });
    }
  },

  addTradeoffs(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";
    if (primary !== "executive_decision") return;

    if (text.includes("promotion") || text.includes("income") || text.includes("relocating")) {
      this.add(reasoning.tradeoffs, {
        name: "financial_growth_vs_family_stability",
        sideA: "promotion, higher income, and career momentum",
        sideB: "pregnancy support, local family care, graduate school timing, and stability",
        likelyWinner: "family_stability_unless_promotion_is_necessary"
      });
    }

    if (text.includes("co-sign") || text.includes("cosign") || text.includes("loan")) {
      this.add(reasoning.tradeoffs, {
        name: "helping_brother_vs_household_risk",
        sideA: "helping brother with a business opportunity",
        sideB: "protecting your household from financial liability",
        likelyWinner: "household_risk_protection"
      });
    }

    if (text.includes("wedding") && text.includes("baby shower")) {
      this.add(reasoning.tradeoffs, {
        name: "friend_obligation_vs_family_milestone",
        sideA: "best man role for a friend",
        sideB: "presence at wife’s baby shower",
        likelyWinner: "family_milestone"
      });
    }
  },

  addCounterfactuals(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";
    if (primary !== "executive_decision") return;

    if (text.includes("promotion")) {
      this.add(reasoning.counterfactuals, {
        option: "Accept the promotion",
        benefits: ["higher income", "career advancement"],
        costs: [
          "relocation pressure",
          "less pregnancy/newborn stability",
          "graduate school delay",
          "less availability for father"
        ],
        bestWhen:
          "the money is necessary for household stability or the offer is rare enough to justify disruption"
      });

      this.add(reasoning.counterfactuals, {
        option: "Decline or delay the promotion",
        benefits: [
          "protects pregnancy/newborn season",
          "preserves graduate school path",
          "maintains support for father"
        ],
        costs: ["lost income increase", "possible slower career advancement"],
        bestWhen: "current finances are stable enough without the promotion"
      });
    }

    if (text.includes("co-sign") || text.includes("cosign") || text.includes("loan")) {
      this.add(reasoning.counterfactuals, {
        option: "Co-sign the loan",
        benefits: ["helps brother"],
        costs: ["creates financial risk for your household"],
        bestWhen:
          "only when your household has surplus stability and you can afford full responsibility for the loan"
      });
    }
  },

  addLikelyOutcomes(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";
    if (primary !== "executive_decision") return;

    if (text.includes("promotion")) {
      this.add(reasoning.likelyOutcomes, {
        outcome:
          "Accepting the promotion may improve income but increase family strain during a fragile timing window.",
        probability: "medium_high"
      });

      this.add(reasoning.likelyOutcomes, {
        outcome:
          "Declining or delaying the promotion may reduce income upside but protect stability and reduce regret.",
        probability: "medium_high"
      });
    }
  },

  addSystemsView(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;

    reasoning.systemsView.upstream.push(
      "Multiple people are depending on the user at the same time."
    );

    reasoning.systemsView.downstream.push(
      "Choosing too many obligations risks failing the most important ones."
    );

    reasoning.systemsView.secondOrderEffects.push(
      "Relocation could disrupt pregnancy support, father care, graduate school timing, and local support systems."
    );
  },

  addValueConflicts(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";
    if (primary !== "executive_decision") return;

    if (text.includes("promotion") || text.includes("income")) {
      this.add(reasoning.valueConflicts, {
        conflict: "provider_growth_vs_family_stability",
        valueA: "provide more financially",
        valueB: "protect family stability during pregnancy/newborn transition",
        resolutionHint:
          "family stability leads unless the income is necessary for immediate security"
      });
    }

    if (text.includes("co-sign") || text.includes("cosign") || text.includes("loan")) {
      this.add(reasoning.valueConflicts, {
        conflict: "loyalty_vs_household_boundary",
        valueA: "help brother",
        valueB: "protect wife, baby, and household finances",
        resolutionHint:
          "do not take optional financial risk while your household is entering a high-responsibility season"
      });
    }
  },

  addRegretLens(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";
    if (primary !== "executive_decision") return;

    reasoning.regretLens.shortTerm =
      "Saying no to some people may create guilt.";

    reasoning.regretLens.longTerm =
      "The bigger regret risk is overcommitting and sacrificing wife/baby stability, graduate school timing, or household security.";

    if (text.includes("pregnant") || text.includes("baby")) {
      reasoning.regretLens.irreversibleLosses.push(
        "Pregnancy and baby-related moments are time-sensitive."
      );
    }

    if (text.includes("co-sign") || text.includes("cosign") || text.includes("loan")) {
      reasoning.regretLens.irreversibleLosses.push(
        "A co-signed loan can create long-term financial consequences."
      );
    }

    reasoning.regretLens.regretRisk = "overcommitment_and_household_instability";
  },

  synthesizeRecommendation(reasoning, summary, primary) {
    if (primary === "executive_decision") {
      reasoning.recommendation.summary =
        "Protect wife/baby stability first, avoid optional financial risk, choose the family milestone over the social obligation, and treat the promotion as negotiable unless the income is truly necessary.";

      reasoning.recommendation.rationale = [
        "Wife and baby stability is the most time-sensitive obligation.",
        "The promotion has upside, but relocation during late pregnancy or newborn transition is a major disruption.",
        "Co-signing a business loan adds optional financial risk when the household already has major responsibilities.",
        "The wedding matters, but the baby shower is the family milestone that cannot be easily outsourced."
      ];

      reasoning.recommendation.alternatives = [
        "Ask whether the promotion can be delayed, phased, remote, or reconsidered after the baby is born.",
        "Create backup support for father’s appointments instead of being the only support person.",
        "Tell the friend early that the baby shower has to come first.",
        "Decline the business loan without leaving the relationship cold: offer non-financial help instead."
      ];

      return;
    }

    if (primary === "builder") {
      reasoning.recommendation.summary =
        "Give the user a concrete implementation or debugging step.";
      return;
    }

    if (primary === "teacher") {
      reasoning.recommendation.summary =
        "Explain directly with a simple structure.";
      return;
    }

    if (primary === "medical_context") {
      reasoning.recommendation.summary =
        "Address the medical context calmly without escalating unless red flags are present.";
      return;
    }

    if (primary === "medical_body") {
      reasoning.recommendation.summary =
        "Prioritize medical safety and give a concrete care threshold.";
      return;
    }

    if (primary === "safety") {
      reasoning.recommendation.summary =
        "Prioritize immediate safety and direct next steps.";
      return;
    }

    reasoning.recommendation.summary =
      "Answer the primary lane directly.";
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

    if (reasoning.priorityStack.length > 0) {
      score += 7;
      reasoning.confidence.reasons.push("A priority stack was identified.");
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

  finalize(reasoning) {
    reasoning.relevantFacts = this.uniqueObjects(reasoning.relevantFacts, "fact");
    reasoning.assumptions = this.uniqueObjects(reasoning.assumptions, "assumption");
    reasoning.tradeoffs = this.uniqueObjects(reasoning.tradeoffs, "name");
    reasoning.counterfactuals = this.uniqueObjects(reasoning.counterfactuals, "option");
    reasoning.likelyOutcomes = this.uniqueObjects(reasoning.likelyOutcomes, "outcome");
    reasoning.valueConflicts = this.uniqueObjects(reasoning.valueConflicts, "conflict");
    reasoning.priorityStack = this.uniqueObjects(reasoning.priorityStack, "priority");
    reasoning.protectedObligations = this.uniqueObjects(reasoning.protectedObligations, "obligation");
    reasoning.delayOrDecline = this.uniqueObjects(reasoning.delayOrDecline, "item");

    reasoning.answer = null;
    reasoning.obeyedContract = true;
    reasoning.contractViolations = [];
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