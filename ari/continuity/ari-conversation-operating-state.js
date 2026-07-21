// ari/continuity/ari-conversation-operating-state.js
// Ari Conversation Operating State
//
// Purpose:
// Build, maintain, and persist one concise authoritative operating state for
// the current conversation turn.
//
// V1.3.0 — Progressive Conversation Context Integration
//
// Architectural flow:
//
// Ari Thread Store
//      ↓
// Ari Conversation Operating State.beginTurn()
//      ↓
// Perception Pipeline
//      ↓
// Conversation Relationship Engine
//      ↓
// Reference Resolution Engine
//      ↓
// Ari Conversation Operating State.attachConversationContext()
//      ↓
// Routing / Deliberation / Expression / Delivery
//      ↓
// Ari Conversation Operating State.completeTurn()
//      ↓
// Ari Thread Store
//
// Responsibilities:
// - Load and normalize stored conversation state.
// - Create one current-turn Conversation Operating State.
// - Preserve the original current-turn text.
// - Preserve immediate prior user and assistant turns.
// - Preserve the active conversation frame.
// - Build concise active claims, entities, constraints, goals, and open loops.
// - Rank prior context into reference candidates.
// - Detect and expose non-authoritative reference signals.
// - Expose immediate, active, and historical continuity horizons.
// - Attach the authoritative Turn Classification Packet.
// - Attach the authoritative Reference Packet.
// - Preserve the canonical reference-resolution result.
// - Attach the resolved semantic structure.
// - Rebuild compact context after conversation authorities run.
// - Project continuity requirements into compatibility handoffs.
// - Preserve compatibility aliases for the existing pipeline.
// - Complete and persist the finished turn after Delivery.
//
// Non-responsibilities:
// - Does not classify the conversation.
// - Does not reinterpret semantic meaning.
// - Does not rewrite the current user turn.
// - Does not resolve elliptical follow-ups.
// - Does not bind entity references.
// - Does not choose the Conversation Function.
// - Does not choose the Situation Contract.
// - Does not determine safety severity.
// - Does not create a Response Plan.
// - Does not create response candidates.
// - Does not write the final response.
// - Does not retrieve long-term user memory.
// - Does not access Supabase.
// - Does not execute tools.

window.Ari = window.Ari || {};

