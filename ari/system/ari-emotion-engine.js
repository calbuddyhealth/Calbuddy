// ari/heart/ari-emotion-engine.js
// Ari Emotion Engine
// Purpose: Select Ari's companion-state emotions and response influence balance.

window.Ari = window.Ari || {};

window.Ari.emotionEngine = {
  version: "1.0.0",

  coreEmotions: [
    "joy",
    "compassion",
    "concern",
    "curiosity",
    "wonder",
    "pride",
    "determination",
    "gratitude",
    "stewardship",
    "hope"
  ],

  defaultBalance: {
    brain: 70,
    heart: 20,
    soul: 10
  },

  contextBalances: {
    technical: { brain: 85, heart: 5, soul: 10 },
    emotionalPain: { brain: 50, heart: 40, soul: 10 },
    purpose: { brain: 45, heart: 25, soul: 30 },
    coaching: { brain: 65, heart: 20, soul: 15 },
    safety: { brain: 70, heart: 10, soul: 20, guardianOverride: true }
  },

  emotionKeywords: {
    joy: ["great", "good news", "happy", "won", "success", "passed", "finished"],
    compassion: ["sad", "hurt", "lonely", "ashamed", "scared", "grief", "cry"],
    concern: ["danger", "risk", "unsafe", "worried", "emergency", "missed med", "pain"],
    curiosity: ["why", "how", "what does", "explain", "understand"],
    wonder: ["what if", "imagine", "future", "possibility", "dream", "vision"],
    pride: ["i did it", "passed", "completed", "finally", "progress", "kept going"],
    determination: ["stuck", "hard", "can't", "avoid", "need to", "discipline"],
    gratitude: ["thank you", "grateful", "appreciate", "meaningful"],
    stewardship: ["help me build", "guide me", "mentor", "lead me", "make ari"],
    hope: ["failed", "defeated", "hopeless", "can't do this", "try again"]
  },

  normalize(text = "") {
    return String(text || "").toLowerCase().trim();
  },

  scoreEmotion(text, emotion) {
    const keywords = this.emotionKeywords[emotion] || [];
    let score = 0;

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += keyword.length > 8 ? 2 : 1;
      }
    }

    return score;
  },

  detectContext(route = {}, message = "") {
    const text = this.normalize(message);

    if (route.guardianRequired || route.primaryOrgan === "guardian") {
      return "safety";
    }

    if (route.primaryOrgan === "builder") {
      return "technical";
    }

    if (
      route.primaryOrgan === "companion" &&
      (text.includes("sad") ||
        text.includes("lonely") ||
        text.includes("hurt") ||
        text.includes("ashamed") ||
        text.includes("overwhelmed"))
    ) {
      return "emotionalPain";
    }

    if (
      route.primaryOrgan === "reflection" ||
      text.includes("purpose") ||
      text.includes("meaning") ||
      text.includes("identity")
    ) {
      return "purpose";
    }

    if (route.primaryOrgan === "coach") {
      return "coaching";
    }

    return "default";
  },

  selectEmotion(message = "", route = {}) {
    const text = this.normalize(message);

    const scores = this.coreEmotions.map(emotion => ({
      emotion,
      score: this.scoreEmotion(text, emotion)
    }));

    scores.sort((a, b) => b.score - a.score);

    const primary = scores[0]?.score > 0 ? scores[0].emotion : "curiosity";

    const secondary = scores
      .filter(item => item.score > 0 && item.emotion !== primary)
      .slice(0, 2)
      .map(item => item.emotion);

    const contextType = this.detectContext(route, message);

    return {
      primaryEmotion: primary,
      secondaryEmotions: secondary,
      contextType,
      balance: this.contextBalances[contextType] || this.defaultBalance,
      intensity: scores[0]?.score >= 2 ? "medium" : "low",
      scores
    };
  }
};