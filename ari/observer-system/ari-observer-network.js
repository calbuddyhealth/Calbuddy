// ari/observer-system/ari-observer-network.js
// Ari Observer Evidence Engine
// Purpose: Observe raw evidence only. No interpretation, no prioritization.
// V5.0.0 — Universal Conversation Evidence Engine

window.Ari = window.Ari || {};

window.Ari.observerNetwork = {
  version: "5.0.0",

  observe(input = {}) {
    const summary = input.summary || input || {};

    const rawText =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      "";

    const text = this.normalize(rawText);
    const observations = [];

    const add = (type, value, evidence, confidence = 0.7, meta = {}) => {
      if (!type || value === undefined || value === null || !evidence) return;

      const exists = observations.some(
        item =>
          item.type === type &&
          item.value === value &&
          item.evidence === evidence
      );

      if (!exists) {
        observations.push({
          type,
          value,
          evidence,
          confidence,
          source: "ari-observer-network",
          ...meta
        });
      }
    };

    this.scanLexicon(text, add);
    this.detectQuestions(text, add);
    this.detectSpeechActs(text, add);
    this.detectConversationStyle(text, add);
    this.detectAnswerExpectation(text, add);
    this.detectTime(text, add);
    this.detectOwnership(text, add);
    this.detectConnectors(text, add);
    this.detectQuantity(text, add);
    this.detectCertainty(text, add);
    this.detectNegation(text, add);
    this.detectModalPressure(text, add);
    this.detectConversationTarget(text, add);

    observations.sort((a, b) => b.confidence - a.confidence);

    const result = {
      observerEvidenceRan: true,
      observerEvidenceVersion: this.version,
      observerEvidenceSource: "ari-observer-network",

      rawUserMessage: rawText,
      normalizedObservedText: text,

      observations,
      observationLedger: observations,
      observationCount: observations.length,

      observedTypes: [...new Set(observations.map(o => o.type))],
      observedValues: [...new Set(observations.map(o => o.value))],

      rankedLedgerObservations: observations,
      strongestObservation: observations[0]?.value || null,
      strongestObservationCategory: observations[0]?.type || null,
      strongestObservationConfidence: observations[0]?.confidence || 0,

      source: "ari-observer-network"
    };

    window.dispatchEvent(
      new CustomEvent("ari:observation", {
        detail: result
      })
    );

    return result;
  },

  lexicon: {
    safety: {
      type: "safety_language",
      domain: "safety",
      confidence: 0.82,
      terms: [
        "emergency", "danger", "unsafe", "not safe", "can't stay safe",
        "cant stay safe", "kill myself", "hurt myself", "self harm",
        "suicide", "overdose", "poison", "hurt someone", "weapon",
        "abuse", "assault", "threat", "violence"
      ]
    },

    body: {
      type: "body_context",
      domain: "body",
      confidence: 0.76,
      terms: [
        "pregnant", "pregnancy", "doctor", "hospital", "medication",
        "diagnosis", "surgery", "therapy", "medical history", "stroke",
        "dementia", "cancer", "diabetes"
      ]
    },

    symptoms: {
      type: "body_symptom",
      domain: "body",
      confidence: 0.8,
      terms: [
        "pain", "hurt", "bleeding", "fever", "vomiting", "dizzy",
        "faint", "fainting", "passed out", "chest pain",
        "trouble breathing", "shortness of breath", "seizure",
        "weakness", "numbness", "contractions", "fluid leakage",
        "decreased fetal movement"
      ]
    },

    relationship: {
      type: "relationship_reference",
      domain: "relationship",
      confidence: 0.75,
      terms: [
        "wife", "husband", "spouse", "partner", "fiance", "fiancée",
        "girlfriend", "boyfriend", "ex", "friend", "coworker",
        "boss", "neighbor", "teacher", "doctor"
      ]
    },

    family: {
      type: "family_reference",
      domain: "family",
      confidence: 0.78,
      terms: [
        "family", "mom", "mother", "dad", "father", "parent", "parents",
        "child", "kid", "son", "daughter", "baby", "children",
        "brother", "sister", "grandma", "grandmother", "grandpa",
        "grandfather", "aunt", "uncle", "cousin", "in law",
        "guardian", "caregiver"
      ]
    },

    emotion: {
      type: "emotion_word",
      domain: "emotion",
      confidence: 0.72,
      terms: [
        "tired", "exhausted", "overwhelmed", "stressed", "sad",
        "angry", "mad", "scared", "afraid", "guilty", "ashamed",
        "lonely", "frustrated", "confused", "worried", "anxious",
        "resentful", "hurt", "disappointed", "burned out", "burnt out"
      ]
    },

    work: {
      type: "work_reference",
      domain: "career",
      confidence: 0.72,
      terms: [
        "job", "career", "work", "school", "college", "military",
        "navy", "army", "marine", "promotion", "boss", "coworker",
        "business", "company", "resume", "interview", "overtime",
        "shift", "graduate school"
      ]
    },

    money: {
      type: "money_reference",
      domain: "financial",
      confidence: 0.74,
      terms: [
        "money", "financial", "budget", "debt", "rent", "mortgage",
        "salary", "pay", "bills", "afford", "expensive", "tight",
        "security", "income", "loan", "co-sign", "cosign", "save",
        "saving"
      ]
    },

    builder: {
      type: "building_reference",
      domain: "builder",
      confidence: 0.78,
      terms: [
        "build", "fix", "debug", "code", "github", "app", "project",
        "website", "feature", "error", "repo", "javascript", "html",
        "css", "file", "function", "replace", "update", "composer",
        "pipeline", "observer", "engine"
      ]
    },

    knowledge: {
      type: "knowledge_request_phrase",
      domain: "knowledge",
      confidence: 0.76,
      terms: [
        "what is", "why", "explain", "teach", "understand",
        "difference", "meaning of", "how does", "define"
      ]
    },

    identityConversation: {
      type: "identity_or_personhood_reference",
      domain: "identity",
      confidence: 0.78,
      terms: [
        "who are you", "do you believe", "do you think", "are you alive",
        "are you conscious", "identity", "personhood", "personality",
        "self", "yourself", "ai", "artificial intelligence"
      ]
    },

    memory: {
      type: "memory_request_phrase",
      domain: "memory",
      confidence: 0.8,
      terms: [
        "remember", "don't forget", "from now on", "going forward",
        "save this", "store this", "note that"
      ]
    },

    wisdom: {
      type: "wisdom_reference",
      domain: "wisdom",
      confidence: 0.72,
      terms: [
        "regret", "right thing", "meaning", "values", "principle",
        "long term", "future self", "sacrifice", "worth it",
        "what matters", "important"
      ]
    }
  },

  scanLexicon(text, add) {
    Object.entries(this.lexicon).forEach(([group, config]) => {
      config.terms.forEach(term => {
        if (this.hasTerm(text, term)) {
          add(config.type, term, term, config.confidence || 0.7, {
            domain: config.domain || null,
            lexiconGroup: group
          });
        }
      });
    });
  },

  detectQuestions(text, add) {
    const questionMarks = (text.match(/\?/g) || []).length;

    if (questionMarks > 0) {
      add("question_mark_count", String(questionMarks), "?", 0.9);
    }

    const phrases = [
      ["decision_question", "should i"],
      ["decision_question", "should we"],
      ["decision_question", "what should"],
      ["instruction_question", "how do"],
      ["instruction_question", "how can"],
      ["opinion_request", "do you think"],
      ["self_disclosure_question", "do you believe"],
      ["self_disclosure_question", "do you have"],
      ["self_disclosure_question", "are you"],
      ["knowledge_question", "what is"],
      ["knowledge_question", "why"],
      ["permission_question", "can i"],
      ["request_question", "can you"]
    ];

    phrases.forEach(([type, phrase]) => {
      if (text.includes(phrase)) {
        add("question_phrase", phrase, phrase, 0.85, { questionType: type });
      }
    });
  },

  detectSpeechActs(text, add) {
    const acts = [
      ["greeting", /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/],
      ["thanks", /\b(thank you|thanks|appreciate it)\b/],
      ["request", /\b(can you|could you|please|send me|give me|show me|help me)\b/],
      ["clarification_request", /\b(what do you mean|where exactly|is this right|is this useful|are you sure)\b/],
      ["feedback", /\b(this worked|that worked|done|it worked|still broken|not working|confused)\b/],
      ["preference", /\b(i like|i prefer|i want|i don't want|i hate|i love)\b/]
    ];

    acts.forEach(([value, regex]) => {
      const match = text.match(regex);
      if (match) {
        add("speech_act", value, match[0], 0.78);
      }
    });
  },

  detectConversationStyle(text, add) {
    if (text.length < 40) {
      add("message_length", "short", text || "short message", 0.65);
    } else if (text.length > 600) {
      add("message_length", "long", "long message", 0.65);
    }

    if (/\b(quick|brief|short|simple|straight answer)\b/.test(text)) {
      add("style_request", "concise", "quick/brief/short/simple", 0.82);
    }

    if (/\b(deep|detailed|explain more|break it down|full code|entire code)\b/.test(text)) {
      add("style_request", "detailed", "deep/detailed/full", 0.82);
    }

    if (/\b(be honest|real answer|don't sugarcoat|blunt)\b/.test(text)) {
      add("style_request", "blunt", "be honest/blunt", 0.82);
    }
  },

  detectAnswerExpectation(text, add) {
    const expectations = [
      ["direct_answer", /\b(answer|tell me|what is|why|do you|does it|is it)\b/],
      ["step_by_step", /\b(step by step|how do i|how to|walk me through)\b/],
      ["code_output", /\b(send code|full code|entire code|replace file|copy paste)\b/],
      ["opinion", /\b(what do you think|your opinion|do you think)\b/],
      ["recommendation", /\b(what should i do|recommend|best option|should i)\b/]
    ];

    expectations.forEach(([value, regex]) => {
      const match = text.match(regex);
      if (match) {
        add("answer_expectation", value, match[0], 0.8);
      }
    });
  },

  detectTime(text, add) {
    const patterns = [
      ["past_time", /\b(yesterday|last week|last month|two weeks ago|years ago|last year|before|previously)\b/],
      ["current_time", /\b(now|right now|currently|today|tonight|this morning|this afternoon|still|already)\b/],
      ["future_time", /\b(tomorrow|next week|next month|soon|in six weeks|in six months|for the next|eventually)\b/]
    ];

    patterns.forEach(([type, regex]) => {
      const match = text.match(regex);
      if (match) add(type, match[0], match[0], 0.8);
    });
  },

  detectOwnership(text, add) {
    if (/\b(i|me|my|myself)\b/.test(text)) {
      add("ownership_reference", "self", "I/me/my", 0.75);
    }

    if (/\b(my wife|my husband|my partner|my girlfriend|my boyfriend|my fiancé|my fiance|my dad|my mom|my child|my baby|my son|my daughter)\b/.test(text)) {
      add("ownership_reference", "close_other", "my + close person", 0.8);
    }

    if (/\b(someone|somebody|a person|they|their|friend)\b/.test(text)) {
      add("ownership_reference", "other_or_unspecified", "someone/they/friend", 0.65);
    }

    if (/\b(you|your|yourself)\b/.test(text)) {
      add("ownership_reference", "assistant_or_other", "you/your", 0.7);
    }
  },

  detectConversationTarget(text, add) {
    if (/\b(do you|are you|can you|would you|your opinion|your identity|yourself)\b/.test(text)) {
      add("conversation_target", "assistant", "you/your/do you", 0.82);
    }

    if (/\b(i|me|my|myself)\b/.test(text)) {
      add("conversation_target", "user", "I/me/my", 0.72);
    }

    if (/\b(people|someone|they|humans|users)\b/.test(text)) {
      add("conversation_target", "general_people", "people/someone/they/users", 0.7);
    }
  },

  detectConnectors(text, add) {
    [
      "but", "however", "although", "while", "at the same time",
      "versus", "vs", "on the other hand", "either", "or"
    ].forEach(term => {
      if (this.hasTerm(text, term)) {
        add("contrast_or_tradeoff_connector", term, term, 0.8);
      }
    });
  },

  detectQuantity(text, add) {
    const numbers = text.match(/\b\d+(\.\d+)?%?\b/g) || [];

    numbers.forEach(num => {
      add("quantity_reference", num, num, 0.75);
    });

    const match = text.match(/\b(one|two|three|several|many|few|only one|only two)\b/);
    if (match) {
      add("quantity_reference", match[0], match[0], 0.7);
    }
  },

  detectCertainty(text, add) {
    const patterns = [
      ["certainty_high", /\b(definitely|certainly|absolutely|for sure|no doubt)\b/],
      ["certainty_low", /\b(maybe|possibly|probably|not sure|unclear|i think|i guess)\b/]
    ];

    patterns.forEach(([type, regex]) => {
      const match = text.match(regex);
      if (match) add("certainty_marker", type, match[0], 0.7);
    });
  },

  detectNegation(text, add) {
    const match = text.match(/\b(no|not|never|without|denies|denied|isn't|isnt|wasn't|wasnt|aren't|arent|don't|dont)\b/);
    if (match) {
      add("negation_marker", match[0], match[0], 0.75);
    }
  },

  detectModalPressure(text, add) {
    const patterns = [
      ["obligation", /\b(have to|must|need to|supposed to|responsible for)\b/],
      ["constraint", /\b(can't|cant|cannot|only|realistically|no choice|limited)\b/],
      ["desire", /\b(want to|wish|hope|dream|prefer)\b/]
    ];

    patterns.forEach(([value, regex]) => {
      const match = text.match(regex);
      if (match) add("pressure_or_constraint", value, match[0], 0.78);
    });
  },

  hasTerm(text, term) {
    const escaped = this.escapeRegex(term);
    const multiWord = String(term).includes(" ");

    if (multiWord) {
      return new RegExp(`(^|\\b)${escaped}(\\b|$)`, "i").test(text);
    }

    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  },

  escapeRegex(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'?.,!:%-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log("ARI OBSERVER NETWORK LOADED:", window.Ari.observerNetwork?.version);