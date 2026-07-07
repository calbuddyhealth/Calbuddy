// ari/medical/executive/ari-clinical-executive-engine.js
// Purpose: Central coordinator for Ari Clinical Intelligence.
// V1.0.0 — Executive Router / Safety First / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.clinicalExecutive = {
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

    const activated = this.shouldActivate(text);

    if (!activated) {
      return window.Ari.medical.contract.create({
        engine: "ari-clinical-executive-engine",
        version: this.version,
        activated: false,
        confidence: "low",
        reasoning: "No medical or body-health concern detected."
      });
    }

    const population = this.detectPopulation(text);
    const redFlags = this.detectRedFlags(text);
    const urgency = redFlags.length ? "emergency" : "routine";

    return window.Ari.medical.contract.create({
      engine: "ari-clinical-executive-engine",
      version: this.version,
      activated: true,
      confidence: "medium",
      urgency,
      population,
      redFlags,
      findings: [],
      supportingEvidence: redFlags,
      missingEvidence: this.getBroadQuestions(text),
      reasoning:
        "Medical concern detected. Executive engine activated and screened for immediate red flags.",
      safetyMessage:
        urgency === "emergency"
          ? "This combination may be urgent. The safest next step is emergency evaluation now."
          : null
    });
  },

  shouldActivate(text = "") {
    return window.Ari.medical.utils.hasAny(text, [
      "pain",
      "fever",
      "shortness of breath",
      "sob",
      "chest pain",
      "dizzy",
      "swelling",
      "edema",
      "rash",
      "bleeding",
      "vomiting",
      "diarrhea",
      "headache",
      "pregnant",
      "baby",
      "infant",
      "child",
      "medication",
      "side effect",
      "lab result",
      "blood pressure",
      "heart rate",
      "oxygen",
      "infection",
      "anxiety",
      "depression",
      "psychosis",
      "suicidal"
    ]);
  },

  detectPopulation(text = "") {
    if (window.Ari.medical.utils.hasAny(text, ["newborn", "neonate"])) return "neonatal";
    if (window.Ari.medical.utils.hasAny(text, ["baby", "infant", "toddler", "child", "kid"])) return "pediatric";
    if (window.Ari.medical.utils.hasAny(text, ["pregnant", "pregnancy"])) return "pregnant";
    if (window.Ari.medical.utils.hasAny(text, ["postpartum", "gave birth"])) return "postpartum";
    if (window.Ari.medical.utils.hasAny(text, ["elderly", "geriatric", "older adult"])) return "geriatric";
    return "adult";
  },

  detectRedFlags(text = "") {
    const evidence = [];

    const add = claim =>
      evidence.push(
        window.Ari.medical.utils.evidence(
          "red_flag",
          claim,
          0.9,
          "ari-clinical-executive-engine"
        )
      );

    if (window.Ari.medical.utils.hasAny(text, ["chest pain"])) {
      add("Chest pain reported.");
    }

    if (window.Ari.medical.utils.hasAny(text, ["shortness of breath", "sob", "difficulty breathing"])) {
      add("Shortness of breath or breathing difficulty reported.");
    }

    if (window.Ari.medical.utils.hasAny(text, ["blue lips", "cyanosis"])) {
      add("Possible cyanosis reported.");
    }

    if (window.Ari.medical.utils.hasAny(text, ["fainting", "passed out", "syncope"])) {
      add("Syncope or fainting reported.");
    }

    if (window.Ari.medical.utils.hasAny(text, ["suicidal", "kill myself", "self harm"])) {
      add("Possible self-harm risk reported.");
    }

    if (window.Ari.medical.utils.hasAny(text, ["one sided weakness", "facial droop", "slurred speech"])) {
      add("Possible stroke symptoms reported.");
    }

    return evidence;
  },

  getBroadQuestions(text = "") {
    if (!this.shouldActivate(text)) return [];

    return [
      "When did this start?",
      "How severe is it?",
      "Is it getting better, worse, or staying the same?",
      "Any chest pain, trouble breathing, fainting, confusion, or severe weakness?",
      "Any major medical history, pregnancy, recent surgery, or new medications?"
    ];
  }
};

window.AriClinicalExecutiveEngine = window.Ari.medical.clinicalExecutive;

console.log(
  "ARI CLINICAL EXECUTIVE ENGINE LOADED:",
  window.Ari.medical.clinicalExecutive.version
);