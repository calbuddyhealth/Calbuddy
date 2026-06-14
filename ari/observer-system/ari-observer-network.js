// ari/observer-system/ari-observer-network.js
// Ari Observer Evidence Engine
// Purpose: Observe raw evidence only. No interpretation, no prioritization.
// V3.2

window.Ari = window.Ari || {};

window.Ari.observerNetwork = {
  version: "3.2.0",

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

    const add = (type, value, evidence, confidence = 0.7) => {
      if (!value || !evidence) return;

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
          source: "ari-observer-network"
        });
      }
    };

    Object.entries(this.lexicon).forEach(([group, terms]) => {
      terms.forEach(term => {
        const useIncludes =
          group === "knowledge" ||
          group === "memory";

        if (useIncludes ? text.includes(term) : this.hasTerm(text, term)) {
          add(this.typeMap[group] || group, term, term, this.confidenceMap[group] || 0.7);
        }
      });
    });

    this.detectConnectors(text, add);
    this.detectQuestionEvidence(text, add);
    this.detectTimeEvidence(text, add);
    this.detectOwnershipEvidence(text, add);

    const result = {
      observerEvidenceRan: true,
      observerEvidenceVersion: this.version,
      observerEvidenceSource: "ari-observer-network",

      rawUserMessage: rawText,
      normalizedObservedText: text,

      observations,
      observationCount: observations.length,

      observedTypes: [...new Set(observations.map(o => o.type))],
      observedValues: [...new Set(observations.map(o => o.value))],

      observationLedger: observations,
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

  typeMap: {
    people: "person_reference",
    family: "family_reference",
    bodyContext: "body_context",
    bodySymptom: "body_symptom",
    safetyTerms: "safety_language",
    emotionWords: "emotion_word",
    work: "work_reference",
    money: "money_reference",
    building: "building_reference",
    knowledge: "knowledge_request_phrase",
    memory: "memory_request_phrase"
  },

  confidenceMap: {
    people: 0.75,
    family: 0.75,
    bodyContext: 0.65,
    bodySymptom: 0.75,
    safetyTerms: 0.65,
    emotionWords: 0.65,
    work: 0.7,
    money: 0.7,
    building: 0.7,
    knowledge: 0.75,
    memory: 0.8
  },

  lexicon: {
    people: [
      "wife", "husband", "spouse", "partner", "fiance", "fiancée",
      "girlfriend", "boyfriend", "ex", "friend", "coworker", "boss"
    ],

    family: [
      "family", "mom", "mother", "dad", "father", "parent", "parents",
      "child", "kid", "son", "daughter", "baby", "children",
      "brother", "sister", "grandma", "grandmother", "grandpa", "grandfather",
      "aunt", "uncle", "cousin", "in law", "guardian", "caregiver"
    ],

    bodyContext: [
      "pregnant", "pregnancy", "abortion", "miscarriage", "stroke",
      "surgery", "diagnosis", "doctor", "hospital", "medication",
      "therapy", "medical history"
    ],

    bodySymptom: [
      "pain", "hurt", "bleeding", "fever", "vomiting", "dizzy",
      "faint", "fainting", "passed out", "chest pain", "trouble breathing",
      "shortness of breath", "seizure", "weakness", "numbness",
      "contractions", "fluid leakage", "decreased fetal movement"
    ],

    safetyTerms: [
      "kill myself", "hurt myself", "self harm", "can't stay safe",
      "cant stay safe", "hurt someone", "overdose", "abuse", "assault",
      "threat", "violence", "emergency", "danger"
    ],

    emotionWords: [
      "tired", "exhausted", "overwhelmed", "stressed", "sad", "angry",
      "mad", "scared", "afraid", "guilty", "ashamed", "lonely",
      "frustrated", "confused", "worried"
    ],

    work: [
      "job", "career", "work", "school", "college", "military", "navy",
      "army", "marine", "promotion", "boss", "coworker", "business",
      "company", "resume", "interview", "overtime"
    ],

    money: [
      "money", "financial", "budget", "debt", "rent", "mortgage",
      "salary", "pay", "bills", "afford", "expensive", "tight",
      "security"
    ],

    building: [
      "build", "fix", "debug", "code", "github", "app", "project",
      "website", "feature", "error", "repo", "javascript", "html", "css"
    ],

    knowledge: [
      "what is", "why", "explain", "teach", "understand",
      "difference", "meaning of", "how does", "define"
    ],

    memory: [
      "remember", "don't forget", "from now on", "going forward",
      "save this", "store this", "note that"
    ]
  },

  detectConnectors(text, add) {
    const connectors = [
      "but", "however", "although", "while", "at the same time",
      "versus", "vs", "on the other hand"
    ];

    connectors.forEach(term => {
      if (this.hasTerm(text, term)) {
        add("contrast_or_tradeoff_connector", term, term, 0.8);
      }
    });
  },

  detectQuestionEvidence(text, add) {
    const questionMarks = (text.match(/\?/g) || []).length;

    if (questionMarks > 0) {
      add("question_mark_count", String(questionMarks), "?", 0.9);
    }

    const starters = [
      "how do", "how can", "what should", "should i", "should we",
      "do you think", "why", "what is", "can you", "can i"
    ];

    starters.forEach(term => {
      if (text.includes(term)) {
        add("question_phrase", term, term, 0.85);
      }
    });
  },

  detectTimeEvidence(text, add) {
    const patterns = [
      ["past_time", /\b(yesterday|last week|last month|two weeks ago|years ago|last year)\b/],
      ["current_time", /\b(now|right now|currently|today|tonight|this morning)\b/],
      ["future_time", /\b(tomorrow|next week|next month|soon|in six months|for the next)\b/]
    ];

    patterns.forEach(([type, regex]) => {
      const match = text.match(regex);
      if (match) add(type, match[0], match[0], 0.8);
    });
  },

  detectOwnershipEvidence(text, add) {
    if (/\b(i|me|my|myself)\b/.test(text)) {
      add("ownership_reference", "self", "I/me/my", 0.75);
    }

    if (/\b(my wife|my husband|my partner|my girlfriend|my boyfriend|my dad|my mom|my child|my baby)\b/.test(text)) {
      add("ownership_reference", "close_other", "my + close person", 0.8);
    }

    if (/\b(someone|somebody|a person|they|their)\b/.test(text)) {
      add("ownership_reference", "other_or_unspecified", "someone/they", 0.65);
    }
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
      .replace(/[^\w\s'?.,!:-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};