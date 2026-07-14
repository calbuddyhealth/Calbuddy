// ari/pipeline-stages/expression/ari-draft-arbitration-stage.js
// Ari Draft Arbitration Stage
// Purpose: Decide whether AI writing is needed, generate AI draft candidates,
// and select the strongest available draft.
// V1.1.0 — Candidate Status Preservation / Safe Fallback Selection

window.Ari = window.Ari || {}; 

window.AriDraftArbitrationStage = {
  version: "1.1.0",

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

        complete:
          true,

        requiresRepair:
          false,

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
    aiWriterResult
      ?.aiWriterDraft ||
    state.aiWriterDraft ||
    null,

  aiWriterRan:
    aiWriterResult
      ?.aiWriterRan ===
    true,

  aiWriterUsedAI:
    aiWriterResult
      ?.aiWriterUsedAI ===
    true,

  aiWriterUsable:
    aiWriterResult
      ?.aiWriterUsable ===
    true,

  aiWriterComplete:
    aiWriterResult
      ?.aiWriterComplete ===
    true,

  aiWriterRequiresRepair:
    aiWriterResult
      ?.aiWriterRequiresRepair ===
    true,

  aiWriterValidation:
    aiWriterResult
      ?.validation ||
    null,

  aiWriterReason:
    aiWriterResult
      ?.aiWriterReason ||
    null,

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
  const aiCandidate =
    aiWriterResult?.candidate &&
    typeof aiWriterResult.candidate ===
      "object"
      ? aiWriterResult.candidate
      : {};

  const writerMarkedUsable =
    aiWriterResult
      ?.aiWriterUsable ===
    true;

  const writerMarkedComplete =
    aiWriterResult
      ?.aiWriterComplete ===
    true;

  const writerRequiresRepair =
    aiWriterResult
      ?.aiWriterRequiresRepair ===
    true;

  state.candidateDrafts =
    addCandidateDraft(
      state.candidateDrafts,
      {
        ...aiCandidate,

        source:
          "ai_writer",

        text:
          state.aiWriterDraft,

        priority:
          Number.isFinite(
            Number(
              aiCandidate.priority
            )
          )
            ? Number(
                aiCandidate.priority
              )
            : writerMarkedUsable
              ? 80
              : 20,

        usable:
          writerMarkedUsable,

        complete:
          writerMarkedComplete,

        requiresRepair:
          writerRequiresRepair,

        validation:
          aiWriterResult
            ?.validation ||
          aiCandidate.validation ||
          null,

        evidence: {
          ...(
            aiCandidate.evidence ||
            {}
          ),

          usedAI:
            state.aiWriterUsedAI ===
            true,

          writerMarkedUsable,

          writerMarkedComplete,

          writerRequiresRepair,

          writerReason:
            aiWriterResult
              ?.aiWriterReason ||
            null,

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

    const fallbackSelectedDraft =
  this.selectFallbackDraft(
    state
  );

const selectedDraft =
  arbiterResult
    ?.selectedDraft ||
  fallbackSelectedDraft ||
  null;

const selectedDraftSource =
  arbiterResult
    ?.selectedSource ||
  this.resolveSelectedDraftSource(
    selectedDraft,
    state
  ) ||
  (
    arbiterResult
      ?.selectedDraft
      ? "unknown_candidate"
      : null
  );

state = {
  ...state,

  ...(arbiterResult || {}),

  responseCandidateArbiter:
    arbiterResult ||
    null,

  selectedDraft,

  selectedDraftSource,

  responseCandidateArbiterRan:
    Boolean(
      arbiterResult
    )
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
  
  selectFallbackDraft(
  summary = {}
) {
  const candidates =
    Array.isArray(
      summary.candidateDrafts
    )
      ? summary.candidateDrafts
      : [];

  const usableCandidates =
    candidates
      .filter(
        candidate =>
          candidate?.usable ===
            true &&
          Boolean(
            String(
              candidate?.text ||
              ""
            ).trim()
          )
      )
      .sort(
        (a, b) => {
          const completeDifference =
            Number(
              b?.complete === true
            ) -
            Number(
              a?.complete === true
            );

          if (
            completeDifference !==
            0
          ) {
            return completeDifference;
          }

          return (
            Number(
              b?.priority ||
              0
            ) -
            Number(
              a?.priority ||
              0
            )
          );
        }
      );

  if (
    usableCandidates.length
  ) {
    return (
      usableCandidates[0]
        .text ||
      null
    );
  }

  const characterDraft =
    String(
      summary
        .characterDraftCandidate ||
      ""
    ).trim();

  if (
    summary
      .characterAnswerAvailable ===
      true &&
    characterDraft
  ) {
    return characterDraft;
  }

  const blueprintDraft =
    String(
      summary
        .blueprintWriterDraft ||
      ""
    ).trim();

  const blueprintUsable =
    summary
      .blueprintWriterUsable ===
      true ||
    summary.blueprintWriter
      ?.blueprintWriterUsable ===
      true ||
    summary.blueprintWriter
      ?.candidate
      ?.usable ===
      true;

  if (
    blueprintUsable &&
    blueprintDraft
  ) {
    return blueprintDraft;
  }

  return null;
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
    summary.needsAIWriter ===
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

  draft:
    summary.aiWriterDraft ||
    null,

  validation:
    summary.aiWriterValidation ||
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
    summary.shouldRunAIWriter ===
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
