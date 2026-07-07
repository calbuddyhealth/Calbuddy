// ari/medical/infectious-disease/infection-control/ari-post-exposure-prophylaxis-registry.js
// Purpose: Registry of common post-exposure prophylaxis (PEP) scenarios.
// V1.0.0 — Post-Exposure Prophylaxis Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.infectionControl =
  window.Ari.medical.infectiousDisease.infectionControl || {};

window.Ari.medical.infectiousDisease.infectionControl.postExposureRegistry = {

  version: "1.0.0",

  entries() {
    return [

      {
        id: "pep_hiv",
        umkoId: "PEP-HIV-0001",
        versionId: "1.0",
        status: "active",

        exposure: "HIV",

        aliases: [
          "needle stick",
          "needlestick",
          "blood exposure",
          "sexual exposure",
          "hiv exposure"
        ],

        urgency: "critical",

        evaluation: [
          "Determine exposure type",
          "Determine source patient status",
          "Assess time since exposure",
          "Review baseline HIV testing"
        ],

        recommendedActions: [
          "ACTION-NOTIFY-PROVIDER",
          "ACTION-NOTIFY-INFECTION-PREVENTION"
        ],

        followUpQuestions: [
          "When did the exposure occur?",
          "Was the source patient HIV positive?",
          "Was the exposure percutaneous, mucosal, or sexual?"
        ],

        notes:
          "HIV post-exposure prophylaxis is time-sensitive. Follow institutional protocol."
      },

      {
        id: "pep_hepatitis_b",
        umkoId: "PEP-HBV-0001",
        versionId: "1.0",
        status: "active",

        exposure: "Hepatitis B",

        aliases: [
          "hbv exposure",
          "blood exposure",
          "needle stick"
        ],

        urgency: "urgent",

        evaluation: [
          "Vaccination status",
          "HBsAb immunity",
          "Source patient HBV status"
        ],

        recommendedActions: [
          "ACTION-NOTIFY-PROVIDER"
        ],

        followUpQuestions: [
          "Has the exposed person completed the Hepatitis B vaccine series?",
          "Is immunity documented?"
        ],

        notes:
          "Need for vaccine or HBIG depends on immunity and exposure."
      },

      {
        id: "pep_rabies",
        umkoId: "PEP-RABIES-0001",
        versionId: "1.0",
        status: "active",

        exposure: "Rabies",

        aliases: [
          "dog bite",
          "bat exposure",
          "animal bite",
          "rabies exposure"
        ],

        urgency: "urgent",

        evaluation: [
          "Animal species",
          "Animal availability",
          "Geographic risk",
          "Exposure type"
        ],

        recommendedActions: [
          "ACTION-NOTIFY-PUBLIC-HEALTH"
        ],

        followUpQuestions: [
          "Can the animal be observed or tested?",
          "Was there a bite, scratch, or saliva exposure?"
        ],

        notes:
          "Rabies PEP decisions should follow public-health guidance."
      },

      {
        id: "pep_tetanus",
        umkoId: "PEP-TETANUS-0001",
        versionId: "1.0",
        status: "active",

        exposure: "Tetanus-prone wound",

        aliases: [
          "rusty nail",
          "puncture wound",
          "dirty wound"
        ],

        urgency: "routine",

        evaluation: [
          "Vaccination history",
          "Wound type",
          "Time since last tetanus vaccine"
        ],

        recommendedActions: [
          "ACTION-NOTIFY-PROVIDER"
        ],

        followUpQuestions: [
          "When was the last tetanus vaccine?",
          "How contaminated is the wound?"
        ],

        notes:
          "Need for Td/Tdap and TIG depends on wound type and vaccination history."
      },

      {
        id: "pep_meningococcal",
        umkoId: "PEP-MENINGO-0001",
        versionId: "1.0",
        status: "active",

        exposure: "Meningococcal Exposure",

        aliases: [
          "meningococcal exposure",
          "close contact meningitis"
        ],

        urgency: "urgent",

        evaluation: [
          "Determine close-contact status",
          "Exposure timing"
        ],

        recommendedActions: [
          "ACTION-NOTIFY-INFECTION-PREVENTION",
          "ACTION-NOTIFY-PUBLIC-HEALTH"
        ],

        followUpQuestions: [
          "Was the exposure household, healthcare, or intimate contact?"
        ],

        notes:
          "Close contacts may require antimicrobial prophylaxis."
      }

    ];
  },

  find(value = "") {

    const clean = String(value).toLowerCase();

    return this.entries().find(entry =>

      entry.id === value ||

      entry.umkoId === value ||

      entry.aliases.some(alias =>
        clean.includes(alias.toLowerCase())
      )

    ) || null;

  }

};

window.AriPostExposureRegistry =
  window.Ari.medical.infectiousDisease
    .infectionControl.postExposureRegistry;

console.log(
  "ARI POST EXPOSURE REGISTRY LOADED:",
  window.Ari.medical.infectiousDisease
    .infectionControl.postExposureRegistry.version
);