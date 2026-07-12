// ari/meaning/ari-request-interpreter.js
// Ari Request Interpreter
// Purpose: Determine what operation or output the user is requesting.
// V1.0.0 — Canonical Request Interpretation / No Frame / No Route / No Answer Authority

window.Ari = window.Ari || {};

window.AriRequestInterpreter = {
  version: "1.0.0",
  schemaVersion: "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  interpret(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const resolvedTurn =
      this.readResolvedTurn(summary);

    const semanticStructure =
      this.readSemanticStructure({
        summary,
        resolvedTurn
      });

    const currentTurn =
      this.readCurrentTurn({
        summary,
        resolvedTurn
      });

    const operationEvidence =
      this.collectOperationEvidence({
        currentTurn,
        semanticStructure
      });

    const outputEvidence =
      this.collectOutputEvidence({
        currentTurn,
        semanticStructure
      });

    const policyEvidence =
      this.collectPolicyEvidence({
        currentTurn,
        semanticStructure
      });

    const operationCandidates =
      this.buildOperationCandidates({
        currentTurn,
        semanticStructure,
        operationEvidence,
        outputEvidence,
        policyEvidence
      });

    const rankedOperations =
      this.rankOperationCandidates(
        operationCandidates
      );

    const primaryCandidate =
      rankedOperations[0] ||
      this.defaultOperationCandidate();

    const secondaryCandidates =
      this.selectSecondaryOperations({
        rankedOperations,
        primaryCandidate
      });

    const requestedOutput =
      this.resolveRequestedOutput({
        primaryCandidate,
        outputEvidence,
        currentTurn,
        semanticStructure
      });

    const actionPolicy =
      this.buildActionPolicy({
        currentTurn,
        primaryCandidate,
        secondaryCandidates,
        requestedOutput,
        policyEvidence
      });

    const ambiguity =
      this.buildAmbiguity({
        rankedOperations,
        primaryCandidate,
        secondaryCandidates,
        semanticStructure,
        currentTurn
      });

    const requestCharacteristics =
      this.buildRequestCharacteristics({
        currentTurn,
        semanticStructure,
        primaryCandidate,
        secondaryCandidates,
        requestedOutput,
        actionPolicy,
        ambiguity
      });

    const quality =
      this.buildQualityReport({
        currentTurn,
        semanticStructure,
        rankedOperations,
        primaryCandidate,
        ambiguity,
        actionPolicy
      });

    const interpretation =
      this.buildCanonicalInterpretation({
        currentTurn,
        semanticStructure,
        primaryCandidate,
        secondaryCandidates,
        requestedOutput,
        actionPolicy,
        ambiguity,
        requestCharacteristics,
        operationEvidence,
        outputEvidence,
        policyEvidence,
        rankedOperations,
        quality
      });

    window.Ari.requestInterpretation =
      interpretation;

    window.Ari.currentRequestInterpretation =
      interpretation;

    return this.buildReturnPayload({
      interpretation,
      primaryCandidate,
      secondaryCandidates,
      requestedOutput,
      actionPolicy,
      ambiguity,
      requestCharacteristics,
      quality
    });
  },

  /* =====================================================
     INPUT READING
  ===================================================== */

  readResolvedTurn(summary = {}) {
    const candidates = [
      summary.resolvedCurrentTurn,

      summary.threadQuestionResolution
        ?.resolvedCurrentTurn,

      summary.threadQuestionGenerator
        ?.resolvedCurrentTurn,

      summary.semanticHandoff
        ?.resolvedCurrentTurn,

      window.Ari.resolvedCurrentTurn
    ];

    const found =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object" &&
        (
          candidate.schema ===
            "ari_resolved_current_turn" ||
          candidate.rawText ||
          candidate.resolvedText
        )
      );

    if (found) {
      return found;
    }

    const rawText =
      this.cleanOriginal(
        summary.userMessage ||
        summary.message ||
        summary.input ||
        summary.normalizedMessage ||
        ""
      );

    return {
      schema:
        "ari_resolved_current_turn",

      version:
        null,

      source:
        "ari-request-interpreter-fallback",

      turnId:
        summary.turnId ||
        this.createStableId(
          "turn",
          rawText
        ),

      rawText,
      preservedText:
        rawText,

      resolvedText:
        rawText,

      normalizedText:
        this.normalize(rawText),

      textWasRewritten:
        false,

      resolvedSemanticStructure:
        summary.resolvedSemanticStructure ||
        summary.currentSemanticStructure ||
        summary.semanticStructure ||
        null
    };
  },

  readSemanticStructure({
    summary = {},
    resolvedTurn = {}
  } = {}) {
    const candidates = [
      resolvedTurn
        .resolvedSemanticStructure,

      resolvedTurn
        .semanticHandoff
        ?.semanticStructure,

      summary
        .resolvedSemanticStructure,

      summary
        .currentSemanticStructure,

      summary
        .semanticStructure,

      summary
        .referenceResolution
        ?.resolvedSemanticStructure,

      window.Ari
        .resolvedSemanticStructure,

      window.Ari
        .semanticStructure
    ];

    const found =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object" &&
        (
          candidate.schema ===
            "ari_resolved_semantic_structure" ||
          candidate.schema ===
            "ari_semantic_structure" ||
          Array.isArray(
            candidate.entities
          ) ||
          Array.isArray(
            candidate.claims
          )
        )
      );

    if (!found) {
      return this.emptySemanticStructure();
    }

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

      discourseSignals:
        this.asArray(
          found.discourseSignals
        ),

      emotionalSignals:
        this.asArray(
          found.emotionalSignals
        ),

      unresolved:
        this.asArray(
          found.unresolved
        ),

      evidenceRefs:
        this.asArray(
          found.evidenceRefs
        )
    };
  },

  emptySemanticStructure() {
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
      references: [],
      options: [],
      criteria: [],
      constraints: [],
      stakes: [],
      discourseSignals: [],
      emotionalSignals: [],
      unresolved: [],
      evidenceRefs: []
    };
  },

  readCurrentTurn({
    summary = {},
    resolvedTurn = {}
  } = {}) {
    const rawText =
      this.cleanOriginal(
        resolvedTurn.rawText ||
        resolvedTurn.preservedText ||
        resolvedTurn.resolvedText ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    const normalizedText =
      this.normalize(
        resolvedTurn.normalizedText ||
        rawText
      );

    const words =
      normalizedText
        .split(/\s+/)
        .filter(Boolean);

    return {
      turnId:
        resolvedTurn.turnId ||
        summary.turnId ||
        this.createStableId(
          "turn",
          rawText
        ),

      rawText,

      normalizedText,

      wordCount:
        words.length,

      isQuestion:
        this.isQuestion(
          rawText,
          normalizedText
        ),

      isInstruction:
        this.isInstruction(
          normalizedText
        ),

      isShortTurn:
        words.length <= 5,

      isVeryShortTurn:
        words.length <= 2,

      hasQuestionMark:
        rawText.includes("?"),

      hasProfanity:
        /\b(fuck|fucking|shit|bullshit|damn|wtf)\b/i.test(
          rawText
        ),

      preservedExactly:
        resolvedTurn.textWasRewritten !==
        true
    };
  },

  isQuestion(
    rawText = "",
    normalizedText = ""
  ) {
    return (
      String(rawText).includes("?") ||
      /^(what|why|how|when|where|who|which|is|are|am|do|does|did|can|could|should|would|will|was|were|has|have|had)\b/.test(
        normalizedText
      )
    );
  },

  isInstruction(text = "") {
    return /^(send|write|rewrite|create|make|build|fix|change|update|replace|remove|delete|add|move|rename|show|tell|explain|compare|calculate|convert|translate|review|inspect|check|find|search|remember|forget|save|schedule|remind)\b/.test(
      text
    );
  },

  /* =====================================================
     EVIDENCE COLLECTION
  ===================================================== */

  collectOperationEvidence({
    currentTurn = {},
    semanticStructure = {}
  } = {}) {
    const evidence = [];
    const text =
      currentTurn.normalizedText ||
      "";

    const add = ({
      operation,
      source,
      confidence = 0.7,
      weight = 1,
      evidenceText = null,
      semanticRef = null
    }) => {
      const normalizedOperation =
        this.normalizeOperation(
          operation
        );

      if (!normalizedOperation) {
        return;
      }

      evidence.push({
        id:
          this.createStableId(
            "operation_evidence",
            [
              normalizedOperation,
              source,
              evidenceText,
              semanticRef
            ].join("|")
          ),

        operation:
          normalizedOperation,

        source,

        confidence:
          this.normalizeConfidence(
            confidence
          ),

        weight:
          Number(weight || 1),

        evidenceText:
          evidenceText ||
          null,

        semanticRef:
          semanticRef ||
          null
      });
    };

    this.addDirectOperationPatterns({
      text,
      add
    });

    this.addSpeechActEvidence({
      currentTurn,
      add
    });

    this.addSemanticEventEvidence({
      semanticStructure,
      add
    });

    this.addSemanticClaimEvidence({
      semanticStructure,
      add
    });

    this.addDiscourseEvidence({
      semanticStructure,
      add
    });

    this.addReferenceStructureEvidence({
      semanticStructure,
      text,
      add
    });

    return this.dedupeEvidence(
      evidence
    );
  },

  addDirectOperationPatterns({
    text = "",
    add = () => {}
  } = {}) {
    const patterns = [
      {
        operation:
          "provide_information",

        pattern:
          /\b(?:what is|what's|whats|who is|who's|where is|when is|how many|how much|tell me about|give me information|do you know)\b/,

        confidence:
          0.9
      },

      {
        operation:
          "explain",

        pattern:
          /\b(?:why|explain|how does|how do|how did|how come|what caused|what causes|reason for)\b/,

        confidence:
          0.92
      },

      {
        operation:
          "compare",

        pattern:
          /\b(?:compare|comparison|versus|vs\.?|difference between|how big is that|how large is that|compare it to|which is bigger|which is better)\b/,

        confidence:
          0.94
      },

      {
        operation:
          "evaluate",

        pattern:
          /\b(?:evaluate|assess|is this good|is this bad|is it worth|will this work|does this make sense|what do you think of)\b/,

        confidence:
          0.9
      },

      {
        operation:
          "recommend",

        pattern:
          /\b(?:recommend|what do you recommend|what would you do|what should i do|what should we do|which should i choose|should i|best option)\b/,

        confidence:
          0.94
      },

      {
        operation:
          "prioritize",

        pattern:
          /\b(?:prioritize|what comes first|which comes first|what should i focus on|what matters most|highest priority|first priority)\b/,

        confidence:
          0.94
      },

      {
        operation:
          "plan",

        pattern:
          /\b(?:make a plan|create a plan|roadmap|what is the plan|what's the plan|next steps|how should i proceed|how do we move forward)\b/,

        confidence:
          0.92
      },

      {
        operation:
          "generate_text",

        pattern:
          /\b(?:write|rewrite|draft|compose|word this|respond to this|reply to this|make this professional|fix the grammar|proofread)\b/,

        confidence:
          0.94
      },

      {
        operation:
          "create_artifact",

        pattern:
          /\b(?:create|make|build|design|generate)\b.*\b(?:file|document|spreadsheet|presentation|slides|pdf|image|invitation|diagram|chart|website|page|artifact)\b/,

        confidence:
          0.94
      },

      {
        operation:
          "modify_artifact",

        pattern:
          /\b(?:update|change|modify|edit|replace|remove|delete|add|fix|patch|rewrite)\b.*\b(?:file|code|function|script|html|css|javascript|js|engine|pipeline|document|page)\b/,

        confidence:
          0.96
      },

      {
        operation:
          "implement",

        pattern:
          /\b(?:implement|wire|connect|integrate|send code|give me the code|full code|create the file|build the engine)\b/,

        confidence:
          0.97
      },

      {
        operation:
          "inspect",

        pattern:
          /\b(?:inspect|review|look at|take a look|analyze this file|check this file|read this code|which file failed)\b/,

        confidence:
          0.93
      },

      {
        operation:
          "debug",

        pattern:
          /\b(?:debug|bug|error|not working|broken|failed|failure|why did this fail|what caused the problem|what went wrong)\b/,

        confidence:
          0.94
      },

      {
        operation:
          "verify",

        pattern:
          /\b(?:verify|confirm|check whether|are you sure|is that correct|fact check|validate)\b/,

        confidence:
          0.91
      },

      {
        operation:
          "calculate",

        pattern:
          /\b(?:calculate|what is \d|what's \d|how many percent|percentage|sum|total|multiply|divide|subtract|add up)\b/,

        confidence:
          0.93
      },

      {
        operation:
          "convert",

        pattern:
          /\b(?:convert|conversion|in dollars|in pesos|in gallons|in liters|in miles|in kilometers|to usd|to pounds|to kilograms)\b/,

        confidence:
          0.92
      },

      {
        operation:
          "translate",

        pattern:
          /\b(?:translate|translation|in spanish|in english|say this in)\b/,

        confidence:
          0.96
      },

      {
        operation:
          "summarize",

        pattern:
          /\b(?:summarize|summary|sum this up|give me the main points|recap)\b/,

        confidence:
          0.94
      },

      {
        operation:
          "classify",

        pattern:
          /\b(?:classify|categorize|what category|what type of|identify the type)\b/,

        confidence:
          0.88
      },

      {
        operation:
          "retrieve_memory",

        pattern:
          /\b(?:do you remember|what did i say|what was the plan|what did we decide|recall|remember when)\b/,

        confidence:
          0.91
      },

      {
        operation:
          "store_memory",

        pattern:
          /\b(?:remember that|remember this|save this|store this|add this to memory|from now on)\b/,

        confidence:
          0.98
      },

      {
        operation:
          "forget_memory",

        pattern:
          /\b(?:forget that|forget this|delete that memory|remove that from memory)\b/,

        confidence:
          0.98
      },

      {
        operation:
          "provide_emotional_support",

        pattern:
          /\b(?:i feel|i'm feeling|i am feeling|i'm sad|i am sad|i'm scared|i am scared|i'm upset|i am upset|i'm overwhelmed|i am overwhelmed)\b/,

        confidence:
          0.72
      },

      {
        operation:
          "provide_opinion",

        pattern:
          /\b(?:do you believe|what do you believe|what is your opinion|what's your opinion|what do you think|do you like|would you choose)\b/,

        confidence:
          0.9
      },

      {
        operation:
          "answer_identity_question",

        pattern:
          /\b(?:who are you|what are you|what do you want|what do you believe|do you have feelings|are you ari)\b/,

        confidence:
          0.88
      },

      {
        operation:
          "continue_context",

        pattern:
          /^(?:next|continue|go on|keep going|and then|what next|more|keep building|send it)$/,

        confidence:
          0.9
      },

      {
        operation:
          "clarify",

        pattern:
          /\b(?:what do you mean|clarify|can you clarify|explain what you mean)\b/,

        confidence:
          0.9
      }
    ];

    patterns.forEach(rule => {
      const match =
        text.match(
          rule.pattern
        );

      if (!match) {
        return;
      }

      add({
        operation:
          rule.operation,

        source:
          "direct_text_pattern",

        confidence:
          rule.confidence,

        weight:
          1.25,

        evidenceText:
          match[0]
      });
    });
  },

  addSpeechActEvidence({
    currentTurn = {},
    add = () => {}
  } = {}) {
    if (
      currentTurn.isInstruction
    ) {
      add({
        operation:
          "execute_request",

        source:
          "speech_act",

        confidence:
          0.62,

        weight:
          0.6,

        evidenceText:
          "instruction_form"
      });
    }

    if (
      currentTurn.isQuestion
    ) {
      add({
        operation:
          "answer_question",

        source:
          "speech_act",

        confidence:
          0.58,

        weight:
          0.5,

        evidenceText:
          "question_form"
      });
    }
  },

  addSemanticEventEvidence({
    semanticStructure = {},
    add = () => {}
  } = {}) {
    this.asArray(
      semanticStructure.events
    ).forEach(event => {
      const predicate =
        this.normalize(
          event.predicate ||
          event.lemma ||
          event.action ||
          event.label ||
          event.value ||
          ""
        );

      const mapped =
        this.operationFromVerb(
          predicate
        );

      if (!mapped) {
        return;
      }

      add({
        operation:
          mapped,

        source:
          "semantic_event",

        confidence:
          event.confidence ??
          0.72,

        weight:
          0.9,

        evidenceText:
          predicate,

        semanticRef:
          event.id ||
          null
      });
    });
  },

  addSemanticClaimEvidence({
    semanticStructure = {},
    add = () => {}
  } = {}) {
    this.asArray(
      semanticStructure.claims
    ).forEach(claim => {
      const functionLabel =
        this.normalize(
          claim.requestedOperation ||
          claim.communicationFunction ||
          claim.claimType ||
          ""
        );

      const mapped =
        this.operationFromSemanticLabel(
          functionLabel
        );

      if (!mapped) {
        return;
      }

      add({
        operation:
          mapped,

        source:
          "semantic_claim",

        confidence:
          claim.confidence ??
          0.68,

        weight:
          0.75,

        evidenceText:
          functionLabel,

        semanticRef:
          claim.id ||
          null
      });
    });
  },

  addDiscourseEvidence({
    semanticStructure = {},
    add = () => {}
  } = {}) {
    this.asArray(
      semanticStructure.discourseSignals
    ).forEach(signal => {
      const value =
        this.normalize(
          signal.value ||
          signal.type ||
          signal.label ||
          ""
        );

      if (
        value.includes(
          "comparison"
        )
      ) {
        add({
          operation:
            "compare",

          source:
            "discourse_signal",

          confidence:
            signal.confidence ??
            0.82,

          weight:
            1,

          evidenceText:
            value,

          semanticRef:
            signal.id ||
            null
        });
      }

      if (
        value.includes(
          "correction"
        )
      ) {
        add({
          operation:
            "correct_prior_understanding",

          source:
            "discourse_signal",

          confidence:
            signal.confidence ??
            0.82,

          weight:
            1,

          evidenceText:
            value,

          semanticRef:
            signal.id ||
            null
        });
      }

      if (
        value.includes(
          "continuation"
        )
      ) {
        add({
          operation:
            "continue_context",

          source:
            "discourse_signal",

          confidence:
            signal.confidence ??
            0.8,

          weight:
            0.9,

          evidenceText:
            value,

          semanticRef:
            signal.id ||
            null
        });
      }

      if (
        value.includes(
          "contrast"
        )
      ) {
        add({
          operation:
            "compare",

          source:
            "discourse_signal",

          confidence:
            signal.confidence ??
            0.72,

          weight:
            0.7,

          evidenceText:
            value,

          semanticRef:
            signal.id ||
            null
        });
      }
    });
  },

  addReferenceStructureEvidence({
    semanticStructure = {},
    text = "",
    add = () => {}
  } = {}) {
    const resolvedReferences =
      this.asArray(
        semanticStructure.references
      ).filter(reference =>
        reference.resolved ===
        true
      );

    if (
      resolvedReferences.length &&
      /\b(?:how big|how large|how much|how many|compare|what about|why|how)\b/.test(
        text
      )
    ) {
      add({
        operation:
          /\bcompare|how big|how large\b/.test(
            text
          )
            ? "compare"
            : /\bwhy\b/.test(
                text
              )
              ? "explain"
              : "provide_information",

        source:
          "resolved_reference_structure",

        confidence:
          0.82,

        weight:
          1,

        evidenceText:
          "resolved_reference_present"
      });
    }
  },

  collectOutputEvidence({
    currentTurn = {},
    semanticStructure = {}
  } = {}) {
    const evidence = [];
    const text =
      currentTurn.normalizedText ||
      "";

    const add = (
      outputType,
      confidence,
      source,
      evidenceText = null
    ) => {
      evidence.push({
        id:
          this.createStableId(
            "output_evidence",
            [
              outputType,
              source,
              evidenceText
            ].join("|")
          ),

        outputType:
          this.normalizeOutputType(
            outputType
          ),

        confidence:
          this.normalizeConfidence(
            confidence
          ),

        source,

        evidenceText
      });
    };

    const patterns = [
      [
        "direct_answer",
        /\b(?:answer|tell me|what is|who is|where is|when is)\b/,
        0.82
      ],

      [
        "explanation",
        /\b(?:explain|why|how does|how did|reason)\b/,
        0.92
      ],

      [
        "comparison",
        /\b(?:compare|comparison|versus|vs\.?|difference|how big|how large)\b/,
        0.94
      ],

      [
        "recommendation",
        /\b(?:recommend|what should|which should|best option|what would you do)\b/,
        0.94
      ],

      [
        "plan",
        /\b(?:plan|roadmap|next steps|step by step)\b/,
        0.92
      ],

      [
        "code",
        /\b(?:send code|full code|give me the code|javascript|html|css|function|file)\b/,
        0.9
      ],

      [
        "written_text",
        /\b(?:write|rewrite|draft|email|message|caption|paragraph|reply)\b/,
        0.92
      ],

      [
        "calculated_result",
        /\b(?:calculate|percentage|how many|total|convert)\b/,
        0.86
      ],

      [
        "summary",
        /\b(?:summarize|summary|recap|main points)\b/,
        0.94
      ],

      [
        "translated_text",
        /\b(?:translate|in spanish|in english)\b/,
        0.94
      ],

      [
        "memory_action",
        /\b(?:remember|save this|forget this|memory)\b/,
        0.9
      ],

      [
        "supportive_response",
        /\b(?:i feel|i'm feeling|i am feeling|i'm sad|i am sad|i'm upset|i am upset)\b/,
        0.68
      ]
    ];

    patterns.forEach(
      ([
        outputType,
        pattern,
        confidence
      ]) => {
        const match =
          text.match(pattern);

        if (!match) {
          return;
        }

        add(
          outputType,
          confidence,
          "direct_text_pattern",
          match[0]
        );
      }
    );

    this.asArray(
      semanticStructure.claims
    ).forEach(claim => {
      const output =
        claim.requestedOutput ||
        claim.outputType ||
        null;

      if (!output) {
        return;
      }

      add(
        output,
        claim.confidence ??
        0.72,
        "semantic_claim",
        claim.id ||
        null
      );
    });

    return this.dedupeOutputEvidence(
      evidence
    );
  },

  collectPolicyEvidence({
    currentTurn = {},
    semanticStructure = {}
  } = {}) {
    const text =
      currentTurn.normalizedText ||
      "";

    const prohibitions = [];
    const deferrals = [];
    const permissions = [];
    const preferences = [];

    const add = (
      target,
      value,
      confidence,
      evidenceText
    ) => {
      target.push({
        value,
        confidence:
          this.normalizeConfidence(
            confidence
          ),

        evidenceText
      });
    };

    const executionProhibitionPatterns = [
      /\b(?:do not|don't|dont)\s+(?:write|rewrite|change|modify|edit|patch|implement|create|generate|send|build|fix)\b/,

      /\b(?:no code|without code|analysis only|discussion only|do not make changes|don't make changes|dont make changes)\b/,

      /\b(?:just explain|only explain|just analyze|only analyze|just tell me|do not generate anything)\b/
    ];

    executionProhibitionPatterns.forEach(
      pattern => {
        const match =
          text.match(pattern);

        if (!match) {
          return;
        }

        add(
          prohibitions,
          "artifact_execution",
          0.96,
          match[0]
        );
      }
    );

    const deferralPatterns = [
      /\b(?:not yet|later|for now|right now|at this point|wait before|do that later)\b/
    ];

    deferralPatterns.forEach(
      pattern => {
        const match =
          text.match(pattern);

        if (!match) {
          return;
        }

        add(
          deferrals,
          "execution_deferred",
          0.86,
          match[0]
        );
      }
    );

    const permissionPatterns = [
      /\b(?:go ahead|do it|send it|create it|make it|build it|update it|replace it|yes do that)\b/
    ];

    permissionPatterns.forEach(
      pattern => {
        const match =
          text.match(pattern);

        if (!match) {
          return;
        }

        add(
          permissions,
          "execution_allowed",
          0.9,
          match[0]
        );
      }
    );

    const preferencePatterns = [
      [
        "direct",
        /\b(?:be direct|direct answer|just answer|answer first)\b/
      ],

      [
        "concise",
        /\b(?:keep it short|short answer|briefly|concise)\b/
      ],

      [
        "detailed",
        /\b(?:explain in detail|detailed answer|deep dive|thorough)\b/
      ],

      [
        "step_by_step",
        /\b(?:step by step|walk me through|one step at a time)\b/
      ]
    ];

    preferencePatterns.forEach(
      ([
        value,
        pattern
      ]) => {
        const match =
          text.match(pattern);

        if (!match) {
          return;
        }

        add(
          preferences,
          value,
          0.88,
          match[0]
        );
      }
    );

    this.asArray(
      semanticStructure.constraints
    ).forEach(constraint => {
      const value =
        this.normalize(
          constraint.value ||
          constraint.label ||
          constraint.claim ||
          ""
        );

      if (
        value.includes(
          "do not execute"
        ) ||
        value.includes(
          "no code"
        )
      ) {
        add(
          prohibitions,
          "artifact_execution",
          constraint.confidence ??
          0.8,
          value
        );
      }
    });

    return {
      prohibitions,
      deferrals,
      permissions,
      preferences
    };
  },

  /* =====================================================
     OPERATION CANDIDATES
  ===================================================== */

  buildOperationCandidates({
    currentTurn = {},
    semanticStructure = {},
    operationEvidence = [],
    outputEvidence = [],
    policyEvidence = {}
  } = {}) {
    const grouped =
      new Map();

    operationEvidence.forEach(
      evidence => {
        const operation =
          this.normalizeOperation(
            evidence.operation
          );

        if (!operation) {
          return;
        }

        if (
          !grouped.has(operation)
        ) {
          grouped.set(
            operation,
            {
              operation,

              evidence: [],

              rawScore:
                0,

              confidence:
                0,

              sourceCount:
                0
            }
          );
        }

        const candidate =
          grouped.get(
            operation
          );

        candidate.evidence.push(
          evidence
        );

        candidate.rawScore +=
          evidence.confidence *
          evidence.weight *
          100;
      }
    );

    const candidates =
      [...grouped.values()]
        .map(candidate => {
          const sourceCount =
            new Set(
              candidate.evidence.map(
                item =>
                  item.source
              )
            ).size;

          const evidenceConfidence =
            candidate.evidence.length
              ? candidate.evidence.reduce(
                  (
                    total,
                    item
                  ) =>
                    total +
                    item.confidence,
                  0
                ) /
                candidate.evidence.length
              : 0;

          const sourceAgreementBonus =
            Math.min(
              18,
              Math.max(
                0,
                sourceCount -
                1
              ) *
              6
            );

          const structureBonus =
            this.operationStructureBonus({
              operation:
                candidate.operation,

              semanticStructure,
              outputEvidence,
              currentTurn
            });

          const policyAdjustment =
            this.operationPolicyAdjustment({
              operation:
                candidate.operation,

              policyEvidence
            });

          const score =
            candidate.rawScore +
            sourceAgreementBonus +
            structureBonus +
            policyAdjustment;

          return {
            operation:
              candidate.operation,

            score:
              Number(
                score.toFixed(3)
              ),

            confidence:
              this.normalizeConfidence(
                evidenceConfidence *
                  0.65 +
                Math.min(
                  1,
                  score /
                  150
                ) *
                  0.35
              ),

            sourceCount,

            evidence:
              candidate.evidence,

            sourceAgreementBonus,

            structureBonus,

            policyAdjustment,

            requestFamily:
              this.requestFamilyFromOperation(
                candidate.operation
              ),

            expectedOutput:
              this.defaultOutputForOperation(
                candidate.operation
              )
          };
        });

    if (!candidates.length) {
      candidates.push(
        this.inferFallbackCandidate({
          currentTurn,
          semanticStructure
        })
      );
    }

    return candidates;
  },

  operationStructureBonus({
    operation = "",
    semanticStructure = {},
    outputEvidence = [],
    currentTurn = {}
  } = {}) {
    let bonus = 0;

    if (
      operation ===
        "compare" &&
      (
        this.asArray(
          semanticStructure.options
        ).length >= 2 ||
        this.asArray(
          semanticStructure.quantities
        ).length > 0 ||
        outputEvidence.some(
          evidence =>
            evidence.outputType ===
            "comparison"
        )
      )
    ) {
      bonus += 22;
    }

    if (
      [
        "recommend",
        "prioritize",
        "evaluate"
      ].includes(operation) &&
      this.asArray(
        semanticStructure.options
      ).length >= 2
    ) {
      bonus += 20;
    }

    if (
      operation ===
        "calculate" &&
      this.asArray(
        semanticStructure.quantities
      ).length > 0
    ) {
      bonus += 18;
    }

    if (
      operation ===
        "provide_emotional_support" &&
      this.asArray(
        semanticStructure
          .emotionalSignals
      ).length > 0
    ) {
      bonus += 14;
    }

    if (
      currentTurn.isQuestion &&
      [
        "provide_information",
        "explain",
        "compare",
        "evaluate",
        "recommend",
        "verify",
        "calculate",
        "convert",
        "provide_opinion",
        "answer_identity_question"
      ].includes(operation)
    ) {
      bonus += 8;
    }

    return bonus;
  },

  operationPolicyAdjustment({
    operation = "",
    policyEvidence = {}
  } = {}) {
    const executionOperations = [
      "create_artifact",
      "modify_artifact",
      "implement",
      "generate_text",
      "execute_request"
    ];

    const executionProhibited =
      this.asArray(
        policyEvidence.prohibitions
      ).some(item =>
        item.value ===
        "artifact_execution"
      );

    if (
      executionProhibited &&
      executionOperations.includes(
        operation
      )
    ) {
      return -120;
    }

    return 0;
  },

  inferFallbackCandidate({
    currentTurn = {},
    semanticStructure = {}
  } = {}) {
    if (
      currentTurn.isQuestion
    ) {
      return {
        operation:
          "provide_information",

        score:
          45,

        confidence:
          0.5,

        sourceCount:
          1,

        evidence: [
          {
            id:
              this.createStableId(
                "operation_evidence",
                "fallback_question"
              ),

            operation:
              "provide_information",

            source:
              "fallback_speech_act",

            confidence:
              0.5,

            weight:
              0.9,

            evidenceText:
              "question_form"
          }
        ],

        sourceAgreementBonus:
          0,

        structureBonus:
          0,

        policyAdjustment:
          0,

        requestFamily:
          "information",

        expectedOutput:
          "direct_answer"
      };
    }

    if (
      this.asArray(
        semanticStructure
          .emotionalSignals
      ).length > 0
    ) {
      return {
        operation:
          "provide_emotional_support",

        score:
          42,

        confidence:
          0.48,

        sourceCount:
          1,

        evidence: [],

        sourceAgreementBonus:
          0,

        structureBonus:
          8,

        policyAdjustment:
          0,

        requestFamily:
          "emotional_support",

        expectedOutput:
          "supportive_response"
      };
    }

    return this.defaultOperationCandidate();
  },

  defaultOperationCandidate() {
    return {
      operation:
        "respond",

      score:
        30,

      confidence:
        0.35,

      sourceCount:
        0,

      evidence: [],

      sourceAgreementBonus:
        0,

      structureBonus:
        0,

      policyAdjustment:
        0,

      requestFamily:
        "general",

      expectedOutput:
        "response"
    };
  },

  rankOperationCandidates(
    candidates = []
  ) {
    return this.asArray(
      candidates
    )
      .filter(Boolean)
      .sort(
        (
          left,
          right
        ) => {
          if (
            right.score !==
            left.score
          ) {
            return (
              right.score -
              left.score
            );
          }

          if (
            right.confidence !==
            left.confidence
          ) {
            return (
              right.confidence -
              left.confidence
            );
          }

          return (
            right.sourceCount -
            left.sourceCount
          );
        }
      );
  },

  selectSecondaryOperations({
    rankedOperations = [],
    primaryCandidate = {}
  } = {}) {
    const primaryScore =
      Number(
        primaryCandidate.score ||
        0
      );

    return rankedOperations
      .filter(candidate =>
        candidate.operation !==
        primaryCandidate.operation
      )
      .filter(candidate => {
        const difference =
          primaryScore -
          Number(
            candidate.score ||
            0
          );

        return (
          candidate.score >=
            55 ||
          difference <=
            28
        );
      })
      .slice(0, 4);
  },

  /* =====================================================
     REQUESTED OUTPUT
  ===================================================== */

  resolveRequestedOutput({
    primaryCandidate = {},
    outputEvidence = [],
    currentTurn = {},
    semanticStructure = {}
  } = {}) {
    const grouped =
      new Map();

    outputEvidence.forEach(
      evidence => {
        const outputType =
          this.normalizeOutputType(
            evidence.outputType
          );

        if (!outputType) {
          return;
        }

        if (
          !grouped.has(outputType)
        ) {
          grouped.set(
            outputType,
            {
              outputType,
              score: 0,
              evidence: []
            }
          );
        }

        const item =
          grouped.get(
            outputType
          );

        item.score +=
          evidence.confidence *
          100;

        item.evidence.push(
          evidence
        );
      }
    );

    const defaultOutput =
      this.defaultOutputForOperation(
        primaryCandidate.operation
      );

    if (
      !grouped.has(defaultOutput)
    ) {
      grouped.set(
        defaultOutput,
        {
          outputType:
            defaultOutput,

          score:
            48,

          evidence: [
            {
              source:
                "operation_default",

              confidence:
                0.48,

              evidenceText:
                primaryCandidate.operation
            }
          ]
        }
      );
    } else {
      grouped.get(
        defaultOutput
      ).score += 15;
    }

    const ranked =
      [...grouped.values()]
        .sort(
          (
            left,
            right
          ) =>
            right.score -
            left.score
        );

    const primary =
      ranked[0] ||
      {
        outputType:
          "response",

        score:
          30,

        evidence: []
      };

    return {
      type:
        primary.outputType,

      confidence:
        this.normalizeConfidence(
          primary.score /
          120
        ),

      evidence:
        primary.evidence,

      alternatives:
        ranked
          .slice(1, 4)
          .map(item => ({
            type:
              item.outputType,

            confidence:
              this.normalizeConfidence(
                item.score /
                120
              )
          })),

      formatHints:
        this.resolveFormatHints({
          currentTurn,
          semanticStructure,
          outputType:
            primary.outputType
        })
    };
  },

  resolveFormatHints({
    currentTurn = {},
    outputType = ""
  } = {}) {
    const text =
      currentTurn.normalizedText ||
      "";

    return {
      direct:
        /\b(?:direct|just answer|answer first)\b/.test(
          text
        ),

      concise:
        /\b(?:short|brief|concise)\b/.test(
          text
        ),

      detailed:
        /\b(?:detailed|thorough|deep dive|explain fully)\b/.test(
          text
        ),

      stepByStep:
        /\b(?:step by step|walk me through|one step at a time)\b/.test(
          text
        ),

      codeOnly:
        outputType ===
          "code" &&
        /\b(?:just code|code only|no explanation)\b/.test(
          text
        ),

      preserveUserWording:
        true
    };
  },

  /* =====================================================
     ACTION POLICY
  ===================================================== */

  buildActionPolicy({
    primaryCandidate = {},
    secondaryCandidates = [],
    requestedOutput = {},
    policyEvidence = {}
  } = {}) {
    const executionOperations = [
      "create_artifact",
      "modify_artifact",
      "implement",
      "generate_text",
      "execute_request"
    ];

    const proposedOperations = [
      primaryCandidate.operation,
      ...secondaryCandidates.map(
        candidate =>
          candidate.operation
      )
    ].filter(Boolean);

    const executionRequested =
      proposedOperations.some(operation =>
        executionOperations.includes(
          operation
        )
      );

    const executionProhibited =
      this.asArray(
        policyEvidence.prohibitions
      ).some(item =>
        item.value ===
        "artifact_execution"
      );

    const executionDeferred =
      this.asArray(
        policyEvidence.deferrals
      ).some(item =>
        item.value ===
        "execution_deferred"
      );

    const executionExplicitlyAllowed =
      this.asArray(
        policyEvidence.permissions
      ).some(item =>
        item.value ===
        "execution_allowed"
      );

    const executionAllowed =
      !executionProhibited &&
      (
        !executionRequested ||
        executionExplicitlyAllowed ||
        primaryCandidate.confidence >=
          0.65
      );

    const analysisOnly =
      executionProhibited;

    const prohibitedOperations =
      executionProhibited
        ? [
            "create_artifact",
            "modify_artifact",
            "implement",
            "execute_request"
          ]
        : [];

    const deferredOperations =
      executionDeferred
        ? proposedOperations.filter(
            operation =>
              executionOperations.includes(
                operation
              )
          )
        : [];

    let resolvedOperation =
      primaryCandidate.operation;

    if (
      executionProhibited &&
      executionOperations.includes(
        resolvedOperation
      )
    ) {
      resolvedOperation =
        this.resolveAnalyticalAlternative({
          proposedOperation:
            resolvedOperation,

          secondaryCandidates
        });
    }

    return {
      proposedOperation:
        primaryCandidate.operation,

      resolvedOperation,

      proposedOperations,

      requestedOutput:
        requestedOutput.type,

      executionRequested,

      executionAllowed,

      executionProhibited,

      executionDeferred,

      executionExplicitlyAllowed,

      analysisOnly,

      prohibitedOperations,

      deferredOperations,

      preferences:
        this.asArray(
          policyEvidence.preferences
        ),

      evidence: {
        prohibitions:
          this.asArray(
            policyEvidence.prohibitions
          ),

        deferrals:
          this.asArray(
            policyEvidence.deferrals
          ),

        permissions:
          this.asArray(
            policyEvidence.permissions
          )
      },

      reason:
        executionProhibited
          ? "The user explicitly prohibited artifact execution. The request was converted to the closest authorized analytical operation."
          : executionDeferred
            ? "Execution was requested but deferred by the user."
            : executionRequested
              ? "The current turn authorizes an execution-oriented operation."
              : "The request does not require artifact execution.",

      authority:
        "explicit_user_action_policy_only"
    };
  },

  resolveAnalyticalAlternative({
    proposedOperation = "",
    secondaryCandidates = []
  } = {}) {
    const preferred = [
      "inspect",
      "debug",
      "evaluate",
      "explain",
      "recommend",
      "provide_information"
    ];

    const secondaryOperations =
      secondaryCandidates.map(
        candidate =>
          candidate.operation
      );

    const existing =
      preferred.find(operation =>
        secondaryOperations.includes(
          operation
        )
      );

    if (existing) {
      return existing;
    }

    if (
      proposedOperation ===
        "modify_artifact" ||
      proposedOperation ===
        "implement"
    ) {
      return "inspect";
    }

    if (
      proposedOperation ===
        "create_artifact" ||
      proposedOperation ===
        "generate_text"
    ) {
      return "explain";
    }

    return "provide_information";
  },

  /* =====================================================
     AMBIGUITY
  ===================================================== */

  buildAmbiguity({
    rankedOperations = [],
    primaryCandidate = {},
    secondaryCandidates = [],
    semanticStructure = {},
    currentTurn = {}
  } = {}) {
    const second =
      rankedOperations[1] ||
      null;

    const scoreGap =
      second
        ? Number(
            primaryCandidate.score ||
            0
          ) -
          Number(
            second.score ||
            0
          )
        : null;

    const closeCompetition =
      Boolean(
        second &&
        scoreGap <= 12
      );

    const unresolvedReferences =
      this.asArray(
        semanticStructure.references
      ).filter(reference =>
        reference.resolved !==
        true
      );

    const missingSemanticStructure =
      semanticStructure.ran ===
      false;

    const incompleteShortTurn =
      currentTurn.isShortTurn &&
      primaryCandidate.confidence <
        0.55;

    const conflictingOperations =
      closeCompetition &&
      this.operationsConflict(
        primaryCandidate.operation,
        second.operation
      );

    const present =
      closeCompetition ||
      unresolvedReferences.length >
        0 ||
      missingSemanticStructure ||
      incompleteShortTurn;

    const requiresClarification =
      unresolvedReferences.length >
        0 ||
      (
        conflictingOperations &&
        primaryCandidate.confidence <
          0.72
      ) ||
      (
        incompleteShortTurn &&
        primaryCandidate.operation ===
          "respond"
      );

    return {
      present,

      requiresClarification,

      reasons: [
        closeCompetition
          ? "close_operation_scores"
          : null,

        unresolvedReferences.length >
        0
          ? "unresolved_references"
          : null,

        missingSemanticStructure
          ? "semantic_structure_missing"
          : null,

        incompleteShortTurn
          ? "low_information_short_turn"
          : null,

        conflictingOperations
          ? "conflicting_operations"
          : null
      ].filter(Boolean),

      primaryOperation:
        primaryCandidate.operation,

      competingOperation:
        second?.operation ||
        null,

      scoreGap,

      unresolvedReferenceIds:
        unresolvedReferences
          .map(reference =>
            reference.id
          )
          .filter(Boolean),

      candidateOperations:
        [
          primaryCandidate,
          ...secondaryCandidates
        ].map(candidate => ({
          operation:
            candidate.operation,

          score:
            candidate.score,

          confidence:
            candidate.confidence
        })),

      confidence:
        present
          ? 0.68
          : 0.9
    };
  },

  operationsConflict(
    first = "",
    second = ""
  ) {
    const execution = [
      "create_artifact",
      "modify_artifact",
      "implement",
      "execute_request"
    ];

    const analytical = [
      "inspect",
      "evaluate",
      "explain",
      "provide_information",
      "verify"
    ];

    return (
      execution.includes(first) &&
      analytical.includes(second)
    ) ||
    (
      execution.includes(second) &&
      analytical.includes(first)
    );
  },

  /* =====================================================
     CHARACTERISTICS
  ===================================================== */

  buildRequestCharacteristics({
    currentTurn = {},
    semanticStructure = {},
    primaryCandidate = {},
    secondaryCandidates = [],
    requestedOutput = {},
    actionPolicy = {},
    ambiguity = {}
  } = {}) {
    const effectiveOperation =
      actionPolicy.resolvedOperation ||
      primaryCandidate.operation;

    return {
      speechAct:
        currentTurn.isInstruction
          ? "instruction"
          : currentTurn.isQuestion
            ? "question"
            : "statement",

      primaryOperation:
        effectiveOperation,

      secondaryOperations:
        secondaryCandidates.map(
          candidate =>
            candidate.operation
        ),

      requestFamily:
        this.requestFamilyFromOperation(
          effectiveOperation
        ),

      expectedOutput:
        requestedOutput.type,

      directAnswerExpected:
        [
          "provide_information",
          "explain",
          "compare",
          "evaluate",
          "recommend",
          "prioritize",
          "verify",
          "calculate",
          "convert",
          "provide_opinion",
          "answer_identity_question"
        ].includes(
          effectiveOperation
        ),

      explanationExpected:
        [
          "explain",
          "evaluate",
          "debug",
          "inspect"
        ].includes(
          effectiveOperation
        ),

      artifactExpected:
        [
          "create_artifact",
          "modify_artifact",
          "implement"
        ].includes(
          effectiveOperation
        ) &&
        actionPolicy.executionAllowed,

      collaborationExpected:
        [
          "plan",
          "recommend",
          "evaluate",
          "prioritize",
          "debug",
          "inspect",
          "implement",
          "modify_artifact"
        ].includes(
          effectiveOperation
        ),

      reflectionExpected:
        [
          "provide_emotional_support",
          "answer_identity_question",
          "provide_opinion"
        ].includes(
          effectiveOperation
        ),

      requiresPriorContext:
        this.asArray(
          semanticStructure
            .inheritedNodes
        ).length > 0,

      requiresClarification:
        ambiguity
          .requiresClarification,

      multipleOperationsPresent:
        secondaryCandidates.length >
        0,

      executionAllowed:
        actionPolicy.executionAllowed,

      analysisOnly:
        actionPolicy.analysisOnly,

      minimalResponsePreferred:
        currentTurn.isShortTurn &&
        !requestedOutput
          .formatHints
          ?.detailed,

      formatHints:
        requestedOutput.formatHints ||
        {},

      confidence:
        primaryCandidate.confidence
    };
  },

  /* =====================================================
     QUALITY
  ===================================================== */

  buildQualityReport({
    currentTurn = {},
    semanticStructure = {},
    rankedOperations = [],
    primaryCandidate = {},
    ambiguity = {},
    actionPolicy = {}
  } = {}) {
    const warnings = [];

    if (
      semanticStructure.ran ===
      false
    ) {
      warnings.push({
        type:
          "semantic_structure_missing",

        message:
          "The Request Interpreter did not receive a canonical semantic structure."
      });
    }

    if (
      rankedOperations.length ===
      0
    ) {
      warnings.push({
        type:
          "operation_evidence_missing",

        message:
          "No operation evidence was detected."
      });
    }

    if (
      primaryCandidate.confidence <
      0.5
    ) {
      warnings.push({
        type:
          "low_operation_confidence",

        confidence:
          primaryCandidate.confidence,

        message:
          "The requested operation has low confidence."
      });
    }

    if (
      ambiguity.present
    ) {
      warnings.push({
        type:
          "request_ambiguity",

        reasons:
          ambiguity.reasons,

        message:
          "The requested operation contains unresolved ambiguity."
      });
    }

    if (
      actionPolicy.executionProhibited &&
      actionPolicy.proposedOperation !==
      actionPolicy.resolvedOperation
    ) {
      warnings.push({
        type:
          "operation_authorization_adjusted",

        proposedOperation:
          actionPolicy.proposedOperation,

        resolvedOperation:
          actionPolicy.resolvedOperation,

        message:
          "The proposed operation was adjusted to respect explicit user authorization."
      });
    }

    const score =
      this.normalizeConfidence(
        primaryCandidate.confidence *
          0.55 +
        (
          semanticStructure.ran !==
          false
            ? 0.15
            : 0
        ) +
        (
          currentTurn.rawText
            ? 0.1
            : 0
        ) +
        (
          ambiguity.present
            ? 0
            : 0.1
        ) +
        (
          rankedOperations.length >
          1
            ? 0.05
            : 0
        ) +
        (
          actionPolicy
            .resolvedOperation
            ? 0.05
            : 0
        )
      );

    return {
      healthy:
        !warnings.some(warning =>
          [
            "semantic_structure_missing",
            "operation_evidence_missing"
          ].includes(
            warning.type
          )
        ),

      score,

      confidence:
        score,

      candidateCount:
        rankedOperations.length,

      primaryOperation:
        primaryCandidate.operation,

      ambiguityPresent:
        ambiguity.present,

      clarificationRequired:
        ambiguity
          .requiresClarification,

      warnings
    };
  },

  /* =====================================================
     CANONICAL INTERPRETATION
  ===================================================== */

  buildCanonicalInterpretation({
    currentTurn = {},
    semanticStructure = {},
    primaryCandidate = {},
    secondaryCandidates = [],
    requestedOutput = {},
    actionPolicy = {},
    ambiguity = {},
    requestCharacteristics = {},
    operationEvidence = [],
    outputEvidence = [],
    policyEvidence = {},
    rankedOperations = [],
    quality = {}
  } = {}) {
    const resolvedOperation =
      actionPolicy.resolvedOperation ||
      primaryCandidate.operation ||
      "respond";

    return {
      schema:
        "ari_request_interpretation",

      version:
        this.schemaVersion,

      engineVersion:
        this.version,

      source:
        "ari-request-interpreter",

      ran:
        true,

      turnId:
        currentTurn.turnId,

      currentTurn: {
        rawText:
          currentTurn.rawText,

        normalizedText:
          currentTurn.normalizedText,

        wordCount:
          currentTurn.wordCount,

        speechAct:
          requestCharacteristics
            .speechAct,

        preservedExactly:
          currentTurn
            .preservedExactly
      },

      requestedOperation:
        resolvedOperation,

      proposedOperation:
        primaryCandidate.operation,

      primaryOperation: {
        operation:
          resolvedOperation,

        proposedOperation:
          primaryCandidate.operation,

        requestFamily:
          this.requestFamilyFromOperation(
            resolvedOperation
          ),

        confidence:
          primaryCandidate.confidence,

        score:
          primaryCandidate.score,

        evidenceRefs:
          primaryCandidate.evidence.map(
            evidence =>
              evidence.id
          )
      },

      secondaryOperations:
        secondaryCandidates.map(
          candidate => ({
            operation:
              candidate.operation,

            requestFamily:
              candidate.requestFamily,

            confidence:
              candidate.confidence,

            score:
              candidate.score,

            evidenceRefs:
              candidate.evidence.map(
                evidence =>
                  evidence.id
              )
          })
        ),

      requestedOutput,

      actionPolicy,

      ambiguity,

      characteristics:
        requestCharacteristics,

      operationCandidates:
        rankedOperations.map(
          candidate => ({
            operation:
              candidate.operation,

            score:
              candidate.score,

            confidence:
              candidate.confidence,

            requestFamily:
              candidate.requestFamily,

            expectedOutput:
              candidate.expectedOutput,

            sourceCount:
              candidate.sourceCount,

            evidenceRefs:
              candidate.evidence.map(
                evidence =>
                  evidence.id
              )
          })
        ),

      evidence: {
        operations:
          operationEvidence,

        outputs:
          outputEvidence,

        policy:
          policyEvidence
      },

      semanticInput: {
        schema:
          semanticStructure.schema ||
          null,

        version:
          semanticStructure.version ||
          null,

        source:
          semanticStructure.source ||
          null,

        referenceCount:
          this.asArray(
            semanticStructure.references
          ).length,

        unresolvedCount:
          this.asArray(
            semanticStructure.unresolved
          ).length
      },

      quality,

      readyForSemanticHypotheses:
        Boolean(
          resolvedOperation
        ) &&
        !ambiguity
          .requiresClarification,

      conditionallyReady:
        Boolean(
          resolvedOperation
        ) &&
        ambiguity
          .requiresClarification,

      confidence:
        quality.confidence,

      evidenceRefs: [
        ...new Set([
          ...this.asArray(
            semanticStructure.evidenceRefs
          ),

          ...operationEvidence.map(
            evidence =>
              evidence.id
          ),

          ...outputEvidence.map(
            evidence =>
              evidence.id
          )
        ])
      ],

      authority: {
        canInterpretRequestedOperation:
          true,

        canIdentifyRequestedOutput:
          true,

        canIdentifyExplicitActionRestrictions:
          true,

        canPreserveMultipleOperations:
          true,

        canReportAmbiguity:
          true,

        canResolveReferences:
          false,

        canChooseCanonicalMeaning:
          false,

        canChooseSemanticFrame:
          false,

        canChooseConversationMode:
          false,

        canChooseRoute:
          false,

        canChoosePlanner:
          false,

        canPerformDomainReasoning:
          false,

        canAnswerUser:
          false,

        role:
          "canonical_request_interpretation_only"
      }
    };
  },

  /* =====================================================
     RETURN PAYLOAD
  ===================================================== */

  buildReturnPayload({
    interpretation = {},
    primaryCandidate = {},
    secondaryCandidates = [],
    requestedOutput = {},
    actionPolicy = {},
    ambiguity = {},
    requestCharacteristics = {},
    quality = {}
  } = {}) {
    return {
      requestInterpreterRan:
        true,

      requestInterpreterVersion:
        this.version,

      requestInterpreterSource:
        "ari-request-interpreter",

      requestInterpretation:
        interpretation,

      currentRequestInterpretation:
        interpretation,

      requestedOperation:
        interpretation
          .requestedOperation,

      proposedOperation:
        interpretation
          .proposedOperation,

      primaryRequestedOperation:
        interpretation
          .requestedOperation,

      secondaryRequestedOperations:
        secondaryCandidates.map(
          candidate =>
            candidate.operation
        ),

      requestedOutput:
        requestedOutput.type,

      requestedOutputContract:
        requestedOutput,

      requestFamily:
        interpretation
          .primaryOperation
          ?.requestFamily ||
        null,

      actionPolicy,

      executionAllowed:
        actionPolicy
          .executionAllowed,

      analysisOnly:
        actionPolicy.analysisOnly,

      prohibitedOperations:
        actionPolicy
          .prohibitedOperations,

      deferredOperations:
        actionPolicy
          .deferredOperations,

      requestAmbiguity:
        ambiguity,

      requestCharacteristics,

      requestInterpretationQuality:
        quality,

      readyForSemanticHypotheses:
        interpretation
          .readyForSemanticHypotheses,

      requiresRequestClarification:
        ambiguity
          .requiresClarification,

      confidence:
        interpretation.confidence,

      warnings:
        quality.warnings ||
        [],

      // Temporary compatibility aliases.
      primaryIntent:
        interpretation
          .requestedOperation,

      conversationIntent:
        interpretation
          .requestedOperation,

      explicitRequestedOperation:
        interpretation
          .requestedOperation,

      explicitRequestedOutput:
        requestedOutput.type,

      interactionFamily:
        interpretation
          .primaryOperation
          ?.requestFamily ||
        "general",

      intentFamily:
        this.intentFamilyFromOperation(
          interpretation
            .requestedOperation
        ),

      authority:
        "canonical_request_interpretation_only"
    };
  },

  /* =====================================================
     OPERATION MAPPING
  ===================================================== */

  operationFromVerb(
    verb = ""
  ) {
    const normalized =
      this.normalize(verb);

    const mappings = [
      [
        "provide_information",
        [
          "tell",
          "answer",
          "identify",
          "describe",
          "state"
        ]
      ],

      [
        "explain",
        [
          "explain",
          "clarify",
          "teach"
        ]
      ],

      [
        "compare",
        [
          "compare",
          "contrast"
        ]
      ],

      [
        "evaluate",
        [
          "evaluate",
          "assess",
          "judge"
        ]
      ],

      [
        "recommend",
        [
          "recommend",
          "suggest",
          "advise"
        ]
      ],

      [
        "prioritize",
        [
          "prioritize",
          "rank"
        ]
      ],

      [
        "plan",
        [
          "plan",
          "organize"
        ]
      ],

      [
        "generate_text",
        [
          "write",
          "rewrite",
          "draft",
          "compose"
        ]
      ],

      [
        "create_artifact",
        [
          "create",
          "generate",
          "design"
        ]
      ],

      [
        "modify_artifact",
        [
          "modify",
          "change",
          "update",
          "edit",
          "replace",
          "remove",
          "add"
        ]
      ],

      [
        "implement",
        [
          "implement",
          "wire",
          "integrate",
          "connect"
        ]
      ],

      [
        "inspect",
        [
          "inspect",
          "review",
          "look"
        ]
      ],

      [
        "debug",
        [
          "debug",
          "repair",
          "fix"
        ]
      ],

      [
        "verify",
        [
          "verify",
          "validate",
          "confirm",
          "check"
        ]
      ],

      [
        "calculate",
        [
          "calculate",
          "compute"
        ]
      ],

      [
        "convert",
        [
          "convert"
        ]
      ],

      [
        "translate",
        [
          "translate"
        ]
      ],

      [
        "summarize",
        [
          "summarize",
          "recap"
        ]
      ],

      [
        "store_memory",
        [
          "remember",
          "store",
          "save"
        ]
      ],

      [
        "forget_memory",
        [
          "forget"
        ]
      ]
    ];

    for (
      const [
        operation,
        verbs
      ] of mappings
    ) {
      if (
        verbs.some(candidate =>
          normalized ===
            candidate ||
          normalized.startsWith(
            `${candidate} `
          )
        )
      ) {
        return operation;
      }
    }

    return null;
  },

  operationFromSemanticLabel(
    label = ""
  ) {
    const normalized =
      this.normalize(label);

    const map = {
      information_request:
        "provide_information",

      explanation_request:
        "explain",

      comparison_request:
        "compare",

      evaluation_request:
        "evaluate",

      recommendation_request:
        "recommend",

      prioritization_request:
        "prioritize",

      planning_request:
        "plan",

      writing_request:
        "generate_text",

      creation_request:
        "create_artifact",

      modification_request:
        "modify_artifact",

      implementation_request:
        "implement",

      inspection_request:
        "inspect",

      debugging_request:
        "debug",

      verification_request:
        "verify",

      calculation_request:
        "calculate",

      conversion_request:
        "convert",

      translation_request:
        "translate",

      summary_request:
        "summarize",

      memory_store_request:
        "store_memory",

      memory_forget_request:
        "forget_memory",

      emotional_support_request:
        "provide_emotional_support",

      opinion_request:
        "provide_opinion",

      identity_question:
        "answer_identity_question",

      continuation:
        "continue_context"
    };

    const direct =
      map[
        normalized.replace(
          /\s+/g,
          "_"
        )
      ];

    if (direct) {
      return direct;
    }

    return this.operationFromVerb(
      normalized
    );
  },

  requestFamilyFromOperation(
    operation = ""
  ) {
    const normalized =
      this.normalizeOperation(
        operation
      );

    const map = {
      provide_information:
        "information",

      explain:
        "information",

      compare:
        "comparison",

      evaluate:
        "evaluation",

      recommend:
        "decision",

      prioritize:
        "decision",

      plan:
        "planning",

      generate_text:
        "writing",

      create_artifact:
        "creation",

      modify_artifact:
        "developer_task",

      implement:
        "developer_task",

      inspect:
        "verification",

      debug:
        "developer_task",

      verify:
        "verification",

      calculate:
        "calculation",

      convert:
        "calculation",

      translate:
        "translation",

      summarize:
        "summarization",

      classify:
        "classification",

      retrieve_memory:
        "memory",

      store_memory:
        "memory",

      forget_memory:
        "memory",

      provide_emotional_support:
        "emotional_support",

      provide_opinion:
        "opinion",

      answer_identity_question:
        "identity",

      continue_context:
        "continuity",

      clarify:
        "clarification",

      correct_prior_understanding:
        "correction",

      respond:
        "general",

      answer_question:
        "information",

      execute_request:
        "execution"
    };

    return map[normalized] ||
      "general";
  },

  intentFamilyFromOperation(
    operation = ""
  ) {
    const map = {
      provide_information:
        "fact_retrieval",

      explain:
        "explanation",

      compare:
        "comparison",

      evaluate:
        "assessment",

      recommend:
        "recommendation",

      prioritize:
        "prioritization",

      plan:
        "planning",

      generate_text:
        "text_generation",

      create_artifact:
        "artifact_creation",

      modify_artifact:
        "artifact_modification",

      implement:
        "implementation",

      inspect:
        "inspection",

      debug:
        "debugging",

      verify:
        "verification",

      calculate:
        "calculation",

      convert:
        "conversion",

      translate:
        "translation",

      summarize:
        "summarization",

      classify:
        "classification",

      retrieve_memory:
        "memory_retrieval",

      store_memory:
        "memory_storage",

      forget_memory:
        "memory_deletion",

      provide_emotional_support:
        "emotional_support",

      provide_opinion:
        "judgment",

      answer_identity_question:
        "identity",

      continue_context:
        "continuation",

      clarify:
        "clarification",

      correct_prior_understanding:
        "correction",

      respond:
        "general_response"
    };

    return (
      map[
        this.normalizeOperation(
          operation
        )
      ] ||
      "general_response"
    );
  },

  defaultOutputForOperation(
    operation = ""
  ) {
    const map = {
      provide_information:
        "direct_answer",

      explain:
        "explanation",

      compare:
        "comparison",

      evaluate:
        "evaluation",

      recommend:
        "recommendation",

      prioritize:
        "priority_order",

      plan:
        "plan",

      generate_text:
        "written_text",

      create_artifact:
        "created_artifact",

      modify_artifact:
        "modified_artifact",

      implement:
        "code",

      inspect:
        "inspection_result",

      debug:
        "diagnosis_and_fix",

      verify:
        "verification_result",

      calculate:
        "calculated_result",

      convert:
        "converted_result",

      translate:
        "translated_text",

      summarize:
        "summary",

      classify:
        "classification_result",

      retrieve_memory:
        "recalled_context",

      store_memory:
        "memory_action",

      forget_memory:
        "memory_action",

      provide_emotional_support:
        "supportive_response",

      provide_opinion:
        "opinion",

      answer_identity_question:
        "identity_answer",

      continue_context:
        "continuation_response",

      clarify:
        "clarification",

      correct_prior_understanding:
        "corrected_understanding",

      execute_request:
        "execution_result",

      answer_question:
        "direct_answer",

      respond:
        "response"
    };

    return (
      map[
        this.normalizeOperation(
          operation
        )
      ] ||
      "response"
    );
  },

  normalizeOperation(
    value = ""
  ) {
    const normalized =
      this.normalize(value)
        .replace(/\s+/g, "_");

    const aliases = {
      information:
        "provide_information",

      provide_info:
        "provide_information",

      answer:
        "provide_information",

      explanation:
        "explain",

      comparison:
        "compare",

      assessment:
        "evaluate",

      recommendation:
        "recommend",

      prioritization:
        "prioritize",

      planning:
        "plan",

      writing:
        "generate_text",

      write:
        "generate_text",

      creation:
        "create_artifact",

      modify:
        "modify_artifact",

      modification:
        "modify_artifact",

      implementation:
        "implement",

      review:
        "inspect",

      inspection:
        "inspect",

      debugging:
        "debug",

      verification:
        "verify",

      calculation:
        "calculate",

      conversion:
        "convert",

      translation:
        "translate",

      summarization:
        "summarize",

      memory_retrieval:
        "retrieve_memory",

      memory_storage:
        "store_memory",

      emotional_support:
        "provide_emotional_support",

      opinion:
        "provide_opinion",

      identity:
        "answer_identity_question",

      continuation:
        "continue_context",

      correction:
        "correct_prior_understanding"
    };

    return aliases[normalized] ||
      normalized;
  },

  normalizeOutputType(
    value = ""
  ) {
    const normalized =
      this.normalize(value)
        .replace(/\s+/g, "_");

    const aliases = {
      answer:
        "direct_answer",

      information:
        "direct_answer",

      explanation_response:
        "explanation",

      recommendation_or_priority:
        "recommendation",

      plan_or_roadmap:
        "plan",

      implementation_or_code:
        "code",

      artifact:
        "created_artifact",

      text:
        "written_text",

      calculation:
        "calculated_result",

      translation:
        "translated_text",

      supportive:
        "supportive_response"
    };

    return aliases[normalized] ||
      normalized;
  },

  /* =====================================================
     DEDUPLICATION
  ===================================================== */

  dedupeEvidence(
    evidence = []
  ) {
    const seen =
      new Set();

    return this.asArray(
      evidence
    ).filter(item => {
      const key =
        [
          item.operation,
          item.source,
          item.evidenceText,
          item.semanticRef
        ].join("|");

      if (
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    });
  },

  dedupeOutputEvidence(
    evidence = []
  ) {
    const seen =
      new Set();

    return this.asArray(
      evidence
    ).filter(item => {
      const key =
        [
          item.outputType,
          item.source,
          item.evidenceText
        ].join("|");

      if (
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    });
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

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

  cleanOriginal(value = "") {
    return String(
      value ??
      ""
    )
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  },

  normalize(value = "") {
    return this.cleanOriginal(
      value
    )
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

window.Ari.requestInterpreter =
  window.AriRequestInterpreter;

console.log(
  "ARI REQUEST INTERPRETER LOADED:",
  window.AriRequestInterpreter?.version
);