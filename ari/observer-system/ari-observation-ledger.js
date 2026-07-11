// ari/observer-system/ari-observation-ledger.js
// Ari Observation Ledger
// Purpose: Preserve normalized evidence, semantic observations,
// provenance, contradictions, and confidence without making decisions.
// V2.0.0 — Canonical Semantic Evidence Ledger

window.Ari = window.Ari || {};

window.Ari.observationLedger = {
  version: "2.0.0",

  observationCounter: 0,

  // ===================================================
  // Ledger creation
  // ===================================================

  create(initialObservations = []) {
    const ledger = [];

    if (!Array.isArray(initialObservations)) {
      return ledger;
    }

    initialObservations.forEach(observation => {
      this.add(ledger, observation);
    });

    return ledger;
  },

  // ===================================================
  // Canonical observation creation
  // ===================================================

  createObservation(input = {}) {
    const type =
      input.type ||
      input.signalType ||
      input.category ||
      "unknown";

    const value =
      input.value ??
      input.signal ??
      input.name ??
      "unknown";

    const evidenceClass =
      input.evidenceClass ||
      this.normalizeLegacyObservationType(
        input.observationType
      );

    const inferenceLevel =
      input.inferenceLevel ||
      this.resolveInferenceLevel(evidenceClass);

    const confidence =
      this.normalizeConfidence(
        input.confidence ?? 0.5
      );

    const observation = {
      id:
        input.id ||
        this.createObservationId(),

      type:
        this.normalizeToken(type),

      value:
        this.normalizeValue(value),

      // Compatibility alias
      signal:
        input.signal ||
        this.normalizeValue(value),

      category:
        this.normalizeToken(
          input.category ||
          this.categoryFromType(type)
        ),

      domain:
        this.normalizeToken(
          input.domain ||
          "general"
        ),

      subject:
        this.normalizeNullableValue(
          input.subject
        ),

      target:
        this.normalizeNullableValue(
          input.target
        ),

      relation:
        this.normalizeNullableValue(
          input.relation
        ),

      operation:
        this.normalizeNullableValue(
          input.operation
        ),

      requestedOutput:
        this.normalizeNullableValue(
          input.requestedOutput
        ),

      evidence:
        this.normalizeEvidence(
          input.evidence
        ),

      evidenceClass,

      inferenceLevel,

      // Compatibility alias
      observationType:
        input.observationType ||
        evidenceClass,

      confidence,

      confidenceLabel:
        this.confidenceLabel(confidence),

      certainty:
        input.certainty ||
        this.certaintyFromEvidenceClass(
          evidenceClass,
          confidence
        ),

      polarity:
        input.polarity ||
        (
          input.negated === true
            ? "negated"
            : "affirmed"
        ),

      negated:
        input.negated === true,

      temporalStatus:
        input.temporalStatus ||
        "current",

      tense:
        input.tense ||
        null,

      lifespan:
        input.lifespan ||
        "turn",

      status:
        input.status ||
        "active",

      source:
        input.source ||
        "unknown",

      sourceVersion:
        input.sourceVersion ||
        null,

      sourceStage:
        input.sourceStage ||
        "perception",

      supports:
        this.normalizeReferenceArray(
          input.supports
        ),

      contradicts:
        this.normalizeReferenceArray(
          input.contradicts
        ),

      blocks:
        this.normalizeReferenceArray(
          input.blocks
        ),

      supersedes:
        input.supersedes ||
        null,

      supersededBy:
        input.supersededBy ||
        null,

      corroborationCount:
        Number(
          input.corroborationCount || 1
        ),

      contradictionCount:
        Number(
          input.contradictionCount || 0
        ),

      tags:
        this.normalizeStringArray(
          input.tags
        ),

      metadata:
        this.normalizeMetadata(
          input.metadata
        ),

      confidenceHistory:
        Array.isArray(input.confidenceHistory)
          ? [...input.confidenceHistory]
          : [
              {
                confidence,
                source:
                  input.source ||
                  "unknown",
                reason:
                  input.confidenceReason ||
                  "initial_observation",
                timestamp:
                  new Date().toISOString()
              }
            ],

      createdAt:
        input.createdAt ||
        new Date().toISOString(),

      updatedAt:
        input.updatedAt ||
        new Date().toISOString()
    };

    observation.weight =
      input.weight ??
      this.weightObservation(
        observation
      );

    observation.dedupeKey =
      input.dedupeKey ||
      this.buildDedupeKey(
        observation
      );

    return observation;
  },

  // ===================================================
  // Add / merge
  // ===================================================

  add(ledger = [], input = {}) {
    if (!Array.isArray(ledger)) {
      return ledger;
    }

    const observation =
      this.isCanonicalObservation(input)
        ? this.createObservation(input)
        : this.createObservation(
            this.translateLegacyObservation(input)
          );

    const existingIndex =
      ledger.findIndex(item => {
        return (
          item.id === observation.id ||
          item.dedupeKey === observation.dedupeKey
        );
      });

    if (existingIndex === -1) {
      ledger.push(observation);

      this.linkContradictions(
        ledger,
        observation
      );

      return ledger;
    }

    ledger[existingIndex] =
      this.mergeObservations(
        ledger[existingIndex],
        observation
      );

    this.linkContradictions(
      ledger,
      ledger[existingIndex]
    );

    return ledger;
  },

  addMany(ledger = [], observations = []) {
    if (!Array.isArray(ledger)) {
      return ledger;
    }

    if (!Array.isArray(observations)) {
      return ledger;
    }

    observations.forEach(observation => {
      this.add(ledger, observation);
    });

    return ledger;
  },

  mergeObservations(
    existing = {},
    incoming = {}
  ) {
    const confidence =
      Math.max(
        this.normalizeConfidence(
          existing.confidence
        ),
        this.normalizeConfidence(
          incoming.confidence
        )
      );

    const mergedSources =
      this.uniqueValues([
        existing.source,
        incoming.source,
        ...(existing.metadata?.contributingSources || []),
        ...(incoming.metadata?.contributingSources || [])
      ]);

    return {
      ...existing,

      confidence,
      confidenceLabel:
        this.confidenceLabel(confidence),

      evidence:
        this.mergeEvidence(
          existing.evidence,
          incoming.evidence
        ),

      supports:
        this.uniqueValues([
          ...(existing.supports || []),
          ...(incoming.supports || [])
        ]),

      contradicts:
        this.uniqueValues([
          ...(existing.contradicts || []),
          ...(incoming.contradicts || [])
        ]),

      blocks:
        this.uniqueValues([
          ...(existing.blocks || []),
          ...(incoming.blocks || [])
        ]),

      tags:
        this.uniqueValues([
          ...(existing.tags || []),
          ...(incoming.tags || [])
        ]),

      corroborationCount:
        Number(
          existing.corroborationCount || 1
        ) + 1,

      confidenceHistory: [
        ...(existing.confidenceHistory || []),
        {
          confidence:
            this.normalizeConfidence(
              incoming.confidence
            ),

          source:
            incoming.source ||
            "unknown",

          reason:
            "corroborating_observation",

          timestamp:
            new Date().toISOString()
        }
      ],

      metadata: {
        ...(existing.metadata || {}),
        ...(incoming.metadata || {}),

        contributingSources:
          mergedSources
      },

      updatedAt:
        new Date().toISOString(),

      weight:
        this.weightObservation({
          ...existing,
          confidence,
          corroborationCount:
            Number(
              existing.corroborationCount || 1
            ) + 1
        })
    };
  },

  // ===================================================
  // Contradiction detection
  // ===================================================

  linkContradictions(
    ledger = [],
    observation = {}
  ) {
    if (!Array.isArray(ledger)) {
      return ledger;
    }

    ledger.forEach(candidate => {
      if (
        !candidate ||
        candidate.id === observation.id
      ) {
        return;
      }

      if (
        !this.observationsContradict(
          observation,
          candidate
        )
      ) {
        return;
      }

      observation.contradicts =
        this.uniqueValues([
          ...(observation.contradicts || []),
          candidate.id
        ]);

      candidate.contradicts =
        this.uniqueValues([
          ...(candidate.contradicts || []),
          observation.id
        ]);

      observation.contradictionCount =
        observation.contradicts.length;

      candidate.contradictionCount =
        candidate.contradicts.length;
    });

    return ledger;
  },

  observationsContradict(
    first = {},
    second = {}
  ) {
    if (
      first.type !== second.type ||
      first.subject !== second.subject ||
      first.target !== second.target
    ) {
      return false;
    }

    if (
      first.value === second.value &&
      first.polarity !== second.polarity
    ) {
      return true;
    }

    const incompatibleValues =
      this.incompatibleValuePairs[
        first.type
      ] || [];

    return incompatibleValues.some(pair => {
      return (
        (
          pair[0] === first.value &&
          pair[1] === second.value
        ) ||
        (
          pair[1] === first.value &&
          pair[0] === second.value
        )
      );
    });
  },

  incompatibleValuePairs: {
    continuity: [
      ["standalone", "follow_up"],
      ["new_topic", "continuation"]
    ],

    correction_status: [
      ["correction", "not_correction"]
    ],

    certainty: [
      ["certain", "uncertain"]
    ],

    polarity: [
      ["affirmed", "denied"]
    ],

    urgency: [
      ["urgent", "non_urgent"]
    ],

    safety_status: [
      ["risk_present", "risk_absent"]
    ]
  },

  // ===================================================
  // Observation lifecycle
  // ===================================================

  updateStatus(
    ledger = [],
    observationId = "",
    status = "active",
    reason = null
  ) {
    const observation =
      ledger.find(item => {
        return item.id === observationId;
      });

    if (!observation) {
      return null;
    }

    observation.status = status;
    observation.updatedAt =
      new Date().toISOString();

    observation.metadata = {
      ...(observation.metadata || {}),
      statusReason:
        reason ||
        observation.metadata?.statusReason ||
        null
    };

    return observation;
  },

  confirm(
    ledger = [],
    observationId = "",
    reason = "user_confirmed"
  ) {
    const observation =
      ledger.find(item => {
        return item.id === observationId;
      });

    if (!observation) {
      return null;
    }

    observation.status = "confirmed";
    observation.evidenceClass =
      "user_confirmed";
    observation.inferenceLevel =
      "observed";
    observation.confidence = 1;
    observation.confidenceLabel =
      "confirmed";
    observation.weight =
      this.weightObservation(
        observation
      );

    observation.confidenceHistory = [
      ...(observation.confidenceHistory || []),
      {
        confidence: 1,
        source: "user",
        reason,
        timestamp:
          new Date().toISOString()
      }
    ];

    observation.updatedAt =
      new Date().toISOString();

    return observation;
  },

  supersede(
    ledger = [],
    oldObservationId = "",
    replacementObservation = {}
  ) {
    const oldObservation =
      ledger.find(item => {
        return item.id === oldObservationId;
      });

    if (!oldObservation) {
      return null;
    }

    const replacement =
      this.createObservation({
        ...replacementObservation,
        supersedes:
          oldObservationId
      });

    oldObservation.status =
      "superseded";
    oldObservation.supersededBy =
      replacement.id;
    oldObservation.updatedAt =
      new Date().toISOString();

    ledger.push(replacement);

    return replacement;
  },

  withdraw(
    ledger = [],
    observationId = "",
    reason = "withdrawn"
  ) {
    return this.updateStatus(
      ledger,
      observationId,
      "withdrawn",
      reason
    );
  },

  // ===================================================
  // Confidence updates
  // ===================================================

  updateConfidence(
    ledger = [],
    observationId = "",
    confidence = 0.5,
    source = "unknown",
    reason = "confidence_update"
  ) {
    const observation =
      ledger.find(item => {
        return item.id === observationId;
      });

    if (!observation) {
      return null;
    }

    const normalized =
      this.normalizeConfidence(
        confidence
      );

    observation.confidence =
      normalized;

    observation.confidenceLabel =
      this.confidenceLabel(
        normalized
      );

    observation.weight =
      this.weightObservation(
        observation
      );

    observation.confidenceHistory = [
      ...(observation.confidenceHistory || []),
      {
        confidence: normalized,
        source,
        reason,
        timestamp:
          new Date().toISOString()
      }
    ];

    observation.updatedAt =
      new Date().toISOString();

    return observation;
  },

  // ===================================================
  // Ranking
  // ===================================================

  rank(ledger = [], options = {}) {
    if (!Array.isArray(ledger)) {
      return [];
    }

    const includeInactive =
      options.includeInactive === true;

    return ledger
      .filter(observation => {
        return (
          includeInactive ||
          ["active", "confirmed"].includes(
            observation.status
          )
        );
      })
      .map(observation => ({
        ...observation,

        weight:
          this.weightObservation(
            observation
          )
      }))
      .sort((a, b) => {
        if (b.weight !== a.weight) {
          return b.weight - a.weight;
        }

        return (
          b.confidence -
          a.confidence
        );
      });
  },

  weightObservation(
    observationOrType = {},
    legacyConfidence = 0.5
  ) {
    if (
      typeof observationOrType ===
      "string"
    ) {
      const evidenceClass =
        this.normalizeLegacyObservationType(
          observationOrType
        );

      return Math.round(
        this.baseEvidenceWeight(
          evidenceClass
        ) *
        this.normalizeConfidence(
          legacyConfidence
        )
      );
    }

    const observation =
      observationOrType || {};

    const base =
      this.baseEvidenceWeight(
        observation.evidenceClass ||
        observation.observationType ||
        "hypothesis"
      );

    const confidence =
      this.normalizeConfidence(
        observation.confidence
      );

    const specificityBonus =
      this.specificityBonus(
        observation
      );

    const corroborationBonus =
      Math.min(
        0.12,
        Math.max(
          0,
          Number(
            observation.corroborationCount || 1
          ) - 1
        ) * 0.03
      );

    const contradictionPenalty =
      Math.min(
        0.25,
        Number(
          observation.contradictionCount || 0
        ) * 0.08
      );

    const inactivePenalty =
      ["withdrawn", "superseded"].includes(
        observation.status
      )
        ? 0.75
        : 0;

    const score =
      (
        base * 0.45 +
        confidence * 0.45 +
        specificityBonus +
        corroborationBonus -
        contradictionPenalty -
        inactivePenalty
      ) * 100;

    return this.clamp100(
      Math.round(score)
    );
  },

  baseEvidenceWeight(
    evidenceClass = "hypothesis"
  ) {
    const weights = {
      user_confirmed: 1,
      direct_quote: 0.98,
      direct_text: 0.95,
      structured_input: 0.92,
      repeated_pattern: 0.82,
      system_observation: 0.76,
      strong_inference: 0.7,
      system_inference: 0.62,
      weak_inference: 0.48,
      hypothesis: 0.38,
      weak_hint: 0.24,
      assumption: 0.18,
      prediction: 0.16,
      external_knowledge: 0.75,
      user_memory: 0.72,
      thread_memory: 0.65
    };

    return (
      weights[evidenceClass] ??
      0.38
    );
  },

  specificityBonus(
    observation = {}
  ) {
    let bonus = 0;

    if (observation.subject) {
      bonus += 0.03;
    }

    if (observation.target) {
      bonus += 0.03;
    }

    if (observation.relation) {
      bonus += 0.03;
    }

    if (
      Array.isArray(observation.evidence) &&
      observation.evidence.some(item => {
        return Boolean(
          item?.text ||
          Number.isFinite(item?.start)
        );
      })
    ) {
      bonus += 0.04;
    }

    return Math.min(
      0.13,
      bonus
    );
  },

  // ===================================================
  // Query helpers
  // ===================================================

  getActive(ledger = []) {
    return ledger.filter(item => {
      return [
        "active",
        "confirmed"
      ].includes(item.status);
    });
  },

  getById(
    ledger = [],
    observationId = ""
  ) {
    return (
      ledger.find(item => {
        return item.id === observationId;
      }) ||
      null
    );
  },

  getByType(
    ledger = [],
    type = ""
  ) {
    const normalized =
      this.normalizeToken(type);

    return this.rank(
      ledger.filter(item => {
        return item.type === normalized;
      })
    );
  },

  getByValue(
    ledger = [],
    value = ""
  ) {
    const normalized =
      this.normalizeValue(value);

    return this.rank(
      ledger.filter(item => {
        return item.value === normalized;
      })
    );
  },

  getByCategory(
    ledger = [],
    category = ""
  ) {
    const normalized =
      this.normalizeToken(category);

    return this.rank(
      ledger.filter(item => {
        return item.category === normalized;
      })
    );
  },

  getByDomain(
    ledger = [],
    domain = ""
  ) {
    const normalized =
      this.normalizeToken(domain);

    return this.rank(
      ledger.filter(item => {
        return item.domain === normalized;
      })
    );
  },

  getBySource(
    ledger = [],
    source = ""
  ) {
    return this.rank(
      ledger.filter(item => {
        return item.source === source;
      })
    );
  },

  getBySubject(
    ledger = [],
    subject = ""
  ) {
    const normalized =
      this.normalizeNullableValue(
        subject
      );

    return this.rank(
      ledger.filter(item => {
        return item.subject === normalized;
      })
    );
  },

  getDirectEvidence(
    ledger = []
  ) {
    return this.rank(
      ledger.filter(item => {
        return [
          "user_confirmed",
          "direct_quote",
          "direct_text",
          "structured_input"
        ].includes(
          item.evidenceClass
        );
      })
    );
  },

  getInferences(
    ledger = []
  ) {
    return this.rank(
      ledger.filter(item => {
        return [
          "strong_inference",
          "system_inference",
          "weak_inference",
          "hypothesis",
          "assumption",
          "prediction"
        ].includes(
          item.evidenceClass
        );
      })
    );
  },

  getHypotheses(
    ledger = []
  ) {
    return this.rank(
      ledger.filter(item => {
        return [
          "hypothesis",
          "weak_hint",
          "assumption",
          "prediction"
        ].includes(
          item.evidenceClass
        );
      })
    );
  },

  getContradicted(
    ledger = []
  ) {
    return this.rank(
      ledger.filter(item => {
        return (
          Array.isArray(
            item.contradicts
          ) &&
          item.contradicts.length > 0
        );
      })
    );
  },

  getUnresolved(
    ledger = []
  ) {
    return this.rank(
      ledger.filter(item => {
        return (
          item.status === "active" &&
          (
            item.confidence < 0.65 ||
            item.inferenceLevel ===
              "hypothesized" ||
            item.contradictionCount > 0
          )
        );
      })
    );
  },

  getStrongest(
    ledger = [],
    filter = {}
  ) {
    let candidates = [...ledger];

    if (filter.type) {
      candidates =
        candidates.filter(item => {
          return (
            item.type ===
            this.normalizeToken(
              filter.type
            )
          );
        });
    }

    if (filter.category) {
      candidates =
        candidates.filter(item => {
          return (
            item.category ===
            this.normalizeToken(
              filter.category
            )
          );
        });
    }

    if (filter.domain) {
      candidates =
        candidates.filter(item => {
          return (
            item.domain ===
            this.normalizeToken(
              filter.domain
            )
          );
        });
    }

    if (filter.subject) {
      candidates =
        candidates.filter(item => {
          return (
            item.subject ===
            this.normalizeNullableValue(
              filter.subject
            )
          );
        });
    }

    return (
      this.rank(candidates)[0] ||
      null
    );
  },

  strongestByCategory(
    ledger = [],
    category = "unknown"
  ) {
    return this.getStrongest(
      ledger,
      {
        category
      }
    );
  },

  hasDirectSignal(
    ledger = [],
    signal = ""
  ) {
    const normalized =
      this.normalizeValue(signal);

    return ledger.some(item => {
      return (
        (
          item.signal === normalized ||
          item.value === normalized
        ) &&
        [
          "user_confirmed",
          "direct_quote",
          "direct_text",
          "structured_input"
        ].includes(
          item.evidenceClass
        )
      );
    });
  },

  // ===================================================
  // Semantic grouping
  // ===================================================

  groupByType(ledger = []) {
    return this.groupBy(
      ledger,
      "type"
    );
  },

  groupByCategory(ledger = []) {
    return this.groupBy(
      ledger,
      "category"
    );
  },

  groupByDomain(ledger = []) {
    return this.groupBy(
      ledger,
      "domain"
    );
  },

  groupBySubject(ledger = []) {
    return this.groupBy(
      ledger,
      "subject"
    );
  },

  groupBy(
    ledger = [],
    field = "type"
  ) {
    return ledger.reduce(
      (groups, observation) => {
        const key =
          observation[field] ||
          "unknown";

        groups[key] =
          groups[key] || [];

        groups[key].push(
          observation
        );

        return groups;
      },
      {}
    );
  },

  // ===================================================
  // Summary
  // ===================================================

  summarize(ledger = []) {
    const ranked =
      this.rank(ledger);

    const active =
      this.getActive(ledger);

    const direct =
      this.getDirectEvidence(ledger);

    const inferences =
      this.getInferences(ledger);

    const contradicted =
      this.getContradicted(ledger);

    const unresolved =
      this.getUnresolved(ledger);

    return {
      observationLedgerRan: true,
      observationLedgerVersion:
        this.version,

      observationCount:
        ledger.length,

      activeObservationCount:
        active.length,

      directEvidenceCount:
        direct.length,

      inferenceCount:
        inferences.length,

      contradictionCount:
        contradicted.length,

      unresolvedCount:
        unresolved.length,

      strongestObservation:
        ranked[0]?.value ||
        ranked[0]?.signal ||
        null,

      strongestObservationType:
        ranked[0]?.type ||
        null,

      strongestObservationCategory:
        ranked[0]?.category ||
        null,

      strongestObservationConfidence:
        ranked[0]?.confidence ??
        0,

      strongestObservationWeight:
        ranked[0]?.weight ??
        0,

      groupedByType:
        this.groupByType(active),

      groupedByCategory:
        this.groupByCategory(active),

      groupedByDomain:
        this.groupByDomain(active),

      rankedObservations:
        ranked.slice(0, 25),

      unresolvedObservations:
        unresolved.slice(0, 15),

      contradictedObservations:
        contradicted.slice(0, 15),

      authority: {
        canStoreEvidence: true,
        canNormalizeEvidence: true,
        canTrackContradictions: true,
        canTrackConfidence: true,

        canChooseIntent: false,
        canChooseMode: false,
        canChooseRoute: false,
        canSelectFrame: false,
        canDetermineSafetySeverity: false,
        canReason: false,
        canAnswerUser: false,

        role:
          "canonical_semantic_evidence_storage"
      }
    };
  },

  // ===================================================
  // Legacy translation
  // ===================================================

  translateLegacyObservation(
    observation = {}
  ) {
    return {
      ...observation,

      type:
        observation.type ||
        observation.category ||
        observation.signal ||
        "unknown",

      value:
        observation.value ??
        observation.signal ??
        observation.name ??
        "unknown",

      category:
        observation.category ||
        this.categoryFromType(
          observation.type
        ),

      evidenceClass:
        observation.evidenceClass ||
        this.normalizeLegacyObservationType(
          observation.observationType
        ),

      inferenceLevel:
        observation.inferenceLevel ||
        this.resolveInferenceLevel(
          observation.evidenceClass ||
          observation.observationType
        )
    };
  },

  normalizeLegacyObservationType(
    type = "hypothesis"
  ) {
    const mapping = {
      direct_text:
        "direct_text",

      user_confirmed:
        "user_confirmed",

      repeated_pattern:
        "repeated_pattern",

      system_inference:
        "system_inference",

      hypothesis:
        "hypothesis",

      weak_hint:
        "weak_hint"
    };

    return (
      mapping[type] ||
      type ||
      "hypothesis"
    );
  },

  isCanonicalObservation(
    observation = {}
  ) {
    return Boolean(
      observation &&
      observation.type &&
      observation.value !== undefined
    );
  },

  // ===================================================
  // Normalization
  // ===================================================

  normalizeConfidence(
    value = 0.5
  ) {
    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return 0.5;
    }

    if (number > 1) {
      return this.clamp01(
        number / 100
      );
    }

    return this.clamp01(number);
  },

  confidenceLabel(
    confidence = 0.5
  ) {
    const value =
      this.normalizeConfidence(
        confidence
      );

    if (value >= 0.99) {
      return "confirmed";
    }

    if (value >= 0.85) {
      return "very_high";
    }

    if (value >= 0.7) {
      return "high";
    }

    if (value >= 0.5) {
      return "medium";
    }

    if (value >= 0.3) {
      return "low";
    }

    return "very_low";
  },

  certaintyFromEvidenceClass(
    evidenceClass = "hypothesis",
    confidence = 0.5
  ) {
    if (
      evidenceClass ===
      "user_confirmed"
    ) {
      return "confirmed";
    }

    if (
      [
        "direct_quote",
        "direct_text",
        "structured_input"
      ].includes(evidenceClass)
    ) {
      return "explicit";
    }

    if (
      confidence >= 0.75
    ) {
      return "probable";
    }

    if (
      confidence >= 0.5
    ) {
      return "possible";
    }

    return "uncertain";
  },

  resolveInferenceLevel(
    evidenceClass = "hypothesis"
  ) {
    if (
      [
        "user_confirmed",
        "direct_quote",
        "direct_text",
        "structured_input"
      ].includes(evidenceClass)
    ) {
      return "observed";
    }

    if (
      evidenceClass ===
      "repeated_pattern"
    ) {
      return "corroborated";
    }

    if (
      [
        "strong_inference",
        "system_inference",
        "weak_inference"
      ].includes(evidenceClass)
    ) {
      return "inferred";
    }

    if (
      evidenceClass ===
      "prediction"
    ) {
      return "predicted";
    }

    return "hypothesized";
  },

  normalizeEvidence(
    evidence = []
  ) {
    const list =
      Array.isArray(evidence)
        ? evidence
        : evidence === null ||
            evidence === undefined
          ? []
          : [evidence];

    return list
      .map(item => {
        if (
          typeof item === "string"
        ) {
          return {
            text: item,
            sourceField:
              "userMessage",
            start: null,
            end: null,
            metadata: {}
          };
        }

        if (
          item &&
          typeof item === "object"
        ) {
          return {
            text:
              item.text ??
              item.value ??
              item.evidence ??
              null,

            sourceField:
              item.sourceField ||
              item.field ||
              "userMessage",

            start:
              Number.isFinite(
                item.start
              )
                ? item.start
                : null,

            end:
              Number.isFinite(
                item.end
              )
                ? item.end
                : null,

            quote:
              item.quote ||
              null,

            metadata:
              item.metadata &&
              typeof item.metadata ===
                "object"
                ? item.metadata
                : {}
          };
        }

        return null;
      })
      .filter(item => {
        return Boolean(
          item &&
          (
            item.text ||
            item.quote ||
            item.start !== null
          )
        );
      });
  },

  mergeEvidence(
    first = [],
    second = []
  ) {
    const combined = [
      ...this.normalizeEvidence(first),
      ...this.normalizeEvidence(second)
    ];

    const seen =
      new Set();

    return combined.filter(item => {
      const key = [
        item.text || "",
        item.sourceField || "",
        item.start ?? "",
        item.end ?? ""
      ].join("|");

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  },

  normalizeReferenceArray(
    value = []
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return [];
    }

    return this.uniqueValues(
      Array.isArray(value)
        ? value
        : [value]
    );
  },

  normalizeStringArray(
    value = []
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return [];
    }

    const list =
      Array.isArray(value)
        ? value
        : [value];

    return this.uniqueValues(
      list
        .map(item => {
          return String(item || "")
            .trim();
        })
        .filter(Boolean)
    );
  },

  normalizeMetadata(
    metadata = {}
  ) {
    return (
      metadata &&
      typeof metadata === "object" &&
      !Array.isArray(metadata)
        ? { ...metadata }
        : {}
    );
  },

  normalizeToken(value = "") {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, "_")
      .replace(/[^\w]/g, "")
      .replace(/_+/g, "_");
  },

  normalizeValue(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "unknown";
    }

    if (
      typeof value === "string"
    ) {
      return this.normalizeToken(
        value
      );
    }

    if (
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }

    return String(value);
  },

  normalizeNullableValue(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    return this.normalizeValue(value);
  },

  categoryFromType(
    type = ""
  ) {
    const normalized =
      this.normalizeToken(type);

    const categoryMap = {
      speech_act:
        "communication",

      question_shape:
        "communication",

      conversation_function:
        "communication",

      requested_operation:
        "request",

      operation_signal:
        "request",

      requested_output:
        "request",

      output_expectation:
        "request",

      person_reference:
        "entity",

      entity_reference:
        "entity",

      relationship_reference:
        "relationship",

      family_reference:
        "relationship",

      temporal_reference:
        "time",

      time_reference:
        "time",

      emotion:
        "emotion",

      emotional_signal:
        "emotion",

      body_symptom:
        "medical",

      body_context:
        "medical",

      safety_signal:
        "safety",

      life_event:
        "life_context",

      life_transition_signal:
        "life_context",

      continuity:
        "continuity",

      reference_signal:
        "continuity",

      missing_anchor_signal:
        "ambiguity",

      ambiguity_signal:
        "ambiguity",

      domain_signal:
        "domain"
    };

    return (
      categoryMap[normalized] ||
      "observation"
    );
  },

  buildDedupeKey(
    observation = {}
  ) {
    const evidenceKey =
      (observation.evidence || [])
        .map(item => {
          return [
            item.text || "",
            item.start ?? "",
            item.end ?? ""
          ].join(":");
        })
        .join(",");

    return [
      observation.type,
      observation.value,
      observation.subject,
      observation.target,
      observation.relation,
      observation.polarity,
      observation.temporalStatus,
      evidenceKey
    ]
      .map(value => {
        return String(
          value ?? ""
        );
      })
      .join("|");
  },

  createObservationId() {
    this.observationCounter += 1;

    if (
      typeof crypto !==
        "undefined" &&
      typeof crypto.randomUUID ===
        "function"
    ) {
      return `obs_${crypto.randomUUID()}`;
    }

    return [
      "obs",
      Date.now(),
      this.observationCounter
    ].join("_");
  },

  uniqueValues(values = []) {
    return [
      ...new Set(
        values.filter(value => {
          return (
            value !== null &&
            value !== undefined &&
            value !== ""
          );
        })
      )
    ];
  },

  clamp01(value = 0) {
    return Math.max(
      0,
      Math.min(
        1,
        Number(value) || 0
      )
    );
  },

  clamp100(value = 0) {
    return Math.max(
      0,
      Math.min(
        100,
        Number(value) || 0
      )
    );
  },

  // Backward compatibility
  clamp(value = 0) {
    return this.clamp100(value);
  }
};

console.log(
  "ARI OBSERVATION LEDGER LOADED:",
  window.Ari.observationLedger?.version
);