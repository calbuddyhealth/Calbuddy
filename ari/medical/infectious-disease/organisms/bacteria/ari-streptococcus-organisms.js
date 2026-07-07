// ari/medical/infectious-disease/organisms/bacteria/ari-streptococcus-organisms.js
// Purpose: Register Streptococcus organism knowledge.
// V2.0.0 — Streptococcus Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.organisms =
  window.Ari.medical.infectiousDisease.organisms || {};
window.Ari.medical.infectiousDisease.organisms.bacteria =
  window.Ari.medical.infectiousDisease.organisms.bacteria || {};

window.Ari.medical.infectiousDisease.organisms.bacteria.streptococcusOrganisms = {
  version: "2.0.0",

  entries() {
    return [

      // --------------------------------------------------
      // Group A Streptococcus
      // --------------------------------------------------

      {
        id: "streptococcus_pyogenes",

        organismName: "Streptococcus pyogenes",

        aliases: [
          "group a strep",
          "gas",
          "strep pyogenes",
          "streptococcus pyogenes"
        ],

        taxonomy: {
          kingdom: "bacteria",
          gram: "positive",
          morphology: "cocci",
          arrangement: "chains",
          oxygen: "facultative_anaerobe",
          catalase: "negative",
          lancefield: "group_a"
        },

        specialty: "infectious_disease",

        commonDiseases: [
          "streptococcal pharyngitis",
          "scarlet fever",
          "cellulitis",
          "erysipelas",
          "necrotizing fasciitis",
          "streptococcal toxic shock syndrome",
          "impetigo",
          "acute rheumatic fever",
          "post streptococcal glomerulonephritis"
        ],

        commonSources: [
          "throat",
          "skin",
          "soft tissue"
        ],

        transmission: [
          "respiratory droplets",
          "direct contact"
        ],

        virulenceFactors: [
          "M protein",
          "streptolysin O",
          "streptolysin S",
          "pyrogenic exotoxins"
        ],

        resistancePatterns: [
          "macrolide resistance in some regions"
        ],

        firstLineTherapies: [
          "penicillin",
          "amoxicillin"
        ],

        resistantTherapies: [
          "clindamycin for toxin suppression",
          "vancomycin when indicated"
        ],

        diagnosticTests: [
          "rapid strep antigen",
          "throat culture",
          "blood cultures when invasive disease suspected"
        ],

        warningSigns: [
          "rapidly progressive pain",
          "skin discoloration",
          "hypotension",
          "toxic appearance"
        ],

        clinicalPearls: [
          "Penicillin resistance has not been documented.",
          "Necrotizing fasciitis is a surgical emergency.",
          "Clindamycin is commonly added in severe toxin-mediated disease."
        ],

        reasoningHints: [
          "Severe pain out of proportion should increase concern for necrotizing fasciitis.",
          "Recent untreated strep throat may precede rheumatic fever."
        ],

        decisionRules: [
          {
            id: "gas_nec_fasc",
            priority: "critical",
            when: [
              "group_a_strep",
              "pain_out_of_proportion"
            ],
            then: [
              "increase_necrotizing_fasciitis_probability",
              "recommend_emergency_surgical_evaluation"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive rapid strep",
            "positive throat culture",
            "group a strep exposure"
          ],
          decreases: [
            "viral symptoms only"
          ]
        },

        relatedMedications: [
          "beta_lactam_antibiotics",
          "lincosamide_antibiotics"
        ],

        relatedKnowledge: [
          "pharyngitis",
          "necrotizing_fasciitis",
          "cellulitis",
          "scarlet_fever"
        ],

        followUpQuestions: [
          "How long have symptoms been present?",
          "Any severe pain or rapidly spreading redness?",
          "Any recent sore throat?",
          "Any fever?"
        ],

        references: [
          "IDSA Pharyngitis Guidelines",
          "Sanford Guide",
          "Lexicomp"
        ],

        notes:
          "Group A Streptococcus causes illnesses ranging from pharyngitis to life-threatening invasive infections."
      },

      // --------------------------------------------------
      // Group B Streptococcus
      // --------------------------------------------------

      {
        id: "streptococcus_agalactiae",

        organismName: "Streptococcus agalactiae",

        aliases: [
          "group b strep",
          "gbs"
        ],

        taxonomy: {
          kingdom: "bacteria",
          gram: "positive",
          morphology: "cocci",
          arrangement: "chains",
          oxygen: "facultative_anaerobe",
          catalase: "negative",
          lancefield: "group_b"
        },

        specialty: "infectious_disease",

        commonDiseases: [
          "neonatal sepsis",
          "neonatal meningitis",
          "maternal infection",
          "urinary tract infection"
        ],

        commonSources: [
          "maternal genital tract"
        ],

        transmission: [
          "vertical transmission during birth"
        ],

        virulenceFactors: [
          "capsule"
        ],

        resistancePatterns: [
          "macrolide resistance"
        ],

        firstLineTherapies: [
          "penicillin",
          "ampicillin"
        ],

        resistantTherapies: [
          "vancomycin"
        ],

        diagnosticTests: [
          "prenatal screening culture",
          "blood culture"
        ],

        warningSigns: [
          "newborn fever",
          "poor feeding",
          "respiratory distress"
        ],

        clinicalPearls: [
          "Routine prenatal screening reduces neonatal disease.",
          "Intrapartum prophylaxis is standard when indicated."
        ],

        reasoningHints: [
          "Always consider pregnancy and newborn context."
        ],

        decisionRules: [
          {
            id: "gbs_pregnancy",
            priority: "high",
            when: [
              "pregnancy",
              "group_b_strep"
            ],
            then: [
              "increase_newborn_risk"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive prenatal screen"
          ],
          decreases: [
            "negative screening culture"
          ]
        },

        relatedMedications: [
          "beta_lactam_antibiotics"
        ],

        relatedKnowledge: [
          "pregnancy",
          "neonatal_sepsis"
        ],

        followUpQuestions: [
          "Is the patient pregnant?",
          "How many weeks pregnant?",
          "Was prenatal screening positive?"
        ],

        references: [
          "CDC GBS Prevention Guidelines",
          "ACOG Guidelines",
          "Lexicomp"
        ],

        notes:
          "Group B Streptococcus is especially important in obstetrics and neonatology."
      },

      // --------------------------------------------------
      // Streptococcus pneumoniae
      // --------------------------------------------------

      {
        id: "streptococcus_pneumoniae",

        organismName: "Streptococcus pneumoniae",

        aliases: [
          "pneumococcus",
          "pneumococcal"
        ],

        taxonomy: {
          kingdom: "bacteria",
          gram: "positive",
          morphology: "diplococci",
          arrangement: "pairs",
          catalase: "negative"
        },

        specialty: "infectious_disease",

        commonDiseases: [
          "community acquired pneumonia",
          "otitis media",
          "sinusitis",
          "meningitis",
          "bacteremia"
        ],

        commonSources: [
          "nasopharynx"
        ],

        transmission: [
          "respiratory droplets"
        ],

        virulenceFactors: [
          "polysaccharide capsule",
          "pneumolysin"
        ],

        resistancePatterns: [
          "penicillin resistance",
          "macrolide resistance"
        ],

        firstLineTherapies: [
          "ceftriaxone",
          "high-dose amoxicillin"
        ],

        resistantTherapies: [
          "vancomycin when indicated"
        ],

        diagnosticTests: [
          "blood cultures",
          "sputum culture",
          "urinary antigen"
        ],

        warningSigns: [
          "hypoxia",
          "confusion",
          "meningismus"
        ],

        clinicalPearls: [
          "Vaccination dramatically reduces invasive disease.",
          "Common cause of community-acquired pneumonia."
        ],

        reasoningHints: [
          "Consider meningitis with altered mental status and neck stiffness."
        ],

        decisionRules: [],

        confidenceModifiers: {
          increases: [
            "lobar infiltrate",
            "positive urinary antigen"
          ],
          decreases: [
            "viral pneumonia identified"
          ]
        },

        relatedMedications: [
          "cephalosporin_antibiotics",
          "beta_lactam_antibiotics"
        ],

        relatedKnowledge: [
          "pneumonia",
          "meningitis"
        ],

        followUpQuestions: [
          "Any cough?",
          "Any neck stiffness?",
          "Vaccinated?"
        ],

        references: [
          "IDSA CAP Guidelines",
          "CDC Pneumococcal Guidance",
          "Lexicomp"
        ],

        notes:
          "Leading bacterial cause of community-acquired pneumonia."
      },

      // --------------------------------------------------
      // Viridans Streptococci
      // --------------------------------------------------

      {
        id: "viridans_streptococci",

        organismName: "Viridans Streptococci",

        aliases: [
          "viridans strep"
        ],

        taxonomy: {
          kingdom: "bacteria",
          gram: "positive",
          morphology: "cocci",
          arrangement: "chains"
        },

        specialty: "infectious_disease",

        commonDiseases: [
          "subacute infective endocarditis",
          "dental infections"
        ],

        commonSources: [
          "oral cavity"
        ],

        transmission: [
          "endogenous flora"
        ],

        virulenceFactors: [
          "biofilm"
        ],

        resistancePatterns: [],

        firstLineTherapies: [
          "penicillin",
          "ceftriaxone"
        ],

        resistantTherapies: [
          "vancomycin"
        ],

        diagnosticTests: [
          "blood cultures",
          "echocardiography"
        ],

        warningSigns: [
          "persistent fever",
          "heart murmur"
        ],

        clinicalPearls: [
          "Often associated with dental procedures and damaged valves."
        ],

        reasoningHints: [
          "Always ask about recent dental work."
        ],

        decisionRules: [],

        confidenceModifiers: {
          increases: [
            "multiple positive blood cultures"
          ],
          decreases: []
        },

        relatedMedications: [
          "beta_lactam_antibiotics"
        ],

        relatedKnowledge: [
          "endocarditis"
        ],

        followUpQuestions: [
          "Any recent dental work?",
          "Known heart valve disease?"
        ],

        references: [
          "AHA Endocarditis Guidelines",
          "Lexicomp"
        ],

        notes:
          "Viridans streptococci are classic causes of subacute infective endocarditis."
      },

      // --------------------------------------------------
      // Streptococcus gallolyticus
      // --------------------------------------------------

      {
        id: "streptococcus_gallolyticus",

        organismName: "Streptococcus gallolyticus",

        aliases: [
          "streptococcus bovis",
          "s bovis"
        ],

        taxonomy: {
          kingdom: "bacteria",
          gram: "positive",
          morphology: "cocci"
        },

        specialty: "infectious_disease",

        commonDiseases: [
          "bacteremia",
          "infective endocarditis"
        ],

        commonSources: [
          "gastrointestinal tract"
        ],

        transmission: [
          "endogenous flora"
        ],

        virulenceFactors: [],

        resistancePatterns: [],

        firstLineTherapies: [
          "penicillin",
          "ceftriaxone"
        ],

        resistantTherapies: [
          "vancomycin"
        ],

        diagnosticTests: [
          "blood cultures",
          "echocardiography",
          "colonoscopy"
        ],

        warningSigns: [
          "persistent bacteremia",
          "new murmur"
        ],

        clinicalPearls: [
          "Strong association with colorectal neoplasia.",
          "Colonoscopy is often recommended after isolation."
        ],

        reasoningHints: [
          "Positive blood cultures should trigger consideration of colon pathology."
        ],

        decisionRules: [
          {
            id: "s_gallolyticus_colon",
            priority: "critical",
            when: [
              "streptococcus_gallolyticus"
            ],
            then: [
              "recommend_colon_evaluation"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive blood culture"
          ],
          decreases: []
        },

        relatedMedications: [
          "beta_lactam_antibiotics"
        ],

        relatedKnowledge: [
          "infective_endocarditis",
          "colorectal_cancer"
        ],

        followUpQuestions: [
          "Has a colonoscopy been performed?",
          "Any gastrointestinal symptoms?"
        ],

        references: [
          "AHA Endocarditis Guidelines",
          "Sanford Guide",
          "Lexicomp"
        ],

        notes:
          "Isolation of S. gallolyticus should prompt evaluation for underlying colorectal pathology."
      }

    ];
  }
};

window.AriStreptococcusOrganisms =
  window.Ari.medical.infectiousDisease.organisms.bacteria.streptococcusOrganisms;

console.log(
  "ARI STREPTOCOCCUS ORGANISMS LOADED:",
  window.Ari.medical.infectiousDisease.organisms.bacteria.streptococcusOrganisms.version
);