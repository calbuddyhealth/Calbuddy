// ari/pipeline-stages/expression/ari-response-realization-stage.js
// Ari Response Realization Stage
//
// Purpose:
// Invoke the primary OpenAI Response Realization Engine after Character and
// language guidance have been resolved, then preserve its canonical
// realization packet for Final Composition.
//
// V1.0.0 — Primary Realization Stage / No Legacy Writer Routing
//
// Architectural flow:
//
// Character Stage
//      ↓
// Language Guidance Stage
//      ↓
// Response Realization Stage
//      ├─ Determine realization eligibility
//      ├─ Preserve locked authoritative responses
//      ├─ Invoke Response Realization Engine
//      ├─ Normalize the realization result
//      └─ Produce canonical realization handoff
//            ↓
// Final Composition Stage
//
// Responsibilities:
// - Determine whether OpenAI response realization should run.
// - Preserve explicit developer-locked or response-locked authority.
// - Preserve fixed safety responses when supplied.
// - Invoke Ari Response Realization Engine.
// - Normalize the engine result.
// - Preserve the canonical Realization Packet.
// - Expose response text and emoji guidance to Final Composition.
// - Produce transparent realization diagnostics.
// - Produce the canonical realization handoff and stage packet.
//
// Non-responsibilities:
// - Does not reinterpret the user's meaning.
// - Does not classify the conversation.
// - Does not choose or modify the response plan.
// - Does not perform candidate generation.
// - Does not run Blueprint Writer.
// - Does not run AI Writer.
// - Does not arbitrate drafts.
// - Does not compose the final user-facing response.
// - Does not override safety.
// - Does not retrieve or persist memory.
// - Does not execute actions.
// - Does not access Supabase.
// - Does not persist runtime state.

window.Ari = window.Ari || {};

