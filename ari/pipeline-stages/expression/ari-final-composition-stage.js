// ari/pipeline-stages/expression/ari-final-composition-stage.js
// Ari Final Composition Stage
//
// Purpose:
// Produce the final user-facing response from an authoritative locked response
// or a usable Response Realization Packet.
//
// V3.0.0 — Realization-Only Authority / No Candidate Arbitration
//
// Architectural flow:
//
// Response Realization Stage
//      ↓
// Ari Language Composer
//      ↓
// Final Composition Stage
//      ↓
// Delivery Pipeline
//
// Responsibilities:
// - Determine whether final composition is eligible to run.
// - Preserve an explicitly locked authoritative response.
// - Read the canonical Response Realization Packet.
// - Pass realization content and expression guidance to Language Composer.
// - Preserve the Language Composer result.
// - Validate the final response against realization authority.
// - Produce the final-composition handoff and stage packet.
//
// Non-responsibilities:
// - Does not generate response candidates.
// - Does not run Blueprint Writer.
// - Does not run AI Writer.
// - Does not arbitrate response candidates.
// - Does not select a preferred draft.
// - Does not resurrect rejected legacy drafts.
// - Does not reinterpret semantic meaning.
// - Does not alter the canonical response plan.
// - Does not override safety.
// - Does not retrieve or persist memory.
// - Does not execute actions.
// - Does not persist runtime state.

window.Ari = window.Ari || {};

