// ari/language/ari-composer-bridge.js
// Ari Composer Bridge
//
// Purpose:
// Package the completed canonical Response Plan and supporting deliberation
// and expression evidence into one Composer Packet.
//
// V2.2.0 — Focused Character Handoff / Canonical Plan Preservation
//
// Architectural flow:
//
// Deliberation Packet
//      ↓
// Canonical Response Plan
//      ↓
// Character / Language / Safety Evidence
//      ↓
// Ari Composer Bridge
//      ↓
// Composer Packet
//      ↓
// Blueprint Writer / AI Writer / Candidate Arbiter
//
// Responsibilities:
// - Preserve the original current-turn text.
// - Locate and preserve the canonical Response Plan.
// - Package continuity, safety, understanding, knowledge, character,
//   language, memory, and developer evidence.
// - Preserve the focused Composer Character packet without exposing entire
//   preference or worldview collections.
// - Carry canonical, inferred, open, identity, and worldview status.
// - Carry deterministic character drafts and AI-realization rules.
// - Merge authoritative response controls without changing response moves.
// - Suppress irrelevant developer evidence.
// - Produce one structured Composer Packet.
//
// Non-responsibilities:
// - Does not create a fallback response plan.
// - Does not choose a response goal.
// - Does not choose a response shape.
// - Does not add, remove, reorder, or replace response moves.
// - Does not resolve character preferences.
// - Does not create worldview positions.
// - Does not override safety policy.
// - Does not rewrite writer instructions.
// - Does not reinterpret the current user turn.
// - Does not write final user-facing language.
// - Does not select the final response candidate.
// - Does not retrieve or store memory.
// - Does not access Supabase.
// - Does not persist state.

window.Ari = window.Ari || {};

