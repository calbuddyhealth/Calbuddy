// ari/profile/ari-user-preference-store.js
// Ari User Preference Store
//
// Purpose:
// Provide one controlled persistence boundary for Ari user interaction
// preferences stored in Supabase.
//
// V1.0.0 — Canonical Supabase Preference Persistence
//
// Architectural flow:
//
// Settings UI / Preference Change Detector
//      ↓
// Ari User Preference Store
//      ↓
// Supabase
//
// Responsibilities:
// - Read the authenticated user's preference profile.
// - Create the user's preference profile when missing.
// - Save complete preference override objects.
// - Patch individual preference values without losing other settings.
// - Remove individual overrides.
// - Reset a category or the complete profile.
// - Update the active preset.
// - Normalize database records into one stable runtime shape.
// - Preserve database revision and source metadata.
// - Provide a small in-memory cache for the current browser session.
//
// Non-responsibilities:
// - Does not resolve Ari defaults.
// - Does not create OpenAI instructions.
// - Does not interpret natural-language preference requests.
// - Does not decide whether a preference should be persistent.
// - Does not override consent requirements.
// - Does not own application authentication.
// - Does not own the Supabase client.
// - Does not modify conversation-scoped or current-turn overrides.

window.Ari = window.Ari || {};

window.AriUserPreferenceStore = {
  version: "1.0.0",
  schemaVersion: "1.0.0",
  source: "ari-user-preference-store",
  authorityLevel: "canonical_preference_persistence",

  tableName: "ari_user_preferences",
  resetRpcName: "reset_my_ari_preferences",

  cache: {
    userId: null,
    record: null,
    loadedAt: null
  },

  /* =====================================================
     PUBLIC INITIALIZATION
  ===================================================== */

  initialize(options = {}) {
    if (options.supabaseClient) {
      this.supabaseClient = options.supabaseClient;
    }

    if (
      typeof options.tableName === "string" &&
      options.tableName.trim()
    ) {
      this.tableName = options.tableName.trim();
    }

    if (
      typeof options.resetRpcName === "string" &&
      options.resetRpcName.trim()
    ) {
      this.resetRpcName = options.resetRpcName.trim();
    }

    return {
      ok: true,
      success: true,
      initialized: Boolean(this.getSupabaseClient()),
      source: this.source,
      version: this.version
    };
  },

  /* =====================================================
     READ OPERATIONS
  ===================================================== */

  async read(userId = null, options = {}) {
    try {
      const client = this.requireSupabaseClient();
      const resolvedUserId = await this.resolveUserId(userId);

      if (
        options.useCache !== false &&
        this.cache.userId === resolvedUserId &&
        this.cache.record
      ) {
        return this.successResult({
          operation: "read",
          record: this.clone(this.cache.record),
          source: "memory_cache",
          cached: true
        });
      }

      const { data, error } = await client
        .from(this.tableName)
        .select(
          [
            "user_id",
            "preference_overrides",
            "active_preset",
            "schema_version",
            "revision",
            "last_change_source",
            "created_at",
            "updated_at"
          ].join(",")
        )
        .eq("user_id", resolvedUserId)
        .maybeSingle();

      if (error) {
        return this.failureResult({
          operation: "read",
          code: "preference_read_failed",
          error
        });
      }

      if (!data) {
        if (options.createIfMissing === false) {
          return this.successResult({
            operation: "read",
            record: null,
            source: "supabase",
            exists: false
          });
        }

        return this.create(resolvedUserId, {
          activePreset: options.activePreset || "default",
          preferenceOverrides: options.preferenceOverrides || {},
          changeSource: options.changeSource || "system"
        });
      }

      const record = this.normalizeRecord(data);
      this.setCache(record);

      return this.successResult({
        operation: "read",
        record,
        source: "supabase",
        exists: true
      });
    } catch (error) {
      return this.failureResult({
        operation: "read",
        code: "preference_read_exception",
        error
      });
    }
  },

  async exists(userId = null) {
    const result = await this.read(userId, {
      createIfMissing: false,
      useCache: false
    });

    if (!result.ok) {
      return result;
    }

    return {
      ...result,
      exists: Boolean(result.record)
    };
  },

  async getCurrentUserId() {
    try {
      const client = this.requireSupabaseClient();

      const {
        data,
        error
      } = await client.auth.getUser();

      if (error) {
        return this.failureResult({
          operation: "getCurrentUserId",
          code: "auth_user_read_failed",
          error
        });
      }

      const userId = data?.user?.id || null;

      if (!userId) {
        return this.failureResult({
          operation: "getCurrentUserId",
          code: "authenticated_user_missing",
          error: new Error(
            "No authenticated Supabase user is available."
          )
        });
      }

      return {
        ok: true,
        success: true,
        userId,
        source: this.source
      };
    } catch (error) {
      return this.failureResult({
        operation: "getCurrentUserId",
        code: "auth_user_read_exception",
        error
      });
    }
  },

  /* =====================================================
     CREATE AND SAVE OPERATIONS
  ===================================================== */

  async create(userId = null, options = {}) {
    try {
      const client = this.requireSupabaseClient();
      const resolvedUserId = await this.resolveUserId(userId);

      const preferenceOverrides = this.normalizeOverrides(
        options.preferenceOverrides || {}
      );

      const activePreset = this.normalizePreset(
        options.activePreset || "default"
      );

      const payload = {
        user_id: resolvedUserId,
        preference_overrides: preferenceOverrides,
        active_preset: activePreset,
        schema_version:
          options.schemaVersion || this.schemaVersion,
        last_change_source: this.normalizeChangeSource(
          options.changeSource || "system"
        )
      };

      const { data, error } = await client
        .from(this.tableName)
        .insert(payload)
        .select(
          [
            "user_id",
            "preference_overrides",
            "active_preset",
            "schema_version",
            "revision",
            "last_change_source",
            "created_at",
            "updated_at"
          ].join(",")
        )
        .single();

      if (error) {
        if (this.isDuplicateKeyError(error)) {
          return this.read(resolvedUserId, {
            createIfMissing: false,
            useCache: false
          });
        }

        return this.failureResult({
          operation: "create",
          code: "preference_create_failed",
          error
        });
      }

      const record = this.normalizeRecord(data);
      this.setCache(record);

      return this.successResult({
        operation: "create",
        record,
        source: "supabase",
        created: true
      });
    } catch (error) {
      return this.failureResult({
        operation: "create",
        code: "preference_create_exception",
        error
      });
    }
  },

  async save(
    userId = null,
    preferenceOverrides = {},
    options = {}
  ) {
    try {
      const client = this.requireSupabaseClient();
      const resolvedUserId = await this.resolveUserId(userId);

      const normalizedOverrides =
        this.normalizeOverrides(preferenceOverrides);

      const payload = {
        user_id: resolvedUserId,
        preference_overrides: normalizedOverrides,
        active_preset: this.normalizePreset(
          options.activePreset ||
          this.cache.record?.activePreset ||
          "default"
        ),
        schema_version:
          options.schemaVersion || this.schemaVersion,
        last_change_source: this.normalizeChangeSource(
          options.changeSource || "settings_ui"
        )
      };

      const { data, error } = await client
        .from(this.tableName)
        .upsert(payload, {
          onConflict: "user_id"
        })
        .select(
          [
            "user_id",
            "preference_overrides",
            "active_preset",
            "schema_version",
            "revision",
            "last_change_source",
            "created_at",
            "updated_at"
          ].join(",")
        )
        .single();

      if (error) {
        return this.failureResult({
          operation: "save",
          code: "preference_save_failed",
          error
        });
      }

      const record = this.normalizeRecord(data);
      this.setCache(record);

      return this.successResult({
        operation: "save",
        record,
        source: "supabase"
      });
    } catch (error) {
      return this.failureResult({
        operation: "save",
        code: "preference_save_exception",
        error
      });
    }
  },

  async patch(
    userId = null,
    partialChanges = {},
    options = {}
  ) {
    try {
      const resolvedUserId = await this.resolveUserId(userId);

      const currentResult = await this.read(resolvedUserId, {
        createIfMissing: true,
        useCache: options.useCache !== false
      });

      if (!currentResult.ok) {
        return currentResult;
      }

      const currentOverrides =
        currentResult.record?.preferenceOverrides || {};

      const normalizedChanges =
        this.normalizeOverrides(partialChanges);

      const mergedOverrides = this.deepMerge(
        currentOverrides,
        normalizedChanges
      );

      return this.save(
        resolvedUserId,
        mergedOverrides,
        {
          activePreset:
            options.activePreset ||
            currentResult.record?.activePreset ||
            "custom",

          schemaVersion:
            currentResult.record?.schemaVersion ||
            this.schemaVersion,

          changeSource:
            options.changeSource || "settings_ui"
        }
      );
    } catch (error) {
      return this.failureResult({
        operation: "patch",
        code: "preference_patch_exception",
        error
      });
    }
  },

  async setPreference(
    userId = null,
    category,
    key,
    value,
    options = {}
  ) {
    try {
      this.assertNonEmptyString(category, "category");
      this.assertNonEmptyString(key, "key");
      this.assertNonEmptyString(value, "value");

      if (value === "default") {
        return this.deletePreference(
          userId,
          category,
          key,
          options
        );
      }

      const contract = this.getPreferenceContract();

      if (
        contract &&
        !contract.isValidPreferenceValue(
          category,
          key,
          value
        )
      ) {
        return this.failureResult({
          operation: "setPreference",
          code: "invalid_preference_value",
          error: new Error(
            `Invalid preference value: ${category}.${key}=${value}`
          )
        });
      }

      return this.patch(
        userId,
        {
          [category]: {
            [key]: value
          }
        },
        {
          ...options,
          activePreset:
            options.activePreset || "custom"
        }
      );
    } catch (error) {
      return this.failureResult({
        operation: "setPreference",
        code: "preference_set_exception",
        error
      });
    }
  },

  async setPreset(
    userId = null,
    preset = "default",
    options = {}
  ) {
    try {
      const client = this.requireSupabaseClient();
      const resolvedUserId = await this.resolveUserId(userId);
      const normalizedPreset = this.normalizePreset(preset);

      const currentResult = await this.read(resolvedUserId, {
        createIfMissing: true,
        useCache: options.useCache !== false
      });

      if (!currentResult.ok) {
        return currentResult;
      }

      const { data, error } = await client
        .from(this.tableName)
        .update({
          active_preset: normalizedPreset,
          last_change_source: this.normalizeChangeSource(
            options.changeSource || "settings_ui"
          )
        })
        .eq("user_id", resolvedUserId)
        .select(
          [
            "user_id",
            "preference_overrides",
            "active_preset",
            "schema_version",
            "revision",
            "last_change_source",
            "created_at",
            "updated_at"
          ].join(",")
        )
        .single();

      if (error) {
        return this.failureResult({
          operation: "setPreset",
          code: "preference_preset_update_failed",
          error
        });
      }

      const record = this.normalizeRecord(data);
      this.setCache(record);

      return this.successResult({
        operation: "setPreset",
        record,
        source: "supabase"
      });
    } catch (error) {
      return this.failureResult({
        operation: "setPreset",
        code: "preference_preset_update_exception",
        error
      });
    }
  },

  /* =====================================================
     DELETE AND RESET OPERATIONS
  ===================================================== */

  async deletePreference(
    userId = null,
    category,
    key,
    options = {}
  ) {
    try {
      this.assertNonEmptyString(category, "category");
      this.assertNonEmptyString(key, "key");

      const resolvedUserId = await this.resolveUserId(userId);

      const currentResult = await this.read(resolvedUserId, {
        createIfMissing: true,
        useCache: options.useCache !== false
      });

      if (!currentResult.ok) {
        return currentResult;
      }

      const contract = this.getPreferenceContract();

      const nextOverrides = contract
        ? contract.removePreferenceOverride(
            currentResult.record.preferenceOverrides,
            category,
            key
          )
        : this.removeNestedKey(
            currentResult.record.preferenceOverrides,
            category,
            key
          );

      return this.save(
        resolvedUserId,
        nextOverrides,
        {
          activePreset:
            options.activePreset ||
            currentResult.record.activePreset ||
            "custom",

          schemaVersion:
            currentResult.record.schemaVersion ||
            this.schemaVersion,

          changeSource:
            options.changeSource || "settings_ui"
        }
      );
    } catch (error) {
      return this.failureResult({
        operation: "deletePreference",
        code: "preference_delete_exception",
        error
      });
    }
  },

  async resetCategory(
    userId = null,
    category,
    options = {}
  ) {
    try {
      this.assertNonEmptyString(category, "category");

      const resolvedUserId = await this.resolveUserId(userId);

      const currentResult = await this.read(resolvedUserId, {
        createIfMissing: true,
        useCache: options.useCache !== false
      });

      if (!currentResult.ok) {
        return currentResult;
      }

      const contract = this.getPreferenceContract();

      const nextOverrides = contract
        ? contract.resetCategory(
            currentResult.record.preferenceOverrides,
            category
          )
        : this.removeTopLevelKey(
            currentResult.record.preferenceOverrides,
            category
          );

      return this.save(
        resolvedUserId,
        nextOverrides,
        {
          activePreset:
            options.activePreset ||
            currentResult.record.activePreset ||
            "custom",

          schemaVersion:
            currentResult.record.schemaVersion ||
            this.schemaVersion,

          changeSource:
            options.changeSource || "reset"
        }
      );
    } catch (error) {
      return this.failureResult({
        operation: "resetCategory",
        code: "preference_category_reset_exception",
        error
      });
    }
  },

  async resetAll(userId = null, options = {}) {
    try {
      const client = this.requireSupabaseClient();
      const resolvedUserId = await this.resolveUserId(userId);

      if (options.useRpc !== false) {
        const { data, error } = await client.rpc(
          this.resetRpcName
        );

        if (!error && data) {
          const record = this.normalizeRecord(data);
          this.setCache(record);

          return this.successResult({
            operation: "resetAll",
            record,
            source: "supabase_rpc",
            reset: true
          });
        }

        if (
          error &&
          options.fallbackToDirectUpdate === false
        ) {
          return this.failureResult({
            operation: "resetAll",
            code: "preference_reset_rpc_failed",
            error
          });
        }
      }

      return this.save(
        resolvedUserId,
        {},
        {
          activePreset: "default",
          schemaVersion: this.schemaVersion,
          changeSource: "reset"
        }
      );
    } catch (error) {
      return this.failureResult({
        operation: "resetAll",
        code: "preference_reset_exception",
        error
      });
    }
  },

  async deleteProfile(userId = null) {
    try {
      const client = this.requireSupabaseClient();
      const resolvedUserId = await this.resolveUserId(userId);

      const { error } = await client
        .from(this.tableName)
        .delete()
        .eq("user_id", resolvedUserId);

      if (error) {
        return this.failureResult({
          operation: "deleteProfile",
          code: "preference_profile_delete_failed",
          error
        });
      }

      this.clearCache(resolvedUserId);

      return {
        ok: true,
        success: true,
        operation: "deleteProfile",
        deleted: true,
        userId: resolvedUserId,
        source: this.source
      };
    } catch (error) {
      return this.failureResult({
        operation: "deleteProfile",
        code: "preference_profile_delete_exception",
        error
      });
    }
  },

  /* =====================================================
     CACHE OPERATIONS
  ===================================================== */

  getCached(userId = null) {
    if (!this.cache.record) {
      return null;
    }

    if (
      userId &&
      this.cache.userId !== userId
    ) {
      return null;
    }

    return this.clone(this.cache.record);
  },

  setCache(record) {
    if (!record?.userId) {
      return;
    }

    this.cache = {
      userId: record.userId,
      record: this.clone(record),
      loadedAt: new Date().toISOString()
    };
  },

  clearCache(userId = null) {
    if (
      userId &&
      this.cache.userId &&
      this.cache.userId !== userId
    ) {
      return false;
    }

    this.cache = {
      userId: null,
      record: null,
      loadedAt: null
    };

    return true;
  },

  /* =====================================================
     AUTHENTICATION AND CLIENT RESOLUTION
  ===================================================== */

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
    const client = this.getSupabaseClient();

    if (
      !client ||
      typeof client.from !== "function"
    ) {
      throw new Error(
        "A valid Supabase client is not available to AriUserPreferenceStore."
      );
    }

    return client;
  },

  async resolveUserId(userId = null) {
    if (
      typeof userId === "string" &&
      userId.trim()
    ) {
      return userId.trim();
    }

    const result =
      await this.getCurrentUserId();

    if (!result.ok || !result.userId) {
      throw new Error(
        result.error?.message ||
        "Unable to resolve the authenticated user ID."
      );
    }

    return result.userId;
  },

  /* =====================================================
     NORMALIZATION
  ===================================================== */

  normalizeOverrides(input = {}) {
    const contract = this.getPreferenceContract();

    if (contract) {
      const result =
        contract.normalizeOverrides(input);

      if (!result.ok) {
        throw new Error(
          result.warnings?.join(", ") ||
          "Preference override normalization failed."
        );
      }

      return result.normalized;
    }

    if (!this.isPlainObject(input)) {
      throw new Error(
        "Preference overrides must be a plain object."
      );
    }

    return this.clone(input);
  },

  normalizePreset(preset = "default") {
    const value =
      typeof preset === "string" &&
      preset.trim()
        ? preset.trim()
        : "default";

    const contract = this.getPreferenceContract();

    if (
      contract &&
      !contract.isValidPreset(value)
    ) {
      throw new Error(
        `Unknown Ari preference preset: ${value}`
      );
    }

    return value;
  },

  normalizeChangeSource(source = "system") {
    const allowed = new Set([
      "settings_ui",
      "conversation",
      "onboarding",
      "reset",
      "migration",
      "system"
    ]);

    return allowed.has(source)
      ? source
      : "system";
  },

  normalizeRecord(data = {}) {
    return {
      userId:
        data.user_id ||
        data.userId ||
        null,

      preferenceOverrides:
        this.clone(
          data.preference_overrides ||
          data.preferenceOverrides ||
          {}
        ),

      activePreset:
        data.active_preset ||
        data.activePreset ||
        "default",

      schemaVersion:
        data.schema_version ||
        data.schemaVersion ||
        this.schemaVersion,

      revision:
        Number.isFinite(Number(data.revision))
          ? Number(data.revision)
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

  /* =====================================================
     RESULT SHAPES
  ===================================================== */

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
      operation: operation || null,
      source,
      storeSource: this.source,
      version: this.version,
      schemaVersion:
        record?.schemaVersion ||
        this.schemaVersion,
      record,
      preferenceOverrides:
        record?.preferenceOverrides || {},
      activePreset:
        record?.activePreset || "default",
      revision:
        record?.revision || null,
      updatedAt:
        record?.updatedAt || null,
      ...extra
    };
  },

  failureResult({
    operation,
    code,
    error
  } = {}) {
    const normalizedError =
      this.normalizeError(error);

    return {
      ok: false,
      success: false,
      complete: false,
      operation: operation || null,
      source: this.source,
      version: this.version,
      schemaVersion: this.schemaVersion,
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

  normalizeError(error) {
    if (!error) {
      return {
        message:
          "An unknown preference store error occurred.",
        details: null,
        hint: null,
        status: null
      };
    }

    if (typeof error === "string") {
      return {
        message: error,
        details: null,
        hint: null,
        status: null
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

  /* =====================================================
     INTERNAL HELPERS
  ===================================================== */

  getPreferenceContract() {
    return (
      window.AriUserPreferenceContract ||
      window.Ari?.userPreferenceContract ||
      null
    );
  },

  deepMerge(base = {}, patch = {}) {
    const output =
      this.isPlainObject(base)
        ? this.clone(base)
        : {};

    if (!this.isPlainObject(patch)) {
      return output;
    }

    for (const [key, value] of Object.entries(
      patch
    )) {
      if (
        this.isPlainObject(value) &&
        this.isPlainObject(output[key])
      ) {
        output[key] =
          this.deepMerge(
            output[key],
            value
          );
      } else {
        output[key] =
          this.clone(value);
      }
    }

    return output;
  },

  removeNestedKey(
    input = {},
    category,
    key
  ) {
    const output =
      this.clone(input);

    if (
      output?.[category] &&
      Object.prototype.hasOwnProperty.call(
        output[category],
        key
      )
    ) {
      delete output[category][key];

      if (
        Object.keys(
          output[category]
        ).length === 0
      ) {
        delete output[category];
      }
    }

    return output;
  },

  removeTopLevelKey(input = {}, key) {
    const output =
      this.clone(input);

    if (
      Object.prototype.hasOwnProperty.call(
        output,
        key
      )
    ) {
      delete output[key];
    }

    return output;
  },

  isDuplicateKeyError(error) {
    return Boolean(
      error &&
      (
        error.code === "23505" ||
        String(error.message || "")
          .toLowerCase()
          .includes("duplicate key")
      )
    );
  },

  assertNonEmptyString(value, name) {
    if (
      typeof value !== "string" ||
      !value.trim()
    ) {
      throw new Error(
        `${name} must be a non-empty string.`
      );
    }
  },

  isPlainObject(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  },

  clone(value) {
    if (value === undefined) {
      return undefined;
    }

    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (error) {
      return value;
    }
  }
};
