// ari/language/ari-composer-bridge.js
// Purpose: Build one clean composer packet from contract + downstream context.
// V1.0.3 — Structured Evidence Packet / AI Writer Ready

window.Ari = window.Ari || {};

window.AriComposerBridge = {
  version: "1.0.3",

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
              "use_locked_developer_packet_only",
              "do_not_render_unlocked_investigation_as_final",
              "do_not_invent_code",
              ...(contract.responseRules || [])
            ]
          : contract.responseRules ||
            summary.responseRules ||
            summary.responseConstraints ||
            [],

      requiredBehaviors:
        developerPacket?.enabled
          ? [
              "Use locked developer replies directly only when locked is true.",
              "Use unlocked developer packets as context for the AI Writer.",
              ...(contract.requiredBehaviors || [])
            ]
          : contract.requiredBehaviors || [],

      forbiddenBehaviors:
        developerPacket?.enabled
          ? [
              "Do not ignore composerDeveloperPacket.",
              "Do not render unlocked investigation plans as final answers.",
              "Do not answer from generic reasoning when stronger evidence exists.",
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

        codeUnderstanding:
          summary.codeUnderstanding ||
          summary.rebirthCodeUnderstanding ||
          null,

        developerUnderstanding:
          summary.developerUnderstanding ||
          summary.rebirthDeveloperUnderstanding ||
          null,

        developerIntent:
          summary.developerIntent ||
          developerPacket?.intent ||
          null,

        developerHandoff: summary.developerHandoff || null,
        developerResponse: summary.developerResponse || null,
        developerReply: summary.developerReply || null,
        developerPacket: developerPacket?.enabled ? developerPacket : null,

        aiWriter: {
          ran: summary.aiWriterRan === true,
          usedAI: summary.aiWriterUsedAI === true,
          draft: summary.aiWriterDraft || summary.draft || null,
          source: summary.aiWriterSource || null,
          version: summary.aiWriterVersion || null,
          fallbackReason: summary.aiWriterFallbackReason || null
        },

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