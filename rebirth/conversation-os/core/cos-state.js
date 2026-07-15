// rebirth/conversation-os/core/cos-state.js
// ARI Rebirth Conversation Operating System
// COS Runtime State
//
// Purpose:
// Hold the temporary runtime state used while COS determines authoritative
// conversation placement.
//
// V1.0.0 — Isolated Conversation Placement Runtime State
//
// Architectural flow:
//
// COS Runtime Input
//      ↓
// COS Runtime State
//      ↓
// Turn / Thread Intake
//      ↓
// Placement / Binding / Source Selection
//      ↓
// COS Packet Builder
//
// Responsibilities:
// - Create one isolated COS state for the current runtime turn.
// - Preserve the exact current-turn text.
// - Preserve available conversation turns.
// - Hold structural evidence produced by COS components.
// - Hold placement candidates without choosing among them.
// - Hold reference-binding candidates.
// - Hold source-turn candidates.
// - Hold the final authoritative placement decision once supplied.
// - Track runtime stage completion.
// - Track warnings, errors, and diagnostics.
// - Prevent accidental semantic interpretation from entering COS state.
// - Produce safe snapshots for downstream COS components.
//
// Non-responsibilities:
// - Does not load conversation history.
// - Does not determine conversation placement.
// - Does not classify a turn as new topic or follow-up.
// - Does not bind references.
// - Does not select source turns.
// - Does not interpret language.
// - Does not interpret slang, acronyms, typos, emojis, or grammar.
// - Does not determine semantic meaning.
// - Does not classify conversation function.
// - Does not determine domain or emotion.
// - Does not call AI.
// - Does not create the final placement packet.
// - Does not answer the user.
// - Does not persist state.
//
// Authority principle:
//
// COS State stores decisions.
//
// COS State does not make decisions.

window.Ari = window.Ari || {};

