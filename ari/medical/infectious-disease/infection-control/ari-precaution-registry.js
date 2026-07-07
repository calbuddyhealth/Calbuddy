// ari/medical/infectious-disease/infection-control/ari-precaution-registry.js
// Purpose: Universal registry of infection control precautions.
// V1.1.0 — Precaution Registry / UMKO Stable IDs + Room/Reporting Metadata

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.infectionControl =
  window.Ari.medical.infectiousDisease.infectionControl || {};

window.Ari.medical.infectiousDisease.infectionControl.precautionRegistry = {
  version: "1.1.0",

  entries() {
    return [
      {
        precautionId: "PRECAUTION-STANDARD",
        umkoId: "PREC-STANDARD-0001",
        versionId: "1.0",
        status: "active",

        name: "Standard Precautions",
        category: "standard",

        ppe: ["hand hygiene", "gloves when indicated", "eye protection if splash risk"],
        roomRequirements: ["standard room"],
        roomFeatures: {
          negativePressure: false,
          positivePressure: false,
          dedicatedBathroom: false,
          dedicatedEquipment: false
        },

        patientTransport: ["no routine restrictions"],
        visitorGuidance: ["standard precautions"],
        environmentalCleaning: ["routine hospital cleaning"],

        reporting: {
          notifyInfectionPrevention: false,
          notifyEmployeeHealth: false,
          notifyPublicHealth: false
        },

        duration: "entire admission",
        clinicalPearls: ["Apply to every patient."]
      },

      {
        precautionId: "PRECAUTION-CONTACT",
        umkoId: "PREC-CONTACT-0001",
        versionId: "1.0",
        status: "active",

        name: "Contact Precautions",
        category: "contact",

        ppe: ["gown", "gloves"],
        roomRequirements: ["private room when available"],
        roomFeatures: {
          negativePressure: false,
          positivePressure: false,
          dedicatedBathroom: false,
          dedicatedEquipment: true
        },

        patientTransport: ["limit transport when possible"],
        visitorGuidance: ["gown and gloves when appropriate"],
        environmentalCleaning: ["enhanced environmental cleaning"],

        reporting: {
          notifyInfectionPrevention: true,
          notifyEmployeeHealth: false,
          notifyPublicHealth: false
        },

        duration: "organism dependent",
        clinicalPearls: ["Dedicated equipment when feasible."]
      },

      {
        precautionId: "PRECAUTION-DROPLET",
        umkoId: "PREC-DROPLET-0001",
        versionId: "1.0",
        status: "active",

        name: "Droplet Precautions",
        category: "droplet",

        ppe: ["surgical mask"],
        roomRequirements: ["private room preferred"],
        roomFeatures: {
          negativePressure: false,
          positivePressure: false,
          dedicatedBathroom: false,
          dedicatedEquipment: false
        },

        patientTransport: ["patient wears surgical mask"],
        visitorGuidance: ["mask during visitation"],
        environmentalCleaning: ["routine cleaning"],

        reporting: {
          notifyInfectionPrevention: true,
          notifyEmployeeHealth: false,
          notifyPublicHealth: false
        },

        duration: "disease dependent",
        clinicalPearls: ["Mask patient during transport."]
      },

      {
        precautionId: "PRECAUTION-AIRBORNE",
        umkoId: "PREC-AIRBORNE-0001",
        versionId: "1.0",
        status: "active",

        name: "Airborne Precautions",
        category: "airborne",

        ppe: ["fit-tested N95 respirator"],
        roomRequirements: ["negative pressure room"],
        roomFeatures: {
          negativePressure: true,
          positivePressure: false,
          dedicatedBathroom: false,
          dedicatedEquipment: false
        },

        patientTransport: ["mask patient if transport required"],
        visitorGuidance: ["respiratory protection required"],
        environmentalCleaning: ["airborne isolation protocol"],

        reporting: {
          notifyInfectionPrevention: true,
          notifyEmployeeHealth: true,
          notifyPublicHealth: true
        },

        duration: "disease dependent",
        clinicalPearls: ["Negative pressure room whenever available."]
      },

      {
        precautionId: "PRECAUTION-CONTACT-ENTERIC",
        umkoId: "PREC-ENTERIC-0001",
        versionId: "1.0",
        status: "active",

        name: "Contact Enteric Precautions",
        category: "enteric",

        ppe: ["gown", "gloves"],
        roomRequirements: ["private room preferred"],
        roomFeatures: {
          negativePressure: false,
          positivePressure: false,
          dedicatedBathroom: true,
          dedicatedEquipment: true
        },

        patientTransport: ["limit transport"],
        visitorGuidance: ["hand washing with soap and water"],
        environmentalCleaning: ["sporicidal disinfectant", "bleach-based cleaning"],

        reporting: {
          notifyInfectionPrevention: true,
          notifyEmployeeHealth: false,
          notifyPublicHealth: false
        },

        duration: "organism dependent",
        clinicalPearls: ["Soap and water preferred for organisms like C. difficile."]
      },

      {
        precautionId: "PRECAUTION-PROTECTIVE",
        umkoId: "PREC-PROTECTIVE-0001",
        versionId: "1.0",
        status: "active",

        name: "Protective Environment",
        category: "protective",

        ppe: ["standard PPE as indicated"],
        roomRequirements: ["positive pressure room"],
        roomFeatures: {
          negativePressure: false,
          positivePressure: true,
          dedicatedBathroom: false,
          dedicatedEquipment: false
        },

        patientTransport: ["mask patient if leaving room"],
        visitorGuidance: ["restrict ill visitors"],
        environmentalCleaning: ["protective environment protocol"],

        reporting: {
          notifyInfectionPrevention: true,
          notifyEmployeeHealth: false,
          notifyPublicHealth: false
        },

        duration: "until immunosuppression resolves",
        clinicalPearls: ["Designed to protect severely immunocompromised patients."]
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