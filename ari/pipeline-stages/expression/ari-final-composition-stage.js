// ari/pipeline-stages/expression/ari-final-composition-stage.js
// Ari Final Composition Stage
//
// Purpose:
// Render and normalize the final user-facing response from an authorized
// locked response or the candidate selected by the Response Candidate Arbiter.
//
// V2.0.0 — Arbiter-Only Selection / Thin Composition / No Draft Resurrection
//
// Architectural flow:
//
// Response Candidate Arbiter
//      ↓
// Ari Language Composer V9
//      ↓
// Final Composition Stage
//      ↓
// Delivery Pipeline
//
// Responsibilities:
// - Determine whether final composition is eligible to run.
// - Preserve explicitly locked developer or response authority.
// - Pass the canonical Arbiter selection to Language Composer V9.
// - Preserve the Language Composer result.
// - Normalize and validate the final response contract.
// - Produce the final-composition handoff and stage packet.
//
// Non-responsibilities:
// - Does not select between response candidates.
// - Does not use raw Blueprint, Character, or AI drafts as fallbacks.
// - Does not resurrect candidates rejected by the Arbiter.
// - Does not independently generate a normal response.
// - Does not preserve meal estimates or application-specific state.
// - Does not modify routing, meaning, response planning, or safety.
// - Does not persist state.

window.Ari = window.Ari || {};

