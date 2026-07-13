// ari/language/ari-ai-writer.js
// Ari AI Writer
//
// Purpose:
// Produce an AI-assisted response candidate from the canonical Composer Packet.
//
// V2.1.0 — Focused Character Realization / Canonical Plan Enforcement
//
// Architectural flow:
//
// Canonical Response Plan
//      ↓
// Composer Packet
//      ↓
// Blueprint Writer Candidate
//      ↓
// Ari AI Writer
//      ↓
// AI Draft Candidate
//      ↓
// Candidate Arbiter
//
// Responsibilities:
// - Read the canonical Response Plan from the Composer Packet.
// - Preserve the original current-turn request.
// - Follow canonical response moves in their official order.
// - Follow advice, question, safety, developer, continuity, and length policy.
// - Use AI to render, improve, or repair the authorized response plan.
// - Preserve a complete usable Blueprint Writer candidate when AI is unnecessary.
// - Validate AI output before returning it as a candidate.
// - Return structured diagnostics for candidate arbitration.
//
// Non-responsibilities:
// - Does not reinterpret the user’s raw language.
// - Does not independently classify intent or conversation function.
// - Does not choose the response goal.
// - Does not choose the response shape.
// - Does not create a new response plan.
// - Does not override safety severity.
// - Does not retrieve new continuity or memory.
// - Does not select the final response candidate.
// - Does not persist state.

window.Ari = window.Ari || {};

