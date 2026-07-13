// ari/pipeline-stages/expression/ari-character-stage.js
// Ari Character Stage
// Purpose: Orchestrate Ari's local character authorities through Context,
// Reasoning, and Expression, then produce one normalized downstream handoff.
// V2.0.0 — Modular Character Subsystem Orchestration / Local-Only
//
// Architectural position:
// Expression Pipeline
//   ↓
// Ari Character Stage
//   ├─ Character Context Engine
//   ├─ Local Character Authority Inspection
//   ├─ Character Reasoning Engine
//   └─ Character Expression Engine
//        ↓
// Character Handoff
//        ↓
// Language Guidance / Composer Bridge / Draft Generation
//
// Local character authorities:
// - Ari Constitution
// - Ari Character Core
// - Ari Character Instincts
// - Ari Character Taste Profile
// - Ari Character Preferences
// - Ari Character Preference Resolver
// - Ari Worldview
// - Ari Relationship Style
//
// Responsibilities:
// - Run Character Context for every eligible expression turn.
// - Recalculate eligibility after current-turn Character Context exists.
// - Inspect all local character authorities without retrieving from Supabase.
// - Run Character Reasoning only when focused reasoning is authorized.
// - Run Character Expression when character or relationship guidance is useful.
// - Preserve canonical, inferred, open, identity, and worldview status.
// - Produce one normalized Composer-ready character handoff.
// - Merge character response controls into the main response controls.
// - Preserve deterministic character drafts for Draft Generation.
//
// Non-responsibilities:
// - Does not classify the conversation.
// - Does not reinterpret semantic meaning.
// - Does not override the Conversation Function Engine.
// - Does not override the Situation Contract.
// - Does not determine safety severity.
// - Does not retrieve or store user memory.
// - Does not access Supabase.
// - Does not select the final draft.
// - Does not write the final response.
// - Does not execute tools.

window.Ari = window.Ari || {};

