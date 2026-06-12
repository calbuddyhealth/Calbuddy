// ari/language/ari-action-guidance-engine.js
// Ari Action Guidance Engine
// Purpose: Convert conclusions into practical guidance.
// V1.1
// Fixes:
// - Adds guide() for AriLanguageComposer compatibility.
// - Returns { guidance } object.
// - Keeps generate() for backward compatibility.

window.AriActionGuidanceEngine = {

  guide(summary = {}) {

    const guidance = this.generate(summary);

    if (!guidance) return null;

    return {
      guidance,
      source: "ari-action-guidance-engine"
    };
  },

  generate(summary = {}) {

    if (summary.courseCorrection) {
      return summary.courseCorrection;
    }

    if (summary.regretPreventableAction) {
      return summary.regretPreventableAction;
    }

    switch (summary.executiveDecision) {

      case "protect_family_first":
        return "Protect one non-negotiable moment of family presence before adding another responsibility.";

      case "slow_down":
        return "Reduce one commitment before taking on another.";

      case "build_carefully":
        return "Keep building, but establish a pace you can sustain.";

      case "gather_more_information":
        return "Avoid forcing a decision until the missing information becomes clearer.";

      default:
        return null;
    }
  }
};