window.AriComposerBridge = {
  version: "2.2.0",
  schemaVersion: "1.2.0",
  source: "ari-composer-bridge",
  authorityLevel: "canonical_response_plan_packaging_authority",

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
      this.resolveCharacterContext(
        summary
      );

    const continuityContext =
      this.resolveContinuityContext(
        summary
      );

    const safetyContext =
      this.resolveSafetyContext(
        summary
      );

    const knowledgeContext =
      this.resolveKnowledgeContext(
        summary
      );

    const languageContext =
      this.resolveLanguageContext(
        summary
      );

    const responseControl =
      this.buildResponseControl({
        responsePlan,
        responseStrategy,
        characterContext,
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

    window.Ari.composerPacket =
      packet;

    window.Ari.composerBridgeState =
      packet;

    return {
      composerPacketReady:
        packet.ready === true,

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
        responsePlan.available === true,

      canonicalResponsePlanReady:
        responsePlan.ready === true,

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
        responseControl.writerInstructions,

      composerCharacterAvailable:
        characterContext.available ===
        true,

      composerCharacterAnswerAvailable:
        characterContext.answerAvailable ===
        true,

      composerCharacterDraftAvailable:
        characterContext.draftAvailable ===
        true,

      composerCharacterNeedsAIWriter:
        characterContext.needsAIWriter ===
        true,

      composerCharacterStatus:
        characterContext.status ||
        null
    };
  },

  /* =====================================================
     REQUEST
  ===================================================== */

  buildRequest(summary = {}) {
    const planTurn =
      summary.responsePlanningHandoff
        ?.responsePlan
        ?.turn ||
      summary.responsePlanningStagePacket
        ?.planner
        ?.value
        ?.responsePlan
        ?.turn ||
      summary.responsePlanningStagePacket
        ?.planner
        ?.value
        ?.turn ||
      summary.ariResponsePlan
        ?.responsePlan
        ?.turn ||
      summary.ariResponsePlan
        ?.turn ||
      summary.responsePlan
        ?.turn ||
      {};

    const continuityTurn =
      summary.continuityStagePacket
        ?.currentTurn ||
      summary.continuityCurrentTurn ||
      {};

    const originalText =
      this.cleanOriginal(
        planTurn.originalText ||
        continuityTurn.originalText ||
        summary.originalUserMessage ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    const normalizedText =
      this.normalize(
        planTurn.normalizedText ||
        continuityTurn.normalizedText ||
        summary.normalizedMessage ||
        originalText
      );

    const turnId =
      planTurn.turnId ||
      continuityTurn.turnId ||
      summary.currentTurnId ||
      summary.turnId ||
      null;

    return {
      schema:
        "ari_composer_request",

      schemaVersion:
        this.schemaVersion,

      turnId,

      originalText,

      currentText:
        originalText,

      normalizedText,

      resolvedText:
        originalText,

      textWasRewritten:
        false,

      originalTextPreserved:
        true,

      currentTurnWasStructurallyResolved:
        planTurn
          .currentTurnWasSemanticallyResolved ===
          true ||
        continuityTurn
          .currentTurnWasResolved ===
          true ||
        summary.currentTurnWasResolved ===
          true,

      requiresPriorContext:
        summary.routingContract
          ?.contextLane ===
          "continuity_follow_up" ||
        summary.routingContract
          ?.contextLane ===
          "relationship_continuity" ||
        summary.routingContract
          ?.contextLane ===
          "correction_or_revision" ||
        summary.continuityEligibility
          ?.eligible ===
          true,

      contextLane:
        summary.routingContract
          ?.contextLane ||
        summary.contextLane ||
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
        ?.value
        ?.canonicalResponsePlan,

      summary.responsePlanningStagePacket
        ?.planner
        ?.value,

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

      summary.communicationPlan
        ?.responsePlan,

      summary.canonicalResponsePlan,

      summary.responsePlan
    ];

    const found =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object" &&
        !Array.isArray(candidate) &&
        (
          candidate.schema ===
            "ari_response_plan" ||
          candidate.responsePlan
            ?.schema ===
            "ari_response_plan" ||
          candidate.canonicalResponsePlan
            ?.schema ===
            "ari_response_plan" ||
          candidate.responsePlannerRan ===
            true
        )
      ) ||
      null;

    const canonical =
      found?.schema ===
        "ari_response_plan"
        ? found
        : found?.responsePlan
            ?.schema ===
            "ari_response_plan"
          ? found.responsePlan
          : found
              ?.canonicalResponsePlan
              ?.schema ===
              "ari_response_plan"
            ? found
                .canonicalResponsePlan
            : null;

    if (!canonical) {
      return this
        .buildMissingResponsePlanRecord();
    }

    const moves =
      this.normalizeResponseMoves(
        canonical.moves ||
        canonical.responseMoves ||
        []
      );

    const writerInstructions =
      this.preserveWriterInstructions(
        canonical.writerInstructions ||
        {}
      );

    const interactionPolicy =
      canonical.interactionPolicy ||
      {};

    const governance =
      canonical.governance ||
      {};

    const strategy =
      canonical.strategy ||
      {};

    const blueprint =
      canonical.blueprint ||
      {};

    return {
      schema:
        "ari_response_plan",

      schemaVersion:
        canonical.schemaVersion ||
        null,

      available:
        true,

      ready:
        canonical.ready === true,

      usable:
        canonical.usable === true,

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

      sourceQuestion:
        canonical.turn
          ?.originalText ||
        canonical.sourceQuestion ||
        canonical.userQuestion ||
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
          canonical.confidence ??
          0
        ),

      responseGoal:
        strategy.responseGoal ||
        canonical.responseGoal ||
        null,

      responseShape:
        strategy.responseShape ||
        canonical.responseShape ||
        writerInstructions.shape ||
        null,

      responsePosture:
        strategy.responsePosture ||
        canonical.responsePosture ||
        writerInstructions.tone ||
        writerInstructions.posture ||
        null,

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
        null,

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
            .maxQuestions,

          writerInstructions
            .maxQuestions,

          0
        ]),

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
            .required,

          writerInstructions
            .requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          governance
            .forbiddenBehaviors,

          canonical
            .forbiddenBehaviors,

          canonical.avoid,

          writerInstructions
            .avoid,

          writerInstructions
            .forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          governance.constraints,
          canonical.constraints,
          writerInstructions
            .constraints
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
        canDefineResponseGoal:
          false,

        canDefineResponseShape:
          false,

        canDefineResponseMoves:
          false,

        canDefineAdvicePolicy:
          false,

        canDefineQuestionPolicy:
          false,

        canDefineWriterInstructions:
          false,

        canWriteFinalLanguage:
          false,

        canSelectFinalDraft:
          false,

        role:
          "canonical_response_plan_preservation_only"
      }
    };
  },

  buildMissingResponsePlanRecord() {
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
              "canonical_response_plan_missing",

            message:
              "The Composer Bridge did not receive a canonical Response Plan."
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

        canInterpretMeaning:
          false,

        canWriteFinalLanguage:
          false,

        role:
          "missing_canonical_response_plan_record"
      }
    };
  },

  normalizeResponseMoves(
    moves = []
  ) {
    return this
      .toArray(moves)
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

                  type:
                    "response_move",

                  required:
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

                  source:
                    "canonical_response_plan",

                  raw:
                    move
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

            type:
              move.type ||
              "response_move",

            family:
              move.family ||
              null,

            renderer:
              move.renderer ||
              null,

            purpose:
              move.purpose ||
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
        (a, b) =>
          a.order -
          b.order
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
     RESPONSE STRATEGY
  ===================================================== */

  resolveResponseStrategy({
    summary = {},
    responsePlan = {}
  } = {}) {
    const canonicalStrategy =
      responsePlan.strategy ||
      {};

    const legacyStrategy =
      summary.responsePlanningHandoff
        ?.responseStrategy ||
      summary.responsePlanningStagePacket
        ?.strategy ||
      summary.responseStrategy ||
      {};

    return {
      ready:
        responsePlan.ready ===
        true,

      source:
        canonicalStrategy.source ||
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
        canonicalStrategy.answerMode ||
        null,

      desiredOutcome:
        canonicalStrategy
          .desiredOutcome ||
        null,

      responseOrder:
        responsePlan.responseOrder,

      primaryLane:
        canonicalStrategy
          .primaryLane ||
        legacyStrategy.primaryLane ||
        summary.routingContract
          ?.primaryLane ||
        summary.primaryLane ||
        null,

      contextLane:
        canonicalStrategy
          .contextLane ||
        legacyStrategy.contextLane ||
        summary.routingContract
          ?.contextLane ||
        summary.contextLane ||
        null,

      planner:
        canonicalStrategy.planner ||
        legacyStrategy.planner ||
        summary.routingContract
          ?.planner ||
        summary.selectedPlanner ||
        null,

      mode:
        legacyStrategy.mode ||
        summary.routingContract
          ?.mode ||
        summary.conversationMode ||
        "unknown",

      intent:
        legacyStrategy.intent ||
        summary.routingContract
          ?.primaryIntent ||
        summary.primaryIntent ||
        "unknown",

      domain:
        legacyStrategy.domain ||
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
          .personalization ||
        null,

      confidence:
        responsePlan.confidence,

      raw:
        canonicalStrategy,

      authority: {
        canDescribeCanonicalStrategy:
          true,

        canOverrideCanonicalResponsePlan:
          false,

        canWriteFinalLanguage:
          false,

        role:
          "canonical_response_strategy_projection"
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
        ? summary
            .composerDeveloperPacket
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

    const rawMode =
      responseStrategy.mode ||
      summary.routingContract
        ?.mode ||
      "";

    const mode =
      this.normalizeIdentifier(
        typeof rawMode === "string"
          ? rawMode
          : rawMode?.mode ||
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
    const stagePacket =
      summary.characterStagePacket ||
      null;

    const handoff =
      summary.characterHandoff ||
      stagePacket?.handoff ||
      null;

    const character =
      summary.composerCharacter ||
      handoff?.composerCharacter ||
      summary.characterExpression
        ?.composerCharacter ||
      summary.characterExpression
        ?.composerCharacterPacket ||
      null;

    const context =
      summary.characterContext ||
      stagePacket?.context?.value ||
      null;

    const reasoning =
      summary.characterReasoning ||
      stagePacket?.reasoning?.value ||
      handoff?.reasoning ||
      null;

    const expression =
      summary.characterExpression ||
      stagePacket?.expression?.value ||
      null;

    const authorities =
      summary.localCharacterAuthorities ||
      stagePacket
        ?.localCharacterAuthorities ||
      handoff?.localAuthorities ||
      null;

    const responseControl =
      this.mergeResponseControls(
        context?.responseControl,
        reasoning?.responseControl,
        expression?.responseControl,
        character?.responseControl,
        {
          requiredBehaviors:
            handoff
              ?.requiredBehaviors,

          forbiddenBehaviors:
            handoff
              ?.forbiddenBehaviors,

          constraints:
            handoff
              ?.constraints
        }
      );

    const status =
      character?.status ||
      handoff?.status ||
      this.buildCharacterStatus(
        reasoning
      );

    const realization =
      this.normalizeCharacterRealization({
        character,
        handoff,
        reasoning
      });

    const draft =
      String(
        character?.draft ||
        handoff?.draft ||
        reasoning?.userFacingDraft ||
        ""
      ).trim();

    const deterministicDraft =
      String(
        character
          ?.deterministicDraft ||
        handoff
          ?.deterministicDraft ||
        reasoning
          ?.deterministicDraft ||
        draft
      ).trim();

    const answerAvailable =
      character?.answerAvailable ===
        true ||
      handoff?.answerAvailable ===
        true ||
      reasoning
        ?.characterAnswerAvailable ===
        true;

    const guidanceAvailable =
      character?.guidanceAvailable ===
        true ||
      handoff?.guidanceAvailable ===
        true ||
      reasoning
        ?.characterGuidanceAvailable ===
        true ||
      Boolean(
        character?.relationship ||
        context?.relationshipPacket
      );

    const available =
      Boolean(
        character ||
        handoff ||
        context ||
        reasoning
      );

    const grounding =
      character?.grounding ||
      handoff?.grounding ||
      this.buildCharacterGrounding({
        reasoning,
        status
      });

    const implementationDisclosure =
      character
        ?.implementationDisclosure ||
      handoff
        ?.implementationDisclosure ||
      context
        ?.implementationDisclosure ||
      null;

    const relationship =
      character?.relationship ||
      handoff?.relationship ||
      context?.relationshipPacket ||
      null;

    return {
      available,

      enabled:
        character?.enabled ===
          true ||
        handoff?.enabled ===
          true,

      relevant:
        character
          ?.characterRelevant ===
          true ||
        character?.relevant ===
          true ||
        handoff?.relevant ===
          true,

      useAllowed:
        character?.enabled !==
          false &&
        context?.characterUseAllowed !==
          false,

      answerAvailable,

      guidanceAvailable,

      draftAvailable:
        Boolean(draft),

      deterministicDraftAvailable:
        Boolean(
          deterministicDraft
        ),

      needsAIWriter:
        realization.needsAIWriter ===
        true,

      mode:
        character?.mode ||
        handoff?.mode ||
        context?.characterMode ||
        "silent",

      visibility:
        character?.visibility ||
        handoff?.visibility ||
        context
          ?.characterVisibility ||
        "background",

      expressionLevel:
        character
          ?.expressionLevel ||
        handoff?.expressionLevel ||
        expression
          ?.expressionLevel ||
        "background",

      focus:
        character?.focus ||
        handoff?.focus ||
        reasoning?.focus ||
        context?.characterFocus ||
        null,

      subject:
        character?.subject ||
        handoff?.subject ||
        reasoning?.subject ||
        context?.characterSubject ||
        null,

      type:
        character?.type ||
        handoff?.type ||
        reasoning?.type ||
        null,

      subtype:
        character?.subtype ||
        handoff?.subtype ||
        reasoning?.subtype ||
        null,

      preferredSource:
        character
          ?.preferredSource ||
        handoff
          ?.preferredCharacterSource ||
        reasoning?.source ||
        context
          ?.preferredCharacterSource ||
        null,

      status,

      draft,

      deterministicDraft,

      answer:
        character?.answer ||
        handoff?.answer ||
        reasoning?.answer ||
        null,

      values:
        character?.values ||
        handoff?.values ||
        reasoning?.values ||
        null,

      groundedMeaning:
        character
          ?.groundedMeaning ||
        handoff
          ?.groundedMeaning ||
        reasoning
          ?.groundedMeaning ||
        null,

      grounding,

      realization,

      relationship,

      implementationDisclosure,

      responseControl,

      style:
        character?.style ||
        null,

      limits:
        character?.limits ||
        null,

      characterType:
        character
          ?.characterType ||
        null,

      rules:
        this.mergeUnique(
          character?.rules,
          reasoning
            ?.composerHints
            ?.rules
        ),

      authorityChain:
        this.toArray(
          character
            ?.authorityChain ||
          handoff
            ?.authorityChain ||
          reasoning
            ?.authorityChain
        ),

      authorityPacket:
        character
          ?.authorityPacket ||
        handoff
          ?.authorityPacket ||
        reasoning
          ?.authorityPacket ||
        null,

      requestedAuthorities:
        authorities
          ?.requestedAuthorities ||
        [],

      missingRequestedAuthorities:
        authorities
          ?.missingRequestedAuthorities ||
        [],

      requestedAuthoritiesSatisfied:
        authorities
          ?.requestedAuthoritiesSatisfied !==
        false,

      localAuthorities:
        authorities,

      character,
      handoff,
      context,
      reasoning,
      expression,
      stagePacket,

      authority:
        "focused_character_expression_evidence_only"
    };
  },

  normalizeCharacterRealization({
    character = null,
    handoff = null,
    reasoning = null
  } = {}) {
    const source =
      character?.realization ||
      handoff?.realization ||
      reasoning?.realizationPolicy ||
      {};

    const needsAIWriter =
      source.needsAIWriter ===
        true ||
      handoff?.needsAIWriter ===
        true ||
      reasoning?.needsAIWriter ===
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
        handoff?.aiWriterMode ||
        reasoning?.aiWriterMode ||
        null,

      aiInstruction:
        source.aiInstruction ||
        handoff?.aiInstruction ||
        reasoning?.aiInstruction ||
        "",

      preserveMeaning:
        source.preserveMeaning !==
        false,

      preserveStatus:
        source.preserveStatus !==
        false,

      preserveValue:
        source.preserveValue ===
          true ||
        reasoning
          ?.realizationPolicy
          ?.preserveValue ===
          true,

      preservePosition:
        source.preservePosition ===
          true ||
        reasoning
          ?.realizationPolicy
          ?.preservePosition ===
          true,

      preserveOpenStatus:
        source.preserveOpenStatus ===
          true ||
        reasoning
          ?.realizationPolicy
          ?.preserveOpenStatus ===
          true,

      tentativeLanguageRequired:
        source
          .tentativeLanguageRequired ===
          true ||
        reasoning
          ?.realizationPolicy
          ?.tentativeLanguageRequired ===
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

  buildCharacterGrounding({
    reasoning = {},
    status = {}
  } = {}) {
    return {
      grounded:
        Boolean(
          reasoning.groundedMeaning ||
          reasoning.authorityPacket ||
          reasoning.source
        ),

      status:
        status.overall ||
        reasoning.status ||
        null,

      source:
        reasoning.source ||
        null,

      authorityChain:
        this.toArray(
          reasoning.authorityChain
        ),

      canonicalValue:
        status.canonical ===
        true
          ? reasoning.answer ||
            null
          : null,

      inferredValue:
        status.inferred ===
        true
          ? reasoning.answer ||
            null
          : null,

      openStatus:
        status.open ===
        true,

      worldviewPosition:
        [
          "character_worldview",
          "character_perspective"
        ].includes(
          reasoning.type
        )
          ? reasoning.answer ||
            null
          : null,

      identityStatement:
        reasoning.type ===
        "character_identity"
          ? reasoning.answer ||
            null
          : null
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
      summary.continuityReferenceBinding ||
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
        summary.continuityEligibility
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

      authority:
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
        summary
          .knowledgeSynthesis
          ?.blueprintHandoff ||
        null,

      retrievalPlan:
        summary
          .knowledgeRetrievalPlan ||
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

      responseAvoid:
        this.mergeUnique(
          summary.responseAvoid,
          mouth.responseAvoid,
          guidance
            .forbiddenBehaviors
        ),

      responseRequired:
        this.mergeUnique(
          summary.responseRequired,
          mouth.responseRequired,
          guidance
            .requiredBehaviors
        ),

      responseConstraints:
        this.mergeUnique(
          summary.responseConstraints,
          mouth.responseConstraints,
          guidance.constraints
        ),

      authority:
        "language_and_expression_guidance_only"
    };
  },

  /* =====================================================
     RESPONSE CONTROL
  ===================================================== */

  buildResponseControl({
    responsePlan = {},
    responseStrategy = {},
    characterContext = {},
    safetyContext = {},
    languageContext = {}
  } = {}) {
    const interactionPolicy =
      responsePlan.interactionPolicy ||
      {};

    const writerInstructions =
      responsePlan.writerInstructions ||
      {};

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
          writerInstructions
            .questionRequired ===
            true ||
          interactionPolicy
            .shouldAskQuestion ===
            true,

        purpose:
          responsePlan
            .questionPurpose,

        maximumQuestions:
          responsePlan.maxQuestions ??
          0
      },

      requiredBehaviors:
        this.mergeUnique(
          responsePlan
            .requiredBehaviors,

          safetyContext
            .requiredBehaviors,

          characterContext
            .responseControl
            ?.requiredBehaviors,

          languageContext
            .responseRequired
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          responsePlan
            .forbiddenBehaviors,

          safetyContext
            .forbiddenBehaviors,

          characterContext
            .responseControl
            ?.forbiddenBehaviors,

          languageContext
            .responseAvoid
        ),

      constraints:
        this.mergeUnique(
          responsePlan.constraints,

          safetyContext.constraints,

          characterContext
            .responseControl
            ?.constraints,

          languageContext
            .responseConstraints
        ),

      rules:
        this.mergeUnique(
          responsePlan
            .responseRules,

          characterContext.rules
        ),

      blueprintHint:
        responsePlan.blueprintHint,

      communicationPlan:
        responsePlan
          .communicationPlan ||
        responseStrategy
          .communicationPlan ||
        null,

      composerDirective:
        responsePlan
          .composerDirective ||
        responseStrategy
          .composerDirective ||
        null,

      writerInstructions,

      characterControl: {
        available:
          characterContext.available ===
          true,

        answerAvailable:
          characterContext
            .answerAvailable ===
          true,

        status:
          characterContext.status ||
          null,

        grounding:
          characterContext.grounding ||
          null,

        realization:
          characterContext.realization ||
          null
      },

      canonicalResponsePlanReady:
        responsePlan.ready ===
        true,

      canonicalResponsePlanAvailable:
        responsePlan.available ===
        true,

      authority:
        "canonical_plan_controls_with_authoritative_supporting_constraints"
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
        ? developerContext.lockedReply
        : null;

    const canonicalPlanReady =
      responsePlan.available ===
        true &&
      responsePlan.ready ===
        true &&
      responsePlan.usable ===
        true;

    const ready =
      Boolean(
        lockedDeveloperReply ||
        (
          request.originalText &&
          canonicalPlanReady
        )
      );

    const characterCandidatePolicy =
      this.buildCharacterCandidatePolicy(
        characterContext
      );

    return {
      schema:
        "ari_composer_packet",

      schemaVersion:
        this.schemaVersion,

      ready,

      usable:
        ready,

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

      /*
       * Current-turn compatibility aliases.
       */
      turnId:
        request.turnId,

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
        responseStrategy.primaryLane ||
        summary.primaryLane ||
        "general_understanding",

      contextLane:
        responseStrategy.contextLane ||
        request.contextLane ||
        "direct_current_turn",

      /*
       * Canonical plan.
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

      /*
       * Derived compatibility aliases only.
       */
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
       * Supporting expression context.
       */
      expressionPlan:
        languageContext
          .expressionPlan,

      mouthDirective:
        languageContext
          .mouthDirective,

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

      /*
       * Focused character packet.
       *
       * Do not expose complete preference/worldview collections here.
       */
      character:
        characterContext.character,

      composerCharacter:
        characterContext.character,

      characterHandoff:
        characterContext.handoff,

      characterContext,

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

      characterGuidanceAvailable:
        characterContext
          .guidanceAvailable ===
        true,

      characterDraft:
        characterContext.draft ||
        "",

      characterDeterministicDraft:
        characterContext
          .deterministicDraft ||
        "",

      characterDraftAvailable:
        characterContext
          .draftAvailable ===
        true,

      characterDeterministicDraftAvailable:
        characterContext
          .deterministicDraftAvailable ===
        true,

      characterMode:
        characterContext.mode ||
        "silent",

      characterType:
        characterContext.type ||
        null,

      characterSubtype:
        characterContext.subtype ||
        null,

      characterStatus:
        characterContext.status ||
        null,

      characterGrounding:
        characterContext.grounding ||
        null,

      characterRealization:
        characterContext.realization ||
        null,

      characterRelationship:
        characterContext.relationship ||
        null,

      characterImplementationDisclosure:
        characterContext
          .implementationDisclosure ||
        null,

      characterNeedsAIWriter:
        characterContext.needsAIWriter ===
        true,

      characterAIWriterMode:
        characterContext
          .realization
          ?.aiWriterMode ||
        null,

      characterAIInstruction:
        characterContext
          .realization
          ?.aiInstruction ||
        "",

      characterAuthorityChain:
        characterContext
          .authorityChain ||
        [],

      characterAuthorityPacket:
        characterContext
          .authorityPacket ||
        null,

      /*
       * Supporting evidence contexts.
       */
      continuity:
        continuityContext,

      activeDialogueState:
        continuityContext
          .activeDialogueState,

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
        this.buildThesis(
          summary
        ),

      evidence,

      candidatePolicy: {
        deterministicWriterAllowed:
          canonicalPlanReady &&
          !developerContext.locked,

        aiWriterAllowed:
          canonicalPlanReady &&
          !developerContext.locked &&
          responsePlan
            .blueprint
            ?.aiAllowed !==
            false,

        aiRepairAllowed:
          canonicalPlanReady &&
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
          true,

        character:
          characterCandidatePolicy,

        groundedCharacterCandidateAllowed:
          characterCandidatePolicy
            .candidateAllowed,

        groundedCharacterCandidatePreferred:
          characterCandidatePolicy
            .candidatePreferred,

        characterAIRealizationAllowed:
          characterCandidatePolicy
            .aiRealizationAllowed,

        characterMeaningMustBePreserved:
          true,

        characterStatusMustBePreserved:
          true,

        characterAuthorityMayNotBeModified:
          true
      },

      validation: {
        valid:
          ready,

        canonicalResponsePlanAvailable:
          responsePlan.available ===
          true,

        canonicalResponsePlanReady:
          responsePlan.ready ===
          true,

        canonicalResponsePlanUsable:
          responsePlan.usable ===
          true,

        currentTurnAvailable:
          Boolean(
            request.originalText
          ),

        lockedDeveloperReplyAvailable:
          Boolean(
            lockedDeveloperReply
          ),

        characterAvailable:
          characterContext.available ===
          true,

        characterAnswerAvailable:
          characterContext
            .answerAvailable ===
          true,

        characterGrounded:
          characterContext
            .grounding
            ?.grounded ===
          true,

        characterRequestedAuthoritiesSatisfied:
          characterContext
            .requestedAuthoritiesSatisfied !==
          false,

        errors:
          this.buildComposerErrors({
            request,
            responsePlan,
            lockedDeveloperReply,
            characterContext
          }),

        warnings:
          this.buildComposerWarnings({
            request,
            responsePlan,
            continuityContext,
            characterContext
          })
      },

      authority:
        this.getAuthorityBoundaries()
    };
  },

  buildCharacterCandidatePolicy(
    characterContext = {}
  ) {
    const answerAvailable =
      characterContext.answerAvailable ===
      true;

    const deterministicDraftAvailable =
      characterContext
        .deterministicDraftAvailable ===
      true;

    const grounded =
      characterContext.grounding
        ?.grounded ===
      true;

    const realization =
      characterContext.realization ||
      {};

    return {
      available:
        characterContext.available ===
        true,

      answerAvailable,

      guidanceAvailable:
        characterContext
          .guidanceAvailable ===
        true,

      grounded,

      status:
        characterContext.status ||
        null,

      candidateAllowed:
        answerAvailable &&
        deterministicDraftAvailable &&
        grounded,

      candidatePreferred:
        answerAvailable &&
        deterministicDraftAvailable &&
        grounded &&
        realization.needsAIWriter !==
          true,

      localCandidateAvailable:
        deterministicDraftAvailable,

      localCandidateText:
        deterministicDraftAvailable
          ? characterContext
              .deterministicDraft
          : "",

      aiRealizationAllowed:
        answerAvailable &&
        realization.needsAIWriter ===
          true,

      aiRealizationRequired:
        answerAvailable &&
        realization.needsAIWriter ===
          true &&
        realization.mode ===
          "ai_realization_required",

      aiWriterMode:
        realization.aiWriterMode ||
        null,

      aiInstruction:
        realization.aiInstruction ||
        "",

      preserveMeaning:
        true,

      preserveStatus:
        true,

      preserveValue:
        realization.preserveValue ===
        true,

      preservePosition:
        realization.preservePosition ===
        true,

      preserveOpenStatus:
        realization
          .preserveOpenStatus ===
        true,

      tentativeLanguageRequired:
        realization
          .tentativeLanguageRequired ===
        true,

      mayVaryWording:
        realization.mayVaryWording !==
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
    };
  },

  buildComposerErrors({
    request = {},
    responsePlan = {},
    lockedDeveloperReply = null,
    characterContext = {}
  } = {}) {
    const errors = [];

    if (lockedDeveloperReply) {
      return errors;
    }

    if (!request.originalText) {
      errors.push({
        type:
          "current_turn_missing",

        message:
          "The Composer Packet does not contain the original current-turn text."
      });
    }

    if (
      responsePlan.available !==
      true
    ) {
      errors.push({
        type:
          "canonical_response_plan_missing",

        message:
          "The Composer Bridge did not receive a canonical Response Plan."
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
          "canonical_response_plan_not_ready",

        message:
          "The canonical Response Plan is present but not ready."
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
          "canonical_response_plan_not_usable",

        message:
          "The canonical Response Plan is present but not usable."
      });
    }

    if (
      responsePlan.available ===
        true &&
      !responsePlan
        .responseMoves
        .length
    ) {
      errors.push({
        type:
          "canonical_response_moves_missing",

        message:
          "The canonical Response Plan contains no response moves."
      });
    }

    if (
      characterContext
        .answerAvailable ===
        true &&
      !characterContext.draftAvailable
    ) {
      errors.push({
        type:
          "character_answer_without_draft",

        message:
          "Character Reasoning reported an answer but did not provide a user-facing draft."
      });
    }

    if (
      characterContext
        .answerAvailable ===
        true &&
      characterContext.grounding
        ?.grounded !==
        true
    ) {
      errors.push({
        type:
          "character_answer_not_grounded",

        message:
          "Character Reasoning reported an answer without grounded character authority."
      });
    }

    return errors;
  },

  buildComposerWarnings({
    request = {},
    responsePlan = {},
    continuityContext = {},
    characterContext = {}
  } = {}) {
    const warnings = [];

    if (
      request.turnId &&
      responsePlan.turnId &&
      request.turnId !==
        responsePlan.turnId
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
      continuityContext.required &&
      !continuityContext.available
    ) {
      warnings.push({
        type:
          "required_continuity_unavailable"
      });
    }

    if (
      continuityContext
        .unresolvedReferences
        .length >
        0 &&
      responsePlan
        .shouldAskQuestion !==
        true
    ) {
      warnings.push({
        type:
          "unresolved_references_without_question_policy",

        count:
          continuityContext
            .unresolvedReferences
            .length
      });
    }

    if (
      characterContext
        .requestedAuthoritiesSatisfied ===
        false
    ) {
      warnings.push({
        type:
          "requested_character_authority_unavailable",

        missing:
          characterContext
            .missingRequestedAuthorities ||
          []
      });
    }

    if (
      characterContext
        .answerAvailable ===
        true &&
      characterContext
        .deterministicDraftAvailable !==
        true
    ) {
      warnings.push({
        type:
          "character_answer_without_deterministic_draft"
      });
    }

    if (
      characterContext
        .status
        ?.preferenceStatus ===
        "canonical" &&
      !characterContext
        .grounding
        ?.canonicalValue
    ) {
      warnings.push({
        type:
          "canonical_preference_value_missing"
      });
    }

    if (
      characterContext
        .status
        ?.preferenceStatus ===
        "inferred" &&
      characterContext
        .realization
        ?.tentativeLanguageRequired !==
        true
    ) {
      warnings.push({
        type:
          "inferred_preference_missing_tentative_language_rule"
      });
    }

    if (
      characterContext
        .status
        ?.open ===
        true &&
      characterContext
        .realization
        ?.preserveOpenStatus !==
        true
    ) {
      warnings.push({
        type:
          "open_character_status_not_protected"
      });
    }

    return warnings;
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

      /*
       * Focused character evidence only.
       *
       * Entire preference collections and entire worldview maps
       * are intentionally not exposed to writers.
       */
      character: {
        available:
          characterContext.available,

        enabled:
          characterContext.enabled,

        relevant:
          characterContext.relevant,

        answerAvailable:
          characterContext
            .answerAvailable,

        guidanceAvailable:
          characterContext
            .guidanceAvailable,

        mode:
          characterContext.mode,

        type:
          characterContext.type,

        subtype:
          characterContext.subtype,

        focus:
          characterContext.focus,

        subject:
          characterContext.subject,

        status:
          characterContext.status,

        draft:
          characterContext.draft,

        deterministicDraft:
          characterContext
            .deterministicDraft,

        grounding:
          characterContext.grounding,

        groundedMeaning:
          characterContext
            .groundedMeaning,

        realization:
          characterContext.realization,

        relationship:
          characterContext.relationship,

        implementationDisclosure:
          characterContext
            .implementationDisclosure,

        responseControl:
          characterContext
            .responseControl,

        authorityChain:
          characterContext
            .authorityChain,

        authorityPacket:
          characterContext
            .authorityPacket,

        requestedAuthoritiesSatisfied:
          characterContext
            .requestedAuthoritiesSatisfied,

        missingRequestedAuthorities:
          characterContext
            .missingRequestedAuthorities
      },

      characterContext,

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
        summary.reasoningStagePacket ||
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
          summary
            .memoryContextResult ||
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
              developerContext
                .packet
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
          summary.blueprintWriterRan ===
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
     RESPONSE CONTROL HELPERS
  ===================================================== */

  mergeResponseControls(
    ...controls
  ) {
    return {
      requiredBehaviors:
        this.mergeUnique(
          ...controls.map(
            control =>
              control
                ?.requiredBehaviors
          )
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          ...controls.map(
            control =>
              control
                ?.forbiddenBehaviors
          )
        ),

      constraints:
        this.mergeUnique(
          ...controls.map(
            control =>
              control
                ?.constraints
          )
        )
    };
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canPackageComposerContext:
        true,

      canExposeDerivedCompatibilityAliases:
        true,

      canFilterIrrelevantDeveloperEvidence:
        true,

      canPreserveCanonicalResponsePlan:
        true,

      canPreserveFocusedCharacterHandoff:
        true,

      canPreserveCharacterStatus:
        true,

      canPreserveCharacterGrounding:
        true,

      canPreserveCharacterRealizationPolicy:
        true,

      canMergeSupportingResponseConstraints:
        true,

      canCreateFallbackResponsePlan:
        false,

      canAddResponseMoves:
        false,

      canRemoveResponseMoves:
        false,

      canReorderResponseMoves:
        false,

      canRewriteWriterInstructions:
        false,

      canResolveCharacterPreference:
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

      canInterpretCurrentMeaning:
        false,

      canChangeRequestedOperation:
        false,

      canChangeResponsePlan:
        false,

      canOverrideSafety:
        false,

      canRetrieveUserMemory:
        false,

      canStoreUserMemory:
        false,

      canAccessSupabase:
        false,

      canWriteFinalLanguage:
        false,

      canSelectFinalDraft:
        false,

      canPersistState:
        false,

      role:
        "canonical_response_plan_and_focused_expression_packaging_handoff"
    };
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const errors = [];
    const warnings = [];

    const authority =
      this.getAuthorityBoundaries();

    if (
      authority
        .canAddResponseMoves ===
      true
    ) {
      errors.push(
        "composer_bridge_may_not_add_response_moves"
      );
    }

    if (
      authority
        .canRewriteWriterInstructions ===
      true
    ) {
      errors.push(
        "composer_bridge_may_not_rewrite_writer_instructions"
      );
    }

    if (
      authority
        .canResolveCharacterPreference ===
      true
    ) {
      errors.push(
        "composer_bridge_may_not_resolve_character_preferences"
      );
    }

    if (
      authority
        .canCreateCanonicalPreference ===
      true
    ) {
      errors.push(
        "composer_bridge_may_not_create_canonical_preferences"
      );
    }

    if (
      authority
        .canPromoteInferenceToCanonical ===
      true
    ) {
      errors.push(
        "composer_bridge_may_not_promote_inference"
      );
    }

    if (
      authority
        .canCreateWorldviewPosition ===
      true
    ) {
      errors.push(
        "composer_bridge_may_not_create_worldview_positions"
      );
    }

    if (
      authority
        .canExposeEntirePreferenceCollection ===
      true
    ) {
      errors.push(
        "composer_bridge_may_not_expose_entire_preference_collection"
      );
    }

    if (
      authority
        .canExposeEntireWorldviewCollection ===
      true
    ) {
      errors.push(
        "composer_bridge_may_not_expose_entire_worldview_collection"
      );
    }

    if (
      authority.canAccessSupabase ===
      true
    ) {
      errors.push(
        "composer_bridge_may_not_access_supabase"
      );
    }

    if (
      authority
        .canWriteFinalLanguage ===
      true
    ) {
      errors.push(
        "composer_bridge_may_not_write_final_language"
      );
    }

    if (
      authority
        .canSelectFinalDraft ===
      true
    ) {
      errors.push(
        "composer_bridge_may_not_select_final_draft"
      );
    }

    if (
      !window.AriCharacterStage
    ) {
      warnings.push(
        "ari_character_stage_not_loaded"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      source:
        "ari-composer-bridge-validation",

      version:
        this.version,

      errors,
      warnings,

      checks: {
        responsePlanMutationDisabled:
          authority
            .canAddResponseMoves ===
          false,

        writerInstructionMutationDisabled:
          authority
            .canRewriteWriterInstructions ===
          false,

        characterResolutionSeparated:
          authority
            .canResolveCharacterPreference ===
          false,

        canonicalCreationDisabled:
          authority
            .canCreateCanonicalPreference ===
          false,

        inferencePromotionDisabled:
          authority
            .canPromoteInferenceToCanonical ===
          false,

        worldviewCreationDisabled:
          authority
            .canCreateWorldviewPosition ===
          false,

        entirePreferenceCollectionSuppressed:
          authority
            .canExposeEntirePreferenceCollection ===
          false,

        entireWorldviewCollectionSuppressed:
          authority
            .canExposeEntireWorldviewCollection ===
          false,

        supabaseDisabled:
          authority
            .canAccessSupabase ===
          false,

        finalLanguageAuthorityDisabled:
          authority
            .canWriteFinalLanguage ===
          false,

        finalDraftSelectionDisabled:
          authority
            .canSelectFinalDraft ===
          false,

        characterStageAvailable:
          Boolean(
            window.AriCharacterStage
          )
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
        none: 0,
        very_low: 0.2,
        low: 0.4,
        medium: 0.65,
        medium_high: 0.75,
        high: 0.85,
        very_high: 0.95,
        critical: 0.98
      };

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
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return 0;
    }

    if (number > 1) {
      return Math.max(
        0,
        Math.min(
          1,
          number / 100
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

  mergeUnique(
    ...values
  ) {
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
                value.claim ||
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
        /\s+/g,
        " "
      )
      .trim();
  },

  normalize(
    value = ""
  ) {
    return this
      .cleanOriginal(value)
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

window.Ari.composerBridge =
  window.AriComposerBridge;

console.log(
  "ARI COMPOSER BRIDGE LOADED:",
  window.AriComposerBridge
    ?.version,
  window.AriComposerBridge
    ?.validate?.().valid ===
    true
    ? "READY"
    : "INVALID"
);