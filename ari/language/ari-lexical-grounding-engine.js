// ari/language/ari-lexical-grounding-engine.js
// Ari Lexical Grounding Engine
// Purpose: Map known upstream concepts back to the user's actual words.
// V2.1.0 — Lexical Only / No Goal, Decision, Priority, or Recommendation Authority
//
// Boundary:
// - DOES extract concrete user phrases.
// - DOES preserve grounded terms from upstream entity/thread systems.
// - DOES map concrete words to neutral concept labels.
// - DOES NOT decide goals, priorities, lanes, risks, actions, or recommendations.
// - DOES NOT turn generic questions like "what should I do" into a goal.
// - DOES NOT create fake placeholders.

window.Ari = window.Ari || {};

window.AriLexicalGroundingEngine = {
  version: "2.1.0",

  ground(input = {}) {
    const summary = input.summary || input || {};
    const text = this.getOriginalText(summary);
    const normalized = this.normalize(text);

    const groundedContext =
      summary.groundedContext ||
      summary.entityReference?.groundedContext ||
      summary.entityReferenceState?.groundedContext ||
      summary.subjectGraphState?.groundedContext ||
      {};

    const grounding = {
      lexicalGroundingRan: true,
      lexicalGroundingVersion: this.version,
      lexicalGroundingSource: "ari-lexical-grounding-engine",
      source: "ari-lexical-grounding-engine",

      authority: "lexical_grounding_only",

      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "responseShape",
        "finalResponse",
        "responseText",
        "recommendation",
        "reasoningRecommendation",
        "riskLevel",
        "riskType",
        "override",
        "medicalEscalation",
        "knownFacts",
        "inferredFacts",
        "decision",
        "primaryGoal"
      ],

      userTerms: this.extractUserTerms(text),
      ignoredGenericPhrases: this.extractIgnoredGenericPhrases(text),
      groundedContext,

      conceptMap: {},
      preferredTerms: {},
      phraseMemory: [],
      notes: []
    };

    this.mapGroundedContextTerms(grounding, groundedContext);
    this.mapConcreteDecisionLanguage(grounding, text, normalized);
    this.mapConcreteConstraintTerms(grounding, text, normalized);
    this.mapBodyTerms(grounding, text, normalized);
    this.mapBuilderTerms(grounding, text, normalized);
    this.mapRelationshipTerms(grounding, text, normalized);
    this.mapEmotionTerms(grounding, text, normalized);
    this.mapObjectTerms(grounding, text, normalized);

    grounding.preferredTerms = this.buildPreferredTerms(grounding);

    return {
      lexicalGrounding: grounding,
      lexicalGroundingRan: true,
      lexicalGroundingVersion: this.version,
      lexicalGroundingSource: "ari-lexical-grounding-engine",

      userTerms: grounding.userTerms,
      ignoredGenericPhrases: grounding.ignoredGenericPhrases,
      groundedContext: grounding.groundedContext,
      conceptMap: grounding.conceptMap,
      preferredTerms: grounding.preferredTerms,

      authority: "lexical_grounding_only",
      cannotSet: grounding.cannotSet
    };
  },

  mapGroundedContextTerms(grounding, groundedContext = {}) {
    const safeMap = [
      ["actor", groundedContext.actor, "Entity resolver identified the active actor.", 0.9],
      ["issue", groundedContext.issue, "Entity resolver identified the active issue.", 0.9],
      ["action", groundedContext.action, "Entity resolver identified the active action phrase.", 0.86],
      ["pressure", groundedContext.pressure, "Entity resolver identified a pressure phrase.", 0.86],
      ["decision_phrase", groundedContext.decision, "Entity resolver identified a decision phrase.", 0.84],
      ["consequence", groundedContext.consequence, "Entity resolver identified a consequence phrase.", 0.84],
      ["active_problem", groundedContext.activeProblemLabel, "Entity resolver identified the active problem phrase.", 0.9],
      ["object", groundedContext.object, "Entity resolver identified an object phrase.", 0.84],
      ["topic", groundedContext.topic, "Entity resolver identified a topic phrase.", 0.84]
    ];

    safeMap.forEach(([concept, phrase, reason, confidence]) => {
      if (phrase) this.setConcept(grounding, concept, phrase, reason, confidence);
    });
  },

  mapConcreteDecisionLanguage(grounding, text, normalized) {
    const actionPhrase = this.findFirst(text, [
      /\b(?:buy|lease|finance|refinance|sell|trade in|apply for|report|tell|ask|call|schedule|cancel|fix|build|replace|save for|pay for)\s+[^.?!,;]{2,70}/gi
    ]);

    const optionPhrase = this.findFirst(text, [
      /\b(?:option|choice|route|path|plan|approach)\s+(?:is|would be|could be)?\s*[^.?!,;]{2,70}/gi
    ]);

    if (actionPhrase && !this.isGenericQuestionPhrase(actionPhrase)) {
      this.setConcept(
        grounding,
        "action_phrase",
        actionPhrase,
        "User used concrete action language.",
        0.78
      );
    }

    if (optionPhrase && !this.isGenericQuestionPhrase(optionPhrase)) {
      this.setConcept(
        grounding,
        "option_phrase",
        optionPhrase,
        "User named a concrete option or plan phrase.",
        0.74
      );
    }
  },

  mapConcreteConstraintTerms(grounding, text, normalized) {
    const timePhrase = this.findFirst(text, [
      /\b(?:today|tonight|tomorrow|this week|next week|next month|soon|by [^.?!,;]{2,30}|before [^.?!,;]{2,30}|after [^.?!,;]{2,30})\b/gi
    ]);

    const resourcePhrase = this.findFirst(text, [
      /\b(?:bad credit|good credit|excellent credit|credit score|budget|money|savings|debt|loan|payment|apr|interest rate|down payment|understaffed|short staffed|short-staffed|limited time|time pressure)\b/gi
    ]);

    if (timePhrase) {
      this.setConcept(
        grounding,
        "time_phrase",
        timePhrase,
        "User mentioned a time phrase.",
        0.76
      );
    }

    if (resourcePhrase) {
      this.setConcept(
        grounding,
        "constraint_phrase",
        resourcePhrase,
        "User mentioned a concrete constraint phrase.",
        0.8
      );
    }
  },

  mapBodyTerms(grounding, text) {
    const bodyTerm = this.findFirst(text, [
      /my\s+[^.?!,;]{1,40}\s+(hurts|aches|is painful|is killing me)/gi,
      /\b(chest pain|stomach pain|rectal pain|knee pain|back pain|headache|fever|bleeding|diarrhea|vomiting|dizzy|fainting|cough|trouble swallowing|shortness of breath)\b/gi
    ]);

    if (bodyTerm) {
      this.setConcept(
        grounding,
        "body_problem",
        bodyTerm,
        "User described a body or health phrase.",
        0.82
      );
    }
  },

  mapBuilderTerms(grounding, text) {
    const builderTerm = this.findFirst(text, [
      /\b(login page|homepage|button|meter|composer|pipeline|reasoning engine|observer|contract|app|website|code|file|function|api|supabase|github|vercel|html|javascript|css)\b/gi,
      /my\s+[^.?!,;]{1,40}\s+(is broken|is not working|keeps crashing|doesn't work|doesn’t work)/gi
    ]);

    if (builderTerm) {
      this.setConcept(
        grounding,
        "thing_to_fix",
        builderTerm,
        "User named a concrete build or technical phrase.",
        0.8
      );
    }
  },

  mapRelationshipTerms(grounding, text) {
    const person = this.findFirst(text, [
      /\b(wife|husband|fianc[eé]e|partner|girlfriend|boyfriend|mom|dad|father|mother|sister|brother|friend|boss|coworker|family|team|manager|leadership|management)\b/gi
    ]);

    if (person && !grounding.conceptMap.actor) {
      this.setConcept(
        grounding,
        "person_or_relationship",
        person,
        "User named a person or relationship phrase.",
        0.72
      );
    }
  },

  mapEmotionTerms(grounding, text) {
    const emotion = this.findFirst(text, [
      /\b(tired|overwhelmed|embarrassed|angry|sad|lonely|stressed|burned out|burnt out|anxious|worried|scared|frustrated|done|give up|afraid|nervous)\b/gi
    ]);

    if (emotion) {
      this.setConcept(
        grounding,
        "felt_state",
        emotion,
        "User named or implied an emotional phrase.",
        0.75
      );
    }
  },

  mapObjectTerms(grounding, text, normalized) {
    const object = this.findFirst(text, [
      /\b(car|vehicle|truck|suv|house|apartment|job|school|program|ring|watch|phone|computer|cat|dog|pet)\b/gi
    ]);

    if (object && !grounding.conceptMap.object) {
      this.setConcept(
        grounding,
        "object",
        object,
        "User named a concrete object or topic phrase.",
        0.76
      );
    }
  },

  buildPreferredTerms(grounding) {
    const map = grounding.conceptMap || {};

    return {
      actor: map.actor || null,
      issue: map.issue || null,
      action: map.action || map.action_phrase || null,
      actionPhrase: map.action_phrase || null,
      pressure: map.pressure || null,
      decisionPhrase: map.decision_phrase || null,
      consequence: map.consequence || null,
      activeProblem: map.active_problem || null,
      object: map.object || null,
      topic: map.topic || null,
      optionPhrase: map.option_phrase || null,
      timePhrase: map.time_phrase || null,
      constraintPhrase: map.constraint_phrase || null,

      bodyProblem: map.body_problem || null,
      thingToFix: map.thing_to_fix || null,
      personOrRelationship: map.person_or_relationship || null,
      feltState: map.felt_state || null,

      primaryGoal: null,
      optionalPlan: null,
      deadline: null,
      limitingResource: null,
      centralTradeoff: null
    };
  },

  setConcept(grounding, concept, phrase, reason = "", confidence = 0.75) {
    if (!phrase) return;

    const cleaned = this.cleanPhrase(phrase);
    if (!cleaned) return;

    if (this.isGenericQuestionPhrase(cleaned)) {
      grounding.notes.push({
        type: "ignored_generic_question_phrase",
        concept,
        phrase: cleaned,
        reason: "Lexical grounding must not treat generic question wording as a grounded concept."
      });
      return;
    }

    const forms = this.makeForms(cleaned);

    grounding.conceptMap[concept] = {
      concept,
      phrase: forms.noun,
      raw: forms.raw,
      noun: forms.noun,
      verb: forms.verb,
      short: forms.short,
      article: forms.article,
      reason,
      confidence,
      authority: "lexical_phrase_only"
    };

    grounding.phraseMemory.push({
      concept,
      phrase: forms.noun,
      raw: forms.raw,
      reason,
      confidence
    });
  },

  makeForms(rawPhrase = "") {
    const raw = this.cleanPhrase(rawPhrase);

    return {
      raw,
      noun: raw,
      verb: raw,
      short: this.makeShortPhrase(raw),
      article: raw
    };
  },

  makeShortPhrase(phrase = "") {
    const text = this.cleanPhrase(phrase);

    if (/documenting assessments/i.test(text)) return "the documentation issue";
    if (/leadership|management/i.test(text)) return "leadership pressure";
    if (/report/i.test(text)) return "reporting it";
    if (/team.*hate me|backlash|retaliation/i.test(text)) return "team backlash";
    if (/bad credit|good credit|excellent credit|credit score/i.test(text)) return "credit";
    if (/car|vehicle|truck|suv/i.test(text)) return "the car";
    if (/loan|payment|apr|interest rate|down payment/i.test(text)) return "the financing";
    if (/cat|dog|pet/i.test(text)) return "the pet";
    if (/code|file|function|html|javascript|css/i.test(text)) return "the code";
    if (/app|website|homepage/i.test(text)) return "the app";

    return text;
  },

  extractUserTerms(text = "") {
    const phrases = this.findPhrases(text, [
      /\b(?:my|our|the)\s+[^.?!,;]{2,50}/gi,
      /\b(?:buy|lease|finance|refinance|sell|trade in|apply for|report|fix|build|replace|save for|pay for)\s+[^.?!,;]{2,70}/gi,
      /\b(?:bad credit|good credit|excellent credit|credit score|down payment|interest rate|auto loan|car loan|documenting assessments|cutting corners|leadership keeps rushing everyone|management has been pushing everyone|understaffed|reporting it|team will hate me)\b/gi
    ]);

    return [...new Set(
      phrases
        .map(p => this.cleanPhrase(p))
        .filter(Boolean)
        .filter(p => !this.isGenericQuestionPhrase(p))
    )].slice(0, 16);
  },

  extractIgnoredGenericPhrases(text = "") {
    const phrases = this.findPhrases(text, [
      /\b(?:what should i do|what do i do|what kind of plan|what plan should i follow|should i|do you think|what would you do|what do you recommend|next step|what next)\b/gi
    ]);

    return [...new Set(phrases.map(p => this.cleanPhrase(p)).filter(Boolean))];
  },

  isGenericQuestionPhrase(value = "") {
    const text = this.normalize(value);

    if (!text) return true;

    const exactGeneric = new Set([
      "what should i do",
      "what do i do",
      "what kind of plan",
      "what kind of plan do you think i should follow",
      "what plan should i follow",
      "should i",
      "should i do",
      "should follow",
      "do you think",
      "what would you do",
      "what do you recommend",
      "next step",
      "what next",
      "help me",
      "help"
    ]);

    if (exactGeneric.has(text)) return true;

    if (/^(what|how|why|should|do you|can you|could you)\b/.test(text) && text.split(/\s+/).length <= 10) {
      return true;
    }

    if (/^should\s+(i|we)\b/.test(text)) return true;
    if (/^what\s+should\s+(i|we)\b/.test(text)) return true;
    if (/^what\s+kind\s+of\s+plan\b/.test(text)) return true;

    return false;
  },

  findFirst(text = "", patterns = []) {
    return this.findPhrases(text, patterns)[0] || null;
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
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^\w\s']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI LEXICAL GROUNDING LOADED:",
  window.AriLexicalGroundingEngine?.version
);