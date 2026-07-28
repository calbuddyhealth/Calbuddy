// js/ari-preference-settings-controller.js
// Ari Preference Settings Controller
//
// Purpose:
// Render the canonical contract-driven preference settings interface, promote
// selected preferences into simplified radio-card controls, load the user's
// stored record, collect explicit consent, save normalized overrides, and
// refresh the runtime preference cache.
//
// V1.1.0 — Canonical Primary Controls / Unified Preference Collection
//
// Architectural flow:
//
// AriUserPreferenceContract
//      ↓
// AriPreferenceSettingsController
//      ↓
// AriUserPreferenceStore
//      ↓
// AriPreferenceRuntime
//
// Responsibilities:
// - Render preset options from the canonical contract.
// - Render contract-declared primary preferences as radio cards.
// - Render remaining preferences as advanced select controls.
// - Load and populate stored preference overrides.
// - Collect radio and select values through one canonical path.
// - Enforce explicit consent for consent-gated values.
// - Save normalized overrides through AriUserPreferenceStore.
// - Refresh AriPreferenceRuntime after save and reset.
// - Dispatch canonical preference lifecycle events.
//
// Non-responsibilities:
// - Does not define preference meaning or valid values.
// - Does not persist records independently.
// - Does not resolve final runtime preferences.
// - Does not own safety or restriction policy.
// - Does not invent UI preferences outside the contract.

window.Ari = window.Ari || {};

