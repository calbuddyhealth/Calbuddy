// ari/pipeline-stages/expression/ari-final-composition-stage.js
// Ari Final Composition Stage
//
// Purpose:
// Produce the final user-facing response from an authoritative locked response
// or the authoritative OpenAI draft.
//
// V4.0.0 — Authoritative Draft Composition / No Realization Dependency
//
// Canonical flow:
//
// Deliberation Pipeline
//      ↓
// Authoritative Draft
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
// - Determine whether final composition is eligible to run.
// - Preserve an explicitly locked authoritative response.
// - Read and preserve the authoritative OpenAI draft.
// - Pass the authoritative draft and presentation guidance to Language Composer.
// - Preserve the Language Composer result.
// - Fall back to the untouched authoritative draft when optional composition
//   is unavailable or unsafe.
// - Validate the final response without creating substitute language.
// - Produce the final-composition handoff and stage packet.
//
// Non-responsibilities:
// - Does not run Response Realization.
// - Does not generate response candidates.
// - Does not run Blueprint Writer.
// - Does not run AI Writer.
// - Does not arbitrate response candidates.
// - Does not select a preferred draft.
// - Does not resurrect rejected legacy drafts.
// - Does not reinterpret semantic meaning.
// - Does not alter the canonical response plan.
// - Does not create a generic failure response.
// - Does not override safety.
// - Does not retrieve or persist memory.
// - Does not execute actions.
// - Does not persist runtime state.

window.Ari = window.Ari || {};

