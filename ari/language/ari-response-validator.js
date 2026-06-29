// ari/language/ari-response-validator.js
// Purpose: Validate/repair final response against composer packet.
// V1.0.0

window.Ari = window.Ari || {};

window.AriResponseValidator = {
  version: "1.0.0",

  validate({ packet = {}, draft = "" } = {}) {
    let finalResponse = String(draft || "").trim();

    if (!finalResponse) {
      finalResponse = this.fallback(packet);
    }

    finalResponse = this.removeInternalLeaks(finalResponse);
    finalResponse = this.preventFalseFileClaim(finalResponse, packet);
    finalResponse = this.limitLength(finalResponse, packet);

    return {
      responseValidatorRan: true,
      responseValidatorSource: "ari-response-validator",
      responseValidatorVersion: this.version,
      responseValidation: "passed_or_repaired",
      finalResponse
    };
  },

  fallback(packet = {}) {
    if (packet.primary === "builder") {
      return "I can help, but I need real file context or a clear patch target before changing code.";
    }

    return packet.userQuestion
      ? `The direct answer: ${packet.userQuestion}`
      : "Yeah. I’m here. Tell me what’s going on.";
  },

  removeInternalLeaks(text = "") {
    return String(text)
      .replace(/primary lane/gi, "main direction")
      .replace(/situation contract/gi, "instructions")
      .replace(/triage/gi, "routing")
      .replace(/observer/gi, "context")
      .replace(/composer packet/gi, "context")
      .replace(/handoff/gi, "context")
      .trim();
  },

  preventFalseFileClaim(text = "", packet = {}) {
    const hasFileEvidence = Boolean(packet.evidence?.github?.content);

    if (hasFileEvidence) return text;

    return String(text)
      .replace(/I read the file[^\n.]*/gi, "I don’t have file context loaded")
      .replace(/I can see the file[^\n.]*/gi, "I don’t have file context loaded")
      .trim();
  },

  limitLength(text = "", packet = {}) {
    const maxWords =
      packet.communicationPlan?.languageBudget?.maxWords ||
      packet.communicationPlan?.sentenceRules?.maxWords ||
      180;

    const words = String(text).split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return text;

    return words.slice(0, maxWords).join(" ") + ".";
  }
};

console.log("ARI RESPONSE VALIDATOR LOADED:", window.AriResponseValidator.version);