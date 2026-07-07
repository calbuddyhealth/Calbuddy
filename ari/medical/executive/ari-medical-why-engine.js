// ari/medical/executive/ari-medical-why-engine.js
// Purpose: Explain why Ari Medical reached a recommendation.
// V1.0.0 — Why Engine / Explainable Clinical Reasoning

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.executive = window.Ari.medical.executive || {};

window.Ari.medical.executive.whyEngine = {
  version: "1.0.0",

  explain(room = {}, recommendation = {}) {
    const target =
      recommendation.value ||
      recommendation.actionId ||
      recommendation.umkoId ||
      recommendation.precautionId ||
      recommendation.monitorId ||
      recommendation.recommendation ||
      "";

    const audit = this.collectAudit(room, target);
    const evidence = this.collectEvidence(room, target);
    const missingInfo = this.collectMissingInfo(room);

    return {
      engine: "ari-medical-why-engine",
      version: this.version,

      recommendation: target || "general_clinical_recommendation",

      confidence: this.confidenceFor({
        audit,
        evidence,
        missingInfo,
        recommendation
      }),

      supportingEvidence: evidence,
      rationale: this.buildRationale({
        room,
        recommendation,
        audit,
        evidence
      }),

      missingInfo,

      executiveContext: {
        dangerLevel: room.executiveSummary?.dangerLevel || "unknown",
        highestConcern: room.executiveSummary?.highestConcern || "",
        nextBestStep: room.executiveSummary?.nextBestStep || ""
      },

      auditTraceCount: audit.length,
      advisoryOnly: true
    };
  },

  collectAudit(room = {}, target = "") {
    const trail = Array.isArray(room.auditTrail) ? room.auditTrail : [];
    const cleanTarget = this.normalize(target);

    if (!cleanTarget) return trail.slice(-10);

    return trail.filter(item => {
      const text = this.normalize(JSON.stringify(item || {}));
      return text.includes(cleanTarget);
    });
  },

  collectEvidence(room = {}, target = "") {
    const sections = [
      "evidence",
      "redFlags",
      "risks",
      "suspectedDiseases",
      "suspectedOrganisms",
      "precautions",
      "monitoring",
      "consults",
      "nursingActions",
      "providerActions"
    ];

    const cleanTarget = this.normalize(target);
    const evidence = [];

    sections.forEach(section => {
      const list = Array.isArray(room[section]) ? room[section] : [];

      list.forEach(item => {
        const text = this.normalize(JSON.stringify(item || {}));

        if (!cleanTarget || text.includes(cleanTarget)) {
          evidence.push({
            section,
            value: item?.value ?? item,
            confidence: item?.confidence || "unknown",
            priority: item?.priority || "routine",
            rationale: item?.rationale || []
          });
        }
      });
    });

    return evidence.slice(0, 20);
  },

  collectMissingInfo(room = {}) {
    const questions = Array.isArray(room.questions) ? room.questions : [];
    const uncertainties = Array.isArray(room.uncertainties) ? room.uncertainties : [];

    return [
      ...questions.map(item => item?.value || item),
      ...uncertainties.map(item => item?.value || item)
    ].filter(Boolean);
  },

  buildRationale({ room = {}, recommendation = {}, audit = [], evidence = [] } = {}) {
    const rationale = [];

    if (recommendation?.rationale?.length) {
      rationale.push(...recommendation.rationale);
    }

    if (room.executiveSummary?.highestConcern) {
      rationale.push(`Executive concern: ${room.executiveSummary.highestConcern}`);
    }

    if (room.executiveSummary?.nextBestStep) {
      rationale.push(`Executive next step: ${room.executiveSummary.nextBestStep}`);
    }

    audit.forEach(item => {
      if (Array.isArray(item.rationale)) {
        rationale.push(...item.rationale);
      }
    });

    evidence.forEach(item => {
      if (Array.isArray(item.rationale)) {
        rationale.push(...item.rationale);
      }
    });

    return this.dedupe(rationale).slice(0, 12);
  },

  confidenceFor({ audit = [], evidence = [], missingInfo = [], recommendation = {} } = {}) {
    if (recommendation.confidence) return recommendation.confidence;

    if (evidence.length >= 3 && audit.length >= 1 && missingInfo.length === 0) {
      return "high";
    }

    if (evidence.length >= 1 || audit.length >= 1) {
      return "medium";
    }

    return "low";
  },

  dedupe(list = []) {
    const seen = new Set();

    return list.filter(item => {
      const key = this.normalize(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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
  }
};

window.AriMedicalWhyEngine =
  window.Ari.medical.executive.whyEngine;

console.log(
  "ARI MEDICAL WHY ENGINE LOADED:",
  window.Ari.medical.executive.whyEngine.version
);