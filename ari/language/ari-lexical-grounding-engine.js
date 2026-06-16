// ari/language/ari-lexical-grounding-engine.js
// Ari Lexical Grounding Engine
// Purpose: Map Ari's abstract reasoning concepts back to the user's own words.
// V1.0.0

window.Ari = window.Ari || {};

window.AriLexicalGroundingEngine = {
  version: "1.0.0",

  ground(input = {}) {
    const summary = input.summary || input || {};
    const text = this.getOriginalText(summary);
    const normalized = this.normalize(text);

    const grounding = {
      lexicalGroundingRan: true,
      lexicalGroundingVersion: this.version,
      source: "ari-lexical-grounding-engine",

      userTerms: this.extractUserTerms(text),
      conceptMap: {},
      preferredTerms: {},
      phraseMemory: [],
      notes: []
    };

    this.mapDecisionTerms(grounding, text, normalized, summary);
    this.mapBodyTerms(grounding, text, normalized, summary);
    this.mapBuilderTerms(grounding, text, normalized, summary);
    this.mapRelationshipTerms(grounding, text, normalized, summary);
    this.mapEmotionTerms(grounding, text, normalized, summary);

    grounding.preferredTerms = this.buildPreferredTerms(grounding);

    return {
      lexicalGrounding: grounding,
      lexicalGroundingRan: true,
      lexicalGroundingVersion: this.version,
      lexicalGroundingSource: "ari-lexical-grounding-engine",
      userTerms: grounding.userTerms,
      conceptMap: grounding.conceptMap,
      preferredTerms: grounding.preferredTerms
    };
  },

  mapDecisionTerms(grounding, text, normalized, summary) {
    const goalPhrases = this.extractGoalPhrases(text);
    const needPhrases = this.extractNeedPhrases(text);
    const timePhrases = this.extractTimePhrases(text);
    const resourcePhrases = this.extractResourcePhrases(text);

    if (goalPhrases.optional.length) {
      this.setConcept(
        grounding,
        "optional_plan",
        goalPhrases.optional[0],
        "User described something they want to do."
      );
    }

    if (needPhrases.length) {
      this.setConcept(
        grounding,
        "primary_goal",
        needPhrases[0],
        "User described something they need to protect or complete."
      );
    }

    if (timePhrases.length) {
      this.setConcept(
        grounding,
        "deadline",
        timePhrases[0],
        "User gave a time constraint."
      );
    }

    if (resourcePhrases.length) {
      this.setConcept(
        grounding,
        "limiting_resource",
        resourcePhrases[0],
        "User mentioned a resource constraint."
      );
    }

    const primaryGoal =
      grounding.conceptMap.primary_goal?.phrase ||
      null;

    const optionalPlan =
      grounding.conceptMap.optional_plan?.phrase ||
      null;

    if (primaryGoal && optionalPlan) {
      this.setConcept(
        grounding,
        "central_tradeoff",
        `${optionalPlan} vs ${primaryGoal}`,
        "User described competing priorities."
      );
    }

    if (primaryGoal) {
      this.setConcept(
        grounding,
        "time_sensitive_financial_goal",
        primaryGoal,
        "Use the user's phrase instead of abstract financial-goal wording."
      );
    }

    if (optionalPlan) {
      this.setConcept(
        grounding,
        "discretionary_activity",
        optionalPlan,
        "Use the user's phrase instead of abstract optional-plan wording."
      );
    }
  },

  mapBodyTerms(grounding, text, normalized, summary) {
    const bodyTerms = this.findPhrases(text, [
      /my\s+[^.?!,;]{1,40}\s+(hurts|aches|is killing me|is painful)/gi,
      /(chest pain|stomach pain|rectal pain|knee pain|back pain|headache|fever|bleeding|diarrhea|vomiting|dizzy|fainting)/gi
    ]);

    if (bodyTerms.length) {
      this.setConcept(
        grounding,
        "body_problem",
        bodyTerms[0],
        "User described a body or health concern."
      );
    }
  },

  mapBuilderTerms(grounding, text, normalized, summary) {
    const builderTerms = this.findPhrases(text, [
      /(login page|homepage|button|meter|composer|pipeline|reasoning engine|observer|contract|app|website|code|file|function|api|supabase|github|vercel)/gi,
      /my\s+[^.?!,;]{1,40}\s+(is broken|is not working|keeps crashing|doesn't work|doesn’t work)/gi
    ]);

    if (builderTerms.length) {
      this.setConcept(
        grounding,
        "thing_to_fix",
        builderTerms[0],
        "User named the thing they want fixed."
      );
    }
  },

  mapRelationshipTerms(grounding, text, normalized, summary) {
    const relationshipTerms = this.findPhrases(text, [
      /(wife|husband|fianc[eé]e|partner|girlfriend|boyfriend|mom|dad|father|mother|sister|brother|friend|boss|coworker|family)/gi
    ]);

    if (relationshipTerms.length) {
      this.setConcept(
        grounding,
        "person_or_relationship",
        relationshipTerms[0],
        "User named a person or relationship."
      );
    }
  },

  mapEmotionTerms(grounding, text, normalized, summary) {
    const emotionTerms = this.findPhrases(text, [
      /(tired|overwhelmed|embarrassed|angry|sad|lonely|stressed|burned out|burnt out|anxious|worried|scared|frustrated|done|give up)/gi
    ]);

    if (emotionTerms.length) {
      this.setConcept(
        grounding,
        "felt_state",
        emotionTerms[0],
        "User named or implied an emotional state."
      );
    }
  },

  buildPreferredTerms(grounding) {
    const map = grounding.conceptMap || {};

    return {
      primaryGoal:
        map.primary_goal?.phrase ||
        map.time_sensitive_financial_goal?.phrase ||
        "the main goal",

      optionalPlan:
        map.optional_plan?.phrase ||
        map.discretionary_activity?.phrase ||
        "the optional plan",

      deadline:
        map.deadline?.phrase ||
        "the deadline",

      limitingResource:
        map.limiting_resource?.phrase ||
        "the limiting resource",

      centralTradeoff:
        map.central_tradeoff?.phrase ||
        null,

      bodyProblem:
        map.body_problem?.phrase ||
        "the symptom",

      thingToFix:
        map.thing_to_fix?.phrase ||
        "the issue",

      personOrRelationship:
        map.person_or_relationship?.phrase ||
        "the relationship",

      feltState:
        map.felt_state?.phrase ||
        "what you’re feeling"
    };
  },

  setConcept(grounding, concept, phrase, reason = "") {
    if (!phrase) return;

    const cleaned = this.cleanPhrase(phrase);
    if (!cleaned) return;

    grounding.conceptMap[concept] = {
      concept,
      phrase: cleaned,
      reason,
      confidence: 0.75
    };

    grounding.phraseMemory.push({
      concept,
      phrase: cleaned,
      reason
    });
  },

  extractUserTerms(text = "") {
    const terms = [];

    const phrases = this.findPhrases(text, [
      /\b(?:save for|saving for|budget for|pay for|buy|get|fix|build|explain|teach|go on|take)\s+[^.?!,;]{2,50}/gi,
      /\b(?:my|our|the)\s+[^.?!,;]{2,40}/gi
    ]);

    phrases.forEach(p => {
      const cleaned = this.cleanPhrase(p);
      if (cleaned && !terms.includes(cleaned)) terms.push(cleaned);
    });

    return terms.slice(0, 12);
  },

  extractGoalPhrases(text = "") {
    return {
      optional: this.findPhrases(text, [
        /\b(?:want to|would like to|planning to|plan to|hope to)\s+[^.?!,;]{2,60}/gi,
        /\b(?:go on vacation|take a vacation|go on a trip|travel|go out|celebrate)\b/gi
      ]).map(x => this.cleanPhrase(x))
    };
  },

  extractNeedPhrases(text = "") {
    return this.findPhrases(text, [
      /\b(?:need to|have to|must|should|supposed to)\s+[^.?!,;]{2,70}/gi,
      /\b(?:save for|saving for|budget for|pay for|buy)\s+[^.?!,;]{2,50}/gi
    ]).map(x => this.cleanPhrase(x));
  },

  extractTimePhrases(text = "") {
    return this.findPhrases(text, [
      /\b(?:today|tonight|tomorrow|this week|next week|next month|in a month|within a month|soon|by [^.?!,;]{2,30})\b/gi
    ]).map(x => this.cleanPhrase(x));
  },

  extractResourcePhrases(text = "") {
    return this.findPhrases(text, [
      /\b(?:budget|money|savings|save|saving|afford|cost|debt|loan|payment|time|energy)\b/gi
    ]).map(x => this.cleanPhrase(x));
  },

  findPhrases(text = "", patterns = []) {
    const output = [];

    patterns.forEach(pattern => {
      const matches = String(text || "").match(pattern) || [];
      matches.forEach(match => {
        const cleaned = this.cleanPhrase(match);
        if (cleaned && !output.includes(cleaned)) output.push(cleaned);
      });
    });

    return output;
  },

  cleanPhrase(value = "") {
    return String(value || "")
      .replace(/[?.!,;:]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  getOriginalText(summary = {}) {
    return String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).trim();
  },

  normalize(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};