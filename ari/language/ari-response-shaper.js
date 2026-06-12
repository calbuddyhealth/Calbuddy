// ari/language/ari-response-shaper.js
// Ari Response Shaper
// Purpose: Organize final responses into human-readable flow.
// V1.1
// Fixes:
// - Adds polish() for AriLanguageComposer compatibility.
// - Keeps shape() and getMode() for backward compatibility.

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

  shape({
    opening = null,
    truth = null,
    body = null,
    wisdom = null,
    action = null,
    question = null
  } = {}) {

    const sections = [];

    if (opening) {
      sections.push(opening.trim());
    }

    if (truth) {
      sections.push(truth.trim());
    }

    if (body) {
      sections.push(body.trim());
    }

    if (wisdom) {
      sections.push(wisdom.trim());
    }

    if (action) {
      sections.push(action.trim());
    }

    if (question) {
      sections.push(question.trim());
    }

    return sections
      .filter(Boolean)
      .join("\n\n");
  },

  getMode(summary = {}) {

    if (
      summary.primaryLifeChapter ||
      summary.salienceLeadOrgan === "meaning"
    ) {
      return "life_chapter";
    }

    if (
      summary.salienceLeadOrgan === "emotion"
    ) {
      return "emotion";
    }

    if (
      summary.salienceLeadOrgan === "executive"
    ) {
      return "decision";
    }

    if (
      summary.salienceLeadOrgan === "insight"
    ) {
      return "insight";
    }

    return "standard";
  }
};