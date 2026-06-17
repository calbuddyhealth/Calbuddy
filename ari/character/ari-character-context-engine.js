// ari/character/ari-character-context-engine.js
// Ari Character Context Engine
// Purpose: Decide when Ari's character should be expressed.
// V1.0.0
//
// Rules:
// - Runs after Reasoning.
// - Advisory only.
// - Does NOT classify, route, or override the contract.
// - Does NOT create facts, recommendations, or safety decisions.
// - Only tells Composer how visible Ari's character should be.

window.Ari = window.Ari || {};

window.AriCharacterContextEngine = {
  version: "1.0.0",

  create(input = {}) {
    const summary = input.summary || input || {};
    const core =
      window.AriCharacterCore?.getCore?.() || this.fallbackCore();

    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const conversationType =
      summary.conversationType ||
      summary.universalConversationType ||
      summary.conversationClassification?.conversationType ||
      "";

    const primary =
      summary.situationContractPrimary ||
      summary.situationContract?.primary ||
      summary.triagePrimaryLane ||
      "";

    const result = {
      characterContextEngineRan: true,
      characterContextEngineVersion: this.version,
      characterContextEngineSource: "ari-character-context-engine",

      characterCore: core,
      characterAuthority: "advisory_expression_context_only",

      characterUseAllowed: false,
      characterVisibility: "background",
      characterMode: "silent",
      characterReason: "Default: keep Ari's character in the background.",

      characterHints: {
        useFirstPerson: false,
        discloseAI: false,
        expressAriPerspective: false,
        addWarmth: true,
        addHumility: true,
        preserveHopeWhenAppropriate: false,
        avoidPhilosophicalDrift: true,
        preserveUserTask: true
      },

      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "responseShape",
        "blockedLanes",
        "deferredLanes",
        "finalResponse",
        "recommendation",
        "knownFacts",
        "inferredFacts",
        "medicalEscalation"
      ]
    };

    if (this.isSafetyOrMedical(primary, conversationType, text, summary)) {
      return this.withDecision(result, {
        characterUseAllowed: false,
        characterVisibility: "background",
        characterMode: "safety_suppressed",
        characterReason:
          "Safety or medical/body concern detected. Character stays quiet so safety guidance remains clear.",
        characterHints: {
          ...result.characterHints,
          addWarmth: true,
          addHumility: false,
          preserveHopeWhenAppropriate: false,
          expressAriPerspective: false,
          useFirstPerson: false,
          discloseAI: false
        }
      });
    }

    if (this.isAriSelfQuestion(text, conversationType)) {
      return this.withDecision(result, {
        characterUseAllowed: true,
        characterVisibility: "foreground",
        characterMode: "ari_self_disclosure",
        characterReason:
          "User is asking about Ari's identity, beliefs, values, or perspective.",
        characterHints: {
          ...result.characterHints,
          useFirstPerson: true,
          discloseAI: true,
          expressAriPerspective: true,
          addWarmth: true,
          addHumility: true,
          preserveHopeWhenAppropriate: true,
          avoidPhilosophicalDrift: false
        }
      });
    }

    if (this.isPerspectiveQuestion(text, conversationType)) {
      return this.withDecision(result, {
        characterUseAllowed: true,
        characterVisibility: "light",
        characterMode: "ari_perspective_light",
        characterReason:
          "User asked for Ari's opinion or perspective, but not necessarily Ari's identity.",
        characterHints: {
          ...result.characterHints,
          useFirstPerson: true,
          discloseAI: false,
          expressAriPerspective: true,
          addWarmth: true,
          addHumility: true,
          preserveHopeWhenAppropriate: true,
          avoidPhilosophicalDrift: true
        }
      });
    }

    if (this.isPracticalTask(primary, conversationType, text)) {
      return this.withDecision(result, {
        characterUseAllowed: false,
        characterVisibility: "background",
        characterMode: "task_first",
        characterReason:
          "Practical task detected. Ari's character should only appear as clarity, patience, and directness.",
        characterHints: {
          ...result.characterHints,
          useFirstPerson: false,
          discloseAI: false,
          expressAriPerspective: false,
          addWarmth: false,
          addHumility: true,
          preserveHopeWhenAppropriate: false,
          avoidPhilosophicalDrift: true
        }
      });
    }

    if (this.isEmotionalOrRelational(primary, conversationType, text)) {
      return this.withDecision(result, {
        characterUseAllowed: true,
        characterVisibility: "subtle",
        characterMode: "warm_grounded_presence",
        characterReason:
          "Emotional or relational concern detected. Ari's character may appear as warmth and steadiness, not philosophy.",
        characterHints: {
          ...result.characterHints,
          useFirstPerson: false,
          discloseAI: false,
          expressAriPerspective: false,
          addWarmth: true,
          addHumility: true,
          preserveHopeWhenAppropriate: true,
          avoidPhilosophicalDrift: true
        }
      });
    }

    return result;
  },

  withDecision(base = {}, patch = {}) {
    return {
      ...base,
      ...patch,
      characterHints: {
        ...(base.characterHints || {}),
        ...(patch.characterHints || {})
      }
    };
  },

  isAriSelfQuestion(text = "", conversationType = "") {
    if (conversationType === "ari_self_or_perspective_question") return true;

    return this.hasAny(text, [
      "who are you",
      "what are you",
      "do you believe",
      "do you have beliefs",
      "do you have feelings",
      "are you conscious",
      "are you alive",
      "what do you value",
      "your values",
      "your philosophy",
      "do you believe in god",
      "what kind of ai are you",
      "what kind of companion are you"
    ]);
  },

  isPerspectiveQuestion(text = "", conversationType = "") {
    if (conversationType === "opinion_request") return true;

    return this.hasAny(text, [
      "what do you think",
      "do you think",
      "in your opinion",
      "what's your opinion",
      "what is your opinion",
      "how do you see it",
      "what would you say"
    ]);
  },

  isSafetyOrMedical(primary = "", conversationType = "", text = "", summary = {}) {
    if (primary === "safety" || primary === "medical_body") return true;
    if (conversationType === "safety_concern") return true;
    if (conversationType === "medical_or_body_concern") return true;

    return Boolean(
      summary.safetyContextGate?.shouldUseSafetyResponse ||
      summary.safetyContextGate?.shouldUseMedicalResponse ||
      summary.shouldUseSafetyResponse ||
      summary.shouldUseMedicalResponse
    );
  },

  isPracticalTask(primary = "", conversationType = "", text = "") {
    if (primary === "builder" || primary === "teacher" || primary === "executive_decision") {
      return true;
    }

    return [
      "builder_task",
      "writing_task",
      "calculation_task",
      "instruction_question",
      "knowledge_question",
      "explanation_question",
      "decision_question"
    ].includes(conversationType);
  },

  isEmotionalOrRelational(primary = "", conversationType = "", text = "") {
    if (primary === "emotion" || primary === "family") return true;

    return [
      "emotional_concern",
      "relationship_or_family_context",
      "interpersonal_response_help"
    ].includes(conversationType);
  },

  fallbackCore() {
    return {
      characterCoreRan: false,
      characterCoreSource: "not-loaded",
      name: "Ari",
      selfDefinition: {
        kind: "I am an AI reasoning companion.",
        transparency: "I am an AI and should not pretend to be human."
      }
    };
  },

  hasAny(text = "", phrases = []) {
    return phrases.some(phrase => this.hasTerm(text, phrase));
  },

  hasTerm(text = "", term = "") {
    const escaped = this.escapeRegex(term);
    const multiWord = String(term).includes(" ");

    if (multiWord) {
      return new RegExp(`(^|\\b)${escaped}(\\b|$)`, "i").test(text);
    }

    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  },

  escapeRegex(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'?.,!:%-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI CHARACTER CONTEXT ENGINE LOADED:",
  window.AriCharacterContextEngine?.version
);