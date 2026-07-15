// rebirth/conversation-os/core/cos-contract.js
// ARI Rebirth Conversation Operating System
// COS Runtime Contract
//
// Purpose:
// Define the authoritative boundaries, schemas, placement vocabulary,
// validation rules, and handoff requirements for the Conversation
// Operating System.
//
// V1.0.0 — Conversation Placement Constitution
//
// Architectural flow:
//
// Raw Current Turn
//      +
// Available Conversation Turns
//      ↓
// Conversation Operating System
//      ↓
// Authoritative Conversation Placement Packet
//      ↓
// Perception
//
// Responsibilities:
// - Define valid COS runtime input.
// - Define valid conversation placement categories.
// - Define valid source-turn relationships.
// - Define the authoritative COS output contract.
// - Define COS authority boundaries.
// - Validate COS input structure.
// - Validate COS placement packet structure.
// - Preserve exact current-turn and source-turn text.
// - Prevent semantic interpretation from entering COS.
//
// Non-responsibilities:
// - Does not load conversation history.
// - Does not determine conversation placement.
// - Does not bind references.
// - Does not select source turns.
// - Does not interpret words, grammar, slang, acronyms, typos, or emojis.
// - Does not classify semantic meaning.
// - Does not classify conversational purpose.
// - Does not infer emotion.
// - Does not determine domain.
// - Does not answer the user.
// - Does not call AI.
// - Does not retrieve long-term memory.
// - Does not persist state.
//
// Authority principle:
//
// COS is authoritative about conversation placement.
//
// COS is not authoritative about what the current turn means.
//
// Perception receives COS placement as established conversation structure,
// then independently interprets the supplied text and source turns.

window.Ari = window.Ari || {};