window.AriResponseRealizationStage = {
  version: "1.0.0",
  schemaVersion: "1.0.0",
  source: "ari-response-realization-stage",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {}
    } = runtime;

    let state = {
      ...summary,

      activeExpressionStage:
        "response_realization"
    };

    /* =================================================
       1. REALIZATION ELIGIBILITY
    ================================================= */

    const eligibility =
      this.resolveEligibility(
        state
      );

    state = {
      ...state,

      responseRealizationEligibility:
        eligibility,

      shouldRunResponseRealization:
        eligibility.run ===
        true,

      shouldPreserveLockedRealization:
        eligibility
          .preserveLockedResponse ===
        true,

      shouldPreserveFixedSafetyResponse:
        eligibility
          .preserveFixedSafetyResponse ===
        true
    };

    /* =================================================
       2. AUTHORITATIVE RESPONSE BYPASS
    ================================================= */

    const authoritativeResult =
      this.resolveAuthoritativeBypass({
        state,
        eligibility
      });

    if (
      authoritativeResult
        .handled ===
      true
    ) {
      const normalized =
        this.normalizeResult(
          authoritativeResult.result
        );

      state =
        this.applyNormalizedResult({
          state,
          normalized,
          eligibility
        });

      state.responseRealizationHandoff =
        this.buildRealizationHandoff(
          state
        );

      state.responseRealizationStagePacket =
        this.buildStagePacket(
          state
        );

      state.responseRealizationStageRan =
        true;

      state.responseRealizationStageSource =
        this.source;

      state.responseRealizationStageVersion =
        this.version;

      return state;
    }

    /* =================================================
       3. RESPONSE REALIZATION ENGINE
    ================================================= */

    mark(
      "before responseRealizationEngine"
    );

    const engineResult =
      await this.runRealizationEngine({
        state,
        eligibility
      });

    mark(
      "after responseRealizationEngine"
    );

    /* =================================================
       4. RESULT NORMALIZATION
    ================================================= */

    const normalized =
      this.normalizeResult(
        engineResult
      );

    state =
      this.applyNormalizedResult({
        state,
        normalized,
        eligibility
      });

    /* =================================================
       5. REALIZATION HANDOFF
    ================================================= */

    state.responseRealizationHandoff =
      this.buildRealizationHandoff(
        state
      );

    /* =================================================
       6. STAGE PACKET
    ================================================= */

    state.responseRealizationStagePacket =
      this.buildStagePacket(
        state
      );

    state.responseRealizationStageRan =
      true;

    state.responseRealizationStageSource =
      this.source;

    state.responseRealizationStageVersion =
      this.version;

    return state;
  },

  /* =====================================================
     ELIGIBILITY
  ===================================================== */

  resolveEligibility(
    summary = {}
  ) {
    const developerLocked =
      summary
        .developerResponseLocked ===
      true;

    const responseLocked =
      summary.responseLocked ===
      true;

    const lockedResponse =
      this.readLockedResponse(
        summary
      );

    const hasLockedResponse =
      Boolean(
        lockedResponse
      ) &&
      (
        developerLocked ||
        responseLocked
      );

    if (
      hasLockedResponse
    ) {
      return {
        run:
          false,

        preserveLockedResponse:
          true,

        preserveFixedSafetyResponse:
          false,

        developerLocked,

        responseLocked,

        lockedResponseAvailable:
          true,

        fixedSafetyResponseAvailable:
          false,

        source:
          "ari-response-realization-stage-eligibility",

        reason:
          "locked_authoritative_response_available"
      };
    }

    const fixedSafetyResponse =
      this.readFixedSafetyResponse(
        summary
      );

    const hasFixedSafetyResponse =
      Boolean(
        fixedSafetyResponse
      ) &&
      (
        summary
          .safetyShouldStopNormalResponse ===
          true ||
        summary
          .safetyDisposition
          ?.shouldStopNormalResponse ===
          true ||
        summary
          .deepSafetyResult
          ?.shouldStopNormalResponse ===
          true
      );

    if (
      hasFixedSafetyResponse
    ) {
      return {
        run:
          false,

        preserveLockedResponse:
          false,

        preserveFixedSafetyResponse:
          true,

        developerLocked,

        responseLocked,

        lockedResponseAvailable:
          false,

        fixedSafetyResponseAvailable:
          true,

        source:
          "ari-response-realization-stage-eligibility",

        reason:
          "fixed_safety_response_available"
      };
    }

    const existingFinalResponse =
      this.extractText(
        summary.finalResponse
      );

    const existingFinalUsable =
      summary
        .finalResponseUsable ===
        true &&
      Boolean(
        existingFinalResponse
      );

    if (
      existingFinalUsable
    ) {
      return {
        run:
          false,

        preserveLockedResponse:
          false,

        preserveFixedSafetyResponse:
          false,

        developerLocked,

        responseLocked,

        lockedResponseAvailable:
          false,

        fixedSafetyResponseAvailable:
          false,

        source:
          "ari-response-realization-stage-eligibility",

        reason:
          "usable_final_response_already_available"
      };
    }

    const resolvedTurn =
      this.readResolvedCurrentTurn(
        summary
      );

    if (
      !resolvedTurn
    ) {
      return {
        run:
          false,

        preserveLockedResponse:
          false,

        preserveFixedSafetyResponse:
          false,

        developerLocked,

        responseLocked,

        lockedResponseAvailable:
          false,

        fixedSafetyResponseAvailable:
          false,

        source:
          "ari-response-realization-stage-eligibility",

        reason:
          "canonical_current_turn_missing"
      };
    }

    return {
      run:
        true,

      preserveLockedResponse:
        false,

      preserveFixedSafetyResponse:
        false,

      developerLocked,

      responseLocked,

      lockedResponseAvailable:
        false,

      fixedSafetyResponseAvailable:
        false,

      source:
        "ari-response-realization-stage-eligibility",

      reason:
        "primary_response_realization_allowed"
    };
  },

  /* =====================================================
     AUTHORITATIVE BYPASS
  ===================================================== */

  resolveAuthoritativeBypass({
    state = {},
    eligibility = {}
  } = {}) {
    if (
      eligibility
        .preserveLockedResponse ===
      true
    ) {
      const responseText =
        this.readLockedResponse(
          state
        );

      return {
        handled:
          true,

        result:
          this.buildAuthoritativeResult({
            responseText,

            mode:
              "locked_response",

            source:
              "locked-authoritative-response",

            reason:
              "locked_authoritative_response_preserved",

            usedOpenAI:
              false
          })
      };
    }

    if (
      eligibility
        .preserveFixedSafetyResponse ===
      true
    ) {
      const responseText =
        this.readFixedSafetyResponse(
          state
        );

      return {
        handled:
          true,

        result:
          this.buildAuthoritativeResult({
            responseText,

            mode:
              "fixed_safety_response",

            source:
              "fixed-safety-response",

            reason:
              "fixed_safety_response_preserved",

            usedOpenAI:
              false
          })
      };
    }

    return {
      handled:
        false,

      result:
        null
    };
  },

  buildAuthoritativeResult({
    responseText = "",
    mode = "authoritative_response",
    source = "authoritative-response",
    reason = "authoritative_response_preserved",
    usedOpenAI = false
  } = {}) {
    const text =
      this.cleanText(
        responseText
      );

    const ready =
      Boolean(
        text
      );

    const packet = {
      schema:
        "ari_response_realization_packet",

      schemaVersion:
        this.schemaVersion,

      ready,

      usable:
        ready,

      complete:
        ready,

      source,

      version:
        this.version,

      mode,

      reason,

      responseText:
        text,

      responseStrategy: {
        approach:
          mode,

        tone:
          "authoritative",

        technicalLevel:
          "plain_language",

        emphasis:
          [],

        avoid:
          []
      },

      suggestedEmoji:
        "",

      emojiPlacement:
        "none",

      emojiPurpose:
        null,

      composerInstructions: {
        preserveMeaning:
          true,

        preserveResponseText:
          true,

        maySmoothLanguage:
          false,

        useSuggestedEmoji:
          false,

        maximumSentences:
          null,

        maximumWords:
          null,

        maximumParagraphs:
          null
      },

      fulfillment: {
        completedMoves:
          [],

        omittedMoves:
          [],

        clarificationNeeded:
          false,

        assumptions:
          []
      },

      grounding: {
        usedGeneralModelKnowledge:
          false,

        usedContinuity:
          false,

        usedMemory:
          false,

        usedReasoning:
          false,

        usedDeveloperContext:
          false
      },

      validation: {
        valid:
          ready,

        complete:
          ready,

        usable:
          ready,

        reason:
          ready
            ? "authoritative_response_valid"
            : "authoritative_response_empty",

        errors:
          ready
            ? []
            : [
                "authoritative_response_empty"
              ],

        warnings:
          [],

        sentenceCount:
          this.splitSentences(
            text
          ).length,

        wordCount:
          this.countWords(
            text
          ),

        paragraphCount:
          this.countParagraphs(
            text
          ),

        questionCount:
          this.countQuestions(
            text
          )
      },

      diagnostics: {
        modelInvoked:
          usedOpenAI ===
          true,

        authoritativeBypass:
          true,

        responseLength:
          text.length,

        errors:
          ready
            ? []
            : [
                "authoritative_response_empty"
              ],

        warnings:
          []
      },

      authority:
        this.getAuthorityBoundaries()
    };

    return {
      schema:
        "ari_response_realization_result",

      schemaVersion:
        this.schemaVersion,

      realizationRan:
        true,

      realizationReady:
        ready,

      realizationUsable:
        ready,

      realizationMode:
        mode,

      realizationPacket:
        packet,

      responseText:
        text,

      suggestedEmoji:
        "",

      emojiPlacement:
        "none",

      source,

      reason,

      diagnostics: {
        ran:
          true,

        ready,

        usable:
          ready,

        mode,

        reason,

        usedOpenAI:
          usedOpenAI ===
          true,

        authoritativeBypass:
          true
      },

      authority:
        this.getAuthorityBoundaries()
    };
  },

  /* =====================================================
     REALIZATION ENGINE
  ===================================================== */

  async runRealizationEngine({
    state = {},
    eligibility = {}
  } = {}) {
    if (
      eligibility.run !==
      true
    ) {
      return this.buildFailureResult({
        reason:
          eligibility.reason ||
          "response_realization_not_eligible",

        source:
          "skipped-by-expression-eligibility",

        ran:
          false
      });
    }

    const engine =
      window
        .AriResponseRealizationEngine;

    if (
      !engine ||
      typeof engine.run !==
        "function"
    ) {
      return this.buildFailureResult({
        reason:
          "response_realization_engine_not_loaded",

        source:
          "not-loaded",

        ran:
          false
      });
    }

    try {
      const result =
        await engine.run({
          summary:
            state,

          eligibility,

          sourceStage:
            this.source
        });

      if (
        !result ||
        typeof result !==
          "object"
      ) {
        return this.buildFailureResult({
          reason:
            "response_realization_engine_returned_invalid_result",

          source:
            "invalid-result",

          ran:
            true
        });
      }

      return result;
    } catch (error) {
      console.error(
        "Ari Response Realization Engine failed during stage execution:",
        error
      );

      return this.buildFailureResult({
        reason:
          "response_realization_engine_execution_failed",

        source:
          "engine-error",

        ran:
          true,

        error
      });
    }
  },

  buildFailureResult({
    reason =
      "response_realization_failed",
    source =
      "response-realization-failure",
    ran = false,
    error = null
  } = {}) {
    return {
      schema:
        "ari_response_realization_result",

      schemaVersion:
        this.schemaVersion,

      realizationRan:
        ran ===
        true,

      realizationReady:
        false,

      realizationUsable:
        false,

      realizationMode:
        null,

      realizationPacket:
        null,

      responseText:
        "",

      suggestedEmoji:
        "",

      emojiPlacement:
        "none",

      source,

      reason,

      validation: {
        valid:
          false,

        complete:
          false,

        usable:
          false,

        reason,

        errors: [
          reason
        ],

        warnings:
          []
      },

      diagnostics: {
        ran:
          ran ===
          true,

        ready:
          false,

        usable:
          false,

        reason,

        error:
          error?.message ||
          (
            error
              ? String(
                  error
                )
              : null
          )
      },

      authority:
        this.getAuthorityBoundaries()
    };
  },

  /* =====================================================
     RESULT NORMALIZATION
  ===================================================== */

  normalizeResult(
    result = {}
  ) {
    const value =
      result &&
      typeof result ===
        "object"
        ? result
        : {};

    const packet =
      value.realizationPacket &&
      typeof value
        .realizationPacket ===
        "object"
        ? value.realizationPacket
        : value.packet &&
          typeof value.packet ===
            "object"
          ? value.packet
          : null;

    const responseText =
      this.extractText(
        packet?.responseText ||
        value.responseText ||
        packet?.finalResponse ||
        value.finalResponse ||
        ""
      );

    const validation =
      packet?.validation ||
      value.validation ||
      {};

    const ran =
      value.realizationRan ===
        true ||
      value.ran ===
        true;

    const ready =
      Boolean(
        responseText
      ) &&
      (
        value.realizationReady ===
          true ||
        value.ready ===
          true ||
        packet?.ready ===
          true
      );

    const usable =
      ready &&
      (
        value.realizationUsable ===
          true ||
        value.usable ===
          true ||
        packet?.usable ===
          true ||
        validation.usable ===
          true ||
        validation.valid ===
          true
      );

    const complete =
      usable &&
      (
        packet?.complete ===
          true ||
        validation.complete ===
          true
      );

    const suggestedEmoji =
      this.normalizeSuggestedEmoji(
        packet?.suggestedEmoji ||
        value.suggestedEmoji ||
        ""
      );

    const emojiPlacement =
      this.normalizeEmojiPlacement({
        placement:
          packet?.emojiPlacement ||
          value.emojiPlacement ||
          "none",

        emoji:
          suggestedEmoji
      });

    const normalizedPacket =
      packet
        ? {
            ...packet,

            ready,

            usable,

            complete,

            responseText,

            suggestedEmoji,

            emojiPlacement,

            emojiPurpose:
              suggestedEmoji
                ? this.cleanText(
                    packet.emojiPurpose ||
                    value.emojiPurpose ||
                    ""
                  ) ||
                  null
                : null
          }
        : null;

    return {
      ran,

      ready,

      usable,

      complete,

      mode:
        value.realizationMode ||
        packet?.mode ||
        null,

      packet:
        normalizedPacket,

      responseText,

      suggestedEmoji,

      emojiPlacement,

      emojiPurpose:
        normalizedPacket
          ?.emojiPurpose ||
        null,

      responseStrategy:
        normalizedPacket
          ?.responseStrategy ||
        value.responseStrategy ||
        null,

      composerInstructions:
        normalizedPacket
          ?.composerInstructions ||
        value.composerInstructions ||
        null,

      fulfillment:
        normalizedPacket
          ?.fulfillment ||
        value.fulfillment ||
        null,

      grounding:
        normalizedPacket
          ?.grounding ||
        value.grounding ||
        null,

      validation:
        normalizedPacket
          ?.validation ||
        validation ||
        null,

      diagnostics:
        value.diagnostics ||
        normalizedPacket
          ?.diagnostics ||
        null,

      source:
        value.source ||
        normalizedPacket?.source ||
        "ari-response-realization-engine",

      reason:
        value.reason ||
        normalizedPacket?.reason ||
        (
          usable
            ? "response_realization_ready"
            : "response_realization_not_usable"
        ),

      error:
        value.error ||
        value.diagnostics
          ?.error ||
        null,

      raw:
        value
    };
  },

  applyNormalizedResult({
    state = {},
    normalized = {},
    eligibility = {}
  } = {}) {
    return {
      ...state,

      responseRealization:
        normalized.raw ||
        null,

      responseRealizationResult:
        normalized.raw ||
        null,

      responseRealizationRan:
        normalized.ran ===
        true,

      realizationRan:
        normalized.ran ===
        true,

      realizationReady:
        normalized.ready ===
        true,

      realizationUsable:
        normalized.usable ===
        true,

      realizationComplete:
        normalized.complete ===
        true,

      realizationMode:
        normalized.mode ||
        null,

      realizationPacket:
        normalized.packet ||
        null,

      realizationResponseText:
        normalized.responseText ||
        "",

      realizationSuggestedEmoji:
        normalized.suggestedEmoji ||
        "",

      realizationEmojiPlacement:
        normalized.emojiPlacement ||
        "none",

      realizationEmojiPurpose:
        normalized.emojiPurpose ||
        null,

      realizationResponseStrategy:
        normalized.responseStrategy ||
        null,

      realizationComposerInstructions:
        normalized
          .composerInstructions ||
        null,

      realizationFulfillment:
        normalized.fulfillment ||
        null,

      realizationGrounding:
        normalized.grounding ||
        null,

      realizationValidation:
        normalized.validation ||
        null,

      realizationDiagnostics:
        normalized.diagnostics ||
        null,

      responseRealizationSource:
        normalized.source ||
        this.source,

      responseRealizationReason:
        normalized.reason ||
        eligibility.reason ||
        null,

      responseRealizationError:
        normalized.error ||
        null,

      responseRealizationFailed:
        normalized.usable !==
        true,

      responseRealizationEligibility:
        eligibility
    };
  },

  /* =====================================================
     REALIZATION HANDOFF
  ===================================================== */

  buildRealizationHandoff(
    summary = {}
  ) {
    const packet =
      summary.realizationPacket ||
      null;

    const responseText =
      this.extractText(
        summary
          .realizationResponseText ||
        packet?.responseText ||
        ""
      );

    const ready =
      summary.realizationReady ===
        true &&
      summary.realizationUsable ===
        true &&
      Boolean(
        responseText
      );

    return {
      schema:
        "ari_response_realization_handoff",

      schemaVersion:
        this.schemaVersion,

      ready,

      usable:
        summary.realizationUsable ===
        true,

      complete:
        summary.realizationComplete ===
        true,

      completed:
        true,

      source:
        this.source,

      version:
        this.version,

      engineSource:
        summary
          .responseRealizationSource ||
        null,

      reason:
        summary
          .responseRealizationReason ||
        null,

      mode:
        summary.realizationMode ||
        packet?.mode ||
        null,

      responseText:
        responseText ||
        null,

      suggestedEmoji:
        summary
          .realizationSuggestedEmoji ||
        packet?.suggestedEmoji ||
        "",

      emojiPlacement:
        summary
          .realizationEmojiPlacement ||
        packet?.emojiPlacement ||
        "none",

      emojiPurpose:
        summary
          .realizationEmojiPurpose ||
        packet?.emojiPurpose ||
        null,

      responseStrategy:
        summary
          .realizationResponseStrategy ||
        packet?.responseStrategy ||
        null,

      composerInstructions:
        summary
          .realizationComposerInstructions ||
        packet?.composerInstructions ||
        null,

      fulfillment:
        summary.realizationFulfillment ||
        packet?.fulfillment ||
        null,

      grounding:
        summary.realizationGrounding ||
        packet?.grounding ||
        null,

      validation:
        summary
          .realizationValidation ||
        packet?.validation ||
        null,

      realizationPacket:
        packet,

      authority:
        this.getAuthorityBoundaries()
    };
  },

  /* =====================================================
     STAGE PACKET
  ===================================================== */

  buildStagePacket(
    summary = {}
  ) {
    const packet =
      summary.realizationPacket ||
      null;

    const handoff =
      summary
        .responseRealizationHandoff ||
      null;

    const ready =
      summary.realizationReady ===
        true &&
      summary.realizationUsable ===
        true &&
      Boolean(
        this.extractText(
          summary
            .realizationResponseText ||
          packet?.responseText ||
          ""
        )
      );

    return {
      schema:
        "ari_response_realization_stage_packet",

      schemaVersion:
        this.schemaVersion,

      ready,

      usable:
        summary.realizationUsable ===
        true,

      complete:
        summary.realizationComplete ===
        true,

      completed:
        true,

      source:
        this.source,

      version:
        this.version,

      eligibility:
        summary
          .responseRealizationEligibility ||
        null,

      engine: {
        ran:
          summary
            .responseRealizationRan ===
          true,

        source:
          summary
            .responseRealizationSource ||
          null,

        reason:
          summary
            .responseRealizationReason ||
          null,

        error:
          summary
            .responseRealizationError ||
          null
      },

      realization: {
        mode:
          summary.realizationMode ||
          packet?.mode ||
          null,

        ready:
          summary.realizationReady ===
          true,

        usable:
          summary.realizationUsable ===
          true,

        complete:
          summary.realizationComplete ===
          true,

        responseText:
          summary
            .realizationResponseText ||
          packet?.responseText ||
          null,

        suggestedEmoji:
          summary
            .realizationSuggestedEmoji ||
          packet?.suggestedEmoji ||
          "",

        emojiPlacement:
          summary
            .realizationEmojiPlacement ||
          packet?.emojiPlacement ||
          "none",

        emojiPurpose:
          summary
            .realizationEmojiPurpose ||
          packet?.emojiPurpose ||
          null,

        responseStrategy:
          summary
            .realizationResponseStrategy ||
          packet?.responseStrategy ||
          null,

        composerInstructions:
          summary
            .realizationComposerInstructions ||
          packet
            ?.composerInstructions ||
          null,

        fulfillment:
          summary
            .realizationFulfillment ||
          packet?.fulfillment ||
          null,

        grounding:
          summary
            .realizationGrounding ||
          packet?.grounding ||
          null
      },

      validation:
        summary.realizationValidation ||
        packet?.validation ||
        null,

      diagnostics:
        summary.realizationDiagnostics ||
        packet?.diagnostics ||
        null,

      handoff,

      authority:
        this.getAuthorityBoundaries()
    };
  },

  /* =====================================================
     AUTHORITATIVE RESPONSE READERS
  ===================================================== */

  readLockedResponse(
    summary = {}
  ) {
    const locked =
      summary
        .developerResponseLocked ===
        true ||
      summary.responseLocked ===
        true;

    if (!locked) {
      return "";
    }

    return this.extractText(
      summary.lockedDeveloperReply ||
      summary.finalResponse ||
      summary.developerHandoff
        ?.reply ||
      summary.developerHandoff
        ?.finalResponse ||
      summary.developerReply ||
      summary.developerResponse ||
      summary.composerDeveloperPacket
        ?.reply ||
      ""
    );
  },

  readFixedSafetyResponse(
    summary = {}
  ) {
    return this.extractText(
      summary.safetyLockedResponse ||
      summary.safetyResponse ||
      summary.safetyDisposition
        ?.lockedResponse ||
      summary.safetyDisposition
        ?.response ||
      summary.deepSafetyResult
        ?.lockedResponse ||
      summary.deepSafetyResult
        ?.response ||
      summary.safetyContract
        ?.response ||
      ""
    );
  },

  readResolvedCurrentTurn(
    summary = {}
  ) {
    return this.cleanText(
      summary.deliberationPacket
        ?.request
        ?.resolved ||
      summary.resolvedUserQuestion ||
      summary.resolvedQuestion ||
      summary.canonicalResponsePlan
        ?.resolvedUserQuestion ||
      summary.responsePlan
        ?.resolvedUserQuestion ||
      summary.semanticSummary
        ?.canonicalMeaning
        ?.resolvedText ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
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
      12
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
      canDetermineRealizationEligibility:
        true,

      canPreserveLockedResponse:
        true,

      canPreserveFixedSafetyResponse:
        true,

      canInvokeResponseRealizationEngine:
        true,

      canNormalizeRealizationResult:
        true,

      canPreserveRealizationPacket:
        true,

      canPreserveResponseText:
        true,

      canPreserveEmojiSuggestion:
        true,

      canBuildRealizationHandoff:
        true,

      canBuildRealizationStagePacket:
        true,

      canRunBlueprintWriter:
        false,

      canRunAIWriter:
        false,

      canGenerateDraftCandidates:
        false,

      canArbitrateCandidates:
        false,

      canSelectFinalDraft:
        false,

      canComposeFinalResponse:
        false,

      canReinterpretMeaning:
        false,

      canChangeConversationFunction:
        false,

      canChangeResponsePlan:
        false,

      canOverrideSafety:
        false,

      canRetrieveMemory:
        false,

      canPersistMemory:
        false,

      canExecuteActions:
        false,

      canAccessSupabase:
        false,

      canPersistState:
        false,

      role:
        "primary_response_realization_stage_orchestration"
    };
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

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
      return this.cleanText(
        value
      );
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
  },

  splitSentences(
    value = ""
  ) {
    const text =
      this.cleanText(
        value
      );

    if (!text) {
      return [];
    }

    return text
      .replace(
        /\n+/g,
        " "
      )
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

  countQuestions(
    value = ""
  ) {
    return (
      String(
        value ||
        ""
      ).match(
        /\?/g
      ) ||
      []
    ).length;
  }
};

window.Ari.responseRealizationStage =
  window.AriResponseRealizationStage;

console.log(
  "ARI RESPONSE REALIZATION STAGE LOADED:",
  window.AriResponseRealizationStage
    ?.version
);