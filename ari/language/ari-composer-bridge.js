// ari/language/ari-composer-bridge.js
// Purpose: Build one clean composer packet from contract + downstream context.
// V1.0.6 — Developer Evidence Gated / Normal Conversation Clean

window.Ari = window.Ari || {};

window.AriComposerBridge = {
  version: "1.0.6",

  build(summary = {}) {
    const contract = summary.situationContract || {};
    const triage = summary.triage || summary.ariTriage || {};
    const mouth = summary.mouthDirector || {};
    const communicationPlan = summary.communicationPlan || {};

    const userQuestion =
      summary.resolvedUserQuestion ||
      summary.threadQuestion?.resolvedUserQuestion ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const rawDeveloperPacket =
      summary.composerDeveloperPacket?.enabled === true
        ? summary.composerDeveloperPacket
        : null;

    const developerLocked = rawDeveloperPacket?.locked === true;
    const developerRelevant = this.isDeveloperRelevant(summary, userQuestion);

    const developerPacket =
      developerLocked || developerRelevant ? rawDeveloperPacket : null;

    const basePrimary =
      contract.primary ||
      summary.situationContractPrimary ||
      triage.primaryLane ||
      summary.primaryLane ||
      "general_understanding";

    const primary = developerLocked ? "developer" : basePrimary;

    const evidence = this.buildEvidence({
      summary,
      developerPacket,
      developerLocked,
      developerRelevant
    });

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
      developerRelevant,

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
            "ignore_developer_or_github_evidence_when_current_question_is_not_developer_related",
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
            "Do not let stale GitHub evidence override normal conversation.",
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
            "Do not carry old file evidence into unrelated questions.",
            ...(contract.forbiddenBehaviors || [])
          ],

      mouthDirective: contract.mouthDirective || mouth || null,
      communicationPlan,
      humanLanguageProfile: summary.humanLanguageProfile || {},

      character:
        summary.composerCharacter ||
        summary.characterExpression?.composerCharacter ||
        summary.characterExpression?.composerCharacterPacket ||
        null,

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

      evidence
    };

    return {
      composerPacketReady: true,
      composerPacket: packet,
      composerBridgeRan: true,
      composerBridgeSource: "ari-composer-bridge",
      composerBridgeVersion: this.version
    };
  },

  isDeveloperRelevant(summary = {}, userQuestion = "") {
    const text = String(userQuestion || "").toLowerCase();

    const primary =
      summary.situationContract?.primary ||
      summary.situationContractPrimary ||
      summary.triage?.primaryLane ||
      summary.ariTriage?.primaryLane ||
      summary.primaryLane ||
      "";

    const explicitFile =
      /\b[\w/-]+\.(js|html|css|json|md|ts|tsx|jsx)\b/i.test(text);

    const repoWord =
      /\b(github|repo|repository|branch|commit|deploy|vercel|supabase|codebase)\b/i.test(text);

    const devAction =
      /\b(read|open|show|search|find|update|change|replace|remove|fix|patch|debug|edit|inspect|diagnose)\b/i.test(text);

    const devConcept =
      /\b(code|file|function|engine|pipeline|composer|handoff|api|bug|error|script|selector|markup)\b/i.test(text);

    const developerLane =
      ["developer", "builder", "coding", "project_help"].includes(
        String(primary || "").toLowerCase()
      );

    return Boolean(
      developerLane ||
      explicitFile ||
      (repoWord && devAction) ||
      (devConcept && devAction)
    );
  },

  buildEvidence({
    summary = {},
    developerPacket = null,
    developerLocked = false,
    developerRelevant = false
  } = {}) {
    const allowDeveloperEvidence = developerLocked || developerRelevant;

    const githubEvidence = allowDeveloperEvidence
      ? summary.githubEvidence || summary.githubFileContext || null
      : null;

    return {
      github: githubEvidence,

      codeUnderstanding: allowDeveloperEvidence
        ? summary.codeUnderstanding ||
          summary.rebirthCodeUnderstanding ||
          null
        : null,

      developerUnderstanding: allowDeveloperEvidence
        ? summary.developerUnderstanding ||
          summary.rebirthDeveloperUnderstanding ||
          null
        : null,

      developerIntent: allowDeveloperEvidence
        ? summary.developerIntent ||
          developerPacket?.intent ||
          null
        : null,

      developerHandoff: allowDeveloperEvidence
        ? summary.developerHandoff || null
        : null,

      developerResponse: allowDeveloperEvidence
        ? summary.developerResponse || null
        : null,

      developerReply: developerLocked
        ? summary.developerReply || developerPacket?.reply || null
        : null,

      developerPacket: allowDeveloperEvidence ? developerPacket : null,

      aiWriter: {
        ran: summary.aiWriterRan === true,
        usedAI: summary.aiWriterUsedAI === true,
        draft: summary.aiWriterDraft || summary.draft || null,
        source: summary.aiWriterSource || null,
        version: summary.aiWriterVersion || null,
        fallbackReason: summary.aiWriterFallbackReason || null
      },

      character:
        summary.composerCharacter ||
        summary.characterExpression?.composerCharacter ||
        summary.characterExpression?.composerCharacterPacket ||
        null,

      reasoning: summary.reasoning || null,
      lexicalGrounding: summary.lexicalGrounding || null,
      continuityFacts: summary.continuityUsableFacts || []
    };
  }
};

console.log("ARI COMPOSER BRIDGE LOADED:", window.AriComposerBridge.version);