// ari/pipeline-stages/expression/ari-draft-generation-stage.js
// Ari Draft Generation Stage
//
// Purpose:
// Build the canonical Composer Packet and register authorized initial
// response candidates.
//
// V3.0.0 — Canonical Packet Preservation / Initial Candidate Registration
//
// Architectural flow:
//
// Character Stage
//      ↓
// Composer Bridge
//      ↓
// Draft Generation Stage
//      ├─ Preserve canonical Composer Packet
//      ├─ Register authorized Character candidate
//      └─ Run and register Blueprint Writer candidate
//            ↓
// Draft Arbitration Stage
//      ├─ Evaluate initial candidates
//      ├─ Decide whether AI Writer is required
//      └─ Select the final draft candidate
//
// Responsibilities:
// - Invoke Composer Bridge when expression generation is eligible.
// - Preserve the canonical Composer Packet returned by Composer Bridge.
// - Read the focused Character candidate supplied by the Composer Packet.
// - Register a Character candidate only when explicitly authorized.
// - Run Blueprint Writer when permitted by the Composer Packet.
// - Register the Blueprint Writer result with explicit status.
// - Return normalized draft-generation diagnostics.
//
// Non-responsibilities:
// - Does not resolve Character identity, preferences, values, or worldview.
// - Does not merge competing Character handoffs.
// - Does not infer Character grounding.
// - Does not decide whether a Character answer is simple or complex.
// - Does not decide whether AI Writer is needed.
// - Does not prepare an AI Writer instruction.
// - Does not run AI Writer.
// - Does not compare candidate quality.
// - Does not select the preferred candidate.
// - Does not create a fallback Response Plan.
// - Does not convert an invalid Composer Packet into a ready packet.
// - Does not write the final response.
// - Does not override safety.
// - Does not retrieve or persist memory.
// - Does not access Supabase.
// - Does not persist runtime state.

window.Ari = window.Ari || {};

