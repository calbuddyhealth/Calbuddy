l// ari/medical/infectious-disease/antibiotics/ari-antibiotic-spectrum-registry.js
// Purpose: Define organism coverage profiles for antimicrobial agents.
// V1.1.0 — Antibiotic Spectrum Registry / Normalized Coverage Scoring

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.antibiotics =
  window.Ari.medical.infectiousDisease.antibiotics || {};

window.Ari.medical.infectiousDisease.antibiotics.spectrumRegistry = {
  version: "1.1.0",

  coverageScale: {
    0: "none",
    1: "minimal",
    2: "limited",
    3: "moderate",
    4: "good",
    5: "excellent"
  },

  entries() {
    return [
      {
        id: "ceftriaxone",
        umkoId: "ABX-SPECTRUM-CEFTRIAXONE-0001",
        versionId: "1.0",
        status: "active",

        genericName: "ceftriaxone",
        aliases: ["rocephin", "ceftriaxone"],
        drugClass: "third_generation_cephalosporin",

        spectrum: {
          gramPositive: { coverage: true, strength: 3 },
          gramNegative: { coverage: true, strength: 4 },
          anaerobes: { coverage: false, strength: 1 },
          atypicals: { coverage: false, strength: 0 },
          pseudomonas: { coverage: false, strength: 0 },
          mrsa: { coverage: false, strength: 0 },
          vre: { coverage: false, strength: 0 },
          esbl: { coverage: false, strength: 0 },
          cre: { coverage: false, strength: 0 },
          cDiff: { coverage: false, strength: 0 }
        },

        commonlyUsedFor: [
          "community acquired pneumonia",
          "gonorrhea",
          "meningitis",
          "pyelonephritis",
          "bacteremia"
        ],

        monitoring: ["MON-CBC-0001", "MON-LIVER-0001"],
        precautions: ["review allergy history"],
        references: ["IDSA", "Sanford Guide"]
      },

      {
        id: "vancomycin",
        umkoId: "ABX-SPECTRUM-VANCOMYCIN-0001",
        versionId: "1.0",
        status: "active",

        genericName: "vancomycin",
        aliases: ["vancomycin", "vanc"],
        drugClass: "glycopeptide",

        spectrum: {
          gramPositive: { coverage: true, strength: 5 },
          gramNegative: { coverage: false, strength: 0 },
          anaerobes: { coverage: true, strength: 1 },
          atypicals: { coverage: false, strength: 0 },
          pseudomonas: { coverage: false, strength: 0 },
          mrsa: { coverage: true, strength: 5 },
          vre: { coverage: false, strength: 0 },
          esbl: { coverage: false, strength: 0 },
          cre: { coverage: false, strength: 0 },
          cDiff: { coverage: true, strength: 5, routeSpecific: "oral_only" }
        },

        commonlyUsedFor: [
          "mrsa",
          "serious gram positive infections",
          "c difficile oral formulation"
        ],

        monitoring: ["MON-VANCO-0001", "MON-RENAL-0001"],
        precautions: ["dose adjustment for renal dysfunction"],
        references: ["IDSA Vancomycin Guideline"]
      },

      {
        id: "piperacillin_tazobactam",
        umkoId: "ABX-SPECTRUM-ZOSYN-0001",
        versionId: "1.0",
        status: "active",

        genericName: "piperacillin/tazobactam",
        aliases: ["zosyn", "piperacillin", "pip tazo", "piperacillin tazobactam"],
        drugClass: "extended_spectrum_penicillin",

        spectrum: {
          gramPositive: { coverage: true, strength: 4 },
          gramNegative: { coverage: true, strength: 5 },
          anaerobes: { coverage: true, strength: 5 },
          atypicals: { coverage: false, strength: 0 },
          pseudomonas: { coverage: true, strength: 4 },
          mrsa: { coverage: false, strength: 0 },
          vre: { coverage: false, strength: 0 },
          esbl: { coverage: false, strength: 1 },
          cre: { coverage: false, strength: 0 },
          cDiff: { coverage: false, strength: 0 }
        },

        commonlyUsedFor: [
          "hospital acquired pneumonia",
          "intra abdominal infection",
          "sepsis",
          "diabetic foot infection"
        ],

        monitoring: ["MON-CBC-0001", "MON-RENAL-0001"],
        precautions: ["beta lactam allergy review"],
        references: ["IDSA", "Sanford Guide"]
      },

      {
        id: "cefepime",
        umkoId: "ABX-SPECTRUM-CEFEPIME-0001",
        versionId: "1.0",
        status: "active",

        genericName: "cefepime",
        aliases: ["cefepime", "maxipime"],
        drugClass: "fourth_generation_cephalosporin",

        spectrum: {
          gramPositive: { coverage: true, strength: 4 },
          gramNegative: { coverage: true, strength: 5 },
          anaerobes: { coverage: false, strength: 0 },
          atypicals: { coverage: false, strength: 0 },
          pseudomonas: { coverage: true, strength: 4 },
          mrsa: { coverage: false, strength: 0 },
          vre: { coverage: false, strength: 0 },
          esbl: { coverage: false, strength: 1 },
          cre: { coverage: false, strength: 0 },
          cDiff: { coverage: false, strength: 0 }
        },

        commonlyUsedFor: [
          "hospital acquired pneumonia",
          "febrile neutropenia",
          "pseudomonas infections",
          "sepsis"
        ],

        monitoring: ["MON-CBC-0001", "MON-RENAL-0001"],
        precautions: ["renal dose adjustment", "monitor for neurotoxicity"],
        references: ["IDSA"]
      },

      {
        id: "meropenem",
        umkoId: "ABX-SPECTRUM-MEROPENEM-0001",
        versionId: "1.0",
        status: "active",

        genericName: "meropenem",
        aliases: ["meropenem", "merrem"],
        drugClass: "carbapenem",

        spectrum: {
          gramPositive: { coverage: true, strength: 4 },
          gramNegative: { coverage: true, strength: 5 },
          anaerobes: { coverage: true, strength: 5 },
          atypicals: { coverage: false, strength: 0 },
          pseudomonas: { coverage: true, strength: 4 },
          mrsa: { coverage: false, strength: 0 },
          vre: { coverage: false, strength: 0 },
          esbl: { coverage: true, strength: 5 },
          cre: { coverage: false, strength: 1 },
          cDiff: { coverage: false, strength: 0 }
        },

        commonlyUsedFor: [
          "esbl infections",
          "complicated intra abdominal infection",
          "sepsis",
          "meningitis"
        ],

        monitoring: ["MON-CBC-0001", "MON-RENAL-0001"],
        precautions: ["reserve for resistant organisms when appropriate"],
        references: ["IDSA"]
      }
    ];
  },

  find(value = "") {
    const clean = this.normalize(value);

    return this.entries().find(entry =>
      this.normalize(entry.id) === clean ||
      this.normalize(entry.genericName) === clean ||
      this.normalize(entry.umkoId) === clean ||
      entry.aliases.some(alias => this.normalize(alias) === clean)
    ) || null;
  },

  search(text = "") {
    const clean = this.normalize(text);

    if (!clean) return [];

    return this.entries().filter(entry =>
      clean.includes(this.normalize(entry.genericName)) ||
      entry.aliases.some(alias => clean.includes(this.normalize(alias)))
    );
  },

  hasCoverage(entry = {}, target = "", minimumStrength = 1) {
    const profile = entry.spectrum?.[target];

    return Boolean(
      profile?.coverage &&
      Number(profile.strength || 0) >= minimumStrength
    );
  },

  coverageStrength(entry = {}, target = "") {
    return Number(entry.spectrum?.[target]?.strength || 0);
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