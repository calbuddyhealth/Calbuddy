// ari/medical/communication/ari-medical-communication-engine.js
// Purpose: Final communication layer for Ari Medical OS.
// V1.0.0 — Medical Communication Engine / Explain Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.communication =
  window.Ari.medical.communication || {};

window.Ari.medical.communication.engine = {
  version: "1.0.0",

  compose(input = {}) {
    const room = input.room || input.situationRoom || {};
    const operations = input.operations || {};
    const why = input.why || {};
    const monitoring = input.monitoring || {};

    const executive = room.executiveSummary || {};

    return {
      engine: "ari-medical-communication-engine",
      version: this.version,

      response: this.buildResponse({
        executive,
        operations,
        why,
        monitoring,
        room
      }),

      advisoryOnly: true
    };
  },

  buildResponse({ executive = {}, operations = {}, why = {}, monitoring = {}, room = {} } = {}) {
    const parts = [];

    if (executive.highestConcern) {
      parts.push(`Main concern: ${executive.highestConcern}.`);
    }

    if (executive.nextBestStep) {
      parts.push(`Next best step: ${executive.nextBestStep}`);
    }

    const rnActions = operations.rnActions || [];
    const providerActions = operations.providerActions || [];

    if (rnActions.length) {
      parts.push(
        `RN priorities: ${rnActions.map(a => a.description || a.actionId).join("; ")}.`
      );
    }

    if (providerActions.length) {
      parts.push(
        `Provider priorities: ${providerActions.map(a => a.description || a.actionId).join("; ")}.`
      );
    }

    const precautions = operations.precautions || room.precautions || [];

    if (precautions.length) {
      parts.push(
        `Precautions: ${precautions.map(p => p.value || p.precautionId || p).join(", ")}.`
      );
    }

    const monitoringItems = monitoring.monitoring || operations.monitoring || [];

    if (monitoringItems.length) {
      parts.push(
        `Monitoring: ${monitoringItems.map(m => m.name || m.value || m.monitorId || m).join(", ")}.`
      );
    }

    if (why.rationale?.length) {
      parts.push(`Why: ${why.rationale.slice(0, 3).join(" ")}`);
    }

    const questions = room.questions || [];

    if (questions.length) {
      parts.push(
        `Missing information: ${questions.map(q => q.value || q).slice(0, 3).join("; ")}.`
      );
    }

    if (!parts.length) {
      return "I don’t have enough structured clinical information yet. Start with the main symptom, timing, severity, current vitals if available, major medical history, and any new medications.";
    }

    return `${parts.join("\n\n")}\n\nThis is advisory only and should follow clinician judgment and local policy.`;
  }
};

window.AriMedicalCommunicationEngine =
  window.Ari.medical.communication.engine;

console.log(
  "ARI MEDICAL COMMUNICATION ENGINE LOADED:",
  window.Ari.medical.communication.engine.version
);