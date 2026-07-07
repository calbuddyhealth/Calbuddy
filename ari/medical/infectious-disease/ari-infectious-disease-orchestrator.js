// ari/medical/infectious-disease/ari-infectious-disease-orchestrator.js
// Purpose: Run Ari Infectious Disease subsystem engines in order.
// V1.0.0 — Infectious Disease Orchestrator / Subsystem Pipeline

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};

window.Ari.medical.infectiousDisease.orchestrator = {
  version: "1.0.0",

  run(room = {}, input = {}) {
    const text =
      input.text ||
      input.userMessage ||
      input.message ||
      input.input ||
      room.chiefComplaint ||
      "";

    const infectionControl =
      window.Ari.medical.infectiousDisease?.infectionControl?.engine;

    const reportableDiseaseEngine =
      window.Ari.medical.infectiousDisease?.infectionControl?.reportableDiseaseEngine;

    const exposureManagementEngine =
      window.Ari.medical.infectiousDisease?.infectionControl?.exposureManagementEngine;

    const stiReasoningEngine =
      window.Ari.medical.infectiousDisease?.sti?.reasoningEngine;

    const cultureInterpretationEngine =
      window.Ari.medical.infectiousDisease?.antibiotics?.cultureInterpretationEngine;

    const antibioticSelectionEngine =
      window.Ari.medical.infectiousDisease?.antibiotics?.selectionEngine;

    if (infectionControl?.writeToRoom) {
      room = infectionControl.writeToRoom(room, { text });
    }

    if (reportableDiseaseEngine?.writeToRoom) {
      room = reportableDiseaseEngine.writeToRoom(room, { text });
    }

    if (exposureManagementEngine?.writeToRoom) {
      room = exposureManagementEngine.writeToRoom(room, { text });
    }

    if (stiReasoningEngine?.writeToRoom) {
      room = stiReasoningEngine.writeToRoom(room, { text });
    }

    if (cultureInterpretationEngine?.writeToRoom) {
      room = cultureInterpretationEngine.writeToRoom(room, { text });
    }

    if (antibioticSelectionEngine?.writeToRoom) {
      room = antibioticSelectionEngine.writeToRoom(room, { text });
    }

    return room;
  }
};

window.AriInfectiousDiseaseOrchestrator =
  window.Ari.medical.infectiousDisease.orchestrator;

console.log(
  "ARI INFECTIOUS DISEASE ORCHESTRATOR LOADED:",
  window.Ari.medical.infectiousDisease.orchestrator.version
);