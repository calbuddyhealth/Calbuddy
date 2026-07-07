// ari/medical/infectious-disease/organisms/bacteria/ari-enterobacterales-organisms.js
// Purpose: Register Enterobacterales organism knowledge.
// V2.0.0 — Enterobacterales Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.organisms =
  window.Ari.medical.infectiousDisease.organisms || {};
window.Ari.medical.infectiousDisease.organisms.bacteria =
  window.Ari.medical.infectiousDisease.organisms.bacteria || {};

window.Ari.medical.infectiousDisease.organisms.bacteria.enterobacteralesOrganisms = {
  version: "2.0.0",

  entries() {
    return [

      {
        id: "enterobacterales",

        organismName: "Enterobacterales",

        aliases: [
          "enterobacterales",
          "enteric gram negative rods",

          "escherichia coli",
          "e coli",
          "ecoli",

          "klebsiella pneumoniae",
          "klebsiella",

          "enterobacter cloacae",
          "enterobacter",

          "proteus mirabilis",
          "proteus",

          "serratia marcescens",
          "serratia",

          "citrobacter",

          "salmonella",
          "salmonella enterica",

          "shigella",

          "yersinia",
          "yersinia enterocolitica"
        ],

        taxonomy: {
          kingdom: "bacteria",
          gram: "negative",
          morphology: "rod",
          oxygen: "facultative_anaerobe",
          family: "enterobacterales"
        },

        specialty: "infectious_disease",

        commonDiseases: [
          "urinary tract infection",
          "pyelonephritis",
          "urosepsis",
          "bacteremia",
          "community acquired pneumonia",
          "hospital acquired pneumonia",
          "intra abdominal infection",
          "diverticulitis",
          "cholangitis",
          "traveler diarrhea",
          "foodborne gastroenteritis",
          "sepsis"
        ],

        commonSources: [
          "gastrointestinal tract",
          "urinary tract",
          "biliary tract",
          "abdomen",
          "hospital environment"
        ],

        transmission: [
          "endogenous flora",
          "fecal oral",
          "foodborne",
          "healthcare associated"
        ],

        virulenceFactors: [
          "lipopolysaccharide",
          "capsule",
          "fimbriae",
          "biofilm",
          "urease in Proteus"
        ],

        resistancePatterns: [
          "ESBL",
          "AmpC",
          "carbapenemase",
          "CRE",
          "fluoroquinolone resistance",
          "multidrug resistance"
        ],

        firstLineTherapies: [
          "ceftriaxone",
          "cefepime",
          "piperacillin tazobactam",
          "culture guided therapy"
        ],

        resistantTherapies: [
          "carbapenems",
          "ceftazidime avibactam",
          "meropenem vaborbactam",
          "culture directed therapy"
        ],

        diagnosticTests: [
          "urine culture",
          "blood cultures",
          "stool culture",
          "PCR",
          "susceptibility testing"
        ],

        warningSigns: [
          "hypotension",
          "confusion",
          "persistent fever",
          "rigors",
          "septic shock"
        ],

        clinicalPearls: [
          "E. coli is the leading cause of uncomplicated urinary tract infections.",
          "Proteus commonly produces urease and is associated with struvite stones.",
          "Klebsiella often has a prominent capsule and may produce ESBL.",
          "Enterobacter species may develop AmpC-mediated resistance during therapy.",
          "CRE and ESBL organisms require careful antibiotic selection."
        ],

        reasoningHints: [
          "Always review susceptibility testing before narrowing therapy.",
          "Travel history increases suspicion for Salmonella, Shigella, and Yersinia.",
          "Hospitalization increases probability of resistant Enterobacterales.",
          "Urinary symptoms plus E. coli strongly increase uncomplicated UTI probability.",
          "Persistent bacteremia should trigger source investigation."
        ],

        decisionRules: [
          {
            id: "esbl_detected",
            priority: "critical",
            when: [
              "esbl"
            ],
            then: [
              "increase_resistant_organism_weight",
              "recommend_antibiotic_review"
            ]
          },
          {
            id: "ampc_detected",
            priority: "high",
            when: [
              "ampc"
            ],
            then: [
              "increase_beta_lactam_failure_risk"
            ]
          },
          {
            id: "cre_detected",
            priority: "critical",
            when: [
              "cre"
            ],
            then: [
              "increase_multidrug_resistance_probability",
              "recommend_infectious_disease_consult"
            ]
          },
          {
            id: "proteus_stones",
            priority: "high",
            when: [
              "proteus",
              "kidney_stone"
            ],
            then: [
              "increase_struvite_stone_probability"
            ]
          },
          {
            id: "foodborne_diarrhea",
            priority: "high",
            when: [
              "salmonella",
              "shigella",
              "yersinia"
            ],
            then: [
              "increase_foodborne_probability",
              "review_travel_and_food_history"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive urine culture",
            "positive blood culture",
            "positive stool culture",
            "recent hospitalization",
            "urinary catheter",
            "recent travel",
            "known ESBL history"
          ],
          decreases: [
            "negative cultures",
            "alternative organism identified"
          ]
        },

        relatedMedications: [
          "penicillin_antibiotics",
          "cephalosporin_antibiotics",
          "carbapenem_antibiotics",
          "fluoroquinolone_antibiotics",
          "aminoglycoside_antibiotics"
        ],

        relatedKnowledge: [
          "urinary_tract_infection",
          "pyelonephritis",
          "bacteremia",
          "sepsis",
          "gastroenteritis",
          "traveler_diarrhea",
          "esbl",
          "cre",
          "ampc"
        ],

        followUpQuestions: [
          "Where was the organism isolated?",
          "Were susceptibility results available?",
          "Any recent hospitalization?",
          "Any urinary catheter?",
          "Recent travel?",
          "Recent antibiotic use?",
          "Any kidney stones?"
        ],

        references: [
          "IDSA UTI Guidelines",
          "IDSA Antimicrobial Resistant Gram-Negative Guidance",
          "Sanford Guide",
          "CDC Foodborne Diseases",
          "Lexicomp"
        ],

        notes:
          "Enterobacterales represent the largest family of clinically important gram-negative bacteria. Ari should prioritize infection source, susceptibility testing, ESBL/AmpC/CRE resistance mechanisms, travel history, healthcare exposure, and antimicrobial stewardship."
      }

    ];
  }
};

window.AriEnterobacteralesOrganisms =
  window.Ari.medical.infectiousDisease.organisms.bacteria.enterobacteralesOrganisms;

console.log(
  "ARI ENTEROBACTERALES ORGANISMS LOADED:",
  window.Ari.medical.infectiousDisease.organisms.bacteria.enterobacteralesOrganisms.version
);