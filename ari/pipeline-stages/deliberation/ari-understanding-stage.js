// ari/pipeline-stages/deliberation/ari-understanding-stage.js
// Ari Understanding Deliberation Stage
// Purpose: Coordinate language, semantic, event, meaning, and human-state understanding.
// V1.0.0 — Understanding Chain Orchestration Foundation

window.Ari = window.Ari || {};

window.AriUnderstandingStage = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      runEngine = async (
        _engine,
        _methods,
        fallback = {}
      ) => fallback
    } = runtime;

    let state = {
      ...summary,
      activeDeliberationStage: "understanding"
    };

    const understandingEligibility =
      this.resolveUnderstandingEligibility(state);

    state = {
      ...state,

      understandingEligibility,

      shouldRunLanguageUnderstanding:
        understandingEligibility.language,

      shouldRunSemanticUnderstanding:
        understandingEligibility.semantic,

      shouldRunEventUnderstanding:
        understandingEligibility.event,

      shouldRunMeaningInterpreter:
        understandingEligibility.meaning,

      shouldRunHumanStateBuilder:
        understandingEligibility.humanState
    };

    // =================================================
    // 1. Language Understanding
    // =================================================

    mark("before languageUnderstanding");

    const languageUnderstandingResult =
      understandingEligibility.language
        ? await runEngine(
            window.AriLanguageUnderstandingEngine ||
            window.Ari?.languageUnderstandingEngine,

            ["understand", "analyze"],

            {
              languageUnderstandingRan: false,
              usable: false,
              source: "not-loaded",

              reason:
                "language_understanding_engine_not_loaded"
            },

            {
              ...state,

              understandingStageInput:
                this.buildUnderstandingStageInput(state)
            }
          )
        : {
            languageUnderstandingRan: false,
            usable: false,

            source:
              "skipped-by-understanding-eligibility",

            reason:
              "language_understanding_not_required"
          };

    state = {
      ...state,

      ...languageUnderstandingResult,

      languageUnderstanding:
        languageUnderstandingResult,

      languageUnderstandingRan:
        languageUnderstandingResult
          .languageUnderstandingRan === true,

      languageUnderstandingUsable:
        languageUnderstandingResult
          .usable === true,

      languageUnderstandingSource:
        languageUnderstandingResult.source ||
        "unknown"
    };

    mark("after languageUnderstanding");

    // =================================================
    // 2. Semantic Understanding
    // =================================================

    mark("before semanticUnderstanding");

    const semanticUnderstandingResult =
      understandingEligibility.semantic
        ? await runEngine(
            window.AriSemanticUnderstandingEngine ||
            window.Ari?.semanticUnderstandingEngine,

            ["understand", "analyze"],

            {
              semanticUnderstandingRan: false,
              usable: false,
              source: "not-loaded",

              reason:
                "semantic_understanding_engine_not_loaded"
            },

            {
              ...state,

              understandingStageInput:
                this.buildUnderstandingStageInput(state),

              languageUnderstanding:
                state.languageUnderstanding ||
                null
            }
          )
        : {
            semanticUnderstandingRan: false,
            usable: false,

            source:
              "skipped-by-understanding-eligibility",

            reason:
              "semantic_understanding_not_required"
          };

    state = {
      ...state,

      ...semanticUnderstandingResult,

      semanticUnderstanding:
        semanticUnderstandingResult,

      semanticUnderstandingRan:
        semanticUnderstandingResult
          .semanticUnderstandingRan === true,

      semanticUnderstandingUsable:
        semanticUnderstandingResult
          .usable === true,

      semanticUnderstandingSource:
        semanticUnderstandingResult.source ||
        "unknown"
    };

    mark("after semanticUnderstanding");

    // =================================================
    // 3. Event Understanding
    // =================================================

    mark("before eventUnderstanding");

    const eventUnderstandingResult =
      understandingEligibility.event
        ? await runEngine(
            window.AriEventUnderstandingEngine ||
            window.Ari?.eventUnderstandingEngine,

            ["understand", "analyze"],

            {
              eventUnderstandingRan: false,
              usable: false,
              source: "not-loaded",

              reason:
                "event_understanding_engine_not_loaded"
            },

            {
              ...state,

              understandingStageInput:
                this.buildUnderstandingStageInput(state),

              languageUnderstanding:
                state.languageUnderstanding ||
                null,

              semanticUnderstanding:
                state.semanticUnderstanding ||
                null
            }
          )
        : {
            eventUnderstandingRan: false,
            usable: false,

            source:
              "skipped-by-understanding-eligibility",

            reason:
              "event_understanding_not_required"
          };

    state = {
      ...state,

      ...eventUnderstandingResult,

      eventUnderstanding:
        eventUnderstandingResult,

      eventUnderstandingRan:
        eventUnderstandingResult
          .eventUnderstandingRan === true,

      eventUnderstandingUsable:
        eventUnderstandingResult
          .usable === true,

      eventUnderstandingSource:
        eventUnderstandingResult.source ||
        "unknown"
    };

    mark("after eventUnderstanding");

    // =================================================
    // 4. Meaning Interpreter
    // =================================================

    mark("before meaningInterpreter");

    const meaningInterpretationResult =
      understandingEligibility.meaning
        ? await runEngine(
            window.AriMeaningInterpreter ||
            window.Ari?.meaningInterpreter,

            ["interpret", "analyze"],

            {
              meaningInterpreterRan: false,
              usable: false,
              source: "not-loaded",

              reason:
                "meaning_interpreter_not_loaded"
            },

            {
              ...state,

              understandingStageInput:
                this.buildUnderstandingStageInput(state),

              languageUnderstanding:
                state.languageUnderstanding ||
                null,

              semanticUnderstanding:
                state.semanticUnderstanding ||
                null,

              eventUnderstanding:
                state.eventUnderstanding ||
                null
            }
          )
        : {
            meaningInterpreterRan: false,
            usable: false,

            source:
              "skipped-by-understanding-eligibility",

            reason:
              "meaning_interpretation_not_required"
          };

    state = {
      ...state,

      ...meaningInterpretationResult,

      meaningInterpretation:
        meaningInterpretationResult,

      meaningInterpreterRan:
        meaningInterpretationResult
          .meaningInterpreterRan === true,

      meaningInterpretationUsable:
        meaningInterpretationResult
          .usable === true,

      meaningInterpreterSource:
        meaningInterpretationResult.source ||
        "unknown"
    };

    mark("after meaningInterpreter");

    // =================================================
    // 5. Human State Builder
    // =================================================

    mark("before humanStateBuilder");

    const humanStateResult =
      understandingEligibility.humanState
        ? await runEngine(
            window.AriHumanStateBuilder ||
            window.Ari?.humanStateBuilder,

            ["build", "create"],

            {
              humanStateBuilderRan: false,
              usable: false,
              source: "not-loaded",

              reason:
                "human_state_builder_not_loaded"
            },

            {
              ...state,

              understandingStageInput:
                this.buildUnderstandingStageInput(state),

              meaningInterpretation:
                state.meaningInterpretation ||
                null,

              memoryHandoff:
                state.memoryHandoff ||
                null,

              safetyDisposition:
                state.safetyDisposition ||
                null
            }
          )
        : {
            humanStateBuilderRan: false,
            usable: false,

            source:
              "skipped-by-understanding-eligibility",

            reason:
              "human_state_not_required"
          };

    state = {
      ...state,

      ...humanStateResult,

      humanState:
        humanStateResult,

      humanStateBuilderRan:
        humanStateResult
          .humanStateBuilderRan === true,

      humanStateUsable:
        humanStateResult.usable === true,

      humanStateBuilderSource:
        humanStateResult.source ||
        "unknown"
    };

    mark("after humanStateBuilder");

    // =================================================
    // 6. Normalize understanding handoff
    // =================================================

    const understandingHandoff =
      this.buildUnderstandingHandoff(state);

    state = {
      ...state,

      understandingHandoff,

      responseRequired:
        this.mergeUnique(
          state.responseRequired,
          understandingHandoff.requiredBehaviors
        ),

      responseAvoid:
        this.mergeUnique(
          state.responseAvoid,
          understandingHandoff.forbiddenBehaviors
        ),

      responseConstraints:
        this.mergeUnique(
          state.responseConstraints,
          understandingHandoff.constraints
        )
    };

    // =================================================
    // 7. Understanding Stage Packet
    // =================================================

    state.understandingStagePacket =
      this.buildUnderstandingStagePacket(state);

    state.understandingStageRan =
      true;

    state.understandingStageSource =
      "ari-understanding-stage";

    state.understandingStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveUnderstandingEligibility(summary = {}) {
    const developerLocked =
      summary.developerResponseLocked === true;

    const safetyOverride =
      summary.safetyDisposition
        ?.shouldStopNormalResponse === true;

    const fastPath =
      summary.executivePacket
        ?.runInstructions?.fastPath === true ||
      summary.routingApplicability
        ?.fastPathEligible === true;

    const mode =
      summary.routingContract?.mode ||
      summary.conversationMode ||
      "unknown";

    const routeNeedsHumanState =
      [
        "emotional_support",
        "medical",
        "social_relationship",
        "coaching",
        "safety_crisis"
      ].includes(mode);

    const hasSemanticAmbiguity =
      summary.perceptionPacket
        ?.semantic?.ambiguity
        ?.ambiguous === true ||
      Boolean(
        summary.perceptionPacket
          ?.semantic?.ambiguity
          ?.unresolvedReferences?.length
      );

    return {
      language:
        !developerLocked,

      semantic:
        !developerLocked,

      event:
        !developerLocked &&
        (
          !fastPath ||
          hasSemanticAmbiguity
        ),

      meaning:
        !developerLocked,

      humanState:
        !developerLocked &&
        (
          routeNeedsHumanState ||
          safetyOverride ||
          !fastPath
        ),

      developerLocked,
      safetyOverride,
      fastPath,
      routeNeedsHumanState,
      hasSemanticAmbiguity,

      source:
        "ari-understanding-stage-eligibility"
    };
  },

  // ===================================================
  // Stage input
  // ===================================================

  buildUnderstandingStageInput(summary = {}) {
    return {
      request: {
        original:
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",

        resolved:
          summary.resolvedUserQuestion ||
          summary.userMessage ||
          summary.message ||
          summary.input ||
          ""
      },

      perception:
        summary.perceptionPacket ||
        null,

      routing:
        summary.routingContract ||
        null,

      executive:
        summary.executivePacket ||
        null,

      continuity:
        summary.continuityStagePacket ||
        null,

      safety:
        summary.safetyStagePacket ||
        null,

      situation:
        summary.situationStagePacket ||
        null,

      reasoning:
        summary.reasoningStagePacket ||
        null,

      memory:
        summary.memoryStagePacket ||
        null,

      semanticFrame:
        summary.primarySemanticFrame ||
        summary.perceptionPacket
          ?.semantic?.primaryFrame ||
        null,

      semanticSummary:
        summary.semanticSummary ||
        summary.perceptionPacket
          ?.semantic?.summary ||
        null,

      responseControl: {
        primaryLane:
          summary.primaryLane ||
          null,

        responseShape:
          summary.responseShape ||
          null,

        rules:
          summary.responseRules ||
          [],

        constraints:
          summary.responseConstraints ||
          []
      }
    };
  },

  // ===================================================
  // Understanding handoff
  // ===================================================

  buildUnderstandingHandoff(summary = {}) {
    const meaning =
      summary.meaningInterpretation ||
      {};

    const humanState =
      summary.humanState ||
      {};

    return {
      usable:
        summary.languageUnderstandingUsable === true ||
        summary.semanticUnderstandingUsable === true ||
        summary.eventUnderstandingUsable === true ||
        summary.meaningInterpretationUsable === true ||
        summary.humanStateUsable === true,

      language:
        summary.languageUnderstanding ||
        null,

      semantic:
        summary.semanticUnderstanding ||
        null,

      event:
        summary.eventUnderstanding ||
        null,

      meaning:
        summary.meaningInterpretation ||
        null,

      humanState:
        summary.humanState ||
        null,

      resolvedMeaning:
        meaning.resolvedMeaning ||
        meaning.meaning ||
        meaning.summary ||
        null,

      userGoal:
        meaning.userGoal ||
        meaning.goal ||
        null,

      userState:
        humanState.state ||
        humanState.primaryState ||
        null,

      emotionalTone:
        humanState.emotionalTone ||
        humanState.tone ||
        null,

      communicationNeeds:
        this.toArray(
          humanState.communicationNeeds ||
          meaning.communicationNeeds
        ),

      requiredBehaviors:
        this.mergeUnique(
          meaning.requiredBehaviors,
          humanState.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          meaning.forbiddenBehaviors,
          humanState.forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          meaning.constraints,
          humanState.constraints
        ),

      confidence:
        meaning.confidence ||
        humanState.confidence ||
        null,

      source:
        summary.meaningInterpreterRan === true
          ? "meaning_interpreter"
          : summary.semanticUnderstandingRan === true
            ? "semantic_understanding"
            : summary.languageUnderstandingRan === true
              ? "language_understanding"
              : "none"
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildUnderstandingStagePacket(summary = {}) {
    return {
      ready:
        true,

      source:
        "ari-understanding-stage",

      version:
        this.version,

      eligibility:
        summary.understandingEligibility ||
        null,

      language: {
        ran:
          summary.languageUnderstandingRan === true,

        usable:
          summary.languageUnderstandingUsable === true,

        source:
          summary.languageUnderstandingSource ||
          null,

        value:
          summary.languageUnderstanding ||
          null
      },

      semantic: {
        ran:
          summary.semanticUnderstandingRan === true,

        usable:
          summary.semanticUnderstandingUsable === true,

        source:
          summary.semanticUnderstandingSource ||
          null,

        value:
          summary.semanticUnderstanding ||
          null
      },

      event: {
        ran:
          summary.eventUnderstandingRan === true,

        usable:
          summary.eventUnderstandingUsable === true,

        source:
          summary.eventUnderstandingSource ||
          null,

        value:
          summary.eventUnderstanding ||
          null
      },

      meaning: {
        ran:
          summary.meaningInterpreterRan === true,

        usable:
          summary.meaningInterpretationUsable === true,

        source:
          summary.meaningInterpreterSource ||
          null,

        value:
          summary.meaningInterpretation ||
          null
      },

      humanState: {
        ran:
          summary.humanStateBuilderRan === true,

        usable:
          summary.humanStateUsable === true,

        source:
          summary.humanStateBuilderSource ||
          null,

        value:
          summary.humanState ||
          null
      },

      handoff:
        summary.understandingHandoff ||
        null,

      responseControl: {
        requiredBehaviors:
          summary.understandingHandoff
            ?.requiredBehaviors ||
          [],

        forbiddenBehaviors:
          summary.understandingHandoff
            ?.forbiddenBehaviors ||
          [],

        constraints:
          summary.understandingHandoff
            ?.constraints ||
          [],

        communicationNeeds:
          summary.understandingHandoff
            ?.communicationNeeds ||
          []
      },

      authority: {
        canInterpretLanguage:
          true,

        canInterpretSemantics:
          true,

        canInterpretEvents:
          true,

        canInterpretMeaning:
          true,

        canModelHumanState:
          true,

        canAddCommunicationConstraints:
          true,

        canChooseFinalRoute:
          false,

        canOverrideSafety:
          false,

        canWriteFinalLanguage:
          false,

        canPersistState:
          false,

        role:
          "language_semantic_event_meaning_and_human_state_understanding"
      }
    };
  },

  // ===================================================
  // Utilities
  // ===================================================

  toArray(value) {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  mergeUnique(...values) {
    return [
      ...new Set(
        values.flatMap(value =>
          this.toArray(value)
        )
      )
    ];
  }
};

console.log(
  "ARI UNDERSTANDING STAGE LOADED:",
  window.AriUnderstandingStage?.version
);