// ari/medical/infectious-disease/organisms/bacteria/ari-pseudomonas-organisms.js
// Purpose: Register Pseudomonas organism knowledge.
// V2.1.0 — Pseudomonas Registry / UMKO Stable ID Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.organisms =
  window.Ari.medical.infectiousDisease.organisms || {};
window.Ari.medical.infectiousDisease.organisms.bacteria =
  window.Ari.medical.infectiousDisease.organisms.bacteria || {};

window.Ari.medical.infectiousDisease.organisms.bacteria.pseudomonasOrganisms = {
  version: "2.1.0",

  entries() {
    return [
      {
        id: "pseudomonas_aeruginosa",
        umkoId: "ORG-BACT-PSEUD-0001",
        versionId: "1.0",
        status: "active",

        organismName: "Pseudomonas aeruginosa",

        aliases: [
          "pseudomonas",
          "pseudomonas aeruginosa",
          "p aeruginosa"
        ],

        taxonomy: {
          kingdom: "bacteria",
          gram: "negative",
          morphology: "rod",
          oxygen: "aerobe",
          oxidase: "positive",
          non_lactose_fermenter: true
        },

        specialty: "infectious_disease",

        commonDiseases: [
          "hospital acquired pneumonia",
          "ventilator associated pneumonia",
          "catheter associated urinary tract infection",
          "wound infection",
          "burn wound infection",
          "bacteremia",
          "otitis externa",
          "malignant otitis externa",
          "neutropenic infection",
          "cystic fibrosis airway infection"
        ],

        commonSources: [
          "hospital environment",
          "water",
          "moist surfaces",
          "respiratory equipment",
          "urinary catheters",
          "burn wounds",
          "chronic wounds"
        ],

        transmission: [
          "healthcare associated",
          "environmental exposure",
          "contaminated equipment",
          "biofilm associated device colonization"
        ],

        virulenceFactors: [
          "biofilm",
          "exotoxin A",
          "elastase",
          "pyocyanin",
          "efflux pumps"
        ],

        resistancePatterns: [
          "multidrug resistance",
          "carbapenem resistance",
          "efflux mediated resistance",
          "AmpC beta lactamase",
          "porin loss"
        ],

        firstLineTherapies: [
          "cefepime",
          "piperacillin tazobactam",
          "ceftazidime",
          "meropenem",
          "ciprofloxacin",
          "culture guided therapy"
        ],

        resistantTherapies: [
          "ceftolozane tazobactam",
          "ceftazidime avibactam",
          "imipenem relebactam",
          "cefiderocol",
          "aminoglycosides",
          "culture directed therapy"
        ],

        diagnosticTests: [
          "sputum culture",
          "blood cultures",
          "urine culture",
          "wound culture",
          "susceptibility testing"
        ],

        warningSigns: [
          "sepsis",
          "hypotension",
          "worsening respiratory status",
          "neutropenic fever",
          "rapidly worsening wound infection",
          "malignant otitis externa symptoms"
        ],

        clinicalPearls: [
          "Pseudomonas requires specific antipseudomonal coverage.",
          "Not all broad-spectrum antibiotics cover Pseudomonas.",
          "Healthcare exposure, ventilators, burns, neutropenia, and cystic fibrosis increase suspicion.",
          "Biofilm makes device-associated infections harder to eradicate.",
          "Susceptibility testing is essential because resistance is common."
        ],

        reasoningHints: [
          "If pneumonia occurs after hospitalization or ventilation, increase pseudomonas probability.",
          "If neutropenic fever is present, treat pseudomonal coverage as high priority.",
          "If a burn wound infection is present, increase pseudomonas probability.",
          "If cystic fibrosis is present with chronic airway symptoms, consider chronic pseudomonal colonization or infection.",
          "Always check whether the antibiotic actually has antipseudomonal activity."
        ],

        decisionRules: [
          {
            id: "pseudomonas_antibiotic_gap",
            priority: "critical",
            when: [
              "pseudomonas",
              "non_antipseudomonal_antibiotic"
            ],
            then: [
              "flag_poor_pseudomonas_coverage",
              "recommend_culture_guided_review"
            ]
          },
          {
            id: "neutropenic_pseudomonas_risk",
            priority: "critical",
            when: [
              "neutropenia",
              "fever"
            ],
            then: [
              "increase_pseudomonas_probability",
              "increase_urgency"
            ]
          },
          {
            id: "vap_pseudomonas_risk",
            priority: "high",
            when: [
              "ventilator_associated_pneumonia"
            ],
            then: [
              "increase_pseudomonas_probability",
              "review_antipseudomonal_coverage"
            ]
          },
          {
            id: "burn_wound_pseudomonas",
            priority: "high",
            when: [
              "burn_wound",
              "wound_infection"
            ],
            then: [
              "increase_pseudomonas_probability"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive culture",
            "hospital acquired infection",
            "ventilator use",
            "neutropenia",
            "burn wound",
            "cystic fibrosis",
            "urinary catheter",
            "prior pseudomonas history"
          ],
          decreases: [
            "community acquired infection without risk factors",
            "negative cultures",
            "alternative pathogen identified"
          ]
        },

        relatedMedications: [
          "cephalosporin_antibiotics",
          "penicillin_antibiotics",
          "carbapenem_antibiotics",
          "fluoroquinolone_antibiotics",
          "aminoglycoside_antibiotics"
        ],

        relatedKnowledge: [
          "hospital_acquired_pneumonia",
          "ventilator_associated_pneumonia",
          "catheter_associated_uti",
          "burn_wound_infection",
          "neutropenic_fever",
          "cystic_fibrosis",
          "sepsis"
        ],

        followUpQuestions: [
          "Where was Pseudomonas found?",
          "Was this hospital-acquired or community-acquired?",
          "Is there a ventilator, urinary catheter, burn, wound, or implanted device?",
          "Any neutropenia or immune suppression?",
          "Any cystic fibrosis or chronic lung disease?",
          "Were susceptibility results reported?",
          "Is the current antibiotic antipseudomonal?"
        ],

        recommendedConsults: [
          "Infectious Disease",
          "Clinical Pharmacy",
          "Pulmonology when severe pneumonia or cystic fibrosis is involved"
        ],

        references: [
          "IDSA Antimicrobial Resistant Gram-Negative Guidance",
          "ATS/IDSA Hospital-Acquired and Ventilator-Associated Pneumonia Guidelines",
          "Sanford Guide",
          "Lexicomp"
        ],

        notes:
          "Pseudomonas aeruginosa is a clinically important non-fermenting gram-negative rod with high resistance potential. Ari should prioritize infection source, healthcare exposure, immune status, antipseudomonal coverage, and susceptibility testing."
      }
    ];
  }
};

window.AriPseudomonasOrganisms =
  window.Ari.medical.infectiousDisease.organisms.bacteria.pseudomonasOrganisms;

console.log(
  "ARI PSEUDOMONAS ORGANISMS LOADED:",
  window.Ari.medical.infectiousDisease.organisms.bacteria.pseudomonasOrganisms.version
);