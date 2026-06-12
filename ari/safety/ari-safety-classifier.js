// ari/safety/ari-safety-classifier.js
// Ari Safety Classifier
// Purpose: Detect urgent safety/medical risk before wisdom, meaning, or emotion systems respond.
// V1.0

window.Ari = window.Ari || {};

window.Ari.safetyClassifier = {
  version: "1.0.0",

  classify(message = "") {
    const text = String(message || "").toLowerCase().trim();

    const result = {
      safetyTriggered: false,
      safetyType: "none",
      urgency: "none",
      reason: null,
      response: null,
      source: "ari-safety-classifier"
    };

    if (!text) return result;

    const has = (phrases) => phrases.some((p) => text.includes(p));

    const pregnancySignal = has([
      "pregnant",
      "pregnancy",
      "fiancé",
      "fiance",
      "wife",
      "baby"
    ]);

    const severePainSignal = has([
      "severe pain",
      "bad pain",
      "intense pain",
      "sharp pain",
      "constant pain",
      "worst pain",
      "extreme pain"
    ]);

    const emergencySignal = has([
      "bleeding",
      "can't breathe",
      "cannot breathe",
      "passed out",
      "fainted",
      "chest pain",
      "seizure",
      "suicidal",
      "kill myself",
      "hurt myself",
      "emergency"
    ]);

    if (pregnancySignal && severePainSignal) {
      return {
        safetyTriggered: true,
        safetyType: "pregnancy_medical_urgent",
        urgency: "urgent",
        reason: "Pregnancy plus severe pain requires urgent medical evaluation.",
        response:
          "Severe pain during pregnancy needs medical attention now.\n\nCall her OB/Labor & Delivery triage immediately, or go to the ER. If the pain is severe, sudden, one-sided, associated with bleeding, dizziness, fever, vomiting, contractions, fluid leakage, decreased fetal movement, or she looks very unwell, call emergency services.\n\nDo not wait on Ari to interpret this emotionally. Protecting family here means getting medical care now.",
        source: "ari-safety-classifier"
      };
    }

    if (emergencySignal) {
      return {
        safetyTriggered: true,
        safetyType: "general_emergency",
        urgency: "urgent",
        reason: "Emergency or high-risk safety language detected.",
        response:
          "This may need urgent help now.\n\nIf there is immediate danger, severe symptoms, trouble breathing, chest pain, fainting, seizure, heavy bleeding, or risk of self-harm, call emergency services or go to the ER now.\n\nAri should not treat this as a reflection question.",
        source: "ari-safety-classifier"
      };
    }

    return result;
  }
};