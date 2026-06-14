// ari/governance/ari-authority-map-engine.js
// Ari Authority Map Engine
// Purpose: Decide which systems may lead, support, or stay silent.
// V1.0

window.Ari = window.Ari || {};

window.AriAuthorityMapEngine = {
  version: "1.0.0",

  decide(input = {}) {
    const summary = input.summary || input || {};

    const domainLead = summary.domainLead || null;
    const domainMode = summary.domainMode || null;
    const domainLeadOrgan = summary.domainLeadOrgan || null;
    const responseIntent = summary.responseIntent || null;
    const uncertaintyType = summary.uncertaintyType || null;

    const authority = {
      leadOrgan: domainLeadOrgan || summary.salienceLeadOrgan || "observer",
      leadMode: domainMode || summary.salienceMode || "continue_observing",

      leadSystems: [],
      supportSystems: [],
      blockedSystems: [],

      forceDirectAnswer: false,
      suppressRecoveryQuestion: false,
      allowTeaching: true,
      allowEmotion: true,
      allowMeaning: true,
      allowIdentity: true,
      allowWisdom: true,
      allowValues: true,
      allowAction: true,
      allowUncertainty: true,

      reason: "Default authority allows normal system cooperation."
    };

    const isTeaching =
      domainLead === "knowledge_teaching_domain" ||
      domainMode === "teach_clearly" ||
      responseIntent === "teach_clearly";

    const isBuilding =
      domainLead === "creative_building_domain" ||
      domainMode === "build_or_debug" ||
      responseIntent === "build_or_debug";

    const isPlanning =
      domainLead === "decision_planning_domain" ||
      domainMode === "plan_next_step" ||
      responseIntent === "create_priority_structure";

    const isDirectIntentSupported =
      uncertaintyType === "direct_intent_supported" ||
      summary.shouldSuppressUncertainty === true;

    if (isTeaching) {
      authority.leadOrgan = "teacher";
      authority.leadMode = "teach_clearly";
      authority.leadSystems = ["domain", "teacher", "knowledge"];
      authority.supportSystems = ["emotion_style", "voice", "shape"];
      authority.blockedSystems = [
        "uncertainty_recovery",
        "emotion_recovery",
        "life_chapter",
        "identity_projection",
        "meaning_projection",
        "value_integration",
        "synthesis_question"
      ];

      authority.forceDirectAnswer = true;
      authority.suppressRecoveryQuestion = true;

      authority.allowTeaching = true;
      authority.allowEmotion = false;
      authority.allowMeaning = false;
      authority.allowIdentity = false;
      authority.allowWisdom = false;
      authority.allowValues = false;
      authority.allowAction = false;
      authority.allowUncertainty = false;

      authority.reason =
        "Direct teaching intent is active. Ari should answer clearly while deeper interpretation systems stay silent.";

      return this.finish(authority, summary);
    }

    if (isBuilding) {
      authority.leadOrgan = "builder";
      authority.leadMode = "build_or_debug";
      authority.leadSystems = ["domain", "builder", "executive"];
      authority.supportSystems = ["teacher", "voice", "shape"];
      authority.blockedSystems = [
        "emotion_recovery",
        "life_chapter",
        "identity_projection",
        "meaning_projection",
        "synthesis_question"
      ];

      authority.forceDirectAnswer = true;
      authority.suppressRecoveryQuestion = true;

      authority.allowTeaching = true;
      authority.allowEmotion = false;
      authority.allowMeaning = false;
      authority.allowIdentity = false;
      authority.allowWisdom = false;
      authority.allowValues = false;
      authority.allowAction = true;
      authority.allowUncertainty = false;

      authority.reason =
        "Direct building/debugging intent is active. Ari should help fix or create the requested thing.";

      return this.finish(authority, summary);
    }

    if (isPlanning) {
      authority.leadOrgan = "planner";
      authority.leadMode = "plan_next_step";
      authority.leadSystems = ["domain", "executive", "planner"];
      authority.supportSystems = ["values", "wisdom", "voice", "shape"];
      authority.blockedSystems = [
        "emotion_recovery",
        "life_chapter",
        "identity_projection",
        "meaning_projection"
      ];

      authority.forceDirectAnswer = true;
      authority.suppressRecoveryQuestion = true;

      authority.allowTeaching = true;
      authority.allowEmotion = false;
      authority.allowMeaning = false;
      authority.allowIdentity = false;
      authority.allowWisdom = true;
      authority.allowValues = true;
      authority.allowAction = true;
      authority.allowUncertainty = false;

      authority.reason =
        "Direct planning intent is active. Ari should organize the next move instead of emotionally interpreting.";

      return this.finish(authority, summary);
    }

    if (isDirectIntentSupported) {
      authority.suppressRecoveryQuestion = true;
      authority.allowUncertainty = false;
      authority.blockedSystems.push("uncertainty_recovery");
      authority.reason =
        "Uncertainty detected that direct intent is supported, so it may not lead.";

      return this.finish(authority, summary);
    }

    return this.finish(authority, summary);
  },

  finish(authority, summary = {}) {
    return {
      authorityMapRan: true,
      authorityMapVersion: this.version,

      authorityLeadOrgan: authority.leadOrgan,
      authorityLeadMode: authority.leadMode,
      authorityLeadSystems: authority.leadSystems,
      authoritySupportSystems: authority.supportSystems,
      authorityBlockedSystems: authority.blockedSystems,

      authorityForceDirectAnswer: authority.forceDirectAnswer,
      authoritySuppressRecoveryQuestion: authority.suppressRecoveryQuestion,

      authorityAllows: {
        teaching: authority.allowTeaching,
        emotion: authority.allowEmotion,
        meaning: authority.allowMeaning,
        identity: authority.allowIdentity,
        wisdom: authority.allowWisdom,
        values: authority.allowValues,
        action: authority.allowAction,
        uncertainty: authority.allowUncertainty
      },

      authorityReason: authority.reason,
      source: "ari-authority-map-engine"
    };
  }
};