// =====================================================
// ARI REBIRTH
// File: js/ari-preference-settings-controller.js
// Version: 3.0.0
//
// Purpose:
//   Page controller for ari-preference-settings.html.
//
// Architecture:
//
//   ari-preference-settings.html
//            ↓
//   AriPreferenceSettingsController
//            ↓
//   AriUserPreferenceContract
//            ↓
//   AriUserPreferenceStore
//            ↓
//   Supabase
//            ↓
//   AriPreferenceResolver
//            ↓
//   AriPreferenceRuntime
//
// Design authority:
//   The HTML page defines:
//   - Which preference groups exist
//   - Which values are selectable
//   - Which value is the default
//
// This controller does NOT:
//   - Render preference controls
//   - Invent preference categories
//   - Define Ari's personality instructions
//   - Define reasoning behavior
//   - Define safety behavior
//   - Define tool behavior
//   - Define memory behavior
//
// Responsibilities:
//   - Discover the static HTML preference schema
//   - Validate the page structure
//   - Load persisted preferences
//   - Populate the form
//   - Collect explicit user selections
//   - Save selections through AriUserPreferenceStore
//   - Reset selections to HTML-defined defaults
//   - Refresh AriPreferenceRuntime after persistence
//   - Expose diagnostics for Ari Lab / browser console
//
// IMPORTANT:
//   This controller represents the new preference schema.
//
//   Required preference contract:
//     AriUserPreferenceContract V3.0.0
//
//   Saving is intentionally blocked when an older preference
//   contract is loaded. This prevents an incompatible legacy
//   contract from normalizing the new preferences into {}.
// =====================================================

