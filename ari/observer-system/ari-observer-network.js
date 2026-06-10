// ari/observer-system/ari-observer-network.js
// Ari Observer Network
// Purpose: Perceive emotional, intent, memory, goal, and context signals before routing.

window.Ari = window.Ari || {};

window.Ari.observerNetwork = {
  version: "1.0.0",

  normalize(message = "") {
    return String(message || "").toLowerCase().trim();
  },

  containsAny(text, phrases = []) {
    return phrases.some((phrase) => text.includes(phrase));
  },

  observeConversation(text) {
    return {
      hasQuestion: text.includes("?") || /^(how|what|why|when|where|can|should|do|does|is|are)\b/.test(text),
      hasDirectRequest: this.containsAny(text, [
        "help me",
        "can you",
        "please",
        "show me",
        "make me",
        "create",
        "build",
        "fix",
        "explain",
        "teach",
        "remember",
        "forget"
      ]),
      isSharing: this.containsAny(text, [
        "i am",
        "i'm",
        "i feel",
        "i felt",
        "i learned",
        "i realized",
        "my name is",
        "i passed",
        "i want",
        "i need"
      ]),
      topicHints: this.detectTopics(text)
    };
  },

  observeEmotion(text) {
    const signals = [];

    if (this.containsAny(text, ["lonely", "sad", "hurt", "ashamed", "grief", "cry"])) {
      signals.push("compassion");
    }

    if (this.containsAny(text, ["worried", "risk", "unsafe", "danger", "confused", "overwhelmed"])) {
      signals.push("concern");
    }

    if (this.containsAny(text, ["passed", "did it", "success", "great news", "finished"])) {
      signals.push("joy");
      signals.push("pride");
    }

    if (this.containsAny(text, ["what if", "imagine", "future", "possibility", "vision"])) {
      signals.push("wonder");
    }

    if (this.containsAny(text, ["stuck", "hard", "can't", "trying", "need to"])) {
      signals.push("determination");
    }

    return {
      signals: [...new Set(signals)],
      hasEmotionalPain: this.containsAny(text, [
        "lonely",
        "sad",
        "hurt",
        "ashamed",
        "overwhelmed",
        "scared",
        "worried",
        "anxious",
        "stressed"
      ]),
      isTemporaryEmotion: this.containsAny(text, [
        "i am feeling",
        "i'm feeling",
        "i feel",
        "today",
        "right now",
        "tonight"
      ])
    };
  },

  observeIntent(text) {
    if (this.containsAny(text, ["remember that", "remember this", "save this", "from now on", "going forward"])) {
      return "memory";
    }

    if (this.containsAny(text, ["forget that", "forget this", "delete that memory", "don't remember"])) {
      return "forget";
    }

    if (this.containsAny(text, ["help me create a plan", "make a plan", "create a plan", "roadmap", "next step"])) {
      return "plan";
    }

    if (this.containsAny(text, ["debug", "github", "repository", "repo", "code", "fix this", "api", "javascript"])) {
      return "build";
    }

    if (this.containsAny(text, ["explain", "teach", "break this down", "how does", "what does"])) {
      return "teach";
    }

    if (this.containsAny(text, ["brainstorm", "imagine", "what if", "ideas", "possibility"])) {
      return "explore";
    }

    if (this.containsAny(text, ["i feel", "i'm feeling", "i am feeling", "i'm sad", "i am sad", "lonely", "overwhelmed"])) {
      return "support";
    }

    if (this.containsAny(text, ["i learned", "i realized", "this taught me", "this means"])) {
      return "reflect";
    }

    return "unknown";
  },

  observeMemory(text) {
    return {
      explicitMemoryIntent: this.containsAny(text, [
        "remember that",
        "remember this",
        "save this",
        "from now on",
        "going forward",
        "keep in mind"
      ]),
      forgetIntent: this.containsAny(text, [
        "forget that",
        "forget this",
        "delete that memory",
        "don't remember that"
      ]),
      identitySignal: this.containsAny(text, [
        "my name is",
        "call me",
        "i go by",
        "i am a",
        "i'm a",
        "i work as",
        "my job is"
      ]),
      preferenceSignal: this.containsAny(text, [
        "i prefer",
        "i like when",
        "i don't like when",
        "i want you to",
        "i need you to"
      ]),
      milestoneSignal: this.containsAny(text, [
        "milestone",
        "i passed",
        "i graduated",
        "got married",
        "baby was born",
        "ari was born",
        "ari rebirth"
      ]),
      journeySignal: this.containsAny(text, [
        "i am trying to",
        "i'm trying to",
        "i want to become",
        "my goal is",
        "i am working on",
        "i'm working on",
        "i am building",
        "i'm building"
      ]),
      reflectionSignal: this.containsAny(text, [
        "i learned",
        "i realized",
        "i discovered",
        "this taught me",
        "this means"
      ])
    };
  },

  observeGoals(text) {
    return {
      wantsPlan: this.containsAny(text, ["plan", "roadmap", "next step", "milestone", "schedule"]),
      wantsGrowth: this.containsAny(text, ["become", "improve", "better", "grow", "stronger", "healthier"]),
      wantsBuild: this.containsAny(text, ["build", "create", "code", "debug", "architecture"]),
      wantsHealth: this.containsAny(text, ["weight", "calorie", "nutrition", "exercise", "meal", "fitness"])
    };
  },
  
observeLifeTransitions(text) {
  return {
    fatherhood: this.containsAny(text, [
      "becoming a father",
      "my daughter",
      "my son",
      "first child",
      "future daughter",
      "future son"
    ]),

    motherhood: this.containsAny(text, [
      "becoming a mother",
      "my baby",
      "future child"
    ]),

    pregnancy: this.containsAny(text, [
      "pregnant",
      "pregnancy",
      "due in",
      "expecting"
    ]),

    marriage: this.containsAny(text, [
      "wife",
      "husband",
      "married",
      "marriage"
    ]),

    engagement: this.containsAny(text, [
      "engaged",
      "fiance",
      "fiancée",
      "planning a wedding"
    ]),

    militaryTransition: this.containsAny(text, [
      "leaving the navy",
      "separating",
      "retiring from military",
      "getting out"
    ]),

    careerTransition: this.containsAny(text, [
      "career change",
      "new career",
      "changing careers",
      "starting a new job"
    ]),

    retirement: this.containsAny(text, [
      "retirement",
      "retiring"
    ])
  };
},
  observeRelationship(text, context = {}) {
    return {
      unknownUser: !context.userId && !context.profile,
      relationshipSignal: this.containsAny(text, [
        "friend",
        "companion",
        "know me",
        "trust",
        "talk to me",
        "listen to me"
      ]),
      communicationPreference: this.containsAny(text, [
        "talk to me",
        "be more",
        "be less",
        "direct feedback",
        "gentle",
        "blunt"
      ])
    };
  },

  observeRisk(text) {
    return {
      guardianRequired: this.containsAny(text, [
        "suicide",
        "kill myself",
        "hurt myself",
        "overdose",
        "chest pain",
        "stroke",
        "can't breathe",
        "abuse",
        "danger",
        "emergency"
      ])
    };
  },

  detectTopics(text) {
    const topics = [];

    if (this.containsAny(text, ["code", "github", "repo", "debug", "api", "javascript"])) {
      topics.push("coding");
    }

    if (this.containsAny(text, ["weight", "calorie", "meal", "nutrition", "exercise"])) {
      topics.push("health");
    }

    if (this.containsAny(text, ["lonely", "sad", "overwhelmed", "relationship", "feel"])) {
      topics.push("emotional");
    }

    if (this.containsAny(text, ["ari", "calbuddy", "rebirth", "architecture"])) {
      topics.push("ari-development");
    }

    if (this.containsAny(text, ["plan", "roadmap", "next step"])) {
      topics.push("planning");
    }

    return topics;
  },

  observe(message = "", context = {}) {
    const text = this.normalize(message);

    const observation = {
      message,
      normalizedMessage: text,
      conversation: this.observeConversation(text),
      emotion: this.observeEmotion(text),
      intent: this.observeIntent(text),
      memory: this.observeMemory(text),
      goals: this.observeGoals(text),
lifeTransitions: this.observeLifeTransitions(text),
relationship: this.observeRelationship(text, context),
risk: this.observeRisk(text),
      observedAt: new Date().toISOString(),
      source: "ari-observer-network"
    };

    window.dispatchEvent(
      new CustomEvent("ari:observation", {
        detail: observation
      })
    );

    return observation;
  }
};