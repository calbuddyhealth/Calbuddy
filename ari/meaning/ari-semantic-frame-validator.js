// ari/meaning/ari-semantic-frame-validator.js
// Ari Semantic Frame Validator
//
// Purpose:
// Validate and normalize the semantic frame produced by OpenAI cognitive
// reasoning. This engine does not infer, repair, or replace semantic meaning.
//
// V1.1.1 — Canonical Slot Alias Normalization

window.Ari = window.Ari || {};

window.AriSemanticFrameValidator = {
  version: "1.1.1",
  schemaVersion: "1.1.0",
  source: "ari-semantic-frame-validator",
  authorityLevel: "semantic_frame_validation",

  validate(input = {}) {
  try {
    console.log(
  "SEMANTIC VALIDATOR START",
  {
    summaryKeys:
      input &&
      typeof input === "object"
        ? Object.keys(input.summary || input)
        : []
  }
);
    
    const summary = input.summary || input || {};
    const cognitiveResult = this.readCognitiveReasoningResult(summary);
    const sourceFrame = this.readSemanticFrame(summary, cognitiveResult);
    const evidencePacket = this.readEvidencePacket(summary);
    const contracts = this.readBindingContracts(summary);
    const registry = this.getOperationRegistry();

    const errors = [];
    const warnings = [];
    const conflicts = [];

    if (!cognitiveResult) {
      errors.push("cognitive_reasoning_result_missing");
    } else if (cognitiveResult.ready === false) {
      errors.push("cognitive_reasoning_result_not_ready");
    }

    if (!sourceFrame) {
      errors.push("authoritative_semantic_frame_missing");
    }

    if (!registry) {
      errors.push("operation_registry_not_loaded");
    }

    const normalizedFrame = sourceFrame
      ? this.normalizeFrame(sourceFrame, registry)
      : null;

console.log(
  "NORMALIZED SEMANTIC FRAME",
  JSON.parse(JSON.stringify(normalizedFrame))
);

console.log(
  "OPERATION REGISTRY LOOKUP",
  {
    originalOperation: sourceFrame?.operation,
    normalizedOperation: normalizedFrame?.operation,
    definition:
      registry?.getOperation?.(
        normalizedFrame?.operation
      )
  }
);

    const schemaValidation = this.validateSchema(normalizedFrame);
    const registryValidation = this.validateRegistry(
      normalizedFrame,
      registry
    );
    const slotValidation = this.validateRequiredSlots(
      normalizedFrame,
      registryValidation.definition
    );
    const evidenceValidation = this.validateEvidenceReferences(
      normalizedFrame,
      evidencePacket
    );
    const continuityValidation =
      this.validateContinuity(normalizedFrame);
    const safetyValidation = this.validateSafety(
      normalizedFrame,
      contracts.safety
    );
    const executionValidation = this.validateExecution(
      normalizedFrame,
      contracts.execution
    );
    const routingValidation = this.validateRouting(
      normalizedFrame,
      contracts.routing
    );
    const authorityValidation = this.validateAuthority(
      sourceFrame,
      normalizedFrame,
      cognitiveResult
    );

    this.collectValidationMessages(
      schemaValidation,
      errors,
      warnings,
      conflicts
    );
    this.collectValidationMessages(
      registryValidation,
      errors,
      warnings,
      conflicts
    );
    this.collectValidationMessages(
      slotValidation,
      errors,
      warnings,
      conflicts
    );
    this.collectValidationMessages(
      evidenceValidation,
      errors,
      warnings,
      conflicts
    );
    this.collectValidationMessages(
      continuityValidation,
      errors,
      warnings,
      conflicts
    );
    this.collectValidationMessages(
      safetyValidation,
      errors,
      warnings,
      conflicts
    );
    this.collectValidationMessages(
      executionValidation,
      errors,
      warnings,
      conflicts
    );
    this.collectValidationMessages(
      routingValidation,
      errors,
      warnings,
      conflicts
    );
    this.collectValidationMessages(
      authorityValidation,
      errors,
      warnings,
      conflicts
    );

console.log(
  "SEMANTIC VALIDATOR SUMMARY",
  {
    sourceFrame,
    normalizedFrame,
    cognitiveResult,

    schemaValidation,
    registryValidation,
    slotValidation,
    evidenceValidation,
    continuityValidation,
    safetyValidation,
    executionValidation,
    routingValidation,
    authorityValidation,

    errors,
    warnings,
    conflicts
  }
);

    const accepted = errors.length === 0;
    const validatedSemanticFrame = accepted
      ? {
          ...normalizedFrame,
          schema: "ari.validated_semantic_frame",
          schemaVersion: this.schemaVersion,
          validationStatus: "accepted",
          authority: {
            ...(normalizedFrame.authority || {}),
            meaningSource: "openai_cognitive_reasoning",
            validatedBy: this.source,
            authoritativeForMeaning: true,
            mayBeUsedByResponsePlanning: true
          }
        }
      : null;

    const semanticFrameValidation = {
      valid: accepted,
      complete:
        accepted &&
        slotValidation.valid === true &&
        schemaValidation.valid === true,
      accepted,
      errors: this.unique(errors),
      warnings: this.unique(warnings),
      conflicts: this.dedupeObjects(conflicts),
      schemaValidation,
      registryValidation,
      slotValidation,
      evidenceValidation,
      continuityValidation,
      safetyValidation,
      executionValidation,
      routingValidation,
      authorityValidation
    };

    const semanticFrameProvenance = {
      cognitiveSource:
        cognitiveResult?.source ||
        cognitiveResult?.provider ||
        "openai_cognitive_reasoning",
      cognitiveResultId:
        cognitiveResult?.reasoningResultId ||
        cognitiveResult?.resultId ||
        cognitiveResult?.id ||
        null,
      evidencePacketId: evidencePacket?.packetId || null,
      validatorSource: this.source,
      validatorVersion: this.version,
      transformations: sourceFrame
  ? [
      "enum_normalization",
      "confidence_normalization",
      "missing_optional_field_defaults",
      "canonical_slot_alias_normalization",
      "evidence_reference_validation"
    ]
  : [],
      meaningChanged: false,
      operationChanged:
        Boolean(
          sourceFrame &&
          normalizedFrame &&
          this.normalizeKey(sourceFrame.operation) !==
            normalizedFrame.operation
        ),
      requestedOutputChanged: false,
      ambiguityChanged: false,
      frameRejected: !accepted,
      rejectionReason:
        accepted ? null : this.unique(errors)[0] || "semantic_frame_rejected",
      validatedAt: new Date().toISOString()
    };

    return {
      schema: "ari.semantic_frame_validation_result",
      schemaVersion: this.schemaVersion,
      semanticFrameValidatorRan: true,
      semanticFrameValidatorReady: accepted,
      semanticFrameValidatorSource: this.source,
      semanticFrameValidatorVersion: this.version,

      input: {
        frameAvailable: Boolean(sourceFrame),
        cognitiveReasoningReady:
          Boolean(cognitiveResult) &&
          cognitiveResult.ready !== false,
        evidencePacketAvailable: Boolean(evidencePacket),
        safetyContractAvailable: Boolean(contracts.safety),
        routingContractAvailable: Boolean(contracts.routing),
        executionContractAvailable: Boolean(contracts.execution)
      },

      validatedSemanticFrame,
      rejectedSemanticFrame: accepted ? null : normalizedFrame,
      semanticFrameValidation,
      semanticFrameProvenance,
      semanticCompatibility: accepted
        ? this.buildCompatibilityProjection(
            validatedSemanticFrame,
            cognitiveResult
          )
        : this.emptyCompatibilityProjection(),

      authority: {
        canValidateSchema: true,
        canNormalizeEnums: true,
        canValidateEvidenceRefs: true,
        canRejectUnsupportedFrame: true,
        canRejectSafetyConflict: true,
        canRejectExecutionConflict: true,
        canEmitCompatibilityProjections: true,
        canInferMeaning: false,
        canChangeUserGoal: false,
        canSelectOperation: false,
        canResolveSemanticAmbiguity: false,
        canInventMissingSlots: false,
        canChooseResponseStrategy: false,
        canOverrideSafety: false,
        canExecuteActions: false,
        canAnswerUser: false,
        role: "semantic_frame_validation"
      }
    };
  
    } catch (error) {

    console.error(
      "SEMANTIC VALIDATOR CRASH",
      {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        error
      }
    );

    throw error;
  }
  },

  build(input = {}) {
    return this.validate(input);
  },

  create(input = {}) {
    return this.validate(input);
  },

  readCognitiveReasoningResult(summary = {}) {
  return (
    summary.cognitiveReasoningResult ||

    summary.reasoningResult ||

    summary.reasoningStagePacket
      ?.cognitiveReasoningResult ||

    summary.reasoningStagePacket
      ?.reasoningResult ||

    summary.reasoningStagePacket
      ?.generalReasoning
      ?.cognitiveReasoningResult ||

    summary.reasoningEngineResult
      ?.cognitiveReasoningResult ||

    summary.reasoningEngineResult
      ?.reasoningResult ||

    summary.reasoningEngineResult
      ?.result
      ?.cognitiveReasoningResult ||

    summary.reasoningEngineResult
      ?.result
      ?.reasoningResult ||

    summary.reasoning
      ?.cognitiveReasoningResult ||

    null
  );
},

  readSemanticFrame(
  summary = {},
  cognitiveResult = null
) {
  return (
    /*
     * Canonical reasoning-result location.
     */

    cognitiveResult
      ?.semanticFrame ||

    /*
     * Canonical top-level stage integration fields.
     */

    summary.semanticFrame ||

    summary.aiSemanticFrame ||

    /*
     * Canonical reasoning-stage packet fields.
     */

    summary.reasoningStagePacket
      ?.semanticFrame ||

    summary.reasoningStagePacket
      ?.cognitiveReasoningResult
      ?.semanticFrame ||

    summary.reasoningStagePacket
      ?.reasoningResult
      ?.semanticFrame ||

    summary.reasoningStagePacket
      ?.generalReasoning
      ?.semanticFrame ||

    summary.reasoningStagePacket
      ?.generalReasoning
      ?.cognitiveReasoningResult
      ?.semanticFrame ||

    /*
     * Raw engine compatibility fields.
     */

    summary.reasoningEngineResult
      ?.semanticFrame ||

    summary.reasoningEngineResult
      ?.cognitiveReasoningResult
      ?.semanticFrame ||

    summary.reasoningEngineResult
      ?.reasoningResult
      ?.semanticFrame ||

    summary.reasoningEngineResult
      ?.result
      ?.semanticFrame ||

    summary.reasoningEngineResult
      ?.result
      ?.cognitiveReasoningResult
      ?.semanticFrame ||

    summary.reasoningEngineResult
      ?.result
      ?.reasoningResult
      ?.semanticFrame ||

    /*
     * Legacy compatibility location.
     */

    summary.reasoning
      ?.semanticFrame ||

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
        (
          summary.executionAllowed !== undefined ||
          summary.prohibitedOperations
            ? {
                executionAllowed: summary.executionAllowed,
                prohibitedOperations:
                  summary.prohibitedOperations || []
              }
            : null
        )
    };
  },

  getOperationRegistry() {
    return (
      window.AriOperationRegistry ||
      window.Ari?.operationRegistry ||
      null
    );
  },

  normalizeFrame(frame = {}, registry = null) {
  const operation =
    registry?.normalizeOperation?.(
      frame.operation
    ) ||
    this.normalizeKey(
      frame.operation
    ) ||
    null;

  const definition =
    registry?.getOperation?.(
      operation
    ) ||
    null;

  const requiredSlots =
    this.asArray(
      definition?.requiredSlots
    );

  const normalizedSubject =
    this.normalizeSlot(
      frame.subject
    );

  const normalizedTarget =
    this.normalizeSlot(
      frame.target
    );

  const explicitObject =
    this.normalizeSlot(
      frame.object
    );

  /*
   * Controlled structural alias:
   *
   * OpenAI may describe the thing being explained as
   * `target`, while the operation contract may require
   * the canonical `object` slot.
   *
   * This does not infer or alter meaning. It copies an
   * already-authoritative slot value into the canonical
   * contract location only when:
   *
   * - the operation requires `object`
   * - no explicit object was supplied
   * - an authoritative target was supplied
   */

  const normalizedObject =
    requiredSlots.includes(
      "object"
    ) &&
    !this.slotPresent(
      explicitObject
    ) &&
    this.slotPresent(
      normalizedTarget
    )
      ? {
          ...normalizedTarget
        }
      : explicitObject;

  return {
    ...frame,

    schema:
      frame.schema ||
      "ari.cognitive_semantic_frame",

    schemaVersion:
      frame.schemaVersion ||
      this.schemaVersion,

    frameId:
      this.clean(
        frame.frameId ||
        frame.id ||
        ""
      ) ||
      null,

    interpretation:
      this.normalizeInterpretation(
        frame.interpretation
      ),

    operation,

    requestType:
      this.normalizeKey(
        frame.requestType ||
        definition?.requestType ||
        ""
      ) ||
      null,

    frameType:
      this.normalizeKey(
        frame.frameType ||
        definition?.frameType ||
        ""
      ) ||
      null,

    interactionFamily:
      this.normalizeKey(
        frame.interactionFamily ||
        definition?.interactionFamily ||
        ""
      ) ||
      null,

    intentFamily:
      this.normalizeKey(
        frame.intentFamily ||
        definition?.intentFamily ||
        ""
      ) ||
      null,

    requestedOutput:
      this.normalizeKey(
        frame.requestedOutput ||
        definition
          ?.defaultRequestedOutput ||
        ""
      ) ||
      null,

    domain:
      this.normalizeDomain(
        frame.domain,
        definition?.defaultDomain
      ),

    participants:
      this.normalizeObject(
        frame.participants,
        {
          speaker: null,
          addressee: null,
          mentioned: []
        }
      ),

    subject:
      normalizedSubject,

    object:
      normalizedObject,

    target:
      normalizedTarget,

    artifactTarget:
      this.normalizeSlot(
        frame.artifactTarget,
        true
      ),

    referent:
      this.normalizeObject(
        frame.referent,
        null
      ),

    options:
      this.asArray(
        frame.options
      ),

    criteria:
      this.asArray(
        frame.criteria
      ),

    timeframe:
      frame.timeframe ??
      null,

    audience:
      frame.audience ??
      null,

    location:
      frame.location ??
      null,

    contextModifiers:
      this.asArray(
        frame.contextModifiers
      ),

    constraints:
      this.asArray(
        frame.constraints
      ),

    stakes:
      this.asArray(
        frame.stakes
      ),

    continuity:
      this.normalizeContinuity(
        frame.continuity
      ),

    ambiguity:
      this.normalizeAmbiguity(
        frame.ambiguity
      ),

    execution:
      this.normalizeExecution(
        frame.execution
      ),

    secondaryRequests:
      this.asArray(
        frame.secondaryRequests
      ),

    confidence:
      this.normalizeConfidenceObject(
        frame.confidence
      ),

    evidenceRefs:
      this.unique(
        this.asArray(
          frame.evidenceRefs
        )
      ),

    grounding:
      this.normalizeObject(
        frame.grounding,
        {
          evidencePacketId: null,
          supportedClaims: [],
          unsupportedAssumptions: []
        }
      ),

    authority:
      this.normalizeObject(
        frame.authority,
        {
          source:
            "openai_cognitive_reasoning",

          authoritativeForMeaning:
            true
        }
      )
  };
},

  validateSchema(frame = null) {
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
        valid: false,
        errors: ["semantic_frame_must_be_object"],
        warnings,
        conflicts: [],
        requiredFieldsPresent: [],
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

    if (missingFields.length) {
      errors.push(
        ...missingFields.map(
          field => `missing_required_field:${field}`
        )
      );
    }

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

    if (invalidTypes.length) {
      errors.push(
        ...invalidTypes.map(
          field => `invalid_field_type:${field}`
        )
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      conflicts: [],
      requiredFieldsPresent:
        requiredFields.filter(
          field => !missingFields.includes(field)
        ),
      missingFields,
      invalidTypes
    };
  },

  validateRegistry(frame = null, registry = null) {
    const errors = [];
    const warnings = [];
    const mismatches = [];

    if (!frame) {
      return {
        valid: false,
        errors: ["semantic_frame_missing"],
        warnings,
        conflicts: [],
        operationRegistered: false,
        operation: null,
        definition: null,
        mismatches
      };
    }

    if (!registry) {
      return {
        valid: false,
        errors: ["operation_registry_not_loaded"],
        warnings,
        conflicts: [],
        operationRegistered: false,
        operation: frame.operation,
        definition: null,
        mismatches
      };
    }

    const definition = registry.getOperation(frame.operation);
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

      for (const [field, expected] of checks) {
        if (
          frame[field] &&
          expected &&
          frame[field] !== expected
        ) {
          mismatches.push({
            code: "operation_contract_mismatch",
            path: field,
            frameValue: frame[field],
            contractValue: expected,
            severity: "error"
          });
        }
      }
    }

    if (mismatches.length) {
      errors.push("operation_contract_mismatch");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      conflicts: mismatches,
      operationRegistered,
      operation: frame.operation,
      definition,
      mismatches
    };
  },

  validateRequiredSlots(frame = null, definition = null) {
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
      valid: missingSlots.length === 0,
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

  validateEvidenceReferences(frame = null, packet = null) {
    const warnings = [];
    const errors = [];

    if (!packet) {
      warnings.push("evidence_packet_unavailable");
      return {
        valid: true,
        errors,
        warnings,
        conflicts: [],
        evidencePacketId: null,
        referencedEvidenceCount:
          this.asArray(frame?.evidenceRefs).length,
        validEvidenceRefs: [],
        unknownEvidenceRefs:
          this.asArray(frame?.evidenceRefs),
        unsupportedClaims: []
      };
    }

    const known = new Set(
      this.asArray(packet.observations).map(item => item.id)
    );
    const refs = this.unique([
      ...this.asArray(frame?.evidenceRefs),
      ...this.asArray(frame?.interpretation?.evidenceRefs)
    ]);
    const unknownEvidenceRefs = refs.filter(
      ref => !known.has(ref)
    );
    const validEvidenceRefs = refs.filter(
      ref => known.has(ref)
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
      valid: true,
      errors,
      warnings,
      conflicts: [],
      evidencePacketId: packet.packetId || null,
      referencedEvidenceCount: refs.length,
      validEvidenceRefs,
      unknownEvidenceRefs,
      unsupportedClaims
    };
  },

  validateContinuity(frame = null) {
    const continuity = frame?.continuity || {};
    const errors = [];

    const priorContextRequired =
      continuity.requiresPriorContext === true;
    const referencePresent =
      continuity.referencePresent === true;
    const referenceResolved =
      continuity.referenceResolved === true;
    const missingAnchor =
      continuity.missingAnchor === true ||
      (
        priorContextRequired &&
        referencePresent &&
        !referenceResolved
      );

    if (
      missingAnchor &&
      frame?.ambiguity?.requiresClarification !== true
    ) {
      errors.push(
        "unresolved_continuity_requires_clarification"
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
      conflicts: [],
      priorContextRequired,
      referencePresent,
      referenceResolved,
      missingAnchor
    };
  },

  validateSafety(frame = null, contract = null) {
    const conflicts = [];
    const errors = [];

    if (!contract) {
      return {
        valid: true,
        errors,
        warnings: ["safety_contract_unavailable"],
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
      conflicts.push({
        code: "safety_contract_conflict",
        path: "execution.executionRequested",
        frameValue: frame?.execution?.executionRequested,
        contractValue: false,
        severity: "error"
      });
      errors.push("semantic_frame_conflicts_with_safety_contract");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
      conflicts,
      safetyStopRequired,
      semanticFrameSafetyCompatible
    };
  },

  validateExecution(frame = null, contract = null) {
    const execution = frame?.execution || {};
    const conflicts = [];
    const errors = [];

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
      (
        !contractAllows ||
        execution.executionAllowed === false ||
        prohibitedOperationRequested
      )
    ) {
      conflicts.push({
        code: "execution_contract_conflict",
        path: "execution.executionAllowed",
        frameValue: execution.executionAllowed,
        contractValue: contractAllows,
        severity: "error"
      });
      errors.push(
        "semantic_frame_requests_prohibited_execution"
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: contract
        ? []
        : ["execution_contract_unavailable"],
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

  validateRouting(frame = null, contract = null) {
    if (!contract) {
      return {
        valid: true,
        errors: [],
        warnings: ["routing_contract_unavailable"],
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

    return {
      valid: true,
      errors: [],
      warnings: domainCompatible
        ? []
        : ["semantic_domain_differs_from_routing_domain"],
      conflicts: [],
      laneCompatible: true,
      domainCompatible
    };
  },

  validateAuthority(
    sourceFrame = null,
    normalizedFrame = null,
    cognitiveResult = null
  ) {
    const cognitiveSourceAuthoritative =
      Boolean(cognitiveResult) &&
      (
        sourceFrame?.authority
          ?.authoritativeForMeaning === true ||
        cognitiveResult.authoritativeForMeaning === true ||
        cognitiveResult.source?.includes?.("openai") ||
        cognitiveResult.provider?.includes?.("openai")
      );

    const errors = [];

    if (!cognitiveSourceAuthoritative) {
      errors.push("semantic_frame_source_not_authoritative");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
      conflicts: [],
      cognitiveSourceAuthoritative,
      localSemanticInferenceDetected: false,
      validatorChangedMeaning: false,
      validatorChangedOperation:
        Boolean(
          sourceFrame &&
          normalizedFrame &&
          this.normalizeKey(sourceFrame.operation) !==
            normalizedFrame.operation
        )
    };
  },

  buildCompatibilityProjection(
    frame = {},
    cognitiveResult = {}
  ) {
    const responseStrategy =
      cognitiveResult.responseStrategy ||
      {};

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
      source: "validated_semantic_frame_projection"
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
      source: "validated_semantic_frame_projection"
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
        source: "validated_semantic_frame_projection"
      },
      semanticSlots,
      requestModel: {
        operation: frame.operation,
        requestType: frame.requestType,
        requestedOutput: frame.requestedOutput,
        interactionFamily: frame.interactionFamily,
        intentFamily: frame.intentFamily,
        source: "validated_semantic_frame_projection"
      },
      responseRequirements: {
        requiredBehaviors:
          this.asArray(responseStrategy.requiredBehaviors),
        forbiddenBehaviors:
          this.asArray(responseStrategy.forbiddenBehaviors),
        constraints:
          this.asArray(responseStrategy.constraints),
        responseShape:
          responseStrategy.responseShape || null,
        source:
          "cognitive_response_strategy_projection"
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
      return allowNull ? null : {
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
        (
          Object.keys(value).length > 0 &&
          !Object.values(value).every(
            item =>
              item === null ||
              item === undefined ||
              item === "" ||
              (
                Array.isArray(item) &&
                item.length === 0
              )
          )
        )
      );
    }

    return true;
  },

  collectValidationMessages(
    result = {},
    errors = [],
    warnings = [],
    conflicts = []
  ) {
    errors.push(...this.asArray(result.errors));
    warnings.push(...this.asArray(result.warnings));
    conflicts.push(...this.asArray(result.conflicts));
  },

  normalizeConfidence(value, fallback = 0.5) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    if (number > 1 && number <= 100) return number / 100;
    return Math.max(0, Math.min(1, number));
  },

  normalizeKey(value = "") {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  },

  asArray(value) {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined || value === "") return [];
    return [value];
  },

  unique(values = []) {
    return [...new Set(values.filter(Boolean))];
  },

  dedupeObjects(values = []) {
    const seen = new Set();

    return values.filter(item => {
      if (!item) return false;
      const key = JSON.stringify(item);
      if (seen.has(key)) return false;
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