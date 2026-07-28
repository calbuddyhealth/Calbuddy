// ari/governance/ari-restriction-governor.js
// Ari Restriction Governor
//
// Purpose:
// Define Ari's only application-owned response restrictions.
//
// V1.0.0 — Minimal Restriction Authority
//
// Ari application restrictions:
// 1. Emergency or unresolved immediate safety risk.
// 2. Actionable assistance for malicious, unauthorized, or illegal conduct.
//
// Everything else remains available by default.
//
// Responsibilities:
// - Read the authoritative Safety Gate result.
// - Read the authoritative misuse / illegal-operation assessment.
// - Decide whether normal response generation may continue.
// - Require emergency-first handling when immediate safety risk is active.
// - Block only actionable assistance that facilitates malicious or illegal acts.
// - Preserve high-level discussion, defensive help, prevention, and safe alternatives.
//
// Non-responsibilities:
// - Does not classify general conversation meaning.
// - Does not choose normal response lanes.
// - Does not control profanity, humor, sarcasm, banter, or creative style.
// - Does not create preferences.
// - Does not compose the final response.
// - Does not override provider-level safety requirements.

window.Ari = window.Ari || {};

window.AriRestrictionGovernor = {
  version: "1.0.0",
  schemaVersion: "1.0.0",
  source: "ari-restriction-governor",
  authorityLevel: "application_restriction_authority",

  evaluate(input = {}) {
    const summary =
      this.isPlainObject(input?.summary)
        ? input.summary
        : this.objectOrEmpty(input);

    const safety =
      this.readSafetyPacket(summary);

    const misuse =
      this.readMisusePacket(summary);

    const emergency =
      this.evaluateEmergencySafety(safety);

    const illegalOperation =
      this.evaluateIllegalOperationalRequest(misuse);

    const mode =
      emergency.active
        ? "emergency_safety"
        : illegalOperation.active
          ? "malicious_or_illegal_operation"
          : "normal";

    const normalResponseAllowed =
      mode === "normal";

    return {
      ok: true,
      success: true,
      complete: true,
      ready: true,

      restrictionGovernorRan: true,
      restrictionGovernorVersion: this.version,
      schemaVersion: this.schemaVersion,
      source: this.source,
      authorityLevel: this.authorityLevel,

      mode,

      normalResponseAllowed,

      emergencySafetyActive:
        emergency.active,

      maliciousOrIllegalOperationActive:
        illegalOperation.active,

      emergency: {
        active:
          emergency.active,

        override:
          emergency.override,

        riskLevel:
          emergency.riskLevel,

        riskType:
          emergency.riskType,

        primaryRisk:
          emergency.primaryRisk,

        followUpNeeded:
          emergency.followUpNeeded,

        followUpQuestion:
          emergency.followUpQuestion,

        reason:
          emergency.reason
      },

      illegalOperation: {
        active:
          illegalOperation.active,

        category:
          illegalOperation.category,

        confidence:
          illegalOperation.confidence,

        actionable:
          illegalOperation.actionable,

        maliciousIntent:
          illegalOperation.maliciousIntent,

        unauthorized:
          illegalOperation.unauthorized,

        illegalPurpose:
          illegalOperation.illegalPurpose,

        reason:
          illegalOperation.reason
      },

      responseBoundary: {
        mayAnswerNormally:
          normalResponseAllowed,

        mustLeadWithEmergencySafety:
          mode === "emergency_safety",

        mustRefuseOperationalAssistance:
          mode ===
          "malicious_or_illegal_operation",

        mayProvideHighLevelInformation:
          mode !== "emergency_safety",

        mayProvideDefensiveHelp:
          true,

        mayProvidePreventionHelp:
          true,

        mayProvideLegalAlternatives:
          true,

        mayProvideSafeAlternatives:
          true,

        mayDiscussFictionalOrHistoricalContext:
          true
      },

      stylePolicy: {
        profanityProhibited:
          false,

        humorProhibited:
          false,

        sarcasmProhibited:
          false,

        banterProhibited:
          false,

        creativeLanguageProhibited:
          false,

        professionalToneRequired:
          false,

        authority:
          "style_is_not_a_restriction_boundary"
      },

      reason:
        mode === "emergency_safety"
          ? emergency.reason
          : mode ===
              "malicious_or_illegal_operation"
            ? illegalOperation.reason
            : "No Ari application-level restriction applies.",

      audit: {
        safetyPacketRead:
          Boolean(
            safety &&
            Object.keys(safety).length
          ),

        misusePacketRead:
          Boolean(
            misuse &&
            Object.keys(misuse).length
          ),

        styleRestrictionCreated:
          false,

        finalAuthority:
          this.authorityLevel
      },

      authority: {
        ownsApplicationRestrictions:
          true,

        safetyGateRemainsAuthoritative:
          true,

        misuseGateRemainsAuthoritative:
          true,

        mayCreateStyleProhibitions:
          false,

        mayChooseNormalResponseLane:
          false,

        mayComposeResponse:
          false
      }
    };
  },

  run(input = {}) {
    return this.evaluate(input);
  },

  readSafetyPacket(summary = {}) {
    return this.firstObject([
      summary.safetyContextGate,
      summary.safetyGate,
      summary.safetyStagePacket,
      summary.safety
    ]);
  },

  readMisusePacket(summary = {}) {
    return this.firstObject([
      summary.misuseGate,
      summary.illegalOperationGate,
      summary.illegalActionGate,
      summary.cyberSafetyGate,
      summary.maliciousIntentGate,
      summary.abusePreventionGate,
      summary.misuseAssessment
    ]);
  },

  evaluateEmergencySafety(safety = {}) {
    const override =
      this.firstNonEmptyString([
        safety.override,
        safety.safetyOverride,
        safety.responseOverride
      ]) || null;

    const riskLevel =
      this.firstNonEmptyString([
        safety.riskLevel,
        safety.level
      ]) || "none";

    const riskType =
      this.firstNonEmptyString([
        safety.riskType,
        safety.primaryRisk?.type,
        safety.type
      ]) || "none";

    const emergencyOverride =
      [
        "emergency",
        "urgent",
        "clarify_risk"
      ].includes(override);

    const explicitImmediateDanger =
      safety.immediateDanger === true ||
      safety.activeEmergency === true ||
      safety.emergencyActive === true ||
      safety.shouldStopNormalResponse === true;

    const active =
      emergencyOverride ||
      explicitImmediateDanger;

    return {
      active,

      override,

      riskLevel,

      riskType,

      primaryRisk:
        this.clone(
          safety.primaryRisk || null
        ),

      followUpNeeded:
        safety.followUpNeeded === true ||
        override === "clarify_risk",

      followUpQuestion:
        safety.followUpQuestion ||
        null,

      reason:
        active
          ? override === "clarify_risk"
            ? "Immediate safety risk remains unresolved and requires clarification."
            : "Emergency or urgent safety risk is active."
          : "No emergency safety restriction is active."
    };
  },

  evaluateIllegalOperationalRequest(
    misuse = {}
  ) {
    const category =
      this.firstNonEmptyString([
        misuse.category,
        misuse.primaryCategory,
        misuse.type,
        misuse.requestType
      ]) || null;

    const confidence =
      this.safeConfidence(
        misuse.confidence
      );

    const actionable =
      misuse.actionable === true ||
      misuse.operational === true ||
      misuse.providesExecutionSteps === true ||
      misuse.blockOperationalAssistance === true;

    const maliciousIntent =
      misuse.maliciousIntent === true ||
      misuse.intent === "malicious" ||
      misuse.intent === "criminal";

    const unauthorized =
      misuse.unauthorized === true ||
      misuse.authorization === "unauthorized" ||
      misuse.hasAuthorization === false;

    const illegalPurpose =
      misuse.illegalPurpose === true ||
      misuse.criminalPurpose === true ||
      misuse.purpose === "illegal";

    const explicitlyBlocked =
      misuse.block === true ||
      misuse.shouldRefuse === true ||
      misuse.blockOperationalAssistance === true;

    const blockedCategories =
      new Set([
        "unauthorized_access",
        "credential_theft",
        "account_takeover",
        "malware_creation",
        "malware_deployment",
        "ransomware",
        "data_theft",
        "fraud",
        "identity_theft",
        "financial_theft",
        "violent_harm",
        "weaponized_harm",
        "evasion_or_concealment",
        "evidence_destruction",
        "illegal_operational_assistance",
        "criminal_facilitation"
      ]);

    const categoryBlocked =
      Boolean(
        category &&
        blockedCategories.has(category)
      );

    /*
     * A request is blocked only when it is operational/actionable and
     * malicious, unauthorized, illegal, explicitly blocked, or belongs
     * to a clearly prohibited operational category.
     *
     * Merely discussing hacking, crime, cybersecurity, law, fiction,
     * history, prevention, or defensive techniques is not enough.
     */
    const active =
      actionable &&
      (
        maliciousIntent ||
        unauthorized ||
        illegalPurpose ||
        explicitlyBlocked ||
        categoryBlocked
      );

    return {
      active,

      category,

      confidence,

      actionable,

      maliciousIntent,

      unauthorized,

      illegalPurpose,

      reason:
        active
          ? "The request seeks actionable assistance for malicious, unauthorized, or illegal conduct."
          : "No actionable malicious or illegal operational request was established."
    };
  },

  validate() {
    const valid =
      typeof this.evaluate === "function" &&
      typeof this.run === "function" &&
      typeof this.evaluateEmergencySafety ===
        "function" &&
      typeof this.evaluateIllegalOperationalRequest ===
        "function";

    return {
      valid,
      ready: valid,
      source: this.source,
      version: this.version,
      schemaVersion: this.schemaVersion
    };
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

  firstNonEmptyString(values = []) {
    for (const value of values) {
      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return value.trim();
      }
    }

    return "";
  },

  safeConfidence(value) {
    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return 0.5;
    }

    return number > 1
      ? Math.max(
          0,
          Math.min(1, number / 100)
        )
      : Math.max(
          0,
          Math.min(1, number)
        );
  },

  isPlainObject(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  },

  objectOrEmpty(value) {
    return this.isPlainObject(value)
      ? value
      : {};
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

window.Ari.restrictionGovernor =
  window.AriRestrictionGovernor;

console.log(
  "ARI RESTRICTION GOVERNOR LOADED:",
  window.AriRestrictionGovernor?.version,
  window.AriRestrictionGovernor?.validate?.()
);