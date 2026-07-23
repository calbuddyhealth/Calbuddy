// ari/profile/ari-preference-resolver.js
// Ari Preference Resolver
//
// Purpose:
// Resolve Ari's application-owned defaults, active preset, persistent user
// preference overrides, conversation-scoped overrides, current-turn overrides,
// consent evidence, and binding response constraints into one canonical
// preference packet.
//
// V2.0.0 — Canonical Contract-Native Preference Resolution
//
// Architectural flow:
//
// Ari User Preference Contract
//          +
// Preference Store Record
//          +
// Conversation Overrides
//          +
// Current-Turn Overrides
//          +
// Consent Evidence
//          +
// Binding Response Constraints
//          ↓
// Canonical Preference Resolver
//          ↓
// Canonical Preference Packet
//          ↓
// Reasoning / Request Builder / Expression
//
// Responsibilities:
// - Require and use the canonical Ari User Preference Contract.
// - Read the active preset and persistent overrides from approved packets.
// - Read conversation-scoped and current-turn preference overrides.
// - Normalize and validate every preference layer.
// - Merge layers in authoritative precedence order.
// - enforce consent for consent-required preference values.
// - Apply binding response constraints after advisory preference resolution.
// - Produce model instructions and instruction text.
// - Preserve field-level provenance and resolution diagnostics.
// - Preserve explicit false values in constraint and consent packets.
// - Avoid mutating any upstream packet.
//
// Non-responsibilities:
// - Does not infer preferences from ordinary user language.
// - Does not decide whether a preference should be persisted.
// - Does not read or write Supabase.
// - Does not call OpenAI, tools, APIs, or external services.
// - Does not generate user-facing responses.
// - Does not override safety.
// - Does not execute actions.
// - Does not mutate the canonical preference contract.

window.Ari = window.Ari || {};

