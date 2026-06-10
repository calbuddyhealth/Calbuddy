// ari/attention-system/ari-attention-system.js
// Ari Attention System
// Purpose: Decide what deserves focus before routing.
// V2: Uses priority scoring instead of first-match wins.

window.Ari = window.Ari || {};

window.Ari.attentionSystem = {
  version: "2.0.0",

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

    const milestone =
      memory.milestoneSignal;

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
        "family"
      ]);

    const reflection =
      memory.reflectionSignal ||
      intent === "reflect";

    const identity =
      memory.identitySignal;

    const preference =
      memory.preferenceSignal ||
      relationship.communicationPreference ||
      hasAny([
        "direct feedback",
        "sugarcoating",
        "don't sugarcoat",
        "uncomfortable"
      ]);

    // 1. Safety always wins.
    if (risk.guardianRequired) {
      addPriority("safety", 100, "guardian", "Potential safety concern detected.");
    }

    // 2. Decision and prioritization requests are very high priority.
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

    // 3. Technical/building requests matter, but may support planning.
    if (buildingRequest) {
      addPriority(
        "building",
        12,
        "builder",
        "User is asking about code, architecture, or building Ari."
      );
    }

    // 4. Journey and growth signals support planning.
    if (journey) {
      addPriority(
        "journey",
        10,
        "planner",
        "Long-term growth path or life transition detected."
      );
    }

    // 5. Emotional pain matters, but should not always lead.
    if (emotionalPain) {
      addPriority(
        "support",
        8,
        "companion",
        "Emotional strain or support need detected."
      );
    }

    // 6. Explicit memory is important, but usually support unless it is the only main request.
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

    // 7. Milestones matter, but they should not overpower decision requests.
    if (milestone) {
      addPriority(
        "story",
        5,
        "storykeeper",
        "Milestone or meaningful story event detected."
      );
    }

    // 8. Identity/reflection.
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
      (explicitMemory || preference || identity) && winner.routeTo !== "memory";

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