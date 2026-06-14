// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
// Purpose: Run all Rebirth organs in correct order.
// V2.0
// Adds:
// - Situation Map before Governor.
// - Multi-Lane Response Planner before Governor.
// - Advanced Situation Review Console after final composition.
// - Keeps console diagnostic-only.

window.AriRebirthPipeline = {
  async run(systemSummary = {}) {
    let summary = { ...systemSummary };

    const userMessage =
      summary.userMessage ||
      summary.message ||
      summary.normalizedMessage ||
      summary.input ||
      "";

    // 0. SAFETY OVERRIDE
    if (
      window.Ari &&
      window.Ari.safetyClassifier &&
      typeof window.Ari.safetyClassifier.classify === "function"
    ) {
      const safety = window.Ari.safetyClassifier.classify(userMessage);

      if (safety.safetyTriggered) {
        return {
          ...summary,
          finalResponse: safety.response,

          safetyTriggered: true,
          safetyType: safety.safetyType,
          safetyUrgency: safety.urgency,
          safetyReason: safety.reason,

          primaryHumanNeed: "security",
          primaryHumanNeedScore: 100,
          primaryHumanNeedReason:
            "Safety override triggered. Security need must lead.",

          needRecommendedLeadOrgan: "safety",
          needResponseMode: "protect_safety_first",

          salienceLeadOrgan: "safety",
          salienceMode: "safety_override",
          salienceReason: safety.reason,

          mouthDirectorRan: false,
          mouthDirectorSource: "skipped-safety-override",

          rebirthPipelineRan: true,
          rebirthPipelineSource: "ari-rebirth-pipeline",
          source: "ari-safety-classifier"
        };
      }

      summary = {
        ...summary,
        safetyTriggered: false,
        safetyType: safety.safetyType,
        safetyUrgency: safety.urgency,
        safetyReason: safety.reason
      };
    }

    // 0.20. SITUATION MAP
    if (
      window.AriSituationMapEngine &&
      typeof window.AriSituationMapEngine.build === "function"
    ) {
      const situationMap =
        window.AriSituationMapEngine.build(summary) || {};

      summary = {
        ...summary,
        situationMap,
        ...situationMap
      };
    } else {
      summary = {
        ...summary,
        situationMap: {
          situationMapRan: false,
          source: "not-loaded"
        },
        situationMapRan: false,
        situationMapVersion: null
      };
    }

    // 0.30. MULTI-LANE RESPONSE PLANNER
    if (
      window.AriMultiLaneResponsePlanner &&
      typeof window.AriMultiLaneResponsePlanner.plan === "function"
    ) {
      const multiLanePlan =
        window.AriMultiLaneResponsePlanner.plan(summary) || {};

      summary = {
        ...summary,
        multiLanePlan,
        ...multiLanePlan
      };
    } else {
      summary = {
        ...summary,
        multiLanePlan: {
          multiLanePlannerRan: false,
          source: "not-loaded"
        },
        multiLanePlannerRan: false,
        multiLanePlannerVersion: null
      };
    }

    // 0.40. UNIVERSAL DOMAIN GOVERNOR
    if (
      window.AriUniversalDomainGovernor &&
      typeof window.AriUniversalDomainGovernor.govern === "function"
    ) {
      const domainGovernor =
        window.AriUniversalDomainGovernor.govern(summary) || {};

      summary = {
        ...summary,
        domainGovernor,
        universalDomainGovernor: domainGovernor,
        ...domainGovernor
      };
    } else {
      summary = {
        ...summary,

        universalDomainGovernorRan: false,
        universalDomainGovernorVersion: null,

        domainGovernorSource: "not-loaded",

        domainLead: null,
        domainSuperLead: null,
        domainLeadScore: 0,
        domainAuthority: 0,

        domainLeadOrgan: null,
        domainMode: null,
        domainQuestion: null,

        domainReasons: [],

        domainPermissions: {},
        domainBlockedPermissions: [],

        rankedUniversalDomains: [],

        shouldBlockLifeChapter: false,
        shouldBlockIdentity: false,
        shouldBlockEmotionRecovery: false,
        shouldBlockMeaningProjection: false,

        shouldPreferTeaching: false,
        shouldPreferBodyStabilization: false,
        shouldPreferSafety: false
      };
    }

    // 0.45. GOVERNOR EXPLANATION
    summary.governorExplanation = {
      source: "ari-rebirth-pipeline",
      domainLead: summary.domainLead || null,
      domainLeadOrgan: summary.domainLeadOrgan || null,
      domainMode: summary.domainMode || null,

      primaryLane: summary.multiLanePlan?.primaryLane || null,
      supportLanes: summary.multiLanePlan?.supportLanes || [],
      briefLanes: summary.multiLanePlan?.briefLanes || [],
      deferredLanes: summary.multiLanePlan?.deferredLanes || [],
      blockedLanes: summary.multiLanePlan?.blockedLanes || [],

      laneWeights: summary.multiLanePlan?.laneWeights || {},
      laneRoles: summary.multiLanePlan?.laneRoles || {},
      responseShape: summary.multiLanePlan?.responseShape || null,

      reason:
        summary.domainReasons?.join(" ") ||
        summary.domainForceReason ||
        summary.salienceReason ||
        "No governor reason available.",

      warning:
        summary.domainForced && summary.multiLanePlan?.responseShape?.includes("multi")
          ? "Governor forced one domain during a multi-lane situation."
          : null
    };

    // 0.50. AUTHORITY MAP
    const authorityMap =
      window.AriAuthorityMapEngine?.decide?.(summary) || {};

    summary = {
      ...summary,
      authorityMap,
      ...authorityMap
    };

    // 0.60. ORGANISM FUNCTION ENGINE
    if (
      window.AriOrganismFunctionEngine &&
      typeof window.AriOrganismFunctionEngine.evaluate === "function"
    ) {
      const organismResult =
        await window.AriOrganismFunctionEngine.evaluate(summary) || {};

      summary = {
        ...summary,
        ...organismResult
      };
    } else {
      summary = {
        ...summary,
        organismEngineRan: false,
        organismEngineSource: "not-loaded",
        organismPrimaryFunction: null,
        organismPrimaryFunctionScore: 0,
        organismFunctions: [],
        organismDisruption: {
          hasDisruption: false,
          disruptions: []
        },
        organismUrgency: {
          level: "none",
          reason: "Organism engine unavailable."
        },
        organismNeedsStabilization: false,
        organismRecommendedMode: "no_organism_signal",
        organismRecommendedAction: "No organism-level action available."
      };
    }

    const runStep = async (engine, method) => {
      if (engine && typeof engine[method] === "function") {
        const result = await engine[method](summary);
        summary = { ...summary, ...(result || {}) };
      }
    };

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
        primaryHumanNeed: "understanding",
        primaryHumanNeedScore: 55,
        primaryHumanNeedReason:
          "Need engine unavailable. Defaulting to understanding.",
        needRecommendedLeadOrgan: "observer",
        needResponseMode: "continue_observing",
        rankedHumanNeeds: []
      };
    }

    // 2. Build identity signals with need context available.
    await runStep(window.AriIdentityPriorityEngine, "evaluate");

    // 3. Add emotional/stewardship correction with need context available.
    await runStep(window.AriStewardshipFearDifferentiator, "evaluate");

    // 4. Detect life chapter after identity + needs + stewardship are known.
    await runStep(window.AriLifeChapterEngine, "detect");

    // 5. Classify uncertainty after need/life/identity context exists.
    await runStep(window.AriUncertaintyClassificationEngine, "classify");

    // 6. Resolve identity conflict AFTER uncertainty.
    await runStep(window.AriIdentityConflictResolver, "resolve");

    // 7. Integrate values after resolved identity and needs exist.
    await runStep(window.AriValueIntegrationEngine, "integrate");

    // 8. Re-check life chapter after resolved identity/value integration.
    await runStep(window.AriLifeChapterEngine, "detect");

    // 8.5. Integrate emotional signals after life chapter, identity, values, and stewardship are known.
    await runStep(window.Ari?.emotionIntegrator, "integrate");

    // 9. Decide lead organ.
    await runStep(window.AriSalienceGovernor, "govern");

    // 10. Synthesize final interpretation.
    await runStep(window.AriSynthesisEngine, "synthesize");

    // 10.5. Late Observer Hierarchy pass.
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

    // 11. Decide response intent.
    if (
      window.AriResponseIntentEngine &&
      typeof window.AriResponseIntentEngine.decide === "function"
    ) {
      const intent = window.AriResponseIntentEngine.decide(summary) || {};
      summary = {
        ...summary,
        ...intent
      };
    } else {
      summary = {
        ...summary,
        responseIntentSource: "not-loaded"
      };
    }

    // 11.5 Teaching Answer Engine
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

    // 12. Direct the mouth.
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

    // 13. Compose final language.
    await runStep(window.AriLanguageComposer, "compose");

    // 13.5. SITUATION REVIEW CONSOLE
    // Diagnostic only. Does not change Ari's response.
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

    console.log("===== SITUATION MAP =====");
    console.log(summary.situationMap);

    console.log("===== MULTI-LANE PLAN =====");
    console.log(summary.multiLanePlan);

console.log("===== GOVERNOR EXPLANATION =====");
console.log(summary.governorExplanation);

    console.log("===== AUTHORITY MAP =====");
    console.log(summary.authorityMap);

    console.log("===== SITUATION REVIEW =====");
    console.log(summary.situationReview);

    console.log("allowTeaching:", summary.allowTeaching);
    console.log("allowEmotion:", summary.allowEmotion);
    console.log("allowMeaning:", summary.allowMeaning);
    console.log("allowIdentity:", summary.allowIdentity);
    console.log("allowWisdom:", summary.allowWisdom);
    console.log("allowAction:", summary.allowAction);
    console.log("finalResponse:", summary.finalResponse);

    summary.rebirthPipelineRan = true;
    summary.rebirthPipelineSource = "ari-rebirth-pipeline";

    return summary;
  }
};