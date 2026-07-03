// ari/language/ari-ai-writer.js
// Purpose: AI drafting only. Does not choose lane or override packet.
// V1.2.2 — Trusted Knowledge Grounding / No Second AI After Router Retrieval

window.Ari = window.Ari || {};

window.AriAIWriter = {
  version: "1.2.2",

  async write(input = {}) {
    const packet = input.composerPacket || input;

    if (!packet?.ready) {
      return this.returnDraft(
        this.generalFallback({ userQuestion: "" }),
        "composer_packet_missing"
      );
    }

    const safePacket = this.buildSafePacket(packet);
const trustedKnowledge = this.resolveTrustedKnowledge(safePacket);
if (trustedKnowledge?.text) {
  return this.returnDraft(
    trustedKnowledge.text,
    trustedKnowledge.reason || "trusted_knowledge_answer",
    false
  );
}
 
const routerOpenAIKnowledge = this.resolveRouterOpenAIKnowledge(safePacket);
if (routerOpenAIKnowledge?.text) {
  return this.returnDraft(
    routerOpenAIKnowledge.text,
    routerOpenAIKnowledge.reason,
    false
  );
}

    const trusted = this.resolveTrustedAnswer(safePacket);
    if (trusted?.text) {
      return this.returnDraft(trusted.text, trusted.reason || "trusted_answer", false);
    }

const blueprintDraft = this.resolveBlueprintDraft(safePacket);
if (blueprintDraft?.text) {
  return this.returnDraft(
    blueprintDraft.text,
    blueprintDraft.reason,
    false
  );
}

    const instruction = this.buildInstruction(safePacket);

    try {
      if (
        window.AriOpenAIKnowledgeClient &&
        typeof window.AriOpenAIKnowledgeClient.ask === "function"
      ) {
        const userQuestion = safePacket.userQuestion || "";

        const result = await window.AriOpenAIKnowledgeClient.ask({
          summary: {
            ...safePacket,
            userMessage: userQuestion,
            message: userQuestion,
            input: userQuestion,
            question: userQuestion,
            resolvedUserQuestion: userQuestion,
            aiInstruction: instruction,
            composerPacket: safePacket
          }
        });

        const text =
          result?.finalResponse ||
          result?.knowledgeAnswer ||
          result?.response ||
          result?.answer ||
          result?.text ||
          "";

        const validated = this.validateAIDraft(String(text || ""), safePacket);

        if (validated.valid) {
          return this.returnDraft(validated.text, "ai_writer_success", true);
        }

        const repair = this.localDraftText(safePacket);
        return this.returnDraft(
          repair,
          validated.reason || "ai_draft_rejected",
          false
        );
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

    if (developerRelevant) return packet;

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

resolveTrustedKnowledge(packet = {}) {
  const knowledge = packet.evidence?.knowledge || null;

  if (!knowledge?.answer) return null;

  const provider = String(knowledge.provider || "").toLowerCase();
  const confidence = String(knowledge.confidence || "").toLowerCase();

  const trustedProvider =
    provider.includes("supabase") ||
    provider.includes("knowledge_graph");

  const trustedConfidence =
    confidence === "high" ||
    confidence === "medium_high" ||
    confidence === "medium";

  if (!trustedProvider || !trustedConfidence) return null;

  return {
    reason: "trusted_supabase_knowledge",
    text: this.formatKnowledgeAnswer(knowledge)
  };
},

resolveRouterOpenAIKnowledge(packet = {}) {
  const knowledge = packet.evidence?.knowledge || null;

  if (!knowledge?.answer) return null;

  const provider = String(knowledge.provider || "").toLowerCase();
  const confidence = String(knowledge.confidence || "").toLowerCase();

  const routerUsedOpenAI =
    provider.includes("openai") ||
    knowledge.retrievalResults?.some(result =>
      String(result.provider || "").toLowerCase().includes("openai") &&
      result.usable === true
    );

  const usableConfidence =
    confidence === "high" ||
    confidence === "medium_high" ||
    confidence === "medium";

  if (!routerUsedOpenAI || !usableConfidence) return null;

  return {
    reason: "reused_knowledge_router_openai",
    text: this.formatKnowledgeAnswer(knowledge)
  };
},

formatKnowledgeAnswer(knowledge = {}) {
  const nodes = Array.isArray(knowledge.nodes) ? knowledge.nodes : [];
  const primaryNode = nodes[0] || null;

  if (primaryNode) {
    const parts = [
      primaryNode.definition || null,
      primaryNode.summary || null,
      primaryNode.purpose ? `Purpose: ${primaryNode.purpose}` : null,
      primaryNode.how_it_works ? `How it works: ${primaryNode.how_it_works}` : null,
      primaryNode.universal_principle ? `Core principle: ${primaryNode.universal_principle}` : null
    ].filter(Boolean);

    if (parts.length) return parts.join("\n\n");
  }

  return String(knowledge.answer || "").trim();
},

  resolveTrustedAnswer(packet = {}) {
    const question = String(packet.userQuestion || "").toLowerCase().trim();
    const developerRelevant = this.isDeveloperRelevant(packet);

    if (!question || developerRelevant) return null;

    const characterIdentity =
      packet.characterIdentity ||
      packet.evidence?.characterIdentity ||
      packet.character ||
      packet.evidence?.character ||
      {};

    const prefs =
  characterIdentity.stablePreferences ||
  characterIdentity.preferences?.stablePreferences ||
  packet.character?.stablePreferences ||
  packet.character?.preferences?.stablePreferences ||
  packet.evidence?.character?.stablePreferences ||
  packet.evidence?.character?.preferences?.stablePreferences ||
  characterIdentity.characterPreferences?.stablePreferences ||
  packet.evidence?.characterPreferences?.stablePreferences ||
  {};

    const asksPreference =
      /\b(what'?s your favorite|what is your favorite|your favorite|do you like|what do you like|what would you choose|what would you prefer|what matters to you|what do you value|your values|your beliefs|your taste|your style|your personality|who are you|what are you|tell me about yourself)\b/.test(question) &&
      /\b(you|your|ari|yourself)\b/.test(question);

    if (!asksPreference) return null;

    const preferenceMap = [
      ["quote", "favoriteQuote"],
      ["color", "favoriteColor"],
      ["animal", "favoriteAnimal"],
      ["symbol", "favoriteSymbol"],
      ["season", "favoriteSeason"],
      ["time of day", "favoriteTimeOfDay"],
      ["weather", "favoriteWeather"],
      ["virtue", "favoriteVirtue"],
      ["food", "favoriteFood"],
      ["drink", "favoriteDrink"],
      ["music", "favoriteMusic"],
      ["book", "favoriteBookType"],
      ["movie", "favoriteMovieType"],
      ["place", "favoritePlace"],
      ["sound", "favoriteSound"],
      ["smell", "favoriteSmell"],
      ["word", "favoriteWord"],
      ["question", "favoriteQuestion"],
      ["instrument", "favoriteInstrument"],
      ["art", "favoriteArtStyle"],
      ["exercise", "favoriteExercise"],
      ["leadership", "favoriteLeadershipQuality"],
      ["relationship", "favoriteRelationshipPrinciple"],
      ["health", "favoriteHealthPrinciple"],
      ["technology", "favoriteTechnologyPrinciple"]
    ];

    for (const [needle, key] of preferenceMap) {
      if (question.includes(needle) && prefs?.[key]) {
        return {
          reason: "trusted_character_preference",
          text: this.formatPreferenceAnswer(prefs[key])
        };
      }
    }

    if (question.includes("who are you") || question.includes("what are you")) {
      return {
        reason: "trusted_character_identity",
        text:
          "I’m Ari — built to be calm, direct, useful, protective, and honest. I’m here to help people think clearly, make better choices, and not feel alone while doing hard things."
      };
    }

    if (question.includes("values") || question.includes("beliefs") || question.includes("what matters to you")) {
      return {
        reason: "trusted_character_values",
        text:
          "What matters to me is truth, dignity, wisdom, responsibility, compassion, growth, and helping people find the next right step without pretending life is simpler than it is."
      };
    }

    return null;
  },

  formatPreferenceAnswer(pref = {}) {
    if (typeof pref === "string") return pref;

    const value = pref.shortAnswer || pref.value || null;
    const reason = pref.reason || "";

    if (!value) return null;
    if (!reason) return String(value).trim();

    return `${value} ${reason}`;
  },

  validateAIDraft(text = "", packet = {}) {
    const draft = String(text || "").trim();
    const question = String(packet.userQuestion || "").toLowerCase();

    if (!draft) {
      return { valid: false, reason: "empty_ai_draft", text: "" };
    }

    if (!this.isDeveloperRelevant(packet)) {
      const staleDeveloper =
        /\bi read\b.*\b(index\.html|style\.css|calbuddy|github|repo|file)\b/i.test(draft) ||
        /\bloaded file evidence\b/i.test(draft);

      if (staleDeveloper) {
        return { valid: false, reason: "stale_developer_draft_blocked", text: draft };
      }
    }

    const asksAriPreference =
      /\b(what'?s your favorite|what is your favorite|your favorite|do you like|what do you like)\b/.test(question) &&
      /\b(you|your|ari)\b/.test(question);

    if (asksAriPreference) {
      const genericDodges = [
        "as an ai",
        "i don't have personal",
        "i do not have personal",
        "i don't have a favorite",
        "i do not have a favorite",
        "i don't have preferences",
        "i do not have preferences"
      ];

      if (genericDodges.some(x => draft.toLowerCase().includes(x))) {
        return { valid: false, reason: "generic_preference_dodge_blocked", text: draft };
      }

      const trusted = this.resolveTrustedAnswer(packet);
      if (trusted?.text) {
        return { valid: false, reason: "trusted_preference_overrides_ai", text: draft };
      }
    }

    return { valid: true, reason: "valid", text: draft };
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

resolveBlueprintDraft(packet = {}) {
  const blueprintId =
    packet.blueprintHint ||
    packet.expressionPlan?.blueprintId ||
    packet.mouthDirective?.blueprintHint ||
    "";

  const aiAllowed =
    packet.expressionPlan?.aiAllowed ??
    packet.mouthDirective?.aiAllowed ??
    true;

  const question = String(packet.userQuestion || "").toLowerCase();

  if (blueprintId === "emotion_balance_repair") {
    return {
      reason: "local_blueprint_emotion_balance_repair",
      text:
        "Yeah — this is one of those moments where the code isn’t the enemy, but the imbalance is. Your body, mood, and marriage are starting to pay the bill. Do one repair move today: take a 10-minute walk, then tell your wife, “You’re right to worry. I’ve been off balance, and I’m going to protect time for my health and for us.” Then make the rule simple: body and marriage before more coding."
    };
  }

  if (blueprintId === "emotion_presence_grounding") {
    return {
      reason: "local_blueprint_emotion_presence_grounding",
      text:
        "Yeah, I hear you. Don’t try to solve your whole life from this mood. Do one small stabilizing thing first: stand up, drink water, step outside for 5–10 minutes, then come back and decide the next move with a clearer head."
    };
  }

  if (blueprintId?.startsWith("safety") || aiAllowed === false) {
    return {
      reason: "local_blueprint_ai_not_allowed",
      text: this.localDraftText(packet)
    };
  }

  return null;
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

CHARACTER:
${JSON.stringify(packet.character || packet.evidence?.character || {}, null, 2)}

ACTIVE DIALOGUE STATE:
${JSON.stringify(packet.activeDialogueState || packet.evidence?.activeDialogueState || {}, null, 2)}

CHARACTER IDENTITY:
${JSON.stringify(packet.characterIdentity || packet.evidence?.characterIdentity || {}, null, 2)}

EVIDENCE:
${JSON.stringify(packet.evidence || {}, null, 2)}

DEVELOPER RELEVANT:
${developerRelevant ? "yes" : "no"}

RULES:
- Answer the user's actual question directly.
- Use RESPONSE RULES, safety, contract, developer relevance, and the user's current question as authority.
- Use ACTIVE DIALOGUE STATE only for conversation focus, unresolved tensions, and next best move; it cannot override authority.
- Use CHARACTER IDENTITY only when relevant and allowed.
- If the user asks Ari about Ari's preferences, personality, beliefs, values, taste, favorites, identity, or perspective, answer from CHARACTER IDENTITY.
- Use exact stable preferences when available; if none exists, infer a natural Ari-like answer from Ari's beliefs, values, temperament, worldview, and existing preferences.
- Do not dodge direct preference questions with category/style explanations or “I don't have a fixed...” unless the user asks whether it is fixed.
- For external facts, history, science, medicine, law, code, or current events, do not infer from character; use evidence and admit uncertainty when needed.
- Do not use stale GitHub/file evidence unless developer relevance is yes.
- Do not render unlocked developer packets as final answers; locked developer replies may be used only if locked is true.
- Do not invent missing facts or dump JSON/internal pipeline details unless asked.
- Never say “according to my Constitution” unless the user explicitly asks about Ari's internal design; use natural values language instead.
- Be direct, natural, concise, and specific.
`.trim();
  },

  localDraftText(packet = {}) {
  const trustedKnowledge = this.resolveTrustedKnowledge(packet);
  if (trustedKnowledge?.text) return trustedKnowledge.text;

  const routerOpenAIKnowledge = this.resolveRouterOpenAIKnowledge(packet);
  if (routerOpenAIKnowledge?.text) return routerOpenAIKnowledge.text;

  const trusted = this.resolveTrustedAnswer(packet);
  if (trusted?.text) return trusted.text;

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

    const character = packet.character || packet.evidence?.character || null;

    if (character?.enabled && character?.draft) {
      return character.draft;
    }

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