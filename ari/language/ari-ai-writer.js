// ari/language/ari-ai-writer.js
// Purpose: AI drafting only. Does not choose lane or override packet.
// V1.0.3 — Developer Evidence Gated / Normal Chat Safe

window.Ari = window.Ari || {};

window.AriAIWriter = {
  version: "1.0.3",

  async write(input = {}) {
    const packet = input.composerPacket || input;

    if (!packet?.ready) {
      return this.localDraft(packet, "composer_packet_missing");
    }

    const safePacket = this.buildSafePacket(packet);
    const instruction = this.buildInstruction(safePacket);

    try {
      if (
        window.AriOpenAIKnowledgeClient &&
        typeof window.AriOpenAIKnowledgeClient.ask === "function"
      ) {
        const result = await window.AriOpenAIKnowledgeClient.ask({
          question: safePacket.userQuestion || "",
          aiInstruction: instruction,
          composerPacket: safePacket
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

    return this.localDraft(safePacket, "ai_unavailable");
  },

  buildSafePacket(packet = {}) {
    const developerRelevant = this.isDeveloperRelevant(packet);

    if (developerRelevant) return packet;

    return {
      ...packet,
      developerPacket: null,
      hasDeveloperPacket: false,
      evidence: {
        ...(packet.evidence || {}),
        github: null,
        developerPacket: null,
        developerIntent: null,
        developerHandoff: null,
        developerResponse: null,
        developerReply: null,
        codeUnderstanding: null,
        developerUnderstanding: null
      }
    };
  },

  isDeveloperRelevant(packet = {}) {
    const question = String(packet.userQuestion || "").toLowerCase();
    const primary = String(packet.primary || "").toLowerCase();
    const shape = String(packet.responseShape || "").toLowerCase();

    const developerPacket =
      packet.developerPacket ||
      packet.evidence?.developerPacket ||
      null;

    const explicitDeveloperLanguage =
      /\b(github|repo|repository|branch|commit|deploy|vercel|supabase|code|file|read|search|patch|debug|fix|update|replace|remove|edit)\b/i.test(question) ||
      /\b[\w/-]+\.(js|html|css|json|md|ts|tsx|jsx)\b/i.test(question);

    const developerMode =
      primary === "developer" ||
      primary === "builder" ||
      primary === "coding" ||
      shape.includes("developer") ||
      shape.includes("build") ||
      shape.includes("patch");

    const lockedDeveloperPacket =
      developerPacket?.enabled === true &&
      developerPacket.locked === true;

    return Boolean(
      lockedDeveloperPacket ||
      developerMode ||
      explicitDeveloperLanguage
    );
  },

  buildInstruction(packet = {}) {
    const developerRelevant = this.isDeveloperRelevant(packet);

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
- Developer/file evidence is relevant: ${developerRelevant ? "yes" : "no"}.
- If developer/file evidence is not relevant, ignore GitHub evidence completely.
- Locked developer replies may be used directly.
- Unlocked developer packets are context only.
- Do not print investigation steps unless the user specifically asks for them.
- Do not say you can patch or edit unless the packet gives exact evidence.
- If GitHub evidence is only a snippet and the user asked about code, say what the snippet actually contains.
- If the requested code object is not visible in loaded evidence, say that clearly.

GENERAL RULES:
- Answer the user's actual question.
- Do not let stale file evidence override a normal conversation.
- Do not invent missing facts.
- Do not mention internal pipeline names.
- Be direct, natural, and concise.
`.trim();
  },

  localDraft(packet = {}, reason = "fallback") {
    const question = String(packet.userQuestion || "").toLowerCase();
    const github = packet.evidence?.github || null;
    const developerPacket =
      packet.developerPacket ||
      packet.evidence?.developerPacket ||
      null;

    const developerRelevant = this.isDeveloperRelevant(packet);

    let draft = this.generalFallback(packet);

    if (developerRelevant && github?.content) {
      const filePath = github.filePath || "the loaded file";
      const content = String(github.content || "");

      if (
        question.includes("mascot") &&
        !/mascot|ari-hero|ari-avatar|ari-mascot|ari-bubble|ari-face|ari-character/i.test(content)
      ) {
        draft =
          `I read ${filePath}, but the loaded evidence does not show the Ari mascot markup. I should not guess. Read the full homepage area around the Ari hero/avatar/bubble markup before removing anything.`;
      } else {
        draft =
          `I read ${filePath}. I should answer only from the visible file evidence and clearly say what is missing before suggesting a patch.`;
      }
    } else if (developerRelevant && developerPacket?.enabled && developerPacket.locked !== true) {
      draft =
        "I have developer context, but it is not locked as a final answer. I should use it as background and answer directly without dumping an investigation template.";
    } else if (developerRelevant && packet.primary === "builder") {
      draft =
        "I need exact file evidence before giving a patch. The next step is to read the relevant file or search the repo for the exact target.";
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
  },

  generalFallback(packet = {}) {
    const q = String(packet.userQuestion || "").toLowerCase().trim();

    if (q.includes("favorite color")) {
      return "I’d pick deep navy blue — calm, sharp, and very CalBuddy.";
    }

    if (q.startsWith("what is") || q.startsWith("what's")) {
      return "I can answer that, but the AI draft was unavailable, so I’m using a safe fallback.";
    }

    return "Yeah. I’m here. Tell me what’s going on.";
  }
};

console.log("ARI AI WRITER LOADED:", window.AriAIWriter.version);