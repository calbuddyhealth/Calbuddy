// ari/observer-system/ari-observer-network.js
// Ari Observer Evidence Engine
// Purpose: Observe raw evidence only. No interpretation, no prioritization.
// V4.0.0 — Universal Evidence Engine

window.Ari = window.Ari || {};

window.Ari.observerNetwork = {
  version: "4.0.0",

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
      if (!type || !value || !evidence) return;

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
    this.detectTime(text, add);
    this.detectOwnership(text, add);
    this.detectConnectors(text, add);
    this.detectQuantity(text, add);
    this.detectCertainty(text, add);
    this.detectNegation(text, add);
    this.detectModalPressure(text, add);

    return {
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
  },

  scanLexicon(text, add) {
    Object.entries(this.lexicon).forEach(([group, config]) => {
      config.terms.forEach(term => {
        if (this.hasTerm(text, term)) {
          add(config.type, term, term, config.confidence || 0.7, {
            domain: config.domain || null
          });
        }
      });
    });
  },

  lexicon: {
    safety: {
      type: "safety_language",
      domain: "safety",
      confidence: 0.7,
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
      confidence: 0.7,
      terms: [
        "pregnant", "pregnancy", "doctor", "hospital", "medication",
        "diagnosis", "surgery", "therapy", "medical history", "stroke",
        "dementia", "cancer", "diabetes"
      ]
    },

    symptoms: {
      type: "body_symptom",
      domain: "body",
      confidence: 0.78,
      terms: [
        "pain", "hurt", "bleeding", "fever", "vomiting", "dizzy",
        "faint", "fainting", "passed out", "chest pain",
        "trouble breathing", "shortness of breath", "seizure",
        "weakness", "numbness", "contractions", "fluid leakage",
        "decreased fetal movement"
      ]
    },

    people: {
      type: "person_reference",
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
      confidence: 0.7,
      terms: [
        "tired", "exhausted", "overwhelmed", "stressed", "sad",
        "angry", "mad", "scared", "afraid", "guilty", "ashamed",
        "lonely", "frustrated", "confused", "worried", "anxious",
        "resentful", "hurt", "disappointed"
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
      confidence: 0.72,
      terms: [
        "money", "financial", "budget", "debt", "rent", "mortgage",
        "salary", "pay", "bills", "afford", "expensive", "tight",
        "security", "income", "loan", "co-sign", "cosign"
      ]
    },

    builder: {
      type: "building_reference",
      domain: "builder",
      confidence: 0.75,
      terms: [
        "build", "fix", "debug", "code", "github", "app", "project",
        "website", "feature", "error", "repo", "javascript", "html",
        "css", "file", "function", "replace", "update"
      ]
    },

    knowledge: {
      type: "knowledge_request_phrase",
      domain: "knowledge",
      confidence: 0.75,
      terms: [
        "what is", "why", "explain", "teach", "understand",
        "difference", "meaning of", "how does", "define"
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

    if (/\b(one|two|three|several|many|few|only one|only two)\b/.test(text)) {
      const match = text.match(/\b(one|two|three|several|many|few|only one|only two)\b/);
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
    const match = text.match(/\b(no|not|never|without|denies|denied|isn't|isnt|wasn't|wasnt|aren't|arent)\b/);
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