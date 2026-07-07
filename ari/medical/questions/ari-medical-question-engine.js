// ari/medical/questions/ari-medical-question-engine.js
// Purpose: Ask broad-to-specific medical follow-up questions only when needed.
// V1.0.0 — Focused Medical Question Selector / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.questionEngine = {
  version: "1.0.0",

  build(input = {}) {
    const summary = input.summary || input || {};
    const patternPacket =
      summary.medicalSymptomPattern ||
      summary.symptomPatternPacket ||
      summary.medicalPattern ||
      {};

    const triagePacket =
      summary.medicalTriage ||
      summary.triagePacket ||
      {};

    const primary =
      patternPacket.primaryPattern ||
      patternPacket.primary ||
      null;

    const text = window.Ari.medical.utils.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const missing = this.detectMissingBasics(text);
    const questions = this.selectQuestions({
      primary,
      missing,
      urgency: triagePacket.urgency || primary?.urgency || "routine"
    });

    return window.Ari.medical.contract.create({
      engine: "ari-medical-question-engine",
      version: this.version,
      activated: questions.length > 0,
      confidence: primary ? "medium" : "low",
      urgency: triagePacket.urgency || primary?.urgency || "routine",
      primaryPattern: primary,
      questions,
      missingBasics: missing,
      reasoning:
        questions.length > 0
          ? "Ari should ask only the highest-yield questions needed to clarify risk and direction."
          : "Enough basic context exists to give general guidance without asking more first.",
      nextStep:
        questions.length > 0
          ? "Ask the selected questions together, then proceed based on the answers."
          : "Proceed with cautious education and red-flag guidance.",
      responsePosture: {
        label: "focused_follow_up_questions",
        maxQuestions: questions.length,
        broadThenSpecific: true,
        avoidQuestionSpam: true,
        advisoryOnly: true
      }
    });
  },

  detectMissingBasics(text = "") {
    const missing = [];

    if (!/\b(today|yesterday|days?|weeks?|months?|hours?|started|since|for)\b/i.test(text)) {
      missing.push("duration");
    }

    if (!/\b(mild|moderate|severe|worst|better|worse|worsening|improving|stable)\b/i.test(text)) {
      missing.push("severity");
    }

    if (!/\b(age|baby|infant|child|adult|pregnant|weeks pregnant|years old|yo)\b/i.test(text)) {
      missing.push("age_or_special_population");
    }

    return missing;
  },

  selectQuestions({ primary = null, missing = [], urgency = "routine" } = {}) {
    const questions = [];

    if (urgency === "emergency") {
      questions.push(
        "Are these symptoms happening right now or getting worse?",
        "Is there chest pain, trouble breathing, fainting, confusion, blue lips, severe weakness, or new one-sided symptoms?"
      );

      return questions.slice(0, 2);
    }

    if (missing.includes("duration")) {
      questions.push("When did this start, and is it getting better, worse, or staying the same?");
    }

    if (missing.includes("severity")) {
      questions.push("How severe is it: mild, moderate, or severe?");
    }

    if (primary?.system === "cardiovascular_respiratory") {
      questions.push(
        "Any chest pain, shortness of breath at rest, fainting, blue lips, coughing blood, or swelling in one or both legs?"
      );
    }

    if (primary?.system === "neurology") {
      questions.push(
        "Any new weakness, facial droop, slurred speech, confusion, seizure, worst headache, or vision loss?"
      );
    }

    if (primary?.system === "gastrointestinal") {
      questions.push(
        "Where is the pain, and is there fever, vomiting, black stool, blood in stool, or dehydration?"
      );
    }

    if (primary?.system === "urology_genitourinary") {
      questions.push(
        "Any fever, flank pain, blood in urine, inability to urinate, pelvic pain, discharge, or testicular pain?"
      );
    }

    if (primary?.system === "infectious_disease") {
      questions.push(
        "What is the temperature, how long has the fever been present, and is there stiff neck, rash, confusion, or trouble breathing?"
      );
    }

    if (primary?.system === "psychiatry") {
      questions.push(
        "Any thoughts of harming yourself or someone else, hallucinations, paranoia, no sleep with high energy, substance use, or recent medication changes?"
      );
    }

    if (primary?.system === "obstetrics") {
      questions.push(
        "How many weeks pregnant, and is there bleeding, fluid leakage, severe headache, vision changes, right upper belly pain, fever, or decreased fetal movement?"
      );
    }

    if (primary?.system === "pediatrics") {
      questions.push(
        "How old is the child, and are they feeding normally, making wet diapers/peeing, breathing comfortably, alert, and without a high fever?"
      );
    }

    if (primary?.system === "pharmacology") {
      questions.push(
        "What medication, dose, when it started or changed, and did symptoms begin after taking it?"
      );
    }

    return this.dedupe(questions).slice(0, this.maxQuestionsFor(urgency));
  },

  maxQuestionsFor(urgency = "routine") {
    if (urgency === "urgent") return 3;
    if (urgency === "soon") return 3;
    return 2;
  },

  dedupe(list = []) {
    const seen = new Set();

    return list.filter(item => {
      const key = String(item || "").toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

window.AriMedicalQuestionEngine = window.Ari.medical.questionEngine;

console.log(
  "ARI MEDICAL QUESTION ENGINE LOADED:",
  window.Ari.medical.questionEngine.version
);