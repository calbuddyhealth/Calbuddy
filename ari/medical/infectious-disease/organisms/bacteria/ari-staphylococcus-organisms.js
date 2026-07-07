// ari/medical/infectious-disease/organisms/bacteria/ari-staphylococcus-organisms.js
// Purpose: Register Staphylococcus organism knowledge.
// V2.0.0 — Staphylococcus Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.organisms =
  window.Ari.medical.infectiousDisease.organisms || {};
window.Ari.medical.infectiousDisease.organisms.bacteria =
  window.Ari.medical.infectiousDisease.organisms.bacteria || {};

window.Ari.medical.infectiousDisease.organisms.bacteria.staphylococcusOrganisms = {
  version: "2.0.0",

  entries() {
    return [

      {
        id: "staphylococcus_aureus",

        organismName: "Staphylococcus aureus",

        aliases: [
          "staphylococcus aureus",
          "staph aureus",
          "staph",
          "s aureus",
          "mssa",
          "mrsa"
        ],

        taxonomy: {
          kingdom: "bacteria",
          gram: "positive",
          morphology: "cocci",
          arrangement: "clusters",
          oxygen: "facultative_anaerobe",
          catalase: "positive",
          coagulase: "positive"
        },

        specialty: "infectious_disease",

        commonDiseases: [
          "cellulitis",
          "skin abscess",
          "furuncle",
          "carbuncle",
          "osteomyelitis",
          "native valve endocarditis",
          "prosthetic valve endocarditis",
          "bacteremia",
          "septic arthritis",
          "hospital acquired pneumonia",
          "necrotizing pneumonia"
        ],

        commonSources: [
          "skin",
          "soft tissue",
          "bloodstream",
          "bone",
          "joint",
          "heart valves",
          "prosthetic devices"
        ],

        transmission: [
          "direct contact",
          "skin colonization",
          "healthcare exposure",
          "contaminated equipment"
        ],

        virulenceFactors: [
          "protein A",
          "coagulase",
          "biofilm",
          "PVL toxin",
          "alpha toxin",
          "enterotoxins"
        ],

        resistancePatterns: [
          "MSSA",
          "MRSA",
          "beta lactam resistance",
          "inducible clindamycin resistance"
        ],

        firstLineTherapies: [
          "cefazolin",
          "nafcillin",
          "oxacillin"
        ],

        resistantTherapies: [
          "vancomycin",
          "daptomycin",
          "linezolid",
          "ceftaroline"
        ],

        diagnosticTests: [
          "blood cultures",
          "wound cultures",
          "gram stain",
          "PCR",
          "culture susceptibility testing",
          "echocardiography when bacteremia present"
        ],

        warningSigns: [
          "persistent fever",
          "hypotension",
          "rapidly spreading cellulitis",
          "persistent positive blood cultures",
          "new heart murmur",
          "sepsis"
        ],

        clinicalPearls: [
          "Staphylococcus aureus bacteremia should never be dismissed as contamination.",
          "Source control is often as important as antibiotic selection.",
          "Persistent bacteremia raises concern for endocarditis or another deep infection.",
          "Differentiate MSSA from MRSA because therapy changes significantly.",
          "MRSA risk factors influence empiric antibiotic selection."
        ],

        reasoningHints: [
          "Skin abscess plus previous MRSA increases MRSA probability.",
          "Positive blood cultures should increase concern for invasive disease.",
          "Evaluate prosthetic joints, vascular catheters, and implanted hardware.",
          "Persistent fever despite antibiotics should prompt search for uncontrolled source."
        ],

        decisionRules: [
          {
            id: "staph_bacteremia",
            priority: "critical",
            when: [
              "staphylococcus_aureus",
              "positive_blood_culture"
            ],
            then: [
              "increase_endocarditis_probability",
              "recommend_source_control_review",
              "recommend_echocardiography"
            ]
          },
          {
            id: "mrsa_history",
            priority: "high",
            when: [
              "mrsa_history",
              "skin_abscess"
            ],
            then: [
              "increase_mrsa_probability"
            ]
          },
          {
            id: "prosthetic_device",
            priority: "high",
            when: [
              "prosthetic_device",
              "staphylococcus_aureus"
            ],
            then: [
              "increase_biofilm_probability"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive culture",
            "gram positive cocci in clusters",
            "purulent drainage",
            "previous MRSA",
            "recent hospitalization",
            "hemodialysis"
          ],
          decreases: [
            "negative cultures",
            "alternative pathogen identified"
          ]
        },

        relatedMedications: [
          "beta_lactam_antibiotics",
          "glycopeptide_antibiotics",
          "lipopeptide_antibiotics",
          "oxazolidinone_antibiotics"
        ],

        relatedKnowledge: [
          "cellulitis",
          "skin_abscess",
          "osteomyelitis",
          "endocarditis",
          "bacteremia",
          "sepsis"
        ],

        followUpQuestions: [
          "Where is the infection located?",
          "Any previous MRSA infection or colonization?",
          "Any prosthetic joints, valves, or vascular catheters?",
          "Were blood cultures positive?",
          "Has an abscess been drained?",
          "Any persistent fever despite antibiotics?"
        ],

        references: [
          "IDSA Skin and Soft Tissue Infection Guidelines",
          "IDSA MRSA Guidelines",
          "AHA Infective Endocarditis Guidelines",
          "Sanford Guide",
          "Lexicomp"
        ],

        notes:
          "Staphylococcus aureus is among the most clinically significant bacterial pathogens. Ari should prioritize source control, bacteremia evaluation, endocarditis screening, prosthetic-device infection, and differentiation of MSSA versus MRSA."
      },

      {
        id: "staphylococcus_epidermidis",

        organismName: "Staphylococcus epidermidis",

        aliases: [
          "s epidermidis",
          "staph epidermidis",
          "coagulase negative staphylococcus",
          "cons"
        ],

        taxonomy: {
          kingdom: "bacteria",
          gram: "positive",
          morphology: "cocci",
          arrangement: "clusters",
          oxygen: "facultative_anaerobe",
          catalase: "positive",
          coagulase: "negative"
        },

        specialty: "infectious_disease",

        commonDiseases: [
          "catheter infection",
          "prosthetic joint infection",
          "prosthetic valve endocarditis",
          "device infection"
        ],

        commonSources: [
          "skin flora",
          "vascular catheters",
          "prosthetic devices"
        ],

        transmission: [
          "skin colonization",
          "device contamination"
        ],

        virulenceFactors: [
          "biofilm"
        ],

        resistancePatterns: [
          "methicillin resistance",
          "biofilm-associated resistance"
        ],

        firstLineTherapies: [
          "guided by susceptibility testing"
        ],

        resistantTherapies: [
          "vancomycin",
          "daptomycin",
          "linezolid"
        ],

        diagnosticTests: [
          "blood cultures",
          "device cultures",
          "susceptibility testing"
        ],

        warningSigns: [
          "persistent fever",
          "positive blood cultures with implanted device"
        ],

        clinicalPearls: [
          "Often a contaminant, but should not be dismissed in patients with prosthetic material.",
          "Biofilm formation makes device infections difficult to eradicate."
        ],

        reasoningHints: [
          "Interpret culture results within the clinical context.",
          "Presence of prosthetic material greatly increases significance."
        ],

        decisionRules: [
          {
            id: "cons_device",
            priority: "high",
            when: [
              "prosthetic_device",
              "staphylococcus_epidermidis"
            ],
            then: [
              "increase_device_infection_probability"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "multiple_positive_blood_cultures",
            "prosthetic_device"
          ],
          decreases: [
            "single_positive_blood_culture_without_symptoms"
          ]
        },

        relatedMedications: [
          "glycopeptide_antibiotics",
          "lipopeptide_antibiotics"
        ],

        relatedKnowledge: [
          "prosthetic_joint_infection",
          "catheter_associated_bloodstream_infection"
        ],

        followUpQuestions: [
          "Does the patient have implanted hardware?",
          "How many blood cultures were positive?",
          "Any catheter present?"
        ],

        references: [
          "IDSA Guidelines",
          "Sanford Guide",
          "Lexicomp"
        ],

        notes:
          "Clinical context is essential because S. epidermidis may represent either contamination or true device-associated infection."
      }

    ];
  }
};

window.AriStaphylococcusOrganisms =
  window.Ari.medical.infectiousDisease.organisms.bacteria.staphylococcusOrganisms;

console.log(
  "ARI STAPHYLOCOCCUS ORGANISMS LOADED:",
  window.Ari.medical.infectiousDisease.organisms.bacteria.staphylococcusOrganisms.version
);