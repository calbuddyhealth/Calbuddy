// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
// Purpose: Run all Rebirth organs in correct order.
// V1.1
// Fixes:
// - Runs identity/life/value context before uncertainty.
// - Runs identity conflict after uncertainty so uncertainty can pause identity leadership.
// - Prevents early uncertainty from labeling strong life chapters as unclear too soon.

window.AriRebirthPipeline = {
  run(systemSummary = {}) {
    let summary = { ...systemSummary };

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