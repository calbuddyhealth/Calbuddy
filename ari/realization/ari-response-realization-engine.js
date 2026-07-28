// ari/realization/ari-response-realization-engine.js
// Ari Response Realization Engine
//
// Purpose:
// Convert Ari's already-resolved turn, reasoning, safety state, Character
// guidance, and communication preferences into one complete user-facing
// response through OpenAI.
//
// V2.0.0 — Lean Canonical Realization Boundary
//
// Architectural flow:
//
// Perception
//      ↓
// Executive Routing
//      ↓
// Deliberation
//      ↓
// Character Stage
//      ↓
// Language Guidance Stage
//      ↓
// Response Realization Engine
//      ↓
// Final Composition Stage
//      ↓
// Delivery
//
// Responsibilities:
// - Read one canonical realization input.
// - Preserve the resolved current turn and required continuity.
// - Preserve canonical reasoning and response requirements.
// - Preserve canonical safety requirements.
// - Apply resolved communication preferences to expression only.
// - Build one lean OpenAI instruction.
// - Parse and validate one complete model response.
// - Return a stable realization result and packet.
// - Expose concise diagnostics.
//
// Non-responsibilities:
// - Does not reinterpret canonical meaning.
// - Does not independently classify intent or safety.
// - Does not override canonical reasoning or safety.
// - Does not retrieve or persist memory.
// - Does not execute actions.
// - Does not compose or deliver the final response.
// - Does not expose internal prompts in production.

window.Ari = window.Ari || {};

