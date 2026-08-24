// =====================================================
// ARI REBIRTH
// File: ari/profile/ari-preference-resolver.js
// Version: 3.0.0
//
// Ari Preference Resolver
//
// Purpose:
//   Resolve Ari's canonical V3 communication preferences
//   into one runtime-ready preference packet.
//
// Architecture:
//
//   AriUserPreferenceContract V3
//            +
//   AriUserPreferenceStore V3 record
//            +
//   Conversation overrides
//            +
//   Current-turn overrides
//            ↓
//   AriPreferenceResolver V3
//            ↓
//   Canonical Preference Packet
//            ↓
//   AriPreferenceRuntime
//            ↓
//   Reasoning / OpenAI request builder
//
// CANONICAL PRECEDENCE:
//
//   1. Contract runtime defaults
//   2. Active preset
//   3. Persistent user preferences
//   4. Conversation-scoped overrides
//   5. Current-turn overrides
//
// The contract owns the actual merge semantics.
//
// IMPORTANT V3 BEHAVIOR:
//
//   - "default" is a legitimate preference value.
//   - language.profanity = "default" must survive resolution.
//   - Frequent humor is an ACTIVE behavior.
//   - Always profanity is an ACTIVE behavior.
//   - Combined personality instructions must survive intact.
//   - Preference instructions are not merely permissions.
//   - Preference instructions are authoritative inside their
//     communication-style scope.
//
// Restriction authority:
//   Safety and misuse restrictions remain outside this resolver.
//
// Responsibilities:
//   - Require AriUserPreferenceContract V3.
//   - Locate approved persistent preference data.
//   - Locate conversation-scoped preference overrides.
//   - Locate current-turn preference overrides.
//   - Normalize preference layers.
//   - Resolve active preset.
//   - Delegate canonical precedence/behavior to the contract.
//   - Preserve field-level provenance.
//   - Preserve model-ready instructions.
//   - Preserve restriction context for downstream consumers.
//   - Expose diagnostics.
//
// Non-responsibilities:
//   - Does not read Supabase directly.
//   - Does not write Supabase.
//   - Does not infer preferences from natural language.
//   - Does not generate final user-facing responses.
//   - Does not own safety classification.
//   - Does not own tool permissions.
//   - Does not own topic restrictions.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};

  const RESOLVER_VERSION = "3.0.0";
  const SCHEMA_VERSION = "3.0.0";
  const REQUIRED_CONTRACT_VERSION = "3.0.0";

  const AriPreferenceResolver = {
    version: RESOLVER_VERSION,

    schemaVersion: SCHEMA_VERSION,

    requiredContractVersion:
      REQUIRED_CONTRACT_VERSION,

    source:
      "ari-preference-resolver",

    schema:
      "ari_canonical_preference_packet",

    authorityLevel:
      "canonical_preference_resolution",

    // ===================================================
    // MAIN RESOLUTION
    // ===================================================

    resolve(input = {}) {
      const warnings = [];

      try {
        const summary =
          this.isPlainObject(
            input?.summary
          )
            ? input.summary
            : this.objectOrEmpty(
                input
              );

        const contract =
          this.requirePreferenceContract();

        // ===============================================
        // LOCATE INPUT LAYERS
        // ===============================================

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

        const activePreset =
          this.resolveActivePreset({
            contract,

            summary,

            persistentRecord:
              persistentResolution.record,

            warnings
          });

        // ===============================================
        // NORMALIZE LAYERS
        // ===============================================

        const normalizedPersistent =
          this.normalizeLayer({
            contract,

            value:
              activePreset === "default"
                ? {}
                : (
                    persistentResolution
                      .record
                      ?.preferenceOverrides ||
                    persistentResolution.value ||
                    {}
                  ),

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

        // ===============================================
        // CANONICAL CONTRACT RESOLUTION
        //
        // Contract V3 owns:
        //
        // defaults
        //   ↓
        // preset
        //   ↓
        // persistent
        //   ↓
        // conversation
        //   ↓
        // current turn
        //
        // It also owns:
        // - current-turn adjustability
        // - active instruction construction
        // - personality combination instructions
        // ===============================================

        const contractResolution =
          contract.resolvePreferences({
            activePreset,

            persistentOverrides:
              normalizedPersistent.normalized,

            conversationOverrides:
              normalizedConversation.normalized,

            currentTurnOverrides:
              normalizedCurrentTurn.normalized
          });

        if (
          !contractResolution ||
          contractResolution.ok !== true ||
          contractResolution.ready !== true
        ) {
          throw new Error(
            "AriUserPreferenceContract failed to resolve the preference packet."
          );
        }

        warnings.push(
          ...this.arrayOrEmpty(
            contractResolution.warnings
          )
        );

        const resolvedPreferences =
          this.clone(
            contractResolution
              .resolvedPreferences ||
            {}
          );

        const provenance =
          this.clone(
            contractResolution
              .provenance ||
            {}
          );

        const modelInstructions =
          this.clone(
            contractResolution
              .modelInstructions ||
            []
          );

        const instructionText =
          typeof contractResolution
            .instructionText ===
            "string"
            ? contractResolution
                .instructionText
            : "";

        // ===============================================
        // INFORMATIONAL RESTRICTION CONTEXT
        //
        // This does not rewrite the communication
        // preferences. It is preserved for downstream
        // architecture only.
        // ===============================================

        const restrictionContext =
          this.readRestrictionContext(
            summary
          );

        // ===============================================
        // RESOLUTION FLAGS
        // ===============================================

        const persistentPreferencesPresent =
          this.hasPreferenceValues(
            normalizedPersistent.normalized,
            contract
          );

        const conversationOverrideApplied =
          this.hasPreferenceValues(
            normalizedConversation.normalized,
            contract
          );

        const currentTurnOverrideApplied =
          this.hasPreferenceValues(
            normalizedCurrentTurn.normalized,
            contract
          );

        const presetApplied =
          activePreset !==
            "default";

        const activeInstructionCount =
          modelInstructions.filter(
            instruction =>
              instruction
                ?.enforcement ===
              contract.ENFORCEMENT
                ?.ACTIVE
          ).length;

        const hardOptOutCount =
          modelInstructions.filter(
            instruction =>
              instruction
                ?.enforcement ===
              contract.ENFORCEMENT
                ?.HARD_OPT_OUT
          ).length;

        // ===============================================
        // OUTPUT
        // ===============================================

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

          // =============================================
          // PRESET
          // =============================================

          activePreset,

          preset: {
            id:
              activePreset,

            label:
              contract
                .getPreset(
                  activePreset
                )
                ?.label ||
              "Ari Default",

            description:
              contract
                .getPreset(
                  activePreset
                )
                ?.description ||
              null,

            applied:
              presetApplied
          },

          // =============================================
          // INPUT LAYERS
          // =============================================

          layers: {
            runtimeDefaults:
              contract.getRuntimeDefaults(),

            persistentOverrides:
              this.clone(
                normalizedPersistent
                  .normalized
              ),

            conversationOverrides:
              this.clone(
                normalizedConversation
                  .normalized
              ),

            currentTurnOverrides:
              this.clone(
                normalizedCurrentTurn
                  .normalized
              )
          },

          // =============================================
          // FINAL PREFERENCES
          // =============================================

          resolvedPreferences,

          // =============================================
          // OPENAI / MODEL COMMUNICATION INSTRUCTIONS
          // =============================================

          modelInstructions,

          instructionText,

          provenance,

          // =============================================
          // V3 STYLE EXECUTION METADATA
          //
          // These fields explicitly communicate that
          // selected style behavior should be executed,
          // not merely permitted.
          // =============================================

          styleExecution: {
            active:
              true,

            instructionMode:
              "behavioral",

            preferencesArePermissionsOnly:
              false,

            selectedStyleMustBeObservable:
              true,

            neutralFallbackDiscouraged:
              true,

            activeInstructionCount,

            hardOptOutCount,

            frequentHumorActive:
              resolvedPreferences
                ?.language
                ?.humor ===
              "frequent",

            alwaysProfanityActive:
              resolvedPreferences
                ?.language
                ?.profanity ===
              "always_allowed",

            humorProfanityPersonalityBoostActive:
              resolvedPreferences
                ?.language
                ?.humor ===
                "frequent" &&
              resolvedPreferences
                ?.language
                ?.profanity ===
                "always_allowed"
          },

          // =============================================
          // LEGACY-COMPATIBLE CONSENT SHAPE
          //
          // V3 currently exposes no persistent preference
          // requiring separate consent.
          // =============================================

          consent: {
            evidenceSource:
              null,

            evidence:
              {},

            blockedPreferences:
              [],

            consentRequiredCount:
              0,

            blockedCount:
              0
          },

          // =============================================
          // LEGACY-COMPATIBLE CONSTRAINT SHAPE
          //
          // This resolver intentionally creates no
          // communication constraints beyond explicit
          // user preferences defined by the contract.
          // =============================================

          constraints: {
            source:
              null,

            applied:
              [],

            forceProfessionalTone:
              false,

            profanityProhibited:
              false,

            humorProhibited:
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

          // =============================================
          // RESOLUTION SUMMARY
          // =============================================

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
                      ? `preset:${activePreset}`
                      : "runtime_default",

            persistentSource:
              persistentResolution.source,

            conversationOverrideSource:
              conversationResolution.source,

            currentTurnOverrideSource:
              currentTurnResolution.source,

            contractSource:
              contractResolution.source ||
              contract.source ||
              null
          },

          // =============================================
          // DIAGNOSTICS
          // =============================================

          diagnostics: {
            resolverRan:
              true,

            resolverReady:
              true,

            resolverVersion:
              this.version,

            resolverSchemaVersion:
              this.schemaVersion,

            resolverSource:
              this.source,

            contractVersion:
              contract.version ||
              null,

            contractSchemaVersion:
              contract.schemaVersion ||
              null,

            contractCompatible:
              String(
                contract.schemaVersion ||
                contract.version ||
                ""
              ) ===
              this.requiredContractVersion,

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

            modelInstructionCount:
              modelInstructions.length,

            activeInstructionCount,

            candidateCounts: {
              persistent:
                persistentResolution
                  .candidateCount,

              conversation:
                conversationResolution
                  .candidateCount,

              currentTurn:
                currentTurnResolution
                  .candidateCount
            },

            warningCount:
              warnings.length,

            warnings:
              this.clone(
                warnings
              )
          },

          // =============================================
          // AUTHORITY
          // =============================================

          authority: {
            restrictionGovernorIsBinding:
              true,

            safetyIsBinding:
              true,

            illegalOperationBoundaryIsBinding:
              true,

            communicationPreferencesAreBindingWithinStyleScope:
              true,

            persistentPreferencesAreAdvisory:
              false,

            conversationOverridesAreAdvisory:
              false,

            currentTurnOverridesAreAdvisory:
              false,

            selectedCommunicationBehaviorShouldBeExecuted:
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
      } catch (error) {
        return this.failureResult(
          error,
          warnings
        );
      }
    },

    create(input = {}) {
      return this.resolve(
        input
      );
    },

    // ===================================================
    // PERSISTENT PREFERENCE RECORD DISCOVERY
    // ===================================================

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
            "summary.preferenceStoreResult",

          value:
            summary.preferenceStoreResult
        },

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
            "preferencePacket.storeResult",

          value:
            preferencePacket.storeResult
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

      for (
        const candidate
        of candidates
      ) {
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
        source:
          null,

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

        value:
          {},

        candidateCount
      };
    },

    // ===================================================
    // CONVERSATION OVERRIDES
    // ===================================================

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

    // ===================================================
    // CURRENT TURN OVERRIDES
    // ===================================================

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

    // ===================================================
    // MERGED OBJECT DISCOVERY
    // ===================================================

    resolveMergedObject(
      candidates = []
    ) {
      let candidateCount = 0;

      let merged = {};

      const sources = [];

      for (
        const candidate
        of candidates
      ) {
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

        if (
          candidate.source
        ) {
          sources.push(
            candidate.source
          );
        }
      }

      return {
        source:
          sources.length
            ? sources.join(
                " + "
              )
            : null,

        value:
          merged,

        candidateCount
      };
    },

    // ===================================================
    // NORMALIZE LAYER
    // ===================================================

    normalizeLayer({
      contract,
      value = {},
      source = "unknown",
      warnings = []
    } = {}) {
      const result =
        contract.normalizeOverrides(
          this.objectOrEmpty(
            value
          )
        );

      const layerWarnings =
        this.arrayOrEmpty(
          result?.warnings
        );

      for (
        const warning
        of layerWarnings
      ) {
        warnings.push(
          `${source}:${warning}`
        );
      }

      return {
        ok:
          result?.ok !==
          false,

        normalized:
          this.objectOrEmpty(
            result?.normalized
          ),

        warnings:
          layerWarnings
      };
    },

    // ===================================================
    // ACTIVE PRESET
    // ===================================================

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

          summary
            .preferenceStagePacket
            ?.activePreset,

          summary
            .preferencePacket
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

    // ===================================================
    // STORE RESULT / RECORD NORMALIZATION
    //
    // Supports both:
    //
    // 1. Raw V3 store record
    //
    // {
    //   preferenceOverrides: {...},
    //   activePreset: "custom"
    // }
    //
    // 2. AriUserPreferenceStore success wrapper
    //
    // {
    //   ok: true,
    //   record: {...},
    //   preferenceOverrides: {...}
    // }
    // ===================================================

    normalizeStoreRecord(
      value = {}
    ) {
      const candidate =
        this.objectOrEmpty(
          value
        );

      const nestedRecord =
        this.isPlainObject(
          candidate.record
        )
          ? candidate.record
          : {};

      const record =
        this.hasKeys(
          nestedRecord
        )
          ? nestedRecord
          : candidate;

      const preferenceOverrides =
        this.firstObject([
          record.preferenceOverrides,

          record.preference_overrides,

          candidate.preferenceOverrides,

          candidate.preference_overrides,

          record.userPreferences,

          record.preferences
        ]);

      return {
        userId:
          record.userId ||
          record.user_id ||
          candidate.userId ||
          candidate.user_id ||
          null,

        activePreset:
          record.activePreset ||
          record.active_preset ||
          candidate.activePreset ||
          candidate.active_preset ||
          null,

        preferenceOverrides:
          this.clone(
            preferenceOverrides
          ),

        schemaVersion:
          record.schemaVersion ||
          record.schema_version ||
          candidate.schemaVersion ||
          candidate.schema_version ||
          null,

        revision:
          Number.isFinite(
            Number(
              record.revision ??
              candidate.revision
            )
          )
            ? Number(
                record.revision ??
                candidate.revision
              )
            : null,

        updatedAt:
          record.updatedAt ||
          record.updated_at ||
          candidate.updatedAt ||
          candidate.updated_at ||
          null
      };
    },

    // ===================================================
    // RESTRICTION CONTEXT
    // ===================================================

    readRestrictionContext(
      summary = {}
    ) {
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
            Object.keys(
              governor
            ).length
          ),

        mode:
          governor.mode ||
          "normal",

        normalResponseAllowed:
          governor
            .normalResponseAllowed !==
          false,

        emergencySafetyActive:
          governor
            .emergencySafetyActive ===
          true,

        maliciousOrIllegalOperationActive:
          governor
            .maliciousOrIllegalOperationActive ===
          true,

        authority:
          governor
            .authorityLevel ||
          governor.source ||
          null
      };
    },

    // ===================================================
    // PREFERENCE PRESENCE
    // ===================================================

    hasPreferenceValues(
      value = {},
      contract = null
    ) {
      if (
        !this.isPlainObject(
          value
        )
      ) {
        return false;
      }

      const resolvedContract =
        contract ||
        this.getPreferenceContract();

      const paths =
        Array.isArray(
          resolvedContract
            ?.preferencePaths
        )
          ? resolvedContract
              .preferencePaths
          : [];

      if (!paths.length) {
        return this.hasKeys(
          value
        );
      }

      for (
        const path
        of paths
      ) {
        const preferenceValue =
          this.getPath(
            value,
            path
          );

        if (
          typeof preferenceValue ===
            "string"
        ) {
          return true;
        }
      }

      return false;
    },

    // ===================================================
    // VALIDATION
    // ===================================================

    validate() {
      const errors = [];
      const warnings = [];

      let contract =
        null;

      try {
        contract =
          this.requirePreferenceContract();
      } catch (error) {
        errors.push(
          error?.message ||
          "preference_contract_unavailable"
        );
      }

      if (contract) {
        const contractValidation =
          typeof contract.validate ===
            "function"
            ? contract.validate()
            : null;

        if (
          contractValidation &&
          contractValidation.ready !==
            true
        ) {
          errors.push(
            "preference_contract_not_ready"
          );
        }
      }

      const requiredMethods = [
        "resolve",
        "create",
        "resolvePersistentPreferenceRecord",
        "resolveConversationOverrides",
        "resolveCurrentTurnOverrides",
        "normalizeLayer",
        "normalizeStoreRecord"
      ];

      for (
        const method
        of requiredMethods
      ) {
        if (
          typeof this[
            method
          ] !==
          "function"
        ) {
          errors.push(
            `resolver_method_missing:${method}`
          );
        }
      }

      return {
        valid:
          errors.length ===
          0,

        ready:
          errors.length ===
          0,

        source:
          this.source,

        version:
          this.version,

        schema:
          this.schema,

        schemaVersion:
          this.schemaVersion,

        requiredContractVersion:
          this.requiredContractVersion,

        contractReady:
          Boolean(
            contract
          ),

        contractVersion:
          contract
            ?.version ||
          null,

        contractSchemaVersion:
          contract
            ?.schemaVersion ||
          null,

        contractCompatible:
          String(
            contract
              ?.schemaVersion ||
            contract
              ?.version ||
            ""
          ) ===
          this.requiredContractVersion,

        persistenceSupported:
          false,

        inferenceSupported:
          false,

        presetSupported:
          true,

        persistentPreferencesSupported:
          true,

        conversationOverridesSupported:
          true,

        currentTurnOverridesSupported:
          true,

        communicationStyleExecutionSupported:
          true,

        activeBehaviorInstructionsSupported:
          true,

        bindingStyleConstraintsSupported:
          false,

        restrictionGovernorSupported:
          true,

        errors,

        warnings
      };
    },

    // ===================================================
    // CONTRACT
    // ===================================================

    getPreferenceContract() {
      return (
        window
          .AriUserPreferenceContract ||
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

      const contractVersion =
        String(
          contract.schemaVersion ||
          contract.version ||
          ""
        );

      if (
        contractVersion !==
        this.requiredContractVersion
      ) {
        throw new Error(
          `AriPreferenceResolver ${this.version} requires AriUserPreferenceContract ${this.requiredContractVersion}, but ${contractVersion || "an unknown version"} is loaded.`
        );
      }

      const requiredMethods = [
        "normalizeOverrides",
        "resolvePreferences",
        "getRuntimeDefaults",
        "getPreset",
        "isValidPreset",
        "isValidPreferenceValue"
      ];

      for (
        const method
        of requiredMethods
      ) {
        if (
          typeof contract[
            method
          ] !==
          "function"
        ) {
          throw new Error(
            `AriUserPreferenceContract is missing required method ${method}().`
          );
        }
      }

      return contract;
    },

    // ===================================================
    // FAILURE RESULT
    // ===================================================

    failureResult(
      error,
      warnings = []
    ) {
      return {
        ok: false,
        success: false,
        complete: false,
        ready: false,

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

        resolvedPreferences:
          {},

        modelInstructions:
          [],

        instructionText:
          "",

        provenance:
          {},

        diagnostics: {
          resolverRan:
            true,

          resolverReady:
            false,

          resolverVersion:
            this.version,

          error:
            {
              message:
                error?.message ||
                String(
                  error ||
                  "Unknown preference resolver error."
                )
            },

          warningCount:
            warnings.length,

          warnings:
            this.clone(
              warnings
            )
        }
      };
    },

    // ===================================================
    // OBJECT HELPERS
    // ===================================================

    getPath(
      source,
      path
    ) {
      if (
        !this.isPlainObject(
          source
        ) ||
        typeof path !==
          "string"
      ) {
        return undefined;
      }

      const segments =
        path
          .split(".")
          .filter(Boolean);

      let cursor =
        source;

      for (
        const segment
        of segments
      ) {
        if (
          cursor === null ||
          cursor === undefined ||
          typeof cursor !==
            "object"
        ) {
          return undefined;
        }

        cursor =
          cursor[
            segment
          ];
      }

      return cursor;
    },

    firstObject(
      values = []
    ) {
      for (
        const value
        of values
      ) {
        if (
          this.isPlainObject(
            value
          ) &&
          Object.keys(
            value
          ).length
        ) {
          return value;
        }
      }

      return {};
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

    hasKeys(
      value
    ) {
      return (
        this.isPlainObject(
          value
        ) &&
        Object.keys(
          value
        ).length > 0
      );
    },

    objectOrEmpty(
      value
    ) {
      return this.isPlainObject(
        value
      )
        ? value
        : {};
    },

    arrayOrEmpty(
      value
    ) {
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
        const value
        of values
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

    deepMerge(
      base = {},
      override = {}
    ) {
      const output =
        this.clone(
          this.objectOrEmpty(
            base
          )
        );

      for (
        const [
          key,
          value
        ]
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
            output[
              key
            ]
          )
        ) {
          output[
            key
          ] =
            this.deepMerge(
              output[
                key
              ],
              value
            );
        } else if (
          value !==
          undefined
        ) {
          output[
            key
          ] =
            this.clone(
              value
            );
        }
      }

      return output;
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

  window.AriPreferenceResolver =
    AriPreferenceResolver;

  window.Ari.preferenceResolver =
    AriPreferenceResolver;

  // =====================================================
  // SELF VALIDATION
  // =====================================================

  const validation =
    AriPreferenceResolver
      .validate();

  console.log(
    "ARI PREFERENCE RESOLVER LOADED:",
    AriPreferenceResolver.version,

    validation.ready === true
      ? "READY"
      : "INVALID",

    validation
  );
})();