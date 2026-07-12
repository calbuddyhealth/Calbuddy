// ari/meaning/ari-semantic-frame-builder.js
// Ari Semantic Frame Builder
// Purpose: Convert canonical perception evidence into structured conceptual meaning.
// V3.1.0 — Semantic Contract Corrections / Confidence Ordering / Compact Formatting
window.Ari = window.Ari || {};

window.AriSemanticFrameBuilder = {
  version: "3.1.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  build(input = {}) {
    const summary = input.summary || input || {};

    const originalText = this.clean(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const normalized = this.normalizeText(originalText);

    const sources = this.readUpstreamSources(summary);

    const evidenceIndex = this.buildEvidenceIndex({
      summary,
      normalized,
      sources
    });

    const requestModel = this.buildRequestModel({
      normalized,
      sources,
      evidenceIndex
    });

    const semanticSlots = this.buildSemanticSlots({
      normalized,
      sources,
      evidenceIndex,
      requestModel
    });

    const contextModel = this.buildContextModel({
      normalized,
      sources,
      evidenceIndex,
      requestModel,
      semanticSlots
    });

    const continuity = this.buildContinuityModel({
      normalized,
      sources,
      evidenceIndex,
      requestModel,
      semanticSlots
    });

    const candidateFrames = this.buildSemanticCandidates({
      normalized,
      sources,
      evidenceIndex,
      requestModel,
      semanticSlots,
      contextModel,
      continuity
    });

    const rankedFrames = this.rankSemanticCandidates(
      candidateFrames,
      {
        sources,
        evidenceIndex,
        requestModel,
        semanticSlots,
        contextModel,
        continuity
      }
    );

    const primaryFrame =
      rankedFrames[0] ||
      this.defaultFrame(normalized);

    const secondaryFrames = rankedFrames
      .filter(frame =>
        frame.frameId !== primaryFrame.frameId
      )
      .slice(0, 8);

    const allFrames = [
      primaryFrame,
      ...secondaryFrames
    ];

    const ambiguity = this.buildAmbiguityModel({
      normalized,
      sources,
      requestModel,
      semanticSlots,
      primaryFrame,
      secondaryFrames,
      continuity
    });

    const canonicalMeaning = this.buildCanonicalMeaning({
      normalized,
      sources,
      requestModel,
      semanticSlots,
      contextModel,
      continuity,
      primaryFrame,
      secondaryFrames,
      ambiguity
    });

    const responseRequirements =
      this.buildResponseRequirements({
        normalized,
        requestModel,
        semanticSlots,
        primaryFrame,
        secondaryFrames,
        continuity,
        ambiguity
      });

    const emotionalOverlay =
      this.buildEmotionalOverlay({
        sources,
        contextModel,
        evidenceIndex
      });

    const frameAgreement = this.buildFrameAgreement({
  sources,
  requestModel,
  primaryFrame,
  canonicalMeaning
});

const confidence = this.calculateMeaningConfidence({
  sources,
  requestModel,
  semanticSlots,
  primaryFrame,
  ambiguity,
  frameAgreement
});

primaryFrame.confidence = confidence.score;
primaryFrame.confidenceLabel = confidence.label;

const framePriority = this.buildFramePriority({
  primaryFrame,
  secondaryFrames,
  requestModel,
  semanticSlots
});
    canonicalMeaning.confidence =
      confidence.normalized;

    canonicalMeaning.confidenceLabel =
      confidence.label;

    canonicalMeaning.confidenceBreakdown =
      confidence.breakdown;

    const handoff = this.buildHandoff({
      canonicalMeaning,
      primaryFrame,
      secondaryFrames,
      contextModel,
      continuity,
      ambiguity,
      responseRequirements,
      frameAgreement,
      confidence
    });

    const semanticSummary =
      this.buildSemanticSummary({
        normalized,
        requestModel,
        semanticSlots,
        contextModel,
        continuity,
        primaryFrame,
        secondaryFrames,
        allFrames,
        ambiguity,
        canonicalMeaning,
        responseRequirements,
        emotionalOverlay,
        framePriority,
        frameAgreement,
        confidence
      });

    return {
      semanticFrameBuilderRan: true,
      semanticFrameBuilderVersion:
        this.version,

      semanticFrameSource:
        "ari-semantic-frame-builder",

      advisoryOnly: true,
      routingAuthority: false,
      composerAuthority: false,
      finalAnswerAuthority: false,

      originalText,
      normalizedText:
        normalized.text,

      normalization:
        normalized,

      upstreamSources: {
        observerAvailable:
          sources.observations.length > 0,

        questionUnderstandingAvailable:
          sources.questionUnderstanding
            .questionUnderstandingRan === true,

        classifierAvailable:
          sources.classification
            .universalConversationClassifierRan === true,

        lifeSignalsAvailable:
          sources.lifeSignals
            .lifeSignalExtractorRan === true,

        routingEvidenceAvailable:
          sources.routingEvidence
            .routingEvidenceRan === true ||
          Boolean(
            sources.routingEvidence
              .routingPressures
          ),

        safetyAvailable:
          sources.safety
            .safetyContextGateRan === true
      },

      evidenceIndex,
      requestModel,
      semanticSlots,

      contextModifiers:
        contextModel.modifiers,

      constraints:
        contextModel.constraints,

      stakes:
        contextModel.stakes,

      currentTurnFrame:
        primaryFrame,

      currentTurnFrames:
        rankedFrames,

      primaryFrame,
      normalizedFrame:
        primaryFrame,

      secondaryFrames,
      allFrames,

      framePriority,
      frameAgreement,

      continuity,
      responseCharacteristics:
        responseRequirements,

      responseRequirements,
      emotionalOverlay,
      ambiguity,

      canonicalMeaning,
      handoff,

      semanticSummary,

      authority: {
        canRepresentMeaning: true,
        canBuildSemanticSlots: true,
        canIdentifyPrimaryRequest: true,
        canPreserveContextModifiers: true,
        canReportAmbiguity: true,

        canChooseConversationFunction: false,
        canChooseFinalRoute: false,
        canChooseMode: false,
        canChooseCapabilities: false,
        canChoosePlanner: false,
        canDetermineFinalSafetySeverity: false,
        canAnswerUser: false,

        role:
          "structured_semantic_meaning_handoff_only"
      }
    };
  },

  /* =====================================================
     UPSTREAM SOURCE READING
  ===================================================== */

  readUpstreamSources(summary = {}) {
    const observations =
      summary.canonicalObservationLedger ||
      summary.observationLedger ||
      summary.observations ||
      summary.observerEvidence?.observations ||
      [];

    const questionUnderstanding =
      summary.questionUnderstanding ||
      summary.questionUnderstandingResult ||
      {};

    const classification =
      summary.universalConversationClassification ||
      summary.conversationClassification ||
      {};

    const lifeSignals =
      summary.lifeSignalResult ||
      {};

    const routingEvidence =
      summary.routingEvidence ||
      summary.observerRoutingEvidence ||
      {};

    const safety =
      summary.safetyContextGate ||
      {};

    const thread =
      this.readInheritedContext(summary);

    return {
      observations:
        Array.isArray(observations)
          ? observations
          : [],

      questionUnderstanding,
      classification,
      lifeSignals,
      routingEvidence,
      safety,
      thread,

      githubFileContext:
        summary.githubFileContext ||
        summary.appContext
          ?.githubFileContext ||
        null
    };
  },

  /* =====================================================
     EVIDENCE INDEX
  ===================================================== */

  buildEvidenceIndex({
    summary = {},
    normalized = {},
    sources = {}
  } = {}) {
    const observations =
      sources.observations || [];

    const indexed = observations.map(
      (observation, index) => {
        const id =
          observation.id ||
          observation.observationId ||
          `obs_${index + 1}`;

        return {
          id,

          type:
            this.normalize(
              observation.type
            ),

          value:
            this.normalize(
              observation.value ??
              observation.signal ??
              observation.name
            ),

          category:
            this.normalize(
              observation.category
            ),

          domain:
            this.normalizeDomain(
              observation.domain
            ),

          subject:
            observation.subject ||
            null,

          target:
            observation.target ||
            null,

          relation:
            observation.relation ||
            null,

          operation:
            observation.operation ||
            null,

          requestedOutput:
            observation.requestedOutput ||
            null,

          confidence:
            this.normalizeConfidence(
              observation.confidence
            ),

          weight:
            Number(
              observation.weight || 0
            ),

          evidenceClass:
            observation.evidenceClass ||
            observation.observationType ||
            "unknown",

          inferenceLevel:
            observation.inferenceLevel ||
            "observed",

          source:
            observation.source ||
            "unknown",

          supportingSources:
            observation.supportingSources ||
            [],

          evidence:
            observation.evidence ||
            [],

          raw:
            observation
        };
      }
    );

    return {
      count:
        indexed.length,

      items:
        indexed,

      byType:
        this.groupBy(
          indexed,
          "type"
        ),

      byCategory:
        this.groupBy(
          indexed,
          "category"
        ),

      byDomain:
        this.groupBy(
          indexed,
          "domain"
        ),

      directEvidence:
        indexed.filter(item =>
          item.inferenceLevel === "observed" ||
          [
            "direct_text",
            "user_confirmed"
          ].includes(item.evidenceClass)
        ),

      inferredEvidence:
        indexed.filter(item =>
          item.inferenceLevel === "inferred" ||
          String(
            item.evidenceClass || ""
          ).includes("inference")
        ),

      operationEvidence:
        indexed.filter(item =>
          item.operation ||
          [
            "operation_signal",
            "question_purpose",
            "requested_operation"
          ].includes(item.type)
        ),

      outputEvidence:
        indexed.filter(item =>
          item.requestedOutput ||
          [
            "requested_output",
            "answer_expectation"
          ].includes(item.type)
        ),

      referenceEvidence:
        indexed.filter(item =>
          [
            "reference_signal",
            "missing_anchor_signal",
            "continuity_signal"
          ].includes(item.type) ||
          item.category === "continuity"
        ),

      domainEvidence:
        indexed.filter(item =>
          item.domain &&
          item.domain !== "general"
        ),

      normalizedText:
        normalized.text ||
        "",

      authority:
        "evidence_index_only"
    };
  },

  /* =====================================================
     REQUEST MODEL
  ===================================================== */

  buildRequestModel({
    normalized = {},
    sources = {},
    evidenceIndex = {}
  } = {}) {
    const question =
      sources.questionUnderstanding ||
      {};

    const classification =
      sources.classification ||
      {};

    const requestedOperations =
      this.normalizeList(
        question.requestedOperations
      );

    const requestedOutputs =
      this.normalizeList(
        question.requestedOutputs
      );

    const primaryPurpose =
      this.normalize(
        question.primaryPurpose ||
        question.questionPurpose ||
        ""
      );

    const classifierOperation =
      this.normalize(
        classification
          .explicitRequestedOperation
      );

    const classifierOutput =
      this.normalize(
        classification
          .explicitRequestedOutput
      );

    const classifierRequestType =
      this.normalize(
        classification
          .explicitRequestType
      );

    const operation =
      requestedOperations[0] ||
      classifierOperation ||
      this.operationFromPurpose(
        primaryPurpose,
        classifierRequestType
      );

    const requestedOutput =
      requestedOutputs[0] ||
      classifierOutput ||
      this.outputFromPurpose(
        primaryPurpose,
        classifierRequestType
      );

    const operationEvidence =
      evidenceIndex.operationEvidence ||
      [];

    const outputEvidence =
      evidenceIndex.outputEvidence ||
      [];

    const explicitRequestPresent =
  classification.explicitRequestPresent === true;

const requestEvidencePresent =
  classification.requestEvidencePresent === true ||
  explicitRequestPresent ||
  Boolean(operation) ||
  Boolean(requestedOutput) ||
  operationEvidence.length > 0 ||
  outputEvidence.length > 0;
    
    const secondaryOperations =
      requestedOperations
        .slice(1)
        .filter(value =>
          value !== operation
        );

    const secondaryOutputs =
      requestedOutputs
        .slice(1)
        .filter(value =>
          value !== requestedOutput
        );

    const speechAct =
      this.resolveSpeechAct(
        normalized,
        operation
      );

    return {
      explicitRequestPresent,
      requestEvidencePresent,

      primaryPurpose:
        primaryPurpose ||
        "understanding",

      purposeConfidence:
        this.normalizeConfidence(
          question.primaryPurposeConfidence ??
          question.confidence ??
          0
        ),

      purposeCandidates:
        question.purposeCandidates ||
        [],

      supportPurposes:
        question.supportPurposes ||
        [],

      multiPurpose:
        question.multiPurpose === true ||
        secondaryOperations.length > 0 ||
        secondaryOutputs.length > 0,

      competingPurposes:
        question.competingPurposes ||
        [],

      requestType:
        classifierRequestType ||
        this.requestTypeFromOperation(
          operation
        ),

      operation:
        operation ||
        "respond",

      secondaryOperations,

      requestedOutput:
        requestedOutput ||
        "response",

      secondaryOutputs,

      interactionFamily:
        classification.interactionFamily ||
        this.interactionFamilyFromOperation(
          operation
        ),

      intentFamily:
        classification.intentFamily ||
        this.intentFamilyFromOperation(
          operation
        ),

      classificationType:
        classification.conversationType ||
        null,

      classificationIntent:
        classification.conversationIntent ||
        null,

      speechAct,

      explicitRequestOverridesContext:
        classification
          .explicitRequestOverridesContext === true,

      evidenceRefs: [
        ...operationEvidence.map(item =>
          item.id
        ),
        ...outputEvidence.map(item =>
          item.id
        )
      ],

      sourceAgreement: {
        questionUnderstanding:
          Boolean(
            requestedOperations.length ||
            requestedOutputs.length ||
            primaryPurpose
          ),

        classifier:
          Boolean(
            classifierOperation ||
            classifierOutput ||
            classifierRequestType
          ),

        ledger:
          Boolean(
            operationEvidence.length ||
            outputEvidence.length
          )
      }
    };
  },

  /* =====================================================
     SEMANTIC SLOT BUILDING
  ===================================================== */

  buildSemanticSlots({
    normalized = {},
    sources = {},
    evidenceIndex = {},
    requestModel = {}
  } = {}) {
    const text =
      normalized.text || "";

    const subject =
      this.resolveSubject({
        text,
        evidenceIndex
      });

    const target =
      this.resolveTarget({
        text,
        sources,
        evidenceIndex,
        requestModel
      });

    const object =
      this.resolveObject({
        text,
        sources,
        evidenceIndex,
        requestModel,
        target
      });

    const options =
      this.extractOptions({
        text,
        evidenceIndex,
        requestModel
      });

    const criteria =
      this.extractCriteria({
        text,
        evidenceIndex
      });

    const timeframe =
      this.extractTimeframe({
        text,
        evidenceIndex
      });

    const audience =
      this.extractAudience({
        text,
        evidenceIndex
      });

    const location =
      this.extractLocation({
        text,
        evidenceIndex
      });

    const requiredSlots =
      this.requiredSlotsForOperation(
        requestModel.operation
      );

    const slotMap = {
      subject,
      target,
      object,
      options,
      criteria,
      timeframe,
      audience,
      location
    };

    const presentSlots =
      requiredSlots.filter(slot =>
        this.slotPresent(
          slotMap[slot]
        )
      );

    const missingSlots =
      requiredSlots.filter(slot =>
        !this.slotPresent(
          slotMap[slot]
        )
      );

    return {
      operation:
        requestModel.operation,

      requestedOutput:
        requestModel.requestedOutput,

      subject,
      target,
      object,

      options,
      criteria,

      timeframe,
      audience,
      location,

      requiredSlots,
      presentSlots,
      missingSlots,

      slotCompleteness: {
        required:
          requiredSlots.length,

        present:
          presentSlots.length,

        missing:
          missingSlots,

        score:
          requiredSlots.length
            ? this.normalizeConfidence(
                presentSlots.length /
                requiredSlots.length
              )
            : 1
      }
    };
  },

  resolveSubject({
    text = "",
    evidenceIndex = {}
  } = {}) {
    const subjectEvidence =
      evidenceIndex.items?.find(item =>
        item.subject
      );

    if (subjectEvidence?.subject) {
      return {
        type:
          "explicit_subject",

        value:
          subjectEvidence.subject,

        origin:
          "explicit",

        confidence:
          subjectEvidence.confidence,

        evidenceRefs: [
          subjectEvidence.id
        ]
      };
    }

    const closeOtherMatch = text.match(
  /\b(my wife|my husband|my spouse|my partner|my dad|my father|my mom|my mother|my child|my baby|my son|my daughter)\b/
);

if (closeOtherMatch) {
  return {
    type: "close_other",
    value: closeOtherMatch[0],
    origin: "explicit",
    confidence: 0.9,
    evidenceRefs: []
  };
}

if (/\b(i|me|myself)\b/.test(text)) {
  return {
    type: "user",
    value: "self",
    origin: "explicit",
    confidence: 0.9,
    evidenceRefs: []
  };
}

    if (
      /\b(you|your)\b/.test(text)
    ) {
      return {
        type:
          "assistant",

        value:
          "ari",

        origin:
          "explicit",

        confidence:
          0.82,

        evidenceRefs: []
      };
    }

    return {
      type:
        "unspecified",

      value:
        null,

      origin:
        "unknown",

      confidence:
        0,

      evidenceRefs: []
    };
  },

  resolveTarget({
    text = "",
    sources = {},
    evidenceIndex = {},
    requestModel = {}
  } = {}) {
    const targetEvidence =
      evidenceIndex.items?.find(item =>
        item.target
      );

    if (targetEvidence?.target) {
      return {
        type:
          "observed_target",

        value:
          targetEvidence.target,

        origin:
          "explicit",

        confidence:
          targetEvidence.confidence,

        evidenceRefs: [
          targetEvidence.id
        ]
      };
    }

    const filePath =
      sources.githubFileContext
        ?.filePath ||
      null;

    if (filePath) {
      return {
        type:
          "file",

        value:
          filePath,

        origin:
          "inherited",

        confidence:
          0.95,

        evidenceRefs: []
      };
    }

    const quoted =
      this.extractQuotedText(text);

    if (quoted) {
      return {
        type:
          "quoted_content",

        value:
          quoted,

        origin:
          "explicit",

        confidence:
          0.9,

        evidenceRefs: []
      };
    }

    const developerTarget =
      this.extractDeveloperTarget(text);

    if (developerTarget) {
      return {
        type:
          developerTarget.type,

        value:
          developerTarget.value,

        origin:
          "explicit",

        confidence:
          developerTarget.confidence,

        evidenceRefs: []
      };
    }

    const factualTarget =
      this.extractFactualTarget(
        text,
        requestModel
      );

    if (factualTarget) {
      return factualTarget;
    }

    const decisionTarget =
      this.extractDecisionTarget(
        text,
        requestModel
      );

    if (decisionTarget) {
      return decisionTarget;
    }

    const writingTarget =
      this.extractWritingTarget(
        text,
        requestModel
      );

    if (writingTarget) {
      return writingTarget;
    }

    const remaining =
      this.extractFallbackTarget(
        text,
        requestModel.operation
      );

    return {
      type:
        remaining
          ? "concept"
          : "unknown",

      value:
        remaining ||
        null,

      origin:
        remaining
          ? "inferred"
          : "unknown",

      confidence:
        remaining
          ? 0.52
          : 0,

      evidenceRefs: []
    };
  },

  resolveObject({
    text = "",
    sources = {},
    evidenceIndex = {},
    requestModel = {},
    target = {}
  } = {}) {
    const objectEvidence =
      evidenceIndex.items?.find(item =>
        item.type === "slot_signal" &&
        item.raw?.slotCandidate === "object"
      );

    if (objectEvidence) {
      return {
        type:
          "semantic_object",

        name:
          objectEvidence.raw?.evidence?.text ||
          objectEvidence.raw?.evidence ||
          objectEvidence.value ||
          null,

        entity:
          null,

        attribute:
          null,

        filePath:
          sources.githubFileContext
            ?.filePath ||
          null,

        origin:
          "explicit",

        confidence:
          objectEvidence.confidence,

        evidenceRefs: [
          objectEvidence.id
        ]
      };
    }

    const factualObject =
      this.extractFactualObject(text);

    if (factualObject) {
      return {
        ...factualObject,

        filePath:
          null,

        origin:
          "explicit",

        confidence:
          0.84,

        evidenceRefs: []
      };
    }

    return {
      type:
        target.type ||
        "unknown",

      name:
        target.value ||
        null,

      entity:
        null,

      attribute:
        null,

      filePath:
        sources.githubFileContext
          ?.filePath ||
        null,

      origin:
        target.origin ||
        "unknown",

      confidence:
        target.confidence ||
        0,

      evidenceRefs:
        target.evidenceRefs ||
        []
    };
  },

  /* =====================================================
     CONTEXT MODEL
  ===================================================== */

  buildContextModel({
    normalized = {},
    sources = {},
    evidenceIndex = {},
    requestModel = {},
    semanticSlots = {}
  } = {}) {
    const modifiers = [];
    const constraints = [];
    const stakes = [];

    const addModifier =
      modifier => {
        if (!modifier?.type) return;

        if (
          modifiers.some(item =>
            item.type === modifier.type &&
            item.value === modifier.value
          )
        ) {
          return;
        }

        modifiers.push(modifier);
      };

    const addConstraint =
      constraint => {
        if (!constraint?.type) return;

        if (
          constraints.some(item =>
            item.type === constraint.type &&
            item.value === constraint.value
          )
        ) {
          return;
        }

        constraints.push(constraint);
      };

    const addStake =
      stake => {
        if (!stake?.type) return;

        if (
          stakes.some(item =>
            item.type === stake.type &&
            item.value === stake.value
          )
        ) {
          return;
        }

        stakes.push(stake);
      };

    this.addEmotionalContext({
      normalized,
      sources,
      evidenceIndex,
      addModifier
    });

    this.addLifeContext({
      sources,
      addModifier,
      addConstraint,
      addStake
    });

    this.addDomainContext({
      normalized,
      sources,
      evidenceIndex,
      addModifier,
      addConstraint,
      addStake
    });

    this.addTimeAndResourceConstraints({
      normalized,
      evidenceIndex,
      addConstraint
    });

    const domains =
      this.resolveSemanticDomains({
        sources,
        evidenceIndex,
        requestModel,
        modifiers,
        stakes
      });

    return {
      modifiers,
      constraints,
      stakes,

      primaryDomain:
        domains[0] ||
        "general_understanding",

      secondaryDomains:
        domains.slice(1),

      domains,

      explicitRequestDominant:
        requestModel
          .explicitRequestPresent === true,

      contextMayModifyResponse:
        modifiers.length > 0 ||
        constraints.length > 0 ||
        stakes.length > 0,

      contextMayReplaceRequest:
        false
    };
  },

  addEmotionalContext({
    normalized = {},
    sources = {},
    evidenceIndex = {},
    addModifier = () => {}
  } = {}) {
    const classification =
      sources.classification ||
      {};

    const emotionEvidence =
      evidenceIndex.items?.filter(item =>
        item.domain === "emotion" ||
        item.category === "emotion" ||
        item.type === "emotion_word"
      ) || [];

    const emotionalPresent =
      classification
        .emotionalContextPresent === true ||
      emotionEvidence.length > 0;

    if (!emotionalPresent) {
      return;
    }

    const explicitSupport =
      classification
        .emotionalSupportExplicitlyRequested === true;

    addModifier({
      type:
        explicitSupport
          ? "emotional_support_request"
          : "emotional_context",

      value:
        explicitSupport
          ? "support_explicitly_requested"
          : "expressed_emotional_state",

      role:
        explicitSupport
          ? "request_relevant"
          : "context_modifier",

      explicit:
        explicitSupport,

      confidence:
        this.averageConfidence(
          emotionEvidence,
          explicitSupport
            ? 0.9
            : 0.68
        ),

      evidenceRefs:
        emotionEvidence.map(item =>
          item.id
        )
    });
  },

  addLifeContext({
    sources = {},
    addModifier = () => {},
    addConstraint = () => {},
    addStake = () => {}
  } = {}) {
    const lifeSignals =
      sources.lifeSignals ||
      {};

    const signals =
      Array.isArray(
        lifeSignals.signals
      )
        ? lifeSignals.signals
        : [];

    signals.forEach(signal => {
      const name =
        this.normalize(
          signal?.name ||
          signal
        );

      if (!name) return;

      const confidence =
        this.normalizeConfidence(
          signal?.confidence ??
          lifeSignals.primarySignalConfidence ??
          0.65
        );

      if (
        name.includes("family") ||
        name.includes("fatherhood") ||
        name.includes("parenthood")
      ) {
        addStake({
          type:
            "family_stake",

          value:
            name,

          role:
            "stake",

          confidence,

          evidenceRefs: []
        });
      }

      if (
        name.includes("military") ||
        name.includes("career") ||
        name.includes("identity")
      ) {
        addModifier({
          type:
            "life_transition",

          value:
            name,

          role:
            "context_modifier",

          confidence,

          evidenceRefs: []
        });
      }

      if (
        name.includes("capacity") ||
        name.includes("achievement pressure")
      ) {
        addConstraint({
          type:
            "capacity_pressure",

          value:
            name,

          role:
            "constraint",

          confidence,

          evidenceRefs: []
        });
      }

      if (
        name.includes("creative") ||
        name.includes("mission")
      ) {
        addStake({
          type:
            "project_mission",

          value:
            name,

          role:
            "stake",

          confidence,

          evidenceRefs: []
        });
      }
    });
  },

  addDomainContext({
    normalized = {},
    sources = {},
    evidenceIndex = {},
    addModifier = () => {},
    addConstraint = () => {},
    addStake = () => {}
  } = {}) {
    const text =
      normalized.text || "";

    const medicalEvidence =
      evidenceIndex.items?.filter(item =>
        item.domain === "medical" ||
        item.domain === "body" ||
        item.type === "body_symptom" ||
        item.type === "body_context"
      ) || [];

    if (medicalEvidence.length) {
      addModifier({
        type:
          "medical_context",

        value:
          "body_or_health_context",

        role:
          "context_modifier",

        confidence:
          this.averageConfidence(
            medicalEvidence,
            0.72
          ),

        evidenceRefs:
          medicalEvidence.map(item =>
            item.id
          )
      });
    }

    const relationshipEvidence =
      evidenceIndex.items?.filter(item =>
        [
          "relationship",
          "family"
        ].includes(item.domain) ||
        [
          "relationship_reference",
          "family_reference"
        ].includes(item.type)
      ) || [];

    if (relationshipEvidence.length) {
      addStake({
        type:
          "relationship_or_family_stake",

        value:
          "close_relationship_context",

        role:
          "stake",

        confidence:
          this.averageConfidence(
            relationshipEvidence,
            0.7
          ),

        evidenceRefs:
          relationshipEvidence.map(item =>
            item.id
          )
      });
    }

    const financeEvidence =
      evidenceIndex.items?.filter(item =>
        [
          "finance",
          "financial"
        ].includes(item.domain) ||
        item.type === "money_reference"
      ) || [];

    if (financeEvidence.length) {
      addConstraint({
        type:
          "financial_constraint",

        value:
          "financial_resources",

        role:
          "constraint",

        confidence:
          this.averageConfidence(
            financeEvidence,
            0.7
          ),

        evidenceRefs:
          financeEvidence.map(item =>
            item.id
          )
      });
    }

    if (
      /\b(before my baby is born|before the baby is born)\b/.test(text)
    ) {
      addConstraint({
        type:
          "deadline",

        value:
          "before_baby_arrival",

        role:
          "constraint",

        confidence:
          0.92,

        evidenceRefs: []
      });

      addStake({
        type:
          "family_readiness",

        value:
          "baby_arrival",

        role:
          "stake",

        confidence:
          0.9,

        evidenceRefs: []
      });
    }
  },

  addTimeAndResourceConstraints({
    normalized = {},
    evidenceIndex = {},
    addConstraint = () => {}
  } = {}) {
    const text =
      normalized.text || "";

    if (
      /\b(no time|running out of time|limited time|before|deadline|soon|tonight|tomorrow|this week)\b/.test(text)
    ) {
      addConstraint({
        type:
          "time_constraint",

        value:
          this.extractTimePhrase(text) ||
          "limited_time",

        role:
          "constraint",

        confidence:
          0.76,

        evidenceRefs: []
      });
    }

    if (
      /\b(exhausted|burned out|burnt out|overwhelmed|low energy|tired|capacity)\b/.test(text)
    ) {
      addConstraint({
        type:
          "energy_constraint",

        value:
          "limited_energy",

        role:
          "constraint",

        confidence:
          0.84,

        evidenceRefs:
          evidenceIndex.items
            ?.filter(item =>
              item.domain === "emotion" ||
              item.value.includes(
                "exhaust"
              )
            )
            .map(item =>
              item.id
            ) ||
          []
      });
    }
  },

  /* =====================================================
     CONTINUITY MODEL
  ===================================================== */

  buildContinuityModel({
    normalized = {},
    sources = {},
    evidenceIndex = {},
    requestModel = {},
    semanticSlots = {}
  } = {}) {
    const routingEvidence =
      sources.routingEvidence ||
      {};

    const pressures =
      routingEvidence.routingPressures ||
      {};

    const semanticClues =
      routingEvidence.semanticClues ||
      {};

    const guards =
      routingEvidence.routingGuards ||
      {};

    const thread =
      sources.thread ||
      {};

    const referenceEvidence =
      evidenceIndex.referenceEvidence ||
      [];

    const contextDependency =
      Number(
        pressures.contextDependency ||
        0
      );

    const followUpPressure =
      Number(
        pressures.followUpPressure ||
        0
      );

    const activeThreadMatch =
      Number(
        pressures.activeThreadMatch ||
        0
      );

    const likelyNeedsPriorContext =
      semanticClues
        .likelyNeedsPriorContext === true ||
      guards
        .likelyNeedsPriorContext === true;

    const likelyStandalone =
      semanticClues
        .likelyStandalone === true ||
      guards
        .likelyStandalone === true;

    const missingAnchor =
      semanticClues
        .hasMissingAnchorSignal === true ||
      guards
        .hasMissingAnchorSignal === true;

    const threadAvailable =
      thread.threadAvailable === true;

    const ownMeaningAvailable =
      requestModel.explicitRequestPresent &&
      semanticSlots.slotCompleteness
        .score >= 0.5;

    const requiresPriorContext =
      threadAvailable &&
      !likelyStandalone &&
      (
        likelyNeedsPriorContext ||
        missingAnchor ||
        followUpPressure >= 0.6 ||
        contextDependency >= 0.65
      );

    const isContinuation =
      requiresPriorContext &&
      !ownMeaningAvailable;

    const anchor =
      isContinuation
        ? (
            thread.activeSubject ||
            thread.currentTopic ||
            thread.previousAnswerSummary ||
            null
          )
        : null;

    const confidence =
      this.normalizeConfidence(
        (
          contextDependency * 0.35 +
          followUpPressure * 0.35 +
          activeThreadMatch * 0.15 +
          (
            likelyNeedsPriorContext
              ? 0.15
              : 0
          )
        )
      );

    return {
      isContinuation,
      requiresPriorContext,

      referencesPriorContext:
        isContinuation,

      referencesPriorArtifact:
        referenceEvidence.some(item =>
          item.domain === "project" ||
          item.value.includes("file") ||
          item.value.includes("code") ||
          item.value.includes("artifact")
        ),

      referencesPriorQuestion:
        referenceEvidence.some(item =>
          item.value.includes("question")
        ),

      threadAvailable,

      activeThreadMatch,

      contextDependency,
      followUpPressure,

      likelyNeedsPriorContext,
      likelyStandalone,
      missingAnchor,

      anchor,

      inheritedSubject:
        isContinuation
          ? thread.activeSubject
          : null,

      previousAnswerSummary:
        isContinuation
          ? thread.previousAnswerSummary
          : null,

      confidence,

      evidence:
        referenceEvidence.map(item =>
          item.id
        ),

      authority:
        "semantic_continuity_description_only"
    };
  },

  /* =====================================================
     SEMANTIC CANDIDATES
  ===================================================== */

  buildSemanticCandidates({
    normalized = {},
    sources = {},
    evidenceIndex = {},
    requestModel = {},
    semanticSlots = {},
    contextModel = {},
    continuity = {}
  } = {}) {
    const candidates = [];

    const primary =
      this.frameFromRequestModel({
        normalized,
        sources,
        evidenceIndex,
        requestModel,
        semanticSlots,
        contextModel
      });

    if (primary) {
      candidates.push(primary);
    }

    requestModel
      .secondaryOperations
      .forEach(
        (operation, index) => {
          candidates.push(
            this.frameFromOperation({
              operation,
              requestedOutput:
                requestModel
                  .secondaryOutputs[index] ||
                requestModel.requestedOutput,

              semanticSlots,
              contextModel,

              origin:
                "secondary_explicit_request",

              evidenceRefs:
                requestModel.evidenceRefs
            })
          );
        }
      );

    if (
      continuity.isContinuation
    ) {
      candidates.push({
        frameId:
          this.makeFrameId(
            "continuation",
            continuity.anchor ||
            "prior_context",
            0
          ),

        frameType:
          "continuation",

        speechAct:
          requestModel.speechAct,

        operation:
          "continue_prior_context",

        requestedOutput:
          requestModel.requestedOutput,

        subject:
          semanticSlots.subject,

        target: {
          type:
            "prior_context",

          value:
            continuity.anchor,

          origin:
            "inherited",

          confidence:
            continuity.confidence,

          evidenceRefs:
            continuity.evidence
        },

        object:
          semanticSlots.object,

        options: [],
        criteria: [],

        domain:
          "conversation_flow",

        secondaryDomains:
          contextModel.domains,

        contextModifiers:
          contextModel.modifiers,

        constraints:
          contextModel.constraints,

        stakes:
          contextModel.stakes,

        origin:
          "inherited",

        confidence:
          Math.round(
            continuity.confidence * 100
          ),

        evidenceRefs:
          continuity.evidence,

        advisoryOnly:
          true
      });
    }

    return candidates.filter(Boolean);
  },

  frameFromRequestModel({
    normalized = {},
    sources = {},
    evidenceIndex = {},
    requestModel = {},
    semanticSlots = {},
    contextModel = {}
  } = {}) {
    return this.frameFromOperation({
      operation:
        requestModel.operation,

      requestedOutput:
        requestModel.requestedOutput,

      requestType:
        requestModel.requestType,

      interactionFamily:
        requestModel.interactionFamily,

      intentFamily:
        requestModel.intentFamily,

      speechAct:
        requestModel.speechAct,

      semanticSlots,
      contextModel,

      origin:
        requestModel
          .explicitRequestPresent
          ? "explicit"
          : "inferred",

      evidenceRefs:
        requestModel.evidenceRefs
    });
  },

  frameFromOperation({
    operation = "respond",
    requestedOutput = "response",
    requestType = null,
    interactionFamily = null,
    intentFamily = null,
    speechAct = "statement",
    semanticSlots = {},
    contextModel = {},
    origin = "inferred",
    evidenceRefs = []
  } = {}) {
    const normalizedOperation =
      this.normalize(operation);

    const frameType =
      this.frameTypeFromOperation(
        normalizedOperation,
        requestType
      );

    const domain =
      contextModel.primaryDomain ||
      this.domainFromOperation(
        normalizedOperation
      );

    return {
      frameId:
        this.makeFrameId(
          frameType,
          semanticSlots.target?.value ||
          semanticSlots.object?.name ||
          normalizedOperation,
          0
        ),

      frameType,

      speechAct,

      operation:
        normalizedOperation ||
        "respond",

      intent:
        normalizedOperation ||
        "respond",

      userGoal:
        normalizedOperation ||
        "respond",

      requestedOutput:
        requestedOutput ||
        "response",

      interactionFamily:
        interactionFamily ||
        this.interactionFamilyFromOperation(
          normalizedOperation
        ),

      intentFamily:
        intentFamily ||
        this.intentFamilyFromOperation(
          normalizedOperation
        ),

      subject:
        semanticSlots.subject,

      target:
        semanticSlots.target,

      object:
        semanticSlots.object,

      options:
        semanticSlots.options ||
        [],

      criteria:
        semanticSlots.criteria ||
        [],

      timeframe:
        semanticSlots.timeframe ||
        null,

      audience:
        semanticSlots.audience ||
        null,

      location:
        semanticSlots.location ||
        null,

      domain,

      secondaryDomains:
        contextModel.secondaryDomains ||
        [],

      contextModifiers:
        contextModel.modifiers ||
        [],

      constraints:
        contextModel.constraints ||
        [],

      stakes:
        contextModel.stakes ||
        [],

      slotCompleteness:
        semanticSlots.slotCompleteness,

      origin,

      confidence:
        50,

      confidenceLabel:
        "low",

      evidenceRefs:
        [...new Set(
          evidenceRefs || []
        )],

      advisoryOnly:
        true
    };
  },

  rankSemanticCandidates(
    candidates = [],
    context = {}
  ) {
    const seen = new Map();

    candidates.forEach(
      (candidate, index) => {
        if (!candidate) return;

        const identity =
          this.frameIdentity(
            candidate
          );

        if (!seen.has(identity)) {
          seen.set(identity, {
            ...candidate,
            originalIndex:
              index
          });

          return;
        }

        const existing =
          seen.get(identity);

        existing.evidenceRefs = [
          ...new Set([
            ...(existing.evidenceRefs || []),
            ...(candidate.evidenceRefs || [])
          ])
        ];

        existing.contextModifiers =
          this.mergeSemanticItems(
            existing.contextModifiers,
            candidate.contextModifiers
          );

        existing.constraints =
          this.mergeSemanticItems(
            existing.constraints,
            candidate.constraints
          );

        existing.stakes =
          this.mergeSemanticItems(
            existing.stakes,
            candidate.stakes
          );
      }
    );

    return [...seen.values()]
      .map(frame => ({
        ...frame,

        rankingScore:
          this.scoreFrameCandidate(
            frame,
            context
          )
      }))
      .sort((a, b) => {
        if (
          b.rankingScore !==
          a.rankingScore
        ) {
          return (
            b.rankingScore -
            a.rankingScore
          );
        }

        return (
          a.originalIndex -
          b.originalIndex
        );
      });
  },

  scoreFrameCandidate(
    frame = {},
    context = {}
  ) {
    let score = 0;

    const requestModel =
      context.requestModel ||
      {};

    const semanticSlots =
      context.semanticSlots ||
      {};

    const continuity =
      context.continuity ||
      {};

    if (
      frame.origin === "explicit"
    ) {
      score += 45;
    } else if (
      frame.origin ===
      "secondary_explicit_request"
    ) {
      score += 35;
    } else if (
      frame.origin === "inherited"
    ) {
      score += 15;
    } else {
      score += 20;
    }

    if (
      frame.operation ===
      requestModel.operation
    ) {
      score += 25;
    }

    score +=
      Number(
        semanticSlots.slotCompleteness
          ?.score ||
        0
      ) * 15;

    if (
      frame.frameType === "continuation" &&
      continuity.isContinuation
    ) {
      score += 20;
    }

    if (
      frame.frameType === "continuation" &&
      requestModel.explicitRequestPresent
    ) {
      score -= 25;
    }

    if (
      frame.requestedOutput &&
      frame.requestedOutput !== "response"
    ) {
      score += 8;
    }

    if (
      frame.target?.value
    ) {
      score += 7;
    }

    return Math.round(score);
  },

  /* =====================================================
     AMBIGUITY
  ===================================================== */

  buildAmbiguityModel({
    normalized = {},
    sources = {},
    requestModel = {},
    semanticSlots = {},
    primaryFrame = {},
    secondaryFrames = [],
    continuity = {}
  } = {}) {
    const unresolvedSlots =
      semanticSlots.missingSlots ||
      [];

    const closeCompetition =
      secondaryFrames[0] &&
      Math.abs(
        Number(
          primaryFrame.rankingScore ||
          primaryFrame.confidence ||
          0
        ) -
        Number(
          secondaryFrames[0]
            .rankingScore ||
          secondaryFrames[0]
            .confidence ||
          0
        )
      ) <= 6;

    const conflictingExplicitRequests =
      requestModel.multiPurpose === true &&
      requestModel.secondaryOperations
        .length > 1;

    const missingRequiredAnchor =
      continuity
        .likelyNeedsPriorContext === true &&
      continuity.threadAvailable !== true;

    const present =
      unresolvedSlots.length > 0 ||
      closeCompetition ||
      conflictingExplicitRequests ||
      missingRequiredAnchor;

    const requiresClarification =
      missingRequiredAnchor ||
      (
        unresolvedSlots.includes(
          "target"
        ) &&
        requestModel.operation !==
          "provide_information"
      ) ||
      (
        unresolvedSlots.includes(
          "options"
        ) &&
        this.isDecisionOperation(
          requestModel.operation
        )
      );

    return {
      present,
      ambiguous:
        present,

      reason:
        missingRequiredAnchor
          ? "The current request depends on prior context, but no usable anchor is available."
          : unresolvedSlots.length
            ? "One or more required semantic slots remain unresolved."
            : closeCompetition
              ? "Two semantic interpretations remain close in strength."
              : conflictingExplicitRequests
                ? "The message contains several competing explicit requests."
                : "No major ambiguity detected.",

      unresolvedSlots,

      competingFrames:
        closeCompetition
          ? [
              primaryFrame.frameType,
              secondaryFrames[0]
                ?.frameType
            ].filter(Boolean)
          : [],

      missingAnchor:
        missingRequiredAnchor,

      requiresClarification,

      confidence:
        present
          ? 0.72
          : 0.88,

      evidence: [
        ...unresolvedSlots.map(slot =>
          `missing_slot:${slot}`
        ),

        closeCompetition
          ? "close_frame_scores"
          : null,

        missingRequiredAnchor
          ? "missing_context_anchor"
          : null
      ].filter(Boolean)
    };
  },

  /* =====================================================
     CANONICAL MEANING
  ===================================================== */

  buildCanonicalMeaning({
    normalized = {},
    sources = {},
    requestModel = {},
    semanticSlots = {},
    contextModel = {},
    continuity = {},
    primaryFrame = {},
    secondaryFrames = [],
    ambiguity = {}
  } = {}) {
    const artifactAction =
      this.buildArtifactAction({
        primaryFrame,
        requestModel,
        semanticSlots,
        sources
      });

    return {
      enabled: true,

      source:
        "ari-semantic-frame-builder",

      version:
        this.version,

      speechAct:
        requestModel.speechAct,

      interactionFamily:
        primaryFrame.interactionFamily ||
        requestModel.interactionFamily ||
        "general",

      intentFamily:
        primaryFrame.intentFamily ||
        requestModel.intentFamily ||
        "general_response",

      userGoal:
        primaryFrame.userGoal ||
        requestModel.operation ||
        "respond",

      requestedOperation:
        primaryFrame.operation ||
        requestModel.operation ||
        "respond",

      requestedOutput:
        primaryFrame.requestedOutput ||
        requestModel.requestedOutput ||
        "response",

      subject:
        semanticSlots.subject,

      target:
        semanticSlots.target,

      targetObject:
        semanticSlots.object,

      object:
        semanticSlots.object,

      options:
        semanticSlots.options ||
        [],

      criteria:
        semanticSlots.criteria ||
        [],

      timeframe:
        semanticSlots.timeframe ||
        null,

      audience:
        semanticSlots.audience ||
        null,

      location:
        semanticSlots.location ||
        null,

      domain: {
        primary:
          contextModel.primaryDomain ||
          primaryFrame.domain ||
          "general_understanding",

        secondary:
          contextModel.secondaryDomains ||
          []
      },

      targetDomain:
        contextModel.primaryDomain ||
        primaryFrame.domain ||
        "general_understanding",

      contextModifiers:
        contextModel.modifiers ||
        [],

      constraints:
        contextModel.constraints ||
        [],

      stakes:
        contextModel.stakes ||
        [],

      continuity: {
        requiresPriorContext:
          continuity.requiresPriorContext,

        isContinuation:
          continuity.isContinuation,

        anchor:
          continuity.anchor,

        priorContextAvailable:
          continuity.threadAvailable,

        referencesPriorArtifact:
          continuity.referencesPriorArtifact,

        referencesPriorQuestion:
          continuity.referencesPriorQuestion
      },

      ambiguity: {
        present:
          ambiguity.present,

        unresolvedSlots:
          ambiguity.unresolvedSlots ||
          [],

        competingFrames:
          ambiguity.competingFrames ||
          [],

        requiresClarification:
          ambiguity.requiresClarification === true
      },

      slotCompleteness:
        semanticSlots.slotCompleteness,

      artifactAction,

      multiDomain: {
        present:
          contextModel.domains
            .length > 1,

        primary:
          contextModel.primaryDomain,

        secondary:
          contextModel.secondaryDomains,

        hasMultipleRequests:
          requestModel.multiPurpose === true,

        secondaryRequests:
          secondaryFrames.map(frame => ({
            operation:
              frame.operation,

            target:
              frame.target,

            requestedOutput:
              frame.requestedOutput
          }))
      },

      responseMode:
        this.responseModeFromFrame(
          primaryFrame
        ),

      evidenceRefs: [
        ...new Set([
          ...(primaryFrame.evidenceRefs || []),
          ...(requestModel.evidenceRefs || []),
          ...(semanticSlots.target
            ?.evidenceRefs ||
            []),
          ...(semanticSlots.object
            ?.evidenceRefs ||
            [])
        ])
      ],

      origin:
        primaryFrame.origin ||
        "inferred",

      confidence:
        0,

      confidenceLabel:
        "unknown",

      authority:
        "semantic_description_only"
    };
  },

  buildArtifactAction({
    primaryFrame = {},
    requestModel = {},
    semanticSlots = {},
    sources = {}
  } = {}) {
    const operation =
      this.normalize(
        primaryFrame.operation ||
        requestModel.operation
      );

    const isArtifactRequest =
      primaryFrame.interactionFamily ===
        "developer_task" ||
      primaryFrame.interactionFamily ===
        "creation" ||
      [
        "implement_or_modify",
        "modify_existing_artifact",
        "create_artifact",
        "create_or_add",
        "verify_or_review",
        "diagnose_or_inspect"
      ].some(value =>
        operation.includes(value)
      );

    return {
      isArtifactRequest,

      isModification:
        operation.includes("modify") ||
        operation.includes("update") ||
        operation.includes("replace") ||
        operation.includes("repair"),

      isCreation:
        operation.includes("create") ||
        operation.includes("generate") ||
        operation.includes("design"),

      isInvestigation:
        operation.includes("verify") ||
        operation.includes("review") ||
        operation.includes("inspect") ||
        operation.includes("diagnose") ||
        operation.includes("debug"),

      isMetaQuestion:
        primaryFrame.frameType ===
        "meta_system_question",

      requiresFileContent:
        isArtifactRequest &&
        Boolean(
          semanticSlots.object?.filePath ||
          sources.githubFileContext
        ),

      filePath:
        semanticSlots.object?.filePath ||
        sources.githubFileContext
          ?.filePath ||
        null
    };
  },

  /* =====================================================
     RESPONSE REQUIREMENTS
  ===================================================== */

  buildResponseRequirements({
    normalized = {},
    requestModel = {},
    semanticSlots = {},
    primaryFrame = {},
    secondaryFrames = [],
    continuity = {},
    ambiguity = {}
  } = {}) {
    const operation =
      this.normalize(
        primaryFrame.operation ||
        requestModel.operation
      );

    const directAnswerRequested =
      requestModel.speechAct ===
        "question" ||
      [
        "provide information",
        "explain",
        "calculate",
        "translate",
        "verify",
        "provide opinion",
        "decide"
      ].some(value =>
        operation.includes(value)
      );

    const explanationRequested =
      operation.includes("explain") ||
      requestModel.requestType ===
        "explanation";

    const artifactOutputRequested =
      [
        "implementation",
        "creation",
        "writing"
      ].includes(
        requestModel.requestType
      ) ||
      primaryFrame.interactionFamily ===
        "developer_task";

    const multipleOperationsPresent =
      requestModel.multiPurpose === true ||
      secondaryFrames.length > 0;

    return {
      expectsDirectAnswer:
        directAnswerRequested,

      expectsExplanation:
        explanationRequested,

      expectsCollaboration:
        primaryFrame.interactionFamily ===
          "developer_task" ||
        primaryFrame.interactionFamily ===
          "planning" ||
        primaryFrame.interactionFamily ===
          "decision",

      expectsCodeOrArtifact:
        artifactOutputRequested,

      expectsReflection:
        primaryFrame.interactionFamily ===
          "emotional_support" ||
        primaryFrame.interactionFamily ===
          "identity",

      expectsFollowUpContext:
        continuity.requiresPriorContext,

      likelyWantsMinimalAnswer:
        normalized.isShortTurn &&
        !multipleOperationsPresent,

      directAnswerRequested,
      explanationRequested,
      artifactOutputRequested,

      multipleOperationsPresent,

      preserveSecondaryRequests:
        multipleOperationsPresent,

      priorContextRequired:
        continuity.requiresPriorContext,

      clarificationRequired:
        ambiguity.requiresClarification === true,

      requestCount:
        1 +
        requestModel
          .secondaryOperations
          .length,

      semanticFactsOnly: true,

      confidence:
        this.normalizeConfidence(
          0.55 +
          (
            directAnswerRequested
              ? 0.1
              : 0
          ) +
          (
            artifactOutputRequested
              ? 0.1
              : 0
          ) +
          (
            multipleOperationsPresent
              ? 0.08
              : 0
          ) +
          (
            continuity.requiresPriorContext
              ? 0.05
              : 0
          )
        )
    };
  },

  /* =====================================================
     EMOTIONAL OVERLAY
  ===================================================== */

  buildEmotionalOverlay({
    sources = {},
    contextModel = {},
    evidenceIndex = {}
  } = {}) {
    const emotionalModifiers =
      contextModel.modifiers.filter(item =>
        item.type.includes("emotion")
      );

    const evidence =
      evidenceIndex.items?.filter(item =>
        item.domain === "emotion" ||
        item.category === "emotion" ||
        item.type === "emotion_word"
      ) || [];

    const present =
      emotionalModifiers.length > 0 ||
      evidence.length > 0;

    const explicitSupportRequested =
      sources.classification
        ?.emotionalSupportExplicitlyRequested === true;

    return {
      present,

      tone:
        present
          ? "emotion_present"
          : "neutral",

      intensity:
        present
          ? this.resolveEmotionalIntensity(
              evidence
            )
          : "low",

      states:
        evidence
          .map(item =>
            item.value
          )
          .filter(Boolean),

      role:
        explicitSupportRequested
          ? "primary_request_relevant"
          : "context_modifier",

      explicitSupportRequested,

      shouldNotReplacePrimaryRequest:
        !explicitSupportRequested,

      semanticMeaningSeparated:
        true,

      evidence:
        evidence.map(item =>
          item.id
        )
    };
  },

  resolveEmotionalIntensity(
    evidence = []
  ) {
    const maximum =
      evidence.length
        ? Math.max(
            ...evidence.map(item =>
              Number(
                item.confidence || 0
              )
            )
          )
        : 0;

    if (maximum >= 0.85) {
      return "high";
    }

    if (maximum >= 0.6) {
      return "medium";
    }

    return "low";
  },

  /* =====================================================
     FRAME PRIORITY
  ===================================================== */

  buildFramePriority({
    primaryFrame = {},
    secondaryFrames = [],
    requestModel = {},
    semanticSlots = {}
  } = {}) {
    const ordered = [
      {
        frameId:
          primaryFrame.frameId,

        frameType:
          primaryFrame.frameType,

        operation:
          primaryFrame.operation,

        target:
          primaryFrame.target,

        requestedOutput:
          primaryFrame.requestedOutput,

        domain:
          primaryFrame.domain,

        role:
          "primary",

        confidence:
          primaryFrame.confidence,

        evidenceRefs:
          primaryFrame.evidenceRefs ||
          []
      },

      ...secondaryFrames.map(frame => ({
        frameId:
          frame.frameId,

        frameType:
          frame.frameType,

        operation:
          frame.operation,

        target:
          frame.target,

        requestedOutput:
          frame.requestedOutput,

        domain:
          frame.domain,

        role:
          "secondary",

        confidence:
          frame.confidence,

        evidenceRefs:
          frame.evidenceRefs ||
          []
      }))
    ];

    return {
      primary:
        primaryFrame.frameId ||
        null,

      primaryFrameType:
        primaryFrame.frameType ||
        null,

      secondary:
        ordered.slice(1),

      ordered,

      hasMultipleFrames:
        ordered.length > 1,

      hasMultipleQuestions:
        requestModel.multiPurpose === true,

      hasMultipleOperations:
        requestModel.multiPurpose === true,

      shouldPreserveSecondaryFrames:
        ordered.length > 1,

      slotCompleteness:
        semanticSlots.slotCompleteness,

      authority:
        "semantic_priority_description_only"
    };
  },

  /* =====================================================
     AGREEMENT + CONFIDENCE
  ===================================================== */

  buildFrameAgreement({
    sources = {},
    requestModel = {},
    primaryFrame = {},
    canonicalMeaning = {}
  } = {}) {
    const questionPurpose =
      this.normalize(
        sources.questionUnderstanding
          ?.primaryPurpose
      );

    const classifierFamily =
      this.normalize(
        sources.classification
          ?.interactionFamily
      );

    const classifierOperation =
      this.normalize(
        sources.classification
          ?.explicitRequestedOperation
      );

    const frameOperation =
      this.normalize(
        primaryFrame.operation
      );

    const questionAligned =
      !questionPurpose ||
      frameOperation.includes(
        this.normalize(
          this.operationFromPurpose(
            questionPurpose
          )
        )
      ) ||
      requestModel.primaryPurpose ===
        questionPurpose;

    const classifierAligned =
      !classifierOperation ||
      frameOperation ===
        classifierOperation ||
      frameOperation.includes(
        classifierOperation
      ) ||
      classifierOperation.includes(
        frameOperation
      );

    const familyAligned =
      !classifierFamily ||
      this.normalize(
        primaryFrame.interactionFamily
      ) === classifierFamily;

    const values = [
      questionAligned,
      classifierAligned,
      familyAligned
    ];

    const alignedCount =
      values.filter(Boolean).length;

    return {
      questionUnderstandingAligned:
        questionAligned,

      classifierOperationAligned:
        classifierAligned,

      classifierFamilyAligned:
        familyAligned,

      alignedCount,

      totalChecks:
        values.length,

      score:
        values.length
          ? alignedCount /
            values.length
          : 0,

      level:
        alignedCount === values.length
          ? "high"
          : alignedCount >= 2
            ? "medium"
            : alignedCount === 1
              ? "low"
              : "none",

      disagreements: [
        !questionAligned
          ? "question_purpose_mismatch"
          : null,

        !classifierAligned
          ? "classifier_operation_mismatch"
          : null,

        !familyAligned
          ? "classifier_family_mismatch"
          : null
      ].filter(Boolean),

      authority:
        "semantic_internal_agreement_only"
    };
  },

  calculateMeaningConfidence({
    sources = {},
    requestModel = {},
    semanticSlots = {},
    primaryFrame = {},
    ambiguity = {},
    frameAgreement = {}
  } = {}) {
    const explicitEvidence =
      requestModel.explicitRequestPresent
        ? 1
        : 0.45;

    const purposeConfidence =
      this.normalizeConfidence(
        requestModel.purposeConfidence
      );

    const classifierConfidence =
      this.normalizeConfidence(
        sources.classification
          ?.confidence
      );

    const agreementScore =
      this.normalizeConfidence(
        frameAgreement.score
      );

    const slotCompleteness =
      this.normalizeConfidence(
        semanticSlots.slotCompleteness
          ?.score
      );

    const evidenceSupport =
      primaryFrame.evidenceRefs?.length
        ? Math.min(
            1,
            primaryFrame.evidenceRefs
              .length / 4
          )
        : 0.35;

    const ambiguityPenalty =
      ambiguity.present
        ? 0.12
        : 0;

    const unresolvedPenalty =
      Math.min(
        0.2,
        (
          ambiguity.unresolvedSlots
            ?.length ||
          0
        ) * 0.05
      );

    const normalizedScore =
      this.normalizeConfidence(
        explicitEvidence * 0.28 +
        purposeConfidence * 0.16 +
        classifierConfidence * 0.14 +
        agreementScore * 0.18 +
        slotCompleteness * 0.16 +
        evidenceSupport * 0.08 -
        ambiguityPenalty -
        unresolvedPenalty
      );

    return {
      normalized:
        normalizedScore,

      score:
        Math.round(
          normalizedScore * 100
        ),

      label:
        this.confidenceLabel(
          normalizedScore
        ),

      breakdown: {
        explicitEvidence,
        purposeConfidence,
        classifierConfidence,
        agreementScore,
        slotCompleteness,
        evidenceSupport,
        ambiguityPenalty,
        unresolvedPenalty
      }
    };
  },

  /* =====================================================
     HANDOFF
  ===================================================== */

  buildHandoff({
    canonicalMeaning = {},
    primaryFrame = {},
    secondaryFrames = [],
    contextModel = {},
    continuity = {},
    ambiguity = {},
    responseRequirements = {},
    frameAgreement = {},
    confidence = {}
  } = {}) {
    return {
      readyForConversationFunction:
        Boolean(
          primaryFrame.frameType &&
          canonicalMeaning
            .requestedOperation
        ),

      readyForReconciliation:
        Boolean(
          primaryFrame.frameType &&
          canonicalMeaning
            .interactionFamily &&
          canonicalMeaning
            .targetDomain
        ),

      primaryFrame,

      secondaryFrames,

      canonicalMeaning,

      contextModifiers:
        contextModel.modifiers ||
        [],

      constraints:
        contextModel.constraints ||
        [],

      stakes:
        contextModel.stakes ||
        [],

      continuity,

      ambiguity,

      responseRequirements,

      frameAgreement,

      confidence,

      currentMeaning:
        primaryFrame.frameType,

      domain:
        canonicalMeaning
          .targetDomain,

      intent:
        canonicalMeaning
          .requestedOperation,

      requestedOperation:
        canonicalMeaning
          .requestedOperation,

      requestedOutput:
        canonicalMeaning
          .requestedOutput,

      target:
        canonicalMeaning.target,

      targetObject:
        canonicalMeaning
          .targetObject,

      requiresPriorContext:
        continuity
          .requiresPriorContext,

      inheritedSubject:
        continuity
          .inheritedSubject,

      priorContextAvailable:
        continuity
          .threadAvailable,

      previousAnswerSummary:
        continuity
          .previousAnswerSummary,

      ambiguityPresent:
        ambiguity.present,

      clarificationRequired:
        ambiguity
          .requiresClarification === true,

      authority: {
        canChooseConversationFunction: false,
        canChooseLane: false,
        canChooseRoute: false,
        canChoosePlanner: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        canSetContract: false,

        role:
          "semantic_meaning_handoff_only"
      }
    };
  },

  /* =====================================================
     SEMANTIC SUMMARY
  ===================================================== */

  buildSemanticSummary({
    normalized = {},
    requestModel = {},
    semanticSlots = {},
    contextModel = {},
    continuity = {},
    primaryFrame = {},
    secondaryFrames = [],
    allFrames = [],
    ambiguity = {},
    canonicalMeaning = {},
    responseRequirements = {},
    emotionalOverlay = {},
    framePriority = {},
    frameAgreement = {},
    confidence = {}
  } = {}) {
    return {
      primaryMeaning:
        primaryFrame.frameType,

      operation:
        primaryFrame.operation,

      requestedOutput:
        primaryFrame.requestedOutput,

      domain:
        contextModel.primaryDomain ||
        primaryFrame.domain,

      secondaryDomains:
        contextModel.secondaryDomains ||
        [],

      intent:
        primaryFrame.operation,

      interactionFamily:
        primaryFrame.interactionFamily,

      intentFamily:
        primaryFrame.intentFamily,

      conversationStyle:
        this.conversationStyleFromFrame(
          primaryFrame
        ),

      confidence:
        confidence.label ||
        "low",

      confidenceScore:
        confidence.normalized ||
        0,

      secondaryMeanings:
        secondaryFrames.map(frame =>
          frame.frameType
        ),

      subject:
        semanticSlots.subject,

      target:
        semanticSlots.target,

      targetObject:
        semanticSlots.object,

      options:
        semanticSlots.options,

      criteria:
        semanticSlots.criteria,

      constraints:
        contextModel.constraints,

      stakes:
        contextModel.stakes,

      contextModifiers:
        contextModel.modifiers,

      continuity,

      responseCharacteristics:
        responseRequirements,

      emotionalOverlay,
      ambiguity,
      framePriority,
      frameAgreement,
      canonicalMeaning,

      competingMeanings:
        allFrames
          .filter(frame =>
            frame.frameId !==
            primaryFrame.frameId
          )
          .map(frame =>
            frame.frameType
          ),

      languageNotes: {
        slangResolved:
          normalized.detectedSlang
            .length > 0,

        typosResolved:
          normalized.detectedTypos
            .length > 0,

        profanityAsSignal:
          normalized.hasProfanity,

        shortTurn:
          normalized.isShortTurn
      }
    };
  },

  /* =====================================================
     TARGET / SLOT EXTRACTION
  ===================================================== */

  extractDeveloperTarget(text = "") {
    const fileMatch =
      text.match(
        /\b[\w/-]+\.(?:js|html|css|json|md|sql|ts|tsx|jsx)\b/i
      );

    if (fileMatch) {
      return {
        type:
          "file",

        value:
          fileMatch[0],

        confidence:
          0.95
      };
    }

    const systemTargets = [
      ["semantic_frame_builder", /\bsemantic frame builder\b/],
      ["conversation_function", /\bconversation function\b/],
      ["perception_reconciliation_engine", /\bperception reconciliation(?: engine)?\b/],
      ["universal_conversation_classifier", /\buniversal conversation classifier\b/],
      ["observer_network", /\bobserver network\b/],
      ["observation_ledger", /\bobservation ledger\b/],
      ["perception_pipeline", /\bperception pipeline\b/],
      ["executive_routing", /\bexecutive routing\b/],
      ["blueprint_writer", /\bblueprint writer\b/],
      ["ai_writer", /\bai writer\b/],
      ["language_composer", /\blanguage composer\b/],
      ["medical_os", /\bmedical os\b/]
    ];

    for (
      const [value, pattern]
      of systemTargets
    ) {
      if (pattern.test(text)) {
        return {
          type:
            "system_component",

          value,

          confidence:
            0.9
        };
      }
    }

    return null;
  },

  extractFactualTarget(
    text = "",
    requestModel = {}
  ) {
    const capitalMatch =
      text.match(
        /\b(?:what is|what's|whats)\s+the\s+capital\s+of\s+(.+?)(?:\?|$)/i
      );

    if (capitalMatch) {
      const entity =
        this.clean(
          capitalMatch[1]
        );

      return {
        type:
          "attribute_query",

        value:
          `capital of ${entity}`,

        entity,

        attribute:
          "capital",

        origin:
          "explicit",

        confidence:
          0.96,

        evidenceRefs: []
      };
    }

    const definitionMatch =
      text.match(
        /\b(?:what is|what's|whats|define)\s+(.+?)(?:\?|$)/i
      );

    if (
      definitionMatch &&
      requestModel.operation
        .includes("information")
    ) {
      return {
        type:
          "concept",

        value:
          this.clean(
            definitionMatch[1]
          ),

        origin:
          "explicit",

        confidence:
          0.84,

        evidenceRefs: []
      };
    }

    return null;
  },

  extractFactualObject(text = "") {
    const capitalMatch =
      text.match(
        /\b(?:what is|what's|whats)\s+the\s+capital\s+of\s+(.+?)(?:\?|$)/i
      );

    if (capitalMatch) {
      const entity =
        this.clean(
          capitalMatch[1]
        );

      return {
        type:
          "location_fact",

        name:
          `capital of ${entity}`,

        entity,

        attribute:
          "capital"
      };
    }

    return null;
  },

  extractDecisionTarget(
    text = "",
    requestModel = {}
  ) {
    if (
      !this.isDecisionOperation(
        requestModel.operation
      )
    ) {
      return null;
    }

    const focusMatch =
      text.match(
        /\bwhat should (?:i|we) focus on(?: first)?\??\s*$/i
      );

    if (focusMatch) {
      const prefix =
        text
          .replace(
            focusMatch[0],
            ""
          )
          .trim();

      return {
        type:
          "priority_decision",

        value:
          prefix ||
          "current priorities",

        origin:
          prefix
            ? "explicit"
            : "inferred",

        confidence:
          prefix
            ? 0.84
            : 0.55,

        evidenceRefs: []
      };
    }

    if (
      /\bwhich should (?:i|we) choose\b/.test(text)
    ) {
      return {
        type:
          "option_choice",

        value:
          "stated options",

        origin:
          "explicit",

        confidence:
          0.8,

        evidenceRefs: []
      };
    }

    return null;
  },

  extractWritingTarget(
    text = "",
    requestModel = {}
  ) {
    if (
      ![
        "writing",
        "produce or revise text",
        "produce_or_revise_text"
      ].some(value =>
        this.normalize(
          requestModel.operation
        ).includes(
          this.normalize(value)
        )
      )
    ) {
      return null;
    }

    const types = [
      "email",
      "text message",
      "caption",
      "invitation",
      "essay",
      "paragraph",
      "response",
      "reply"
    ];

    const found =
      types.find(type =>
        text.includes(type)
      );

    return {
      type:
        "written_artifact",

      value:
        found ||
        "written_text",

      origin:
        found
          ? "explicit"
          : "inferred",

      confidence:
        found
          ? 0.9
          : 0.6,

      evidenceRefs: []
    };
  },

  extractFallbackTarget(
    text = "",
    operation = ""
  ) {
    const removable = [
      "what",
      "why",
      "how",
      "when",
      "where",
      "who",
      "which",
      "is",
      "are",
      "do",
      "does",
      "did",
      "can",
      "could",
      "should",
      "would",
      "will",
      "i",
      "me",
      "my",
      "you",
      "your",
      "we",
      "our",
      "please",
      "tell",
      "explain",
      "recommend",
      "suggest",
      "choose",
      "decide",
      "create",
      "write",
      "make",
      "fix",
      "update",
      "review"
    ];

    let cleaned =
      ` ${text} `;

    removable.forEach(word => {
      cleaned =
        cleaned.replace(
          new RegExp(
            `\\b${this.escapeRegExp(word)}\\b`,
            "gi"
          ),
          " "
        );
    });

    cleaned =
      cleaned
        .replace(/\s+/g, " ")
        .replace(/[?!.]+$/g, "")
        .trim();

    const tokens =
      cleaned
        .split(/\s+/)
        .filter(token =>
          token.length >= 3
        );

    if (tokens.length < 2) {
      return null;
    }

    return tokens
      .slice(0, 12)
      .join(" ");
  },

  extractOptions({
    text = "",
    evidenceIndex = {},
    requestModel = {}
  } = {}) {
    const options = [];

    const optionEvidence =
      evidenceIndex.items?.filter(item =>
        item.raw?.slotCandidate ===
          "options" ||
        item.type ===
          "option_signal"
      ) || [];

    optionEvidence.forEach(item => {
      const value =
        item.raw?.option ||
        item.raw?.value ||
        item.value;

      if (value) {
        options.push({
          value,

          origin:
            "explicit",

          confidence:
            item.confidence,

          evidenceRefs: [
            item.id
          ]
        });
      }
    });

    const versusMatch =
      text.match(
        /(.+?)\s+(?:versus|vs\.?|or)\s+(.+?)(?:\?|$)/i
      );

    if (
      versusMatch &&
      this.isDecisionOperation(
        requestModel.operation
      )
    ) {
      const first =
        this.clean(
          versusMatch[1]
        );

      const second =
        this.clean(
          versusMatch[2]
        );

      if (first) {
        options.push({
          value:
            first,

          origin:
            "explicit",

          confidence:
            0.82,

          evidenceRefs: []
        });
      }

      if (second) {
        options.push({
          value:
            second,

          origin:
            "explicit",

          confidence:
            0.82,

          evidenceRefs: []
        });
      }
    }

    return this.dedupeSemanticValues(
      options
    );
  },

  extractCriteria({
    text = "",
    evidenceIndex = {}
  } = {}) {
    const criteria = [];

    const criteriaEvidence =
      evidenceIndex.items?.filter(item =>
        item.raw?.slotCandidate ===
          "criteria" ||
        item.type ===
          "criteria_signal"
      ) || [];

    criteriaEvidence.forEach(item => {
      criteria.push({
        value:
          item.raw?.criterion ||
          item.raw?.value ||
          item.value,

        origin:
          "explicit",

        confidence:
          item.confidence,

        evidenceRefs: [
          item.id
        ]
      });
    });

    const knownCriteria = [
      ["safety", /\bsafe|safest|safety\b/],
      ["cost", /\bcheap|cheaper|cost|afford|budget\b/],
      ["speed", /\bfast|faster|quick|quickest\b/],
      ["ease", /\beasy|easier|simple|simpler\b/],
      ["quality", /\bquality|better|best|reliable\b/],
      ["priority", /\bimportant|priority|focus first\b/],
      ["dependency_order", /\bcomes first|before|after|dependency\b/],
      ["efficiency", /\befficient|efficiency|performance\b/]
    ];

    knownCriteria.forEach(
      ([value, pattern]) => {
        if (pattern.test(text)) {
          criteria.push({
            value,

            origin:
              "explicit",

            confidence:
              0.74,

            evidenceRefs: []
          });
        }
      }
    );

    return this.dedupeSemanticValues(
      criteria
    );
  },

  extractTimeframe({
    text = "",
    evidenceIndex = {}
  } = {}) {
    const timeEvidence =
      evidenceIndex.items?.find(item =>
        [
          "past_time",
          "current_time",
          "future_time",
          "time_reference"
        ].includes(item.type)
      );

    const phrase =
      this.extractTimePhrase(text);

    if (
      !timeEvidence &&
      !phrase
    ) {
      return null;
    }

    return {
      value:
        phrase ||
        timeEvidence?.value,

      origin:
        phrase
          ? "explicit"
          : "observed",

      confidence:
        phrase
          ? 0.85
          : timeEvidence.confidence,

      evidenceRefs:
        timeEvidence
          ? [timeEvidence.id]
          : []
    };
  },

  extractAudience({
    text = "",
    evidenceIndex = {}
  } = {}) {
    const audienceEvidence =
      evidenceIndex.items?.find(item =>
        item.raw?.slotCandidate ===
          "audience"
      );

    if (audienceEvidence) {
      return {
        value:
          audienceEvidence.raw
            ?.evidence ||
          audienceEvidence.value,

        origin:
          "explicit",

        confidence:
          audienceEvidence.confidence,

        evidenceRefs: [
          audienceEvidence.id
        ]
      };
    }

    const match =
      text.match(
        /\bfor\s+(my wife|my husband|my spouse|my boss|my coworker|my family|my team|me|us)\b/i
      );

    if (!match) {
      return null;
    }

    return {
      value:
        match[1],

      origin:
        "explicit",

      confidence:
        0.84,

      evidenceRefs: []
    };
  },

  extractLocation({
    text = "",
    evidenceIndex = {}
  } = {}) {
    const locationEvidence =
      evidenceIndex.items?.find(item =>
        item.type ===
          "location_reference"
      );

    if (!locationEvidence) {
      return null;
    }

    return {
      value:
        locationEvidence.value,

      origin:
        "observed",

      confidence:
        locationEvidence.confidence,

      evidenceRefs: [
        locationEvidence.id
      ]
    };
  },

  /* =====================================================
     DOMAIN RESOLUTION
  ===================================================== */

  resolveSemanticDomains({
    sources = {},
    evidenceIndex = {},
    requestModel = {},
    modifiers = [],
    stakes = []
  } = {}) {
    const scores =
      new Map();

    const add =
      (
        domain,
        score
      ) => {
        const normalized =
          this.normalizeDomain(
            domain
          );

        if (!normalized) return;

        scores.set(
          normalized,
          Number(
            scores.get(normalized) ||
            0
          ) +
          Number(score || 0)
        );
      };

    const classifierDomains =
      sources.classification
        ?.domains ||
      [];

    classifierDomains.forEach(
      (domain, index) =>
        add(
          domain,
          index === 0
            ? 50
            : 30
        )
    );

    if (
      sources.classification
        ?.primaryDomain
    ) {
      add(
        sources.classification
          .primaryDomain,
        55
      );
    }

    evidenceIndex.domainEvidence
      ?.forEach(item =>
        add(
          item.domain,
          20 +
          item.confidence * 20
        )
      );

    modifiers.forEach(item => {
      if (
        item.type.includes("medical")
      ) {
        add("medical", 25);
      }

      if (
        item.type.includes("emotion")
      ) {
        add("emotion", 18);
      }

      if (
        item.type.includes("life")
      ) {
        add("life_context", 15);
      }
    });

    stakes.forEach(item => {
      if (
        item.type.includes("family")
      ) {
        add("family", 25);
      }

      if (
        item.type.includes("relationship")
      ) {
        add("relationship", 22);
      }

      if (
        item.type.includes("project")
      ) {
        add("project", 22);
      }
    });

    const operationDomain =
      this.domainFromOperation(
        requestModel.operation
      );

    if (operationDomain) {
      add(
        operationDomain,
        18
      );
    }

    const ranked =
      [...scores.entries()]
        .sort((a, b) =>
          b[1] - a[1]
        )
        .map(([domain]) =>
          domain
        );

    return ranked.length
      ? ranked
      : ["general_understanding"];
  },

  /* =====================================================
     OPERATION MAPPING
  ===================================================== */

  operationFromPurpose(
    purpose = "",
    requestType = ""
  ) {
    const normalizedPurpose =
      this.normalize(purpose);

    const normalizedType =
      this.normalize(requestType);

    const map = {
      decision:
        "decide_or_prioritize",

      planning:
        "create_plan",

      writing:
        "produce_or_revise_text",

      translation:
        "translate",

      calculation:
        "calculate_or_convert",

      verification:
        "verify_or_review",

      memory:
        "save_or_forget_memory",

      recall:
        "retrieve_prior_context",

      identity:
        "answer_identity_question",

      opinion:
        "provide_opinion",

      creation:
        "create_artifact",

      emotional:
        "provide_emotional_support",

      teaching:
        "explain_or_teach",

      meaning:
        "interpret_meaning",

      factual:
        "provide_information",

      understanding:
        "provide_information",

      implementation:
        "implement_or_modify"
    };

    return (
      map[normalizedPurpose] ||
      map[normalizedType] ||
      null
    );
  },

  outputFromPurpose(
    purpose = "",
    requestType = ""
  ) {
    const operation =
      this.operationFromPurpose(
        purpose,
        requestType
      );

    const map = {
      decide_or_prioritize:
        "recommendation_or_priority",

      create_plan:
        "plan_or_roadmap",

      produce_or_revise_text:
        "written_text",

      translate:
        "translated_text",

      calculate_or_convert:
        "calculated_result",

      verify_or_review:
        "verification_result",

      save_or_forget_memory:
        "memory_action",

      retrieve_prior_context:
        "recalled_context",

      answer_identity_question:
        "identity_answer",

      provide_opinion:
        "opinion",

      create_artifact:
        "created_artifact",

      provide_emotional_support:
        "supportive_response",

      explain_or_teach:
        "explanation",

      interpret_meaning:
        "interpretation",

      provide_information:
        "direct_information",

      implement_or_modify:
        "implementation_or_code"
    };

    return map[operation] || null;
  },

  requestTypeFromOperation(
    operation = ""
  ) {
    const normalized =
      this.normalize(operation);

    if (
      normalized.includes("implement") ||
      normalized.includes("modify")
    ) {
      return "implementation";
    }

    if (
      normalized.includes("decide") ||
      normalized.includes("prioritize") ||
      normalized.includes("recommend")
    ) {
      return "decision";
    }

    if (
      normalized.includes("plan")
    ) {
      return "planning";
    }

    if (
      normalized.includes("write") ||
      normalized.includes("revise")
    ) {
      return "writing";
    }

    if (
      normalized.includes("translate")
    ) {
      return "translation";
    }

    if (
      normalized.includes("calculate") ||
      normalized.includes("convert")
    ) {
      return "calculation";
    }

    if (
      normalized.includes("verify") ||
      normalized.includes("review")
    ) {
      return "verification";
    }

    if (
      normalized.includes("memory")
    ) {
      return "memory";
    }

    if (
      normalized.includes("identity")
    ) {
      return "identity";
    }

    if (
      normalized.includes("opinion")
    ) {
      return "opinion";
    }

    if (
      normalized.includes("create")
    ) {
      return "creation";
    }

    if (
      normalized.includes("emotional")
    ) {
      return "emotional_support";
    }

    if (
      normalized.includes("explain") ||
      normalized.includes("teach")
    ) {
      return "explanation";
    }

    if (
      normalized.includes("information")
    ) {
      return "information";
    }

    return "general";
  },

  frameTypeFromOperation(
    operation = "",
    requestType = ""
  ) {
    const normalized =
      this.normalize(operation);

    if (
      requestType ===
        "implementation" ||
      normalized.includes("implement") ||
      normalized.includes("modify")
    ) {
      return "developer_artifact_request";
    }

    if (
      requestType === "decision" ||
      this.isDecisionOperation(
        normalized
      )
    ) {
      return "decision_request";
    }

    if (
      requestType === "planning" ||
      normalized.includes("plan")
    ) {
      return "planning_request";
    }

    if (
      requestType === "writing" ||
      normalized.includes("write") ||
      normalized.includes("revise")
    ) {
      return "writing_request";
    }

    if (
      requestType === "translation" ||
      normalized.includes("translate")
    ) {
      return "translation_request";
    }

    if (
      requestType === "calculation" ||
      normalized.includes("calculate") ||
      normalized.includes("convert")
    ) {
      return "calculation_request";
    }

    if (
      requestType === "verification" ||
      normalized.includes("verify") ||
      normalized.includes("review")
    ) {
      return "verification_request";
    }

    if (
      requestType === "memory" ||
      normalized.includes("memory")
    ) {
      return "memory_request";
    }

    if (
      requestType === "identity" ||
      normalized.includes("identity")
    ) {
      return "identity_question";
    }

    if (
      requestType === "opinion" ||
      normalized.includes("opinion")
    ) {
      return "opinion_request";
    }

    if (
      requestType === "creation" ||
      normalized.includes("create")
    ) {
      return "creation_request";
    }

    if (
      requestType ===
        "emotional_support" ||
      normalized.includes("emotional support")
    ) {
      return "emotional_support_request";
    }

    if (
      requestType === "explanation" ||
      normalized.includes("explain") ||
      normalized.includes("teach")
    ) {
      return "explanation_request";
    }

    if (
      requestType === "information" ||
      normalized.includes("information")
    ) {
      return "information_request";
    }

    return "general_request";
  },

  interactionFamilyFromOperation(
    operation = ""
  ) {
    const type =
      this.requestTypeFromOperation(
        operation
      );

    const map = {
      implementation:
        "developer_task",

      decision:
        "decision",

      planning:
        "planning",

      writing:
        "writing",

      translation:
        "translation",

      calculation:
        "calculation",

      verification:
        "verification",

      memory:
        "memory",

      identity:
        "identity",

      opinion:
        "opinion",

      creation:
        "creation",

      emotional_support:
        "emotional_support",

      explanation:
        "information",

      information:
        "information",

      general:
        "general"
    };

    return map[type] || "general";
  },

  intentFamilyFromOperation(
    operation = ""
  ) {
    const type =
      this.requestTypeFromOperation(
        operation
      );

    const map = {
      implementation:
        "artifact_execution",

      decision:
        "recommendation",

      planning:
        "planning",

      writing:
        "text_generation",

      translation:
        "language_transformation",

      calculation:
        "calculation",

      verification:
        "verification",

      memory:
        "memory_action",

      identity:
        "identity",

      opinion:
        "judgment",

      creation:
        "artifact_creation",

      emotional_support:
        "emotional_support",

      explanation:
        "explanation",

      information:
        "fact_retrieval",

      general:
        "general_response"
    };

    return map[type] || "general_response";
  },

  domainFromOperation(
    operation = ""
  ) {
    const normalized =
      this.normalize(operation);

    if (
      normalized.includes("implement") ||
      normalized.includes("modify")
    ) {
      return "project";
    }

    if (
      normalized.includes("write")
    ) {
      return "writing";
    }

    if (
      normalized.includes("translate")
    ) {
      return "language";
    }

    if (
      normalized.includes("calculate")
    ) {
      return "calculation";
    }

    if (
      normalized.includes("memory")
    ) {
      return "memory";
    }

    if (
      normalized.includes("identity")
    ) {
      return "identity";
    }

    if (
      normalized.includes("emotional")
    ) {
      return "emotion";
    }

    return "general_understanding";
  },

  requiredSlotsForOperation(
    operation = ""
  ) {
    const normalized =
      this.normalize(operation);

    if (
      this.isDecisionOperation(
        normalized
      )
    ) {
      return [
        "target"
      ];
    }

    if (
      normalized.includes("implement") ||
      normalized.includes("modify")
    ) {
      return [
        "target",
        "object"
      ];
    }

    if (
      normalized.includes("write") ||
      normalized.includes("translate") ||
      normalized.includes("verify")
    ) {
      return [
        "target"
      ];
    }

    if (
      normalized.includes("calculate")
    ) {
      return [
        "target"
      ];
    }

    if (
      normalized.includes("information") ||
      normalized.includes("explain")
    ) {
      return [
        "target"
      ];
    }

    return [];
  },

  isDecisionOperation(
    operation = ""
  ) {
    const normalized =
      this.normalize(operation);

    return (
      normalized.includes("decide") ||
      normalized.includes("choose") ||
      normalized.includes("prioritize") ||
      normalized.includes("recommend") ||
      normalized.includes("compare")
    );
  },

  resolveSpeechAct(
    normalized = {},
    operation = ""
  ) {
    if (
      normalized.hasQuestionMark ||
      /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(
        normalized.text
      )
    ) {
      return "question";
    }

    if (
      /^(remove|delete|hide|change|update|replace|rename|move|add|insert|fix|implement|wire|connect|disable|enable|patch|upgrade|write|create|make|send)\b/.test(
        normalized.text
      )
    ) {
      return "instruction";
    }

    if (
      operation &&
      operation !== "respond"
    ) {
      return "request";
    }

    return "statement";
  },

  /* =====================================================
     OUTPUT MODE HELPERS
  ===================================================== */

  responseModeFromFrame(
    frame = {}
  ) {
    const family =
      frame.interactionFamily;

    const map = {
      developer_task:
        "code_or_artifact",

      writing:
        "written_output",

      translation:
        "translated_output",

      calculation:
        "calculated_output",

      decision:
        "recommendation",

      planning:
        "plan",

      verification:
        "verification_result",

      creation:
        "created_artifact",

      emotional_support:
        "supportive_response",

      information:
        "direct_answer"
    };

    return map[family] ||
      "normal_response";
  },

  conversationStyleFromFrame(
    frame = {}
  ) {
    const map = {
      developer_task:
        "artifact_operation",

      decision:
        "recommendation_request",

      planning:
        "planning_request",

      writing:
        "writing_request",

      translation:
        "translation_request",

      calculation:
        "calculation_request",

      verification:
        "verification_request",

      identity:
        "identity_question",

      opinion:
        "opinion_request",

      creation:
        "creation_request",

      emotional_support:
        "support_request",

      information:
        "information_request"
    };

    return (
      map[frame.interactionFamily] ||
      "normal"
    );
  },

  /* =====================================================
     DEFAULT FRAME
  ===================================================== */

  defaultFrame(
    normalized = {}
  ) {
    return {
      frameId:
        this.makeFrameId(
          "general_conversation",
          "current_turn",
          0
        ),

      frameType:
        "general_conversation",

      speechAct:
        "statement",

      operation:
        "respond",

      intent:
        "respond",

      userGoal:
        "ordinary_conversation",

      requestedOutput:
        "response",

      interactionFamily:
        "general",

      intentFamily:
        "general_response",

      subject: {
        type:
          "unspecified",

        value:
          null,

        origin:
          "unknown",

        confidence:
          0,

        evidenceRefs: []
      },

      target: {
        type:
          "unknown",

        value:
          null,

        origin:
          "unknown",

        confidence:
          0,

        evidenceRefs: []
      },

      object: {
        type:
          "unknown",

        name:
          null,

        entity:
          null,

        attribute:
          null,

        filePath:
          null,

        origin:
          "unknown",

        confidence:
          0,

        evidenceRefs: []
      },

      options: [],
      criteria: [],

      domain:
        "general_understanding",

      secondaryDomains: [],

      contextModifiers: [],
      constraints: [],
      stakes: [],

      slotCompleteness: {
        required: 0,
        present: 0,
        missing: [],
        score: 1
      },

      origin:
        normalized.text
          ? "inferred"
          : "unknown",

      confidence:
        normalized.text
          ? 35
          : 5,

      confidenceLabel:
        "very_low",

      evidenceRefs: [],

      advisoryOnly:
        true
    };
  },

  /* =====================================================
     INHERITED CONTEXT
  ===================================================== */

  readInheritedContext(
    summary = {}
  ) {
    const threadState =
      summary.threadState ||
      {};

    const recentMessages =
      summary.recentMessages ||
      threadState.lastMessages ||
      [];

    return {
      threadAvailable:
        Boolean(
          summary.threadStateLoaded ||
          recentMessages.length ||
          threadState.currentTopic ||
          threadState.activeSubject ||
          threadState.continuitySummary
        ),

      currentTopic:
        this.stringifyTopic(
          summary.activeTopic ||
          threadState.currentTopic ||
          null
        ),

      activeSubject:
        this.stringifyTopic(
          summary.resolvedPrimarySubject ||
          threadState.activeSubject ||
          null
        ),

      previousAnswerSummary:
        threadState.previousAnswerSummary ||
        threadState.lastFinalResponse ||
        summary.previousAnswerSummary ||
        null,

      recentMessages:
        Array.isArray(
          recentMessages
        )
          ? recentMessages.slice(-6)
          : [],

      authority:
        "context_only_not_current_meaning"
    };
  },

  /* =====================================================
     NORMALIZATION
  ===================================================== */

  normalizeText(text = "") {
    const original =
      this.clean(text);

    let normalized =
      original.toLowerCase();

    const replacements = {
      "wtf":
        "what the fuck",

      "idk":
        "i do not know",

      "rn":
        "right now",

      "u":
        "you",

      "ur":
        "your",

      "pls":
        "please",

      "plz":
        "please",

      "gonna":
        "going to",

      "wanna":
        "want to",

      "kinda":
        "kind of",

      "bc":
        "because",

      "cuz":
        "because"
    };

    const detectedSlang = [];

    Object.keys(replacements)
      .sort((a, b) =>
        b.length - a.length
      )
      .forEach(key => {
        const pattern =
          new RegExp(
            `\\b${this.escapeRegExp(key)}\\b`,
            "gi"
          );

        if (
          pattern.test(normalized)
        ) {
          detectedSlang.push({
            from:
              key,

            to:
              replacements[key]
          });

          normalized =
            normalized.replace(
              pattern,
              replacements[key]
            );
        }
      });

    normalized =
      normalized
        .replace(/[“”]/g, "\"")
        .replace(/[‘’]/g, "'")
        .replace(/\s+/g, " ")
        .trim();

    const wordCount =
      normalized
        .split(/\s+/)
        .filter(Boolean)
        .length;

    return {
      original,
      text:
        normalized,

      wordCount,

      detectedSlang,
      detectedTypos: [],

      hasQuestionMark:
        original.includes("?"),

      hasExclamation:
        original.includes("!"),

      hasProfanity:
        /\b(fuck|fucking|fucken|shit|wtf|damn|bullshit)\b/i.test(
          original
        ),

      isShortTurn:
        wordCount <= 5,

      isVeryShortTurn:
        wordCount <= 2
    };
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  frameIdentity(
    frame = {}
  ) {
    return [
      frame.frameType ||
        "unknown",

      frame.operation ||
        "unknown",

      frame.target?.type ||
        "unknown",

      frame.target?.value ||
        "unknown",

      frame.requestedOutput ||
        "unknown"
    ]
      .map(value =>
        this.normalize(value)
      )
      .join("|");
  },

  makeFrameId(
    frameType = "frame",
    target = "unknown",
    index = 0
  ) {
    const cleanType =
      this.normalize(frameType)
        .replace(/\s+/g, "_");

    const cleanTarget =
      this.normalize(target)
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 48);

    return [
      cleanType ||
        "frame",

      cleanTarget ||
        "unknown",

      Number(index || 0)
    ].join("_");
  },

  slotPresent(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return false;
    }

    if (
      Array.isArray(value)
    ) {
      return value.length > 0;
    }

    if (
      typeof value === "object"
    ) {
      return Boolean(
        value.value ||
        value.name ||
        value.type !== "unknown"
      );
    }

    return Boolean(
      String(value).trim()
    );
  },

  mergeSemanticItems(
    first = [],
    second = []
  ) {
    const combined = [
      ...(first || []),
      ...(second || [])
    ];

    const seen =
      new Set();

    return combined.filter(item => {
      const key =
        [
          item?.type ||
            "unknown",

          item?.value ||
            "unknown"
        ].join("|");

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  },

  dedupeSemanticValues(
    values = []
  ) {
    const seen =
      new Set();

    return values.filter(item => {
      const value =
        this.normalize(
          item?.value
        );

      if (
        !value ||
        seen.has(value)
      ) {
        return false;
      }

      seen.add(value);
      return true;
    });
  },

  averageConfidence(
    items = [],
    fallback = 0.5
  ) {
    if (
      !Array.isArray(items) ||
      !items.length
    ) {
      return fallback;
    }

    const total =
      items.reduce(
        (sum, item) =>
          sum +
          this.normalizeConfidence(
            item.confidence
          ),
        0
      );

    return this.normalizeConfidence(
      total / items.length
    );
  },

  extractQuotedText(text = "") {
    const match =
      String(text).match(
        /["“](.+?)["”]/
      );

    return match?.[1]
      ? this.clean(match[1])
      : null;
  },

  extractTimePhrase(text = "") {
    const match =
      String(text).match(
        /\b(today|tonight|tomorrow|this week|next week|this month|next month|before [^,.!?]+|after [^,.!?]+|in \d+ (?:minutes?|hours?|days?|weeks?|months?|years?))\b/i
      );

    return match?.[0]
      ? this.clean(match[0])
      : null;
  },

  groupBy(
    items = [],
    field = "type"
  ) {
    return items.reduce(
      (groups, item) => {
        const key =
          item?.[field] ||
          "unknown";

        groups[key] =
          groups[key] ||
          [];

        groups[key].push(item);

        return groups;
      },
      {}
    );
  },

  normalizeList(value = []) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return [];
    }

    const list =
      Array.isArray(value)
        ? value
        : [value];

    return list
      .map(item => {
        if (
          typeof item === "string"
        ) {
          return this.normalize(
            item
          );
        }

        return this.normalize(
          item?.operation ||
          item?.value ||
          item?.name ||
          item?.type ||
          ""
        );
      })
      .filter(Boolean);
  },

  normalizeDomain(value = "") {
    const domain =
      this.normalize(value)
        .replace(/\s+/g, "_");

    const map = {
      body:
        "medical",

      health:
        "medical",

      medical_body:
        "medical",

      medical_context:
        "medical",

      builder:
        "project",

      builder_or_system:
        "project",

      coding:
        "project",

      developer:
        "project",

      ari_architecture:
        "project",

      financial:
        "finance",

      money:
        "finance",

      relationships:
        "relationship",

      parenthood:
        "family",

      emotional:
        "emotion",

      resource_pressure:
        "capacity",

      money_time_energy:
        "capacity",

      choice_or_priority:
        "decision",

      general:
        "general_understanding"
    };

    return map[domain] || domain;
  },

  normalizeConfidence(
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

  confidenceLabel(
    value = 0
  ) {
    const confidence =
      this.normalizeConfidence(
        value
      );

    if (
      confidence >= 0.88
    ) {
      return "high";
    }

    if (
      confidence >= 0.68
    ) {
      return "medium";
    }

    if (
      confidence >= 0.45
    ) {
      return "low";
    }

    return "very_low";
  },

  stringifyTopic(topic) {
    if (!topic) {
      return null;
    }

    if (
      typeof topic === "string"
    ) {
      return topic;
    }

    return (
      topic.surface ||
      topic.label ||
      topic.value ||
      topic.claim ||
      topic.evidence ||
      null
    );
  },

  clean(value = "") {
    return String(
      value || ""
    ).trim();
  },

  normalize(value = "") {
    return String(
      value || ""
    )
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  escapeRegExp(value = "") {
    return String(value)
      .replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
  }
};

window.Ari.semanticFrameBuilder =
  window.AriSemanticFrameBuilder;

console.log(
  "ARI SEMANTIC FRAME BUILDER LOADED:",
  window.AriSemanticFrameBuilder?.version
);