window.AriFinalCompositionStage = {
  version: "2.0.0",
  source: "ari-final-composition-stage",
  schemaVersion: "2.0.0",

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

    const compositionEligibility =
      this.resolveCompositionEligibility(
        state
      );

    state = {
      ...state,

      compositionEligibility,

      shouldRunLanguageComposer:
        compositionEligibility
          .runComposer
    };

    /* =================================================
       1. FINAL LANGUAGE COMPOSER
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

    state =
      this.applyLanguageComposerResult({
        state,
        composerResult,
        eligibility:
          compositionEligibility
      });

    mark(
      "after AriLanguageComposer"
    );

    /* =================================================
       2. FINAL RESPONSE NORMALIZATION
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

      finalResponseDegraded:
        normalizedResponse.degraded,

      finalResponseFailureReason:
        normalizedResponse.failureReason,

      finalResponseLength:
        normalizedResponse.length,

      finalResponseWarnings:
        normalizedResponse.warnings
    };

    /* =================================================
       3. FINAL COMPOSITION HANDOFF
    ================================================= */

    state.finalCompositionHandoff =
      this.buildFinalCompositionHandoff(
        state
      );

    /* =================================================
       4. STAGE PACKET
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

    const existingFinal =
      this.extractText(
        summary.finalResponse
      );

    const hasLockedFinal =
      Boolean(
        existingFinal
      ) &&
      (
        developerLocked ||
        responseLocked
      );

    const arbitration =
      this.readCanonicalArbitration(
        summary
      );

    const selectedDraft =
      this.extractText(
        arbitration.selectedDraft ||
        arbitration
          .selectedCandidate
          ?.text
      );

    const selectionReady =
      arbitration.selectionReady ===
        true &&
      Boolean(
        selectedDraft
      );

    return {
      runComposer:
        !hasLockedFinal &&
        selectionReady,

      preserveLockedFinal:
        hasLockedFinal,

      developerLocked,

      responseLocked,

      hasLockedFinal,

      arbitrationAvailable:
        arbitration.available,

      selectionReady,

      selectedDraftAvailable:
        Boolean(
          selectedDraft
        ),

      source:
        "ari-final-composition-stage-eligibility",

      reason:
        hasLockedFinal
          ? "locked_final_response_already_available"
          : selectionReady
            ? "arbiter_selected_draft_ready"
            : arbitration.available
              ? "arbiter_selection_not_ready"
              : "candidate_arbitration_missing"
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
        this.extractText(
          state.finalResponse
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

        languageComposerDegraded:
          false,

        languageComposerSource:
          "locked-final-response",

        source:
          "locked-final-response",

        reason:
          "locked_final_response_preserved",

        finalResponse:
          lockedFinal,

        languageBody:
          lockedFinal
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
          "skipped-by-expression-eligibility",

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

    const arbitration =
      this.readCanonicalArbitration(
        state
      );

    try {
      const result =
        await composerEngine.compose({
          composerPacket:
            this.buildFinalComposerPacket(
              state
            ),

          responseCandidateArbitration:
            arbitration.raw,

          arbitration:
            arbitration.raw,

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
    invoked = false,
    error = null
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

      error:
        error?.message ||
        (
          error
            ? String(error)
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
        result.languageComposerOutput
      );

    const lockedFinal =
      eligibility
        .preserveLockedFinal ===
        true
        ? this.extractText(
            state.finalResponse
          )
        : "";

    const finalResponse =
      lockedFinal ||
      composerFinal ||
      "";

    const composerRan =
      result.languageComposerRan ===
      true;

    const composerInvoked =
      result.languageComposerInvoked ===
        true ||
      (
        eligibility.runComposer ===
          true &&
        eligibility
          .preserveLockedFinal !==
          true
      );

    const producedResponse =
      Boolean(
        composerFinal
      ) ||
      result
        .languageComposerProducedResponse ===
        true;

    return {
      ...state,

      ...result,

      languageComposer:
        result,

      languageComposerRan:
        composerRan,

      languageComposerInvoked:
        composerInvoked,

      languageComposerProducedResponse:
        producedResponse,

      languageComposerSource:
        result.languageComposerSource ||
        result.source ||
        (
          eligibility
            .preserveLockedFinal ===
            true
            ? "locked-final-response"
            : composerRan
              ? "ari-language-composer-v9"
              : "composition-failure"
        ),

      languageComposerReason:
        result.reason ||
        result.composerValidation ||
        null,

      finalResponse
    };
  },

  /* =====================================================
     CANONICAL ARBITRATION
  ===================================================== */

  readCanonicalArbitration(
    summary = {}
  ) {
    const raw =
      summary
        .responseCandidateArbitration ||
      summary
        .responseCandidateArbiter ||
      summary
        .responseCandidateArbiterResult ||
      summary.arbitrationHandoff ||
      null;

    if (
      !raw ||
      typeof raw !==
        "object"
    ) {
      return {
        available:
          false,

        selectionReady:
          false,

        selectedCandidate:
          null,

        selectedDraft:
          "",

        selectedSource:
          null,

        reason:
          "candidate_arbitration_missing",

        raw:
          null
      };
    }

    const selectedCandidate =
      raw.selectedCandidate &&
      typeof raw.selectedCandidate ===
        "object"
        ? raw.selectedCandidate
        : null;

    const selectedDraft =
      this.extractText(
        selectedCandidate?.text ||
        raw.selectedDraft ||
        raw.finalResponseCandidate
      );

    const selectionReady =
      raw.selectionReady ===
        true &&
      Boolean(
        selectedDraft
      );

    return {
      available:
        true,

      selectionReady,

      selectedCandidate,

      selectedDraft,

      selectedSource:
        selectedCandidate?.source ||
        raw.selectedSource ||
        raw.selectedDraftSource ||
        null,

      reason:
        raw.selectedDraftReason ||
        raw.reason ||
        (
          selectionReady
            ? "arbiter_selected_candidate"
            : "arbiter_selection_not_ready"
        ),

      raw
    };
  },

  /* =====================================================
     FINAL COMPOSER PACKET
  ===================================================== */

  buildFinalComposerPacket(
    summary = {}
  ) {
    const arbitration =
      this.readCanonicalArbitration(
        summary
      );

    return {
      ...(
        summary.composerPacket ||
        {}
      ),

      selectedCandidate:
        arbitration
          .selectedCandidate ||
        null,

      selectedDraft:
        arbitration.selectionReady
          ? arbitration.selectedDraft
          : null,

      selectedDraftSource:
        arbitration.selectionReady
          ? arbitration.selectedSource
          : null,

      selectionReady:
        arbitration.selectionReady,

      responseCandidateArbitration:
        arbitration.raw,

      /*
       * Temporary aliases retained only for compatibility
       * with older composer consumers.
       */
      responseCandidateArbiter:
        arbitration.raw,

      arbitration:
        arbitration.raw,

      responseStrategy:
        summary.responseStrategy ||
        null,

      deliberationPacket:
        summary.deliberationPacket ||
        null,

      character:
        summary.composerCharacter ||
        summary.characterHandoff ||
        null,

      languageGuidance:
        summary
          .languageGuidanceHandoff ||
        null,

      responseControl: {
        goal:
          summary.responseGoal ||
          null,

        shape:
          summary.responseShape ||
          null,

        order:
          this.toArray(
            summary.responseOrder
          ),

        rules:
          this.toArray(
            summary.responseRules
          ),

        constraints:
          this.toArray(
            summary.responseConstraints
          ),

        requiredBehaviors:
          this.toArray(
            summary.responseRequired
          ),

        forbiddenBehaviors:
          this.toArray(
            summary.responseAvoid
          ),

        communicationPlan:
          summary.communicationPlan ||
          null,

        composerDirective:
          summary.composerDirective ||
          null
      },

      safety: {
        ...(
          summary.composerPacket
            ?.safety ||
          {}
        ),

        earlyGate:
          summary.safetyContextGate ||
          summary.composerPacket
            ?.safety
            ?.earlyGate ||
          null,

        gate:
          summary.safetyContextGate ||
          summary.composerPacket
            ?.safety
            ?.gate ||
          null,

        deepReview:
          summary.deepSafetyResult ||
          summary.composerPacket
            ?.safety
            ?.deepReview ||
          null,

        disposition:
          summary.safetyDisposition ||
          summary.composerPacket
            ?.safety
            ?.disposition ||
          null,

        shouldStopNormalResponse:
          summary
            .safetyShouldStopNormalResponse ===
            true ||
          summary
            .safetyDisposition
            ?.shouldStopNormalResponse ===
            true ||
          summary.composerPacket
            ?.safety
            ?.shouldStopNormalResponse ===
            true,

        requiredPlanner:
          summary.safetyRequiredPlanner ||
          null,

        communicationStyle:
          summary
            .safetyCommunicationStyle ||
          null
      },

      developerPacketLocked:
        summary
          .developerResponseLocked ===
          true ||
        summary.responseLocked ===
          true,

      developerRelevant:
        summary
          .composerDeveloperPacket
          ?.enabled ===
          true ||
        summary
          .developerResponseLocked ===
          true,

      lockedDeveloperReply:
        this.readLockedResponse(
          summary
        ),

      developer: {
        ...(
          summary.composerPacket
            ?.developer ||
          {}
        ),

        responseLocked:
          summary
            .developerResponseLocked ===
          true,

        locked:
          summary
            .developerResponseLocked ===
            true ||
          summary.responseLocked ===
            true,

        packet:
          summary
            .composerDeveloperPacket ||
          null,

        handoff:
          summary.developerHandoff ||
          summary
            .unlockedDeveloperHandoff ||
          null,

        lockedReply:
          this.readLockedResponse(
            summary
          )
      }
    };
  },

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
      summary.finalResponse ||
      summary.developerHandoff
        ?.reply ||
      summary.developerHandoff
        ?.finalResponse ||
      summary.developerReply ||
      summary.developerResponse
    );
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

    const warnings = [];

    if (!text) {
      warnings.push(
        "final_response_empty"
      );
    }

    if (
      text.length > 0 &&
      text.length < 3
    ) {
      warnings.push(
        "final_response_too_short"
      );
    }

    if (
      this.containsInvalidValue(
        text
      )
    ) {
      warnings.push(
        "final_response_contains_invalid_value"
      );
    }

    if (
      this.containsInternalMetaLanguage(
        text
      )
    ) {
      warnings.push(
        "final_response_contains_internal_meta_language"
      );
    }

    if (
      this.containsWriterFailureMessage(
        text
      )
    ) {
      warnings.push(
        "final_response_contains_writer_failure_message"
      );
    }

    const composer =
      summary.languageComposer ||
      {};

    const selectedCandidateAuthorized =
      composer
        .selectedCandidateWasArbiterAuthorized ===
        true;

    const lockedAuthorized =
      summary.compositionEligibility
        ?.hasLockedFinal ===
        true;

    const composerProducedResponse =
      summary
        .languageComposerProducedResponse ===
        true ||
      Boolean(
        this.extractText(
          composer.finalResponse ||
          composer.languageBody
        )
      );

    const composerFailureReason =
      summary.languageComposerReason ||
      composer.composerValidation ||
      composer.reason ||
      summary.compositionEligibility
        ?.reason ||
      null;

    const composerReturnedHonestFallback =
      this.isKnownHonestFallback(
        text
      ) &&
      selectedCandidateAuthorized !==
        true &&
      lockedAuthorized !==
        true;

    const fatalWarnings = [
      "final_response_empty",
      "final_response_too_short",
      "final_response_contains_invalid_value",
      "final_response_contains_internal_meta_language",
      "final_response_contains_writer_failure_message"
    ];

    const hasFatalWarning =
      warnings.some(
        warning =>
          fatalWarnings.includes(
            warning
          )
      );

    const authorized =
      lockedAuthorized ||
      selectedCandidateAuthorized;

    const usable =
      Boolean(
        text
      ) &&
      !hasFatalWarning &&
      authorized &&
      !composerReturnedHonestFallback;

    const degraded =
      !usable;

    const source =
      lockedAuthorized
        ? "locked_authorized_response"
        : selectedCandidateAuthorized
          ? summary
              .languageComposerSource ||
            "ari-language-composer-v9"
          : composerReturnedHonestFallback
            ? "honest_failure_fallback"
            : composerProducedResponse
              ? summary
                  .languageComposerSource ||
                "unauthorized_composer_output"
              : "composition_failure";

    return {
      text:
        text ||
        this.honestFailureFallback(),

      usable,

      degraded,

      authorized,

      source,

      failureReason:
        usable
          ? null
          : composerReturnedHonestFallback
            ? composerFailureReason ||
              "language_composer_returned_honest_failure_fallback"
            : hasFatalWarning
              ? warnings[0]
              : authorized
                ? "authorized_response_not_usable"
                : composerFailureReason ||
                  "no_authorized_final_response",

      length:
        (
          text ||
          this.honestFailureFallback()
        ).length,

      warnings
    };
  },

  containsInvalidValue(
    text = ""
  ) {
    return /\b(undefined|null|\[object object\])\b/i
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
      "response move",
      "response strategy",
      "response shape",
      "internal planner",
      "pipeline diagnostics"
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
      "try once more and ill answer",
      "try once more and i ll answer",
      "i wont use stale developer evidence",
      "i won t use stale developer evidence"
    ];

    return phrases.some(
      phrase =>
        normalized.includes(
          phrase
        )
    );
  },

  isKnownHonestFallback(
    text = ""
  ) {
    const normalized =
      this.normalizeText(
        text
      );

    return normalized ===
      this.normalizeText(
        "I know what you’re asking, but I don’t have a reliable answer ready. I’d rather be honest than make something up."
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

    return {
      schema:
        "ari_final_composition_handoff",

      schemaVersion:
        this.schemaVersion,

      ready,

      completed:
        true,

      source:
        this.source,

      version:
        this.version,

      finalResponse:
        summary.finalResponse ||
        null,

      finalResponseUsable:
        ready,

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

        source:
          summary.languageComposerSource ||
          null,

        reason:
          summary.languageComposerReason ||
          null,

        value:
          summary.languageComposer ||
          null
      },

      arbitration: {
        available:
          Boolean(
            summary
              .responseCandidateArbitration
          ),

        selectionReady:
          summary.selectionReady ===
          true,

        selectedCandidate:
          summary.selectedCandidate ||
          null,

        selectedDraft:
          summary.selectedDraft ||
          null,

        selectedSource:
          summary.selectedDraftSource ||
          null,

        value:
          summary
            .responseCandidateArbitration ||
          null
      },

      responseControl: {
        shape:
          summary.responseShape ||
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

      completed:
        true,

      source:
        this.source,

      version:
        this.version,

      eligibility:
        summary.compositionEligibility ||
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

        source:
          summary.languageComposerSource ||
          null,

        reason:
          summary.languageComposerReason ||
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
          )
      },

      handoff:
        summary.finalCompositionHandoff ||
        null,

      authority:
        this.getAuthorityBoundaries()
    };
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canInvokeLanguageComposer:
        true,

      canPreserveLockedResponse:
        true,

      canPreserveArbiterSelectedDraft:
        true,

      canNormalizeFinalResponseContract:
        true,

      canBuildFinalCompositionHandoff:
        true,

      canIndependentlySelectCandidate:
        false,

      canUseRawAIDraftAsFallback:
        false,

      canUseRawCharacterDraftAsFallback:
        false,

      canUseRawBlueprintDraftAsFallback:
        false,

      canResurrectRejectedCandidate:
        false,

      canGenerateNormalResponse:
        false,

      canChangeRouting:
        false,

      canChangeResponsePlan:
        false,

      canOverrideSafety:
        false,

      canPersistState:
        false,

      role:
        "authorized_selected_candidate_final_composition"
    };
  },

  /* =====================================================
     HELPERS
  ===================================================== */

  extractText(
    value = null
  ) {
    if (
      value === null ||
      value === undefined
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
          item !== null &&
          item !== undefined &&
          item !== ""
      );
    }

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return [];
    }

    return [
      value
    ];
  }
};

console.log(
  "ARI FINAL COMPOSITION STAGE LOADED:",
  window.AriFinalCompositionStage
    ?.version
);