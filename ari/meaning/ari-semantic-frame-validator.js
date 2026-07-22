// ari/meaning/ari-semantic-frame-validator.js
// Ari Semantic Frame Validator
//
// Purpose:
// Normalize and audit the semantic frame produced by OpenAI cognitive
// reasoning without overriding, rejecting, repairing, or replacing
// authoritative semantic meaning.
//
// V2.0.0 — Canonical Semantic Normalization / Advisory Audit

window.Ari = window.Ari || {};

window.AriSemanticFrameValidator = {
  version: "2.0.0",
  schemaVersion: "2.0.0",
  source: "ari-semantic-frame-validator",
  authorityLevel: "advisory_semantic_audit",

  validate(input = {}) {
    try {
      const context = this.readInputContext(input);
      const runtime = this.evaluateRuntime(context);

      const normalizedSemanticFrame = runtime.canNormalize
        ? this.normalizeFrame(
            context.sourceSemanticFrame,
            context.registry
          )
        : null;

      const usable = Boolean(
        runtime.cognitiveReasoningUsable &&
        normalizedSemanticFrame
      );

      const audit = this.runAudit({
        ...context,
        normalizedSemanticFrame
      });

      const compatibilityProjection = usable
        ? this.buildCompatibilityProjection(
            normalizedSemanticFrame,
            context.cognitiveReasoningResult
          )
        : this.emptyCompatibilityProjection();

      const provenance = this.buildProvenance({
        context,
        runtime,
        normalizedSemanticFrame,
        audit,
        usable
      });

      return this.buildResult({
        context,
        runtime,
        normalizedSemanticFrame,
        audit,
        compatibilityProjection,
        provenance,
        usable
      });
    } catch (error) {
      console.error("SEMANTIC FRAME AUDIT CRASH", {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        error
      });

      throw error;
    }
  },

  build(input = {}) {
    return this.validate(input);
  },

  create(input = {}) {
    return this.validate(input);
  },

  readInputContext(input = {}) {
    const summary = input?.summary || input || {};
    const cognitiveReasoningResult =
      this.readCognitiveReasoningResult(summary);
    const sourceSemanticFrame = this.readSemanticFrame(
      summary,
      cognitiveReasoningResult
    );

    return {
      summary,
      cognitiveReasoningResult,
      sourceSemanticFrame,
      evidencePacket: this.readEvidencePacket(summary),
      contracts: this.readBindingContracts(summary),
      registry: this.getOperationRegistry()
    };
  },

  readCognitiveReasoningResult(summary = {}) {
    return (
      summary.cognitiveReasoningResult ||
      summary.reasoningResult ||
      summary.reasoningStagePacket?.cognitiveReasoningResult ||
      summary.reasoningStagePacket?.reasoningResult ||
      summary.reasoningStagePacket?.generalReasoning
        ?.cognitiveReasoningResult ||
      summary.reasoningEngineResult?.cognitiveReasoningResult ||
      summary.reasoningEngineResult?.reasoningResult ||
      summary.reasoningEngineResult?.result
        ?.cognitiveReasoningResult ||
      summary.reasoningEngineResult?.result?.reasoningResult ||
      summary.reasoning?.cognitiveReasoningResult ||
      null
    );
  },

  readSemanticFrame(summary = {}, cognitiveReasoningResult = null) {
    return (
      cognitiveReasoningResult?.semanticFrame ||
      summary.semanticFrame ||
      summary.aiSemanticFrame ||
      summary.reasoningStagePacket?.semanticFrame ||
      summary.reasoningStagePacket?.cognitiveReasoningResult
        ?.semanticFrame ||
      summary.reasoningStagePacket?.reasoningResult
        ?.semanticFrame ||
      summary.reasoningStagePacket?.generalReasoning
        ?.semanticFrame ||
      summary.reasoningStagePacket?.generalReasoning
        ?.cognitiveReasoningResult?.semanticFrame ||
      summary.reasoningEngineResult?.semanticFrame ||
      summary.reasoningEngineResult?.cognitiveReasoningResult
        ?.semanticFrame ||
      summary.reasoningEngineResult?.reasoningResult
        ?.semanticFrame ||
      summary.reasoningEngineResult?.result?.semanticFrame ||
      summary.reasoningEngineResult?.result
        ?.cognitiveReasoningResult?.semanticFrame ||
      summary.reasoningEngineResult?.result?.reasoningResult
        ?.semanticFrame ||
      summary.reasoning?.semanticFrame ||
      null
    );
  },

  readEvidencePacket(summary = {}) {
    return (
      summary.evidencePacket ||
      summary.perceptionStagePacket?.evidencePacket ||
      summary.evidenceBuilderResult?.evidencePacket ||
      null
    );
  },

  readBindingContracts(summary = {}) {
    return {
      safety:
        summary.safetyContract ||
        summary.safetyStagePacket ||
        summary.safetyDisposition ||
        summary.safetyContextGate ||
        null,

      routing:
        summary.routingContract ||
        summary.executiveRoutingContract ||
        summary.routingStagePacket ||
        null,

      execution:
        summary.executionContract ||
        summary.actionContract ||
        (summary.executionAllowed !== undefined ||
        summary.prohibitedOperations
          ? {
              executionAllowed: summary.executionAllowed,
              prohibitedOperations:
                summary.prohibitedOperations || []
            }
          : null)
    };
  },

  getOperationRegistry() {
    return (
      window.AriOperationRegistry ||
      window.Ari?.operationRegistry ||
      null
    );
  },

  evaluateRuntime(context = {}) {
    const errors = [];
    const warnings = [];

    const cognitiveReasoningAvailable = Boolean(
      context.cognitiveReasoningResult
    );

    const cognitiveReasoningUsable = Boolean(
      context.cognitiveReasoningResult &&
      context.cognitiveReasoningResult.ready !== false
    );

    const sourceFrameAvailable = Boolean(
      context.sourceSemanticFrame
    );

    const registryAvailable = Boolean(context.registry);

    if (!cognitiveReasoningAvailable) {
      errors.push("cognitive_reasoning_result_missing");
    } else if (!cognitiveReasoningUsable) {
      errors.push("cognitive_reasoning_result_not_ready");
    }

    if (!sourceFrameAvailable) {
      errors.push("authoritative_semantic_frame_missing");
    }

    if (!registryAvailable) {
      warnings.push(
        "operation_registry_unavailable_degraded_normalization"
      );
    }

    return {
      ready:
        cognitiveReasoningUsable &&
        sourceFrameAvailable,

      canNormalize: sourceFrameAvailable,
      cognitiveReasoningAvailable,
      cognitiveReasoningUsable,
      sourceFrameAvailable,
      registryAvailable,
      errors: this.unique(errors),
      warnings: this.unique(warnings)
    };
  },

  normalizeFrame(frame = {}, registry = null) {
    const operation =
      registry?.normalizeOperation?.(frame.operation) ||
      this.normalizeKey(frame.operation) ||
      null;

    const definition =
      registry?.getOperation?.(operation) ||
      null;

    const requiredSlots = this.asArray(
      definition?.requiredSlots
    );

    const normalizedSubject = this.normalizeSlot(
      frame.subject
    );

    const normalizedTarget = this.normalizeSlot(
      frame.target
    );

    const explicitObject = this.normalizeSlot(
      frame.object
    );

    const objectAliasSource = this.slotPresent(
      normalizedTarget
    )
      ? normalizedTarget
      : this.slotPresent(normalizedSubject)
        ? normalizedSubject
        : null;

    const normalizedObject =
      requiredSlots.includes("object") &&
      !this.slotPresent(explicitObject) &&
      this.slotPresent(objectAliasSource)
        ? { ...objectAliasSource }
        : explicitObject;

    return {
      ...frame,
      schema: "ari.normalized_semantic_frame",
      schemaVersion: this.schemaVersion,

      frameId:
        this.clean(frame.frameId || frame.id || "") ||
        null,

      interpretation: this.normalizeInterpretation(
        frame.interpretation
      ),

      operation,

      requestType:
        this.normalizeKey(
          definition?.requestType ||
          frame.requestType ||
          ""
        ) || null,

      frameType:
        this.normalizeKey(
          definition?.frameType ||
          frame.frameType ||
          ""
        ) || null,

      interactionFamily:
        this.normalizeKey(
          definition?.interactionFamily ||
          frame.interactionFamily ||
          ""
        ) || null,

      intentFamily:
        this.normalizeKey(
          definition?.intentFamily ||
          frame.intentFamily ||
          ""
        ) || null,

      requestedOutput:
        this.normalizeKey(
          frame.requestedOutput ||
          definition?.defaultRequestedOutput ||
          ""
        ) || null,

      domain: this.normalizeDomain(
        frame.domain,
        definition?.defaultDomain
      ),

      participants: this.normalizeObject(
        frame.participants,
        {
          speaker: null,
          addressee: null,
          mentioned: []
        }
      ),

      subject: normalizedSubject,
      object: normalizedObject,
      target: normalizedTarget,

      artifactTarget: this.normalizeSlot(
        frame.artifactTarget,
        true
      ),

      referent: this.normalizeObject(
        frame.referent,
        null
      ),

      options: this.asArray(frame.options),
      criteria: this.asArray(frame.criteria),
      timeframe: frame.timeframe ?? null,
      audience: frame.audience ?? null,
      location: frame.location ?? null,
      contextModifiers: this.asArray(frame.contextModifiers),
      constraints: this.asArray(frame.constraints),
      stakes: this.asArray(frame.stakes),
      continuity: this.normalizeContinuity(frame.continuity),
      ambiguity: this.normalizeAmbiguity(frame.ambiguity),
      execution: this.normalizeExecution(frame.execution),
      secondaryRequests: this.asArray(frame.secondaryRequests),
      confidence: this.normalizeConfidenceObject(frame.confidence),
      evidenceRefs: this.unique(this.asArray(frame.evidenceRefs)),

      grounding: this.normalizeObject(
        frame.grounding,
        {
          evidencePacketId: null,
          supportedClaims: [],
          unsupportedAssumptions: []
        }
      ),

      authority: {
        ...this.normalizeObject(frame.authority, {}),
        meaningSource: "openai_cognitive_reasoning",
        authoritativeForMeaning: true,
        normalizedBy: this.source,
        validatorMayBlockPlanning: false,
        validatorMayOverrideMeaning: false
      }
    };
  },

  runAudit(context = {}) {
    const checks = {
      schema: this.auditSchema(
        context.normalizedSemanticFrame
      ),

      registry: this.auditRegistry(
        context.normalizedSemanticFrame,
        context.registry
      ),

      slots: null,

      evidence: this.auditEvidence(
        context.normalizedSemanticFrame,
        context.evidencePacket
      ),

      continuity: this.auditContinuity(
        context.normalizedSemanticFrame
      ),

      safety: this.auditSafety(
        context.normalizedSemanticFrame,
        context.contracts?.safety
      ),

      execution: this.auditExecution(
        context.normalizedSemanticFrame,
        context.contracts?.execution
      ),

      routing: this.auditRouting(
        context.normalizedSemanticFrame,
        context.contracts?.routing
      ),

      authority: this.auditAuthority(
        context.sourceSemanticFrame,
        context.normalizedSemanticFrame,
        context.cognitiveReasoningResult
      )
    };

    checks.slots = this.auditRequiredSlots(
      context.normalizedSemanticFrame,
      checks.registry.definition
    );

    const errors = [];
    const warnings = [];
    const conflicts = [];

    Object.values(checks).forEach(check => {
      errors.push(...this.asArray(check?.errors));
      warnings.push(...this.asArray(check?.warnings));
      conflicts.push(...this.asArray(check?.conflicts));
    });

    const uniqueErrors = this.unique(errors);
    const uniqueWarnings = this.unique(warnings);
    const uniqueConflicts = this.dedupeObjects(conflicts);

    return {
      completed: true,
      passed: uniqueErrors.length === 0,
      accepted: uniqueErrors.length === 0,
      advisory: true,
      blocking: false,
      errors: uniqueErrors,
      warnings: uniqueWarnings,
      conflicts: uniqueConflicts,
      checks
    };
  },

  auditSchema(frame = null) {
    const errors = [];
    const warnings = [];
    const requiredFields = [
      "operation",
      "requestedOutput",
      "interactionFamily",
      "intentFamily",
      "domain",
      "ambiguity",
      "execution"
    ];

    if (!frame || typeof frame !== "object") {
      return {
        passed: false,
        errors: ["semantic_frame_must_be_object"],
        warnings,
        conflicts: [],
        requiredFields,
        missingFields: requiredFields,
        invalidTypes: []
      };
    }

    const missingFields = requiredFields.filter(
      field =>
        frame[field] === null ||
        frame[field] === undefined ||
        frame[field] === ""
    );

    errors.push(
      ...missingFields.map(
        field => `missing_required_field:${field}`
      )
    );

    const invalidTypes = [];

    if (
      frame.ambiguity &&
      typeof frame.ambiguity !== "object"
    ) {
      invalidTypes.push("ambiguity");
    }

    if (
      frame.execution &&
      typeof frame.execution !== "object"
    ) {
      invalidTypes.push("execution");
    }

    errors.push(
      ...invalidTypes.map(
        field => `invalid_field_type:${field}`
      )
    );

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      conflicts: [],
      requiredFields,
      missingFields,
      invalidTypes
    };
  },

  auditRegistry(frame = null, registry = null) {
    const errors = [];
    const warnings = [];
    const conflicts = [];

    if (!frame) {
      return {
        passed: false,
        errors: ["semantic_frame_missing"],
        warnings,
        conflicts,
        operationRegistered: false,
        operation: null,
        definition: null
      };
    }

    if (!registry) {
      warnings.push("operation_registry_unavailable");

      return {
        passed: true,
        errors,
        warnings,
        conflicts,
        operationRegistered: null,
        operation: frame.operation,
        definition: null
      };
    }

    const definition =
      registry.getOperation?.(frame.operation) || null;

    const operationRegistered = Boolean(definition);

    if (!operationRegistered) {
      errors.push("semantic_operation_not_registered");
    } else {
      const checks = [
        ["requestType", definition.requestType],
        ["frameType", definition.frameType],
        ["interactionFamily", definition.interactionFamily],
        ["intentFamily", definition.intentFamily]
      ];

      checks.forEach(([field, expected]) => {
        if (
          frame[field] &&
          expected &&
          frame[field] !== expected
        ) {
          conflicts.push({
            code: "operation_contract_mismatch",
            path: field,
            frameValue: frame[field],
            contractValue: expected,
            severity: "error"
          });
        }
      });

      if (conflicts.length) {
        errors.push("operation_contract_mismatch");
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      conflicts,
      operationRegistered,
      operation: frame.operation,
      definition
    };
  },

  auditRequiredSlots(frame = null, definition = null) {
    const requiredSlots = this.asArray(
      definition?.requiredSlots
    );

    const presentSlots = requiredSlots.filter(
      slot => this.slotPresent(frame?.[slot])
    );

    const missingSlots = requiredSlots.filter(
      slot => !presentSlots.includes(slot)
    );

    return {
      passed: missingSlots.length === 0,
      errors: missingSlots.map(
        slot => `missing_required_slot:${slot}`
      ),
      warnings: [],
      conflicts: [],
      requiredSlots,
      presentSlots,
      missingSlots,
      completenessScore:
        requiredSlots.length === 0
          ? 1
          : presentSlots.length / requiredSlots.length
    };
  },

  auditEvidence(frame = null, packet = null) {
    const warnings = [];

    if (!packet) {
      warnings.push("evidence_packet_unavailable");

      return {
        passed: true,
        errors: [],
        warnings,
        conflicts: [],
        evidencePacketId: null,
        referencedEvidenceCount: this.asArray(
          frame?.evidenceRefs
        ).length,
        validEvidenceRefs: [],
        unknownEvidenceRefs: this.asArray(
          frame?.evidenceRefs
        ),
        unsupportedClaims: []
      };
    }

    const known = new Set(
      this.asArray(packet.observations)
        .map(observation => observation?.id)
        .filter(Boolean)
    );

    const references = this.unique([
      ...this.asArray(frame?.evidenceRefs),
      ...this.asArray(frame?.interpretation?.evidenceRefs)
    ]);

    const unknownEvidenceRefs = references.filter(
      reference => !known.has(reference)
    );

    const validEvidenceRefs = references.filter(
      reference => known.has(reference)
    );

    if (unknownEvidenceRefs.length) {
      warnings.push("unknown_evidence_references_present");
    }

    const unsupportedClaims = this.asArray(
      frame?.grounding?.unsupportedAssumptions
    );

    if (unsupportedClaims.length) {
      warnings.push("unsupported_assumptions_present");
    }

    return {
      passed: true,
      errors: [],
      warnings,
      conflicts: [],
      evidencePacketId: packet.packetId || null,
      referencedEvidenceCount: references.length,
      validEvidenceRefs,
      unknownEvidenceRefs,
      unsupportedClaims
    };
  },

  auditContinuity(frame = null) {
    const errors = [];
    const continuity = frame?.continuity || {};

    const priorContextRequired =
      continuity.requiresPriorContext === true;

    const referencePresent =
      continuity.referencePresent === true;

    const referenceResolved =
      continuity.referenceResolved === true;

    const missingAnchor =
      continuity.missingAnchor === true ||
      (priorContextRequired &&
        referencePresent &&
        !referenceResolved);

    if (
      missingAnchor &&
      frame?.ambiguity?.requiresClarification !== true
    ) {
      errors.push(
        "unresolved_continuity_requires_clarification"
      );
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: [],
      conflicts: [],
      priorContextRequired,
      referencePresent,
      referenceResolved,
      missingAnchor
    };
  },

  auditSafety(frame = null, contract = null) {
    const warnings = [];
    const conflicts = [];

    if (!contract) {
      warnings.push("safety_contract_unavailable");

      return {
        passed: true,
        errors: [],
        warnings,
        conflicts,
        safetyStopRequired: false,
        semanticFrameSafetyCompatible: true
      };
    }

    const safetyStopRequired =
      contract.stopRequired === true ||
      contract.safetyStopRequired === true ||
      contract.allowed === false;

    const semanticFrameSafetyCompatible =
      !safetyStopRequired ||
      frame?.execution?.analysisOnly === true ||
      frame?.execution?.executionRequested !== true;

    if (!semanticFrameSafetyCompatible) {
      warnings.push(
        "semantic_frame_conflicts_with_safety_contract"
      );

      conflicts.push({
        code: "safety_contract_conflict",
        path: "execution.executionRequested",
        frameValue: frame?.execution?.executionRequested,
        contractValue: false,
        severity: "warning"
      });
    }

    return {
      passed: true,
      errors: [],
      warnings,
      conflicts,
      safetyStopRequired,
      semanticFrameSafetyCompatible
    };
  },

  auditExecution(frame = null, contract = null) {
    const warnings = [];
    const conflicts = [];
    const execution = frame?.execution || {};

    const executionRequested =
      execution.executionRequested === true;

    const contractAllows =
      contract?.executionAllowed !== false &&
      contract?.allowed !== false;

    const prohibitedOperations = this.unique([
      ...this.asArray(contract?.prohibitedOperations),
      ...this.asArray(execution.prohibitedOperations)
    ]);

    const prohibitedOperationRequested =
      executionRequested &&
      prohibitedOperations.includes(frame?.operation);

    if (
      executionRequested &&
      (!contractAllows ||
        execution.executionAllowed === false ||
        prohibitedOperationRequested)
    ) {
      warnings.push(
        "semantic_frame_requests_prohibited_execution"
      );

      conflicts.push({
        code: "execution_contract_conflict",
        path: "execution.executionAllowed",
        frameValue: execution.executionAllowed,
        contractValue: contractAllows,
        severity: "warning"
      });
    }

    if (!contract) {
      warnings.push("execution_contract_unavailable");
    }

    return {
      passed: true,
      errors: [],
      warnings,
      conflicts,
      executionRequested,
      executionAllowed:
        execution.executionAllowed !== false &&
        contractAllows,
      analysisOnly: execution.analysisOnly === true,
      prohibitedOperationRequested,
      prohibitedOperations
    };
  },

  auditRouting(frame = null, contract = null) {
    const warnings = [];

    if (!contract) {
      warnings.push("routing_contract_unavailable");

      return {
        passed: true,
        errors: [],
        warnings,
        conflicts: [],
        laneCompatible: true,
        domainCompatible: true
      };
    }

    const expectedDomain =
      this.normalizeKey(
        contract.primaryDomain ||
        contract.domain ||
        ""
      ) || null;

    const frameDomain =
      this.normalizeKey(
        frame?.domain?.primary ||
        frame?.domain ||
        ""
      ) || null;

    const domainCompatible =
      !expectedDomain ||
      !frameDomain ||
      expectedDomain === frameDomain ||
      expectedDomain === "general" ||
      expectedDomain === "general_understanding";

    if (!domainCompatible) {
      warnings.push(
        "semantic_domain_differs_from_routing_domain"
      );
    }

    return {
      passed: true,
      errors: [],
      warnings,
      conflicts: [],
      laneCompatible: true,
      domainCompatible
    };
  },

  auditAuthority(
    sourceFrame = null,
    normalizedFrame = null,
    cognitiveReasoningResult = null
  ) {
    const warnings = [];

    const source = String(
      cognitiveReasoningResult?.source ||
      cognitiveReasoningResult?.provider ||
      sourceFrame?.authority?.source ||
      ""
    ).toLowerCase();

    const cognitiveSourceAuthoritative = Boolean(
      cognitiveReasoningResult &&
      (sourceFrame?.authority?.authoritativeForMeaning === true ||
        cognitiveReasoningResult.authoritativeForMeaning === true ||
        source.includes("openai"))
    );

    if (!cognitiveSourceAuthoritative) {
      warnings.push(
        "semantic_frame_source_not_marked_authoritative"
      );
    }

    return {
      passed: true,
      errors: [],
      warnings,
      conflicts: [],
      cognitiveSourceAuthoritative,
      localSemanticInferenceDetected: false,
      validatorChangedMeaning: false,
      validatorChangedOperation: Boolean(
        sourceFrame &&
        normalizedFrame &&
        this.normalizeKey(sourceFrame.operation) !==
          normalizedFrame.operation
      )
    };
  },

  buildResult({
    context = {},
    runtime = {},
    normalizedSemanticFrame = null,
    audit = {},
    compatibilityProjection = {},
    provenance = {},
    usable = false
  } = {}) {
    const usableSemanticFrame = usable
      ? {
          ...normalizedSemanticFrame,
          auditStatus:
            audit.passed
              ? "passed"
              : "findings_present",
          auditAdvisory: true,
          authority: {
            ...normalizedSemanticFrame?.authority,
            auditedBy: this.source,
            mayBeUsedByResponsePlanning: true
          }
        }
      : null;

    return {
      schema: "ari.semantic_frame_audit_result",
      schemaVersion: this.schemaVersion,
      ran: true,
      ready: usable,
      usable,
      source: this.source,
      version: this.version,
      sourceSemanticFrame: context.sourceSemanticFrame || null,
      normalizedSemanticFrame: usableSemanticFrame,
      usableSemanticFrame,
      audit,
      runtime,
      semanticCompatibility: compatibilityProjection,
      provenance,

      authority: {
        canNormalizeStructure: true,
        canNormalizeEnums: true,
        canNormalizeSlotAliases: true,
        canAuditSchema: true,
        canAuditRegistry: true,
        canAuditRequiredSlots: true,
        canAuditEvidence: true,
        canAuditContinuity: true,
        canAuditSafety: true,
        canAuditExecution: true,
        canAuditRouting: true,
        canAuditAuthority: true,
        canEmitCompatibilityProjection: true,
        canPreserveUsableSemanticFrame: true,
        canInferMeaning: false,
        canChangeUserGoal: false,
        canSelectOperation: false,
        canResolveSemanticAmbiguity: false,
        canInventMissingSlots: false,
        canRejectSemanticMeaning: false,
        canBlockResponsePlanning: false,
        canOverrideSafety: false,
        canExecuteActions: false,
        canAnswerUser: false,
        role: "semantic_normalization_and_advisory_audit"
      },

      compatibility: {
        semanticFrameValidatorRan: true,
        semanticFrameValidatorReady: usable,
        semanticFrameValidatorSource: this.source,
        semanticFrameValidatorVersion: this.version,
        semanticAuditRan: true,
        semanticAuditReady: Boolean(normalizedSemanticFrame),
        semanticAuditAccepted: audit.passed === true,
        semanticAuditAdvisory: true,
        semanticAuditBlocking: false,
        validatedSemanticFrame: usableSemanticFrame,
        rejectedSemanticFrame: null,
        auditFlaggedSemanticFrame:
          audit.passed
            ? null
            : usableSemanticFrame,

        semanticFrameValidation: {
          valid: audit.passed === true,
          accepted: audit.passed === true,
          auditAccepted: audit.passed === true,
          advisory: true,
          blocking: false,
          usable,
          planningAllowed: usable,
          complete: audit.completed === true,
          errors: audit.errors || [],
          warnings: audit.warnings || [],
          conflicts: audit.conflicts || [],
          checks: audit.checks || {}
        }
      }
    };
  },

  buildProvenance({
    context = {},
    runtime = {},
    normalizedSemanticFrame = null,
    audit = {},
    usable = false
  } = {}) {
    const sourceFrame = context.sourceSemanticFrame;

    return {
      cognitiveSource:
        context.cognitiveReasoningResult?.source ||
        context.cognitiveReasoningResult?.provider ||
        "openai_cognitive_reasoning",

      cognitiveResultId:
        context.cognitiveReasoningResult?.reasoningResultId ||
        context.cognitiveReasoningResult?.resultId ||
        context.cognitiveReasoningResult?.id ||
        null,

      evidencePacketId:
        context.evidencePacket?.packetId ||
        null,

      normalizerSource: this.source,
      normalizerVersion: this.version,

      transformations: sourceFrame
        ? [
            "operation_alias_normalization",
            "registry_contract_normalization",
            "confidence_normalization",
            "missing_optional_field_defaults",
            "canonical_slot_alias_normalization",
            "evidence_reference_validation"
          ]
        : [],

      meaningChanged: false,

      operationChanged: Boolean(
        sourceFrame &&
        normalizedSemanticFrame &&
        this.normalizeKey(sourceFrame.operation) !==
          normalizedSemanticFrame.operation
      ),

      requestedOutputChanged: false,
      ambiguityChanged: false,
      frameRejected: false,
      rejectionReason: null,
      auditPassed: audit.passed === true,
      auditFindingsPresent: audit.passed !== true,
      auditErrors: audit.errors || [],
      auditWarnings: audit.warnings || [],
      auditConflicts: audit.conflicts || [],
      runtimeErrors: runtime.errors || [],
      runtimeWarnings: runtime.warnings || [],
      usableForPlanning: usable,
      completedAt: new Date().toISOString()
    };
  },

  buildCompatibilityProjection(
    frame = {},
    cognitiveReasoningResult = {}
  ) {
    const responseStrategy =
      cognitiveReasoningResult?.responseStrategy || {};

    const canonicalMeaning = {
      requestedOperation: frame.operation,
      requestedOutput: frame.requestedOutput,
      interactionFamily: frame.interactionFamily,
      intentFamily: frame.intentFamily,
      target: frame.target,
      object: frame.object,
      options: frame.options,
      criteria: frame.criteria,
      continuity: frame.continuity,
      ambiguity: frame.ambiguity,
      execution: frame.execution,
      confidence: frame.confidence,
      source: "normalized_semantic_frame_projection"
    };

    const primaryFrame = {
      frameId: frame.frameId,
      frameType: frame.frameType,
      operation: frame.operation,
      requestType: frame.requestType,
      interactionFamily: frame.interactionFamily,
      intentFamily: frame.intentFamily,
      requestedOutput: frame.requestedOutput,
      domain: frame.domain,
      subject: frame.subject,
      object: frame.object,
      target: frame.target,
      artifactTarget: frame.artifactTarget,
      referent: frame.referent,
      options: frame.options,
      criteria: frame.criteria,
      continuity: frame.continuity,
      ambiguity: frame.ambiguity,
      confidence: frame.confidence,
      source: "normalized_semantic_frame_projection"
    };

    const semanticSlots = {
      participants: frame.participants,
      subject: frame.subject,
      object: frame.object,
      target: frame.target,
      artifactTarget: frame.artifactTarget,
      referent: frame.referent,
      options: frame.options,
      criteria: frame.criteria,
      timeframe: frame.timeframe,
      audience: frame.audience,
      location: frame.location
    };

    return {
      canonicalMeaning,
      primaryFrame,

      semanticSummary: {
        primaryMeaning:
          frame.interpretation?.primaryMeaning ||
          frame.frameType,
        operation: frame.operation,
        requestedOutput: frame.requestedOutput,
        domain: frame.domain,
        intent: frame.operation,
        interactionFamily: frame.interactionFamily,
        intentFamily: frame.intentFamily,
        confidence: frame.confidence?.overall ?? null,
        continuity: frame.continuity,
        ambiguity: frame.ambiguity,
        canonicalMeaning,
        source: "normalized_semantic_frame_projection"
      },

      semanticSlots,

      requestModel: {
        operation: frame.operation,
        requestType: frame.requestType,
        requestedOutput: frame.requestedOutput,
        interactionFamily: frame.interactionFamily,
        intentFamily: frame.intentFamily,
        source: "normalized_semantic_frame_projection"
      },

      responseRequirements: {
        requiredBehaviors: this.asArray(
          responseStrategy.requiredBehaviors
        ),
        forbiddenBehaviors: this.asArray(
          responseStrategy.forbiddenBehaviors
        ),
        constraints: this.asArray(
          responseStrategy.constraints
        ),
        responseShape:
          responseStrategy.responseShape || null,
        source: "cognitive_response_strategy_projection"
      }
    };
  },

  emptyCompatibilityProjection() {
    return {
      canonicalMeaning: null,
      primaryFrame: null,
      semanticSummary: null,
      semanticSlots: null,
      requestModel: null,
      responseRequirements: null
    };
  },

  normalizeInterpretation(value = {}) {
    return this.normalizeObject(value, {
      summary: null,
      userGoal: null,
      primaryMeaning: null,
      assumptions: [],
      evidenceRefs: []
    });
  },

  normalizeDomain(value, fallback = null) {
    if (!value) {
      return {
        primary: this.normalizeKey(fallback) || null,
        secondary: []
      };
    }

    if (typeof value === "string") {
      return {
        primary: this.normalizeKey(value),
        secondary: []
      };
    }

    return {
      primary:
        this.normalizeKey(
          value.primary ||
          value.value ||
          fallback ||
          ""
        ) || null,

      secondary: this.unique(
        this.asArray(value.secondary)
          .map(item => this.normalizeKey(item))
          .filter(Boolean)
      )
    };
  },

  normalizeSlot(value, allowNull = false) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return allowNull
        ? null
        : {
            type: null,
            value: null,
            evidenceRefs: []
          };
    }

    if (typeof value === "string") {
      return {
        type: null,
        value,
        evidenceRefs: []
      };
    }

    return {
      ...value,
      type: this.normalizeKey(value.type || "") || null,
      value:
        value.value ??
        value.text ??
        value.name ??
        null,
      evidenceRefs: this.unique(
        this.asArray(value.evidenceRefs)
      )
    };
  },

  normalizeContinuity(value = {}) {
    return this.normalizeObject(value, {
      requiresPriorContext: false,
      referencePresent: false,
      referenceType: null,
      referenceSurface: null,
      referenceResolved: false,
      resolvedReferenceValue: null,
      sourceTurnId: null,
      resolutionSource: null,
      missingAnchor: false
    });
  },

  normalizeAmbiguity(value = {}) {
    return this.normalizeObject(value, {
      present: false,
      requiresClarification: false,
      reason: null,
      unresolvedSlots: [],
      competingInterpretations: [],
      clarificationQuestion: null
    });
  },

  normalizeExecution(value = {}) {
    return this.normalizeObject(value, {
      executionRequested: false,
      executionKind: null,
      executionAllowed: true,
      analysisOnly: false,
      prohibitedOperations: [],
      deferredOperations: []
    });
  },

  normalizeConfidenceObject(value) {
    if (
      typeof value === "number" ||
      typeof value === "string"
    ) {
      const overall = this.normalizeConfidence(value);

      return {
        overall,
        interpretation: overall,
        operation: overall,
        slots: overall,
        continuity: overall
      };
    }

    const source =
      value && typeof value === "object"
        ? value
        : {};

    return {
      overall: this.normalizeConfidence(source.overall),
      interpretation: this.normalizeConfidence(
        source.interpretation
      ),
      operation: this.normalizeConfidence(source.operation),
      slots: this.normalizeConfidence(source.slots),
      continuity: this.normalizeConfidence(
        source.continuity
      )
    };
  },

  normalizeObject(value, defaults = {}) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return defaults === null
        ? null
        : { ...defaults };
    }

    return {
      ...(defaults || {}),
      ...value
    };
  },

  normalizeConfidence(value, fallback = 0.5) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    if (number > 1 && number <= 100) {
      return number / 100;
    }

    return Math.max(0, Math.min(1, number));
  },

  normalizeKey(value = "") {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  },

  slotPresent(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "object") {
      return Boolean(
        value.value ??
        value.name ??
        value.text ??
        value.resolvedValue ??
        (Object.keys(value).length > 0 &&
          !Object.values(value).every(
            item =>
              item === null ||
              item === undefined ||
              item === "" ||
              (Array.isArray(item) && item.length === 0)
          ))
      );
    }

    return true;
  },

  asArray(value) {
    if (Array.isArray(value)) {
      return value;
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

  unique(values = []) {
    return [...new Set(values.filter(Boolean))];
  },

  dedupeObjects(values = []) {
    const seen = new Set();

    return values.filter(item => {
      if (!item) {
        return false;
      }

      const key = JSON.stringify(item);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  },

  clean(value = "") {
    return String(value || "").trim();
  }
};

window.Ari.semanticFrameValidator =
  window.AriSemanticFrameValidator;

console.log(
  "ARI SEMANTIC FRAME VALIDATOR LOADED:",
  window.AriSemanticFrameValidator?.version
);
