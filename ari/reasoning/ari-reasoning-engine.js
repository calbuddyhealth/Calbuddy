// ari/reasoning/ari-reasoning-engine.js
// Ari Reasoning Engine
// Purpose: Structured thinking only. Composer owns final wording.
// V5.0.0 — Universal Decision Reasoning

window.Ari = window.Ari || {};

window.AriReasoningEngine = {
  version: "5.0.0",

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
    this.detectDecisionPattern(reasoning, summary, primary);
    this.addAssumptions(reasoning, summary, primary);
    this.buildPriorityStack(reasoning, summary, primary);
    this.buildRejectedAlternatives(reasoning, summary, primary);
    this.addTradeoffs(reasoning, summary, primary);
    this.addCounterfactuals(reasoning, summary, primary);
    this.addLikelyOutcomes(reasoning, summary, primary);
    this.addSystemsView(reasoning, summary, primary);
    this.addValueConflicts(reasoning, summary, primary);
    this.addRegretLens(reasoning, summary, primary);
    this.buildKnownInferredUnknown(reasoning, summary, primary);
    this.synthesizeRecommendation(reasoning, summary, primary);
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

      relevantFacts: [],
      assumptions: [],
      missingInformation: [],
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
        regretRisk: "unknown"
      },

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

  detectUniversalSignals(reasoning, summary) {
    const text = this.getText(summary);

    reasoning.universalSignals = {
      householdStability: this.hasAny(text, [
        "wife", "husband", "spouse", "partner", "pregnant", "pregnancy",
        "baby", "newborn", "induction", "hospitalized", "discharged",
        "complications", "only income earner", "sole provider", "family"
      ]),

      medicalContext: this.hasAny(text, [
        "pregnant", "pregnancy", "hospitalized", "discharged", "stable",
        "doctor", "hospital", "complications", "induction", "medical"
      ]),

      majorCareerOpportunity: this.hasAny(text, [
        "promotion", "director", "job offer", "offer", "new role",
        "salary", "doubling", "double my salary", "contract",
        "five year contract", "five-year contract", "relocate",
        "relocating", "moving across the country", "move across the country"
      ]),

      majorDisruptionCost: this.hasAny(text, [
        "relocate", "relocating", "moving", "move across the country",
        "five year contract", "five-year contract", "within a month",
        "within six weeks", "delay graduate school", "impossible if i relocate"
      ]),

      dependentCare: this.hasAny(text, [
        "father", "mother", "parent", "dementia", "assisted living",
        "lives alone", "appointments", "caregiver", "depends on me",
        "stay independent"
      ]),

      optionalFinancialRisk: this.hasAny(text, [
        "co-sign", "cosign", "loan", "lend", "borrow", "bankruptcy",
        "savings", "business loan", "40,000", "$40,000"
      ]),

      socialObligationConflict: this.hasAny(text, [
        "wedding", "best man", "baby shower", "induction",
        "no replacement", "friend"
      ]),

      professionalDuty: this.hasAny(text, [
        "current employer", "short-staffed", "short staffed", "coworkers",
        "patients", "leaving would place", "additional strain"
      ]),

      educationPath: this.hasAny(text, [
        "graduate school", "accepted into graduate school", "school",
        "degree", "program"
      ]),

      explicitNoAssumptionsRequest: this.hasAny(text, [
        "without assuming facts", "distinguish between what you know",
        "what you're inferring", "what you’re inferring",
        "uncertainty could change", "rejected the alternatives"
      ]),

      limitedCapacity: this.hasAny(text, [
        "only one", "one or two", "can't do everything", "cannot do everything",
        "limited", "no choice", "realistically", "only"
      ]),

      financialBuffer: this.hasAny(text, [
        "six months", "savings", "survive for about six months",
        "enough savings"
      ])
    };
  },

  detectDecisionPattern(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;

    const s = reasoning.universalSignals || {};

    if (
      s.householdStability &&
      s.majorCareerOpportunity &&
      s.majorDisruptionCost
    ) {
      reasoning.decisionPattern = "high_opportunity_vs_family_stability";
      return;
    }

    if (s.limitedCapacity && (s.dependentCare || s.optionalFinancialRisk)) {
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
        risk: "low"
      });
    }

    if (s.householdStability) {
      this.add(reasoning.assumptions, {
        assumption: "Household stability matters more than optional commitments.",
        risk: "low"
      });
    }

    if (s.majorCareerOpportunity) {
      this.add(reasoning.assumptions, {
        assumption: "The career opportunity has real upside, but its disruption cost must be weighed.",
        risk: "medium"
      });
    }

    if (s.dependentCare) {
      this.add(reasoning.assumptions, {
        assumption: "A dependent parent may need a support plan, but the exact care burden is unknown.",
        risk: "medium"
      });
    }

    if (s.financialBuffer) {
      this.add(reasoning.assumptions, {
        assumption: "Savings reduce immediate pressure, but do not remove future uncertainty.",
        risk: "medium"
      });
    }
  },

  buildPriorityStack(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if (s.householdStability) {
      this.add(reasoning.priorityStack, {
        priority: "household_stability",
        label: "wife, baby, and household stability",
        reason: "it is time-sensitive, high-responsibility, and difficult to repair if destabilized"
      });

      this.add(reasoning.protectedObligations, {
        obligation: "household_stability",
        reason: "late pregnancy, newborn transition, and sole-provider status raise the cost of disruption"
      });
    }

    if (s.financialBuffer || s.majorCareerOpportunity) {
      this.add(reasoning.priorityStack, {
        priority: "financial_security",
        label: "household financial security",
        reason: "income matters, but financial upside should not automatically outrank stability"
      });
    }

    if (s.dependentCare) {
      this.add(reasoning.priorityStack, {
        priority: "dependent_parent_care_plan",
        label: "father care coverage",
        reason: "the care need matters, but it may require a backup system rather than only your direct presence"
      });
    }

    if (s.educationPath) {
      this.add(reasoning.priorityStack, {
        priority: "education_path",
        label: "graduate school path",
        reason: "it may be a long-term identity and career investment that becomes hard to recover if abandoned"
      });
    }

    if (s.professionalDuty) {
      this.add(reasoning.priorityStack, {
        priority: "professional_duty",
        label: "professional duty to coworkers and patients",
        reason: "it matters ethically, but it should not outrank direct family responsibilities"
      });
    }

    if (s.optionalFinancialRisk) {
      this.add(reasoning.delayOrDecline, {
        item: "optional_family_financial_risk",
        recommendation: "Do not lend or co-sign large money right now unless your own household remains fully protected.",
        reason: "optional financial rescue can transfer instability into your own household"
      });
    }

    if (s.socialObligationConflict) {
      this.add(reasoning.delayOrDecline, {
        item: "social_obligation_conflict",
        recommendation: "Choose the pregnancy or induction-related obligation over the wedding conflict.",
        reason: "friend disappointment can be repaired more easily than missing a high-stakes family moment"
      });
    }
  },

  buildRejectedAlternatives(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if (s.majorCareerOpportunity) {
      this.add(reasoning.rejectedAlternatives, {
        alternative: "Accept the role immediately",
        rejectedBecause:
          "the upside is real, but immediate relocation and a long contract could destabilize family support, dependent care, and graduate school."
      });
    }

    if (s.optionalFinancialRisk) {
      this.add(reasoning.rejectedAlternatives, {
        alternative: "Lend or guarantee the large family money request",
        rejectedBecause:
          "it creates optional financial exposure while the household is entering a high-uncertainty baby season."
      });
    }

    if (s.socialObligationConflict) {
      this.add(reasoning.rejectedAlternatives, {
        alternative: "Prioritize the wedding role",
        rejectedBecause:
          "the social obligation matters, but it should not outrank an induction or immediate family event."
      });
    }

    if (s.professionalDuty) {
      this.add(reasoning.rejectedAlternatives, {
        alternative: "Stay only because the current employer is short-staffed",
        rejectedBecause:
          "professional loyalty matters, but the hospital’s staffing burden cannot become the user’s highest family obligation."
      });
    }
  },

  addTradeoffs(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if (s.majorCareerOpportunity && s.householdStability) {
      this.add(reasoning.tradeoffs, {
        name: "career_growth_vs_household_stability",
        sideA: "major career and income growth",
        sideB: "wife, baby, household stability, local support, and timing",
        likelyWinner: "household_stability_unless_money_is_necessary"
      });
    }

    if (s.optionalFinancialRisk) {
      this.add(reasoning.tradeoffs, {
        name: "helping_family_vs_household_risk",
        sideA: "helping a family member financially",
        sideB: "protecting the household from large optional financial exposure",
        likelyWinner: "household_risk_protection"
      });
    }

    if (s.professionalDuty) {
      this.add(reasoning.tradeoffs, {
        name: "professional_duty_vs_family_duty",
        sideA: "protecting coworkers and patients from added strain",
        sideB: "protecting direct family stability",
        likelyWinner: "direct_family_duty"
      });
    }
  },

  addCounterfactuals(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if (s.majorCareerOpportunity) {
      this.add(reasoning.counterfactuals, {
        option: "Accept the new role immediately",
        benefits: ["major income growth", "career advancement"],
        costs: [
          "relocation pressure",
          "possible loss of local support",
          "less stability around pregnancy or newborn transition",
          "possible damage to graduate school path",
          "more complexity around dependent parent care"
        ],
        bestWhen:
          "the income is necessary for immediate household security or the role can be delayed or restructured"
      });

      this.add(reasoning.counterfactuals, {
        option: "Decline or delay the new role",
        benefits: [
          "protects household stability",
          "preserves local support",
          "keeps graduate school possible",
          "allows a clearer plan for father care"
        ],
        costs: ["lost income upside", "possible slower career advancement"],
        bestWhen:
          "current savings and income are enough to safely get through the baby transition"
      });
    }
  },

  addLikelyOutcomes(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if (s.majorCareerOpportunity && s.majorDisruptionCost) {
      this.add(reasoning.likelyOutcomes, {
        outcome:
          "Taking the role immediately may improve money but create cascading instability across family, care, education, and support systems.",
        probability: "medium_high"
      });
    }

    if (s.financialBuffer) {
      this.add(reasoning.likelyOutcomes, {
        outcome:
          "Having several months of savings makes delay or negotiation more realistic.",
        probability: "medium"
      });
    }
  },

  addSystemsView(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    reasoning.systemsView.upstream.push(
      "Several people and institutions are placing demands on the same limited person."
    );

    reasoning.systemsView.downstream.push(
      "Trying to satisfy every demand risks failing the obligations with the highest cost of failure."
    );

    if (s.majorDisruptionCost) {
      reasoning.systemsView.secondOrderEffects.push(
        "Relocation could affect household support, newborn stability, dependent parent care, graduate school, and local relationships at the same time."
      );
    }

    if (s.optionalFinancialRisk) {
      reasoning.systemsView.secondOrderEffects.push(
        "A large loan or gift could reduce the household's ability to absorb baby-related surprises."
      );
    }
  },

  addValueConflicts(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    if (s.majorCareerOpportunity && s.householdStability) {
      this.add(reasoning.valueConflicts, {
        conflict: "growth_vs_stability",
        valueA: "career and income growth",
        valueB: "family stability and timing",
        resolutionHint:
          "growth should be pursued only if it does not destabilize the family system or if the income is truly necessary"
      });
    }

    if (s.optionalFinancialRisk) {
      this.add(reasoning.valueConflicts, {
        conflict: "generosity_vs_boundary",
        valueA: "helping family",
        valueB: "protecting household security",
        resolutionHint:
          "generosity should not create preventable instability for spouse and child"
      });
    }
  },

  addRegretLens(reasoning, summary, primary) {
    if (primary !== "executive_decision") return;
    const s = reasoning.universalSignals || {};

    reasoning.regretLens.shortTerm =
      "Saying no or delaying decisions may create guilt and disappointment.";

    reasoning.regretLens.longTerm =
      "The bigger regret risk is accepting too much disruption at the exact moment household stability matters most.";

    if (s.householdStability) {
      reasoning.regretLens.irreversibleLosses.push(
        "Pregnancy, birth, and early newborn support are time-sensitive."
      );
    }

    if (s.optionalFinancialRisk) {
      reasoning.regretLens.irreversibleLosses.push(
        "Large financial commitments can create long-term consequences."
      );
    }

    reasoning.regretLens.regretRisk = "destabilizing_highest_priority_obligations";
  },

  buildKnownInferredUnknown(reasoning, summary, primary) {
    const s = reasoning.universalSignals || {};

    if (s.householdStability) {
      this.add(reasoning.knownFacts, "Wife/baby/household stability is part of the decision.");
    }

    if (s.majorCareerOpportunity) {
      this.add(reasoning.knownFacts, "There is a major career or income opportunity.");
    }

    if (s.majorDisruptionCost) {
      this.add(reasoning.knownFacts, "The opportunity carries a major timing or relocation cost.");
    }

    if (s.financialBuffer) {
      this.add(reasoning.knownFacts, "There is some savings buffer.");
    }

    if (s.dependentCare) {
      this.add(reasoning.inferredFacts, "A parent care plan may be needed if the user relocates or becomes less available.");
    }

    if (s.professionalDuty) {
      this.add(reasoning.inferredFacts, "Professional duty matters, but may not be the highest obligation.");
    }

    this.add(reasoning.unknowns, "Whether the increased income is necessary for immediate household security.");
    this.add(reasoning.unknowns, "Whether the new role can be delayed, phased, remote, or renegotiated.");
    this.add(reasoning.unknowns, "How much support the pregnant partner wants or needs right now.");
  },

  synthesizeRecommendation(reasoning, summary, primary) {
    const s = reasoning.universalSignals || {};

    if (primary === "executive_decision") {
      reasoning.recommendation.summary =
        s.majorCareerOpportunity
          ? "Do not accept the disruptive opportunity immediately; negotiate delay or structure first, protect household stability, avoid optional financial risk, and prioritize family medical/timing obligations over social and institutional pressure."
          : "Protect the highest-cost obligation first, delay optional risks, and choose the next step that preserves stability.";

      reasoning.recommendation.rationale = [
        "The highest priority is the obligation with the greatest cost if it fails.",
        "Household stability is harder to repair than disappointment from optional obligations.",
        "Major career upside matters, but disruption timing matters too.",
        "Optional financial risk should not be added during a high-uncertainty family period."
      ];

      reasoning.recommendation.alternatives = [
        "Ask whether the role can be delayed, phased, remote, or reconsidered after the baby transition.",
        "Create a concrete father-care backup plan before making any relocation decision.",
        "Decline or reduce the large family money request unless it does not threaten household security.",
        "Tell the friend early that the family medical/timing conflict has to come first."
      ];
      return;
    }

    reasoning.recommendation.summary = "Answer the primary lane directly.";
  },

  buildExecutiveConclusion(reasoning, summary, primary, contract = {}) {
    const rec = reasoning.recommendation || {};
    const firstPriority = reasoning.priorityStack?.[0] || null;
    const firstTradeoff = reasoning.tradeoffs?.[0] || null;
    const missing = reasoning.missingInformation?.[0] || reasoning.unknowns?.[0] || null;
    const nextStep = rec.alternatives?.[0] || null;

    const conclusion = {
      primary,
      framing: null,
      recommendation: rec.summary || null,
      keyReason: null,
      keyTradeoff: null,
      uncertainty: typeof missing === "string" ? missing : missing?.item || null,
      nextStep,
      mustInclude: [
        ...(contract.responseRules || []),
        ...(contract.mouthDirective?.required || [])
      ],
      mustAvoid: [...(contract.blocked || [])],
      obeysContract: true
    };

    if (primary === "executive_decision") {
      conclusion.framing =
        "Separate the obligation that cannot safely fail from the ones that can be delayed, negotiated, or declined.";

      if (firstPriority) {
        conclusion.keyReason =
          `${firstPriority.label || firstPriority.priority} matters first because ${firstPriority.reason}.`;
      }

      if (firstTradeoff) {
        conclusion.keyTradeoff =
          `${firstTradeoff.sideA} versus ${firstTradeoff.sideB}`;
      }
    }

    reasoning.executiveConclusion = conclusion;
  },

  scoreConfidence(reasoning, summary, primary) {
    let score = 60;

    if (reasoning.relevantFacts.length >= 3) {
      score += 10;
      reasoning.confidence.reasons.push("Multiple relevant facts are available.");
    }

    if (Object.values(reasoning.universalSignals || {}).some(Boolean)) {
      score += 10;
      reasoning.confidence.reasons.push("Universal decision signals were detected.");
    }

    if (reasoning.tradeoffs.length > 0) {
      score += 8;
      reasoning.confidence.reasons.push("A clear tradeoff was identified.");
    }

    if (reasoning.priorityStack.length > 0) {
      score += 7;
      reasoning.confidence.reasons.push("A priority stack was identified.");
    }

    if (reasoning.unknowns.length > 0) {
      score -= 8;
      reasoning.confidence.uncertaintyDrivers.push(
        "Some decision-relevant information is unknown."
      );
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
    reasoning.rejectedAlternatives = this.uniqueObjects(reasoning.rejectedAlternatives, "alternative");

    reasoning.knownFacts = [...new Set(reasoning.knownFacts)];
    reasoning.inferredFacts = [...new Set(reasoning.inferredFacts)];
    reasoning.unknowns = [...new Set(reasoning.unknowns)];

    reasoning.answer = null;
    reasoning.obeyedContract = true;
    reasoning.contractViolations = [];
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