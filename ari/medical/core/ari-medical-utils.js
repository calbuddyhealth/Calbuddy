// ari/medical/core/ari-medical-utils.js
// Purpose: Shared medical helper functions.
// V1.0.0

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.utils = {
  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'?.,!:%/.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  hasAny(text = "", terms = []) {
    const clean = this.normalize(text);
    return terms.some(term => this.hasTerm(clean, term));
  },

  hasTerm(text = "", term = "") {
    const value = this.normalize(term);
    if (!value) return false;

    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\b)${escaped}(\\b|$)`, "i").test(text);
  },

  evidence(type, claim, confidence = 0.7, source = "medical_engine", raw = null) {
    return {
      type,
      claim,
      confidence,
      source,
      raw
    };
  },

  uniqueByClaim(list = []) {
    const seen = new Set();

    return list.filter(item => {
      const key = String(item?.claim || "").toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

console.log("ARI MEDICAL UTILS LOADED");