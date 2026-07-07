// ari/medical/infectious-disease/organisms/bacteria/ari-neisseria-haemophilus-organisms.js
// Purpose: Register Neisseria and Haemophilus organism knowledge.
// V2.1.0 — Neisseria & Haemophilus Registry / UMKO Stable ID Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.organisms =
  window.Ari.medical.infectiousDisease.organisms || {};
window.Ari.medical.infectiousDisease.organisms.bacteria =
  window.Ari.medical.infectiousDisease.organisms.bacteria || {};

window.Ari.medical.infectiousDisease.organisms.bacteria.neisseriaHaemophilusOrganisms = {
  version: "2.1.0",

  entries() {
    return [

      // ======================================================
      // Neisseria meningitidis
      // ======================================================

      {
        id: "neisseria_meningitidis",

        umkoId: "ORG-BACT-NEISS-0001",
        versionId: "1.0",
        status: "active",

        organismName: "Neisseria meningitidis",

        aliases: [
          "meningococcus",
          "n meningitidis",
          "meningococcal disease"
        ],

        taxonomy: {
          kingdom: "bacteria",
          gram: "negative",
          morphology: "diplococci",
          oxidase: "positive"
        },

        specialty: "infectious_disease",

        commonDiseases: [
          "bacterial meningitis",
          "meningococcemia",
          "septic shock"
        ],

        commonSources: [
          "nasopharynx"
        ],

        transmission: [
          "respiratory droplets",
          "close contact"
        ],

        virulenceFactors: [
          "capsule",
          "endotoxin"
        ],

        resistancePatterns: [],

        firstLineTherapies: [
          "ceftriaxone",
          "cefotaxime",
          "penicillin when susceptible"
        ],

        resistantTherapies: [
          "culture guided therapy"
        ],

        diagnosticTests: [
          "blood cultures",
          "CSF culture",
          "PCR",
          "lumbar puncture"
        ],

        warningSigns: [
          "petechial rash",
          "purpura",
          "neck stiffness",
          "altered mental status",
          "hypotension"
        ],

        clinicalPearls: [
          "Meningococcemia can deteriorate rapidly.",
          "Close contacts require post-exposure prophylaxis.",
          "Vaccination is highly effective."
        ],

        reasoningHints: [
          "Petechial rash plus fever should immediately increase meningococcal concern.",
          "Do not delay antibiotics for unstable patients."
        ],

        decisionRules: [
          {
            id: "meningococcal_emergency",
            priority: "critical",
            when: [
              "fever",
              "petechial_rash"
            ],
            then: [
              "increase_meningococcal_probability",
              "increase_emergency_priority"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive blood culture",
            "positive CSF",
            "petechial rash"
          ],
          decreases: [
            "alternative confirmed diagnosis"
          ]
        },

        relatedMedications: [
          "cephalosporin_antibiotics"
        ],

        relatedKnowledge: [
          "bacterial_meningitis",
          "sepsis",
          "septic_shock"
        ],

        followUpQuestions: [
          "Any neck stiffness?",
          "Any rash?",
          "Any close contacts with meningitis?",
          "Vaccinated?"
        ],

        recommendedConsults: [
          "Infectious Disease",
          "Critical Care"
        ],

        references: [
          "CDC Meningococcal Guidance",
          "IDSA Meningitis Guidelines",
          "Sanford Guide"
        ],

        notes:
          "Rapid recognition is critical because meningococcal disease may progress within hours."
      },

      // ======================================================
      // Neisseria gonorrhoeae
      // ======================================================

      {
        id: "neisseria_gonorrhoeae",

        umkoId: "ORG-BACT-NEISS-0002",
        versionId: "1.0",
        status: "active",

        organismName: "Neisseria gonorrhoeae",

        aliases: [
          "gonorrhea",
          "gonococcus",
          "n gonorrhoeae"
        ],

        taxonomy: {
          kingdom: "bacteria",
          gram: "negative",
          morphology: "diplococci",
          oxidase: "positive"
        },

        specialty: "infectious_disease",

        commonDiseases: [
          "urethritis",
          "cervicitis",
          "pelvic inflammatory disease",
          "epididymitis",
          "disseminated gonococcal infection"
        ],

        commonSources: [
          "genitourinary tract"
        ],

        transmission: [
          "sexual contact",
          "vertical transmission"
        ],

        virulenceFactors: [
          "pili",
          "LOS",
          "antigenic variation"
        ],

        resistancePatterns: [
          "fluoroquinolone resistance",
          "macrolide resistance"
        ],

        firstLineTherapies: [
          "ceftriaxone"
        ],

        resistantTherapies: [
          "culture guided therapy"
        ],

        diagnosticTests: [
          "NAAT",
          "culture"
        ],

        warningSigns: [
          "pelvic pain",
          "fever",
          "joint pain",
          "tenosynovitis"
        ],

        clinicalPearls: [
          "Always evaluate for chlamydia coinfection.",
          "Sexual partners require evaluation and treatment."
        ],

        reasoningHints: [
          "Sexual history changes probability substantially.",
          "Joint pain plus rash may suggest disseminated infection."
        ],

        decisionRules: [],

        confidenceModifiers: {
          increases: [
            "positive NAAT"
          ],
          decreases: [
            "negative NAAT"
          ]
        },

        relatedMedications: [
          "cephalosporin_antibiotics",
          "tetracycline_antibiotics"
        ],

        relatedKnowledge: [
          "sexually_transmitted_infection",
          "pelvic_inflammatory_disease"
        ],

        followUpQuestions: [
          "Recent sexual exposure?",
          "Any partners with symptoms?",
          "Any pelvic pain or discharge?"
        ],

        recommendedConsults: [
          "Infectious Disease when disseminated"
        ],

        references: [
          "CDC STI Guidelines",
          "Sanford Guide"
        ],

        notes:
          "NAAT is the preferred diagnostic test in most situations."
      },

      // ======================================================
      // Haemophilus influenzae
      // ======================================================

      {
        id: "haemophilus_influenzae",

        umkoId: "ORG-BACT-HAEMO-0001",
        versionId: "1.0",
        status: "active",

        organismName: "Haemophilus influenzae",

        aliases: [
          "h influenzae",
          "hib"
        ],

        taxonomy: {
          kingdom: "bacteria",
          gram: "negative",
          morphology: "coccobacillus"
        },

        specialty: "infectious_disease",

        commonDiseases: [
          "otitis media",
          "sinusitis",
          "epiglottitis",
          "pneumonia",
          "meningitis"
        ],

        commonSources: [
          "upper respiratory tract"
        ],

        transmission: [
          "respiratory droplets"
        ],

        virulenceFactors: [
          "capsule",
          "IgA protease"
        ],

        resistancePatterns: [
          "beta lactamase production"
        ],

        firstLineTherapies: [
          "ceftriaxone",
          "amoxicillin clavulanate"
        ],

        resistantTherapies: [
          "culture guided therapy"
        ],

        diagnosticTests: [
          "culture",
          "PCR"
        ],

        warningSigns: [
          "stridor",
          "drooling",
          "respiratory distress"
        ],

        clinicalPearls: [
          "Vaccination dramatically reduced invasive Hib disease.",
          "Epiglottitis requires airway assessment first."
        ],

        reasoningHints: [
          "Drooling and stridor increase concern for epiglottitis."
        ],

        decisionRules: [
          {
            id: "epiglottitis_airway",
            priority: "critical",
            when: [
              "drooling",
              "stridor"
            ],
            then: [
              "increase_airway_emergency_priority"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive culture"
          ],
          decreases: [
            "alternative diagnosis"
          ]
        },

        relatedMedications: [
          "cephalosporin_antibiotics",
          "penicillin_antibiotics"
        ],

        relatedKnowledge: [
          "epiglottitis",
          "otitis_media",
          "bacterial_meningitis"
        ],

        followUpQuestions: [
          "Vaccinated?",
          "Difficulty swallowing?",
          "Any stridor?"
        ],

        recommendedConsults: [
          "ENT",
          "Critical Care"
        ],

        references: [
          "CDC Hib Guidance",
          "IDSA Guidelines",
          "Sanford Guide"
        ],

        notes:
          "Airway management is the priority when invasive epiglottitis is suspected."
      }

    ];
  }
};

window.AriNeisseriaHaemophilusOrganisms =
  window.Ari.medical.infectiousDisease.organisms.bacteria.neisseriaHaemophilusOrganisms;

console.log(
  "ARI NEISSERIA & HAEMOPHILUS ORGANISMS LOADED:",
  window.Ari.medical.infectiousDisease.organisms.bacteria.neisseriaHaemophilusOrganisms.version
);