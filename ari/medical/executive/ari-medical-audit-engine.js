// ari/medical/executive/ari-medical-audit-engine.js
// Purpose: Structured trace system for Ari Medical engines.
// V1.0.0 — Medical Audit Engine / Explainable Reasoning Trace

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.executive = window.Ari.medical.executive || {};

window.Ari.medical.executive.auditEngine = {
  version: "1.0.0",

  createTrace(input = {}) {
    return {
      traceId: input.traceId || this.createTraceId(),
      createdAt: new Date().toISOString(),

      engine: input.engine || "unknown_engine",
      engineVersion: input.engineVersion || "",

      inputSummary: input.inputSummary || {},
      detectedSignals: input.detectedSignals || [],
      outputs: input.outputs || [],

      rationale: input.rationale || [],
      evidence: input.evidence || [],
      uncertainty: input.uncertainty || [],

      confidence: input.confidence || "unknown",
      priority: input.priority || "routine",

      advisoryOnly: true
    };
  },

  attachToRoom(room = {}, trace = {}) {
    if (!room || typeof room !== "object") return room;

    if (!Array.isArray(room.auditTrail)) {
      room.auditTrail = [];
    }

    room.auditTrail.push({
      ...trace,
      attachedAt: new Date().toISOString()
    });

    room.updatedAt = new Date().toISOString();

    return room;
  },

  record(room = {}, input = {}) {
    const trace = this.createTrace(input);
    return this.attachToRoom(room, trace);
  },

  summarize(room = {}) {
    const trail = Array.isArray(room.auditTrail) ? room.auditTrail : [];

    return {
      auditEngineRan: true,
      auditEngineVersion: this.version,
      traceCount: trail.length,
      engines: [...new Set(trail.map(item => item.engine).filter(Boolean))],
      highestPriorities: trail
        .filter(item => ["critical", "high", "urgent"].includes(item.priority))
        .map(item => ({
          engine: item.engine,
          priority: item.priority,
          rationale: item.rationale || []
        })),
      advisoryOnly: true
    };
  },

  createTraceId() {
    return `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
};

window.AriMedicalAuditEngine =
  window.Ari.medical.executive.auditEngine;

console.log(
  "ARI MEDICAL AUDIT ENGINE LOADED:",
  window.Ari.medical.executive.auditEngine.version
);