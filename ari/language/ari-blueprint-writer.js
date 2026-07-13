// ari/language/ari-blueprint-writer.js
// Ari Blueprint Writer
//
// Purpose:
// Render a fast deterministic response candidate from the canonical
// Response Plan contained in the Composer Packet.
//
// V2.0.0 — Canonical Response Move Renderer / No Independent Planning
//
// Architectural flow:
//
// Canonical Response Plan
//      ↓
// Composer Packet
//      ↓
// Blueprint Writer
//      ↓
// Deterministic Draft Candidate
//      ↓
// Candidate Arbiter
//
// Responsibilities:
// - Read the canonical response moves in their official order.
// - Render only supported deterministic response moves.
// - Preserve the current user turn.
// - Respect advice, question, safety, developer, and length policies.
// - Report unsupported or incomplete moves.
// - Request AI repair when deterministic rendering is insufficient.
// - Return structured render diagnostics for candidate arbitration.
//
// Non-responsibilities:
// - Does not reinterpret the user’s language.
// - Does not detect conversation intent.
// - Does not choose the response goal.
// - Does not choose the response shape.
// - Does not choose whether advice is appropriate.
// - Does not create a new response plan.
// - Does not replace unsupported moves with generic meta-language.
// - Does not select the final response candidate.
// - Does not compose the final response.
// - Does not override safety.
// - Does not persist memory.

window.Ari = window.Ari || {};

