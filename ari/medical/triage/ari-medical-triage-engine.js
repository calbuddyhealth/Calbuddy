// ari/medical/triage/ari-medical-triage-engine.js
// Purpose: Combine red flags, symptom patterns, special populations, and body-system routing into one medical urgency packet.
// V1.0.0 — Medical Triage Orchestrator / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.triageEngine = {
  version: "1.0.0",

  run(input = {}) {
    const summary = input.summary || input || {};

    const text = window.Ari.medical.utils.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const redFlags =
      summary.medicalRedFlags ||
      summary.redFlagPacket ||
      this.safeRun(window.Ari.medical.redFlagEngine, "evaluate", summary);

    const pattern =
      summary.medicalSymptomPattern ||
      summary.symptomPatternPacket ||
      null;

    const bodySystems =
      summary.medicalBodySystems ||
      summary.bodySystemsPacket ||
      null;

    const specialPopulation = this.detectSpecialPopulation(text);
    const urgency = this.resolveUrgency({ redFlags, pattern, specialPopulation });

    return window.Ari.medical.contract.create({
      engine: "ari-medical-triage-engine",
      version: this.version,
      activated: true,
      confidence: this.resolveConfidence({ redFlags, pattern, urgency }),
      urgency,
      redFlags,
      symptomPattern: pattern,
      bodySystems,
      specialPopulation,
      reasoning: this.buildReasoning({ urgency, redFlags, pattern, specialPopulation }),
      nextStep: this.nextStepFor({ urgency, specialPopulation }),
      responsePosture: {
        label: "medical_triage",
        advisoryOnly: true,
        avoidDiagnosis: true,
        safetyFirst: urgency === "emergency" || urgency === "urgent",
        broadThenSpecific: true,
        maxFollowUpQuestions:
          urgency === "emergency" ? 2 :
          urgency === "urgent" ? 3 :
          2
      },
      cannotSet: [
        "diagnosis",
        "finalDiagnosis",
        "prescription",
        "medicationDoseChange",
        "ignoreEmergencyCare",
        "replaceClinician"
      ]
    });
  },

  detectSpecialPopulation(text = "") {
    const groups = [];

    if (this.hasAny(text, ["newborn", "infant", "baby", "toddler", "child", "pediatric"])) {
      groups.push("pediatric");
    }

    if (this.hasAny(text, ["pregnant", "pregnancy", "weeks pregnant", "trimester"])) {
      groups.push("pregnancy");
    }

    if (this.hasAny(text, ["elderly", "older adult", "geriatric"])) {
      groups.push("older_adult");
    }

    if (this.hasAny(text, ["immunocompromised", "chemotherapy", "transplant", "hiv", "steroids"])) {
      groups.push("immunocompromised");
    }

    return {
      present: groups.length > 0,
      groups
    };
  },

  resolveUrgency({ redFlags = null, pattern = null, specialPopulation = {} } = {}) {
    const redUrgency = redFlags?.urgency || "routine";
    const patternUrgency =
      pattern?.urgency ||
      pattern?.primaryPattern?.urgency ||
      "routine";

    if (redUrgency === "emergency" || patternUrgency === "emergency") {
      return "emergency";
    }

    if (redUrgency === "urgent" || patternUrgency === "urgent") {
      return "urgent";
    }

    if (specialPopulation.present && patternUrgency !== "routine") {
      return "urgent";
    }

    if (specialPopulation.groups?.includes("pediatric") && this.hasPediatricCaution(pattern)) {
      return "urgent";
    }

    return "routine";
  },

  hasPediatricCaution(pattern = null) {
    const label = String(
      pattern?.primaryPattern?.label ||
      pattern?.primaryPattern?.id ||
      pattern?.label ||
      ""
    ).toLowerCase();

    return /fever|breathing|dehydration|vomit|rash|lethargy|infection/.test(label);
  },

  resolveConfidence({ redFlags = null, pattern = null, urgency = "routine" } = {}) {
    if (urgency === "emergency" && redFlags?.confidence === "high") return "high";
    if (pattern?.confidence === "high") return "high";
    if (redFlags?.confidence === "medium") return "medium";
    return urgency === "routine" ? "low" : "medium";
  },

  buildReasoning({ urgency = "routine", redFlags = null, pattern = null, specialPopulation = {} } = {}) {
    const parts = [];

    if (redFlags?.findings?.length) {
      parts.push("Red-flag symptoms were detected.");
    }

    if (pattern?.primaryPattern) {
      parts.push(`Primary symptom pattern: ${pattern.primaryPattern.label || pattern.primaryPattern.id || "available"}.`);
    }

    if (specialPopulation.present) {
      parts.push(`Special population caution: ${specialPopulation.groups.join(", ")}.`);
    }

    if (!parts.length) {
      parts.push("No emergency pattern was detected from the available message.");
    }

    parts.push(`Resolved urgency: ${urgency}.`);

    return parts.join(" ");
  },

  nextStepFor({ urgency = "routine", specialPopulation = {} } = {}) {
    if (urgency === "emergency") {
      return "Lead with emergency escalation. Tell the user to seek emergency care now if symptoms are current, severe, or worsening.";
    }

    if (urgency === "urgent") {
      if (specialPopulation.groups?.includes("pregnancy")) {
        return "Recommend same-day OB triage, clinician contact, urgent care, or emergency care depending on severity.";
      }

      if (specialPopulation.groups?.includes("pediatric")) {
        return "Recommend same-day pediatric advice line, pediatric urgent care, or emergency care if breathing, hydration, alertness, or fever red flags are present.";
      }

      return "Recommend same-day clinician contact or urgent care, with emergency care if symptoms worsen.";
    }

    return "Proceed with general education, focused questions only if needed, and clear return precautions.";
  },

  safeRun(engine = null, method = "", summary = {}) {
    if (!engine || typeof engine[method] !== "function") return null;

    try {
      return engine[method]({ summary });
    } catch (error) {
      return {
        engine: "ari-medical-triage-engine",
        error: error?.message || String(error),
        urgency: "routine",
        confidence: "low"
      };
    }
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => window.Ari.medical.utils.hasTerm(text, term));
  }
};

window.AriMedicalTriageEngine = window.Ari.medical.triageEngine;

console.log(
  "ARI MEDICAL TRIAGE ENGINE LOADED:",
  window.Ari.medical.triageEngine.version
);