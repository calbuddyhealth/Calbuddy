// ari/language/ari-lexical-grounding-engine.js
// Ari Lexical Grounding Engine
// Purpose: Map user language into grounded, reusable phrases for downstream systems.
// V3.0.1 — Universal Lexical Grounding / No Final Authority

window.Ari = window.Ari || {};

window.AriLexicalGroundingEngine = {
  version: "3.0.1",

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
        "medicalEscalation"
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
    this.mapUniversalGoalTerms(grounding, text, normalized);
    this.mapUniversalTransitionTerms(grounding, text, normalized);
    this.mapUniversalTradeoffTerms(grounding, text, normalized);
    this.mapObjectTerms(grounding, text, normalized);
    this.mapConcreteDecisionLanguage(grounding, text, normalized);
    this.mapConcreteConstraintTerms(grounding, text, normalized);
    this.mapTimelineTerms(grounding, text, normalized);
    this.mapBodyTerms(grounding, text, normalized);
    this.mapBuilderTerms(grounding, text, normalized);
    this.mapRelationshipTerms(grounding, text, normalized);
    this.mapEmotionTerms(grounding, text, normalized);
    

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
      ["actor", groundedContext.actor, "Upstream context identified the active actor.", 0.9],
      ["issue", groundedContext.issue, "Upstream context identified the active issue.", 0.9],
      ["action", groundedContext.action, "Upstream context identified the active action phrase.", 0.86],
      ["pressure", groundedContext.pressure, "Upstream context identified a pressure phrase.", 0.86],
      ["decision_phrase", groundedContext.decision, "Upstream context identified a decision phrase.", 0.84],
      ["consequence", groundedContext.consequence, "Upstream context identified a consequence phrase.", 0.84],
      ["active_problem", groundedContext.activeProblemLabel, "Upstream context identified the active problem phrase.", 0.9],
      ["object", groundedContext.object, "Upstream context identified an object phrase.", 0.84],
      ["topic", groundedContext.topic, "Upstream context identified a topic phrase.", 0.84]
    ];

    safeMap.forEach(([concept, phrase, reason, confidence]) => {
      if (phrase) this.setConcept(grounding, concept, phrase, reason, confidence);
    });
  },

  mapUniversalGoalTerms(grounding, text) {
    const goalPhrase = this.findFirst(text, [
      /\b(?:i want to|i need to|i'm trying to|i am trying to|my goal is to|i plan to|i hope to)\s+[^.?!,;]{3,100}/gi,
      /\b(?:go to|start|apply to|finish|complete|build|fix|become|move into|transition to)\s+[^.?!,;]{3,90}/gi
    ]);

    if (goalPhrase && !this.isGenericQuestionPhrase(goalPhrase)) {
      this.setConcept(
        grounding,
        "primary_goal",
        goalPhrase,
        "User named a concrete desired outcome or direction.",
        0.84
      );
    }
  },

  mapUniversalTransitionTerms(grounding, text) {
    const transitionPhrase = this.findFirst(text, [
      /\b(?:having a baby|becoming a parent|new baby|pregnant|pregnancy|moving|separating|leaving the military|starting school|starting a new job|getting married|retiring|transitioning|changing careers)\b[^.?!,;]{0,80}/gi
    ]);

    if (transitionPhrase) {
      this.setConcept(
        grounding,
        "life_transition",
        transitionPhrase,
        "User named a life transition or major change.",
        0.84
      );
    }
  },

  mapUniversalTradeoffTerms(grounding, text, normalized) {
    const hasTradeoff =
      /\bbut\b|\bat the same time\b|\bwhile\b|\bversus\b|\bvs\b|\bbetween\b|\bdon't know if\b|\bnot sure if\b/i.test(text);

    if (!hasTradeoff) return;

    const central = this.inferTradeoffPhrase(text, normalized);

    if (central) {
      this.setConcept(
        grounding,
        "central_tradeoff",
        central,
        "User language contains competing priorities, uncertainty, or timing tension.",
        0.82
      );
    }
  },

  inferTradeoffPhrase(text, normalized) {
    if (
      /nurse practitioner|np school|practitioner school|school/i.test(text) &&
      /baby|pregnan|child|parent/i.test(text)
    ) {
      return "school timing versus new baby transition";
    }

    if (
      /friend/i.test(text) &&
      /child|kid|son|daughter|school event/i.test(text)
    ) {
      return "friend obligation versus child presence";
    }

    if (
      /work|job|career/i.test(text) &&
      /family|baby|child|partner|wife|husband|fianc/i.test(text)
    ) {
      return "career demand versus family stability";
    }

    const split = text.split(/\bbut\b|\bat the same time\b|\bwhile\b|\bversus\b|\bvs\b/i);
    if (split.length >= 2) {
      const sideA = this.cleanPhrase(split[0]).slice(0, 90);
      const sideB = this.cleanPhrase(split[1]).slice(0, 90);
      if (sideA && sideB) return `${sideA} versus ${sideB}`;
    }

    return null;
  },

  mapConcreteDecisionLanguage(grounding, text) {
  const decisionOption = this.findFirst(text, [
    /\bshould i\s+[^.?!,;]{2,90}/gi,
    /\bdo you think i should\s+[^.?!,;]{2,90}/gi,
    /\bwould it be smart to\s+[^.?!,;]{2,90}/gi
  ]);

  const actionPhrase = this.findFirst(text, [
    /\b(?:buy|lease|finance|refinance|sell|trade in|apply for|report|tell|ask|call|schedule|cancel|fix|build|replace|save for|pay for|start|go to|move to|enroll in|take)\s+[^.?!,;]{2,90}/gi
  ]);

  const uncertaintyPhrase = this.findFirst(text, [
    /\b(?:don't know if|do not know if|not sure if|unsure if|wondering if)\s+[^.?!,;]{2,100}/gi
  ]);

  if (decisionOption) {
  this.setConcept(
    grounding,
    "decision_option",
    decisionOption,
    "User named the decision option they are considering.",
    0.84
  );

  const option = grounding.conceptMap.decision_option;
  const object = grounding.conceptMap.object;

  if (option?.phrase && object?.short && /\b(it|this|that)\b/i.test(option.phrase)) {
    option.phrase = option.phrase.replace(/\b(it|this|that)\b/i, object.short);
    option.raw = option.raw.replace(/\b(it|this|that)\b/i, object.short);
    option.noun = option.noun.replace(/\b(it|this|that)\b/i, object.short);
    option.verb = option.verb.replace(/\b(it|this|that)\b/i, object.short);
    option.short = option.short.replace(/\b(it|this|that)\b/i, object.short);
    option.article = option.article.replace(/\b(it|this|that)\b/i, object.short);
    option.reason += " Pronoun was resolved using the grounded object.";
  }
}

  if (actionPhrase && !this.isGenericQuestionPhrase(actionPhrase)) {
    this.setConcept(
      grounding,
      "action_phrase",
      actionPhrase,
      "User used concrete action language.",
      0.78
    );
  }

  if (uncertaintyPhrase) {
    this.setConcept(
      grounding,
      "decision_phrase",
      uncertaintyPhrase,
      "User expressed uncertainty about a choice or timing.",
      0.8
    );
  }
},

  mapConcreteConstraintTerms(grounding, text) {
    const resourcePhrase = this.findFirst(text, [
      /\b(?:budget|money|savings|debt|loan|payment|limited time|time pressure|understaffed|short staffed|short-staffed|childcare|new baby|sleep|work schedule|night shift|family support)\b/gi
    ]);

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

  mapTimelineTerms(grounding, text) {
    const timelinePhrases = this.findPhrases(text, [
      /\b(?:today|tonight|tomorrow|this week|next week|this month|next month|this fall|next fall|this winter|next winter|this spring|next spring|this summer|next summer|next year|in the fall|by [^.?!,;]{2,30}|before [^.?!,;]{2,30}|after [^.?!,;]{2,30})\b/gi
    ]);

    if (timelinePhrases.length) {
      this.setConcept(
        grounding,
        "time_phrase",
        timelinePhrases.join(" / "),
        "User mentioned concrete timeline language.",
        0.8
      );

      this.setConcept(
        grounding,
        "timeline",
        timelinePhrases.join(" / "),
        "User mentioned multiple timing anchors.",
        0.78
      );
    }
  },

  mapBodyTerms(grounding, text) {
    const bodyTerm = this.findFirst(text, [
      /my\s+[^.?!,;]{1,40}\s+(hurts|aches|is painful|is killing me)/gi,
      /\b(chest pain|stomach pain|rectal pain|knee pain|back pain|headache|fever|bleeding|diarrhea|vomiting|dizzy|fainting|cough|trouble swallowing|shortness of breath)\b/gi
    ]);

    if (bodyTerm) {
      this.setConcept(grounding, "body_problem", bodyTerm, "User described a body or health phrase.", 0.82);
    }
  },

  mapBuilderTerms(grounding, text) {
    const builderTerm = this.findFirst(text, [
      /\b(login page|homepage|button|meter|composer|pipeline|reasoning engine|observer|contract|app|website|code|file|function|api|supabase|github|vercel|html|javascript|css|lexical grounding engine|thread understanding engine)\b/gi,
      /my\s+[^.?!,;]{1,40}\s+(is broken|is not working|keeps crashing|doesn't work|doesn’t work)/gi
    ]);

    if (builderTerm) {
      this.setConcept(grounding, "thing_to_fix", builderTerm, "User named a concrete build or technical phrase.", 0.8);
    }
  },

  mapRelationshipTerms(grounding, text) {
    const person = this.findFirst(text, [
      /\b(wife|husband|fianc[eé]e|partner|girlfriend|boyfriend|mom|dad|father|mother|sister|brother|friend|boss|coworker|family|team|manager|leadership|management|baby|child|son|daughter)\b/gi
    ]);

    if (person && !grounding.conceptMap.actor) {
      this.setConcept(grounding, "person_or_relationship", person, "User named a person or relationship phrase.", 0.74);
    }
  },

  mapEmotionTerms(grounding, text) {
    const emotion = this.findFirst(text, [
      /\b(tired|overwhelmed|embarrassed|angry|sad|lonely|stressed|burned out|burnt out|anxious|worried|scared|frustrated|done|give up|afraid|nervous|unsure|uncertain)\b/gi
    ]);

    if (emotion) {
      this.setConcept(grounding, "felt_state", emotion, "User named or implied an emotional phrase.", 0.75);
    }
  },

  mapObjectTerms(grounding, text) {
    const object = this.findFirst(text, [
      /\b(car|vehicle|truck|suv|house|apartment|job|school|program|nurse practitioner school|np school|ring|watch|phone|computer|cat|dog|pet)\b/gi
    ]);

    if (object && !grounding.conceptMap.object) {
      this.setConcept(grounding, "object", object, "User named a concrete object or topic phrase.", 0.76);
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
      decisionOption: map.decision_option || null,
      consequence: map.consequence || null,
      activeProblem: map.active_problem || null,
      object: map.object || null,
      topic: map.topic || null,
      optionPhrase: map.option_phrase || null,
      timePhrase: map.time_phrase || null,
      timeline: map.timeline || null,
      constraintPhrase: map.constraint_phrase || null,

      bodyProblem: map.body_problem || null,
      thingToFix: map.thing_to_fix || null,
      personOrRelationship: map.person_or_relationship || null,
      feltState: map.felt_state || null,

      primaryGoal: map.primary_goal || null,
      optionalPlan: map.optional_plan || null,
      lifeTransition: map.life_transition || null,
      deadline: map.deadline || null,
      limitingResource: map.limiting_resource || null,
      centralTradeoff: map.central_tradeoff || null
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

    if (/nurse practitioner|np school/i.test(text)) return "NP school";
    if (/having a baby|new baby|pregnan/i.test(text)) return "the baby transition";
    if (/school timing versus new baby/i.test(text)) return "school vs baby timing";
    if (/friend obligation versus child/i.test(text)) return "friend vs child";
    if (/career demand versus family/i.test(text)) return "career vs family";
    if (/code|file|function|html|javascript|css/i.test(text)) return "the code";
    if (/app|website|homepage/i.test(text)) return "the app";
    if (/cat|dog|pet/i.test(text)) return "the pet";
    if (/car|vehicle|truck|suv/i.test(text)) return "the car";

    return text;
  },

  extractUserTerms(text = "") {
    const phrases = this.findPhrases(text, [
      /\b(?:my|our|the)\s+[^.?!,;]{2,70}/gi,
      /\b(?:i want to|i need to|i'm trying to|i am trying to|my goal is to|i plan to|i hope to)\s+[^.?!,;]{3,100}/gi,
      /\b(?:go to|start|apply to|finish|complete|build|fix|become|move into|transition to)\s+[^.?!,;]{3,90}/gi,
      /\b(?:nurse practitioner school|np school|having a baby|new baby|school next year|baby this fall|next fall|this fall)\b/gi
    ]);

    return [...new Set(
      phrases
        .map(p => this.cleanPhrase(p))
        .filter(Boolean)
        .filter(p => !this.isGenericQuestionPhrase(p))
    )].slice(0, 20);
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
    "what plan should i follow",
    "do you think",
    "what would you do",
    "what do you recommend",
    "next step",
    "what next",
    "help me",
    "help"
  ]);

  if (exactGeneric.has(text)) return true;

  // Only block bare question stems, not meaningful decision phrases.
  if (/^(what|how|why|do you|can you|could you)\b/.test(text) && text.split(/\s+/).length <= 6) {
    return true;
  }

  // Important: do NOT block "should I take the job" or similar.
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