window.AriFinalCompositionStage = {
  version: "4.0.0",
  schemaVersion: "4.0.0",
  source: "ari-final-composition-stage",
  architecture: "authoritative-draft-final-composition",

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

    const authoritativeDraft =
      this.resolveAuthoritativeDraft(
        state
      );

    state = {
      ...state,

      authoritativeDraft,

      compositionInputText:
        authoritativeDraft,

      authoritativeDraftAvailable:
        Boolean(
          authoritativeDraft
        ),

      authoritativeDraftSource:
        this.resolveAuthoritativeDraftSource(
          state
        )
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

      responseText:
        normalizedResponse.text,

      reply:
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

    state.finalCompositionStageReady =
      state.finalResponseUsable ===
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

    const authoritativeDraft =
      this.resolveAuthoritativeDraft(
        summary
      );

    const authoritativeDraftAvailable =
      Boolean(
        authoritativeDraft
      );

    return {
      runComposer:
        !hasLockedFinal &&
        authoritativeDraftAvailable,

      preserveLockedFinal:
        hasLockedFinal,

      developerLocked,

      responseLocked,

      hasLockedFinal,

      lockedResponseAvailable:
        Boolean(
          lockedResponse
        ),

      authoritativeDraftAvailable,

      authoritativeDraftSource:
        this.resolveAuthoritativeDraftSource(
          summary
        ),

      source:
        "ari-final-composition-stage-eligibility",

      reason:
        hasLockedFinal
          ? "locked_final_response_available"
          : !authoritativeDraftAvailable
            ? "authoritative_draft_missing"
            : "authoritative_draft_ready_for_composition"
    };
  },

  /* =====================================================
     AUTHORITATIVE DRAFT
  ===================================================== */

  resolveAuthoritativeDraft(
    summary = {}
  ) {
    return this.firstText(
      summary.authoritativeDraft,

      summary.compositionInputText,

      summary.draftResponse,

      summary.selectedDraft,

      summary.responseText,

      summary.cognitiveReasoningResult
        ?.authoritativeDraft,

      summary.cognitiveReasoningResult
        ?.draftResponse,

      summary.cognitiveReasoningResult
        ?.responseText,

      summary.cognitiveReasoningResult
        ?.finalResponse,

      summary.cognitiveReasoningResult
        ?.answer,

      summary.cognitiveReasoningResult
        ?.reply,

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

  resolveAuthoritativeDraftSource(
    summary = {}
  ) {
    const candidates = [
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
        "summary.selectedDraft",
        summary.selectedDraft
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

        ready:
          Boolean(
            lockedFinal
          ),

        usable:
          Boolean(
            lockedFinal
          ),

        complete:
          Boolean(
            lockedFinal
          ),

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

        responseText:
          lockedFinal,

        reply:
          lockedFinal,

        languageBody:
          lockedFinal,

        lockedResponseAuthorized:
          true,

        authoritativeDraftAvailable:
          Boolean(
            state.authoritativeDraft
          )
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

    const authoritativeDraft =
      this.resolveAuthoritativeDraft(
        state
      );

    if (
      !authoritativeDraft
    ) {
      return this.buildCompositionFailure({
        reason:
          "authoritative_draft_missing",

        source:
          "authoritative-draft-not-ready",

        invoked:
          false
      });
    }

    const composerEngine =
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

    try {
      const result =
        await composerEngine.compose({
          authoritativeDraft,

          compositionInputText:
            authoritativeDraft,

          draftResponse:
            authoritativeDraft,

          responseText:
            authoritativeDraft,

          responsePlan:
            state.responsePlan ||
            state.responseStrategy ||
            state.deliberationPacket
              ?.responsePlanning
              ?.plan ||
            null,

          characterHandoff:
            state.characterHandoff ||
            state.characterStagePacket
              ?.handoff ||
            null,

          languageGuidanceHandoff:
            state
              .languageGuidanceHandoff ||
            state.languageGuidanceStagePacket
              ?.handoff ||
            null,

          safetyDisposition:
            state.safetyDisposition ||
            null,

          deepSafetyResult:
            state.deepSafetyResult ||
            null,

          communicationPlan:
            state.communicationPlan ||
            null,

          lexicalGrounding:
            state.lexicalGrounding ||
            null,

          humanLanguageProfile:
            state.humanLanguageProfile ||
            null,

          expressionPlan:
            state.expressionPlan ||
            null,

          mouthDirective:
            state.mouthDirective ||
            null,

          presentationPolicy:
            state.presentationPolicy ||
            null,

          originalUserMessage:
            this.readOriginalCurrentTurn(
              state
            ),

          resolvedUserQuestion:
            this.readResolvedCurrentTurn(
              state
            ),

          turnId:
            state.turnId ||
            state.currentTurnId ||
            null,

          responseLocked:
            state.responseLocked ===
            true,

          developerResponseLocked:
            state
              .developerResponseLocked ===
            true,

          lockedDeveloperReply:
            state.lockedDeveloperReply ||
            null,

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

      return result;
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

      ready:
        false,

      usable:
        false,

      complete:
        false,

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

      responseText:
        "",

      reply:
        "",

      languageBody:
        "",

      lockedResponseAuthorized:
        false,

      authoritativeDraftFallbackUsed:
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
      this.firstText(
        result.finalResponse,

        result.responseText,

        result.reply,

        result.languageBody,

        result.languageComposerOutput
      );

    const lockedFinal =
      eligibility
        .preserveLockedFinal ===
        true
        ? this.readLockedResponse(
            state
          )
        : "";

    const authoritativeDraft =
      this.resolveAuthoritativeDraft(
        state
      );

    const finalResponse =
      lockedFinal ||
      composerFinal ||
      authoritativeDraft ||
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

    const lockedResponseAuthorized =
      result
        .lockedResponseAuthorized ===
        true ||
      eligibility
        .preserveLockedFinal ===
        true;

    const authoritativeDraftFallbackUsed =
      !lockedFinal &&
      !composerFinal &&
      Boolean(
        authoritativeDraft
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
      ) ||
      authoritativeDraftFallbackUsed;

    const authorized =
      lockedResponseAuthorized ||
      Boolean(
        composerFinal
      ) ||
      authoritativeDraftFallbackUsed;

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
        authorized,

      languageComposerDegraded:
        result
          .languageComposerDegraded ===
          true ||
        authoritativeDraftFallbackUsed,

      languageComposerSource:
        result
          .languageComposerSource ||
        result.source ||
        (
          lockedResponseAuthorized
            ? "locked-authoritative-response"
            : composerFinal
              ? "ari-language-composer"
              : authoritativeDraftFallbackUsed
                ? "authoritative-draft-fallback"
                : "composition-failure"
        ),

      languageComposerReason:
        result.reason ||
        result.composerValidation
          ?.reason ||
        (
          authoritativeDraftFallbackUsed
            ? "composer_unavailable_authoritative_draft_preserved"
            : null
        ),

      languageComposerError:
        result.error ||
        null,

      lockedResponseWasComposerAuthorized:
        lockedResponseAuthorized,

      authoritativeDraftFallbackUsed,

      finalResponse
    };
  },

  /* =====================================================
     FINAL RESPONSE NORMALIZATION
  ===================================================== */

  normalizeFinalResponse(
    summary = {}
  ) {
    const composerText =
      this.firstText(
        summary.finalResponse,

        summary.languageComposer
          ?.finalResponse,

        summary.languageComposer
          ?.responseText,

        summary.languageComposer
          ?.reply,

        summary.languageComposer
          ?.languageBody
      );

    const lockedResponse =
      this.readLockedResponse(
        summary
      );

    const authoritativeDraft =
      this.resolveAuthoritativeDraft(
        summary
      );

    const finalText =
      lockedResponse ||
      composerText ||
      authoritativeDraft ||
      "";

    const warnings = [];
    const errors = [];

    if (!finalText) {
      errors.push(
        "final_response_empty"
      );
    }

    if (
      this.containsInvalidValue(
        finalText
      )
    ) {
      errors.push(
        "final_response_contains_invalid_value"
      );
    }

    if (
      this.hasUnbalancedCodeFence(
        finalText
      )
    ) {
      errors.push(
        "final_response_has_unbalanced_code_fence"
      );
    }

    const lockedAuthorized =
      Boolean(
        lockedResponse
      ) &&
      summary.compositionEligibility
        ?.hasLockedFinal ===
        true;

    const composerAuthorized =
      Boolean(
        composerText
      ) &&
      summary
        .languageComposerAuthorized !==
        false;

    const draftFallbackAuthorized =
      !lockedResponse &&
      !composerText &&
      Boolean(
        authoritativeDraft
      );

    const authorized =
      lockedAuthorized ||
      composerAuthorized ||
      draftFallbackAuthorized;

    if (
      finalText &&
      !authorized
    ) {
      errors.push(
        "final_response_not_authorized"
      );
    }

    const usable =
      Boolean(
        finalText
      ) &&
      errors.length ===
        0 &&
      authorized;

    const source =
      lockedAuthorized
        ? "locked_authorized_response"
        : composerText
          ? summary
              .languageComposerSource ||
            "ari-language-composer"
          : draftFallbackAuthorized
            ? "authoritative-draft-fallback"
            : "composition-failure";

    return {
      text:
        usable
          ? finalText
          : "",

      usable,

      authorized,

      degraded:
        summary
          .languageComposerDegraded ===
          true ||
        draftFallbackAuthorized,

      source,

      failureReason:
        usable
          ? null
          : errors[0] ||
            summary.languageComposerReason ||
            summary.compositionEligibility
              ?.reason ||
            "final_composition_failed",

      length:
        usable
          ? finalText.length
          : 0,

      warnings:
        this.uniqueValues(
          warnings
        ),

      validation: {
        valid:
          usable,

        authorized,

        lockedAuthorized,

        composerAuthorized,

        draftFallbackAuthorized,

        composerProducedResponse:
          summary
            .languageComposerProducedResponse ===
            true,

        authoritativeDraftAvailable:
          Boolean(
            authoritativeDraft
          ),

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

  /* =====================================================
     FINAL COMPOSITION HANDOFF
  ===================================================== */

  buildFinalCompositionHandoff(
    summary = {}
  ) {
    const ready =
      summary.finalResponseUsable ===
        true;

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
        this.architecture,

      finalResponse:
        summary.finalResponse ||
        null,

      responseText:
        summary.finalResponse ||
        null,

      reply:
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

      authoritativeDraft: {
        available:
          Boolean(
            summary.authoritativeDraft
          ),

        source:
          summary.authoritativeDraftSource ||
          null,

        fallbackUsed:
          summary
            .authoritativeDraftFallbackUsed ===
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

      responseControl: {
        goal:
          summary.responseGoal ||
          summary.responsePlan
            ?.responseGoal ||
          null,

        shape:
          summary.responseShape ||
          summary.responsePlan
            ?.responseShape ||
          null,

        posture:
          summary.responsePosture ||
          summary.responsePlan
            ?.responsePosture ||
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
        this.architecture,

      eligibility:
        summary.compositionEligibility ||
        null,

      authoritativeDraft: {
        available:
          Boolean(
            summary.authoritativeDraft
          ),

        source:
          summary.authoritativeDraftSource ||
          null,

        fallbackUsed:
          summary
            .authoritativeDraftFallbackUsed ===
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

        responseText:
          summary.finalResponse ||
          null,

        reply:
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

      detached: {
        responseRealizationRequired:
          false,

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

    return this.firstText(
      summary.lockedDeveloperReply,

      summary.developerHandoff
        ?.reply,

      summary.developerHandoff
        ?.finalResponse,

      summary.developerReply,

      summary.developerResponse,

      summary.finalResponse
    );
  },

  /* =====================================================
     CURRENT TURN
  ===================================================== */

  readOriginalCurrentTurn(
    summary = {}
  ) {
    return this.firstText(
      summary.deliberationPacket
        ?.request
        ?.original,

      summary.originalUserMessage,

      summary.userMessage,

      summary.message,

      summary.input
    );
  },

  readResolvedCurrentTurn(
    summary = {}
  ) {
    return this.firstText(
      summary.deliberationPacket
        ?.request
        ?.resolved,

      summary.resolvedUserQuestion,

      summary.resolvedQuestion,

      summary.responsePlan
        ?.resolvedUserQuestion,

      summary.userMessage,

      summary.message,

      summary.input
    );
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

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canReadAuthoritativeDraft:
        true,

      canInvokeLanguageComposer:
        true,

      canPreserveLockedResponse:
        true,

      canUseAuthoritativeDraftFallback:
        true,

      canNormalizeFinalResponseContract:
        true,

      canValidateFinalResponse:
        true,

      canBuildFinalCompositionHandoff:
        true,

      canBuildFinalCompositionStagePacket:
        true,

      canReadCanonicalRealization:
        false,

      canRunResponseRealization:
        false,

      canUseRealizationResponse:
        false,

      canUseCandidateArbitration:
        false,

      canSelectCandidate:
        false,

      canUseSelectedDraft:
        false,

      canUseRawCharacterDraft:
        false,

      canUseRawBlueprintDraft:
        false,

      canResurrectRejectedCandidate:
        false,

      canGenerateNormalResponse:
        false,

      canCreateGenericFailureResponse:
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
        "authoritative_draft_final_composition"
    };
  },

  validate() {
    const errors = [];

    const authority =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canReadCanonicalRealization",
      "canRunResponseRealization",
      "canUseRealizationResponse",
      "canUseCandidateArbitration",
      "canSelectCandidate",
      "canUseSelectedDraft",
      "canUseRawCharacterDraft",
      "canUseRawBlueprintDraft",
      "canResurrectRejectedCandidate",
      "canGenerateNormalResponse",
      "canCreateGenericFailureResponse",
      "canReinterpretMeaning",
      "canChangeRouting",
      "canChangeResponsePlan",
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
        "ari-final-composition-stage-validation",

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

        candidatePipelineDetached:
          true,

        genericFailureResponseDisabled:
          true,

        authoritativeDraftFallbackEnabled:
          true
      },

      authority
    };
  },

  /* =====================================================
     HELPERS
  ===================================================== */

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
        value.authoritativeDraft ||
        value.draftResponse ||
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
  }
};

window.Ari.finalCompositionStage =
  window.AriFinalCompositionStage;

const ariFinalCompositionStageValidation =
  window.AriFinalCompositionStage
    ?.validate?.();

console.log(
  "ARI FINAL COMPOSITION STAGE LOADED:",
  window.AriFinalCompositionStage
    ?.version,

  ariFinalCompositionStageValidation
    ?.ready === true
    ? "READY"
    : "INVALID",

  ariFinalCompositionStageValidation
);
