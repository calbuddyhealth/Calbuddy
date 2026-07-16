// ari/language/ari-ai-writer.js
// Ari AI Writer
//
// Purpose:
// Render one AI-assisted response candidate from the canonical Composer Packet.
//
// V3.0.0 — Focused AI Rendering / No Selection / No Deterministic Fallback Authority
//
// Architectural flow:
//
// Canonical Response Plan
//      ↓
// Composer Packet
//      ↓
// Arbiter Precheck authorizes AI rendering
//      ↓
// Ari AI Writer
//      ↓
// Explicit AI Candidate
//      ↓
// Response Candidate Arbiter
//
// Responsibilities:
// - Read the canonical current-turn request from the Composer Packet.
// - Read the canonical writer contract.
// - Read the focused Character realization instruction when supplied.
// - Read only authorized evidence already present in the Composer Packet.
// - Render or repair the canonical Response Plan.
// - Validate its own generated candidate.
// - Return one explicit candidate contract for arbitration.
//
// Non-responsibilities:
// - Does not decide whether AI writing is required.
// - Does not decide whether a Blueprint candidate should be preserved.
// - Does not select between candidates.
// - Does not restore rejected Blueprint candidates.
// - Does not create deterministic Character fallbacks.
// - Does not generate safety fallbacks.
// - Does not create memory acknowledgments.
// - Does not preserve locked developer responses.
// - Does not independently determine developer relevance.
// - Does not reinterpret the user’s meaning.
// - Does not classify conversation function.
// - Does not choose or modify the Response Plan.
// - Does not create response moves.
// - Does not override safety.
// - Does not retrieve memory, continuity, files, or knowledge.
// - Does not compose the final response.
// - Does not persist state.

window.Ari = window.Ari || {};

