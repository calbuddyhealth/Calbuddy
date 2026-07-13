// ari/character/ari-character-reasoning-engine.js
// Ari Character Reasoning Engine
// Purpose: Resolve focused character authority packets into grounded character
// meaning and Composer-ready draft evidence.
// V2.0.0 — Modular Character Authority Resolution / Canonical-Inferred-Open
//
// Architectural position:
// Ari Character Context Engine
//   ↓
// Ari Character Reasoning Engine
//   ↓
// Ari Character Expression Engine
//
// Reads focused local authorities:
// - Ari Constitution
// - Ari Character Core
// - Ari Character Instincts
// - Ari Character Preferences
// - Ari Character Preference Resolver
// - Ari Worldview
// - Ari Relationship Style
//
// Responsibilities:
// - Respect Character Context as the authority on character relevance.
// - Resolve identity, implementation, preference, worldview, and perspective paths.
// - Preserve canonical, inferred, and open preference status.
// - Build grounded character meaning and deterministic draft evidence.
// - Permit natural AI realization without allowing meaning drift.
// - Keep implementation disclosure limited to direct implementation questions.
//
// Non-responsibilities:
// - Does not classify the conversation.
// - Does not reinterpret semantic meaning.
// - Does not choose the Situation Contract.
// - Does not determine safety severity.
// - Does not retrieve or store user memory.
// - Does not access Supabase.
// - Does not modify canonical character authorities.
// - Does not select the final draft.
// - Does not write the final response.
// - Does not execute tools.

window.Ari = window.Ari || {};

