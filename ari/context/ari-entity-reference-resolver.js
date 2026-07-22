// ari/context/ari-reference-resolution-engine.js
// Ari Reference Resolution Engine
//
// Purpose:
// Coordinate canonical reference resolution for the current turn and
// produce the authoritative Reference Packet.
//
// V2.0.0 — Canonical Resolver Adapter / Reference Packet Authority
//
// Architectural Flow:
//
// Turn Packet
//      ↓
// Turn Classification Packet
//      ↓
// Perception Packet
//      ↓
// Conversation Operating State
//      ↓
// Entity & Reference Resolver
//      ↓
// Reference Packet
//      ↓
// Context Selection Engine
//
// Responsibilities:
// - Read canonical runtime packets.
// - Build the bounded resolver input.
// - Execute AriEntityReferenceResolver.
// - Normalize its result into AriReferencePacket.
// - Preserve the resolved semantic structure.
// - Attach canonical reference outputs to the runtime.
// - Validate the produced packet.
// - Preserve deterministic diagnostics and existing runtime errors.
//
// Non-responsibilities:
// - Does not implement candidate scoring.
// - Does not create semantic structure.
// - Does not create thread context.
// - Does not retrieve memory.
// - Does not select execution context.
// - Does not perform routing.
// - Does not deliberate.
// - Does not answer users.

window.Ari = window.Ari || {};

