// ari/medical/core/ari-medical-response-planner.js
// Purpose: Convert medical reasoning into a safe, user-facing response plan.
// V1.0.0 — Medical Response Planner / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.responsePlanner = {
  version: "1.0.0",

  plan(input = {}) {
    const summary = input.summary || input || {};

    const reasoning =
      summary.medicalReasoning ||
      summary.reasoningPacket ||
      null;

    const urgency = reasoning?.urgency || "routine";
    const confidence = reasoning?.confidence || "low";
    const questions = reasoning?.recommendedQuestions || [];
    const primary = reasoning?.primaryHypothesis || null;

    return window.Ari.medical.contract.create({
      engine: "ari-medical-response-planner",
      version: this.version,
      activated: Boolean(reasoning),

      urgency,
      confidence,

      responsePlan: this.buildPlan({
        urgency,
        confidence,
        questions,
        primary,
        reasoning
      }),

      opening: this.openingFor({ urgency, primary }),
      mainMessage: this.mainMessageFor({ urgency, primary, confidence }),
      questions: this.questionsFor({ urgency, questions }),
      safetyMessage: this.safetyFor({ urgency }),
      uncertaintyMessage: this.uncertaintyFor({ confidence, primary }),
      nextStep: this.nextStepFor({ urgency, questions, primary }),

      reasoning:
        "Medical response plan created from reasoning packet. Advisory only; not a diagnosis.",

      responsePosture: {
        label: "medical_response_planning",
        advisoryOnly: true,
        avoidDiagnosis: true,
        safetyFirst: urgency === "emergency" || urgency === "urgent",
        includeUncertainty: true,
        askQuestionsOnlyIfNeeded: true,
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

  buildPlan({ urgency = "routine", confidence = "low", questions = [], primary = null, reasoning = null } = {}) {
    if (urgency === "emergency") {
      return [
        "Lead with emergency guidance.",
        "Briefly name the dangerous pattern without diagnosing.",
        "Ask no more than 1–2 immediate safety questions only if helpful.",
        "Do not bury the urgent instruction under explanation."
      ];
    }

    if (urgency === "urgent") {
      return [
        "State that same-day medical guidance or urgent care may be appropriate.",
        "Explain the most concerning pattern cautiously.",
        "Ask up to 3 focused questions if they would change the next step.",
        "Give clear worsening/ER precautions."
      ];
    }

    if (questions.length && confidence !== "high") {
      return [
        "Give a brief preliminary explanation.",
        "Ask the highest-yield follow-up questions.",
        "Avoid pretending certainty.",
        "Include basic red-flag precautions."
      ];
    }

    return [
      "Answer directly with cautious medical education.",
      "Explain the most supported pattern and alternatives.",
      "Mention uncertainty.",
      "Give practical next steps and return precautions."
    ];
  },

  openingFor({ urgency = "routine", primary = null } = {}) {
    if (urgency === "emergency") {
      return "This could be urgent enough that I would not wait on this.";
    }

    if (urgency === "urgent") {
      return "This deserves same-day medical attention or at least same-day clinician guidance.";
    }

    if (primary?.label) {
      return `The pattern that stands out most is ${primary.label.toLowerCase()}, but that is not a diagnosis.`;
    }

    return "I can help you think through this, but I need to keep it cautious because symptoms can overlap.";
  },

  mainMessageFor({ urgency = "routine", primary = null, confidence = "low" } = {}) {
    if (!primary) {
      return "There is not enough information yet to identify a strong pattern.";
    }

    const fit = primary.whyItFits || "Some details support this pattern.";
    const against = primary.whyItMayNotFit || "Other explanations may still fit.";

    return [
      fit,
      confidence !== "high" ? against : "",
      "This should be framed as a possible explanation, not a final diagnosis."
    ].filter(Boolean).join(" ");
  },

  questionsFor({ urgency = "routine", questions = [] } = {}) {
    if (!questions.length) return [];

    const max =
      urgency === "emergency" ? 2 :
      urgency === "urgent" ? 3 :
      2;

    return questions.slice(0, max);
  },

  safetyFor({ urgency = "routine" } = {}) {
    if (urgency === "emergency") {
      return "If these symptoms are happening now, worsening, severe, or involve chest pain, trouble breathing, fainting, confusion, blue lips, stroke-like symptoms, severe allergic reaction, overdose, or danger to self/others, seek emergency care now.";
    }

    if (urgency === "urgent") {
      return "If symptoms worsen, become severe, or include chest pain, trouble breathing, fainting, confusion, severe weakness, blue lips, severe pain, bleeding, or rapid decline, go to emergency care.";
    }

    return "If symptoms become severe, rapidly worsen, or include trouble breathing, chest pain, fainting, confusion, severe weakness, uncontrolled bleeding, or danger to self/others, seek urgent or emergency care.";
  },

  uncertaintyFor({ confidence = "low", primary = null } = {}) {
    if (!primary) {
      return "I do not have enough detail to narrow this safely yet.";
    }

    if (confidence === "high") {
      return "The pattern is fairly strong from the details given, but medical confirmation still depends on exam, vitals, history, and sometimes testing.";
    }

    if (confidence === "medium") {
      return "There is a reasonable pattern here, but a few key details could change the direction.";
    }

    return "The information is still limited, so the safest move is to clarify the basics before leaning too hard in one direction.";
  },

  nextStepFor({ urgency = "routine", questions = [], primary = null } = {}) {
    if (urgency === "emergency") {
      return "Emergency guidance first.";
    }

    if (questions.length) {
      return "Ask focused questions next.";
    }

    if (primary?.nextStep) {
      return primary.nextStep;
    }

    return "Give cautious education and clear return precautions.";
  }
};

window.AriMedicalResponsePlanner = window.Ari.medical.responsePlanner;

console.log(
  "ARI MEDICAL RESPONSE PLANNER LOADED:",
  window.Ari.medical.responsePlanner.version
);