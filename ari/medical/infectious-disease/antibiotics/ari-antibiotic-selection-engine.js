// ari/medical/infectious-disease/antibiotics/ari-antibiotic-selection-engine.js
// Purpose: Compare required antimicrobial coverage against antibiotic spectrum profiles.
// V1.0.0 — Antibiotic Selection Engine / Spectrum Matching / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.antibiotics =
  window.Ari.medical.infectiousDisease.antibiotics || {};

window.Ari.medical.infectiousDisease.antibiotics.selectionEngine = {
  version: "1.0.0",

  evaluate(input = {}) {
    const room = input.room || input.situationRoom || {};
    const spectrumRegistry =
      window.Ari.medical.infectiousDisease.antibiotics.spectrumRegistry;

    if (!spectrumRegistry?.entries) {
      return this.empty("Antibiotic Spectrum Registry not loaded.");
    }

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

    const requiredCoverage = this.detectRequiredCoverage(text);
    const candidates = this.scoreCandidates(requiredCoverage, spectrumRegistry.entries());

    return {
      engine: "ari-antibiotic-selection-engine",
      version: this.version,
      activated: requiredCoverage.length > 0,
      requiredCoverage,
      candidates,
      bestCandidates: candidates.slice(0, 3),
      warnings: this.detectWarnings(text, requiredCoverage),
      questions: this.followUpQuestions(requiredCoverage),
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

    result.requiredCoverage.forEach(item => {
      situationRoom.write(room, {
        section: "evidence",
        engine: "ari-antibiotic-selection-engine",
        type: "required_antibiotic_coverage",
        value: item.target,
        confidence: item.confidence,
        priority: item.priority,
        rationale: item.rationale
      });
    });

    result.bestCandidates.forEach(candidate => {
      situationRoom.write(room, {
        section: "providerActions",
        engine: "ari-antibiotic-selection-engine",
        type: "antibiotic_candidate_review",
        value: candidate.genericName,
        umkoId: candidate.umkoId,
        confidence: candidate.confidence,
        priority: candidate.priority,
        rationale: candidate.rationale
      });
    });

    result.warnings.forEach(warning => {
      situationRoom.write(room, {
        section: "risks",
        engine: "ari-antibiotic-selection-engine",
        type: "antibiotic_selection_warning",
        value: warning.value,
        confidence: "medium",
        priority: warning.priority,
        rationale: warning.rationale
      });
    });

    result.questions.forEach(question => {
      situationRoom.write(room, {
        section: "questions",
        engine: "ari-antibiotic-selection-engine",
        type: "antibiotic_selection_follow_up",
        value: question,
        confidence: "medium",
        priority: "routine",
        rationale: ["Needed to safely refine antibiotic coverage reasoning."]
      });
    });

    return room;
  },

  detectRequiredCoverage(text = "") {
    const required = [];

    this.addCoverage(required, text, {
      target: "mrsa",
      triggers: ["mrsa", "methicillin resistant staph", "skin abscess", "purulent cellulitis"],
      priority: "high",
      rationale: ["MRSA signal detected."]
    });

    this.addCoverage(required, text, {
      target: "pseudomonas",
      triggers: ["pseudomonas", "ventilator associated pneumonia", "hospital acquired pneumonia", "neutropenic fever", "burn wound"],
      priority: "high",
      rationale: ["Pseudomonas risk signal detected."]
    });

    this.addCoverage(required, text, {
      target: "anaerobes",
      triggers: ["intra abdominal infection", "aspiration", "diabetic foot", "necrotizing infection", "abscess"],
      priority: "high",
      rationale: ["Anaerobic infection risk signal detected."]
    });

    this.addCoverage(required, text, {
      target: "esbl",
      triggers: ["esbl", "extended spectrum beta lactamase"],
      priority: "critical",
      rationale: ["ESBL resistance signal detected."]
    });

    this.addCoverage(required, text, {
      target: "cre",
      triggers: ["cre", "carbapenem resistant", "carbapenemase"],
      priority: "critical",
      rationale: ["CRE resistance signal detected."]
    });

    this.addCoverage(required, text, {
      target: "cDiff",
      triggers: ["c diff", "clostridioides difficile", "clostridium difficile"],
      priority: "high",
      rationale: ["C. difficile signal detected."]
    });

    this.addCoverage(required, text, {
      target: "gramNegative",
      triggers: ["gram negative", "e coli", "klebsiella", "enterobacterales", "uti", "pyelonephritis", "urosepsis"],
      priority: "moderate",
      rationale: ["Gram-negative coverage signal detected."]
    });

    this.addCoverage(required, text, {
      target: "gramPositive",
      triggers: ["gram positive", "staph", "strep", "cellulitis", "endocarditis"],
      priority: "moderate",
      rationale: ["Gram-positive coverage signal detected."]
    });

    return required;
  },

  addCoverage(list = [], text = "", config = {}) {
    if (this.hasAny(text, config.triggers || [])) {
      if (!list.some(item => item.target === config.target)) {
        list.push({
          target: config.target,
          minimumStrength: config.minimumStrength || 3,
          confidence: "medium",
          priority: config.priority || "moderate",
          rationale: config.rationale || []
        });
      }
    }
  },

  scoreCandidates(requiredCoverage = [], antibiotics = []) {
    return antibiotics
      .map(entry => {
        const scored = this.scoreEntry(entry, requiredCoverage);

        return {
          id: entry.id,
          umkoId: entry.umkoId,
          genericName: entry.genericName,
          drugClass: entry.drugClass,
          score: scored.score,
          matched: scored.matched,
          missed: scored.missed,
          monitoring: entry.monitoring || [],
          precautions: entry.precautions || [],
          confidence: scored.missed.length ? "low" : "medium",
          priority: scored.missed.length ? "routine" : "moderate",
          rationale: this.rationaleFor(entry, scored)
        };
      })
      .sort((a, b) => b.score - a.score);
  },

  scoreEntry(entry = {}, requiredCoverage = []) {
    let score = 0;
    const matched = [];
    const missed = [];

    requiredCoverage.forEach(req => {
      const profile = entry.spectrum?.[req.target];
      const strength = Number(profile?.strength || 0);
      const hasCoverage = Boolean(profile?.coverage && strength >= req.minimumStrength);

      if (hasCoverage) {
        matched.push(req.target);
        score += strength;
      } else {
        missed.push(req.target);
        score -= 5;
      }
    });

    return { score, matched, missed };
  },

  rationaleFor(entry = {}, scored = {}) {
    const rationale = [];

    if (scored.matched.length) {
      rationale.push(`${entry.genericName} matches required coverage: ${scored.matched.join(", ")}.`);
    }

    if (scored.missed.length) {
      rationale.push(`${entry.genericName} misses required coverage: ${scored.missed.join(", ")}.`);
    }

    if (!scored.matched.length && !scored.missed.length) {
      rationale.push("No specific coverage requirement was detected.");
    }

    return rationale;
  },

  detectWarnings(text = "", requiredCoverage = []) {
    const warnings = [];

    if (requiredCoverage.some(x => x.target === "mrsa") && this.hasAny(text, ["ceftriaxone", "zosyn", "piperacillin tazobactam"])) {
      warnings.push({
        value: "Possible MRSA coverage gap.",
        priority: "high",
        rationale: ["Selected or mentioned antibiotic may not cover MRSA."]
      });
    }

    if (requiredCoverage.some(x => x.target === "pseudomonas") && this.hasAny(text, ["ceftriaxone", "vancomycin"])) {
      warnings.push({
        value: "Possible Pseudomonas coverage gap.",
        priority: "high",
        rationale: ["Selected or mentioned antibiotic may not cover Pseudomonas."]
      });
    }

    if (requiredCoverage.some(x => x.target === "anaerobes") && this.hasAny(text, ["ceftriaxone", "cefepime", "vancomycin"])) {
      warnings.push({
        value: "Possible anaerobic coverage gap.",
        priority: "moderate",
        rationale: ["Selected or mentioned antibiotic may not provide adequate anaerobic coverage."]
      });
    }

    return warnings;
  },

  followUpQuestions(requiredCoverage = []) {
    if (!requiredCoverage.length) return [];

    return [
      "What is the suspected infection source?",
      "Are culture and susceptibility results available?",
      "Any severe beta-lactam allergy?",
      "Any kidney or liver impairment?",
      "Is this community-acquired or healthcare-associated?",
      "Any prior resistant organisms such as MRSA, ESBL, CRE, VRE, or Pseudomonas?"
    ];
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
  },

  empty(error = "") {
    return {
      engine: "ari-antibiotic-selection-engine",
      version: this.version,
      activated: false,
      requiredCoverage: [],
      candidates: [],
      bestCandidates: [],
      warnings: [],
      questions: [],
      error,
      advisoryOnly: true
    };
  }
};

window.AriAntibioticSelectionEngine =
  window.Ari.medical.infectiousDisease.antibiotics.selectionEngine;

console.log(
  "ARI ANTIBIOTIC SELECTION ENGINE LOADED:",
  window.Ari.medical.infectiousDisease.antibiotics.selectionEngine.version
);