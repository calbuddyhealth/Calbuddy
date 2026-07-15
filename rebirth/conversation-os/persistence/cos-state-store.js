// rebirth/conversation-os/persistence/cos-state-store.js
// ARI Rebirth — Conversation Operating System State Store
//
// Purpose:
// Provide a storage-agnostic persistence adapter for Conversation Operating
// System state.
//
// V1.0.0 — Canonical COS State Persistence Adapter
//
// Canonical flow:
//
// Conversation ID
//      ↓
// Storage Key Resolution
//      ↓
// State Serialization
//      ↓
// Persistent Storage Adapter
//      ↓
// State Deserialization
//      ↓
// Optional Migration
//      ↓
// Optional Validation
//      ↓
// Canonical Loaded COS State
//
// Supported adapters:
//
// - memory
// - localStorage
// - sessionStorage
// - custom async adapter
//
// Authority:
//
// This component is authoritative only for:
//
// - deriving deterministic storage keys,
// - serializing COS state,
// - deserializing COS state,
// - loading stored COS state,
// - saving COS state,
// - deleting stored COS state,
// - listing stored conversation IDs when supported,
// - preserving storage metadata,
// - invoking an installed state migrator,
// - invoking an installed state validator.
//
// Non-authority:
//
// This component must not:
//
// - interpret user language,
// - classify intent,
// - classify conversation function,
// - infer semantic meaning,
// - infer emotion,
// - infer safety severity,
// - modify conversation placement,
// - resolve references,
// - mutate COS state semantics,
// - invent missing threads,
// - invent missing turns,
// - silently discard invalid state,
// - generate responses.
//
// Architectural rule:
//
// Persistence is infrastructure, not conversational authority.
//
// This store preserves state produced by authoritative COS components.
// It may migrate schema structure through an explicitly installed migrator.
// It must not reinterpret the meaning of stored conversation state.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.stateStore
//
// CommonJS:
//
// module.exports = cosStateStore

