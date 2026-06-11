// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
// Purpose: Run all Rebirth organs in correct order.
// V1.0

window.AriRebirthPipeline = {
  run(systemSummary = {}) {
    let summary = { ...systemSummary };

    const runStep = (engine, method) => {
      if (engine && typeof engine[method] === "function") {
        summary = { ...summary, ...engine[method](summary) };
      }
    };

    runStep(window.AriUncertaintyClassificationEngine, "classify");
    runStep(window.AriIdentityPriorityEngine, "evaluate");
    runStep(window.AriIdentityConflictResolver, "resolve");
    runStep(window.AriValueIntegrationEngine, "integrate");
    runStep(window.AriStewardshipFearDifferentiator, "evaluate");
    runStep(window.AriLifeChapterEngine, "detect");
    runStep(window.AriSalienceGovernor, "govern");
    runStep(window.AriSynthesisEngine, "synthesize");
    runStep(window.AriLanguageComposer, "compose");

    summary.rebirthPipelineRan = true;
    summary.rebirthPipelineSource = "ari-rebirth-pipeline";

    return summary;
  }
};