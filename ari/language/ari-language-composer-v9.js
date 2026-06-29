// ari/language/ari-language-composer-v9.js
// Purpose: Final response writer from sealed composerPacket only.
// V9.1.0 — Packet-Locked Composer / Developer + AI Writer Aware

window.Ari = window.Ari || {};

window.AriLanguageComposerV9 = {
  version: "9.1.0",

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

    if (developerPacket?.enabled && developerPacket.reply) {
      return this.returnFinal(
        developerPacket.reply,
        "developer_packet_reply",
        packet
      );
    }

    if (packet.evidence?.developerHandoff?.reply) {
      return this.returnFinal(
        packet.evidence.developerHandoff.reply,
        "developer_handoff_reply",
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

    if (packet.primary === "builder" && packet.evidence?.github?.content) {
      return this.composeGithub(packet);
    }

    const aiDraft =
      packet.evidence?.aiWriter?.draft ||
      packet.aiWriterDraft ||
      summary.aiWriterDraft ||
      input.aiWriterDraft ||
      packet.draft ||
      summary.draft ||
      input.draft ||
      "";

    if (String(aiDraft || "").trim()) {
      return this.returnFinal(
        String(aiDraft).trim(),
        packet.evidence?.aiWriter?.usedAI ? "ai_writer_draft" : "ai_writer_fallback",
        packet
      );
    }

    return this.composeLocal(packet);
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

    if (question.includes("where")) {
      const lines = content.split("\n");
      const matches = lines
        .map((line, i) => ({
          line: i + 1,
          text: line.trim()
        }))
        .filter(item => item.text)
        .slice(0, 12);

      return this.returnFinal(
        [
          `I read ${filePath}. Relevant loaded lines:`,
          "",
          ...matches.map(item => `Line ${item.line}: ${item.text}`)
        ].join("\n"),
        "github_lines",
        packet
      );
    }

    return this.returnFinal(
      `I read ${filePath}. The answer should be based only on the loaded file evidence, not a guess.`,
      "github_grounded",
      packet
    );
  },

  composeLocal(packet = {}) {
    const q = String(packet.userQuestion || "").trim();
    const lower = q.toLowerCase();

    if (
      lower.includes("should ari treat") ||
      lower.includes("artifact modification") ||
      lower.includes("file context")
    ) {
      return this.returnFinal(
        "No. Ari should not treat that as an artifact modification just because the prior thread was about code. If no usable file context is loaded, Ari should answer it as a routing/explanation question or say file context is missing. Prior code context can inform the answer, but it should not trigger a patch by itself.",
        "meta_routing_answer",
        packet
      );
    }

    if (packet.primary === "builder") {
      return this.returnFinal(
        "Yes — but only with exact file evidence or a clear requested change. Otherwise Ari should diagnose first, not patch blindly.",
        "builder_guarded",
        packet
      );
    }

    if (packet.primary === "teacher") {
      return this.returnFinal(
        "I can explain it, but the AI Writer draft was missing, so I’m using a safe teacher fallback.",
        "teacher_fallback",
        packet
      );
    }

    return this.returnFinal(
      q
        ? "I can answer, but the AI Writer draft was missing, so I’m using a safe fallback instead of echoing your question."
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
        packet
      }
    };
  }
};

console.log("ARI LANGUAGE COMPOSER V9 LOADED:", window.AriLanguageComposerV9?.version);