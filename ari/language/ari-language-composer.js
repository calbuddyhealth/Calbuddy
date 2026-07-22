// ari/language/ari-language-composer.js
// Ari Language Composer
//
// Purpose:
// Preserve and deterministically normalize the authoritative OpenAI draft
// into Ari's final user-facing response without changing semantic meaning.
//
// V11.0.0 — Authoritative Draft Final Renderer / No Realization Dependency
//
// Canonical flow:
//
// Deliberation Pipeline
//      ↓
// Authoritative Draft
//      ↓
// Character Guidance Metadata
//      ↓
// Language Guidance Metadata
//      ↓
// Ari Language Composer
//      ↓
// Final Composition Stage
//      ↓
// Expression Packet
//      ↓
// Delivery Pipeline
//
// Responsibilities:
// - Read one authoritative draft.
// - Preserve the complete authorized response.
// - Apply bounded presentation normalization only.
// - Apply approved Character and language presentation guidance.
// - Optionally apply an approved emoji recommendation.
// - Preserve Markdown, lists, tables, blockquotes, and fenced code.
// - Validate the final rendered response.
// - Return one explicit final-composition result.
// - Fall back to the untouched authoritative draft when optional rendering
//   is unavailable or unsafe.
//
// Non-responsibilities:
// - Does not call OpenAI.
// - Does not answer the user's question independently.
// - Does not use general model knowledge.
// - Does not reinterpret semantic meaning.
// - Does not choose a response strategy.
// - Does not create response moves.
// - Does not run Response Realization.
// - Does not run Blueprint Writer.
// - Does not run AI Writer.
// - Does not create or compare candidates.
// - Does not arbitrate drafts.
// - Does not inspect GitHub or file evidence.
// - Does not create artifact patches.
// - Does not create medical or safety guidance.
// - Does not override safety.
// - Does not retrieve or save memory.
// - Does not persist runtime state.

window.Ari = window.Ari || {};

