// ari/bridge/ari-runtime-readiness.js
// Ari Runtime Readiness
//
// Purpose:
// Validate that the current Ari Rebirth runtime is loaded, callable,
// contract-compatible, and ready before the App Bridge executes a turn.
//
// V2.0.0 — Rebirth-Native Runtime Readiness / Realization Architecture
//
// Architectural flow:
//
// Ari Rebirth App Bridge
//      ↓
// Ari Runtime Readiness
//      ↓
// Runtime Component Registry
//      ↓
// Component Inspection
//      ↓
// Five-Layer Contract Validation
//      ↓
// Rebirth Expression Path Validation
//      ↓
// Readiness Result
//
// Responsibilities:
// - Locate the canonical Ari Rebirth runtime components.
// - Verify Conversation Operating State availability.
// - Verify runtime request and delivery boundary services.
// - Verify the five required runtime layers.
// - Verify the master Ari Rebirth Pipeline.
// - Verify the active Rebirth Expression pathway.
// - Run component-level validate() methods when available.
// - Preserve warnings separately from fatal readiness errors.
// - Return one normalized readiness contract.
// - Provide diagnostics suitable for Ari Lab and the App Bridge.
//
// Active Expression architecture:
//
// Ari Character Stage
//      ↓
// Ari Language Guidance Stage
//      ↓
// Ari Response Realization Stage
//      ↓
// Ari Response Realization Engine
//      ↓
// Ari Language Composer
//      ↓
// Ari Final Composition Stage
//
// Removed legacy requirements:
// - AriDraftGenerationStage
// - AriDraftArbitrationStage
// - AriComposerBridge
// - AriBlueprintWriter
// - AriAIWriter
// - AriResponseCandidateArbiter
//
// Non-responsibilities:
// - Does not load scripts.
// - Does not execute the master pipeline.
// - Does not build runtime requests.
// - Does not classify the conversation.
// - Does not interpret semantic meaning.
// - Does not resolve continuity.
// - Does not determine safety severity.
// - Does not determine developer relevance.
// - Does not create a response plan.
// - Does not create response realization packets.
// - Does not generate, select, or rewrite a response.
// - Does not adapt Delivery output.
// - Does not persist runtime state.
// - Does not access Supabase.

window.Ari = window.Ari || {};

