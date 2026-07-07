// ari/medical/infectious-disease/antibiotics/ari-culture-interpretation-engine.js
// Purpose: Interpret culture/Gram stain language and write ID reasoning signals.
// V1.0.0 — Culture Interpretation Engine / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.antibiotics =
  window.Ari.medical.infectiousDisease.antibiotics || {};

window.Ari.medical.infectiousDisease.antibiotics.cultureInterpretationEngine = {
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
      engine: "ari-culture-interpretation-engine",
      version: this.version,
      activated: signals.length > 0,
      signals,
      suspectedOrganisms: this.suspectedOrganisms(signals),
      requiredCoverage: this.requiredCoverage(signals),
      resistanceConcerns: this.resistanceConcerns(signals),
      questions: this.followUpQuestions(signals),
      actions: this.actionsFor(signals),
      priority: this.priorityFor(signals),
      advisoryOnly: true
    };
  },

  writeToRoom(room = {}, input = {}) {
    const result = this.evaluate({
      ...input,
      room
    });

    const situationRoom = window.Ari.medical.executive?.situationRoom;
    if (!situationRoom?.write) return room;

    result.signals.forEach(signal => {
      situationRoom.write(room, {
        section: "evidence",
        engine: "ari-culture-interpretation-engine",
        type: "culture_signal",
        value: signal.value,
        confidence: signal.confidence,
        priority: signal.priority,
        rationale: signal.rationale
      });
    });

    result.suspectedOrganisms.forEach(organism => {
      situationRoom.write(room, {
        section: "suspectedOrganisms",
        engine: "ari-culture-interpretation-engine",
        type: "suspected_organism",
        value: organism.value,
        umkoId: organism.umkoId || "",
        confidence: organism.confidence,
        priority: organism.priority,
        rationale: organism.rationale
      });
    });

    result.requiredCoverage.forEach(coverage => {
      situationRoom.write(room, {
        section: "evidence",
        engine: "ari-culture-interpretation-engine",
        type: "required_antibiotic_coverage",
        value: coverage.target,
        confidence: coverage.confidence,
        priority: coverage.priority,
        rationale: coverage.rationale
      });
    });

    result.resistanceConcerns.forEach(risk => {
      situationRoom.write(room, {
        section: "risks",
        engine: "ari-culture-interpretation-engine",
        type: "resistance_concern",
        value: risk.value,
        confidence: risk.confidence,
        priority: risk.priority,
        rationale: risk.rationale
      });
    });

    result.questions.forEach(question => {
      situationRoom.write(room, {
        section: "questions",
        engine: "ari-culture-interpretation-engine",
        type: "culture_follow_up",
        value: question,
        confidence: "medium",
        priority: "routine",
        rationale: ["Needed to interpret culture, source, contamination risk, or susceptibilities."]
      });
    });

    result.actions.forEach(actionId => {
      situationRoom.write(room, {
        section: "providerActions",
        engine: "ari-culture-interpretation-engine",
        type: "culture_action",
        value: actionId,
        actionId,
        confidence: "medium",
        priority: result.priority,
        rationale: ["Culture finding may require provider review and antibiotic reassessment."]
      });
    });

    return room;
  },

  detectSignals(text = "") {
    const signals = [];

    this.addSignal(signals, text, {
      id: "blood_culture_positive",
      triggers: ["blood culture positive", "positive blood culture", "blood cultures positive", "bacteremia"],
      value: "positive blood culture",
      priority: "high",
      rationale: ["Positive blood cultures can indicate bacteremia and require source/organism review."]
    });

    this.addSignal(signals, text, {
      id: "urine_culture_positive",
      triggers: ["urine culture positive", "positive urine culture", "urine culture grew"],
      value: "positive urine culture",
      priority: "moderate",
      rationale: ["Urine culture interpretation depends on symptoms, catheter status, organism, and colony count."]
    });

    this.addSignal(signals, text, {
      id: "gram_positive_cocci_clusters",
      triggers: ["gram positive cocci in clusters", "gpc in clusters"],
      value: "gram positive cocci in clusters",
      priority: "high",
      rationale: ["Gram-positive cocci in clusters suggests Staphylococcus species."]
    });

    this.addSignal(signals, text, {
      id: "gram_positive_cocci_chains",
      triggers: ["gram positive cocci in chains", "gpc in chains"],
      value: "gram positive cocci in chains",
      priority: "high",
      rationale: ["Gram-positive cocci in chains suggests Streptococcus or Enterococcus."]
    });

    this.addSignal(signals, text, {
      id: "gram_negative_rods",
      triggers: ["gram negative rods", "gnr"],
      value: "gram negative rods",
      priority: "high",
      rationale: ["Gram-negative rods suggest Enterobacterales or non-fermenters depending on source and setting."]
    });

    this.addSignal(signals, text, {
      id: "gram_negative_diplococci",
      triggers: ["gram negative diplococci"],
      value: "gram negative diplococci",
      priority: "high",
      rationale: ["Gram-negative diplococci can suggest Neisseria species in the right context."]
    });

    this.addSignal(signals, text, {
      id: "susceptibilities_pending",
      triggers: ["susceptibilities pending", "sensitivities pending", "culture pending sensitivities"],
      value: "susceptibilities pending",
      priority: "moderate",
      rationale: ["Antibiotic plan may need reassessment once susceptibilities result."]
    });

    this.addSignal(signals, text, {
      id: "contaminant_possible",
      triggers: ["possible contaminant", "likely contaminant", "skin contaminant", "single bottle positive"],
      value: "possible contaminant",
      priority: "moderate",
      rationale: ["Culture significance depends on organism, number of positive bottles, symptoms, and devices."]
    });

    this.addSignal(signals, text, {
      id: "mrsa_detected",
      triggers: ["mrsa", "methicillin resistant staph aureus"],
      value: "MRSA",
      priority: "high",
      rationale: ["MRSA requires MRSA-active antibiotic coverage when clinically significant."]
    });

    this.addSignal(signals, text, {
      id: "esbl_detected",
      triggers: ["esbl", "extended spectrum beta lactamase"],
      value: "ESBL",
      priority: "critical",
      rationale: ["ESBL organisms may require resistant gram-negative coverage review."]
    });

    this.addSignal(signals, text, {
      id: "cre_detected",
      triggers: ["cre", "carbapenem resistant", "carbapenemase"],
      value: "CRE",
      priority: "critical",
      rationale: ["CRE is a major resistance concern and often requires ID/pharmacy review."]
    });

    return signals;
  },

  suspectedOrganisms(signals = []) {
    const organisms = [];

    if (this.hasSignal(signals, "gram_positive_cocci_clusters")) {
      organisms.push({
        value: "Staphylococcus species",
        umkoId: "ORG-BACT-STAPH-0001",
        confidence: "medium",
        priority: "high",
        rationale: ["Gram-positive cocci in clusters suggests Staphylococcus."]
      });
    }

    if (this.hasSignal(signals, "gram_positive_cocci_chains")) {
      organisms.push({
        value: "Streptococcus or Enterococcus species",
        confidence: "medium",
        priority: "high",
        rationale: ["Gram-positive cocci in chains suggests Streptococcus or Enterococcus."]
      });
    }

    if (this.hasSignal(signals, "gram_negative_rods")) {
      organisms.push({
        value: "Gram-negative rods",
        confidence: "medium",
        priority: "high",
        rationale: ["Gram-negative rods require source and susceptibility interpretation."]
      });
    }

    if (this.hasSignal(signals, "mrsa_detected")) {
      organisms.push({
        value: "MRSA",
        umkoId: "ORG-BACT-STAPH-0001",
        confidence: "high",
        priority: "high",
        rationale: ["MRSA explicitly detected."]
      });
    }

    return organisms;
  },

  requiredCoverage(signals = []) {
    const required = [];

    if (this.hasSignal(signals, "mrsa_detected") || this.hasSignal(signals, "gram_positive_cocci_clusters")) {
      required.push({
        target: "mrsa",
        confidence: this.hasSignal(signals, "mrsa_detected") ? "high" : "medium",
        priority: "high",
        rationale: ["Staphylococcal/MRSA coverage may be needed depending on final organism and clinical context."]
      });
    }

    if (this.hasSignal(signals, "gram_negative_rods")) {
      required.push({
        target: "gramNegative",
        confidence: "medium",
        priority: "high",
        rationale: ["Gram-negative rod signal detected."]
      });
    }

    if (this.hasSignal(signals, "esbl_detected")) {
      required.push({
        target: "esbl",
        confidence: "high",
        priority: "critical",
        rationale: ["ESBL resistance signal detected."]
      });
    }

    if (this.hasSignal(signals, "cre_detected")) {
      required.push({
        target: "cre",
        confidence: "high",
        priority: "critical",
        rationale: ["CRE resistance signal detected."]
      });
    }

    return required;
  },

  resistanceConcerns(signals = []) {
    const risks = [];

    if (this.hasSignal(signals, "esbl_detected")) {
      risks.push({
        value: "ESBL resistance concern",
        confidence: "high",
        priority: "critical",
        rationale: ["ESBL detected in culture language."]
      });
    }

    if (this.hasSignal(signals, "cre_detected")) {
      risks.push({
        value: "CRE resistance concern",
        confidence: "high",
        priority: "critical",
        rationale: ["CRE/carbapenem resistance detected in culture language."]
      });
    }

    if (this.hasSignal(signals, "susceptibilities_pending")) {
      risks.push({
        value: "Susceptibilities pending",
        confidence: "high",
        priority: "moderate",
        rationale: ["Antibiotic plan may need adjustment when susceptibilities result."]
      });
    }

    return risks;
  },

  followUpQuestions(signals = []) {
    if (!signals.length) return [];

    return [
      "What culture source is positive: blood, urine, wound, sputum, CSF, or another site?",
      "How many culture bottles or specimens are positive?",
      "What organism was identified, if any?",
      "Are susceptibilities available or still pending?",
      "Is the patient symptomatic or clinically unstable?",
      "Any indwelling lines, prosthetic valves, prosthetic joints, urinary catheter, or implanted devices?"
    ];
  },

  actionsFor(signals = []) {
    const actions = new Set();

    if (
      this.hasSignal(signals, "blood_culture_positive") ||
      this.hasSignal(signals, "esbl_detected") ||
      this.hasSignal(signals, "cre_detected")
    ) {
      actions.add("ACTION-NOTIFY-PROVIDER");
    }

    if (this.hasSignal(signals, "cre_detected")) {
      actions.add("ACTION-CONSULT-INFECTIOUS-DISEASE");
    }

    return [...actions];
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
    return terms.some(term => clean.includes(this.normalize(term)));
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

window.AriCultureInterpretationEngine =
  window.Ari.medical.infectiousDisease.antibiotics.cultureInterpretationEngine;

console.log(
  "ARI CULTURE INTERPRETATION ENGINE LOADED:",
  window.Ari.medical.infectiousDisease.antibiotics.cultureInterpretationEngine.version
);