window.AriCOSState = {
  version: "1.0.0",
  schemaVersion: "1.0.0",
  source: "cos-state",

  authorityLevel:
    "conversation_placement_runtime_state_authority",

  /* =====================================================
     STATE CREATION
  ===================================================== */

  create({
    input = {},
    runtime = {}
  } = {}) {
    const contract =
      this.getContract();

    const normalizedInput =
      contract.createRuntimeInput({
        currentTurn:
          input.currentTurn ||
          null,

        availableTurns:
          input.availableTurns ||
          [],

        currentThread:
          input.currentThread ||
          null,

        previousThreads:
          input.previousThreads ||
          [],

        runtime: {
          ...(
            input.runtime &&
            typeof input.runtime ===
              "object"
              ? input.runtime
              : {}
          ),

          ...(
            runtime &&
            typeof runtime ===
              "object"
              ? runtime
              : {}
          )
        }
      });

    const inputValidation =
      contract.validateRuntimeInput(
        normalizedInput
      );

    const now =
      new Date()
        .toISOString();

    const state = {
      schema:
        "ari_cos_runtime_state",

      schemaVersion:
        this.schemaVersion,

      ready:
        inputValidation.valid ===
        true,

      usable:
        inputValidation.valid ===
        true,

      complete:
        false,

      failed:
        false,

      source:
        this.source,

      version:
        this.version,

      authorityLevel:
        this.authorityLevel,

      createdAt:
        now,

      updatedAt:
        now,

      runtimeId:
        this.createRuntimeId(),

      requestId:
        normalizedInput
          .runtime
          ?.requestId ||
        null,

      sessionId:
        normalizedInput
          .runtime
          ?.sessionId ||
        null,

      input:
        normalizedInput,

      currentTurn:
        normalizedInput
          .currentTurn,

      availableTurns:
        normalizedInput
          .availableTurns,

      currentThread:
        normalizedInput
          .currentThread,

      previousThreads:
        normalizedInput
          .previousThreads,

      configuration:
        this.buildConfiguration(
          normalizedInput.runtime
        ),

      stage:
        this.createStageState(),

      structuralEvidence:
        this.createStructuralEvidenceState(),

      placementCandidates:
        [],

      referenceBindingCandidates:
        [],

      sourceTurnCandidates:
        [],

      selectedPlacement:
        null,

      selectedReferenceBinding:
        null,

      selectedSourceTurns:
        [],

      decision:
        contract
          .createUnresolvedDecision(),

      packet:
        null,

      validation: {
        input:
          inputValidation,

        state:
          null,

        packet:
          null
      },

      diagnostics:
        {
          marks: [],

          errors:
            this.toArray(
              inputValidation.errors
            ),

          warnings:
            this.toArray(
              inputValidation.warnings
            ),

          counters:
            this.createCounters(),

          timing:
            this.createTimingState()
        },

      authority:
        this.getAuthorityBoundaries()
    };

    this.mark(
      state,
      "state_created",
      {
        ready:
          state.ready,

        availableTurnCount:
          state.availableTurns
            .length
      }
    );

    state.validation.state =
      this.validate(state);

    if (
      state.validation.state.valid !==
      true
    ) {
      state.ready =
        false;

      state.usable =
        false;

      state.failed =
        true;
    }

    window.Ari.cosRuntimeState =
      state;

    return state;
  },

  /* =====================================================
     CONFIGURATION
  ===================================================== */

  buildConfiguration(
    runtime = {}
  ) {
    const source =
      runtime &&
      typeof runtime ===
        "object" &&
      !Array.isArray(runtime)
        ? runtime
        : {};

    const maximumSourceTurns =
      this.toPositiveInteger(
        source.maximumSourceTurns,
        8
      );

    const maximumPlacementCandidates =
      this.toPositiveInteger(
        source.maximumPlacementCandidates,
        12
      );

    const maximumBindingCandidates =
      this.toPositiveInteger(
        source.maximumBindingCandidates,
        12
      );

    return {
      maximumSourceTurns,

      maximumPlacementCandidates,

      maximumBindingCandidates,

      previousConversationSearchAllowed:
        source
          .previousConversationSearchAllowed ===
        true,

      diagnosticsEnabled:
        source.diagnosticsEnabled ===
        true,

      preserveExactText:
        true,

      allowSemanticInterpretation:
        false,

      allowConversationFunctionClassification:
        false,

      allowDomainClassification:
        false,

      allowEmotionClassification:
        false,

      allowAI:
        false,

      authority:
        "cos_runtime_configuration_only"
    };
  },

  /* =====================================================
     STAGE STATE
  ===================================================== */

  createStageState() {
    return {
      current:
        "created",

      previous:
        null,

      completed:
        [],

      failed:
        [],

      skipped:
        [],

      statuses: {
        created:
          "complete",

        turnIntake:
          "pending",

        threadIntake:
          "pending",

        structuralMatching:
          "pending",

        placement:
          "pending",

        referenceBinding:
          "pending",

        sourceSelection:
          "pending",

        decision:
          "pending",

        packetBuild:
          "pending",

        validation:
          "pending",

        complete:
          "pending"
      },

      authority:
        "cos_runtime_progress_only"
    };
  },

  setStage(
    state = {},
    stageName = "",
    status = "running"
  ) {
    if (
      !state ||
      typeof state !==
        "object"
    ) {
      return false;
    }

    const normalizedStage =
      this.normalizeIdentifier(
        stageName
      );

    if (
      !normalizedStage
    ) {
      return false;
    }

    const allowedStatuses =
      new Set([
        "pending",
        "running",
        "complete",
        "failed",
        "skipped"
      ]);

    const normalizedStatus =
      allowedStatuses.has(status)
        ? status
        : "running";

    const previous =
      state.stage?.current ||
      null;

    state.stage =
      state.stage ||
      this.createStageState();

    state.stage.previous =
      previous;

    state.stage.current =
      normalizedStage;

    state.stage.statuses[
      normalizedStage
    ] =
      normalizedStatus;

    this.removeValue(
      state.stage.completed,
      normalizedStage
    );

    this.removeValue(
      state.stage.failed,
      normalizedStage
    );

    this.removeValue(
      state.stage.skipped,
      normalizedStage
    );

    if (
      normalizedStatus ===
      "complete"
    ) {
      this.pushUnique(
        state.stage.completed,
        normalizedStage
      );
    }

    if (
      normalizedStatus ===
      "failed"
    ) {
      this.pushUnique(
        state.stage.failed,
        normalizedStage
      );

      state.failed =
        true;
    }

    if (
      normalizedStatus ===
      "skipped"
    ) {
      this.pushUnique(
        state.stage.skipped,
        normalizedStage
      );
    }

    this.touch(state);

    this.mark(
      state,
      "stage_changed",
      {
        stage:
          normalizedStage,

        status:
          normalizedStatus,

        previous
      }
    );

    return true;
  },

  completeStage(
    state = {},
    stageName = ""
  ) {
    return this.setStage(
      state,
      stageName,
      "complete"
    );
  },

  failStage(
    state = {},
    stageName = "",
    error = null
  ) {
    const changed =
      this.setStage(
        state,
        stageName,
        "failed"
      );

    if (
      error
    ) {
      this.addError(
        state,
        {
          type:
            "cos_stage_failed",

          stage:
            this.normalizeIdentifier(
              stageName
            ),

          message:
            error?.message ||
            String(error)
        }
      );
    }

    return changed;
  },

  skipStage(
    state = {},
    stageName = "",
    reason = null
  ) {
    const changed =
      this.setStage(
        state,
        stageName,
        "skipped"
      );

    if (
      changed &&
      reason
    ) {
      this.addWarning(
        state,
        {
          type:
            "cos_stage_skipped",

          stage:
            this.normalizeIdentifier(
              stageName
            ),

          reason:
            String(reason)
        }
      );
    }

    return changed;
  },

  /* =====================================================
     STRUCTURAL EVIDENCE
  ===================================================== */

  createStructuralEvidenceState() {
    return {
      exactMatches:
        [],

      normalizedSurfaceMatches:
        [],

      quotedMatches:
        [],

      replyParentMatches:
        [],

      artifactMatches:
        [],

      threadMatches:
        [],

      explicitTurnReferences:
        [],

      explicitTimeReferences:
        [],

      structuralReferenceSurfaces:
        [],

      correctionSurfaces:
        [],

      revisionSurfaces:
        [],

      adjacencySignals:
        [],

      boundarySignals:
        [],

      customSignals:
        [],

      authority:
        "structural_conversation_evidence_only"
    };
  },

  addStructuralEvidence(
    state = {},
    evidence = {}
  ) {
    if (
      !state ||
      typeof state !==
        "object"
    ) {
      return false;
    }

    const normalized =
      this.normalizeStructuralEvidence(
        evidence
      );

    if (
      !normalized
    ) {
      this.addWarning(
        state,
        {
          type:
            "invalid_structural_evidence_rejected"
        }
      );

      return false;
    }

    const targetCollection =
      this.resolveEvidenceCollection(
        state,
        normalized.type
      );

    if (
      !targetCollection
    ) {
      this.addWarning(
        state,
        {
          type:
            "unsupported_structural_evidence_type",

          evidenceType:
            normalized.type
        }
      );

      return false;
    }

    const duplicate =
      targetCollection.some(
        item =>
          item.evidenceId ===
          normalized.evidenceId
      );

    if (
      duplicate
    ) {
      return false;
    }

    targetCollection.push(
      normalized
    );

    state.diagnostics
      .counters
      .structuralEvidenceCount +=
      1;

    this.touch(state);

    return true;
  },

  normalizeStructuralEvidence(
    evidence = {}
  ) {
    if (
      !evidence ||
      typeof evidence !==
        "object" ||
      Array.isArray(evidence)
    ) {
      return null;
    }

    const contract =
      this.getContract();

    const type =
      this.normalizeIdentifier(
        evidence.type ||
        evidence.signal ||
        evidence.kind ||
        ""
      );

    if (
      !type ||
      !contract
        .allowedStructuralSignals
        .includes(type)
    ) {
      return null;
    }

    const sourceTurnIds =
      this.toArray(
        evidence.sourceTurnIds ||
        evidence.turnIds ||
        evidence.turnId
      )
        .map(value =>
          this.toStableId(value)
        )
        .filter(Boolean);

    return {
      schema:
        "ari_cos_structural_evidence",

      schemaVersion:
        this.schemaVersion,

      evidenceId:
        evidence.evidenceId ||
        this.createEvidenceId(),

      type,

      currentTurnId:
        this.toStableId(
          evidence.currentTurnId
        ),

      sourceTurnIds,

      surfaceText:
        evidence.surfaceText ===
          undefined
          ? null
          : this.preserveText(
              evidence.surfaceText
            ),

      exactSurface:
        evidence.exactSurface ===
          true,

      score:
        this.normalizeScore(
          evidence.score ??
          evidence.confidence ??
          0
        ),

      distance:
        this.toFiniteNumber(
          evidence.distance
        ),

      metadata:
        this.normalizeMetadata(
          evidence.metadata
        ),

      semanticMeaning:
        null,

      conversationFunction:
        null,

      authority:
        "structural_conversation_evidence_only"
    };
  },

  resolveEvidenceCollection(
    state = {},
    evidenceType = ""
  ) {
    const evidence =
      state.structuralEvidence ||
      null;

    if (!evidence) {
      return null;
    }

    const collectionMap = {
      exact_quote_match:
        "exactMatches",

      normalized_surface_match:
        "normalizedSurfaceMatches",

      quoted_surface_match:
        "quotedMatches",

      reply_parent_id:
        "replyParentMatches",

      artifact_id_match:
        "artifactMatches",

      thread_id_match:
        "threadMatches",

      conversation_id_match:
        "threadMatches",

      message_id_match:
        "explicitTurnReferences",

      explicit_turn_number:
        "explicitTurnReferences",

      explicit_time_reference:
        "explicitTimeReferences",

      explicit_previous_conversation_reference:
        "explicitTimeReferences",

      surface_reference_marker:
        "structuralReferenceSurfaces",

      correction_marker:
        "correctionSurfaces",

      revision_marker:
        "revisionSurfaces",

      question_answer_adjacency:
        "adjacencySignals",

      turn_order:
        "adjacencySignals",

      turn_distance:
        "adjacencySignals",

      speaker_role:
        "adjacencySignals",

      candidate_source_turn_count:
        "customSignals",

      available_thread_boundary:
        "boundarySignals"
    };

    const key =
      collectionMap[
        evidenceType
      ] ||
      "customSignals";

    return Array.isArray(
      evidence[key]
    )
      ? evidence[key]
      : null;
  },

  /* =====================================================
     PLACEMENT CANDIDATES
  ===================================================== */

  addPlacementCandidate(
    state = {},
    candidate = {}
  ) {
    if (
      !state ||
      typeof state !==
        "object"
    ) {
      return false;
    }

    const normalized =
      this.normalizePlacementCandidate(
        candidate
      );

    if (!normalized) {
      this.addWarning(
        state,
        {
          type:
            "invalid_placement_candidate_rejected"
        }
      );

      return false;
    }

    const maximum =
      state.configuration
        ?.maximumPlacementCandidates ||
      12;

    const existingIndex =
      state
        .placementCandidates
        .findIndex(
          item =>
            item.candidateId ===
              normalized.candidateId ||
            (
              item.class ===
                normalized.class &&
              this.sameIdSet(
                item.sourceTurnIds,
                normalized
                  .sourceTurnIds
              )
            )
        );

    if (
      existingIndex >= 0
    ) {
      const existing =
        state
          .placementCandidates[
          existingIndex
        ];

      if (
        normalized.score >
        existing.score
      ) {
        state
          .placementCandidates[
          existingIndex
        ] =
          normalized;
      }

      this.sortPlacementCandidates(
        state
      );

      return true;
    }

    state
      .placementCandidates
      .push(normalized);

    this.sortPlacementCandidates(
      state
    );

    if (
      state
        .placementCandidates
        .length >
      maximum
    ) {
      state
        .placementCandidates =
        state
          .placementCandidates
          .slice(
            0,
            maximum
          );
    }

    state.diagnostics
      .counters
      .placementCandidateCount =
      state
        .placementCandidates
        .length;

    this.touch(state);

    return true;
  },

  normalizePlacementCandidate(
    candidate = {}
  ) {
    if (
      !candidate ||
      typeof candidate !==
        "object" ||
      Array.isArray(candidate)
    ) {
      return null;
    }

    const contract =
      this.getContract();

    const placementClass =
      candidate.class ||
      candidate.placementClass ||
      null;

    const family =
      candidate.family ||
      candidate.placementFamily ||
      this.familyForPlacementClass(
        placementClass
      );

    if (
      !contract
        .isValidPlacementClass(
          placementClass
        ) ||
      !contract
        .isValidPlacementFamily(
          family
        )
    ) {
      return null;
    }

    const sourceTurnIds =
      this.toArray(
        candidate.sourceTurnIds ||
        candidate.turnIds
      )
        .map(value =>
          this.toStableId(value)
        )
        .filter(Boolean);

    const score =
      this.normalizeScore(
        candidate.score ??
        candidate.confidence ??
        0
      );

    return {
      schema:
        "ari_cos_placement_candidate",

      schemaVersion:
        this.schemaVersion,

      candidateId:
        candidate.candidateId ||
        this.createCandidateId(
          "placement"
        ),

      class:
        placementClass,

      family,

      sourceTurnIds,

      primarySourceTurnId:
        this.toStableId(
          candidate
            .primarySourceTurnId
        ) ||
        sourceTurnIds[0] ||
        null,

      threadScope:
        this.normalizeThreadScope(
          candidate.threadScope
        ),

      isNewTopic:
        placementClass ===
        contract
          .placementClasses
          .NEW_TOPIC,

      isFollowUp:
        this.isFollowUpPlacementClass(
          placementClass
        ),

      isCorrection:
        placementClass ===
        contract
          .placementClasses
          .CORRECTION,

      isRevision:
        placementClass ===
        contract
          .placementClasses
          .REVISION,

      requiresPriorTurns:
        candidate
          .requiresPriorTurns ===
          true ||
        (
          placementClass !==
          contract
            .placementClasses
            .NEW_TOPIC &&
          placementClass !==
          contract
            .placementClasses
            .UNKNOWN_PLACEMENT
        ),

      score,

      confidence:
        contract
          .confidenceLabelFromScore(
            score
          ),

      evidenceIds:
        this.toArray(
          candidate.evidenceIds ||
          candidate.evidence
        )
          .map(value =>
            typeof value ===
              "object"
              ? value.evidenceId ||
                null
              : value
          )
          .filter(Boolean),

      basis:
        this.toArray(
          candidate.basis
        ),

      generatedBy:
        candidate.generatedBy ||
        null,

      semanticInterpretation:
        null,

      authority:
        "placement_candidate_only"
    };
  },

  sortPlacementCandidates(
    state = {}
  ) {
    state.placementCandidates =
      this.toArray(
        state.placementCandidates
      )
        .sort(
          (
            a,
            b
          ) =>
            b.score -
            a.score
        );
  },

  /* =====================================================
     REFERENCE BINDING CANDIDATES
  ===================================================== */

  addReferenceBindingCandidate(
    state = {},
    candidate = {}
  ) {
    if (
      !state ||
      typeof state !==
        "object"
    ) {
      return false;
    }

    const normalized =
      this.normalizeReferenceBindingCandidate(
        candidate
      );

    if (!normalized) {
      this.addWarning(
        state,
        {
          type:
            "invalid_reference_binding_candidate_rejected"
        }
      );

      return false;
    }

    const maximum =
      state.configuration
        ?.maximumBindingCandidates ||
      12;

    const duplicateIndex =
      state
        .referenceBindingCandidates
        .findIndex(
          item =>
            item.candidateId ===
              normalized.candidateId ||
            (
              item.surfaceClass ===
                normalized.surfaceClass &&
              this.sameIdSet(
                item.boundTurnIds,
                normalized.boundTurnIds
              )
            )
        );

    if (
      duplicateIndex >= 0
    ) {
      const existing =
        state
          .referenceBindingCandidates[
          duplicateIndex
        ];

      if (
        normalized.score >
        existing.score
      ) {
        state
          .referenceBindingCandidates[
          duplicateIndex
        ] =
          normalized;
      }
    } else {
      state
        .referenceBindingCandidates
        .push(normalized);
    }

    state
      .referenceBindingCandidates
      .sort(
        (
          a,
          b
        ) =>
          b.score -
          a.score
      );

    if (
      state
        .referenceBindingCandidates
        .length >
      maximum
    ) {
      state
        .referenceBindingCandidates =
        state
          .referenceBindingCandidates
          .slice(
            0,
            maximum
          );
    }

    state.diagnostics
      .counters
      .referenceBindingCandidateCount =
      state
        .referenceBindingCandidates
        .length;

    this.touch(state);

    return true;
  },

  normalizeReferenceBindingCandidate(
    candidate = {}
  ) {
    if (
      !candidate ||
      typeof candidate !==
        "object" ||
      Array.isArray(candidate)
    ) {
      return null;
    }

    const contract =
      this.getContract();

    const surfaceClass =
      candidate.surfaceClass ||
      contract
        .referenceSurfaceClasses
        .UNKNOWN_REFERENCE_SURFACE;

    if (
      !Object.values(
        contract
          .referenceSurfaceClasses
      ).includes(
        surfaceClass
      )
    ) {
      return null;
    }

    const boundTurnIds =
      this.toArray(
        candidate.boundTurnIds ||
        candidate.sourceTurnIds ||
        candidate.turnIds
      )
        .map(value =>
          this.toStableId(value)
        )
        .filter(Boolean);

    const score =
      this.normalizeScore(
        candidate.score ??
        candidate.confidence ??
        0
      );

    return {
      schema:
        "ari_cos_reference_binding_candidate",

      schemaVersion:
        this.schemaVersion,

      candidateId:
        candidate.candidateId ||
        this.createCandidateId(
          "binding"
        ),

      required:
        candidate.required ===
        true,

      resolved:
        candidate.resolved ===
          true ||
        boundTurnIds.length >
          0,

      surfaceClass,

      surfaceText:
        candidate.surfaceText ===
          undefined
          ? null
          : this.preserveText(
              candidate.surfaceText
            ),

      boundTurnIds,

      primaryBoundTurnId:
        this.toStableId(
          candidate
            .primaryBoundTurnId
        ) ||
        boundTurnIds[0] ||
        null,

      unresolvedReference:
        candidate
          .unresolvedReference ||
        null,

      score,

      confidence:
        contract
          .confidenceLabelFromScore(
            score
          ),

      evidenceIds:
        this.toArray(
          candidate.evidenceIds
        ),

      generatedBy:
        candidate.generatedBy ||
        null,

      semanticInterpretation:
        null,

      authority:
        "structural_reference_binding_candidate_only"
    };
  },

  /* =====================================================
     SOURCE TURN CANDIDATES
  ===================================================== */

  addSourceTurnCandidate(
    state = {},
    candidate = {}
  ) {
    if (
      !state ||
      typeof state !==
        "object"
    ) {
      return false;
    }

    const normalized =
      this.normalizeSourceTurnCandidate(
        state,
        candidate
      );

    if (!normalized) {
      this.addWarning(
        state,
        {
          type:
            "invalid_source_turn_candidate_rejected"
        }
      );

      return false;
    }

    const existingIndex =
      state
        .sourceTurnCandidates
        .findIndex(
          item =>
            item.turnId ===
            normalized.turnId
        );

    if (
      existingIndex >= 0
    ) {
      const existing =
        state
          .sourceTurnCandidates[
          existingIndex
        ];

      if (
        normalized.score >
        existing.score
      ) {
        state
          .sourceTurnCandidates[
          existingIndex
        ] =
          normalized;
      }
    } else {
      state
        .sourceTurnCandidates
        .push(normalized);
    }

    state
      .sourceTurnCandidates
      .sort(
        (
          a,
          b
        ) =>
          b.score -
          a.score
      );

    state.diagnostics
      .counters
      .sourceTurnCandidateCount =
      state
        .sourceTurnCandidates
        .length;

    this.touch(state);

    return true;
  },

  normalizeSourceTurnCandidate(
    state = {},
    candidate = {}
  ) {
    if (
      !candidate ||
      typeof candidate !==
        "object" ||
      Array.isArray(candidate)
    ) {
      return null;
    }

    const turnId =
      this.toStableId(
        candidate.turnId ||
        candidate.id
      );

    const turn =
      candidate.turn ||
      this.findAvailableTurn(
        state,
        turnId
      );

    if (
      !turn
    ) {
      return null;
    }

    const contract =
      this.getContract();

    const relationship =
      contract
        .isValidSourceTurnRelationship(
          candidate.relationship
        )
        ? candidate.relationship
        : contract
            .sourceTurnRelationships
            .CANDIDATE_SOURCE;

    const sourceRole =
      contract
        .isValidSourceTurnRole(
          candidate.sourceRole
        )
        ? candidate.sourceRole
        : contract
            .sourceTurnRoles
            .CANDIDATE;

    const score =
      this.normalizeScore(
        candidate.score ??
        candidate.confidence ??
        0
      );

    return {
      schema:
        "ari_cos_source_turn_candidate",

      schemaVersion:
        this.schemaVersion,

      candidateId:
        candidate.candidateId ||
        this.createCandidateId(
          "source_turn"
        ),

      turnId:
        turn.turnId,

      threadId:
        turn.threadId,

      conversationId:
        turn.conversationId,

      role:
        turn.role,

      text:
        turn.text,

      exactText:
        turn.exactText,

      sequence:
        turn.sequence,

      createdAt:
        turn.createdAt,

      relationship,

      sourceRole,

      score,

      confidence:
        contract
          .confidenceLabelFromScore(
            score
          ),

      evidenceIds:
        this.toArray(
          candidate.evidenceIds
        ),

      generatedBy:
        candidate.generatedBy ||
        null,

      textPreserved:
        true,

      semanticInterpretation:
        null,

      authority:
        "source_turn_candidate_only"
    };
  },

  /* =====================================================
     AUTHORITATIVE SELECTION STORAGE
  ===================================================== */

  setPlacementDecision(
    state = {},
    {
      placement = null,
      referenceBinding = null,
      sourceTurns = [],
      decision = null
    } = {}
  ) {
    if (
      !state ||
      typeof state !==
        "object"
    ) {
      return false;
    }

    const contract =
      this.getContract();

    const normalizedPlacement =
      this.normalizeSelectedPlacement(
        placement
      );

    if (
      !normalizedPlacement
    ) {
      this.addError(
        state,
        {
          type:
            "selected_placement_invalid"
        }
      );

      return false;
    }

    const normalizedBinding =
      referenceBinding
        ? this.normalizeSelectedReferenceBinding(
            referenceBinding
          )
        : contract
            .createEmptyReferenceBinding();

    if (
      !normalizedBinding
    ) {
      this.addError(
        state,
        {
          type:
            "selected_reference_binding_invalid"
        }
      );

      return false;
    }

    const normalizedSourceTurns =
      this.normalizeSelectedSourceTurns(
        state,
        sourceTurns
      );

    if (
      normalizedPlacement
        .requiresPriorTurns ===
        true &&
      !normalizedSourceTurns.length
    ) {
      this.addError(
        state,
        {
          type:
            "selected_placement_requires_source_turns"
        }
      );

      return false;
    }

    const normalizedDecision =
      this.normalizeSelectedDecision(
        decision,
        normalizedPlacement
      );

    if (
      !normalizedDecision
    ) {
      this.addError(
        state,
        {
          type:
            "selected_decision_invalid"
        }
      );

      return false;
    }

    state.selectedPlacement =
      normalizedPlacement;

    state.selectedReferenceBinding =
      normalizedBinding;

    state.selectedSourceTurns =
      normalizedSourceTurns;

    state.decision =
      normalizedDecision;

    state.diagnostics
      .counters
      .selectedSourceTurnCount =
      normalizedSourceTurns
        .length;

    this.completeStage(
      state,
      "decision"
    );

    this.touch(state);

    this.mark(
      state,
      "placement_decision_stored",
      {
        placementClass:
          normalizedPlacement.class,

        sourceTurnCount:
          normalizedSourceTurns
            .length,

        confidenceScore:
          normalizedDecision
            .confidenceScore
      }
    );

    return true;
  },

  normalizeSelectedPlacement(
    placement = null
  ) {
    const candidate =
      this.normalizePlacementCandidate(
        placement ||
        {}
      );

    if (!candidate) {
      return null;
    }

    return {
      class:
        candidate.class,

      family:
        candidate.family,

      isNewTopic:
        candidate.isNewTopic,

      isFollowUp:
        candidate.isFollowUp,

      isCorrection:
        candidate.isCorrection,

      isRevision:
        candidate.isRevision,

      isMemoryRequest:
        candidate.class ===
        this.getContract()
          .placementClasses
          .THREAD_MEMORY_REQUEST,

      isPreviousConversationReference:
        candidate.class ===
        this.getContract()
          .placementClasses
          .PREVIOUS_CONVERSATION_REFERENCE,

      isThemeContinuation:
        candidate.class ===
        this.getContract()
          .placementClasses
          .CONVERSATION_THEME_CONTINUATION,

      requiresPriorTurns:
        candidate.requiresPriorTurns,

      requiresPreviousConversation:
        candidate.threadScope ===
          this.getContract()
            .threadScopes
            .PREVIOUS_THREAD ||
        candidate.threadScope ===
          this.getContract()
            .threadScopes
            .CROSS_THREAD,

      primarySourceTurnId:
        candidate
          .primarySourceTurnId,

      sourceTurnIds:
        candidate.sourceTurnIds,

      threadScope:
        candidate.threadScope,

      evidenceIds:
        candidate.evidenceIds,

      authority:
        "conversation_placement_only"
    };
  },

  normalizeSelectedReferenceBinding(
    binding = {}
  ) {
    const normalized =
      this.normalizeReferenceBindingCandidate(
        binding
      );

    if (!normalized) {
      return null;
    }

    return {
      required:
        normalized.required,

      resolved:
        normalized.resolved,

      surfaceClass:
        normalized.surfaceClass,

      surfaceText:
        normalized.surfaceText,

      boundTurnIds:
        normalized.boundTurnIds,

      primaryBoundTurnId:
        normalized
          .primaryBoundTurnId,

      unresolvedReference:
        normalized
          .unresolvedReference,

      confidence:
        normalized.confidence,

      confidenceScore:
        normalized.score,

      evidenceIds:
        normalized.evidenceIds,

      authority:
        "structural_reference_binding_only"
    };
  },

  normalizeSelectedSourceTurns(
    state = {},
    sourceTurns = []
  ) {
    const contract =
      this.getContract();

    const maximum =
      state.configuration
        ?.maximumSourceTurns ||
      8;

    const seen =
      new Set();

    return this.toArray(
      sourceTurns
    )
      .map(
        (
          item,
          index
        ) => {
          const turnId =
            this.toStableId(
              item?.turnId ||
              item?.id ||
              item
            );

          const turn =
            item?.turn ||
            this.findAvailableTurn(
              state,
              turnId
            );

          if (
            !turn ||
            seen.has(
              String(
                turn.turnId
              )
            )
          ) {
            return null;
          }

          seen.add(
            String(
              turn.turnId
            )
          );

          const relationship =
            contract
              .isValidSourceTurnRelationship(
                item?.relationship
              )
              ? item.relationship
              : contract
                  .sourceTurnRelationships
                  .CONTEXT_SUPPORT;

          const role =
            contract
              .isValidSourceTurnRole(
                item?.sourceRole
              )
              ? item.sourceRole
              : index === 0
                ? contract
                    .sourceTurnRoles
                    .PRIMARY
                : contract
                    .sourceTurnRoles
                    .SUPPORTING;

          return contract
            .createSourceTurnRecord({
              turn,
              relationship,
              role,
              confidence:
                item?.score ??
                item?.confidence ??
                0,

              evidence:
                item?.evidenceIds ||
                item?.evidence ||
                []
            });
        }
      )
      .filter(Boolean)
      .slice(
        0,
        maximum
      );
  },

  normalizeSelectedDecision(
    decision = null,
    placement = {}
  ) {
    const contract =
      this.getContract();

    const score =
      this.normalizeScore(
        decision
          ?.confidenceScore ??
        decision?.score ??
        decision?.confidence ??
        0
      );

    const status =
      decision?.status ||
      (
        placement.class !==
        contract
          .placementClasses
          .UNKNOWN_PLACEMENT
          ? contract
              .decisionStatuses
              .RESOLVED
          : contract
              .decisionStatuses
              .UNRESOLVED
      );

    if (
      !Object.values(
        contract
          .decisionStatuses
      ).includes(status)
    ) {
      return null;
    }

    return {
      status,

      confidence:
        contract
          .confidenceLabelFromScore(
            score
          ),

      confidenceScore:
        score,

      basis:
        this.toArray(
          decision?.basis
        ),

      alternatives:
        this.toArray(
          decision?.alternatives
        ),

      authoritative:
        status ===
        contract
          .decisionStatuses
          .RESOLVED,

      reason:
        decision?.reason ||
        (
          status ===
          contract
            .decisionStatuses
            .RESOLVED
            ? "conversation_placement_resolved"
            : "conversation_placement_unresolved"
        ),

      decidedBy:
        decision?.decidedBy ||
        null,

      authority:
        "cos_placement_decision_record"
    };
  },

  /* =====================================================
     PACKET STORAGE
  ===================================================== */

  setPacket(
    state = {},
    packet = null
  ) {
    if (
      !state ||
      typeof state !==
        "object" ||
      !packet ||
      typeof packet !==
        "object"
    ) {
      return false;
    }

    const contract =
      this.getContract();

    const validation =
      contract
        .validatePlacementPacket(
          packet
        );

    state.validation.packet =
      validation;

    if (
      validation.valid !==
      true
    ) {
      this.addError(
        state,
        {
          type:
            "cos_packet_validation_failed",

          errors:
            validation.errors
        }
      );

      return false;
    }

    state.packet =
      packet;

    state.ready =
      packet.ready ===
      true;

    state.usable =
      packet.usable ===
      true;

    state.complete =
      packet.ready ===
        true &&
      packet.usable ===
        true;

    this.completeStage(
      state,
      "packetBuild"
    );

    if (
      state.complete
    ) {
      this.completeStage(
        state,
        "complete"
      );
    }

    this.touch(state);

    return true;
  },

  /* =====================================================
     ERRORS AND WARNINGS
  ===================================================== */

  addError(
    state = {},
    error = null
  ) {
    if (
      !state ||
      typeof state !==
        "object"
    ) {
      return false;
    }

    const record =
      this.normalizeDiagnosticRecord(
        error,
        "error"
      );

    if (!record) {
      return false;
    }

    state.diagnostics =
      state.diagnostics ||
      {};

    state.diagnostics.errors =
      this.toArray(
        state.diagnostics.errors
      );

    state.diagnostics
      .errors
      .push(record);

    state.failed =
      true;

    state.usable =
      false;

    state.diagnostics
      .counters
      .errorCount =
      state.diagnostics
        .errors
        .length;

    this.touch(state);

    return true;
  },

  addWarning(
    state = {},
    warning = null
  ) {
    if (
      !state ||
      typeof state !==
        "object"
    ) {
      return false;
    }

    const record =
      this.normalizeDiagnosticRecord(
        warning,
        "warning"
      );

    if (!record) {
      return false;
    }

    state.diagnostics =
      state.diagnostics ||
      {};

    state.diagnostics.warnings =
      this.toArray(
        state.diagnostics.warnings
      );

    state.diagnostics
      .warnings
      .push(record);

    state.diagnostics
      .counters
      .warningCount =
      state.diagnostics
        .warnings
        .length;

    this.touch(state);

    return true;
  },

  normalizeDiagnosticRecord(
    value = null,
    level = "warning"
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
      return {
        level,

        type:
          this.normalizeIdentifier(
            value
          ) ||
          `${level}_record`,

        message:
          value,

        createdAt:
          new Date()
            .toISOString()
      };
    }

    if (
      typeof value !==
        "object" ||
      Array.isArray(value)
    ) {
      return {
        level,

        type:
          `${level}_record`,

        message:
          String(value),

        createdAt:
          new Date()
            .toISOString()
      };
    }

    return {
      ...value,

      level:
        value.level ||
        level,

      type:
        value.type ||
        `${level}_record`,

      createdAt:
        value.createdAt ||
        new Date()
          .toISOString()
    };
  },

  /* =====================================================
     MARKS AND TIMING
  ===================================================== */

  mark(
    state = {},
    name = "",
    metadata = {}
  ) {
    if (
      !state ||
      typeof state !==
        "object"
    ) {
      return null;
    }

    const normalizedName =
      this.normalizeIdentifier(
        name
      );

    if (!normalizedName) {
      return null;
    }

    const now =
      Date.now();

    const startedAt =
      state.diagnostics
        ?.timing
        ?.startedAtEpochMs ??
      now;

    const record = {
      name:
        normalizedName,

      at:
        new Date(now)
          .toISOString(),

      elapsedMs:
        Math.max(
          0,
          now -
          startedAt
        ),

      metadata:
        this.normalizeMetadata(
          metadata
        )
    };

    state.diagnostics =
      state.diagnostics ||
      {};

    state.diagnostics.marks =
      this.toArray(
        state.diagnostics.marks
      );

    state.diagnostics
      .marks
      .push(record);

    return record;
  },

  createTimingState() {
    const now =
      Date.now();

    return {
      startedAt:
        new Date(now)
          .toISOString(),

      startedAtEpochMs:
        now,

      completedAt:
        null,

      durationMs:
        null
    };
  },

  finalizeTiming(
    state = {}
  ) {
    if (
      !state ||
      typeof state !==
        "object"
    ) {
      return null;
    }

    const now =
      Date.now();

    const startedAt =
      state.diagnostics
        ?.timing
        ?.startedAtEpochMs ??
      now;

    state.diagnostics.timing =
      {
        ...(
          state.diagnostics
            ?.timing ||
          {}
        ),

        completedAt:
          new Date(now)
            .toISOString(),

        durationMs:
          Math.max(
            0,
            now -
            startedAt
          )
      };

    return state
      .diagnostics
      .timing;
  },

  createCounters() {
    return {
      structuralEvidenceCount:
        0,

      placementCandidateCount:
        0,

      referenceBindingCandidateCount:
        0,

      sourceTurnCandidateCount:
        0,

      selectedSourceTurnCount:
        0,

      errorCount:
        0,

      warningCount:
        0
    };
  },

  /* =====================================================
     SNAPSHOTS
  ===================================================== */

  snapshot(
    state = {},
    {
      includeInput = true,
      includeCandidates = true,
      includeDiagnostics = true,
      includePacket = true
    } = {}
  ) {
    if (
      !state ||
      typeof state !==
        "object"
    ) {
      return null;
    }

    return {
      schema:
        state.schema,

      schemaVersion:
        state.schemaVersion,

      ready:
        state.ready ===
        true,

      usable:
        state.usable ===
        true,

      complete:
        state.complete ===
        true,

      failed:
        state.failed ===
        true,

      source:
        state.source,

      version:
        state.version,

      runtimeId:
        state.runtimeId,

      requestId:
        state.requestId,

      sessionId:
        state.sessionId,

      createdAt:
        state.createdAt,

      updatedAt:
        state.updatedAt,

      currentTurn:
        this.cloneValue(
          state.currentTurn
        ),

      availableTurns:
        includeInput
          ? this.cloneValue(
              state.availableTurns
            )
          : [],

      currentThread:
        includeInput
          ? this.cloneValue(
              state.currentThread
            )
          : null,

      previousThreads:
        includeInput
          ? this.cloneValue(
              state.previousThreads
            )
          : [],

      configuration:
        this.cloneValue(
          state.configuration
        ),

      stage:
        this.cloneValue(
          state.stage
        ),

      structuralEvidence:
        includeCandidates
          ? this.cloneValue(
              state
                .structuralEvidence
            )
          : null,

      placementCandidates:
        includeCandidates
          ? this.cloneValue(
              state
                .placementCandidates
            )
          : [],

      referenceBindingCandidates:
        includeCandidates
          ? this.cloneValue(
              state
                .referenceBindingCandidates
            )
          : [],

      sourceTurnCandidates:
        includeCandidates
          ? this.cloneValue(
              state
                .sourceTurnCandidates
            )
          : [],

      selectedPlacement:
        this.cloneValue(
          state
            .selectedPlacement
        ),

      selectedReferenceBinding:
        this.cloneValue(
          state
            .selectedReferenceBinding
        ),

      selectedSourceTurns:
        this.cloneValue(
          state
            .selectedSourceTurns
        ),

      decision:
        this.cloneValue(
          state.decision
        ),

      packet:
        includePacket
          ? this.cloneValue(
              state.packet
            )
          : null,

      validation:
        this.cloneValue(
          state.validation
        ),

      diagnostics:
        includeDiagnostics
          ? this.cloneValue(
              state.diagnostics
            )
          : null,

      authority:
        this.cloneValue(
          state.authority
        )
    };
  },

  /* =====================================================
     STATE VALIDATION
  ===================================================== */

  validate(
    state = {}
  ) {
    const errors = [];
    const warnings = [];

    if (
      !state ||
      typeof state !==
        "object" ||
      Array.isArray(state)
    ) {
      errors.push(
        "cos_state_invalid"
      );

      return {
        valid:
          false,

        source:
          "cos-state-validation",

        version:
          this.version,

        errors,
        warnings
      };
    }

    if (
      state.schema !==
      "ari_cos_runtime_state"
    ) {
      errors.push(
        "cos_state_schema_mismatch"
      );
    }

    if (
      !state.runtimeId
    ) {
      errors.push(
        "cos_runtime_id_missing"
      );
    }

    if (
      !state.currentTurn
    ) {
      errors.push(
        "cos_current_turn_missing"
      );
    }

    if (
      !Array.isArray(
        state.availableTurns
      )
    ) {
      errors.push(
        "cos_available_turns_invalid"
      );
    }

    if (
      !state.configuration
    ) {
      errors.push(
        "cos_configuration_missing"
      );
    }

    if (
      state.configuration
        ?.allowSemanticInterpretation ===
        true
    ) {
      errors.push(
        "cos_semantic_interpretation_enabled"
      );
    }

    if (
      state.configuration
        ?.allowConversationFunctionClassification ===
        true
    ) {
      errors.push(
        "cos_conversation_function_enabled"
      );
    }

    if (
      state.configuration
        ?.allowAI ===
        true
    ) {
      errors.push(
        "cos_ai_enabled"
      );
    }

    if (
      !Array.isArray(
        state.placementCandidates
      )
    ) {
      errors.push(
        "cos_placement_candidates_invalid"
      );
    }

    if (
      !Array.isArray(
        state.referenceBindingCandidates
      )
    ) {
      errors.push(
        "cos_reference_binding_candidates_invalid"
      );
    }

    if (
      !Array.isArray(
        state.sourceTurnCandidates
      )
    ) {
      errors.push(
        "cos_source_turn_candidates_invalid"
      );
    }

    const contract =
      this.getContract();

    const forbiddenFields =
      contract
        .findForbiddenInterpretiveFields(
          {
            selectedPlacement:
              state
                .selectedPlacement,

            selectedReferenceBinding:
              state
                .selectedReferenceBinding,

            selectedSourceTurns:
              state
                .selectedSourceTurns,

            decision:
              state.decision
          }
        );

    if (
      forbiddenFields.length
    ) {
      errors.push({
        type:
          "cos_state_contains_forbidden_interpretive_fields",

        fields:
          forbiddenFields
      });
    }

    if (
      state.complete ===
        true &&
      !state.packet
    ) {
      errors.push(
        "cos_complete_state_missing_packet"
      );
    }

    if (
      state.selectedPlacement
        ?.requiresPriorTurns ===
        true &&
      !state.selectedSourceTurns
        ?.length
    ) {
      errors.push(
        "cos_selected_source_turns_missing"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      source:
        "cos-state-validation",

      version:
        this.version,

      schemaVersion:
        this.schemaVersion,

      errors,
      warnings,

      checks: {
        exactTurnTextPreserved:
          state.currentTurn
            ?.textPreserved ===
          true,

        semanticInterpretationDisabled:
          state.configuration
            ?.allowSemanticInterpretation ===
          false,

        conversationFunctionDisabled:
          state.configuration
            ?.allowConversationFunctionClassification ===
          false,

        aiDisabled:
          state.configuration
            ?.allowAI ===
          false,

        stateDoesNotDeterminePlacement:
          this
            .getAuthorityBoundaries()
            .canDeterminePlacement ===
          false,

        stateDoesNotBindReferences:
          this
            .getAuthorityBoundaries()
            .canBindReferences ===
          false,

        stateDoesNotSelectSourceTurns:
          this
            .getAuthorityBoundaries()
            .canSelectSourceTurns ===
          false
      }
    };
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canCreateRuntimeState:
        true,

      canPreserveCurrentTurn:
        true,

      canPreserveAvailableTurns:
        true,

      canStoreStructuralEvidence:
        true,

      canStorePlacementCandidates:
        true,

      canStoreReferenceBindingCandidates:
        true,

      canStoreSourceTurnCandidates:
        true,

      canStoreAuthoritativePlacement:
        true,

      canStoreAuthoritativeReferenceBinding:
        true,

      canStoreAuthoritativeSourceTurns:
        true,

      canTrackRuntimeProgress:
        true,

      canTrackDiagnostics:
        true,

      canCreateSnapshots:
        true,

      canValidateState:
        true,

      canDeterminePlacement:
        false,

      canClassifyNewTopic:
        false,

      canClassifyFollowUp:
        false,

      canBindReferences:
        false,

      canSelectSourceTurns:
        false,

      canLoadConversationHistory:
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

      canDetermineResponsePlan:
        false,

      canCallAI:
        false,

      canAnswerUser:
        false,

      canPersistState:
        false,

      role:
        "isolated_conversation_placement_runtime_state"
    };
  },

  /* =====================================================
     LOOKUP HELPERS
  ===================================================== */

  findAvailableTurn(
    state = {},
    turnId = null
  ) {
    const stableId =
      this.toStableId(
        turnId
      );

    if (!stableId) {
      return null;
    }

    return this.toArray(
      state.availableTurns
    )
      .find(
        turn =>
          String(
            turn?.turnId
          ) ===
          stableId
      ) ||
      null;
  },

  familyForPlacementClass(
    placementClass = null
  ) {
    const contract =
      this.getContract();

    const map = {
      [contract
        .placementClasses
        .NEW_TOPIC]:
        contract
          .placementFamilies
          .NEW,

      [contract
        .placementClasses
        .DIRECT_FOLLOW_UP]:
        contract
          .placementFamilies
          .FOLLOW_UP,

      [contract
        .placementClasses
        .EARLIER_TURN_FOLLOW_UP]:
        contract
          .placementFamilies
          .FOLLOW_UP,

      [contract
        .placementClasses
        .MULTI_TURN_CONTINUATION]:
        contract
          .placementFamilies
          .FOLLOW_UP,

      [contract
        .placementClasses
        .CORRECTION]:
        contract
          .placementFamilies
          .CORRECTION,

      [contract
        .placementClasses
        .REVISION]:
        contract
          .placementFamilies
          .REVISION,

      [contract
        .placementClasses
        .PRIOR_ANSWER_REFERENCE]:
        contract
          .placementFamilies
          .REFERENCE,

      [contract
        .placementClasses
        .PRIOR_QUESTION_REFERENCE]:
        contract
          .placementFamilies
          .REFERENCE,

      [contract
        .placementClasses
        .PRIOR_EVENT_REFERENCE]:
        contract
          .placementFamilies
          .REFERENCE,

      [contract
        .placementClasses
        .PRIOR_ARTIFACT_REFERENCE]:
        contract
          .placementFamilies
          .REFERENCE,

      [contract
        .placementClasses
        .THREAD_MEMORY_REQUEST]:
        contract
          .placementFamilies
          .MEMORY,

      [contract
        .placementClasses
        .PREVIOUS_CONVERSATION_REFERENCE]:
        contract
          .placementFamilies
          .MEMORY,

      [contract
        .placementClasses
        .CONVERSATION_THEME_CONTINUATION]:
        contract
          .placementFamilies
          .THEME,

      [contract
        .placementClasses
        .UNKNOWN_PLACEMENT]:
        contract
          .placementFamilies
          .UNKNOWN
    };

    return map[
      placementClass
    ] ||
      contract
        .placementFamilies
        .UNKNOWN;
  },

  isFollowUpPlacementClass(
    placementClass = null
  ) {
    const contract =
      this.getContract();

    return [
      contract
        .placementClasses
        .DIRECT_FOLLOW_UP,

      contract
        .placementClasses
        .EARLIER_TURN_FOLLOW_UP,

      contract
        .placementClasses
        .MULTI_TURN_CONTINUATION,

      contract
        .placementClasses
        .PRIOR_ANSWER_REFERENCE,

      contract
        .placementClasses
        .PRIOR_QUESTION_REFERENCE,

      contract
        .placementClasses
        .PRIOR_EVENT_REFERENCE,

      contract
        .placementClasses
        .PRIOR_ARTIFACT_REFERENCE,

      contract
        .placementClasses
        .THREAD_MEMORY_REQUEST,

      contract
        .placementClasses
        .PREVIOUS_CONVERSATION_REFERENCE,

      contract
        .placementClasses
        .CONVERSATION_THEME_CONTINUATION
    ].includes(
      placementClass
    );
  },

  normalizeThreadScope(
    value = null
  ) {
    const contract =
      this.getContract();

    return Object.values(
      contract.threadScopes
    ).includes(value)
      ? value
      : contract
          .threadScopes
          .CURRENT_THREAD;
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  getContract() {
    const contract =
      window.AriCOSContract ||
      window.Ari
        ?.cosContract ||
      null;

    if (
      !contract
    ) {
      throw new Error(
        "cos_contract_not_loaded"
      );
    }

    return contract;
  },

  touch(
    state = {}
  ) {
    if (
      state &&
      typeof state ===
        "object"
    ) {
      state.updatedAt =
        new Date()
          .toISOString();
    }

    return state;
  },

  createRuntimeId() {
    return (
      "cos_runtime_" +
      this.createRandomId()
    );
  },

  createEvidenceId() {
    return (
      "cos_evidence_" +
      this.createRandomId()
    );
  },

  createCandidateId(
    prefix = "candidate"
  ) {
    return (
      `cos_${this.normalizeIdentifier(
        prefix
      )}_` +
      this.createRandomId()
    );
  },

  createRandomId() {
    if (
      globalThis.crypto &&
      typeof globalThis
        .crypto
        .randomUUID ===
        "function"
    ) {
      return globalThis
        .crypto
        .randomUUID();
    }

    return (
      Date.now()
        .toString(36) +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 12)
    );
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

  normalizeScore(
    value = 0
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(
        number
      )
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

  toPositiveInteger(
    value = null,
    fallback = 1
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(
        number
      ) ||
      number <=
        0
    ) {
      return fallback;
    }

    return Math.max(
      1,
      Math.floor(
        number
      )
    );
  },

  toFiniteNumber(
    value = null
  ) {
    if (
      value ===
        null ||
      value ===
        undefined ||
      value ===
        ""
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
  },

  toStableId(
    value = null
  ) {
    if (
      value ===
        null ||
      value ===
        undefined ||
      value ===
        ""
    ) {
      return null;
    }

    if (
      typeof value ===
        "object"
    ) {
      const nested =
        value.turnId ??
        value.messageId ??
        value.id ??
        null;

      return nested ===
        null
        ? null
        : String(nested);
    }

    return String(value);
  },

  preserveText(
    value = ""
  ) {
    return String(
      value ??
      ""
    );
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

  cloneValue(
    value = null
  ) {
    if (
      value ===
        undefined
    ) {
      return undefined;
    }

    if (
      typeof structuredClone ===
        "function"
    ) {
      try {
        return structuredClone(
          value
        );
      } catch (error) {
        // Fall through to JSON clone.
      }
    }

    try {
      return JSON.parse(
        JSON.stringify(
          value
        )
      );
    } catch (error) {
      return null;
    }
  },

  sameIdSet(
    first = [],
    second = []
  ) {
    const a =
      this.toArray(first)
        .map(value =>
          this.toStableId(
            value
          )
        )
        .filter(Boolean)
        .sort();

    const b =
      this.toArray(second)
        .map(value =>
          this.toStableId(
            value
          )
        )
        .filter(Boolean)
        .sort();

    return (
      a.length ===
        b.length &&
      a.every(
        (
          value,
          index
        ) =>
          value ===
          b[index]
      )
    );
  },

  pushUnique(
    values = [],
    value = null
  ) {
    if (
      !Array.isArray(values) ||
      value ===
        null ||
      value ===
        undefined
    ) {
      return values;
    }

    if (
      !values.includes(value)
    ) {
      values.push(value);
    }

    return values;
  },

  removeValue(
    values = [],
    value = null
  ) {
    if (
      !Array.isArray(values)
    ) {
      return values;
    }

    let index =
      values.indexOf(
        value
      );

    while (
      index >=
      0
    ) {
      values.splice(
        index,
        1
      );

      index =
        values.indexOf(
          value
        );
    }

    return values;
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

window.Ari.cosState =
  window.AriCOSState;

console.log(
  "ARI COS STATE LOADED:",
  window.AriCOSState
    ?.version
);