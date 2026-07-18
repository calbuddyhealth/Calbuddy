// ari/perception/ari-evidence-builder.js
// Ari Evidence Builder
//
// Purpose:
// Convert deterministic perception outputs into one canonical evidence packet.
// This engine records what is present. It does not decide what the user means.
//
// V1.0.0 — Deterministic Perception Evidence Contract

window.Ari = window.Ari || {};

window.AriEvidenceBuilder = {
  version: "1.0.0",
  schemaVersion: "1.0.0",
  source: "ari-evidence-builder",
  authorityLevel: "deterministic_perception_evidence",

  build(input = {}) {
    const summary = input.summary || input || {};
    const originalText = this.readOriginalText(summary);
    const normalizedText = this.normalizeText(originalText);
    const turnId = this.readTurnId(summary);
    const observations = this.readObservations(summary);
    const extractedFacts = this.buildExtractedFacts({
      summary,
      originalText,
      normalizedText,
      turnId,
      observations
    });
    const explicitSignals = this.buildExplicitSignals({
      summary,
      originalText,
      observations
    });
    const continuityEvidence = this.buildContinuityEvidence({
      summary,
      turnId,
      observations
    });
    const contextEvidence = this.buildContextEvidence({
      summary,
      observations
    });
    const artifactEvidence = this.buildArtifactEvidence({
      summary,
      extractedFacts,
      observations
    });
    const sourceIndex = this.buildSourceIndex({
      summary,
      turnId,
      observations
    });
    const quality = this.buildQuality({
      observations,
      extractedFacts,
      sourceIndex
    });

    const packetId =
      this.clean(summary.evidencePacketId) ||
      `evidence_${turnId || this.makeId("turn")}`;

    const evidencePacket = {
      schema: "ari.evidence_packet",
      schemaVersion: this.schemaVersion,
      packetId,
      turnId,
      createdAt: new Date().toISOString(),

      turn: {
        originalText,
        normalizedText,
        language:
          this.clean(summary.language) ||
          this.clean(summary.detectedLanguage) ||
          null,
        wordCount: normalizedText
          ? normalizedText.split(/\s+/).filter(Boolean).length
          : 0,
        punctuation: {
          hasQuestionMark: originalText.includes("?"),
          hasExclamation: originalText.includes("!")
        },
        surfaceFeatures: {
          isShortTurn:
            normalizedText.length > 0 &&
            normalizedText.split(/\s+/).length <= 12,
          isVeryShortTurn:
            normalizedText.length > 0 &&
            normalizedText.split(/\s+/).length <= 4,
          containsProfanity:
            summary.hasProfanity === true ||
            summary.profanityDetected === true
        }
      },

      observations,
      extractedFacts,
      explicitSignals,
      continuityEvidence,
      contextEvidence,
      artifactEvidence,
      sourceIndex,
      quality,

      provenance: {
        deterministicExtractionOnly: true,
        semanticInterpretationPerformed: false,
        operationSelected: false,
        userGoalSelected: false,
        requestedOutputSelected: false,
        semanticFrameConstructed: false,
        enginesUsed: this.unique([
          ...this.asArray(summary.observerSources),
          observations.length ? "observer-network" : null,
          this.source
        ])
      },

      authority: {
        canNormalizeText: true,
        canAggregateObservations: true,
        canExtractExplicitSurfaceFacts: true,
        canRecordReferenceCandidates: true,
        canIndexEvidence: true,
        canInterpretMeaning: false,
        canSelectIntent: false,
        canSelectOperation: false,
        canSelectRequestedOutput: false,
        canDetermineUserGoal: false,
        canConstructSemanticFrame: false,
        canChooseResponseStrategy: false,
        canAuthorizeExecution: false,
        canAnswerUser: false,
        role: "deterministic_perception_evidence"
      }
    };

    const validation = this.validateEvidencePacket(evidencePacket);

    return {
      evidenceBuilderRan: true,
      evidenceBuilderReady: validation.valid,
      evidenceBuilderSource: this.source,
      evidenceBuilderVersion: this.version,
      evidencePacket,
      evidenceBuilderValidation: validation
    };
  },

  create(input = {}) {
    return this.build(input);
  },

  validateEvidencePacket(packet = {}) {
    const errors = [];
    const warnings = [];

    if (packet?.schema !== "ari.evidence_packet") {
      errors.push("invalid_evidence_packet_schema");
    }

    if (!packet?.packetId) {
      errors.push("missing_evidence_packet_id");
    }

    if (!packet?.turn || typeof packet.turn !== "object") {
      errors.push("missing_evidence_turn");
    }

    if (!Array.isArray(packet?.observations)) {
      errors.push("observations_must_be_array");
    }

    if (!packet?.sourceIndex || typeof packet.sourceIndex !== "object") {
      errors.push("missing_source_index");
    }

    if (!packet?.turn?.originalText) {
      warnings.push("empty_original_text");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  },

  readOriginalText(summary = {}) {
    return this.clean(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.turn?.originalText ||
      summary.turn?.text ||
      summary.normalizedMessage ||
      ""
    );
  },

  readTurnId(summary = {}) {
    return this.clean(
      summary.turnId ||
      summary.turn?.turnId ||
      summary.requestEnvelope?.turn?.turnId ||
      ""
    ) || null;
  },

  readObservations(summary = {}) {
    const candidates = [
      summary.canonicalObservationLedger,
      summary.observationLedger,
      summary.observations,
      summary.observerEvidence?.observations,
      summary.observerNetworkResult?.observations,
      summary.perceptionObservations
    ];

    const raw = candidates.find(Array.isArray) || [];

    return raw
      .filter(item => item && typeof item === "object")
      .map((item, index) => this.normalizeObservation(item, index));
  },

  normalizeObservation(item = {}, index = 0) {
    const confidence = this.normalizeConfidence(item.confidence);

    return {
      ...item,
      id:
        this.clean(item.id) ||
        this.clean(item.observationId) ||
        `obs_${String(index + 1).padStart(3, "0")}`,
      type:
        this.normalizeKey(
          item.type ||
          item.observationType ||
          item.signalType ||
          "observation"
        ) || "observation",
      category:
        this.normalizeKey(
          item.category ||
          item.group ||
          item.domain ||
          "general"
        ) || "general",
      value:
        item.value ??
        item.surface ??
        item.text ??
        item.evidence ??
        null,
      surface:
        item.surface ??
        item.text ??
        item.value ??
        null,
      source:
        this.clean(
          item.source ||
          item.sourceId ||
          "observer_network"
        ),
      sourceTurnId:
        this.clean(item.sourceTurnId || item.turnId || "") || null,
      sourceSpan:
        item.sourceSpan && typeof item.sourceSpan === "object"
          ? {
              start: this.toFiniteNumber(item.sourceSpan.start),
              end: this.toFiniteNumber(item.sourceSpan.end)
            }
          : null,
      evidenceClass:
        this.normalizeKey(
          item.evidenceClass ||
          item.origin ||
          "observed"
        ) || "observed",
      inferenceLevel:
        this.normalizeKey(item.inferenceLevel || "observed") ||
        "observed",
      confidence,
      weight: this.toFiniteNumber(item.weight, 1)
    };
  },

  buildExtractedFacts({
    summary = {},
    originalText = "",
    normalizedText = "",
    turnId = null,
    observations = []
  } = {}) {
    return {
      participants: {
        speaker: {
          value: "user",
          evidenceRefs: []
        },
        addressee: {
          value: "assistant",
          evidenceRefs: []
        },
        mentioned: this.normalizeFactArray(
          summary.mentionedParticipants ||
          summary.entities?.participants ||
          []
        )
      },

      quotedContent: this.extractQuotedContent(originalText, turnId),
      entities: this.normalizeEntityArray(
        summary.entities ||
        summary.extractedEntities ||
        summary.questionUnderstanding?.entities ||
        []
      ),
      references: this.normalizeReferenceArray(
        summary.referenceCandidates ||
        summary.references ||
        summary.entityReferenceState?.references ||
        [],
        turnId
      ),
      fileReferences: this.extractFileReferences({
        summary,
        originalText,
        turnId,
        observations
      }),
      symbols: this.extractSymbols({
        summary,
        originalText,
        observations
      }),
      timeExpressions: this.extractTimeExpressions(originalText),
      numericExpressions: this.extractNumericExpressions(originalText),
      literalText: {
        normalizedText,
        evidenceRefs: []
      }
    };
  },

  buildExplicitSignals({
    summary = {},
    originalText = "",
    observations = []
  } = {}) {
    const lower = originalText.toLowerCase();

    const signalGroups = {
      questionSignals: [/\?/g],
      instructionSignals: [
        /\b(?:please|build|create|make|add|remove|update|change|move|disconnect|connect)\b/g
      ],
      comparisonSignals: [
        /\b(?:compare|versus|vs\.?|both|difference between)\b/g
      ],
      recommendationSignals: [
        /\b(?:recommend|choose|which one|best option|prefer)\b/g
      ],
      explanationSignals: [
        /\b(?:explain|why|how does|what is|what are)\b/g
      ],
      planningSignals: [
        /\b(?:plan|roadmap|order|sequence|steps)\b/g
      ],
      writingSignals: [
        /\b(?:write|rewrite|draft|polish|edit the text)\b/g
      ],
      translationSignals: [
        /\b(?:translate|translation)\b/g
      ],
      calculationSignals: [
        /\b(?:calculate|convert|sum|total|percentage)\b/g
      ],
      verificationSignals: [
        /\b(?:verify|review|check|inspect|validate)\b/g
      ],
      executionSignals: [
        /\b(?:implement|modify|apply|deploy|send|delete|execute|run)\b/g
      ],
      executionProhibitionSignals: [
        /\b(?:do not|don't|must not|without changing|analysis only|explain only)\b/g
      ],
      emotionalSignals: [],
      safetySignals: [],
      developerSignals: [
        /\b(?:file|function|class|engine|pipeline|stage|schema|bridge|javascript|code)\b/g
      ]
    };

    const output = {};

    for (const [group, patterns] of Object.entries(signalGroups)) {
      const direct = [];

      for (const pattern of patterns) {
        for (const match of lower.matchAll(pattern)) {
          direct.push({
            surface: originalText.slice(match.index, match.index + match[0].length),
            source: "current_user_turn",
            confidence: 1,
            evidenceRefs: []
          });
        }
      }

      const observed = observations
        .filter(item => {
          const type = this.normalizeKey(item.type);
          const category = this.normalizeKey(item.category);
          const stem = this.normalizeKey(group.replace(/Signals$/, ""));
          return type.includes(stem) || category.includes(stem);
        })
        .map(item => ({
          surface: item.surface,
          source: item.source,
          confidence: item.confidence,
          evidenceRefs: [item.id]
        }));

      const supplied =
        group === "emotionalSignals"
          ? this.asArray(summary.emotionalSignals)
          : group === "safetySignals"
            ? this.asArray(summary.safetySignals)
            : [];

      output[group] = this.dedupeObjects([
        ...direct,
        ...observed,
        ...supplied
      ]);
    }

    return output;
  },

  buildContinuityEvidence({
    summary = {},
    turnId = null
  } = {}) {
    const threadState = summary.threadState || {};
    const recentMessages =
      summary.recentMessages ||
      threadState.lastMessages ||
      [];
    const referenceResolution =
      summary.referenceResolution ||
      summary.entityReferenceState?.referenceResolution ||
      null;

    const referenceItems = this.normalizeReferenceArray(
      summary.referenceCandidates ||
      summary.references ||
      summary.entityReferenceState?.references ||
      [],
      turnId
    );

    return {
      threadAvailable: Boolean(
        summary.threadStateLoaded ||
        recentMessages.length ||
        threadState.currentTopic ||
        threadState.activeSubject ||
        threadState.previousAnswerSummary ||
        threadState.lastFinalResponse
      ),
      referencePresent: referenceItems.length > 0,
      referencesPriorContext:
        referenceItems.length > 0 ||
        summary.referencesPriorContext === true,
      referenceItems,
      activeTopic: this.normalizeContextValue(
        summary.activeTopic ||
        threadState.currentTopic ||
        null,
        "thread_state"
      ),
      activeSubject: this.normalizeContextValue(
        summary.resolvedPrimarySubject ||
        threadState.activeSubject ||
        null,
        "thread_state"
      ),
      previousAnswerSummary:
        threadState.previousAnswerSummary ||
        threadState.lastFinalResponse ||
        summary.previousAnswerSummary ||
        null,
      recentTurnIds: this.asArray(recentMessages)
        .slice(-8)
        .map(item => this.clean(item?.turnId || item?.id || ""))
        .filter(Boolean),
      authoritativeResolutionAvailable:
        Boolean(referenceResolution?.resolved === true),
      authoritativeResolution:
        referenceResolution?.resolved === true
          ? referenceResolution
          : null,
      authority: "continuity_evidence_only"
    };
  },

  buildContextEvidence({
    summary = {},
    observations = []
  } = {}) {
    return {
      domainsObserved: this.normalizeFactArray(
        summary.observedDomains ||
        summary.domainEvidence ||
        observations
          .filter(item => item.category === "domain")
          .map(item => ({
            value: item.value,
            evidenceRefs: [item.id],
            confidence: item.confidence
          }))
      ),
      constraintsObserved: this.normalizeFactArray(
        summary.observedConstraints ||
        summary.constraints ||
        []
      ),
      stakesObserved: this.normalizeFactArray(
        summary.observedStakes ||
        summary.stakes ||
        []
      ),
      emotionalContextObserved: this.normalizeFactArray(
        summary.emotionalContext ||
        summary.emotionalSignals ||
        []
      ),
      memoryContextAvailable: Boolean(
        summary.memoryStagePacket ||
        summary.memoryContext ||
        summary.memoryRetrieved
      ),
      situationContextAvailable: Boolean(
        summary.situationStagePacket ||
        summary.situationContext ||
        summary.situationMap
      ),
      authority: "context_evidence_only"
    };
  },

  buildArtifactEvidence({
    summary = {},
    extractedFacts = {}
  } = {}) {
    const githubFileContext =
      summary.githubFileContext ||
      summary.appContext?.githubFileContext ||
      null;

    const attachedFileContext =
      summary.attachedFileContext ||
      summary.fileContext ||
      null;

    const filePaths = this.unique([
      ...this.asArray(extractedFacts.fileReferences).map(item => item.filePath),
      githubFileContext?.filePath,
      attachedFileContext?.filePath
    ]);

    return {
      artifactTopicPresent:
        filePaths.length > 0 ||
        this.asArray(extractedFacts.symbols).length > 0,
      filePaths,
      symbols: this.unique(
        this.asArray(extractedFacts.symbols).map(item => item.name)
      ),
      githubFileContextAvailable: Boolean(githubFileContext),
      attachedFileContextAvailable: Boolean(attachedFileContext),
      possibleArtifactActionSignals:
        this.normalizeFactArray(summary.artifactActionSignals || []),
      possibleArtifactProhibitionSignals:
        this.normalizeFactArray(summary.artifactProhibitionSignals || []),
      authority: "artifact_evidence_only"
    };
  },

  buildSourceIndex({
    summary = {},
    turnId = null,
    observations = []
  } = {}) {
    const sources = [
      {
        sourceId: "current_user_turn",
        sourceType: "user_message",
        turnId,
        authoritativeFor: ["explicit_text"]
      }
    ];

    if (
      summary.threadState ||
      summary.threadStateLoaded ||
      summary.recentMessages
    ) {
      sources.push({
        sourceId: "thread_state",
        sourceType: "continuity_context",
        turnId: null,
        authoritativeFor: ["available_prior_context"]
      });
    }

    for (const observation of observations) {
      if (!observation.source) continue;
      sources.push({
        sourceId: observation.source,
        sourceType: "observation_source",
        turnId: observation.sourceTurnId || null,
        authoritativeFor: ["reported_observation"]
      });
    }

    return {
      sources: this.dedupeObjects(sources, item => item.sourceId),
      observationIds: observations.map(item => item.id)
    };
  },

  buildQuality({
    observations = [],
    extractedFacts = {},
    sourceIndex = {}
  } = {}) {
    const directEvidenceCount = observations.filter(
      item =>
        item.inferenceLevel === "observed" ||
        item.evidenceClass === "direct_text"
    ).length;

    const references = this.asArray(extractedFacts.references);
    const unresolvedReferenceCount = references.filter(
      item => item.resolutionStatus !== "resolved"
    ).length;

    return {
      observationCount: observations.length,
      directEvidenceCount,
      inferredEvidenceCount:
        Math.max(0, observations.length - directEvidenceCount),
      referenceCount: references.length,
      unresolvedReferenceCount,
      sourceCoverage:
        sourceIndex.sources?.length
          ? this.normalizeConfidence(
              Math.min(1, sourceIndex.sources.length / 4)
            )
          : 0,
      extractionCompleteness:
        this.normalizeConfidence(
          [
            extractedFacts.quotedContent?.length,
            extractedFacts.entities?.length,
            extractedFacts.references?.length,
            extractedFacts.fileReferences?.length,
            extractedFacts.symbols?.length,
            observations.length
          ].filter(value => Number(value) > 0).length / 6
        ),
      warnings:
        unresolvedReferenceCount > 0
          ? ["unresolved_reference_candidates_present"]
          : []
    };
  },

  extractQuotedContent(text = "", turnId = null) {
    const output = [];
    const pattern = /["“](.+?)["”]/g;

    for (const match of String(text).matchAll(pattern)) {
      output.push({
        id: `quote_${String(output.length + 1).padStart(3, "0")}`,
        value: this.clean(match[1]),
        sourceTurnId: turnId,
        sourceSpan: {
          start: match.index,
          end: match.index + match[0].length
        },
        evidenceRefs: []
      });
    }

    return output;
  },

  extractFileReferences({
    summary = {},
    originalText = "",
    turnId = null
  } = {}) {
    const supplied = this.asArray(
      summary.fileReferences ||
      summary.githubFileContext?.filePath ||
      summary.appContext?.githubFileContext?.filePath ||
      []
    );

    const matches = String(originalText).match(
      /(?:^|[\s"'`(])([a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)+\.[a-zA-Z0-9]+|[a-zA-Z0-9_.-]+\.(?:js|mjs|cjs|ts|tsx|jsx|json|html|css|md|txt|py))(?:$|[\s"'`),.!?])/g
    ) || [];

    const values = this.unique([
      ...supplied.map(item =>
        typeof item === "string" ? item : item?.filePath
      ),
      ...matches.map(item =>
        item.trim().replace(/^[("'`]+|[)"'`,.!?]+$/g, "")
      )
    ]);

    return values.filter(Boolean).map((filePath, index) => {
      const fileName = filePath.split("/").pop();
      const extension =
        fileName && fileName.includes(".")
          ? fileName.split(".").pop()
          : null;

      return {
        id: `file_${String(index + 1).padStart(3, "0")}`,
        filePath,
        fileName,
        extension,
        sourceTurnId: turnId,
        evidenceRefs: [],
        confidence: 1
      };
    });
  },

  extractSymbols({
    summary = {},
    originalText = ""
  } = {}) {
    const supplied = this.asArray(
      summary.symbols ||
      summary.codeSymbols ||
      summary.developerEvidence?.symbols ||
      []
    );

    const backtickMatches = [
      ...String(originalText).matchAll(/`([A-Za-z_$][A-Za-z0-9_$]*)`/g)
    ].map(match => match[1]);

    return this.unique([
      ...supplied.map(item =>
        typeof item === "string" ? item : item?.name
      ),
      ...backtickMatches
    ]).filter(Boolean).map((name, index) => ({
      id: `symbol_${String(index + 1).padStart(3, "0")}`,
      name,
      symbolType: null,
      filePath: null,
      evidenceRefs: [],
      confidence: 0.9
    }));
  },

  extractTimeExpressions(text = "") {
    const pattern = /\b(today|tonight|tomorrow|yesterday|this week|next week|last week|this month|next month|last month|before [^,.!?]+|after [^,.!?]+|in \d+ (?:minutes?|hours?|days?|weeks?|months?|years?))\b/gi;

    return [...String(text).matchAll(pattern)].map((match, index) => ({
      id: `time_${String(index + 1).padStart(3, "0")}`,
      surface: match[0],
      normalizedValue: null,
      resolutionStatus: "unresolved",
      evidenceRefs: [],
      confidence: 1
    }));
  },

  extractNumericExpressions(text = "") {
    return [...String(text).matchAll(/\b-?\d+(?:\.\d+)?\b/g)]
      .map((match, index) => ({
        id: `number_${String(index + 1).padStart(3, "0")}`,
        surface: match[0],
        value: Number(match[0]),
        unit: null,
        evidenceRefs: [],
        confidence: 1
      }));
  },

  normalizeEntityArray(value = []) {
    return this.asArray(value)
      .filter(Boolean)
      .map((item, index) => {
        if (typeof item === "string") {
          return {
            id: `entity_${String(index + 1).padStart(3, "0")}`,
            type: null,
            value: item,
            normalizedValue: this.normalizeKey(item),
            sourceTurnId: null,
            evidenceRefs: [],
            confidence: 0.8
          };
        }

        return {
          ...item,
          id:
            this.clean(item.id) ||
            `entity_${String(index + 1).padStart(3, "0")}`,
          type: this.normalizeKey(item.type || item.entityType || "") || null,
          value: item.value ?? item.text ?? item.name ?? null,
          normalizedValue:
            item.normalizedValue ||
            this.normalizeKey(item.value || item.text || item.name || ""),
          sourceTurnId:
            this.clean(item.sourceTurnId || item.turnId || "") || null,
          evidenceRefs: this.unique(this.asArray(item.evidenceRefs)),
          confidence: this.normalizeConfidence(item.confidence, 0.8)
        };
      });
  },

  normalizeReferenceArray(value = [], turnId = null) {
    return this.asArray(value)
      .filter(Boolean)
      .map((item, index) => {
        if (typeof item === "string") {
          return {
            id: `ref_${String(index + 1).padStart(3, "0")}`,
            surface: item,
            referenceType: null,
            resolutionStatus: "candidate",
            resolvedValue: null,
            resolvedEntityId: null,
            sourceTurnId: turnId,
            candidateBindings: [],
            evidenceRefs: [],
            confidence: 0.6
          };
        }

        const resolved =
          item.resolved === true ||
          item.resolutionStatus === "resolved";

        return {
          ...item,
          id:
            this.clean(item.id) ||
            `ref_${String(index + 1).padStart(3, "0")}`,
          surface:
            item.surface ??
            item.text ??
            item.reference ??
            null,
          referenceType:
            this.normalizeKey(
              item.referenceType ||
              item.type ||
              ""
            ) || null,
          resolutionStatus:
            resolved ? "resolved" : "candidate",
          resolvedValue:
            resolved
              ? item.resolvedValue ?? item.value ?? null
              : null,
          resolvedEntityId:
            resolved ? item.resolvedEntityId || null : null,
          sourceTurnId:
            this.clean(item.sourceTurnId || item.turnId || turnId || "") ||
            null,
          candidateBindings: this.asArray(item.candidateBindings),
          evidenceRefs: this.unique(this.asArray(item.evidenceRefs)),
          confidence: this.normalizeConfidence(item.confidence, 0.6)
        };
      });
  },

  normalizeFactArray(value = []) {
    return this.asArray(value)
      .filter(item => item !== null && item !== undefined && item !== "")
      .map(item => {
        if (typeof item === "string") {
          return {
            value: item,
            evidenceRefs: [],
            confidence: 0.8
          };
        }

        return {
          ...item,
          value:
            item.value ??
            item.text ??
            item.name ??
            item.label ??
            null,
          evidenceRefs: this.unique(this.asArray(item.evidenceRefs)),
          confidence: this.normalizeConfidence(item.confidence, 0.8)
        };
      });
  },

  normalizeContextValue(value, source = null) {
    if (!value) return null;
    if (typeof value === "string") {
      return { value, source };
    }

    return {
      value:
        value.value ??
        value.surface ??
        value.label ??
        value.text ??
        null,
      source: value.source || source
    };
  },

  normalizeText(value = "") {
    return String(value || "")
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalizeKey(value = "") {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  },

  normalizeConfidence(value, fallback = 0.5) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    if (number > 1 && number <= 100) return number / 100;
    return Math.max(0, Math.min(1, number));
  },

  toFiniteNumber(value, fallback = null) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  },

  makeId(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  },

  asArray(value) {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined || value === "") return [];
    return [value];
  },

  unique(values = []) {
    return [...new Set(values.filter(Boolean))];
  },

  dedupeObjects(values = [], keyFn = item =>
    JSON.stringify(item)
  ) {
    const seen = new Set();

    return values.filter(item => {
      if (!item) return false;
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  clean(value = "") {
    return String(value || "").trim();
  }
};

window.Ari.evidenceBuilder = window.AriEvidenceBuilder;

console.log(
  "ARI EVIDENCE BUILDER LOADED:",
  window.AriEvidenceBuilder?.version
);
