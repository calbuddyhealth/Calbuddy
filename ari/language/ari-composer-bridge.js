// ari/language/ari-composer-bridge.js
// Purpose: Build one clean composer packet from contract + downstream context.
// V1.0.4 — Locked Developer Packets Only / Normal Conversation Safe

window.Ari = window.Ari || {};

window.AriComposerBridge = {
  version: "1.0.4",

  build(summary = {}) {
    const contract = summary.situationContract || {};
    const triage = summary.triage || summary.ariTriage || {};
    const mouth = summary.mouthDirector || {};
    const communicationPlan = summary.communicationPlan || {};

    const developerPacket =
      summary.composerDeveloperPacket?.enabled === true
        ? summary.composerDeveloperPacket
        : null;

    const developerLocked = developerPacket?.locked === true;

    const basePrimary =
      contract.primary ||
      summary.situationContractPrimary ||
      triage.primaryLane ||
      summary.primaryLane ||
      "general_understanding";

    const primary = developerLocked ? "developer" : basePrimary;

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

      developerPacket,
      hasDeveloperPacket: Boolean(developerPacket),
      developerPacketLocked: developerLocked,
      developerPacketAdvisory: Boolean(developerPacket && !developerLocked),

      responseShape: developerLocked
        ? "developer_direct_answer"
        : contract.responseShape ||
          summary.responseShape ||
          mouth.responsePattern ||
          "clear_explanation",

      responseRules: developerLocked
        ? [
            "use_locked_developer_packet_only",
            "do_not_invent_code",
            ...(contract.responseRules || [])
          ]
        : [
            "normal_conversation_must_not_be_replaced_by_unlocked_developer_packet",
            "use_unlocked_developer_packet_as_advisory_context_only",
            ...(contract.responseRules ||
              summary.responseRules ||
              summary.responseConstraints ||
              [])
          ],

      requiredBehaviors: developerLocked
        ? [
            "Use locked developer replies directly only when locked is true.",
            ...(contract.requiredBehaviors || [])
          ]
        : [
            "Answer the user's current request normally.",
            "Use unlocked developer packets only as background evidence.",
            ...(contract.requiredBehaviors || [])
          ],

      forbiddenBehaviors: developerLocked
        ? [
            "Do not ignore a locked composerDeveloperPacket.",
            "Do not invent code.",
            ...(contract.forbiddenBehaviors || [])
          ]
        : [
            "Do not render unlocked investigation plans as final answers.",
            "Do not switch normal conversation into developer template mode.",
            "Do not dump JSON investigation steps to the user.",
            ...(contract.forbiddenBehaviors || [])
          ],

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
        github: summary.githubEvidence || summary.githubFileContext || null,

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
        developerReply: developerLocked ? summary.developerReply || null : null,
        developerPacket,

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