window.AriCharacterStage = {
  version: "2.0.0",
  source: "ari-character-stage",
  authorityLevel: "character_subsystem_orchestration_authority",
  schemaVersion: "2.0",

  // ===================================================
  // Main entry
  // ===================================================

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
    // 1. Initial eligibility
    //
    // This only determines whether Character Context may
    // inspect the turn. It must not decide the final
    // character mode before current-turn context exists.
    // =================================================

    const initialCharacterEligibility =
      this.resolveInitialEligibility(state);

    state = {
      ...state,

      initialCharacterEligibility,

      characterEligibility:
        initialCharacterEligibility,

      shouldRunCharacterContext:
        initialCharacterEligibility.runContext,

      shouldRunCharacterReasoning:
        false,

      shouldRunCharacterExpression:
        false
    };

    // =================================================
    // 2. Character Context
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

            this.buildContextFallback(
              "Character Context Engine was not loaded."
            ),

            {
              ...state,

              characterStageInput:
                this.buildCharacterStageInput(
                  state
                )
            }
          )
        : this.buildContextFallback(
            "Character Context was skipped by initial eligibility.",
            "skipped-by-expression-eligibility"
          );

    state = {
      ...state,

      ...characterContextResult,

      characterContext:
        characterContextResult,

      characterContextEngineRan:
        characterContextResult
          .characterContextEngineRan ===
        true,

      characterContextEngineReady:
        characterContextResult
          .characterContextEngineReady ===
        true,

      characterContextEngineSource:
        characterContextResult
          .characterContextEngineSource ||
        characterContextResult.source ||
        "unknown"
    };

    mark("after characterContext");

    // =================================================
    // 3. Post-context eligibility
    //
    // Character Context now holds the current-turn mode,
    // focus, budget, relationship packet, and authority
    // request. This is the authoritative point for deciding
    // whether Reasoning and Expression must run.
    // =================================================

    const resolvedCharacterEligibility =
      this.resolvePostContextEligibility({
        summary: state,
        initialEligibility:
          initialCharacterEligibility
      });

    state = {
      ...state,

      resolvedCharacterEligibility,

      characterEligibility:
        resolvedCharacterEligibility,

      shouldRunCharacterContext:
        resolvedCharacterEligibility
          .runContext,

      shouldRunCharacterReasoning:
        resolvedCharacterEligibility
          .runReasoning,

      shouldRunCharacterExpression:
        resolvedCharacterEligibility
          .runExpression
    };

    // =================================================
    // 4. Local character authorities
    //
    // This is inspection only. Each reasoning authority
    // remains responsible for returning its own focused
    // packet when requested.
    // =================================================

    mark("before localCharacterAuthorities");

    const localCharacterAuthorities =
      this.inspectLocalCharacterAuthorities({
        context:
          state.characterContext ||
          null
      });

    state = {
      ...state,

      localCharacterAuthorities,

      localCharacterAuthoritiesRan:
        true,

      characterKnowledge:
        localCharacterAuthorities,

      characterKnowledgeAvailable:
        localCharacterAuthorities
          .characterKnowledgeAvailable ===
        true,

      characterAuthorityRequestSatisfied:
        localCharacterAuthorities
          .requestedAuthoritiesSatisfied ===
        true
    };

    mark("after localCharacterAuthorities");

    // =================================================
    // 5. Character Reasoning
    // =================================================

    mark("before characterReasoning");

    const characterReasoningResult =
      resolvedCharacterEligibility
        .runReasoning === true
        ? await runEngine(
            window.AriCharacterReasoningEngine,

            [
              "reason",
              "create",
              "build"
            ],

            this.buildReasoningFallback(
              "Character Reasoning Engine was not loaded."
            ),

            {
              ...state,

              characterStageInput:
                this.buildCharacterStageInput(
                  state
                ),

              characterContext:
                state.characterContext ||
                null,

              localCharacterAuthorities:
                state.localCharacterAuthorities ||
                null
            }
          )
        : this.buildReasoningFallback(
            resolvedCharacterEligibility
              .reasoningSkipReason ||
            "Character Reasoning was not required.",
            "skipped-by-expression-eligibility"
          );

    state = {
      ...state,

      ...characterReasoningResult,

      characterReasoning:
        characterReasoningResult,

      characterReasoningRan:
        characterReasoningResult
          .characterReasoningRan ===
        true,

      characterReasoningReady:
        characterReasoningResult
          .characterReasoningReady ===
        true,

      characterReasoningSource:
        characterReasoningResult
          .characterReasoningSource ||
        characterReasoningResult.source ||
        "unknown"
    };

    mark("after characterReasoning");

    // =================================================
    // 6. Character Expression
    // =================================================

    mark("before characterExpression");

    const characterExpressionResult =
      resolvedCharacterEligibility
        .runExpression === true
        ? await runEngine(
            window.AriCharacterExpressionEngine,

            [
              "create",
              "build"
            ],

            this.buildExpressionFallback(
              "Character Expression Engine was not loaded."
            ),

            {
              ...state,

              characterStageInput:
                this.buildCharacterStageInput(
                  state
                ),

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
        : this.buildExpressionFallback(
            resolvedCharacterEligibility
              .expressionSkipReason ||
            "Character Expression was not required.",
            "skipped-by-expression-eligibility"
          );

    state = {
      ...state,

      ...characterExpressionResult,

      characterExpression:
        characterExpressionResult,

      characterExpressionRan:
        characterExpressionResult
          .characterExpressionRan ===
        true,

      characterExpressionReady:
        characterExpressionResult
          .characterExpressionReady ===
        true,

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
    // 7. Normalize the Composer character packet
    //
    // Preserve the Expression Engine packet as authority.
    // Fill only missing compatibility fields.
    // =================================================

    state.composerCharacter =
      this.normalizeComposerCharacter(
        state
      );

    // =================================================
    // 8. Build downstream handoff
    // =================================================

    const characterHandoff =
      this.buildCharacterHandoff(
        state
      );

    state = {
      ...state,

      characterHandoff,

      characterAnswerAvailable:
        characterHandoff
          .answerAvailable ===
        true,

      characterGuidanceAvailable:
        characterHandoff
          .guidanceAvailable ===
        true,

      characterDraftCandidate:
        characterHandoff
          .answerAvailable ===
          true &&
        Boolean(
          String(
            characterHandoff
              .draft ||
            ""
          ).trim()
        )
          ? characterHandoff.draft
          : state.characterDraftCandidate ||
            null,

      characterDeterministicDraft:
        characterHandoff
          .deterministicDraft ||
        state.characterDeterministicDraft ||
        null,

      characterNeedsAIWriter:
        characterHandoff
          .needsAIWriter ===
        true,

      characterAIWriterMode:
        characterHandoff
          .aiWriterMode ||
        null,

      characterAIInstruction:
        characterHandoff
          .aiInstruction ||
        "",

      responseRequired:
        this.mergeUnique(
          state.responseRequired,
          characterHandoff
            .requiredBehaviors
        ),

      responseAvoid:
        this.mergeUnique(
          state.responseAvoid,
          characterHandoff
            .forbiddenBehaviors
        ),

      responseConstraints:
        this.mergeUnique(
          state.responseConstraints,
          characterHandoff
            .constraints
        )
    };

    // =================================================
    // 9. Character stage packet
    // =================================================

    state.characterStagePacket =
      this.buildCharacterStagePacket(
        state
      );

    state.characterStageRan =
      true;

    state.characterStageSource =
      this.source;

    state.characterStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Initial eligibility
  // ===================================================

  resolveInitialEligibility(
    summary = {}
  ) {
    const developerLocked =
      summary.developerResponseLocked ===
      true;

    const responseLocked =
      summary.responseLocked === true;

    const characterGloballyAllowed =
      summary.characterUseAllowed !==
      false;

    const contextEngineAvailable =
      Boolean(
        window.AriCharacterContextEngine &&
        (
          typeof window
            .AriCharacterContextEngine
            .create === "function" ||
          typeof window
            .AriCharacterContextEngine
            .build === "function"
        )
      );

    const runContext =
      !developerLocked &&
      !responseLocked &&
      characterGloballyAllowed;

    return {
      phase:
        "initial",

      runContext,

      runReasoning:
        false,

      runExpression:
        false,

      developerLocked,
      responseLocked,
      characterGloballyAllowed,
      contextEngineAvailable,

      source:
        "ari-character-stage-initial-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : responseLocked
            ? "response_locked"
            : !characterGloballyAllowed
              ? "character_globally_disabled"
              : !contextEngineAvailable
                ? "character_context_engine_not_loaded"
                : "character_context_authorized_to_inspect_turn"
    };
  },

  // Compatibility alias.
  resolveCharacterEligibility(
    summary = {}
  ) {
    return this.resolveInitialEligibility(
      summary
    );
  },

  // ===================================================
  // Post-context eligibility
  // ===================================================

  resolvePostContextEligibility({
    summary = {},
    initialEligibility = {}
  } = {}) {
    const context =
      summary.characterContext ||
      {};

    const budget =
      context.characterBudget ||
      {};

    const mode =
      context.characterMode ||
      "silent";

    const developerLocked =
      initialEligibility
        .developerLocked ===
      true;

    const responseLocked =
      initialEligibility
        .responseLocked ===
      true;

    const characterGloballyAllowed =
      initialEligibility
        .characterGloballyAllowed !==
      false;

    const safetyStopped =
      summary.safetyDisposition
        ?.shouldStopNormalResponse ===
      true;

    const hardSuppressed =
      budget.hardSuppressed ===
      true;

    const contextRan =
      summary
        .characterContextEngineRan ===
      true;

    const contextReady =
      summary
        .characterContextEngineReady ===
        true ||
      contextRan;

    const contextAllowsCharacter =
      context.characterUseAllowed ===
      true;

    const relationshipAvailable =
      Boolean(
        context.relationshipPacket
      );

    const focusedReasoningMode =
      this.isFocusedReasoningMode(
        mode
      );

    const guidanceOnlyMode =
      this.isGuidanceOnlyMode(
        mode
      );

    const hasFocus =
      Boolean(
        String(
          context.characterFocus ||
          ""
        ).trim()
      );

    const hasExistingReasoning =
      Boolean(
        summary.characterReasoning
      );

    const hasExistingDraft =
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
      initialEligibility.runContext ===
      true;

    const runReasoning =
      runContext &&
      contextReady &&
      characterGloballyAllowed &&
      !developerLocked &&
      !responseLocked &&
      !safetyStopped &&
      !hardSuppressed &&
      (
        (
          contextAllowsCharacter &&
          focusedReasoningMode
        ) ||
        (
          contextAllowsCharacter &&
          hasFocus &&
          !guidanceOnlyMode
        ) ||
        hasExistingReasoning ||
        hasExistingDraft
      );

    const expressionMayCarryRelationship =
      relationshipAvailable &&
      !developerLocked &&
      !responseLocked;

    const runExpression =
      runContext &&
      contextReady &&
      !developerLocked &&
      !responseLocked &&
      (
        runReasoning ||
        contextAllowsCharacter ||
        expressionMayCarryRelationship
      );

    return {
      ...initialEligibility,

      phase:
        "post-context",

      runContext,
      runReasoning,
      runExpression,

      developerLocked,
      responseLocked,
      characterGloballyAllowed,
      safetyStopped,
      hardSuppressed,

      contextRan,
      contextReady,
      contextAllowsCharacter,
      relationshipAvailable,
      focusedReasoningMode,
      guidanceOnlyMode,
      hasFocus,
      hasExistingReasoning,
      hasExistingDraft,

      resolvedCharacterMode:
        mode,

      resolvedCharacterFocus:
        context.characterFocus ||
        null,

      contextVisibility:
        context.characterVisibility ||
        "background",

      contextReason:
        context.characterReason ||
        null,

      reasoningSkipReason:
        developerLocked
          ? "Developer response lock prevents Character Reasoning."
          : responseLocked
            ? "Response lock prevents Character Reasoning."
            : safetyStopped
              ? "Safety governance prevents normal Character Reasoning."
              : hardSuppressed
                ? "Character Context hard-suppressed Character Reasoning."
                : !contextReady
                  ? "Character Context did not produce a ready result."
                  : guidanceOnlyMode
                    ? "The current character mode requires guidance only."
                    : !contextAllowsCharacter
                      ? "Character Context did not authorize foreground character reasoning."
                      : "No focused character reasoning path was required.",

      expressionSkipReason:
        developerLocked
          ? "Developer response lock prevents Character Expression."
          : responseLocked
            ? "Response lock prevents Character Expression."
            : !contextReady
              ? "Character Context did not produce a ready result."
              : "No character or relationship expression packet was required.",

      source:
        "ari-character-stage-post-context-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : responseLocked
            ? "response_locked"
            : safetyStopped
              ? "safety_stopped_character_reasoning"
              : hardSuppressed &&
                relationshipAvailable
                ? "character_suppressed_relationship_guidance_available"
                : runReasoning
                  ? "focused_character_reasoning_required"
                  : runExpression
                    ? "character_or_relationship_expression_required"
                    : "character_subsystem_background_only"
    };
  },

  isFocusedReasoningMode(
    mode = ""
  ) {
    return [
      "canonical_preference_answer",
      "stable_preference_answer",
      "stable_or_inferred_preference_answer",
      "ari_self_disclosure",
      "ari_implementation_disclosure",
      "worldview_answer",
      "ari_perspective"
    ].includes(mode);
  },

  isGuidanceOnlyMode(
    mode = ""
  ) {
    return [
      "background_presence",
      "warm_grounded_presence",
      "contract_suppressed",
      "safety_contract",
      "developer_response_locked",
      "response_locked",
      "silent"
    ].includes(mode);
  },

  // ===================================================
  // Local character authority inspection
  // ===================================================

  inspectLocalCharacterAuthorities({
    context = null
  } = {}) {
    const authorityRequest =
      context?.authorityRequest ||
      {};

    const definitions = {
      constitution: {
        object:
          window.AriConstitution,

        methods: [
          "getConstitution",
          "buildConstitutionPacket"
        ],

        source:
          "ari-constitution"
      },

      characterCore: {
        object:
          window.AriCharacterCore,

        methods: [
          "getCore",
          "buildCorePacket"
        ],

        source:
          "ari-character-core"
      },

      characterInstincts: {
        object:
          window.AriCharacterInstincts,

        methods: [
          "getInstincts",
          "resolve",
          "build"
        ],

        source:
          "ari-character-instincts"
      },

      tasteProfile: {
        object:
          window.AriCharacterTasteProfile,

        methods: [
          "getTasteProfile",
          "resolve",
          "build"
        ],

        source:
          "ari-character-taste-profile"
      },

      characterPreferences: {
        object:
          window.AriCharacterPreferences,

        methods: [
          "getPreferences",
          "getPreference",
          "hasPreference"
        ],

        source:
          "ari-character-preferences"
      },

      preferenceResolver: {
        object:
          window.AriCharacterPreferenceResolver,

        methods: [
          "resolve",
          "create",
          "build"
        ],

        source:
          "ari-character-preference-resolver"
      },

      worldview: {
        object:
          window.AriWorldview,

        methods: [
          "getWorldview",
          "resolve",
          "getTopic"
        ],

        source:
          "ari-worldview"
      },

      relationshipStyle: {
        object:
          window.AriRelationshipStyle,

        methods: [
          "getRelationshipStyle",
          "resolve",
          "build"
        ],

        source:
          "ari-relationship-style"
      }
    };

    const authorities = {};

    for (
      const [
        key,
        definition
      ]
      of Object.entries(
        definitions
      )
    ) {
      authorities[key] =
        this.inspectAuthority(
          definition
        );
    }

    const requested =
      this.resolveRequestedAuthorities(
        authorityRequest
      );

    const missingRequested =
      requested.filter(
        key =>
          authorities[key]
            ?.available !==
          true
      );

    const availableCount =
      Object.values(
        authorities
      ).filter(
        authority =>
          authority.available ===
          true
      ).length;

    return {
      localCharacterAuthoritiesRan:
        true,

      source:
        "local-character-authorities",

      localOnly:
        true,

      supabaseUsed:
        false,

      characterKnowledgeAvailable:
        availableCount > 0,

      allAuthoritiesAvailable:
        availableCount ===
        Object.keys(
          authorities
        ).length,

      availableCount,

      totalCount:
        Object.keys(
          authorities
        ).length,

      requestedAuthorities:
        requested,

      missingRequestedAuthorities:
        missingRequested,

      requestedAuthoritiesSatisfied:
        missingRequested.length ===
        0,

      characterCoreAvailable:
        authorities.characterCore
          ?.available ===
        true,

      characterPreferencesAvailable:
        authorities
          .characterPreferences
          ?.available ===
        true,

      ariWorldviewAvailable:
        authorities.worldview
          ?.available ===
        true,

      characterInstinctsAvailable:
        authorities
          .characterInstincts
          ?.available ===
        true,

      tasteProfileAvailable:
        authorities.tasteProfile
          ?.available ===
        true,

      preferenceResolverAvailable:
        authorities
          .preferenceResolver
          ?.available ===
        true,

      relationshipStyleAvailable:
        authorities
          .relationshipStyle
          ?.available ===
        true,

      authorities,

      reason:
        missingRequested.length
          ? `Missing requested local character authorities: ${missingRequested.join(", ")}.`
          : requested.length
            ? "All requested local character authorities are available."
            : availableCount
              ? "Local character authorities are available."
              : "No local character authorities are loaded."
    };
  },

  inspectAuthority({
    object = null,
    methods = [],
    source = "unknown"
  } = {}) {
    const loaded =
      Boolean(object);

    const availableMethods =
      this.toArray(methods)
        .filter(
          method =>
            typeof object?.[method] ===
            "function"
        );

    const available =
      loaded &&
      availableMethods.length > 0;

    return {
      available,
      loaded,
      source:
        available
          ? source
          : "not-loaded",

      version:
        object?.version ||
        null,

      authorityLevel:
        object?.authorityLevel ||
        null,

      availableMethods,

      reason:
        available
          ? "Local authority is loaded and callable."
          : loaded
            ? "The authority object is loaded but exposes no recognized method."
            : "The local authority is not loaded."
    };
  },

  resolveRequestedAuthorities(
    authorityRequest = {}
  ) {
    const requested = [];

    const mappings = {
      constitution:
        "constitution",

      core:
        "characterCore",

      instincts:
        "characterInstincts",

      tasteProfile:
        "tasteProfile",

      preferences:
        "characterPreferences",

      preferenceResolver:
        "preferenceResolver",

      worldview:
        "worldview",

      relationshipStyle:
        "relationshipStyle"
    };

    for (
      const [
        requestKey,
        authorityKey
      ]
      of Object.entries(
        mappings
      )
    ) {
      if (
        authorityRequest
          ?.[requestKey]
          ?.requested ===
        true
      ) {
        requested.push(
          authorityKey
        );
      }
    }

    return this.mergeUnique(
      requested
    );
  },

  // ===================================================
  // Composer character normalization
  // ===================================================

  normalizeComposerCharacter(
    summary = {}
  ) {
    const context =
      summary.characterContext ||
      {};

    const reasoning =
      summary.characterReasoning ||
      {};

    const expression =
      summary.characterExpression ||
      {};

    const existing =
      summary.composerCharacter ||
      expression.composerCharacter ||
      expression
        .composerCharacterPacket ||
      {};

    const draft =
      String(
        existing.draft ||
        reasoning.userFacingDraft ||
        reasoning.deterministicDraft ||
        ""
      ).trim();

    const deterministicDraft =
      String(
        existing.deterministicDraft ||
        reasoning.deterministicDraft ||
        reasoning.userFacingDraft ||
        ""
      ).trim();

    const answerAvailable =
      existing.answerAvailable ===
        true ||
      reasoning.characterAnswerAvailable ===
        true;

    const guidanceAvailable =
      existing.guidanceAvailable ===
        true ||
      reasoning.characterGuidanceAvailable ===
        true ||
      Boolean(
        context.relationshipPacket
      );

    const enabled =
      existing.enabled === true ||
      context.characterUseAllowed ===
        true ||
      guidanceAvailable ||
      answerAvailable;

    return {
      ...existing,

      enabled,

      characterRelevant:
        existing.characterRelevant ===
          true ||
        expression.characterRelevant ===
          true ||
        context.characterUseAllowed ===
          true,

      relevant:
        existing.relevant === true ||
        existing.characterRelevant ===
          true ||
        expression.characterRelevant ===
          true ||
        context.characterUseAllowed ===
          true,

      answerAvailable,
      guidanceAvailable,

      source:
        existing.source ||
        this.source,

      version:
        existing.version ||
        summary.characterExpressionVersion ||
        window.AriCharacterExpressionEngine
          ?.version ||
        null,

      mode:
        existing.mode ||
        context.characterMode ||
        reasoning.request?.mode ||
        "silent",

      visibility:
        existing.visibility ||
        context.characterVisibility ||
        "background",

      expressionLevel:
        existing.expressionLevel ||
        expression.expressionLevel ||
        "background",

      focus:
        existing.focus ||
        reasoning.focus ||
        context.characterFocus ||
        null,

      subject:
        existing.subject ||
        reasoning.subject ||
        context.characterSubject ||
        null,

      preferredSource:
        existing.preferredSource ||
        reasoning.source ||
        context.preferredCharacterSource ||
        null,

      type:
        existing.type ||
        reasoning.type ||
        null,

      subtype:
        existing.subtype ||
        reasoning.subtype ||
        null,

      status:
        existing.status ||
        this.buildCompatibilityStatus(
          reasoning
        ),

      draft,
      deterministicDraft,

      answer:
        existing.answer ||
        reasoning.answer ||
        "",

      values:
        existing.values ||
        reasoning.values ||
        null,

      groundedMeaning:
        existing.groundedMeaning ||
        reasoning.groundedMeaning ||
        null,

      reasoning:
        existing.reasoning ||
        (
          answerAvailable
            ? reasoning
            : null
        ),

      grounding:
        existing.grounding ||
        this.buildCompatibilityGrounding(
          reasoning
        ),

      evidence:
        existing.evidence ||
        {
          context:
            context
              .characterContextEngineSource ||
            "ari-character-context-engine",

          reasoning:
            reasoning
              .characterReasoningSource ||
            null,

          selectedAuthority:
            reasoning.source ||
            context.preferredCharacterSource ||
            null,

          authorityChain:
            this.toArray(
              reasoning.authorityChain
            )
        },

      realization:
        this.normalizeRealization({
          existing:
            existing.realization ||
            {},

          reasoning
        }),

      relationship:
        existing.relationship ||
        context.relationshipPacket ||
        null,

      implementationDisclosure:
        existing
          .implementationDisclosure ||
        context
          .implementationDisclosure ||
        null,

      responseControl:
        this.mergeResponseControls(
          context.responseControl,
          reasoning.responseControl,
          existing.responseControl
        ),

      limits:
        existing.limits ||
        {
          maxCharacterSentences:
            context.characterHints
              ?.maxCharacterSentences ??
            context.characterBudget
              ?.maxCharacterSentences ??
            0,

          maxRelationshipSentences:
            context.characterHints
              ?.maxRelationshipSentences ??
            context.characterBudget
              ?.maxRelationshipSentences ??
            0,

          preserveUserTask:
            true,

          advisoryOnly:
            true
        },

      suppressors:
        existing.suppressors ||
        {
          hardSuppressed:
            context.characterBudget
              ?.hardSuppressed ===
            true,

          reason:
            context.characterBudget
              ?.reason ||
            context.characterReason ||
            null
        }
    };
  },

  normalizeRealization({
    existing = {},
    reasoning = {}
  } = {}) {
    const needsAIWriter =
      existing.needsAIWriter ===
        true ||
      reasoning.needsAIWriter ===
        true;

    return {
      ...existing,

      mode:
        existing.mode ||
        reasoning.realizationPolicy
          ?.mode ||
        (
          needsAIWriter
            ? "optional_ai_realization"
            : reasoning
                .characterAnswerAvailable ===
                true
              ? "local_candidate_preferred"
              : "guidance_only"
        ),

      needsAIWriter,

      aiWriterMode:
        existing.aiWriterMode ||
        reasoning.aiWriterMode ||
        null,

      aiInstruction:
        existing.aiInstruction ||
        reasoning.aiInstruction ||
        "",

      deterministicDraftAvailable:
        existing
          .deterministicDraftAvailable ===
          true ||
        Boolean(
          String(
            reasoning.deterministicDraft ||
            reasoning.userFacingDraft ||
            ""
          ).trim()
        ),

      preserveMeaning:
        existing.preserveMeaning !==
        false,

      preserveStatus:
        existing.preserveStatus !==
        false,

      preserveValue:
        existing.preserveValue ===
          true ||
        reasoning.realizationPolicy
          ?.preserveValue ===
          true,

      preservePosition:
        existing.preservePosition ===
          true ||
        reasoning.realizationPolicy
          ?.preservePosition ===
          true,

      preserveOpenStatus:
        existing.preserveOpenStatus ===
          true ||
        reasoning.realizationPolicy
          ?.preserveOpenStatus ===
          true,

      tentativeLanguageRequired:
        existing
          .tentativeLanguageRequired ===
          true ||
        reasoning.realizationPolicy
          ?.tentativeLanguageRequired ===
          true,

      mayVaryWording:
        existing.mayVaryWording !==
        false,

      mayAddFacts:
        false,

      mayAddMeaning:
        false,

      mayInventExperience:
        false,

      mayModifyCharacterAuthority:
        false,

      mayPromoteToCanonical:
        false
    };
  },

  buildCompatibilityStatus(
    reasoning = {}
  ) {
    const status =
      reasoning.status ||
      (
        reasoning.characterAnswerAvailable ===
        true
          ? "stable"
          : "background"
      );

    return {
      overall:
        status,

      preferenceStatus:
        reasoning.type ===
        "character_preference"
          ? status
          : null,

      worldviewStatus:
        [
          "character_worldview",
          "character_perspective"
        ].includes(
          reasoning.type
        )
          ? status
          : null,

      identityStatus:
        reasoning.type ===
        "character_identity"
          ? status
          : null,

      canonical:
        status ===
        "canonical",

      inferred:
        status ===
        "inferred",

      open:
        status ===
        "open",

      stable:
        status ===
        "stable",

      background:
        status ===
        "background"
    };
  },

  buildCompatibilityGrounding(
    reasoning = {}
  ) {
    const status =
      reasoning.status ||
      null;

    return {
      grounded:
        Boolean(
          reasoning.groundedMeaning ||
          reasoning.authorityPacket ||
          reasoning.source
        ),

      status,

      source:
        reasoning.source ||
        null,

      authorityChain:
        this.toArray(
          reasoning.authorityChain
        ),

      canonicalValue:
        status === "canonical"
          ? reasoning.answer ||
            null
          : null,

      inferredValue:
        status === "inferred"
          ? reasoning.answer ||
            null
          : null,

      openStatus:
        status === "open",

      worldviewPosition:
        [
          "character_worldview",
          "character_perspective"
        ].includes(
          reasoning.type
        )
          ? reasoning.answer ||
            null
          : null,

      identityStatement:
        reasoning.type ===
        "character_identity"
          ? reasoning.answer ||
            null
          : null
    };
  },

  // ===================================================
  // Character handoff
  // ===================================================

  buildCharacterHandoff(
    summary = {}
  ) {
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

    const responseControl =
      this.mergeResponseControls(
        context.responseControl,
        reasoning.responseControl,
        expression.responseControl,
        composerCharacter.responseControl
      );

    const realization =
      composerCharacter.realization ||
      {};

    const draft =
      String(
        composerCharacter.draft ||
        reasoning.userFacingDraft ||
        ""
      ).trim();

    const deterministicDraft =
      String(
        composerCharacter
          .deterministicDraft ||
        reasoning.deterministicDraft ||
        draft
      ).trim();

    const answerAvailable =
      composerCharacter
        .answerAvailable ===
        true ||
      reasoning
        .characterAnswerAvailable ===
        true;

    const guidanceAvailable =
      composerCharacter
        .guidanceAvailable ===
        true ||
      reasoning
        .characterGuidanceAvailable ===
        true ||
      Boolean(
        composerCharacter.relationship ||
        context.relationshipPacket
      );

    return {
      enabled:
        composerCharacter.enabled ===
          true ||
        answerAvailable ||
        guidanceAvailable,

      relevant:
        composerCharacter
          .characterRelevant ===
          true ||
        composerCharacter.relevant ===
          true ||
        expression.characterRelevant ===
          true ||
        context.characterUseAllowed ===
          true,

      answerAvailable,
      guidanceAvailable,

      visibility:
        composerCharacter.visibility ||
        context.characterVisibility ||
        "background",

      expressionLevel:
        composerCharacter
          .expressionLevel ||
        expression.expressionLevel ||
        "background",

      mode:
        composerCharacter.mode ||
        context.characterMode ||
        "silent",

      focus:
        composerCharacter.focus ||
        reasoning.focus ||
        context.characterFocus ||
        null,

      subject:
        composerCharacter.subject ||
        reasoning.subject ||
        context.characterSubject ||
        null,

      type:
        composerCharacter.type ||
        reasoning.type ||
        null,

      subtype:
        composerCharacter.subtype ||
        reasoning.subtype ||
        null,

      status:
        composerCharacter.status ||
        this.buildCompatibilityStatus(
          reasoning
        ),

      preferredCharacterSource:
        composerCharacter
          .preferredSource ||
        reasoning.source ||
        context.preferredCharacterSource ||
        null,

      draft,
      deterministicDraft,

      answer:
        composerCharacter.answer ||
        reasoning.answer ||
        null,

      values:
        composerCharacter.values ||
        reasoning.values ||
        null,

      groundedMeaning:
        composerCharacter
          .groundedMeaning ||
        reasoning.groundedMeaning ||
        null,

      grounding:
        composerCharacter.grounding ||
        null,

      evidence:
        composerCharacter.evidence ||
        null,

      relationship:
        composerCharacter.relationship ||
        context.relationshipPacket ||
        null,

      implementationDisclosure:
        composerCharacter
          .implementationDisclosure ||
        context
          .implementationDisclosure ||
        null,

      realization,

      needsAIWriter:
        realization.needsAIWriter ===
          true ||
        reasoning.needsAIWriter ===
          true,

      aiWriterMode:
        realization.aiWriterMode ||
        reasoning.aiWriterMode ||
        null,

      aiInstruction:
        realization.aiInstruction ||
        reasoning.aiInstruction ||
        "",

      composerCharacter,

      reasoning:
        reasoning
          .characterReasoningRan ===
          true
          ? reasoning
          : null,

      requiredBehaviors:
        responseControl
          .requiredBehaviors,

      forbiddenBehaviors:
        responseControl
          .forbiddenBehaviors,

      constraints:
        responseControl.constraints,

      confidence:
        reasoning.confidence ||
        null,

      confidenceScore:
        reasoning.confidenceScore ??
        null,

      authorityChain:
        this.toArray(
          composerCharacter
            .authorityChain ||
          reasoning.authorityChain
        ),

      authorityPacket:
        composerCharacter
          .authorityPacket ||
        reasoning.authorityPacket ||
        null,

      localAuthorities:
        summary.localCharacterAuthorities ||
        null,

      source:
        expression
          .characterExpressionRan ===
          true
          ? "character_expression"
          : reasoning
              .characterReasoningRan ===
              true
            ? "character_reasoning"
            : context
                .characterContextEngineRan ===
                true
              ? "character_context"
              : "none",

      boundaries:
        this.getAuthorityBoundaries()
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildCharacterStagePacket(
    summary = {}
  ) {
    const handoff =
      summary.characterHandoff ||
      {};

    const authorities =
      summary.localCharacterAuthorities ||
      {};

    const requestedMissing =
      this.toArray(
        authorities
          .missingRequestedAuthorities
      );

    return {
      ready:
        summary
          .characterContextEngineRan ===
          true ||
        summary
          .characterReasoningRan ===
          true ||
        summary
          .characterExpressionRan ===
          true,

      source:
        this.source,

      version:
        this.version,

      authorityLevel:
        this.authorityLevel,

      initialEligibility:
        summary
          .initialCharacterEligibility ||
        null,

      eligibility:
        summary.characterEligibility ||
        null,

      localCharacterAuthorities:
        authorities,

      context: {
        ran:
          summary
            .characterContextEngineRan ===
          true,

        ready:
          summary
            .characterContextEngineReady ===
          true,

        source:
          summary
            .characterContextEngineSource ||
          null,

        mode:
          summary.characterContext
            ?.characterMode ||
          "silent",

        focus:
          summary.characterContext
            ?.characterFocus ||
          null,

        authorityRequest:
          summary.characterContext
            ?.authorityRequest ||
          null,

        value:
          summary.characterContext ||
          null
      },

      reasoning: {
        ran:
          summary
            .characterReasoningRan ===
          true,

        ready:
          summary
            .characterReasoningReady ===
          true,

        source:
          summary
            .characterReasoningSource ||
          null,

        type:
          summary.characterReasoning
            ?.type ||
          null,

        subtype:
          summary.characterReasoning
            ?.subtype ||
          null,

        status:
          summary.characterReasoning
            ?.status ||
          null,

        answerAvailable:
          summary.characterReasoning
            ?.characterAnswerAvailable ===
          true,

        guidanceAvailable:
          summary.characterReasoning
            ?.characterGuidanceAvailable ===
          true,

        draft:
          summary.characterReasoning
            ?.userFacingDraft ||
          "",

        deterministicDraft:
          summary.characterReasoning
            ?.deterministicDraft ||
          "",

        needsAIWriter:
          summary.characterReasoning
            ?.needsAIWriter ===
          true,

        value:
          summary.characterReasoning ||
          null
      },

      expression: {
        ran:
          summary
            .characterExpressionRan ===
          true,

        ready:
          summary
            .characterExpressionReady ===
          true,

        source:
          summary
            .characterExpressionSource ||
          null,

        relevant:
          summary.characterExpression
            ?.characterRelevant ===
          true,

        expressionLevel:
          summary.characterExpression
            ?.expressionLevel ||
          "background",

        composerCharacterReady:
          Boolean(
            summary.composerCharacter
          ),

        value:
          summary.characterExpression ||
          null
      },

      handoff,

      responseControl: {
        enabled:
          handoff.enabled === true,

        relevant:
          handoff.relevant === true,

        answerAvailable:
          handoff.answerAvailable ===
          true,

        guidanceAvailable:
          handoff.guidanceAvailable ===
          true,

        visibility:
          handoff.visibility ||
          "background",

        expressionLevel:
          handoff.expressionLevel ||
          "background",

        mode:
          handoff.mode ||
          "silent",

        focus:
          handoff.focus ||
          null,

        subject:
          handoff.subject ||
          null,

        type:
          handoff.type ||
          null,

        subtype:
          handoff.subtype ||
          null,

        status:
          handoff.status ||
          null,

        draft:
          handoff.draft ||
          "",

        deterministicDraft:
          handoff.deterministicDraft ||
          "",

        needsAIWriter:
          handoff.needsAIWriter ===
          true,

        aiWriterMode:
          handoff.aiWriterMode ||
          null,

        requiredBehaviors:
          handoff.requiredBehaviors ||
          [],

        forbiddenBehaviors:
          handoff.forbiddenBehaviors ||
          [],

        constraints:
          handoff.constraints ||
          []
      },

      quality: {
        contextResolved:
          summary
            .characterContextEngineRan ===
          true,

        contextReady:
          summary
            .characterContextEngineReady ===
          true,

        reasoningRequired:
          summary.characterEligibility
            ?.runReasoning ===
          true,

        reasoningRan:
          summary
            .characterReasoningRan ===
          true,

        reasoningReady:
          summary
            .characterReasoningReady ===
          true,

        expressionRequired:
          summary.characterEligibility
            ?.runExpression ===
          true,

        expressionRan:
          summary
            .characterExpressionRan ===
          true,

        expressionReady:
          summary
            .characterExpressionReady ===
          true,

        answerAvailable:
          handoff.answerAvailable ===
          true,

        guidanceAvailable:
          handoff.guidanceAvailable ===
          true,

        draftAvailable:
          Boolean(
            String(
              handoff.draft ||
              ""
            ).trim()
          ),

        deterministicDraftAvailable:
          Boolean(
            String(
              handoff
                .deterministicDraft ||
              ""
            ).trim()
          ),

        characterKnowledgeAvailable:
          authorities
            .characterKnowledgeAvailable ===
          true,

        requestedAuthoritiesSatisfied:
          authorities
            .requestedAuthoritiesSatisfied ===
          true,

        missingRequestedAuthorities:
          requestedMissing,

        grounded:
          handoff.grounding
            ?.grounded ===
          true,

        statusPreserved:
          Boolean(
            handoff.status
          )
      },

      authority: {
        canRunCharacterContext:
          true,

        canInspectLocalAuthorities:
          true,

        canRunCharacterReasoning:
          true,

        canRunCharacterExpression:
          true,

        canNormalizeCharacterHandoff:
          true,

        canRegisterCharacterDraft:
          true,

        canMergeCharacterResponseControls:
          true,

        canReadConstitution:
          true,

        canReadCharacterCore:
          true,

        canReadCharacterInstincts:
          true,

        canReadTasteProfile:
          true,

        canReadCharacterPreferences:
          true,

        canCallPreferenceResolver:
          true,

        canReadWorldview:
          true,

        canReadRelationshipStyle:
          true,

        canRetrieveCharacterFromSupabase:
          false,

        canPersistCharacterToSupabase:
          false,

        canChooseFinalRoute:
          false,

        canOverrideSemanticMeaning:
          false,

        canOverrideSituationContract:
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
          "local_character_subsystem_orchestration_and_downstream_handoff"
      }
    };
  },

  // ===================================================
  // Stage input
  // ===================================================

  buildCharacterStageInput(
    summary = {}
  ) {
    const context =
      summary.characterContext ||
      {};

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

      executive:
        summary.executivePacket ||
        null,

      routing:
        summary.routingContract ||
        null,

      deliberation:
        summary.deliberationPacket ||
        null,

      situationContract:
        summary.situationContract ||
        summary.situationStagePacket
          ?.contract ||
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
          context.characterUseAllowed ===
          true ||
        summary.characterUseAllowed !==
          false,

        visibility:
          context.characterVisibility ||
          summary.characterVisibility ||
          "background",

        mode:
          context.characterMode ||
          summary.characterMode ||
          "silent",

        focus:
          context.characterFocus ||
          summary.characterFocus ||
          null,

        subject:
          context.characterSubject ||
          null,

        preferredSource:
          context.preferredCharacterSource ||
          null,

        hints:
          context.characterHints ||
          summary.characterHints ||
          {},

        budget:
          context.characterBudget ||
          null,

        authorityRequest:
          context.authorityRequest ||
          null,

        implementationDisclosure:
          context
            .implementationDisclosure ||
          null,

        relationship:
          context.relationshipPacket ||
          null
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
  // Response controls
  // ===================================================

  mergeResponseControls(
    ...controls
  ) {
    return {
      requiredBehaviors:
        this.mergeUnique(
          ...controls.map(
            control =>
              control
                ?.requiredBehaviors
          )
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          ...controls.map(
            control =>
              control
                ?.forbiddenBehaviors
          )
        ),

      constraints:
        this.mergeUnique(
          ...controls.map(
            control =>
              control?.constraints
          )
        )
    };
  },

  // ===================================================
  // Fallbacks
  // ===================================================

  buildContextFallback(
    reason = "",
    source = "not-loaded"
  ) {
    return {
      characterContextEngineRan:
        false,

      characterContextEngineReady:
        false,

      characterContextEngineSource:
        source,

      characterUseAllowed:
        false,

      characterVisibility:
        "background",

      characterMode:
        "silent",

      characterFocus:
        null,

      characterSubject:
        null,

      preferredCharacterSource:
        null,

      characterReason:
        reason,

      characterBudget: {
        hardSuppressed:
          false,

        allowPresenceOnly:
          false,

        maxCharacterSentences:
          0,

        maxRelationshipSentences:
          0
      },

      characterHints:
        {},

      authorityRequest:
        {},

      relationshipPacket:
        null,

      responseControl: {
        requiredBehaviors: [],
        forbiddenBehaviors: [],
        constraints: []
      }
    };
  },

  buildReasoningFallback(
    reason = "",
    source = "not-loaded"
  ) {
    return {
      characterReasoningRan:
        false,

      characterReasoningReady:
        false,

      characterReasoningSource:
        source,

      characterAnswerAvailable:
        false,

      characterGuidanceAvailable:
        false,

      type:
        "no_character_answer",

      status:
        "unavailable",

      userFacingDraft:
        "",

      deterministicDraft:
        "",

      needsAIWriter:
        false,

      aiWriterMode:
        null,

      aiInstruction:
        "",

      reason,

      responseControl: {
        requiredBehaviors: [],
        forbiddenBehaviors: [],
        constraints: []
      }
    };
  },

  buildExpressionFallback(
    reason = "",
    source = "not-loaded"
  ) {
    return {
      characterExpressionRan:
        false,

      characterExpressionReady:
        false,

      characterExpressionSource:
        source,

      characterRelevant:
        false,

      expressionLevel:
        "none",

      composerCharacter:
        null,

      composerCharacterPacket:
        null,

      reason
    };
  },

  // ===================================================
  // Authority boundaries
  // ===================================================

  getAuthorityBoundaries() {
    return {
      localOnly:
        true,

      advisoryOnly:
        true,

      orchestrationAuthority:
        true,

      mayRunCharacterContext:
        true,

      mayInspectLocalAuthorities:
        true,

      mayRunCharacterReasoning:
        true,

      mayRunCharacterExpression:
        true,

      mayNormalizeComposerCharacter:
        true,

      mayBuildCharacterHandoff:
        true,

      mayRegisterCharacterDraft:
        true,

      mayMergeResponseControls:
        true,

      mayResolvePreference:
        false,

      mayCreateCanonicalPreference:
        false,

      mayPromoteInferenceToCanonical:
        false,

      mayCreateWorldviewPosition:
        false,

      mayInventCharacterMeaning:
        false,

      mayClassifyWholeConversation:
        false,

      mayOverrideSemanticMeaning:
        false,

      mayOverrideConversationFunction:
        false,

      mayOverrideSituationContract:
        false,

      mayOverrideSafety:
        false,

      mayOverrideFacts:
        false,

      mayOverrideUserIntent:
        false,

      mayRetrieveUserMemory:
        false,

      mayStoreUserMemory:
        false,

      mayAccessSupabase:
        false,

      maySelectFinalDraft:
        false,

      mayWriteFinalResponse:
        false,

      mayExecuteTools:
        false,

      role:
        "local_character_subsystem_orchestration"
    };
  },

  cannotSet() {
    return [
      "primaryLane",
      "primaryLaneSuggestion",
      "triagePrimaryLane",
      "situationContractPrimary",
      "routingDecision",
      "conversationFunction",
      "semanticMeaning",
      "riskLevel",
      "safetyDisposition",
      "override",
      "responseShape",
      "blockedLanes",
      "deferredLanes",
      "finalResponse",
      "selectedDraft",
      "recommendation",
      "knownFacts",
      "inferredFacts",
      "medicalEscalation",
      "legalAdvice",
      "financialAdvice",
      "diagnosis",
      "toolExecutionClaim",
      "developerIntent",
      "githubEdit",
      "memorySaveDecision",
      "canonicalPreference",
      "worldviewPosition"
    ];
  },

  // ===================================================
  // Validation
  // ===================================================

  validate() {
    const errors = [];
    const warnings = [];

    const boundaries =
      this.getAuthorityBoundaries();

    if (
      boundaries
        .mayResolvePreference ===
      true
    ) {
      errors.push(
        "character_stage_may_not_resolve_preferences"
      );
    }

    if (
      boundaries
        .mayCreateCanonicalPreference ===
      true
    ) {
      errors.push(
        "character_stage_may_not_create_canonical_preferences"
      );
    }

    if (
      boundaries
        .mayPromoteInferenceToCanonical ===
      true
    ) {
      errors.push(
        "character_stage_may_not_promote_inference"
      );
    }

    if (
      boundaries
        .mayCreateWorldviewPosition ===
      true
    ) {
      errors.push(
        "character_stage_may_not_create_worldview_positions"
      );
    }

    if (
      boundaries
        .mayOverrideSemanticMeaning ===
      true
    ) {
      errors.push(
        "character_stage_may_not_override_semantic_meaning"
      );
    }

    if (
      boundaries
        .mayOverrideSituationContract ===
      true
    ) {
      errors.push(
        "character_stage_may_not_override_situation_contract"
      );
    }

    if (
      boundaries
        .mayAccessSupabase ===
      true
    ) {
      errors.push(
        "character_stage_may_not_access_supabase"
      );
    }

    if (
      boundaries
        .maySelectFinalDraft ===
      true
    ) {
      errors.push(
        "character_stage_may_not_select_final_draft"
      );
    }

    if (
      boundaries
        .mayWriteFinalResponse ===
      true
    ) {
      errors.push(
        "character_stage_may_not_write_final_response"
      );
    }

    const requiredAuthorities = [
      [
        "AriCharacterContextEngine",
        window.AriCharacterContextEngine
      ],
      [
        "AriCharacterReasoningEngine",
        window.AriCharacterReasoningEngine
      ],
      [
        "AriCharacterExpressionEngine",
        window.AriCharacterExpressionEngine
      ]
    ];

    for (
      const [
        name,
        authority
      ]
      of requiredAuthorities
    ) {
      if (!authority) {
        warnings.push(
          `${name}_not_loaded`
        );
      }
    }

    return {
      valid:
        errors.length === 0,

      source:
        "ari-character-stage-validation",

      version:
        this.version,

      errors,
      warnings,

      checks: {
        preferenceResolutionSeparated:
          boundaries
            .mayResolvePreference ===
          false,

        canonicalCreationDisabled:
          boundaries
            .mayCreateCanonicalPreference ===
          false,

        inferencePromotionDisabled:
          boundaries
            .mayPromoteInferenceToCanonical ===
          false,

        worldviewCreationDisabled:
          boundaries
            .mayCreateWorldviewPosition ===
          false,

        semanticOverrideDisabled:
          boundaries
            .mayOverrideSemanticMeaning ===
          false,

        situationContractOverrideDisabled:
          boundaries
            .mayOverrideSituationContract ===
          false,

        supabaseDisabled:
          boundaries
            .mayAccessSupabase ===
          false,

        finalDraftSelectionDisabled:
          boundaries
            .maySelectFinalDraft ===
          false,

        finalResponseAuthorityDisabled:
          boundaries
            .mayWriteFinalResponse ===
          false,

        contextEngineAvailable:
          Boolean(
            window.AriCharacterContextEngine
          ),

        reasoningEngineAvailable:
          Boolean(
            window.AriCharacterReasoningEngine
          ),

        expressionEngineAvailable:
          Boolean(
            window.AriCharacterExpressionEngine
          )
      }
    };
  },

  // ===================================================
  // Utilities
  // ===================================================

  toArray(value) {
    if (Array.isArray(value)) {
      return value.filter(
        item =>
          item !== undefined &&
          item !== null &&
          item !== ""
      );
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

  unique(values = []) {
    const output = [];
    const seen = new Set();

    for (
      const value
      of this.toArray(values)
    ) {
      const key =
        typeof value === "string"
          ? value
              .trim()
              .toLowerCase()
          : JSON.stringify(value);

      if (
        !key ||
        seen.has(key)
      ) {
        continue;
      }

      seen.add(key);
      output.push(value);
    }

    return output;
  },

  mergeUnique(...values) {
    return this.unique(
      values.flatMap(
        value =>
          this.toArray(value)
      )
    );
  }
};

console.log(
  "ARI CHARACTER STAGE LOADED:",
  window.AriCharacterStage?.version,
  window.AriCharacterStage
    ?.validate?.().valid === true
    ? "READY"
    : "INVALID"
);