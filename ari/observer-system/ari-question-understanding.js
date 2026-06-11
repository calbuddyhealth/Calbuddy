// ari/observer-system/ari-question-understanding.js
// Ari Question Understanding
// Purpose: Detect what kind of answer the user is asking for.
// V1.3: Adds uncomfortable-truth detection and simple intent scoring.

window.Ari = window.Ari || {};

window.Ari.questionUnderstanding = {
  version: "1.3.0",

  classify(message = "") {
    const text = String(message || "").toLowerCase();

    const meaningPhrases = [
      "season of my life",
      "what is this really about",
      "what does this mean",
      "what is the lesson",
      "what am i supposed to learn",
      "what is life trying to teach me",
      "what does this reveal",
      "what is underneath all of this",
      "what is the deeper meaning",
      "why is this happening now",
      "what is this season teaching me",
      "what do you think this season of my life is really about",
      "what is really going on here",
      "what does this chapter mean",
      "what is this chapter about",
      "what is this season about",
      "what is this trying to teach me"
    ];

    if (this.containsAny(text, meaningPhrases)) {
      return "meaning";
    }

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
      "without realizing it",
      "protect myself from",
      "what am i using",
      "what am i afraid",
      "what am i protecting",
      "what does this say about me",
      "why do i keep",
      "running from",
      "uncomfortable truth",
      "most uncomfortable truth",
      "what truth",
      "truth am i avoiding",
      "might be avoiding",
      "avoiding right now",
      "what am i refusing to see",
      "what am i not ready to admit",
      "what am i scared to admit",
      "what truth am i avoiding",
      "what am i pretending not to know"
    ];

    if (this.containsAny(text, insightPhrases)) {
      return "insight";
    }

    if (this.scoreInsightIntent(text) >= 4) {
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

  scoreInsightIntent(text = "") {
    let score = 0;

    if (text.includes("truth")) score += 2;
    if (text.includes("uncomfortable")) score += 2;
    if (text.includes("avoid") || text.includes("avoiding")) score += 3;
    if (text.includes("blind spot")) score += 3;
    if (text.includes("pattern")) score += 2;
    if (text.includes("hidden")) score += 2;
    if (text.includes("sacrifice") || text.includes("sacrificing")) score += 2;
    if (text.includes("tradeoff") || text.includes("trade-off")) score += 2;
    if (text.includes("not seeing")) score += 2;
    if (text.includes("refusing to see")) score += 3;
    if (text.includes("not ready to admit")) score += 3;
    if (text.includes("pretending not to know")) score += 3;
    if (text.includes("costing me")) score += 2;
    if (text.includes("really going on")) score += 2;

    return score;
  },

  containsAny(text, phrases = []) {
    return phrases.some((phrase) => text.includes(phrase));
  }
};