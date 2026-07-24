// js/ari-preference-settings-controller.js
// Ari Preference Settings Controller
//
// Purpose:
// Render the contract-driven preference settings UI, load the authenticated
// user's stored record, collect explicit consent, save normalized overrides,
// and refresh the runtime preference cache.
//
// V1.0.0 — Contract-Driven Settings Controller

window.Ari = window.Ari || {};

window.AriPreferenceSettingsController = {
  version: "1.0.0",
  source: "ari-preference-settings-controller",

  state: {
    initialized: false,
    saving: false,
    record: null,
    uiSchema: null,
    pendingConsent: null,
    consentEvidence: {}
  },

  selectors: {
    root: "#ari-preference-settings",
    loading: "#ari-preference-loading",
    form: "#ari-preference-form",
    preset: "#ari-preference-preset",
    categories: "#ari-preference-categories",
    status: "#ari-preference-status",
    save: "#ari-preference-save",
    reset: "#ari-preference-reset",
    consentDialog: "#ari-preference-consent-dialog",
    consentTitle: "#ari-preference-consent-title",
    consentText: "#ari-preference-consent-text",
    consentCheckbox: "#ari-preference-consent-checkbox",
    consentConfirm: "#ari-preference-consent-confirm"
  },

  async initialize() {
    if (this.state.initialized) {
      return this.getState();
    }

    const root = document.querySelector(
      this.selectors.root
    );

    if (!root) {
      return {
        ok: false,
        code: "preference_settings_root_missing"
      };
    }

    try {
      const contract = this.requireContract();
      const store = this.requireStore();

      this.state.uiSchema =
        contract.getUiSchema();

      this.restoreSessionConsent();
      this.renderPresetOptions();
      this.renderCategories();
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
          "Unable to read preferences."
        );
      }

      this.state.record =
        result.record || {};

      this.populateForm(
        this.state.record
      );

      this.setLoading(false);
      this.state.initialized = true;

      return {
        ok: true,
        state: this.getState()
      };
    } catch (error) {
      this.setLoading(false);
      this.setStatus(
        error?.message ||
        "Unable to load preferences.",
        "error"
      );

      return {
        ok: false,
        code:
          "preference_settings_initialize_failed",
        error
      };
    }
  },

  renderPresetOptions() {
    const select =
      this.getElement("preset");

    if (!select) return;

    select.innerHTML = "";

    for (
      const preset
      of this.state.uiSchema
        ?.presets || []
    ) {
      const option =
        document.createElement(
          "option"
        );

      option.value = preset.id;
      option.textContent =
        preset.label;
      option.title =
        preset.description || "";

      select.appendChild(option);
    }

    if (
      !Array.from(select.options)
        .some(option =>
          option.value === "custom"
        )
    ) {
      const custom =
        document.createElement(
          "option"
        );

      custom.value = "custom";
      custom.textContent = "Custom";
      select.appendChild(custom);
    }
  },

  renderCategories() {
    const container =
      this.getElement(
        "categories"
      );

    if (!container) return;

    container.innerHTML = "";

    for (
      const category
      of this.state.uiSchema
        ?.categories || []
    ) {
      const section =
        document.createElement(
          "section"
        );

      section.className =
        "ari-preference-category";

      const header =
        document.createElement(
          "header"
        );

      header.className =
        "ari-preference-category__header";

      const title =
        document.createElement("h2");

      title.textContent =
        category.label;

      const description =
        document.createElement("p");

      description.textContent =
        category.description || "";

      header.append(
        title,
        description
      );

      section.appendChild(header);

      for (
        const preference
        of category.preferences || []
      ) {
        section.appendChild(
          this.createPreferenceRow(
            preference
          )
        );
      }

      container.appendChild(
        section
      );
    }
  },

  createPreferenceRow(
    preference
  ) {
    const row =
      document.createElement("div");

    row.className =
      "ari-preference-row";

    const copy =
      document.createElement("div");

    const label =
      document.createElement("label");

    const selectId =
      `ari-pref-${preference.category}-${preference.key}`;

    label.className =
      "ari-preference-row__label";
    label.htmlFor = selectId;
    label.textContent =
      preference.label;

    const description =
      document.createElement("p");

    description.className =
      "ari-preference-row__description";
    description.textContent =
      preference.description || "";

    copy.append(
      label,
      description
    );

    const select =
      document.createElement(
        "select"
      );

    select.id = selectId;
    select.name =
      preference.path;

    select.dataset.category =
      preference.category;
    select.dataset.key =
      preference.key;
    select.dataset.path =
      preference.path;

    for (
      const optionDefinition
      of preference.options || []
    ) {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        optionDefinition.value;
      option.textContent =
        optionDefinition.label;
      option.title =
        optionDefinition.description ||
        "";

      option.dataset.consentRequired =
        optionDefinition
          .consentRequired
          ? "true"
          : "false";

      option.dataset.consentText =
        optionDefinition
          .consentText || "";

      option.dataset.warningLevel =
        optionDefinition
          .warningLevel || "";

      select.appendChild(option);
    }

    const consentNote =
      document.createElement(
        "small"
      );

    consentNote.className =
      "ari-preference-row__consent";
    consentNote.hidden = true;
    consentNote.textContent =
      "Explicit consent required.";

    row.append(
      copy,
      select
    );

    copy.appendChild(consentNote);

    select.addEventListener(
      "change",
      event =>
        this.handlePreferenceChange(
          event,
          consentNote
        )
    );

    return row;
  },

  populateForm(record = {}) {
    const preset =
      this.getElement("preset");

    if (preset) {
      preset.value =
        record.activePreset ||
        "default";
    }

    const overrides =
      record.preferenceOverrides ||
      {};

    const selects =
      this.getPreferenceSelects();

    for (const select of selects) {
      const category =
        select.dataset.category;
      const key =
        select.dataset.key;

      select.value =
        overrides
          ?.[category]
          ?.[key] ||
        "default";
    }
  },

  bindEvents() {
    const form =
      this.getElement("form");

    const reset =
      this.getElement("reset");

    const preset =
      this.getElement("preset");

    const consentCheckbox =
      this.getElement(
        "consentCheckbox"
      );

    const consentDialog =
      this.getElement(
        "consentDialog"
      );

    form?.addEventListener(
      "submit",
      event =>
        this.handleSubmit(event)
    );

    reset?.addEventListener(
      "click",
      () => this.handleReset()
    );

    preset?.addEventListener(
      "change",
      () => {
        if (
          preset.value !==
          "custom"
        ) {
          this.setStatus(
            "Preset selected. Save to apply.",
            "working"
          );
        }
      }
    );

    consentCheckbox
      ?.addEventListener(
        "change",
        () => {
          const confirm =
            this.getElement(
              "consentConfirm"
            );

          if (confirm) {
            confirm.disabled =
              !consentCheckbox
                .checked;
          }
        }
      );

    consentDialog
      ?.addEventListener(
        "close",
        () =>
          this.handleConsentClose()
      );
  },

  async handlePreferenceChange(
    event,
    consentNote
  ) {
    const select =
      event.currentTarget;

    const selected =
      select.options[
        select.selectedIndex
      ];

    const consentRequired =
      selected
        ?.dataset
        ?.consentRequired ===
      "true";

    consentNote.hidden =
      !consentRequired;

    if (!consentRequired) {
      return;
    }

    const category =
      select.dataset.category;
    const key =
      select.dataset.key;
    const value =
      select.value;
    const path =
      `${category}.${key}`;

    if (
      this.hasConsent(
        path,
        value
      )
    ) {
      return;
    }

    const previousValue =
      select.dataset
        .previousValue ||
      "default";

    this.state.pendingConsent = {
      select,
      path,
      category,
      key,
      value,
      previousValue,
      consentText:
        selected.dataset
          .consentText ||
        "This option requires explicit consent.",
      warningLevel:
        selected.dataset
          .warningLevel ||
        "standard"
    };

    this.openConsentDialog();
  },

  openConsentDialog() {
    const pending =
      this.state.pendingConsent;

    const dialog =
      this.getElement(
        "consentDialog"
      );

    const text =
      this.getElement(
        "consentText"
      );

    const checkbox =
      this.getElement(
        "consentCheckbox"
      );

    const confirm =
      this.getElement(
        "consentConfirm"
      );

    if (!pending || !dialog) {
      return;
    }

    if (text) {
      text.textContent =
        pending.consentText;
    }

    if (checkbox) {
      checkbox.checked = false;
    }

    if (confirm) {
      confirm.disabled = true;
    }

    dialog.showModal();
  },

  handleConsentClose() {
    const pending =
      this.state.pendingConsent;

    const dialog =
      this.getElement(
        "consentDialog"
      );

    if (!pending || !dialog) {
      return;
    }

    if (
      dialog.returnValue ===
      "confirm"
    ) {
      this.grantConsent(
        pending.path,
        pending.value
      );

      pending.select.dataset
        .previousValue =
        pending.value;

      this.setStatus(
        "Consent confirmed. Save to apply.",
        "working"
      );
    } else {
      pending.select.value =
        pending.previousValue ||
        "default";
    }

    this.state.pendingConsent =
      null;
  },

  async handleSubmit(event) {
    event.preventDefault();

    if (
      this.state.saving
    ) {
      return;
    }

    this.state.saving = true;
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

      const activePreset =
        this.getElement("preset")
          ?.value ||
        "default";

      const rawOverrides =
        this.collectOverrides();

      const validation =
        contract.validateOverrides(
          rawOverrides
        );

      if (!validation.ok) {
        throw new Error(
          validation.warnings
            .join(", ") ||
          "Invalid preference settings."
        );
      }

      this.assertRequiredConsent(
        validation.normalized
      );

      const result =
        await store.save(
          null,
          validation.normalized,
          {
            activePreset,
            schemaVersion:
              contract.schemaVersion,
            changeSource:
              "settings_ui"
          }
        );

      if (!result?.ok) {
        throw new Error(
          result?.error?.message ||
          result?.code ||
          "Unable to save preferences."
        );
      }

      this.state.record =
        result.record || {};

      if (
        runtime &&
        typeof runtime
          .afterPreferenceSave ===
          "function"
      ) {
        await runtime
          .afterPreferenceSave();
      }

      this.populateForm(
        this.state.record
      );

      this.setStatus(
        "Preferences saved.",
        "success"
      );

      window.dispatchEvent(
        new CustomEvent(
          "ari:preferences-updated",
          {
            detail: {
              record:
                this.clone(
                  this.state.record
                ),
              consentEvidence:
                this.getConsentEvidence()
            }
          }
        )
      );
    } catch (error) {
      this.setStatus(
        error?.message ||
        "Unable to save preferences.",
        "error"
      );
    } finally {
      this.state.saving = false;
      this.setSaving(false);
    }
  },

  async handleReset() {
    if (
      this.state.saving
    ) {
      return;
    }

    this.state.saving = true;
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
                  "settings_ui"
              }
            )
          : await store.save(
              null,
              {},
              {
                activePreset:
                  "default",
                changeSource:
                  "settings_ui"
              }
            );

      if (!result?.ok) {
        throw new Error(
          result?.error?.message ||
          result?.code ||
          "Unable to reset preferences."
        );
      }

      this.clearSessionConsent();

      this.state.record =
        result.record || {
          activePreset:
            "default",
          preferenceOverrides:
            {}
        };

      if (
        runtime &&
        typeof runtime
          .afterPreferenceSave ===
          "function"
      ) {
        await runtime
          .afterPreferenceSave();
      }

      this.populateForm(
        this.state.record
      );

      this.setStatus(
        "Preferences reset.",
        "success"
      );
    } catch (error) {
      this.setStatus(
        error?.message ||
        "Unable to reset preferences.",
        "error"
      );
    } finally {
      this.state.saving = false;
      this.setSaving(false);
    }
  },

  collectOverrides() {
    const output = {};

    for (
      const select
      of this.getPreferenceSelects()
    ) {
      const value =
        select.value;

      if (
        !value ||
        value === "default"
      ) {
        continue;
      }

      const category =
        select.dataset.category;
      const key =
        select.dataset.key;

      output[category] =
        output[category] || {};

      output[category][key] =
        value;
    }

    return output;
  },

  assertRequiredConsent(
    overrides = {}
  ) {
    const contract =
      this.requireContract();

    for (
      const [category, values]
      of Object.entries(
        overrides
      )
    ) {
      for (
        const [key, value]
        of Object.entries(
          values || {}
        )
      ) {
        if (
          contract.requiresConsent(
            category,
            key,
            value
          ) &&
          !this.hasConsent(
            `${category}.${key}`,
            value
          )
        ) {
          throw new Error(
            `Consent is required for ${category}.${key}.`
          );
        }
      }
    }
  },

  grantConsent(path, value) {
    this.state.consentEvidence[
      path
    ] = {
      approved: true,
      value,
      grantedAt:
        new Date().toISOString(),
      source:
        "settings_ui"
    };

    this.persistSessionConsent();
  },

  hasConsent(path, value) {
    const evidence =
      this.state
        .consentEvidence
        ?.[path];

    return Boolean(
      evidence?.approved ===
        true &&
      evidence.value === value
    );
  },

  getConsentEvidence() {
    return this.clone(
      this.state
        .consentEvidence
    );
  },

  persistSessionConsent() {
    try {
      sessionStorage.setItem(
        "ari.preferenceConsent",
        JSON.stringify(
          this.state
            .consentEvidence
        )
      );
    } catch {
      // Session consent remains available in memory.
    }
  },

  restoreSessionConsent() {
    try {
      const raw =
        sessionStorage.getItem(
          "ari.preferenceConsent"
        );

      if (!raw) return;

      const parsed =
        JSON.parse(raw);

      if (
        parsed &&
        typeof parsed ===
          "object" &&
        !Array.isArray(parsed)
      ) {
        this.state
          .consentEvidence =
          parsed;
      }
    } catch {
      this.state
        .consentEvidence = {};
    }
  },

  clearSessionConsent() {
    this.state
      .consentEvidence = {};

    try {
      sessionStorage.removeItem(
        "ari.preferenceConsent"
      );
    } catch {
      // No action required.
    }
  },

  getPreferenceSelects() {
    return Array.from(
      document.querySelectorAll(
        "#ari-preference-categories select[data-path]"
      )
    );
  },

  setLoading(isLoading) {
    const loading =
      this.getElement(
        "loading"
      );

    const form =
      this.getElement("form");

    if (loading) {
      loading.hidden =
        !isLoading;
    }

    if (form) {
      form.hidden =
        isLoading;
    }
  },

  setSaving(isSaving) {
    const save =
      this.getElement("save");

    const reset =
      this.getElement("reset");

    const preset =
      this.getElement("preset");

    if (save) {
      save.disabled =
        isSaving;
    }

    if (reset) {
      reset.disabled =
        isSaving;
    }

    if (preset) {
      preset.disabled =
        isSaving;
    }

    for (
      const select
      of this.getPreferenceSelects()
    ) {
      select.disabled =
        isSaving;
    }
  },

  setStatus(
    message = "",
    state = ""
  ) {
    const status =
      this.getElement("status");

    if (!status) return;

    status.textContent =
      message;

    if (state) {
      status.dataset.state =
        state;
    } else {
      delete status.dataset.state;
    }
  },

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
      saving:
        this.state.saving,
      record:
        this.clone(
          this.state.record
        ),
      consentEvidence:
        this.getConsentEvidence()
    };
  },

  requireContract() {
    const contract =
      window
        .AriUserPreferenceContract ||
      window.Ari
        ?.userPreferenceContract;

    if (!contract) {
      throw new Error(
        "AriUserPreferenceContract is not loaded."
      );
    }

    return contract;
  },

  requireStore() {
    const store =
      window
        .AriUserPreferenceStore ||
      window.Ari
        ?.userPreferenceStore;

    if (!store) {
      throw new Error(
        "AriUserPreferenceStore is not loaded."
      );
    }

    return store;
  },

  getRuntime() {
    return (
      window
        .AriPreferenceRuntime ||
      window.Ari
        ?.preferenceRuntime ||
      null
    );
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
  }
);

console.log(
  "ARI PREFERENCE SETTINGS CONTROLLER LOADED:",
  window
    .AriPreferenceSettingsController
    ?.version
);
