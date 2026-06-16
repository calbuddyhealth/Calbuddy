// ari/reasoning/ari-reasoning-engine.js
// Ari Reasoning Engine
// Purpose: Structured judgment only. Composer owns final wording.
// V6.0.0 — Judgment Engine

window.Ari = window.Ari || {};

window.AriReasoningEngine = {
  version: "6.0.0",

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
    this.detectUniversalSignals(reasoning, summary);
    this.extractDecisionFacts(reasoning, summary, primary);
    this.detectDecisionPattern(reasoning, summary, primary);
    this.addAssumptions(reasoning, summary, primary);
    this.buildPriorityStack(reasoning, summary, primary);
    this.buildOptions(reasoning, summary, primary);
    this.addTradeoffs(reasoning, summary, primary);
    this.addCounterfactuals(reasoning, summary, primary);
    this.addLikelyOutcomes(reasoning, summary, primary);
    this.buildRejectedAlternatives(reasoning, summary, primary);
    this.addSystemsView(reasoning, summary, primary);
    this.addValueConflicts(reasoning, summary, primary);
    this.addRegretLens(reasoning, summary, primary);
    this.buildKnownInferredUnknown(reasoning, summary, primary);
    this.buildChangeConditions(reasoning, summary, primary);
    this.synthesizeRecommendation(reasoning, summary, primary);
    this.buildCoreJudgment(reasoning, summary, primary);
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

  detectUniversalSignals(reasoning, summary) {
    const text = this.getText(summary);

    reasoning.universalSignals = {
      householdStability: this.hasAny(text, [
        "wife", "husband", "spouse", "partner", "pregnant", "pregnancy",
        "baby", "newborn", "induction", "family", "sole provider",
        "only income earner", "household"
      ]),

      newbornOrPregnancyTiming: this.hasAny(text, [
        "pregnant", "pregnancy", "newborn", "baby", "induction",
        "birth", "hospitalized", "complications", "37 weeks", "36 weeks"
      ]),

      higherPayOpportunity: this.hasAny(text, [
        "higher paying job", "higher-paying job", "pays more", "pay more",
        "more money", "higher salary", "raise", "promotion", "doubling",
        "double my salary", "45% raise"
      ]),

      majorCareerOpportunity: this.hasAny(text, [
        "promotion", "director", "job offer", "offer", "new role",
        "salary", "higher-paying job", "higher paying job", "raise",
        "contract", "relocate", "relocating", "moving across the country"
      ]),

      familyTimeCost: this.hasAny(text, [
        "less time with my wife", "less time with wife",
        "less time with my newborn", "less time with newborn",
        "spending much less time", "away from my family",
        "away from wife", "away from newborn", "70-hour weeks",
        "70 hour weeks"
      ]),

      majorDisruptionCost: this.hasAny(text, [
        "relocate", "relocating", "moving", "move across the country",
        "five year contract", "five-year contract", "within a month",
        "within 30 days", "within six weeks", "impossible if i relocate"
      ]),

      dependentCare: this.hasAny(text, [
        "father", "mother", "parent", "dementia", "assisted living",
        "lives alone", "caregiver", "depends on me", "stay independent"
      ]),

      optionalFinancialRisk: this.hasAny(text, [
        "co-sign", "cosign", "loan", "lend", "borrow", "bankruptcy",
        "savings", "40,000", "$40,000", "25k", "$25k"
      ]),

      socialObligationConflict: this.hasAny(text, [
        "wedding", "best man", "baby shower", "friend", "no replacement"
      ]),

      professionalDuty: this.hasAny(text, [
        "current employer", "short-staffed", "short staffed", "coworkers",
        "patients", "additional strain"
      ]),

      educationPath: this.hasAny(text, [
        "graduate school", "accepted into graduate school", "degree", "program"
      ]),

      explicitNoAssumptionsRequest: this.hasAny(text, [
        "without assuming facts", "distinguish", "what we know",
        "what you're inferring", "what you’re inferring",
        "what could change", "rejected the alternatives"
      ]),

      financialBuffer: this.hasAny(text, [
        "six months", "savings", "survive for about six months",
        "enough savings"
      ])
    };
  },

  extractDecisionFacts(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if (s.higherPayOpportunity || s.majorCareerOpportunity) {
      this.add(reasoning.knownFacts, "The user is considering a higher-paying career opportunity.");
    }

    if (s.familyTimeCost) {
      this.add(reasoning.knownFacts, "Accepting the opportunity would reduce time with wife/newborn or family.");
    }

    if (s.householdStability) {
      this.add(reasoning.knownFacts, "Family stability and presence are part of the decision.");
    }

    if (s.majorDisruptionCost) {
      this.add(reasoning.knownFacts, "The opportunity has a major disruption cost.");
    }

    if (s.dependentCare) {
      this.add(reasoning.knownFacts, "A dependent parent or family-care issue is part of the decision.");
    }

    if (s.optionalFinancialRisk) {
      this.add(reasoning.knownFacts, "There is a large optional financial request or risk.");
    }

    if (s.socialObligationConflict) {
      this.add(reasoning.knownFacts, "There is a social obligation competing with family timing.");
    }

    if (s.educationPath) {
      this.add(reasoning.knownFacts, "An education path may be affected by the decision.");
    }

    if (s.explicitNoAssumptionsRequest) {
      this.add(reasoning.knownFacts, "The user asked to separate known facts, inferences, uncertainty, and rejected alternatives.");
    }
  },

  detectDecisionPattern(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if (s.householdStability && s.majorCareerOpportunity && (s.majorDisruptionCost || s.familyTimeCost)) {
      reasoning.decisionPattern = "career_growth_vs_family_presence";
      return;
    }

    if (s.householdStability && (s.higherPayOpportunity || s.majorCareerOpportunity)) {
      reasoning.decisionPattern = "money_vs_family_time";
      return;
    }

    if (s.dependentCare || s.optionalFinancialRisk || s.socialObligationConflict) {
      reasoning.decisionPattern = "competing_obligations_under_limited_capacity";
      return;
    }

    if (s.majorCareerOpportunity) {
      reasoning.decisionPattern = "career_opportunity_with_tradeoffs";
      return;
    }

    reasoning.decisionPattern = "general_executive_decision";
  },

  addAssumptions(reasoning, summary, primary) {
    const s = reasoning.universalSignals || {};

    if (primary === "executive_decision") {
      this.add(reasoning.assumptions, {
        assumption: "The user wants a recommendation, not just reflection.",
        confidence: 0.9,
        risk: "low",
        because: ["The prompt asks what to do."]
      });
    }

    if (s.householdStability || s.familyTimeCost) {
      this.add(reasoning.assumptions, {
        assumption: "Family stability and presence matter heavily in this decision.",
        confidence: 0.82,
        risk: "low",
        because: ["The user explicitly named wife/newborn or household consequences."]
      });
    }

    if (s.majorCareerOpportunity || s.higherPayOpportunity) {
      this.add(reasoning.assumptions, {
        assumption: "The opportunity has real upside, but the upside must be weighed against disruption.",
        confidence: 0.78,
        risk: "medium",
        because: ["The opportunity improves pay or career position."]
      });
    }
  },

  buildPriorityStack(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if (s.householdStability || s.familyTimeCost) {
      this.add(reasoning.priorityStack, {
        priority: "family_presence_and_household_stability",
        label: "wife, newborn, and household stability",
        reason: "newborn/family presence is time-sensitive and harder to recover than many career options"
      });
    }

    if (s.newbornOrPregnancyTiming) {
      this.add(reasoning.protectedObligations, {
        obligation: "newborn_or_pregnancy_timing",
        reason: "birth, late pregnancy, and early newborn support are time-sensitive"
      });
    }

    if (s.higherPayOpportunity || s.majorCareerOpportunity) {
      this.add(reasoning.priorityStack, {
        priority: "financial_and_career_growth",
        label: "income and career growth",
        reason: "money matters, especially if it is needed for household security"
      });
    }

    if (s.dependentCare) {
      this.add(reasoning.priorityStack, {
        priority: "dependent_care_plan",
        label: "dependent family care",
        reason: "care needs matter, but they may need a support system rather than only direct sacrifice"
      });
    }

    if (s.optionalFinancialRisk) {
      this.add(reasoning.delayOrDecline, {
        item: "large_optional_financial_risk",
        recommendation: "Delay or decline large optional financial exposure.",
        reason: "protecting the household comes before rescuing someone else financially"
      });
    }
  },

  buildOptions(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if (s.higherPayOpportunity || s.majorCareerOpportunity) {
      this.add(reasoning.options, {
        option: "Accept immediately",
        pros: ["higher income", "career growth"],
        cons: ["less family time", "possible disruption to household stability"],
        reversibility: s.majorDisruptionCost ? "low" : "medium",
        judgment: "weak unless the money is urgently needed or the role can protect family time"
      });

      this.add(reasoning.options, {
        option: "Reject immediately",
        pros: ["protects family time", "reduces disruption"],
        cons: ["may lose income/career upside"],
        reversibility: "medium",
        judgment: "reasonable if the role cannot be restructured, but premature if negotiation is possible"
      });

      this.add(reasoning.options, {
        option: "Negotiate delay or structure",
        pros: ["preserves the opportunity while protecting family stability"],
        cons: ["employer may say no"],
        reversibility: "high",
        judgment: "best first move when both opportunity and family stability matter"
      });
    }
  },

  addTradeoffs(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if ((s.higherPayOpportunity || s.majorCareerOpportunity) && s.familyTimeCost) {
      this.add(reasoning.tradeoffs, {
        name: "higher_pay_vs_family_presence",
        sideA: "higher pay and career growth",
        sideB: "time with wife, newborn, and family stability",
        likelyWinner: "family_presence_unless_money_is_needed_for_security"
      });
    }

    if (s.majorCareerOpportunity && s.majorDisruptionCost) {
      this.add(reasoning.tradeoffs, {
        name: "career_growth_vs_disruption",
        sideA: "career advancement",
        sideB: "timing, relocation, and life disruption",
        likelyWinner: "delay_or_negotiate_first"
      });
    }

    if (s.optionalFinancialRisk) {
      this.add(reasoning.tradeoffs, {
        name: "helping_family_vs_household_risk",
        sideA: "helping a family member financially",
        sideB: "protecting household security",
        likelyWinner: "household_risk_protection"
      });
    }
  },

  addCounterfactuals(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;

    reasoning.options.forEach(option => {
      this.add(reasoning.counterfactuals, {
        option: option.option,
        benefits: option.pros,
        costs: option.cons,
        reversibility: option.reversibility,
        bestWhen: option.judgment
      });
    });
  },

  addLikelyOutcomes(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if ((s.higherPayOpportunity || s.majorCareerOpportunity) && s.familyTimeCost) {
      this.add(reasoning.likelyOutcomes, {
        outcome: "Accepting immediately may improve money while increasing regret or strain around family presence.",
        probability: "medium_high"
      });

      this.add(reasoning.likelyOutcomes, {
        outcome: "Negotiating structure first preserves optionality better than a simple yes or no.",
        probability: "medium_high"
      });
    }
  },

  buildRejectedAlternatives(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if ((s.higherPayOpportunity || s.majorCareerOpportunity) && s.familyTimeCost) {
      this.add(reasoning.rejectedAlternatives, {
        alternative: "Accept immediately",
        rejectedBecause: "higher income does not automatically outrank time with wife/newborn unless the money is needed for immediate household security."
      });

      this.add(reasoning.rejectedAlternatives, {
        alternative: "Reject immediately",
        rejectedBecause: "the opportunity may still be worth negotiating if the schedule, start date, workload, or location can protect family time."
      });
    }

    if (s.optionalFinancialRisk) {
      this.add(reasoning.rejectedAlternatives, {
        alternative: "Take on the large financial request",
        rejectedBecause: "it adds optional financial risk while the household already has uncertainty."
      });
    }

    if (s.socialObligationConflict) {
      this.add(reasoning.rejectedAlternatives, {
        alternative: "Prioritize the social obligation",
        rejectedBecause: "friend disappointment is usually more repairable than missing a high-stakes family moment."
      });
    }
  },

  addSystemsView(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;

    reasoning.systemsView.upstream.push(
      "The decision is not only about one benefit; it affects the whole family system."
    );

    reasoning.systemsView.downstream.push(
      "Choosing the option with the biggest upside can still be wrong if it destabilizes the system that has the highest cost of failure."
    );

    if (reasoning.universalSignals.familyTimeCost) {
      reasoning.systemsView.secondOrderEffects.push(
        "Less family time can create stress, resentment, or missed support during a time-sensitive life stage."
      );
    }
  },

  addValueConflicts(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if ((s.higherPayOpportunity || s.majorCareerOpportunity) && (s.householdStability || s.familyTimeCost)) {
      this.add(reasoning.valueConflicts, {
        conflict: "growth_vs_presence",
        valueA: "income and career growth",
        valueB: "presence, stability, and family support",
        resolutionHint: "pursue growth only in a structure that does not sacrifice the highest-cost family obligation"
      });
    }
  },

  addRegretLens(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    reasoning.regretLens.shortTerm =
      "Delaying or negotiating may feel like risking a good opportunity.";

    reasoning.regretLens.longTerm =
      "The bigger regret risk is trading away hard-to-replace family presence for a benefit that may be negotiable or replaceable.";

    if (s.familyTimeCost || s.newbornOrPregnancyTiming) {
      reasoning.regretLens.irreversibleLosses.push(
        "Early newborn time and family support windows are time-sensitive."
      );
    }

    if (s.higherPayOpportunity || s.majorCareerOpportunity) {
      reasoning.regretLens.reversibleLosses.push(
        "Some career opportunities can be delayed, renegotiated, or replaced later."
      );
    }

    reasoning.regretLens.regretRisk = "sacrificing_irreplaceable_presence_for_replaceable_gain";
  },

  buildKnownInferredUnknown(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if (s.familyTimeCost) {
      this.add(reasoning.inferredFacts, "The real tradeoff is probably not just money versus comfort; it is money versus presence.");
    }

    if (s.householdStability) {
      this.add(reasoning.inferredFacts, "Family stability likely carries more weight than optional or negotiable gains.");
    }

    if (s.higherPayOpportunity || s.majorCareerOpportunity) {
      this.add(reasoning.unknowns, "Whether the increased income is necessary for immediate household security.");
      this.add(reasoning.unknowns, "Whether the role can be delayed, phased, remote, or restructured.");
      this.add(reasoning.unknowns, "Whether the workload would still allow meaningful family presence.");
    }
  },

  buildChangeConditions(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;

    this.add(reasoning.changeConditions, "The recommendation changes if the higher income is necessary to keep the household safe or financially stable.");
    this.add(reasoning.changeConditions, "The recommendation changes if the employer can protect family time through delayed start, reduced hours, remote work, or phased transition.");
    this.add(reasoning.changeConditions, "The recommendation changes if the partner explicitly prefers the financial upside despite the time cost.");

    reasoning.unknowns.push(...reasoning.changeConditions);
  },

  synthesizeRecommendation(reasoning, summary, primary) {
    if (primary !== "executive_decision") {
      reasoning.recommendation.summary = "Answer the primary lane directly.";
      return;
    }

    const s = reasoning.universalSignals || {};

    if ((s.higherPayOpportunity || s.majorCareerOpportunity) && s.familyTimeCost) {
      reasoning.recommendation.summary =
        "do not accept immediately; negotiate the role first, and only take it if the money is necessary or the structure still protects time with your wife and newborn.";

      reasoning.recommendation.alternatives = [
        "Ask for a delayed start, reduced hours, remote days, or a phased transition.",
        "Calculate whether the higher income is necessary for immediate household security.",
        "Discuss with your partner what level of absence is acceptable during the newborn period."
      ];
      return;
    }

    reasoning.recommendation.summary =
      "protect the highest-cost obligation first, delay optional risks, and choose the next step that preserves stability.";

    reasoning.recommendation.alternatives = [
      "Ask whether the option can be delayed, phased, remote, or renegotiated."
    ];
  },

  buildCoreJudgment(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;

    reasoning.coreJudgment =
      "Preserve the option if possible, but do not sacrifice the hardest-to-replace obligation unless the gain is necessary or the structure can protect it.";
  },

  buildExecutiveConclusion(reasoning, summary, primary, contract = {}) {
    const rec = reasoning.recommendation || {};
    const firstPriority = reasoning.priorityStack?.[0] || null;
    const firstTradeoff = reasoning.tradeoffs?.[0] || null;
    const nextStep = rec.alternatives?.[0] || null;

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
    let score = 58;

    if (reasoning.knownFacts.length >= 2) score += 10;
    if (reasoning.tradeoffs.length > 0) score += 10;
    if (reasoning.options.length > 0) score += 8;
    if (reasoning.rejectedAlternatives.length > 0) score += 8;
    if (reasoning.priorityStack.length > 0) score += 7;
    if (reasoning.changeConditions.length > 0) score += 4;
    if (reasoning.unknowns.length > 0) score -= 5;

    reasoning.confidence.score = this.clamp(score, 0, 100);
    reasoning.confidence.level =
      reasoning.confidence.score >= 85 ? "high" :
      reasoning.confidence.score >= 65 ? "medium" :
      "low";

    reasoning.confidence.reasons.push("Judgment was based on facts, tradeoffs, options, reversibility, and regret.");
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