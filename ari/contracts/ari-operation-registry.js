// ari/contracts/ari-operation-registry.js
// Ari Operation Registry
//
// Purpose:
// Provide one deterministic registry for cognitive operation names and their
// structural contracts. Normalize expected vocabulary variation without
// selecting, inferring, or inventing an operation.
//
// V1.1.0 — Canonical Vocabulary / Controlled Alias Resolution

window.Ari = window.Ari || {};

window.AriOperationRegistry = {
  version: "1.1.0",

  schema:
    "ari.operation_registry",

  schemaVersion:
    "1.0.0",

  source:
    "ari-operation-registry",

  authorityLevel:
    "operation_contract_registry_only",

  // ===================================================
  // Canonical operations
  // ===================================================

  operations: {
    respond: {
      requestType:
        "general",

      frameType:
        "general_request",

      interactionFamily:
        "general",

      intentFamily:
        "general_response",

      defaultDomain:
        "general_understanding",

      defaultRequestedOutput:
        "response",

      requiredSlots:
        [],

      responseMode:
        "normal_response",

      conversationStyle:
        "normal",

      executionKind:
        null
    },

    provide_information: {
      requestType:
        "information",

      frameType:
        "information_request",

      interactionFamily:
        "information",

      intentFamily:
        "fact_retrieval",

      defaultDomain:
        "general_understanding",

      defaultRequestedOutput:
        "direct_information",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "direct_answer",

      conversationStyle:
        "information_request",

      executionKind:
        null
    },

    interpret_meaning: {
      requestType:
        "explanation",

      frameType:
        "meaning_interpretation_request",

      interactionFamily:
        "information",

      intentFamily:
        "interpretation",

      defaultDomain:
        "general_understanding",

      defaultRequestedOutput:
        "interpretation",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "direct_answer",

      conversationStyle:
        "meaning_request",

      executionKind:
        null
    },

    explain_or_teach: {
      requestType:
        "explanation",

      frameType:
        "explanation_request",

      interactionFamily:
        "information",

      intentFamily:
        "explanation",

      defaultDomain:
        "general_understanding",

      defaultRequestedOutput:
        "explanation",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "direct_answer",

      conversationStyle:
        "information_request",

      executionKind:
        null
    },

    decide_or_prioritize: {
      requestType:
        "decision",

      frameType:
        "decision_request",

      interactionFamily:
        "decision",

      intentFamily:
        "recommendation",

      defaultDomain:
        "decision",

      defaultRequestedOutput:
        "recommendation_or_priority",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "recommendation",

      conversationStyle:
        "recommendation_request",

      executionKind:
        null
    },

    evaluate_and_recommend: {
      requestType:
        "decision",

      frameType:
        "decision_request",

      interactionFamily:
        "decision",

      intentFamily:
        "recommendation",

      defaultDomain:
        "decision",

      defaultRequestedOutput:
        "architectural_recommendation",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "recommendation",

      conversationStyle:
        "recommendation_request",

      executionKind:
        null
    },

    create_plan: {
      requestType:
        "planning",

      frameType:
        "planning_request",

      interactionFamily:
        "planning",

      intentFamily:
        "planning",

      defaultDomain:
        "general_understanding",

      defaultRequestedOutput:
        "plan_or_roadmap",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "plan",

      conversationStyle:
        "planning_request",

      executionKind:
        null
    },

    produce_or_revise_text: {
      requestType:
        "writing",

      frameType:
        "writing_request",

      interactionFamily:
        "writing",

      intentFamily:
        "text_generation",

      defaultDomain:
        "writing",

      defaultRequestedOutput:
        "written_text",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "written_output",

      conversationStyle:
        "writing_request",

      executionKind:
        "creation"
    },

    translate: {
      requestType:
        "translation",

      frameType:
        "translation_request",

      interactionFamily:
        "translation",

      intentFamily:
        "language_transformation",

      defaultDomain:
        "language",

      defaultRequestedOutput:
        "translated_text",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "translated_output",

      conversationStyle:
        "translation_request",

      executionKind:
        null
    },

    calculate_or_convert: {
      requestType:
        "calculation",

      frameType:
        "calculation_request",

      interactionFamily:
        "calculation",

      intentFamily:
        "calculation",

      defaultDomain:
        "calculation",

      defaultRequestedOutput:
        "calculated_result",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "calculated_output",

      conversationStyle:
        "calculation_request",

      executionKind:
        null
    },

    verify_or_review: {
      requestType:
        "verification",

      frameType:
        "verification_request",

      interactionFamily:
        "verification",

      intentFamily:
        "verification",

      defaultDomain:
        "general_understanding",

      defaultRequestedOutput:
        "verification_result",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "verification_result",

      conversationStyle:
        "verification_request",

      executionKind:
        null
    },

    inspect_and_explain: {
      requestType:
        "verification",

      frameType:
        "verification_request",

      interactionFamily:
        "verification",

      intentFamily:
        "analysis",

      defaultDomain:
        "project",

      defaultRequestedOutput:
        "architectural_analysis",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "verification_result",

      conversationStyle:
        "verification_request",

      executionKind:
        null
    },

    retrieve_prior_context: {
      requestType:
        "memory",

      frameType:
        "memory_request",

      interactionFamily:
        "memory",

      intentFamily:
        "memory_action",

      defaultDomain:
        "memory",

      defaultRequestedOutput:
        "recalled_context",

      requiredSlots:
        [],

      responseMode:
        "normal_response",

      conversationStyle:
        "normal",

      executionKind:
        null
    },

    save_or_forget_memory: {
      requestType:
        "memory",

      frameType:
        "memory_request",

      interactionFamily:
        "memory",

      intentFamily:
        "memory_action",

      defaultDomain:
        "memory",

      defaultRequestedOutput:
        "memory_action",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "normal_response",

      conversationStyle:
        "normal",

      executionKind:
        null
    },

    answer_identity_question: {
      requestType:
        "identity",

      frameType:
        "identity_question",

      interactionFamily:
        "identity",

      intentFamily:
        "identity",

      defaultDomain:
        "identity",

      defaultRequestedOutput:
        "identity_answer",

      requiredSlots:
        [],

      responseMode:
        "normal_response",

      conversationStyle:
        "identity_question",

      executionKind:
        null
    },

    provide_opinion: {
      requestType:
        "opinion",

      frameType:
        "opinion_request",

      interactionFamily:
        "opinion",

      intentFamily:
        "judgment",

      defaultDomain:
        "general_understanding",

      defaultRequestedOutput:
        "opinion",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "normal_response",

      conversationStyle:
        "opinion_request",

      executionKind:
        null
    },

    create_artifact: {
      requestType:
        "creation",

      frameType:
        "creation_request",

      interactionFamily:
        "creation",

      intentFamily:
        "artifact_creation",

      defaultDomain:
        "project",

      defaultRequestedOutput:
        "created_artifact",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "created_artifact",

      conversationStyle:
        "creation_request",

      executionKind:
        "creation"
    },

    implement_or_modify: {
      requestType:
        "implementation",

      frameType:
        "developer_artifact_request",

      interactionFamily:
        "developer_task",

      intentFamily:
        "artifact_execution",

      defaultDomain:
        "project",

      defaultRequestedOutput:
        "implementation_or_code",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "code_or_artifact",

      conversationStyle:
        "artifact_operation",

      executionKind:
        "modification"
    },

    provide_emotional_support: {
      requestType:
        "emotional_support",

      frameType:
        "emotional_support_request",

      interactionFamily:
        "emotional_support",

      intentFamily:
        "emotional_support",

      defaultDomain:
        "emotion",

      defaultRequestedOutput:
        "supportive_response",

      requiredSlots:
        [],

      responseMode:
        "supportive_response",

      conversationStyle:
        "support_request",

      executionKind:
        null
    },

    explain_without_execution: {
      requestType:
        "explanation",

      frameType:
        "explanation_request",

      interactionFamily:
        "information",

      intentFamily:
        "explanation",

      defaultDomain:
        "project",

      defaultRequestedOutput:
        "explanation",

      requiredSlots:
        [
          "object"
        ],

      responseMode:
        "direct_answer",

      conversationStyle:
        "information_request",

      executionKind:
        null
    }
  },

  // ===================================================
  // Controlled aliases
  //
  // Aliases normalize expected wording variation only.
  // They do not perform semantic inference.
  // ===================================================

  aliases: {
    // General response
    general:
      "respond",

    response:
      "respond",

    answer:
      "respond",

    reply:
      "respond",

    respond_directly:
      "respond",

    general_response:
      "respond",

    // Direct information
    information:
      "provide_information",

    provide_information_directly:
      "provide_information",

    direct_information:
      "provide_information",

    factual:
      "provide_information",

    factual_answer:
      "provide_information",

    fact_retrieval:
      "provide_information",

    retrieve_information:
      "provide_information",

    identify:
      "provide_information",

    identification:
      "provide_information",

    list_information:
      "provide_information",

    answer_factual_question:
      "provide_information",

    // Meaning interpretation
    meaning:
      "interpret_meaning",

    interpret:
      "interpret_meaning",

    interpretation:
      "interpret_meaning",

    explain_meaning:
      "interpret_meaning",

    interpret_meaning_request:
      "interpret_meaning",

    what_does_it_mean:
      "interpret_meaning",

    clarify_meaning:
      "interpret_meaning",

    // Explanation and teaching
    explanation:
      "explain_or_teach",

    explain:
      "explain_or_teach",

    teaching:
      "explain_or_teach",

    teach:
      "explain_or_teach",

    define:
      "explain_or_teach",

    definition:
      "explain_or_teach",

    describe:
      "explain_or_teach",

    description:
      "explain_or_teach",

    overview:
      "explain_or_teach",

    explain_concept:
      "explain_or_teach",

    clarify_concept:
      "explain_or_teach",

    define_concept:
      "explain_or_teach",

    what_is:
      "explain_or_teach",

    what_are:
      "explain_or_teach",

    // Decision support
    decision:
      "decide_or_prioritize",

    decide:
      "decide_or_prioritize",

    choose:
      "decide_or_prioritize",

    prioritize:
      "decide_or_prioritize",

    recommendation:
      "decide_or_prioritize",

    recommend:
      "decide_or_prioritize",

    advise:
      "decide_or_prioritize",

    advice:
      "decide_or_prioritize",

    select_best_option:
      "decide_or_prioritize",

    // Evaluation with recommendation
    evaluate:
      "evaluate_and_recommend",

    evaluate_options:
      "evaluate_and_recommend",

    assess_options:
      "evaluate_and_recommend",

    compare_and_recommend:
      "evaluate_and_recommend",

    architectural_recommendation:
      "evaluate_and_recommend",

    // Planning
    planning:
      "create_plan",

    plan:
      "create_plan",

    roadmap:
      "create_plan",

    create_roadmap:
      "create_plan",

    organize_steps:
      "create_plan",

    sequence_steps:
      "create_plan",

    strategize:
      "create_plan",

    strategy:
      "create_plan",

    // Writing
    writing:
      "produce_or_revise_text",

    write:
      "produce_or_revise_text",

    rewrite:
      "produce_or_revise_text",

    revise:
      "produce_or_revise_text",

    edit_text:
      "produce_or_revise_text",

    draft:
      "produce_or_revise_text",

    draft_text:
      "produce_or_revise_text",

    produce_text:
      "produce_or_revise_text",

    // Translation
    translation:
      "translate",

    translate_text:
      "translate",

    language_translation:
      "translate",

    // Calculation and conversion
    calculation:
      "calculate_or_convert",

    calculate:
      "calculate_or_convert",

    conversion:
      "calculate_or_convert",

    convert:
      "calculate_or_convert",

    compute:
      "calculate_or_convert",

    // Verification
    verification:
      "verify_or_review",

    verify:
      "verify_or_review",

    review:
      "verify_or_review",

    check:
      "verify_or_review",

    confirm:
      "verify_or_review",

    validate:
      "verify_or_review",

    fact_check:
      "verify_or_review",

    // Developer inspection
    inspect:
      "inspect_and_explain",

    inspect_code:
      "inspect_and_explain",

    inspect_architecture:
      "inspect_and_explain",

    analyze_code:
      "inspect_and_explain",

    analyze_architecture:
      "inspect_and_explain",

    debug:
      "inspect_and_explain",

    diagnose:
      "inspect_and_explain",

    diagnose_issue:
      "inspect_and_explain",

    explain_code:
      "inspect_and_explain",

    // Prior context
    recall:
      "retrieve_prior_context",

    retrieve_memory:
      "retrieve_prior_context",

    retrieve_context:
      "retrieve_prior_context",

    prior_context:
      "retrieve_prior_context",

    conversation_recall:
      "retrieve_prior_context",

    // Memory mutation
    memory:
      "save_or_forget_memory",

    remember:
      "save_or_forget_memory",

    save_memory:
      "save_or_forget_memory",

    forget:
      "save_or_forget_memory",

    forget_memory:
      "save_or_forget_memory",

    // Identity
    identity:
      "answer_identity_question",

    identity_question:
      "answer_identity_question",

    answer_identity:
      "answer_identity_question",

    who_are_you:
      "answer_identity_question",

    // Opinion
    opinion:
      "provide_opinion",

    judgment:
      "provide_opinion",

    give_opinion:
      "provide_opinion",

    provide_judgment:
      "provide_opinion",

    // Artifact creation
    creation:
      "create_artifact",

    create:
      "create_artifact",

    generate_artifact:
      "create_artifact",

    create_artifact_request:
      "create_artifact",

    // Developer implementation
    implementation:
      "implement_or_modify",

    implement:
      "implement_or_modify",

    modify:
      "implement_or_modify",

    update_code:
      "implement_or_modify",

    fix_code:
      "implement_or_modify",

    refactor:
      "implement_or_modify",

    refactor_code:
      "implement_or_modify",

    implement_change:
      "implement_or_modify",

    // Emotional support
    emotional:
      "provide_emotional_support",

    emotional_support:
      "provide_emotional_support",

    support:
      "provide_emotional_support",

    comfort:
      "provide_emotional_support",

    reassure:
      "provide_emotional_support",

    supportive_response:
      "provide_emotional_support",

    // Explanation without execution
    explain_only:
      "explain_without_execution",

    analyze_without_execution:
      "explain_without_execution",

    explain_without_changes:
      "explain_without_execution",

    no_execution_explanation:
      "explain_without_execution"
  },

  // ===================================================
  // Canonical normalization
  // ===================================================

  normalizeOperation(value = "") {
    const key =
      this.normalizeKey(
        value
      );

    if (!key) {
      return null;
    }

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          this.operations,
          key
        )
    ) {
      return key;
    }

    const aliasTarget =
      this.aliases[key] ||
      null;

    if (
      aliasTarget &&
      Object.prototype
        .hasOwnProperty
        .call(
          this.operations,
          aliasTarget
        )
    ) {
      return aliasTarget;
    }

    return null;
  },

  normalizeOperationDetailed(
    value = ""
  ) {
    const raw =
      String(
        value ||
        ""
      );

    const normalized =
      this.normalizeKey(
        raw
      );

    const canonical =
      this.normalizeOperation(
        raw
      );

    let resolutionSource =
      "unrecognized";

    if (
      canonical &&
      canonical === normalized &&
      Object.prototype
        .hasOwnProperty
        .call(
          this.operations,
          normalized
        )
    ) {
      resolutionSource =
        "canonical";
    } else if (
      canonical &&
      this.aliases[normalized] ===
        canonical
    ) {
      resolutionSource =
        "alias";
    }

    return {
      raw,

      normalized,

      canonical,

      recognized:
        Boolean(
          canonical
        ),

      resolutionSource
    };
  },

  getOperation(value = "") {
    const operation =
      this.normalizeOperation(
        value
      );

    return operation
      ? this.operations[
          operation
        ] ||
        null
      : null;
  },

  getOperationContract(
    value = ""
  ) {
    const operation =
      this.normalizeOperation(
        value
      );

    const definition =
      operation
        ? this.operations[
            operation
          ] ||
          null
        : null;

    return {
      operation,

      definition,

      recognized:
        Boolean(
          operation &&
          definition
        )
    };
  },

  hasOperation(value = "") {
    return Boolean(
      this.getOperation(
        value
      )
    );
  },

  // ===================================================
  // Prompt contract
  // ===================================================

  listCanonicalOperations() {
    return Object.keys(
      this.operations
    );
  },

  listAliases() {
    return {
      ...this.aliases
    };
  },

  getPromptContract() {
    return {
      schema:
        "ari.operation_prompt_contract",

      schemaVersion:
        "1.0.0",

      registryVersion:
        this.version,

      allowedOperations:
        this.listCanonicalOperations(),

      operationDefinitions:
        Object.fromEntries(
          Object.entries(
            this.operations
          ).map(
            ([
              operation,
              definition
            ]) => [
              operation,
              {
                requestType:
                  definition.requestType,

                frameType:
                  definition.frameType,

                interactionFamily:
                  definition
                    .interactionFamily,

                intentFamily:
                  definition.intentFamily,

                defaultDomain:
                  definition.defaultDomain,

                defaultRequestedOutput:
                  definition
                    .defaultRequestedOutput,

                requiredSlots:
                  [
                    ...(
                      definition
                        .requiredSlots ||
                      []
                    )
                  ]
              }
            ]
          )
        ),

      rules: [
        "semanticFrame.operation must use exactly one allowed canonical operation.",
        "Do not invent new operation names.",
        "Do not use domain-specific operation names when a canonical cognitive operation already applies.",
        "Domain belongs in semanticFrame.domain, not in semanticFrame.operation.",
        "The object or target belongs in semantic slots, not in the operation name."
      ],

      examples: [
        {
          request:
            "What is heart failure?",

          operation:
            "explain_or_teach"
        },

        {
          request:
            "What is a normal ejection fraction?",

          operation:
            "provide_information"
        },

        {
          request:
            "What does ejection fraction mean?",

          operation:
            "interpret_meaning"
        },

        {
          request:
            "Which option should I choose?",

          operation:
            "decide_or_prioritize"
        },

        {
          request:
            "Build me a step-by-step plan.",

          operation:
            "create_plan"
        },

        {
          request:
            "Review this code and explain the problem.",

          operation:
            "inspect_and_explain"
        },

        {
          request:
            "Update this JavaScript file.",

          operation:
            "implement_or_modify"
        }
      ],

      source:
        this.source
    };
  },

  // ===================================================
  // Registry validation
  // ===================================================

  validateRegistry() {
    const errors = [];
    const warnings = [];

    const requiredDefinitionFields = [
      "requestType",
      "frameType",
      "interactionFamily",
      "intentFamily",
      "defaultDomain",
      "defaultRequestedOutput",
      "requiredSlots",
      "responseMode",
      "conversationStyle",
      "executionKind"
    ];

    for (
      const [
        operation,
        definition
      ]
      of Object.entries(
        this.operations
      )
    ) {
      if (
        !definition ||
        typeof definition !==
          "object" ||
        Array.isArray(
          definition
        )
      ) {
        errors.push(
          `operation_definition_invalid:${operation}`
        );

        continue;
      }

      for (
        const field
        of requiredDefinitionFields
      ) {
        if (
          !Object.prototype
            .hasOwnProperty
            .call(
              definition,
              field
            )
        ) {
          errors.push(
            `operation_field_missing:${operation}:${field}`
          );
        }
      }

      if (
        !Array.isArray(
          definition.requiredSlots
        )
      ) {
        errors.push(
          `operation_required_slots_invalid:${operation}`
        );
      }

      const normalizedOperation =
        this.normalizeKey(
          operation
        );

      if (
        normalizedOperation !==
        operation
      ) {
        warnings.push(
          `operation_name_not_normalized:${operation}:${normalizedOperation}`
        );
      }
    }

    for (
      const [
        alias,
        target
      ]
      of Object.entries(
        this.aliases
      )
    ) {
      if (
        !Object.prototype
          .hasOwnProperty
          .call(
            this.operations,
            target
          )
      ) {
        errors.push(
          `alias_target_missing:${alias}:${target}`
        );
      }

      const normalizedAlias =
        this.normalizeKey(
          alias
        );

      if (
        normalizedAlias !==
        alias
      ) {
        warnings.push(
          `alias_name_not_normalized:${alias}:${normalizedAlias}`
        );
      }

      if (
        Object.prototype
          .hasOwnProperty
          .call(
            this.operations,
            alias
          ) &&
        alias !== target
      ) {
        errors.push(
          `alias_conflicts_with_canonical_operation:${alias}:${target}`
        );
      }
    }

    return {
      valid:
        errors.length === 0,

      ready:
        errors.length === 0,

      operationCount:
        Object.keys(
          this.operations
        ).length,

      aliasCount:
        Object.keys(
          this.aliases
        ).length,

      errors:
        this.unique(
          errors
        ),

      warnings:
        this.unique(
          warnings
        ),

      source:
        this.source,

      version:
        this.version
    };
  },

  // ===================================================
  // Utilities
  // ===================================================

  normalizeKey(value = "") {
    return String(
      value ||
      ""
    )
      .trim()
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

  unique(values = []) {
    return [
      ...new Set(
        values.filter(
          Boolean
        )
      )
    ];
  },

  // ===================================================
  // Authority
  // ===================================================

  authority: {
    canDefineOperationContracts:
      true,

    canNormalizeOperationAliases:
      true,

    canExposePromptContract:
      true,

    canValidateRegistry:
      true,

    canReportUnknownOperations:
      true,

    canSelectOperation:
      false,

    canInterpretMeaning:
      false,

    canInferOperationFromUserText:
      false,

    canInventOperation:
      false,

    canAuthorizeExecution:
      false,

    role:
      "operation_contract_registry"
  }
};

window.Ari.operationRegistry =
  window.AriOperationRegistry;

const ariOperationRegistryValidation =
  window.AriOperationRegistry
    .validateRegistry();

console.log(
  "ARI OPERATION REGISTRY LOADED:",
  window.AriOperationRegistry
    ?.version
);

console.log(
  "ARI OPERATION REGISTRY VALIDATION:",
  ariOperationRegistryValidation
);