// ari/language/ari-composer-bridge.js
// Ari Composer Bridge
//
// Purpose:
// Package the authoritative current-turn request, canonical Response Plan,
// focused Character candidate, and supporting expression evidence into one
// stable Composer Packet.
//
// V3.0.0 — Canonical Packaging / Focused Character Candidate Contract
//
// Architectural flow:
//
// Canonical resolved current turn
//      ↓
// Canonical Response Plan
//      ↓
// Focused Character Handoff
//      ↓
// Supporting continuity / safety / knowledge / language evidence
//      ↓
// Ari Composer Bridge
//      ↓
// Composer Packet
//      ↓
// Draft Generation
//
// Responsibilities:
// - Preserve the original current-turn text.
// - Preserve the canonical resolved current-turn text.
// - Locate and preserve the canonical Response Plan.
// - Project the canonical Response Plan into stable compatibility fields.
// - Read one focused Character handoff.
// - Produce one normalized Character candidate contract.
// - Package authorized continuity, safety, knowledge, language, memory,
//   and developer evidence.
// - Suppress irrelevant developer evidence.
// - Produce one stable Composer Packet.
//
// Non-responsibilities:
// - Does not reinterpret the current turn.
// - Does not create a fallback Response Plan.
// - Does not choose a response goal.
// - Does not choose a response shape.
// - Does not add, remove, reorder, or replace response moves.
// - Does not reconcile stale planning policy after continuity.
// - Does not resolve Character identity, preferences, values, or worldview.
// - Does not infer Character authority from unrelated objects.
// - Does not decide whether Blueprint Writer should run.
// - Does not decide whether AI Writer is needed.
// - Does not generate a draft candidate.
// - Does not select a response candidate.
// - Does not write final user-facing language.
// - Does not retrieve or store memory.
// - Does not access Supabase.
// - Does not persist runtime state.

window.Ari = window.Ari || {};

