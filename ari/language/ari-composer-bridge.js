// ari/language/ari-composer-bridge.js
// Purpose: Build one clean composer packet from contract + downstream context.
// V1.0.1 — Developer Packet Priority

window.Ari = window.Ari || {};

window.AriComposerBridge = {
  version: "1.0.1",

  build(summary = {}) {
    const contract = summary.situationContract || {};
    const triage = summary.triage || summary.ariTriage || {};
    const mouth = summary.mouthDirector || {};
    const communicationPlan = summary.communicationPlan || {};
    const developerPacket = summary.composerDeveloperPacket || null;

    const primary =
      developerPacket?.enabled
        ? "developer"
        : contract.primary ||
          summary.situationContractPrimary ||
          triage.primaryLane ||
          summary.primaryLane ||
          "general_understanding";

    const userQuestion =
      summary.resolvedUserQuestion ||
      summary.threadQuestion?.resolvedUserQuestion ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const packet = {
      ready: true,
      source: "ari-composer-bridge",
      version: this.version,

      userQuestion,
      primary,

      developerPacket: developerPacket?.enabled ? developerPacket : null,
      hasDeveloperPacket: developerPacket?.enabled === true,

      responseShape:
        developerPacket?.enabled
          ? "developer_direct_answer"
          : contract.responseShape ||
            summary.responseShape ||
            mouth.responsePattern ||
            "clear_explanation",

      responseRules:
        developerPacket?.enabled
          ? [
              "use_developer_packet_first",
              "do_not_replace_developer_reply",
              "do_not_invent_code",
              ...(contract.responseRules || [])
            ]
          : contract.responseRules ||
            summary.responseRules ||
            summary.responseConstraints ||
            [],

      requiredBehaviors: developerPacket?.enabled
        ? [
            "Render the developer packet reply directly when present.",
            ...(contract.requiredBehaviors || [])
          ]
        : contract.requiredBehaviors || [],

      forbiddenBehaviors: developerPacket?.enabled
        ? [
            "Do not ignore composerDeveloperPacket.",
            "Do not answer from generic reasoning when developerPacket.reply exists.",
            ...(contract.forbiddenBehaviors || [])
          ]
        : contract.forbiddenBehaviors || [],

      mouthDirective: contract.mouthDirective || mouth || null,
      communicationPlan,
      humanLanguageProfile: summary.humanLanguageProfile || {},

      thesis: {
        value:
          contract.situationThesis?.thesis ||
          summary.primarySituationThesis ||
          null,
        narrative:
          contract.situationThesis?.narrative ||
          summary.situationNarrative ||
          null,
        recommendedUse:
          contract.situationThesis?.recommendedUse ||
          summary.thesisRecommendedUse ||
          "do_not_use_as_authority"
      },

      safety: {
        gate: summary.safetyContextGate || null,
        risk: contract.risk || null,
        clarity: contract.clarity || null
      },

      evidence: {
        github: summary.githubEvidence || null,
        developerHandoff: summary.developerHandoff || null,
        developerResponse: summary.developerResponse || null,
        developerReply: summary.developerReply || null,
        developerPacket: developerPacket?.enabled ? developerPacket : null,
        reasoning: summary.reasoning || null,
        lexicalGrounding: summary.lexicalGrounding || null,
        continuityFacts: summary.continuityUsableFacts || []
      }
    };

    return {
      composerPacketReady: true,
      composerPacket: packet,
      composerBridgeRan: true,
      composerBridgeSource: "ari-composer-bridge",
      composerBridgeVersion: this.version
    };
  }
};

console.log("ARI COMPOSER BRIDGE LOADED:", window.AriComposerBridge.version);