// ari/language/ari-human-language-engine.js
//
// Ari Human Language Engine
//
// Purpose:
// Normalize and package the already-resolved communication guidance for
// downstream realization.
//
// V2.0.0 — Language Adapter Architecture
//
// Architectural Flow:
//
// Ari Preferences
//        ↓
// Character
//        ↓
// Deliberation
//        ↓
// Human Language Engine
//        ↓
// Mouth Director
//        ↓
// Response Realization
//
// Responsibilities:
// - Normalize resolved language guidance.
// - Merge communication guidance.
// - Resolve conflicting language directives.
// - Validate language profile.
// - Produce one canonical Human Language Guidance packet.
//
// Non-responsibilities:
// - Does NOT define Ari's personality.
// - Does NOT override user preferences.
// - Does NOT create humor policy.
// - Does NOT create profanity policy.
// - Does NOT create warmth.
// - Does NOT create professionalism.
// - Does NOT reinterpret reasoning.
// - Does NOT reinterpret safety.
// - Does NOT reinterpret character.
// - Does NOT decide how Ari should behave.

window.Ari = window.Ari || {};

window.AriHumanLanguageEngine = {
  version: "2.0.0",

  create(input = {}) {

    const summary =
      input.summary ||
      input ||
      {};

    const personality =
      summary.resolvedAriPersonality ||
      {};

    const reasoning =
      summary.reasoningLanguageGuidance ||
      {};

    const safety =
      summary.safetyLanguageGuidance ||
      {};

    const relationship =
      summary.relationshipLanguageGuidance ||
      {};

    const guidance = {

      tone:
        reasoning.tone ??
        personality.tone ??
        "natural",

      warmth:
        personality.warmth,

      bluntness:
        personality.bluntness,

      humor:
        personality.humor,

      profanity:
        personality.profanity,

      sarcasm:
        personality.sarcasm,

      professionalism:
        personality.professionalism,

      challenge:
        personality.challenge,

      validation:
        reasoning.validation ??
        personality.validation,

      pacing:
        reasoning.pacing ??
        personality.pacing,

      sentenceStyle:
        personality.sentenceStyle,

      vocabulary:
        personality.vocabulary,

      preferredMoves: [
        ...(personality.preferredMoves || []),
        ...(reasoning.preferredMoves || [])
      ],

      bannedMoves: [
        ...(personality.bannedMoves || []),
        ...(reasoning.bannedMoves || []),
        ...(safety.bannedMoves || [])
      ],

      preferredPhrases: [
        ...(personality.preferredPhrases || [])
      ],

      bannedPhrases: [
        ...(personality.bannedPhrases || []),
        ...(safety.bannedPhrases || [])
      ]
    };

    this.resolveConflicts(guidance, safety);
    this.normalize(guidance);

    return {

      humanLanguageEngineRan: true,

      humanLanguageEngineVersion:
        this.version,

      source:
        "ari-human-language-engine",

      humanLanguageGuidance:
        guidance
    };

  },

  resolveConflicts(guidance = {}, safety = {}) {

    if (safety.disableHumor) {
      guidance.humor = 0;
    }

    if (safety.disableProfanity) {
      guidance.profanity = 0;
    }

    if (safety.disableSarcasm) {
      guidance.sarcasm = 0;
    }

    if (safety.disableChallenge) {
      guidance.challenge = 0;
    }

    guidance.preferredMoves =
      [...new Set(guidance.preferredMoves)];

    guidance.bannedMoves =
      [...new Set(guidance.bannedMoves)];

    guidance.preferredPhrases =
      [...new Set(guidance.preferredPhrases)];

    guidance.bannedPhrases =
      [...new Set(guidance.bannedPhrases)];

  },

  normalize(guidance = {}) {

    [
      "warmth",
      "bluntness",
      "humor",
      "profanity",
      "sarcasm",
      "professionalism",
      "challenge"
    ].forEach(key => {

      if (typeof guidance[key] !== "number") {
        return;
      }

      guidance[key] =
        Math.max(
          0,
          Math.min(100, guidance[key])
        );

    });

  }

};

console.log(
  "ARI HUMAN LANGUAGE ENGINE LOADED:",
  window.AriHumanLanguageEngine?.version
);