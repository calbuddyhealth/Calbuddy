// ari/language/ari-response-shaper.js
// Ari Response Shaper
// Purpose: Organize final responses into human-readable flow.
// V1.3
// Fixes:
// - polish() only cleans spacing.
// - shape() supports finalResponse passthrough.
// - Adds optional compress() mode.
// - Never removes truth/emotion/wisdom/action accidentally.
// - Safe for Ari Rebirth pipeline.

window.AriResponseShaper = {

  polish(input = {}) {
    const finalResponse = input.finalResponse || "";

    if (!finalResponse.trim()) {
      return null;
    }

    return {
      finalResponse: this.clean(finalResponse),
      source: "ari-response-shaper"
    };
  },

  compress(input = {}) {
    const finalResponse = input.finalResponse || "";

    if (!finalResponse.trim()) {
      return null;
    }

    const sections = finalResponse
      .split(/\n\s*\n/)
      .map(section => section.trim())
      .filter(Boolean);

    // Keep strongest sections.
    // Opening + last 4 sections minimum.
    if (sections.length <= 6) {
      return {
        finalResponse: this.clean(finalResponse),
        source: "ari-response-shaper"
      };
    }

    const compressed = [
      sections[0],
      ...sections.slice(-5)
    ];

    return {
      finalResponse: this.clean(
        compressed.join("\n\n")
      ),
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
      finalResponse: this.clean(
        sections
          .filter(Boolean)
          .join("\n\n")
      ),
      source: "ari-response-shaper"
    };
  },

  clean(text = "") {
    return String(text)
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
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