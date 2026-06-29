// ari/language/ari-composer-bridge.js
// Purpose: Convert approved pipeline summary into sealed composer packet.
// V1.0.0 — Contract-to-Composer Boundary

window.Ari = window.Ari || {};

window.AriComposerBridge = {
  version: "1.0.0",

  build(summary = {}) {
    const contract = summary.situationContract || {};
    const triage = summary.triage || summary.ariTriage || {};
    const map = summary.situationMap || {};

    const primary =
      contract.primary ||
      summary.situationContractPrimary ||
      triage.primaryLane ||
      "general_understanding";

    return {
      composerPacket: {
        ready: true,
        source: "ari-composer-bridge",
        version: this.version,

        userQuestion:
          summary.resolvedUserQuestion ||
          summary.threadQuestion?.resolvedUserQuestion ||
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",

        primary,
        responseShape:
          contract.responseShape ||
          triage.responseShape ||
          summary.responseShape ||
          "clear_explanation",

        responseRules:
          contract.responseRules ||
          triage.responseConstraints ||
          summary.responseRules ||
          [],

        mouthDirective: contract.mouthDirective || null,

        situation: {
          thesis:
            contract.situationThesis?.thesis ||
            map.primarySituationThesis ||
            summary.primarySituationThesis ||
            null,

          narrative:
            contract.situationThesis?.narrative ||
            map.situationNarrative ||
            summary.situationNarrative ||
            null,

          recommendedUse:
            contract.situationThesis?.recommendedUse ||
            map.thesisRecommendedUse ||
            summary.thesisRecommendedUse ||
            "do_not_use_as_authority"
        },

        evidence: {
          github: summary.githubEvidence || null,
          developerHandoff: summary.developerHandoff || null,
          safety: summary.safetyContextGate || null
        },

        style: {
          communicationPlan: summary.communicationPlan || null,
          humanLanguageProfile: summary.humanLanguageProfile || null
        },

        locks: {
          allowAI: false,
          allowPatch: primary === "builder",
          allowSummaryInspection: false
        }
      }
    };
  }
};

console.log("ARI COMPOSER BRIDGE LOADED:", window.AriComposerBridge?.version);