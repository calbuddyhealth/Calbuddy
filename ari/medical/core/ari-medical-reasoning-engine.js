// ari/medical/core/ari-medical-reasoning-engine.js
// Purpose: Orchestrate medical evidence, differential, confidence, and question strategy into one reasoning packet.
// V1.0.0 — Medical Reasoning Orchestrator / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.reasoningEngine = {
  version: "1.0.0",

  run(input = {}) {
    const summary = input.summary || input || {};

    const evidence =
      summary.medicalEvidence ||
      this.safeBuild(window.Ari.medical.evidenceEngine, "build", summary);

    const differential =
      summary.medicalDifferential ||
      this.safeBuild(window.Ari.medical.differentialEngine, "build", {
        ...summary,
        medicalEvidence: evidence
      });

    const confidence =
      summary.medicalConfidence ||
      this.safeBuild(window.Ari.medical.confidenceEngine, "build", {
        ...summary,
        medicalEvidence: evidence,
        medicalDifferential: differential
      });

    const questions =
      summary.medicalQuestions ||
      this.safeBuild(window.Ari.medical.questionEngine, "build", {
        ...summary,
        medicalEvidence: evidence,
        medicalDifferential: differential,
        medicalConfidence: confidence
      });

    const urgency = this.resolveUrgency({
      evidence,
      differential,
      confidence,
      questions
    });

    const primaryHypothesis =
      differential?.primaryHypothesis ||
      differential?.hypotheses?.[0] ||
      null;

    return window.Ari.medical.contract.create({
      engine: "ari-medical-reasoning-engine",
      version: this.version,
      activated: Boolean(evidence?.activated || differential?.activated),

      urgency,
      confidence: confidence?.confidence || differential?.confidence || evidence?.confidence || "low",

      evidence,
      differential,
      confidencePacket: confidence,
      questions,

      primaryHypothesis,
      possibleExplanations: differential?.hypotheses || [],

      supportingEvidence:
        differential?.supportingEvidence ||
        evidence?.supportingEvidence ||
        [],

      contradictingEvidence:
        differential?.contradictingEvidence ||
        evidence?.contradictingEvidence ||
        [],

      uncertaintyFactors:
        confidence?.uncertaintyFactors ||
        evidence?.uncertainties ||
        [],

      recommendedQuestions:
        questions?.questions ||
        evidence?.recommendedQuestions ||
        [],

      informationSufficiency:
        confidence?.informationSufficiency ||
        "unknown",

      reasoning: this.buildReasoning({
        urgency,
        evidence,
        differential,
        confidence,
        questions,
        primaryHypothesis
      }),

      nextStep: this.nextStepFor({
        urgency,
        confidence,
        questions,
        primaryHypothesis
      }),

      responsePosture: {
        label: "medical_reasoning_orchestration",
        advisoryOnly: true,
        avoidDiagnosis: true,
        presentPossibilities: true,
        includeUncertainty: true,
        safetyFirst: urgency === "emergency" || urgency === "urgent",
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

  resolveUrgency({ evidence = {}, differential = {}, confidence = {}, questions = {} } = {}) {
    const urgencies = [
      evidence?.urgency,
      differential?.urgency,
      confidence?.urgency,
      questions?.urgency
    ].filter(Boolean);

    if (urgencies.includes("emergency")) return "emergency";
    if (urgencies.includes("urgent")) return "urgent";
    if (urgencies.includes("soon")) return "soon";
    return "routine";
  },

  buildReasoning({
    urgency = "routine",
    evidence = {},
    differential = {},
    confidence = {},
    questions = {},
    primaryHypothesis = null
  } = {}) {
    const parts = [];

    if (primaryHypothesis?.label) {
      parts.push(`Most supported explanation pattern: ${primaryHypothesis.label}.`);
    } else {
      parts.push("No single explanation pattern is strong enough yet.");
    }

    if (evidence?.evidence?.length) {
      parts.push(`${evidence.evidence.length} evidence item(s) were available.`);
    }

    if (differential?.hypotheses?.length) {
      parts.push(`${differential.hypotheses.length} possible explanation(s) were ranked.`);
    }

    if (confidence?.confidence) {
      parts.push(`Confidence is ${confidence.confidence}.`);
    }

    if (questions?.questions?.length) {
      parts.push(`${questions.questions.length} focused question(s) may reduce uncertainty.`);
    }

    parts.push(`Urgency is ${urgency}.`);
    parts.push("This is medical reasoning support, not a diagnosis.");

    return parts.join(" ");
  },

  nextStepFor({
    urgency = "routine",
    confidence = {},
    questions = {},
    primaryHypothesis = null
  } = {}) {
    if (urgency === "emergency") {
      return "Lead with emergency guidance first. Do not wait for complete information.";
    }

    if (questions?.questions?.length && confidence?.needsMoreInformation !== false) {
      return "Ask the focused follow-up questions before giving a stronger explanation.";
    }

    if (primaryHypothesis) {
      return "Explain the most supported pattern cautiously, include alternatives, uncertainty, and return precautions.";
    }

    return "Give brief safety guidance and ask broad-to-specific clarification questions.";
  },

  safeBuild(engine = null, method = "", summary = {}) {
    if (!engine || typeof engine[method] !== "function") {
      return null;
    }

    try {
      return engine[method]({ summary });
    } catch (error) {
      return window.Ari.medical.contract.create({
        engine: "ari-medical-reasoning-engine",
        version: this.version,
        activated: false,
        confidence: "low",
        urgency: "routine",
        error: error?.message || String(error),
        reasoning: "A medical sub-engine failed safely.",
        nextStep: "Continue with cautious general guidance."
      });
    }
  }
};

window.AriMedicalReasoningEngine = window.Ari.medical.reasoningEngine;

console.log(
  "ARI MEDICAL REASONING ENGINE LOADED:",
  window.Ari.medical.reasoningEngine.version
);