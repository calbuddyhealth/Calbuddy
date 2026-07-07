// ari/medical/executive/ari-clinical-situation-room.js
// Purpose: Shared clinical workspace where Ari Medical engines write findings.
// V1.0.0 — Clinical Situation Room / Blackboard Architecture

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.executive = window.Ari.medical.executive || {};

window.Ari.medical.executive.situationRoom = {
  version: "1.0.0",

  create(input = {}) {
    return {
      roomId: input.roomId || this.createRoomId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      patient: input.patient || {},
      chiefComplaint: input.chiefComplaint || "",
      context: input.context || {},

      observations: [],
      symptoms: [],
      vitals: [],
      labs: [],
      imaging: [],
      medications: [],

      suspectedDiseases: [],
      suspectedOrganisms: [],
      risks: [],
      redFlags: [],

      precautions: [],
      monitoring: [],
      consults: [],
      nursingActions: [],
      providerActions: [],
      patientEducation: [],

      evidence: [],
      questions: [],
      uncertainties: [],

      auditTrail: [],

      executiveSummary: {
        dangerLevel: "unknown",
        priority: "undetermined",
        highestConcern: "",
        nextBestStep: "",
        needsEscalation: false,
        needsMoreInfo: false
      },

      advisoryOnly: true,
      situationRoomVersion: this.version
    };
  },

  write(room = {}, packet = {}) {
    if (!room || typeof room !== "object") return room;

    const section = packet.section || "observations";
    const item = {
      id: packet.id || this.createItemId(section),
      engine: packet.engine || "unknown_engine",
      type: packet.type || "finding",
      value: packet.value ?? null,
      confidence: packet.confidence || "unknown",
      priority: packet.priority || "routine",
      rationale: packet.rationale || [],
      source: packet.source || "",
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(room[section])) room[section] = [];
    room[section].push(item);

    this.audit(room, {
      engine: item.engine,
      action: "write",
      section,
      itemId: item.id,
      rationale: item.rationale
    });

    room.updatedAt = new Date().toISOString();
    return room;
  },

  audit(room = {}, event = {}) {
    if (!Array.isArray(room.auditTrail)) room.auditTrail = [];

    room.auditTrail.push({
      time: new Date().toISOString(),
      engine: event.engine || "unknown_engine",
      action: event.action || "unknown_action",
      section: event.section || "",
      itemId: event.itemId || "",
      rationale: event.rationale || [],
      advisoryOnly: true
    });

    return room;
  },

  summarize(room = {}) {
    return {
      roomId: room.roomId,
      chiefComplaint: room.chiefComplaint,
      dangerLevel: room.executiveSummary?.dangerLevel || "unknown",
      highestConcern: room.executiveSummary?.highestConcern || "",
      redFlags: room.redFlags || [],
      risks: room.risks || [],
      suspectedDiseases: room.suspectedDiseases || [],
      suspectedOrganisms: room.suspectedOrganisms || [],
      precautions: room.precautions || [],
      monitoring: room.monitoring || [],
      consults: room.consults || [],
      questions: room.questions || [],
      uncertainties: room.uncertainties || [],
      auditCount: room.auditTrail?.length || 0,
      advisoryOnly: true
    };
  },

  createRoomId() {
    return `CSR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  },

  createItemId(section = "item") {
    return `${String(section).toUpperCase()}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
};

window.AriClinicalSituationRoom =
  window.Ari.medical.executive.situationRoom;

console.log(
  "ARI CLINICAL SITUATION ROOM LOADED:",
  window.Ari.medical.executive.situationRoom.version
);