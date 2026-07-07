// ari/medical/operations/ari-medical-action-engine.js
// Purpose: Build a unified clinical action plan from all Ari Medical engines.
// V1.0.0 — Medical Action Engine / Workflow Orchestrator

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.operations =
  window.Ari.medical.operations || {};

window.Ari.medical.operations.actionEngine = {
  version: "1.0.0",

  build(room = {}) {
    const registry =
      window.Ari.medical.operations.actionRegistry;

    if (!registry?.find) {
      console.warn("ARI ACTION ENGINE: Action Registry not loaded.");
      return this.empty();
    }

    const requested = this.collectRequestedActions(room);

    const unique = this.removeDuplicates(requested);

    const resolved = this.resolve(unique);

    const expanded = resolved
      .map(id => registry.find(id))
      .filter(Boolean);

    const grouped = this.groupByOwner(expanded);

    return {
      engine: "medical_action_engine",
      version: this.version,

      totalActions: expanded.length,

      actions: expanded,

      grouped,

      advisoryOnly: true
    };
  },

  collectRequestedActions(room = {}) {

    const sections = [
      "providerActions",
      "nursingActions",
      "consults",
      "precautions",
      "monitoring"
    ];

    const actions = [];

    sections.forEach(section => {

      const list = room[section];

      if (!Array.isArray(list)) return;

      list.forEach(item => {

        if (typeof item === "string") {
          actions.push(item);
          return;
        }

        if (item?.actionId) {
          actions.push(item.actionId);
        }

      });

    });

    return actions;
  },

  removeDuplicates(actions = []) {
    return [...new Set(actions)];
  },

  resolve(actions = []) {

    // Future:
    // Contact vs Airborne
    // Duplicate consults
    // Escalation logic
    // Institution-specific policies

    return actions;
  },

  groupByOwner(actions = []) {

    const grouped = {};

    actions.forEach(action => {

      (action.owner || []).forEach(owner => {

        if (!grouped[owner]) {
          grouped[owner] = [];
        }

        grouped[owner].push(action);

      });

    });

    Object.keys(grouped).forEach(owner => {

      grouped[owner].sort((a, b) =>
        this.priorityScore(b.priority) -
        this.priorityScore(a.priority)
      );

    });

    return grouped;
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
      engine: "medical_action_engine",
      version: this.version,
      totalActions: 0,
      actions: [],
      grouped: {},
      advisoryOnly: true
    };

  }

};

window.AriMedicalActionEngine =
  window.Ari.medical.operations.actionEngine;

console.log(
  "ARI MEDICAL ACTION ENGINE LOADED:",
  window.Ari.medical.operations.actionEngine.version
);