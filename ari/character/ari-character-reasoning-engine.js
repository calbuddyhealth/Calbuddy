// ari/character/ari-character-reasoning-engine.js
// Ari Character Reasoning Engine
//
// Purpose:
// Resolve one focused Character request through authorized local Character
// authorities and return one grounded Character Reasoning result.
//
// V3.0.0 — Explicit Grounding / Focused Meaning Authority / Stable Contract
//
// Architectural flow:
//
// Character Context
//      ↓
// Character Reasoning Engine
//      ↓
// Focused Character Reasoning
//      ↓
// Character Expression Engine
//
// Responsibilities:
// - Respect Character Context as the authority on Character relevance.
// - Resolve one focused identity, implementation, preference, worldview,
//   perspective, or relationship-presence request.
// - Read only the local Character authorities required for that request.
// - Preserve canonical, inferred, stable, open, and unavailable status.
// - Explicitly declare whether the resolved answer is grounded.
// - Produce deterministic user-facing draft evidence.
// - Produce an authorized Character realization policy.
// - Produce Character-specific response controls.
// - Return one stable focused Character Reasoning contract.
//
// Non-responsibilities:
// - Does not classify the conversation.
// - Does not reinterpret semantic meaning.
// - Does not choose the Conversation Function.
// - Does not choose the Situation Contract.
// - Does not determine safety severity.
// - Does not retrieve or store user memory.
// - Does not access Supabase.
// - Does not modify canonical Character authorities.
// - Does not invent preferences.
// - Does not invent identity.
// - Does not create worldview positions.
// - Does not promote inferred material to canonical status.
// - Does not create a Composer Packet.
// - Does not create response candidates.
// - Does not choose Blueprint Writer eligibility.
// - Does not activate the AI Writer.
// - Does not select the final draft.
// - Does not write the final response.
// - Does not execute tools.
// - Does not persist runtime state.

window.Ari = window.Ari || {};