window.AriReferenceResolutionEngine = {

  version: "2.0.0",

  schemaVersion: "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  run(runtime = {}) {

    const dependencyValidation =
      this.validateDependencies();

    if (
      dependencyValidation.valid !==
      true
    ) {

      return this.attachFailure({
        runtime,

        errors:
          dependencyValidation.errors,

        diagnostics: {
          complete: false,
          valid: false,
          resolverRan: false,
          packetCreated: false,
          error:
            "reference_resolution_dependencies_missing"
        }
      });

    }

    const resolverInput =
      this.buildResolverInput(
        runtime
      );

    let resolverResult = null;

    try {

      resolverResult =
        window
          .AriEntityReferenceResolver
          .resolve(
            resolverInput
          );

    }

    catch (error) {

      return this.attachFailure({
        runtime,

        errors: [
          "entity_reference_resolution_failed",
          error?.message ||
          "unknown_reference_resolution_error"
        ],

        diagnostics: {
          complete: false,
          valid: false,
          resolverRan: false,
          packetCreated: false,
          error:
            error?.message ||
            "entity_reference_resolution_failed"
        }
      });

    }

    const normalizedResolution =
      this.normalizeResolverResult(
        resolverResult
      );

    let referencePacket = null;

    try {

      referencePacket =
        window.AriReferencePacket.create({

          references:
            normalizedResolution
              .references,

          primaryReference:
            normalizedResolution
              .primaryReference,

          unresolvedReferences:
            normalizedResolution
              .unresolvedReferences,

          confidence:
            normalizedResolution
              .confidence,

          evidence:
            normalizedResolution
              .evidence,

          diagnostics:
            normalizedResolution
              .diagnostics

        });

    }

    catch (error) {

      return this.attachFailure({
        runtime,

        errors: [
          "reference_packet_creation_failed",
          error?.message ||
          "unknown_reference_packet_error"
        ],

        diagnostics: {
          complete: false,
          valid: false,
          resolverRan: true,
          packetCreated: false,
          error:
            error?.message ||
            "reference_packet_creation_failed"
        },

        additions: {
          referenceResolution:
            normalizedResolution
              .referenceResolution,

          resolvedSemanticStructure:
            normalizedResolution
              .resolvedSemanticStructure
        }
      });

    }

    const packetValidation =
      referencePacket.validation ||
      window.AriReferencePacket.validate(
        referencePacket
      );

    const packetValid =
      packetValidation.valid ===
      true;

    const runtimeErrors =
      packetValid
        ? this.readErrors(
            runtime.errors
          )
        : [
            ...this.readErrors(
              runtime.errors
            ),

            ...this.asArray(
              packetValidation.errors
            ).map(
              error =>
                `reference_packet:${error}`
            )
          ];

    return {

      ...runtime,

      errors:
        runtimeErrors,

      referencePacket,

      referenceResolution:
        normalizedResolution
          .referenceResolution,

      resolvedSemanticStructure:
        normalizedResolution
          .resolvedSemanticStructure,

      currentSemanticStructure:
        normalizedResolution
          .resolvedSemanticStructure,

      referenceCandidates:
        normalizedResolution
          .referenceCandidates,

      resolvedReferences:
        normalizedResolution
          .references,

      unresolvedReferences:
        normalizedResolution
          .unresolvedReferences,

      activeReference:
        normalizedResolution
          .primaryReference,

      diagnostics: {

        ...this.readObject(
          runtime.diagnostics
        ),

        referenceResolution: {

          complete:
            packetValid,

          valid:
            packetValid,

          resolverRan: true,

          packetCreated: true,

          resolverVersion:
            window
              .AriEntityReferenceResolver
              ?.version ||
            null,

          engineVersion:
            this.version,

          packetVersion:
            window
              .AriReferencePacket
              ?.version ||
            null,

          references:
            referencePacket
              .references
              .length,

          unresolved:
            referencePacket
              .unresolvedReferences
              .length,

          confidence:
            referencePacket
              .confidence,

          relationship:
            runtime
              .turnClassificationPacket
              ?.relationship ||
            null,

          validationErrors:
            this.asArray(
              packetValidation.errors
            ),

          validationWarnings:
            this.asArray(
              packetValidation.warnings
            )

        }

      }

    };

  },

  /* =====================================================
     RESOLVER INPUT
  ===================================================== */

  buildResolverInput(runtime = {}) {

    const turnPacket =
      this.readObject(
        runtime.turnPacket
      );

    const classificationPacket =
      this.readObject(
        runtime.turnClassificationPacket
      );

    const perceptionPacket =
      this.readObject(
        runtime.perceptionPacket
      );

    const operatingState =
      this.readObject(
        runtime.conversationOperatingState
      );

    const semanticStructure =
      this.readSemanticStructure({
        runtime,
        perceptionPacket
      });

    const threadContext =
      this.readThreadContext({
        runtime,
        operatingState
      });

    const userMessage =
      this.readCurrentMessage(
        turnPacket
      );

    /*
     * AriEntityReferenceResolver currently accepts a summary-shaped
     * object. This adapter preserves that contract while supplying the
     * new canonical packets as additional evidence.
     */

    return {

      summary: {

        turnPacket,

        turnClassificationPacket:
          classificationPacket,

        perceptionPacket,

        conversationOperatingState:
          operatingState,

        semanticStructure,

        currentSemanticStructure:
          semanticStructure,

        threadContext,

        userMessage,

        message:
          userMessage,

        normalizedMessage:
          turnPacket
            .normalizedMessage ||
          userMessage,

        turnId:
          turnPacket.turnId ||
          operatingState
            .currentTurn
            ?.turnId ||
          null,

        relationship:
          classificationPacket
            .relationship ||
          null,

        relationshipConfidence:
          classificationPacket
            .confidence ??
          null

      }

    };

  },

  readSemanticStructure({
    runtime = {},
    perceptionPacket = {}
  } = {}) {

    const candidates = [

      runtime
        .resolvedSemanticStructure,

      runtime
        .currentSemanticStructure,

      runtime
        .semanticStructure,

      perceptionPacket
        .semanticStructure,

      perceptionPacket
        .currentSemanticStructure,

      perceptionPacket
        .threadUnderstanding
        ?.semanticStructure,

      runtime
        .threadUnderstanding
        ?.semanticStructure,

      window.Ari
        ?.semanticStructure

    ];

    return (
      candidates.find(
        candidate =>
          candidate &&
          typeof candidate ===
            "object"
      ) ||
      {}
    );

  },

  readThreadContext({
    runtime = {},
    operatingState = {}
  } = {}) {

    const immediateHorizon =
      this.readObject(
        operatingState
          .immediateHorizon
      );

    const compactContext =
      this.readObject(
        operatingState
          .compactContext
      );

    const candidates = [

      runtime.threadContext,

      operatingState.threadContext,

      compactContext.threadContext,

      runtime
        .continuityPacket
        ?.threadContext,

      window.Ari
        ?.threadContext

    ];

    const existing =
      candidates.find(
        candidate =>
          candidate &&
          typeof candidate ===
            "object"
      );

    if (existing) {

      return {

        ...existing,

        currentTurn:
          existing.currentTurn ||
          operatingState.currentTurn ||
          null,

        immediatePreviousUserTurn:
          existing
            .immediatePreviousUserTurn ||
          immediateHorizon
            .previousUserTurn ||
          immediateHorizon
            .immediatePreviousUserTurn ||
          null,

        immediatePreviousAssistantTurn:
          existing
            .immediatePreviousAssistantTurn ||
          immediateHorizon
            .previousAssistantTurn ||
          immediateHorizon
            .immediatePreviousAssistantTurn ||
          null,

        recentTurns:
          this.asArray(
            existing.recentTurns
          ).length
            ? this.asArray(
                existing.recentTurns
              )
            : this.readRecentTurns(
                operatingState
              ),

        referenceCandidates:
          this.asArray(
            existing
              .referenceCandidates
          ).length
            ? this.asArray(
                existing
                  .referenceCandidates
              )
            : this.asArray(
                operatingState
                  .referenceCandidates
              )

      };

    }

    return {

      schema:
        "ari_thread_context",

      version:
        operatingState.version ||
        null,

      source:
        "ari-reference-resolution-engine",

      ran:
        Boolean(
          operatingState &&
          Object.keys(
            operatingState
          ).length
        ),

      threadId:
        operatingState.threadId ||
        null,

      currentTurn:
        operatingState.currentTurn ||
        null,

      immediatePreviousUserTurn:
        immediateHorizon
          .previousUserTurn ||
        immediateHorizon
          .immediatePreviousUserTurn ||
        null,

      immediatePreviousAssistantTurn:
        immediateHorizon
          .previousAssistantTurn ||
        immediateHorizon
          .immediatePreviousAssistantTurn ||
        null,

      recentTurns:
        this.readRecentTurns(
          operatingState
        ),

      referenceCandidates:
        this.asArray(
          operatingState
            .referenceCandidates
        ),

      continuitySignals:
        compactContext
          .continuitySignals ||
        operatingState
          .continuitySignals ||
        {},

      staleContext:
        this.asArray(
          operatingState
            .staleContext
        ),

      evidenceRefs:
        this.asArray(
          operatingState
            .evidenceRefs
        )

    };

  },

  readRecentTurns(
    operatingState = {}
  ) {

    const activeHorizon =
      this.readObject(
        operatingState
          .activeHorizon
      );

    const historicalHorizon =
      this.readObject(
        operatingState
          .historicalHorizon
      );

    const compactContext =
      this.readObject(
        operatingState
          .compactContext
      );

    const candidates = [

      operatingState.recentTurns,

      activeHorizon.recentTurns,

      compactContext.recentTurns,

      historicalHorizon.recentTurns

    ];

    return this.asArray(
      candidates.find(
        candidate =>
          Array.isArray(
            candidate
          ) &&
          candidate.length
      ) ||
      []
    );

  },

  readCurrentMessage(
    turnPacket = {}
  ) {

    return String(

      turnPacket
        .normalizedMessage ||

      turnPacket
        .effectiveMessage ||

      turnPacket
        .originalMessage ||

      turnPacket
        .message ||

      ""

    ).trim();

  },

  /* =====================================================
     RESULT NORMALIZATION
  ===================================================== */

  normalizeResolverResult(
    resolverResult = {}
  ) {

    const referenceResolution =
      this.readObject(

        resolverResult
          .referenceResolution

      );

    const references =
      this.normalizeResolvedReferences(

        resolverResult
          .resolvedReferences ||

        referenceResolution
          .resolvedReferences

      );

    const unresolvedReferences =
      this.normalizeUnresolvedReferences(

        resolverResult
          .unresolvedReferences ||

        referenceResolution
          .unresolvedReferences

      );

    const primaryReference =
      this.normalizePrimaryReference({

        resolverResult,

        references,

        unresolvedReferences

      });

    const resolvedSemanticStructure =
      this.readObject(

        resolverResult
          .resolvedSemanticStructure ||

        resolverResult
          .currentSemanticStructure ||

        referenceResolution
          .resolvedSemanticStructure

      );

    const quality =
      this.readObject(

        resolverResult
          .referenceResolutionQuality ||

        referenceResolution
          .quality

      );

    const evidence =
      this.asArray(

        referenceResolution
          .evidenceRefs ||

        resolverResult
          .evidenceRefs

      );

    const diagnostics =
      this.buildDiagnostics({

        resolverResult,

        referenceResolution,

        quality,

        references,

        unresolvedReferences

      });

    return {

      referenceResolution,

      resolvedSemanticStructure,

      referenceCandidates:
        this.asArray(
          resolverResult
            .referenceCandidates
        ),

      references,

      unresolvedReferences,

      primaryReference,

      confidence:
        this.normalizeConfidence(

          resolverResult
            .confidence ??

          referenceResolution
            .confidence ??

          quality
            .accuracyConfidence ??

          0

        ),

      evidence,

      diagnostics

    };

  },

  normalizeResolvedReferences(
    value = []
  ) {

    return this.asArray(value)
      .filter(
        reference =>
          reference &&
          typeof reference ===
            "object" &&
          (
            reference.status ===
              "resolved" ||
            reference.resolved ===
              true ||
            reference.resolvedTo
          )
      )
      .map(
        reference => ({

          referenceId:
            reference.referenceId ||
            reference.id ||
            null,

          surface:
            reference.surface ||
            null,

          referenceType:
            reference.referenceType ||
            "reference",

          semanticRole:
            reference.semanticRole ||
            null,

          status:
            "resolved",

          resolvedTo:
            reference.resolvedTo ||
            null,

          confidence:
            this.normalizeConfidence(
              reference.confidence ??
              reference
                .resolutionConfidence ??
              0
            ),

          score:
            this.normalizeNumber(
              reference.score ??
              reference
                .resolutionScore
            ),

          margin:
            this.normalizeNumber(
              reference.margin ??
              reference
                .resolutionMargin
            ),

          reason:
            reference.reason ||
            reference
              .resolutionReason ||
            null,

          candidates:
            this.asArray(
              reference.candidates
            ),

          evidenceRefs:
            this.asArray(
              reference.evidenceRefs
            )

        })
      );

  },

  normalizeUnresolvedReferences(
    value = []
  ) {

    return this.asArray(value)
      .filter(
        reference =>
          reference &&
          typeof reference ===
            "object"
      )
      .map(
        reference => ({

          referenceId:
            reference.referenceId ||
            reference.id ||
            null,

          surface:
            reference.surface ||
            null,

          referenceType:
            reference.referenceType ||
            "reference",

          semanticRole:
            reference.semanticRole ||
            null,

          status:
            reference.status ||
            (
              reference.ambiguity
                ?.present === true
                ? "ambiguous"
                : "unresolved"
            ),

          resolvedTo:
            null,

          confidence:
            this.normalizeConfidence(
              reference.confidence ??
              reference
                .resolutionConfidence ??
              0
            ),

          score:
            this.normalizeNumber(
              reference.score ??
              reference
                .resolutionScore
            ),

          margin:
            this.normalizeNumber(
              reference.margin ??
              reference
                .resolutionMargin
            ),

          reason:
            reference.reason ||
            reference
              .resolutionReason ||
            null,

          ambiguity:
            reference.ambiguity ||
            null,

          candidates:
            this.asArray(
              reference.candidates
            ),

          evidenceRefs:
            this.asArray(
              reference.evidenceRefs
            )

        })
      );

  },

  normalizePrimaryReference({
    resolverResult = {},
    references = [],
    unresolvedReferences = []
  } = {}) {

    const activeReference =
      resolverResult
        .activeReference;

    if (
      activeReference &&
      typeof activeReference ===
        "object"
    ) {

      const activeId =
        activeReference.referenceId ||
        activeReference.id ||
        null;

      return (
        references.find(
          reference =>
            reference.referenceId ===
            activeId
        ) ||
        unresolvedReferences.find(
          reference =>
            reference.referenceId ===
            activeId
        ) ||
        activeReference
      );

    }

    return (
      references[0] ||
      unresolvedReferences[0] ||
      null
    );

  },

  buildDiagnostics({
    resolverResult = {},
    referenceResolution = {},
    quality = {},
    references = [],
    unresolvedReferences = []
  } = {}) {

    return [

      {

        engine:
          "AriReferenceResolutionEngine",

        engineVersion:
          this.version,

        resolver:
          "AriEntityReferenceResolver",

        resolverVersion:
          resolverResult
            .entityReferenceResolverVersion ||
          window
            .AriEntityReferenceResolver
            ?.version ||
          null,

        resolverRan:
          resolverResult
            .entityReferenceResolverRan ===
          true,

        referenceCount:
          Number(
            quality.referenceCount ??
            references.length +
            unresolvedReferences.length
          ),

        resolvedCount:
          references.length,

        unresolvedCount:
          unresolvedReferences.length,

        confidence:
          this.normalizeConfidence(
            referenceResolution
              .confidence ??
            quality
              .accuracyConfidence ??
            0
          )

      },

      ...this.asArray(
        quality.warnings
      ),

      ...this.asArray(
        resolverResult.warnings
      )

    ];

  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validateDependencies() {

    const errors = [];

    if (
      !window
        .AriEntityReferenceResolver ||
      typeof window
        .AriEntityReferenceResolver
        .resolve !==
        "function"
    ) {

      errors.push(
        "entity_reference_resolver_unavailable"
      );

    }

    if (
      !window.AriReferencePacket ||
      typeof window
        .AriReferencePacket
        .create !==
        "function"
    ) {

      errors.push(
        "reference_packet_unavailable"
      );

    }

    return {

      valid:
        errors.length === 0,

      errors

    };

  },

  validate(runtime = {}) {

    if (
      !window.AriReferencePacket ||
      typeof window
        .AriReferencePacket
        .validate !==
        "function"
    ) {

      return {

        valid: false,

        errors: [
          "reference_packet_validator_missing"
        ],

        warnings: []

      };

    }

    return window
      .AriReferencePacket
      .validate(
        runtime.referencePacket
      );

  },

  /* =====================================================
     FAILURE HANDLING
  ===================================================== */

  attachFailure({
    runtime = {},
    errors = [],
    diagnostics = {},
    additions = {}
  } = {}) {

    return {

      ...runtime,

      ...additions,

      errors: [
        ...this.readErrors(
          runtime.errors
        ),

        ...this.asArray(
          errors
        )
      ],

      diagnostics: {

        ...this.readObject(
          runtime.diagnostics
        ),

        referenceResolution: {

          complete: false,

          valid: false,

          resolverRan: false,

          packetCreated: false,

          engineVersion:
            this.version,

          ...diagnostics

        }

      }

    };

  },

  /* =====================================================
     HELPERS
  ===================================================== */

  readErrors(value = []) {

    return this.asArray(value)
      .filter(Boolean);

  },

  readObject(value = {}) {

    if (
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
    ) {

      return value;

    }

    return {};

  },

  asArray(value = []) {

    if (
      Array.isArray(value)
    ) {

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

  normalizeConfidence(value = 0) {

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

  normalizeNumber(value = null) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {

      return null;

    }

    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number
      : null;

  }

};

window.Ari.referenceResolutionEngine =
  window.AriReferenceResolutionEngine;

console.log(
  "ARI REFERENCE RESOLUTION ENGINE LOADED:",
  window.AriReferenceResolutionEngine?.version
);