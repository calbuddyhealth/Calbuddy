// ari/pipeline-stages/expression/ari-draft-arbitration-stage.js
// Ari Draft Arbitration Stage
// Purpose: Decide whether AI writing is needed, generate AI draft candidates,
// and select the strongest available draft.
// V1.0.0 — Arbiter Precheck / AI Writer / Candidate Selection Orchestration

window.Ari = window.Ari || {};

window.AriDraftArbitrationStage = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      addCandidateDraft =
        (existing = [], candidate = {}) => {
          const text =
            String(candidate.text || "").trim();

          if (!text) {
            return Array.isArray(existing)
              ? existing
              : [];
          }

          return [
            ...(Array.isArray(existing)
              ? existing
              : []),

            {
              ...candidate,
              text,
              createdAt: Date.now()
            }
          ];
        }
    } = runtime;

    let state = {
      ...summary,
      activeExpressionStage: "draft_arbitration"
    };

    const arbitrationEligibility =
      this.resolveArbitrationEligibility(state);

    state = {
      ...state,

      arbitrationEligibility,

      shouldRunArbiterPrecheck:
        arbitrationEligibility.runPrecheck,

      shouldAllowAIWriter:
        arbitrationEligibility.allowAIWriter,

      shouldRunCandidateArbiter:
        arbitrationEligibility.runCandidateArbiter
    };

    // =================================================
    // 1. Arbiter Precheck
    // =================================================

    mark("before arbiterPrecheck");

    const arbiterPrecheck =
      arbitrationEligibility.runPrecheck &&
      window.AriResponseCandidateArbiter?.precheck
        ? await window.AriResponseCandidateArbiter.precheck({
            summary: state,

            composerPacket:
              state.composerPacket ||
              null,

            candidates:
              state.candidateDrafts ||
              []
          })
        : {
            arbiterPrecheckRan:
              false,

            needsAIWriter:
              arbitrationEligibility.allowAIWriter,

            aiRepairReason:
              arbitrationEligibility.allowAIWriter
                ? "arbiter_precheck_not_loaded"
                : null,

            source:
              arbitrationEligibility.runPrecheck
                ? "not-loaded"
                : "skipped-by-expression-eligibility"
          };

    state = {
      ...state,

      arbiterPrecheck,

      needsAIWriter:
        arbiterPrecheck.needsAIWriter === true,

      aiRepairReason:
        arbiterPrecheck.aiRepairReason ||
        null,

      arbiterPrecheckRan:
        arbiterPrecheck
          .arbiterPrecheckRan === true,

      arbiterPrecheckSource:
        arbiterPrecheck.source ||
        (
          state.arbiterPrecheckRan
            ? "ari-response-candidate-arbiter"
            : "unknown"
        )
    };

    mark("after arbiterPrecheck");

    // =================================================
    // 2. Character response bypass
    // =================================================

    const characterDraft =
      state.characterDraftCandidate ||
      state.characterReasoning
        ?.userFacingDraft ||
      state.composerCharacter
        ?.draft ||
      null;

    const shouldBypassAIWriterForCharacter =
      state.characterAnswerAvailable === true &&
      Boolean(
        String(characterDraft || "").trim()
      );

    state = {
      ...state,
      shouldBypassAIWriterForCharacter
    };

    if (
      shouldBypassAIWriterForCharacter &&
      characterDraft
    ) {
      state.candidateDrafts =
        addCandidateDraft(
          state.candidateDrafts,
          {
            source:
              "character_reasoning",

            text:
              characterDraft,

            priority:
              75,

            usable:
              true,

            evidence: {
              bypassedAIWriter:
                true,

              reason:
                "character_reasoning_complete_answer"
            }
          }
        );
    }

    // =================================================
    // 3. AI Writer
    // =================================================

    const shouldRunAIWriter =
      arbitrationEligibility.allowAIWriter &&
      state.needsAIWriter === true &&
      !shouldBypassAIWriterForCharacter;

    state = {
      ...state,
      shouldRunAIWriter
    };

    mark("before aiWriter");

    let aiWriterResult;

    if (shouldBypassAIWriterForCharacter) {
      aiWriterResult = {
        aiWriterRan:
          false,

        aiWriterUsedAI:
          false,

        aiWriterSource:
          "bypassed-character-reasoning",

        draft:
          characterDraft,

        aiWriterDraft:
          characterDraft,

        aiWriterBypassReason:
          "Character reasoning already produced a complete answer."
      };
    } else if (
      shouldRunAIWriter &&
      window.AriAIWriter?.write
    ) {
      aiWriterResult =
        await window.AriAIWriter.write({
          composerPacket: {
            ...(state.composerPacket || {}),

            responseCandidateArbiter:
              state.arbiterPrecheck ||
              null,

            aiRepairReason:
              state.aiRepairReason ||
              null,

            meaningInterpretation:
              state.meaningInterpretation ||
              state.composerPacket
                ?.meaningInterpretation ||
              null,

            humanState:
              state.humanState ||
              state.composerPacket
                ?.humanState ||
              null,

            responsePlan:
              state.ariResponsePlan ||
              state.understandingResponsePlan ||
              state.composerPacket
                ?.responsePlan ||
              null,

            blueprintWriterDraft:
              state.blueprintWriterDraft ||
              null,

            blueprintWriter:
              state.blueprintWriter ||
              null,

            candidateDrafts:
              state.candidateDrafts ||
              []
          },

          summary:
            state
        });
    } else {
      aiWriterResult = {
        aiWriterRan:
          false,

        aiWriterUsedAI:
          false,

        aiWriterSource:
          shouldRunAIWriter
            ? "not-loaded"
            : "skipped-by-arbitration",

        draft:
          null,

        aiWriterDraft:
          null,

        aiWriterFallbackReason:
          shouldRunAIWriter
            ? "ai_writer_not_loaded"
            : "ai_writer_not_required"
      };
    }

    state = {
      ...state,

      ...(aiWriterResult || {}),

      aiWriter:
        aiWriterResult ||
        null,

      aiWriterDraft:
        aiWriterResult?.draft ||
        aiWriterResult?.aiWriterDraft ||
        state.aiWriterDraft ||
        null,

      aiWriterRan:
        aiWriterResult
          ?.aiWriterRan === true,

      aiWriterUsedAI:
        aiWriterResult
          ?.aiWriterUsedAI === true,

      aiWriterSource:
        aiWriterResult
          ?.aiWriterSource ||
        aiWriterResult?.source ||
        "unknown"
    };

    if (
      state.aiWriterDraft &&
      !shouldBypassAIWriterForCharacter
    ) {
      state.candidateDrafts =
        addCandidateDraft(
          state.candidateDrafts,
          {
            source:
              "ai_writer",

            text:
              state.aiWriterDraft,

            priority:
              80,

            usable:
              Boolean(
                String(
                  state.aiWriterDraft
                ).trim()
              ),

            evidence: {
              usedAI:
                state.aiWriterUsedAI === true,

              repairReason:
                state.aiRepairReason ||
                null
            }
          }
        );
    }

    mark("after aiWriter");

    // =================================================
    // 4. Candidate Arbiter
    // =================================================

    mark("before responseCandidateArbiter");

    const arbiterResult =
      arbitrationEligibility.runCandidateArbiter &&
      window.AriResponseCandidateArbiter?.choose
        ? await window.AriResponseCandidateArbiter.choose({
            summary: state,

            composerPacket:
              state.composerPacket ||
              null,

            candidates:
              state.candidateDrafts ||
              []
          })
        : null;

    state = {
      ...state,

      ...(arbiterResult || {}),

      responseCandidateArbiter:
        arbiterResult ||
        null,

      selectedDraft:
        arbiterResult?.selectedDraft ||
        this.selectFallbackDraft(state),

      selectedDraftSource:
        arbiterResult?.selectedSource ||
        arbiterResult?.source ||
        this.resolveSelectedDraftSource(
          arbiterResult?.selectedDraft ||
          this.selectFallbackDraft(state),
          state
        ),

      responseCandidateArbiterRan:
        Boolean(arbiterResult)
    };

    mark("after responseCandidateArbiter");

    // =================================================
    // 5. Arbitration handoff
    // =================================================

    const arbitrationHandoff =
      this.buildArbitrationHandoff(state);

    state = {
      ...state,
      arbitrationHandoff
    };

    // =================================================
    // 6. Stage packet
    // =================================================

    state.draftArbitrationStagePacket =
      this.buildDraftArbitrationStagePacket(
        state
      );

    state.draftArbitrationStageRan =
      true;

    state.draftArbitrationStageSource =
      "ari-draft-arbitration-stage";

    state.draftArbitrationStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveArbitrationEligibility(
    summary = {}
  ) {
    const developerLocked =
      summary.developerResponseLocked === true;

    const responseLocked =
      summary.responseLocked === true;

    const hasFinalResponse =
      Boolean(
        String(
          summary.finalResponse ||
          ""
        ).trim()
      );

    return {
      runPrecheck:
        !developerLocked &&
        !responseLocked,

      allowAIWriter:
        !developerLocked &&
        !responseLocked &&
        !hasFinalResponse,

      runCandidateArbiter:
        !developerLocked &&
        !responseLocked,

      developerLocked,
      responseLocked,
      hasFinalResponse,

      source:
        "ari-draft-arbitration-stage-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : responseLocked
            ? "response_locked"
            : hasFinalResponse
              ? "final_response_already_available"
              : "draft_arbitration_required"
    };
  },

  // ===================================================
  // Fallback draft selection
  // ===================================================

  selectFallbackDraft(summary = {}) {
    const candidates =
      Array.isArray(summary.candidateDrafts)
        ? summary.candidateDrafts
        : [];

    const usableCandidates =
      candidates
        .filter(candidate =>
          candidate?.usable !== false &&
          Boolean(
            String(
              candidate?.text ||
              ""
            ).trim()
          )
        )
        .sort(
          (a, b) =>
            Number(b?.priority || 0) -
            Number(a?.priority || 0)
        );

    return (
      usableCandidates[0]?.text ||
      summary.aiWriterDraft ||
      summary.characterDraftCandidate ||
      summary.blueprintWriterDraft ||
      null
    );
  },

  resolveSelectedDraftSource(
    draft = "",
    summary = {}
  ) {
    const text =
      String(draft || "").trim();

    if (!text) {
      return null;
    }

    const candidate =
      (summary.candidateDrafts || [])
        .find(item =>
          String(
            item?.text || ""
          ).trim() === text
        );

    if (candidate?.source) {
      return candidate.source;
    }

    if (
      text ===
      String(
        summary.aiWriterDraft || ""
      ).trim()
    ) {
      return "ai_writer";
    }

    if (
      text ===
      String(
        summary.characterDraftCandidate || ""
      ).trim()
    ) {
      return "character_reasoning";
    }

    if (
      text ===
      String(
        summary.blueprintWriterDraft || ""
      ).trim()
    ) {
      return "blueprint_writer";
    }

    return "fallback";
  },

  // ===================================================
  // Arbitration handoff
  // ===================================================

  buildArbitrationHandoff(summary = {}) {
    return {
      ready:
        Boolean(
          String(
            summary.selectedDraft ||
            ""
          ).trim()
        ),

      selectedDraft:
        summary.selectedDraft ||
        null,

      selectedSource:
        summary.selectedDraftSource ||
        null,

      candidates:
        summary.candidateDrafts ||
        [],

      precheck:
        summary.arbiterPrecheck ||
        null,

      aiWriter: {
        needed:
          summary.needsAIWriter === true,

        ran:
          summary.aiWriterRan === true,

        usedAI:
          summary.aiWriterUsedAI === true,

        source:
          summary.aiWriterSource ||
          null,

        draft:
          summary.aiWriterDraft ||
          null,

        repairReason:
          summary.aiRepairReason ||
          null
      },

      characterBypass:
        summary
          .shouldBypassAIWriterForCharacter === true,

      authority: {
        canRequestAIWriter:
          true,

        canRegisterDraftCandidates:
          true,

        canSelectPreferredDraft:
          true,

        canWriteFinalResponse:
          false,

        canPersistState:
          false,

        role:
          "draft_candidate_generation_and_selection"
      }
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildDraftArbitrationStagePacket(
    summary = {}
  ) {
    return {
      ready:
        true,

      source:
        "ari-draft-arbitration-stage",

      version:
        this.version,

      eligibility:
        summary.arbitrationEligibility ||
        null,

      precheck: {
        ran:
          summary.arbiterPrecheckRan === true,

        source:
          summary.arbiterPrecheckSource ||
          null,

        value:
          summary.arbiterPrecheck ||
          null,

        needsAIWriter:
          summary.needsAIWriter === true,

        repairReason:
          summary.aiRepairReason ||
          null
      },

      aiWriter: {
        shouldRun:
          summary.shouldRunAIWriter === true,

        ran:
          summary.aiWriterRan === true,

        usedAI:
          summary.aiWriterUsedAI === true,

        source:
          summary.aiWriterSource ||
          null,

        draft:
          summary.aiWriterDraft ||
          null,

        raw:
          summary.aiWriter ||
          null
      },

      arbiter: {
        ran:
          summary
            .responseCandidateArbiterRan === true,

        value:
          summary.responseCandidateArbiter ||
          null
      },

      result: {
        selectedDraft:
          summary.selectedDraft ||
          null,

        selectedSource:
          summary.selectedDraftSource ||
          null,

        candidates:
          summary.candidateDrafts ||
          [],

        characterBypass:
          summary
            .shouldBypassAIWriterForCharacter === true
      },

      handoff:
        summary.arbitrationHandoff ||
        null,

      authority: {
        canRunArbiterPrecheck:
          true,

        canRunAIWriter:
          true,

        canSelectPreferredDraft:
          true,

        canComposeFinalResponse:
          false,

        canPersistState:
          false,

        role:
          "ai_writer_activation_and_draft_arbitration"
      }
    };
  }
};

console.log(
  "ARI DRAFT ARBITRATION STAGE LOADED:",
  window.AriDraftArbitrationStage?.version
);