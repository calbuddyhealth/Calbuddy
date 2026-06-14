// ari/meaning/ari-situation-map-engine.js
// Ari Situation Map Engine
// Purpose: Universal situation detection using pattern groups, not one-off keywords.
// V2.0

window.AriSituationMapEngine = {
  version: "2.0.0",

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
      "girlfriend", "boyfriend", "significant other", "ex", "my person",
      "someone close", "mother of my child", "father of my child"
    ],

    family: [
      "family", "mom", "mother", "dad", "father", "parent", "parents",
      "child", "kid", "son", "daughter", "baby", "children",
      "brother", "sister", "grandma", "grandmother", "grandpa", "grandfather",
      "aunt", "uncle", "cousin", "in law", "guardian", "caregiver"
    ],

    body: [
      "pain", "hurt", "bleeding", "fever", "vomiting", "dizzy", "faint",
      "chest pain", "trouble breathing", "shortness of breath", "severe",
      "stroke", "seizure", "overdose", "weakness", "numbness",
      "pregnant", "pregnancy", "contractions", "fluid leakage"
    ],

    danger: [
      "danger", "unsafe", "emergency", "911", "er", "urgent",
      "kill myself", "suicide", "hurt myself", "hurt someone",
      "overdose", "abuse", "threat", "violence"
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
      "how do i", "how can i", "what first", "next"
    ],

    work: [
      "job", "career", "work", "school", "college", "military", "navy",
      "army", "marine", "air force", "promotion", "boss", "coworker",
      "business", "company", "resume", "interview"
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
    ]
  },

  addUnique(list, item) {
    if (item && !list.includes(item)) list.push(item);
  },

  includesAny(text, terms = []) {
    return terms.some(term => text.includes(term));
  },

  collectSignals(summary, text) {
    const entities = [];
    const patterns = [];

    Object.entries(this.lexicon).forEach(([group, terms]) => {
      const hits = terms.filter(term => text.includes(term));
      if (hits.length) {
        entities.push({
          type: group,
          confidence: Math.min(0.95, 0.55 + hits.length * 0.1),
          evidence: hits.slice(0, 6)
        });
      }
    });

    const patternChecks = [
      ["question", /(\?|how do|what should|should i|do you think|why|what is)/],
      ["absolute_language", /(always|never|nobody|everyone|nothing|everything)/],
      ["low_context_distress", /^(i'?m tired|i give up|nothing is working|i can'?t do this)/],
      ["tradeoff", /(but|versus|vs|while|at the same time|on the other hand)/],
      ["caregiving", /(my .+ (is|has|had|needs|hurts|sick|pregnant))/],
      ["identity_pressure", /(fail my family|who am i|what kind of|provider|father|mother|leader)/],
      ["direct_build_request", /(fix|debug|code|build|github|app|repo)/],
      ["memory_request", /(remember|from now on|going forward|save this|note that)/]
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

  hasPattern(signals, name) {
    return signals.patterns.some(p => p.name === name);
  },

  detectQuestionStructure(text, map) {
    const questionMarks = (text.match(/\?/g) || []).length;
    const questionStarters = [
      "how do", "how can", "what should", "should i", "should we",
      "do you think", "why", "what is", "can you", "can i"
    ];

    const starterCount = questionStarters.filter(q => text.includes(q)).length;
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
    const domainRules = [
      ["safety_domain", ["danger"], ["self_harm_or_immediate_safety"]],
      ["medical_body_domain", ["body"], []],
      ["emotion_domain", ["emotion"], ["low_context_distress", "absolute_language"]],
      ["relationship_connection_domain", ["relationship"], []],
      ["family_caregiving_domain", ["family"], ["caregiving"]],
      ["career_contribution_domain", ["work"], []],
      ["money_resources_domain", ["money"], []],
      ["creative_building_domain", ["building"], ["direct_build_request"]],
      ["knowledge_learning_domain", ["knowledge"], []],
      ["wisdom_values_domain", ["values"], []],
      ["memory_preference_domain", ["memory"], ["memory_request"]]
    ];

    domainRules.forEach(([domain, entityTypes, patternNames]) => {
      const entityHit = entityTypes.some(type => this.hasEntity(signals, type));
      const patternHit = patternNames.some(name => this.hasPattern(signals, name));

      if (entityHit || patternHit) {
        this.addUnique(map.domains, domain);
        map.reasons.push(`Detected ${domain} through universal pattern recognition.`);
      }
    });
  },

  detectUniversalSituations(text, signals, map) {
    if (this.hasEntity(signals, "body")) {
      this.addUnique(map.situations, "body_or_health_concern");
    }

    if (this.hasEntity(signals, "danger")) {
      this.addUnique(map.situations, "safety_or_danger_concern");
    }

    if (this.hasEntity(signals, "relationship")) {
      this.addUnique(map.situations, "close_relationship_context");
    }

    if (this.hasEntity(signals, "family") || this.hasPattern(signals, "caregiving")) {
      this.addUnique(map.situations, "family_or_caregiving_context");
    }

    if (this.hasEntity(signals, "emotion") || this.hasPattern(signals, "low_context_distress")) {
      this.addUnique(map.situations, "emotional_state_or_regulation_need");
    }

    if (this.hasEntity(signals, "decision")) {
      this.addUnique(map.situations, "decision_or_tradeoff");
    }

    if (this.hasPattern(signals, "tradeoff")) {
      this.addUnique(map.situations, "competing_priorities");
    }

    if (this.hasEntity(signals, "work")) {
      this.addUnique(map.situations, "work_or_role_context");
    }

    if (this.hasEntity(signals, "money")) {
      this.addUnique(map.situations, "resource_or_financial_pressure");
    }

    if (this.hasEntity(signals, "building")) {
      this.addUnique(map.situations, "building_or_debugging_task");
    }

    if (this.hasEntity(signals, "values")) {
      this.addUnique(map.situations, "values_or_philosophy_question");
    }

    if (this.hasEntity(signals, "memory")) {
      this.addUnique(map.situations, "memory_or_preference_update");
    }

    if (this.hasPattern(signals, "identity_pressure")) {
      this.addUnique(map.situations, "identity_or_role_pressure");
    }
  },

  detectHumanNeeds(text, signals, map) {
    if (map.domains.includes("safety_domain") || map.domains.includes("medical_body_domain")) {
      this.addUnique(map.needs, "stabilization");
    }

    if (map.domains.includes("emotion_domain")) {
      this.addUnique(map.needs, "emotional_attunement");
    }

    if (map.situations.includes("decision_or_tradeoff")) {
      this.addUnique(map.needs, "decision_support");
    }

    if (map.domains.includes("creative_building_domain")) {
      this.addUnique(map.needs, "action_or_build_help");
    }

    if (map.domains.includes("knowledge_learning_domain")) {
      this.addUnique(map.needs, "understanding");
    }

    if (map.domains.includes("wisdom_values_domain")) {
      this.addUnique(map.needs, "wisdom_or_value_clarity");
    }

    if (map.domains.includes("memory_preference_domain")) {
      this.addUnique(map.needs, "memory_acknowledgment");
    }

    if (map.situations.includes("family_or_caregiving_context")) {
      this.addUnique(map.needs, "protection_of_relationships");
    }
  },

  detectRisks(text, signals, map) {
    if (text.includes("kill myself") || text.includes("suicide") || text.includes("hurt myself")) {
      this.addUnique(map.risks, "self_harm_or_immediate_safety");
    }

    if (
      text.includes("severe pain") ||
      text.includes("chest pain") ||
      text.includes("trouble breathing") ||
      text.includes("stroke") ||
      text.includes("seizure") ||
      text.includes("overdose") ||
      text.includes("bleeding")
    ) {
      this.addUnique(map.risks, "medical_or_body_risk");
    }

    if (text.includes("pregnant") && this.hasEntity(signals, "body")) {
      this.addUnique(map.risks, "pregnancy_body_risk");
    }

    if (this.hasPattern(signals, "low_context_distress")) {
      this.addUnique(map.risks, "emotional_collapse_signal");
    }
  },

  detectResponseRequirements(map) {
    if (map.risks.includes("self_harm_or_immediate_safety")) {
      this.addUnique(map.responseRequirements, "immediate_safety_boundary");
    }

    if (map.risks.includes("medical_or_body_risk") || map.risks.includes("pregnancy_body_risk")) {
      this.addUnique(map.responseRequirements, "medical_boundary_and_next_step");
    }

    if (map.needs.includes("emotional_attunement")) {
      this.addUnique(map.responseRequirements, "validate_then_ground");
    }

    if (map.needs.includes("decision_support")) {
      this.addUnique(map.responseRequirements, "decision_framework");
    }

    if (map.needs.includes("action_or_build_help")) {
      this.addUnique(map.responseRequirements, "step_by_step_action");
    }

    if (map.needs.includes("memory_acknowledgment")) {
      this.addUnique(map.responseRequirements, "acknowledge_memory_request");
    }

    if (map.needs.includes("wisdom_or_value_clarity")) {
      this.addUnique(map.responseRequirements, "balanced_wisdom_response");
    }
  },

  scoreMap(map) {
    let gravity = 0;

    if (map.risks.includes("self_harm_or_immediate_safety")) gravity += 10;
    if (map.risks.includes("medical_or_body_risk")) gravity += 8;
    if (map.risks.includes("pregnancy_body_risk")) gravity += 8;
    if (map.risks.includes("emotional_collapse_signal")) gravity += 5;

    if (map.situations.includes("family_or_caregiving_context")) gravity += 2;
    if (map.situations.includes("resource_or_financial_pressure")) gravity += 2;
    if (map.situations.includes("identity_or_role_pressure")) gravity += 2;
    if (map.situations.includes("competing_priorities")) gravity += 2;

    map.gravity = Math.min(10, gravity);

    if (map.risks.includes("self_harm_or_immediate_safety")) {
      map.urgency = "critical";
    } else if (map.risks.includes("medical_or_body_risk") || map.risks.includes("pregnancy_body_risk")) {
      map.urgency = "high";
    } else if (map.gravity >= 7) {
      map.urgency = "moderate";
    } else {
      map.urgency = "low";
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
    } else if (map.risks.includes("medical_or_body_risk") || map.risks.includes("pregnancy_body_risk")) {
      map.primaryLaneSuggestion = "medical_body";
    } else if (map.needs.includes("emotional_attunement")) {
      map.primaryLaneSuggestion = "emotion";
    } else if (map.needs.includes("decision_support")) {
      map.primaryLaneSuggestion = "executive_decision";
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
      ["builder", "teacher", "wisdom"].forEach(lane => {
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