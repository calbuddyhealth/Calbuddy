// ari/medical/infectious-disease/antibiotics/ari-resistance-pattern-engine.js
// Purpose: Detect antimicrobial resistance signals and write coverage/consult needs.
// V1.0.0 — Resistance Pattern Engine / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.antibiotics =
  window.Ari.medical.infectiousDisease.antibiotics || {};

window.Ari.medical.infectiousDisease.antibiotics.resistancePatternEngine = {
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
      engine: "ari-resistance-pattern-engine",
      version: this.version,
      activated: signals.length > 0,
      signals,
      requiredCoverage: this.requiredCoverage(signals),
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
        section: "risks",
        engine: "ari-resistance-pattern-engine",
        type: "resistance_signal",
        value: signal.value,
        confidence: signal.confidence,
        priority: signal.priority,
        rationale: signal.rationale
      });
    });

    result.requiredCoverage.forEach(coverage => {
      situationRoom.write(room, {
        section: "evidence",
        engine: "ari-resistance-pattern-engine",
        type: "required_antibiotic_coverage",
        value: coverage.target,
        confidence: coverage.confidence,
        priority: coverage.priority,
        rationale: coverage.rationale
      });
    });

    result.actions.forEach(actionId => {
      situationRoom.write(room, {
        section: "providerActions",
        engine: "ari-resistance-pattern-engine",
        type: "resistance_action",
        value: actionId,
        actionId,
        confidence: "medium",
        priority: result.priority,
        rationale: ["Resistance signal may require clinician, ID, or pharmacy review."]
      });
    });

    result.questions.forEach(question => {
      situationRoom.write(room, {
        section: "questions",
        engine: "ari-resistance-pattern-engine",
        type: "resistance_follow_up",
        value: question,
        confidence: "medium",
        priority: "routine",
        rationale: ["Needed to clarify resistance risk and antimicrobial coverage."]
      });
    });

    return room;
  },

  detectSignals(text = "") {
    const signals = [];

    this.addSignal(signals, text, {
      id: "mrsa",
      triggers: ["mrsa", "methicillin resistant staph aureus", "history of mrsa"],
      value: "MRSA risk",
      priority: "high",
      rationale: ["MRSA signal detected."]
    });

    this.addSignal(signals, text, {
      id: "vre",
      triggers: ["vre", "vancomycin resistant enterococcus"],
      value: "VRE risk",
      priority: "high",
      rationale: ["VRE signal detected."]
    });

    this.addSignal(signals, text, {
      id: "esbl",
      triggers: ["esbl", "extended spectrum beta lactamase"],
      value: "ESBL risk",
      priority: "critical",
      rationale: ["ESBL resistance signal detected."]
    });

    this.addSignal(signals, text, {
      id: "cre",
      triggers: ["cre", "carbapenem resistant", "carbapenemase"],
      value: "CRE risk",
      priority: "critical",
      rationale: ["CRE/carbapenem resistance signal detected."]
    });

    this.addSignal(signals, text, {
      id: "pseudomonas",
      triggers: [
        "pseudomonas",
        "prior pseudomonas",
        "ventilator associated pneumonia",
        "hospital acquired pneumonia",
        "neutropenic fever",
        "burn wound"
      ],
      value: "Pseudomonas risk",
      priority: "high",
      rationale: ["Pseudomonas risk signal detected."]
    });

    this.addSignal(signals, text, {
      id: "recent_antibiotics",
      triggers: ["recent antibiotics", "antibiotics in last 90 days", "failed antibiotics"],
      value: "Recent antibiotic exposure",
      priority: "moderate",
      rationale: ["Recent antibiotic exposure can increase resistant organism risk."]
    });

    this.addSignal(signals, text, {
      id: "healthcare_exposure",
      triggers: ["recent hospitalization", "nursing home", "long term care", "dialysis", "healthcare associated"],
      value: "Healthcare-associated resistance risk",
      priority: "moderate",
      rationale: ["Healthcare exposure can increase resistant organism risk."]
    });

    this.addSignal(signals, text, {
      id: "device_risk",
      triggers: ["central line", "foley", "catheter", "picc", "prosthetic valve", "prosthetic joint"],
      value: "Device-associated infection risk",
      priority: "moderate",
      rationale: ["Indwelling devices can increase complicated infection and resistant organism concern."]
    });

    return signals;
  },

  requiredCoverage(signals = []) {
    const required = [];

    if (this.hasSignal(signals, "mrsa")) {
      required.push({
        target: "mrsa",
        confidence: "high",
        priority: "high",
        rationale: ["MRSA coverage may be needed depending on syndrome and severity."]
      });
    }

    if (this.hasSignal(signals, "vre")) {
      required.push({
        target: "vre",
        confidence: "high",
        priority: "high",
        rationale: ["VRE-active coverage may be needed if clinically significant."]
      });
    }

    if (this.hasSignal(signals, "esbl")) {
      required.push({
        target: "esbl",
        confidence: "high",
        priority: "critical",
        rationale: ["ESBL-active coverage should be reviewed."]
      });
    }

    if (this.hasSignal(signals, "cre")) {
      required.push({
        target: "cre",
        confidence: "high",
        priority: "critical",
        rationale: ["CRE-active therapy requires specialist-level review."]
      });
    }

    if (this.hasSignal(signals, "pseudomonas")) {
      required.push({
        target: "pseudomonas",
        confidence: "medium",
        priority: "high",
        rationale: ["Anti-pseudomonal coverage may be needed depending on source and severity."]
      });
    }

    return required;
  },

  actionsFor(signals = []) {
    const actions = new Set();

    if (signals.length) actions.add("ACTION-NOTIFY-PROVIDER");

    if (
      this.hasSignal(signals, "esbl") ||
      this.hasSignal(signals, "cre") ||
      this.hasSignal(signals, "vre")
    ) {
      actions.add("ACTION-CONSULT-INFECTIOUS-DISEASE");
    }

    return [...actions];
  },

  followUpQuestions(signals = []) {
    if (!signals.length) return [];

    return [
      "What organism was identified?",
      "What infection source is suspected?",
      "Are susceptibilities available?",
      "Any prior MRSA, VRE, ESBL, CRE, or Pseudomonas?",
      "Any recent hospitalization, antibiotics, dialysis, or long-term care exposure?",
      "Any kidney disease, liver disease, severe allergy, pregnancy, or immunocompromise?"
    ];
  },

  priorityFor(signals = []) {
    if (signals.some(signal => signal.priority === "critical")) return "critical";
    if (signals.some(signal => signal.priority === "high")) return "high";
    if (signals.length) return "moderate";
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

window.AriResistancePatternEngine =
  window.Ari.medical.infectiousDisease.antibiotics.resistancePatternEngine;

console.log(
  "ARI RESISTANCE PATTERN ENGINE LOADED:",
  window.Ari.medical.infectiousDisease.antibiotics.resistancePatternEngine.version
);