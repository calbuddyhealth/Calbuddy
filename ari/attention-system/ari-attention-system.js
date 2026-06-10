// ari/attention-system/ari-attention-system.js
// Ari Attention System
// Purpose: Decide what deserves focus before routing.

window.Ari = window.Ari || {};

window.Ari.attentionSystem = {
  version: "1.0.0",

  prioritize(observation = {}) {
    const result = {
      focusType: "unknown",
      focusReason: "No strong focus detected.",
      primaryNeed: null,
      secondaryNeeds: [],
      emotionalSupportNeeded: false,
      memoryAttentionNeeded: false,
      guardianAttentionNeeded: false,
      shouldRouteTo: "observer",
      source: "ari-attention-system"
    };

    if (!observation) return result;

    const {
      risk = {},
      intent = "unknown",
      emotion = {},
      memory = {},
      goals = {}
    } = observation;

    // 1. Safety
    if (risk.guardianRequired) {
      return {
        ...result,
        focusType: "safety",
        focusReason: "Potential safety concern detected.",
        primaryNeed: "safety",
        guardianAttentionNeeded: true,
        shouldRouteTo: "guardian"
      };
    }

    // 2. Explicit memory
    if (memory.explicitMemoryIntent) {
      return {
        ...result,
        focusType: "memory",
        focusReason: "User explicitly requested memory.",
        primaryNeed: "memory",
        memoryAttentionNeeded: true,
        shouldRouteTo: "memory"
      };
    }

    // 3. Planning
    if (intent === "plan" || goals.wantsPlan) {
      return {
        ...result,
        focusType: "planning",
        focusReason: "User is asking for direction or roadmap.",
        primaryNeed: "planning",
        secondaryNeeds: emotion.hasEmotionalPain ? ["emotional-support"] : [],
        emotionalSupportNeeded: emotion.hasEmotionalPain,
        shouldRouteTo: "planner"
      };
    }

    // 4. Building
    if (intent === "build" || goals.wantsBuild) {
      return {
        ...result,
        focusType: "building",
        focusReason: "User is asking for technical help.",
        primaryNeed: "building",
        shouldRouteTo: "builder"
      };
    }

    // 5. Identity
    if (memory.identitySignal) {
      return {
        ...result,
        focusType: "identity",
        focusReason: "Identity information detected.",
        primaryNeed: "identity",
        memoryAttentionNeeded: true,
        shouldRouteTo: "memory"
      };
    }

    // 6. Milestone
    if (memory.milestoneSignal) {
      return {
        ...result,
        focusType: "milestone",
        focusReason: "Milestone or achievement detected.",
        primaryNeed: "story",
        secondaryNeeds: ["celebration"],
        shouldRouteTo: "storykeeper"
      };
    }

    // 7. Journey
    if (memory.journeySignal) {
      return {
        ...result,
        focusType: "journey",
        focusReason: "Long-term goal or growth path detected.",
        primaryNeed: "growth",
        shouldRouteTo: "planner"
      };
    }

    // 8. Reflection
    if (memory.reflectionSignal || intent === "reflect") {
      return {
        ...result,
        focusType: "reflection",
        focusReason: "Reflection or lesson detected.",
        primaryNeed: "meaning",
        shouldRouteTo: "reflection"
      };
    }

    // 9. Emotional support
    if (emotion.hasEmotionalPain || intent === "support") {
      return {
        ...result,
        focusType: "support",
        focusReason: "Emotional support needed.",
        primaryNeed: "support",
        emotionalSupportNeeded: true,
        shouldRouteTo: "companion"
      };
    }

    // 10. Teaching
    if (intent === "teach") {
      return {
        ...result,
        focusType: "teaching",
        focusReason: "Educational request detected.",
        primaryNeed: "learning",
        shouldRouteTo: "teacher"
      };
    }

    // 11. Exploration
    if (intent === "explore") {
      return {
        ...result,
        focusType: "exploration",
        focusReason: "Exploration or brainstorming detected.",
        primaryNeed: "exploration",
        shouldRouteTo: "explorer"
      };
    }

    return {
      ...result,
      focusType: "observation",
      focusReason: "Insufficient context. Continue observing.",
      primaryNeed: "understanding",
      shouldRouteTo: "observer"
    };
  }
};