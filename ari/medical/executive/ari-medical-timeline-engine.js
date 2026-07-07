// ari/medical/executive/ari-medical-timeline-engine.js
// Purpose: Track clinical events over time for Ari Medical OS.
// V1.0.0 — Timeline Engine / Clinical Trend Awareness

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.executive = window.Ari.medical.executive || {};

window.Ari.medical.executive.timelineEngine = {
  version: "1.0.0",

  create(input = {}) {
    return {
      timelineId: input.timelineId || this.createTimelineId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      patientId: input.patientId || "",
      encounterId: input.encounterId || "",

      events: [],

      trendSummary: {
        direction: "unknown",
        concernLevel: "unknown",
        keyChanges: [],
        unresolvedItems: []
      },

      advisoryOnly: true,
      timelineVersion: this.version
    };
  },

  addEvent(timeline = {}, event = {}) {
    if (!timeline || typeof timeline !== "object") {
      timeline = this.create();
    }

    if (!Array.isArray(timeline.events)) {
      timeline.events = [];
    }

    timeline.events.push({
      eventId: event.eventId || this.createEventId(),
      time: event.time || new Date().toISOString(),

      type: event.type || "clinical_event",
      category: event.category || "general",

      value: event.value ?? null,
      details: event.details || {},

      source: event.source || "unknown_source",
      engine: event.engine || "unknown_engine",

      severity: event.severity || "unknown",
      confidence: event.confidence || "unknown",

      relatedActions: event.relatedActions || [],
      relatedMonitoring: event.relatedMonitoring || [],
      relatedKnowledge: event.relatedKnowledge || [],

      advisoryOnly: true
    });

    timeline.updatedAt = new Date().toISOString();
    timeline.trendSummary = this.summarizeTrends(timeline);

    return timeline;
  },

  addFromRoom(timeline = {}, room = {}) {
    const sections = [
      "observations",
      "symptoms",
      "vitals",
      "labs",
      "imaging",
      "medications",
      "risks",
      "redFlags",
      "precautions",
      "monitoring",
      "consults",
      "nursingActions",
      "providerActions",
      "patientEducation"
    ];

    sections.forEach(section => {
      const list = Array.isArray(room[section]) ? room[section] : [];

      list.forEach(item => {
        this.addEvent(timeline, {
          type: section,
          category: item?.type || section,
          value: item?.value ?? item,
          details: item,
          source: item?.source || "situation_room",
          engine: item?.engine || "situation_room",
          severity: item?.priority || "unknown",
          confidence: item?.confidence || "unknown",
          relatedActions: item?.actionId ? [item.actionId] : [],
          relatedMonitoring: item?.monitorId ? [item.monitorId] : [],
          relatedKnowledge: item?.umkoId ? [item.umkoId] : []
        });
      });
    });

    return timeline;
  },

  summarizeTrends(timeline = {}) {
    const events = Array.isArray(timeline.events) ? timeline.events : [];
    const text = this.normalize(JSON.stringify(events));

    const worseningSignals = [
      "worse",
      "worsening",
      "declining",
      "hypotension",
      "low oxygen",
      "confusion",
      "rising lactate",
      "rising creatinine",
      "sepsis",
      "shock",
      "rapid response"
    ];

    const improvingSignals = [
      "improving",
      "better",
      "stable",
      "afebrile",
      "oxygen improved",
      "pain improved",
      "lactate down",
      "creatinine improved"
    ];

    const worsening = worseningSignals.filter(signal =>
      text.includes(this.normalize(signal))
    );

    const improving = improvingSignals.filter(signal =>
      text.includes(this.normalize(signal))
    );

    let direction = "unknown";
    if (worsening.length > improving.length) direction = "worsening";
    else if (improving.length > worsening.length) direction = "improving";
    else if (events.length) direction = "stable_or_unclear";

    return {
      direction,
      concernLevel: this.concernLevelFor(direction, worsening),
      keyChanges: this.dedupe([...worsening, ...improving]).slice(0, 10),
      unresolvedItems: this.findUnresolvedItems(events)
    };
  },

  concernLevelFor(direction = "unknown", worsening = []) {
    if (worsening.some(x =>
      ["shock", "sepsis", "rapid response", "low oxygen", "hypotension"].includes(x)
    )) {
      return "high";
    }

    if (direction === "worsening") return "moderate";
    if (direction === "improving") return "lower";
    return "unknown";
  },

  findUnresolvedItems(events = []) {
    const text = this.normalize(JSON.stringify(events));
    const unresolved = [];

    if (text.includes("pending")) unresolved.push("pending_results");
    if (text.includes("needs more info")) unresolved.push("missing_information");
    if (text.includes("uncertain")) unresolved.push("clinical_uncertainty");
    if (text.includes("follow up")) unresolved.push("follow_up_needed");

    return this.dedupe(unresolved);
  },

  createTimelineId() {
    return `TIMELINE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  },

  createEventId() {
    return `EVENT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  },

  dedupe(list = []) {
    return [...new Set(list.filter(Boolean))];
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

window.AriMedicalTimelineEngine =
  window.Ari.medical.executive.timelineEngine;

console.log(
  "ARI MEDICAL TIMELINE ENGINE LOADED:",
  window.Ari.medical.executive.timelineEngine.version
);