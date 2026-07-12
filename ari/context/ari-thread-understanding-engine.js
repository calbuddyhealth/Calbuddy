// ari/context/ari-thread-understanding-engine.js
// Ari Thread Understanding Engine
// Purpose: Build the canonical semantic structure of the current user turn.
// V6.0.0 — Semantic Structure Only / No Intent / No Frame / No Planning Authority

window.Ari = window.Ari || {};

window.AriThreadUnderstandingEngine = {
  version: "6.0.0",
  schemaVersion: "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  understand(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const currentTurn =
      this.buildCurrentTurn(summary);

    const observationSchema =
      this.readObservationSchema(summary);

    const threadContext =
      this.readThreadContext(summary);

    const evidenceIndex =
      this.buildEvidenceIndex({
        currentTurn,
        observationSchema
      });

    const participants =
      this.buildParticipants({
        currentTurn,
        evidenceIndex
      });

    const entities =
      this.buildEntities({
        currentTurn,
        evidenceIndex
      });

    const events =
      this.buildEvents({
        currentTurn,
        evidenceIndex,
        entities,
        participants
      });

    const claims =
      this.buildClaims({
        currentTurn,
        evidenceIndex,
        entities,
        events,
        participants
      });

    const attributes =
      this.buildAttributes({
        currentTurn,
        evidenceIndex,
        entities,
        claims
      });

    const quantities =
      this.buildQuantities({
        currentTurn,
        evidenceIndex,
        entities,
        claims
      });

    const relations =
      this.buildRelations({
        currentTurn,
        evidenceIndex,
        entities,
        events,
        claims,
        attributes,
        quantities
      });

    const references =
      this.buildReferences({
        currentTurn,
        evidenceIndex,
        threadContext
      });

    const negations =
      this.buildNegations({
        currentTurn,
        evidenceIndex,
        claims,
        events
      });

    const discourseSignals =
      this.buildDiscourseSignals({
        currentTurn,
        evidenceIndex
      });

    const emotionalSignals =
      this.buildEmotionalSignals({
        currentTurn,
        evidenceIndex,
        entities,
        participants
      });

    const options =
      this.buildOptions({
        currentTurn,
        evidenceIndex,
        entities,
        events,
        claims
      });

    const criteria =
      this.buildCriteria({
        currentTurn,
        evidenceIndex
      });

    const constraints =
      this.buildConstraints({
        currentTurn,
        evidenceIndex,
        entities,
        events,
        claims,
        quantities
      });

    const stakes =
      this.buildStakes({
        currentTurn,
        evidenceIndex,
        entities,
        events,
        claims
      });

    const comparisonStructures =
      this.buildComparisonStructures({
        currentTurn,
        evidenceIndex,
        entities,
        events,
        claims,
        quantities,
        options,
        references
      });

    const unresolved =
      this.buildUnresolvedStructure({
        currentTurn,
        entities,
        events,
        claims,
        quantities,
        references,
        comparisonStructures
      });

    const structuralGraph =
      this.buildStructuralGraph({
        participants,
        entities,
        events,
        claims,
        attributes,
        quantities,
        relations,
        references,
        options,
        criteria,
        constraints,
        stakes
      });

    const semanticStructure =
      this.buildSemanticStructure({
        currentTurn,
        observationSchema,
        threadContext,
        evidenceIndex,
        participants,
        entities,
        events,
        claims,
        attributes,
        quantities,
        relations,
        references,
        negations,
        discourseSignals,
        emotionalSignals,
        options,
        criteria,
        constraints,
        stakes,
        comparisonStructures,
        structuralGraph,
        unresolved
      });

    window.Ari.semanticStructure =
      semanticStructure;

    window.Ari.threadUnderstanding = {
      threadUnderstandingRan: true,
      threadUnderstandingVersion:
        this.version,

      source:
        "ari-thread-understanding-engine",

      semanticStructure,

      authority:
        "semantic_structure_only"
    };

    return this.buildReturnPayload({
      semanticStructure,
      currentTurn,
      threadContext
    });
  },

  /* =====================================================
     INPUT READING
  ===================================================== */

  buildCurrentTurn(summary = {}) {
    const rawText =
      this.clean(
        summary.userMessage ||
        summary.message ||
        summary.input ||
        summary.normalizedMessage ||
        ""
      );

    return {
      turnId:
        summary.currentTurnId ||
        summary.turnId ||
        summary.threadContext
          ?.currentTurn
          ?.turnId ||
        this.createStableId(
          "turn",
          rawText
        ),

      speaker:
        "user",

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

  readObservationSchema(summary = {}) {
    const candidates = [
      summary.observationSchema,
      summary.canonicalObservationSchema,
      summary.canonicalObservationLedger,
      summary.observationLedger,
      summary.observerEvidence,
      summary.perceptionPacket
        ?.observationSchema,
      summary.perceptionPacket
        ?.observationLedger
    ];

    const found =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object"
      );

    if (!found) {
      return {
        schema:
          "ari_observation",

        version:
          null,

        source:
          "not_available",

        ran:
          false,

        turn: {
          rawText:
            this.clean(
              summary.userMessage ||
              summary.message ||
              summary.input ||
              ""
            )
        },

        entities: [],
        participants: [],
        events: [],
        claims: [],
        attributes: [],
        quantities: [],
        relations: [],
        references: [],
        negations: [],
        discourseSignals: [],
        emotionalSignals: [],
        comparisonSignals: [],
        questionSignals: [],
        actionSignals: [],
        evidenceRefs: []
      };
    }

    return this.normalizeObservationSchema(
      found
    );
  },

  normalizeObservationSchema(
    schema = {}
  ) {
    const ledgerItems =
      Array.isArray(schema.items)
        ? schema.items
        : Array.isArray(schema.observations)
          ? schema.observations
          : [];

    return {
      ...schema,

      entities:
        this.asArray(
          schema.entities
        ),

      participants:
        this.asArray(
          schema.participants
        ),

      events:
        this.asArray(
          schema.events
        ),

      claims:
        this.asArray(
          schema.claims
        ),

      attributes:
        this.asArray(
          schema.attributes
        ),

      quantities:
        this.asArray(
          schema.quantities
        ),

      relations:
        this.asArray(
          schema.relations
        ),

      references:
        this.asArray(
          schema.references
        ),

      negations:
        this.asArray(
          schema.negations
        ),

      discourseSignals:
        this.asArray(
          schema.discourseSignals
        ),

      emotionalSignals:
        this.asArray(
          schema.emotionalSignals
        ),

      comparisonSignals:
        this.asArray(
          schema.comparisonSignals
        ),

      questionSignals:
        this.asArray(
          schema.questionSignals
        ),

      actionSignals:
        this.asArray(
          schema.actionSignals
        ),

      ledgerItems
    };
  },

  readThreadContext(summary = {}) {
    const candidates = [
      summary.threadContext,
      summary.currentThreadContext,
      summary.continuityState
        ?.threadContext,
      summary.threadState
        ?.threadContext,
      window.Ari.threadContext
    ];

    const found =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object"
      );

    return found || {
      schema:
        "ari_thread_context",

      version:
        null,

      source:
        "not_available",

      ran:
        false,

      currentTurn:
        null,

      immediatePreviousUserTurn:
        null,

      immediatePreviousAssistantTurn:
        null,

      recentTurns: [],
      referenceCandidates: [],
      continuitySignals: {},
      staleContext: []
    };
  },

  /* =====================================================
     EVIDENCE INDEX
  ===================================================== */

  buildEvidenceIndex({
    currentTurn = {},
    observationSchema = {}
  } = {}) {
    const allItems = [
      ...this.tagEvidence(
        observationSchema.entities,
        "entity"
      ),

      ...this.tagEvidence(
        observationSchema.participants,
        "participant"
      ),

      ...this.tagEvidence(
        observationSchema.events,
        "event"
      ),

      ...this.tagEvidence(
        observationSchema.claims,
        "claim"
      ),

      ...this.tagEvidence(
        observationSchema.attributes,
        "attribute"
      ),

      ...this.tagEvidence(
        observationSchema.quantities,
        "quantity"
      ),

      ...this.tagEvidence(
        observationSchema.relations,
        "relation"
      ),

      ...this.tagEvidence(
        observationSchema.references,
        "reference"
      ),

      ...this.tagEvidence(
        observationSchema.negations,
        "negation"
      ),

      ...this.tagEvidence(
        observationSchema.discourseSignals,
        "discourse_signal"
      ),

      ...this.tagEvidence(
        observationSchema.emotionalSignals,
        "emotional_signal"
      ),

      ...this.tagEvidence(
        observationSchema.comparisonSignals,
        "comparison_signal"
      ),

      ...this.tagEvidence(
        observationSchema.questionSignals,
        "question_signal"
      ),

      ...this.tagEvidence(
        observationSchema.actionSignals,
        "action_signal"
      ),

      ...this.tagLegacyLedgerItems(
        observationSchema.ledgerItems
      )
    ];

    const normalized =
      allItems.map(
        (
          item,
          index
        ) => ({
          id:
            item.id ||
            item.observationId ||
            this.createStableId(
              "evidence",
              [
                item.semanticClass,
                item.surface,
                item.value,
                index
              ].join("|")
            ),

          semanticClass:
            item.semanticClass ||
            "unknown",

          type:
            this.normalize(
              item.type ||
              item.category ||
              item.semanticClass ||
              ""
            ),

          surface:
            this.clean(
              item.surface ||
              item.evidence ||
              item.text ||
              item.claim ||
              item.proposition ||
              ""
            ),

          value:
            item.value ??
            item.normalizedValue ??
            item.numericValue ??
            item.label ??
            null,

          confidence:
            this.normalizeConfidence(
              item.confidence ??
              0.65
            ),

          startIndex:
            Number.isFinite(
              Number(item.startIndex)
            )
              ? Number(item.startIndex)
              : null,

          endIndex:
            Number.isFinite(
              Number(item.endIndex)
            )
              ? Number(item.endIndex)
              : null,

          raw:
            item
        })
      );

    return {
      turnId:
        currentTurn.turnId,

      items:
        normalized,

      byClass:
        this.groupBy(
          normalized,
          "semanticClass"
        ),

      evidenceRefs:
        normalized
          .map(item =>
            item.id
          )
          .filter(Boolean)
    };
  },

  tagEvidence(
    items = [],
    semanticClass = "unknown"
  ) {
    return this.asArray(items)
      .map(item => ({
        ...(
          typeof item === "object"
            ? item
            : {
                value:
                  item
              }
        ),

        semanticClass
      }));
  },

  tagLegacyLedgerItems(
    items = []
  ) {
    return this.asArray(items)
      .map(item => ({
        ...(
          typeof item === "object"
            ? item
            : {
                value:
                  item
              }
        ),

        semanticClass:
          this.mapLegacyEvidenceClass(
            item
          )
      }));
  },

  mapLegacyEvidenceClass(item = {}) {
    const type =
      this.normalize(
        item.type ||
        item.category ||
        item.domain ||
        ""
      );

    if (
      type.includes("entity") ||
      type.includes("subject") ||
      type.includes("person") ||
      type.includes("object")
    ) {
      return "entity";
    }

    if (
      type.includes("event") ||
      type.includes("action")
    ) {
      return "event";
    }

    if (
      type.includes("claim") ||
      type.includes("fact") ||
      type.includes("statement")
    ) {
      return "claim";
    }

    if (
      type.includes("quantity") ||
      type.includes("number") ||
      type.includes("measurement")
    ) {
      return "quantity";
    }

    if (
      type.includes("reference") ||
      type.includes("pronoun")
    ) {
      return "reference";
    }

    if (
      type.includes("emotion")
    ) {
      return "emotional_signal";
    }

    if (
      type.includes("negation")
    ) {
      return "negation";
    }

    if (
      type.includes("comparison")
    ) {
      return "comparison_signal";
    }

    if (
      type.includes("question")
    ) {
      return "question_signal";
    }

    if (
      type.includes("constraint")
    ) {
      return "constraint";
    }

    return "unknown";
  },

  /* =====================================================
     PARTICIPANTS
  ===================================================== */

  buildParticipants({
    currentTurn = {},
    evidenceIndex = {}
  } = {}) {
    const observed =
      evidenceIndex.byClass
        ?.participant ||
      [];

    const mentionedParticipants =
      observed
        .filter(item =>
          ![
            "speaker",
            "addressee"
          ].includes(
            this.normalize(
              item.raw?.role
            )
          )
        )
        .map(item => ({
          id:
            item.raw?.id ||
            item.id,

          role:
            item.raw?.role ||
            "mentioned_participant",

          entityId:
            item.raw?.entityId ||
            item.raw?.entityRef ||
            null,

          surface:
            item.surface ||
            this.clean(item.value),

          confidence:
            item.confidence,

          evidenceRefs: [
            item.id
          ]
        }));

    return {
      speaker: {
        entityRef:
          "user",

        confidence:
          1,

        evidenceRefs: [
          currentTurn.turnId
        ]
      },

      addressee: {
        entityRef:
          "assistant",

        confidence:
          1,

        evidenceRefs: [
          currentTurn.turnId
        ]
      },

      mentionedParticipants:
        this.dedupeBySemanticValue(
          mentionedParticipants
        )
    };
  },

  /* =====================================================
     ENTITIES
  ===================================================== */

  buildEntities({
    currentTurn = {},
    evidenceIndex = {}
  } = {}) {
    const observed =
      evidenceIndex.byClass
        ?.entity ||
      [];

    const entities =
      observed.map(
        (
          item,
          index
        ) => {
          const raw =
            item.raw ||
            {};

          const surface =
            this.clean(
              raw.surface ||
              item.surface ||
              raw.evidence ||
              raw.label ||
              raw.value ||
              ""
            );

          const normalizedValue =
            this.normalize(
              raw.normalizedValue ||
              raw.value ||
              raw.label ||
              surface
            );

          return {
            id:
              raw.id ||
              this.createStableId(
                "entity",
                [
                  currentTurn.turnId,
                  normalizedValue,
                  index
                ].join("|")
              ),

            surface,

            normalizedValue,

            entityType:
              raw.entityType ||
              raw.kind ||
              this.normalizeEntityType(
                raw.type ||
                raw.category
              ),

            subtype:
              raw.subtype ||
              raw.attributes
                ?.roleClass ||
              null,

            grammaticalRole:
              raw.grammaticalRole ||
              raw.role ||
              null,

            number:
              raw.number ||
              this.inferNumber(
                surface
              ),

            gender:
              raw.gender ||
              null,

            startIndex:
              item.startIndex,

            endIndex:
              item.endIndex,

            origin:
              raw.origin ||
              "observed",

            confidence:
              item.confidence,

            evidenceRefs: [
              item.id
            ]
          };
        }
      );

    this.addImplicitCoreEntities(
      entities,
      currentTurn
    );

    return this.dedupeBySemanticValue(
      entities
    );
  },

  addImplicitCoreEntities(
    entities = [],
    currentTurn = {}
  ) {
    const text =
      currentTurn.normalizedText ||
      "";

    if (
      /\b(?:i|me|my|myself)\b/.test(
        text
      )
    ) {
      entities.push({
        id:
          "entity_user",

        surface:
          "I",

        normalizedValue:
          "user",

        entityType:
          "person",

        subtype:
          "speaker",

        grammaticalRole:
          "subject",

        number:
          "singular",

        gender:
          null,

        startIndex:
          null,

        endIndex:
          null,

        origin:
          "explicit",

        confidence:
          0.95,

        evidenceRefs: [
          currentTurn.turnId
        ]
      });
    }

    if (
      /\b(?:you|your|yourself)\b/.test(
        text
      )
    ) {
      entities.push({
        id:
          "entity_assistant",

        surface:
          "you",

        normalizedValue:
          "assistant",

        entityType:
          "agent",

        subtype:
          "addressee",

        grammaticalRole:
          "addressee",

        number:
          "singular",

        gender:
          null,

        startIndex:
          null,

        endIndex:
          null,

        origin:
          "explicit",

        confidence:
          0.95,

        evidenceRefs: [
          currentTurn.turnId
        ]
      });
    }
  },

  normalizeEntityType(value = "") {
    const type =
      this.normalize(value);

    const map = {
      person:
        "person",

      participant:
        "person",

      people:
        "person",

      organization:
        "organization",

      location:
        "location",

      place:
        "location",

      object:
        "object",

      thing:
        "object",

      concept:
        "concept",

      issue:
        "concept",

      topic:
        "concept",

      file:
        "artifact",

      code:
        "artifact",

      artifact:
        "artifact",

      quantity:
        "quantity"
    };

    return map[type] ||
      type ||
      "unknown";
  },

  inferNumber(surface = "") {
    const text =
      this.normalize(surface);

    if (
      /\b(?:they|them|these|those|people|children|options|files|cars)\b/.test(
        text
      )
    ) {
      return "plural";
    }

    return "singular";
  },

  /* =====================================================
     EVENTS
  ===================================================== */

  buildEvents({
    currentTurn = {},
    evidenceIndex = {},
    entities = []
  } = {}) {
    const observed =
      evidenceIndex.byClass
        ?.event ||
      [];

    return this.dedupeBySemanticValue(
      observed.map(
        (
          item,
          index
        ) => {
          const raw =
            item.raw ||
            {};

          const surface =
            this.clean(
              raw.surface ||
              item.surface ||
              raw.value ||
              raw.evidence ||
              ""
            );

          return {
            id:
              raw.id ||
              this.createStableId(
                "event",
                [
                  currentTurn.turnId,
                  surface,
                  index
                ].join("|")
              ),

            eventType:
              raw.eventType ||
              raw.actionType ||
              raw.type ||
              "event",

            surface,

            actorRefs:
              this.resolveKnownRefs(
                raw.actorRefs ||
                raw.actors ||
                raw.actorRef ||
                raw.actor,
                entities
              ),

            objectRefs:
              this.resolveKnownRefs(
                raw.objectRefs ||
                raw.objects ||
                raw.objectRef ||
                raw.object,
                entities
              ),

            recipientRefs:
              this.resolveKnownRefs(
                raw.recipientRefs ||
                raw.recipients ||
                raw.recipient,
                entities
              ),

            tense:
              raw.tense ||
              null,

            aspect:
              raw.aspect ||
              null,

            status:
              raw.status ||
              this.inferEventStatus(
                currentTurn
                  .normalizedText
              ),

            confidence:
              item.confidence,

            evidenceRefs: [
              item.id
            ]
          };
        }
      )
    );
  },

  inferEventStatus(text = "") {
    if (
      /\b(?:if|would|could|might|may)\b/.test(
        text
      )
    ) {
      return "hypothetical";
    }

    if (
      this.hasQuestionForm(text)
    ) {
      return "questioned";
    }

    return "asserted";
  },

  /* =====================================================
     CLAIMS
  ===================================================== */

  buildClaims({
    currentTurn = {},
    evidenceIndex = {},
    entities = [],
    events = []
  } = {}) {
    const observed =
      evidenceIndex.byClass
        ?.claim ||
      [];

    const claims =
      observed.map(
        (
          item,
          index
        ) => {
          const raw =
            item.raw ||
            {};

          const proposition =
            this.clean(
              raw.proposition ||
              raw.claim ||
              item.surface ||
              raw.value ||
              ""
            );

          return {
            id:
              raw.id ||
              this.createStableId(
                "claim",
                [
                  currentTurn.turnId,
                  proposition,
                  index
                ].join("|")
              ),

            proposition,

            claimantRef:
              raw.claimantRef ||
              raw.claimant ||
              "user",

            subjectRefs:
              this.resolveKnownRefs(
                raw.subjectRefs ||
                raw.subjectRef ||
                raw.subject,
                entities
              ),

            objectRefs:
              this.resolveKnownRefs(
                raw.objectRefs ||
                raw.objectRef ||
                raw.object,
                [
                  ...entities,
                  ...events
                ]
              ),

            status:
              raw.status ||
              this.inferClaimStatus(
                currentTurn
                  .normalizedText
              ),

            polarity:
              raw.polarity ||
              (
                this.containsNegation(
                  proposition
                )
                  ? "negative"
                  : "positive"
              ),

            certainty:
              raw.certainty ??
              null,

            confidence:
              item.confidence,

            evidenceRefs: [
              item.id
            ]
          };
        }
      );

    if (
      !claims.length &&
      currentTurn.rawText &&
      !this.isPureQuestionFragment(
        currentTurn.normalizedText
      )
    ) {
      claims.push({
        id:
          this.createStableId(
            "claim",
            currentTurn.rawText
          ),

        proposition:
          currentTurn.rawText,

        claimantRef:
          "user",

        subjectRefs: [],
        objectRefs: [],

        status:
          this.hasQuestionForm(
            currentTurn.normalizedText
          )
            ? "questioned"
            : "asserted",

        polarity:
          this.containsNegation(
            currentTurn.normalizedText
          )
            ? "negative"
            : "positive",

        certainty:
          null,

        confidence:
          0.45,

        evidenceRefs: [
          currentTurn.turnId
        ],

        fallback:
          true
      });
    }

    return this.dedupeBySemanticValue(
      claims
    );
  },

  inferClaimStatus(text = "") {
    if (
      /\b(?:i think|i believe|i feel like|probably|maybe)\b/.test(
        text
      )
    ) {
      return "believed";
    }

    if (
      /\b(?:she said|he said|they said|says|told me)\b/.test(
        text
      )
    ) {
      return "reported";
    }

    if (
      /\b(?:i doubt|not sure|uncertain)\b/.test(
        text
      )
    ) {
      return "doubted";
    }

    if (
      /\b(?:if|would|could|might)\b/.test(
        text
      )
    ) {
      return "hypothetical";
    }

    if (
      this.hasQuestionForm(text)
    ) {
      return "questioned";
    }

    return