window.AriDraftGenerationStage = {
  version: "3.0.0",
  schemaVersion: "3.0.0",
  source: "ari-draft-generation-stage",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      addCandidateDraft =
        (existing = [], candidate = {}) =>
          this.addCandidateDraft(
            existing,
            candidate
          )
    } = runtime;

    let state = {
      ...summary,

      activeExpressionStage:
        "draft_generation"
    };

    const eligibility =
      this.resolveGenerationEligibility(
        state
      );

    state = {
      ...state,

      draftGenerationEligibility:
        eligibility,

      shouldBuildComposerPacket:
        eligibility.buildComposerPacket,

      shouldRunBlueprintWriter:
        false
    };

    // =================================================
    // 1. Composer Bridge
    // =================================================

    mark("before composerBridge");

    const bridgeResult =
      await this.runComposerBridge({
        state,
        eligibility
      });

    const composerPacket =
      this.resolveComposerPacket({
        state,
        bridgeResult
      });

    state = {
      ...state,

      ...bridgeResult,

      composerPacket,

      composerBridgeRan:
        bridgeResult
          ?.composerBridgeRan ===
          true,

      composerBridgeSource:
        bridgeResult
          ?.composerBridgeSource ||
        bridgeResult?.source ||
        (
          eligibility
            .buildComposerPacket
            ? "unknown"
            : "skipped-by-expression-eligibility"
        ),

      composerPacketReady:
        composerPacket?.ready ===
        true,

      composerPacketUsable:
        composerPacket?.usable ===
          true ||
        composerPacket?.ready ===
          true
    };

    mark("after composerBridge");

    // =================================================
    // 2. Focused Character Candidate
    // =================================================

    mark("before characterCandidate");

    const characterCandidate =
      this.readAuthorizedCharacterCandidate(
        state.composerPacket
      );

    state = {
      ...state,

      characterCandidate,

      characterAnswerAvailable:
        characterCandidate
          .answerAvailable ===
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
          this.buildCharacterCandidate(
            characterCandidate,
            state
          )
        );
    }

    mark("after characterCandidate");

    // =================================================
    // 3. Blueprint Writer Eligibility
    // =================================================

    const blueprintEligibility =
      this.resolveBlueprintEligibility({
        state,
        eligibility
      });

    state = {
      ...state,

      blueprintEligibility,

      shouldRunBlueprintWriter:
        blueprintEligibility
          .runBlueprintWriter ===
        true
    };

    // =================================================
    // 4. Blueprint Writer
    // =================================================

    mark("before blueprintWriter");

    const blueprintWriterResult =
      await this.runBlueprintWriter({
        state,
        eligibility:
          blueprintEligibility
      });

    const normalizedBlueprint =
      this.normalizeBlueprintResult(
        blueprintWriterResult
      );

    state = {
      ...state,

      ...blueprintWriterResult,

      blueprintWriter:
        blueprintWriterResult,

      blueprintWriterDraft:
        normalizedBlueprint.draft,

      blueprintWriterRan:
        normalizedBlueprint.ran,

      blueprintWriterSource:
        normalizedBlueprint.source,

      blueprintWriterReason:
        normalizedBlueprint.reason,

      blueprintWriterUsable:
        normalizedBlueprint.usable,

      blueprintWriterComplete:
        normalizedBlueprint.complete,

      blueprintWriterRequiresAIRepair:
        normalizedBlueprint
          .requiresAIRepair,

      blueprintWriterValidation:
        normalizedBlueprint.validation,

      blueprintWriterDraftUsable:
        normalizedBlueprint.usable
    };

    if (
      normalizedBlueprint
        .candidateAvailable ===
      true
    ) {
      state.candidateDrafts =
        addCandidateDraft(
          state.candidateDrafts,
          this.buildBlueprintCandidate({
            state,
            normalizedBlueprint
          })
        );
    }

    mark("after blueprintWriter");

    // =================================================
    // 5. Draft Generation Handoff
    // =================================================

    const draftGenerationHandoff =
      this.buildDraftGenerationHandoff(
        state
      );

    state = {
      ...state,

      draftGenerationHandoff,

      composerPacket:
        this.attachDraftGenerationHandoff({
          packet:
            state.composerPacket,

          state,

          handoff:
            draftGenerationHandoff
        })
    };

    // =================================================
    // 6. Stage Packet
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

  /* =====================================================
     GENERATION ELIGIBILITY
  ===================================================== */

  resolveGenerationEligibility(
    summary = {}
  ) {
    const developerLocked =
      summary
        .developerResponseLocked ===
      true;

    const responseLocked =
      summary.responseLocked ===
      true;

    const existingFinalResponse =
      this.cleanText(
        summary.finalResponse
      );

    const hasFinalResponse =
      Boolean(
        existingFinalResponse
      );

    const generationBlocked =
      developerLocked ||
      responseLocked ||
      hasFinalResponse;

    return {
      buildComposerPacket:
        !developerLocked,

      allowInitialCandidates:
        !generationBlocked,

      developerLocked,

      responseLocked,

      hasFinalResponse,

      source:
        "ari-draft-generation-stage-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : responseLocked
            ? "response_locked"
            : hasFinalResponse
              ? "final_response_already_available"
              : "initial_draft_generation_allowed"
    };
  },

  /* =====================================================
     COMPOSER BRIDGE
  ===================================================== */

  async runComposerBridge({
    state = {},
    eligibility = {}
  } = {}) {
    if (
      eligibility
        .buildComposerPacket !==
      true
    ) {
      return {
        composerBridgeRan:
          false,

        composerBridgeSource:
          "skipped-by-expression-eligibility",

        composerPacket:
          state.composerPacket ||
          null,

        reason:
          eligibility.reason ||
          "composer_bridge_not_required"
      };
    }

    const bridge =
      window.AriComposerBridge;

    if (
      !bridge ||
      typeof bridge.build !==
        "function"
    ) {
      return {
        composerBridgeRan:
          false,

        composerBridgeSource:
          "not-loaded",

        composerPacket:
          state.composerPacket ||
          null,

        reason:
          "composer_bridge_not_loaded"
      };
    }

    try {
      const result =
        await bridge.build(
          state
        );

      return {
        ...(result || {}),

        composerBridgeRan:
          result
            ?.composerBridgeRan !==
          false,

        composerBridgeSource:
          result
            ?.composerBridgeSource ||
          result?.source ||
          "ari-composer-bridge"
      };
    } catch (error) {
      console.warn(
        "Ari Composer Bridge failed during Draft Generation:",
        error
      );

      return {
        composerBridgeRan:
          false,

        composerBridgeSource:
          "ari-composer-bridge",

        composerPacket:
          state.composerPacket ||
          null,

        reason:
          "composer_bridge_failed",

        error:
          error?.message ||
          String(error)
      };
    }
  },

  resolveComposerPacket({
    state = {},
    bridgeResult = {}
  } = {}) {
    const bridgePacket =
      bridgeResult?.composerPacket;

    if (
      bridgePacket &&
      typeof bridgePacket ===
        "object"
    ) {
      return bridgePacket;
    }

    if (
      state.composerPacket &&
      typeof state.composerPacket ===
        "object"
    ) {
      return state.composerPacket;
    }

    /*
     * Draft Generation does not create a replacement or
     * fallback Composer Packet. Missing canonical input
     * remains explicitly missing.
     */
    return null;
  },

  /* =====================================================
     CHARACTER CANDIDATE
  ===================================================== */

  readAuthorizedCharacterCandidate(
    packet = {}
  ) {
    if (
      !packet ||
      typeof packet !==
        "object"
    ) {
      return this.emptyCharacterCandidate(
        "composer_packet_missing"
      );
    }

    /*
     * Character candidate resolution is intentionally narrow.
     *
     * Composer Bridge must supply one focused Character candidate
     * contract. Draft Generation must not search through multiple
     * upstream structures and reconstruct Character authority.
     */
    const source =
      packet.characterCandidate ||
      packet.draftGeneration
        ?.characterCandidate ||
      null;

    if (
      !source ||
      typeof source !==
        "object"
    ) {
      return this.emptyCharacterCandidate(
        "focused_character_candidate_missing"
      );
    }

    const deterministicDraft =
      this.cleanText(
        source.deterministicDraft ||
        source.draft ||
        source.text ||
        ""
      );

    const answerAvailable =
      source.answerAvailable ===
      true;

    const grounded =
      source.grounded ===
      true;

    const candidateAllowed =
      source.candidateAllowed ===
        true ||
      source.candidateAvailable ===
        true;

    const needsAIWriter =
      source.needsAIWriter ===
        true ||
      source.aiRealizationRequired ===
        true;

    const explicitlyUsable =
      source.usable ===
        true;

    const explicitlyComplete =
      source.complete ===
        true;

    const candidateAvailable =
      candidateAllowed &&
      answerAvailable &&
      grounded &&
      Boolean(
        deterministicDraft
      ) &&
      explicitlyUsable &&
      explicitlyComplete &&
      !needsAIWriter;

    return {
      available:
        true,

      answerAvailable,

      grounded,

      candidateAllowed,

      candidateAvailable,

      candidatePreferred:
        source.candidatePreferred ===
          true ||
        source.preferred ===
          true,

      usable:
        explicitlyUsable,

      complete:
        explicitlyComplete,

      text:
        deterministicDraft,

      draft:
        this.cleanText(
          source.draft ||
          source.text ||
          ""
        ),

      deterministicDraft,

      answer:
        source.answer ||
        null,

      groundedMeaning:
        source.groundedMeaning ||
        null,

      mode:
        source.mode ||
        "silent",

      type:
        source.type ||
        null,

      subtype:
        source.subtype ||
        null,

      focus:
        source.focus ||
        null,

      subject:
        source.subject ||
        null,

      status:
        source.status ||
        null,

      grounding:
        source.grounding ||
        null,

      realization:
        source.realization ||
        null,

      needsAIWriter,

      aiWriterMode:
        source.aiWriterMode ||
        null,

      aiInstruction:
        this.cleanText(
          source.aiInstruction ||
          ""
        ),

      source:
        source.source ||
        "focused_character_handoff",

      authorityChain:
        this.toArray(
          source.authorityChain
        ),

      authorityPacket:
        source.authorityPacket ||
        null,

      preservation:
        source.preservation ||
        {
          meaning:
            source.preserveMeaning !==
            false,

          status:
            source.preserveStatus !==
            false,

          value:
            source.preserveValue ===
            true,

          position:
            source.preservePosition ===
            true,

          openStatus:
            source.preserveOpenStatus ===
            true,

          tentativeLanguage:
            source
              .tentativeLanguageRequired ===
            true
        },

      responseControl:
        source.responseControl ||
        null,

      raw:
        source,

      reason:
        candidateAvailable
          ? "authorized_character_candidate_available"
          : needsAIWriter
            ? "character_requires_ai_realization"
            : !candidateAllowed
              ? "character_candidate_not_authorized"
              : !answerAvailable
                ? "character_answer_not_available"
                : !grounded
                  ? "character_candidate_not_grounded"
                  : !deterministicDraft
                    ? "character_deterministic_draft_missing"
                    : !explicitlyUsable
                      ? "character_candidate_not_marked_usable"
                      : !explicitlyComplete
                        ? "character_candidate_not_marked_complete"
                        : "character_candidate_unavailable"
    };
  },

  emptyCharacterCandidate(
    reason =
      "character_candidate_unavailable"
  ) {
    return {
      available:
        false,

      answerAvailable:
        false,

      grounded:
        false,

      candidateAllowed:
        false,

      candidateAvailable:
        false,

      candidatePreferred:
        false,

      usable:
        false,

      complete:
        false,

      text:
        "",

      draft:
        "",

      deterministicDraft:
        "",

      answer:
        null,

      groundedMeaning:
        null,

      mode:
        "silent",

      type:
        null,

      subtype:
        null,

      focus:
        null,

      subject:
        null,

      status:
        null,

      grounding:
        null,

      realization:
        null,

      needsAIWriter:
        false,

      aiWriterMode:
        null,

      aiInstruction:
        "",

      source:
        null,

      authorityChain:
        [],

      authorityPacket:
        null,

      preservation:
        null,

      responseControl:
        null,

      raw:
        null,

      reason
    };
  },

  buildCharacterCandidate(
    character = {},
    state = {}
  ) {
    return {
      id:
        this.createStableCandidateId({
          source:
            "character_reasoning",

          turnId:
            this.readTurnId(
              state.composerPacket
            ),

          text:
            character.text
        }),

      source:
        "character_reasoning",

      sourceDetail:
        character.source ||
        "focused_character_handoff",

      text:
        character.text,

      priority:
        this.resolveCharacterPriority(
          character
        ),

      usable:
        character.usable ===
          true &&
        character
          .candidateAvailable ===
          true,

      complete:
        character.complete ===
          true &&
        character
          .candidateAvailable ===
          true,

      requiresAIRepair:
        false,

      requiresRepair:
        false,

      grounded:
        character.grounded ===
        true,

      preferred:
        character
          .candidatePreferred ===
        true,

      taskType:
        "focused_character_response",

      candidateType:
        "grounded_character_candidate",

      validation:
        character.raw
          ?.validation ||
        null,

      evidence: {
        turnId:
          this.readTurnId(
            state.composerPacket
          ),

        sourceQuestion:
          this.readOriginalQuestion(
            state.composerPacket
          ),

        characterAnswerAvailable:
          character
            .answerAvailable ===
          true,

        characterCandidateAllowed:
          character
            .candidateAllowed ===
          true,

        characterCandidatePreferred:
          character
            .candidatePreferred ===
          true,

        grounded:
          character.grounded ===
          true,

        deterministicDraftAvailable:
          Boolean(
            character
              .deterministicDraft
          ),

        characterType:
          character.type ||
          null,

        characterSubtype:
          character.subtype ||
          null,

        characterMode:
          character.mode ||
          null,

        characterFocus:
          character.focus ||
          null,

        characterSubject:
          character.subject ||
          null,

        characterStatus:
          character.status ||
          null,

        characterGrounding:
          character.grounding ||
          null,

        characterRealization:
          character.realization ||
          null,

        characterAuthorityChain:
          character.authorityChain ||
          [],

        characterAuthorityPacket:
          character.authorityPacket ||
          null,

        preservation:
          character.preservation ||
          null,

        answer:
          character.answer ||
          null,

        groundedMeaning:
          character
            .groundedMeaning ||
          null
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

      raw:
        character.raw ||
        character
    };
  },

  resolveCharacterPriority(
    character = {}
  ) {
    const explicitPriority =
      Number(
        character.raw
          ?.priority
      );

    if (
      Number.isFinite(
        explicitPriority
      )
    ) {
      return explicitPriority;
    }

    const status =
      character.status ||
      {};

    const overallStatus =
      typeof status ===
        "string"
        ? status
        : status.overall ||
          status.preferenceStatus ||
          status.worldviewStatus ||
          status.identityStatus ||
          null;

    if (
      status.canonical ===
        true ||
      overallStatus ===
        "canonical"
    ) {
      return 90;
    }

    if (
      character.type ===
      "character_identity"
    ) {
      return 88;
    }

    if (
      character.type ===
        "character_worldview" ||
      character.type ===
        "character_perspective"
    ) {
      return 86;
    }

    if (
      status.stable ===
        true ||
      overallStatus ===
        "stable"
    ) {
      return 84;
    }

    if (
      status.inferred ===
        true ||
      overallStatus ===
        "inferred"
    ) {
      return 80;
    }

    if (
      status.open ===
        true ||
      overallStatus ===
        "open"
    ) {
      return 76;
    }

    return 72;
  },

  /* =====================================================
     BLUEPRINT ELIGIBILITY
  ===================================================== */

  resolveBlueprintEligibility({
    state = {},
    eligibility = {}
  } = {}) {
    if (
      eligibility
        .allowInitialCandidates !==
      true
    ) {
      return {
        runBlueprintWriter:
          false,

        source:
          "ari-draft-generation-blueprint-eligibility",

        reason:
          eligibility.reason ||
          "initial_candidate_generation_not_allowed"
      };
    }

    const packet =
      state.composerPacket;

    if (
      !packet ||
      typeof packet !==
        "object"
    ) {
      return {
        runBlueprintWriter:
          false,

        source:
          "ari-draft-generation-blueprint-eligibility",

        reason:
          "composer_packet_missing"
      };
    }

    if (
      packet.ready !==
      true
    ) {
      return {
        runBlueprintWriter:
          false,

        source:
          "ari-draft-generation-blueprint-eligibility",

        reason:
          "composer_packet_not_ready"
      };
    }

    if (
      packet.responsePlanReady ===
        false ||
      packet.responsePlan?.ready ===
        false ||
      packet.canonicalResponsePlan
        ?.ready ===
        false
    ) {
      return {
        runBlueprintWriter:
          false,

        source:
          "ari-draft-generation-blueprint-eligibility",

        reason:
          "canonical_response_plan_not_ready"
      };
    }

    const policy =
      packet.candidatePolicy ||
      {};

    if (
      policy.blueprintWriterAllowed ===
        false ||
      policy.blueprintAllowed ===
        false
    ) {
      return {
        runBlueprintWriter:
          false,

        source:
          "ari-draft-generation-blueprint-eligibility",

        reason:
          "blueprint_writer_disallowed_by_candidate_policy"
      };
    }

    if (
      packet.blueprintWriterRequired ===
      false ||
      packet.responsePlan
        ?.blueprint
        ?.enabled ===
        false ||
      packet
        .canonicalResponsePlan
        ?.blueprint
        ?.enabled ===
        false
    ) {
      return {
        runBlueprintWriter:
          false,

        source:
          "ari-draft-generation-blueprint-eligibility",

        reason:
          "blueprint_writer_disabled_by_response_plan"
      };
    }

    /*
     * Draft Generation does not suppress Blueprint Writer
     * because another candidate appears locally sufficient.
     *
     * Whether a Character candidate or Blueprint candidate
     * is better belongs to Candidate Arbitration.
     */
    return {
      runBlueprintWriter:
        true,

      source:
        "ari-draft-generation-blueprint-eligibility",

      reason:
        "canonical_response_plan_allows_blueprint_generation"
    };
  },

  /* =====================================================
     BLUEPRINT WRITER
  ===================================================== */

  async runBlueprintWriter({
    state = {},
    eligibility = {}
  } = {}) {
    if (
      eligibility
        .runBlueprintWriter !==
      true
    ) {
      return {
        blueprintWriterRan:
          false,

        draft:
          null,

        blueprintWriterDraft:
          null,

        source:
          "skipped-by-expression-eligibility",

        reason:
          eligibility.reason ||
          "blueprint_writer_not_required"
      };
    }

    const writer =
      window.AriBlueprintWriter;

    if (
      !writer ||
      typeof writer.write !==
        "function"
    ) {
      return {
        blueprintWriterRan:
          false,

        draft:
          null,

        blueprintWriterDraft:
          null,

        source:
          "not-loaded",

        reason:
          "blueprint_writer_not_loaded"
      };
    }

    try {
      const result =
        await writer.write({
          composerPacket:
            state.composerPacket,

          summary:
            state
        });

      return (
        result &&
        typeof result ===
          "object"
          ? result
          : {
              blueprintWriterRan:
                false,

              draft:
                null,

              source:
                "ari-blueprint-writer",

              reason:
                "blueprint_writer_returned_invalid_result"
            }
      );
    } catch (error) {
      console.warn(
        "Ari Blueprint Writer failed:",
        error
      );

      return {
        blueprintWriterRan:
          false,

        draft:
          null,

        blueprintWriterDraft:
          null,

        source:
          "ari-blueprint-writer",

        reason:
          "blueprint_writer_failed",

        error:
          error?.message ||
          String(error)
      };
    }
  },

  normalizeBlueprintResult(
    result = {}
  ) {
    const rawCandidate =
      result?.candidate &&
      typeof result.candidate ===
        "object"
        ? result.candidate
        : {};

    const draft =
      this.cleanText(
        result?.draft ||
        result?.blueprintWriterDraft ||
        rawCandidate.text ||
        ""
      );

    const requiresAIRepair =
      result
        ?.blueprintWriterRequiresAIRepair ===
        true ||
      result?.requiresAIRepair ===
        true ||
      rawCandidate
        .requiresAIRepair ===
        true ||
      rawCandidate
        .requiresRepair ===
        true;

    const explicitlyUsable =
      result
        ?.blueprintWriterUsable ===
        true ||
      result?.usable ===
        true ||
      rawCandidate.usable ===
        true;

    const explicitlyComplete =
      result
        ?.blueprintWriterComplete ===
        true ||
      result?.complete ===
        true ||
      rawCandidate.complete ===
        true ||
      result?.renderQuality
        ?.complete ===
        true;

    const validation =
      result?.validation ||
      rawCandidate.validation ||
      null;

    const validationPassed =
      validation
        ? validation.valid ===
          true
        : true;

    const usable =
      Boolean(
        draft
      ) &&
      explicitlyUsable &&
      validationPassed &&
      !requiresAIRepair;

    const complete =
      usable &&
      explicitlyComplete;

    return {
      ran:
        result
          ?.blueprintWriterRan ===
          true,

      draft,

      candidateAvailable:
        Boolean(
          draft
        ),

      usable,

      complete,

      requiresAIRepair,

      source:
        result
          ?.blueprintWriterSource ||
        result?.source ||
        "ari-blueprint-writer",

      reason:
        result
          ?.blueprintWriterReason ||
        result?.reason ||
        null,

      validation,

      candidate:
        rawCandidate,

      renderedMoves:
        this.toArray(
          result
            ?.renderedResponseMoves ||
          result?.renderedMoves
        ),

      unsupportedMoves:
        this.toArray(
          result
            ?.unsupportedResponseMoves ||
          result?.unsupportedMoves
        ),

      skippedMoves:
        this.toArray(
          result
            ?.skippedResponseMoves ||
          result?.skippedMoves
        ),

      renderQuality:
        result?.renderQuality ||
        null,

      renderWarnings:
        this.toArray(
          result?.renderWarnings ||
          result?.warnings
        ),

      blueprint:
        result?.blueprint ||
        null,

      raw:
        result
    };
  },

  buildBlueprintCandidate({
    state = {},
    normalizedBlueprint = {}
  } = {}) {
    const candidate =
      normalizedBlueprint
        .candidate ||
      {};

    return {
      ...candidate,

      id:
        candidate.id ||
        this.createStableCandidateId({
          source:
            "blueprint_writer",

          turnId:
            this.readTurnId(
              state.composerPacket
            ),

          text:
            normalizedBlueprint
              .draft
        }),

      source:
        "blueprint_writer",

      text:
        normalizedBlueprint.draft,

      priority:
        Number.isFinite(
          Number(
            candidate.priority
          )
        )
          ? Number(
              candidate.priority
            )
          : 70,

      usable:
        normalizedBlueprint
          .usable ===
        true,

      complete:
        normalizedBlueprint
          .complete ===
        true,

      requiresAIRepair:
        normalizedBlueprint
          .requiresAIRepair ===
        true,

      requiresRepair:
        normalizedBlueprint
          .requiresAIRepair ===
        true,

      grounded:
        state.composerPacketReady ===
        true,

      preferred:
        candidate.preferred ===
        true,

      taskType:
        "canonical_response_plan",

      candidateType:
        "deterministic_blueprint_candidate",

      validation:
        normalizedBlueprint
          .validation,

      evidence: {
        ...(candidate.evidence || {}),

        turnId:
          this.readTurnId(
            state.composerPacket
          ),

        sourceQuestion:
          this.readOriginalQuestion(
            state.composerPacket
          ),

        writerRan:
          normalizedBlueprint.ran,

        composerPacketReady:
          state.composerPacketReady ===
          true,

        responsePlanReady:
          state.composerPacket
            ?.responsePlanReady !==
          false,

        canonicalResponsePlanUsed:
          candidate.evidence
            ?.canonicalResponsePlanUsed ===
            true ||
          normalizedBlueprint.raw
            ?.canonicalResponsePlanUsed ===
            true ||
          normalizedBlueprint
            .blueprint
            ?.canonicalResponsePlanUsed ===
            true,

        blueprintWriterUsable:
          normalizedBlueprint.usable,

        blueprintWriterComplete:
          normalizedBlueprint.complete,

        blueprintWriterRequiresAIRepair:
          normalizedBlueprint
            .requiresAIRepair,

        renderedResponseMoves:
          normalizedBlueprint
            .renderedMoves,

        unsupportedResponseMoves:
          normalizedBlueprint
            .unsupportedMoves,

        skippedResponseMoves:
          normalizedBlueprint
            .skippedMoves,

        renderQuality:
          normalizedBlueprint
            .renderQuality,

        renderWarnings:
          normalizedBlueprint
            .renderWarnings,

        blueprint:
          normalizedBlueprint
            .blueprint,

        blueprintReason:
          normalizedBlueprint
            .reason
      },

      raw:
        normalizedBlueprint.raw
    };
  },

  /* =====================================================
     DRAFT GENERATION HANDOFF
  ===================================================== */

  buildDraftGenerationHandoff(
    summary = {}
  ) {
    const candidates =
      this.toArray(
        summary.candidateDrafts
      );

    const candidateSummary =
      this.summarizeCandidates(
        candidates
      );

    return {
      ready:
        summary.composerPacketReady ===
          true ||
        candidateSummary.total >
          0,

      source:
        this.source,

      version:
        this.version,

      composerPacket: {
        available:
          Boolean(
            summary.composerPacket
          ),

        ready:
          summary.composerPacketReady ===
          true,

        usable:
          summary.composerPacketUsable ===
          true,

        source:
          summary.composerBridgeSource ||
          null
      },

      characterCandidate:
        summary.characterCandidate ||
        null,

      blueprintWriter: {
        eligible:
          summary.blueprintEligibility
            ?.runBlueprintWriter ===
          true,

        ran:
          summary.blueprintWriterRan ===
          true,

        source:
          summary.blueprintWriterSource ||
          null,

        draft:
          summary.blueprintWriterDraft ||
          null,

        usable:
          summary.blueprintWriterUsable ===
          true,

        complete:
          summary.blueprintWriterComplete ===
          true,

        requiresAIRepair:
          summary
            .blueprintWriterRequiresAIRepair ===
          true,

        reason:
          summary.blueprintWriterReason ||
          summary.blueprintEligibility
            ?.reason ||
          null,

        validation:
          summary
            .blueprintWriterValidation ||
          null
      },

      candidates,

      candidateSummary,

      arbitrationInput: {
        candidates,

        composerPacketReady:
          summary.composerPacketReady ===
          true,

        hasUsableCandidate:
          candidateSummary.usable >
          0,

        hasCompleteCandidate:
          candidateSummary.complete >
          0,

        hasCandidateRequiringRepair:
          candidateSummary
            .requiresRepair >
          0
      },

      authority:
        this.getAuthorityBoundaries()
    };
  },

  attachDraftGenerationHandoff({
    packet = {},
    state = {},
    handoff = {}
  } = {}) {
    if (
      !packet ||
      typeof packet !==
        "object"
    ) {
      return packet;
    }

    /*
     * Only attach generated candidate results.
     *
     * Do not rebuild meaning, response plans, safety,
     * Character authority, memory, or developer context.
     */
    return {
      ...packet,

      candidateDrafts:
        this.toArray(
          state.candidateDrafts
        ),

      draftGeneration:
        handoff,

      blueprintWriter:
        state.blueprintWriter ||
        null,

      blueprintWriterDraft:
        state.blueprintWriterDraft ||
        null,

      blueprintWriterUsable:
        state.blueprintWriterUsable ===
        true,

      blueprintWriterComplete:
        state.blueprintWriterComplete ===
        true,

      blueprintWriterRequiresAIRepair:
        state
          .blueprintWriterRequiresAIRepair ===
        true,

      characterCandidate:
        state.characterCandidate ||
        packet.characterCandidate ||
        null
    };
  },

  /* =====================================================
     STAGE PACKET
  ===================================================== */

  buildDraftGenerationStagePacket(
    summary = {}
  ) {
    const candidates =
      this.toArray(
        summary.candidateDrafts
      );

    const candidateSummary =
      this.summarizeCandidates(
        candidates
      );

    return {
      ready:
        summary.composerPacketReady ===
          true ||
        candidateSummary.total >
          0,

      source:
        this.source,

      version:
        this.version,

      schemaVersion:
        this.schemaVersion,

      eligibility:
        summary
          .draftGenerationEligibility ||
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

        reason:
          summary.reason ||
          null
      },

      characterCandidate:
        this.buildCharacterStageSummary(
          summary.characterCandidate
        ),

      blueprintWriter: {
        eligible:
          summary.blueprintEligibility
            ?.runBlueprintWriter ===
          true,

        eligibilityReason:
          summary.blueprintEligibility
            ?.reason ||
          null,

        ran:
          summary.blueprintWriterRan ===
          true,

        source:
          summary.blueprintWriterSource ||
          null,

        draft:
          summary.blueprintWriterDraft ||
          null,

        usable:
          summary.blueprintWriterUsable ===
          true,

        complete:
          summary.blueprintWriterComplete ===
          true,

        requiresAIRepair:
          summary
            .blueprintWriterRequiresAIRepair ===
          true,

        reason:
          summary.blueprintWriterReason ||
          null,

        validation:
          summary
            .blueprintWriterValidation ||
          null
      },

      candidates,

      candidateSummary,

      arbitrationReadiness: {
        ready:
          summary.composerPacketReady ===
            true ||
          candidateSummary.total >
            0,

        candidateCount:
          candidateSummary.total,

        usableCandidateCount:
          candidateSummary.usable,

        completeCandidateCount:
          candidateSummary.complete,

        candidateRequiringRepairCount:
          candidateSummary
            .requiresRepair,

        aiWriterDecisionDeferred:
          true,

        aiWriterDecisionAuthority:
          "ari-response-candidate-arbiter-precheck"
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
            this.cleanText(
              summary.finalResponse
            )
          ),

        composerPacketReady:
          summary.composerPacketReady ===
          true
      },

      handoff:
        summary
          .draftGenerationHandoff ||
        null,

      authority:
        this.getAuthorityBoundaries()
    };
  },

  buildCharacterStageSummary(
    character = {}
  ) {
    const value =
      character ||
      {};

    return {
      available:
        value.available ===
        true,

      answerAvailable:
        value.answerAvailable ===
        true,

      candidateAllowed:
        value.candidateAllowed ===
        true,

      candidateAvailable:
        value.candidateAvailable ===
        true,

      preferred:
        value.candidatePreferred ===
        true,

      grounded:
        value.grounded ===
        true,

      usable:
        value.usable ===
        true,

      complete:
        value.complete ===
        true,

      needsAIWriter:
        value.needsAIWriter ===
        true,

      type:
        value.type ||
        null,

      subtype:
        value.subtype ||
        null,

      mode:
        value.mode ||
        "silent",

      status:
        value.status ||
        null,

      focus:
        value.focus ||
        null,

      subject:
        value.subject ||
        null,

      draft:
        value.draft ||
        null,

      deterministicDraft:
        value.deterministicDraft ||
        null,

      aiWriterMode:
        value.aiWriterMode ||
        null,

      aiInstruction:
        value.aiInstruction ||
        "",

      source:
        value.source ||
        null,

      reason:
        value.reason ||
        null
    };
  },

  /* =====================================================
     CANDIDATE COLLECTION
  ===================================================== */

  addCandidateDraft(
    existing = [],
    candidate = {}
  ) {
    const candidates =
      this.toArray(
        existing
      );

    const text =
      this.cleanText(
        candidate.text
      );

    if (!text) {
      return candidates;
    }

    const normalizedCandidate = {
      ...candidate,

      text,

      usable:
        candidate.usable ===
        true,

      complete:
        candidate.complete ===
        true,

      requiresAIRepair:
        candidate
          .requiresAIRepair ===
          true ||
        candidate.requiresRepair ===
          true,

      requiresRepair:
        candidate
          .requiresAIRepair ===
          true ||
        candidate.requiresRepair ===
          true,

      createdAt:
        candidate.createdAt ||
        Date.now()
    };

    const duplicateIndex =
      candidates.findIndex(
        existingCandidate =>
          existingCandidate
            ?.source ===
            normalizedCandidate.source &&
          this.normalizeForComparison(
            existingCandidate?.text
          ) ===
            this.normalizeForComparison(
              normalizedCandidate.text
            )
      );

    if (
      duplicateIndex ===
      -1
    ) {
      return [
        ...candidates,
        normalizedCandidate
      ];
    }

    const existingCandidate =
      candidates[
        duplicateIndex
      ];

    const merged =
      this.mergeEquivalentCandidate({
        existing:
          existingCandidate,

        incoming:
          normalizedCandidate
      });

    return candidates.map(
      (
        item,
        index
      ) =>
        index ===
        duplicateIndex
          ? merged
          : item
    );
  },

  mergeEquivalentCandidate({
    existing = {},
    incoming = {}
  } = {}) {
    /*
     * Equivalent duplicate paths preserve the strictest
     * status. A rejected candidate cannot become accepted
     * simply because it was registered twice.
     */
    const usable =
      existing.usable ===
        true &&
      incoming.usable ===
        true;

    const complete =
      existing.complete ===
        true &&
      incoming.complete ===
        true;

    const requiresRepair =
      existing.requiresAIRepair ===
        true ||
      existing.requiresRepair ===
        true ||
      incoming.requiresAIRepair ===
        true ||
      incoming.requiresRepair ===
        true;

    const preferred =
      Number(
        incoming.priority ||
        0
      ) >
      Number(
        existing.priority ||
        0
      )
        ? incoming
        : existing;

    const secondary =
      preferred ===
        incoming
        ? existing
        : incoming;

    return {
      ...secondary,
      ...preferred,

      usable,

      complete,

      requiresAIRepair:
        requiresRepair,

      requiresRepair,

      validation:
        preferred.validation ||
        secondary.validation ||
        null,

      evidence: {
        ...(secondary.evidence || {}),
        ...(preferred.evidence || {}),

        duplicateRegistration:
          true
      },

      createdAt:
        existing.createdAt ||
        incoming.createdAt ||
        Date.now()
    };
  },

  summarizeCandidates(
    candidates = []
  ) {
    const list =
      this.toArray(
        candidates
      );

    return {
      total:
        list.length,

      usable:
        list.filter(
          candidate =>
            candidate?.usable ===
              true &&
            Boolean(
              this.cleanText(
                candidate?.text
              )
            )
        ).length,

      complete:
        list.filter(
          candidate =>
            candidate?.usable ===
              true &&
            candidate?.complete ===
              true &&
            candidate
              ?.requiresAIRepair !==
              true &&
            candidate
              ?.requiresRepair !==
              true
        ).length,

      requiresRepair:
        list.filter(
          candidate =>
            candidate
              ?.requiresAIRepair ===
              true ||
            candidate
              ?.requiresRepair ===
              true
        ).length,

      character:
        list.filter(
          candidate =>
            candidate?.source ===
            "character_reasoning"
        ).length,

      blueprint:
        list.filter(
          candidate =>
            candidate?.source ===
            "blueprint_writer"
        ).length,

      aiWriter:
        list.filter(
          candidate =>
            candidate?.source ===
            "ai_writer"
        ).length,

      preferred:
        list.filter(
          candidate =>
            candidate?.preferred ===
            true
        ).length
    };
  },

  /* =====================================================
     AUTHORITY BOUNDARIES
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canInvokeComposerBridge:
        true,

      canPreserveComposerPacket:
        true,

      canRegisterInitialCandidates:
        true,

      canRegisterAuthorizedCharacterCandidate:
        true,

      canInvokeBlueprintWriter:
        true,

      canRegisterBlueprintCandidate:
        true,

      canAttachDraftGenerationHandoff:
        true,

      canResolveCharacterPreference:
        false,

      canResolveCharacterIdentity:
        false,

      canResolveCharacterWorldview:
        false,

      canInferCharacterGrounding:
        false,

      canMergeCharacterAuthoritySources:
        false,

      canDetermineCandidateQualityWinner:
        false,

      canDetermineWhetherAIWriterIsNeeded:
        false,

      canPrepareAIWriterInstruction:
        false,

      canRunAIWriter:
        false,

      canSelectFinalDraft:
        false,

      canCreateFallbackComposerPacket:
        false,

      canCreateFallbackResponsePlan:
        false,

      canWriteFinalResponse:
        false,

      canOverrideSafety:
        false,

      canRetrieveMemory:
        false,

      canStoreMemory:
        false,

      canAccessSupabase:
        false,

      canPersistState:
        false,

      role:
        "canonical_composer_packet_and_initial_candidate_registration"
    };
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

  readTurnId(
    packet = {}
  ) {
    return (
      packet?.request
        ?.turnId ||
      packet?.turnId ||
      packet
        ?.canonicalResponsePlan
        ?.turnId ||
      packet?.responsePlan
        ?.turnId ||
      null
    );
  },

  readOriginalQuestion(
    packet = {}
  ) {
    return this.cleanText(
      packet?.request
        ?.originalText ||
      packet?.request
        ?.currentText ||
      packet
        ?.originalUserQuestion ||
      packet?.userQuestion ||
      ""
    );
  },

  createStableCandidateId({
    source =
      "candidate",

    turnId =
      null,

    text =
      ""
  } = {}) {
    const value = [
      source,
      turnId ||
        "no_turn",
      this.normalizeForComparison(
        text
      )
    ].join(
      "|"
    );

    return `${source}_${this.hashString(
      value
    )}`;
  },

  hashString(
    value = ""
  ) {
    let hash =
      2166136261;

    const text =
      String(
        value ||
        ""
      );

    for (
      let index = 0;
      index < text.length;
      index += 1
    ) {
      hash ^=
        text.charCodeAt(
          index
        );

      hash +=
        (hash << 1) +
        (hash << 4) +
        (hash << 7) +
        (hash << 8) +
        (hash << 24);
    }

    return (
      hash >>>
      0
    ).toString(
      36
    );
  },

  toArray(value) {
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
        undefined ||
      value ===
        null ||
      value ===
        ""
    ) {
      return [];
    }

    return [
      value
    ];
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

  normalizeForComparison(
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
  }
};

console.log(
  "ARI DRAFT GENERATION STAGE LOADED:",
  window.AriDraftGenerationStage?.version
);