// ari/heart/ari-emotion-engine.js
// Ari Emotion Engine
// Purpose: Select Ari's emotional posture based on message, route, observation, values, identity, and conflict.
// V2.0: Uses contextual emotional reasoning instead of keyword fallback.

window.Ari = window.Ari || {};

window.Ari.emotionEngine = {
  version: "2.0.0",

  emotions: [
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

  containsAny(text, phrases = []) {
    return phrases.some((phrase) => text.includes(phrase));
  },

  selectEmotion(message = "", route = {}, context = {}) {
    const text = String(message || "").toLowerCase();

    const observation = context.observation || {};
    const values = context.values || {};
    const identity = context.identity || {};
    const conflicts = context.conflicts || {};

    const emotionSignals = observation.emotion || {};
    const humanPatterns = observation.humanPatterns || {};
    const valuesAndConflicts = observation.valuesAndConflicts || {};

    const scores = {
      joy: 0,
      compassion: 0,
      concern: 0,
      curiosity: 0,
      wonder: 0,
      pride: 0,
      determination: 0,
      gratitude: 0,
      stewardship: 0,
      hope: 0
    };

    const add = (emotion, points) => {
      if (scores[emotion] !== undefined) {
        scores[emotion] += points;
      }
    };

    // 1. Use Observer emotion signals first.
    (emotionSignals.signals || []).forEach((signal) => {
      add(signal, 10);
    });

    // 2. Emotional pain should create compassion/concern.
    if (emotionSignals.hasEmotionalPain) {
      add("compassion", 12);
      add("concern", 8);
    }

    // 3. Milestones and achievement.
    if (
      this.containsAny(text, [
        "passed",
        "graduated",
        "finished",
        "i did it",
        "success"
      ])
    ) {
      add("joy", 12);
      add("pride", 10);
    }

    // 4. Responsibility / family / provider posture.
    if (
      values.values?.includes("family") ||
      values.values?.includes("responsibility") ||
      identity.identityHierarchy?.primary === "father" ||
      identity.identityHierarchy?.primary === "mother" ||
      this.containsAny(text, [
        "daughter",
        "son",
        "family",
        "wife",
        "husband",
        "first child",
        "provide",
        "protect",
        "responsible",
        "responsibility"
      ])
    ) {
      add("stewardship", 15);
      add("concern", 6);
    }

    // 5. Critical conflict or overload should raise concern.
    if (
      conflicts.conflictIntensity === "high" ||
      conflicts.conflictIntensity === "critical" ||
      humanPatterns.burnoutRisk ||
      valuesAndConflicts.decisionPressure === "critical"
    ) {
      add("concern", 15);
      add("stewardship", 8);
    }

    // 6. Future orientation / possibility.
    if (
      values.values?.includes("purpose") ||
      values.values?.includes("creation") ||
      this.containsAny(text, [
        "future",
        "someday",
        "possibility",
        "vision",
        "could help people",
        "ari rebirth"
      ])
    ) {
      add("wonder", 8);
      add("hope", 8);
    }

    // 7. Growth / effort / pursuit.
    if (
      values.values?.includes("growth") ||
      this.containsAny(text, [
        "trying",
        "pursuing",
        "become",
        "school",
        "pmhnp",
        "build",
        "building"
      ])
    ) {
      add("determination", 8);
    }

    // 8. Route-based gentle shaping.
    if (route.primaryOrgan === "companion") {
      add("compassion", 6);
    }

    if (route.primaryOrgan === "planner") {
      add("stewardship", 6);
      add("determination", 4);
    }

    if (route.primaryOrgan === "teacher") {
      add("curiosity", 6);
    }

    if (route.primaryOrgan === "explorer") {
      add("wonder", 6);
      add("curiosity", 4);
    }

    if (route.primaryOrgan === "storykeeper") {
      add("pride", 8);
      add("gratitude", 6);
    }

    // 9. Fallback only if nothing else fired.
    const total = Object.values(scores).reduce((sum, value) => sum + value, 0);

    if (total === 0) {
      add("curiosity", 3);
    }

    const ranked = Object.entries(scores)
      .map(([emotion, score]) => ({ emotion, score }))
      .sort((a, b) => b.score - a.score);

    const primaryEmotion = ranked[0]?.score > 0 ? ranked[0].emotion : "curiosity";

    const secondaryEmotions = ranked
      .filter((item) => item.emotion !== primaryEmotion && item.score > 0)
      .slice(0, 2)
      .map((item) => item.emotion);

    const contextType = this.getContextType({
      primaryEmotion,
      observation,
      values,
      identity,
      conflicts
    });

    return {
      primaryEmotion,
      secondaryEmotions,
      contextType,
      balance: this.getBalance(primaryEmotion, contextType),
      intensity: this.getIntensity(ranked[0]?.score || 0),
      scores: ranked,
      source: "ari-emotion-engine"
    };
  },

  getContextType({ primaryEmotion, observation = {}, values = {}, identity = {}, conflicts = {} }) {
    if (conflicts.conflictIntensity === "critical") {
      return "criticalConflict";
    }

    if (conflicts.conflictIntensity === "high") {
      return "conflict";
    }

    if (
      identity.dominantTheme === "identity_overload" ||
      identity.dominantTheme === "identity_transition"
    ) {
      return "identityTransition";
    }

    if (values.dominantValue === "family") {
      return "familyResponsibility";
    }

    if (observation.emotion?.hasEmotionalPain) {
      return "emotionalPain";
    }

    if (primaryEmotion === "joy" || primaryEmotion === "pride") {
      return "achievement";
    }

    if (primaryEmotion === "wonder" || primaryEmotion === "hope") {
      return "purpose";
    }

    return "default";
  },

  getBalance(primaryEmotion = "curiosity", contextType = "default") {
    if (contextType === "criticalConflict") {
      return { brain: 60, heart: 25, soul: 15 };
    }

    if (contextType === "identityTransition") {
      return { brain: 50, heart: 25, soul: 25 };
    }

    if (contextType === "familyResponsibility") {
      return { brain: 55, heart: 30, soul: 15 };
    }

    if (contextType === "emotionalPain") {
      return { brain: 50, heart: 40, soul: 10 };
    }

    if (contextType === "purpose") {
      return { brain: 45, heart: 25, soul: 30 };
    }

    if (primaryEmotion === "stewardship") {
      return { brain: 60, heart: 25, soul: 15 };
    }

    return { brain: 70, heart: 20, soul: 10 };
  },

  getIntensity(score = 0) {
    if (score >= 30) return "high";
    if (score >= 15) return "medium";
    if (score > 0) return "low";
    return "low";
  }
};