window.AriFinalCompositionStage = {
  version: "3.0.0",
  schemaVersion: "3.0.0",
  source: "ari-final-composition-stage",

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
        "final_composition"
    };

    /* =================================================
       1. COMPOSITION ELIGIBILITY
    ================================================= */

    const compositionEligibility =
      this.resolveCompositionEligibility(
        state
      );

    state = {
      ...state,

      compositionEligibility,

      shouldRunLanguageComposer:
        compositionEligibility
          .runComposer ===
        true,

      shouldPreserveLockedFinal:
        compositionEligibility
          .preserveLockedFinal ===
        true
    };

    /* =================================================
       2. FINAL LANGUAGE COMPOSER
    ================================================= */

    mark(
      "before AriLanguageComposer"
    );

    const composerResult =
      await this.runLanguageComposer({
        state,

        eligibility:
          compositionEligibility
      });

    mark(
      "after AriLanguageComposer"
    );

    state =
      this.applyLanguageComposerResult({
        state,

        composerResult,

        eligibility:
          compositionEligibility
      });

    /* =================================================
       3. FINAL RESPONSE NORMALIZATION
    ================================================= */

    const normalizedResponse =
      this.normalizeFinalResponse(
        state
      );

    state = {
      ...state,

      finalResponse:
        normalizedResponse.text,

      finalResponseSource:
        normalizedResponse.source,

      finalResponseUsable:
        normalizedResponse.usable,

      finalResponseAuthorized:
        normalizedResponse.authorized,

      finalResponseDegraded:
        normalizedResponse.degraded,

      finalResponseFailureReason:
        normalizedResponse
          .failureReason,

      finalResponseLength:
        normalizedResponse.length,

      finalResponseWarnings:
        normalizedResponse.warnings,

      finalResponseValidation:
        normalizedResponse.validation
    };

    /* =================================================
       4. FINAL COMPOSITION HANDOFF
    ================================================= */

    state.finalCompositionHandoff =
      this.buildFinalCompositionHandoff(
        state
      );

    /* =================================================
       5. STAGE PACKET
    ================================================= */

    state.finalCompositionStagePacket =
      this.buildFinalCompositionStagePacket(
        state
      );

    state.finalCompositionStageRan =
      true;

    state.finalCompositionStageSource =
      this.source;

    state.finalCompositionStageVersion =
      this.version;

    return state;
  },

  /* =====================================================
     ELIGIBILITY
  ===================================================== */

  resolveCompositionEligibility(
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

    const hasLockedFinal =
      Boolean(
        lockedResponse
      ) &&
      (
        developerLocked ||
        responseLocked
      );

    const realization =
      this.readCanonicalRealization(
        summary
      );

    const realizationReady =
      realization.ready ===
        true;

    const realizationUsable =
      realization.usable ===
        true;

    const realizationResponseAvailable =
      Boolean(
        realization.responseText
      );

    const realizationAuthorized =
      realizationReady &&
      realizationUsable &&
      realizationResponseAvailable;

    return {
      runComposer:
        !hasLockedFinal &&
        realizationAuthorized,

      preserveLockedFinal:
        hasLockedFinal,

      developerLocked,

      responseLocked,

      hasLockedFinal,

      lockedResponseAvailable:
        Boolean(
          lockedResponse
        ),

      realizationAvailable:
        realization.available,

      realizationReady,

      realizationUsable,

      realizationComplete:
        realization.complete,

      realizationResponseAvailable,

      realizationAuthorized,

      realizationSource:
        realization.source,

      realizationMode:
        realization.mode,

      source:
        "ari-final-composition-stage-eligibility",

      reason:
        hasLockedFinal
          ? "locked_final_response_available"
          : !realization.available
            ? "response_realization_missing"
            : !realizationReady
              ? "response_realization_not_ready"
              : !realizationUsable
                ? "response_realization_not_usable"
                : !realizationResponseAvailable
                  ? "realization_response_text_missing"
                  : "response_realization_ready_for_composition"
    };
  },

  /* =====================================================
     CANONICAL REALIZATION
  ===================================================== */

  readCanonicalRealization(
    summary = {}
  ) {
    const packet =
      summary.realizationPacket &&
      typeof summary
        .realizationPacket ===
        "object"
        ? summary.realizationPacket
        : summary
              .responseRealizationHandoff
              ?.realizationPacket &&
            typeof summary
              .responseRealizationHandoff
              .realizationPacket ===
              "object"
          ? summary
              .responseRealizationHandoff
              .realizationPacket
          : null;

    const handoff =
      summary
        .responseRealizationHandoff &&
      typeof summary
        .responseRealizationHandoff ===
        "object"
        ? summary
            .responseRealizationHandoff
        : null;

    if (
      !packet &&
      !handoff
    ) {
      return {
        available:
          false,

        ready:
          false,

        usable:
          false,

        complete:
          false,

        responseText:
          "",

        suggestedEmoji:
          "",

        emojiPlacement:
          "none",

        emojiPurpose:
          null,

        responseStrategy:
          null,

        composerInstructions:
          null,

        fulfillment:
          null,

        grounding:
          null,

        validation:
          null,

        source:
          null,

        mode:
          null,

        reason:
          "response_realization_missing",

        packet:
          null,

        handoff:
          null
      };
    }

    const responseText =
      this.extractText(
        packet?.responseText ||
        handoff?.responseText ||
        summary
          .realizationResponseText ||
        ""
      );

    const suggestedEmoji =
      this.normalizeSuggestedEmoji(
        packet?.suggestedEmoji ||
        handoff?.suggestedEmoji ||
        summary
          .realizationSuggestedEmoji ||
        ""
      );

    const emojiPlacement =
      this.normalizeEmojiPlacement({
        placement:
          packet?.emojiPlacement ||
          handoff?.emojiPlacement ||
          summary
            .realizationEmojiPlacement ||
          "none",

        emoji:
          suggestedEmoji
      });

    const ready =
      (
        packet?.ready ===
          true ||
        handoff?.ready ===
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
        packet?.usable ===
          true ||
        handoff?.usable ===
          true ||
        summary.realizationUsable ===
          true ||
        packet?.validation
          ?.usable ===
          true ||
        packet?.validation
          ?.valid ===
          true
      );

    const complete =
      usable &&
      (
        packet?.complete ===
          true ||
        handoff?.complete ===
          true ||
        summary
          .realizationComplete ===
          true ||
        packet?.validation
          ?.complete ===
          true
      );

    return {
      available:
        true,

      ready,

      usable,

      complete,

      responseText,

      suggestedEmoji,

      emojiPlacement,

      emojiPurpose:
        suggestedEmoji
          ? this.cleanText(
              packet?.emojiPurpose ||
              handoff?.emojiPurpose ||
              summary
                .realizationEmojiPurpose ||
              ""
            ) ||
            null
          : null,

      responseStrategy:
        packet?.responseStrategy ||
        handoff?.responseStrategy ||
        summary
          .realizationResponseStrategy ||
        null,

      composerInstructions:
        packet
          ?.composerInstructions ||
        handoff
          ?.composerInstructions ||
        summary
          .realizationComposerInstructions ||
        null,

      fulfillment:
        packet?.fulfillment ||
        handoff?.fulfillment ||
        summary
          .realizationFulfillment ||
        null,

      grounding:
        packet?.grounding ||
        handoff?.grounding ||
        summary
          .realizationGrounding ||
        null,

      validation:
        packet?.validation ||
        handoff?.validation ||
        summary
          .realizationValidation ||
        null,

      source:
        packet?.source ||
        handoff?.engineSource ||
        summary
          .responseRealizationSource ||
        "ari-response-realization-engine",

      mode:
        packet?.mode ||
        handoff?.mode ||
        summary.realizationMode ||
        null,

      reason:
        packet?.reason ||
        handoff?.reason ||
        summary
          .responseRealizationReason ||
        (
          usable
            ? "response_realization_ready"
            : "response_realization_not_usable"
        ),

      packet,

      handoff
    };
  },

  /* =====================================================
     LANGUAGE COMPOSER
  ===================================================== */

  async runLanguageComposer({
    state = {},
    eligibility = {}
  } = {}) {
    if (
      eligibility
        .preserveLockedFinal ===
      true
    ) {
      const lockedFinal =
        this.readLockedResponse(
          state
        );

      return {
        schema:
          "ari_language_composer_locked_passthrough",

        schemaVersion:
          this.schemaVersion,

        languageComposerRan:
          false,

        languageComposerInvoked:
          false,

        languageComposerProducedResponse:
          Boolean(
            lockedFinal
          ),

        languageComposerUsable:
          Boolean(
            lockedFinal
          ),

        languageComposerAuthorized:
          Boolean(
            lockedFinal
          ),

        languageComposerDegraded:
          false,

        languageComposerSource:
          "locked-authoritative-response",

        source:
          "locked-authoritative-response",

        reason:
          "locked_final_response_preserved",

        finalResponse:
          lockedFinal,

        languageBody:
          lockedFinal,

        realizationAuthorized:
          false,

        lockedResponseAuthorized:
          true
      };
    }

    if (
      eligibility.runComposer !==
      true
    ) {
      return this.buildCompositionFailure({
        reason:
          eligibility.reason ||
          "final_composition_not_eligible",

        source:
          "skipped-by-composition-eligibility",

        invoked:
          false
      });
    }

    const realization =
      this.readCanonicalRealization(
        state
      );

    if (
      realization.ready !==
        true ||
      realization.usable !==
        true ||
      !realization.responseText
    ) {
      return this.buildCompositionFailure({
        reason:
          realization.reason ||
          "response_realization_not_ready",

        source:
          "realization-not-ready",

        invoked:
          false
      });
    }

    const composerEngine =
      window.AriLanguageComposerV9 ||
      window.AriLanguageComposer;

    if (
      !composerEngine ||
      typeof composerEngine.compose !==
        "function"
    ) {
      return this.buildCompositionFailure({
        reason:
          "language_composer_not_loaded",

        source:
          "not-loaded",

        invoked:
          false
      });
    }

    const finalComposerPacket =
      this.buildFinalComposerPacket(
        state
      );

    try {
      const result =
        await composerEngine.compose({
          realizationPacket:
            realization.packet,

          responseRealization:
            realization,

          finalComposerPacket,

          composerPacket:
            finalComposerPacket,

          summary:
            state
        });

      if (
        !result ||
        typeof result !==
          "object"
      ) {
        return this.buildCompositionFailure({
          reason:
            "language_composer_returned_invalid_result",

          source:
            "invalid-result",

          invoked:
            true
        });
      }

      return {
        ...result,

        realizationAuthorized:
          true,

        lockedResponseAuthorized:
          false
      };
    } catch (error) {
      console.error(
        "Ari Language Composer failed:",
        error
      );

      return this.buildCompositionFailure({
        reason:
          "language_composer_execution_failed",

        source:
          "composer-error",

        invoked:
          true,

        error
      });
    }
  },

  buildCompositionFailure({
    reason =
      "final_composition_failed",

    source =
      "composition-failure",

    invoked =
      false,

    error =
      null
  } = {}) {
    return {
      schema:
        "ari_language_composer_failure",

      schemaVersion:
        this.schemaVersion,

      languageComposerRan:
        false,

      languageComposerInvoked:
        invoked ===
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
        source,

      source,

      reason,

      finalResponse:
        "",

      languageBody:
        "",

      realizationAuthorized:
        false,

      lockedResponseAuthorized:
        false,

      error:
        error?.message ||
        (
          error
            ? String(
                error
              )
            : null
        )
    };
  },

  applyLanguageComposerResult({
    state = {},
    composerResult = {},
    eligibility = {}
  } = {}) {
    const result =
      composerResult &&
      typeof composerResult ===
        "object"
        ? composerResult
        : {};

    const composerFinal =
      this.extractText(
        result.finalResponse ||
        result.languageBody ||
        result.languageComposerOutput ||
        result.responseText ||
        ""
      );

    const lockedFinal =
      eligibility
        .preserveLockedFinal ===
        true
        ? this.readLockedResponse(
            state
          )
        : "";

    const finalResponse =
      lockedFinal ||
      composerFinal ||
      "";

    const composerInvoked =
      result
        .languageComposerInvoked ===
        true ||
      (
        eligibility.runComposer ===
          true &&
        eligibility
          .preserveLockedFinal !==
          true
      );

    const composerRan =
      result.languageComposerRan ===
        true ||
      (
        composerInvoked &&
        Boolean(
          composerFinal
        )
      );

    const producedResponse =
      result
        .languageComposerProducedResponse ===
        true ||
      Boolean(
        composerFinal
      ) ||
      Boolean(
        lockedFinal
      );

    const realizationAuthorized =
      result
        .realizationAuthorized ===
        true ||
      eligibility
        .realizationAuthorized ===
        true;

    const lockedResponseAuthorized =
      result
        .lockedResponseAuthorized ===
        true ||
      eligibility
        .preserveLockedFinal ===
        true;

    return {
      ...state,

      languageComposer:
        result,

      languageComposerRan:
        composerRan,

      languageComposerInvoked:
        composerInvoked,

      languageComposerProducedResponse:
        producedResponse,

      languageComposerUsable:
        result.languageComposerUsable ===
          true ||
        Boolean(
          finalResponse
        ),

      languageComposerAuthorized:
        result
          .languageComposerAuthorized ===
          true ||
        realizationAuthorized ||
        lockedResponseAuthorized,

      languageComposerDegraded:
        result
          .languageComposerDegraded ===
          true,

      languageComposerSource:
        result
          .languageComposerSource ||
        result.source ||
        (
          lockedResponseAuthorized
            ? "locked-authoritative-response"
            : composerRan
              ? "ari-language-composer"
              : "composition-failure"
        ),

      languageComposerReason:
        result.reason ||
        result.composerValidation
          ?.reason ||
        null,

      languageComposerError:
        result.error ||
        null,

      realizationWasComposerAuthorized:
        realizationAuthorized,

      lockedResponseWasComposerAuthorized:
        lockedResponseAuthorized,

      finalResponse
    };
  },

  /* =====================================================
     FINAL COMPOSER PACKET
  ===================================================== */

  buildFinalComposerPacket(
    summary = {}
  ) {
    const realization =
      this.readCanonicalRealization(
        summary
      );

    const responsePlan =
      summary.canonicalResponsePlan ||
      summary.responsePlan ||
      {};

    return {
      schema:
        "ari_final_composer_packet",

      schemaVersion:
        this.schemaVersion,

      ready:
        realization.ready ===
          true &&
        realization.usable ===
          true &&
        Boolean(
          realization.responseText
        ),

      source:
        this.source,

      version:
        this.version,

      architecture:
        "direct-response-realization",

      request: {
        originalText:
          this.readOriginalCurrentTurn(
            summary
          ),

        resolvedText:
          this.readResolvedCurrentTurn(
            summary
          ),

        turnId:
          summary.turnId ||
          summary.currentTurnId ||
          realization.packet
            ?.request
            ?.turnId ||
          null
      },

      realization: {
        ready:
          realization.ready,

        usable:
          realization.usable,

        complete:
          realization.complete,

        mode:
          realization.mode,

        source:
          realization.source,

        reason:
          realization.reason,

        responseText:
          realization.responseText,

        responseStrategy:
          realization.responseStrategy,

        suggestedEmoji:
          realization.suggestedEmoji,

        emojiPlacement:
          realization.emojiPlacement,

        emojiPurpose:
          realization.emojiPurpose,

        composerInstructions:
          realization
            .composerInstructions,

        fulfillment:
          realization.fulfillment,

        grounding:
          realization.grounding,

        validation:
          realization.validation
      },

      responseText:
        realization.responseText,

      suggestedEmoji:
        realization.suggestedEmoji,

      emojiPlacement:
        realization.emojiPlacement,

      emojiPurpose:
        realization.emojiPurpose,

      responseStrategy:
        realization.responseStrategy,

      composerInstructions:
        realization
          .composerInstructions,

      character: {
        handoff:
          summary.characterHandoff ||
          null,

        emotion:
          summary.emotion ||
          summary.characterHandoff
            ?.emotion ||
          null,

        tone:
          summary.characterHandoff
            ?.tone ||
          null,

        warmth:
          summary.characterHandoff
            ?.warmth ||
          null,

        directness:
          summary.characterHandoff
            ?.directness ||
          null,

        expression:
          summary.characterHandoff
            ?.expression ||
          null
      },

      languageGuidance: {
        handoff:
          summary
            .languageGuidanceHandoff ||
          null,

        lexicalGrounding:
          summary.lexicalGrounding ||
          null,

        humanLanguageProfile:
          summary
            .humanLanguageProfile ||
          null,

        expressionPlan:
          summary.expressionPlan ||
          null,

        communicationPlan:
          summary.communicationPlan ||
          null,

        mouthDirective:
          summary.mouthDirective ||
          null
      },

      responseControl: {
        goal:
          summary.responseGoal ||
          responsePlan.responseGoal ||
          null,

        shape:
          summary.responseShape ||
          responsePlan.responseShape ||
          null,

        posture:
          summary.responsePosture ||
          responsePlan
            .responsePosture ||
          null,

        order:
          this.toArray(
            summary.responseOrder ||
            summary.responseMoves ||
            responsePlan.responseMoves
          ),

        rules:
          this.toArray(
            summary.responseRules ||
            responsePlan.responseRules
          ),

        constraints:
          this.toArray(
            summary
              .responseConstraints ||
            responsePlan.constraints
          ),

        requiredBehaviors:
          this.toArray(
            summary.responseRequired ||
            summary.requiredBehaviors ||
            responsePlan
              .requiredBehaviors
          ),

        forbiddenBehaviors:
          this.toArray(
            summary.responseAvoid ||
            summary.forbiddenBehaviors ||
            responsePlan
              .forbiddenBehaviors
          ),

        communicationPlan:
          summary.communicationPlan ||
          null,

        composerDirective:
          summary.composerDirective ||
          null
      },

      continuity: {
        semantic:
          summary.semanticSummary
            ?.continuity ||
          null,

        handoff:
          summary.continuityHandoff ||
          summary.continuityResult ||
          null,

        realizationUsedContinuity:
          realization.grounding
            ?.usedContinuity ===
          true
      },

      safety: {
        earlyGate:
          summary.safetyContextGate ||
          null,

        deepReview:
          summary.deepSafetyResult ||
          null,

        disposition:
          summary.safetyDisposition ||
          null,

        shouldStopNormalResponse:
          summary
            .safetyShouldStopNormalResponse ===
            true ||
          summary.safetyDisposition
            ?.shouldStopNormalResponse ===
            true ||
          summary.deepSafetyResult
            ?.shouldStopNormalResponse ===
            true,

        communicationStyle:
          summary
            .safetyCommunicationStyle ||
          summary.safetyDisposition
            ?.communicationStyle ||
          null
      },

      developer: {
        relevant:
          summary.developerRelevant ===
            true ||
          summary.developerHandoff
            ?.relevant ===
            true,

        locked:
          summary
            .developerResponseLocked ===
            true ||
          summary.responseLocked ===
            true,

        handoff:
          summary.developerHandoff ||
          summary
            .unlockedDeveloperHandoff ||
          null
      },

      authority:
        {
          realizationAuthorized:
            realization.ready ===
              true &&
            realization.usable ===
              true &&
            Boolean(
              realization.responseText
            ),

          canPreserveRealizationMeaning:
            true,

          canSmoothLanguage:
            realization
              .composerInstructions
              ?.maySmoothLanguage !==
            false,

          canUseSuggestedEmoji:
            realization
              .composerInstructions
              ?.useSuggestedEmoji ===
              true &&
            Boolean(
              realization.suggestedEmoji
            ),

          canChangeSemanticMeaning:
            false,

          canChangeResponseGoal:
            false,

          canOverrideSafety:
            false,

          role:
            "final_realization_presentation_contract"
        }
    };
  },

  /* =====================================================
     FINAL RESPONSE NORMALIZATION
  ===================================================== */

  normalizeFinalResponse(
    summary = {}
  ) {
    const text =
      this.extractText(
        summary.finalResponse
      );

    const realization =
      this.readCanonicalRealization(
        summary
      );

    const warnings = [];
    const errors = [];

    if (!text) {
      errors.push(
        "final_response_empty"
      );
    }

    if (
      text &&
      text.length <
        3
    ) {
      errors.push(
        "final_response_too_short"
      );
    }

    if (
      this.containsInvalidValue(
        text
      )
    ) {
      errors.push(
        "final_response_contains_invalid_value"
      );
    }

    if (
      this.containsInternalMetaLanguage(
        text
      )
    ) {
      errors.push(
        "final_response_contains_internal_meta_language"
      );
    }

    if (
      this.containsWriterFailureMessage(
        text
      )
    ) {
      errors.push(
        "final_response_contains_writer_failure_message"
      );
    }

    const lockedAuthorized =
      summary.compositionEligibility
        ?.hasLockedFinal ===
        true &&
      summary
        .lockedResponseWasComposerAuthorized ===
        true;

    const realizationAuthorized =
      summary.compositionEligibility
        ?.realizationAuthorized ===
        true &&
      summary
        .realizationWasComposerAuthorized ===
        true &&
      realization.ready ===
        true &&
      realization.usable ===
        true;

    const composerProducedResponse =
      summary
        .languageComposerProducedResponse ===
        true &&
      Boolean(
        text
      );

    const composerAuthorized =
      summary
        .languageComposerAuthorized ===
        true;

    const authorized =
      lockedAuthorized ||
      (
        realizationAuthorized &&
        composerAuthorized
      );

    if (
      text &&
      !composerProducedResponse &&
      !lockedAuthorized
    ) {
      errors.push(
        "language_composer_did_not_produce_response"
      );
    }

    if (
      text &&
      !authorized
    ) {
      errors.push(
        "final_response_not_authorized"
      );
    }

    const composerFailureReason =
      summary.languageComposerReason ||
      summary
        .languageComposer
        ?.composerValidation
        ?.reason ||
      summary
        .languageComposer
        ?.reason ||
      summary.compositionEligibility
        ?.reason ||
      null;

    const usable =
      Boolean(
        text
      ) &&
      errors.length ===
        0 &&
      authorized;

    const finalText =
      usable
        ? text
        : this.honestFailureFallback();

    const source =
      usable
        ? lockedAuthorized
          ? "locked_authorized_response"
          : summary
              .languageComposerSource ||
            "response_realization_composition"
        : "composition_failure";

    return {
      text:
        finalText,

      usable,

      authorized,

      degraded:
        !usable,

      source,

      failureReason:
        usable
          ? null
          : errors[0] ||
            composerFailureReason ||
            "final_composition_failed",

      length:
        finalText.length,

      warnings:
        this.uniqueValues(
          warnings
        ),

      validation: {
        valid:
          usable,

        authorized,

        lockedAuthorized,

        realizationAuthorized,

        composerAuthorized,

        composerProducedResponse,

        realizationReady:
          realization.ready,

        realizationUsable:
          realization.usable,

        errors:
          this.uniqueValues(
            errors
          ),

        warnings:
          this.uniqueValues(
            warnings
          )
      }
    };
  },

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

  containsInternalMetaLanguage(
    text = ""
  ) {
    const normalized =
      this.normalizeText(
        text
      );

    const phrases = [
      "answer the direct question",
      "the user is asking",
      "blueprint writer",
      "ai writer",
      "candidate arbiter",
      "response candidate arbiter",
      "composer packet",
      "canonical response plan",
      "response realization engine",
      "realization packet",
      "response move",
      "response strategy",
      "response shape",
      "internal planner",
      "pipeline diagnostics",
      "pipeline stage"
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
      "try once more and ill answer",
      "try once more and i ll answer",
      "the response generator failed",
      "i cannot generate the response"
    ];

    return phrases.some(
      phrase =>
        normalized.includes(
          phrase
        )
    );
  },

  honestFailureFallback() {
    return "I know what you’re asking, but I don’t have a reliable answer ready. I’d rather be honest than make something up.";
  },

  /* =====================================================
     FINAL COMPOSITION HANDOFF
  ===================================================== */

  buildFinalCompositionHandoff(
    summary = {}
  ) {
    const ready =
      summary.finalResponseUsable ===
        true;

    const realization =
      this.readCanonicalRealization(
        summary
      );

    return {
      schema:
        "ari_final_composition_handoff",

      schemaVersion:
        this.schemaVersion,

      ready,

      usable:
        ready,

      completed:
        true,

      source:
        this.source,

      version:
        this.version,

      architecture:
        "direct-response-realization",

      finalResponse:
        summary.finalResponse ||
        null,

      finalResponseUsable:
        ready,

      finalResponseAuthorized:
        summary
          .finalResponseAuthorized ===
        true,

      degraded:
        summary
          .finalResponseDegraded ===
        true,

      failureReason:
        summary
          .finalResponseFailureReason ||
        null,

      responseSource:
        summary.finalResponseSource ||
        null,

      length:
        summary.finalResponseLength ||
        0,

      warnings:
        this.toArray(
          summary.finalResponseWarnings
        ),

      validation:
        summary
          .finalResponseValidation ||
        null,

      composer: {
        invoked:
          summary
            .languageComposerInvoked ===
          true,

        ran:
          summary.languageComposerRan ===
          true,

        producedResponse:
          summary
            .languageComposerProducedResponse ===
          true,

        usable:
          summary
            .languageComposerUsable ===
          true,

        authorized:
          summary
            .languageComposerAuthorized ===
          true,

        degraded:
          summary
            .languageComposerDegraded ===
          true,

        source:
          summary.languageComposerSource ||
          null,

        reason:
          summary.languageComposerReason ||
          null,

        error:
          summary.languageComposerError ||
          null,

        value:
          summary.languageComposer ||
          null
      },

      realization: {
        available:
          realization.available,

        ready:
          realization.ready,

        usable:
          realization.usable,

        complete:
          realization.complete,

        mode:
          realization.mode,

        source:
          realization.source,

        reason:
          realization.reason,

        responseText:
          realization.responseText ||
          null,

        suggestedEmoji:
          realization.suggestedEmoji,

        emojiPlacement:
          realization.emojiPlacement,

        emojiPurpose:
          realization.emojiPurpose,

        composerInstructions:
          realization
            .composerInstructions,

        authorized:
          summary
            .realizationWasComposerAuthorized ===
          true
      },

      responseControl: {
        goal:
          summary.responseGoal ||
          null,

        shape:
          summary.responseShape ||
          null,

        posture:
          summary.responsePosture ||
          null,

        emotion:
          summary.emotion ||
          summary.characterHandoff
            ?.emotion ||
          null,

        communicationPlan:
          summary.communicationPlan ||
          null
      },

      authority:
        this.getAuthorityBoundaries()
    };
  },

  /* =====================================================
     STAGE PACKET
  ===================================================== */

  buildFinalCompositionStagePacket(
    summary = {}
  ) {
    const ready =
      summary.finalResponseUsable ===
        true;

    const realization =
      this.readCanonicalRealization(
        summary
      );

    return {
      schema:
        "ari_final_composition_stage_packet",

      schemaVersion:
        this.schemaVersion,

      ready,

      usable:
        ready,

      completed:
        true,

      source:
        this.source,

      version:
        this.version,

      architecture:
        "direct-response-realization",

      eligibility:
        summary.compositionEligibility ||
        null,

      realization: {
        available:
          realization.available,

        ready:
          realization.ready,

        usable:
          realization.usable,

        complete:
          realization.complete,

        mode:
          realization.mode,

        source:
          realization.source,

        reason:
          realization.reason,

        responseTextAvailable:
          Boolean(
            realization.responseText
          ),

        suggestedEmoji:
          realization.suggestedEmoji,

        emojiPlacement:
          realization.emojiPlacement,

        authorized:
          summary
            .realizationWasComposerAuthorized ===
          true
      },

      composer: {
        invoked:
          summary
            .languageComposerInvoked ===
          true,

        ran:
          summary.languageComposerRan ===
          true,

        producedResponse:
          summary
            .languageComposerProducedResponse ===
          true,

        usable:
          summary
            .languageComposerUsable ===
          true,

        authorized:
          summary
            .languageComposerAuthorized ===
          true,

        degraded:
          summary
            .languageComposerDegraded ===
          true,

        source:
          summary.languageComposerSource ||
          null,

        reason:
          summary.languageComposerReason ||
          null,

        error:
          summary.languageComposerError ||
          null,

        value:
          summary.languageComposer ||
          null
      },

      result: {
        ready,

        finalResponse:
          summary.finalResponse ||
          null,

        usable:
          ready,

        authorized:
          summary
            .finalResponseAuthorized ===
          true,

        degraded:
          summary
            .finalResponseDegraded ===
          true,

        failureReason:
          summary
            .finalResponseFailureReason ||
          null,

        source:
          summary.finalResponseSource ||
          null,

        length:
          summary.finalResponseLength ||
          0,

        warnings:
          this.toArray(
            summary.finalResponseWarnings
          ),

        validation:
          summary
            .finalResponseValidation ||
          null
      },

      handoff:
        summary.finalCompositionHandoff ||
        null,

      legacy: {
        arbitrationRequired:
          false,

        candidateSelectionRequired:
          false,

        selectedDraftRequired:
          false,

        blueprintDraftAllowed:
          false,

        aiWriterDraftAllowed:
          false,

        characterDraftAllowed:
          false
      },

      authority:
        this.getAuthorityBoundaries()
    };
  },

  /* =====================================================
     LOCKED RESPONSE
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
      ""
    );
  },

  /* =====================================================
     CURRENT TURN
  ===================================================== */

  readOriginalCurrentTurn(
    summary = {}
  ) {
    return this.extractText(
      summary.deliberationPacket
        ?.request
        ?.original ||
      summary.originalUserMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );
  },

  readResolvedCurrentTurn(
    summary = {}
  ) {
    return this.extractText(
      summary.deliberationPacket
        ?.request
        ?.resolved ||
      summary.resolvedUserQuestion ||
      summary.resolvedQuestion ||
      summary.canonicalResponsePlan
        ?.resolvedUserQuestion ||
      summary.responsePlan
        ?.resolvedUserQuestion ||
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
      canReadCanonicalRealization:
        true,

      canInvokeLanguageComposer:
        true,

      canPreserveLockedResponse:
        true,

      canPreserveRealizationAuthority:
        true,

      canNormalizeFinalResponseContract:
        true,

      canValidateFinalResponse:
        true,

      canBuildFinalCompositionHandoff:
        true,

      canBuildFinalCompositionStagePacket:
        true,

      canUseRealizationResponse:
        true,

      canUseSuggestedEmoji:
        true,

      canUseCandidateArbitration:
        false,

      canSelectCandidate:
        false,

      canUseSelectedDraft:
        false,

      canUseRawAIDraft:
        false,

      canUseRawCharacterDraft:
        false,

      canUseRawBlueprintDraft:
        false,

      canResurrectRejectedCandidate:
        false,

      canGenerateNormalResponse:
        false,

      canReinterpretMeaning:
        false,

      canChangeRouting:
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

      canPersistState:
        false,

      role:
        "authorized_realization_final_composition"
    };
  },

  /* =====================================================
     HELPERS
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

  normalizeText(
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
        /[^\w\s']/g,
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

window.Ari.finalCompositionStage =
  window.AriFinalCompositionStage;

console.log(
  "ARI FINAL COMPOSITION STAGE LOADED:",
  window.AriFinalCompositionStage
    ?.version
);