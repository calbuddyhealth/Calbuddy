// ari/medical/core/ari-medical-evidence-engine.js
// Purpose: Combine medical engine outputs into one clean evidence packet.
// V1.0.0 — Medical Evidence Aggregator / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.evidenceEngine = {
  version: "1.0.0",

  build(input = {}) {
    const summary = input.summary || input || {};

    const sources = this.collectSources(summary);
    const evidence = this.collectEvidence(sources);
    const redFlags = this.collectRedFlags(sources);
    const uncertainties = this.collectUncertainties(sources);
    const questions = this.collectQuestions(sources);

    const urgency = this.resolveUrgency(sources);
    const confidence = this.resolveConfidence(evidence, redFlags, uncertainties);

    return window.Ari.medical.contract.create({
      engine: "ari-medical-evidence-engine",
      version: this.version,
      activated: evidence.length > 0 || redFlags.length > 0,
      confidence,
      urgency,

      sources,
      evidence,
      supportingEvidence: evidence.filter(item => item.direction !== "against"),
      contradictingEvidence: evidence.filter(item => item.direction === "against"),
      redFlags,
      uncertainties,
      recommendedQuestions: questions,

      reasoning: this.buildReasoning({ evidence, redFlags, uncertainties, urgency }),
      nextStep: this.nextStepFor({ urgency, questions }),

      responsePosture: {
        label: "medical_evidence_aggregation",
        advisoryOnly: true,
        avoidDiagnosis: true,
        preserveUncertainty: true,
        evidenceFirst: true
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

  collectSources(summary = {}) {
    return {
      chiefComplaint:
        summary.medicalChiefComplaint ||
        summary.chiefComplaintPacket ||
        null,

      symptomPattern:
        summary.medicalSymptomPattern ||
        summary.symptomPatternPacket ||
        null,

      redFlags:
        summary.medicalRedFlags ||
        summary.redFlagPacket ||
        null,

      triage:
        summary.medicalTriage ||
        summary.triagePacket ||
        null,

      bodySystems:
        summary.medicalBodySystems ||
        summary.bodySystemsPacket ||
        null,

      questions:
        summary.medicalQuestions ||
        summary.questionPacket ||
        null,

      pharmacology:
        summary.medicalPharmacology ||
        summary.medicationSideEffects ||
        summary.medicationPacket ||
        null,

      labs:
        summary.medicalLabs ||
        summary.labPacket ||
        null,

      diagnostics:
        summary.medicalDiagnostics ||
        summary.diagnosticPacket ||
        null,

      specialty:
        summary.medicalSpecialty ||
        summary.specialtyPacket ||
        null
    };
  },

  collectEvidence(sources = {}) {
    const evidence = [];

    Object.entries(sources).forEach(([sourceName, packet]) => {
      if (!packet) return;

      this.pushFindings(evidence, sourceName, packet.findings);
      this.pushFindings(evidence, sourceName, packet.supportingEvidence);
      this.pushFindings(evidence, sourceName, packet.patterns);
      this.pushFindings(evidence, sourceName, packet.systems);

      if (packet.primaryPattern) {
        evidence.push(this.toEvidenceItem(packet.primaryPattern, sourceName, "supports"));
      }

      if (packet.primarySystem) {
        evidence.push(this.toEvidenceItem(packet.primarySystem, sourceName, "supports"));
      }
    });

    return this.uniqueEvidence(evidence);
  },

  collectRedFlags(sources = {}) {
    const items = [];

    const packets = [
      sources.redFlags,
      sources.triage,
      sources.symptomPattern,
      sources.bodySystems
    ].filter(Boolean);

    packets.forEach(packet => {
      this.pushFindings(items, packet.engine || "medical_engine", packet.emergencyRedFlags, "red_flag");
      this.pushFindings(items, packet.engine || "medical_engine", packet.urgentRedFlags, "red_flag");
      this.pushFindings(items, packet.engine || "medical_engine", packet.redFlags, "red_flag");
    });

    return this.uniqueEvidence(items);
  },

  collectUncertainties(sources = {}) {
    const uncertainties = [];

    Object.entries(sources).forEach(([sourceName, packet]) => {
      if (!packet) return;

      const values = []
        .concat(packet.uncertainties || [])
        .concat(packet.missingBasics || [])
        .concat(packet.missingInformation || []);

      values.forEach(value => {
        uncertainties.push({
          source: sourceName,
          claim:
            typeof value === "string"
              ? value
              : value.claim || value.label || value.value || "uncertainty",
          confidence: value.confidence || packet.confidence || "medium"
        });
      });
    });

    return this.uniqueEvidence(uncertainties);
  },

  collectQuestions(sources = {}) {
    const q = sources.questions;
    if (!q?.questions?.length) return [];

    return q.questions.slice(0, q.responsePosture?.maxQuestions || 3);
  },

  pushFindings(target = [], sourceName = "", findings = [], direction = "supports") {
    if (!Array.isArray(findings)) return;

    findings.forEach(item => {
      target.push(this.toEvidenceItem(item, sourceName, direction));
    });
  },

  toEvidenceItem(item = {}, sourceName = "", direction = "supports") {
    if (typeof item === "string") {
      return {
        claim: item,
        source: sourceName,
        direction,
        confidence: "medium"
      };
    }

    return {
      claim:
        item.label ||
        item.claim ||
        item.term ||
        item.type ||
        item.id ||
        item.system ||
        "medical evidence",
      source: item.source || sourceName,
      direction,
      confidence: item.confidence || "medium",
      urgency: item.urgency || null,
      evidence: item.evidence || item.requiredHits || item.supportingHits || [],
      raw: item
    };
  },

  resolveUrgency(sources = {}) {
    const urgencies = Object.values(sources)
      .filter(Boolean)
      .map(packet => packet.urgency)
      .filter(Boolean);

    if (urgencies.includes("emergency")) return "emergency";
    if (urgencies.includes("urgent")) return "urgent";
    if (urgencies.includes("soon")) return "soon";
    return "routine";
  },

  resolveConfidence(evidence = [], redFlags = [], uncertainties = []) {
    if (redFlags.length) return "high";
    if (evidence.length >= 5 && uncertainties.length <= 2) return "high";
    if (evidence.length >= 2) return "medium";
    return "low";
  },

  buildReasoning({ evidence = [], redFlags = [], uncertainties = [], urgency = "routine" } = {}) {
    const parts = [];

    if (redFlags.length) {
      parts.push(`${redFlags.length} red-flag item(s) were detected.`);
    }

    if (evidence.length) {
      parts.push(`${evidence.length} evidence item(s) were aggregated from medical engines.`);
    }

    if (uncertainties.length) {
      parts.push(`${uncertainties.length} uncertainty item(s) remain.`);
    }

    parts.push(`Resolved urgency: ${urgency}.`);

    return parts.join(" ");
  },

  nextStepFor({ urgency = "routine", questions = [] } = {}) {
    if (urgency === "emergency") {
      return "Lead with emergency guidance before any detailed explanation.";
    }

    if (questions.length) {
      return "Ask only the highest-yield follow-up questions, then update the reasoning.";
    }

    return "Proceed with evidence-based education, uncertainty, and return precautions.";
  },

  uniqueEvidence(list = []) {
    const seen = new Set();

    return list.filter(item => {
      const key = `${item.source || ""}:${item.claim || ""}:${item.direction || ""}`.toLowerCase();
      if (!item.claim || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

window.AriMedicalEvidenceEngine = window.Ari.medical.evidenceEngine;

console.log(
  "ARI MEDICAL EVIDENCE ENGINE LOADED:",
  window.Ari.medical.evidenceEngine.version
);