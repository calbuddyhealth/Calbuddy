// js/ari-preference-settings-controller.js
// Ari Preference Settings Controller
//
// Purpose:
// Load, populate, validate, save, and reset Ari's communication
// preferences through the canonical preference store and runtime.
//
// V2.0.0 — Communication Preferences Only
//
// Architectural flow:
//
// Static Semantic HTML Controls
//      ↓
// AriPreferenceSettingsController
//      ↓
// AriUserPreferenceContract Validation
//      ↓
// AriUserPreferenceStore
//      ↓
// AriPreferenceRuntime Refresh
//
// Supported communication preferences:
// - language.tone
// - language.directness
// - language.humor
// - language.profanity
// - language.detail
//
// Responsibilities:
// - Bind the five communication preference groups already present in HTML.
// - Load the authenticated user's stored preference record.
// - Populate each radio group from stored overrides or runtime defaults.
// - Collect selected values by canonical preference path.
// - Validate overrides through AriUserPreferenceContract.
// - Save normalized overrides through AriUserPreferenceStore.
// - Reset stored overrides through AriUserPreferenceStore.
// - Refresh AriPreferenceRuntime after save and reset.
// - Dispatch preference lifecycle events.
// - Expose concise controller diagnostics.
//
// Non-responsibilities:
// - Does not render preference controls.
// - Does not define preference meaning.
// - Does not define valid preference values.
// - Does not manage presets.
// - Does not manage advanced preferences.
// - Does not collect consent.
// - Does not generate previews.
// - Does not persist records independently.
// - Does not resolve final runtime preferences.
// - Does not alter reasoning, routing, safety, retrieval, or tools.

window.Ari = window.Ari || {};

