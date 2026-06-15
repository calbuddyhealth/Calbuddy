// ari/governance/ari-situation-review-console.js
// Ari Situation Review Console
// Purpose: Diagnostic layer for Ari's Safety Gate, Observer, Situation Map, Triage, Situation Contract, and final response.
// Diagnostic only. Does NOT control the response.
// V3.1.0

window.AriSituationReviewConsole = {
  version: "3.1.0",

  review(input = {}) {
    const summary = input.summary || input || {};
    const map = summary.situationMap || {};
    const triage = summary.triage || summary.ariTriage || {};
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

      triage: {
        ran: triage.triageEngineRan === true || summary.triageEngineRan === true,
        primaryLane: triage.primaryLane || summary.triagePrimaryLane || null,
        supportLanes: triage.supportLanes || summary.triageSupportLanes || [],
        briefLanes: triage.briefLanes || summary.triageBriefLanes || [],
        contextLanes: triage.contextLanes || summary.triageContextLanes || [],
        deferredLanes: triage.deferredLanes || summary.triageDeferredLanes || [],
        blockedLanes: triage.blockedLanes || summary.triageBlockedLanes || [],
        responseShape: triage.responseShape || summary.triageResponseShape || null,
        responseConstraints: triage.responseConstraints || summary.triageResponseConstraints || [],
        confidence: triage.confidence ?? summary.triageConfidence ?? null,
        urgency: triage.urgency || summary.triageUrgency || null,
        gravity: triage.gravity ?? summary.triageGravity ?? null,
        candidates: triage.candidates || summary.triageCandidates || [],
        reasons: triage.reasons || summary.triageReasons || []
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
        triageEngine: 0,
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

    this.buildReasoningPath(summary, map, triage, contract, safetyGate, observer, review);
    this.findPossibleInterpretations(map, triage, contract, review);
    this.findUncertaintyAreas(summary, map, triage, contract, safetyGate, observer, review);
    this.findBlindSpots(summary, map, triage, contract, review);
    this.findWarnings(summary, map, triage, contract, review);
    this.score(summary, map, triage, contract, safetyGate, observer, review);
    this.suggestFixes(review);
    this.finalize(review);

    return review;
  },

  addUnique(list, item) {
    if (item && !list.includes(item)) list.push(item);
  },

  buildReasoningPath(summary, map, triage, contract, safetyGate, observer, review) {
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

    (map.domains || []).forEach(domain => review.reasoningPath.push(`Detected domain: ${domain}.`));
    (map.situations || []).forEach(situation => review.reasoningPath.push(`Detected situation: ${situation}.`));

    if (map.primaryLaneSuggestion) {
      review.reasoningPath.push(`Situation Map suggested primary lane: ${map.primaryLaneSuggestion}.`);
    }

    review.reasoningPath.push(
      review.triage.ran
        ? `Triage Engine selected primary lane: ${review.triage.primaryLane}.`
        : "Triage Engine did not run."
    );

    if (review.triage.responseShape) {
      review.reasoningPath.push(`Triage response shape: ${review.triage.responseShape}.`);
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

  findPossibleInterpretations(map, triage, contract, review) {
    const domains = map.domains || [];
    const situations = map.situations || [];

    const add = (name, confidence, reason) => {
      review.possibleInterpretations.push({ name, confidence, reason });
    };

    if (domains.includes("builder_domain") || situations.includes("building_or_debugging_context")) {
      add("build_or_debug_request", 0.9, "Builder domain or debugging situation detected.");
    }

    if (domains.includes("knowledge_domain")) {
      add("teaching_or_explanation_request", 0.9, "Knowledge domain detected.");
    }

    if (domains.includes("emotion_context_domain")) {
      add("emotional_attunement_need", 0.78, "Emotion context domain detected.");
    }

    if (domains.includes("medical_body_domain") || domains.includes("medical_context_domain") || domains.includes("body_signal_domain")) {
      add("body_or_health_concern", 0.86, "Medical/body domain detected.");
    }

    if (domains.includes("family_context_domain")) {
      add("family_or_caregiving_context", 0.82, "Family context domain detected.");
    }

    if (situations.includes("tradeoff_or_competing_priorities")) {
      add("decision_conflict", 0.8, "Decision/tradeoff situation detected.");
    }

    if (triage.primaryLane) {
      add(`triage_primary_${triage.primaryLane}`, 0.94, "Triage Engine selected the primary lane.");
    }

    if (contract.primary) {
      add(`contract_primary_${contract.primary}`, 0.95, "Situation Contract selected the primary lane.");
    }
  },

  findUncertaintyAreas(summary, map, triage, contract, safetyGate, observer, review) {
    if (!safetyGate.safetyContextGateRan) this.addUnique(review.uncertaintyAreas, "Safety Context Gate missing.");
    if (!observer.observerEvidenceRan) this.addUnique(review.uncertaintyAreas, "Observer Evidence missing.");
    if (!map.situationMapRan) this.addUnique(review.uncertaintyAreas, "Situation Map missing.");
    if (!review.triage.ran) this.addUnique(review.uncertaintyAreas, "Triage Engine missing.");
    if (!contract.situationContractRan) this.addUnique(review.uncertaintyAreas, "Situation Contract missing.");
    if ((map.situations || []).length === 0) this.addUnique(review.uncertaintyAreas, "No situations detected.");
    if (!review.triage.primaryLane) this.addUnique(review.uncertaintyAreas, "No triage primary lane selected.");
    if (!contract.primary) this.addUnique(review.uncertaintyAreas, "No contract primary lane selected.");

    if (contract.clarity?.needed && !contract.clarity?.question) {
      this.addUnique(review.uncertaintyAreas, "Contract says clarity is needed but no question was provided.");
    }
  },

  findBlindSpots(summary, map, triage, contract, review) {
    const domains = map.domains || [];
    const risks = map.risks || [];
    const response = String(summary.finalResponse || "").toLowerCase();

    if (triage.primaryLane && contract.primary && triage.primaryLane !== contract.primary) {
      this.addUnique(review.blindSpots, "Triage primary and Situation Contract primary do not match.");
    }

    if (domains.includes("emotion_context_domain")) {
      const emotionPreserved =
        contract.primary === "emotion" ||
        (contract.support || []).includes("emotion") ||
        (contract.brief || []).includes("emotion") ||
        (contract.context || []).includes("emotion");

      if (!emotionPreserved && !["teacher", "builder", "safety", "medical_body", "risk_clarification"].includes(contract.primary)) {
        this.addUnique(review.blindSpots, "Emotion detected but not preserved in Situation Contract.");
      }
    }

    const medicalRisk =
      risks.includes("confirmed_medical_urgency") ||
      risks.includes("context_only_not_emergency") ||
      domains.includes("medical_body_domain") ||
      domains.includes("body_signal_domain");

    if (medicalRisk && !["safety", "medical_body", "risk_clarification", "medical_context"].includes(contract.primary)) {
      this.addUnique(review.blindSpots, "Medical/body risk detected but contract primary is not safety, medical_body, risk_clarification, or medical_context.");
    }

    if (contract.primary === "builder" && !response.includes("code") && !response.includes("replace") && !response.includes("step")) {
      this.addUnique(review.blindSpots, "Builder contract selected but final response may not be practical enough.");
    }

    if (contract.primary === "teacher" && !response.length) {
      this.addUnique(review.blindSpots, "Teacher contract selected but final response is empty.");
    }
  },

  findWarnings(summary, map, triage, contract, review) {
    if (!review.triage.ran) {
      this.addUnique(review.warnings, "Triage Engine is not running.");
      this.addUnique(review.likelyFailurePoints, "Pipeline may be falling back to Situation Map only.");
    }

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

  score(summary, map, triage, contract, safetyGate, observer, review) {
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

if (map.situationMapRan) mapScore += 40;
if (map.primaryLaneSuggestion || map.primaryLane) mapScore += 25;
if (map.responseRequirements?.length) mapScore += 15;
if (map.confidence >= 80) mapScore += 10;
if ((map.domains || []).length) mapScore += 5;
if ((map.situations || []).length) mapScore += 5;

review.scores.situationMap = this.clamp(mapScore);

    let triageScore = 0;
    if (review.triage.ran) triageScore += 35;
    if (review.triage.primaryLane) triageScore += 25;
    if (review.triage.responseShape) triageScore += 15;
    if ((review.triage.responseConstraints || []).length) triageScore += 15;
    if ((review.triage.reasons || []).length) triageScore += 10;
    review.scores.triageEngine = this.clamp(triageScore);

    let contractScore = 0;
    if (contract.situationContractRan) contractScore += 35;
    if (contract.primary) contractScore += 25;
    if (contract.responseShape) contractScore += 20;
    if (contract.mouthDirective) contractScore += 10;
    if (Array.isArray(contract.reasons) && contract.reasons.length) contractScore += 10;
    review.scores.situationContract = this.clamp(contractScore);

    let authority = 50;
    if (summary.responseIntentLayer === "situation_contract") authority += 25;
    if (summary.contractAuthorityReasserted) authority += 10;
    if (contract.primary && summary.situationContractPrimary === contract.primary) authority += 10;
    if (triage.primaryLane && contract.primary === triage.primaryLane) authority += 5;
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
    review.scores.organismHealth = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  },

  clamp(n, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Number(n) || 0));
  },

  suggestFixes(review) {
    if (review.blindSpots.includes("Triage primary and Situation Contract primary do not match.")) {
      review.suggestedFixes.push("Make Situation Contract read triage.primaryLane before Situation Map primaryLaneSuggestion.");
    }

    if (review.warnings.includes("Triage Engine is not running.")) {
      review.suggestedFixes.push("Check script load path and pipeline call: window.AriTriageEngine.run(summary).");
    }

    if (review.blindSpots.includes("Emotion detected but not preserved in Situation Contract.")) {
      review.suggestedFixes.push("Allow emotion as support, brief, or context lane when emotion_context_domain is detected.");
    }

    if (review.blindSpots.includes("Medical/body risk detected but contract primary is not safety, medical_body, risk_clarification, or medical_context.")) {
      review.suggestedFixes.push("Make Triage and Situation Contract choose safety, medical_body, risk_clarification, or medical_context when medical/body risk exists.");
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