window.AriRuntimeReadiness = {
  version: "2.0.0",
  schemaVersion: "2.1.0",
  source: "ari-runtime-readiness",
  authorityLevel:
    "runtime_boundary_and_component_readiness_validation",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  check(options = {}) {
    const normalizedOptions =
      this.normalizeOptions(
        options
      );

    const registry =
      this.buildRuntimeRegistry();

    const componentResults =
      this.inspectRegistry({
        registry,
        options:
          normalizedOptions
      });

    const requiredFailures =
      componentResults.filter(
        result =>
          result.required === true &&
          result.ready !== true
      );

    const optionalFailures =
      componentResults.filter(
        result =>
          result.required !== true &&
          result.ready !== true
      );

    const contractResults =
      this.validateRuntimeContracts({
        registry,
        componentResults,
        options:
          normalizedOptions
      });

    const contractErrors =
      this.toArray(
        contractResults.errors
      );

    const errors =
      this.uniqueValues([
        ...requiredFailures.map(
          result =>
            result.error ||
            `${result.name}_not_ready`
        ),

        ...contractErrors
      ]);

    const warnings =
      this.uniqueValues([
        ...optionalFailures.map(
          result =>
            result.error ||
            `${result.name}_not_ready`
        ),

        ...this.toArray(
          contractResults.warnings
        )
      ]);

    const ready =
      requiredFailures.length === 0 &&
      contractErrors.length === 0;

    const expressionPathway =
      this.buildExpressionPathwayStatus(
        componentResults
      );

    const readiness = {
      schema:
        "ari_runtime_readiness_result",

      schemaVersion:
        this.schemaVersion,

      ready,

      source:
        this.source,

      version:
        this.version,

      checkedAt:
        new Date()
          .toISOString(),

      reason:
        this.resolveReadinessReason({
          ready,
          requiredFailures,
          contractErrors
        }),

      error:
        errors[0] ||
        null,

      errors,

      warnings,

      missing:
        requiredFailures
          .filter(
            result =>
              result.present !== true
          )
          .map(
            result =>
              result.name
          ),

      invalid:
        requiredFailures
          .filter(
            result =>
              result.present === true &&
              result.ready !== true
          )
          .map(
            result =>
              result.name
          ),

      checkedComponents:
        componentResults.map(
          result =>
            result.name
        ),

      components:
        componentResults,

      runtime:
        this.buildRuntimeStatus(
          componentResults
        ),

      supportServices:
        this.buildSupportServiceStatus(
          componentResults
        ),

      expressionPathway,

      contracts:
        contractResults,

      diagnostics: {
        requiredComponentCount:
          componentResults.filter(
            result =>
              result.required === true
          ).length,

        optionalComponentCount:
          componentResults.filter(
            result =>
              result.required !== true
          ).length,

        readyComponentCount:
          componentResults.filter(
            result =>
              result.ready === true
          ).length,

        failedComponentCount:
          componentResults.filter(
            result =>
              result.ready !== true
          ).length,

        fatalComponentFailureCount:
          requiredFailures.length,

        optionalComponentFailureCount:
          optionalFailures.length,

        fatalContractErrorCount:
          contractErrors.length,

        runtimeArchitecture:
          "canonical-five-layer-rebirth-runtime",

        expressionArchitecture:
          expressionPathway
            .architecture,

        expressionMigrationState:
          "realization_native",

        legacyExpressionDependenciesRequired:
          false,

        strictValidation:
          normalizedOptions
            .strictValidation === true,

        runtimeDeliveryRequired:
          normalizedOptions
            .requireRuntimeDelivery === true
      },

      authority:
        this.getAuthorityBoundaries()
    };

    window.Ari.runtimeReadinessState =
      readiness;

    return readiness;
  },

  /* =====================================================
     RUNTIME REGISTRY
  ===================================================== */

  buildRuntimeRegistry() {
    return [
      // =================================================
      // RUNTIME FOUNDATION
      // =================================================

      {
        name:
          "AriConversationOperatingState",

        group:
          "runtime_foundation",

        required:
          true,

        component:
          window
            .AriConversationOperatingState ||
          window.Ari
            ?.conversationOperatingState ||
          null,

        methods: [
          "beginTurn",
          "completeTurn"
        ],

        validateMethod:
          "validate",

        role:
          "conversation_operating_state_authority"
      },

      // =================================================
      // BRIDGE SUPPORT SERVICES
      // =================================================

      {
        name:
          "AriRuntimeRequest",

        group:
          "bridge_support",

        required:
          true,

        component:
          window
            .AriRuntimeRequest ||
          window.Ari
            ?.runtimeRequest ||
          null,

        methods: [
          "build"
        ],

        validateMethod:
          "validate",

        role:
          "canonical_runtime_request_builder"
      },

      {
        name:
          "AriRuntimeDelivery",

        group:
          "bridge_support",

        required:
          false,

        conditionallyRequiredBy:
          "requireRuntimeDelivery",

        component:
          window
            .AriRuntimeDelivery ||
          window.Ari
            ?.runtimeDelivery ||
          null,

        methods: [
          "read",
          "adapt"
        ],

        validateMethod:
          "validate",

        role:
          "authoritative_runtime_delivery_adapter"
      },

      // =================================================
      // FIVE-LAYER RUNTIME
      // =================================================

      {
        name:
          "AriPerceptionPipeline",

        group:
          "five_layer_runtime",

        layer:
          "perception",

        required:
          true,

        component:
          window
            .AriPerceptionPipeline ||
          window.Ari
            ?.perceptionPipeline ||
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "perception_pipeline"
      },

      {
        name:
          "AriExecutiveRoutingPipeline",

        group:
          "five_layer_runtime",

        layer:
          "executiveRouting",

        required:
          true,

        component:
          window
            .AriExecutiveRoutingPipeline ||
          window.Ari
            ?.executiveRoutingPipeline ||
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "executive_routing_pipeline"
      },

      {
        name:
          "AriDeliberationPipeline",

        group:
          "five_layer_runtime",

        layer:
          "deliberation",

        required:
          true,

        component:
          window
            .AriDeliberationPipeline ||
          window.Ari
            ?.deliberationPipeline ||
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "deliberation_pipeline"
      },

      {
        name:
          "AriExpressionPipeline",

        group:
          "five_layer_runtime",

        layer:
          "expression",

        required:
          true,

        component:
          window
            .AriExpressionPipeline ||
          window.Ari
            ?.expressionPipeline ||
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "expression_pipeline"
      },

      {
        name:
          "AriDeliveryPipeline",

        group:
          "five_layer_runtime",

        layer:
          "delivery",

        required:
          true,

        component:
          window
            .AriDeliveryPipeline ||
          window.Ari
            ?.deliveryPipeline ||
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "delivery_pipeline"
      },

      // =================================================
      // MASTER RUNTIME
      // =================================================

      {
        name:
          "AriRebirthPipeline",

        group:
          "master_runtime",

        required:
          true,

        component:
          window
            .AriRebirthPipeline ||
          window.Ari
            ?.rebirthPipeline ||
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "canonical_master_pipeline"
      },

      // =================================================
      // REBIRTH EXPRESSION PATHWAY
      // =================================================

      {
        name:
          "AriCharacterStage",

        group:
          "expression_pathway",

        required:
          true,

        component:
          window
            .AriCharacterStage ||
          window.Ari
            ?.characterStage ||
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "character_expression_stage"
      },

      {
        name:
          "AriLanguageGuidanceStage",

        group:
          "expression_pathway",

        required:
          true,

        component:
          window
            .AriLanguageGuidanceStage ||
          window.Ari
            ?.languageGuidanceStage ||
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "language_guidance_stage"
      },

      {
        name:
          "AriResponseRealizationStage",

        group:
          "expression_pathway",

        required:
          true,

        component:
          window
            .AriResponseRealizationStage ||
          window.Ari
            ?.responseRealizationStage ||
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "response_realization_stage"
      },

      {
        name:
          "AriResponseRealizationEngine",

        group:
          "expression_pathway",

        required:
          true,

        component:
          window
            .AriResponseRealizationEngine ||
          window.Ari
            ?.responseRealizationEngine ||
          null,

        methods: [
          "realize"
        ],

        alternateMethods: [
          "run",
          "build"
        ],

        validateMethod:
          "validate",

        role:
          "response_realization_engine"
      },

      {
        name:
          "AriLanguageComposer",

        group:
          "expression_pathway",

        required:
          true,

        component:
          window
            .AriLanguageComposer ||
          window.Ari
            ?.languageComposer ||
          null,

        methods: [
          "compose"
        ],

        alternateMethods: [
          "run",
          "build"
        ],

        validateMethod:
          "validate",

        role:
          "language_composition_engine"
      },

      {
        name:
          "AriFinalCompositionStage",

        group:
          "expression_pathway",

        required:
          true,

        component:
          window
            .AriFinalCompositionStage ||
          window.Ari
            ?.finalCompositionStage ||
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "final_composition_stage"
      },

      // =================================================
      // KNOWLEDGE / MODEL SUPPORT
      // =================================================

      {
        name:
          "AriOpenAIKnowledgeClient",

        group:
          "model_support",

        required:
          false,

        component:
          window
            .AriOpenAIKnowledgeClient ||
          window.Ari
            ?.openAIKnowledgeClient ||
          window.Ari
            ?.openaiKnowledgeClient ||
          null,

        methods: [
          "ask"
        ],

        validateMethod:
          "validate",

        role:
          "openai_model_client"
      }
    ];
  },

  /* =====================================================
     COMPONENT INSPECTION
  ===================================================== */

  inspectRegistry({
    registry = [],
    options = {}
  } = {}) {
    return this.toArray(
      registry
    ).map(
      definition =>
        this.inspectComponent({
          definition,
          options
        })
    );
  },

  inspectComponent({
    definition = {},
    options = {}
  } = {}) {
    const component =
      definition.component ||
      null;

    const required =
      definition.required === true ||
      (
        definition
          .conditionallyRequiredBy &&
        options[
          definition
            .conditionallyRequiredBy
        ] === true
      );

    const present =
      Boolean(
        component
      );

    const requiredMethods =
      this.toArray(
        definition.methods
      );

    const alternateMethods =
      this.toArray(
        definition.alternateMethods
      );

    const availableRequiredMethods =
      present
        ? requiredMethods.filter(
            method =>
              typeof component?.[
                method
              ] ===
              "function"
          )
        : [];

    const missingMethods =
      requiredMethods.filter(
        method =>
          typeof component?.[
            method
          ] !==
          "function"
      );

    const availableAlternateMethods =
      alternateMethods.filter(
        method =>
          typeof component?.[
            method
          ] ===
          "function"
      );

    const alternateMethodAvailable =
      availableAlternateMethods.length >
      0;

    const requiredMethodContractSatisfied =
      requiredMethods.length === 0 ||
      missingMethods.length === 0;

    const alternateContractSatisfied =
      requiredMethods.length === 1 &&
      alternateMethodAvailable;

    const callable =
      present &&
      (
        requiredMethodContractSatisfied ||
        alternateContractSatisfied
      );

    const validation =
      this.runComponentValidation({
        component,
        validateMethod:
          definition.validateMethod,
        strictValidation:
          options.strictValidation
      });

    const validationValid =
      !validation ||
      validation.valid !== false;

    const ready =
      present &&
      callable &&
      validationValid;

    const error =
      this.resolveComponentError({
        definition,
        present,
        callable,
        validation
      });

    return {
      name:
        definition.name ||
        "unknown_component",

      group:
        definition.group ||
        "unknown",

      layer:
        definition.layer ||
        null,

      role:
        definition.role ||
        null,

      required,

      conditionallyRequiredBy:
        definition
          .conditionallyRequiredBy ||
        null,

      present,

      callable,

      ready,

      source:
        component?.source ||
        definition.name ||
        null,

      version:
        component?.version ||
        null,

      schemaVersion:
        component?.schemaVersion ||
        null,

      requiredMethods,

      alternateMethods,

      availableRequiredMethods,

      availableAlternateMethods,

      missingMethods,

      alternateMethodAvailable,

      validationAvailable:
        Boolean(
          validation
        ),

      validation,

      error,

      authority:
        "runtime_component_inspection"
    };
  },

  resolveComponentError({
    definition = {},
    present = false,
    callable = false,
    validation = null
  } = {}) {
    const name =
      definition.name ||
      "unknown_component";

    if (!present) {
      return `${name}_not_loaded`;
    }

    if (!callable) {
      return `${name}_missing_required_method`;
    }

    if (
      validation &&
      validation.valid === false
    ) {
      return `${name}_validation_failed`;
    }

    return null;
  },

  runComponentValidation({
    component = null,
    validateMethod = "validate",
    strictValidation = true
  } = {}) {
    if (
      !component ||
      typeof component[
        validateMethod
      ] !==
      "function"
    ) {
      return null;
    }

    try {
      const result =
        component[
          validateMethod
        ]();

      if (
        !result ||
        typeof result !==
          "object" ||
        Array.isArray(
          result
        )
      ) {
        return {
          valid:
            strictValidation !== true,

          source:
            "ari-runtime-readiness-component-validation",

          errors:
            strictValidation === true
              ? [
                  "component_validate_returned_invalid_result"
                ]
              : [],

          warnings:
            strictValidation === true
              ? []
              : [
                  "component_validate_returned_invalid_result"
                ]
        };
      }

      return {
        ...result,

        valid:
          result.valid !== false,

        errors:
          this.toArray(
            result.errors
          ),

        warnings:
          this.toArray(
            result.warnings
          )
      };
    } catch (error) {
      return {
        valid:
          false,

        source:
          "ari-runtime-readiness-component-validation",

        errors: [
          error?.message ||
          String(
            error
          )
        ],

        warnings: []
      };
    }
  },

  /* =====================================================
     RUNTIME CONTRACT VALIDATION
  ===================================================== */

  validateRuntimeContracts({
    registry = [],
    componentResults = [],
    options = {}
  } = {}) {
    const errors = [];
    const warnings = [];

    const operatingState =
      this.findResult(
        componentResults,
        "AriConversationOperatingState"
      );

    const requestService =
      this.findResult(
        componentResults,
        "AriRuntimeRequest"
      );

    const deliveryService =
      this.findResult(
        componentResults,
        "AriRuntimeDelivery"
      );

    const masterPipeline =
      this.findResult(
        componentResults,
        "AriRebirthPipeline"
      );

    const fiveLayerNames = [
      "AriPerceptionPipeline",
      "AriExecutiveRoutingPipeline",
      "AriDeliberationPipeline",
      "AriExpressionPipeline",
      "AriDeliveryPipeline"
    ];

    const fiveLayerResults =
      fiveLayerNames.map(
        name =>
          this.findResult(
            componentResults,
            name
          )
      );

    const expressionNames = [
      "AriCharacterStage",
      "AriLanguageGuidanceStage",
      "AriResponseRealizationStage",
      "AriResponseRealizationEngine",
      "AriLanguageComposer",
      "AriFinalCompositionStage"
    ];

    const expressionResults =
      expressionNames.map(
        name =>
          this.findResult(
            componentResults,
            name
          )
      );

    if (
      operatingState?.ready !== true
    ) {
      errors.push(
        "conversation_operating_state_not_ready"
      );
    }

    if (
      requestService?.ready !== true
    ) {
      errors.push(
        "runtime_request_service_not_ready"
      );
    }

    if (
      options.requireRuntimeDelivery === true &&
      deliveryService?.ready !== true
    ) {
      errors.push(
        "runtime_delivery_service_not_ready"
      );
    }

    if (
      options.requireRuntimeDelivery !== true &&
      deliveryService?.ready !== true
    ) {
      warnings.push(
        "runtime_delivery_service_not_ready"
      );
    }

    const failedLayers =
      fiveLayerResults.filter(
        result =>
          result?.ready !== true
      );

    if (
      failedLayers.length >
      0
    ) {
      errors.push(
        "one_or_more_five_layer_pipelines_not_ready"
      );

      failedLayers.forEach(
        result => {
          if (result?.name) {
            errors.push(
              `${result.name}_not_ready`
            );
          }
        }
      );
    }

    if (
      masterPipeline?.ready !== true
    ) {
      errors.push(
        "master_pipeline_not_ready"
      );
    }

    const failedExpressionComponents =
      expressionResults.filter(
        result =>
          result?.ready !== true
      );

    if (
      failedExpressionComponents.length >
      0
    ) {
      errors.push(
        "response_realization_expression_pathway_not_ready"
      );

      failedExpressionComponents.forEach(
        result => {
          if (result?.name) {
            errors.push(
              `${result.name}_not_ready`
            );
          }
        }
      );
    }

    const expressionPipeline =
      this.findResult(
        componentResults,
        "AriExpressionPipeline"
      );

    if (
      expressionPipeline?.ready === true &&
      failedExpressionComponents.length >
      0
    ) {
      warnings.push(
        "expression_pipeline_loaded_but_internal_pathway_incomplete"
      );
    }

    const openAIClient =
      this.findResult(
        componentResults,
        "AriOpenAIKnowledgeClient"
      );

    if (
      openAIClient?.ready !== true
    ) {
      warnings.push(
        "openai_knowledge_client_not_ready"
      );
    }

    this.collectValidationDiagnostics({
      componentResults,
      errors,
      warnings,
      strictValidation:
        options.strictValidation
    });

    return {
      valid:
        errors.length === 0,

      source:
        "ari-runtime-readiness-contract-validation",

      version:
        this.version,

      errors:
        this.uniqueValues(
          errors
        ),

      warnings:
        this.uniqueValues(
          warnings
        ),

      checks: {
        conversationOperatingStateReady:
          operatingState?.ready === true,

        runtimeRequestReady:
          requestService?.ready === true,

        runtimeDeliveryReady:
          deliveryService?.ready === true,

        fiveLayerRuntimeReady:
          failedLayers.length === 0,

        perceptionReady:
          this.findResult(
            componentResults,
            "AriPerceptionPipeline"
          )?.ready === true,

        executiveRoutingReady:
          this.findResult(
            componentResults,
            "AriExecutiveRoutingPipeline"
          )?.ready === true,

        deliberationReady:
          this.findResult(
            componentResults,
            "AriDeliberationPipeline"
          )?.ready === true,

        expressionReady:
          expressionPipeline?.ready === true,

        deliveryReady:
          this.findResult(
            componentResults,
            "AriDeliveryPipeline"
          )?.ready === true,

        masterPipelineReady:
          masterPipeline?.ready === true,

        characterStageReady:
          this.findResult(
            componentResults,
            "AriCharacterStage"
          )?.ready === true,

        languageGuidanceStageReady:
          this.findResult(
            componentResults,
            "AriLanguageGuidanceStage"
          )?.ready === true,

        responseRealizationStageReady:
          this.findResult(
            componentResults,
            "AriResponseRealizationStage"
          )?.ready === true,

        responseRealizationEngineReady:
          this.findResult(
            componentResults,
            "AriResponseRealizationEngine"
          )?.ready === true,

        languageComposerReady:
          this.findResult(
            componentResults,
            "AriLanguageComposer"
          )?.ready === true,

        finalCompositionStageReady:
          this.findResult(
            componentResults,
            "AriFinalCompositionStage"
          )?.ready === true,

        expressionPathwayReady:
          failedExpressionComponents.length ===
          0,

        openAIKnowledgeClientReady:
          openAIClient?.ready === true,

        authoritativeDeliveryRequired:
          options.requireRuntimeDelivery ===
          true,

        pipelineSinglePassExpected:
          true,

        legacyDraftArchitectureRequired:
          false
      },

      inspectedRegistryCount:
        this.toArray(
          registry
        ).length,

      authority:
        "runtime_contract_validation"
    };
  },

  collectValidationDiagnostics({
    componentResults = [],
    errors = [],
    warnings = [],
    strictValidation = true
  } = {}) {
    this.toArray(
      componentResults
    ).forEach(
      result => {
        const validation =
          result?.validation;

        if (!validation) {
          return;
        }

        const validationErrors =
          this.toArray(
            validation.errors
          );

        const validationWarnings =
          this.toArray(
            validation.warnings
          );

        if (
          validation.valid === false &&
          result.required === true &&
          strictValidation === true
        ) {
          validationErrors.forEach(
            error => {
              errors.push(
                `${result.name}:${this.extractDiagnosticText(
                  error
                )}`
              );
            }
          );
        } else {
          validationErrors.forEach(
            error => {
              warnings.push(
                `${result.name}:${this.extractDiagnosticText(
                  error
                )}`
              );
            }
          );
        }

        validationWarnings.forEach(
          warning => {
            warnings.push(
              `${result.name}:${this.extractDiagnosticText(
                warning
              )}`
            );
          }
        );
      }
    );
  },

  /* =====================================================
     STATUS BUILDERS
  ===================================================== */

  buildRuntimeStatus(
    componentResults = []
  ) {
    return {
      conversationOperatingState:
        this.findResult(
          componentResults,
          "AriConversationOperatingState"
        ),

      perception:
        this.findResult(
          componentResults,
          "AriPerceptionPipeline"
        ),

      executiveRouting:
        this.findResult(
          componentResults,
          "AriExecutiveRoutingPipeline"
        ),

      deliberation:
        this.findResult(
          componentResults,
          "AriDeliberationPipeline"
        ),

      expression:
        this.findResult(
          componentResults,
          "AriExpressionPipeline"
        ),

      delivery:
        this.findResult(
          componentResults,
          "AriDeliveryPipeline"
        ),

      masterPipeline:
        this.findResult(
          componentResults,
          "AriRebirthPipeline"
        )
    };
  },

  buildSupportServiceStatus(
    componentResults = []
  ) {
    return {
      runtimeRequest:
        this.findResult(
          componentResults,
          "AriRuntimeRequest"
        ),

      runtimeDelivery:
        this.findResult(
          componentResults,
          "AriRuntimeDelivery"
        ),

      openAIKnowledgeClient:
        this.findResult(
          componentResults,
          "AriOpenAIKnowledgeClient"
        ),

      languageComposer:
        this.findResult(
          componentResults,
          "AriLanguageComposer"
        ),

      responseRealizationEngine:
        this.findResult(
          componentResults,
          "AriResponseRealizationEngine"
        )
    };
  },

  /* =====================================================
     EXPRESSION PATHWAY
  ===================================================== */

  buildExpressionPathwayStatus(
    componentResults = []
  ) {
    const characterStage =
      this.findResult(
        componentResults,
        "AriCharacterStage"
      );

    const languageGuidanceStage =
      this.findResult(
        componentResults,
        "AriLanguageGuidanceStage"
      );

    const realizationStage =
      this.findResult(
        componentResults,
        "AriResponseRealizationStage"
      );

    const realizationEngine =
      this.findResult(
        componentResults,
        "AriResponseRealizationEngine"
      );

    const languageComposer =
      this.findResult(
        componentResults,
        "AriLanguageComposer"
      );

    const finalCompositionStage =
      this.findResult(
        componentResults,
        "AriFinalCompositionStage"
      );

    const requiredResults = [
      characterStage,
      languageGuidanceStage,
      realizationStage,
      realizationEngine,
      languageComposer,
      finalCompositionStage
    ];

    const readyCount =
      requiredResults.filter(
        result =>
          result?.ready === true
      ).length;

    const missing =
      requiredResults
        .filter(
          result =>
            result?.present !== true
        )
        .map(
          result =>
            result?.name
        )
        .filter(
          Boolean
        );

    const invalid =
      requiredResults
        .filter(
          result =>
            result?.present === true &&
            result?.ready !== true
        )
        .map(
          result =>
            result?.name
        )
        .filter(
          Boolean
        );

    const ready =
      readyCount ===
      requiredResults.length;

    return {
      architecture:
        ready
          ? "response_realization_pathway"
          : readyCount > 0
            ? "response_realization_pathway_incomplete"
            : "response_realization_pathway_unavailable",

      ready,

      requiredComponentCount:
        requiredResults.length,

      readyComponentCount:
        readyCount,

      missing,

      invalid,

      stages: {
        character:
          characterStage,

        languageGuidance:
          languageGuidanceStage,

        responseRealization:
          realizationStage,

        finalComposition:
          finalCompositionStage
      },

      engines: {
        responseRealization:
          realizationEngine,

        languageComposer:
          languageComposer
      },

      executionOrder: [
        "AriCharacterStage",
        "AriLanguageGuidanceStage",
        "AriResponseRealizationStage",
        "AriResponseRealizationEngine",
        "AriLanguageComposer",
        "AriFinalCompositionStage"
      ],

      legacyPathway: {
        required:
          false,

        active:
          false,

        components: [
          "AriDraftGenerationStage",
          "AriDraftArbitrationStage",
          "AriComposerBridge",
          "AriBlueprintWriter",
          "AriAIWriter",
          "AriResponseCandidateArbiter"
        ]
      },

      authority:
        "rebirth_expression_pathway_readiness_description"
    };
  },

  /* =====================================================
     READINESS REASON
  ===================================================== */

  resolveReadinessReason({
    ready = false,
    requiredFailures = [],
    contractErrors = []
  } = {}) {
    if (ready) {
      return "runtime_ready";
    }

    if (
      this.toArray(
        requiredFailures
      ).length >
      0
    ) {
      return "required_runtime_components_not_ready";
    }

    if (
      this.toArray(
        contractErrors
      ).length >
      0
    ) {
      return "runtime_contract_validation_failed";
    }

    return "runtime_not_ready";
  },

  /* =====================================================
     RESULT HELPERS
  ===================================================== */

  findResult(
    results = [],
    name = ""
  ) {
    return (
      this.toArray(
        results
      ).find(
        result =>
          result?.name ===
          name
      ) ||
      null
    );
  },

  extractDiagnosticText(
    value = null
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value ===
        "string" ||
      typeof value ===
        "number" ||
      typeof value ===
        "boolean"
    ) {
      return String(
        value
      );
    }

    if (
      typeof value ===
      "object"
    ) {
      return String(
        value.message ||
        value.error ||
        value.type ||
        value.reason ||
        value.name ||
        this.safeJSONStringify(
          value
        )
      );
    }

    return "";
  },

  /* =====================================================
     OPTIONS
  ===================================================== */

  normalizeOptions(
    options = {}
  ) {
    if (
      !options ||
      typeof options !==
        "object" ||
      Array.isArray(
        options
      )
    ) {
      return {
        requireRuntimeDelivery:
          false,

        strictValidation:
          true,

        includeOptionalComponents:
          true
      };
    }

    return {
      requireRuntimeDelivery:
        options
          .requireRuntimeDelivery ===
        true,

      strictValidation:
        options
          .strictValidation !==
        false,

      includeOptionalComponents:
        options
          .includeOptionalComponents !==
        false,

      ...options
    };
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canInspectRuntimeComponents:
        true,

      canValidateRuntimeContracts:
        true,

      canRunComponentValidation:
        true,

      canReportMissingComponents:
        true,

      canReportInvalidComponents:
        true,

      canDescribeExpressionArchitecture:
        true,

      canDetermineRuntimeReadiness:
        true,

      canLoadScripts:
        false,

      canBuildRuntimeRequest:
        false,

      canExecuteMasterPipeline:
        false,

      canExecuteRuntimeLayer:
        false,

      canExecuteExpressionStage:
        false,

      canResolveContinuity:
        false,

      canClassifyConversation:
        false,

      canInterpretMeaning:
        false,

      canDetermineDeveloperIntent:
        false,

      canDetermineSafetySeverity:
        false,

      canChooseResponsePlan:
        false,

      canCreateRealizationPacket:
        false,

      canGenerateResponse:
        false,

      canSelectResponse:
        false,

      canComposeFinalResponse:
        false,

      canReadDeliveryResult:
        false,

      canAdaptApplicationResponse:
        false,

      canExecuteActions:
        false,

      canRetrieveMemory:
        false,

      canStoreMemory:
        false,

      canAccessSupabase:
        false,

      canPersistState:
        false,

      role:
        "runtime_boundary_and_component_readiness_validation"
    };
  },

  cannotSet() {
    return [
      "conversationFunction",
      "semanticMeaning",
      "routingDecision",
      "primaryLane",
      "riskLevel",
      "safetyDisposition",
      "developerIntent",
      "resolvedUserQuestion",
      "canonicalResponsePlan",
      "responseGoal",
      "responseShape",
      "responseMoves",
      "characterPacket",
      "languageGuidance",
      "realizationPacket",
      "realizationResponseText",
      "responseRealizationResult",
      "finalCompositionHandoff",
      "finalResponse",
      "deliveryResult",
      "finalEmotion",
      "approvedActions",
      "memorySaveDecision",
      "toolExecutionDecision"
    ];
  },

  validate() {
    const authority =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canLoadScripts",
      "canBuildRuntimeRequest",
      "canExecuteMasterPipeline",
      "canExecuteRuntimeLayer",
      "canExecuteExpressionStage",
      "canResolveContinuity",
      "canClassifyConversation",
      "canInterpretMeaning",
      "canDetermineDeveloperIntent",
      "canDetermineSafetySeverity",
      "canChooseResponsePlan",
      "canCreateRealizationPacket",
      "canGenerateResponse",
      "canSelectResponse",
      "canComposeFinalResponse",
      "canReadDeliveryResult",
      "canAdaptApplicationResponse",
      "canExecuteActions",
      "canRetrieveMemory",
      "canStoreMemory",
      "canAccessSupabase",
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

    return {
      valid:
        errors.length ===
        0,

      source:
        "ari-runtime-readiness-validation",

      version:
        this.version,

      errors,

      warnings: [],

      checks: {
        runtimeInspectionEnabled:
          authority
            .canInspectRuntimeComponents ===
          true,

        contractValidationEnabled:
          authority
            .canValidateRuntimeContracts ===
          true,

        componentValidationEnabled:
          authority
            .canRunComponentValidation ===
          true,

        readinessAuthorityEnabled:
          authority
            .canDetermineRuntimeReadiness ===
          true,

        expressionArchitectureDescriptionEnabled:
          authority
            .canDescribeExpressionArchitecture ===
          true,

        scriptLoadingDisabled:
          authority
            .canLoadScripts ===
          false,

        requestBuildingDisabled:
          authority
            .canBuildRuntimeRequest ===
          false,

        pipelineExecutionDisabled:
          authority
            .canExecuteMasterPipeline ===
          false,

        runtimeLayerExecutionDisabled:
          authority
            .canExecuteRuntimeLayer ===
          false,

        expressionStageExecutionDisabled:
          authority
            .canExecuteExpressionStage ===
          false,

        responseGenerationDisabled:
          authority
            .canGenerateResponse ===
          false,

        finalCompositionDisabled:
          authority
            .canComposeFinalResponse ===
          false,

        deliveryAdaptationDisabled:
          authority
            .canAdaptApplicationResponse ===
          false,

        persistenceDisabled:
          authority
            .canPersistState ===
          false,

        legacyDraftGenerationRemoved:
          true,

        realizationNativeArchitecture:
          true
      }
    };
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

  toArray(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
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

    return [
      value
    ];
  },

  uniqueValues(
    values = []
  ) {
    const output = [];
    const seen =
      new Set();

    this.toArray(
      values
    ).forEach(
      value => {
        const key =
          typeof value ===
            "string"
            ? value
            : this.safeJSONStringify(
                value
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
          _key,
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
    } catch (_error) {
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

  normalizeText(
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
        /\s+/g,
        " "
      )
      .trim();
  }
};

window.Ari.runtimeReadiness =
  window.AriRuntimeReadiness;

const ariRuntimeReadinessValidation =
  window.AriRuntimeReadiness
    ?.validate?.();

console.log(
  "ARI RUNTIME READINESS LOADED:",
  window.AriRuntimeReadiness
    ?.version,

  ariRuntimeReadinessValidation
    ?.valid === true
    ? "READY"
    : "INVALID",

  ariRuntimeReadinessValidation
);