window.AriPreferenceSettingsController = {
  version: "2.0.0",
  source: "ari-preference-settings-controller",

  supportedPaths: Object.freeze([
    "language.tone",
    "language.directness",
    "language.humor",
    "language.profanity",
    "language.detail"
  ]),

  state: {
    initialized: false,
    initializing: false,
    saving: false,
    eventsBound: false,
    dirty: false,

    record: null,
    initialSelections: {},
    lastError: null
  },

  selectors: {
    root: "#ari-preference-settings",
    loading: "#ari-preference-loading",
    form: "#ari-preference-form",
    status: "#ari-preference-status",
    save: "#ari-preference-save",
    reset: "#ari-preference-reset"
  },

  /* =====================================================
     INITIALIZATION
  ===================================================== */

  async initialize() {
    if (this.state.initialized) {
      return {
        ok: true,
        state: this.getState()
      };
    }

    if (this.state.initializing) {
      return {
        ok: false,
        code: "preference_settings_initialization_in_progress"
      };
    }

    const root = this.getElement("root");

    if (!root) {
      return {
        ok: false,
        code: "preference_settings_root_missing"
      };
    }

    this.state.initializing = true;
    this.state.lastError = null;

    this.setLoading(true);
    this.setStatus("");

    try {
      this.requireContract();
      const store = this.requireStore();

      this.validateHtmlControls();
      this.bindEvents();

      const result = await store.read(
        null,
        {
          createIfMissing: true,
          useCache: true
        }
      );

      if (!result?.ok) {
        throw new Error(
          result?.error?.message ||
          result?.code ||
          "Unable to read Ari preferences."
        );
      }

      this.state.record =
        this.normalizeRecord(
          result.record
        );

      this.populateForm(
        this.state.record
      );

      this.captureInitialSelections();
      this.setDirty(false);

      this.state.initialized = true;

      window.dispatchEvent(
        new CustomEvent(
          "ari:preference-settings-ready",
          {
            detail: {
              source: this.source,
              controllerVersion: this.version,
              supportedPaths: [
                ...this.supportedPaths
              ],
              record: this.clone(
                this.state.record
              )
            }
          }
        )
      );

      return {
        ok: true,
        state: this.getState()
      };
    } catch (error) {
      this.state.lastError =
        this.serializeError(error);

      this.setStatus(
        error?.message ||
        "Unable to load Ari preferences.",
        "error"
      );

      console.error(
        "ARI PREFERENCE SETTINGS INITIALIZATION FAILED:",
        error
      );

      return {
        ok: false,
        code: "preference_settings_initialize_failed",
        error
      };
    } finally {
      this.state.initializing = false;
      this.setLoading(false);
    }
  },

  /* =====================================================
     HTML CONTROL VALIDATION
  ===================================================== */

  validateHtmlControls() {
    const form =
      this.getElement("form");

    if (!form) {
      throw new Error(
        "Ari preference form is missing."
      );
    }

    const missingPaths = [];

    for (
      const path
      of this.supportedPaths
    ) {
      const controls =
        this.getRadioGroupByPath(path);

      if (
        controls.length === 0
      ) {
        missingPaths.push(path);
        continue;
      }

      const groupNames =
        new Set(
          controls.map(
            control =>
              control.name
          )
        );

      if (
        groupNames.size !== 1 ||
        groupNames.has("")
      ) {
        throw new Error(
          `Preference controls for ${path} must share one radio-group name.`
        );
      }

      for (
        const control
        of controls
      ) {
        if (
          !control.value
        ) {
          throw new Error(
            `Preference control for ${path} is missing a value.`
          );
        }
      }
    }

    if (
      missingPaths.length > 0
    ) {
      throw new Error(
        `Missing communication preference controls: ${missingPaths.join(", ")}.`
      );
    }
  },

  /* =====================================================
     FORM POPULATION
  ===================================================== */

  populateForm(record = {}) {
    const overrides =
      this.asPlainObject(
        record.preferenceOverrides
      );

    for (
      const path
      of this.supportedPaths
    ) {
      const {
        category,
        key
      } = this.parsePath(path);

      const savedValue =
        overrides?.[category]?.[key];

      const runtimeDefault =
        this.getRuntimeDefaultForPath(
          path
        );

      const selectedValue =
        savedValue ??
        runtimeDefault;

      this.selectValueForPath(
        path,
        selectedValue
      );
    }
  },

  selectValueForPath(
    path,
    requestedValue
  ) {
    const group =
      this.getRadioGroupByPath(path);

    if (
      group.length === 0
    ) {
      return null;
    }

    const normalizedValue =
      String(
        requestedValue ?? ""
      ).trim();

    const selected =
      group.find(
        input =>
          input.value ===
          normalizedValue
      ) ||
      group.find(
        input =>
          input.value ===
          "default"
      ) ||
      group[0];

    for (
      const input
      of group
    ) {
      input.checked =
        input === selected;
    }

    return selected?.value || null;
  },

  getRuntimeDefaultForPath(path) {
    const contract =
      this.requireContract();

    const {
      category,
      key
    } = this.parsePath(path);

    const runtimeDefaults =
      typeof contract.getRuntimeDefaults ===
      "function"
        ? contract.getRuntimeDefaults()
        : {};

    const value =
      runtimeDefaults?.[category]?.[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }

    const group =
      this.getRadioGroupByPath(path);

    return (
      group.find(
        input =>
          input.value === "default"
      )?.value ||
      group[0]?.value ||
      null
    );
  },

  /* =====================================================
     EVENTS
  ===================================================== */

  bindEvents() {
    if (
      this.state.eventsBound
    ) {
      return;
    }

    const form =
      this.getElement("form");

    const reset =
      this.getElement("reset");

    form?.addEventListener(
      "submit",
      event =>
        this.handleSubmit(event)
    );

    form?.addEventListener(
      "change",
      event =>
        this.handleFormChange(event)
    );

    reset?.addEventListener(
      "click",
      () =>
        this.handleReset()
    );

    this.state.eventsBound = true;
  },

  handleFormChange(event) {
    const control =
      event.target?.closest?.(
        'input[type="radio"][data-path]'
      );

    if (
      !control ||
      !control.checked ||
      !this.supportedPaths.includes(
        control.dataset.path
      )
    ) {
      return;
    }

    this.setDirty(
      this.hasSelectionChanges()
    );

    this.setStatus(
      "Changes not saved.",
      "working"
    );

    window.dispatchEvent(
      new CustomEvent(
        "ari:preference-settings-changed",
        {
          detail: {
            source: this.source,
            path:
              control.dataset.path,
            value:
              control.value,
            selections:
              this.collectSelections()
          }
        }
      )
    );
  },

  /* =====================================================
     SAVE
  ===================================================== */

  async handleSubmit(event) {
    event?.preventDefault?.();

    if (
      this.state.saving
    ) {
      return {
        ok: false,
        code: "preference_settings_save_in_progress"
      };
    }

    this.state.saving = true;
    this.state.lastError = null;

    this.setSaving(true);

    this.setStatus(
      "Saving preferences…",
      "working"
    );

    try {
      const contract =
        this.requireContract();

      const store =
        this.requireStore();

      const runtime =
        this.getRuntime();

      const rawOverrides =
        this.collectOverrides();

      const validation =
        contract.validateOverrides(
          rawOverrides
        );

      if (!validation?.ok) {
        throw new Error(
          validation?.warnings
            ?.join(", ") ||
          validation?.errors
            ?.join(", ") ||
          "The selected preferences are invalid."
        );
      }

      const normalizedOverrides =
        this.filterToSupportedOverrides(
          validation.normalized || {}
        );

      const activePreset =
        this.hasAnyOverrides(
          normalizedOverrides
        )
          ? "custom"
          : "default";

      const result =
        await store.save(
          null,
          normalizedOverrides,
          {
            activePreset,
            schemaVersion:
              contract.schemaVersion,
            changeSource:
              "communication_settings_ui"
          }
        );

      if (!result?.ok) {
        throw new Error(
          result?.error?.message ||
          result?.code ||
          "Unable to save Ari preferences."
        );
      }

      this.state.record =
        this.normalizeRecord(
          result.record
        );

      await this.refreshRuntime(
        runtime
      );

      this.populateForm(
        this.state.record
      );

      this.captureInitialSelections();
      this.setDirty(false);

      this.setStatus(
        "Preferences saved.",
        "success"
      );

      window.dispatchEvent(
        new CustomEvent(
          "ari:preferences-updated",
          {
            detail: {
              source: this.source,
              controllerVersion:
                this.version,
              supportedPaths: [
                ...this.supportedPaths
              ],
              record:
                this.clone(
                  this.state.record
                )
            }
          }
        )
      );

      return {
        ok: true,
        record: this.clone(
          this.state.record
        )
      };
    } catch (error) {
      this.state.lastError =
        this.serializeError(error);

      console.error(
        "ARI PREFERENCE SETTINGS SAVE FAILED:",
        error
      );

      this.setStatus(
        error?.message ||
        "Unable to save Ari preferences.",
        "error"
      );

      return {
        ok: false,
        code: "preference_settings_save_failed",
        error
      };
    } finally {
      this.state.saving = false;
      this.setSaving(false);
    }
  },

  collectSelections() {
    const selections = {};

    for (
      const path
      of this.supportedPaths
    ) {
      const selected =
        this.getSelectedControlByPath(
          path
        );

      if (selected) {
        selections[path] =
          selected.value;
      }
    }

    return selections;
  },

  collectOverrides() {
    const output = {};

    for (
      const path
      of this.supportedPaths
    ) {
      const selected =
        this.getSelectedControlByPath(
          path
        );

      if (!selected) {
        throw new Error(
          `No value is selected for ${path}.`
        );
      }

      const runtimeDefault =
        String(
          this.getRuntimeDefaultForPath(
            path
          ) ?? ""
        );

      const selectedValue =
        String(
          selected.value ?? ""
        );

      if (
        !selectedValue ||
        selectedValue ===
          runtimeDefault
      ) {
        continue;
      }

      const {
        category,
        key
      } = this.parsePath(path);

      output[category] =
        output[category] || {};

      output[category][key] =
        selectedValue;
    }

    return output;
  },

  filterToSupportedOverrides(
    overrides = {}
  ) {
    const output = {};

    for (
      const path
      of this.supportedPaths
    ) {
      const {
        category,
        key
      } = this.parsePath(path);

      const value =
        overrides?.[category]?.[key];

      if (
        value === undefined
      ) {
        continue;
      }

      output[category] =
        output[category] || {};

      output[category][key] =
        value;
    }

    return output;
  },

  /* =====================================================
     RESET
  ===================================================== */

  async handleReset() {
    if (
      this.state.saving
    ) {
      return {
        ok: false,
        code: "preference_settings_save_in_progress"
      };
    }

    this.state.saving = true;
    this.state.lastError = null;

    this.setSaving(true);

    this.setStatus(
      "Resetting preferences…",
      "working"
    );

    try {
      const store =
        this.requireStore();

      const runtime =
        this.getRuntime();

      const result =
        typeof store.resetAll ===
        "function"
          ? await store.resetAll(
              null,
              {
                changeSource:
                  "communication_settings_ui"
              }
            )
          : await store.save(
              null,
              {},
              {
                activePreset:
                  "default",
                changeSource:
                  "communication_settings_ui"
              }
            );

      if (!result?.ok) {
        throw new Error(
          result?.error?.message ||
          result?.code ||
          "Unable to reset Ari preferences."
        );
      }

      this.state.record =
        this.normalizeRecord(
          result.record || {
            activePreset:
              "default",
            preferenceOverrides:
              {}
          }
        );

      await this.refreshRuntime(
        runtime
      );

      this.populateForm(
        this.state.record
      );

      this.captureInitialSelections();
      this.setDirty(false);

      this.setStatus(
        "Preferences reset.",
        "success"
      );

      window.dispatchEvent(
        new CustomEvent(
          "ari:preferences-reset",
          {
            detail: {
              source: this.source,
              controllerVersion:
                this.version,
              record:
                this.clone(
                  this.state.record
                )
            }
          }
        )
      );

      return {
        ok: true,
        record: this.clone(
          this.state.record
        )
      };
    } catch (error) {
      this.state.lastError =
        this.serializeError(error);

      console.error(
        "ARI PREFERENCE SETTINGS RESET FAILED:",
        error
      );

      this.setStatus(
        error?.message ||
        "Unable to reset Ari preferences.",
        "error"
      );

      return {
        ok: false,
        code: "preference_settings_reset_failed",
        error
      };
    } finally {
      this.state.saving = false;
      this.setSaving(false);
    }
  },

  /* =====================================================
     RUNTIME REFRESH
  ===================================================== */

  async refreshRuntime(runtime) {
    if (!runtime) {
      return {
        ok: true,
        skipped: true,
        reason:
          "preference_runtime_not_loaded"
      };
    }

    if (
      typeof runtime.afterPreferenceSave ===
      "function"
    ) {
      return (
        await runtime.afterPreferenceSave()
      );
    }

    if (
      typeof runtime.refresh ===
      "function"
    ) {
      return (
        await runtime.refresh()
      );
    }

    return {
      ok: true,
      skipped: true,
      reason:
        "preference_runtime_refresh_unavailable"
    };
  },

  /* =====================================================
     DIRTY STATE
  ===================================================== */

  captureInitialSelections() {
    this.state.initialSelections =
      this.collectSelections();
  },

  hasSelectionChanges() {
    const current =
      this.collectSelections();

    const initial =
      this.state.initialSelections ||
      {};

    return this.supportedPaths.some(
      path =>
        current[path] !==
        initial[path]
    );
  },

  setDirty(isDirty) {
    this.state.dirty =
      Boolean(isDirty);

    const root =
      this.getElement("root");

    if (root) {
      root.dataset.dirty =
        this.state.dirty
          ? "true"
          : "false";
    }
  },

  /* =====================================================
     CONTROL ACCESS
  ===================================================== */

  getPreferenceControls() {
    const form =
      this.getElement("form");

    if (!form) {
      return [];
    }

    return Array.from(
      form.querySelectorAll(
        'input[type="radio"][data-path]'
      )
    ).filter(
      control =>
        this.supportedPaths.includes(
          control.dataset.path
        )
    );
  },

  getRadioGroupByPath(path) {
    return this.getPreferenceControls()
      .filter(
        control =>
          control.dataset.path ===
          path
      );
  },

  getSelectedControlByPath(path) {
    return (
      this.getRadioGroupByPath(path)
        .find(
          control =>
            control.checked
        ) ||
      null
    );
  },

  /* =====================================================
     UI STATE
  ===================================================== */

  setLoading(isLoading) {
    const loading =
      this.getElement("loading");

    const form =
      this.getElement("form");

    if (loading) {
      loading.hidden =
        !isLoading;
    }

    if (form) {
      form.hidden =
        Boolean(isLoading);
    }
  },

  setSaving(isSaving) {
    const save =
      this.getElement("save");

    const reset =
      this.getElement("reset");

    if (save) {
      save.disabled =
        Boolean(isSaving);
    }

    if (reset) {
      reset.disabled =
        Boolean(isSaving);
    }

    for (
      const control
      of this.getPreferenceControls()
    ) {
      control.disabled =
        Boolean(isSaving);
    }
  },

  setStatus(
    message = "",
    state = ""
  ) {
    const status =
      this.getElement("status");

    if (!status) {
      return;
    }

    status.textContent =
      message;

    if (state) {
      status.dataset.state =
        state;
    } else {
      delete status.dataset.state;
    }
  },

  /* =====================================================
     DEPENDENCIES
  ===================================================== */

  requireContract() {
    const contract =
      window.AriUserPreferenceContract ||
      window.Ari?.userPreferenceContract;

    if (!contract) {
      throw new Error(
        "AriUserPreferenceContract is not loaded."
      );
    }

    if (
      typeof contract.validateOverrides !==
      "function"
    ) {
      throw new Error(
        "AriUserPreferenceContract.validateOverrides is unavailable."
      );
    }

    return contract;
  },

  requireStore() {
    const store =
      window.AriUserPreferenceStore ||
      window.Ari?.userPreferenceStore;

    if (!store) {
      throw new Error(
        "AriUserPreferenceStore is not loaded."
      );
    }

    if (
      typeof store.read !==
      "function" ||
      typeof store.save !==
      "function"
    ) {
      throw new Error(
        "AriUserPreferenceStore must expose read and save."
      );
    }

    return store;
  },

  getRuntime() {
    return (
      window.AriPreferenceRuntime ||
      window.Ari?.preferenceRuntime ||
      null
    );
  },

  /* =====================================================
     RECORD AND PATH UTILITIES
  ===================================================== */

  normalizeRecord(record) {
    const normalized =
      this.asPlainObject(record);

    return {
      ...normalized,
      activePreset:
        normalized.activePreset ||
        "default",
      preferenceOverrides:
        this.asPlainObject(
          normalized.preferenceOverrides
        )
    };
  },

  parsePath(path) {
    const parts =
      String(path || "")
        .split(".")
        .filter(Boolean);

    if (
      parts.length !== 2
    ) {
      throw new Error(
        `Invalid preference path: ${path}.`
      );
    }

    return {
      category: parts[0],
      key: parts[1]
    };
  },

  hasAnyOverrides(overrides) {
    return Object.values(
      this.asPlainObject(overrides)
    ).some(
      category =>
        Object.keys(
          this.asPlainObject(category)
        ).length > 0
    );
  },

  asPlainObject(value) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return {};
    }

    return value;
  },

  /* =====================================================
     STATE AND DIAGNOSTICS
  ===================================================== */

  getElement(key) {
    const selector =
      this.selectors[key];

    return selector
      ? document.querySelector(
          selector
        )
      : null;
  },

  getState() {
    return {
      initialized:
        this.state.initialized,
      initializing:
        this.state.initializing,
      saving:
        this.state.saving,
      dirty:
        this.state.dirty,
      supportedPaths: [
        ...this.supportedPaths
      ],
      selections:
        this.collectSelections(),
      initialSelections:
        this.clone(
          this.state.initialSelections
        ),
      record:
        this.clone(
          this.state.record
        ),
      lastError:
        this.clone(
          this.state.lastError
        )
    };
  },

  serializeError(error) {
    return {
      name:
        error?.name ||
        "Error",
      message:
        error?.message ||
        String(error || "Unknown error"),
      stack:
        error?.stack ||
        null
    };
  },

  clone(value) {
    if (
      value === undefined
    ) {
      return undefined;
    }

    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch {
      return value;
    }
  }
};

window.Ari.preferenceSettingsController =
  window.AriPreferenceSettingsController;

/* =====================================================
   STARTUP
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    if (
      document.querySelector(
        "#ari-preference-settings"
      )
    ) {
      window
        .AriPreferenceSettingsController
        .initialize();
    }
  },
  {
    once: true
  }
);

console.log(
  "ARI PREFERENCE SETTINGS CONTROLLER LOADED:",
  window
    .AriPreferenceSettingsController
    ?.version
);
