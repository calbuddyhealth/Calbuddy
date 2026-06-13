// ari/observer-system/ari-observation-ledger.js
// Ari Observation Ledger
// Purpose: Store observations before interpretation.
// V1.0

window.Ari = window.Ari || {};

window.Ari.observationLedger = {
  version: "1.0.0",

  createObservation({
    signal = "unknown",
    category = "unknown",
    observationType = "direct_text",
    confidence = 50,
    source = "unknown",
    evidence = []
  } = {}) {
    return {
      signal,
      category,
      observationType,
      confidence,
      source,
      evidence,
      timestamp: Date.now()
    };
  },

  create() {
    return [];
  },

  add(ledger = [], observation = {}) {
    if (!Array.isArray(ledger)) ledger = [];

    ledger.push(observation);

    return ledger;
  },

  rank(ledger = []) {
    return [...ledger].sort((a, b) => {
      return (b.confidence || 0) - (a.confidence || 0);
    });
  }
};