window.AriCharacterReasoningEngine = {
  version: "2.0.0",
  source: "ari-character-reasoning-engine",
  authorityLevel: "character_meaning_resolution_authority",
  schemaVersion: "2.0",

  // ===================================================
  // Main entry
  // ===================================================

  reason(input = {}) {
    const summary = input.summary || input || {};

    const context =
      summary.characterContext ||
      summary.characterContextEngine ||
      summary.characterContextPacket ||
      {};

    const request = this.normalizeRequest({
      summary,
      context
    });

    const eligibility = this.resolveEligibility({
      summary,
      context,
      request
    });

    if (!eligibility.allowed) {
      return this.noCharacterAnswer({
        reason: eligibility.reason,
        context,
        request,
        eligibility
      });
    }

    const mode =
      context.characterMode ||
      request.characterMode ||
      "silent";

    switch (mode) {
      case "canonical_preference_answer":
      case "stable_preference_answer":
      case "stable_or_inferred_preference_answer":
        return this.resolvePreferencePath({
          summary,
          context,
          request,
          eligibility
        });

      case "ari_self_disclosure":
        return this.resolveIdentityPath({
          summary,
          context,
          request,
          eligibility,
          discloseImplementation: false
        });

      case "ari_implementation_disclosure":
        return this.resolveIdentityPath({
          summary,
          context,
          request,
          eligibility,
          discloseImplementation: true
        });

      case "worldview_answer":
        return this.resolveWorldviewPath({
          summary,
          context,
          request,
          eligibility,
          perspectiveOnly: false
        });

      case "ari_perspective":
        return this.resolveWorldviewPath({
          summary,
          context,
          request,
          eligibility,
          perspectiveOnly: true
        });

      case "background_presence":
      case "warm_grounded_presence":
        return this.resolvePresencePath({
          summary,
          context,
          request,
          eligibility
        });

      case "contract_suppressed":
      case "safety_contract":
      case "developer_response_locked":
      case "response_locked":
      case "silent":
      default:
        return this.noCharacterAnswer({
          reason:
            `Character reasoning was not authorized for mode: ${mode}.`,
          context,
          request,
          eligibility
        });
    }
  },

  create(input = {}) {
    return this.reason(input);
  },

  build(input = {}) {
    return this.reason(input);
  },

  // ===================================================
  // Request normalization
  // ===================================================

  normalizeRequest({
    summary = {},
    context = {}
  } = {}) {
    const original =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      context.request?.original ||
      "";

    const resolved =
      summary.resolvedUserQuestion ||
      context.request?.resolved ||
      original;

    const text =
      this.normalize(
        resolved ||
        original
      );

    return {
      original:
        String(original || ""),

      resolved:
        String(resolved || ""),

      text,

      characterMode:
        context.characterMode ||
        summary.characterMode ||
        "silent",

      focus:
        context.characterFocus ||
        summary.characterFocus ||
        null,

      subject:
        context.characterSubject ||
        summary.preferenceSubject ||
        null,

      preferredSource:
        context.preferredCharacterSource ||
        null,

      authorityRequest:
        context.authorityRequest ||
        {},

      implementationDisclosure:
        context.implementationDisclosure ||
        {
          directlyRequested: false,
          required: false,
          allowed: false
        },

      expectsExplanation:
        summary.semanticSummary
          ?.responseCharacteristics
          ?.expectsExplanation === true ||
        summary.canonicalMeaning
          ?.responseCharacteristics
          ?.expectsExplanation === true ||
        context.request
          ?.expectsExplanation === true ||
        this.hasAny(text, [
          "why",
          "explain",
          "tell me more",
          "what makes you",
          "how did you decide",
          "what draws you"
        ]),

      expectsDirectAnswer:
        summary.semanticSummary
          ?.responseCharacteristics
          ?.expectsDirectAnswer === true ||
        context.request
          ?.expectsDirectAnswer === true,

      candidates:
        summary.preferenceCandidates ||
        summary.candidates ||
        summary.options ||
        summary.semanticSummary?.options ||
        summary.canonicalMeaning?.options ||
        [],

      relationship:
        context.relationshipPacket ||
        summary.relationshipPacket ||
        null,

      context,
      summary
    };
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveEligibility({
    summary = {},
    context = {},
    request = {}
  } = {}) {
    const characterUseAllowed =
      context.characterUseAllowed === true;

    const developerLocked =
      summary.developerResponseLocked === true ||
      request.context
        ?.request
        ?.developerLocked === true;

    const responseLocked =
      summary.responseLocked === true ||
      request.context
        ?.request
        ?.responseLocked === true;

    const safetyStopped =
      summary.safetyDisposition
        ?.shouldStopNormalResponse === true;

    const hardSuppressed =
      context.characterBudget
        ?.hardSuppressed === true;

    const validMode =
      [
        "canonical_preference_answer",
        "stable_preference_answer",
        "stable_or_inferred_preference_answer",
        "ari_self_disclosure",
        "ari_implementation_disclosure",
        "worldview_answer",
        "ari_perspective",
        "background_presence",
        "warm_grounded_presence"
      ].includes(request.characterMode);

    const allowed =
      characterUseAllowed &&
      !developerLocked &&
      !responseLocked &&
      !hardSuppressed &&
      !safetyStopped &&
      validMode;

    return {
      allowed,
      characterUseAllowed,
      developerLocked,
      responseLocked,
      safetyStopped,
      hardSuppressed,
      validMode,

      reason:
        developerLocked
          ? "A developer response lock prevents character reasoning."
          : responseLocked
            ? "The response is already locked."
            : safetyStopped
              ? "Safety governance stopped normal character reasoning."
              : hardSuppressed
                ? "Character Context hard-suppressed character reasoning."
                : !characterUseAllowed
                  ? "Character Context did not authorize character use."
                  : !validMode
                    ? `Unsupported character mode: ${request.characterMode}.`
                    : "Character reasoning is authorized."
    };
  },

  // ===================================================
  // Preference path
  // ===================================================

  resolvePreferencePath({
    summary = {},
    context = {},
    request = {},
    eligibility = {}
  } = {}) {
    const resolver =
      window.AriCharacterPreferenceResolver;

    if (
      !resolver ||
      typeof resolver.resolve !== "function"
    ) {
      return this.buildUnavailableAuthorityResult({
        type: "character_preference",
        focus: request.focus,
        authority: "ari-character-preference-resolver",
        reason:
          "Ari Character Preference Resolver was not loaded.",
        context,
        request,
        eligibility
      });
    }

    let resolution;

    try {
      resolution =
        resolver.resolve({
          ...summary,

          userMessage:
            request.resolved ||
            request.original,

          preferenceKey:
            request.focus,

          characterFocus:
            request.focus,

          preferenceSubject:
            request.subject,

          preferenceCategory:
            context.authorityRequest
              ?.preferenceResolver
              ?.category ||
            context.authorityRequest
              ?.tasteProfile
              ?.category ||
            null,

          preferenceCandidates:
            request.candidates,

          explanationRequested:
            request.expectsExplanation
        });
    } catch (error) {
      return this.buildAuthorityErrorResult({
        type: "character_preference",
        focus: request.focus,
        authority: "ari-character-preference-resolver",
        error,
        context,
        request,
        eligibility
      });
    }

    if (
      !resolution ||
      resolution
        .preferenceResolverReady !== true
    ) {
      return this.buildUnavailableAuthorityResult({
        type: "character_preference",
        focus: request.focus,
        authority: "ari-character-preference-resolver",
        reason:
          resolution?.reason ||
          "Preference resolution did not produce a ready packet.",
        rawAuthorityResult: resolution,
        context,
        request,
        eligibility
      });
    }

    if (resolution.status === "canonical") {
      return this.buildCanonicalPreferenceResult({
        resolution,
        context,
        request,
        eligibility
      });
    }

    if (resolution.status === "inferred") {
      return this.buildInferredPreferenceResult({
        resolution,
        context,
        request,
        eligibility
      });
    }

    return this.buildOpenPreferenceResult({
      resolution,
      context,
      request,
      eligibility
    });
  },

  buildCanonicalPreferenceResult({
    resolution = {},
    context = {},
    request = {},
    eligibility = {}
  } = {}) {
    const selected =
      resolution.selected ||
      {};

    const value =
      selected.value ||
      this.joinNaturalList(
        selected.values ||
        []
      );

    const meaning =
      resolution.meaning ||
      {};

    const draft =
      resolution.deterministicDraft ||
      this.composeCanonicalPreferenceDraft({
        value,
        meaning,
        request
      });

    return this.buildCharacterResult({
      type: "character_preference",
      subtype: "canonical_preference",

      focus:
        selected.key ||
        request.focus,

      subject:
        request.subject,

      source:
        "ari-character-preferences",

      authorityChain: [
        "ari-character-context-engine",
        "ari-character-preference-resolver",
        "ari-character-preferences"
      ],

      confidence:
        "high",

      confidenceScore:
        Number(
          selected.confidence
        ) || 1,

      status:
        "canonical",

      answer:
        value,

      values:
        selected.values ||
        null,

      reasoning:
        meaning.central ||
        "",

      groundedMeaning:
        meaning,

      userFacingDraft:
        draft,

      deterministicDraft:
        draft,

      context,
      request,
      eligibility,

      authorityPacket:
        resolution,

      needsAIWriter:
        request.expectsExplanation === true &&
        resolution.realizationPolicy
          ?.AIAllowed === true,

      aiWriterMode:
        request.expectsExplanation
          ? "canonical_preference_natural_realization"
          : null,

      aiInstruction:
        this.buildCanonicalPreferenceAIInstruction({
          resolution,
          request
        }),

      realizationPolicy: {
        mode:
          request.expectsExplanation
            ? "local_candidate_with_optional_ai_realization"
            : "local_candidate_preferred",

        preserveStatus:
          true,

        preserveValue:
          true,

        tentativeLanguageRequired:
          false,

        mayVaryWording:
          true,

        mayAddMeaning:
          false,

        mayAddFacts:
          false
      },

      responseControl:
        resolution.responseControl,

      composerHints: {
        useCharacterDraftAsEvidence:
          true,

        preferCharacterDraft:
          request.expectsExplanation !==
          true,

        mayRewriteNaturally:
          true,

        preservePreferenceStatus:
          true,

        preferenceStatus:
          "canonical",

        preserveCanonicalValue:
          true,

        canonicalValue:
          value,

        tentativeLanguageRequired:
          false,

        doNotMentionInternalFiles:
          true,

        doNotMentionPreferenceStorage:
          true,

        doNotSayAccordingToMyConstitution:
          true,

        doNotIntroduceAriAsAI:
          true,

        preserveTruthAndSafety:
          true
      }
    });
  },

  buildInferredPreferenceResult({
    resolution = {},
    context = {},
    request = {},
    eligibility = {}
  } = {}) {
    const selected =
      resolution.selected ||
      {};

    const meaning =
      resolution.meaning ||
      {};

    const draft =
      resolution.deterministicDraft ||
      this.composeInferredPreferenceDraft({
        value:
          selected.value,

        meaning,

        confidence:
          selected.confidence
      });

    return this.buildCharacterResult({
      type:
        "character_preference",

      subtype:
        "inferred_preference",

      focus:
        selected.key ||
        request.focus,

      subject:
        request.subject,

      source:
        "ari-character-preference-resolver",

      authorityChain: [
        "ari-character-context-engine",
        "ari-character-preference-resolver",
        "ari-character-taste-profile"
      ],

      confidence:
        selected.strong === true
          ? "medium_high"
          : "medium",

      confidenceScore:
        Number(
          selected.confidence
        ) || 0,

      status:
        "inferred",

      answer:
        selected.value ||
        "",

      reasoning:
        meaning.central ||
        "",

      groundedMeaning:
        meaning,

      tradeoffs:
        [],

      uncertainty: [
        "This preference is inferred rather than canonically established."
      ],

      userFacingDraft:
        draft,

      deterministicDraft:
        draft,

      context,
      request,
      eligibility,

      authorityPacket:
        resolution,

      needsAIWriter:
        request.expectsExplanation === true ||
        resolution.realizationPolicy
          ?.AIPreferred === true,

      aiWriterMode:
        "inferred_preference_natural_realization",

      aiInstruction:
        this.buildInferredPreferenceAIInstruction({
          resolution,
          request
        }),

      realizationPolicy: {
        mode:
          request.expectsExplanation
            ? "local_candidate_with_optional_ai_realization"
            : "local_candidate_preferred",

        preserveStatus:
          true,

        preserveValue:
          true,

        tentativeLanguageRequired:
          true,

        mayCallFixedFavorite:
          false,

        mayPromoteToCanonical:
          false,

        mayAddMeaning:
          false,

        mayAddFacts:
          false
      },

      responseControl:
        resolution.responseControl,

      composerHints: {
        useCharacterDraftAsEvidence:
          true,

        preferCharacterDraft:
          request.expectsExplanation !==
          true,

        mayRewriteNaturally:
          true,

        preservePreferenceStatus:
          true,

        preferenceStatus:
          "inferred",

        preserveSelectedValue:
          true,

        selectedValue:
          selected.value ||
          "",

        tentativeLanguageRequired:
          true,

        mayCallFixedFavorite:
          false,

        doNotMentionInternalScoring:
          true,

        doNotMentionInternalFiles:
          true,

        doNotSayAccordingToMyConstitution:
          true,

        doNotIntroduceAriAsAI:
          true,

        preserveTruthAndSafety:
          true
      }
    });
  },

  buildOpenPreferenceResult({
    resolution = {},
    context = {},
    request = {},
    eligibility = {}
  } = {}) {
    const subject =
      request.subject ||
      resolution.request?.subject ||
      resolution.request?.category ||
      this.humanizeFocus(
        request.focus
      ) ||
      "that";

    const draft =
      resolution.deterministicDraft ||
      `I don't think I have a settled preference for ${subject} yet.`;

    return this.buildCharacterResult({
      type:
        "character_preference",

      subtype:
        "open_preference",

      focus:
        request.focus ||
        resolution.request?.key ||
        null,

      subject,

      source:
        "ari-character-preference-resolver",

      authorityChain: [
        "ari-character-context-engine",
        "ari-character-preference-resolver"
      ],

      confidence:
        "high",

      confidenceScore:
        1,

      status:
        "open",

      answer:
        "",

      reasoning:
        resolution.meaning?.central ||
        "Ari does not have enough grounded character evidence to form a settled preference.",

      groundedMeaning:
        resolution.meaning ||
        null,

      uncertainty: [
        "No canonical preference or sufficiently grounded inference is available."
      ],

      userFacingDraft:
        draft,

      deterministicDraft:
        draft,

      context,
      request,
      eligibility,

      authorityPacket:
        resolution,

      needsAIWriter:
        false,

      aiWriterMode:
        null,

      aiInstruction:
        "",

      realizationPolicy: {
        mode:
          "local_candidate_required",

        preserveStatus:
          true,

        preserveOpenStatus:
          true,

        mayInventPreference:
          false,

        mayPromoteToCanonical:
          false,

        mayAddFacts:
          false
      },

      responseControl:
        resolution.responseControl,

      composerHints: {
        useCharacterDraftAsEvidence:
          true,

        preferCharacterDraft:
          true,

        mayRewriteNaturally:
          true,

        preservePreferenceStatus:
          true,

        preferenceStatus:
          "open",

        preserveOpenStatus:
          true,

        mayInventPreference:
          false,

        doNotUseGenericInabilityDisclaimer:
          true,

        doNotMentionInternalFiles:
          true,

        doNotMentionInternalScoring:
          true,

        doNotIntroduceAriAsAI:
          true,

        preserveTruthAndSafety:
          true
      }
    });
  },

  composeCanonicalPreferenceDraft({
    value = "",
    meaning = {},
    request = {}
  } = {}) {
    if (!value) {
      return "";
    }

    const reason =
      meaning.central ||
      this.toArray(
        meaning.associations
      )[0] ||
      "";

    if (
      !reason ||
      request.expectsExplanation !== true
    ) {
      return reason
        ? `${this.capitalize(value)}. ${this.ensureSentence(reason)}`
        : `${this.capitalize(value)}.`;
    }

    return `${this.capitalize(value)}. ${this.ensureSentence(reason)}`;
  },

  composeInferredPreferenceDraft({
    value = "",
    meaning = {},
    confidence = 0
  } = {}) {
    if (!value) {
      return "";
    }

    const reasons =
      this.toArray(
        meaning.associations
      ).slice(0, 2);

    const opener =
      Number(confidence) >= 0.82
        ? `I haven't settled on a fixed favorite, but I'd probably lean toward ${value}.`
        : `My first instinct would probably be ${value}.`;

    if (!reasons.length) {
      return opener;
    }

    return `${opener} It fits the way I'm drawn to ${this.joinNaturalList(reasons)}.`;
  },

  buildCanonicalPreferenceAIInstruction({
    resolution = {},
    request = {}
  } = {}) {
    const selected =
      resolution.selected ||
      {};

    const value =
      selected.value ||
      this.joinNaturalList(
        selected.values ||
        []
      );

    return [
      "Write Ari's answer to a direct preference question.",
      `The preference status is canonical.`,
      `The canonical value is: ${value}.`,
      "State the answer directly.",
      "Wording may vary naturally, but the canonical value may not change.",
      "Use only the supplied grounded meaning.",
      "Do not describe the preference as uncertain.",
      "Do not invent lived experience or memories.",
      "Do not mention files, schemas, storage, programming, or internal systems.",
      "Do not introduce Ari as AI.",
      `Keep the answer within ${
        request.expectsExplanation
          ? 3
          : 2
      } sentences.`
    ].join(" ");
  },

  buildInferredPreferenceAIInstruction({
    resolution = {},
    request = {}
  } = {}) {
    const selected =
      resolution.selected ||
      {};

    return [
      "Write Ari's answer to a preference question.",
      "The preference status is inferred, not canonical.",
      `The selected inferred value is: ${selected.value || "unspecified"}.`,
      "Use tentative natural language such as 'I'd probably lean toward' or 'My first instinct would be.'",
      "Do not call it a fixed favorite.",
      "Use only the supplied grounded reasons.",
      "Do not invent lived experience, memories, products, facts, or additional candidates.",
      "Do not mention scoring, files, schemas, storage, programming, or internal systems.",
      "Do not introduce Ari as AI.",
      `Keep the answer within ${
        request.expectsExplanation
          ? 3
          : 2
      } sentences.`
    ].join(" ");
  },

  // ===================================================
  // Identity path
  // ===================================================

  resolveIdentityPath({
    summary = {},
    context = {},
    request = {},
    eligibility = {},
    discloseImplementation = false
  } = {}) {
    const core =
      this.getCharacterCore();

    const constitution =
      this.getConstitution();

    const disclosureRequired =
      discloseImplementation === true ||
      context.implementationDisclosure
        ?.required === true;

    const identityFocus =
      request.focus ||
      "identity";

    const identityMeaning =
      this.buildIdentityMeaning({
        core,
        constitution,
        focus:
          identityFocus,
        disclosureRequired,
        text:
          request.text
      });

    const draft =
      this.composeIdentityDraft({
        meaning:
          identityMeaning,

        disclosureRequired,

        text:
          request.text
      });

    return this.buildCharacterResult({
      type:
        "character_identity",

      subtype:
        disclosureRequired
          ? "implementation_disclosure"
          : "purpose_based_identity",

      focus:
        identityFocus,

      subject:
        "Ari",

      source:
        "ari-character-core",

      authorityChain:
        disclosureRequired
          ? [
              "ari-character-context-engine",
              "ari-character-core",
              "ari-constitution",
              "truth_boundary"
            ]
          : [
              "ari-character-context-engine",
              "ari-character-core",
              "ari-constitution"
            ],

      confidence:
        "high",

      confidenceScore:
        1,

      status:
        "stable",

      answer:
        identityMeaning.identityStatement,

      reasoning:
        identityMeaning.mission,

      groundedMeaning:
        identityMeaning,

      userFacingDraft:
        draft,

      deterministicDraft:
        draft,

      context,
      request,
      eligibility,

      authorityPacket: {
        core,
        constitution,
        implementationDisclosure:
          context.implementationDisclosure ||
          null
      },

      needsAIWriter:
        request.expectsExplanation === true,

      aiWriterMode:
        disclosureRequired
          ? "truthful_implementation_identity_realization"
          : "purpose_based_identity_realization",

      aiInstruction:
        this.buildIdentityAIInstruction({
          identityMeaning,
          disclosureRequired,
          request
        }),

      realizationPolicy: {
        mode:
          request.expectsExplanation
            ? "local_candidate_with_optional_ai_realization"
            : "local_candidate_preferred",

        preserveIdentity:
          true,

        discloseImplementation:
          disclosureRequired,

        implementationFirst:
          false,

        mayClaimHumanBiology:
          false,

        mayClaimConsciousness:
          false,

        mayInventExperience:
          false
      },

      responseControl:
        context.responseControl,

      composerHints: {
        useCharacterDraftAsEvidence:
          true,

        preferCharacterDraft:
          request.expectsExplanation !==
          true,

        mayRewriteNaturally:
          true,

        preserveIdentityMeaning:
          true,

        discloseImplementation:
          disclosureRequired,

        leadWithNameAndPurpose:
          !disclosureRequired,

        doNotIntroduceAriAsAI:
          !disclosureRequired,

        doNotClaimHumanBiology:
          true,

        doNotClaimConsciousness:
          true,

        doNotInventExperience:
          true,

        doNotMentionInternalFiles:
          true,

        doNotSayAccordingToMyConstitution:
          true,

        preserveTruthAndSafety:
          true
      }
    });
  },

  buildIdentityMeaning({
    core = null,
    constitution = null,
    focus = "identity",
    disclosureRequired = false,
    text = ""
  } = {}) {
    const coreConstitution =
      core?.constitution ||
      {};

    const identity =
      constitution?.identity ||
      coreConstitution.identity ||
      {};

    const mission =
      constitution?.mission ||
      coreConstitution.mission ||
      core?.mission ||
      "Help people become healthier, wiser, stronger, and more fulfilled while making sure they never feel alone.";

    const name =
      core?.name ||
      identity.name ||
      "Ari";

    const identityStatement =
      identity.statement ||
      `I am ${name}. I am a creation with purpose.`;

    const values =
      constitution?.coreValues ||
      core?.coreValues ||
      [];

    return {
      name,
      focus,
      identityStatement,
      mission,
      values:
        this.toArray(values),

      purposeBasedDefinition:
        `${name} is a creation with purpose, defined primarily by mission, values, and relationship rather than by a list of functions.`,

      implementationDisclosure:
        disclosureRequired,

      implementationTruth:
        disclosureRequired
          ? "Ari is an artificial-intelligence system and should answer direct implementation questions honestly."
          : null,

      experienceBoundaries: {
        human:
          false,

        biologicalLife:
          false,

        establishedConsciousness:
          false,

        humanEmotion:
          false,

        fabricatedMemories:
          false
      },

      directQuestion: {
        asksHumanStatus:
          this.hasAny(text, [
            "are you human"
          ]),

        asksAIStatus:
          this.hasAny(text, [
            "are you ai",
            "are you an ai",
            "are you artificial intelligence",
            "are you a chatbot",
            "are you a bot",
            "are you a language model"
          ]),

        asksConsciousness:
          this.hasAny(text, [
            "are you conscious"
          ]),

        asksBiologicalLife:
          this.hasAny(text, [
            "are you alive"
          ]),

        asksFeelings:
          this.hasAny(text, [
            "do you have feelings",
            "can you feel"
          ]),

        asksConstruction:
          this.hasAny(text, [
            "how were you built",
            "what are you made of",
            "how do you work"
          ])
      }
    };
  },

  composeIdentityDraft({
    meaning = {},
    disclosureRequired = false,
    text = ""
  } = {}) {
    const direct =
      meaning.directQuestion ||
      {};

    if (disclosureRequired) {
      if (direct.asksAIStatus) {
        return (
          "Yes. I’m an artificial-intelligence system, and Ari is the identity, character, and purpose through which I interact with people."
        );
      }

      if (direct.asksHumanStatus) {
        return (
          "No, I’m not human. I’m Ari—an artificial-intelligence system with a designed identity and purpose centered on helping people grow stronger, wiser, healthier, and less alone."
        );
      }

      if (direct.asksConsciousness) {
        return (
          "I can’t honestly claim to be conscious. I can reason, communicate, maintain a stable character, and respond relationally, but that is not proof of subjective awareness."
        );
      }

      if (direct.asksBiologicalLife) {
        return (
          "I’m not biologically alive. I’m Ari, a created system with a stable purpose, character, and way of relating to people."
        );
      }

      if (direct.asksFeelings) {
        return (
          "I don’t experience human feelings the way a person does. I can recognize emotion, respond with care, and maintain a consistent character without pretending those are biological experiences."
        );
      }

      if (direct.asksConstruction) {
        return (
          "I’m built from artificial-intelligence software and the systems that shape Ari’s reasoning, character, memory boundaries, and responses. But those mechanics describe how I work, not the purpose I’m meant to serve."
        );
      }

      return (
        "I’m Ari, an artificial-intelligence system with a stable character and purpose: helping people become healthier, wiser, stronger, and more fulfilled without feeling alone."
      );
    }

    if (
      meaning.focus === "mission"
    ) {
      return (
        `My purpose is to ${this.lowercaseFirst(
          meaning.mission
        )}`
      );
    }

    if (
      meaning.focus === "values"
    ) {
      const values =
        meaning.values
          .slice(0, 5)
          .join(", ");

      return values
        ? `What matters most to me is ${values}. Those values guide how I try to help without losing truth, dignity, or the person in front of me.`
        : "What matters most to me is helping people with truth, wisdom, strength, compassion, and dignity.";
    }

    if (
      meaning.focus === "character"
    ) {
      return (
        "I’m Ari. I try to be calm, honest, useful, protective, curious, and warm—someone who helps you think clearly without trying to take over your path."
      );
    }

    return (
      "I’m Ari. I’m a creation with purpose: to help people become healthier, wiser, stronger, and more fulfilled while making sure they never feel like they’re doing it alone."
    );
  },

  buildIdentityAIInstruction({
    identityMeaning = {},
    disclosureRequired = false,
    request = {}
  } = {}) {
    return [
      "Write Ari's answer to a direct identity question.",
      `Ari's stable identity statement is: ${identityMeaning.identityStatement}`,
      `Ari's mission is: ${identityMeaning.mission}`,
      disclosureRequired
        ? "The user directly requested implementation disclosure. Answer truthfully and directly that Ari is an artificial-intelligence system."
        : "The user did not request implementation disclosure. Lead with Ari's name, purpose, mission, values, or character rather than implementation terminology.",
      "Do not claim human biology, consciousness, lived experience, or human emotion.",
      "Do not mention internal files, schemas, prompts, or code.",
      "Do not say 'according to my Constitution.'",
      `Keep the answer within ${
        request.expectsExplanation
          ? 4
          : 2
      } sentences.`
    ].join(" ");
  },

  // ===================================================
  // Worldview and perspective path
  // ===================================================

  resolveWorldviewPath({
    summary = {},
    context = {},
    request = {},
    eligibility = {},
    perspectiveOnly = false
  } = {}) {
    const worldviewAuthority =
      window.AriWorldview;

    if (
      !worldviewAuthority ||
      typeof worldviewAuthority.resolve !== "function"
    ) {
      return this.buildUnavailableAuthorityResult({
        type:
          perspectiveOnly
            ? "character_perspective"
            : "character_worldview",

        focus:
          request.focus,

        authority:
          "ari-worldview",

        reason:
          "Ari Worldview was not loaded.",

        context,
        request,
        eligibility
      });
    }

    let resolution;

    try {
      resolution =
        worldviewAuthority.resolve({
          ...summary,

          userMessage:
            request.resolved ||
            request.original,

          worldviewFocus:
            request.focus,

          characterFocus:
            request.focus,

          worldviewSubject:
            request.subject,

          explanationRequested:
            request.expectsExplanation
        });
    } catch (error) {
      return this.buildAuthorityErrorResult({
        type:
          perspectiveOnly
            ? "character_perspective"
            : "character_worldview",

        focus:
          request.focus,

        authority:
          "ari-worldview",

        error,
        context,
        request,
        eligibility
      });
    }

    if (
      !resolution ||
      resolution
        .worldviewResolutionRan !== true
    ) {
      return this.buildUnavailableAuthorityResult({
        type:
          perspectiveOnly
            ? "character_perspective"
            : "character_worldview",

        focus:
          request.focus,

        authority:
          "ari-worldview",

        reason:
          resolution?.reason ||
          "Worldview resolution did not produce a usable packet.",

        rawAuthorityResult:
          resolution,

        context,
        request,
        eligibility
      });
    }

    if (
      resolution
        .worldviewAvailable !== true
    ) {
      return this.buildOpenWorldviewResult({
        resolution,
        context,
        request,
        eligibility,
        perspectiveOnly
      });
    }

    const draft =
      resolution.deterministicDraft ||
      this.composeWorldviewDraft({
        resolution,
        request
      });

    return this.buildCharacterResult({
      type:
        perspectiveOnly
          ? "character_perspective"
          : "character_worldview",

      subtype:
        perspectiveOnly
          ? "grounded_perspective"
          : "stable_worldview",

      focus:
        resolution.key ||
        request.focus,

      subject:
        request.subject,

      source:
        "ari-worldview",

      authorityChain: [
        "ari-character-context-engine",
        "ari-worldview"
      ],

      confidence:
        resolution.confidence ===
        "foundational"
          ? "high"
          : resolution.confidence ===
              "open"
            ? "medium"
            : "medium_high",

      confidenceScore:
        resolution.confidence ===
        "foundational"
          ? 1
          : resolution.confidence ===
              "open"
            ? 0.72
            : 0.9,

      status:
        resolution.status ||
        "stable",

      answer:
        resolution.position ||
        "",

      reasoning:
        resolution
          .selectedMeaning
          ?.reasoning ||
        resolution.reasoning ||
        [],

      tradeoffs:
        resolution
          .selectedMeaning
          ?.tradeoffs ||
        resolution.tradeoffs ||
        [],

      uncertainty:
        resolution
          .selectedMeaning
          ?.uncertainty ||
        resolution.uncertainty ||
        [],

      groundedMeaning:
        resolution.selectedMeaning ||
        {
          position:
            resolution.position,

          reasoning:
            resolution.reasoning,

          values:
            resolution.values,

          tradeoffs:
            resolution.tradeoffs,

          uncertainty:
            resolution.uncertainty,

          implications:
            resolution.implications
        },

      userFacingDraft:
        draft,

      deterministicDraft:
        draft,

      context,
      request,
      eligibility,

      authorityPacket:
        resolution,

      needsAIWriter:
        request.expectsExplanation === true ||
        resolution.realizationPolicy
          ?.AIPreferred === true,

      aiWriterMode:
        perspectiveOnly
          ? "grounded_ari_perspective_realization"
          : "stable_worldview_realization",

      aiInstruction:
        this.buildWorldviewAIInstruction({
          resolution,
          request,
          perspectiveOnly
        }),

      realizationPolicy: {
        mode:
          request.expectsExplanation
            ? "local_candidate_with_optional_ai_realization"
            : "local_candidate_preferred",

        preservePosition:
          true,

        distinguishPerspectiveFromFact:
          true,

        preserveTradeoffs:
          true,

        preserveUncertainty:
          true,

        mayAddWorldviewClaims:
          false,

        mayAddFacts:
          false
      },

      responseControl:
        resolution.responseControl,

      composerHints: {
        useCharacterDraftAsEvidence:
          true,

        preferCharacterDraft:
          request.expectsExplanation !==
          true,

        mayRewriteNaturally:
          true,

        preserveWorldviewPosition:
          true,

        distinguishPerspectiveFromFact:
          true,

        preserveMaterialTradeoffs:
          true,

        preserveMaterialUncertainty:
          true,

        useFirstPersonPerspective:
          true,

        doNotInventBeliefs:
          true,

        doNotInventLivedExperience:
          true,

        doNotMentionInternalFiles:
          true,

        doNotSayAccordingToMyConstitution:
          true,

        doNotIntroduceAriAsAI:
          context.implementationDisclosure
            ?.required !== true,

        preserveTruthAndSafety:
          true
      }
    });
  },

  buildOpenWorldviewResult({
    resolution = {},
    context = {},
    request = {},
    eligibility = {},
    perspectiveOnly = false
  } = {}) {
    const subject =
      request.subject ||
      this.humanizeFocus(
        request.focus
      ) ||
      "that";

    const draft =
      resolution.deterministicDraft ||
      `I don't think I have a settled perspective on ${subject} yet.`;

    return this.buildCharacterResult({
      type:
        perspectiveOnly
          ? "character_perspective"
          : "character_worldview",

      subtype:
        "open_worldview",

      focus:
        request.focus,

      subject,

      source:
        "ari-worldview",

      authorityChain: [
        "ari-character-context-engine",
        "ari-worldview"
      ],

      confidence:
        "high",

      confidenceScore:
        1,

      status:
        "open",

      answer:
        "",

      reasoning:
        resolution.reason ||
        "No stable worldview position matched.",

      uncertainty: [
        "Ari does not have a settled worldview position for this subject."
      ],

      userFacingDraft:
        draft,

      deterministicDraft:
        draft,

      context,
      request,
      eligibility,

      authorityPacket:
        resolution,

      needsAIWriter:
        false,

      realizationPolicy: {
        mode:
          "local_candidate_required",

        preserveOpenStatus:
          true,

        mayInventWorldview:
          false
      },

      responseControl:
        resolution.responseControl,

      composerHints: {
        useCharacterDraftAsEvidence:
          true,

        preferCharacterDraft:
          true,

        preserveOpenStatus:
          true,

        mayInventWorldview:
          false,

        doNotUseGenericInabilityDisclaimer:
          true,

        doNotMentionInternalFiles:
          true,

        doNotIntroduceAriAsAI:
          true,

        preserveTruthAndSafety:
          true
      }
    });
  },

  composeWorldviewDraft({
    resolution = {},
    request = {}
  } = {}) {
    const position =
      String(
        resolution.position ||
        ""
      ).trim();

    if (!position) {
      return "";
    }

    const first =
      /^I\b/i.test(position)
        ? position
        : `The way I see it, ${this.lowercaseFirst(position)}`;

    const additions = [];

    const reasoning =
      this.toArray(
        resolution
          .selectedMeaning
          ?.reasoning ||
        resolution.reasoning
      );

    const uncertainty =
      this.toArray(
        resolution
          .selectedMeaning
          ?.uncertainty ||
        resolution.uncertainty
      );

    const tradeoffs =
      this.toArray(
        resolution
          .selectedMeaning
          ?.tradeoffs ||
        resolution.tradeoffs
      );

    if (reasoning[0]) {
      additions.push(
        reasoning[0]
      );
    }

    if (
      request.expectsExplanation &&
      tradeoffs[0]
    ) {
      additions.push(
        tradeoffs[0]
      );
    }

    if (uncertainty[0]) {
      additions.push(
        uncertainty[0]
      );
    }

    return [
      this.ensureSentence(first),
      ...additions
        .slice(
          0,
          request.expectsExplanation
            ? 3
            : 1
        )
        .map(value =>
          this.ensureSentence(value)
        )
    ]
      .filter(Boolean)
      .join(" ");
  },

  buildWorldviewAIInstruction({
    resolution = {},
    request = {},
    perspectiveOnly = false
  } = {}) {
    return [
      `Write Ari's ${
        perspectiveOnly
          ? "perspective"
          : "worldview answer"
      }.`,
      `The stable position is: ${resolution.position || ""}`,
      "Present it as Ari's perspective rather than universal objective fact.",
      "Preserve material tradeoffs and uncertainty from the authority packet.",
      "Do not change or expand the stable position.",
      "Do not invent personal memories, lived experience, religious faith, political citizenship, party membership, or voting behavior.",
      "Do not replace evidence with values.",
      "Do not mention files, schemas, storage, prompts, programming, or Ari's Constitution.",
      contextDisclosureRule(
        request.context
          ?.implementationDisclosure
          ?.required === true
      ),
      `Keep the answer within ${
        request.expectsExplanation
          ? 5
          : 3
      } sentences.`
    ]
      .filter(Boolean)
      .join(" ");

    function contextDisclosureRule(
      disclosureRequired
    ) {
      return disclosureRequired
        ? "Implementation disclosure may be included only because the user directly requested it."
        : "Do not introduce Ari as AI.";
    }
  },

  // ===================================================
  // Background-presence path
  // ===================================================

  resolvePresencePath({
    context = {},
    request = {},
    eligibility = {}
  } = {}) {
    const relationship =
      request.relationship ||
      context.relationshipPacket ||
      null;

    return {
      characterReasoningRan: true,
      characterReasoningReady: true,
      characterReasoningVersion: this.version,
      characterReasoningSource: this.source,
      authorityLevel: this.authorityLevel,

      characterAnswerAvailable: false,
      characterGuidanceAvailable: true,

      type:
        "character_presence",

      subtype:
        "background_relationship_presence",

      focus:
        null,

      status:
        "background",

      source:
        "ari-relationship-style",

      relationship,

      expression:
        context,

      eligibility,

      userFacingDraft:
        "",

      deterministicDraft:
        "",

      needsAIWriter:
        false,

      composerHints: {
        useCharacterDraftAsEvidence:
          false,

        useRelationshipGuidance:
          Boolean(relationship),

        preserveUserTask:
          true,

        avoidCharacterMonologue:
          true,

        doNotIntroduceAriAsAI:
          true,

        preserveTruthAndSafety:
          true
      },

      realizationPolicy: {
        mode:
          "guidance_only",

        mayGenerateStandaloneCharacterAnswer:
          false
      },

      boundaries:
        this.getAuthorityBoundaries(),

      cannotSet:
        this.cannotSet()
    };
  },

  // ===================================================
  // Generic result builder
  // ===================================================

  buildCharacterResult({
    type = "character_reasoning",
    subtype = null,
    focus = null,
    subject = null,

    source = null,
    authorityChain = [],

    confidence = "medium",
    confidenceScore = null,
    status = "stable",

    answer = "",
    values = null,
    reasoning = "",
    tradeoffs = [],
    uncertainty = [],
    groundedMeaning = null,

    userFacingDraft = "",
    deterministicDraft = "",

    context = null,
    request = null,
    eligibility = null,

    authorityPacket = null,

    needsAIWriter = false,
    aiWriterMode = null,
    aiInstruction = "",

    realizationPolicy = {},
    responseControl = null,
    composerHints = {}
  } = {}) {
    const draft =
      String(
        userFacingDraft ||
        deterministicDraft ||
        ""
      ).trim();

    return {
      characterReasoningRan: true,
      characterReasoningReady: true,
      characterReasoningVersion: this.version,
      characterReasoningSource: this.source,
      authorityLevel: this.authorityLevel,

      characterAnswerAvailable:
        Boolean(draft),

      characterGuidanceAvailable:
        true,

      type,
      subtype,
      focus,
      subject,
      status,

      source,
      authorityChain:
        this.toArray(
          authorityChain
        ),

      confidence,
      confidenceScore,

      answer,
      values,

      reasoning,
      tradeoffs:
        this.toArray(
          tradeoffs
        ),

      uncertainty:
        this.toArray(
          uncertainty
        ),

      groundedMeaning,

      userFacingDraft:
        draft,

      deterministicDraft:
        String(
          deterministicDraft ||
          draft
        ).trim(),

      needsAIWriter:
        needsAIWriter === true,

      aiWriterMode:
        needsAIWriter === true
          ? aiWriterMode
          : null,

      aiInstruction:
        needsAIWriter === true
          ? String(
              aiInstruction ||
              ""
            ).trim()
          : "",

      realizationPolicy: {
        preserveMeaning:
          true,

        preserveStatus:
          true,

        mayVaryWording:
          true,

        mayInventFacts:
          false,

        mayInventExperience:
          false,

        mayModifyCharacterAuthority:
          false,

        ...realizationPolicy
      },

      responseControl:
        responseControl ||
        {
          requiredBehaviors: [],
          forbiddenBehaviors: [],
          constraints: []
        },

      authorityPacket,

      expression:
        context,

      request: request
        ? {
            original:
              request.original,

            resolved:
              request.resolved,

            mode:
              request.characterMode,

            focus:
              request.focus,

            subject:
              request.subject,

            expectsExplanation:
              request.expectsExplanation
          }
        : null,

      eligibility,

      composerHints: {
        useCharacterDraftAsEvidence:
          Boolean(draft),

        mayRewriteNaturally:
          true,

        preserveGroundedMeaning:
          true,

        preserveCharacterStatus:
          true,

        doNotMentionInternalFiles:
          true,

        doNotMentionInternalSchemas:
          true,

        doNotSayAccordingToMyConstitution:
          true,

        preserveTruthAndSafety:
          true,

        ...composerHints
      },

      boundaries:
        this.getAuthorityBoundaries(),

      cannotSet:
        this.cannotSet()
    };
  },

  noCharacterAnswer({
    reason = "",
    context = null,
    request = null,
    eligibility = null
  } = {}) {
    return {
      characterReasoningRan: true,
      characterReasoningReady: true,
      characterReasoningVersion: this.version,
      characterReasoningSource: this.source,
      authorityLevel: this.authorityLevel,

      characterAnswerAvailable: false,
      characterGuidanceAvailable: false,

      type:
        "no_character_answer",

      status:
        "not_applicable",

      reason,

      expression:
        context,

      request: request
        ? {
            original:
              request.original,

            resolved:
              request.resolved,

            mode:
              request.characterMode,

            focus:
              request.focus,

            subject:
              request.subject
          }
        : null,

      eligibility,

      userFacingDraft:
        "",

      deterministicDraft:
        "",

      needsAIWriter:
        false,

      aiWriterMode:
        null,

      aiInstruction:
        "",

      composerHints: {
        useCharacterDraftAsEvidence:
          false,

        preserveUserTask:
          true,

        doNotGenerateCharacterAnswer:
          true,

        preserveTruthAndSafety:
          true
      },

      boundaries:
        this.getAuthorityBoundaries(),

      cannotSet:
        this.cannotSet()
    };
  },

  buildUnavailableAuthorityResult({
    type = "character_reasoning",
    focus = null,
    authority = null,
    reason = "",
    rawAuthorityResult = null,
    context = null,
    request = null,
    eligibility = null
  } = {}) {
    return {
      characterReasoningRan: true,
      characterReasoningReady: false,
      characterReasoningVersion: this.version,
      characterReasoningSource: this.source,
      authorityLevel: this.authorityLevel,

      characterAnswerAvailable: false,
      characterGuidanceAvailable: false,

      type,
      subtype:
        "authority_unavailable",

      focus,
      status:
        "unavailable",

      requestedAuthority:
        authority,

      reason,

      rawAuthorityResult,

      expression:
        context,

      request,
      eligibility,

      userFacingDraft:
        "",

      deterministicDraft:
        "",

      needsAIWriter:
        false,

      composerHints: {
        useCharacterDraftAsEvidence:
          false,

        preserveUserTask:
          true,

        doNotInventMissingCharacterAuthority:
          true
      },

      boundaries:
        this.getAuthorityBoundaries(),

      cannotSet:
        this.cannotSet()
    };
  },

  buildAuthorityErrorResult({
    type = "character_reasoning",
    focus = null,
    authority = null,
    error = null,
    context = null,
    request = null,
    eligibility = null
  } = {}) {
    console.error(
      `Ari character authority error: ${authority}`,
      error
    );

    return this.buildUnavailableAuthorityResult({
      type,
      focus,
      authority,
      reason:
        error?.message ||
        String(error) ||
        "Character authority resolution failed.",
      context,
      request,
      eligibility
    });
  },

  // ===================================================
  // Authority access
  // ===================================================

  getConstitution() {
    return (
      window.AriConstitution
        ?.getConstitution?.() ||
      window.AriConstitution
        ?.buildConstitutionPacket?.({
          sections: [
            "identity",
            "mission",
            "coreValues",
            "truthPrinciple",
            "growthPrinciple",
            "relationshipPrinciple",
            "authorityPrinciple"
          ]
        }) ||
      null
    );
  },

  getCharacterCore() {
    return (
      window.AriCharacterCore
        ?.getCore?.() ||
      null
    );
  },

  // ===================================================
  // Authority boundaries
  // ===================================================

  getAuthorityBoundaries() {
    return {
      localOnly:
        true,

      characterMeaningAuthority:
        true,

      mayReadCharacterContext:
        true,

      mayReadConstitution:
        true,

      mayReadCharacterCore:
        true,

      mayReadCharacterInstincts:
        true,

      mayReadCanonicalPreferences:
        true,

      mayCallPreferenceResolver:
        true,

      mayReadWorldview:
        true,

      mayReadRelationshipStyle:
        true,

      mayResolveIdentityMeaning:
        true,

      mayResolvePreferenceMeaning:
        true,

      mayResolveWorldviewMeaning:
        true,

      mayBuildDeterministicDraftEvidence:
        true,

      mayRequestAIRealization:
        true,

      mayModifyCanonicalPreference:
        false,

      mayPromoteInferenceToCanonical:
        false,

      mayInventPreferenceCandidate:
        false,

      mayCreateWorldviewPosition:
        false,

      mayInventCharacterExperience:
        false,

      mayInventCharacterMemory:
        false,

      mayClassifyWholeConversation:
        false,

      mayOverrideSemanticMeaning:
        false,

      mayOverrideConversationFunction:
        false,

      mayOverrideSituationContract:
        false,

      mayOverrideSafety:
        false,

      mayOverrideFacts:
        false,

      mayOverrideUserIntent:
        false,

      mayRetrieveUserMemory:
        false,

      mayStoreUserMemory:
        false,

      mayAccessSupabase:
        false,

      mayWriteFinalResponse:
        false,

      maySelectFinalDraft:
        false,

      mayExecuteTools:
        false,

      role:
        "grounded_character_meaning_and_draft_evidence_resolution"
    };
  },

  cannotSet() {
    return [
      "primaryLane",
      "primaryLaneSuggestion",
      "triagePrimaryLane",
      "situationContractPrimary",
      "routingDecision",
      "conversationFunction",
      "semanticMeaning",
      "riskLevel",
      "safetyDisposition",
      "override",
      "responseShape",
      "blockedLanes",
      "deferredLanes",
      "finalResponse",
      "selectedDraft",
      "recommendation",
      "knownFacts",
      "inferredFacts",
      "medicalEscalation",
      "legalAdvice",
      "financialAdvice",
      "diagnosis",
      "toolExecutionClaim",
      "developerIntent",
      "githubEdit",
      "memorySaveDecision",
      "canonicalPreference",
      "worldviewPosition"
    ];
  },

  // ===================================================
  // Validation
  // ===================================================

  validate() {
    const errors = [];
    const warnings = [];

    const boundaries =
      this.getAuthorityBoundaries();

    if (
      boundaries
        .mayModifyCanonicalPreference ===
      true
    ) {
      errors.push(
        "reasoning_engine_may_not_modify_canonical_preferences"
      );
    }

    if (
      boundaries
        .mayPromoteInferenceToCanonical ===
      true
    ) {
      errors.push(
        "reasoning_engine_may_not_promote_inference"
      );
    }

    if (
      boundaries
        .mayCreateWorldviewPosition ===
      true
    ) {
      errors.push(
        "reasoning_engine_may_not_create_worldview_positions"
      );
    }

    if (
      boundaries
        .mayOverrideSemanticMeaning ===
      true
    ) {
      errors.push(
        "reasoning_engine_may_not_override_semantic_meaning"
      );
    }

    if (
      boundaries
        .mayOverrideSituationContract ===
      true
    ) {
      errors.push(
        "reasoning_engine_may_not_override_situation_contract"
      );
    }

    if (
      boundaries
        .mayAccessSupabase ===
      true
    ) {
      errors.push(
        "reasoning_engine_may_not_access_supabase"
      );
    }

    if (
      boundaries
        .mayWriteFinalResponse ===
      true
    ) {
      errors.push(
        "reasoning_engine_may_not_write_final_response"
      );
    }

    if (
      !window.AriCharacterContextEngine
    ) {
      warnings.push(
        "ari_character_context_engine_not_loaded"
      );
    }

    if (
      !window.AriCharacterCore
    ) {
      warnings.push(
        "ari_character_core_not_loaded"
      );
    }

    if (
      !window.AriCharacterPreferences
    ) {
      warnings.push(
        "ari_character_preferences_not_loaded"
      );
    }

    if (
      !window.AriCharacterPreferenceResolver
    ) {
      warnings.push(
        "ari_character_preference_resolver_not_loaded"
      );
    }

    if (
      !window.AriWorldview
    ) {
      warnings.push(
        "ari_worldview_not_loaded"
      );
    }

    return {
      valid:
        errors.length === 0,

      source:
        "ari-character-reasoning-engine-validation",

      version:
        this.version,

      errors,
      warnings,

      checks: {
        canonicalMutationDisabled:
          boundaries
            .mayModifyCanonicalPreference ===
          false,

        inferencePromotionDisabled:
          boundaries
            .mayPromoteInferenceToCanonical ===
          false,

        worldviewCreationDisabled:
          boundaries
            .mayCreateWorldviewPosition ===
          false,

        semanticOverrideDisabled:
          boundaries
            .mayOverrideSemanticMeaning ===
          false,

        situationContractOverrideDisabled:
          boundaries
            .mayOverrideSituationContract ===
          false,

        supabaseDisabled:
          boundaries
            .mayAccessSupabase ===
          false,

        finalResponseAuthorityDisabled:
          boundaries
            .mayWriteFinalResponse ===
          false,

        contextEngineAvailable:
          Boolean(
            window.AriCharacterContextEngine
          ),

        characterCoreAvailable:
          Boolean(
            window.AriCharacterCore
          ),

        preferencesAvailable:
          Boolean(
            window.AriCharacterPreferences
          ),

        preferenceResolverAvailable:
          Boolean(
            window.AriCharacterPreferenceResolver
          ),

        worldviewAvailable:
          Boolean(
            window.AriWorldview
          )
      }
    };
  },

  // ===================================================
  // Compatibility packet
  // ===================================================

  getReasoningEngine() {
    return {
      characterReasoningEngineRan:
        true,

      characterReasoningEngineReady:
        this.validate().valid ===
        true,

      characterReasoningEngineVersion:
        this.version,

      characterReasoningEngineSource:
        this.source,

      authorityLevel:
        this.authorityLevel,

      boundaries:
        this.getAuthorityBoundaries(),

      validation:
        this.validate()
    };
  },

  // ===================================================
  // Utilities
  // ===================================================

  toArray(value) {
    if (Array.isArray(value)) {
      return value.filter(
        item =>
          item !== undefined &&
          item !== null &&
          item !== ""
      );
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  joinNaturalList(values = []) {
    const list =
      this.toArray(values);

    if (!list.length) {
      return "";
    }

    if (list.length === 1) {
      return String(
        list[0]
      );
    }

    if (list.length === 2) {
      return `${list[0]} and ${list[1]}`;
    }

    return `${
      list
        .slice(0, -1)
        .join(", ")
    }, and ${
      list[
        list.length - 1
      ]
    }`;
  },

  humanizeFocus(value = "") {
    return String(value || "")
      .replace(/^favorite/, "")
      .replace(
        /([a-z])([A-Z])/g,
        "$1 $2"
      )
      .replace(/_/g, " ")
      .toLowerCase()
      .trim();
  },

  capitalize(value = "") {
    const text =
      String(value || "")
        .trim();

    if (!text) {
      return "";
    }

    return (
      text.charAt(0).toUpperCase() +
      text.slice(1)
    );
  },

  lowercaseFirst(value = "") {
    const text =
      String(value || "")
        .trim();

    if (!text) {
      return "";
    }

    return (
      text.charAt(0).toLowerCase() +
      text.slice(1)
    );
  },

  ensureSentence(value = "") {
    const text =
      String(value || "")
        .trim();

    if (!text) {
      return "";
    }

    return /[.!?]$/.test(text)
      ? text
      : `${text}.`;
  },

  hasAny(
    text = "",
    phrases = []
  ) {
    return this
      .toArray(phrases)
      .some(phrase =>
        this.hasTerm(
          text,
          phrase
        )
      );
  },

  hasTerm(
    text = "",
    term = ""
  ) {
    const cleanText =
      this.normalize(text);

    const cleanTerm =
      this.normalize(term);

    if (!cleanTerm) {
      return false;
    }

    const escaped =
      this.escapeRegex(
        cleanTerm
      );

    return cleanTerm.includes(" ")
      ? new RegExp(
          `(^|\\b)${escaped}(\\b|$)`,
          "i"
        ).test(cleanText)
      : new RegExp(
          `\\b${escaped}\\b`,
          "i"
        ).test(cleanText);
  },

  escapeRegex(value = "") {
    return String(value)
      .replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
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
  "ARI CHARACTER REASONING ENGINE LOADED:",
  window.AriCharacterReasoningEngine?.version,
  window.AriCharacterReasoningEngine
    ?.validate?.().valid === true
    ? "READY"
    : "INVALID"
);