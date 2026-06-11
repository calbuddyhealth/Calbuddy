// ari/language/ari-opening-engine.js
// Ari Opening Engine
// Purpose: Generate context-aware openings.
// V1.0

window.AriOpeningEngine = {

  generate(summary = {}) {

    const chapter = summary.primaryLifeChapter;
    const lead = summary.salienceLeadOrgan;

    if (chapter === "fatherhood_transition") {
      return "Something important is changing.";
    }

    if (chapter === "family_transition") {
      return "This feels bigger than a simple decision.";
    }

    if (lead === "emotion") {
      return "Something underneath the surface seems to be asking for attention.";
    }

    if (lead === "identity") {
      return "This may be less about the decision itself and more about who is trying to make it.";
    }

    if (lead === "meaning") {
      return "Something important about this season is trying to reveal itself.";
    }

    return "Something feels worth paying attention to here.";
  }

};