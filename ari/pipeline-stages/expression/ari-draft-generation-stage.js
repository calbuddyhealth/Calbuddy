// ari/pipeline-stages/expression/ari-draft-generation-stage.js
// Ari Draft Generation Stage
// Purpose: Build the composer packet and generate blueprint and AI draft candidates.
// V1.0.0 — Composer Bridge / Blueprint Writer / AI Writer Orchestration

window.Ari = window.Ari || {};

window.AriDraftGenerationStage = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      buildFallbackComposerPacket =
        state => ({
          ready: false,
          source: "fallback-not-provided",
          userQuestion:
            state.resolvedUserQuestion ||
            state.userMessage ||
            state.message ||
            state.input ||
            ""
        }),

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
        },

      isUsableBlueprintDraft =
        draft =>
          Boolean(
            String(draft || "").trim()
          )
    } = runtime;

    let state = {
      ...summary,
      activeExpressionStage: "draft_generation"
    };

    const generationEligibility =
      this.resolveGenerationEligibility(state);

    state = {
      ...state,

      generationEligibility,

      shouldBuildComposerPacket:
        generationEligibility.buildComposerPacket,

      shouldRunBlueprintWriter:
        generationEligibility.runBlueprintWriter,

      shouldPrepareAIWriter:
        generationEligibility.prepareAIWriter
    };

    // =================================================
    // 1. Composer Bridge
    // =================================================

    mark("before composerBridge");

    const composerPacketResult =
      generationEligibility.buildComposerPacket &&
      window.AriComposerBridge?.build
        ? await window.AriComposerBridge.build(
            state
          )
        : {
            composerPacketReady:
              false,

            source:
              generationEligibility.buildComposerPacket
                ? "not-loaded"
                : "skipped-by-expression-eligibility",

            reason:
              generationEligibility.buildComposerPacket
                ? "composer_bridge_not_loaded"
                : "composer_packet_not_required"
          };

    state = {
      ...state,

      ...composerPacketResult,

      composerPacket:
        composerPacketResult.composerPacket ||
        state.composerPacket ||
        buildFallbackComposerPacket(state)
    };

    if (
      !state.composerPacket ||
      state.composerPacket.ready !== true
    ) {
      state.composerPacket =
        buildFallbackComposerPacket(state);
    }

    state.composerPacket =
      this.enrichComposerPacket(state);

    state.composerPacketReady =
      state.composerPacket?.ready === true;

    state.composerBridgeRan =
      composerPacketResult
        .composerPacketReady === true ||
      Boolean(
        composerPacketResult.composerPacket
      );

    state.composerBridgeSource =
      composerPacketResult.source ||
      (
        state.composerBridgeRan
          ? "ari-composer-bridge"
          : "fallback"
      );

    mark("after composerBridge");

    // =================================================
    // 2. Blueprint Writer
    // =================================================

    mark("before blueprintWriter");

    const blueprintWriterResult =
      generationEligibility.runBlueprintWriter &&
      window.AriBlueprintWriter?.write
        ? await window.AriBlueprintWriter.write({
            composerPacket:
              state.composerPacket,

            summary:
              state
          })
        : {
            blueprintWriterRan:
              false,

            draft:
              null,

            source:
              generationEligibility.runBlueprintWriter
                ? "not-loaded"
                : "skipped-by-expression-eligibility",

            reason:
              generationEligibility.runBlueprintWriter
                ? "blueprint_writer_not_loaded"
                : "blueprint_writer_not_required"
          };

    state = {
      ...state,

      ...blueprintWriterResult,

      blueprintWriter:
        blueprintWriterResult,

      blueprintWriterDraft:
        blueprintWriterResult.draft ||
        blueprintWriterResult
          .blueprintWriterDraft ||
        null,

      blueprintWriterRan:
        blueprintWriterResult
          .blueprintWriterRan === true,

      blueprintWriterSource:
        blueprintWriterResult.source ||
        "unknown"
    };

    const blueprintUsable =
      generationEligibility.runBlueprintWriter &&
      isUsableBlueprintDraft(
        state.blueprintWriterDraft,
        state
      );

    state.candidateDrafts =
      addCandidateDraft(
        state.candidateDrafts,
        {
          source:
            "blueprint_writer",

          text:
            state.blueprintWriterDraft,

          priority:
            60,

          usable:
            blueprintUsable,

          evidence: {
            writerRan:
              state.blueprintWriterRan === true,

            composerPacketReady:
              state.composerPacketReady === true
          }
        }
      );

    mark("after blueprintWriter");

    // =================================================
    // 3. AI Writer preparation
    // =================================================

    const characterDraft =
      state.characterReasoning
        ?.userFacingDraft ||
      state.composerCharacter
        ?.draft ||
      null;

    const characterAnswerAvailable =
      state.characterReasoning
        ?.characterAnswerAvailable === true &&
      Boolean(
        String(characterDraft || "").trim()
      );

    state = {
      ...state,

      characterDraftCandidate:
        characterDraft,

      characterAnswerAvailable
    };

    if (characterAnswerAvailable) {
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
              characterAnswerAvailable:
                true
            }
          }
        );
    }

    // =================================================
    // 4. Draft Generation Packet
    // =================================================

    state.draftGenerationStagePacket =
      this.buildDraftGenerationStagePacket(
        state
      );

    state.draftGenerationStageRan =
      true;

    state.draftGenerationStageSource =
      "ari-draft-generation-stage";

    state.draftGenerationStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveGenerationEligibility(summary = {}) {
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

    const buildComposerPacket =
      !developerLocked;

    const runBlueprintWriter =
      !developerLocked &&
      !responseLocked &&
      !hasFinalResponse;

    return {
      buildComposerPacket,

      runBlueprintWriter,

      prepareAIWriter:
        !developerLocked &&
        !responseLocked,

      developerLocked,
      responseLocked,
      hasFinalResponse,

      source:
        "ari-draft-generation-stage-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : responseLocked
            ? "response_already_locked"
            : hasFinalResponse
              ? "final_response_already_available"
              : "draft_generation_required"
    };
  },

  // ===================================================
  // Composer packet enrichment
  // ===================================================

  enrichComposerPacket(summary = {}) {
    const packet =
      summary.composerPacket ||
      {};

    return {
      ...packet,

      ready:
        packet.ready !== false,

      perceptionPacket:
        summary.perceptionPacket ||
        null,

      executivePacket:
        summary.executivePacket ||
        null,

      deliberationPacket:
        summary.deliberationPacket ||
        null,

      responseStrategy:
        summary.responseStrategy ||
        packet.responseStrategy ||
        null,

      meaningInterpretation:
        summary.meaningInterpretation ||
        packet.meaningInterpretation ||
        null,

      humanState:
        summary.humanState ||
        packet.humanState ||
        null,

      responsePlan:
        summary.ariResponsePlan ||
        summary.understandingResponsePlan ||
        packet.responsePlan ||
        summary.responsePlan ||
        null,

      character:
        summary.composerCharacter ||
        summary.characterHandoff ||
        packet.character ||
        null,

      languageGuidance:
        summary.languageGuidanceHandoff ||
        packet.languageGuidance ||
        null,

      safety:
        {
          ...(packet.safety || {}),

          earlyGate:
            summary.safetyContextGate ||
            packet.safety?.earlyGate ||
            null,

          deepReview:
            summary.deepSafetyResult ||
            packet.safety?.deepReview ||
            null,

          disposition:
            summary.safetyDisposition ||
            packet.safety?.disposition ||
            null
        },

      memory:
        {
          retrieval:
            summary.memoryRetrieval ||
            packet.memory?.retrieval ||
            null,

          context:
            summary.memoryContext ||
            packet.memory?.context ||
            null,

          facts:
            summary.memoryFacts ||
            summary.usableMemories ||
            packet.memory?.facts ||
            []
        },

      developerPacket:
        summary.composerDeveloperPacket ||
        packet.developerPacket ||
        null,

      hasDeveloperPacket:
        summary.composerDeveloperPacket
          ?.enabled === true ||
        packet.hasDeveloperPacket === true,

      expressionPlan:
        summary.expressionPlan ||
        packet.expressionPlan ||
        null,

      blueprintHint:
        summary.blueprintHint ||
        packet.blueprintHint ||
        null,

      communicationPlan:
        summary.communicationPlan ||
        packet.communicationPlan ||
        null,

      composerDirective:
        summary.composerDirective ||
        packet.composerDirective ||
        null,

      responseRules:
        summary.responseRules ||
        packet.responseRules ||
        [],

      responseConstraints:
        summary.responseConstraints ||
        packet.responseConstraints ||
        [],

      responseRequired:
        summary.responseRequired ||
        packet.responseRequired ||
        [],

      responseAvoid:
        summary.responseAvoid ||
        packet.responseAvoid ||
        [],

      candidateDrafts:
        summary.candidateDrafts ||
        packet.candidateDrafts ||
        []
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildDraftGenerationStagePacket(
    summary = {}
  ) {
    return {
      ready:
        true,

      source:
        "ari-draft-generation-stage",

      version:
        this.version,

      eligibility:
        summary.generationEligibility ||
        null,

      composerBridge: {
        ran:
          summary.composerBridgeRan === true,

        source:
          summary.composerBridgeSource ||
          null,

        ready:
          summary.composerPacketReady === true,

        packet:
          summary.composerPacket ||
          null
      },

      blueprintWriter: {
        ran:
          summary.blueprintWriterRan === true,

        source:
          summary.blueprintWriterSource ||
          null,

        draft:
          summary.blueprintWriterDraft ||
          null,

        raw:
          summary.blueprintWriter ||
          null
      },

      characterCandidate: {
        available:
          summary.characterAnswerAvailable === true,

        draft:
          summary.characterDraftCandidate ||
          null
      },

      candidates:
        summary.candidateDrafts ||
        [],

      responseControl: {
        responseLocked:
          summary.responseLocked === true,

        developerResponseLocked:
          summary.developerResponseLocked === true,

        finalResponseAvailable:
          Boolean(
            String(
              summary.finalResponse ||
              ""
            ).trim()
          )
      },

      authority: {
        canBuildComposerPacket:
          true,

        canGenerateBlueprintDraft:
          true,

        canPrepareAIWriterInput:
          true,

        canRegisterDraftCandidates:
          true,

        canRunAIWriter:
          false,

        canSelectFinalDraft:
          false,

        canWriteFinalResponse:
          false,

        canPersistState:
          false,

        role:
          "composer_packet_and_initial_draft_generation"
      }
    };
  }
};

console.log(
  "ARI DRAFT GENERATION STAGE LOADED:",
  window.AriDraftGenerationStage?.version
);
