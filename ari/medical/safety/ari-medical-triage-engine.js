// ari/medical/safety/ari-medical-triage-engine.js
// Purpose: Convert medical findings/red flags into a safe urgency level and response posture.
// V1.0.0 — Urgency Router / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.triageEngine = {
  version: "1.0.0",

  run(input = {}) {
    const summary = input.summary || input || {};
    const redFlagPacket =
      summary.medicalRedFlags ||
      summary.redFlagPacket ||
      summary.redFlags ||
      {};

    const findings =
      redFlagPacket.findings ||
      redFlagPacket.redFlags ||
      [];

    const text = window.Ari.medical.utils.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const urgency = this.resolveUrgency({ text, findings, redFlagPacket });
    const posture = this.resolvePosture(urgency);

    return window.Ari.medical.contract.create({
      engine: "ari-medical-triage-engine",
      version: this.version,
      activated: urgency !== "routine",
      confidence: findings.length ? "high" : "medium",
      urgency,
      findings,
      supportingEvidence: findings,
      reasoning: this.reasoningFor(urgency),
      safetyMessage: posture.safetyMessage,
      nextStep: posture.nextStep,
      responsePosture: posture
    });
  },

  resolveUrgency({ text = "", findings = [], redFlagPacket = {} } = {}) {
    if (
      redFlagPacket.urgency === "emergency" ||
      findings.some(item =>
        [
          "cardiopulmonary_red_flag",
          "neurologic_red_flag",
          "pregnancy_red_flag",
          "pediatric_red_flag",
          "psychiatric_red_flag",
          "medication_reaction_red_flag"
        ].includes(item.type)
      )
    ) {
      return "emergency";
    }

    if (
      window.Ari.medical.utils.hasAny(text, [
        "worsening",
        "getting worse",
        "severe pain",
        "high fever",
        "cannot keep fluids down",
        "new weakness",
        "new swelling"
      ])
    ) {
      return "urgent";
    }

    if (
      window.Ari.medical.utils.hasAny(text, [
        "mild",
        "started yesterday",
        "comes and goes",
        "not severe",
        "stable"
      ])
    ) {
      return "soon";
    }

    return "routine";
  },

  resolvePosture(urgency = "routine") {
    const map = {
      emergency: {
        label: "emergency_care_now",
        safetyMessage:
          "This pattern could be serious. If this is happening now, worsening, or severe, seek emergency care now.",
        nextStep:
          "Do not wait for a chatbot answer. Call emergency services or go to the ER if symptoms are active or severe.",
        canAskFollowUp: false,
        explainBriefly: true
      },

      urgent: {
        label: "same_day_urgent_evaluation",
        safetyMessage:
          "This may need same-day medical evaluation, especially if symptoms are worsening.",
        nextStep:
          "Contact a clinician, urgent care, nurse line, or ER depending on severity.",
        canAskFollowUp: true,
        explainBriefly: true
      },

      soon: {
        label: "clinician_follow_up_soon",
        safetyMessage:
          "This does not sound like an obvious emergency from the limited information, but it still may need follow-up.",
        nextStep:
          "Arrange medical follow-up and watch for red flags.",
        canAskFollowUp: true,
        explainBriefly: true
      },

      routine: {
        label: "routine_guidance",
        safetyMessage: null,
        nextStep:
          "Give general education, suggest reasonable monitoring, and ask focused follow-up only if needed.",
        canAskFollowUp: true,
        explainBriefly: false
      }
    };

    return map[urgency] || map.routine;
  },

  reasoningFor(urgency = "routine") {
    if (urgency === "emergency") {
      return "One or more high-risk medical red flags were detected, so safety should lead the response.";
    }

    if (urgency === "urgent") {
      return "Symptoms suggest possible worsening or clinically important illness that may need same-day evaluation.";
    }

    if (urgency === "soon") {
      return "Symptoms appear less emergent from the available information but may still need timely follow-up.";
    }

    return "No urgent red-flag pattern was detected from the available information.";
  }
};

window.AriMedicalTriageEngine = window.Ari.medical.triageEngine;

console.log(
  "ARI MEDICAL TRIAGE ENGINE LOADED:",
  window.Ari.medical.triageEngine.version
);