window.AriLanguageComposer = {
  version: "11.0.0",
  schemaVersion: "11.0.0",
  source: "ari-language-composer",
  architecture: "authoritative-draft-final-renderer",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async compose(input = {}) {
    const context =
      this.readCompositionContext(
        input
      );

    if (
      context.lockedResponse
    ) {
      return this.composeLockedResponse(
        context
      );
    }

    if (
      !context.authoritativeDraft
    ) {
      return this.returnFailure({
        reason:
          "authoritative_draft_missing",

        context
      });
    }

    const rendering =
      this.renderAuthoritativeDraft(
        context
      );

    const validation =
      this.validateRenderedResponse({
        rendering,
        context
      });

    if (
      validation.valid !==
      true
    ) {
      return this.returnDraftFallback({
        reason:
          validation.reason ||
          "rendered_response_failed_validation",

        context,
        rendering,
        validation
      });
    }

    return this.returnSuccess({
      context,
      rendering,
      validation
    });
  },

  /* =====================================================
     INPUT CONTEXT
  ===================================================== */

  readCompositionContext(
    input = {}
  ) {
    const summary =
      this.readObject(
        input.summary
      ) ||
      {};

    const authoritativeDraft =
      this.resolveAuthoritativeDraft({
        input,
        summary
      });

    const authoritativeDraftSource =
      this.resolveAuthoritativeDraftSource({
        input,
        summary
      });

    const lockedResponse =
      this.readLockedResponse({
        input,
        summary
      });

    const character =
      this.readCharacterGuidance({
        input,
        summary
      });

    const languageGuidance =
      this.readLanguageGuidance({
        input,
        summary
      });

    const responseControl =
      this.readResponseControl({
        input,
        summary
      });

    const safety =
      this.readSafety({
        input,
        summary
      });

    const request =
      this.readRequest({
        input,
        summary
      });

    const presentation =
      this.readPresentationPolicy({
        input,
        summary,
        character,
        languageGuidance,
        responseControl,
        safety
      });

    return {
      input,
      summary,

      authoritativeDraft,
      authoritativeDraftSource,

      lockedResponse,

      character,
      languageGuidance,
      responseControl,
      safety,
      request,
      presentation
    };
  },

  resolveAuthoritativeDraft({
    input = {},
    summary = {}
  } = {}) {
    return this.firstText(
      input.authoritativeDraft,

      input.compositionInputText,

      input.draftResponse,

      input.responseText,

      input.selectedDraft,

      input.finalResponse,

      summary.authoritativeDraft,

      summary.compositionInputText,

      summary.draftResponse,

      summary.responseText,

      summary.selectedDraft,

      summary.cognitiveReasoningResult
        ?.authoritativeDraft,

      summary.cognitiveReasoningResult
        ?.draftResponse,

      summary.cognitiveReasoningResult
        ?.responseText,

      summary.deliberationPacket
        ?.authoritativeDraft,

      summary.deliberationPacket
        ?.selectedDraft,

      summary.deliberationPacket
        ?.draftResponse,

      summary.deliberationPacket
        ?.responseText,

      summary.deliberationPacket
        ?.reasoning
        ?.authoritativeDraft,

      summary.deliberationPacket
        ?.reasoning
        ?.draftResponse,

      summary.deliberationPacket
        ?.reasoning
        ?.responseText,

      summary.deliberationPacket
        ?.reasoning
        ?.result
        ?.authoritativeDraft,

      summary.deliberationPacket
        ?.reasoning
        ?.result
        ?.draftResponse,

      summary.deliberationPacket
        ?.reasoning
        ?.result
        ?.responseText
    );
  },

  resolveAuthoritativeDraftSource({
    input = {},
    summary = {}
  } = {}) {
    const candidates = [
      [
        "input.authoritativeDraft",
        input.authoritativeDraft
      ],

      [
        "input.compositionInputText",
        input.compositionInputText
      ],

      [
        "input.draftResponse",
        input.draftResponse
      ],

      [
        "summary.authoritativeDraft",
        summary.authoritativeDraft
      ],

      [
        "summary.compositionInputText",
        summary.compositionInputText
      ],

      [
        "summary.draftResponse",
        summary.draftResponse
      ],

      [
        "summary.cognitiveReasoningResult.authoritativeDraft",
        summary.cognitiveReasoningResult
          ?.authoritativeDraft
      ],

      [
        "summary.cognitiveReasoningResult.draftResponse",
        summary.cognitiveReasoningResult
          ?.draftResponse
      ],

      [
        "summary.deliberationPacket.authoritativeDraft",
        summary.deliberationPacket
          ?.authoritativeDraft
      ],

      [
        "summary.deliberationPacket.reasoning.authoritativeDraft",
        summary.deliberationPacket
          ?.reasoning
          ?.authoritativeDraft
      ]
    ];

    for (
      const [
        source,
        value
      ] of candidates
    ) {
      if (
        this.extractText(
          value
        )
      ) {
        return source;
      }
    }

    return null;
  },

  /* =====================================================
     PRESENTATION POLICY
  ===================================================== */

  readPresentationPolicy({
    input = {},
    summary = {},
    character = {},
    languageGuidance = {},
    responseControl = {},
    safety = {}
  } = {}) {
    const directPolicy =
      this.firstObject(
        input.presentationPolicy,
        summary.presentationPolicy,
        languageGuidance
          .presentationPolicy,
        languageGuidance.handoff
          ?.presentationPolicy
      );

    const suggestedEmoji =
      this.normalizeSuggestedEmoji(
        directPolicy.suggestedEmoji ||
        languageGuidance
          .suggestedEmoji ||
        languageGuidance.handoff
          ?.suggestedEmoji ||
        character.suggestedEmoji ||
        character.handoff
          ?.suggestedEmoji ||
        summary.suggestedEmoji ||
        ""
      );

    const emojiPlacement =
      this.normalizeEmojiPlacement({
        placement:
          directPolicy.emojiPlacement ||
          languageGuidance
            .emojiPlacement ||
          languageGuidance.handoff
            ?.emojiPlacement ||
          character.emojiPlacement ||
          character.handoff
            ?.emojiPlacement ||
          summary.emojiPlacement ||
          "none",

        emoji:
          suggestedEmoji
      });

    const maySmoothLanguage =
      directPolicy
        .maySmoothLanguage ===
        true ||
      languageGuidance
        .maySmoothLanguage ===
        true ||
      languageGuidance.handoff
        ?.maySmoothLanguage ===
        true;

    const mayNormalizeWhitespace =
      directPolicy
        .mayNormalizeWhitespace !==
        false;

    const useSuggestedEmoji =
      Boolean(
        suggestedEmoji
      ) &&
      directPolicy
        .useSuggestedEmoji !==
        false &&
      languageGuidance
        .useSuggestedEmoji !==
        false &&
      languageGuidance.handoff
        ?.useSuggestedEmoji !==
        false;

    return {
      maySmoothLanguage,

      mayNormalizeWhitespace,

      preserveMeaning:
        true,

      preserveResponseText:
        true,

      preserveMarkdown:
        true,

      preserveCode:
        true,

      preserveTables:
        true,

      preserveLists:
        true,

      preserveBlockquotes:
        true,

      useSuggestedEmoji,

      suggestedEmoji,

      emojiPlacement,

      emojiPurpose:
        this.cleanInlineText(
          directPolicy.emojiPurpose ||
          languageGuidance
            .emojiPurpose ||
          languageGuidance.handoff
            ?.emojiPurpose ||
          character.emojiPurpose ||
          ""
        ) ||
        null,

      maximumWords:
        this.firstFiniteNumber([
          directPolicy.maximumWords,
          directPolicy.maxWords,
          responseControl
            .maximumWords,
          null
        ]),

      maximumSentences:
        this.firstFiniteNumber([
          directPolicy.maximumSentences,
          directPolicy.maxSentences,
          responseControl
            .maximumSentences,
          null
        ]),

      maximumParagraphs:
        this.firstFiniteNumber([
          directPolicy.maximumParagraphs,
          directPolicy.maxParagraphs,
          responseControl
            .maximumParagraphs,
          null
        ]),

      safetyRestricted:
        this.emojiBlockedByContext({
          safety,
          authoritativeDraft:
            this.resolveAuthoritativeDraft({
              input,
              summary
            })
        }),

      source:
        directPolicy.source ||
        languageGuidance.source ||
        "ari-language-composer-default-presentation-policy"
    };
  },

  /* =====================================================
     RENDERING
  ===================================================== */

  renderAuthoritativeDraft(
    context = {}
  ) {
    const originalText =
      this.extractText(
        context.authoritativeDraft
      );

    const structure =
      this.inspectTextStructure(
        originalText
      );

    let renderedText =
      originalText;

    if (
      context.presentation
        ?.maySmoothLanguage ===
        true &&
      structure.containsFencedCode !==
        true &&
      structure.containsMarkdownTable !==
        true
    ) {
      renderedText =
        this.smoothNaturalLanguage({
          text:
            renderedText,

          context,

          structure
        });
    }

    if (
      context.presentation
        ?.mayNormalizeWhitespace !==
        false
    ) {
      renderedText =
        this.normalizeWhitespace({
          text:
            renderedText,

          preserveLineStructure:
            structure
              .preserveLineStructure
        });
    }

    const budgetReview =
      this.reviewPresentationBudget({
        text:
          renderedText,

        context,

        structure:
          this.inspectTextStructure(
            renderedText
          )
      });

    const emojiResult =
      this.applySuggestedEmoji({
        text:
          renderedText,

        context
      });

    renderedText =
      emojiResult.text;

    renderedText =
      this.finalPolish({
        text:
          renderedText,

        structure:
          this.inspectTextStructure(
            renderedText
          )
      });

    return {
      originalText,

      text:
        renderedText,

      changed:
        renderedText !==
        originalText,

      authoritativeDraftPreserved:
        Boolean(
          originalText
        ),

      emojiApplied:
        emojiResult.applied,

      emoji:
        emojiResult.emoji,

      emojiPlacement:
        emojiResult.placement,

      emojiReason:
        emojiResult.reason,

      structure:
        this.inspectTextStructure(
          renderedText
        ),

      budgetReview,

      source:
        this.source
    };
  },

  smoothNaturalLanguage({
    text = "",
    context = {},
    structure = {}
  } = {}) {
    let value =
      String(
        text ||
        ""
      );

    if (!value) {
      return "";
    }

    if (
      structure.containsList ===
        true ||
      structure.containsHeading ===
        true ||
      structure.containsBlockquote ===
        true
    ) {
      return value
        .split(
          "\n"
        )
        .map(
          line =>
            this.smoothLine(
              line,
              context
            )
        )
        .join(
          "\n"
        );
    }

    return this.smoothLine(
      value,
      context
    );
  },

  smoothLine(
    line = "",
    context = {}
  ) {
    const original =
      String(
        line ||
        ""
      );

    const prefixMatch =
      original.match(
        /^(\s*(?:[-*+]|\d+[.)]|#{1,6}|>)\s+)/
      );

    const prefix =
      prefixMatch?.[1] ||
      "";

    let text =
      prefix
        ? original.slice(
            prefix.length
          )
        : original;

    text =
      text
        .replace(
          /[ \t]{2,}/g,
          " "
        )
        .replace(
          /\s+([,.!?;:])/g,
          "$1"
        )
        .trim();

    return `${prefix}${text}`;
  },

  /* =====================================================
     PRESENTATION BUDGET REVIEW
  ===================================================== */

  reviewPresentationBudget({
    text = "",
    context = {},
    structure = {}
  } = {}) {
    const policy =
      context.presentation ||
      {};

    const warnings = [];

    const wordCount =
      this.countWords(
        text
      );

    const sentenceCount =
      this.splitSentences(
        text
      ).length;

    const paragraphCount =
      this.countParagraphs(
        text
      );

    if (
      policy.maximumWords &&
      wordCount >
        policy.maximumWords
    ) {
      warnings.push({
        type:
          "maximum_words_exceeded_preserved",

        maximum:
          policy.maximumWords,

        actual:
          wordCount
      });
    }

    if (
      policy.maximumSentences &&
      sentenceCount >
        policy.maximumSentences
    ) {
      warnings.push({
        type:
          "maximum_sentences_exceeded_preserved",

        maximum:
          policy.maximumSentences,

        actual:
          sentenceCount
      });
    }

    if (
      policy.maximumParagraphs &&
      paragraphCount >
        policy.maximumParagraphs
    ) {
      warnings.push({
        type:
          "maximum_paragraphs_exceeded_preserved",

        maximum:
          policy.maximumParagraphs,

        actual:
          paragraphCount
      });
    }

    return {
      reviewed:
        true,

      textPreserved:
        true,

      truncationApplied:
        false,

      structuredContentPreserved:
        structure
          .preserveLineStructure ===
        true,

      wordCount,

      sentenceCount,

      paragraphCount,

      warnings
    };
  },

  /* =====================================================
     EMOJI
  ===================================================== */

  applySuggestedEmoji({
    text = "",
    context = {}
  } = {}) {
    const presentation =
      context.presentation ||
      {};

    const emoji =
      this.normalizeSuggestedEmoji(
        presentation.suggestedEmoji
      );

    const placement =
      this.normalizeEmojiPlacement({
        placement:
          presentation.emojiPlacement,

        emoji
      });

    if (
      !text ||
      !emoji ||
      placement ===
        "none"
    ) {
      return {
        text,

        applied:
          false,

        emoji:
          "",

        placement:
          "none",

        reason:
          "emoji_not_requested"
      };
    }

    if (
      presentation
        .useSuggestedEmoji !==
      true
    ) {
      return {
        text,

        applied:
          false,

        emoji,

        placement:
          "none",

        reason:
          "emoji_not_authorized"
      };
    }

    if (
      presentation
        .safetyRestricted ===
      true
    ) {
      return {
        text,

        applied:
          false,

        emoji,

        placement:
          "none",

        reason:
          "emoji_blocked_by_safety_context"
      };
    }

    if (
      this.textAlreadyEndsWithEmoji(
        text
      ) ||
      text.includes(
        emoji
      )
    ) {
      return {
        text,

        applied:
          false,

        emoji,

        placement:
          "none",

        reason:
          "emoji_already_present"
      };
    }

    if (
      placement ===
      "start"
    ) {
      return {
        text:
          `${emoji} ${text}`,

        applied:
          true,

        emoji,

        placement:
          "start",

        reason:
          "emoji_applied_at_start"
      };
    }

    return {
      text:
        `${text} ${emoji}`,

      applied:
        true,

      emoji,

      placement:
        "end",

      reason:
        "emoji_applied_at_end"
    };
  },

  emojiBlockedByContext({
    safety = {},
    authoritativeDraft = ""
  } = {}) {
    const severity =
      this.normalizeIdentifier(
        safety.severity ||
        safety.disposition
          ?.severity ||
        safety.deepReview
          ?.severity ||
        ""
      );

    if (
      safety.shouldStopNormalResponse ===
        true ||
      [
        "critical",
        "high",
        "emergency",
        "immediate"
      ].includes(
        severity
      )
    ) {
      return true;
    }

    const responseText =
      this.normalizeText(
        authoritativeDraft
      );

    const graveSignals = [
      "call emergency services",
      "immediate danger",
      "suicidal",
      "suicide",
      "self harm",
      "self-harm",
      "someone has died",
      "passed away",
      "medical emergency",
      "go to the emergency room",
      "call 911",
      "poison control"
    ];

    return graveSignals.some(
      signal =>
        responseText.includes(
          signal
        )
    );
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validateRenderedResponse({
    rendering = {},
    context = {}
  } = {}) {
    const text =
      this.extractText(
        rendering.text
      );

    const errors = [];
    const warnings = [
      ...this.toArray(
        rendering
          .budgetReview
          ?.warnings
      )
    ];

    if (
      !context.authoritativeDraft
    ) {
      errors.push(
        "authoritative_draft_missing"
      );
    }

    if (!text) {
      errors.push(
        "rendered_response_empty"
      );
    }

    if (
      text &&
      text.length <
        2
    ) {
      errors.push(
        "rendered_response_too_short"
      );
    }

    if (
      this.containsInvalidValue(
        text
      )
    ) {
      errors.push(
        "rendered_response_contains_invalid_value"
      );
    }

    if (
      this.hasUnbalancedCodeFence(
        text
      )
    ) {
      errors.push(
        "rendered_response_has_unbalanced_code_fence"
      );
    }

    const authoritativeDraft =
      this.extractText(
        context.authoritativeDraft
      );

    if (
      authoritativeDraft &&
      text &&
      !this.meaningPreservationCheck({
        sourceText:
          authoritativeDraft,

        renderedText:
          text
      })
    ) {
      errors.push(
        "rendered_response_changed_meaning"
      );
    }

    const valid =
      errors.length ===
        0 &&
      Boolean(
        text
      );

    return {
      valid,

      usable:
        valid,

      authorized:
        Boolean(
          context.authoritativeDraft
        ),

      complete:
        valid,

      reason:
        errors[0] ||
        (
          warnings.length
            ? "rendered_response_valid_with_warnings"
            : "rendered_response_valid"
        ),

      errors:
        this.uniqueValues(
          errors
        ),

      warnings:
        this.uniqueValues(
          warnings
        ),

      length:
        text.length,

      wordCount:
        this.countWords(
          text
        ),

      sentenceCount:
        this.splitSentences(
          text
        ).length,

      paragraphCount:
        this.countParagraphs(
          text
        ),

      emojiApplied:
        rendering.emojiApplied ===
        true,

      source:
        this.source
    };
  },

  meaningPreservationCheck({
    sourceText = "",
    renderedText = ""
  } = {}) {
    const source =
      this.normalizeForComparison(
        sourceText
      );

    const rendered =
      this.normalizeForComparison(
        renderedText
      );

    if (
      !source ||
      !rendered
    ) {
      return false;
    }

    if (
      source ===
      rendered
    ) {
      return true;
    }

    const sourceTerms =
      new Set(
        source
          .split(
            " "
          )
          .filter(
            term =>
              term.length >
              3
          )
      );

    const renderedTerms =
      new Set(
        rendered
          .split(
            " "
          )
          .filter(
            term =>
              term.length >
              3
          )
      );

    if (
      !sourceTerms.size
    ) {
      return true;
    }

    let overlap =
      0;

    sourceTerms.forEach(
      term => {
        if (
          renderedTerms.has(
            term
          )
        ) {
          overlap +=
            1;
        }
      }
    );

    return (
      overlap /
      sourceTerms.size
    ) >=
      0.8;
  },

  /* =====================================================
     SUCCESS / FALLBACK / FAILURE
  ===================================================== */

  composeLockedResponse(
    context = {}
  ) {
    const finalResponse =
      this.extractText(
        context.lockedResponse
      );

    const valid =
      Boolean(
        finalResponse
      );

    const result = {
      schema:
        "ari_language_composer_result",

      schemaVersion:
        this.schemaVersion,

      ready:
        valid,

      usable:
        valid,

      complete:
        valid,

      languageComposerRan:
        true,

      languageComposerInvoked:
        true,

      languageComposerProducedResponse:
        valid,

      languageComposerUsable:
        valid,

      languageComposerAuthorized:
        valid,

      languageComposerDegraded:
        false,

      languageComposerSource:
        "locked-authoritative-response",

      languageComposerVersion:
        this.version,

      languageMode:
        "locked_response",

      languageBody:
        finalResponse,

      languageSections:
        this.toLanguageSections(
          finalResponse
        ),

      finalResponse,

      responseText:
        finalResponse,

      reply:
        finalResponse,

      source:
        "locked-authoritative-response",

      reason:
        valid
          ? "locked_response_preserved"
          : "locked_response_empty",

      authoritativeDraftAvailable:
        Boolean(
          context.authoritativeDraft
        ),

      authoritativeDraftSource:
        context.authoritativeDraftSource ||
        null,

      lockedResponseAuthorized:
        valid,

      composerUsedAI:
        false,

      composerValidation: {
        valid,

        usable:
          valid,

        authorized:
          valid,

        complete:
          valid,

        reason:
          valid
            ? "locked_response_preserved"
            : "locked_response_empty",

        errors:
          valid
            ? []
            : [
                "locked_response_empty"
              ],

        warnings:
          []
      },

      diagnostics: {
        mode:
          "locked_response",

        finalLength:
          finalResponse.length,

        wordCount:
          this.countWords(
            finalResponse
          ),

        sentenceCount:
          this.splitSentences(
            finalResponse
          ).length,

        paragraphCount:
          this.countParagraphs(
            finalResponse
          )
      },

      authority:
        this.getAuthorityBoundaries()
    };

    window.Ari.languageComposerState =
      result;

    return result;
  },

  returnSuccess({
    context = {},
    rendering = {},
    validation = {}
  } = {}) {
    const finalResponse =
      rendering.text;

    const result = {
      schema:
        "ari_language_composer_result",

      schemaVersion:
        this.schemaVersion,

      ready:
        true,

      usable:
        true,

      complete:
        true,

      languageComposerRan:
        true,

      languageComposerInvoked:
        true,

      languageComposerProducedResponse:
        true,

      languageComposerUsable:
        true,

      languageComposerAuthorized:
        true,

      languageComposerDegraded:
        false,

      languageComposerSource:
        this.source,

      languageComposerVersion:
        this.version,

      languageMode:
        "authoritative_draft",

      languageBody:
        finalResponse,

      languageSections:
        this.toLanguageSections(
          finalResponse
        ),

      finalResponse,

      responseText:
        finalResponse,

      reply:
        finalResponse,

      source:
        this.source,

      reason:
        validation.reason,

      authoritativeDraft:
        context.authoritativeDraft,

      authoritativeDraftAvailable:
        true,

      authoritativeDraftSource:
        context.authoritativeDraftSource ||
        null,

      authoritativeDraftFallbackUsed:
        false,

      lockedResponseAuthorized:
        false,

      composerUsedAI:
        false,

      composerValidation:
        validation,

      rendering: {
        changed:
          rendering.changed ===
          true,

        authoritativeDraftPreserved:
          rendering.authoritativeDraftPreserved ===
          true,

        emojiApplied:
          rendering.emojiApplied ===
          true,

        emoji:
          rendering.emoji ||
          "",

        emojiPlacement:
          rendering.emojiPlacement ||
          "none",

        emojiReason:
          rendering.emojiReason ||
          null,

        structure:
          rendering.structure ||
          null,

        budgetReview:
          rendering.budgetReview ||
          null
      },

      diagnostics: {
        originalLength:
          rendering.originalText
            ?.length ||
          0,

        finalLength:
          finalResponse.length,

        wordCount:
          validation.wordCount,

        sentenceCount:
          validation.sentenceCount,

        paragraphCount:
          validation.paragraphCount,

        warnings:
          validation.warnings ||
          [],

        errors:
          validation.errors ||
          []
      },

      authority:
        this.getAuthorityBoundaries()
    };

    window.Ari.languageComposerState =
      result;

    return result;
  },

  returnDraftFallback({
    reason =
      "rendering_failed_authoritative_draft_preserved",

    context = {},

    rendering = null,

    validation = null
  } = {}) {
    const finalResponse =
      this.extractText(
        context.authoritativeDraft
      );

    if (
      !finalResponse
    ) {
      return this.returnFailure({
        reason:
          "authoritative_draft_fallback_missing",

        context,
        rendering,
        validation
      });
    }

    const result = {
      schema:
        "ari_language_composer_result",

      schemaVersion:
        this.schemaVersion,

      ready:
        true,

      usable:
        true,

      complete:
        true,

      languageComposerRan:
        true,

      languageComposerInvoked:
        true,

      languageComposerProducedResponse:
        true,

      languageComposerUsable:
        true,

      languageComposerAuthorized:
        true,

      languageComposerDegraded:
        true,

      languageComposerSource:
        "authoritative-draft-fallback",

      languageComposerVersion:
        this.version,

      languageMode:
        "authoritative_draft_fallback",

      languageBody:
        finalResponse,

      languageSections:
        this.toLanguageSections(
          finalResponse
        ),

      finalResponse,

      responseText:
        finalResponse,

      reply:
        finalResponse,

      source:
        "authoritative-draft-fallback",

      reason,

      authoritativeDraft:
        finalResponse,

      authoritativeDraftAvailable:
        true,

      authoritativeDraftSource:
        context.authoritativeDraftSource ||
        null,

      authoritativeDraftFallbackUsed:
        true,

      lockedResponseAuthorized:
        false,

      composerUsedAI:
        false,

      composerValidation:
        validation ||
        {
          valid:
            false,

          usable:
            false,

          authorized:
            true,

          complete:
            false,

          reason,

          errors: [
            reason
          ],

          warnings:
            []
        },

      rendering,

      diagnostics: {
        fallbackUsed:
          true,

        originalLength:
          finalResponse.length,

        finalLength:
          finalResponse.length,

        reason
      },

      authority:
        this.getAuthorityBoundaries()
    };

    window.Ari.languageComposerState =
      result;

    return result;
  },

  returnFailure({
    reason =
      "language_composition_failed",

    context = {},

    rendering = null,

    validation = null
  } = {}) {
    const result = {
      schema:
        "ari_language_composer_result",

      schemaVersion:
        this.schemaVersion,

      ready:
        false,

      usable:
        false,

      complete:
        false,

      languageComposerRan:
        true,

      languageComposerInvoked:
        true,

      languageComposerProducedResponse:
        false,

      languageComposerUsable:
        false,

      languageComposerAuthorized:
        false,

      languageComposerDegraded:
        true,

      languageComposerSource:
        this.source,

      languageComposerVersion:
        this.version,

      languageMode:
        "failed",

      languageBody:
        "",

      languageSections:
        [],

      finalResponse:
        "",

      responseText:
        "",

      reply:
        "",

      source:
        this.source,

      reason,

      authoritativeDraftAvailable:
        Boolean(
          context.authoritativeDraft
        ),

      authoritativeDraftSource:
        context.authoritativeDraftSource ||
        null,

      authoritativeDraftFallbackUsed:
        false,

      lockedResponseAuthorized:
        false,

      composerUsedAI:
        false,

      composerValidation:
        validation ||
        {
          valid:
            false,

          usable:
            false,

          authorized:
            false,

          complete:
            false,

          reason,

          errors: [
            reason
          ],

          warnings:
            []
        },

      rendering,

      diagnostics: {
        reason
      },

      authority:
        this.getAuthorityBoundaries()
    };

    window.Ari.languageComposerState =
      result;

    return result;
  },

  /* =====================================================
     CHARACTER / LANGUAGE / CONTROL
  ===================================================== */

  readCharacterGuidance({
    input = {},
    summary = {}
  } = {}) {
    const handoff =
      this.firstObject(
        input.characterHandoff,
        input.character,
        summary.characterHandoff,
        summary.characterStagePacket
          ?.handoff
      );

    return {
      available:
        Object.keys(
          handoff
        ).length >
        0,

      handoff,

      emotion:
        handoff.emotion ||
        summary.emotion ||
        null,

      tone:
        handoff.tone ||
        null,

      warmth:
        handoff.warmth ||
        null,

      directness:
        handoff.directness ||
        null,

      expression:
        handoff.expression ||
        null,

      suggestedEmoji:
        handoff.suggestedEmoji ||
        null,

      emojiPlacement:
        handoff.emojiPlacement ||
        null,

      emojiPurpose:
        handoff.emojiPurpose ||
        null
    };
  },

  readLanguageGuidance({
    input = {},
    summary = {}
  } = {}) {
    const handoff =
      this.firstObject(
        input.languageGuidanceHandoff,
        input.languageGuidance,
        summary.languageGuidanceHandoff,
        summary.languageGuidanceStagePacket
          ?.handoff
      );

    const communicationPlan =
      this.firstObject(
        input.communicationPlan,
        handoff.communicationPlan,
        summary.communicationPlan
      );

    return {
      available:
        Object.keys(
          handoff
        ).length >
        0,

      handoff,

      communicationPlan,

      lexicalGrounding:
        input.lexicalGrounding ||
        handoff.lexicalGrounding ||
        summary.lexicalGrounding ||
        null,

      humanLanguageProfile:
        input.humanLanguageProfile ||
        handoff.humanLanguageProfile ||
        summary.humanLanguageProfile ||
        null,

      expressionPlan:
        input.expressionPlan ||
        handoff.expressionPlan ||
        summary.expressionPlan ||
        null,

      mouthDirective:
        input.mouthDirective ||
        handoff.mouthDirective ||
        summary.mouthDirective ||
        null,

      presentationPolicy:
        handoff.presentationPolicy ||
        null,

      maySmoothLanguage:
        handoff.maySmoothLanguage ===
        true,

      useSuggestedEmoji:
        handoff.useSuggestedEmoji !==
        false,

      suggestedEmoji:
        handoff.suggestedEmoji ||
        null,

      emojiPlacement:
        handoff.emojiPlacement ||
        null,

      emojiPurpose:
        handoff.emojiPurpose ||
        null,

      source:
        handoff.source ||
        summary.languageGuidanceStageSource ||
        null
    };
  },

  readResponseControl({
    input = {},
    summary = {}
  } = {}) {
    const responsePlan =
      this.firstObject(
        input.responsePlan,
        summary.responsePlan,
        summary.responseStrategy,
        summary.deliberationPacket
          ?.responsePlanning
          ?.plan
      );

    const communicationPlan =
      this.firstObject(
        input.communicationPlan,
        summary.communicationPlan,
        responsePlan.communicationPlan
      );

    const languageBudget =
      this.firstObject(
        communicationPlan.languageBudget
      );

    const sentenceRules =
      this.firstObject(
        communicationPlan.sentenceRules
      );

    return {
      responsePlan,

      goal:
        input.responseGoal ||
        summary.responseGoal ||
        responsePlan.responseGoal ||
        responsePlan.goal ||
        null,

      shape:
        input.responseShape ||
        summary.responseShape ||
        responsePlan.responseShape ||
        null,

      posture:
        input.responsePosture ||
        summary.responsePosture ||
        responsePlan.responsePosture ||
        null,

      order:
        this.toArray(
          input.responseOrder ||
          summary.responseOrder ||
          summary.responseMoves ||
          responsePlan.responseMoves
        ),

      rules:
        this.toArray(
          input.responseRules ||
          summary.responseRules ||
          responsePlan.responseRules
        ),

      constraints:
        this.toArray(
          input.responseConstraints ||
          summary.responseConstraints ||
          responsePlan.responseConstraints
        ),

      requiredBehaviors:
        this.toArray(
          input.requiredBehaviors ||
          summary.responseRequired ||
          summary.requiredBehaviors ||
          responsePlan.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.toArray(
          input.forbiddenBehaviors ||
          summary.responseAvoid ||
          summary.forbiddenBehaviors ||
          responsePlan.forbiddenBehaviors
        ),

      maximumWords:
        this.firstFiniteNumber([
          input.maximumWords,
          languageBudget.maxWords,
          sentenceRules.maxWords,
          null
        ]),

      maximumSentences:
        this.firstFiniteNumber([
          input.maximumSentences,
          languageBudget.maxSentences,
          sentenceRules.maxSentences,
          null
        ]),

      maximumParagraphs:
        this.firstFiniteNumber([
          input.maximumParagraphs,
          languageBudget.maxParagraphs,
          null
        ])
    };
  },

  readSafety({
    input = {},
    summary = {}
  } = {}) {
    const disposition =
      this.firstObject(
        input.safetyDisposition,
        summary.safetyDisposition
      );

    const deepReview =
      this.firstObject(
        input.deepSafetyResult,
        summary.deepSafetyResult
      );

    return {
      shouldStopNormalResponse:
        input
          .safetyShouldStopNormalResponse ===
          true ||
        summary
          .safetyShouldStopNormalResponse ===
          true ||
        disposition
          .shouldStopNormalResponse ===
          true ||
        deepReview
          .shouldStopNormalResponse ===
          true,

      severity:
        disposition.severity ||
        deepReview.severity ||
        summary.safetyContextGate
          ?.severity ||
        null,

      disposition,

      deepReview
    };
  },

  readRequest({
    input = {},
    summary = {}
  } = {}) {
    return {
      turnId:
        input.turnId ||
        summary.turnId ||
        summary.currentTurnId ||
        null,

      originalText:
        this.firstText(
          input.originalUserMessage,

          input.userMessage,

          summary.originalUserMessage,

          summary.userMessage,

          summary.message,

          summary.input
        ),

      resolvedText:
        this.firstText(
          input.resolvedUserQuestion,

          input.effectiveUserMessage,

          summary.resolvedUserQuestion,

          summary.effectiveUserMessage,

          summary.userMessage
        )
    };
  },

  readLockedResponse({
    input = {},
    summary = {}
  } = {}) {
    const locked =
      input.responseLocked ===
        true ||
      input.developerResponseLocked ===
        true ||
      summary.responseLocked ===
        true ||
      summary.developerResponseLocked ===
        true;

    if (!locked) {
      return "";
    }

    return this.firstText(
      input.lockedResponse,

      input.lockedDeveloperReply,

      input.finalResponse,

      summary.lockedDeveloperReply,

      summary.finalResponse,

      summary.developerHandoff
        ?.reply,

      summary.developerHandoff
        ?.finalResponse,

      summary.developerReply,

      summary.developerResponse
    );
  },

  /* =====================================================
     STRUCTURE
  ===================================================== */

  inspectTextStructure(
    text = ""
  ) {
    const value =
      String(
        text ||
        ""
      );

    const containsFencedCode =
      /```[\s\S]*?```/.test(
        value
      );

    const containsMarkdownTable =
      /^\s*\|.*\|\s*$/m.test(
        value
      ) &&
      /^\s*\|?\s*:?-{3,}/m.test(
        value
      );

    const containsList =
      /^\s*(?:[-*+]|\d+[.)])\s+/m
        .test(
          value
        );

    const containsHeading =
      /^\s*#{1,6}\s+/m.test(
        value
      );

    const containsBlockquote =
      /^\s*>\s+/m.test(
        value
      );

    const containsMultipleParagraphs =
      /\n{2,}/.test(
        value
      );

    const preserveLineStructure =
      containsFencedCode ||
      containsMarkdownTable ||
      containsList ||
      containsHeading ||
      containsBlockquote ||
      containsMultipleParagraphs;

    return {
      containsFencedCode,

      containsMarkdownTable,

      containsList,

      containsHeading,

      containsBlockquote,

      containsMultipleParagraphs,

      preserveLineStructure
    };
  },

  normalizeWhitespace({
    text = "",
    preserveLineStructure = false
  } = {}) {
    const value =
      String(
        text ||
        ""
      )
        .replace(
          /\r\n?/g,
          "\n"
        )
        .replace(
          /[ \t]+$/gm,
          ""
        )
        .replace(
          /\n{4,}/g,
          "\n\n\n"
        )
        .trim();

    if (
      preserveLineStructure
    ) {
      return value;
    }

    return value
      .replace(
        /[ \t]+/g,
        " "
      )
      .replace(
        /\n+/g,
        " "
      )
      .replace(
        /\s+([,.!?;:])/g,
        "$1"
      )
      .trim();
  },

  finalPolish({
    text = "",
    structure = {}
  } = {}) {
    let value =
      String(
        text ||
        ""
      )
        .replace(
          /\r\n?/g,
          "\n"
        )
        .replace(
          /[ \t]+$/gm,
          ""
        )
        .replace(
          /\n{4,}/g,
          "\n\n\n"
        )
        .trim();

    if (
      structure.containsFencedCode !==
      true
    ) {
      value =
        value
          .replace(
            /[ \t]{2,}/g,
            " "
          )
          .replace(
            /\s+([,.!?;:])/g,
            "$1"
          );
    }

    return value.trim();
  },

  toLanguageSections(
    text = ""
  ) {
    const value =
      String(
        text ||
        ""
      ).trim();

    if (!value) {
      return [];
    }

    const sections =
      value
        .split(
          /\n{2,}/
        )
        .map(
          section =>
            section.trim()
        )
        .filter(Boolean);

    return sections.length
      ? sections
      : [
          value
        ];
  },

  /* =====================================================
     VALIDATION HELPERS
  ===================================================== */

  containsInvalidValue(
    text = ""
  ) {
    return /\b(?:undefined|null|\[object object\])\b/i
      .test(
        String(
          text ||
          ""
        )
      );
  },

  hasUnbalancedCodeFence(
    text = ""
  ) {
    const count =
      (
        String(
          text ||
          ""
        ).match(
          /```/g
        ) ||
        []
      ).length;

    return count %
      2 !==
      0;
  },

  textAlreadyEndsWithEmoji(
    text = ""
  ) {
    return /[\p{Extended_Pictographic}\uFE0F]\s*$/u
      .test(
        String(
          text ||
          ""
        )
      );
  },

  /* =====================================================
     EMOJI NORMALIZATION
  ===================================================== */

  normalizeSuggestedEmoji(
    value = ""
  ) {
    const emoji =
      String(
        value ||
        ""
      )
        .trim()
        .replace(
          /\s+/g,
          ""
        );

    if (!emoji) {
      return "";
    }

    if (
      emoji.length >
      16
    ) {
      return "";
    }

    if (
      /[a-z0-9]/i.test(
        emoji
      )
    ) {
      return "";
    }

    if (
      !/[\p{Extended_Pictographic}\uFE0F]/u
        .test(
          emoji
        )
    ) {
      return "";
    }

    return emoji;
  },

  normalizeEmojiPlacement({
    placement = "none",
    emoji = ""
  } = {}) {
    if (!emoji) {
      return "none";
    }

    const value =
      this.normalizeIdentifier(
        placement
      );

    if (
      value ===
      "start"
    ) {
      return "start";
    }

    if (
      value ===
      "end"
    ) {
      return "end";
    }

    return "none";
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canReadAuthoritativeDraft:
        true,

      canPreserveAuthoritativeDraft:
        true,

      canApplyBoundedNaturalization:
        true,

      canNormalizePresentation:
        true,

      canReviewPresentationBudget:
        true,

      canPreserveMarkdown:
        true,

      canPreserveCode:
        true,

      canPreserveTables:
        true,

      canPreserveLists:
        true,

      canApplySuggestedEmoji:
        true,

      canValidateRenderedResponse:
        true,

      canReturnFinalComposerResult:
        true,

      canUseAuthoritativeDraftFallback:
        true,

      canCallOpenAI:
        false,

      canUseGeneralModelKnowledge:
        false,

      canAnswerUserIndependently:
        false,

      canChooseResponseStrategy:
        false,

      canChangeResponseGoal:
        false,

      canCreateResponseMoves:
        false,

      canInterpretMeaning:
        false,

      canRunResponseRealization:
        false,

      canRunBlueprintWriter:
        false,

      canRunAIWriter:
        false,

      canCreateCandidates:
        false,

      canArbitrateCandidates:
        false,

      canInspectGithubEvidence:
        false,

      canCreateArtifactPatch:
        false,

      canCreateSafetyResponse:
        false,

      canOverrideSafety:
        false,

      canRetrieveMemory:
        false,

      canPersistMemory:
        false,

      canExecuteActions:
        false,

      canPersistState:
        false,

      role:
        "authoritative_draft_final_language_renderer"
    };
  },

  validate() {
    const errors = [];

    const authority =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canCallOpenAI",
      "canUseGeneralModelKnowledge",
      "canAnswerUserIndependently",
      "canChooseResponseStrategy",
      "canChangeResponseGoal",
      "canCreateResponseMoves",
      "canInterpretMeaning",
      "canRunResponseRealization",
      "canRunBlueprintWriter",
      "canRunAIWriter",
      "canCreateCandidates",
      "canArbitrateCandidates",
      "canInspectGithubEvidence",
      "canCreateArtifactPatch",
      "canCreateSafetyResponse",
      "canOverrideSafety",
      "canRetrieveMemory",
      "canPersistMemory",
      "canExecuteActions",
      "canPersistState"
    ];

    forbiddenTrue
      .filter(
        key =>
          authority[key] ===
          true
      )
      .forEach(
        key => {
          errors.push(
            `${key}_must_be_false`
          );
        }
      );

    return {
      valid:
        errors.length ===
        0,

      ready:
        errors.length ===
        0,

      source:
        "ari-language-composer-validation",

      version:
        this.version,

      errors,

      warnings:
        [],

      checks: {
        authoritativeDraftRequired:
          true,

        responseRealizationDetached:
          true,

        draftGenerationDetached:
          true,

        candidatePipelineDetached:
          true,

        authoritativeDraftFallbackEnabled:
          true,

        presentationBudgetsAreAdvisory:
          true,

        semanticMeaningProtected:
          true
      },

      authority
    };
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

  readObject(value) {
    return (
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
    )
      ? value
      : null;
  },

  firstObject(
    ...values
  ) {
    return (
      values.find(
        value =>
          value &&
          typeof value ===
            "object" &&
          !Array.isArray(
            value
          )
      ) ||
      {}
    );
  },

  firstText(
    ...values
  ) {
    for (
      const value
      of values
    ) {
      const text =
        this.extractText(
          value
        );

      if (text) {
        return text;
      }
    }

    return "";
  },

  firstFiniteNumber(
    values = []
  ) {
    for (
      const value
      of this.toArray(
        values
      )
    ) {
      if (
        value ===
          null ||
        value ===
          undefined ||
        value ===
          ""
      ) {
        continue;
      }

      const number =
        Number(
          value
        );

      if (
        Number.isFinite(
          number
        ) &&
        number >
          0
      ) {
        return number;
      }
    }

    return null;
  },

  extractText(
    value = null
  ) {
    if (
      value ===
        null ||
      value ===
        undefined
    ) {
      return "";
    }

    if (
      typeof value ===
        "string"
    ) {
      return value.trim();
    }

    if (
      typeof value ===
        "number" ||
      typeof value ===
        "boolean"
    ) {
      return String(
        value
      ).trim();
    }

    if (
      typeof value ===
        "object"
    ) {
      return this.extractText(
        value.text ||
        value.responseText ||
        value.finalResponse ||
        value.languageBody ||
        value.response ||
        value.reply ||
        value.content ||
        value.authoritativeDraft ||
        value.draftResponse ||
        value.draft ||
        ""
      );
    }

    return "";
  },

  cleanInlineText(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  },

  toArray(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value.filter(
        item =>
          item !==
            null &&
          item !==
            undefined &&
          item !==
            ""
      );
    }

    if (
      value ===
        null ||
      value ===
        undefined ||
      value ===
        ""
    ) {
      return [];
    }

    return [
      value
    ];
  },

  uniqueValues(
    values = []
  ) {
    const output = [];
    const seen =
      new Set();

    this.toArray(
      values
    ).forEach(
      value => {
        const key =
          typeof value ===
            "string"
            ? value
            : JSON.stringify(
                value
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

  splitSentences(
    value = ""
  ) {
    const text =
      String(
        value ||
        ""
      )
        .replace(
          /\n+/g,
          " "
        )
        .trim();

    if (!text) {
      return [];
    }

    return text
      .split(
        /(?<=[.!?])\s+/
      )
      .map(
        sentence =>
          sentence.trim()
      )
      .filter(Boolean);
  },

  countWords(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .trim()
      .split(
        /\s+/
      )
      .filter(Boolean)
      .length;
  },

  countParagraphs(
    value = ""
  ) {
    const text =
      String(
        value ||
        ""
      ).trim();

    if (!text) {
      return 0;
    }

    return text
      .split(
        /\n{2,}/
      )
      .map(
        paragraph =>
          paragraph.trim()
      )
      .filter(Boolean)
      .length;
  },

  normalizeText(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(
        /[’‘]/g,
        "'"
      )
      .replace(
        /[“”]/g,
        "\""
      )
      .replace(
        /[_-]/g,
        " "
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

  normalizeForComparison(
    value = ""
  ) {
    return this.normalizeText(
      value
    )
      .replace(
        /\b(?:a|an|the|and|or|but|to|of|in|on|for|with)\b/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  },

  normalizeIdentifier(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(
        /[’‘]/g,
        "'"
      )
      .replace(
        /[“”]/g,
        "\""
      )
      .replace(
        /[^a-z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );
  }
};

window.Ari.languageComposer =
  window.AriLanguageComposer;

const ariLanguageComposerValidation =
  window.AriLanguageComposer
    ?.validate?.();

console.log(
  "ARI LANGUAGE COMPOSER LOADED:",
  window.AriLanguageComposer
    ?.version,

  ariLanguageComposerValidation
    ?.ready === true
    ? "READY"
    : "INVALID",

  ariLanguageComposerValidation
);
