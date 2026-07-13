// ari/language/ari-composer-bridge.js
// Ari Composer Bridge
//
// Purpose:
// Build one canonical Composer Packet from the completed deliberation,
// response-planning, character, language-guidance, knowledge, continuity,
// safety, and developer handoffs.
//
// V2.0.0 — Canonical Response Plan Integration / Structured Writer Contract
//
// Architectural flow:
//
// Deliberation Packet
//      ↓
// Canonical Response Plan
//      ↓
// Response Strategy
//      ↓
// Character + Language Guidance
//      ↓
// Composer Packet
//      ↓
// Blueprint Writer / AI Writer / Candidate Arbiter
//
// Critical rules:
//
// 1. The original current-turn text remains authoritative.
// 2. The canonical Response Plan controls response moves and writer policy.
// 3. The bridge may normalize and package instructions, but may not invent
//    a new response strategy.
// 4. Continuity context remains structured and does not rewrite the question.
// 5. Unlocked developer evidence may never replace normal conversation.
// 6. Stale developer or GitHub evidence is removed when the current request
//    is not developer-related.
// 7. Character context may influence voice and preferences, but cannot
//    override factual, safety, semantic, or planning authority.
// 8. The bridge does not write final user-facing language.
// 9. The bridge does not select the final response candidate.
// 10. Internal planner instructions must remain marked as non-user-facing.

window.Ari = window.Ari || {};

