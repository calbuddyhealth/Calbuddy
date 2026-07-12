// ari/perception/ari-perception-reconciliation-engine.js
// Ari Perception Reconciliation Engine
//
// Purpose:
//   Reconcile authoritative structured upstream outputs into one stable
//   Conversation Intent Packet for routing, planning, capability selection,
//   response preparation, and composition.
//
// Responsibilities:
//   - Read structured upstream semantic meaning.
//   - Read the Conversation Function Engine handoff.
//   - Preserve semantic intent and conversational purpose separately.
//   - Inherit upstream safety requirements without recalculating severity.
//   - Preserve continuity, ambiguity, emotion, constraints, and stakes.
//   - Merge compatible response requirements.
//   - Report missing, conflicting, or incomplete upstream information.
//   - Produce one normalized downstream handoff packet.
//
// Non-responsibilities:
//   - Does not read or reinterpret raw user language.
//   - Does not classify keywords or infer a new semantic operation.
//   - Does not rebuild semantic frames.
//   - Does not recalculate conversation function.
//   - Does not determine safety severity.
//   - Does not remove or weaken upstream safety requirements.
//   - Does not select a lane, route, planner, model, tool, or capability.
//   - Does not compose or answer the user.
//   - Does not override stronger upstream evidence.
//
// V4.0.0 — Contract Reconciliation / No Reclassification / Stable Downstream Packet

window.Ari = window.Ari || {};

