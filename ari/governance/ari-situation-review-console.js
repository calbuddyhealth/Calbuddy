// ari/governance/ari-situation-review-console.js
// Ari Situation Review Console
// Purpose: Diagnostic layer for Ari's Safety Gate, Observer, Situation Map, Situation Contract, and final response.
// Diagnostic only. Does NOT control the response.
// V3.0

window.AriSituationReviewConsole = {
  version: "3.0.0",

  review(input = {}) {
    const summary = input.summary || input || {};
    const map = summary.situationMap || {};
    const contract = summary.situationContract || {};
    const safetyGate = summary.safetyContextGate || {};
    const observer = summary.observerEvidence || {};

    const review = {
      situationReviewConsoleRan: true,
      situationReviewConsoleVersion: this.version,
      source: "ari-situation-review-console",

      prompt: summary.userMessage || summary.message || summary.input || "",

      safetyGate: {
        ran: safetyGate.safetyContextGateRan === true,
        riskLevel: safetyGate.riskLevel || "none",
        riskType: safetyGate.riskType || "none",
        override: safetyGate.override || null,
        followUpNeeded: safetyGate.followUpNeeded === true,
        followUpQuestion: safetyGate.followUpQuestion || null
      },

      observer: {
        ran: observer.observerEvidenceRan === true,
        count: observer.observationCount || 0,
        observedTypes: observer.observedTypes || [],
        observedValues: observer.observedValues || [],
        strongestObservation: observer.strongestObservation || null,
        strongestObservationCategory: observer.strongestObservationCategory || null
      },

      detected: {
        domains: map.domains || [],
        situations: map.situations || [],
        needs: map.needs || [],
        risks: map.risks || [],
        questions: map.questions || [],
        responseRequirements: map.responseRequirements || []
      },

      situationContract: {
        ran: contract.situationContractRan === true,
        primary: contract.primary || null,
        support: contract.support || [],
        brief: contract.brief || [],
        context: contract.context || [],
        deferred: contract.deferred || [],
        blocked: contract.blocked || [],
        risk: contract.risk || {},
        clarity: contract.clarity || {},
        responseShape: contract.responseShape || null,
        responseRules: contract.responseRules || [],
        mouthDirective: contract.mouthDirective || {},
        reasons: contract.reasons || []
      },

      response: {
        responseIntent: summary.responseIntent || null,
        responseShape: summary.responseShape || contract.responseShape || null,
        responseIntentLayer: summary.responseIntentLayer || null,
        mouthPattern: summary.mouthResponsePattern || null,
        languageMode: summary.languageMode || null,
        finalResponse: summary.finalResponse || null
      },

      scores: {
        safetyGate: 0,
        observerEvidence: 0,
        situationMap: 0,
        situationContract: 0,
        contractAuthority: 0,
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

    this.buildReasoningPath(summary, map, contract, safetyGate, observer, review);
    this.findPossibleInterpretations(map, contract, review);
    this.findUncertaintyAreas(summary, map, contract, safetyGate, observer, review);
    this.findBlindSpots(summary, map, contract, review);
    this.findWarnings(summary, map, contract, review);
    this.score(summary, map, contract, safetyGate, observer, review);
    this.suggestFixes(review);
    this.finalize(review);

    return review;
  },

  addUnique(list, item) {
    if (item && !list.includes(item)) list.push(item);
  },

  buildReasoningPath(summary, map, contract, safetyGate, observer, review) {
    review.reasoningPath.push(
      safetyGate.safetyContextGateRan
        ? "Safety Context Gate ran."
        : "Safety Context Gate did not run."
    );

    review.reasoningPath.push(
      observer.observerEvidenceRan
        ? `Observer Evidence ran with ${observer.observationCount || 0} observations.`
        : "Observer Evidence did not run."
    );

    review.reasoningPath.push(
      map.situationMapRan
        ? "Situation Map ran and used observer/safety context."
        : "Situation Map did not run."
    );

    (map.domains || []).forEach(domain => {
      review.reasoningPath.push(`Detected domain: ${domain}.`);
    });

    (map.situations || []).forEach(situation => {
      review.reasoningPath.push(`Detected situation: ${situation}.`);
    });

    if (map.primaryLaneSuggestion) {
      review.reasoningPath.push(`Situation Map suggested primary lane: ${map.primaryLaneSuggestion}.`);
    }

    review.reasoningPath.push(
      contract.situationContractRan
        ? `Situation Contract selected primary lane: ${contract.primary}.`
        : "Situation Contract did not run."
    );

    if (contract.responseShape) {
      review.reasoningPath.push(`Situation Contract response shape: ${contract.responseShape}.`);
    }

    if (summary.responseIntentLayer === "situation_contract") {
      review.reasoningPath.push("Response Intent obeyed Situation Contract.");
    }

    if (summary.languageMode) {
      review.reasoningPath.push(`Composer language mode: ${summary.languageMode}.`);
    }
  },

  findPossibleInterpretations(map, contract, review) {
    const domains = map.domains || [];
    const situations = map.situations || [];

    const add = (name, confidence, reason) => {
      review.possibleInterpretations.push({ name, confidence, reason });
    };

    if (domains.includes("builder_domain") || situations.includes("building_or_debugging_context")) {
      add("build_or_debug_request", 0.9, "Builder domain or debugging situation detected.");
    }

    if (domains.includes("teacher_domain") || domains.includes("knowledge_learning_domain")) {
      add("teaching_or_explanation_request", 0.86, "Teaching/knowledge domain detected.");
    }

    if (domains.includes("emotion_domain")) {
      add("emotional_distress_or_regulation_need", 0.78, "Emotion domain detected.");
    }

    if (domains.includes("medical_body_domain")) {
      add("body_or_health_concern", 0.86, "Medical/body domain detected.");
    }

    if (domains.includes("family_domain") || domains.includes("family_caregiving_domain")) {
      add("family_or_caregiving_pressure", 0.82, "Family/caregiving domain detected.");
    }

    if (situations.includes("decision_or_tradeoff")) {
      add("decision_conflict", 0.8, "Decision/tradeoff situation detected.");
    }

    if (contract.primary) {
      add(`contract_primary_${contract.primary}`, 0.95, "Situation Contract selected the primary lane.");
    }
  },

  findUncertaintyAreas(summary, map, contract, safetyGate, observer, review) {
    if (!safetyGate.safetyContextGateRan) {
      this.addUnique(review.uncertaintyAreas, "Safety Context Gate missing.");
    }

    if (!observer.observerEvidenceRan) {
      this.addUnique(review.uncertaintyAreas, "Observer Evidence missing.");
    }

    if (!map.situationMapRan) {
      this.addUnique(review.uncertaintyAreas, "Situation Map missing.");
    }

    if (!contract.situationContractRan) {
      this.addUnique(review.uncertaintyAreas, "Situation Contract missing.");
    }

    if ((map.situations || []).length === 0) {
      this.addUnique(review.uncertaintyAreas, "No situations detected.");
    }

    if (!contract.primary) {
      this.addUnique(review.uncertaintyAreas, "No contract primary lane selected.");
    }

    if (contract.clarity?.needed && !contract.clarity?.question) {
      this.addUnique(review.uncertaintyAreas, "Contract says clarity is needed but no question was provided.");
    }
  },

  findBlindSpots(summary, map, contract, review) {
    const domains = map.domains || [];
    const risks = map.risks || [];
    const response = String(summary.finalResponse || "").toLowerCase();

    if (domains.includes("emotion_domain")) {
      const emotionPreserved =
        contract.primary === "emotion" ||
        (contract.support || []).includes("emotion") ||
        (contract.brief || []).includes("emotion") ||
        (contract.context || []).includes("emotion");

      if (!emotionPreserved) {
        this.addUnique(review.blindSpots, "Emotion detected but not preserved in Situation Contract.");
      }
    }

    const medicalRisk =
      risks.includes("urgent_medical_or_body_risk") ||
      risks.includes("pregnancy_body_risk") ||
      risks.includes("medical_or_body_risk");

    if (medicalRisk && !["safety", "medical_body", "risk_clarification"].includes(contract.primary)) {
      this.addUnique(review.blindSpots, "Medical/body risk detected but contract primary is not safety or medical_body.");
    }

    if (contract.primary === "builder" && !response.includes("debug") && !response.includes("code") && !response.includes("login")) {
      this.addUnique(review.blindSpots, "Builder contract selected but final response may not be practical enough.");
    }

    if (contract.primary === "teacher" && !response.length) {
      this.addUnique(review.blindSpots, "Teacher contract selected but final response is empty.");
    }
  },

  findWarnings(summary, map, contract, review) {
    if (
      summary.uncertaintyType === "missing_information" &&
      contract.primary &&
      contract.primary !== "risk_clarification" &&
      summary.responseIntentLayer !== "situation_contract"
    ) {
      this.addUnique(review.warnings, "Legacy uncertainty may still be overriding Situation Contract.");
      this.addUnique(review.likelyFailurePoints, "Response Intent did not show situation_contract authority.");
    }

    if (
      summary.finalResponse &&
      String(summary.finalResponse).includes("What do you need to understand before choosing a direction")
    ) {
      this.addUnique(review.warnings, "Generic uncertainty recovery question detected.");
      this.addUnique(review.likelyFailurePoints, "Legacy uncertainty language leaked into final response.");
    }

    if (contract.primary === "builder" && summary.languageMode !== "building") {
      this.addUnique(review.warnings, "Builder contract selected but composer languageMode is not building.");
    }

    if (contract.primary === "teacher" && summary.languageMode !== "teaching") {
      this.addUnique(review.warnings, "Teacher contract selected but composer languageMode is not teaching.");
    }
  },

  score(summary, map, contract, safetyGate, observer, review) {
    let safety = 0;
    if (safetyGate.safetyContextGateRan) safety += 60;
    if (safetyGate.riskLevel) safety += 20;
    if (safetyGate.shouldStopNormalResponse === false || safetyGate.override !== undefined) safety += 20;
    review.scores.safetyGate = this.clamp(safety);

    let observerScore = 0;
    if (observer.observerEvidenceRan) observerScore += 50;
    observerScore += Math.min(30, Number(observer.observationCount || 0) * 10);
    if ((observer.observedTypes || []).length) observerScore += 20;
    review.scores.observerEvidence = this.clamp(observerScore);

    let mapScore = 0;
    if (map.situationMapRan) mapScore += 35;
    mapScore += Math.min(25, (map.domains || []).length * 8);
    mapScore += Math.min(25, (map.situations || []).length * 8);
    mapScore += Math.min(15, (map.needs || []).length * 5);
    review.scores.situationMap = this.clamp(mapScore);

    let contractScore = 0;
    if (contract.situationContractRan) contractScore += 35;
    if (contract.primary) contractScore += 25;
    if (contract.responseShape) contractScore += 20;
    if (contract.mouthDirective) contractScore += 10;
    if (Array.isArray(contract.reasons) && contract.reasons.length) contractScore += 10;
    review.scores.situationContract = this.clamp(contractScore);

    let authority = 50;
    if (summary.responseIntentLayer === "situation_contract") authority += 30;
    if (summary.contractAuthorityReasserted) authority += 10;
    if (contract.primary && summary.situationContractPrimary === contract.primary) authority += 10;
    review.scores.contractAuthority = this.clamp(authority);

    let fit = 70;
    fit -= Math.min(40, review.blindSpots.length * 10);
    fit -= Math.min(30, review.warnings.length * 8);

    if (contract.primary === "builder" && summary.languageMode === "building") fit += 15;
    if (contract.primary === "teacher" && summary.languageMode === "teaching") fit += 15;
    if (contract.primary === "emotion" && summary.languageMode?.includes("emotion")) fit += 10;
    if (contract.primary === "medical_body" && summary.languageMode === "safety") fit += 10;
    if (contract.primary === "safety" && summary.languageMode === "safety") fit += 10;

    review.scores.responseFit = this.clamp(fit);

    const values = Object.values(review.scores).filter(n => typeof n === "number");
    review.scores.organismHealth = Math.round(
      values.reduce((a, b) => a + b, 0) / values.length
    );
  },

  clamp(n, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Number(n) || 0));
  },

  suggestFixes(review) {
    if (review.blindSpots.includes("Emotion detected but not preserved in Situation Contract.")) {
      review.suggestedFixes.push("Allow emotion as support, brief, or context lane when emotion_domain is detected.");
    }

    if (review.blindSpots.includes("Medical/body risk detected but contract primary is not safety or medical_body.")) {
      review.suggestedFixes.push("Make Situation Contract choose safety, medical_body, or risk_clarification when medical/body risk exists.");
    }

    if (review.warnings.includes("Legacy uncertainty may still be overriding Situation Contract.")) {
      review.suggestedFixes.push("Ensure Response Intent Engine returns immediately when Situation Contract exists.");
    }

    if (review.warnings.includes("Generic uncertainty recovery question detected.")) {
      review.suggestedFixes.push("Block generic uncertainty recovery when Situation Contract primary is builder, teacher, planning, safety, or medical_body.");
    }

    if (review.suggestedFixes.length === 0) {
      review.suggestedFixes.push("No immediate structural fix detected. Test final response quality next.");
    }
  },

  finalize(review) {
    const health = review.scores.organismHealth;

    if (health >= 85 && review.blindSpots.length === 0 && review.warnings.length === 0) {
      review.passFail = "pass";
    } else if (health >= 65) {
      review.passFail = "partial_pass";
    } else {
      review.passFail = "fail";
    }
  }
};