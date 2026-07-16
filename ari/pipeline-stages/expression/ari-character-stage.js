// ari/pipeline-stages/expression/ari-character-stage.js
// Ari Character Stage
//
// Purpose:
// Orchestrate Ari's local Character subsystem and produce one focused,
// authoritative Character Handoff for downstream expression stages.
//
// V3.0.0 — Focused Character Handoff / No Downstream Reconstruction
//
// Architectural flow:
//
// Character Context Engine
//      ↓
// Requested Local Character Authorities
//      ↓
// Character Reasoning Engine
//      ↓
// Character Expression Engine
//      ↓
// Focused Character Handoff
//      ↓
// Composer Bridge
//
// Responsibilities:
// - Run Character Context for eligible turns.
// - Use Character Context to determine focused Character work.
// - Inspect only the local authorities requested by Character Context.
// - Run Character Reasoning when focused reasoning is authorized.
// - Run Character Expression when natural realization or guidance is needed.
// - Preserve the authoritative output of Character Reasoning and Expression.
// - Produce one normalized focused Character Handoff.
// - Merge authorized Character response constraints into stage-level controls.
// - Preserve deterministic Character wording when provided.
// - Preserve AI-realization instructions when local wording is insufficient.
//
// Non-responsibilities:
// - Does not classify the conversation.
// - Does not reinterpret semantic meaning.
// - Does not change the Conversation Function.
// - Does not change the Situation Contract.
// - Does not determine safety severity.
// - Does not independently resolve Character preferences.
// - Does not independently create Character identity or worldview positions.
// - Does not combine broad Character collections into a new answer.
// - Does not create response plans.
// - Does not choose whether Blueprint Writer runs.
// - Does not choose whether AI Writer ultimately runs.
// - Does not register response candidates.
// - Does not select the final candidate.
// - Does not write the final response.
// - Does not retrieve or store user memory.
// - Does not access Supabase.
// - Does not execute tools.
// - Does not persist runtime state.

window.Ari = window.Ari || {};