window.AriAIWriter = {
  version: "3.0.0",
  source: "ari-ai-writer",
  schemaVersion: "3.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async write(input = {}) {
    const packet =
      input.composerPacket ||
      input.packet ||
      null;

    const summary =
      input.summary ||
      {};

    const repairRequest =
      this.readRepairRequest({
        input,
        summary,
        packet
      });

    if (
      !packet ||
      typeof packet !==
        "object"
    ) {
      return this.returnCandidate({
        reason:
          "composer_packet_missing",

        usable:
          false,

        complete:
          false,

        requiresRepair:
          true,

        repairRequest
      });
    }

    if (
      packet.ready !==
      true
    ) {
      return this.returnCandidate({
        reason:
          "composer_packet_not_ready",

        usable:
          false,

        complete:
          false,

        requiresRepair:
          true,

        packet,

        repairRequest
      });
    }

    const request =
      this.readRequest(
        packet
      );

    const writerContract =
      this.readWriterContract(
        packet
      );

    const focusedCharacter =
      this.readFocusedCharacter(
        packet
      );

    if (
      !request.currentText
    ) {
      return this.returnCandidate({
        reason:
          "canonical_current_turn_missing",

        usable:
          false,

        complete:
          false,

        requiresRepair:
          true,

        packet,

        request,

        writerContract,

        focusedCharacter,

        repairRequest
      });
    }

    if (
      !this.aiWritingAuthorized({
        packet,
        writerContract,
        repairRequest
      })
    ) {
      return this.returnCandidate({
        reason:
          "ai_writing_not_authorized",

        usable:
          false,

        complete:
          false,

        requiresRepair:
          true,

        packet,

        request,

        writerContract,

        focusedCharacter,

        repairRequest,

        validation: {
          valid:
            false,

          complete:
            false,

          reason:
            "ai_writing_not_authorized",

          text:
            "",

          warnings:
            [],

          errors: [
            "ai_writing_not_authorized"
          ]
        }
      });
    }

    const instruction =
      this.buildInstruction({
        packet,
        request,
        writerContract,
        focusedCharacter,
        repairRequest
      });

    try {
      const generatedText =
        await this.requestAIDraft({
          packet,
          request,
          writerContract,
          instruction
        });

      const validation =
        this.validateGeneratedDraft({
          text:
            generatedText,

          packet,

          request,

          writerContract,

          focusedCharacter
        });

      return this.returnCandidate({
        draft:
          validation.text,

        reason:
          validation.valid
            ? repairRequest.required
              ? "ai_repair_candidate_generated"
              : "ai_candidate_generated"
            : "ai_candidate_failed_validation",

        usedAI:
          true,

        usable:
          validation.valid,

        complete:
          validation.complete,

        requiresRepair:
          !validation.valid ||
          !validation.complete,

        packet,

        request,

        writerContract,

        focusedCharacter,

        repairRequest,

        validation
      });
    } catch (error) {
      console.warn(
        "Ari AI Writer failed:",
        error
      );

      return this.returnCandidate({
        reason:
          "ai_generation_failed",

        usedAI:
          false,

        usable:
          false,

        complete:
          false,

        requiresRepair:
          true,

        packet,

        request,

        writerContract,

        focusedCharacter,

        repairRequest,

        validation: {
          valid:
            false,

          complete:
            false,

          reason:
            "ai_generation_failed",

          text:
            "",

          warnings:
            error?.message
              ? [
                  error.message
                ]
              : [],

          errors: [
            "ai_generation_failed"
          ]
        },

        error
      });
    }
  },

  /* =====================================================
     REPAIR AUTHORIZATION
  ===================================================== */

  readRepairRequest({
    input = {},
    summary = {},
    packet = {}
  } = {}) {
    const precheck =
      input.arbiterPrecheck ||
      summary.arbiterPrecheck ||
      packet
        ?.responseCandidateArbiter ||
      packet
        ?.responseCandidateArbitration ||
      null;

    const required =
      input.needsAIWriter ===
        true ||
      summary.needsAIWriter ===
        true ||
      summary.shouldRunAIWriter ===
        true ||
      precheck?.needsAIWriter ===
        true;

    const reason =
      input.aiRepairReason ||
      summary.aiRepairReason ||
      precheck?.aiRepairReason ||
      precheck?.reason ||
      null;

    return {
      required,

      reason,

      source:
        precheck?.source ||
        (
          required
            ? "draft_arbitration_stage"
            : null
        ),

      precheck:
        precheck &&
        typeof precheck ===
          "object"
          ? precheck
          : null,

      authority:
        "arbiter_precheck_ai_render_authorization"
    };
  },

  aiWritingAuthorized({
    packet = {},
    writerContract = {},
    repairRequest = {}
  } = {}) {
    if (
      packet.developerPacketLocked ===
        true ||
      packet.developer
        ?.locked ===
        true
    ) {
      return false;
    }

    if (
      packet.responseLocked ===
        true
    ) {
      return false;
    }

    if (
      packet.candidatePolicy
        ?.aiWriterAllowed ===
        false
    ) {
      return false;
    }

    if (
      writerContract
        .aiWriterAllowed ===
        false
    ) {
      return false;
    }

    /*
     * The Draft Arbitration Stage is the authority that
     * decides whether this writer should run.
     *
     * Compatibility remains for callers that invoke the
     * writer directly without attaching a precheck object,
     * provided the canonical packet explicitly permits AI.
     */
    if (
      repairRequest.required ===
      true
    ) {
      return true;
    }

    return (
      packet.candidatePolicy
        ?.aiWriterAllowed ===
        true ||
      packet.aiWriterAuthorized ===
        true
    );
  },

  /* =====================================================
     CANONICAL REQUEST
  ===================================================== */

  readRequest(packet = {}) {
    const request =
      packet.request ||
      {};

    const currentText =
      this.cleanOriginal(
        request.resolvedText ||
        request.semanticInputText ||
        request.effectiveText ||
        packet.resolvedUserQuestion ||
        packet.effectiveUserQuestion ||
        packet.semanticInputText ||
        request.currentText ||
        packet.currentTurnText ||
        packet.userQuestion ||
        ""
      );

    const originalText =
      this.cleanOriginal(
        request.originalText ||
        packet.originalUserQuestion ||
        currentText
      );

    return {
      turnId:
        request.turnId ||
        packet.turnId ||
        null,

      currentText,

      originalText,

      normalizedText:
        this.normalize(
          currentText
        ),

      contextLane:
        request.contextLane ||
        packet.contextLane ||
        "direct_current_turn",

      requiresPriorContext:
        request
          .requiresPriorContext ===
        true,

      currentTurnWasResolved:
        request
          .currentTurnWasStructurallyResolved ===
          true ||
        request
          .currentTurnWasSemanticallyResolved ===
          true ||
        packet.currentTurnWasResolved ===
          true,

      ellipticalFollowUpResolved:
        request
          .ellipticalFollowUpResolved ===
          true ||
        packet
          .ellipticalFollowUpResolved ===
          true,

      resolutionSource:
        request.resolutionSource ||
        packet.resolutionSource ||
        "none",

      originalTextPreserved:
        request
          .originalTextPreserved !==
        false,

      textWasRewritten:
        request.textWasRewritten ===
        true,

      authority:
        "composer_packet_canonical_current_turn"
    };
  },

  /* =====================================================
     WRITER CONTRACT
  ===================================================== */

  readWriterContract(packet = {}) {
    const responsePlan =
      packet
        .canonicalResponsePlan ||
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

    const responseMoves =
      this.normalizeMoves(
        this.firstNonEmptyArray(
          packet.responseMoves,
          responseControl
            .responseMoves,
          responsePlan
            .responseMoves,
          responsePlan.moves,
          instructions
            .responseMoves,
          instructions.moves,
          instructions.sequence
        )
      );

    const requiredBehaviors =
      this.mergeUnique(
        packet.requiredBehaviors,
        packet.responseRequired,
        responseControl
          .requiredBehaviors,
        responsePlan
          .requiredBehaviors,
        responsePlan.required,
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
        responsePlan.avoid,
        instructions
          .forbiddenBehaviors,
        instructions.avoid
      );

    const constraints =
      this.mergeUnique(
        packet
          .responseConstraints,
        responseControl
          .constraints,
        responsePlan
          .constraints,
        instructions.constraints
      );

    const responseRules =
      this.mergeUnique(
        packet.responseRules,
        responseControl.rules,
        responsePlan
          .responseRules,
        instructions
          .responseRules,
        instructions.rules
      );

    const questionPolicy =
      responseControl
        .questionPolicy ||
      responsePlan
        .interactionPolicy ||
      {};

    const shouldAskQuestion =
      packet.shouldAskQuestion ===
        true ||
      questionPolicy
        .shouldAskQuestion ===
        true ||
      questionPolicy
        .questionRequired ===
        true ||
      responsePlan
        .shouldAskQuestion ===
        true ||
      instructions
        .questionRequired ===
        true;

    const maximumQuestions =
      this.firstFiniteNumber([
        questionPolicy
          .maximumQuestions,

        questionPolicy
          .maxQuestions,

        instructions
          .maxQuestions,

        shouldAskQuestion
          ? 1
          : 0
      ]);

    const finalQuestionAllowed =
      shouldAskQuestion ||
      questionPolicy
        .finalQuestionAllowed ===
        true ||
      instructions
        .finalQuestionAllowed ===
        true;

    return {
      schema:
        "ari_ai_writer_contract",

      schemaVersion:
        this.schemaVersion,

      responseGoal:
        packet.responseGoal ||
        responseControl
          .responseGoal ||
        responsePlan
          .responseGoal ||
        responsePlan.strategy
          ?.responseGoal ||
        "answer_user",

      responseShape:
        packet.responseShape ||
        responseControl
          .responseShape ||
        responsePlan
          .responseShape ||
        responsePlan.strategy
          ?.responseShape ||
        instructions.shape ||
        "clear_response",

      responsePosture:
        packet.responsePosture ||
        responseControl
          .responsePosture ||
        responsePlan
          .responsePosture ||
        responsePlan.strategy
          ?.responsePosture ||
        instructions.posture ||
        null,

      currentNeed:
        responsePlan.currentNeed ||
        responsePlan
          .interpretation
          ?.currentNeed ||
        packet.currentNeed ||
        null,

      responseMoves,

      requiredMoveIds:
        responseMoves
          .filter(
            move =>
              move.required !==
                false &&
              move.userFacing !==
                false
          )
          .map(
            move =>
              move.id
          ),

      advicePolicy:
        packet.advicePolicy ||
        responseControl
          .advicePolicy ||
        responsePlan
          .advicePolicy ||
        responsePlan
          .interactionPolicy
          ?.advicePolicy ||
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
          true ||
        responsePlan
          .interactionPolicy
          ?.coachingPermissionRequired ===
          true,

      shouldAskQuestion,

      questionPurpose:
        packet.questionPurpose ||
        questionPolicy.purpose ||
        questionPolicy
          .questionPurpose ||
        responsePlan
          .questionPurpose ||
        instructions
          .questionPurpose ||
        null,

      finalQuestionAllowed,

      maximumQuestions:
        finalQuestionAllowed
          ? Math.max(
              0,
              Number(
                maximumQuestions ??
                1
              )
            )
          : 0,

      requiredBehaviors,

      forbiddenBehaviors,

      constraints,

      responseRules,

      blueprintHint:
        packet.blueprintHint ||
        responseControl
          .blueprintHint ||
        responsePlan
          .blueprintHint ||
        responsePlan.blueprint
          ?.id ||
        instructions
          .blueprintId ||
        null,

      maxSentences:
        this.firstFiniteNumber([
          instructions.maxSentences,
          packet
            .communicationPlan
            ?.languageBudget
            ?.maxSentences,
          null
        ]),

      minimumSentences:
        this.firstFiniteNumber([
          instructions
            .minimumSentences,
          null
        ]),

      maxWords:
        this.firstFiniteNumber([
          instructions.maxWords,
          packet
            .communicationPlan
            ?.languageBudget
            ?.maxWords,
          null
        ]),

      maxParagraphs:
        this.firstFiniteNumber([
          instructions
            .maxParagraphs,
          packet
            .communicationPlan
            ?.languageBudget
            ?.maxParagraphs,
          null
        ]),

      answerFirst:
        instructions.answerFirst !==
        false,

      reflectFirst:
        instructions.reflectFirst ===
        true,

      preserveMoveOrder:
        instructions
          .preserveMoveOrder !==
        false,

      preserveOriginalTurn:
        instructions
          .preserveOriginalTurn !==
        false,

      useConcreteTerms:
        instructions
          .useConcreteTerms !==
        false,

      onePracticalStepMaximum:
        instructions
          .onePracticalStepMaximum ===
        true,

      factualClaimPolicy:
        instructions
          .factualClaimPolicy ||
        "require_authorized_evidence_or_uncertainty",

      aiWriterAllowed:
        packet.candidatePolicy
          ?.aiWriterAllowed !==
        false,

      candidatePolicy:
        packet.candidatePolicy ||
        {},

      authority:
        "canonical_ai_language_rendering_contract"
    };
  },

  normalizeMoves(moves = []) {
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

            return id
              ? {
                  id,

                  order:
                    index,

                  required:
                    true,

                  userFacing:
                    true,

                  renderPolicy:
                    "render",

                  purpose:
                    null,

                  contentHint:
                    null,

                  evidenceRefs:
                    []
                }
              : null;
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
                  : "render"
              ),

            purpose:
              move.purpose ||
              null,

            contentHint:
              move
                .contentGuidance ||
              move.contentHint ||
              move.hint ||
              null,

            evidenceRefs:
              this.toArray(
                move.evidenceRefs
              ),

            source:
              move.source ||
              "canonical_response_plan"
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

  /* =====================================================
     FOCUSED CHARACTER HANDOFF
  ===================================================== */

  readFocusedCharacter(
    packet = {}
  ) {
    const context =
      packet.characterContext ||
      {};

    const candidate =
      packet.characterCandidate ||
      packet.draftGeneration
        ?.characterCandidate ||
      null;

    const character =
      packet.composerCharacter ||
      packet.character ||
      context.character ||
      null;

    const handoff =
      packet.characterHandoff ||
      context.handoff ||
      null;

    const realization =
      packet.characterRealization ||
      candidate?.realization ||
      context.realization ||
      character?.realization ||
      handoff?.realization ||
      {};

    const answerAvailable =
      packet
        .characterAnswerAvailable ===
        true ||
      candidate
        ?.answerAvailable ===
        true ||
      context.answerAvailable ===
        true ||
      character?.answerAvailable ===
        true ||
      handoff?.answerAvailable ===
        true;

    const needsAIWriter =
      packet
        .characterNeedsAIWriter ===
        true ||
      candidate?.needsAIWriter ===
        true ||
      context.needsAIWriter ===
        true ||
      realization.needsAIWriter ===
        true ||
      handoff?.needsAIWriter ===
        true;

    return {
      available:
        Boolean(
          candidate ||
          character ||
          handoff ||
          Object.keys(
            context
          ).length
        ),

      relevant:
        packet.characterRelevant ===
          true ||
        candidate?.available ===
          true ||
        context.relevant ===
          true ||
        character?.relevant ===
          true ||
        handoff?.relevant ===
          true ||
        answerAvailable,

      answerAvailable,

      needsAIWriter,

      type:
        packet.characterType ||
        candidate?.type ||
        context.type ||
        character?.type ||
        handoff?.type ||
        null,

      subtype:
        packet.characterSubtype ||
        candidate?.subtype ||
        context.subtype ||
        character?.subtype ||
        handoff?.subtype ||
        null,

      focus:
        packet.characterFocus ||
        candidate?.focus ||
        context.focus ||
        character?.focus ||
        handoff?.focus ||
        null,

      subject:
        packet.characterSubject ||
        candidate?.subject ||
        context.subject ||
        character?.subject ||
        handoff?.subject ||
        null,

      status:
        packet.characterStatus ||
        candidate?.status ||
        context.status ||
        character?.status ||
        handoff?.status ||
        null,

      answer:
        this.cleanInstructionValue(
          packet.characterAnswer ||
          candidate?.answer ||
          context.answer ||
          character?.answer ||
          handoff?.answer ||
          ""
        ),

      groundedMeaning:
        this.cleanInstructionValue(
          packet
            .characterGroundedMeaning ||
          candidate
            ?.groundedMeaning ||
          context
            .groundedMeaning ||
          character
            ?.groundedMeaning ||
          handoff
            ?.groundedMeaning ||
          ""
        ),

      deterministicDraft:
        this.cleanInstructionValue(
          packet
            .characterDeterministicDraft ||
          packet.characterDraft ||
          candidate
            ?.deterministicDraft ||
          candidate?.draft ||
          context.draft ||
          character
            ?.deterministicDraft ||
          character?.draft ||
          handoff
            ?.deterministicDraft ||
          handoff?.draft ||
          ""
        ),

      aiWriterMode:
        packet
          .characterAIWriterMode ||
        candidate?.aiWriterMode ||
        context.aiWriterMode ||
        realization.aiWriterMode ||
        handoff?.aiWriterMode ||
        null,

      aiInstruction:
        this.cleanOriginal(
          packet
            .characterAIInstruction ||
          candidate?.aiInstruction ||
          context.aiInstruction ||
          realization.aiInstruction ||
          handoff?.aiInstruction ||
          ""
        ),

      preserveMeaning:
        realization
          .preserveMeaning !==
        false,

      preserveStatus:
        realization
          .preserveStatus !==
        false,

      preserveValue:
        realization
          .preserveValue ===
          true,

      preservePosition:
        realization
          .preservePosition ===
          true,

      preserveOpenStatus:
        realization
          .preserveOpenStatus ===
          true,

      tentativeLanguageRequired:
        realization
          .tentativeLanguageRequired ===
          true,

      authority:
        "focused_character_handoff_only"
    };
  },

  /* =====================================================
     AUTHORIZED EVIDENCE
  ===================================================== */

  buildAuthorizedEvidence(
    packet = {}
  ) {
    const developerAuthorized =
      packet.developerRelevant ===
        true ||
      packet.developer
        ?.relevant ===
        true ||
      packet.developer
        ?.allowed ===
        true;

    return {
      meaning:
        packet.meaningInterpretation ||
        packet.evidence
          ?.understanding
          ?.meaning ||
        null,

      humanState:
        packet.humanState ||
        packet.evidence
          ?.understanding
          ?.humanState ||
        null,

      knowledge:
        packet.knowledge ||
        packet.evidence
          ?.knowledge ||
        null,

      continuity:
        packet.continuity ||
        packet.evidence
          ?.continuity ||
        null,

      activeDialogueState:
        packet
          .activeDialogueState ||
        packet.evidence
          ?.continuity
          ?.activeDialogueState ||
        null,

      memory:
        packet.memory ||
        packet.evidence
          ?.memory ||
        null,

      safety:
        packet.safety ||
        packet.evidence
          ?.safety ||
        null,

      reasoning:
        packet.reasoning ||
        packet.evidence
          ?.reasoning ||
        null,

      languageGuidance:
        packet.languageGuidance ||
        packet.evidence
          ?.languageGuidance ||
        null,

      humanLanguageProfile:
        packet
          .humanLanguageProfile ||
        packet.evidence
          ?.humanLanguageProfile ||
        null,

      preferredTerms:
        packet.preferredTerms ||
        packet.evidence
          ?.preferredTerms ||
        null,

      thesis:
        packet.thesis ||
        null,

      developer:
        developerAuthorized
          ? {
              github:
                packet.evidence
                  ?.github ||
                null,

              intent:
                packet.evidence
                  ?.developerIntent ||
                null,

              handoff:
                packet.evidence
                  ?.developerHandoff ||
                null,

              response:
                packet.evidence
                  ?.developerResponse ||
                null,

              codeUnderstanding:
                packet.evidence
                  ?.codeUnderstanding ||
                null
            }
          : null
    };
  },

  /* =====================================================
     AI REQUEST
  ===================================================== */

  async requestAIDraft({
    packet = {},
    request = {},
    writerContract = {},
    instruction = ""
  } = {}) {
    const client =
      window
        .AriOpenAIKnowledgeClient;

    if (
      !client ||
      typeof client.ask !==
        "function"
    ) {
      throw new Error(
        "ari_openai_knowledge_client_unavailable"
      );
    }

    const result =
      await client.ask({
        summary: {
          userMessage:
            request.currentText,

          message:
            request.currentText,

          input:
            request.currentText,

          question:
            request.currentText,

          originalUserMessage:
            request.originalText,

          resolvedUserQuestion:
            request.currentText,

          aiInstruction:
            instruction,

          responseGoal:
            writerContract
              .responseGoal ||
            null,

          responseShape:
            writerContract
              .responseShape ||
            null,

          responsePosture:
            writerContract
              .responsePosture ||
            null,

          source:
            this.source,

          aiWriterVersion:
            this.version,

          composerPacketTurnId:
            request.turnId ||
            null,

          aiRepairReason:
            packet.aiRepairReason ||
            packet
              .responseCandidateArbiter
              ?.aiRepairReason ||
            null
        }
      });

    return this.cleanOriginal(
      result?.finalResponse ||
      result?.knowledgeAnswer ||
      result?.response ||
      result?.answer ||
      result?.text ||
      ""
    );
  },

  /* =====================================================
     AI INSTRUCTION
  ===================================================== */

  buildInstruction({
    packet = {},
    request = {},
    writerContract = {},
    focusedCharacter = {},
    repairRequest = {}
  } = {}) {
    const responseMoveText =
      writerContract
        .responseMoves
        .map(
          (
            move,
            index
          ) => {
            const attributes = [
              move.required
                ? "required"
                : "optional",

              move.userFacing
                ? "user-facing"
                : "instruction-only",

              move.contentHint
                ? `guidance: ${this.extractInstructionText(
                    move.contentHint
                  )}`
                : null
            ]
              .filter(Boolean)
              .join("; ");

            return (
              `${index + 1}. ${move.id}` +
              (
                attributes
                  ? ` — ${attributes}`
                  : ""
              )
            );
          }
        )
        .join("\n");

    const evidence =
      this.buildAuthorizedEvidence(
        packet
      );

    const characterStatus =
      typeof focusedCharacter
        .status ===
        "string"
        ? focusedCharacter.status
        : focusedCharacter
            .status
            ?.overall ||
          null;

    return `
You are Ari's authorized AI language renderer.

You are not the response planner, router, classifier, arbiter, safety authority, memory authority, Character authority, or final composer.

Your only task is to produce one user-facing response candidate that follows the canonical contract below.

CURRENT TURN

Resolved current turn:
${request.currentText}

Original current turn:
${request.originalText || request.currentText}

Turn resolution:
- resolved: ${request.currentTurnWasResolved ? "yes" : "no"}
- elliptical follow-up resolved: ${request.ellipticalFollowUpResolved ? "yes" : "no"}
- resolution source: ${request.resolutionSource || "none"}

CURRENT-TURN RULES

- Answer the resolved current turn.
- Preserve the operation requested by the user.
- Do not replace the current turn with prior conversation context.
- Do not reinterpret the user's meaning.
- Do not classify the request.
- Do not invent missing context.
- Do not mention resolution, routing, planning, packets, stages, candidates, or diagnostics.

RENDER AUTHORIZATION

- AI rendering requested: ${repairRequest.required ? "yes" : "no"}
- AI repair reason: ${repairRequest.reason || "none"}

RESPONSE CONTRACT

Response goal:
${writerContract.responseGoal}

Response shape:
${writerContract.responseShape}

Response posture:
${writerContract.responsePosture || "natural_direct"}

Current need:
${writerContract.currentNeed || "not_specified"}

Advice policy:
${writerContract.advicePolicy}

Coaching permission required:
${writerContract.coachingPermissionRequired ? "yes" : "no"}

Question policy:
- question required: ${writerContract.shouldAskQuestion ? "yes" : "no"}
- final question allowed: ${writerContract.finalQuestionAllowed ? "yes" : "no"}
- maximum user-directed questions: ${writerContract.maximumQuestions}
- question purpose: ${writerContract.questionPurpose || "none"}

CANONICAL RESPONSE MOVES

${
  responseMoveText ||
  "No explicit response moves were supplied. Follow the response goal and constraints without inventing a new plan."
}

REQUIRED BEHAVIORS

${this.formatInstructionList(
  writerContract
    .requiredBehaviors,
  "None supplied."
)}

FORBIDDEN BEHAVIORS

${this.formatInstructionList(
  writerContract
    .forbiddenBehaviors,
  "None supplied."
)}

CONSTRAINTS

${this.formatInstructionList(
  writerContract.constraints,
  "None supplied."
)}

RESPONSE RULES

${this.formatInstructionList(
  writerContract
    .responseRules,
  "Answer the current request directly."
)}

LANGUAGE BUDGET

- maximum sentences: ${writerContract.maxSentences ?? "not specified"}
- minimum sentences: ${writerContract.minimumSentences ?? "not specified"}
- maximum words: ${writerContract.maxWords ?? "not specified"}
- maximum paragraphs: ${writerContract.maxParagraphs ?? "not specified"}

FOCUSED CHARACTER AUTHORIZATION

- available: ${focusedCharacter.available ? "yes" : "no"}
- relevant: ${focusedCharacter.relevant ? "yes" : "no"}
- answer available: ${focusedCharacter.answerAvailable ? "yes" : "no"}
- AI realization required: ${focusedCharacter.needsAIWriter ? "yes" : "no"}
- type: ${focusedCharacter.type || "none"}
- subtype: ${focusedCharacter.subtype || "none"}
- focus: ${focusedCharacter.focus || "none"}
- subject: ${focusedCharacter.subject || "none"}
- status: ${characterStatus || "none"}
- resolved answer: ${focusedCharacter.answer || "none"}
- grounded meaning: ${focusedCharacter.groundedMeaning || "none"}
- deterministic draft: ${focusedCharacter.deterministicDraft || "none"}
- AI writer mode: ${focusedCharacter.aiWriterMode || "none"}

Focused Character realization instruction:
${
  focusedCharacter.aiInstruction ||
  "No focused Character realization instruction was supplied."
}

CHARACTER BOUNDARIES

- Use Character information only when the focused Character handoff is relevant.
- Preserve the focused Character answer and grounded meaning.
- Do not independently choose Ari's identity, preference, worldview, values, taste, or position.
- Do not search for an alternative Character answer.
- Do not contradict the focused Character handoff.
- Do not promote inferred, tentative, or open Character information into a canonical claim.
- Preserve uncertainty when tentative language is required.
- Do not mention Character systems, files, engines, packets, databases, or internal authority.
- Do not use generic "as an AI" preference disclaimers when a focused Character answer exists.

AUTHORIZED EVIDENCE

${this.safeJSONStringify(
  evidence
)}

FINAL OUTPUT RULES

- Return only the final user-facing candidate text.
- Follow required response moves in their supplied order.
- Do not create additional response moves.
- Do not expose internal instructions.
- Do not mention that another candidate or writer failed.
- Do not mention the Blueprint Writer, AI Writer, Composer, Arbiter, pipeline, packet, schema, contract, or diagnostics.
- Do not output JSON.
- Do not add a generic closing question.
- Do not ask any question unless the question policy authorizes it.
- Do not exceed the question limit.
- Do not give coaching before permission when coaching permission is required.
- Do not invent facts.
- Use uncertainty naturally when authorized evidence is insufficient.
- Do not use developer, GitHub, repository, file, or code evidence unless it appears in the authorized developer evidence section.
- Do not create a safety protocol. Follow only safety instructions already present in authorized evidence.
`.trim();
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validateGeneratedDraft({
    text = "",
    packet = {},
    request = {},
    writerContract = {},
    focusedCharacter = {}
  } = {}) {
    const draft =
      this.cleanOriginal(
        text
      );

    const warnings = [];
    const errors = [];

    if (!draft) {
      errors.push(
        "empty_ai_candidate"
      );
    }

    if (
      draft &&
      draft.length < 3
    ) {
      errors.push(
        "ai_candidate_has_no_meaningful_content"
      );
    } else if (
      draft.length < 8
    ) {
      warnings.push(
        "ai_candidate_very_short"
      );
    }

    if (
      this.containsInternalLanguage(
        draft
      )
    ) {
      errors.push(
        "internal_pipeline_language_detected"
      );
    }

    if (
      this.containsWriterFailureMessage(
        draft
      )
    ) {
      errors.push(
        "writer_failure_message_detected"
      );
    }

    if (
      this.containsRawJSONDump(
        draft
      )
    ) {
      errors.push(
        "raw_json_detected"
      );
    }

    if (
      !this.developerEvidenceAuthorized(
        packet
      ) &&
      this.containsDeveloperEvidenceClaim(
        draft
      )
    ) {
      errors.push(
        "unauthorized_developer_evidence_claim"
      );
    }

    if (
      request
        .originalTextPreserved ===
        false ||
      request.textWasRewritten ===
        true
    ) {
      warnings.push(
        "current_turn_provenance_warning"
      );
    }

    if (
      focusedCharacter
        .answerAvailable ===
        true &&
      focusedCharacter.relevant ===
        true &&
      this.containsGenericCharacterDodge(
        draft
      )
    ) {
      errors.push(
        "generic_character_dodge_detected"
      );
    }

    const interactionQuestionCount =
      this.countUserDirectedQuestions(
        draft
      );

    if (
      writerContract
        .shouldAskQuestion ===
        true &&
      interactionQuestionCount ===
        0
    ) {
      errors.push(
        "required_question_missing"
      );
    }

    if (
      writerContract
        .finalQuestionAllowed !==
        true &&
      interactionQuestionCount >
        0
    ) {
      errors.push(
        "unauthorized_question_detected"
      );
    }

    if (
      interactionQuestionCount >
      Number(
        writerContract
          .maximumQuestions ||
        0
      )
    ) {
      errors.push(
        "question_limit_exceeded"
      );
    }

    if (
      writerContract
        .coachingPermissionRequired ===
        true &&
      this.containsAdviceLanguage(
        draft
      ) &&
      interactionQuestionCount ===
        0
    ) {
      errors.push(
        "coaching_given_without_permission"
      );
    }

    const sentenceCount =
      this.splitSentences(
        draft
      ).length;

    const wordCount =
      this.countWords(
        draft
      );

    const paragraphCount =
      this.countParagraphs(
        draft
      );

    if (
      writerContract.maxSentences &&
      sentenceCount >
        writerContract
          .maxSentences
    ) {
      warnings.push(
        "sentence_budget_exceeded"
      );
    }

    if (
      writerContract.maxWords &&
      wordCount >
        writerContract
          .maxWords
    ) {
      warnings.push(
        "word_budget_exceeded"
      );
    }

    if (
      writerContract.maxParagraphs &&
      paragraphCount >
        writerContract
          .maxParagraphs
    ) {
      warnings.push(
        "paragraph_budget_exceeded"
      );
    }

    if (
      writerContract
        .minimumSentences &&
      sentenceCount <
        writerContract
          .minimumSentences
    ) {
      warnings.push(
        "minimum_sentence_target_not_met"
      );
    }

    const responseMoveCoverage =
      this.evaluateResponseMoveCoverage({
        draft,
        writerContract
      });

    if (
      !responseMoveCoverage.complete
    ) {
      errors.push(
        "required_response_move_coverage_unconfirmed"
      );
    }

    const valid =
      errors.length ===
        0 &&
      Boolean(
        draft
      );

    return {
      valid,

      complete:
        valid &&
        responseMoveCoverage
          .complete,

      reason:
        errors[0] ||
        "valid_ai_candidate",

      text:
        draft,

      warnings:
        this.uniqueValues(
          warnings
        ),

      errors:
        this.uniqueValues(
          errors
        ),

      sentenceCount,

      wordCount,

      paragraphCount,

      questionCount:
        interactionQuestionCount,

      totalQuestionMarkCount:
        this.countQuestions(
          draft
        ),

      requiredMoveCoverage:
        responseMoveCoverage,

      candidatePreserved:
        true,

      finalSelectionAuthority:
        "ari-response-candidate-arbiter"
    };
  },

  evaluateResponseMoveCoverage({
    draft = "",
    writerContract = {}
  } = {}) {
    const requiredMoves =
      this.toArray(
        writerContract
          .responseMoves
      ).filter(
        move =>
          move.required !==
            false &&
          move.userFacing !==
            false &&
          move.renderPolicy !==
            "instruction_only"
      );

    if (
      !requiredMoves.length
    ) {
      return {
        complete:
          true,

        requiredMoveCount:
          0,

        confirmedMoveIds:
          [],

        unconfirmedMoveIds:
          []
      };
    }

    const confirmedMoveIds = [];
    const unconfirmedMoveIds = [];

    requiredMoves.forEach(
      move => {
        const explicitValidation =
          this.readExplicitMoveValidation({
            move,
            writerContract
          });

        if (
          explicitValidation ===
          true
        ) {
          confirmedMoveIds.push(
            move.id
          );

          return;
        }

        if (
          this.moveAppearsRepresented({
            move,
            draft
          })
        ) {
          confirmedMoveIds.push(
            move.id
          );
        } else {
          unconfirmedMoveIds.push(
            move.id
          );
        }
      }
    );

    return {
      complete:
        unconfirmedMoveIds
          .length ===
        0,

      requiredMoveCount:
        requiredMoves.length,

      confirmedMoveIds,

      unconfirmedMoveIds
    };
  },

  readExplicitMoveValidation({
    move = {},
    writerContract = {}
  } = {}) {
    const validations =
      writerContract
        .candidatePolicy
        ?.responseMoveValidation ||
      {};

    if (
      validations[
        move.id
      ] === true
    ) {
      return true;
    }

    return null;
  },

  moveAppearsRepresented({
    move = {},
    draft = ""
  } = {}) {
    const text =
      this.normalize(
        draft
      );

    const moveId =
      this.normalizeIdentifier(
        move.id ||
        ""
      );

    if (!moveId) {
      return false;
    }

    /*
     * Universal structural moves can be checked without
     * interpreting the user's meaning.
     */
    if (
      moveId ===
      "answer_directly"
    ) {
      return Boolean(
        text
      );
    }

    if (
      moveId ===
      "ask_clarifying_question"
    ) {
      return (
        this.countUserDirectedQuestions(
          draft
        ) >
        0
      );
    }

    if (
      moveId ===
      "ask_permission_before_coaching"
    ) {
      return /\b(?:do you want|would you like|want me to)\b.*\?/i
        .test(
          draft
        );
    }

    if (
      moveId ===
      "memory_acknowledgment"
    ) {
      return /\b(?:i(?:'|’)ll remember|i will remember|got it|keep that in mind)\b/i
        .test(
          draft
        );
    }

    /*
     * When a move carries explicit content guidance, use
     * its significant terms as a limited rendering check.
     * The writer does not maintain a second global library
     * of semantic move definitions.
     */
    const contentHint =
      this.extractInstructionText(
        move.contentHint ||
        move.purpose ||
        ""
      );

    if (!contentHint) {
      /*
       * Unknown semantic moves are not reinterpreted here.
       * Their presence was supplied to the model, but the
       * writer cannot independently prove their meaning.
       */
      return true;
    }

    const significantTerms =
      this.extractSignificantTerms(
        contentHint
      );

    if (
      !significantTerms.length
    ) {
      return true;
    }

    return significantTerms.some(
      term =>
        text.includes(
          term
        )
    );
  },

  /* =====================================================
     RETURN CONTRACT
  ===================================================== */

  returnCandidate({
    draft = "",
    reason = "ai_writer_result",
    usedAI = false,
    usable = false,
    complete = false,
    requiresRepair = false,
    packet = {},
    request = {},
    writerContract = {},
    focusedCharacter = {},
    repairRequest = {},
    validation = null,
    error = null
  } = {}) {
    const text =
      this.cleanOriginal(
        draft
      );

    const responseMoves =
      this.toArray(
        writerContract
          .responseMoves
      );

    const candidateValidation =
      validation ||
      {
        valid:
          usable ===
          true,

        complete:
          complete ===
          true,

        reason,

        text,

        warnings:
          [],

        errors:
          usable
            ? []
            : [
                reason
              ]
      };

    const candidate = {
      id:
        this.createCandidateId({
          turnId:
            request.turnId,

          text,

          reason
        }),

      source:
        "ai_writer",

      text,

      priority:
        usable
          ? usedAI
            ? 80
            : 65
          : 20,

      usable:
        usable ===
        true,

      complete:
        complete ===
        true,

      requiresAIRepair:
        requiresRepair ===
        true,

      requiresRepair:
        requiresRepair ===
        true,

      taskType:
        "canonical_response_plan_ai_render",

      validation:
        candidateValidation,

      evidence: {
        usedAI:
          usedAI ===
          true,

        writerMarkedUsable:
          usable ===
          true,

        writerMarkedComplete:
          complete ===
          true,

        writerRequiresRepair:
          requiresRepair ===
          true,

        validated:
          candidateValidation
            ?.valid ===
          true,

        repairRequested:
          repairRequest.required ===
          true,

        repairReason:
          repairRequest.reason ||
          null,

        writerReason:
          reason,

        writerSource:
          this.source,

        writerVersion:
          this.version,

        canonicalResponsePlanUsed:
          Boolean(
            packet
              .canonicalResponsePlan ||
            packet.responsePlan
          ),

        responseMovesSatisfied:
          candidateValidation
            ?.requiredMoveCoverage
            ?.complete ===
          true,

        candidatePreserved:
          candidateValidation
            ?.candidatePreserved ===
          true,

        groundedInCurrentFile:
          packet.developerRelevant ===
            true &&
          Boolean(
            packet.evidence
              ?.github
              ?.content
          ),

        turnId:
          request.turnId ||
          null,

        sourceQuestion:
          request.originalText ||
          null,

        characterAvailable:
          focusedCharacter
            .available ===
          true,

        characterRelevant:
          focusedCharacter
            .relevant ===
          true,

        characterAnswerAvailable:
          focusedCharacter
            .answerAvailable ===
          true,

        characterRealizationRequired:
          focusedCharacter
            .needsAIWriter ===
          true,

        characterType:
          focusedCharacter.type ||
          null,

        characterSubtype:
          focusedCharacter.subtype ||
          null,

        characterFocus:
          focusedCharacter.focus ||
          null,

        characterStatus:
          focusedCharacter.status ||
          null
      }
    };

    const result = {
      schema:
        "ari_ai_writer_candidate",

      schemaVersion:
        this.schemaVersion,

      aiWriterRan:
        true,

      aiWriterUsedAI:
        usedAI ===
        true,

      aiWriterSource:
        this.source,

      aiWriterVersion:
        this.version,

      aiWriterSchemaVersion:
        this.schemaVersion,

      aiWriterReason:
        reason,

      aiWriterFallbackReason:
        usedAI
          ? null
          : reason,

      aiWriterUsable:
        usable ===
        true,

      aiWriterComplete:
        complete ===
        true,

      aiWriterRequiresRepair:
        requiresRepair ===
        true,

      draft:
        text,

      aiWriterDraft:
        text,

      candidate,

      validation:
        candidateValidation,

      repairRequest: {
        required:
          repairRequest.required ===
          true,

        reason:
          repairRequest.reason ||
          null,

        source:
          repairRequest.source ||
          null
      },

      responseGoal:
        writerContract
          .responseGoal ||
        packet.responseGoal ||
        null,

      responseShape:
        writerContract
          .responseShape ||
        packet.responseShape ||
        null,

      responsePosture:
        writerContract
          .responsePosture ||
        packet.responsePosture ||
        null,

      responseMoves,

      responseMoveIds:
        responseMoves
          .map(
            move =>
              move?.id
          )
          .filter(Boolean),

      canonicalResponsePlanUsed:
        Boolean(
          packet
            .canonicalResponsePlan ||
          packet.responsePlan
        ),

      responseMovesSatisfied:
        candidateValidation
          ?.requiredMoveCoverage
          ?.complete ===
        true,

      aiWriterUsedCharacter:
        focusedCharacter.relevant ===
          true &&
        focusedCharacter
          .answerAvailable ===
          true,

      characterRealizationRequired:
        focusedCharacter
          .needsAIWriter ===
        true,

      characterAIWriterMode:
        focusedCharacter
          .aiWriterMode ||
        null,

      characterFocus:
        focusedCharacter.focus ||
        null,

      characterType:
        focusedCharacter.type ||
        null,

      characterStatus:
        focusedCharacter.status ||
        null,

      diagnostics: {
        reason,

        usedAI:
          usedAI ===
          true,

        usable:
          usable ===
          true,

        complete:
          complete ===
          true,

        requiresRepair:
          requiresRepair ===
          true,

        turnId:
          request.turnId ||
          null,

        characterCount:
          text.length,

        wordCount:
          this.countWords(
            text
          ),

        sentenceCount:
          this.splitSentences(
            text
          ).length,

        questionCount:
          this.countUserDirectedQuestions(
            text
          ),

        validationErrors:
          this.toArray(
            candidateValidation
              ?.errors
          ),

        validationWarnings:
          this.toArray(
            candidateValidation
              ?.warnings
          ),

        error:
          error?.message ||
          (
            error
              ? String(
                  error
                )
              : null
          )
      },

      authority:
        this.getAuthorityBoundaries()
    };

    window.Ari.aiWriterState =
      result;

    return result;
  },

  getAuthorityBoundaries() {
    return {
      canRenderCanonicalResponsePlan:
        true,

      canRepairAuthorizedCandidateGap:
        true,

      canUseAuthorizedCharacterHandoff:
        true,

      canUseAuthorizedEvidence:
        true,

      canValidateOwnCandidate:
        true,

      canDetermineWhetherAIIsNeeded:
        false,

      canSelectBlueprintCandidate:
        false,

      canPreserveBlueprintCandidate:
        false,

      canRestoreRejectedCandidate:
        false,

      canCreateCharacterFallback:
        false,

      canCreateSafetyFallback:
        false,

      canCreateMemoryAcknowledgment:
        false,

      canPreserveLockedDeveloperReply:
        false,

      canDetermineDeveloperRelevance:
        false,

      canChooseResponsePlan:
        false,

      canChangeResponseGoal:
        false,

      canChangeResponseShape:
        false,

      canChangeResponseMoves:
        false,

      canInterpretMeaning:
        false,

      canClassifyConversationFunction:
        false,

      canOverrideSafety:
        false,

      canSelectFinalDraft:
        false,

      canComposeFinalResponse:
        false,

      canRetrieveEvidence:
        false,

      canPersistState:
        false,

      role:
        "authorized_canonical_response_plan_ai_renderer"
    };
  },

  /* =====================================================
     CONTENT VALIDATION
  ===================================================== */

  developerEvidenceAuthorized(
    packet = {}
  ) {
    return (
      packet.developerRelevant ===
        true ||
      packet.developer
        ?.relevant ===
        true ||
      packet.developer
        ?.allowed ===
        true
    );
  },

  containsInternalLanguage(
    text = ""
  ) {
    const normalized =
      this.normalize(
        text
      );

    const phrases = [
      "canonical response plan",
      "response planner",
      "response move",
      "response shape",
      "response strategy",
      "writer contract",
      "composer packet",
      "composer bridge",
      "blueprint writer",
      "ai writer",
      "candidate arbiter",
      "response candidate arbiter",
      "pipeline diagnostic",
      "pipeline stage",
      "internal planner",
      "according to the packet",
      "according to the response plan",
      "the writer should",
      "the composer should",
      "the user is asking"
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
      this.normalize(
        text
      );

    const phrases = [
      "the ai draft was unavailable",
      "ai was unavailable",
      "ai writer failed",
      "blueprint writer failed",
      "the draft failed",
      "the writer was unavailable",
      "no usable response candidate",
      "composer packet missing",
      "try once more",
      "the response generator failed",
      "i cannot generate the response"
    ];

    return phrases.some(
      phrase =>
        normalized.includes(
          phrase
        )
    );
  },

  containsRawJSONDump(
    text = ""
  ) {
    const trimmed =
      String(
        text ||
        ""
      ).trim();

    if (!trimmed) {
      return false;
    }

    return (
      (
        trimmed.startsWith(
          "{"
        ) &&
        trimmed.endsWith(
          "}"
        )
      ) ||
      (
        trimmed.startsWith(
          "["
        ) &&
        trimmed.endsWith(
          "]"
        )
      ) ||
      /```json/i.test(
        trimmed
      )
    );
  },

  containsDeveloperEvidenceClaim(
    text = ""
  ) {
    return (
      /\bi (?:read|opened|checked|inspected|reviewed)\b.*\b(?:file|github|repo|repository|codebase)\b/i
        .test(
          text
        ) ||
      /\b(?:loaded file evidence|github evidence|repository evidence)\b/i
        .test(
          text
        )
    );
  },

  containsAdviceLanguage(
    text = ""
  ) {
    return /\b(?:you should|you need to|start by|try to|the next step|do this|make sure|i recommend|i'd recommend|consider doing)\b/i
      .test(
        text
      );
  },

  containsGenericCharacterDodge(
    text = ""
  ) {
    const normalized =
      this.normalize(
        text
      );

    const phrases = [
      "as an ai",
      "i don't have personal",
      "i do not have personal",
      "i don't have a favorite",
      "i do not have a favorite",
      "i don't have preferences",
      "i do not have preferences"
    ];

    return phrases.some(
      phrase =>
        normalized.includes(
          phrase
        )
    );
  },

  /* =====================================================
     QUESTION DETECTION
  ===================================================== */

  isQuotedOrNarrativeQuestion(
    sentence = ""
  ) {
    const value =
      this.cleanOriginal(
        sentence
      );

    if (
      !value ||
      !value.includes(
        "?"
      )
    ) {
      return false;
    }

    const quotedQuestion =
      /["“'][^"”']*\?[^"”']*["”']/u
        .test(
          value
        );

    const attributedQuestion =
      /\?\s*["”']?\s*(?:he|she|they|i|we|the\s+\w+|[A-Z][a-z]+)\s+(?:asked|said|whispered|shouted|replied|wondered|called|murmured)\b/u
        .test(
          value
        );

    return (
      quotedQuestion ||
      attributedQuestion
    );
  },

  isUserDirectedQuestion(
    sentence = ""
  ) {
    const value =
      this.cleanOriginal(
        sentence
      );

    if (
      !value ||
      !value.includes(
        "?"
      )
    ) {
      return false;
    }

    if (
      this.isQuotedOrNarrativeQuestion(
        value
      )
    ) {
      return false;
    }

    const normalized =
      this.normalize(
        value
      );

    return (
      /^(?:so\s+)?(?:do|did|are|were|have|has|can|could|would|will|should|what|why|how|where|when|who|which)\b/
        .test(
          normalized
        ) ||
      /\b(?:do you|did you|are you|were you|have you|can you|could you|would you|will you|what do you|what did you|how do you|how are you|why do you|where do you|when do you|would you like|do you want|want me to)\b/
        .test(
          normalized
        )
    );
  },

  countUserDirectedQuestions(
    value = ""
  ) {
    return this
      .splitSentences(
        value
      )
      .filter(
        sentence =>
          this.isUserDirectedQuestion(
            sentence
          )
      )
      .length;
  },

  countQuestions(
    value = ""
  ) {
    return (
      String(
        value ||
        ""
      ).match(
        /\?/g
      ) ||
      []
    ).length;
  },

  /* =====================================================
     INSTRUCTION UTILITIES
  ===================================================== */

  formatInstructionList(
    values = [],
    fallback = ""
  ) {
    const items =
      this.toArray(
        values
      )
        .map(
          value =>
            this.extractInstructionText(
              value
            )
        )
        .filter(Boolean);

    if (!items.length) {
      return `- ${fallback}`;
    }

    return items
      .map(
        item =>
          `- ${item}`
      )
      .join(
        "\n"
      );
  },

  extractInstructionText(
    value = null
  ) {
    if (
      value ===
        null ||
      value ===
        undefined
    ) {
      return "";
    }

    if (
      typeof value ===
        "string" ||
      typeof value ===
        "number"
    ) {
      return String(
        value
      ).trim();
    }

    if (
      typeof value ===
      "object"
    ) {
      return this.cleanOriginal(
        value.text ||
        value.message ||
        value.rule ||
        value.claim ||
        value.description ||
        value.contentGuidance ||
        value.contentHint ||
        value.hint ||
        value.id ||
        value.name ||
        value.type ||
        ""
      );
    }

    return "";
  },

  cleanInstructionValue(
    value = ""
  ) {
    if (
      typeof value ===
      "string"
    ) {
      return this.cleanOriginal(
        value
      );
    }

    if (
      value &&
      typeof value ===
        "object"
    ) {
      return this.extractInstructionText(
        value
      );
    }

    return "";
  },

  extractSignificantTerms(
    value = ""
  ) {
    const ignored =
      new Set([
        "the",
        "and",
        "that",
        "this",
        "with",
        "from",
        "into",
        "about",
        "user",
        "response",
        "should",
        "could",
        "would",
        "must",
        "include",
        "provide",
        "offer",
        "give",
        "make",
        "explain",
        "state",
        "name",
        "briefly",
        "clearly"
      ]);

    return this.normalize(
      value
    )
      .split(
        /\s+/
      )
      .filter(
        term =>
          term.length >=
            4 &&
          !ignored.has(
            term
          )
      )
      .slice(
        0,
        8
      );
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
        },
        2
      );
    } catch (error) {
      console.warn(
        "Ari AI Writer evidence serialization failed:",
        error
      );

      return JSON.stringify({
        available:
          false,

        reason:
          "evidence_serialization_failed"
      });
    }
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

  createCandidateId({
    turnId = null,
    text = "",
    reason = ""
  } = {}) {
    const value = [
      turnId ||
        "no_turn",

      reason ||
        "no_reason",

      text ||
        "no_text"
    ].join(
      "|"
    );

    return `ai_writer_${this.hashString(
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

  firstNonEmptyArray(
    ...values
  ) {
    return (
      values.find(
        value =>
          Array.isArray(
            value
          ) &&
          value.length >
            0
      ) ||
      []
    );
  },

  firstFiniteNumber(
    values = []
  ) {
    for (
      const value
      of this.toArray(
        values
      )
    ) {
      if (
        value ===
          null ||
        value ===
          undefined ||
        value ===
          ""
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
              ? this.normalize(
                  value
                )
              : this.normalize(
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

  uniqueValues(
    values = []
  ) {
    const output = [];
    const seen =
      new Set();

    this.toArray(
      values
    ).forEach(
      value => {
        const key =
          typeof value ===
          "string"
            ? value
            : this.safeJSONStringify(
                value
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

  cleanOriginal(
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

  normalize(
    value = ""
  ) {
    return this
      .cleanOriginal(
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

  splitSentences(
    value = ""
  ) {
    const text =
      this.cleanOriginal(
        value
      );

    if (!text) {
      return [];
    }

    return text
      .replace(
        /\n+/g,
        " "
      )
      .split(
        /(?<=[.!?])\s+/
      )
      .map(
        sentence =>
          sentence.trim()
      )
      .filter(Boolean);
  },

  countWords(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .trim()
      .split(
        /\s+/
      )
      .filter(Boolean)
      .length;
  },

  countParagraphs(
    value = ""
  ) {
    const text =
      String(
        value ||
        ""
      ).trim();

    if (!text) {
      return 0;
    }

    return text
      .split(
        /\n{2,}/
      )
      .map(
        paragraph =>
          paragraph.trim()
      )
      .filter(Boolean)
      .length;
  }
};

window.Ari.aiWriter =
  window.AriAIWriter;

console.log(
  "ARI AI WRITER LOADED:",
  window.AriAIWriter?.version
);