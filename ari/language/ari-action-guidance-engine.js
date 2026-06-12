// ari/language/ari-action-guidance-engine.js
// Ari Action Guidance Engine
// Purpose: Convert conclusions into practical guidance.
// V1.3
// Fixes:
// - Adds organism-function action guidance.
// - Recognizes stabilize_organism_function.
// - Gives body-first practical steps instead of abstract advice.
// - Respects Mouth Director action permission.
// - Prevents action guidance during restore_dignity unless allowed.
// - Adds need-aware action guidance.
// - Keeps guide() and generate() compatibility.

window.AriActionGuidanceEngine = {
  version: "1.3.0",

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

    const responseIntent = summary.responseIntent || null;
    const primaryHumanNeed = summary.primaryHumanNeed || null;

    const organismPrimaryFunction = summary.organismPrimaryFunction || null;
    const organismNeedsStabilization = Boolean(summary.organismNeedsStabilization);
    const organismUrgency = summary.organismUrgency || {};
    const organismUrgencyLevel = organismUrgency.level || null;
    const organismRecommendedAction = summary.organismRecommendedAction || null;
    const organismRecommendedMode = summary.organismRecommendedMode || null;

    // ===================================
    // ORGANISM / BODY-FIRST GUIDANCE
    // ===================================

    if (
      organismUrgencyLevel === "critical" ||
      organismRecommendedMode === "urgent_safety"
    ) {
      return "Get urgent help now. If this involves chest pain, trouble breathing, fainting, seizure, stroke symptoms, overdose, or severe weakness, call emergency services or have someone take you to emergency care.";
    }

    if (
      responseIntent === "stabilize_organism_function" ||
      organismNeedsStabilization ||
      mode === "stabilize_body_first" ||
      primaryHumanNeed === "body"
    ) {
      if (organismPrimaryFunction === "energy_intake") {
        return "Sit down if you can. Sip water slowly, then try a few small bites of something gentle. If you feel like you might pass out, become confused, have chest pain, severe weakness, or cannot keep fluids down, get medical help now.";
      }

      if (organismPrimaryFunction === "hydration") {
        return "Start with small, steady sips of fluid. If you feel faint, confused, very weak, cannot keep fluids down, or symptoms are worsening, get medical help now.";
      }

      if (organismPrimaryFunction === "rest_recovery") {
        return "Reduce stimulation, stop adding demands, and protect rest first. If lack of sleep is severe, prolonged, or making you unsafe, get support.";
      }

      if (organismPrimaryFunction === "injury_protection") {
        return "Protect the painful area and avoid pushing through it. If pain is severe, worsening, linked with bleeding, swelling, chest pain, weakness, numbness, or pregnancy concerns, get medical guidance.";
      }

      if (organismPrimaryFunction === "vital_stability") {
        return "Treat this as urgent. Get medical help now if breathing, chest pain, fainting, seizure, stroke symptoms, or severe weakness are involved.";
      }

      if (organismPrimaryFunction === "threat_regulation") {
        return "Ground first: slow your breathing, orient to where you are, and reduce immediate stimulation. After your body settles, then decide what the situation means.";
      }

      if (organismPrimaryFunction === "connection") {
        return "Reach for one safe person before analyzing this alone. Connection comes before interpretation here.";
      }

      if (organismRecommendedAction) {
        return organismRecommendedAction;
      }

      return "Stabilize the body first: pause, sit down if needed, hydrate slowly, and take the smallest tolerable next step before interpreting what it means.";
    }

    // Human needs should not over-instruct unless Mouth Director allows action.
    if (mode === "restore_dignity" || primaryHumanNeed === "worth") {
      return "Name what happened first, then decide whether this needs a boundary, a conversation, or distance.";
    }

    if (mode === "emotional_connection" || primaryHumanNeed === "connection") {
      return "Start by naming who feels distant, then decide whether the moment needs comfort, repair, or honesty.";
    }

    if (primaryHumanNeed === "security") {
      return "Protect safety and stability first, then decide what the situation means.";
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