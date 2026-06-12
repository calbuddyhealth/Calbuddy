// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
// Purpose: Run all Rebirth organs in correct order.
// V1.2
// Fixes:
// - Adds Safety Override before all meaning/wisdom/emotion systems.
// - Safety can stop the pipeline and return an urgent response.
// - Preserves existing Rebirth organ order after safety clears.

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
    // Safety outranks every other organ.
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

    // 1. Build identity signals first.
    runStep(window.AriIdentityPriorityEngine, "evaluate");

    // 2. Add emotional/stewardship correction before meaning/salience.
    runStep(window.AriStewardshipFearDifferentiator, "evaluate");

    // 3. Detect life chapter after identity + stewardship are known.
    runStep(window.AriLifeChapterEngine, "detect");

    // 4. Now classify uncertainty with better context.
    runStep(window.AriUncertaintyClassificationEngine, "classify");

    // 5. Resolve identity conflict AFTER uncertainty.
    // This lets uncertainty pause identity leadership when evidence is weak.
    runStep(window.AriIdentityConflictResolver, "resolve");

    // 6. Integrate values after resolved identity exists.
    runStep(window.AriValueIntegrationEngine, "integrate");

    // 7. Re-check life chapter after resolved identity/value integration.
    runStep(window.AriLifeChapterEngine, "detect");

    // 8. Decide lead organ.
    runStep(window.AriSalienceGovernor, "govern");

    // 9. Synthesize final interpretation.
    runStep(window.AriSynthesisEngine, "synthesize");

    // 10. Compose final language.
    runStep(window.AriLanguageComposer, "compose");

    summary.rebirthPipelineRan = true;
    summary.rebirthPipelineSource = "ari-rebirth-pipeline";

    return summary;
  }
};