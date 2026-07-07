// ari/medical/operations/ari-hospital-operations-engine.js
// Purpose: Build an organized hospital-facing plan from Ari Medical outputs.
// V1.0.0 — Hospital Operations Engine / RN + Provider Workflow

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.operations =
  window.Ari.medical.operations || {};

window.Ari.medical.operations.hospitalOperationsEngine = {
  version: "1.0.0",

  build(room = {}) {
    const actionEngine = window.Ari.medical.operations.actionEngine;
    const infectionControl =
      window.Ari.medical.infectiousDisease?.infectionControl?.engine;

    let workingRoom = room;

    if (infectionControl?.writeToRoom) {
      workingRoom = infectionControl.writeToRoom(workingRoom, {
        room: workingRoom
      });
    }

    const actionPlan = actionEngine?.build
      ? actionEngine.build(workingRoom)
      : this.emptyActionPlan();

    return {
      engine: "ari-hospital-operations-engine",
      version: this.version,

      dangerLevel:
        workingRoom.executiveSummary?.dangerLevel || "unknown",

      rnActions: actionPlan.grouped?.RN || [],
      providerActions: actionPlan.grouped?.Provider || [],
      pharmacyActions: actionPlan.grouped?.["Clinical Pharmacy"] || [],
      infectionPreventionActions:
        actionPlan.grouped?.["Infection Prevention"] || [],

      precautions: workingRoom.precautions || [],
      monitoring: workingRoom.monitoring || [],
      consults: workingRoom.consults || [],
      patientEducation: workingRoom.patientEducation || [],

      totalActions: actionPlan.totalActions || 0,
      actionPlan,

      advisoryOnly: true
    };
  },

  writeToRoom(room = {}) {
    const result = this.build(room);
    const situationRoom = window.Ari.medical.executive?.situationRoom;

    if (!situationRoom?.write) return room;

    situationRoom.write(room, {
      section: "evidence",
      engine: "ari-hospital-operations-engine",
      type: "operations_plan",
      value: result,
      confidence: "medium",
      priority: result.dangerLevel === "high" ? "high" : "routine",
      rationale: [
        "Hospital operations plan assembled from current Situation Room actions, precautions, monitoring, and consults."
      ]
    });

    return room;
  },

  emptyActionPlan() {
    return {
      totalActions: 0,
      actions: [],
      grouped: {},
      advisoryOnly: true
    };
  }
};

window.AriHospitalOperationsEngine =
  window.Ari.medical.operations.hospitalOperationsEngine;

console.log(
  "ARI HOSPITAL OPERATIONS ENGINE LOADED:",
  window.Ari.medical.operations.hospitalOperationsEngine.version
);