// ari/profile/ari-preference-resolver.js
// Ari Preference Resolver
//
// Purpose:
// Resolve Ari's application-owned defaults, active preset, persistent user
// preference overrides, conversation-scoped overrides, current-turn overrides,
// and consent evidence into one canonical preference packet.
//
// V2.1.0 — Permissive Style / Restriction-Governor Alignment
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
//          ↓
// Canonical Preference Resolver
//          ↓
// Canonical Preference Packet
//          ↓
// Reasoning / Request Builder / Expression
//
// Restriction authority:
// - Emergency safety belongs to Ari Restriction Governor / Safety Gate.
// - Malicious or illegal operational assistance belongs to Ari Restriction
//   Governor / Misuse Gate.
// - Preference Resolver does not create response prohibitions.
//
// Responsibilities:
// - Require and use the canonical Ari User Preference Contract.
// - Read the active preset and persistent overrides from approved packets.
// - Read conversation-scoped and current-turn preference overrides.
// - Normalize and validate every preference layer.
// - Merge layers in authoritative precedence order.
// - Enforce contract-defined consent where genuinely required.
// - Produce model instructions and instruction text.
// - Preserve field-level provenance and diagnostics.
// - Preserve explicit false values.
// - Avoid mutating upstream packets.
//
// Non-responsibilities:
// - Does not infer persistent preferences from ordinary user language.
// - Does not decide whether a preference should be persisted.
// - Does not read or write Supabase.
// - Does not call OpenAI, tools, APIs, or external services.
// - Does not generate user-facing responses.
// - Does not enforce emergency safety.
// - Does not enforce cyber or illegal-operation restrictions.
// - Does not prohibit profanity, humor, sarcasm, banter, or creative language.
// - Does not mutate the canonical preference contract.

window.Ari = window.Ari || {};

window.AriPreferenceResolver = {
  version: "2.1.0",
  schemaVersion: "2.0.0",
  source: "ari-preference-resolver",
  schema: "ari_canonical_preference_packet",
  authorityLevel: "canonical_preference_resolution",

  resolve(input = {}) {
    const warnings = [];

    const summary =
      this.isPlainObject(input?.summary)
        ? input.summary
        : this.objectOrEmpty(input);

    const contract =
      this.requirePreferenceContract();

    const persistentResolution =
      this.resolvePersistentPreferenceRecord(
        summary
      );

    const conversationResolution =
      this.resolveConversationOverrides(
        summary
      );

    const currentTurnResolution =
      this.resolveCurrentTurnOverrides(
        summary
      );

    const consentResolution =
      this.resolveConsentEvidence(
        summary
      );

    const activePreset =
      this.resolveActivePreset({
        contract,
        summary,
        persistentRecord:
          persistentResolution.record,
        warnings
      });

    const preset =
      contract.getPreset(
        activePreset
      );

    const normalizedPreset =
      this.normalizeLayer({
        contract,
        value:
          preset?.overrides || {},
        source:
          `preset:${preset?.id || "default"}`,
        warnings
      });

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
        warnings
      });

    resolved =
      consentFiltered.resolvedPreferences;

    /*
     * No response-control, routing, planner, triage, or generic safety
     * packet may rewrite communication preferences here.
     *
     * Emergency and illegal-operation restrictions belong exclusively
     * to the Restriction Governor.
     */
    const restrictionContext =
      this.readRestrictionContext(
        summary
      );

    const modelInstructions =
      contract.buildModelInstructions(
        resolved
      );

    const instructionText =
      contract.buildInstructionText(
        resolved
      );

    const currentTurnOverrideApplied =
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

      schema:
        this.schema,

      schemaVersion:
        this.schemaVersion,

      source:
        this.source,

      version:
        this.version,

      authorityLevel:
        this.authorityLevel,

      activePreset:
        preset?.id || "default",

      preset: {
        id:
          preset?.id || "default",

        label:
          preset?.label ||
          "Ari Default",

        description:
          preset?.description ||
          null,

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
        source: null,
        applied: [],

        forceProfessionalTone:
          false,

        profanityProhibited:
          false,

        humorProhibited:
          false,

        sarcasmProhibited:
          false,

        banterProhibited:
          false,

        maximumVerbosity:
          null,

        minimumFormality:
          null,

        maximumHumor:
          null
      },

      restrictionContext:
        this.clone(
          restrictionContext
        ),

      resolution: {
        presetApplied,

        persistentPreferencesPresent,

        conversationOverridePresent:
          conversationOverrideApplied,

        currentTurnOverridePresent:
          currentTurnOverrideApplied,

        overrideApplied:
          conversationOverrideApplied ||
          currentTurnOverrideApplied,

        effectiveSource:
          currentTurnOverrideApplied
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
          null
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

        styleProhibitionPerformed:
          false,

        restrictionEnforcementPerformed:
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
            0
        },

        warningCount:
          warnings.length,

        warnings
      },

      authority: {
        restrictionGovernorIsBinding:
          true,

        safetyIsBinding:
          true,

        illegalOperationBoundaryIsBinding:
          true,

        responseConstraintsAreBinding:
          false,

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

        mayCreateStyleProhibitions:
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

  readRestrictionContext(summary = {}) {
    const governor =
      this.firstObject([
        summary.restrictionGovernor,
        summary.restrictionGovernorResult,
        summary.restrictionContext,
        summary.applicationRestriction
      ]);

    return {
      available:
        Boolean(
          governor &&
          Object.keys(governor).length
        ),

      mode:
        governor.mode ||
        "normal",

      normalResponseAllowed:
        governor.normalResponseAllowed !==
        false,

      emergencySafetyActive:
        governor.emergencySafetyActive ===
        true,

      maliciousOrIllegalOperationActive:
        governor
          .maliciousOrIllegalOperationActive ===
        true,

      authority:
        governor.authorityLevel ||
        governor.source ||
        null
    };
  },

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
        ] =
          "runtime_default";
      }
    }
  },

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

        const originalSource =
          provenance[path] ||
          null;

        const fallback =
          runtimeDefaults
            ?.[category]
            ?.[key];

        if (
          fallback !== undefined &&
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
            fallback ??
            null,

          source:
            originalSource,

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

    for (const evidence of directValues) {
      if (evidence === true) {
        return true;
      }

      if (
        typeof evidence === "string" &&
        (
          evidence === value ||
          evidence === "approved" ||
          evidence === "consented"
        )
      ) {
        return true;
      }

      if (
        this.isPlainObject(evidence) &&
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
        contract.version ||
        null;
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

      bindingStyleConstraintsSupported:
        false,

      restrictionGovernorSupported:
        true
    };
  },

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

  firstObject(values = []) {
    for (const value of values) {
      if (
        this.isPlainObject(value) &&
        Object.keys(value).length
      ) {
        return value;
      }
    }

    return {};
  },

  isPlainObject(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
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