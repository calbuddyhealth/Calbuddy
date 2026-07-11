// ari/pipeline-stages/expression/ari-final-composition-stage.js
// Ari Final Composition Stage
// Purpose: Turn the selected draft and expression guidance into the final user-facing response.
// V1.0.0 — Language Composer / Final Response Normalization

window.Ari = window.Ari || {};

window.AriFinalCompositionStage = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      preserveMealEstimate =
        state => state
    } = runtime;

    let state = {
      ...summary,
      activeExpressionStage: "final_composition"
    };

    const compositionEligibility =
      this.resolveCompositionEligibility(state);

    state = {
      ...state,

      compositionEligibility,

      shouldRunLanguageComposer:
        compositionEligibility.runComposer
    };

    // =================================================
    // 1. Final Language Composer
    // =================================================

    mark("before AriLanguageComposer");

    let composerResult = {};

    if (compositionEligibility.runComposer) {
      const composerEngine =
        window.AriLanguageComposerV9 ||
        window.AriLanguageComposer;

      composerResult =
        composerEngine?.compose
          ? await composerEngine.compose({
              composerPacket:
                this.buildFinalComposerPacket(state),

              summary:
                state
            })
          : {
              languageComposerRan:
                false,

              source:
                "not-loaded",

              reason:
                "language_composer_not_loaded"
            };
    } else {
      composerResult = {
        languageComposerRan:
          false,

        source:
          "skipped-by-expression-eligibility",

        reason:
          compositionEligibility.reason
      };
    }

    const composerFinal =
      composerResult.finalResponse ||
      composerResult.languageBody ||
      composerResult.languageComposerOutput ||
      null;

    const fallbackFinal =
      this.resolveFallbackFinalResponse(state);

    state = {
      ...state,

      ...composerResult,

      languageComposer:
        composerResult,

      languageComposerRan:
        composerResult
          .languageComposerRan === true ||
        Boolean(composerFinal),

      languageComposerSource:
        composerResult.source ||
        (
          composerFinal
            ? "ari-language-composer"
            : "fallback"
        ),

      finalResponse:
        composerFinal ||
        fallbackFinal ||
        "I’m here, but Ari could not compose a final response."
    };

    mark("after AriLanguageComposer");

    // =================================================
    // 2. Preserve structured result data
    // =================================================

    state =
      preserveMealEstimate(state);

    // =================================================
    // 3. Final response normalization
    // =================================================

    const normalizedResponse =
      this.normalizeFinalResponse(state);

    state = {
      ...state,

      finalResponse:
        normalizedResponse.text,

      finalResponseSource:
        normalizedResponse.source,

      finalResponseUsable:
        normalizedResponse.usable,

      finalResponseLength:
        normalizedResponse.length,

      finalResponseWarnings:
        normalizedResponse.warnings
    };

    // =================================================
    // 4. Final Composition Handoff
    // =================================================

    state.finalCompositionHandoff =
      this.buildFinalCompositionHandoff(state);

    // =================================================
    // 5. Stage Packet
    // =================================================

    state.finalCompositionStagePacket =
      this.buildFinalCompositionStagePacket(
        state
      );

    state.finalCompositionStageRan =
      true;

    state.finalCompositionStageSource =
      "ari-final-composition-stage";

    state.finalCompositionStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveCompositionEligibility(
    summary = {}
  ) {
    const developerLocked =
      summary.developerResponseLocked === true;

    const responseLocked =
      summary.responseLocked === true;

    const hasLockedFinal =
      Boolean(
        String(
          summary.finalResponse ||
          ""
        ).trim()
      ) &&
      (
        developerLocked ||
        responseLocked
      );

    return {
      runComposer:
        !hasLockedFinal,

      developerLocked,
      responseLocked,
      hasLockedFinal,

      source:
        "ari-final-composition-stage-eligibility",

      reason:
        hasLockedFinal
          ? "locked_final_response_already_available"
          : "final_composition_required"
    };
  },

  // ===================================================
  // Final composer packet
  // ===================================================

  buildFinalComposerPacket(summary = {}) {
    return {
      ...(summary.composerPacket || {}),

      selectedDraft:
        summary.selectedDraft ||
        null,

      selectedDraftSource:
        summary.selectedDraftSource ||
        null,

      blueprintWriterDraft:
        summary.blueprintWriterDraft ||
        null,

      blueprintWriter:
        summary.blueprintWriter ||
        null,

      aiWriterDraft:
        summary.aiWriterDraft ||
        null,

      aiWriter:
        summary.aiWriter ||
        null,

      candidateDrafts:
        summary.candidateDrafts ||
        [],

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
        summary.languageGuidanceHandoff ||
        null,

      arbitration:
        summary.arbitrationHandoff ||
        null,

      responseControl: {
        goal:
          summary.responseGoal ||
          null,

        shape:
          summary.responseShape ||
          null,

        order:
          summary.responseOrder ||
          [],

        rules:
          summary.responseRules ||
          [],

        constraints:
          summary.responseConstraints ||
          [],

        requiredBehaviors:
          summary.responseRequired ||
          [],

        forbiddenBehaviors:
          summary.responseAvoid ||
          [],

        communicationPlan:
          summary.communicationPlan ||
          null,

        composerDirective:
          summary.composerDirective ||
          null
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
            .safetyShouldStopNormalResponse === true,

        requiredPlanner:
          summary.safetyRequiredPlanner ||
          null,

        communicationStyle:
          summary.safetyCommunicationStyle ||
          null
      },

      developer: {
        responseLocked:
          summary.developerResponseLocked === true,

        packet:
          summary.composerDeveloperPacket ||
          null,

        handoff:
          summary.developerHandoff ||
          summary.unlockedDeveloperHandoff ||
          null
      }
    };
  },

  // ===================================================
  // Fallback response
  // ===================================================

  resolveFallbackFinalResponse(
    summary = {}
  ) {
    const existingFinal =
      String(
        summary.finalResponse ||
        ""
      ).trim();

    if (existingFinal) {
      return existingFinal;
    }

    const selected =
      String(
        summary.selectedDraft ||
        ""
      ).trim();

    if (selected) {
      return selected;
    }

    const aiDraft =
      String(
        summary.aiWriterDraft ||
        ""
      ).trim();

    if (aiDraft) {
      return aiDraft;
    }

    const characterDraft =
      String(
        summary.characterDraftCandidate ||
        summary.composerCharacter?.draft ||
        ""
      ).trim();

    if (characterDraft) {
      return characterDraft;
    }

    const blueprintDraft =
      String(
        summary.blueprintWriterDraft ||
        ""
      ).trim();

    if (blueprintDraft) {
      return blueprintDraft;
    }

    return null;
  },

  // ===================================================
  // Final normalization
  // ===================================================

  normalizeFinalResponse(
    summary = {}
  ) {
    const text =
      String(
        summary.finalResponse ||
        ""
      ).trim();

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
      /\b(undefined|null|\[object object\])\b/i.test(
        text
      )
    ) {
      warnings.push(
        "final_response_contains_invalid_value"
      );
    }

    if (
      /\b(answer the direct question|the user is asking|blueprint writer)\b/i.test(
        text
      )
    ) {
      warnings.push(
        "final_response_contains_internal_meta_language"
      );
    }

    const source =
      summary.languageComposerRan === true
        ? "language_composer"
        : summary.selectedDraft
          ? summary.selectedDraftSource ||
            "selected_draft"
          : summary.aiWriterDraft
            ? "ai_writer"
            : summary.characterDraftCandidate
              ? "character_reasoning"
              : summary.blueprintWriterDraft
                ? "blueprint_writer"
                : summary.finalResponse
                  ? "preexisting_final_response"
                  : "fallback";

    return {
      text:
        text ||
        "I’m here, but Ari could not compose a final response.",

      usable:
        Boolean(text) &&
        !warnings.includes(
          "final_response_contains_invalid_value"
        ),

      source,

      length:
        text.length,

      warnings
    };
  },

  // ===================================================
  // Final composition handoff
  // ===================================================

  buildFinalCompositionHandoff(
    summary = {}
  ) {
    return {
      ready:
        summary.finalResponseUsable === true,

      finalResponse:
        summary.finalResponse ||
        null,

      source:
        summary.finalResponseSource ||
        null,

      length:
        summary.finalResponseLength ||
        0,

      warnings:
        summary.finalResponseWarnings ||
        [],

      composer: {
        ran:
          summary.languageComposerRan === true,

        source:
          summary.languageComposerSource ||
          null,

        value:
          summary.languageComposer ||
          null
      },

      selectedDraft: {
        text:
          summary.selectedDraft ||
          null,

        source:
          summary.selectedDraftSource ||
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

      authority: {
        canComposeFinalLanguage:
          true,

        canNormalizeFinalResponse:
          true,

        canChangeRouting:
          false,

        canOverrideSafety:
          false,

        canPersistState:
          false,

        role:
          "final_language_composition_and_normalization"
      }
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildFinalCompositionStagePacket(
    summary = {}
  ) {
    return {
      ready:
        true,

      source:
        "ari-final-composition-stage",

      version:
        this.version,

      eligibility:
        summary.compositionEligibility ||
        null,

      composer: {
        ran:
          summary.languageComposerRan === true,

        source:
          summary.languageComposerSource ||
          null,

        value:
          summary.languageComposer ||
          null
      },

      result: {
        finalResponse:
          summary.finalResponse ||
          null,

        usable:
          summary.finalResponseUsable === true,

        source:
          summary.finalResponseSource ||
          null,

        length:
          summary.finalResponseLength ||
          0,

        warnings:
          summary.finalResponseWarnings ||
          []
      },

      handoff:
        summary.finalCompositionHandoff ||
        null,

      authority: {
        canComposeFinalResponse:
          true,

        canNormalizeFinalResponse:
          true,

        canChooseFinalRoute:
          false,

        canChangeSafetyDisposition:
          false,

        canExecuteActions:
          false,

        canPersistState:
          false,

        role:
          "final_response_composition"
      }
    };
  }
};

console.log(
  "ARI FINAL COMPOSITION STAGE LOADED:",
  window.AriFinalCompositionStage?.version
);
