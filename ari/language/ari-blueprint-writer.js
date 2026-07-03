// ari/language/ari-blueprint-writer.js
// Purpose: Fast reusable local drafts from expression blueprints.
// V1.1.0 — Knowledge Meaning Packet Aware / Blueprint-Safe / AI Writer Friendly

window.Ari = window.Ari || {};

window.AriBlueprintWriter = {
  version: "1.1.0",

  write(input = {}) {
    const packet = input.composerPacket || input.packet || input || {};
    const question = String(packet.userQuestion || "").trim();

    if (!packet?.ready || !question) {
      return this.returnDraft("", "blueprint_packet_missing", false);
    }

    const knowledgeMeaning = this.getKnowledgeMeaning(packet);

    if (knowledgeMeaning?.usable) {
      const blueprint = this.resolveKnowledgeBlueprint(packet, knowledgeMeaning);
      const draft = this.renderKnowledgeDraft({ packet, question, knowledgeMeaning, blueprint });

      return this.returnDraft(
        draft,
        "blueprint_knowledge_meaning_packet",
        true,
        {
          ...blueprint,
          strategy: "knowledge_meaning",
          responseGoal: "answer_from_knowledge_meaning",
          aiAllowed: true,
          knowledgeMeaningUsed: true,
          knowledgeAnswerMode: knowledgeMeaning.answerMode,
          knowledgeDomain: knowledgeMeaning.domain,
          knowledgeIntent: knowledgeMeaning.intent,
          aiWritingInstructions: knowledgeMeaning.composerInstruction || "",
          blueprintInstruction: knowledgeMeaning.blueprintInstruction || ""
        }
      );
    }

    const legacyKnowledgeDraft = this.composeSupabaseKnowledge(packet);

    if (legacyKnowledgeDraft) {
      return this.returnDraft(
        legacyKnowledgeDraft,
        "blueprint_legacy_supabase_knowledge_draft",
        true,
        {
          id: "legacy_supabase_knowledge_draft",
          strategy: "knowledge",
          responseGoal: "answer_from_retrieved_knowledge",
          aiAllowed: true
        }
      );
    }

    const blueprint = this.resolveBlueprint(packet);

    if (!blueprint) {
      return this.returnDraft("", "no_matching_blueprint", false);
    }

    const draft = this.renderDraft({ packet, blueprint, question });

    if (!draft) {
      return this.returnDraft("", "blueprint_no_local_draft", false, blueprint);
    }

    return this.returnDraft(draft, `blueprint_${blueprint.id}`, true, blueprint);
  },

  getKnowledgeMeaning(packet = {}) {
    return (
      packet.evidence?.knowledgeMeaning ||
      packet.evidence?.knowledgeSynthesis ||
      packet.knowledgeMeaning ||
      packet.knowledgeSynthesis ||
      packet.summary?.knowledgeMeaning ||
      packet.summary?.knowledgeSynthesis ||
      null
    );
  },

  resolveKnowledgeBlueprint(packet = {}, meaning = {}) {
    const mode = meaning.answerMode || "general_knowledge";

    const map = {
      identity_or_character: "knowledge_identity_answer",
      memory_recall: "knowledge_memory_recall",
      medical_guidance: "knowledge_medical_guidance",
      developer: "knowledge_developer_analysis",
      definition: "knowledge_definition",
      explanation: "knowledge_explanation",
      decision: "knowledge_decision",
      relationship_advice: "knowledge_relationship_advice",
      relationship_meaning: "knowledge_relationship_advice",
      life_advice: "knowledge_life_advice",
      advice: "knowledge_life_advice",
      writing: "knowledge_writing_context",
      general_knowledge: "knowledge_clear_explanation"
    };

    const id = map[mode] || "knowledge_clear_explanation";

    return this.blueprints[id] || this.blueprints.knowledge_clear_explanation;
  },

  renderKnowledgeDraft({ packet = {}, question = "", knowledgeMeaning = {}, blueprint = {} } = {}) {
    const mode = knowledgeMeaning.answerMode || "general_knowledge";
    const domain = knowledgeMeaning.domain || "general";
    const intent = knowledgeMeaning.intent || "general";

    const directAnswer = this.cleanForUser(knowledgeMeaning.directAnswer || "");
    const keyFacts = Array.isArray(knowledgeMeaning.keyFacts)
      ? knowledgeMeaning.keyFacts.map(x => this.cleanForUser(x)).filter(Boolean)
      : [];

    const cautions = Array.isArray(knowledgeMeaning.cautions)
      ? knowledgeMeaning.cautions.map(x => this.cleanForUser(x)).filter(Boolean)
      : [];

    const doNotSay = Array.isArray(knowledgeMeaning.doNotSay)
      ? knowledgeMeaning.doNotSay
      : [];

    switch (mode) {
      case "identity_or_character":
        return this.renderIdentityKnowledge({ directAnswer, keyFacts, cautions });

      case "memory_recall":
        return this.renderMemoryKnowledge({ directAnswer, keyFacts, cautions });

      case "medical_guidance":
        return this.renderMedicalKnowledge({ directAnswer, keyFacts, cautions });

      case "developer":
        return this.renderDeveloperKnowledge({ directAnswer, keyFacts, cautions });

      case "definition":
        return this.renderDefinitionKnowledge({ directAnswer, keyFacts });

      case "explanation":
        return this.renderExplanationKnowledge({ question, directAnswer, keyFacts, domain, intent });

      case "decision":
        return this.renderDecisionKnowledge({ directAnswer, keyFacts, cautions });

      case "relationship_advice":
      case "relationship_meaning":
        return this.renderRelationshipKnowledge({ directAnswer, keyFacts, cautions });

      case "life_advice":
      case "advice":
        return this.renderAdviceKnowledge({ directAnswer, keyFacts, cautions });

      case "writing":
        return directAnswer || "Use the retrieved knowledge as context for the writing request.";

      default:
        return this.renderGeneralKnowledge({ directAnswer, keyFacts, cautions, doNotSay });
    }
  },

  renderIdentityKnowledge({ directAnswer = "", keyFacts = [], cautions = [] } = {}) {
    const answer = directAnswer || keyFacts[0] || "I don’t have a fixed answer for that in my saved character knowledge.";
    return this.polishResponse([
      answer,
      keyFacts[1] || "",
      cautions.includes("Do not invent unsupported Ari preferences, memories, or personality facts.")
        ? "So I should answer honestly instead of making up a fake preference."
        : ""
    ], 3, "conversation");
  },

  renderMemoryKnowledge({ directAnswer = "", keyFacts = [], cautions = [] } = {}) {
    return this.polishResponse([
      directAnswer || keyFacts[0] || "Here’s what I can pull from memory.",
      keyFacts[1] || "",
      cautions[0] || ""
    ], 3, "direct");
  },

  renderMedicalKnowledge({ directAnswer = "", keyFacts = [], cautions = [] } = {}) {
    return this.polishResponse([
      directAnswer || keyFacts[0] || "This is worth treating carefully.",
      keyFacts[1] || "",
      cautions[0] || "If symptoms are severe, worsening, unusual, or come with red flags, contact a clinician."
    ], 4, "conversation");
  },

  renderDeveloperKnowledge({ directAnswer = "", keyFacts = [], cautions = [] } = {}) {
    return this.polishResponse([
      directAnswer || keyFacts[0] || "The code evidence points to a specific bottleneck.",
      keyFacts[1] || "",
      cautions[0] || ""
    ], 4, "direct");
  },

  renderDefinitionKnowledge({ directAnswer = "", keyFacts = [] } = {}) {
    return this.polishResponse([
      directAnswer || keyFacts[0] || "Here’s the clean definition.",
      keyFacts[1] || ""
    ], 3, "textbook");
  },

  renderExplanationKnowledge({ question = "", directAnswer = "", keyFacts = [], domain = "", intent = "" } = {}) {
    const q = String(question || "").toLowerCase();

    const asksCanAffect = /\b(can|does|could)\b/.test(q);
    const asksSleepMoodCravings =
      q.includes("sleep") &&
      (q.includes("mood") || q.includes("cravings"));

    if (asksSleepMoodCravings) {
      return this.polishResponse([
        "Yes — sleep can affect both mood and cravings.",
        "Poor sleep can make you more irritable, less patient, and more emotionally reactive.",
        "It can also increase cravings because tired brains tend to push harder for quick energy and comfort.",
        "So if your mood or appetite feels off, sleep is one of the first foundation pieces to check."
      ], 4, "direct");
    }

    if (asksCanAffect) {
      return this.polishResponse([
        this.makeYesAnswer(question),
        this.bestUserFacingFact(keyFacts, directAnswer),
        keyFacts[1] || ""
      ], 3, "direct");
    }

    return this.polishResponse([
      directAnswer || keyFacts[0] || "Yes, that connection makes sense.",
      keyFacts[1] || "",
      keyFacts[2] || ""
    ], 4, "direct");
  },

  renderDecisionKnowledge({ directAnswer = "", keyFacts = [], cautions = [] } = {}) {
    return this.polishResponse([
      directAnswer || keyFacts[0] || "This is mainly a tradeoff decision.",
      keyFacts[1] || "",
      cautions[0] || "The safest move is usually the next reversible step, not the biggest irreversible leap."
    ], 4, "direct");
  },

  renderRelationshipKnowledge({ directAnswer = "", keyFacts = [], cautions = [] } = {}) {
    return this.polishResponse([
      directAnswer || keyFacts[0] || "This is about the pattern, not just the latest argument.",
      keyFacts[1] || "",
      cautions[0] || "Keep the first move about repair, not blame."
    ], 3, "conversation");
  },

  renderAdviceKnowledge({ directAnswer = "", keyFacts = [], cautions = [] } = {}) {
    return this.polishResponse([
      directAnswer || keyFacts[0] || "The main move is to turn this into one practical next step.",
      keyFacts[1] || "",
      cautions[0] || ""
    ], 3, "conversation");
  },

  renderGeneralKnowledge({ directAnswer = "", keyFacts = [], cautions = [] } = {}) {
    return this.polishResponse([
      directAnswer || keyFacts[0] || "Yes — that matters here.",
      keyFacts[1] || "",
      cautions[0] || ""
    ], 3, "direct");
  },

  makeYesAnswer(question = "") {
    const q = String(question || "").toLowerCase();

    if (q.includes("sleep")) return "Yes — sleep can definitely affect that.";
    if (q.includes("stress")) return "Yes — stress can definitely affect that.";
    if (q.includes("nutrition") || q.includes("food")) return "Yes — nutrition can definitely affect that.";

    return "Yes — it can affect that.";
  },

  bestUserFacingFact(keyFacts = [], directAnswer = "") {
    const all = [directAnswer, ...keyFacts].map(x => this.cleanForUser(x)).filter(Boolean);

    const badPatterns = [
      /\btreat .* as\b/i,
      /\bari should\b/i,
      /\bhelp ari\b/i,
      /\bwhen people describe\b/i,
      /\bconsider whether\b/i
    ];

    const userFacing = all.find(text => !badPatterns.some(pattern => pattern.test(text)));
    return userFacing || all[0] || "";
  },

  resolveBlueprint(packet = {}) {
    const id =
      packet.blueprintHint ||
      packet.expressionPlan?.blueprintId ||
      packet.mouthDirective?.blueprintHint ||
      "general_direct_response";

    return this.blueprints[id] || this.blueprints.general_direct_response;
  },

  renderDraft({ packet = {}, blueprint = {}, question = "" } = {}) {
    const terms = packet.evidence?.lexicalGrounding?.preferredTerms || {};
    const component =
      terms.composerComponent?.short ||
      terms.thingToFix?.short ||
      "that";

    const bodyProblem = terms.bodyProblem?.short || "that pain";

    const decision =
      terms.decisionOption?.short ||
      terms.centralTradeoff?.short ||
      "the choice";

    switch (blueprint.id) {
      case "emotion_presence_grounding":
        return "Yeah, I hear you. Don’t try to solve the whole thing from this mood. Do one stabilizing move first: stand up, drink some water, and take 5–10 minutes away from the screen. Then come back and choose the next step with a clearer head.";

      case "emotion_balance_repair":
        return "Yeah — this is one of those moments where the thing itself may not be the enemy, but the imbalance is. Your body, mood, and relationship are starting to pay the bill. Do one repair move today: take a 10-minute walk, then say, “You’re right to worry. I’ve been off balance, and I’m going to protect time for my health and for us.”";

      case "decision_tradeoff":
        return `The real issue is the tradeoff, not just ${decision}. Separate it into two questions: what matters most right now, and what can wait without causing damage. My move would be: pick the option that protects the highest-priority thing first, then make the next step small enough to actually do.`;

      case "builder_direct_help":
        return `Yes — for ${component}, keep it practical: identify the exact file, make one contained patch, then test the timing/output before changing anything else. Don’t merge three more ideas into this until the current path is stable.`;

      case "knowledge_clear_explanation":
        return "Yes. The simplest way to think about it is: answer the direct question first, then explain only enough to make the answer usable. Don’t turn every answer into a lecture.";

      case "relationship_repair_clarity":
        return "The move is not to win the argument. It is to lower the temperature and repair trust. Say the true thing plainly, own your part without over-apologizing, and ask for one concrete next step you both can actually do.";

      case "medical_context_calm_guidance":
        return `For ${bodyProblem}, treat it seriously but don’t panic. Start with the safest simple step: monitor severity, avoid anything that worsens it, and contact a clinician if it is severe, worsening, unusual, or comes with red flags.`;

      case "memory_direct_acknowledgment":
        return "Got it. I’ll keep that in mind.";

      case "wisdom_principle_then_step":
        return "The principle is simple: don’t let urgency pretend to be importance. Pick the next move that protects what matters long term, not just what feels loud right now.";

      case "safety_urgent_support":
        return "Pause everything else and focus on immediate safety. Get away from the danger if you can, contact emergency help or a trusted person nearby, and do not handle this alone.";

      default:
        return "Yes. The clean move is to answer the current question directly, keep it specific, and give one useful next step instead of overcomplicating it.";
    }
  },

  composeSupabaseKnowledge(packet = {}) {
    const knowledge = packet.evidence?.knowledge || {};
    const nodes = Array.isArray(knowledge.nodes) ? knowledge.nodes : [];
    const question = String(packet.userQuestion || "").trim();
    const q = question.toLowerCase();

    if (!knowledge.shouldUseKnowledge || !nodes.length) return "";

    const node = nodes[0] || {};
    const topic = node.topic || node.lesson || "this";

    const definition = this.cleanForUser(node.definition || "");
    const summary = this.cleanForUser(node.summary || "");
    const deep = this.cleanForUser(node.deep_understanding || "");

    const style = this.detectKnowledgeStyle(q);

    const isDefinition =
      /\b(what is|define|definition|meaning of|what does.*mean)\b/.test(q);

    const isCause =
      /\b(why|what'?s going on|what is going on|how does|can .* affect|does .* affect|could .* affect|explain)\b/.test(q);

    let sentences = [];

    if (isDefinition || style === "textbook") {
      sentences = [
        definition || summary || `${topic} is the main idea here.`,
        this.pickBestSupport({ q, summary, deep, style })
      ];
    } else if (isCause) {
      sentences = [
        this.buildDirectAnswer(topic, q, style),
        this.pickBestSupport({ q, summary, deep, style })
      ];
    } else {
      sentences = [
        summary || definition || `${topic} matters here.`,
        this.pickBestSupport({ q, summary, deep, style })
      ];
    }

    return this.polishResponse(sentences, 4, style);
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

  pickBestSupport({ q = "", summary = "", deep = "", style = "conversation" } = {}) {
    const source = deep || summary || "";
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
        .replace(
          /\bPoor sleep can amplify stress, worsen mood, weaken discipline, reduce patience, increase cravings, impair judgment, and make ordinary problems feel much harder\./i,
          "When sleep is off, your patience, mood, cravings, and judgment can all take a hit."
        )
        .replace(/\bSleep is not wasted time\.\s*/i, "")
        .replace(/\bIt is one of the core systems that allows humans to\b/i, "It helps you");
    }

    return best;
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

  blueprints: {
    knowledge_identity_answer: {
      id: "knowledge_identity_answer",
      strategy: "identity",
      responseGoal: "answer_character_question",
      structure: ["direct_answer", "grounding", "honest_boundary"],
      aiAllowed: true
    },

    knowledge_memory_recall: {
      id: "knowledge_memory_recall",
      strategy: "memory",
      responseGoal: "answer_from_memory",
      structure: ["known_fact", "context", "uncertainty_if_needed"],
      aiAllowed: true
    },

    knowledge_medical_guidance: {
      id: "knowledge_medical_guidance",
      strategy: "medical",
      responseGoal: "safe_guidance",
      structure: ["direct_answer", "practical_guidance", "red_flags"],
      medicalBoundary: true,
      aiAllowed: true
    },

    knowledge_developer_analysis: {
      id: "knowledge_developer_analysis",
      strategy: "developer",
      responseGoal: "diagnose_and_patch",
      structure: ["diagnosis", "evidence", "patch"],
      aiAllowed: true
    },

    knowledge_definition: {
      id: "knowledge_definition",
      strategy: "define",
      responseGoal: "clear_definition",
      structure: ["definition", "meaning", "example_if_useful"],
      aiAllowed: true
    },

    knowledge_explanation: {
      id: "knowledge_explanation",
      strategy: "explain",
      responseGoal: "clear_causal_answer",
      structure: ["direct_answer", "mechanism", "practical_implication"],
      aiAllowed: true
    },

    knowledge_decision: {
      id: "knowledge_decision",
      strategy: "decision",
      responseGoal: "choose_next_step",
      structure: ["tradeoff", "recommendation", "next_step"],
      aiAllowed: true
    },

    knowledge_relationship_advice: {
      id: "knowledge_relationship_advice",
      strategy: "relationship",
      responseGoal: "repair_or_understand_pattern",
      structure: ["name_pattern", "reduce_blame", "repair_step"],
      aiAllowed: true
    },

    knowledge_life_advice: {
      id: "knowledge_life_advice",
      strategy: "life_advice",
      responseGoal: "practical_next_step",
      structure: ["direct_answer", "meaning", "one_step"],
      aiAllowed: true
    },

    knowledge_writing_context: {
      id: "knowledge_writing_context",
      strategy: "writing_context",
      responseGoal: "support_writing_task",
      structure: ["context_only"],
      aiAllowed: true
    },

    emotion_presence_grounding: {
      id: "emotion_presence_grounding",
      strategy: "present",
      responseGoal: "stabilize",
      aiAllowed: true
    },

    emotion_balance_repair: {
      id: "emotion_balance_repair",
      strategy: "repair",
      responseGoal: "restore_balance",
      aiAllowed: false
    },

    decision_tradeoff: {
      id: "decision_tradeoff",
      strategy: "organize",
      responseGoal: "choose_next_step",
      aiAllowed: true
    },

    builder_direct_help: {
      id: "builder_direct_help",
      strategy: "build",
      responseGoal: "fix_or_patch",
      aiAllowed: true
    },

    knowledge_clear_explanation: {
      id: "knowledge_clear_explanation",
      strategy: "explain",
      responseGoal: "understand",
      aiAllowed: true
    },

    relationship_repair_clarity: {
      id: "relationship_repair_clarity",
      strategy: "repair",
      responseGoal: "reduce_conflict",
      aiAllowed: true
    },

    medical_context_calm_guidance: {
      id: "medical_context_calm_guidance",
      strategy: "guide",
      responseGoal: "safe_next_step",
      medicalBoundary: true,
      aiAllowed: true
    },

    safety_urgent_support: {
      id: "safety_urgent_support",
      strategy: "protect",
      responseGoal: "immediate_safety",
      aiAllowed: false
    },

    memory_direct_acknowledgment: {
      id: "memory_direct_acknowledgment",
      strategy: "acknowledge",
      responseGoal: "confirm",
      aiAllowed: false
    },

    wisdom_principle_then_step: {
      id: "wisdom_principle_then_step",
      strategy: "principle",
      responseGoal: "clarify_values",
      aiAllowed: true
    },

    general_direct_response: {
      id: "general_direct_response",
      strategy: "answer",
      responseGoal: "help",
      aiAllowed: true
    }
  },

  returnDraft(text = "", reason = "fallback", usedBlueprint = false, blueprint = null) {
    const draft = String(text || "").trim();

    return {
      blueprintWriterRan: true,
      blueprintWriterUsedBlueprint: usedBlueprint === true,
      blueprintWriterSource: "ari-blueprint-writer",
      blueprintWriterVersion: this.version,
      blueprintWriterReason: reason,
      blueprint: blueprint || null,
      blueprintId: blueprint?.id || null,
      draft,
      blueprintWriterDraft: draft
    };
  }
};

window.Ari.blueprintWriter = window.AriBlueprintWriter;

console.log("ARI BLUEPRINT WRITER LOADED:", window.AriBlueprintWriter.version);