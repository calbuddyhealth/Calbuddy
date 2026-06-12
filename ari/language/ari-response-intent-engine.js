// ari/language/ari-response-intent-engine.js
// Ari Response Intent Engine
// Purpose: Decide what kind of conversational move Ari should make before composing words.
// V1.0

window.AriResponseIntentEngine = {
  decide(input = {}) {
    const summary = input.summary || input || {};

    const leadOrgan = summary.synthesisLeadOrgan || summary.salienceLeadOrgan || "observer";
    const mode = summary.synthesisMode || summary.salienceMode || "continue_observing";
    const need = summary.primaryHumanNeed || null;
    const needScore = Number(summary.primaryHumanNeedScore || 0);
    const uncertaintyType = summary.uncertaintyType || null;
    const safetyTriggered = Boolean(summary.safetyTriggered);

    if (safetyTriggered) {
      return this.intent("protect_safety", "urgent_support", "Safety is active and must lead.");
    }

    if (mode === "restore_dignity" || need === "worth") {
      return this.intent(
        "protect_dignity",
        "validate_then_ask",
        "Worth/respect need is active. Ari should validate dignity, avoid overexplaining, then ask what happened."
      );
    }

    if (mode === "emotional_connection" || need === "connection") {
      return this.intent(
        "offer_connection",
        "comfort_then_ask",
        "Connection need is active. Ari should offer warmth before analysis."
      );
    }

    if (leadOrgan === "uncertainty" || uncertaintyType === "missing_information") {
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