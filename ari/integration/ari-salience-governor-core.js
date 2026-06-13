// ari/integration/ari-salience-governor-core.js
// Ari Salience Governor Core
// Purpose: Shared scoring helpers for Ari Salience Governor.
// V1.6

window.AriSalienceGovernorCore = {
  version: "1.6.0",

  clampScore(value, min = 0, max = 100) {
    const n = Number(value || 0);
    return Math.max(min, Math.min(max, n));
  },

  priorityForLead(lead) {
    const priority = {
      safety: 110,
      uncertainty: 100,
      meaning: 90,
      identity: 85,
      wisdom: 80,
      values: 75,
      executive: 72,
      stewardship: 70,
      emotion: 68,
      belief: 55,
      observer: 10
    };

    return priority[lead] || 0;
  },

  isBodyOrganismFunction(functionName = null) {
    return [
      "energy_intake",
      "hydration",
      "rest_recovery",
      "injury_protection",
      "vital_stability",
      "waste_elimination",
      "temperature_regulation",
      "movement_mobility",
      "threat_regulation"
    ].includes(functionName);
  },

  isRelationalOrganismFunction(functionName = null) {
    return [
      "connection"
    ].includes(functionName);
  },

  addCandidate(candidates, lead, score, reason, mode, question = null) {
    const normalizedScore = this.clampScore(score, 0, 120);
    const existing = candidates.find(c => c.lead === lead);

    if (existing) {
      existing.score = Math.max(existing.score, normalizedScore);

      if (reason && !existing.reasons.includes(reason)) {
        existing.reasons.push(reason);
      }

      if (!existing.question && question) existing.question = question;
      return;
    }

    candidates.push({
      lead,
      score: normalizedScore,
      reasons: reason ? [reason] : [],
      mode,
      question,
      priority: this.priorityForLead(lead)
    });
  }
};