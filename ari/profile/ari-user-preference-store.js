// =====================================================
// ARI REBIRTH
// File: ari/profile/ari-user-preference-store.js
// Version: 3.0.0
//
// Ari User Preference Store
//
// Purpose:
//   Provide the canonical Supabase persistence boundary for
//   Ari's V3 communication preferences.
//
// Architecture:
//
//   ari-preference-settings.html
//            ↓
//   js/ari-preference-settings-controller.js
//            ↓
//   AriUserPreferenceContract V3
//            ↓
//   AriUserPreferenceStore V3
//            ↓
//   Supabase
//            ↓
//   AriPreferenceResolver
//            ↓
//   AriPreferenceRuntime
//
// CANONICAL V3 PREFERENCES:
//
//   language.tone
//   language.directness
//   language.humor
//   language.profanity
//   language.complexity
//   language.detail
//
// Persistence model:
//
//   The existing Supabase column remains:
//
//     preference_overrides
//
//   However, V3 stores a COMPLETE explicit communication
//   preference snapshot rather than a sparse legacy override.
//
// Example:
//
// {
//   language: {
//     tone: "natural",
//     directness: "balanced",
//     humor: "occasional",
//     profanity: "default",
//     complexity: "balanced",
//     detail: "balanced"
//   }
// }
//
// IMPORTANT V3 RULES:
//
//   - "default" is a valid persisted preference value.
//   - language.profanity = "default" MUST NOT be deleted.
//   - save() expects a complete preference snapshot.
//   - patch() is used for partial changes.
//   - resetAll() writes explicit contract defaults.
//   - resetCategory() writes explicit category defaults.
//   - deletePreference() restores that preference's default.
//   - Old/unknown stored keys are ignored during reads.
//   - Reads do not automatically write migrations.
//   - New writes always use schema 3.0.0.
//
// Non-responsibilities:
//   - Does not build model instructions.
//   - Does not resolve conversation/current-turn overrides.
//   - Does not own safety behavior.
//   - Does not render preference UI.
//   - Does not execute OpenAI requests.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};

  const STORE_VERSION = "3.0.0";
  const SCHEMA_VERSION = "3.0.0";
  const REQUIRED_CONTRACT_VERSION = "3.0.0";

  const AriUserPreferenceStore = {
    version: STORE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    requiredContractVersion: REQUIRED_CONTRACT_VERSION,

    source: "ari-user-preference-store",

    authorityLevel:
      "canonical_preference_persistence",

    tableName:
      "ari_user_preferences",

    supabaseClient:
      null,

    cache: {
      userId: null,
      record: null,
      loadedAt: null
    },

    // ===================================================
    // INITIALIZATION
    // ===================================================

    initialize(options = {}) {
      if (options.supabaseClient) {
        this.supabaseClient =
          options.supabaseClient;
      }

      if (
        typeof options.tableName === "string" &&
        options.tableName.trim()
      ) {
        this.tableName =
          options.tableName.trim();
      }

      let contractCompatible = false;

      try {
        this.requirePreferenceContract();
        contractCompatible = true;
      } catch (_error) {
        contractCompatible = false;
      }

      return {
        ok: true,
        success: true,

        initialized:
          Boolean(
            this.getSupabaseClient()
          ),

        contractCompatible,

        source:
          this.source,

        version:
          this.version,

        schemaVersion:
          this.schemaVersion
      };
    },

    // ===================================================
    // READ
    // ===================================================

    async read(
      userId = null,
      options = {}
    ) {
      try {
        const client =
          this.requireSupabaseClient();

        const resolvedUserId =
          await this.resolveUserId(
            userId
          );

        if (
          options.useCache !== false &&
          this.cache.userId ===
            resolvedUserId &&
          this.cache.record
        ) {
          return this.successResult({
            operation: "read",

            record:
              this.clone(
                this.cache.record
              ),

            source:
              "memory_cache",

            cached:
              true
          });
        }

        const {
          data,
          error
        } = await client
          .from(
            this.tableName
          )
          .select(
            this.getSelectColumns()
          )
          .eq(
            "user_id",
            resolvedUserId
          )
          .maybeSingle();

        if (error) {
          return this.failureResult({
            operation:
              "read",

            code:
              "preference_read_failed",

            error
          });
        }

        if (!data) {
          if (
            options.createIfMissing ===
            false
          ) {
            return this.successResult({
              operation:
                "read",

              record:
                null,

              source:
                "supabase",

              exists:
                false
            });
          }

          const initialPreferences =
            this.isPlainObject(
              options.preferenceOverrides
            )
              ? options.preferenceOverrides
              : this.getDefaultPreferences();

          return this.create(
            resolvedUserId,
            {
              activePreset:
                options.activePreset ||
                "default",

              preferenceOverrides:
                initialPreferences,

              changeSource:
                options.changeSource ||
                "system"
            }
          );
        }

        const record =
          this.normalizeRecord(
            data
          );

        this.setCache(
          record
        );

        return this.successResult({
          operation:
            "read",

          record,

          source:
            "supabase",

          exists:
            true
        });
      } catch (error) {
        return this.failureResult({
          operation:
            "read",

          code:
            "preference_read_exception",

          error
        });
      }
    },

    async exists(
      userId = null
    ) {
      const result =
        await this.read(
          userId,
          {
            createIfMissing:
              false,

            useCache:
              false
          }
        );

      if (!result.ok) {
        return result;
      }

      return {
        ...result,

        exists:
          Boolean(
            result.record
          )
      };
    },

    // ===================================================
    // CREATE
    // ===================================================

    async create(
      userId = null,
      options = {}
    ) {
      try {
        const client =
          this.requireSupabaseClient();

        const resolvedUserId =
          await this.resolveUserId(
            userId
          );

        this.requirePreferenceContract();

        const sourcePreferences =
          this.isPlainObject(
            options.preferenceOverrides
          )
            ? options.preferenceOverrides
            : this.getDefaultPreferences();

        const preferences =
          this.normalizeCompletePreferences(
            sourcePreferences
          );

        const activePreset =
          this.normalizePreset(
            options.activePreset ||
            "default"
          );

        const payload = {
          user_id:
            resolvedUserId,

          preference_overrides:
            preferences,

          active_preset:
            activePreset,

          schema_version:
            this.schemaVersion,

          last_change_source:
            this.normalizeChangeSource(
              options.changeSource ||
              "system"
            )
        };

        const {
          data,
          error
        } = await client
          .from(
            this.tableName
          )
          .insert(
            payload
          )
          .select(
            this.getSelectColumns()
          )
          .single();

        if (error) {
          if (
            this.isDuplicateKeyError(
              error
            )
          ) {
            return this.read(
              resolvedUserId,
              {
                createIfMissing:
                  false,

                useCache:
                  false
              }
            );
          }

          return this.failureResult({
            operation:
              "create",

            code:
              "preference_create_failed",

            error
          });
        }

        const record =
          this.normalizeRecord(
            data
          );

        this.setCache(
          record
        );

        return this.successResult({
          operation:
            "create",

          record,

          source:
            "supabase",

          created:
            true
        });
      } catch (error) {
        return this.failureResult({
          operation:
            "create",

          code:
            "preference_create_exception",

          error
        });
      }
    },

    // ===================================================
    // SAVE COMPLETE SNAPSHOT
    // ===================================================

    async save(
      userId = null,
      preferenceOverrides = {},
      options = {}
    ) {
      try {
        const client =
          this.requireSupabaseClient();

        const resolvedUserId =
          await this.resolveUserId(
            userId
          );

        this.requirePreferenceContract();

        // save() is intentionally strict.
        //
        // It represents replacement of the complete
        // persisted V3 preference snapshot.
        const preferences =
          this.normalizeCompletePreferences(
            preferenceOverrides
          );

        const activePreset =
          this.normalizePreset(
            options.activePreset ||
            this.cache.record
              ?.activePreset ||
            "custom"
          );

        const payload = {
          user_id:
            resolvedUserId,

          preference_overrides:
            preferences,

          active_preset:
            activePreset,

          // Always migrate writes forward to V3.
          schema_version:
            this.schemaVersion,

          last_change_source:
            this.normalizeChangeSource(
              options.changeSource ||
              "settings_ui"
            )
        };

        const {
          data,
          error
        } = await client
          .from(
            this.tableName
          )
          .upsert(
            payload,
            {
              onConflict:
                "user_id"
            }
          )
          .select(
            this.getSelectColumns()
          )
          .single();

        if (error) {
          return this.failureResult({
            operation:
              "save",

            code:
              "preference_save_failed",

            error
          });
        }

        const record =
          this.normalizeRecord(
            data
          );

        this.setCache(
          record
        );

        return this.successResult({
          operation:
            "save",

          record,

          source:
            "supabase"
        });
      } catch (error) {
        return this.failureResult({
          operation:
            "save",

          code:
            "preference_save_exception",

          error
        });
      }
    },

    // ===================================================
    // PATCH PARTIAL PREFERENCES
    // ===================================================

    async patch(
      userId = null,
      partialChanges = {},
      options = {}
    ) {
      try {
        const resolvedUserId =
          await this.resolveUserId(
            userId
          );

        this.requirePreferenceContract();

        const currentResult =
          await this.read(
            resolvedUserId,
            {
              createIfMissing:
                true,

              useCache:
                options.useCache !==
                false
            }
          );

        if (!currentResult.ok) {
          return currentResult;
        }

        const currentPreferences =
          currentResult.record
            ?.preferenceOverrides ||
          this.getDefaultPreferences();

        const normalizedChanges =
          this.normalizeOverrides(
            partialChanges
          );

        const mergedPreferences =
          this.deepMerge(
            currentPreferences,
            normalizedChanges
          );

        const completePreferences =
          this.normalizeCompletePreferences(
            mergedPreferences
          );

        return this.save(
          resolvedUserId,
          completePreferences,
          {
            activePreset:
              options.activePreset ||
              "custom",

            schemaVersion:
              this.schemaVersion,

            changeSource:
              options.changeSource ||
              "settings_ui"
          }
        );
      } catch (error) {
        return this.failureResult({
          operation:
            "patch",

          code:
            "preference_patch_exception",

          error
        });
      }
    },

    // ===================================================
    // SET ONE PREFERENCE
    // ===================================================

    async setPreference(
      userId = null,
      category,
      key,
      value,
      options = {}
    ) {
      try {
        this.assertNonEmptyString(
          category,
          "category"
        );

        this.assertNonEmptyString(
          key,
          "key"
        );

        this.assertNonEmptyString(
          value,
          "value"
        );

        const contract =
          this.requirePreferenceContract();

        if (
          !contract.isValidPreferenceValue(
            category,
            key,
            value
          )
        ) {
          return this.failureResult({
            operation:
              "setPreference",

            code:
              "invalid_preference_value",

            error:
              new Error(
                `Invalid preference value: ${category}.${key}=${value}`
              )
          });
        }

        // V3 IMPORTANT:
        //
        // "default" is NOT deletion.
        //
        // Example:
        // language.profanity = "default"
        // is a valid persisted value.
        return this.patch(
          userId,
          {
            [category]: {
              [key]:
                value
            }
          },
          {
            ...options,

            activePreset:
              options.activePreset ||
              "custom"
          }
        );
      } catch (error) {
        return this.failureResult({
          operation:
            "setPreference",

          code:
            "preference_set_exception",

          error
        });
      }
    },

    // ===================================================
    // PRESET
    // ===================================================

    async setPreset(
      userId = null,
      preset = "default",
      options = {}
    ) {
      try {
        const client =
          this.requireSupabaseClient();

        const resolvedUserId =
          await this.resolveUserId(
            userId
          );

        const normalizedPreset =
          this.normalizePreset(
            preset
          );

        const currentResult =
          await this.read(
            resolvedUserId,
            {
              createIfMissing:
                true,

              useCache:
                options.useCache !==
                false
            }
          );

        if (!currentResult.ok) {
          return currentResult;
        }

        const {
          data,
          error
        } = await client
          .from(
            this.tableName
          )
          .update({
            active_preset:
              normalizedPreset,

            schema_version:
              this.schemaVersion,

            last_change_source:
              this.normalizeChangeSource(
                options.changeSource ||
                "settings_ui"
              )
          })
          .eq(
            "user_id",
            resolvedUserId
          )
          .select(
            this.getSelectColumns()
          )
          .single();

        if (error) {
          return this.failureResult({
            operation:
              "setPreset",

            code:
              "preference_preset_update_failed",

            error
          });
        }

        const record =
          this.normalizeRecord(
            data
          );

        this.setCache(
          record
        );

        return this.successResult({
          operation:
            "setPreset",

          record,

          source:
            "supabase"
        });
      } catch (error) {
        return this.failureResult({
          operation:
            "setPreset",

          code:
            "preference_preset_update_exception",

          error
        });
      }
    },

    // ===================================================
    // RESTORE ONE PREFERENCE TO DEFAULT
    // ===================================================

    async deletePreference(
      userId = null,
      category,
      key,
      options = {}
    ) {
      try {
        this.assertNonEmptyString(
          category,
          "category"
        );

        this.assertNonEmptyString(
          key,
          "key"
        );

        const defaults =
          this.getDefaultPreferences();

        const defaultValue =
          defaults
            ?.[category]
            ?.[key];

        if (
          typeof defaultValue !==
          "string"
        ) {
          return this.failureResult({
            operation:
              "deletePreference",

            code:
              "preference_default_missing",

            error:
              new Error(
                `No default exists for ${category}.${key}.`
              )
          });
        }

        // V3 keeps complete snapshots.
        //
        // "Delete" now means:
        // restore this preference to its canonical default.
        return this.setPreference(
          userId,
          category,
          key,
          defaultValue,
          {
            ...options,

            changeSource:
              options.changeSource ||
              "reset"
          }
        );
      } catch (error) {
        return this.failureResult({
          operation:
            "deletePreference",

          code:
            "preference_delete_exception",

          error
        });
      }
    },

    // ===================================================
    // RESET CATEGORY
    // ===================================================

    async resetCategory(
      userId = null,
      category,
      options = {}
    ) {
      try {
        this.assertNonEmptyString(
          category,
          "category"
        );

        const resolvedUserId =
          await this.resolveUserId(
            userId
          );

        const defaults =
          this.getDefaultPreferences();

        const categoryDefaults =
          defaults[
            category
          ];

        if (
          !this.isPlainObject(
            categoryDefaults
          )
        ) {
          return this.failureResult({
            operation:
              "resetCategory",

            code:
              "preference_category_default_missing",

            error:
              new Error(
                `Unknown preference category: ${category}`
              )
          });
        }

        const currentResult =
          await this.read(
            resolvedUserId,
            {
              createIfMissing:
                true,

              useCache:
                options.useCache !==
                false
            }
          );

        if (!currentResult.ok) {
          return currentResult;
        }

        const currentPreferences =
          currentResult.record
            ?.preferenceOverrides ||
          defaults;

        const nextPreferences =
          this.clone(
            currentPreferences
          );

        nextPreferences[
          category
        ] =
          this.clone(
            categoryDefaults
          );

        return this.save(
          resolvedUserId,
          nextPreferences,
          {
            activePreset:
              options.activePreset ||
              "custom",

            schemaVersion:
              this.schemaVersion,

            changeSource:
              options.changeSource ||
              "reset"
          }
        );
      } catch (error) {
        return this.failureResult({
          operation:
            "resetCategory",

          code:
            "preference_category_reset_exception",

          error
        });
      }
    },

    // ===================================================
    // RESET EVERYTHING
    // ===================================================

    async resetAll(
      userId = null,
      options = {}
    ) {
      try {
        const resolvedUserId =
          await this.resolveUserId(
            userId
          );

        const defaults =
          this.getDefaultPreferences();

        // V3 intentionally does NOT call the old reset RPC.
        //
        // Reset means explicit canonical defaults,
        // not preference_overrides = {}.
        return this.save(
          resolvedUserId,
          defaults,
          {
            activePreset:
              "default",

            schemaVersion:
              this.schemaVersion,

            changeSource:
              options.changeSource ||
              "reset"
          }
        );
      } catch (error) {
        return this.failureResult({
          operation:
            "resetAll",

          code:
            "preference_reset_exception",

          error
        });
      }
    },

    // ===================================================
    // DELETE PROFILE
    // ===================================================

    async deleteProfile(
      userId = null
    ) {
      try {
        const client =
          this.requireSupabaseClient();

        const resolvedUserId =
          await this.resolveUserId(
            userId
          );

        const {
          error
        } = await client
          .from(
            this.tableName
          )
          .delete()
          .eq(
            "user_id",
            resolvedUserId
          );

        if (error) {
          return this.failureResult({
            operation:
              "deleteProfile",

            code:
              "preference_profile_delete_failed",

            error
          });
        }

        this.clearCache(
          resolvedUserId
        );

        return {
          ok: true,
          success: true,
          complete: true,

          operation:
            "deleteProfile",

          deleted:
            true,

          userId:
            resolvedUserId,

          source:
            this.source,

          version:
            this.version,

          schemaVersion:
            this.schemaVersion
        };
      } catch (error) {
        return this.failureResult({
          operation:
            "deleteProfile",

          code:
            "preference_profile_delete_exception",

          error
        });
      }
    },

    // ===================================================
    // CURRENT AUTHENTICATED USER
    // ===================================================

    async getCurrentUserId() {
      try {
        const client =
          this.requireSupabaseClient();

        const {
          data,
          error
        } =
          await client.auth
            .getUser();

        if (error) {
          return this.failureResult({
            operation:
              "getCurrentUserId",

            code:
              "auth_user_read_failed",

            error
          });
        }

        const userId =
          data?.user?.id ||
          null;

        if (!userId) {
          return this.failureResult({
            operation:
              "getCurrentUserId",

            code:
              "authenticated_user_missing",

            error:
              new Error(
                "No authenticated Supabase user is available."
              )
          });
        }

        return {
          ok: true,
          success: true,
          complete: true,

          userId,

          source:
            this.source,

          version:
            this.version
        };
      } catch (error) {
        return this.failureResult({
          operation:
            "getCurrentUserId",

          code:
            "auth_user_read_exception",

          error
        });
      }
    },

    // ===================================================
    // CACHE
    // ===================================================

    getCached(
      userId = null
    ) {
      if (
        !this.cache.record
      ) {
        return null;
      }

      if (
        userId &&
        this.cache.userId !==
          userId
      ) {
        return null;
      }

      return this.clone(
        this.cache.record
      );
    },

    setCache(
      record
    ) {
      if (
        !record?.userId
      ) {
        return false;
      }

      this.cache = {
        userId:
          record.userId,

        record:
          this.clone(
            record
          ),

        loadedAt:
          new Date()
            .toISOString()
      };

      return true;
    },

    clearCache(
      userId = null
    ) {
      if (
        userId &&
        this.cache.userId &&
        this.cache.userId !==
          userId
      ) {
        return false;
      }

      this.cache = {
        userId:
          null,

        record:
          null,

        loadedAt:
          null
      };

      return true;
    },

    // ===================================================
    // SUPABASE
    // ===================================================

    getSupabaseClient() {
      return (
        this.supabaseClient ||
        window.Ari?.supabase ||
        window.Ari?.supabaseClient ||
        window.supabaseClient ||
        window.supabase ||
        null
      );
    },

    requireSupabaseClient() {
      const client =
        this.getSupabaseClient();

      if (
        !client ||
        typeof client.from !==
          "function"
      ) {
        throw new Error(
          "A valid Supabase client is not available to AriUserPreferenceStore."
        );
      }

      return client;
    },

    async resolveUserId(
      userId = null
    ) {
      if (
        typeof userId ===
          "string" &&
        userId.trim()
      ) {
        return userId.trim();
      }

      const result =
        await this.getCurrentUserId();

      if (
        !result.ok ||
        !result.userId
      ) {
        throw new Error(
          result.error?.message ||
          "Unable to resolve the authenticated user ID."
        );
      }

      return result.userId;
    },

    // ===================================================
    // CONTRACT
    // ===================================================

    getPreferenceContract() {
      return (
        window
          .AriUserPreferenceContract ||
        window.Ari
          ?.userPreferenceContract ||
        null
      );
    },

    requirePreferenceContract() {
      const contract =
        this.getPreferenceContract();

      if (!contract) {
        throw new Error(
          "AriUserPreferenceContract is unavailable."
        );
      }

      const version =
        String(
          contract.schemaVersion ||
          contract.version ||
          ""
        );

      if (
        version !==
        this.requiredContractVersion
      ) {
        throw new Error(
          `AriUserPreferenceStore ${this.version} requires AriUserPreferenceContract ${this.requiredContractVersion}, but ${version || "an unknown version"} is loaded.`
        );
      }

      if (
        typeof contract
          .normalizeOverrides !==
          "function" ||
        typeof contract
          .validateOverrides !==
          "function" ||
        typeof contract
          .getRuntimeDefaults !==
          "function"
      ) {
        throw new Error(
          "AriUserPreferenceContract does not expose the required V3 preference methods."
        );
      }

      return contract;
    },

    // ===================================================
    // DEFAULTS
    // ===================================================

    getDefaultPreferences() {
      const contract =
        this.requirePreferenceContract();

      const defaults =
        contract.getRuntimeDefaults();

      const validation =
        contract.validateOverrides(
          defaults
        );

      if (
        validation?.ok !==
        true
      ) {
        throw new Error(
          [
            "Ari's canonical preference defaults are invalid.",
            ...(validation?.errors || []),
            ...(validation?.warnings || [])
          ].join(" ")
        );
      }

      this.assertCompletePreferences(
        defaults
      );

      return this.clone(
        defaults
      );
    },

    // ===================================================
    // NORMALIZE PARTIAL OVERRIDES
    // ===================================================

    normalizeOverrides(
      input = {}
    ) {
      const contract =
        this.requirePreferenceContract();

      if (
        !this.isPlainObject(
          input
        )
      ) {
        throw new Error(
          "Preference overrides must be a plain object."
        );
      }

      const result =
        contract.normalizeOverrides(
          input
        );

      if (
        result?.ok !==
        true
      ) {
        throw new Error(
          result?.warnings
            ?.join(", ") ||
          "Preference normalization failed."
        );
      }

      if (
        Array.isArray(
          result.warnings
        ) &&
        result.warnings.length
      ) {
        throw new Error(
          result.warnings.join(
            ", "
          )
        );
      }

      return this.clone(
        result.normalized
      );
    },

    // ===================================================
    // NORMALIZE COMPLETE SNAPSHOT
    // ===================================================

    normalizeCompletePreferences(
      input = {}
    ) {
      if (
        !this.isPlainObject(
          input
        )
      ) {
        throw new Error(
          "A complete Ari preference snapshot must be a plain object."
        );
      }

      const contract =
        this.requirePreferenceContract();

      // Do not fill missing values before validation.
      //
      // save() should not silently replace missing values
      // with defaults because that could overwrite a user's
      // existing selections.
      this.assertCompletePreferences(
        input
      );

      const result =
        contract.validateOverrides(
          input
        );

      if (
        result?.ok !==
        true
      ) {
        throw new Error(
          [
            "Ari preference snapshot validation failed.",
            ...(result?.errors || []),
            ...(result?.warnings || [])
          ].join(" ")
        );
      }

      this.assertCompletePreferences(
        result.normalized
      );

      return this.clone(
        result.normalized
      );
    },

    // ===================================================
    // NORMALIZE STORED DATA
    //
    // Read operations are migration tolerant.
    //
    // Unknown V1/V2 preference keys are ignored and
    // missing V3 preferences fall back to V3 defaults.
    // No migration write occurs automatically.
    // ===================================================

    normalizeStoredPreferences(
      input = {}
    ) {
      const contract =
        this.requirePreferenceContract();

      const defaults =
        contract.getRuntimeDefaults();

      if (
        !this.isPlainObject(
          input
        )
      ) {
        return {
          preferences:
            this.clone(
              defaults
            ),

          warnings: [
            "stored_preferences_not_object"
          ]
        };
      }

      const result =
        contract.normalizeOverrides(
          input
        );

      const normalizedStored =
        this.isPlainObject(
          result?.normalized
        )
          ? result.normalized
          : {};

      const preferences =
        this.deepMerge(
          defaults,
          normalizedStored
        );

      return {
        preferences,

        warnings:
          Array.isArray(
            result?.warnings
          )
            ? [...result.warnings]
            : []
      };
    },

    // ===================================================
    // COMPLETE SNAPSHOT ASSERTION
    // ===================================================

    assertCompletePreferences(
      input
    ) {
      const contract =
        this.requirePreferenceContract();

      const paths =
        Array.isArray(
          contract.preferencePaths
        )
          ? contract.preferencePaths
          : [];

      if (!paths.length) {
        throw new Error(
          "AriUserPreferenceContract does not define preferencePaths."
        );
      }

      for (
        const path
        of paths
      ) {
        const value =
          this.getPath(
            input,
            path
          );

        if (
          typeof value !==
            "string" ||
          !value.trim()
        ) {
          throw new Error(
            `Complete preference snapshot is missing ${path}.`
          );
        }

        const [
          category,
          key
        ] =
          path.split(".");

        if (
          !contract
            .isValidPreferenceValue(
              category,
              key,
              value
            )
        ) {
          throw new Error(
            `Complete preference snapshot contains invalid value ${path}=${value}.`
          );
        }
      }

      return true;
    },

    // ===================================================
    // PRESET NORMALIZATION
    // ===================================================

    normalizePreset(
      preset = "default"
    ) {
      const value =
        typeof preset ===
          "string" &&
        preset.trim()
          ? preset.trim()
          : "default";

      const contract =
        this.requirePreferenceContract();

      if (
        !contract.isValidPreset(
          value
        )
      ) {
        throw new Error(
          `Unknown Ari preference preset: ${value}`
        );
      }

      return value;
    },

    // ===================================================
    // CHANGE SOURCE
    // ===================================================

    normalizeChangeSource(
      source = "system"
    ) {
      const allowed =
        new Set([
          "settings_ui",
          "conversation",
          "onboarding",
          "reset",
          "migration",
          "system"
        ]);

      return allowed.has(
        source
      )
        ? source
        : "system";
    },

    // ===================================================
    // DATABASE RECORD NORMALIZATION
    // ===================================================

    normalizeRecord(
      data = {}
    ) {
      const rawPreferences =
        data.preference_overrides ??
        data.preferenceOverrides ??
        {};

      const normalizedStored =
        this.normalizeStoredPreferences(
          rawPreferences
        );

      return {
        userId:
          data.user_id ||
          data.userId ||
          null,

        // Canonical V3 runtime-facing shape.
        preferenceOverrides:
          this.clone(
            normalizedStored.preferences
          ),

        // Raw database value retained for diagnostics only.
        rawPreferenceOverrides:
          this.clone(
            rawPreferences
          ),

        preferenceWarnings:
          this.clone(
            normalizedStored.warnings
          ),

        activePreset:
          data.active_preset ||
          data.activePreset ||
          "default",

        // Actual schema stored in Supabase.
        schemaVersion:
          data.schema_version ||
          data.schemaVersion ||
          null,

        // Schema expected by this store.
        currentSchemaVersion:
          this.schemaVersion,

        requiresMigration:
          (
            data.schema_version ||
            data.schemaVersion ||
            null
          ) !==
          this.schemaVersion,

        revision:
          Number.isFinite(
            Number(
              data.revision
            )
          )
            ? Number(
                data.revision
              )
            : 1,

        lastChangeSource:
          data.last_change_source ||
          data.lastChangeSource ||
          "system",

        createdAt:
          data.created_at ||
          data.createdAt ||
          null,

        updatedAt:
          data.updated_at ||
          data.updatedAt ||
          null
      };
    },

    // ===================================================
    // RESULT SHAPES
    // ===================================================

    successResult({
      operation,
      record = null,
      source = "supabase",
      ...extra
    } = {}) {
      return {
        ok: true,
        success: true,
        complete: true,

        operation:
          operation ||
          null,

        source,

        storeSource:
          this.source,

        version:
          this.version,

        schemaVersion:
          record
            ?.schemaVersion ||
          this.schemaVersion,

        currentSchemaVersion:
          this.schemaVersion,

        record,

        // Convenience copies for consumers that do not
        // need to unwrap result.record.
        preferenceOverrides:
          record
            ?.preferenceOverrides ||
          {},

        activePreset:
          record
            ?.activePreset ||
          "default",

        revision:
          record
            ?.revision ??
          null,

        updatedAt:
          record
            ?.updatedAt ||
          null,

        ...extra
      };
    },

    failureResult({
      operation,
      code,
      error
    } = {}) {
      const normalizedError =
        this.normalizeError(
          error
        );

      return {
        ok: false,
        success: false,
        complete: false,

        operation:
          operation ||
          null,

        source:
          this.source,

        version:
          this.version,

        schemaVersion:
          this.schemaVersion,

        error: {
          code:
            code ||
            "preference_store_error",

          message:
            normalizedError.message,

          details:
            normalizedError.details,

          hint:
            normalizedError.hint,

          status:
            normalizedError.status
        }
      };
    },

    normalizeError(
      error
    ) {
      if (!error) {
        return {
          message:
            "An unknown preference store error occurred.",

          details:
            null,

          hint:
            null,

          status:
            null
        };
      }

      if (
        typeof error ===
        "string"
      ) {
        return {
          message:
            error,

          details:
            null,

          hint:
            null,

          status:
            null
        };
      }

      return {
        message:
          error.message ||
          "An unknown preference store error occurred.",

        details:
          error.details ||
          error.code ||
          null,

        hint:
          error.hint ||
          null,

        status:
          error.status ||
          error.statusCode ||
          null
      };
    },

    // ===================================================
    // DIAGNOSTICS
    // ===================================================

    getDiagnostics() {
      const contract =
        this.getPreferenceContract();

      return {
        storeVersion:
          this.version,

        schemaVersion:
          this.schemaVersion,

        requiredContractVersion:
          this.requiredContractVersion,

        contractAvailable:
          Boolean(
            contract
          ),

        contractVersion:
          contract
            ?.schemaVersion ||
          contract
            ?.version ||
          null,

        contractCompatible:
          String(
            contract
              ?.schemaVersion ||
            contract
              ?.version ||
            ""
          ) ===
          this.requiredContractVersion,

        supabaseAvailable:
          Boolean(
            this.getSupabaseClient()
          ),

        tableName:
          this.tableName,

        cache: {
          userId:
            this.cache.userId,

          loaded:
            Boolean(
              this.cache.record
            ),

          loadedAt:
            this.cache.loadedAt,

          schemaVersion:
            this.cache.record
              ?.schemaVersion ||
            null,

          requiresMigration:
            this.cache.record
              ?.requiresMigration ??
            null
        }
      };
    },

    // ===================================================
    // INTERNAL HELPERS
    // ===================================================

    getSelectColumns() {
      return [
        "user_id",
        "preference_overrides",
        "active_preset",
        "schema_version",
        "revision",
        "last_change_source",
        "created_at",
        "updated_at"
      ].join(",");
    },

    getPath(
      source,
      path
    ) {
      if (
        !this.isPlainObject(
          source
        ) ||
        typeof path !==
          "string"
      ) {
        return undefined;
      }

      const segments =
        path
          .split(".")
          .filter(Boolean);

      let cursor =
        source;

      for (
        const segment
        of segments
      ) {
        if (
          cursor === null ||
          cursor === undefined ||
          typeof cursor !==
            "object"
        ) {
          return undefined;
        }

        cursor =
          cursor[
            segment
          ];
      }

      return cursor;
    },

    deepMerge(
      base = {},
      patch = {}
    ) {
      const output =
        this.isPlainObject(
          base
        )
          ? this.clone(
              base
            )
          : {};

      if (
        !this.isPlainObject(
          patch
        )
      ) {
        return output;
      }

      for (
        const [
          key,
          value
        ]
        of Object.entries(
          patch
        )
      ) {
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

    isDuplicateKeyError(
      error
    ) {
      return Boolean(
        error &&
        (
          error.code ===
            "23505" ||
          String(
            error.message ||
            ""
          )
            .toLowerCase()
            .includes(
              "duplicate key"
            )
        )
      );
    },

    assertNonEmptyString(
      value,
      name
    ) {
      if (
        typeof value !==
          "string" ||
        !value.trim()
      ) {
        throw new Error(
          `${name} must be a non-empty string.`
        );
      }
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

    clone(
      value
    ) {
      if (
        value === undefined
      ) {
        return undefined;
      }

      if (
        value === null
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

  window.AriUserPreferenceStore =
    AriUserPreferenceStore;

  window.Ari.userPreferenceStore =
    AriUserPreferenceStore;

  console.log(
    "ARI USER PREFERENCE STORE LOADED:",
    AriUserPreferenceStore.version,
    {
      schemaVersion:
        AriUserPreferenceStore.schemaVersion,

      requiredContractVersion:
        AriUserPreferenceStore.requiredContractVersion,

      tableName:
        AriUserPreferenceStore.tableName
    }
  );
})();