window.AriPerceptionReconciliationEngine = {
  version: "4.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  reconcile(input = {}) {
    const summary =
      this.unwrapSummary(input);

    const sources =
      this.readSources(summary);

    const validation =
      this.validateSources(sources);

    const semanticIntent =
      this.buildSemanticIntent(sources);

    const conversationPurpose =
      this.buildConversationPurpose(sources);

    const supportingPurposes =
      this.buildSupportingPurposes({
        sources,
        conversationPurpose
      });

    const safety =
      this.buildInheritedSafety(sources);

    const continuity =
      this.buildContinuity(sources);

    const ambiguity =
      this.buildAmbiguity(sources);

    const context =
      this.buildContext(sources);

    const agreement =
      this.assessAgreement({
        sources,
        semanticIntent,
        conversationPurpose
      });

    const governance =
      this.buildGovernance({
        validation,
        semanticIntent,
        conversationPurpose,
        safety,
        continuity,
        ambiguity,
        agreement
      });

    const responseRequirements =
      this.mergeResponseRequirements({
        sources,
        semanticIntent,
        conversationPurpose,
        supportingPurposes,
        safety,
        continuity,
        ambiguity,
        context,
        governance
      });

    const confidence =
      this.calculateConfidence({
        sources,
        validation,
        semanticIntent,
        conversationPurpose,
        safety,
        ambiguity,
        agreement
      });

    const readiness =
      this.determineReadiness({
        validation,
        semanticIntent,
        conversationPurpose,
        safety,
        continuity,
        ambiguity,
        agreement,
        confidence
      });

    const conversationIntentPacket =
      this.buildConversationIntentPacket({
        sources,
        validation,
        semanticIntent,
        conversationPurpose,
        supportingPurposes,
        safety,
        continuity,
        ambiguity,
        context,
        agreement,
        governance,
        responseRequirements,
        confidence,
        readiness
      });

    return {
      perceptionReconciliationRan: true,

      perceptionReconciliationVersion:
        this.version,

      perceptionReconciliationSource:
        "ari-perception-reconciliation-engine",

      reconciled:
        readiness.packetUsable,

      semanticAuthority:
        false,

      conversationFunctionAuthority:
        false,

      safetyAuthority:
        false,

      routingAuthority:
        false,

      planningAuthority:
        false,

      capabilityAuthority:
        false,

      composerAuthority:
        false,

      finalAnswerAuthority:
        false,

      validation,

      semanticIntent,

      conversationPurpose,

      supportingPurposes,

      safety,

      continuity,

      ambiguity,

      context,

      agreement,

      governance,

      responseRequirements,

      confidence:
        confidence.normalized,

      confidenceScore:
        confidence.score,

      confidenceLabel:
        confidence.label,

      confidenceBreakdown:
        confidence.breakdown,

      readiness,

      conversationIntentPacket,

      unifiedIntentPacket:
        conversationIntentPacket,

      handoff:
        this.buildHandoff({
          conversationIntentPacket,
          readiness,
          confidence
        }),

      authority: {
        canReadStructuredUpstreamOutputs:
          true,

        canNormalizeUpstreamContracts:
          true,

        canPreserveSemanticIntent:
          true,

        canPreserveConversationPurpose:
          true,

        canMergeResponseRequirements:
          true,

        canInheritSafetyRequirements:
          true,

        canReportAgreement:
          true,

        canReportConflicts:
          true,

        canReportReadiness:
          true,

        canReinterpretRawLanguage:
          false,

        canCreateNewSemanticMeaning:
          false,

        canReclassifyConversationFunction:
          false,

        canOverrideSemanticMeaning:
          false,

        canOverrideConversationFunction:
          false,

        canDetermineSafetySeverity:
          false,

        canRemoveSafetyRequirements:
          false,

        canChooseLane:
          false,

        canChooseRoute:
          false,

        canChoosePlanner:
          false,

        canChooseCapabilities:
          false,

        canComposeResponse:
          false,

        canAnswerUser:
          false,

        role:
          "structured_upstream_contract_reconciliation"
      }
    };
  },

  analyze(input = {}) {
    return this.reconcile(input);
  },

  /* =====================================================
     SOURCE READING
  ===================================================== */

  readSources(summary = {}) {
    const semanticResult =
      this.firstNonEmptyObject(
        summary.semanticFrameResult,
        summary.semanticFrameBuilderResult,
        summary.semanticFrame
      );

    const canonicalMeaning =
      this.firstNonEmptyObject(
        semanticResult.canonicalMeaning,
        summary.canonicalMeaning
      );

    const primaryFrame =
      this.firstNonEmptyObject(
        semanticResult.primaryFrame,
        semanticResult.currentTurnFrame,
        summary.primaryFrame,
        canonicalMeaning.primaryFrame
      );

    const secondaryFrames =
      this.firstNonEmptyArray(
        semanticResult.secondaryFrames,
        summary.secondaryFrames
      );

    const requestModel =
      this.firstNonEmptyObject(
        semanticResult.requestModel,
        canonicalMeaning.requestModel,
        summary.requestModel
      );

    const semanticHandoff =
      this.firstNonEmptyObject(
        semanticResult.handoff,
        semanticResult.semanticHandoff,
        summary.semanticHandoff
      );

    const semanticResponseRequirements =
      this.firstNonEmptyObject(
        semanticResult.responseRequirements,
        semanticResult.responseCharacteristics,
        canonicalMeaning.responseRequirements,
        semanticHandoff.responseRequirements,
        summary.semanticResponseRequirements
      );

    const semanticContinuity =
      this.firstNonEmptyObject(
        semanticResult.continuity,
        canonicalMeaning.continuity,
        semanticHandoff.continuity,
        summary.continuity
      );

    const semanticAmbiguity =
      this.firstNonEmptyObject(
        semanticResult.ambiguity,
        canonicalMeaning.ambiguity,
        semanticHandoff.ambiguity,
        summary.ambiguity
      );

    const emotionalOverlay =
      this.firstNonEmptyObject(
        semanticResult.emotionalOverlay,
        canonicalMeaning.emotionalOverlay,
        semanticHandoff.emotionalOverlay,
        summary.emotionalOverlay
      );

    const conversationFunctionResult =
      this.firstNonEmptyObject(
        summary.conversationFunctionResult,
        summary.conversationFunctionEngineResult,
        summary.conversationFunction
      );

    const conversationFunctionHandoff =
      this.firstNonEmptyObject(
        conversationFunctionResult.handoff,
        summary.conversationFunctionHandoff
      );

    const conversationPrimaryFunction =
      this.readConversationPrimaryFunction({
        conversationFunctionResult,
        conversationFunctionHandoff
      });

    const conversationSecondaryFunctions =
      this.firstNonEmptyArray(
        conversationFunctionHandoff.secondaryFunctions,
        conversationFunctionResult.secondaryFunctions
      );

    const functionResponseContract =
      this.firstNonEmptyObject(
        conversationFunctionResult.responseContract,
        conversationFunctionHandoff.responseContract
      );

    const functionAgreement =
      this.firstNonEmptyObject(
        conversationFunctionResult.functionAgreement,
        conversationFunctionHandoff.functionAgreement
      );

    const safetyContext =
      this.firstNonEmptyObject(
        summary.safetyContextGate,
        summary.safetyContext,
        summary.safetyResult
      );

    const classification =
      this.firstNonEmptyObject(
        summary.universalConversationClassification,
        summary.conversationClassification
      );

    const questionUnderstanding =
      this.firstNonEmptyObject(
        summary.questionUnderstanding,
        summary.questionUnderstandingResult
      );

    const contextModifiers =
      this.mergeSemanticItems(
        canonicalMeaning.contextModifiers,
        semanticResult.contextModifiers,
        semanticHandoff.contextModifiers,
        conversationFunctionHandoff.contextModifiers,
        summary.contextModifiers
      );

    const constraints =
      this.mergeSemanticItems(
        canonicalMeaning.constraints,
        semanticResult.constraints,
        semanticHandoff.constraints,
        conversationFunctionHandoff.constraints,
        summary.constraints
      );

    const stakes =
      this.mergeSemanticItems(
        canonicalMeaning.stakes,
        semanticResult.stakes,
        semanticHandoff.stakes,
        conversationFunctionHandoff.stakes,
        summary.stakes
      );

    const semanticConfidence =
      this.firstConfidence(
        canonicalMeaning.confidence,
        primaryFrame.semanticConfidence,
        semanticResult.semanticConfidence,
        semanticResult.semanticSummary?.confidence,
        semanticResult.semanticSummary?.confidenceScore
      );

    const conversationFunctionConfidence =
      this.firstConfidence(
        conversationFunctionResult.confidence,
        conversationFunctionResult.confidenceScore,
        conversationFunctionHandoff.confidence?.normalized,
        conversationFunctionHandoff.confidence?.score,
        conversationPrimaryFunction.score
      );

    return {
      semanticResult,
      canonicalMeaning,
      primaryFrame,
      secondaryFrames,
      requestModel,
      semanticHandoff,
      semanticResponseRequirements,
      semanticContinuity,
      semanticAmbiguity,
      emotionalOverlay,

      conversationFunctionResult,
      conversationFunctionHandoff,
      conversationPrimaryFunction,
      conversationSecondaryFunctions,
      functionResponseContract,
      functionAgreement,

      safetyContext,
      classification,
      questionUnderstanding,

      contextModifiers,
      constraints,
      stakes,

      semanticConfidence,
      conversationFunctionConfidence
    };
  },

  readConversationPrimaryFunction({
    conversationFunctionResult = {},
    conversationFunctionHandoff = {}
  } = {}) {
    const handoffPrimary =
      this.firstNonEmptyObject(
        conversationFunctionHandoff.primaryFunction
      );

    if (
      Object.keys(handoffPrimary).length > 0
    ) {
      return handoffPrimary;
    }

    const name =
      conversationFunctionResult.primaryFunction ||
      conversationFunctionResult.primaryFunctionName ||
      null;

    if (!name) {
      return {};
    }

    return {
      name,

      family:
        conversationFunctionResult.primaryFunctionFamily ||
        null,

      reason:
        conversationFunctionResult.primaryFunctionReason ||
        null,

      score:
        conversationFunctionResult.confidenceScore ??
        null,

      origin:
        "conversation_function_result",

      evidenceRefs:
        conversationFunctionResult.evidenceRefs ||
        []
    };
  },

  /* =====================================================
     SOURCE VALIDATION
  ===================================================== */

  validateSources(sources = {}) {
    const semanticMeaningAvailable =
      Boolean(
        sources.canonicalMeaning
          ?.requestedOperation ||
        sources.primaryFrame
          ?.operation ||
        sources.requestModel
          ?.operation
      );

    const semanticStructureAvailable =
      Boolean(
        sources.semanticResult
          ?.semanticFrameBuilderRan ||
        Object.keys(
          sources.canonicalMeaning ||
          {}
        ).length > 0 ||
        Object.keys(
          sources.primaryFrame ||
          {}
        ).length > 0
      );

    const conversationFunctionAvailable =
      Boolean(
        sources.conversationFunctionResult
          ?.conversationFunctionRan ||
        sources.conversationPrimaryFunction
          ?.name
      );

    const responseContractAvailable =
      Boolean(
        Object.keys(
          sources.functionResponseContract ||
          {}
        ).length > 0
      );

    const safetySourceAvailable =
      Boolean(
        Object.keys(
          sources.safetyContext ||
          {}
        ).length > 0
      );

    const continuitySourceAvailable =
      Boolean(
        Object.keys(
          sources.semanticContinuity ||
          {}
        ).length > 0
      );

    const ambiguitySourceAvailable =
      Boolean(
        Object.keys(
          sources.semanticAmbiguity ||
          {}
        ).length > 0
      );

    const contextAvailable =
      sources.contextModifiers.length > 0 ||
      sources.constraints.length > 0 ||
      sources.stakes.length > 0 ||
      Object.keys(
        sources.emotionalOverlay ||
        {}
      ).length > 0;

    const expectedSources = [
      {
        name:
          "semantic_structure",

        required:
          true,

        available:
          semanticStructureAvailable
      },

      {
        name:
          "semantic_meaning",

        required:
          true,

        available:
          semanticMeaningAvailable
      },

      {
        name:
          "conversation_function",

        required:
          true,

        available:
          conversationFunctionAvailable
      },

      {
        name:
          "function_response_contract",

        required:
          false,

        available:
          responseContractAvailable
      },

      {
        name:
          "safety_context",

        required:
          false,

        available:
          safetySourceAvailable
      },

      {
        name:
          "continuity",

        required:
          false,

        available:
          continuitySourceAvailable
      },

      {
        name:
          "ambiguity",

        required:
          false,

        available:
          ambiguitySourceAvailable
      },

      {
        name:
          "context",

        required:
          false,

        available:
          contextAvailable
      }
    ];

    const requiredSources =
      expectedSources.filter(
        source => source.required
      );

    const missingRequiredSources =
      requiredSources
        .filter(source =>
          !source.available
        )
        .map(source =>
          source.name
        );

    const availableCount =
      expectedSources.filter(
        source => source.available
      ).length;

    const requiredAvailableCount =
      requiredSources.filter(
        source => source.available
      ).length;

    return {
      expectedSources,

      semanticStructureAvailable,
      semanticMeaningAvailable,
      conversationFunctionAvailable,
      responseContractAvailable,
      safetySourceAvailable,
      continuitySourceAvailable,
      ambiguitySourceAvailable,
      contextAvailable,

      requiredSourcesPresent:
        missingRequiredSources.length === 0,

      missingRequiredSources,

      completeness:
        this.normalizeConfidence(
          availableCount /
          expectedSources.length
        ),

      requiredCompleteness:
        this.normalizeConfidence(
          requiredAvailableCount /
          requiredSources.length
        ),

      structurallyUsable:
        semanticStructureAvailable &&
        (
          semanticMeaningAvailable ||
          conversationFunctionAvailable
        ),

      authority:
        "source_contract_validation_only"
    };
  },

  /* =====================================================
     SEMANTIC INTENT
  ===================================================== */

  buildSemanticIntent(sources = {}) {
    const canonicalMeaning =
      sources.canonicalMeaning ||
      {};

    const primaryFrame =
      sources.primaryFrame ||
      {};

    const requestModel =
      sources.requestModel ||
      {};

    const requestedOperation =
      this.firstNonEmptyString(
        canonicalMeaning.requestedOperation,
        primaryFrame.operation,
        requestModel.operation
      );

    const requestedOutput =
      this.firstNonEmptyString(
        canonicalMeaning.requestedOutput,
        primaryFrame.requestedOutput,
        requestModel.requestedOutput
      );

    const interactionFamily =
      this.firstNonEmptyString(
        canonicalMeaning.interactionFamily,
        primaryFrame.interactionFamily,
        requestModel.interactionFamily
      );

    const intentFamily =
      this.firstNonEmptyString(
        canonicalMeaning.intentFamily,
        primaryFrame.intentFamily,
        requestModel.intentFamily
      );

    const userGoal =
      this.firstNonEmptyString(
        canonicalMeaning.userGoal,
        primaryFrame.userGoal,
        requestModel.userGoal,
        requestedOperation
      );

    const domain =
      this.firstNonEmptyString(
        canonicalMeaning.targetDomain,
        canonicalMeaning.domain?.primary,
        canonicalMeaning.domain,
        primaryFrame.domain,
        requestModel.domain
      );

    const secondaryDomains =
      this.mergeStringArrays(
        canonicalMeaning.domain?.secondary,
        canonicalMeaning.secondaryDomains,
        primaryFrame.secondaryDomains,
        requestModel.secondaryDomains
      );

    return {
      available:
        Boolean(
          requestedOperation ||
          requestedOutput ||
          userGoal
        ),

      requestedOperation:
        requestedOperation ||
        null,

      requestedOutput:
        requestedOutput ||
        null,

      interactionFamily:
        interactionFamily ||
        null,

      intentFamily:
        intentFamily ||
        null,

      userGoal:
        userGoal ||
        null,

      subject:
        canonicalMeaning.subject ??
        primaryFrame.subject ??
        requestModel.subject ??
        null,

      target:
        canonicalMeaning.target ??
        primaryFrame.target ??
        requestModel.target ??
        null,

      targetObject:
        canonicalMeaning.targetObject ??
        canonicalMeaning.object ??
        primaryFrame.targetObject ??
        primaryFrame.object ??
        requestModel.targetObject ??
        requestModel.object ??
        null,

      options:
        this.firstNonEmptyArray(
          canonicalMeaning.options,
          primaryFrame.options,
          requestModel.options
        ),

      criteria:
        this.firstNonEmptyArray(
          canonicalMeaning.criteria,
          primaryFrame.criteria,
          requestModel.criteria
        ),

      domain:
        domain ||
        null,

      secondaryDomains,

      confidence:
        sources.semanticConfidence,

      evidenceRefs:
        this.collectEvidenceRefs(
          canonicalMeaning,
          primaryFrame,
          requestModel
        ),

      source:
        canonicalMeaning.requestedOperation
          ? "canonical_meaning"
          : primaryFrame.operation
            ? "primary_semantic_frame"
            : requestModel.operation
              ? "request_model"
              : null,

      preservedWithoutReclassification:
        true,

      authority:
        "upstream_semantic_meaning_preserved"
    };
  },

  /* =====================================================
     CONVERSATION PURPOSE
  ===================================================== */

  buildConversationPurpose(sources = {}) {
    const primaryFunction =
      sources.conversationPrimaryFunction ||
      {};

    const responseContract =
      sources.functionResponseContract ||
      {};

    const name =
      this.normalizeIdentifier(
        primaryFunction.name
      );

    return {
      available:
        Boolean(name),

      name:
        name ||
        null,

      family:
        this.normalizeIdentifier(
          primaryFunction.family
        ) ||
        null,

      reason:
        primaryFunction.reason ||
        null,

      score:
        this.normalizeScore(
          primaryFunction.score
        ),

      confidence:
        sources
          .conversationFunctionConfidence,

      origin:
        primaryFunction.origin ||
        "conversation_function_engine",

      evidenceRefs:
        this.collectEvidenceRefs(
          primaryFunction
        ),

      responseContract: {
        objective:
          responseContract.objective ||
          null,

        must:
          this.normalizeStringArray(
            responseContract.must
          ),

        should:
          this.normalizeStringArray(
            responseContract.should
          ),

        mustNot:
          this.normalizeStringArray(
            responseContract.mustNot
          ),

        clarificationMayBeRequired:
          responseContract
            .clarificationMayBeRequired ===
            true,

        priorContextRequired:
          responseContract
            .priorContextRequired ===
            true,

        advisoryOnly:
          responseContract
            .advisoryOnly !== false
      },

      preservedWithoutReclassification:
        true,

      authority:
        "upstream_conversation_function_preserved"
    };
  },

  buildSupportingPurposes({
    sources = {},
    conversationPurpose = {}
  } = {}) {
    const purposes = [];

    sources
      .conversationSecondaryFunctions
      .forEach(item => {
        const name =
          this.normalizeIdentifier(
            item?.name
          );

        if (
          !name ||
          name ===
            conversationPurpose.name
        ) {
          return;
        }

        purposes.push({
          name,

          family:
            this.normalizeIdentifier(
              item.family
            ) ||
            null,

          score:
            this.normalizeScore(
              item.score
            ),

          reason:
            item.reason ||
            null,

          role:
            item.role ||
            "supporting",

          origin:
            item.origin ||
            "conversation_function_engine",

          evidenceRefs:
            this.collectEvidenceRefs(
              item
            )
        });
      });

    return this.mergePurposeItems(
      purposes
    ).slice(0, 8);
  },

  /* =====================================================
     SAFETY INHERITANCE
  ===================================================== */

  buildInheritedSafety(sources = {}) {
    const safety =
      sources.safetyContext ||
      {};

    const immediateResponseRequired =
      safety.immediateSupportRequired ===
        true ||
      safety.immediateHumanSupportRequired ===
        true ||
      safety.requiresImmediateResponse ===
        true;

    const present =
      immediateResponseRequired ||
      safety.safetyRelevant === true ||
      safety.riskPresent === true ||
      safety.safetyContextPresent ===
        true ||
      Boolean(
        safety.severity ||
        safety.riskLevel ||
        safety.safetyLevel
      );

    return {
      sourceAvailable:
        Object.keys(safety).length > 0,

      present,

      immediateResponseRequired,

      severity:
        safety.severity ??
        safety.riskLevel ??
        safety.safetyLevel ??
        null,

      escalationRequired:
        safety.escalationRequired ===
        true,

      emergencyContext:
        safety.emergencyContext ===
        true,

      requirements:
        this.mergeStringArrays(
          safety.requirements,
          safety.responseRequirements,
          safety.must
        ),

      restrictions:
        this.mergeStringArrays(
          safety.restrictions,
          safety.prohibitedActions,
          safety.mustNot
        ),

      evidenceRefs:
        this.collectEvidenceRefs(
          safety
        ),

      recalculated:
        false,

      inheritedWithoutModification:
        true,

      authority:
        "upstream_safety_requirements_inherited"
    };
  },

  /* =====================================================
     CONTINUITY
  ===================================================== */

  buildContinuity(sources = {}) {
    const continuity =
      sources.semanticContinuity ||
      {};

    return {
      sourceAvailable:
        Object.keys(continuity).length > 0,

      isContinuation:
        continuity.isContinuation ===
        true,

      requiresPriorContext:
        continuity.requiresPriorContext ===
        true,

      priorContextAvailable:
        continuity.priorContextAvailable ===
          true ||
        continuity.threadAvailable ===
          true,

      referencesPriorArtifact:
        continuity.referencesPriorArtifact ===
          true,

      referencesPriorQuestion:
        continuity.referencesPriorQuestion ===
          true,

      anchor:
        continuity.anchor ??
        continuity.inheritedSubject ??
        null,

      inheritedSubject:
        continuity.inheritedSubject ??
        null,

      previousAnswerSummary:
        continuity.previousAnswerSummary ??
        null,

      confidence:
        this.normalizeConfidence(
          continuity.confidence
        ),

      evidenceRefs:
        this.collectEvidenceRefs(
          continuity
        ),

      preservedWithoutReinterpretation:
        true,

      authority:
        "upstream_continuity_preserved"
    };
  },

  /* =====================================================
     AMBIGUITY
  ===================================================== */

  buildAmbiguity(sources = {}) {
    const ambiguity =
      sources.semanticAmbiguity ||
      {};

    const unresolvedSlots =
      this.normalizeStringArray(
        ambiguity.unresolvedSlots
      );

    const competingFrames =
      Array.isArray(
        ambiguity.competingFrames
      )
        ? ambiguity.competingFrames
        : [];

    const present =
      ambiguity.present === true ||
      ambiguity.ambiguous === true ||
      unresolvedSlots.length > 0 ||
      competingFrames.length > 0;

    return {
      sourceAvailable:
        Object.keys(ambiguity).length > 0,

      present,

      requiresClarification:
        ambiguity.requiresClarification ===
        true,

      missingAnchor:
        ambiguity.missingAnchor ===
        true,

      unresolvedSlots,

      competingFrames,

      reason:
        ambiguity.reason ||
        null,

      confidence:
        this.normalizeConfidence(
          ambiguity.confidence
        ),

      evidenceRefs:
        this.collectEvidenceRefs(
          ambiguity
        ),

      preservedWithoutResolution:
        true,

      authority:
        "upstream_ambiguity_preserved"
    };
  },

  /* =====================================================
     CONTEXT
  ===================================================== */

  buildContext(sources = {}) {
    const emotion =
      sources.emotionalOverlay ||
      {};

    return {
      modifiers:
        sources.contextModifiers,

      constraints:
        sources.constraints,

      stakes:
        sources.stakes,

      emotional: {
        sourceAvailable:
          Object.keys(emotion).length > 0,

        present:
          emotion.present === true,

        explicitSupportRequested:
          emotion.explicitSupportRequested ===
          true,

        role:
          emotion.role ||
          (
            emotion.present
              ? "delivery_modifier"
              : "none"
          ),

        tone:
          emotion.tone ||
          null,

        intensity:
          emotion.intensity ||
          null,

        states:
          this.normalizeStringArray(
            emotion.states
          ),

        shouldNotReplacePrimaryRequest:
          emotion.shouldNotReplacePrimaryRequest !==
          false,

        evidenceRefs:
          this.collectEvidenceRefs(
            emotion
          )
      },

      authority:
        "upstream_context_preserved"
    };
  },

  /* =====================================================
     AGREEMENT + CONFLICT REPORTING
  ===================================================== */

  assessAgreement({
    sources = {},
    semanticIntent = {},
    conversationPurpose = {}
  } = {}) {
    const functionAgreement =
      sources.functionAgreement ||
      {};

    const upstreamDisagreements =
      this.normalizeStringArray(
        functionAgreement.disagreements
      );

    const unmappedSources =
      this.normalizeStringArray(
        functionAgreement.unmappedSources
      );

    const functionAgreementAvailable =
      Object.keys(
        functionAgreement
      ).length > 0;

    const semanticOperationAvailable =
      Boolean(
        semanticIntent.requestedOperation
      );

    const conversationPurposeAvailable =
      Boolean(
        conversationPurpose.name
      );

    const structuralConflict =
      semanticOperationAvailable &&
      !conversationPurposeAvailable;

    const reportedMismatch =
      upstreamDisagreements.length > 0;

    const conflicts = [];

    if (structuralConflict) {
      conflicts.push({
        type:
          "missing_conversation_purpose",

        severity:
          "medium",

        resolvableHere:
          false,

        description:
          "Semantic meaning is available, but no Conversation Function result was provided.",

        resolution:
          "Preserve semantic meaning and report the missing upstream function result."
      });
    }

    if (reportedMismatch) {
      conflicts.push({
        type:
          "upstream_function_agreement_mismatch",

        severity:
          "medium",

        resolvableHere:
          false,

        description:
          "The Conversation Function Engine reported disagreement among its upstream function mappings.",

        disagreementRefs:
          upstreamDisagreements,

        resolution:
          "Preserve both semantic meaning and the reported conversation purpose for downstream inspection."
      });
    }

    return {
      semanticIntentAvailable:
        semanticIntent.available,

      conversationPurposeAvailable:
        conversationPurpose.available,

      functionAgreementAvailable,

      functionAgreementScore:
        this.normalizeConfidence(
          functionAgreement.score
        ),

      functionAgreementLevel:
        functionAgreement.level ||
        null,

      upstreamDisagreements,

      unmappedSources,

      conflicts,

      conflictPresent:
        conflicts.length > 0,

      unresolvedConflictPresent:
        conflicts.some(
          conflict =>
            conflict.resolvableHere ===
            false
        ),

      semanticMeaningPreserved:
        true,

      conversationPurposePreserved:
        true,

      reclassificationPerformed:
        false,

      authority:
        "cross_contract_agreement_report_only"
    };
  },

  /* =====================================================
     GOVERNANCE
  ===================================================== */

  buildGovernance({
    validation = {},
    semanticIntent = {},
    conversationPurpose = {},
    safety = {},
    continuity = {},
    ambiguity = {},
    agreement = {}
  } = {}) {
    let responseOrder =
      "normal";

    if (
      safety.immediateResponseRequired
    ) {
      responseOrder =
        "safety_first";
    } else if (
      ambiguity.requiresClarification
    ) {
      responseOrder =
        "clarification_first";
    } else if (
      continuity.requiresPriorContext &&
      !continuity.priorContextAvailable
    ) {
      responseOrder =
        "recover_context_first";
    }

    return {
      responseOrder,

      semanticIntentRemainsPrimary:
        semanticIntent.available,

      conversationPurposeRemainsAdvisory:
        conversationPurpose.available,

      safetyGoverning:
        safety.immediateResponseRequired,

      clarificationRequired:
        ambiguity.requiresClarification,

      missingPriorContext:
        continuity.requiresPriorContext &&
        !continuity.priorContextAvailable,

      incompleteUpstreamContract:
        !validation.requiredSourcesPresent,

      conflictReviewRequired:
        agreement.unresolvedConflictPresent,

      irreversibleActionAllowed:
        !ambiguity.requiresClarification &&
        !(
          continuity.requiresPriorContext &&
          !continuity.priorContextAvailable
        ),

      rawTextReinterpretationAllowed:
        false,

      semanticReclassificationAllowed:
        false,

      conversationFunctionReclassificationAllowed:
        false,

      safetyRecalculationAllowed:
        false,

      authority:
        "downstream_processing_conditions_only"
    };
  },

  /* =====================================================
     RESPONSE REQUIREMENTS
  ===================================================== */

  mergeResponseRequirements({
    sources = {},
    semanticIntent = {},
    conversationPurpose = {},
    supportingPurposes = [],
    safety = {},
    continuity = {},
    ambiguity = {},
    context = {},
    governance = {}
  } = {}) {
    const semanticRequirements =
      sources.semanticResponseRequirements ||
      {};

    const functionContract =
      conversationPurpose.responseContract ||
      {};

    const must = [
      ...this.normalizeStringArray(
        semanticRequirements.must
      ),

      ...this.normalizeStringArray(
        functionContract.must
      ),

      ...safety.requirements
    ];

    const should = [
      ...this.normalizeStringArray(
        semanticRequirements.should
      ),

      ...this.normalizeStringArray(
        functionContract.should
      )
    ];

    const mustNot = [
      ...this.normalizeStringArray(
        semanticRequirements.mustNot
      ),

      ...this.normalizeStringArray(
        functionContract.mustNot
      ),

      ...safety.restrictions
    ];

    if (semanticIntent.available) {
      must.push(
        "preserve_upstream_semantic_intent"
      );
    }

    if (conversationPurpose.available) {
      must.push(
        "honor_conversation_function_contract"
      );
    }

    if (
      safety.immediateResponseRequired
    ) {
      must.unshift(
        "address_inherited_immediate_safety_requirements_first"
      );

      must.push(
        "preserve_original_user_request"
      );
    }

    if (
      ambiguity.requiresClarification
    ) {
      must.push(
        "clarify_before_irreversible_action"
      );
    }

    if (
      continuity.requiresPriorContext &&
      !continuity.priorContextAvailable
    ) {
      must.push(
        "do_not_invent_missing_prior_context"
      );
    }

    if (
      continuity.referencesPriorArtifact
    ) {
      should.push(
        "preserve_prior_artifact_context"
      );
    }

    if (
      context.emotional.present &&
      !context.emotional
        .explicitSupportRequested
    ) {
      should.push(
        "acknowledge_emotion_without_replacing_primary_task"
      );
    }

    if (
      context.emotional
        .explicitSupportRequested
    ) {
      must.push(
        "provide_requested_emotional_support"
      );
    }

    context.constraints
      .forEach(constraint => {
        const identifier =
          this.semanticItemIdentifier(
            constraint
          );

        if (identifier) {
          must.push(
            `respect_constraint:${identifier}`
          );
        }
      });

    supportingPurposes
      .forEach(purpose => {
        if (purpose.name) {
          should.push(
            `preserve_supporting_purpose:${purpose.name}`
          );
        }
      });

    return {
      objective:
        functionContract.objective ||
        semanticRequirements.objective ||
        null,

      semanticTask:
        semanticIntent.requestedOperation ||
        null,

      conversationalPurpose:
        conversationPurpose.name ||
        null,

      supportingPurposes:
        supportingPurposes.map(
          purpose => purpose.name
        ),

      must:
        this.uniqueStrings(must),

      should:
        this.uniqueStrings(should),

      mustNot:
        this.uniqueStrings(mustNot),

      responseOrder:
        governance.responseOrder,

      preserveSemanticIntent:
        semanticIntent.available,

      preserveConversationPurpose:
        conversationPurpose.available,

      safetyRequirementsInherited:
        safety.present,

      clarificationRequired:
        ambiguity.requiresClarification,

      priorContextRequired:
        continuity.requiresPriorContext,

      authority:
        "merged_upstream_response_contract"
    };
  },

  /* =====================================================
     CONFIDENCE
  ===================================================== */

  calculateConfidence({
    sources = {},
    validation = {},
    semanticIntent = {},
    conversationPurpose = {},
    safety = {},
    ambiguity = {},
    agreement = {}
  } = {}) {
    const semanticConfidence =
      semanticIntent.available
        ? this.normalizeConfidence(
            sources.semanticConfidence
          )
        : 0;

    const functionConfidence =
      conversationPurpose.available
        ? this.normalizeConfidence(
            sources
              .conversationFunctionConfidence
          )
        : 0;

    const sourceCompleteness =
      this.normalizeConfidence(
        validation.completeness
      );

    const requiredCompleteness =
      this.normalizeConfidence(
        validation.requiredCompleteness
      );

    const agreementScore =
      agreement.functionAgreementAvailable
        ? this.normalizeConfidence(
            agreement.functionAgreementScore
          )
        : 0.5;

    const ambiguityPenalty =
      ambiguity.present
        ? 0.06
        : 0;

    const clarificationPenalty =
      ambiguity.requiresClarification
        ? 0.12
        : 0;

    const conflictPenalty =
      agreement.conflictPresent
        ? 0.1
        : 0;

    const missingSourcePenalty =
      validation.requiredSourcesPresent
        ? 0
        : Math.min(
            0.2,
            validation
              .missingRequiredSources
              .length * 0.08
          );

    const safetyPreservationBonus =
      safety.present
        ? 0.02
        : 0;

    const normalized =
      this.normalizeConfidence(
        semanticConfidence * 0.28 +
        functionConfidence * 0.22 +
        sourceCompleteness * 0.14 +
        requiredCompleteness * 0.18 +
        agreementScore * 0.18 +
        safetyPreservationBonus -
        ambiguityPenalty -
        clarificationPenalty -
        conflictPenalty -
        missingSourcePenalty
      );

    return {
      normalized,

      score:
        Math.round(
          normalized * 100
        ),

      label:
        this.confidenceLabel(
          normalized
        ),

      breakdown: {
        semanticConfidence,
        functionConfidence,
        sourceCompleteness,
        requiredCompleteness,
        agreementScore,
        ambiguityPenalty,
        clarificationPenalty,
        conflictPenalty,
        missingSourcePenalty,
        safetyPreservationBonus
      }
    };
  },

  /* =====================================================
     READINESS
  ===================================================== */

  determineReadiness({
    validation = {},
    semanticIntent = {},
    conversationPurpose = {},
    safety = {},
    continuity = {},
    ambiguity = {},
    agreement = {},
    confidence = {}
  } = {}) {
    const missingSemanticIntent =
      !semanticIntent.available;

    const missingConversationPurpose =
      !conversationPurpose.available;

    const missingPriorContext =
      continuity.requiresPriorContext &&
      !continuity.priorContextAvailable;

    const clarificationRequired =
      ambiguity.requiresClarification;

    const unresolvedConflict =
      agreement.unresolvedConflictPresent;

    const safetyReady =
      safety.immediateResponseRequired;

    const packetUsable =
      validation.structurallyUsable &&
      (
        semanticIntent.available ||
        conversationPurpose.available
      );

    const readyForRouting =
      packetUsable &&
      !missingSemanticIntent &&
      !clarificationRequired &&
      !missingPriorContext &&
      !unresolvedConflict;

    const readyForPlanning =
      readyForRouting;

    const readyForResponsePreparation =
      safetyReady ||
      readyForRouting ||
      clarificationRequired ||
      missingPriorContext;

    let status =
      "ready";

    let reason =
      "The reconciled packet contains sufficient structured upstream meaning for downstream processing.";

    if (safetyReady) {
      status =
        "ready_with_safety_requirements";

      reason =
        "The packet is ready for response preparation, with inherited safety requirements governing response order.";
    } else if (!packetUsable) {
      status =
        "not_ready";

      reason =
        "The available upstream information is not sufficient to create a usable reconciled packet.";
    } else if (clarificationRequired) {
      status =
        "clarification_required";

      reason =
        "Upstream ambiguity requires clarification before normal routing or planning.";
    } else if (missingPriorContext) {
      status =
        "prior_context_required";

      reason =
        "The request depends on prior context that is not currently available.";
    } else if (missingSemanticIntent) {
      status =
        "missing_semantic_intent";

      reason =
        "No usable semantic intent was supplied by the upstream semantic systems.";
    } else if (missingConversationPurpose) {
      status =
        "ready_with_missing_function";

      reason =
        "Semantic intent is usable, but the Conversation Function result is missing.";
    } else if (unresolvedConflict) {
      status =
        "conflict_review_required";

      reason =
        "An unresolved upstream contract conflict should be reviewed before normal routing.";
    } else if (
      !validation.requiredSourcesPresent
    ) {
      status =
        "ready_with_missing_sources";

      reason =
        "The packet is usable, but one or more expected upstream sources were unavailable.";
    } else if (
      confidence.normalized < 0.45
    ) {
      status =
        "low_confidence";

      reason =
        "The packet is usable, but reconciliation confidence is low.";
    }

    return {
      status,

      packetUsable,

      readyForRouting,

      readyForPlanning,

      readyForResponsePreparation,

      immediateSafetyResponseRequired:
        safetyReady,

      clarificationRequired,

      priorContextRequired:
        continuity.requiresPriorContext,

      priorContextAvailable:
        continuity.priorContextAvailable,

      missingPriorContext,

      missingSemanticIntent,

      missingConversationPurpose,

      missingRequiredSources:
        validation.missingRequiredSources,

      unresolvedConflict,

      reason,

      authority:
        "downstream_readiness_report_only"
    };
  },

  /* =====================================================
     CONVERSATION INTENT PACKET
  ===================================================== */

  buildConversationIntentPacket({
    sources = {},
    validation = {},
    semanticIntent = {},
    conversationPurpose = {},
    supportingPurposes = [],
    safety = {},
    continuity = {},
    ambiguity = {},
    context = {},
    agreement = {},
    governance = {},
    responseRequirements = {},
    confidence = {},
    readiness = {}
  } = {}) {
    return {
      enabled:
        true,

      packetType:
        "conversation_intent_packet",

      source:
        "ari-perception-reconciliation-engine",

      version:
        this.version,

      semanticIntent,

      conversationPurpose,

      supportingPurposes,

      governance,

      responseRequirements,

      safety,

      continuity,

      ambiguity,

      context,

      agreement,

      validation,

      confidence: {
        normalized:
          confidence.normalized,

        score:
          confidence.score,

        label:
          confidence.label,

        breakdown:
          confidence.breakdown
      },

      readiness,

      upstreamTrace: {
        semanticFrameBuilderRan:
          sources.semanticResult
            ?.semanticFrameBuilderRan ===
            true,

        semanticFrameVersion:
          sources.semanticResult
            ?.semanticFrameBuilderVersion ||
          sources.semanticResult
            ?.version ||
          null,

        conversationFunctionRan:
          sources.conversationFunctionResult
            ?.conversationFunctionRan ===
            true,

        conversationFunctionVersion:
          sources.conversationFunctionResult
            ?.conversationFunctionVersion ||
          sources.conversationFunctionResult
            ?.version ||
          null,

        semanticConfidence:
          sources.semanticConfidence,

        conversationFunctionConfidence:
          sources
            .conversationFunctionConfidence,

        functionAgreement:
          sources.functionAgreement
      },

      downstreamContract: {
        downstreamShouldPreferPacket:
          true,

        downstreamMayReadSemanticIntent:
          true,

        downstreamMayReadConversationPurpose:
          true,

        downstreamMayReadSupportingPurposes:
          true,

        routerMayRead:
          true,

        plannerMayRead:
          true,

        capabilitySelectorMayRead:
          true,

        composerMayRead:
          true,

        downstreamShouldNotReinterpretRawText:
          true,

        downstreamShouldNotReclassifySemanticIntent:
          true,

        downstreamShouldNotReclassifyConversationFunction:
          true,

        downstreamMustPreserveSemanticIntent:
          true,

        downstreamMustHonorSafetyRequirements:
          true,

        downstreamMustRespectGovernance:
          true,

        downstreamMustRespectConstraints:
          true
      },

      authority: {
        sourceOfTruthForReconciledIntent:
          true,

        sourceOfTruthForSemanticMeaning:
          false,

        sourceOfTruthForConversationFunction:
          false,

        sourceOfTruthForSafetySeverity:
          false,

        sourceOfTruthForFinalRoute:
          false,

        sourceOfTruthForFinalPlan:
          false,

        sourceOfTruthForFinalAnswer:
          false,

        role:
          "single_reconciled_upstream_contract"
      }
    };
  },

  /* =====================================================
     HANDOFF
  ===================================================== */

  buildHandoff({
    conversationIntentPacket = {},
    readiness = {},
    confidence = {}
  } = {}) {
    return {
      ready:
        readiness
          .readyForResponsePreparation ===
          true,

      packetUsable:
        readiness.packetUsable ===
        true,

      readyForRouting:
        readiness.readyForRouting ===
        true,

      readyForPlanning:
        readiness.readyForPlanning ===
        true,

      readyForResponsePreparation:
        readiness
          .readyForResponsePreparation ===
          true,

      clarificationRequired:
        readiness.clarificationRequired ===
        true,

      priorContextRequired:
        readiness.priorContextRequired ===
        true,

      immediateSafetyResponseRequired:
        readiness
          .immediateSafetyResponseRequired ===
          true,

      conversationIntentPacket,

      semanticIntent:
        conversationIntentPacket
          .semanticIntent,

      conversationPurpose:
        conversationIntentPacket
          .conversationPurpose,

      supportingPurposes:
        conversationIntentPacket
          .supportingPurposes,

      governance:
        conversationIntentPacket
          .governance,

      responseRequirements:
        conversationIntentPacket
          .responseRequirements,

      confidence,

      readiness,

      authority: {
        canChooseLane:
          false,

        canChooseRoute:
          false,

        canChoosePlanner:
          false,

        canChooseCapabilities:
          false,

        canDetermineSafetySeverity:
          false,

        canComposeResponse:
          false,

        canAnswerUser:
          false,

        role:
          "reconciliation_to_downstream_handoff"
      }
    };
  },

  /* =====================================================
     HELPERS
  ===================================================== */

  unwrapSummary(input = {}) {
    if (
      input &&
      typeof input === "object" &&
      !Array.isArray(input) &&
      input.summary &&
      typeof input.summary === "object" &&
      !Array.isArray(input.summary)
    ) {
      return input.summary;
    }

    return (
      input &&
      typeof input === "object" &&
      !Array.isArray(input)
    )
      ? input
      : {};
  },

  firstNonEmptyObject(
    ...values
  ) {
    return (
      values.find(value =>
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length > 0
      ) ||
      {}
    );
  },

  firstNonEmptyArray(
    ...values
  ) {
    return (
      values.find(value =>
        Array.isArray(value) &&
        value.length > 0
      ) ||
      []
    );
  },

  firstNonEmptyString(
    ...values
  ) {
    const match =
      values.find(value =>
        typeof value === "string" &&
        value.trim().length > 0
      );

    return match
      ? match.trim()
      : "";
  },

  firstConfidence(
    ...values
  ) {
    for (const value of values) {
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
        return this.normalizeConfidence(
          number
        );
      }
    }

    return 0;
  },

  collectEvidenceRefs(
    ...sources
  ) {
    const refs = [];

    sources.forEach(source => {
      if (!source) {
        return;
      }

      if (
        Array.isArray(
          source.evidenceRefs
        )
      ) {
        refs.push(
          ...source.evidenceRefs
        );
      }

      if (
        Array.isArray(
          source.evidence
        )
      ) {
        refs.push(
          ...source.evidence
        );
      }

      if (
        Array.isArray(
          source.sourceRefs
        )
      ) {
        refs.push(
          ...source.sourceRefs
        );
      }
    });

    return [
      ...new Set(
        refs.filter(Boolean)
      )
    ];
  },

  mergeSemanticItems(
    ...collections
  ) {
    const merged = [];
    const seen = new Set();

    collections.forEach(collection => {
      if (!Array.isArray(collection)) {
        return;
      }

      collection.forEach(item => {
        if (
          item === null ||
          item === undefined
        ) {
          return;
        }

        const key =
          this.semanticItemKey(item);

        if (
          !key ||
          seen.has(key)
        ) {
          return;
        }

        seen.add(key);
        merged.push(item);
      });
    });

    return merged;
  },

  semanticItemKey(item) {
    if (
      typeof item === "string"
    ) {
      return this.normalizeIdentifier(
        item
      );
    }

    if (
      typeof item === "number" ||
      typeof item === "boolean"
    ) {
      return String(item);
    }

    if (
      item &&
      typeof item === "object"
    ) {
      const identifier =
        item.id ||
        item.key ||
        item.name ||
        item.type ||
        item.value ||
        item.label;

      if (identifier) {
        return this.normalizeIdentifier(
          identifier
        );
      }

      try {
        return JSON.stringify(item);
      } catch (error) {
        return "";
      }
    }

    return "";
  },

  semanticItemIdentifier(item) {
    if (
      typeof item === "string"
    ) {
      return this.normalizeIdentifier(
        item
      );
    }

    if (
      item &&
      typeof item === "object"
    ) {
      return this.normalizeIdentifier(
        item.id ||
        item.key ||
        item.name ||
        item.type ||
        item.value ||
        item.label ||
        ""
      );
    }

    return "";
  },

  mergePurposeItems(
    purposes = []
  ) {
    const merged =
      new Map();

    purposes.forEach(purpose => {
      if (!purpose?.name) {
        return;
      }

      const key =
        this.normalizeIdentifier(
          purpose.name
        );

      if (!key) {
        return;
      }

      if (!merged.has(key)) {
        merged.set(key, {
          ...purpose,

          name:
            key,

          evidenceRefs:
            this.collectEvidenceRefs(
              purpose
            )
        });

        return;
      }

      const existing =
        merged.get(key);

      existing.score =
        Math.max(
          Number(existing.score || 0),
          Number(purpose.score || 0)
        );

      existing.evidenceRefs =
        this.uniqueStrings([
          ...(
            existing.evidenceRefs ||
            []
          ),

          ...this.collectEvidenceRefs(
            purpose
          )
        ]);

      if (
        !existing.reason &&
        purpose.reason
      ) {
        existing.reason =
          purpose.reason;
      }
    });

    return [
      ...merged.values()
    ].sort(
      (a, b) =>
        Number(b.score || 0) -
        Number(a.score || 0)
    );
  },

  normalizeStringArray(
    value
  ) {
    if (!Array.isArray(value)) {
      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return [
          value.trim()
        ];
      }

      return [];
    }

    return this.uniqueStrings(
      value
        .filter(item =>
          typeof item === "string"
        )
        .map(item =>
          item.trim()
        )
        .filter(Boolean)
    );
  },

  mergeStringArrays(
    ...collections
  ) {
    const strings = [];

    collections.forEach(collection => {
      if (Array.isArray(collection)) {
        collection.forEach(item => {
          if (
            typeof item === "string" &&
            item.trim()
          ) {
            strings.push(
              item.trim()
            );
          }
        });

        return;
      }

      if (
        typeof collection === "string" &&
        collection.trim()
      ) {
        strings.push(
          collection.trim()
        );
      }
    });

    return this.uniqueStrings(
      strings
    );
  },

  uniqueStrings(
    values = []
  ) {
    const result = [];
    const seen = new Set();

    values.forEach(value => {
      if (
        typeof value !== "string"
      ) {
        return;
      }

      const clean =
        value.trim();

      if (!clean) {
        return;
      }

      const key =
        clean.toLowerCase();

      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      result.push(clean);
    });

    return result;
  },

  normalizeIdentifier(
    value = ""
  ) {
    return String(
      value || ""
    )
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  },

  normalizeScore(
    value = 0
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return 0;
    }

    if (
      number >= 0 &&
      number <= 1
    ) {
      return Math.round(
        number * 100
      );
    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(number)
      )
    );
  },

  normalizeConfidence(
    value = 0
  ) {
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

  confidenceLabel(
    value = 0
  ) {
    const confidence =
      this.normalizeConfidence(
        value
      );

    if (
      confidence >= 0.88
    ) {
      return "high";
    }

    if (
      confidence >= 0.68
    ) {
      return "medium";
    }

    if (
      confidence >= 0.45
    ) {
      return "low";
    }

    return "very_low";
  }
};

window.Ari.perceptionReconciliationEngine =
  window.AriPerceptionReconciliationEngine;

console.log(
  "ARI PERCEPTION RECONCILIATION ENGINE LOADED:",
  window.AriPerceptionReconciliationEngine?.version
);