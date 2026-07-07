// ari/medical/infectious-disease/infection-control/ari-reportable-disease-registry.js
// Purpose: Registry of potentially reportable infectious diseases and public-health triggers.
// V1.0.0 — Reportable Disease Registry / Advisory + Jurisdiction-Aware

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.infectionControl =
  window.Ari.medical.infectiousDisease.infectionControl || {};

window.Ari.medical.infectiousDisease.infectionControl.reportableDiseaseRegistry = {
  version: "1.0.0",

  entries() {
    return [
      {
        id: "tuberculosis_reportable",
        umkoId: "RPT-ID-TB-0001",
        versionId: "1.0",
        status: "active",

        diseaseName: "Tuberculosis",
        aliases: ["tuberculosis", "tb", "active tb", "pulmonary tb", "afb positive"],

        category: "respiratory",
        urgency: "urgent",

        reporting: {
          potentiallyReportable: true,
          jurisdictionDependent: true,
          notifyInfectionPrevention: true,
          notifyPublicHealth: true,
          immediateReportingPossible: true,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-AIRBORNE"],
          actions: [
            "ACTION-INITIATE-AIRBORNE-PRECAUTIONS",
            "ACTION-NOTIFY-INFECTION-PREVENTION",
            "ACTION-NOTIFY-PUBLIC-HEALTH"
          ]
        },

        clinicalPearls: [
          "Suspected active pulmonary TB generally requires airborne precautions.",
          "Public-health involvement is commonly required for active TB evaluation and treatment coordination."
        ],

        followUpQuestions: [
          "Is this suspected active TB or latent TB?",
          "Any cough, weight loss, night sweats, fever, or hemoptysis?",
          "Any AFB smear, NAAT, culture, or chest imaging results?"
        ],

        references: ["CDC Tuberculosis Guidance", "WHO Tuberculosis Guidelines"],
        notes: "Ari should verify local reporting requirements and notify Infection Prevention when active TB is suspected."
      },

      {
        id: "measles_reportable",
        umkoId: "RPT-ID-MEASLES-0001",
        versionId: "1.0",
        status: "active",

        diseaseName: "Measles",
        aliases: ["measles", "rubeola"],

        category: "vaccine_preventable",
        urgency: "critical",

        reporting: {
          potentiallyReportable: true,
          jurisdictionDependent: true,
          notifyInfectionPrevention: true,
          notifyPublicHealth: true,
          immediateReportingPossible: true,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-AIRBORNE"],
          actions: [
            "ACTION-INITIATE-AIRBORNE-PRECAUTIONS",
            "ACTION-NOTIFY-INFECTION-PREVENTION",
            "ACTION-NOTIFY-PUBLIC-HEALTH"
          ]
        },

        clinicalPearls: [
          "Suspected measles requires rapid isolation and exposure management.",
          "Vaccination history and exposure history are high-yield."
        ],

        followUpQuestions: [
          "Any fever, cough, conjunctivitis, runny nose, or rash?",
          "Any known exposure or recent travel?",
          "Is the patient vaccinated with MMR?"
        ],

        references: ["CDC Measles Guidance", "AAP Red Book"],
        notes: "Measles is highly transmissible and should trigger urgent infection-control review."
      },

      {
        id: "meningococcal_disease_reportable",
        umkoId: "RPT-ID-MENINGO-0001",
        versionId: "1.0",
        status: "active",

        diseaseName: "Meningococcal Disease",
        aliases: [
          "meningococcus",
          "meningococcal disease",
          "neisseria meningitidis",
          "meningococcemia"
        ],

        category: "invasive_bacterial",
        urgency: "critical",

        reporting: {
          potentiallyReportable: true,
          jurisdictionDependent: true,
          notifyInfectionPrevention: true,
          notifyPublicHealth: true,
          immediateReportingPossible: true,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-DROPLET"],
          actions: [
            "ACTION-INITIATE-DROPLET-PRECAUTIONS",
            "ACTION-NOTIFY-INFECTION-PREVENTION",
            "ACTION-NOTIFY-PUBLIC-HEALTH"
          ]
        },

        exposureManagement: {
          contactProphylaxisPossible: true,
          closeContactsImportant: true
        },

        clinicalPearls: [
          "Close contacts may require post-exposure prophylaxis.",
          "Fever with petechial or purpuric rash is a dangerous signal."
        ],

        followUpQuestions: [
          "Any fever, neck stiffness, confusion, or rash?",
          "Any close contacts, dormitory, military, school, or household exposure?",
          "Were blood or CSF cultures obtained?"
        ],

        references: ["CDC Meningococcal Disease Guidance", "IDSA Meningitis Guidelines"],
        notes: "Suspected meningococcal disease is time-sensitive and often requires public health coordination."
      },

      {
        id: "common_sti_reportable",
        umkoId: "RPT-ID-STI-0001",
        versionId: "1.0",
        status: "active",

        diseaseName: "Common Reportable STIs",
        aliases: [
          "sti",
          "std",
          "chlamydia",
          "gonorrhea",
          "syphilis",
          "hiv",
          "positive chlamydia",
          "positive gonorrhea",
          "positive syphilis",
          "positive hiv"
        ],

        category: "sexually_transmitted_infection",
        urgency: "routine_to_urgent",

        reporting: {
          potentiallyReportable: true,
          jurisdictionDependent: true,
          notifyInfectionPrevention: false,
          notifyPublicHealth: true,
          immediateReportingPossible: false,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-STANDARD"],
          actions: ["ACTION-NOTIFY-PUBLIC-HEALTH"]
        },

        exposureManagement: {
          partnerNotificationPossible: true,
          partnerTreatmentPossible: true
        },

        clinicalPearls: [
          "Chlamydia, gonorrhea, syphilis, and HIV are commonly reportable depending on jurisdiction.",
          "Partner notification, treatment, and follow-up testing may be important."
        ],

        followUpQuestions: [
          "Which STI test was positive?",
          "Any symptoms such as discharge, sores, pelvic pain, testicular pain, rash, or fever?",
          "Any pregnancy?",
          "Have partners been notified or treated?"
        ],

        references: ["CDC STI Treatment Guidelines"],
        notes: "This registry flags public-health workflow only. Detailed STI reasoning should live in the STI registry."
      },

      {
        id: "viral_hepatitis_reportable",
        umkoId: "RPT-ID-HEP-0001",
        versionId: "1.0",
        status: "active",

        diseaseName: "Viral Hepatitis",
        aliases: [
          "hepatitis a",
          "hepatitis b",
          "hepatitis c",
          "hav",
          "hbv",
          "hcv",
          "acute hepatitis"
        ],

        category: "viral_hepatitis",
        urgency: "routine_to_urgent",

        reporting: {
          potentiallyReportable: true,
          jurisdictionDependent: true,
          notifyInfectionPrevention: false,
          notifyPublicHealth: true,
          immediateReportingPossible: false,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-STANDARD"],
          actions: ["ACTION-NOTIFY-PUBLIC-HEALTH"]
        },

        exposureManagement: {
          contactProphylaxisPossible: true,
          dependsOnType: true
        },

        clinicalPearls: [
          "Acute hepatitis A is especially important for public-health exposure investigation.",
          "Hepatitis B and C reporting requirements vary by jurisdiction and case type."
        ],

        followUpQuestions: [
          "Which hepatitis type is involved?",
          "Is this acute or chronic?",
          "Any jaundice, dark urine, abdominal pain, or abnormal liver tests?",
          "Any known exposures, pregnancy, or immunocompromise?"
        ],

        references: ["CDC Viral Hepatitis Guidance", "AASLD Guidelines"],
        notes: "Ari should verify jurisdiction-specific reporting and differentiate acute versus chronic hepatitis."
      },

      {
        id: "foodborne_outbreak_reportable",
        umkoId: "RPT-ID-FOOD-0001",
        versionId: "1.0",
        status: "active",

        diseaseName: "Foodborne Illness or Outbreak Concern",
        aliases: [
          "food poisoning",
          "foodborne outbreak",
          "salmonella",
          "shigella",
          "ecoli outbreak",
          "e. coli outbreak",
          "listeria",
          "campylobacter",
          "bloody diarrhea outbreak"
        ],

        category: "foodborne",
        urgency: "same_day_to_urgent",

        reporting: {
          potentiallyReportable: true,
          jurisdictionDependent: true,
          notifyInfectionPrevention: true,
          notifyPublicHealth: true,
          immediateReportingPossible: true,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-STANDARD", "PRECAUTION-CONTACT-ENTERIC"],
          actions: [
            "ACTION-NOTIFY-INFECTION-PREVENTION",
            "ACTION-NOTIFY-PUBLIC-HEALTH"
          ]
        },

        clinicalPearls: [
          "Clusters of similar GI illness can require public-health notification.",
          "Bloody diarrhea, severe dehydration, or high-risk patients increase urgency."
        ],

        followUpQuestions: [
          "Are multiple people sick after the same food exposure?",
          "Any bloody diarrhea, fever, dehydration, or severe abdominal pain?",
          "Any stool testing performed?",
          "Any high-risk setting such as daycare, food handling, long-term care, or healthcare?"
        ],

        references: ["CDC Foodborne Outbreak Guidance"],
        notes: "Ari should treat suspected clusters and high-risk settings as public-health relevant."
      },

      {
        id: "rabies_exposure_reportable",
        umkoId: "RPT-ID-RABIES-0001",
        versionId: "1.0",
        status: "active",

        diseaseName: "Rabies Exposure Concern",
        aliases: [
          "rabies",
          "animal bite",
          "bat exposure",
          "raccoon bite",
          "skunk bite",
          "fox bite"
        ],

        category: "zoonotic",
        urgency: "urgent",

        reporting: {
          potentiallyReportable: true,
          jurisdictionDependent: true,
          notifyInfectionPrevention: false,
          notifyPublicHealth: true,
          immediateReportingPossible: true,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-STANDARD"],
          actions: ["ACTION-NOTIFY-PUBLIC-HEALTH"]
        },

        exposureManagement: {
          postExposureProphylaxisPossible: true,
          timeSensitive: true
        },

        clinicalPearls: [
          "Rabies risk depends on animal species, geography, exposure type, and availability of the animal for observation/testing.",
          "Bat exposures can be high-risk even when a bite is not clearly seen."
        ],

        followUpQuestions: [
          "What animal was involved?",
          "Was there a bite, scratch, saliva exposure, or bat exposure?",
          "Can the animal be observed or tested?",
          "Where did the exposure occur?"
        ],

        references: ["CDC Rabies Guidance"],
        notes: "Rabies exposure questions should prompt urgent local public-health or clinician review."
      }
    ];
  },

  find(value = "") {
    const clean = this.normalize(value);

    return this.entries().find(entry =>
      this.normalize(entry.id) === clean ||
      this.normalize(entry.umkoId) === clean ||
      entry.aliases?.some(alias => this.normalize(alias) === clean)
    ) || null;
  },

  search(text = "") {
    const clean = this.normalize(text);

    if (!clean) return [];

    return this.entries().filter(entry =>
      entry.aliases?.some(alias => clean.includes(this.normalize(alias))) ||
      clean.includes(this.normalize(entry.diseaseName))
    );
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

window.AriReportableDiseaseRegistry =
  window.Ari.medical.infectiousDisease.infectionControl.reportableDiseaseRegistry;

console.log(
  "ARI REPORTABLE DISEASE REGISTRY LOADED:",
  window.Ari.medical.infectiousDisease.infectionControl.reportableDiseaseRegistry.version
);