window.AriComposerBridge = {
  version: "2.0.0",
  schemaVersion: "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  build(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const request =
      this.buildRequest(summary);

    const responsePlan =
      this.resolveResponsePlan(summary);

    const responseStrategy =
      this.resolveResponseStrategy({
        summary,
        responsePlan
      });

    const developerContext =
      this.resolveDeveloperContext({
        summary,
        request,
        responsePlan,
        responseStrategy
      });

    const characterContext =
      this.resolveCharacterContext(summary);

    const continuityContext =
      this.resolveContinuityContext(summary);

    const safetyContext =
      this.resolveSafetyContext(summary);

    const knowledgeContext =
      this.resolveKnowledgeContext(summary);

    const languageContext =
      this.resolveLanguageContext(summary);

    const responseControl =
      this.buildResponseControl({
        summary,
        responsePlan,
        responseStrategy,
        developerContext,
        safetyContext,
        languageContext
      });

    const evidence =
      this.buildEvidence({
        summary,
        request,
        responsePlan,
        responseStrategy,
        developerContext,
        characterContext,
        continuityContext,
        safetyContext,
        knowledgeContext,
        languageContext
      });

    const packet =
      this.buildComposerPacket({
        summary,
        request,
        responsePlan,
        responseStrategy,
        responseControl,
        developerContext,
        characterContext,
        continuityContext,
        safetyContext,
        knowledgeContext,
        languageContext,
        evidence
      });

    return {
      composerPacketReady:
        packet.ready === true,

      composerPacket:
        packet,

      composerBridgeRan:
        true,

      composerBridgeSource:
        "ari-composer-bridge",

      composerBridgeVersion:
        this.version,

      composerBridgeSchemaVersion:
        this.schemaVersion,

      canonicalResponsePlanAvailable:
        responsePlan.available ===
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
          .shouldAskQuestion,

      composerWriterInstructions:
        responseControl
          .writerInstructions
    };
  },

  /* =====================================================
     REQUEST
  ===================================================== */

  buildRequest(summary = {}) {
    const originalText =
      this.cleanOriginal(
        summary.originalUserMessage ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    const continuityTurn =
      summary.continuityStagePacket
        ?.currentTurn ||
      summary.continuityCurrentTurn ||
      {};

    const resolvedTurn =
      summary.resolvedCurrentTurn ||
      summary.threadQuestion
        ?.resolvedCurrentTurn ||
      {};

    /*
     * Compatibility fields may still provide resolvedUserQuestion,
     * but the current architecture deliberately preserves the exact
     * original text.
     */
    const resolvedText =
      this.cleanOriginal(
        resolvedTurn.resolvedText ||
        continuityTurn.originalText ||
        summary.resolvedUserQuestion ||
        originalText
      ) ||
      originalText;

    const textWasRewritten =
      Boolean(
        resolvedTurn.textWasRewritten ===
          true ||
        continuityTurn.textWasRewritten ===
          true ||
        (
          resolvedText &&
          originalText &&
          resolvedText !==
            originalText
        )
      );

    return {
      schema:
        "ari_composer_request",

      schemaVersion:
        this.schemaVersion,

      originalText,

      currentText:
        originalText,

      resolvedText:
        textWasRewritten
          ? originalText
          : resolvedText,

      normalizedText:
        this.normalize(
          continuityTurn.normalizedText ||
          resolvedTurn.normalizedText ||
          summary.normalizedMessage ||
          originalText
        ),

      textWasRewritten:
        false,

      originalTextPreserved:
        true,

      currentTurnWasStructurallyResolved:
        resolvedTurn
          .semanticReferencesResolved ===
          true ||
        resolvedTurn
          .currentTurnWasResolved ===
          true ||
        summary.currentTurnWasResolved ===
          true,

      requiresPriorContext:
        continuityTurn
          .needsPriorContext ===
          true ||
        summary.continuityEligibility
          ?.eligible ===
          true ||
        summary.routingContract
          ?.contextLane ===
          "continuity_follow_up",

      contextLane:
        summary.contextLane ||
        summary.routingContract
          ?.contextLane ||
        summary.laneSplit
          ?.lane ||
        "direct_current_turn",

      authority:
        "original_current_turn_only"
    };
  },

  /* =====================================================
     CANONICAL RESPONSE PLAN
  ===================================================== */

  resolveResponsePlan(summary = {}) {
    const candidates = [
      summary.responsePlanningHandoff
        ?.responsePlan,

      summary.responsePlanningStagePacket
        ?.planner
        ?.value
        ?.responsePlan,

      summary.responsePlanningStagePacket
        ?.planner
        ?.value,

      summary.responseStrategy
        ?.responsePlan,

      summary.ariResponsePlan
        ?.responsePlan,

      summary.ariResponsePlan,

      summary.understandingResponsePlan
        ?.responsePlan,

      summary.understandingResponsePlan,

      summary.communicationPlan
        ?.responsePlan,

      summary.responsePlan
    ];

    const found =
      candidates.find(
        candidate =>
          candidate &&
          typeof candidate ===
            "object" &&
          !Array.isArray(candidate) &&
          (
            candidate.schema ===
              "ari_response_plan" ||
            candidate.responsePlannerRan ===
              true ||
            Array.isArray(
              candidate.responseMoves
            ) ||
            Array.isArray(
              candidate.moves
            ) ||
            candidate.writerInstructions ||
            candidate.responseGoal
          )
      ) ||
      null;

    if (!found) {
      return this.buildFallbackCanonicalPlan(
        summary
      );
    }

    const responseMoves =
      this.normalizeResponseMoves(
        found.responseMoves ||
        found.moves ||
        found.writerInstructions
          ?.moves
      );

    const requiredBehaviors =
      this.mergeUnique(
        found.requiredBehaviors,
        found.required,
        found.writerInstructions
          ?.required
      );

    const forbiddenBehaviors =
      this.mergeUnique(
        found.forbiddenBehaviors,
        found.avoid,
        found.writerInstructions
          ?.avoid
      );

    const constraints =
      this.mergeUnique(
        found.constraints,
        found.responseConstraints
      );

    const responseRules =
      this.mergeUnique(
        found.responseRules,
        found.rules
      );

    const shouldAskQuestion =
      found.shouldAskQuestion ===
        true ||
      found.questionPolicy
        ?.shouldAskQuestion ===
        true;

    const questionPurpose =
      found.questionPurpose ||
      found.questionPolicy
        ?.purpose ||
      null;

    const writerInstructions =
      this.normalizeWriterInstructions({
        summary,
        responsePlan:
          found,

        responseMoves,
        requiredBehaviors,
        forbiddenBehaviors,
        constraints,
        responseRules,
        shouldAskQuestion,
        questionPurpose
      });

    return {
      schema:
        "ari_response_plan",

      schemaVersion:
        found.schemaVersion ||
        this.schemaVersion,

      available:
        true,

      ready:
        found.ready !==
        false,

      usable:
        found.usable !==
        false,

      source:
        found.source ||
        found
          .responsePlannerSource ||
        "ari-response-planner",

      version:
        found.version ||
        found
          .responsePlannerVersion ||
        null,

      responseGoal:
        found.responseGoal ||
        found.goal ||
        "answer_user",

      responseShape:
        found.responseShape ||
        writerInstructions.shape ||
        "clear_explanation",

      responsePosture:
        found.responsePosture ||
        writerInstructions.posture ||
        null,

      currentNeed:
        found.currentNeed ||
        null,

      adviceRequested:
        found.adviceRequested ===
        true,

      advicePolicy:
        found.advicePolicy ||
        "allowed_if_useful",

      coachingPermissionRequired:
        found
          .coachingPermissionRequired ===
        true,

      shouldAskQuestion,

      questionPurpose,

      responseMoves,

      responseOrder:
        this.mergeUnique(
          found.responseOrder,
          found.order,
          responseMoves.map(
            move =>
              move.id
          )
        ),

      requiredBehaviors,

      forbiddenBehaviors,

      constraints,

      responseRules,

      blueprintHint:
        found.blueprintHint ||
        found.blueprintId ||
        found.expressionPlan
          ?.blueprintId ||
        null,

      writerInstructions,

      communicationPlan:
        found.communicationPlan ||
        null,

      composerDirective:
        found.composerDirective ||
        null,

      confidence:
        this.normalizeConfidence(
          found.confidence ??
          0.5
        ),

      raw:
        found,

      authority: {
        canDefineResponseGoal:
          true,

        canDefineResponseShape:
          true,

        canDefineResponseMoves:
          true,

        canDefineAdvicePolicy:
          true,

        canDefineQuestionPolicy:
          true,

        canDefineWriterInstructions:
          true,

        canWriteFinalLanguage:
          false,

        canSelectFinalDraft:
          false,

        role:
          "canonical_response_plan"
      }
    };
  },

  buildFallbackCanonicalPlan(
    summary = {}
  ) {
    const safetyOverride =
      summary.safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      summary
        .safetyShouldStopNormalResponse ===
        true;

    const primary =
      summary.primaryLane ||
      summary.routingContract
        ?.primaryLane ||
      summary.triage
        ?.primaryLane ||
      "general_understanding";

    const responseGoal =
      safetyOverride
        ? "address_immediate_safety"
        : summary.responseGoal ||
          "answer_user";

    const responseShape =
      safetyOverride
        ? "urgent_short_direct"
        : summary.responseShape ||
          "clear_explanation";

    const responseMoves =
      safetyOverride
        ? this.normalizeResponseMoves([
            "pause_and_prioritize_safety",
            "give_direct_safety_step",
            "urge_trusted_or_emergency_support"
          ])
        : this.normalizeResponseMoves([
            "answer_directly",
            "brief_explanation"
          ]);

    return {
      schema:
        "ari_response_plan",

      schemaVersion:
        this.schemaVersion,

      available:
        false,

      ready:
        true,

      usable:
        true,

      source:
        "ari-composer-bridge-fallback",

      version:
        this.version,

      responseGoal,

      responseShape,

      responsePosture:
        safetyOverride
          ? "calm_direct"
          : "natural_direct",

      currentNeed:
        safetyOverride
          ? "immediate_safety"
          : primary,

      adviceRequested:
        false,

      advicePolicy:
        safetyOverride
          ? "safety_first"
          : "allowed_if_useful",

      coachingPermissionRequired:
        false,

      shouldAskQuestion:
        false,

      questionPurpose:
        null,

      responseMoves,

      responseOrder:
        responseMoves.map(
          move =>
            move.id
        ),

      requiredBehaviors:
        this.mergeUnique(
          summary.responseRequired,
          safetyOverride
            ? [
                "prioritize_immediate_safety",
                "be_direct"
              ]
            : [
                "answer_current_request"
              ]
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          summary.responseAvoid,
          safetyOverride
            ? [
                "casual_tone",
                "delay"
              ]
            : []
        ),

      constraints:
        this.toArray(
          summary.responseConstraints
        ),

      responseRules:
        this.toArray(
          summary.responseRules
        ),

      blueprintHint:
        safetyOverride
          ? "safety_urgent_support"
          : null,

      writerInstructions:
        this.normalizeWriterInstructions({
          summary,

          responsePlan: {
            responseShape,
            responsePosture:
              safetyOverride
                ? "calm_direct"
                : "natural_direct"
          },

          responseMoves,

          requiredBehaviors:
            summary.responseRequired ||
            [],

          forbiddenBehaviors:
            summary.responseAvoid ||
            [],

          constraints:
            summary.responseConstraints ||
            [],

          responseRules:
            summary.responseRules ||
            [],

          shouldAskQuestion:
            false,

          questionPurpose:
            null
        }),

      communicationPlan:
        summary.communicationPlan ||
        null,

      composerDirective:
        summary.composerDirective ||
        null,

      confidence:
        0.35,

      raw:
        null,

      authority: {
        canDefineFallbackWriterContract:
          true,

        canInterpretMeaning:
          false,

        canWriteFinalLanguage:
          false,

        role:
          "compatibility_response_plan_fallback"
      }
    };
  },

  normalizeResponseMoves(
    moves = []
  ) {
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
                this.normalizeIdentifier(
                  move
                ),

              order:
                index,

              type:
                "response_move",

              required:
                true,

              userFacing:
                true,

              renderPolicy:
                "render_or_ai_repair",

              source:
                "response_plan"
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
                Number(move.order)
              )
                ? Number(move.order)
                : index,

            type:
              move.type ||
              "response_move",

            purpose:
              move.purpose ||
              null,

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
              "response_plan",

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

  normalizeWriterInstructions({
    summary = {},
    responsePlan = {},
    responseMoves = [],
    requiredBehaviors = [],
    forbiddenBehaviors = [],
    constraints = [],
    responseRules = [],
    shouldAskQuestion = false,
    questionPurpose = null
  } = {}) {
    const instructions =
      responsePlan.writerInstructions ||
      {};

    const communicationBudget =
      summary.communicationPlan
        ?.languageBudget ||
      summary.communicationLanguageBudget ||
      {};

    const maxSentences =
      this.firstFiniteNumber([
        instructions.maxSentences,
        communicationBudget.maxSentences,
        4
      ]);

    const maxWords =
      this.firstFiniteNumber([
        instructions.maxWords,
        communicationBudget.maxWords,
        null
      ]);

    return {
      schema:
        "ari_writer_instructions",

      schemaVersion:
        this.schemaVersion,

      posture:
        instructions.posture ||
        responsePlan.responsePosture ||
        null,

      shape:
        instructions.shape ||
        responsePlan.responseShape ||
        "clear_explanation",

      responseMoves,

      requiredBehaviors:
        this.mergeUnique(
          requiredBehaviors,
          instructions.required
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          forbiddenBehaviors,
          instructions.avoid
        ),

      constraints:
        this.mergeUnique(
          constraints,
          instructions.constraints
        ),

      responseRules:
        this.mergeUnique(
          responseRules,
          instructions.rules
        ),

      maxSentences,

      maxWords,

      minimumSentences:
        this.firstFiniteNumber([
          instructions.minimumSentences,
          null
        ]),

      finalQuestionAllowed:
        instructions
          .finalQuestionAllowed ===
          true ||
        shouldAskQuestion,

      questionRequired:
        shouldAskQuestion,

      questionPurpose,

      answerFirst:
        instructions.answerFirst !==
          false,

      useConcreteTerms:
        instructions.useConcreteTerms !==
          false,

      preserveMoveOrder:
        true,

      internalInstructionsAreNotUserFacing:
        true,

      doNotRenderInstructionText:
        true,

      unsupportedMovePolicy:
        "request_ai_repair",

      incompletePlanPolicy:
        "request_ai_repair",

      emptyDraftPolicy:
        "request_ai_repair",

      factualClaimPolicy:
        "require_evidence_or_explicit_uncertainty",

      doNotWrite:
        this.mergeUnique(
          instructions.doNotWrite,
          [
            "internal planner instructions",
            "meta commentary about answering",
            "unsupported factual certainty",
            "stale developer evidence",
            "pipeline diagnostics unless requested"
          ]
        ),

      authority:
        "writer_instruction_contract_only"
    };
  },

  /* =====================================================
     RESPONSE STRATEGY
  ===================================================== */

  resolveResponseStrategy({
    summary = {},
    responsePlan = {}
  } = {}) {
    const strategy =
      summary.responsePlanningHandoff
        ?.responseStrategy ||
      summary.responsePlanningStagePacket
        ?.strategy ||
      summary.responseStrategy ||
      {};

    const routing =
      summary.routingContract ||
      {};

    return {
      ready:
        strategy.ready !==
        false,

      source:
        strategy.source ||
        responsePlan.source ||
        "ari-composer-bridge",

      responseGoal:
        responsePlan.responseGoal ||
        strategy.responseGoal ||
        summary.responseGoal ||
        "answer_user",

      responseShape:
        responsePlan.responseShape ||
        strategy.responseShape ||
        summary.responseShape ||
        "clear_explanation",

      responseOrder:
        this.mergeUnique(
          responsePlan.responseOrder,
          strategy.responseOrder,
          summary.responseOrder
        ),

      primaryLane:
        strategy.primaryLane ||
        summary.primaryLane ||
        routing.primaryLane ||
        null,

      contextLane:
        strategy.contextLane ||
        summary.contextLane ||
        routing.contextLane ||
        null,

      planner:
        strategy.planner ||
        routing.planner ||
        summary.selectedPlanner ||
        null,

      mode:
        strategy.mode ||
        routing.mode ||
        summary.conversationMode ||
        "unknown",

      intent:
        strategy.intent ||
        routing.primaryIntent ||
        summary.primaryIntent ||
        "unknown",

      domain:
        strategy.domain ||
        routing.domain ||
        summary.conversationDomain ||
        "general",

      requiredBehaviors:
        this.mergeUnique(
          responsePlan
            .requiredBehaviors,
          strategy
            .requiredBehaviors,
          summary.responseRequired
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          responsePlan
            .forbiddenBehaviors,
          strategy
            .forbiddenBehaviors,
          summary.responseAvoid
        ),

      constraints:
        this.mergeUnique(
          responsePlan.constraints,
          strategy.constraints,
          summary.responseConstraints
        ),

      rules:
        this.mergeUnique(
          responsePlan.responseRules,
          strategy.rules,
          summary.responseRules
        ),

      communicationNeeds:
        this.mergeUnique(
          strategy.communicationNeeds,
          summary.understandingHandoff
            ?.communicationNeeds
        ),

      communicationPlan:
        responsePlan
          .communicationPlan ||
        strategy.communicationPlan ||
        summary.communicationPlan ||
        null,

      composerDirective:
        responsePlan
          .composerDirective ||
        strategy.composerDirective ||
        summary.composerDirective ||
        null,

      personalization:
        strategy.personalization ||
        {
          allowed:
            true,

          shouldMentionMemory:
            false,

          facts: []
        },

      confidence:
        this.normalizeConfidence(
          responsePlan.confidence ??
          strategy.confidence ??
          summary.routingConfidence ??
          0.5
        ),

      raw:
        strategy,

      authority: {
        canDescribeResponseStrategy:
          true,

        canOverrideCanonicalResponsePlan:
          false,

        canWriteFinalLanguage:
          false,

        role:
          "normalized_response_strategy_handoff"
      }
    };
  },

  /* =====================================================
     DEVELOPER CONTEXT
  ===================================================== */

  resolveDeveloperContext({
    summary = {},
    request = {},
    responsePlan = {},
    responseStrategy = {}
  } = {}) {
    const rawPacket =
      summary.composerDeveloperPacket
        ?.enabled ===
        true
        ? summary.composerDeveloperPacket
        : null;

    const responseLocked =
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
      responseLocked ||
      relevant;

    const packet =
      allowed
        ? rawPacket
        : null;

    const lockedReply =
      responseLocked
        ? (
            rawPacket?.reply ||
            rawPacket?.finalResponse ||
            summary.developerHandoff
              ?.reply ||
            summary.developerHandoff
              ?.finalResponse ||
            summary.developerReply ||
            summary.developerResponse ||
            null
          )
        : null;

    return {
      applicable:
        relevant,

      relevant,

      allowed,

      locked:
        responseLocked,

      advisory:
        Boolean(
          packet &&
          !responseLocked
        ),

      packet,

      lockedReply,

      githubEvidenceAllowed:
        allowed,

      codeEvidenceAllowed:
        allowed,

      staleEvidenceSuppressed:
        !allowed,

      reason:
        responseLocked
          ? "developer_response_locked"
          : relevant
            ? "current_request_is_developer_related"
            : "developer_context_not_relevant_to_current_request",

      authority: {
        lockedReplyMayBeFinal:
          responseLocked,

        advisoryPacketMayBeFinal:
          false,

        staleEvidenceMayBeUsed:
          false,

        role:
          "developer_evidence_access_policy"
      }
    };
  },

  isDeveloperRelevant({
    summary = {},
    request = {},
    responsePlan = {},
    responseStrategy = {}
  } = {}) {
    const text =
      this.normalize(
        request.originalText ||
        ""
      );

    const primary =
      this.normalizeIdentifier(
        responseStrategy.primaryLane ||
        summary.primaryLane ||
        summary.situationContractPrimary ||
        summary.situationContract
          ?.primary ||
        ""
      );

    const mode =
      this.normalizeIdentifier(
        responseStrategy.mode ||
        summary.routingContract
          ?.mode ||
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
      /\b[\w./-]+\.(?:js|mjs|cjs|html|css|json|md|ts|tsx|jsx|sql|py|yml|yaml)\b/i.test(
        request.originalText ||
        ""
      );

    const developerEntities =
      /\b(?:github|repo|repository|branch|commit|pull request|merge|deploy|vercel|supabase|codebase|api|pipeline|engine|composer|function|script|selector|markup|schema|debug|latency|runtime)\b/i.test(
        text
      );

    const developerActions =
      /\b(?:read|open|show|search|find|inspect|diagnose|debug|fix|patch|edit|update|change|replace|remove|rewrite|build|implement|wire|refactor|optimize|test|validate|send|generate)\b/i.test(
        text
      );

    const developerAuthority =
      [
        "developer",
        "builder",
        "coding",
        "project_help",
        "developer_artifact"
      ].includes(primary) ||
      [
        "developer",
        "builder"
      ].includes(mode) ||
      intent.includes(
        "developer"
      ) ||
      intent.includes(
        "build_or_debug"
      ) ||
      blueprint.includes(
        "builder"
      ) ||
      summary.shouldRunDeveloperLayer ===
        true;

    return Boolean(
      developerAuthority ||
      explicitFile ||
      (
        developerEntities &&
        developerActions
      )
    );
  },

  /* =====================================================
     CHARACTER
  ===================================================== */

  resolveCharacterContext(
    summary = {}
  ) {
    const character =
      summary.composerCharacter ||
      summary.characterHandoff ||
      summary.characterExpression
        ?.composerCharacter ||
      summary.characterExpression
        ?.composerCharacterPacket ||
      null;

    const identity =
      summary.characterIdentity ||
      summary.assembledContext
        ?.characterIdentity ||
      summary.advisoryContext
        ?.characterIdentity ||
      summary.continuityContext
        ?.characterIdentity ||
      {
        source:
          "ari-composer-bridge",

        authority:
          "character_advisory_only",

        stablePreferences:
          character
            ?.stablePreferences ||
          character
            ?.preferences
            ?.stablePreferences ||
          character
            ?.reasoning
            ?.expression
            ?.composerCharacter
            ?.stablePreferences ||
          {},

        preferences:
          character
            ?.preferences ||
          character
            ?.reasoning
            ?.expression
            ?.composerCharacter
            ?.preferences ||
          {},

        reasoning:
          character?.reasoning ||
          null,

        useAllowed:
          character?.enabled ===
          true,

        focus:
          character?.focus ||
          character
            ?.reasoning
            ?.focus ||
          null,

        mode:
          character?.mode ||
          null
      };

    return {
      available:
        Boolean(
          character ||
          identity
        ),

      character,

      identity,

      stablePreferences:
        identity.stablePreferences ||
        identity.preferences
          ?.stablePreferences ||
        character
          ?.stablePreferences ||
        character
          ?.preferences
          ?.stablePreferences ||
        {},

      preferences:
        identity.preferences ||
        character?.preferences ||
        {},

      useAllowed:
        identity.useAllowed !==
          false &&
        character?.enabled !==
          false,

      authority:
        "character_voice_and_preference_advisory_only"
    };
  },

  /* =====================================================
     CONTINUITY
  ===================================================== */

  resolveContinuityContext(
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
      null;

    const context =
      stagePacket
        ?.contextAssembler
        ?.continuityContext ||
      summary.continuityContext ||
      summary.assembledContext ||
      null;

    const binding =
      stagePacket
        ?.referenceResolution
        ?.binding ||
      summary
        .continuityReferenceBinding ||
      null;

    const facts =
      this.toArray(
        packet?.usableFacts ||
        stagePacket
          ?.continuityPacket
          ?.usableFacts ||
        summary.continuityUsableFacts
      );

    const resolvedReferences =
      this.toArray(
        packet
          ?.referenceResolution
          ?.resolvedReferences ||
        packet?.resolvedReferences ||
        stagePacket
          ?.referenceResolution
          ?.resolvedReferences ||
        summary
          .continuityResolvedReferences
      );

    const unresolvedReferences =
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

    return {
      available:
        Boolean(
          stagePacket ||
          packet ||
          context
        ),

      required:
        stagePacket
          ?.quality
          ?.continuityRequired ===
          true ||
        summary
          .continuityEligibility
          ?.eligible ===
          true,

      stagePacket,

      packet,

      context,

      activeDialogueState:
        summary.activeDialogueState ||
        stagePacket
          ?.contextAssembler
          ?.activeDialogueState ||
        summary.assembledContext
          ?.activeDialogueState ||
        summary.advisoryContext
          ?.activeDialogueState ||
        summary.continuityContext
          ?.activeDialogueState ||
        null,

      binding,

      facts,

      resolvedReferences,

      unresolvedReferences,

      referenceClarificationRequired:
        unresolvedReferences.length >
        0,

      currentTurnTextPreserved:
        stagePacket
          ?.currentTurn
          ?.textWasRewritten !==
        true,

      authority:
        "structured_continuity_context_only"
    };
  },

  /* =====================================================
     SAFETY
  ===================================================== */

  resolveSafetyContext(
    summary = {}
  ) {
    const stagePacket =
      summary.safetyStagePacket ||
      null;

    const disposition =
      summary.safetyDisposition ||
      stagePacket?.disposition ||
      {};

    const applicable =
      summary.safetyApplicable ===
        true ||
      disposition.applicable ===
        true ||
      disposition.riskLevel &&
      disposition.riskLevel !==
        "none";

    const shouldStopNormalResponse =
      summary
        .safetyShouldStopNormalResponse ===
        true ||
      disposition
        .shouldStopNormalResponse ===
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
          true,

      riskLevel:
        summary
          .resolvedSafetyRiskLevel ||
        disposition.riskLevel ||
        "none",

      riskType:
        summary
          .resolvedSafetyRiskType ||
        disposition.riskType ||
        "none",

      authority:
        summary
          .resolvedSafetyAuthority ||
        disposition.safetyAuthority ||
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
          disposition.requiredBehaviors,
          stagePacket
            ?.responseControl
            ?.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          disposition.forbiddenBehaviors,
          stagePacket
            ?.responseControl
            ?.forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          disposition.constraints,
          stagePacket
            ?.responseControl
            ?.constraints
        ),

      contract:
        summary.safetyResponseContract ||
        stagePacket?.contract ||
        null,

      gate:
        summary.safetyContextGate ||
        null,

      deepReview:
        summary.deepSafetyResult ||
        null,

      disposition,

      stagePacket,

      authorityBoundary:
        "safety_governance_is_authoritative"
    };
  },

  /* =====================================================
     KNOWLEDGE
  ===================================================== */

  resolveKnowledgeContext(
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
        summary.shouldUseKnowledge ===
        true,

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
        summary
          .knowledgeSynthesis
          ?.blueprintHandoff ||
        null,

      retrievalPlan:
        summary.knowledgeRetrievalPlan ||
        null,

      retrievalResults,

      authority:
        "retrieved_knowledge_evidence_only"
    };
  },

  /* =====================================================
     LANGUAGE CONTEXT
  ===================================================== */

  resolveLanguageContext(
    summary = {}
  ) {
    const communicationPlan =
      summary.communicationPlan ||
      {};

    const profile =
      summary.humanLanguageProfile ||
      {};

    const guidance =
      summary.languageGuidanceHandoff ||
      {};

    const mouth =
      summary.mouthDirector ||
      {};

    return {
      communicationPlan,

      humanLanguageProfile:
        profile,

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
        summary.lexicalGroundingOutput ||
        null,

      preferredTerms:
        summary.preferredTerms ||
        summary.lexicalGrounding
          ?.preferredTerms ||
        summary.lexicalGroundingOutput
          ?.preferredTerms ||
        {},

      blueprintHint:
        summary.blueprintHint ||
        mouth.blueprintHint ||
        null,

      responseAvoid:
        this.mergeUnique(
          summary.responseAvoid,
          mouth.responseAvoid,
          guidance.forbiddenBehaviors
        ),

      responseRequired:
        this.mergeUnique(
          summary.responseRequired,
          mouth.responseRequired,
          guidance.requiredBehaviors
        ),

      authority:
        "language_and_expression_guidance_only"
    };
  },

  /* =====================================================
     RESPONSE CONTROL
  ===================================================== */

  buildResponseControl({
    summary = {},
    responsePlan = {},
    responseStrategy = {},
    developerContext = {},
    safetyContext = {},
    languageContext = {}
  } = {}) {
    const developerLocked =
      developerContext.locked ===
      true;

    const safetyOverride =
      safetyContext
        .shouldStopNormalResponse ===
      true;

    const responseMoves =
      safetyOverride
        ? this.ensureSafetyMoves(
            responsePlan.responseMoves
          )
        : responsePlan.responseMoves;

    const requiredBehaviors =
      developerLocked
        ? this.mergeUnique(
            [
              "use_locked_developer_reply_only",
              "do_not_invent_code"
            ],
            responsePlan
              .requiredBehaviors,
            responseStrategy
              .requiredBehaviors
          )
        : this.mergeUnique(
            [
              "answer_the_current_request",
              "preserve_current_turn_meaning",
              "follow_canonical_response_plan",
              "do_not_render_internal_instructions"
            ],
            responsePlan
              .requiredBehaviors,
            responseStrategy
              .requiredBehaviors,
            safetyContext
              .requiredBehaviors,
            languageContext
              .responseRequired
          );

    const forbiddenBehaviors =
      developerLocked
        ? this.mergeUnique(
            [
              "ignore_locked_developer_reply",
              "invent_code"
            ],
            responsePlan
              .forbiddenBehaviors,
            responseStrategy
              .forbiddenBehaviors
          )
        : this.mergeUnique(
            [
              "render_internal_planner_language",
              "replace_normal_conversation_with_developer_templates",
              "use_stale_github_evidence",
              "dump_pipeline_json_unless_requested",
              "rewrite_the_user_question",
              "change_the_requested_operation"
            ],
            responsePlan
              .forbiddenBehaviors,
            responseStrategy
              .forbiddenBehaviors,
            safetyContext
              .forbiddenBehaviors,
            languageContext
              .responseAvoid
          );

    const constraints =
      this.mergeUnique(
        responsePlan.constraints,
        responseStrategy.constraints,
        safetyContext.constraints,
        summary.responseConstraints
      );

    const rules =
      this.mergeUnique(
        responsePlan.responseRules,
        responseStrategy.rules,
        summary.responseRules
      );

    const blueprintHint =
      developerLocked
        ? "developer_locked_response"
        : safetyOverride
          ? (
              safetyContext
                .requiredPlanner ||
              "safety_urgent_support"
            )
          : responsePlan
              .blueprintHint ||
            languageContext
              .blueprintHint ||
            null;

    const shouldAskQuestion =
      safetyOverride
        ? safetyContext
            .requiresClarification ===
          true
        : responsePlan
            .shouldAskQuestion ===
          true;

    const writerInstructions = {
      ...responsePlan
        .writerInstructions,

      responseMoves,

      requiredBehaviors,

      forbiddenBehaviors,

      constraints,

      responseRules:
        rules,

      finalQuestionAllowed:
        shouldAskQuestion,

      questionRequired:
        shouldAskQuestion,

      questionPurpose:
        shouldAskQuestion
          ? responsePlan
              .questionPurpose ||
            (
              safetyContext
                .requiresClarification
                ? "safety_clarification"
                : "response_plan_question"
            )
          : null,

      doNotRenderInstructionText:
        true,

      internalInstructionsAreNotUserFacing:
        true
    };

    return {
      responseGoal:
        safetyOverride
          ? "address_immediate_safety"
          : responsePlan.responseGoal ||
            responseStrategy.responseGoal ||
            "answer_user",

      responseShape:
        developerLocked
          ? "developer_direct_answer"
          : safetyOverride
            ? "urgent_short_direct"
            : responsePlan.responseShape ||
              responseStrategy.responseShape ||
              "clear_explanation",

      responsePosture:
        safetyOverride
          ? safetyContext
              .communicationStyle ||
            "calm_direct"
          : responsePlan
              .responsePosture ||
            null,

      responseOrder:
        this.mergeUnique(
          responsePlan.responseOrder,
          responseStrategy.responseOrder,
          responseMoves.map(
            move =>
              move.id
          )
        ),

      responseMoves,

      advicePolicy:
        safetyOverride
          ? "safety_first"
          : responsePlan.advicePolicy ||
            "allowed_if_useful",

      coachingPermissionRequired:
        safetyOverride
          ? false
          : responsePlan
              .coachingPermissionRequired ===
            true,

      questionPolicy: {
        shouldAskQuestion,

        questionRequired:
          shouldAskQuestion,

        purpose:
          shouldAskQuestion
            ? responsePlan
                .questionPurpose ||
              (
                safetyContext
                  .requiresClarification
                  ? "safety_clarification"
                  : "response_plan_question"
              )
            : null,

        maximumQuestions:
          shouldAskQuestion
            ? 1
            : 0
      },

      requiredBehaviors,

      forbiddenBehaviors,

      constraints,

      rules,

      blueprintHint,

      communicationPlan:
        responsePlan
          .communicationPlan ||
        responseStrategy
          .communicationPlan ||
        languageContext
          .communicationPlan ||
        null,

      composerDirective:
        responsePlan
          .composerDirective ||
        responseStrategy
          .composerDirective ||
        null,

      writerInstructions,

      safetyOverride,

      developerLocked,

      authority:
        "canonical_response_control"
    };
  },

  ensureSafetyMoves(
    moves = []
  ) {
    const normalized =
      this.normalizeResponseMoves(
        moves
      );

    const requiredSafetyMoves = [
      "pause_and_prioritize_safety",
      "give_direct_safety_step",
      "urge_trusted_or_emergency_support"
    ];

    const existing =
      new Set(
        normalized.map(
          move =>
            move.id
        )
      );

    requiredSafetyMoves.forEach(
      (
        move,
        index
      ) => {
        if (
          existing.has(move)
        ) {
          return;
        }

        normalized.push({
          id:
            move,

          order:
            normalized.length +
            index,

          type:
            "response_move",

          required:
            true,

          userFacing:
            true,

          renderPolicy:
            "render_or_ai_repair",

          source:
            "safety_override"
        });
      }
    );

    return normalized.sort(
      (a, b) =>
        a.order -
        b.order
    );
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
    developerContext = {},
    characterContext = {},
    continuityContext = {},
    safetyContext = {},
    knowledgeContext = {},
    languageContext = {},
    evidence = {}
  } = {}) {
    const lockedDeveloperReply =
      developerContext.locked
        ? developerContext
            .lockedReply
        : null;

    return {
      schema:
        "ari_composer_packet",

      schemaVersion:
        this.schemaVersion,

      ready:
        Boolean(
          request.originalText ||
          lockedDeveloperReply
        ),

      source:
        "ari-composer-bridge",

      version:
        this.version,

      createdAt:
        new Date().toISOString(),

      request,

      /*
       * Compatibility fields.
       */
      userQuestion:
        request.originalText,

      originalUserQuestion:
        request.originalText,

      resolvedUserQuestion:
        request.originalText,

      currentTurnText:
        request.originalText,

      currentTurnTextPreserved:
        true,

      primary:
        developerContext.locked
          ? "developer"
          : responseStrategy
              .primaryLane ||
            summary.primaryLane ||
            "general_understanding",

      contextLane:
        responseStrategy
          .contextLane ||
        request.contextLane ||
        "direct_current_turn",

      responsePlan,

      canonicalResponsePlan:
        responsePlan,

      responsePlanAvailable:
        responsePlan.available ===
        true,

      responseStrategy,

      responseControl,

      responseGoal:
        responseControl.responseGoal,

      responseShape:
        responseControl.responseShape,

      responsePosture:
        responseControl
          .responsePosture,

      responseOrder:
        responseControl.responseOrder,

      responseMoves:
        responseControl.responseMoves,

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
        responseControl.blueprintHint,

      communicationPlan:
        responseControl
          .communicationPlan,

      composerDirective:
        responseControl
          .composerDirective,

      expressionPlan:
        languageContext.expressionPlan,

      mouthDirective:
        languageContext.mouthDirective,

      humanLanguageProfile:
        languageContext
          .humanLanguageProfile,

      languageGuidance:
        languageContext
          .languageGuidance,

      lexicalGrounding:
        languageContext
          .lexicalGrounding,

      preferredTerms:
        languageContext
          .preferredTerms,

      continuity:
        continuityContext,

      activeDialogueState:
        continuityContext
          .activeDialogueState,

      character:
        characterContext.character,

      characterIdentity:
        characterContext.identity,

      characterContext,

      safety:
        safetyContext,

      knowledge:
        knowledgeContext,

      developer:
        developerContext,

      developerPacket:
        developerContext.packet,

      hasDeveloperPacket:
        Boolean(
          developerContext.packet
        ),

      developerPacketLocked:
        developerContext.locked,

      developerPacketAdvisory:
        developerContext.advisory,

      developerRelevant:
        developerContext.relevant,

      lockedDeveloperReply,

      thesis:
        this.buildThesis(summary),

      evidence,

      candidatePolicy: {
        deterministicWriterAllowed:
          !developerContext.locked,

        aiWriterAllowed:
          !developerContext.locked &&
          (
            responsePlan.raw
              ?.expressionPlan
              ?.aiAllowed !==
              false
          ),

        aiRepairAllowed:
          !developerContext.locked,

        lockedDeveloperReplyPreferred:
          developerContext.locked,

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
          true
      },

      authority: {
        canPackageComposerContext:
          true,

        canNormalizeWriterContract:
          true,

        canFilterIrrelevantDeveloperEvidence:
          true,

        canPreserveCanonicalResponsePlan:
          true,

        canInterpretCurrentMeaning:
          false,

        canChangeRequestedOperation:
          false,

        canChangeResponsePlan:
          false,

        canWriteFinalLanguage:
          false,

        canSelectFinalDraft:
          false,

        canPersistState:
          false,

        role:
          "canonical_response_plan_to_expression_handoff"
      }
    };
  },

  buildThesis(
    summary = {}
  ) {
    const contract =
      summary.situationContract ||
      {};

    return {
      value:
        contract.situationThesis
          ?.thesis ||
        summary
          .primarySituationThesis ||
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
        "advisory_situation_summary_only"
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
    developerContext = {},
    characterContext = {},
    continuityContext = {},
    safetyContext = {},
    knowledgeContext = {},
    languageContext = {}
  } = {}) {
    const allowDeveloperEvidence =
      developerContext.allowed ===
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

      continuity: {
        stagePacket:
          continuityContext
            .stagePacket,

        packet:
          continuityContext.packet,

        context:
          continuityContext.context,

        activeDialogueState:
          continuityContext
            .activeDialogueState,

        binding:
          continuityContext.binding,

        facts:
          continuityContext.facts,

        resolvedReferences:
          continuityContext
            .resolvedReferences,

        unresolvedReferences:
          continuityContext
            .unresolvedReferences
      },

      safety:
        safetyContext,

      character:
        characterContext.character,

      characterIdentity:
        characterContext.identity,

      characterPreferences:
        characterContext
          .stablePreferences,

      languageGuidance:
        languageContext
          .languageGuidance,

      humanLanguageProfile:
        languageContext
          .humanLanguageProfile,

      lexicalGrounding:
        languageContext
          .lexicalGrounding,

      preferredTerms:
        languageContext
          .preferredTerms,

      expressionPlan:
        languageContext
          .expressionPlan,

      knowledge:
        knowledgeContext,

      knowledgeMeaning:
        knowledgeContext.meaning,

      knowledgeSynthesis:
        knowledgeContext.synthesis,

      blueprintKnowledgeHandoff:
        knowledgeContext
          .blueprintHandoff,

      reasoning:
        summary.reasoning ||
        null,

      cognitiveExecutive:
        summary.cognitiveExecutive ||
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

      memory: {
        retrieval:
          summary.memoryRetrieval ||
          null,

        context:
          summary.memoryContext ||
          summary.memoryContextResult ||
          null,

        facts:
          this.toArray(
            summary.memoryFacts ||
            summary.usableMemories
          ),

        handoff:
          summary.memoryHandoff ||
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
              developerContext.packet
                ?.intent ||
              null
            )
          : null,

      developerHandoff:
        allowDeveloperEvidence
          ? summary.developerHandoff ||
            null
          : null,

      developerResponse:
        allowDeveloperEvidence
          ? summary.developerResponse ||
            null
          : null,

      developerReply:
        developerContext.locked
          ? developerContext
              .lockedReply
          : null,

      developerPacket:
        allowDeveloperEvidence
          ? developerContext.packet
          : null,

      developerEvidenceSuppressed:
        !allowDeveloperEvidence,

      aiWriter: {
        ran:
          summary.aiWriterRan ===
          true,

        usedAI:
          summary.aiWriterUsedAI ===
          true,

        draft:
          summary.aiWriterDraft ||
          null,

        source:
          summary.aiWriterSource ||
          null,

        version:
          summary.aiWriterVersion ||
          null,

        fallbackReason:
          summary
            .aiWriterFallbackReason ||
          null
      },

      blueprintWriter: {
        ran:
          summary
            .blueprintWriterRan ===
          true,

        draft:
          summary
            .blueprintWriterDraft ||
          null,

        blueprint:
          summary.blueprint ||
          null,

        source:
          summary
            .blueprintWriterSource ||
          null,

        version:
          summary
            .blueprintWriterVersion ||
          null,

        reason:
          summary
            .blueprintWriterReason ||
          null
      }
    };
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  firstFiniteNumber(
    values = []
  ) {
    for (
      const value
      of this.toArray(values)
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
        Number(value);

      if (
        Number.isFinite(number)
      ) {
        return number;
      }
    }

    return null;
  },

  normalizeIdentifier(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
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
      .flatMap(
        value =>
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
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalize(value = "") {
    return this.cleanOriginal(
      value
    )
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

window.Ari.composerBridge =
  window.AriComposerBridge;

console.log(
  "ARI COMPOSER BRIDGE LOADED:",
  window.AriComposerBridge?.version
);