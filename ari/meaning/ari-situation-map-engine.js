// ari/meaning/ari-situation-map-engine.js
// Ari Situation Map Engine
// Purpose: Universal situation detection with context/risk/event separation.
// V3.0

window.AriSituationMapEngine = {
  version: "3.0.0",

  build(input = {}) {
    const summary = input.summary || input || {};
    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const signals = this.collectSignals(summary, text);
    const eventContext = this.classifyEventContext(text, signals);

    const map = {
      situationMapRan: true,
      situationMapVersion: this.version,
      source: "ari-situation-map-engine",

      rawText: text,

      questionCount: 0,
      questions: [],
      situations: [],
      domains: [],
      needs: [],
      risks: [],
      responseRequirements: [],

      detectedEntities: signals.entities,
      detectedPatterns: signals.patterns,

      eventContext,
      eventState: eventContext.eventState,
      ownership: eventContext.ownership,
      riskLevel: eventContext.riskLevel,

      gravity: 0,
      urgency: "none",
      complexity: "simple",
      horizon: "unknown",

      primaryLaneSuggestion: null,
      supportLaneSuggestions: [],
      deferredLaneSuggestions: [],

      shouldUseMultiLaneResponse: false,
      shouldAskClarifyingQuestion: false,
      recommendedQuestion: null,

      reasons: []
    };

    this.detectQuestionStructure(text, map);
    this.detectUniversalDomains(text, signals, map);
    this.detectUniversalSituations(text, signals, map);
    this.detectHumanNeeds(text, signals, map);
    this.detectRisks(text, signals, map);
    this.detectResponseRequirements(map);
    this.scoreMap(map);
    this.assignLanes(map);

    return map;
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^\w\s'?.,!:-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  lexicon: {
    relationship: [
      "wife", "husband", "spouse", "partner", "fiance", "fiancée",
      "girlfriend", "boyfriend", "significant other", "my person",
      "someone close", "mother of my child", "father of my child"
    ],

    relationshipSensitiveSingleWords: [
      "ex"
    ],

    family: [
      "family", "mom", "mother", "dad", "father", "parent", "parents",
      "child", "kid", "son", "daughter", "baby", "children",
      "brother", "sister", "grandma", "grandmother", "grandpa", "grandfather",
      "aunt", "uncle", "cousin", "in law", "guardian", "caregiver"
    ],

    bodyContext: [
      "pregnant", "pregnancy", "abortion", "miscarriage", "stroke",
      "surgery", "diagnosis", "medication", "hospital", "doctor", "medical"
    ],

    bodySymptoms: [
      "pain", "hurt", "bleeding", "fever", "vomiting", "dizzy", "dizziness",
      "faint", "fainting", "chest pain", "trouble breathing",
      "shortness of breath", "severe", "seizure", "overdose",
      "weakness", "numbness", "contractions", "fluid leakage",
      "decreased fetal movement", "confusion", "one-sided weakness"
    ],

    dangerContext: [
      "danger", "unsafe", "emergency", "911", "urgent",
      "abuse", "threat", "violence"
    ],

    selfHarmContext: [
      "suicide", "suicidal", "kill myself", "hurt myself", "end my life",
      "want to die", "don't want to live"
    ],

    emotion: [
      "tired", "exhausted", "overwhelmed", "stressed", "sad", "angry",
      "mad", "scared", "afraid", "guilty", "ashamed", "lonely",
      "nothing is working", "i give up", "nobody respects me"
    ],

    decision: [
      "should i", "should we", "what should", "do you think",
      "choose", "decision", "decide", "option", "versus", "vs",
      "better", "worth it", "quit", "stay", "leave"
    ],

    planning: [
      "plan", "steps", "roadmap", "schedule", "prepare", "organize",
      "how do i", "how can i", "what first"
    ],

    work: [
      "job", "career", "work", "school", "college", "military", "navy",
      "army", "marine", "air force", "promotion", "boss", "coworker",
      "business", "company", "resume", "interview", "overtime"
    ],

    money: [
      "money", "financial", "budget", "debt", "rent", "mortgage",
      "salary", "pay", "bills", "afford", "expensive", "tight"
    ],

    building: [
      "build", "fix", "debug", "code", "github", "app", "project",
      "website", "feature", "error", "repo", "javascript", "html", "css"
    ],

    knowledge: [
      "what is", "why", "explain", "teach", "understand", "difference",
      "meaning of", "how does", "define"
    ],

    values: [
      "truth", "meaning", "right", "wrong", "fair", "justice",
      "equality", "empowerment", "values", "wisdom", "moral"
    ],

    memory: [
      "remember", "don't forget", "from now on", "going forward",
      "save this", "store this", "note that"
    ],

    historicalMarkers: [
      "had", "was", "were", "last year", "years ago", "months ago",
      "weeks ago", "days ago", "two weeks ago", "a week ago",
      "yesterday", "previously", "history of", "used to"
    ],

    currentMarkers: [
      "now", "right now", "currently", "today", "tonight", "this morning",
      "having", "has", "is having", "keeps having", "still", "ongoing"
    ],

    futureMarkers: [
      "might", "could", "may", "thinking about", "planning to",
      "worried about", "what if", "will"
    ]
  },

  addUnique(list, item) {
    if (item && !list.includes(item)) list.push(item);
  },

  escapeRegex(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  hasTerm(text, term) {
    const escaped = this.escapeRegex(term);
    const multiWord = term.includes(" ");

    if (multiWord) {
      return new RegExp(`(^|\\b)${escaped}(\\b|$)`, "i").test(text);
    }

    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  },

  includesAny(text, terms = []) {
    return terms.some(term => this.hasTerm(text, term));
  },

  collectHits(text, terms = []) {
    return terms.filter(term => this.hasTerm(text, term));
  },

  collectSignals(summary, text) {
    const entities = [];
    const patterns = [];

    const groups = {
      relationship: [
        ...this.lexicon.relationship,
        ...this.lexicon.relationshipSensitiveSingleWords
      ],
      family: this.lexicon.family,
      body_context: this.lexicon.bodyContext,
      body_symptom: this.lexicon.bodySymptoms,
      danger_context: this.lexicon.dangerContext,
      self_harm_context: this.lexicon.selfHarmContext,
      emotion: this.lexicon.emotion,
      decision: this.lexicon.decision,
      planning: this.lexicon.planning,
      work: this.lexicon.work,
      money: this.lexicon.money,
      building: this.lexicon.building,
      knowledge: this.lexicon.knowledge,
      values: this.lexicon.values,
      memory: this.lexicon.memory
    };

    Object.entries(groups).forEach(([group, terms]) => {
      const hits = this.collectHits(text, terms);
      if (hits.length) {
        entities.push({
          type: group,
          confidence: Math.min(0.95, 0.55 + hits.length * 0.1),
          evidence: hits.slice(0, 8)
        });
      }
    });

    const patternChecks = [
      ["question", /(\?|how do\b|what should\b|should i\b|do you think\b|why\b|what is\b)/],
      ["absolute_language", /\b(always|never|nobody|everyone|nothing|everything)\b/],
      ["low_context_distress", /^(i'?m tired|i give up|nothing is working|i can'?t do this)\b/],
      ["tradeoff", /\b(but|versus|vs|while|at the same time|on the other hand)\b/],
      ["caregiving", /\bmy\s+.{1,40}\s+(is|has|had|needs|hurts|sick|pregnant)\b/],
      ["identity_pressure", /\b(fail my family|who am i|what kind of|provider|father|mother|leader)\b/],
      ["direct_build_request", /\b(fix|debug|code|build|github|app|repo)\b/],
      ["memory_request", /\b(remember|from now on|going forward|save this|note that)\b/],

      // Emergency requires context, not one word.
      ["self_harm_active_intent", /\b(i('| a)m|i am|i feel|i want|i'm going|i plan|tonight|right now).{0,80}\b(kill myself|hurt myself|end my life|want to die|suicidal)\b/],
      ["active_medical_symptom", /\b(has|having|is having|currently|right now|today|tonight|keeps having|still has).{0,80}\b(pain|bleeding|fever|vomiting|dizzy|fainting|chest pain|trouble breathing|seizure|weakness|numbness|contractions|fluid leakage)\b/],
      ["pregnancy_with_symptoms", /\b(pregnant|pregnancy).{0,100}\b(severe|pain|bleeding|dizzy|fainting|fever|vomiting|contractions|fluid leakage|decreased fetal movement|trouble breathing)\b|\b(severe|pain|bleeding|dizzy|fainting|fever|vomiting|contractions|fluid leakage|decreased fetal movement|trouble breathing).{0,100}\b(pregnant|pregnancy)\b/],
      ["historical_medical_event", /\b(had|history of|last year|years ago|months ago|weeks ago|two weeks ago|previously).{0,80}\b(stroke|abortion|miscarriage|surgery|seizure|overdose)\b/]
    ];

    patternChecks.forEach(([name, regex]) => {
      if (regex.test(text)) {
        patterns.push({ name, confidence: 0.85 });
      }
    });

    if (summary.domainLead) {
      patterns.push({
        name: `existing_domain_${summary.domainLead}`,
        confidence: 0.9
      });
    }

    if (summary.primaryHumanNeed) {
      patterns.push({
        name: `existing_need_${summary.primaryHumanNeed}`,
        confidence: 0.9
      });
    }

    if (summary.primaryLifeChapter) {
      patterns.push({
        name: `existing_life_chapter_${summary.primaryLifeChapter}`,
        confidence: 0.9
      });
    }

    return { entities, patterns };
  },

  hasEntity(signals, type) {
    return signals.entities.some(e => e.type === type);
  },

  entityEvidence(signals, type) {
    const found = signals.entities.find(e => e.type === type);
    return found?.evidence || [];
  },

  hasPattern(signals, name) {
    return signals.patterns.some(p => p.name === name);
  },

  classifyEventContext(text, signals) {
    const historical = this.includesAny(text, this.lexicon.historicalMarkers) ||
      this.hasPattern(signals, "historical_medical_event");

    const current = this.includesAny(text, this.lexicon.currentMarkers) ||
      this.hasPattern(signals, "active_medical_symptom");

    const future = this.includesAny(text, this.lexicon.futureMarkers);

    const self =
      /\b(i|i'm|i am|me|my)\b/.test(text);

    const partner =
      this.includesAny(text, ["wife", "husband", "spouse", "partner", "fiance", "fiancée", "girlfriend", "boyfriend"]);

    const family =
      this.includesAny(text, this.lexicon.family);

    let eventState = "context";
    if (historical && !current) eventState = "historical";
    else if (future && !current) eventState = "future_or_hypothetical";
    else if (current) eventState = "active";

    let ownership = "unknown";
    if (partner) ownership = "partner";
    else if (family) ownership = "family";
    else if (self) ownership = "self";

    const hasBodyContext = this.hasEntity(signals, "body_context");
    const hasBodySymptom = this.hasEntity(signals, "body_symptom");

    const activeMedicalPattern =
      this.hasPattern(signals, "active_medical_symptom") ||
      this.hasPattern(signals, "pregnancy_with_symptoms");

    const activeSelfHarm =
      this.hasPattern(signals, "self_harm_active_intent");

    let riskLevel = "none";

    if (activeSelfHarm) {
      riskLevel = "critical";
    } else if (activeMedicalPattern) {
      riskLevel = "high";
    } else if (hasBodyContext && hasBodySymptom && current) {
      riskLevel = "moderate";
    } else if (hasBodyContext || hasBodySymptom) {
      riskLevel = "context";
    }

    return {
      eventState,
      ownership,
      riskLevel,
      hasBodyContext,
      hasBodySymptom,
      activeMedicalPattern,
      activeSelfHarm,
      historical,
      current,
      future
    };
  },

  detectQuestionStructure(text, map) {
    const questionMarks = (text.match(/\?/g) || []).length;
    const questionStarters = [
      "how do", "how can", "what should", "should i", "should we",
      "do you think", "why", "what is", "can you", "can i"
    ];

    const starterCount = questionStarters.filter(q => this.hasTerm(text, q)).length;
    map.questionCount = Math.max(questionMarks, starterCount);

    if (this.includesAny(text, this.lexicon.decision)) {
      this.addUnique(map.questions, "decision_or_judgment_question");
    }

    if (this.includesAny(text, this.lexicon.planning)) {
      this.addUnique(map.questions, "planning_or_instruction_question");
    }

    if (this.includesAny(text, this.lexicon.knowledge)) {
      this.addUnique(map.questions, "knowledge_question");
    }

    if (this.includesAny(text, this.lexicon.values)) {
      this.addUnique(map.questions, "philosophical_or_values_question");
    }

    if (map.questions.length === 0 && text.length > 0) {
      this.addUnique(map.questions, "implicit_question_or_statement");
    }
  },

  detectUniversalDomains(text, signals, map) {
    const hasBodyContext = this.hasEntity(signals, "body_context");
    const hasBodySymptom = this.hasEntity(signals, "body_symptom");

    if (this.hasEntity(signals, "danger_context") || this.hasPattern(signals, "self_harm_active_intent")) {
      this.addUnique(map.domains, "safety_domain");
      map.reasons.push("Detected safety_domain through contextual risk pattern.");
    }

    // Body domain only leads as body when symptoms/current active medical concern exist.
    // Pregnancy/abortion/miscarriage/stroke alone are context/history first.
    if (hasBodySymptom || map.eventContext.activeMedicalPattern) {
      this.addUnique(map.domains, "medical_body_domain");
      map.reasons.push("Detected medical_body_domain through symptom or active medical pattern.");
    } else if (hasBodyContext) {
      this.addUnique(map.domains, "medical_history_or_body_context_domain");
      map.reasons.push("Detected medical history/body context without active risk.");
    }

    if (this.hasEntity(signals, "emotion") || this.hasPattern(signals, "low_context_distress") || this.hasPattern(signals, "absolute_language")) {
      this.addUnique(map.domains, "emotion_domain");
      map.reasons.push("Detected emotion_domain.");
    }

    if (this.hasEntity(signals, "relationship")) {
      this.addUnique(map.domains, "relationship_connection_domain");
      map.reasons.push("Detected relationship_connection_domain.");
    }

    if (this.hasEntity(signals, "family") || this.hasPattern(signals, "caregiving") || hasBodyContext) {
      this.addUnique(map.domains, "family_caregiving_domain");
      map.reasons.push("Detected family_caregiving_domain.");
    }

    if (this.hasEntity(signals, "work")) this.addUnique(map.domains, "career_contribution_domain");
    if (this.hasEntity(signals, "money")) this.addUnique(map.domains, "money_resources_domain");
    if (this.hasEntity(signals, "building") || this.hasPattern(signals, "direct_build_request")) this.addUnique(map.domains, "creative_building_domain");
    if (this.hasEntity(signals, "knowledge")) this.addUnique(map.domains, "knowledge_learning_domain");
    if (this.hasEntity(signals, "values")) this.addUnique(map.domains, "wisdom_values_domain");
    if (this.hasEntity(signals, "memory") || this.hasPattern(signals, "memory_request")) this.addUnique(map.domains, "memory_preference_domain");
  },

  detectUniversalSituations(text, signals, map) {
    if (this.hasEntity(signals, "body_context")) {
      this.addUnique(map.situations, "medical_or_body_context");
    }

    if (this.hasEntity(signals, "body_symptom") || map.eventContext.activeMedicalPattern) {
      this.addUnique(map.situations, "body_or_health_concern");
    }

    if (this.hasPattern(signals, "historical_medical_event") || map.eventState === "historical") {
      this.addUnique(map.situations, "historical_event_context");
    }

    if (this.hasPattern(signals, "self_harm_active_intent") || this.hasPattern(signals, "active_medical_symptom")) {
      this.addUnique(map.situations, "active_risk_context");
    }

    if (this.hasEntity(signals, "relationship")) this.addUnique(map.situations, "close_relationship_context");
    if (this.hasEntity(signals, "family") || this.hasPattern(signals, "caregiving")) this.addUnique(map.situations, "family_or_caregiving_context");
    if (this.hasEntity(signals, "emotion") || this.hasPattern(signals, "low_context_distress")) this.addUnique(map.situations, "emotional_state_or_regulation_need");
    if (this.hasEntity(signals, "decision")) this.addUnique(map.situations, "decision_or_tradeoff");
    if (this.hasPattern(signals, "tradeoff")) this.addUnique(map.situations, "competing_priorities");
    if (this.hasEntity(signals, "work")) this.addUnique(map.situations, "work_or_role_context");
    if (this.hasEntity(signals, "money")) this.addUnique(map.situations, "resource_or_financial_pressure");
    if (this.hasEntity(signals, "building")) this.addUnique(map.situations, "building_or_debugging_task");
    if (this.hasEntity(signals, "values")) this.addUnique(map.situations, "values_or_philosophy_question");
    if (this.hasEntity(signals, "memory")) this.addUnique(map.situations, "memory_or_preference_update");
    if (this.hasPattern(signals, "identity_pressure")) this.addUnique(map.situations, "identity_or_role_pressure");
  },

  detectHumanNeeds(text, signals, map) {
    if (map.risks.includes("self_harm_or_immediate_safety") || map.risks.includes("urgent_medical_or_body_risk")) {
      this.addUnique(map.needs, "stabilization");
    }

    if (map.domains.includes("emotion_domain")) this.addUnique(map.needs, "emotional_attunement");
    if (map.situations.includes("decision_or_tradeoff") || map.situations.includes("competing_priorities")) this.addUnique(map.needs, "decision_support");
    if (map.domains.includes("creative_building_domain")) this.addUnique(map.needs, "action_or_build_help");
    if (map.domains.includes("knowledge_learning_domain")) this.addUnique(map.needs, "understanding");
    if (map.domains.includes("wisdom_values_domain")) this.addUnique(map.needs, "wisdom_or_value_clarity");
    if (map.domains.includes("memory_preference_domain")) this.addUnique(map.needs, "memory_acknowledgment");
    if (map.situations.includes("family_or_caregiving_context")) this.addUnique(map.needs, "protection_of_relationships");

    if (map.domains.includes("medical_history_or_body_context_domain") && !map.risks.length) {
      this.addUnique(map.needs, "context_sensitive_support");
    }
  },

  detectRisks(text, signals, map) {
    // No single-word emergency triggers.
    // Emergency requires contextual confirmation.

    if (this.hasPattern(signals, "self_harm_active_intent")) {
      this.addUnique(map.risks, "self_harm_or_immediate_safety");
    }

    if (this.hasPattern(signals, "pregnancy_with_symptoms")) {
      this.addUnique(map.risks, "pregnancy_body_risk");
    }

    if (this.hasPattern(signals, "active_medical_symptom")) {
      this.addUnique(map.risks, "urgent_medical_or_body_risk");
    }

    if (this.hasPattern(signals, "low_context_distress")) {
      this.addUnique(map.risks, "emotional_collapse_signal");
    }

    // Historical medical events stay context unless current symptoms are present.
    if (map.eventState === "historical" && !map.eventContext.activeMedicalPattern) {
      map.risks = map.risks.filter(r =>
        r !== "urgent_medical_or_body_risk" &&
        r !== "pregnancy_body_risk"
      );
    }
  },

  detectResponseRequirements(map) {
    if (map.risks.includes("self_harm_or_immediate_safety")) {
      this.addUnique(map.responseRequirements, "immediate_safety_boundary");
    }

    if (map.risks.includes("urgent_medical_or_body_risk") || map.risks.includes("pregnancy_body_risk")) {
      this.addUnique(map.responseRequirements, "medical_boundary_and_next_step");
    }

    if (map.needs.includes("emotional_attunement")) this.addUnique(map.responseRequirements, "validate_then_ground");
    if (map.needs.includes("decision_support")) this.addUnique(map.responseRequirements, "decision_framework");
    if (map.needs.includes("action_or_build_help")) this.addUnique(map.responseRequirements, "step_by_step_action");
    if (map.needs.includes("memory_acknowledgment")) this.addUnique(map.responseRequirements, "acknowledge_memory_request");
    if (map.needs.includes("wisdom_or_value_clarity")) this.addUnique(map.responseRequirements, "balanced_wisdom_response");
    if (map.needs.includes("context_sensitive_support")) this.addUnique(map.responseRequirements, "context_without_emergency_escalation");
  },

  scoreMap(map) {
    let gravity = 0;

    if (map.risks.includes("self_harm_or_immediate_safety")) gravity += 10;
    if (map.risks.includes("urgent_medical_or_body_risk")) gravity += 8;
    if (map.risks.includes("pregnancy_body_risk")) gravity += 8;
    if (map.risks.includes("emotional_collapse_signal")) gravity += 5;

    if (map.situations.includes("family_or_caregiving_context")) gravity += 2;
    if (map.situations.includes("resource_or_financial_pressure")) gravity += 2;
    if (map.situations.includes("identity_or_role_pressure")) gravity += 2;
    if (map.situations.includes("competing_priorities")) gravity += 2;

    if (map.eventState === "historical" && map.riskLevel !== "high" && map.riskLevel !== "critical") {
      gravity = Math.min(gravity, 4);
    }

    map.gravity = Math.min(10, gravity);

    if (map.risks.includes("self_harm_or_immediate_safety")) {
      map.urgency = "critical";
    } else if (map.risks.includes("urgent_medical_or_body_risk") || map.risks.includes("pregnancy_body_risk")) {
      map.urgency = "high";
    } else if (map.gravity >= 7) {
      map.urgency = "moderate";
    } else if (map.gravity > 0) {
      map.urgency = "low";
    } else {
      map.urgency = "none";
    }

    const totalSignals =
      map.situations.length +
      map.domains.length +
      map.questions.length +
      map.needs.length;

    if (totalSignals >= 10 || map.domains.length >= 4 || map.questions.length >= 3) {
      map.complexity = "multi_domain";
      map.shouldUseMultiLaneResponse = true;
    } else if (totalSignals >= 5 || map.domains.length >= 2) {
      map.complexity = "moderate";
    } else {
      map.complexity = "simple";
    }

    if (
      map.situations.includes("identity_or_role_pressure") ||
      map.situations.includes("work_or_role_context") ||
      map.situations.includes("family_or_caregiving_context")
    ) {
      map.horizon = "months_to_years";
    } else if (map.urgency === "critical" || map.urgency === "high") {
      map.horizon = "immediate";
    } else {
      map.horizon = "short_term";
    }

    map.shouldAskClarifyingQuestion =
      map.complexity !== "simple" &&
      map.urgency !== "critical" &&
      map.urgency !== "high";

    if (map.shouldAskClarifyingQuestion) {
      map.recommendedQuestion =
        "Which part needs attention first: safety, emotion, decision, action, or understanding?";
    }
  },

  assignLanes(map) {
    if (map.risks.includes("self_harm_or_immediate_safety")) {
      map.primaryLaneSuggestion = "safety";
    } else if (map.risks.includes("urgent_medical_or_body_risk") || map.risks.includes("pregnancy_body_risk")) {
      map.primaryLaneSuggestion = "medical_body";
    } else if (map.needs.includes("emotional_attunement")) {
      map.primaryLaneSuggestion = "emotion";
    } else if (map.needs.includes("decision_support")) {
      map.primaryLaneSuggestion = "executive_decision";
    } else if (map.needs.includes("protection_of_relationships")) {
      map.primaryLaneSuggestion = "family";
    } else if (map.needs.includes("memory_acknowledgment")) {
      map.primaryLaneSuggestion = "memory";
    } else if (map.needs.includes("action_or_build_help")) {
      map.primaryLaneSuggestion = "builder";
    } else if (map.needs.includes("wisdom_or_value_clarity")) {
      map.primaryLaneSuggestion = "wisdom";
    } else {
      map.primaryLaneSuggestion = "understanding";
    }

    const laneRules = [
      ["relationship_connection_domain", "relationship"],
      ["family_caregiving_domain", "family"],
      ["career_contribution_domain", "career"],
      ["money_resources_domain", "financial"],
      ["medical_history_or_body_context_domain", "medical_context"],
      ["medical_body_domain", "medical_body"],
      ["emotion_domain", "emotion"],
      ["wisdom_values_domain", "wisdom"],
      ["creative_building_domain", "builder"],
      ["knowledge_learning_domain", "teacher"],
      ["memory_preference_domain", "memory"]
    ];

    laneRules.forEach(([domain, lane]) => {
      if (map.domains.includes(domain) && lane !== map.primaryLaneSuggestion) {
        this.addUnique(map.supportLaneSuggestions, lane);
      }
    });

    if (map.primaryLaneSuggestion === "medical_body" || map.primaryLaneSuggestion === "safety") {
      ["builder", "teacher", "wisdom", "career", "financial"].forEach(lane => {
        if (map.supportLaneSuggestions.includes(lane)) {
          this.addUnique(map.deferredLaneSuggestions, lane);
        }
      });

      map.supportLaneSuggestions = map.supportLaneSuggestions.filter(
        lane => !map.deferredLaneSuggestions.includes(lane)
      );
    }

    if (map.supportLaneSuggestions.length || map.deferredLaneSuggestions.length) {
      map.shouldUseMultiLaneResponse = true;
    }
  }
};