window.AriConversationOperatingState = {
version: "1.3.0",
  schemaVersion: "1.0.0",
  source: "ari-conversation-operating-state",
  authorityLevel: "conversation_operating_state_authority",

  /* =====================================================
     PUBLIC ENTRY POINTS
  ===================================================== */

  async beginTurn(summary = {}) {
  const storedState =
    await this.loadStoredState();

  const normalizedStored =
    this.normalizeStoredState(
      storedState
    );

  const recentTurns =
    this.buildRecentTurns({
      summary,
      storedState:
        normalizedStored
    });

  /*
   * The Turn Intake Engine is the sole authority
   * responsible for creating the canonical Turn Packet.
   */
  const intakeState =
    await this.runTurnIntake({
      summary,
      storedState:
        normalizedStored,
      recentTurns
    });

  if (
    intakeState.turnIntakeEngineReady !==
      true ||
    !intakeState.turnPacket
  ) {
    return {
      ...intakeState,

      conversationOperatingState:
        null,

      conversationOperatingStateRan:
        false,

      conversationOperatingStateReady:
        false,

      conversationOperatingStateSource:
        this.source,

      conversationOperatingStateVersion:
        this.version,

      conversationOperatingStateError:
        intakeState.turnIntakeEngineError ||
        "canonical_turn_packet_not_ready"
    };
  }

  /*
   * COS does not create the turn.
   * It projects the immutable Turn Packet into the
   * continuity-facing currentTurn representation.
   */
  const input =
    this.normalizeCurrentTurnInput(
      intakeState
    );

if (
  !input.turnPacket ||
  !input.currentTurn
) {
  return {
    ...intakeState,

    conversationOperatingState:
      null,

    conversationOperatingStateRan:
      false,

    conversationOperatingStateReady:
      false,

    conversationOperatingStateSource:
      this.source,

    conversationOperatingStateVersion:
      this.version,

    conversationOperatingStateError:
      "canonical_turn_projection_failed"
  };
}

  const immediate =
    this.resolveImmediateHorizon(
      recentTurns
    );

  const activeFrame =
    this.buildActiveFrame({
      summary:
        intakeState,
      storedState:
        normalizedStored,
      immediate
    });

  const activeHorizon =
    this.buildActiveHorizon({
      summary:
        intakeState,
      storedState:
        normalizedStored,
      activeFrame
    });

  const historicalHorizon =
    this.buildHistoricalHorizon({
      summary:
        intakeState,
      storedState:
        normalizedStored,
      recentTurns,
      activeFrame,
      activeHorizon,
      currentTurn:
        input.currentTurn
    });

  const continuityMode =
    this.resolveContinuityMode({
      currentTurn:
        input.currentTurn,
      immediate,
      activeFrame,
      historicalHorizon
    });

  const referenceSignal =
    this.buildReferenceSignal(
      input.currentTurn
    );

  const operatingState = {
    schema:
      "ari_conversation_operating_state",

    schemaVersion:
      this.schemaVersion,

    source:
      this.source,

    version:
      this.version,

    authorityLevel:
      this.authorityLevel,

    createdAt:
      new Date()
        .toISOString(),

    conversationId:
      input.turnPacket
        ?.conversationId ||
      normalizedStored
        .conversationId ||
      intakeState.conversationId ||
      this.createConversationId(),

    turnIndex:
      this.resolveTurnIndex({
        summary:
          intakeState,
        storedState:
          normalizedStored,
        recentTurns
      }),

    /*
     * Immutable canonical intake authority.
     */
    turnPacket:
      input.turnPacket,

    /*
     * Continuity-facing projection.
     * This is not a second canonical turn contract.
     */
    currentTurn:
      input.currentTurn,

    immediateHorizon:
      immediate,

    activeHorizon,

    historicalHorizon,

    activeFrame,

    continuityMode,

    referenceSignal,

    priorContextAvailable:
      recentTurns.length >
      0,

    referenceCandidates:
      historicalHorizon
        .referenceCandidates,

    openLoops:
      activeHorizon
        .openLoops,

    unresolvedItems:
      activeHorizon
        .unresolvedItems,

    confidence:
      this.calculateOperatingStateConfidence({
        currentTurn:
          input.currentTurn,
        immediate,
        activeFrame,
        recentTurns
      }),

    compactContext:
      this.buildCompactContext({
        currentTurn:
          input.currentTurn,
        immediate,
        activeFrame,
        activeHorizon,
        historicalHorizon,
        continuityMode,
        referenceSignal
      }),

    rawStoredState:
      normalizedStored,

    authority:
      this.getAuthorityBoundaries()
  };

  return this.attachCompatibilityAliases({
    summary:
      intakeState,
    operatingState,
    storedState:
      normalizedStored,
    recentTurns,
    immediate,
    activeFrame,
    activeHorizon
  });
},

  build(summary = {}) {
    return this.beginTurn(
      summary
    );
  },

  async update(summary = {}) {
    const existing =
      summary
        .conversationOperatingState;

    if (
      !existing ||
      typeof existing !==
        "object"
    ) {
      return this.beginTurn(
        summary
      );
    }

    const activeFrame =
      this.buildActiveFrame({
        summary,
        storedState:
          existing.rawStoredState ||
          {},
        immediate:
          existing.immediateHorizon ||
          {}
      });

    const activeHorizon =
      this.buildActiveHorizon({
        summary,
        storedState:
          existing.rawStoredState ||
          {},
        activeFrame
      });

    const currentTurn =
  existing.currentTurn ||
  this.normalizeCurrentTurnInput({
    ...summary,

    turnPacket:
      summary.turnPacket ||
      existing.turnPacket ||
      null
  }).currentTurn;

if (!currentTurn) {
  return {
    ...summary,

    conversationOperatingState:
      existing,

    conversationOperatingStateRan:
      false,

    conversationOperatingStateReady:
      false,

    conversationOperatingStateError:
      "current_turn_projection_not_available"
  };
}

const historicalHorizon =
  this.buildHistoricalHorizon({
    summary,
    storedState:
      existing.rawStoredState ||
      {},
    recentTurns:
      this.toArray(
        existing
          .immediateHorizon
          ?.recentTurns
      ),
    activeFrame,
    activeHorizon,
    currentTurn
  });

        const turnClassificationPacket =
      this.readObject(
        summary
          .turnClassificationPacket
      ) ||
      this.readObject(
        existing
          .turnClassificationPacket
      );

    const referencePacket =
      this.readObject(
        summary.referencePacket
      ) ||
      this.readObject(
        existing.referencePacket
      );

    const referenceResolution =
      this.readObject(
        summary
          .referenceResolution
      ) ||
      this.readObject(
        existing
          .referenceResolution
      );

    const resolvedSemanticStructure =
      this.readObject(
        summary
          .resolvedSemanticStructure
      ) ||
      this.readObject(
        summary
          .currentSemanticStructure
      ) ||
      this.readObject(
        existing
          .resolvedSemanticStructure
      );

    const authoritativeContextAvailable =
      Boolean(
        turnClassificationPacket &&
        referencePacket
      );

    const continuityMode =
      authoritativeContextAvailable
        ? this.resolveAuthoritativeContinuityMode({
            existingMode:
              existing.continuityMode,

            turnClassificationPacket,

            referencePacket,

            immediate:
              existing.immediateHorizon ||
              {},

            activeFrame,

            currentTurn,

            historicalHorizon
          })
        : this.resolveContinuityMode({
            currentTurn,

            immediate:
              existing.immediateHorizon ||
              {},

            activeFrame,

            historicalHorizon
          });

    const referenceSignal =
      authoritativeContextAvailable
        ? this.buildAttachedReferenceSignal({
            existingSignal:
              existing.referenceSignal,

            referencePacket
          })
        : this.buildReferenceSignal(
            currentTurn
          );

    const operatingState = {
      ...existing,

      updatedAt:
        new Date()
          .toISOString(),

      activeFrame,

      activeHorizon,

      historicalHorizon,

      continuityMode,

            referenceSignal,

      turnClassificationPacket:
        turnClassificationPacket ||
        null,

      referencePacket:
        referencePacket ||
        null,

      referenceResolution:
        referenceResolution ||
        null,

      resolvedSemanticStructure:
        resolvedSemanticStructure ||
        null,

      referenceCandidates:
        historicalHorizon
          .referenceCandidates,

      openLoops:
        activeHorizon
          .openLoops,

      unresolvedItems:
        activeHorizon
          .unresolvedItems,

            compactContext:
        this.buildCompactContext({
          currentTurn,

          immediate:
            existing.immediateHorizon ||
            {},

          activeFrame,

          activeHorizon,

          historicalHorizon,

          continuityMode,

          referenceSignal,

          turnClassificationPacket:
            existing
              .turnClassificationPacket ||
            summary
              .turnClassificationPacket ||
            null,

          referencePacket:
            existing.referencePacket ||
            summary.referencePacket ||
            null,

          referenceResolution:
            existing
              .referenceResolution ||
            summary
              .referenceResolution ||
            null,

          resolvedSemanticStructure:
            existing
              .resolvedSemanticStructure ||
            summary
              .resolvedSemanticStructure ||
            summary
              .currentSemanticStructure ||
            null
        })
    };

    return this.attachCompatibilityAliases({
      summary,
      operatingState,
      storedState:
        existing.rawStoredState ||
        {},
      recentTurns:
        existing.immediateHorizon
          ?.recentTurns ||
        [],
      immediate:
        existing.immediateHorizon ||
        {},
      activeFrame,
      activeHorizon
    });
  },

  attachConversationContext(
    summary = {}
  ) {
    const existing =
      this.readObject(
        summary
          .conversationOperatingState
      );

    if (!existing) {
      return {
        ...summary,

        conversationOperatingState:
          null,

        conversationOperatingStateRan:
          false,

        conversationOperatingStateReady:
          false,

        conversationContextAttachmentRan:
          false,

        conversationContextAttachmentReady:
          false,

        conversationContextAttachmentError:
          "conversation_operating_state_not_available"
      };
    }

    const turnClassificationPacket =
      this.readObject(
        summary
          .turnClassificationPacket
      ) ||
      this.readObject(
        existing
          .turnClassificationPacket
      );

    const referencePacket =
      this.readObject(
        summary.referencePacket
      ) ||
      this.readObject(
        existing.referencePacket
      );

    const referenceResolution =
      this.readObject(
        summary.referenceResolution
      ) ||
      this.readObject(
        existing.referenceResolution
      );

    const resolvedSemanticStructure =
      this.readObject(
        summary
          .resolvedSemanticStructure
      ) ||
      this.readObject(
        summary
          .currentSemanticStructure
      ) ||
      this.readObject(
        existing
          .resolvedSemanticStructure
      );

    const classificationValidation =
      this.validateAttachedPacket({
        packet:
          turnClassificationPacket,

        validator:
  window
    .AriTurnClassificationPacket
    ?.validate
    ?.bind(
      window
        .AriTurnClassificationPacket
    ),

        packetName:
          "turn_classification_packet",

        required:
          true
      });

    const referenceValidation =
      this.validateAttachedPacket({
        packet:
          referencePacket,

        validator:
  window
    .AriReferencePacket
    ?.validate
    ?.bind(
      window.AriReferencePacket
    ),

        packetName:
          "reference_packet",

        required:
          true
      });

    const attachmentErrors = [
      ...classificationValidation
        .errors,

      ...referenceValidation
        .errors
    ];

    if (
      attachmentErrors.length >
      0
    ) {
      return {
        ...summary,

        conversationOperatingState:
          existing,

        conversationOperatingStateRan:
          true,

        conversationOperatingStateReady:
          false,

        conversationContextAttachmentRan:
          true,

        conversationContextAttachmentReady:
          false,

        conversationContextAttachmentError:
          "canonical_conversation_packets_invalid",

        conversationContextAttachmentErrors:
          attachmentErrors,

        conversationContextAttachmentWarnings: [
          ...classificationValidation
            .warnings,

          ...referenceValidation
            .warnings
        ]
      };
    }

    const attachedReferenceSignal =
      this.buildAttachedReferenceSignal({
        existingSignal:
          existing.referenceSignal,

        referencePacket
      });

    const attachedCurrentTurn =
      this.buildAttachedCurrentTurn({
        currentTurn:
          existing.currentTurn,

        summary,

        turnClassificationPacket,

        referencePacket
      });

    const activeFrame =
      this.buildActiveFrame({
        summary: {
          ...summary,

          currentSemanticStructure:
            resolvedSemanticStructure ||
            summary
              .currentSemanticStructure,

          semanticStructure:
            resolvedSemanticStructure ||
            summary.semanticStructure
        },

        storedState:
          existing.rawStoredState ||
          {},

        immediate:
          existing.immediateHorizon ||
          {}
      });

    const activeHorizon =
      this.buildActiveHorizon({
        summary: {
          ...summary,

          currentSemanticStructure:
            resolvedSemanticStructure ||
            summary
              .currentSemanticStructure,

          semanticStructure:
            resolvedSemanticStructure ||
            summary.semanticStructure,

          semanticUnresolved:
            this.mergeUnique(
              summary
                .semanticUnresolved,

              referencePacket
                ?.unresolvedReferences
            )
        },

        storedState:
          existing.rawStoredState ||
          {},

        activeFrame
      });

    const historicalHorizon =
      this.buildHistoricalHorizon({
        summary: {
          ...summary,

          referencePacket,

          referenceResolution,

          resolvedSemanticStructure
        },

        storedState:
          existing.rawStoredState ||
          {},

        recentTurns:
          existing
            .immediateHorizon
            ?.recentTurns ||
          [],

        activeFrame,

        activeHorizon,

        currentTurn:
          attachedCurrentTurn
      });

    const continuityMode =
      this.resolveAuthoritativeContinuityMode({
        existingMode:
          existing.continuityMode,

        turnClassificationPacket,

        referencePacket,

        immediate:
          existing.immediateHorizon,

        activeFrame,

        currentTurn:
          attachedCurrentTurn,

        historicalHorizon
      });

    const operatingState = {
      ...existing,

      updatedAt:
        new Date()
          .toISOString(),

      currentTurn:
        attachedCurrentTurn,

      activeFrame,

      activeHorizon,

      historicalHorizon,

      continuityMode,

      referenceSignal:
        attachedReferenceSignal,

      turnClassificationPacket,

      referencePacket,

      referenceResolution,

      resolvedSemanticStructure:
        resolvedSemanticStructure ||
        null,

      resolvedReferences:
        this.toArray(
          referencePacket
            ?.references
        ),

      unresolvedReferences:
        this.toArray(
          referencePacket
            ?.unresolvedReferences
        ),

      activeReference:
        referencePacket
          ?.primaryReference ||
        null,

      referenceCandidates:
        historicalHorizon
          .referenceCandidates,

      openLoops:
        activeHorizon.openLoops,

      unresolvedItems:
        this.mergeUnique(
          activeHorizon
            .unresolvedItems,

          referencePacket
            ?.unresolvedReferences
        ).slice(-12),

      conversationContext: {
        schema:
          "ari_conversation_context_attachment",

        schemaVersion:
          this.schemaVersion,

        source:
          this.source,

        version:
          this.version,

        attachedAt:
          new Date()
            .toISOString(),

        classificationAttached:
          Boolean(
            turnClassificationPacket
          ),

        referencePacketAttached:
          Boolean(
            referencePacket
          ),

        referenceResolutionAttached:
          Boolean(
            referenceResolution
          ),

        resolvedSemanticStructureAttached:
          Boolean(
            resolvedSemanticStructure
          ),

        relationship:
          this.readClassificationRelationship(
            turnClassificationPacket
          ),

        resolvedReferenceCount:
          this.toArray(
            referencePacket
              ?.references
          ).length,

        unresolvedReferenceCount:
          this.toArray(
            referencePacket
              ?.unresolvedReferences
          ).length,

        confidence:
          this.calculateAttachedContextConfidence({
            operatingState:
              existing,

            turnClassificationPacket,

            referencePacket
          }),

        authority:
          "authoritative_packet_attachment_only"
      },

                  compactContext:
        this.buildCompactContext({
          currentTurn:
            attachedCurrentTurn,

          immediate:
            existing.immediateHorizon ||
            {},

          activeFrame,

          activeHorizon,

          historicalHorizon,

          continuityMode,

          referenceSignal:
            attachedReferenceSignal,

          turnClassificationPacket,

          referencePacket,

          referenceResolution,

          resolvedSemanticStructure
        })
    };

    return this.attachCompatibilityAliases({
      summary: {
        ...summary,

        turnClassificationPacket,

        referencePacket,

        referenceResolution,

        resolvedSemanticStructure,

        currentSemanticStructure:
          resolvedSemanticStructure ||
          summary
            .currentSemanticStructure
      },

      operatingState,

      storedState:
        existing.rawStoredState ||
        {},

      recentTurns:
        existing
          .immediateHorizon
          ?.recentTurns ||
        [],

      immediate:
        existing.immediateHorizon ||
        {},

      activeFrame,

      activeHorizon
    });
  },

  validateAttachedPacket({
    packet = null,
    validator = null,
    packetName = "packet",
    required = false
  } = {}) {
    const errors = [];
    const warnings = [];

    if (!packet) {
      if (required) {
        errors.push(
          `${packetName}_missing`
        );
      }

      return {
        valid:
          required !== true,

        errors,

        warnings
      };
    }

    if (
      typeof validator !==
      "function"
    ) {
      warnings.push(
        `${packetName}_validator_not_loaded`
      );

      return {
        valid: true,
        errors,
        warnings
      };
    }

    let validation = null;

    try {
      validation =
        validator.call(
          null,
          packet
        );
    } catch (error) {
      errors.push(
        `${packetName}_validation_failed:${
          error?.message ||
          String(error)
        }`
      );

      return {
        valid: false,
        errors,
        warnings
      };
    }

    if (
      validation?.valid !==
      true
    ) {
      errors.push(
        ...this.toArray(
          validation?.errors
        ).map(
          error =>
            `${packetName}:${error}`
        )
      );
    }

    warnings.push(
      ...this.toArray(
        validation?.warnings
      ).map(
        warning =>
          `${packetName}:${warning}`
      )
    );

    return {
      valid:
        errors.length === 0,

      errors,

      warnings
    };
  },

  buildAttachedCurrentTurn({
    currentTurn = {},
    summary = {},
    turnClassificationPacket = null,
    referencePacket = null
  } = {}) {
    const existing =
      this.readObject(
        currentTurn
      ) ||
      {};

    const externallyResolvedText =
      this.cleanText(
        summary
          .resolvedUserMessage ||
        summary
          .resolvedTurn
          ?.resolvedText ||
        summary
          .ellipticalResolution
          ?.resolvedText ||
        summary
          .ellipsisResolution
          ?.resolvedText ||
        ""
      );

    const referenceCount =
      this.toArray(
        referencePacket
          ?.references
      ).length;

    const unresolvedCount =
      this.toArray(
        referencePacket
          ?.unresolvedReferences
      ).length;

    const hasResolvedText =
      Boolean(
        externallyResolvedText
      );

    return {
      ...existing,

      resolvedText:
        hasResolvedText
          ? externallyResolvedText
          : existing.resolvedText ||
            null,

      effectiveText:
        hasResolvedText
          ? externallyResolvedText
          : existing.effectiveText ||
            existing.originalText ||
            "",

            resolutionStatus:
        hasResolvedText
          ? "resolved_text_available"
          : referenceCount > 0 &&
            unresolvedCount === 0
            ? "references_resolved"
            : referenceCount > 0 &&
              unresolvedCount > 0
              ? "references_partially_resolved"
              : unresolvedCount > 0
                ? "references_unresolved"
                : "no_reference_resolution_required",
      textWasRewritten:
        hasResolvedText &&
        this.normalizeForComparison(
          externallyResolvedText
        ) !==
        this.normalizeForComparison(
          existing.originalText ||
          ""
        ),

      relationship:
        this.readClassificationRelationship(
          turnClassificationPacket
        ),

      relationshipConfidence:
        this.readClassificationConfidence(
          turnClassificationPacket
        ),

      referenceResolution: {
        resolvedCount:
          referenceCount,

        unresolvedCount,

        primaryReference:
          referencePacket
            ?.primaryReference ||
          null,

        confidence:
          this.clamp(
            referencePacket
              ?.confidence ??
            0
          )
      },

      originalTextPreserved:
        true
    };
  },

  buildAttachedReferenceSignal({
    existingSignal = null,
    referencePacket = null
  } = {}) {
    const prior =
      this.readObject(
        existingSignal
      ) ||
      {
        present: false,
        surface: null,
        normalizedSurface: null,
        kind: null,
        resolutionRequired: false,
        resolved: false,
        authority:
          "reference_signal_detection_only"
      };

    const resolvedReferences =
      this.toArray(
        referencePacket
          ?.references
      );

    const unresolvedReferences =
      this.toArray(
        referencePacket
          ?.unresolvedReferences
      );

    const referenceWasProcessed =
      resolvedReferences.length >
        0 ||
      unresolvedReferences.length >
        0;

    return {
      ...prior,

      resolutionAttempted:
        referenceWasProcessed,

      resolved:
        referenceWasProcessed &&
        resolvedReferences.length >
          0 &&
        unresolvedReferences.length ===
          0,

      partiallyResolved:
        resolvedReferences.length >
          0 &&
        unresolvedReferences.length >
          0,

      unresolved:
        unresolvedReferences.length >
        0,

      resolvedCount:
        resolvedReferences.length,

      unresolvedCount:
        unresolvedReferences.length,

      primaryReference:
        referencePacket
          ?.primaryReference ||
        null,

      resolutionConfidence:
        this.clamp(
          referencePacket
            ?.confidence ??
          0
        ),

      resolutionAuthority:
        referenceWasProcessed
          ? "ari-reference-packet"
          : null,

      authority:
        "reference_signal_with_authoritative_resolution_status"
    };
  },

  resolveAuthoritativeContinuityMode({
    existingMode =
      "direct_current_turn",

    turnClassificationPacket = null,

    referencePacket = null,

    immediate = {},

    activeFrame = {},

    currentTurn = {},

    historicalHorizon = {}
  } = {}) {
    const relationship =
      this.readClassificationRelationship(
        turnClassificationPacket
      );

    const normalizedRelationship =
      this.normalizeForComparison(
        relationship
      )
        .replace(
          /\s+/g,
          "_"
        )
        .toUpperCase();

    const resolvedCount =
      this.toArray(
        referencePacket
          ?.references
      ).length;

    const unresolvedCount =
      this.toArray(
        referencePacket
          ?.unresolvedReferences
      ).length;

    const followUpRelationships =
      new Set([
        "FOLLOW_UP",
        "ELLIPTICAL_FOLLOW_UP",
        "REFERENCE_FOLLOW_UP",
        "TASK_CONTINUATION",
        "ANSWER_CONTINUATION",
        "CLARIFICATION",
        "CORRECTION",
        "CONFIRMATION",
        "THREAD_RESUME"
      ]);

    if (
      followUpRelationships.has(
        normalizedRelationship
      )
    ) {
      if (
        resolvedCount >
          0 &&
        unresolvedCount ===
          0
      ) {
        return "resolved_follow_up";
      }

      if (
        unresolvedCount >
        0
      ) {
        return "unresolved_follow_up";
      }

      return "classified_follow_up";
    }

    if (
      normalizedRelationship ===
      "TOPIC_SHIFT" ||
      normalizedRelationship ===
      "NEW_TOPIC"
    ) {
      return "topic_shift";
    }

    if (
      normalizedRelationship ===
      "DIRECT" ||
      normalizedRelationship ===
      "INDEPENDENT_TURN"
    ) {
      return "direct_current_turn";
    }

    return (
      existingMode ||
      this.resolveContinuityMode({
        currentTurn,
        immediate,
        activeFrame,
        historicalHorizon
      })
    );
  },

  readClassificationRelationship(
    packet = null
  ) {
    if (
      !packet ||
      typeof packet !==
        "object"
    ) {
      return null;
    }

    return (
      packet.relationship ||
      packet.relationshipType ||
      packet.classification ||
      packet.primaryRelationship ||
      packet.result
        ?.relationship ||
      null
    );
  },

  readClassificationConfidence(
    packet = null
  ) {
    if (
      !packet ||
      typeof packet !==
        "object"
    ) {
      return 0;
    }

    return this.clamp(
      packet.confidence ??
      packet.relationshipConfidence ??
      packet.result
        ?.confidence ??
      0
    );
  },

  calculateAttachedContextConfidence({
    operatingState = {},
    turnClassificationPacket = null,
    referencePacket = null
  } = {}) {
    const operatingConfidence =
      this.clamp(
        operatingState.confidence ??
        0
      );

    const classificationConfidence =
      this.readClassificationConfidence(
        turnClassificationPacket
      );

    const referenceConfidence =
      this.clamp(
        referencePacket
          ?.confidence ??
        (
          this.toArray(
            referencePacket
              ?.references
          ).length ||
          this.toArray(
            referencePacket
              ?.unresolvedReferences
          ).length
            ? 0
            : 1
        )
      );

    return this.roundScore(
      operatingConfidence *
        0.4 +
      classificationConfidence *
        0.3 +
      referenceConfidence *
        0.3
    );
  },

  async completeTurn(summary = {}) {
  let existing =
    summary.conversationOperatingState ||
    null;

  if (!existing) {
    const initialized =
      await this.beginTurn(
        summary
      );

    existing =
      initialized
        .conversationOperatingState ||
      null;

    if (!existing) {
      return {
        ...initialized,

        conversationOperatingStateRan:
          false,

        conversationOperatingStateReady:
          false,

        conversationOperatingStateCompletionRan:
          false,

        conversationOperatingStateCompletionError:
          initialized
            .conversationOperatingStateError ||
          "conversation_operating_state_not_available"
      };
    }
  }

  const finalResponse =
    this.extractFinalResponse(
      summary
    );

    const now =
      new Date()
        .toISOString();

    const completedTurns =
      this.completeRecentTurns({
        existingTurns:
          existing
            .immediateHorizon
            ?.recentTurns ||
          existing
            .rawStoredState
            ?.recentTurns ||
          [],
        currentTurn:
          existing.currentTurn,
        finalResponse,
        summary,
        createdAt:
          now
      });

    const completedFrame =
      this.buildCompletedActiveFrame({
        summary,
        existing,
        finalResponse
      });

    const persistedState =
      this.buildPersistedState({
        summary,
        existing,
        recentTurns:
          completedTurns,
        activeFrame:
          completedFrame,
        finalResponse,
        createdAt:
          now
      });

    const saveResult =
      await this.saveStoredState(
        persistedState
      );

    const immediate =
      this.resolveImmediateHorizon(
        completedTurns
      );

    const operatingState = {
      ...existing,

      completedAt:
        now,

      completed:
        true,

      turnIndex:
        persistedState.turnIndex,

      immediateHorizon:
        immediate,

      activeFrame:
        completedFrame,

      activeHorizon: {
        ...existing.activeHorizon,

        topic:
          completedFrame.topic,

        subject:
          completedFrame.subject,

        issue:
          completedFrame.issue,

        goal:
          completedFrame.goal,

        claims:
          persistedState
            .activeClaims,

        entities:
          persistedState
            .activeEntities,

        events:
          persistedState
            .activeEvents,

        relations:
          persistedState
            .activeRelations,

        constraints:
          persistedState
            .activeConstraints,

        openLoops:
          persistedState
            .openLoops,

        unresolvedItems:
          persistedState
            .unresolvedItems
      },

      finalResponse,

      persistence: {
        attempted:
          true,

        saved:
          saveResult.saved ===
          true,

        source:
          saveResult.source,

        reason:
          saveResult.reason ||
          null,

        error:
          saveResult.error ||
          null
      },

      rawStoredState:
        persistedState,

            compactContext:
        this.buildCompactContext({
          currentTurn:
            existing.currentTurn,

          immediate,

          activeFrame:
            completedFrame,

          activeHorizon: {
            ...existing.activeHorizon,

            topic:
              completedFrame.topic,

            subject:
              completedFrame.subject,

            issue:
              completedFrame.issue,

            goal:
              completedFrame.goal,

            claims:
              persistedState
                .activeClaims,

            entities:
              persistedState
                .activeEntities,

            events:
              persistedState
                .activeEvents,

            relations:
              persistedState
                .activeRelations,

            constraints:
              persistedState
                .activeConstraints,

            openLoops:
              persistedState
                .openLoops,

            unresolvedItems:
              persistedState
                .unresolvedItems
          },

          historicalHorizon:
            existing.historicalHorizon,

          continuityMode:
            existing.continuityMode,

          referenceSignal:
            existing.referenceSignal,

          turnClassificationPacket:
            existing
              .turnClassificationPacket,

          referencePacket:
            existing.referencePacket,

          referenceResolution:
            existing
              .referenceResolution,

          resolvedSemanticStructure:
            existing
              .resolvedSemanticStructure
        })
    };

    return this.attachCompatibilityAliases({
      summary: {
        ...summary,

        threadSaveRan:
          saveResult.saved ===
          true,

        threadSaveSource:
          saveResult.source,

        threadSaveReason:
          saveResult.reason ||
          null,

        threadSaveError:
          saveResult.error ||
          null
      },
      operatingState,
      storedState:
        persistedState,
      recentTurns:
        completedTurns,
      immediate,
      activeFrame:
        completedFrame,
      activeHorizon:
        operatingState.activeHorizon
    });
  },

/* =====================================================
   TURN INTAKE
===================================================== */

async runTurnIntake({
  summary = {},
  storedState = {},
  recentTurns = []
} = {}) {
  const intakeEngine =
    window.AriTurnIntakeEngine ||
    window.Ari?.turnIntakeEngine ||
    null;

  if (
    !intakeEngine ||
    typeof intakeEngine.run !==
      "function"
  ) {
    return {
      ...summary,

      turnPacket:
        null,

      turnIntakeEngineRan:
        false,

      turnIntakeEngineReady:
        false,

      turnIntakeEngineSource:
        "not-loaded",

      turnIntakeEngineError:
        "ari_turn_intake_engine_not_loaded"
    };
  }

  const existingRequest =
    this.readObject(
      summary.request
    ) ||
    {};

  const suppliedTurn =
    this.readObject(
      existingRequest.turn
    ) ||
    this.readObject(
      summary.turn
    ) ||
    {};

  const suppliedConversation =
    this.readObject(
      existingRequest.conversation
    ) ||
    this.readObject(
      summary.conversation
    ) ||
    {};

  const suppliedThread =
    this.readObject(
      existingRequest.thread
    ) ||
    this.readObject(
      summary.thread
    ) ||
    {};

  const originalMessage =
    this.cleanText(
      suppliedTurn.originalMessage ??
      suppliedTurn.originalText ??
      suppliedTurn.message ??
      existingRequest.message ??
      summary.originalUserMessage ??
      summary.userMessage ??
      summary.message ??
      summary.input ??
      ""
    );

  const lastTurn =
    recentTurns.length
      ? recentTurns[
          recentTurns.length -
          1
        ]
      : null;

  const request = {
    ...existingRequest,

    turn: {
      ...suppliedTurn,

      /*
       * Preserve externally supplied identifiers.
       * AriTurnPacket creates a fallback ID only when
       * none was supplied.
       */
      turnId:
        suppliedTurn.turnId ||
        summary.currentTurnId ||
        summary.turnId ||
        null,

      timestamp:
        suppliedTurn.timestamp ||
        suppliedTurn.createdAt ||
        summary.timestamp ||
        summary.createdAt ||
        null,

      source:
  suppliedTurn.source ||
  existingRequest.turnSource ||
  summary.turnSource ||
  "user",

      originalMessage
    },

    conversation: {
      ...suppliedConversation,

      conversationId:
        suppliedConversation
          .conversationId ||
        storedState.conversationId ||
        summary.conversationId ||
        null
    },

    thread: {
      ...suppliedThread,

      threadId:
        suppliedThread.threadId ||
        storedState.threadId ||
        summary.threadId ||
        null,

      previousTurn:
        suppliedThread.previousTurn ||
        lastTurn ||
        null,

      lastTurn:
        suppliedThread.lastTurn ||
        lastTurn ||
        null,

      history:
        Array.isArray(
          suppliedThread.history
        )
          ? suppliedThread.history
          : recentTurns
    },

    metadata: {
      ...(
        this.readObject(
          summary.metadata
        ) ||
        {}
      ),

      ...(
        this.readObject(
          existingRequest.metadata
        ) ||
        {}
      )
    },

    message:
      existingRequest.message ||
      originalMessage
  };

  try {
    const result =
      await intakeEngine.run({
        ...summary,
        request
      });

    if (
      !result ||
      typeof result !==
        "object" ||
      Array.isArray(result)
    ) {
      return {
        ...summary,

        request,

        turnPacket:
          null,

        turnIntakeEngineRan:
          false,

        turnIntakeEngineReady:
          false,

        turnIntakeEngineSource:
          "invalid-result",

        turnIntakeEngineError:
          "ari_turn_intake_engine_invalid_result"
      };
    }

    const validation =
      typeof intakeEngine.validate ===
        "function"
        ? intakeEngine.validate(
            result
          )
        : result.turnPacket
            ?.validation ||
          null;

    const ready =
      Boolean(
        result.turnPacket &&
        validation?.valid === true
      );

    return {
      ...result,

      request,

      turnPacket:
        result.turnPacket ||
        null,

      turnIntakeValidation:
        validation,

      turnIntakeEngineRan:
        true,

      turnIntakeEngineReady:
        ready,

      turnIntakeEngineSource:
        "ari-turn-intake-engine",

      turnIntakeEngineVersion:
        intakeEngine.version ||
        null,

      turnIntakeEngineError:
        ready
          ? null
          : "canonical_turn_packet_invalid"
    };
  } catch (error) {
    console.error(
      "Ari COS turn intake failed:",
      error
    );

    return {
      ...summary,

      request,

      turnPacket:
        null,

      turnIntakeEngineRan:
        false,

      turnIntakeEngineReady:
        false,

      turnIntakeEngineSource:
        "execution-error",

      turnIntakeEngineError:
        error?.message ||
        String(error)
    };
  }
},

  /* =====================================================
     CURRENT TURN
  ===================================================== */

  normalizeCurrentTurnInput(
  summary = {}
) {
  const turnPacket =
    this.readObject(
      summary.turnPacket
    );

  if (!turnPacket) {
    return {
      turnPacket:
        null,

      currentTurn:
        null
    };
  }

  return {
    turnPacket,

    currentTurn: {
      schema:
        "ari_conversation_turn_projection",

      schemaVersion:
        this.schemaVersion,

      /*
       * Identity is inherited from the canonical packet.
       * COS does not generate a separate ID.
       */
      id:
        turnPacket.turnId,

      turnId:
        turnPacket.turnId,

      role:
        "user",

      source:
        turnPacket.source ||
        "user",

      conversationId:
        turnPacket.conversationId ||
        null,

      threadId:
        turnPacket.threadId ||
        null,

      originalText:
        turnPacket.originalMessage ||
        "",

      resolvedText:
        null,

      effectiveText:
        turnPacket.originalMessage ||
        "",

      normalizedText:
        turnPacket.normalizedMessage ||
        this.normalizeForComparison(
          turnPacket.originalMessage ||
          ""
        ),

      createdAt:
        turnPacket.timestamp ||
        null,

      previousTurnAvailable:
        turnPacket
          .previousTurnAvailable ===
        true,

      resolutionStatus:
        "unresolved",

      textWasRewritten:
        false,

      originalTextPreserved:
        true,

      authority: {
        owner:
          "ari-conversation-operating-state",

        sourceAuthority:
          "ari-turn-packet",

        projection:
          true,

        canonical:
          false,

        canPreserveOriginalText:
          true,

        canReceiveResolvedText:
          true,

        canReplaceTurnPacket:
          false,

        role:
          "continuity_facing_projection_of_canonical_turn_packet"
      }
    }
  };
},

  resolveTurnIndex({
    summary = {},
    storedState = {},
    recentTurns = []
  } = {}) {
    const explicit =
      Number(
        summary.turnIndex
      );

    if (
      Number.isFinite(
        explicit
      )
    ) {
      return explicit;
    }

    const stored =
      Number(
        storedState.turnIndex
      );

    if (
      Number.isFinite(
        stored
      )
    ) {
      return stored + 1;
    }

    return recentTurns.filter(
      turn =>
        turn.role ===
          "user"
    ).length + 1;
  },

  /* =====================================================
     THREAD STORE
  ===================================================== */

  async loadStoredState() {
    const store =
      window.AriThreadStore;

    if (!store) {
      return null;
    }

    try {
      if (
        typeof store.load ===
        "function"
      ) {
        return await store.load();
      }

      if (
        typeof store.get ===
        "function"
      ) {
        return await store.get();
      }

      if (
        typeof store.read ===
        "function"
      ) {
        return await store.read();
      }
    } catch (error) {
      console.error(
        "Ari COS thread load failed:",
        error
      );
    }

    return null;
  },

  async saveStoredState(
    state = {}
  ) {
    const store =
      window.AriThreadStore;

    if (
      !store ||
      typeof store.save !==
        "function"
    ) {
      return {
        saved:
          false,

        source:
          "not-loaded",

        reason:
          "thread_store_not_available"
      };
    }

    try {
      await store.save(
        state
      );

      return {
        saved:
          true,

        source:
          "ari-thread-store"
      };
    } catch (error) {
      console.error(
        "Ari COS thread save failed:",
        error
      );

      return {
        saved:
          false,

        source:
          "save-error",

        reason:
          "thread_store_save_failed",

        error:
          error?.message ||
          String(error)
      };
    }
  },

  normalizeStoredState(
    state = null
  ) {
    const raw =
      state &&
      typeof state ===
        "object"
        ? state
        : {};

    return {
      ...raw,

      schema:
        raw.schema ||
        "ari_persisted_conversation_state",

      schemaVersion:
        raw.schemaVersion ||
        this.schemaVersion,

      conversationId:
        raw.conversationId ||
        null,

      turnIndex:
        this.numberOr(
          raw.turnIndex,
          0
        ),

      currentTopic:
        this.normalizeTopic(
          raw.currentTopic ||
          raw.activeTopic
        ),

      activeSubject:
        raw.activeSubject ||
        null,

      activeIssue:
        raw.activeIssue ||
        null,

      activeGoal:
        raw.activeGoal ||
        null,

      recentTurns:
        this.normalizeStoredRecentTurns(
          raw
        ),

      activeClaims:
        this.toArray(
          raw.activeClaims
        ),

      activeEntities:
        this.toArray(
          raw.activeEntities
        ),

      activeEvents:
        this.toArray(
          raw.activeEvents
        ),

      activeRelations:
        this.toArray(
          raw.activeRelations
        ),

      activeConstraints:
        this.toArray(
          raw.activeConstraints
        ),

      unresolvedItems:
        this.toArray(
          raw.unresolvedItems
        ),

      openLoops:
        this.toArray(
          raw.openLoops ||
          raw
            .conversationMeaningOpenLoops
        ),

      topicHistory:
        this.toArray(
          raw.topicHistory
        ),

      previousAnswerSummary:
        this.cleanText(
          raw.previousAnswerSummary ||
          ""
        ) ||
        null,

      lastFinalResponse:
        this.cleanText(
          raw.lastFinalResponse ||
          ""
        ) ||
        null,

      continuitySummary:
        raw.continuitySummary ||
        null,

      latestConversationMeaning:
        raw.latestConversationMeaning ||
        null,

      activeSemanticFrame:
        raw.activeSemanticFrame ||
        null,

      conversationMeaningFocus:
        raw.conversationMeaningFocus ||
        null,

      conversationMeaningHistory:
        this.toArray(
          raw
            .conversationMeaningHistory
        ),

      activeSemanticTimeline:
        this.toArray(
          raw.activeSemanticTimeline
        ),

      lastMealEstimate:
        raw.lastMealEstimate ||
        null,

      lastUpdatedAt:
        raw.lastUpdatedAt ||
        null
    };
  },

  /* =====================================================
     RECENT TURNS
  ===================================================== */

  buildRecentTurns({
    summary = {},
    storedState = {}
  } = {}) {
    const appHistory =
      this.toArray(
        summary.appContext
          ?.history
      )
        .map(
          (
            turn,
            index
          ) =>
            this.normalizeTurnRecord(
              turn,
              index
            )
        )
        .filter(Boolean);

    const stored =
      this.toArray(
        storedState.recentTurns
      );

    return this.dedupeRecentTurns([
      ...stored,
      ...appHistory
    ]).slice(-12);
  },

  normalizeStoredRecentTurns(
    storedState = {}
  ) {
    const direct =
      this.toArray(
        storedState.recentTurns
      )
        .map(
          (
            turn,
            index
          ) =>
            this.normalizeTurnRecord(
              turn,
              index
            )
        )
        .filter(Boolean);

    if (direct.length) {
      return this
        .dedupeRecentTurns(
          direct
        )
        .slice(-12);
    }

    const legacy =
      this.toArray(
        storedState.lastMessages
      )
        .map(
          (
            message,
            index
          ) =>
            this.normalizeTurnRecord(
              typeof message ===
                "string"
                ? {
                    role:
                      "user",

                    text:
                      message
                  }
                : message,
              index
            )
        )
        .filter(Boolean);

    const previousAnswer =
      this.cleanText(
        storedState
          .lastFinalResponse ||
        storedState
          .previousAnswerSummary ||
        ""
      );

    if (previousAnswer) {
      legacy.push({
        id:
          null,

        role:
          "assistant",

        text:
          previousAnswer,

        createdAt:
          storedState
            .lastUpdatedAt ||
          null
      });
    }

    return this
      .dedupeRecentTurns(
        legacy
      )
      .slice(-12);
  },

  normalizeTurnRecord(
    turn = null,
    index = 0
  ) {
    if (
      turn === null ||
      turn === undefined
    ) {
      return null;
    }

    if (
      typeof turn ===
        "string"
    ) {
      const text =
        this.cleanText(
          turn
        );

      return text
        ? {
            id:
              null,

            role:
              "unknown",

            text,

            createdAt:
              null,

            index
          }
        : null;
    }

    const text =
      this.cleanText(
        turn.text ||
        turn.content ||
        turn.message ||
        turn.claim ||
        turn.value ||
        ""
      );

    if (!text) {
      return null;
    }

    return {
      id:
        turn.id ||
        turn.turnId ||
        turn.messageId ||
        null,

      role:
        this.normalizeTurnRole(
          turn.role
        ),

      text,

      createdAt:
        turn.createdAt ||
        turn.created_at ||
        turn.timestamp ||
        turn.updatedAt ||
        null,

      topic:
        this.normalizeTopic(
          turn.topic ||
          turn.activeTopic ||
          turn.situationFrame
        ),

      semanticMeaning:
        turn.semanticMeaning ||
        turn.meaning ||
        null,

      emotionalState:
        turn.emotionalState ||
        turn.emotion ||
        null,

      index
    };
  },

  normalizeTurnRole(
    role = ""
  ) {
    const value =
      String(
        role ||
        ""
      )
        .toLowerCase()
        .trim();

    if (
      [
        "assistant",
        "ari",
        "ai"
      ].includes(
        value
      )
    ) {
      return "assistant";
    }

    if (
      [
        "user",
        "human"
      ].includes(
        value
      )
    ) {
      return "user";
    }

    if (
      value ===
      "system"
    ) {
      return "system";
    }

    return "unknown";
  },

  dedupeRecentTurns(
    turns = []
  ) {
    const seen =
      new Set();

    return this.toArray(
      turns
    ).filter(
      turn => {
        if (
          !turn ||
          !turn.text
        ) {
          return false;
        }

        const key = [
          turn.role ||
          "unknown",

          this
            .normalizeForComparison(
              turn.text
            )
        ].join("|");

        if (
          !key ||
          seen.has(
            key
          )
        ) {
          return false;
        }

        seen.add(
          key
        );

        return true;
      }
    );
  },

  resolveImmediateHorizon(
    recentTurns = []
  ) {
    const turns =
      this.toArray(
        recentTurns
      );

    const previousUserTurn =
      [...turns]
        .reverse()
        .find(
          turn =>
            turn.role ===
            "user"
        ) ||
      null;

    const previousAssistantTurn =
      [...turns]
        .reverse()
        .find(
          turn =>
            turn.role ===
            "assistant"
        ) ||
      null;

    return {
      schema:
        "ari_conversation_immediate_horizon",

      previousUserTurn,

      previousAssistantTurn,

      previousExchange: {
        user:
          previousUserTurn,

        assistant:
          previousAssistantTurn
      },

      recentTurns:
        turns,

      available:
        Boolean(
          previousUserTurn ||
          previousAssistantTurn
        ),

      authority:
        "immediate_prior_turn_context_only"
    };
  },

  /* =====================================================
     ACTIVE FRAME
  ===================================================== */

  buildActiveFrame({
    summary = {},
    storedState = {},
    immediate = {}
  } = {}) {
    const semanticFrame =
      summary
        .activeSemanticFrame ||
      summary
        .currentSemanticStructure ||
      summary.semanticStructure ||
      storedState
        .activeSemanticFrame ||
      {};

    const topic =
      this.normalizeTopic(
        summary
          .resolvedPrimarySubject ||
        summary.activeTopic ||
        summary.activeSubject ||
        summary
          .continuityPacket
          ?.activeThread
          ?.activeTopic ||
        summary
          .situationMap
          ?.situations
          ?.[0] ||
        semanticFrame.topic ||
        storedState.currentTopic ||
        immediate
          .previousUserTurn
          ?.topic ||
        null
      );

    const subject =
      summary
        .resolvedPrimarySubject ||
      summary.activeSubject ||
      semanticFrame.subject ||
      storedState.activeSubject ||
      null;

    const issue =
      summary.activeIssue ||
      summary
        .continuityActiveSituation ||
      semanticFrame.issue ||
      storedState.activeIssue ||
      null;

    const goal =
      summary.activeGoal ||
      semanticFrame.goal ||
      storedState.activeGoal ||
      null;

    return {
      schema:
        "ari_conversation_active_frame",

      topic:
        topic ||
        this.deriveTopicFromText(
          immediate
            .previousUserTurn
            ?.text
        ) ||
        null,

      subject,

      issue,

      goal,

      currentNeed:
        summary.currentNeed ||
        summary
          .responseStrategy
          ?.currentNeed ||
        null,

      primaryLane:
        summary.primaryLane ||
        summary
          .routingContract
          ?.primaryLane ||
        null,

      contextLane:
        summary.contextLane ||
        summary
          .routingContract
          ?.contextLane ||
        null,

      conversationFunction:
        summary
          .conversationFunction ||
        null,

      semanticFrame:
        semanticFrame &&
        Object.keys(
          semanticFrame
        ).length
          ? semanticFrame
          : null,

      confidence:
        this.calculateFrameConfidence({
          topic,
          subject,
          issue,
          goal
        }),

      authority:
        "active_conversation_frame_organization_only"
    };
  },

  buildCompletedActiveFrame({
    summary = {},
    existing = {},
    finalResponse = ""
  } = {}) {
    const current =
      this.buildActiveFrame({
        summary,
        storedState:
          existing.rawStoredState ||
          {},
        immediate:
          existing.immediateHorizon ||
          {}
      });

    return {
      ...existing.activeFrame,
      ...current,

      lastFinalResponse:
        finalResponse ||
        existing.activeFrame
          ?.lastFinalResponse ||
        null,

      updatedAt:
        new Date()
          .toISOString()
    };
  },

  calculateFrameConfidence({
    topic = null,
    subject = null,
    issue = null,
    goal = null
  } = {}) {
    const available = [
      topic,
      subject,
      issue,
      goal
    ].filter(Boolean).length;

    return Math.min(
      0.55 +
      available *
        0.1,
      0.95
    );
  },

  /* =====================================================
     ACTIVE HORIZON
  ===================================================== */

  buildActiveHorizon({
    summary = {},
    storedState = {},
    activeFrame = {}
  } = {}) {
    return {
      schema:
        "ari_conversation_active_horizon",

      topic:
        activeFrame.topic,

      subject:
        activeFrame.subject,

      issue:
        activeFrame.issue,

      goal:
        activeFrame.goal,

      claims:
        this.mergeUnique(
          summary.semanticClaims,
          summary
            .currentSemanticStructure
            ?.claims,
          summary
            .semanticStructure
            ?.claims,
          storedState.activeClaims
        ).slice(-16),

      entities:
        this.mergeUnique(
          summary.semanticEntities,
          summary
            .currentSemanticStructure
            ?.entities,
          summary
            .semanticStructure
            ?.entities,
          storedState.activeEntities
        ).slice(-16),

      events:
        this.mergeUnique(
          summary.semanticEvents,
          summary
            .currentSemanticStructure
            ?.events,
          summary
            .semanticStructure
            ?.events,
          storedState.activeEvents
        ).slice(-12),

      relations:
        this.mergeUnique(
          summary.semanticRelations,
          summary
            .currentSemanticStructure
            ?.relations,
          summary
            .semanticStructure
            ?.relations,
          storedState.activeRelations
        ).slice(-16),

      constraints:
        this.mergeUnique(
          summary.activeConstraints,
          summary.semanticConstraints,
          storedState
            .activeConstraints
        ).slice(-12),

      openLoops:
        this.mergeUnique(
          summary
            .conversationMeaningOpenLoops,
          summary.openLoops,
          storedState.openLoops
        ).slice(-12),

      unresolvedItems:
        this.mergeUnique(
          summary
            .continuityPacket
            ?.unresolvedReferences,
          summary.semanticUnresolved,
          storedState.unresolvedItems
        ).slice(-12),

      latestConversationMeaning:
        summary
          .latestConversationMeaning ||
        storedState
          .latestConversationMeaning ||
        null,

      conversationMeaningFocus:
        summary
          .conversationMeaningFocus ||
        storedState
          .conversationMeaningFocus ||
        null,

      authority:
        "active_conversation_material_only"
    };
  },

  /* =====================================================
     HISTORICAL HORIZON
  ===================================================== */

  buildHistoricalHorizon({
    summary = {},
    storedState = {},
    recentTurns = [],
    activeFrame = {},
    activeHorizon = {},
    currentTurn = {}
  } = {}) {
    const candidates =
      this.buildReferenceCandidates({
        summary,
        storedState,
        recentTurns,
        activeFrame,
        activeHorizon,
        currentTurn
      });

    return {
      schema:
        "ari_conversation_historical_horizon",

      retrievalRequired:
        this.shouldRetrieveHistoricalContext({
          currentTurn,
          activeFrame,
          candidates
        }),

      referenceCandidates:
        candidates,

      topCandidates:
        candidates.slice(
          0,
          8
        ),

      topicHistory:
        this.toArray(
          storedState.topicHistory
        ).slice(-12),

      meaningHistory:
        this.toArray(
          storedState
            .conversationMeaningHistory
        ).slice(-12),

      semanticTimeline:
        this.toArray(
          storedState
            .activeSemanticTimeline
        ).slice(-12),

      authority:
        "ranked_prior_conversation_context_only"
    };
  },

  buildReferenceCandidates({
    summary = {},
    storedState = {},
    recentTurns = [],
    activeFrame = {},
    activeHorizon = {},
    currentTurn = {}
  } = {}) {
    const candidates = [];

    const add = ({
      id = null,
      semanticRef = null,
      semanticType = "claim",
      label = "",
      value = null,
      source = "conversation_state",
      turnDistance = 1,
      role = null,
      status = null,
      baseConfidence = 0.65
    } = {}) => {
      const resolvedLabel =
        this.cleanText(
          label ||
          this.extractLabel(
            value
          )
        );

      if (!resolvedLabel) {
        return;
      }

      const scores =
        this.scoreReferenceCandidate({
          label:
            resolvedLabel,
          value,
          semanticType,
          turnDistance,
          activeFrame,
          currentTurn,
          baseConfidence
        });

      candidates.push({
        id:
          id ||
          semanticRef ||
          null,

        semanticRef:
          semanticRef ||
          id ||
          null,

        semanticType,

        label:
          resolvedLabel,

        value,

        source,

        role,

        status,

        turnDistance,

        scores,

        salience:
          scores.salience,

        confidence:
          scores.confidence
      });
    };

    add({
      semanticRef:
        "active_topic",

      semanticType:
        "topic",

      value:
        activeFrame.topic,

      source:
        "conversation_operating_state.activeFrame.topic",

      baseConfidence:
        0.9
    });

    add({
      semanticRef:
        "active_subject",

      semanticType:
        "entity",

      value:
        activeFrame.subject,

      source:
        "conversation_operating_state.activeFrame.subject",

      baseConfidence:
        0.88
    });

    add({
      semanticRef:
        "active_issue",

      semanticType:
        "claim",

      value:
        activeFrame.issue,

      source:
        "conversation_operating_state.activeFrame.issue",

      baseConfidence:
        0.86
    });

    add({
      semanticRef:
        "active_goal",

      semanticType:
        "goal",

      value:
        activeFrame.goal,

      source:
        "conversation_operating_state.activeFrame.goal",

      baseConfidence:
        0.82
    });

    this.toArray(
      activeHorizon.entities
    ).forEach(
      (
        entity,
        index
      ) => {
        add({
          id:
            entity?.id ||
            `active_entity_${index}`,

          semanticRef:
            entity?.semanticRef ||
            entity?.entityRef ||
            entity?.id ||
            `active_entity_${index}`,

          semanticType:
            entity?.semanticType ||
            entity?.entityType ||
            entity?.type ||
            "entity",

          value:
            entity,

          source:
            "conversation_operating_state.activeHorizon.entities",

          status:
            entity?.status ||
            null,

          baseConfidence:
            entity?.confidence ??
            0.78
        });
      }
    );

    this.toArray(
      activeHorizon.claims
    ).forEach(
      (
        claim,
        index
      ) => {
        add({
          id:
            claim?.id ||
            `active_claim_${index}`,

          semanticRef:
            claim?.semanticRef ||
            claim?.id ||
            `active_claim_${index}`,

          semanticType:
            "claim",

          value:
            claim,

          source:
            "conversation_operating_state.activeHorizon.claims",

          status:
            claim?.status ||
            null,

          baseConfidence:
            claim?.confidence ??
            0.75
        });
      }
    );

    this.toArray(
      activeHorizon.openLoops
    ).forEach(
      (
        loop,
        index
      ) => {
        add({
          id:
            loop?.id ||
            `open_loop_${index}`,

          semanticRef:
            loop?.semanticRef ||
            loop?.id ||
            `open_loop_${index}`,

          semanticType:
            "open_loop",

          value:
            loop,

          source:
            "conversation_operating_state.activeHorizon.openLoops",

          status:
            loop?.status ||
            "active",

          baseConfidence:
            loop?.confidence ??
            0.82
        });
      }
    );

    this.toArray(
      recentTurns
    )
      .slice(-8)
      .forEach(
        (
          turn,
          index,
          collection
        ) => {
          const turnDistance =
            collection.length -
            index;

          add({
            id:
              turn.id ||
              `recent_turn_${index}`,

            semanticRef:
              turn.id ||
              `recent_turn_${index}`,

            semanticType:
              turn.role ===
                "assistant"
                ? "assistant_answer"
                : "user_turn",

            label:
              turn.text,

            value:
              turn,

            source:
              `conversation_operating_state.recentTurns.${turn.role}`,

            role:
              turn.role,

            turnDistance,

            baseConfidence:
              turn.role ===
                "user"
                ? 0.8
                : 0.72
          });
        }
      );

    this.toArray(
      storedState.topicHistory
    )
      .slice(-6)
      .forEach(
        (
          topic,
          index,
          collection
        ) => {
          add({
            id:
              `topic_history_${index}`,

            semanticRef:
              `topic_history_${index}`,

            semanticType:
              "historical_topic",

            value:
              topic,

            source:
              "conversation_operating_state.topicHistory",

            turnDistance:
              collection.length -
              index +
              2,

            baseConfidence:
              0.58
          });
        }
      );

    const seen =
      new Set();

    return candidates
      .filter(
        candidate => {
          const key = [
            candidate.semanticType,
            this
              .normalizeForComparison(
                candidate.label
              )
          ].join("|");

          if (
            !key ||
            seen.has(
              key
            )
          ) {
            return false;
          }

          seen.add(
            key
          );

          return true;
        }
      )
      .sort(
        (
          a,
          b
        ) =>
          b.salience -
          a.salience
      )
      .slice(
        0,
        24
      );
  },

  scoreReferenceCandidate({
    label = "",
    value = null,
    semanticType = "claim",
    turnDistance = 1,
    activeFrame = {},
    currentTurn = {},
    baseConfidence = 0.65
  } = {}) {
    const currentText =
      this
        .normalizeForComparison(
          currentTurn.originalText ||
          currentTurn.effectiveText ||
          ""
        );

    const candidateText =
      this
        .normalizeForComparison(
          label ||
          this.extractLabel(
            value
          )
        );

    const activeText =
      this
        .normalizeForComparison([
          activeFrame.topic,
          activeFrame.subject,
          activeFrame.issue,
          activeFrame.goal
        ]
          .filter(Boolean)
          .join(" ")
        );

    const recency =
      Math.max(
        0.15,
        1 -
        (
          Math.max(
            1,
            turnDistance
          ) -
          1
        ) *
          0.11
      );

    const tokenOverlap =
      this.calculateTokenOverlap(
        currentText,
        candidateText
      );

    const activeFrameMatch =
      this.calculateTokenOverlap(
        activeText,
        candidateText
      );

    const grammaticalCompatibility =
      this.calculateGrammaticalCompatibility({
        currentText,
        semanticType
      });

    const typeWeight = {
      open_loop:
        0.95,

      assistant_answer:
        0.9,

      entity:
        0.88,

      topic:
        0.86,

      goal:
        0.8,

      claim:
        0.78,

      user_turn:
        0.75,

      historical_topic:
        0.55
    }[semanticType] ??
    0.65;

    const salience =
      recency *
        0.25 +
      activeFrameMatch *
        0.22 +
      tokenOverlap *
        0.18 +
      grammaticalCompatibility *
        0.15 +
      typeWeight *
        0.1 +
      this.clamp(
        baseConfidence
      ) *
        0.1;

    return {
      recency:
        this.roundScore(
          recency
        ),

      tokenOverlap:
        this.roundScore(
          tokenOverlap
        ),

      activeFrameMatch:
        this.roundScore(
          activeFrameMatch
        ),

      grammaticalCompatibility:
        this.roundScore(
          grammaticalCompatibility
        ),

      typeWeight:
        this.roundScore(
          typeWeight
        ),

      baseConfidence:
        this.roundScore(
          this.clamp(
            baseConfidence
          )
        ),

      salience:
        this.roundScore(
          this.clamp(
            salience
          )
        ),

      confidence:
        this.roundScore(
          this.clamp(
            baseConfidence *
              0.55 +
            salience *
              0.45
          )
        )
    };
  },

  calculateTokenOverlap(
    a = "",
    b = ""
  ) {
    const left =
      new Set(
        this.tokenize(
          a
        )
      );

    const right =
      new Set(
        this.tokenize(
          b
        )
      );

    if (
      !left.size ||
      !right.size
    ) {
      return 0;
    }

    let overlap = 0;

    left.forEach(
      token => {
        if (
          right.has(
            token
          )
        ) {
          overlap += 1;
        }
      }
    );

    return overlap /
      Math.max(
        left.size,
        right.size
      );
  },

  calculateGrammaticalCompatibility({
    currentText = "",
    semanticType = ""
  } = {}) {
    if (!currentText) {
      return 0.4;
    }

    const elliptical =
      /^(why|how|really|when|where|who|which|what about|and|but|so|then|because|okay|ok|yes|no)\b/i
        .test(
          currentText
        ) ||
      currentText.split(
        /\s+/
      ).length <=
        5;

    const pronounReference =
      /\b(it|that|this|they|them|he|she|him|her|those|these|one|ones|other|another)\b/i
        .test(
          currentText
        );

    if (
      semanticType ===
        "assistant_answer" &&
      elliptical
    ) {
      return 1;
    }

    if (
      semanticType ===
        "entity" &&
      pronounReference
    ) {
      return 1;
    }

    if (
      semanticType ===
        "open_loop" &&
      (
        elliptical ||
        pronounReference
      )
    ) {
      return 0.95;
    }

    if (
      semanticType ===
        "topic" &&
      elliptical
    ) {
      return 0.85;
    }

    return 0.45;
  },

  shouldRetrieveHistoricalContext({
    currentTurn = {},
    activeFrame = {},
    candidates = []
  } = {}) {
    const text =
      this.normalizeForComparison(
        currentTurn.originalText ||
        ""
      );

    const elliptical =
      text.split(
        /\s+/
      ).filter(Boolean).length <=
        5 ||
      /\b(it|that|this|they|them|he|she|him|her|other|another|before|earlier|previous)\b/i
        .test(
          text
        );

    const strongCandidate =
      candidates.some(
        candidate =>
          candidate.salience >=
          0.72
      );

    return Boolean(
      elliptical &&
      (
        strongCandidate ||
        activeFrame.topic
      )
    );
  },

  /* =====================================================
     CONTINUITY MODE
  ===================================================== */

  resolveContinuityMode({
    currentTurn = {},
    immediate = {},
    activeFrame = {},
    historicalHorizon = {}
  } = {}) {
    const text =
      this
        .normalizeForComparison(
          currentTurn.originalText ||
          ""
        );

    const wordCount =
      text
        .split(
          /\s+/
        )
        .filter(Boolean)
        .length;

    const explicitPriorReference =
      /\b(earlier|before|previous|last time|we discussed|you said|you mentioned|that|this|it|they|them|he|she|him|her|the other one|another one)\b/i
        .test(
          text
        );

    const elliptical =
      wordCount <=
        5 ||
      /^(why|how|really|what about|and|but|so|then|okay|ok|yes|no)\b/i
        .test(
          text
        );

    if (
      !immediate.available &&
      !activeFrame.topic
    ) {
      return "direct_current_turn";
    }

    if (
      explicitPriorReference &&
      historicalHorizon
        .topCandidates
        ?.length
    ) {
      return "reference_follow_up";
    }

    if (
      elliptical &&
      immediate.available
    ) {
      return "likely_follow_up";
    }

    if (
      activeFrame.topic
    ) {
      return "active_topic_continuation";
    }

    return "direct_current_turn";
  },

  buildReferenceSignal(
    currentTurn = {}
  ) {
    const text =
      this.cleanText(
        currentTurn.originalText ||
        currentTurn.effectiveText ||
        ""
      );

    const match =
      text.match(
        /\b(it|that|this|they|them|he|she|him|her|those|these|one|ones|another|the other one)\b/i
      );

    if (!match) {
      return {
        present:
          false,

        surface:
          null,

        normalizedSurface:
          null,

        kind:
          null,

        resolutionRequired:
          false,

        resolved:
          false,

        authority:
          "reference_signal_detection_only"
      };
    }

    return {
      present:
        true,

      surface:
        match[0],

      normalizedSurface:
        this.normalizeForComparison(
          match[0]
        ),

      kind:
        "context_dependent_reference",

      resolutionRequired:
        true,

      resolved:
        false,

      authority:
        "reference_signal_detection_only"
    };
  },

  /* =====================================================
     COMPACT CONTEXT
  ===================================================== */

    buildCompactContext({
    currentTurn = {},
    immediate = {},
    activeFrame = {},
    activeHorizon = {},
    historicalHorizon = {},
    continuityMode =
      "direct_current_turn",
    referenceSignal = null,
    turnClassificationPacket = null,
    referencePacket = null,
    referenceResolution = null,
    resolvedSemanticStructure = null
  } = {}) {
    const relationship =
      this.readClassificationRelationship(
        turnClassificationPacket
      );

    const relationshipConfidence =
      this.readClassificationConfidence(
        turnClassificationPacket
      );

    const resolvedReferences =
      this.toArray(
        referencePacket
          ?.references
      );

    const unresolvedReferences =
      this.toArray(
        referencePacket
          ?.unresolvedReferences
      );

    return {
      schema:
        "ari_compact_conversation_context",

      schemaVersion:
        this.schemaVersion,

      source:
        this.source,

      currentTurn: {
        id:
          currentTurn.id ||
          null,

        turnId:
          currentTurn.turnId ||
          currentTurn.id ||
          null,

        originalText:
          currentTurn.originalText ||
          "",

        resolvedText:
          currentTurn.resolvedText ||
          null,

        effectiveText:
          currentTurn.effectiveText ||
          currentTurn.originalText ||
          "",

        role:
          currentTurn.role ||
          "user",

        relationship,

        relationshipConfidence,

        resolutionStatus:
          currentTurn
            .resolutionStatus ||
          null
      },

      continuity: {
        mode:
          continuityMode,

        relationship,

        relationshipConfidence,

        priorContextAvailable:
          immediate.available ===
          true,

        requiresPriorContext: [
          "reference_follow_up",
          "likely_follow_up",
          "classified_follow_up",
          "resolved_follow_up",
          "unresolved_follow_up"
        ].includes(
          continuityMode
        )
      },

      referenceSignal:
        referenceSignal ||
        null,

      referenceResolution: {
        ran:
          Boolean(
            referencePacket ||
            referenceResolution
          ),

        confidence:
          this.clamp(
            referencePacket
              ?.confidence ??
            referenceResolution
              ?.confidence ??
            0
          ),

        primaryReference:
          referencePacket
            ?.primaryReference ||
          null,

        resolvedReferences:
          resolvedReferences
            .slice(0, 8),

        unresolvedReferences:
          unresolvedReferences
            .slice(0, 8),

        resolvedCount:
          resolvedReferences.length,

        unresolvedCount:
          unresolvedReferences.length
      },

      previousTurn: {
        user:
          immediate
            .previousUserTurn
            ? {
                id:
                  immediate
                    .previousUserTurn
                    .id ||
                  null,

                text:
                  immediate
                    .previousUserTurn
                    .text
              }
            : null,

        assistant:
          immediate
            .previousAssistantTurn
            ? {
                id:
                  immediate
                    .previousAssistantTurn
                    .id ||
                  null,

                text:
                  immediate
                    .previousAssistantTurn
                    .text
              }
            : null
      },

      recentTurns:
        this.toArray(
          immediate.recentTurns
        )
          .slice(-6)
          .map(
            turn => ({
              id:
                turn.id ||
                null,

              role:
                turn.role ||
                "unknown",

              text:
                turn.text ||
                "",

              topic:
                turn.topic ||
                null
            })
          ),

      activeFrame: {
        topic:
          activeFrame.topic ||
          null,

        subject:
          activeFrame.subject ||
          null,

        issue:
          activeFrame.issue ||
          null,

        goal:
          activeFrame.goal ||
          null
      },

      openLoops:
        this.toArray(
          activeHorizon.openLoops
        ).slice(0, 5),

      unresolvedItems:
        this.mergeUnique(
          activeHorizon
            .unresolvedItems,

          unresolvedReferences
        ).slice(0, 8),

      activeEntities:
        this.toArray(
          activeHorizon.entities
        ).slice(0, 8),

      activeClaims:
        this.toArray(
          activeHorizon.claims
        ).slice(0, 8),

      referenceCandidates:
        this.toArray(
          historicalHorizon
            .topCandidates
        )
          .slice(0, 8)
          .map(
            candidate => ({
              id:
                candidate.id,

              semanticRef:
                candidate.semanticRef,

              semanticType:
                candidate.semanticType,

              label:
                candidate.label,

              salience:
                candidate.salience,

              confidence:
                candidate.confidence,

              source:
                candidate.source
            })
          ),

      semanticResolution: {
        available:
          Boolean(
            resolvedSemanticStructure
          ),

        schema:
          resolvedSemanticStructure
            ?.schema ||
          null,

        version:
          resolvedSemanticStructure
            ?.version ||
          null,

        inheritedNodes:
          this.toArray(
            resolvedSemanticStructure
              ?.inheritedNodes
          ).slice(0, 8),

        unresolved:
          this.toArray(
            resolvedSemanticStructure
              ?.unresolved
          ).slice(0, 8)
      },

      authority: {
        stateOwner:
          "ari-conversation-operating-state",

        relationshipAuthority:
          turnClassificationPacket
            ? "ari-turn-classification-packet"
            : null,

        referenceAuthority:
          referencePacket
            ? "ari-reference-packet"
            : null,

        canProvideReasoningContext:
          true,

        canReclassifyRelationship:
          false,

        canResolveReferences:
          false,

        canRewriteCurrentTurn:
          false,

        role:
          "bounded_authoritative_context_projection"
      }
    };
  },

  /* =====================================================
     PERSISTENCE
  ===================================================== */

  completeRecentTurns({
    existingTurns = [],
    currentTurn = {},
    finalResponse = "",
    summary = {},
    createdAt = null
  } = {}) {
    const turns =
      this.toArray(
        existingTurns
      );

    const userText =
      this.cleanText(
        currentTurn.originalText ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    const additions = [];

    if (userText) {
      additions.push({
        id:
          currentTurn.id ||
          null,

        role:
          "user",

        text:
          userText,

        createdAt:
          currentTurn.createdAt ||
          createdAt,

        topic:
          this.normalizeTopic(
            summary.activeTopic ||
            summary.activeSubject
          ),

        semanticMeaning:
          summary
            .latestConversationMeaning ||
          summary.semanticSummary ||
          null,

        emotionalState:
          summary.humanState
            ?.primaryState ||
          summary.humanState
            ?.state ||
          summary.emotion ||
          null
      });
    }

    if (finalResponse) {
      additions.push({
        id:
          null,

        role:
          "assistant",

        text:
          finalResponse,

        createdAt,

        topic:
          this.normalizeTopic(
            summary.activeTopic ||
            summary.activeSubject
          ),

        semanticMeaning:
          null,

        emotionalState:
          summary.emotion ||
          null
      });
    }

    return this
      .dedupeRecentTurns([
        ...turns,
        ...additions
      ])
      .slice(-12);
  },

  buildPersistedState({
    summary = {},
    existing = {},
    recentTurns = [],
    activeFrame = {},
    finalResponse = "",
    createdAt = null
  } = {}) {
    const previous =
      existing.rawStoredState ||
      {};

    const userTurns =
      recentTurns.filter(
        turn =>
          turn.role ===
          "user"
      );

    const assistantTurns =
      recentTurns.filter(
        turn =>
          turn.role ===
          "assistant"
      );

    const activeHorizon =
      existing.activeHorizon ||
      {};

    const topic =
      activeFrame.topic ||
      previous.currentTopic ||
      this.deriveTopicFromText(
        existing.currentTurn
          ?.originalText
      ) ||
      "general_thread";

    return {
      ...previous,

      schema:
        "ari_persisted_conversation_state",

      schemaVersion:
        this.schemaVersion,

      source:
        this.source,

      version:
        this.version,

      conversationId:
        existing.conversationId ||
        previous.conversationId ||
        this.createConversationId(),

      turnIndex:
        this.numberOr(
          existing.turnIndex,
          0
        ),

      currentTopic:
        topic,

      activeTopic:
        topic,

      activeSubject:
        activeFrame.subject ||
        previous.activeSubject ||
        null,

      activeIssue:
        activeFrame.issue ||
        previous.activeIssue ||
        null,

      activeGoal:
        activeFrame.goal ||
        previous.activeGoal ||
        null,

      recentTurns,

      lastMessages:
        userTurns
          .map(
            turn =>
              turn.text
          )
          .slice(-8),

      immediatePreviousUserTurn:
        userTurns.length
          ? userTurns[
              userTurns.length -
              1
            ]
          : null,

      immediatePreviousAssistantTurn:
        assistantTurns.length
          ? assistantTurns[
              assistantTurns.length -
              1
            ]
          : null,

      activeClaims:
        this.toArray(
          activeHorizon.claims
        ).slice(-16),

      activeEntities:
        this.toArray(
          activeHorizon.entities
        ).slice(-16),

      activeEvents:
        this.toArray(
          activeHorizon.events
        ).slice(-12),

      activeRelations:
        this.toArray(
          activeHorizon.relations
        ).slice(-16),

      activeConstraints:
        this.toArray(
          activeHorizon.constraints
        ).slice(-12),

      openLoops:
        this.toArray(
          activeHorizon.openLoops
        ).slice(-12),

      unresolvedItems:
        this.toArray(
          activeHorizon
            .unresolvedItems
        ).slice(-12),

      topicHistory:
        this.buildTopicHistory({
          previous:
            previous.topicHistory,
          currentTopic:
            topic,
          createdAt
        }),

      continuitySummary:
        existing.currentTurn
          ?.originalText &&
        finalResponse
          ? `User said: ${existing.currentTurn.originalText}. Ari answered: ${finalResponse.slice(0, 300)}`
          : previous
              .continuitySummary ||
            null,

      previousAnswerSummary:
        finalResponse
          ? finalResponse.slice(
              0,
              500
            )
          : previous
              .previousAnswerSummary ||
            null,

      lastFinalResponse:
        finalResponse ||
        previous.lastFinalResponse ||
        null,

      latestConversationMeaning:
        summary
          .latestConversationMeaning ||
        previous
          .latestConversationMeaning ||
        null,

      activeSemanticFrame:
        summary
          .activeSemanticFrame ||
        previous
          .activeSemanticFrame ||
        null,

      conversationMeaningFocus:
        summary
          .conversationMeaningFocus ||
        previous
          .conversationMeaningFocus ||
        null,

      conversationMeaningHistory:
        summary
          .conversationMeaningHistory ||
        previous
          .conversationMeaningHistory ||
        [],

      activeSemanticTimeline:
        summary
          .activeSemanticTimeline ||
        previous
          .activeSemanticTimeline ||
        [],

      lastMealEstimate:
        summary.mealEstimate ||
        summary.lastMealEstimate ||
        previous.lastMealEstimate ||
        null,

      lastUpdatedAt:
        createdAt ||
        new Date()
          .toISOString()
    };
  },

  buildTopicHistory({
    previous = [],
    currentTopic = null,
    createdAt = null
  } = {}) {
    const history =
      this.toArray(
        previous
      )
        .map(
          item => {
            if (
              typeof item ===
              "string"
            ) {
              return {
                topic:
                  this.normalizeTopic(
                    item
                  ),

                createdAt:
                  null
              };
            }

            return {
              ...item,

              topic:
                this.normalizeTopic(
                  item?.topic ||
                  item?.label ||
                  item?.value ||
                  item
                )
            };
          }
        )
        .filter(
          item =>
            item.topic
        );

    const latest =
      history.length
        ? history[
            history.length -
            1
          ].topic
        : null;

    if (
      currentTopic &&
      this
        .normalizeForComparison(
          latest
        ) !==
      this
        .normalizeForComparison(
          currentTopic
        )
    ) {
      history.push({
        topic:
          currentTopic,

        createdAt:
          createdAt ||
          new Date()
            .toISOString()
      });
    }

    return history.slice(-12);
  },

  /* =====================================================
     COMPATIBILITY
  ===================================================== */

  attachCompatibilityAliases({
    summary = {},
    operatingState = {},
    storedState = {},
    recentTurns = [],
    immediate = {},
    activeFrame = {},
    activeHorizon = {}
  } = {}) {
    const continuityMode =
      operatingState.continuityMode ||
      "direct_current_turn";

     const isFollowUp =
      [
        "reference_follow_up",
        "likely_follow_up",
        "active_topic_continuation",
        "classified_follow_up",
        "resolved_follow_up",
        "unresolved_follow_up"
      ].includes(
        continuityMode
      );

    const requiresPriorContext =
      [
        "reference_follow_up",
        "likely_follow_up",
        "classified_follow_up",
        "resolved_follow_up",
        "unresolved_follow_up"
      ].includes(
        continuityMode
      );

    const priorContextAvailable =
      operatingState
        .priorContextAvailable ===
      true;

    const referenceSignal =
      operatingState.referenceSignal ||
      {
        present:
          false,

        surface:
          null,

        normalizedSurface:
          null,

        kind:
          null,

        resolutionRequired:
          false,

        resolved:
          false,

        authority:
          "reference_signal_detection_only"
      };

    const storedThreadEvidenceAvailable =
      Boolean(
        storedState.conversationId ||
        storedState.lastUpdatedAt ||
        storedState.recentTurns
          ?.length ||
        storedState.lastFinalResponse ||
        storedState.previousAnswerSummary ||
        storedState.currentTopic ||
        storedState.activeSubject
      );

    const threadContext = {
      schema:
        "ari_thread_context",

      schemaVersion:
        this.schemaVersion,

      source:
        this.source,

      version:
        this.version,

      ran:
        true,

      available:
        priorContextAvailable,

      continuityMode,

      isFollowUp,

      requiresPriorContext,

      priorContextAvailable,

      referenceSignal,

      currentTopic:
        activeFrame.topic ||
        null,

      activeTopic:
        activeFrame.topic ||
        null,

      activeSubject:
        activeFrame.subject ||
        null,

      activeIssue:
        activeFrame.issue ||
        null,

      activeGoal:
        activeFrame.goal ||
        null,

      previousAnswer:
        immediate
          .previousAssistantTurn
          ?.text ||
        storedState
          .previousAnswerSummary ||
        storedState
          .lastFinalResponse ||
        null,

      previousAnswerSummary:
        storedState
          .previousAnswerSummary ||
        null,

      lastFinalResponse:
        storedState
          .lastFinalResponse ||
        null,

      immediatePreviousUserTurn:
        immediate
          .previousUserTurn ||
        null,

      immediatePreviousAssistantTurn:
        immediate
          .previousAssistantTurn ||
        null,

      recentTurns,

      recentMessages:
        recentTurns,

      lastMessages:
        recentTurns
          .filter(
            turn =>
              turn.role ===
              "user"
          )
          .map(
            turn =>
              turn.text
          ),

      continuitySummary:
        storedState
          .continuitySummary ||
        null,

      workingContext: {
        summary:
          storedState
            .continuitySummary ||
          null,

        continuityMode,

        isFollowUp,

        requiresPriorContext,

        priorContextAvailable,

        referenceSignal,

        referenceCandidates:
          operatingState
            .referenceCandidates ||
          [],

        activeTopic:
          activeFrame.topic ||
          null,

        activeSubject:
          activeFrame.subject ||
          null,

        activeIssue:
          activeFrame.issue ||
          null,

        activeGoal:
          activeFrame.goal ||
          null,

        immediatePreviousUserTurn:
          immediate
            .previousUserTurn ||
          null,

        immediatePreviousAssistantTurn:
          immediate
            .previousAssistantTurn ||
          null,

        recentTurns,

        keyFacts:
          activeHorizon.claims ||
          [],

        openLoops:
          activeHorizon
            .openLoops ||
          [],

        constraints:
          activeHorizon
            .constraints ||
          [],

        unresolvedItems:
          activeHorizon
            .unresolvedItems ||
          [],

        authority:
          "conversation_operating_state_compatibility_alias"
      },

      activeClaims:
        activeHorizon.claims ||
        [],

      activeEntities:
        activeHorizon.entities ||
        [],

      activeEvents:
        activeHorizon.events ||
        [],

      activeRelations:
        activeHorizon.relations ||
        [],

      activeConstraints:
        activeHorizon
          .constraints ||
        [],

      unresolvedItems:
        activeHorizon
          .unresolvedItems ||
        [],

      openLoops:
        activeHorizon
          .openLoops ||
        [],

      topicHistory:
        storedState
          .topicHistory ||
        [],

      conversationMeaningHistory:
        storedState
          .conversationMeaningHistory ||
        [],

      latestConversationMeaning:
        activeHorizon
          .latestConversationMeaning ||
        null,

      activeSemanticTimeline:
        storedState
          .activeSemanticTimeline ||
        [],

      activeSemanticFrame:
        activeFrame.semanticFrame ||
        storedState
          .activeSemanticFrame ||
        null,

      conversationMeaningFocus:
        activeHorizon
          .conversationMeaningFocus ||
        null,

      conversationMeaningOpenLoops:
        activeHorizon
          .openLoops ||
        [],

      referenceCandidates:
        operatingState
          .referenceCandidates ||
        [],

      confidence:
        operatingState.confidence ||
        0,

      authority: {
        canProvideStoredThreadContext:
          true,

        canPreserveRecentTurns:
          true,

        canExposeContinuityRequirements:
          true,

        canDetectReferenceSignal:
          true,

        canChooseCurrentMeaning:
          false,

        canChooseRequestedOperation:
          false,

        canResolveReferences:
          false,

        canChooseRoute:
          false,

        canAnswerUser:
          false,

        role:
          "conversation_operating_state_compatibility_projection"
      }
    };

    return {
      ...summary,

turnPacket:
  operatingState.turnPacket ||
  summary.turnPacket ||
  null,

currentTurn:
  operatingState.currentTurn ||
  null,

currentTurnId:
  operatingState.currentTurn
    ?.turnId ||
  operatingState.turnPacket
    ?.turnId ||
  null,

originalUserMessage:
  operatingState.turnPacket
    ?.originalMessage ||
  summary.originalUserMessage ||
  summary.userMessage ||
  summary.message ||
  summary.input ||
  "",

userMessage:
  operatingState.currentTurn
    ?.effectiveText ||
  operatingState.turnPacket
    ?.originalMessage ||
  summary.userMessage ||
  summary.message ||
  summary.input ||
  "",

effectiveUserMessage:
  operatingState.currentTurn
    ?.effectiveText ||
  operatingState.turnPacket
    ?.originalMessage ||
  "",

turnIntakeEngineRan:
  summary.turnIntakeEngineRan ===
  true,

turnIntakeEngineReady:
  summary.turnIntakeEngineReady ===
  true,

turnIntakeEngineSource:
  summary.turnIntakeEngineSource ||
  null,

turnIntakeEngineVersion:
  summary.turnIntakeEngineVersion ||
  null,

turnIntakeEngineError:
  summary.turnIntakeEngineError ||
  null,

turnIntakeValidation:
  summary.turnIntakeValidation ||
  operatingState.turnPacket
    ?.validation ||
  null,

      conversationOperatingState:
        operatingState,

      conversationOperatingStateReady:
        true,

      conversationOperatingStateRan:
        true,

      conversationOperatingStateSource:
        this.source,

      conversationOperatingStateVersion:
        this.version,

      continuityMode,

      isFollowUp,

      requiresPriorContext,

      priorContextAvailable,

      referenceSignal,

      threadStateLoaded:
        storedThreadEvidenceAvailable,

      threadState:
        storedState,

      threadContext,

      currentThreadContext:
        threadContext,

      recentTurns,

      recentMessages:
        recentTurns,

      immediatePreviousUserTurn:
        immediate
          .previousUserTurn ||
        null,

      immediatePreviousAssistantTurn:
        immediate
          .previousAssistantTurn ||
        null,

      workingContext:
        threadContext
          .workingContext,

      activeTopic:
        activeFrame.topic ||
        summary.activeTopic ||
        null,

      activeSubject:
        activeFrame.subject ||
        summary.activeSubject ||
        null,

      activeIssue:
        activeFrame.issue ||
        summary.activeIssue ||
        null,

      activeGoal:
        activeFrame.goal ||
        summary.activeGoal ||
        null,

      previousAnswerSummary:
        threadContext
          .previousAnswerSummary ||
        null,

      conversationMeaningHistory:
        threadContext
          .conversationMeaningHistory,

      latestConversationMeaning:
        threadContext
          .latestConversationMeaning,

      activeSemanticTimeline:
        threadContext
          .activeSemanticTimeline,

      activeSemanticFrame:
        threadContext
          .activeSemanticFrame,

      conversationMeaningFocus:
        threadContext
          .conversationMeaningFocus,

      conversationMeaningOpenLoops:
        threadContext
          .conversationMeaningOpenLoops,

      priorMeaningForFollowUp:
        threadContext
          .latestConversationMeaning ||
        null,

      turnClassificationPacket:
        operatingState
          .turnClassificationPacket ||
        summary
          .turnClassificationPacket ||
        null,

      conversationRelationship:
        this.readClassificationRelationship(
          operatingState
            .turnClassificationPacket ||
          summary
            .turnClassificationPacket
        ),

      conversationRelationshipConfidence:
        this.readClassificationConfidence(
          operatingState
            .turnClassificationPacket ||
          summary
            .turnClassificationPacket
        ),

      referencePacket:
        operatingState
          .referencePacket ||
        summary.referencePacket ||
        null,

      referenceResolution:
        operatingState
          .referenceResolution ||
        summary
          .referenceResolution ||
        null,

      resolvedSemanticStructure:
        operatingState
          .resolvedSemanticStructure ||
        summary
          .resolvedSemanticStructure ||
        null,

      currentSemanticStructure:
        operatingState
          .resolvedSemanticStructure ||
        summary
          .currentSemanticStructure ||
        summary.semanticStructure ||
        null,

      resolvedReferences:
        operatingState
          .resolvedReferences ||
        summary
          .resolvedReferences ||
        [],

      unresolvedReferences:
        operatingState
          .unresolvedReferences ||
        summary
          .unresolvedReferences ||
        [],

      activeReference:
        operatingState
          .activeReference ||
        summary.activeReference ||
        null,

      compactConversationContext:
        operatingState
          .compactContext ||
        null,

      referenceCandidates:
        operatingState
          .referenceCandidates ||
        summary.referenceCandidates ||
        []
    };
  },

  /* =====================================================
     FINAL RESPONSE
  ===================================================== */

  extractFinalResponse(
    summary = {}
  ) {
    const candidate =
      summary.finalResponse ||
      summary.selectedDraft
        ?.text ||
      summary.selectedDraft ||
      summary.aiWriterDraft ||
      summary.blueprintWriterDraft ||
      summary.response ||
      "";

    if (
      candidate &&
      typeof candidate ===
        "object"
    ) {
      return this.cleanText(
        candidate.text ||
        candidate.reply ||
        candidate.response ||
        candidate.content ||
        candidate.answer ||
        candidate.draft ||
        ""
      );
    }

    return this.cleanText(
      candidate
    );
  },

  /* =====================================================
     CONFIDENCE
  ===================================================== */

  calculateOperatingStateConfidence({
    currentTurn = {},
    immediate = {},
    activeFrame = {},
    recentTurns = []
  } = {}) {
    let score =
      currentTurn.originalText
        ? 0.5
        : 0.2;

    if (
      immediate.available
    ) {
      score +=
        0.15;
    }

    if (
      activeFrame.topic
    ) {
      score +=
        0.12;
    }

    if (
      activeFrame.subject
    ) {
      score +=
        0.08;
    }

    if (
      recentTurns.length >=
      2
    ) {
      score +=
        0.08;
    }

    return this.roundScore(
      this.clamp(
        score
      )
    );
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

    getAuthorityBoundaries() {
    return {
      canCoordinateTurnIntake:
        true,

      canConsumeCanonicalTurnPacket:
        true,

      canProjectTurnForContinuity:
        true,

      canCreateCanonicalTurnPacket:
        false,

      canGenerateCanonicalTurnId:
        false,

      canLoadThreadState:
        true,

      canNormalizeStoredTurns:
        true,

      canBuildImmediateHorizon:
        true,

      canBuildActiveHorizon:
        true,

      canBuildHistoricalHorizon:
        true,

      canRankReferenceCandidates:
        true,

      canDetectReferenceSignal:
        true,

      canExposeContinuityRequirements:
        true,

      canPreserveCompatibilityAliases:
        true,

      canPersistCompletedTurn:
        true,

      canAttachTurnClassificationPacket:
        true,

      canAttachReferencePacket:
        true,

      canAttachReferenceResolution:
        true,

      canAttachResolvedSemanticStructure:
        true,

      canBuildCompactReasoningContext:
        true,

      canRewriteCurrentTurn:
        false,

      canResolveEllipticalFollowUp:
        false,

      canBindEntityReference:
        false,

      canInterpretSemanticMeaning:
        false,

      canClassifyConversation:
        false,

      canChooseConversationFunction:
        false,

      canChooseSituationContract:
        false,

      canDetermineSafetySeverity:
        false,

      canChooseRoute:
        false,

      canCreateResponsePlan:
        false,

      canRegisterResponseCandidate:
        false,

      canSelectFinalDraft:
        false,

      canWriteFinalResponse:
        false,

      canRetrieveUserMemory:
        false,

      canStoreUserMemory:
        false,

      canAccessSupabase:
        false,

      canExecuteTools:
        false,

      role:
        "conversation_state_organization_packet_attachment_context_projection_and_persistence"
    };
  },

  validate() {
    const authority =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canCreateCanonicalTurnPacket",
"canGenerateCanonicalTurnId",
      "canRewriteCurrentTurn",
      "canResolveEllipticalFollowUp",
      "canBindEntityReference",
      "canInterpretSemanticMeaning",
      "canClassifyConversation",
      "canChooseConversationFunction",
      "canChooseSituationContract",
      "canDetermineSafetySeverity",
      "canChooseRoute",
      "canCreateResponsePlan",
      "canRegisterResponseCandidate",
      "canSelectFinalDraft",
      "canWriteFinalResponse",
      "canRetrieveUserMemory",
      "canStoreUserMemory",
      "canAccessSupabase",
      "canExecuteTools"
    ];

    const errors =
      forbiddenTrue
        .filter(
          key =>
            authority[key] ===
            true
        )
        .map(
          key =>
            `${key}_must_be_false`
        );

    const requiredTrue = [
      "canCoordinateTurnIntake",
      "canConsumeCanonicalTurnPacket",
      "canProjectTurnForContinuity",
      "canLoadThreadState",
      "canNormalizeStoredTurns",
      "canBuildImmediateHorizon",
      "canBuildActiveHorizon",
      "canBuildHistoricalHorizon",
      "canRankReferenceCandidates",
      "canDetectReferenceSignal",
      "canExposeContinuityRequirements",
      "canPreserveCompatibilityAliases",
      "canPersistCompletedTurn",
      "canAttachTurnClassificationPacket",
      "canAttachReferencePacket",
      "canAttachReferenceResolution",
      "canAttachResolvedSemanticStructure",
      "canBuildCompactReasoningContext"
    ];

    requiredTrue
      .filter(
        key =>
          authority[key] !==
          true
      )
      .forEach(
        key => {
          errors.push(
            `${key}_must_be_true`
          );
        }
      );

    const warnings = [];

    if (
      !window.AriThreadStore
    ) {
      warnings.push(
        "AriThreadStore_not_loaded"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      source:
        "ari-conversation-operating-state-validation",

      version:
        this.version,

      errors,

      warnings,

      checks: {
        threeHorizonModel:
          true,

        originalTurnPreserved:
          true,

        turnClassificationPacketAttachmentEnabled:
          authority
            .canAttachTurnClassificationPacket ===
          true,

        referencePacketAttachmentEnabled:
          authority
            .canAttachReferencePacket ===
          true,

        referenceResolutionAttachmentEnabled:
          authority
            .canAttachReferenceResolution ===
          true,

        resolvedSemanticStructureAttachmentEnabled:
          authority
            .canAttachResolvedSemanticStructure ===
          true,

        compactReasoningContextEnabled:
          authority
            .canBuildCompactReasoningContext ===
          true,

 turnIntakeCoordinationEnabled:
  authority
    .canCoordinateTurnIntake ===
  true,

canonicalTurnPacketConsumptionEnabled:
  authority
    .canConsumeCanonicalTurnPacket ===
  true,

continuityTurnProjectionEnabled:
  authority
    .canProjectTurnForContinuity ===
  true,

canonicalTurnCreationSeparated:
  authority
    .canCreateCanonicalTurnPacket ===
  false,

canonicalTurnIdGenerationSeparated:
  authority
    .canGenerateCanonicalTurnId ===
  false,

        referenceSignalDetectionEnabled:
          authority
            .canDetectReferenceSignal ===
          true,

        continuityRequirementProjectionEnabled:
          authority
            .canExposeContinuityRequirements ===
          true,

        referenceResolutionSeparated:
          authority
            .canResolveEllipticalFollowUp ===
          false,

        entityBindingSeparated:
          authority
            .canBindEntityReference ===
          false,

        semanticInterpretationSeparated:
          authority
            .canInterpretSemanticMeaning ===
          false,

        routeAuthorityDisabled:
          authority
            .canChooseRoute ===
          false,

        responsePlanAuthorityDisabled:
          authority
            .canCreateResponsePlan ===
          false,

        finalResponseAuthorityDisabled:
          authority
            .canWriteFinalResponse ===
          false,

        supabaseDisabled:
          authority
            .canAccessSupabase ===
          false
      }
    };
  },

  /* =====================================================
     UTILITIES
  ===================================================== */
  
  createConversationId() {
    return [
      "conversation",
      Date.now()
        .toString(36),
      Math.random()
        .toString(36)
        .slice(2, 8)
    ].join("_");
  },

  deriveTopicFromText(
    text = ""
  ) {
    const clean =
      this.cleanText(
        text
      );

    if (!clean) {
      return null;
    }

    return clean.length >
      140
      ? `${clean.slice(
          0,
          137
        )}...`
      : clean;
  },

  normalizeTopic(
    value = null
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    if (
      typeof value ===
      "string"
    ) {
      return this.cleanText(
        value
      ) || null;
    }

    if (
      typeof value ===
      "number"
    ) {
      return String(
        value
      );
    }

    if (
      typeof value ===
      "object"
    ) {
      return this.normalizeTopic(
        value.topic ||
        value.activeTopic ||
        value.label ||
        value.name ||
        value.title ||
        value.claim ||
        value.proposition ||
        value.summary ||
        value.description ||
        value.value ||
        value.text ||
        value.situation ||
        value.type ||
        null
      );
    }

    return null;
  },

  extractLabel(
    value = null
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value ===
      "string"
    ) {
      return this.cleanText(
        value
      );
    }

    if (
      typeof value ===
      "number"
    ) {
      return String(
        value
      );
    }

    if (
      typeof value ===
      "object"
    ) {
      return this.cleanText(
        value.label ||
        value.name ||
        value.title ||
        value.claim ||
        value.proposition ||
        value.value ||
        value.text ||
        value.surface ||
        value.description ||
        value.topic ||
        value.id ||
        ""
      );
    }

    return this.cleanText(
      String(
        value
      )
    );
  },

  tokenize(
    value = ""
  ) {
    const stopWords =
      new Set([
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "to",
        "of",
        "in",
        "on",
        "for",
        "with",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "i",
        "you",
        "it",
        "that",
        "this"
      ]);

    return this
      .normalizeForComparison(
        value
      )
      .split(
        /\s+/
      )
      .filter(
        token =>
          token.length >=
            3 &&
          !stopWords.has(
            token
          )
      );
  },

  numberOr(
    value,
    fallback = 0
  ) {
    const number =
      Number(
        value
      );

    return Number.isFinite(
      number
    )
      ? number
      : fallback;
  },

  clamp(
    value,
    min = 0,
    max = 1
  ) {
    const number =
      Number(
        value
      );

    if (
      !Number.isFinite(
        number
      )
    ) {
      return min;
    }

    return Math.max(
      min,
      Math.min(
        max,
        number
      )
    );
  },

  roundScore(
    value
  ) {
    return Math.round(
      this.clamp(
        value
      ) *
      1000
    ) /
    1000;
  },

readObject(value) {
  return (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  )
    ? value
    : null;
},

  toArray(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value.filter(
        item =>
          item !==
            undefined &&
          item !==
            null &&
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
              ? this
                  .normalizeForComparison(
                    value
                  )
              : this
                  .normalizeForComparison(
                    value?.id ||
                    value?.semanticRef ||
                    value?.name ||
                    value?.label ||
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
        }
      );
    } catch (error) {
      return "";
    }
  },

  cleanText(
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

  normalizeForComparison(
    value = ""
  ) {
    return this
      .cleanText(
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
  }
};

window.Ari.conversationOperatingState =
  window.AriConversationOperatingState;

console.log(
  "ARI CONVERSATION OPERATING STATE LOADED:",
  window
    .AriConversationOperatingState
    ?.version,
  window
    .AriConversationOperatingState
    ?.validate?.()
    .valid ===
    true
    ? "READY"
    : "INVALID"
);
