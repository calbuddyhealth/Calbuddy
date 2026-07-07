// ari/medical/executive/ari-clinical-executive-engine.js
// Purpose: Prioritize Ari Medical findings and decide what matters first.
// V1.0.0 — Clinical Executive Engine / Priority + Escalation

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.executive = window.Ari.medical.executive || {};

window.Ari.medical.executive.clinicalExecutiveEngine = {
  version: "1.0.0",

  evaluate(room = {}) {
    const signals = this.collectSignals(room);
    const dangerLevel = this.determineDangerLevel(signals);
    const highestConcern = this.highestConcern(signals);
    const priority = this.priorityFor(dangerLevel);
    const nextBestStep = this.nextBestStep(signals, dangerLevel);

    return {
      engine: "ari-clinical-executive-engine",
      version: this.version,

      dangerLevel,
      highestConcern,
      priority,
      nextBestStep,

      needsEscalation: ["critical", "high"].includes(dangerLevel),
      needsMoreInfo: this.needsMoreInfo(signals),

      signals,
      advisoryOnly: true
    };
  },

  writeToRoom(room = {}) {
    const result = this.evaluate(room);

    room.executiveSummary = {
      ...(room.executiveSummary || {}),
      dangerLevel: result.dangerLevel,
      priority: result.priority,
      highestConcern: result.highestConcern,
      nextBestStep: result.nextBestStep,
      needsEscalation: result.needsEscalation,
      needsMoreInfo: result.needsMoreInfo
    };

    const situationRoom = window.Ari.medical.executive?.situationRoom;

    if (situationRoom?.audit) {
      situationRoom.audit(room, {
        engine: "ari-clinical-executive-engine",
        action: "executive_summary_updated",
        section: "executiveSummary",
        rationale: [
          result.highestConcern,
          result.nextBestStep
        ].filter(Boolean)
      });
    }

    room.updatedAt = new Date().toISOString();

    return room;
  },

  collectSignals(room = {}) {
    const text = this.roomText(room);

    return {
      redFlagCount: Array.isArray(room.redFlags) ? room.redFlags.length : 0,
      riskCount: Array.isArray(room.risks) ? room.risks.length : 0,
      precautionCount: Array.isArray(room.precautions) ? room.precautions.length : 0,
      uncertaintyCount: Array.isArray(room.uncertainties) ? room.uncertainties.length : 0,
      questionCount: Array.isArray(room.questions) ? room.questions.length : 0,

      shock: this.hasAny(text, ["shock", "hypotension", "bp 82", "low blood pressure"]),
      sepsis: this.hasAny(text, ["sepsis", "septic", "lactate", "bacteremia"]),
      airway: this.hasAny(text, ["airway", "stridor", "drooling", "throat swelling"]),
      respiratoryDistress: this.hasAny(text, ["shortness of breath", "trouble breathing", "hypoxia", "blue lips"]),
      neurologicEmergency: this.hasAny(text, ["stroke", "facial droop", "slurred speech", "seizure", "confusion"]),
      anaphylaxis: this.hasAny(text, ["anaphylaxis", "swollen tongue", "throat swelling", "hives trouble breathing"]),

      airborneRisk: this.hasAny(text, ["PRECAUTION-AIRBORNE", "tuberculosis", "measles"]),
      dropletRisk: this.hasAny(text, ["PRECAUTION-DROPLET", "meningococcus", "influenza", "covid", "rsv"]),
      entericRisk: this.hasAny(text, ["PRECAUTION-CONTACT-ENTERIC", "c diff", "watery diarrhea"]),

      rapidResponseAction: this.hasAny(text, ["ACTION-CALL-RAPID-RESPONSE", "ACT-EMERG-RRT-0001"]),
      sepsisBundleAction: this.hasAny(text, ["ACTION-START-SEPSIS-BUNDLE", "ACT-EMERG-SEPSIS-0001"])
    };
  },

  determineDangerLevel(signals = {}) {
    if (
      signals.shock ||
      signals.airway ||
      signals.anaphylaxis ||
      signals.rapidResponseAction
    ) {
      return "critical";
    }

    if (
      signals.sepsis ||
      signals.sepsisBundleAction ||
      signals.respiratoryDistress ||
      signals.neurologicEmergency ||
      signals.airborneRisk
    ) {
      return "high";
    }

    if (
      signals.redFlagCount > 0 ||
      signals.dropletRisk ||
      signals.entericRisk ||
      signals.precautionCount > 1
    ) {
      return "moderate";
    }

    return "low";
  },

  highestConcern(signals = {}) {
    if (signals.airway) return "Airway risk";
    if (signals.anaphylaxis) return "Possible severe allergic reaction";
    if (signals.shock) return "Hemodynamic instability";
    if (signals.sepsis || signals.sepsisBundleAction) return "Possible sepsis";
    if (signals.respiratoryDistress) return "Respiratory distress";
    if (signals.neurologicEmergency) return "Possible neurologic emergency";
    if (signals.airborneRisk) return "Possible airborne infection risk";
    if (signals.dropletRisk) return "Possible droplet-transmitted infection risk";
    if (signals.entericRisk) return "Possible enteric/contact infection risk";
    if (signals.redFlagCount > 0) return "Medical red flags present";

    return "No high-priority danger signal detected";
  },

  priorityFor(dangerLevel = "low") {
    if (dangerLevel === "critical") return "immediate";
    if (dangerLevel === "high") return "urgent";
    if (dangerLevel === "moderate") return "same_day";
    return "routine";
  },

  nextBestStep(signals = {}, dangerLevel = "low") {
    if (dangerLevel === "critical") {
      return "Escalate immediately according to clinical setting and institutional policy.";
    }

    if (signals.sepsis || signals.sepsisBundleAction) {
      return "Prioritize sepsis evaluation, cultures, lactate, antibiotics, fluids, monitoring, and provider notification as appropriate.";
    }

    if (signals.airborneRisk) {
      return "Initiate airborne precautions and notify Infection Prevention according to local protocol.";
    }

    if (signals.dropletRisk) {
      return "Initiate droplet precautions while clarifying organism, symptoms, exposure, and risk factors.";
    }

    if (signals.entericRisk) {
      return "Initiate contact-enteric precautions and clarify diarrhea severity, testing, hydration, and exposure risk.";
    }

    if (signals.uncertaintyCount > 0 || signals.questionCount > 0) {
      return "Ask the highest-yield missing questions before narrowing the plan.";
    }

    return "Continue routine assessment, education, and safety guidance.";
  },

  needsMoreInfo(signals = {}) {
    return signals.uncertaintyCount > 0 || signals.questionCount > 0;
  },

  roomText(room = {}) {
    return JSON.stringify(room || {}).toLowerCase();
  },

  hasAny(text = "", terms = []) {
    const clean = this.normalize(text);
    return terms.some(term => clean.includes(this.normalize(term)));
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

window.AriClinicalExecutiveEngine =
  window.Ari.medical.executive.clinicalExecutiveEngine;

console.log(
  "ARI CLINICAL EXECUTIVE ENGINE LOADED:",
  window.Ari.medical.executive.clinicalExecutiveEngine.version
);