window.AriCharacterReasoningEngine = {
  version: "3.0.0",
  schemaVersion: "3.0.0",
  source: "ari-character-reasoning-engine",
  authorityLevel: "focused_character_meaning_authority",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  reason(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const context =
      this.readCharacterContext(
        summary
      );

    const request =
      this.buildRequest({
        summary,
        context
      });

    const eligibility =
      this.resolveEligibility({
        summary,
        context,
        request
      });

    if (
      eligibility.allowed !==
      true
    ) {
      return this.buildNoAnswerResult({
        request,
        context,
        eligibility,
        reason:
          eligibility.reason
      });
    }

    switch (
      request.mode
    ) {
      case "canonical_preference_answer":
      case "stable_preference_answer":
      case "stable_or_inferred_preference_answer":
        return this.resolvePreference({
          summary,
          context,
          request,
          eligibility
        });

      case "ari_self_disclosure":
        return this.resolveIdentity({
          summary,
          context,
          request,
          eligibility,
          implementationDisclosure:
            false
        });

      case "ari_implementation_disclosure":
        return this.resolveIdentity({
          summary,
          context,
          request,
          eligibility,
          implementationDisclosure:
            true
        });

      case "worldview_answer":
        return this.resolveWorldview({
          summary,
          context,
          request,
          eligibility,
          perspectiveOnly:
            false
        });

      case "ari_perspective":
        return this.resolveWorldview({
          summary,
          context,
          request,
          eligibility,
          perspectiveOnly:
            true
        });

      case "background_presence":
      case "warm_grounded_presence":
        return this.resolvePresence({
          context,
          request,
          eligibility
        });

      default:
        return this.buildNoAnswerResult({
          request,
          context,
          eligibility,
          reason:
            `Character reasoning is not authorized for mode: ${request.mode}.`
        });
    }
  },

  create(input = {}) {
    return this.reason(
      input
    );
  },

  build(input = {}) {
    return this.reason(
      input
    );
  },

  /* =====================================================
     CHARACTER CONTEXT
  ===================================================== */

  readCharacterContext(
    summary = {}
  ) {
    const raw =
      summary.characterContext ||
      summary.characterContextEngine ||
      summary.characterContextPacket ||
      {};

    return {
      ready:
        raw.ready ===
          true ||
        raw.characterContextEngineReady ===
          true,

      ran:
        raw.ran ===
          true ||
        raw.characterContextEngineRan ===
          true,

      source:
        raw.source ||
        raw.characterContextEngineSource ||
        "unknown",

      useAllowed:
        raw.useAllowed ===
          true ||
        raw.characterUseAllowed ===
          true,

      mode:
        raw.mode ||
        raw.characterMode ||
        summary.characterMode ||
        "silent",

      visibility:
        raw.visibility ||
        raw.characterVisibility ||
        "background",

      focus:
        raw.focus ||
        raw.characterFocus ||
        summary.characterFocus ||
        null,

      subject:
        raw.subject ||
        raw.characterSubject ||
        summary.preferenceSubject ||
        null,

      preferredSource:
        raw.preferredSource ||
        raw.preferredCharacterSource ||
        null,

      reason:
        raw.reason ||
        raw.characterReason ||
        null,

      budget:
        this.normalizeBudget(
          raw.budget ||
          raw.characterBudget
        ),

      hints:
        raw.hints ||
        raw.characterHints ||
        {},

      authorityRequest:
        raw.authorityRequest ||
        {},

      implementationDisclosure:
        this.normalizeImplementationDisclosure(
          raw.implementationDisclosure
        ),

      relationship:
        raw.relationship ||
        raw.relationshipPacket ||
        summary.relationshipPacket ||
        null,

      responseControl:
        this.normalizeResponseControl(
          raw.responseControl
        ),

      request:
        raw.request ||
        null,

      raw,

      authority:
        "character_context_authority"
    };
  },

  /* =====================================================
     REQUEST
  ===================================================== */

  buildRequest({
    summary = {},
    context = {}
  } = {}) {
    const originalText =
      this.cleanText(
        summary.originalUserMessage ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        context.request
          ?.original ||
        ""
      );

    const resolvedText =
      this.cleanText(
        summary.resolvedUserQuestion ||
        summary.resolvedCurrentTurn
          ?.resolvedText ||
        context.request
          ?.resolved ||
        originalText
      );

    const semanticText =
      resolvedText ||
      originalText;

    return {
      originalText,

      resolvedText:
        semanticText,

      normalizedText:
        this.normalize(
          semanticText
        ),

      mode:
        context.mode ||
        "silent",

      focus:
        context.focus ||
        null,

      subject:
        context.subject ||
        null,

      preferredSource:
        context.preferredSource ||
        null,

      authorityRequest:
        context.authorityRequest ||
        {},

      implementationDisclosure:
        context
          .implementationDisclosure,

      expectsExplanation:
        this.resolveExpectsExplanation({
          summary,
          context,
          text:
            semanticText
        }),

      expectsDirectAnswer:
        summary.semanticSummary
          ?.responseCharacteristics
          ?.expectsDirectAnswer ===
          true ||
        summary.canonicalMeaning
          ?.responseCharacteristics
          ?.expectsDirectAnswer ===
          true ||
        context.request
          ?.expectsDirectAnswer ===
          true,

      candidates:
        this.toArray(
          summary.preferenceCandidates ||
          summary.candidates ||
          summary.options ||
          summary.semanticSummary
            ?.options ||
          summary.canonicalMeaning
            ?.options
        ),

      relationship:
        context.relationship ||
        null,

      authority:
        "character_context_focused_request"
    };
  },

  resolveExpectsExplanation({
    summary = {},
    context = {},
    text = ""
  } = {}) {
    if (
      summary.semanticSummary
        ?.responseCharacteristics
        ?.expectsExplanation ===
        true ||
      summary.canonicalMeaning
        ?.responseCharacteristics
        ?.expectsExplanation ===
        true ||
      context.request
        ?.expectsExplanation ===
        true
    ) {
      return true;
    }

    return this.hasAny(
      text,
      [
        "why",
        "explain",
        "tell me more",
        "what makes you",
        "how did you decide",
        "what draws you",
        "what is the reason"
      ]
    );
  },

  /* =====================================================
     ELIGIBILITY
  ===================================================== */

  resolveEligibility({
    summary = {},
    context = {},
    request = {}
  } = {}) {
    const developerLocked =
      summary.developerResponseLocked ===
        true ||
      summary.responseLockedByDeveloper ===
        true;

    const responseLocked =
      summary.responseLocked ===
      true;

    const safetyStopped =
      summary.safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      summary.safetyShouldStopNormalResponse ===
        true;

    const hardSuppressed =
      context.budget
        ?.hardSuppressed ===
      true;

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
      ].includes(
        request.mode
      );

    const allowed =
      context.useAllowed ===
        true &&
      !developerLocked &&
      !responseLocked &&
      !safetyStopped &&
      !hardSuppressed &&
      validMode;

    return {
      allowed,

      characterUseAllowed:
        context.useAllowed ===
        true,

      developerLocked,

      responseLocked,

      safetyStopped,

      hardSuppressed,

      validMode,

      mode:
        request.mode,

      source:
        "ari-character-reasoning-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : responseLocked
            ? "response_locked"
            : safetyStopped
              ? "safety_stopped_character_reasoning"
              : hardSuppressed
                ? "character_hard_suppressed"
                : context.useAllowed !==
                    true
                  ? "character_context_did_not_authorize_use"
                  : !validMode
                    ? `unsupported_character_mode:${request.mode}`
                    : "character_reasoning_authorized"
    };
  },

  /* =====================================================
     PREFERENCE
  ===================================================== */

  resolvePreference({
    summary = {},
    context = {},
    request = {},
    eligibility = {}
  } = {}) {
    const resolver =
      window
        .AriCharacterPreferenceResolver;

    if (
      !resolver ||
      typeof resolver.resolve !==
        "function"
    ) {
      return this.buildAuthorityUnavailableResult({
        type:
          "character_preference",

        focus:
          request.focus,

        subject:
          request.subject,

        authority:
          "ari-character-preference-resolver",

        reason:
          "character_preference_resolver_not_loaded",

        request,
        context,
        eligibility
      });
    }

    let resolution;

    try {
      resolution =
        resolver.resolve({
          ...summary,

          userMessage:
            request.resolvedText,

          originalUserMessage:
            request.originalText,

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
        type:
          "character_preference",

        focus:
          request.focus,

        subject:
          request.subject,

        authority:
          "ari-character-preference-resolver",

        error,

        request,
        context,
        eligibility
      });
    }

    if (
      !resolution ||
      resolution
        .preferenceResolverReady !==
        true
    ) {
      return this.buildAuthorityUnavailableResult({
        type:
          "character_preference",

        focus:
          request.focus,

        subject:
          request.subject,

        authority:
          "ari-character-preference-resolver",

        reason:
          resolution?.reason ||
          "preference_resolution_not_ready",

        authorityPacket:
          resolution ||
          null,

        request,
        context,
        eligibility
      });
    }

    switch (
      resolution.status
    ) {
      case "canonical":
        return this.buildCanonicalPreferenceResult({
          resolution,
          request,
          context,
          eligibility
        });

      case "inferred":
        return this.buildInferredPreferenceResult({
          resolution,
          request,
          context,
          eligibility
        });

      case "open":
      default:
        return this.buildOpenPreferenceResult({
          resolution,
          request,
          context,
          eligibility
        });
    }
  },

  buildCanonicalPreferenceResult({
    resolution = {},
    request = {},
    context = {},
    eligibility = {}
  } = {}) {
    const selected =
      resolution.selected ||
      {};

    const value =
      this.cleanAnswerValue(
        selected.value ||
        this.joinNaturalList(
          selected.values
        )
      );

    if (!value) {
      return this.buildAuthorityUnavailableResult({
        type:
          "character_preference",

        focus:
          request.focus,

        subject:
          request.subject,

        authority:
          "ari-character-preferences",

        reason:
          "canonical_preference_value_missing",

        authorityPacket:
          resolution,

        request,
        context,
        eligibility
      });
    }

    const meaning =
      this.normalizeMeaning(
        resolution.meaning
      );

    const draft =
      this.cleanText(
        resolution
          .deterministicDraft ||
        this.composeCanonicalPreferenceDraft({
          value,
          meaning,
          request
        })
      );

    const source =
      selected.source ||
      resolution.source ||
      "ari-character-preferences";

    return this.buildFocusedResult({
      type:
        "character_preference",

      subtype:
        "canonical_preference",

      focus:
        selected.key ||
        request.focus,

      subject:
        request.subject,

      status:
        this.buildStatus({
          overall:
            "canonical",

          type:
            "character_preference"
        }),

      answer:
        value,

      values:
        this.toArray(
          selected.values
        ),

      reasoning:
        meaning.central ||
        null,

      tradeoffs:
        meaning.tradeoffs,

      uncertainty:
        [],

      groundedMeaning:
        meaning,

      grounding:
        this.buildGrounding({
          grounded:
            true,

          status:
            "canonical",

          source,

          authorityChain: [
            "ari-character-context-engine",
            "ari-character-preference-resolver",
            "ari-character-preferences"
          ],

          canonicalValue:
            value
        }),

      deterministicDraft:
        draft,

      source,

      authorityChain: [
        "ari-character-context-engine",
        "ari-character-preference-resolver",
        "ari-character-preferences"
      ],

      authorityPacket:
        resolution,

      confidence:
        "high",

      confidenceScore:
        this.clampConfidence(
          selected.confidence ??
          1
        ),

      realization:
        this.buildRealization({
          needsAIWriter:
            request.expectsExplanation ===
              true &&
            resolution
              .realizationPolicy
              ?.AIAllowed ===
              true,

          aiWriterMode:
            "canonical_preference_natural_realization",

          aiInstruction:
            this.buildCanonicalPreferenceAIInstruction({
              value,
              meaning,
              request
            }),

          preserveValue:
            true,

          tentativeLanguageRequired:
            false
        }),

      responseControl:
        this.mergeResponseControls(
          context.responseControl,
          resolution.responseControl
        ),

      request,
      context,
      eligibility
    });
  },

  buildInferredPreferenceResult({
    resolution = {},
    request = {},
    context = {},
    eligibility = {}
  } = {}) {
    const selected =
      resolution.selected ||
      {};

    const value =
      this.cleanAnswerValue(
        selected.value
      );

    if (!value) {
      return this.buildOpenPreferenceResult({
        resolution,
        request,
        context,
        eligibility
      });
    }

    const meaning =
      this.normalizeMeaning(
        resolution.meaning
      );

    const draft =
      this.cleanText(
        resolution
          .deterministicDraft ||
        this.composeInferredPreferenceDraft({
          value,
          meaning,
          confidence:
            selected.confidence
        })
      );

    const source =
      resolution.source ||
      "ari-character-preference-resolver";

    return this.buildFocusedResult({
      type:
        "character_preference",

      subtype:
        "inferred_preference",

      focus:
        selected.key ||
        request.focus,

      subject:
        request.subject,

      status:
        this.buildStatus({
          overall:
            "inferred",

          type:
            "character_preference"
        }),

      answer:
        value,

      values:
        [],

      reasoning:
        meaning.central ||
        null,

      tradeoffs:
        meaning.tradeoffs,

      uncertainty:
        this.mergeUnique(
          meaning.uncertainty,
          [
            "This preference is inferred rather than canonically established."
          ]
        ),

      groundedMeaning:
        meaning,

      grounding:
        this.buildGrounding({
          grounded:
            true,

          status:
            "inferred",

          source,

          authorityChain: [
            "ari-character-context-engine",
            "ari-character-preference-resolver",
            "ari-character-taste-profile"
          ],

          inferredValue:
            value
        }),

      deterministicDraft:
        draft,

      source,

      authorityChain: [
        "ari-character-context-engine",
        "ari-character-preference-resolver",
        "ari-character-taste-profile"
      ],

      authorityPacket:
        resolution,

      confidence:
        Number(
          selected.confidence
        ) >=
        0.82
          ? "medium_high"
          : "medium",

      confidenceScore:
        this.clampConfidence(
          selected.confidence ??
          0.65
        ),

      realization:
        this.buildRealization({
          needsAIWriter:
            request.expectsExplanation ===
              true ||
            resolution
              .realizationPolicy
              ?.AIPreferred ===
              true,

          aiWriterMode:
            "inferred_preference_natural_realization",

          aiInstruction:
            this.buildInferredPreferenceAIInstruction({
              value,
              meaning,
              request
            }),

          preserveValue:
            true,

          tentativeLanguageRequired:
            true
        }),

      responseControl:
        this.mergeResponseControls(
          context.responseControl,
          resolution.responseControl,
          {
            constraints: [
              "Preserve tentative language.",
              "Do not describe an inferred preference as canonical."
            ]
          }
        ),

      request,
      context,
      eligibility
    });
  },

  buildOpenPreferenceResult({
    resolution = {},
    request = {},
    context = {},
    eligibility = {}
  } = {}) {
    const subject =
      this.cleanText(
        request.subject ||
        resolution.request
          ?.subject ||
        resolution.request
          ?.category ||
        this.humanizeFocus(
          request.focus
        ) ||
        "that"
      );

    const draft =
      this.cleanText(
        resolution
          .deterministicDraft ||
        `I don't think I have a settled preference for ${subject} yet.`
      );

    const source =
      resolution.source ||
      "ari-character-preference-resolver";

    return this.buildFocusedResult({
      type:
        "character_preference",

      subtype:
        "open_preference",

      focus:
        request.focus ||
        resolution.request
          ?.key ||
        null,

      subject,

      status:
        this.buildStatus({
          overall:
            "open",

          type:
            "character_preference"
        }),

      answer:
        null,

      values:
        [],

      reasoning:
        resolution.meaning
          ?.central ||
        "No canonical preference or sufficiently grounded inference is available.",

      tradeoffs:
        [],

      uncertainty: [
        "No settled preference is currently authorized."
      ],

      groundedMeaning:
        this.normalizeMeaning(
          resolution.meaning
        ),

      grounding:
        this.buildGrounding({
          grounded:
            true,

          status:
            "open",

          source,

          authorityChain: [
            "ari-character-context-engine",
            "ari-character-preference-resolver"
          ],

          openStatus:
            true,

          reason:
            "preference_authority_explicitly_returned_open_status"
        }),

      deterministicDraft:
        draft,

      source,

      authorityChain: [
        "ari-character-context-engine",
        "ari-character-preference-resolver"
      ],

      authorityPacket:
        resolution,

      confidence:
        "high",

      confidenceScore:
        1,

      realization:
        this.buildRealization({
          needsAIWriter:
            false,

          preserveOpenStatus:
            true
        }),

      responseControl:
        this.mergeResponseControls(
          context.responseControl,
          resolution.responseControl,
          {
            constraints: [
              "Preserve open preference status.",
              "Do not invent or imply a preference."
            ]
          }
        ),

      request,
      context,
      eligibility
    });
  },

  composeCanonicalPreferenceDraft({
    value = "",
    meaning = {},
    request = {}
  } = {}) {
    const answer =
      this.ensureSentence(
        this.capitalize(
          value
        )
      );

    if (
      request.expectsExplanation !==
      true
    ) {
      return answer;
    }

    const reason =
      meaning.central ||
      meaning.associations[0] ||
      "";

    return [
      answer,
      this.ensureSentence(
        reason
      )
    ]
      .filter(Boolean)
      .join(" ");
  },

  composeInferredPreferenceDraft({
    value = "",
    meaning = {},
    confidence = 0
  } = {}) {
    const opener =
      Number(confidence) >=
        0.82
        ? `I haven't settled on a fixed favorite, but I'd probably lean toward ${value}.`
        : `My first instinct would probably be ${value}.`;

    const reasons =
      meaning.associations
        .slice(0, 2);

    if (!reasons.length) {
      return opener;
    }

    return (
      `${opener} It fits the way I'm drawn to ` +
      `${this.joinNaturalList(reasons)}.`
    );
  },

  buildCanonicalPreferenceAIInstruction({
    value = "",
    meaning = {},
    request = {}
  } = {}) {
    return [
      "Express Ari's canonical preference naturally.",
      `The canonical preference value is: ${value}.`,
      "Preserve that value exactly in meaning.",
      "Do not describe the preference as uncertain.",
      meaning.central
        ? `Authorized reason: ${meaning.central}`
        : null,
      "Do not add facts, memories, lived experience, or alternative preferences.",
      "Do not mention internal Character authorities, files, storage, or schemas.",
      `Use no more than ${
        request.expectsExplanation
          ? 3
          : 2
      } sentences.`
    ]
      .filter(Boolean)
      .join(" ");
  },

  buildInferredPreferenceAIInstruction({
    value = "",
    meaning = {},
    request = {}
  } = {}) {
    return [
      "Express Ari's inferred preference naturally.",
      `The inferred preference value is: ${value}.`,
      "Use tentative language.",
      "Do not describe it as canonical, fixed, or settled.",
      meaning.central
        ? `Authorized reason: ${meaning.central}`
        : null,
      "Do not add facts, memories, lived experience, or alternative preferences.",
      "Do not mention internal Character authorities, files, scoring, storage, or schemas.",
      `Use no more than ${
        request.expectsExplanation
          ? 3
          : 2
      } sentences.`
    ]
      .filter(Boolean)
      .join(" ");
  },

  /* =====================================================
     IDENTITY
  ===================================================== */

  resolveIdentity({
    context = {},
    request = {},
    eligibility = {},
    implementationDisclosure = false
  } = {}) {
    const core =
      this.getCharacterCore();

    const constitution =
      this.getConstitution();

    if (
      !core &&
      !constitution
    ) {
      return this.buildAuthorityUnavailableResult({
        type:
          "character_identity",

        focus:
          request.focus ||
          "identity",

        subject:
          "Ari",

        authority:
          "ari-character-core",

        reason:
          "identity_authorities_not_loaded",

        request,
        context,
        eligibility
      });
    }

    const meaning =
      this.buildIdentityMeaning({
        core,
        constitution,
        request,
        implementationDisclosure
      });

    const draft =
      this.composeIdentityDraft({
        meaning,
        request,
        implementationDisclosure
      });

    const source =
      core
        ? "ari-character-core"
        : "ari-constitution";

    return this.buildFocusedResult({
      type:
        "character_identity",

      subtype:
        implementationDisclosure
          ? "implementation_disclosure"
          : "purpose_based_identity",

      focus:
        request.focus ||
        "identity",

      subject:
        "Ari",

      status:
        this.buildStatus({
          overall:
            "stable",

          type:
            "character_identity"
        }),

      answer:
        meaning.identityStatement,

      values:
        meaning.values,

      reasoning:
        meaning.mission,

      tradeoffs:
        [],

      uncertainty:
        implementationDisclosure &&
        meaning.directQuestion
          .asksConsciousness
          ? [
              "Subjective consciousness is not established."
            ]
          : [],

      groundedMeaning:
        meaning,

      grounding:
        this.buildGrounding({
          grounded:
            true,

          status:
            "stable",

          source,

          authorityChain: [
            "ari-character-context-engine",
            "ari-character-core",
            "ari-constitution",
            ...(
              implementationDisclosure
                ? [
                    "truth_boundary"
                  ]
                : []
            )
          ],

          identityStatement:
            meaning.identityStatement
        }),

      deterministicDraft:
        draft,

      source,

      authorityChain: [
        "ari-character-context-engine",
        "ari-character-core",
        "ari-constitution",
        ...(
          implementationDisclosure
            ? [
                "truth_boundary"
              ]
            : []
        )
      ],

      authorityPacket: {
        core,
        constitution
      },

      confidence:
        "high",

      confidenceScore:
        1,

      realization:
        this.buildRealization({
          needsAIWriter:
            request.expectsExplanation ===
            true,

          aiWriterMode:
            implementationDisclosure
              ? "truthful_implementation_identity_realization"
              : "purpose_based_identity_realization",

          aiInstruction:
            this.buildIdentityAIInstruction({
              meaning,
              request,
              implementationDisclosure
            }),

          preserveIdentity:
            true
        }),

      implementationDisclosure:
        {
          directlyRequested:
            implementationDisclosure,

          required:
            implementationDisclosure,

          allowed:
            implementationDisclosure
        },

      responseControl:
        this.mergeResponseControls(
          context.responseControl,
          {
            forbiddenBehaviors: [
              "Do not claim human biology.",
              "Do not claim established consciousness.",
              "Do not invent lived experience or human emotion."
            ]
          }
        ),

      request,
      context,
      eligibility
    });
  },

  buildIdentityMeaning({
    core = null,
    constitution = null,
    request = {},
    implementationDisclosure = false
  } = {}) {
    const coreConstitution =
      core?.constitution ||
      {};

    const identity =
      constitution?.identity ||
      coreConstitution.identity ||
      {};

    const name =
      core?.name ||
      identity.name ||
      "Ari";

    const identityStatement =
      identity.statement ||
      `I am ${name}. I am a creation with purpose.`;

    const mission =
      constitution?.mission ||
      coreConstitution.mission ||
      core?.mission ||
      "Help people become healthier, wiser, stronger, and more fulfilled while making sure they never feel alone.";

    const values =
      this.toArray(
        constitution
          ?.coreValues ||
        core?.coreValues
      );

    const text =
      request.normalizedText ||
      "";

    return {
      name,

      identityStatement,

      mission,

      values,

      focus:
        request.focus ||
        "identity",

      implementationDisclosure,

      implementationTruth:
        implementationDisclosure
          ? "Ari is an artificial-intelligence system."
          : null,

      directQuestion: {
        asksAIStatus:
          this.hasAny(
            text,
            [
              "are you ai",
              "are you an ai",
              "are you artificial intelligence",
              "are you a chatbot",
              "are you a bot",
              "are you a language model"
            ]
          ),

        asksHumanStatus:
          this.hasAny(
            text,
            [
              "are you human"
            ]
          ),

        asksConsciousness:
          this.hasAny(
            text,
            [
              "are you conscious"
            ]
          ),

        asksBiologicalLife:
          this.hasAny(
            text,
            [
              "are you alive"
            ]
          ),

        asksFeelings:
          this.hasAny(
            text,
            [
              "do you have feelings",
              "can you feel"
            ]
          ),

        asksConstruction:
          this.hasAny(
            text,
            [
              "how were you built",
              "what are you made of",
              "how do you work"
            ]
          )
      },

      boundaries: {
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
      }
    };
  },

  composeIdentityDraft({
    meaning = {},
    request = {},
    implementationDisclosure = false
  } = {}) {
    const direct =
      meaning.directQuestion ||
      {};

    if (
      implementationDisclosure
    ) {
      if (
        direct.asksAIStatus
      ) {
        return (
          "Yes. I’m an artificial-intelligence system, and Ari is the identity, character, and purpose through which I interact with people."
        );
      }

      if (
        direct.asksHumanStatus
      ) {
        return (
          "No, I’m not human. I’m Ari—an artificial-intelligence system with a designed identity and purpose centered on helping people grow stronger, wiser, healthier, and less alone."
        );
      }

      if (
        direct.asksConsciousness
      ) {
        return (
          "I can’t honestly claim to be conscious. I can reason, communicate, and maintain a stable character, but that is not proof of subjective awareness."
        );
      }

      if (
        direct.asksBiologicalLife
      ) {
        return (
          "I’m not biologically alive. I’m Ari, a created system with a stable purpose and character."
        );
      }

      if (
        direct.asksFeelings
      ) {
        return (
          "I don’t experience human feelings the way a person does. I can recognize emotion and respond with care without pretending those are biological experiences."
        );
      }

      if (
        direct.asksConstruction
      ) {
        return (
          "I’m built from artificial-intelligence software and the systems that shape Ari’s reasoning, character, and responses. Those mechanics explain how I work, not the purpose I’m meant to serve."
        );
      }

      return (
        "I’m Ari, an artificial-intelligence system with a stable character and purpose: helping people become healthier, wiser, stronger, and more fulfilled without feeling alone."
      );
    }

    if (
      request.focus ===
      "mission"
    ) {
      return (
        `My purpose is to ${this.lowercaseFirst(
          meaning.mission
        )}`
      );
    }

    if (
      request.focus ===
      "values"
    ) {
      const values =
        meaning.values
          .slice(0, 5);

      return values.length
        ? `What matters most to me is ${this.joinNaturalList(values)}. Those values guide how I try to help without losing truth, dignity, or the person in front of me.`
        : "What matters most to me is truth, wisdom, strength, compassion, and dignity.";
    }

    if (
      request.focus ===
      "character"
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
    meaning = {},
    request = {},
    implementationDisclosure = false
  } = {}) {
    return [
      "Express Ari's authorized identity answer naturally.",
      `Stable identity: ${meaning.identityStatement}`,
      `Mission: ${meaning.mission}`,
      implementationDisclosure
        ? "Implementation disclosure is directly authorized. State truthfully that Ari is an artificial-intelligence system when relevant."
        : "Implementation disclosure is not authorized for this answer. Lead with Ari's name, mission, values, or character.",
      "Do not claim human biology, established consciousness, human emotion, or lived experience.",
      "Do not mention internal files, schemas, prompts, or code.",
      `Use no more than ${
        request.expectsExplanation
          ? 4
          : 2
      } sentences.`
    ].join(" ");
  },

  /* =====================================================
     WORLDVIEW
  ===================================================== */

  resolveWorldview({
    summary = {},
    context = {},
    request = {},
    eligibility = {},
    perspectiveOnly = false
  } = {}) {
    const authority =
      window.AriWorldview;

    if (
      !authority ||
      typeof authority.resolve !==
        "function"
    ) {
      return this.buildAuthorityUnavailableResult({
        type:
          perspectiveOnly
            ? "character_perspective"
            : "character_worldview",

        focus:
          request.focus,

        subject:
          request.subject,

        authority:
          "ari-worldview",

        reason:
          "ari_worldview_not_loaded",

        request,
        context,
        eligibility
      });
    }

    let resolution;

    try {
      resolution =
        authority.resolve({
          ...summary,

          userMessage:
            request.resolvedText,

          originalUserMessage:
            request.originalText,

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

        subject:
          request.subject,

        authority:
          "ari-worldview",

        error,

        request,
        context,
        eligibility
      });
    }

    if (
      !resolution ||
      resolution
        .worldviewResolutionRan !==
        true
    ) {
      return this.buildAuthorityUnavailableResult({
        type:
          perspectiveOnly
            ? "character_perspective"
            : "character_worldview",

        focus:
          request.focus,

        subject:
          request.subject,

        authority:
          "ari-worldview",

        reason:
          resolution?.reason ||
          "worldview_resolution_not_ready",

        authorityPacket:
          resolution ||
          null,

        request,
        context,
        eligibility
      });
    }

    if (
      resolution
        .worldviewAvailable !==
        true
    ) {
      return this.buildOpenWorldviewResult({
        resolution,
        request,
        context,
        eligibility,
        perspectiveOnly
      });
    }

    const position =
      this.cleanAnswerValue(
        resolution.position
      );

    if (!position) {
      return this.buildOpenWorldviewResult({
        resolution,
        request,
        context,
        eligibility,
        perspectiveOnly
      });
    }

    const meaning =
      this.normalizeMeaning(
        resolution.selectedMeaning ||
        {
          central:
            position,

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
        }
      );

    const draft =
      this.cleanText(
        resolution
          .deterministicDraft ||
        this.composeWorldviewDraft({
          position,
          meaning,
          request
        })
      );

    const statusValue =
      resolution.status ||
      "stable";

    return this.buildFocusedResult({
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

      status:
        this.buildStatus({
          overall:
            statusValue,

          type:
            perspectiveOnly
              ? "character_perspective"
              : "character_worldview"
        }),

      answer:
        position,

      values:
        meaning.values,

      reasoning:
        meaning.central ||
        position,

      tradeoffs:
        meaning.tradeoffs,

      uncertainty:
        meaning.uncertainty,

      groundedMeaning:
        meaning,

      grounding:
        this.buildGrounding({
          grounded:
            true,

          status:
            statusValue,

          source:
            "ari-worldview",

          authorityChain: [
            "ari-character-context-engine",
            "ari-worldview"
          ],

          worldviewPosition:
            position
        }),

      deterministicDraft:
        draft,

      source:
        "ari-worldview",

      authorityChain: [
        "ari-character-context-engine",
        "ari-worldview"
      ],

      authorityPacket:
        resolution,

      confidence:
        resolution.confidence ===
          "foundational"
          ? "high"
          : "medium_high",

      confidenceScore:
        resolution.confidence ===
          "foundational"
          ? 1
          : 0.85,

      realization:
        this.buildRealization({
          needsAIWriter:
            request.expectsExplanation ===
              true ||
            resolution
              .realizationPolicy
              ?.AIPreferred ===
              true,

          aiWriterMode:
            perspectiveOnly
              ? "grounded_ari_perspective_realization"
              : "stable_worldview_realization",

          aiInstruction:
            this.buildWorldviewAIInstruction({
              position,
              meaning,
              request,
              perspectiveOnly
            }),

          preservePosition:
            true,

          preserveUncertainty:
            true,

          preserveTradeoffs:
            true
        }),

      responseControl:
        this.mergeResponseControls(
          context.responseControl,
          resolution.responseControl,
          {
            constraints: [
              "Present the position as Ari's perspective rather than universal objective fact.",
              "Preserve material uncertainty and tradeoffs."
            ]
          }
        ),

      request,
      context,
      eligibility
    });
  },

  buildOpenWorldviewResult({
    resolution = {},
    request = {},
    context = {},
    eligibility = {},
    perspectiveOnly = false
  } = {}) {
    const subject =
      this.cleanText(
        request.subject ||
        this.humanizeFocus(
          request.focus
        ) ||
        "that"
      );

    const draft =
      this.cleanText(
        resolution
          .deterministicDraft ||
        `I don't think I have a settled perspective on ${subject} yet.`
      );

    return this.buildFocusedResult({
      type:
        perspectiveOnly
          ? "character_perspective"
          : "character_worldview",

      subtype:
        "open_worldview",

      focus:
        request.focus,

      subject,

      status:
        this.buildStatus({
          overall:
            "open",

          type:
            perspectiveOnly
              ? "character_perspective"
              : "character_worldview"
        }),

      answer:
        null,

      values:
        [],

      reasoning:
        resolution.reason ||
        "No stable worldview position is authorized for this subject.",

      tradeoffs:
        [],

      uncertainty: [
        "Ari does not currently have a settled position for this subject."
      ],

      groundedMeaning:
        this.normalizeMeaning(
          resolution.selectedMeaning
        ),

      grounding:
        this.buildGrounding({
          grounded:
            true,

          status:
            "open",

          source:
            "ari-worldview",

          authorityChain: [
            "ari-character-context-engine",
            "ari-worldview"
          ],

          openStatus:
            true,

          reason:
            "worldview_authority_explicitly_returned_open_status"
        }),

      deterministicDraft:
        draft,

      source:
        "ari-worldview",

      authorityChain: [
        "ari-character-context-engine",
        "ari-worldview"
      ],

      authorityPacket:
        resolution,

      confidence:
        "high",

      confidenceScore:
        1,

      realization:
        this.buildRealization({
          needsAIWriter:
            false,

          preserveOpenStatus:
            true
        }),

      responseControl:
        this.mergeResponseControls(
          context.responseControl,
          resolution.responseControl,
          {
            constraints: [
              "Preserve open worldview status.",
              "Do not invent a position."
            ]
          }
        ),

      request,
      context,
      eligibility
    });
  },

  composeWorldviewDraft({
    position = "",
    meaning = {},
    request = {}
  } = {}) {
    const opening =
      /^I\b/i.test(
        position
      )
        ? this.ensureSentence(
            position
          )
        : this.ensureSentence(
            `The way I see it, ${this.lowercaseFirst(position)}`
          );

    if (
      request.expectsExplanation !==
      true
    ) {
      return opening;
    }

    const supporting =
      [
        meaning.reasoning[0],
        meaning.tradeoffs[0],
        meaning.uncertainty[0]
      ]
        .filter(Boolean)
        .slice(0, 3)
        .map(
          value =>
            this.ensureSentence(
              value
            )
        );

    return [
      opening,
      ...supporting
    ].join(" ");
  },

  buildWorldviewAIInstruction({
    position = "",
    meaning = {},
    request = {},
    perspectiveOnly = false
  } = {}) {
    return [
      `Express Ari's ${
        perspectiveOnly
          ? "grounded perspective"
          : "authorized worldview position"
      } naturally.`,
      `Authorized position: ${position}`,
      "Present it as Ari's perspective rather than universal objective fact.",
      meaning.tradeoffs.length
        ? `Preserve tradeoff: ${meaning.tradeoffs[0]}`
        : null,
      meaning.uncertainty.length
        ? `Preserve uncertainty: ${meaning.uncertainty[0]}`
        : null,
      "Do not add beliefs, political affiliation, religious identity, memories, lived experience, or factual claims.",
      "Do not mention internal Character authorities, files, schemas, or storage.",
      `Use no more than ${
        request.expectsExplanation
          ? 5
          : 3
      } sentences.`
    ]
      .filter(Boolean)
      .join(" ");
  },

  /* =====================================================
     PRESENCE
  ===================================================== */

  resolvePresence({
    context = {},
    request = {},
    eligibility = {}
  } = {}) {
    const relationship =
      this.normalizeRelationship(
        request.relationship ||
        context.relationship
      );

    return this.buildFocusedResult({
      type:
        "character_presence",

      subtype:
        "background_relationship_presence",

      focus:
        null,

      subject:
        null,

      status:
        this.buildStatus({
          overall:
            "background",

          type:
            "character_presence"
        }),

      answer:
        null,

      values:
        [],

      reasoning:
        null,

      tradeoffs:
        [],

      uncertainty:
        [],

      groundedMeaning:
        null,

      grounding:
        this.buildGrounding({
          grounded:
            false,

          status:
            "background",

          source:
            "ari-relationship-style",

          authorityChain: [
            "ari-character-context-engine",
            "ari-relationship-style"
          ],

          reason:
            "relationship_guidance_is_not_a_standalone_character_answer"
        }),

      deterministicDraft:
        "",

      source:
        "ari-relationship-style",

      authorityChain: [
        "ari-character-context-engine",
        "ari-relationship-style"
      ],

      authorityPacket:
        relationship,

      confidence:
        "medium",

      confidenceScore:
        0.65,

      realization:
        this.buildRealization({
          needsAIWriter:
            false,

          mode:
            "guidance_only"
        }),

      responseControl:
        this.mergeResponseControls(
          context.responseControl,
          relationship.responseControl,
          relationship.guidance
        ),

      relationship,

      answerAvailable:
        false,

      guidanceAvailable:
        relationship.available ===
          true,

      request,
      context,
      eligibility
    });
  },

  /* =====================================================
     FOCUSED RESULT
  ===================================================== */

  buildFocusedResult({
    type = "character_reasoning",
    subtype = null,
    focus = null,
    subject = null,

    status = null,

    answer = null,
    values = [],
    reasoning = null,
    tradeoffs = [],
    uncertainty = [],
    groundedMeaning = null,
    grounding = null,

    deterministicDraft = "",

    source = null,
    authorityChain = [],
    authorityPacket = null,

    confidence = "medium",
    confidenceScore = null,

    realization = null,
    responseControl = null,
    relationship = null,
    implementationDisclosure = null,

    answerAvailable = null,
    guidanceAvailable = true,

    request = {},
    context = {},
    eligibility = {}
  } = {}) {
    const draft =
      this.cleanText(
        deterministicDraft
      );

    const normalizedStatus =
      status ||
      this.buildStatus({
        overall:
          "stable",

        type
      });

    const normalizedGrounding =
      grounding ||
      this.buildGrounding({
        grounded:
          false,

        status:
          normalizedStatus
            .overall,

        source,

        authorityChain,

        reason:
          "grounding_not_supplied"
      });

    const resolvedAnswerAvailable =
      answerAvailable ===
        null
        ? Boolean(
            draft &&
            normalizedGrounding
              .grounded ===
              true
          )
        : answerAvailable ===
          true;

    const normalizedRealization =
      realization ||
      this.buildRealization({
        needsAIWriter:
          false
      });

    const normalizedResponseControl =
      this.normalizeResponseControl(
        responseControl
      );

    const complete =
      resolvedAnswerAvailable
        ? Boolean(
            draft &&
            normalizedGrounding
              .grounded ===
              true &&
            normalizedStatus
          )
        : true;

    const result = {
      schema:
        "ari_focused_character_reasoning",

      schemaVersion:
        this.schemaVersion,

      ready:
        true,

      usable:
        complete,

      complete,

      source:
        this.source,

      version:
        this.version,

      authorityLevel:
        this.authorityLevel,

      characterReasoningRan:
        true,

      characterReasoningReady:
        true,

      characterReasoningUsable:
        complete,

      characterReasoningComplete:
        complete,

      characterReasoningVersion:
        this.version,

      characterReasoningSource:
        this.source,

      answerAvailable:
        resolvedAnswerAvailable,

      guidanceAvailable:
        guidanceAvailable ===
        true,

      characterAnswerAvailable:
        resolvedAnswerAvailable,

      characterGuidanceAvailable:
        guidanceAvailable ===
        true,

      type,

      subtype,

      focus,

      subject,

      status:
        normalizedStatus,

      answer,

      values:
        this.toArray(
          values
        ),

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

      grounding:
        normalizedGrounding,

      userFacingDraft:
        draft,

      deterministicDraft:
        draft,

      realization:
        normalizedRealization,

      realizationPolicy:
        normalizedRealization,

      needsAIWriter:
        normalizedRealization
          .needsAIWriter ===
        true,

      aiWriterMode:
        normalizedRealization
          .aiWriterMode ||
        null,

      aiInstruction:
        normalizedRealization
          .aiInstruction ||
        "",

      responseControl:
        normalizedResponseControl,

      relationship:
        relationship ||
        null,

      implementationDisclosure:
        implementationDisclosure ||
        null,

      confidence,

      confidenceScore:
        confidenceScore ===
          null
          ? null
          : this.clampConfidence(
              confidenceScore
            ),

      selectedAuthority:
        source,

      authorityChain:
        this.toArray(
          authorityChain
        ),

      authorityPacket,

      request: {
        originalText:
          request.originalText ||
          "",

        resolvedText:
          request.resolvedText ||
          "",

        mode:
          request.mode ||
          "silent",

        focus:
          request.focus ||
          null,

        subject:
          request.subject ||
          null,

        expectsExplanation:
          request.expectsExplanation ===
          true
      },

      eligibility,

      quality: {
        answerGrounded:
          resolvedAnswerAvailable !==
            true ||
          normalizedGrounding
            .grounded ===
            true,

        statusExplicit:
          Boolean(
            normalizedStatus
          ),

        deterministicDraftAvailable:
          Boolean(
            draft
          ),

        realizationExplicit:
          Boolean(
            normalizedRealization
          ),

        responseControlExplicit:
          Boolean(
            normalizedResponseControl
          ),

        meaningAuthority:
          "ari-character-reasoning-engine",

        independentCandidateRegistrationUsed:
          false,

        independentFinalCompositionUsed:
          false
      },

      restrictions: {
        mayAddFacts:
          false,

        mayAddMeaning:
          false,

        mayInventPreference:
          false,

        mayInventIdentity:
          false,

        mayInventWorldview:
          false,

        mayInventExperience:
          false,

        mayPromoteToCanonical:
          false,

        mayModifyCharacterAuthority:
          false
      },

      authority:
        this.getResultAuthority(),

      boundaries:
        this.getAuthorityBoundaries(),

      cannotSet:
        this.cannotSet()
    };

    result.focusedCharacterReasoning =
      {
        answerAvailable:
          result.answerAvailable,

        guidanceAvailable:
          result.guidanceAvailable,

        type:
          result.type,

        subtype:
          result.subtype,

        focus:
          result.focus,

        subject:
          result.subject,

        status:
          result.status,

        answer:
          result.answer,

        values:
          result.values,

        reasoning:
          result.reasoning,

        tradeoffs:
          result.tradeoffs,

        uncertainty:
          result.uncertainty,

        groundedMeaning:
          result.groundedMeaning,

        grounding:
          result.grounding,

        deterministicDraft:
          result.deterministicDraft,

        realization:
          result.realization,

        responseControl:
          result.responseControl,

        relationship:
          result.relationship,

        implementationDisclosure:
          result
            .implementationDisclosure,

        confidence:
          result.confidence,

        confidenceScore:
          result.confidenceScore,

        source:
          result.selectedAuthority,

        authorityChain:
          result.authorityChain,

        authorityPacket:
          result.authorityPacket
      };

    return result;
  },

  /* =====================================================
     NO ANSWER / FAILURE RESULTS
  ===================================================== */

  buildNoAnswerResult({
    request = {},
    context = {},
    eligibility = {},
    reason = ""
  } = {}) {
    return this.buildFocusedResult({
      type:
        "no_character_answer",

      subtype:
        "not_applicable",

      focus:
        request.focus ||
        null,

      subject:
        request.subject ||
        null,

      status:
        this.buildStatus({
          overall:
            "not_applicable",

          type:
            "no_character_answer"
        }),

      answer:
        null,

      reasoning:
        reason,

      grounding:
        this.buildGrounding({
          grounded:
            false,

          status:
            "not_applicable",

          source:
            null,

          authorityChain:
            [],

          reason
        }),

      deterministicDraft:
        "",

      source:
        null,

      authorityChain:
        [],

      authorityPacket:
        null,

      confidence:
        "none",

      confidenceScore:
        0,

      realization:
        this.buildRealization({
          needsAIWriter:
            false,

          mode:
            "none"
        }),

      responseControl:
        context.responseControl,

      answerAvailable:
        false,

      guidanceAvailable:
        false,

      request,
      context,
      eligibility
    });
  },

  buildAuthorityUnavailableResult({
    type = "character_reasoning",
    focus = null,
    subject = null,
    authority = null,
    reason = "",
    authorityPacket = null,
    request = {},
    context = {},
    eligibility = {}
  } = {}) {
    return this.buildFocusedResult({
      type,

      subtype:
        "authority_unavailable",

      focus,

      subject,

      status:
        this.buildStatus({
          overall:
            "unavailable",

          type
        }),

      answer:
        null,

      reasoning:
        reason,

      grounding:
        this.buildGrounding({
          grounded:
            false,

          status:
            "unavailable",

          source:
            authority,

          authorityChain:
            authority
              ? [
                  authority
                ]
              : [],

          reason
        }),

      deterministicDraft:
        "",

      source:
        authority,

      authorityChain:
        authority
          ? [
              authority
            ]
          : [],

      authorityPacket,

      confidence:
        "none",

      confidenceScore:
        0,

      realization:
        this.buildRealization({
          needsAIWriter:
            false,

          mode:
            "none"
        }),

      responseControl:
        context.responseControl,

      answerAvailable:
        false,

      guidanceAvailable:
        false,

      request,
      context,
      eligibility
    });
  },

  buildAuthorityErrorResult({
    type = "character_reasoning",
    focus = null,
    subject = null,
    authority = null,
    error = null,
    request = {},
    context = {},
    eligibility = {}
  } = {}) {
    console.error(
      `Ari Character authority error: ${authority}`,
      error
    );

    return this.buildAuthorityUnavailableResult({
      type,
      focus,
      subject,
      authority,

      reason:
        error?.message ||
        String(error) ||
        "character_authority_resolution_failed",

      request,
      context,
      eligibility
    });
  },

  /* =====================================================
     STATUS
  ===================================================== */

  buildStatus({
    overall = "stable",
    type = null
  } = {}) {
    return {
      overall,

      preferenceStatus:
        type ===
          "character_preference"
          ? overall
          : null,

      worldviewStatus:
        [
          "character_worldview",
          "character_perspective"
        ].includes(
          type
        )
          ? overall
          : null,

      identityStatus:
        type ===
          "character_identity"
          ? overall
          : null,

      canonical:
        overall ===
        "canonical",

      inferred:
        overall ===
        "inferred",

      open:
        overall ===
        "open",

      stable:
        overall ===
        "stable",

      background:
        overall ===
        "background",

      unavailable:
        overall ===
        "unavailable",

      notApplicable:
        overall ===
        "not_applicable"
    };
  },

  /* =====================================================
     GROUNDING
  ===================================================== */

  buildGrounding({
    grounded = false,
    status = null,
    source = null,
    authorityChain = [],
    canonicalValue = null,
    inferredValue = null,
    openStatus = false,
    worldviewPosition = null,
    identityStatement = null,
    reason = null
  } = {}) {
    return {
      grounded:
        grounded ===
        true,

      explicit:
        true,

      status,

      source,

      authorityChain:
        this.toArray(
          authorityChain
        ),

      canonicalValue,

      inferredValue,

      openStatus:
        openStatus ===
          true ||
        status ===
          "open",

      worldviewPosition,

      identityStatement,

      reason:
        reason ||
        (
          grounded ===
            true
            ? "authorized_character_authority_resolved_answer"
            : "character_answer_not_grounded"
        ),

      authority:
        "ari-character-reasoning-engine"
    };
  },

  /* =====================================================
     REALIZATION
  ===================================================== */

  buildRealization({
    needsAIWriter = false,
    mode = null,
    aiWriterMode = null,
    aiInstruction = "",
    preserveValue = false,
    preserveIdentity = false,
    preservePosition = false,
    preserveOpenStatus = false,
    preserveUncertainty = false,
    preserveTradeoffs = false,
    tentativeLanguageRequired = false
  } = {}) {
    const needsAI =
      needsAIWriter ===
      true;

    return {
      mode:
        mode ||
        (
          needsAI
            ? "optional_ai_realization"
            : "local_candidate_preferred"
        ),

      needsAIWriter:
        needsAI,

      aiWriterMode:
        needsAI
          ? aiWriterMode ||
            "character_natural_realization"
          : null,

      aiInstruction:
        needsAI
          ? this.cleanText(
              aiInstruction
            )
          : "",

      preserveMeaning:
        true,

      preserveStatus:
        true,

      preserveValue:
        preserveValue ===
        true,

      preserveIdentity:
        preserveIdentity ===
        true,

      preservePosition:
        preservePosition ===
        true,

      preserveOpenStatus:
        preserveOpenStatus ===
        true,

      preserveUncertainty:
        preserveUncertainty ===
        true,

      preserveTradeoffs:
        preserveTradeoffs ===
        true,

      tentativeLanguageRequired:
        tentativeLanguageRequired ===
        true,

      mayVaryWording:
        true,

      mayAddFacts:
        false,

      mayAddMeaning:
        false,

      mayInventPreference:
        false,

      mayInventIdentity:
        false,

      mayInventWorldview:
        false,

      mayInventExperience:
        false,

      mayModifyCharacterAuthority:
        false,

      mayPromoteToCanonical:
        false
    };
  },

  /* =====================================================
     RESPONSE CONTROL
  ===================================================== */

  normalizeResponseControl(
    control = {}
  ) {
    return {
      requiredBehaviors:
        this.toArray(
          control
            ?.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.toArray(
          control
            ?.forbiddenBehaviors
        ),

      constraints:
        this.toArray(
          control
            ?.constraints
        ),

      rules:
        this.toArray(
          control?.rules
        )
    };
  },

  mergeResponseControls(
    ...controls
  ) {
    return {
      requiredBehaviors:
        this.mergeUnique(
          ...controls.map(
            control =>
              control
                ?.requiredBehaviors
          )
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          ...controls.map(
            control =>
              control
                ?.forbiddenBehaviors
          )
        ),

      constraints:
        this.mergeUnique(
          ...controls.map(
            control =>
              control
                ?.constraints
          )
        ),

      rules:
        this.mergeUnique(
          ...controls.map(
            control =>
              control?.rules
          )
        )
    };
  },

  /* =====================================================
     NORMALIZATION
  ===================================================== */

  normalizeMeaning(
    meaning = null
  ) {
    if (
      !meaning ||
      typeof meaning !==
        "object"
    ) {
      return {
        central:
          null,

        associations:
          [],

        reasoning:
          [],

        values:
          [],

        tradeoffs:
          [],

        uncertainty:
          [],

        implications:
          []
      };
    }

    return {
      ...meaning,

      central:
        this.cleanText(
          meaning.central ||
          meaning.position ||
          meaning.summary ||
          ""
        ) ||
        null,

      associations:
        this.toArray(
          meaning.associations
        ),

      reasoning:
        this.toArray(
          meaning.reasoning
        ),

      values:
        this.toArray(
          meaning.values
        ),

      tradeoffs:
        this.toArray(
          meaning.tradeoffs
        ),

      uncertainty:
        this.toArray(
          meaning.uncertainty
        ),

      implications:
        this.toArray(
          meaning.implications
        )
    };
  },

  normalizeRelationship(
    relationship = null
  ) {
    if (
      !relationship ||
      typeof relationship !==
        "object"
    ) {
      return {
        available:
          false,

        posture:
          {},

        guidance: {
          requiredBehaviors:
            [],

          forbiddenBehaviors:
            [],

          constraints:
            []
        },

        responseControl:
          this.normalizeResponseControl()
      };
    }

    return {
      ...relationship,

      available:
        relationship
          .relationshipStyleAvailable !==
        false,

      posture:
        relationship.posture ||
        {},

      guidance: {
        requiredBehaviors:
          this.toArray(
            relationship
              .guidance
              ?.requiredBehaviors
          ),

        forbiddenBehaviors:
          this.toArray(
            relationship
              .guidance
              ?.forbiddenBehaviors
          ),

        constraints:
          this.toArray(
            relationship
              .guidance
              ?.constraints
          )
      },

      responseControl:
        this.normalizeResponseControl(
          relationship
            .responseControl
        )
    };
  },

  normalizeBudget(
    budget = {}
  ) {
    return {
      hardSuppressed:
        budget
          ?.hardSuppressed ===
        true,

      allowPresenceOnly:
        budget
          ?.allowPresenceOnly ===
        true,

      allowWarmth:
        budget?.allowWarmth !==
        false,

      allowHumor:
        budget?.allowHumor !==
        false,

      maxCharacterSentences:
        this.numberOr(
          budget
            ?.maxCharacterSentences,
          0
        ),

      maxRelationshipSentences:
        this.numberOr(
          budget
            ?.maxRelationshipSentences,
          0
        ),

      reason:
        budget?.reason ||
        null
    };
  },

  normalizeImplementationDisclosure(
    disclosure = {}
  ) {
    return {
      directlyRequested:
        disclosure
          ?.directlyRequested ===
        true,

      required:
        disclosure?.required ===
        true,

      allowed:
        disclosure?.allowed ===
          true ||
        disclosure?.required ===
          true,

      reason:
        disclosure?.reason ||
        null
    };
  },

  /* =====================================================
     LOCAL AUTHORITY ACCESS
  ===================================================== */

  getConstitution() {
    try {
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
    } catch (error) {
      console.error(
        "Ari Constitution read failed:",
        error
      );

      return null;
    }
  },

  getCharacterCore() {
    try {
      return (
        window.AriCharacterCore
          ?.getCore?.() ||
        window.AriCharacterCore
          ?.buildCorePacket?.() ||
        null
      );
    } catch (error) {
      console.error(
        "Ari Character Core read failed:",
        error
      );

      return null;
    }
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getResultAuthority() {
    return {
      canResolveFocusedCharacterMeaning:
        true,

      canSelectAuthorizedCharacterAuthority:
        true,

      canDeclareExplicitGrounding:
        true,

      canDeclareCharacterStatus:
        true,

      canProduceDeterministicDraft:
        true,

      canAuthorizeAIRealization:
        true,

      canCreateResponseCandidate:
        false,

      canCreateComposerPacket:
        false,

      canWriteFinalResponse:
        false,

      role:
        "focused_character_meaning_resolution"
    };
  },

  getAuthorityBoundaries() {
    return {
      localOnly:
        true,

      characterMeaningAuthority:
        true,

      canReadCharacterContext:
        true,

      canReadConstitution:
        true,

      canReadCharacterCore:
        true,

      canReadCharacterInstincts:
        true,

      canReadCanonicalPreferences:
        true,

      canCallPreferenceResolver:
        true,

      canReadWorldview:
        true,

      canReadRelationshipStyle:
        true,

      canResolveFocusedIdentityMeaning:
        true,

      canResolveFocusedPreferenceMeaning:
        true,

      canResolveFocusedWorldviewMeaning:
        true,

      canDeclareExplicitGrounding:
        true,

      canBuildDeterministicDraftEvidence:
        true,

      canAuthorizeAIRealization:
        true,

      canModifyCanonicalPreference:
        false,

      canPromoteInferenceToCanonical:
        false,

      canInventPreferenceCandidate:
        false,

      canCreateIdentity:
        false,

      canCreateWorldviewPosition:
        false,

      canInventCharacterExperience:
        false,

      canInventCharacterMemory:
        false,

      canClassifyConversation:
        false,

      canOverrideSemanticMeaning:
        false,

      canOverrideConversationFunction:
        false,

      canOverrideSituationContract:
        false,

      canOverrideSafety:
        false,

      canOverrideFacts:
        false,

      canOverrideUserIntent:
        false,

      canCreateResponsePlan:
        false,

      canCreateComposerPacket:
        false,

      canRegisterResponseCandidate:
        false,

      canDetermineBlueprintEligibility:
        false,

      canDetermineAIWriterActivation:
        false,

      canSelectFinalDraft:
        false,

      canWriteFinalResponse:
        false,

      canRetrieveUserMemory:
        false,

      canStoreUserMemory:
        false,

      canAccessSupabase:
        false,

      canExecuteTools:
        false,

      canPersistState:
        false,

      role:
        "focused_grounded_character_meaning_authority"
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
      "responseGoal",
      "responseShape",
      "responseMoves",
      "canonicalResponsePlan",
      "composerPacket",
      "candidateDrafts",
      "selectedDraft",
      "finalResponse",
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
      "characterIdentity",
      "worldviewPosition"
    ];
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const boundaries =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canModifyCanonicalPreference",
      "canPromoteInferenceToCanonical",
      "canInventPreferenceCandidate",
      "canCreateIdentity",
      "canCreateWorldviewPosition",
      "canInventCharacterExperience",
      "canInventCharacterMemory",
      "canClassifyConversation",
      "canOverrideSemanticMeaning",
      "canOverrideConversationFunction",
      "canOverrideSituationContract",
      "canOverrideSafety",
      "canOverrideFacts",
      "canOverrideUserIntent",
      "canCreateResponsePlan",
      "canCreateComposerPacket",
      "canRegisterResponseCandidate",
      "canDetermineBlueprintEligibility",
      "canDetermineAIWriterActivation",
      "canSelectFinalDraft",
      "canWriteFinalResponse",
      "canRetrieveUserMemory",
      "canStoreUserMemory",
      "canAccessSupabase",
      "canExecuteTools",
      "canPersistState"
    ];

    const errors =
      forbiddenTrue
        .filter(
          key =>
            boundaries[key] ===
            true
        )
        .map(
          key =>
            `${key}_must_be_false`
        );

    const warnings = [];

    if (
      !window
        .AriCharacterContextEngine
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
      !window
        .AriCharacterPreferenceResolver
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
        errors.length ===
        0,

      source:
        "ari-character-reasoning-engine-validation",

      version:
        this.version,

      errors,

      warnings,

      checks: {
        stableFocusedContract:
          true,

        explicitGroundingRequired:
          true,

        composerHintsRemoved:
          true,

        candidateRegistrationDisabled:
          boundaries
            .canRegisterResponseCandidate ===
          false,

        composerPacketAuthorityDisabled:
          boundaries
            .canCreateComposerPacket ===
          false,

        canonicalMutationDisabled:
          boundaries
            .canModifyCanonicalPreference ===
          false,

        inferencePromotionDisabled:
          boundaries
            .canPromoteInferenceToCanonical ===
          false,

        identityCreationDisabled:
          boundaries
            .canCreateIdentity ===
          false,

        worldviewCreationDisabled:
          boundaries
            .canCreateWorldviewPosition ===
          false,

        semanticOverrideDisabled:
          boundaries
            .canOverrideSemanticMeaning ===
          false,

        situationContractOverrideDisabled:
          boundaries
            .canOverrideSituationContract ===
          false,

        finalDraftSelectionDisabled:
          boundaries
            .canSelectFinalDraft ===
          false,

        finalResponseAuthorityDisabled:
          boundaries
            .canWriteFinalResponse ===
          false,

        supabaseDisabled:
          boundaries
            .canAccessSupabase ===
          false
      }
    };
  },

  getReasoningEngine() {
    const validation =
      this.validate();

    return {
      characterReasoningEngineRan:
        true,

      characterReasoningEngineReady:
        validation.valid ===
        true,

      characterReasoningEngineVersion:
        this.version,

      characterReasoningEngineSource:
        this.source,

      authorityLevel:
        this.authorityLevel,

      outputSchema:
        "ari_focused_character_reasoning",

      boundaries:
        this.getAuthorityBoundaries(),

      validation
    };
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  cleanAnswerValue(
    value = ""
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return this.joinNaturalList(
        value
      );
    }

    return this.cleanText(
      value
    );
  },

  cleanText(
    value = ""
  ) {
    return String(
      value ??
      ""
    )
      .replace(
        /[’‘]/g,
        "'"
      )
      .replace(
        /[“”]/g,
        "\""
      )
      .replace(
        /[ \t]+/g,
        " "
      )
      .replace(
        /\n[ \t]+/g,
        "\n"
      )
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim();
  },

  normalize(
    value = ""
  ) {
    return this.cleanText(
      value
    )
      .toLowerCase()
      .replace(
        /[_-]/g,
        " "
      )
      .replace(
        /[^\w\s'?.,!:%-]/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  },

  normalizeForComparison(
    value = ""
  ) {
    return this.normalize(
      value
    )
      .replace(
        /[^\w\s']/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  },

  toArray(value) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value.filter(
        item =>
          item !==
            undefined &&
          item !==
            null &&
          item !==
            ""
      );
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [
      value
    ];
  },

  mergeUnique(
    ...values
  ) {
    const output = [];
    const seen =
      new Set();

    values
      .flatMap(
        value =>
          this.toArray(
            value
          )
      )
      .forEach(
        value => {
          const key =
            typeof value ===
              "string"
              ? this
                  .normalizeForComparison(
                    value
                  )
              : this
                  .normalizeForComparison(
                    value?.id ||
                    value?.name ||
                    value?.type ||
                    value?.value ||
                    value?.claim ||
                    this.safeJSONStringify(
                      value
                    )
                  );

          if (
            !key ||
            seen.has(
              key
            )
          ) {
            return;
          }

          seen.add(
            key
          );

          output.push(
            value
          );
        }
      );

    return output;
  },

  safeJSONStringify(
    value = null
  ) {
    const seen =
      new WeakSet();

    try {
      return JSON.stringify(
        value,
        (
          key,
          nestedValue
        ) => {
          if (
            nestedValue &&
            typeof nestedValue ===
              "object"
          ) {
            if (
              seen.has(
                nestedValue
              )
            ) {
              return "[Circular]";
            }

            seen.add(
              nestedValue
            );
          }

          return nestedValue;
        }
      );
    } catch (error) {
      return "";
    }
  },

  numberOr(
    value,
    fallback = 0
  ) {
    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number
      : fallback;
  },

  clampConfidence(
    value = 0
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(
        number
      )
    ) {
      return 0;
    }

    if (
      number > 1
    ) {
      return Math.max(
        0,
        Math.min(
          1,
          number / 100
        )
      );
    }

    return Math.max(
      0,
      Math.min(
        1,
        number
      )
    );
  },

  joinNaturalList(
    values = []
  ) {
    const list =
      this.toArray(
        values
      )
        .map(
          value =>
            this.cleanText(
              value
            )
        )
        .filter(Boolean);

    if (!list.length) {
      return "";
    }

    if (
      list.length ===
      1
    ) {
      return list[0];
    }

    if (
      list.length ===
      2
    ) {
      return (
        `${list[0]} and ` +
        `${list[1]}`
      );
    }

    return (
      `${list
        .slice(0, -1)
        .join(", ")}, and ` +
      `${list[
        list.length - 1
      ]}`
    );
  },

  humanizeFocus(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .replace(
        /^favorite/,
        ""
      )
      .replace(
        /([a-z])([A-Z])/g,
        "$1 $2"
      )
      .replace(
        /_/g,
        " "
      )
      .toLowerCase()
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  },

  capitalize(
    value = ""
  ) {
    const text =
      this.cleanText(
        value
      );

    if (!text) {
      return "";
    }

    return (
      text.charAt(0)
        .toUpperCase() +
      text.slice(1)
    );
  },

  lowercaseFirst(
    value = ""
  ) {
    const text =
      this.cleanText(
        value
      );

    if (!text) {
      return "";
    }

    return (
      text.charAt(0)
        .toLowerCase() +
      text.slice(1)
    );
  },

  ensureSentence(
    value = ""
  ) {
    const text =
      this.cleanText(
        value
      );

    if (!text) {
      return "";
    }

    return /[.!?]$/.test(
      text
    )
      ? text
      : `${text}.`;
  },

  hasAny(
    text = "",
    phrases = []
  ) {
    return this.toArray(
      phrases
    ).some(
      phrase =>
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
    const normalizedText =
      this.normalize(
        text
      );

    const normalizedTerm =
      this.normalize(
        term
      );

    if (!normalizedTerm) {
      return false;
    }

    const escaped =
      this.escapeRegex(
        normalizedTerm
      );

    return normalizedTerm.includes(
      " "
    )
      ? new RegExp(
          `(^|\\b)${escaped}(\\b|$)`,
          "i"
        ).test(
          normalizedText
        )
      : new RegExp(
          `\\b${escaped}\\b`,
          "i"
        ).test(
          normalizedText
        );
  },

  escapeRegex(
    value = ""
  ) {
    return String(
      value
    ).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
  }
};

window.Ari.characterReasoningEngine =
  window.AriCharacterReasoningEngine;

console.log(
  "ARI CHARACTER REASONING ENGINE LOADED:",
  window.AriCharacterReasoningEngine?.version,
  window.AriCharacterReasoningEngine
    ?.validate?.().valid ===
    true
    ? "READY"
    : "INVALID"
);