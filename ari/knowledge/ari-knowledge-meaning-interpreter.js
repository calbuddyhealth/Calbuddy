// ari/knowledge/ari-knowledge-meaning-interpreter.js
// Purpose: Convert retrieved knowledge nodes into synthesized, human-usable meaning before composer.
// V1.1.0 — Knowledge Synthesizer / Multi-Node Meaning / Composer-Safe

window.Ari = window.Ari || {};

window.AriKnowledgeMeaningInterpreter = {
  version: "1.1.0",

  interpret(input = {}) {
    const summary = input.summary || input || {};
    const question = this.getQuestion(summary);
    const q = question.toLowerCase();

    const knowledge = this.getKnowledge(summary);
    const nodes = knowledge.nodes;

    if (!knowledge.shouldUseKnowledge || !nodes.length) {
      return this.noInterpretation("No usable knowledge nodes to synthesize.");
    }

    const rankedNodes = this.rankNodes(nodes, q).slice(0, 6);
    const style = this.detectStyle(q);
    const intent = this.detectIntent(q);

    const synthesis = this.buildSynthesis({
      question,
      q,
      nodes: rankedNodes,
      style,
      intent,
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
    provider = null,
    confidence = null
  } = {}) {
    const mainNodes = nodes.slice(0, 4);
    const topics = mainNodes.map(node => node.topic || node.lesson || "Untitled");

    const mainIdea = this.buildMainIdea(mainNodes, q, style, intent);
    const relevantFactors = this.buildRelevantFactors(mainNodes, q);
    const userMeaning = this.buildUserMeaning(mainNodes, q, style, intent);
    const practicalMove = this.buildPracticalMove(mainNodes, q, style, intent);
    const caution = this.buildCaution(mainNodes, q, style, intent);
    const draft = this.buildDraft({
      mainIdea,
      relevantFactors,
      userMeaning,
      practicalMove,
      caution,
      style,
      intent
    });

    return {
      usable: true,
      synthesizerVersion: this.version,
      style,
      intent,
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

  buildMainIdea(nodes = [], q = "", style = "direct", intent = "general") {
    const topics = nodes.map(node => String(node.topic || "").toLowerCase());

    const hasConflict = topics.some(t => t.includes("conflict"));
    const hasBurnout = topics.some(t => t.includes("burnout"));
    const hasRest = topics.some(t => t.includes("rest") || t.includes("sleep"));
    const hasBalance = topics.some(t => t.includes("balance"));
    const hasOverwhelm = topics.some(t => t.includes("overwhelm"));

    if (hasConflict && (hasBurnout || hasRest || hasOverwhelm)) {
      return "This is probably not just a communication problem. Exhaustion is lowering patience, conflict is repeating, and the useful move is to repair the argument while also changing the recovery pattern underneath it.";
    }

    if (hasBurnout || hasOverwhelm) {
      return "This sounds less like a character flaw and more like an overloaded system asking for adjustment.";
    }

    if (hasRest || hasBalance) {
      return "The core issue is sustainability: your energy, responsibilities, and recovery need to be brought back into balance.";
    }

    const best = nodes[0] || {};
    return (
      this.cleanForUser(best.deep_understanding) ||
      this.cleanForUser(best.summary) ||
      this.cleanForUser(best.definition) ||
      "There is a real pattern here worth responding to carefully."
    );
  },

  buildRelevantFactors(nodes = [], q = "") {
    const factors = [];

    for (const node of nodes) {
      const topic = String(node.topic || "").toLowerCase();

      if (topic.includes("conflict")) {
        factors.push("the argument needs repair, not a winner");
      }

      if (topic.includes("burnout") || topic.includes("overwhelm")) {
        factors.push("exhaustion can reduce patience and emotional regulation");
      }

      if (topic.includes("rest") || topic.includes("sleep")) {
        factors.push("recovery affects mood, judgment, and how hard normal problems feel");
      }

      if (topic.includes("balance") || topic.includes("energy")) {
        factors.push("the plan has to match your actual energy after work");
      }

      if (topic.includes("stress")) {
        factors.push("repeated stress patterns need structure, not shame");
      }
    }

    return [...new Set(factors)].slice(0, 5);
  },

  buildUserMeaning(nodes = [], q = "", style = "direct", intent = "general") {
    if (q.includes("wife") || q.includes("husband") || q.includes("partner") || q.includes("spouse")) {
      return "For you, the move is to talk about the pattern instead of only the latest fight: “I’m coming home depleted, then I’m reacting poorly, and I don’t want that to become our normal.”";
    }

    if (q.includes("exhausted") || q.includes("tired") || q.includes("burned out")) {
      return "The tiredness is not background noise. It is part of the problem and part of the solution.";
    }

    return "The useful move is to name the pattern clearly without turning it into blame.";
  },

  buildPracticalMove(nodes = [], q = "", style = "direct", intent = "general") {
    if (q.includes("wife") || q.includes("husband") || q.includes("partner") || q.includes("spouse")) {
      return "Have the conversation before the next argument, not during it. Lead with ownership, then ask for a practical adjustment: decompression time after work, a calmer time to talk, and one shared plan for responsibilities.";
    }

    if (intent === "advice") {
      return "Start with one small structural change: protect recovery, reduce one pressure point, and communicate the need before resentment builds.";
    }

    return "Start with one realistic next step instead of trying to fix the whole pattern at once.";
  },

  buildCaution(nodes = [], q = "", style = "direct", intent = "general") {
    if (q.includes("arguing") || q.includes("fight") || q.includes("conflict")) {
      return "Do not wait until both people are already activated. That is when the conversation is least likely to go well.";
    }

    if (q.includes("burnout") || q.includes("exhausted") || q.includes("tired")) {
      return "Do not treat exhaustion as laziness or a moral failure. Treat it as data.";
    }

    return "Avoid making this about blame first. Make it about the pattern and the next repair.";
  },

  buildDraft({
    mainIdea = "",
    relevantFactors = [],
    userMeaning = "",
    practicalMove = "",
    caution = "",
    style = "direct",
    intent = "general"
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