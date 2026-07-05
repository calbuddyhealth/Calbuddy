// ari/understanding/ari-language-understanding-engine.js
// Purpose: Local first-pass language understanding before semantic/event/human-state engines.
// V0.2.0 — Stable Primitive Parser / Pattern Registry / Scored Confidence / No Retrieval

window.Ari = window.Ari || {};

window.AriLanguageUnderstandingEngine = {
  version: "0.2.0",

  understand(input = {}) {
    const summary = input.summary || input || {};
    const originalText = this.getText(summary);
    const text = this.normalize(originalText);

    if (!text) return this.empty("No usable text.");

    const tokens = this.tokenize(text);
    const phraseHits = this.matchPatternRegistry(text);

    const speechAct = this.scoreSpeechAct(text, phraseHits);
    const polarity = this.scorePolarity(text, phraseHits);
    const domains = this.scoreDomains(text, phraseHits);
    const actors = this.extractActors(text);
    const action = this.scoreActionType(text, phraseHits);
    const emotionSignals = this.scoreEmotionSignals(text, phraseHits);
    const knowledgeNeed = this.scoreKnowledgeNeed(text, speechAct, domains, phraseHits);
    const uncertainty = this.estimateUncertainty({
      speechAct,
      polarity,
      domains,
      action,
      emotionSignals,
      knowledgeNeed,
      phraseHits
    });

    const userNeed = this.inferUserNeed({
      speechAct,
      polarity,
      domains,
      action,
      emotionSignals,
      knowledgeNeed
    });

    return {
      languageUnderstandingRan: true,
      languageUnderstandingVersion: this.version,
      languageUnderstandingSource: "ari-language-understanding-engine",

      usable: true,
      originalText,
      normalizedText: text,
      tokens,

      speechAct,
      polarity,
      domains,
      actors,
      action,
      emotionSignals,
      knowledgeNeed,
      userNeed,

      phraseHits,
      uncertainty,
      confidence: uncertainty.confidence,

      needsDownstreamInterpretation: uncertainty.confidence < 0.72,
      retrievalAllowed: knowledgeNeed.needsKnowledge === true,
      retrievalReason: knowledgeNeed.reason || null
    };
  },

  patternRegistry: {
    speechAct: {
      request: [
        "can you", "could you", "please", "help me", "show me",
        "make me", "create", "write", "draft", "rewrite", "fix",
        "update", "send me", "tell me"
      ],
      memoryInstruction: [
        "remember", "don't forget", "dont forget", "keep in mind",
        "from now on", "going forward"
      ],
      question: [
        "what", "why", "how", "when", "where", "who", "which",
        "should i", "do you think", "can i", "does", "is", "are"
      ],
      emotionalDisclosure: [
        "i feel", "i'm feeling", "i am feeling", "i feel like",
        "i'm sad", "i'm happy", "i'm scared", "i'm worried",
        "i'm excited"
      ],
      eventShare: [
        "i got", "i passed", "i failed", "this happened", "today",
        "yesterday", "my wife", "my husband", "my friend", "my friends"
      ]
    },

    polarity: {
      positive: [
        "happy", "excited", "proud", "grateful", "thankful",
        "relieved", "loved", "good", "great", "amazing",
        "passed", "made my day", "made my whole day", "real friends",
        "thoughtful", "sweet", "kind", "supportive"
      ],
      negative: [
        "sad", "angry", "mad", "upset", "hurt", "worried",
        "anxious", "scared", "failed", "lonely", "alone",
        "tired", "overwhelmed", "rough", "bad", "rejected"
      ]
    },

    domains: {
      relationship: [
        "wife", "husband", "girlfriend", "boyfriend", "partner",
        "spouse", "relationship", "marriage", "married", "dating"
      ],
      friendship: [
        "friend", "friends", "best friend", "real friends",
        "social circle", "make friends"
      ],
      family: [
        "mom", "dad", "mother", "father", "brother", "sister",
        "family", "daughter", "son", "baby"
      ],
      school: [
        "school", "class", "exam", "test", "final", "grade",
        "homework", "assignment", "college"
      ],
      work: [
        "work", "job", "boss", "coworker", "shift", "career",
        "interview", "promotion"
      ],
      health: [
        "pain", "pregnant", "pregnancy", "symptom", "bleeding",
        "fever", "medicine", "medication", "doctor", "hospital"
      ],
      developer: [
        "code", "file", "bug", "patch", "engine", "pipeline",
        "supabase", "github", "function", "router", "composer",
        "blueprint"
      ]
    },

    actions: {
      achievement: [
        "got an a", "passed", "aced", "graduated", "won",
        "finished", "completed", "promotion"
      ],
      setback: [
        "failed", "got an f", "rejected", "lost", "messed up",
        "didn't pass", "did not pass"
      ],
      supportReceived: [
        "helped me", "went out of their way", "showed up for me",
        "surprised me", "made dinner", "did chores", "did errands"
      ],
      conflict: [
        "argument", "argued", "fight", "fighting", "conflict",
        "disagreement", "tension"
      ],
      connectionSeeking: [
        "lonely", "alone", "make friends", "meet people",
        "social circle", "relationship with someone", "dating"
      ]
    },

    emotions: {
      joy: [
        "happy", "glad", "excited", "amazing", "great",
        "made my day", "made my whole day"
      ],
      pride: [
        "proud", "passed", "got an a", "aced", "promotion", "won"
      ],
      gratitude: [
        "grateful", "thankful", "appreciate", "went out of their way",
        "thoughtful", "helped me", "real friends"
      ],
      relief: [
        "relieved", "finally", "weight off", "less stressed"
      ],
      sadness: [
        "sad", "down", "depressed", "cry", "crying", "heavy"
      ],
      anxiety: [
        "anxious", "worried", "scared", "panic", "overwhelmed",
        "nervous"
      ],
      anger: [
        "angry", "mad", "furious", "annoyed", "frustrated"
      ],
      loneliness: [
        "lonely", "alone", "isolated", "left out", "no friends"
      ]
    },

    knowledge: {
      current: [
        "current", "latest", "today", "news", "price", "weather",
        "score", "who won", "right now"
      ],
      memory: [
        "remember", "last time", "previously", "earlier",
        "what did we decide", "what do you know about me"
      ],
      project: [
        "calbuddy", "ari rebirth", "supabase", "github", "code",
        "file", "pipeline", "engine", "router", "composer", "blueprint"
      ],
      medical: [
        "pregnant", "pregnancy", "symptom", "pain", "bleeding",
        "fever", "medication", "dose", "diagnosis", "doctor"
      ],
      world: [
        "what is", "define", "explain", "how does", "why does",
        "difference", "compare"
      ]
    }
  },

  getText(summary = {}) {
    return String(
      summary.resolvedUserQuestion ||
      summary.threadQuestion?.resolvedUserQuestion ||
      summary.resolvedCurrentTurn?.resolvedText ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    ).trim();
  },

  matchPatternRegistry(text = "") {
    const hits = {};

    for (const [groupName, group] of Object.entries(this.patternRegistry)) {
      hits[groupName] = {};

      for (const [label, patterns] of Object.entries(group)) {
        const matched = patterns.filter(pattern =>
          this.hasPattern(text, pattern)
        );

        if (matched.length) {
          hits[groupName][label] = {
            count: matched.length,
            patterns: matched
          };
        }
      }
    }

    return hits;
  },

  scoreSpeechAct(text = "", hits = {}) {
    const scores = {
      request: this.hitCount(hits, "speechAct", "request"),
      question:
        this.hitCount(hits, "speechAct", "question") +
        (text.endsWith("?") ? 2 : 0),
      emotional_disclosure: this.hitCount(hits, "speechAct", "emotionalDisclosure"),
      event_share: this.hitCount(hits, "speechAct", "eventShare"),
      memory_instruction: this.hitCount(hits, "speechAct", "memoryInstruction"),
      statement: 1
    };

    return this.bestLabel(scores, "statement");
  },

  scorePolarity(text = "", hits = {}) {
    const positive = this.hitCount(hits, "polarity", "positive");
    const negative = this.hitCount(hits, "polarity", "negative");

    let label = "neutral";
    if (positive > 0 && negative === 0) label = "positive";
    if (negative > 0 && positive === 0) label = "negative";
    if (positive > 0 && negative > 0) label = "mixed";

    return {
      label,
      positiveScore: positive,
      negativeScore: negative
    };
  },

  scoreDomains(text = "", hits = {}) {
    const scores = {};

    for (const label of Object.keys(this.patternRegistry.domains)) {
      scores[label] = this.hitCount(hits, "domains", label);
    }

    const ranked = Object.entries(scores)
      .filter(([, score]) => score > 0)
      .map(([label, score]) => ({ label, score }))
      .sort((a, b) => b.score - a.score);

    return {
      primary: ranked[0]?.label || "general",
      ranked,
      scores
    };
  },

  extractActors(text = "") {
    const actors = [];

    const map = {
      self: /\b(i|me|my)\b/,
      partner: /\b(wife|husband|girlfriend|boyfriend|partner|spouse)\b/,
      friends: /\b(friend|friends|best friend|real friends)\b/,
      family: /\b(mom|dad|mother|father|brother|sister|family|daughter|son|baby)\b/,
      work_people: /\b(boss|coworker|manager|patient|client)\b/
    };

    for (const [actor, regex] of Object.entries(map)) {
      if (regex.test(text)) actors.push(actor);
    }

    return actors;
  },

  scoreActionType(text = "", hits = {}) {
    const scores = {};

    for (const label of Object.keys(this.patternRegistry.actions)) {
      scores[label] = this.hitCount(hits, "actions", label);
    }

    return this.bestLabel(scores, "none");
  },

  scoreEmotionSignals(text = "", hits = {}) {
    const signals = [];

    for (const label of Object.keys(this.patternRegistry.emotions)) {
      const score = this.hitCount(hits, "emotions", label);
      if (score > 0) signals.push({ label, score });
    }

    return signals.sort((a, b) => b.score - a.score);
  },

  scoreKnowledgeNeed(text = "", speechAct = {}, domains = {}, hits = {}) {
    const current = this.hitCount(hits, "knowledge", "current") > 0;
    const memory = this.hitCount(hits, "knowledge", "memory") > 0;
    const project = this.hitCount(hits, "knowledge", "project") > 0;
    const medical = this.hitCount(hits, "knowledge", "medical") > 0;
    const world =
      this.hitCount(hits, "knowledge", "world") > 0 &&
      speechAct.label === "question";

    const needsKnowledge = current || memory || project || medical || world;

    const source =
      current ? "live_verification" :
      memory ? "user_memory" :
      project ? "project_or_code_knowledge" :
      medical ? "medical_knowledge" :
      world ? "world_knowledge" :
      "none";

    return {
      needsKnowledge,
      source,
      current,
      memory,
      project,
      medical,
      world,
      reason: needsKnowledge
        ? `Language understanding detected need for ${source}.`
        : "No explicit knowledge need detected."
    };
  },

  inferUserNeed({ speechAct, polarity, domains, action, emotionSignals, knowledgeNeed }) {
    if (knowledgeNeed.needsKnowledge) return "answer_with_knowledge";
    if (speechAct.label === "request") return "perform_or_guide";
    if (speechAct.label === "memory_instruction") return "memory_acknowledgment";

    if (action.label === "achievement") return "celebrate_achievement";
    if (action.label === "supportReceived") return "celebrate_connection";
    if (action.label === "setback") return "support_setback";
    if (action.label === "conflict") return "relationship_repair";
    if (action.label === "connectionSeeking") return "connection_support";

    if (emotionSignals.some(e => e.label === "loneliness")) return "connection_support";
    if (polarity.label === "positive") return "positive_acknowledgment";
    if (polarity.label === "negative") return "emotional_presence";
    if (speechAct.label === "question") return "direct_answer";

    return "conversational_acknowledgment";
  },

  estimateUncertainty({ speechAct, polarity, domains, action, emotionSignals, knowledgeNeed, phraseHits }) {
    let confidence = 0.52;

    if (speechAct.label !== "statement") confidence += 0.1;
    if (polarity.label !== "neutral") confidence += 0.08;
    if (domains.primary !== "general") confidence += 0.08;
    if (action.label !== "none") confidence += 0.12;
    if (emotionSignals.length) confidence += 0.08;
    if (knowledgeNeed.needsKnowledge) confidence += 0.08;

    const totalHits = this.totalHitCount(phraseHits);
    if (totalHits >= 4) confidence += 0.05;
    if (totalHits <= 1) confidence -= 0.08;

    confidence = Math.max(0.25, Math.min(0.95, Number(confidence.toFixed(2))));

    return {
      confidence,
      level:
        confidence >= 0.8 ? "low_uncertainty" :
        confidence >= 0.62 ? "medium_uncertainty" :
        "high_uncertainty",
      shouldDeferToDownstream: confidence < 0.72
    };
  },

  bestLabel(scores = {}, fallback = "unknown") {
    const ranked = Object.entries(scores)
      .map(([label, score]) => ({ label, score }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0] || { label: fallback, score: 0 };

    return {
      label: best.score > 0 ? best.label : fallback,
      score: best.score,
      ranked
    };
  },

  hitCount(hits = {}, group = "", label = "") {
    return Number(hits?.[group]?.[label]?.count || 0);
  },

  totalHitCount(hits = {}) {
    let total = 0;

    for (const group of Object.values(hits || {})) {
      for (const item of Object.values(group || {})) {
        total += Number(item?.count || 0);
      }
    }

    return total;
  },

  hasPattern(text = "", pattern = "") {
    const p = this.normalize(pattern);
    if (!p) return false;

    if (p.includes(" ")) return text.includes(p);

    return new RegExp(`\\b${this.escapeRegex(p)}\\b`, "i").test(text);
  },

  tokenize(text = "") {
    return String(text || "")
      .split(/\W+/)
      .map(token => token.trim())
      .filter(token => token.length > 0);
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  },

  escapeRegex(value = "") {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  empty(reason = "No language understanding.") {
    return {
      languageUnderstandingRan: true,
      languageUnderstandingVersion: this.version,
      languageUnderstandingSource: "ari-language-understanding-engine",
      usable: false,
      reason,
      confidence: 0
    };
  }
};

window.Ari.languageUnderstandingEngine = window.AriLanguageUnderstandingEngine;

console.log(
  "ARI LANGUAGE UNDERSTANDING ENGINE LOADED:",
  window.AriLanguageUnderstandingEngine.version
);