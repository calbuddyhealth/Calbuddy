// ari/language/ari-language-composer.js
// Ari Language Composer
//
// Purpose:
// Render the canonical Response Realization Packet into Ari's final
// user-facing language without changing its authorized meaning.
//
// V10.0.0 — Realization-Native Final Renderer / Single Composer Authority
//
// Architectural flow:
//
// Response Realization Engine
//      ↓
// Response Realization Stage
//      ↓
// Ari Language Composer
//      ↓
// Final Composition Stage
//      ↓
// Delivery Pipeline
//
// Responsibilities:
// - Read one authorized Response Realization Packet.
// - Preserve the complete realized response.
// - Apply bounded natural-language polishing.
// - Apply approved Character and language presentation guidance.
// - Apply the realization's optional emoji recommendation.
// - Preserve Markdown, lists, and fenced code.
// - Enforce safe length budgets without corrupting structured content.
// - Validate the final rendered response.
// - Return one explicit final-composition result.
//
// Non-responsibilities:
// - Does not call OpenAI.
// - Does not answer the user's question independently.
// - Does not use general model knowledge.
// - Does not reinterpret semantic meaning.
// - Does not choose a response strategy.
// - Does not create response moves.
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
  version: "10.0.0",
  schemaVersion: "10.0.0",
  source: "ari-language-composer",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async compose(input = {}) {
    const context =
      this.readCompositionContext(
        input
      );

    const eligibility =
      this.resolveEligibility(
        context
      );

    if (
      eligibility
        .preserveLockedResponse ===
      true
    ) {
      return this.composeLockedResponse({
        context,
        eligibility
      });
    }

    if (
      eligibility.compose !==
      true
    ) {
      return this.returnFailure({
        reason:
          eligibility.reason,

        context,

        eligibility
      });
    }

    const rendering =
      this.renderRealization({
        context,
        eligibility
      });

    const validation =
      this.validateRenderedResponse({
        rendering,
        context,
        eligibility
      });

    if (
      validation.valid !==
      true
    ) {
      return this.returnFailure({
        reason:
          validation.reason ||
          "rendered_response_failed_validation",

        context,

        eligibility,

        rendering,

        validation
      });
    }

    return this.returnSuccess({
      context,
      eligibility,
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
      input.summary &&
      typeof input.summary ===
        "object"
        ? input.summary
        : {};

    const finalComposerPacket =
      this.firstObject(
        input.finalComposerPacket,
        input.composerPacket,
        summary.finalComposerPacket
      );

    const directRealization =
      this.firstObject(
        input.realizationPacket,
        input.responseRealization
          ?.packet,
        input.responseRealization,
        finalComposerPacket
          ?.realization,
        summary.realizationPacket,
        summary
          .responseRealizationHandoff
          ?.realizationPacket
      );

    const realization =
      this.normalizeRealization({
        realization:
          directRealization,

        finalComposerPacket,

        summary
      });

    const lockedResponse =
      this.readLockedResponse({
        input,
        finalComposerPacket,
        summary
      });

    return {
      input,

      summary,

      finalComposerPacket,

      realization,

      lockedResponse,

      character:
        this.readCharacterGuidance({
          finalComposerPacket,
          summary
        }),

      languageGuidance:
        this.readLanguageGuidance({
          finalComposerPacket,
          summary
        }),

      responseControl:
        this.readResponseControl({
          finalComposerPacket,
          summary,
          realization
        }),

      safety:
        this.readSafety({
          finalComposerPacket,
          summary
        }),

      request:
        this.readRequest({
          finalComposerPacket,
          summary,
          realization
        })
    };
  },

  normalizeRealization({
    realization = null,
    finalComposerPacket = {},
    summary = {}
  } = {}) {
    const value =
      realization &&
      typeof realization ===
        "object"
        ? realization
        : {};

    const nested =
      value.realization &&
      typeof value.realization ===
        "object"
        ? value.realization
        : {};

    const responseText =
      this.extractText(
        value.responseText ||
        nested.responseText ||
        finalComposerPacket
          ?.responseText ||
        finalComposerPacket
          ?.realization
          ?.responseText ||
        summary
          .realizationResponseText ||
        ""
      );

    const suggestedEmoji =
      this.normalizeSuggestedEmoji(
        value.suggestedEmoji ||
        nested.suggestedEmoji ||
        finalComposerPacket
          ?.suggestedEmoji ||
        finalComposerPacket
          ?.realization
          ?.suggestedEmoji ||
        summary
          .realizationSuggestedEmoji ||
        ""
      );

    const emojiPlacement =
      this.normalizeEmojiPlacement({
        placement:
          value.emojiPlacement ||
          nested.emojiPlacement ||
          finalComposerPacket
            ?.emojiPlacement ||
          finalComposerPacket
            ?.realization
            ?.emojiPlacement ||
          summary
            .realizationEmojiPlacement ||
          "none",

        emoji:
          suggestedEmoji
      });

    const composerInstructions =
      this.firstObject(
        value.composerInstructions,
        nested.composerInstructions,
        finalComposerPacket
          ?.composerInstructions,
        finalComposerPacket
          ?.realization
          ?.composerInstructions,
        summary
          .realizationComposerInstructions
      );

    const validation =
      this.firstObject(
        value.validation,
        nested.validation,
        summary.realizationValidation
      );

    const ready =
      (
        value.ready ===
          true ||
        nested.ready ===
          true ||
        finalComposerPacket
          ?.realization
          ?.ready ===
          true ||
        summary.realizationReady ===
          true
      ) &&
      Boolean(
        responseText
      );

    const usable =
      ready &&
      (
        value.usable ===
          true ||
        nested.usable ===
          true ||
        finalComposerPacket
          ?.realization
          ?.usable ===
          true ||
        summary.realizationUsable ===
          true ||
        validation.usable ===
          true ||
        validation.valid ===
          true
      );

    const complete =
      usable &&
      (
        value.complete ===
          true ||
        nested.complete ===
          true ||
        finalComposerPacket
          ?.realization
          ?.complete ===
          true ||
        summary.realizationComplete ===
          true ||
        validation.complete ===
          true
      );

    return {
      available:
        Boolean(
          Object.keys(
            value
          ).length ||
          responseText
        ),

      ready,

      usable,

      complete,

      responseText,

      suggestedEmoji,

      emojiPlacement,

      emojiPurpose:
        suggestedEmoji
          ? this.cleanInlineText(
              value.emojiPurpose ||
              nested.emojiPurpose ||
              finalComposerPacket
                ?.emojiPurpose ||
              finalComposerPacket
                ?.realization
                ?.emojiPurpose ||
              summary
                .realizationEmojiPurpose ||
              ""
            ) ||
            null
          : null,

      responseStrategy:
        this.firstObject(
          value.responseStrategy,
          nested.responseStrategy,
          finalComposerPacket
            ?.responseStrategy,
          finalComposerPacket
            ?.realization
            ?.responseStrategy,
          summary
            .realizationResponseStrategy
        ),

      composerInstructions: {
        preserveMeaning:
          composerInstructions
            .preserveMeaning !==
          false,

        preserveResponseText:
          composerInstructions
            .preserveResponseText !==
          false,

        maySmoothLanguage:
          composerInstructions
            .maySmoothLanguage !==
          false,

        useSuggestedEmoji:
          Boolean(
            suggestedEmoji
          ) &&
          composerInstructions
            .useSuggestedEmoji !==
            false,

        maximumSentences:
          this.firstFiniteNumber([
            composerInstructions
              .maximumSentences,
            composerInstructions
              .maxSentences,
            null
          ]),

        maximumWords:
          this.firstFiniteNumber([
            composerInstructions
              .maximumWords,
            composerInstructions
              .maxWords,
            null
          ]),

        maximumParagraphs:
          this.firstFiniteNumber([
            composerInstructions
              .maximumParagraphs,
            composerInstructions
              .maxParagraphs,
            null
          ])
      },

      fulfillment:
        this.firstObject(
          value.fulfillment,
          nested.fulfillment,
          finalComposerPacket
            ?.realization
            ?.fulfillment,
          summary
            .realizationFulfillment
        ),

      grounding:
        this.firstObject(
          value.grounding,
          nested.grounding,
          finalComposerPacket
            ?.realization
            ?.grounding,
          summary
            .realizationGrounding
        ),

      validation,

      source:
        value.source ||
        nested.source ||
        summary
          .responseRealizationSource ||
        "ari-response-realization-engine",

      mode:
        value.mode ||
        nested.mode ||
        summary.realizationMode ||
        null,

      reason:
        value.reason ||
        nested.reason ||
        summary
          .responseRealizationReason ||
        null,

      raw:
        value
    };
  },

  /* =====================================================
     ELIGIBILITY
  ===================================================== */

  resolveEligibility(
    context = {}
  ) {
    const lockedResponse =
      this.extractText(
        context.lockedResponse
      );

    if (
      lockedResponse
    ) {
      return {
        compose:
          false,

        preserveLockedResponse:
          true,

        realizationAuthorized:
          false,

        reason:
          "locked_authoritative_response_available"
      };
    }

    const realization =
      context.realization ||
      {};

    if (
      realization.available !==
      true
    ) {
      return {
        compose:
          false,

        preserveLockedResponse:
          false,

        realizationAuthorized:
          false,

        reason:
          "response_realization_missing"
      };
    }

    if (
      realization.ready !==
      true
    ) {
      return {
        compose:
          false,

        preserveLockedResponse:
          false,

        realizationAuthorized:
          false,

        reason:
          "response_realization_not_ready"
      };
    }

    if (
      realization.usable !==
      true
    ) {
      return {
        compose:
          false,

        preserveLockedResponse:
          false,

        realizationAuthorized:
          false,

        reason:
          "response_realization_not_usable"
      };
    }

    if (
      !realization.responseText
    ) {
      return {
        compose:
          false,

        preserveLockedResponse:
          false,

        realizationAuthorized:
          false,

        reason:
          "realization_response_text_missing"
      };
    }

    return {
      compose:
        true,

      preserveLockedResponse:
        false,

      realizationAuthorized:
        true,

      reason:
        "response_realization_authorized_for_rendering"
    };
  },

  /* =====================================================
     REALIZATION RENDERING
  ===================================================== */

  renderRealization({
    context = {}
  } = {}) {
    const realization =
      context.realization ||
      {};

    const instructions =
      realization
        .composerInstructions ||
      {};

    const originalText =
      this.extractText(
        realization.responseText
      );

    const structure =
      this.inspectTextStructure(
        originalText
      );

    let renderedText =
      originalText;

    /*
     * Code, tables, and structured Markdown must not be
     * rewritten with sentence-oriented text utilities.
     */
    if (
      instructions
        .maySmoothLanguage ===
        true &&
      structure
        .containsFencedCode !==
        true &&
      structure
        .containsMarkdownTable !==
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

    renderedText =
      this.normalizeWhitespace({
        text:
          renderedText,

        preserveLineStructure:
          structure
            .preserveLineStructure
      });

    renderedText =
      this.enforcePresentationBudget({
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

        realization,

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

    if (
      !value
    ) {
      return "";
    }

    /*
     * Preserve Markdown list structure. Smooth each line
     * without collapsing the document into one paragraph.
     */
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
          /\bdo not\b/gi,
          "don’t"
        )
        .replace(
          /\bdoes not\b/gi,
          "doesn’t"
        )
        .replace(
          /\bdid not\b/gi,
          "didn’t"
        )
        .replace(
          /\bcan not\b/gi,
          "can’t"
        )
        .replace(
          /\bcannot\b/gi,
          "can’t"
        )
        .replace(
          /\bwill not\b/gi,
          "won’t"
        )
        .replace(
          /\bwould not\b/gi,
          "wouldn’t"
        )
        .replace(
          /\bI am\b/g,
          "I’m"
        )
        .replace(
          /\bI have\b/g,
          "I’ve"
        )
        .replace(
          /\bI will\b/g,
          "I’ll"
        )
        .replace(
          /\bI would\b/g,
          "I’d"
        )
        .replace(
          /\bit is\b/gi,
          "it’s"
        )
        .replace(
          /\bthat is\b/gi,
          "that’s"
        )
        .replace(
          /\bthere is\b/gi,
          "there’s"
        )
        .replace(
          /\bthey are\b/gi,
          "they’re"
        )
        .replace(
          /\byou are\b/gi,
          "you’re"
        )
        .replace(
          /\bwe are\b/gi,
          "we’re"
        )
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
     EMOJI
  ===================================================== */

  applySuggestedEmoji({
    text = "",
    realization = {},
    context = {}
  } = {}) {
    const emoji =
      this.normalizeSuggestedEmoji(
        realization.suggestedEmoji
      );

    const placement =
      this.normalizeEmojiPlacement({
        placement:
          realization.emojiPlacement,

        emoji
      });

    const instructions =
      realization
        .composerInstructions ||
      {};

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
      instructions
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
          "emoji_not_authorized_by_realization"
      };
    }

    if (
      this.emojiBlockedByContext(
        context
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
          "emoji_blocked_by_context"
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

        placement,

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

  emojiBlockedByContext(
    context = {}
  ) {
    const safety =
      context.safety ||
      {};

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

    const mode =
      this.normalizeIdentifier(
        context.realization
          ?.mode ||
        ""
      );

    if (
      [
        "fixed_safety_response",
        "safety_governed_realization"
      ].includes(
        mode
      )
    ) {
      return true;
    }

    const responseText =
      this.normalizeText(
        context.realization
          ?.responseText ||
        ""
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
     BUDGET
  ===================================================== */

  enforcePresentationBudget({
    text = "",
    context = {},
    structure = {}
  } = {}) {
    const budget =
      this.resolveBudget(
        context
      );

    let result =
      String(
        text ||
        ""
      ).trim();

    /*
     * Never slice structured code, tables, or long-form artifacts
     * with generic word or sentence limits. The realization layer
     * is responsible for satisfying those output contracts.
     */
    if (
      structure.containsFencedCode ===
        true ||
      structure.containsMarkdownTable ===
        true
    ) {
      return result;
    }

    if (
      budget.maximumParagraphs
    ) {
      result =
        this.limitParagraphs(
          result,
          budget.maximumParagraphs
        );
    }

    const afterParagraphs =
      this.inspectTextStructure(
        result
      );

    if (
      budget.maximumSentences &&
      afterParagraphs
        .containsList !==
        true &&
      afterParagraphs
        .containsHeading !==
        true
    ) {
      result =
        this.limitSentences(
          result,
          budget.maximumSentences
        );
    }

    if (
      budget.maximumWords
    ) {
      result =
        this.limitWordsSafely({
          text:
            result,

          maximumWords:
            budget.maximumWords,

          structure:
            this.inspectTextStructure(
              result
            )
        });
    }

    return result.trim();
  },

  resolveBudget(
    context = {}
  ) {
    const instructions =
      context.realization
        ?.composerInstructions ||
      {};

    const communicationPlan =
      context.languageGuidance
        ?.communicationPlan ||
      {};

    const languageBudget =
      communicationPlan
        .languageBudget ||
      {};

    const sentenceRules =
      communicationPlan
        .sentenceRules ||
      {};

    return {
      maximumSentences:
        this.firstFiniteNumber([
          instructions
            .maximumSentences,
          sentenceRules
            .maxSentences,
          languageBudget
            .maxSentences,
          null
        ]),

      maximumWords:
        this.firstFiniteNumber([
          instructions
            .maximumWords,
          sentenceRules
            .maxWords,
          languageBudget
            .maxWords,
          null
        ]),

      maximumParagraphs:
        this.firstFiniteNumber([
          instructions
            .maximumParagraphs,
          languageBudget
            .maxParagraphs,
          null
        ])
    };
  },

  limitParagraphs(
    text = "",
    maximum = null
  ) {
    const max =
      Number(
        maximum
      );

    if (
      !Number.isFinite(
        max
      ) ||
      max <=
        0
    ) {
      return text;
    }

    const paragraphs =
      String(
        text ||
        ""
      )
        .split(
          /\n{2,}/
        )
        .map(
          paragraph =>
            paragraph.trim()
        )
        .filter(Boolean);

    if (
      paragraphs.length <=
      max
    ) {
      return text;
    }

    return paragraphs
      .slice(
        0,
        max
      )
      .join(
        "\n\n"
      )
      .trim();
  },

  limitSentences(
    text = "",
    maximum = null
  ) {
    const max =
      Number(
        maximum
      );

    if (
      !Number.isFinite(
        max
      ) ||
      max <=
        0
    ) {
      return text;
    }

    const sentences =
      this.splitSentences(
        text
      );

    if (
      sentences.length <=
      max
    ) {
      return text;
    }

    return sentences
      .slice(
        0,
        max
      )
      .join(
        " "
      )
      .trim();
  },

  limitWordsSafely({
    text = "",
    maximumWords = null,
    structure = {}
  } = {}) {
    const max =
      Number(
        maximumWords
      );

    if (
      !Number.isFinite(
        max
      ) ||
      max <=
        0
    ) {
      return text;
    }

    const words =
      this.countWords(
        text
      );

    if (
      words <=
      max
    ) {
      return text;
    }

    if (
      structure.containsList ===
        true ||
      structure.containsHeading ===
        true ||
      structure.containsBlockquote ===
        true
    ) {
      return this.limitStructuredWords(
        text,
        max
      );
    }

    return this.limitPlainWords(
      text,
      max
    );
  },

  limitStructuredWords(
    text = "",
    maximumWords = 120
  ) {
    const lines =
      String(
        text ||
        ""
      ).split(
        "\n"
      );

    const output = [];
    let used =
      0;

    for (
      const line
      of lines
    ) {
      const lineWords =
        this.countWords(
          line
        );

      if (
        used +
        lineWords <=
        maximumWords
      ) {
        output.push(
          line
        );

        used +=
          lineWords;

        continue;
      }

      const remaining =
        maximumWords -
        used;

      if (
        remaining >
        0
      ) {
        const prefixMatch =
          line.match(
            /^(\s*(?:[-*+]|\d+[.)]|#{1,6}|>)\s+)/
          );

        const prefix =
          prefixMatch?.[1] ||
          "";

        const body =
          prefix
            ? line.slice(
                prefix.length
              )
            : line;

        const limitedBody =
          this.limitPlainWords(
            body,
            remaining
          );

        if (
          limitedBody
        ) {
          output.push(
            `${prefix}${limitedBody}`
          );
        }
      }

      break;
    }

    return output
      .join(
        "\n"
      )
      .trim();
  },

  limitPlainWords(
    text = "",
    maximumWords = 120
  ) {
    const words =
      String(
        text ||
        ""
      )
        .trim()
        .split(
          /\s+/
        )
        .filter(Boolean);

    if (
      words.length <=
      maximumWords
    ) {
      return text;
    }

    let limited =
      words
        .slice(
          0,
          maximumWords
        )
        .join(
          " "
        )
        .replace(
          /[,;:–—-]+$/,
          ""
        )
        .trim();

    if (
      !/[.!?]$/.test(
        limited
      )
    ) {
      limited =
        `${limited}.`;
    }

    return limited;
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validateRenderedResponse({
    rendering = {},
    context = {},
    eligibility = {}
  } = {}) {
    const text =
      this.extractText(
        rendering.text
      );

    const errors = [];
    const warnings = [];

    if (
      eligibility
        .realizationAuthorized !==
      true
    ) {
      errors.push(
        "response_realization_not_authorized"
      );
    }

    if (
      !text
    ) {
      errors.push(
        "rendered_response_empty"
      );
    }

    if (
      text &&
      text.length <
        3
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
      this.containsInternalLanguage(
        text
      )
    ) {
      errors.push(
        "rendered_response_contains_internal_language"
      );
    }

    if (
      this.containsWriterFailureMessage(
        text
      )
    ) {
      errors.push(
        "rendered_response_contains_writer_failure_message"
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

    const realizationText =
      this.extractText(
        context.realization
          ?.responseText
      );

    if (
      realizationText &&
      text &&
      !this.meaningPreservationCheck({
        sourceText:
          realizationText,

        renderedText:
          text
      })
    ) {
      warnings.push(
        "rendered_response_changed_substantially"
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
        eligibility
          .realizationAuthorized ===
        true,

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
      0.55;
  },

  /* =====================================================
     SUCCESS / FAILURE
  ===================================================== */

  composeLockedResponse({
    context = {},
    eligibility = {}
  } = {}) {
    const finalResponse =
      this.extractText(
        context.lockedResponse
      );

    const validation = {
      valid:
        Boolean(
          finalResponse
        ),

      usable:
        Boolean(
          finalResponse
        ),

      authorized:
        true,

      complete:
        Boolean(
          finalResponse
        ),

      reason:
        finalResponse
          ? "locked_response_preserved"
          : "locked_response_empty",

      errors:
        finalResponse
          ? []
          : [
              "locked_response_empty"
            ],

      warnings:
        [],

      length:
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
        ),

      emojiApplied:
        false,

      source:
        "locked-authoritative-response"
    };

    return {
      schema:
        "ari_language_composer_result",

      schemaVersion:
        this.schemaVersion,

      languageComposerRan:
        false,

      languageComposerInvoked:
        false,

      languageComposerProducedResponse:
        Boolean(
          finalResponse
        ),

      languageComposerUsable:
        Boolean(
          finalResponse
        ),

      languageComposerAuthorized:
        Boolean(
          finalResponse
        ),

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
        finalResponse
          ? [
              finalResponse
            ]
          : [],

      finalResponse,

      source:
        "locked-authoritative-response",

      reason:
        eligibility.reason,

      realizationAuthorized:
        false,

      lockedResponseAuthorized:
        true,

      composerUsedAI:
        false,

      composerValidation:
        validation,

      diagnostics: {
        mode:
          "locked_response",

        realizationAvailable:
          context.realization
            ?.available ===
          true,

        emojiApplied:
          false
      },

      authority:
        this.getAuthorityBoundaries()
    };
  },

  returnSuccess({
    context = {},
    eligibility = {},
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
        context.realization
          ?.mode ||
        "response_realization",

      languageBody:
        finalResponse,

      languageSections:
        this.toLanguageSections(
          finalResponse
        ),

      finalResponse,

      source:
        this.source,

      reason:
        validation.reason,

      realizationAuthorized:
        true,

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

        emojiApplied:
          rendering.emojiApplied ===
          true,

        emoji:
          rendering.emoji ||
          "",

        emojiPlacement:
          rendering
            .emojiPlacement ||
          "none",

        emojiReason:
          rendering.emojiReason ||
          null,

        structure:
          rendering.structure ||
          null
      },

      diagnostics: {
        realizationSource:
          context.realization
            ?.source ||
          null,

        realizationMode:
          context.realization
            ?.mode ||
          null,

        originalLength:
          rendering
            .originalText
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

        emojiApplied:
          rendering.emojiApplied ===
          true,

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

    window.Ari
      .languageComposerState =
      result;

    return result;
  },

  returnFailure({
    reason =
      "language_composition_failed",

    context =
      {},

    eligibility =
      {},

    rendering =
      null,

    validation =
      null
  } = {}) {
    const result = {
      schema:
        "ari_language_composer_result",

      schemaVersion:
        this.schemaVersion,

      languageComposerRan:
        false,

      languageComposerInvoked:
        eligibility.compose ===
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
        context.realization
          ?.mode ||
        null,

      languageBody:
        "",

      languageSections:
        [],

      finalResponse:
        "",

      source:
        this.source,

      reason,

      realizationAuthorized:
        eligibility
          .realizationAuthorized ===
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
        realizationAvailable:
          context.realization
            ?.available ===
          true,

        realizationReady:
          context.realization
            ?.ready ===
          true,

        realizationUsable:
          context.realization
            ?.usable ===
          true,

        realizationResponseAvailable:
          Boolean(
            context.realization
              ?.responseText
          ),

        reason
      },

      authority:
        this.getAuthorityBoundaries()
    };

    window.Ari
      .languageComposerState =
      result;

    return result;
  },

  /* =====================================================
     CHARACTER / LANGUAGE / CONTROL
  ===================================================== */

  readCharacterGuidance({
    finalComposerPacket = {},
    summary = {}
  } = {}) {
    const packetCharacter =
      finalComposerPacket
        ?.character ||
      {};

    const handoff =
      packetCharacter.handoff ||
      summary.characterHandoff ||
      {};

    return {
      available:
        Boolean(
          Object.keys(
            packetCharacter
          ).length ||
          Object.keys(
            handoff
          ).length
        ),

      emotion:
        packetCharacter.emotion ||
        handoff.emotion ||
        summary.emotion ||
        null,

      tone:
        packetCharacter.tone ||
        handoff.tone ||
        null,

      warmth:
        packetCharacter.warmth ||
        handoff.warmth ||
        null,

      directness:
        packetCharacter
          .directness ||
        handoff.directness ||
        null,

      expression:
        packetCharacter.expression ||
        handoff.expression ||
        null
    };
  },

  readLanguageGuidance({
    finalComposerPacket = {},
    summary = {}
  } = {}) {
    const packet =
      finalComposerPacket
        ?.languageGuidance ||
      {};

    return {
      handoff:
        packet.handoff ||
        summary
          .languageGuidanceHandoff ||
        null,

      lexicalGrounding:
        packet.lexicalGrounding ||
        summary.lexicalGrounding ||
        null,

      humanLanguageProfile:
        packet
          .humanLanguageProfile ||
        summary
          .humanLanguageProfile ||
        null,

      expressionPlan:
        packet.expressionPlan ||
        summary.expressionPlan ||
        null,

      communicationPlan:
        packet
          .communicationPlan ||
        summary.communicationPlan ||
        null,

      mouthDirective:
        packet.mouthDirective ||
        summary.mouthDirective ||
        null
    };
  },

  readResponseControl({
    finalComposerPacket = {},
    summary = {},
    realization = {}
  } = {}) {
    const packet =
      finalComposerPacket
        ?.responseControl ||
      {};

    return {
      goal:
        packet.goal ||
        summary.responseGoal ||
        null,

      shape:
        packet.shape ||
        summary.responseShape ||
        null,

      posture:
        packet.posture ||
        summary.responsePosture ||
        null,

      order:
        this.toArray(
          packet.order ||
          summary.responseOrder
        ),

      rules:
        this.toArray(
          packet.rules ||
          summary.responseRules
        ),

      constraints:
        this.toArray(
          packet.constraints ||
          summary
            .responseConstraints
        ),

      requiredBehaviors:
        this.toArray(
          packet
            .requiredBehaviors ||
          summary.responseRequired
        ),

      forbiddenBehaviors:
        this.toArray(
          packet
            .forbiddenBehaviors ||
          summary.responseAvoid
        ),

      composerInstructions:
        realization
          .composerInstructions ||
        null
    };
  },

  readSafety({
    finalComposerPacket = {},
    summary = {}
  } = {}) {
    const packet =
      finalComposerPacket
        ?.safety ||
      {};

    const disposition =
      packet.disposition ||
      summary.safetyDisposition ||
      {};

    const deepReview =
      packet.deepReview ||
      summary.deepSafetyResult ||
      {};

    return {
      shouldStopNormalResponse:
        packet
          .shouldStopNormalResponse ===
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
        packet.earlyGate
          ?.severity ||
        null,

      disposition,

      deepReview
    };
  },

  readRequest({
    finalComposerPacket = {},
    summary = {},
    realization = {}
  } = {}) {
    return {
      turnId:
        finalComposerPacket
          ?.request
          ?.turnId ||
        realization.raw
          ?.request
          ?.turnId ||
        summary.turnId ||
        null,

      originalText:
        this.extractText(
          finalComposerPacket
            ?.request
            ?.originalText ||
          realization.raw
            ?.request
            ?.originalText ||
          summary.originalUserMessage ||
          summary.userMessage ||
          ""
        ),

      resolvedText:
        this.extractText(
          finalComposerPacket
            ?.request
            ?.resolvedText ||
          realization.raw
            ?.request
            ?.resolvedText ||
          summary
            .resolvedUserQuestion ||
          summary.userMessage ||
          ""
        )
    };
  },

  readLockedResponse({
    input = {},
    finalComposerPacket = {},
    summary = {}
  } = {}) {
    const locked =
      summary
        .developerResponseLocked ===
        true ||
      summary.responseLocked ===
        true ||
      finalComposerPacket
        ?.developer
        ?.locked ===
        true;

    if (
      !locked
    ) {
      return "";
    }

    return this.extractText(
      input.lockedResponse ||
      finalComposerPacket
        ?.developer
        ?.lockedReply ||
      finalComposerPacket
        ?.lockedDeveloperReply ||
      summary.lockedDeveloperReply ||
      summary.finalResponse ||
      summary.developerHandoff
        ?.reply ||
      summary.developerHandoff
        ?.finalResponse ||
      summary.developerReply ||
      summary.developerResponse ||
      ""
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
      structure
        .containsFencedCode !==
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

    if (
      !value
    ) {
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

  containsInternalLanguage(
    text = ""
  ) {
    const normalized =
      this.normalizeText(
        text
      );

    const phrases = [
      "canonical response plan",
      "response planner",
      "response move",
      "response shape",
      "response contract",
      "composer packet",
      "composer bridge",
      "blueprint writer",
      "ai writer",
      "candidate arbiter",
      "response candidate arbiter",
      "response realization engine",
      "realization packet",
      "pipeline diagnostic",
      "pipeline stage",
      "internal planner",
      "according to the packet",
      "according to the response plan"
    ];

    return phrases.some(
      phrase =>
        normalized.includes(
          phrase
        )
    );
  },

  containsWriterFailureMessage(
    text = ""
  ) {
    const normalized =
      this.normalizeText(
        text
      );

    const phrases = [
      "the ai draft was unavailable",
      "ai draft unavailable",
      "the writer was unavailable",
      "no usable response candidate",
      "composer packet missing",
      "ai writer not loaded",
      "blueprint writer not loaded",
      "response realization engine failed",
      "realization packet missing",
      "the response generator failed",
      "i cannot generate the response",
      "composer failed to use it"
    ];

    return phrases.some(
      phrase =>
        normalized.includes(
          phrase
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

    if (
      !emoji
    ) {
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
    if (
      !emoji
    ) {
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
      canReadResponseRealization:
        true,

      canPreserveRealizationText:
        true,

      canApplyBoundedNaturalization:
        true,

      canApplyPresentationBudget:
        true,

      canPreserveMarkdown:
        true,

      canPreserveCode:
        true,

      canApplySuggestedEmoji:
        true,

      canValidateRenderedResponse:
        true,

      canReturnFinalComposerResult:
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
        "realization_native_final_language_renderer"
    };
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

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

    if (
      !text
    ) {
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

    if (
      !text
    ) {
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

console.log(
  "ARI LANGUAGE COMPOSER LOADED:",
  window.AriLanguageComposer
    ?.version
);