// ari/pipeline-stages/expression/ari-language-guidance-stage.js
// Ari Language Guidance Stage
// Purpose: Prepare lexical, tone, and communication guidance before draft generation.
// V1.0.0 — Lexical Grounding / Human Language / Mouth Director Orchestration

window.Ari = window.Ari || {};

window.AriLanguageGuidanceStage = {
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
      activeExpressionStage: "language_guidance"
    };

    const guidanceEligibility =
      this.resolveGuidanceEligibility(state);

    state = {
      ...state,

      guidanceEligibility,

      shouldRunLexicalGrounding:
        guidanceEligibility.lexicalGrounding,

      shouldRunHumanLanguage:
        guidanceEligibility.humanLanguage,

      shouldRunMouthDirector:
        guidanceEligibility.mouthDirector
    };

    // =================================================
    // 1. Lexical Grounding
    // =================================================

    mark("before lexicalGrounding");

    const lexicalGroundingResult =
      guidanceEligibility.lexicalGrounding
        ? await runEngine(
            window.AriLexicalGroundingEngine,
            ["ground", "create"],

            {
              lexicalGroundingRan:
                false,

              lexicalGroundingSource:
                "not-loaded",

              lexicalGrounding:
                null,

              preferredTerms: {},

              conceptMap: {},

              requiredTerms: [],

              forbiddenTerms: [],

              authority: {
                canSetSituation:
                  false,

                canSetLane:
                  false,

                canSetContract:
                  false,

                canAnswerUser:
                  false,

                role:
                  "expression_grounding_only"
              },

              reason:
                "lexical_grounding_engine_not_loaded"
            },

            {
              ...state,

              languageGuidanceInput:
                this.buildLanguageGuidanceInput(state)
            }
          )
        : {
            lexicalGroundingRan:
              false,

            lexicalGroundingSource:
              "skipped-by-expression-eligibility",

            lexicalGrounding:
              null,

            preferredTerms: {},

            conceptMap: {},

            requiredTerms: [],

            forbiddenTerms: [],

            authority: {
              canSetSituation:
                false,

              canSetLane:
                false,

              canSetContract:
                false,

              canAnswerUser:
                false,

              role:
                "expression_grounding_only"
            },

            reason:
              "lexical_grounding_not_required"
          };

    state = {
      ...state,

      ...lexicalGroundingResult,

      lexicalGroundingResult,

      lexicalGrounding:
        lexicalGroundingResult.lexicalGrounding ||
        state.lexicalGrounding ||
        null,

      preferredTerms:
        lexicalGroundingResult.preferredTerms ||
        state.preferredTerms ||
        {},

      conceptMap:
        lexicalGroundingResult.conceptMap ||
        state.conceptMap ||
        {},

      lexicalGroundingRan:
        lexicalGroundingResult
          .lexicalGroundingRan === true,

      lexicalGroundingSource:
        lexicalGroundingResult
          .lexicalGroundingSource ||
        lexicalGroundingResult.source ||
        "unknown"
    };

    mark("after lexicalGrounding");

    // =================================================
    // 2. Human Language Profile
    // =================================================

    mark("before humanLanguage");

    const humanLanguageResult =
      guidanceEligibility.humanLanguage
        ? await runEngine(
            window.AriHumanLanguageEngine,
            ["create", "build"],

            {
              humanLanguageEngineRan:
                false,

              humanLanguageSource:
                "not-loaded",

              humanLanguageProfile: {},

              reason:
                "human_language_engine_not_loaded"
            },

            {
              ...state,

              languageGuidanceInput:
                this.buildLanguageGuidanceInput(state),

              lexicalGrounding:
                state.lexicalGrounding ||
                null
            }
          )
        : {
            humanLanguageEngineRan:
              false,

            humanLanguageSource:
              "skipped-by-expression-eligibility",

            humanLanguageProfile: {},

            reason:
              "human_language_not_required"
          };

    state = {
      ...state,

      ...humanLanguageResult,

      humanLanguage:
        humanLanguageResult,

      humanLanguageProfile:
        humanLanguageResult.humanLanguageProfile ||
        state.humanLanguageProfile ||
        {},

      humanLanguageEngineRan:
        humanLanguageResult
          .humanLanguageEngineRan === true,

      humanLanguageSource:
        humanLanguageResult
          .humanLanguageSource ||
        humanLanguageResult.source ||
        "unknown"
    };

    mark("after humanLanguage");

    // =================================================
    // 3. Mouth Director
    // =================================================

    mark("before mouthDirector");

    const mouthDirectorResult =
      guidanceEligibility.mouthDirector
        ? await runEngine(
            window.AriMouthDirector,
            ["direct", "plan"],

            {
              mouthDirectorRan:
                false,

              mouthDirectorSource:
                "not-loaded",

              expressionPlan:
                null,

              blueprintHint:
                null,

              communicationPlan:
                null,

              mouthDirective:
                null,

              responseRules:
                state.responseRules ||
                [],

              responseAvoid: [],

              responseRequired: [],

              reason:
                "mouth_director_not_loaded"
            },

            {
              ...state,

              languageGuidanceInput:
                this.buildLanguageGuidanceInput(state),

              lexicalGrounding:
                state.lexicalGrounding ||
                null,

              humanLanguageProfile:
                state.humanLanguageProfile ||
                {}
            }
          )
        : {
            mouthDirectorRan:
              false,

            mouthDirectorSource:
              "skipped-by-expression-eligibility",

            expressionPlan:
              null,

            blueprintHint:
              null,

            communicationPlan:
              state.communicationPlan ||
              null,

            mouthDirective:
              state.mouthDirective ||
              null,

            responseRules:
              state.responseRules ||
              [],

            responseAvoid: [],

            responseRequired: [],

            reason:
              "mouth_director_not_required"
          };

    state = {
      ...state,

      ...mouthDirectorResult,

      mouthDirector:
        mouthDirectorResult,

      expressionPlan:
        mouthDirectorResult.expressionPlan ||
        state.expressionPlan ||
        null,

      blueprintHint:
        mouthDirectorResult.blueprintHint ||
        state.blueprintHint ||
        null,

      communicationPlan:
        mouthDirectorResult.communicationPlan ||
        state.communicationPlan ||
        null,

      mouthDirective:
        mouthDirectorResult.mouthDirective ||
        state.mouthDirective ||
        null,

      responseRules:
        this.mergeUnique(
          state.responseRules,
          mouthDirectorResult.responseRules
        ),

      responseAvoid:
        this.mergeUnique(
          state.responseAvoid,
          mouthDirectorResult.responseAvoid
        ),

      responseRequired:
        this.mergeUnique(
          state.responseRequired,
          mouthDirectorResult.responseRequired
        ),

      mouthDirectorRan:
        mouthDirectorResult
          .mouthDirectorRan === true,

      mouthDirectorSource:
        mouthDirectorResult
          .mouthDirectorSource ||
        mouthDirectorResult.source ||
        "unknown"
    };

    mark("after mouthDirector");

    // =================================================
    // 4. Normalize language guidance handoff
    // =================================================

    const languageGuidanceHandoff =
      this.buildLanguageGuidanceHandoff(state);

    state = {
      ...state,

      languageGuidanceHandoff,

      responseRequired:
        this.mergeUnique(
          state.responseRequired,
          languageGuidanceHandoff.requiredBehaviors
        ),

      responseAvoid:
        this.mergeUnique(
          state.responseAvoid,
          languageGuidanceHandoff.forbiddenBehaviors
        ),

      responseConstraints:
        this.mergeUnique(
          state.responseConstraints,
          languageGuidanceHandoff.constraints
        )
    };

    // =================================================
    // 5. Language Guidance Stage Packet
    // =================================================

    state.languageGuidanceStagePacket =
      this.buildLanguageGuidanceStagePacket(state);

    state.languageGuidanceStageRan =
      true;

    state.languageGuidanceStageSource =
      "ari-language-guidance-stage";

    state.languageGuidanceStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveGuidanceEligibility(summary = {}) {
    const developerLocked =
      summary.developerResponseLocked === true;

    const hasFinalResponse =
      Boolean(
        String(
          summary.finalResponse ||
          ""
        ).trim()
      );

    const safetyOverride =
      summary.safetyDisposition
        ?.shouldStopNormalResponse === true;

    return {
      lexicalGrounding:
        !developerLocked,

      humanLanguage:
        !developerLocked,

      mouthDirector:
        !developerLocked &&
        !hasFinalResponse,

      developerLocked,
      hasFinalResponse,
      safetyOverride,

      source:
        "ari-language-guidance-stage-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : hasFinalResponse
            ? "final_response_already_available"
            : safetyOverride
              ? "safety_language_guidance_required"
              : "language_guidance_required"
    };
  },

  // ===================================================
  // Stage input
  // ===================================================

  buildLanguageGuidanceInput(summary = {}) {
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

      routing:
        summary.routingContract ||
        null,

      deliberation:
        summary.deliberationPacket ||
        null,

      responseStrategy:
        summary.responseStrategy ||
        null,

      character:
        summary.characterStagePacket ||
        summary.characterHandoff ||
        null,

      safety:
        summary.safetyStagePacket ||
        null,

      memory:
        summary.memoryStagePacket ||
        null,

      understanding:
        summary.understandingStagePacket ||
        null,

      lexicalContext: {
        existingGrounding:
          summary.lexicalGrounding ||
          null,

        preferredTerms:
          summary.preferredTerms ||
          {},

        conceptMap:
          summary.conceptMap ||
          {}
      },

      responseControl: {
        goal:
          summary.responseGoal ||
          null,

        shape:
          summary.responseShape ||
          null,

        order:
          summary.responseOrder ||
          [],

        rules:
          summary.responseRules ||
          [],

        constraints:
          summary.responseConstraints ||
          [],

        requiredBehaviors:
          summary.responseRequired ||
          [],

        forbiddenBehaviors:
          summary.responseAvoid ||
          [],

        communicationPlan:
          summary.communicationPlan ||
          null,

        composerDirective:
          summary.composerDirective ||
          null
      }
    };
  },

  // ===================================================
  // Language guidance handoff
  // ===================================================

  buildLanguageGuidanceHandoff(summary = {}) {
    const lexical =
      summary.lexicalGroundingResult ||
      {};

    const humanLanguage =
      summary.humanLanguage ||
      {};

    const mouth =
      summary.mouthDirector ||
      {};

    return {
      ready: true,

      lexicalGrounding:
        summary.lexicalGrounding ||
        null,

      preferredTerms:
        summary.preferredTerms ||
        {},

      conceptMap:
        summary.conceptMap ||
        {},

      humanLanguageProfile:
        summary.humanLanguageProfile ||
        {},

      expressionPlan:
        summary.expressionPlan ||
        null,

      blueprintHint:
        summary.blueprintHint ||
        null,

      communicationPlan:
        summary.communicationPlan ||
        null,

      mouthDirective:
        summary.mouthDirective ||
        null,

      requiredTerms:
        this.mergeUnique(
          lexical.requiredTerms,
          mouth.requiredTerms
        ),

      forbiddenTerms:
        this.mergeUnique(
          lexical.forbiddenTerms,
          mouth.forbiddenTerms
        ),

      requiredBehaviors:
        this.mergeUnique(
          lexical.requiredBehaviors,
          humanLanguage.requiredBehaviors,
          mouth.responseRequired
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          lexical.forbiddenBehaviors,
          humanLanguage.forbiddenBehaviors,
          mouth.responseAvoid
        ),

      constraints:
        this.mergeUnique(
          lexical.constraints,
          humanLanguage.constraints,
          mouth.constraints
        ),

      source:
        summary.mouthDirectorRan === true
          ? "mouth_director"
          : summary.humanLanguageEngineRan === true
            ? "human_language"
            : summary.lexicalGroundingRan === true
              ? "lexical_grounding"
              : "none"
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildLanguageGuidanceStagePacket(summary = {}) {
    return {
      ready: true,

      source:
        "ari-language-guidance-stage",

      version:
        this.version,

      eligibility:
        summary.guidanceEligibility ||
        null,

      lexicalGrounding: {
        ran:
          summary.lexicalGroundingRan === true,

        source:
          summary.lexicalGroundingSource ||
          null,

        value:
          summary.lexicalGrounding ||
          null,

        preferredTerms:
          summary.preferredTerms ||
          {},

        conceptMap:
          summary.conceptMap ||
          {}
      },

      humanLanguage: {
        ran:
          summary.humanLanguageEngineRan === true,

        source:
          summary.humanLanguageSource ||
          null,

        profile:
          summary.humanLanguageProfile ||
          {}
      },

      mouthDirector: {
        ran:
          summary.mouthDirectorRan === true,

        source:
          summary.mouthDirectorSource ||
          null,

        value:
          summary.mouthDirector ||
          null
      },

      handoff:
        summary.languageGuidanceHandoff ||
        null,

      responseControl: {
        expressionPlan:
          summary.expressionPlan ||
          null,

        blueprintHint:
          summary.blueprintHint ||
          null,

        communicationPlan:
          summary.communicationPlan ||
          null,

        mouthDirective:
          summary.mouthDirective ||
          null,

        rules:
          summary.responseRules ||
          [],

        constraints:
          summary.responseConstraints ||
          [],

        requiredBehaviors:
          summary.responseRequired ||
          [],

        forbiddenBehaviors:
          summary.responseAvoid ||
          []
      },

      authority: {
        canGroundTerminology:
          true,

        canDefineLanguageProfile:
          true,

        canGuideExpression:
          true,

        canAddExpressionConstraints:
          true,

        canChooseFinalRoute:
          false,

        canOverrideSafety:
          false,

        canGenerateFinalDraft:
          false,

        canSelectFinalDraft:
          false,

        canPersistState:
          false,

        role:
          "lexical_tone_and_communication_guidance"
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
  "ARI LANGUAGE GUIDANCE STAGE LOADED:",
  window.AriLanguageGuidanceStage?.version
);
