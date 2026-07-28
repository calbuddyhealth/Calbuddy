// ari/settings/ari-preference-settings-controller.js
// Ari Preference Settings Controller
//
// Purpose:
// Render the contract-driven Ari preference interface, promote selected
// high-value preferences into simplified radio-card controls, load the
// authenticated user's stored record, collect explicit consent, save
// normalized overrides, and refresh the runtime preference cache.
//
// V1.1.0 — Simplified Contract-Driven Preference Interface
//
// Architectural flow:
//
// Ari User Preference Contract
//      ↓
// Ari Preference Settings Controller
//      ↓
// Ari User Preference Store
//      ↓
// Ari Preference Runtime Refresh
//
// Responsibilities:
// - Render preset options from the canonical preference contract.
// - Render Humor, Language, and Specialization as simplified primary controls.
// - Render remaining contract preferences as advanced select controls.
// - Load and populate the authenticated user's stored preference record.
// - Collect normalized preference overrides.
// - Collect explicit consent for consent-gated values.
// - Save through the canonical preference store.
// - Refresh the runtime preference cache after saves and resets.
// - Dispatch one canonical preferences-updated event.
//
// Non-responsibilities:
// - Does not define preference meaning.
// - Does not invent preference values.
// - Does not resolve effective runtime preferences.
// - Does not independently persist user preferences.
// - Does not bypass contract validation.
// - Does not override safety, factual, medical, or legal safeguards.

window.Ari = window.Ari || {};

