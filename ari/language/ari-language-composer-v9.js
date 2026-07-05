// ari/language/ari-language-composer-v9.js
// Purpose: Final response renderer from sealed composerPacket + selected arbiter draft.
// V9.3.1 — Thin Composer / Honest Unknown Fallback / No Empty Ari Reply

window.Ari = window.Ari || {};

window.AriLanguageComposerV9 = {
  version: "9.3.1",

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

    const activeDialogueState = this.readActiveDialogueState({ packet, summary, input });
    const characterIdentity = this.readCharacterIdentity({ packet, summary, input });

    const lockedReply = this.getLockedReply(packet, summary);
    if (lockedReply) {
      return this.returnFinal(
        lockedReply,
        "locked_developer_reply",
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

    const selectedDraft = this.getSelectedDraft({ packet, summary, input });

    if (selectedDraft) {
      return this.returnFinal(
        selectedDraft,
        this.resolveSelectedDraftValidation({ packet, summary, selectedDraft }),
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

  getLockedReply(packet = {}, summary = {}) {
    const developerPacket =
      packet.developerPacket ||
      packet.evidence?.developerPacket ||
      summary.composerDeveloperPacket ||
      null;

    if (
      developerPacket?.enabled === true &&
      developerPacket.locked === true &&
      String(developerPacket.reply || "").trim()
    ) {
      return String(developerPacket.reply).trim();
    }

    const handoff =
      packet.evidence?.developerHandoff ||
      summary.developerHandoff ||
      null;

    if (
      handoff?.responseLocked === true &&
      String(handoff.reply || handoff.finalResponse || "").trim()
    ) {
      return String(handoff.reply || handoff.finalResponse).trim();
    }

    return "";
  },

  getSelectedDraft({ packet = {}, summary = {}, input = {} } = {}) {
    const candidates = [
      packet.selectedDraft,
      packet.finalResponseCandidate,
      summary.selectedDraft,
      summary.finalResponseCandidate,
      input.selectedDraft,

      // Legacy fallback only if arbiter did not provide anything.
      packet.blueprintWriterDraft,
      summary.blueprintWriterDraft,
      packet.evidence?.aiWriter?.draft,
      packet.aiWriterDraft,
      summary.aiWriterDraft
    ];

    for (const candidate of candidates) {
      const text = String(candidate || "").trim();
      if (!text) continue;
      if (this.isStaleOrWrongContextReply(text, packet)) continue;
      return text;
    }

    return "";
  },

  resolveSelectedDraftValidation({ packet = {}, summary = {}, selectedDraft = "" } = {}) {
    const draft = String(selectedDraft || "").trim();

    if (
      draft &&
      (
        draft === String(packet.selectedDraft || "").trim() ||
        draft === String(summary.selectedDraft || "").trim() ||
        draft === String(packet.finalResponseCandidate || "").trim() ||
        draft === String(summary.finalResponseCandidate || "").trim()
      )
    ) {
      return summary.selectedDraftSource
        ? `arbiter_selected_${summary.selectedDraftSource}`
        : "arbiter_selected_draft";
    }

    const blueprintDraft = String(
      packet.blueprintWriterDraft ||
      summary.blueprintWriterDraft ||
      ""
    ).trim();

    if (draft && draft === blueprintDraft) {
      return "blueprint_writer_draft";
    }

    const aiDraft = String(
      packet.evidence?.aiWriter?.draft ||
      packet.aiWriterDraft ||
      summary.aiWriterDraft ||
      ""
    ).trim();

    if (draft && draft === aiDraft) {
      return "ai_writer_draft";
    }

    return "writer_fallback";
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

    return Boolean(
      developerMode ||
      explicitCodeFile ||
      (repoContext && codeAction)
    );
  },

  isStaleOrWrongContextReply(text = "", packet = {}) {
    const t = String(text || "").toLowerCase();
    const q = String(packet.userQuestion || "").toLowerCase();

    const diagnosticKnowledgePreview =
      /^mode:\s*\w+/i.test(t) &&
      t.includes("domain:") &&
      t.includes("intent:") &&
      t.includes("direct answer:");

    if (diagnosticKnowledgePreview) return true;

    const fileReply =
      t.includes("i read ") ||
      t.includes("loaded evidence") ||
      t.includes("loaded snippet") ||
      t.includes("github evidence") ||
      t.includes("file content");

    if (fileReply && !this.isDeveloperRelevant(packet)) return true;

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

  composeLocal(packet = {}, activeDialogueState = null, characterIdentity = null) {
    const q = String(packet.userQuestion || "").trim();
    const character = packet.character || packet.evidence?.character || null;

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
        "I need current file evidence or a selected writer draft before giving a code patch. I should not reuse an older conversation-history answer.",
        "developer_guarded",
        packet,
        activeDialogueState,
        characterIdentity
      );
    }

    return this.returnFinal(
  this.honestUnknownFallback(),
  "honest_unknown_fallback",
  packet,
  activeDialogueState,
  characterIdentity
);
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

honestUnknownFallback() {
  return "I know what you're asking, but I don't know the answer right now. I'd rather be honest than make something up.";
},

  returnFinal(
    text = "",
    validation = "passed",
    packet = null,
    activeDialogueState = null,
    characterIdentity = null
  ) {
    const finalText =
  String(text || "").trim() ||
  this.honestUnknownFallback();

    return {
      languageMode: packet?.primary || "general_understanding",
      languageBody: finalText,
      languageSections: [finalText],
      finalResponse: finalText,
      composerVersion: this.version,
      source: "ari-language-composer-v9",
      composerUsedAI: validation === "ai_writer_draft" || validation.includes("ai_writer"),
      composerValidation: validation,
      composerDebug: {
        usedPacket: true,
        thinComposer: true,
        arbiterFirst: true,
        staleHistoryFinalResponseIgnored: true,
        supabaseKnowledgeComposerRemoved: true,
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