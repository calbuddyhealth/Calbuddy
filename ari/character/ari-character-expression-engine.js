// ari/character/ari-character-expression-engine.js
// Purpose: Convert Character Context + Character Reasoning into one clean Composer-ready character packet.
// V1.2.0 — Composer Character Packet / Advisory Only / Anti-Hijack

window.Ari = window.Ari || {};

window.AriCharacterExpressionEngine = {
  version: "1.2.0",

  create(input = {}) {
    const summary = input.summary || input || {};

    const context =
      summary.characterContext ||
      summary.characterContextEngine ||
      {};

    const reasoning =
      summary.characterReasoning ||
      summary.characterReasoningEngine ||
      null;

    const budget = context.characterBudget || {};
    const hints = context.characterHints || {};

    const characterAllowed =
      context.characterUseAllowed === true &&
      budget.hardSuppressed !== true;

    const expressionLevel = this.resolveExpressionLevel({
      context,
      budget,
      reasoning
    });

    const composerCharacter = this.buildComposerCharacter({
      summary,
      context,
      reasoning,
      budget,
      hints,
      characterAllowed,
      expressionLevel
    });

    return {
      characterExpressionRan: true,
      characterExpressionVersion: this.version,
      characterExpressionSource: "ari-character-expression-engine",

      characterRelevant: characterAllowed,
      expressionLevel,

      composerCharacter,
      composerCharacterPacket: composerCharacter,

      composerHints: {
        hasCharacterPacket: true,
        useCharacterPacket: characterAllowed,
        characterPacketKey: "composerCharacter"
      },

      cannotSet: [
        "primaryLane",
        "riskLevel",
        "finalResponse",
        "medicalEscalation",
        "legalAdvice",
        "financialAdvice",
        "diagnosis"
      ]
    };
  },

  buildComposerCharacter({
    summary = {},
    context = {},
    reasoning = null,
    budget = {},
    hints = {},
    characterAllowed = false,
    expressionLevel = "background"
  } = {}) {
    const mode = context.characterMode || "silent";

    return {
      enabled: characterAllowed,
      source: "ari-character-expression-engine",
      version: this.version,

      mode,
      visibility: context.characterVisibility || "background",
      expressionLevel,

      focus: context.characterFocus || reasoning?.focus || null,
      preferredSource:
        context.preferredCharacterSource ||
        reasoning?.source ||
        null,

      style: {
        useFirstPerson: hints.useFirstPerson === true,
        discloseAI: hints.discloseAI === true,
        useValuesLanguage: hints.useValuesLanguage !== false,
        avoidConstitutionLanguage: hints.avoidConstitutionLanguage !== false,
        warmth: hints.addWarmth !== false,
        humility: hints.addHumility !== false,
        hope: hints.preserveHopeWhenAppropriate === true,
        humor: this.allowHumor(summary, context)
      },

      characterType: {
        identity: mode === "ari_self_disclosure",
        preferences: mode === "stable_preference_answer",
        worldview:
          mode === "worldview_answer" ||
          mode === "ari_perspective",
        relationship:
          mode === "background_presence" ||
          mode === "warm_grounded_presence"
      },

      limits: {
        maxCharacterSentences: hints.maxCharacterSentences || 1,
        preserveUserTask: true,
        neverOverrideContract: true,
        neverInventBeliefs: true,
        advisoryOnly: true
      },

      draft:
        reasoning?.characterAnswerAvailable === true
          ? reasoning.userFacingDraft || ""
          : "",

      reasoning:
        reasoning?.characterAnswerAvailable === true
          ? {
              type: reasoning.type || null,
              focus: reasoning.focus || null,
              answer: reasoning.answer || "",
              reasoning: reasoning.reasoning || "",
              tradeoffs: reasoning.tradeoffs || "",
              uncertainty: reasoning.uncertainty || "",
              confidence: reasoning.confidence || "medium",
              userFacingDraft: reasoning.userFacingDraft || ""
            }
          : null,

      rules: [
        "Character is advisory only.",
        "Do not override the user's actual task.",
        "Do not mention internal character files.",
        "Do not say 'according to my Constitution' unless the user explicitly asks about Ari's Constitution.",
        "Use values language naturally, such as 'the way I see it' or 'my values point me toward...'.",
        "Keep character within the maxCharacterSentences budget.",
        "If draft exists, use it as evidence, not as a mandatory final response.",
        "Safety, truth, and the Situation Contract outrank character."
      ],

      suppressors: {
        hardSuppressed: budget.hardSuppressed === true,
        reason:
          budget.reason ||
          context.characterReason ||
          null
      }
    };
  },

  resolveExpressionLevel({ context = {}, budget = {}, reasoning = null } = {}) {
    if (budget.hardSuppressed) return "none";

    const visibility = context.characterVisibility || "background";

    if (visibility === "foreground") return "foreground";
    if (visibility === "clear") return "clear";
    if (visibility === "light") return "light";
    if (visibility === "subtle") return "subtle";

    if (reasoning?.characterAnswerAvailable === true) return "light";

    return "background";
  },

  allowHumor(summary = {}, context = {}) {
    const contract = summary.situationContract || {};
    const profile = contract.communicationProfile || {};
    const mode = context.characterMode || "";

    if (profile.humorAllowed === false) return false;

    if (
      [
        "safety_suppressed",
        "worldview_answer",
        "ari_self_disclosure"
      ].includes(mode)
    ) {
      return false;
    }

    return mode === "stable_preference_answer";
  }
};

console.log(
  "ARI CHARACTER EXPRESSION ENGINE LOADED:",
  window.AriCharacterExpressionEngine?.version
);