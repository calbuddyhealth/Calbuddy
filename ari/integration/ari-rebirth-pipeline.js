// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
// Purpose: Run Ari's communication chain in correct order.
// V3.0
// New Core Chain:
// 1. Safety Context Gate
// 2. Observer Evidence
// 3. Situation Map
// 4. Situation Contract
// 5. Legacy organs temporarily
// 6. Mouth / Composer

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
        riskType: "none"
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
        observationLedger: []
      };

    summary = {
      ...summary,
      observerEvidence: observerResult,
      ...observerResult
    };

    // 0.30 SITUATION MAP
    const situationMap =
      window.AriSituationMapEngine?.build?.(summary) || {
        situationMapRan: false,
        source: "not-loaded",
        situations: [],
        domains: [],
        needs: [],
        risks: []
      };

    summary = {
      ...summary,
      situationMap,
      ...situationMap
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

    // 0.50 DIRECT RISK CLARIFICATION RESPONSE
    if (summary.situationContract?.primary === "risk_clarification") {
      summary.finalResponse =
        summary.situationContract?.clarity?.question ||
        summary.followUpQuestion ||
        "Are you safe right now, or are you saying you feel overwhelmed?";

      summary.rebirthPipelineRan = true;
      summary.rebirthPipelineSource = "ari-rebirth-pipeline";
      summary.source = "ari-situation-contract";

      return summary;
    }

    const runStep = async (engine, method) => {
      if (engine && typeof engine[method] === "function") {
        const result = await engine[method](summary);
        summary = { ...summary, ...(result || {}) };
      }
    };

    // LEGACY SYSTEMS — TEMPORARY UNTIL COMPOSER FULLY USES SITUATION CONTRACT

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
    await runStep(window.AriSalienceGovernor, "govern");
    await runStep(window.AriSynthesisEngine, "synthesize");

    // 10.5 LATE OBSERVER HIERARCHY PASS
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
        mouthResponsePattern: mouthDirector.responsePattern || null,
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
        mouthResponsePattern: null,
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

    // 13 COMPOSE FINAL LANGUAGE
    await runStep(window.AriLanguageComposer, "compose");

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

    if (primary === "safety") {
      bridge.salienceLeadOrgan = "safety";
      bridge.salienceMode = "safety_override";
      bridge.responseIntent = "protect_safety_first";
      bridge.primaryHumanNeed = "security";
      bridge.needResponseMode = "protect_safety_first";
    }

    if (primary === "medical_body") {
      bridge.salienceLeadOrgan = "safety";
      bridge.salienceMode = "medical_or_body_first";
      bridge.responseIntent = "stabilize_organism_function";
      bridge.primaryHumanNeed = "body";
      bridge.needResponseMode = "stabilize_body_first";
    }

    if (primary === "executive_decision") {
      bridge.salienceLeadOrgan = "executive";
      bridge.salienceMode = "plan_next_step";
      bridge.responseIntent = "decision_support";
      bridge.primaryHumanNeed = "clarity";
      bridge.needResponseMode = "choose_next_step";
    }

    if (primary === "builder") {
      bridge.salienceLeadOrgan = "builder";
      bridge.salienceMode = "build_or_debug";
      bridge.responseIntent = "build_or_fix";
      bridge.primaryHumanNeed = "execution";
      bridge.needResponseMode = "step_by_step_action";
    }

    if (primary === "emotion") {
      bridge.salienceLeadOrgan = "emotion";
      bridge.salienceMode = "restore_connection";
      bridge.responseIntent = "offer_connection";
      bridge.primaryHumanNeed = "connection";
      bridge.needResponseMode = "restore_connection";
    }

    if (primary === "teacher") {
      bridge.salienceLeadOrgan = "teacher";
      bridge.salienceMode = "teach_clearly";
      bridge.responseIntent = "teach";
      bridge.primaryHumanNeed = "understanding";
      bridge.needResponseMode = "teach_clearly";
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
  }
};