// ari/pipeline-stages/expression/ari-draft-arbitration-stage.js
// Ari Draft Arbitration Stage
//
// Purpose:
// Coordinate candidate precheck, optional AI realization,
// final candidate arbitration, and arbitration handoff.
//
// V2.0.0 — Arbiter Authority / No Candidate Resurrection / Canonical AI Activation
//
// Architectural flow:
//
// Draft Generation Stage
//      ↓
// Response Candidate Arbiter Precheck
//      ↓
// Optional AI Writer
//      ↓
// Response Candidate Arbiter Final Selection
//      ↓
// Final Composition Stage
//
// Responsibilities:
// - Determine whether arbitration is eligible to run.
// - Run the Response Candidate Arbiter precheck.
// - Preserve upstream AI Writer requirements.
// - Run the AI Writer only when repair or realization is required.
// - Run final candidate arbitration.
// - Preserve the Arbiter-selected candidate and draft.
// - Produce a normalized arbitration handoff and stage packet.
//
// Non-responsibilities:
// - Does not independently register Character candidates.
// - Does not independently register Blueprint candidates.
// - Does not independently register AI candidates.
// - Does not bypass required Character AI realization.
// - Does not independently score or compare candidates.
// - Does not resurrect candidates rejected by the Arbiter.
// - Does not compose the final response.
// - Does not change the canonical Response Plan.
// - Does not override safety.
// - Does not persist state.

window.Ari = window.Ari || {};

