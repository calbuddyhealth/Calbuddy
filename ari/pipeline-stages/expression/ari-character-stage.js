// ari/pipeline-stages/expression/ari-character-stage.js
// Ari Character Expression Stage
// Purpose: Resolve whether Ari's character voice is relevant and prepare character guidance.
// V1.0.0 — Character Context / Reasoning / Expression Orchestration

window.Ari = window.Ari || {};

window.AriCharacterStage = {
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
      activeExpressionStage: "character"
    };

    const characterEligibility =
      this.resolveCharacterEligibility(state);

    state = {
      ...state,

      characterEligibility,

      shouldRunCharacterContext:
        characterEligibility.runContext,

      shouldRunCharacterReasoning:
        characterEligibility.runReasoning,

      shouldRunCharacterExpression:
        characterEligibility.runExpression
    };

    // =================================================
    // 1. Character Context
    // =================================================

    mark("before characterContext");

    const characterContextResult =
      characterEligibility.runContext
        ? await runEngine(
            window.AriCharacterContextEngine,
            ["create", "build"],

            {
              characterContextEngineRan: false,

              characterContextEngineSource:
                "not-loaded",

              characterUseAllowed:
                false,

              characterVisibility:
                "background",

              characterMode:
                "silent",

              characterReason:
                "Character context engine not loaded.",

              characterHints: {}
            },

            {
              ...state,

              characterStageInput:
                this.buildCharacterStageInput(state)
            }
          )
        : {
            characterContextEngineRan:
              false,

            characterContextEngineSource:
              "skipped-by-expression-eligibility",

            characterUseAllowed:
              false,

            characterVisibility:
              "background",

            characterMode:
              "silent",

            characterReason:
              "Character context not required.",

            characterHints: {}
          };

    state = {
      ...state,

      ...characterContextResult,

      characterContext:
        characterContextResult,

      characterContextEngineRan:
        characterContextResult
          .characterContextEngineRan === true,

      characterContextEngineSource:
        characterContextResult
          .characterContextEngineSource ||
        characterContextResult.source ||
        "unknown"
    };

    mark("after characterContext");

    // =================================================
    // 2. Supabase Character Knowledge Compatibility
    // =================================================

    mark("before supabaseCharacterKnowledge");

    const supabaseCharacterKnowledgeResult = {
      supabaseCharacterKnowledgeRan:
        false,

      characterKnowledgeAvailable:
        false,

      inferenceNeeded:
        false,

      nodes: [],

      source:
        "disabled",

      reason:
        "Supabase character knowledge is disabled. Supabase is reserved for memory retrieval and storage only."
    };

    state = {
      ...state,

      supabaseCharacterKnowledge:
        supabaseCharacterKnowledgeResult,

      characterKnowledge:
        supabaseCharacterKnowledgeResult,

      characterKnowledgeAvailable:
        false
    };

    mark("after supabaseCharacterKnowledge");

    // =================================================
    // 3. Character Reasoning
    // =================================================

    mark("before characterReasoning");

    const characterReasoningResult =
      characterEligibility.runReasoning
        ? await runEngine(
            window.AriCharacterReasoningEngine,
            ["reason", "create"],

            {
              characterReasoningRan:
                false,

              characterReasoningSource:
                "not-loaded",

              characterAnswerAvailable:
                false,

              userFacingDraft:
                null,

              reason:
                "Character reasoning engine not loaded."
            },

            {
              ...state,

              characterStageInput:
                this.buildCharacterStageInput(state),

              characterContext:
                state.characterContext ||
                null
            }
          )
        : {
            characterReasoningRan:
              false,

            characterReasoningSource:
              "skipped-by-expression-eligibility",

            characterAnswerAvailable:
              false,

            userFacingDraft:
              null,

            reason:
              "Character reasoning not required."
          };

    state = {
      ...state,

      ...characterReasoningResult,

      characterReasoning:
        characterReasoningResult,

      characterReasoningRan:
        characterReasoningResult
          .characterReasoningRan === true,

      characterReasoningSource:
        characterReasoningResult
          .characterReasoningSource ||
        characterReasoningResult.source ||
        "unknown"
    };

    mark("after characterReasoning");

    // =================================================
    // 4. Character Expression
    // =================================================

    mark("before characterExpression");

    const characterExpressionResult =
      characterEligibility.runExpression
        ? await runEngine(
            window.AriCharacterExpressionEngine,
            ["create", "build"],

            {
              characterExpressionRan:
                false,

              characterExpressionSource:
                "not-loaded",

              characterRelevant:
                false,

              composerCharacter:
                null,

              composerCharacterPacket:
                null,

              reason:
                "Character expression engine not loaded."
            },

            {
              ...state,

              characterStageInput:
                this.buildCharacterStageInput(state),

              characterContext:
                state.characterContext ||
                null,

              characterReasoning:
                state.characterReasoning ||
                null
            }
          )
        : {
            characterExpressionRan:
              false,

            characterExpressionSource:
              "skipped-by-expression-eligibility",

            characterRelevant:
              false,

            composerCharacter:
              null,

            composerCharacterPacket:
              null,

            reason:
              "Character expression not required."
          };

    state = {
      ...state,

      ...characterExpressionResult,

      characterExpression:
        characterExpressionResult,

      characterExpressionRan:
        characterExpressionResult
          .characterExpressionRan === true,

      characterExpressionSource:
        characterExpressionResult
          .characterExpressionSource ||
        characterExpressionResult.source ||
        "unknown",

      composerCharacter:
        characterExpressionResult
          .composerCharacter ||
        characterExpressionResult
          .composerCharacterPacket ||
        state.composerCharacter ||
        null
    };

    mark("after characterExpression");

    // =================================================
    // 5. Normalize Character Handoff
    // =================================================

    state.composerCharacter = {
      ...(state.composerCharacter || {}),

      enabled:
        state.composerCharacter?.enabled === true ||
        state.characterReasoning
          ?.characterAnswerAvailable === true,

      draft:
        state.characterReasoning
          ?.userFacingDraft ||
        state.composerCharacter?.draft ||
        "",

      reasoning:
        state.characterReasoning
          ?.characterAnswerAvailable === true
          ? state.characterReasoning
          : state.composerCharacter
              ?.reasoning ||
            null
    };

    const characterHandoff =
      this.buildCharacterHandoff(state);

    state = {
      ...state,

      characterHandoff,

      responseRequired:
        this.mergeUnique(
          state.responseRequired,
          characterHandoff.requiredBehaviors
        ),

      responseAvoid:
        this.mergeUnique(
          state.responseAvoid,
          characterHandoff.forbiddenBehaviors
        ),

      responseConstraints:
        this.mergeUnique(
          state.responseConstraints,
          characterHandoff.constraints
        )
    };

    // =================================================
    // 6. Character Stage Packet
    // =================================================

    state.characterStagePacket =
      this.buildCharacterStagePacket(state);

    state.characterStageRan = true;

    state.characterStageSource =
      "ari-character-stage";

    state.characterStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveCharacterEligibility(summary = {}) {
    const developerLocked =
      summary.developerResponseLocked === true;

    const safetyOverride =
      summary.safetyDisposition
        ?.shouldStopNormalResponse === true;

    const characterAllowed =
      summary.characterUseAllowed !== false;

    const route =
      summary.routingContract ||
      {};

    const mode =
      route.mode ||
      summary.conversationMode ||
      "unknown";

    const explicitCharacterRequest =
      [
        "identity",
        "relationship",
        "casual_conversation",
        "emotional_support",
        "social",
        "character"
      ].includes(mode) ||
      summary.characterContext
        ?.characterUseAllowed === true;

    const hasCharacterDraft =
      Boolean(
        summary.characterReasoning
          ?.userFacingDraft ||
        summary.composerCharacter
          ?.draft
      );

    const runContext =
      !developerLocked &&
      characterAllowed;

    const runReasoning =
      runContext &&
      !safetyOverride &&
      (
        explicitCharacterRequest ||
        hasCharacterDraft
      );

    const runExpression =
      runContext &&
      (
        explicitCharacterRequest ||
        runReasoning ||
        summary.characterVisibility !==
          "hidden"
      );

    return {
      runContext,
      runReasoning,
      runExpression,

      developerLocked,
      safetyOverride,
      characterAllowed,
      explicitCharacterRequest,
      hasCharacterDraft,

      source:
        "ari-character-stage-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : !characterAllowed
            ? "character_not_allowed"
            : explicitCharacterRequest
              ? "character_relevant"
              : "background_character_guidance"
    };
  },

  // ===================================================
  // Stage input
  // ===================================================

  buildCharacterStageInput(summary = {}) {
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

      safety:
        summary.safetyStagePacket ||
        null,

      understanding:
        summary.understandingStagePacket ||
        null,

      memory:
        summary.memoryStagePacket ||
        null,

      characterState: {
        useAllowed:
          summary.characterUseAllowed !== false,

        visibility:
          summary.characterVisibility ||
          "background",

        mode:
          summary.characterMode ||
          "silent",

        hints:
          summary.characterHints ||
          {}
      }
    };
  },

  // ===================================================
  // Character handoff
  // ===================================================

  buildCharacterHandoff(summary = {}) {
    const context =
      summary.characterContext ||
      {};

    const reasoning =
      summary.characterReasoning ||
      {};

    const expression =
      summary.characterExpression ||
      {};

    const composerCharacter =
      summary.composerCharacter ||
      {};

    return {
      enabled:
        composerCharacter.enabled === true,

      relevant:
        expression.characterRelevant === true ||
        context.characterUseAllowed === true,

      visibility:
        context.characterVisibility ||
        "background",

      mode:
        context.characterMode ||
        "silent",

      hints:
        context.characterHints ||
        {},

      draft:
        composerCharacter.draft ||
        reasoning.userFacingDraft ||
        "",

      answerAvailable:
        reasoning.characterAnswerAvailable === true,

      composerCharacter,

      requiredBehaviors:
        this.mergeUnique(
          context.requiredBehaviors,
          reasoning.requiredBehaviors,
          expression.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          context.forbiddenBehaviors,
          reasoning.forbiddenBehaviors,
          expression.forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          context.constraints,
          reasoning.constraints,
          expression.constraints
        ),

      confidence:
        reasoning.confidence ||
        expression.confidence ||
        context.confidence ||
        null,

      source:
        expression.characterExpressionRan === true
          ? "character_expression"
          : reasoning.characterReasoningRan === true
            ? "character_reasoning"
            : context.characterContextEngineRan === true
              ? "character_context"
              : "none"
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildCharacterStagePacket(summary = {}) {
    return {
      ready: true,

      source:
        "ari-character-stage",

      version:
        this.version,

      eligibility:
        summary.characterEligibility ||
        null,

      context: {
        ran:
          summary
            .characterContextEngineRan === true,

        source:
          summary
            .characterContextEngineSource ||
          null,

        value:
          summary.characterContext ||
          null
      },

      reasoning: {
        ran:
          summary.characterReasoningRan === true,

        source:
          summary.characterReasoningSource ||
          null,

        value:
          summary.characterReasoning ||
          null
      },

      expression: {
        ran:
          summary.characterExpressionRan === true,

        source:
          summary.characterExpressionSource ||
          null,

        value:
          summary.characterExpression ||
          null
      },

      handoff:
        summary.characterHandoff ||
        null,

      responseControl: {
        enabled:
          summary.characterHandoff
            ?.enabled === true,

        relevant:
          summary.characterHandoff
            ?.relevant === true,

        visibility:
          summary.characterHandoff
            ?.visibility ||
          "background",

        mode:
          summary.characterHandoff
            ?.mode ||
          "silent",

        draft:
          summary.characterHandoff
            ?.draft ||
          "",

        requiredBehaviors:
          summary.characterHandoff
            ?.requiredBehaviors ||
          [],

        forbiddenBehaviors:
          summary.characterHandoff
            ?.forbiddenBehaviors ||
          [],

        constraints:
          summary.characterHandoff
            ?.constraints ||
          []
      },

      authority: {
        canDetermineCharacterRelevance:
          true,

        canProvideCharacterGuidance:
          true,

        canProvideCharacterDraft:
          true,

        canChooseFinalRoute:
          false,

        canOverrideSafety:
          false,

        canSelectFinalDraft:
          false,

        canWriteFinalResponse:
          false,

        canPersistState:
          false,

        role:
          "character_context_reasoning_and_expression_guidance"
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
  "ARI CHARACTER STAGE LOADED:",
  window.AriCharacterStage?.version
);
