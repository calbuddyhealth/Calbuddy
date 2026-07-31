// ari/contracts/ari-application-operation-registry.js
// Ari Application Operation Registry
//
// Purpose:
// Register application-facing operations and map them to Ari's canonical
// cognitive operations without adding domain-specific names to the canonical
// Ari Operation Registry.
//
// V1.0.0 — Application Operation Mapping Foundation
//
// Architectural flow:
//
// CalBuddy Application Context
//      ↓
// Ari Application Operation Registry
//      ↓
// Canonical Cognitive Operation
//      ↓
// Ari Rebirth Pipeline
//
// Responsibilities:
// - Define application-facing operation contracts.
// - Normalize controlled application-operation aliases.
// - Map each application operation to one canonical cognitive operation.
// - Preserve domain, requested-result, read-only, and write constraints.
// - Validate that mapped cognitive operations exist.
//
// Non-responsibilities:
// - Does not infer an operation from user text.
// - Does not execute application actions.
// - Does not estimate nutrition.
// - Does not create semantic meaning.
// - Does not select pipeline routing.
// - Does not generate responses.
// - Does not access Supabase.

window.Ari = window.Ari || {};

window.AriApplicationOperationRegistry = {
  version:
    "1.0.0",

  schema:
    "ari.application_operation_registry",

  schemaVersion:
    "1.0.0",

  source:
    "ari-application-operation-registry",

  authorityLevel:
    "application_operation_contract_registry_only",

  /* =====================================================
     APPLICATION OPERATIONS
  ===================================================== */

  operations: {
    estimate_meal_nutrition: {
      domain:
        "nutrition",

      cognitiveOperation:
        "calculate_or_convert",

      requestedResult:
        "structured_meal_estimate",

      requestKind:
        "read_only_estimation",

      readOnly:
        true,

      allowDirectWrite:
        false,

      allowPendingAction:
        false,

      requireConfirmationBeforeWrite:
        true,

      requiredInputFields: [
        "message"
      ],

      resultContract: {
        type:
          "structured_meal_estimate",

        requiredFields: [
          "mealName",
          "estimatedCalories",
          "macros",
          "servingSize",
          "confidence",
          "assumptions"
        ],

        macroFields: [
          "proteinGrams",
          "carbohydrateGrams",
          "fatGrams",
          "fiberGrams"
        ]
      }
    }
  },

  /* =====================================================
     CONTROLLED ALIASES
  ===================================================== */

  aliases: {
    meal_nutrition_estimate:
      "estimate_meal_nutrition",

    estimate_meal:
      "estimate_meal_nutrition",

    estimate_food:
      "estimate_meal_nutrition",

    calculate_meal_nutrition:
      "estimate_meal_nutrition",

    calculate_meal_calories:
      "estimate_meal_nutrition"
  },

  /* =====================================================
     NORMALIZATION
  ===================================================== */

  normalizeOperation(
    value = ""
  ) {
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

  getOperation(
    value = ""
  ) {
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

  hasOperation(
    value = ""
  ) {
    return Boolean(
      this.getOperation(
        value
      )
    );
  },

  /* =====================================================
     APPLICATION CONTEXT RESOLUTION
  ===================================================== */

  resolveAppContext(
    appContext = {}
  ) {
    if (
      !appContext ||
      typeof appContext !==
        "object" ||
      Array.isArray(
        appContext
      )
    ) {
      return {
        recognized:
          false,

        operation:
          null,

        contract:
          null,

        cognitiveOperation:
          null,

        domain:
          null,

        requestedResult:
          null,

        constraints:
          null
      };
    }

    const operation =
      this.normalizeOperation(
        appContext.operation
      );

    const contract =
      operation
        ? this.operations[
            operation
          ] ||
        null
        : null;

    if (!operation || !contract) {
      return {
        recognized:
          false,

        operation:
          null,

        contract:
          null,

        cognitiveOperation:
          null,

        domain:
          this.normalizeKey(
            appContext.domain
          ) ||
          null,

        requestedResult:
          this.normalizeKey(
            appContext.requestedResult
          ) ||
          null,

        constraints:
          null
      };
    }

    return {
      recognized:
        true,

      operation,

      contract,

      cognitiveOperation:
        contract
          .cognitiveOperation,

      domain:
        this.normalizeKey(
          appContext.domain
        ) ||
        contract.domain,

      requestedResult:
        this.normalizeKey(
          appContext.requestedResult
        ) ||
        contract.requestedResult,

      constraints: {
        readOnly:
          contract.readOnly ===
          true,

        doNotLog:
          appContext.doNotLog ===
            true ||
          contract.readOnly ===
            true,

        allowDirectWrite:
          contract.allowDirectWrite ===
          true,

        allowPendingAction:
          contract.allowPendingAction ===
          true,

        requireConfirmationBeforeWrite:
          contract
            .requireConfirmationBeforeWrite ===
          true
      }
    };
  },

  /* =====================================================
     PROMPT CONTRACT
  ===================================================== */

  getPromptContract() {
    return {
      schema:
        "ari.application_operation_prompt_contract",

      schemaVersion:
        this.schemaVersion,

      registryVersion:
        this.version,

      allowedApplicationOperations:
        Object.keys(
          this.operations
        ),

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
                domain:
                  definition.domain,

                cognitiveOperation:
                  definition
                    .cognitiveOperation,

                requestedResult:
                  definition
                    .requestedResult,

                requestKind:
                  definition.requestKind,

                readOnly:
                  definition.readOnly,

                allowDirectWrite:
                  definition
                    .allowDirectWrite,

                allowPendingAction:
                  definition
                    .allowPendingAction,

                requireConfirmationBeforeWrite:
                  definition
                    .requireConfirmationBeforeWrite,

                requiredInputFields:
                  [
                    ...(
                      definition
                        .requiredInputFields ||
                      []
                    )
                  ],

                resultContract:
                  definition
                    .resultContract
              }
            ]
          )
        ),

      rules: [
        "Application operations come from trusted application context, not user-text inference.",
        "Map each application operation to one registered canonical cognitive operation.",
        "Application operations may specialize domain and output shape without changing canonical cognitive vocabulary.",
        "Read-only operations must not create direct writes or pending actions.",
        "A write may occur only after explicit user confirmation in the application."
      ],

      source:
        this.source
    };
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validateRegistry() {
    const errors = [];
    const warnings = [];

    const cognitiveRegistry =
      window.AriOperationRegistry ||
      window.Ari
        ?.operationRegistry ||
      null;

    const requiredFields = [
      "domain",
      "cognitiveOperation",
      "requestedResult",
      "requestKind",
      "readOnly",
      "allowDirectWrite",
      "allowPendingAction",
      "requireConfirmationBeforeWrite",
      "requiredInputFields",
      "resultContract"
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
          `application_operation_definition_invalid:${operation}`
        );

        continue;
      }

      for (
        const field
        of requiredFields
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
            `application_operation_field_missing:${operation}:${field}`
          );
        }
      }

      if (
        this.normalizeKey(
          operation
        ) !==
        operation
      ) {
        warnings.push(
          `application_operation_name_not_normalized:${operation}`
        );
      }

      if (
        !Array.isArray(
          definition
            .requiredInputFields
        )
      ) {
        errors.push(
          `application_operation_required_input_fields_invalid:${operation}`
        );
      }

      if (
        definition.readOnly ===
          true &&
        definition.allowDirectWrite ===
          true
      ) {
        errors.push(
          `read_only_operation_allows_direct_write:${operation}`
        );
      }

      if (
        definition.readOnly ===
          true &&
        definition.allowPendingAction ===
          true
      ) {
        errors.push(
          `read_only_operation_allows_pending_action:${operation}`
        );
      }

      if (
        cognitiveRegistry &&
        typeof cognitiveRegistry
          .hasOperation ===
          "function" &&
        !cognitiveRegistry
          .hasOperation(
            definition
              .cognitiveOperation
          )
      ) {
        errors.push(
          `canonical_cognitive_operation_missing:${operation}:${definition.cognitiveOperation}`
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
          `application_alias_target_missing:${alias}:${target}`
        );
      }

      if (
        this.normalizeKey(
          alias
        ) !==
        alias
      ) {
        warnings.push(
          `application_alias_name_not_normalized:${alias}`
        );
      }
    }

    if (
      !cognitiveRegistry ||
      typeof cognitiveRegistry
        .hasOperation !==
        "function"
    ) {
      warnings.push(
        "AriOperationRegistry_not_available_during_validation"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      ready:
        errors.length ===
          0 &&
        warnings.length ===
          0,

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

  /* =====================================================
     AUTHORITY
  ===================================================== */

  authority: {
    canDefineApplicationOperations:
      true,

    canMapToCanonicalCognitiveOperations:
      true,

    canNormalizeControlledAliases:
      true,

    canResolveTrustedApplicationContext:
      true,

    canExposePromptContract:
      true,

    canValidateRegistry:
      true,

    canInferOperationFromUserText:
      false,

    canSelectSemanticOperation:
      false,

    canExecuteApplicationActions:
      false,

    canWriteApplicationData:
      false,

    canAccessSupabase:
      false,

    canGenerateResponse:
      false,

    role:
      "application_operation_contract_registry"
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  normalizeKey(
    value = ""
  ) {
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

  unique(
    values = []
  ) {
    return [
      ...new Set(
        values.filter(
          Boolean
        )
      )
    ];
  }
};

window.Ari.applicationOperationRegistry =
  window.AriApplicationOperationRegistry;

const ariApplicationOperationRegistryValidation =
  window.AriApplicationOperationRegistry
    .validateRegistry();

console.log(
  "ARI APPLICATION OPERATION REGISTRY LOADED:",
  window.AriApplicationOperationRegistry
    ?.version
);

console.log(
  "ARI APPLICATION OPERATION REGISTRY VALIDATION:",
  ariApplicationOperationRegistryValidation
);
