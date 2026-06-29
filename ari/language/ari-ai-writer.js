// ari/language/ari-ai-writer.js
// Purpose: AI drafting only. Does not choose lane or override packet.
// V1.0.4 — Universal Safe Writer / Developer-Gated / No Question Templates

window.Ari = window.Ari || {};

window.AriAIWriter = {
  version: "1.0.4",

  async write(input = {}) {
    const packet = input.composerPacket || input;

    if (!packet?.ready) {
      return this.returnDraft(
        this.generalFallback({ userQuestion: "" }),
        "composer_packet_missing"
      );
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
          return this.returnDraft(String(text).trim(), "ai_writer_success", true);
        }
      }
    } catch (error) {
      console.warn("AriAIWriter failed:", error);
    }

    return this.returnDraft(
      this.localDraftText(safePacket),
      "ai_unavailable",
      false
    );
  },

  buildSafePacket(packet = {}) {
    const developerRelevant = this.isDeveloperRelevant(packet);

    if (developerRelevant) {
      return packet;
    }

    return {
      ...packet,
      developerPacket: null,
      hasDeveloperPacket: false,
      developerPacketLocked: false,
      developerPacketAdvisory: false,
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

    if (developerPacket?.enabled === true && developerPacket.locked === true) {
      return true;
    }

    const explicitCodeFile =
      /\b[\w/-]+\.(js|html|css|json|md|ts|tsx|jsx)\b/i.test(question);

    const repoContext =
      /\b(github|repo|repository|branch|commit|deploy|vercel|supabase|pull request|merge|codebase)\b/i.test(question);

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

THESIS:
${JSON.stringify(packet.thesis || {}, null, 2)}

STYLE:
${JSON.stringify(packet.humanLanguageProfile || {}, null, 2)}

EVIDENCE:
${JSON.stringify(packet.evidence || {}, null, 2)}

DEVELOPER RELEVANT:
${developerRelevant ? "yes" : "no"}

RULES:
- Answer the user's actual question.
- Do not use stale GitHub/file evidence unless developer relevance is yes.
- Do not render unlocked developer packets as final answers.
- Locked developer replies may be used only if locked is true.
- Do not dump JSON investigation steps unless the user asks for them.
- Do not invent missing facts.
- Do not mention internal pipeline names.
- Be direct, natural, concise, and specific.
`.trim();
  },

  localDraftText(packet = {}) {
    const developerRelevant = this.isDeveloperRelevant(packet);
    const developerPacket =
      packet.developerPacket ||
      packet.evidence?.developerPacket ||
      null;
    const github = packet.evidence?.github || null;

    if (developerRelevant && github?.content) {
      return this.githubFallback(packet, github);
    }

    if (developerRelevant && developerPacket?.enabled && developerPacket.locked !== true) {
      return "I have developer context, but it is not final-answer locked. I should use it as background, answer directly, and avoid dumping an investigation template.";
    }

    if (developerRelevant) {
      return "I need exact repo evidence before proposing a code change. The next move is to read or search the specific file tied to the request.";
    }

    return this.generalFallback(packet);
  },

  githubFallback(packet = {}, github = {}) {
    const question = String(packet.userQuestion || "").toLowerCase();
    const filePath = github.filePath || "the loaded file";
    const content = String(github.content || "");

    const requestedMascot =
      question.includes("mascot") ||
      question.includes("avatar") ||
      question.includes("ari face") ||
      question.includes("ari character");

    const hasMascotEvidence =
      /mascot|ari-hero|ari-avatar|ari-mascot|ari-bubble|ari-face|ari-character/i.test(content);

    if (requestedMascot && !hasMascotEvidence) {
      return `I read ${filePath}, but the loaded evidence does not show the Ari mascot markup. I should not guess. Read the full homepage area around the Ari hero/avatar/bubble markup before removing anything.`;
    }

    return `I read ${filePath}. I should answer only from the visible file evidence and clearly name what is missing before suggesting a patch.`;
  },

  generalFallback(packet = {}) {
    const question = String(packet.userQuestion || "").trim();
    const primary = String(packet.primary || "general_understanding");

    if (!question) {
      return "Yeah. I’m here.";
    }

    if (primary === "teacher" || question.endsWith("?")) {
      return "I can answer that directly, but the AI draft was unavailable. Try once more and I’ll answer from the current question, not stale file evidence.";
    }

    return "I’m here. The AI draft was unavailable, but I won’t use stale developer evidence for a normal conversation.";
  },

  returnDraft(text = "", reason = "fallback", usedAI = false) {
    const draft = String(text || "").trim() || "Yeah. I’m here.";

    return {
      aiWriterRan: true,
      aiWriterUsedAI: usedAI === true,
      aiWriterSource: "ari-ai-writer",
      aiWriterVersion: this.version,
      aiWriterFallbackReason: usedAI ? null : reason,
      draft,
      aiWriterDraft: draft
    };
  }
};

console.log("ARI AI WRITER LOADED:", window.AriAIWriter.version);