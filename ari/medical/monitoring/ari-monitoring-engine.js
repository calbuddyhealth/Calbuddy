// ari/medical/monitoring/ari-monitoring-engine.js
// Purpose: Expand, dedupe, prioritize, and write monitoring plans.
// V1.0.0 — Monitoring Engine / Ari Medical OS

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.monitoring = window.Ari.medical.monitoring || {};

window.Ari.medical.monitoring.engine = {
  version: "1.0.0",

  build(room = {}) {
    const registry = window.Ari.medical.monitoring.registry;

    if (!registry?.find) {
      console.warn("ARI MONITORING ENGINE: Monitoring Registry not loaded.");
      return this.empty();
    }

    const requested = this.collectMonitoring(room);
    const unique = this.removeDuplicates(requested);

    const expanded = unique
      .map(id => registry.find(id))
      .filter(Boolean);

    const sorted = this.sortByPriority(expanded);

    return {
      engine: "ari-monitoring-engine",
      version: this.version,
      totalMonitoringItems: sorted.length,
      monitoring: sorted,
      advisoryOnly: true
    };
  },

  writeToRoom(room = {}) {
    const result = this.build(room);
    const situationRoom = window.Ari.medical.executive?.situationRoom;

    if (!situationRoom?.write) return room;

    result.monitoring.forEach(item => {
      situationRoom.write(room, {
        section: "monitoring",
        engine: "ari-monitoring-engine",
        type: "monitoring_plan",
        value: item.monitorId,
        umkoId: item.umkoId,
        confidence: "medium",
        priority: this.priorityFor(item),
        rationale: [
          item.notes || "Monitoring profile expanded from Monitoring Registry."
        ]
      });
    });

    return room;
  },

  collectMonitoring(room = {}) {
    const items = [];

    const sections = [
      "monitoring",
      "medications",
      "risks",
      "suspectedDiseases",
      "suspectedOrganisms",
      "evidence"
    ];

    sections.forEach(section => {
      const list = room[section];

      if (!Array.isArray(list)) return;

      list.forEach(item => {
        if (typeof item === "string") {
          items.push(item);
          return;
        }

        if (item?.monitorId) items.push(item.monitorId);
        if (item?.umkoId) items.push(item.umkoId);
        if (item?.value) items.push(item.value);

        if (Array.isArray(item?.monitoring)) {
          item.monitoring.forEach(mon => items.push(mon));
        }
      });
    });

    return items;
  },

  removeDuplicates(items = []) {
    return [...new Set(items.filter(Boolean))];
  },

  sortByPriority(items = []) {
    return [...items].sort(
      (a, b) => this.priorityScore(this.priorityFor(b)) - this.priorityScore(this.priorityFor(a))
    );
  },

  priorityFor(item = {}) {
    const text = JSON.stringify(item).toLowerCase();

    if (
      text.includes("lactate") ||
      text.includes("oxygen") ||
      text.includes("mental status") ||
      text.includes("vital signs")
    ) {
      return "high";
    }

    if (
      text.includes("vancomycin") ||
      text.includes("aminoglycoside") ||
      text.includes("renal") ||
      text.includes("ecg") ||
      text.includes("qt") ||
      text.includes("ck")
    ) {
      return "moderate";
    }

    return "routine";
  },

  priorityScore(priority = "") {
    switch (priority) {
      case "critical":
        return 100;
      case "high":
        return 75;
      case "moderate":
        return 50;
      case "routine":
        return 25;
      default:
        return 0;
    }
  },

  empty() {
    return {
      engine: "ari-monitoring-engine",
      version: this.version,
      totalMonitoringItems: 0,
      monitoring: [],
      advisoryOnly: true
    };
  }
};

window.AriMonitoringEngine = window.Ari.medical.monitoring.engine;

console.log(
  "ARI MONITORING ENGINE LOADED:",
  window.Ari.medical.monitoring.engine.version
);