window.AriPreferenceSettingsController = {
  version: "1.1.0",
  source: "ari-preference-settings-controller",

  state: {
    initialized: false,
    saving: false,

    record: null,
    uiSchema: null,

    pendingConsent: null,
    consentEvidence: {},

    primaryPreferences: {
      humor: null,
      language: null,
      specialization: null
    },

    primaryPaths: new Set()
  },

  selectors: {
    root: "#ari-preference-settings",
    loading: "#ari-preference-loading",
    form: "#ari-preference-form",

    preset: "#ari-preference-preset",

    humor: "#ari-preference-humor",
    language: "#ari-preference-language",
    specialization: "#ari-preference-specialization",

    categories: "#ari-preference-categories",

    status: "#ari-preference-status",
    save: "#ari-preference-save",
    reset: "#ari-preference-reset",

    consentDialog:
      "#ari-preference-consent-dialog",

    consentTitle:
      "#ari-preference-consent-title",

    consentText:
      "#ari-preference-consent-text",

    consentCheckbox:
      "#ari-preference-consent-checkbox",

    consentConfirm:
      "#ari-preference-consent-confirm"
  },

  primaryPreferenceCandidates: {
    humor: {
      keys: [
        "humor",
        "humorLevel",
        "humor_level",
        "humorIntensity",
        "humor_intensity"
      ],

      paths: [
        "language.humor",
        "language.humorLevel",
        "language.humor_level",
        "character.humor",
        "communication.humor",
        "tone.humor"
      ],

      labels: [
        "humor",
        "humour"
      ],

      staticNames: [
        "humorLevel",
        "humor",
        "humor_level"
      ]
    },

    language: {
      keys: [
        "profanity",
        "profanityLevel",
        "profanity_level",
        "language",
        "languageLevel",
        "language_level",
        "explicitLanguage",
        "explicit_language"
      ],

      paths: [
        "language.profanity",
        "language.profanityLevel",
        "language.profanity_level",
        "communication.profanity",
        "tone.profanity",
        "language.explicitLanguage"
      ],

      labels: [
        "language",
        "profanity",
        "word choice",
        "explicit language"
      ],

      staticNames: [
        "profanityLevel",
        "languageLevel",
        "profanity",
        "language"
      ]
    },

    specialization: {
      keys: [
        "specialization",
        "domainSpecialization",
        "domain_specialization",
        "domainEmphasis",
        "domain_emphasis",
        "primaryDomain",
        "primary_domain"
      ],

      paths: [
        "specialization",
        "profile.specialization",
        "knowledge.specialization",
        "communication.specialization",
        "domain.specialization",
        "domain.emphasis"
      ],

      labels: [
        "specialization",
        "area of emphasis",
        "domain emphasis",
        "primary domain"
      ],

      staticNames: [
        "specialization",
        "domainSpecialization",
        "domainEmphasis"
      ]
    }
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

      this.state.uiSchema =
        contract.getUiSchema();

      if (
        !this.state.uiSchema ||
        typeof this.state.uiSchema !== "object"
      ) {
        throw new Error(
          "The preference contract did not return a valid UI schema."
        );
      }

      this.restoreSessionConsent();

      this.resolvePrimaryPreferences();
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
              controllerVersion:
                this.version,

              record:
                this.clone(
                  this.state.record
                ),

              primaryPreferences:
                this.getPrimaryPreferenceSummary()
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
        code:
          "preference_settings_initialize_failed",
        error
      };
    }
  },

  /* =====================================================
     CONTRACT PREFERENCE DISCOVERY
  ===================================================== */

  getAllPreferenceDefinitions() {
    const definitions = [];

    for (
      const category
      of this.state.uiSchema?.categories || []
    ) {
      for (
        const preference
        of category.preferences || []
      ) {
        definitions.push({
          ...preference,

          category:
            preference.category ||
            category.id ||
            category.key ||
            "",

          categoryLabel:
            category.label || "",

          categoryDescription:
            category.description || "",

          path:
            preference.path ||
            [
              preference.category ||
                category.id ||
                category.key,

              preference.key
            ]
              .filter(Boolean)
              .join(".")
        });
      }
    }

    return definitions;
  },

  resolvePrimaryPreferences() {
    this.state.primaryPaths =
      new Set();

    for (
      const primaryName
      of Object.keys(
        this.primaryPreferenceCandidates
      )
    ) {
      const definition =
        this.findPrimaryPreference(
          primaryName
        );

      this.state.primaryPreferences[
        primaryName
      ] = definition;

      if (definition?.path) {
        this.state.primaryPaths.add(
          definition.path
        );
      }
    }
  },

  findPrimaryPreference(primaryName) {
    const candidates =
      this.primaryPreferenceCandidates[
        primaryName
      ];

    if (!candidates) {
      return null;
    }

    const definitions =
      this.getAllPreferenceDefinitions();

    const normalizedKeys =
      new Set(
        (candidates.keys || [])
          .map(value =>
            this.normalizeIdentifier(
              value
            )
          )
      );

    const normalizedPaths =
      new Set(
        (candidates.paths || [])
          .map(value =>
            this.normalizePath(
              value
            )
          )
      );

    const normalizedLabels =
      (candidates.labels || [])
        .map(value =>
          this.normalizeText(
            value
          )
        );

    const exactPathMatch =
      definitions.find(
        definition =>
          normalizedPaths.has(
            this.normalizePath(
              definition.path
            )
          )
      );

    if (exactPathMatch) {
      return exactPathMatch;
    }

    const exactKeyMatch =
      definitions.find(
        definition =>
          normalizedKeys.has(
            this.normalizeIdentifier(
              definition.key
            )
          )
      );

    if (exactKeyMatch) {
      return exactKeyMatch;
    }

    const labelMatch =
      definitions.find(
        definition => {
          const label =
            this.normalizeText(
              definition.label
            );

          return normalizedLabels.some(
            candidate =>
              label === candidate ||
              label.includes(candidate)
          );
        }
      );

    return labelMatch || null;
  },

  getPrimaryPreferenceSummary() {
    const output = {};

    for (
      const [name, preference]
      of Object.entries(
        this.state.primaryPreferences
      )
    ) {
      output[name] =
        preference
          ? {
              category:
                preference.category,

              key:
                preference.key,

              path:
                preference.path
            }
          : null;
    }

    return output;
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
      of this.state.uiSchema
        ?.presets || []
    ) {
      if (!preset?.id) {
        continue;
      }

      const option =
        document.createElement(
          "option"
        );

      option.value =
        preset.id;

      option.textContent =
        preset.label ||
        preset.id;

      option.title =
        preset.description || "";

      select.appendChild(
        option
      );
    }

    if (
      !Array.from(
        select.options
      ).some(
        option =>
          option.value ===
          "custom"
      )
    ) {
      const custom =
        document.createElement(
          "option"
        );

      custom.value =
        "custom";

      custom.textContent =
        "Custom";

      select.appendChild(
        custom
      );
    }
  },

  /* =====================================================
     PRIMARY PREFERENCE RENDERING
  ===================================================== */

  renderPrimaryPreferences() {
    this.renderPrimaryPreference(
      "humor"
    );

    this.renderPrimaryPreference(
      "language"
    );

    this.renderPrimaryPreference(
      "specialization"
    );
  },

  renderPrimaryPreference(
    primaryName
  ) {
    const preference =
      this.state.primaryPreferences[
        primaryName
      ];

    const host =
      this.getPrimaryHost(
        primaryName
      );

    if (!host) {
      return;
    }

    if (!preference) {
      this.markPrimaryPreferenceUnavailable(
        host,
        primaryName
      );

      return;
    }

    this.createPrimaryPreferenceControl(
      preference,
      host,
      primaryName
    );
  },

  getPrimaryHost(primaryName) {
    const directHost =
      this.getElement(
        primaryName
      );

    if (directHost) {
      return directHost;
    }

    const candidates =
      this.primaryPreferenceCandidates[
        primaryName
      ];

    for (
      const name
      of candidates?.staticNames || []
    ) {
      const input =
        document.querySelector(
          `input[name="${this.escapeSelectorValue(name)}"]`
        );

      const fieldset =
        input?.closest(
          "fieldset"
        );

      if (fieldset) {
        return fieldset;
      }
    }

    return null;
  },

  markPrimaryPreferenceUnavailable(
    host,
    primaryName
  ) {
    host.dataset.preferenceUnavailable =
      "true";

    const panel =
      host.closest(
        ".ari-preference-panel"
      );

    if (panel) {
      panel.hidden = true;
    }

    console.warn(
      `ARI PREFERENCE SETTINGS: No canonical contract preference was found for ${primaryName}.`
    );
  },

  createPrimaryPreferenceControl(
    preference,
    host,
    primaryName
  ) {
    host.innerHTML = "";
    host.hidden = false;

    const fieldset =
      host.tagName ===
      "FIELDSET"
        ? host
        : document.createElement(
            "fieldset"
          );

    fieldset.classList.add(
      "ari-preference-choice-group"
    );

    fieldset.dataset.preferenceGroup =
      primaryName;

    fieldset.dataset.category =
      preference.category;

    fieldset.dataset.key =
      preference.key;

    fieldset.dataset.path =
      preference.path;

    if (
      host.tagName !==
      "FIELDSET"
    ) {
      const legend =
        document.createElement(
          "legend"
        );

      legend.className =
        "sr-only";

      legend.textContent =
        preference.label ||
        primaryName;

      fieldset.appendChild(
        legend
      );
    }

    const options =
      this.getSimplifiedPrimaryOptions(
        preference,
        primaryName
      );

    for (
      const optionDefinition
      of options
    ) {
      fieldset.appendChild(
        this.createPrimaryOption({
          preference,
          optionDefinition,
          primaryName
        })
      );
    }

    if (
      host.tagName !==
      "FIELDSET"
    ) {
      host.appendChild(
        fieldset
      );
    }
  },

  getSimplifiedPrimaryOptions(
    preference,
    primaryName
  ) {
    const options =
      Array.isArray(
        preference.options
      )
        ? preference.options
        : [];

    if (options.length <= 5) {
      return options;
    }

    const preferredCounts = {
      humor: 3,
      language: 3,
      specialization: 5
    };

    const desiredCount =
      preferredCounts[
        primaryName
      ] || 3;

    const defaultOption =
      options.find(
        option =>
          option.value ===
          "default"
      );

    const nonDefaultOptions =
      options.filter(
        option =>
          option.value !==
          "default"
      );

    if (
      nonDefaultOptions.length <=
      desiredCount
    ) {
      return defaultOption
        ? [
            defaultOption,
            ...nonDefaultOptions
          ]
        : nonDefaultOptions;
    }

    const selected = [];

    if (defaultOption) {
      selected.push(
        defaultOption
      );
    }

    if (
      primaryName ===
      "specialization"
    ) {
      const preferredTerms = [
        "medical",
        "health",
        "programming",
        "technology",
        "business",
        "education",
        "relationship",
        "life"
      ];

      for (
        const term
        of preferredTerms
      ) {
        const match =
          nonDefaultOptions.find(
            option =>
              !selected.includes(
                option
              ) &&
              (
                this.normalizeText(
                  option.value
                ).includes(
                  term
                ) ||
                this.normalizeText(
                  option.label
                ).includes(
                  term
                )
              )
          );

        if (match) {
          selected.push(
            match
          );
        }

        if (
          selected.length >=
          desiredCount
        ) {
          break;
        }
      }
    }

    const remainingSlots =
      desiredCount -
      selected.length;

    if (remainingSlots > 0) {
      const remainingOptions =
        nonDefaultOptions.filter(
          option =>
            !selected.includes(
              option
            )
        );

      if (
        remainingOptions.length <=
        remainingSlots
      ) {
        selected.push(
          ...remainingOptions
        );
      } else {
        const step =
          Math.max(
            1,
            Math.floor(
              remainingOptions.length /
              remainingSlots
            )
          );

        for (
          let index = 0;
          index <
          remainingOptions.length &&
          selected.length <
          desiredCount;
          index += step
        ) {
          selected.push(
            remainingOptions[
              index
            ]
          );
        }
      }
    }

    return selected.slice(
      0,
      desiredCount
    );
  },

  createPrimaryOption({
    preference,
    optionDefinition,
    primaryName
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
      `ari-primary-${primaryName}`;

    input.value =
      optionDefinition.value;

    input.dataset.preferenceControl =
      "true";

    input.dataset.controlType =
      "primary";

    input.dataset.primaryName =
      primaryName;

    input.dataset.category =
      preference.category;

    input.dataset.key =
      preference.key;

    input.dataset.path =
      preference.path;

    input.dataset.consentRequired =
      optionDefinition
        .consentRequired
        ? "true"
        : "false";

    input.dataset.consentText =
      optionDefinition
        .consentText || "";

    input.dataset.warningLevel =
      optionDefinition
        .warningLevel || "";

    const copy =
      document.createElement(
        "span"
      );

    const title =
      document.createElement(
        "strong"
      );

    title.textContent =
      optionDefinition.label ||
      optionDefinition.value;

    copy.appendChild(
      title
    );

    if (
      optionDefinition.description
    ) {
      const description =
        document.createElement(
          "small"
        );

      description.textContent =
        optionDefinition.description;

      copy.appendChild(
        description
      );
    }

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
      of this.state.uiSchema
        ?.categories || []
    ) {
      const visiblePreferences =
        (
          category.preferences ||
          []
        ).filter(
          preference =>
            !this.isPrimaryPreference(
              preference,
              category
            )
        );

      if (
        visiblePreferences.length ===
        0
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
        category.description || "";

      header.append(
        title,
        description
      );

      section.appendChild(
        header
      );

      for (
        const preference
        of visiblePreferences
      ) {
        section.appendChild(
          this.createPreferenceRow({
            ...preference,

            category:
              preference.category ||
              category.id ||
              category.key ||
              "",

            path:
              preference.path ||
              [
                preference.category ||
                  category.id ||
                  category.key,

                preference.key
              ]
                .filter(Boolean)
                .join(".")
          })
        );
      }

      container.appendChild(
        section
      );
    }

    window.dispatchEvent(
      new CustomEvent(
        "ari:preference-categories-rendered",
        {
          detail: {
            categoryCount:
              container.children
                .length
          }
        }
      )
    );
  },

  isPrimaryPreference(
    preference,
    category
  ) {
    const path =
      preference.path ||
      [
        preference.category ||
          category.id ||
          category.key,

        preference.key
      ]
        .filter(Boolean)
        .join(".");

    return this.state
      .primaryPaths
      .has(path);
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

    label.htmlFor =
      selectId;

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
      preference.description || "";

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

    select.id =
      selectId;

    select.name =
      preference.path;

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

      select.appendChild(
        option
      );
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
      this.getElement(
        "preset"
      );

    if (preset) {
      const requestedPreset =
        record.activePreset ||
        "default";

      const exists =
        Array.from(
          preset.options
        ).some(
          option =>
            option.value ===
            requestedPreset
        );

      preset.value =
        exists
          ? requestedPreset
          : "default";
    }

    const overrides =
      record.preferenceOverrides ||
      {};

    const controls =
      this.getPreferenceControls();

    const groupedRadioPaths =
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
        overrides
          ?.[category]
          ?.[key] ||
        "default";

      if (
        control.type ===
        "radio"
      ) {
        control.checked =
          control.value ===
          savedValue;

        groupedRadioPaths.add(
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
      of groupedRadioPaths
    ) {
      const group =
        this.getRadioGroupByPath(
          path
        );

      const hasChecked =
        group.some(
          input =>
            input.checked
        );

      if (!hasChecked) {
        const fallback =
          group.find(
            input =>
              input.value ===
              "default"
          ) ||
          group[0];

        if (fallback) {
          fallback.checked = true;
        }
      }
    }
  },

  /* =====================================================
     EVENT BINDING
  ===================================================== */

  bindEvents() {
    const form =
      this.getElement(
        "form"
      );

    const reset =
      this.getElement(
        "reset"
      );

    const preset =
      this.getElement(
        "preset"
      );

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
        this.handleSubmit(
          event
        )
    );

    reset?.addEventListener(
      "click",
      () =>
        this.handleReset()
    );

    preset?.addEventListener(
      "change",
      () => {
        if (
          preset.value !==
          "custom"
        ) {
          this.setStatus(
            "Style selected. Save to apply.",
            "working"
          );
        }

        window.dispatchEvent(
          new CustomEvent(
            "ari:preference-preset-change",
            {
              detail: {
                activePreset:
                  preset.value
              }
            }
          )
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

  /* =====================================================
     PREFERENCE CHANGE AND CONSENT
  ===================================================== */

  handlePreferenceChange(
    event,
    consentNote = null
  ) {
    const control =
      event.currentTarget;

    if (
      !control ||
      !control.dataset
    ) {
      return;
    }

    if (
      control.type ===
        "radio" &&
      !control.checked
    ) {
      return;
    }

    const optionMetadata =
      this.getSelectedOptionMetadata(
        control
      );

    const consentRequired =
      optionMetadata
        .consentRequired;

    if (consentNote) {
      consentNote.hidden =
        !consentRequired;
    }

    if (!consentRequired) {
      this.commitControlValue(
        control,
        control.value
      );

      this.setPresetToCustom();

      this.setStatus(
        "Preference changed. Save to apply.",
        "working"
      );

      this.dispatchPreferenceFieldChange(
        control
      );

      return;
    }

    const category =
      control.dataset.category;

    const key =
      control.dataset.key;

    const value =
      control.value;

    const path =
      control.dataset.path ||
      `${category}.${key}`;

    if (
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

      this.dispatchPreferenceFieldChange(
        control
      );

      return;
    }

    const previousValue =
      control.dataset
        .previousValue ||
      "default";

    this.state.pendingConsent = {
      control,
      path,
      category,
      key,
      value,
      previousValue,

      consentText:
        optionMetadata
          .consentText ||
        "This option requires explicit consent.",

      warningLevel:
        optionMetadata
          .warningLevel ||
        "standard"
    };

    this.openConsentDialog();
  },

  getSelectedOptionMetadata(
    control
  ) {
    if (
      control.tagName ===
      "SELECT"
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
            ?.consentText || "",

        warningLevel:
          selected?.dataset
            ?.warningLevel || ""
      };
    }

    return {
      consentRequired:
        control.dataset
          .consentRequired ===
        "true",

      consentText:
        control.dataset
          .consentText || "",

      warningLevel:
        control.dataset
          .warningLevel || ""
    };
  },

  updateConsentIndicator(
    control
  ) {
    if (
      control.tagName !==
      "SELECT"
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

  openConsentDialog() {
    const pending =
      this.state.pendingConsent;

    const dialog =
      this.getElement(
        "consentDialog"
      );

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

    if (
      !pending ||
      !dialog
    ) {
      return;
    }

    if (title) {
      title.textContent =
        pending.warningLevel ===
        "high"
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
      dialog.returnValue ===
      "confirm"
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

      this.dispatchPreferenceFieldChange(
        pending.control
      );
    } else {
      this.restoreControlValue(
        pending.control,
        pending.previousValue
      );

      this.updateConsentIndicator(
        pending.control
      );
    }

    this.state.pendingConsent =
      null;
  },

  commitControlValue(
    control,
    value
  ) {
    if (
      control.type ===
      "radio"
    ) {
      const group =
        this.getRadioGroup(
          control
        );

      for (
        const candidate
        of group
      ) {
        candidate.dataset
          .previousValue =
          value;
      }

      return;
    }

    control.dataset
      .previousValue =
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
      control.type !==
      "radio"
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

    const requested =
      group.find(
        candidate =>
          candidate.value ===
          previousValue
      );

    const fallback =
      requested ||
      group.find(
        candidate =>
          candidate.value ===
          "default"
      ) ||
      group[0];

    for (
      const candidate
      of group
    ) {
      candidate.checked =
        candidate ===
        fallback;
    }
  },

  getRadioGroup(control) {
    if (
      !control?.name
    ) {
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
          control.type ===
            "radio" &&
          control.dataset.path ===
            path
      );
  },

  dispatchPreferenceFieldChange(
    control
  ) {
    window.dispatchEvent(
      new CustomEvent(
        "ari:preference-field-change",
        {
          detail: {
            category:
              control.dataset.category,

            key:
              control.dataset.key,

            path:
              control.dataset.path,

            value:
              control.value,

            controlType:
              control.dataset
                .controlType ||
              "unknown"
          }
        }
      )
    );
  },

  setPresetToCustom() {
    const preset =
      this.getElement(
        "preset"
      );

    if (
      !preset ||
      preset.value ===
      "custom"
    ) {
      return;
    }

    const hasCustom =
      Array.from(
        preset.options
      ).some(
        option =>
          option.value ===
          "custom"
      );

    if (hasCustom) {
      preset.value =
        "custom";
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
        this.getElement(
          "preset"
        )?.value ||
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

      const normalizedOverrides =
        validation.normalized ||
        {};

      this.assertRequiredConsent(
        normalizedOverrides
      );

      const result =
        await store.save(
          null,
          normalizedOverrides,
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
                this.getConsentEvidence(),

              source:
                this.source,

              controllerVersion:
                this.version
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
        control.type ===
          "radio" &&
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
              record:
                this.clone(
                  this.state.record
                ),

              source:
                this.source
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
     CONSENT VALIDATION
  ===================================================== */

  assertRequiredConsent(
    overrides = {}
  ) {
    const contract =
      this.requireContract();

    for (
      const [
        category,
        values
      ]
      of Object.entries(
        overrides
      )
    ) {
      for (
        const [
          key,
          value
        ]
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
        new Date()
          .toISOString(),

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
      evidence?.approved ===
        true &&
      evidence.value ===
        value
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
        typeof parsed ===
          "object" &&
        !Array.isArray(
          parsed
        )
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

  /* =====================================================
     UI STATE
  ===================================================== */

  setLoading(isLoading) {
    const loading =
      this.getElement(
        "loading"
      );

    const form =
      this.getElement(
        "form"
      );

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
      this.getElement(
        "save"
      );

    const reset =
      this.getElement(
        "reset"
      );

    const preset =
      this.getElement(
        "preset"
      );

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
      this.getElement(
        "status"
      );

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
     CONTROLLER STATE
  ===================================================== */

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

      primaryPreferences:
        this.getPrimaryPreferenceSummary(),

      consentEvidence:
        this.getConsentEvidence()
    };
  },

  /* =====================================================
     DEPENDENCIES
  ===================================================== */

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

    if (
      typeof contract
        .getUiSchema !==
        "function"
    ) {
      throw new Error(
        "AriUserPreferenceContract.getUiSchema is unavailable."
      );
    }

    if (
      typeof contract
        .validateOverrides !==
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
      window
        .AriUserPreferenceStore ||
      window.Ari
        ?.userPreferenceStore;

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
        "AriUserPreferenceStore does not expose the required read and save methods."
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

  /* =====================================================
     UTILITIES
  ===================================================== */

  getElement(key) {
    const selector =
      this.selectors[
        key
      ];

    return selector
      ? document.querySelector(
          selector
        )
      : null;
  },

  normalizeIdentifier(value) {
    return String(
      value || ""
    )
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      );
  },

  normalizePath(value) {
    return String(
      value || ""
    )
      .trim()
      .toLowerCase()
      .replace(
        /\s+/g,
        ""
      )
      .replace(
        /_/g,
        ""
      )
      .replace(
        /-/g,
        ""
      );
  },

  normalizeText(value) {
    return String(
      value || ""
    )
      .trim()
      .toLowerCase()
      .replace(
        /[_-]+/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      );
  },

  toSafeId(value) {
    return String(
      value || "preference"
    )
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
      "preference";
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
        JSON.stringify(
          value
        )
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