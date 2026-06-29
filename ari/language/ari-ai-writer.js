// ari/language/ari-ai-writer.js
// Purpose: AI drafting only. Does not choose lane or override packet.
// V1.0.0

window.Ari = window.Ari || {};

window.AriAIWriter = {
  version: "1.0.0",

  async write(packet = {}) {
    if (!packet?.ready) {
      return this.localDraft(packet, "composer_packet_missing");
    }

    const instruction = this.buildInstruction(packet);

    try {
      if (
        window.AriOpenAIKnowledgeClient &&
        typeof window.AriOpenAIKnowledgeClient.ask === "function"
      ) {
        const result = await window.AriOpenAIKnowledgeClient.ask({
          aiInstruction: instruction,
          composerPacket: packet
        });

        const text =
          result.finalResponse ||
          result.knowledgeAnswer ||
          result.response ||
          result.text ||
          "";

        if (String(text || "").trim()) {
          return {
            aiWriterRan: true,
            aiWriterUsedAI: true,
            aiWriterSource: "ari-ai-writer",
            aiWriterVersion: this.version,
            draft: String(text).trim()
          };
        }
      }
    } catch (error) {
      console.warn("AriAIWriter failed:", error);
    }

    return this.localDraft(packet, "ai_unavailable");
  },

  buildInstruction(packet = {}) {
    return `
You are Ari.

Write the final user-facing answer using ONLY this composer packet.

USER QUESTION:
${packet.userQuestion}

PRIMARY:
${packet.primary}

RESPONSE SHAPE:
${packet.responseShape}

RESPONSE RULES:
${(packet.responseRules || []).map(x => "- " + x).join("\n") || "- Answer directly."}

THESIS / NARRATIVE:
${JSON.stringify(packet.thesis || {}, null, 2)}

EVIDENCE:
${JSON.stringify(packet.evidence || {}, null, 2)}

STYLE:
${JSON.stringify(packet.humanLanguageProfile || {}, null, 2)}

RULES:
- Answer the user’s actual question.
- Do not invent missing facts.
- Do not mention internal pipeline names.
- Do not say primary lane, contract, triage, observer, composer packet, or handoff.
- If file evidence is present, ground the answer in that evidence.
- If no file evidence is present, do not pretend you saw a file.
- Be direct, natural, and concise.
`.trim();
  },

  localDraft(packet = {}, reason = "fallback") {
    const question = packet.userQuestion || "";

    let draft = question
      ? `The direct answer: ${question}`
      : "Yeah. I’m here. Tell me what’s going on.";

    if (packet.primary === "builder") {
      draft = "Yes — but only if Ari has real file context or a clear developer command. Otherwise, she should explain what’s missing instead of pretending she can patch it.";
    }

    return {
      aiWriterRan: true,
      aiWriterUsedAI: false,
      aiWriterSource: "ari-ai-writer",
      aiWriterVersion: this.version,
      aiWriterFallbackReason: reason,
      draft
    };
  }
};

console.log("ARI AI WRITER LOADED:", window.AriAIWriter.version);