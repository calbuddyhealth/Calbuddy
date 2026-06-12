// ari/language/ari-action-guidance-engine.js
// Ari Action Guidance Engine
// Purpose: Convert conclusions into practical guidance.
// V1.2
// Fixes:
// - Respects Mouth Director action permission.
// - Prevents action guidance during restore_dignity unless allowed.
// - Adds need-aware action guidance.
// - Keeps guide() and generate() compatibility.

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
    const director = summary.mouthDirector || {};

    const allowAction =
      summary.mouthAllows?.action !== false &&
      director.allowAction !== false &&
      summary.allowAction !== false;

    if (!allowAction) return null;

    const mode =
      summary.synthesisMode ||
      summary.salienceMode ||
      summary.needResponseMode ||
      null;

    const primaryHumanNeed = summary.primaryHumanNeed || null;

    // Human needs should not over-instruct unless Mouth Director allows action.
    if (mode === "restore_dignity" || primaryHumanNeed === "worth") {
      return "Name what happened first, then decide whether this needs a boundary, a conversation, or distance.";
    }

    if (mode === "emotional_connection" || primaryHumanNeed === "connection") {
      return "Start by naming who feels distant, then decide whether the moment needs comfort, repair, or honesty.";
    }

    if (primaryHumanNeed === "security" || primaryHumanNeed === "body") {
      return "Stabilize first, then interpret later.";
    }

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