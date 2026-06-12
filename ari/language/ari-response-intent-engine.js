// ari/language/ari-response-intent-engine.js
// Ari Response Intent Engine
// Purpose: Decide what kind of conversational move Ari should make before composing words.
// V1.1
// Fixes:
// - Adds evaluate() alias so pipeline can call this engine consistently.
// - Keeps decide() as the main logic.
// - Produces responseIntent + responseShape before Mouth Director / Composer.

window.AriResponseIntentEngine = {
  version: "1.1.0",

  evaluate(input = {}) {
    return this.decide(input);
  },

  decide(input = {}) {
    const summary = input.summary || input || {};

    const leadOrgan =
      summary.synthesisLeadOrgan ||
      summary.salienceLeadOrgan ||
      "observer";

    const mode =
      summary.synthesisMode ||
      summary.salienceMode ||
      "continue_observing";

    const need = summary.primaryHumanNeed || null;
    const needScore = Number(summary.primaryHumanNeedScore || 0);
    const uncertaintyType = summary.uncertaintyType || null;
    const safetyTriggered = Boolean(summary.safetyTriggered);

    if (safetyTriggered) {
      return this.intent(
        "protect_safety",
        "urgent_support",
        "Safety is active and must lead."
      );
    }

    if (
      mode === "restore_dignity" ||
      need === "worth" ||
      (need === "esteem" && needScore >= 75)
    ) {
      return this.intent(
        "protect_dignity",
        "validate_then_ask",
        "Worth/respect need is active. Ari should validate dignity, avoid overexplaining, then ask what happened."
      );
    }

    if (
      mode === "emotional_connection" ||
      need === "connection" ||
      need === "belonging"
    ) {
      return this.intent(
        "offer_connection",
        "comfort_then_ask",
        "Connection need is active. Ari should offer warmth before analysis."
      );
    }

    if (
      leadOrgan === "uncertainty" ||
      uncertaintyType === "missing_information" ||
      uncertaintyType === "understanding_uncertainty"
    ) {
      return this.intent(
        "clarify_before_interpreting",
        "brief_reflect_then_question",
        "Ari lacks evidence and should ask one clean clarifying question."
      );
    }

    if (leadOrgan === "meaning") {
      return this.intent(
        "name_life_chapter",
        "meaning_wisdom_action",
        "A life chapter is active. Ari should name the chapter and protect what matters."
      );
    }

    if (leadOrgan === "wisdom") {
      return this.intent(
        "resolve_tension",
        "principle_then_choice",
        "A wisdom tension is active. Ari should clarify what should lead."
      );
    }

    if (leadOrgan === "identity") {
      return this.intent(
        "clarify_identity",
        "identity_then_question",
        "Identity is active. Ari should name the role and ask what it protects."
      );
    }

    if (leadOrgan === "stewardship") {
      return this.intent(
        "support_stewardship",
        "steady_then_next_step",
        "Stewardship is active. Ari should steady the user and focus on responsible next action."
      );
    }

    if (leadOrgan === "emotion") {
      return this.intent(
        "name_emotion",
        "emotion_then_question",
        "Emotion is active. Ari should name the emotional signal and ask one useful question."
      );
    }

    if (leadOrgan === "values") {
      return this.intent(
        "integrate_values",
        "value_then_question",
        "A value integration signal is active. Ari should name the deeper value and ask what protects it."
      );
    }

    return this.intent(
      "respond_normally",
      "balanced",
      "No special response intent detected."
    );
  },

  intent(responseIntent, responseShape, reason) {
    return {
      responseIntent,
      responseShape,
      responseIntentReason: reason,
      responseIntentSource: "ari-response-intent-engine"
    };
  }
};