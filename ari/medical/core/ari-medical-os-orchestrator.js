// ari/medical/core/ari-medical-os-orchestrator.js
// Purpose: Run Ari Medical OS engines in the correct order.
// V1.4.0 — Medical OS Orchestrator / Reportable + Exposure-Aware Pipeline

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.osOrchestrator = {
  version: "1.4.0",

  run(input = {}) {
    const situationRoom = window.Ari.medical.executive?.situationRoom;

    const infectionControl =
      window.Ari.medical.infectiousDisease?.infectionControl?.engine;

    const reportableDiseaseEngine =
      window.Ari.medical.infectiousDisease?.infectionControl?.reportableDiseaseEngine;

    const exposureManagementEngine =
      window.Ari.medical.infectiousDisease?.infectionControl?.exposureManagementEngine;

const stiReasoningEngine =
  window.Ari.medical.infectiousDisease?.sti?.reasoningEngine;

    const monitoringEngine = window.Ari.medical.monitoring?.engine;
    const escalationEngine = window.Ari.medical.executive?.escalationEngine;
    const priorityEngine = window.Ari.medical.executive?.priorityEngine;
    const hospitalOps = window.Ari.medical.operations?.hospitalOperationsEngine;
    const executive = window.Ari.medical.executive?.clinicalExecutiveEngine;
    const whyEngine = window.Ari.medical.executive?.whyEngine;
    const communication = window.Ari.medical.communication?.engine;

    if (!situationRoom?.create) {
      return this.error("Clinical Situation Room not loaded.");
    }

    let room = input.room || situationRoom.create({
      patient: input.patient || {},
      chiefComplaint:
        input.chiefComplaint ||
        input.userMessage ||
        input.message ||
        input.input ||
        "",
      context: input.context || {}
    });

    const text =
      input.userMessage ||
      input.message ||
      input.input ||
      room.chiefComplaint ||
      "";

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

    if (monitoringEngine?.writeToRoom) {
      room = monitoringEngine.writeToRoom(room);
    }

    if (escalationEngine?.writeToRoom) {
      room = escalationEngine.writeToRoom(room, { text });
    }

    if (priorityEngine?.writeToRoom) {
      room = priorityEngine.writeToRoom(room, { text });
    }

    const operations = hospitalOps?.build
      ? hospitalOps.build(room)
      : {};

    if (executive?.writeToRoom) {
      room = executive.writeToRoom(room);
    }

    const why = whyEngine?.explain
      ? whyEngine.explain(room, {
          recommendation: room.executiveSummary?.nextBestStep || "clinical_plan"
        })
      : {};

    const monitoring = monitoringEngine?.build
      ? monitoringEngine.build(room)
      : {};

    const final = communication?.compose
      ? communication.compose({
          room,
          operations,
          why,
          monitoring
        })
      : {
          response: "Ari Medical OS ran, but the communication engine is not loaded."
        };

    return {
      engine: "ari-medical-os-orchestrator",
      version: this.version,
      room,
      operations,
      why,
      monitoring,
      response: final.response,
      advisoryOnly: true
    };
  },

  error(message = "") {
    return {
      engine: "ari-medical-os-orchestrator",
      version: this.version,
      error: message,
      advisoryOnly: true
    };
  }
};

window.AriMedicalOSOrchestrator =
  window.Ari.medical.osOrchestrator;

console.log(
  "ARI MEDICAL OS ORCHESTRATOR LOADED:",
  window.Ari.medical.osOrchestrator.version
);