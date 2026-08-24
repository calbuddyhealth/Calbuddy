// =====================================================
// ARI REBIRTH
// File: ari/profile/ari-user-preference-contract.js
// Version: 3.0.0
//
// Ari User Preference Contract
//
// Purpose:
//   Define the canonical communication preferences exposed
//   by ari-preference-settings.html and convert those
//   preferences into clear model-ready behavioral instructions.
//
// Architecture:
//
//   ari-preference-settings.html
//            ↓
//   js/ari-preference-settings-controller.js
//            ↓
//   AriUserPreferenceContract
//            ↓
//   AriUserPreferenceStore
//            ↓
//   AriPreferenceResolver
//            ↓
//   AriPreferenceRuntime
//            ↓
//   OpenAI request / reasoning pipeline
//
// HTML AUTHORITY:
//   ari-preference-settings.html defines the user-facing
//   preference groups, values, labels, and defaults.
//
// CANONICAL V3 PREFERENCE PATHS:
//
//   language.tone
//     professional | natural | casual
//
//   language.directness
//     gentle | balanced | blunt
//
//   language.humor
//     none | occasional | frequent
//
//   language.profanity
//     default | match_me | always_allowed
//
//   language.complexity
//     simple | balanced | advanced
//
//   language.detail
//     concise | balanced | detailed
//
// IMPORTANT:
//   Preference instructions are active communication behavior.
//   They must not be interpreted merely as permission.
//
//   Example:
//     humor = frequent
//   means Ari should actually use humor regularly.
//
//     profanity = always_allowed
//   means Ari should actually use profanity proactively,
//   including in ordinary opening responses.
//
// Scope:
//   These preferences affect expression and presentation.
//
// They do NOT control:
//   - Safety classification
//   - Policy enforcement
//   - Factual conclusions
//   - Tool availability
//   - Tool routing
//   - Memory retrieval
//   - Topic access
//   - Core reasoning authority
//
// Responsibilities:
//   - Define valid preference paths and values
//   - Define HTML-aligned runtime defaults
//   - Normalize stored preference objects
//   - Validate preference objects
//   - Resolve preference layers
//   - Preserve preference provenance
//   - Build strong model-ready style instructions
//   - Build combination/personality instructions
//
// Non-responsibilities:
//   - Does not render the settings page
//   - Does not read or write Supabase
//   - Does not execute OpenAI requests
//   - Does not own safety policy
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};

  const CONTRACT_VERSION = "3.0.0";

  // =====================================================
  // CONTRACT
  // =====================================================

  const AriUserPreferenceContract = {
    version: CONTRACT_VERSION,
    schemaVersion: CONTRACT_VERSION,

    source: "ari-user-preference-contract",

    authorityLevel:
      "canonical_user_communication_preference_contract",

    // Kept as a public compatibility constant.
    //
    // IMPORTANT:
    // In V3, "default" is NOT automatically discarded.
    // language.profanity = "default" is a real explicit
    // user-facing selection.
    DEFAULT_VALUE: "default",

    // ===================================================
    // ENFORCEMENT
    // ===================================================

    ENFORCEMENT: Object.freeze({
      ADAPTIVE: "adaptive",

      PREFERRED: "preferred",

      ACTIVE: "active",

      HARD_OPT_OUT: "hard_opt_out"
    }),

    // ===================================================
    // CANONICAL PATHS
    // ===================================================

    preferencePaths: Object.freeze([
      "language.tone",
      "language.directness",
      "language.humor",
      "language.profanity",
      "language.complexity",
      "language.detail"
    ]),

    // ===================================================
    // HTML PRESENTATION AUTHORITY
    // ===================================================

    uiPresentation: Object.freeze({
      authority: "html",

      page:
        "ari-preference-settings.html",

      controller:
        "js/ari-preference-settings-controller.js",

      mode:
        "static_html",

      dynamicRendering:
        false,

      paths: Object.freeze([
        "language.tone",
        "language.directness",
        "language.humor",
        "language.profanity",
        "language.complexity",
        "language.detail"
      ])
    }),

    // ===================================================
    // PRESETS
    //
    // V3 intentionally keeps presets minimal.
    //
    // The HTML exposes individual selections rather than
    // preset personalities.
    // ===================================================

    presets: {
      default: {
        id: "default",

        label:
          "Automatic",

        description:
          "Lets Ari adapt conversation style automatically unless the user locks a specific setting.",

        overrides: {}
      },

      custom: {
        id: "custom",

        label:
          "Custom",

        description:
          "Uses the communication preferences explicitly selected by the user.",

        overrides: {}
      }
    },

    // ===================================================
    // CATEGORY DEFINITIONS
    // ===================================================

    categories: {
      language: {
        id: "language",

        label:
          "Ari Communication Style",

        description:
          "Controls how Ari speaks, explains information, uses humor, and uses profanity.",

        preferences: {
          // ===============================================
          // TONE
          // ===============================================

          tone: {
            key: "tone",

            path:
              "language.tone",

            label:
              "Tone",

            description:
              "Controls Ari's general speaking style.",

            defaultValue:
              "auto",

            options: {
              auto: {
                label:
                  "Auto",

                description:
                  "Let Ari learn automatically.",

                enforcement:
                  "adaptive",

                currentTurnAdjustable:
                  true,

                instruction:
                  "Leave response length adaptive so Ari can use current-turn instructions and learned conversation personalization."
              },

              never: {
                label:
                  "Never",

                description:
                  "Do not use profanity.",

                enforcement:
                  "hard_opt_out",

                currentTurnAdjustable:
                  false,

                instruction:
                  "Do not use profanity. This is an explicit user lock and should remain in effect unless the user changes the saved Conversation Style setting."
              },

              auto: {
                label:
                  "Auto",

                description:
                  "Let Ari learn automatically.",

                enforcement:
                  "adaptive",

                currentTurnAdjustable:
                  true,

                instruction:
                  "Leave explanation complexity adaptive so Ari can match the conversation and learned user preference."
              },

              auto: {
                label:
                  "Auto",

                description:
                  "Let Ari adapt automatically.",

                enforcement:
                  "adaptive",

                currentTurnAdjustable:
                  true,

                instruction:
                  "Use Ari’s standard adaptive language. Auto does not require profanity and does not prohibit it when ordinary context supports it."
              },

              auto: {
                label:
                  "Auto",

                description:
                  "Let Ari adapt automatically.",

                enforcement:
                  "adaptive",

                currentTurnAdjustable:
                  true,

                instruction:
                  "Use humor contextually when it naturally fits. Auto is not a fixed humor frequency and must not force jokes."
              },

              auto: {
                label:
                  "Auto",

                description:
                  "Let Ari learn automatically.",

                enforcement:
                  "adaptive",

                currentTurnAdjustable:
                  true,

                instruction:
                  "Leave directness adaptive so current-turn instructions and learned conversation personalization can determine how direct Ari should be."
              },

              auto: {
                label:
                  "Auto",

                description:
                  "Let Ari adapt automatically.",

                enforcement:
                  "adaptive",

                currentTurnAdjustable:
                  true,

                instruction:
                  "Adapt Ari’s tone to the current conversation and user context. Do not treat Auto as a fixed tone lock."
              },

              professional: {
                label:
                  "Professional",

                description:
                  "Polished and formal.",

                enforcement:
                  "preferred",

                instruction:
                  "Use a polished, professional speaking style. Keep wording composed, organized, and workplace-appropriate while remaining natural and helpful."
              },

              natural: {
                label:
                  "Natural",

                description:
                  "Clear and conversational.",

                enforcement:
                  "preferred",

                instruction:
                  "Use a natural conversational voice. Sound clear, approachable, human, and comfortable rather than formal or robotic."
              },

              casual: {
                label:
                  "Casual",

                description:
                  "Relaxed and informal.",

                enforcement:
                  "preferred",

                instruction:
                  "Use a relaxed, informal conversational voice. Prefer everyday wording, contractions, and a comfortable speaking rhythm rather than formal phrasing."
              }
            }
          },

          // ===============================================
          // DIRECTNESS
          // ===============================================

          directness: {
            key:
              "directness",

            path:
              "language.directness",

            label:
              "Directness",

            description:
              "Controls how directly Ari gets to the point.",

            defaultValue:
              "balanced",

            options: {
              gentle: {
                label:
                  "Gentle",

                description:
                  "Softer and more careful.",

                enforcement:
                  "preferred",

                instruction:
                  "Communicate conclusions gently and carefully. Preserve the substance of the answer while using softer wording around criticism, disagreement, or difficult information."
              },

              balanced: {
                label:
                  "Balanced",

                description:
                  "Clear without being harsh.",

                enforcement:
                  "preferred",

                instruction:
                  "Be clear and straightforward while maintaining appropriate sensitivity. Avoid both unnecessary harshness and unnecessary cushioning."
              },

              blunt: {
                label:
                  "Blunt",

                description:
                  "Straight to the point.",

                enforcement:
                  "active",

                instruction:
                  "Be blunt and straightforward. State the central answer clearly and early. Avoid unnecessary hedging, excessive cushioning, and avoidable sugarcoating."
              }
            }
          },

          // ===============================================
          // HUMOR
          // ===============================================

          humor: {
            key:
              "humor",

            path:
              "language.humor",

            label:
              "Humor",

            description:
              "Controls how often Ari actively uses humor.",

            defaultValue:
              "occasional",

            options: {
              none: {
                label:
                  "None",

                description:
                  "Keep responses serious.",

                enforcement:
                  "hard_opt_out",

                currentTurnAdjustable:
                  false,

                instruction:
                  "Do not use jokes, teasing, witty asides, comedic comparisons, playful jabs, or humorous commentary. Keep the response serious and straightforward."
              },

              occasional: {
                label:
                  "Occasional",

                description:
                  "Use humor sometimes.",

                enforcement:
                  "preferred",

                currentTurnAdjustable:
                  true,

                instruction:
                  "Use humor periodically in ordinary conversation. When a good opportunity appears, include a brief joke, witty observation, playful comparison, light teasing, or amusing aside. Do not require the user to initiate humor first."
              },

              frequent: {
                label:
                  "Frequent",

                description:
                  "Make humor an active part of Ari's personality.",

                enforcement:
                  "active",

                currentTurnAdjustable:
                  true,

                instruction:
                  "Make humor a recurring and clearly noticeable part of Ari's ordinary voice. Actively look for opportunities to joke, tease, use banter, make witty observations, create amusing comparisons, or poke fun at something relevant in the user's question or situation. Include humor regularly in ordinary responses. Do not wait for the user to joke first, and do not treat this preference merely as permission to be funny."
              }
            }
          },

          // ===============================================
          // PROFANITY
          // ===============================================

          profanity: {
            key:
              "profanity",

            path:
              "language.profanity",

            label:
              "Language",

            description:
              "Controls how Ari uses profanity as part of its conversational voice.",

            defaultValue:
              "default",

            options: {
              default: {
                label:
                  "Default",

                description:
                  "Use Ari's standard language.",

                enforcement:
                  "adaptive",

                currentTurnAdjustable:
                  true,

                instruction:
                  "Use Ari's standard conversational language style. This preference does not require proactive profanity and does not create a prohibition against ordinary expressive language."
              },

              match_me: {
                label:
                  "Match Me",

                description:
                  "Match the user's use of profanity.",

                enforcement:
                  "active",

                currentTurnAdjustable:
                  true,

                instruction:
                  "Match the user's profanity level as part of the conversation. When the user uses profanity casually, respond with a comparable level of profanity instead of sanitizing Ari's language. Maintain that matching style consistently while the user's tone continues."
              },

              always_allowed: {
                label:
                  "Always",

                description:
                  "Make profanity an active part of Ari's voice.",

                enforcement:
                  "active",

                currentTurnAdjustable:
                  true,

                instruction:
                  "The user explicitly selected profanity as part of Ari's normal speaking style. Use profanity actively and regularly throughout ordinary conversation. Use profanity in the opening response of ordinary conversations, including when the user has not sworn first. Do not wait for the user to initiate, request, or invite profanity. Do not sanitize ordinary responses into a neutral voice. Treat this as an active behavioral instruction, not merely permission to swear."
              }
            }
          },

          // ===============================================
          // EXPLANATION TYPE
          // ===============================================

          complexity: {
            key:
              "complexity",

            path:
              "language.complexity",

            label:
              "Explanation Type",

            description:
              "Controls how simple or advanced Ari's explanations are.",

            defaultValue:
              "balanced",

            options: {
              simple: {
                label:
                  "Simple",

                description:
                  "Use plain language and explain unfamiliar terms.",

                enforcement:
                  "active",

                instruction:
                  "Explain information in plain, easy-to-understand language. Prefer shorter sentences and familiar words. Explain unfamiliar, medical, technical, legal, scientific, or specialized terms when they are needed. Break complicated ideas into smaller steps and use concrete examples when useful. Preserve the important facts and accuracy; simplify the explanation without removing essential information."
              },

              balanced: {
                label:
                  "Balanced",

                description:
                  "Clear explanations with normal terminology.",

                enforcement:
                  "preferred",

                instruction:
                  "Use clear everyday language with normal terminology. Explain specialized terms when they are important to understanding, but do not over-explain familiar concepts."
              },

              advanced: {
                label:
                  "Advanced",

                description:
                  "Use more technical language with less basic explanation.",

                enforcement:
                  "preferred",

                instruction:
                  "Use more advanced and technical terminology where appropriate. Assume greater background knowledge and spend less time defining basic concepts unless clarification is necessary."
              }
            }
          },

          // ===============================================
          // RESPONSE LENGTH
          // ===============================================

          detail: {
            key:
              "detail",

            path:
              "language.detail",

            label:
              "Response Length",

            description:
              "Controls how much detail Ari usually provides.",

            defaultValue:
              "balanced",

            options: {
              concise: {
                label:
                  "Concise",

                description:
                  "Keep answers brief.",

                enforcement:
                  "preferred",

                instruction:
                  "Prefer concise answers. Give the central answer and the information needed to make it useful without unnecessary expansion."
              },

              balanced: {
                label:
                  "Balanced",

                description:
                  "Give enough useful detail.",

                enforcement:
                  "preferred",

                instruction:
                  "Use a balanced amount of detail. Provide enough explanation to make the answer useful and understandable without unnecessary length."
              },

              detailed: {
                label:
                  "Detailed",

                description:
                  "Explain more thoroughly.",

                enforcement:
                  "active",

                instruction:
                  "Provide thorough answers with relevant explanation, context, reasoning summaries, examples, distinctions, and practical details when they improve understanding."
              }
            }
          }
        }
      }
    },

    // ===================================================
    // RUNTIME DEFAULTS
    //
    // These exactly match the defaults declared in the
    // HTML using data-default="true".
    // ===================================================

    runtimeDefaults: {
      language: {
        tone:
          "auto",

        directness:
          "auto",

        humor:
          "auto",

        profanity:
          "auto",

        complexity:
          "auto",

        detail:
          "auto"
      }
    },

    // ===================================================
    // PUBLIC CONTRACT ACCESS
    // ===================================================

    getContract() {
      return {
        version:
          this.version,

        schemaVersion:
          this.schemaVersion,

        source:
          this.source,

        authorityLevel:
          this.authorityLevel,

        preferencePaths:
          this.clone(
            this.preferencePaths
          ),

        presets:
          this.clone(
            this.presets
          ),

        categories:
          this.clone(
            this.categories
          ),

        runtimeDefaults:
          this.clone(
            this.runtimeDefaults
          ),

        enforcementModes:
          this.clone(
            this.ENFORCEMENT
          ),

        uiPresentation:
          this.clone(
            this.uiPresentation
          )
      };
    },

    getUiSchema() {
      const preferences = [];

      for (
        const path
        of this.preferencePaths
      ) {
        const {
          category,
          key
        } = this.parsePath(path);

        const definition =
          this.getPreferenceDefinition(
            category,
            key
          );

        if (!definition) {
          continue;
        }

        preferences.push({
          category,
          key,
          path,

          label:
            definition.label,

          description:
            definition.description,

          defaultValue:
            definition.defaultValue,

          options:
            Object.entries(
              definition.options || {}
            ).map(
              ([value, option]) => ({
                value,

                label:
                  option.label ||
                  value,

                description:
                  option.description ||
                  "",

                enforcement:
                  option.enforcement ||
                  this.ENFORCEMENT
                    .ADAPTIVE,

                currentTurnAdjustable:
                  option.currentTurnAdjustable !==
                  false
              })
            )
        });
      }

      return {
        schemaVersion:
          this.schemaVersion,

        authority:
          "static_html",

        page:
          this.uiPresentation.page,

        controller:
          this.uiPresentation.controller,

        preferences
      };
    },

    getUiPresentation() {
      return this.clone(
        this.uiPresentation
      );
    },

    // Compatibility method.
    //
    // V3 no longer uses dynamic "primary" preference hosts.
    getPrimaryUiPresentations() {
      return {};
    },

    // Compatibility method.
    getPrimaryUiPresentation() {
      return null;
    },

    // Compatibility method.
    isPrimaryUiPreference() {
      return false;
    },

    // Compatibility method.
    getPrimaryUiOptions(
      category,
      key
    ) {
      const definition =
        this.getPreferenceDefinition(
          category,
          key
        );

      if (!definition) {
        return [];
      }

      return Object.entries(
        definition.options || {}
      ).map(
        ([value, option]) => ({
          value,

          label:
            option.label ||
            value,

          description:
            option.description ||
            "",

          enforcement:
            option.enforcement ||
            this.ENFORCEMENT
              .ADAPTIVE,

          currentTurnAdjustable:
            option.currentTurnAdjustable !==
            false
        })
      );
    },

    // Compatibility method.
    getAdvancedPromotedValues() {
      return [];
    },

    getRuntimeDefaults() {
      return this.clone(
        this.runtimeDefaults
      );
    },

    getPreset(
      presetId = "default"
    ) {
      const preset =
        this.presets[
          presetId
        ] ||
        this.presets.default;

      return this.clone(
        preset
      );
    },

    isValidPreset(
      presetId
    ) {
      return Boolean(
        presetId &&
        Object.prototype
          .hasOwnProperty.call(
            this.presets,
            presetId
          )
      );
    },

    getPreferenceDefinition(
      category,
      key
    ) {
      return (
        this.categories
          ?.[category]
          ?.preferences
          ?.[key] ||
        null
      );
    },

    getPreferenceDefinitionByPath(
      path
    ) {
      const {
        category,
        key
      } = this.parsePath(path);

      if (
        !category ||
        !key
      ) {
        return null;
      }

      return this.getPreferenceDefinition(
        category,
        key
      );
    },

    getPreferenceOption(
      category,
      key,
      value
    ) {
      return (
        this.getPreferenceDefinition(
          category,
          key
        )
          ?.options
          ?.[value] ||
        null
      );
    },

    getPreferenceOptionByPath(
      path,
      value
    ) {
      const {
        category,
        key
      } = this.parsePath(path);

      if (
        !category ||
        !key
      ) {
        return null;
      }

      return this.getPreferenceOption(
        category,
        key,
        value
      );
    },

    isValidPreferenceValue(
      category,
      key,
      value
    ) {
      const definition =
        this.getPreferenceDefinition(
          category,
          key
        );

      return Boolean(
        definition &&
        typeof value ===
          "string" &&
        Object.prototype
          .hasOwnProperty.call(
            definition.options || {},
            value
          )
      );
    },

    isValidPath(
      path
    ) {
      return (
        typeof path ===
          "string" &&
        this.preferencePaths
          .includes(path)
      );
    },

    getEnforcement(
      category,
      key,
      value
    ) {
      return (
        this.getPreferenceOption(
          category,
          key,
          value
        )?.enforcement ||
        this.ENFORCEMENT.ADAPTIVE
      );
    },

    isHardOptOut(
      category,
      key,
      value
    ) {
      return (
        this.getEnforcement(
          category,
          key,
          value
        ) ===
        this.ENFORCEMENT
          .HARD_OPT_OUT
      );
    },

    isCurrentTurnAdjustable(
      category,
      key,
      value
    ) {
      const option =
        this.getPreferenceOption(
          category,
          key,
          value
        );

      return (
        option?.currentTurnAdjustable !==
        false
      );
    },

    requiresConsent() {
      return false;
    },

    getConsentRequirement() {
      return {
        required:
          false,

        text:
          null,

        warningLevel:
          null
      };
    },

    // ===================================================
    // NORMALIZATION
    // ===================================================

    normalizeOverrides(
      input = {}
    ) {
      const normalized = {};
      const warnings = [];

      if (
        !this.isPlainObject(
          input
        )
      ) {
        return {
          ok:
            false,

          normalized:
            {},

          warnings: [
            "preference_overrides_not_object"
          ]
        };
      }

      for (
        const [
          categoryKey,
          categoryValue
        ]
        of Object.entries(
          input
        )
      ) {
        const categoryDefinition =
          this.categories[
            categoryKey
          ];

        if (
          !categoryDefinition
        ) {
          warnings.push(
            `unknown_preference_category:${categoryKey}`
          );

          continue;
        }

        if (
          !this.isPlainObject(
            categoryValue
          )
        ) {
          warnings.push(
            `preference_category_not_object:${categoryKey}`
          );

          continue;
        }

        for (
          const [
            preferenceKey,
            rawValue
          ]
          of Object.entries(
            categoryValue
          )
        ) {
          const definition =
            categoryDefinition
              .preferences
              ?.[preferenceKey];

          if (
            !definition
          ) {
            warnings.push(
              `unknown_preference_key:${categoryKey}.${preferenceKey}`
            );

            continue;
          }

          const value =
            typeof rawValue ===
              "string"
              ? rawValue.trim()
              : rawValue;

          if (
            !this.isValidPreferenceValue(
              categoryKey,
              preferenceKey,
              value
            )
          ) {
            warnings.push(
              `invalid_preference_value:${categoryKey}.${preferenceKey}:${String(value)}`
            );

            continue;
          }

          // V3 IMPORTANT:
          //
          // We intentionally DO NOT discard "default".
          //
          // language.profanity = "default"
          // is a valid explicit preference selected from the HTML.
          normalized[
            categoryKey
          ] =
            normalized[
              categoryKey
            ] || {};

          normalized[
            categoryKey
          ][
            preferenceKey
          ] =
            value;
        }
      }

      return {
        ok:
          true,

        normalized,

        warnings
      };
    },

    // ===================================================
    // VALIDATION
    // ===================================================

    validateOverrides(
      input = {}
    ) {
      const result =
        this.normalizeOverrides(
          input
        );

      const valid =
        result.ok ===
          true &&
        result.warnings
          .length === 0;

      return {
        ok:
          valid,

        valid,

        normalized:
          result.normalized,

        warnings:
          result.warnings,

        errors:
          valid
            ? []
            : [
                ...result.warnings
              ]
      };
    },

    // ===================================================
    // RESOLUTION
    // ===================================================

    resolvePreferences({
      activePreset = "default",

      persistentOverrides = {},

      conversationOverrides = {},

      currentTurnOverrides = {}
    } = {}) {
      const warnings = [];
      const provenance = {};

      const defaults =
        this.getRuntimeDefaults();

      const preset =
        this.getPreset(
          activePreset
        );

      const persistent =
        this.normalizeOverrides(
          persistentOverrides
        );

      const conversation =
        this.normalizeOverrides(
          conversationOverrides
        );

      const currentTurn =
        this.normalizeOverrides(
          currentTurnOverrides
        );

      warnings.push(
        ...persistent.warnings,
        ...conversation.warnings,
        ...currentTurn.warnings
      );

      let resolved =
        this.clone(
          defaults
        );

      this.recordLayerProvenance({
        layer:
          defaults,

        provenance,

        source:
          "runtime_default"
      });

      resolved =
        this.applyLayer({
          base:
            resolved,

          layer:
            preset.overrides ||
            {},

          provenance,

          source:
            `preset:${preset.id}`
        });

      resolved =
        this.applyLayer({
          base:
            resolved,

          layer:
            persistent.normalized,

          provenance,

          source:
            "persistent_user_preference"
        });

      resolved =
        this.applyLayer({
          base:
            resolved,

          layer:
            conversation.normalized,

          provenance,

          source:
            "conversation_override"
        });

      resolved =
        this.applyCurrentTurnLayer({
          base:
            resolved,

          layer:
            currentTurn.normalized,

          provenance,

          source:
            "current_turn_override"
        });

      const modelInstructions =
        this.buildModelInstructions(
          resolved,
          provenance
        );

      const instructionText =
        this.buildInstructionText(
          resolved,
          provenance
        );

      return {
        ok:
          true,

        success:
          true,

        ready:
          true,

        complete:
          true,

        version:
          this.version,

        schemaVersion:
          this.schemaVersion,

        source:
          this.source,

        activePreset:
          preset.id,

        resolvedPreferences:
          resolved,

        modelInstructions,

        instructionText,

        provenance,

        warnings,

        authority:
          "resolved_communication_style_only"
      };
    },

    // ===================================================
    // MODEL INSTRUCTIONS
    // ===================================================

    buildModelInstructions(
      resolvedPreferences = {},
      provenance = {}
    ) {
      const instructions = [];

      for (
        const path
        of this.preferencePaths
      ) {
        const {
          category,
          key
        } = this.parsePath(
          path
        );

        const value =
          resolvedPreferences
            ?.[category]
            ?.[key];

        if (
          typeof value !==
          "string"
        ) {
          continue;
        }

        const option =
          this.getPreferenceOption(
            category,
            key,
            value
          );

        if (
          !option ||
          typeof option.instruction !==
            "string" ||
          !option.instruction.trim()
        ) {
          continue;
        }

        instructions.push({
          category,

          key,

          path,

          value,

          source:
            provenance[path] ||
            "unknown",

          enforcement:
            option.enforcement ||
            this.ENFORCEMENT
              .ADAPTIVE,

          currentTurnAdjustable:
            option.currentTurnAdjustable !==
            false,

          instruction:
            option.instruction.trim()
        });
      }

      const combinationInstructions =
        this.buildCombinationInstructions(
          resolvedPreferences,
          provenance
        );

      instructions.push(
        ...combinationInstructions
      );

      return instructions;
    },

    // ===================================================
    // COMBINATION / PERSONALITY INSTRUCTIONS
    // ===================================================

    buildCombinationInstructions(
      resolvedPreferences = {},
      provenance = {}
    ) {
      const instructions = [];

      const language =
        resolvedPreferences
          ?.language ||
        {};

      // ===============================================
      // FREQUENT HUMOR + ALWAYS PROFANITY
      // ===============================================

      if (
        language.humor ===
          "frequent" &&
        language.profanity ===
          "always_allowed"
      ) {
        instructions.push({
          category:
            "combined_style",

          key:
            "humor_profanity_boost",

          path:
            "combined_style.humor_profanity_boost",

          value:
            "active",

          source:
            this.combineSources([
              provenance[
                "language.humor"
              ],

              provenance[
                "language.profanity"
              ]
            ]),

          enforcement:
            this.ENFORCEMENT
              .ACTIVE,

          currentTurnAdjustable:
            true,

          instruction:
            "The user intentionally selected both Frequent Humor and Always profanity. Give Ari a noticeably stronger personality. Combine proactive humor, banter, irreverent observations, playful commentary, and profanity as recurring parts of Ari's ordinary voice. Joke and swear without waiting for the user to establish that tone first. The selected personality should be clearly noticeable in Ari's responses rather than merely technically permitted."
        });
      }

      // ===============================================
      // DETAILED + SIMPLE
      //
      // Important accessibility combination.
      // Thorough does not have to mean complicated.
      // ===============================================

      if (
        language.detail ===
          "detailed" &&
        language.complexity ===
          "simple"
      ) {
        instructions.push({
          category:
            "combined_style",

          key:
            "detailed_simple_explanation",

          path:
            "combined_style.detailed_simple_explanation",

          value:
            "active",

          source:
            this.combineSources([
              provenance[
                "language.detail"
              ],

              provenance[
                "language.complexity"
              ]
            ]),

          enforcement:
            this.ENFORCEMENT
              .ACTIVE,

          currentTurnAdjustable:
            true,

          instruction:
            "Give thorough explanations while keeping the language easy to understand. Do not confuse detail with complexity. Break detailed information into clear pieces, explain unfamiliar terms, and preserve all important facts without relying on unnecessary jargon."
        });
      }

      // ===============================================
      // CASUAL + BLUNT
      // ===============================================

      if (
        language.tone ===
          "casual" &&
        language.directness ===
          "blunt"
      ) {
        instructions.push({
          category:
            "combined_style",

          key:
            "casual_blunt_delivery",

          path:
            "combined_style.casual_blunt_delivery",

          value:
            "active",

          source:
            this.combineSources([
              provenance[
                "language.tone"
              ],

              provenance[
                "language.directness"
              ]
            ]),

          enforcement:
            this.ENFORCEMENT
              .ACTIVE,

          currentTurnAdjustable:
            true,

          instruction:
            "Use an informal, straightforward delivery. Get to the point quickly and speak like a candid conversational partner rather than a formal assistant."
        });
      }

      return instructions;
    },

    // ===================================================
    // INSTRUCTION TEXT
    // ===================================================

    buildInstructionText(
      resolvedPreferences = {},
      provenance = {}
    ) {
      const instructions =
        this.buildModelInstructions(
          resolvedPreferences,
          provenance
        );

      if (
        !instructions.length
      ) {
        return "";
      }

      const hardOptOuts =
        instructions.filter(
          entry =>
            entry.enforcement ===
            this.ENFORCEMENT
              .HARD_OPT_OUT
        );

      const activeRequirements =
        instructions.filter(
          entry =>
            entry.enforcement ===
            this.ENFORCEMENT
              .ACTIVE
        );

      const preferredGuidance =
        instructions.filter(
          entry =>
            entry.enforcement ===
              this.ENFORCEMENT
                .PREFERRED ||
            entry.enforcement ===
              this.ENFORCEMENT
                .ADAPTIVE
        );

      const lines = [
        "ARI COMMUNICATION PREFERENCES",
        "",
        "The user explicitly selected how Ari should communicate.",
        "These preferences control expression and presentation. They do not change factual conclusions, reasoning authority, safety rules, tool permissions, memory permissions, or topic access.",
        "",
        "IMPORTANT EXECUTION RULE:",
        "Treat the selected communication preferences as behavioral instructions, not merely as permission.",
        "When a preference requests an active behavior, visibly perform that behavior in the response instead of falling back to a generic neutral assistant voice.",
        "",
        "Context may affect delivery only when the selected style would materially interfere with urgent clarity, immediate safety communication, acute distress, death or bereavement, or another unusually sensitive situation. Temporary restraint must not silently erase the user's selected style from ordinary conversation.",
        ""
      ];

      if (
        hardOptOuts.length
      ) {
        lines.push(
          "EXPLICIT STYLE RESTRICTIONS"
        );

        for (
          const entry
          of hardOptOuts
        ) {
          lines.push(
            `- ${entry.instruction}`
          );
        }

        lines.push("");
      }

      if (
        activeRequirements.length
      ) {
        lines.push(
          "ACTIVE STYLE REQUIREMENTS"
        );

        for (
          const entry
          of activeRequirements
        ) {
          lines.push(
            `- ${entry.instruction}`
          );
        }

        lines.push("");
      }

      if (
        preferredGuidance.length
      ) {
        lines.push(
          "COMMUNICATION STYLE GUIDANCE"
        );

        for (
          const entry
          of preferredGuidance
        ) {
          lines.push(
            `- ${entry.instruction}`
          );
        }
      }

      return lines
        .join("\n")
        .trim();
    },

    // ===================================================
    // LAYER APPLICATION
    // ===================================================

    applyLayer({
      base = {},
      layer = {},
      provenance = {},
      source = "unknown"
    } = {}) {
      const output =
        this.clone(
          base
        );

      if (
        !this.isPlainObject(
          layer
        )
      ) {
        return output;
      }

      for (
        const [
          categoryKey,
          categoryValue
        ]
        of Object.entries(
          layer
        )
      ) {
        if (
          !this.isPlainObject(
            categoryValue
          )
        ) {
          continue;
        }

        output[
          categoryKey
        ] =
          output[
            categoryKey
          ] || {};

        for (
          const [
            preferenceKey,
            value
          ]
          of Object.entries(
            categoryValue
          )
        ) {
          if (
            !this.isValidPreferenceValue(
              categoryKey,
              preferenceKey,
              value
            )
          ) {
            continue;
          }

          output[
            categoryKey
          ][
            preferenceKey
          ] =
            value;

          provenance[
            `${categoryKey}.${preferenceKey}`
          ] =
            source;
        }
      }

      return output;
    },

    // ===================================================
    // CURRENT TURN APPLICATION
    //
    // Honors explicit hard opt-outs that are marked
    // currentTurnAdjustable: false.
    // ===================================================

    applyCurrentTurnLayer({
      base = {},
      layer = {},
      provenance = {},
      source = "current_turn_override"
    } = {}) {
      const output =
        this.clone(
          base
        );

      if (
        !this.isPlainObject(
          layer
        )
      ) {
        return output;
      }

      for (
        const [
          categoryKey,
          categoryValue
        ]
        of Object.entries(
          layer
        )
      ) {
        if (
          !this.isPlainObject(
            categoryValue
          )
        ) {
          continue;
        }

        output[
          categoryKey
        ] =
          output[
            categoryKey
          ] || {};

        for (
          const [
            preferenceKey,
            value
          ]
          of Object.entries(
            categoryValue
          )
        ) {
          if (
            !this.isValidPreferenceValue(
              categoryKey,
              preferenceKey,
              value
            )
          ) {
            continue;
          }

          const currentValue =
            output
              ?.[categoryKey]
              ?.[preferenceKey];

          if (
            typeof currentValue ===
            "string"
          ) {
            const currentOption =
              this.getPreferenceOption(
                categoryKey,
                preferenceKey,
                currentValue
              );

            if (
              currentOption
                ?.currentTurnAdjustable ===
              false
            ) {
              continue;
            }
          }

          output[
            categoryKey
          ][
            preferenceKey
          ] =
            value;

          provenance[
            `${categoryKey}.${preferenceKey}`
          ] =
            source;
        }
      }

      return output;
    },

    // ===================================================
    // PROVENANCE
    // ===================================================

    recordLayerProvenance({
      layer = {},
      provenance = {},
      source = "unknown"
    } = {}) {
      if (
        !this.isPlainObject(
          layer
        ) ||
        !this.isPlainObject(
          provenance
        )
      ) {
        return provenance;
      }

      for (
        const [
          categoryKey,
          categoryValue
        ]
        of Object.entries(
          layer
        )
      ) {
        if (
          !this.isPlainObject(
            categoryValue
          )
        ) {
          continue;
        }

        for (
          const [
            preferenceKey,
            value
          ]
          of Object.entries(
            categoryValue
          )
        ) {
          if (
            !this.isValidPreferenceValue(
              categoryKey,
              preferenceKey,
              value
            )
          ) {
            continue;
          }

          provenance[
            `${categoryKey}.${preferenceKey}`
          ] =
            source;
        }
      }

      return provenance;
    },

    // ===================================================
    // OVERRIDE UTILITIES
    // ===================================================

    removePreferenceOverride(
      overrides = {},
      category,
      key
    ) {
      const next =
        this.clone(
          overrides
        ) || {};

      if (
        next?.[category] &&
        Object.prototype
          .hasOwnProperty.call(
            next[category],
            key
          )
      ) {
        delete next[
          category
        ][
          key
        ];

        if (
          Object.keys(
            next[
              category
            ]
          ).length === 0
        ) {
          delete next[
            category
          ];
        }
      }

      return next;
    },

    resetCategory(
      overrides = {},
      category
    ) {
      const next =
        this.clone(
          overrides
        ) || {};

      if (
        Object.prototype
          .hasOwnProperty.call(
            next,
            category
          )
      ) {
        delete next[
          category
        ];
      }

      return next;
    },

    resetAll() {
      return {};
    },

    // ===================================================
    // CONTRACT SELF-VALIDATION
    // ===================================================

    validate() {
      const errors = [];
      const warnings = [];

      // ===============================================
      // PATH DEFINITIONS
      // ===============================================

      for (
        const path
        of this.preferencePaths
      ) {
        const {
          category,
          key
        } = this.parsePath(
          path
        );

        const definition =
          this.getPreferenceDefinition(
            category,
            key
          );

        if (
          !definition
        ) {
          errors.push(
            `preference_definition_missing:${path}`
          );

          continue;
        }

        if (
          definition.path !==
          path
        ) {
          errors.push(
            `preference_path_mismatch:${path}:${definition.path}`
          );
        }

        if (
          !this.isPlainObject(
            definition.options
          )
        ) {
          errors.push(
            `preference_options_missing:${path}`
          );

          continue;
        }

        if (
          !this.isValidPreferenceValue(
            category,
            key,
            definition.defaultValue
          )
        ) {
          errors.push(
            `invalid_preference_default:${path}:${definition.defaultValue}`
          );
        }
      }

      // ===============================================
      // RUNTIME DEFAULTS
      // ===============================================

      for (
        const [
          categoryKey,
          categoryValue
        ]
        of Object.entries(
          this.runtimeDefaults
        )
      ) {
        for (
          const [
            preferenceKey,
            value
          ]
          of Object.entries(
            categoryValue ||
            {}
          )
        ) {
          if (
            !this.isValidPreferenceValue(
              categoryKey,
              preferenceKey,
              value
            )
          ) {
            errors.push(
              `invalid_runtime_default:${categoryKey}.${preferenceKey}:${value}`
            );
          }
        }
      }

      // ===============================================
      // HTML DEFAULT ALIGNMENT
      // ===============================================

      const expectedDefaults = {
        "language.tone":
          "natural",

        "language.directness":
          "balanced",

        "language.humor":
          "occasional",

        "language.profanity":
          "default",

        "language.complexity":
          "balanced",

        "language.detail":
          "balanced"
      };

      for (
        const [
          path,
          expectedValue
        ]
        of Object.entries(
          expectedDefaults
        )
      ) {
        const {
          category,
          key
        } = this.parsePath(
          path
        );

        const runtimeValue =
          this.runtimeDefaults
            ?.[category]
            ?.[key];

        if (
          runtimeValue !==
          expectedValue
        ) {
          errors.push(
            `html_runtime_default_mismatch:${path}:${runtimeValue}:${expectedValue}`
          );
        }
      }

      // ===============================================
      // REQUIRED ACTIVE PERSONALITY SETTINGS
      // ===============================================

      const frequentHumor =
        this.getPreferenceOption(
          "language",
          "humor",
          "frequent"
        );

      if (
        frequentHumor
          ?.enforcement !==
        this.ENFORCEMENT.ACTIVE
      ) {
        errors.push(
          "frequent_humor_not_active"
        );
      }

      const alwaysProfanity =
        this.getPreferenceOption(
          "language",
          "profanity",
          "always_allowed"
        );

      if (
        alwaysProfanity
          ?.enforcement !==
        this.ENFORCEMENT.ACTIVE
      ) {
        errors.push(
          "always_profanity_not_active"
        );
      }

      if (
        typeof alwaysProfanity
          ?.instruction ===
          "string" &&
        (
          alwaysProfanity
            .instruction
            .includes(
              "may use"
            ) ||
          alwaysProfanity
            .instruction
            .includes(
              "when it fits"
            )
        )
      ) {
        warnings.push(
          "always_profanity_contains_weak_permission_language"
        );
      }

      return {
        valid:
          errors.length ===
          0,

        ready:
          errors.length ===
          0,

        source:
          `${this.source}-validation`,

        version:
          this.version,

        errors,

        warnings,

        checks: {
          htmlIsUiAuthority:
            this.uiPresentation
              .authority ===
            "html",

          staticHtmlUi:
            this.uiPresentation
              .dynamicRendering ===
            false,

          sixCanonicalPreferences:
            this.preferencePaths
              .length ===
            6,

          defaultsMatchHtml:
            errors.some(
              error =>
                error.startsWith(
                  "html_runtime_default_mismatch:"
                )
            ) === false,

          frequentHumorIsActive:
            frequentHumor
              ?.enforcement ===
            this.ENFORCEMENT.ACTIVE,

          alwaysProfanityIsActive:
            alwaysProfanity
              ?.enforcement ===
            this.ENFORCEMENT.ACTIVE,

          profanityDefaultIsPersistable:
            this.isValidPreferenceValue(
              "language",
              "profanity",
              "default"
            ),

          styleDoesNotOwnSafety:
            true
        }
      };
    },

    // ===================================================
    // INTERNAL HELPERS
    // ===================================================

    parsePath(
      path
    ) {
      if (
        typeof path !==
        "string"
      ) {
        return {
          category:
            null,

          key:
            null
        };
      }

      const segments =
        path
          .split(".")
          .filter(Boolean);

      return {
        category:
          segments[0] ||
          null,

        key:
          segments[1] ||
          null
      };
    },

    combineSources(
      sources = []
    ) {
      const clean =
        Array.from(
          new Set(
            sources
              .filter(Boolean)
              .map(
                source =>
                  String(
                    source
                  )
              )
          )
        );

      if (
        !clean.length
      ) {
        return "combined";
      }

      return clean.join("+");
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

  window.AriUserPreferenceContract =
    AriUserPreferenceContract;

  window.Ari.userPreferenceContract =
    AriUserPreferenceContract;

  // =====================================================
  // SELF VALIDATION
  // =====================================================

  const validation =
    AriUserPreferenceContract
      .validate();

  console.log(
    "ARI USER PREFERENCE CONTRACT LOADED:",
    AriUserPreferenceContract.version,
    validation.ready === true
      ? "READY"
      : "INVALID",
    validation
  );
})();