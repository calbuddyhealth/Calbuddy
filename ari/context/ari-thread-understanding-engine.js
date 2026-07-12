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

    return "asserted";
  },

  /* =====================================================
     ATTRIBUTES
  ===================================================== */

  buildAttributes({
    currentTurn = {},
    evidenceIndex = {},
    entities = []
  } = {}) {
    const observed =
      evidenceIndex.byClass
        ?.attribute ||
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

          return {
            id:
              raw.id ||
              this.createStableId(
                "attribute",
                [
                  currentTurn.turnId,
                  raw.name,
                  raw.value,
                  index
                ].join("|")
              ),

            ownerRef:
              this.resolveSingleKnownRef(
                raw.ownerRef ||
                raw.owner,
                entities
              ),

            name:
              this.clean(
                raw.name ||
                raw.attribute ||
                raw.type ||
                ""
              ),

            value:
              raw.value ??
              raw.normalizedValue ??
              null,

            unit:
              raw.unit ||
              null,

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

  /* =====================================================
     QUANTITIES
  ===================================================== */

  buildQuantities({
    currentTurn = {},
    evidenceIndex = {},
    entities = []
  } = {}) {
    const observed =
      evidenceIndex.byClass
        ?.quantity ||
      [];

    const quantities =
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
              raw.value ||
              ""
            );

          const parsed =
            this.parseQuantity(
              surface,
              raw
            );

          return {
            id:
              raw.id ||
              this.createStableId(
                "quantity",
                [
                  currentTurn.turnId,
                  surface,
                  index
                ].join("|")
              ),

            surface,

            numericValue:
              raw.numericValue ??
              parsed.numericValue,

            scale:
              raw.scale ||
              parsed.scale,

            unit:
              raw.unit ||
              parsed.unit,

            dimension:
              raw.dimension ||
              parsed.dimension,

            approximate:
              raw.approximate ===
                true ||
              parsed.approximate,

            range:
              raw.range ||
              null,

            ownerRef:
              this.resolveSingleKnownRef(
                raw.ownerRef ||
                raw.owner,
                entities
              ),

            confidence:
              item.confidence,

            evidenceRefs: [
              item.id
            ]
          };
        }
      );

    if (!quantities.length) {
      this.extractFallbackQuantities(
        currentTurn.rawText
      ).forEach(quantity =>
        quantities.push(quantity)
      );
    }

    return this.dedupeBySemanticValue(
      quantities
    );
  },

  parseQuantity(
    surface = "",
    raw = {}
  ) {
    const text =
      this.normalize(surface);

    const match =
      text.match(
        /(-?\d+(?:\.\d+)?)\s*(thousand|million|billion|trillion|quadrillion|quintillion)?\s*([a-z%°]+)?/
      );

    return {
      numericValue:
        match
          ? Number(match[1])
          : null,

      scale:
        match?.[2] ||
        null,

      unit:
        match?.[3] ||
        null,

      dimension:
        raw.dimension ||
        this.inferQuantityDimension(
          match?.[3] ||
          ""
        ),

      approximate:
        /\b(?:about|around|roughly|approximately|almost|nearly)\b/.test(
          text
        )
    };
  },

  inferQuantityDimension(unit = "") {
    const normalized =
      this.normalize(unit);

    if (
      /^(?:gallon|gallons|liter|liters|ml|milliliter|milliliters)$/.test(
        normalized
      )
    ) {
      return "volume";
    }

    if (
      /^(?:mile|miles|km|kilometer|kilometers|meter|meters|feet|foot|inch|inches)$/.test(
        normalized
      )
    ) {
      return "length";
    }

    if (
      /^(?:lb|lbs|pound|pounds|kg|kilogram|kilograms)$/.test(
        normalized
      )
    ) {
      return "mass";
    }

    if (
      /^(?:dollar|dollars|usd|peso|pesos)$/.test(
        normalized
      )
    ) {
      return "currency";
    }

    if (
      /^(?:hour|hours|day|days|week|weeks|month|months|year|years)$/.test(
        normalized
      )
    ) {
      return "time";
    }

    return null;
  },

  extractFallbackQuantities(text = "") {
    const quantities = [];

    const pattern =
      /\b(?:about|around|roughly|approximately|almost|nearly)?\s*(-?\d+(?:\.\d+)?)\s*(thousand|million|billion|trillion|quadrillion|quintillion)?\s*(gallons?|liters?|miles?|kilometers?|km|meters?|feet|inches?|pounds?|lbs?|kg|dollars?|usd|pesos?|hours?|days?|weeks?|months?|years?|percent|%)?\b/gi;

    let index = 0;

    for (
      const match
      of String(text).matchAll(pattern)
    ) {
      const surface =
        this.clean(match[0]);

      quantities.push({
        id:
          this.createStableId(
            "quantity",
            [
              surface,
              index
            ].join("|")
          ),

        surface,

        numericValue:
          Number(match[1]),

        scale:
          match[2] ||
          null,

        unit:
          match[3] ||
          null,

        dimension:
          this.inferQuantityDimension(
            match[3] ||
            ""
          ),

        approximate:
          /\b(?:about|around|roughly|approximately|almost|nearly)\b/i.test(
            surface
          ),

        range:
          null,

        ownerRef:
          null,

        confidence:
          0.72,

        evidenceRefs: [],

        fallback:
          true
      });

      index += 1;
    }

    return quantities;
  },

  /* =====================================================
     RELATIONS
  ===================================================== */

  buildRelations({
    currentTurn = {},
    evidenceIndex = {},
    entities = [],
    events = [],
    claims = [],
    attributes = [],
    quantities = []
  } = {}) {
    const observed =
      evidenceIndex.byClass
        ?.relation ||
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

          const knownNodes = [
            ...entities,
            ...events,
            ...claims,
            ...attributes,
            ...quantities
          ];

          return {
            id:
              raw.id ||
              this.createStableId(
                "relation",
                [
                  currentTurn.turnId,
                  raw.relationType,
                  index
                ].join("|")
              ),

            relationType:
              raw.relationType ||
              raw.relation ||
              raw.type ||
              "related_to",

            sourceRef:
              this.resolveSingleKnownRef(
                raw.sourceRef ||
                raw.source ||
                raw.subjectRef ||
                raw.subject,
                knownNodes
              ),

            targetRef:
              this.resolveSingleKnownRef(
                raw.targetRef ||
                raw.target ||
                raw.objectRef ||
                raw.object,
                knownNodes
              ),

            direction:
              raw.direction ||
              "directed",

            explicit:
              raw.explicit !==
              false,

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

  /* =====================================================
     REFERENCES
  ===================================================== */

  buildReferences({
    currentTurn = {},
    evidenceIndex = {},
    threadContext = {}
  } = {}) {
    const observed =
      evidenceIndex.byClass
        ?.reference ||
      [];

    const references =
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
              ""
            );

          return {
            id:
              raw.id ||
              this.createStableId(
                "reference",
                [
                  currentTurn.turnId,
                  surface,
                  index
                ].join("|")
              ),

            surface,

            referenceType:
              raw.referenceType ||
              this.classifyReference(
                surface
              ),

            semanticRole:
              raw.semanticRole ||
              null,

            expectedTypes:
              this.asArray(
                raw.expectedTypes
              ),

            candidateRefs:
              this.asArray(
                raw.candidateRefs
              ),

            resolved:
              false,

            resolvedTo:
              null,

            confidence:
              item.confidence,

            evidenceRefs: [
              item.id
            ]
          };
        }
      );

    this.extractFallbackReferences(
      currentTurn.normalizedText
    ).forEach(reference => {
      if (
        !references.some(item =>
          item.surface ===
            reference.surface &&
          item.referenceType ===
            reference.referenceType
        )
      ) {
        references.push(reference);
      }
    });

    return this.dedupeBySemanticValue(
      references
    ).map(reference => ({
      ...reference,

      candidateRefs:
        reference.candidateRefs
          ?.length
          ? reference.candidateRefs
          : this.selectThreadCandidateRefs({
              reference,
              threadContext
            })
    }));
  },

  extractFallbackReferences(
    text = ""
  ) {
    const references = [];

    const pattern =
      /\b(?:it|its|this|that|these|those|they|them|their|he|him|his|she|her|hers|same one|other one|the former|the latter|that amount|that option|that idea|that plan|there|then)\b/g;

    let index = 0;

    for (
      const match
      of String(text).matchAll(pattern)
    ) {
      const surface =
        match[0];

      references.push({
        id:
          this.createStableId(
            "reference",
            [
              surface,
              match.index,
              index
            ].join("|")
          ),

        surface,

        referenceType:
          this.classifyReference(
            surface
          ),

        semanticRole:
          null,

        expectedTypes:
          this.inferExpectedReferenceTypes({
            surface,
            text
          }),

        candidateRefs: [],

        resolved:
          false,

        resolvedTo:
          null,

        confidence:
          0.82,

        evidenceRefs: [],

        fallback:
          true
      });

      index += 1;
    }

    return references;
  },

  classifyReference(value = "") {
    const text =
      this.normalize(value);

    if (
      [
        "he",
        "him",
        "his",
        "she",
        "her",
        "hers",
        "they",
        "them",
        "their"
      ].includes(text)
    ) {
      return "pronoun";
    }

    if (
      [
        "this",
        "that",
        "these",
        "those"
      ].includes(text)
    ) {
      return "demonstrative";
    }

    if (
      [
        "same one",
        "other one",
        "the former",
        "the latter"
      ].includes(text)
    ) {
      return "selection_reference";
    }

    if (
      text.startsWith("that ")
    ) {
      return "typed_demonstrative";
    }

    if (
      [
        "there",
        "then"
      ].includes(text)
    ) {
      return "situational_reference";
    }

    return "reference";
  },

  inferExpectedReferenceTypes({
    surface = "",
    text = ""
  } = {}) {
    const reference =
      this.normalize(surface);

    const sentence =
      this.normalize(text);

    if (
      [
        "he",
        "him",
        "his",
        "she",
        "her",
        "hers"
      ].includes(reference)
    ) {
      return [
        "person"
      ];
    }

    if (
      [
        "they",
        "them",
        "their"
      ].includes(reference)
    ) {
      return [
        "person",
        "group",
        "organization"
      ];
    }

    if (
      reference ===
        "that amount" ||
      /\b(?:how big|how much|how many|amount|size)\b/.test(
        sentence
      )
    ) {
      return [
        "quantity",
        "measurement",
        "physical_entity"
      ];
    }

    if (
      reference.includes(
        "option"
      ) ||
      reference.includes(
        "one"
      )
    ) {
      return [
        "option",
        "entity",
        "event"
      ];
    }

    return [
      "entity",
      "event",
      "claim",
      "quantity",
      "option"
    ];
  },

  selectThreadCandidateRefs({
    reference = {},
    threadContext = {}
  } = {}) {
    const expected =
      new Set(
        this.asArray(
          reference.expectedTypes
        ).map(value =>
          this.normalize(value)
        )
      );

    return this.asArray(
      threadContext
        .referenceCandidates
    )
      .filter(candidate => {
        if (!expected.size) {
          return true;
        }

        const semanticType =
          this.normalize(
            candidate.semanticType
          );

        return (
          expected.has(
            semanticType
          ) ||
          (
            expected.has("measurement") &&
            semanticType ===
              "quantity"
          ) ||
          (
            expected.has("physical entity") &&
            semanticType ===
              "entity"
          )
        );
      })
      .slice(0, 8)
      .map(candidate =>
        candidate.semanticRef ||
        candidate.id
      )
      .filter(Boolean);
  },

  /* =====================================================
     NEGATIONS
  ===================================================== */

  buildNegations({
    currentTurn = {},
    evidenceIndex = {}
  } = {}) {
    const observed =
      evidenceIndex.byClass
        ?.negation ||
      [];

    const negations =
      observed.map(
        (
          item,
          index
        ) => {
          const raw =
            item.raw ||
            {};

          return {
            id:
              raw.id ||
              this.createStableId(
                "negation",
                [
                  currentTurn.turnId,
                  item.surface,
                  index
                ].join("|")
              ),

            surface:
              this.clean(
                raw.surface ||
                item.surface ||
                raw.value ||
                ""
              ),

            scopeRefs:
              this.asArray(
                raw.scopeRefs
              ),

            negationType:
              raw.negationType ||
              "explicit",

            confidence:
              item.confidence,

            evidenceRefs: [
              item.id
            ]
          };
        }
      );

    if (
      !negations.length &&
      this.containsNegation(
        currentTurn.normalizedText
      )
    ) {
      negations.push({
        id:
          this.createStableId(
            "negation",
            currentTurn.normalizedText
          ),

        surface:
          this.extractNegationSurface(
            currentTurn.normalizedText
          ),

        scopeRefs: [],

        negationType:
          this.inferNegationType(
            currentTurn.normalizedText
          ),

        confidence:
          0.72,

        evidenceRefs: [
          currentTurn.turnId
        ],

        fallback:
          true
      });
    }

    return negations;
  },

  containsNegation(text = "") {
    return /\b(?:not|no|never|none|nothing|neither|nor|don't|doesn't|didn't|can't|cannot|won't|wouldn't|shouldn't|isn't|aren't|wasn't|weren't|without)\b/.test(
      this.normalize(text)
    );
  },

  extractNegationSurface(text = "") {
    const match =
      this.normalize(text).match(
        /\b(?:not|no|never|none|nothing|neither|nor|don't|doesn't|didn't|can't|cannot|won't|wouldn't|shouldn't|isn't|aren't|wasn't|weren't|without)\b/
      );

    return match?.[0] ||
      "negation";
  },

  inferNegationType(text = "") {
    if (
      /\b(?:i mean|i meant|not that|rather|instead)\b/.test(
        text
      )
    ) {
      return "corrective";
    }

    if (
      /\b(?:but not|not just|not only)\b/.test(
        text
      )
    ) {
      return "contrastive";
    }

    return "explicit";
  },

  /* =====================================================
     DISCOURSE SIGNALS
  ===================================================== */

  buildDiscourseSignals({
    currentTurn = {},
    evidenceIndex = {}
  } = {}) {
    const observed =
      evidenceIndex.byClass
        ?.discourse_signal ||
      [];

    const signals =
      observed.map(
        (
          item,
          index
        ) => {
          const raw =
            item.raw ||
            {};

          return {
            id:
              raw.id ||
              this.createStableId(
                "discourse",
                [
                  currentTurn.turnId,
                  item.surface,
                  index
                ].join("|")
              ),

            surface:
              this.clean(
                raw.surface ||
                item.surface ||
                raw.value ||
                ""
              ),

            signalType:
              raw.signalType ||
              raw.type ||
              "unknown",

            confidence:
              item.confidence,

            evidenceRefs: [
              item.id
            ]
          };
        }
      );

    this.extractFallbackDiscourseSignals(
      currentTurn.normalizedText
    ).forEach(signal => {
      if (
        !signals.some(item =>
          item.signalType ===
            signal.signalType &&
          item.surface ===
            signal.surface
        )
      ) {
        signals.push(signal);
      }
    });

    return signals;
  },

  extractFallbackDiscourseSignals(
    text = ""
  ) {
    const signals = [];

    const patterns = [
      [
        "continuation",
        /\b(?:and|also|then|next|continue|go on|based on that)\b/
      ],

      [
        "contrast",
        /\b(?:but|however|although|though|yet)\b/
      ],

      [
        "correction",
        /\b(?:i mean|i meant|actually|rather|instead|not that)\b/
      ],

      [
        "reset",
        /\b(?:new topic|different topic|separate question|start over|unrelated)\b/
      ],

      [
        "cause",
        /\b(?:because|since|therefore|so that|caused by)\b/
      ],

      [
        "condition",
        /\b(?:if|unless|provided that|as long as)\b/
      ],

      [
        "sequence",
        /\b(?:first|second|third|before|after|then|finally)\b/
      ]
    ];

    patterns.forEach(
      (
        [
          signalType,
          pattern
        ]
      ) => {
        const match =
          text.match(pattern);

        if (!match) {
          return;
        }

        signals.push({
          id:
            this.createStableId(
              "discourse",
              [
                signalType,
                match[0]
              ].join("|")
            ),

          surface:
            match[0],

          signalType,

          confidence:
            0.75,

          evidenceRefs: [],

          fallback:
            true
        });
      }
    );

    return signals;
  },

  /* =====================================================
     EMOTIONAL SIGNALS
  ===================================================== */

  buildEmotionalSignals({
    currentTurn = {},
    evidenceIndex = {},
    entities = []
  } = {}) {
    const observed =
      evidenceIndex.byClass
        ?.emotional_signal ||
      [];

    const signals =
      observed.map(
        (
          item,
          index
        ) => {
          const raw =
            item.raw ||
            {};

          return {
            id:
              raw.id ||
              this.createStableId(
                "emotion",
                [
                  currentTurn.turnId,
                  item.surface,
                  index
                ].join("|")
              ),

            surface:
              this.clean(
                raw.surface ||
                item.surface ||
                raw.value ||
                ""
              ),

            emotion:
              raw.emotion ||
              raw.value ||
              raw.label ||
              null,

            intensity:
              raw.intensity ||
              this.intensityFromConfidence(
                item.confidence
              ),

            experiencerRef:
              raw.experiencerRef ||
              this.findUserEntityRef(
                entities
              ),

            explicit:
              raw.explicit !==
              false,

            confidence:
              item.confidence,

            evidenceRefs: [
              item.id
            ]
          };
        }
      );

    if (!signals.length) {
      this.extractFallbackEmotions(
        currentTurn.normalizedText,
        entities
      ).forEach(signal =>
        signals.push(signal)
      );
    }

    return this.dedupeBySemanticValue(
      signals
    );
  },

  extractFallbackEmotions(
    text = "",
    entities = []
  ) {
    const patterns = [
      [
        "sad",
        /\b(?:sad|depressed|down|heartbroken|upset)\b/
      ],

      [
        "angry",
        /\b(?:angry|mad|furious|pissed|irritated)\b/
      ],

      [
        "afraid",
        /\b(?:afraid|scared|fearful|terrified|worried|anxious)\b/
      ],

      [
        "frustrated",
        /\b(?:frustrated|annoyed|fed up)\b/
      ],

      [
        "happy",
        /\b(?:happy|excited|glad|joyful|relieved)\b/
      ],

      [
        "overwhelmed",
        /\b(?:overwhelmed|burned out|burnt out|exhausted)\b/
      ]
    ];

    const results = [];

    patterns.forEach(
      (
        [
          emotion,
          pattern
        ]
      ) => {
        const match =
          text.match(pattern);

        if (!match) {
          return;
        }

        results.push({
          id:
            this.createStableId(
              "emotion",
              [
                emotion,
                match[0]
              ].join("|")
            ),

          surface:
            match[0],

          emotion,

          intensity:
            this.inferEmotionIntensity(
              text,
              match[0]
            ),

          experiencerRef:
            this.findUserEntityRef(
              entities
            ) ||
            "user",

          explicit:
            true,

          confidence:
            0.78,

          evidenceRefs: [],

          fallback:
            true
        });
      }
    );

    return results;
  },

  inferEmotionIntensity(
    text = "",
    emotionSurface = ""
  ) {
    if (
      /\b(?:really|very|extremely|incredibly|so fucking|fucking|terribly)\b/.test(
        text
      )
    ) {
      return "high";
    }

    if (
      /\b(?:pretty|quite|kind of|kinda|somewhat)\b/.test(
        text
      )
    ) {
      return "medium";
    }

    return "low";
  },

  intensityFromConfidence(
    confidence = 0
  ) {
    const value =
      this.normalizeConfidence(
        confidence
      );

    if (value >= 0.85) {
      return "high";
    }

    if (value >= 0.6) {
      return "medium";
    }

    return "low";
  },

  /* =====================================================
     OPTIONS
  ===================================================== */

  buildOptions({
    currentTurn = {},
    evidenceIndex = {},
    entities = [],
    events = [],
    claims = []
  } = {}) {
    const optionEvidence = [
      ...(
        evidenceIndex.byClass
          ?.option ||
        []
      ),

      ...evidenceIndex.items.filter(
        item =>
          item.raw
            ?.slotCandidate ===
          "options"
      )
    ];

    const options =
      optionEvidence.map(
        (
          item,
          index
        ) => {
          const raw =
            item.raw ||
            {};

          return {
            id:
              raw.id ||
              this.createStableId(
                "option",
                [
                  currentTurn.turnId,
                  item.surface,
                  index
                ].join("|")
              ),

            label:
              this.clean(
                raw.label ||
                raw.value ||
                item.surface ||
                ""
              ),

            entityRefs:
              this.resolveKnownRefs(
                raw.entityRefs ||
                raw.entities,
                entities
              ),

            eventRefs:
              this.resolveKnownRefs(
                raw.eventRefs ||
                raw.events,
                events
              ),

            claimRefs:
              this.resolveKnownRefs(
                raw.claimRefs ||
                raw.claims,
                claims
              ),

            explicit:
              raw.explicit !==
              false,

            confidence:
              item.confidence,

            evidenceRefs: [
              item.id
            ]
          };
        }
      );

    this.extractFallbackOptions(
      currentTurn.rawText
    ).forEach(option => {
      if (
        !options.some(item =>
          this.normalize(
            item.label
          ) ===
          this.normalize(
            option.label
          )
        )
      ) {
        options.push(option);
      }
    });

    return this.dedupeBySemanticValue(
      options
    );
  },

  extractFallbackOptions(text = "") {
    const normalized =
      this.clean(text);

    const options = [];

    const versusMatch =
      normalized.match(
        /(.+?)\s+(?:versus|vs\.?)\s+(.+?)(?:\?|$)/i
      );

    if (versusMatch) {
      [
        versusMatch[1],
        versusMatch[2]
      ].forEach(
        (
          label,
          index
        ) => {
          options.push({
            id:
              this.createStableId(
                "option",
                [
                  label,
                  index
                ].join("|")
              ),

            label:
              this.clean(label),

            entityRefs: [],
            eventRefs: [],
            claimRefs: [],

            explicit:
              true,

            confidence:
              0.76,

            evidenceRefs: [],

            fallback:
              true
          });
        }
      );

      return options;
    }

    const eitherOrMatch =
      normalized.match(
        /\beither\s+(.+?)\s+or\s+(.+?)(?:\?|$)/i
      );

    if (eitherOrMatch) {
      [
        eitherOrMatch[1],
        eitherOrMatch[2]
      ].forEach(
        (
          label,
          index
        ) => {
          options.push({
            id:
              this.createStableId(
                "option",
                [
                  label,
                  index
                ].join("|")
              ),

            label:
              this.clean(label),

            entityRefs: [],
            eventRefs: [],
            claimRefs: [],

            explicit:
              true,

            confidence:
              0.8,

            evidenceRefs: [],

            fallback:
              true
          });
        }
      );
    }

    return options;
  },

  /* =====================================================
     CRITERIA
  ===================================================== */

  buildCriteria({
    currentTurn = {},
    evidenceIndex = {}
  } = {}) {
    const observed =
      evidenceIndex.items.filter(
        item =>
          item.semanticClass ===
            "criterion" ||
          item.raw
            ?.slotCandidate ===
            "criteria"
      );

    const criteria =
      observed.map(
        (
          item,
          index
        ) => {
          const raw =
            item.raw ||
            {};

          return {
            id:
              raw.id ||
              this.createStableId(
                "criterion",
                [
                  currentTurn.turnId,
                  raw.value,
                  index
                ].join("|")
              ),

            name:
              this.clean(
                raw.name ||
                raw.criterion ||
                raw.value ||
                item.surface ||
                ""
              ),

            value:
              raw.value ??
              null,

            weight:
              raw.weight ??
              null,

            explicit:
              raw.explicit !==
              false,

            confidence:
              item.confidence,

            evidenceRefs: [
              item.id
            ]
          };
        }
      );

    const knownCriteria = [
      [
        "safety",
        /\b(?:safe|safer|safest|safety|risk)\b/
      ],

      [
        "cost",
        /\b(?:cost|price|cheap|cheaper|afford|budget)\b/
      ],

      [
        "speed",
        /\b(?:fast|faster|quick|quickest|speed)\b/
      ],

      [
        "ease",
        /\b(?:easy|easier|simple|simpler)\b/
      ],

      [
        "quality",
        /\b(?:quality|better|best|reliable|accuracy)\b/
      ],

      [
        "priority",
        /\b(?:important|priority|focus first|matters most)\b/
      ],

      [
        "size",
        /\b(?:big|bigger|small|smaller|size|scale)\b/
      ]
    ];

    knownCriteria.forEach(
      (
        [
          name,
          pattern
        ]
      ) => {
        const match =
          currentTurn
            .normalizedText
            .match(pattern);

        if (!match) {
          return;
        }

        criteria.push({
          id:
            this.createStableId(
              "criterion",
              name
            ),

          name,

          value:
            null,

          weight:
            null,

          explicit:
            true,

          confidence:
            0.72,

          evidenceRefs: [],

          fallback:
            true
        });
      }
    );

    return this.dedupeBySemanticValue(
      criteria
    );
  },

  /* =====================================================
     CONSTRAINTS
  ===================================================== */

  buildConstraints({
    currentTurn = {},
    evidenceIndex = {},
    entities = [],
    events = [],
    claims = [],
    quantities = []
  } = {}) {
    const observed =
      evidenceIndex.items.filter(
        item =>
          item.semanticClass ===
            "constraint" ||
          item.raw
            ?.slotCandidate ===
            "constraints"
      );

    const knownNodes = [
      ...entities,
      ...events,
      ...claims,
      ...quantities
    ];

    const constraints =
      observed.map(
        (
          item,
          index
        ) => {
          const raw =
            item.raw ||
            {};

          return {
            id:
              raw.id ||
              this.createStableId(
                "constraint",
                [
                  currentTurn.turnId,
                  item.surface,
                  index
                ].join("|")
              ),

            type:
              raw.constraintType ||
              raw.type ||
              "constraint",

            value:
              raw.value ??
              raw.label ??
              item.surface,

            appliesToRefs:
              this.resolveKnownRefs(
                raw.appliesToRefs ||
                raw.appliesTo,
                knownNodes
              ),

            hard:
              raw.hard ===
              true,

            confidence:
              item.confidence,

            evidenceRefs: [
              item.id
            ]
          };
        }
      );

    this.extractFallbackConstraints(
      currentTurn.normalizedText
    ).forEach(constraint =>
      constraints.push(constraint)
    );

    return this.dedupeBySemanticValue(
      constraints
    );
  },

  extractFallbackConstraints(text = "") {
    const constraints = [];

    const patterns = [
      {
        type:
          "mutual_exclusion",

        pattern:
          /\b(?:only do one|can only choose one|can't do both|cannot do both)\b/,

        value:
          "only one option can be selected",

        hard:
          true
      },

      {
        type:
          "time",

        pattern:
          /\b(?:deadline|due|tonight|tomorrow|this week|at the same time)\b/,

        value:
          "time constraint present",

        hard:
          false
      },

      {
        type:
          "financial",

        pattern:
          /\b(?:can't afford|cannot afford|not enough money|limited budget|budget)\b/,

        value:
          "financial limitation present",

        hard:
          false
      },

      {
        type:
          "capacity",

        pattern:
          /\b(?:exhausted|overwhelmed|burned out|burnt out|no energy)\b/,

        value:
          "limited capacity present",

        hard:
          false
      },

      {
        type:
          "prohibition",

        pattern:
          /\b(?:do not|don't|dont|must not|cannot|can't)\b/,

        value:
          "explicit prohibition present",

        hard:
          true
      }
    ];

    patterns.forEach(item => {
      const match =
        text.match(
          item.pattern
        );

      if (!match) {
        return;
      }

      constraints.push({
        id:
          this.createStableId(
            "constraint",
            [
              item.type,
              match[0]
            ].join("|")
          ),

        type:
          item.type,

        value:
          item.value,

        appliesToRefs: [],

        hard:
          item.hard,

        confidence:
          0.72,

        evidenceRefs: [],

        fallback:
          true
      });
    });

    return constraints;
  },

  /* =====================================================
     STAKES
  ===================================================== */

  buildStakes({
    currentTurn = {},
    evidenceIndex = {},
    entities = [],
    events = [],
    claims = []
  } = {}) {
    const observed =
      evidenceIndex.items.filter(
        item =>
          item.semanticClass ===
            "stake" ||
          item.raw
            ?.slotCandidate ===
            "stakes"
      );

    const knownNodes = [
      ...entities,
      ...events,
      ...claims
    ];

    const stakes =
      observed.map(
        (
          item,
          index
        ) => {
          const raw =
            item.raw ||
            {};

          return {
            id:
              raw.id ||
              this.createStableId(
                "stake",
                [
                  currentTurn.turnId,
                  item.surface,
                  index
                ].join("|")
              ),

            type:
              raw.stakeType ||
              raw.type ||
              "stake",

            value:
              raw.value ??
              raw.label ??
              item.surface,

            affectedRefs:
              this.resolveKnownRefs(
                raw.affectedRefs ||
                raw.affected,
                knownNodes
              ),

            confidence:
              item.confidence,

            evidenceRefs: [
              item.id
            ]
          };
        }
      );

    return this.dedupeBySemanticValue(
      stakes
    );
  },

  /* =====================================================
     COMPARISON STRUCTURES
  ===================================================== */

  buildComparisonStructures({
    currentTurn = {},
    evidenceIndex = {},
    quantities = [],
    options = [],
    references = []
  } = {}) {
    const observed =
      evidenceIndex.byClass
        ?.comparison_signal ||
      [];

    const structures =
      observed.map(
        (
          item,
          index
        ) => {
          const raw =
            item.raw ||
            {};

          return {
            id:
              raw.id ||
              this.createStableId(
                "comparison",
                [
                  currentTurn.turnId,
                  item.surface,
                  index
                ].join("|")
              ),

            leftRef:
              raw.leftRef ||
              null,

            rightRef:
              raw.rightRef ||
              null,

            dimension:
              raw.dimension ||
              this.inferComparisonDimension(
                currentTurn
                  .normalizedText
              ),

            requestedReferenceType:
              raw.requestedReferenceType ||
              this.inferRequestedReferenceType(
                currentTurn
                  .normalizedText
              ),

            candidateTypes:
              this.inferComparisonCandidateTypes({
                text:
                  currentTurn
                    .normalizedText,

                quantities,
                options
              }),

            confidence:
              item.confidence,

            evidenceRefs: [
              item.id
            ]
          };
        }
      );

    if (
      !structures.length &&
      this.hasComparisonLanguage(
        currentTurn.normalizedText
      )
    ) {
      structures.push({
        id:
          this.createStableId(
            "comparison",
            currentTurn.normalizedText
          ),

        leftRef:
          this.findComparisonLeftRef({
            quantities,
            options,
            references
          }),

        rightRef:
          this.findComparisonRightRef({
            options
          }),

        dimension:
          this.inferComparisonDimension(
            currentTurn.normalizedText
          ),

        requestedReferenceType:
          this.inferRequestedReferenceType(
            currentTurn.normalizedText
          ),

        candidateTypes:
          this.inferComparisonCandidateTypes({
            text:
              currentTurn
                .normalizedText,

            quantities,
            options
          }),

        confidence:
          0.74,

        evidenceRefs: [
          currentTurn.turnId
        ],

        fallback:
          true
      });
    }

    return structures;
  },

  hasComparisonLanguage(text = "") {
    return /\b(?:compare|compared|comparison|versus|vs|difference|similar|same as|bigger|smaller|more than|less than|how big|how small|like what|equivalent to)\b/.test(
      text
    );
  },

  inferComparisonDimension(text = "") {
    if (
      /\b(?:how big|bigger|smaller|size|scale)\b/.test(
        text
      )
    ) {
      return "magnitude";
    }

    if (
      /\b(?:how much|amount|volume|gallons|liters)\b/.test(
        text
      )
    ) {
      return "quantity";
    }

    if (
      /\b(?:difference|different|similar|same)\b/.test(
        text
      )
    ) {
      return "similarity_difference";
    }

    if (
      /\b(?:better|best|worse|choose|which should)\b/.test(
        text
      )
    ) {
      return "evaluation";
    }

    if (
      /\b(?:before|after|earlier|later|longer)\b/.test(
        text
      )
    ) {
      return "time";
    }

    return null;
  },

  inferRequestedReferenceType(text = "") {
    if (
      /\b(?:compare it to something|like what|something familiar|put it in perspective)\b/.test(
        text
      )
    ) {
      return "familiar_analogy";
    }

    if (
      /\b(?:which is better|which should|best option)\b/.test(
        text
      )
    ) {
      return "option_evaluation";
    }

    return null;
  },

  inferComparisonCandidateTypes({
    text = "",
    quantities = [],
    options = []
  } = {}) {
    const types = [];

    if (
      quantities.length ||
      /\b(?:how big|how much|how many|size|scale|amount)\b/.test(
        text
      )
    ) {
      types.push(
        "magnitude_analogy"
      );
    }

    if (
      /\b(?:difference|different|similar|same)\b/.test(
        text
      )
    ) {
      types.push(
        "similarity_difference"
      );
    }

    if (
      options.length >= 2 &&
      /\b(?:better|best|choose|which should|recommend)\b/.test(
        text
      )
    ) {
      types.push(
        "option_evaluation"
      );
    }

    if (
      /\b(?:rank|ranking|first|second|best to worst)\b/.test(
        text
      )
    ) {
      types.push(
        "ranking"
      );
    }

    if (
      /\b(?:ratio|times as much|percentage|percent)\b/.test(
        text
      )
    ) {
      types.push(
        "ratio"
      );
    }

    if (
      /\b(?:before|after|earlier|later|over time)\b/.test(
        text
      )
    ) {
      types.push(
        "temporal_comparison"
      );
    }

    return types.length
      ? [...new Set(types)]
      : [
          "similarity_difference"
        ];
  },

  findComparisonLeftRef({
    quantities = [],
    options = [],
    references = []
  } = {}) {
    return (
      quantities[0]?.id ||
      references[0]?.id ||
      options[0]?.id ||
      null
    );
  },

  findComparisonRightRef({
    options = []
  } = {}) {
    return (
      options[1]?.id ||
      null
    );
  },

  /* =====================================================
     UNRESOLVED STRUCTURE
  ===================================================== */

  buildUnresolvedStructure({
    currentTurn = {},
    references = [],
    comparisonStructures = []
  } = {}) {
    const unresolved = [];

    references.forEach(reference => {
      if (
        reference.resolved !==
        true
      ) {
        unresolved.push({
          id:
            this.createStableId(
              "unresolved",
              reference.id
            ),

          type:
            "reference",

          surface:
            reference.surface,

          semanticRef:
            reference.id,

          requiredForMeaning:
            this.referenceRequiredForMeaning({
              reference,
              currentTurn,
              comparisonStructures
            }),

          evidenceRefs:
            reference.evidenceRefs ||
            []
        });
      }
    });

    comparisonStructures.forEach(
      comparison => {
        if (
          !comparison.leftRef
        ) {
          unresolved.push({
            id:
              this.createStableId(
                "unresolved",
                `${comparison.id}|left`
              ),

            type:
              "relation",

            surface:
              "comparison left side",

            semanticRef:
              comparison.id,

            requiredForMeaning:
              true,

            evidenceRefs:
              comparison.evidenceRefs ||
              []
          });
        }
      }
    );

    return unresolved;
  },

  referenceRequiredForMeaning({
    reference = {},
    currentTurn = {},
    comparisonStructures = []
  } = {}) {
    if (
      comparisonStructures.some(
        comparison =>
          comparison.leftRef ===
            reference.id ||
          !comparison.leftRef
      )
    ) {
      return true;
    }

    if (
      currentTurn.wordCount <= 12
    ) {
      return true;
    }

    return false;
  },

  /* =====================================================
     STRUCTURAL GRAPH
  ===================================================== */

  buildStructuralGraph({
    participants = {},
    entities = [],
    events = [],
    claims = [],
    attributes = [],
    quantities = [],
    relations = [],
    references = [],
    options = [],
    criteria = [],
    constraints = [],
    stakes = []
  } = {}) {
    const nodes = [
      ...this.asArray(
        participants
          .mentionedParticipants
      ).map(item => ({
        id:
          item.id,

        nodeType:
          "participant",

        value:
          item.surface ||

          item.role,

        raw:
          item
      })),

      ...entities.map(item => ({
        id:
          item.id,

        nodeType:
          "entity",

        value:
          item.normalizedValue ||
          item.surface,

        raw:
          item
      })),

      ...events.map(item => ({
        id:
          item.id,

        nodeType:
          "event",

        value:
          item.surface,

        raw:
          item
      })),

      ...claims.map(item => ({
        id:
          item.id,

        nodeType:
          "claim",

        value:
          item.proposition,

        raw:
          item
      })),

      ...attributes.map(item => ({
        id:
          item.id,

        nodeType:
          "attribute",

        value:
          item.name,

        raw:
          item
      })),

      ...quantities.map(item => ({
        id:
          item.id,

        nodeType:
          "quantity",

        value:
          item.surface,

        raw:
          item
      })),

      ...references.map(item => ({
        id:
          item.id,

        nodeType:
          "reference",

        value:
          item.surface,

        raw:
          item
      })),

      ...options.map(item => ({
        id:
          item.id,

        nodeType:
          "option",

        value:
          item.label,

        raw:
          item
      })),

      ...criteria.map(item => ({
        id:
          item.id,

        nodeType:
          "criterion",

        value:
          item.name,

        raw:
          item
      })),

      ...constraints.map(item => ({
        id:
          item.id,

        nodeType:
          "constraint",

        value:
          item.value,

        raw:
          item
      })),

      ...stakes.map(item => ({
        id:
          item.id,

        nodeType:
          "stake",

        value:
          item.value,

        raw:
          item
      }))
    ].filter(node =>
      node.id
    );

    const edges = [
      ...relations.map(item => ({
        id:
          item.id,

        edgeType:
          item.relationType,

        sourceRef:
          item.sourceRef,

        targetRef:
          item.targetRef,

        confidence:
          item.confidence,

        evidenceRefs:
          item.evidenceRefs
      })),

      ...events.flatMap(event => [
        ...this.asArray(
          event.actorRefs
        ).map(actorRef => ({
          id:
            this.createStableId(
              "edge",
              `${actorRef}|actor_of|${event.id}`
            ),

          edgeType:
            "actor_of",

          sourceRef:
            actorRef,

          targetRef:
            event.id,

          confidence:
            event.confidence,

          evidenceRefs:
            event.evidenceRefs
        })),

        ...this.asArray(
          event.objectRefs
        ).map(objectRef => ({
          id:
            this.createStableId(
              "edge",
              `${event.id}|acts_on|${objectRef}`
            ),

          edgeType:
            "acts_on",

          sourceRef:
            event.id,

          targetRef:
            objectRef,

          confidence:
            event.confidence,

          evidenceRefs:
            event.evidenceRefs
        }))
      ]),

      ...attributes
        .filter(attribute =>
          attribute.ownerRef
        )
        .map(attribute => ({
          id:
            this.createStableId(
              "edge",
              `${attribute.ownerRef}|has_attribute|${attribute.id}`
            ),

          edgeType:
            "has_attribute",

          sourceRef:
            attribute.ownerRef,

          targetRef:
            attribute.id,

          confidence:
            attribute.confidence,

          evidenceRefs:
            attribute.evidenceRefs
        })),

      ...quantities
        .filter(quantity =>
          quantity.ownerRef
        )
        .map(quantity => ({
          id:
            this.createStableId(
              "edge",
              `${quantity.ownerRef}|has_quantity|${quantity.id}`
            ),

          edgeType:
            "has_quantity",

          sourceRef:
            quantity.ownerRef,

          targetRef:
            quantity.id,

          confidence:
            quantity.confidence,

          evidenceRefs:
            quantity.evidenceRefs
        }))
    ];

    return {
      nodes:
        this.dedupeGraphItems(
          nodes
        ),

      edges:
        this.dedupeGraphItems(
          edges
        )
    };
  },

  /* =====================================================
     FINAL SEMANTIC STRUCTURE
  ===================================================== */

  buildSemanticStructure({
    currentTurn = {},
    observationSchema = {},
    threadContext = {},
    evidenceIndex = {},
    participants = {},
    entities = [],
    events = [],
    claims = [],
    attributes = [],
    quantities = [],
    relations = [],
    references = [],
    negations = [],
    discourseSignals = [],
    emotionalSignals = [],
    options = [],
    criteria = [],
    constraints = [],
    stakes = [],
    comparisonStructures = [],
    structuralGraph = {},
    unresolved = []
  } = {}) {
    const warnings = [];

    if (
      !observationSchema.ran &&
      !evidenceIndex.items.length
    ) {
      warnings.push({
        type:
          "observation_schema_missing",

        message:
          "No canonical observation schema was available. Semantic structure used limited deterministic fallback extraction."
      });
    }

    if (
      threadContext.ran !==
        true &&
      references.length
    ) {
      warnings.push({
        type:
          "thread_context_missing",

        message:
          "References were detected, but canonical thread context was not available."
      });
    }

    const confidence =
      this.scoreStructureConfidence({
        observationSchema,
        entities,
        events,
        claims,
        quantities,
        references,
        relations,
        comparisonStructures,
        unresolved
      });

    return {
      schema:
        "ari_semantic_structure",

      version:
        this.schemaVersion,

      source:
        "ari-thread-understanding-engine",

      ran:
        true,

      turnId:
        currentTurn.turnId,

      participants,

      entities,
      events,
      claims,
      attributes,
      quantities,
      relations,
      negations,
      discourseSignals,
      emotionalSignals,
      references,
      options,
      criteria,
      constraints,
      stakes,
      comparisonStructures,

      structuralGraph,

      unresolved,

      confidence,

      warnings,

      evidenceRefs:
        evidenceIndex
          .evidenceRefs,

      authority: {
        canBuildEntities:
          true,

        canBuildEvents:
          true,

        canBuildClaims:
          true,

        canBuildRelations:
          true,

        canRepresentOptions:
          true,

        canRepresentCriteria:
          true,

        canRepresentConstraints:
          true,

        canResolvePriorReferences:
          false,

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
          "semantic_structure_only"
      }
    };
  },

  scoreStructureConfidence({
    observationSchema = {},
    entities = [],
    events = [],
    claims = [],
    quantities = [],
    references = [],
    relations = [],
    comparisonStructures = [],
    unresolved = []
  } = {}) {
    let score =
      observationSchema.ran ===
        true
        ? 0.45
        : 0.25;

    if (entities.length) {
      score += 0.08;
    }

    if (events.length) {
      score += 0.08;
    }

    if (claims.length) {
      score += 0.08;
    }

    if (quantities.length) {
      score += 0.06;
    }

    if (relations.length) {
      score += 0.06;
    }

    if (
      comparisonStructures.length
    ) {
      score += 0.05;
    }

    if (
      references.length &&
      references.every(reference =>
        reference.candidateRefs
          ?.length
      )
    ) {
      score += 0.05;
    }

    score -=
      Math.min(
        0.25,
        unresolved.filter(item =>
          item.requiredForMeaning
        ).length *
        0.05
      );

    return this.normalizeConfidence(
      score
    );
  },

  /* =====================================================
     RETURN PAYLOAD + COMPATIBILITY
  ===================================================== */

  buildReturnPayload({
    semanticStructure = {},
    currentTurn = {},
    threadContext = {}
  } = {}) {
    const threadUnderstanding = {
      threadUnderstandingRan:
        true,

      threadUnderstandingVersion:
        this.version,

      source:
        "ari-thread-understanding-engine",

      currentText:
        currentTurn.rawText,

      currentTurn,

      semanticStructure,

      participants:
        semanticStructure.participants,

      entities:
        semanticStructure.entities,

      events:
        semanticStructure.events,

      claims:
        semanticStructure.claims,

      attributes:
        semanticStructure.attributes,

      quantities:
        semanticStructure.quantities,

      relations:
        semanticStructure.relations,

      references:
        semanticStructure.references,

      options:
        semanticStructure.options,

      criteria:
        semanticStructure.criteria,

      constraints:
        semanticStructure.constraints,

      stakes:
        semanticStructure.stakes,

      comparisonStructures:
        semanticStructure
          .comparisonStructures,

      unresolved:
        semanticStructure.unresolved,

      confidence:
        semanticStructure.confidence,

      warnings:
        semanticStructure.warnings,

      authority:
        "semantic_structure_only",

      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse",
        "recommendation",
        "medicalEscalation",
        "responseShape",
        "intent",
        "conversationIntent",
        "semanticFrame",
        "activeSemanticFrame",
        "nextBestMove",
        "responseStrategy"
      ]
    };

    return {
      threadUnderstandingRan:
        true,

      threadUnderstandingVersion:
        this.version,

      threadUnderstandingSource:
        "ari-thread-understanding-engine",

      semanticStructure,

      threadUnderstanding,

      // Canonical aliases.
      currentSemanticStructure:
        semanticStructure,

      semanticEntities:
        semanticStructure.entities,

      semanticEvents:
        semanticStructure.events,

      semanticClaims:
        semanticStructure.claims,

      semanticAttributes:
        semanticStructure.attributes,

      semanticQuantities:
        semanticStructure.quantities,

      semanticRelations:
        semanticStructure.relations,

      semanticReferences:
        semanticStructure.references,

      semanticOptions:
        semanticStructure.options,

      semanticCriteria:
        semanticStructure.criteria,

      semanticConstraints:
        semanticStructure.constraints,

      semanticStakes:
        semanticStructure.stakes,

      semanticComparisons:
        semanticStructure
          .comparisonStructures,

      semanticUnresolved:
        semanticStructure.unresolved,

      // Temporary compatibility aliases.
      currentText:
        currentTurn.rawText,

      threadRecentMessages:
        this.asArray(
          threadContext.recentTurns
        ).map(turn =>
          turn.text
        ),

      activeEntities:
        semanticStructure.entities,

      activeConstraints:
        semanticStructure.constraints,

      unresolvedItems:
        semanticStructure.unresolved,

      keyFacts:
        semanticStructure.claims.map(
          claim => ({
            type:
              "semantic_claim",

            claim:
              claim.proposition,

            confidence:
              claim.confidence,

            source:
              "ari-thread-understanding-engine",

            evidenceRefs:
              claim.evidenceRefs
          })
        ),

      // Explicitly retired semantic-authority aliases.
      semanticFrame:
        null,

      activeSemanticFrame:
        null,

      activeSituation:
        null,

      situationFrame:
        null,

      decisionStructure:
        null,

      centralTradeoff:
        null,

      hardConstraints:
        [],

      openQuestions:
        [],

      workingContext:
        null,

      threadWorkingContext:
        null,

      resolvedMeaning:
        null,

      threadResolvedMeaning:
        null,

      activeDialogueState:
        null,

      threadActiveDialogueState:
        null,

      nextBestMove:
        null,

      domainSignals:
        [],

      intentSignals:
        [],

      confidence:
        semanticStructure.confidence,

      warnings:
        semanticStructure.warnings,

      authority:
        "semantic_structure_only"
    };
  },

  /* =====================================================
     REFERENCE + NODE HELPERS
  ===================================================== */

  resolveKnownRefs(
    values = [],
    nodes = []
  ) {
    return this.asArray(values)
      .map(value =>
        this.resolveSingleKnownRef(
          value,
          nodes
        )
      )
      .filter(Boolean);
  },

  resolveSingleKnownRef(
    value = null,
    nodes = []
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    if (
      typeof value === "object"
    ) {
      if (value.id) {
        return value.id;
      }

      value =
        value.value ||
        value.surface ||
        value.label ||
        value.name ||
        value.claim ||
        value.proposition ||
        null;
    }

    const normalized =
      this.normalize(value);

    if (!normalized) {
      return null;
    }

    const match =
      this.asArray(nodes)
        .find(node =>
          [
            node.id,
            node.surface,
            node.normalizedValue,
            node.label,
            node.name,
            node.proposition,
            node.value
          ].some(candidate =>
            this.normalize(candidate) ===
            normalized
          )
        );

    return match?.id ||
      null;
  },

  findUserEntityRef(
    entities = []
  ) {
    return (
      entities.find(entity =>
        entity.normalizedValue ===
          "user" ||
        entity.subtype ===
          "speaker"
      )?.id ||
      null
    );
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  hasQuestionForm(text = "") {
    return (
      String(text).includes("?") ||
      /^(?:what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(
        this.normalize(text)
      )
    );
  },

  isPureQuestionFragment(text = "") {
    return /^(?:why|how|how so|what|what else|then what|really)\??$/.test(
      this.normalize(text)
    );
  },

  groupBy(
    items = [],
    field = "semanticClass"
  ) {
    return items.reduce(
      (
        groups,
        item
      ) => {
        const key =
          item?.[field] ||
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

  dedupeBySemanticValue(
    items = []
  ) {
    const seen =
      new Map();

    items.forEach(item => {
      if (!item) {
        return;
      }

      const value =
        this.extractSemanticValue(
          item
        );

      const type =
        this.normalize(
          item.entityType ||
          item.eventType ||
          item.relationType ||
          item.referenceType ||
          item.type ||
          item.name ||
          item.semanticClass ||
          "unknown"
        );

      const key =
        `${type}|${this.normalize(
          value
        )}`;

      if (
        !value ||
        key === "unknown|"
      ) {
        return;
      }

      if (!seen.has(key)) {
        seen.set(
          key,
          {
            ...item
          }
        );

        return;
      }

      const existing =
        seen.get(key);

      existing.confidence =
        Math.max(
          Number(
            existing.confidence ||
            0
          ),

          Number(
            item.confidence ||
            0
          )
        );

      existing.evidenceRefs = [
        ...new Set([
          ...this.asArray(
            existing.evidenceRefs
          ),

          ...this.asArray(
            item.evidenceRefs
          )
        ])
      ];
    });

    return [...seen.values()];
  },

  dedupeGraphItems(
    items = []
  ) {
    const seen =
      new Set();

    return items.filter(item => {
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

  extractSemanticValue(
    item = null
  ) {
    if (
      item === null ||
      item === undefined
    ) {
      return "";
    }

    if (
      typeof item === "string" ||
      typeof item === "number"
    ) {
      return this.clean(item);
    }

    return this.clean(
      item.normalizedValue ||
      item.proposition ||
      item.surface ||
      item.label ||
      item.name ||
      item.value ||
      item.claim ||
      item.evidence ||
      item.numericValue ||
      item.id ||
      ""
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
      index < text.length;
      index += 1
    ) {
      hash ^=
        text.charCodeAt(index);

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

window.Ari.threadUnderstandingEngine =
  window.AriThreadUnderstandingEngine;

console.log(
  "ARI THREAD UNDERSTANDING ENGINE LOADED:",
  window.AriThreadUnderstandingEngine?.version
);