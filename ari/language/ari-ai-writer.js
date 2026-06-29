// ari/language/ari-ai-writer.js
// Purpose: AI drafting only. Does not choose lane or override packet.
// V1.0.2 — Evidence-Aware Natural Writer

window.Ari = window.Ari || {};

window.AriAIWriter = {
  version: "1.0.2",

  async write(input = {}) {
    const packet = input.composerPacket || input;

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
          question: packet.userQuestion || "",
          aiInstruction: instruction,
          composerPacket: packet
        });

        const text =
          result?.finalResponse ||
          result?.knowledgeAnswer ||
          result?.response ||
          result?.answer ||
          result?.text ||
          "";

        if (String(text || "").trim()) {
          return {
            aiWriterRan: true,
            aiWriterUsedAI: true,
            aiWriterSource: "ari-ai-writer",
            aiWriterVersion: this.version,
            draft: String(text).trim(),
            aiWriterDraft: String(text).trim()
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
${packet.userQuestion || ""}

PRIMARY:
${packet.primary || "general_understanding"}

RESPONSE SHAPE:
${packet.responseShape || "clear_explanation"}

RESPONSE RULES:
${(packet.responseRules || []).map(x => "- " + x).join("\n") || "- Answer directly."}

THESIS / NARRATIVE:
${JSON.stringify(packet.thesis || {}, null, 2)}

STYLE:
${JSON.stringify(packet.humanLanguageProfile || {}, null, 2)}

EVIDENCE:
${JSON.stringify(packet.evidence || {}, null, 2)}

DEVELOPER RULES:
- Locked developer replies may be used directly.
- Unlocked developer packets are context only.
- Do not print investigation steps unless the user specifically asks for them.
- Do not say you can patch or edit unless the packet gives exact evidence.
- If GitHub evidence is only a snippet, say what the snippet actually contains.
- If the requested object is not visible in the loaded evidence, say that clearly.
- Recommend the next specific file or section needed.

GENERAL RULES:
- Answer the user's actual question.
- Do not invent missing facts.
- Do not mention internal pipeline names.
- Do not say primary lane, contract, triage, observer, composer packet, or handoff.
- Be direct, natural, and concise.
`.trim();
  },

  localDraft(packet = {}, reason = "fallback") {
    const question = String(packet.userQuestion || "").toLowerCase();
    const github = packet.evidence?.github || null;
    const developerPacket = packet.developerPacket || packet.evidence?.developerPacket || null;

    let draft = "Yeah. I’m here. Tell me what’s going on.";

    if (github?.content) {
      const filePath = github.filePath || "the loaded file";
      const content = String(github.content || "");

      if (
        question.includes("mascot") &&
        !/mascot|ari-hero|ari-avatar|ari-mascot|ari-bubble|ari-face|ari-character/i.test(content)
      ) {
        draft =
          `I read ${filePath}, but the loaded snippet does not show the Ari mascot markup. It only shows the homepage action grid. To remove the mascot safely, Ari needs the part of index.html or style.css that contains the mascot, likely around ari-hero, Ari image/avatar, or bubble markup.`;
      } else {
        draft =
          `I read ${filePath}. Based on the loaded evidence, Ari should answer only from what is visible there and say what is missing instead of guessing.`;
      }
    } else if (developerPacket?.enabled && developerPacket.locked !== true) {
      draft =
        "Ari has a developer task, but it is not locked as a final answer. She should use it as context, explain what evidence is missing, and avoid dumping the investigation plan as the response.";
    } else if (packet.primary === "builder") {
      draft =
        "Ari needs exact file evidence before giving a patch. She should name the likely files, say what is missing, and avoid pretending she found code that was not loaded.";
    }

    return {
      aiWriterRan: true,
      aiWriterUsedAI: false,
      aiWriterSource: "ari-ai-writer",
      aiWriterVersion: this.version,
      aiWriterFallbackReason: reason,
      draft,
      aiWriterDraft: draft
    };
  }
};

console.log("ARI AI WRITER LOADED:", window.AriAIWriter.version);