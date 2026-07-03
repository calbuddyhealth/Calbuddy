// ari/knowledge/ari-knowledge-meaning-interpreter.js
// Purpose: Convert retrieved knowledge nodes into synthesized, human-usable meaning before composer.
// V1.2.0 — Generic Knowledge Synthesizer / Special-Case Aware / Composer-Safe

window.Ari = window.Ari || {};

window.AriKnowledgeMeaningInterpreter = {
  version: "1.2.0",

  interpret(input = {}) {
    const summary = input.summary || input || {};
    const question = this.getQuestion(summary);
    const q = this.normalize(question);

    const knowledge = this.getKnowledge(summary);
    const nodes = knowledge.nodes;

    if (!knowledge.shouldUseKnowledge || !nodes.length) {
      return this.noInterpretation("No usable knowledge nodes to synthesize.");
    }

    const rankedNodes = this.rankNodes(nodes, q).slice(0, 6);
    const style = this.detectStyle(q);
    const intent = this.detectIntent(q);
    const domain = this.detectDomain(rankedNodes, q);

    const synthesis = this.buildSynthesis({
      question,
      q,
      nodes: rankedNodes,
      style,
      intent,
      domain,
      provider: knowledge.provider,
      confidence: knowledge.confidence
    });

    return {
      knowledgeMeaningInterpreterRan: true,
      knowledgeMeaningInterpreterVersion: this.version,
      knowledgeMeaningInterpreterSource: "ari-knowledge-meaning-synthesizer",

      knowledgeMeaningUsable: true,
      knowledgeMeaning: synthesis,

      knowledgeSynthesis: synthesis,
      knowledgeSynthesisUsable: true,
      knowledgeSynthesisDraft: synthesis.draft || null
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
      answer: summary.knowledgeAnswer || usable.answer || null,
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

  buildSynthesis({
    question = "",
    q = "",
    nodes = [],
    style = "direct",
    intent = "general",
    domain = "general",
    provider = null,
    confidence = null
  } = {}) {
    const mainNodes = nodes.slice(0, 4);
    const topics = mainNodes.map(node => node.topic || node.lesson || "Untitled");

    const special = this.trySpecialSynthesis(mainNodes, q, style, intent, domain);

    const mainIdea =
      special?.mainIdea ||
      this.buildGenericMainIdea(mainNodes, q, style, intent, domain);

    const relevantFactors =
      special?.relevantFactors ||
      this.buildGenericFactors(mainNodes, q, domain);

    const userMeaning =
      special?.userMeaning ||
      this.buildGenericUserMeaning(mainNodes, q, style, intent, domain);

    const practicalMove =
      special?.practicalMove ||
      this.buildGenericPracticalMove(mainNodes, q, style, intent, domain);

    const caution =
      special?.caution ||
      this.buildGenericCaution(mainNodes, q, style, intent, domain);

    const draft = this.buildDraft({
      mainIdea,
      relevantFactors,
      userMeaning,
      practicalMove,
      caution,
      style,
      intent,
      domain
    });

    return {
      usable: true,
      synthesizerVersion: this.version,
      style,
      intent,
      domain,
      topic: topics[0] || "this",
      topics,

      mainIdea,
      relevantFactors,
      userMeaning,
      practicalMove,
      caution,
      draft,

      sourceProvider: provider,
      sourceConfidence: confidence,
      sourceNodes: mainNodes,
      sourceNodeIds: mainNodes.map(node => node.knowledge_id || node.id).filter(Boolean)
    };
  },

  trySpecialSynthesis(nodes = [], q = "", style = "direct", intent = "general", domain = "general") {
    const topics = nodes.map(node => String(node.topic || "").toLowerCase());

    const hasConflict =
      topics.some(t => t.includes("conflict")) ||
      this.hasAny(q, ["arguing", "argument", "fight", "fighting", "communication"]);

    const hasBurnout =
      topics.some(t => t.includes("burnout")) ||
      this.hasAny(q, ["burnout", "burned out", "exhausted", "depleted"]);

    const hasStress =
      topics.some(t => t.includes("stress")) ||
      this.hasAny(q, ["stress", "stressed", "pressure"]);

    const hasRest =
      topics.some(t => t.includes("rest") || t.includes("sleep")) ||
      this.hasAny(q, ["sleep", "rest", "recovery", "night shift"]);

    const hasRelationship =
      domain === "relationship" ||
      this.hasAny(q, ["wife", "husband", "partner", "spouse", "girlfriend", "boyfriend"]);

    if (hasRelationship && hasConflict && (hasBurnout || hasStress || hasRest)) {
      return {
        mainIdea:
          "This is probably both: stress is lowering your capacity, and communication is where the stress is leaking out.",
        relevantFactors: [
          "exhaustion can reduce patience and emotional regulation",
          "stress can make normal conversations feel like threats",
          "the relationship needs repair, but the recovery pattern also needs adjustment"
        ],
        userMeaning:
          "For you, the move is to talk about the pattern instead of only the latest fight: “I’m coming home depleted, then I’m reacting poorly, and I don’t want that to become our normal.”",
        practicalMove:
          "Have the conversation before the next argument, not during it. Lead with ownership, then ask for a practical adjustment: decompression time after work, a calmer time to talk, and one shared plan for responsibilities.",
        caution:
          "Do not wait until both people are already activated. That is when the conversation is least likely to go well."
      };
    }

    if (hasBurnout || hasStress) {
      return {
        mainIdea:
          "This sounds less like a character flaw and more like an overloaded system asking for adjustment.",
        relevantFactors: [
          hasBurnout ? "burnout usually needs recovery, not just more discipline" : null,
          hasStress ? "stress changes how people process advice, conflict, and decisions" : null,
          hasRest ? "recovery affects mood, judgment, and patience" : null
        ].filter(Boolean),
        userMeaning:
          "The useful move is to treat the exhaustion as data, not as a personal failure.",
        practicalMove:
          "Start with one small structural change: protect recovery, reduce one pressure point, and communicate the need before resentment builds.",
        caution:
          "Do not treat exhaustion as laziness or weakness. Treat it as a signal that the system needs adjustment."
      };
    }

    return null;
  },

  buildGenericMainIdea(nodes = [], q = "", style = "direct", intent = "general", domain = "general") {
    const best = nodes[0] || {};

    const strongest =
      this.cleanForUser(best.deep_understanding) ||
      this.cleanForUser(best.summary) ||
      this.cleanForUser(best.definition) ||
      this.cleanForUser(best.purpose) ||
      "";

    if (intent === "definition") {
      return strongest || "The key idea is the definition and how it applies here.";
    }

    if (intent === "advice") {
      return strongest || "The main point is to turn the pattern into one clear next step.";
    }

    if (strongest) return strongest;

    return "There is a real pattern here worth responding to carefully.";
  },

  buildGenericFactors(nodes = [], q = "", domain = "general") {
    const factors = [];

    for (const node of nodes) {
      const topic = String(node.topic || "").trim();
      const importance = this.cleanForUser(node.importance);
      const how = this.cleanForUser(node.how_it_works);
      const purpose = this.cleanForUser(node.purpose);

      if (importance) factors.push(importance);
      else if (how) factors.push(how);
      else if (purpose) factors.push(purpose);
      else if (topic) factors.push(`${topic} is relevant to this question`);
    }

    return [...new Set(factors)]
      .filter(Boolean)
      .slice(0, 4);
  },

  buildGenericUserMeaning(nodes = [], q = "", style = "direct", intent = "general", domain = "general") {
    if (intent === "definition") {
      return "In plain English, this means the concept matters because it changes how you should interpret the situation.";
    }

    if (intent === "advice") {
      return "For you, the useful move is to name the pattern clearly, then choose one practical adjustment instead of trying to fix everything at once.";
    }

    if (domain === "relationship") {
      return "The useful move is to name the pattern without turning it into blame.";
    }

    if (domain === "life") {
      return "The useful move is to treat this as a whole-system issue, not an isolated mistake.";
    }

    if (domain === "knowledge") {
      return "The useful move is to separate the main idea from the details so the answer stays clear.";
    }

    return "The useful move is to connect the retrieved knowledge back to the actual question, not just repeat the node.";
  },

  buildGenericPracticalMove(nodes = [], q = "", style = "direct", intent = "general", domain = "general") {
    const practical = [];

    for (const node of nodes) {
      if (Array.isArray(node.practical_applications)) {
        practical.push(...node.practical_applications);
      }

      if (node.how_ari_should_use_this) {
        practical.push(this.cleanForUser(node.how_ari_should_use_this));
      }
    }

    const best = practical.find(Boolean);

    if (best) return this.cleanForUser(best);

    if (intent === "advice") {
      return "Start with the smallest next step that changes the pattern, not the biggest plan that sounds good but is hard to follow.";
    }

    if (intent === "cause_or_explanation") {
      return "Use the explanation to identify the main pressure point, then decide what needs to change first.";
    }

    return "Start with one realistic next step instead of trying to solve the whole thing at once.";
  },

  buildGenericCaution(nodes = [], q = "", style = "direct", intent = "general", domain = "general") {
    if (domain === "medical") {
      return "If there are severe, worsening, or urgent symptoms, this should not stay as general advice.";
    }

    if (domain === "relationship") {
      return "Avoid making the first move about blame. Make it about the pattern and the next repair.";
    }

    if (domain === "life") {
      return "Do not turn a system problem into a personal failure.";
    }

    if (intent === "definition") {
      return "Do not stop at the definition. The important part is how it applies to the situation.";
    }

    return "Avoid overcomplicating the answer. The value is in the clearest next interpretation or action.";
  },

  buildDraft({
    mainIdea = "",
    relevantFactors = [],
    userMeaning = "",
    practicalMove = "",
    caution = "",
    style = "direct",
    intent = "general",
    domain = "general"
  } = {}) {
    if (style === "conversation") {
      return [
        mainIdea,
        "",
        userMeaning,
        "",
        practicalMove,
        "",
        caution
      ]
        .filter(Boolean)
        .join("\n");
    }

    if (style === "textbook") {
      return [
        mainIdea,
        relevantFactors.length
          ? `Key points: ${relevantFactors.join("; ")}.`
          : null,
        userMeaning,
        practicalMove,
        caution
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    return [
      mainIdea,
      relevantFactors.length
        ? `Relevant factors: ${relevantFactors.join("; ")}.`
        : null,
      userMeaning,
      practicalMove,
      caution
    ]
      .filter(Boolean)
      .join("\n\n");
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
      domains.some(d => d.includes("relationship")) ||
      this.hasAny(q, ["wife", "husband", "partner", "spouse", "girlfriend", "boyfriend", "relationship", "marriage"])
    ) {
      return "relationship";
    }

    if (
      domains.some(d => d.includes("life")) ||
      this.hasAny(q, ["stress", "burnout", "sleep", "rest", "health", "wellness", "work", "energy"])
    ) {
      return "life";
    }

    if (
      domains.some(d => d.includes("character")) ||
      this.hasAny(q, ["who are you", "your favorite", "your purpose", "your values"])
    ) {
      return "character";
    }

    if (
      domains.some(d => d.includes("memory")) ||
      this.hasAny(q, ["remember", "earlier", "last time", "previously"])
    ) {
      return "memory";
    }

    if (
      topics.includes("symptom") ||
      this.hasAny(q, ["pain", "fever", "bleeding", "pregnant", "symptom"])
    ) {
      return "medical";
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

  escapeRegex(value = "") {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  noInterpretation(reason = "Knowledge meaning synthesis not needed.") {
    return {
      knowledgeMeaningInterpreterRan: true,
      knowledgeMeaningInterpreterVersion: this.version,
      knowledgeMeaningInterpreterSource: "ari-knowledge-meaning-synthesizer",
      knowledgeMeaningUsable: false,
      knowledgeSynthesisUsable: false,
      knowledgeMeaning: {
        usable: false,
        reason
      },
      knowledgeSynthesis: {
        usable: false,
        reason
      }
    };
  }
};

console.log(
  "ARI KNOWLEDGE MEANING INTERPRETER LOADED:",
  window.AriKnowledgeMeaningInterpreter?.version
);