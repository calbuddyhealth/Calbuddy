// ari/system/ari-authority.js
// Ari Authority System
// Purpose: Define and enforce Ari's authority hierarchy in code.

window.Ari = window.Ari || {};

window.Ari.authority = {
  version: "1.0.0",

  hierarchy: [
    "constitution",
    "soul",
    "guardian",
    "selfModel",
    "brain",
    "router",
    "primaryOrgan",
    "supportingOrgan",
    "emotionEngine",
    "memoryEngine",
    "canvas",
    "legacy"
  ],

  getRank(source) {
    const normalized = String(source || "").trim();

    const index = this.hierarchy.indexOf(normalized);

    if (index === -1) {
      return this.hierarchy.length;
    }

    return index;
  },

  compare(sourceA, sourceB) {
    const rankA = this.getRank(sourceA);
    const rankB = this.getRank(sourceB);

    if (rankA < rankB) {
      return sourceA;
    }

    if (rankB < rankA) {
      return sourceB;
    }

    return null;
  },

  hasAuthorityOver(sourceA, sourceB) {
    return this.getRank(sourceA) < this.getRank(sourceB);
  },

  resolveConflict(options = {}) {
    const {
      sourceA,
      sourceB,
      valueA,
      valueB,
      reason = "Authority conflict"
    } = options;

    const winner = this.compare(sourceA, sourceB);

    if (!winner) {
      return {
        winner: null,
        value: null,
        reason: "Equal authority. Brain must evaluate.",
        sourceA,
        sourceB
      };
    }

    return {
      winner,
      value: winner === sourceA ? valueA : valueB,
      reason,
      sourceA,
      sourceB
    };
  },

  protectConstitution(candidate = {}) {
    const source = candidate.source || "legacy";

    if (this.hasAuthorityOver("constitution", source)) {
      return {
        allowed: false,
        reason: "No lower authority may override Ari's Constitution.",
        candidate
      };
    }

    return {
      allowed: true,
      reason: "Candidate does not override Constitution.",
      candidate
    };
  },

  explainHierarchy() {
    return this.hierarchy
      .map((source, index) => `${index + 1}. ${source}`)
      .join("\n");
  }
};