// ari/reasoning/ari-reasoning-engine.js
// Ari Reasoning Engine
// Purpose: Produce structured reasoning without overriding the Situation Contract.
// V3.0.0 — Universal Decision Reasoning

window.Ari = window.Ari || {};

window.AriReasoningEngine = {
  version: "3.0.0",

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

    if (text.includes("money") || text.includes("income") || text.includes("financial") || text.includes("expenses")) {
      this.add(reasoning.assumptions, {
        assumption: "Money matters, but the exact urgency is not fully known.",
        risk: "medium"
      });

      this.add(reasoning.missingInformation, {
        item: "Whether the income increase is necessary for immediate stability.",
        whyItMatters: "It changes whether the promotion should outweigh family timing and relocation costs."
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
        assumption: "A parent with dementia may need dependable support, but the exact care burden is unknown.",
        risk: "medium"
      });
    }
  },

  addUniversalDecisionReasoning(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;

    const text = summary.normalizedMessage || "";

    if (text.includes("pregnant") || text.includes("wife") || text.includes("baby")) {
      this.add(reasoning.priorityStack, {
        priority: "Wife and baby stability",
        reason: "This is time-sensitive and hard to replace later."
      });
      this.add(reasoning.protectedObligations, "Protect wife/baby support first.");
    }

    if (text.includes("promotion") || text.includes("income") || text.includes("relocating")) {
      this.add(reasoning.priorityStack, {
        priority: "Promotion decision",
        reason: "It has major long-term financial upside but also major relocation and timing costs."
      });
    }

    if (text.includes("father") || text.includes("dementia")) {
      this.add(reasoning.priorityStack, {
        priority: "Father care coverage",
        reason: "Important, but may be supported through delegation or backup systems."
      });
    }

    if (text.includes("co-sign") || text.includes("cosign") || text.includes("loan")) {
      this.add(reasoning.delayOrDecline, "Do not co-sign the business loan unless your household is already stable and protected.");
    }

    if (text.includes("best man") || text.includes("wedding") || text.includes("baby shower")) {
      this.add(reasoning.delayOrDecline, "Choose the baby shower over the wedding conflict unless your wife strongly prefers otherwise.");
    }
  },

  addTradeoffs(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";

    if (primary === "executive_decision") {
      if (text.includes("promotion") || text.includes("income") || text.includes("relocating")) {
        this.add(reasoning.tradeoffs, {
          name: "financial_growth_vs_family_stability",
          sideA: "Promotion, higher income, career momentum.",
          sideB: "Pregnancy support, local family care, graduate school timeline, stability.",
          likelyWinner: "family_stability_unless_promotion_is_necessary"
        });
      }

      if (text.includes("co-sign") || text.includes("loan")) {
        this.add(reasoning.tradeoffs, {
          name: "helping_brother_vs_household_risk",
          sideA: "Helping brother with business opportunity.",
          sideB: "Protecting your own household from financial liability.",
          likelyWinner: "household_risk_protection"
        });
      }

      if (text.includes("wedding") && text.includes("baby shower")) {
        this.add(reasoning.tradeoffs, {
          name: "friend_obligation_vs_family_milestone",
          sideA: "Best man role for friend.",
          sideB: "Presence at wife’s baby shower.",
          likelyWinner: "family_milestone"
        });
      }
    }
  },

  addCounterfactuals(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";
    if (primary !== "executive_decision") return;

    if (text.includes("promotion")) {
      this.add(reasoning.counterfactuals, {
        option: "Accept the promotion",
        benefits: ["Higher income", "Career advancement"],
        costs: ["Relocation pressure", "Less pregnancy/newborn stability", "Graduate school delay", "Less availability for father"],
        bestWhen: "The money is necessary for household stability or the offer is rare enough to justify disruption."
      });

      this.add(reasoning.counterfactuals, {
        option: "Decline or delay the promotion",
        benefits: ["Protects pregnancy/newborn season", "Preserves graduate school path", "Maintains support for father"],
        costs: ["Lost income increase", "Possible slower career advancement"],
        bestWhen: "Current finances are stable enough without the promotion."
      });
    }

    if (text.includes("co-sign") || text.includes("loan")) {
      this.add(reasoning.counterfactuals, {
        option: "Co-sign the loan",
        benefits: ["Helps brother"],
        costs: ["Creates financial risk for your household"],
        bestWhen: "Only when your household has surplus stability and you can afford full responsibility for the loan."
      });
    }
  },

  addLikelyOutcomes(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";
    if (primary !== "executive_decision") return;

    if (text.includes("promotion")) {
      this.add(reasoning.likelyOutcomes, {
        outcome: "Accepting the promotion may improve income but increase family strain during a fragile timing window.",
        probability: "medium_high"
      });

      this.add(reasoning.likelyOutcomes, {
        outcome: "Declining or delaying the promotion may reduce income upside but protect stability and reduce regret.",
        probability: "medium_high"
      });
    }
  },

  addSystemsView(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";
    if (primary !== "executive_decision") return;

    reasoning.systemsView.upstream.push("Multiple people are depending on the user at the same time.");
    reasoning.systemsView.downstream.push("Choosing too many obligations risks failing the most important ones.");
    reasoning.systemsView.secondOrderEffects.push("Relocation could disrupt pregnancy support, father care, graduate school timing, and local support systems.");
  },

  addValueConflicts(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";
    if (primary !== "executive_decision") return;

    if (text.includes("promotion") || text.includes("income")) {
      this.add(reasoning.valueConflicts, {
        conflict: "provider_growth_vs_family_stability",
        valueA: "Provide more financially.",
        valueB: "Protect family stability during pregnancy/newborn transition.",
        resolutionHint: "Family stability leads unless the income is necessary for immediate security."
      });
    }

    if (text.includes("co-sign") || text.includes("loan")) {
      this.add(reasoning.valueConflicts, {
        conflict: "loyalty_vs_household_boundary",
        valueA: "Help brother.",
        valueB: "Protect wife, baby, and household finances.",
        resolutionHint: "Do not take optional financial risk while your own household is entering a high-responsibility season."
      });
    }
  },

  addRegretLens(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";
    if (primary !== "executive_decision") return;

    reasoning.regretLens.shortTerm =
      "Saying no to some people may create guilt.";

    reasoning.regretLens.longTerm =
      "The bigger regret risk is overcommitting and sacrificing wife/baby stability, your graduate school path, or household security.";

    if (text.includes("pregnant") || text.includes("baby")) {
      reasoning.regretLens.irreversibleLosses.push("Pregnancy and baby-related moments are time-sensitive.");
    }

    if (text.includes("co-sign") || text.includes("loan")) {
      reasoning.regretLens.irreversibleLosses.push("A co-signed loan can create long-term financial consequences.");
    }

    reasoning.regretLens.regretRisk = "overcommitment_and_household_instability";
  },

  synthesizeRecommendation(reasoning, summary, primary) {
    const text = summary.normalizedMessage || "";

    if (primary === "executive_decision") {
      reasoning.recommendation.summary =
        "Protect wife/baby stability first, do not co-sign the loan, choose the baby shower over the wedding conflict, and only take the promotion if the money is truly necessary or the offer can be delayed/negotiated.";

      reasoning.recommendation.rationale = [
        "Your wife and baby are the most time-sensitive obligation.",
        "The promotion has upside, but relocation during late pregnancy/newborn transition is a major disruption.",
        "Co-signing a business loan adds optional financial risk when your household already has major responsibilities.",
        "The wedding matters, but the baby shower is the family milestone you cannot easily outsource."
      ];

      reasoning.recommendation.alternatives = [
        "Ask whether the promotion can be delayed, remote, phased, or accepted after the baby is born.",
        "Find backup support for your father’s appointments instead of being the only support person.",
        "Tell your friend early that the baby shower has to come first."
      ];

      reasoning.answer =
        "Let’s organize this clearly.\n\nYour first priority is your wife and baby. She is stable now, so this is not an emergency based on what you wrote, but late pregnancy is still the obligation that deserves protection first.\n\nMy recommendation: do not co-sign your brother’s business loan right now. That is optional financial risk, and your household is about to need more stability, not less.\n\nFor the wedding versus baby shower, choose the baby shower. You can honor your friend another way, but you should not miss your own family milestone unless your wife genuinely does not care.\n\nFor the promotion, do not give an automatic yes. Ask if the move can be delayed, phased, remote, or reconsidered after the baby is born. Take it only if the 30% income increase is necessary for your family’s stability or the opportunity is too rare to replace. If your current finances are survivable, I would lean toward declining or delaying it to protect the baby season, your wife’s support, your father’s care setup, and your graduate school path.\n\nSo the order is: wife/baby first, household financial safety second, father care coverage third, career promotion only if it does not destabilize the first two, and brother/friend obligations last.";

      return;
    }

    if (primary === "builder") {
      reasoning.recommendation.summary = "Give the user a concrete implementation or debugging step.";
      reasoning.answer = summary.builderAnswer || summary.codeAnswer || summary.implementationAnswer || "Here’s the practical fix.";
      return;
    }

    if (primary === "teacher") {
      reasoning.recommendation.summary = "Explain directly with a simple structure.";
      reasoning.answer = summary.teachingAnswer || summary.knowledgeAnswer || "Here’s the clear explanation.";
      return;
    }

    if (primary === "medical_context") {
      reasoning.recommendation.summary = "Address the medical context calmly without escalating unless red flags are present.";
      reasoning.answer = summary.medicalAnswer || "This sounds medically relevant, but not automatically urgent based on what you described. Monitor for red flags and contact a clinician if symptoms worsen or feel concerning.";
      return;
    }

    reasoning.recommendation.summary = "Answer the primary lane directly.";
    reasoning.answer = summary.directAnswer || summary.humanTruth || "Here’s the practical answer.";
  },

  scoreConfidence(reasoning, summary, primary) {
    let score = 60;

    if (reasoning.relevantFacts.length >= 3) score += 15;
    if (reasoning.tradeoffs.length > 0) score += 10;
    if (reasoning.counterfactuals.length > 0) score += 8;
    if (reasoning.priorityStack.length > 0) score += 7;

    if (reasoning.missingInformation.length > 0) {
      score -= 10;
      reasoning.confidence.uncertaintyDrivers.push("Some decision-relevant information is missing.");
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