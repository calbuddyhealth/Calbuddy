// ari/medical/infectious-disease/antibiotics/ari-antibiotic-duration-engine.js
// Purpose: Detect antibiotic duration, stop-date, and reassessment needs.
// V1.0.0 — Antibiotic Duration Engine / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.antibiotics =
  window.Ari.medical.infectiousDisease.antibiotics || {};

window.Ari.medical.infectiousDisease.antibiotics.durationEngine = {
  version: "1.0.0",

  evaluate(input = {}) {
    const room = input.room || input.situationRoom || {};

    const text = this.normalize(
      [
        input.text,
        input.userMessage,
        input.message,
        input.input,
        room.chiefComplaint,
        JSON.stringify(room || {})
      ].filter(Boolean).join(" ")
    );

    const signals = this.detectSignals(text);

    return {
      engine: "ari-antibiotic-duration-engine",
      version: this.version,
      activated: signals.length > 0,
      signals,
      recommendations: this.recommendationsFor(signals),
      actions: this.actionsFor(signals),
      questions: this.followUpQuestions(signals),
      priority: this.priorityFor(signals),
      advisoryOnly: true
    };
  },

  writeToRoom(room = {}, input = {}) {
    const result = this.evaluate({ ...input, room });
    const situationRoom = window.Ari.medical.executive?.situationRoom;

    if (!situationRoom?.write) return room;

    result.signals.forEach(signal => {
      situationRoom.write(room, {
        section: "evidence",
        engine: "ari-antibiotic-duration-engine",
        type: "duration_signal",
        value: signal.value,
        confidence: signal.confidence,
        priority: signal.priority,
        rationale: signal.rationale
      });
    });

    result.recommendations.forEach(item => {
      situationRoom.write(room, {
        section: "providerActions",
        engine: "ari-antibiotic-duration-engine",
        type: "duration_reassessment",
        value: item.value,
        confidence: item.confidence,
        priority: item.priority,
        rationale: item.rationale
      });
    });

    result.actions.forEach(actionId => {
      situationRoom.write(room, {
        section: "providerActions",
        engine: "ari-antibiotic-duration-engine",
        type: "duration_action",
        value: actionId,
        actionId,
        confidence: "medium",
        priority: result.priority,
        rationale: ["Antibiotic duration or stop-date review may be appropriate."]
      });
    });

    result.questions.forEach(question => {
      situationRoom.write(room, {
        section: "questions",
        engine: "ari-antibiotic-duration-engine",
        type: "duration_follow_up",
        value: question,
        confidence: "medium",
        priority: "routine",
        rationale: ["Needed to clarify antibiotic duration, indication, response, and stop date."]
      });
    });

    return room;
  },

  detectSignals(text = "") {
    const signals = [];

    this.addSignal(signals, text, {
      id: "no_stop_date",
      triggers: [
        "no stop date",
        "without stop date",
        "antibiotics indefinitely",
        "continue antibiotics forever",
        "still on antibiotics no end date"
      ],
      value: "No antibiotic stop date documented",
      priority: "moderate",
      rationale: ["Antibiotic therapy should generally have a reassessment point or planned duration."]
    });

    this.addSignal(signals, text, {
      id: "prolonged_antibiotics",
      triggers: [
        "antibiotics for weeks",
        "antibiotics for months",
        "still on antibiotics",
        "long course antibiotics",
        "prolonged antibiotics"
      ],
      value: "Prolonged antibiotic course",
      priority: "moderate",
      rationale: ["Prolonged antibiotic courses should be reviewed for indication, response, toxicity, and planned duration."]
    });

    this.addSignal(signals, text, {
      id: "culture_negative",
      triggers: [
        "culture negative",
        "cultures negative",
        "no growth",
        "blood cultures negative",
        "urine culture negative"
      ],
      value: "Negative culture result",
      priority: "moderate",
      rationale: ["Negative cultures may support reassessment depending on clinical syndrome and prior antibiotic exposure."]
    });

    this.addSignal(signals, text, {
      id: "symptoms_resolved",
      triggers: [
        "symptoms resolved",
        "fever resolved",
        "afebrile",
        "clinically improved",
        "pain improved",
        "improving"
      ],
      value: "Clinical improvement",
      priority: "routine",
      rationale: ["Clinical improvement can support reassessment of route, spectrum, and duration."]
    });

    this.addSignal(signals, text, {
      id: "uti_duration_context",
      triggers: [
        "uti",
        "urinary tract infection",
        "cystitis",
        "pyelonephritis"
      ],
      value: "UTI duration context",
      priority: "routine",
      rationale: ["UTI antibiotic duration depends on syndrome, sex, pregnancy, kidney involvement, and complication risk."]
    });

    this.addSignal(signals, text, {
      id: "pneumonia_duration_context",
      triggers: [
        "pneumonia",
        "cap",
        "hap",
        "vap"
      ],
      value: "Pneumonia duration context",
      priority: "routine",
      rationale: ["Pneumonia duration depends on syndrome type, organism, severity, and clinical stability."]
    });

    this.addSignal(signals, text, {
      id: "cellulitis_duration_context",
      triggers: [
        "cellulitis",
        "skin infection",
        "soft tissue infection",
        "ssti"
      ],
      value: "Skin/soft tissue infection duration context",
      priority: "routine",
      rationale: ["Skin/soft tissue infection duration depends on severity, abscess/source control, and clinical response."]
    });

    this.addSignal(signals, text, {
      id: "sepsis_duration_context",
      triggers: [
        "sepsis",
        "bacteremia",
        "bloodstream infection",
        "positive blood culture"
      ],
      value: "Sepsis/bacteremia duration context",
      priority: "high",
      rationale: ["Sepsis or bacteremia duration depends on organism, source control, complications, and clearance cultures."]
    });

    return signals;
  },

  recommendationsFor(signals = []) {
    const recommendations = [];

    if (this.hasSignal(signals, "no_stop_date")) {
      recommendations.push({
        value: "Establish antibiotic reassessment date and intended duration.",
        confidence: "medium",
        priority: "moderate",
        rationale: ["No stop-date signal detected."]
      });
    }

    if (this.hasSignal(signals, "culture_negative")) {
      recommendations.push({
        value: "Review whether antibiotics are still indicated after negative culture data.",
        confidence: "medium",
        priority: "moderate",
        rationale: ["Negative culture signal detected."]
      });
    }

    if (this.hasSignal(signals, "symptoms_resolved")) {
      recommendations.push({
        value: "Consider reassessing route, spectrum, and duration because symptoms appear improved.",
        confidence: "medium",
        priority: "routine",
        rationale: ["Clinical improvement signal detected."]
      });
    }

    if (this.hasSignal(signals, "sepsis_duration_context")) {
      recommendations.push({
        value: "Clarify organism, source control, and clearance before determining duration.",
        confidence: "medium",
        priority: "high",
        rationale: ["Sepsis or bacteremia context requires higher-level duration reasoning."]
      });
    }

    return recommendations;
  },

  actionsFor(signals = []) {
    const actions = new Set();

    if (signals.length) {
      actions.add("ACTION-NOTIFY-PROVIDER");
    }

    if (this.hasSignal(signals, "sepsis_duration_context")) {
      actions.add("ACTION-CONSULT-INFECTIOUS-DISEASE");
    }

    return [...actions];
  },

  followUpQuestions(signals = []) {
    if (!signals.length) return [];

    return [
      "What antibiotic is being used?",
      "What infection is being treated?",
      "When was the antibiotic started?",
      "Is there a planned stop date or reassessment date?",
      "Are cultures negative, pending, or positive?",
      "Is the patient improving, worsening, or unchanged?",
      "Was source control needed or completed?"
    ];
  },

  priorityFor(signals = []) {
    if (signals.some(signal => signal.priority === "high")) return "high";
    if (signals.some(signal => signal.priority === "moderate")) return "moderate";
    if (signals.length) return "routine";
    return "routine";
  },

  addSignal(list = [], text = "", config = {}) {
    if (this.hasAny(text, config.triggers || [])) {
      if (!list.some(item => item.id === config.id)) {
        list.push({
          id: config.id,
          value: config.value,
          confidence: config.confidence || "medium",
          priority: config.priority || "moderate",
          rationale: config.rationale || []
        });
      }
    }
  },

  hasSignal(signals = [], id = "") {
    return signals.some(signal => signal.id === id);
  },

  hasAny(text = "", terms = []) {
    const clean = this.normalize(text);

    return terms.some(term => {
      const normalizedTerm = this.normalize(term);
      if (!normalizedTerm) return false;

      if (normalizedTerm.length <= 4) {
        const pattern = new RegExp(`\\b${this.escapeRegex(normalizedTerm)}\\b`, "i");
        return pattern.test(clean);
      }

      return clean.includes(normalizedTerm);
    });
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
      .replace(/[^\w\s'.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

window.AriAntibioticDurationEngine =
  window.Ari.medical.infectiousDisease.antibiotics.durationEngine;

console.log(
  "ARI ANTIBIOTIC DURATION ENGINE LOADED:",
  window.Ari.medical.infectiousDisease.antibiotics.durationEngine.version
);