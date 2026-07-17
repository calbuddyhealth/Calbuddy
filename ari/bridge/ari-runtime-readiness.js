// ari/bridge/ari-runtime-readiness.js
// Ari Runtime Readiness
//
// Purpose:
// Validate that the current Ari Rebirth runtime is loaded, callable,
// contract-compatible, and ready before the App Bridge executes a turn.
//
// V1.0.1 — Public Runtime Boundary Validation / Internal Dependency Diagnostics
//
// Architectural flow:
//
// Ari Rebirth App Bridge
//      ↓
// Ari Runtime Readiness
//      ↓
// Runtime Component Inspection
//      ↓
// Five-Layer Contract Validation
//      ↓
// Readiness Result
//
// Responsibilities:
// - Locate the current canonical runtime components.
// - Verify Conversation Operating State availability.
// - Verify the five required pipeline layers.
// - Verify the master Ari Rebirth Pipeline.
// - Run component-level validate() methods when available.
// - Verify the current Expression pathway dependencies.
// - Verify the runtime request and delivery support services.
// - Return one normalized readiness contract.
// - Preserve warnings separately from fatal readiness errors.
// - Provide diagnostics suitable for Ari Lab and the App Bridge.
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
// - Does not create a Composer Packet.
// - Does not generate or select a response.
// - Does not adapt Delivery output.
// - Does not persist runtime state.
// - Does not access Supabase.

window.Ari = window.Ari || {};

