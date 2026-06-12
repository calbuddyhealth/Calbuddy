// ari/language/ari-response-shaper.js
// Ari Response Shaper
// Purpose: Organize final responses into human-readable flow.
// V1.2
// Fixes:
// - polish() only cleans spacing.
// - Does not compress/remove truth, emotion, wisdom, or action.
// - shape() now supports finalResponse passthrough.

window.AriResponseShaper = {

  polish(input = {}) {
    const finalResponse = input.finalResponse || "";

    if (!finalResponse.trim()) {
      return null;
    }

    return {
      finalResponse: finalResponse
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
      source: "ari-response-shaper"
    };
  },

  shape(input = {}) {
    if (input.finalResponse) {
      return this.polish(input);
    }

    const {
      opening = null,
      truth = null,
      body = null,
      emotion = null,
      wisdom = null,
      action = null,
      question = null
    } = input;

    const sections = [];

    if (opening) sections.push(opening.trim());
    if (truth) sections.push(truth.trim());
    if (body) sections.push(body.trim());
    if (emotion) sections.push(emotion.trim());
    if (wisdom) sections.push(wisdom.trim());
    if (action) sections.push(action.trim());
    if (question) sections.push(question.trim());

    return {
      finalResponse: sections
        .filter(Boolean)
        .join("\n\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
      source: "ari-response-shaper"
    };
  },

  getMode(summary = {}) {
    if (
      summary.primaryLifeChapter ||
      summary.salienceLeadOrgan === "meaning"
    ) {
      return "life_chapter";
    }

    if (summary.salienceLeadOrgan === "emotion") {
      return "emotion";
    }

    if (summary.salienceLeadOrgan === "executive") {
      return "decision";
    }

    if (summary.salienceLeadOrgan === "insight") {
      return "insight";
    }

    return "standard";
  }
};