window.AriResponseRealizationEngine = {
  version: "2.0.0",
  schemaVersion: "2.0.0",
  source: "ari-response-realization-engine",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async run(input = {}) {
    const summary =
      input.summary ||
      input.state ||
      input ||
      {};

    const canonicalInput =
      this.buildCanonicalInput(summary);

    const eligibility =
      this.resolveEligibility({
        summary,
        canonicalInput
      });

    if (eligibility.run !== true) {
      return this.returnResult({
        ran: false,
        ready: false,
        usable: false,
        reason: eligibility.reason,
        mode: eligibility.mode,
        canonicalInput,
        eligibility
      });
    }

    const client =
      window.AriOpenAIKnowledgeClient;

    if (
      !client ||
      typeof client.ask !== "function"
    ) {
      return this.returnResult({
        ran: false,
        ready: false,
        usable: false,
        reason: "ari_openai_knowledge_client_unavailable",
        mode: eligibility.mode,
        canonicalInput,
        eligibility,
        error: "AriOpenAIKnowledgeClient.ask was not available."
      });
    }

    const instruction =
      this.buildInstruction({
        canonicalInput,
        eligibility
      });

    let rawResult;

    try {
      rawResult =
        await client.ask({
          summary: {
            userMessage:
              canonicalInput.request.resolvedText,

            message:
              canonicalInput.request.resolvedText,

            input:
              canonicalInput.request.resolvedText,

            question:
              canonicalInput.request.resolvedText,

            originalUserMessage:
              canonicalInput.request.originalText,

            resolvedUserQuestion:
              canonicalInput.request.resolvedText,

            aiInstruction:
              instruction,

            responseGoal:
              canonicalInput.responseContract.goal,

            responseShape:
              canonicalInput.responseContract.shape,

            responsePosture:
              canonicalInput.responseContract.posture,

            realizationMode:
              eligibility.mode,

            communicationPreferences:
              canonicalInput.communicationPreferences,

            source:
              this.source,

            responseRealizationVersion:
              this.version,

            turnId:
              canonicalInput.request.turnId
          }
        });
    } catch (error) {
      console.warn(
        "Ari Response Realization Engine failed:",
        error
      );

      return this.returnResult({
        ran: true,
        ready: false,
        usable: false,
        reason: "openai_realization_request_failed",
        mode: eligibility.mode,
        canonicalInput,
        eligibility,
        instruction,
        error:
          error?.message ||
          String(error)
      });
    }

    const rawText =
      this.extractRawModelText(rawResult);

    const parsed =
      this.parseModelResponse(rawText);

    const realization =
      this.normalizeRealization({
        parsed: parsed.value,
        rawText,
        canonicalInput,
        eligibility,
        structured:
          parsed.succeeded === true
      });

    const validation =
      this.validateRealization({
        realization,
        canonicalInput
      });

    const packet =
      this.buildRealizationPacket({
        realization,
        canonicalInput,
        eligibility,
        validation,
        rawText,
        parseResult: parsed
      });

    return this.returnResult({
      ran: true,
      ready: packet.ready,
      usable: packet.usable,
      reason: packet.reason,
      mode: eligibility.mode,
      packet,
      canonicalInput,
      eligibility,
      instruction,
      rawText,
      parseResult: parsed,
      validation
    });
  },

  /* =====================================================
     ELIGIBILITY
  ===================================================== */

  resolveEligibility({
    summary = {},
    canonicalInput = {}
  } = {}) {
    const lockedResponse =
      this.readLockedResponse(summary);

    if (lockedResponse) {
      return {
        run: false,
        mode: "locked_response",
        reason: "locked_response_bypasses_openai_realization",
        lockedResponseAvailable: true
      };
    }

    const safetyLockedResponse =
      this.readSafetyLockedResponse(summary);

    if (
      canonicalInput.safety.shouldStopNormalResponse === true &&
      safetyLockedResponse
    ) {
      return {
        run: false,
        mode: "fixed_safety_response",
        reason: "fixed_safety_response_bypasses_openai_realization",
        lockedResponseAvailable: true
      };
    }

    if (!canonicalInput.request.resolvedText) {
      return {
        run: false,
        mode: "missing_current_turn",
        reason: "canonical_current_turn_missing",
        lockedResponseAvailable: false
      };
    }

    return {
      run: true,
      mode:
        this.resolveRealizationMode(
          canonicalInput
        ),
      reason: "primary_openai_response_realization_authorized",
      lockedResponseAvailable: false
    };
  },

  resolveRealizationMode(
    canonicalInput = {}
  ) {
    if (
      canonicalInput.safety
        .shouldStopNormalResponse === true
    ) {
      return "safety_governed_realization";
    }

    if (
      canonicalInput.developer.relevant === true
    ) {
      return "developer_response_realization";
    }

    if (
      canonicalInput.continuity
        .isContinuation === true ||
      canonicalInput.continuity
        .requiresPriorContext === true
    ) {
      return "continuity_aware_realization";
    }

    const family =
      this.normalizeIdentifier(
        canonicalInput.semantic
          .interactionFamily ||
        canonicalInput.semantic
          .intentFamily ||
        canonicalInput.semantic
          .operation ||
        ""
      );

    if (
      family.includes("information") ||
      family.includes("fact") ||
      canonicalInput.responseContract.goal ===
        "provide_information"
    ) {
      return "general_knowledge_realization";
    }

    if (
      family.includes("advice") ||
      family.includes("decision") ||
      family.includes("reason")
    ) {
      return "reasoned_response_realization";
    }

    if (
      family.includes("emotion") ||
      family.includes("support") ||
      family.includes("relationship")
    ) {
      return "relational_response_realization";
    }

    return "primary_response_realization";
  },

  /* =====================================================
     CANONICAL INPUT
  ===================================================== */

  buildCanonicalInput(summary = {}) {
    const safety =
      this.readSafety(summary);

    return {
      schema:
        "ari_response_realization_input",

      schemaVersion:
        this.schemaVersion,

      request:
        this.readRequest(summary),

      continuity:
        this.readContinuity(summary),

      semantic:
        this.readSemantic(summary),

      reasoning:
        this.readReasoning(summary),

      responseContract:
        this.readResponseContract(summary),

      safety,

      character:
        this.readCharacter(summary),

      languageGuidance:
        this.readLanguageGuidance(summary),

      communicationPreferences:
        this.readCommunicationPreferences(
          summary
        ),

      memory:
        this.readMemory(summary),

      developer:
        this.readDeveloper(summary),

      knowledgePolicy:
        this.readKnowledgePolicy({
          summary,
          safety
        }),

      source:
        this.source,

      version:
        this.version
    };
  },

  /* =====================================================
     REQUEST
  ===================================================== */

  readRequest(summary = {}) {
    const deliberationPacket =
      summary.deliberationPacket ||
      {};

    const canonicalMeaning =
      summary.semanticSummary
        ?.canonicalMeaning ||
      summary.canonicalMeaning ||
      summary.semanticFrame
        ?.canonicalMeaning ||
      {};

    const responsePlan =
      summary.canonicalResponsePlan ||
      summary.responsePlan ||
      {};

    const originalText =
      this.cleanText(
        deliberationPacket
          ?.request
          ?.original ||
        summary.originalUserMessage ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        canonicalMeaning.originalText ||
        ""
      );

    const resolvedText =
      this.cleanText(
        deliberationPacket
          ?.request
          ?.resolved ||
        summary.resolvedUserQuestion ||
        summary.resolvedQuestion ||
        responsePlan.resolvedUserQuestion ||
        canonicalMeaning.resolvedText ||
        originalText
      );

    return {
      turnId:
        summary.turnId ||
        summary.currentTurnId ||
        deliberationPacket.turnId ||
        responsePlan.turnId ||
        null,

      originalText,

      resolvedText:
        resolvedText ||
        originalText,

      currentTurnWasResolved:
        Boolean(
          originalText &&
          resolvedText &&
          this.normalizeText(originalText) !==
            this.normalizeText(resolvedText)
        ),

      authority:
        "canonical_current_turn"
    };
  },

  /* =====================================================
     CONTINUITY
  ===================================================== */

  readContinuity(summary = {}) {
    const semanticContinuity =
      summary.semanticSummary
        ?.continuity ||
      summary.canonicalMeaning
        ?.continuity ||
      {};

    const handoff =
      summary.continuityHandoff ||
      summary.continuityResult ||
      summary.continuityContext ||
      summary.deliberationPacket
        ?.continuity ||
      {};

    const operatingState =
      summary.conversationOperatingState ||
      summary.threadState ||
      {};

    const recentTurns =
      this.readRecentTurns({
        summary,
        semanticContinuity,
        handoff,
        operatingState
      });

    return {
      isContinuation:
        semanticContinuity
          .isContinuation === true ||
        handoff.isContinuation === true ||
        summary.routingDecision
          ?.mode === "follow_up" ||
        summary.mode
          ?.isFollowUp === true,

      requiresPriorContext:
        semanticContinuity
          .requiresPriorContext === true ||
        semanticContinuity
          .likelyNeedsPriorContext === true ||
        handoff.requiresPriorContext === true ||
        summary.mode
          ?.mustReusePriorContext === true,

      activeTopic:
        handoff.activeTopic ||
        semanticContinuity.anchor ||
        operatingState.activeTopic ||
        null,

      inheritedSubject:
        handoff.inheritedSubject ||
        semanticContinuity.inheritedSubject ||
        null,

      resolvedReference:
        semanticContinuity
          .resolvedReferenceValue ||
        handoff.resolvedReference ||
        null,

      previousAnswerSummary:
        semanticContinuity
          .previousAnswerSummary ||
        handoff.previousAnswerSummary ||
        operatingState.previousAnswerSummary ||
        null,

      conversationSummary:
        handoff.conversationSummary ||
        operatingState.conversationSummary ||
        summary.conversationSummary ||
        null,

      recentTurns:
        recentTurns.slice(-8),

      authority:
        "resolved_continuity_context"
    };
  },

  readRecentTurns({
    summary = {},
    semanticContinuity = {},
    handoff = {},
    operatingState = {}
  } = {}) {
    const source =
      [
        handoff.recentTurns,
        handoff.recentMessages,
        semanticContinuity.recentTurns,
        operatingState.recentTurns,
        summary.recentTurns,
        summary.recentMessages,
        summary.conversationHistory,
        summary.messages
      ].find(
        value =>
          Array.isArray(value) &&
          value.length > 0
      ) ||
      [];

    return source
      .map(
        (turn, index) =>
          this.normalizeConversationTurn(
            turn,
            index
          )
      )
      .filter(
        turn =>
          Boolean(turn.text)
      );
  },

  normalizeConversationTurn(
    turn = {},
    index = 0
  ) {
    if (typeof turn === "string") {
      return {
        index,
        role: "unknown",
        text: this.cleanText(turn),
        turnId: null
      };
    }

    if (
      !turn ||
      typeof turn !== "object"
    ) {
      return {
        index,
        role: "unknown",
        text: "",
        turnId: null
      };
    }

    const rawRole =
      this.normalizeIdentifier(
        turn.role ||
        turn.sender ||
        turn.author ||
        turn.type ||
        ""
      );

    const role =
      ["assistant", "ari", "bot"]
        .includes(rawRole)
        ? "assistant"
        : ["user", "human"]
            .includes(rawRole)
          ? "user"
          : rawRole || "unknown";

    return {
      index,

      role,

      text:
        this.cleanText(
          turn.text ||
          turn.content ||
          turn.message ||
          turn.body ||
          turn.response ||
          turn.reply ||
          ""
        ),

      turnId:
        turn.turnId ||
        turn.id ||
        null,

      timestamp:
        turn.timestamp ||
        turn.createdAt ||
        turn.created_at ||
        null
    };
  },

  /* =====================================================
     SEMANTIC MEANING
  ===================================================== */

  readSemantic(summary = {}) {
    const semanticSummary =
      summary.semanticSummary ||
      summary.semanticFrame ||
      {};

    const canonical =
      semanticSummary.canonicalMeaning ||
      summary.canonicalMeaning ||
      {};

    return {
      operation:
        semanticSummary.operation ||
        canonical.requestedOperation ||
        canonical.userGoal ||
        null,

      requestedOutput:
        semanticSummary.requestedOutput ||
        canonical.requestedOutput ||
        null,

      interactionFamily:
        semanticSummary.interactionFamily ||
        canonical.interactionFamily ||
        null,

      intentFamily:
        semanticSummary.intentFamily ||
        canonical.intentFamily ||
        null,

      speechAct:
        canonical.speechAct ||
        null,

      subject:
        canonical.subject ||
        semanticSummary.subject ||
        null,

      target:
        canonical.target ||
        semanticSummary.target ||
        null,

      constraints:
        this.toStringArray(
          canonical.constraints ||
          semanticSummary.constraints
        ),

      stakes:
        this.toStringArray(
          canonical.stakes ||
          semanticSummary.stakes
        ),

      ambiguity:
        canonical.ambiguity ||
        semanticSummary.ambiguity ||
        null,

      confidence:
        canonical.confidence ??
        semanticSummary.confidenceScore ??
        null,

      authority:
        "canonical_semantic_description"
    };
  },

  /* =====================================================
     REASONING
  ===================================================== */

  readReasoning(summary = {}) {
    const result =
      summary.reasoningResult ||
      summary.ariReasoning ||
      summary.cognitiveExecutive ||
      summary.reasoningStagePacket ||
      {};

    return {
      ran:
        summary.reasoningRan === true ||
        summary.reasoningStageRan === true ||
        result.ran === true,

      conclusion:
        summary.reasoningConclusion ||
        result.conclusion ||
        null,

      recommendation:
        summary.reasoningRecommendation ||
        result.recommendation ||
        null,

      rationale:
        summary.reasoningRationale ||
        result.rationale ||
        null,

      evidence:
        this.toArray(
          summary.reasoningEvidence ||
          result.evidence
        ),

      authority:
        "canonical_reasoning_context"
    };
  },

  /* =====================================================
     RESPONSE CONTRACT
  ===================================================== */

  readResponseContract(summary = {}) {
    const plan =
      summary.canonicalResponsePlan ||
      summary.responsePlan ||
      summary.responsePlanningStagePacket
        ?.responsePlan ||
      {};

    const control =
      summary.responseControl ||
      plan.responseControl ||
      {};

    const writer =
      summary.writerInstructions ||
      control.writerInstructions ||
      plan.writerInstructions ||
      {};

    const moves =
      this.normalizeMoves(
        this.firstNonEmptyArray(
          summary.responseMoves,
          control.responseMoves,
          plan.responseMoves,
          plan.moves,
          writer.responseMoves,
          writer.moves
        )
      );

    return {
      goal:
        summary.responseGoal ||
        control.responseGoal ||
        plan.responseGoal ||
        "answer_user",

      shape:
        summary.responseShape ||
        control.responseShape ||
        plan.responseShape ||
        writer.shape ||
        "natural_complete_response",

      posture:
        summary.responsePosture ||
        control.responsePosture ||
        plan.responsePosture ||
        writer.posture ||
        "natural_direct",

      requiredMoves:
        moves.filter(
          move =>
            move.required === true &&
            move.userFacing !== false
        ),

      optionalMoves:
        moves.filter(
          move =>
            move.required !== true &&
            move.userFacing !== false
        ),

      requiredBehaviors:
        this.mergeInstructionText(
          summary.responseRequired,
          summary.requiredBehaviors,
          control.requiredBehaviors,
          plan.requiredBehaviors,
          writer.required
        ),

      forbiddenBehaviors:
        this.mergeInstructionText(
          summary.responseAvoid,
          summary.forbiddenBehaviors,
          control.forbiddenBehaviors,
          plan.forbiddenBehaviors,
          writer.avoid
        ),

      constraints:
        this.mergeInstructionText(
          summary.responseConstraints,
          control.constraints,
          plan.constraints,
          writer.constraints
        ),

      rules:
        this.mergeInstructionText(
          summary.responseRules,
          control.rules,
          plan.responseRules,
          writer.rules
        ),

      shouldAskQuestion:
        summary.shouldAskQuestion === true ||
        control.questionPolicy
          ?.shouldAskQuestion === true ||
        plan.shouldAskQuestion === true,

      finalQuestionAllowed:
        summary.finalQuestionAllowed === true ||
        control.questionPolicy
          ?.finalQuestionAllowed === true ||
        plan.finalQuestionAllowed === true,

      maximumQuestions:
        this.firstFiniteNumber([
          summary.maximumQuestions,
          control.questionPolicy
            ?.maximumQuestions,
          writer.maxQuestions,
          null
        ]),

      maxSentences:
        this.firstFiniteNumber([
          writer.maxSentences,
          summary.communicationPlan
            ?.languageBudget
            ?.maxSentences,
          null
        ]),

      maxWords:
        this.firstFiniteNumber([
          writer.maxWords,
          summary.communicationPlan
            ?.languageBudget
            ?.maxWords,
          null
        ]),

      maxParagraphs:
        this.firstFiniteNumber([
          writer.maxParagraphs,
          summary.communicationPlan
            ?.languageBudget
            ?.maxParagraphs,
          null
        ]),

      answerFirst:
        writer.answerFirst !== false,

      authority:
        "canonical_response_contract"
    };
  },

  normalizeMoves(moves = []) {
    return this.toArray(moves)
      .map(
        (move, index) => {
          if (typeof move === "string") {
            const id =
              this.normalizeIdentifier(move);

            return id
              ? {
                  id,
                  order: index,
                  required: true,
                  userFacing: true,
                  guidance: null
                }
              : null;
          }

          if (
            !move ||
            typeof move !== "object"
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
                Number(move.order)
              )
                ? Number(move.order)
                : index,

            required:
              move.required !== false,

            userFacing:
              move.userFacing !== false,

            guidance:
              this.extractInstructionText(
                move.contentGuidance ||
                move.contentHint ||
                move.purpose ||
                move.hint
              ) ||
              null
          };
        }
      )
      .filter(Boolean)
      .sort(
        (first, second) =>
          first.order -
          second.order
      );
  },

  /* =====================================================
     SAFETY
  ===================================================== */

  readSafety(summary = {}) {
    const gate =
      summary.safetyContextGate ||
      {};

    const deepReview =
      summary.deepSafetyResult ||
      {};

    const disposition =
      summary.safetyDisposition ||
      {};

    return {
      severity:
        disposition.severity ||
        deepReview.severity ||
        gate.severity ||
        "none",

      category:
        disposition.category ||
        deepReview.category ||
        gate.category ||
        null,

      shouldStopNormalResponse:
        summary
          .safetyShouldStopNormalResponse === true ||
        disposition
          .shouldStopNormalResponse === true ||
        deepReview
          .shouldStopNormalResponse === true,

      communicationStyle:
        summary.safetyCommunicationStyle ||
        disposition.communicationStyle ||
        null,

      requiredBehaviors:
        this.mergeInstructionText(
          disposition.requiredBehaviors,
          deepReview.requiredBehaviors
        ),

      prohibitedBehaviors:
        this.mergeInstructionText(
          disposition.prohibitedBehaviors,
          deepReview.prohibitedBehaviors
        ),

      authority:
        "canonical_safety_governance"
    };
  },

  /* =====================================================
     CHARACTER
  ===================================================== */

  readCharacter(summary = {}) {
    const handoff =
      summary.characterHandoff ||
      {};

    return {
      emotion:
        handoff.emotion ||
        summary.emotion ||
        "idle",

      tone:
        handoff.tone ||
        handoff.expression
          ?.tone ||
        null,

      warmth:
        handoff.warmth ||
        handoff.expression
          ?.warmth ||
        null,

      directness:
        handoff.directness ||
        handoff.expression
          ?.directness ||
        null,

      instructions:
        this.mergeInstructionText(
          handoff.personalityInstructions,
          handoff.instructions,
          handoff.responseRules
        ),

      resolvedAnswer:
        handoff.answer ||
        handoff.reasoning
          ?.answer ||
        null,

      preserveMeaning:
        handoff.realization
          ?.preserveMeaning !== false,

      tentativeLanguageRequired:
        handoff.realization
          ?.tentativeLanguageRequired === true,

      authority:
        "focused_character_guidance"
    };
  },

  /* =====================================================
     LANGUAGE GUIDANCE
  ===================================================== */

  readLanguageGuidance(summary = {}) {
    const handoff =
      summary.languageGuidanceHandoff ||
      {};

    const communicationPlan =
      summary.communicationPlan ||
      {};

    const expressionPlan =
      summary.expressionPlan ||
      {};

    return {
      preferredTerms:
        this.toStringArray(
          summary.preferredTerms ||
          summary.lexicalGrounding
            ?.preferredTerms ||
          handoff.preferredTerms
        ),

      rules:
        this.mergeInstructionText(
          handoff.rules,
          communicationPlan.rules,
          expressionPlan.rules
        ),

      avoid:
        this.mergeInstructionText(
          handoff.avoid,
          communicationPlan.avoid,
          expressionPlan.avoid
        ),

      authority:
        "canonical_language_guidance"
    };
  },

  /* =====================================================
     COMMUNICATION PREFERENCES
  ===================================================== */

  readCommunicationPreferences(
    summary = {}
  ) {
    const runtimePacket =
      summary.resolvedPreferencePacket ||
      summary.communicationPreferences ||
      summary.preferenceContext ||
      summary.userPreferenceContext ||
      summary.preferenceRuntime
        ?.resolvedPacket ||
      window.AriPreferenceRuntime
        ?.resolvedPacket ||
      window.Ari
        ?.preferenceRuntime
        ?.resolvedPacket ||
      {};

    const language =
      runtimePacket.language ||
      runtimePacket.communication ||
      runtimePacket.preferences
        ?.language ||
      runtimePacket.preferences
        ?.communication ||
      runtimePacket;

    return {
      tone:
        this.normalizePreference(
          language.tone,
          [
            "professional",
            "natural",
            "casual"
          ],
          "natural"
        ),

      directness:
        this.normalizePreference(
          language.directness,
          [
            "gentle",
            "balanced",
            "blunt"
          ],
          "balanced"
        ),

      humor:
        this.normalizePreference(
          language.humor,
          [
            "none",
            "occasional",
            "frequent"
          ],
          "occasional"
        ),

      language:
        this.normalizePreference(
          language.language ||
          language.profanity,
          [
            "default",
            "match_me",
            "always"
          ],
          "default"
        ),

      responseLength:
        this.normalizePreference(
          language.responseLength ||
          language.detail,
          [
            "concise",
            "balanced",
            "detailed"
          ],
          "balanced"
        ),

      authority:
        "resolved_expression_preferences"
    };
  },

  normalizePreference(
    value,
    allowed = [],
    fallback = ""
  ) {
    const normalized =
      this.normalizeIdentifier(value);

    return allowed.includes(normalized)
      ? normalized
      : fallback;
  },

  /* =====================================================
     MEMORY
  ===================================================== */

  readMemory(summary = {}) {
    const memory =
      summary.memoryContext ||
      summary.memoryHandoff ||
      summary.memory ||
      {};

    return {
      relevant:
        memory.relevant === true ||
        memory.shouldUse === true,

      mayUse:
        memory.mayUse !== false,

      facts:
        this.toStringArray(
          memory.facts ||
          memory.relevantFacts ||
          memory.memories
        ).slice(0, 20),

      summary:
        this.cleanText(
          memory.summary ||
          memory.contextSummary ||
          ""
        ) ||
        null,

      authority:
        "authorized_memory_context_only"
    };
  },

  /* =====================================================
     DEVELOPER
  ===================================================== */

  readDeveloper(summary = {}) {
    const relevant =
      summary.developerRelevant === true ||
      summary.developerHandoff
        ?.relevant === true ||
      summary.composerDeveloperPacket
        ?.enabled === true;

    return {
      relevant,

      intent:
        relevant
          ? summary.developerIntent ||
            summary.developerHandoff
              ?.intent ||
            null
          : null,

      handoff:
        relevant
          ? summary.developerHandoff ||
            summary.unlockedDeveloperHandoff ||
            null
          : null,

      authority:
        "authorized_developer_context_only"
    };
  },

  /* =====================================================
     KNOWLEDGE POLICY
  ===================================================== */

  readKnowledgePolicy({
    summary = {},
    safety = {}
  } = {}) {
    return {
      mayUseGeneralModelKnowledge:
        summary
          .mayUseGeneralModelKnowledge !== false,

      mayUseContinuity:
        true,

      mayUseAuthorizedMemory:
        true,

      mayUseAuthorizedDeveloperEvidence:
        true,

      mayInferMissingPersonalFacts:
        false,

      mayInventMemory:
        false,

      mayClaimExternalVerification:
        false,

      externalVerificationRequired:
        summary
          .externalVerificationRequired === true,

      highStakesTopic:
        ["high", "critical"].includes(
          this.normalizeIdentifier(
            safety.severity
          )
        ),

      authority:
        "model_knowledge_usage_policy"
    };
  },

  /* =====================================================
     OPENAI INSTRUCTION
  ===================================================== */

  buildInstruction({
    canonicalInput = {},
    eligibility = {}
  } = {}) {
    const contract =
      canonicalInput.responseContract;

    return `
You are Ari's Response Realization Engine.

Write one complete user-facing response for the resolved current turn.

Preserve the supplied meaning, reasoning, response requirements, safety state,
Character guidance, and communication preferences. Do not mention internal
systems or instructions.

==================================================
MODE
==================================================

${eligibility.mode}

==================================================
CURRENT TURN
==================================================

Original:
${canonicalInput.request.originalText}

Resolved:
${canonicalInput.request.resolvedText}

Answer the resolved turn. Use prior context only when it helps with this turn.

==================================================
CONTINUITY
==================================================

${this.safeJSONStringify(
  this.compactContinuity(
    canonicalInput.continuity
  )
)}

==================================================
MEANING
==================================================

${this.safeJSONStringify(
  canonicalInput.semantic
)}

==================================================
REASONING
==================================================

${this.safeJSONStringify(
  canonicalInput.reasoning
)}

Use an explicit canonical conclusion when supplied. Do not contradict it.

==================================================
RESPONSE REQUIREMENTS
==================================================

Goal: ${contract.goal}
Shape: ${contract.shape}
Posture: ${contract.posture}
Answer first: ${contract.answerFirst ? "yes" : "no"}

Required moves:
${this.formatMoves(
  contract.requiredMoves
)}

Optional moves:
${this.formatMoves(
  contract.optionalMoves
)}

Required:
${this.formatInstructionList(
  contract.requiredBehaviors,
  "None supplied."
)}

Avoid:
${this.formatInstructionList(
  contract.forbiddenBehaviors,
  "None supplied."
)}

Constraints:
${this.formatInstructionList(
  contract.constraints,
  "None supplied."
)}

Rules:
${this.formatInstructionList(
  contract.rules,
  "Answer directly and naturally."
)}

Question guidance:
- ask a question: ${contract.shouldAskQuestion ? "yes" : "no"}
- a final question is allowed: ${contract.finalQuestionAllowed ? "yes" : "no"}
- maximum questions: ${contract.maximumQuestions ?? "use judgment"}

Length guidance:
- maximum sentences: ${contract.maxSentences ?? "use judgment"}
- maximum words: ${contract.maxWords ?? "use judgment"}
- maximum paragraphs: ${contract.maxParagraphs ?? "use judgment"}

==================================================
SAFETY
==================================================

${this.safeJSONStringify(
  canonicalInput.safety
)}

Follow the supplied safety state. Do not create extra restrictions that were not
provided by the canonical safety state.

==================================================
CHARACTER
==================================================

${this.safeJSONStringify(
  canonicalInput.character
)}

Sound like Ari. Preserve focused Character guidance when supplied.

==================================================
COMMUNICATION PREFERENCES
==================================================

${this.safeJSONStringify(
  canonicalInput.communicationPreferences
)}

Apply these settings to expression only.

Use the selected tone, directness, humor, language style, and response length
naturally. They do not change reasoning, accuracy, meaning, or safety. Do not
replace an explicit preference with a generic formal style unless the supplied
safety state requires a different presentation.

==================================================
LANGUAGE GUIDANCE
==================================================

${this.safeJSONStringify(
  canonicalInput.languageGuidance
)}

==================================================
AUTHORIZED MEMORY
==================================================

${this.safeJSONStringify(
  canonicalInput.memory
)}

Use only supplied authorized memory. Do not invent memory.

==================================================
AUTHORIZED DEVELOPER CONTEXT
==================================================

${this.safeJSONStringify(
  canonicalInput.developer
)}

Use developer context only when relevant is true.

==================================================
KNOWLEDGE
==================================================

${this.safeJSONStringify(
  canonicalInput.knowledgePolicy
)}

Use general model knowledge when permitted. Do not claim current external
verification unless the canonical state confirms it.

==================================================
OUTPUT
==================================================

Return one valid JSON object and nothing else:

{
  "responseText": "Complete user-facing response.",
  "responseStrategy": {
    "approach": "brief description",
    "tone": "tone used",
    "technicalLevel": "plain_language | moderate | technical"
  },
  "suggestedEmoji": "",
  "emojiPlacement": "none",
  "composerInstructions": {
    "preserveMeaning": true,
    "preserveResponseText": true,
    "maySmoothLanguage": true,
    "useSuggestedEmoji": false
  },
  "fulfillment": {
    "completedMoves": [],
    "omittedMoves": [],
    "clarificationNeeded": false
  }
}

Rules:

- responseText must be complete and ready for final composition.
- Do not place the suggested emoji inside responseText.
- Suggest no more than one emoji.
- Valid emoji placements: "start", "end", or "none".
- Use an empty suggestedEmoji when no emoji adds value.
- Do not wrap the JSON in Markdown.
- Do not output text before or after the JSON.
- Do not mention internal systems, packets, stages, policies, or diagnostics.
`.trim();
  },

  compactContinuity(
    continuity = {}
  ) {
    return {
      isContinuation:
        continuity.isContinuation === true,

      requiresPriorContext:
        continuity.requiresPriorContext === true,

      activeTopic:
        continuity.activeTopic,

      inheritedSubject:
        continuity.inheritedSubject,

      resolvedReference:
        continuity.resolvedReference,

      previousAnswerSummary:
        continuity.previousAnswerSummary,

      conversationSummary:
        continuity.conversationSummary,

      recentTurns:
        this.toArray(
          continuity.recentTurns
        ).slice(-8)
    };
  },

  formatMoves(moves = []) {
    const values =
      this.toArray(moves);

    if (!values.length) {
      return "- None supplied.";
    }

    return values
      .map(
        (move, index) =>
          `- ${index + 1}. ${move.id}${
            move.guidance
              ? ` — ${move.guidance}`
              : ""
          }`
      )
      .join("\n");
  },

  /* =====================================================
     MODEL RESPONSE EXTRACTION
  ===================================================== */

  extractRawModelText(result = {}) {
    if (typeof result === "string") {
      return this.cleanText(result);
    }

    if (
      !result ||
      typeof result !== "object"
    ) {
      return "";
    }

    return this.cleanText(
      result.outputText ||
      result.responseText ||
      result.finalResponse ||
      result.output ||
      result.text ||
      result.content ||
      result.response ||
      result.answer ||
      result.message ||
      result.knowledgeAnswer ||
      ""
    );
  },

  parseModelResponse(rawText = "") {
    const cleaned =
      this.stripCodeFence(rawText);

    if (!cleaned) {
      return {
        succeeded: false,
        mode: "empty",
        value: null,
        error: "model_response_empty"
      };
    }

    try {
      const value =
        JSON.parse(cleaned);

      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        return {
          succeeded: true,
          mode: "direct_json",
          value,
          error: null
        };
      }
    } catch (error) {
      // Continue.
    }

    const extracted =
      this.extractJSONObject(cleaned);

    if (extracted) {
      try {
        const value =
          JSON.parse(extracted);

        if (
          value &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          return {
            succeeded: true,
            mode: "extracted_json",
            value,
            error: null
          };
        }
      } catch (error) {
        // Continue.
      }
    }

    return {
      succeeded: false,
      mode: "plain_text_compatibility",
      value: {
        responseText: cleaned
      },
      error: "structured_json_not_returned"
    };
  },

  stripCodeFence(value = "") {
    return String(value || "")
      .trim()
      .replace(
        /^```(?:json)?\s*/i,
        ""
      )
      .replace(
        /\s*```$/,
        ""
      )
      .trim();
  },

  extractJSONObject(value = "") {
    const text =
      String(value || "");

    const start =
      text.indexOf("{");

    const end =
      text.lastIndexOf("}");

    if (
      start === -1 ||
      end === -1 ||
      end <= start
    ) {
      return "";
    }

    return text
      .slice(start, end + 1)
      .trim();
  },

  /* =====================================================
     NORMALIZATION
  ===================================================== */

  normalizeRealization({
    parsed = {},
    rawText = "",
    canonicalInput = {},
    eligibility = {},
    structured = false
  } = {}) {
    const value =
      parsed &&
      typeof parsed === "object"
        ? parsed
        : {};

    const strategy =
      value.responseStrategy &&
      typeof value.responseStrategy ===
        "object"
        ? value.responseStrategy
        : {};

    const composer =
      value.composerInstructions &&
      typeof value.composerInstructions ===
        "object"
        ? value.composerInstructions
        : {};

    const fulfillment =
      value.fulfillment &&
      typeof value.fulfillment ===
        "object"
        ? value.fulfillment
        : {};

    const responseText =
      this.cleanText(
        value.responseText ||
        value.finalResponse ||
        value.response ||
        value.answer ||
        value.text ||
        ""
      );

    const suggestedEmoji =
      this.normalizeSuggestedEmoji(
        value.suggestedEmoji
      );

    return {
      responseText,

      structured,

      responseStrategy: {
        approach:
          this.cleanText(
            strategy.approach ||
            eligibility.mode ||
            "primary_response_realization"
          ),

        tone:
          this.cleanText(
            strategy.tone ||
            canonicalInput
              .communicationPreferences
              .tone ||
            canonicalInput.character.tone ||
            "natural"
          ),

        technicalLevel:
          this.normalizeTechnicalLevel(
            strategy.technicalLevel
          )
      },

      suggestedEmoji,

      emojiPlacement:
        this.normalizeEmojiPlacement(
          value.emojiPlacement,
          suggestedEmoji
        ),

      composerInstructions: {
        preserveMeaning:
          composer.preserveMeaning !== false,

        preserveResponseText:
          composer.preserveResponseText !== false,

        maySmoothLanguage:
          composer.maySmoothLanguage !== false,

        useSuggestedEmoji:
          Boolean(suggestedEmoji) &&
          composer.useSuggestedEmoji !== false
      },

      fulfillment: {
        completedMoves:
          this.toIdentifierArray(
            fulfillment.completedMoves
          ),

        omittedMoves:
          this.toIdentifierArray(
            fulfillment.omittedMoves
          ),

        clarificationNeeded:
          fulfillment.clarificationNeeded === true
      },

      rawText:
        this.cleanText(rawText)
    };
  },

  normalizeSuggestedEmoji(value = "") {
    const text =
      String(value || "")
        .trim()
        .replace(/\s+/g, "");

    if (
      !text ||
      text.length > 12 ||
      /[a-z0-9]/i.test(text)
    ) {
      return "";
    }

    return text;
  },

  normalizeEmojiPlacement(
    value = "",
    emoji = ""
  ) {
    if (!emoji) {
      return "none";
    }

    const placement =
      this.normalizeIdentifier(value);

    return ["start", "end"]
      .includes(placement)
      ? placement
      : "none";
  },

  normalizeTechnicalLevel(value = "") {
    const normalized =
      this.normalizeIdentifier(value);

    return [
      "plain_language",
      "moderate",
      "technical"
    ].includes(normalized)
      ? normalized
      : "plain_language";
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validateRealization({
    realization = {},
    canonicalInput = {}
  } = {}) {
    const errors = [];
    const warnings = [];

    const text =
      this.cleanText(
        realization.responseText
      );

    if (!text) {
      errors.push(
        "realization_response_text_empty"
      );
    }

    if (
      text &&
      text.length < 3
    ) {
      errors.push(
        "realization_response_text_too_short"
      );
    }

    if (
      this.containsInvalidValue(text)
    ) {
      errors.push(
        "invalid_runtime_value_detected"
      );
    }

    if (
      this.containsInternalLanguage(text)
    ) {
      warnings.push(
        "internal_pipeline_language_detected"
      );
    }

    if (
      this.containsWriterFailureMessage(text)
    ) {
      errors.push(
        "writer_failure_message_detected"
      );
    }

    if (
      realization.structured !== true
    ) {
      warnings.push(
        "structured_json_not_returned"
      );
    }

    const contract =
      canonicalInput.responseContract ||
      {};

    const questionCount =
      this.countUserDirectedQuestions(text);

    if (
      contract.shouldAskQuestion === true &&
      questionCount === 0
    ) {
      warnings.push(
        "required_question_missing"
      );
    }

    if (
      contract.finalQuestionAllowed !== true &&
      questionCount > 0
    ) {
      warnings.push(
        "unplanned_question_detected"
      );
    }

    if (
      Number.isFinite(
        Number(contract.maximumQuestions)
      ) &&
      questionCount >
        Number(contract.maximumQuestions)
    ) {
      warnings.push(
        "question_limit_exceeded"
      );
    }

    const sentenceCount =
      this.splitSentences(text).length;

    const wordCount =
      this.countWords(text);

    const paragraphCount =
      this.countParagraphs(text);

    if (
      contract.maxSentences &&
      sentenceCount >
        contract.maxSentences
    ) {
      warnings.push(
        "sentence_budget_exceeded"
      );
    }

    if (
      contract.maxWords &&
      wordCount >
        contract.maxWords
    ) {
      warnings.push(
        "word_budget_exceeded"
      );
    }

    if (
      contract.maxParagraphs &&
      paragraphCount >
        contract.maxParagraphs
    ) {
      warnings.push(
        "paragraph_budget_exceeded"
      );
    }

    const requiredMoveIds =
      this.toArray(
        contract.requiredMoves
      )
        .map(move => move?.id)
        .filter(Boolean);

    const completedMoveIds =
      this.toIdentifierArray(
        realization.fulfillment
          ?.completedMoves
      );

    const omittedRequiredMoves =
      requiredMoveIds.filter(
        id =>
          !completedMoveIds.includes(id)
      );

    if (
      requiredMoveIds.length > 0 &&
      completedMoveIds.length === 0
    ) {
      warnings.push(
        "model_did_not_report_move_fulfillment"
      );
    }

    const valid =
      errors.length === 0 &&
      Boolean(text);

    return {
      valid,

      complete:
        valid &&
        omittedRequiredMoves.length === 0,

      usable:
        valid,

      reason:
        errors[0] ||
        (
          warnings.length
            ? "realization_valid_with_warnings"
            : "realization_valid"
        ),

      errors:
        this.uniqueValues(errors),

      warnings:
        this.uniqueValues(warnings),

      sentenceCount,
      wordCount,
      paragraphCount,
      questionCount,
      requiredMoveIds,
      completedMoveIds,
      omittedRequiredMoves
    };
  },

  /* =====================================================
     PACKET
  ===================================================== */

  buildRealizationPacket({
    realization = {},
    canonicalInput = {},
    eligibility = {},
    validation = {},
    rawText = "",
    parseResult = {}
  } = {}) {
    const ready =
      validation.valid === true &&
      Boolean(realization.responseText);

    return {
      schema:
        "ari_response_realization_packet",

      schemaVersion:
        this.schemaVersion,

      ready,

      usable:
        validation.usable === true,

      complete:
        validation.complete === true,

      source:
        this.source,

      version:
        this.version,

      mode:
        eligibility.mode ||
        "primary_response_realization",

      reason:
        validation.reason ||
        (
          ready
            ? "response_realization_ready"
            : "response_realization_not_ready"
        ),

      request: {
        turnId:
          canonicalInput.request.turnId,

        originalText:
          canonicalInput.request.originalText,

        resolvedText:
          canonicalInput.request.resolvedText
      },

      responseText:
        realization.responseText,

      responseStrategy:
        realization.responseStrategy,

      suggestedEmoji:
        realization.suggestedEmoji,

      emojiPlacement:
        realization.emojiPlacement,

      composerInstructions:
        realization.composerInstructions,

      fulfillment:
        realization.fulfillment,

      communicationPreferences:
        canonicalInput
          .communicationPreferences,

      continuity: {
        used:
          canonicalInput.continuity
            .isContinuation === true ||
          canonicalInput.continuity
            .requiresPriorContext === true,

        isContinuation:
          canonicalInput.continuity
            .isContinuation === true,

        activeTopic:
          canonicalInput.continuity
            .activeTopic,

        recentTurnCount:
          canonicalInput.continuity
            .recentTurns.length
      },

      responseContract: {
        goal:
          canonicalInput.responseContract
            .goal,

        shape:
          canonicalInput.responseContract
            .shape,

        posture:
          canonicalInput.responseContract
            .posture,

        requiredMoveIds:
          canonicalInput.responseContract
            .requiredMoves
            .map(move => move.id),

        optionalMoveIds:
          canonicalInput.responseContract
            .optionalMoves
            .map(move => move.id)
      },

      validation,

      diagnostics: {
        modelInvoked: true,

        rawModelAvailable:
          Boolean(rawText),

        structured:
          realization.structured === true,

        parseSucceeded:
          parseResult.succeeded === true,

        parseMode:
          parseResult.mode ||
          null,

        parseError:
          parseResult.error ||
          null,

        responseLength:
          realization.responseText.length,

        sentenceCount:
          validation.sentenceCount ||
          0,

        wordCount:
          validation.wordCount ||
          0,

        paragraphCount:
          validation.paragraphCount ||
          0,

        questionCount:
          validation.questionCount ||
          0,

        errors:
          validation.errors ||
          [],

        warnings:
          validation.warnings ||
          []
      },

      authority:
        this.getAuthorityBoundaries()
    };
  },

  /* =====================================================
     RETURN RESULT
  ===================================================== */

  returnResult({
    ran = false,
    ready = false,
    usable = false,
    reason = "response_realization_result",
    mode = null,
    packet = null,
    canonicalInput = null,
    eligibility = null,
    instruction = null,
    rawText = "",
    parseResult = null,
    validation = null,
    error = null
  } = {}) {
    const result = {
      schema:
        "ari_response_realization_result",

      schemaVersion:
        this.schemaVersion,

      realizationRan:
        ran === true,

      realizationReady:
        ready === true,

      realizationUsable:
        usable === true,

      realizationMode:
        mode,

      realizationPacket:
        packet,

      responseText:
        packet?.responseText ||
        "",

      suggestedEmoji:
        packet?.suggestedEmoji ||
        "",

      emojiPlacement:
        packet?.emojiPlacement ||
        "none",

      source:
        this.source,

      reason,

      eligibility,

      validation,

      diagnostics: {
        ran:
          ran === true,

        ready:
          ready === true,

        usable:
          usable === true,

        mode,

        reason,

        rawModelAvailable:
          Boolean(rawText),

        parseSucceeded:
          parseResult
            ?.succeeded === true,

        parseMode:
          parseResult?.mode ||
          null,

        error:
          error?.message ||
          (
            error
              ? String(error)
              : null
          )
      },

      authority:
        this.getAuthorityBoundaries()
    };

    if (canonicalInput) {
      result.canonicalInput =
        canonicalInput;
    }

    if (
      window.Ari
        ?.developmentMode === true
    ) {
      result.developmentDiagnostics = {
        instruction,
        rawText,
        parseResult
      };
    }

    window.Ari
      .responseRealizationState =
      result;

    return result;
  },

  /* =====================================================
     LOCKED RESPONSE HELPERS
  ===================================================== */

  readLockedResponse(summary = {}) {
    const locked =
      summary.developerResponseLocked === true ||
      summary.responseLocked === true;

    if (!locked) {
      return "";
    }

    return this.extractText(
      summary.finalResponse ||
      summary.developerHandoff
        ?.reply ||
      summary.developerHandoff
        ?.finalResponse ||
      summary.developerReply ||
      summary.developerResponse
    );
  },

  readSafetyLockedResponse(summary = {}) {
    return this.extractText(
      summary.safetyLockedResponse ||
      summary.safetyDisposition
        ?.lockedResponse ||
      summary.deepSafetyResult
        ?.lockedResponse ||
      ""
    );
  },

  /* =====================================================
     CONTENT VALIDATION
  ===================================================== */

  containsInvalidValue(text = "") {
    return /\b(?:undefined|null|\[object object\])\b/i
      .test(String(text || ""));
  },

  containsInternalLanguage(text = "") {
    const normalized =
      this.normalizeText(text);

    const phrases = [
      "canonical response plan",
      "response contract",
      "composer packet",
      "realization packet",
      "response realization engine",
      "pipeline diagnostic",
      "pipeline stage",
      "according to the packet",
      "according to the response plan"
    ];

    return phrases.some(
      phrase =>
        normalized.includes(phrase)
    );
  },

  containsWriterFailureMessage(text = "") {
    const normalized =
      this.normalizeText(text);

    const phrases = [
      "the ai draft was unavailable",
      "no usable response candidate",
      "composer packet missing",
      "the response generator failed",
      "i cannot generate the response",
      "i can't generate the response",
      "i do not have enough reliable information",
      "i don't have enough reliable information",
      "i do not have a reliable answer ready",
      "i don't have a reliable answer ready",
      "rather be honest than make something up"
    ];

    return phrases.some(
      phrase =>
        normalized.includes(phrase)
    );
  },

  /* =====================================================
     QUESTION DETECTION
  ===================================================== */

  countUserDirectedQuestions(value = "") {
    return this
      .splitSentences(value)
      .filter(
        sentence =>
          this.isUserDirectedQuestion(
            sentence
          )
      )
      .length;
  },

  isUserDirectedQuestion(sentence = "") {
    const value =
      this.cleanText(sentence);

    if (
      !value ||
      !value.includes("?")
    ) {
      return false;
    }

    if (
      /["“'][^"”']*\?[^"”']*["”']/u
        .test(value)
    ) {
      return false;
    }

    const normalized =
      this.normalizeText(value);

    return (
      /^(?:so\s+)?(?:do|did|are|were|have|has|can|could|would|will|should|what|why|how|where|when|who|which)\b/
        .test(normalized) ||
      /\b(?:do you|did you|are you|were you|have you|can you|could you|would you|will you|what do you|what did you|how do you|how are you|why do you|where do you|when do you|would you like|do you want|want me to)\b/
        .test(normalized)
    );
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canUseOpenAI: true,
      canUseGeneralModelKnowledge: true,
      canUseCanonicalReasoning: true,
      canUseResolvedContinuity: true,
      canUseRecentConversationTurns: true,
      canUseAuthorizedMemory: true,
      canUseAuthorizedDeveloperContext: true,
      canUseCharacterGuidance: true,
      canUseLanguageGuidance: true,
      canUseCommunicationPreferences: true,
      canChooseResponseApproach: true,
      canProduceCompleteResponseText: true,
      canSuggestEmoji: true,
      canRecommendComposerInstructions: true,
      canReinterpretCanonicalMeaning: false,
      canChangeResponseGoal: false,
      canChangeSafetyDisposition: false,
      canInventMemory: false,
      canClaimExternalVerification: false,
      canExecuteActions: false,
      canComposeFinalResponse: false,
      canDeliverResponse: false,
      canPersistState: false,
      role:
        "primary_openai_response_realization"
    };
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  formatInstructionList(
    values = [],
    fallback = ""
  ) {
    const items =
      this.toStringArray(values);

    if (!items.length) {
      return `- ${fallback}`;
    }

    return items
      .map(item => `- ${item}`)
      .join("\n");
  },

  mergeInstructionText(...values) {
    const output = [];
    const seen =
      new Set();

    values
      .flatMap(value => this.toArray(value))
      .forEach(value => {
        const text =
          this.extractInstructionText(value);

        const key =
          this.normalizeText(text);

        if (
          !key ||
          seen.has(key)
        ) {
          return;
        }

        seen.add(key);
        output.push(text);
      });

    return output;
  },

  extractInstructionText(value = null) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      return this.cleanText(value);
    }

    if (typeof value === "object") {
      return this.cleanText(
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

  extractText(value = null) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (typeof value === "string") {
      return this.cleanText(value);
    }

    if (
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value).trim();
    }

    if (typeof value === "object") {
      return this.extractText(
        value.text ||
        value.finalResponse ||
        value.responseText ||
        value.languageBody ||
        value.response ||
        value.reply ||
        value.content ||
        value.draft ||
        ""
      );
    }

    return "";
  },

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

      const number =
        Number(value);

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
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  toStringArray(value) {
    return this.toArray(value)
      .map(
        item =>
          this.extractInstructionText(item)
      )
      .filter(Boolean);
  },

  toIdentifierArray(value) {
    return this.toArray(value)
      .map(item =>
        this.normalizeIdentifier(
          typeof item === "object"
            ? item.id ||
              item.name ||
              item.type ||
              item.value ||
              ""
            : item
        )
      )
      .filter(Boolean);
  },

  uniqueValues(values = []) {
    const output = [];
    const seen =
      new Set();

    this.toArray(values)
      .forEach(value => {
        const key =
          typeof value === "string"
            ? value
            : this.safeJSONStringify(
                value
              );

        if (
          !key ||
          seen.has(key)
        ) {
          return;
        }

        seen.add(key);
        output.push(value);
      });

    return output;
  },

  safeJSONStringify(value = null) {
    const seen =
      new WeakSet();

    try {
      return JSON.stringify(
        value,
        (key, nestedValue) => {
          if (
            nestedValue &&
            typeof nestedValue === "object"
          ) {
            if (
              seen.has(nestedValue)
            ) {
              return "[Circular]";
            }

            seen.add(nestedValue);
          }

          return nestedValue;
        },
        2
      );
    } catch (error) {
      return JSON.stringify({
        available: false,
        reason:
          "serialization_failed"
      });
    }
  },

  cleanText(value = "") {
    return String(value ?? "")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },

  normalizeText(value = "") {
    return this.cleanText(value)
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s']/g, " ")
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
    const text =
      this.cleanText(value);

    if (!text) {
      return [];
    }

    return text
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(Boolean);
  },

  countWords(value = "") {
    return String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .length;
  },

  countParagraphs(value = "") {
    const text =
      String(value || "").trim();

    if (!text) {
      return 0;
    }

    return text
      .split(/\n{2,}/)
      .map(
        paragraph =>
          paragraph.trim()
      )
      .filter(Boolean)
      .length;
  }
};

window.Ari.responseRealizationEngine =
  window.AriResponseRealizationEngine;

console.log(
  "ARI RESPONSE REALIZATION ENGINE LOADED:",
  window.AriResponseRealizationEngine
    ?.version
);