window.AriCharacterStage = {
  version: "3.0.0",
  schemaVersion: "3.0.0",
  source: "ari-character-stage",
  authorityLevel: "focused_character_subsystem_orchestration_authority",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

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
    // =================================================

    const initialEligibility =
      this.resolveInitialEligibility(
        state
      );

    state = {
      ...state,

      initialCharacterEligibility:
        initialEligibility,

      characterEligibility:
        initialEligibility,

      shouldRunCharacterContext:
        initialEligibility.runContext,

      shouldRunCharacterReasoning:
        false,

      shouldRunCharacterExpression:
        false
    };

    // =================================================
    // 2. Character Context
    // =================================================

    mark(
      "before characterContext"
    );

    const contextResult =
      initialEligibility.runContext ===
        true
        ? await runEngine(
            window
              .AriCharacterContextEngine,

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
            initialEligibility.reason,
            "skipped-by-expression-eligibility"
          );

    const characterContext =
      this.normalizeContextResult(
        contextResult
      );

    state = {
      ...state,

      ...contextResult,

      characterContext,

      characterContextEngineRan:
        characterContext.ran,

      characterContextEngineReady:
        characterContext.ready,

      characterContextEngineSource:
        characterContext.source
    };

    mark(
      "after characterContext"
    );

    // =================================================
    // 3. Post-context eligibility
    // =================================================

    const resolvedEligibility =
      this.resolvePostContextEligibility({
        summary:
          state,

        initialEligibility
      });

    state = {
      ...state,

      resolvedCharacterEligibility:
        resolvedEligibility,

      characterEligibility:
        resolvedEligibility,

      shouldRunCharacterContext:
        resolvedEligibility.runContext,

      shouldRunCharacterReasoning:
        resolvedEligibility.runReasoning,

      shouldRunCharacterExpression:
        resolvedEligibility.runExpression
    };

    // =================================================
    // 4. Requested local authorities
    // =================================================

    mark(
      "before localCharacterAuthorities"
    );

    const localAuthorities =
      this.inspectRequestedAuthorities(
        characterContext
          .authorityRequest
      );

    state = {
      ...state,

      localCharacterAuthorities:
        localAuthorities,

      localCharacterAuthoritiesRan:
        true,

      characterKnowledge:
        localAuthorities,

      characterKnowledgeAvailable:
        localAuthorities
          .characterKnowledgeAvailable ===
        true,

      characterAuthorityRequestSatisfied:
        localAuthorities
          .requestedAuthoritiesSatisfied ===
        true
    };

    mark(
      "after localCharacterAuthorities"
    );

    // =================================================
    // 5. Character Reasoning
    // =================================================

    mark(
      "before characterReasoning"
    );

    const reasoningResult =
      resolvedEligibility.runReasoning ===
        true
        ? await runEngine(
            window
              .AriCharacterReasoningEngine,

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

              characterContext,

              localCharacterAuthorities:
                localAuthorities
            }
          )
        : this.buildReasoningFallback(
            resolvedEligibility
              .reasoningSkipReason,

            "skipped-by-expression-eligibility"
          );

    const characterReasoning =
      this.normalizeReasoningResult(
        reasoningResult
      );

    state = {
      ...state,

      ...reasoningResult,

      characterReasoning,

      characterReasoningRan:
        characterReasoning.ran,

      characterReasoningReady:
        characterReasoning.ready,

      characterReasoningSource:
        characterReasoning.source
    };

    mark(
      "after characterReasoning"
    );

    // =================================================
    // 6. Expression eligibility reconciliation
    //
    // Reasoning may determine that deterministic wording is
    // sufficient, or that natural AI realization is needed.
    // Character Expression still owns local presentation
    // guidance, but not final response generation.
    // =================================================

    const expressionEligibility =
      this.resolveExpressionEligibility({
        summary:
          state,

        resolvedEligibility,

        characterContext,

        characterReasoning
      });

    state = {
      ...state,

      characterExpressionEligibility:
        expressionEligibility,

      shouldRunCharacterExpression:
        expressionEligibility.runExpression
    };

    // =================================================
    // 7. Character Expression
    // =================================================

    mark(
      "before characterExpression"
    );

    const expressionResult =
      expressionEligibility
        .runExpression ===
        true
        ? await runEngine(
            window
              .AriCharacterExpressionEngine,

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

              characterContext,

              characterReasoning,

              localCharacterAuthorities:
                localAuthorities
            }
          )
        : this.buildExpressionFallback(
            expressionEligibility.reason,
            "skipped-by-expression-eligibility"
          );

    const characterExpression =
      this.normalizeExpressionResult(
        expressionResult
      );

    state = {
      ...state,

      ...expressionResult,

      characterExpression,

      characterExpressionRan:
        characterExpression.ran,

      characterExpressionReady:
        characterExpression.ready,

      characterExpressionSource:
        characterExpression.source
    };

    mark(
      "after characterExpression"
    );

    // =================================================
    // 8. Focused Character Handoff
    //
    // This is the only downstream Character authority.
    // Composer Bridge must not reconstruct a second answer
    // from Context, Reasoning, or Expression separately.
    // =================================================

    const characterHandoff =
      this.buildFocusedCharacterHandoff({
        characterContext,
        localAuthorities,
        characterReasoning,
        characterExpression,
        resolvedEligibility,
        expressionEligibility
      });

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
          .candidateAvailable ===
          true
          ? characterHandoff
              .deterministicDraft
          : null,

      characterDeterministicDraft:
        characterHandoff
          .deterministicDraft ||
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
            .responseControl
            .requiredBehaviors
        ),

      responseAvoid:
        this.mergeUnique(
          state.responseAvoid,
          characterHandoff
            .responseControl
            .forbiddenBehaviors
        ),

      responseConstraints:
        this.mergeUnique(
          state.responseConstraints,
          characterHandoff
            .responseControl
            .constraints
        )
    };

    // =================================================
    // 9. Stage packet
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

  /* =====================================================
     INITIAL ELIGIBILITY
  ===================================================== */

  resolveInitialEligibility(
    summary = {}
  ) {
    const developerLocked =
      summary.developerResponseLocked ===
      true;

    const responseLocked =
      summary.responseLocked ===
      true;

    const characterGloballyAllowed =
      summary.characterUseAllowed !==
      false;

    const contextEngineAvailable =
      this.hasCallableMethod(
        window.AriCharacterContextEngine,
        [
          "create",
          "build"
        ]
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
              : "character_context_inspection_allowed"
    };
  },

  resolveCharacterEligibility(
    summary = {}
  ) {
    return this.resolveInitialEligibility(
      summary
    );
  },

  /* =====================================================
     POST-CONTEXT ELIGIBILITY
  ===================================================== */

  resolvePostContextEligibility({
    summary = {},
    initialEligibility = {}
  } = {}) {
    const context =
      summary.characterContext ||
      this.normalizeContextResult();

    const safetyStopped =
      summary.safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      summary
        .safetyShouldStopNormalResponse ===
        true;

    const hardSuppressed =
      context.budget
        .hardSuppressed ===
      true;

    const reasoningMode =
      this.isReasoningMode(
        context.mode
      );

    const hasFocusedRequest =
      Boolean(
        context.focus ||
        context.subject ||
        context
          .requestedAuthorities
          .length
      );

    const runContext =
      initialEligibility.runContext ===
      true;

    const runReasoning =
      runContext &&
      context.ready &&
      context.useAllowed &&
      !safetyStopped &&
      !hardSuppressed &&
      (
        reasoningMode ||
        hasFocusedRequest
      );

    const relationshipGuidanceAvailable =
      Boolean(
        context.relationship
      );

    const runExpression =
      runContext &&
      context.ready &&
      (
        runReasoning ||
        context.guidanceRequested ||
        relationshipGuidanceAvailable
      );

    return {
      ...initialEligibility,

      phase:
        "post-context",

      runContext,

      runReasoning,

      runExpression,

      safetyStopped,

      hardSuppressed,

      contextReady:
        context.ready,

      contextUseAllowed:
        context.useAllowed,

      reasoningMode,

      hasFocusedRequest,

      relationshipGuidanceAvailable,

      resolvedCharacterMode:
        context.mode,

      resolvedCharacterFocus:
        context.focus,

      reasoningSkipReason:
        safetyStopped
          ? "Safety stopped ordinary Character reasoning."
          : hardSuppressed
            ? "Character Context hard-suppressed Character reasoning."
            : !context.ready
              ? "Character Context was not ready."
              : !context.useAllowed
                ? "Character Context did not authorize Character reasoning."
                : !reasoningMode &&
                    !hasFocusedRequest
                  ? "No focused Character reasoning was requested."
                  : "Character reasoning was not required.",

      expressionSkipReason:
        !context.ready
          ? "Character Context was not ready."
          : !runReasoning &&
              !context.guidanceRequested &&
              !relationshipGuidanceAvailable
            ? "No Character expression or relationship guidance was required."
            : "Character Expression was not required.",

      source:
        "ari-character-stage-post-context-eligibility",

      reason:
        runReasoning
          ? "focused_character_reasoning_authorized"
          : runExpression
            ? "character_guidance_expression_authorized"
            : "character_background_only"
    };
  },

  isReasoningMode(
    mode = ""
  ) {
    return [
      "canonical_preference_answer",
      "stable_preference_answer",
      "stable_or_inferred_preference_answer",
      "ari_self_disclosure",
      "ari_implementation_disclosure",
      "worldview_answer",
      "ari_perspective",
      "character_identity_answer",
      "character_value_answer"
    ].includes(
      this.normalizeIdentifier(
        mode
      )
    );
  },

  /* =====================================================
     EXPRESSION ELIGIBILITY
  ===================================================== */

  resolveExpressionEligibility({
    resolvedEligibility = {},
    characterContext = {},
    characterReasoning = {}
  } = {}) {
    if (
      resolvedEligibility.runExpression !==
      true
    ) {
      return {
        runExpression:
          false,

        source:
          "ari-character-stage-expression-eligibility",

        reason:
          resolvedEligibility
            .expressionSkipReason ||
          "character_expression_not_authorized"
      };
    }

    const answerAvailable =
      characterReasoning
        .answerAvailable ===
      true;

    const guidanceAvailable =
      characterReasoning
        .guidanceAvailable ===
        true ||
      characterContext
        .guidanceRequested ===
        true ||
      Boolean(
        characterContext.relationship
      );

    const deterministicDraftAvailable =
      Boolean(
        characterReasoning
          .deterministicDraft
      );

    const needsAIWriter =
      characterReasoning
        .needsAIWriter ===
      true;

    const runExpression =
      answerAvailable ||
      guidanceAvailable ||
      deterministicDraftAvailable ||
      needsAIWriter;

    return {
      runExpression,

      answerAvailable,

      guidanceAvailable,

      deterministicDraftAvailable,

      needsAIWriter,

      source:
        "ari-character-stage-expression-eligibility",

      reason:
        runExpression
          ? "focused_character_expression_required"
          : "no_character_material_to_express"
    };
  },

  /* =====================================================
     CONTEXT NORMALIZATION
  ===================================================== */

  normalizeContextResult(
    result = {}
  ) {
    const source =
      result &&
      typeof result ===
        "object"
        ? result
        : {};

    const authorityRequest =
      source.authorityRequest &&
      typeof source
        .authorityRequest ===
        "object"
        ? source.authorityRequest
        : {};

    const requestedAuthorities =
      this.resolveRequestedAuthorities(
        authorityRequest
      );

    return {
      schema:
        "ari_character_context",

      schemaVersion:
        this.schemaVersion,

      ran:
        source
          .characterContextEngineRan ===
          true,

      ready:
        source
          .characterContextEngineReady ===
          true ||
        source.ready ===
          true,

      source:
        source
          .characterContextEngineSource ||
        source.source ||
        "unknown",

      useAllowed:
        source.characterUseAllowed ===
        true,

      relevant:
        source.characterRelevant ===
          true ||
        source.characterUseAllowed ===
          true,

      guidanceRequested:
        source.characterGuidanceRequested ===
          true ||
        source.guidanceRequested ===
          true,

      mode:
        source.characterMode ||
        source.mode ||
        "silent",

      visibility:
        source.characterVisibility ||
        source.visibility ||
        "background",

      focus:
        source.characterFocus ||
        source.focus ||
        null,

      subject:
        source.characterSubject ||
        source.subject ||
        null,

      preferredSource:
        source
          .preferredCharacterSource ||
        source.preferredSource ||
        null,

      reason:
        source.characterReason ||
        source.reason ||
        null,

      hints:
        source.characterHints ||
        source.hints ||
        {},

      budget:
        this.normalizeBudget(
          source.characterBudget ||
          source.budget
        ),

      authorityRequest,

      requestedAuthorities,

      relationship:
        source.relationshipPacket ||
        source.relationship ||
        null,

      implementationDisclosure:
        source
          .implementationDisclosure ||
        null,

      responseControl:
        this.normalizeResponseControl(
          source.responseControl
        ),

      raw:
        source,

      authority:
        "character_context_classification_only"
    };
  },

  normalizeBudget(
    budget = {}
  ) {
    return {
      hardSuppressed:
        budget?.hardSuppressed ===
        true,

      allowPresenceOnly:
        budget?.allowPresenceOnly ===
        true,

      maxCharacterSentences:
        this.numberOr(
          budget
            ?.maxCharacterSentences,
          0
        ),

      maxRelationshipSentences:
        this.numberOr(
          budget
            ?.maxRelationshipSentences,
          0
        ),

      reason:
        budget?.reason ||
        null
    };
  },

  /* =====================================================
     LOCAL AUTHORITY INSPECTION
  ===================================================== */

  inspectRequestedAuthorities(
    authorityRequest = {}
  ) {
    const definitions =
      this.getAuthorityDefinitions();

    const requested =
      this.resolveRequestedAuthorities(
        authorityRequest
      );

    const inspectKeys =
      requested.length
        ? requested
        : [];

    const authorities = {};

    Object.entries(
      definitions
    ).forEach(
      ([
        key,
        definition
      ]) => {
        const wasRequested =
          inspectKeys.includes(
            key
          );

        authorities[key] =
          wasRequested
            ? this.inspectAuthority(
                definition
              )
            : {
                key,

                requested:
                  false,

                inspected:
                  false,

                available:
                  false,

                loaded:
                  Boolean(
                    definition.object
                  ),

                source:
                  definition.source,

                version:
                  definition.object
                    ?.version ||
                  null,

                availableMethods:
                  [],

                reason:
                  "authority_not_requested"
              };
      }
    );

    const missingRequested =
      requested.filter(
        key =>
          authorities[key]
            ?.available !==
          true
      );

    const availableRequested =
      requested.filter(
        key =>
          authorities[key]
            ?.available ===
          true
      );

    return {
      schema:
        "ari_local_character_authorities",

      schemaVersion:
        this.schemaVersion,

      localCharacterAuthoritiesRan:
        true,

      source:
        "ari-character-stage-local-authority-inspection",

      localOnly:
        true,

      supabaseUsed:
        false,

      requestedAuthorities:
        requested,

      inspectedAuthorities:
        inspectKeys,

      availableRequestedAuthorities:
        availableRequested,

      missingRequestedAuthorities:
        missingRequested,

      requestedAuthoritiesSatisfied:
        missingRequested.length ===
        0,

      characterKnowledgeAvailable:
        availableRequested.length >
        0,

      authorities,

      reason:
        !requested.length
          ? "no_local_character_authority_requested"
          : missingRequested.length
            ? "one_or_more_requested_authorities_unavailable"
            : "all_requested_character_authorities_available",

      authority:
        "local_authority_availability_inspection_only"
    };
  },

  getAuthorityDefinitions() {
    return {
      constitution: {
        key:
          "constitution",

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
        key:
          "characterCore",

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
        key:
          "characterInstincts",

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
        key:
          "tasteProfile",

        object:
          window
            .AriCharacterTasteProfile,

        methods: [
          "getTasteProfile",
          "resolve",
          "build"
        ],

        source:
          "ari-character-taste-profile"
      },

      characterPreferences: {
        key:
          "characterPreferences",

        object:
          window
            .AriCharacterPreferences,

        methods: [
          "getPreferences",
          "getPreference",
          "hasPreference"
        ],

        source:
          "ari-character-preferences"
      },

      preferenceResolver: {
        key:
          "preferenceResolver",

        object:
          window
            .AriCharacterPreferenceResolver,

        methods: [
          "resolve",
          "create",
          "build"
        ],

        source:
          "ari-character-preference-resolver"
      },

      worldview: {
        key:
          "worldview",

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
        key:
          "relationshipStyle",

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
  },

  inspectAuthority(
    definition = {}
  ) {
    const loaded =
      Boolean(
        definition.object
      );

    const availableMethods =
      this.toArray(
        definition.methods
      ).filter(
        method =>
          typeof definition
            .object?.[method] ===
          "function"
      );

    return {
      key:
        definition.key,

      requested:
        true,

      inspected:
        true,

      available:
        loaded &&
        availableMethods.length >
          0,

      loaded,

      source:
        definition.source,

      version:
        definition.object
          ?.version ||
        null,

      authorityLevel:
        definition.object
          ?.authorityLevel ||
        null,

      availableMethods,

      reason:
        !loaded
          ? "authority_not_loaded"
          : !availableMethods.length
            ? "authority_has_no_supported_method"
            : "authority_available"
    };
  },

  resolveRequestedAuthorities(
    authorityRequest = {}
  ) {
    const mappings = {
      constitution:
        "constitution",

      core:
        "characterCore",

      characterCore:
        "characterCore",

      instincts:
        "characterInstincts",

      characterInstincts:
        "characterInstincts",

      taste:
        "tasteProfile",

      tasteProfile:
        "tasteProfile",

      preferences:
        "characterPreferences",

      characterPreferences:
        "characterPreferences",

      preferenceResolver:
        "preferenceResolver",

      worldview:
        "worldview",

      relationshipStyle:
        "relationshipStyle"
    };

    const requested = [];

    Object.entries(
      mappings
    ).forEach(
      ([
        requestKey,
        authorityKey
      ]) => {
        const value =
          authorityRequest
            ?.[requestKey];

        if (
          value === true ||
          value?.requested ===
            true
        ) {
          requested.push(
            authorityKey
          );
        }
      }
    );

    this.toArray(
      authorityRequest.requestedAuthorities
    ).forEach(
      value => {
        const normalized =
          mappings[value] ||
          mappings[
            this.normalizeIdentifier(
              value
            )
          ] ||
          value;

        if (normalized) {
          requested.push(
            normalized
          );
        }
      }
    );

    return this.uniqueStrings(
      requested
    );
  },

  /* =====================================================
     REASONING NORMALIZATION
  ===================================================== */

  normalizeReasoningResult(
    result = {}
  ) {
    const source =
      result &&
      typeof result ===
        "object"
        ? result
        : {};

    const answerAvailable =
      source
        .characterAnswerAvailable ===
        true ||
      source.answerAvailable ===
        true;

    const guidanceAvailable =
      source
        .characterGuidanceAvailable ===
        true ||
      source.guidanceAvailable ===
        true;

    const deterministicDraft =
      this.cleanText(
        source.deterministicDraft ||
        source.userFacingDraft ||
        source.draft ||
        ""
      );

    const realization =
      this.normalizeRealization(
        source.realizationPolicy ||
        source.realization ||
        {
          needsAIWriter:
            source.needsAIWriter,

          aiWriterMode:
            source.aiWriterMode,

          aiInstruction:
            source.aiInstruction
        }
      );

    const status =
      this.normalizeStatus({
        value:
          source.status,

        type:
          source.type
      });

    const grounding =
      this.normalizeGrounding({
        grounding:
          source.grounding,

        source,

        status
      });

    return {
      schema:
        "ari_character_reasoning_result",

      schemaVersion:
        this.schemaVersion,

      ran:
        source
          .characterReasoningRan ===
          true,

      ready:
        source
          .characterReasoningReady ===
          true ||
        source.ready ===
          true,

      source:
        source
          .characterReasoningSource ||
        source.source ||
        "unknown",

      answerAvailable,

      guidanceAvailable,

      type:
        source.type ||
        (
          answerAvailable
            ? "character_answer"
            : "no_character_answer"
        ),

      subtype:
        source.subtype ||
        null,

      focus:
        source.focus ||
        null,

      subject:
        source.subject ||
        null,

      preferenceSubject:
        source.preferenceSubject ||
        null,

      status,

      answer:
        source.answer ||
        null,

      groundedMeaning:
        source.groundedMeaning ||
        null,

      deterministicDraft,

      userFacingDraft:
        deterministicDraft,

      complete:
        source.complete !==
          false &&
        (
          !answerAvailable ||
          Boolean(
            deterministicDraft ||
            realization.needsAIWriter
          )
        ),

      usable:
        source.usable !==
          false,

      needsAIWriter:
        realization.needsAIWriter,

      aiWriterMode:
        realization.aiWriterMode,

      aiInstruction:
        realization.aiInstruction,

      realization,

      grounding,

      values:
        source.values ||
        null,

      relationship:
        source.relationship ||
        null,

      implementationDisclosure:
        source
          .implementationDisclosure ||
        null,

      confidence:
        source.confidence ||
        null,

      confidenceScore:
        source.confidenceScore ??
        null,

      authorityChain:
        this.toArray(
          source.authorityChain
        ),

      authorityPacket:
        source.authorityPacket ||
        null,

      responseControl:
        this.normalizeResponseControl(
          source.responseControl
        ),

      reason:
        source.reason ||
        null,

      raw:
        source,

      authority:
        "focused_character_reasoning_output"
    };
  },

  /* =====================================================
     EXPRESSION NORMALIZATION
  ===================================================== */

  normalizeExpressionResult(
    result = {}
  ) {
    const source =
      result &&
      typeof result ===
        "object"
        ? result
        : {};

    const packet =
      source.focusedCharacter ||
      source.composerCharacter ||
      source.composerCharacterPacket ||
      source.characterHandoff ||
      null;

    return {
      schema:
        "ari_character_expression_result",

      schemaVersion:
        this.schemaVersion,

      ran:
        source
          .characterExpressionRan ===
          true,

      ready:
        source
          .characterExpressionReady ===
          true ||
        source.ready ===
          true,

      source:
        source
          .characterExpressionSource ||
        source.source ||
        "unknown",

      relevant:
        source.characterRelevant ===
          true ||
        packet?.relevant ===
          true,

      expressionLevel:
        source.expressionLevel ||
        packet?.expressionLevel ||
        "background",

      focusedCharacter:
        packet,

      responseControl:
        this.normalizeResponseControl(
          source.responseControl ||
          packet?.responseControl
        ),

      reason:
        source.reason ||
        null,

      raw:
        source,

      authority:
        "focused_character_expression_output"
    };
  },

  /* =====================================================
     FOCUSED CHARACTER HANDOFF
  ===================================================== */

  buildFocusedCharacterHandoff({
    characterContext = {},
    localAuthorities = {},
    characterReasoning = {},
    characterExpression = {},
    resolvedEligibility = {},
    expressionEligibility = {}
  } = {}) {
    const expressionPacket =
      characterExpression
        .focusedCharacter &&
      typeof characterExpression
        .focusedCharacter ===
        "object"
        ? characterExpression
            .focusedCharacter
        : {};

    /*
     * Expression may vary wording and presentation.
     * Reasoning remains authoritative for meaning, status,
     * answer, grounding, and realization policy.
     */
    const answerAvailable =
      characterReasoning
        .answerAvailable ===
        true;

    const guidanceAvailable =
      characterReasoning
        .guidanceAvailable ===
        true ||
      characterContext
        .guidanceRequested ===
        true ||
      Boolean(
        characterContext.relationship
      );

    const realization =
      this.normalizeRealization({
        ...(
          characterReasoning
            .realization ||
          {}
        ),

        ...(
          expressionPacket
            .realization ||
          {}
        ),

        /*
         * Expression may not turn off a required AI
         * realization declared by Reasoning.
         */
        needsAIWriter:
          characterReasoning
            .needsAIWriter ===
            true ||
          expressionPacket
            .realization
            ?.needsAIWriter ===
            true
      });

    const deterministicDraft =
      this.cleanText(
        expressionPacket
          .deterministicDraft ||
        expressionPacket.draft ||
        characterReasoning
          .deterministicDraft ||
        ""
      );

    const draft =
      this.cleanText(
        expressionPacket.draft ||
        deterministicDraft
      );

    const status =
      characterReasoning.status ||
      this.normalizeStatus();

    const grounding =
      characterReasoning.grounding ||
      this.normalizeGrounding();

    const grounded =
      grounding.grounded ===
      true;

    const candidateAvailable =
      answerAvailable &&
      grounded &&
      Boolean(
        deterministicDraft
      ) &&
      realization.needsAIWriter !==
        true;

    const candidatePreferred =
      candidateAvailable &&
      expressionPacket
        .candidatePreferred !==
        false;

    const complete =
      answerAvailable
        ? (
            candidateAvailable ||
            realization.needsAIWriter ===
              true
          )
        : guidanceAvailable;

    const usable =
      characterReasoning.usable !==
        false &&
      expressionPacket.usable !==
        false;

    const responseControl =
      this.mergeResponseControls(
        characterContext
          .responseControl,

        characterReasoning
          .responseControl,

        characterExpression
          .responseControl,

        expressionPacket
          .responseControl
      );

    return {
      schema:
        "ari_character_handoff",

      schemaVersion:
        this.schemaVersion,

      ready:
        Boolean(
          answerAvailable ||
          guidanceAvailable
        ),

      available:
        Boolean(
          characterContext.ran ||
          characterReasoning.ran ||
          characterExpression.ran
        ),

      enabled:
        characterContext
          .useAllowed ===
          true ||
        answerAvailable ||
        guidanceAvailable,

      relevant:
        characterContext.relevant ===
          true ||
        characterExpression.relevant ===
          true ||
        answerAvailable ||
        guidanceAvailable,

      answerAvailable,

      guidanceAvailable,

      candidateAllowed:
        candidateAvailable,

      candidateAvailable,

      candidatePreferred,

      usable,

      complete,

      needsAIWriter:
        realization.needsAIWriter ===
        true,

      aiRealizationRequired:
        realization.needsAIWriter ===
          true &&
        realization.mode ===
          "ai_realization_required",

      mode:
        expressionPacket.mode ||
        characterContext.mode ||
        "silent",

      visibility:
        expressionPacket.visibility ||
        characterContext.visibility ||
        "background",

      expressionLevel:
        expressionPacket
          .expressionLevel ||
        characterExpression
          .expressionLevel ||
        "background",

      focus:
        characterReasoning.focus ||
        characterContext.focus ||
        null,

      subject:
        characterReasoning.subject ||
        characterContext.subject ||
        null,

      preferenceSubject:
        characterReasoning
          .preferenceSubject ||
        null,

      type:
        characterReasoning.type ||
        expressionPacket.type ||
        null,

      subtype:
        characterReasoning.subtype ||
        expressionPacket.subtype ||
        null,

      status,

      answer:
        characterReasoning.answer ||
        null,

      groundedMeaning:
        characterReasoning
          .groundedMeaning ||
        null,

      draft,

      deterministicDraft,

      grounding,

      realization,

      needsNaturalRealization:
        realization.needsAIWriter ===
        true,

      aiWriterMode:
        realization.aiWriterMode,

      aiInstruction:
        realization.aiInstruction,

      values:
        characterReasoning.values ||
        null,

      relationship:
        expressionPacket.relationship ||
        characterReasoning.relationship ||
        characterContext.relationship ||
        null,

      implementationDisclosure:
        expressionPacket
          .implementationDisclosure ||
        characterReasoning
          .implementationDisclosure ||
        characterContext
          .implementationDisclosure ||
        null,

      responseControl,

      requiredBehaviors:
        responseControl
          .requiredBehaviors,

      forbiddenBehaviors:
        responseControl
          .forbiddenBehaviors,

      constraints:
        responseControl.constraints,

      rules:
        responseControl.rules,

      confidence:
        characterReasoning
          .confidence ||
        null,

      confidenceScore:
        characterReasoning
          .confidenceScore ??
        null,

      authorityChain:
        characterReasoning
          .authorityChain ||
        [],

      authorityPacket:
        characterReasoning
          .authorityPacket ||
        null,

      localAuthorities: {
        requestedAuthorities:
          localAuthorities
            .requestedAuthorities ||
          [],

        availableRequestedAuthorities:
          localAuthorities
            .availableRequestedAuthorities ||
          [],

        missingRequestedAuthorities:
          localAuthorities
            .missingRequestedAuthorities ||
          [],

        requestedAuthoritiesSatisfied:
          localAuthorities
            .requestedAuthoritiesSatisfied ===
          true
      },

      preservation: {
        preserveMeaning:
          realization
            .preserveMeaning !==
          false,

        preserveStatus:
          realization
            .preserveStatus !==
          false,

        preserveValue:
          realization
            .preserveValue ===
          true,

        preservePosition:
          realization
            .preservePosition ===
          true,

        preserveOpenStatus:
          realization
            .preserveOpenStatus ===
          true,

        tentativeLanguageRequired:
          realization
            .tentativeLanguageRequired ===
          true,

        mayVaryWording:
          realization
            .mayVaryWording !==
          false
      },

      restrictions: {
        mayAddFacts:
          false,

        mayAddMeaning:
          false,

        mayInventPreference:
          false,

        mayInventIdentity:
          false,

        mayInventWorldview:
          false,

        mayInventExperience:
          false,

        mayPromoteToCanonical:
          false,

        mayModifyCharacterAuthority:
          false
      },

      eligibility: {
        reasoning:
          resolvedEligibility,

        expression:
          expressionEligibility
      },

      context:
        characterContext,

      reasoning:
        characterReasoning,

      expression:
        characterExpression,

      source:
        characterExpression.ran ===
          true
          ? "ari-character-expression-engine"
          : characterReasoning.ran ===
              true
            ? "ari-character-reasoning-engine"
            : characterContext.ran ===
                true
              ? "ari-character-context-engine"
              : "ari-character-stage",

      reason:
        realization.needsAIWriter ===
          true
          ? "focused_character_answer_requires_ai_realization"
          : candidateAvailable
            ? "focused_grounded_character_candidate_available"
            : guidanceAvailable
              ? "focused_character_guidance_available"
              : answerAvailable &&
                  !grounded
                ? "character_answer_not_grounded"
                : answerAvailable &&
                    !deterministicDraft
                  ? "character_answer_without_deterministic_draft"
                  : "no_focused_character_answer",

      authority:
        this.getHandoffAuthority()
    };
  },

  /* =====================================================
     REALIZATION / STATUS / GROUNDING
  ===================================================== */

  normalizeRealization(
    realization = {}
  ) {
    const source =
      realization &&
      typeof realization ===
        "object"
        ? realization
        : {};

    const needsAIWriter =
      source.needsAIWriter ===
      true;

    return {
      ...source,

      mode:
        source.mode ||
        (
          needsAIWriter
            ? "optional_ai_realization"
            : "local_candidate_preferred"
        ),

      needsAIWriter,

      aiWriterMode:
        source.aiWriterMode ||
        null,

      aiInstruction:
        this.cleanText(
          source.aiInstruction ||
          ""
        ),

      preserveMeaning:
        source.preserveMeaning !==
        false,

      preserveStatus:
        source.preserveStatus !==
        false,

      preserveValue:
        source.preserveValue ===
        true,

      preservePosition:
        source.preservePosition ===
        true,

      preserveOpenStatus:
        source.preserveOpenStatus ===
        true,

      tentativeLanguageRequired:
        source
          .tentativeLanguageRequired ===
        true,

      mayVaryWording:
        source.mayVaryWording !==
        false,

      mayAddFacts:
        false,

      mayAddMeaning:
        false,

      mayInventPreference:
        false,

      mayInventIdentity:
        false,

      mayInventWorldview:
        false,

      mayInventExperience:
        false,

      mayModifyCharacterAuthority:
        false,

      mayPromoteToCanonical:
        false
    };
  },

  normalizeStatus({
    value = null,
    type = null
  } = {}) {
    if (
      value &&
      typeof value ===
        "object"
    ) {
      const overall =
        value.overall ||
        value.preferenceStatus ||
        value.worldviewStatus ||
        value.identityStatus ||
        "background";

      return {
        ...value,

        overall,

        preferenceStatus:
          value.preferenceStatus ||
          (
            type ===
            "character_preference"
              ? overall
              : null
          ),

        worldviewStatus:
          value.worldviewStatus ||
          (
            [
              "character_worldview",
              "character_perspective"
            ].includes(
              type
            )
              ? overall
              : null
          ),

        identityStatus:
          value.identityStatus ||
          (
            type ===
            "character_identity"
              ? overall
              : null
          ),

        canonical:
          value.canonical ===
            true ||
          overall ===
            "canonical",

        inferred:
          value.inferred ===
            true ||
          overall ===
            "inferred",

        open:
          value.open ===
            true ||
          overall ===
            "open",

        stable:
          value.stable ===
            true ||
          overall ===
            "stable",

        background:
          value.background ===
            true ||
          overall ===
            "background"
      };
    }

    const overall =
      typeof value ===
        "string" &&
      value
        ? value
        : "background";

    return {
      overall,

      preferenceStatus:
        type ===
        "character_preference"
          ? overall
          : null,

      worldviewStatus:
        [
          "character_worldview",
          "character_perspective"
        ].includes(
          type
        )
          ? overall
          : null,

      identityStatus:
        type ===
        "character_identity"
          ? overall
          : null,

      canonical:
        overall ===
        "canonical",

      inferred:
        overall ===
        "inferred",

      open:
        overall ===
        "open",

      stable:
        overall ===
        "stable",

      background:
        overall ===
        "background"
    };
  },

  normalizeGrounding({
    grounding = null,
    source = {},
    status = {}
  } = {}) {
    const raw =
      grounding &&
      typeof grounding ===
        "object"
        ? grounding
        : {};

    /*
     * Character Stage does not invent grounding.
     * Grounding must be explicitly supplied by the
     * Character Reasoning authority.
     */
    return {
      ...raw,

      grounded:
        raw.grounded ===
        true,

      status:
        raw.status ||
        status.overall ||
        null,

      source:
        raw.source ||
        source.source ||
        null,

      authorityChain:
        this.toArray(
          raw.authorityChain ||
          source.authorityChain
        ),

      canonicalValue:
        raw.canonicalValue ||
        null,

      inferredValue:
        raw.inferredValue ||
        null,

      openStatus:
        raw.openStatus ===
          true ||
        status.open ===
          true,

      worldviewPosition:
        raw.worldviewPosition ||
        null,

      identityStatement:
        raw.identityStatement ||
        null
    };
  },

  /* =====================================================
     RESPONSE CONTROLS
  ===================================================== */

  normalizeResponseControl(
    control = {}
  ) {
    return {
      requiredBehaviors:
        this.toArray(
          control
            ?.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.toArray(
          control
            ?.forbiddenBehaviors
        ),

      constraints:
        this.toArray(
          control?.constraints
        ),

      rules:
        this.toArray(
          control?.rules
        )
    };
  },

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
        ),

      rules:
        this.mergeUnique(
          ...controls.map(
            control =>
              control?.rules
          )
        )
    };
  },

  /* =====================================================
     STAGE PACKET
  ===================================================== */

  buildCharacterStagePacket(
    summary = {}
  ) {
    const handoff =
      summary.characterHandoff ||
      {};

    const authorities =
      summary
        .localCharacterAuthorities ||
      {};

    return {
      schema:
        "ari_character_stage_packet",

      schemaVersion:
        this.schemaVersion,

      ready:
        handoff.ready ===
          true ||
        summary
          .characterContextEngineRan ===
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

      expressionEligibility:
        summary
          .characterExpressionEligibility ||
        null,

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
            ?.mode ||
          "silent",

        focus:
          summary.characterContext
            ?.focus ||
          null,

        subject:
          summary.characterContext
            ?.subject ||
          null,

        authorityRequest:
          summary.characterContext
            ?.authorityRequest ||
          {},

        value:
          summary.characterContext ||
          null
      },

      localAuthorities: {
        requested:
          authorities
            .requestedAuthorities ||
          [],

        available:
          authorities
            .availableRequestedAuthorities ||
          [],

        missing:
          authorities
            .missingRequestedAuthorities ||
          [],

        satisfied:
          authorities
            .requestedAuthoritiesSatisfied ===
          true,

        value:
          authorities
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

        answerAvailable:
          summary.characterReasoning
            ?.answerAvailable ===
          true,

        guidanceAvailable:
          summary.characterReasoning
            ?.guidanceAvailable ===
          true,

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
            ?.relevant ===
          true,

        expressionLevel:
          summary.characterExpression
            ?.expressionLevel ||
          "background",

        value:
          summary.characterExpression ||
          null
      },

      /*
       * Only this handoff is authoritative downstream.
       */
      handoff,

      result: {
        available:
          handoff.available ===
          true,

        enabled:
          handoff.enabled ===
          true,

        relevant:
          handoff.relevant ===
          true,

        answerAvailable:
          handoff.answerAvailable ===
          true,

        guidanceAvailable:
          handoff.guidanceAvailable ===
          true,

        candidateAvailable:
          handoff.candidateAvailable ===
          true,

        candidatePreferred:
          handoff.candidatePreferred ===
          true,

        grounded:
          handoff.grounding
            ?.grounded ===
          true,

        complete:
          handoff.complete ===
          true,

        usable:
          handoff.usable ===
          true,

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
          handoff
            .deterministicDraft ||
          "",

        needsAIWriter:
          handoff.needsAIWriter ===
          true,

        aiWriterMode:
          handoff.aiWriterMode ||
          null
      },

      quality: {
        focusedHandoffProduced:
          handoff.schema ===
          "ari_character_handoff",

        requestedAuthoritiesSatisfied:
          authorities
            .requestedAuthoritiesSatisfied ===
          true,

        answerGrounded:
          handoff.answerAvailable !==
            true ||
          handoff.grounding
            ?.grounded ===
            true,

        deterministicDraftAvailable:
          Boolean(
            handoff
              .deterministicDraft
          ),

        unresolvedAnswerDoesNotBecomeCandidate:
          handoff.answerAvailable !==
            true ||
          handoff.grounding
            ?.grounded ===
            true ||
          handoff.candidateAvailable !==
            true,

        aiRealizationPreserved:
          handoff.needsAIWriter !==
            true ||
          Boolean(
            handoff.aiWriterMode ||
            handoff.aiInstruction
          ),

        characterStatusPreserved:
          handoff.answerAvailable !==
            true ||
          Boolean(
            handoff.status
          ),

        noDownstreamComposerCharacterAuthority:
          true,

        noSupabaseUse:
          true
      },

      authority:
        this.getAuthorityBoundaries()
    };
  },

  /* =====================================================
     STAGE INPUT
  ===================================================== */

  buildCharacterStageInput(
    summary = {}
  ) {
    const context =
      summary.characterContext ||
      {};

    const originalText =
      summary.originalUserMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const resolvedText =
      summary.resolvedUserQuestion ||
      summary.resolvedCurrentTurn
        ?.resolvedText ||
      originalText;

    return {
      request: {
        originalText,

        resolvedText,

        effectiveText:
          resolvedText,

        turnId:
          summary.currentTurnId ||
          summary.turnId ||
          null
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

      responsePlan:
        summary.ariResponsePlan ||
        summary.canonicalResponsePlan ||
        summary.responsePlan ||
        null,

      responseStrategy:
        summary.responseStrategy ||
        null,

      safety:
        summary.safetyStagePacket ||
        summary.safetyDisposition ||
        null,

      understanding:
        summary.understandingStagePacket ||
        summary.understandingHandoff ||
        null,

      characterContext:
        context,

      localCharacterAuthorities:
        summary
          .localCharacterAuthorities ||
        null,

      eligibility:
        summary.characterEligibility ||
        null,

      authority:
        "character_stage_structured_input"
    };
  },

  /* =====================================================
     FALLBACKS
  ===================================================== */

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

      characterRelevant:
        false,

      characterGuidanceRequested:
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

      implementationDisclosure:
        null,

      responseControl: {
        requiredBehaviors:
          [],

        forbiddenBehaviors:
          [],

        constraints:
          [],

        rules:
          []
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

      subtype:
        null,

      status:
        "unavailable",

      answer:
        null,

      groundedMeaning:
        null,

      userFacingDraft:
        "",

      deterministicDraft:
        "",

      complete:
        false,

      usable:
        false,

      needsAIWriter:
        false,

      aiWriterMode:
        null,

      aiInstruction:
        "",

      reason,

      responseControl: {
        requiredBehaviors:
          [],

        forbiddenBehaviors:
          [],

        constraints:
          [],

        rules:
          []
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

      focusedCharacter:
        null,

      composerCharacter:
        null,

      composerCharacterPacket:
        null,

      responseControl: {
        requiredBehaviors:
          [],

        forbiddenBehaviors:
          [],

        constraints:
          [],

        rules:
          []
      },

      reason
    };
  },

  /* =====================================================
     AUTHORITY BOUNDARIES
  ===================================================== */

  getHandoffAuthority() {
    return {
      canExposeFocusedCharacterResult:
        true,

      canPreserveReasoningMeaning:
        true,

      canPreserveExpressionWording:
        true,

      canPreserveCharacterStatus:
        true,

      canPreserveGrounding:
        true,

      canPreserveRealizationPolicy:
        true,

      canPreserveResponseConstraints:
        true,

      canResolvePreference:
        false,

      canCreateIdentity:
        false,

      canCreateWorldview:
        false,

      canPromoteInference:
        false,

      canGenerateFinalResponse:
        false,

      role:
        "focused_character_downstream_handoff"
    };
  },

  getAuthorityBoundaries() {
    return {
      localOnly:
        true,

      orchestrationAuthority:
        true,

      canRunCharacterContext:
        true,

      canInspectRequestedLocalAuthorities:
        true,

      canRunCharacterReasoning:
        true,

      canRunCharacterExpression:
        true,

      canNormalizeFocusedSubsystemResults:
        true,

      canBuildFocusedCharacterHandoff:
        true,

      canMergeCharacterResponseConstraints:
        true,

      canPreserveDeterministicDraft:
        true,

      canPreserveAIRealizationInstruction:
        true,

      canResolvePreference:
        false,

      canCreateCanonicalPreference:
        false,

      canPromoteInferenceToCanonical:
        false,

      canCreateCharacterIdentity:
        false,

      canCreateWorldviewPosition:
        false,

      canInventCharacterMeaning:
        false,

      canInferGrounding:
        false,

      canClassifyConversation:
        false,

      canOverrideSemanticMeaning:
        false,

      canOverrideConversationFunction:
        false,

      canOverrideSituationContract:
        false,

      canOverrideSafety:
        false,

      canOverrideFacts:
        false,

      canOverrideUserIntent:
        false,

      canCreateResponsePlan:
        false,

      canDetermineBlueprintEligibility:
        false,

      canDetermineFinalAIWriterActivation:
        false,

      canRegisterResponseCandidate:
        false,

      canSelectFinalDraft:
        false,

      canWriteFinalResponse:
        false,

      canRetrieveUserMemory:
        false,

      canStoreUserMemory:
        false,

      canAccessSupabase:
        false,

      canExecuteTools:
        false,

      canPersistState:
        false,

      role:
        "focused_local_character_subsystem_orchestration"
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
      "responseGoal",
      "responseShape",
      "responseMoves",
      "canonicalResponsePlan",
      "finalResponse",
      "selectedDraft",
      "recommendation",
      "knownFacts",
      "inferredFacts",
      "developerIntent",
      "githubEdit",
      "memorySaveDecision",
      "canonicalPreference",
      "worldviewPosition"
    ];
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const authority =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canResolvePreference",
      "canCreateCanonicalPreference",
      "canPromoteInferenceToCanonical",
      "canCreateCharacterIdentity",
      "canCreateWorldviewPosition",
      "canInventCharacterMeaning",
      "canInferGrounding",
      "canClassifyConversation",
      "canOverrideSemanticMeaning",
      "canOverrideConversationFunction",
      "canOverrideSituationContract",
      "canOverrideSafety",
      "canOverrideFacts",
      "canOverrideUserIntent",
      "canCreateResponsePlan",
      "canDetermineBlueprintEligibility",
      "canDetermineFinalAIWriterActivation",
      "canRegisterResponseCandidate",
      "canSelectFinalDraft",
      "canWriteFinalResponse",
      "canRetrieveUserMemory",
      "canStoreUserMemory",
      "canAccessSupabase",
      "canExecuteTools",
      "canPersistState"
    ];

    const errors =
      forbiddenTrue
        .filter(
          key =>
            authority[key] ===
            true
        )
        .map(
          key =>
            `${key}_must_be_false`
        );

    const warnings = [];

    if (
      !window
        .AriCharacterContextEngine
    ) {
      warnings.push(
        "AriCharacterContextEngine_not_loaded"
      );
    }

    if (
      !window
        .AriCharacterReasoningEngine
    ) {
      warnings.push(
        "AriCharacterReasoningEngine_not_loaded"
      );
    }

    if (
      !window
        .AriCharacterExpressionEngine
    ) {
      warnings.push(
        "AriCharacterExpressionEngine_not_loaded"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      source:
        "ari-character-stage-validation",

      version:
        this.version,

      errors,

      warnings,

      checks: {
        focusedHandoffOnly:
          true,

        downstreamComposerCharacterAuthorityRemoved:
          true,

        preferenceResolutionSeparated:
          authority
            .canResolvePreference ===
          false,

        groundingInferenceDisabled:
          authority
            .canInferGrounding ===
          false,

        responsePlanAuthorityDisabled:
          authority
            .canCreateResponsePlan ===
          false,

        candidateRegistrationDisabled:
          authority
            .canRegisterResponseCandidate ===
          false,

        finalSelectionDisabled:
          authority
            .canSelectFinalDraft ===
          false,

        finalResponseAuthorityDisabled:
          authority
            .canWriteFinalResponse ===
          false,

        supabaseDisabled:
          authority
            .canAccessSupabase ===
          false
      }
    };
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  hasCallableMethod(
    object = null,
    methods = []
  ) {
    return Boolean(
      object &&
      this.toArray(
        methods
      ).some(
        method =>
          typeof object[method] ===
          "function"
      )
    );
  },

  numberOr(
    value,
    fallback = 0
  ) {
    const number =
      Number(
        value
      );

    return Number.isFinite(
      number
    )
      ? number
      : fallback;
  },

  toArray(value) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value.filter(
        item =>
          item !==
            undefined &&
          item !==
            null &&
          item !==
            ""
      );
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [
      value
    ];
  },

  uniqueStrings(
    values = []
  ) {
    return [
      ...new Set(
        this.toArray(
          values
        )
          .map(
            value =>
              String(
                value ||
                ""
              ).trim()
          )
          .filter(Boolean)
      )
    ];
  },

  mergeUnique(
    ...values
  ) {
    const output = [];
    const seen =
      new Set();

    values
      .flatMap(
        value =>
          this.toArray(
            value
          )
      )
      .forEach(
        value => {
          const key =
            typeof value ===
              "string"
              ? this
                  .normalizeForComparison(
                    value
                  )
              : this
                  .normalizeForComparison(
                    value?.id ||
                    value?.name ||
                    value?.type ||
                    value?.value ||
                    value?.claim ||
                    this.safeJSONStringify(
                      value
                    )
                  );

          if (
            !key ||
            seen.has(
              key
            )
          ) {
            return;
          }

          seen.add(
            key
          );

          output.push(
            value
          );
        }
      );

    return output;
  },

  safeJSONStringify(
    value = null
  ) {
    const seen =
      new WeakSet();

    try {
      return JSON.stringify(
        value,
        (
          key,
          nestedValue
        ) => {
          if (
            nestedValue &&
            typeof nestedValue ===
              "object"
          ) {
            if (
              seen.has(
                nestedValue
              )
            ) {
              return "[Circular]";
            }

            seen.add(
              nestedValue
            );
          }

          return nestedValue;
        }
      );
    } catch (error) {
      return "";
    }
  },

  cleanText(
    value = ""
  ) {
    return String(
      value ??
      ""
    )
      .replace(
        /[’‘]/g,
        "'"
      )
      .replace(
        /[“”]/g,
        "\""
      )
      .replace(
        /[ \t]+/g,
        " "
      )
      .replace(
        /\n[ \t]+/g,
        "\n"
      )
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim();
  },

  normalizeIdentifier(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );
  },

  normalizeForComparison(
    value = ""
  ) {
    return this.cleanText(
      value
    )
      .toLowerCase()
      .replace(
        /[_-]/g,
        " "
      )
      .replace(
        /[^\w\s']/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }
};

console.log(
  "ARI CHARACTER STAGE LOADED:",
  window.AriCharacterStage?.version,
  window.AriCharacterStage
    ?.validate?.().valid ===
    true
    ? "READY"
    : "INVALID"
);