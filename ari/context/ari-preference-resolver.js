// ari/context/ari-preference-resolver.js
// Ari Preference Resolver
//
// Purpose:
// Resolve persistent user communication preferences and current-turn style
// overrides into one canonical preference packet for downstream reasoning,
// response planning, expression, composition, and delivery.
//
// V1.0.0 — Canonical Communication Preference Resolution
//
// Architectural flow:
//
// Persistent Preference Sources
//          +
// Current-Turn Style Override Sources
//          +
// Binding Response Constraints
//          ↓
// Canonical Preference Resolution
//          ↓
// userPreferences + responseStyle + diagnostics
//
// Responsibilities:
// - Read persistent communication preferences from approved upstream packets.
// - Read explicit current-turn response-style overrides.
// - Normalize supported preference fields.
// - Merge persistent preferences with current-turn overrides.
// - Preserve source and resolution diagnostics.
// - Produce one canonical packet for downstream stages.
// - Preserve explicit false values.
// - Keep safety and response constraints authoritative.
//
// Non-responsibilities:
// - Does not infer preferences from ordinary user language.
// - Does not decide whether a preference should be saved.
// - Does not persist, update, or delete preferences.
// - Does not call Supabase, tools, APIs, or OpenAI.
// - Does not generate user-facing language.
// - Does not override safety.
// - Does not execute actions.
// - Does not mutate upstream packets.

window.Ari = window.Ari || {};

