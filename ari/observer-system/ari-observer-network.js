// ari/observer-system/ari-observer-network.js
// Ari Observer Evidence Engine
// Purpose: Observe raw evidence only. No interpretation, no prioritization.
// V5.1.0 — Semantic Evidence Ready / Frame Builder Support / No Frame Authority

window.Ari = window.Ari || {};

window.Ari.observerNetwork = {
  version: "5.1.0",

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

    this.detectMessyLanguage(rawText, text, add);

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

    // New semantic evidence only.
    // This does NOT build the semantic frame.
    // It only gives the future Semantic Frame Builder better raw evidence.
    this.detectOperationSignals(text, add);
    this.detectReferenceSignals(text, add);
    this.detectSlotSignals(text, add);
    this.detectQuestionShape(text, add);
    this.detectMissingAnchorSignals(text, add);

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

      authority: {
        canChooseLane: false,
        canBuildSemanticFrame: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        role: "raw_evidence_observation_only"
      },

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

  detectMessyLanguage(rawText = "", text = "", add) {
    const raw = String(rawText || "");
    const normalized = String(text || "");

    if (!raw.trim()) return;

    if (raw !== raw.trim()) {
      add("messy_language_signal", "extra_spacing", "leading/trailing whitespace", 0.55);
    }

    if (/\s{2,}/.test(raw)) {
      add("messy_language_signal", "irregular_spacing", "multiple spaces", 0.6);
    }

    if (/[^\w\s'?.,!:%-]/.test(raw)) {
      add("messy_language_signal", "nonstandard_characters", "nonstandard characters", 0.55);
    }

    const lower = raw.toLowerCase();

    const commonMisspellings = [
      ["what", /\bwut\b|\bwat\b/],
      ["should", /\bshud\b|\bshuld\b/],
      ["because", /\bcuz\b|\bcause\b|\bcos\b/],
      ["recommend", /\brecomend\b|\brecommendd\b|\brecc\b/],
      ["different", /\bdiffrent\b|\bdiffernt\b/],
      ["probably", /\bprobly\b|\bprolly\b/],
      ["going to", /\bgonna\b/],
      ["want to", /\bwanna\b/],
      ["do not know", /\bidk\b/]
    ];

    commonMisspellings.forEach(([value, regex]) => {
      const match = lower.match(regex);
      if (match) {
        add("messy_language_signal", value, match[0], 0.72, {
          normalizedTo: value
        });
      }
    });

    const wordCount = normalized.split(/\s+/).filter(Boolean).length;

    if (wordCount > 0 && raw.length / Math.max(1, wordCount) < 3.2) {
      add("messy_language_signal", "very_short_tokens", raw, 0.55);
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

  detectOperationSignals(text, add) {
    const operationPatterns = [
      ["recommendation", /\b(recommend|suggest|choose|pick|which one|best option|what would you do)\b/],
      ["comparison", /\b(compare|difference|versus|vs|better|worse|more|less|which is)\b/],
      ["planning", /\b(plan|strategy|roadmap|steps|schedule|routine|how do i|how can i|what should i do)\b/],
      ["explanation", /\b(why|how come|explain|teach|break down|what does|meaning of)\b/],
      ["repair_or_build", /\b(fix|debug|repair|solve|update|rewrite|replace|build|create|make|not working|broken|error)\b/],
      ["permission_or_decision", /\b(can i|should i|do i|is it okay|would it be okay)\b/],
      ["recall_or_memory", /\b(remember|what did we|last time|previously|before|what was)\b/],
      ["clarification", /\b(what do you mean|where exactly|are you sure|is this right)\b/]
    ];

    operationPatterns.forEach(([value, regex]) => {
      const match = text.match(regex);
      if (match) {
        add("operation_signal", value, match[0], 0.78);
      }
    });
  },

  detectReferenceSignals(text, add) {
    const references = [
      ["deictic_reference", /\b(it|this|that|these|those|they|them|same|same thing|one|ones)\b/],
      ["option_reference", /\b(which one|which option|the first one|the second one|the other one)\b/],
      ["prior_context_reference", /\b(before|earlier|previously|last time|again|based on that|given that)\b/],
      ["personalized_reference", /\b(for me|my situation|my case|in my case|for us)\b/]
    ];

    references.forEach(([value, regex]) => {
      const match = text.match(regex);
      if (match) {
        add("reference_signal", value, match[0], 0.8);
      }
    });
  },

  detectSlotSignals(text, add) {
    const numbers = text.match(/\b\d+(\.\d+)?%?\b/g) || [];
    numbers.forEach(num => {
      add("slot_signal", "quantity_or_measure", num, 0.78, {
        slotCandidate: "quantity"
      });
    });

    if (/["“”']/.test(text)) {
      add("slot_signal", "quoted_content", "quoted text", 0.8, {
        slotCandidate: "object"
      });
    }

    const goalMatch = text.match(/\b(to|so i can|in order to|get back|trying to|want to|need to)\b/);
    if (goalMatch) {
      add("slot_signal", "goal_language", goalMatch[0], 0.78, {
        slotCandidate: "goal"
      });
    }

    const problemMatch = text.match(/\b(error|bug|broken|not working|issue|problem|wrong|failed|confused)\b/);
    if (problemMatch) {
      add("slot_signal", "problem_language", problemMatch[0], 0.8, {
        slotCandidate: "problem"
      });
    }

    const optionMatch = text.match(/\b(either|or|versus|vs|between|option|choice)\b/);
    if (optionMatch) {
      add("slot_signal", "option_language", optionMatch[0], 0.76, {
        slotCandidate: "options"
      });
    }

    const criteriaMatch = text.match(/\b(best|better|healthy|safe|cheap|cost|fast|easy|effective|reliable|important|worth it)\b/);
    if (criteriaMatch) {
      add("slot_signal", "criteria_language", criteriaMatch[0], 0.74, {
        slotCandidate: "criteria"
      });
    }

    const audienceMatch = text.match(/\b(for me|for us|my situation|my case|my dad|my wife|my girlfriend|my child|my baby)\b/);
    if (audienceMatch) {
      add("slot_signal", "audience_language", audienceMatch[0], 0.76, {
        slotCandidate: "audience"
      });
    }

    const objectCandidate = this.extractObjectCandidate(text);
    if (objectCandidate) {
      add("slot_signal", "object_candidate", objectCandidate, 0.7, {
        slotCandidate: "object"
      });
    }
  },

  detectQuestionShape(text, add) {
    const shapes = [
      ["bare_why", /^why\??$/],
      ["bare_how", /^how\??$/],
      ["short_follow_up", /^(why|how|what about|what if|then what|really|and then)\b/],
      ["choice_question", /\b(which|choose|pick|better|best|option)\b/],
      ["action_question", /\b(what should i do|how do i|how can i|what do i do)\b/],
      ["explanation_question", /\b(why|explain|what does|how come)\b/],
      ["permission_question", /\b(can i|should i|do i|is it okay)\b/]
    ];

    shapes.forEach(([value, regex]) => {
      const match = text.match(regex);
      if (match) {
        add("question_shape", value, match[0], 0.78);
      }
    });
  },

  detectMissingAnchorSignals(text, add) {
    const hasOperation =
      /\b(recommend|suggest|choose|pick|which|compare|explain|fix|debug|plan|should i|can i)\b/.test(text);

    const hasReference =
      /\b(it|this|that|they|them|same|one|which one|for me|my situation|based on that)\b/.test(text);

    const objectCandidate = this.extractObjectCandidate(text);

    if (hasOperation && hasReference && !objectCandidate) {
      add(
        "missing_anchor_signal",
        "operation_without_standalone_object",
        "operation + reference without clear object",
        0.82
      );
    }

    if (/^(why|how|what about|what if|then what|really)\b/.test(text) && !objectCandidate) {
      add(
        "missing_anchor_signal",
        "short_follow_up_needs_prior_context",
        "short follow-up without standalone object",
        0.84
      );
    }

    if (/\b(which one|which option|the best one|the other one)\b/.test(text)) {
      add(
        "missing_anchor_signal",
        "option_reference_needs_options",
        "which/one/option reference",
        0.84
      );
    }
  },

  extractObjectCandidate(text = "") {
    const cleaned = text
      .replace(/\b(what|when|where|why|how|can|could|should|would|do|does|did|is|are|am)\b/g, " ")
      .replace(/\b(i|me|my|you|your|we|us|our)\b/g, " ")
      .replace(/\b(recommend|suggest|choose|pick|prefer|best|better|ideal|plan|explain|fix|debug)\b/g, " ")
      .replace(/\b(it|this|that|they|them|one|same|thing|option|for|about)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const tokens = cleaned
      .split(/\W+/)
      .map(t => t.trim())
      .filter(t => t.length >= 4);

    if (/\d/.test(text)) return text.match(/.{0,30}\d.{0,30}/)?.[0]?.trim() || null;
    if (tokens.length >= 2) return tokens.slice(0, 6).join(" ");

    return null;
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