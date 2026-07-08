// ari/medical/infectious-disease/antibiotics/ari-antimicrobial-stewardship-engine.js
// Purpose: Detect antimicrobial stewardship opportunities and safety checks.
// V1.0.0 — Antimicrobial Stewardship Engine / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.antibiotics =
  window.Ari.medical.infectiousDisease.antibiotics || {};

window.Ari.medical.infectiousDisease.antibiotics.stewardshipEngine = {
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
      engine: "ari-antimicrobial-stewardship-engine",
      version: this.version,
      activated: signals.length > 0,
      signals,
      stewardshipOpportunities: this.opportunitiesFor(signals),
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
        engine: "ari-antimicrobial-stewardship-engine",
        type: "stewardship_signal",
        value: signal.value,
        confidence: signal.confidence,
        priority: signal.priority,
        rationale: signal.rationale
      });
    });

    result.stewardshipOpportunities.forEach(item => {
      situationRoom.write(room, {
        section: "providerActions",
        engine: "ari-antimicrobial-stewardship-engine",
        type: "stewardship_opportunity",
        value: item.value,
        confidence: item.confidence,
        priority: item.priority,
        rationale: item.rationale
      });
    });

    result.actions.forEach(actionId => {
      situationRoom.write(room, {
        section: "providerActions",
        engine: "ari-antimicrobial-stewardship-engine",
        type: "stewardship_action",
        value: actionId,
        actionId,
        confidence: "medium",
        priority: result.priority,
        rationale: ["Antimicrobial stewardship review may be appropriate."]
      });
    });

    result.questions.forEach(question => {
      situationRoom.write(room, {
        section: "questions",
        engine: "ari-antimicrobial-stewardship-engine",
        type: "stewardship_follow_up",
        value: question,
        confidence: "medium",
        priority: "routine",
        rationale: ["Needed to refine antimicrobial stewardship assessment."]
      });
    });

    return room;
  },

  detectSignals(text = "") {
    const signals = [];

    this.addSignal(signals, text, {
      id: "broad_spectrum",
      triggers: ["broad spectrum", "vancomycin and zosyn", "vanc zosyn", "cefepime", "meropenem", "piperacillin tazobactam"],
      value: "Broad-spectrum antibiotic use",
      priority: "moderate",
      rationale: ["Broad-spectrum therapy may need reassessment once diagnosis and cultures are clarified."]
    });

    this.addSignal(signals, text, {
      id: "culture_results_available",
      triggers: ["susceptibilities available", "sensitivities resulted", "culture resulted", "organism identified"],
      value: "Culture results available",
      priority: "moderate",
      rationale: ["Culture results can support narrowing or changing therapy."]
    });

    this.addSignal(signals, text, {
      id: "susceptibilities_pending",
      triggers: ["susceptibilities pending", "sensitivities pending", "culture pending"],
      value: "Susceptibilities pending",
      priority: "routine",
      rationale: ["Therapy may need reassessment when susceptibilities result."]
    });

    this.addSignal(signals, text, {
      id: "duplicate_coverage",
      triggers: ["double coverage", "duplicate coverage", "two antibiotics for same coverage"],
      value: "Possible duplicate antimicrobial coverage",
      priority: "moderate",
      rationale: ["Duplicate antimicrobial coverage may increase toxicity without benefit."]
    });

    this.addSignal(signals, text, {
      id: "no_clear_indication",
      triggers: ["no source", "unclear source", "unknown source", "no infection found", "afebrile no symptoms"],
      value: "Antibiotic indication unclear",
      priority: "moderate",
      rationale: ["Antibiotic need should be reassessed when infection evidence is unclear."]
    });

    this.addSignal(signals, text, {
      id: "renal_risk",
      triggers: ["aki", "acute kidney injury", "rising creatinine", "renal failure", "kidney injury"],
      value: "Renal toxicity/dosing concern",
      priority: "high",
      rationale: ["Renal dysfunction can affect antibiotic selection, dosing, and toxicity."]
    });

    this.addSignal(signals, text, {
      id: "c_diff_risk",
      triggers: ["c diff", "clostridioides difficile", "diarrhea after antibiotics"],
      value: "C. difficile risk",
      priority: "high",
      rationale: ["Antibiotic exposure can worsen or precipitate C. difficile risk."]
    });

    return signals;
  },

  opportunitiesFor(signals = []) {
    const opportunities = [];

    if (this.hasSignal(signals, "culture_results_available")) {
      opportunities.push({
        value: "Review for de-escalation based on organism and susceptibilities.",
        confidence: "medium",
        priority: "moderate",
        rationale: ["Culture results are available."]
      });
    }

    if (this.hasSignal(signals, "broad_spectrum")) {
      opportunities.push({
        value: "Reassess need for broad-spectrum therapy.",
        confidence: "medium",
        priority: "moderate",
        rationale: ["Broad-spectrum antibiotic signal detected."]
      });
    }

    if (this.hasSignal(signals, "no_clear_indication")) {
      opportunities.push({
        value: "Clarify infection source and whether antibiotics are still indicated.",
        confidence: "medium",
        priority: "moderate",
        rationale: ["Antibiotic indication may be unclear."]
      });
    }

    if (this.hasSignal(signals, "renal_risk")) {
      opportunities.push({
        value: "Review renal dosing and nephrotoxic antibiotic exposure.",
        confidence: "medium",
        priority: "high",
        rationale: ["Renal dysfunction signal detected."]
      });
    }

    return opportunities;
  },

  actionsFor(signals = []) {
    const actions = new Set();

    if (signals.length) actions.add("ACTION-NOTIFY-PROVIDER");

    if (
      this.hasSignal(signals, "renal_risk") ||
      this.hasSignal(signals, "broad_spectrum") ||
      this.hasSignal(signals, "culture_results_available")
    ) {
      actions.add("ACTION-CONSULT-INFECTIOUS-DISEASE");
    }

    return [...actions];
  },

  followUpQuestions(signals = []) {
    if (!signals.length) return [];

    return [
      "What antibiotic is currently being used?",
      "What infection source is suspected?",
      "Are culture and susceptibility results available?",
      "Is the patient improving, worsening, or stable?",
      "Any kidney injury, allergy, pregnancy, or immunocompromise?",
      "Is there a planned antibiotic stop date or reassessment date?"
    ];
  },

  priorityFor(signals = []) {
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

window.AriAntimicrobialStewardshipEngine =
  window.Ari.medical.infectiousDisease.antibiotics.stewardshipEngine;

console.log(
  "ARI ANTIMICROBIAL STEWARDSHIP ENGINE LOADED:",
  window.Ari.medical.infectiousDisease.antibiotics.stewardshipEngine.version
);