window.AriAIWriter = {
  version: "2.1.0",
  schemaVersion: "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async write(input = {}) {
    const packet = input.composerPacket || input.packet || input || {};

    if (!packet || typeof packet !== "object" || packet.ready !== true) {
      return this.returnDraft({
        draft: "",
        reason: "composer_packet_missing_or_not_ready",
        usedAI: false,
        usable: false,
        complete: false,
        requiresRepair: true,
        packet
      });
    }

    const safePacket = this.buildSafePacket(packet);
    const request = this.readRequest(safePacket);
    const writerContract = this.readWriterContract(safePacket);
    const blueprintCandidate =
  this.readBlueprintCandidate(
    safePacket
  );

const lockedDeveloperDraft =
  this.readLockedDeveloperDraft(
    safePacket
  );

const characterContext =
  this.readCharacterContext(
    safePacket
  );
    if (!request.currentText && !lockedDeveloperDraft) {
      return this.returnDraft({
        draft: "",
        reason: "current_turn_missing",
        usedAI: false,
        usable: false,
        complete: false,
        requiresRepair: true,
        packet: safePacket,
        request,
        writerContract,
        blueprintCandidate
      });
    }

    if (lockedDeveloperDraft) {
      return this.returnDraft({
        draft: lockedDeveloperDraft,
        reason: "locked_developer_reply",
        usedAI: false,
        usable: true,
        complete: true,
        requiresRepair: false,
        packet: safePacket,
        request,
        writerContract,
        blueprintCandidate,
        validation: {
          valid: true,
          reason: "locked_developer_reply",
          warnings: [],
          errors: []
        }
      });
    }

    const memoryAcknowledgment = this.resolveAuthorizedMemoryAcknowledgment({
      packet: safePacket,
      request,
      writerContract
    });

    if (memoryAcknowledgment) {
      return this.returnDraft({
        draft: memoryAcknowledgment,
        reason: "authorized_memory_acknowledgment",
        usedAI: false,
        usable: true,
        complete: true,
        requiresRepair: false,
        packet: safePacket,
        request,
        writerContract,
        blueprintCandidate,
        validation: {
          valid: true,
          reason: "authorized_memory_acknowledgment",
          warnings: [],
          errors: []
        },
        canonicalMemoryAuthorizationUsed: true
      });
    }

    const blueprintDecision =
  this.evaluateBlueprintCandidate({
    packet:
      safePacket,

    request,

    writerContract,

    blueprintCandidate,

    characterContext
  });

    if (blueprintDecision.useWithoutAI) {
      return this.returnDraft({
        draft: blueprintCandidate.text,
        reason: "usable_blueprint_candidate_preserved",
        usedAI: false,
        usable: true,
        complete: blueprintCandidate.complete,
        requiresRepair: false,
        packet: safePacket,
        request,
        writerContract,
        blueprintCandidate,
        validation: blueprintDecision.validation
      });
    }

    if (!this.aiWritingAllowed(safePacket, writerContract)) {
      const fallback = this.resolveNonAIFallback({
        packet: safePacket,
        request,
        writerContract,
        blueprintCandidate
      });

      return this.returnDraft({
        draft: fallback.text,
        reason: fallback.reason,
        usedAI: false,
        usable: fallback.usable,
        complete: fallback.complete,
        requiresRepair: fallback.requiresRepair,
        packet: safePacket,
        request,
        writerContract,
        blueprintCandidate,
        validation: fallback.validation
      });
    }

    const instruction = this.buildInstruction({
      packet: safePacket,
      request,
      writerContract,
      blueprintCandidate,
      blueprintDecision
    });

    try {
      const aiText = await this.requestAIDraft({
        packet: safePacket,
        request,
        instruction
      });

      const validation = this.validateAIDraft({
        text: aiText,
        packet: safePacket,
        request,
        writerContract,
        blueprintCandidate
      });

      if (validation.valid) {
        return this.returnDraft({
          draft: validation.text,
          reason: blueprintDecision.repairRequired
            ? "ai_writer_repair_success"
            : "ai_writer_success",
          usedAI: true,
          usable: true,
          complete: validation.complete,
          requiresRepair: false,
          packet: safePacket,
          request,
          writerContract,
          blueprintCandidate,
          validation
        });
      }

      const fallback = this.resolveRejectedAIFallback({
        packet: safePacket,
        request,
        writerContract,
        blueprintCandidate,
        validation
      });

      return this.returnDraft({
        draft: fallback.text,
        reason: fallback.reason,
        usedAI: false,
        usable: fallback.usable,
        complete: fallback.complete,
        requiresRepair: fallback.requiresRepair,
        packet: safePacket,
        request,
        writerContract,
        blueprintCandidate,
        validation
      });
    } catch (error) {
      console.warn("AriAIWriter failed:", error);

      const fallback = this.resolveUnavailableAIFallback({
        packet: safePacket,
        request,
        writerContract,
        blueprintCandidate,
        error
      });

      return this.returnDraft({
        draft: fallback.text,
        reason: fallback.reason,
        usedAI: false,
        usable: fallback.usable,
        complete: fallback.complete,
        requiresRepair: fallback.requiresRepair,
        packet: safePacket,
        request,
        writerContract,
        blueprintCandidate,
        validation: fallback.validation,
        error
      });
    }
  },

  /* =====================================================
     REQUEST
  ===================================================== */

  readRequest(packet = {}) {
    const packetRequest = packet.request || {};

    const currentText = this.cleanOriginal(
      packetRequest.currentText ||
      packetRequest.originalText ||
      packet.currentTurnText ||
      packet.originalUserQuestion ||
      packet.userQuestion ||
      ""
    );

    return {
      turnId: packetRequest.turnId || packet.turnId || null,
      currentText,
      originalText: this.cleanOriginal(packetRequest.originalText || currentText),
      normalizedText: this.normalize(packetRequest.normalizedText || currentText),
      contextLane: packetRequest.contextLane || packet.contextLane || "direct_current_turn",
      requiresPriorContext: packetRequest.requiresPriorContext === true,
      originalTextPreserved: packetRequest.originalTextPreserved !== false,
      textWasRewritten: packetRequest.textWasRewritten === true,
      authority: "composer_packet_current_turn"
    };
  },

  /* =====================================================
     SAFE PACKET
  ===================================================== */

  buildSafePacket(packet = {}) {
    const developerRelevant = this.isDeveloperRelevant(packet);
    const developerLocked = packet.developerPacketLocked === true || packet.developer?.locked === true;

    if (developerRelevant || developerLocked) return packet;

    return {
      ...packet,
      developerPacket: null,
      hasDeveloperPacket: false,
      developerPacketLocked: false,
      developerPacketAdvisory: false,
      developerRelevant: false,
      lockedDeveloperReply: null,

      developer: {
        ...(packet.developer || {}),
        applicable: false,
        relevant: false,
        allowed: false,
        locked: false,
        advisory: false,
        packet: null,
        lockedReply: null,
        githubEvidenceAllowed: false,
        codeEvidenceAllowed: false,
        staleEvidenceSuppressed: true
      },

      evidence: {
        ...(packet.evidence || {}),
        github: null,
        developerPacket: null,
        developerIntent: null,
        developerHandoff: null,
        developerResponse: null,
        developerReply: null,
        codeUnderstanding: null,
        developerUnderstanding: null,
        developerEvidenceSuppressed: true
      }
    };
  },

  /* =====================================================
     WRITER CONTRACT
  ===================================================== */

  readWriterContract(packet = {}) {
    const responsePlan = packet.canonicalResponsePlan || packet.responsePlan || {};
    const responseControl = packet.responseControl || {};
    const instructions =
      packet.writerInstructions ||
      responseControl.writerInstructions ||
      responsePlan.writerInstructions ||
      {};

    const rawMoves = this.firstNonEmptyArray(
      packet.responseMoves,
      responseControl.responseMoves,
      responsePlan.responseMoves,
      responsePlan.moves,
      instructions.responseMoves,
      instructions.moves,
      instructions.sequence
    );

    const responseMoves = this.normalizeMoves(rawMoves);

    const requiredBehaviors = this.mergeUnique(
      packet.requiredBehaviors,
      packet.responseRequired,
      responseControl.requiredBehaviors,
      responsePlan.requiredBehaviors,
      responsePlan.required,
      instructions.requiredBehaviors,
      instructions.required
    );

    const forbiddenBehaviors = this.mergeUnique(
      packet.forbiddenBehaviors,
      packet.responseAvoid,
      responseControl.forbiddenBehaviors,
      responsePlan.forbiddenBehaviors,
      responsePlan.avoid,
      instructions.forbiddenBehaviors,
      instructions.avoid
    );

    const constraints = this.mergeUnique(
      packet.responseConstraints,
      responseControl.constraints,
      responsePlan.constraints,
      instructions.constraints
    );

    const responseRules = this.mergeUnique(
      packet.responseRules,
      responseControl.rules,
      responsePlan.responseRules,
      instructions.responseRules,
      instructions.rules
    );

    const questionPolicy =
      responseControl.questionPolicy ||
      responsePlan.interactionPolicy ||
      {};

    const shouldAskQuestion =
      packet.shouldAskQuestion === true ||
      questionPolicy.shouldAskQuestion === true ||
      responsePlan.shouldAskQuestion === true ||
      instructions.questionRequired === true;

    const questionPurpose =
      packet.questionPurpose ||
      questionPolicy.purpose ||
      questionPolicy.questionPurpose ||
      responsePlan.questionPurpose ||
      instructions.questionPurpose ||
      null;

    const maximumQuestions = this.firstFiniteNumber([
      questionPolicy.maximumQuestions,
      questionPolicy.maxQuestions,
      instructions.maxQuestions,
      shouldAskQuestion ? 1 : 0
    ]);

    return {
      schema: "ari_ai_writer_contract",
      schemaVersion: this.schemaVersion,

      responseGoal:
        packet.responseGoal ||
        responseControl.responseGoal ||
        responsePlan.responseGoal ||
        responsePlan.strategy?.responseGoal ||
        "answer_user",

      responseShape:
        packet.responseShape ||
        responseControl.responseShape ||
        responsePlan.responseShape ||
        responsePlan.strategy?.responseShape ||
        instructions.shape ||
        "clear_explanation",

      responsePosture:
        packet.responsePosture ||
        responseControl.responsePosture ||
        responsePlan.responsePosture ||
        responsePlan.strategy?.responsePosture ||
        instructions.posture ||
        null,

      currentNeed:
        responsePlan.currentNeed ||
        responsePlan.interpretation?.currentNeed ||
        packet.currentNeed ||
        null,

      responseMoves,

      advicePolicy:
        packet.advicePolicy ||
        responseControl.advicePolicy ||
        responsePlan.advicePolicy ||
        responsePlan.interactionPolicy?.advicePolicy ||
        "allowed_if_useful",

      coachingPermissionRequired:
        packet.coachingPermissionRequired === true ||
        responseControl.coachingPermissionRequired === true ||
        responsePlan.coachingPermissionRequired === true ||
        responsePlan.interactionPolicy?.coachingPermissionRequired === true,

      shouldAskQuestion,
      questionPurpose,

      finalQuestionAllowed:
        instructions.finalQuestionAllowed === true ||
        questionPolicy.finalQuestionAllowed === true ||
        shouldAskQuestion,

      maximumQuestions: Math.max(0, Number(maximumQuestions || 0)),
      requiredBehaviors,
      forbiddenBehaviors,
      constraints,
      responseRules,

      blueprintHint:
        packet.blueprintHint ||
        responseControl.blueprintHint ||
        responsePlan.blueprintHint ||
        responsePlan.blueprint?.id ||
        instructions.blueprintId ||
        null,

      maxSentences: this.firstFiniteNumber([
        instructions.maxSentences,
        packet.communicationPlan?.languageBudget?.maxSentences,
        4
      ]),

      minimumSentences: this.firstFiniteNumber([
        instructions.minimumSentences,
        1
      ]),

      maxWords: this.firstFiniteNumber([
        instructions.maxWords,
        packet.communicationPlan?.languageBudget?.maxWords,
        null
      ]),

      maxParagraphs: this.firstFiniteNumber([
        instructions.maxParagraphs,
        packet.communicationPlan?.languageBudget?.maxParagraphs,
        null
      ]),

      answerFirst: instructions.answerFirst !== false,
      reflectFirst: instructions.reflectFirst === true,
      preserveMoveOrder: instructions.preserveMoveOrder !== false,
      preserveOriginalTurn: instructions.preserveOriginalTurn !== false,
      useConcreteTerms: instructions.useConcreteTerms !== false,
      onePracticalStepMaximum: instructions.onePracticalStepMaximum === true,
      internalInstructionsAreNotUserFacing: instructions.internalInstructionsAreNotUserFacing !== false,
      doNotRenderInstructionText: instructions.doNotRenderInstructionText !== false,

      unsupportedMovePolicy:
        instructions.unsupportedMovePolicy ||
        (packet.candidatePolicy?.unsupportedMoveRequiresRepair === true
          ? "request_ai_repair"
          : "allow_partial"),

      incompletePlanPolicy:
        instructions.incompletePlanPolicy ||
        (packet.candidatePolicy?.incompleteBlueprintRequiresRepair === true
          ? "request_ai_repair"
          : "allow_partial"),

      factualClaimPolicy:
        instructions.factualClaimPolicy ||
        "require_evidence_or_explicit_uncertainty",

      doNotWrite: this.mergeUnique(
        instructions.doNotWrite,
        [
          "internal planner instructions",
          "pipeline diagnostics",
          "meta commentary about answering",
          "stale developer evidence",
          "unsupported factual certainty"
        ]
      ),

      candidatePolicy: packet.candidatePolicy || {},
      authority: "canonical_ai_writer_contract"
    };
  },

  normalizeMoves(moves = []) {
    return this.toArray(moves)
      .map((move, index) => {
        if (typeof move === "string") {
          return {
            id: this.normalizeMoveId(move),
            order: index,
            required: true,
            userFacing: true,
            renderPolicy: "render_or_ai_repair",
            purpose: null,
            contentHint: null,
            evidenceRefs: [],
            raw: move
          };
        }

        if (!move || typeof move !== "object") return null;

        const id = this.normalizeMoveId(
          move.id ||
          move.move ||
          move.name ||
          move.type ||
          ""
        );

        if (!id) return null;

        return {
          id,
          order: Number.isFinite(Number(move.order)) ? Number(move.order) : index,
          required: move.required !== false,
          userFacing: move.userFacing !== false,
          renderPolicy:
            move.renderPolicy ||
            (move.userFacing === false ? "instruction_only" : "render_or_ai_repair"),
          purpose: move.purpose || null,
          contentHint:
            move.contentGuidance ||
            move.contentHint ||
            move.hint ||
            null,
          evidenceRefs: this.toArray(move.evidenceRefs),
          source: move.source || "canonical_response_plan",
          renderer: move.renderer || null,
          raw: move
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.order - b.order);
  },

  normalizeMoveId(value = "") {
    const id = this.normalizeIdentifier(value);

    const aliases = {
      attune: "attune_to_emotion",
      sadness_attune: "attune_to_sadness",
      sadness_validate: "validate_sadness",
      anxiety_attune: "attune_to_anxiety",
      anxiety_validate: "validate_anxiety",
      anger_attune: "attune_to_anger",
      anger_validate: "validate_anger",
      gentle_validation: "validate_emotion",
      validate_weight: "validate_emotion",
      validate_emotional_weight: "validate_emotion",
      invite_context: "invite_context_or_stay_present",
      direct_answer: "answer_directly",
      usable_example: "provide_usable_context",
      usable_context: "provide_usable_context",
      confirm_practical: "confirm_practical_goal",
      contained_patch: "give_contained_steps",
      test_before_more_changes: "suggest_test_or_followup",
      separate_questions: "separate_options",
      recommend_priority: "recommend_next_decision_step",
      safe_first_step: "name_safe_first_step",
      red_flags: "include_red_flags_or_clinician_boundary",
      pause: "pause_and_prioritize_safety",
      immediate_safety: "give_direct_safety_step",
      trusted_help: "urge_trusted_or_emergency_support",
      name_relationship_truth: "name_relationship_or_conflict_truth",
      reduce_blame: "lower_blame",
      repair_script: "offer_one_repair_step",
      one_next_step: "offer_one_next_step",
      small_next_step: "offer_one_next_step",
      next_step: "offer_one_next_step",
      simple_ack: "memory_acknowledgment",
      acknowledge_memory_request: "memory_acknowledgment",
      principle: "state_principle",
      apply_principle: "apply_principle"
    };

    return aliases[id] || id;
  },

/* =====================================================
   FOCUSED CHARACTER CONTEXT
===================================================== */

readCharacterContext(packet = {}) {
  const context =
    packet.characterContext ||
    {};

  const character =
    packet.composerCharacter ||
    packet.character ||
    context.composerCharacter ||
    context.character ||
    packet.evidence
      ?.composerCharacter ||
    packet.evidence
      ?.character ||
    null;

  const handoff =
    packet.characterHandoff ||
    context.handoff ||
    packet.evidence
      ?.characterHandoff ||
    null;

  const reasoning =
    packet.characterReasoning ||
    context.reasoning ||
    handoff?.reasoning ||
    character?.reasoning ||
    packet.evidence
      ?.characterReasoning ||
    null;

  const realization =
    packet.characterRealization ||
    context.realization ||
    character?.realization ||
    handoff?.realization ||
    packet.evidence
      ?.characterRealization ||
    reasoning?.realizationPolicy ||
    {};

  const draft =
    this.cleanForUser(
      packet
        .characterDeterministicDraft ||
      packet.characterDraft ||
      context.draft ||
      handoff?.draft ||
      character
        ?.deterministicDraft ||
      character?.draft ||
      reasoning
        ?.deterministicDraft ||
      reasoning
        ?.userFacingDraft ||
      ""
    );

  const answer =
    this.cleanForUser(
      packet.characterAnswer ||
      context.answer ||
      handoff?.answer ||
      character?.answer ||
      reasoning?.answer ||
      ""
    );

  const reason =
    this.cleanForUser(
      packet.characterReason ||
      context.reason ||
      handoff?.reason ||
      (
        typeof handoff
          ?.reasoning ===
          "string"
          ? handoff.reasoning
          : ""
      ) ||
      character?.reason ||
      (
        typeof character
          ?.reasoning ===
          "string"
          ? character.reasoning
          : ""
      ) ||
      reasoning?.reasoning ||
      ""
    );

  const answerAvailable =
    packet
      .characterAnswerAvailable ===
      true ||
    context.answerAvailable ===
      true ||
    handoff?.answerAvailable ===
      true ||
    character?.answerAvailable ===
      true ||
    reasoning
      ?.characterAnswerAvailable ===
      true ||
    Boolean(
      draft &&
      (
        answer ||
        reason
      )
    );

  const needsAIWriter =
    packet
      .characterNeedsAIWriter ===
      true ||
    context.needsAIWriter ===
      true ||
    handoff?.needsAIWriter ===
      true ||
    realization.needsAIWriter ===
      true ||
    reasoning?.needsAIWriter ===
      true;

  const aiWriterMode =
    packet.characterAIWriterMode ||
    context.aiWriterMode ||
    handoff?.aiWriterMode ||
    realization.aiWriterMode ||
    reasoning?.aiWriterMode ||
    null;

  const aiInstruction =
    this.cleanOriginal(
      packet.characterAIInstruction ||
      context.aiInstruction ||
      handoff?.aiInstruction ||
      realization.aiInstruction ||
      reasoning?.aiInstruction ||
      ""
    );

  const status =
    packet.characterStatus ||
    context.status ||
    handoff?.status ||
    character?.status ||
    reasoning?.status ||
    null;

  return {
    available:
      packet.characterAvailable ===
        true ||
      context.available ===
        true ||
      Boolean(
        character ||
        handoff ||
        reasoning
      ),

    enabled:
      packet.characterEnabled ===
        true ||
      context.enabled ===
        true ||
      character?.enabled ===
        true ||
      handoff?.enabled ===
        true,

    relevant:
      packet.characterRelevant ===
        true ||
      context.relevant ===
        true ||
      context.useAllowed ===
        true ||
      character?.relevant ===
        true ||
      handoff?.relevant ===
        true ||
      answerAvailable,

    answerAvailable,

    needsAIWriter,

    draftAvailable:
      Boolean(draft),

    mode:
      packet.characterMode ||
      context.mode ||
      handoff?.mode ||
      character?.mode ||
      "silent",

    type:
      packet.characterType ||
      context.type ||
      reasoning?.type ||
      character?.type ||
      handoff?.type ||
      null,

    subtype:
      packet.characterSubtype ||
      context.subtype ||
      reasoning?.subtype ||
      character?.subtype ||
      handoff?.subtype ||
      null,

    focus:
      packet.characterFocus ||
      context.focus ||
      reasoning?.focus ||
      character?.focus ||
      handoff?.focus ||
      null,

    preferenceSubject:
      packet
        .characterPreferenceSubject ||
      context.preferenceSubject ||
      reasoning
        ?.preferenceSubject ||
      null,

    answer,

    reasoning:
      reason,

    draft,

    status,

    confidence:
      reasoning?.confidence ||
      null,

    source:
      reasoning?.source ||
      handoff
        ?.preferredCharacterSource ||
      character?.preferredSource ||
      context
        .preferredCharacterSource ||
      null,

    aiWriterMode,

    aiInstruction,

    realization,

    character,

    handoff,

    reasoningPacket:
      reasoning,

    authority:
      "resolved_focused_character_handoff_only"
  };
},

  /* =====================================================
     BLUEPRINT CANDIDATE
  ===================================================== */

  readBlueprintCandidate(packet = {}) {
    const source =
      packet.blueprintWriterState ||
      packet.evidence?.blueprintWriter ||
      packet.blueprintCandidate ||
      {};

    const candidate =
      packet.blueprintWriterCandidate ||
      source.candidate ||
      {};

    const text = this.cleanOriginal(
      packet.blueprintWriterDraft ||
      source.blueprintWriterDraft ||
      source.draft ||
      candidate.text ||
      ""
    );

    const renderedMoves = this.toArray(
      packet.renderedResponseMoves ||
      source.renderedResponseMoves ||
      source.renderedMoves
    );

    const unsupportedMoves = this.toArray(
      packet.unsupportedResponseMoves ||
      source.unsupportedResponseMoves ||
      source.unsupportedMoves
    );

    const skippedMoves = this.toArray(
      packet.skippedResponseMoves ||
      source.skippedResponseMoves ||
      source.skippedMoves
    );

    return {
      available: Boolean(text),
      text,
      usable:
        packet.blueprintWriterUsable === true ||
        source.blueprintWriterUsable === true ||
        candidate.usable === true,

      complete:
        packet.blueprintWriterComplete === true ||
        source.blueprintWriterComplete === true ||
        source.complete === true,

      requiresAIRepair:
        packet.blueprintWriterRequiresAIRepair === true ||
        source.blueprintWriterRequiresAIRepair === true ||
        candidate.requiresAIRepair === true,

      canonicalResponsePlanUsed:
        candidate.evidence?.canonicalResponsePlanUsed === true ||
        source.canonicalResponsePlanUsed === true ||
        source.blueprint?.canonicalResponsePlanUsed === true,

      reason:
        packet.blueprintWriterReason ||
        source.blueprintWriterReason ||
        source.reason ||
        null,

      renderedMoves,
      unsupportedMoves,
      skippedMoves,
      warnings: this.toArray(packet.renderWarnings || source.renderWarnings || source.warnings),
      source: source.blueprintWriterSource || source.source || "ari-blueprint-writer",
      version: source.blueprintWriterVersion || source.version || null,
      raw: source
    };
  },

  evaluateBlueprintCandidate({
  packet = {},
  request = {},
  writerContract = {},
  blueprintCandidate = {},
  characterContext = {}
} = {}) {
  const characterRealizationRequired =
    characterContext
      .answerAvailable ===
      true &&
    characterContext
      .needsAIWriter ===
      true;

  if (
    !blueprintCandidate
      .available
  ) {
    return {
      useWithoutAI:
        false,

      repairRequired:
        true,

      characterRealizationRequired,

      reason:
        characterRealizationRequired
          ? "focused_character_realization_required"
          : "blueprint_candidate_missing",

      requiredUnsupportedMoveIds:
        [],

      validation: {
        valid:
          false,

        reason:
          "blueprint_candidate_missing",

        warnings:
          characterRealizationRequired
            ? [
                "focused_character_realization_required"
              ]
            : [],

        errors: [
          "blueprint_candidate_missing"
        ]
      }
    };
  }

  const validation =
    this.validateCandidateText({
      text:
        blueprintCandidate.text,

      packet,

      request,

      writerContract,

      source:
        "blueprint_writer"
    });

  const requiredUnsupported =
    blueprintCandidate
      .unsupportedMoves
      .filter(
        move =>
          move?.required !==
          false
      );

  const repairRequired =
    characterRealizationRequired ||
    blueprintCandidate
      .requiresAIRepair ||
    !blueprintCandidate.usable ||
    !blueprintCandidate.complete ||
    requiredUnsupported.length >
      0 ||
    !validation.valid;

  let reason =
    "blueprint_candidate_complete";

  if (
    characterRealizationRequired
  ) {
    reason =
      "focused_character_realization_required";
  } else if (
    repairRequired
  ) {
    reason =
      "blueprint_candidate_requires_ai_repair";
  }

  return {
    useWithoutAI:
      !repairRequired,

    repairRequired,

    characterRealizationRequired,

    reason,

    requiredUnsupportedMoveIds:
      requiredUnsupported
        .map(
          move =>
            move?.id
        )
        .filter(Boolean),

    validation
  };
},

  /* =====================================================
     AI PERMISSION
  ===================================================== */

  aiWritingAllowed(packet = {}, writerContract = {}) {
    if (packet.developerPacketLocked === true || packet.developer?.locked === true) {
      return false;
    }

    if (packet.candidatePolicy?.aiWriterAllowed === false) return false;
    if (packet.canonicalResponsePlan?.blueprint?.aiAllowed === false) return false;
    if (packet.responsePlan?.blueprint?.aiAllowed === false) return false;

    const blueprint = this.normalizeIdentifier(writerContract.blueprintHint || "");

    if (blueprint.startsWith("safety_") && packet.safety?.shouldStopNormalResponse === true) {
      return false;
    }

    return true;
  },

  /* =====================================================
     AI REQUEST
  ===================================================== */

  async requestAIDraft({
    packet = {},
    request = {},
    instruction = ""
  } = {}) {
    if (
      !window.AriOpenAIKnowledgeClient ||
      typeof window.AriOpenAIKnowledgeClient.ask !== "function"
    ) {
      throw new Error("ari_openai_knowledge_client_unavailable");
    }

    const result = await window.AriOpenAIKnowledgeClient.ask({
      summary: {
        ...packet,
        userMessage: request.currentText,
        message: request.currentText,
        input: request.currentText,
        question: request.currentText,
        originalUserMessage: request.originalText,
        resolvedUserQuestion: request.currentText,
        aiInstruction: instruction,
        composerPacket: packet
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
    blueprintCandidate = {},
    blueprintDecision = {}
  } = {}) {
    const developerRelevant = this.isDeveloperRelevant(packet);

const characterContext =
  this.readCharacterContext(
    packet
  );

    const moveInstructions = writerContract.responseMoves.map((move, index) => {
      const parts = [
        `${index + 1}. ${move.id}`,
        move.required ? "required" : "optional",
        move.renderPolicy || null,
        move.contentHint ? `guidance: ${move.contentHint}` : null
      ].filter(Boolean);

      return parts.join(" — ");
    });

    const evidencePacket = this.buildAIEvidencePacket({
      packet,
      developerRelevant
    });

    return `
You are Ari’s AI language renderer.

You are not the response planner.

Your job is to express or repair the canonical response plan already contained in this packet.

CURRENT USER TURN:
${request.currentText}

CURRENT TURN RULES:
- Preserve the meaning and requested operation of the current user turn.
- Do not replace the current turn with prior context.
- Do not reinterpret the user’s intent.
- Do not mention internal pipeline stages or diagnostics.
- Do not report that another writer failed.

RESPONSE GOAL:
${writerContract.responseGoal}

RESPONSE SHAPE:
${writerContract.responseShape}

RESPONSE POSTURE:
${writerContract.responsePosture || "natural_direct"}

CURRENT NEED:
${writerContract.currentNeed || "not_specified"}

CANONICAL RESPONSE MOVES:
${moveInstructions.join("\n") || "No canonical response moves were supplied."}

ADVICE POLICY:
${writerContract.advicePolicy}

COACHING PERMISSION REQUIRED:
${writerContract.coachingPermissionRequired ? "yes" : "no"}

QUESTION POLICY:
- shouldAskQuestion: ${writerContract.shouldAskQuestion ? "yes" : "no"}
- finalQuestionAllowed: ${writerContract.finalQuestionAllowed ? "yes" : "no"}
- maximumQuestions: ${writerContract.maximumQuestions}
- purpose: ${writerContract.questionPurpose || "none"}

REQUIRED BEHAVIORS:
${this.formatInstructionList(writerContract.requiredBehaviors, "None supplied.")}

FORBIDDEN BEHAVIORS:
${this.formatInstructionList(writerContract.forbiddenBehaviors, "None supplied.")}

CONSTRAINTS:
${this.formatInstructionList(writerContract.constraints, "None supplied.")}

RESPONSE RULES:
${this.formatInstructionList(writerContract.responseRules, "Answer the current request directly.")}

LANGUAGE BUDGET:
- maximum sentences: ${writerContract.maxSentences || 4}
- maximum words: ${writerContract.maxWords || "not specified"}
- maximum paragraphs: ${writerContract.maxParagraphs || "not specified"}
- minimum sentences: ${writerContract.minimumSentences || 1}

BLUEPRINT CANDIDATE:
${blueprintCandidate.text || "No Blueprint Writer candidate is available."}

BLUEPRINT STATUS:
- available: ${blueprintCandidate.available ? "yes" : "no"}
- usable: ${blueprintCandidate.usable ? "yes" : "no"}
- complete: ${blueprintCandidate.complete ? "yes" : "no"}
- requires AI repair: ${blueprintDecision.repairRequired ? "yes" : "no"}
- unsupported moves: ${
      blueprintCandidate.unsupportedMoves
        .map(move => move?.id)
        .filter(Boolean)
        .join(", ") || "none"
    }

FOCUSED CHARACTER HANDOFF:
- available: ${characterContext.available ? "yes" : "no"}
- enabled: ${characterContext.enabled ? "yes" : "no"}
- relevant: ${characterContext.relevant ? "yes" : "no"}
- answer available: ${characterContext.answerAvailable ? "yes" : "no"}
- AI realization required: ${characterContext.needsAIWriter ? "yes" : "no"}
- mode: ${characterContext.mode || "silent"}
- type: ${characterContext.type || "none"}
- subtype: ${characterContext.subtype || "none"}
- focus: ${characterContext.focus || "none"}
- preference subject: ${characterContext.preferenceSubject || "none"}
- status: ${
  typeof characterContext.status === "string"
    ? characterContext.status
    : characterContext.status?.overall || "none"
}
- confidence: ${characterContext.confidence || "not specified"}
- resolved answer: ${characterContext.answer || "none"}
- resolved reasoning: ${characterContext.reasoning || "none"}
- deterministic draft: ${characterContext.draft || "none"}
- AI writer mode: ${characterContext.aiWriterMode || "none"}
- source: ${characterContext.source || "none"}

CHARACTER REALIZATION INSTRUCTION:
${
  characterContext.aiInstruction ||
  "No focused Character realization instruction was supplied."
}

CHARACTER AUTHORITY RULES:
- Character Reasoning has already selected the relevant identity, preference, worldview, perspective, or values-based inference.
- Do not independently decide what Ari prefers.
- Do not search broad Character information for an alternative answer.
- Do not contradict the resolved Character answer.
- Do not convert an inferred or open answer into a fixed canonical preference.
- Do not say Ari lacks preferences merely because Ari is an AI.
- Do not mention Character packets, files, engines, constitutions, databases, or internal systems.
- When AI realization is required, follow the focused Character realization instruction.
- Express the answer naturally in Ari’s first-person voice.
- Preserve any uncertainty required by the Character Handoff.

EVIDENCE:
${JSON.stringify(evidencePacket, null, 2)}

DEVELOPER RELEVANT:
${developerRelevant ? "yes" : "no"}

FINAL WRITING RULES:
- Follow the canonical response moves in order.
- Render only user-facing content.
- Do not create new response moves.
- Do not change the response goal, shape, posture, advice policy, or question policy.
- Use the Blueprint candidate when it is useful, but repair missing or unsupported required moves.
- Do not repeat correctly rendered Blueprint sentences unnecessarily.
- If coaching permission is required, validate first and ask permission before advice.
- Do not ask a question unless the question policy allows it.
- Do not exceed the question limit.
- Do not add a generic closing question.
- Use continuity only when relevant and authorized.
- Use only the focused Character Handoff for Ari identity, preference, worldview, values, taste, personality, or perspective answers.
- When focused Character AI realization is required, follow its instruction exactly in meaning while expressing it naturally.
- Broad Character identity and preference evidence may support voice, but it may not override the focused Character Handoff.
- Use memory only when relevant and authorized.
- Use safety instructions as authoritative.
- Do not use GitHub, repository, file, or code evidence when developer relevance is no.
- Do not expose JSON, planning instructions, schemas, move names, or pipeline language.
- Do not invent factual claims.
- When evidence is incomplete, state uncertainty naturally rather than fabricating certainty.
- Return only the final user-facing response.
`.trim();
  },

  buildAIEvidencePacket({
    packet = {},
    developerRelevant = false
  } = {}) {
    return {
      meaning:
        packet.evidence?.understanding?.meaning ||
        packet.meaningInterpretation ||
        null,

      humanState:
        packet.evidence?.understanding?.humanState ||
        packet.humanState ||
        null,

      knowledge:
        packet.knowledge ||
        packet.evidence?.knowledge ||
        null,

      continuity:
        packet.continuity ||
        packet.evidence?.continuity ||
        null,

      activeDialogueState:
        packet.activeDialogueState ||
        packet.evidence?.continuity?.activeDialogueState ||
        null,

      safety:
        packet.safety ||
        packet.evidence?.safety ||
        null,

      reasoning:
        packet.evidence?.reasoning ||
        packet.reasoning ||
        null,

focusedCharacter:
  this.readCharacterContext(
    packet
  ),

      characterIdentity:
        packet.characterIdentity ||
        packet.evidence?.characterIdentity ||
        null,

      characterPreferences:
        packet.characterContext?.stablePreferences ||
        packet.evidence?.characterPreferences ||
        null,

      languageGuidance:
        packet.languageGuidance ||
        packet.evidence?.languageGuidance ||
        null,

      humanLanguageProfile:
        packet.humanLanguageProfile ||
        packet.evidence?.humanLanguageProfile ||
        null,

      preferredTerms:
        packet.preferredTerms ||
        packet.evidence?.preferredTerms ||
        null,

      thesis:
        packet.thesis ||
        null,

      developer:
        developerRelevant
          ? {
              github: packet.evidence?.github || null,
              intent: packet.evidence?.developerIntent || null,
              handoff: packet.evidence?.developerHandoff || null,
              response: packet.evidence?.developerResponse || null,
              codeUnderstanding: packet.evidence?.codeUnderstanding || null
            }
          : null
    };
  },

  formatInstructionList(values = [], fallback = "") {
    const items = this.toArray(values)
      .map(value => this.extractInstructionText(value))
      .filter(Boolean);

    if (!items.length) return `- ${fallback}`;

    return items.map(item => `- ${item}`).join("\n");
  },

  extractInstructionText(value = null) {
    if (value === null || value === undefined) return "";

    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }

    if (typeof value === "object") {
      return this.cleanOriginal(
        value.text ||
        value.message ||
        value.rule ||
        value.claim ||
        value.description ||
        value.id ||
        value.name ||
        value.type ||
        ""
      );
    }

    return "";
  },

  /* =====================================================
     AI DRAFT VALIDATION
  ===================================================== */

  validateAIDraft({
    text = "",
    packet = {},
    request = {},
    writerContract = {},
    blueprintCandidate = {}
  } = {}) {
    const baseValidation = this.validateCandidateText({
      text,
      packet,
      request,
      writerContract,
      source: "ai_writer"
    });

    const warnings = [...baseValidation.warnings];
    const errors = [...baseValidation.errors];

    const draft = baseValidation.text;
    const questions = this.countQuestions(draft);

    if (
      writerContract.shouldAskQuestion === true &&
      questions === 0
    ) {
      errors.push("required_question_missing");
    }

    if (
      writerContract.finalQuestionAllowed !== true &&
      questions > 0
    ) {
      errors.push("question_not_allowed");
    }

    if (
      questions >
      Number(writerContract.maximumQuestions || 0)
    ) {
      errors.push("question_limit_exceeded");
    }

    if (
      writerContract.coachingPermissionRequired === true &&
      this.containsAdviceLanguage(draft) &&
      questions === 0
    ) {
      errors.push("coaching_given_without_permission_question");
    }

    const sentenceCount = this.splitSentences(draft).length;
    const wordCount = this.countWords(draft);

    if (
      writerContract.maxSentences &&
      sentenceCount >
      writerContract.maxSentences
    ) {
      warnings.push("sentence_budget_exceeded");
    }

    if (
      writerContract.maxWords &&
      wordCount >
      writerContract.maxWords
    ) {
      warnings.push("word_budget_exceeded");
    }

    if (
      writerContract.minimumSentences &&
      sentenceCount <
      writerContract.minimumSentences
    ) {
      warnings.push("minimum_sentence_target_not_met");
    }

    const requiredMoveCoverage = this.evaluateRequiredMoveCoverage({
      draft,
      writerContract,
      blueprintCandidate
    });

    if (!requiredMoveCoverage.complete) {
      warnings.push({
        type: "required_move_coverage_uncertain",
        moveIds: requiredMoveCoverage.unconfirmedMoveIds
      });
    }

    const finalText = this.enforceLanguageBudget({
      text: draft,
      writerContract
    });

    return {
      valid: errors.length === 0 && Boolean(finalText),
      complete: errors.length === 0,
      reason: errors.length ? errors[0] : "valid_ai_candidate",
      text: finalText,
      warnings,
      errors,
      sentenceCount: this.splitSentences(finalText).length,
      wordCount: this.countWords(finalText),
      questionCount: this.countQuestions(finalText),
      requiredMoveCoverage
    };
  },

  validateCandidateText({
    text = "",
    packet = {},
    request = {},
    writerContract = {},
    source = "candidate"
  } = {}) {
    const draft = this.cleanOriginal(text);
    const warnings = [];
    const errors = [];

    if (!draft) {
      errors.push("empty_candidate");
    }

    if (draft && draft.length < 8) {
      warnings.push("candidate_very_short");
    }

    if (this.containsInternalPlannerLanguage(draft)) {
      errors.push("internal_planner_language_detected");
    }

    if (!this.isDeveloperRelevant(packet) && this.containsStaleDeveloperLanguage(draft)) {
      errors.push("stale_developer_language_detected");
    }

    if (this.containsAIFailureMessage(draft)) {
      errors.push("ai_failure_message_detected");
    }

    if (this.containsRawJSONDump(draft)) {
      errors.push("raw_json_detected");
    }

    if (
      request.originalTextPreserved === false ||
      request.textWasRewritten === true
    ) {
      warnings.push("current_turn_provenance_warning");
    }

    if (
      this.isAriPreferenceQuestion(request.currentText) &&
      this.containsGenericPreferenceDodge(draft)
    ) {
      errors.push("generic_preference_dodge_detected");
    }

    if (
      writerContract.finalQuestionAllowed !== true &&
      this.countQuestions(draft) > 0
    ) {
      errors.push("unauthorized_question_detected");
    }

    return {
      valid: errors.length === 0 && Boolean(draft),
      complete: errors.length === 0,
      reason: errors.length ? errors[0] : `${source}_candidate_valid`,
      text: draft,
      warnings,
      errors
    };
  },

  evaluateRequiredMoveCoverage({
    draft = "",
    writerContract = {},
    blueprintCandidate = {}
  } = {}) {
    const requiredMoves = writerContract.responseMoves.filter(
      move =>
        move.required !== false &&
        move.userFacing !== false &&
        move.renderPolicy !== "instruction_only"
    );

    const renderedBlueprintIds = new Set(
      blueprintCandidate.renderedMoves
        .map(move => this.normalizeMoveId(move?.id || move))
        .filter(Boolean)
    );

    const unsupportedBlueprintIds = new Set(
      blueprintCandidate.unsupportedMoves
        .map(move => this.normalizeMoveId(move?.id || move))
        .filter(Boolean)
    );

    const unconfirmedMoveIds = requiredMoves
      .filter(move => {
        if (renderedBlueprintIds.has(move.id) && !unsupportedBlueprintIds.has(move.id)) {
          return false;
        }

        return !this.moveAppearsRepresented({
          moveId: move.id,
          draft
        });
      })
      .map(move => move.id);

    return {
      complete: unconfirmedMoveIds.length === 0,
      requiredMoveCount: requiredMoves.length,
      unconfirmedMoveIds
    };
  },

  moveAppearsRepresented({
    moveId = "",
    draft = ""
  } = {}) {
    const text = this.normalize(draft);

    const patterns = {
      pause_and_prioritize_safety:
        /\b(?:pause|right now|immediate safety|focus on safety)\b/,

      give_direct_safety_step:
        /\b(?:move away|call|contact|go somewhere safe|remove yourself|get help)\b/,

      urge_trusted_or_emergency_support:
        /\b(?:emergency|911|trusted person|someone you trust|crisis|support)\b/,

      calm_medical_frame:
        /\b(?:take it seriously|do not panic|don'?t panic|not necessarily|symptom)\b/,

      name_safe_first_step:
        /\b(?:first step|start by|for now|right now)\b/,

      include_red_flags_or_clinician_boundary:
        /\b(?:seek care|medical care|clinician|doctor|urgent|worsening|severe|red flag)\b/,

      join_positive_emotion:
        /\b(?:hell yeah|that'?s great|worth feeling good|happy for you|take the win)\b/,

      validate_feeling:
        /\b(?:makes sense|understand why|can feel|that sounds|i hear you)\b/,

      validate_emotion:
        /\b(?:makes sense|understand why|can feel|that sounds|i hear you)\b/,

      attune_to_emotion:
        /\b(?:i hear you|i'?m with you|that sounds|yeah)\b/,

      reflect_initial_defensiveness:
        /\b(?:defensive|protect yourself|first reaction)\b/,

      distinguish_first_reaction_from_final_position:
        /\b(?:first reaction|final position|after you process|settled reaction)\b/,

      validate_processing_time:
        /\b(?:time to process|need time|come back to the conversation|return to it)\b/,

      translate_pattern_for_partner:
        /\b(?:you could say|tell your partner|explain it by saying|i may get defensive)\b/,

      ask_permission_before_coaching:
        /\b(?:do you want|would you like)\b.*\?/,

      invite_context_or_stay_present:
        /\b(?:what happened|tell me|what was said|do you want to talk)\b.*\?/,

      name_relationship_or_conflict_truth:
        /\b(?:argument|conflict|relationship|temperature|win the argument|understand)\b/,

      lower_blame:
        /\b(?:without blame|not the enemy|own your part|lower the temperature)\b/,

      offer_one_repair_step:
        /\b(?:you could say|repair|apologize|revisit the conversation|own your part)\b/,

      name_tradeoff:
        /\b(?:tradeoff|choice is between|real decision|versus)\b/,

      separate_options:
        /\b(?:option|versus|separate|first question|second question)\b/,

      recommend_next_decision_step:
        /\b(?:next step|choose|prioritize|decide)\b/,

      answer_directly:
        draft.trim().length > 0 ? /.*/ : /$a/,

      brief_explanation:
        this.splitSentences(draft).length >= 2 ? /.*/ : /$a/,

      provide_usable_context:
        /\b(?:for example|in practice|that means|so you can|which means)\b/,

      confirm_practical_goal:
        /\b(?:goal is|you'?re trying to|what we need to do|the target is)\b/,

      give_contained_steps:
        /\b(?:first|then|next|replace|update|change|test)\b/,

      suggest_test_or_followup:
        /\b(?:test|verify|check|confirm|before changing)\b/,

      memory_acknowledgment:
        /\b(?:i'?ll remember|keep that in mind|got it)\b/,

      reflect_understanding:
        /\b(?:it sounds like|you'?re saying|what i hear|seems like)\b/,

      ask_clarifying_question:
        /\?/,

      offer_small_practical_next_step:
        /\b(?:start by|next step|do one|for now)\b/,

      name_pattern_gently:
        /\b(?:may be|might be|could be|pattern|seems)\b/
    };

    const pattern = patterns[moveId];
    return pattern ? pattern.test(text) : true;
  },

  /* =====================================================
     FALLBACKS
  ===================================================== */

  resolveNonAIFallback({
    packet = {},
    request = {},
    writerContract = {},
    blueprintCandidate = {}
  } = {}) {
    if (blueprintCandidate.available) {
      const validation = this.validateCandidateText({
        text: blueprintCandidate.text,
        packet,
        request,
        writerContract,
        source: "blueprint_writer"
      });

      return {
        text: validation.valid ? blueprintCandidate.text : "",
        reason: validation.valid
          ? "ai_not_allowed_blueprint_candidate_used"
          : "ai_not_allowed_blueprint_candidate_invalid",
        usable: validation.valid,
        complete: blueprintCandidate.complete && validation.valid,
        requiresRepair: !validation.valid || !blueprintCandidate.complete,
        validation
      };
    }

    const safetyFallback = this.resolveSafetyFallback({
      packet,
      writerContract
    });

    if (safetyFallback) return safetyFallback;

    return {
      text: "",
      reason: "ai_not_allowed_and_no_usable_candidate",
      usable: false,
      complete: false,
      requiresRepair: true,
      validation: {
        valid: false,
        reason: "ai_not_allowed_and_no_usable_candidate",
        warnings: [],
        errors: ["no_usable_candidate"]
      }
    };
  },

  resolveRejectedAIFallback({
  packet = {},
  request = {},
  writerContract = {},
  blueprintCandidate = {},
  validation = {}
} = {}) {
  const characterContext =
    this.readCharacterContext(
      packet
    );

  const characterRealizationRequired =
    characterContext
      .answerAvailable ===
      true &&
    characterContext
      .needsAIWriter ===
      true;

  if (
    blueprintCandidate
      .available &&
    !characterRealizationRequired
  ) {
    const blueprintValidation =
      this.validateCandidateText({
        text:
          blueprintCandidate.text,

        packet,

        request,

        writerContract,

        source:
          "blueprint_writer"
      });

    if (
      blueprintValidation.valid
    ) {
      return {
        text:
          blueprintCandidate.text,

        reason:
          "ai_draft_rejected_blueprint_candidate_restored",

        usable:
          blueprintCandidate.usable,

        complete:
          blueprintCandidate.complete,

        requiresRepair:
          blueprintCandidate
            .requiresAIRepair ||
          !blueprintCandidate
            .complete,

        validation:
          blueprintValidation
      };
    }
  }

  const safetyFallback =
    this.resolveSafetyFallback({
      packet,
      writerContract
    });

  if (safetyFallback) {
    return safetyFallback;
  }

  return {
    text:
      "",

    reason:
      characterRealizationRequired
        ? "character_ai_realization_rejected"
        : validation.reason ||
          "ai_draft_rejected",

    usable:
      false,

    complete:
      false,

    requiresRepair:
      true,

    validation: {
      ...validation,

      warnings: [
        ...this.toArray(
          validation.warnings
        ),

        ...(
          characterRealizationRequired
            ? [
                "focused_character_realization_could_not_be_completed"
              ]
            : []
        )
      ]
    }
  };
},

resolveUnavailableAIFallback({
  packet = {},
  request = {},
  writerContract = {},
  blueprintCandidate = {},
  error = null
} = {}) {
  const characterContext =
    this.readCharacterContext(
      packet
    );

  const characterRealizationRequired =
    characterContext
      .answerAvailable ===
      true &&
    characterContext
      .needsAIWriter ===
      true;

  if (
    blueprintCandidate
      .available &&
    !characterRealizationRequired
  ) {
    const validation =
      this.validateCandidateText({
        text:
          blueprintCandidate.text,

        packet,

        request,

        writerContract,

        source:
          "blueprint_writer"
      });

    if (validation.valid) {
      return {
        text:
          blueprintCandidate.text,

        reason:
          "ai_unavailable_blueprint_candidate_used",

        usable:
          blueprintCandidate.usable,

        complete:
          blueprintCandidate.complete,

        requiresRepair:
          blueprintCandidate
            .requiresAIRepair ||
          !blueprintCandidate
            .complete,

        validation
      };
    }
  }

  const safetyFallback =
    this.resolveSafetyFallback({
      packet,
      writerContract
    });

  if (safetyFallback) {
    return safetyFallback;
  }

  return {
    text:
      "",

    reason:
      characterRealizationRequired
        ? "character_ai_realization_unavailable"
        : "ai_unavailable_no_usable_candidate",

    usable:
      false,

    complete:
      false,

    requiresRepair:
      true,

    validation: {
      valid:
        false,

      reason:
        characterRealizationRequired
          ? "character_ai_realization_unavailable"
          : "ai_unavailable_no_usable_candidate",

      warnings: [
        ...(
          error?.message
            ? [
                error.message
              ]
            : []
        ),

        ...(
          characterRealizationRequired
            ? [
                "focused_character_realization_required"
              ]
            : []
        )
      ],

      errors: [
        characterRealizationRequired
          ? "character_ai_realization_unavailable"
          : "no_usable_candidate"
      ]
    }
  };
},

  resolveSafetyFallback({
    packet = {},
    writerContract = {}
  } = {}) {
    const safety = packet.safety || {};
    const contract = safety.contract || {};

    const urgent =
      safety.shouldStopNormalResponse === true ||
      writerContract.currentNeed === "immediate_safety" ||
      this.normalizeIdentifier(writerContract.blueprintHint || "").startsWith("safety_");

    if (!urgent) return null;

    const parts = [
      this.cleanOriginal(contract.opening || "Pause everything else and focus on immediate safety."),
      this.cleanOriginal(
        contract.immediateAction ||
        contract.action ||
        "Move away from the immediate danger if you can and contact emergency help."
      ),
      this.cleanOriginal(
        contract.trustedSupport ||
        contract.supportStep ||
        "Contact someone you trust who can stay with you or help you get support."
      )
    ].filter(Boolean);

    const text = this.enforceLanguageBudget({
      text: parts.join(" "),
      writerContract
    });

    return {
      text,
      reason: "deterministic_safety_fallback",
      usable: Boolean(text),
      complete: Boolean(text),
      requiresRepair: false,
      validation: {
        valid: Boolean(text),
        reason: "deterministic_safety_fallback",
        warnings: [],
        errors: text ? [] : ["safety_fallback_empty"]
      }
    };
  },

  /* =====================================================
     LOCKED DEVELOPER
  ===================================================== */

  readLockedDeveloperDraft(packet = {}) {
    const locked =
      packet.developerPacketLocked === true ||
      packet.developer?.locked === true;

    if (!locked) return "";

    return this.cleanOriginal(
      packet.lockedDeveloperReply ||
      packet.developer?.lockedReply ||
      packet.developerPacket?.reply ||
      packet.developerPacket?.finalResponse ||
      packet.evidence?.developerReply ||
      ""
    );
  },

  /* =====================================================
     MEMORY ACKNOWLEDGMENT
  ===================================================== */

  resolveAuthorizedMemoryAcknowledgment({
    packet = {},
    request = {},
    writerContract = {}
  } = {}) {
    const moveAuthorized = writerContract.responseMoves.some(
      move => move.id === "memory_acknowledgment"
    );

    const planAuthorized =
      moveAuthorized ||
      writerContract.currentNeed === "memory_acknowledgment" ||
      writerContract.responseGoal === "acknowledge_memory_request" ||
      writerContract.responseGoal === "confirm_memory_saved" ||
      this.normalizeIdentifier(writerContract.blueprintHint || "").includes("memory") ||
      packet.memoryPolicy?.acknowledgmentRequired === true;

    if (!planAuthorized) return null;

    const candidate = this.readMemoryCandidate(packet);

    const claim = this.cleanForUser(
      candidate?.displayClaim ||
      packet.memoryPolicy?.displayClaim ||
      this.toUserFacingClaim(request.currentText)
    );

    return claim
      ? `Got it — I’ll remember that ${claim}.`
      : "Got it — I’ll remember that.";
  },

  readMemoryCandidate(packet = {}) {
    const candidates = this.toArray(
      packet.memoryCandidates ||
      packet.evidence?.memoryCandidates ||
      packet.evidence?.memory?.candidates
    );

    return candidates[0] || null;
  },

  toUserFacingClaim(text = "") {
    return String(text || "")
      .replace(/^\s*(?:hey ari,?\s*)/i, "")
      .replace(
        /^\s*(?:remember that|remember this|save this|store this|note that|keep this in mind|add this to memory)\s*/i,
        ""
      )
      .replace(/\bone of my favorite\b/gi, "one of your favorite")
      .replace(/\bmy favorite\b/gi, "your favorite")
      .replace(/\bmy\b/gi, "your")
      .replace(/\bi am\b/gi, "you are")
      .replace(/\bi'm\b/gi, "you’re")
      .replace(/\bi prefer\b/gi, "you prefer")
      .replace(/\bi like\b/gi, "you like")
      .replace(/\bi love\b/gi, "you love")
      .replace(/\bi hate\b/gi, "you hate")
      .replace(/\bi dislike\b/gi, "you dislike")
      .replace(/[.!?]\s*$/, "")
      .trim();
  },

  /* =====================================================
     DEVELOPER RELEVANCE
  ===================================================== */

  isDeveloperRelevant(packet = {}) {
    if (
      packet.developerPacketLocked === true ||
      packet.developer?.locked === true
    ) {
      return true;
    }

    if (
      packet.developerRelevant === true ||
      packet.developer?.relevant === true
    ) {
      return true;
    }

    const question = this.normalize(
      packet.request?.currentText ||
      packet.userQuestion ||
      ""
    );

    const primary = this.normalizeIdentifier(
      packet.primary ||
      packet.responseStrategy?.primaryLane ||
      packet.responsePlan?.routing?.primaryLane ||
      ""
    );

    const shape = this.normalizeIdentifier(
      packet.responseShape ||
      packet.responseControl?.responseShape ||
      ""
    );

    const blueprint = this.normalizeIdentifier(
      packet.blueprintHint ||
      packet.responsePlan?.blueprint?.id ||
      ""
    );

    const explicitCodeFile =
      /\b[\w./-]+\.(?:js|mjs|cjs|html|css|json|md|ts|tsx|jsx|sql|py|yml|yaml)\b/i.test(
        question
      );

    const developerEntities =
      /\b(?:github|repo|repository|branch|commit|deploy|vercel|supabase|pull request|merge|codebase|api|pipeline|engine|composer|function|script|selector|markup|schema|debug|runtime|latency)\b/i.test(
        question
      );

    const developerActions =
      /\b(?:read|open|show|search|find|inspect|diagnose|debug|fix|patch|edit|update|change|replace|remove|rewrite|build|implement|wire|refactor|optimize|test|validate|send|generate)\b/i.test(
        question
      );

    const developerAuthority =
      ["developer", "builder", "coding", "project_help", "developer_artifact"].includes(primary) ||
      shape.includes("developer") ||
      shape.includes("code") ||
      shape.includes("patch") ||
      blueprint.includes("builder");

    return Boolean(
      developerAuthority ||
      explicitCodeFile ||
      (developerEntities && developerActions)
    );
  },

  /* =====================================================
     CONTENT CHECKS
  ===================================================== */

  containsInternalPlannerLanguage(text = "") {
    const normalized = this.normalize(text);

    const patterns = [
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
      "pipeline diagnostic",
      "internal planner",
      "follow the response plan",
      "the writer should",
      "the composer should",
      "the user is asking",
      "according to the packet",
      "according to the plan"
    ];

    return patterns.some(pattern => normalized.includes(pattern));
  },

  containsStaleDeveloperLanguage(text = "") {
    return (
      /\bi (?:read|opened|checked|inspected)\b.*\b(?:index\.html|style\.css|github|repo|repository|file|codebase)\b/i.test(
        text
      ) ||
      /\bloaded file evidence\b/i.test(text) ||
      /\bgithub evidence\b/i.test(text) ||
      /\brepository evidence\b/i.test(text)
    );
  },

  containsAIFailureMessage(text = "") {
    const normalized = this.normalize(text);

    const patterns = [
      "the ai draft was unavailable",
      "ai was unavailable",
      "ai writer failed",
      "blueprint writer failed",
      "the draft failed",
      "try once more",
      "i cannot generate the response",
      "the response generator failed"
    ];

    return patterns.some(pattern => normalized.includes(pattern));
  },

  containsRawJSONDump(text = "") {
    const trimmed = String(text || "").trim();

    if (!trimmed) return false;

    return (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      /```json/i.test(trimmed)
    );
  },

  containsAdviceLanguage(text = "") {
    return /\b(?:you should|you need to|start by|try to|the next step|do this|make sure|I recommend|I’d recommend|consider doing)\b/i.test(
      text
    );
  },

  isAriPreferenceQuestion(text = "") {
    const question = this.normalize(text);

    return (
      /\b(?:what'?s your favorite|what is your favorite|your favorite|do you like|what do you like|what would you choose|what would you prefer|what matters to you|what do you value|your values|your beliefs|your taste|your style|your personality|who are you|what are you|tell me about yourself)\b/.test(
        question
      ) &&
      /\b(?:you|your|ari|yourself)\b/.test(question)
    );
  },

  containsGenericPreferenceDodge(text = "") {
    const normalized = this.normalize(text);

    const dodges = [
      "as an ai",
      "i don't have personal",
      "i do not have personal",
      "i don't have a favorite",
      "i do not have a favorite",
      "i don't have preferences",
      "i do not have preferences"
    ];

    return dodges.some(dodge => normalized.includes(dodge));
  },

  /* =====================================================
     LANGUAGE BUDGET
  ===================================================== */

  enforceLanguageBudget({
    text = "",
    writerContract = {}
  } = {}) {
    let sentences = this.splitSentences(text);

    if (writerContract.finalQuestionAllowed !== true) {
      sentences = sentences.filter(sentence => !sentence.includes("?"));
    } else {
      const maximumQuestions = Math.max(
        0,
        Number(writerContract.maximumQuestions || 0)
      );

      let questionsUsed = 0;

      sentences = sentences.filter(sentence => {
        if (!sentence.includes("?")) return true;
        if (questionsUsed >= maximumQuestions) return false;

        questionsUsed += 1;
        return true;
      });
    }

    if (writerContract.maxSentences) {
      sentences = sentences.slice(0, writerContract.maxSentences);
    }

    let output = sentences.join(" ").trim();

    if (writerContract.maxWords) {
      output = this.limitWords(output, writerContract.maxWords);
    }

    return this.smoothDraft(output);
  },

  limitWords(value = "", maxWords = null) {
    const maximum = Number(maxWords);

    if (!Number.isFinite(maximum) || maximum <= 0) return value;

    const words = String(value || "").split(/\s+/).filter(Boolean);

    if (words.length <= maximum) return value;

    const limited = words
      .slice(0, maximum)
      .join(" ")
      .replace(/[,;:]$/, "")
      .trim();

    return /[.!?]$/.test(limited)
      ? limited
      : `${limited}.`;
  },

  /* =====================================================
     RETURN PAYLOAD
  ===================================================== */

  returnDraft({
    draft = "",
    reason = "fallback",
    usedAI = false,
    usable = false,
    complete = false,
    requiresRepair = false,
    packet = {},
    request = {},
    writerContract = {},
    blueprintCandidate = {},
    validation = null,
    error = null,
    canonicalMemoryAuthorizationUsed = false
  } = {}) {
    const text = this.cleanOriginal(draft);

    const responseMoves = this.toArray(writerContract.responseMoves);

const characterContext =
  this.readCharacterContext(
    packet
  );

const characterUsed =
  characterContext.relevant ===
    true &&
  characterContext
    .answerAvailable ===
    true;

    const result = {
      aiWriterRan: true,
      aiWriterUsedAI: usedAI === true,
      aiWriterSource: "ari-ai-writer",
      aiWriterVersion: this.version,
      aiWriterSchemaVersion: this.schemaVersion,

      aiWriterReason: reason,
      aiWriterFallbackReason: usedAI ? null : reason,
      aiWriterUsable: usable === true,
      aiWriterComplete: complete === true,
      aiWriterRequiresRepair: requiresRepair === true,

aiWriterUsedCharacter:
  characterUsed,

characterRealizationRequired:
  characterContext
    .needsAIWriter ===
  true,

characterAIWriterMode:
  characterContext
    .aiWriterMode ||
  null,

characterFocus:
  characterContext.focus ||
  null,

characterType:
  characterContext.type ||
  null,

characterStatus:
  characterContext.status ||
  null,

      draft: text,
      aiWriterDraft: text,

      responseGoal: writerContract.responseGoal || packet.responseGoal || null,
      responseShape: writerContract.responseShape || packet.responseShape || null,
      responsePosture: writerContract.responsePosture || packet.responsePosture || null,

      canonicalResponsePlanUsed:
        Boolean(
          packet.canonicalResponsePlan ||
          packet.responsePlan
        ),

      canonicalMemoryAuthorizationUsed:
        canonicalMemoryAuthorizationUsed === true,

      responseMoves,
      responseMoveIds: responseMoves.map(move => move.id).filter(Boolean),

      blueprintCandidate: {
        available: blueprintCandidate.available === true,
        usable: blueprintCandidate.usable === true,
        complete: blueprintCandidate.complete === true,
        requiresAIRepair: blueprintCandidate.requiresAIRepair === true,
        canonicalResponsePlanUsed:
          blueprintCandidate.canonicalResponsePlanUsed === true,
        reason: blueprintCandidate.reason || null,
        renderedMoveIds: this.toArray(blueprintCandidate.renderedMoves)
          .map(move => move?.id)
          .filter(Boolean),
        unsupportedMoveIds: this.toArray(blueprintCandidate.unsupportedMoves)
          .map(move => move?.id)
          .filter(Boolean)
      },

      validation: validation || null,

      candidate: {
        source: "ai_writer",
        text,
        usable: usable === true,
        complete: complete === true,
        requiresAIRepair: requiresRepair === true,
        usedAI: usedAI === true,
        taskType: "canonical_response_plan_expression",
        priority: usable ? (usedAI ? 75 : 68) : 20,

        evidence: {
          canonicalResponsePlanUsed:
            Boolean(
              packet.canonicalResponsePlan ||
              packet.responsePlan
            ),

          canonicalMemoryAuthorizationUsed:
            canonicalMemoryAuthorizationUsed === true,

characterAvailable:
  characterContext.available ===
  true,

characterEnabled:
  characterContext.enabled ===
  true,

characterRelevant:
  characterContext.relevant ===
  true,

characterAnswerAvailable:
  characterContext
    .answerAvailable ===
  true,

characterUsed,

characterRealizationRequired:
  characterContext
    .needsAIWriter ===
  true,

characterAIWriterMode:
  characterContext
    .aiWriterMode ||
  null,

characterFocus:
  characterContext.focus ||
  null,

characterType:
  characterContext.type ||
  null,

characterSubtype:
  characterContext.subtype ||
  null,

characterStatus:
  characterContext.status ||
  null,

characterSource:
  characterContext.source ||
  null,

          responseMoveCount:
            responseMoves.length,

          blueprintCandidateAvailable:
            blueprintCandidate.available === true,

          blueprintCandidateComplete:
            blueprintCandidate.complete === true,

          blueprintCandidateRequiredRepair:
            blueprintCandidate.requiresAIRepair === true,

          candidateValidated:
            validation?.valid === true,

          candidateComplete:
            complete === true,

          questionCount:
            validation?.questionCount ??
            this.countQuestions(text),

          containsInternalPlannerLanguage:
            this.containsInternalPlannerLanguage(text),

          containsStaleDeveloperLanguage:
            !this.isDeveloperRelevant(packet) &&
            this.containsStaleDeveloperLanguage(text)
        }
      },

      diagnostics: {
        reason,
        usedAI: usedAI === true,
        usable: usable === true,
        complete: complete === true,
        requiresRepair: requiresRepair === true,
        characterUsed,

characterAnswerAvailable:
  characterContext
    .answerAvailable ===
  true,

characterRealizationRequired:
  characterContext
    .needsAIWriter ===
  true,

characterAIWriterMode:
  characterContext
    .aiWriterMode ||
  null,

characterFocus:
  characterContext.focus ||
  null,

characterType:
  characterContext.type ||
  null,
        turnId: request.turnId || null,
        characterCount: text.length,
        wordCount: this.countWords(text),
        sentenceCount: this.splitSentences(text).length,
        validationErrors: this.toArray(validation?.errors),
        validationWarnings: this.toArray(validation?.warnings),
        error:
          error?.message ||
          (error ? String(error) : null)
      },

      authority: {
        canRenderCanonicalResponsePlan: true,
        canRepairBlueprintCandidate: true,
        canUseAuthorizedCharacterContext: true,
        canUseAuthorizedKnowledgeEvidence: true,
        canUseAuthorizedContinuityContext: true,
        canUseAuthorizedDeveloperEvidence: true,
        canValidateOwnCandidate: true,

        canChooseResponsePlan: false,
        canChangeResponseGoal: false,
        canChangeResponseShape: false,
        canChangeResponseMoves: false,
        canInterpretMeaning: false,
        canOverrideSafety: false,
        canSelectFinalDraft: false,
        canPersistState: false,

        role: "canonical_response_plan_ai_language_renderer"
      }
    };

    window.Ari.aiWriterState = result;

    return result;
  },

  /* =====================================================
     TEXT UTILITIES
  ===================================================== */

  cleanForUser(value = "") {
    return String(value || "")
      .replace(/\bAri should\b/gi, "")
      .replace(/\bHelp Ari recognize when\b/gi, "This matters when")
      .replace(/\bHelp Ari\b/gi, "The point is to")
      .replace(/\bthe user\b/gi, "you")
      .replace(/\busers\b/gi, "people")
      .replace(/\s+/g, " ")
      .trim();
  },

  cleanOriginal(value = "") {
    return String(value ?? "")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalize(value = "") {
    return this.cleanOriginal(value)
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalizeIdentifier(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  },

  splitSentences(value = "") {
    const text = this.cleanOriginal(value);

    if (!text) return [];

    return text
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(Boolean);
  },

  smoothDraft(value = "") {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\bdo not\b/gi, "don’t")
      .replace(/\bI would\b/g, "I’d")
      .replace(/\bIt is\b/g, "It’s")
      .replace(/\s+([,.!?])/g, "$1")
      .trim();
  },

  countWords(value = "") {
    return String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .length;
  },

  countQuestions(value = "") {
    return (String(value || "").match(/\?/g) || []).length;
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

  firstNonEmptyArray(...values) {
    return (
      values.find(
        value =>
          Array.isArray(value) &&
          value.length > 0
      ) ||
      []
    );
  },

  firstFiniteNumber(values = []) {
    for (const value of this.toArray(values)) {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        continue;
      }

      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }

    return null;
  },

  toArray(value) {
    if (Array.isArray(value)) {
      return value.filter(
        item =>
          item !== null &&
          item !== undefined &&
          item !== ""
      );
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  mergeUnique(...values) {
    const result = [];
    const seen = new Set();

    values
      .flatMap(value => this.toArray(value))
      .forEach(value => {
        const key =
          typeof value === "string"
            ? this.normalize(value)
            : this.normalize(
                value.id ||
                value.name ||
                value.type ||
                value.value ||
                value.claim ||
                JSON.stringify(value)
              );

        if (!key || seen.has(key)) return;

        seen.add(key);
        result.push(value);
      });

    return result;
  }
};

window.Ari.aiWriter = window.AriAIWriter;

console.log(
  "ARI AI WRITER LOADED:",
  window.AriAIWriter?.version
);