(() => {
  "use strict";

  // =====================================================
  // CONSTANTS
  // =====================================================

  const CONTROLLER_VERSION = "3.0.0";
  const REQUIRED_CONTRACT_VERSION = "3.0.0";

  const DOM_IDS = Object.freeze({
    root: "ari-preference-settings",
    form: "ari-preference-form",
    loading: "ari-preference-loading",
    status: "ari-preference-status",
    save: "ari-preference-save",
    reset: "ari-preference-reset"
  });

  const EXPECTED_PATHS = Object.freeze([
    "language.tone",
    "language.directness",
    "language.humor",
    "language.profanity",
    "language.complexity",
    "language.detail"
  ]);

  // =====================================================
  // CONTROLLER
  // =====================================================

  const AriPreferenceSettingsController = {
    version: CONTROLLER_VERSION,
    requiredContractVersion: REQUIRED_CONTRACT_VERSION,

    state: {
      initialized: false,
      initializing: false,
      busy: false,
      dirty: false,

      htmlSchema: null,
      loadedRecord: null,
      loadedPreferences: null,

      lastSavedPreferences: null,
      lastError: null
    },

    // ===================================================
    // INITIALIZATION
    // ===================================================

    async initialize() {
      if (this.state.initialized || this.state.initializing) {
        return;
      }

      this.state.initializing = true;
      this.state.lastError = null;

      try {
        this.assertPageStructure();

        this.state.htmlSchema = this.readHtmlSchema();

        this.bindEvents();

        this.showLoading(true);
        this.showForm(false);
        this.clearStatus();

        this.applyHtmlDefaults();

        await this.loadPreferences();

        this.showForm(true);
        this.showLoading(false);

        this.state.initialized = true;
        this.state.dirty = false;

        this.updateActionState();

        console.info(
          `ARI PREFERENCE SETTINGS CONTROLLER LOADED: ${this.version}`
        );

        console.info(
          "ARI PREFERENCE HTML SCHEMA:",
          this.clone(this.state.htmlSchema)
        );
      } catch (error) {
        this.handleError(
          "initialize",
          error,
          "Ari could not load your preference settings."
        );

        this.showLoading(false);
        this.showForm(true);
      } finally {
        this.state.initializing = false;
      }
    },

    // ===================================================
    // PAGE STRUCTURE
    // ===================================================

    assertPageStructure() {
      const requiredIds = [
        DOM_IDS.root,
        DOM_IDS.form,
        DOM_IDS.loading,
        DOM_IDS.status,
        DOM_IDS.save,
        DOM_IDS.reset
      ];

      for (const id of requiredIds) {
        if (!document.getElementById(id)) {
          throw new Error(
            `Preference settings page is missing required element #${id}.`
          );
        }
      }

      const groups = this.getPreferenceGroups();

      if (!groups.length) {
        throw new Error(
          "No preference groups were found in the HTML."
        );
      }

      const discoveredPaths = groups.map((group) =>
        String(group.dataset.preferenceGroup || "").trim()
      );

      for (const expectedPath of EXPECTED_PATHS) {
        if (!discoveredPaths.includes(expectedPath)) {
          throw new Error(
            `Missing expected preference group: ${expectedPath}`
          );
        }
      }

      const unexpectedPaths = discoveredPaths.filter(
        (path) => !EXPECTED_PATHS.includes(path)
      );

      if (unexpectedPaths.length) {
        console.warn(
          "ARI Preference Settings found additional HTML preference groups:",
          unexpectedPaths
        );
      }
    },

    readHtmlSchema() {
      const schema = {};

      for (const group of this.getPreferenceGroups()) {
        const path = String(
          group.dataset.preferenceGroup || ""
        ).trim();

        if (!path) {
          throw new Error(
            "A preference fieldset is missing data-preference-group."
          );
        }

        const controls = Array.from(
          group.querySelectorAll(
            'input[type="radio"][data-path]'
          )
        );

        if (!controls.length) {
          throw new Error(
            `Preference group ${path} has no radio controls.`
          );
        }

        const values = [];
        const defaults = [];

        for (const control of controls) {
          const controlPath = String(
            control.dataset.path || ""
          ).trim();

          const controlName = String(
            control.name || ""
          ).trim();

          const value = String(
            control.value || ""
          ).trim();

          if (controlPath !== path) {
            throw new Error(
              `Preference control path mismatch in ${path}. Found ${controlPath}.`
            );
          }

          if (controlName !== path) {
            throw new Error(
              `Preference control name mismatch in ${path}. Found ${controlName}.`
            );
          }

          if (!value) {
            throw new Error(
              `Preference group ${path} contains an empty value.`
            );
          }

          if (values.includes(value)) {
            throw new Error(
              `Preference group ${path} contains duplicate value "${value}".`
            );
          }

          values.push(value);

          if (control.dataset.default === "true") {
            defaults.push(value);
          }
        }

        if (defaults.length !== 1) {
          throw new Error(
            `Preference group ${path} must contain exactly one data-default="true" control.`
          );
        }

        schema[path] = Object.freeze({
          path,
          values: Object.freeze([...values]),
          defaultValue: defaults[0]
        });
      }

      return Object.freeze(schema);
    },

    // ===================================================
    // DOM HELPERS
    // ===================================================

    getElement(key) {
      const id = DOM_IDS[key];

      if (!id) {
        return null;
      }

      return document.getElementById(id);
    },

    getPreferenceGroups() {
      const form = this.getElement("form");

      if (!form) {
        return [];
      }

      return Array.from(
        form.querySelectorAll(
          "fieldset[data-preference-group]"
        )
      );
    },

    getPreferenceControls() {
      const form = this.getElement("form");

      if (!form) {
        return [];
      }

      return Array.from(
        form.querySelectorAll(
          'input[type="radio"][data-path]'
        )
      );
    },

    getControlsForPath(path) {
      return this.getPreferenceControls().filter(
        (control) => control.dataset.path === path
      );
    },

    getSelectedControl(path) {
      return (
        this.getControlsForPath(path).find(
          (control) => control.checked
        ) || null
      );
    },

    // ===================================================
    // EVENTS
    // ===================================================

    bindEvents() {
      const form = this.getElement("form");
      const resetButton = this.getElement("reset");

      if (!form || !resetButton) {
        throw new Error(
          "Preference settings form actions are unavailable."
        );
      }

      form.addEventListener(
        "submit",
        this.handleSubmit.bind(this)
      );

      resetButton.addEventListener(
        "click",
        this.handleReset.bind(this)
      );

      for (const control of this.getPreferenceControls()) {
        control.addEventListener(
          "change",
          this.handlePreferenceChange.bind(this)
        );
      }
    },

    handlePreferenceChange() {
      if (this.state.busy) {
        return;
      }

      this.state.dirty = true;

      this.setStatus(
        "Changes not saved yet.",
        "pending"
      );

      this.updateActionState();
    },

    async handleSubmit(event) {
      event.preventDefault();

      if (this.state.busy) {
        return;
      }

      await this.savePreferences();
    },

    async handleReset(event) {
      event.preventDefault();

      if (this.state.busy) {
        return;
      }

      await this.resetPreferences();
    },

    // ===================================================
    // LOADING
    // ===================================================

    async loadPreferences() {
      const store = this.getStore();

      if (!store || typeof store.read !== "function") {
        throw new Error(
          "AriUserPreferenceStore.read() is unavailable."
        );
      }

      try {
        const record = await store.read();

        this.state.loadedRecord = record || null;

        const savedPreferences =
          this.extractPreferencesFromRecord(record);

        this.state.loadedPreferences =
          this.clone(savedPreferences);

        if (this.hasOwnPreferenceValues(savedPreferences)) {
          this.populateForm(savedPreferences);
        } else {
          this.applyHtmlDefaults();
        }

        this.state.lastSavedPreferences =
          this.collectOverrides();

        this.state.dirty = false;

        this.clearStatus();

        return record;
      } catch (error) {
        // Keep HTML defaults visible even if persistence
        // temporarily cannot be read.
        this.applyHtmlDefaults();

        throw error;
      }
    },

    extractPreferencesFromRecord(record) {
      if (!record || typeof record !== "object") {
        return {};
      }

      const candidates = [
        record.preferenceOverrides,
        record.preference_overrides,
        record.preferences,
        record.overrides
      ];

      for (const candidate of candidates) {
        if (
          candidate &&
          typeof candidate === "object" &&
          !Array.isArray(candidate)
        ) {
          return this.clone(candidate);
        }
      }

      return {};
    },

    // ===================================================
    // FORM POPULATION
    // ===================================================

    populateForm(preferences = {}) {
      const schema = this.requireHtmlSchema();

      for (const [path, definition] of Object.entries(schema)) {
        const savedValue = this.getPath(
          preferences,
          path
        );

        const valueToApply =
          definition.values.includes(savedValue)
            ? savedValue
            : definition.defaultValue;

        this.selectValue(
          path,
          valueToApply
        );
      }

      this.updateActionState();
    },

    applyHtmlDefaults() {
      const schema =
        this.state.htmlSchema || this.readHtmlSchema();

      for (const [path, definition] of Object.entries(schema)) {
        this.selectValue(
          path,
          definition.defaultValue
        );
      }

      this.updateActionState();
    },

    selectValue(path, value) {
      const controls = this.getControlsForPath(path);

      if (!controls.length) {
        throw new Error(
          `No controls found for preference ${path}.`
        );
      }

      const target = controls.find(
        (control) => control.value === value
      );

      if (!target) {
        throw new Error(
          `Invalid UI value "${value}" for preference ${path}.`
        );
      }

      for (const control of controls) {
        control.checked = control === target;
      }
    },

    // ===================================================
    // COLLECTION
    // ===================================================

    collectOverrides() {
      const schema = this.requireHtmlSchema();
      const preferences = {};

      for (const path of Object.keys(schema)) {
        const selected = this.getSelectedControl(path);

        if (!selected) {
          throw new Error(
            `No selection exists for preference ${path}.`
          );
        }

        const value = String(
          selected.value || ""
        ).trim();

        if (!schema[path].values.includes(value)) {
          throw new Error(
            `Selected value "${value}" is invalid for ${path}.`
          );
        }

        this.setPath(
          preferences,
          path,
          value
        );
      }

      return preferences;
    },

    collectPreferences() {
      return this.collectOverrides();
    },

    collectDefaults() {
      const schema = this.requireHtmlSchema();
      const defaults = {};

      for (const [path, definition] of Object.entries(schema)) {
        this.setPath(
          defaults,
          path,
          definition.defaultValue
        );
      }

      return defaults;
    },

    // ===================================================
    // VALIDATION
    // ===================================================

    validateAgainstHtml(preferences) {
      const schema = this.requireHtmlSchema();
      const errors = [];

      for (const [path, definition] of Object.entries(schema)) {
        const value = this.getPath(
          preferences,
          path
        );

        if (typeof value !== "string") {
          errors.push(
            `${path} is missing.`
          );

          continue;
        }

        if (!definition.values.includes(value)) {
          errors.push(
            `${path} contains unsupported value "${value}".`
          );
        }
      }

      return {
        ok: errors.length === 0,
        errors
      };
    },

    assertContractReadyForSave() {
      const contract = this.getContract();

      if (!contract) {
        throw new Error(
          "AriUserPreferenceContract is unavailable."
        );
      }

      const contractVersion = String(
        contract.schemaVersion ||
        contract.version ||
        ""
      ).trim();

      if (contractVersion !== REQUIRED_CONTRACT_VERSION) {
        throw new Error(
          [
            "Preference saving is temporarily blocked because",
            `the page controller requires AriUserPreferenceContract ${REQUIRED_CONTRACT_VERSION},`,
            `but ${contractVersion || "an unknown version"} is currently loaded.`,
            "Update the preference contract before saving."
          ].join(" ")
        );
      }

      return contract;
    },

    validateAgainstContract(preferences) {
      const contract = this.assertContractReadyForSave();

      if (typeof contract.validateOverrides !== "function") {
        throw new Error(
          "AriUserPreferenceContract.validateOverrides() is unavailable."
        );
      }

      const result =
        contract.validateOverrides(preferences);

      if (result === true) {
        return {
          ok: true,
          errors: []
        };
      }

      if (result === false) {
        return {
          ok: false,
          errors: [
            "The preference contract rejected the selected preferences."
          ]
        };
      }

      if (
        result &&
        typeof result === "object"
      ) {
        const explicitErrors = Array.isArray(result.errors)
          ? result.errors
          : [];

        const warnings = Array.isArray(result.warnings)
          ? result.warnings
          : [];

        if (result.ok === false) {
          return {
            ok: false,
            errors:
              explicitErrors.length
                ? explicitErrors
                : warnings.length
                  ? warnings
                  : [
                      "The preference contract rejected the selected preferences."
                    ]
          };
        }

        if (
          explicitErrors.length ||
          (
            result.ok !== true &&
            warnings.length
          )
        ) {
          return {
            ok: false,
            errors: [
              ...explicitErrors,
              ...warnings
            ]
          };
        }

        return {
          ok: true,
          errors: []
        };
      }

      return {
        ok: true,
        errors: []
      };
    },

    // ===================================================
    // SAVE
    // ===================================================

    async savePreferences() {
      if (this.state.busy) {
        return null;
      }

      this.setBusy(true);
      this.state.lastError = null;

      try {
        const preferences =
          this.collectOverrides();

        const htmlValidation =
          this.validateAgainstHtml(preferences);

        if (!htmlValidation.ok) {
          throw new Error(
            htmlValidation.errors.join(" ")
          );
        }

        const contractValidation =
          this.validateAgainstContract(preferences);

        if (!contractValidation.ok) {
          throw new Error(
            contractValidation.errors.join(" ")
          );
        }

        const store = this.getStore();

        if (!store || typeof store.save !== "function") {
          throw new Error(
            "AriUserPreferenceStore.save() is unavailable."
          );
        }

        this.setStatus(
          "Saving changes…",
          "saving"
        );

        const savedRecord =
          await store.save(
            null,
            preferences,
            {
              activePreset: "custom",
              schemaVersion: REQUIRED_CONTRACT_VERSION,
              changeSource: "settings_ui"
            }
          );

        this.state.loadedRecord =
          savedRecord || this.state.loadedRecord;

        this.state.loadedPreferences =
          this.clone(preferences);

        this.state.lastSavedPreferences =
          this.clone(preferences);

        this.state.dirty = false;

        await this.refreshRuntime();

        this.setStatus(
          "Preferences saved.",
          "success"
        );

        this.updateActionState();

        console.info(
          "ARI PREFERENCES SAVED:",
          this.clone(preferences)
        );

        return savedRecord;
      } catch (error) {
        this.handleError(
          "savePreferences",
          error,
          error?.message ||
            "Ari could not save your preferences."
        );

        return null;
      } finally {
        this.setBusy(false);
      }
    },

    // ===================================================
    // RESET
    // ===================================================

    async resetPreferences() {
      if (this.state.busy) {
        return null;
      }

      this.setBusy(true);
      this.state.lastError = null;

      try {
        const defaults =
          this.collectDefaults();

        this.applyHtmlDefaults();

        const htmlValidation =
          this.validateAgainstHtml(defaults);

        if (!htmlValidation.ok) {
          throw new Error(
            htmlValidation.errors.join(" ")
          );
        }

        const contractValidation =
          this.validateAgainstContract(defaults);

        if (!contractValidation.ok) {
          throw new Error(
            contractValidation.errors.join(" ")
          );
        }

        const store = this.getStore();

        if (!store || typeof store.save !== "function") {
          throw new Error(
            "AriUserPreferenceStore.save() is unavailable."
          );
        }

        this.setStatus(
          "Resetting preferences…",
          "saving"
        );

        // New architecture:
        // Store the explicit HTML defaults rather than
        // collapsing the record back into an ambiguous {}.
        const savedRecord =
          await store.save(
            null,
            defaults,
            {
              activePreset: "default",
              schemaVersion: REQUIRED_CONTRACT_VERSION,
              changeSource: "reset"
            }
          );

        this.state.loadedRecord =
          savedRecord || this.state.loadedRecord;

        this.state.loadedPreferences =
          this.clone(defaults);

        this.state.lastSavedPreferences =
          this.clone(defaults);

        this.state.dirty = false;

        await this.refreshRuntime();

        this.setStatus(
          "Preferences reset to defaults.",
          "success"
        );

        this.updateActionState();

        console.info(
          "ARI PREFERENCES RESET:",
          this.clone(defaults)
        );

        return savedRecord;
      } catch (error) {
        this.handleError(
          "resetPreferences",
          error,
          error?.message ||
            "Ari could not reset your preferences."
        );

        return null;
      } finally {
        this.setBusy(false);
      }
    },

    // ===================================================
    // RUNTIME REFRESH
    // ===================================================

    async refreshRuntime() {
      const runtime = this.getRuntime();

      if (!runtime) {
        console.warn(
          "AriPreferenceRuntime is unavailable. Preferences were saved, but runtime refresh was skipped."
        );

        return null;
      }

      try {
        if (typeof runtime.refresh === "function") {
          return await runtime.refresh();
        }

        if (typeof runtime.initialize === "function") {
          return await runtime.initialize();
        }

        console.warn(
          "AriPreferenceRuntime has no refresh() or initialize() method."
        );

        return null;
      } catch (error) {
        // Persistence succeeded. Runtime refresh failure should
        // not falsely report that the database save failed.
        console.error(
          "ARI PREFERENCE RUNTIME REFRESH FAILED:",
          error
        );

        return null;
      }
    },

    // ===================================================
    // DEPENDENCY RESOLUTION
    // ===================================================

    getContract() {
      return (
        window.AriUserPreferenceContract ||
        window.Ari?.userPreferenceContract ||
        window.Ari?.preferenceContract ||
        null
      );
    },

    getStore() {
      return (
        window.AriUserPreferenceStore ||
        window.Ari?.userPreferenceStore ||
        window.Ari?.preferenceStore ||
        null
      );
    },

    getRuntime() {
      return (
        window.AriPreferenceRuntime ||
        window.Ari?.preferenceRuntime ||
        null
      );
    },

    // ===================================================
    // UI STATE
    // ===================================================

    setBusy(isBusy) {
      this.state.busy = Boolean(isBusy);

      const form = this.getElement("form");

      if (form) {
        form.setAttribute(
          "aria-busy",
          this.state.busy ? "true" : "false"
        );
      }

      this.updateActionState();
    },

    updateActionState() {
      const saveButton = this.getElement("save");
      const resetButton = this.getElement("reset");

      if (saveButton) {
        saveButton.disabled =
          this.state.busy;
      }

      if (resetButton) {
        resetButton.disabled =
          this.state.busy;
      }

      for (const control of this.getPreferenceControls()) {
        control.disabled =
          this.state.busy;
      }
    },

    showLoading(show) {
      const loading = this.getElement("loading");

      if (!loading) {
        return;
      }

      loading.hidden = !show;
    },

    showForm(show) {
      const form = this.getElement("form");

      if (!form) {
        return;
      }

      form.hidden = !show;
    },

    setStatus(message, type = "info") {
      const status = this.getElement("status");

      if (!status) {
        return;
      }

      status.textContent =
        String(message || "");

      status.dataset.statusType =
        String(type || "info");
    },

    clearStatus() {
      const status = this.getElement("status");

      if (!status) {
        return;
      }

      status.textContent = "";
      delete status.dataset.statusType;
    },

    // ===================================================
    // ERROR HANDLING
    // ===================================================

    handleError(context, error, userMessage) {
      this.state.lastError = {
        context,
        message:
          error?.message ||
          String(error || "Unknown error"),
        timestamp: new Date().toISOString()
      };

      console.error(
        `ARI PREFERENCE SETTINGS ERROR [${context}]:`,
        error
      );

      this.setStatus(
        userMessage ||
          "Something went wrong with Ari's preferences.",
        "error"
      );
    },

    // ===================================================
    // OBJECT PATH HELPERS
    // ===================================================

    getPath(source, path) {
      if (
        !source ||
        typeof source !== "object" ||
        typeof path !== "string"
      ) {
        return undefined;
      }

      const segments =
        path.split(".").filter(Boolean);

      let cursor = source;

      for (const segment of segments) {
        if (
          cursor === null ||
          cursor === undefined ||
          typeof cursor !== "object"
        ) {
          return undefined;
        }

        cursor = cursor[segment];
      }

      return cursor;
    },

    setPath(target, path, value) {
      if (
        !target ||
        typeof target !== "object" ||
        typeof path !== "string"
      ) {
        return target;
      }

      const segments =
        path.split(".").filter(Boolean);

      if (!segments.length) {
        return target;
      }

      let cursor = target;

      for (
        let index = 0;
        index < segments.length - 1;
        index += 1
      ) {
        const segment = segments[index];

        if (
          !cursor[segment] ||
          typeof cursor[segment] !== "object" ||
          Array.isArray(cursor[segment])
        ) {
          cursor[segment] = {};
        }

        cursor = cursor[segment];
      }

      cursor[segments[segments.length - 1]] =
        value;

      return target;
    },

    // ===================================================
    // UTILITIES
    // ===================================================

    requireHtmlSchema() {
      if (!this.state.htmlSchema) {
        this.state.htmlSchema =
          this.readHtmlSchema();
      }

      return this.state.htmlSchema;
    },

    hasOwnPreferenceValues(preferences) {
      if (
        !preferences ||
        typeof preferences !== "object"
      ) {
        return false;
      }

      const schema = this.requireHtmlSchema();

      return Object.keys(schema).some(
        (path) =>
          typeof this.getPath(
            preferences,
            path
          ) === "string"
      );
    },

    clone(value) {
      if (
        value === undefined ||
        value === null
      ) {
        return value;
      }

      try {
        return structuredClone(value);
      } catch (_error) {
        return JSON.parse(
          JSON.stringify(value)
        );
      }
    },

    // ===================================================
    // DIAGNOSTICS
    // ===================================================

    getDiagnostics() {
      const currentPreferences = (() => {
        try {
          return this.collectOverrides();
        } catch (_error) {
          return null;
        }
      })();

      const contract = this.getContract();
      const store = this.getStore();
      const runtime = this.getRuntime();

      return {
        controllerVersion: this.version,
        requiredContractVersion:
          this.requiredContractVersion,

        initialized: this.state.initialized,
        busy: this.state.busy,
        dirty: this.state.dirty,

        preferenceGroupCount:
          this.getPreferenceGroups().length,

        preferenceControlCount:
          this.getPreferenceControls().length,

        htmlSchema:
          this.clone(this.state.htmlSchema),

        currentPreferences:
          this.clone(currentPreferences),

        loadedPreferences:
          this.clone(this.state.loadedPreferences),

        lastSavedPreferences:
          this.clone(this.state.lastSavedPreferences),

        contract: {
          available: Boolean(contract),
          version:
            contract?.schemaVersion ||
            contract?.version ||
            null,

          compatible:
            Boolean(
              contract &&
              String(
                contract.schemaVersion ||
                contract.version ||
                ""
              ) === REQUIRED_CONTRACT_VERSION
            )
        },

        store: {
          available: Boolean(store),
          canRead:
            typeof store?.read === "function",
          canSave:
            typeof store?.save === "function"
        },

        runtime: {
          available: Boolean(runtime),
          canRefresh:
            typeof runtime?.refresh === "function",
          canInitialize:
            typeof runtime?.initialize === "function"
        },

        lastError:
          this.clone(this.state.lastError)
      };
    }
  };

  // =====================================================
  // GLOBAL EXPORTS
  // =====================================================

  window.AriPreferenceSettingsController =
    AriPreferenceSettingsController;

  window.Ari = window.Ari || {};

  window.Ari.preferenceSettingsController =
    AriPreferenceSettingsController;

  // =====================================================
  // AUTO INITIALIZATION
  // =====================================================

  const boot = () => {
    AriPreferenceSettingsController
      .initialize()
      .catch((error) => {
        console.error(
          "ARI PREFERENCE SETTINGS BOOT FAILED:",
          error
        );
      });
  };

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      { once: true }
    );
  } else {
    boot();
  }
})();