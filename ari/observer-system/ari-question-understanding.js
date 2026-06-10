// ari/observer-system/ari-question-understanding.js
// Ari Question Understanding
// Purpose: Detect what kind of answer the user is asking for.
// V1.1: Strengthens insight detection and prevents sacrifice/tradeoff questions from being misclassified as decisions.

window.Ari = window.Ari || {};

window.Ari.questionUnderstanding = {
  version: "1.1.0",

  classify(message = "") {
    const text = String(message || "").toLowerCase();

    const insightPhrases = [
      "what pattern",
      "what pattern do you see",
      "what am i avoiding",
      "what am i not seeing",
      "what am i likely not seeing",
      "central struggle",
      "underneath",
      "hidden conflict",
      "blind spot",
      "tell me something about me",
      "why might i be doing that",
      "what is really going on",
      "what am i sacrificing",
      "what am i likely sacrificing",
      "what tradeoff",
      "what trade-off",
      "what am i giving up",
      "what is this costing me",
      "what cost am i ignoring",
      "what am i paying for",
      "without realizing it"
    ];

    if (this.containsAny(text, insightPhrases)) {
      return "insight";
    }

    const decisionPhrases = [
      "what should i do",
      "which should i choose",
      "help me decide",
      "what should i focus",
      "what deserves my attention",
      "which identity should become primary",
      "what should i delay",
      "prioritize"
    ];

    if (this.containsAny(text, decisionPhrases)) {
      return "decision";
    }

    const planningPhrases = [
      "make a plan",
      "create a plan",
      "roadmap",
      "next step",
      "how do i",
      "how should i",
      "schedule"
    ];

    if (this.containsAny(text, planningPhrases)) {
      return "planning";
    }

    const emotionalPhrases = [
      "i feel",
      "i'm feeling",
      "why am i feeling",
      "guilty",
      "scared",
      "terrified",
      "sad",
      "lonely",
      "overwhelmed",
      "anxious",
      "burned out",
      "exhausted"
    ];

    if (this.containsAny(text, emotionalPhrases)) {
      return "emotional";
    }

    const teachingPhrases = [
      "explain",
      "teach me",
      "what does",
      "how does",
      "why does"
    ];

    if (this.containsAny(text, teachingPhrases)) {
      return "teaching";
    }

    const buildingPhrases = [
      "build",
      "code",
      "debug",
      "github",
      "javascript",
      "html",
      "css",
      "api"
    ];

    if (this.containsAny(text, buildingPhrases)) {
      return "building";
    }

    return "understanding";
  },

  containsAny(text, phrases = []) {
    return phrases.some((phrase) => text.includes(phrase));
  }
};