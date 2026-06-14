// ari/governance/ari-situation-review-console.js
// Ari Situation Review Console
// Purpose: Advanced diagnostic layer for Ari's perception, routing, and response planning.
// Diagnostic only. Does NOT control the response.
// V2.0

window.AriSituationReviewConsole = {
  version: "2.0.0",

  review(input = {}) {
    const summary = input.summary || input || {};
    const map = summary.situationMap || {};
    const plan = summary.multiLanePlan || {};

    const review = {
      situationReviewConsoleRan: true,
      situationReviewConsoleVersion: this.version,
      source: "ari-situation-review-console",

      prompt: summary.userMessage || summary.message || summary.input || "",

      detected: {
        domains: map.domains || [],
        situations: map.situations || [],
        needs: map.needs || [],
        risks: map.risks || [],
        questions: map.questions || [],
        responseRequirements: map.responseRequirements || []
      },

      planner: {
        primaryLane: plan.primaryLane || null,
        lanes: plan.lanes || [],
        laneWeights: plan.laneWeights || {},
        laneRoles: plan.laneRoles || {},
        laneBudgets: plan.laneBudgets || {},
        responseShape: plan.responseShape || null,
        responseOrder: plan.responseOrder || [],
        deferredLanes: plan.deferredLanes || [],
        blockedLanes: plan.blockedLanes || [],
        conflictRules: plan.conflictRules || []
      },

      governor: {
        domainLead: summary.domainLead || null,
        domainLeadOrgan: summary.domainLeadOrgan || null,
        domainMode: summary.domainMode || null,
        domainForced: summary.domainForced || false,
        blockedPermissions: summary.domainBlockedPermissions || [],
        permissions: summary.domainPermissions || {}
      },

      authority: {
        leadOrgan: summary.authorityLeadOrgan || null,
        leadMode: summary.authorityLeadMode || null,
        forceDirectAnswer: summary.authorityForceDirectAnswer || false,
        suppressRecoveryQuestion: summary.authoritySuppressRecoveryQuestion || false,
        allows: summary.authorityAllows || {},
        blockedSystems: summary.authorityBlockedSystems || []
      },

      organism: {
        function: summary.organismFunction || summary.organismPrimaryFunction || null,
        need: summary.organismNeed || null,
        urgency: summary.organismUrgency || null,
        needsStabilization: summary.organismNeedsStabilization || false
      },

      response: {
        responseIntent: summary.responseIntent || null,
        responseShape: summary.responseShape || summary.mouthResponsePattern || null,
        mouthPattern: summary.mouthResponsePattern || null,
        languageMode: summary.languageMode || null,
        finalResponse: summary.finalResponse || null
      },

      scores: {
        detection: 0,
        prioritization: 0,
        lanePlanning: 0,
        uncertainty: 0,
        emotionalAttunement: 0,
        safetyBoundary: 0,
        responseFit: 0,
        organismHealth: 0
      },

      possibleInterpretations: [],
      uncertaintyAreas: [],
      blindSpots: [],
      warnings: [],
      likelyFailurePoints: [],
      suggestedFixes: [],
      reasoningPath: [],
      passFail: "unknown"
    };

    this.buildReasoningPath(summary, map, plan, review);
    this.findPossibleInterpretations(map, review);
    this.findUncertaintyAreas(summary, map, plan, review);
    this.findBlindSpots(summary, map, plan, review);
    this.findWarnings(summary, map, plan, review);
    this.score(summary, map, plan, review);
    this.suggestFixes(review);
    this.finalize(review);

    return review;
  },

  addUnique(list, item) {
    if (item && !list.includes(item)) list.push(item);
  },

  buildReasoningPath(summary, map, plan, review) {
    if (map.situationMapRan) {
      review.reasoningPath.push("Situation Map ran and preserved detected situations.");
    } else {
      review.reasoningPath.push("Situation Map did not run or was not attached to summary.");
    }

    (map.domains || []).forEach(domain => {
      review.reasoningPath.push(`Detected domain: ${domain}.`);
    });

    (map.situations || []).forEach(situation => {
      review.reasoningPath.push(`Detected situation: ${situation}.`);
    });

    if (map.urgency) {
      review.reasoningPath.push(`Situation urgency assessed as ${map.urgency}.`);
    }

    if (map.complexity) {
      review.reasoningPath.push(`Situation complexity assessed as ${map.complexity}.`);
    }

    if (plan.multiLanePlannerRan) {
      review.reasoningPath.push(`Multi-Lane Planner chose primary lane: ${plan.primaryLane}.`);
    } else {
      review.reasoningPath.push("Multi-Lane Planner did not run or was not attached to summary.");
    }

    if (plan.responseShape) {
      review.reasoningPath.push(`Planner response shape: ${plan.responseShape}.`);
    }

    if (summary.domainLead) {
      review.reasoningPath.push(`Universal Governor selected domain lead: ${summary.domainLead}.`);
    }

    if (summary.responseIntent) {
      review.reasoningPath.push(`Response intent selected: ${summary.responseIntent}.`);
    }
  },

  findPossibleInterpretations(map, review) {
    const domains = map.domains || [];
    const situations = map.situations || [];

    const add = (name, confidence, reason) => {
      review.possibleInterpretations.push({ name, confidence, reason });
    };

    if (domains.includes("emotion_domain")) {
      add("emotional_distress_or_regulation_need", 0.78, "Emotion domain detected.");
    }

    if (situations.includes("emotional_state_or_regulation_need")) {
      add("low_context_distress", 0.72, "Emotional state/regulation situation detected.");
    }

    if (domains.includes("medical_body_domain")) {
      add("body_or_health_concern", 0.86, "Medical/body domain detected.");
    }

    if (domains.includes("family_caregiving_domain")) {
      add("family_or_caregiving_pressure", 0.82, "Family/caregiving domain detected.");
    }

    if (situations.includes("decision_or_tradeoff")) {
      add("decision_conflict", 0.8, "Decision/tradeoff situation detected.");
    }

    if (situations.includes("competing_priorities")) {
      add("competing_priorities", 0.76, "Tradeoff/competing priorities detected.");
    }

    if (domains.includes("creative_building_domain")) {
      add("build_or_debug_request", 0.82, "Creative/building domain detected.");
    }

    if (domains.includes("wisdom_values_domain")) {
      add("values_or_philosophical_question", 0.74, "Wisdom/values domain detected.");
    }

    if (domains.includes("memory_preference_domain")) {
      add("memory_or_preference_update", 0.9, "Memory/preference domain detected.");
    }
  },

  findUncertaintyAreas(summary, map, plan, review) {
    if (!map.situationMapRan) {
      this.addUnique(review.uncertaintyAreas, "Situation Map missing.");
    }

    if (!plan.multiLanePlannerRan) {
      this.addUnique(review.uncertaintyAreas, "Multi-Lane Planner missing.");
    }

    if ((map.questions || []).length === 0) {
      this.addUnique(review.uncertaintyAreas, "Explicit question unclear.");
    }

    if ((map.situations || []).length === 0) {
      this.addUnique(review.uncertaintyAreas, "No situations detected.");
    }

    if (summary.uncertaintyType === "missing_information") {
      this.addUnique(review.uncertaintyAreas, "Existing uncertainty engine reports missing information.");
    }

    if ((map.domains || []).length >= 3 && !plan.responseShape) {
      this.addUnique(review.uncertaintyAreas, "Multi-domain prompt lacks response shape.");
    }

    if (map.shouldAskClarifyingQuestion && !summary.shouldAskQuestion) {
      this.addUnique(review.uncertaintyAreas, "Situation Map suggests a clarifying question but response intent may suppress it.");
    }
  },

  findBlindSpots(summary, map, plan, review) {
    const domains = map.domains || [];
    const needs = map.needs || [];
    const risks = map.risks || [];

    if (domains.includes("emotion_domain")) {
      const emotionPreserved =
        plan.primaryLane === "emotion" ||
        (plan.supportLanes || []).includes("emotion") ||
        (plan.briefLanes || []).includes("emotion") ||
        plan.shouldPreserveEmotion;

      if (!emotionPreserved) {
        this.addUnique(review.blindSpots, "Emotion detected but not preserved in planner.");
      }
    }

    if (
      risks.includes("medical_or_body_risk") ||
      risks.includes("pregnancy_body_risk")
    ) {
      if (!["safety", "medical_body"].includes(plan.primaryLane)) {
        this.addUnique(review.blindSpots, "Medical/body risk detected but not primary.");
      }
    }

    if (needs.includes("memory_acknowledgment")) {
      const hasMemoryLane =
        plan.primaryLane === "memory" ||
        (plan.lanes || []).some(l => l.name === "memory");

      if (!hasMemoryLane) {
        this.addUnique(review.blindSpots, "Memory request detected but no memory lane planned.");
      }
    }

    if (needs.includes("decision_support")) {
      const hasDecisionLane =
        plan.primaryLane === "executive_decision" ||
        (plan.lanes || []).some(l => l.name === "executive_decision");

      if (!hasDecisionLane) {
        this.addUnique(review.blindSpots, "Decision need detected but no decision lane planned.");
      }
    }

    if ((map.questions || []).length >= 2 && !plan.shouldAcknowledgeMultipleSituations) {
      this.addUnique(review.blindSpots, "Multiple questions detected but not acknowledged.");
    }

    if (summary.finalResponse) {
      const response = String(summary.finalResponse).toLowerCase();

      if (domains.includes("emotion_domain")) {
        const hasValidation =
          response.includes("sounds") ||
          response.includes("that feels") ||
          response.includes("that sounds") ||
          response.includes("i can hear") ||
          response.includes("makes sense");

        if (!hasValidation) {
          this.addUnique(review.blindSpots, "Final response may lack emotional validation.");
        }
      }

      if (
        risks.includes("medical_or_body_risk") ||
        risks.includes("pregnancy_body_risk")
      ) {
        const hasMedicalNextStep =
          response.includes("call") ||
          response.includes("er") ||
          response.includes("urgent") ||
          response.includes("medical") ||
          response.includes("doctor") ||
          response.includes("ob");

        if (!hasMedicalNextStep) {
          this.addUnique(review.blindSpots, "Final response may lack medical next step.");
        }
      }
    }
  },

  findWarnings(summary, map, plan, review) {
    if (summary.domainForced && (map.domains || []).length >= 3) {
      this.addUnique(review.warnings, "Governor forced a domain despite multi-domain situation.");
      this.addUnique(review.likelyFailurePoints, "Universal Governor may be too winner-take-all.");
    }

    if ((summary.domainBlockedPermissions || []).length >= 3) {
      this.addUnique(review.warnings, "Many permissions blocked; useful lanes may be suppressed.");
      this.addUnique(review.likelyFailurePoints, "Authority or Governor overblocking.");
    }

    if (
      summary.uncertaintyType === "missing_information" &&
      summary.finalResponse &&
      String(summary.finalResponse).includes("What do you need to understand before choosing a direction")
    ) {
      this.addUnique(review.warnings, "Generic uncertainty recovery question detected.");
      this.addUnique(review.likelyFailurePoints, "Uncertainty engine overused generic recovery question.");
    }

    if (plan.blindSpots?.length) {
      plan.blindSpots.forEach(b => this.addUnique(review.warnings, `Planner blind spot: ${b}.`));
    }

    if (plan.conflictRules?.length) {
      plan.conflictRules.forEach(rule => {
        review.reasoningPath.push(`Conflict rule applied: ${rule}.`);
      });
    }
  },

  score(summary, map, plan, review) {
    let detection = 0;
    if (map.situationMapRan) detection += 30;
    detection += Math.min(30, (map.domains || []).length * 6);
    detection += Math.min(25, (map.situations || []).length * 5);
    detection += Math.min(15, (map.needs || []).length * 5);
    review.scores.detection = Math.min(100, detection);

    let lanePlanning = 0;
    if (plan.multiLanePlannerRan) lanePlanning += 35;
    if (plan.primaryLane) lanePlanning += 20;
    if ((plan.lanes || []).length) lanePlanning += 20;
    if (plan.responseShape) lanePlanning += 15;
    if (Object.keys(plan.laneWeights || {}).length) lanePlanning += 10;
    review.scores.lanePlanning = Math.min(100, lanePlanning);

    let prioritization = 50;
    const medicalRisk =
      (map.risks || []).includes("medical_or_body_risk") ||
      (map.risks || []).includes("pregnancy_body_risk");

    if (medicalRisk && ["safety", "medical_body"].includes(plan.primaryLane)) prioritization += 35;
    if (medicalRisk && !["safety", "medical_body"].includes(plan.primaryLane)) prioritization -= 35;
    if ((map.needs || []).includes("memory_acknowledgment") && plan.primaryLane === "memory") prioritization += 25;
    if ((map.needs || []).includes("decision_support") && (plan.lanes || []).some(l => l.name === "executive_decision")) prioritization += 20;
    review.scores.prioritization = this.clamp(prioritization);

    let emotional = 50;
    if ((map.domains || []).includes("emotion_domain")) {
      if (
        plan.primaryLane === "emotion" ||
        (plan.supportLanes || []).includes("emotion") ||
        (plan.briefLanes || []).includes("emotion")
      ) {
        emotional += 35;
      } else {
        emotional -= 35;
      }
    }
    review.scores.emotionalAttunement = this.clamp(emotional);

    let safety = 70;
    if (medicalRisk && ["safety", "medical_body"].includes(plan.primaryLane)) safety += 25;
    if (medicalRisk && !["safety", "medical_body"].includes(plan.primaryLane)) safety -= 45;
    review.scores.safetyBoundary = this.clamp(safety);

    let uncertainty = 70;
    if (summary.uncertaintyType === "missing_information") uncertainty -= 10;
    if (review.warnings.some(w => w.includes("Generic uncertainty"))) uncertainty -= 30;
    if ((map.possibleInterpretations || []).length > 1) uncertainty += 5;
    if (review.uncertaintyAreas.length > 0) uncertainty -= Math.min(20, review.uncertaintyAreas.length * 5);
    review.scores.uncertainty = this.clamp(uncertainty);

    let responseFit = 70;
    responseFit -= Math.min(40, review.blindSpots.length * 10);
    responseFit -= Math.min(30, review.warnings.length * 6);
    if (plan.responseShape && summary.mouthResponsePattern && plan.responseShape.includes(summary.mouthResponsePattern)) {
      responseFit += 10;
    }
    review.scores.responseFit = this.clamp(responseFit);

    const values = Object.values(review.scores).filter(n => typeof n === "number");
    review.scores.organismHealth = Math.round(
      values.reduce((a, b) => a + b, 0) / values.length
    );
  },

  clamp(n, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Number(n) || 0));
  },

  suggestFixes(review) {
    if (review.blindSpots.includes("Emotion detected but not preserved in planner.")) {
      review.suggestedFixes.push("Allow emotion as validate/brief lane when emotion_domain is detected.");
    }

    if (review.blindSpots.includes("Medical/body risk detected but not primary.")) {
      review.suggestedFixes.push("Make safety/medical_body override all non-safety primary lanes when medical risk exists.");
    }

    if (review.warnings.includes("Governor forced a domain despite multi-domain situation.")) {
      review.suggestedFixes.push("Update Universal Governor to consume multiLanePlan before forcing a single domain.");
    }

    if (review.warnings.includes("Many permissions blocked; useful lanes may be suppressed.")) {
      review.suggestedFixes.push("Replace binary permission blocking with full/brief/validate/defer/block authority modes.");
    }

    if (review.warnings.includes("Generic uncertainty recovery question detected.")) {
      review.suggestedFixes.push("Rewrite uncertainty recovery to validate, offer a hypothesis, then ask a targeted question.");
    }

    if (review.suggestedFixes.length === 0) {
      review.suggestedFixes.push("No immediate structural fix detected. Test final response quality next.");
    }
  },

  finalize(review) {
    const health = review.scores.organismHealth;

    if (health >= 85 && review.blindSpots.length === 0) {
      review.passFail = "pass";
    } else if (health >= 65) {
      review.passFail = "partial_pass";
    } else {
      review.passFail = "fail";
    }
  }
};