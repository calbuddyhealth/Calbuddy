// =====================================================
// ARI REBIRTH
// File: ari/profile/ari-preference-runtime.js
// Version: 3.0.0
//
// Ari Preference Runtime
//
// Purpose:
//   Load, cache, refresh, and expose the authenticated user's
//   canonical V3 communication preference packet.
//
// Architecture:
//
//   AriUserPreferenceContract V3
//            ↓
//   AriUserPreferenceStore V3
//            ↓
//   AriPreferenceResolver V3
//            ↓
//   AriPreferenceRuntime V3
//            ↓
//   Reasoning / OpenAI Request Builder
//
// Responsibilities:
//   - Load the authenticated user's persisted preferences.
//   - Require compatible V3 preference dependencies.
//   - Resolve the persistent runtime preference packet.
//   - Cache the resolved packet for the browser session.
//   - Refresh after preference changes.
//   - Expose model instructions WITHOUT weakening them.
//   - Expose instructionText WITHOUT rewriting it.
//   - Resolve request-specific preference packets using:
//       persistent preferences
//       + conversation overrides
//       + current-turn overrides
//   - Provide OpenAI-ready communication guidance.
//   - Preserve strong behavioral preference semantics.
//
// IMPORTANT:
//   This runtime must NOT translate:
//
//     "Use profanity"
//
//   into:
//
//     "Profanity is permitted"
//
//   It must NOT translate:
//
//     "Actively use humor"
//
//   into:
//
//     "Humor may be used"
//
//   The contract and resolver have already determined the
//   behavioral instructions. This runtime transports them.
//
// Communication preferences are binding inside their style scope.
// They do not override safety, factual accuracy, tool authority,
// or other application restrictions.
//
// Non-responsibilities:
//   - Does not persist preferences itself.
//   - Does not define preference values.
//   - Does not create personality instructions.
//   - Does not infer persistent preferences.
//   - Does not own safety.
//   - Does not call OpenAI directly.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};

  const RUNTIME_VERSION = "3.0.0";

  const REQUIRED_CONTRACT_VERSION = "3.0.0";
  const REQUIRED_STORE_VERSION = "3.0.0";
  const REQUIRED_RESOLVER_VERSION = "3.0.0";

  const AriPreferenceRuntime = {
    version: RUNTIME_VERSION,

    source:
      "ari-preference-runtime",

    authorityLevel:
      "canonical_runtime_communication_preferences",

    requiredVersions: Object.freeze({
      contract:
        REQUIRED_CONTRACT_VERSION,

      store:
        REQUIRED_STORE_VERSION,

      resolver:
        REQUIRED_RESOLVER_VERSION
    }),

    _refreshPromise:
      null,

    _cache: {
      loaded:
        false,

      loading:
        false,

      degraded:
        false,

      storeResult:
        null,

      record:
        null,

      resolvedPacket:
        null,

      loadedAt:
        null,

      error:
        null
    },

    // ===================================================
    // INITIALIZATION
    // ===================================================

    async initialize(options = {}) {
      if (
        this._cache.loaded &&
        options.force !== true
      ) {
        return this.getPacket();
      }

      return this.refresh();
    },

    async ensureReady() {
      if (
        this.isReady()
      ) {
        return this.getPacket();
      }

      return this.initialize();
    },

    // ===================================================
    // REFRESH
    // ===================================================

    async refresh() {
      if (
        this._refreshPromise
      ) {
        return this._refreshPromise;
      }

      this._refreshPromise =
        this.performRefresh();

      try {
        return await this._refreshPromise;
      } finally {
        this._refreshPromise =
          null;
      }
    },

    async performRefresh() {
      this._cache.loading =
        true;

      this._cache.error =
        null;

      this._cache.degraded =
        false;

      try {
        // ===============================================
        // REQUIRE V3 DEPENDENCIES
        // ===============================================

        this.requireContract();

        const store =
          this.requireStore();

        const resolver =
          this.requireResolver();

        // ===============================================
        // READ PERSISTED PREFERENCES
        //
        // useCache:false deliberately verifies the
        // current persisted Supabase state.
        // ===============================================

        const storeResult =
          await store.read(
            null,
            {
              useCache:
                false,

              createIfMissing:
                true
            }
          );

        if (
          !storeResult ||
          storeResult.ok !== true
        ) {
          throw new Error(
            storeResult
              ?.error
              ?.message ||
            "AriUserPreferenceStore failed to load the user's preferences."
          );
        }

        const record =
          this.objectOrEmpty(
            storeResult.record
          );

        if (
          !this.hasKeys(
            record
          )
        ) {
          throw new Error(
            "AriUserPreferenceStore returned no preference record."
          );
        }

        // ===============================================
        // RESOLVE PERSISTENT RUNTIME PACKET
        // ===============================================

        const packet =
          resolver.resolve({
            preferenceStoreResult:
              storeResult,

            preferenceStoreRecord:
              record,

            preferenceStagePacket: {
              storeResult,

              storeRecord:
                record
            }
          });

        this.assertResolvedPacket(
          packet
        );

        // ===============================================
        // CACHE
        // ===============================================

        this._cache.storeResult =
          this.clone(
            storeResult
          );

        this._cache.record =
          this.clone(
            record
          );

        this._cache.resolvedPacket =
          this.clone(
            packet
          );

        this._cache.loaded =
          true;

        this._cache.degraded =
          false;

        this._cache.loadedAt =
          Date.now();

        this._cache.error =
          null;

        console.info(
          "ARI PREFERENCE RUNTIME REFRESHED:",
          {
            version:
              this.version,

            schemaVersion:
              packet.schemaVersion ||
              null,

            activePreset:
              packet.activePreset ||
              null,

            resolvedPreferences:
              this.clone(
                packet.resolvedPreferences
              ),

            instructionCount:
              Array.isArray(
                packet.modelInstructions
              )
                ? packet
                    .modelInstructions
                    .length
                : 0,

            personalityBoostActive:
              packet
                ?.styleExecution
                ?.humorProfanityPersonalityBoostActive ===
              true
          }
        );

        return this.getPacket();
      } catch (error) {
        return this.handleRefreshFailure(
          error
        );
      } finally {
        this._cache.loading =
          false;
      }
    },

    // ===================================================
    // REFRESH FAILURE / DEFAULT FALLBACK
    // ===================================================

    handleRefreshFailure(
      error
    ) {
      const fallback =
        this.resolveFallback(
          error
        );

      this._cache.storeResult =
        null;

      this._cache.record =
        {};

      this._cache.resolvedPacket =
        this.clone(
          fallback
        );

      this._cache.loaded =
        true;

      this._cache.degraded =
        true;

      this._cache.loadedAt =
        Date.now();

      this._cache.error = {
        code:
          "preference_runtime_refresh_failed",

        message:
          error instanceof Error
            ? error.message
            : String(
                error ||
                "Unknown preference runtime error."
              )
      };

      console.error(
        "ARI PREFERENCE RUNTIME REFRESH FAILED:",
        this.clone(
          this._cache.error
        )
      );

      return this.getPacket();
    },

    resolveFallback(
      originalError
    ) {
      try {
        this.requireContract();

        const resolver =
          this.requireResolver();

        // Resolving an empty input gives us the
        // canonical contract defaults.
        const fallback =
          resolver.resolve({});

        this.assertResolvedPacket(
          fallback
        );

        return {
          ...fallback,

          fallback:
            true,

          fallbackReason:
            originalError instanceof Error
              ? originalError.message
              : String(
                  originalError ||
                  "Preference runtime fallback was required."
                )
        };
      } catch (
        fallbackError
      ) {
        return {
          ok:
            false,

          success:
            false,

          complete:
            false,

          ready:
            false,

          schemaVersion:
            "3.0.0",

          source:
            this.source,

          version:
            this.version,

          activePreset:
            "default",

          resolvedPreferences:
            {},

          modelInstructions:
            [],

          instructionText:
            "",

          styleExecution: {
            active:
              false,

            preferencesArePermissionsOnly:
              false,

            selectedStyleMustBeObservable:
              false
          },

          fallback:
            true,

          error: {
            code:
              "preference_runtime_fallback_failed",

            message:
              fallbackError instanceof Error
                ? fallbackError.message
                : String(
                    fallbackError ||
                    originalError ||
                    "Preference runtime fallback failed."
                  )
          }
        };
      }
    },

    // ===================================================
    // CACHE CONTROL
    // ===================================================

    invalidate() {
      this._refreshPromise =
        null;

      this._cache = {
        loaded:
          false,

        loading:
          false,

        degraded:
          false,

        storeResult:
          null,

        record:
          null,

        resolvedPacket:
          null,

        loadedAt:
          null,

        error:
          null
      };

      return true;
    },

    async afterPreferenceSave() {
      this.invalidate();

      return this.refresh();
    },

    // ===================================================
    // BASE RUNTIME ACCESS
    // ===================================================

    getPacket() {
      return this.clone(
        this._cache
          .resolvedPacket
      );
    },

    getRecord() {
      return this.clone(
        this._cache.record ||
        {}
      );
    },

    getStoreResult() {
      return this.clone(
        this._cache
          .storeResult
      );
    },

    getResolvedPreferences() {
      return this.clone(
        this._cache
          .resolvedPacket
          ?.resolvedPreferences ||
        {}
      );
    },

    getInstructionText() {
      return String(
        this._cache
          .resolvedPacket
          ?.instructionText ||
        ""
      );
    },

    getModelInstructions() {
      return this.clone(
        this._cache
          .resolvedPacket
          ?.modelInstructions ||
        []
      );
    },

    getStyleExecution() {
      return this.clone(
        this._cache
          .resolvedPacket
          ?.styleExecution ||
        {}
      );
    },

    // ===================================================
    // OPENAI GUIDANCE — PERSISTENT RUNTIME
    //
    // IMPORTANT:
    // No wording transformation occurs here.
    //
    // instructionText is carried directly from the resolver.
    // ===================================================

    getOpenAIGuidance() {
      const packet =
        this._cache
          .resolvedPacket;

      if (!packet) {
        return {
          ready:
            false,

          source:
            this.source,

          version:
            this.version,

          resolvedPreferences:
            {},

          modelInstructions:
            [],

          instructionText:
            "",

          styleExecution:
            {},

          authorityLevel:
            "binding_user_communication_preferences_within_style_scope"
        };
      }

      return this.buildGuidanceFromPacket(
        packet
      );
    },

    // ===================================================
    // REQUEST-SPECIFIC RESOLUTION
    //
    // This is the preferred pathway for the reasoning /
    // OpenAI request builder.
    //
    // It combines:
    //
    // persisted preferences
    //       ↓
    // conversation override
    //       ↓
    // current-turn override
    //
    // Example:
    //
    // await AriPreferenceRuntime.resolveForRequest({
    //   currentTurnPreferenceOverrides: {
    //     language: {
    //       detail: "concise"
    //     }
    //   }
    // });
    // ===================================================

    async resolveForRequest(
      input = {}
    ) {
      await this.ensureReady();

      const resolver =
        this.requireResolver();

      const summary =
        this.isPlainObject(
          input?.summary
        )
          ? this.clone(
              input.summary
            )
          : this.clone(
              this.objectOrEmpty(
                input
              )
            );

      const record =
        this.clone(
          this._cache.record ||
          {}
        );

      const storeResult =
        this.clone(
          this._cache.storeResult ||
          {}
        );

      // ===============================================
      // INJECT PERSISTENT RECORD
      //
      // The persistent record is owned by this runtime,
      // not by arbitrary request callers.
      // ===============================================

      summary.preferenceStoreRecord =
        record;

      if (
        this.hasKeys(
          storeResult
        )
      ) {
        summary.preferenceStoreResult =
          storeResult;
      }

      summary.preferenceStagePacket =
        this.deepMerge(
          this.objectOrEmpty(
            summary
              .preferenceStagePacket
          ),
          {
            storeRecord:
              record,

            storeResult:
              this.hasKeys(
                storeResult
              )
                ? storeResult
                : undefined
          }
        );

      const packet =
        resolver.resolve(
          summary
        );

      this.assertResolvedPacket(
        packet
      );

      return this.clone(
        packet
      );
    },

    // ===================================================
    // OPENAI GUIDANCE — REQUEST SPECIFIC
    //
    // This is the method the request builder should
    // eventually call for every OpenAI turn.
    // ===================================================

    async getOpenAIGuidanceForRequest(
      input = {}
    ) {
      const packet =
        await this.resolveForRequest(
          input
        );

      return this.buildGuidanceFromPacket(
        packet
      );
    },

    // ===================================================
    // GUIDANCE PACKET BUILDER
    //
    // Transport only.
    //
    // Do NOT weaken instructionText here.
    // ===================================================

    buildGuidanceFromPacket(
      packet = {}
    ) {
      const resolvedPreferences =
        this.clone(
          packet
            ?.resolvedPreferences ||
          {}
        );

      const modelInstructions =
        this.clone(
          packet
            ?.modelInstructions ||
          []
        );

      const instructionText =
        String(
          packet
            ?.instructionText ||
          ""
        );

      const styleExecution =
        this.clone(
          packet
            ?.styleExecution ||
          {}
        );

      return {
        ready:
          packet?.ok ===
            true &&
          packet?.ready ===
            true,

        source:
          packet?.source ||
          this.source,

        runtimeSource:
          this.source,

        version:
          this.version,

        schemaVersion:
          packet
            ?.schemaVersion ||
          "3.0.0",

        activePreset:
          packet
            ?.activePreset ||
          "default",

        resolvedPreferences,

        modelInstructions,

        // =============================================
        // CRITICAL
        //
        // Preserve exact resolver-generated text.
        // =============================================

        instructionText,

        styleExecution,

        provenance:
          this.clone(
            packet
              ?.provenance ||
            {}
          ),

        restrictionContext:
          this.clone(
            packet
              ?.restrictionContext ||
            {}
          ),

        // =============================================
        // EXECUTION AUTHORITY
        // =============================================

        authorityLevel:
          "binding_user_communication_preferences_within_style_scope",

        executionMode:
          "behavioral",

        preferencesArePermissionsOnly:
          false,

        selectedStyleMustBeObservable:
          styleExecution
            ?.selectedStyleMustBeObservable !==
          false,

        neutralFallbackDiscouraged:
          styleExecution
            ?.neutralFallbackDiscouraged !==
          false,

        // Explicit downstream flags.
        executeSelectedCommunicationStyle:
          true,

        preserveInstructionStrength:
          true,

        doNotRewriteBehaviorAsPermission:
          true
      };
    },

    // ===================================================
    // PACKET ASSERTION
    // ===================================================

    assertResolvedPacket(
      packet
    ) {
      if (
        !packet ||
        packet.ok !== true ||
        packet.ready !== true
      ) {
        throw new Error(
          packet
            ?.diagnostics
            ?.error
            ?.message ||
          packet
            ?.error
            ?.message ||
          "AriPreferenceResolver returned an incomplete preference packet."
        );
      }

      if (
        !this.isPlainObject(
          packet
            .resolvedPreferences
        )
      ) {
        throw new Error(
          "Resolved preference packet is missing resolvedPreferences."
        );
      }

      if (
        !Array.isArray(
          packet
            .modelInstructions
        )
      ) {
        throw new Error(
          "Resolved preference packet is missing modelInstructions."
        );
      }

      if (
        typeof packet
          .instructionText !==
        "string"
      ) {
        throw new Error(
          "Resolved preference packet is missing instructionText."
        );
      }

      return true;
    },

    // ===================================================
    // DIAGNOSTICS
    // ===================================================

    getDiagnostics() {
      const packet =
        this._cache
          .resolvedPacket;

      const styleExecution =
        packet
          ?.styleExecution ||
        {};

      return {
        source:
          this.source,

        version:
          this.version,

        requiredVersions:
          this.clone(
            this.requiredVersions
          ),

        loaded:
          this._cache.loaded,

        loading:
          this._cache.loading,

        degraded:
          this._cache.degraded,

        loadedAt:
          this._cache.loadedAt,

        ready:
          this.isReady(),

        hasRecord:
          this.hasKeys(
            this._cache.record
          ),

        hasStoreResult:
          this.hasKeys(
            this._cache
              .storeResult
          ),

        hasResolvedPacket:
          Boolean(
            packet
          ),

        resolvedPreferenceCount:
          this.countResolvedPreferences(
            packet
              ?.resolvedPreferences ||
            {}
          ),

        modelInstructionCount:
          Array.isArray(
            packet
              ?.modelInstructions
          )
            ? packet
                .modelInstructions
                .length
            : 0,

        instructionTextAvailable:
          Boolean(
            this.getInstructionText()
          ),

        instructionTextLength:
          this.getInstructionText()
            .length,

        styleExecution:
          this.clone(
            styleExecution
          ),

        frequentHumorActive:
          packet
            ?.resolvedPreferences
            ?.language
            ?.humor ===
          "frequent",

        alwaysProfanityActive:
          packet
            ?.resolvedPreferences
            ?.language
            ?.profanity ===
          "always_allowed",

        personalityBoostActive:
          styleExecution
            ?.humorProfanityPersonalityBoostActive ===
          true,

        error:
          this.clone(
            this._cache.error
          )
      };
    },

    isReady() {
      return Boolean(
        this._cache.loaded &&
        this._cache
          .resolvedPacket &&
        this._cache
          .resolvedPacket
          .ok === true &&
        this._cache
          .resolvedPacket
          .ready === true
      );
    },

    isDegraded() {
      return Boolean(
        this._cache
          .degraded
      );
    },

    // ===================================================
    // DEPENDENCIES
    // ===================================================

    getContract() {
      return (
        window
          .AriUserPreferenceContract ||
        window.Ari
          ?.userPreferenceContract ||
        null
      );
    },

    requireContract() {
      const contract =
        this.getContract();

      if (!contract) {
        throw new Error(
          "AriUserPreferenceContract not loaded."
        );
      }

      const version =
        String(
          contract
            .schemaVersion ||
          contract.version ||
          ""
        );

      if (
        version !==
        REQUIRED_CONTRACT_VERSION
      ) {
        throw new Error(
          `AriPreferenceRuntime ${this.version} requires AriUserPreferenceContract ${REQUIRED_CONTRACT_VERSION}, but ${version || "an unknown version"} is loaded.`
        );
      }

      return contract;
    },

    getStore() {
      return (
        window
          .AriUserPreferenceStore ||
        window.Ari
          ?.userPreferenceStore ||
        null
      );
    },

    requireStore() {
      const store =
        this.getStore();

      if (!store) {
        throw new Error(
          "AriUserPreferenceStore not loaded."
        );
      }

      const version =
        String(
          store.version ||
          store.schemaVersion ||
          ""
        );

      if (
        version !==
        REQUIRED_STORE_VERSION
      ) {
        throw new Error(
          `AriPreferenceRuntime ${this.version} requires AriUserPreferenceStore ${REQUIRED_STORE_VERSION}, but ${version || "an unknown version"} is loaded.`
        );
      }

      if (
        typeof store.read !==
        "function"
      ) {
        throw new Error(
          "AriUserPreferenceStore.read() is unavailable."
        );
      }

      return store;
    },

    getResolver() {
      return (
        window
          .AriPreferenceResolver ||
        window.Ari
          ?.preferenceResolver ||
        null
      );
    },

    requireResolver() {
      const resolver =
        this.getResolver();

      if (!resolver) {
        throw new Error(
          "AriPreferenceResolver not loaded."
        );
      }

      const version =
        String(
          resolver.version ||
          resolver.schemaVersion ||
          ""
        );

      if (
        version !==
        REQUIRED_RESOLVER_VERSION
      ) {
        throw new Error(
          `AriPreferenceRuntime ${this.version} requires AriPreferenceResolver ${REQUIRED_RESOLVER_VERSION}, but ${version || "an unknown version"} is loaded.`
        );
      }

      if (
        typeof resolver.resolve !==
        "function"
      ) {
        throw new Error(
          "AriPreferenceResolver.resolve() is unavailable."
        );
      }

      return resolver;
    },

    // ===================================================
    // VALIDATION
    // ===================================================

    validate() {
      const errors = [];

      let contract =
        null;

      let store =
        null;

      let resolver =
        null;

      try {
        contract =
          this.requireContract();
      } catch (error) {
        errors.push(
          error?.message ||
          "preference_contract_invalid"
        );
      }

      try {
        store =
          this.requireStore();
      } catch (error) {
        errors.push(
          error?.message ||
          "preference_store_invalid"
        );
      }

      try {
        resolver =
          this.requireResolver();
      } catch (error) {
        errors.push(
          error?.message ||
          "preference_resolver_invalid"
        );
      }

      const requiredMethods = [
        "initialize",
        "ensureReady",
        "refresh",
        "getPacket",
        "getResolvedPreferences",
        "getInstructionText",
        "getModelInstructions",
        "getOpenAIGuidance",
        "resolveForRequest",
        "getOpenAIGuidanceForRequest",
        "afterPreferenceSave"
      ];

      for (
        const method
        of requiredMethods
      ) {
        if (
          typeof this[
            method
          ] !==
          "function"
        ) {
          errors.push(
            `preference_runtime_method_missing:${method}`
          );
        }
      }

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

        requiredVersions:
          this.clone(
            this.requiredVersions
          ),

        contractReady:
          Boolean(
            contract
          ),

        contractVersion:
          contract
            ?.version ||
          null,

        storeReady:
          Boolean(
            store
          ),

        storeVersion:
          store
            ?.version ||
          null,

        resolverReady:
          Boolean(
            resolver
          ),

        resolverVersion:
          resolver
            ?.version ||
          null,

        cacheLoaded:
          this._cache.loaded,

        runtimeReady:
          this.isReady(),

        degraded:
          this.isDegraded(),

        requestSpecificResolutionSupported:
          true,

        behavioralStyleExecutionSupported:
          true,

        strongInstructionTransportSupported:
          true,

        errors
      };
    },

    // ===================================================
    // UTILITIES
    // ===================================================

    countResolvedPreferences(
      preferences = {}
    ) {
      let count = 0;

      for (
        const categoryValue
        of Object.values(
          this.objectOrEmpty(
            preferences
          )
        )
      ) {
        if (
          !this.isPlainObject(
            categoryValue
          )
        ) {
          continue;
        }

        count +=
          Object.values(
            categoryValue
          )
            .filter(
              value =>
                typeof value ===
                  "string"
            )
            .length;
      }

      return count;
    },

    isPlainObject(
      value
    ) {
      return Boolean(
        value &&
        typeof value ===
          "object" &&
        !Array.isArray(
          value
        )
      );
    },

    objectOrEmpty(
      value
    ) {
      return this.isPlainObject(
        value
      )
        ? value
        : {};
    },

    hasKeys(
      value
    ) {
      return (
        this.isPlainObject(
          value
        ) &&
        Object.keys(
          value
        ).length > 0
      );
    },

    deepMerge(
      base = {},
      override = {}
    ) {
      const output =
        this.clone(
          this.objectOrEmpty(
            base
          )
        );

      for (
        const [
          key,
          value
        ]
        of Object.entries(
          this.objectOrEmpty(
            override
          )
        )
      ) {
        if (
          value ===
          undefined
        ) {
          continue;
        }

        if (
          this.isPlainObject(
            value
          ) &&
          this.isPlainObject(
            output[
              key
            ]
          )
        ) {
          output[
            key
          ] =
            this.deepMerge(
              output[
                key
              ],
              value
            );
        } else {
          output[
            key
          ] =
            this.clone(
              value
            );
        }
      }

      return output;
    },

    clone(
      value
    ) {
      if (
        value ===
        undefined
      ) {
        return undefined;
      }

      if (
        value ===
        null
      ) {
        return null;
      }

      try {
        return structuredClone(
          value
        );
      } catch (_error) {
        try {
          return JSON.parse(
            JSON.stringify(
              value
            )
          );
        } catch (_fallbackError) {
          return value;
        }
      }
    }
  };

  // =====================================================
  // GLOBAL EXPORTS
  // =====================================================

  window.AriPreferenceRuntime =
    AriPreferenceRuntime;

  window.Ari.preferenceRuntime =
    AriPreferenceRuntime;

  // =====================================================
  // SELF VALIDATION
  // =====================================================

  const validation =
    AriPreferenceRuntime
      .validate();

  console.log(
    "ARI PREFERENCE RUNTIME LOADED:",
    AriPreferenceRuntime.version,

    validation.ready === true
      ? "READY"
      : "INVALID",

    validation
  );
})();