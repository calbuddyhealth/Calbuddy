// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
// Purpose: Run Ari's communication chain in correct order.
// V3.1
// New Core Chain:
// 1. Safety Context Gate
// 2. Observer Evidence
// 3. Situation Map
// 3.5 Triage Engine
// 4. Situation Contract
// 5. Contract Bridge
// 6. Legacy helper organs temporarily
// 7. Contract Authority Reassertion
// 8. Mouth / Composer

window.AriRebirthPipeline = {
  async run(systemSummary = {}) {
    let summary = { ...systemSummary };

    const userMessage =
      summary.userMessage ||
      summary.message ||
      summary.normalizedMessage ||
      summary.input ||
      "";

    summary.userMessage = userMessage;
    summary.message = userMessage;
    summary.input = userMessage;
    summary.normalizedMessage = String(userMessage || "").toLowerCase().trim();

    // 0.10 SAFETY CONTEXT GATE
    const safetyContextGate =
      window.AriSafetyContextGate?.evaluate?.(summary) || {
        safetyContextGateRan: false,
        source: "not-loaded",
        override: null,
        riskLevel: "none",
        riskType: "none",
        followUpNeeded: false,
        followUpQuestion: null
      };

    summary = {
      ...summary,
      safetyContextGate,
      ...safetyContextGate
    };

    // 0.20 OBSERVER NETWORK / RAW EVIDENCE
    const observerResult =
      window.Ari?.observerNetwork?.observe?.(summary) || {
        observerEvidenceRan: false,
        observerEvidenceSource: "not-loaded",
        observations: [],
        observationLedger: [],
        observedTypes: [],
        observedValues: [],
        observationCount: 0
      };

    summary = {
      ...summary,
      observerEvidence: observerResult,
      ...observerResult,

      // Explicit fields for Situation Map compatibility
      observations: observerResult.observations || [],
      observationLedger: observerResult.observationLedger || observerResult.observations || [],
      observedTypes: observerResult.observedTypes || [],
      observedValues: observerResult.observedValues || [],
      observationCount: observerResult.observationCount || 0
    };

    // 0.30 SITUATION MAP
    const situationMap =
      window.AriSituationMapEngine?.build?.(summary) || {
        situationMapRan: false,
        source: "not-loaded",
        situations: [],
        domains: [],
        needs: [],
        risks: [],
        questions: [],
        primaryLaneSuggestion: null,
        supportLaneSuggestions: [],
        briefLaneSuggestions: [],
        contextLaneSuggestions: [],
        deferredLaneSuggestions: []
      };

    summary = {
      ...summary,
      situationMap,
      ...situationMap
    };

// 0.35 TRIAGE ENGINE — BOSS OF ROUTING
const triageOutput =
  window.AriTriageEngine?.run?.(summary) || {};

const triageResult =
  triageOutput.ariTriage || {
    triageEngineRan: false,
    triageEngineSource: "not-loaded",
    primaryLane: summary.primaryLaneSuggestion || null,
    supportLanes: summary.supportLaneSuggestions || [],
    deferredLanes: summary.deferredLaneSuggestions || [],
    blockedLanes: summary.blockedLanes || [],
    responseConstraints: summary.responseConstraints || [],
    confidence: summary.confidence || null,
    reason: "Triage engine not loaded. Falling back to Situation Map."
  };

summary = {
  ...summary,
  ...triageOutput,
  triage: triageResult,
  ...triageResult,

  // Make triage authoritative for contract
  primaryLaneSuggestion:
    triageResult.primaryLane ||
    summary.primaryLaneSuggestion,

  supportLaneSuggestions:
    triageResult.supportLanes ||
    summary.supportLaneSuggestions ||
    [],

  deferredLaneSuggestions:
    triageResult.deferredLanes ||
    summary.deferredLaneSuggestions ||
    [],

  blockedLanes:
    triageResult.blockedLanes ||
    summary.blockedLanes ||
    [],

  responseConstraints:
    triageResult.responseConstraints ||
    summary.responseConstraints ||
    []
};

    // 0.40 SITUATION CONTRACT
    const situationContractResult =
      window.AriSituationContract?.create?.(summary) || {
        situationContractRan: false,
        source: "not-loaded",
        situationContract: null
      };

    summary = {
      ...summary,
      ...situationContractResult
    };

    // 0.45 BRIDGE CONTRACT INTO LEGACY SYSTEMS
    summary = this.applyContractBridge(summary);

    // 0.50 RISK CLARIFICATION STAYS CONTRACT-LED,
// but still flows through Human Language + Mouth + Composer.
   
    const runStep = async (engine, method) => {
      if (engine && typeof engine[method] === "function") {
        const result = await engine[method](summary);
        summary = { ...summary, ...(result || {}) };
      }
    };

    // LEGACY HELPERS — TEMPORARY UNTIL COMPOSER FULLY USES SITUATION CONTRACT

    // 1. HUMAN NEEDS NETWORK
    if (
      window.Ari &&
      window.Ari.needEngine &&
      typeof window.Ari.needEngine.evaluate === "function"
    ) {
      const needResult = await window.Ari.needEngine.evaluate(summary) || {};
      summary = { ...summary, ...needResult };
    } else {
      summary = {
        ...summary,
        needEngineRan: false,
        primaryHumanNeed: summary.primaryHumanNeed || "understanding",
        primaryHumanNeedScore: summary.primaryHumanNeedScore || 55,
        primaryHumanNeedReason:
          "Need engine unavailable. Defaulting to understanding.",
        needRecommendedLeadOrgan: "observer",
        needResponseMode: "continue_observing",
        rankedHumanNeeds: []
      };
    }

    await runStep(window.AriIdentityPriorityEngine, "evaluate");
    await runStep(window.AriStewardshipFearDifferentiator, "evaluate");
    await runStep(window.AriLifeChapterEngine, "detect");
    await runStep(window.AriUncertaintyClassificationEngine, "classify");
    await runStep(window.AriIdentityConflictResolver, "resolve");
    await runStep(window.AriValueIntegrationEngine, "integrate");
    await runStep(window.AriLifeChapterEngine, "detect");
    await runStep(window.Ari?.emotionIntegrator, "integrate");

    // LEGACY DECISION SYSTEMS STILL RUNNING FOR NOW
    await runStep(window.AriSalienceGovernor, "govern");
    await runStep(window.AriSynthesisEngine, "synthesize");

    // Reassert contract authority after old decision systems.
    summary = this.reassertContractAuthority(summary);

    // 10.5 LATE OBSERVER HIERARCHY PASS — diagnostic/support only
    if (
      window.Ari &&
      window.Ari.observerHierarchyEngine &&
      typeof window.Ari.observerHierarchyEngine.analyze === "function"
    ) {
      const lateHierarchy =
        window.Ari.observerHierarchyEngine.analyze({
          ...(summary.observation || {}),
          ...summary,
          summary
        }) || {};

      summary = {
        ...summary,
        observerHierarchy: lateHierarchy,
        hierarchy: lateHierarchy,

        observerHierarchySource:
          lateHierarchy.system || "ari-observer-hierarchy-engine",

        observerHierarchyPrimaryObservation:
          lateHierarchy.primaryObservation || null,
        observerHierarchyPrimaryCategory:
          lateHierarchy.primaryCategory || null,
        observerHierarchyPrimaryReason:
          lateHierarchy.primaryReason || null,
        observerHierarchyPrimaryConfidence:
          lateHierarchy.primaryConfidence ?? null,

        observerHierarchySupportingObservations:
          lateHierarchy.supportingObservations || [],

        observerHierarchyDominantTension:
          lateHierarchy.dominantTension || null,
        observerHierarchyLifeChapter:
          lateHierarchy.lifeChapter || null,

        observerHierarchyObjectiveLead:
          lateHierarchy.objectiveLead || null,
        observerHierarchySubjectiveLead:
          lateHierarchy.subjectiveLead || null,
        observerHierarchyDualSalienceMode:
          lateHierarchy.dualSalienceMode || null,

        observerHierarchyExecutiveInstruction:
          lateHierarchy.recommendedExecutiveInstruction || null,

        observerHierarchyShouldAskClarifyingQuestion:
          Boolean(lateHierarchy.shouldAskClarifyingQuestion),

        observerHierarchyRecommendedQuestion:
          lateHierarchy.recommendedQuestion || null,

        observerHierarchyRankedObservations:
          lateHierarchy.rankedObservations || [],

        observerHierarchyRankedUnknowns:
          lateHierarchy.rankedUnknowns || []
      };
    }

    // Reassert again after hierarchy, just in case.
    summary = this.reassertContractAuthority(summary);

    // 11 RESPONSE INTENT
    if (
      window.AriResponseIntentEngine &&
      typeof window.AriResponseIntentEngine.decide === "function"
    ) {
      const intent = window.AriResponseIntentEngine.decide(summary) || {};
      summary = { ...summary, ...intent };
    } else {
      summary = {
        ...summary,
        responseIntentSource: "not-loaded"
      };
    }

    // Reassert after response intent too.
summary = this.reassertContractAuthority(summary);

// 11.25 EXECUTIVE FUNCTION
if (
  window.Ari &&
  window.Ari.executiveFunction &&
  typeof window.Ari.executiveFunction.evaluate === "function"
) {
  const executiveResult =
    await window.Ari.executiveFunction.evaluate(summary);

  summary = {
    ...summary,
    ...(executiveResult || {})
  };
} else {
  summary = {
    ...summary,
    executiveFunctionRan: false,
    executiveFunctionSource: "not-loaded"
  };
}

// Reassert after Executive Function.
summary = this.reassertContractAuthority(summary);

let reasoningResult = {};
// 11.35 REASONING ENGINE
if (
  window.AriReasoningEngine &&
  typeof window.AriReasoningEngine.create === "function"
) {
reasoningResult =
  window.AriReasoningEngine.create(summary) || {};

  summary = {
    ...summary,
    ...reasoningResult,
    reasoning:
      reasoningResult.reasoning ||
      summary.reasoning ||
      {},
    reasoningAnswer:
      reasoningResult.reasoningAnswer ||
      summary.reasoningAnswer ||
      null
  };
} else {
  summary = {
    ...summary,
    reasoningEngineRan: false,
    reasoningSource: "not-loaded",
    reasoning: {},
    reasoningAnswer: null
  };
}

// Reassert after Reasoning Engine.
// Reasoning is not allowed to override contract.
summary = this.reassertContractAuthority(summary);

// 11.5 TEACHING ANSWER ENGINE
    if (
      window.AriTeachingAnswerEngine &&
      typeof window.AriTeachingAnswerEngine.teach === "function"
    ) {
      const teachingResult =
        await window.AriTeachingAnswerEngine.teach(summary);

      summary = {
        ...summary,
        ...(teachingResult || {})
      };
    }

// 11.75 HUMAN LANGUAGE ENGINE
if (
  window.AriHumanLanguageEngine &&
  typeof window.AriHumanLanguageEngine.create === "function"
) {
  const humanLanguageResult =
    window.AriHumanLanguageEngine.create(summary) || {};

  summary = {
    ...summary,
    ...humanLanguageResult,
    humanLanguage: humanLanguageResult,
    humanLanguageProfile:
      humanLanguageResult.humanLanguageProfile ||
      summary.humanLanguageProfile ||
      {}
  };
} else {
  summary = {
    ...summary,
    humanLanguageEngineRan: false,
    humanLanguageSource: "not-loaded",
    humanLanguageProfile: {}
  };
}

// Reassert after Human Language, just in case.
summary = this.reassertContractAuthority(summary);

// 11.9 COMMUNICATION PLANNER
if (
  window.AriCommunicationPlanner &&
  typeof window.AriCommunicationPlanner.plan === "function"
) {
  const communicationPlanResult =
    window.AriCommunicationPlanner.plan(summary) || {};

  summary = {
    ...summary,
    ...communicationPlanResult
  };
} else {
  summary = {
    ...summary,
    communicationPlannerRan: false,
    communicationPlannerSource: "not-loaded",
    communicationPlan: null
  };
}

// Reassert after Communication Planner.
summary = this.reassertContractAuthority(summary);

    // 12 MOUTH DIRECTOR
    if (
      window.AriMouthDirector &&
      typeof window.AriMouthDirector.direct === "function"
    ) {
      const mouthDirector = window.AriMouthDirector.direct(summary) || {};

      summary = {
        ...summary,
        mouthDirector,
        mouthDirectorRan: true,
        mouthDirectorSource: "ari-mouth-director",

        mouthExplanationLevel: mouthDirector.explanationLevel || null,
        mouthResponsePattern:
          summary.responseShape ||
          mouthDirector.responsePattern ||
          null,

        mouthMaxBodySections: mouthDirector.maxBodySections ?? null,
        mouthAskBeforeTeaching: Boolean(mouthDirector.askBeforeTeaching),

        mouthAllows: {
          meaning: mouthDirector.allowMeaning,
          emotion: mouthDirector.allowEmotion,
          truth: mouthDirector.allowTruth,
          wisdom: mouthDirector.allowWisdom,
          action: mouthDirector.allowAction
        }
      };
    } else {
      summary = {
        ...summary,
        mouthDirector: {},
        mouthDirectorRan: false,
        mouthDirectorSource: "not-loaded",

        mouthExplanationLevel: null,
        mouthResponsePattern: summary.responseShape || null,
        mouthMaxBodySections: null,
        mouthAskBeforeTeaching: null,

        mouthAllows: {
          meaning: null,
          emotion: null,
          truth: null,
          wisdom: null,
          action: null
        }
      };
    }

    // Final reassert before composer.
    summary = this.reassertContractAuthority(summary);

    // 13 COMPOSE FINAL LANGUAGE
    await runStep(window.AriLanguageComposer, "compose");

// 13.25 COMPRESS FINAL RESPONSE
if (
  window.AriResponseCompressor &&
  typeof window.AriResponseCompressor.compress === "function"
) {
  const compressionResult =
    window.AriResponseCompressor.compress(summary) || {};

  summary = {
    ...summary,
    ...compressionResult,
    finalResponse:
  compressionResult.finalResponse ||
  compressionResult.compressedResponse ||
  summary.finalResponse
  };
}

    // 13.5 SITUATION REVIEW CONSOLE — DIAGNOSTIC ONLY
    if (
      window.AriSituationReviewConsole &&
      typeof window.AriSituationReviewConsole.review === "function"
    ) {
      const situationReview =
        window.AriSituationReviewConsole.review(summary) || {};

      summary = {
        ...summary,
        situationReview,
        situationReviewConsoleRan:
          situationReview.situationReviewConsoleRan || true,
        situationReviewConsoleVersion:
          situationReview.situationReviewConsoleVersion || null
      };
    } else {
      summary = {
        ...summary,
        situationReview: {
          situationReviewConsoleRan: false,
          source: "not-loaded"
        },
        situationReviewConsoleRan: false,
        situationReviewConsoleVersion: null
      };
    }

    console.log("===== SAFETY CONTEXT GATE =====");
    console.log(summary.safetyContextGate);

    console.log("===== OBSERVER EVIDENCE =====");
    console.log(summary.observerEvidence);

    console.log("===== SITUATION MAP =====");
    console.log(summary.situationMap);

    console.log("===== SITUATION CONTRACT =====");
    console.log(summary.situationContract);

console.log(`===== REASONING ENGINE ${summary.reasoningEngineVersion || "UNKNOWN"} =====`);
console.log(summary.reasoning);
console.log("Loaded Reasoning Version:", window.AriReasoningEngine?.version);
console.log("Reasoning Result Version:", reasoningResult.reasoningEngineVersion);
console.log("Universal Signals:", reasoningResult.reasoning?.universalSignals);
console.log("Executive Conclusion:", reasoningResult.reasoning?.executiveConclusion);
console.log("===== HUMAN LANGUAGE ENGINE =====");
console.log(summary.humanLanguageProfile);

    console.log("===== CONTRACT AUTHORITY =====");
    console.log({
      contractAuthorityReasserted: summary.contractAuthorityReasserted,
      situationContractPrimary: summary.situationContractPrimary,
      salienceLeadOrgan: summary.salienceLeadOrgan,
      salienceMode: summary.salienceMode,
      responseIntent: summary.responseIntent,
      responseShape: summary.responseShape
    });

    console.log("===== FINAL RESPONSE =====");
    console.log(summary.finalResponse);

    summary.rebirthPipelineRan = true;
    summary.rebirthPipelineSource = "ari-rebirth-pipeline";

    return summary;
  },

  applyContractBridge(summary = {}) {
    const contract = summary.situationContract || {};
    const primary = contract.primary || summary.primaryLaneSuggestion;

    const bridge = {
      contractBridgeRan: true,
      contractBridgeSource: "ari-rebirth-pipeline"
    };

    const apply = (data = {}) => Object.assign(bridge, data);

    if (primary === "safety") {
      apply({
        contractBridgeLeadOrgan: "safety",
        contractBridgeMode: "safety_override",
        contractBridgeResponseIntent: "protect_safety_first",
        salienceLeadOrgan: "safety",
        salienceMode: "safety_override",
        responseIntent: "protect_safety_first",
        primaryHumanNeed: "security",
        needResponseMode: "protect_safety_first"
      });
    }

    if (primary === "medical_body") {
      apply({
        contractBridgeLeadOrgan: "safety",
        contractBridgeMode: "medical_or_body_first",
        contractBridgeResponseIntent: "stabilize_organism_function",
        salienceLeadOrgan: "safety",
        salienceMode: "medical_or_body_first",
        responseIntent: "stabilize_organism_function",
        primaryHumanNeed: "body",
        needResponseMode: "stabilize_body_first"
      });
    }

    if (primary === "executive_decision") {
      apply({
        contractBridgeLeadOrgan: "executive",
        contractBridgeMode: "plan_next_step",
        contractBridgeResponseIntent: "decision_support",
        salienceLeadOrgan: "executive",
        salienceMode: "plan_next_step",
        responseIntent: "decision_support",
        primaryHumanNeed: "clarity",
        needResponseMode: "choose_next_step"
      });
    }

    if (primary === "builder") {
      apply({
        contractBridgeLeadOrgan: "builder",
        contractBridgeMode: "build_or_debug",
        contractBridgeResponseIntent: "build_or_fix",
        salienceLeadOrgan: "builder",
        salienceMode: "build_or_debug",
        responseIntent: "build_or_fix",
        primaryHumanNeed: "execution",
        needResponseMode: "step_by_step_action"
      });
    }

    if (primary === "emotion") {
      apply({
        contractBridgeLeadOrgan: "emotion",
        contractBridgeMode: "restore_connection",
        contractBridgeResponseIntent: "offer_connection",
        salienceLeadOrgan: "emotion",
        salienceMode: "restore_connection",
        responseIntent: "offer_connection",
        primaryHumanNeed: "connection",
        needResponseMode: "restore_connection"
      });
    }

    if (primary === "teacher") {
      apply({
        contractBridgeLeadOrgan: "teacher",
        contractBridgeMode: "teach_clearly",
        contractBridgeResponseIntent: "teach",
        salienceLeadOrgan: "teacher",
        salienceMode: "teach_clearly",
        responseIntent: "teach",
        primaryHumanNeed: "understanding",
        needResponseMode: "teach_clearly"
      });
    }

    return {
      ...summary,
      ...bridge,

      responseShape:
        contract.responseShape ||
        summary.responseShape ||
        null,

      situationContractPrimary:
        contract.primary || null,

      situationContractSupport:
        contract.support || [],

      situationContractBrief:
        contract.brief || [],

      situationContractContext:
        contract.context || [],

      situationContractDeferred:
        contract.deferred || [],

      situationContractBlocked:
        contract.blocked || []
    };
  },

  reassertContractAuthority(summary = {}) {
    const contract = summary.situationContract || null;
    if (!contract || !contract.primary) return summary;

    const primary = contract.primary;

    const authority = {
      contractAuthorityReasserted: true,
      contractAuthoritySource: "ari-rebirth-pipeline",

      situationContractPrimary: primary,
      situationContractSupport: contract.support || [],
      situationContractBrief: contract.brief || [],
      situationContractContext: contract.context || [],
      situationContractDeferred: contract.deferred || [],
      situationContractBlocked: contract.blocked || [],

      responseShape:
        contract.responseShape ||
        summary.responseShape ||
        null
    };

    const apply = (data = {}) => Object.assign(authority, data);

    if (primary === "safety") {
      apply({
        salienceLeadOrgan: "safety",
        salienceMode: "safety_override",
        responseIntent: "protect_safety_first",
        primaryHumanNeed: "security",
        needResponseMode: "protect_safety_first"
      });
    }

    if (primary === "medical_body") {
      apply({
        salienceLeadOrgan: "safety",
        salienceMode: "medical_or_body_first",
        responseIntent: "stabilize_organism_function",
        primaryHumanNeed: "body",
        needResponseMode: "stabilize_body_first"
      });
    }

    if (primary === "risk_clarification") {
      apply({
        salienceLeadOrgan: "safety",
        salienceMode: "clarify_risk",
        responseIntent: "clarify_risk",
        primaryHumanNeed: "security",
        needResponseMode: "clarify_before_answer"
      });
    }

    if (primary === "executive_decision") {
      apply({
        salienceLeadOrgan: "executive",
        salienceMode: "plan_next_step",
        responseIntent: "decision_support",
        primaryHumanNeed: "clarity",
        needResponseMode: "choose_next_step"
      });
    }

    if (primary === "builder") {
      apply({
        salienceLeadOrgan: "builder",
        salienceMode: "build_or_debug",
        responseIntent: "build_or_fix",
        primaryHumanNeed: "execution",
        needResponseMode: "step_by_step_action"
      });
    }

    if (primary === "emotion") {
      apply({
        salienceLeadOrgan: "emotion",
        salienceMode: "restore_connection",
        responseIntent: "offer_connection",
        primaryHumanNeed: "connection",
        needResponseMode: "restore_connection"
      });
    }

    if (primary === "teacher") {
      apply({
        salienceLeadOrgan: "teacher",
        salienceMode: "teach_clearly",
        responseIntent: "teach",
        primaryHumanNeed: "understanding",
        needResponseMode: "teach_clearly"
      });
    }

    if (primary === "family") {
      apply({
        salienceLeadOrgan: "meaning",
        salienceMode: "protect_family_presence",
        responseIntent: "family_context_support",
        primaryHumanNeed: "connection",
        needResponseMode: "protect_relationships"
      });
    }

    if (primary === "general_understanding") {
      apply({
        salienceLeadOrgan: "observer",
        salienceMode: "continue_observing",
        responseIntent: "understand_context",
        primaryHumanNeed: "understanding",
        needResponseMode: "continue_observing"
      });
    }

    return {
      ...summary,
      ...authority
    };
  }
};