// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
// Purpose: Run all Rebirth organs in correct order.
// V1.5
// Fixes:
// - Safety Override runs first and can stop the pipeline.
// - Ari Human Needs Network runs immediately after safety.
// - Response Intent runs after synthesis.
// - Mouth Director runs before Language Composer.
// - Composer now receives intent/director instructions before final language.

window.AriRebirthPipeline = {
  run(systemSummary = {}) {
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

    const runStep = (engine, method) => {
      if (engine && typeof engine[method] === "function") {
        const result = engine[method](summary) || {};
        summary = { ...summary, ...result };
      }
    };

    // 1. HUMAN NEEDS NETWORK
    if (
      window.Ari &&
      window.Ari.needEngine &&
      typeof window.Ari.needEngine.evaluate === "function"
    ) {
      const needResult = window.Ari.needEngine.evaluate(summary) || {};
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
    runStep(window.AriIdentityPriorityEngine, "evaluate");

    // 3. Add emotional/stewardship correction with need context available.
    runStep(window.AriStewardshipFearDifferentiator, "evaluate");

    // 4. Detect life chapter after identity + needs + stewardship are known.
    runStep(window.AriLifeChapterEngine, "detect");

    // 5. Classify uncertainty after need/life/identity context exists.
    runStep(window.AriUncertaintyClassificationEngine, "classify");

    // 6. Resolve identity conflict AFTER uncertainty.
    runStep(window.AriIdentityConflictResolver, "resolve");

    // 7. Integrate values after resolved identity and needs exist.
    runStep(window.AriValueIntegrationEngine, "integrate");

    // 8. Re-check life chapter after resolved identity/value integration.
    runStep(window.AriLifeChapterEngine, "detect");

    // 9. Decide lead organ.
    runStep(window.AriSalienceGovernor, "govern");

    // 10. Synthesize final interpretation.
    runStep(window.AriSynthesisEngine, "synthesize");

    // 11. Decide response intent.
    runStep(window.AriResponseIntentEngine, "evaluate");

    // 12. Direct the mouth.
    runStep(window.AriMouthDirector, "direct");

    // 13. Compose final language.
    runStep(window.AriLanguageComposer, "compose");

    summary.rebirthPipelineRan = true;
    summary.rebirthPipelineSource = "ari-rebirth-pipeline";

    return summary;
  }
};