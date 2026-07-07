// ari/medical/core/ari-medical-umko-spec.js
// Purpose: Define the Universal Medical Knowledge Object base standard.
// V1.0.0 — UMKO Base Specification / Stable IDs

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.umkoSpec = {
  version: "1.0.0",

  requiredBaseFields: [
    "id",
    "umkoId",
    "versionId",
    "status"
  ],

  allowedStatuses: [
    "active",
    "draft",
    "deprecated",
    "archived"
  ],

  createBase(entry = {}) {
    return {
      id: entry.id || "",
      umkoId: entry.umkoId || "",
      versionId: entry.versionId || "1.0",
      status: entry.status || "active",

      objectType: entry.objectType || "medical_knowledge",
      domain: entry.domain || "general",
      category: entry.category || "uncategorized",

      created: entry.created || "2026-07",
      updated: entry.updated || "2026-07",

      metadata: {
        advisoryOnly: true,
        source: "",
        evidenceLevel: "reference",
        ...(entry.metadata || {})
      }
    };
  },

  validateBase(entry = {}) {
    const errors = [];

    this.requiredBaseFields.forEach(field => {
      if (!entry[field]) {
        errors.push(`Missing required UMKO field: ${field}`);
      }
    });

    if (
      entry.status &&
      !this.allowedStatuses.includes(entry.status)
    ) {
      errors.push(`Invalid UMKO status: ${entry.status}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  isValidUmkoId(value = "") {
    return /^[A-Z]+-[A-Z0-9]+-[A-Z0-9]+-\d{4}$/.test(
      String(value || "").trim()
    );
  }
};

window.AriMedicalUMKOSpec = window.Ari.medical.umkoSpec;

console.log(
  "ARI MEDICAL UMKO SPEC LOADED:",
  window.Ari.medical.umkoSpec.version
);