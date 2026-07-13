// ari/pipeline-stages/expression/ari-character-stage.js
// Ari Character Expression Stage
// Purpose: Resolve whether Ari's character voice is relevant and prepare character guidance.
// V1.1.0 — Post-Context Eligibility / Local Character Authority Integration

window.Ari = window.Ari || {};

window.AriCharacterStage = {
  version: "1.1.0",

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

      activeExpressionStage:
        "character"
    };

    // =================================================
    // Initial Eligibility
    //
    // This eligibility decision determines whether the
    // Character Context Engine may run.
    //
    // It is intentionally provisional because the
    // current-turn Character Context does not exist yet.
    // =================================================

    const initialCharacterEligibility =
      this.resolveCharacterEligibility(state);

    state = {
      ...state,

      initialCharacterEligibility,

      characterEligibility:
        initialCharacterEligibility,

      shouldRunCharacterContext:
        initialCharacterEligibility.runContext,

      shouldRunCharacterReasoning:
        initialCharacterEligibility.runReasoning,

      shouldRunCharacterExpression:
        initialCharacterEligibility.runExpression
    };

    // =================================================
    // 1. Character Context
    // =================================================

    mark("before characterContext");

    const characterContextResult =
      initialCharacterEligibility.runContext
        ? await runEngine(
            window.AriCharacterContextEngine,

            [
              "create",
              "build"
            ],

            {
              characterContextEngineRan:
                false,

              characterContextEngineSource:
                "not-loaded",

              characterUseAllowed:
                false,

              characterVisibility:
                "background",

              characterMode:
                "silent",

              characterFocus:
                null,

              characterReason:
                "Character context engine not loaded.",

              characterHints:
                {}
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

            characterFocus:
              null,

            characterReason:
              "Character context not required.",

            characterHints:
              {}
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
    // Post-Context Eligibility
    //
    // Character Context is now available for the current
    // turn. Recalculate whether Character Reasoning and
    // Character Expression must run.
    //
    // This prevents the stage from locking in a "skip"
    // decision before the context engine identifies a
    // preference, identity, worldview, or perspective
    // question.
    // =================================================

    const resolvedCharacterEligibility =
      this.resolvePostContextEligibility(
        state,
        initialCharacterEligibility
      );

    state = {
      ...state,

      characterEligibility:
        resolvedCharacterEligibility,

      resolvedCharacterEligibility,

      shouldRunCharacterContext:
        resolvedCharacterEligibility.runContext,

      shouldRunCharacterReasoning:
        resolvedCharacterEligibility.runReasoning,

      shouldRunCharacterExpression:
        resolvedCharacterEligibility.runExpression
    };

    // =================================================
    // 2. Local Character Authorities
    //
    // Ari's character information is local.
    //
    // Supabase is not used for character preferences,
    // character identity, worldview, or character
    // knowledge retrieval.
    // =================================================

    mark("before localCharacterAuthorities");

    const localCharacterAuthorityResult =
      this.inspectLocalCharacterAuthorities();

    state = {
      ...state,

      localCharacterAuthorities:
        localCharacterAuthorityResult,

      characterKnowledge:
        localCharacterAuthorityResult,

      characterKnowledgeAvailable:
        localCharacterAuthorityResult
          .characterKnowledgeAvailable === true,

      characterCoreAvailable:
        localCharacterAuthorityResult
          .characterCoreAvailable === true,

      characterPreferencesAvailable:
        localCharacterAuthorityResult
          .characterPreferencesAvailable === true,

      ariWorldviewAvailable:
        localCharacterAuthorityResult
          .ariWorldviewAvailable === true,

      // Compatibility marker only.
      // This must never be used as Ari's character source.
      supabaseCharacterKnowledge: {
        supabaseCharacterKnowledgeRan:
          false,

        characterKnowledgeAvailable:
          false,

        source:
          "not-applicable",

        reason:
          "Supabase is reserved for user memory retrieval and storage. Ari character identity, preferences, and worldview are local."
      }
    };

    mark("after localCharacterAuthorities");

    // =================================================
    // 3. Character Reasoning
    // =================================================

    mark("before characterReasoning");

    const characterReasoningResult =
      state.characterEligibility
        ?.runReasoning === true
        ? await runEngine(
            window.AriCharacterReasoningEngine,

            [
              "reason",
              "create"
            ],

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
                null,

              localCharacterAuthorities:
                state.localCharacterAuthorities ||
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
              state.characterEligibility
                ?.safetyOverride === true
                ? "Character reasoning was suppressed by safety governance."
                : "Character reasoning was not required by the resolved character context."
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
      state.characterEligibility
        ?.runExpression === true
        ? await runEngine(
            window.AriCharacterExpressionEngine,

            [
              "create",
              "build"
            ],

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
                null,

              localCharacterAuthorities:
                state.localCharacterAuthorities ||
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
              "Character expression was not required by the resolved character context."
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
      ...(
        state.composerCharacter ||
        {}
      ),

      enabled:
        state.composerCharacter
          ?.enabled === true ||
        state.characterReasoning
          ?.characterAnswerAvailable === true,

      relevant:
        state.composerCharacter
          ?.relevant === true ||
        state.characterExpression
          ?.characterRelevant === true ||
        state.characterContext
          ?.characterUseAllowed === true,

      draft:
        state.characterReasoning
          ?.userFacingDraft ||
        state.composerCharacter
          ?.draft ||
        "",

      reasoning:
        state.characterReasoning
          ?.characterAnswerAvailable === true
          ? state.characterReasoning
          : state.composerCharacter
              ?.reasoning ||
            null,

      mode:
        state.characterContext
          ?.characterMode ||
        state.composerCharacter
          ?.mode ||
        "silent",

      focus:
        state.characterContext
          ?.characterFocus ||
        state.characterReasoning
          ?.focus ||
        state.composerCharacter
          ?.focus ||
        null,

      source:
        state.characterReasoning
          ?.source ||
        state.characterContext
          ?.preferredCharacterSource ||
        state.composerCharacter
          ?.source ||
        null
    };

    const characterHandoff =
      this.buildCharacterHandoff(state);

    state = {
      ...state,

      characterHandoff,

      characterDraftCandidate:
        characterHandoff.answerAvailable === true &&
        Boolean(
          String(
            characterHandoff.draft ||
            ""
          ).trim()
        )
          ? characterHandoff.draft
          : state.characterDraftCandidate ||
            null,

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

    state.characterStageRan =
      true;

    state.characterStageSource =
      "ari-character-stage";

    state.characterStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Initial Eligibility
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

    const routeMode =
      typeof route.mode === "string"
        ? route.mode
        : route.mode?.mode ||
          summary.conversationMode ||
          "unknown";

    const semantic =
      summary.semanticSummary ||
      summary.perceptionPacket
        ?.semanticSummary ||
      {};

    const canonical =
      semantic.canonicalMeaning ||
      summary.canonicalMeaning ||
      {};

    const conversationType =
      summary.conversationType ||
      summary.universalConversationType ||
      summary.conversationClassification
        ?.conversationType ||
      summary.perceptionPacket
        ?.conversationType ||
      "";

    const primaryFunction =
      summary.primaryFunction ||
      summary.conversationFunction
        ?.primaryFunction ||
      summary.conversationFunctionPacket
        ?.primaryFunction ||
      summary.perceptionPacket
        ?.primaryFunction ||
      "";

    const interactionFamily =
      canonical.interactionFamily ||
      semantic.interactionFamily ||
      summary.interactionFamily ||
      "";

    const intentFamily =
      canonical.intentFamily ||
      semantic.intentFamily ||
      summary.intentFamily ||
      "";

    const upstreamCharacterRelevant =
      [
        "identity",
        "relationship",
        "casual_conversation",
        "emotional_support",
        "social",
        "character"
      ].includes(routeMode) ||
      [
        "identity",
        "relationship",
        "social",
        "character"
      ].includes(interactionFamily) ||
      [
        "identity",
        "relationship",
        "social",
        "character"
      ].includes(intentFamily) ||
      [
        "identity_exploration",
        "relationship_connection",
        "social_connection"
      ].includes(primaryFunction) ||
      [
        "identity_question",
        "ari_self_or_perspective_question",
        "relationship_question"
      ].includes(conversationType);

    const existingContextRelevant =
      summary.characterContext
        ?.characterUseAllowed === true;

    const explicitCharacterRequest =
      upstreamCharacterRelevant ||
      existingContextRelevant;

    const hasCharacterDraft =
      Boolean(
        String(
          summary.characterReasoning
            ?.userFacingDraft ||
          summary.composerCharacter
            ?.draft ||
          ""
        ).trim()
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
      phase:
        "initial",

      runContext,
      runReasoning,
      runExpression,

      developerLocked,
      safetyOverride,
      characterAllowed,
      explicitCharacterRequest,
      upstreamCharacterRelevant,
      existingContextRelevant,
      hasCharacterDraft,

      signals: {
        routeMode,
        interactionFamily,
        intentFamily,
        primaryFunction,
        conversationType
      },

      source:
        "ari-character-stage-initial-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : !characterAllowed
            ? "character_not_allowed"
            : safetyOverride
              ? "safety_override_present"
              : explicitCharacterRequest
                ? "upstream_character_relevance"
                : hasCharacterDraft
                  ? "existing_character_draft"
                  : "character_context_allowed_to_evaluate"
    };
  },

  // ===================================================
  // Post-Context Eligibility
  // ===================================================

  resolvePostContextEligibility(
    summary = {},
    initialEligibility = {}
  ) {
    const context =
      summary.characterContext ||
      {};

    const developerLocked =
      initialEligibility
        .developerLocked === true;

    const safetyOverride =
      initialEligibility
        .safetyOverride === true;

    const initialCharacterAllowed =
      initialEligibility
        .characterAllowed !== false;

    const contextCharacterAllowed =
      context.characterUseAllowed === true;

    const characterMode =
      context.characterMode ||
      "silent";

    const characterFocus =
      context.characterFocus ||
      null;

    const foregroundReasoningModes =
      [
        "stable_preference_answer",
        "stable_or_inferred_preference_answer",
        "ari_self_disclosure",
        "worldview_answer",
        "ari_perspective"
      ];

    const contextRequestsReasoning =
      contextCharacterAllowed &&
      foregroundReasoningModes.includes(
        characterMode
      );

    const hasCharacterFocus =
      Boolean(
        String(
          characterFocus ||
          ""
        ).trim()
      );

    const hasCharacterDraft =
      Boolean(
        String(
          summary.characterReasoning
            ?.userFacingDraft ||
          summary.composerCharacter
            ?.draft ||
          ""
        ).trim()
      );

    const runContext =
      initialEligibility.runContext === true;

    const runReasoning =
      runContext &&
      !developerLocked &&
      !safetyOverride &&
      initialCharacterAllowed &&
      (
        contextRequestsReasoning ||
        (
          contextCharacterAllowed &&
          hasCharacterFocus
        ) ||
        initialEligibility
          .runReasoning === true ||
        hasCharacterDraft
      );

    const runExpression =
      runContext &&
      !developerLocked &&
      initialCharacterAllowed &&
      (
        runReasoning ||
        contextCharacterAllowed ||
        context.characterVisibility !==
          "hidden"
      );

    return {
      ...initialEligibility,

      phase:
        "post-context",

      runContext,
      runReasoning,
      runExpression,

      developerLocked,
      safetyOverride,

      characterAllowed:
        initialCharacterAllowed,

      contextCharacterAllowed,
      contextRequestsReasoning,
      hasCharacterFocus,
      hasCharacterDraft,

      resolvedCharacterMode:
        characterMode,

      resolvedCharacterFocus:
        characterFocus,

      contextVisibility:
        context.characterVisibility ||
        "background",

      contextReason:
        context.characterReason ||
        null,

      source:
        "ari-character-stage-post-context-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : !initialCharacterAllowed
            ? "character_not_allowed"
            : safetyOverride
              ? "safety_stopped_character_reasoning"
              : contextRequestsReasoning
                ? "character_context_requested_reasoning"
                : contextCharacterAllowed &&
                  hasCharacterFocus
                  ? "character_context_provided_focus"
                  : initialEligibility
                      .runReasoning === true
                    ? "upstream_character_relevance"
                    : hasCharacterDraft
                      ? "existing_character_draft"
                      : contextCharacterAllowed
                        ? "character_presence_only"
                        : "background_character_guidance"
    };
  },

  // ===================================================
  // Local Character Authority Inspection
  // ===================================================

  inspectLocalCharacterAuthorities() {
    const core =
      window.AriCharacterCore
        ?.getCore?.() ||
      null;

    const preferences =
      window.AriCharacterPreferences
        ?.getPreferences?.() ||
      null;

    const worldview =
      window.AriWorldview
        ?.getWorldview?.() ||
      null;

    const characterCoreAvailable =
      Boolean(core);

    const characterPreferencesAvailable =
      Boolean(preferences);

    const ariWorldviewAvailable =
      Boolean(worldview);

    return {
      localCharacterAuthoritiesRan:
        true,

      source:
        "local-character-authorities",

      characterKnowledgeAvailable:
        characterCoreAvailable ||
        characterPreferencesAvailable ||
        ariWorldviewAvailable,

      characterCoreAvailable,

      characterPreferencesAvailable,

      ariWorldviewAvailable,

      authorities: {
        characterCore:
          characterCoreAvailable
            ? {
                available:
                  true,

                source:
                  "ari-character-core"
              }
            : {
                available:
                  false,

                source:
                  "not-loaded"
              },

        characterPreferences:
          characterPreferencesAvailable
            ? {
                available:
                  true,

                source:
                  "ari-character-preferences"
              }
            : {
                available:
                  false,

                source:
                  "not-loaded"
              },

        worldview:
          ariWorldviewAvailable
            ? {
                available:
                  true,

                source:
                  "ari-worldview"
              }
            : {
                available:
                  false,

                source:
                  "not-loaded"
              }
      },

      reason:
        characterCoreAvailable ||
        characterPreferencesAvailable ||
        ariWorldviewAvailable
          ? "One or more local Ari character authorities are available."
          : "No local Ari character authorities are currently loaded."
    };
  },

  // ===================================================
  // Stage Input
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
          summary.characterUseAllowed !==
          false,

        visibility:
          summary.characterVisibility ||
          summary.characterContext
            ?.characterVisibility ||
          "background",

        mode:
          summary.characterMode ||
          summary.characterContext
            ?.characterMode ||
          "silent",

        focus:
          summary.characterFocus ||
          summary.characterContext
            ?.characterFocus ||
          null,

        hints:
          summary.characterHints ||
          summary.characterContext
            ?.characterHints ||
          {}
      },

      localCharacterAuthorities:
        summary.localCharacterAuthorities ||
        null,

      eligibility:
        summary.characterEligibility ||
        null
    };
  },

  // ===================================================
  // Character Handoff
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

    const draft =
      composerCharacter.draft ||
      reasoning.userFacingDraft ||
      "";

    return {
      enabled:
        composerCharacter.enabled === true ||
        reasoning.characterAnswerAvailable ===
          true,

      relevant:
        expression.characterRelevant === true ||
        context.characterUseAllowed === true ||
        reasoning.characterAnswerAvailable ===
          true,

      visibility:
        context.characterVisibility ||
        composerCharacter.visibility ||
        "background",

      mode:
        context.characterMode ||
        composerCharacter.mode ||
        "silent",

      focus:
        context.characterFocus ||
        reasoning.focus ||
        composerCharacter.focus ||
        null,

      preferredCharacterSource:
        context.preferredCharacterSource ||
        reasoning.source ||
        composerCharacter.source ||
        null,

      hints:
        context.characterHints ||
        composerCharacter.hints ||
        {},

      draft,

      answer:
        reasoning.answer ||
        null,

      answerAvailable:
        reasoning.characterAnswerAvailable ===
        true,

      needsAIWriter:
        reasoning.needsAIWriter === true,

      aiWriterMode:
        reasoning.aiWriterMode ||
        null,

      aiInstruction:
        reasoning.aiInstruction ||
        "",

      composerCharacter,

      reasoning:
        reasoning.characterAnswerAvailable ===
        true
          ? reasoning
          : null,

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
        expression.characterExpressionRan ===
          true
          ? "character_expression"
          : reasoning.characterReasoningRan ===
              true
            ? "character_reasoning"
            : context.characterContextEngineRan ===
                true
              ? "character_context"
              : "none"
    };
  },

  // ===================================================
  // Character Stage Packet
  // ===================================================

  buildCharacterStagePacket(summary = {}) {
    return {
      ready:
        summary.characterContextEngineRan ===
          true ||
        summary.characterReasoningRan ===
          true ||
        summary.characterExpressionRan ===
          true,

      source:
        "ari-character-stage",

      version:
        this.version,

      initialEligibility:
        summary.initialCharacterEligibility ||
        null,

      eligibility:
        summary.characterEligibility ||
        null,

      localCharacterAuthorities:
        summary.localCharacterAuthorities ||
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
          summary.characterReasoningRan ===
          true,

        source:
          summary.characterReasoningSource ||
          null,

        answerAvailable:
          summary.characterReasoning
            ?.characterAnswerAvailable ===
          true,

        draft:
          summary.characterReasoning
            ?.userFacingDraft ||
          "",

        value:
          summary.characterReasoning ||
          null
      },

      expression: {
        ran:
          summary.characterExpressionRan ===
          true,

        source:
          summary.characterExpressionSource ||
          null,

        relevant:
          summary.characterExpression
            ?.characterRelevant === true,

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

        focus:
          summary.characterHandoff
            ?.focus ||
          null,

        draft:
          summary.characterHandoff
            ?.draft ||
          "",

        answerAvailable:
          summary.characterHandoff
            ?.answerAvailable === true,

        needsAIWriter:
          summary.characterHandoff
            ?.needsAIWriter === true,

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

      quality: {
        contextResolved:
          summary.characterContextEngineRan ===
          true,

        reasoningRequired:
          summary.characterEligibility
            ?.runReasoning === true,

        reasoningRan:
          summary.characterReasoningRan ===
          true,

        answerAvailable:
          summary.characterHandoff
            ?.answerAvailable === true,

        draftAvailable:
          Boolean(
            String(
              summary.characterHandoff
                ?.draft ||
              ""
            ).trim()
          ),

        localCharacterKnowledgeAvailable:
          summary.localCharacterAuthorities
            ?.characterKnowledgeAvailable ===
          true
      },

      authority: {
        canDetermineCharacterRelevance:
          true,

        canProvideCharacterGuidance:
          true,

        canProvideCharacterDraft:
          true,

        canReadLocalCharacterCore:
          true,

        canReadLocalCharacterPreferences:
          true,

        canReadLocalWorldview:
          true,

        canRetrieveCharacterFromSupabase:
          false,

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