window.AriPreferenceSettingsController = {
  version: "1.1.0",
  source: "ari-preference-settings-controller",

  state: {
    initialized: false,
    saving: false,
    eventsBound: false,

    record: null,
    uiSchema: null,

    pendingConsent: null,
    consentEvidence: {},

    primaryPresentations: {},
    primaryPaths: new Set()
  },

  selectors: {
    root: "#ari-preference-settings",
    loading: "#ari-preference-loading",
    form: "#ari-preference-form",

    preset: "#ari-preference-preset",

    humor: "#ari-preference-humor",
    language: "#ari-preference-language",

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

  /* =====================================================
     INITIALIZATION
  ===================================================== */

  async initialize() {
    if (this.state.initialized) {
      return this.getState();
    }

    const root = this.getElement("root");

    if (!root) {
      return {
        ok: false,
        code: "preference_settings_root_missing"
      };
    }

    try {
      const contract = this.requireContract();
      const store = this.requireStore();

      const uiSchema = contract.getUiSchema();

      if (
        !uiSchema ||
        typeof uiSchema !== "object"
      ) {
        throw new Error(
          "AriUserPreferenceContract returned an invalid UI schema."
        );
      }

      this.state.uiSchema = uiSchema;

      this.restoreSessionConsent();
      this.readPrimaryPresentations();

      this.renderPresetOptions();
      this.renderPrimaryPreferences();
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

      window.dispatchEvent(
        new CustomEvent(
          "ari:preference-settings-ready",
          {
            detail: {
              controllerVersion: this.version,
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
      this.setLoading(false);

      this.setStatus(
        error?.message ||
        "Unable to load preferences.",
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
    }
  },

  /* =====================================================
     PRIMARY PRESENTATION
  ===================================================== */

  readPrimaryPresentations() {
    const presentation =
      this.state.uiSchema?.presentation ||
      this.requireContract()
        .getUiPresentation?.() ||
      {};

    const primaryPreferences =
      presentation?.primaryPreferences ||
      {};

    this.state.primaryPresentations =
      this.clone(primaryPreferences) || {};

    this.state.primaryPaths =
      new Set(
        Object.values(
          primaryPreferences
        )
          .map(entry => entry?.path)
          .filter(Boolean)
      );
  },

  getPreferenceDefinitionFromSchema(
    category,
    key
  ) {
    for (
      const categoryDefinition
      of this.state.uiSchema?.categories || []
    ) {
      if (
        categoryDefinition.id !== category
      ) {
        continue;
      }

      return (
        categoryDefinition.preferences || []
      ).find(
        preference =>
          preference.key === key
      ) || null;
    }

    return null;
  },

  renderPrimaryPreferences() {
    for (
      const [presentationId, presentation]
      of Object.entries(
        this.state.primaryPresentations || {}
      )
    ) {
      this.renderPrimaryPreference(
        presentationId,
        presentation
      );
    }
  },

  renderPrimaryPreference(
    presentationId,
    presentation
  ) {
    const host =
      document.querySelector(
        presentation.hostSelector ||
        this.selectors[presentationId] ||
        ""
      );

    if (!host) {
      console.warn(
        `ARI PREFERENCE SETTINGS: Primary host missing for ${presentationId}.`
      );

      return;
    }

    const preference =
      this.getPreferenceDefinitionFromSchema(
        presentation.category,
        presentation.key
      );

    if (!preference) {
      console.warn(
        `ARI PREFERENCE SETTINGS: Contract preference missing for ${presentation.path}.`
      );

      host.innerHTML = "";
      host.hidden = true;

      return;
    }

    const requestedValues =
      Array.isArray(
        presentation.visibleValues
      )
        ? presentation.visibleValues
        : [];

    const visibleOptions =
      requestedValues
        .map(value =>
          (preference.options || [])
            .find(
              option =>
                option.value === value
            )
        )
        .filter(Boolean);

    host.innerHTML = "";
    host.hidden = false;

    const fieldset =
      document.createElement(
        "fieldset"
      );

    fieldset.className =
      "ari-preference-choice-group";

    fieldset.dataset.preferenceGroup =
      presentationId;

    fieldset.dataset.path =
      preference.path;

    const legend =
      document.createElement(
        "legend"
      );

    legend.className =
      "sr-only";

    legend.textContent =
      presentation.label ||
      preference.label ||
      presentationId;

    fieldset.appendChild(legend);

    for (
      const optionDefinition
      of visibleOptions
    ) {
      fieldset.appendChild(
        this.createPrimaryChoice({
          presentationId,
          preference,
          optionDefinition
        })
      );
    }

    host.appendChild(fieldset);
  },

  createPrimaryChoice({
    presentationId,
    preference,
    optionDefinition
  }) {
    const label =
      document.createElement(
        "label"
      );

    label.className =
      "ari-preference-choice";

    const input =
      document.createElement(
        "input"
      );

    input.type = "radio";
    input.name =
      `ari-primary-${presentationId}`;
    input.value =
      optionDefinition.value;

    input.dataset.preferenceControl =
      "true";
    input.dataset.controlType =
      "primary";
    input.dataset.category =
      preference.category;
    input.dataset.key =
      preference.key;
    input.dataset.path =
      preference.path;

    input.dataset.consentRequired =
      optionDefinition.consentRequired
        ? "true"
        : "false";

    input.dataset.consentText =
      optionDefinition.consentText ||
      "";

    input.dataset.warningLevel =
      optionDefinition.warningLevel ||
      "";

    const copy =
      document.createElement(
        "span"
      );

    copy.className =
      "ari-preference-choice__copy";

    const title =
      document.createElement(
        "strong"
      );

    title.className =
      "ari-preference-choice__title";

    title.textContent =
      optionDefinition.label ||
      optionDefinition.value;

    const description =
      document.createElement(
        "small"
      );

    description.className =
      "ari-preference-choice__description";

    description.textContent =
      optionDefinition.description ||
      "";

    copy.append(
      title,
      description
    );

    label.append(
      input,
      copy
    );

    input.addEventListener(
      "change",
      event =>
        this.handlePreferenceChange(
          event
        )
    );

    return label;
  },

  /* =====================================================
     PRESET RENDERING
  ===================================================== */

  renderPresetOptions() {
    const select =
      this.getElement("preset");

    if (!select) {
      return;
    }

    select.innerHTML = "";

    for (
      const preset
      of this.state.uiSchema?.presets || []
    ) {
      if (!preset?.id) {
        continue;
      }

      const option =
        document.createElement(
          "option"
        );

      option.value = preset.id;

      option.textContent =
        preset.label ||
        preset.id;

      option.title =
        preset.description ||
        "";

      select.appendChild(option);
    }

    if (
      !Array.from(
        select.options
      ).some(
        option =>
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

  /* =====================================================
     ADVANCED CATEGORY RENDERING
  ===================================================== */

  renderCategories() {
    const container =
      this.getElement(
        "categories"
      );

    if (!container) {
      return;
    }

    container.innerHTML = "";

    for (
      const category
      of this.state.uiSchema?.categories || []
    ) {
      const advancedPreferences =
        (category.preferences || [])
          .filter(
            preference =>
              !this.state.primaryPaths
                .has(preference.path)
          );

      if (
        advancedPreferences.length === 0
      ) {
        continue;
      }

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
        document.createElement(
          "h2"
        );

      title.textContent =
        category.label ||
        "Preferences";

      const description =
        document.createElement(
          "p"
        );

      description.textContent =
        category.description ||
        "";

      header.append(
        title,
        description
      );

      section.appendChild(header);

      for (
        const preference
        of advancedPreferences
      ) {
        section.appendChild(
          this.createPreferenceRow(
            preference
          )
        );
      }

      container.appendChild(section);
    }
  },

  createPreferenceRow(
    preference
  ) {
    const row =
      document.createElement(
        "div"
      );

    row.className =
      "ari-preference-row";

    const copy =
      document.createElement(
        "div"
      );

    copy.className =
      "ari-preference-row__copy";

    const label =
      document.createElement(
        "label"
      );

    const selectId =
      `ari-pref-${this.toSafeId(
        preference.category
      )}-${this.toSafeId(
        preference.key
      )}`;

    label.className =
      "ari-preference-row__label";

    label.htmlFor = selectId;

    label.textContent =
      preference.label ||
      preference.key;

    const description =
      document.createElement(
        "p"
      );

    description.className =
      "ari-preference-row__description";

    description.textContent =
      preference.description ||
      "";

    const consentNote =
      document.createElement(
        "small"
      );

    consentNote.className =
      "ari-preference-row__consent";

    consentNote.hidden = true;

    consentNote.textContent =
      "Explicit consent required.";

    copy.append(
      label,
      description,
      consentNote
    );

    const select =
      document.createElement(
        "select"
      );

    select.id = selectId;
    select.name = preference.path;

    select.dataset.preferenceControl =
      "true";
    select.dataset.controlType =
      "advanced";
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
        optionDefinition.label ||
        optionDefinition.value;

      option.title =
        optionDefinition.description ||
        "";

      option.dataset.consentRequired =
        optionDefinition.consentRequired
          ? "true"
          : "false";

      option.dataset.consentText =
        optionDefinition.consentText ||
        "";

      option.dataset.warningLevel =
        optionDefinition.warningLevel ||
        "";

      select.appendChild(option);
    }

    select.addEventListener(
      "change",
      event =>
        this.handlePreferenceChange(
          event,
          consentNote
        )
    );

    row.append(
      copy,
      select
    );

    return row;
  },

  /* =====================================================
     FORM POPULATION
  ===================================================== */

  populateForm(record = {}) {
    const preset =
      this.getElement("preset");

    if (preset) {
      const requestedPreset =
        record.activePreset ||
        "default";

      const optionExists =
        Array.from(
          preset.options
        ).some(
          option =>
            option.value ===
            requestedPreset
        );

      preset.value =
        optionExists
          ? requestedPreset
          : "default";
    }

    const overrides =
      record.preferenceOverrides ||
      {};

    const controls =
      this.getPreferenceControls();

    const radioPaths =
      new Set();

    for (
      const control
      of controls
    ) {
      const category =
        control.dataset.category;

      const key =
        control.dataset.key;

      const savedValue =
        overrides?.[category]?.[key] ||
        "default";

      if (
        control.type === "radio"
      ) {
        control.checked =
          control.value === savedValue;

        radioPaths.add(
          control.dataset.path
        );
      } else {
        const optionExists =
          Array.from(
            control.options || []
          ).some(
            option =>
              option.value ===
              savedValue
          );

        control.value =
          optionExists
            ? savedValue
            : "default";
      }

      control.dataset.previousValue =
        savedValue;

      this.updateConsentIndicator(
        control
      );
    }

    for (
      const path
      of radioPaths
    ) {
      const group =
        this.getRadioGroupByPath(
          path
        );

      if (
        group.some(
          input =>
            input.checked
        )
      ) {
        continue;
      }

      const runtimeValue =
        this.getRuntimeDefaultForPath(
          path
        );

      const fallback =
        group.find(
          input =>
            input.value === runtimeValue
        ) ||
        group.find(
          input =>
            input.value === "adaptive"
        ) ||
        group[0];

      if (fallback) {
        fallback.checked = true;

        for (
          const input
          of group
        ) {
          input.dataset.previousValue =
            fallback.value;
        }
      }
    }
  },

  getRuntimeDefaultForPath(path) {
    const [
      category,
      key
    ] = String(path || "")
      .split(".");

    return (
      this.requireContract()
        .getRuntimeDefaults?.()
        ?.[category]
        ?.[key] ||
      "default"
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
      () =>
        this.handleReset()
    );

    preset?.addEventListener(
      "change",
      () => {
        this.setStatus(
          "Preset selected. Save to apply.",
          "working"
        );
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
              !consentCheckbox.checked;
          }
        }
      );

    consentDialog
      ?.addEventListener(
        "close",
        () =>
          this.handleConsentClose()
      );

    this.state.eventsBound = true;
  },

  /* =====================================================
     PREFERENCE CHANGE AND CONSENT
  ===================================================== */

  handlePreferenceChange(
    event,
    consentNote = null
  ) {
    const control =
      event.currentTarget;

    if (!control) {
      return;
    }

    if (
      control.type === "radio" &&
      !control.checked
    ) {
      return;
    }

    const metadata =
      this.getSelectedOptionMetadata(
        control
      );

    if (consentNote) {
      consentNote.hidden =
        !metadata.consentRequired;
    }

    const path =
      control.dataset.path;

    const value =
      control.value;

    if (
      !metadata.consentRequired ||
      this.hasConsent(
        path,
        value
      )
    ) {
      this.commitControlValue(
        control,
        value
      );

      this.setPresetToCustom();

      this.setStatus(
        "Preference changed. Save to apply.",
        "working"
      );

      return;
    }

    this.state.pendingConsent = {
      control,
      path,
      category:
        control.dataset.category,
      key:
        control.dataset.key,
      value,
      previousValue:
        control.dataset.previousValue ||
        "default",
      consentText:
        metadata.consentText ||
        "This option requires explicit consent.",
      warningLevel:
        metadata.warningLevel ||
        "standard"
    };

    this.openConsentDialog();
  },

  getSelectedOptionMetadata(
    control
  ) {
    if (
      control.tagName === "SELECT"
    ) {
      const selected =
        control.options[
          control.selectedIndex
        ];

      return {
        consentRequired:
          selected?.dataset
            ?.consentRequired ===
          "true",
        consentText:
          selected?.dataset
            ?.consentText ||
          "",
        warningLevel:
          selected?.dataset
            ?.warningLevel ||
          ""
      };
    }

    return {
      consentRequired:
        control.dataset
          .consentRequired ===
        "true",
      consentText:
        control.dataset
          .consentText ||
        "",
      warningLevel:
        control.dataset
          .warningLevel ||
        ""
    };
  },

  openConsentDialog() {
    const pending =
      this.state.pendingConsent;

    const dialog =
      this.getElement(
        "consentDialog"
      );

    if (
      !pending ||
      !dialog
    ) {
      return;
    }

    const title =
      this.getElement(
        "consentTitle"
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

    if (title) {
      title.textContent =
        pending.warningLevel === "high"
          ? "Confirm sensitive preference"
          : "Confirm preference";
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

    if (
      typeof dialog.showModal ===
      "function"
    ) {
      dialog.showModal();
    } else {
      dialog.setAttribute(
        "open",
        ""
      );
    }
  },

  handleConsentClose() {
    const pending =
      this.state.pendingConsent;

    const dialog =
      this.getElement(
        "consentDialog"
      );

    if (
      !pending ||
      !dialog
    ) {
      return;
    }

    if (
      dialog.returnValue === "confirm"
    ) {
      this.grantConsent(
        pending.path,
        pending.value
      );

      this.commitControlValue(
        pending.control,
        pending.value
      );

      this.setPresetToCustom();

      this.setStatus(
        "Consent confirmed. Save to apply.",
        "working"
      );
    } else {
      this.restoreControlValue(
        pending.control,
        pending.previousValue
      );
    }

    this.updateConsentIndicator(
      pending.control
    );

    this.state.pendingConsent = null;
  },

  commitControlValue(
    control,
    value
  ) {
    if (
      control.type === "radio"
    ) {
      for (
        const candidate
        of this.getRadioGroup(
          control
        )
      ) {
        candidate.dataset.previousValue =
          value;
      }

      return;
    }

    control.dataset.previousValue =
      value;

    this.updateConsentIndicator(
      control
    );
  },

  restoreControlValue(
    control,
    previousValue
  ) {
    if (
      control.type !== "radio"
    ) {
      control.value =
        previousValue ||
        "default";

      return;
    }

    const group =
      this.getRadioGroup(
        control
      );

    const fallback =
      group.find(
        candidate =>
          candidate.value === previousValue
      ) ||
      group.find(
        candidate =>
          candidate.value === "adaptive"
      ) ||
      group[0];

    for (
      const candidate
      of group
    ) {
      candidate.checked =
        candidate === fallback;
    }
  },

  updateConsentIndicator(
    control
  ) {
    if (
      control.tagName !== "SELECT"
    ) {
      return;
    }

    const row =
      control.closest(
        ".ari-preference-row"
      );

    const note =
      row?.querySelector(
        ".ari-preference-row__consent"
      );

    if (!note) {
      return;
    }

    note.hidden =
      !this.getSelectedOptionMetadata(
        control
      ).consentRequired;
  },

  setPresetToCustom() {
    const preset =
      this.getElement("preset");

    if (!preset) {
      return;
    }

    const customExists =
      Array.from(
        preset.options
      ).some(
        option =>
          option.value === "custom"
      );

    if (customExists) {
      preset.value = "custom";
    }
  },

  /* =====================================================
     SAVE
  ===================================================== */

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

      if (!validation?.ok) {
        throw new Error(
          validation?.warnings
            ?.join(", ") ||
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
              source: this.source,
              controllerVersion:
                this.version,
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
      console.error(
        "ARI PREFERENCE SETTINGS SAVE FAILED:",
        error
      );

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

  collectOverrides() {
    const output = {};

    for (
      const control
      of this.getPreferenceControls()
    ) {
      if (
        control.type === "radio" &&
        !control.checked
      ) {
        continue;
      }

      const value =
        control.value;

      if (
        !value ||
        value === "default"
      ) {
        continue;
      }

      const category =
        control.dataset.category;

      const key =
        control.dataset.key;

      if (
        !category ||
        !key
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

      window.dispatchEvent(
        new CustomEvent(
          "ari:preferences-reset",
          {
            detail: {
              source: this.source,
              record:
                this.clone(
                  this.state.record
                )
            }
          }
        )
      );
    } catch (error) {
      console.error(
        "ARI PREFERENCE SETTINGS RESET FAILED:",
        error
      );

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

  /* =====================================================
     CONSENT
  ===================================================== */

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

  grantConsent(
    path,
    value
  ) {
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

  hasConsent(
    path,
    value
  ) {
    const evidence =
      this.state
        .consentEvidence
        ?.[path];

    return Boolean(
      evidence?.approved === true &&
      evidence.value === value
    );
  },

  getConsentEvidence() {
    return this.clone(
      this.state.consentEvidence
    );
  },

  persistSessionConsent() {
    try {
      sessionStorage.setItem(
        "ari.preferenceConsent",
        JSON.stringify(
          this.state.consentEvidence
        )
      );
    } catch {
      // Consent remains available in controller memory.
    }
  },

  restoreSessionConsent() {
    try {
      const raw =
        sessionStorage.getItem(
          "ari.preferenceConsent"
        );

      if (!raw) {
        return;
      }

      const parsed =
        JSON.parse(raw);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        this.state.consentEvidence =
          parsed;
      }
    } catch {
      this.state.consentEvidence = {};
    }
  },

  clearSessionConsent() {
    this.state.consentEvidence = {};

    try {
      sessionStorage.removeItem(
        "ari.preferenceConsent"
      );
    } catch {
      // No further action required.
    }
  },

  /* =====================================================
     CONTROL ACCESS
  ===================================================== */

  getPreferenceControls() {
    return Array.from(
      document.querySelectorAll(
        "[data-preference-control='true'][data-path]"
      )
    );
  },

  getRadioGroup(control) {
    if (!control?.name) {
      return [];
    }

    return Array.from(
      document.querySelectorAll(
        `input[type="radio"][name="${this.escapeSelectorValue(
          control.name
        )}"]`
      )
    );
  },

  getRadioGroupByPath(path) {
    return this.getPreferenceControls()
      .filter(
        control =>
          control.type === "radio" &&
          control.dataset.path === path
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
      const control
      of this.getPreferenceControls()
    ) {
      control.disabled =
        isSaving;
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
      typeof contract.getUiSchema !==
      "function"
    ) {
      throw new Error(
        "AriUserPreferenceContract.getUiSchema is unavailable."
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
      typeof store.read !== "function" ||
      typeof store.save !== "function"
    ) {
      throw new Error(
        "AriUserPreferenceStore does not expose read and save."
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
     STATE AND UTILITIES
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
      saving:
        this.state.saving,
      record:
        this.clone(
          this.state.record
        ),
      primaryPresentations:
        this.clone(
          this.state.primaryPresentations
        ),
      consentEvidence:
        this.getConsentEvidence()
    };
  },

  toSafeId(value) {
    return (
      String(value || "preference")
        .trim()
        .toLowerCase()
        .replace(
          /[^a-z0-9_-]+/g,
          "-"
        )
        .replace(
          /^[-_]+|[-_]+$/g,
          ""
        ) ||
      "preference"
    );
  },

  escapeSelectorValue(value) {
    if (
      window.CSS &&
      typeof window.CSS.escape ===
      "function"
    ) {
      return window.CSS.escape(
        String(value)
      );
    }

    return String(
      value || ""
    ).replace(
      /["\\]/g,
      "\\$&"
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
  }
);

console.log(
  "ARI PREFERENCE SETTINGS CONTROLLER LOADED:",
  window
    .AriPreferenceSettingsController
    ?.version
);
