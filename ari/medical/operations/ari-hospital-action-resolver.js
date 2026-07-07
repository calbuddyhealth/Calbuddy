// ari/medical/operations/ari-hospital-action-resolver.js
// Purpose: Resolve, clean, sort, and safety-check hospital action plans.
// V1.0.0 — Hospital Action Resolver / Final Plan QA

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.operations =
  window.Ari.medical.operations || {};

window.Ari.medical.operations.hospitalActionResolver = {
  version: "1.0.0",

  resolve(input = {}) {
    const actions = input.actions || input.actionPlan?.actions || [];
    const room = input.room || input.situationRoom || {};

    const deduped = this.dedupe(actions);
    const withRequired = this.addRequiredActions(deduped, room);
    const conflicts = this.detectConflicts(withRequired, room);
    const sorted = this.sortByPriority(withRequired);

    return {
      engine: "ari-hospital-action-resolver",
      version: this.version,
      actions: sorted,
      conflicts,
      totalActions: sorted.length,
      advisoryOnly: true
    };
  },

  dedupe(actions = []) {
    const seen = new Set();

    return actions.filter(action => {
      const key = action.umkoId || action.actionId || action.description;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  addRequiredActions(actions = [], room = {}) {
    const registry = window.Ari.medical.operations?.actionRegistry;
    if (!registry?.find) return actions;

    const ids = new Set(
      actions.map(action => action.actionId || action.umkoId).filter(Boolean)
    );

    const text = JSON.stringify({ actions, room }).toLowerCase();

    if (
      text.includes("action-notify-public-health") ||
      text.includes("act-ph-notify-0001")
    ) {
      ids.add("ACTION-NOTIFY-INFECTION-PREVENTION");
    }

    if (
      text.includes("airborne") ||
      text.includes("precaution-airborne") ||
      text.includes("prec-airborne-0001")
    ) {
      ids.add("ACTION-NOTIFY-INFECTION-PREVENTION");
    }

    if (
      text.includes("sepsis") ||
      text.includes("act-emerg-sepsis-0001")
    ) {
      ids.add("ACTION-NOTIFY-PROVIDER");
      ids.add("ACTION-OBTAIN-LACTATE");
      ids.add("ACTION-DRAW-BLOOD-CULTURES");
    }

    return [...ids]
      .map(id => registry.find(id))
      .filter(Boolean);
  },

  detectConflicts(actions = [], room = {}) {
    const conflicts = [];
    const text = JSON.stringify({ actions, room }).toLowerCase();

    if (
      text.includes("contact-enteric") &&
      text.includes("alcohol hand sanitizer")
    ) {
      conflicts.push({
        type: "infection_control_conflict",
        severity: "high",
        message:
          "Contact-enteric precautions usually require soap-and-water hand hygiene emphasis rather than relying only on alcohol sanitizer."
      });
    }

    if (
      text.includes("airborne") &&
      !text.includes("negative pressure")
    ) {
      conflicts.push({
        type: "room_requirement_missing",
        severity: "moderate",
        message:
          "Airborne precautions generally require negative-pressure room review when available."
      });
    }

    return conflicts;
  },

  sortByPriority(actions = []) {
    return [...actions].sort(
      (a, b) =>
        this.priorityScore(b.priority) -
        this.priorityScore(a.priority)
    );
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
  }
};

window.AriHospitalActionResolver =
  window.Ari.medical.operations.hospitalActionResolver;

console.log(
  "ARI HOSPITAL ACTION RESOLVER LOADED:",
  window.Ari.medical.operations.hospitalActionResolver.version
);