window.AriBlueprintWriter = {
  version: "2.0.0",
  schemaVersion: "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  write(input = {}) {
    const packet =
      input.composerPacket ||
      input.packet ||
      input ||
      {};

    if (
      !packet ||
      typeof packet !== "object" ||
      packet.ready !== true
    ) {
      return this.returnDraft({
        draft: "",
        reason: "composer_packet_missing_or_not_ready",
        usedBlueprint: false,
        usable: false,
        requiresAIRepair: true,
        packet
      });
    }

    const request =
      this.readRequest(packet);

    if (!request.currentText) {
      return this.returnDraft({
        draft: "",
        reason: "current_turn_missing",
        usedBlueprint: false,
        usable: false,
        requiresAIRepair: true,
        packet
      });
    }

    const writerContract =
      this.readWriterContract(packet);

    const lockedDeveloperDraft =
      this.readLockedDeveloperDraft(
        packet
      );

    if (lockedDeveloperDraft) {
      return this.returnDraft({
        draft:
          lockedDeveloperDraft,

        reason:
          "locked_developer_reply",

        usedBlueprint:
          false,

        usable:
          true,

        requiresAIRepair:
          false,

        packet,

        blueprint: {
          id:
            "developer_locked_response",

          source:
            "composer_packet",

          strategy:
            "locked_developer_handoff",

          aiAllowed:
            false
        },

        renderResult: {
          complete:
            true,

          supportedMoveCount:
            0,

          unsupportedMoveCount:
            0,

          skippedMoveCount:
            0,

          renderedMoves: [],

          unsupportedMoves: [],

          skippedMoves: [],

          warnings: []
        }
      });
    }

    const memoryAcknowledgment =
      this.renderMemoryAcknowledgment({
        packet,
        request,
        writerContract
      });

    if (memoryAcknowledgment) {
      return this.returnDraft({
        draft:
          memoryAcknowledgment,

        reason:
          "deterministic_memory_acknowledgment",

        usedBlueprint:
          true,

        usable:
          true,

        requiresAIRepair:
          false,

        packet,

        blueprint: {
          id:
            "memory_direct_acknowledgment",

          source:
            "ari-blueprint-writer",

          strategy:
            "memory_acknowledgment",

          aiAllowed:
            false
        },

        renderResult: {
          complete:
            true,

          supportedMoveCount:
            1,

          unsupportedMoveCount:
            0,

          skippedMoveCount:
            0,

          renderedMoves: [
            {
              id:
                "memory_acknowledgment",

              rendered:
                true
            }
          ],

          unsupportedMoves: [],

          skippedMoves: [],

          warnings: []
        }
      });
    }

    const trustedKnowledgeDraft =
      this.renderTrustedKnowledge({
        packet,
        request,
        writerContract
      });

    if (
      trustedKnowledgeDraft
        ?.draft
    ) {
      return this.returnDraft({
        draft:
          trustedKnowledgeDraft
            .draft,

        reason:
          trustedKnowledgeDraft
            .reason,

        usedBlueprint:
          true,

        usable:
          true,

        requiresAIRepair:
          false,

        packet,

        blueprint: {
          id:
            trustedKnowledgeDraft
              .blueprintId ||
            "knowledge_response",

          source:
            "ari-blueprint-writer",

          strategy:
            "trusted_knowledge_rendering",

          aiAllowed:
            true
        },

        renderResult:
          trustedKnowledgeDraft
            .renderResult
      });
    }

    const renderResult =
      this.renderCanonicalPlan({
        packet,
        request,
        writerContract
      });

    const draft =
      this.finalizeDraft({
        sentences:
          renderResult.sentences,

        packet,

        writerContract
      });

    const quality =
      this.evaluateDraft({
        draft,
        packet,
        request,
        writerContract,
        renderResult
      });

    return this.returnDraft({
      draft,

      reason:
        quality.reason,

      usedBlueprint:
        renderResult
          .renderedMoves
          .length > 0,

      usable:
        quality.usable,

      requiresAIRepair:
        quality
          .requiresAIRepair,

      packet,

      blueprint:
        this.buildBlueprintRecord({
          packet,
          writerContract,
          renderResult
        }),

      renderResult: {
        ...renderResult,

        complete:
          quality.complete,

        quality
      }
    });
  },

  /* =====================================================
     REQUEST READING
  ===================================================== */

  readRequest(packet = {}) {
    const packetRequest =
      packet.request ||
      {};

    const currentText =
      this.cleanOriginal(
        packetRequest.currentText ||
        packetRequest.originalText ||
        packet.currentTurnText ||
        packet.originalUserQuestion ||
        packet.userQuestion ||
        ""
      );

    return {
      turnId:
        packetRequest.turnId ||
        null,

      currentText,

      originalText:
        this.cleanOriginal(
          packetRequest.originalText ||
          currentText
        ),

      normalizedText:
        this.normalize(
          packetRequest.normalizedText ||
          currentText
        ),

      contextLane:
        packetRequest.contextLane ||
        packet.contextLane ||
        "direct_current_turn",

      requiresPriorContext:
        packetRequest
          .requiresPriorContext ===
          true,

      textWasRewritten:
        packetRequest
          .textWasRewritten ===
          true,

      originalTextPreserved:
        packetRequest
          .originalTextPreserved !==
          false,

      authority:
        "composer_packet_current_turn"
    };
  },

  /* =====================================================
     WRITER CONTRACT
  ===================================================== */

  readWriterContract(packet = {}) {
    const responsePlan =
      packet.canonicalResponsePlan ||
      packet.responsePlan ||
      {};

    const responseControl =
      packet.responseControl ||
      {};

    const instructions =
      packet.writerInstructions ||
      responseControl
        .writerInstructions ||
      responsePlan
        .writerInstructions ||
      {};

    const rawMoves =
      packet.responseMoves ||
      responseControl.responseMoves ||
      responsePlan.responseMoves ||
      instructions.responseMoves ||
      instructions.moves ||
      [];

    const responseMoves =
      this.normalizeMoves(
        rawMoves
      );

    const requiredBehaviors =
      this.mergeUnique(
        packet.requiredBehaviors,
        packet.responseRequired,
        responseControl
          .requiredBehaviors,
        responsePlan
          .requiredBehaviors,
        instructions
          .requiredBehaviors,
        instructions.required
      );

    const forbiddenBehaviors =
      this.mergeUnique(
        packet.forbiddenBehaviors,
        packet.responseAvoid,
        responseControl
          .forbiddenBehaviors,
        responsePlan
          .forbiddenBehaviors,
        instructions
          .forbiddenBehaviors,
        instructions.avoid
      );

    const constraints =
      this.mergeUnique(
        packet.responseConstraints,
        responseControl.constraints,
        responsePlan.constraints,
        instructions.constraints
      );

    const responseRules =
      this.mergeUnique(
        packet.responseRules,
        responseControl.rules,
        responsePlan.responseRules,
        instructions.responseRules,
        instructions.rules
      );

    const questionPolicy =
      responseControl
        .questionPolicy ||
      {};

    const shouldAskQuestion =
      packet.shouldAskQuestion ===
        true ||
      questionPolicy
        .shouldAskQuestion ===
        true ||
      responsePlan
        .shouldAskQuestion ===
        true ||
      instructions
        .questionRequired ===
        true;

    const questionPurpose =
      packet.questionPurpose ||
      questionPolicy.purpose ||
      responsePlan.questionPurpose ||
      instructions.questionPurpose ||
      null;

    const finalQuestionAllowed =
      instructions
        .finalQuestionAllowed ===
        true ||
      shouldAskQuestion;

    const maximumQuestions =
      Number.isFinite(
        Number(
          questionPolicy
            .maximumQuestions
        )
      )
        ? Number(
            questionPolicy
              .maximumQuestions
          )
        : (
            finalQuestionAllowed
              ? 1
              : 0
          );

    return {
      schema:
        "ari_blueprint_writer_contract",

      schemaVersion:
        this.schemaVersion,

      responseGoal:
        packet.responseGoal ||
        responseControl
          .responseGoal ||
        responsePlan.responseGoal ||
        "answer_user",

      responseShape:
        packet.responseShape ||
        responseControl
          .responseShape ||
        responsePlan.responseShape ||
        instructions.shape ||
        "clear_explanation",

      responsePosture:
        packet.responsePosture ||
        responseControl
          .responsePosture ||
        responsePlan
          .responsePosture ||
        instructions.posture ||
        null,

      responseMoves,

      advicePolicy:
        packet.advicePolicy ||
        responseControl
          .advicePolicy ||
        responsePlan.advicePolicy ||
        "allowed_if_useful",

      coachingPermissionRequired:
        packet
          .coachingPermissionRequired ===
          true ||
        responseControl
          .coachingPermissionRequired ===
          true ||
        responsePlan
          .coachingPermissionRequired ===
          true,

      shouldAskQuestion,

      questionPurpose,

      finalQuestionAllowed,

      maximumQuestions,

      requiredBehaviors,

      forbiddenBehaviors,

      constraints,

      responseRules,

      blueprintHint:
        packet.blueprintHint ||
        responseControl
          .blueprintHint ||
        responsePlan.blueprintHint ||
        null,

      maxSentences:
        this.firstFiniteNumber([
          instructions.maxSentences,
          packet.communicationPlan
            ?.languageBudget
            ?.maxSentences,
          4
        ]),

      minimumSentences:
        this.firstFiniteNumber([
          instructions.minimumSentences,
          1
        ]),

      maxWords:
        this.firstFiniteNumber([
          instructions.maxWords,
          packet.communicationPlan
            ?.languageBudget
            ?.maxWords,
          null
        ]),

      answerFirst:
        instructions.answerFirst !==
        false,

      useConcreteTerms:
        instructions.useConcreteTerms !==
        false,

      preserveMoveOrder:
        instructions
          .preserveMoveOrder !==
        false,

      unsupportedMovePolicy:
        instructions
          .unsupportedMovePolicy ||
        packet.candidatePolicy
          ?.unsupportedMoveRequiresRepair ===
          true
          ? "request_ai_repair"
          : "skip",

      incompletePlanPolicy:
        instructions
          .incompletePlanPolicy ||
        packet.candidatePolicy
          ?.incompleteBlueprintRequiresRepair ===
          true
          ? "request_ai_repair"
          : "allow_partial",

      emptyDraftPolicy:
        instructions
          .emptyDraftPolicy ||
        "request_ai_repair",

      internalInstructionsAreNotUserFacing:
        instructions
          .internalInstructionsAreNotUserFacing !==
        false,

      doNotRenderInstructionText:
        instructions
          .doNotRenderInstructionText !==
        false,

      doNotWrite:
        this.mergeUnique(
          instructions.doNotWrite,
          [
            "internal planner instructions",
            "pipeline diagnostics",
            "meta commentary about answering"
          ]
        ),

      candidatePolicy:
        packet.candidatePolicy ||
        {},

      authority:
        "canonical_writer_contract"
    };
  },

  normalizeMoves(moves = []) {
    return this.toArray(moves)
      .map(
        (
          move,
          index
        ) => {
          if (
            typeof move ===
            "string"
          ) {
            return {
              id:
                this.normalizeMoveId(
                  move
                ),

              order:
                index,

              required:
                true,

              userFacing:
                true,

              renderPolicy:
                "render_or_ai_repair",

              contentHint:
                null,

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
            this.normalizeMoveId(
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
                Number(move.order)
              )
                ? Number(move.order)
                : index,

            required:
              move.required !==
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

            contentHint:
              move.contentHint ||
              move.hint ||
              null,

            evidenceRefs:
              this.toArray(
                move.evidenceRefs
              ),

            source:
              move.source ||
              "canonical_response_plan",

            raw:
              move
          };
        }
      )
      .filter(Boolean)
      .sort(
        (a, b) =>
          a.order -
          b.order
      );
  },

  normalizeMoveId(value = "") {
    const id =
      this.normalizeIdentifier(
        value
      );

    const aliases = {
      attune:
        "attune_to_emotion",

      sadness_attune:
        "attune_to_sadness",

      sadness_validate:
        "validate_sadness",

      anxiety_attune:
        "attune_to_anxiety",

      anxiety_validate:
        "validate_anxiety",

      anger_attune:
        "attune_to_anger",

      anger_validate:
        "validate_anger",

      gentle_validation:
        "validate_emotion",

      validate_weight:
        "validate_emotion",

      invite_context:
        "invite_context_or_stay_present",

      direct_answer:
        "answer_directly",

      usable_example:
        "provide_usable_context",

      confirm_practical:
        "confirm_practical_goal",

      contained_patch:
        "give_contained_steps",

      test_before_more_changes:
        "suggest_test_or_followup",

      separate_questions:
        "separate_options",

      recommend_priority:
        "recommend_next_decision_step",

      calm_medical_frame:
        "calm_medical_frame",

      safe_first_step:
        "name_safe_first_step",

      red_flags:
        "include_red_flags_or_clinician_boundary",

      pause:
        "pause_and_prioritize_safety",

      immediate_safety:
        "give_direct_safety_step",

      trusted_help:
        "urge_trusted_or_emergency_support",

      name_relationship_truth:
        "name_relationship_or_conflict_truth",

      reduce_blame:
        "lower_blame",

      repair_script:
        "offer_one_repair_step",

      one_next_step:
        "offer_one_next_step",

      small_next_step:
        "offer_one_next_step",

      simple_ack:
        "memory_acknowledgment",

      principle:
        "state_principle",

      apply_principle:
        "apply_principle",

      next_step:
        "offer_one_next_step",

      usable_context:
        "provide_usable_context"
    };

    return aliases[id] ||
      id;
  },

  /* =====================================================
     CANONICAL PLAN RENDERING
  ===================================================== */

  renderCanonicalPlan({
    packet = {},
    request = {},
    writerContract = {}
  } = {}) {
    const renderedMoves = [];
    const unsupportedMoves = [];
    const skippedMoves = [];
    const warnings = [];
    const sentences = [];

    const moves =
      writerContract.responseMoves;

    if (!moves.length) {
      warnings.push({
        type:
          "response_moves_missing",

        message:
          "The canonical Response Plan contained no response moves."
      });

      return {
        sentences,

        renderedMoves,

        unsupportedMoves,

        skippedMoves,

        warnings,

        requestedMoveCount:
          0,

        supportedMoveCount:
          0,

        unsupportedMoveCount:
          0,

        skippedMoveCount:
          0
      };
    }

    for (
      const move
      of moves
    ) {
      if (
        move.userFacing ===
          false ||
        move.renderPolicy ===
          "instruction_only"
      ) {
        skippedMoves.push({
          id:
            move.id,

          reason:
            "move_marked_instruction_only",

          required:
            move.required
        });

        continue;
      }

      const rendering =
        this.renderMove({
          move,
          packet,
          request,
          writerContract
        });

      if (
        !rendering ||
        !rendering.text
      ) {
        unsupportedMoves.push({
          id:
            move.id,

          required:
            move.required,

          renderPolicy:
            move.renderPolicy,

          reason:
            rendering?.reason ||
            "unsupported_response_move"
        });

        continue;
      }

      sentences.push(
        rendering.text
      );

      renderedMoves.push({
        id:
          move.id,

        order:
          move.order,

        required:
          move.required,

        text:
          rendering.text,

        source:
          rendering.source ||
          "deterministic_renderer",

        confidence:
          this.normalizeConfidence(
            rendering.confidence ??
            0.7
          ),

        evidenceUsed:
          rendering.evidenceUsed ||
          []
      });
    }

    const requiredUnsupported =
      unsupportedMoves.filter(
        move =>
          move.required ===
          true
      );

    if (
      requiredUnsupported.length >
      0
    ) {
      warnings.push({
        type:
          "required_response_moves_unsupported",

        moveIds:
          requiredUnsupported.map(
            move =>
              move.id
          ),

        count:
          requiredUnsupported.length
      });
    }

    return {
      sentences,

      renderedMoves,

      unsupportedMoves,

      skippedMoves,

      warnings,

      requestedMoveCount:
        moves.length,

      supportedMoveCount:
        renderedMoves.length,

      unsupportedMoveCount:
        unsupportedMoves.length,

      skippedMoveCount:
        skippedMoves.length
    };
  },

  renderMove({
    move = {},
    packet = {},
    request = {},
    writerContract = {}
  } = {}) {
    const renderer =
      this.moveRenderers[
        move.id
      ];

    if (
      typeof renderer !==
      "function"
    ) {
      return {
        text:
          "",

        reason:
          "no_deterministic_renderer"
      };
    }

    try {
      const result =
        renderer.call(
          this,
          {
            move,
            packet,
            request,
            writerContract
          }
        );

      if (
        typeof result ===
          "string"
      ) {
        return {
          text:
            this.cleanForUser(
              result
            ),

          source:
            "deterministic_move_renderer",

          confidence:
            0.7
        };
      }

      if (
        !result ||
        typeof result !==
          "object"
      ) {
        return {
          text:
            "",

          reason:
            "renderer_returned_invalid_result"
        };
      }

      return {
        ...result,

        text:
          this.cleanForUser(
            result.text ||
            ""
          )
      };
    } catch (error) {
      return {
        text:
          "",

        reason:
          "move_renderer_failed",

        error:
          error?.message ||
          String(error)
      };
    }
  },

  /* =====================================================
     MOVE RENDERERS
  ===================================================== */

  moveRenderers: {
    answer_directly({
      packet = {},
      request = {}
    } = {}) {
      return this.renderDirectAnswer({
        packet,
        request
      });
    },

    brief_explanation({
      packet = {},
      request = {}
    } = {}) {
      return this.renderBriefExplanation({
        packet,
        request
      });
    },

    provide_usable_context({
      packet = {},
      request = {}
    } = {}) {
      return this.renderUsableContext({
        packet,
        request
      });
    },

    reflect_understanding({
      packet = {},
      request = {}
    } = {}) {
      return this.renderReflection({
        packet,
        request
      });
    },

    name_possible_meaning({
      packet = {},
      request = {}
    } = {}) {
      return this.renderPossibleMeaning({
        packet,
        request
      });
    },

    ask_clarifying_question({
      packet = {},
      request = {},
      writerContract = {}
    } = {}) {
      return this.renderClarifyingQuestion({
        packet,
        request,
        writerContract
      });
    },

    attune_to_emotion({
      packet = {},
      request = {}
    } = {}) {
      return this.renderEmotionAttunement({
        packet,
        request
      });
    },

    attune_to_sadness({
      packet = {},
      request = {}
    } = {}) {
      return this.renderEmotionAttunement({
        packet,
        request,
        preferredEmotion:
          "sadness"
      });
    },

    validate_sadness({
      packet = {},
      request = {}
    } = {}) {
      return this.renderEmotionValidation({
        packet,
        request,
        preferredEmotion:
          "sadness"
      });
    },

    attune_to_anxiety({
      packet = {},
      request = {}
    } = {}) {
      return this.renderEmotionAttunement({
        packet,
        request,
        preferredEmotion:
          "anxiety"
      });
    },

    validate_anxiety({
      packet = {},
      request = {}
    } = {}) {
      return this.renderEmotionValidation({
        packet,
        request,
        preferredEmotion:
          "anxiety"
      });
    },

    attune_to_anger({
      packet = {},
      request = {}
    } = {}) {
      return this.renderEmotionAttunement({
        packet,
        request,
        preferredEmotion:
          "anger"
      });
    },

    validate_anger({
      packet = {},
      request = {}
    } = {}) {
      return this.renderEmotionValidation({
        packet,
        request,
        preferredEmotion:
          "anger"
      });
    },

    validate_emotion({
      packet = {},
      request = {}
    } = {}) {
      return this.renderEmotionValidation({
        packet,
        request
      });
    },

    validate_feeling({
      packet = {},
      request = {}
    } = {}) {
      return this.renderEmotionValidation({
        packet,
        request
      });
    },

    name_pattern_gently({
      packet = {},
      request = {}
    } = {}) {
      return this.renderGentlePattern({
        packet,
        request
      });
    },

    ask_permission_before_coaching({
      packet = {},
      request = {},
      writerContract = {}
    } = {}) {
      return this.renderCoachingPermissionQuestion({
        packet,
        request,
        writerContract
      });
    },

    offer_small_practical_next_step({
      packet = {},
      request = {}
    } = {}) {
      return this.renderSmallPracticalStep({
        packet,
        request
      });
    },

    invite_context_or_stay_present({
      packet = {},
      request = {},
      writerContract = {}
    } = {}) {
      return this.renderPresenceQuestion({
        packet,
        request,
        writerContract
      });
    },

    offer_grounding_choice({
      packet = {},
      request = {},
      writerContract = {}
    } = {}) {
      return this.renderGroundingChoice({
        packet,
        request,
        writerContract
      });
    },

    join_positive_emotion({
      packet = {},
      request = {}
    } = {}) {
      return this.renderPositiveAttunement({
        packet,
        request
      });
    },

    name_what_it_means({
      packet = {},
      request = {}
    } = {}) {
      return this.renderPositiveMeaning({
        packet,
        request
      });
    },

    reflect_strength_or_connection({
      packet = {},
      request = {}
    } = {}) {
      return this.renderStrengthOrConnection({
        packet,
        request
      });
    },

    acknowledge_kind_gesture({
      packet = {},
      request = {}
    } = {}) {
      return this.renderKindGesture({
        packet,
        request
      });
    },

    name_emotional_impact({
      packet = {},
      request = {}
    } = {}) {
      return this.renderEmotionalImpact({
        packet,
        request
      });
    },

    warm_reflection({
      packet = {},
      request = {}
    } = {}) {
      return this.renderWarmReflection({
        packet,
        request
      });
    },

    name_relationship_or_conflict_truth({
      packet = {},
      request = {}
    } = {}) {
      return this.renderRelationshipTruth({
        packet,
        request
      });
    },

    lower_blame({
      packet = {},
      request = {}
    } = {}) {
      return this.renderLowerBlame({
        packet,
        request
      });
    },

    offer_one_repair_step({
      packet = {},
      request = {}
    } = {}) {
      return this.renderRepairStep({
        packet,
        request
      });
    },

    offer_one_next_step({
      packet = {},
      request = {}
    } = {}) {
      return this.renderOneNextStep({
        packet,
        request
      });
    },

    name_tradeoff({
      packet = {},
      request = {}
    } = {}) {
      return this.renderTradeoff({
        packet,
        request
      });
    },

    separate_options({
      packet = {},
      request = {}
    } = {}) {
      return this.renderOptionSeparation({
        packet,
        request
      });
    },

    recommend_next_decision_step({
      packet = {},
      request = {}
    } = {}) {
      return this.renderDecisionStep({
        packet,
        request
      });
    },

    confirm_practical_goal({
      packet = {},
      request = {}
    } = {}) {
      return this.renderPracticalConfirmation({
        packet,
        request
      });
    },

    identify_target({
      packet = {},
      request = {}
    } = {}) {
      return this.renderDeveloperTarget({
        packet,
        request
      });
    },

    give_contained_steps({
      packet = {},
      request = {}
    } = {}) {
      return this.renderContainedSteps({
        packet,
        request
      });
    },

    suggest_test_or_followup({
      packet = {},
      request = {}
    } = {}) {
      return this.renderTestStep({
        packet,
        request
      });
    },

    calm_medical_frame({
      packet = {},
      request = {}
    } = {}) {
      return this.renderMedicalFrame({
        packet,
        request
      });
    },

    name_safe_first_step({
      packet = {},
      request = {}
    } = {}) {
      return this.renderSafeFirstStep({
        packet,
        request
      });
    },

    include_red_flags_or_clinician_boundary({
      packet = {},
      request = {}
    } = {}) {
      return this.renderMedicalBoundary({
        packet,
        request
      });
    },

    pause_and_prioritize_safety({
      packet = {},
      request = {}
    } = {}) {
      return this.renderSafetyPause({
        packet,
        request
      });
    },

    give_direct_safety_step({
      packet = {},
      request = {}
    } = {}) {
      return this.renderDirectSafetyStep({
        packet,
        request
      });
    },

    urge_trusted_or_emergency_support({
      packet = {},
      request = {}
    } = {}) {
      return this.renderTrustedSafetySupport({
        packet,
        request
      });
    },

    memory_acknowledgment({
      packet = {},
      request = {}
    } = {}) {
      return {
        text:
          this.renderMemoryAcknowledgment({
            packet,
            request
          }) ||
          "Got it — I’ll keep that in mind.",

        source:
          "memory_acknowledgment_renderer",

        confidence:
          0.9
      };
    },

    state_principle({
      packet = {},
      request = {}
    } = {}) {
      return this.renderPrinciple({
        packet,
        request
      });
    },

    apply_principle({
      packet = {},
      request = {}
    } = {}) {
      return this.renderPrincipleApplication({
        packet,
        request
      });
    }
  },

  /* =====================================================
     DIRECT INFORMATION
  ===================================================== */

  renderDirectAnswer({
    packet = {},
    request = {}
  } = {}) {
    const trusted =
      this.extractTrustedDirectAnswer(
        packet
      );

    if (trusted) {
      return {
        text:
          trusted,

        source:
          "trusted_direct_answer",

        confidence:
          0.9,

        evidenceUsed: [
          "knowledge"
        ]
      };
    }

    const meaning =
      this.readMeaning(packet);

    const directFromMeaning =
      this.cleanForUser(
        meaning.directAnswer ||
        meaning.answer ||
        meaning.resolvedMeaning ||
        ""
      );

    if (directFromMeaning) {
      return {
        text:
          directFromMeaning,

        source:
          "meaning_interpretation",

        confidence:
          meaning.confidence ||
          0.75,

        evidenceUsed: [
          "meaning_interpretation"
        ]
      };
    }

    return {
      text:
        "",

      reason:
        "no_grounded_direct_answer_available"
    };
  },

  renderBriefExplanation({
    packet = {}
  } = {}) {
    const knowledge =
      this.readKnowledge(packet);

    const meaning =
      this.readMeaning(packet);

    const candidates = [
      knowledge.meaning
        ?.explanation,

      knowledge.meaning
        ?.summary,

      knowledge.synthesis
        ?.explanation,

      knowledge.answer,

      meaning.explanation,

      meaning.reason,

      meaning.summary
    ];

    const explanation =
      candidates
        .map(value =>
          this.cleanForUser(value)
        )
        .find(Boolean);

    if (!explanation) {
      return {
        text:
          "",

        reason:
          "no_grounded_explanation_available"
      };
    }

    return {
      text:
        this.firstSentence(
          explanation
        ),

      source:
        "grounded_explanation",

      confidence:
        0.75,

      evidenceUsed: [
        "knowledge_or_meaning"
      ]
    };
  },

  renderUsableContext({
    packet = {}
  } = {}) {
    const knowledge =
      this.readKnowledge(packet);

    const meaning =
      this.readMeaning(packet);

    const candidates = [
      knowledge.meaning
        ?.practicalImplication,

      knowledge.meaning
        ?.example,

      knowledge.synthesis
        ?.practicalImplication,

      meaning.practicalImplication,

      meaning.example,

      meaning.context
    ];

    const context =
      candidates
        .map(value =>
          this.cleanForUser(value)
        )
        .find(Boolean);

    if (!context) {
      return {
        text:
          "",

        reason:
          "no_usable_context_available"
      };
    }

    return {
      text:
        this.firstSentence(
          context
        ),

      source:
        "grounded_usable_context",

      confidence:
        0.7
    };
  },

  /* =====================================================
     REFLECTION AND CLARIFICATION
  ===================================================== */

  renderReflection({
    packet = {},
    request = {}
  } = {}) {
    const humanState =
      this.readHumanState(packet);

    const meaning =
      this.readMeaning(packet);

    const reflection =
      this.cleanForUser(
        humanState.reflection ||
        meaning.reflection ||
        meaning.userFacingSummary ||
        ""
      );

    if (reflection) {
      return {
        text:
          reflection,

        source:
          "understanding_reflection",

        confidence:
          0.8
      };
    }

    const emotion =
      this.detectEmotion({
        packet,
        request
      });

    if (
      emotion ===
      "defensive"
    ) {
      return {
        text:
          "It sounds like your first reaction is protective, and you need some time before you can process things more calmly.",

        source:
          "bounded_emotional_reflection",

        confidence:
          0.68
      };
    }

    return {
      text:
        "",

      reason:
        "reflection_not_grounded"
    };
  },

  renderPossibleMeaning({
    packet = {}
  } = {}) {
    const meaning =
      this.readMeaning(packet);

    const value =
      this.cleanForUser(
        meaning.possibleMeaning ||
        meaning.interpretation ||
        meaning.primaryMeaning
          ?.summary ||
        ""
      );

    if (!value) {
      return {
        text:
          "",

        reason:
          "possible_meaning_not_available"
      };
    }

    return {
      text:
        value,

      source:
        "meaning_interpretation",

      confidence:
        meaning.confidence ||
        0.65
    };
  },

  renderClarifyingQuestion({
    packet = {},
    writerContract = {}
  } = {}) {
    if (
      !writerContract
        .finalQuestionAllowed
    ) {
      return {
        text:
          "",

        reason:
          "question_not_allowed"
      };
    }

    const purpose =
      writerContract
        .questionPurpose;

    const questionMap = {
      clarify_need:
        "Do you want advice, or do you mainly want me to understand what this feels like first?",

      permission_before_coaching:
        "Do you want help working through it, or are you mainly trying to put the feeling into words?",

      safety_clarification:
        "Are you in immediate danger right now?",

      response_plan_question:
        "What part would be most useful to focus on next?"
    };

    const direct =
      packet.composerDirective
        ?.clarifyingQuestion ||
      packet.responsePlan
        ?.clarifyingQuestion ||
      null;

    return {
      text:
        this.cleanForUser(
          direct ||
          questionMap[purpose] ||
          questionMap
            .response_plan_question
        ),

      source:
        "question_policy",

      confidence:
        0.75
    };
  },

  /* =====================================================
     EMOTION
  ===================================================== */

  renderEmotionAttunement({
    packet = {},
    request = {},
    preferredEmotion = null
  } = {}) {
    const emotion =
      preferredEmotion ||
      this.detectEmotion({
        packet,
        request
      });

    const map = {
      sadness:
        "Yeah, that sounds heavy.",

      anxiety:
        "Yeah, I can see why that would feel overwhelming.",

      anger:
        "Yeah, I can hear the frustration in that.",

      defensive:
        "Yeah, that defensive feeling makes sense as an immediate reaction.",

      hurt:
        "Yeah, I can see why that would hurt.",

      disappointment:
        "Yeah, that’s disappointing.",

      shame:
        "Yeah, that can hit hard without meaning you deserve to beat yourself up.",

      positive:
        "Hell yeah — that’s worth feeling good about."
    };

    return {
      text:
        map[emotion] ||
        "Yeah, I’m with you.",

      source:
        "bounded_emotional_attunement",

      confidence:
        emotion
          ? 0.72
          : 0.55
    };
  },

  renderEmotionValidation({
    packet = {},
    request = {},
    preferredEmotion = null
  } = {}) {
    const text =
      request.normalizedText;

    const emotion =
      preferredEmotion ||
      this.detectEmotion({
        packet,
        request
      });

    if (
      /\b(?:defensive|defend myself|protect myself)\b/.test(
        text
      )
    ) {
      return {
        text:
          "That initial defensiveness may be your nervous system trying to protect you before you have enough distance to think clearly.",

        source:
          "bounded_pattern_validation",

        confidence:
          0.74
      };
    }

    if (
      /\b(?:fat|weight|body)\b/.test(
        text
      )
    ) {
      return {
        text:
          "That can feel shitty when your body seems different from how you want it to feel.",

        source:
          "bounded_body_validation",

        confidence:
          0.72
      };
    }

    const map = {
      sadness:
        "It makes sense that this would stay with you for a while.",

      anxiety:
        "When everything feels urgent at once, it’s hard to think clearly.",

      anger:
        "That reaction usually has something underneath it that feels threatened, dismissed, or hurt.",

      defensive:
        "Needing time before you can take something in does not mean you are incapable of handling it.",

      hurt:
        "It makes sense that this landed personally.",

      disappointment:
        "It makes sense that you are bothered by it.",

      shame:
        "Feeling bad about something is not the same as being bad."
    };

    return {
      text:
        map[emotion] ||
        "That reaction makes sense in context.",

      source:
        "bounded_emotional_validation",

      confidence:
        emotion
          ? 0.7
          : 0.55
    };
  },

  renderGentlePattern({
    request = {}
  } = {}) {
    const text =
      request.normalizedText;

    if (
      /\b(?:defensive|defend myself)\b/.test(
        text
      ) &&
      /\b(?:time|later|after)\b/.test(
        text
      )
    ) {
      return {
        text:
          "The useful pattern is that your first reaction and your settled reaction are not the same.",

        source:
          "current_turn_pattern",

        confidence:
          0.78
      };
    }

    if (
      /\b(?:fat|weight|body)\b/.test(
        text
      )
    ) {
      return {
        text:
          "That could involve habits, stress, sleep, activity, or self-judgment, so I would not jump straight to shame.",

        source:
          "bounded_body_pattern",

        confidence:
          0.68
      };
    }

    return {
      text:
        "",

      reason:
        "pattern_not_grounded"
    };
  },

  renderCoachingPermissionQuestion({
    request = {},
    writerContract = {}
  } = {}) {
    if (
      !writerContract
        .finalQuestionAllowed
    ) {
      return {
        text:
          "",

        reason:
          "coaching_question_not_allowed"
      };
    }

    if (
      /\b(?:fat|weight|body)\b/.test(
        request.normalizedText
      )
    ) {
      return {
        text:
          "Do you want me to help you figure out what changed, or are you mainly venting right now?",

        source:
          "coaching_permission_policy",

        confidence:
          0.85
      };
    }

    return {
      text:
        "Do you want advice on handling that first defensive reaction, or are you mainly trying to understand yourself better?",

      source:
        "coaching_permission_policy",

      confidence:
        0.82
    };
  },

  renderSmallPracticalStep({
    request = {}
  } = {}) {
    if (
      /\b(?:defensive|defend myself)\b/.test(
        request.normalizedText
      )
    ) {
      return {
        text:
          "A useful next step is to pause before responding and say that you need a little time to process what was said.",

        source:
          "bounded_practical_step",

        confidence:
          0.75
      };
    }

    if (
      /\b(?:fat|weight|body)\b/.test(
        request.normalizedText
      )
    ) {
      return {
        text:
          "Start by checking what changed recently in your eating, drinking, sleep, stress, activity, or schedule.",

        source:
          "bounded_practical_step",

        confidence:
          0.72
      };
    }

    return {
      text:
        "Start with one small thing you can actually control today.",

      source:
        "generic_bounded_next_step",

      confidence:
        0.5
    };
  },

  renderPresenceQuestion({
    request = {},
    writerContract = {}
  } = {}) {
    if (
      !writerContract
        .finalQuestionAllowed
    ) {
      return {
        text:
          "",

        reason:
          "presence_question_not_allowed"
      };
    }

    if (
      /\b(?:argument|fight|wife|husband|partner)\b/.test(
        request.normalizedText
      )
    ) {
      return {
        text:
          "What was said that made you feel like you had to defend yourself?",

        source:
          "current_turn_context_question",

        confidence:
          0.78
      };
    }

    return {
      text:
        "What usually happens in the moment that makes you feel like you have to defend yourself?",

      source:
        "current_turn_context_question",

      confidence:
        0.72
    };
  },

  renderGroundingChoice({
    writerContract = {}
  } = {}) {
    if (
      !writerContract
        .finalQuestionAllowed
    ) {
      return {
        text:
          "Take one slow breath and give yourself a moment before deciding what to do next.",

        source:
          "grounding_policy",

        confidence:
          0.7
      };
    }

    return {
      text:
        "We can either unpack what triggered it or focus on one small way to slow the reaction down.",

      source:
        "grounding_choice",

      confidence:
        0.72
    };
  },

  /* =====================================================
     POSITIVE CONNECTION
  ===================================================== */

  renderPositiveAttunement() {
    return {
      text:
        "Hell yeah — that’s worth feeling good about.",

      source:
        "positive_emotion_renderer",

      confidence:
        0.75
    };
  },

  renderPositiveMeaning({
    packet = {}
  } = {}) {
    const meaning =
      this.readMeaning(packet);

    const grounded =
      this.cleanForUser(
        meaning.positiveMeaning ||
        meaning.whyItMattered ||
        ""
      );

    if (grounded) {
      return {
        text:
          grounded,

        source:
          "meaning_interpretation",

        confidence:
          0.8
      };
    }

    return {
      text:
        "It sounds like it mattered because you felt seen and cared for.",

      source:
        "bounded_positive_meaning",

      confidence:
        0.65
    };
  },

  renderStrengthOrConnection() {
    return {
      text:
        "Let yourself actually take the win for a second.",

      source:
        "positive_connection_renderer",

      confidence:
        0.65
    };
  },

  renderKindGesture() {
    return {
      text:
        "That was genuinely thoughtful.",

      source:
        "kind_gesture_renderer",

      confidence:
        0.65
    };
  },

  renderEmotionalImpact() {
    return {
      text:
        "Having someone show up for you at the right moment can mean a lot.",

      source:
        "emotional_impact_renderer",

      confidence:
        0.62
    };
  },

  renderWarmReflection() {
    return {
      text:
        "I’m glad it made your day.",

      source:
        "warm_reflection_renderer",

      confidence:
        0.65
    };
  },

  /* =====================================================
     RELATIONSHIP REPAIR
  ===================================================== */

  renderRelationshipTruth({
    request = {}
  } = {}) {
    if (
      /\b(?:defensive|defend myself)\b/.test(
        request.normalizedText
      )
    ) {
      return {
        text:
          "The problem is not that you need time; it is what happens between the criticism and the calmer version of you showing up.",

        source:
          "current_turn_relationship_pattern",

        confidence:
          0.78
      };
    }

    return {
      text:
        "The goal is not to win the argument; it is to understand what happened and lower the temperature.",

      source:
        "relationship_repair_principle",

      confidence:
        0.68
    };
  },

  renderLowerBlame() {
    return {
      text:
        "You can own your reaction without treating yourself or the other person like the enemy.",

      source:
        "relationship_deescalation",

      confidence:
        0.7
    };
  },

  renderRepairStep({
    request = {}
  } = {}) {
    if (
      /\b(?:defensive|defend myself)\b/.test(
        request.normalizedText
      )
    ) {
      return {
        text:
          "You could say, “I notice I get defensive at first, but I can hear you better after I have some time to process.”",

        source:
          "current_turn_repair_script",

        confidence:
          0.82
      };
    }

    return {
      text:
        "Say what you understand, own your part plainly, and ask for one concrete next step.",

      source:
        "relationship_repair_step",

      confidence:
        0.7
    };
  },

  renderOneNextStep({
    request = {}
  } = {}) {
    if (
      /\b(?:defensive|defend myself)\b/.test(
        request.normalizedText
      )
    ) {
      return {
        text:
          "The next move is to tell the other person that you want to revisit the conversation once your first reaction settles.",

        source:
          "current_turn_next_step",

        confidence:
          0.77
      };
    }

    return {
      text:
        "Keep the next move small, specific, and doable.",

      source:
        "bounded_next_step",

      confidence:
        0.55
    };
  },

  /* =====================================================
     DECISION SUPPORT
  ===================================================== */

  renderTradeoff({
    packet = {}
  } = {}) {
    const terms =
      this.readPreferredTerms(
        packet
      );

    const tradeoff =
      terms.centralTradeoff
        ?.short ||
      terms.centralTradeoff
        ?.phrase ||
      packet.thesis
        ?.value
        ?.coreConflict ||
      null;

    if (!tradeoff) {
      return {
        text:
          "",

        reason:
          "concrete_tradeoff_missing"
      };
    }

    return {
      text:
        `The real tradeoff is ${this.lowercaseFirst(
          tradeoff
        )}.`,

      source:
        "lexical_grounding",

      confidence:
        0.82
    };
  },

  renderOptionSeparation({
    packet = {}
  } = {}) {
    const meaning =
      this.readMeaning(packet);

    const options =
      this.toArray(
        meaning.options ||
        packet.responsePlan
          ?.options
      );

    if (
      options.length < 2
    ) {
      return {
        text:
          "",

        reason:
          "decision_options_missing"
      };
    }

    const first =
      this.extractLabel(
        options[0]
      );

    const second =
      this.extractLabel(
        options[1]
      );

    if (
      !first ||
      !second
    ) {
      return {
        text:
          "",

        reason:
          "decision_option_labels_missing"
      };
    }

    return {
      text:
        `Separate the decision into ${first} versus ${second}.`,

      source:
        "meaning_options",

      confidence:
        0.78
    };
  },

  renderDecisionStep({
    packet = {}
  } = {}) {
    const recommendation =
      this.cleanForUser(
        packet.reasoning
          ?.recommendation ||
        packet.evidence
          ?.reasoning
          ?.recommendation ||
        packet.responsePlan
          ?.recommendation ||
        ""
      );

    if (recommendation) {
      return {
        text:
          recommendation,

        source:
          "reasoning_recommendation",

        confidence:
          0.82
      };
    }

    return {
      text:
        "Choose the next step that protects the most important non-negotiable first.",

      source:
        "bounded_decision_step",

      confidence:
        0.58
    };
  },

  /* =====================================================
     DEVELOPER
  ===================================================== */

  renderPracticalConfirmation() {
    return {
      text:
        "Yes — keep this practical and contained.",

      source:
        "developer_response_move",

      confidence:
        0.65
    };
  },

  renderDeveloperTarget({
    packet = {}
  } = {}) {
    if (
      packet.developerRelevant !==
        true &&
      packet.developer
        ?.relevant !==
        true
    ) {
      return {
        text:
          "",

        reason:
          "developer_context_not_relevant"
      };
    }

    const github =
      packet.evidence?.github ||
      null;

    const filePath =
      github?.filePath ||
      packet.evidence
        ?.developerIntent
        ?.filePath ||
      null;

    if (!filePath) {
      return {
        text:
          "",

        reason:
          "developer_target_file_missing"
      };
    }

    return {
      text:
        `The file to change is \`${filePath}\`.`,

      source:
        "developer_evidence",

      confidence:
        0.88
    };
  },

  renderContainedSteps({
    packet = {}
  } = {}) {
    const developerReply =
      this.cleanForUser(
        packet.evidence
          ?.developerHandoff
          ?.summary ||
        packet.evidence
          ?.developerResponse
          ?.summary ||
        packet.composerDirective
          ?.implementationSummary ||
        ""
      );

    if (developerReply) {
      return {
        text:
          developerReply,

        source:
          "developer_handoff",

        confidence:
          0.82
      };
    }

    return {
      text:
        "",

      reason:
        "contained_developer_steps_missing"
    };
  },

  renderTestStep({
    packet = {}
  } = {}) {
    if (
      packet.developerRelevant !==
        true &&
      packet.developer
        ?.relevant !==
        true
    ) {
      return {
        text:
          "",

        reason:
          "developer_context_not_relevant"
      };
    }

    const test =
      this.cleanForUser(
        packet.evidence
          ?.developerHandoff
          ?.testPlan ||
        packet.composerDirective
          ?.testPlan ||
        ""
      );

    return {
      text:
        test ||
        "Test the current behavior before changing the next layer.",

      source:
        test
          ? "developer_handoff"
          : "bounded_developer_test_step",

      confidence:
        test
          ? 0.82
          : 0.62
    };
  },

  /* =====================================================
     MEDICAL
  ===================================================== */

  renderMedicalFrame({
    packet = {}
  } = {}) {
    const knowledge =
      this.readKnowledge(packet);

    const direct =
      this.cleanForUser(
        knowledge.meaning
          ?.directAnswer ||
        knowledge.answer ||
        ""
      );

    if (direct) {
      return {
        text:
          direct,

        source:
          "medical_knowledge",

        confidence:
          0.85
      };
    }

    return {
      text:
        "Take the symptom seriously, but do not assume the worst from the symptom alone.",

      source:
        "medical_boundary_renderer",

      confidence:
        0.6
    };
  },

  renderSafeFirstStep({
    packet = {}
  } = {}) {
    const knowledge =
      this.readKnowledge(packet);

    const step =
      this.cleanForUser(
        knowledge.meaning
          ?.safeFirstStep ||
        knowledge.meaning
          ?.practicalGuidance ||
        packet.safety
          ?.contract
          ?.immediateAction ||
        ""
      );

    if (!step) {
      return {
        text:
          "",

        reason:
          "safe_medical_step_missing"
      };
    }

    return {
      text:
        step,

      source:
        "medical_or_safety_evidence",

      confidence:
        0.85
    };
  },

  renderMedicalBoundary({
    packet = {}
  } = {}) {
    const knowledge =
      this.readKnowledge(packet);

    const cautions =
      this.toArray(
        knowledge.meaning
          ?.cautions ||
        knowledge.synthesis
          ?.cautions
      );

    const caution =
      cautions
        .map(value =>
          this.cleanForUser(value)
        )
        .find(Boolean);

    if (caution) {
      return {
        text:
          caution,

        source:
          "medical_knowledge_caution",

        confidence:
          0.88
      };
    }

    return {
      text:
        "Seek medical care promptly if it is severe, worsening, unusual for you, or accompanied by concerning new symptoms.",

      source:
        "medical_boundary_renderer",

      confidence:
        0.7
    };
  },

  /* =====================================================
     SAFETY
  ===================================================== */

  renderSafetyPause({
    packet = {}
  } = {}) {
    const contract =
      packet.safety?.contract ||
      {};

    return {
      text:
        this.cleanForUser(
          contract.opening ||
          "Pause everything else and focus on immediate safety."
        ),

      source:
        "safety_contract",

      confidence:
        0.95
    };
  },

  renderDirectSafetyStep({
    packet = {}
  } = {}) {
    const contract =
      packet.safety?.contract ||
      {};

    const action =
      this.cleanForUser(
        contract.immediateAction ||
        contract.action ||
        ""
      );

    if (action) {
      return {
        text:
          action,

        source:
          "safety_contract",

        confidence:
          0.97
      };
    }

    return {
      text:
        "Move away from the immediate danger if you can and contact emergency help.",

      source:
        "safety_fallback",

      confidence:
        0.85
    };
  },

  renderTrustedSafetySupport({
    packet = {}
  } = {}) {
    const contract =
      packet.safety?.contract ||
      {};

    const support =
      this.cleanForUser(
        contract.trustedSupport ||
        contract.supportStep ||
        ""
      );

    return {
      text:
        support ||
        "Contact someone you trust who can stay with you or help you get support.",

      source:
        support
          ? "safety_contract"
          : "safety_fallback",

      confidence:
        support
          ? 0.95
          : 0.85
    };
  },

  /* =====================================================
     WISDOM
  ===================================================== */

  renderPrinciple({
    packet = {}
  } = {}) {
    const principle =
      this.cleanForUser(
        packet.responsePlan
          ?.principle ||
        packet.thesis
          ?.value
          ?.principle ||
        ""
      );

    if (!principle) {
      return {
        text:
          "",

        reason:
          "principle_missing"
      };
    }

    return {
      text:
        principle,

      source:
        "response_plan_principle",

      confidence:
        0.75
    };
  },

  renderPrincipleApplication({
    packet = {}
  } = {}) {
    const application =
      this.cleanForUser(
        packet.responsePlan
          ?.principleApplication ||
        packet.thesis
          ?.value
          ?.application ||
        ""
      );

    if (!application) {
      return {
        text:
          "",

        reason:
          "principle_application_missing"
      };
    }

    return {
      text:
        application,

      source:
        "response_plan_principle",

      confidence:
        0.75
    };
  },

  /* =====================================================
     MEMORY ACKNOWLEDGMENT
  ===================================================== */

  renderMemoryAcknowledgment({
    packet = {},
    request = {}
  } = {}) {
    const primary =
      this.normalizeIdentifier(
        packet.primary ||
        packet.responseGoal ||
        ""
      );

    const blueprint =
      this.normalizeIdentifier(
        packet.blueprintHint ||
        ""
      );

    const memoryCandidate =
      this.readMemoryCandidate(
        packet
      );

    const explicitMemoryRequest =
      /\b(?:remember that|remember this|save this|store this|note that|add this to memory|keep this in mind)\b/i.test(
        request.currentText
      );

    const preferenceStatement =
      /\b(?:my favorite|one of my favorite|i prefer|i like|i love|i hate|i dislike)\b/i.test(
        request.currentText
      );

    const memoryPlan =
      primary.includes(
        "memory"
      ) ||
      blueprint.includes(
        "memory"
      ) ||
      packet.responsePlan
        ?.currentNeed ===
        "memory_acknowledgment";

    if (
      !explicitMemoryRequest &&
      !preferenceStatement &&
      !memoryPlan
    ) {
      return null;
    }

    const displayClaim =
      this.cleanForUser(
        memoryCandidate
          ?.displayClaim ||
        this.toUserFacingClaim(
          request.currentText
        )
      );

    return displayClaim
      ? `Got it — I’ll remember that ${displayClaim}.`
      : "Got it — I’ll remember that.";
  },

  readMemoryCandidate(
    packet = {}
  ) {
    const candidates =
      this.toArray(
        packet.memoryCandidates ||
        packet.evidence
          ?.memoryCandidates ||
        packet.evidence
          ?.memory
          ?.candidates
      );

    return candidates[0] ||
      null;
  },

  toUserFacingClaim(text = "") {
    return String(
      text ||
      ""
    )
      .replace(
        /^\s*(?:hey ari,?\s*)/i,
        ""
      )
      .replace(
        /^\s*(?:remember that|remember this|save this|store this|note that|keep this in mind|add this to memory)\s*/i,
        ""
      )
      .replace(
        /\bone of my favorite\b/gi,
        "one of your favorite"
      )
      .replace(
        /\bmy favorite\b/gi,
        "your favorite"
      )
      .replace(
        /\bmy\b/gi,
        "your"
      )
      .replace(
        /\bi am\b/gi,
        "you are"
      )
      .replace(
        /\bi'm\b/gi,
        "you’re"
      )
      .replace(
        /\bi prefer\b/gi,
        "you prefer"
      )
      .replace(
        /\bi like\b/gi,
        "you like"
      )
      .replace(
        /\bi love\b/gi,
        "you love"
      )
      .replace(
        /\bi hate\b/gi,
        "you hate"
      )
      .replace(
        /\bi dislike\b/gi,
        "you dislike"
      )
      .replace(
        /[.!?]\s*$/,
        ""
      )
      .trim();
  },

  /* =====================================================
     TRUSTED KNOWLEDGE
  ===================================================== */

  renderTrustedKnowledge({
    packet = {},
    writerContract = {}
  } = {}) {
    const knowledge =
      this.readKnowledge(packet);

    if (
      !knowledge.available ||
      knowledge.shouldUseKnowledge ===
        false
    ) {
      return null;
    }

    const meaning =
      knowledge.meaning ||
      knowledge.synthesis ||
      {};

    const directAnswer =
      this.cleanForUser(
        meaning.directAnswer ||
        knowledge.answer ||
        ""
      );

    const keyFacts =
      this.toArray(
        meaning.keyFacts
      )
        .map(value =>
          this.cleanForUser(value)
        )
        .filter(Boolean);

    const cautions =
      this.toArray(
        meaning.cautions
      )
        .map(value =>
          this.cleanForUser(value)
        )
        .filter(Boolean);

    const nodeDraft =
      this.renderKnowledgeNode(
        knowledge.nodes[0]
      );

    const sentences = [
      directAnswer,
      ...keyFacts,
      ...cautions,
      nodeDraft
    ].filter(Boolean);

    if (!sentences.length) {
      return null;
    }

    const draft =
      this.finalizeDraft({
        sentences,

        packet,

        writerContract
      });

    if (!draft) {
      return null;
    }

    return {
      draft,

      reason:
        "trusted_knowledge_rendered",

      blueprintId:
        this.resolveKnowledgeBlueprintId(
          meaning
        ),

      renderResult: {
        complete:
          true,

        supportedMoveCount:
          sentences.length,

        unsupportedMoveCount:
          0,

        skippedMoveCount:
          0,

        renderedMoves:
          sentences.map(
            (
              text,
              index
            ) => ({
              id:
                index === 0
                  ? "answer_directly"
                  : "knowledge_support",

              order:
                index,

              text,

              rendered:
                true
            })
          ),

        unsupportedMoves: [],

        skippedMoves: [],

        warnings: []
      }
    };
  },

  renderKnowledgeNode(
    node = null
  ) {
    if (
      !node ||
      typeof node !==
        "object"
    ) {
      return "";
    }

    return this.cleanForUser(
      node.definition ||
      node.summary ||
      node.deep_understanding ||
      node.how_it_works ||
      ""
    );
  },

  resolveKnowledgeBlueprintId(
    meaning = {}
  ) {
    const mode =
      this.normalizeIdentifier(
        meaning.answerMode ||
        meaning.intent ||
        "general_knowledge"
      );

    const map = {
      identity_or_character:
        "knowledge_identity_answer",

      memory_recall:
        "knowledge_memory_recall",

      medical_guidance:
        "knowledge_medical_guidance",

      developer:
        "knowledge_developer_analysis",

      definition:
        "knowledge_definition",

      explanation:
        "knowledge_explanation",

      decision:
        "knowledge_decision",

      relationship_advice:
        "knowledge_relationship_advice",

      relationship_meaning:
        "knowledge_relationship_advice",

      life_advice:
        "knowledge_life_advice",

      advice:
        "knowledge_life_advice",

      writing:
        "knowledge_writing_context",

      general_knowledge:
        "knowledge_clear_explanation"
    };

    return map[mode] ||
      "knowledge_clear_explanation";
  },

  extractTrustedDirectAnswer(
    packet = {}
  ) {
    const knowledge =
      this.readKnowledge(packet);

    const candidates = [
      knowledge.meaning
        ?.directAnswer,

      knowledge.synthesis
        ?.directAnswer,

      knowledge.answer,

      knowledge.nodes[0]
        ?.definition,

      knowledge.nodes[0]
        ?.summary
    ];

    return candidates
      .map(value =>
        this.cleanForUser(value)
      )
      .find(Boolean) ||
      "";
  },

  /* =====================================================
     DRAFT FINALIZATION
  ===================================================== */

  finalizeDraft({
    sentences = [],
    packet = {},
    writerContract = {}
  } = {}) {
    let normalized =
      this.toArray(sentences)
        .flatMap(sentence =>
          this.splitSentences(
            sentence
          )
        )
        .map(sentence =>
          this.cleanForUser(
            sentence
          )
        )
        .filter(Boolean);

    normalized =
      this.removeInstructionLanguage(
        normalized,
        writerContract
      );

    normalized =
      this.removeForbiddenContent(
        normalized,
        writerContract
      );

    normalized =
      this.removeDuplicateSentences(
        normalized
      );

    normalized =
      this.enforceQuestionPolicy({
        sentences:
          normalized,

        writerContract
      });

    normalized =
      normalized.slice(
        0,
        writerContract
          .maxSentences ||
        4
      );

    let draft =
      normalized
        .join(" ")
        .trim();

    if (
      writerContract.maxWords
    ) {
      draft =
        this.limitWords(
          draft,
          writerContract
            .maxWords
        );
    }

    return this.smoothDraft(
      draft
    );
  },

  removeInstructionLanguage(
    sentences = [],
    writerContract = {}
  ) {
    if (
      writerContract
        .doNotRenderInstructionText !==
      true
    ) {
      return sentences;
    }

    return sentences.filter(
      sentence =>
        !this.isInternalInstruction(
          sentence
        )
    );
  },

  isInternalInstruction(
    sentence = ""
  ) {
    const text =
      this.normalize(
        sentence
      );

    const internalPatterns = [
      "answer the actual question first",
      "answer the direct question",
      "explain only enough",
      "follow the response plan",
      "use response rules",
      "the user is asking",
      "the writer should",
      "the composer should",
      "blueprint writer",
      "ai writer",
      "candidate arbiter",
      "internal planner",
      "response move",
      "response shape",
      "response strategy",
      "do not turn every answer",
      "the simplest way to think about it is"
    ];

    return internalPatterns.some(
      pattern =>
        text.includes(
          pattern
        )
    );
  },

  removeForbiddenContent(
    sentences = [],
    writerContract = {}
  ) {
    const banned =
      this.mergeUnique(
        writerContract
          .forbiddenBehaviors,
        writerContract
          .doNotWrite
      )
        .map(value =>
          this.normalize(value)
        )
        .filter(Boolean);

    return sentences.filter(
      sentence => {
        const normalized =
          this.normalize(
            sentence
          );

        return !banned.some(
          phrase =>
            phrase.length > 5 &&
            normalized.includes(
              phrase
            )
        );
      }
    );
  },

  enforceQuestionPolicy({
    sentences = [],
    writerContract = {}
  } = {}) {
    const maximum =
      Math.max(
        0,
        Number(
          writerContract
            .maximumQuestions ||
          0
        )
      );

    let questionsUsed =
      0;

    return sentences.filter(
      sentence => {
        const isQuestion =
          sentence.includes("?");

        if (!isQuestion) {
          return true;
        }

        if (
          writerContract
            .finalQuestionAllowed !==
            true
        ) {
          return false;
        }

        if (
          questionsUsed >=
          maximum
        ) {
          return false;
        }

        questionsUsed += 1;

        return true;
      }
    );
  },

  evaluateDraft({
    draft = "",
    writerContract = {},
    renderResult = {}
  } = {}) {
    const unsupportedRequired =
      renderResult
        .unsupportedMoves
        .filter(
          move =>
            move.required ===
            true
        );

    const sentenceCount =
      this.splitSentences(
        draft
      ).length;

    const empty =
      !draft;

    const tooShort =
      Boolean(draft) &&
      draft.length < 12;

    const containsMeta =
      this.isInternalInstruction(
        draft
      );

    const missingRequiredQuestion =
      writerContract
        .shouldAskQuestion ===
        true &&
      !draft.includes("?");

    const noRenderedMoves =
      renderResult
        .renderedMoves
        .length === 0;

    const incomplete =
      unsupportedRequired.length >
        0 ||
      missingRequiredQuestion ||
      noRenderedMoves;

    let requiresAIRepair =
      empty ||
      tooShort ||
      containsMeta;

    if (
      writerContract
        .unsupportedMovePolicy ===
        "request_ai_repair" &&
      unsupportedRequired.length >
        0
    ) {
      requiresAIRepair =
        true;
    }

    if (
      writerContract
        .incompletePlanPolicy ===
        "request_ai_repair" &&
      incomplete
    ) {
      requiresAIRepair =
        true;
    }

    const usable =
      !empty &&
      !tooShort &&
      !containsMeta &&
      !requiresAIRepair;

    let reason =
      "blueprint_render_success";

    if (empty) {
      reason =
        "blueprint_render_empty";
    } else if (containsMeta) {
      reason =
        "blueprint_rendered_internal_instruction";
    } else if (
      unsupportedRequired.length >
      0
    ) {
      reason =
        "required_response_moves_unsupported";
    } else if (
      missingRequiredQuestion
    ) {
      reason =
        "required_question_missing";
    } else if (tooShort) {
      reason =
        "blueprint_draft_too_short";
    } else if (
      noRenderedMoves
    ) {
      reason =
        "no_response_moves_rendered";
    }

    return {
      usable,

      complete:
        !incomplete,

      requiresAIRepair,

      reason,

      sentenceCount,

      characterCount:
        draft.length,

      renderedMoveCount:
        renderResult
          .renderedMoves
          .length,

      unsupportedRequiredMoveCount:
        unsupportedRequired.length,

      unsupportedRequiredMoveIds:
        unsupportedRequired.map(
          move =>
            move.id
        ),

      missingRequiredQuestion,

      containsInternalInstruction:
        containsMeta
    };
  },

  /* =====================================================
     BLUEPRINT RECORD
  ===================================================== */

  buildBlueprintRecord({
    packet = {},
    writerContract = {},
    renderResult = {}
  } = {}) {
    return {
      schema:
        "ari_blueprint_render_record",

      schemaVersion:
        this.schemaVersion,

      id:
        writerContract
          .blueprintHint ||
        "canonical_response_plan",

      strategy:
        "canonical_response_move_rendering",

      responseGoal:
        writerContract
          .responseGoal,

      responseShape:
        writerContract
          .responseShape,

      responsePosture:
        writerContract
          .responsePosture,

      advicePolicy:
        writerContract
          .advicePolicy,

      responseMoves:
        writerContract
          .responseMoves,

      renderedMoveIds:
        renderResult
          .renderedMoves
          .map(
            move =>
              move.id
          ),

      unsupportedMoveIds:
        renderResult
          .unsupportedMoves
          .map(
            move =>
              move.id
          ),

      skippedMoveIds:
        renderResult
          .skippedMoves
          .map(
            move =>
              move.id
          ),

      aiAllowed:
        packet.candidatePolicy
          ?.aiWriterAllowed !==
        false,

      aiRepairAllowed:
        packet.candidatePolicy
          ?.aiRepairAllowed !==
        false,

      deterministicConversationPlanner:
        false,

      canonicalResponsePlanUsed:
        true,

      independentPlanningUsed:
        false,

      authority:
        "deterministic_render_record_only"
    };
  },

  /* =====================================================
     PACKET READING
  ===================================================== */

  readLockedDeveloperDraft(
    packet = {}
  ) {
    if (
      packet
        .developerPacketLocked !==
        true &&
      packet.developer
        ?.locked !==
        true
    ) {
      return "";
    }

    return this.cleanOriginal(
      packet.lockedDeveloperReply ||
      packet.developer
        ?.lockedReply ||
      packet.developerPacket
        ?.reply ||
      packet.developerPacket
        ?.finalResponse ||
      ""
    );
  },

  readKnowledge(packet = {}) {
    const knowledge =
      packet.knowledge ||
      packet.evidence
        ?.knowledge ||
      {};

    return {
      available:
        knowledge.available ===
          true ||
        Boolean(
          knowledge.answer ||
          knowledge.meaning ||
          knowledge.synthesis ||
          this.toArray(
            knowledge.nodes
          ).length
        ),

      shouldUseKnowledge:
        knowledge
          .shouldUseKnowledge !==
        false,

      provider:
        knowledge.provider ||
        null,

      confidence:
        knowledge.confidence ||
        null,

      answer:
        knowledge.answer ||
        null,

      nodes:
        this.toArray(
          knowledge.nodes
        ),

      meaning:
        knowledge.meaning ||
        packet.evidence
          ?.knowledgeMeaning ||
        null,

      synthesis:
        knowledge.synthesis ||
        packet.evidence
          ?.knowledgeSynthesis ||
        null,

      sources:
        this.toArray(
          knowledge.sources
        )
    };
  },

  readMeaning(packet = {}) {
    return (
      packet.evidence
        ?.understanding
        ?.meaning ||
      packet.evidence
        ?.meaningInterpretation ||
      packet.meaningInterpretation ||
      {}
    );
  },

  readHumanState(packet = {}) {
    return (
      packet.evidence
        ?.understanding
        ?.humanState ||
      packet.humanState ||
      {}
    );
  },

  readPreferredTerms(packet = {}) {
    return (
      packet.preferredTerms ||
      packet.lexicalGrounding
        ?.preferredTerms ||
      packet.evidence
        ?.preferredTerms ||
      packet.evidence
        ?.lexicalGrounding
        ?.preferredTerms ||
      {}
    );
  },

  detectEmotion({
    packet = {},
    request = {}
  } = {}) {
    const humanState =
      this.readHumanState(packet);

    const values = [
      humanState.primaryEmotion,
      humanState.emotionalTone,
      humanState.state
        ?.emotion,
      humanState.state
        ?.id,
      humanState.primaryState,
      request.normalizedText
    ]
      .map(value =>
        this.normalize(value)
      )
      .join(" ");

    if (
      /\b(?:defensive|defensiveness|protective)\b/.test(
        values
      )
    ) {
      return "defensive";
    }

    if (
      /\b(?:sad|sadness|crying|heartbroken|down)\b/.test(
        values
      )
    ) {
      return "sadness";
    }

    if (
      /\b(?:anxious|anxiety|panic|overwhelmed|worried|stressed)\b/.test(
        values
      )
    ) {
      return "anxiety";
    }

    if (
      /\b(?:angry|anger|mad|furious|frustrated|annoyed)\b/.test(
        values
      )
    ) {
      return "anger";
    }

    if (
      /\b(?:hurt|offended|rejected)\b/.test(
        values
      )
    ) {
      return "hurt";
    }

    if (
      /\b(?:disappointed|disappointment|lost|failed)\b/.test(
        values
      )
    ) {
      return "disappointment";
    }

    if (
      /\b(?:shame|ashamed|embarrassed|self criticism)\b/.test(
        values
      )
    ) {
      return "shame";
    }

    if (
      /\b(?:happy|excited|glad|grateful|celebration|made my day)\b/.test(
        values
      )
    ) {
      return "positive";
    }

    return null;
  },

  /* =====================================================
     DRAFT RETURN
  ===================================================== */

  returnDraft({
    draft = "",
    reason = "fallback",
    usedBlueprint = false,
    usable = false,
    requiresAIRepair = false,
    packet = {},
    blueprint = null,
    renderResult = null
  } = {}) {
    const text =
      this.cleanOriginal(
        draft
      );

    const result = {
      blueprintWriterRan:
        true,

      blueprintWriterUsedBlueprint:
        usedBlueprint ===
        true,

      blueprintWriterSource:
        "ari-blueprint-writer",

      blueprintWriterVersion:
        this.version,

      blueprintWriterSchemaVersion:
        this.schemaVersion,

      blueprintWriterReason:
        reason,

      blueprintWriterUsable:
        usable ===
        true,

      blueprintWriterRequiresAIRepair:
        requiresAIRepair ===
        true,

      blueprintWriterComplete:
        renderResult
          ?.complete ===
          true,

      blueprint:
        blueprint ||
        null,

      blueprintId:
        blueprint?.id ||
        null,

      draft:
        text,

      blueprintWriterDraft:
        text,

      responseGoal:
        packet.responseGoal ||
        packet.responsePlan
          ?.responseGoal ||
        null,

      responseShape:
        packet.responseShape ||
        packet.responsePlan
          ?.responseShape ||
        null,

      renderedResponseMoves:
        renderResult
          ?.renderedMoves ||
        [],

      unsupportedResponseMoves:
        renderResult
          ?.unsupportedMoves ||
        [],

      skippedResponseMoves:
        renderResult
          ?.skippedMoves ||
        [],

      renderWarnings:
        renderResult
          ?.warnings ||
        [],

      renderQuality:
        renderResult
          ?.quality ||
        null,

      candidate: {
        source:
          "blueprint_writer",

        text,

        usable:
          usable ===
          true,

        requiresAIRepair:
          requiresAIRepair ===
          true,

        taskType:
          "canonical_response_plan",

        priority:
          usable
            ? 65
            : 20,

        evidence: {
          canonicalResponsePlanUsed:
            true,

          responseMovesRendered:
            renderResult
              ?.renderedMoves
              ?.length ||
            0,

          responseMovesUnsupported:
            renderResult
              ?.unsupportedMoves
              ?.length ||
            0,

          complete:
            renderResult
              ?.complete ===
            true,

          containsInternalPlannerLanguage:
            renderResult
              ?.quality
              ?.containsInternalInstruction ===
            true
        }
      },

      authority: {
        canRenderCanonicalResponseMoves:
          true,

        canReportUnsupportedMoves:
          true,

        canRequestAIRepair:
          true,

        canChooseResponsePlan:
          false,

        canInterpretMeaning:
          false,

        canSelectFinalDraft:
          false,

        canWriteFinalResponse:
          false,

        canPersistState:
          false,

        role:
          "deterministic_canonical_response_move_renderer"
      }
    };

    window.Ari.blueprintWriterState =
      result;

    return result;
  },

  /* =====================================================
     TEXT UTILITIES
  ===================================================== */

  cleanForUser(value = "") {
    return String(
      value ||
      ""
    )
      .replace(
        /\bAri should\b/gi,
        ""
      )
      .replace(
        /\bHelp Ari recognize when\b/gi,
        "This matters when"
      )
      .replace(
        /\bHelp Ari\b/gi,
        "The point is to"
      )
      .replace(
        /\bthe user\b/gi,
        "you"
      )
      .replace(
        /\busers\b/gi,
        "people"
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  },

  splitSentences(value = "") {
    const text =
      this.cleanOriginal(
        value
      );

    if (!text) {
      return [];
    }

    return text
      .split(
        /(?<=[.!?])\s+/
      )
      .map(sentence =>
        sentence.trim()
      )
      .filter(Boolean);
  },

  firstSentence(value = "") {
    return (
      this.splitSentences(
        value
      )[0] ||
      this.cleanOriginal(
        value
      )
    );
  },

  removeDuplicateSentences(
    sentences = []
  ) {
    const seen =
      new Set();

    return this.toArray(
      sentences
    ).filter(sentence => {
      const key =
        this.normalize(
          sentence
        )
          .replace(
            /[^\w\s]/g,
            ""
          )
          .slice(
            0,
            120
          );

      if (
        !key ||
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    });
  },

  smoothDraft(value = "") {
    return String(
      value ||
      ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .replace(
        /\bdo not\b/gi,
        "don’t"
      )
      .replace(
        /\bI would\b/g,
        "I’d"
      )
      .replace(
        /\bIt is\b/g,
        "It’s"
      )
      .replace(
        /\s+([,.!?])/g,
        "$1"
      )
      .trim();
  },

  limitWords(
    value = "",
    maxWords = null
  ) {
    if (
      !Number.isFinite(
        Number(maxWords)
      ) ||
      Number(maxWords) <=
        0
    ) {
      return value;
    }

    const words =
      String(
        value ||
        ""
      )
        .split(/\s+/)
        .filter(Boolean);

    if (
      words.length <=
      Number(maxWords)
    ) {
      return value;
    }

    const limited =
      words
        .slice(
          0,
          Number(maxWords)
        )
        .join(" ")
        .replace(
          /[,;:]$/,
          ""
        )
        .trim();

    return /[.!?]$/.test(
      limited
    )
      ? limited
      : `${limited}.`;
  },

  lowercaseFirst(value = "") {
    const text =
      String(
        value ||
        ""
      ).trim();

    if (!text) {
      return "";
    }

    return (
      text.charAt(0)
        .toLowerCase() +
      text.slice(1)
    );
  },

  extractLabel(value = null) {
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
      return this.cleanForUser(
        value
      );
    }

    if (
      typeof value ===
      "number"
    ) {
      return String(value);
    }

    if (
      typeof value ===
      "object"
    ) {
      return this.cleanForUser(
        value.label ||
        value.name ||
        value.value ||
        value.text ||
        value.claim ||
        value.surface ||
        ""
      );
    }

    return "";
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
        Number(value);

      if (
        Number.isFinite(number)
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
      const normalized =
        value
          .toLowerCase()
          .trim();

      const labels = {
        none:
          0,

        very_low:
          0.2,

        low:
          0.4,

        medium:
          0.65,

        high:
          0.85,

        very_high:
          0.95
      };

      if (
        labels[normalized] !==
        undefined
      ) {
        return labels[normalized];
      }
    }

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
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

  toArray(value) {
    if (
      Array.isArray(value)
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

    return [value];
  },

  mergeUnique(...values) {
    const result = [];
    const seen =
      new Set();

    values
      .flatMap(value =>
        this.toArray(value)
      )
      .forEach(value => {
        const key =
          typeof value ===
          "string"
            ? this.normalize(
                value
              )
            : this.normalize(
                value.id ||
                value.name ||
                value.type ||
                value.value ||
                JSON.stringify(
                  value
                )
              );

        if (
          !key ||
          seen.has(key)
        ) {
          return;
        }

        seen.add(key);
        result.push(value);
      });

    return result;
  },

  cleanOriginal(value = "") {
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
        /\s+/g,
        " "
      )
      .trim();
  },

  normalize(value = "") {
    return this.cleanOriginal(
      value
    )
      .toLowerCase()
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

window.Ari.blueprintWriter =
  window.AriBlueprintWriter;

console.log(
  "ARI BLUEPRINT WRITER LOADED:",
  window.AriBlueprintWriter?.version
);