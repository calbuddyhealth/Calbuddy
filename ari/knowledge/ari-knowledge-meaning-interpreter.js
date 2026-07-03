// ari/knowledge/ari-knowledge-meaning-interpreter.js
// Purpose: Convert retrieved knowledge nodes into human-usable meaning before composer.
// V1.0.0 — Knowledge Meaning / Style Detection / Composer-Safe

window.Ari = window.Ari || {};

window.AriKnowledgeMeaningInterpreter = {
  version: "1.0.0",

  interpret(input = {}) {
    const summary = input.summary || input || {};
    const question = this.getQuestion(summary);
    const q = question.toLowerCase();

    const knowledge = this.getKnowledge(summary);
    const nodes = knowledge.nodes;

    if (!knowledge.shouldUseKnowledge || !nodes.length) {
      return this.noInterpretation("No usable knowledge nodes to interpret.");
    }

    const node = nodes[0] || {};
    const style = this.detectStyle(q);
    const intent = this.detectIntent(q);
    const topic = node.topic || node.lesson || "this";

    const packet = {
      knowledgeMeaningInterpreterRan: true,
      knowledgeMeaningInterpreterVersion: this.version,
      knowledgeMeaningInterpreterSource: "ari-knowledge-meaning-interpreter",

      usable: true,
      topic,
      style,
      intent,

      directAnswer: this.buildDirectAnswer(node, q, style, intent),
      support: this.pickBestSupport(node, q, style),
      meaningForUser: this.buildMeaningForUser(node, q, style),
      nextStep: this.buildNextStep(node, q, style, intent),

      sourceNode: node,
      sourceNodes: nodes,
      sourceProvider: knowledge.provider,
      sourceConfidence: knowledge.confidence
    };

    return {
      knowledgeMeaning: packet,
      knowledgeMeaningInterpreterRan: true,
      knowledgeMeaningInterpreterVersion: this.version,
      knowledgeMeaningInterpreterSource: "ari-knowledge-meaning-interpreter"
    };
  },

  getKnowledge(summary = {}) {
    const results =
      summary.knowledgeRetrievalResults ||
      summary.knowledgeRouter?.knowledgeRetrievalResults ||
      [];

    const first = results[0] || {};

    return {
      shouldUseKnowledge: summary.shouldUseKnowledge === true,
      provider: summary.knowledgeProvider || first.provider || null,
      confidence: summary.knowledgeConfidence || first.confidence || null,
      answer: summary.knowledgeAnswer || first.answer || null,
      nodes:
        summary.knowledgeNodes ||
        first.nodes ||
        first.raw?.nodes ||
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

  detectStyle(q = "") {
    if (/\b(define|definition|what is|textbook|technical|scientific|explain fully|explain in detail)\b/.test(q)) {
      return "textbook";
    }

    if (/\b(i feel|i'm|im|my|me|what'?s going on|what is going on|help|what should i do|why am i)\b/.test(q)) {
      return "conversation";
    }

    return "direct";
  },

  detectIntent(q = "") {
    if (/\b(what is|define|definition|meaning of|what does.*mean)\b/.test(q)) {
      return "definition";
    }

    if (/\b(what should i do|how do i|help|where do i start|what can i do|advice|fix|improve|deal with)\b/.test(q)) {
      return "advice";
    }

    if (/\b(why|what'?s going on|what is going on|how does|can .* affect|does .* affect|could .* affect|explain)\b/.test(q)) {
      return "cause_or_explanation";
    }

    return "general";
  },

  buildDirectAnswer(node = {}, q = "", style = "direct", intent = "general") {
    const topic = String(node.topic || node.lesson || "this").toLowerCase();
    const definition = this.cleanForUser(node.definition || "");
    const summary = this.cleanForUser(node.summary || "");

    if (intent === "definition") {
      return definition || summary || `${topic} is the main idea here.`;
    }

    if (/\b(can|does|could)\b/.test(q)) {
      return style === "conversation"
        ? `Yeah — ${topic} can definitely affect that.`
        : `Yes — ${topic} can affect that.`;
    }

    if (/\bwhat'?s going on|what is going on|why\b/.test(q)) {
      return style === "conversation"
        ? `What’s probably happening is that ${topic} is hitting more than one part of your life at once.`
        : `${topic} may be affecting multiple areas at once.`;
    }

    if (intent === "advice") {
      return style === "conversation"
        ? `Yeah — ${topic} may be part of what is going on.`
        : `${topic} is probably the right place to start.`;
    }

    return style === "conversation"
      ? `This sounds connected to ${topic}.`
      : summary || definition || `${topic} is relevant here.`;
  },

  pickBestSupport(node = {}, q = "", style = "direct") {
    const summary = this.cleanForUser(node.summary || "");
    const deep = this.cleanForUser(node.deep_understanding || "");
    const use = this.cleanForUser(node.how_ari_should_use_this || "");
    const source = deep || use || summary || "";

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
      best = this.makeConversational(best);
    }

    return best;
  },

  buildMeaningForUser(node = {}, q = "", style = "direct") {
    const topic = String(node.topic || node.lesson || "this").toLowerCase();

    if (style === "conversation" && topic.includes("sleep")) {
      return "So if you’re more reactive with people, it may be a recovery problem before it’s a personality problem.";
    }

    const practical = Array.isArray(node.practical_applications)
      ? node.practical_applications
      : [];

    const cleaned = practical
      .map(item => this.cleanPractical(item))
      .filter(Boolean);

    return cleaned[0] || `The useful move is to treat ${topic} as a real factor, not as a character flaw.`;
  },

  buildNextStep(node = {}, q = "", style = "direct", intent = "general") {
    const topic = String(node.topic || node.lesson || "this").toLowerCase();

    if (style === "conversation" && topic.includes("sleep")) {
      return "Start by protecting one sleep block or one recovery habit before trying to fix everything else.";
    }

    const practical = Array.isArray(node.practical_applications)
      ? node.practical_applications
      : [];

    const cleaned = practical
      .map(item => this.cleanPractical(item))
      .filter(Boolean);

    return cleaned[0] || "Start with one small realistic change instead of trying to fix everything at once.";
  },

  makeConversational(text = "") {
    return String(text || "")
      .replace(
        /\bPoor sleep can amplify stress, worsen mood, weaken discipline, reduce patience, increase cravings, impair judgment, and make ordinary problems feel much harder\./i,
        "When sleep is off, your patience, mood, cravings, and judgment can all take a hit."
      )
      .replace(/\bSleep is not wasted time\.\s*/i, "")
      .replace(/\bIt is one of the core systems that allows humans to\b/i, "It helps you")
      .trim();
  },

  cleanPractical(text = "") {
    const cleaned = String(text || "")
      .replace(/^Ask about\b/i, "Look at")
      .replace(/^Encourage\b/i, "Try")
      .replace(/^Support\b/i, "Build around")
      .replace(/^Connect\b/i, "Remember that")
      .replace(/^Avoid shaming.*$/i, "Don’t turn this into a shame issue; treat it as a solvable pattern")
      .replace(/^Recommend medical evaluation\b/i, "Consider medical evaluation")
      .replace(/\busers report\b/gi, "you notice")
      .replace(/\busers\b/gi, "you")
      .replace(/\buser\b/gi, "you")
      .replace(/\.$/, "")
      .trim();

    return cleaned ? `${cleaned}.` : "";
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

  noInterpretation(reason = "Knowledge meaning interpretation not needed.") {
    return {
      knowledgeMeaningInterpreterRan: true,
      knowledgeMeaningInterpreterVersion: this.version,
      knowledgeMeaningInterpreterSource: "ari-knowledge-meaning-interpreter",
      knowledgeMeaning: {
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