// ari/language/ari-language-composer-v9.js
// Purpose: Final response writer from sealed composerPacket only.
// V9.2.0 — Writer Validation Reason / Current Draft First / No Stale History

window.Ari = window.Ari || {};

window.AriLanguageComposerV9 = {
  version: "9.2.0",

  async compose(input = {}) {
    const summary = input.summary || input || {};
    const packet = input.composerPacket || summary.composerPacket || input;

    if (!packet?.ready) {
      return this.returnFinal(
        "I don’t have a valid composer packet.",
        "diagnostic_no_packet",
        packet
      );
    }

    const developerPacket =
      packet.developerPacket ||
      packet.evidence?.developerPacket ||
      summary.composerDeveloperPacket ||
      null;

    const activeDialogueState = this.readActiveDialogueState({
      packet,
      summary,
      input
    });

const characterIdentity = this.readCharacterIdentity({ packet, summary, input });

    if (this.isLockedDeveloperPacket(developerPacket)) {
      return this.returnFinal(
        developerPacket.reply,
        "developer_packet_locked_reply",
        packet,
        activeDialogueState,
        characterIdentity
      );
    }

    if (this.isLockedDeveloperHandoff(packet)) {
      return this.returnFinal(
        packet.evidence.developerHandoff.reply,
        "developer_handoff_locked_reply",
        packet,
        activeDialogueState,
        characterIdentity
      );
    }

    if (packet.safety?.gate?.shouldStopNormalResponse) {
      return this.returnFinal(
        packet.safety.gate.response ||
          packet.safety.gate.message ||
          "I need to pause normal answering because this may involve safety.",
        "safety_gate_response",
        packet,
        activeDialogueState,
        characterIdentity
      );
    }

const knowledgeDraft = this.composeSupabaseKnowledge(packet);

if (knowledgeDraft) {
  return this.returnFinal(
    knowledgeDraft,
    "deterministic_supabase_knowledge_composed",
    packet,
    activeDialogueState,
    characterIdentity
  );
}

    const aiDraft = this.getCurrentWriterDraft({ packet, summary, input });

    if (aiDraft) {
      return this.returnFinal(
        aiDraft,
        this.resolveWriterValidation(packet),
        packet,
        activeDialogueState,
        characterIdentity
      );
    }

    if (this.isDeveloperRelevant(packet) && packet.evidence?.github?.content) {
      return this.composeGithub(packet, activeDialogueState, characterIdentity);
    }

    return this.composeLocal(packet, activeDialogueState, characterIdentity);
  },

  isLockedDeveloperPacket(developerPacket = null) {
    return Boolean(
      developerPacket?.enabled === true &&
      developerPacket.locked === true &&
      String(developerPacket.reply || "").trim()
    );
  },

  isLockedDeveloperHandoff(packet = {}) {
    return Boolean(
      packet.evidence?.developerHandoff?.responseLocked === true &&
      String(packet.evidence?.developerHandoff?.reply || "").trim()
    );
  },

  isDeveloperRelevant(packet = {}) {
    const question = String(packet.userQuestion || "").toLowerCase();
    const primary = String(packet.primary || "").toLowerCase();
    const shape = String(packet.responseShape || "").toLowerCase();

    const explicitCodeFile =
      /\b[\w/-]+\.(js|html|css|json|md|ts|tsx|jsx)\b/i.test(question);

    const repoContext =
      /\b(github|repo|repository|branch|commit|deploy|vercel|supabase|codebase)\b/i.test(question);

    const codeAction =
      /\b(read|open|show|search|find|update|change|replace|remove|fix|patch|debug|edit|inspect)\b/i.test(question);

    const developerMode =
      primary === "developer" ||
      primary === "builder" ||
      primary === "coding" ||
      shape.includes("developer") ||
      shape.includes("patch") ||
      shape.includes("code");

    return Boolean(developerMode || explicitCodeFile || (repoContext && codeAction));
  },

  readActiveDialogueState({ packet = {}, summary = {}, input = {} } = {}) {
    return (
      packet.activeDialogueState ||
      packet.evidence?.activeDialogueState ||
      packet.assembledContext?.activeDialogueState ||
      packet.advisoryContext?.activeDialogueState ||
      packet.continuityContext?.activeDialogueState ||
      summary.activeDialogueState ||
      summary.assembledContext?.activeDialogueState ||
      summary.advisoryContext?.activeDialogueState ||
      summary.continuityContext?.activeDialogueState ||
      summary.threadUnderstanding?.activeDialogueState ||
      input.activeDialogueState ||
      null
    );
  },

readCharacterIdentity({ packet = {}, summary = {}, input = {} } = {}) {
  return (
    packet.characterIdentity ||
    packet.evidence?.characterIdentity ||
    packet.assembledContext?.characterIdentity ||
    packet.advisoryContext?.characterIdentity ||
    packet.continuityContext?.characterIdentity ||
    summary.characterIdentity ||
    summary.assembledContext?.characterIdentity ||
    summary.advisoryContext?.characterIdentity ||
    summary.continuityContext?.characterIdentity ||
    input.characterIdentity ||
    null
  );
},

  getCurrentWriterDraft({ packet = {}, summary = {}, input = {} } = {}) {
    const candidates = [
      packet.evidence?.aiWriter?.draft,
      packet.aiWriterDraft,
      summary.aiWriterDraft,
      input.aiWriterDraft,
      packet.draft,
      summary.draft,
      input.draft,
      summary.currentWriterOutput,
      summary.writerOutput,
      summary.languageBody,
      summary.languageBodyOutput
    ];

    for (const candidate of candidates) {
      const text = String(candidate || "").trim();
      if (!text) continue;
      if (this.isStaleOrWrongContextReply(text, packet)) continue;
      return text;
    }

    return "";
  },

  isStaleOrWrongContextReply(text = "", packet = {}) {
    const t = String(text || "").toLowerCase();
    const q = String(packet.userQuestion || "").toLowerCase();

    const fileReply =
      t.includes("i read ") ||
      t.includes("loaded evidence") ||
      t.includes("loaded snippet") ||
      t.includes("github evidence") ||
      t.includes("file content");

    const userAsksCode =
      this.isDeveloperRelevant(packet);

    if (fileReply && !userAsksCode) return true;

    const staleIndexReply =
      t.includes("i read index.html") &&
      (
        t.includes("loaded snippet") ||
        t.includes("loaded evidence") ||
        t.includes("does not show") ||
        t.includes("visible file evidence")
      );

    const sameIndexTopic =
      q.includes("index.html") ||
      q.includes("homepage") ||
      q.includes("mascot") ||
      q.includes("ari hero") ||
      q.includes("avatar");

    return staleIndexReply && !sameIndexTopic;
  },

  composeGithub(packet = {}, activeDialogueState = null, characterIdentity = null) {
    const github = packet.evidence.github;
    const filePath = github.filePath || "the file";
    const content = String(github.content || "").trim();
    const question = String(packet.userQuestion || "").toLowerCase();

    if (!content) {
      return this.returnFinal(
        `I have ${filePath}, but no readable file content came through.`,
        "github_missing_content",
        packet,
        activeDialogueState,
        characterIdentity
      );
    }

    const asksMascot =
      question.includes("mascot") ||
      question.includes("avatar") ||
      question.includes("ari face") ||
      question.includes("ari character");

    const hasMascotEvidence =
      /mascot|ari-hero|ari-avatar|ari-mascot|ari-bubble|ari-face|ari-character/i.test(content);

    if (asksMascot && !hasMascotEvidence) {
      return this.returnFinal(
        `I read ${filePath}, but the loaded content does not show the Ari mascot markup. I should not guess a patch from unrelated code. Read the full homepage area or the style file that contains the mascot selector before removing anything.`,
        "github_missing_requested_object",
        packet,
        activeDialogueState,
        characterIdentity
      );
    }

    return this.returnFinal(
      `I read ${filePath}. I should answer only from the current file content and avoid reusing older saved replies.`,
      "github_grounded",
      packet,
      activeDialogueState,
      characterIdentity
    );
  },

composeSupabaseKnowledge(packet = {}) {
  const knowledge = packet.evidence?.knowledge || {};
  const nodes = Array.isArray(knowledge.nodes) ? knowledge.nodes : [];
  const question = String(packet.userQuestion || "").trim();
  const q = question.toLowerCase();

  if (!knowledge.shouldUseKnowledge || !nodes.length) return "";

  const primary = nodes[0] || {};
  const topic = primary.topic || primary.lesson || "this";
  const definition = primary.definition || "";
  const summary = primary.summary || "";
  const deep = primary.deep_understanding || "";
  const use = primary.how_ari_should_use_this || "";
  const practical = Array.isArray(primary.practical_applications)
    ? primary.practical_applications.slice(0, 3)
    : [];
  const misconceptions = Array.isArray(primary.misconceptions)
    ? primary.misconceptions.slice(0, 2)
    : [];

  const related = nodes
    .slice(1, 4)
    .map(n => n.topic || n.lesson)
    .filter(Boolean);

  const isAdvice =
    /\b(what should i do|how do i|help|where do i start|what can i do|advice|fix|improve|deal with)\b/.test(q);

  const isDefinition =
    /\b(what is|define|meaning of|what does.*mean)\b/.test(q);

  const isWhy =
    /\b(why|what'?s going on|what is going on|how does|explain)\b/.test(q);

  const userState =
    /\b(i am|i'm|im|i feel|my|me|i have|i keep|i can'?t|i cannot)\b/.test(q);

  const intro = userState
    ? `This sounds connected to ${topic.toLowerCase()}.`
    : `${topic} matters here.`;

  if (isDefinition) {
    return [
      definition || summary || `${topic} is the main concept here.`,
      deep ? this.cleanForUser(deep) : "",
      practical.length ? `In practice: ${this.joinShort(practical)}.` : ""
    ].filter(Boolean).join(" ");
  }

  if (isAdvice) {
    return [
      intro,
      use ? this.cleanForUser(use) : summary,
      practical.length ? `A good next step is: ${this.joinShort(practical)}.` : "",
      related.length ? `This may also connect with ${related.join(", ")}.` : ""
    ].filter(Boolean).join(" ");
  }

  if (isWhy || userState) {
    return [
      intro,
      summary || definition,
      deep ? this.cleanForUser(deep) : "",
      misconceptions.length ? `One thing not to do: ${this.joinShort(misconceptions)}.` : "",
      practical.length ? `Start simple: ${this.joinShort(practical)}.` : "",
      related.length ? `It may also connect with ${related.join(", ")}.` : ""
    ].filter(Boolean).join(" ");
  }

  return [
    summary || definition || `This connects to ${topic}.`,
    use ? this.cleanForUser(use) : "",
    related.length ? `It may also connect with ${related.join(", ")}.` : ""
  ].filter(Boolean).join(" ");
},

cleanForUser(text = "") {
  return String(text || "")
    .replace(/\bAri should\b/gi, "A good response is to")
    .replace(/\bHelp Ari\b/gi, "The goal is to")
    .replace(/\busers\b/gi, "people")
    .replace(/\buser\b/gi, "person")
    .trim();
},

joinShort(items = []) {
  return items
    .filter(Boolean)
    .map(item =>
      String(item)
        .replace(/\.$/, "")
        .trim()
    )
    .join("; ");
},

  composeLocal(packet = {}, activeDialogueState = null, characterIdentity = null) {
    const q = String(packet.userQuestion || "").trim();
    const character =
      packet.character ||
      packet.evidence?.character ||
      null;

    if (character?.enabled && character?.draft) {
      return this.returnFinal(
        character.draft,
        "character_fallback_draft",
        packet,
        activeDialogueState,
        characterIdentity
      );
    }

    if (this.isDeveloperRelevant(packet)) {
      return this.returnFinal(
        "I need current file evidence or a current writer draft before giving a code patch. I should not reuse an older conversation-history answer.",
        "developer_guarded",
        packet,
        activeDialogueState,
        characterIdentity
      );
    }

    return this.returnFinal(
      q
        ? "I can answer that, but the current AI Writer draft was missing. I’m using a safe fallback instead of pulling from old conversation history."
        : "Yeah. I’m here.",
      "general_fallback",
      packet,
      activeDialogueState,
      characterIdentity
    );
  },

resolveWriterValidation(packet = {}) {
  const aiWriter = packet.evidence?.aiWriter || {};

  if (aiWriter.usedAI === true) {
    return "ai_writer_draft";
  }

  return (
    aiWriter.fallbackReason ||
    aiWriter.reason ||
    "ai_writer_fallback"
  );
},

  returnFinal(text = "", validation = "passed", packet = null, activeDialogueState = null, characterIdentity = null) {
    const finalText = String(text || "").trim() || "Yeah. I’m here.";

    return {
      languageMode: packet?.primary || "general_understanding",
      languageBody: finalText,
      languageSections: [finalText],
      finalResponse: finalText,
      composerVersion: this.version,
      source: "ari-language-composer-v9",
      composerUsedAI: validation === "ai_writer_draft",
      composerValidation: validation,
      composerDebug: {
        usedPacket: true,
        staleHistoryFinalResponseIgnored: true,
        developerRelevant: this.isDeveloperRelevant(packet || {}),
        activeDialogueState,
        characterIdentity,
        packet
      }
    };
  }
};

console.log(
  "ARI LANGUAGE COMPOSER V9 LOADED:",
  window.AriLanguageComposerV9?.version
);