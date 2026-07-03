// ari/language/ari-language-composer-v9.js
// Purpose: Final response writer from sealed composerPacket only.
// V9.2.4 — Blueprint Draft First / Writer Validation Reason / No Stale History

window.Ari = window.Ari || {};

window.AriLanguageComposerV9 = {
  version: "9.2.4",

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
      packet.blueprintWriterDraft,
      summary.blueprintWriterDraft,
      input.blueprintWriterDraft,
      packet.blueprintWriter?.draft,
      summary.blueprintWriter?.draft,
      input.blueprintWriter?.draft,

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

  const plan = packet.communicationPlan || {};
  const budget = plan.languageBudget || {};
  const maxSentences = budget.maxSentences || 5;

  const node = nodes[0] || {};
  const topic = node.topic || node.lesson || "this";
  const definition = this.cleanForUser(node.definition || "");
  const summary = this.cleanForUser(node.summary || "");
  const deep = this.cleanForUser(node.deep_understanding || "");
  const use = this.cleanForUser(node.how_ari_should_use_this || "");

  const style = this.detectKnowledgeStyle(q);

  const isDefinition =
    /\b(what is|define|definition|meaning of|what does.*mean)\b/.test(q);

  const isAdvice =
    /\b(what should i do|how do i|help|where do i start|what can i do|advice|fix|improve|deal with)\b/.test(q);

  const isCause =
    /\b(why|what'?s going on|what is going on|how does|can .* affect|does .* affect|explain)\b/.test(q);

  const userState =
    /\b(i am|i'm|im|i feel|my|me|i have|i keep|i can'?t|i cannot)\b/.test(q);

  let sentences = [];

  if (isDefinition || style === "textbook") {
    sentences = [
      definition || summary || `${topic} is the main idea here.`,
      this.pickBestSupport({ q, summary, deep, use, style })
    ];
  } else if (isAdvice) {
    sentences = [
      userState
        ? `Yeah — ${topic.toLowerCase()} may be part of what is going on.`
        : `${topic} is probably the right place to start.`,
      this.pickBestSupport({ q, summary, deep, use, style }),
      this.buildOneNextStep(node, q)
    ];
  } else if (isCause || userState) {
    sentences = [
      this.buildDirectAnswer(topic, q, style),
      this.pickBestSupport({ q, summary, deep, use, style }),
      this.buildMeaningForUser(node, q)
    ];
  } else {
    sentences = [
      summary || definition || `${topic} matters here.`,
      this.pickBestSupport({ q, summary, deep, use, style })
    ];
  }

  return this.polishResponse(sentences, maxSentences, style);
},

detectKnowledgeStyle(q = "") {
  if (
    /\b(define|definition|what is|textbook|explain fully|explain in detail|technical|scientific)\b/.test(q)
  ) {
    return "textbook";
  }

  if (
    /\b(i feel|i'm|im|my|me|what'?s going on|what is going on|help|what should i do|why am i)\b/.test(q)
  ) {
    return "conversation";
  }

  return "direct";
},

buildDirectAnswer(topic = "", q = "", style = "conversation") {
  const lowerTopic = String(topic || "this").toLowerCase();

  if (/\b(can|does|could)\b/.test(q)) {
    return style === "conversation"
      ? `Yeah — ${lowerTopic} can definitely affect that.`
      : `Yes — ${lowerTopic} can affect that.`;
  }

  if (/\bwhat'?s going on|what is going on|why\b/.test(q)) {
    return style === "conversation"
      ? `What’s probably happening is that ${lowerTopic} is hitting more than one part of your life at once.`
      : `${lowerTopic} may be affecting multiple areas at once.`;
  }

  return style === "conversation"
    ? `This sounds connected to ${lowerTopic}.`
    : `${lowerTopic} is relevant here.`;
},

pickBestSupport({ q = "", summary = "", deep = "", use = "", style = "conversation" } = {}) {
  const source = deep || use || summary || "";
  if (!source) return "";

  const sentences = this.splitSentences(source);

  const scored = sentences
    .map(sentence => ({
      sentence,
      score: this.relevanceScore(sentence, q)
    }))
    .sort((a, b) => b.score - a.score);

  let best = scored[0]?.sentence || sentences[0] || "";

  if (style === "conversation") {
    best = best
      .replace(/\bPoor sleep can amplify stress, worsen mood, weaken discipline, reduce patience, increase cravings, impair judgment, and make ordinary problems feel much harder\./i,
        "When sleep is off, your patience, mood, cravings, and judgment can all take a hit.")
      .replace(/\bSleep is not wasted time\.\s*/i, "")
      .replace(/\bIt is one of the core systems that allows humans to\b/i, "It helps you");
  }

  return best;
},

buildMeaningForUser(node = {}, q = "") {
  const topic = String(node.topic || node.lesson || "this").toLowerCase();

  if (topic.includes("sleep")) {
    return "So if you’re more reactive with people, it may be a recovery problem before it’s a personality problem.";
  }

  const practical = Array.isArray(node.practical_applications)
    ? node.practical_applications
    : [];

  const cleaned = practical
    .map(item => this.cleanPractical(item))
    .filter(Boolean);

  return cleaned[0] || `The useful move is to treat ${topic} as a real factor, not as a character flaw.`;
},

buildOneNextStep(node = {}, q = "") {
  const topic = String(node.topic || node.lesson || "this").toLowerCase();

  if (topic.includes("sleep")) {
    return "Start by protecting one sleep block or one recovery habit before trying to fix everything else.";
  }

  const practical = Array.isArray(node.practical_applications)
    ? node.practical_applications
    : [];

  const cleaned = practical
    .map(item => this.cleanPractical(item))
    .filter(Boolean);

  return cleaned[0] || "Start with one small realistic change instead of trying to fix everything at once.";
},

cleanPractical(text = "") {
  return String(text || "")
    .replace(/^Ask about\b/i, "Look at")
    .replace(/^Encourage\b/i, "Try")
    .replace(/^Support\b/i, "Build around")
    .replace(/^Connect\b/i, "Remember that")
    .replace(/^Avoid shaming.*$/i, "Don’t turn this into a shame issue; treat it as a solvable pattern")
    .replace(/^Recommend medical evaluation\b/i, "Consider medical evaluation")
    .replace(/\busers report\b/gi, "you notice")
    .replace(/\busers\b/gi, "you")
    .replace(/\buser\b/gi, "you")
    .replace(/\.$/, "")
    .trim() + ".";
},

cleanForUser(text = "") {
  return String(text || "")
    .replace(/\bAri should\b/gi, "")
    .replace(/\bHelp Ari recognize when\b/gi, "This matters when")
    .replace(/\bHelp Ari\b/gi, "The point is to")
    .replace(/\busers\b/gi, "people")
    .replace(/\buser\b/gi, "person")
    .replace(/\s+/g, " ")
    .trim();
},

splitSentences(text = "") {
  return String(text || "")
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
},

relevanceScore(sentence = "", q = "") {
  const s = String(sentence || "").toLowerCase();
  const words = String(q || "")
    .toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 3);

  let score = 0;

  for (const word of words) {
    if (s.includes(word)) score += 2;
  }

  if (s.includes("affect")) score += 1;
  if (s.includes("because")) score += 1;
  if (s.includes("can")) score += 1;
  if (s.includes("not")) score -= 0.5;

  return score;
},

polishResponse(sentences = [], maxSentences = 5, style = "conversation") {
  const seen = new Set();

  let cleaned = sentences
    .filter(Boolean)
    .map(s => String(s).trim())
    .filter(s => {
      const key = s.toLowerCase().replace(/[^\w\s]/g, "").slice(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxSentences);

  if (style === "conversation") {
    cleaned = cleaned.slice(0, Math.min(cleaned.length, 3));
  }

  return cleaned.join(" ");
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
  if (
    packet.blueprintWriterDraft ||
    packet.blueprintWriter?.draft
  ) {
    return "blueprint_writer_draft";
  }

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