window.AriRuntimeReadiness = {
  version: "1.0.1",
  schemaVersion: "2.0.0",
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

    const fatalResults =
      componentResults.filter(
        result =>
          result.required ===
            true &&
          result.ready !==
            true
      );

    const optionalFailures =
      componentResults.filter(
        result =>
          result.required !==
            true &&
          result.ready !==
            true
      );

    const contractResults =
      this.validateRuntimeContracts({
        registry,
        componentResults,
        options:
          normalizedOptions
      });

    const fatalContractErrors =
      this.toArray(
        contractResults.errors
      );

    const ready =
      fatalResults.length ===
        0 &&
      fatalContractErrors.length ===
        0;

    const errors =
      this.uniqueValues([
        ...fatalResults.map(
          result =>
            result.error ||
            `${result.name}_not_ready`
        ),

        ...fatalContractErrors
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
        ready
          ? "runtime_ready"
          : fatalResults.length >
              0
            ? "required_runtime_components_not_ready"
            : "runtime_contract_validation_failed",

      error:
        errors[0] ||
        null,

      errors,

      warnings,

      missing:
        fatalResults
          .filter(
            result =>
              result.present !==
              true
          )
          .map(
            result =>
              result.name
          ),

      invalid:
        fatalResults
          .filter(
            result =>
              result.present ===
                true &&
              result.ready !==
                true
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

      runtime: {
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
      },

      supportServices: {
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

        languageComposer:
          this.findResult(
            componentResults,
            "AriLanguageComposer"
          ),

        finalCompositionStage:
          this.findResult(
            componentResults,
            "AriFinalCompositionStage"
          )
      },

      expressionPathway:
        this.buildExpressionPathwayStatus(
          componentResults
        ),

      contracts:
        contractResults,

      diagnostics: {
        requiredComponentCount:
          componentResults.filter(
            result =>
              result.required ===
              true
          ).length,

        optionalComponentCount:
          componentResults.filter(
            result =>
              result.required !==
              true
          ).length,

        readyComponentCount:
          componentResults.filter(
            result =>
              result.ready ===
              true
          ).length,

        fatalComponentFailureCount:
          fatalResults.length,

        optionalComponentFailureCount:
          optionalFailures.length,

        fatalContractErrorCount:
          fatalContractErrors.length,

        runtimeArchitecture:
          "canonical-five-layer-with-conversation-operating-state",

        currentExpressionArchitecture:
          this.resolveExpressionArchitecture(
            componentResults
          )
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
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "delivery_pipeline"
      },

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
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "canonical_master_pipeline"
      },

      /*
       * Runtime Request is required after the App Bridge
       * migration begins because the bridge delegates request
       * construction to this service.
       */

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
          "runtime_request_builder"
      },

      /*
       * Runtime Delivery becomes required once File 3 is added.
       *
       * During the short interval between File 2 and File 3,
       * it is treated as optional so this file can be loaded and
       * inspected independently. The updated App Bridge will call
       * check({ requireRuntimeDelivery: true }).
       */

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
          "runtime_delivery_adapter"
      },

      /*
       * Current production Expression pathway.
       *
       * The existing pipeline still routes through Final
       * Composition and Ari Language Composer. These remain
       * required until Response Realization replaces them.
       */

      {
        name:
          "AriFinalCompositionStage",

        group:
          "expression_support",

        required:
          true,

        component:
          window
            .AriFinalCompositionStage ||
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "final_composition_stage"
      },

      {
        name:
          "AriLanguageComposer",

        group:
          "expression_support",

        required:
          true,

        component:
          window
            .AriLanguageComposer ||
          null,

        methods: [
          "compose"
        ],

        validateMethod:
          "validate",

        role:
          "final_language_composer"
      },

      /*
       * Current legacy candidate pathway.
       *
       * These are required for the pipeline that exists today.
       * They will not be removed from readiness until the
       * Response Realization pathway is installed and tested.
       */

      {
        name:
          "AriDraftGenerationStage",

        group:
          "legacy_expression_pathway",

        required:
          true,

        component:
          window
            .AriDraftGenerationStage ||
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "draft_generation_stage"
      },

      {
        name:
          "AriDraftArbitrationStage",

        group:
          "legacy_expression_pathway",

        required:
          true,

        component:
          window
            .AriDraftArbitrationStage ||
          null,

        methods: [
          "run"
        ],

        validateMethod:
          "validate",

        role:
          "draft_arbitration_stage"
      },

      {
        name:
          "AriComposerBridge",

        group:
          "legacy_expression_pathway",

        required:
          true,

        component:
          window
            .AriComposerBridge ||
          null,

        methods: [
          "build"
        ],

        validateMethod:
          "validate",

        role:
          "composer_packet_builder"
      },

      {
        name:
          "AriBlueprintWriter",

        group:
          "legacy_expression_pathway",

        required:
          true,

        component:
          window
            .AriBlueprintWriter ||
          null,

        methods: [
          "write"
        ],

        validateMethod:
          "validate",

        role:
          "deterministic_blueprint_writer"
      },

      {
        name:
          "AriAIWriter",

        group:
          "legacy_expression_pathway",

        required:
          true,

        component:
          window
            .AriAIWriter ||
          null,

        methods: [
          "write"
        ],

        validateMethod:
          "validate",

        role:
          "ai_candidate_writer"
      },

      {
  name:
    "AriResponseCandidateArbiter",

  group:
    "legacy_expression_pathway",

  /*
   * This is an internal Expression dependency.
   *
   * Runtime Readiness records its availability for diagnostics,
   * but the Expression Pipeline owns enforcement of its exact
   * callable contract.
   */
  required:
    false,

  component:
    window
      .AriResponseCandidateArbiter ||
    null,

  /*
   * Do not guess the Arbiter's production entry method here.
   * Its own validate() method and the Expression Pipeline are
   * responsible for validating its internal contract.
   */
  methods: [],

  validateMethod:
    "validate",

  role:
    "response_candidate_arbiter"
},

      /*
       * Future Response Realization pathway.
       *
       * These remain optional until we intentionally migrate
       * the Expression pipeline.
       */

      {
        name:
          "AriResponseRealizationStage",

        group:
          "future_expression_pathway",

        required:
          false,

        component:
          window
            .AriResponseRealizationStage ||
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
          "future_expression_pathway",

        required:
          false,

        component:
          window
            .AriResponseRealizationEngine ||
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
      definition.required ===
        true ||
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
        definition
          .alternateMethods
      );

    const missingMethods =
      present
        ? requiredMethods.filter(
            method =>
              typeof component[
                method
              ] !==
              "function"
          )
        : requiredMethods;

    const alternateMethodAvailable =
      alternateMethods.some(
        method =>
          typeof component?.[
            method
          ] ===
          "function"
      );

    const callable =
      present &&
      (
        missingMethods.length ===
          0 ||
        (
          requiredMethods.length ===
            1 &&
          alternateMethodAvailable
        )
      );

    const validation =
      this.runComponentValidation({
        component,
        validateMethod:
          definition
            .validateMethod
      });

    const validationValid =
      !validation ||
      validation.valid !==
        false;

    const ready =
      present &&
      callable &&
      validationValid;

    let error =
      null;

    if (!present) {
      error =
        `${definition.name}_not_loaded`;
    } else if (!callable) {
      error =
        `${definition.name}_missing_required_method`;
    } else if (
      validation &&
      validation.valid ===
        false
    ) {
      error =
        `${definition.name}_validation_failed`;
    }

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
        component
          ?.schemaVersion ||
        null,

      requiredMethods,

      alternateMethods,

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

  runComponentValidation({
    component = null,
    validateMethod = "validate"
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
            false,

          errors: [
            "component_validate_returned_invalid_result"
          ],

          warnings: []
        };
      }

      return {
        ...result,

        valid:
          result.valid !==
          false,

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

    if (
      operatingState?.ready !==
      true
    ) {
      errors.push(
        "conversation_operating_state_not_ready"
      );
    }

    const failedLayers =
      fiveLayerResults.filter(
        result =>
          result?.ready !==
          true
      );

    if (
      failedLayers.length >
      0
    ) {
      errors.push(
        "one_or_more_five_layer_pipelines_not_ready"
      );
    }

    if (
      masterPipeline?.ready !==
      true
    ) {
      errors.push(
        "master_pipeline_not_ready"
      );
    }

    const requestService =
      this.findResult(
        componentResults,
        "AriRuntimeRequest"
      );

    if (
      requestService?.ready !==
      true
    ) {
      errors.push(
        "runtime_request_service_not_ready"
      );
    }

    const deliveryService =
      this.findResult(
        componentResults,
        "AriRuntimeDelivery"
      );

    if (
      options
        .requireRuntimeDelivery ===
        true &&
      deliveryService?.ready !==
        true
    ) {
      errors.push(
        "runtime_delivery_service_not_ready"
      );
    } else if (
      options
        .requireRuntimeDelivery !==
        true &&
      deliveryService?.ready !==
        true
    ) {
      warnings.push(
        "runtime_delivery_service_not_loaded_yet"
      );
    }

    const expressionArchitecture =
      this.resolveExpressionArchitecture(
        componentResults
      );

    if (
  expressionArchitecture ===
  "legacy_candidate_pathway_incomplete"
) {
  warnings.push(
    "legacy_expression_pathway_incomplete"
  );
}

    if (
      expressionArchitecture ===
      "response_realization_partial"
    ) {
      warnings.push(
        "response_realization_pathway_partially_loaded"
      );
    }

    if (
      expressionArchitecture ===
      "legacy_candidate_pathway"
    ) {
      warnings.push(
        "legacy_expression_pathway_active"
      );
    }

    if (
      expressionArchitecture ===
      "mixed_expression_architecture"
    ) {
      warnings.push(
        "legacy_and_response_realization_components_loaded_together"
      );
    }

    const masterValidation =
      masterPipeline
        ?.validation;

    if (
      masterValidation &&
      masterValidation.valid ===
        false
    ) {
      errors.push(
        ...this.toArray(
          masterValidation.errors
        )
      );
    }

    componentResults.forEach(
      result => {
        if (
          result?.validation
            ?.warnings
            ?.length
        ) {
          warnings.push(
            ...result.validation
              .warnings
              .map(
                warning =>
                  `${result.name}:${this.extractDiagnosticText(
                    warning
                  )}`
              )
          );
        }
      }
    );

    return {
      valid:
        errors.length ===
        0,

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
          operatingState?.ready ===
          true,

        fiveLayerRuntimeReady:
          failedLayers.length ===
          0,

        perceptionReady:
          this.findResult(
            componentResults,
            "AriPerceptionPipeline"
          )?.ready ===
          true,

        executiveRoutingReady:
          this.findResult(
            componentResults,
            "AriExecutiveRoutingPipeline"
          )?.ready ===
          true,

        deliberationReady:
          this.findResult(
            componentResults,
            "AriDeliberationPipeline"
          )?.ready ===
          true,

        expressionReady:
          this.findResult(
            componentResults,
            "AriExpressionPipeline"
          )?.ready ===
          true,

        deliveryReady:
          this.findResult(
            componentResults,
            "AriDeliveryPipeline"
          )?.ready ===
          true,

        masterPipelineReady:
          masterPipeline?.ready ===
          true,

        runtimeRequestReady:
          requestService?.ready ===
          true,

        runtimeDeliveryReady:
          deliveryService?.ready ===
          true,

        currentExpressionArchitecture:
          expressionArchitecture,

        authoritativeDeliveryRequired:
          true,

        pipelineSinglePassExpected:
          true
      },

      inspectedRegistryCount:
        this.toArray(
          registry
        ).length,

      authority:
        "runtime_contract_validation"
    };
  },

  /* =====================================================
     EXPRESSION PATHWAY
  ===================================================== */

  buildExpressionPathwayStatus(
    componentResults = []
  ) {
    const names = {
      finalComposition:
        "AriFinalCompositionStage",

      languageComposer:
        "AriLanguageComposer",

      draftGeneration:
        "AriDraftGenerationStage",

      draftArbitration:
        "AriDraftArbitrationStage",

      composerBridge:
        "AriComposerBridge",

      blueprintWriter:
        "AriBlueprintWriter",

      aiWriter:
        "AriAIWriter",

      candidateArbiter:
        "AriResponseCandidateArbiter",

      realizationStage:
        "AriResponseRealizationStage",

      realizationEngine:
        "AriResponseRealizationEngine"
    };

    const result = {};

    Object.entries(
      names
    ).forEach(
      ([
        key,
        name
      ]) => {
        result[key] =
          this.findResult(
            componentResults,
            name
          );
      }
    );

    return {
      architecture:
        this.resolveExpressionArchitecture(
          componentResults
        ),

      currentProductionPath: {
        finalComposition:
          result.finalComposition,

        languageComposer:
          result.languageComposer,

        draftGeneration:
          result.draftGeneration,

        draftArbitration:
          result.draftArbitration,

        composerBridge:
          result.composerBridge,

        blueprintWriter:
          result.blueprintWriter,

        aiWriter:
          result.aiWriter,

        candidateArbiter:
          result.candidateArbiter
      },

      futureRealizationPath: {
        realizationStage:
          result.realizationStage,

        realizationEngine:
          result.realizationEngine
      },

      migrationReady:
        result
          .realizationStage
          ?.ready ===
          true &&
        result
          .realizationEngine
          ?.ready ===
          true &&
        result
          .languageComposer
          ?.ready ===
          true &&
        result
          .finalComposition
          ?.ready ===
          true,

      authority:
        "expression_pathway_readiness_description"
    };
  },

  resolveExpressionArchitecture(
    componentResults = []
  ) {
    const legacyNames = [
      "AriDraftGenerationStage",
      "AriDraftArbitrationStage",
      "AriComposerBridge",
      "AriBlueprintWriter",
      "AriAIWriter",
      "AriResponseCandidateArbiter"
    ];

    const realizationNames = [
      "AriResponseRealizationStage",
      "AriResponseRealizationEngine"
    ];

    const legacyResults =
      legacyNames.map(
        name =>
          this.findResult(
            componentResults,
            name
          )
      );

    const realizationResults =
      realizationNames.map(
        name =>
          this.findResult(
            componentResults,
            name
          )
      );

    const legacyReadyCount =
      legacyResults.filter(
        result =>
          result?.ready ===
          true
      ).length;

    const realizationReadyCount =
      realizationResults.filter(
        result =>
          result?.ready ===
          true
      ).length;

    const legacyComplete =
      legacyReadyCount ===
      legacyNames.length;

    const realizationComplete =
      realizationReadyCount ===
      realizationNames.length;

    if (
      legacyComplete &&
      realizationComplete
    ) {
      return "mixed_expression_architecture";
    }

    if (realizationComplete) {
      return "response_realization_pathway";
    }

    if (
      realizationReadyCount >
      0
    ) {
      return "response_realization_partial";
    }

    if (legacyComplete) {
      return "legacy_candidate_pathway";
    }

    if (
      legacyReadyCount >
      0
    ) {
      return "legacy_candidate_pathway_incomplete";
    }

    return "expression_pathway_unavailable";
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
      value ===
        null ||
      value ===
        undefined
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
      return {};
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

      canCreateComposerPacket:
        false,

      canGenerateResponseCandidate:
        false,

      canSelectResponseCandidate:
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
      "composerPacket",
      "candidateDrafts",
      "selectedDraft",
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
      "canResolveContinuity",
      "canClassifyConversation",
      "canInterpretMeaning",
      "canDetermineDeveloperIntent",
      "canDetermineSafetySeverity",
      "canChooseResponsePlan",
      "canCreateComposerPacket",
      "canGenerateResponseCandidate",
      "canSelectResponseCandidate",
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

        readinessAuthorityEnabled:
          authority
            .canDetermineRuntimeReadiness ===
          true,

        scriptLoadingDisabled:
          authority
            .canLoadScripts ===
          false,

        pipelineExecutionDisabled:
          authority
            .canExecuteMasterPipeline ===
          false,

        responseGenerationDisabled:
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
          false
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
          item !==
            undefined &&
          item !==
            null &&
          item !==
            ""
      );
    }

    if (
      value ===
        undefined ||
      value ===
        null ||
      value ===
        ""
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

console.log(
  "ARI RUNTIME READINESS LOADED:",
  window.AriRuntimeReadiness
    ?.version,
  window.AriRuntimeReadiness
    ?.validate?.()
    .valid ===
    true
    ? "READY"
    : "INVALID"
);