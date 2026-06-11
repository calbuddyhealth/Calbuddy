// ari/attention-system/ari-attention-system.js
// Ari Attention System
// Purpose: Decide what deserves focus before routing.
// V2.1: Adds questionType support for meaning, insight, emotional, decision, planning, and building.

window.Ari = window.Ari || {};

window.Ari.attentionSystem = {
  version: "2.1.0",

  prioritize(observation = {}) {
    const result = {
      focusType: "unknown",
      focusReason: "No strong focus detected.",
      primaryNeed: null,
      secondaryNeeds: [],
      priorities: [],
      emotionalSupportNeeded: false,
      memoryAttentionNeeded: false,
      guardianAttentionNeeded: false,
      shouldRouteTo: "observer",
      source: "ari-attention-system"
    };

    if (!observation) return result;

    const text = observation.normalizedMessage || "";
    const questionType = observation.questionType || "understanding";

    const risk = observation.risk || {};
    const intent = observation.intent || "unknown";
    const emotion = observation.emotion || {};
    const memory = observation.memory || {};
    const goals = observation.goals || {};
    const conversation = observation.conversation || {};
    const relationship = observation.relationship || {};

    const priorities = [];

    const addPriority = (need, score, routeTo, reason) => {
      const existing = priorities.find((item) => item.need === need);

      if (existing) {
        existing.score += score;
        existing.reasons.push(reason);
        return;
      }

      priorities.push({
        need,
        score,
        routeTo,
        reasons: [reason]
      });
    };

    const hasAny = (phrases = []) => {
      return phrases.some((phrase) => text.includes(phrase));
    };

    // 1. Safety always wins.
    if (risk.guardianRequired) {
      addPriority("safety", 100, "guardian", "Potential safety concern detected.");
    }

    // 2. Question type should strongly influence routing.
    if (questionType === "meaning") {
      addPriority(
        "meaning",
        35,
        "storykeeper",
        "User is seeking meaning, purpose, or life interpretation."
      );
    }

    if (questionType === "insight") {
      addPriority(
        "insight",
        32,
        "observer",
        "User is asking for insight, pattern recognition, or hidden meaning."
      );
    }

    if (questionType === "emotional") {
      addPriority(
        "support",
        30,
        "companion",
        "User is asking about feelings or emotional experience."
      );
    }

    if (questionType === "decision") {
      addPriority(
        "prioritization",
        30,
        "planner",
        "User is asking for a decision, priority, or tradeoff."
      );
    }

    if (questionType === "planning") {
      addPriority(
        "planning",
        28,
        "planner",
        "User is asking for a plan, next step, or roadmap."
      );
    }

    if (questionType === "building") {
      addPriority(
        "building",
        28,
        "builder",
        "User is asking about code, architecture, or building Ari."
      );
    }

    if (questionType === "teaching") {
      addPriority(
        "teaching",
        24,
        "teacher",
        "User is asking for explanation or teaching."
      );
    }

    const decisionConflict = hasAny([
      "part of me",
      "another part of me",
      "torn between",
      "can't decide",
      "cannot decide",
      "conflicted",
      "too much at once",
      "spreading myself too thin",
      "what matters most",
      "focus on first",
      "deserves my attention",
      "figure out what matters",
      "help me decide",
      "decide what",
      "prioritize"
    ]);

    const planningRequest =
      intent === "plan" ||
      goals.wantsPlan ||
      hasAny([
        "help me create a plan",
        "make a plan",
        "create a plan",
        "roadmap",
        "next step",
        "focus on first",
        "what should i focus",
        "what deserves my attention",
        "help me figure out",
        "help me decide",
        "prioritize"
      ]);

    const buildingRequest =
      intent === "build" ||
      goals.wantsBuild ||
      hasAny([
        "debug",
        "github",
        "repository",
        "repo",
        "code",
        "clean architecture",
        "quick patches",
        "better coder",
        "build ari",
        "ari rebirth"
      ]);

    const explicitMemory =
      memory.explicitMemoryIntent ||
      intent === "memory";

    const emotionalPain =
      emotion.hasEmotionalPain ||
      intent === "support";

    const milestone = memory.milestoneSignal;

    const journey =
      memory.journeySignal ||
      goals.wantsGrowth ||
      hasAny([
        "become",
        "becoming",
        "future daughter",
        "leaving the navy",
        "pmhnp",
        "school",
        "career",
        "family",
        "season of my life",
        "life chapter"
      ]);

    const reflection =
      memory.reflectionSignal ||
      intent === "reflect";

    const identity = memory.identitySignal;

    const preference =
      memory.preferenceSignal ||
      relationship.communicationPreference ||
      hasAny([
        "direct feedback",
        "sugarcoating",
        "don't sugarcoat",
        "uncomfortable"
      ]);

    // 3. Decision and prioritization requests.
    if (decisionConflict) {
      addPriority(
        "prioritization",
        25,
        "planner",
        "User is facing competing priorities or asking what matters most."
      );
    }

    if (planningRequest) {
      addPriority(
        "planning",
        20,
        "planner",
        "User is asking for a plan, direction, or next focus."
      );
    }

    // 4. Technical/building requests.
    if (buildingRequest) {
      addPriority(
        "building",
        12,
        "builder",
        "User is asking about code, architecture, or building Ari."
      );
    }

    // 5. Journey and growth signals.
    if (journey) {
      addPriority(
        "journey",
        10,
        "planner",
        "Long-term growth path or life transition detected."
      );
    }

    // 6. Emotional support.
    if (emotionalPain) {
      addPriority(
        "support",
        8,
        "companion",
        "Emotional strain or support need detected."
      );
    }

    // 7. Memory and preferences.
    if (explicitMemory) {
      addPriority(
        "memory",
        7,
        "memory",
        "User explicitly requested memory."
      );
    }

    if (preference) {
      addPriority(
        "preference",
        5,
        "memory",
        "Preference or communication style detected."
      );
    }

    // 8. Milestones and story.
    if (milestone) {
      addPriority(
        "story",
        5,
        "storykeeper",
        "Milestone or meaningful story event detected."
      );
    }

    if (identity) {
      addPriority(
        "identity",
        6,
        "memory",
        "Identity information detected."
      );
    }

    if (reflection) {
      addPriority(
        "reflection",
        9,
        "reflection",
        "Reflection or lesson detected."
      );
    }

    if (intent === "teach") {
      addPriority(
        "teaching",
        10,
        "teacher",
        "Educational request detected."
      );
    }

    if (intent === "explore") {
      addPriority(
        "exploration",
        10,
        "explorer",
        "Exploration or brainstorming detected."
      );
    }

    if (conversation.hasDirectRequest && priorities.length === 0) {
      addPriority(
        "request",
        6,
        "observer",
        "Direct request detected but no specialized route identified."
      );
    }

    if (priorities.length === 0) {
      addPriority(
        "understanding",
        1,
        "observer",
        "Insufficient context. Continue observing."
      );
    }

    priorities.sort((a, b) => b.score - a.score);

    const winner = priorities[0];

    const secondaryNeeds = priorities
      .slice(1, 5)
      .map((item) => item.need);

    const emotionalSupportNeeded =
      emotionalPain && winner.routeTo !== "companion";

    const memoryAttentionNeeded =
      (explicitMemory || preference || identity || questionType === "meaning") &&
      winner.routeTo !== "memory";

    const guardianAttentionNeeded =
      Boolean(risk.guardianRequired);

    return {
      ...result,
      focusType: winner.need,
      focusReason: winner.reasons.join(" "),
      primaryNeed: winner.need,
      secondaryNeeds,
      priorities,
      emotionalSupportNeeded,
      memoryAttentionNeeded,
      guardianAttentionNeeded,
      shouldRouteTo: winner.routeTo
    };
  }
};