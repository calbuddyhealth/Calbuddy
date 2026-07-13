// ari/pipeline-stages/expression/ari-draft-generation-stage.js
// Ari Draft Generation Stage
// Purpose: Build the Composer Packet and register grounded initial draft candidates.
// V2.0.0 — Focused Character Candidate / Blueprint Coordination / AI Preparation
//
// Architectural position:
//
// Character Stage
//      ↓
// Composer Bridge
//      ↓
// Draft Generation Stage
//      ├─ Register grounded Character candidate
//      ├─ Run Blueprint Writer when appropriate
//      └─ Prepare AI Writer requirements
//            ↓
// Draft Arbitration Stage
//
// Responsibilities:
// - Build and preserve the Composer Packet.
// - Register grounded deterministic Character drafts as candidates.
// - Preserve canonical, inferred, open, identity, and worldview status.
// - Run Blueprint Writer when a deterministic blueprint is still useful.
// - Carry character AI-realization instructions into arbitration.
// - Register Blueprint Writer drafts as separate candidates.
// - Produce a normalized Draft Generation Stage packet.
//
// Non-responsibilities:
// - Does not resolve Character preferences.
// - Does not create Character meaning.
// - Does not change canonical Character values.
// - Does not create a fallback Response Plan.
// - Does not run the AI Writer.
// - Does not select the final candidate.
// - Does not write the final response.
// - Does not override safety.
// - Does not access Supabase.
// - Does not persist state.

window.Ari = window.Ari || {};

