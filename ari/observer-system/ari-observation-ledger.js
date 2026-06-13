// ari/observer-system/ari-observation-ledger.js
// Ari Observation Ledger
// Purpose: Separate direct observations from hypotheses so later organs do not over-interpret.
// V1.0

window.Ari = window.Ari || {};

window.Ari.observationLedger = {
  version: "1.0.0",

  create() {
    return [];
  },

  createObservation({
    signal = "unknown",
    category = "unknown",
    observationType = "hypothesis",
    confidence = 50,
    source = "unknown",
    evidence = [],
    blocks = [],
    supports = [],
    contradicts = []
  } = {}) {
    return {
      signal,
      category,
      observationType,
      confidence: this.clamp(confidence),
      source,
      evidence: Array.isArray(evidence) ? evidence : [String(evidence)],
      blocks,
      supports,
      contradicts,
      weight: this.weightObservation(observationType, confidence),
      createdAt: new Date().toISOString()
    };
  },

  add(ledger = [], observation = {}) {
    if (!Array.isArray(ledger)) return ledger;

    const existing = ledger.find(
      (item) =>
        item.signal === observation.signal &&
        item.category === observation.category
    );

    if (existing) {
      existing.confidence = Math.max(existing.confidence, observation.confidence || 0);
      existing.weight = Math.max(existing.weight, observation.weight || 0);
      existing.evidence = [
        ...new Set([...(existing.evidence || []), ...(observation.evidence || [])])
      ];
      return ledger;
    }

    ledger.push(observation);
    return ledger;
  },

  rank(ledger = []) {
    if (!Array.isArray(ledger)) return [];

    return [...ledger].sort((a, b) => {
      const aWeight = a.weight || 0;
      const bWeight = b.weight || 0;
      return bWeight - aWeight;
    });
  },

  weightObservation(type = "hypothesis", confidence = 50) {
    const typeWeight = {
      direct_text: 100,
      user_confirmed: 95,
      repeated_pattern: 85,
      system_inference: 65,
      hypothesis: 45,
      weak_hint: 25
    };

    const base = typeWeight[type] ?? 45;
    return this.clamp(Math.round((base + confidence) / 2));
  },

  strongestByCategory(ledger = [], category = "unknown") {
    const ranked = this.rank(
      ledger.filter((item) => item.category === category)
    );

    return ranked[0] || null;
  },

  hasDirectSignal(ledger = [], signal = "") {
    return ledger.some(
      (item) =>
        item.signal === signal &&
        ["direct_text", "user_confirmed"].includes(item.observationType)
    );
  },

  summarize(ledger = []) {
    const ranked = this.rank(ledger);

    return {
      observationLedgerRan: true,
      observationLedgerVersion: this.version,
      observationCount: ranked.length,
      strongestObservation: ranked[0]?.signal || null,
      strongestObservationCategory: ranked[0]?.category || null,
      strongestObservationType: ranked[0]?.observationType || null,
      strongestObservationConfidence: ranked[0]?.confidence || 0,
      strongestObservationWeight: ranked[0]?.weight || 0,
      rankedObservations: ranked.slice(0, 10)
    };
  },

  clamp(value = 0) {
    return Math.max(0, Math.min(100, Number(value) || 0));
  }
};