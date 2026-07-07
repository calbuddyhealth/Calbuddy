// ari/medical/core/ari-medical-confidence-engine.js
// Purpose: Decide confidence, uncertainty, and information sufficiency after evidence + differential reasoning.
// V1.0.0 — Medical Confidence Engine / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.confidenceEngine = {
  version: "1.0.0",

  build(input = {}) {
    const summary = input.summary || input || {};

    const evidencePacket =
      summary.medicalEvidence ||
      summary.evidencePacket ||
      {};

    const differentialPacket =
      summary.medicalDifferential ||
      summary.differentialPacket ||
      {};

    const hypotheses =
      differentialPacket.hypotheses ||
      differentialPacket.possibleExplanations ||
      [];

    const primary = differentialPacket.primaryHypothesis || hypotheses[0] || null;

    const urgency =
      differentialPacket.urgency ||
      evidencePacket.urgency ||
      "routine";

    const uncertaintyFactors = this.findUncertaintyFactors({
      evidencePacket,
      differentialPacket,
      primary,
      hypotheses
    });

    const confidenceScore = this.scoreConfidence({
      evidencePacket,
      differentialPacket,
      primary,
      hypotheses,
      uncertaintyFactors,
      urgency
    });

    const confidence = this.labelConfidence(confidenceScore);
    const sufficiency = this.resolveSufficiency({
      confidence,
      urgency,
      uncertaintyFactors,
      primary
    });

    return window.Ari.medical.contract.create({
      engine: "ari-medical-confidence-engine",
      version: this.version,
      activated: Boolean(primary || evidencePacket.activated),
      confidence,
      urgency,

      confidenceScore,
      informationSufficiency: sufficiency,
      primaryHypothesis: primary,
      uncertaintyFactors,

      enoughInformationToExplain:
        sufficiency === "enough_for_general_guidance" ||
        sufficiency === "enough_for_urgent_guidance",

      needsMoreInformation:
        sufficiency === "needs_focused_questions" ||
        sufficiency === "insufficient_information",

      reasoning: this.buildReasoning({
        confidence,
        confidenceScore,
        sufficiency,
        uncertaintyFactors,
        urgency,
        primary
      }),

      nextStep: this.nextStepFor({
        confidence,
        sufficiency,
        urgency
      }),

      responsePosture: {
        label: "medical_confidence_control",
        advisoryOnly: true,
        avoidDiagnosis: true,
        stateUncertainty: confidence !== "high",
        askQuestionsOnlyIfNeeded: true,
        doNotOverstate: true
      },

      cannotSet: [
        "diagnosis",
        "finalDiagnosis",
        "prescription",
        "ignoreEmergencyCare",
        "replaceClinician"
      ]
    });
  },

  scoreConfidence({
    evidencePacket = {},
    differentialPacket = {},
    primary = null,
    hypotheses = [],
    uncertaintyFactors = [],
    urgency = "routine"
  } = {}) {
    let score = 0;

    const evidenceCount = evidencePacket.evidence?.length || 0;
    const redFlagCount = evidencePacket.redFlags?.length || 0;
    const missingCount = uncertaintyFactors.length;

    if (primary) score += 25;
    if (hypotheses.length >= 2) score += 10;
    if (evidenceCount >= 3) score += 20;
    if (evidenceCount >= 6) score += 10;
    if (redFlagCount > 0) score += 10;

    if (primary?.confidence === "high") score += 20;
    if (primary?.confidence === "medium") score += 10;

    if (primary?.supportingEvidence?.length >= 3) score += 15;
    if (primary?.contradictingEvidence?.length) score -= 15;

    score -= missingCount * 8;

    if (urgency === "emergency") {
      score = Math.max(score, 55);
    }

    return Math.max(0, Math.min(100, score));
  },

  labelConfidence(score = 0) {
    if (score >= 75) return "high";
    if (score >= 45) return "medium";
    return "low";
  },

  findUncertaintyFactors({
    evidencePacket = {},
    differentialPacket = {},
    primary = null,
    hypotheses = []
  } = {}) {
    const factors = [];

    this.addList(factors, evidencePacket.uncertainties, "evidence_uncertainty");
    this.addList(factors, evidencePacket.missingInformation, "missing_information");
    this.addList(factors, primary?.missingInformation, "primary_hypothesis_missing_information");

    if (!primary) {
      factors.push({
        type: "no_primary_hypothesis",
        claim: "No primary explanation pattern was strong enough.",
        confidence: "high"
      });
    }

    if (hypotheses.length > 3) {
      factors.push({
        type: "broad_differential",
        claim: "Several competing explanations remain possible.",
        confidence: "medium"
      });
    }

    if (!evidencePacket.evidence?.length) {
      factors.push({
        type: "limited_evidence",
        claim: "The message does not include enough medical detail.",
        confidence: "high"
      });
    }

    return this.dedupe(factors);
  },

  resolveSufficiency({
    confidence = "low",
    urgency = "routine",
    uncertaintyFactors = [],
    primary = null
  } = {}) {
    if (urgency === "emergency") {
      return "enough_for_urgent_guidance";
    }

    if (!primary) {
      return "insufficient_information";
    }

    if (confidence === "high" && uncertaintyFactors.length <= 3) {
      return "enough_for_general_guidance";
    }

    if (confidence === "medium") {
      return "needs_focused_questions";
    }

    return "insufficient_information";
  },

  buildReasoning({
    confidence = "low",
    confidenceScore = 0,
    sufficiency = "",
    uncertaintyFactors = [],
    urgency = "routine",
    primary = null
  } = {}) {
    const parts = [];

    if (primary?.label) {
      parts.push(`Primary supported pattern: ${primary.label}.`);
    } else {
      parts.push("No primary pattern is strong enough yet.");
    }

    parts.push(`Confidence is ${confidence} (${confidenceScore}/100).`);
    parts.push(`Information sufficiency: ${sufficiency}.`);

    if (uncertaintyFactors.length) {
      parts.push(`${uncertaintyFactors.length} uncertainty factor(s) remain.`);
    }

    parts.push(`Urgency: ${urgency}.`);

    return parts.join(" ");
  },

  nextStepFor({ confidence = "low", sufficiency = "", urgency = "routine" } = {}) {
    if (urgency === "emergency") {
      return "Do not wait for perfect confidence. Lead with emergency guidance.";
    }

    if (sufficiency === "needs_focused_questions") {
      return "Ask only the highest-yield missing questions before giving a stronger explanation.";
    }

    if (sufficiency === "insufficient_information") {
      return "Give brief safety guidance, then ask broad-to-specific clarification questions.";
    }

    return "Explain the likely pattern cautiously, include uncertainty, and provide return precautions.";
  },

  addList(target = [], list = [], type = "uncertainty") {
    if (!Array.isArray(list)) return;

    list.forEach(item => {
      target.push({
        type,
        claim:
          typeof item === "string"
            ? item
            : item.claim || item.label || item.value || "uncertainty",
        confidence:
          typeof item === "object"
            ? item.confidence || "medium"
            : "medium",
        raw: item
      });
    });
  },

  dedupe(list = []) {
    const seen = new Set();

    return list.filter(item => {
      const key = `${item.type || ""}:${item.claim || ""}`.toLowerCase();
      if (!item.claim || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

window.AriMedicalConfidenceEngine = window.Ari.medical.confidenceEngine;

console.log(
  "ARI MEDICAL CONFIDENCE ENGINE LOADED:",
  window.Ari.medical.confidenceEngine.version
);