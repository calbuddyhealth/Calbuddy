// ari/medical/operations/ari-hospital-operations-engine.js
// Purpose: Build an organized hospital-facing plan from Ari Medical outputs.
// V1.2.0 — Hospital Operations Engine / Resolver-Only Workflow

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.operations =
  window.Ari.medical.operations || {};

window.Ari.medical.operations.hospitalOperationsEngine = {
  version: "1.2.0",

  build(room = {}) {
    const actionEngine = window.Ari.medical.operations.actionEngine;
    const resolver = window.Ari.medical.operations.hospitalActionResolver;

    const workingRoom = room;

    const rawActionPlan = actionEngine?.build
      ? actionEngine.build(workingRoom)
      : this.emptyActionPlan();

    const resolvedPlan = resolver?.resolve
      ? resolver.resolve({
          actions: rawActionPlan.actions || [],
          actionPlan: rawActionPlan,
          room: workingRoom
        })
      : rawActionPlan;

    const grouped = this.groupByOwner(resolvedPlan.actions || []);

    return {
      engine: "ari-hospital-operations-engine",
      version: this.version,

      dangerLevel: workingRoom.executiveSummary?.dangerLevel || "unknown",

      rnActions: grouped.RN || [],
      providerActions: grouped.Provider || [],
      pharmacyActions: grouped["Clinical Pharmacy"] || [],
      infectionPreventionActions: grouped["Infection Prevention"] || [],

      precautions: workingRoom.precautions || [],
      monitoring: workingRoom.monitoring || [],
      consults: workingRoom.consults || [],
      patientEducation: workingRoom.patientEducation || [],

      conflicts: resolvedPlan.conflicts || [],

      totalActions: resolvedPlan.totalActions || 0,
      actionPlan: resolvedPlan,

      advisoryOnly: true
    };
  },

  groupByOwner(actions = []) {
    const grouped = {};

    actions.forEach(action => {
      (action.owner || []).forEach(owner => {
        if (!grouped[owner]) grouped[owner] = [];
        grouped[owner].push(action);
      });
    });

    return grouped;
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
        "Hospital operations plan assembled from existing Situation Room data without re-running clinical engines."
      ]
    });

    return room;
  },

  emptyActionPlan() {
    return {
      totalActions: 0,
      actions: [],
      grouped: {},
      conflicts: [],
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