(function initializeCosStateStore(globalScope) {
  "use strict";

  const root =
    globalScope ||
    (
      typeof globalThis !== "undefined"
        ? globalThis
        : typeof window !== "undefined"
          ? window
          : {}
    );

  root.Ari = root.Ari || {};
  root.Ari.Rebirth = root.Ari.Rebirth || {};
  root.Ari.Rebirth.ConversationOS =
    root.Ari.Rebirth.ConversationOS || {};

  const ConversationOS =
    root.Ari.Rebirth.ConversationOS;

  /* =====================================================
     CONSTANTS
  ===================================================== */

  const VERSION = "1.0.0";
  const SCHEMA_VERSION = "1.0.0";

  const AUTHORITY =
    "conversation_operating_system";

  const COMPONENT_NAME =
    "cos-state-store";

  const RECORD_TYPE =
    "conversation_os_persisted_state_record";

  const DEFAULT_NAMESPACE =
    "ari.rebirth.cos";

  const DEFAULT_KEY_PREFIX =
    `${DEFAULT_NAMESPACE}.state`;

  const ADAPTER_TYPES = Object.freeze([
    "memory",
    "localStorage",
    "sessionStorage",
    "custom"
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosStateStoreError extends Error {
    constructor(
      code,
      message,
      {
        details = null,
        cause = null,
        recoverable = false
      } = {}
    ) {
      super(
        message ||
        code ||
        "COS state store error"
      );

      this.name =
        "CosStateStoreError";

      this.code =
        code ||
        "COS_STATE_STORE_ERROR";

      this.details = details;
      this.cause = cause;

      this.recoverable =
        recoverable === true;

      if (
        Error.captureStackTrace &&
        typeof Error.captureStackTrace ===
          "function"
      ) {
        Error.captureStackTrace(
          this,
          CosStateStoreError
        );
      }
    }
  }

  /* =====================================================
     BASIC UTILITIES
  ===================================================== */

  function isObject(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  function isFunction(value) {
    return typeof value === "function";
  }

  function isString(value) {
    return typeof value === "string";
  }

  function isNonEmptyString(value) {
    return (
      isString(value) &&
      value.trim().length > 0
    );
  }

  function firstDefined(...values) {
    for (const value of values) {
      if (value !== undefined) {
        return value;
      }
    }

    return undefined;
  }

  function firstNonEmptyString(...values) {
    for (const value of values) {
      if (isNonEmptyString(value)) {
        return value.trim();
      }
    }

    return null;
  }

  function normalizeInteger(
    value,
    fallback = 0
  ) {
    const numeric =
      Number(value);

    if (!Number.isFinite(numeric)) {
      return fallback;
    }

    return Math.trunc(numeric);
  }

  function safeClone(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return value;
    }

    if (
      typeof structuredClone ===
      "function"
    ) {
      try {
        return structuredClone(value);
      } catch (error) {
        // Continue to JSON fallback.
      }
    }

    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (error) {
      return value;
    }
  }

  function deepFreeze(
    value,
    seen = new WeakSet()
  ) {
    if (
      value === null ||
      typeof value !== "object"
    ) {
      return value;
    }

    if (seen.has(value)) {
      return value;
    }

    seen.add(value);

    for (
      const key of Reflect.ownKeys(value)
    ) {
      const child =
        value[key];

      if (
        child !== null &&
        typeof child === "object"
      ) {
        deepFreeze(
          child,
          seen
        );
      }
    }

    return Object.freeze(value);
  }

  function freezeClone(value) {
    return deepFreeze(
      safeClone(value)
    );
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function encodeKeySegment(value) {
    return encodeURIComponent(
      String(value)
    );
  }

  function decodeKeySegment(value) {
    try {
      return decodeURIComponent(value);
    } catch (error) {
      return value;
    }
  }

  function safeError(error) {
    if (error instanceof Error) {
      return {
        name:
          error.name || "Error",

        code:
          firstNonEmptyString(
            error.code
          ) ||
          "COS_STATE_STORE_ERROR",

        message:
          error.message ||
          "Unknown COS state-store error",

        recoverable:
          error.recoverable === true,

        details:
          error.details === undefined
            ? null
            : safeClone(
                error.details
              )
      };
    }

    return {
      name: "Error",

      code:
        "COS_STATE_STORE_ERROR",

      message:
        isNonEmptyString(error)
          ? error
          : "Unknown COS state-store error",

      recoverable: false,

      details:
        safeClone(error)
    };
  }

  /* =====================================================
     MEMORY STORAGE
  ===================================================== */

  const memoryStorageData =
    new Map();

  const memoryStorageAdapter = {
    type: "memory",

    async getItem(key) {
      return memoryStorageData.has(key)
        ? memoryStorageData.get(key)
        : null;
    },

    async setItem(key, value) {
      memoryStorageData.set(
        key,
        String(value)
      );
    },

    async removeItem(key) {
      memoryStorageData.delete(key);
    },

    async clear() {
      memoryStorageData.clear();
    },

    async keys() {
      return Array.from(
        memoryStorageData.keys()
      );
    }
  };

  /* =====================================================
     WEB STORAGE ADAPTER
  ===================================================== */

  function createWebStorageAdapter(
    storage,
    type
  ) {
    if (
      !storage ||
      !isFunction(storage.getItem) ||
      !isFunction(storage.setItem) ||
      !isFunction(storage.removeItem)
    ) {
      return null;
    }

    return {
      type,

      async getItem(key) {
        return storage.getItem(key);
      },

      async setItem(key, value) {
        storage.setItem(
          key,
          String(value)
        );
      },

      async removeItem(key) {
        storage.removeItem(key);
      },

      async clear() {
        storage.clear();
      },

      async keys() {
        const keys = [];

        for (
          let index = 0;
          index < storage.length;
          index += 1
        ) {
          const key =
            storage.key(index);

          if (key !== null) {
            keys.push(key);
          }
        }

        return keys;
      }
    };
  }

  function readLocalStorageAdapter() {
    try {
      if (
        typeof localStorage ===
        "undefined"
      ) {
        return null;
      }

      return createWebStorageAdapter(
        localStorage,
        "localStorage"
      );
    } catch (error) {
      return null;
    }
  }

  function readSessionStorageAdapter() {
    try {
      if (
        typeof sessionStorage ===
        "undefined"
      ) {
        return null;
      }

      return createWebStorageAdapter(
        sessionStorage,
        "sessionStorage"
      );
    } catch (error) {
      return null;
    }
  }

  /* =====================================================
     CUSTOM ADAPTER NORMALIZATION
  ===================================================== */

  function normalizeCustomAdapter(
    adapter
  ) {
    if (!isObject(adapter)) {
      return null;
    }

    const getItem =
      isFunction(adapter.getItem)
        ? adapter.getItem.bind(adapter)
        : isFunction(adapter.get)
          ? adapter.get.bind(adapter)
          : isFunction(adapter.load)
            ? adapter.load.bind(adapter)
            : null;

    const setItem =
      isFunction(adapter.setItem)
        ? adapter.setItem.bind(adapter)
        : isFunction(adapter.set)
          ? adapter.set.bind(adapter)
          : isFunction(adapter.save)
            ? adapter.save.bind(adapter)
            : null;

    const removeItem =
      isFunction(adapter.removeItem)
        ? adapter.removeItem.bind(adapter)
        : isFunction(adapter.remove)
          ? adapter.remove.bind(adapter)
          : isFunction(adapter.delete)
            ? adapter.delete.bind(adapter)
            : null;

    if (
      !getItem ||
      !setItem ||
      !removeItem
    ) {
      return null;
    }

    return {
      type:
        firstNonEmptyString(
          adapter.type,
          adapter.name
        ) || "custom",

      async getItem(key) {
        return await getItem(key);
      },

      async setItem(key, value) {
        return await setItem(
          key,
          value
        );
      },

      async removeItem(key) {
        return await removeItem(key);
      },

      async clear() {
        if (isFunction(adapter.clear)) {
          return await adapter.clear();
        }

        throw new CosStateStoreError(
          "COS_STATE_STORE_CLEAR_UNSUPPORTED",
          "The custom persistence adapter does not support clear().",
          {
            recoverable: true
          }
        );
      },

      async keys() {
        if (isFunction(adapter.keys)) {
          return await adapter.keys();
        }

        if (isFunction(adapter.listKeys)) {
          return await adapter.listKeys();
        }

        throw new CosStateStoreError(
          "COS_STATE_STORE_KEYS_UNSUPPORTED",
          "The custom persistence adapter does not support key enumeration.",
          {
            recoverable: true
          }
        );
      }
    };
  }

  /* =====================================================
     ADAPTER RESOLUTION
  ===================================================== */

  function resolveAdapter(
    adapterOption = null
  ) {
    if (
      isObject(adapterOption)
    ) {
      const normalized =
        normalizeCustomAdapter(
          adapterOption
        );

      if (!normalized) {
        throw new CosStateStoreError(
          "COS_STATE_STORE_CUSTOM_ADAPTER_INVALID",
          "Custom COS state-store adapter is invalid."
        );
      }

      return normalized;
    }

    const requestedType =
      firstNonEmptyString(
        adapterOption
      ) || "memory";

    switch (requestedType) {
      case "localStorage": {
        const adapter =
          readLocalStorageAdapter();

        if (!adapter) {
          throw new CosStateStoreError(
            "COS_STATE_STORE_LOCAL_STORAGE_UNAVAILABLE",
            "localStorage is unavailable.",
            {
              recoverable: true
            }
          );
        }

        return adapter;
      }

      case "sessionStorage": {
        const adapter =
          readSessionStorageAdapter();

        if (!adapter) {
          throw new CosStateStoreError(
            "COS_STATE_STORE_SESSION_STORAGE_UNAVAILABLE",
            "sessionStorage is unavailable.",
            {
              recoverable: true
            }
          );
        }

        return adapter;
      }

      case "memory":
        return memoryStorageAdapter;

      default:
        throw new CosStateStoreError(
          "COS_STATE_STORE_ADAPTER_TYPE_INVALID",
          "Unsupported COS state-store adapter type.",
          {
            details: {
              requestedType,
              supportedTypes:
                ADAPTER_TYPES
            }
          }
        );
    }
  }

  /* =====================================================
     COMPONENT DISCOVERY
  ===================================================== */

  function resolveMigrator(
    override = null
  ) {
    if (override) {
      return override;
    }

    return (
      ConversationOS.stateMigrator ||
      ConversationOS.cosStateMigrator ||
      null
    );
  }

  function resolveStateValidator(
    override = null
  ) {
    if (override) {
      return override;
    }

    return (
      ConversationOS.state ||
      ConversationOS.cosState ||
      null
    );
  }

  function resolveMigrationCallable(
    migrator
  ) {
    if (!migrator) {
      return null;
    }

    if (isFunction(migrator)) {
      return migrator.bind(migrator);
    }

    for (
      const method of [
        "migrate",
        "upgrade",
        "run"
      ]
    ) {
      if (
        isFunction(
          migrator[method]
        )
      ) {
        return migrator[
          method
        ].bind(migrator);
      }
    }

    return null;
  }

  function resolveValidationCallable(
    validator
  ) {
    if (!validator) {
      return null;
    }

    for (
      const method of [
        "validateState",
        "validate"
      ]
    ) {
      if (
        isFunction(
          validator[method]
        )
      ) {
        return validator[
          method
        ].bind(validator);
      }
    }

    return null;
  }

  /* =====================================================
     KEY RESOLUTION
  ===================================================== */

  function buildStorageKey(
    conversationId,
    options = {}
  ) {
    if (
      !isNonEmptyString(
        conversationId
      )
    ) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_CONVERSATION_ID_REQUIRED",
        "COS state persistence requires a conversation ID."
      );
    }

    const prefix =
      firstNonEmptyString(
        options.keyPrefix,
        options.key_prefix
      ) ||
      DEFAULT_KEY_PREFIX;

    return `${prefix}.${encodeKeySegment(
      conversationId
    )}`;
  }

  function readConversationIdFromKey(
    key,
    options = {}
  ) {
    const prefix =
      firstNonEmptyString(
        options.keyPrefix,
        options.key_prefix
      ) ||
      DEFAULT_KEY_PREFIX;

    const marker =
      `${prefix}.`;

    if (
      !isNonEmptyString(key) ||
      !key.startsWith(marker)
    ) {
      return null;
    }

    return decodeKeySegment(
      key.slice(marker.length)
    );
  }

  /* =====================================================
     RECORD CONSTRUCTION
  ===================================================== */

  function createRecord({
    conversationId,
    state,
    metadata = {},
    existingRecord = null
  }) {
    const timestamp =
      nowIso();

    const existingRevision =
      existingRecord &&
      normalizeInteger(
        existingRecord.storageRevision,
        0
      );

    return {
      recordType:
        RECORD_TYPE,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      conversationId,

      stateSchemaVersion:
        firstNonEmptyString(
          state &&
            state.schemaVersion,
          state &&
            state.schema_version
        ) || null,

      storageRevision:
        Math.max(
          1,
          existingRevision + 1
        ),

      state:
        safeClone(state),

      metadata:
        isObject(metadata)
          ? safeClone(metadata)
          : {},

      createdAt:
        existingRecord &&
        existingRecord.createdAt
          ? existingRecord.createdAt
          : timestamp,

      updatedAt:
        timestamp
    };
  }

  /* =====================================================
     SERIALIZATION
  ===================================================== */

  function serializeRecord(
    record
  ) {
    try {
      return JSON.stringify(record);
    } catch (error) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_SERIALIZATION_FAILED",
        "COS state record could not be serialized.",
        {
          cause: error
        }
      );
    }
  }

  function deserializeRecord(
    value
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    if (isObject(value)) {
      return safeClone(value);
    }

    if (!isString(value)) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_RECORD_FORMAT_INVALID",
        "Stored COS state record must be JSON text or an object.",
        {
          details: {
            receivedType:
              typeof value
          }
        }
      );
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_DESERIALIZATION_FAILED",
        "Stored COS state record contains invalid JSON.",
        {
          cause: error
        }
      );
    }
  }

  /* =====================================================
     RECORD VALIDATION
  ===================================================== */

  function validateRecord(
    record
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(record)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_STATE_STORE_RECORD_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      record.recordType !==
      RECORD_TYPE
    ) {
      errors.push({
        code:
          "COS_STATE_STORE_RECORD_TYPE_INVALID",

        recordType:
          record.recordType
      });
    }

    if (
      record.authority !==
      AUTHORITY
    ) {
      errors.push({
        code:
          "COS_STATE_STORE_RECORD_AUTHORITY_INVALID",

        authority:
          record.authority
      });
    }

    if (
      !isNonEmptyString(
        record.conversationId
      )
    ) {
      errors.push({
        code:
          "COS_STATE_STORE_RECORD_CONVERSATION_ID_INVALID"
      });
    }

    if (!isObject(record.state)) {
      errors.push({
        code:
          "COS_STATE_STORE_RECORD_STATE_INVALID"
      });
    }

    if (
      !Number.isInteger(
        record.storageRevision
      ) ||
      record.storageRevision < 1
    ) {
      errors.push({
        code:
          "COS_STATE_STORE_RECORD_REVISION_INVALID",

        storageRevision:
          record.storageRevision
      });
    }

    if (!record.createdAt) {
      warnings.push({
        code:
          "COS_STATE_STORE_RECORD_CREATED_AT_MISSING"
      });
    }

    if (!record.updatedAt) {
      warnings.push({
        code:
          "COS_STATE_STORE_RECORD_UPDATED_AT_MISSING"
      });
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  /* =====================================================
     STATE VALIDATION
  ===================================================== */

  async function validateLoadedState(
    state,
    validator
  ) {
    const validate =
      resolveValidationCallable(
        validator
      );

    if (!validate) {
      return {
        valid: true,
        skipped: true,
        errors: [],
        warnings: []
      };
    }

    const result =
      await validate(state);

    if (result === true) {
      return {
        valid: true,
        skipped: false,
        errors: [],
        warnings: []
      };
    }

    if (result === false) {
      return {
        valid: false,
        skipped: false,

        errors: [
          {
            code:
              "COS_STATE_STORE_STATE_VALIDATION_REJECTED"
          }
        ],

        warnings: []
      };
    }

    if (isObject(result)) {
      return {
        valid:
          result.valid !== false,

        skipped: false,

        errors:
          Array.isArray(result.errors)
            ? result.errors
            : [],

        warnings:
          Array.isArray(
            result.warnings
          )
            ? result.warnings
            : []
      };
    }

    return {
      valid: Boolean(result),
      skipped: false,
      errors: [],
      warnings: []
    };
  }

  /* =====================================================
     MIGRATION
  ===================================================== */

  async function migrateStateIfNeeded({
    state,
    migrator,
    targetSchemaVersion = null,
    conversationId
  }) {
    const migrate =
      resolveMigrationCallable(
        migrator
      );

    if (!migrate) {
      return {
        migrated: false,
        state,
        migration: null
      };
    }

    const sourceSchemaVersion =
      firstNonEmptyString(
        state.schemaVersion,
        state.schema_version
      );

    const target =
      firstNonEmptyString(
        targetSchemaVersion,
        migrator.currentSchemaVersion,
        migrator.schemaVersion
      );

    if (
      target &&
      sourceSchemaVersion === target
    ) {
      return {
        migrated: false,
        state,
        migration: {
          fromVersion:
            sourceSchemaVersion,

          toVersion:
            target,

          reason:
            "already_current"
        }
      };
    }

    const result =
      await migrate({
        state:
          safeClone(state),

        conversationId,

        fromVersion:
          sourceSchemaVersion,

        toVersion:
          target
      });

    if (
      isObject(result) &&
      isObject(result.state)
    ) {
      return {
        migrated:
          result.migrated !== false,

        state:
          result.state,

        migration:
          safeClone(result)
      };
    }

    if (isObject(result)) {
      return {
        migrated: true,
        state: result,
        migration: {
          fromVersion:
            sourceSchemaVersion,

          toVersion:
            firstNonEmptyString(
              result.schemaVersion,
              result.schema_version,
              target
            )
        }
      };
    }

    throw new CosStateStoreError(
      "COS_STATE_STORE_MIGRATION_RESULT_INVALID",
      "COS state migrator returned an invalid result.",
      {
        details: {
          result:
            safeClone(result)
        }
      }
    );
  }

  /* =====================================================
     RAW ADAPTER OPERATIONS
  ===================================================== */

  async function readRawRecord(
    conversationId,
    options = {}
  ) {
    const adapter =
      resolveAdapter(
        options.adapter
      );

    const key =
      buildStorageKey(
        conversationId,
        options
      );

    try {
      const value =
        await adapter.getItem(key);

      return {
        adapter,
        key,
        value
      };
    } catch (error) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_READ_FAILED",
        "Failed to read COS state from persistent storage.",
        {
          details: {
            conversationId,
            key,
            adapterType:
              adapter.type
          },

          cause: error,

          recoverable: true
        }
      );
    }
  }

  async function writeRawRecord(
    conversationId,
    serializedRecord,
    options = {}
  ) {
    const adapter =
      resolveAdapter(
        options.adapter
      );

    const key =
      buildStorageKey(
        conversationId,
        options
      );

    try {
      await adapter.setItem(
        key,
        serializedRecord
      );

      return {
        adapter,
        key
      };
    } catch (error) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_WRITE_FAILED",
        "Failed to save COS state to persistent storage.",
        {
          details: {
            conversationId,
            key,
            adapterType:
              adapter.type
          },

          cause: error,

          recoverable: true
        }
      );
    }
  }

  /* =====================================================
     SAVE
  ===================================================== */

  async function save(
    conversationId,
    state,
    options = {}
  ) {
    if (!isObject(state)) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_STATE_REQUIRED",
        "COS state persistence requires a state object."
      );
    }

    const normalizedConversationId =
      firstNonEmptyString(
        conversationId,
        state.conversationId,
        state.conversation_id
      );

    if (!normalizedConversationId) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_CONVERSATION_ID_REQUIRED",
        "COS state persistence requires a conversation ID."
      );
    }

    const validator =
      resolveStateValidator(
        options.validator
      );

    if (
      options.validateBeforeSave !== false
    ) {
      const stateValidation =
        await validateLoadedState(
          state,
          validator
        );

      if (!stateValidation.valid) {
        throw new CosStateStoreError(
          "COS_STATE_STORE_SAVE_STATE_INVALID",
          "COS state failed validation before persistence.",
          {
            details:
              stateValidation
          }
        );
      }
    }

    let existingRecord = null;

    if (
      options.readExisting !== false
    ) {
      const existing =
        await readRawRecord(
          normalizedConversationId,
          options
        );

      if (
        existing.value !== null &&
        existing.value !== undefined
      ) {
        try {
          existingRecord =
            deserializeRecord(
              existing.value
            );
        } catch (error) {
          if (
            options.replaceCorruptRecord !==
            true
          ) {
            throw error;
          }
        }
      }
    }

    const record =
      createRecord({
        conversationId:
          normalizedConversationId,

        state,

        metadata:
          options.metadata,

        existingRecord
      });

    const recordValidation =
      validateRecord(record);

    if (!recordValidation.valid) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_RECORD_INVALID",
        "Constructed COS persistence record failed validation.",
        {
          details:
            recordValidation
        }
      );
    }

    const serialized =
      serializeRecord(record);

    const write =
      await writeRawRecord(
        normalizedConversationId,
        serialized,
        options
      );

    const result = {
      ok: true,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      operation:
        "save",

      conversationId:
        normalizedConversationId,

      key:
        write.key,

      adapterType:
        write.adapter.type,

      storageRevision:
        record.storageRevision,

      stateSchemaVersion:
        record.stateSchemaVersion,

      bytes:
        serialized.length,

      record:
        options.includeRecord === true
          ? freezeClone(record)
          : null,

      savedAt:
        nowIso(),

      errors: []
    };

    return options.freeze === false
      ? result
      : freezeClone(result);
  }

  /* =====================================================
     LOAD
  ===================================================== */

  async function load(
    conversationId,
    options = {}
  ) {
    const normalizedConversationId =
      firstNonEmptyString(
        conversationId
      );

    if (!normalizedConversationId) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_CONVERSATION_ID_REQUIRED",
        "COS state loading requires a conversation ID."
      );
    }

    const raw =
      await readRawRecord(
        normalizedConversationId,
        options
      );

    if (
      raw.value === null ||
      raw.value === undefined
    ) {
      const missingResult = {
        ok: true,

        found: false,

        schemaVersion:
          SCHEMA_VERSION,

        authority:
          AUTHORITY,

        component:
          COMPONENT_NAME,

        version:
          VERSION,

        operation:
          "load",

        conversationId:
          normalizedConversationId,

        key:
          raw.key,

        adapterType:
          raw.adapter.type,

        state: null,

        record: null,

        migrated: false,

        validation: null,

        loadedAt:
          nowIso(),

        errors: []
      };

      return options.freeze === false
        ? missingResult
        : freezeClone(
            missingResult
          );
    }

    const record =
      deserializeRecord(
        raw.value
      );

    const recordValidation =
      validateRecord(record);

    if (!recordValidation.valid) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_LOADED_RECORD_INVALID",
        "Stored COS state record failed validation.",
        {
          details:
            recordValidation
        }
      );
    }

    if (
      record.conversationId !==
      normalizedConversationId
    ) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_CONVERSATION_ID_MISMATCH",
        "Stored COS state belongs to a different conversation.",
        {
          details: {
            requestedConversationId:
              normalizedConversationId,

            storedConversationId:
              record.conversationId
          }
        }
      );
    }

    const migrator =
      resolveMigrator(
        options.migrator
      );

    const migration =
      options.migrate === false
        ? {
            migrated: false,
            state:
              safeClone(record.state),
            migration: null
          }
        : await migrateStateIfNeeded({
            state:
              safeClone(record.state),

            migrator,

            targetSchemaVersion:
              options.targetSchemaVersion,

            conversationId:
              normalizedConversationId
          });

    const validator =
      resolveStateValidator(
        options.validator
      );

    const stateValidation =
      options.validate === false
        ? {
            valid: true,
            skipped: true,
            errors: [],
            warnings: []
          }
        : await validateLoadedState(
            migration.state,
            validator
          );

    if (!stateValidation.valid) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_LOADED_STATE_INVALID",
        "Loaded COS state failed validation.",
        {
          details:
            stateValidation
        }
      );
    }

    if (
      migration.migrated &&
      options.persistMigration !== false
    ) {
      await save(
        normalizedConversationId,
        migration.state,
        {
          ...options,

          metadata: {
            ...(
              isObject(record.metadata)
                ? record.metadata
                : {}
            ),

            migratedAt:
              nowIso(),

            migration:
              safeClone(
                migration.migration
              )
          },

          readExisting: true,

          validateBeforeSave:
            options.validate !== false
        }
      );
    }

    const result = {
      ok: true,

      found: true,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      operation:
        "load",

      conversationId:
        normalizedConversationId,

      key:
        raw.key,

      adapterType:
        raw.adapter.type,

      state:
        options.freezeState === false
          ? safeClone(
              migration.state
            )
          : freezeClone(
              migration.state
            ),

      record:
        options.includeRecord === true
          ? freezeClone(record)
          : null,

      migrated:
        migration.migrated,

      migration:
        migration.migration
          ? freezeClone(
              migration.migration
            )
          : null,

      validation:
        freezeClone(
          stateValidation
        ),

      storageRevision:
        record.storageRevision,

      loadedAt:
        nowIso(),

      errors: []
    };

    return options.freeze === false
      ? result
      : freezeClone(result);
  }

  /* =====================================================
     LOAD STATE ONLY
  ===================================================== */

  async function loadState(
    conversationId,
    options = {}
  ) {
    const result =
      await load(
        conversationId,
        options
      );

    return result.found
      ? result.state
      : null;
  }

  /* =====================================================
     REMOVE
  ===================================================== */

  async function remove(
    conversationId,
    options = {}
  ) {
    const normalizedConversationId =
      firstNonEmptyString(
        conversationId
      );

    if (!normalizedConversationId) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_CONVERSATION_ID_REQUIRED",
        "COS state removal requires a conversation ID."
      );
    }

    const adapter =
      resolveAdapter(
        options.adapter
      );

    const key =
      buildStorageKey(
        normalizedConversationId,
        options
      );

    let existed = false;

    try {
      if (
        options.checkExistence !== false
      ) {
        const current =
          await adapter.getItem(key);

        existed =
          current !== null &&
          current !== undefined;
      }

      await adapter.removeItem(key);
    } catch (error) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_REMOVE_FAILED",
        "Failed to remove COS state from persistent storage.",
        {
          details: {
            conversationId:
              normalizedConversationId,

            key,

            adapterType:
              adapter.type
          },

          cause: error,

          recoverable: true
        }
      );
    }

    const result = {
      ok: true,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      operation:
        "remove",

      conversationId:
        normalizedConversationId,

      key,

      adapterType:
        adapter.type,

      existed,

      removedAt:
        nowIso(),

      errors: []
    };

    return options.freeze === false
      ? result
      : freezeClone(result);
  }

  /* =====================================================
     EXISTS
  ===================================================== */

  async function exists(
    conversationId,
    options = {}
  ) {
    const raw =
      await readRawRecord(
        conversationId,
        options
      );

    return (
      raw.value !== null &&
      raw.value !== undefined
    );
  }

  /* =====================================================
     LIST CONVERSATIONS
  ===================================================== */

  async function listConversationIds(
    options = {}
  ) {
    const adapter =
      resolveAdapter(
        options.adapter
      );

    let keys;

    try {
      keys =
        await adapter.keys();
    } catch (error) {
      if (
        error instanceof
        CosStateStoreError
      ) {
        throw error;
      }

      throw new CosStateStoreError(
        "COS_STATE_STORE_LIST_FAILED",
        "Failed to enumerate stored COS conversations.",
        {
          cause: error,
          recoverable: true
        }
      );
    }

    const conversationIds =
      Array.isArray(keys)
        ? keys
            .map(
              (key) =>
                readConversationIdFromKey(
                  key,
                  options
                )
            )
            .filter(Boolean)
        : [];

    return freezeClone({
      ok: true,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      operation:
        "list",

      adapterType:
        adapter.type,

      count:
        conversationIds.length,

      conversationIds,

      listedAt:
        nowIso(),

      errors: []
    });
  }

  /* =====================================================
     CLEAR NAMESPACE
  ===================================================== */

  async function clearNamespace(
    options = {}
  ) {
    const adapter =
      resolveAdapter(
        options.adapter
      );

    const keys =
      await adapter.keys();

    const prefix =
      firstNonEmptyString(
        options.keyPrefix,
        options.key_prefix
      ) ||
      DEFAULT_KEY_PREFIX;

    const marker =
      `${prefix}.`;

    const matchingKeys =
      keys.filter(
        (key) =>
          isNonEmptyString(key) &&
          key.startsWith(marker)
      );

    for (const key of matchingKeys) {
      await adapter.removeItem(key);
    }

    return freezeClone({
      ok: true,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      operation:
        "clear_namespace",

      adapterType:
        adapter.type,

      removedCount:
        matchingKeys.length,

      removedKeys:
        matchingKeys,

      clearedAt:
        nowIso(),

      errors: []
    });
  }

  /* =====================================================
     COPY
  ===================================================== */

  async function copy(
    sourceConversationId,
    targetConversationId,
    options = {}
  ) {
    const source =
      await load(
        sourceConversationId,
        {
          ...options,
          freeze: false
        }
      );

    if (!source.found) {
      throw new CosStateStoreError(
        "COS_STATE_STORE_COPY_SOURCE_NOT_FOUND",
        "Source COS conversation state was not found.",
        {
          details: {
            sourceConversationId
          }
        }
      );
    }

    const copiedState = {
      ...safeClone(source.state),

      conversationId:
        targetConversationId,

      updatedAt:
        nowIso()
    };

    const saveResult =
      await save(
        targetConversationId,
        copiedState,
        {
          ...options,

          metadata: {
            copiedFromConversationId:
              sourceConversationId,

            copiedAt:
              nowIso(),

            ...(
              isObject(options.metadata)
                ? options.metadata
                : {}
            )
          }
        }
      );

    return freezeClone({
      ok: true,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      operation:
        "copy",

      sourceConversationId,

      targetConversationId,

      storageRevision:
        saveResult.storageRevision,

      copiedAt:
        nowIso(),

      errors: []
    });
  }

  /* =====================================================
     SAFE OPERATIONS
  ===================================================== */

  async function safeLoad(
    conversationId,
    options = {}
  ) {
    try {
      return await load(
        conversationId,
        options
      );
    } catch (error) {
      return freezeClone({
        ok: false,

        found: false,

        schemaVersion:
          SCHEMA_VERSION,

        authority:
          AUTHORITY,

        component:
          COMPONENT_NAME,

        version:
          VERSION,

        operation:
          "load",

        conversationId:
          conversationId || null,

        state: null,

        record: null,

        migrated: false,

        validation: null,

        loadedAt:
          nowIso(),

        errors: [
          safeError(error)
        ]
      });
    }
  }

  async function safeSave(
    conversationId,
    state,
    options = {}
  ) {
    try {
      return await save(
        conversationId,
        state,
        options
      );
    } catch (error) {
      return freezeClone({
        ok: false,

        schemaVersion:
          SCHEMA_VERSION,

        authority:
          AUTHORITY,

        component:
          COMPONENT_NAME,

        version:
          VERSION,

        operation:
          "save",

        conversationId:
          conversationId || null,

        savedAt:
          nowIso(),

        errors: [
          safeError(error)
        ]
      });
    }
  }

  /* =====================================================
     STORE FACTORY
  ===================================================== */

  function createStore(
    defaultOptions = {}
  ) {
    const defaults =
      isObject(defaultOptions)
        ? safeClone(
            defaultOptions
          )
        : {};

    function mergeOptions(
      options = {}
    ) {
      return {
        ...defaults,

        ...(
          isObject(options)
            ? options
            : {}
        )
      };
    }

    return {
      async save(
        conversationId,
        state,
        options = {}
      ) {
        return save(
          conversationId,
          state,
          mergeOptions(options)
        );
      },

      async load(
        conversationId,
        options = {}
      ) {
        return load(
          conversationId,
          mergeOptions(options)
        );
      },

      async loadState(
        conversationId,
        options = {}
      ) {
        return loadState(
          conversationId,
          mergeOptions(options)
        );
      },

      async remove(
        conversationId,
        options = {}
      ) {
        return remove(
          conversationId,
          mergeOptions(options)
        );
      },

      async exists(
        conversationId,
        options = {}
      ) {
        return exists(
          conversationId,
          mergeOptions(options)
        );
      },

      async listConversationIds(
        options = {}
      ) {
        return listConversationIds(
          mergeOptions(options)
        );
      },

      async clearNamespace(
        options = {}
      ) {
        return clearNamespace(
          mergeOptions(options)
        );
      },

      async copy(
        sourceConversationId,
        targetConversationId,
        options = {}
      ) {
        return copy(
          sourceConversationId,
          targetConversationId,
          mergeOptions(options)
        );
      },

      async safeLoad(
        conversationId,
        options = {}
      ) {
        return safeLoad(
          conversationId,
          mergeOptions(options)
        );
      },

      async safeSave(
        conversationId,
        state,
        options = {}
      ) {
        return safeSave(
          conversationId,
          state,
          mergeOptions(options)
        );
      },

      get options() {
        return freezeClone(defaults);
      }
    };
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosStateStore = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    recordType:
      RECORD_TYPE,

    defaultNamespace:
      DEFAULT_NAMESPACE,

    defaultKeyPrefix:
      DEFAULT_KEY_PREFIX,

    adapterTypes:
      ADAPTER_TYPES,

    CosStateStoreError,

    save,

    load,

    loadState,

    remove,

    delete:
      remove,

    clear:
      remove,

    exists,

    listConversationIds,

    clearNamespace,

    copy,

    safeLoad,

    safeSave,

    createStore,

    buildStorageKey,

    readConversationIdFromKey,

    serializeRecord,

    deserializeRecord,

    validateRecord,

    resolveAdapter,

    memoryAdapter:
      memoryStorageAdapter
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.stateStore =
    cosStateStore;

  ConversationOS.cosStateStore =
    cosStateStore;

  root.AriCosStateStore =
    cosStateStore;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosStateStore;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);