window.AriDraftGenerationStage = {
  version: "2.0.0",
  source: "ari-draft-generation-stage",
  authorityLevel: "initial_draft_candidate_registration_authority",
  schemaVersion: "2.0",

  // ===================================================
  // Main entry
  // ===================================================

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      buildFallbackComposerPacket =
        state =>
          this.buildFallbackComposerPacket(
            state
          ),

      addCandidateDraft =
        (existing = [], candidate = {}) =>
          this.addCandidateDraft(
            existing,
            candidate
          ),

      isUsableBlueprintDraft =
        draft =>
          this.isUsableDraft(
            draft
          )
    } = runtime;

    let state = {
      ...summary,

      activeExpressionStage:
        "draft_generation"
    };

    const generationEligibility =
      this.resolveGenerationEligibility(
        state
      );

    state = {
      ...state,

      generationEligibility,

      shouldBuildComposerPacket:
        generationEligibility
          .buildComposerPacket,

      shouldRunBlueprintWriter:
        generationEligibility
          .runBlueprintWriter,

      shouldPrepareAIWriter:
        generationEligibility
          .prepareAIWriter
    };

    // =================================================
    // 1. Composer Bridge
    // =================================================

    mark("before composerBridge");

    const composerPacketResult =
      generationEligibility
        .buildComposerPacket ===
        true &&
      typeof window.AriComposerBridge
        ?.build ===
        "function"
        ? await window.AriComposerBridge
            .build(state)
        : {
            composerPacketReady:
              false,

            composerBridgeRan:
              false,

            composerBridgeSource:
              generationEligibility
                .buildComposerPacket
                ? "not-loaded"
                : "skipped-by-expression-eligibility",

            reason:
              generationEligibility
                .buildComposerPacket
                ? "composer_bridge_not_loaded"
                : "composer_packet_not_required"
          };

    const bridgePacket =
      composerPacketResult
        ?.composerPacket ||
      state.composerPacket ||
      null;

    /*
     * Do not destroy a structured Composer Packet merely
     * because its `ready` flag is false.
     *
     * A not-ready packet may still contain diagnostics,
     * Character evidence, or a missing-plan explanation.
     */
    const composerPacket =
      bridgePacket &&
      typeof bridgePacket ===
        "object"
        ? bridgePacket
        : buildFallbackComposerPacket(
            state
          );

    state = {
      ...state,

      ...composerPacketResult,

      composerPacket:
        this.enrichComposerPacket({
          ...state,
          composerPacket
        }),

      composerBridgeRan:
        composerPacketResult
          ?.composerBridgeRan ===
          true ||
        Boolean(bridgePacket),

      composerBridgeSource:
        composerPacketResult
          ?.composerBridgeSource ||
        composerPacketResult
          ?.source ||
        (
          bridgePacket
            ? "ari-composer-bridge"
            : "fallback"
        )
    };

    state.composerPacketReady =
      state.composerPacket
        ?.ready ===
      true;

    state.composerPacketUsable =
      state.composerPacket
        ?.usable ===
        true ||
      state.composerPacketReady ===
        true;

    mark("after composerBridge");

    // =================================================
    // 2. Resolve focused Character candidate
    //
    // This occurs before Blueprint Writer so the stage
    // knows whether a grounded local answer already exists.
    // =================================================

    mark("before characterCandidate");

    const characterCandidate =
      this.resolveCharacterCandidate(
        state
      );

    state = {
      ...state,

      characterCandidate,

      characterAnswerAvailable:
        characterCandidate
          .answerAvailable ===
        true,

      characterGuidanceAvailable:
        characterCandidate
          .guidanceAvailable ===
        true,

      characterDraftCandidate:
        characterCandidate
          .candidateAvailable ===
          true
          ? characterCandidate.text
          : null,

      characterDeterministicDraft:
        characterCandidate
          .deterministicDraft ||
        null,

      characterNeedsAIWriter:
        characterCandidate
          .needsAIWriter ===
        true,

      characterAIWriterMode:
        characterCandidate
          .aiWriterMode ||
        null,

      characterAIInstruction:
        characterCandidate
          .aiInstruction ||
        ""
    };

    if (
      characterCandidate
        .candidateAvailable ===
      true
    ) {
      state.candidateDrafts =
        addCandidateDraft(
          state.candidateDrafts,
          this.buildCharacterDraftCandidate(
            characterCandidate
          )
        );
    }

    mark("after characterCandidate");

    // =================================================
    // 3. Recalculate Blueprint eligibility
    //
    // A simple grounded local Character answer does not
    // require Blueprint Writer merely to repeat the same
    // answer. More complex plans may still use Blueprint.
    // =================================================

    const resolvedBlueprintEligibility =
      this.resolveBlueprintEligibility({
        summary: state,
        generationEligibility,
        characterCandidate
      });

    state = {
      ...state,

      resolvedBlueprintEligibility,

      shouldRunBlueprintWriter:
        resolvedBlueprintEligibility
          .runBlueprintWriter
    };

    // =================================================
    // 4. Blueprint Writer
    // =================================================

    mark("before blueprintWriter");

    const blueprintWriterResult =
      resolvedBlueprintEligibility
        .runBlueprintWriter ===
        true &&
      typeof window.AriBlueprintWriter
        ?.write ===
        "function"
        ? await window.AriBlueprintWriter
            .write({
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

            blueprintWriterDraft:
              null,

            source:
              resolvedBlueprintEligibility
                .runBlueprintWriter
                ? "not-loaded"
                : "skipped-by-expression-eligibility",

            reason:
              resolvedBlueprintEligibility
                .runBlueprintWriter
                ? "blueprint_writer_not_loaded"
                : resolvedBlueprintEligibility
                    .reason
          };

    state = {
      ...state,

      ...blueprintWriterResult,

      blueprintWriter:
        blueprintWriterResult,

      blueprintWriterDraft:
        blueprintWriterResult
          ?.draft ||
        blueprintWriterResult
          ?.blueprintWriterDraft ||
        null,

      blueprintWriterRan:
        blueprintWriterResult
          ?.blueprintWriterRan ===
        true,

      blueprintWriterSource:
        blueprintWriterResult
          ?.source ||
        blueprintWriterResult
          ?.blueprintWriterSource ||
        "unknown",

      blueprintWriterReason:
        blueprintWriterResult
          ?.reason ||
        null
    };

    const blueprintUsable =
      resolvedBlueprintEligibility
        .runBlueprintWriter ===
        true &&
      isUsableBlueprintDraft(
        state.blueprintWriterDraft,
        state
      );

    state.blueprintWriterDraftUsable =
      blueprintUsable;

    if (blueprintUsable) {
      state.candidateDrafts =
        addCandidateDraft(
          state.candidateDrafts,
          this.buildBlueprintCandidate(
            state
          )
        );
    }

    mark("after blueprintWriter");

    // =================================================
    // 5. AI Writer preparation
    //
    // The AI Writer itself belongs to Draft Arbitration.
    // This stage only prepares the request and policy.
    // =================================================

    mark("before aiWriterPreparation");

    const aiWriterPreparation =
      this.buildAIWriterPreparation({
        summary: state,
        characterCandidate,
        blueprintUsable
      });

    state = {
      ...state,

      aiWriterPreparation,

      prepareAIWriter:
        aiWriterPreparation.allowed,

      shouldRunAIWriter:
        aiWriterPreparation.required,

      needsAIWriter:
        aiWriterPreparation.required,

      aiWriterMode:
        aiWriterPreparation.mode,

      aiWriterInstruction:
        aiWriterPreparation.instruction,

      aiRepairReason:
        aiWriterPreparation.reason
    };

    state.composerPacket = {
      ...state.composerPacket,

      candidateDrafts:
        this.toArray(
          state.candidateDrafts
        ),

      draftGeneration: {
        characterCandidate,
        blueprint: {
          eligible:
            resolvedBlueprintEligibility
              .runBlueprintWriter ===
            true,

          ran:
            state.blueprintWriterRan ===
            true,

          usable:
            blueprintUsable,

          draft:
            state.blueprintWriterDraft ||
            null,

          reason:
            state.blueprintWriterReason ||
            resolvedBlueprintEligibility
              .reason ||
            null
        },

        aiWriterPreparation
      },

      characterCandidate,

      characterDraftCandidate:
        characterCandidate
          .candidateAvailable ===
          true
          ? characterCandidate.text
          : null,

      characterNeedsAIWriter:
        characterCandidate
          .needsAIWriter ===
        true,

      characterAIWriterMode:
        characterCandidate
          .aiWriterMode ||
        null,

      characterAIInstruction:
        characterCandidate
          .aiInstruction ||
        ""
    };

    mark("after aiWriterPreparation");

    // =================================================
    // 6. Draft Generation Stage Packet
    // =================================================

    state.draftGenerationStagePacket =
      this.buildDraftGenerationStagePacket(
        state
      );

    state.draftGenerationStageRan =
      true;

    state.draftGenerationStageSource =
      this.source;

    state.draftGenerationStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Generation eligibility
  // ===================================================

  resolveGenerationEligibility(
    summary = {}
  ) {
    const developerLocked =
      summary.developerResponseLocked ===
      true;

    const responseLocked =
      summary.responseLocked ===
      true;

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

    const prepareAIWriter =
      !developerLocked &&
      !responseLocked &&
      !hasFinalResponse;

    return {
      buildComposerPacket,
      runBlueprintWriter,
      prepareAIWriter,

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
  // Blueprint eligibility
  // ===================================================

  resolveBlueprintEligibility({
    summary = {},
    generationEligibility = {},
    characterCandidate = {}
  } = {}) {
    if (
      generationEligibility
        .runBlueprintWriter !==
      true
    ) {
      return {
        runBlueprintWriter:
          false,

        source:
          "ari-draft-generation-blueprint-eligibility",

        reason:
          generationEligibility.reason ||
          "blueprint_generation_not_allowed"
      };
    }

    const packet =
      summary.composerPacket ||
      {};

    const responseMoves =
      this.toArray(
        packet.responseMoves ||
        packet.responseControl
          ?.responseMoves
      );

    const requiredMoves =
      responseMoves.filter(
        move =>
          move?.required !==
          false &&
          move?.userFacing !==
          false
      );

    const characterLocalPreferred =
      characterCandidate
        .candidateAvailable ===
        true &&
      characterCandidate
        .candidatePreferred ===
        true &&
      characterCandidate
        .needsAIWriter !==
        true;

    const simpleDirectCharacterAnswer =
      characterLocalPreferred &&
      this.isSimpleCharacterResponse({
        packet,
        characterCandidate,
        requiredMoves
      });

    if (simpleDirectCharacterAnswer) {
      return {
        runBlueprintWriter:
          false,

        source:
          "ari-draft-generation-blueprint-eligibility",

        reason:
          "grounded_character_candidate_satisfies_simple_response"
      };
    }

    return {
      runBlueprintWriter:
        true,

      source:
        "ari-draft-generation-blueprint-eligibility",

      reason:
        characterCandidate
          .candidateAvailable ===
          true
          ? "blueprint_may_integrate_character_with_response_plan"
          : "blueprint_required_for_response_plan"
    };
  },

  isSimpleCharacterResponse({
    packet = {},
    characterCandidate = {},
    requiredMoves = []
  } = {}) {
    const shape =
      this.normalizeIdentifier(
        packet.responseShape ||
        packet.responseControl
          ?.responseShape ||
        ""
      );

    const goal =
      this.normalizeIdentifier(
        packet.responseGoal ||
        packet.responseControl
          ?.responseGoal ||
        ""
      );

    const simpleShapes = [
      "",
      "direct_answer",
      "brief_answer",
      "short_answer",
      "single_paragraph",
      "minimal_answer",
      "normal_response"
    ];

    const simpleGoals = [
      "",
      "answer_question",
      "provide_information",
      "retrieve_fact",
      "respond_directly",
      "fulfill_the_authorized_user_request"
    ];

    const tooManyMoves =
      requiredMoves.length > 2;

    const complexMove =
      requiredMoves.some(move =>
        [
          "explain",
          "compare",
          "steps",
          "recommend",
          "analyze",
          "evaluate",
          "clarify",
          "ask_question",
          "safety_instruction",
          "medical_guidance",
          "legal_guidance",
          "financial_guidance",
          "code",
          "artifact"
        ].some(term =>
          this.normalizeIdentifier(
            move?.id ||
            move?.type ||
            ""
          ).includes(term)
        )
      );

    const status =
      characterCandidate.status ||
      {};

    const supportedCharacterStatus =
      status.canonical === true ||
      status.stable === true ||
      status.inferred === true ||
      status.open === true;

    return (
      characterCandidate.grounded ===
        true &&
      supportedCharacterStatus &&
      simpleShapes.includes(shape) &&
      simpleGoals.includes(goal) &&
      !tooManyMoves &&
      !complexMove
    );
  },

  // ===================================================
  // Character candidate resolution
  // ===================================================

  resolveCharacterCandidate(
    summary = {}
  ) {
    const packet =
      summary.composerPacket ||
      {};

    const packetCharacterContext =
      packet.characterContext ||
      {};

    const character =
      packet.composerCharacter ||
      packet.character ||
      summary.composerCharacter ||
      summary.characterHandoff
        ?.composerCharacter ||
      null;

    const handoff =
      packet.characterHandoff ||
      summary.characterHandoff ||
      null;

    const reasoning =
      summary.characterReasoning ||
      handoff?.reasoning ||
      packetCharacterContext
        ?.reasoning ||
      null;

    const policy =
      packet.candidatePolicy
        ?.character ||
      {};

    const realization =
      packet.characterRealization ||
      character?.realization ||
      handoff?.realization ||
      reasoning?.realizationPolicy ||
      {};

    const grounding =
      packet.characterGrounding ||
      character?.grounding ||
      handoff?.grounding ||
      packetCharacterContext
        ?.grounding ||
      null;

    const status =
      packet.characterStatus ||
      character?.status ||
      handoff?.status ||
      this.buildCharacterStatus(
        reasoning
      );

    const draft =
      String(
        packet.characterDraft ||
        character?.draft ||
        handoff?.draft ||
        reasoning?.userFacingDraft ||
        ""
      ).trim();

    const deterministicDraft =
      String(
        packet
          .characterDeterministicDraft ||
        character
          ?.deterministicDraft ||
        handoff
          ?.deterministicDraft ||
        reasoning
          ?.deterministicDraft ||
        draft
      ).trim();

    const answerAvailable =
      packet
        .characterAnswerAvailable ===
        true ||
      character?.answerAvailable ===
        true ||
      handoff?.answerAvailable ===
        true ||
      reasoning
        ?.characterAnswerAvailable ===
        true;

    const guidanceAvailable =
      packet
        .characterGuidanceAvailable ===
        true ||
      character
        ?.guidanceAvailable ===
        true ||
      handoff
        ?.guidanceAvailable ===
        true ||
      reasoning
        ?.characterGuidanceAvailable ===
        true;

    const grounded =
      grounding?.grounded ===
        true ||
      (
        answerAvailable &&
        Boolean(
          reasoning?.groundedMeaning ||
          reasoning?.authorityPacket
        )
      );

    const candidateAllowed =
      policy.candidateAllowed ===
        true ||
      (
        answerAvailable &&
        grounded &&
        Boolean(
          deterministicDraft
        )
      );

    const needsAIWriter =
      policy.aiRealizationRequired ===
        true ||
      realization.needsAIWriter ===
        true ||
      handoff?.needsAIWriter ===
        true ||
      reasoning?.needsAIWriter ===
        true;

    const candidatePreferred =
      policy.candidatePreferred ===
        true ||
      (
        candidateAllowed &&
        needsAIWriter !== true
      );

    const source =
      character?.preferredSource ||
      handoff
        ?.preferredCharacterSource ||
      reasoning?.source ||
      null;

    return {
      available:
        Boolean(
          character ||
          handoff ||
          reasoning
        ),

      answerAvailable,
      guidanceAvailable,

      candidateAvailable:
        candidateAllowed,

      candidateAllowed,
      candidatePreferred,

      grounded,

      text:
        deterministicDraft ||
        draft,

      draft,
      deterministicDraft,

      mode:
        packet.characterMode ||
        character?.mode ||
        handoff?.mode ||
        reasoning?.request?.mode ||
        "silent",

      type:
        packet.characterType ||
        character?.type ||
        handoff?.type ||
        reasoning?.type ||
        null,

      subtype:
        packet.characterSubtype ||
        character?.subtype ||
        handoff?.subtype ||
        reasoning?.subtype ||
        null,

      focus:
        character?.focus ||
        handoff?.focus ||
        reasoning?.focus ||
        null,

      subject:
        character?.subject ||
        handoff?.subject ||
        reasoning?.subject ||
        null,

      status,
      grounding,
      realization,

      answer:
        character?.answer ||
        handoff?.answer ||
        reasoning?.answer ||
        null,

      groundedMeaning:
        character
          ?.groundedMeaning ||
        handoff
          ?.groundedMeaning ||
        reasoning
          ?.groundedMeaning ||
        null,

      needsAIWriter,

      aiWriterMode:
        policy.aiWriterMode ||
        realization.aiWriterMode ||
        handoff?.aiWriterMode ||
        reasoning?.aiWriterMode ||
        null,

      aiInstruction:
        policy.aiInstruction ||
        realization.aiInstruction ||
        handoff?.aiInstruction ||
        reasoning?.aiInstruction ||
        "",

      preserveMeaning:
        realization
          .preserveMeaning !==
        false,

      preserveStatus:
        realization
          .preserveStatus !==
        false,

      preserveValue:
        policy.preserveValue ===
          true ||
        realization.preserveValue ===
          true,

      preservePosition:
        policy.preservePosition ===
          true ||
        realization.preservePosition ===
          true,

      preserveOpenStatus:
        policy.preserveOpenStatus ===
          true ||
        realization
          .preserveOpenStatus ===
          true,

      tentativeLanguageRequired:
        policy
          .tentativeLanguageRequired ===
          true ||
        realization
          .tentativeLanguageRequired ===
          true,

      implementationDisclosure:
        packet
          .characterImplementationDisclosure ||
        character
          ?.implementationDisclosure ||
        handoff
          ?.implementationDisclosure ||
        null,

      relationship:
        packet
          .characterRelationship ||
        character?.relationship ||
        handoff?.relationship ||
        null,

      authorityChain:
        this.toArray(
          packet
            .characterAuthorityChain ||
          character
            ?.authorityChain ||
          handoff
            ?.authorityChain ||
          reasoning
            ?.authorityChain
        ),

      authorityPacket:
        packet
          .characterAuthorityPacket ||
        character
          ?.authorityPacket ||
        handoff
          ?.authorityPacket ||
        reasoning
          ?.authorityPacket ||
        null,

      source,

      responseControl:
        character?.responseControl ||
        {
          requiredBehaviors:
            handoff
              ?.requiredBehaviors ||
            [],

          forbiddenBehaviors:
            handoff
              ?.forbiddenBehaviors ||
            [],

          constraints:
            handoff?.constraints ||
            []
        }
    };
  },

  buildCharacterDraftCandidate(
    character = {}
  ) {
    const status =
      character.status ||
      {};

    const canonical =
      status.canonical === true ||
      status.preferenceStatus ===
        "canonical";

    const inferred =
      status.inferred === true ||
      status.preferenceStatus ===
        "inferred";

    const open =
      status.open === true ||
      status.preferenceStatus ===
        "open";

    const priority =
      canonical
        ? 95
        : character.type ===
            "character_identity"
          ? 94
          : character.type ===
              "character_worldview"
            ? 92
            : inferred
              ? 90
              : open
                ? 88
                : 86;

    return {
      id:
        this.createCandidateId(
          "character"
        ),

      source:
        "character_reasoning",

      sourceDetail:
        character.source ||
        "local_character_authority",

      text:
        character.text,

      priority,

      usable:
        true,

      grounded:
        character.grounded ===
        true,

      preferred:
        character
          .candidatePreferred ===
        true,

      candidateType:
        "grounded_character_candidate",

      characterType:
        character.type,

      characterSubtype:
        character.subtype,

      characterMode:
        character.mode,

      characterFocus:
        character.focus,

      characterSubject:
        character.subject,

      characterStatus:
        character.status,

      characterGrounding:
        character.grounding,

      characterRealization:
        character.realization,

      characterAuthorityChain:
        character.authorityChain,

      characterAuthorityPacket:
        character.authorityPacket,

      needsAIWriter:
        character.needsAIWriter ===
        true,

      aiWriterMode:
        character.aiWriterMode,

      aiInstruction:
        character.aiInstruction,

      preservation: {
        meaning:
          character
            .preserveMeaning !==
          false,

        status:
          character
            .preserveStatus !==
          false,

        value:
          character
            .preserveValue ===
          true,

        position:
          character
            .preservePosition ===
          true,

        openStatus:
          character
            .preserveOpenStatus ===
          true,

        tentativeLanguage:
          character
            .tentativeLanguageRequired ===
          true
      },

      restrictions: {
        mayAddFacts:
          false,

        mayAddMeaning:
          false,

        mayInventPreference:
          false,

        mayInventWorldview:
          false,

        mayInventExperience:
          false,

        mayPromoteToCanonical:
          false,

        mayModifyCharacterAuthority:
          false
      },

      evidence: {
        characterAnswerAvailable:
          character
            .answerAvailable ===
          true,

        deterministicDraftAvailable:
          Boolean(
            character
              .deterministicDraft
          ),

        grounded:
          character.grounded ===
          true,

        source:
          character.source,

        answer:
          character.answer,

        groundedMeaning:
          character
            .groundedMeaning,

        implementationDisclosure:
          character
            .implementationDisclosure,

        relationship:
          character.relationship
      }
    };
  },

  // ===================================================
  // Blueprint candidate
  // ===================================================

  buildBlueprintCandidate(
    summary = {}
  ) {
    const result =
      summary.blueprintWriter ||
      {};

    return {
      id:
        this.createCandidateId(
          "blueprint"
        ),

      source:
        "blueprint_writer",

      text:
        summary
          .blueprintWriterDraft,

      priority:
        60,

      usable:
        true,

      grounded:
        Boolean(
          summary.composerPacketReady
        ),

      preferred:
        false,

      candidateType:
        "deterministic_blueprint_candidate",

      needsAIWriter:
        false,

      evidence: {
        writerRan:
          summary
            .blueprintWriterRan ===
          true,

        composerPacketReady:
          summary
            .composerPacketReady ===
          true,

        responsePlanReady:
          summary.composerPacket
            ?.responsePlanReady ===
          true,

        responseMoves:
          summary.composerPacket
            ?.responseMoves ||
          [],

        blueprint:
          result.blueprint ||
          summary.blueprint ||
          null
      }
    };
  },

  // ===================================================
  // AI Writer preparation
  // ===================================================

  buildAIWriterPreparation({
    summary = {},
    characterCandidate = {},
    blueprintUsable = false
  } = {}) {
    const eligibility =
      summary.generationEligibility ||
      {};

    if (
      eligibility.prepareAIWriter !==
      true
    ) {
      return {
        allowed:
          false,

        required:
          false,

        mode:
          null,

        instruction:
          "",

        reason:
          eligibility.reason ||
          "ai_writer_not_allowed",

        source:
          "ari-draft-generation-ai-writer-preparation"
      };
    }

    const candidates =
      this.toArray(
        summary.candidateDrafts
      );

    const usableCandidates =
      candidates.filter(
        candidate =>
          candidate?.usable !==
            false &&
          this.isUsableDraft(
            candidate?.text
          )
      );

    const characterRequiresAI =
      characterCandidate
        .candidateAvailable ===
        true &&
      characterCandidate
        .needsAIWriter ===
        true;

    if (characterRequiresAI) {
      return {
        allowed:
          true,

        required:
          true,

        mode:
          characterCandidate
            .aiWriterMode ||
          "character_natural_realization",

        instruction:
          characterCandidate
            .aiInstruction ||
          "",

        reason:
          "character_authority_requested_ai_realization",

        source:
          "ari-draft-generation-ai-writer-preparation",

        preserveCharacterMeaning:
          true,

        preserveCharacterStatus:
          true,

        preserveCharacterValue:
          characterCandidate
            .preserveValue ===
          true,

        preserveWorldviewPosition:
          characterCandidate
            .preservePosition ===
          true,

        preserveOpenStatus:
          characterCandidate
            .preserveOpenStatus ===
          true,

        tentativeLanguageRequired:
          characterCandidate
            .tentativeLanguageRequired ===
          true,

        characterGrounding:
          characterCandidate
            .grounding,

        characterAuthorityPacket:
          characterCandidate
            .authorityPacket
      };
    }

    if (
      characterCandidate
        .candidatePreferred ===
        true &&
      characterCandidate
        .candidateAvailable ===
        true
    ) {
      return {
        allowed:
          true,

        required:
          false,

        mode:
          null,

        instruction:
          "",

        reason:
          "grounded_local_character_candidate_preferred",

        source:
          "ari-draft-generation-ai-writer-preparation",

        preferredCandidateSource:
          "character_reasoning"
      };
    }

    if (blueprintUsable) {
      return {
        allowed:
          true,

        required:
          false,

        mode:
          null,

        instruction:
          "",

        reason:
          "usable_blueprint_candidate_available",

        source:
          "ari-draft-generation-ai-writer-preparation",

        preferredCandidateSource:
          "blueprint_writer"
      };
    }

    if (usableCandidates.length) {
      return {
        allowed:
          true,

        required:
          false,

        mode:
          null,

        instruction:
          "",

        reason:
          "usable_initial_candidate_available",

        source:
          "ari-draft-generation-ai-writer-preparation"
      };
    }

    return {
      allowed:
        true,

      required:
        true,

      mode:
        "response_plan_repair",

      instruction:
        "",

      reason:
        "no_usable_response_candidate",

      source:
        "ari-draft-generation-ai-writer-preparation"
    };
  },

  // ===================================================
  // Composer packet enrichment
  // ===================================================

  enrichComposerPacket(
    summary = {}
  ) {
    const packet =
      summary.composerPacket ||
      {};

    const focusedCharacter =
      packet.composerCharacter ||
      packet.character ||
      summary.composerCharacter ||
      null;

    const characterHandoff =
      packet.characterHandoff ||
      summary.characterHandoff ||
      null;

    return {
      ...packet,

      /*
       * Preserve Bridge readiness. Do not turn an invalid
       * packet into a ready packet merely by enriching it.
       */
      ready:
        packet.ready === true,

      usable:
        packet.usable === true ||
        packet.ready === true,

      perceptionPacket:
        summary.perceptionPacket ||
        packet.perceptionPacket ||
        null,

      executivePacket:
        summary.executivePacket ||
        packet.executivePacket ||
        null,

      deliberationPacket:
        summary.deliberationPacket ||
        packet.deliberationPacket ||
        null,

      responseStrategy:
        packet.responseStrategy ||
        summary.responseStrategy ||
        null,

      meaningInterpretation:
        summary
          .meaningInterpretation ||
        packet
          .meaningInterpretation ||
        null,

      humanState:
        summary.humanState ||
        packet.humanState ||
        null,

      /*
       * Preserve the canonical plan chosen by Composer Bridge.
       */
      responsePlan:
        packet.responsePlan ||
        packet.canonicalResponsePlan ||
        summary.ariResponsePlan ||
        summary
          .understandingResponsePlan ||
        summary.responsePlan ||
        null,

      canonicalResponsePlan:
        packet.canonicalResponsePlan ||
        packet.responsePlan ||
        null,

      /*
       * Preserve only the focused Character packet.
       */
      character:
        focusedCharacter,

      composerCharacter:
        focusedCharacter,

      characterHandoff,

      characterContext:
        packet.characterContext ||
        null,

      characterDraft:
        packet.characterDraft ||
        focusedCharacter?.draft ||
        characterHandoff?.draft ||
        "",

      characterDeterministicDraft:
        packet
          .characterDeterministicDraft ||
        focusedCharacter
          ?.deterministicDraft ||
        characterHandoff
          ?.deterministicDraft ||
        "",

      characterStatus:
        packet.characterStatus ||
        focusedCharacter?.status ||
        characterHandoff?.status ||
        null,

      characterGrounding:
        packet.characterGrounding ||
        focusedCharacter
          ?.grounding ||
        characterHandoff
          ?.grounding ||
        null,

      characterRealization:
        packet.characterRealization ||
        focusedCharacter
          ?.realization ||
        characterHandoff
          ?.realization ||
        null,

      languageGuidance:
        summary
          .languageGuidanceHandoff ||
        packet.languageGuidance ||
        null,

      safety: {
        ...(packet.safety || {}),

        earlyGate:
          summary
            .safetyContextGate ||
          packet.safety
            ?.earlyGate ||
          packet.safety?.gate ||
          null,

        deepReview:
          summary.deepSafetyResult ||
          packet.safety
            ?.deepReview ||
          null,

        disposition:
          summary
            .safetyDisposition ||
          packet.safety
            ?.disposition ||
          null
      },

      memory: {
        ...(packet.memory || {}),

        retrieval:
          summary.memoryRetrieval ||
          packet.memory
            ?.retrieval ||
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
        packet.developerPacket ||
        summary
          .composerDeveloperPacket ||
        null,

      hasDeveloperPacket:
        packet.hasDeveloperPacket ===
          true ||
        summary
          .composerDeveloperPacket
          ?.enabled ===
          true,

      expressionPlan:
        summary.expressionPlan ||
        packet.expressionPlan ||
        null,

      blueprintHint:
        packet.blueprintHint ||
        summary.blueprintHint ||
        null,

      communicationPlan:
        packet.communicationPlan ||
        summary.communicationPlan ||
        null,

      composerDirective:
        packet.composerDirective ||
        summary.composerDirective ||
        null,

      responseRules:
        this.mergeUnique(
          packet.responseRules,
          summary.responseRules
        ),

      responseConstraints:
        this.mergeUnique(
          packet
            .responseConstraints,
          summary
            .responseConstraints
        ),

      responseRequired:
        this.mergeUnique(
          packet.responseRequired,
          packet.requiredBehaviors,
          summary.responseRequired
        ),

      responseAvoid:
        this.mergeUnique(
          packet.responseAvoid,
          packet.forbiddenBehaviors,
          summary.responseAvoid
        ),

      candidateDrafts:
        this.toArray(
          summary.candidateDrafts ||
          packet.candidateDrafts
        )
    };
  },

  buildFallbackComposerPacket(
    summary = {}
  ) {
    const userQuestion =
      summary.resolvedUserQuestion ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    return {
      schema:
        "ari_composer_packet_fallback",

      schemaVersion:
        this.schemaVersion,

      ready:
        false,

      usable:
        false,

      source:
        "ari-draft-generation-stage-fallback",

      userQuestion,

      originalUserQuestion:
        userQuestion,

      currentTurnText:
        userQuestion,

      responsePlan:
        null,

      responsePlanReady:
        false,

      character:
        summary.composerCharacter ||
        null,

      composerCharacter:
        summary.composerCharacter ||
        null,

      characterHandoff:
        summary.characterHandoff ||
        null,

      candidateDrafts:
        this.toArray(
          summary.candidateDrafts
        ),

      validation: {
        valid:
          false,

        errors: [
          {
            type:
              "composer_packet_unavailable"
          }
        ],

        warnings:
          []
      }
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildDraftGenerationStagePacket(
    summary = {}
  ) {
    const candidates =
      this.toArray(
        summary.candidateDrafts
      );

    const usableCandidates =
      candidates.filter(
        candidate =>
          candidate?.usable !==
            false &&
          this.isUsableDraft(
            candidate?.text
          )
      );

    const characterCandidate =
      summary.characterCandidate ||
      {};

    const aiWriterPreparation =
      summary.aiWriterPreparation ||
      {};

    return {
      ready:
        summary.composerPacketReady ===
          true ||
        usableCandidates.length >
          0,

      source:
        this.source,

      version:
        this.version,

      authorityLevel:
        this.authorityLevel,

      eligibility:
        summary.generationEligibility ||
        null,

      composerBridge: {
        ran:
          summary.composerBridgeRan ===
          true,

        source:
          summary.composerBridgeSource ||
          null,

        ready:
          summary.composerPacketReady ===
          true,

        usable:
          summary.composerPacketUsable ===
          true,

        packet:
          summary.composerPacket ||
          null
      },

      characterCandidate: {
        available:
          characterCandidate.available ===
          true,

        answerAvailable:
          characterCandidate
            .answerAvailable ===
          true,

        guidanceAvailable:
          characterCandidate
            .guidanceAvailable ===
          true,

        candidateAvailable:
          characterCandidate
            .candidateAvailable ===
          true,

        preferred:
          characterCandidate
            .candidatePreferred ===
          true,

        grounded:
          characterCandidate.grounded ===
          true,

        type:
          characterCandidate.type ||
          null,

        subtype:
          characterCandidate.subtype ||
          null,

        mode:
          characterCandidate.mode ||
          "silent",

        status:
          characterCandidate.status ||
          null,

        focus:
          characterCandidate.focus ||
          null,

        subject:
          characterCandidate.subject ||
          null,

        draft:
          characterCandidate.draft ||
          null,

        deterministicDraft:
          characterCandidate
            .deterministicDraft ||
          null,

        grounding:
          characterCandidate
            .grounding ||
          null,

        needsAIWriter:
          characterCandidate
            .needsAIWriter ===
          true,

        aiWriterMode:
          characterCandidate
            .aiWriterMode ||
          null,

        authorityChain:
          characterCandidate
            .authorityChain ||
          []
      },

      blueprintWriter: {
        eligible:
          summary
            .resolvedBlueprintEligibility
            ?.runBlueprintWriter ===
          true,

        ran:
          summary.blueprintWriterRan ===
          true,

        source:
          summary
            .blueprintWriterSource ||
          null,

        usable:
          summary
            .blueprintWriterDraftUsable ===
          true,

        draft:
          summary.blueprintWriterDraft ||
          null,

        reason:
          summary.blueprintWriterReason ||
          summary
            .resolvedBlueprintEligibility
            ?.reason ||
          null,

        raw:
          summary.blueprintWriter ||
          null
      },

      aiWriterPreparation: {
        allowed:
          aiWriterPreparation.allowed ===
          true,

        required:
          aiWriterPreparation.required ===
          true,

        mode:
          aiWriterPreparation.mode ||
          null,

        instruction:
          aiWriterPreparation
            .instruction ||
          "",

        reason:
          aiWriterPreparation.reason ||
          null,

        preserveCharacterMeaning:
          aiWriterPreparation
            .preserveCharacterMeaning ===
          true,

        preserveCharacterStatus:
          aiWriterPreparation
            .preserveCharacterStatus ===
          true,

        preserveCharacterValue:
          aiWriterPreparation
            .preserveCharacterValue ===
          true,

        preserveWorldviewPosition:
          aiWriterPreparation
            .preserveWorldviewPosition ===
          true,

        preserveOpenStatus:
          aiWriterPreparation
            .preserveOpenStatus ===
          true,

        tentativeLanguageRequired:
          aiWriterPreparation
            .tentativeLanguageRequired ===
          true
      },

      candidates,

      candidateSummary: {
        total:
          candidates.length,

        usable:
          usableCandidates.length,

        character:
          candidates.filter(
            candidate =>
              candidate.source ===
              "character_reasoning"
          ).length,

        blueprint:
          candidates.filter(
            candidate =>
              candidate.source ===
              "blueprint_writer"
          ).length,

        hasGroundedCharacterCandidate:
          candidates.some(
            candidate =>
              candidate.source ===
                "character_reasoning" &&
              candidate.grounded ===
                true
          ),

        hasPreferredCandidate:
          candidates.some(
            candidate =>
              candidate.preferred ===
              true
          )
      },

      responseControl: {
        responseLocked:
          summary.responseLocked ===
          true,

        developerResponseLocked:
          summary
            .developerResponseLocked ===
          true,

        finalResponseAvailable:
          Boolean(
            String(
              summary.finalResponse ||
              ""
            ).trim()
          ),

        composerPacketReady:
          summary.composerPacketReady ===
          true,

        usableCandidateAvailable:
          usableCandidates.length >
          0,

        aiWriterRequired:
          aiWriterPreparation.required ===
          true
      },

      quality: {
        characterStatusPreserved:
          characterCandidate.status
            ? true
            : characterCandidate
                .candidateAvailable !==
              true,

        characterGroundingPreserved:
          characterCandidate
            .candidateAvailable !==
            true ||
          characterCandidate.grounded ===
            true,

        characterRealizationPreserved:
          characterCandidate
            .candidateAvailable !==
            true ||
          Boolean(
            characterCandidate
              .realization
          ),

        canonicalValueProtected:
          characterCandidate.status
            ?.canonical !==
            true ||
          characterCandidate
            .preserveValue ===
            true,

        inferredStatusProtected:
          characterCandidate.status
            ?.inferred !==
            true ||
          characterCandidate
            .tentativeLanguageRequired ===
            true,

        openStatusProtected:
          characterCandidate.status
            ?.open !==
            true ||
          characterCandidate
            .preserveOpenStatus ===
            true,

        noCharacterCollectionExpansion:
          true,

        supabaseUsed:
          false
      },

      authority:
        this.getAuthorityBoundaries()
    };
  },

  // ===================================================
  // Character status compatibility
  // ===================================================

  buildCharacterStatus(
    reasoning = {}
  ) {
    const overall =
      reasoning.status ||
      (
        reasoning
          .characterAnswerAvailable ===
        true
          ? "stable"
          : "background"
      );

    return {
      overall,

      preferenceStatus:
        reasoning.type ===
        "character_preference"
          ? overall
          : null,

      worldviewStatus:
        [
          "character_worldview",
          "character_perspective"
        ].includes(
          reasoning.type
        )
          ? overall
          : null,

      identityStatus:
        reasoning.type ===
        "character_identity"
          ? overall
          : null,

      canonical:
        overall ===
        "canonical",

      inferred:
        overall ===
        "inferred",

      open:
        overall ===
        "open",

      stable:
        overall ===
        "stable",

      background:
        overall ===
        "background"
    };
  },

  // ===================================================
  // Candidate utilities
  // ===================================================

  addCandidateDraft(
    existing = [],
    candidate = {}
  ) {
    const text =
      String(
        candidate.text ||
        ""
      ).trim();

    const list =
      this.toArray(existing);

    if (!text) {
      return list;
    }

    const normalizedText =
      this.normalize(text);

    const duplicateIndex =
      list.findIndex(existingCandidate =>
        this.normalize(
          existingCandidate?.text ||
          ""
        ) ===
        normalizedText
      );

    const normalizedCandidate = {
      ...candidate,

      text,

      usable:
        candidate.usable !==
        false,

      createdAt:
        candidate.createdAt ||
        Date.now()
    };

    if (
      duplicateIndex >=
      0
    ) {
      const duplicate =
        list[duplicateIndex];

      const keepIncoming =
        Number(
          normalizedCandidate.priority ||
          0
        ) >
        Number(
          duplicate.priority ||
          0
        );

      if (!keepIncoming) {
        return list;
      }

      return list.map(
        (
          item,
          index
        ) =>
          index ===
          duplicateIndex
            ? {
                ...duplicate,
                ...normalizedCandidate
              }
            : item
      );
    }

    return [
      ...list,
      normalizedCandidate
    ];
  },

  createCandidateId(
    prefix = "candidate"
  ) {
    return [
      prefix,
      Date.now()
        .toString(36),
      Math.random()
        .toString(36)
        .slice(2, 8)
    ].join("_");
  },

  isUsableDraft(
    draft = ""
  ) {
    const text =
      String(
        draft ||
        ""
      ).trim();

    if (!text) {
      return false;
    }

    const normalized =
      this.normalize(text);

    if (
      [
        "null",
        "undefined",
        "none",
        "n a",
        "no response"
      ].includes(normalized)
    ) {
      return false;
    }

    return text.length >=
      2;
  },

  // ===================================================
  // Authority boundaries
  // ===================================================

  getAuthorityBoundaries() {
    return {
      canBuildComposerPacket:
        true,

      canPreserveComposerPacket:
        true,

      canRegisterDraftCandidates:
        true,

      canRegisterGroundedCharacterCandidate:
        true,

      canRegisterBlueprintCandidate:
        true,

      canPrepareAIWriterInput:
        true,

      canDetermineWhetherBlueprintIsNecessary:
        true,

      canPreserveCharacterStatus:
        true,

      canPreserveCharacterGrounding:
        true,

      canPreserveCharacterRealizationPolicy:
        true,

      canResolveCharacterPreference:
        false,

      canCreateCanonicalPreference:
        false,

      canPromoteInferenceToCanonical:
        false,

      canCreateWorldviewPosition:
        false,

      canModifyCharacterAuthority:
        false,

      canExposeEntirePreferenceCollection:
        false,

      canExposeEntireWorldviewCollection:
        false,

      canCreateFallbackResponsePlan:
        false,

      canRunAIWriter:
        false,

      canSelectFinalDraft:
        false,

      canWriteFinalResponse:
        false,

      canOverrideSafety:
        false,

      canRetrieveUserMemory:
        false,

      canStoreUserMemory:
        false,

      canAccessSupabase:
        false,

      canPersistState:
        false,

      role:
        "composer_packet_and_grounded_initial_candidate_generation"
    };
  },

  // ===================================================
  // Helpers
  // ===================================================

  toArray(value) {
    if (Array.isArray(value)) {
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
        undefined ||
      value ===
        null ||
      value ===
        ""
    ) {
      return [];
    }

    return [value];
  },

  mergeUnique(...values) {
    const output = [];
    const seen =
      new Set();

    for (
      const value
      of values.flatMap(
        item =>
          this.toArray(item)
      )
    ) {
      const key =
        typeof value ===
        "string"
          ? this.normalize(value)
          : this.normalize(
              value?.id ||
              value?.name ||
              value?.type ||
              value?.value ||
              JSON.stringify(
                value
              )
            );

      if (
        !key ||
        seen.has(key)
      ) {
        continue;
      }

      seen.add(key);
      output.push(value);
    }

    return output;
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
        /[^a-z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );
  },

  normalize(value = "") {
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
        /\s+/g,
        " "
      )
      .trim();
  }
};

console.log(
  "ARI DRAFT GENERATION STAGE LOADED:",
  window.AriDraftGenerationStage
    ?.version
);