// ari/knowledge/ari-knowledge-meaning-interpreter.js
// Purpose: Convert retrieved knowledge nodes into a structured meaning packet for Blueprint Writer / Composer.
// V2.0.0 — Answer-Mode Meaning Packet Builder / Blueprint-Safe / Low-Template

window.Ari = window.Ari || {};

window.AriKnowledgeMeaningInterpreter = {
  version: "2.0.0",

  interpret(input = {}) {
    const summary = input.summary || input || {};
    const question = this.getQuestion(summary);
    const q = this.normalize(question);

    const knowledge = this.getKnowledge(summary);
    const nodes = knowledge.nodes;

    if (!knowledge.shouldUseKnowledge || !Array.isArray(nodes) || !nodes.length) {
      return this.noInterpretation("No usable knowledge nodes to synthesize.");
    }

    const rankedNodes = this.rankNodes(nodes, q).slice(0, 6);
    const style = this.detectStyle(q);
    const intent = this.detectIntent(q);
    const domain = this.detectDomain(rankedNodes, q);
    const answerMode = this.detectAnswerMode({
      q,
      intent,
      domain,
      nodes: rankedNodes,
      summary
    });

    const synthesis = this.buildModePacket({
      question,
      q,
      nodes: rankedNodes,
      style,
      intent,
      domain,
      answerMode,
      provider: knowledge.provider,
      confidence: knowledge.confidence,
      existingAnswer: knowledge.answer
    });

    return {
      knowledgeMeaningInterpreterRan: true,
      knowledgeMeaningInterpreterVersion: this.version,
      knowledgeMeaningInterpreterSource: "ari-knowledge-meaning-packet-builder",

      knowledgeMeaningUsable: synthesis.usable === true,
      knowledgeMeaning: synthesis,

      knowledgeSynthesis: synthesis,
      knowledgeSynthesisUsable: synthesis.usable === true,

      // Diagnostic only. Blueprint Writer should not treat this as final wording.
      knowledgeSynthesisDraft: synthesis.diagnosticPreview || null,

      // Direct handoff for Blueprint Writer if it supports this field.
      blueprintKnowledgeHandoff: synthesis.blueprintHandoff || null
    };
  },

  getKnowledge(summary = {}) {
    const results =
      summary.knowledgeRetrievalResults ||
      summary.knowledgeRouter?.knowledgeRetrievalResults ||
      [];

    const usable =
      results.find(result => result?.usable === true) ||
      results[0] ||
      {};

    return {
      shouldUseKnowledge: summary.shouldUseKnowledge === true,
      provider: summary.knowledgeProvider || usable.provider || null,
      confidence: summary.knowledgeConfidence || usable.confidence || null,
      answer: summary.knowledgeAnswer || usable.knowledgeAnswer || usable.answer || null,
      nodes:
        summary.knowledgeNodes ||
        usable.nodes ||
        usable.raw?.nodes ||
        usable.raw?.matches ||
        []
    };
  },

  getQuestion(summary = {}) {
    return String(
      summary.resolvedUserQuestion ||
      summary.threadQuestion?.resolvedUserQuestion ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    ).trim();
  },

  buildModePacket({
    question = "",
    q = "",
    nodes = [],
    style = "direct",
    intent = "general",
    domain = "general",
    answerMode = "general_knowledge",
    provider = null,
    confidence = null,
    existingAnswer = null
  } = {}) {
    const mainNodes = nodes.slice(0, 4);
    const bestNode = mainNodes[0] || {};
    const topics = mainNodes.map(node => node.topic || node.lesson || "Untitled");
    const keyFacts = this.extractKeyFacts(mainNodes);
    const directAnswer = this.buildDirectAnswer({
      q,
      nodes: mainNodes,
      bestNode,
      answerMode,
      domain,
      intent,
      existingAnswer
    });

    const cautions = this.buildCautions({
      q,
      nodes: mainNodes,
      answerMode,
      domain,
      intent
    });

    const unsupportedClaims = this.buildUnsupportedClaims({
      q,
      answerMode,
      domain
    });

    const blueprintInstruction = this.buildBlueprintInstruction({
      answerMode,
      domain,
      intent,
      style
    });

    const composerInstruction = this.buildComposerInstruction({
      answerMode,
      domain,
      intent,
      style
    });

    const tone = this.detectTone({
      q,
      answerMode,
      domain,
      style
    });

    const doNotSay = this.buildDoNotSay({
      answerMode,
      domain,
      intent
    });

    const diagnosticPreview = this.buildDiagnosticPreview({
      directAnswer,
      keyFacts,
      cautions,
      answerMode,
      domain,
      intent
    });

    return {
      usable: true,
      synthesizerVersion: this.version,

      question,
      answerMode,
      style,
      intent,
      domain,

      topic: topics[0] || "this",
      topics,

      directAnswer,
      keyFacts,
      cautions,
      unsupportedClaims,

      blueprintInstruction,
      composerInstruction,
      tone,
      doNotSay,

      blueprintHandoff: {
        hasKnowledgeMeaning: true,
        answerMode,
        domain,
        intent,
        directAnswer,
        keyFacts,
        cautions,
        unsupportedClaims,
        instruction: blueprintInstruction,
        tone,
        doNotSay,
        sourceNodeIds: mainNodes.map(node => node.knowledge_id || node.id).filter(Boolean)
      },

      diagnosticPreview,

      sourceProvider: provider,
      sourceConfidence: confidence,
      sourceNodes: mainNodes,
      sourceNodeIds: mainNodes.map(node => node.knowledge_id || node.id).filter(Boolean)
    };
  },

  detectAnswerMode({ q = "", intent = "general", domain = "general", nodes = [], summary = {} } = {}) {
    if (summary.developerIntent || summary.ownerMode || domain === "developer") {
      return "developer";
    }

    if (domain === "medical") {
      return "medical_guidance";
    }

    if (domain === "character") {
      return "identity_or_character";
    }

    if (domain === "memory") {
      return "memory_recall";
    }

    if (this.hasAny(q, ["write", "rewrite", "draft", "caption", "email", "message", "respond to this"])) {
      return "writing";
    }

    if (intent === "definition") {
      return "definition";
    }

    if (intent === "cause_or_explanation") {
      return "explanation";
    }

    if (this.hasAny(q, ["should i", "which one", "what would you do", "best option", "decide", "choice"])) {
      return "decision";
    }

    if (intent === "advice") {
      if (domain === "relationship") return "relationship_advice";
      if (domain === "life") return "life_advice";
      return "advice";
    }

    if (domain === "relationship") {
      return "relationship_meaning";
    }

    return "general_knowledge";
  },

  buildDirectAnswer({
    q = "",
    nodes = [],
    bestNode = {},
    answerMode = "general_knowledge",
    domain = "general",
    intent = "general",
    existingAnswer = null
  } = {}) {
    const explicit =
      this.cleanForUser(existingAnswer) ||
      this.cleanForUser(bestNode.direct_answer) ||
      this.cleanForUser(bestNode.answer) ||
      this.cleanForUser(bestNode.how_ari_should_use_this) ||
      "";

    const strongest =
      explicit ||
      this.cleanForUser(bestNode.deep_understanding) ||
      this.cleanForUser(bestNode.summary) ||
      this.cleanForUser(bestNode.definition) ||
      this.cleanForUser(bestNode.purpose) ||
      "";

    if (answerMode === "identity_or_character") {
      return (
        strongest ||
        "Answer from Ari’s saved character knowledge. If no fixed preference exists, say that honestly and give a values-based answer."
      );
    }

    if (answerMode === "memory_recall") {
      return (
        strongest ||
        "Use the retrieved memory as the source of truth. If the memory does not answer the question directly, say what is known and what is not known."
      );
    }

    if (answerMode === "medical_guidance") {
      return (
        strongest ||
        "Use the relevant health knowledge carefully, give practical next steps, and include appropriate urgent-warning boundaries."
      );
    }

    if (answerMode === "developer") {
      return (
        strongest ||
        "Use the retrieved technical knowledge as evidence, identify the bottleneck, and recommend the safest patch."
      );
    }

    if (answerMode === "definition") {
      return (
        this.cleanForUser(bestNode.definition) ||
        strongest ||
        "Define the concept clearly, then explain why it matters in this situation."
      );
    }

    if (answerMode === "decision") {
      return (
        strongest ||
        "Frame the decision around tradeoffs, risks, priorities, and the next reversible step."
      );
    }

    if (answerMode === "writing") {
      return (
        strongest ||
        "Use the retrieved knowledge only as context for the requested writing task."
      );
    }

    if (answerMode === "relationship_advice" || answerMode === "relationship_meaning") {
      return (
        strongest ||
        "Name the relationship pattern clearly without turning it into blame."
      );
    }

    if (answerMode === "life_advice" || answerMode === "advice") {
      return (
        strongest ||
        "Turn the knowledge into one practical next step tied to the user’s actual situation."
      );
    }

    return strongest || "Use the retrieved knowledge to answer the question directly.";
  },

  extractKeyFacts(nodes = []) {
    const facts = [];

    for (const node of nodes) {
      const candidates = [
        node.summary,
        node.definition,
        node.purpose,
        node.importance,
        node.how_it_works,
        node.deep_understanding
      ];

      for (const candidate of candidates) {
        const cleaned = this.cleanForUser(candidate);
        if (cleaned) facts.push(cleaned);
      }

      if (Array.isArray(node.practical_applications)) {
        for (const item of node.practical_applications) {
          const cleaned = this.cleanForUser(item);
          if (cleaned) facts.push(cleaned);
        }
      }
    }

    return this.unique(facts).slice(0, 6);
  },

  buildCautions({ q = "", nodes = [], answerMode = "general_knowledge", domain = "general", intent = "general" } = {}) {
    const cautions = [];

    for (const node of nodes) {
      const caution =
        this.cleanForUser(node.caution) ||
        this.cleanForUser(node.boundary) ||
        this.cleanForUser(node.limitations);

      if (caution) cautions.push(caution);
    }

    if (answerMode === "identity_or_character") {
      cautions.push("Do not invent unsupported Ari preferences, memories, or personality facts.");
      cautions.push("If the knowledge does not contain a fixed answer, say so plainly.");
    }

    if (answerMode === "memory_recall") {
      cautions.push("Do not pretend to remember details that are not present in the retrieved memory.");
    }

    if (answerMode === "medical_guidance") {
      cautions.push("Do not diagnose. Give general guidance and clear urgent-care boundaries when symptoms could be serious.");
    }

    if (answerMode === "developer") {
      cautions.push("Do not recommend a patch unless it follows from the code evidence.");
    }

    if (answerMode === "writing") {
      cautions.push("Do not let knowledge synthesis override the user’s requested format or tone.");
    }

    if (domain === "relationship") {
      cautions.push("Avoid blame-first framing. Name the pattern and the repair move.");
    }

    return this.unique(cautions).slice(0, 5);
  },

  buildUnsupportedClaims({ q = "", answerMode = "general_knowledge", domain = "general" } = {}) {
    const claims = [];

    if (answerMode === "identity_or_character") {
      claims.push("Ari has a fixed favorite, preference, memory, or backstory unless a node explicitly says so.");
    }

    if (answerMode === "memory_recall") {
      claims.push("Specific past events or user details not present in retrieved memory.");
    }

    if (answerMode === "medical_guidance") {
      claims.push("Diagnosis, certainty, or reassurance that symptoms are harmless without evidence.");
    }

    if (answerMode === "developer") {
      claims.push("Claims about files, functions, or bugs not supported by visible code.");
    }

    return claims;
  },

  buildBlueprintInstruction({ answerMode = "general_knowledge", domain = "general", intent = "general", style = "direct" } = {}) {
    const base = "Use knowledgeMeaning as evidence, not as final wording. Preserve Blueprint Writer authority over structure, length, and final response plan.";

    const map = {
      identity_or_character:
        "Answer directly from character knowledge. If the knowledge does not support a fixed preference, say that honestly and answer from Ari’s values instead.",
      memory_recall:
        "Answer only from retrieved memory. Separate known facts from uncertainty.",
      medical_guidance:
        "Give practical, cautious health guidance. Include urgent red flags when appropriate. Do not diagnose.",
      developer:
        "Use code/evidence first. Identify the bottleneck, explain why it affects quality, and recommend a safe patch.",
      definition:
        "Define the concept plainly, then explain why it matters for the user’s question.",
      explanation:
        "Explain the mechanism or cause clearly. Avoid turning the whole answer into generic advice.",
      decision:
        "Compare options, tradeoffs, risks, and give a grounded recommendation when enough context exists.",
      relationship_advice:
        "Name the pattern, reduce blame, and suggest one repair move.",
      relationship_meaning:
        "Interpret the relationship pattern without over-therapizing.",
      life_advice:
        "Translate the knowledge into one concrete next step.",
      advice:
        "Give direct advice grounded in the retrieved knowledge.",
      writing:
        "Use knowledge as context only. The user’s requested writing artifact controls the output.",
      general_knowledge:
        "Answer the actual question directly using the retrieved knowledge."
    };

    return `${base} ${map[answerMode] || map.general_knowledge}`;
  },

  buildComposerInstruction({ answerMode = "general_knowledge", domain = "general", intent = "general", style = "direct" } = {}) {
    const instructions = [
      "Write naturally.",
      "Do not expose internal field names.",
      "Do not say 'relevant factors' unless the user asked for analysis.",
      "Do not copy diagnosticPreview verbatim."
    ];

    if (answerMode === "identity_or_character") {
      instructions.push("Sound personal and direct, not like a coaching template.");
    }

    if (answerMode === "developer") {
      instructions.push("Be blunt, technical, and patch-oriented.");
    }

    if (answerMode === "medical_guidance") {
      instructions.push("Be calm, practical, and safety-aware.");
    }

    if (style === "conversation") {
      instructions.push("Use a conversational answer shape.");
    }

    if (style === "textbook") {
      instructions.push("Use a clearer explanatory structure.");
    }

    return instructions.join(" ");
  },

  detectTone({ q = "", answerMode = "general_knowledge", domain = "general", style = "direct" } = {}) {
    if (answerMode === "developer") return "blunt, technical, practical";
    if (answerMode === "medical_guidance") return "calm, careful, practical";
    if (answerMode === "identity_or_character") return "direct, warm, self-aware";
    if (domain === "relationship") return "warm, honest, non-blaming";
    if (style === "textbook") return "clear, structured, explanatory";
    if (style === "conversation") return "natural, grounded, supportive";
    return "direct, useful, grounded";
  },

  buildDoNotSay({ answerMode = "general_knowledge", domain = "general", intent = "general" } = {}) {
    const phrases = [
      "Relevant factors:",
      "The useful move is",
      "There is a real pattern here worth responding to carefully.",
      "Avoid overcomplicating the answer.",
      "In plain English, this means"
    ];

    if (answerMode === "identity_or_character") {
      phrases.push("As an AI language model");
      phrases.push("I don't have preferences");
    }

    return this.unique(phrases);
  },

  buildDiagnosticPreview({
    directAnswer = "",
    keyFacts = [],
    cautions = [],
    answerMode = "general_knowledge",
    domain = "general",
    intent = "general"
  } = {}) {
    return [
      `Mode: ${answerMode}`,
      `Domain: ${domain}`,
      `Intent: ${intent}`,
      directAnswer ? `Direct answer: ${directAnswer}` : null,
      keyFacts.length ? `Key facts: ${keyFacts.slice(0, 3).join(" | ")}` : null,
      cautions.length ? `Cautions: ${cautions.slice(0, 3).join(" | ")}` : null
    ]
      .filter(Boolean)
      .join("\n");
  },

  rankNodes(nodes = [], q = "") {
    return [...nodes]
      .map(node => ({
        ...node,
        __synthesisScore: this.nodeScore(node, q)
      }))
      .sort((a, b) => b.__synthesisScore - a.__synthesisScore);
  },

  nodeScore(node = {}, q = "") {
    const text = [
      node.topic,
      node.summary,
      node.definition,
      node.purpose,
      node.importance,
      node.how_it_works,
      node.deep_understanding,
      node.how_ari_should_use_this,
      node.direct_answer,
      node.answer,
      Array.isArray(node.recognition_patterns) ? node.recognition_patterns.join(" ") : "",
      Array.isArray(node.common_user_questions) ? node.common_user_questions.join(" ") : "",
      Array.isArray(node.practical_applications) ? node.practical_applications.join(" ") : ""
    ]
      .join(" ")
      .toLowerCase();

    const words = q
      .split(/\W+/)
      .filter(word => word.length > 3);

    let score = 0;

    for (const word of words) {
      if (text.includes(word)) score += 2;
    }

    if (node.weightedScore) score += Number(node.weightedScore) * 10;
    if (node.similarity) score += Number(node.similarity) * 5;
    if (node.__ariScore) score += Number(node.__ariScore);
    if (node.topic) score += 1;

    return score;
  },

  detectStyle(q = "") {
    if (/\b(define|definition|what is|textbook|technical|scientific|explain fully|explain in detail)\b/.test(q)) {
      return "textbook";
    }

    if (/\b(i feel|i'm|im|my|me|help|what should i do|how should i|why am i|wife|husband|girlfriend|boyfriend|partner)\b/.test(q)) {
      return "conversation";
    }

    return "direct";
  },

  detectIntent(q = "") {
    if (/\b(what is|define|definition|meaning of|what does.*mean)\b/.test(q)) {
      return "definition";
    }

    if (/\b(what should i do|how should i|how do i|help|where do i start|what can i do|advice|fix|improve|deal with|approach)\b/.test(q)) {
      return "advice";
    }

    if (/\b(why|what'?s going on|what is going on|how does|can .* affect|does .* affect|could .* affect|explain)\b/.test(q)) {
      return "cause_or_explanation";
    }

    return "general";
  },

  detectDomain(nodes = [], q = "") {
    const domains = nodes.map(node => String(node.domain || node.core || "").toLowerCase());
    const topics = nodes.map(node => String(node.topic || "").toLowerCase()).join(" ");

    if (
      domains.some(d => d.includes("developer") || d.includes("code")) ||
      this.hasAny(q, ["code", "file", "bug", "patch", "function", "javascript", "supabase", "github"])
    ) {
      return "developer";
    }

    if (
      domains.some(d => d.includes("relationship")) ||
      this.hasAny(q, ["wife", "husband", "partner", "spouse", "girlfriend", "boyfriend", "relationship", "marriage"])
    ) {
      return "relationship";
    }

    if (
      domains.some(d => d.includes("character")) ||
      topics.includes("character") ||
      topics.includes("personality") ||
      this.hasAny(q, [
        "who are you",
        "your favorite",
        "what do you like",
        "your purpose",
        "your values",
        "your personality",
        "ari"
      ])
    ) {
      return "character";
    }

    if (
      domains.some(d => d.includes("memory")) ||
      this.hasAny(q, ["remember", "earlier", "last time", "previously", "what did i tell you"])
    ) {
      return "memory";
    }

    if (
      topics.includes("symptom") ||
      this.hasAny(q, ["pain", "fever", "bleeding", "pregnant", "symptom", "nausea", "dizzy", "chest pain"])
    ) {
      return "medical";
    }

    if (
      domains.some(d => d.includes("life")) ||
      this.hasAny(q, ["stress", "burnout", "sleep", "rest", "health", "wellness", "work", "energy"])
    ) {
      return "life";
    }

    if (domains.some(d => d.includes("knowledge"))) {
      return "knowledge";
    }

    return "general";
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

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  },

  hasAny(text = "", terms = []) {
    const normalizedText = this.normalize(text);

    return terms.some(term => {
      const normalizedTerm = this.normalize(term);
      if (!normalizedTerm) return false;

      if (normalizedTerm.includes(" ")) {
        return normalizedText.includes(normalizedTerm);
      }

      return new RegExp(`\\b${this.escapeRegex(normalizedTerm)}\\b`, "i").test(normalizedText);
    });
  },

  unique(items = []) {
    return [...new Set(items.map(item => String(item || "").trim()).filter(Boolean))];
  },

  escapeRegex(value = "") {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  noInterpretation(reason = "Knowledge meaning synthesis not needed.") {
    return {
      knowledgeMeaningInterpreterRan: true,
      knowledgeMeaningInterpreterVersion: this.version,
      knowledgeMeaningInterpreterSource: "ari-knowledge-meaning-packet-builder",
      knowledgeMeaningUsable: false,
      knowledgeSynthesisUsable: false,
      knowledgeMeaning: {
        usable: false,
        reason
      },
      knowledgeSynthesis: {
        usable: false,
        reason
      },
      blueprintKnowledgeHandoff: null
    };
  }
};

window.Ari.knowledgeMeaningInterpreter = window.AriKnowledgeMeaningInterpreter;

console.log(
  "ARI KNOWLEDGE MEANING INTERPRETER LOADED:",
  window.AriKnowledgeMeaningInterpreter?.version
);