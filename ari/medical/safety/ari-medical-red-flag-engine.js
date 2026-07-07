// ari/medical/safety/ari-medical-red-flag-engine.js
// Purpose: Detect high-risk medical red flags from symptoms, vitals, pregnancy, pediatrics, psych, meds, and procedures.
// V1.0.0 — Safety First / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.redFlagEngine = {
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

    const redFlags = [
      ...this.cardioPulmonary(text),
      ...this.neuro(text),
      ...this.infectionSepsis(text),
      ...this.giBleeding(text),
      ...this.pregnancy(text),
      ...this.pediatric(text),
      ...this.psychiatric(text),
      ...this.medicationReaction(text),
      ...this.postProcedure(text)
    ];

    const urgency = redFlags.length ? "emergency" : "none";

    return window.Ari.medical.contract.create({
      engine: "ari-medical-red-flag-engine",
      version: this.version,
      activated: redFlags.length > 0,
      confidence: redFlags.length ? "high" : "low",
      urgency,
      redFlags,
      findings: redFlags,
      supportingEvidence: redFlags,
      reasoning: redFlags.length
        ? "One or more red-flag patterns were detected."
        : "No obvious red-flag pattern detected from the available text.",
      safetyMessage: redFlags.length
        ? "This may need urgent medical evaluation. If symptoms are severe, worsening, or happening now, seek emergency care."
        : null
    });
  },

  flag(type, claim, confidence = 0.9) {
    return window.Ari.medical.utils.evidence(
      type,
      claim,
      confidence,
      "ari-medical-red-flag-engine"
    );
  },

  cardioPulmonary(text = "") {
    const flags = [];

    if (window.Ari.medical.utils.hasAny(text, ["chest pain", "pressure in chest"])) {
      flags.push(this.flag("cardiopulmonary_red_flag", "Chest pain or chest pressure reported."));
    }

    if (window.Ari.medical.utils.hasAny(text, ["shortness of breath", "difficulty breathing", "sob"])) {
      flags.push(this.flag("cardiopulmonary_red_flag", "Shortness of breath or difficulty breathing reported."));
    }

    if (
      window.Ari.medical.utils.hasAny(text, ["leg swelling", "leg edema", "swollen legs"]) &&
      window.Ari.medical.utils.hasAny(text, ["jvd", "jugular", "neck vein"])
    ) {
      flags.push(this.flag("cardiopulmonary_red_flag", "Leg edema with jugular vein distention pattern reported."));
    }

    if (window.Ari.medical.utils.hasAny(text, ["blue lips", "cyanosis", "turning blue"])) {
      flags.push(this.flag("cardiopulmonary_red_flag", "Possible cyanosis reported."));
    }

    return flags;
  },

  neuro(text = "") {
    const flags = [];

    if (window.Ari.medical.utils.hasAny(text, ["facial droop", "slurred speech", "one sided weakness", "worst headache"])) {
      flags.push(this.flag("neurologic_red_flag", "Possible serious neurologic red flag reported."));
    }

    if (window.Ari.medical.utils.hasAny(text, ["seizure", "new seizure"])) {
      flags.push(this.flag("neurologic_red_flag", "Seizure reported."));
    }

    if (window.Ari.medical.utils.hasAny(text, ["confusion", "altered mental status", "hard to wake"])) {
      flags.push(this.flag("neurologic_red_flag", "Confusion or altered mental status reported."));
    }

    return flags;
  },

  infectionSepsis(text = "") {
    const flags = [];

    if (
      window.Ari.medical.utils.hasAny(text, ["fever", "chills"]) &&
      window.Ari.medical.utils.hasAny(text, ["confusion", "very weak", "low blood pressure", "fast heart rate"])
    ) {
      flags.push(this.flag("infection_red_flag", "Possible severe infection or sepsis pattern reported."));
    }

    if (window.Ari.medical.utils.hasAny(text, ["stiff neck", "purple rash", "non blanching rash"])) {
      flags.push(this.flag("infection_red_flag", "Possible serious infection warning sign reported."));
    }

    return flags;
  },

  giBleeding(text = "") {
    const flags = [];

    if (window.Ari.medical.utils.hasAny(text, ["vomiting blood", "throwing up blood", "black stool", "tarry stool"])) {
      flags.push(this.flag("gi_red_flag", "Possible gastrointestinal bleeding reported."));
    }

    if (window.Ari.medical.utils.hasAny(text, ["severe abdominal pain", "rigid abdomen"])) {
      flags.push(this.flag("gi_red_flag", "Severe abdominal pain red flag reported."));
    }

    return flags;
  },

  pregnancy(text = "") {
    const flags = [];
    const pregnant = window.Ari.medical.utils.hasAny(text, ["pregnant", "pregnancy"]);

    if (!pregnant) return flags;

    if (window.Ari.medical.utils.hasAny(text, ["bleeding", "severe headache", "vision changes", "right upper quadrant pain", "seizure"])) {
      flags.push(this.flag("pregnancy_red_flag", "Pregnancy red-flag symptom reported."));
    }

    if (window.Ari.medical.utils.hasAny(text, ["decreased fetal movement", "no fetal movement"])) {
      flags.push(this.flag("pregnancy_red_flag", "Decreased or absent fetal movement reported."));
    }

    return flags;
  },

  pediatric(text = "") {
    const flags = [];
    const child = window.Ari.medical.utils.hasAny(text, ["baby", "infant", "newborn", "child", "toddler"]);

    if (!child) return flags;

    if (window.Ari.medical.utils.hasAny(text, ["not feeding", "dehydrated", "blue lips", "hard to wake", "lethargic"])) {
      flags.push(this.flag("pediatric_red_flag", "Pediatric danger sign reported."));
    }

    if (window.Ari.medical.utils.hasAny(text, ["fever"]) && window.Ari.medical.utils.hasAny(text, ["newborn", "under 3 months"])) {
      flags.push(this.flag("pediatric_red_flag", "Fever in a young infant/newborn reported."));
    }

    return flags;
  },

  psychiatric(text = "") {
    const flags = [];

    if (window.Ari.medical.utils.hasAny(text, ["suicidal", "kill myself", "self harm", "hurt myself"])) {
      flags.push(this.flag("psychiatric_red_flag", "Possible self-harm risk reported."));
    }

    if (window.Ari.medical.utils.hasAny(text, ["homicidal", "hurt someone", "kill someone"])) {
      flags.push(this.flag("psychiatric_red_flag", "Possible risk of harm to others reported."));
    }

    if (window.Ari.medical.utils.hasAny(text, ["hearing voices", "command hallucinations", "paranoid"])) {
      flags.push(this.flag("psychiatric_red_flag", "Possible psychosis or command hallucination concern reported."));
    }

    return flags;
  },

  medicationReaction(text = "") {
    const flags = [];

    if (window.Ari.medical.utils.hasAny(text, ["trouble breathing", "throat swelling", "tongue swelling", "anaphylaxis"])) {
      flags.push(this.flag("medication_reaction_red_flag", "Possible severe allergic reaction reported."));
    }

    if (window.Ari.medical.utils.hasAny(text, ["rash", "blistering", "peeling skin", "stevens johnson"])) {
      flags.push(this.flag("medication_reaction_red_flag", "Possible serious medication rash pattern reported."));
    }

    return flags;
  },

  postProcedure(text = "") {
    const flags = [];

    if (
      window.Ari.medical.utils.hasAny(text, ["after surgery", "post op", "procedure"]) &&
      window.Ari.medical.utils.hasAny(text, ["fever", "pus", "severe pain", "shortness of breath", "chest pain"])
    ) {
      flags.push(this.flag("post_procedure_red_flag", "Possible post-procedure complication warning sign reported."));
    }

    return flags;
  }
};

window.AriMedicalRedFlagEngine = window.Ari.medical.redFlagEngine;

console.log(
  "ARI MEDICAL RED FLAG ENGINE LOADED:",
  window.Ari.medical.redFlagEngine.version
);