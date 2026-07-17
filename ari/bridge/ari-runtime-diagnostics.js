// ari/bridge/ari-runtime-diagnostics.js
// Ari Runtime Diagnostics
//
// Purpose:
// Observe and report the current registration and readiness state of the
// Ari Rebirth application runtime without modifying or executing it.
//
// V1.0.0 — External Runtime Observation Authority
//
// Responsibilities:
// - Observe bridge-facing runtime services.
// - Observe the master Ari Rebirth pipeline.
// - Report registered versions and required public methods.
// - Read the canonical readiness service when available.
// - Inspect loaded Ari script elements.
// - Identify missing bridge-facing runtime dependencies.
// - Produce structured runtime snapshots.
// - Print readable console diagnostics.
// - Expose one stable developer debugging command.
//
// Non-responsibilities:
// - Does not load scripts.
// - Does not modify runtime state.
// - Does not execute AriRebirthPipeline.
// - Does not build runtime requests.
// - Does not read authoritative delivery.
// - Does not adapt application responses.
// - Does not repair missing services.
// - Does not participate in any runtime layer.
// - Does not reinterpret semantic or conversational state.

window.Ari = window.Ari || {};
window.Ari.debug = window.Ari.debug || {};

window.AriRuntimeDiagnostics = {
  version: "1.0.0",
  schemaVersion: "1.0.0",
  source: "ari-runtime-diagnostics",
  authorityLevel: "external_runtime_observation",

  /* =====================================================
     PUBLIC SNAPSHOT
  ===================================================== */

  snapshot(options = {}) {
    const services =
      this.services();

    const pipeline =
      this.pipeline();

    const bridge =
      this.bridge();

    const readiness =
      this.readiness(options);

    const scripts =
      this.scripts();

    const missing =
      this.findMissing({
        services,
        pipeline,
        bridge
      });

    const summary =
      this.buildSummary({
        services,
        pipeline,
        bridge,
        readiness,
        scripts,
        missing
      });

    return {
      schema: "ari_runtime_diagnostics_snapshot",
      schemaVersion: this.schemaVersion,
      source: this.source,
      version: this.version,

      timestamp:
        new Date().toISOString(),

      summary,
      bridge,
      services,
      pipeline,
      readiness,
      scripts,
      missing,

      authority:
        this.getAuthorityBoundaries()
    };
  },

  /* =====================================================
     BRIDGE OBSERVATION
  ===================================================== */

  bridge() {
    const bridge =
      window.AriRebirthAppBridge ||
      window.Ari?.appBridge ||
      null;

    return {
      name: "AriRebirthAppBridge",

      loaded:
        Boolean(bridge),

      version:
        bridge?.version ||
        null,

      schemaVersion:
        bridge?.schemaVersion ||
        null,

      source:
        bridge?.source ||
        null,

      loadedFlag:
        bridge?.loaded ===
        true,

      loading:
        Boolean(
          bridge?.loadingPromise
        ),

      methods: {
        ask:
          typeof bridge?.ask ===
          "function",

        ensureLoaded:
          typeof bridge?.ensureLoaded ===
          "function",

        checkReadiness:
          typeof bridge?.checkReadiness ===
          "function",

        buildRuntimeRequest:
          typeof bridge?.buildRuntimeRequest ===
          "function",

        readAuthoritativeDelivery:
          typeof bridge?.readAuthoritativeDelivery ===
          "function",

        adaptDeliveryToAppResponse:
          typeof bridge?.adaptDeliveryToAppResponse ===
          "function"
      },

      ready:
        Boolean(
          bridge &&
          typeof bridge.ask ===
            "function" &&
          typeof bridge.ensureLoaded ===
            "function"
        )
    };
  },

  /* =====================================================
     SERVICE OBSERVATION
  ===================================================== */

  services() {
    const request =
      window.AriRuntimeRequest ||
      window.Ari?.runtimeRequest ||
      null;

    const readiness =
      window.AriRuntimeReadiness ||
      window.Ari?.runtimeReadiness ||
      null;

    const delivery =
      window.AriRuntimeDelivery ||
      window.Ari?.runtimeDelivery ||
      null;

    return {
      request: {
        name:
          "AriRuntimeRequest",

        loaded:
          Boolean(request),

        version:
          request?.version ||
          null,

        source:
          request?.source ||
          null,

        methods: {
          build:
            typeof request?.build ===
            "function"
        },

        ready:
          Boolean(
            request &&
            typeof request.build ===
              "function"
          ),

        object:
          request
      },

      readiness: {
        name:
          "AriRuntimeReadiness",

        loaded:
          Boolean(readiness),

        version:
          readiness?.version ||
          null,

        source:
          readiness?.source ||
          null,

        methods: {
          check:
            typeof readiness?.check ===
            "function"
        },

        ready:
          Boolean(
            readiness &&
            typeof readiness.check ===
              "function"
          ),

        object:
          readiness
      },

      delivery: {
        name:
          "AriRuntimeDelivery",

        loaded:
          Boolean(delivery),

        version:
          delivery?.version ||
          null,

        source:
          delivery?.source ||
          null,

        methods: {
          read:
            typeof delivery?.read ===
            "function",

          adapt:
            typeof delivery?.adapt ===
            "function"
        },

        ready:
          Boolean(
            delivery &&
            typeof delivery.read ===
              "function" &&
            typeof delivery.adapt ===
              "function"
          ),

        object:
          delivery
      }
    };
  },

  /* =====================================================
     PIPELINE OBSERVATION
  ===================================================== */

  pipeline() {
    const pipeline =
      window.AriRebirthPipeline ||
      window.Ari?.rebirthPipeline ||
      null;

    return {
      name:
        "AriRebirthPipeline",

      loaded:
        Boolean(pipeline),

      version:
        pipeline?.version ||
        null,

      schemaVersion:
        pipeline?.schemaVersion ||
        null,

      source:
        pipeline?.source ||
        null,

      authorityLevel:
        pipeline?.authorityLevel ||
        null,

      methods: {
        run:
          typeof pipeline?.run ===
          "function",

        validate:
          typeof pipeline?.validate ===
          "function",

        getAuthorityBoundaries:
          typeof pipeline
            ?.getAuthorityBoundaries ===
          "function"
      },

      ready:
        Boolean(
          pipeline &&
          typeof pipeline.run ===
            "function"
        ),

      object:
        pipeline
    };
  },

  /* =====================================================
     CANONICAL READINESS OBSERVATION
  ===================================================== */

  readiness(options = {}) {
    const service =
      window.AriRuntimeReadiness ||
      window.Ari?.runtimeReadiness ||
      null;

    if (
      !service ||
      typeof service.check !==
        "function"
    ) {
      return {
        available:
          false,

        checked:
          false,

        ready:
          false,

        reason:
          "runtime_readiness_service_unavailable",

        error:
          "AriRuntimeReadiness_not_loaded",

        missing: [
          "AriRuntimeReadiness"
        ]
      };
    }

    try {
      const result =
        service.check({
          requireRuntimeDelivery:
            options
              .requireRuntimeDelivery !==
            false
        });

      return {
        available:
          true,

        checked:
          true,

        ready:
          result?.ready ===
          true,

        result
      };
    } catch (error) {
      return {
        available:
          true,

        checked:
          true,

        ready:
          false,

        reason:
          "runtime_readiness_check_failed",

        error:
          error?.message ||
          String(error)
      };
    }
  },

  /* =====================================================
     SCRIPT OBSERVATION
  ===================================================== */

  scripts() {
    const allScripts =
      Array.from(
        document.scripts ||
        []
      );

    const ariScripts =
      allScripts
        .map(
          script =>
            this.inspectScript(
              script
            )
        )
        .filter(
          script =>
            script.isAriScript
        );

    const counts = {
      total:
        ariScripts.length,

      loaded:
        ariScripts.filter(
          item =>
            item.state ===
              "loaded" ||
            item.state ===
              "present"
        ).length,

      loading:
        ariScripts.filter(
          item =>
            item.state ===
            "loading"
        ).length,

      failed:
        ariScripts.filter(
          item =>
            item.state ===
            "failed"
        ).length,

      unknown:
        ariScripts.filter(
          item =>
            item.state ===
            "unknown"
        ).length
    };

    return {
      counts,
      items:
        ariScripts,

      lastLoading:
        this.readSessionDiagnostic(
          "ariLastLoadingScript"
        ),

      lastLoadingIndex:
        this.readSessionDiagnostic(
          "ariLastLoadingIndex"
        ),

      lastLoaded:
        this.readSessionDiagnostic(
          "ariLastLoadedScript"
        ),

      lastLoadedIndex:
        this.readSessionDiagnostic(
          "ariLastLoadedIndex"
        ),

      loadingCompleted:
        this.readSessionDiagnostic(
          "ariLoadingCompleted"
        ),

      lastLoadError:
        this.readSessionDiagnostic(
          "ariLastLoadError"
        )
    };
  },

  inspectScript(script = null) {
    const attribute =
      script?.getAttribute?.(
        "src"
      ) ||
      "";

    const absolute =
      script?.src ||
      "";

    const source =
      script?.dataset
        ?.ariSource ||
      attribute ||
      absolute ||
      "";

    const state =
      script?.dataset
        ?.ariLoadState ||
      (
        script?.dataset
          ?.ariDynamicScript ===
        "true"
          ? "unknown"
          : "present"
      );

    return {
      source,

      attribute,

      absolute,

      state,

      dynamic:
        script?.dataset
          ?.ariDynamicScript ===
        "true",

      isAriScript:
        source.includes(
          "ari/"
        ) ||
        absolute.includes(
          "/ari/"
        )
    };
  },

  /* =====================================================
     MISSING DEPENDENCIES
  ===================================================== */

  findMissing({
    services = {},
    pipeline = {},
    bridge = {}
  } = {}) {
    const missing =
      [];

    if (
      bridge.loaded !==
      true
    ) {
      missing.push(
        "AriRebirthAppBridge"
      );
    }

    if (
      services.request
        ?.ready !==
      true
    ) {
      missing.push(
        "AriRuntimeRequest.build"
      );
    }

    if (
      services.readiness
        ?.ready !==
      true
    ) {
      missing.push(
        "AriRuntimeReadiness.check"
      );
    }

    if (
      services.delivery
        ?.methods
        ?.read !==
      true
    ) {
      missing.push(
        "AriRuntimeDelivery.read"
      );
    }

    if (
      services.delivery
        ?.methods
        ?.adapt !==
      true
    ) {
      missing.push(
        "AriRuntimeDelivery.adapt"
      );
    }

    if (
      pipeline.methods
        ?.run !==
      true
    ) {
      missing.push(
        "AriRebirthPipeline.run"
      );
    }

    return missing;
  },

  /* =====================================================
     SUMMARY
  ===================================================== */

  buildSummary({
    services = {},
    pipeline = {},
    bridge = {},
    readiness = {},
    scripts = {},
    missing = []
  } = {}) {
    const serviceList = [
      services.request,
      services.readiness,
      services.delivery
    ].filter(Boolean);

    const loadedServiceCount =
      serviceList.filter(
        service =>
          service.loaded ===
          true
      ).length;

    const readyServiceCount =
      serviceList.filter(
        service =>
          service.ready ===
          true
      ).length;

    const bridgeReady =
      bridge.ready ===
      true;

    const servicesReady =
      readyServiceCount ===
      serviceList.length;

    const pipelineReady =
      pipeline.ready ===
      true;

    const readinessReady =
      readiness.ready ===
      true;

    const ready =
      bridgeReady &&
      servicesReady &&
      pipelineReady &&
      readinessReady &&
      missing.length ===
        0;

    return {
      ready,

      status:
        ready
          ? "READY"
          : "NOT_READY",

      bridgeReady,

      servicesReady,

      pipelineReady,

      canonicalReadiness:
        readinessReady,

      loadedServiceCount,

      readyServiceCount,

      expectedServiceCount:
        serviceList.length,

      missingCount:
        missing.length,

      failedScriptCount:
        scripts?.counts
          ?.failed ||
        0,

      loadingScriptCount:
        scripts?.counts
          ?.loading ||
        0
    };
  },

  summary(options = {}) {
    return this
      .snapshot(options)
      .summary;
  },

  versions() {
    const snapshot =
      this.snapshot({
        requireRuntimeDelivery:
          false
      });

    return {
      diagnostics:
        this.version,

      bridge:
        snapshot.bridge.version,

      runtimeRequest:
        snapshot.services
          .request.version,

      runtimeReadiness:
        snapshot.services
          .readiness.version,

      runtimeDelivery:
        snapshot.services
          .delivery.version,

      pipeline:
        snapshot.pipeline.version
    };
  },

  /* =====================================================
     CONSOLE OUTPUT
  ===================================================== */

  dump(options = {}) {
    const snapshot =
      this.snapshot(options);

    console.group(
      "========== ARI REBIRTH RUNTIME DIAGNOSTICS =========="
    );

    console.log(
      "Overall Status:",
      snapshot.summary.status
    );

    console.log(
      "Timestamp:",
      snapshot.timestamp
    );

    console.table({
      BridgeReady:
        snapshot.summary
          .bridgeReady,

      ServicesReady:
        snapshot.summary
          .servicesReady,

      PipelineReady:
        snapshot.summary
          .pipelineReady,

      CanonicalReadiness:
        snapshot.summary
          .canonicalReadiness,

      MissingCount:
        snapshot.summary
          .missingCount,

      FailedScripts:
        snapshot.summary
          .failedScriptCount,

      LoadingScripts:
        snapshot.summary
          .loadingScriptCount
    });

    console.group(
      "Bridge"
    );

    console.table({
      Loaded:
        snapshot.bridge.loaded,

      Ready:
        snapshot.bridge.ready,

      Version:
        snapshot.bridge.version,

      LoadedFlag:
        snapshot.bridge.loadedFlag,

      Loading:
        snapshot.bridge.loading,

      Ask:
        snapshot.bridge
          .methods.ask,

      EnsureLoaded:
        snapshot.bridge
          .methods.ensureLoaded
    });

    console.log(
      "Object:",
      window.AriRebirthAppBridge ||
      window.Ari?.appBridge ||
      null
    );

    console.groupEnd();

    console.group(
      "Runtime Services"
    );

    console.table({
      AriRuntimeRequest: {
        loaded:
          snapshot.services
            .request.loaded,

        ready:
          snapshot.services
            .request.ready,

        version:
          snapshot.services
            .request.version,

        build:
          snapshot.services
            .request.methods.build
      },

      AriRuntimeReadiness: {
        loaded:
          snapshot.services
            .readiness.loaded,

        ready:
          snapshot.services
            .readiness.ready,

        version:
          snapshot.services
            .readiness.version,

        check:
          snapshot.services
            .readiness.methods.check
      },

      AriRuntimeDelivery: {
        loaded:
          snapshot.services
            .delivery.loaded,

        ready:
          snapshot.services
            .delivery.ready,

        version:
          snapshot.services
            .delivery.version,

        read:
          snapshot.services
            .delivery.methods.read,

        adapt:
          snapshot.services
            .delivery.methods.adapt
      }
    });

    console.log(
      "AriRuntimeRequest:",
      snapshot.services
        .request.object
    );

    console.log(
      "AriRuntimeReadiness:",
      snapshot.services
        .readiness.object
    );

    console.log(
      "AriRuntimeDelivery:",
      snapshot.services
        .delivery.object
    );

    console.groupEnd();

    console.group(
      "Master Pipeline"
    );

    console.table({
      Loaded:
        snapshot.pipeline.loaded,

      Ready:
        snapshot.pipeline.ready,

      Version:
        snapshot.pipeline.version,

      Run:
        snapshot.pipeline
          .methods.run,

      Validate:
        snapshot.pipeline
          .methods.validate
    });

    console.log(
      "AriRebirthPipeline:",
      snapshot.pipeline.object
    );

    console.groupEnd();

    console.group(
      "Canonical Readiness"
    );

    console.log(
      snapshot.readiness
    );

    console.groupEnd();

    console.group(
      "Script Loader"
    );

    console.table(
      snapshot.scripts.counts
    );

    console.table({
      LoadingCompleted:
        snapshot.scripts
          .loadingCompleted,

      LastLoadingScript:
        snapshot.scripts
          .lastLoading,

      LastLoadingIndex:
        snapshot.scripts
          .lastLoadingIndex,

      LastLoadedScript:
        snapshot.scripts
          .lastLoaded,

      LastLoadedIndex:
        snapshot.scripts
          .lastLoadedIndex,

      LastLoadError:
        snapshot.scripts
          .lastLoadError
    });

    if (
      options.includeScripts ===
      true
    ) {
      console.table(
        snapshot.scripts.items
      );
    }

    console.groupEnd();

    if (
      snapshot.missing.length >
      0
    ) {
      console.group(
        "Missing Runtime Dependencies"
      );

      console.table(
        snapshot.missing.map(
          name => ({
            missing:
              name
          })
        )
      );

      console.groupEnd();
    }

    console.log(
      "Full Snapshot:",
      snapshot
    );

    console.groupEnd();

    return snapshot;
  },

  /* =====================================================
     SESSION DIAGNOSTICS
  ===================================================== */

  readSessionDiagnostic(
    key = ""
  ) {
    try {
      return sessionStorage
        .getItem(
          key
        );
    } catch {
      return null;
    }
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canObserveRuntimeRegistration:
        true,

      canObserveServiceAvailability:
        true,

      canObservePipelineAvailability:
        true,

      canReadReadinessService:
        true,

      canObserveScriptElements:
        true,

      canReadLoaderDiagnostics:
        true,

      canPrintDiagnostics:
        true,

      canReturnStructuredSnapshot:
        true,

      canLoadScripts:
        false,

      canModifyRuntime:
        false,

      canExecutePipeline:
        false,

      canBuildRuntimeRequest:
        false,

      canReadAuthoritativeDelivery:
        false,

      canAdaptApplicationResponse:
        false,

      canRepairRuntime:
        false,

      canExecuteRuntimeLayers:
        false,

      canExecuteRuntimeStages:
        false,

      canInterpretMeaning:
        false,

      canDetermineConversationFunction:
        false,

      canResolveContinuity:
        false,

      canRetrieveMemory:
        false,

      canStoreMemory:
        false,

      role:
        "external_runtime_observation"
    };
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const authority =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canLoadScripts",
      "canModifyRuntime",
      "canExecutePipeline",
      "canBuildRuntimeRequest",
      "canReadAuthoritativeDelivery",
      "canAdaptApplicationResponse",
      "canRepairRuntime",
      "canExecuteRuntimeLayers",
      "canExecuteRuntimeStages",
      "canInterpretMeaning",
      "canDetermineConversationFunction",
      "canResolveContinuity",
      "canRetrieveMemory",
      "canStoreMemory"
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

      ready:
        errors.length ===
        0,

      source:
        this.source,

      version:
        this.version,

      errors,

      warnings: [],

      checks: {
        snapshotAvailable:
          typeof this.snapshot ===
          "function",

        summaryAvailable:
          typeof this.summary ===
          "function",

        dumpAvailable:
          typeof this.dump ===
          "function",

        runtimeMutationDisabled:
          authority
            .canModifyRuntime ===
          false,

        pipelineExecutionDisabled:
          authority
            .canExecutePipeline ===
          false,

        runtimeRepairDisabled:
          authority
            .canRepairRuntime ===
          false
      }
    };
  }
};

window.Ari.runtimeDiagnostics =
  window.AriRuntimeDiagnostics;

window.Ari.debug.runtime =
  options =>
    window.AriRuntimeDiagnostics
      .dump(
        options
      );

const ariRuntimeDiagnosticsValidation =
  window.AriRuntimeDiagnostics
    .validate();

console.log(
  "ARI RUNTIME DIAGNOSTICS LOADED:",
  window.AriRuntimeDiagnostics
    .version,

  ariRuntimeDiagnosticsValidation
    .valid ===
    true
    ? "VALID"
    : "INVALID",

  ariRuntimeDiagnosticsValidation
);