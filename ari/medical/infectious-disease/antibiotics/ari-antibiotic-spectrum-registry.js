// ari/medical/infectious-disease/antibiotics/ari-antibiotic-spectrum-registry.js
// Purpose: Define organism coverage profiles for antimicrobial agents.
// V1.0.0 — Antibiotic Spectrum Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.antibiotics =
  window.Ari.medical.infectiousDisease.antibiotics || {};

window.Ari.medical.infectiousDisease.antibiotics.spectrumRegistry = {

  version: "1.0.0",

  entries() {

    return [

      {
        id: "ceftriaxone",

        umkoId: "ABX-SPECTRUM-CEFTRIAXONE-0001",

        versionId: "1.0",

        status: "active",

        genericName: "ceftriaxone",

        aliases: [
          "rocephin",
          "ceftriaxone"
        ],

        drugClass: "third_generation_cephalosporin",

        spectrum: {

          gramPositive: "moderate",

          gramNegative: "strong",

          anaerobes: "minimal",

          atypicals: "none",

          pseudomonas: false,

          mrsa: false,

          vre: false,

          esbl: false,

          cre: false

        },

        commonlyUsedFor: [
          "community acquired pneumonia",
          "gonorrhea",
          "meningitis",
          "pyelonephritis",
          "bacteremia"
        ],

        monitoring: [
          "MON-CBC-0001",
          "MON-LIVER-0001"
        ],

        precautions: [
          "review allergy history"
        ],

        references: [
          "IDSA",
          "Sanford Guide"
        ]

      },

      {
        id: "vancomycin",

        umkoId: "ABX-SPECTRUM-VANCOMYCIN-0001",

        versionId: "1.0",

        status: "active",

        genericName: "vancomycin",

        aliases: [
          "vancomycin",
          "vanc"
        ],

        drugClass: "glycopeptide",

        spectrum: {

          gramPositive: "excellent",

          gramNegative: "none",

          anaerobes: "minimal",

          atypicals: "none",

          pseudomonas: false,

          mrsa: true,

          vre: false,

          esbl: false,

          cre: false

        },

        commonlyUsedFor: [
          "mrsa",
          "serious gram positive infections",
          "c difficile oral formulation"
        ],

        monitoring: [
          "MON-VANCOMYCIN-LEVEL",
          "MON-RENAL-0001"
        ],

        precautions: [
          "dose adjustment for renal dysfunction"
        ],

        references: [
          "IDSA Vancomycin Guideline"
        ]

      },

      {
        id: "piperacillin_tazobactam",

        umkoId: "ABX-SPECTRUM-ZOSYN-0001",

        versionId: "1.0",

        status: "active",

        genericName: "piperacillin/tazobactam",

        aliases: [
          "zosyn",
          "piperacillin",
          "pip tazo"
        ],

        drugClass: "extended_spectrum_penicillin",

        spectrum: {

          gramPositive: "good",

          gramNegative: "excellent",

          anaerobes: "excellent",

          atypicals: "none",

          pseudomonas: true,

          mrsa: false,

          vre: false,

          esbl: false,

          cre: false

        },

        commonlyUsedFor: [
          "hospital acquired pneumonia",
          "intra abdominal infection",
          "sepsis",
          "diabetic foot infection"
        ],

        monitoring: [
          "MON-CBC-0001",
          "MON-RENAL-0001"
        ],

        precautions: [
          "beta lactam allergy review"
        ],

        references: [
          "IDSA",
          "Sanford Guide"
        ]

      },

      {
        id: "cefepime",

        umkoId: "ABX-SPECTRUM-CEFEPIME-0001",

        versionId: "1.0",

        status: "active",

        genericName: "cefepime",

        aliases: [
          "cefepime",
          "maxipime"
        ],

        drugClass: "fourth_generation_cephalosporin",

        spectrum: {

          gramPositive: "good",

          gramNegative: "excellent",

          anaerobes: "poor",

          atypicals: "none",

          pseudomonas: true,

          mrsa: false,

          vre: false,

          esbl: false,

          cre: false

        },

        commonlyUsedFor: [
          "hospital acquired pneumonia",
          "febrile neutropenia",
          "pseudomonas infections",
          "sepsis"
        ],

        monitoring: [
          "MON-CBC-0001",
          "MON-RENAL-0001"
        ],

        precautions: [
          "renal dose adjustment",
          "monitor for neurotoxicity"
        ],

        references: [
          "IDSA"
        ]

      },

      {
        id: "meropenem",

        umkoId: "ABX-SPECTRUM-MEROPENEM-0001",

        versionId: "1.0",

        status: "active",

        genericName: "meropenem",

        aliases: [
          "meropenem",
          "merrem"
        ],

        drugClass: "carbapenem",

        spectrum: {

          gramPositive: "good",

          gramNegative: "excellent",

          anaerobes: "excellent",

          atypicals: "none",

          pseudomonas: true,

          mrsa: false,

          vre: false,

          esbl: true,

          cre: false

        },

        commonlyUsedFor: [
          "esbl infections",
          "complicated intra abdominal infection",
          "sepsis",
          "meningitis"
        ],

        monitoring: [
          "MON-CBC-0001",
          "MON-RENAL-0001"
        ],

        precautions: [
          "reserve for resistant organisms when appropriate"
        ],

        references: [
          "IDSA"
        ]

      }

    ];

  },

  find(value = "") {

    const clean = this.normalize(value);

    return this.entries().find(entry =>

      this.normalize(entry.id) === clean ||

      this.normalize(entry.genericName) === clean ||

      this.normalize(entry.umkoId) === clean ||

      entry.aliases.some(alias =>
        this.normalize(alias) === clean
      )

    ) || null;

  },

  search(text = "") {

    const clean = this.normalize(text);

    if (!clean) return [];

    return this.entries().filter(entry =>

      clean.includes(this.normalize(entry.genericName)) ||

      entry.aliases.some(alias =>
        clean.includes(this.normalize(alias))
      )

    );

  },

  normalize(value = "") {

    return String(value || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  }

};

window.AriAntibioticSpectrumRegistry =
  window.Ari.medical.infectiousDisease.antibiotics.spectrumRegistry;

console.log(
  "ARI ANTIBIOTIC SPECTRUM REGISTRY LOADED:",
  window.Ari.medical.infectiousDisease.antibiotics.spectrumRegistry.version
);