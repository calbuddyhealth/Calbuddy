// ari/medical/operations/ari-medical-action-registry.js
// Purpose: Universal registry of standardized clinical actions.
// V1.1.0 — Medical Action Registry / UMKO Stable IDs

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.operations =
  window.Ari.medical.operations || {};

window.Ari.medical.operations.actionRegistry = {
  version: "1.1.0",

  entries() {
    return [
      {
        actionId: "ACTION-NOTIFY-PROVIDER",
        umkoId: "ACT-COMM-NOTIFY-0001",
        versionId: "1.0",
        status: "active",
        category: "communication",
        priority: "high",
        owner: ["RN"],
        timing: "immediate",
        evidenceLevel: "standard",
        description: "Notify the responsible provider of significant clinical findings.",
        prerequisites: [],
        followUp: ["Document notification", "Document provider recommendations"]
      },

      {
        actionId: "ACTION-NOTIFY-INFECTION-PREVENTION",
        umkoId: "ACT-COMM-INFPREV-0001",
        versionId: "1.0",
        status: "active",
        category: "communication",
        priority: "high",
        owner: ["RN", "Provider"],
        timing: "immediate",
        evidenceLevel: "guideline_based",
        description: "Notify Infection Prevention regarding suspected or confirmed transmissible disease.",
        prerequisites: [],
        followUp: ["Review isolation requirements"]
      },

      {
        actionId: "ACTION-NOTIFY-PUBLIC-HEALTH",
        umkoId: "ACT-PH-NOTIFY-0001",
        versionId: "1.0",
        status: "active",
        category: "public_health",
        priority: "high",
        owner: ["Provider", "Infection Prevention"],
        timing: "per_local_requirements",
        evidenceLevel: "regulatory",
        description: "Notify public health authorities when legally required.",
        prerequisites: ["reportable_disease"],
        followUp: ["Complete reporting documentation"]
      },

      {
        actionId: "ACTION-DRAW-BLOOD-CULTURES",
        umkoId: "ACT-DX-CULTURE-0001",
        versionId: "1.0",
        status: "active",
        category: "diagnostics",
        priority: "high",
        owner: ["RN", "Phlebotomy"],
        timing: "before_antibiotics_when_possible",
        evidenceLevel: "high",
        description: "Obtain appropriate blood cultures.",
        prerequisites: ["suspected_bacteremia"],
        followUp: ["Label correctly", "Send immediately"]
      },

      {
        actionId: "ACTION-OBTAIN-LACTATE",
        umkoId: "ACT-DX-LACTATE-0001",
        versionId: "1.0",
        status: "active",
        category: "diagnostics",
        priority: "high",
        owner: ["RN"],
        timing: "immediate",
        evidenceLevel: "high",
        description: "Obtain serum lactate when sepsis is suspected.",
        prerequisites: ["suspected_sepsis"],
        followUp: ["Trend repeat lactate if indicated"]
      },

      {
        actionId: "ACTION-INITIATE-CONTACT-PRECAUTIONS",
        umkoId: "ACT-IC-CONTACT-0001",
        versionId: "1.0",
        status: "active",
        category: "infection_control",
        priority: "high",
        owner: ["RN"],
        timing: "immediate",
        evidenceLevel: "guideline_based",
        description: "Initiate contact precautions.",
        prerequisites: [],
        followUp: ["Place isolation signage", "Educate staff"]
      },

      {
        actionId: "ACTION-INITIATE-DROPLET-PRECAUTIONS",
        umkoId: "ACT-IC-DROPLET-0001",
        versionId: "1.0",
        status: "active",
        category: "infection_control",
        priority: "high",
        owner: ["RN"],
        timing: "immediate",
        evidenceLevel: "guideline_based",
        description: "Initiate droplet precautions.",
        prerequisites: [],
        followUp: ["Provide surgical mask", "Post isolation signage"]
      },

      {
        actionId: "ACTION-INITIATE-AIRBORNE-PRECAUTIONS",
        umkoId: "ACT-IC-AIRBORNE-0001",
        versionId: "1.0",
        status: "active",
        category: "infection_control",
        priority: "critical",
        owner: ["RN"],
        timing: "immediate",
        evidenceLevel: "guideline_based",
        description: "Initiate airborne isolation precautions.",
        prerequisites: [],
        followUp: ["Negative pressure room", "N95 respirator", "Notify Infection Prevention"]
      },

      {
        actionId: "ACTION-CONSULT-INFECTIOUS-DISEASE",
        umkoId: "ACT-CONSULT-ID-0001",
        versionId: "1.0",
        status: "active",
        category: "consult",
        priority: "high",
        owner: ["Provider"],
        timing: "as_soon_as_possible",
        evidenceLevel: "expert_guideline",
        description: "Request Infectious Disease consultation.",
        prerequisites: [],
        followUp: ["Review antimicrobial recommendations"]
      },

      {
        actionId: "ACTION-CONSULT-CRITICAL-CARE",
        umkoId: "ACT-CONSULT-CC-0001",
        versionId: "1.0",
        status: "active",
        category: "consult",
        priority: "critical",
        owner: ["Provider"],
        timing: "immediate",
        evidenceLevel: "standard",
        description: "Consult Critical Care for unstable patients.",
        prerequisites: ["critical_illness"],
        followUp: ["Evaluate ICU transfer"]
      },

      {
        actionId: "ACTION-START-SEPSIS-BUNDLE",
        umkoId: "ACT-EMERG-SEPSIS-0001",
        versionId: "1.0",
        status: "active",
        category: "emergency",
        priority: "critical",
        owner: ["RN", "Provider"],
        timing: "immediate",
        evidenceLevel: "high",
        description: "Initiate institutional sepsis protocol.",
        prerequisites: ["suspected_sepsis"],
        followUp: ["Blood cultures", "Broad-spectrum antibiotics", "IV fluids", "Lactate"]
      },

      {
        actionId: "ACTION-CALL-RAPID-RESPONSE",
        umkoId: "ACT-EMERG-RRT-0001",
        versionId: "1.0",
        status: "active",
        category: "emergency",
        priority: "critical",
        owner: ["RN"],
        timing: "immediate",
        evidenceLevel: "institutional",
        description: "Activate Rapid Response Team for clinical deterioration.",
        prerequisites: ["rapid_response_criteria"],
        followUp: ["Continue bedside assessment"]
      }
    ];
  },

  find(value = "") {
    return this.entries().find(
      action =>
        action.actionId === value ||
        action.umkoId === value
    ) || null;
  }
};

window.AriMedicalActionRegistry =
  window.Ari.medical.operations.actionRegistry;

console.log(
  "ARI MEDICAL ACTION REGISTRY LOADED:",
  window.Ari.medical.operations.actionRegistry.version
);