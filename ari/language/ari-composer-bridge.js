// ari/language/ari-composer-bridge.js
// Ari Composer Bridge
//
// Purpose:
// Package the completed canonical Response Plan and its supporting
// deliberation evidence into one Composer Packet.
//
// V2.1.0 — Canonical Plan Preservation / No Independent Planning
//
// Architectural flow:
//
// Deliberation Packet
//      ↓
// Canonical Response Plan
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
// - Provide compatibility aliases derived from the canonical plan.
// - Suppress irrelevant developer evidence.
// - Produce one structured Composer Packet.
//
// Non-responsibilities:
// - Does not create a fallback response plan.
// - Does not choose a response goal.
// - Does not choose a response shape.
// - Does not add, remove, reorder, or replace response moves.
// - Does not override safety policy.
// - Does not rewrite writer instructions.
// - Does not reinterpret the current user turn.
// - Does not write final user-facing language.
// - Does not select the final response candidate.
// - Does not persist state.

window.Ari = window.Ari || {};

window.AriComposerBridge = {
  version: "2.1.0",
  schemaVersion: "1.1.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  build(input = {}) {
    const summary = input.summary || input || {};
    const request = this.buildRequest(summary);
    const responsePlan = this.resolveResponsePlan(summary);
    const responseStrategy = this.resolveResponseStrategy({ summary, responsePlan });

    const developerContext = this.resolveDeveloperContext({
      summary,
      request,
      responsePlan,
      responseStrategy
    });

    const characterContext = this.resolveCharacterContext(summary);
    const continuityContext = this.resolveContinuityContext(summary);
    const safetyContext = this.resolveSafetyContext(summary);
    const knowledgeContext = this.resolveKnowledgeContext(summary);
    const languageContext = this.resolveLanguageContext(summary);

    const responseControl = this.buildResponseControl({
      responsePlan,
      responseStrategy
    });

    const evidence = this.buildEvidence({
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

    const packet = this.buildComposerPacket({
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

    window.Ari.composerPacket = packet;
    window.Ari.composerBridgeState = packet;

    return {
      composerPacketReady: packet.ready === true,
      composerPacket: packet,
      composerBridgeRan: true,
      composerBridgeSource: "ari-composer-bridge",
      composerBridgeVersion: this.version,
      composerBridgeSchemaVersion: this.schemaVersion,
      canonicalResponsePlanAvailable: responsePlan.available === true,
      canonicalResponsePlanReady: responsePlan.ready === true,
      canonicalResponsePlanSource: responsePlan.source || null,
      composerResponseMoves: responseControl.responseMoves,
      composerAdvicePolicy: responseControl.advicePolicy,
      composerShouldAskQuestion: responseControl.questionPolicy.shouldAskQuestion,
      composerWriterInstructions: responseControl.writerInstructions
    };
  },

  /* =====================================================
     REQUEST
  ===================================================== */

  buildRequest(summary = {}) {
    const planTurn =
      summary.responsePlanningHandoff?.responsePlan?.turn ||
      summary.responsePlanningStagePacket?.planner?.value?.responsePlan?.turn ||
      summary.responsePlanningStagePacket?.planner?.value?.turn ||
      summary.ariResponsePlan?.responsePlan?.turn ||
      summary.ariResponsePlan?.turn ||
      summary.responsePlan?.turn ||
      {};

    const continuityTurn =
      summary.continuityStagePacket?.currentTurn ||
      summary.continuityCurrentTurn ||
      {};

    const originalText = this.cleanOriginal(
      planTurn.originalText ||
      continuityTurn.originalText ||
      summary.originalUserMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const normalizedText = this.normalize(
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
      schema: "ari_composer_request",
      schemaVersion: this.schemaVersion,
      turnId,
      originalText,
      currentText: originalText,
      normalizedText,
      resolvedText: originalText,
      textWasRewritten: false,
      originalTextPreserved: true,
      currentTurnWasStructurallyResolved:
        planTurn.currentTurnWasSemanticallyResolved === true ||
        continuityTurn.currentTurnWasResolved === true ||
        summary.currentTurnWasResolved === true,
      requiresPriorContext:
        summary.routingContract?.contextLane === "continuity_follow_up" ||
        summary.routingContract?.contextLane === "relationship_continuity" ||
        summary.routingContract?.contextLane === "correction_or_revision" ||
        summary.continuityEligibility?.eligible === true,
      contextLane:
        summary.routingContract?.contextLane ||
        summary.contextLane ||
        summary.laneSplit?.lane ||
        "direct_current_turn",
      authority: "original_current_turn_only"
    };
  },

  /* =====================================================
     CANONICAL RESPONSE PLAN
  ===================================================== */

  resolveResponsePlan(summary = {}) {
    const candidates = [
      summary.responsePlanningHandoff?.responsePlan,
      summary.responsePlanningStagePacket?.planner?.value?.responsePlan,
      summary.responsePlanningStagePacket?.planner?.value?.canonicalResponsePlan,
      summary.responsePlanningStagePacket?.planner?.value,
      summary.responseStrategy?.responsePlan,
      summary.ariResponsePlan?.responsePlan,
      summary.ariResponsePlan?.canonicalResponsePlan,
      summary.ariResponsePlan,
      summary.understandingResponsePlan?.responsePlan,
      summary.understandingResponsePlan?.canonicalResponsePlan,
      summary.understandingResponsePlan,
      summary.communicationPlan?.responsePlan,
      summary.canonicalResponsePlan,
      summary.responsePlan
    ];

    const found =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object" &&
        !Array.isArray(candidate) &&
        (
          candidate.schema === "ari_response_plan" ||
          candidate.responsePlan?.schema === "ari_response_plan" ||
          candidate.canonicalResponsePlan?.schema === "ari_response_plan" ||
          candidate.responsePlannerRan === true
        )
      ) || null;

    const canonical =
      found?.schema === "ari_response_plan"
        ? found
        : found?.responsePlan?.schema === "ari_response_plan"
          ? found.responsePlan
          : found?.canonicalResponsePlan?.schema === "ari_response_plan"
            ? found.canonicalResponsePlan
            : null;

    if (!canonical) {
      return this.buildMissingResponsePlanRecord();
    }

    const moves = this.normalizeResponseMoves(
      canonical.moves ||
      canonical.responseMoves ||
      []
    );

    const writerInstructions = this.preserveWriterInstructions(
      canonical.writerInstructions || {}
    );

    const interactionPolicy = canonical.interactionPolicy || {};
    const governance = canonical.governance || {};
    const strategy = canonical.strategy || {};
    const blueprint = canonical.blueprint || {};

    return {
      schema: "ari_response_plan",
      schemaVersion: canonical.schemaVersion || null,
      available: true,
      ready: canonical.ready === true,
      usable: canonical.usable === true,
      source: canonical.source || canonical.responsePlannerSource || "ari-response-planner",
      version: canonical.version || canonical.responsePlannerVersion || null,

      turn: canonical.turn || null,
      turnId: canonical.turn?.turnId || canonical.turnId || null,
      sourceQuestion:
        canonical.turn?.originalText ||
        canonical.sourceQuestion ||
        canonical.userQuestion ||
        null,

      strategy,
      interpretation: canonical.interpretation || null,
      objective: canonical.objective || null,
      blueprint,
      moves,
      responseMoves: moves,
      governance,
      interactionPolicy,
      writerInstructions,
      personalization: canonical.personalization || null,
      provenance: canonical.provenance || null,
      validation: canonical.validation || null,
      quality: canonical.quality || null,
      handoff: canonical.handoff || null,
      confidence: this.normalizeConfidence(canonical.confidence ?? 0),

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
        canonical.interpretation?.currentNeed ||
        canonical.currentNeed ||
        strategy.currentNeed ||
        null,

      adviceRequested:
        interactionPolicy.adviceRequested === true ||
        canonical.adviceRequested === true,

      advicePolicy:
        interactionPolicy.advicePolicy ||
        canonical.advicePolicy ||
        strategy.advicePolicy ||
        null,

      coachingPermissionRequired:
        interactionPolicy.coachingPermissionRequired === true ||
        canonical.coachingPermissionRequired === true,

      shouldAskQuestion:
        interactionPolicy.shouldAskQuestion === true ||
        canonical.shouldAskQuestion === true,

      questionPurpose:
        interactionPolicy.questionPurpose ||
        canonical.questionPurpose ||
        null,

      maxQuestions:
        this.firstFiniteNumber([
          interactionPolicy.maxQuestions,
          writerInstructions.maxQuestions,
          0
        ]),

      responseOrder: moves.map(move => move.id),

      requiredBehaviors: this.mergeUnique(
        governance.requiredBehaviors,
        canonical.requiredBehaviors,
        canonical.required,
        writerInstructions.required,
        writerInstructions.requiredBehaviors
      ),

      forbiddenBehaviors: this.mergeUnique(
        governance.forbiddenBehaviors,
        canonical.forbiddenBehaviors,
        canonical.avoid,
        writerInstructions.avoid,
        writerInstructions.forbiddenBehaviors
      ),

      constraints: this.mergeUnique(
        governance.constraints,
        canonical.constraints,
        writerInstructions.constraints
      ),

      responseRules: this.mergeUnique(
        governance.responseRules,
        canonical.responseRules,
        writerInstructions.responseRules,
        writerInstructions.rules
      ),

      blueprintHint:
        blueprint.id ||
        canonical.blueprintHint ||
        null,

      communicationPlan: canonical.communicationPlan || null,
      composerDirective: canonical.composerDirective || null,
      raw: canonical,

      authority: {
        canDefineResponseGoal: false,
        canDefineResponseShape: false,
        canDefineResponseMoves: false,
        canDefineAdvicePolicy: false,
        canDefineQuestionPolicy: false,
        canDefineWriterInstructions: false,
        canWriteFinalLanguage: false,
        canSelectFinalDraft: false,
        role: "canonical_response_plan_preservation_only"
      }
    };
  },

  buildMissingResponsePlanRecord() {
    return {
      schema: "ari_response_plan",
      schemaVersion: null,
      available: false,
      ready: false,
      usable: false,
      source: null,
      version: null,
      turn: null,
      turnId: null,
      sourceQuestion: null,
      strategy: {},
      interpretation: null,
      objective: null,
      blueprint: {},
      moves: [],
      responseMoves: [],
      governance: {},
      interactionPolicy: {},
      writerInstructions: {},
      personalization: null,
      provenance: null,
      validation: {
        valid: false,
        errors: [
          {
            type: "canonical_response_plan_missing",
            message: "The Composer Bridge did not receive a canonical Response Plan."
          }
        ],
        warnings: []
      },
      quality: null,
      handoff: null,
      confidence: 0,
      responseGoal: null,
      responseShape: null,
      responsePosture: null,
      currentNeed: null,
      adviceRequested: false,
      advicePolicy: null,
      coachingPermissionRequired: false,
      shouldAskQuestion: false,
      questionPurpose: null,
      maxQuestions: 0,
      responseOrder: [],
      requiredBehaviors: [],
      forbiddenBehaviors: [],
      constraints: [],
      responseRules: [],
      blueprintHint: null,
      communicationPlan: null,
      composerDirective: null,
      raw: null,
      authority: {
        canCreateFallbackResponsePlan: false,
        canInterpretMeaning: false,
        canWriteFinalLanguage: false,
        role: "missing_canonical_response_plan_record"
      }
    };
  },

  normalizeResponseMoves(moves = []) {
    return this.toArray(moves)
      .map((move, index) => {
        if (typeof move === "string") {
          const id = this.normalizeIdentifier(move);

          return id
            ? {
                id,
                order: index,
                type: "response_move",
                required: true,
                userFacing: true,
                renderPolicy: "render_or_ai_repair",
                purpose: null,
                contentGuidance: null,
                contentHint: null,
                evidenceRefs: [],
                source: "canonical_response_plan",
                raw: move
              }
            : null;
        }

        if (!move || typeof move !== "object") {
          return null;
        }

        const id = this.normalizeIdentifier(
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
          order: Number.isFinite(Number(move.order)) ? Number(move.order) : index,
          type: move.type || "response_move",
          family: move.family || null,
          renderer: move.renderer || null,
          purpose: move.purpose || null,
          required: move.required !== false,
          registered: move.registered !== false,
          userFacing: move.userFacing !== false,
          renderPolicy:
            move.renderPolicy ||
            (
              move.userFacing === false
                ? "instruction_only"
                : "render_or_ai_repair"
            ),
          contentGuidance: move.contentGuidance || null,
          contentHint: move.contentHint || move.hint || null,
          evidenceRefs: this.toArray(move.evidenceRefs),
          authority: move.authority || null,
          source: move.source || "canonical_response_plan",
          raw: move.raw || move
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.order - b.order);
  },

  preserveWriterInstructions(instructions = {}) {
    if (!instructions || typeof instructions !== "object") {
      return {};
    }

    return {
      ...instructions,
      responseMoves: this.normalizeResponseMoves(
        instructions.responseMoves ||
        instructions.moves ||
        []
      ),
      required: this.toArray(instructions.required),
      requiredBehaviors: this.toArray(instructions.requiredBehaviors),
      avoid: this.toArray(instructions.avoid),
      forbiddenBehaviors: this.toArray(instructions.forbiddenBehaviors),
      constraints: this.toArray(instructions.constraints),
      rules: this.toArray(instructions.rules),
      responseRules: this.toArray(instructions.responseRules),
      doNotWrite: this.toArray(instructions.doNotWrite)
    };
  },

  /* =====================================================
     RESPONSE STRATEGY
  ===================================================== */

  resolveResponseStrategy({ summary = {}, responsePlan = {} } = {}) {
    const canonicalStrategy = responsePlan.strategy || {};
    const legacyStrategy =
      summary.responsePlanningHandoff?.responseStrategy ||
      summary.responsePlanningStagePacket?.strategy ||
      summary.responseStrategy ||
      {};

    return {
      ready: responsePlan.ready === true,
      source: canonicalStrategy.source || responsePlan.source || null,
      responseGoal: responsePlan.responseGoal,
      responseShape: responsePlan.responseShape,
      responsePosture: responsePlan.responsePosture,
      currentNeed: responsePlan.currentNeed,
      answerMode: canonicalStrategy.answerMode || null,
      desiredOutcome: canonicalStrategy.desiredOutcome || null,
      responseOrder: responsePlan.responseOrder,
      primaryLane:
        canonicalStrategy.primaryLane ||
        legacyStrategy.primaryLane ||
        summary.routingContract?.primaryLane ||
        summary.primaryLane ||
        null,
      contextLane:
        canonicalStrategy.contextLane ||
        legacyStrategy.contextLane ||
        summary.routingContract?.contextLane ||
        summary.contextLane ||
        null,
      planner:
        canonicalStrategy.planner ||
        legacyStrategy.planner ||
        summary.routingContract?.planner ||
        summary.selectedPlanner ||
        null,
      mode:
        legacyStrategy.mode ||
        summary.routingContract?.mode ||
        summary.conversationMode ||
        "unknown",
      intent:
        legacyStrategy.intent ||
        summary.routingContract?.primaryIntent ||
        summary.primaryIntent ||
        "unknown",
      domain:
        legacyStrategy.domain ||
        summary.routingContract?.domain ||
        summary.conversationDomain ||
        "general",
      requiredBehaviors: responsePlan.requiredBehaviors,
      forbiddenBehaviors: responsePlan.forbiddenBehaviors,
      constraints: responsePlan.constraints,
      rules: responsePlan.responseRules,
      communicationPlan: responsePlan.communicationPlan,
      composerDirective: responsePlan.composerDirective,
      personalization: responsePlan.personalization || null,
      confidence: responsePlan.confidence,
      raw: canonicalStrategy,
      authority: {
        canDescribeCanonicalStrategy: true,
        canOverrideCanonicalResponsePlan: false,
        canWriteFinalLanguage: false,
        role: "canonical_response_strategy_projection"
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
      summary.composerDeveloperPacket?.enabled === true
        ? summary.composerDeveloperPacket
        : null;

    const responseLocked =
      summary.developerResponseLocked === true ||
      summary.responseLocked === true ||
      rawPacket?.locked === true;

    const relevant = this.isDeveloperRelevant({
      summary,
      request,
      responsePlan,
      responseStrategy
    });

    const allowed = responseLocked || relevant;
    const packet = allowed ? rawPacket : null;

    const lockedReply = responseLocked
      ? (
          rawPacket?.reply ||
          rawPacket?.finalResponse ||
          summary.developerHandoff?.reply ||
          summary.developerHandoff?.finalResponse ||
          summary.developerReply ||
          summary.developerResponse ||
          null
        )
      : null;

    return {
      applicable: relevant,
      relevant,
      allowed,
      locked: responseLocked,
      advisory: Boolean(packet && !responseLocked),
      packet,
      lockedReply,
      githubEvidenceAllowed: allowed,
      codeEvidenceAllowed: allowed,
      staleEvidenceSuppressed: !allowed,
      reason:
        responseLocked
          ? "developer_response_locked"
          : relevant
            ? "current_request_is_developer_related"
            : "developer_context_not_relevant_to_current_request",
      authority: {
        lockedReplyMayBeFinal: responseLocked,
        advisoryPacketMayBeFinal: false,
        staleEvidenceMayBeUsed: false,
        role: "developer_evidence_access_policy"
      }
    };
  },

  isDeveloperRelevant({
    summary = {},
    request = {},
    responsePlan = {},
    responseStrategy = {}
  } = {}) {
    const text = this.normalize(request.originalText || "");

    const primary = this.normalizeIdentifier(
      responseStrategy.primaryLane ||
      summary.primaryLane ||
      summary.situationContractPrimary ||
      summary.situationContract?.primary ||
      ""
    );

    const mode = this.normalizeIdentifier(
      responseStrategy.mode ||
      summary.routingContract?.mode ||
      ""
    );

    const intent = this.normalizeIdentifier(
      responseStrategy.intent ||
      summary.routingContract?.primaryIntent ||
      ""
    );

    const blueprint = this.normalizeIdentifier(
      responsePlan.blueprintHint ||
      ""
    );

    const explicitFile =
      /\b[\w./-]+\.(?:js|mjs|cjs|html|css|json|md|ts|tsx|jsx|sql|py|yml|yaml)\b/i.test(
        request.originalText || ""
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
      ["developer", "builder", "coding", "project_help", "developer_artifact"].includes(primary) ||
      ["developer", "builder"].includes(mode) ||
      intent.includes("developer") ||
      intent.includes("build_or_debug") ||
      blueprint.includes("builder") ||
      summary.shouldRunDeveloperLayer === true;

    return Boolean(
      developerAuthority ||
      explicitFile ||
      (developerEntities && developerActions)
    );
  },

  /* =====================================================
     CHARACTER
  ===================================================== */

  resolveCharacterContext(summary = {}) {
    const character =
      summary.composerCharacter ||
      summary.characterHandoff ||
      summary.characterExpression?.composerCharacter ||
      summary.characterExpression?.composerCharacterPacket ||
      null;

    const identity =
      summary.characterIdentity ||
      summary.assembledContext?.characterIdentity ||
      summary.advisoryContext?.characterIdentity ||
      summary.continuityContext?.characterIdentity ||
      null;

    const stablePreferences =
      identity?.stablePreferences ||
      identity?.preferences?.stablePreferences ||
      character?.stablePreferences ||
      character?.preferences?.stablePreferences ||
      {};

    const preferences =
      identity?.preferences ||
      character?.preferences ||
      {};

    return {
      available: Boolean(character || identity),
      character,
      identity,
      stablePreferences,
      preferences,
      useAllowed:
        identity?.useAllowed !== false &&
        character?.enabled !== false,
      authority: "character_voice_and_preference_advisory_only"
    };
  },

  /* =====================================================
     CONTINUITY
  ===================================================== */

  resolveContinuityContext(summary = {}) {
    const stagePacket = summary.continuityStagePacket || null;

    const packet =
      summary.continuityPacket ||
      stagePacket?.continuityPacket?.raw ||
      null;

    const context =
      stagePacket?.contextAssembler?.continuityContext ||
      summary.continuityContext ||
      summary.assembledContext ||
      null;

    const binding =
      stagePacket?.referenceResolution?.binding ||
      summary.continuityReferenceBinding ||
      null;

    const facts = this.toArray(
      packet?.usableFacts ||
      stagePacket?.continuityPacket?.usableFacts ||
      summary.continuityUsableFacts
    );

    const resolvedReferences = this.toArray(
      packet?.referenceResolution?.resolvedReferences ||
      packet?.resolvedReferences ||
      stagePacket?.referenceResolution?.resolvedReferences ||
      summary.continuityResolvedReferences
    );

    const unresolvedReferences = this.toArray(
      packet?.referenceResolution?.unresolvedReferences ||
      packet?.unresolvedReferences ||
      stagePacket?.referenceResolution?.unresolvedReferences ||
      summary.continuityUnresolvedReferences
    );

    return {
      available: Boolean(stagePacket || packet || context),
      required:
        stagePacket?.quality?.continuityRequired === true ||
        summary.continuityEligibility?.eligible === true,
      stagePacket,
      packet,
      context,
      activeDialogueState:
        summary.activeDialogueState ||
        stagePacket?.contextAssembler?.activeDialogueState ||
        summary.assembledContext?.activeDialogueState ||
        summary.advisoryContext?.activeDialogueState ||
        summary.continuityContext?.activeDialogueState ||
        null,
      binding,
      facts,
      resolvedReferences,
      unresolvedReferences,
      referenceClarificationRequired: unresolvedReferences.length > 0,
      currentTurnTextPreserved: stagePacket?.currentTurn?.textWasRewritten !== true,
      authority: "structured_continuity_context_only"
    };
  },

  /* =====================================================
     SAFETY
  ===================================================== */

  resolveSafetyContext(summary = {}) {
    const stagePacket = summary.safetyStagePacket || null;

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
      summary.safetyApplicable === true ||
      stagePacket?.applicable === true ||
      disposition.applicable === true ||
      riskLevel !== "none";

    const shouldStopNormalResponse =
      summary.safetyShouldStopNormalResponse === true ||
      disposition.shouldStopNormalResponse === true ||
      stagePacket?.shouldStopNormalResponse === true;

    return {
      applicable,
      shouldStopNormalResponse,
      requiresClarification:
        summary.safetyRequiresClarification === true ||
        disposition.requiresClarification === true ||
        stagePacket?.requiresClarification === true,
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
        summary.safetyCommunicationStyle ||
        disposition.communicationStyle ||
        null,
      requiredBehaviors: this.mergeUnique(
        disposition.requiredBehaviors,
        stagePacket?.requiredBehaviors,
        stagePacket?.responseControl?.requiredBehaviors
      ),
      forbiddenBehaviors: this.mergeUnique(
        disposition.forbiddenBehaviors,
        stagePacket?.forbiddenBehaviors,
        stagePacket?.responseControl?.forbiddenBehaviors
      ),
      constraints: this.mergeUnique(
        disposition.constraints,
        stagePacket?.constraints,
        stagePacket?.responseControl?.constraints
      ),
      contract:
        summary.safetyResponseContract ||
        stagePacket?.contract ||
        disposition.contract ||
        null,
      gate: summary.safetyContextGate || null,
      deepReview: summary.deepSafetyResult || null,
      disposition,
      stagePacket,
      authorityBoundary: "safety_governance_is_authoritative"
    };
  },

  /* =====================================================
     KNOWLEDGE
  ===================================================== */

  resolveKnowledgeContext(summary = {}) {
    const retrievalResults = this.toArray(
      summary.knowledgeRetrievalResults ||
      summary.knowledgeRouter?.knowledgeRetrievalResults
    );

    const nodes = this.toArray(
      retrievalResults[0]?.nodes ||
      summary.knowledgeNodes
    );

    const meaning =
      summary.knowledgeMeaning ||
      summary.knowledgeSynthesis ||
      null;

    return {
      available: Boolean(
        summary.knowledgeAnswer ||
        meaning ||
        nodes.length ||
        retrievalResults.length
      ),
      routerRan: summary.knowledgeRouterRan === true,
      shouldUseKnowledge: summary.shouldUseKnowledge !== false,
      provider: summary.knowledgeProvider || null,
      confidence: summary.knowledgeConfidence || null,
      sources: this.toArray(summary.knowledgeSources),
      answer: summary.knowledgeAnswer || null,
      nodes,
      meaning,
      synthesis:
        summary.knowledgeSynthesis ||
        meaning ||
        null,
      blueprintHandoff:
        summary.blueprintKnowledgeHandoff ||
        meaning?.blueprintHandoff ||
        summary.knowledgeSynthesis?.blueprintHandoff ||
        null,
      retrievalPlan: summary.knowledgeRetrievalPlan || null,
      retrievalResults,
      authority: "retrieved_knowledge_evidence_only"
    };
  },

  /* =====================================================
     LANGUAGE CONTEXT
  ===================================================== */

  resolveLanguageContext(summary = {}) {
    const communicationPlan = summary.communicationPlan || {};
    const profile = summary.humanLanguageProfile || {};
    const guidance = summary.languageGuidanceHandoff || {};
    const mouth = summary.mouthDirector || {};

    return {
      communicationPlan,
      humanLanguageProfile: profile,
      languageGuidance: guidance,
      mouthDirective:
        summary.mouthDirective ||
        summary.situationContract?.mouthDirective ||
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
        summary.lexicalGrounding?.preferredTerms ||
        summary.lexicalGroundingOutput?.preferredTerms ||
        {},
      blueprintHint:
        summary.blueprintHint ||
        mouth.blueprintHint ||
        null,
      responseAvoid: this.mergeUnique(
        summary.responseAvoid,
        mouth.responseAvoid,
        guidance.forbiddenBehaviors
      ),
      responseRequired: this.mergeUnique(
        summary.responseRequired,
        mouth.responseRequired,
        guidance.requiredBehaviors
      ),
      authority: "language_and_expression_guidance_only"
    };
  },

  /* =====================================================
     RESPONSE CONTROL
  ===================================================== */

  buildResponseControl({
    responsePlan = {},
    responseStrategy = {}
  } = {}) {
    const interactionPolicy = responsePlan.interactionPolicy || {};
    const writerInstructions = responsePlan.writerInstructions || {};

    return {
      responseGoal: responsePlan.responseGoal,
      responseShape: responsePlan.responseShape,
      responsePosture: responsePlan.responsePosture,
      responseOrder: responsePlan.responseOrder,
      responseMoves: responsePlan.responseMoves,
      currentNeed: responsePlan.currentNeed,
      adviceRequested: responsePlan.adviceRequested,
      advicePolicy: responsePlan.advicePolicy,
      coachingPermissionRequired: responsePlan.coachingPermissionRequired,

      questionPolicy: {
        shouldAskQuestion: responsePlan.shouldAskQuestion === true,
        questionRequired:
          writerInstructions.questionRequired === true ||
          interactionPolicy.shouldAskQuestion === true,
        purpose: responsePlan.questionPurpose,
        maximumQuestions: responsePlan.maxQuestions ?? 0
      },

      requiredBehaviors: responsePlan.requiredBehaviors,
      forbiddenBehaviors: responsePlan.forbiddenBehaviors,
      constraints: responsePlan.constraints,
      rules: responsePlan.responseRules,
      blueprintHint: responsePlan.blueprintHint,
      communicationPlan:
        responsePlan.communicationPlan ||
        responseStrategy.communicationPlan ||
        null,
      composerDirective:
        responsePlan.composerDirective ||
        responseStrategy.composerDirective ||
        null,
      writerInstructions,
      canonicalResponsePlanReady: responsePlan.ready === true,
      canonicalResponsePlanAvailable: responsePlan.available === true,
      authority: "derived_canonical_response_plan_aliases_only"
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
      responsePlan.available === true &&
      responsePlan.ready === true &&
      responsePlan.usable === true;

    const ready = Boolean(
      lockedDeveloperReply ||
      (
        request.originalText &&
        canonicalPlanReady
      )
    );

    return {
      schema: "ari_composer_packet",
      schemaVersion: this.schemaVersion,
      ready,
      usable: ready,
      source: "ari-composer-bridge",
      version: this.version,
      createdAt: new Date().toISOString(),

      request,

      /*
       * Current-turn compatibility aliases.
       */
      turnId: request.turnId,
      userQuestion: request.originalText,
      originalUserQuestion: request.originalText,
      resolvedUserQuestion: request.originalText,
      currentTurnText: request.originalText,
      currentTurnTextPreserved: true,

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
      canonicalResponsePlan: responsePlan,
      responsePlanAvailable: responsePlan.available === true,
      responsePlanReady: responsePlan.ready === true,
      responsePlanUsable: responsePlan.usable === true,

      /*
       * Derived compatibility aliases only.
       */
      responseStrategy,
      responseControl,
      responseGoal: responseControl.responseGoal,
      responseShape: responseControl.responseShape,
      responsePosture: responseControl.responsePosture,
      responseOrder: responseControl.responseOrder,
      responseMoves: responseControl.responseMoves,
      currentNeed: responseControl.currentNeed,
      adviceRequested: responseControl.adviceRequested,
      advicePolicy: responseControl.advicePolicy,
      coachingPermissionRequired: responseControl.coachingPermissionRequired,
      shouldAskQuestion: responseControl.questionPolicy.shouldAskQuestion,
      questionPurpose: responseControl.questionPolicy.purpose,
      writerInstructions: responseControl.writerInstructions,
      responseRules: responseControl.rules,
      responseConstraints: responseControl.constraints,
      requiredBehaviors: responseControl.requiredBehaviors,
      forbiddenBehaviors: responseControl.forbiddenBehaviors,
      responseRequired: responseControl.requiredBehaviors,
      responseAvoid: responseControl.forbiddenBehaviors,
      blueprintHint: responseControl.blueprintHint,
      communicationPlan: responseControl.communicationPlan,
      composerDirective: responseControl.composerDirective,

      /*
       * Supporting expression context.
       */
      expressionPlan: languageContext.expressionPlan,
      mouthDirective: languageContext.mouthDirective,
      humanLanguageProfile: languageContext.humanLanguageProfile,
      languageGuidance: languageContext.languageGuidance,
      lexicalGrounding: languageContext.lexicalGrounding,
      preferredTerms: languageContext.preferredTerms,

      /*
       * Supporting evidence contexts.
       */
      continuity: continuityContext,
      activeDialogueState: continuityContext.activeDialogueState,
      character: characterContext.character,
      characterIdentity: characterContext.identity,
      characterContext,
      safety: safetyContext,
      knowledge: knowledgeContext,
      developer: developerContext,
      developerPacket: developerContext.packet,
      hasDeveloperPacket: Boolean(developerContext.packet),
      developerPacketLocked: developerContext.locked,
      developerPacketAdvisory: developerContext.advisory,
      developerRelevant: developerContext.relevant,
      lockedDeveloperReply,
      thesis: this.buildThesis(summary),
      evidence,

      candidatePolicy: {
        deterministicWriterAllowed:
          canonicalPlanReady &&
          !developerContext.locked,

        aiWriterAllowed:
          canonicalPlanReady &&
          !developerContext.locked &&
          responsePlan.blueprint?.aiAllowed !== false,

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
          true
      },

      validation: {
        valid: ready,
        canonicalResponsePlanAvailable: responsePlan.available === true,
        canonicalResponsePlanReady: responsePlan.ready === true,
        canonicalResponsePlanUsable: responsePlan.usable === true,
        currentTurnAvailable: Boolean(request.originalText),
        lockedDeveloperReplyAvailable: Boolean(lockedDeveloperReply),
        errors: this.buildComposerErrors({
          request,
          responsePlan,
          lockedDeveloperReply
        }),
        warnings: this.buildComposerWarnings({
          request,
          responsePlan,
          continuityContext
        })
      },

      authority: {
        canPackageComposerContext: true,
        canExposeDerivedCompatibilityAliases: true,
        canFilterIrrelevantDeveloperEvidence: true,
        canPreserveCanonicalResponsePlan: true,
        canCreateFallbackResponsePlan: false,
        canAddResponseMoves: false,
        canRemoveResponseMoves: false,
        canReorderResponseMoves: false,
        canRewriteWriterInstructions: false,
        canInterpretCurrentMeaning: false,
        canChangeRequestedOperation: false,
        canChangeResponsePlan: false,
        canOverrideSafety: false,
        canWriteFinalLanguage: false,
        canSelectFinalDraft: false,
        canPersistState: false,
        role: "canonical_response_plan_packaging_handoff"
      }
    };
  },

  buildComposerErrors({
    request = {},
    responsePlan = {},
    lockedDeveloperReply = null
  } = {}) {
    const errors = [];

    if (lockedDeveloperReply) {
      return errors;
    }

    if (!request.originalText) {
      errors.push({
        type: "current_turn_missing",
        message: "The Composer Packet does not contain the original current-turn text."
      });
    }

    if (responsePlan.available !== true) {
      errors.push({
        type: "canonical_response_plan_missing",
        message: "The Composer Bridge did not receive a canonical Response Plan."
      });
    }

    if (
      responsePlan.available === true &&
      responsePlan.ready !== true
    ) {
      errors.push({
        type: "canonical_response_plan_not_ready",
        message: "The canonical Response Plan is present but not ready."
      });
    }

    if (
      responsePlan.available === true &&
      responsePlan.usable !== true
    ) {
      errors.push({
        type: "canonical_response_plan_not_usable",
        message: "The canonical Response Plan is present but not usable."
      });
    }

    if (
      responsePlan.available === true &&
      !responsePlan.responseMoves.length
    ) {
      errors.push({
        type: "canonical_response_moves_missing",
        message: "The canonical Response Plan contains no response moves."
      });
    }

    return errors;
  },

  buildComposerWarnings({
    request = {},
    responsePlan = {},
    continuityContext = {}
  } = {}) {
    const warnings = [];

    if (
      request.turnId &&
      responsePlan.turnId &&
      request.turnId !== responsePlan.turnId
    ) {
      warnings.push({
        type: "response_plan_turn_mismatch",
        requestTurnId: request.turnId,
        responsePlanTurnId: responsePlan.turnId
      });
    }

    if (
      continuityContext.required &&
      !continuityContext.available
    ) {
      warnings.push({
        type: "required_continuity_unavailable"
      });
    }

    if (
      continuityContext.unresolvedReferences.length > 0 &&
      responsePlan.shouldAskQuestion !== true
    ) {
      warnings.push({
        type: "unresolved_references_without_question_policy",
        count: continuityContext.unresolvedReferences.length
      });
    }

    return warnings;
  },

  buildThesis(summary = {}) {
    const contract = summary.situationContract || {};

    return {
      value:
        contract.situationThesis?.thesis ||
        summary.primarySituationThesis ||
        null,
      narrative:
        contract.situationThesis?.narrative ||
        summary.situationNarrative ||
        null,
      recommendedUse:
        contract.situationThesis?.recommendedUse ||
        summary.thesisRecommendedUse ||
        "do_not_use_as_authority",
      authority: "advisory_situation_summary_only"
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
      developerContext.allowed === true;

    return {
      request,
      perceptionPacket: summary.perceptionPacket || null,
      executivePacket: summary.executivePacket || null,
      deliberationPacket: summary.deliberationPacket || null,
      responsePlanningStagePacket:
        summary.responsePlanningStagePacket ||
        null,
      responsePlan,
      responseStrategy,

      continuity: {
        stagePacket: continuityContext.stagePacket,
        packet: continuityContext.packet,
        context: continuityContext.context,
        activeDialogueState: continuityContext.activeDialogueState,
        binding: continuityContext.binding,
        facts: continuityContext.facts,
        resolvedReferences: continuityContext.resolvedReferences,
        unresolvedReferences: continuityContext.unresolvedReferences
      },

      safety: safetyContext,
      character: characterContext.character,
      characterIdentity: characterContext.identity,
      characterPreferences: characterContext.stablePreferences,
      languageGuidance: languageContext.languageGuidance,
      humanLanguageProfile: languageContext.humanLanguageProfile,
      lexicalGrounding: languageContext.lexicalGrounding,
      preferredTerms: languageContext.preferredTerms,
      expressionPlan: languageContext.expressionPlan,
      knowledge: knowledgeContext,
      knowledgeMeaning: knowledgeContext.meaning,
      knowledgeSynthesis: knowledgeContext.synthesis,
      blueprintKnowledgeHandoff: knowledgeContext.blueprintHandoff,
      reasoning: summary.reasoning || summary.reasoningStagePacket || null,
      cognitiveExecutive: summary.cognitiveExecutive || null,

      understanding: {
        language: summary.languageUnderstanding || null,
        semantic: summary.semanticUnderstanding || null,
        event: summary.eventUnderstanding || null,
        meaning: summary.meaningInterpretation || null,
        humanState: summary.humanState || null,
        handoff: summary.understandingHandoff || null
      },

      memory: {
        retrieval: summary.memoryRetrieval || null,
        context:
          summary.memoryContext ||
          summary.memoryContextResult ||
          null,
        candidates: this.toArray(
          summary.memoryCandidates ||
          summary.memoryStagePacket?.candidates ||
          summary.memoryHandoff?.candidates
        ),
        facts: this.toArray(
          summary.memoryFacts ||
          summary.usableMemories
        ),
        handoff: summary.memoryHandoff || null
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
              summary.rebirthCodeUnderstanding ||
              null
            )
          : null,

      developerUnderstanding:
        allowDeveloperEvidence
          ? (
              summary.developerUnderstanding ||
              summary.rebirthDeveloperUnderstanding ||
              null
            )
          : null,

      developerIntent:
        allowDeveloperEvidence
          ? (
              summary.developerIntent ||
              developerContext.packet?.intent ||
              null
            )
          : null,

      developerHandoff:
        allowDeveloperEvidence
          ? summary.developerHandoff || null
          : null,

      developerResponse:
        allowDeveloperEvidence
          ? summary.developerResponse || null
          : null,

      developerReply:
        developerContext.locked
          ? developerContext.lockedReply
          : null,

      developerPacket:
        allowDeveloperEvidence
          ? developerContext.packet
          : null,

      developerEvidenceSuppressed:
        !allowDeveloperEvidence,

      aiWriter: {
        ran: summary.aiWriterRan === true,
        usedAI: summary.aiWriterUsedAI === true,
        draft: summary.aiWriterDraft || null,
        source: summary.aiWriterSource || null,
        version: summary.aiWriterVersion || null,
        fallbackReason: summary.aiWriterFallbackReason || null
      },

      blueprintWriter: {
        ran: summary.blueprintWriterRan === true,
        draft: summary.blueprintWriterDraft || null,
        blueprint: summary.blueprint || null,
        source: summary.blueprintWriterSource || null,
        version: summary.blueprintWriterVersion || null,
        reason: summary.blueprintWriterReason || null
      }
    };
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

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

  normalizeIdentifier(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  },

  normalizeConfidence(value = 0) {
    if (typeof value === "string") {
      const normalized = value.toLowerCase().trim();

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

      if (labels[normalized] !== undefined) {
        return labels[normalized];
      }
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return 0;
    }

    if (number > 1) {
      return Math.max(0, Math.min(1, number / 100));
    }

    return Math.max(0, Math.min(1, number));
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

        if (!key || seen.has(key)) {
          return;
        }

        seen.add(key);
        result.push(value);
      });

    return result;
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
  }
};

window.Ari.composerBridge = window.AriComposerBridge;

console.log(
  "ARI COMPOSER BRIDGE LOADED:",
  window.AriComposerBridge?.version
);