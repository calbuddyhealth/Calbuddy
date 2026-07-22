// ari/context/ari-entity-reference-resolver.js
// Ari Entity & Reference Resolver
// Purpose: Resolve current-turn references against canonical semantic structure and thread context.
// V6.0.0 — Canonical Reference Resolution / No Intent / No Situation / No Frame Authority

window.Ari = window.Ari || {};

window.AriEntityReferenceResolver = {
  version: "6.0.0",
  schemaVersion: "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  resolve(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const semanticStructure =
      this.readSemanticStructure(summary);

    const threadContext =
      this.readThreadContext(summary);

    const currentTurn =
      this.readCurrentTurn({
        summary,
        semanticStructure,
        threadContext
      });

    const referenceCandidates =
      this.buildCandidateIndex({
        semanticStructure,
        threadContext,
        currentTurn
      });

    const referenceDecisions =
      this.resolveAllReferences({
        semanticStructure,
        threadContext,
        referenceCandidates,
        currentTurn
      });

    const resolvedSemanticStructure =
      this.applyResolutions({
        semanticStructure,
        referenceDecisions
      });

    const unresolvedReferences =
      referenceDecisions.filter(
        decision =>
          decision.status !==
          "resolved"
      );

    const resolvedReferences =
      referenceDecisions.filter(
        decision =>
          decision.status ===
          "resolved"
      );

    const resolutionGraph =
      this.buildResolutionGraph({
        referenceDecisions,
        referenceCandidates
      });

    const quality =
      this.buildQualityReport({
        semanticStructure,
        threadContext,
        referenceDecisions,
        referenceCandidates
      });

    const referenceResolution =
      this.buildCanonicalResolution({
        currentTurn,
        semanticStructure,
        resolvedSemanticStructure,
        threadContext,
        referenceCandidates,
        referenceDecisions,
        resolvedReferences,
        unresolvedReferences,
        resolutionGraph,
        quality
      });

    window.Ari.referenceResolution =
      referenceResolution;

    window.Ari.entityReferenceState =
      referenceResolution;

    // Temporary compatibility alias.
    window.Ari.subjectGraphState =
      referenceResolution;

    return this.buildReturnPayload({
      referenceResolution,
      resolvedSemanticStructure,
      resolvedReferences,
      unresolvedReferences,
      referenceCandidates,
      quality
    });
  },

  /* =====================================================
     INPUT READING
  ===================================================== */

  readSemanticStructure(summary = {}) {
    const candidates = [
      summary.semanticStructure,
      summary.currentSemanticStructure,

      summary.threadUnderstanding
        ?.semanticStructure,

      summary.threadUnderstandingResult
        ?.semanticStructure,

      summary.threadUnderstanding
        ?.threadUnderstanding
        ?.semanticStructure,

      summary.semanticStructureOutput,

      window.Ari.semanticStructure
    ];

    const found =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object" &&
        (
          candidate.schema ===
            "ari_semantic_structure" ||
          Array.isArray(
            candidate.references
          ) ||
          Array.isArray(
            candidate.entities
          )
        )
      );

    if (found) {
      return {
        ...found,

        entities:
          this.asArray(
            found.entities
          ),

        events:
          this.asArray(
            found.events
          ),

        claims:
          this.asArray(
            found.claims
          ),

        attributes:
          this.asArray(
            found.attributes
          ),

        quantities:
          this.asArray(
            found.quantities
          ),

        relations:
          this.asArray(
            found.relations
          ),

        references:
          this.asArray(
            found.references
          ),

        options:
          this.asArray(
            found.options
          ),

        criteria:
          this.asArray(
            found.criteria
          ),

        constraints:
          this.asArray(
            found.constraints
          ),

        stakes:
          this.asArray(
            found.stakes
          ),

        comparisonStructures:
          this.asArray(
            found.comparisonStructures
          )
      };
    }

    return {
      schema:
        "ari_semantic_structure",

      version:
        null,

      source:
        "not_available",

      ran:
        false,

      turnId:
        null,

      participants: {
        speaker: {
          entityRef:
            "user"
        },

        addressee: {
          entityRef:
            "assistant"
        },

        mentionedParticipants: []
      },

      entities: [],
      events: [],
      claims: [],
      attributes: [],
      quantities: [],
      relations: [],
      negations: [],
      discourseSignals: [],
      emotionalSignals: [],
      references: [],
      options: [],
      criteria: [],
      constraints: [],
      stakes: [],
      comparisonStructures: [],
      unresolved: [],
      evidenceRefs: []
    };
  },

  readThreadContext(summary = {}) {
    const candidates = [
      summary.threadContext,
      summary.currentThreadContext,

      summary.continuityState
        ?.threadContext,

      summary.conversationContinuity
        ?.threadContext,

      summary.threadState
        ?.threadContext,

      summary.continuityPacket
        ?.threadContext,

      summary.continuityPacket
        ?.activeThread
        ?.threadContext,

      window.Ari.threadContext
    ];

    const found =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object" &&
        (
          candidate.schema ===
            "ari_thread_context" ||
          Array.isArray(
            candidate.referenceCandidates
          ) ||
          Array.isArray(
            candidate.recentTurns
          )
        )
      );

    if (found) {
      return {
        ...found,

        recentTurns:
          this.asArray(
            found.recentTurns
          ),

        referenceCandidates:
          this.asArray(
            found.referenceCandidates
          ),

        staleContext:
          this.asArray(
            found.staleContext
          )
      };
    }

    return {
      schema:
        "ari_thread_context",

      version:
        null,

      source:
        "not_available",

      ran:
        false,

      threadId:
        null,

      currentTurn:
        null,

      immediatePreviousUserTurn:
        null,

      immediatePreviousAssistantTurn:
        null,

      recentTurns: [],
      referenceCandidates: [],
      continuitySignals: {},
      staleContext: [],
      evidenceRefs: []
    };
  },

  readCurrentTurn({
    summary = {},
    semanticStructure = {},
    threadContext = {}
  } = {}) {
    const rawText =
      this.clean(
        summary.userMessage ||
        summary.message ||
        summary.input ||
        summary.normalizedMessage ||
        threadContext.currentTurn
          ?.text ||
        ""
      );

    return {
      turnId:
        semanticStructure.turnId ||
        threadContext.currentTurn
          ?.turnId ||
        summary.turnId ||
        this.createStableId(
          "turn",
          rawText
        ),

      rawText,

      normalizedText:
        this.normalize(rawText),

      wordCount:
        this.normalize(rawText)
          .split(/\s+/)
          .filter(Boolean)
          .length
    };
  },

  /* =====================================================
     CANDIDATE INDEX
  ===================================================== */

  buildCandidateIndex({
    semanticStructure = {},
    threadContext = {},
    currentTurn = {}
  } = {}) {
    const candidates = [];

    this.addCurrentTurnCandidates({
      target:
        candidates,

      semanticStructure,
      currentTurn
    });

    this.addThreadCandidates({
      target:
        candidates,

      threadContext,
      currentTurn
    });

    const merged =
      this.mergeCandidates(
        candidates
      );

    return {
      items:
        merged,

      bySemanticType:
        this.groupBy(
          merged,
          "semanticType"
        ),

      bySourceType:
        this.groupBy(
          merged,
          "sourceType"
        ),

      byTurnDistance:
        this.groupBy(
          merged,
          "turnDistance"
        ),

      currentTurnCandidateCount:
        merged.filter(candidate =>
          candidate.turnDistance ===
          0
        ).length,

      priorTurnCandidateCount:
        merged.filter(candidate =>
          candidate.turnDistance >
          0
        ).length
    };
  },

  addCurrentTurnCandidates({
    target = [],
    semanticStructure = {},
    currentTurn = {}
  } = {}) {
    this.asArray(
      semanticStructure.entities
    ).forEach(entity => {
      target.push(
        this.candidateFromNode({
          node:
            entity,

          semanticType:
            entity.entityType ||
            "entity",

          sourceType:
            "current_turn_entity",

          turnId:
            currentTurn.turnId,

          turnDistance:
            0,

          recency:
            1,

          currentTurn:
            true
        })
      );
    });

    this.asArray(
      semanticStructure.events
    ).forEach(event => {
      target.push(
        this.candidateFromNode({
          node:
            event,

          semanticType:
            "event",

          sourceType:
            "current_turn_event",

          turnId:
            currentTurn.turnId,

          turnDistance:
            0,

          recency:
            1,

          currentTurn:
            true
        })
      );
    });

    this.asArray(
      semanticStructure.claims
    ).forEach(claim => {
      target.push(
        this.candidateFromNode({
          node:
            claim,

          semanticType:
            "claim",

          sourceType:
            "current_turn_claim",

          turnId:
            currentTurn.turnId,

          turnDistance:
            0,

          recency:
            1,

          currentTurn:
            true
        })
      );
    });

    this.asArray(
      semanticStructure.quantities
    ).forEach(quantity => {
      target.push(
        this.candidateFromNode({
          node:
            quantity,

          semanticType:
            "quantity",

          sourceType:
            "current_turn_quantity",

          turnId:
            currentTurn.turnId,

          turnDistance:
            0,

          recency:
            1,

          currentTurn:
            true
        })
      );
    });

    this.asArray(
      semanticStructure.options
    ).forEach(option => {
      target.push(
        this.candidateFromNode({
          node:
            option,

          semanticType:
            "option",

          sourceType:
            "current_turn_option",

          turnId:
            currentTurn.turnId,

          turnDistance:
            0,

          recency:
            1,

          currentTurn:
            true
        })
      );
    });

    this.asArray(
      semanticStructure.attributes
    ).forEach(attribute => {
      target.push(
        this.candidateFromNode({
          node:
            attribute,

          semanticType:
            "attribute",

          sourceType:
            "current_turn_attribute",

          turnId:
            currentTurn.turnId,

          turnDistance:
            0,

          recency:
            1,

          currentTurn:
            true
        })
      );
    });
  },

  addThreadCandidates({
    target = [],
    threadContext = {},
    currentTurn = {}
  } = {}) {
    this.asArray(
      threadContext.referenceCandidates
    ).forEach(
      (
        candidate,
        index
      ) => {
        target.push(
          this.normalizeThreadCandidate({
            candidate,
            index,
            currentTurn
          })
        );
      }
    );

    this.addTurnSemanticCandidates({
      target,

      turn:
        threadContext
          .immediatePreviousUserTurn,

      sourceType:
        "previous_user_turn",

      turnDistance:
        1
    });

    this.addTurnSemanticCandidates({
      target,

      turn:
        threadContext
          .immediatePreviousAssistantTurn,

      sourceType:
        "previous_assistant_turn",

      turnDistance:
        1
    });

    this.asArray(
      threadContext.recentTurns
    )
      .slice(-8)
      .reverse()
      .forEach(
        (
          turn,
          index
        ) => {
          this.addTurnSemanticCandidates({
            target,
            turn,

            sourceType:
              turn.role ===
                "assistant"
                ? "recent_assistant_turn"
                : "recent_user_turn",

            turnDistance:
              index + 1
          });
        }
      );
  },

  addTurnSemanticCandidates({
    target = [],
    turn = null,
    sourceType = "thread_turn",
    turnDistance = 1
  } = {}) {
    if (
      !turn ||
      typeof turn !== "object"
    ) {
      return;
    }

    const semanticNodes = [
      ...this.tagNodes(
        turn.entities,
        "entity"
      ),

      ...this.tagNodes(
        turn.events,
        "event"
      ),

      ...this.tagNodes(
        turn.claims,
        "claim"
      ),

      ...this.tagNodes(
        turn.quantities,
        "quantity"
      ),

      ...this.tagNodes(
        turn.options,
        "option"
      ),

      ...this.tagNodes(
        turn.semanticNodes,
        null
      )
    ];

    semanticNodes.forEach(node => {
      target.push(
        this.candidateFromNode({
          node,

          semanticType:
            node.__semanticType ||
            node.semanticType ||
            node.entityType ||
            node.nodeType ||
            "entity",

          sourceType,

          turnId:
            turn.turnId ||
            null,

          turnDistance,

          recency:
            Math.max(
              0.1,
              1 -
              turnDistance *
              0.12
            ),

          currentTurn:
            false,

          speaker:
            turn.role ||
            null
        })
      );
    });
  },

  tagNodes(
    nodes = [],
    semanticType = null
  ) {
    return this.asArray(nodes)
      .map(node => ({
        ...(
          typeof node ===
            "object"
            ? node
            : {
                value:
                  node
              }
        ),

        __semanticType:
          semanticType ||
          node
            ?.semanticType ||
          null
      }));
  },

  normalizeThreadCandidate({
    candidate = {},
    index = 0
  } = {}) {
    const semanticRef =
      candidate.semanticRef ||
      candidate.id ||
      candidate.nodeId ||
      this.createStableId(
        "thread_candidate",
        [
          candidate.surface,
          candidate.value,
          candidate.label,
          index
        ].join("|")
      );

    return {
      semanticRef,

      semanticType:
        this.normalizeSemanticType(
          candidate.semanticType ||
          candidate.nodeType ||
          candidate.entityType ||
          candidate.type ||
          "entity"
        ),

      subtype:
        candidate.subtype ||
        null,

      surface:
        this.clean(
          candidate.surface ||
          candidate.label ||
          candidate.value ||
          candidate.claim ||
          candidate.proposition ||
          candidate.text ||
          ""
        ),

      normalizedValue:
        this.normalize(
          candidate.normalizedValue ||
          candidate.surface ||
          candidate.label ||
          candidate.value ||
          candidate.claim ||
          candidate.proposition ||
          ""
        ),

      sourceType:
        candidate.sourceType ||
        "thread_reference_candidate",

      turnId:
        candidate.turnId ||
        null,

      turnDistance:
        Number.isFinite(
          Number(
            candidate.turnDistance
          )
        )
          ? Number(
              candidate.turnDistance
            )
          : 1,

      recency:
        this.normalizeConfidence(
          candidate.recency ??
          0.82
        ),

      salience:
        this.normalizeConfidence(
          candidate.salience ??
          0.65
        ),

      grammaticalRole:
        candidate.grammaticalRole ||
        null,

      discourseRole:
        candidate.discourseRole ||
        null,

      number:
        candidate.number ||
        null,

      gender:
        candidate.gender ||
        null,

      speaker:
        candidate.speaker ||
        null,

      confidence:
        this.normalizeConfidence(
          candidate.confidence ??
          0.72
        ),

      evidenceRefs:
        this.asArray(
          candidate.evidenceRefs
        ),

      raw:
        candidate
    };
  },

  candidateFromNode({
    node = {},
    semanticType = "entity",
    sourceType = "unknown",
    turnId = null,
    turnDistance = 0,
    recency = 1,
    currentTurn = false,
    speaker = null
  } = {}) {
    const semanticRef =
      node.id ||
      node.semanticRef ||
      this.createStableId(
        "candidate",
        [
          semanticType,
          this.extractNodeSurface(node),
          turnId
        ].join("|")
      );

    return {
      semanticRef,

      semanticType:
        this.normalizeSemanticType(
          semanticType
        ),

      subtype:
        node.subtype ||
        null,

      surface:
        this.extractNodeSurface(
          node
        ),

      normalizedValue:
        this.normalize(
          node.normalizedValue ||
          this.extractNodeSurface(
            node
          )
        ),

      sourceType,

      turnId,

      turnDistance:
        Number(
          turnDistance ||
          0
        ),

      recency:
        this.normalizeConfidence(
          recency
        ),

      salience:
        this.normalizeConfidence(
          node.salience ??
          this.defaultSalience(
            node,
            semanticType
          )
        ),

      grammaticalRole:
        node.grammaticalRole ||
        null,

      discourseRole:
        node.discourseRole ||
        null,

      number:
        node.number ||
        null,

      gender:
        node.gender ||
        null,

      speaker,

      confidence:
        this.normalizeConfidence(
          node.confidence ??
          0.7
        ),

      currentTurn:
        currentTurn === true,

      evidenceRefs:
        this.asArray(
          node.evidenceRefs
        ),

      raw:
        node
    };
  },

  extractNodeSurface(node = {}) {
    return this.clean(
      node.surface ||
      node.normalizedValue ||
      node.label ||
      node.value ||
      node.name ||
      node.proposition ||
      node.claim ||
      node.text ||
      node.evidence ||
      ""
    );
  },

  defaultSalience(
    node = {},
    semanticType = ""
  ) {
    if (
      node.grammaticalRole ===
      "subject"
    ) {
      return 0.82;
    }

    if (
      node.discourseRole ===
      "topic"
    ) {
      return 0.84;
    }

    if (
      semanticType ===
      "quantity"
    ) {
      return 0.76;
    }

    if (
      semanticType ===
      "option"
    ) {
      return 0.72;
    }

    return 0.62;
  },

  mergeCandidates(
    candidates = []
  ) {
    const merged =
      new Map();

    candidates
      .filter(candidate =>
        candidate &&
        candidate.semanticRef &&
        candidate.surface
      )
      .forEach(candidate => {
        const key =
          [
            candidate.semanticRef,
            candidate.semanticType
          ].join("|");

        if (!merged.has(key)) {
          merged.set(
            key,
            {
              ...candidate,

              sources: [
                candidate.sourceType
              ]
            }
          );

          return;
        }

        const existing =
          merged.get(key);

        existing.recency =
          Math.max(
            existing.recency ||
            0,
            candidate.recency ||
            0
          );

        existing.salience =
          Math.max(
            existing.salience ||
            0,
            candidate.salience ||
            0
          );

        existing.confidence =
          Math.max(
            existing.confidence ||
            0,
            candidate.confidence ||
            0
          );

        existing.turnDistance =
          Math.min(
            existing.turnDistance ??
            99,
            candidate.turnDistance ??
            99
          );

        existing.sources = [
          ...new Set([
            ...this.asArray(
              existing.sources
            ),

            candidate.sourceType
          ])
        ];

        existing.evidenceRefs = [
          ...new Set([
            ...this.asArray(
              existing.evidenceRefs
            ),

            ...this.asArray(
              candidate.evidenceRefs
            )
          ])
        ];
      });

    return [...merged.values()]
      .sort(
        (
          left,
          right
        ) =>
          this.baseCandidateScore(
            right
          ) -
          this.baseCandidateScore(
            left
          )
      )
      .slice(0, 64);
  },

  /* =====================================================
     REFERENCE RESOLUTION
  ===================================================== */

  resolveAllReferences({
    semanticStructure = {},
    threadContext = {},
    referenceCandidates = {},
    currentTurn = {}
  } = {}) {
    return this.asArray(
      semanticStructure.references
    ).map(reference =>
      this.resolveSingleReference({
        reference,
        semanticStructure,
        threadContext,
        candidates:
          referenceCandidates.items ||
          [],
        currentTurn
      })
    );
  },

  resolveSingleReference({
    reference = {},
    semanticStructure = {},
    threadContext = {},
    candidates = [],
    currentTurn = {}
  } = {}) {
    const eligibleCandidates =
      candidates.filter(candidate =>
        this.candidateEligible({
          reference,
          candidate,
          semanticStructure,
          threadContext
        })
      );

    const scoredCandidates =
      eligibleCandidates
        .map(candidate => ({
          ...candidate,

          score:
            this.scoreReferenceCandidate({
              reference,
              candidate,
              semanticStructure,
              threadContext,
              currentTurn
            }),

          scoreBreakdown:
            this.buildScoreBreakdown({
              reference,
              candidate,
              semanticStructure,
              threadContext,
              currentTurn
            })
        }))
        .sort(
          (
            left,
            right
          ) =>
            right.score -
            left.score
        );

    const best =
      scoredCandidates[0] ||
      null;

    const second =
      scoredCandidates[1] ||
      null;

    const decision =
      this.decideResolution({
        reference,
        best,
        second,
        scoredCandidates,
        currentTurn
      });

    return {
      referenceId:
        reference.id,

      surface:
        reference.surface,

      referenceType:
        reference.referenceType ||
        "reference",

      expectedTypes:
        this.asArray(
          reference.expectedTypes
        ),

      semanticRole:
        reference.semanticRole ||
        null,

      status:
        decision.status,

      resolvedTo:
        decision.resolvedTo,

      confidence:
        decision.confidence,

      score:
        decision.score,

      margin:
        decision.margin,

      reason:
        decision.reason,

      ambiguity:
        decision.ambiguity,

      candidates:
        scoredCandidates
          .slice(0, 8)
          .map(candidate => ({
            semanticRef:
              candidate.semanticRef,

            semanticType:
              candidate.semanticType,

            surface:
              candidate.surface,

            score:
              candidate.score,

            scoreBreakdown:
              candidate.scoreBreakdown,

            sourceType:
              candidate.sourceType,

            turnDistance:
              candidate.turnDistance,

            confidence:
              candidate.confidence
          })),

      evidenceRefs: [
        ...new Set([
          ...this.asArray(
            reference.evidenceRefs
          ),

          ...this.asArray(
            best?.evidenceRefs
          )
        ])
      ],

      authority:
        "reference_resolution_only"
    };
  },

  candidateEligible({
    reference = {},
    candidate = {}
  } = {}) {
    if (
      !candidate.semanticRef ||
      !candidate.surface
    ) {
      return false;
    }

    if (
      candidate.semanticRef ===
      reference.id
    ) {
      return false;
    }

    const expectedTypes =
      this.asArray(
        reference.expectedTypes
      )
        .map(value =>
          this.normalizeSemanticType(
            value
          )
        )
        .filter(Boolean);

    if (
      !expectedTypes.length
    ) {
      return true;
    }

    return expectedTypes.some(
      expectedType =>
        this.semanticTypesCompatible(
          expectedType,
          candidate.semanticType
        )
    );
  },

  semanticTypesCompatible(
    expectedType = "",
    candidateType = ""
  ) {
    const expected =
      this.normalizeSemanticType(
        expectedType
      );

    const candidate =
      this.normalizeSemanticType(
        candidateType
      );

    if (
      expected ===
      candidate
    ) {
      return true;
    }

    const compatibility = {
      person: [
        "person",
        "participant",
        "group"
      ],

      participant: [
        "person",
        "participant",
        "group",
        "organization"
      ],

      group: [
        "group",
        "organization",
        "participant"
      ],

      entity: [
        "person",
        "participant",
        "group",
        "organization",
        "location",
        "object",
        "artifact",
        "concept",
        "entity"
      ],

      physical_entity: [
        "object",
        "location",
        "artifact",
        "entity"
      ],

      measurement: [
        "quantity",
        "attribute"
      ],

      quantity: [
        "quantity",
        "attribute"
      ],

      event: [
        "event"
      ],

      claim: [
        "claim"
      ],

      option: [
        "option",
        "event",
        "entity",
        "claim"
      ],

      concept: [
        "concept",
        "claim",
        "event",
        "entity"
      ]
    };

    return this.asArray(
      compatibility[expected]
    ).includes(
      candidate
    );
  },

  scoreReferenceCandidate({
    reference = {},
    candidate = {},
    semanticStructure = {},
    threadContext = {},
    currentTurn = {}
  } = {}) {
    const breakdown =
      this.buildScoreBreakdown({
        reference,
        candidate,
        semanticStructure,
        threadContext,
        currentTurn
      });

    return this.roundScore(
      Object.values(
        breakdown
      ).reduce(
        (
          total,
          value
        ) =>
          total +
          Number(value || 0),
        0
      )
    );
  },

  buildScoreBreakdown({
    reference = {},
    candidate = {},
    semanticStructure = {},
    threadContext = {},
    currentTurn = {}
  } = {}) {
    return {
      typeCompatibility:
        this.scoreTypeCompatibility({
          reference,
          candidate
        }),

      recency:
        this.scoreRecency(
          candidate
        ),

      salience:
        Number(
          candidate.salience ||
          0
        ) * 18,

      candidateConfidence:
        Number(
          candidate.confidence ||
          0
        ) * 14,

      grammaticalCompatibility:
        this.scoreGrammaticalCompatibility({
          reference,
          candidate
        }),

      lexicalCompatibility:
        this.scoreLexicalCompatibility({
          reference,
          candidate,
          currentTurn
        }),

      discourseCompatibility:
        this.scoreDiscourseCompatibility({
          reference,
          candidate,
          semanticStructure,
          threadContext
        }),

      structuralCompatibility:
        this.scoreStructuralCompatibility({
          reference,
          candidate,
          semanticStructure
        }),

      sourceReliability:
        this.scoreSourceReliability(
          candidate
        ),

      stalePenalty:
        this.scoreStalePenalty({
          candidate,
          threadContext
        }),

      currentTurnSelfReferencePenalty:
        this.scoreCurrentTurnPenalty({
          reference,
          candidate
        })
    };
  },

  scoreTypeCompatibility({
    reference = {},
    candidate = {}
  } = {}) {
    const expectedTypes =
      this.asArray(
        reference.expectedTypes
      );

    if (
      !expectedTypes.length
    ) {
      return 10;
    }

    const exact =
      expectedTypes.some(
        expected =>
          this.normalizeSemanticType(
            expected
          ) ===
          this.normalizeSemanticType(
            candidate.semanticType
          )
      );

    if (exact) {
      return 24;
    }

    const compatible =
      expectedTypes.some(
        expected =>
          this.semanticTypesCompatible(
            expected,
            candidate.semanticType
          )
      );

    return compatible
      ? 16
      : -30;
  },

  scoreRecency(candidate = {}) {
    const distance =
      Number(
        candidate.turnDistance ||
        0
      );

    if (distance === 0) {
      return 16;
    }

    if (distance === 1) {
      return 14;
    }

    if (distance === 2) {
      return 10;
    }

    if (distance === 3) {
      return 6;
    }

    return Math.max(
      -8,
      4 -
      distance *
      2
    );
  },

  scoreGrammaticalCompatibility({
    reference = {},
    candidate = {}
  } = {}) {
    const surface =
      this.normalize(
        reference.surface
      );

    let score = 0;

    if (
      [
        "he",
        "him",
        "his",
        "she",
        "her",
        "hers"
      ].includes(surface)
    ) {
      if (
        [
          "person",
          "participant"
        ].includes(
          this.normalizeSemanticType(
            candidate.semanticType
          )
        )
      ) {
        score += 14;
      }

      if (
        candidate.number ===
        "plural"
      ) {
        score -= 12;
      }
    }

    if (
      [
        "they",
        "them",
        "their"
      ].includes(surface)
    ) {
      if (
        [
          "person",
          "participant",
          "group",
          "organization"
        ].includes(
          this.normalizeSemanticType(
            candidate.semanticType
          )
        )
      ) {
        score += 11;
      }
    }

    if (
      [
        "it",
        "its",
        "this",
        "that"
      ].includes(surface)
    ) {
      if (
        [
          "event",
          "claim",
          "quantity",
          "option",
          "object",
          "concept",
          "artifact",
          "attribute"
        ].includes(
          this.normalizeSemanticType(
            candidate.semanticType
          )
        )
      ) {
        score += 9;
      }
    }

    if (
      surface.includes(
        "amount"
      ) &&
      candidate.semanticType ===
        "quantity"
    ) {
      score += 18;
    }

    if (
      surface.includes(
        "option"
      ) &&
      candidate.semanticType ===
        "option"
    ) {
      score += 18;
    }

    if (
      surface.includes(
        "idea"
      ) &&
      [
        "claim",
        "concept"
      ].includes(
        candidate.semanticType
      )
    ) {
      score += 15;
    }

    if (
      surface.includes(
        "plan"
      ) &&
      [
        "event",
        "claim",
        "option"
      ].includes(
        candidate.semanticType
      )
    ) {
      score += 15;
    }

    return score;
  },

  scoreLexicalCompatibility({
    reference = {},
    candidate = {},
    currentTurn = {}
  } = {}) {
    const text =
      currentTurn.normalizedText ||
      "";

    const candidateValue =
      this.normalize(
        candidate.normalizedValue ||
        candidate.surface
      );

    let score = 0;

    if (
      candidateValue &&
      text.includes(
        candidateValue
      )
    ) {
      score += 6;
    }

    if (
      /\b(?:how big|how much|how many|amount|size|scale)\b/.test(
        text
      ) &&
      candidate.semanticType ===
        "quantity"
    ) {
      score += 22;
    }

    if (
      /\b(?:who|he|she|him|her|they|them)\b/.test(
        text
      ) &&
      [
        "person",
        "participant",
        "group"
      ].includes(
        candidate.semanticType
      )
    ) {
      score += 12;
    }

    if (
      /\b(?:which one|that one|same one|other one)\b/.test(
        text
      ) &&
      candidate.semanticType ===
        "option"
    ) {
      score += 16;
    }

    if (
      /\b(?:why did that|what caused that|because of that)\b/.test(
        text
      ) &&
      [
        "event",
        "claim"
      ].includes(
        candidate.semanticType
      )
    ) {
      score += 12;
    }

    return score;
  },

  scoreDiscourseCompatibility({
    reference = {},
    candidate = {},
    semanticStructure = {},
    threadContext = {}
  } = {}) {
    let score = 0;

    if (
      candidate.discourseRole ===
      "topic"
    ) {
      score += 12;
    }

    if (
      candidate.grammaticalRole ===
      "subject"
    ) {
      score += 8;
    }

    if (
      candidate.sourceType ===
      "previous_assistant_turn"
    ) {
      const referenceSurface =
        this.normalize(
          reference.surface
        );

      if (
        [
          "that",
          "this",
          "it",
          "that amount",
          "that idea"
        ].includes(
          referenceSurface
        )
      ) {
        score += 8;
      }
    }

    if (
      threadContext
        .continuitySignals
        ?.topicContinues ===
        true
    ) {
      score += 5;
    }

    if (
      this.asArray(
        semanticStructure
          .comparisonStructures
      ).length &&
      candidate.semanticType ===
        "quantity"
    ) {
      score += 8;
    }

    return score;
  },

  scoreStructuralCompatibility({
    reference = {},
    candidate = {},
    semanticStructure = {}
  } = {}) {
    let score = 0;

    const comparisons =
      this.asArray(
        semanticStructure
          .comparisonStructures
      );

    if (
      comparisons.some(
        comparison =>
          comparison.leftRef ===
            reference.id ||
          !comparison.leftRef
      )
    ) {
      if (
        comparisonCandidateCompatible(
          comparisons,
          candidate
        )
      ) {
        score += 16;
      }
    }

    const relations =
      this.asArray(
        semanticStructure.relations
      );

    if (
      relations.some(
        relation =>
          relation.sourceRef ===
            candidate.semanticRef ||
          relation.targetRef ===
            candidate.semanticRef
      )
    ) {
      score += 4;
    }

    return score;

    function comparisonCandidateCompatible(
      comparisonList = [],
      candidateNode = {}
    ) {
      const candidateTypes =
        comparisonList.flatMap(
          comparison =>
            comparison.candidateTypes ||
            []
        );

      if (
        !candidateTypes.length
      ) {
        return true;
      }

      if (
        candidateTypes.includes(
          "magnitude_analogy"
        )
      ) {
        return [
          "quantity",
          "attribute",
          "object"
        ].includes(
          candidateNode.semanticType
        );
      }

      if (
        candidateTypes.includes(
          "option_evaluation"
        )
      ) {
        return [
          "option",
          "event",
          "claim"
        ].includes(
          candidateNode.semanticType
        );
      }

      return true;
    }
  },

  scoreSourceReliability(
    candidate = {}
  ) {
    const sourceScores = {
      current_turn_entity:
        8,

      current_turn_event:
        8,

      current_turn_claim:
        8,

      current_turn_quantity:
        9,

      current_turn_option:
        8,

      thread_reference_candidate:
        8,

      previous_user_turn:
        7,

      previous_assistant_turn:
        7,

      recent_user_turn:
        5,

      recent_assistant_turn:
        5
    };

    return (
      sourceScores[
        candidate.sourceType
      ] ??
      3
    );
  },

  scoreStalePenalty({
    candidate = {},
    threadContext = {}
  } = {}) {
    const stale =
      this.asArray(
        threadContext.staleContext
      );

    const candidateIsStale =
      stale.some(item => {
        const staleRef =
          typeof item ===
            "string"
            ? item
            : (
                item.semanticRef ||
                item.id ||
                item.turnId
              );

        return (
          staleRef ===
            candidate.semanticRef ||
          staleRef ===
            candidate.turnId
        );
      });

    return candidateIsStale
      ? -35
      : 0;
  },

  scoreCurrentTurnPenalty({
    reference = {},
    candidate = {}
  } = {}) {
    if (
      candidate.currentTurn !==
      true
    ) {
      return 0;
    }

    const referenceSurface =
      this.normalize(
        reference.surface
      );

    if (
      [
        "that",
        "this",
        "it",
        "they",
        "them",
        "he",
        "she",
        "that amount",
        "that option"
      ].includes(
        referenceSurface
      )
    ) {
      return -5;
    }

    return 0;
  },

  decideResolution({
    reference = {},
    best = null,
    second = null,
    scoredCandidates = [],
    currentTurn = {}
  } = {}) {
    if (!best) {
      return {
        status:
          "unresolved",

        resolvedTo:
          null,

        confidence:
          0,

        score:
          0,

        margin:
          0,

        reason:
          "No compatible reference candidate was available.",

        ambiguity: {
          present:
            true,

          reason:
            "no_candidate",

          competingCandidates: []
        }
      };
    }

    const score =
      Number(
        best.score ||
        0
      );

    const secondScore =
      Number(
        second?.score ||
        0
      );

    const margin =
      score -
      secondScore;

    const threshold =
      this.resolutionThreshold({
        reference,
        currentTurn
      });

    const requiredMargin =
      this.requiredResolutionMargin({
        reference,
        currentTurn
      });

    if (
      score < threshold
    ) {
      return {
        status:
          "unresolved",

        resolvedTo:
          null,

        confidence:
          this.scoreToConfidence(
            score
          ),

        score,

        margin,

        reason:
          `Best candidate score ${score} did not meet the resolution threshold ${threshold}.`,

        ambiguity: {
          present:
            true,

          reason:
            "insufficient_score",

          competingCandidates:
            scoredCandidates
              .slice(0, 3)
              .map(candidate =>
                candidate.semanticRef
              )
        }
      };
    }

    if (
      second &&
      margin <
      requiredMargin
    ) {
      return {
        status:
          "ambiguous",

        resolvedTo:
          null,

        confidence:
          this.scoreToConfidence(
            score
          ),

        score,

        margin,

        reason:
          `The two strongest candidates were too close. Required margin: ${requiredMargin}; observed margin: ${margin}.`,

        ambiguity: {
          present:
            true,

          reason:
            "close_candidates",

          competingCandidates: [
            best.semanticRef,
            second.semanticRef
          ]
        }
      };
    }

    return {
      status:
        "resolved",

      resolvedTo:
        best.semanticRef,

      confidence:
        this.scoreToConfidence(
          score,
          margin
        ),

      score,

      margin,

      reason:
        this.buildResolutionReason({
          reference,
          best,
          margin
        }),

      ambiguity: {
        present:
          false,

        reason:
          null,

        competingCandidates: []
      }
    };
  },

  resolutionThreshold({
    reference = {},
    currentTurn = {}
  } = {}) {
    const type =
      this.normalize(
        reference.referenceType
      );

    if (
      type ===
      "pronoun"
    ) {
      return 54;
    }

    if (
      type ===
      "typed demonstrative"
    ) {
      return 48;
    }

    if (
      type ===
      "selection reference"
    ) {
      return 52;
    }

    if (
      currentTurn.wordCount <= 5
    ) {
      return 50;
    }

    return 46;
  },

  requiredResolutionMargin({
    reference = {}
  } = {}) {
    const surface =
      this.normalize(
        reference.surface
      );

    if (
      [
        "he",
        "him",
        "his",
        "she",
        "her",
        "hers"
      ].includes(surface)
    ) {
      return 10;
    }

    if (
      [
        "they",
        "them",
        "their"
      ].includes(surface)
    ) {
      return 12;
    }

    if (
      [
        "this",
        "that",
        "it"
      ].includes(surface)
    ) {
      return 8;
    }

    if (
      surface.includes(
        "amount"
      ) ||
      surface.includes(
        "option"
      )
    ) {
      return 6;
    }

    return 8;
  },

  buildResolutionReason({
    reference = {},
    best = {},
    margin = 0
  } = {}) {
    return [
      `"${reference.surface}" resolved to "${best.surface}".`,
      `Semantic type: ${best.semanticType}.`,
      `Source: ${best.sourceType}.`,
      `Turn distance: ${best.turnDistance}.`,
      `Winning margin: ${this.roundScore(margin)}.`
    ].join(" ");
  },

  scoreToConfidence(
    score = 0,
    margin = 0
  ) {
    let confidence =
      0.45 +
      Math.min(
        0.38,
        Number(score || 0) /
        200
      ) +
      Math.min(
        0.12,
        Number(margin || 0) /
        100
      );

    confidence =
      Math.max(
        0,
        Math.min(
          0.97,
          confidence
        )
      );

    return Number(
      confidence.toFixed(3)
    );
  },

  baseCandidateScore(
    candidate = {}
  ) {
    return (
      Number(
        candidate.recency ||
        0
      ) *
      30 +
      Number(
        candidate.salience ||
        0
      ) *
      30 +
      Number(
        candidate.confidence ||
        0
      ) *
      25 -
      Number(
        candidate.turnDistance ||
        0
      ) *
      3
    );
  },

  /* =====================================================
     APPLY RESOLUTIONS
  ===================================================== */

  applyResolutions({
    semanticStructure = {},
    referenceDecisions = []
  } = {}) {
    const decisionsById =
      new Map(
        referenceDecisions.map(
          decision => [
            decision.referenceId,
            decision
          ]
        )
      );

    const resolvedReferences =
      this.asArray(
        semanticStructure.references
      ).map(reference => {
        const decision =
          decisionsById.get(
            reference.id
          );

        if (!decision) {
          return {
            ...reference,

            resolved:
              false,

            resolvedTo:
              null
          };
        }

        return {
          ...reference,

          resolved:
            decision.status ===
            "resolved",

          resolvedTo:
            decision.resolvedTo,

          resolutionStatus:
            decision.status,

          resolutionConfidence:
            decision.confidence,

          resolutionScore:
            decision.score,

          resolutionMargin:
            decision.margin,

          resolutionReason:
            decision.reason,

          candidateRefs:
            decision.candidates.map(
              candidate =>
                candidate.semanticRef
            )
        };
      });

    const unresolvedReferenceIds =
      resolvedReferences
        .filter(reference =>
          reference.resolved !==
          true
        )
        .map(reference =>
          reference.id
        );

    const inheritedNodes =
      this.buildInheritedNodes({
        semanticStructure,
        referenceDecisions
      });

    return {
      ...semanticStructure,

      schema:
        "ari_resolved_semantic_structure",

      version:
        this.schemaVersion,

      source:
        "ari-entity-reference-resolver",

      references:
        resolvedReferences,

      inheritedNodes,

      unresolved:
        [
          ...this.asArray(
            semanticStructure.unresolved
          ).filter(item =>
            !(
              item.type ===
                "reference" &&
              !unresolvedReferenceIds.includes(
                item.semanticRef
              )
            )
          ),

          ...unresolvedReferenceIds
            .filter(referenceId =>
              !this.asArray(
                semanticStructure.unresolved
              ).some(item =>
                item.type ===
                  "reference" &&
                item.semanticRef ===
                  referenceId
              )
            )
            .map(referenceId => ({
              id:
                this.createStableId(
                  "unresolved",
                  referenceId
                ),

              type:
                "reference",

              semanticRef:
                referenceId,

              requiredForMeaning:
                true,

              source:
                "ari-entity-reference-resolver"
            }))
        ],

      referenceResolutionApplied:
        true,

      referenceResolutionVersion:
        this.version,

      authority: {
        ...(
          semanticStructure.authority ||
          {}
        ),

        canResolvePriorReferences:
          true,

        canChooseRequestedOperation:
          false,

        canChooseCanonicalMeaning:
          false,

        canChooseFrame:
          false,

        canChooseRoute:
          false,

        canAnswerUser:
          false,

        role:
          "semantic_structure_with_reference_resolution"
      }
    };
  },

  buildInheritedNodes({
    referenceDecisions = []
  } = {}) {
    const nodes =
      new Map();

    referenceDecisions
      .filter(
        decision =>
          decision.status ===
          "resolved"
      )
      .forEach(decision => {
        const winner =
          decision.candidates.find(
            candidate =>
              candidate.semanticRef ===
              decision.resolvedTo
          );

        if (
          !winner ||
          winner.turnDistance ===
          0
        ) {
          return;
        }

        if (
          nodes.has(
            winner.semanticRef
          )
        ) {
          return;
        }

        nodes.set(
          winner.semanticRef,
          {
            semanticRef:
              winner.semanticRef,

            semanticType:
              winner.semanticType,

            surface:
              winner.surface,

            sourceType:
              winner.sourceType,

            turnDistance:
              winner.turnDistance,

            confidence:
              winner.confidence,

            inheritedBecauseOfReferences: [
              decision.referenceId
            ]
          }
        );
      });

    return [...nodes.values()];
  },

  /* =====================================================
     RESOLUTION GRAPH
  ===================================================== */

  buildResolutionGraph({
    referenceDecisions = [],
    referenceCandidates = {}
  } = {}) {
    const nodes = [
      ...referenceDecisions.map(
        decision => ({
          id:
            decision.referenceId,

          nodeType:
            "reference",

          surface:
            decision.surface,

          status:
            decision.status
        })
      ),

      ...this.asArray(
        referenceCandidates.items
      ).map(candidate => ({
        id:
          candidate.semanticRef,

        nodeType:
          candidate.semanticType,

        surface:
          candidate.surface,

        sourceType:
          candidate.sourceType,

        turnDistance:
          candidate.turnDistance
      }))
    ];

    const edges =
      referenceDecisions.flatMap(
        decision =>
          decision.candidates.map(
            candidate => ({
              id:
                this.createStableId(
                  "resolution_edge",
                  [
                    decision.referenceId,
                    candidate.semanticRef
                  ].join("|")
                ),

              edgeType:
                decision.resolvedTo ===
                  candidate.semanticRef
                  ? "resolved_to"
                  : "candidate_for",

              sourceRef:
                decision.referenceId,

              targetRef:
                candidate.semanticRef,

              score:
                candidate.score,

              selected:
                decision.resolvedTo ===
                candidate.semanticRef
            })
          )
      );

    return {
      nodes:
        this.dedupeById(
          nodes
        ),

      edges:
        this.dedupeById(
          edges
        )
    };
  },

  /* =====================================================
     QUALITY
  ===================================================== */

  buildQualityReport({
    semanticStructure = {},
    threadContext = {},
    referenceDecisions = [],
    referenceCandidates = {}
  } = {}) {
    const referenceCount =
      this.asArray(
        semanticStructure.references
      ).length;

    const resolvedCount =
      referenceDecisions.filter(
        decision =>
          decision.status ===
          "resolved"
      ).length;

    const ambiguousCount =
      referenceDecisions.filter(
        decision =>
          decision.status ===
          "ambiguous"
      ).length;

    const unresolvedCount =
      referenceDecisions.filter(
        decision =>
          decision.status ===
          "unresolved"
      ).length;

    const warnings = [];

    if (
      semanticStructure.ran ===
      false
    ) {
      warnings.push({
        type:
          "semantic_structure_missing",

        message:
          "Canonical semantic structure was unavailable."
      });
    }

    if (
      referenceCount > 0 &&
      threadContext.ran ===
        false &&
      referenceCandidates
        .priorTurnCandidateCount ===
        0
    ) {
      warnings.push({
        type:
          "thread_context_missing",

        message:
          "References were present, but no canonical prior-turn context was available."
      });
    }

    if (
      ambiguousCount > 0
    ) {
      warnings.push({
        type:
          "ambiguous_references",

        count:
          ambiguousCount,

        message:
          "One or more references had multiple similarly strong candidates."
      });
    }

    if (
      unresolvedCount > 0
    ) {
      warnings.push({
        type:
          "unresolved_references",

        count:
          unresolvedCount,

        message:
          "One or more references could not be safely resolved."
      });
    }

    const accuracyConfidence =
      referenceCount
        ? this.normalizeConfidence(
            (
              resolvedCount *
              1 +
              ambiguousCount *
              0.35
            ) /
            referenceCount
          )
        : 1;

    return {
      referenceCount,
      resolvedCount,
      ambiguousCount,
      unresolvedCount,

      resolutionRate:
        referenceCount
          ? Number(
              (
                resolvedCount /
                referenceCount
              ).toFixed(3)
            )
          : 1,

      accuracyConfidence,

      candidateCount:
        this.asArray(
          referenceCandidates.items
        ).length,

      warnings,

      healthy:
        warnings.length ===
          0 ||
        (
          resolvedCount > 0 &&
          ambiguousCount ===
            0
        )
    };
  },

  /* =====================================================
     CANONICAL OUTPUT
  ===================================================== */

  buildCanonicalResolution({
    currentTurn = {},
    semanticStructure = {},
    resolvedSemanticStructure = {},
    threadContext = {},
    referenceCandidates = {},
    referenceDecisions = [],
    resolvedReferences = [],
    unresolvedReferences = [],
    resolutionGraph = {},
    quality = {}
  } = {}) {
    return {
      schema:
        "ari_reference_resolution",

      version:
        this.schemaVersion,

      engineVersion:
        this.version,

      source:
        "ari-entity-reference-resolver",

      ran:
        true,

      turnId:
        currentTurn.turnId,

      currentTurn,

      input: {
        semanticStructureVersion:
          semanticStructure.version ||
          null,

        threadContextVersion:
          threadContext.version ||
          null,

        referenceCount:
          this.asArray(
            semanticStructure.references
          ).length,

        candidateCount:
          this.asArray(
            referenceCandidates.items
          ).length
      },

      decisions:
        referenceDecisions,

      resolvedReferences,

      unresolvedReferences,

      resolvedSemanticStructure,

      resolutionGraph,

      quality,

      confidence:
        quality.accuracyConfidence,

      evidenceRefs: [
        ...new Set([
          ...this.asArray(
            semanticStructure.evidenceRefs
          ),

          ...this.asArray(
            threadContext.evidenceRefs
          ),

          ...referenceDecisions.flatMap(
            decision =>
              decision.evidenceRefs ||
              []
          )
        ])
      ],

      authority: {
        canResolveReferences:
          true,

        canRankReferenceCandidates:
          true,

        canLeaveAmbiguousReferencesUnresolved:
          true,

        canBuildActiveProblem:
          false,

        canInferUserIntent:
          false,

        canChooseRequestedOperation:
          false,

        canChooseCanonicalMeaning:
          false,

        canChooseSemanticFrame:
          false,

        canChooseRoute:
          false,

        canChoosePlanner:
          false,

        canAnswerUser:
          false,

        role:
          "canonical_reference_resolution_only"
      }
    };
  },

  /* =====================================================
     RETURN PAYLOAD
  ===================================================== */

    buildReturnPayload({
    referenceResolution = {},
    resolvedSemanticStructure = {},
    resolvedReferences = [],
    unresolvedReferences = [],
    referenceCandidates = {},
    quality = {}
  } = {}) {
    const referenceDecisions =
      this.asArray(
        referenceResolution.decisions
      );

    const referenceCount =
      Number(
        quality.referenceCount ??
        referenceDecisions.length
      );

    const resolvedCount =
      Number(
        quality.resolvedCount ??
        resolvedReferences.length
      );

    const ambiguousCount =
      Number(
        quality.ambiguousCount ??
        referenceDecisions.filter(
          decision =>
            decision.status ===
            "ambiguous"
        ).length
      );

    const unresolvedCount =
      Number(
        quality.unresolvedCount ??
        unresolvedReferences.length
      );

    /*
     * A zero-reference result is a successful resolution pass.
     * "Complete" means the resolver completed its work, not that
     * every detected reference was resolvable.
     */
    const referencePacket = {
      schema:
        "ari_reference_packet",

      schemaVersion:
        this.schemaVersion,

      version:
        this.version,

      source:
        "ari-entity-reference-resolver",

      packetId:
        this.createStableId(
          "reference_packet",
          [
            referenceResolution.turnId,
            referenceCount,
            resolvedCount,
            ambiguousCount,
            unresolvedCount
          ].join("|")
        ),

      ready:
        true,

      complete:
        true,

      ran:
        true,

      turnId:
        referenceResolution.turnId ||
        null,

      referencesDetected:
        referenceCount >
        0,

      referenceCount,

      resolvedCount,

      ambiguousCount,

      unresolvedCount,

      references:
        referenceDecisions,

      decisions:
        referenceDecisions,

      resolutions:
        resolvedReferences,

      resolvedReferences,

      unresolvedReferences,

      candidates:
        referenceCandidates.items ||
        [],

      resolutionGraph:
        referenceResolution
          .resolutionGraph ||
        {
          nodes: [],
          edges: []
        },

      confidence:
        referenceResolution.confidence ??
        quality.accuracyConfidence ??
        1,

      quality,

      warnings:
        quality.warnings ||
        [],

      errors:
        [],

      authority: {
        canPreserveReferenceEvidence:
          true,

        canReportResolutionStatus:
          true,

        canResolveReferences:
          true,

        canChooseIntent:
          false,

        canChooseMeaning:
          false,

        canChooseRoute:
          false,

        canAnswerUser:
          false,

        role:
          "canonical_reference_packet"
      }
    };

    return {
      /*
       * Canonical contract consumed by AriPerceptionPipeline.
       */
      referenceResolverRan:
        true,

      referenceResolverReady:
        referencePacket.ready ===
        true,

      referenceResolverVersion:
        this.version,

      referenceResolverSource:
        "ari-entity-reference-resolver",

      source:
        "ari-entity-reference-resolver",

      resolverRan:
        true,

      referencePacket,

      referenceDecisions,

      resolutions:
        resolvedReferences,

      referencesDetected:
        referenceCount >
        0,

      referenceCount,

      resolvedReferenceCount:
        resolvedCount,

      ambiguousReferenceCount:
        ambiguousCount,

      unresolvedReferenceCount:
        unresolvedCount,

      errors:
        [],

      warnings:
        quality.warnings ||
        [],

      /*
       * Existing resolver output.
       */
      entityReferenceResolverRan:
        true,

      entityReferenceResolverVersion:
        this.version,

      entityReferenceResolverSource:
        "ari-entity-reference-resolver",

      referenceResolutionRan:
        true,

      referenceResolutionVersion:
        this.version,

      referenceResolutionSource:
        "ari-entity-reference-resolver",

      referenceResolution,

      resolvedSemanticStructure,

      currentSemanticStructure:
        resolvedSemanticStructure,

      resolvedReferences,

      unresolvedReferences,

      referenceCandidates:
        referenceCandidates.items ||
        [],

      referenceResolutionGraph:
        referenceResolution
          .resolutionGraph,

      referenceResolutionQuality:
        quality,

      activeReference:
        resolvedReferences[0] ||
        unresolvedReferences[0] ||
        null,

      confidence:
        referenceResolution.confidence,

      /*
       * Temporary compatibility aliases.
       */
      entityReferenceState:
        referenceResolution,

      subjectGraphState:
        referenceResolution,

      subjectGraphRan:
        true,

      subjectGraphVersion:
        this.version,

      subjectGraphSource:
        "ari-entity-reference-resolver",

      activeSubjects:
        [],

      activeEntities:
        resolvedSemanticStructure
          .entities ||
        [],

      activeSubject:
        null,

      activeEntity:
        null,

      activeProblem:
        null,

      activeIssue:
        null,

      resolvedActor:
        null,

      resolvedAction:
        null,

      resolvedIssue:
        null,

      resolvedPressure:
        null,

      resolvedDecision:
        null,

      resolvedConsequence:
        null,

      groundedContext:
        null,

      authority:
        "canonical_reference_resolution_only"
    };
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  normalizeSemanticType(
    value = ""
  ) {
    const type =
      this.normalize(value)
        .replace(/\s+/g, "_");

    const map = {
      people:
        "person",

      human:
        "person",

      participant:
        "participant",

      actor:
        "participant",

      organization:
        "organization",

      organisation:
        "organization",

      place:
        "location",

      thing:
        "object",

      physical_object:
        "object",

      physical_entity:
        "physical_entity",

      measurement:
        "measurement",

      number:
        "quantity",

      amount:
        "quantity",

      proposition:
        "claim",

      statement:
        "claim",

      action:
        "event",

      activity:
        "event",

      choice:
        "option",

      decision_option:
        "option",

      file:
        "artifact",

      code:
        "artifact",

      topic:
        "concept",

      issue:
        "concept"
    };

    return map[type] ||
      type ||
      "entity";
  },

  groupBy(
    items = [],
    field = "semanticType"
  ) {
    return this.asArray(items)
      .reduce(
        (
          groups,
          item
        ) => {
          const key =
            item?.[field] ??
            "unknown";

          groups[key] =
            groups[key] ||
            [];

          groups[key].push(
            item
          );

          return groups;
        },
        {}
      );
  },

  dedupeById(items = []) {
    const seen =
      new Set();

    return this.asArray(items)
      .filter(item => {
        if (!item?.id) {
          return false;
        }

        if (
          seen.has(item.id)
        ) {
          return false;
        }

        seen.add(item.id);

        return true;
      });
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

  roundScore(value = 0) {
    return Number(
      Number(
        value ||
        0
      ).toFixed(3)
    );
  },

  createStableId(
    prefix = "id",
    value = ""
  ) {
    return [
      prefix,
      this.hashString(
        String(value || "")
      )
    ].join("_");
  },

  hashString(value = "") {
    let hash =
      2166136261;

    const text =
      String(value || "");

    for (
      let index = 0;
      index <
      text.length;
      index += 1
    ) {
      hash ^=
        text.charCodeAt(
          index
        );

      hash +=
        (
          hash << 1
        ) +
        (
          hash << 4
        ) +
        (
          hash << 7
        ) +
        (
          hash << 8
        ) +
        (
          hash << 24
        );
    }

    return (
      hash >>> 0
    ).toString(36);
  },

  clean(value = "") {
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
    return this.clean(value)
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

window.Ari.entityReferenceResolver =
  window.AriEntityReferenceResolver;

console.log(
  "ARI ENTITY & REFERENCE RESOLVER LOADED:",
  window.AriEntityReferenceResolver?.version
);