window.AriComposerBridge = {
  version: "3.0.0",
  schemaVersion: "3.0.0",
  source: "ari-composer-bridge",
  authorityLevel: "canonical_expression_packet_packaging_authority",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  build(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const request =
      this.buildRequest(
        summary
      );

    const responsePlan =
      this.readCanonicalResponsePlan(
        summary
      );

    const responseStrategy =
      this.projectResponseStrategy({
        summary,
        responsePlan
      });

    const continuity =
      this.readContinuityContext(
        summary
      );

    const safety =
      this.readSafetyContext(
        summary
      );

    const knowledge =
      this.readKnowledgeContext(
        summary
      );

    const language =
      this.readLanguageContext(
        summary
      );

    const memory =
      this.readMemoryContext(
        summary
      );

    const developer =
      this.readDeveloperContext({
        summary,
        request,
        responsePlan,
        responseStrategy
      });

    const characterHandoff =
      this.readFocusedCharacterHandoff(
        summary
      );

    const characterCandidate =
      this.buildCharacterCandidateContract(
        characterHandoff
      );

    const responseControl =
      this.buildResponseControl({
        responsePlan,
        safety,
        language,
        characterCandidate
      });

    const evidence =
      this.buildEvidence({
        summary,
        request,
        responsePlan,
        responseStrategy,
        continuity,
        safety,
        knowledge,
        language,
        memory,
        developer,
        characterHandoff,
        characterCandidate
      });

    const packet =
      this.buildComposerPacket({
        summary,
        request,
        responsePlan,
        responseStrategy,
        responseControl,
        continuity,
        safety,
        knowledge,
        language,
        memory,
        developer,
        characterHandoff,
        characterCandidate,
        evidence
      });

    window.Ari.composerPacket =
      packet;

    window.Ari.composerBridgeState =
      packet;

    return {
      composerPacketReady:
        packet.ready ===
        true,

      composerPacketUsable:
        packet.usable ===
        true,

      composerPacket:
        packet,

      composerBridgeRan:
        true,

      composerBridgeSource:
        this.source,

      composerBridgeVersion:
        this.version,

      composerBridgeSchemaVersion:
        this.schemaVersion,

      canonicalResponsePlanAvailable:
        responsePlan.available ===
        true,

      canonicalResponsePlanReady:
        responsePlan.ready ===
        true,

      canonicalResponsePlanUsable:
        responsePlan.usable ===
        true,

      canonicalResponsePlanSource:
        responsePlan.source ||
        null,

      composerResponseMoves:
        responseControl.responseMoves,

      composerAdvicePolicy:
        responseControl.advicePolicy,

      composerShouldAskQuestion:
        responseControl
          .questionPolicy
          .shouldAskQuestion ===
        true,

      composerWriterInstructions:
        responseControl.writerInstructions,

      composerCharacterAvailable:
        characterCandidate.available ===
        true,

      composerCharacterAnswerAvailable:
        characterCandidate
          .answerAvailable ===
        true,

      composerCharacterCandidateAvailable:
        characterCandidate
          .candidateAvailable ===
        true,

      composerCharacterNeedsAIWriter:
        characterCandidate
          .needsAIWriter ===
        true,

      composerCharacterStatus:
        characterCandidate.status ||
        null
    };
  },

  /* =====================================================
     REQUEST
  ===================================================== */

  buildRequest(summary = {}) {
    const planTurn =
      this.readPlanTurn(
        summary
      );

    const continuityTurn =
      this.readContinuityTurn(
        summary
      );

    const originalText =
      this.cleanText(
        planTurn.originalText ||
        continuityTurn.originalText ||
        summary.originalUserMessage ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    const resolvedText =
      this.cleanText(
        planTurn.resolvedText ||
        planTurn.semanticInputText ||
        continuityTurn.resolvedText ||
        continuityTurn.semanticInputText ||
        summary.resolvedUserQuestion ||
        summary.resolvedCurrentTurn
          ?.resolvedText ||
        summary.continuityPacket
          ?.resolvedUserQuestion ||
        summary.continuityPacket
          ?.resolvedCurrentTurn
          ?.resolvedText ||
        summary.continuityResults
          ?.resolvedUserQuestion ||
        summary.continuityResults
          ?.resolvedCurrentTurn
          ?.resolvedText ||
        originalText
      );

    const effectiveText =
      resolvedText ||
      originalText;

    const turnId =
      planTurn.turnId ||
      continuityTurn.turnId ||
      summary.currentTurnId ||
      summary.turnId ||
      null;

    const resolvedTextDiffers =
      Boolean(
        resolvedText &&
        originalText
      ) &&
      this.normalizeForComparison(
        resolvedText
      ) !==
      this.normalizeForComparison(
        originalText
      );

    const ellipticalFollowUpResolved =
      planTurn
        .ellipticalFollowUpResolved ===
        true ||
      continuityTurn
        .ellipticalFollowUpResolved ===
        true ||
      summary.ellipticalFollowUpResolved ===
        true ||
      summary.continuityPacket
        ?.ellipticalFollowUpResolved ===
        true ||
      summary.continuityResults
        ?.ellipticalFollowUp
        ?.resolved ===
        true ||
      summary.continuityResults
        ?.outputs
        ?.elliptical
        ?.resolved ===
        true;

    const currentTurnWasResolved =
      planTurn
        .currentTurnWasSemanticallyResolved ===
        true ||
      planTurn
        .currentTurnWasStructurallyResolved ===
        true ||
      continuityTurn
        .currentTurnWasResolved ===
        true ||
      summary.currentTurnWasResolved ===
        true ||
      ellipticalFollowUpResolved ||
      resolvedTextDiffers;

    return {
      schema:
        "ari_composer_request",

      schemaVersion:
        this.schemaVersion,

      turnId,

      originalText,

      currentText:
        effectiveText,

      effectiveText,

      resolvedText:
        effectiveText,

      semanticInputText:
        effectiveText,

      normalizedText:
        this.normalizeForComparison(
          effectiveText
        ),

      originalTextPreserved:
        true,

      textWasRewritten:
        false,

      resolvedTextIsSeparateInterpretation:
        resolvedTextDiffers,

      currentTurnWasResolved,

      currentTurnWasStructurallyResolved:
        currentTurnWasResolved,

      currentTurnWasSemanticallyResolved:
        currentTurnWasResolved,

      ellipticalFollowUpResolved,

      resolutionSource:
        ellipticalFollowUpResolved
          ? "elliptical_follow_up"
          : currentTurnWasResolved
            ? "resolved_current_turn"
            : "none",

      requiresPriorContext:
        summary.routingContract
          ?.requiresPriorContext ===
          true ||
        [
          "continuity_follow_up",
          "relationship_continuity",
          "correction_or_revision"
        ].includes(
          summary.routingContract
            ?.contextLane
        ) ||
        summary.continuityEligibility
          ?.eligible ===
          true,

      contextLane:
        summary.routingContract
          ?.contextLane ||
        summary.contextLane ||
        summary.laneSplit?.lane ||
        "direct_current_turn",

      authority:
        "canonical_current_turn_handoff"
    };
  },

  readPlanTurn(summary = {}) {
    return (
      summary.responsePlanningHandoff
        ?.responsePlan
        ?.turn ||
      summary.responsePlanningStagePacket
        ?.planner
        ?.value
        ?.responsePlan
        ?.turn ||
      summary.ariResponsePlan
        ?.responsePlan
        ?.turn ||
      summary.ariResponsePlan
        ?.turn ||
      summary.canonicalResponsePlan
        ?.turn ||
      summary.responsePlan
        ?.turn ||
      {}
    );
  },

  readContinuityTurn(summary = {}) {
    return (
      summary.continuityPacket
        ?.currentTurn ||
      summary.continuityStagePacket
        ?.currentTurn ||
      summary.continuityCurrentTurn ||
      {}
    );
  },

  /* =====================================================
     CANONICAL RESPONSE PLAN
  ===================================================== */

  readCanonicalResponsePlan(
    summary = {}
  ) {
    const candidates = [
      summary.responsePlanningHandoff
        ?.responsePlan,

      summary.responsePlanningStagePacket
        ?.planner
        ?.value
        ?.responsePlan,

      summary.responsePlanningStagePacket
        ?.planner
        ?.value
        ?.canonicalResponsePlan,

      summary.responseStrategy
        ?.responsePlan,

      summary.ariResponsePlan
        ?.responsePlan,

      summary.ariResponsePlan
        ?.canonicalResponsePlan,

      summary.ariResponsePlan,

      summary.understandingResponsePlan
        ?.responsePlan,

      summary.understandingResponsePlan
        ?.canonicalResponsePlan,

      summary.understandingResponsePlan,

      summary.canonicalResponsePlan,

      summary.responsePlan
    ];

    const canonical =
      candidates
        .map(
          candidate =>
            this.unwrapResponsePlan(
              candidate
            )
        )
        .find(Boolean) ||
      null;

    if (!canonical) {
      return this.missingResponsePlan();
    }

    const moves =
      this.normalizeResponseMoves(
        canonical.responseMoves ||
        canonical.moves ||
        []
      );

    const writerInstructions =
      this.preserveWriterInstructions(
        canonical.writerInstructions ||
        {}
      );

    const strategy =
      canonical.strategy ||
      {};

    const interactionPolicy =
      canonical.interactionPolicy ||
      {};

    const governance =
      canonical.governance ||
      {};

    const blueprint =
      canonical.blueprint ||
      {};

    const responseGoal =
      strategy.responseGoal ||
      canonical.responseGoal ||
      null;

    const responseShape =
      strategy.responseShape ||
      canonical.responseShape ||
      writerInstructions.shape ||
      null;

    const responsePosture =
      strategy.responsePosture ||
      canonical.responsePosture ||
      writerInstructions.posture ||
      writerInstructions.tone ||
      null;

    return {
      schema:
        "ari_response_plan",

      schemaVersion:
        canonical.schemaVersion ||
        null,

      available:
        true,

      ready:
        canonical.ready ===
        true,

      usable:
        canonical.usable ===
          true ||
        (
          canonical.ready ===
            true &&
          moves.length >
            0
        ),

      source:
        canonical.source ||
        canonical.responsePlannerSource ||
        "ari-response-planner",

      version:
        canonical.version ||
        canonical.responsePlannerVersion ||
        null,

      turn:
        canonical.turn ||
        null,

      turnId:
        canonical.turn?.turnId ||
        canonical.turnId ||
        null,

      originalQuestion:
        canonical.turn
          ?.originalText ||
        canonical.originalUserQuestion ||
        null,

      resolvedQuestion:
        canonical.turn
          ?.resolvedText ||
        canonical.resolvedUserQuestion ||
        canonical.sourceQuestion ||
        canonical.userQuestion ||
        canonical.turn
          ?.originalText ||
        null,

      sourceQuestion:
        canonical.turn
          ?.resolvedText ||
        canonical.resolvedUserQuestion ||
        canonical.sourceQuestion ||
        canonical.userQuestion ||
        canonical.turn
          ?.originalText ||
        null,

      strategy,

      interpretation:
        canonical.interpretation ||
        null,

      objective:
        canonical.objective ||
        null,

      blueprint,

      moves,

      responseMoves:
        moves,

      governance,

      interactionPolicy,

      writerInstructions,

      personalization:
        canonical.personalization ||
        null,

      provenance:
        canonical.provenance ||
        null,

      validation:
        canonical.validation ||
        null,

      quality:
        canonical.quality ||
        null,

      handoff:
        canonical.handoff ||
        null,

      confidence:
        this.normalizeConfidence(
          canonical.confidence
        ),

      responseGoal,

      responseShape,

      responsePosture,

      currentNeed:
        canonical.interpretation
          ?.currentNeed ||
        canonical.currentNeed ||
        strategy.currentNeed ||
        null,

      adviceRequested:
        interactionPolicy
          .adviceRequested ===
          true ||
        canonical.adviceRequested ===
          true,

      advicePolicy:
        interactionPolicy
          .advicePolicy ||
        canonical.advicePolicy ||
        strategy.advicePolicy ||
        "allowed_if_useful",

      coachingPermissionRequired:
        interactionPolicy
          .coachingPermissionRequired ===
          true ||
        canonical
          .coachingPermissionRequired ===
          true,

      shouldAskQuestion:
        interactionPolicy
          .shouldAskQuestion ===
          true ||
        canonical.shouldAskQuestion ===
          true,

      questionPurpose:
        interactionPolicy
          .questionPurpose ||
        canonical.questionPurpose ||
        null,

      maxQuestions:
        this.firstFiniteNumber([
          interactionPolicy
            .maximumQuestions,

          interactionPolicy
            .maxQuestions,

          writerInstructions
            .maxQuestions,

          0
        ]) ?? 0,

      responseOrder:
        moves.map(
          move =>
            move.id
        ),

      requiredBehaviors:
        this.mergeUnique(
          governance
            .requiredBehaviors,

          canonical
            .requiredBehaviors,

          canonical.required,

          writerInstructions
            .requiredBehaviors,

          writerInstructions.required
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          governance
            .forbiddenBehaviors,

          canonical
            .forbiddenBehaviors,

          canonical.avoid,

          writerInstructions
            .forbiddenBehaviors,

          writerInstructions.avoid
        ),

      constraints:
        this.mergeUnique(
          governance.constraints,
          canonical.constraints,
          writerInstructions.constraints
        ),

      responseRules:
        this.mergeUnique(
          governance.responseRules,
          canonical.responseRules,
          writerInstructions
            .responseRules,

          writerInstructions.rules
        ),

      blueprintHint:
        blueprint.id ||
        canonical.blueprintHint ||
        null,

      communicationPlan:
        canonical.communicationPlan ||
        null,

      composerDirective:
        canonical.composerDirective ||
        null,

      raw:
        canonical,

      authority: {
        canPreserveCanonicalPlan:
          true,

        canDefineResponseGoal:
          false,

        canDefineResponseShape:
          false,

        canDefineResponseMoves:
          false,

        canModifyQuestionPolicy:
          false,

        canRewriteWriterInstructions:
          false,

        role:
          "canonical_response_plan_preservation"
      }
    };
  },

  unwrapResponsePlan(
    candidate = null
  ) {
    if (
      !candidate ||
      typeof candidate !==
        "object" ||
      Array.isArray(candidate)
    ) {
      return null;
    }

    if (
      candidate.schema ===
      "ari_response_plan"
    ) {
      return candidate;
    }

    if (
      candidate.responsePlan
        ?.schema ===
      "ari_response_plan"
    ) {
      return candidate.responsePlan;
    }

    if (
      candidate
        .canonicalResponsePlan
        ?.schema ===
      "ari_response_plan"
    ) {
      return candidate
        .canonicalResponsePlan;
    }

    return null;
  },

  missingResponsePlan() {
    return {
      schema:
        "ari_response_plan",

      schemaVersion:
        null,

      available:
        false,

      ready:
        false,

      usable:
        false,

      source:
        null,

      version:
        null,

      turn:
        null,

      turnId:
        null,

      originalQuestion:
        null,

      resolvedQuestion:
        null,

      sourceQuestion:
        null,

      strategy:
        {},

      interpretation:
        null,

      objective:
        null,

      blueprint:
        {},

      moves:
        [],

      responseMoves:
        [],

      governance:
        {},

      interactionPolicy:
        {},

      writerInstructions:
        {},

      personalization:
        null,

      provenance:
        null,

      validation: {
        valid:
          false,

        errors: [
          {
            type:
              "canonical_response_plan_missing"
          }
        ],

        warnings:
          []
      },

      quality:
        null,

      handoff:
        null,

      confidence:
        0,

      responseGoal:
        null,

      responseShape:
        null,

      responsePosture:
        null,

      currentNeed:
        null,

      adviceRequested:
        false,

      advicePolicy:
        null,

      coachingPermissionRequired:
        false,

      shouldAskQuestion:
        false,

      questionPurpose:
        null,

      maxQuestions:
        0,

      responseOrder:
        [],

      requiredBehaviors:
        [],

      forbiddenBehaviors:
        [],

      constraints:
        [],

      responseRules:
        [],

      blueprintHint:
        null,

      communicationPlan:
        null,

      composerDirective:
        null,

      raw:
        null,

      authority: {
        canCreateFallbackResponsePlan:
          false,

        role:
          "missing_canonical_response_plan_record"
      }
    };
  },

  normalizeResponseMoves(
    moves = []
  ) {
    return this.toArray(
      moves
    )
      .map(
        (
          move,
          index
        ) => {
          if (
            typeof move ===
            "string"
          ) {
            const id =
              this.normalizeIdentifier(
                move
              );

            if (!id) {
              return null;
            }

            return {
              id,

              order:
                index,

              type:
                "response_move",

              family:
                null,

              required:
                true,

              registered:
                true,

              userFacing:
                true,

              renderPolicy:
                "render_or_ai_repair",

              purpose:
                null,

              contentGuidance:
                null,

              contentHint:
                null,

              evidenceRefs:
                [],

              authority:
                null,

              source:
                "canonical_response_plan",

              raw:
                move
            };
          }

          if (
            !move ||
            typeof move !==
              "object"
          ) {
            return null;
          }

          const id =
            this.normalizeIdentifier(
              move.id ||
              move.move ||
              move.name ||
              move.type ||
              ""
            );

          if (!id) {
            return null;
          }

          return {
            id,

            order:
              Number.isFinite(
                Number(
                  move.order
                )
              )
                ? Number(
                    move.order
                  )
                : index,

            type:
              move.type ||
              "response_move",

            family:
              move.family ||
              null,

            renderer:
              move.renderer ||
              null,

            required:
              move.required !==
              false,

            registered:
              move.registered !==
              false,

            userFacing:
              move.userFacing !==
              false,

            renderPolicy:
              move.renderPolicy ||
              (
                move.userFacing ===
                false
                  ? "instruction_only"
                  : "render_or_ai_repair"
              ),

            purpose:
              move.purpose ||
              null,

            contentGuidance:
              move.contentGuidance ||
              null,

            contentHint:
              move.contentHint ||
              move.hint ||
              null,

            evidenceRefs:
              this.toArray(
                move.evidenceRefs
              ),

            authority:
              move.authority ||
              null,

            source:
              move.source ||
              "canonical_response_plan",

            raw:
              move.raw ||
              move
          };
        }
      )
      .filter(Boolean)
      .sort(
        (
          first,
          second
        ) =>
          first.order -
          second.order
      );
  },

  preserveWriterInstructions(
    instructions = {}
  ) {
    if (
      !instructions ||
      typeof instructions !==
        "object"
    ) {
      return {};
    }

    return {
      ...instructions,

      responseMoves:
        this.normalizeResponseMoves(
          instructions
            .responseMoves ||
          instructions.moves ||
          []
        ),

      required:
        this.toArray(
          instructions.required
        ),

      requiredBehaviors:
        this.toArray(
          instructions
            .requiredBehaviors
        ),

      avoid:
        this.toArray(
          instructions.avoid
        ),

      forbiddenBehaviors:
        this.toArray(
          instructions
            .forbiddenBehaviors
        ),

      constraints:
        this.toArray(
          instructions.constraints
        ),

      rules:
        this.toArray(
          instructions.rules
        ),

      responseRules:
        this.toArray(
          instructions
            .responseRules
        ),

      doNotWrite:
        this.toArray(
          instructions.doNotWrite
        )
    };
  },

  /* =====================================================
     RESPONSE STRATEGY PROJECTION
  ===================================================== */

  projectResponseStrategy({
    summary = {},
    responsePlan = {}
  } = {}) {
    const strategy =
      responsePlan.strategy ||
      {};

    return {
      ready:
        responsePlan.ready ===
        true,

      source:
        strategy.source ||
        responsePlan.source ||
        null,

      responseGoal:
        responsePlan.responseGoal,

      responseShape:
        responsePlan.responseShape,

      responsePosture:
        responsePlan.responsePosture,

      currentNeed:
        responsePlan.currentNeed,

      answerMode:
        strategy.answerMode ||
        null,

      desiredOutcome:
        strategy.desiredOutcome ||
        null,

      responseOrder:
        responsePlan.responseOrder,

      primaryLane:
        strategy.primaryLane ||
        summary.routingContract
          ?.primaryLane ||
        summary.primaryLane ||
        null,

      contextLane:
        strategy.contextLane ||
        summary.routingContract
          ?.contextLane ||
        summary.contextLane ||
        null,

      planner:
        strategy.planner ||
        summary.routingContract
          ?.planner ||
        summary.selectedPlanner ||
        null,

      mode:
        strategy.mode ||
        summary.routingContract
          ?.mode ||
        summary.conversationMode ||
        "unknown",

      intent:
        strategy.intent ||
        summary.routingContract
          ?.primaryIntent ||
        summary.primaryIntent ||
        "unknown",

      domain:
        strategy.domain ||
        summary.routingContract
          ?.domain ||
        summary.conversationDomain ||
        "general",

      requiredBehaviors:
        responsePlan
          .requiredBehaviors,

      forbiddenBehaviors:
        responsePlan
          .forbiddenBehaviors,

      constraints:
        responsePlan.constraints,

      rules:
        responsePlan.responseRules,

      communicationPlan:
        responsePlan
          .communicationPlan,

      composerDirective:
        responsePlan
          .composerDirective,

      personalization:
        responsePlan
          .personalization,

      confidence:
        responsePlan.confidence,

      raw:
        strategy,

      authority: {
        canProjectCanonicalStrategy:
          true,

        canOverrideCanonicalPlan:
          false,

        role:
          "canonical_response_strategy_projection"
      }
    };
  },

  /* =====================================================
     FOCUSED CHARACTER HANDOFF
  ===================================================== */

  readFocusedCharacterHandoff(
    summary = {}
  ) {
    /*
     * Character Stage must provide one focused handoff.
     *
     * The Composer Bridge does not search broad preference
     * stores or independently combine Character authorities.
     */
    const handoff =
      summary.characterHandoff ||
      summary.characterStagePacket
        ?.handoff ||
      null;

    if (
      !handoff ||
      typeof handoff !==
        "object"
    ) {
      return {
        available:
          false,

        source:
          null,

        raw:
          null,

        reason:
          "focused_character_handoff_missing"
      };
    }

    const composerCharacter =
      handoff.composerCharacter &&
      typeof handoff
        .composerCharacter ===
        "object"
        ? handoff.composerCharacter
        : null;

    const reasoning =
      handoff.reasoning &&
      typeof handoff.reasoning ===
        "object"
        ? handoff.reasoning
        : null;

    const focused =
      composerCharacter ||
      reasoning ||
      handoff;

    return {
      available:
        true,

      source:
        handoff.source ||
        focused.source ||
        "ari-character-stage",

      composerCharacter,

      reasoning,

      focused,

      raw:
        handoff,

      reason:
        "focused_character_handoff_available"
    };
  },

  buildCharacterCandidateContract(
    handoff = {}
  ) {
    if (
      handoff.available !==
        true ||
      !handoff.focused
    ) {
      return this.emptyCharacterCandidate(
        handoff.reason ||
        "focused_character_handoff_missing"
      );
    }

    const source =
      handoff.focused;

    const reasoning =
      handoff.reasoning ||
      {};

    const realization =
      this.normalizeCharacterRealization(
        source.realization ||
        handoff.raw
          ?.realization ||
        reasoning.realizationPolicy ||
        {}
      );

    const status =
      this.normalizeCharacterStatus(
        source.status ||
        handoff.raw?.status ||
        reasoning.status ||
        null,

        source.type ||
        reasoning.type ||
        null
      );

    const deterministicDraft =
      this.cleanText(
        source.deterministicDraft ||
        handoff.raw
          ?.deterministicDraft ||
        reasoning.deterministicDraft ||
        source.draft ||
        handoff.raw?.draft ||
        reasoning.userFacingDraft ||
        ""
      );

    const draft =
      this.cleanText(
        source.draft ||
        handoff.raw?.draft ||
        reasoning.userFacingDraft ||
        deterministicDraft
      );

    const answerAvailable =
      source.answerAvailable ===
        true ||
      handoff.raw
        ?.answerAvailable ===
        true ||
      reasoning
        .characterAnswerAvailable ===
        true;

    const guidanceAvailable =
      source.guidanceAvailable ===
        true ||
      handoff.raw
        ?.guidanceAvailable ===
        true ||
      reasoning
        .characterGuidanceAvailable ===
        true;

    const grounding =
      source.grounding ||
      handoff.raw?.grounding ||
      reasoning.grounding ||
      null;

    const grounded =
      grounding?.grounded ===
        true;

    const candidateAllowed =
      answerAvailable &&
      grounded &&
      Boolean(
        deterministicDraft
      ) &&
      realization.needsAIWriter !==
        true;

    const candidateAvailable =
      candidateAllowed;

    const candidatePreferred =
      candidateAvailable &&
      source.candidatePreferred !==
        false &&
      handoff.raw
        ?.candidatePreferred !==
        false;

    const complete =
      candidateAvailable &&
      source.complete !==
        false &&
      handoff.raw?.complete !==
        false;

    const usable =
      candidateAvailable &&
      source.usable !==
        false &&
      handoff.raw?.usable !==
        false;

    return {
      schema:
        "ari_character_candidate",

      schemaVersion:
        this.schemaVersion,

      available:
        true,

      answerAvailable,

      guidanceAvailable,

      grounded,

      candidateAllowed,

      candidateAvailable,

      candidatePreferred,

      usable,

      complete,

      needsAIWriter:
        realization.needsAIWriter ===
        true,

      aiRealizationRequired:
        realization.needsAIWriter ===
          true &&
        realization.mode ===
          "ai_realization_required",

      text:
        deterministicDraft,

      draft,

      deterministicDraft,

      answer:
        source.answer ||
        handoff.raw?.answer ||
        reasoning.answer ||
        null,

      groundedMeaning:
        source.groundedMeaning ||
        handoff.raw
          ?.groundedMeaning ||
        reasoning.groundedMeaning ||
        null,

      mode:
        source.mode ||
        handoff.raw?.mode ||
        reasoning.request?.mode ||
        "silent",

      visibility:
        source.visibility ||
        handoff.raw?.visibility ||
        "background",

      expressionLevel:
        source.expressionLevel ||
        handoff.raw
          ?.expressionLevel ||
        "background",

      type:
        source.type ||
        handoff.raw?.type ||
        reasoning.type ||
        null,

      subtype:
        source.subtype ||
        handoff.raw?.subtype ||
        reasoning.subtype ||
        null,

      focus:
        source.focus ||
        handoff.raw?.focus ||
        reasoning.focus ||
        null,

      subject:
        source.subject ||
        handoff.raw?.subject ||
        reasoning.subject ||
        null,

      preferenceSubject:
        source.preferenceSubject ||
        handoff.raw
          ?.preferenceSubject ||
        reasoning.preferenceSubject ||
        null,

      status,

      grounding,

      realization,

      aiWriterMode:
        realization.aiWriterMode,

      aiInstruction:
        realization.aiInstruction,

      preserveMeaning:
        realization.preserveMeaning,

      preserveStatus:
        realization.preserveStatus,

      preserveValue:
        realization.preserveValue,

      preservePosition:
        realization.preservePosition,

      preserveOpenStatus:
        realization.preserveOpenStatus,

      tentativeLanguageRequired:
        realization
          .tentativeLanguageRequired,

      mayVaryWording:
        realization.mayVaryWording,

      relationship:
        source.relationship ||
        handoff.raw?.relationship ||
        null,

      implementationDisclosure:
        source
          .implementationDisclosure ||
        handoff.raw
          ?.implementationDisclosure ||
        null,

      responseControl:
        this.normalizeCharacterResponseControl(
          source.responseControl ||
          handoff.raw
            ?.responseControl ||
          {
            requiredBehaviors:
              handoff.raw
                ?.requiredBehaviors,

            forbiddenBehaviors:
              handoff.raw
                ?.forbiddenBehaviors,

            constraints:
              handoff.raw
                ?.constraints
          }
        ),

      authorityChain:
        this.toArray(
          source.authorityChain ||
          handoff.raw
            ?.authorityChain ||
          reasoning.authorityChain
        ),

      authorityPacket:
        source.authorityPacket ||
        handoff.raw
          ?.authorityPacket ||
        reasoning.authorityPacket ||
        null,

      source:
        source.preferredSource ||
        handoff.raw
          ?.preferredCharacterSource ||
        reasoning.source ||
        handoff.source ||
        "ari-character-stage",

      reason:
        realization.needsAIWriter ===
          true
          ? "character_answer_requires_ai_realization"
          : candidateAvailable
            ? "authorized_grounded_character_candidate"
            : !answerAvailable
              ? "character_answer_not_available"
              : !grounded
                ? "character_answer_not_grounded"
                : !deterministicDraft
                  ? "character_deterministic_draft_missing"
                  : "character_candidate_unavailable",

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
        handoff.raw,

      authority:
        "focused_character_candidate_contract"
    };
  },

  emptyCharacterCandidate(
    reason =
      "character_candidate_unavailable"
  ) {
    return {
      schema:
        "ari_character_candidate",

      schemaVersion:
        this.schemaVersion,

      available:
        false,

      answerAvailable:
        false,

      guidanceAvailable:
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

      needsAIWriter:
        false,

      aiRealizationRequired:
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

      visibility:
        "background",

      expressionLevel:
        "background",

      type:
        null,

      subtype:
        null,

      focus:
        null,

      subject:
        null,

      preferenceSubject:
        null,

      status:
        null,

      grounding:
        null,

      realization:
        null,

      aiWriterMode:
        null,

      aiInstruction:
        "",

      preserveMeaning:
        true,

      preserveStatus:
        true,

      preserveValue:
        false,

      preservePosition:
        false,

      preserveOpenStatus:
        false,

      tentativeLanguageRequired:
        false,

      mayVaryWording:
        true,

      relationship:
        null,

      implementationDisclosure:
        null,

      responseControl:
        this.normalizeCharacterResponseControl(),

      authorityChain:
        [],

      authorityPacket:
        null,

      source:
        null,

      reason,

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
        null,

      authority:
        "focused_character_candidate_contract"
    };
  },

  normalizeCharacterRealization(
    realization = {}
  ) {
    const source =
      realization &&
      typeof realization ===
        "object"
        ? realization
        : {};

    const needsAIWriter =
      source.needsAIWriter ===
        true;

    return {
      ...source,

      mode:
        source.mode ||
        (
          needsAIWriter
            ? "optional_ai_realization"
            : "local_candidate_preferred"
        ),

      needsAIWriter,

      aiWriterMode:
        source.aiWriterMode ||
        null,

      aiInstruction:
        this.cleanText(
          source.aiInstruction ||
          ""
        ),

      preserveMeaning:
        source.preserveMeaning !==
        false,

      preserveStatus:
        source.preserveStatus !==
        false,

      preserveValue:
        source.preserveValue ===
        true,

      preservePosition:
        source.preservePosition ===
        true,

      preserveOpenStatus:
        source.preserveOpenStatus ===
        true,

      tentativeLanguageRequired:
        source
          .tentativeLanguageRequired ===
        true,

      mayVaryWording:
        source.mayVaryWording !==
        false,

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

      mayModifyCharacterAuthority:
        false,

      mayPromoteToCanonical:
        false
    };
  },

  normalizeCharacterStatus(
    value = null,
    type = null
  ) {
    if (
      value &&
      typeof value ===
        "object"
    ) {
      const overall =
        value.overall ||
        value.preferenceStatus ||
        value.worldviewStatus ||
        value.identityStatus ||
        "background";

      return {
        ...value,

        overall,

        preferenceStatus:
          value.preferenceStatus ||
          (
            type ===
            "character_preference"
              ? overall
              : null
          ),

        worldviewStatus:
          value.worldviewStatus ||
          (
            [
              "character_worldview",
              "character_perspective"
            ].includes(
              type
            )
              ? overall
              : null
          ),

        identityStatus:
          value.identityStatus ||
          (
            type ===
            "character_identity"
              ? overall
              : null
          ),

        canonical:
          value.canonical ===
            true ||
          overall ===
            "canonical",

        inferred:
          value.inferred ===
            true ||
          overall ===
            "inferred",

        open:
          value.open ===
            true ||
          overall ===
            "open",

        stable:
          value.stable ===
            true ||
          overall ===
            "stable",

        background:
          value.background ===
            true ||
          overall ===
            "background"
      };
    }

    const overall =
      typeof value ===
        "string" &&
      value
        ? value
        : "background";

    return {
      overall,

      preferenceStatus:
        type ===
        "character_preference"
          ? overall
          : null,

      worldviewStatus:
        [
          "character_worldview",
          "character_perspective"
        ].includes(
          type
        )
          ? overall
          : null,

      identityStatus:
        type ===
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

  normalizeCharacterResponseControl(
    control = {}
  ) {
    return {
      requiredBehaviors:
        this.toArray(
          control
            ?.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.toArray(
          control
            ?.forbiddenBehaviors
        ),

      constraints:
        this.toArray(
          control?.constraints
        ),

      rules:
        this.toArray(
          control?.rules
        )
    };
  },

  /* =====================================================
     CONTINUITY
  ===================================================== */

  readContinuityContext(
    summary = {}
  ) {
    const stagePacket =
      summary.continuityStagePacket ||
      null;

    const packet =
      summary.continuityPacket ||
      stagePacket
        ?.continuityPacket
        ?.raw ||
      stagePacket
        ?.continuityPacket ||
      null;

    const rawUnresolvedReferences =
      this.toArray(
        packet
          ?.referenceResolution
          ?.unresolvedReferences ||
        packet?.unresolvedReferences ||
        stagePacket
          ?.referenceResolution
          ?.unresolvedReferences ||
        summary
          .continuityUnresolvedReferences
      );

    const resolvedUserQuestion =
      this.cleanText(
        packet?.resolvedUserQuestion ||
        packet
          ?.resolvedCurrentTurn
          ?.resolvedText ||
        packet
          ?.currentTurn
          ?.resolvedText ||
        stagePacket
          ?.currentTurn
          ?.resolvedText ||
        summary.resolvedUserQuestion ||
        ""
      );

    const originalText =
      this.cleanText(
        packet
          ?.currentTurn
          ?.originalText ||
        stagePacket
          ?.currentTurn
          ?.originalText ||
        summary.originalUserMessage ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    const ellipticalFollowUpResolved =
      packet
        ?.ellipticalFollowUpResolved ===
        true ||
      packet
        ?.currentTurn
        ?.ellipticalFollowUpResolved ===
        true ||
      stagePacket
        ?.currentTurn
        ?.ellipticalFollowUpResolved ===
        true ||
      summary.ellipticalFollowUpResolved ===
        true;

    const resolvedTextDiffers =
      Boolean(
        resolvedUserQuestion &&
        originalText
      ) &&
      this.normalizeForComparison(
        resolvedUserQuestion
      ) !==
      this.normalizeForComparison(
        originalText
      );

    const currentTurnWasResolved =
      packet
        ?.currentTurnWasResolved ===
        true ||
      packet
        ?.currentTurn
        ?.currentTurnWasResolved ===
        true ||
      stagePacket
        ?.currentTurn
        ?.currentTurnWasResolved ===
        true ||
      summary.currentTurnWasResolved ===
        true ||
      ellipticalFollowUpResolved ||
      resolvedTextDiffers;

    const resolutionComplete =
      currentTurnWasResolved &&
      Boolean(
        resolvedUserQuestion
      ) &&
      rawUnresolvedReferences.length ===
        0;

    const unresolvedReferences =
      resolutionComplete
        ? []
        : rawUnresolvedReferences;

    return {
      available:
        Boolean(
          stagePacket ||
          packet
        ),

      required:
        stagePacket
          ?.quality
          ?.continuityRequired ===
          true ||
        summary.continuityEligibility
          ?.eligible ===
          true,

      stagePacket,

      packet,

      activeDialogueState:
        summary.activeDialogueState ||
        stagePacket
          ?.contextAssembler
          ?.activeDialogueState ||
        null,

      binding:
        stagePacket
          ?.referenceResolution
          ?.binding ||
        summary
          .continuityReferenceBinding ||
        null,

      facts:
        this.toArray(
          packet?.usableFacts ||
          summary.continuityUsableFacts
        ),

      resolvedReferences:
        this.toArray(
          packet
            ?.referenceResolution
            ?.resolvedReferences ||
          packet?.resolvedReferences ||
          summary
            .continuityResolvedReferences
        ),

      rawUnresolvedReferences,

      rawUnresolvedReferenceCount:
        rawUnresolvedReferences.length,

      unresolvedReferences,

      effectiveUnresolvedReferenceCount:
        unresolvedReferences.length,

      referenceClarificationRequired:
        unresolvedReferences.length >
        0,

      originalText,

      resolvedUserQuestion:
        resolvedUserQuestion ||
        originalText,

      effectiveUserQuestion:
        resolvedUserQuestion ||
        originalText,

      currentTurnWasResolved,

      ellipticalFollowUpResolved,

      resolutionComplete,

      staleUnresolvedReferencesSuppressed:
        rawUnresolvedReferences.length >
          0 &&
        unresolvedReferences.length ===
          0,

      resolutionSource:
        ellipticalFollowUpResolved
          ? "elliptical_follow_up"
          : currentTurnWasResolved
            ? "resolved_current_turn"
            : "none",

      authority:
        "structured_continuity_evidence"
    };
  },

  /* =====================================================
     SAFETY
  ===================================================== */

  readSafetyContext(
    summary = {}
  ) {
    const stagePacket =
      summary.safetyStagePacket ||
      null;

    const disposition =
      summary.safetyDisposition ||
      stagePacket?.disposition ||
      {};

    const riskLevel =
      summary.resolvedSafetyRiskLevel ||
      disposition.riskLevel ||
      stagePacket?.riskLevel ||
      "none";

    const riskType =
      summary.resolvedSafetyRiskType ||
      disposition.riskType ||
      stagePacket?.riskType ||
      "none";

    const applicable =
      summary.safetyApplicable ===
        true ||
      stagePacket?.applicable ===
        true ||
      disposition.applicable ===
        true ||
      riskLevel !==
        "none";

    const shouldStopNormalResponse =
      summary
        .safetyShouldStopNormalResponse ===
        true ||
      disposition
        .shouldStopNormalResponse ===
        true ||
      stagePacket
        ?.shouldStopNormalResponse ===
        true;

    return {
      applicable,

      shouldStopNormalResponse,

      requiresClarification:
        summary
          .safetyRequiresClarification ===
          true ||
        disposition
          .requiresClarification ===
          true ||
        stagePacket
          ?.requiresClarification ===
          true,

      riskLevel,

      riskType,

      safetyAuthority:
        summary.resolvedSafetyAuthority ||
        disposition.safetyAuthority ||
        stagePacket?.authority ||
        "none",

      requiredPlanner:
        summary.safetyRequiredPlanner ||
        disposition.requiredPlanner ||
        null,

      communicationStyle:
        summary
          .safetyCommunicationStyle ||
        disposition
          .communicationStyle ||
        null,

      requiredBehaviors:
        this.mergeUnique(
          disposition
            .requiredBehaviors,

          stagePacket
            ?.requiredBehaviors,

          stagePacket
            ?.responseControl
            ?.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          disposition
            .forbiddenBehaviors,

          stagePacket
            ?.forbiddenBehaviors,

          stagePacket
            ?.responseControl
            ?.forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          disposition.constraints,

          stagePacket
            ?.constraints,

          stagePacket
            ?.responseControl
            ?.constraints
        ),

      contract:
        summary
          .safetyResponseContract ||
        stagePacket?.contract ||
        disposition.contract ||
        null,

      gate:
        summary.safetyContextGate ||
        null,

      deepReview:
        summary.deepSafetyResult ||
        null,

      disposition,

      stagePacket,

      authority:
        "authoritative_safety_governance"
    };
  },

  /* =====================================================
     KNOWLEDGE
  ===================================================== */

  readKnowledgeContext(
    summary = {}
  ) {
    const retrievalResults =
      this.toArray(
        summary
          .knowledgeRetrievalResults ||
        summary.knowledgeRouter
          ?.knowledgeRetrievalResults
      );

    const nodes =
      this.toArray(
        retrievalResults[0]
          ?.nodes ||
        summary.knowledgeNodes
      );

    const meaning =
      summary.knowledgeMeaning ||
      summary.knowledgeSynthesis ||
      null;

    return {
      available:
        Boolean(
          summary.knowledgeAnswer ||
          meaning ||
          nodes.length ||
          retrievalResults.length
        ),

      routerRan:
        summary.knowledgeRouterRan ===
        true,

      shouldUseKnowledge:
        summary.shouldUseKnowledge !==
        false,

      provider:
        summary.knowledgeProvider ||
        null,

      confidence:
        summary.knowledgeConfidence ||
        null,

      sources:
        this.toArray(
          summary.knowledgeSources
        ),

      answer:
        summary.knowledgeAnswer ||
        null,

      nodes,

      meaning,

      synthesis:
        summary.knowledgeSynthesis ||
        meaning ||
        null,

      blueprintHandoff:
        summary
          .blueprintKnowledgeHandoff ||
        meaning?.blueprintHandoff ||
        null,

      retrievalPlan:
        summary
          .knowledgeRetrievalPlan ||
        null,

      retrievalResults,

      authority:
        "retrieved_knowledge_evidence"
    };
  },

  /* =====================================================
     LANGUAGE
  ===================================================== */

  readLanguageContext(
    summary = {}
  ) {
    const mouth =
      summary.mouthDirector ||
      {};

    const guidance =
      summary.languageGuidanceHandoff ||
      {};

    return {
      communicationPlan:
        summary.communicationPlan ||
        {},

      humanLanguageProfile:
        summary.humanLanguageProfile ||
        {},

      languageGuidance:
        guidance,

      mouthDirective:
        summary.mouthDirective ||
        summary.situationContract
          ?.mouthDirective ||
        mouth ||
        null,

      expressionPlan:
        summary.expressionPlan ||
        mouth.expressionPlan ||
        null,

      lexicalGrounding:
        summary.lexicalGrounding ||
        summary
          .lexicalGroundingOutput ||
        null,

      preferredTerms:
        summary.preferredTerms ||
        summary.lexicalGrounding
          ?.preferredTerms ||
        summary
          .lexicalGroundingOutput
          ?.preferredTerms ||
        {},

      blueprintHint:
        summary.blueprintHint ||
        mouth.blueprintHint ||
        null,

      requiredBehaviors:
        this.mergeUnique(
          summary.responseRequired,
          mouth.responseRequired,
          guidance
            .requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          summary.responseAvoid,
          mouth.responseAvoid,
          guidance
            .forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          summary.responseConstraints,
          mouth.responseConstraints,
          guidance.constraints
        ),

      authority:
        "language_expression_guidance"
    };
  },

  /* =====================================================
     MEMORY
  ===================================================== */

  readMemoryContext(
    summary = {}
  ) {
    return {
      retrieval:
        summary.memoryRetrieval ||
        null,

      context:
        summary.memoryContext ||
        summary.memoryContextResult ||
        null,

      candidates:
        this.toArray(
          summary.memoryCandidates ||
          summary.memoryStagePacket
            ?.candidates ||
          summary.memoryHandoff
            ?.candidates
        ),

      facts:
        this.toArray(
          summary.memoryFacts ||
          summary.usableMemories
        ),

      handoff:
        summary.memoryHandoff ||
        null,

      authority:
        "authorized_memory_evidence_only"
    };
  },

  /* =====================================================
     DEVELOPER
  ===================================================== */

  readDeveloperContext({
    summary = {},
    request = {},
    responsePlan = {},
    responseStrategy = {}
  } = {}) {
    const rawPacket =
      summary.composerDeveloperPacket
        ?.enabled ===
        true
        ? summary
            .composerDeveloperPacket
        : null;

    const locked =
      summary.developerResponseLocked ===
        true ||
      summary.responseLocked ===
        true ||
      rawPacket?.locked ===
        true;

    const relevant =
      this.isDeveloperRelevant({
        summary,
        request,
        responsePlan,
        responseStrategy
      });

    const allowed =
      locked ||
      relevant;

    const lockedReply =
      locked
        ? this.cleanText(
            rawPacket?.reply ||
            rawPacket?.finalResponse ||
            summary.developerHandoff
              ?.reply ||
            summary.developerHandoff
              ?.finalResponse ||
            summary.developerReply ||
            summary.developerResponse ||
            ""
          )
        : "";

    return {
      applicable:
        relevant,

      relevant,

      allowed,

      locked,

      advisory:
        Boolean(
          allowed &&
          rawPacket &&
          !locked
        ),

      packet:
        allowed
          ? rawPacket
          : null,

      lockedReply:
        lockedReply ||
        null,

      githubEvidenceAllowed:
        allowed,

      codeEvidenceAllowed:
        allowed,

      staleEvidenceSuppressed:
        !allowed,

      reason:
        locked
          ? "developer_response_locked"
          : relevant
            ? "developer_context_relevant"
            : "developer_context_not_relevant",

      authority:
        "developer_evidence_access_policy"
    };
  },

  isDeveloperRelevant({
    summary = {},
    request = {},
    responsePlan = {},
    responseStrategy = {}
  } = {}) {
    const text =
      this.normalizeForComparison(
        request.currentText ||
        request.originalText ||
        ""
      );

    const rawText =
      request.currentText ||
      request.originalText ||
      "";

    const primary =
      this.normalizeIdentifier(
        responseStrategy.primaryLane ||
        summary.primaryLane ||
        summary.situationContractPrimary ||
        ""
      );

    const mode =
      this.normalizeIdentifier(
        typeof responseStrategy.mode ===
          "string"
          ? responseStrategy.mode
          : responseStrategy.mode?.mode ||
            ""
      );

    const intent =
      this.normalizeIdentifier(
        responseStrategy.intent ||
        summary.routingContract
          ?.primaryIntent ||
        ""
      );

    const blueprint =
      this.normalizeIdentifier(
        responsePlan.blueprintHint ||
        ""
      );

    const explicitFile =
      /\b[\w./-]+\.(?:js|mjs|cjs|html|css|json|md|ts|tsx|jsx|sql|py|yml|yaml)\b/i
        .test(
          rawText
        );

    const developerEntity =
      /\b(?:github|repo|repository|branch|commit|pull request|merge|deploy|vercel|supabase|codebase|api|pipeline|engine|composer|function|script|selector|markup|schema|debug|latency|runtime)\b/i
        .test(
          text
        );

    const developerAction =
      /\b(?:read|open|show|search|find|inspect|diagnose|debug|fix|patch|edit|update|change|replace|remove|rewrite|build|implement|wire|refactor|optimize|test|validate|send|generate)\b/i
        .test(
          text
        );

    const routedDeveloperAuthority =
      [
        "developer",
        "builder",
        "coding",
        "project_help",
        "developer_artifact"
      ].includes(
        primary
      ) ||
      [
        "developer",
        "builder"
      ].includes(
        mode
      ) ||
      intent.includes(
        "developer"
      ) ||
      intent.includes(
        "build_or_debug"
      ) ||
      blueprint.includes(
        "builder"
      ) ||
      summary
        .shouldRunDeveloperLayer ===
        true;

    return Boolean(
      routedDeveloperAuthority ||
      explicitFile ||
      (
        developerEntity &&
        developerAction
      )
    );
  },

  /* =====================================================
     RESPONSE CONTROL
  ===================================================== */

  buildResponseControl({
    responsePlan = {},
    safety = {},
    language = {},
    characterCandidate = {}
  } = {}) {
    return {
      responseGoal:
        responsePlan.responseGoal,

      responseShape:
        responsePlan.responseShape,

      responsePosture:
        responsePlan.responsePosture,

      responseOrder:
        responsePlan.responseOrder,

      responseMoves:
        responsePlan.responseMoves,

      currentNeed:
        responsePlan.currentNeed,

      adviceRequested:
        responsePlan.adviceRequested,

      advicePolicy:
        responsePlan.advicePolicy,

      coachingPermissionRequired:
        responsePlan
          .coachingPermissionRequired,

      questionPolicy: {
        shouldAskQuestion:
          responsePlan
            .shouldAskQuestion ===
          true,

        questionRequired:
          responsePlan
            .shouldAskQuestion ===
          true,

        purpose:
          responsePlan
            .questionPurpose,

        maximumQuestions:
          responsePlan.maxQuestions ??
          0
      },

      /*
       * Supporting authorities may add constraints.
       * They may not change canonical response moves.
       */
      requiredBehaviors:
        this.mergeUnique(
          responsePlan
            .requiredBehaviors,

          safety.requiredBehaviors,

          language.requiredBehaviors,

          characterCandidate
            .responseControl
            ?.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          responsePlan
            .forbiddenBehaviors,

          safety.forbiddenBehaviors,

          language.forbiddenBehaviors,

          characterCandidate
            .responseControl
            ?.forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          responsePlan.constraints,

          safety.constraints,

          language.constraints,

          characterCandidate
            .responseControl
            ?.constraints
        ),

      rules:
        this.mergeUnique(
          responsePlan
            .responseRules,

          characterCandidate
            .responseControl
            ?.rules
        ),

      blueprintHint:
        responsePlan.blueprintHint,

      communicationPlan:
        responsePlan
          .communicationPlan ||
        language.communicationPlan ||
        null,

      composerDirective:
        responsePlan
          .composerDirective ||
        null,

      writerInstructions:
        responsePlan
          .writerInstructions,

      characterControl: {
        available:
          characterCandidate.available ===
          true,

        answerAvailable:
          characterCandidate
            .answerAvailable ===
          true,

        candidateAvailable:
          characterCandidate
            .candidateAvailable ===
          true,

        needsAIWriter:
          characterCandidate
            .needsAIWriter ===
          true,

        status:
          characterCandidate.status ||
          null,

        grounding:
          characterCandidate.grounding ||
          null,

        realization:
          characterCandidate.realization ||
          null
      },

      canonicalResponsePlanAvailable:
        responsePlan.available ===
        true,

      canonicalResponsePlanReady:
        responsePlan.ready ===
        true,

      canonicalResponsePlanUsable:
        responsePlan.usable ===
        true,

      authority:
        "canonical_plan_control_projection"
    };
  },

  /* =====================================================
     COMPOSER PACKET
  ===================================================== */

  buildComposerPacket({
    summary = {},
    request = {},
    responsePlan = {},
    responseStrategy = {},
    responseControl = {},
    continuity = {},
    safety = {},
    knowledge = {},
    language = {},
    memory = {},
    developer = {},
    characterHandoff = {},
    characterCandidate = {},
    evidence = {}
  } = {}) {
    const canonicalPlanReady =
      responsePlan.available ===
        true &&
      responsePlan.ready ===
        true &&
      responsePlan.usable ===
        true;

    const currentTurnAvailable =
      Boolean(
        request.currentText ||
        request.originalText
      );

    const lockedDeveloperReply =
      developer.locked ===
        true
        ? developer.lockedReply
        : null;

    const ready =
      Boolean(
        lockedDeveloperReply ||
        (
          currentTurnAvailable &&
          canonicalPlanReady
        )
      );

    const validation =
      this.validateComposerPacketInput({
        request,
        responsePlan,
        continuity,
        characterCandidate,
        lockedDeveloperReply
      });

    return {
      schema:
        "ari_composer_packet",

      schemaVersion:
        this.schemaVersion,

      ready,

      usable:
        ready &&
        validation.errors.length ===
          0,

      source:
        this.source,

      version:
        this.version,

      authorityLevel:
        this.authorityLevel,

      createdAt:
        new Date()
          .toISOString(),

      request,

      turnId:
        request.turnId,

      userQuestion:
        request.currentText,

      originalUserQuestion:
        request.originalText,

      resolvedUserQuestion:
        request.resolvedText,

      currentTurnText:
        request.currentText,

      effectiveUserQuestion:
        request.effectiveText,

      semanticInputText:
        request.semanticInputText,

      currentTurnWasResolved:
        request.currentTurnWasResolved ===
        true,

      ellipticalFollowUpResolved:
        request
          .ellipticalFollowUpResolved ===
        true,

      resolutionSource:
        request.resolutionSource,

      currentTurnTextPreserved:
        request.originalTextPreserved ===
        true,

      contextLane:
        responseStrategy.contextLane ||
        request.contextLane ||
        "direct_current_turn",

      primary:
        responseStrategy.primaryLane ||
        summary.primaryLane ||
        "general_understanding",

      /*
       * Canonical Response Plan.
       */
      responsePlan,

      canonicalResponsePlan:
        responsePlan,

      responsePlanAvailable:
        responsePlan.available ===
        true,

      responsePlanReady:
        responsePlan.ready ===
        true,

      responsePlanUsable:
        responsePlan.usable ===
        true,

      responseStrategy,

      responseControl,

      responseGoal:
        responseControl.responseGoal,

      responseShape:
        responseControl.responseShape,

      responsePosture:
        responseControl.responsePosture,

      responseOrder:
        responseControl.responseOrder,

      responseMoves:
        responseControl.responseMoves,

      currentNeed:
        responseControl.currentNeed,

      adviceRequested:
        responseControl.adviceRequested,

      advicePolicy:
        responseControl.advicePolicy,

      coachingPermissionRequired:
        responseControl
          .coachingPermissionRequired,

      shouldAskQuestion:
        responseControl
          .questionPolicy
          .shouldAskQuestion,

      questionPurpose:
        responseControl
          .questionPolicy
          .purpose,

      writerInstructions:
        responseControl
          .writerInstructions,

      responseRules:
        responseControl.rules,

      responseConstraints:
        responseControl.constraints,

      requiredBehaviors:
        responseControl
          .requiredBehaviors,

      forbiddenBehaviors:
        responseControl
          .forbiddenBehaviors,

      responseRequired:
        responseControl
          .requiredBehaviors,

      responseAvoid:
        responseControl
          .forbiddenBehaviors,

      blueprintHint:
        responseControl
          .blueprintHint,

      communicationPlan:
        responseControl
          .communicationPlan,

      composerDirective:
        responseControl
          .composerDirective,

      /*
       * One canonical focused Character candidate.
       */
      characterCandidate,

      characterHandoff:
        characterHandoff.raw ||
        null,

      characterAvailable:
        characterCandidate.available ===
        true,

      characterAnswerAvailable:
        characterCandidate
          .answerAvailable ===
        true,

      characterGuidanceAvailable:
        characterCandidate
          .guidanceAvailable ===
        true,

      characterCandidateAllowed:
        characterCandidate
          .candidateAllowed ===
        true,

      characterCandidateAvailable:
        characterCandidate
          .candidateAvailable ===
        true,

      characterCandidatePreferred:
        characterCandidate
          .candidatePreferred ===
        true,

      characterDraft:
        characterCandidate.draft ||
        "",

      characterDeterministicDraft:
        characterCandidate
          .deterministicDraft ||
        "",

      characterMode:
        characterCandidate.mode ||
        "silent",

      characterType:
        characterCandidate.type ||
        null,

      characterSubtype:
        characterCandidate.subtype ||
        null,

      characterFocus:
        characterCandidate.focus ||
        null,

      characterPreferenceSubject:
        characterCandidate
          .preferenceSubject ||
        null,

      characterStatus:
        characterCandidate.status ||
        null,

      characterGrounding:
        characterCandidate.grounding ||
        null,

      characterRealization:
        characterCandidate.realization ||
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
        "",

      characterAuthorityChain:
        characterCandidate
          .authorityChain ||
        [],

      characterAuthorityPacket:
        characterCandidate
          .authorityPacket ||
        null,

      /*
       * Supporting evidence.
       */
      continuity,

      activeDialogueState:
        continuity
          .activeDialogueState ||
        null,

      safety,

      knowledge,

      memory,

      languageGuidance:
        language.languageGuidance,

      humanLanguageProfile:
        language
          .humanLanguageProfile,

      expressionPlan:
        language.expressionPlan,

      mouthDirective:
        language.mouthDirective,

      lexicalGrounding:
        language.lexicalGrounding,

      preferredTerms:
        language.preferredTerms,

      developer,

      developerPacket:
        developer.packet,

      hasDeveloperPacket:
        Boolean(
          developer.packet
        ),

      developerPacketLocked:
        developer.locked ===
        true,

      developerPacketAdvisory:
        developer.advisory ===
        true,

      developerRelevant:
        developer.relevant ===
        true,

      lockedDeveloperReply,

      thesis:
        this.buildThesis(
          summary
        ),

      evidence,

      candidatePolicy:
        this.buildCandidatePolicy({
          canonicalPlanReady,
          developer,
          responsePlan,
          characterCandidate
        }),

      validation: {
        valid:
          ready &&
          validation.errors.length ===
            0,

        currentTurnAvailable,

        canonicalResponsePlanAvailable:
          responsePlan.available ===
          true,

        canonicalResponsePlanReady:
          responsePlan.ready ===
          true,

        canonicalResponsePlanUsable:
          responsePlan.usable ===
          true,

        lockedDeveloperReplyAvailable:
          Boolean(
            lockedDeveloperReply
          ),

        characterAvailable:
          characterCandidate.available ===
          true,

        characterAnswerAvailable:
          characterCandidate
            .answerAvailable ===
          true,

        characterCandidateAvailable:
          characterCandidate
            .candidateAvailable ===
          true,

        characterGrounded:
          characterCandidate.grounded ===
          true,

        errors:
          validation.errors,

        warnings:
          validation.warnings
      },

      authority:
        this.getAuthorityBoundaries()
    };
  },

  buildCandidatePolicy({
    canonicalPlanReady = false,
    developer = {},
    responsePlan = {},
    characterCandidate = {}
  } = {}) {
    return {
      deterministicWriterAllowed:
        canonicalPlanReady &&
        developer.locked !==
          true,

      blueprintWriterAllowed:
        canonicalPlanReady &&
        developer.locked !==
          true &&
        responsePlan.blueprint
          ?.enabled !==
          false,

      aiWriterAllowed:
        canonicalPlanReady &&
        developer.locked !==
          true &&
        responsePlan.blueprint
          ?.aiAllowed !==
          false,

      aiRepairAllowed:
        canonicalPlanReady &&
        developer.locked !==
          true,

      lockedDeveloperReplyPreferred:
        developer.locked ===
        true,

      blueprintMustFollowResponseMoves:
        true,

      blueprintMayRenderInternalInstructions:
        false,

      incompleteBlueprintRequiresRepair:
        true,

      unsupportedMoveRequiresRepair:
        true,

      finalCandidateMustSatisfyPlan:
        true,

      finalCandidateMustPreserveCurrentTurn:
        true,

      finalCandidateMustRespectSafety:
        true,

      character: {
        available:
          characterCandidate.available ===
          true,

        answerAvailable:
          characterCandidate
            .answerAvailable ===
          true,

        grounded:
          characterCandidate.grounded ===
          true,

        candidateAllowed:
          characterCandidate
            .candidateAllowed ===
          true,

        candidatePreferred:
          characterCandidate
            .candidatePreferred ===
          true,

        localCandidateAvailable:
          characterCandidate
            .candidateAvailable ===
          true,

        localCandidateText:
          characterCandidate
            .candidateAvailable ===
            true
            ? characterCandidate
                .deterministicDraft
            : "",

        aiRealizationAllowed:
          characterCandidate
            .answerAvailable ===
            true &&
          characterCandidate
            .needsAIWriter ===
            true,

        aiRealizationRequired:
          characterCandidate
            .aiRealizationRequired ===
          true,

        aiWriterMode:
          characterCandidate
            .aiWriterMode ||
          null,

        aiInstruction:
          characterCandidate
            .aiInstruction ||
          "",

        preserveMeaning:
          characterCandidate
            .preserveMeaning !==
          false,

        preserveStatus:
          characterCandidate
            .preserveStatus !==
          false,

        preserveValue:
          characterCandidate
            .preserveValue ===
          true,

        preservePosition:
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

        mayVaryWording:
          characterCandidate
            .mayVaryWording !==
          false,

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

      groundedCharacterCandidateAllowed:
        characterCandidate
          .candidateAllowed ===
        true,

      groundedCharacterCandidatePreferred:
        characterCandidate
          .candidatePreferred ===
        true,

      characterAIRealizationAllowed:
        characterCandidate
          .answerAvailable ===
          true &&
        characterCandidate
          .needsAIWriter ===
          true,

      characterMeaningMustBePreserved:
        true,

      characterStatusMustBePreserved:
        true,

      characterAuthorityMayNotBeModified:
        true
    };
  },

  validateComposerPacketInput({
    request = {},
    responsePlan = {},
    continuity = {},
    characterCandidate = {},
    lockedDeveloperReply = null
  } = {}) {
    const errors = [];
    const warnings = [];

    if (lockedDeveloperReply) {
      return {
        errors,
        warnings
      };
    }

    if (
      !request.originalText
    ) {
      errors.push({
        type:
          "current_turn_missing"
      });
    }

    if (
      responsePlan.available !==
      true
    ) {
      errors.push({
        type:
          "canonical_response_plan_missing"
      });
    }

    if (
      responsePlan.available ===
        true &&
      responsePlan.ready !==
        true
    ) {
      errors.push({
        type:
          "canonical_response_plan_not_ready"
      });
    }

    if (
      responsePlan.available ===
        true &&
      responsePlan.usable !==
        true
    ) {
      errors.push({
        type:
          "canonical_response_plan_not_usable"
      });
    }

    if (
      responsePlan.available ===
        true &&
      responsePlan.responseMoves
        .length ===
        0
    ) {
      errors.push({
        type:
          "canonical_response_moves_missing"
      });
    }

    if (
      request.turnId &&
      responsePlan.turnId &&
      String(
        request.turnId
      ) !==
      String(
        responsePlan.turnId
      )
    ) {
      warnings.push({
        type:
          "response_plan_turn_mismatch",

        requestTurnId:
          request.turnId,

        responsePlanTurnId:
          responsePlan.turnId
      });
    }

    if (
      continuity.required ===
        true &&
      continuity.available !==
        true
    ) {
      warnings.push({
        type:
          "required_continuity_unavailable"
      });
    }

    if (
      continuity
        .effectiveUnresolvedReferenceCount >
        0 &&
      responsePlan
        .shouldAskQuestion !==
        true
    ) {
      warnings.push({
        type:
          "unresolved_references_without_question_policy",

        count:
          continuity
            .effectiveUnresolvedReferenceCount
      });
    }

    if (
      characterCandidate
        .answerAvailable ===
        true &&
      characterCandidate.grounded !==
        true
    ) {
      warnings.push({
        type:
          "character_answer_not_grounded"
      });
    }

    if (
      characterCandidate
        .answerAvailable ===
        true &&
      characterCandidate
        .needsAIWriter !==
        true &&
      !characterCandidate
        .deterministicDraft
    ) {
      warnings.push({
        type:
          "character_answer_without_deterministic_draft"
      });
    }

    if (
      characterCandidate.status
        ?.inferred ===
        true &&
      characterCandidate
        .tentativeLanguageRequired !==
        true
    ) {
      warnings.push({
        type:
          "inferred_character_answer_missing_tentative_language_rule"
      });
    }

    if (
      characterCandidate.status
        ?.open ===
        true &&
      characterCandidate
        .preserveOpenStatus !==
        true
    ) {
      warnings.push({
        type:
          "open_character_status_not_protected"
      });
    }

    return {
      errors,
      warnings
    };
  },

  buildThesis(summary = {}) {
    const contract =
      summary.situationContract ||
      {};

    return {
      value:
        contract.situationThesis
          ?.thesis ||
        summary.primarySituationThesis ||
        null,

      narrative:
        contract.situationThesis
          ?.narrative ||
        summary.situationNarrative ||
        null,

      recommendedUse:
        contract.situationThesis
          ?.recommendedUse ||
        summary.thesisRecommendedUse ||
        "do_not_use_as_authority",

      authority:
        "advisory_situation_summary"
    };
  },

  /* =====================================================
     EVIDENCE
  ===================================================== */

  buildEvidence({
    summary = {},
    request = {},
    responsePlan = {},
    responseStrategy = {},
    continuity = {},
    safety = {},
    knowledge = {},
    language = {},
    memory = {},
    developer = {},
    characterHandoff = {},
    characterCandidate = {}
  } = {}) {
    const allowDeveloperEvidence =
      developer.allowed ===
      true;

    return {
      request,

      perceptionPacket:
        summary.perceptionPacket ||
        null,

      executivePacket:
        summary.executivePacket ||
        null,

      deliberationPacket:
        summary.deliberationPacket ||
        null,

      responsePlanningStagePacket:
        summary
          .responsePlanningStagePacket ||
        null,

      responsePlan,

      responseStrategy,

      continuity,

      safety,

      focusedCharacter: {
        handoffAvailable:
          characterHandoff.available ===
          true,

        candidate:
          characterCandidate
      },

      characterCandidate,

      languageGuidance:
        language.languageGuidance,

      humanLanguageProfile:
        language
          .humanLanguageProfile,

      lexicalGrounding:
        language.lexicalGrounding,

      preferredTerms:
        language.preferredTerms,

      expressionPlan:
        language.expressionPlan,

      knowledge,

      memory,

      reasoning:
        summary.reasoning ||
        summary.reasoningStagePacket ||
        null,

      understanding: {
        language:
          summary
            .languageUnderstanding ||
          null,

        semantic:
          summary
            .semanticUnderstanding ||
          null,

        event:
          summary.eventUnderstanding ||
          null,

        meaning:
          summary
            .meaningInterpretation ||
          null,

        humanState:
          summary.humanState ||
          null,

        handoff:
          summary
            .understandingHandoff ||
          null
      },

      github:
        allowDeveloperEvidence
          ? (
              summary.githubEvidence ||
              summary.githubFileContext ||
              null
            )
          : null,

      codeUnderstanding:
        allowDeveloperEvidence
          ? (
              summary.codeUnderstanding ||
              summary
                .rebirthCodeUnderstanding ||
              null
            )
          : null,

      developerUnderstanding:
        allowDeveloperEvidence
          ? (
              summary
                .developerUnderstanding ||
              summary
                .rebirthDeveloperUnderstanding ||
              null
            )
          : null,

      developerIntent:
        allowDeveloperEvidence
          ? (
              summary.developerIntent ||
              developer.packet
                ?.intent ||
              null
            )
          : null,

      developerHandoff:
        allowDeveloperEvidence
          ? summary
              .developerHandoff ||
            null
          : null,

      developerResponse:
        allowDeveloperEvidence
          ? summary
              .developerResponse ||
            null
          : null,

      developerReply:
        developer.locked ===
          true
          ? developer.lockedReply
          : null,

      developerPacket:
        allowDeveloperEvidence
          ? developer.packet
          : null,

      developerEvidenceSuppressed:
        !allowDeveloperEvidence
    };
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canPackageComposerContext:
        true,

      canPreserveCanonicalRequest:
        true,

      canPreserveCanonicalResponsePlan:
        true,

      canProjectCompatibilityFields:
        true,

      canPackageFocusedCharacterHandoff:
        true,

      canCreateFocusedCharacterCandidateContract:
        true,

      canFilterIrrelevantDeveloperEvidence:
        true,

      canMergeSupportingConstraints:
        true,

      canCreateFallbackResponsePlan:
        false,

      canInterpretCurrentMeaning:
        false,

      canChangeRequestedOperation:
        false,

      canChooseResponseGoal:
        false,

      canChooseResponseShape:
        false,

      canAddResponseMoves:
        false,

      canRemoveResponseMoves:
        false,

      canReorderResponseMoves:
        false,

      canModifyQuestionPolicy:
        false,

      canRewriteWriterInstructions:
        false,

      canResolveCharacterPreference:
        false,

      canResolveCharacterIdentity:
        false,

      canResolveCharacterWorldview:
        false,

      canInferCharacterAuthority:
        false,

      canMergeCharacterAuthorities:
        false,

      canCreateCanonicalPreference:
        false,

      canPromoteInferenceToCanonical:
        false,

      canCreateWorldviewPosition:
        false,

      canExposeEntirePreferenceCollection:
        false,

      canExposeEntireWorldviewCollection:
        false,

      canDetermineBlueprintEligibility:
        false,

      canDetermineAIWriterNeed:
        false,

      canGenerateDraftCandidate:
        false,

      canSelectFinalDraft:
        false,

      canWriteFinalLanguage:
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
        "canonical_expression_packet_packaging"
    };
  },

  validate() {
    const authority =
      this.getAuthorityBoundaries();

    const errors = [];

    const forbiddenAuthorities = [
      "canCreateFallbackResponsePlan",
      "canInterpretCurrentMeaning",
      "canChangeRequestedOperation",
      "canChooseResponseGoal",
      "canChooseResponseShape",
      "canAddResponseMoves",
      "canRemoveResponseMoves",
      "canReorderResponseMoves",
      "canModifyQuestionPolicy",
      "canRewriteWriterInstructions",
      "canResolveCharacterPreference",
      "canResolveCharacterIdentity",
      "canResolveCharacterWorldview",
      "canInferCharacterAuthority",
      "canMergeCharacterAuthorities",
      "canCreateCanonicalPreference",
      "canPromoteInferenceToCanonical",
      "canCreateWorldviewPosition",
      "canExposeEntirePreferenceCollection",
      "canExposeEntireWorldviewCollection",
      "canDetermineBlueprintEligibility",
      "canDetermineAIWriterNeed",
      "canGenerateDraftCandidate",
      "canSelectFinalDraft",
      "canWriteFinalLanguage",
      "canOverrideSafety",
      "canRetrieveUserMemory",
      "canStoreUserMemory",
      "canAccessSupabase",
      "canPersistState"
    ];

    forbiddenAuthorities.forEach(
      key => {
        if (
          authority[key] ===
          true
        ) {
          errors.push(
            `${key}_must_be_false`
          );
        }
      }
    );

    return {
      valid:
        errors.length ===
        0,

      source:
        "ari-composer-bridge-validation",

      version:
        this.version,

      errors,

      warnings:
        [],

      authority
    };
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

  firstFiniteNumber(
    values = []
  ) {
    for (
      const value
      of this.toArray(values)
    ) {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        continue;
      }

      const number =
        Number(
          value
        );

      if (
        Number.isFinite(
          number
        )
      ) {
        return number;
      }
    }

    return null;
  },

  normalizeConfidence(
    value = 0
  ) {
    if (
      typeof value ===
      "string"
    ) {
      const labels = {
        none: 0,
        very_low: 0.2,
        low: 0.4,
        medium: 0.65,
        medium_high: 0.75,
        high: 0.85,
        very_high: 0.95,
        critical: 0.98
      };

      const normalized =
        this.normalizeIdentifier(
          value
        );

      if (
        labels[normalized] !==
        undefined
      ) {
        return labels[
          normalized
        ];
      }
    }

    const number =
      Number(
        value
      );

    if (
      !Number.isFinite(
        number
      )
    ) {
      return 0;
    }

    if (
      number >
      1
    ) {
      return Math.max(
        0,
        Math.min(
          1,
          number /
          100
        )
      );
    }

    return Math.max(
      0,
      Math.min(
        1,
        number
      )
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

  mergeUnique(
    ...values
  ) {
    const output = [];
    const seen =
      new Set();

    values
      .flatMap(
        value =>
          this.toArray(
            value
          )
      )
      .forEach(
        value => {
          const key =
            typeof value ===
              "string"
              ? this
                  .normalizeForComparison(
                    value
                  )
              : this
                  .normalizeForComparison(
                    value?.id ||
                    value?.name ||
                    value?.type ||
                    value?.value ||
                    value?.claim ||
                    this.safeJSONStringify(
                      value
                    )
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

  safeJSONStringify(
    value = null
  ) {
    const seen =
      new WeakSet();

    try {
      return JSON.stringify(
        value,
        (
          key,
          nestedValue
        ) => {
          if (
            nestedValue &&
            typeof nestedValue ===
              "object"
          ) {
            if (
              seen.has(
                nestedValue
              )
            ) {
              return "[Circular]";
            }

            seen.add(
              nestedValue
            );
          }

          return nestedValue;
        }
      );
    } catch (error) {
      return "";
    }
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

window.Ari.composerBridge =
  window.AriComposerBridge;

console.log(
  "ARI COMPOSER BRIDGE LOADED:",
  window.AriComposerBridge?.version,
  window.AriComposerBridge
    ?.validate?.().valid ===
    true
    ? "READY"
    : "INVALID"
);