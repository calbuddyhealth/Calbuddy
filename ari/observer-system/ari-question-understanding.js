// ari/observer-system/ari-question-understanding.js
// Ari Question Understanding
// Purpose: Detect what kind of answer the user is asking for.
// V1.0

window.Ari = window.Ari || {};

window.Ari.questionUnderstanding = {
  version: "1.0.0",

  classify(message = "") {
    const text = String(message || "").toLowerCase();

    if (
      this.containsAny(text, [
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
        "what is really going on"
      ])
    ) {
      return "insight";
    }

    if (
      this.containsAny(text, [
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

    "what am i giving up",

    "what is this costing me",

    "what cost am i ignoring",

    "what am i paying for"
      ])
    ) {
      return "decision";
    }

    if (
      this.containsAny(text, [
        "make a plan",
        "create a plan",
        "roadmap",
        "next step",
        "how do i",
        "how should i",
        "schedule"
      ])
    ) {
      return "planning";
    }

    if (
      this.containsAny(text, [
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
      ])
    ) {
      return "emotional";
    }

    if (
      this.containsAny(text, [
        "explain",
        "teach me",
        "what does",
        "how does",
        "why does"
      ])
    ) {
      return "teaching";
    }

    if (
      this.containsAny(text, [
        "build",
        "code",
        "debug",
        "github",
        "javascript",
        "html",
        "css",
        "api"
      ])
    ) {
      return "building";
    }

    return "understanding";
  },

  containsAny(text, phrases = []) {
    return phrases.some((phrase) => text.includes(phrase));
  }
};