window.AriDraftArbitrationStage = {
  version: "2.0.0",
  source: "ari-draft-arbitration-stage",
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
        "draft_arbitration"
    };

    const arbitrationEligibility =
      this.resolveArbitrationEligibility(
        state
      );

    state = {
      ...state,

      arbitrationEligibility,

      shouldRunArbiterPrecheck:
        arbitrationEligibility
          .runPrecheck,

      shouldAllowAIWriter:
        arbitrationEligibility
          .allowAIWriter,

      shouldRunCandidateArbiter:
        arbitrationEligibility
          .runCandidateArbiter
    };

    /* =================================================
       1. RESPONSE CANDIDATE ARBITER PRECHECK
    ================================================= */

    mark(
      "before arbiterPrecheck"
    );

    const arbiterPrecheck =
      await this.runArbiterPrecheck({
        state,
        eligibility:
          arbitrationEligibility
      });

    const upstreamAIRequirement =
      this.readUpstreamAIRequirement(
        state
      );

    const precheckNeedsAIWriter =
      arbiterPrecheck
        .arbiterPrecheckRan ===
        true &&
      arbiterPrecheck
        .needsAIWriter ===
        true;

    /*
     * Upstream Character realization or Draft Generation
     * requirements remain authoritative. The Arbiter may
     * escalate the requirement, but an unavailable precheck
     * may not erase an existing requirement.
     */
    const needsAIWriter =
      arbitrationEligibility
        .allowAIWriter ===
        true &&
      (
        upstreamAIRequirement
          .required ===
          true ||
        precheckNeedsAIWriter
      );

    const aiRepairReason =
      arbiterPrecheck
        .aiRepairReason ||
      upstreamAIRequirement
        .reason ||
      null;

    state = {
      ...state,

      arbiterPrecheck,

      arbiterPrecheckRan:
        arbiterPrecheck
          .arbiterPrecheckRan ===
        true,

      arbiterPrecheckSource:
        arbiterPrecheck.source ||
        (
          arbiterPrecheck
            .arbiterPrecheckRan ===
            true
            ? "ari-response-candidate-arbiter"
            : "unknown"
        ),

      upstreamAIRequirement,

      precheckNeedsAIWriter,

      needsAIWriter,

      aiRepairReason
    };

    mark(
      "after arbiterPrecheck"
    );

    /* =================================================
       2. AI WRITER
    ================================================= */

    const shouldRunAIWriter =
      arbitrationEligibility
        .allowAIWriter ===
        true &&
      needsAIWriter ===
        true;

    state = {
      ...state,

      shouldRunAIWriter
    };

    mark(
      "before aiWriter"
    );

    const aiWriterResult =
      await this.runAIWriter({
        state,
        shouldRunAIWriter
      });

    state =
      this.applyAIWriterResult({
        state,
        aiWriterResult,
        shouldRunAIWriter
      });

    mark(
      "after aiWriter"
    );

    /* =================================================
       3. FINAL RESPONSE CANDIDATE ARBITRATION
    ================================================= */

    mark(
      "before responseCandidateArbiter"
    );

    const finalArbitration =
      await this.runFinalArbitration({
        state,
        eligibility:
          arbitrationEligibility
      });

    state =
      this.applyFinalArbitration({
        state,
        arbitration:
          finalArbitration
      });

    mark(
      "after responseCandidateArbiter"
    );

    /* =================================================
       4. ARBITRATION HANDOFF
    ================================================= */

    state.arbitrationHandoff =
      this.buildArbitrationHandoff(
        state
      );

    /* =================================================
       5. STAGE PACKET
    ================================================= */

    state.draftArbitrationStagePacket =
      this.buildDraftArbitrationStagePacket(
        state
      );

    state.draftArbitrationStageRan =
      true;

    state.draftArbitrationStageSource =
      this.source;

    state.draftArbitrationStageVersion =
      this.version;

    return state;
  },

  /* =====================================================
     ELIGIBILITY
  ===================================================== */

  resolveArbitrationEligibility(
    summary = {}
  ) {
    const developerLocked =
      summary
        .developerResponseLocked ===
      true;

    const responseLocked =
      summary.responseLocked ===
      true;

    const lockedFinalResponse =
      this.extractText(
        summary.finalResponse
      );

    const hasLockedFinal =
      Boolean(
        lockedFinalResponse
      ) &&
      (
        developerLocked ||
        responseLocked
      );

    const hasPreexistingFinal =
      Boolean(
        lockedFinalResponse
      );

    return {
      runPrecheck:
        !developerLocked &&
        !responseLocked &&
        !hasPreexistingFinal,

      allowAIWriter:
        !developerLocked &&
        !responseLocked &&
        !hasPreexistingFinal,

      runCandidateArbiter:
        !developerLocked &&
        !responseLocked &&
        !hasPreexistingFinal,

      developerLocked,

      responseLocked,

      hasLockedFinal,

      hasPreexistingFinal,

      source:
        "ari-draft-arbitration-stage-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : responseLocked
            ? "response_locked"
            : hasPreexistingFinal
              ? "final_response_already_available"
              : "draft_arbitration_required"
    };
  },

  /* =====================================================
     ARBITER PRECHECK
  ===================================================== */

  async runArbiterPrecheck({
    state = {},
    eligibility = {}
  } = {}) {
    if (
      eligibility.runPrecheck !==
      true
    ) {
      return {
        schema:
          "ari_response_candidate_precheck_skip",

        schemaVersion:
          this.schemaVersion,

        arbiterPrecheckRan:
          false,

        needsAIWriter:
          false,

        aiRepairReason:
          null,

        source:
          "skipped-by-expression-eligibility",

        reason:
          eligibility.reason ||
          "arbiter_precheck_not_required"
      };
    }

    const arbiter =
      window
        .AriResponseCandidateArbiter;

    if (
      !arbiter ||
      typeof arbiter.precheck !==
        "function"
    ) {
      const upstream =
        this.readUpstreamAIRequirement(
          state
        );

      return {
        schema:
          "ari_response_candidate_precheck_unavailable",

        schemaVersion:
          this.schemaVersion,

        arbiterPrecheckRan:
          false,

        needsAIWriter:
          upstream.required ===
          true,

        aiRepairReason:
          upstream.reason ||
          (
            upstream.required
              ? "arbiter_precheck_unavailable_upstream_ai_requirement_preserved"
              : null
          ),

        source:
          "not-loaded",

        reason:
          "response_candidate_arbiter_precheck_not_loaded"
      };
    }

    try {
      /*
       * candidateDrafts already exists in state.
       * Do not pass the same collection separately and
       * cause duplicate ingestion inside the Arbiter.
       */
      const result =
        await arbiter.precheck({
          summary:
            state,

          composerPacket:
            state.composerPacket ||
            null
        });

      if (
        !result ||
        typeof result !==
          "object"
      ) {
        const upstream =
          this.readUpstreamAIRequirement(
            state
          );

        return {
          schema:
            "ari_response_candidate_precheck_invalid",

          schemaVersion:
            this.schemaVersion,

          arbiterPrecheckRan:
            false,

          needsAIWriter:
            upstream.required ===
            true,

          aiRepairReason:
            upstream.reason ||
            null,

          source:
            "invalid-result",

          reason:
            "response_candidate_arbiter_precheck_returned_invalid_result"
        };
      }

      return result;
    } catch (error) {
      console.error(
        "Ari candidate Arbiter precheck failed:",
        error
      );

      const upstream =
        this.readUpstreamAIRequirement(
          state
        );

      return {
        schema:
          "ari_response_candidate_precheck_error",

        schemaVersion:
          this.schemaVersion,

        arbiterPrecheckRan:
          false,

        needsAIWriter:
          upstream.required ===
          true,

        aiRepairReason:
          upstream.reason ||
          null,

        source:
          "precheck-error",

        reason:
          "response_candidate_arbiter_precheck_failed",

        error:
          error?.message ||
          String(error)
      };
    }
  },

  /* =====================================================
     UPSTREAM AI REQUIREMENT
  ===================================================== */

  readUpstreamAIRequirement(
    summary = {}
  ) {
    const preparation =
      summary.aiWriterPreparation ||
      {};

    const characterCandidate =
      summary.characterCandidate ||
      {};

    const characterRequiresAI =
      summary.characterNeedsAIWriter ===
        true ||
      characterCandidate
        .needsAIWriter ===
        true ||
      summary.composerPacket
        ?.characterNeedsAIWriter ===
        true ||
      summary.composerPacket
        ?.characterRealization
        ?.needsAIWriter ===
        true;

    const preparationRequiresAI =
      preparation.required ===
        true ||
      summary.shouldRunAIWriter ===
        true ||
      summary.needsAIWriter ===
        true;

    const required =
      characterRequiresAI ||
      preparationRequiresAI;

    return {
      required,

      allowed:
        preparation.allowed !==
        false,

      mode:
        preparation.mode ||
        summary.aiWriterMode ||
        summary.characterAIWriterMode ||
        null,

      instruction:
        preparation.instruction ||
        summary.aiWriterInstruction ||
        summary.characterAIInstruction ||
        "",

      reason:
        preparation.reason ||
        (
          characterRequiresAI
            ? "character_authority_requested_ai_realization"
            : required
              ? "draft_generation_requested_ai_writer"
              : null
        ),

      characterRequiresAI,

      preparationRequiresAI,

      source:
        "ari-draft-arbitration-upstream-ai-requirement"
    };
  },

  /* =====================================================
     AI WRITER
  ===================================================== */

  async runAIWriter({
    state = {},
    shouldRunAIWriter = false
  } = {}) {
    if (!shouldRunAIWriter) {
      return {
        aiWriterRan:
          false,

        aiWriterInvoked:
          false,

        aiWriterUsedAI:
          false,

        aiWriterSource:
          "skipped-by-arbitration",

        aiWriterReason:
          "ai_writer_not_required",

        aiWriterFallbackReason:
          null,

        draft:
          null,

        aiWriterDraft:
          null,

        candidate:
          null
      };
    }

    const writer =
      window.AriAIWriter;

    if (
      !writer ||
      typeof writer.write !==
        "function"
    ) {
      return {
        aiWriterRan:
          false,

        aiWriterInvoked:
          false,

        aiWriterUsedAI:
          false,

        aiWriterSource:
          "not-loaded",

        aiWriterReason:
          "ai_writer_not_loaded",

        aiWriterFallbackReason:
          "ai_writer_not_loaded",

        draft:
          null,

        aiWriterDraft:
          null,

        candidate:
          null
      };
    }

    try {
      const composerPacket =
        this.buildAIWriterComposerPacket(
          state
        );

      const result =
        await writer.write({
          composerPacket,

          summary:
            state
        });

      if (
        !result ||
        typeof result !==
          "object"
      ) {
        return {
          aiWriterRan:
            false,

          aiWriterInvoked:
            true,

          aiWriterUsedAI:
            false,

          aiWriterSource:
            "invalid-result",

          aiWriterReason:
            "ai_writer_returned_invalid_result",

          aiWriterFallbackReason:
            "ai_writer_returned_invalid_result",

          draft:
            null,

          aiWriterDraft:
            null,

          candidate:
            null
        };
      }

      return result;
    } catch (error) {
      console.error(
        "Ari AI Writer execution failed:",
        error
      );

      return {
        aiWriterRan:
          false,

        aiWriterInvoked:
          true,

        aiWriterUsedAI:
          false,

        aiWriterSource:
          "writer-error",

        aiWriterReason:
          "ai_writer_execution_failed",

        aiWriterFallbackReason:
          "ai_writer_execution_failed",

        draft:
          null,

        aiWriterDraft:
          null,

        candidate:
          null,

        error:
          error?.message ||
          String(error)
      };
    }
  },

  buildAIWriterComposerPacket(
    summary = {}
  ) {
    const packet = {
      ...(
        summary.composerPacket ||
        {}
      ),

      responseCandidateArbiter:
        summary.arbiterPrecheck ||
        null,

      responseCandidateArbitrationPrecheck:
        summary.arbiterPrecheck ||
        null,

      aiRepairReason:
        summary.aiRepairReason ||
        null,

      aiWriterPreparation:
        summary.aiWriterPreparation ||
        null,

      aiWriterMode:
        summary
          .upstreamAIRequirement
          ?.mode ||
        summary.aiWriterMode ||
        null,

      aiWriterInstruction:
        summary
          .upstreamAIRequirement
          ?.instruction ||
        summary.aiWriterInstruction ||
        "",

      meaningInterpretation:
        summary.meaningInterpretation ||
        summary.composerPacket
          ?.meaningInterpretation ||
        null,

      humanState:
        summary.humanState ||
        summary.composerPacket
          ?.humanState ||
        null,

      responsePlan:
        summary.ariResponsePlan ||
        summary
          .understandingResponsePlan ||
        summary.composerPacket
          ?.responsePlan ||
        null,

      blueprintWriterDraft:
        summary.blueprintWriterDraft ||
        null,

      blueprintWriterDraftUsable:
        summary
          .blueprintWriterDraftUsable ===
        true,

      blueprintWriterUsable:
        summary
          .blueprintWriterDraftUsable ===
          true ||
        summary.blueprintWriterUsable ===
          true,

      blueprintWriter:
        summary.blueprintWriter ||
        null,

      characterCandidate:
        summary.characterCandidate ||
        null,

      characterNeedsAIWriter:
        summary.characterNeedsAIWriter ===
          true ||
        summary.characterCandidate
          ?.needsAIWriter ===
          true,

      characterAIWriterMode:
        summary.characterAIWriterMode ||
        summary.characterCandidate
          ?.aiWriterMode ||
        null,

      characterAIInstruction:
        summary.characterAIInstruction ||
        summary.characterCandidate
          ?.aiInstruction ||
        "",

      candidateDrafts:
        this.toArray(
          summary.candidateDrafts
        )
    };

    return packet;
  },

  applyAIWriterResult({
    state = {},
    aiWriterResult = {},
    shouldRunAIWriter = false
  } = {}) {
    const result =
      aiWriterResult &&
      typeof aiWriterResult ===
        "object"
        ? aiWriterResult
        : {};

    const draft =
      this.extractText(
        result.aiWriterDraft ||
        result.draft
      );

    return {
      ...state,

      ...result,

      aiWriter:
        result,

      aiWriterInvoked:
        shouldRunAIWriter ===
          true,

      aiWriterDraft:
        draft ||
        null,

      aiWriterRan:
        result.aiWriterRan ===
        true,

      aiWriterUsedAI:
        result.aiWriterUsedAI ===
        true,

      aiWriterUsable:
        result.aiWriterUsable ===
        true,

      aiWriterComplete:
        result.aiWriterComplete ===
        true,

      aiWriterRequiresRepair:
        result
          .aiWriterRequiresRepair ===
        true,

      aiWriterValidation:
        result.validation ||
        null,

      aiWriterReason:
        result.aiWriterReason ||
        result.reason ||
        null,

      aiWriterFallbackReason:
        result
          .aiWriterFallbackReason ||
        null,

      aiWriterSource:
        result.aiWriterSource ||
        result.source ||
        (
          shouldRunAIWriter
            ? "unknown"
            : "skipped-by-arbitration"
        )
    };
  },

  /* =====================================================
     FINAL ARBITRATION
  ===================================================== */

  async runFinalArbitration({
    state = {},
    eligibility = {}
  } = {}) {
    if (
      eligibility.runCandidateArbiter !==
      true
    ) {
      return {
        schema:
          "ari_response_candidate_arbitration_skip",

        schemaVersion:
          this.schemaVersion,

        responseCandidateArbiterRan:
          false,

        selectionReady:
          false,

        selectedCandidate:
          null,

        selectedDraft:
          null,

        selectedSource:
          null,

        source:
          "skipped-by-expression-eligibility",

        reason:
          eligibility.reason ||
          "candidate_arbitration_not_required"
      };
    }

    const arbiter =
      window
        .AriResponseCandidateArbiter;

    if (
      !arbiter ||
      typeof arbiter.choose !==
        "function"
    ) {
      /*
       * The fallback is allowed only because the Arbiter
       * itself is unavailable. It may never run after the
       * Arbiter evaluated and rejected candidates.
       */
      return this.buildUnavailableArbiterFallback(
        state
      );
    }

    try {
      /*
       * candidateDrafts and AI Writer output are already
       * available through state. Do not supply the same
       * candidates a second time.
       */
      const result =
        await arbiter.choose({
          summary:
            state,

          composerPacket:
            state.composerPacket ||
            null
        });

      if (
        !result ||
        typeof result !==
          "object"
      ) {
        return {
          schema:
            "ari_response_candidate_arbitration_invalid",

          schemaVersion:
            this.schemaVersion,

          responseCandidateArbiterRan:
            false,

          selectionReady:
            false,

          selectedCandidate:
            null,

          selectedDraft:
            null,

          selectedSource:
            null,

          source:
            "invalid-result",

          reason:
            "response_candidate_arbiter_returned_invalid_result"
        };
      }

      return result;
    } catch (error) {
      console.error(
        "Ari final candidate arbitration failed:",
        error
      );

      return {
        schema:
          "ari_response_candidate_arbitration_error",

        schemaVersion:
          this.schemaVersion,

        responseCandidateArbiterRan:
          false,

        selectionReady:
          false,

        selectedCandidate:
          null,

        selectedDraft:
          null,

        selectedSource:
          null,

        source:
          "arbitration-error",

        reason:
          "response_candidate_arbitration_failed",

        error:
          error?.message ||
          String(error)
      };
    }
  },

  /*
   * This compatibility path runs only when the canonical
   * Arbiter is not loaded. It must never resurrect a draft
   * after the Arbiter itself returned no selection.
   */
  buildUnavailableArbiterFallback(
    summary = {}
  ) {
    const candidates =
      this.toArray(
        summary.candidateDrafts
      )
        .filter(
          candidate =>
            candidate?.usable ===
              true &&
            candidate
              ?.requiresAIRepair !==
              true &&
            candidate
              ?.requiresRepair !==
              true &&
            Boolean(
              this.extractText(
                candidate?.text
              )
            )
        )
        .sort(
          (
            first,
            second
          ) => {
            const completionDifference =
              Number(
                second?.complete ===
                true
              ) -
              Number(
                first?.complete ===
                true
              );

            if (
              completionDifference !==
              0
            ) {
              return completionDifference;
            }

            return (
              Number(
                second?.priority ||
                0
              ) -
              Number(
                first?.priority ||
                0
              )
            );
          }
        );

    const selectedCandidate =
      candidates[0] ||
      null;

    const selectedDraft =
      this.extractText(
        selectedCandidate?.text
      );

    return {
      schema:
        "ari_response_candidate_arbitration_compatibility_fallback",

      schemaVersion:
        this.schemaVersion,

      responseCandidateArbiterRan:
        false,

      compatibilityFallbackUsed:
        true,

      selectionReady:
        Boolean(
          selectedDraft
        ),

      selectedCandidate,

      selectedDraft:
        selectedDraft ||
        null,

      selectedSource:
        selectedCandidate?.source ||
        null,

      selectedDraftSource:
        selectedCandidate?.source ||
        null,

      source:
        "arbiter-not-loaded-compatibility-fallback",

      reason:
        selectedDraft
          ? "highest_priority_explicitly_usable_candidate_selected"
          : "response_candidate_arbiter_not_loaded_and_no_explicitly_usable_candidate"
    };
  },

  applyFinalArbitration({
    state = {},
    arbitration = {}
  } = {}) {
    const result =
      arbitration &&
      typeof arbitration ===
        "object"
        ? arbitration
        : {};

    const selectedCandidate =
      result.selectedCandidate &&
      typeof result
        .selectedCandidate ===
        "object"
        ? result.selectedCandidate
        : null;

    const selectedDraft =
      this.extractText(
        selectedCandidate?.text ||
        result.selectedDraft ||
        result.finalResponseCandidate
      );

    const selectedSource =
      selectedCandidate?.source ||
      result.selectedSource ||
      result.selectedDraftSource ||
      null;

    const selectionReady =
      result.selectionReady ===
        true &&
      Boolean(
        selectedDraft
      );

    return {
      ...state,

      /*
       * Preserve Arbiter diagnostics at the top level while
       * retaining one canonical arbitration object.
       */
      ...result,

      responseCandidateArbitration:
        result,

      /*
       * Temporary compatibility alias. Remove after all
       * consumers use responseCandidateArbitration.
       */
      responseCandidateArbiter:
        result,

      selectedCandidate,

      selectedDraft:
        selectionReady
          ? selectedDraft
          : null,

      selectedDraftSource:
        selectionReady
          ? selectedSource
          : null,

      selectedSource:
        selectionReady
          ? selectedSource
          : null,

      selectionReady,

      responseCandidateArbiterRan:
        result
          .responseCandidateArbiterRan ===
        true
    };
  },

  /* =====================================================
     ARBITRATION HANDOFF
  ===================================================== */

  buildArbitrationHandoff(
    summary = {}
  ) {
    const selectedDraft =
      this.extractText(
        summary.selectedDraft
      );

    const ready =
      summary.selectionReady ===
        true &&
      Boolean(
        selectedDraft
      );

    return {
      schema:
        "ari_draft_arbitration_handoff",

      schemaVersion:
        this.schemaVersion,

      ready,

      source:
        this.source,

      version:
        this.version,

      selectionReady:
        ready,

      selectedCandidate:
        ready
          ? summary.selectedCandidate ||
            null
          : null,

      selectedDraft:
        ready
          ? selectedDraft
          : null,

      selectedSource:
        ready
          ? summary.selectedDraftSource ||
            summary.selectedSource ||
            null
          : null,

      arbitration:
        summary
          .responseCandidateArbitration ||
        null,

      candidates:
        this.toArray(
          summary.candidateDrafts
        ),

      precheck:
        summary.arbiterPrecheck ||
        null,

      aiWriter: {
        required:
          summary.needsAIWriter ===
          true,

        shouldRun:
          summary.shouldRunAIWriter ===
          true,

        invoked:
          summary.aiWriterInvoked ===
          true,

        ran:
          summary.aiWriterRan ===
          true,

        usedAI:
          summary.aiWriterUsedAI ===
          true,

        usable:
          summary.aiWriterUsable ===
          true,

        complete:
          summary.aiWriterComplete ===
          true,

        requiresRepair:
          summary
            .aiWriterRequiresRepair ===
          true,

        source:
          summary.aiWriterSource ||
          null,

        reason:
          summary.aiWriterReason ||
          null,

        fallbackReason:
          summary
            .aiWriterFallbackReason ||
          null,

        draft:
          summary.aiWriterDraft ||
          null,

        validation:
          summary.aiWriterValidation ||
          null,

        repairReason:
          summary.aiRepairReason ||
          null,

        upstreamRequirement:
          summary.upstreamAIRequirement ||
          null
      },

      failure: {
        selectionUnavailable:
          !ready,

        reason:
          ready
            ? null
            : summary
                .responseCandidateArbitration
                ?.reason ||
              "no_arbiter_authorized_candidate"
      },

      authority:
        this.getAuthorityBoundaries()
    };
  },

  /* =====================================================
     STAGE PACKET
  ===================================================== */

  buildDraftArbitrationStagePacket(
    summary = {}
  ) {
    const selectedDraft =
      this.extractText(
        summary.selectedDraft
      );

    const ready =
      summary.selectionReady ===
        true &&
      Boolean(
        selectedDraft
      );

    return {
      schema:
        "ari_draft_arbitration_stage_packet",

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
        summary.arbitrationEligibility ||
        null,

      precheck: {
        ran:
          summary.arbiterPrecheckRan ===
          true,

        source:
          summary.arbiterPrecheckSource ||
          null,

        value:
          summary.arbiterPrecheck ||
          null,

        upstreamAIRequirement:
          summary.upstreamAIRequirement ||
          null,

        needsAIWriter:
          summary.needsAIWriter ===
          true,

        repairReason:
          summary.aiRepairReason ||
          null
      },

      aiWriter: {
        shouldRun:
          summary.shouldRunAIWriter ===
          true,

        invoked:
          summary.aiWriterInvoked ===
          true,

        ran:
          summary.aiWriterRan ===
          true,

        usedAI:
          summary.aiWriterUsedAI ===
          true,

        usable:
          summary.aiWriterUsable ===
          true,

        complete:
          summary.aiWriterComplete ===
          true,

        requiresRepair:
          summary
            .aiWriterRequiresRepair ===
          true,

        source:
          summary.aiWriterSource ||
          null,

        reason:
          summary.aiWriterReason ||
          null,

        fallbackReason:
          summary
            .aiWriterFallbackReason ||
          null,

        draft:
          summary.aiWriterDraft ||
          null,

        validation:
          summary.aiWriterValidation ||
          null,

        raw:
          summary.aiWriter ||
          null
      },

      arbiter: {
        ran:
          summary
            .responseCandidateArbiterRan ===
          true,

        selectionReady:
          ready,

        selectedCandidate:
          ready
            ? summary.selectedCandidate ||
              null
            : null,

        selectedDraft:
          ready
            ? selectedDraft
            : null,

        selectedSource:
          ready
            ? summary.selectedDraftSource ||
              null
            : null,

        value:
          summary
            .responseCandidateArbitration ||
          null
      },

      result: {
        ready,

        selectedCandidate:
          ready
            ? summary.selectedCandidate ||
              null
            : null,

        selectedDraft:
          ready
            ? selectedDraft
            : null,

        selectedSource:
          ready
            ? summary.selectedDraftSource ||
              null
            : null,

        candidateCount:
          this.toArray(
            summary.candidateDrafts
          ).length,

        failureReason:
          ready
            ? null
            : summary
                .responseCandidateArbitration
                ?.reason ||
              "no_arbiter_authorized_candidate"
      },

      handoff:
        summary.arbitrationHandoff ||
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
      canRunArbiterPrecheck:
        true,

      canRequestAIWriter:
        true,

      canRunAIWriter:
        true,

      canRunFinalCandidateArbitration:
        true,

      canPreserveArbiterSelection:
        true,

      canBuildArbitrationHandoff:
        true,

      canRegisterCharacterCandidate:
        false,

      canRegisterBlueprintCandidate:
        false,

      canIndependentlyRegisterAICandidate:
        false,

      canIndependentlyScoreCandidates:
        false,

      canIndependentlySelectCandidate:
        false,

      canResurrectRejectedCandidate:
        false,

      canBypassRequiredCharacterRealization:
        false,

      canComposeFinalResponse:
        false,

      canChangeResponsePlan:
        false,

      canOverrideSafety:
        false,

      canPersistState:
        false,

      role:
        "ai_writer_activation_and_canonical_candidate_arbitration_orchestration"
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
        value.draft ||
        value.finalResponse ||
        value.response ||
        value.reply ||
        value.content ||
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
  "ARI DRAFT ARBITRATION STAGE LOADED:",
  window.AriDraftArbitrationStage
    ?.version
);