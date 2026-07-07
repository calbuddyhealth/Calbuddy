// ari/medical/infectious-disease/organisms/bacteria/ari-enterococcus-organisms.js
// Purpose: Register Enterococcus organism knowledge.
// V2.0.0 — Enterococcus Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.organisms =
  window.Ari.medical.infectiousDisease.organisms || {};
window.Ari.medical.infectiousDisease.organisms.bacteria =
  window.Ari.medical.infectiousDisease.organisms.bacteria || {};

window.Ari.medical.infectiousDisease.organisms.bacteria.enterococcusOrganisms = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "enterococcus_species",

        organismName: "Enterococcus Species",

        aliases: [
          "enterococcus",
          "enterococcus faecalis",
          "e faecalis",
          "enterococcus faecium",
          "e faecium",
          "vre",
          "vancomycin resistant enterococcus"
        ],

        taxonomy: {
          kingdom: "bacteria",
          gram: "positive",
          morphology: "cocci",
          arrangement: "chains_or_pairs",
          oxygen: "facultative_anaerobe",
          catalase: "negative_or_weak"
        },

        specialty: "infectious_disease",

        commonDiseases: [
          "urinary tract infection",
          "bacteremia",
          "infective endocarditis",
          "intra abdominal infection",
          "catheter associated infection",
          "wound infection"
        ],

        commonSources: [
          "gastrointestinal tract",
          "genitourinary tract",
          "urinary catheter",
          "intra abdominal source",
          "hospital environment"
        ],

        transmission: [
          "endogenous flora",
          "healthcare associated transmission",
          "contact transmission"
        ],

        virulenceFactors: [
          "biofilm",
          "adherence factors",
          "intrinsic antibiotic tolerance"
        ],

        resistancePatterns: [
          "intrinsic cephalosporin resistance",
          "ampicillin resistance especially e faecium",
          "vancomycin resistant enterococcus",
          "high level aminoglycoside resistance"
        ],

        firstLineTherapies: [
          "ampicillin when susceptible",
          "amoxicillin when susceptible",
          "culture guided therapy"
        ],

        resistantTherapies: [
          "linezolid",
          "daptomycin",
          "tigecycline in selected contexts"
        ],

        diagnosticTests: [
          "urine culture",
          "blood cultures",
          "wound culture",
          "susceptibility testing",
          "echocardiography when endocarditis suspected"
        ],

        warningSigns: [
          "persistent bacteremia",
          "new heart murmur",
          "sepsis",
          "hypotension",
          "catheter associated bloodstream infection"
        ],

        clinicalPearls: [
          "Enterococcus is intrinsically resistant to cephalosporins.",
          "E. faecalis is more often ampicillin susceptible than E. faecium.",
          "VRE changes treatment options significantly.",
          "Enterococcus bacteremia should prompt source evaluation.",
          "Endocarditis should be considered with persistent enterococcal bacteremia."
        ],

        reasoningHints: [
          "Do not assume cephalosporins cover Enterococcus.",
          "If VRE is reported, increase need for linezolid or daptomycin reasoning.",
          "If blood cultures remain positive, increase endocarditis concern.",
          "If urinary catheter is present, increase catheter-associated source probability.",
          "Always interpret Enterococcus in urine based on symptoms, catheter status, and colony count."
        ],

        decisionRules: [
          {
            id: "enterococcus_cephalosporin_gap",
            priority: "high",
            when: [
              "enterococcus",
              "cephalosporin"
            ],
            then: [
              "flag_poor_enterococcus_coverage",
              "recommend_culture_guided_review"
            ]
          },
          {
            id: "vre_detected",
            priority: "critical",
            when: [
              "vre"
            ],
            then: [
              "increase_resistant_organism_weight",
              "recommend_infectious_disease_or_pharmacy_review"
            ]
          },
          {
            id: "persistent_enterococcus_bacteremia",
            priority: "critical",
            when: [
              "enterococcus",
              "persistent_positive_blood_cultures"
            ],
            then: [
              "increase_endocarditis_probability",
              "recommend_echocardiography_review"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive urine culture with symptoms",
            "positive blood cultures",
            "known VRE history",
            "urinary catheter",
            "recent hospitalization",
            "intra abdominal source"
          ],
          decreases: [
            "asymptomatic bacteriuria",
            "single low-count urine culture without symptoms",
            "alternative pathogen identified"
          ]
        },

        relatedMedications: [
          "penicillin_antibiotics",
          "oxazolidinone_antibiotics",
          "lipopeptide_antibiotics",
          "glycopeptide_antibiotics"
        ],

        relatedKnowledge: [
          "urinary_tract_infection",
          "catheter_associated_uti",
          "infective_endocarditis",
          "bacteremia",
          "intra_abdominal_infection",
          "vre"
        ],

        followUpQuestions: [
          "Was Enterococcus found in urine, blood, wound, or another culture?",
          "Is the patient having urinary symptoms?",
          "Is there a urinary catheter?",
          "Was it reported as VRE?",
          "Were susceptibilities reported?",
          "Are blood cultures persistently positive?",
          "Any prosthetic valves or implanted devices?"
        ],

        references: [
          "IDSA Guidelines",
          "AHA Infective Endocarditis Guidelines",
          "Sanford Guide",
          "Lexicomp"
        ],

        notes:
          "Enterococcus is a common healthcare-associated pathogen. Ari should focus on source, symptoms, culture site, susceptibility, VRE status, catheter/device context, and endocarditis risk."
      }
    ];
  }
};

window.AriEnterococcusOrganisms =
  window.Ari.medical.infectiousDisease.organisms.bacteria.enterococcusOrganisms;

console.log(
  "ARI ENTEROCOCCUS ORGANISMS LOADED:",
  window.Ari.medical.infectiousDisease.organisms.bacteria.enterococcusOrganisms.version
);