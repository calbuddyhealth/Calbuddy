// ari/language/ari-language-composer-v9.js
// Purpose: Final response writer from sealed composerPacket only.
// V9.1.3 — No Stale History Reuse / Current Writer First

window.Ari = window.Ari || {};

window.AriLanguageComposerV9 = {
  version: "9.1.3",

  async compose(input = {}) {
    const summary = input.summary || input || {};

    const packet =
      input.composerPacket ||
      summary.composerPacket ||
      input;

    if (!packet?.ready) {
      return this.returnFinal(
        "I don’t have a valid composer packet. Diagnostic: composer packet missing.",
        "diagnostic_no_packet",
        packet
      );
    }

    const developerPacket =
      packet.developerPacket ||
      packet.evidence?.developerPacket ||
      summary.composerDeveloperPacket ||
      null;

    if (
      developerPacket?.enabled &&
      developerPacket.locked === true &&
      developerPacket.reply
    ) {
      return this.returnFinal(
        developerPacket.reply,
        "developer_packet_locked_reply",
        packet
      );
    }

    if (
      packet.evidence?.developerHandoff?.responseLocked === true &&
      packet.evidence?.developerHandoff?.reply
    ) {
      return this.returnFinal(
        packet.evidence.developerHandoff.reply,
        "developer_handoff_locked_reply",
        packet
      );
    }

    if (packet.safety?.gate?.shouldStopNormalResponse) {
      return this.returnFinal(
        packet.safety.gate.response ||
          packet.safety.gate.message ||
          "I need to pause normal answering because this may involve safety.",
        "safety_gate_response",
        packet
      );
    }

    const aiDraft = this.getCurrentWriterDraft({ packet, summary, input });

    if (aiDraft) {
      return this.returnFinal(
        aiDraft,
        packet.evidence?.aiWriter?.usedAI
          ? "ai_writer_draft"
          : "ai_writer_fallback",
        packet
      );
    }

    if (
      packet.primary === "builder" &&
      packet.evidence?.github?.content
    ) {
      return this.composeGithub(packet);
    }

    return this.composeLocal(packet);
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
      if (this.isStaleHistoryReply(text, packet)) continue;

      return text;
    }

    return "";
  },

  isStaleHistoryReply(text = "", packet = {}) {
    const t = String(text || "").toLowerCase();
    const q = String(packet.userQuestion || "").toLowerCase();

    const staleFileReply =
      t.includes("i read index.html") &&
      t.includes("loaded snippet") &&
      t.includes("does not show");

    const currentQuestionStillAsksSameFileIssue =
      q.includes("mascot") ||
      q.includes("homepage") ||
      q.includes("index.html");

    return staleFileReply && !currentQuestionStillAsksSameFileIssue;
  },

  composeGithub(packet = {}) {
    const github = packet.evidence.github;
    const filePath = github.filePath || "the file";
    const content = String(github.content || "").trim();
    const question = String(packet.userQuestion || "").toLowerCase();

    if (!content) {
      return this.returnFinal(
        `I have ${filePath}, but no readable file content came through.`,
        "github_missing_content",
        packet
      );
    }

    if (
      question.includes("mascot") &&
      !/mascot|ari-hero|ari-avatar|ari-mascot|ari-bubble|ari-face|ari-character/i.test(content)
    ) {
      return this.returnFinal(
        `I read ${filePath}, but the loaded content does not include the Ari mascot markup. Ari should not guess a patch from unrelated code. Load the full homepage section or the style file that contains the mascot selector before removing anything.`,
        "github_missing_requested_object",
        packet
      );
    }

    return this.returnFinal(
      `I read ${filePath}. Based on the loaded evidence, Ari should answer only from the current file content and avoid reusing older saved replies.`,
      "github_grounded",
      packet
    );
  },

  composeLocal(packet = {}) {
    const q = String(packet.userQuestion || "").trim();

    if (packet.primary === "builder") {
      return this.returnFinal(
        "Ari needs current file evidence or a current writer draft before giving a patch. She should not reuse an older conversation history answer.",
        "builder_guarded",
        packet
      );
    }

    return this.returnFinal(
      q
        ? "I can answer, but the current AI Writer draft was missing, so I’m using a safe fallback instead of pulling from old conversation history."
        : "Yeah. I’m here. Tell me what’s going on.",
      "general_fallback",
      packet
    );
  },

  returnFinal(text = "", validation = "passed", packet = null) {
    return {
      languageMode: packet?.primary || "general_understanding",
      languageBody: text,
      languageSections: [text],
      finalResponse: text,
      composerVersion: this.version,
      source: "ari-language-composer-v9",
      composerUsedAI: validation === "ai_writer_draft",
      composerValidation: validation,
      composerDebug: {
        usedPacket: true,
        staleHistoryFinalResponseIgnored: true,
        packet
      }
    };
  }
};

console.log("ARI LANGUAGE COMPOSER V9 LOADED:", window.AriLanguageComposerV9?.version);