window.AriCOSContract = {
  version: "1.0.0",
  schemaVersion: "1.0.0",
  source: "cos-contract",

  authorityLevel:
    "conversation_placement_contract_authority",

  /* =====================================================
     CONTRACT IDENTITY
  ===================================================== */

  contract: {
    name:
      "ARI Rebirth Conversation Operating System Contract",

    shortName:
      "COS Contract",

    mission:
      "Determine where the current turn belongs in the available conversation and provide the exact source turns required for downstream interpretation.",

    coreQuestion:
      "Where in the conversation does the current turn belong?",

    output:
      "authoritative_conversation_placement_packet"
  },

  /* =====================================================
     PLACEMENT CLASSES
  ===================================================== */

  placementClasses: Object.freeze({
    NEW_TOPIC:
      "new_topic",

    DIRECT_FOLLOW_UP:
      "direct_follow_up",

    EARLIER_TURN_FOLLOW_UP:
      "earlier_turn_follow_up",

    MULTI_TURN_CONTINUATION:
      "multi_turn_continuation",

    CORRECTION:
      "correction",

    REVISION:
      "revision",

    PRIOR_ANSWER_REFERENCE:
      "prior_answer_reference",

    PRIOR_QUESTION_REFERENCE:
      "prior_question_reference",

    PRIOR_EVENT_REFERENCE:
      "prior_event_reference",

    PRIOR_ARTIFACT_REFERENCE:
      "prior_artifact_reference",

    THREAD_MEMORY_REQUEST:
      "thread_memory_request",

    PREVIOUS_CONVERSATION_REFERENCE:
      "previous_conversation_reference",

    CONVERSATION_THEME_CONTINUATION:
      "conversation_theme_continuation",

    UNKNOWN_PLACEMENT:
      "unknown_placement"
  }),

  /* =====================================================
     PLACEMENT FAMILIES
  ===================================================== */

  placementFamilies: Object.freeze({
    NEW:
      "new",

    FOLLOW_UP:
      "follow_up",

    CORRECTION:
      "correction",

    REVISION:
      "revision",

    REFERENCE:
      "reference",

    MEMORY:
      "memory",

    THEME:
      "theme",

    UNKNOWN:
      "unknown"
  }),

  /* =====================================================
     SOURCE TURN RELATIONSHIPS
  ===================================================== */

  sourceTurnRelationships: Object.freeze({
    IMMEDIATE_PREVIOUS_USER_TURN:
      "immediate_previous_user_turn",

    IMMEDIATE_PREVIOUS_ASSISTANT_TURN:
      "immediate_previous_assistant_turn",

    ANSWERS_CURRENT_TURN:
      "answers_current_turn",

    QUESTION_BEING_FOLLOWED_UP:
      "question_being_followed_up",

    ANSWER_BEING_FOLLOWED_UP:
      "answer_being_followed_up",

    REFERENCED_STATEMENT:
      "referenced_statement",

    REFERENCED_EVENT:
      "referenced_event",

    REFERENCED_ARTIFACT:
      "referenced_artifact",

    CORRECTED_TURN:
      "corrected_turn",

    REVISED_TURN:
      "revised_turn",

    THEME_SUPPORT:
      "theme_support",

    CONTEXT_SUPPORT:
      "context_support",

    MEMORY_SOURCE:
      "memory_source",

    CANDIDATE_SOURCE:
      "candidate_source",

    UNKNOWN_RELATIONSHIP:
      "unknown_relationship"
  }),

  /* =====================================================
     SOURCE TURN ROLES
  ===================================================== */

  sourceTurnRoles: Object.freeze({
    PRIMARY:
      "primary",

    SUPPORTING:
      "supporting",

    CANDIDATE:
      "candidate"
  }),

  /* =====================================================
     TURN ROLES
  ===================================================== */

  turnRoles: Object.freeze({
    USER:
      "user",

    ASSISTANT:
      "assistant",

    SYSTEM:
      "system",

    TOOL:
      "tool",

    UNKNOWN:
      "unknown"
  }),

  /* =====================================================
     THREAD SCOPES
  ===================================================== */

  threadScopes: Object.freeze({
    CURRENT_THREAD:
      "current_thread",

    PREVIOUS_THREAD:
      "previous_thread",

    CROSS_THREAD:
      "cross_thread",

    NO_THREAD:
      "no_thread"
  }),

  /* =====================================================
     DECISION STATUS
  ===================================================== */

  decisionStatuses: Object.freeze({
    RESOLVED:
      "resolved",

    PARTIALLY_RESOLVED:
      "partially_resolved",

    UNRESOLVED:
      "unresolved"
  }),

  /* =====================================================
     CONFIDENCE LEVELS
  ===================================================== */

  confidenceLevels: Object.freeze({
    NONE:
      "none",

    LOW:
      "low",

    MEDIUM:
      "medium",

    HIGH:
      "high",

    VERY_HIGH:
      "very_high"
  }),

  /* =====================================================
     REFERENCE SURFACE CLASSES
  ===================================================== */

  referenceSurfaceClasses: Object.freeze({
    EXPLICIT_TURN_REFERENCE:
      "explicit_turn_reference",

    EXPLICIT_PRIOR_STATEMENT_REFERENCE:
      "explicit_prior_statement_reference",

    EXPLICIT_PRIOR_ANSWER_REFERENCE:
      "explicit_prior_answer_reference",

    EXPLICIT_PRIOR_QUESTION_REFERENCE:
      "explicit_prior_question_reference",

    EXPLICIT_MEMORY_REFERENCE:
      "explicit_memory_reference",

    STRUCTURAL_FOLLOW_UP_SURFACE:
      "structural_follow_up_surface",

    CORRECTION_SURFACE:
      "correction_surface",

    REVISION_SURFACE:
      "revision_surface",

    DEICTIC_REFERENCE_SURFACE:
      "deictic_reference_surface",

    QUOTED_SURFACE_MATCH:
      "quoted_surface_match",

    NO_REFERENCE_SURFACE:
      "no_reference_surface",

    UNKNOWN_REFERENCE_SURFACE:
      "unknown_reference_surface"
  }),

  /* =====================================================
     ALLOWED INTERNAL SIGNAL CLASSES
  ===================================================== */

  /*
   * These are structural signals only.
   *
   * They may help COS locate a turn, but they may not be converted into
   * semantic claims about what the user means.
   */
  allowedStructuralSignals: Object.freeze([
    "turn_order",
    "turn_distance",
    "speaker_role",
    "exact_quote_match",
    "normalized_surface_match",
    "explicit_turn_number",
    "explicit_time_reference",
    "explicit_previous_conversation_reference",
    "reply_parent_id",
    "thread_id_match",
    "conversation_id_match",
    "message_id_match",
    "artifact_id_match",
    "surface_reference_marker",
    "correction_marker",
    "revision_marker",
    "question_answer_adjacency",
    "candidate_source_turn_count",
    "available_thread_boundary"
  ]),

  /* =====================================================
     FORBIDDEN SIGNAL CLASSES
  ===================================================== */

  forbiddenInterpretiveSignals: Object.freeze([
    "semantic_intent",
    "semantic_domain",
    "semantic_frame",
    "conversation_function",
    "emotion",
    "sentiment",
    "medical_meaning",
    "legal_meaning",
    "developer_meaning",
    "relationship_meaning",
    "identity_meaning",
    "worldview_meaning",
    "preference_meaning",
    "advice_need",
    "safety_severity",
    "response_goal",
    "response_shape",
    "response_move",
    "answer_content",
    "factual_truth",
    "topic_interpretation",
    "keyword_topic_classification"
  ]),

  /* =====================================================
     INPUT SCHEMA
  ===================================================== */

  inputSchema: Object.freeze({
    schema:
      "ari_cos_runtime_input",

    schemaVersion:
      "1.0.0",

    requiredFields: Object.freeze([
      "currentTurn",
      "availableTurns"
    ]),

    currentTurnRequiredFields: Object.freeze([
      "turnId",
      "role",
      "text"
    ]),

    availableTurnRequiredFields: Object.freeze([
      "turnId",
      "role",
      "text"
    ])
  }),

  /* =====================================================
     OUTPUT SCHEMA
  ===================================================== */

  outputSchema: Object.freeze({
    schema:
      "ari_conversation_placement_packet",

    schemaVersion:
      "1.0.0",

    requiredFields: Object.freeze([
      "schema",
      "schemaVersion",
      "ready",
      "currentTurn",
      "placement",
      "sourceTurns",
      "decision",
      "authority"
    ]),

    placementRequiredFields: Object.freeze([
      "class",
      "family",
      "isNewTopic",
      "isFollowUp",
      "requiresPriorTurns"
    ]),

    decisionRequiredFields: Object.freeze([
      "status",
      "confidence",
      "confidenceScore"
    ])
  }),

  /* =====================================================
     INPUT RECORD FACTORIES
  ===================================================== */

  createRuntimeInput({
    currentTurn = null,
    availableTurns = [],
    currentThread = null,
    previousThreads = [],
    runtime = {}
  } = {}) {
    return {
      schema:
        this.inputSchema.schema,

      schemaVersion:
        this.inputSchema.schemaVersion,

      currentTurn:
        this.normalizeTurnRecord(
          currentTurn
        ),

      availableTurns:
        this.toArray(
          availableTurns
        )
          .map(turn =>
            this.normalizeTurnRecord(
              turn
            )
          )
          .filter(Boolean),

      currentThread:
        this.normalizeThreadRecord(
          currentThread
        ),

      previousThreads:
        this.toArray(
          previousThreads
        )
          .map(thread =>
            this.normalizeThreadRecord(
              thread
            )
          )
          .filter(Boolean),

      runtime:
        this.normalizeRuntimeMetadata(
          runtime
        ),

      authority:
        "raw_conversation_structure_input_only"
    };
  },

  normalizeTurnRecord(
    turn = null
  ) {
    if (
      !turn ||
      typeof turn !==
        "object" ||
      Array.isArray(turn)
    ) {
      return null;
    }

    const text =
      this.preserveText(
        turn.text ??
        turn.content ??
        turn.message ??
        ""
      );

    return {
      schema:
        "ari_cos_turn_record",

      schemaVersion:
        this.schemaVersion,

      turnId:
        turn.turnId ??
        turn.id ??
        turn.messageId ??
        null,

      threadId:
        turn.threadId ??
        turn.conversationId ??
        null,

      conversationId:
        turn.conversationId ??
        turn.threadId ??
        null,

      parentTurnId:
        turn.parentTurnId ??
        turn.replyToTurnId ??
        turn.replyToMessageId ??
        null,

      role:
        this.normalizeTurnRole(
          turn.role
        ),

      text,

      exactText:
        text,

      createdAt:
        turn.createdAt ??
        turn.created_at ??
        turn.timestamp ??
        null,

      sequence:
        this.toFiniteNumber(
          turn.sequence ??
          turn.index ??
          turn.position
        ),

      artifactIds:
        this.toArray(
          turn.artifactIds ??
          turn.attachments
        )
          .map(value =>
            this.extractStableIdentifier(
              value
            )
          )
          .filter(Boolean),

      metadata:
        this.normalizeMetadata(
          turn.metadata
        ),

      textPreserved:
        true,

      semanticInterpretation:
        null,

      authority:
        "conversation_turn_structure_only"
    };
  },

  normalizeThreadRecord(
    thread = null
  ) {
    if (
      !thread ||
      typeof thread !==
        "object" ||
      Array.isArray(thread)
    ) {
      return null;
    }

    return {
      schema:
        "ari_cos_thread_record",

      schemaVersion:
        this.schemaVersion,

      threadId:
        thread.threadId ??
        thread.id ??
        thread.conversationId ??
        null,

      conversationId:
        thread.conversationId ??
        thread.threadId ??
        thread.id ??
        null,

      createdAt:
        thread.createdAt ??
        thread.created_at ??
        null,

      updatedAt:
        thread.updatedAt ??
        thread.updated_at ??
        null,

      turnCount:
        this.toFiniteNumber(
          thread.turnCount
        ),

      metadata:
        this.normalizeMetadata(
          thread.metadata
        ),

      authority:
        "conversation_thread_structure_only"
    };
  },

  normalizeRuntimeMetadata(
    runtime = {}
  ) {
    const source =
      runtime &&
      typeof runtime ===
        "object" &&
      !Array.isArray(runtime)
        ? runtime
        : {};

    return {
      requestId:
        source.requestId ??
        null,

      sessionId:
        source.sessionId ??
        null,

      startedAt:
        source.startedAt ??
        null,

      currentTime:
        source.currentTime ??
        null,

      maximumSourceTurns:
        this.toFiniteNumber(
          source.maximumSourceTurns
        ),

      previousConversationSearchAllowed:
        source
          .previousConversationSearchAllowed ===
        true,

      diagnosticsEnabled:
        source.diagnosticsEnabled ===
        true
    };
  },

  /* =====================================================
     OUTPUT RECORD FACTORIES
  ===================================================== */

  createEmptyPlacementPacket({
    currentTurn = null
  } = {}) {
    return {
      schema:
        this.outputSchema.schema,

      schemaVersion:
        this.outputSchema.schemaVersion,

      ready:
        false,

      usable:
        false,

      source:
        "ari-conversation-os",

      version:
        null,

      createdAt:
        new Date()
          .toISOString(),

      currentTurn:
        this.normalizeTurnRecord(
          currentTurn
        ),

      placement:
        this.createUnknownPlacement(),

      sourceTurns:
        [],

      candidateSourceTurns:
        [],

      decision:
        this.createUnresolvedDecision(),

      referenceBinding:
        this.createEmptyReferenceBinding(),

      threadScope:
        this.threadScopes
          .NO_THREAD,

      diagnostics:
        {
          errors: [],
          warnings: []
        },

      authority:
        this.getPacketAuthority()
    };
  },

  createUnknownPlacement() {
    return {
      class:
        this.placementClasses
          .UNKNOWN_PLACEMENT,

      family:
        this.placementFamilies
          .UNKNOWN,

      isNewTopic:
        false,

      isFollowUp:
        false,

      isCorrection:
        false,

      isRevision:
        false,

      isMemoryRequest:
        false,

      isPreviousConversationReference:
        false,

      isThemeContinuation:
        false,

      requiresPriorTurns:
        false,

      requiresPreviousConversation:
        false,

      primarySourceTurnId:
        null,

      sourceTurnIds:
        [],

      authority:
        "conversation_placement_only"
    };
  },

  createUnresolvedDecision() {
    return {
      status:
        this.decisionStatuses
          .UNRESOLVED,

      confidence:
        this.confidenceLevels
          .NONE,

      confidenceScore:
        0,

      basis:
        [],

      alternatives:
        [],

      authoritative:
        false,

      reason:
        "placement_not_resolved"
    };
  },

  createEmptyReferenceBinding() {
    return {
      required:
        false,

      resolved:
        false,

      surfaceClass:
        this.referenceSurfaceClasses
          .NO_REFERENCE_SURFACE,

      surfaceText:
        null,

      boundTurnIds:
        [],

      unresolvedReference:
        null,

      authority:
        "structural_reference_binding_only"
    };
  },

  createSourceTurnRecord({
    turn = null,
    relationship = null,
    role = null,
    confidence = 0,
    evidence = []
  } = {}) {
    const normalizedTurn =
      this.normalizeTurnRecord(
        turn
      );

    if (!normalizedTurn) {
      return null;
    }

    return {
      schema:
        "ari_cos_source_turn_record",

      schemaVersion:
        this.schemaVersion,

      turnId:
        normalizedTurn.turnId,

      threadId:
        normalizedTurn.threadId,

      conversationId:
        normalizedTurn
          .conversationId,

      role:
        normalizedTurn.role,

      text:
        normalizedTurn.text,

      exactText:
        normalizedTurn.exactText,

      createdAt:
        normalizedTurn.createdAt,

      sequence:
        normalizedTurn.sequence,

      sourceRole:
        this.isValidSourceTurnRole(
          role
        )
          ? role
          : this.sourceTurnRoles
              .SUPPORTING,

      relationship:
        this.isValidSourceTurnRelationship(
          relationship
        )
          ? relationship
          : this
              .sourceTurnRelationships
              .UNKNOWN_RELATIONSHIP,

      confidence:
        this.normalizeConfidenceScore(
          confidence
        ),

      evidence:
        this.toArray(
          evidence
        ),

      textPreserved:
        true,

      semanticInterpretation:
        null,

      authority:
        "selected_conversation_source_turn_only"
    };
  },

  /* =====================================================
     INPUT VALIDATION
  ===================================================== */

  validateRuntimeInput(
    input = {}
  ) {
    const errors = [];
    const warnings = [];

    if (
      !input ||
      typeof input !==
        "object" ||
      Array.isArray(input)
    ) {
      errors.push({
        type:
          "cos_input_invalid",

        message:
          "COS runtime input must be an object."
      });

      return this.buildValidationResult({
        valid:
          false,

        errors,
        warnings,

        target:
          "runtime_input"
      });
    }

    if (
      input.schema &&
      input.schema !==
        this.inputSchema.schema
    ) {
      errors.push({
        type:
          "cos_input_schema_mismatch",

        expected:
          this.inputSchema.schema,

        received:
          input.schema
      });
    }

    const currentTurn =
      input.currentTurn;

    if (
      !currentTurn ||
      typeof currentTurn !==
        "object"
    ) {
      errors.push({
        type:
          "current_turn_missing",

        message:
          "COS requires one current turn."
      });
    } else {
      this.validateTurnRecord(
        currentTurn,
        {
          target:
            "current_turn",

          errors,
          warnings
        }
      );
    }

    if (
      !Array.isArray(
        input.availableTurns
      )
    ) {
      errors.push({
        type:
          "available_turns_invalid",

        message:
          "COS availableTurns must be an array."
      });
    } else {
      input.availableTurns
        .forEach(
          (
            turn,
            index
          ) => {
            this.validateTurnRecord(
              turn,
              {
                target:
                  `available_turns[${index}]`,

                errors,
                warnings
              }
            );
          }
        );
    }

    const duplicateIds =
      this.findDuplicateTurnIds(
        input.availableTurns
      );

    if (
      duplicateIds.length
    ) {
      warnings.push({
        type:
          "duplicate_available_turn_ids",

        turnIds:
          duplicateIds
      });
    }

    if (
      currentTurn?.turnId &&
      this.toArray(
        input.availableTurns
      ).some(
        turn =>
          turn?.turnId ===
          currentTurn.turnId
      )
    ) {
      warnings.push({
        type:
          "current_turn_present_in_available_turns",

        turnId:
          currentTurn.turnId
      });
    }

    return this.buildValidationResult({
      valid:
        errors.length ===
        0,

      errors,
      warnings,

      target:
        "runtime_input"
    });
  },

  validateTurnRecord(
    turn = {},
    {
      target = "turn",
      errors = [],
      warnings = []
    } = {}
  ) {
    if (
      !turn ||
      typeof turn !==
        "object" ||
      Array.isArray(turn)
    ) {
      errors.push({
        type:
          "turn_record_invalid",

        target
      });

      return;
    }

    if (
      turn.turnId ===
        null ||
      turn.turnId ===
        undefined ||
      turn.turnId ===
        ""
    ) {
      errors.push({
        type:
          "turn_id_missing",

        target
      });
    }

    if (
      !this.isValidTurnRole(
        turn.role
      )
    ) {
      errors.push({
        type:
          "turn_role_invalid",

        target,

        role:
          turn.role ??
          null
      });
    }

    if (
      typeof turn.text !==
        "string"
    ) {
      errors.push({
        type:
          "turn_text_invalid",

        target
      });
    }

    if (
      typeof turn.text ===
        "string" &&
      !turn.text.trim()
    ) {
      warnings.push({
        type:
          "turn_text_empty",

        target,

        turnId:
          turn.turnId ??
          null
      });
    }

    if (
      turn.semanticInterpretation !==
        undefined &&
      turn.semanticInterpretation !==
        null
    ) {
      warnings.push({
        type:
          "semantic_interpretation_present_in_cos_turn",

        target,

        message:
          "COS turn records must not depend on semantic interpretation."
      });
    }
  },

  /* =====================================================
     PACKET VALIDATION
  ===================================================== */

  validatePlacementPacket(
    packet = {}
  ) {
    const errors = [];
    const warnings = [];

    if (
      !packet ||
      typeof packet !==
        "object" ||
      Array.isArray(packet)
    ) {
      errors.push({
        type:
          "placement_packet_invalid"
      });

      return this.buildValidationResult({
        valid:
          false,

        errors,
        warnings,

        target:
          "placement_packet"
      });
    }

    if (
      packet.schema !==
      this.outputSchema.schema
    ) {
      errors.push({
        type:
          "placement_packet_schema_mismatch",

        expected:
          this.outputSchema.schema,

        received:
          packet.schema ??
          null
      });
    }

    if (
      !packet.currentTurn
    ) {
      errors.push({
        type:
          "placement_packet_current_turn_missing"
      });
    } else {
      this.validateTurnRecord(
        packet.currentTurn,
        {
          target:
            "placement_packet.currentTurn",

          errors,
          warnings
        }
      );
    }

    this.validatePlacementRecord(
      packet.placement,
      {
        errors,
        warnings
      }
    );

    this.validateDecisionRecord(
      packet.decision,
      {
        errors,
        warnings
      }
    );

    if (
      !Array.isArray(
        packet.sourceTurns
      )
    ) {
      errors.push({
        type:
          "source_turns_invalid"
      });
    } else {
      packet.sourceTurns
        .forEach(
          (
            sourceTurn,
            index
          ) => {
            this.validateSourceTurnRecord(
              sourceTurn,
              {
                target:
                  `sourceTurns[${index}]`,

                errors,
                warnings
              }
            );
          }
        );
    }

    if (
      packet.placement
        ?.requiresPriorTurns ===
        true &&
      !packet.sourceTurns
        ?.length
    ) {
      errors.push({
        type:
          "required_source_turns_missing"
      });
    }

    if (
      packet.placement
        ?.isNewTopic ===
        true &&
      packet.placement
        ?.isFollowUp ===
        true
    ) {
      errors.push({
        type:
          "placement_state_conflict",

        conflict: [
          "isNewTopic",
          "isFollowUp"
        ]
      });
    }

    if (
      packet.placement
        ?.class ===
        this.placementClasses
          .NEW_TOPIC &&
      packet.sourceTurns
        ?.some(
          sourceTurn =>
            sourceTurn.sourceRole ===
            this.sourceTurnRoles
              .PRIMARY
        )
    ) {
      warnings.push({
        type:
          "new_topic_has_primary_source_turn"
      });
    }

    if (
      packet.ready ===
        true &&
      packet.decision
        ?.status !==
        this.decisionStatuses
          .RESOLVED
    ) {
      errors.push({
        type:
          "ready_packet_has_unresolved_decision"
      });
    }

    const forbiddenFields =
      this.findForbiddenInterpretiveFields(
        packet
      );

    if (
      forbiddenFields.length
    ) {
      errors.push({
        type:
          "forbidden_interpretive_fields_detected",

        fields:
          forbiddenFields
      });
    }

    return this.buildValidationResult({
      valid:
        errors.length ===
        0,

      errors,
      warnings,

      target:
        "placement_packet"
    });
  },

  validatePlacementRecord(
    placement = null,
    {
      errors = [],
      warnings = []
    } = {}
  ) {
    if (
      !placement ||
      typeof placement !==
        "object" ||
      Array.isArray(placement)
    ) {
      errors.push({
        type:
          "placement_record_missing"
      });

      return;
    }

    if (
      !this.isValidPlacementClass(
        placement.class
      )
    ) {
      errors.push({
        type:
          "placement_class_invalid",

        value:
          placement.class ??
          null
      });
    }

    if (
      !this.isValidPlacementFamily(
        placement.family
      )
    ) {
      errors.push({
        type:
          "placement_family_invalid",

        value:
          placement.family ??
          null
      });
    }

    [
      "isNewTopic",
      "isFollowUp",
      "requiresPriorTurns"
    ].forEach(field => {
      if (
        typeof placement[field] !==
        "boolean"
      ) {
        errors.push({
          type:
            "placement_boolean_invalid",

          field
        });
      }
    });

    if (
      placement
        .primarySourceTurnId &&
      !this.toArray(
        placement.sourceTurnIds
      ).includes(
        placement
          .primarySourceTurnId
      )
    ) {
      warnings.push({
        type:
          "primary_source_turn_not_in_source_turn_ids",

        turnId:
          placement
            .primarySourceTurnId
      });
    }
  },

  validateDecisionRecord(
    decision = null,
    {
      errors = []
    } = {}
  ) {
    if (
      !decision ||
      typeof decision !==
        "object" ||
      Array.isArray(decision)
    ) {
      errors.push({
        type:
          "decision_record_missing"
      });

      return;
    }

    if (
      !Object.values(
        this.decisionStatuses
      ).includes(
        decision.status
      )
    ) {
      errors.push({
        type:
          "decision_status_invalid",

        value:
          decision.status ??
          null
      });
    }

    const score =
      Number(
        decision.confidenceScore
      );

    if (
      !Number.isFinite(score) ||
      score < 0 ||
      score > 1
    ) {
      errors.push({
        type:
          "decision_confidence_score_invalid",

        value:
          decision.confidenceScore ??
          null
      });
    }
  },

  validateSourceTurnRecord(
    sourceTurn = null,
    {
      target = "sourceTurn",
      errors = [],
      warnings = []
    } = {}
  ) {
    if (
      !sourceTurn ||
      typeof sourceTurn !==
        "object" ||
      Array.isArray(sourceTurn)
    ) {
      errors.push({
        type:
          "source_turn_record_invalid",

        target
      });

      return;
    }

    this.validateTurnRecord(
      sourceTurn,
      {
        target,
        errors,
        warnings
      }
    );

    if (
      !this.isValidSourceTurnRole(
        sourceTurn.sourceRole
      )
    ) {
      errors.push({
        type:
          "source_turn_role_invalid",

        target,

        value:
          sourceTurn.sourceRole ??
          null
      });
    }

    if (
      !this.isValidSourceTurnRelationship(
        sourceTurn.relationship
      )
    ) {
      errors.push({
        type:
          "source_turn_relationship_invalid",

        target,

        value:
          sourceTurn.relationship ??
          null
      });
    }
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canDefineCOSContract:
        true,

      canDefinePlacementVocabulary:
        true,

      canDefinePacketSchema:
        true,

      canValidateRuntimeInput:
        true,

      canValidatePlacementPacket:
        true,

      canRequireExactTurnText:
        true,

      canRequireSourceTurnIds:
        true,

      canRequirePlacementDecision:
        true,

      canDeterminePlacement:
        false,

      canLoadThread:
        false,

      canBindReference:
        false,

      canSelectSourceTurns:
        false,

      canInterpretLanguage:
        false,

      canInterpretTypos:
        false,

      canInterpretSlang:
        false,

      canInterpretAcronyms:
        false,

      canInterpretEmojis:
        false,

      canDetermineSemanticMeaning:
        false,

      canDetermineConversationFunction:
        false,

      canDetermineEmotion:
        false,

      canDetermineDomain:
        false,

      canDetermineSafetySeverity:
        false,

      canDetermineResponseGoal:
        false,

      canDetermineResponseShape:
        false,

      canCreateResponseMoves:
        false,

      canCallAI:
        false,

      canAnswerUser:
        false,

      canRetrieveLongTermMemory:
        false,

      canPersistState:
        false,

      role:
        "conversation_operating_system_constitution"
    };
  },

  getPacketAuthority() {
    return {
      authoritativeFor:
        [
          "conversation_placement",
          "source_turn_selection",
          "source_turn_relationship",
          "thread_scope",
          "reference_binding_status"
        ],

      notAuthoritativeFor:
        [
          "semantic_meaning",
          "conversation_function",
          "intent",
          "domain",
          "emotion",
          "safety_severity",
          "factual_truth",
          "response_planning",
          "response_language"
        ],

      downstreamRule:
        "Perception must accept placement and source-turn identity as authoritative conversation structure while independently interpreting all supplied text.",

      role:
        "authoritative_conversation_placement_handoff"
    };
  },

  /* =====================================================
     CONTRACT VALIDATION
  ===================================================== */

  validateContract() {
    const errors = [];
    const warnings = [];

    const authority =
      this.getAuthorityBoundaries();

    const forbiddenEnabledAuthorities = [
      "canDeterminePlacement",
      "canLoadThread",
      "canBindReference",
      "canSelectSourceTurns",
      "canInterpretLanguage",
      "canInterpretTypos",
      "canInterpretSlang",
      "canInterpretAcronyms",
      "canInterpretEmojis",
      "canDetermineSemanticMeaning",
      "canDetermineConversationFunction",
      "canDetermineEmotion",
      "canDetermineDomain",
      "canDetermineSafetySeverity",
      "canDetermineResponseGoal",
      "canDetermineResponseShape",
      "canCreateResponseMoves",
      "canCallAI",
      "canAnswerUser",
      "canRetrieveLongTermMemory",
      "canPersistState"
    ];

    forbiddenEnabledAuthorities
      .forEach(field => {
        if (
          authority[field] ===
          true
        ) {
          errors.push({
            type:
              "forbidden_contract_authority_enabled",

            field
          });
        }
      });

    const placementValues =
      Object.values(
        this.placementClasses
      );

    if (
      new Set(
        placementValues
      ).size !==
      placementValues.length
    ) {
      errors.push({
        type:
          "duplicate_placement_class"
      });
    }

    const relationshipValues =
      Object.values(
        this
          .sourceTurnRelationships
      );

    if (
      new Set(
        relationshipValues
      ).size !==
      relationshipValues.length
    ) {
      errors.push({
        type:
          "duplicate_source_turn_relationship"
      });
    }

    if (
      !this.placementClasses
        .NEW_TOPIC
    ) {
      errors.push({
        type:
          "new_topic_placement_missing"
      });
    }

    if (
      !this.placementClasses
        .DIRECT_FOLLOW_UP
    ) {
      errors.push({
        type:
          "direct_follow_up_placement_missing"
      });
    }

    if (
      !this.placementClasses
        .EARLIER_TURN_FOLLOW_UP
    ) {
      errors.push({
        type:
          "earlier_turn_follow_up_placement_missing"
      });
    }

    return {
      valid:
        errors.length ===
        0,

      source:
        "cos-contract-validation",

      version:
        this.version,

      schemaVersion:
        this.schemaVersion,

      errors,
      warnings,

      checks: {
        contractOnly:
          authority
            .canDefineCOSContract ===
          true,

        placementLogicSeparated:
          authority
            .canDeterminePlacement ===
          false,

        threadLoadingSeparated:
          authority
            .canLoadThread ===
          false,

        referenceBindingSeparated:
          authority
            .canBindReference ===
          false,

        sourceSelectionSeparated:
          authority
            .canSelectSourceTurns ===
          false,

        semanticInterpretationForbidden:
          authority
            .canDetermineSemanticMeaning ===
          false,

        conversationFunctionForbidden:
          authority
            .canDetermineConversationFunction ===
          false,

        languageInterpretationForbidden:
          authority
            .canInterpretLanguage ===
          false,

        aiDisabled:
          authority
            .canCallAI ===
          false,

        finalResponseDisabled:
          authority
            .canAnswerUser ===
          false
      }
    };
  },

  /* =====================================================
     ENUM VALIDATION
  ===================================================== */

  isValidPlacementClass(
    value = null
  ) {
    return Object.values(
      this.placementClasses
    ).includes(value);
  },

  isValidPlacementFamily(
    value = null
  ) {
    return Object.values(
      this.placementFamilies
    ).includes(value);
  },

  isValidSourceTurnRelationship(
    value = null
  ) {
    return Object.values(
      this.sourceTurnRelationships
    ).includes(value);
  },

  isValidSourceTurnRole(
    value = null
  ) {
    return Object.values(
      this.sourceTurnRoles
    ).includes(value);
  },

  isValidTurnRole(
    value = null
  ) {
    return Object.values(
      this.turnRoles
    ).includes(value);
  },

  normalizeTurnRole(
    value = null
  ) {
    const role =
      String(
        value ??
        ""
      )
        .toLowerCase()
        .trim();

    if (
      this.isValidTurnRole(role)
    ) {
      return role;
    }

    return this.turnRoles.UNKNOWN;
  },

  /* =====================================================
     STRUCTURAL SAFETY CHECKS
  ===================================================== */

  findForbiddenInterpretiveFields(
    packet = {}
  ) {
    const forbiddenFieldNames =
      new Set([
        "semanticMeaning",
        "semanticFrame",
        "semanticIntent",
        "conversationFunction",
        "emotion",
        "sentiment",
        "domain",
        "medicalMeaning",
        "developerMeaning",
        "relationshipMeaning",
        "safetySeverity",
        "responseGoal",
        "responseShape",
        "responseMoves",
        "answer",
        "finalResponse"
      ]);

    const found = [];

    const visit = (
      value,
      path = "",
      seen = new WeakSet()
    ) => {
      if (
        !value ||
        typeof value !==
          "object"
      ) {
        return;
      }

      if (
        seen.has(value)
      ) {
        return;
      }

      seen.add(value);

      Object.entries(value)
        .forEach(
          ([
            key,
            nestedValue
          ]) => {
            const currentPath =
              path
                ? `${path}.${key}`
                : key;

            if (
              forbiddenFieldNames
                .has(key) &&
              nestedValue !==
                null &&
              nestedValue !==
                undefined
            ) {
              found.push(
                currentPath
              );
            }

            if (
              nestedValue &&
              typeof nestedValue ===
                "object"
            ) {
              visit(
                nestedValue,
                currentPath,
                seen
              );
            }
          }
        );
    };

    visit(packet);

    return [
      ...new Set(found)
    ];
  },

  findDuplicateTurnIds(
    turns = []
  ) {
    const seen =
      new Set();

    const duplicates =
      new Set();

    this.toArray(turns)
      .forEach(turn => {
        const turnId =
          turn?.turnId ??
          turn?.id ??
          null;

        if (
          turnId === null ||
          turnId === undefined ||
          turnId === ""
        ) {
          return;
        }

        const key =
          String(turnId);

        if (
          seen.has(key)
        ) {
          duplicates.add(
            turnId
          );

          return;
        }

        seen.add(key);
      });

    return [
      ...duplicates
    ];
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  buildValidationResult({
    valid = false,
    errors = [],
    warnings = [],
    target = null
  } = {}) {
    return {
      valid:
        valid === true,

      source:
        "cos-contract",

      version:
        this.version,

      schemaVersion:
        this.schemaVersion,

      target,

      errors:
        this.toArray(errors),

      warnings:
        this.toArray(warnings)
    };
  },

  preserveText(
    value = ""
  ) {
    return String(
      value ??
      ""
    );
  },

  normalizeConfidenceScore(
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
      number > 1
    ) {
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

  confidenceLabelFromScore(
    value = 0
  ) {
    const score =
      this.normalizeConfidenceScore(
        value
      );

    if (
      score >= 0.9
    ) {
      return this
        .confidenceLevels
        .VERY_HIGH;
    }

    if (
      score >= 0.75
    ) {
      return this
        .confidenceLevels
        .HIGH;
    }

    if (
      score >= 0.5
    ) {
      return this
        .confidenceLevels
        .MEDIUM;
    }

    if (
      score > 0
    ) {
      return this
        .confidenceLevels
        .LOW;
    }

    return this
      .confidenceLevels
      .NONE;
  },

  toFiniteNumber(
    value = null
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  },

  extractStableIdentifier(
    value = null
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    if (
      typeof value ===
        "string" ||
      typeof value ===
        "number"
    ) {
      return String(value);
    }

    if (
      typeof value ===
        "object"
    ) {
      const identifier =
        value.artifactId ??
        value.attachmentId ??
        value.fileId ??
        value.id ??
        null;

      return identifier ===
        null
        ? null
        : String(identifier);
    }

    return null;
  },

  normalizeMetadata(
    value = null
  ) {
    if (
      !value ||
      typeof value !==
        "object" ||
      Array.isArray(value)
    ) {
      return {};
    }

    return {
      ...value
    };
  },

  toArray(
    value
  ) {
    if (
      Array.isArray(value)
    ) {
      return value.filter(
        item =>
          item !==
            null &&
          item !==
            undefined
      );
    }

    if (
      value ===
        undefined ||
      value ===
        null
    ) {
      return [];
    }

    return [value];
  }
};

window.Ari.cosContract =
  window.AriCOSContract;

console.log(
  "ARI COS CONTRACT LOADED:",
  window.AriCOSContract
    ?.version,
  window.AriCOSContract
    ?.validateContract?.()
    .valid ===
    true
    ? "READY"
    : "INVALID"
);