window.AriPreferenceResolver = {
  version: "1.0.0",
  source: "ari-preference-resolver",

  schema:
    "ari_preference_resolution",

  schemaVersion:
    "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINTS
  ===================================================== */

  resolve(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const persistentResolution =
      this.resolvePersistentPreferences(
        summary
      );

    const overrideResolution =
      this.resolveCurrentTurnOverride(
        summary
      );

    const constraints =
      this.resolveBindingConstraints(
        summary
      );

    const userPreferences =
      this.normalizePreferences(
        persistentResolution.value
      );

    const currentTurnOverride =
      this.normalizePreferences(
        overrideResolution.value
      );

    const responseStyle =
      this.buildEffectiveResponseStyle({
        userPreferences,
        currentTurnOverride,
        constraints,
        persistentSource:
          persistentResolution.source,
        overrideSource:
          overrideResolution.source
      });

    const overrideApplied =
      this.hasKeys(
        currentTurnOverride
      );

    const persistentPreferencesPresent =
      this.hasKeys(
        userPreferences
      );

    return {
      schema:
        this.schema,

      schemaVersion:
        this.schemaVersion,

      ready:
        true,

      userPreferences,

      currentTurnOverride,

      responseStyle,

      resolution: {
        persistentPreferencesPresent,

        currentTurnOverridePresent:
          overrideApplied,

        overrideApplied,

        effectiveSource:
          overrideApplied
            ? "current_turn_override"
            : persistentPreferencesPresent
              ? "persistent_user_preference"
              : "default",

        persistentSource:
          persistentResolution.source,

        currentTurnOverrideSource:
          overrideResolution.source,

        constraintsSource:
          constraints.source,

        fieldSources:
          this.buildFieldSources({
            userPreferences,
            currentTurnOverride,
            constraints
          })
      },

      constraints,

      diagnostics: {
        resolverRan:
          true,

        resolverReady:
          true,

        resolverVersion:
          this.version,

        resolverSource:
          this.source,

        persistencePerformed:
          false,

        inferencePerformed:
          false,

        mutationPerformed:
          false,

        persistentCandidateCount:
          persistentResolution
            .candidateCount,

        overrideCandidateCount:
          overrideResolution
            .candidateCount,

        warningCount:
          0,

        warnings:
          []
      },

      authority: {
        safetyIsBinding:
          true,

        responseConstraintsAreBinding:
          true,

        currentTurnOverridesPersistent:
          true,

        persistentPreferencesAreAdvisory:
          true,

        currentTurnStyleIsAdvisory:
          true,

        mayPersist:
          false,

        mayInferPreferences:
          false,

        mayExecuteActions:
          false
      }
    };
  },

  create(input = {}) {
    return this.resolve(input);
  },

  /* =====================================================
     SOURCE RESOLUTION
  ===================================================== */

  resolvePersistentPreferences(
    summary = {}
  ) {
    const memory =
      this.objectOrEmpty(
        summary.memoryStagePacket ||
        summary.memory ||
        summary.memoryContext
      );

    const profile =
      this.objectOrEmpty(
        summary.userProfile ||
        summary.profile ||
        memory.userProfile ||
        memory.profile
      );

    const preferencePacket =
      this.objectOrEmpty(
        summary.preferenceStagePacket ||
        summary.preferencePacket ||
        summary.preferencesPacket
      );

    const candidates = [
      {
        source:
          "summary.userPreferences",

        value:
          summary.userPreferences
      },
      {
        source:
          "summary.communicationPreferences",

        value:
          summary.communicationPreferences
      },
      {
        source:
          "summary.stylePreferences",

        value:
          summary.stylePreferences
      },
      {
        source:
          "summary.conversation.userPreferences",

        value:
          summary.conversation
            ?.userPreferences
      },
      {
        source:
          "summary.responseControl.userPreferences",

        value:
          summary.responseControl
            ?.userPreferences
      },
      {
        source:
          "preferencePacket.userPreferences",

        value:
          preferencePacket
            .userPreferences
      },
      {
        source:
          "preferencePacket.communicationPreferences",

        value:
          preferencePacket
            .communicationPreferences
      },
      {
        source:
          "profile.communicationPreferences",

        value:
          profile
            .communicationPreferences
      },
      {
        source:
          "profile.userPreferences",

        value:
          profile
            .userPreferences
      },
      {
        source:
          "profile.preferences.communication",

        value:
          profile.preferences
            ?.communication
      },
      {
        source:
          "memory.userPreferences",

        value:
          memory.userPreferences
      },
      {
        source:
          "memory.communicationPreferences",

        value:
          memory.communicationPreferences
      },
      {
        source:
          "memory.stylePreferences",

        value:
          memory.stylePreferences
      },
      {
        source:
          "memory.preferences.communication",

        value:
          memory.preferences
            ?.communication
      },
      {
        source:
          "memory.preferences.style",

        value:
          memory.preferences
            ?.style
      }
    ];

    return this.resolveFirstObject(
      candidates
    );
  },

  resolveCurrentTurnOverride(
    summary = {}
  ) {
    const request =
      this.objectOrEmpty(
        summary.request ||
        summary.currentRequest
      );

    const currentTurn =
      this.objectOrEmpty(
        summary.currentTurn ||
        summary.turn
      );

    const responseControl =
      this.objectOrEmpty(
        summary.responseControl
      );

    const preferencePacket =
      this.objectOrEmpty(
        summary.preferenceStagePacket ||
        summary.preferencePacket ||
        summary.preferencesPacket
      );

    const candidates = [
      {
        source:
          "summary.responseStyle",

        value:
          summary.responseStyle
      },
      {
        source:
          "summary.styleOverride",

        value:
          summary.styleOverride
      },
      {
        source:
          "summary.currentTurnStyle",

        value:
          summary.currentTurnStyle
      },
      {
        source:
          "currentTurn.responseStyle",

        value:
          currentTurn.responseStyle
      },
      {
        source:
          "currentTurn.styleOverride",

        value:
          currentTurn.styleOverride
      },
      {
        source:
          "request.responseStyle",

        value:
          request.responseStyle
      },
      {
        source:
          "request.styleOverride",

        value:
          request.styleOverride
      },
      {
        source:
          "responseControl.responseStyle",

        value:
          responseControl.responseStyle
      },
      {
        source:
          "responseControl.styleOverride",

        value:
          responseControl.styleOverride
      },
      {
        source:
          "responseControl.styleOverrides",

        value:
          responseControl.styleOverrides
      },
      {
        source:
          "preferencePacket.currentTurnOverride",

        value:
          preferencePacket
            .currentTurnOverride
      },
      {
        source:
          "preferencePacket.responseStyle",

        value:
          preferencePacket
            .responseStyle
      }
    ];

    return this.resolveFirstObject(
      candidates
    );
  },

  resolveBindingConstraints(
    summary = {}
  ) {
    const responseControl =
      this.objectOrEmpty(
        summary.responseControl
      );

    const routing =
      this.objectOrEmpty(
        summary.routingContract ||
        summary.routing
      );

    const safety =
      this.objectOrEmpty(
        summary.safetyStagePacket ||
        summary.safety
      );

    const constraints = {
      forceProfessionalTone:
        this.readBoolean([
          responseControl
            .forceProfessionalTone,

          routing
            .forceProfessionalTone,

          safety
            .forceProfessionalTone
        ]),

      profanityProhibited:
        this.readBoolean([
          responseControl
            .profanityProhibited,

          responseControl
            .forbidProfanity,

          routing
            .profanityProhibited,

          safety
            .profanityProhibited
        ]),

      humorProhibited:
        this.readBoolean([
          responseControl
            .humorProhibited,

          responseControl
            .forbidHumor,

          routing
            .humorProhibited,

          safety
            .humorProhibited
        ]),

      maximumVerbosity:
        this.firstNonEmptyString([
          responseControl
            .maximumVerbosity,

          routing
            .maximumVerbosity
        ]) ||
        null,

      minimumFormality:
        this.firstNonEmptyString([
          responseControl
            .minimumFormality,

          routing
            .minimumFormality
        ]) ||
        null
    };

    return {
      ...constraints,

      source:
        this.hasMeaningfulConstraint(
          constraints
        )
          ? "binding_response_constraints"
          : null
    };
  },

  resolveFirstObject(
    candidates = []
  ) {
    let candidateCount = 0;

    for (
      const candidate
      of this.arrayOrEmpty(
        candidates
      )
    ) {
      candidateCount += 1;

      if (
        !candidate ||
        typeof candidate !==
          "object"
      ) {
        continue;
      }

      if (
        this.hasKeys(
          candidate.value
        )
      ) {
        return {
          source:
            candidate.source ||
            null,

          value:
            this.cloneObject(
              candidate.value
            ),

          candidateCount
        };
      }
    }

    return {
      source:
        null,

      value:
        {},

      candidateCount
    };
  },

  /* =====================================================
     NORMALIZATION
  ===================================================== */

  normalizePreferences(
    value = {}
  ) {
    if (
      !this.isPlainObject(
        value
      )
    ) {
      return {};
    }

    const profanity =
      this.objectOrEmpty(
        value.profanity
      );

    const profanityAllowed =
      this.readBoolean([
        value.profanityAllowed,
        value.allowProfanity,
        value.swearingAllowed,
        profanity.allowed
      ]);

    const profanityLevel =
      this.firstNonEmptyString([
        value.profanityLevel,
        value.swearingLevel,
        profanity.level,
        profanity.intensity
      ]) ||
      null;

    const normalized = {
      tone:
        this.firstNonEmptyString([
          value.tone,
          value.preferredTone
        ]) ||
        null,

      directness:
        this.firstNonEmptyString([
          value.directness,
          value.preferredDirectness
        ]) ||
        null,

      warmth:
        this.firstNonEmptyString([
          value.warmth,
          value.preferredWarmth
        ]) ||
        null,

      humor:
        this.firstNonEmptyString([
          value.humor,
          value.humorStyle
        ]) ||
        null,

      formality:
        this.firstNonEmptyString([
          value.formality,
          value.formalityLevel
        ]) ||
        null,

      verbosity:
        this.firstNonEmptyString([
          value.verbosity,
          value.responseLength,
          value.detailLevel
        ]) ||
        null,

      personality:
        this.firstNonEmptyString([
          value.personality,
          value.personalityStyle,
          value.energy
        ]) ||
        null,

      teachingStyle:
        this.firstNonEmptyString([
          value.teachingStyle,
          value.explanationStyle
        ]) ||
        null,

      encouragement:
        this.firstNonEmptyString([
          value.encouragement,
          value.encouragementLevel
        ]) ||
        null,

      profanity: {
        allowed:
          profanityAllowed,

        level:
          profanityLevel,

        useNaturally:
          this.readBoolean([
            profanity.useNaturally,
            value.useProfanityNaturally
          ])
      },

      profanityAllowed,
      profanityLevel
    };

    return this.removeEmptyValues(
      normalized
    );
  },

  buildEffectiveResponseStyle({
    userPreferences = {},
    currentTurnOverride = {},
    constraints = {},
    persistentSource = null,
    overrideSource = null
  } = {}) {
    const merged =
      this.deepMerge(
        userPreferences,
        currentTurnOverride
      );

    const constrained =
      this.applyBindingConstraints(
        merged,
        constraints
      );

    return this.removeEmptyValues({
      ...constrained,

      source:
        this.hasKeys(
          currentTurnOverride
        )
          ? "current_turn_override"
          : this.hasKeys(
              userPreferences
            )
            ? "persistent_user_preference"
            : "default",

      persistentSource,

      overrideSource,

      constraintSource:
        constraints.source ||
        null
    });
  },

  applyBindingConstraints(
    style = {},
    constraints = {}
  ) {
    const output =
      this.cloneObject(
        style
      );

    if (
      constraints
        .forceProfessionalTone ===
      true
    ) {
      output.tone =
        "professional";

      output.formality =
        this.maxFormality(
          output.formality,
          "high"
        );
    }

    if (
      constraints
        .profanityProhibited ===
      true
    ) {
      output.profanityAllowed =
        false;

      output.profanityLevel =
        "none";

      output.profanity = {
        ...this.objectOrEmpty(
          output.profanity
        ),

        allowed:
          false,

        level:
          "none",

        useNaturally:
          false
      };
    }

    if (
      constraints
        .humorProhibited ===
      true
    ) {
      output.humor =
        "none";
    }

    if (
      constraints.maximumVerbosity
    ) {
      output.verbosity =
        this.minVerbosity(
          output.verbosity,
          constraints
            .maximumVerbosity
        );
    }

    if (
      constraints.minimumFormality
    ) {
      output.formality =
        this.maxFormality(
          output.formality,
          constraints
            .minimumFormality
        );
    }

    return output;
  },

  buildFieldSources({
    userPreferences = {},
    currentTurnOverride = {},
    constraints = {}
  } = {}) {
    const fields = [
      "tone",
      "directness",
      "warmth",
      "humor",
      "formality",
      "verbosity",
      "personality",
      "teachingStyle",
      "encouragement",
      "profanityAllowed",
      "profanityLevel"
    ];

    const sources = {};

    for (const field of fields) {
      if (
        this.hasDefinedValue(
          currentTurnOverride[
            field
          ]
        )
      ) {
        sources[field] =
          "current_turn_override";

        continue;
      }

      if (
        this.hasDefinedValue(
          userPreferences[
            field
          ]
        )
      ) {
        sources[field] =
          "persistent_user_preference";

        continue;
      }

      sources[field] =
        "default";
    }

    if (
      constraints
        .forceProfessionalTone ===
      true
    ) {
      sources.tone =
        "binding_constraint";

      sources.formality =
        "binding_constraint";
    }

    if (
      constraints
        .profanityProhibited ===
      true
    ) {
      sources.profanityAllowed =
        "binding_constraint";

      sources.profanityLevel =
        "binding_constraint";
    }

    if (
      constraints
        .humorProhibited ===
      true
    ) {
      sources.humor =
        "binding_constraint";
    }

    if (
      constraints.maximumVerbosity
    ) {
      sources.verbosity =
        "binding_constraint";
    }

    if (
      constraints.minimumFormality
    ) {
      sources.formality =
        "binding_constraint";
    }

    return sources;
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const structurallyValid =
      typeof this.resolve ===
        "function" &&
      typeof this.create ===
        "function" &&
      typeof this.resolvePersistentPreferences ===
        "function" &&
      typeof this.resolveCurrentTurnOverride ===
        "function" &&
      typeof this.normalizePreferences ===
        "function" &&
      typeof this.buildEffectiveResponseStyle ===
        "function";

    return {
      valid:
        structurallyValid,

      ready:
        structurallyValid,

      source:
        this.source,

      version:
        this.version,

      schema:
        this.schema,

      schemaVersion:
        this.schemaVersion,

      persistenceSupported:
        false,

      inferenceSupported:
        false,

      currentTurnOverrideSupported:
        true,

      bindingConstraintsSupported:
        true
    };
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  isPlainObject(value) {
    return Boolean(
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
    );
  },

  hasKeys(value) {
    return (
      this.isPlainObject(
        value
      ) &&
      Object.keys(
        value
      ).length > 0
    );
  },

  hasDefinedValue(value) {
    return (
      value !==
        undefined &&
      value !==
        null &&
      value !==
        ""
    );
  },

  objectOrEmpty(value) {
    return this.isPlainObject(
      value
    )
      ? value
      : {};
  },

  arrayOrEmpty(value) {
    return Array.isArray(
      value
    )
      ? value.filter(
          item =>
            item !==
              undefined &&
            item !==
              null
        )
      : [];
  },

  firstNonEmptyString(
    values = []
  ) {
    for (
      const value of values
    ) {
      if (
        typeof value ===
          "string" &&
        value.trim()
      ) {
        return value.trim();
      }
    }

    return "";
  },

  readBoolean(
    values = []
  ) {
    for (
      const value of values
    ) {
      if (
        typeof value ===
          "boolean"
      ) {
        return value;
      }
    }

    return undefined;
  },

  cloneObject(value) {
    if (
      !this.isPlainObject(
        value
      )
    ) {
      return {};
    }

    try {
      return JSON.parse(
        JSON.stringify(
          value
        )
      );
    } catch {
      return {
        ...value
      };
    }
  },

  deepMerge(
    base = {},
    override = {}
  ) {
    const output =
      this.cloneObject(
        base
      );

    for (
      const [key, value]
      of Object.entries(
        this.objectOrEmpty(
          override
        )
      )
    ) {
      if (
        this.isPlainObject(
          value
        ) &&
        this.isPlainObject(
          output[key]
        )
      ) {
        output[key] =
          this.deepMerge(
            output[key],
            value
          );

        continue;
      }

      if (
        value !==
        undefined
      ) {
        output[key] =
          value;
      }
    }

    return output;
  },

  removeEmptyValues(value) {
    if (Array.isArray(value)) {
      return value
        .map(item =>
          this.removeEmptyValues(
            item
          )
        )
        .filter(
          item =>
            item !==
              undefined &&
            item !==
              null &&
            item !==
              ""
        );
    }

    if (
      !this.isPlainObject(
        value
      )
    ) {
      return value;
    }

    const output = {};

    for (
      const [key, currentValue]
      of Object.entries(
        value
      )
    ) {
      if (
        currentValue ===
          undefined ||
        currentValue ===
          null ||
        currentValue ===
          ""
      ) {
        continue;
      }

      const normalized =
        this.removeEmptyValues(
          currentValue
        );

      if (
        this.isPlainObject(
          normalized
        ) &&
        !Object.keys(
          normalized
        ).length
      ) {
        continue;
      }

      output[key] =
        normalized;
    }

    return output;
  },

  hasMeaningfulConstraint(
    constraints = {}
  ) {
    return Boolean(
      constraints
        .forceProfessionalTone ===
        true ||
      constraints
        .profanityProhibited ===
        true ||
      constraints
        .humorProhibited ===
        true ||
      constraints
        .maximumVerbosity ||
      constraints
        .minimumFormality
    );
  },

  maxFormality(
    current,
    minimum
  ) {
    const ranks = {
      none: 0,
      very_low: 1,
      low: 2,
      medium: 3,
      high: 4,
      very_high: 5,
      professional: 5
    };

    const currentKey =
      typeof current ===
        "string"
        ? current
            .trim()
            .toLowerCase()
        : "";

    const minimumKey =
      typeof minimum ===
        "string"
        ? minimum
            .trim()
            .toLowerCase()
        : "";

    if (
      !currentKey
    ) {
      return minimum ||
        current ||
        null;
    }

    if (
      !minimumKey
    ) {
      return current;
    }

    const currentRank =
      ranks[currentKey] ??
      0;

    const minimumRank =
      ranks[minimumKey] ??
      0;

    return currentRank >=
      minimumRank
      ? current
      : minimum;
  },

  minVerbosity(
    current,
    maximum
  ) {
    const ranks = {
      minimal: 1,
      short: 2,
      concise: 2,
      medium: 3,
      detailed: 4,
      long: 5,
      exhaustive: 6
    };

    const currentKey =
      typeof current ===
        "string"
        ? current
            .trim()
            .toLowerCase()
        : "";

    const maximumKey =
      typeof maximum ===
        "string"
        ? maximum
            .trim()
            .toLowerCase()
        : "";

    if (
      !currentKey
    ) {
      return maximum ||
        current ||
        null;
    }

    if (
      !maximumKey
    ) {
      return current;
    }

    const currentRank =
      ranks[currentKey] ??
      3;

    const maximumRank =
      ranks[maximumKey] ??
      3;

    return currentRank <=
      maximumRank
      ? current
      : maximum;
  }
};

window.Ari.preferenceResolver =
  window.AriPreferenceResolver;

console.log(
  "ARI PREFERENCE RESOLVER LOADED:",
  window.AriPreferenceResolver
    ?.version,

  window.AriPreferenceResolver
    ?.validate?.()
);
