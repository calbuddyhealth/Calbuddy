// ari/medical/infectious-disease/infection-control/ari-precaution-registry.js
// Purpose: Universal registry of infection control precautions.
// V1.0.0 — Precaution Registry / UMKO Stable IDs

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.infectionControl =
  window.Ari.medical.infectiousDisease.infectionControl || {};

window.Ari.medical.infectiousDisease.infectionControl.precautionRegistry = {
  version: "1.0.0",

  entries() {
    return [

      // ======================================================
      // STANDARD
      // ======================================================

      {
        precautionId: "PRECAUTION-STANDARD",

        umkoId: "PREC-STANDARD-0001",
        versionId: "1.0",
        status: "active",

        name: "Standard Precautions",

        category: "standard",

        ppe: [
          "hand hygiene",
          "gloves when indicated",
          "eye protection if splash risk"
        ],

        roomRequirements: [
          "standard room"
        ],

        patientTransport: [
          "no routine restrictions"
        ],

        visitorGuidance: [
          "standard precautions"
        ],

        environmentalCleaning: [
          "routine hospital cleaning"
        ],

        duration: "entire admission",

        clinicalPearls: [
          "Apply to every patient."
        ]
      },

      // ======================================================
      // CONTACT
      // ======================================================

      {
        precautionId: "PRECAUTION-CONTACT",

        umkoId: "PREC-CONTACT-0001",
        versionId: "1.0",
        status: "active",

        name: "Contact Precautions",

        category: "contact",

        ppe: [
          "gown",
          "gloves"
        ],

        roomRequirements: [
          "private room when available"
        ],

        patientTransport: [
          "limit transport when possible"
        ],

        visitorGuidance: [
          "gown and gloves when appropriate"
        ],

        environmentalCleaning: [
          "enhanced environmental cleaning"
        ],

        duration: "organism dependent",

        clinicalPearls: [
          "Dedicated equipment when feasible."
        ]
      },

      // ======================================================
      // DROPLET
      // ======================================================

      {
        precautionId: "PRECAUTION-DROPLET",

        umkoId: "PREC-DROPLET-0001",
        versionId: "1.0",
        status: "active",

        name: "Droplet Precautions",

        category: "droplet",

        ppe: [
          "surgical mask"
        ],

        roomRequirements: [
          "private room preferred"
        ],

        patientTransport: [
          "patient wears surgical mask"
        ],

        visitorGuidance: [
          "mask during visitation"
        ],

        environmentalCleaning: [
          "routine cleaning"
        ],

        duration: "disease dependent",

        clinicalPearls: [
          "Mask patient during transport."
        ]
      },

      // ======================================================
      // AIRBORNE
      // ======================================================

      {
        precautionId: "PRECAUTION-AIRBORNE",

        umkoId: "PREC-AIRBORNE-0001",
        versionId: "1.0",
        status: "active",

        name: "Airborne Precautions",

        category: "airborne",

        ppe: [
          "fit-tested N95 respirator"
        ],

        roomRequirements: [
          "negative pressure room"
        ],

        patientTransport: [
          "mask patient if transport required"
        ],

        visitorGuidance: [
          "respiratory protection required"
        ],

        environmentalCleaning: [
          "airborne isolation protocol"
        ],

        duration: "disease dependent",

        clinicalPearls: [
          "Negative pressure room whenever available."
        ]
      },

      // ======================================================
      // CONTACT ENTERIC
      // ======================================================

      {
        precautionId: "PRECAUTION-CONTACT-ENTERIC",

        umkoId: "PREC-ENTERIC-0001",
        versionId: "1.0",
        status: "active",

        name: "Contact Enteric Precautions",

        category: "enteric",

        ppe: [
          "gown",
          "gloves"
        ],

        roomRequirements: [
          "private room preferred"
        ],

        patientTransport: [
          "limit transport"
        ],

        visitorGuidance: [
          "hand washing with soap and water"
        ],

        environmentalCleaning: [
          "sporicidal disinfectant",
          "bleach-based cleaning"
        ],

        duration: "organism dependent",

        clinicalPearls: [
          "Soap and water preferred for organisms like C. difficile."
        ]
      },

      // ======================================================
      // PROTECTIVE ENVIRONMENT
      // ======================================================

      {
        precautionId: "PRECAUTION-PROTECTIVE",

        umkoId: "PREC-PROTECTIVE-0001",
        versionId: "1.0",
        status: "active",

        name: "Protective Environment",

        category: "protective",

        ppe: [
          "standard PPE as indicated"
        ],

        roomRequirements: [
          "positive pressure room"
        ],

        patientTransport: [
          "mask patient if leaving room"
        ],

        visitorGuidance: [
          "restrict ill visitors"
        ],

        environmentalCleaning: [
          "protective environment protocol"
        ],

        duration: "until immunosuppression resolves",

        clinicalPearls: [
          "Designed to protect severely immunocompromised patients."
        ]
      }

    ];
  },

  find(value = "") {

    return this.entries().find(entry =>
      entry.precautionId === value ||
      entry.umkoId === value
    ) || null;

  }

};

window.AriPrecautionRegistry =
  window.Ari.medical.infectiousDisease.infectionControl.precautionRegistry;

console.log(
  "ARI PRECAUTION REGISTRY LOADED:",
  window.Ari.medical.infectiousDisease.infectionControl.precautionRegistry.version
);