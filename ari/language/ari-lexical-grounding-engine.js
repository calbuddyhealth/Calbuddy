// ari/language/ari-lexical-grounding-engine.js
// Ari Lexical Grounding Engine
// Purpose: Map abstract reasoning concepts back to the user's actual words.
// V2.0.0 — Grounded Terms Only / No Fake Placeholders

window.Ari = window.Ari || {};

window.AriLexicalGroundingEngine = {
  version: "2.0.0",

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
      source: "ari-lexical-grounding-engine",

      userTerms: this.extractUserTerms(text),
      groundedContext,

      conceptMap: {},
      preferredTerms: {},
      phraseMemory: [],
      notes: [],

      authority: "lexical_grounding_only",

      cannotSet: [
        "primaryLane",
        "triagePrimaryLane",
        "situationContractPrimary",
        "finalResponse",
        "recommendation",
        "riskLevel",
        "override"
      ]
    };

    this.mapGroundedContextTerms(grounding, groundedContext);
    this.mapWorkAccountabilityTerms(grounding, text, normalized, summary);
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
      groundedContext: grounding.groundedContext,
      conceptMap: grounding.conceptMap,
      preferredTerms: grounding.preferredTerms,
      authority: "lexical_grounding_only"
    };
  },

  mapGroundedContextTerms(grounding, groundedContext = {}) {
    if (groundedContext.actor) {
      this.setConcept(grounding, "actor", groundedContext.actor, "Entity resolver identified the active actor.", 0.9);
    }

    if (groundedContext.issue) {
      this.setConcept(grounding, "issue", groundedContext.issue, "Entity resolver identified the active issue.", 0.9);
    }

    if (groundedContext.action) {
      this.setConcept(grounding, "action", groundedContext.action, "Entity resolver identified the active action.", 0.86);
    }

    if (groundedContext.pressure) {
      this.setConcept(grounding, "pressure", groundedContext.pressure, "Entity resolver identified the pressure/source constraint.", 0.86);
    }

    if (groundedContext.decision) {
      this.setConcept(grounding, "decision", groundedContext.decision, "Entity resolver identified the active decision.", 0.86);
    }

    if (groundedContext.consequence) {
      this.setConcept(grounding, "consequence", groundedContext.consequence, "Entity resolver identified the consequence/risk.", 0.84);
    }

    if (groundedContext.activeProblemLabel) {
      this.setConcept(grounding, "active_problem", groundedContext.activeProblemLabel, "Entity resolver identified the active problem.", 0.9);
    }
  },

  mapWorkAccountabilityTerms(grounding, text, normalized, summary) {
    const actor = this.findFirst(text, [
      /\b(nurse|coworker|staff member|employee|manager|boss|leadership|management|team)\b/gi
    ]);

    const issue = this.findFirst(text, [
      /\b(documenting assessments they didn't actually complete)\b/gi,
      /\b(documenting assessments)\b/gi,
      /\b(cutting corners)\b/gi,
      /\b(unsafe practice|patient safety|false documentation|charting issue)\b/gi
    ]);

    const pressure = this.findFirst(text, [
      /\b(leadership keeps rushing everyone)\b/gi,
      /\b(management has been pushing everyone)\b/gi,
      /\b(understaffed)\b/gi,
      /\b(rushing everyone|rushing|pressure|short staffed|short-staffed)\b/gi
    ]);

    const decision = this.findFirst(text, [
      /\b(considering reporting it)\b/gi,
      /\b(considering reporting)\b/gi,
      /\b(reporting it)\b/gi,
      /\b(report a coworker)\b/gi,
      /\b(talking to them first)\b/gi
    ]);

    const consequence = this.findFirst(text, [
      /\b(the rest of the team will hate me)\b/gi,
      /\b(team will hate me)\b/gi,
      /\b(team hate me)\b/gi,
      /\b(retaliation|backlash|get in trouble)\b/gi
    ]);

    if (actor && !grounding.conceptMap.actor) {
      this.setConcept(grounding, "actor", actor, "User named the actor/person involved.", 0.78);
    }

    if (issue && !grounding.conceptMap.issue) {
      this.setConcept(grounding, "issue", issue, "User named the concrete issue.", 0.82);
    }

    if (pressure && !grounding.conceptMap.pressure) {
      this.setConcept(grounding, "pressure", pressure, "User named system pressure or constraint.", 0.82);
    }

    if (decision && !grounding.conceptMap.decision) {
      this.setConcept(grounding, "decision", decision, "User named the decision/action being considered.", 0.8);
    }

    if (consequence && !grounding.conceptMap.consequence) {
      this.setConcept(grounding, "consequence", consequence, "User named a feared consequence.", 0.8);
    }
  },
    mapDecisionTerms(grounding, text, normalized, summary) {
    const goalPhrases = this.extractGoalPhrases(text);
    const needPhrases = this.extractNeedPhrases(text);
    const timePhrases = this.extractTimePhrases(text);
    const resourcePhrases = this.extractResourcePhrases(text);

    if (goalPhrases.optional.length && !grounding.conceptMap.optional_plan) {
      this.setConcept(grounding, "optional_plan", goalPhrases.optional[0], "User described something they want to do.", 0.7);
    }

    if (needPhrases.length && !grounding.conceptMap.primary_goal) {
      this.setConcept(grounding, "primary_goal", needPhrases[0], "User described something they need to protect or complete.", 0.7);
    }

    if (timePhrases.length && !grounding.conceptMap.deadline) {
      this.setConcept(grounding, "deadline", timePhrases[0], "User gave a time constraint.", 0.7);
    }

    if (resourcePhrases.length && !grounding.conceptMap.limiting_resource) {
      this.setConcept(grounding, "limiting_resource", resourcePhrases[0], "User mentioned a resource constraint.", 0.7);
    }
  },

  mapBodyTerms(grounding, text) {
    const bodyTerm = this.findFirst(text, [
      /my\s+[^.?!,;]{1,40}\s+(hurts|aches|is painful)/gi,
      /(chest pain|stomach pain|rectal pain|knee pain|back pain|headache|fever|bleeding|diarrhea|vomiting|dizzy|fainting|cough|trouble swallowing)/gi
    ]);

    if (bodyTerm) {
      this.setConcept(grounding, "body_problem", bodyTerm, "User described a body or health concern.", 0.82);
    }
  },

  mapBuilderTerms(grounding, text) {
    const builderTerm = this.findFirst(text, [
      /(login page|homepage|button|meter|composer|pipeline|reasoning engine|observer|contract|app|website|code|file|function|api|supabase|github|vercel)/gi,
      /my\s+[^.?!,;]{1,40}\s+(is broken|is not working|keeps crashing|doesn't work|doesn’t work)/gi
    ]);

    if (builderTerm) {
      this.setConcept(grounding, "thing_to_fix", builderTerm, "User named the thing they want fixed.", 0.8);
    }
  },

  mapRelationshipTerms(grounding, text) {
    const person = this.findFirst(text, [
      /(wife|husband|fianc[eé]e|partner|girlfriend|boyfriend|mom|dad|father|mother|sister|brother|friend|boss|coworker|family)/gi
    ]);

    if (person && !grounding.conceptMap.actor) {
      this.setConcept(grounding, "person_or_relationship", person, "User named a person or relationship.", 0.72);
    }
  },

  mapEmotionTerms(grounding, text) {
    const emotion = this.findFirst(text, [
      /(tired|overwhelmed|embarrassed|angry|sad|lonely|stressed|burned out|burnt out|anxious|worried|scared|frustrated|done|give up)/gi
    ]);

    if (emotion) {
      this.setConcept(grounding, "felt_state", emotion, "User named or implied an emotional state.", 0.75);
    }
  },

  buildPreferredTerms(grounding) {
    const map = grounding.conceptMap || {};

    return {
      actor: map.actor || null,
      issue: map.issue || null,
      action: map.action || null,
      pressure: map.pressure || null,
      decision: map.decision || null,
      consequence: map.consequence || null,
      activeProblem: map.active_problem || null,

      primaryGoal: map.primary_goal || null,
      optionalPlan: map.optional_plan || null,
      deadline: map.deadline || null,
      limitingResource: map.limiting_resource || null,
      centralTradeoff: map.central_tradeoff || null,

      bodyProblem: map.body_problem || null,
      thingToFix: map.thing_to_fix || null,
      personOrRelationship: map.person_or_relationship || null,
      feltState: map.felt_state || null
    };
  },

  setConcept(grounding, concept, phrase, reason = "", confidence = 0.75) {
    if (!phrase) return;

    const cleaned = this.cleanPhrase(phrase);
    if (!cleaned) return;

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
      confidence
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
    if (/team.*hate me/i.test(text)) return "team backlash";
    if (/cat|dog|pet/i.test(text)) return "the pet";
    if (/code|file|function/i.test(text)) return "the code";
    if (/app|website|homepage/i.test(text)) return "the app";

    return text;
  },

  extractUserTerms(text = "") {
    const phrases = this.findPhrases(text, [
      /\b(?:my|our|the)\s+[^.?!,;]{2,50}/gi,
      /\b(?:documenting assessments|cutting corners|leadership keeps rushing everyone|management has been pushing everyone|understaffed|reporting it|team will hate me)\b/gi
    ]);

    return [...new Set(phrases.map(p => this.cleanPhrase(p)).filter(Boolean))].slice(0, 16);
  },

  extractGoalPhrases(text = "") {
    return {
      optional: this.findPhrases(text, [
        /\b(?:want to|would like to|planning to|plan to|hope to)\s+[^.?!,;]{2,60}/gi
      ]).map(x => this.cleanPhrase(x))
    };
  },

  extractNeedPhrases(text = "") {
    return this.findPhrases(text, [
      /\b(?:need to|have to|must|should|supposed to)\s+[^.?!,;]{2,70}/gi
    ]).map(x => this.cleanPhrase(x));
  },

  extractTimePhrases(text = "") {
    return this.findPhrases(text, [
      /\b(?:today|tonight|tomorrow|this week|next week|next month|soon|by [^.?!,;]{2,30})\b/gi
    ]).map(x => this.cleanPhrase(x));
  },

  extractResourcePhrases(text = "") {
    return this.findPhrases(text, [
      /\b(?:budget|money|savings|save|saving|afford|cost|debt|loan|payment|time|energy|understaffed)\b/gi
    ]).map(x => this.cleanPhrase(x));
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
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI LEXICAL GROUNDING LOADED:",
  window.AriLexicalGroundingEngine?.version
);