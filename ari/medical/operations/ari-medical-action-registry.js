// ari/medical/operations/ari-medical-action-registry.js
// Purpose: Universal registry of standardized clinical actions.
// V1.0.0 — Medical Action Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.operations =
  window.Ari.medical.operations || {};

window.Ari.medical.operations.actionRegistry = {
  version: "1.0.0",

  entries() {
    return [

      // ======================================================
      // Provider Communication
      // ======================================================

      {
        actionId: "ACTION-NOTIFY-PROVIDER",

        category: "communication",

        priority: "high",

        owner: [
          "RN"
        ],

        timing: "immediate",

        evidenceLevel: "standard",

        description:
          "Notify the responsible provider of significant clinical findings.",

        prerequisites: [],

        followUp: [
          "Document notification",
          "Document provider recommendations"
        ]
      },

      {
        actionId: "ACTION-NOTIFY-INFECTION-PREVENTION",

        category: "communication",

        priority: "high",

        owner: [
          "RN",
          "Provider"
        ],

        timing: "immediate",

        evidenceLevel: "guideline_based",

        description:
          "Notify Infection Prevention regarding suspected or confirmed transmissible disease.",

        prerequisites: [],

        followUp: [
          "Review isolation requirements"
        ]
      },

      {
        actionId: "ACTION-NOTIFY-PUBLIC-HEALTH",

        category: "public_health",

        priority: "high",

        owner: [
          "Provider",
          "Infection Prevention"
        ],

        timing: "per_local_requirements",

        evidenceLevel: "regulatory",

        description:
          "Notify public health authorities when legally required.",

        prerequisites: [
          "reportable_disease"
        ],

        followUp: [
          "Complete reporting documentation"
        ]
      },

      // ======================================================
      // Diagnostics
      // ======================================================

      {
        actionId: "ACTION-DRAW-BLOOD-CULTURES",

        category: "diagnostics",

        priority: "high",

        owner: [
          "RN",
          "Phlebotomy"
        ],

        timing: "before_antibiotics_when_possible",

        evidenceLevel: "high",

        description:
          "Obtain appropriate blood cultures.",

        prerequisites: [
          "suspected_bacteremia"
        ],

        followUp: [
          "Label correctly",
          "Send immediately"
        ]
      },

      {
        actionId: "ACTION-OBTAIN-LACTATE",

        category: "diagnostics",

        priority: "high",

        owner: [
          "RN"
        ],

        timing: "immediate",

        evidenceLevel: "high",

        description:
          "Obtain serum lactate when sepsis is suspected.",

        prerequisites: [
          "suspected_sepsis"
        ],

        followUp: [
          "Trend repeat lactate if indicated"
        ]
      },

      // ======================================================
      // Infection Control
      // ======================================================

      {
        actionId: "ACTION-INITIATE-CONTACT-PRECAUTIONS",

        category: "infection_control",

        priority: "high",

        owner: [
          "RN"
        ],

        timing: "immediate",

        evidenceLevel: "guideline_based",

        description:
          "Initiate contact precautions.",

        prerequisites: [],

        followUp: [
          "Place isolation signage",
          "Educate staff"
        ]
      },

      {
        actionId: "ACTION-INITIATE-DROPLET-PRECAUTIONS",

        category: "infection_control",

        priority: "high",

        owner: [
          "RN"
        ],

        timing: "immediate",

        evidenceLevel: "guideline_based",

        description:
          "Initiate droplet precautions.",

        prerequisites: [],

        followUp: [
          "Provide surgical mask",
          "Post isolation signage"
        ]
      },

      {
        actionId: "ACTION-INITIATE-AIRBORNE-PRECAUTIONS",

        category: "infection_control",

        priority: "critical",

        owner: [
          "RN"
        ],

        timing: "immediate",

        evidenceLevel: "guideline_based",

        description:
          "Initiate airborne isolation precautions.",

        prerequisites: [],

        followUp: [
          "Negative pressure room",
          "N95 respirator",
          "Notify Infection Prevention"
        ]
      },

      // ======================================================
      // Consults
      // ======================================================

      {
        actionId: "ACTION-CONSULT-INFECTIOUS-DISEASE",

        category: "consult",

        priority: "high",

        owner: [
          "Provider"
        ],

        timing: "as_soon_as_possible",

        evidenceLevel: "expert_guideline",

        description:
          "Request Infectious Disease consultation.",

        prerequisites: [],

        followUp: [
          "Review antimicrobial recommendations"
        ]
      },

      {
        actionId: "ACTION-CONSULT-CRITICAL-CARE",

        category: "consult",

        priority: "critical",

        owner: [
          "Provider"
        ],

        timing: "immediate",

        evidenceLevel: "standard",

        description:
          "Consult Critical Care for unstable patients.",

        prerequisites: [
          "critical_illness"
        ],

        followUp: [
          "Evaluate ICU transfer"
        ]
      },

      // ======================================================
      // Emergency
      // ======================================================

      {
        actionId: "ACTION-START-SEPSIS-BUNDLE",

        category: "emergency",

        priority: "critical",

        owner: [
          "RN",
          "Provider"
        ],

        timing: "immediate",

        evidenceLevel: "high",

        description:
          "Initiate institutional sepsis protocol.",

        prerequisites: [
          "suspected_sepsis"
        ],

        followUp: [
          "Blood cultures",
          "Broad-spectrum antibiotics",
          "IV fluids",
          "Lactate"
        ]
      },

      {
        actionId: "ACTION-CALL-RAPID-RESPONSE",

        category: "emergency",

        priority: "critical",

        owner: [
          "RN"
        ],

        timing: "immediate",

        evidenceLevel: "institutional",

        description:
          "Activate Rapid Response Team for clinical deterioration.",

        prerequisites: [
          "rapid_response_criteria"
        ],

        followUp: [
          "Continue bedside assessment"
        ]
      }

    ];
  },

  find(actionId = "") {
    return this.entries().find(
      action => action.actionId === actionId
    ) || null;
  }
};

window.AriMedicalActionRegistry =
  window.Ari.medical.operations.actionRegistry;

console.log(
  "ARI MEDICAL ACTION REGISTRY LOADED:",
  window.Ari.medical.operations.actionRegistry.version
);