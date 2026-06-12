// ari/language/ari-opening-engine.js
// Ari Opening Engine
// Purpose: Generate the first emotional contact.
// V1.2

window.AriOpeningEngine = {
  create(summary = {}) {
    const opening = this.generate(summary);

    if (!opening) return null;

    return {
      opening,
      source: "ari-opening-engine"
    };
  },

  generate(summary = {}) {
    const lead =
      summary.synthesisLeadOrgan ||
      summary.salienceLeadOrgan ||
      null;

    const mode =
      summary.synthesisMode ||
      summary.salienceMode ||
      summary.needResponseMode ||
      null;

    const intent = summary.responseIntent || null;
    const pattern = summary.mouthResponsePattern || summary.responseShape || null;
    const need = summary.primaryHumanNeed || null;
    const chapter = summary.primaryLifeChapter || null;
    const wisdomTension = summary.wisdomTension || null;

    if (
      mode === "restore_dignity" ||
      intent === "protect_dignity" ||
      need === "worth"
    ) {
      return "That sounds disrespectful and frustrating.";
    }

    if (
      mode === "emotional_connection" ||
      intent === "offer_connection" ||
      need === "connection"
    ) {
      return "That sounds lonely.";
    }

    if (
      mode === "safety_override" ||
      intent === "protect_safety" ||
      lead === "safety"
    ) {
      return "Safety comes first here.";
    }

    if (
      lead === "uncertainty" ||
      intent === "clarify_before_interpreting" ||
      pattern === "brief_reflect_then_question"
    ) {
      return "I do not want to guess too fast here.";
    }

    if (chapter === "fatherhood_transition") {
      return "Something important is changing.";
    }

    if (chapter === "family_transition") {
      return "This feels bigger than a simple decision.";
    }

    if (lead === "identity") {
      return "This may be about who is trying to lead inside you right now.";
    }

    if (lead === "meaning") {
      return "Something important about this season is trying to reveal itself.";
    }

    if (lead === "wisdom" || wisdomTension && wisdomTension !== "unclear") {
      return "There is a real tension here.";
    }

    if (lead === "stewardship") {
      return "This sounds more like responsibility than fear.";
    }

    if (lead === "emotion") {
      return "Something underneath the surface seems to be asking for attention.";
    }

    return "Something feels worth paying attention to here.";
  }
};