window.AriPreferenceResolver = {
  version: "2.0.0",
  schemaVersion: "2.0.0",
  source: "ari-preference-resolver",
  schema: "ari_canonical_preference_packet",
  authorityLevel: "canonical_preference_resolution",

  /* =====================================================
     PUBLIC ENTRY POINTS
  ===================================================== */

  resolve(input = {}) {
    const warnings = [];
    const summary =
      this.isPlainObject(input?.summary)
        ? input.summary
        : this.objectOrEmpty(input);

    const contract =
      this.requirePreferenceContract();

    const persistentResolution =
      this.resolvePersistentPreferenceRecord(summary);

    const conversationResolution =
      this.resolveConversationOverrides(summary);

    const currentTurnResolution =
      this.resolveCurrentTurnOverrides(summary);

    const consentResolution =
      this.resolveConsentEvidence(summary);

    const constraintsResolution =
      this.resolveBindingConstraints(summary);

    const activePreset =
      this.resolveActivePreset({
        contract,
        summary,
        persistentRecord:
          persistentResolution.record,
        warnings
      });

    const preset =
      contract.getPreset(activePreset);

    const normalizedPersistent =
      this.normalizeLayer({
        contract,
        value:
          persistentResolution.record
            ?.preferenceOverrides ||
          persistentResolution.value ||
          {},
        source:
          persistentResolution.source ||
          "persistent_user_preference",
        warnings
      });

    const normalizedConversation =
      this.normalizeLayer({
        contract,
        value:
          conversationResolution.value,
        source:
          conversationResolution.source ||
          "conversation_override",
        warnings
      });

    const normalizedCurrentTurn =
      this.normalizeLayer({
        contract,
        value:
          currentTurnResolution.value,
        source:
          currentTurnResolution.source ||
          "current_turn_override",
        warnings
      });

    const normalizedPreset =
      this.normalizeLayer({
        contract,
        value:
          preset?.overrides || {},
        source:
          `preset:${preset?.id || "default"}`,
        warnings
      });

    const defaults =
      contract.getRuntimeDefaults();

    const provenance = {};
    let resolved =
      this.clone(defaults);

    this.seedDefaultProvenance({
      resolved,
      provenance
    });

    resolved =
      this.applyLayer({
        contract,
        base: resolved,
        layer:
          normalizedPreset.normalized,
        provenance,
        source:
          `preset:${preset?.id || "default"}`
      });

    resolved =
      this.applyLayer({
        contract,
        base: resolved,
        layer:
          normalizedPersistent.normalized,
        provenance,
        source:
          "persistent_user_preference"
      });

    resolved =
      this.applyLayer({
        contract,
        base: resolved,
        layer:
          normalizedConversation.normalized,
        provenance,
        source:
          "conversation_override"
      });

    resolved =
      this.applyLayer({
        contract,
        base: resolved,
        layer:
          normalizedCurrentTurn.normalized,
        provenance,
        source:
          "current_turn_override"
      });

    const consentFiltered =
      this.enforceConsent({
        contract,
        resolvedPreferences: resolved,
        provenance,
        consentEvidence:
          consentResolution.value,
        runtimeDefaults: defaults,
        presetOverrides:
          normalizedPreset.normalized,
        persistentOverrides:
          normalizedPersistent.normalized,
        conversationOverrides:
          normalizedConversation.normalized,
        currentTurnOverrides:
          normalizedCurrentTurn.normalized,
        warnings
      });

    resolved =
      consentFiltered.resolvedPreferences;

    const constrained =
      this.applyBindingConstraints({
        contract,
        resolvedPreferences: resolved,
        provenance,
        constraints:
          constraintsResolution.constraints,
        warnings
      });

    resolved =
      constrained.resolvedPreferences;

    const modelInstructions =
      contract.buildModelInstructions(
        resolved
      );

    const instructionText =
      contract.buildInstructionText(
        resolved
      );

    const overrideApplied =
      this.hasKeys(
        normalizedCurrentTurn.normalized
      );

    const conversationOverrideApplied =
      this.hasKeys(
        normalizedConversation.normalized
      );

    const persistentPreferencesPresent =
      this.hasKeys(
        normalizedPersistent.normalized
      );

    const presetApplied =
      Boolean(
        preset?.id &&
        preset.id !== "default"
      );

    return {
      ok: true,
      success: true,
      complete: true,
      ready: true,

      schema: this.schema,
      schemaVersion:
        this.schemaVersion,
      source: this.source,
      version: this.version,
      authorityLevel:
        this.authorityLevel,

      activePreset:
        preset?.id || "default",

      preset: {
        id:
          preset?.id || "default",
        label:
          preset?.label || "Ari Default",
        description:
          preset?.description || null,
        applied:
          presetApplied
      },

      layers: {
        runtimeDefaults:
          this.clone(defaults),

        presetOverrides:
          this.clone(
            normalizedPreset.normalized
          ),

        persistentOverrides:
          this.clone(
            normalizedPersistent.normalized
          ),

        conversationOverrides:
          this.clone(
            normalizedConversation.normalized
          ),

        currentTurnOverrides:
          this.clone(
            normalizedCurrentTurn.normalized
          )
      },

      resolvedPreferences:
        this.clone(resolved),

      modelInstructions:
        this.clone(
          modelInstructions
        ),

      instructionText,

      provenance:
        this.clone(provenance),

      consent: {
        evidenceSource:
          consentResolution.source,

        evidence:
          this.clone(
            consentResolution.value
          ),

        blockedPreferences:
          this.clone(
            consentFiltered
              .blockedPreferences
          ),

        consentRequiredCount:
          consentFiltered
            .consentRequiredCount,

        blockedCount:
          consentFiltered
            .blockedPreferences.length
      },

      constraints: {
        ...this.clone(
          constraintsResolution
            .constraints
        ),

        source:
          constraintsResolution.source,

        applied:
          constrained.appliedConstraints
      },

      resolution: {
        presetApplied,

        persistentPreferencesPresent,

        conversationOverridePresent:
          conversationOverrideApplied,

        currentTurnOverridePresent:
          overrideApplied,

        overrideApplied:
          conversationOverrideApplied ||
          overrideApplied,

        effectiveSource:
          overrideApplied
            ? "current_turn_override"
            : conversationOverrideApplied
              ? "conversation_override"
              : persistentPreferencesPresent
                ? "persistent_user_preference"
                : presetApplied
                  ? `preset:${preset.id}`
                  : "runtime_default",

        persistentSource:
          persistentResolution.source,

        conversationOverrideSource:
          conversationResolution.source,

        currentTurnOverrideSource:
          currentTurnResolution.source,

        consentSource:
          consentResolution.source,

        constraintsSource:
          constraintsResolution.source
      },

      diagnostics: {
        resolverRan: true,
        resolverReady: true,
        resolverVersion:
          this.version,
        resolverSource:
          this.source,

        contractVersion:
          contract.version || null,

        contractSchemaVersion:
          contract.schemaVersion || null,

        persistencePerformed:
          false,

        inferencePerformed:
          false,

        mutationPerformed:
          false,

        candidateCounts: {
          persistent:
            persistentResolution
              .candidateCount,

          conversation:
            conversationResolution
              .candidateCount,

          currentTurn:
            currentTurnResolution
              .candidateCount,

          consent:
            consentResolution
              .candidateCount,

          constraints:
            constraintsResolution
              .candidateCount
        },

        warningCount:
          warnings.length,

        warnings
      },

      authority: {
        safetyIsBinding:
          true,

        responseConstraintsAreBinding:
          true,

        persistentPreferencesAreAdvisory:
          true,

        presetPreferencesAreAdvisory:
          true,

        conversationOverridesAreAdvisory:
          true,

        currentTurnOverridesAreAdvisory:
          true,

        consentRequirementsAreBinding:
          true,

        currentTurnOverridesPersisted:
          false,

        conversationOverridesPersisted:
          false,

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

  resolvePersistentPreferenceRecord(
    summary = {}
  ) {
    const preferencePacket =
      this.objectOrEmpty(
        summary.preferenceStagePacket ||
        summary.preferencePacket ||
        summary.preferencesPacket
      );

    const profile =
      this.objectOrEmpty(
        summary.userProfile ||
        summary.profile
      );

    const memory =
      this.objectOrEmpty(
        summary.memoryStagePacket ||
        summary.memory ||
        summary.memoryContext
      );

    const candidates = [
      {
        source:
          "summary.preferenceStoreRecord",

        value:
          summary.preferenceStoreRecord
      },
      {
        source:
          "summary.userPreferenceRecord",

        value:
          summary.userPreferenceRecord
      },
      {
        source:
          "preferencePacket.storeRecord",

        value:
          preferencePacket.storeRecord
      },
      {
        source:
          "preferencePacket.preferenceRecord",

        value:
          preferencePacket.preferenceRecord
      },
      {
        source:
          "preferencePacket.record",

        value:
          preferencePacket.record
      },
      {
        source:
          "profile.preferenceRecord",

        value:
          profile.preferenceRecord
      },
      {
        source:
          "profile.userPreferenceRecord",

        value:
          profile.userPreferenceRecord
      },
      {
        source:
          "memory.preferenceRecord",

        value:
          memory.preferenceRecord
      },
      {
        source:
          "summary.preferenceOverrides",

        value: {
          preferenceOverrides:
            summary.preferenceOverrides,
          activePreset:
            summary.activePreset
        }
      },
      {
        source:
          "preferencePacket.preferenceOverrides",

        value: {
          preferenceOverrides:
            preferencePacket
              .preferenceOverrides,
          activePreset:
            preferencePacket
              .activePreset
        }
      }
    ];

    let candidateCount = 0;

    for (const candidate of candidates) {
      candidateCount += 1;

      if (
        !this.isPlainObject(
          candidate.value
        )
      ) {
        continue;
      }

      const record =
        this.normalizeStoreRecord(
          candidate.value
        );

      if (
        this.hasKeys(
          record.preferenceOverrides
        ) ||
        typeof record.activePreset ===
          "string"
      ) {
        return {
          source:
            candidate.source,
          record,
          value:
            record.preferenceOverrides,
          candidateCount
        };
      }
    }

    return {
      source: null,
      record: {
        activePreset:
          "default",
        preferenceOverrides:
          {},
        schemaVersion:
          null,
        revision:
          null,
        updatedAt:
          null
      },
      value: {},
      candidateCount
    };
  },

  resolveConversationOverrides(
    summary = {}
  ) {
    const conversation =
      this.objectOrEmpty(
        summary.conversation ||
        summary.conversationContext ||
        summary.threadContext
      );

    const preferencePacket =
      this.objectOrEmpty(
        summary.preferenceStagePacket ||
        summary.preferencePacket ||
        summary.preferencesPacket
      );

    return this.resolveMergedObject([
      {
        source:
          "conversation.preferenceOverrides",

        value:
          conversation
            .preferenceOverrides
      },
      {
        source:
          "conversation.userPreferenceOverrides",

        value:
          conversation
            .userPreferenceOverrides
      },
      {
        source:
          "summary.conversationPreferenceOverrides",

        value:
          summary
            .conversationPreferenceOverrides
      },
      {
        source:
          "preferencePacket.conversationOverrides",

        value:
          preferencePacket
            .conversationOverrides
      },
      {
        source:
          "preferencePacket.conversationPreferenceOverrides",

        value:
          preferencePacket
            .conversationPreferenceOverrides
      }
    ]);
  },

  resolveCurrentTurnOverrides(
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

    return this.resolveMergedObject([
      {
        source:
          "summary.currentTurnPreferenceOverrides",

        value:
          summary
            .currentTurnPreferenceOverrides
      },
      {
        source:
          "summary.preferenceOverridesForTurn",

        value:
          summary
            .preferenceOverridesForTurn
      },
      {
        source:
          "currentTurn.preferenceOverrides",

        value:
          currentTurn
            .preferenceOverrides
      },
      {
        source:
          "currentTurn.userPreferenceOverrides",

        value:
          currentTurn
            .userPreferenceOverrides
      },
      {
        source:
          "request.preferenceOverrides",

        value:
          request
            .preferenceOverrides
      },
      {
        source:
          "request.userPreferenceOverrides",

        value:
          request
            .userPreferenceOverrides
      },
      {
        source:
          "responseControl.preferenceOverrides",

        value:
          responseControl
            .preferenceOverrides
      },
      {
        source:
          "preferencePacket.currentTurnOverrides",

        value:
          preferencePacket
            .currentTurnOverrides
      },
      {
        source:
          "preferencePacket.currentTurnPreferenceOverrides",

        value:
          preferencePacket
            .currentTurnPreferenceOverrides
      }
    ]);
  },

  resolveConsentEvidence(
    summary = {}
  ) {
    const preferencePacket =
      this.objectOrEmpty(
        summary.preferenceStagePacket ||
        summary.preferencePacket ||
        summary.preferencesPacket
      );

    const profile =
      this.objectOrEmpty(
        summary.userProfile ||
        summary.profile
      );

    return this.resolveMergedObject([
      {
        source:
          "summary.preferenceConsent",

        value:
          summary.preferenceConsent
      },
      {
        source:
          "summary.preferenceConsentEvidence",

        value:
          summary
            .preferenceConsentEvidence
      },
      {
        source:
          "preferencePacket.consent",

        value:
          preferencePacket.consent
      },
      {
        source:
          "preferencePacket.consentEvidence",

        value:
          preferencePacket
            .consentEvidence
      },
      {
        source:
          "profile.preferenceConsent",

        value:
          profile.preferenceConsent
      }
    ]);
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

      sarcasmProhibited:
        this.readBoolean([
          responseControl
            .sarcasmProhibited,
          routing
            .sarcasmProhibited,
          safety
            .sarcasmProhibited
        ]),

      banterProhibited:
        this.readBoolean([
          responseControl
            .banterProhibited,
          routing
            .banterProhibited,
          safety
            .banterProhibited
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
        null,

      maximumHumor:
        this.firstNonEmptyString([
          responseControl
            .maximumHumor,
          routing
            .maximumHumor
        ]) ||
        null
    };

    return {
      constraints,
      source:
        this.hasMeaningfulConstraint(
          constraints
        )
          ? "binding_response_constraints"
          : null,
      candidateCount: 3
    };
  },

  resolveMergedObject(
    candidates = []
  ) {
    let candidateCount = 0;
    let merged = {};
    const sources = [];

    for (const candidate of candidates) {
      candidateCount += 1;

      if (
        !this.isPlainObject(
          candidate?.value
        ) ||
        !this.hasKeys(
          candidate.value
        )
      ) {
        continue;
      }

      merged =
        this.deepMerge(
          merged,
          candidate.value
        );

      if (candidate.source) {
        sources.push(
          candidate.source
        );
      }
    }

    return {
      source:
        sources.length
          ? sources.join(" + ")
          : null,
      value:
        merged,
      candidateCount
    };
  },

  /* =====================================================
     NORMALIZATION AND LAYERING
  ===================================================== */

  normalizeLayer({
    contract,
    value = {},
    source = "unknown",
    warnings = []
  } = {}) {
    const result =
      contract.normalizeOverrides(
        this.objectOrEmpty(value)
      );

    for (
      const warning
      of this.arrayOrEmpty(
        result?.warnings
      )
    ) {
      warnings.push(
        `${source}:${warning}`
      );
    }

    return {
      ok:
        result?.ok !== false,
      normalized:
        this.objectOrEmpty(
          result?.normalized
        ),
      warnings:
        this.arrayOrEmpty(
          result?.warnings
        )
    };
  },

  applyLayer({
    contract,
    base = {},
    layer = {},
    provenance = {},
    source = "unknown"
  } = {}) {
    const output =
      this.clone(base);

    for (
      const [category, values]
      of Object.entries(
        this.objectOrEmpty(layer)
      )
    ) {
      if (!this.isPlainObject(values)) {
        continue;
      }

      output[category] =
        this.objectOrEmpty(
          output[category]
        );

      for (
        const [key, value]
        of Object.entries(values)
      ) {
        if (
          !contract
            .isValidPreferenceValue(
              category,
              key,
              value
            ) ||
          value ===
            contract.DEFAULT_VALUE
        ) {
          continue;
        }

        output[category][key] =
          value;

        provenance[
          `${category}.${key}`
        ] = source;
      }
    }

    return output;
  },

  seedDefaultProvenance({
    resolved = {},
    provenance = {}
  } = {}) {
    for (
      const [category, values]
      of Object.entries(
        this.objectOrEmpty(
          resolved
        )
      )
    ) {
      for (
        const key
        of Object.keys(
          this.objectOrEmpty(
            values
          )
        )
      ) {
        provenance[
          `${category}.${key}`
        ] = "runtime_default";
      }
    }
  },

  /* =====================================================
     CONSENT ENFORCEMENT
  ===================================================== */

  enforceConsent({
    contract,
    resolvedPreferences = {},
    provenance = {},
    consentEvidence = {},
    runtimeDefaults = {},
    warnings = []
  } = {}) {
    const output =
      this.clone(
        resolvedPreferences
      );

    const blockedPreferences = [];
    let consentRequiredCount = 0;

    for (
      const [category, values]
      of Object.entries(
        this.objectOrEmpty(output)
      )
    ) {
      for (
        const [key, value]
        of Object.entries(
          this.objectOrEmpty(values)
        )
      ) {
        if (
          !contract.requiresConsent(
            category,
            key,
            value
          )
        ) {
          continue;
        }

        consentRequiredCount += 1;

        if (
          this.hasConsent({
            consentEvidence,
            category,
            key,
            value
          })
        ) {
          continue;
        }

        const path =
          `${category}.${key}`;

        const fallback =
          runtimeDefaults
            ?.[category]
            ?.[key];

        if (
          fallback &&
          contract
            .isValidPreferenceValue(
              category,
              key,
              fallback
            )
        ) {
          output[category][key] =
            fallback;

          provenance[path] =
            "runtime_default_due_to_missing_consent";
        } else {
          delete output[category][key];
          delete provenance[path];
        }

        blockedPreferences.push({
          path,
          category,
          key,
          requestedValue:
            value,
          fallbackValue:
            fallback || null,
          source:
            provenance[path] || null,
          reason:
            "explicit_consent_missing",
          requirement:
            contract.getConsentRequirement(
              category,
              key,
              value
            )
        });

        warnings.push(
          `consent_required:${path}:${value}`
        );
      }
    }

    return {
      resolvedPreferences:
        output,
      blockedPreferences,
      consentRequiredCount
    };
  },

  hasConsent({
    consentEvidence = {},
    category,
    key,
    value
  } = {}) {
    const path =
      `${category}.${key}`;

    const directValues = [
      consentEvidence?.[path],
      consentEvidence
        ?.[category]
        ?.[key],
      consentEvidence
        ?.preferences
        ?.[path],
      consentEvidence
        ?.preferences
        ?.[category]
        ?.[key]
    ];

    for (
      const evidence
      of directValues
    ) {
      if (
        evidence === true
      ) {
        return true;
      }

      if (
        typeof evidence ===
          "string" &&
        (
          evidence === value ||
          evidence === "approved" ||
          evidence === "consented"
        )
      ) {
        return true;
      }

      if (
        this.isPlainObject(
          evidence
        ) &&
        evidence.approved === true &&
        (
          !evidence.value ||
          evidence.value === value
        )
      ) {
        return true;
      }
    }

    const grants =
      this.arrayOrEmpty(
        consentEvidence.grants
      );

    return grants.some(
      grant =>
        this.isPlainObject(grant) &&
        grant.approved === true &&
        (
          grant.path === path ||
          (
            grant.category === category &&
            grant.key === key
          )
        ) &&
        (
          !grant.value ||
          grant.value === value
        )
    );
  },

  /* =====================================================
     BINDING CONSTRAINTS
  ===================================================== */

  applyBindingConstraints({
    contract,
    resolvedPreferences = {},
    provenance = {},
    constraints = {},
    warnings = []
  } = {}) {
    const output =
      this.clone(
        resolvedPreferences
      );

    const appliedConstraints = [];

    const setPreference = (
      category,
      key,
      value,
      constraint
    ) => {
      if (
        !contract
          .isValidPreferenceValue(
            category,
            key,
            value
          )
      ) {
        warnings.push(
          `invalid_constraint_value:${category}.${key}:${value}`
        );
        return;
      }

      output[category] =
        this.objectOrEmpty(
          output[category]
        );

      output[category][key] =
        value;

      provenance[
        `${category}.${key}`
      ] = "binding_constraint";

      appliedConstraints.push({
        constraint,
        path:
          `${category}.${key}`,
        value
      });
    };

    if (
      constraints
        .forceProfessionalTone ===
      true
    ) {
      setPreference(
        "communication",
        "formality",
        "professional",
        "forceProfessionalTone"
      );
    }

    if (
      constraints
        .profanityProhibited ===
      true
    ) {
      setPreference(
        "language",
        "profanity",
        "never",
        "profanityProhibited"
      );
    }

    if (
      constraints
        .humorProhibited ===
      true
    ) {
      setPreference(
        "language",
        "humor",
        "none",
        "humorProhibited"
      );
    }

    if (
      constraints
        .sarcasmProhibited ===
      true
    ) {
      setPreference(
        "language",
        "sarcasm",
        "none",
        "sarcasmProhibited"
      );
    }

    if (
      constraints
        .banterProhibited ===
      true
    ) {
      setPreference(
        "language",
        "banter",
        "none",
        "banterProhibited"
      );
    }

    if (
      constraints.maximumVerbosity
    ) {
      const current =
        output
          ?.response_structure
          ?.verbosity;

      const constrained =
        this.minByRank({
          current,
          boundary:
            constraints
              .maximumVerbosity,
          ranks: {
            concise: 1,
            moderate: 2,
            adaptive: 3,
            detailed: 4
          }
        });

      if (constrained) {
        setPreference(
          "response_structure",
          "verbosity",
          constrained,
          "maximumVerbosity"
        );
      }
    }

    if (
      constraints.minimumFormality
    ) {
      const normalizedMinimum =
        this.normalizeFormalityConstraint(
          constraints
            .minimumFormality
        );

      const current =
        output
          ?.communication
          ?.formality;

      const constrained =
        this.maxByRank({
          current,
          boundary:
            normalizedMinimum,
          ranks: {
            casual: 1,
            conversational: 2,
            technical: 3,
            professional: 4
          }
        });

      if (constrained) {
        setPreference(
          "communication",
          "formality",
          constrained,
          "minimumFormality"
        );
      }
    }

    if (
      constraints.maximumHumor
    ) {
      const current =
        output
          ?.language
          ?.humor;

      const constrained =
        this.minByRank({
          current,
          boundary:
            constraints
              .maximumHumor,
          ranks: {
            none: 0,
            occasional: 1,
            frequent: 2,
            edgy: 3
          }
        });

      if (constrained) {
        setPreference(
          "language",
          "humor",
          constrained,
          "maximumHumor"
        );
      }
    }

    return {
      resolvedPreferences:
        output,
      appliedConstraints
    };
  },

  normalizeFormalityConstraint(
    value
  ) {
    const normalized =
      String(value || "")
        .trim()
        .toLowerCase();

    const aliases = {
      low: "casual",
      medium: "conversational",
      high: "professional",
      very_high: "professional",
      formal: "professional"
    };

    return (
      aliases[normalized] ||
      normalized
    );
  },

  minByRank({
    current,
    boundary,
    ranks = {}
  } = {}) {
    if (!boundary) {
      return current || null;
    }

    if (!current) {
      return boundary;
    }

    const currentRank =
      ranks[current];

    const boundaryRank =
      ranks[boundary];

    if (
      currentRank === undefined ||
      boundaryRank === undefined
    ) {
      return boundary;
    }

    return currentRank <=
      boundaryRank
      ? current
      : boundary;
  },

  maxByRank({
    current,
    boundary,
    ranks = {}
  } = {}) {
    if (!boundary) {
      return current || null;
    }

    if (!current) {
      return boundary;
    }

    const currentRank =
      ranks[current];

    const boundaryRank =
      ranks[boundary];

    if (
      currentRank === undefined ||
      boundaryRank === undefined
    ) {
      return boundary;
    }

    return currentRank >=
      boundaryRank
      ? current
      : boundary;
  },

  /* =====================================================
     PRESET AND RECORD NORMALIZATION
  ===================================================== */

  resolveActivePreset({
    contract,
    summary = {},
    persistentRecord = {},
    warnings = []
  } = {}) {
    const requested =
      this.firstNonEmptyString([
        summary.activePreset,
        summary.preferencePreset,
        summary.preferenceStagePacket
          ?.activePreset,
        summary.preferencePacket
          ?.activePreset,
        persistentRecord
          ?.activePreset
      ]) ||
      "default";

    if (
      contract.isValidPreset(
        requested
      )
    ) {
      return requested;
    }

    warnings.push(
      `invalid_active_preset:${requested}`
    );

    return "default";
  },

  normalizeStoreRecord(
    value = {}
  ) {
    const record =
      this.objectOrEmpty(value);

    return {
      userId:
        record.userId ||
        record.user_id ||
        null,

      activePreset:
        record.activePreset ||
        record.active_preset ||
        null,

      preferenceOverrides:
        this.objectOrEmpty(
          record.preferenceOverrides ||
          record.preference_overrides ||
          record.userPreferences ||
          record.preferences
        ),

      schemaVersion:
        record.schemaVersion ||
        record.schema_version ||
        null,

      revision:
        Number.isFinite(
          Number(record.revision)
        )
          ? Number(record.revision)
          : null,

      updatedAt:
        record.updatedAt ||
        record.updated_at ||
        null
    };
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    let contractReady = false;
    let contractVersion = null;

    try {
      const contract =
        this.requirePreferenceContract();

      contractReady =
        typeof contract
          .normalizeOverrides ===
          "function" &&
        typeof contract
          .getRuntimeDefaults ===
          "function" &&
        typeof contract
          .getPreset ===
          "function" &&
        typeof contract
          .buildModelInstructions ===
          "function";

      contractVersion =
        contract.version || null;
    } catch {
      contractReady = false;
    }

    const structurallyValid =
      typeof this.resolve ===
        "function" &&
      typeof this.create ===
        "function" &&
      typeof this.applyLayer ===
        "function" &&
      typeof this.enforceConsent ===
        "function" &&
      typeof this.applyBindingConstraints ===
        "function";

    return {
      valid:
        structurallyValid &&
        contractReady,

      ready:
        structurallyValid &&
        contractReady,

      source:
        this.source,

      version:
        this.version,

      schema:
        this.schema,

      schemaVersion:
        this.schemaVersion,

      contractReady,

      contractVersion,

      persistenceSupported:
        false,

      inferenceSupported:
        false,

      presetSupported:
        true,

      persistentOverridesSupported:
        true,

      conversationOverridesSupported:
        true,

      currentTurnOverridesSupported:
        true,

      consentEnforcementSupported:
        true,

      bindingConstraintsSupported:
        true
    };
  },

  /* =====================================================
     CONTRACT ACCESS
  ===================================================== */

  getPreferenceContract() {
    return (
      window.AriUserPreferenceContract ||
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
        "AriUserPreferenceContract is not loaded."
      );
    }

    return contract;
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  isPlainObject(value) {
    return Boolean(
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
    );
  },

  hasKeys(value) {
    return (
      this.isPlainObject(value) &&
      Object.keys(value).length > 0
    );
  },

  objectOrEmpty(value) {
    return this.isPlainObject(value)
      ? value
      : {};
  },

  arrayOrEmpty(value) {
    return Array.isArray(value)
      ? value.filter(
          item =>
            item !== undefined &&
            item !== null
        )
      : [];
  },

  firstNonEmptyString(
    values = []
  ) {
    for (const value of values) {
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
    for (const value of values) {
      if (
        typeof value ===
          "boolean"
      ) {
        return value;
      }
    }

    return undefined;
  },

  deepMerge(
    base = {},
    override = {}
  ) {
    const output =
      this.clone(
        this.objectOrEmpty(base)
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
        this.isPlainObject(value) &&
        this.isPlainObject(
          output[key]
        )
      ) {
        output[key] =
          this.deepMerge(
            output[key],
            value
          );
      } else if (
        value !== undefined
      ) {
        output[key] =
          this.clone(value);
      }
    }

    return output;
  },

  clone(value) {
    if (value === undefined) {
      return undefined;
    }

    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch {
      return value;
    }
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
        .sarcasmProhibited ===
        true ||
      constraints
        .banterProhibited ===
        true ||
      constraints
        .maximumVerbosity ||
      constraints
        .minimumFormality ||
      constraints
        .maximumHumor
    );
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
