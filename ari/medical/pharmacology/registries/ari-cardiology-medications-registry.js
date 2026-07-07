// ari/medical/pharmacology/registries/ari-cardiology-medications-registry.js
// Purpose: Register high-yield cardiology medication classes and aliases.
// V1.0.0 — Cardiology Medication Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};

window.Ari.medical.registries.cardiologyMedications = {
  version: "1.0.0",

  register() {
    const registry = window.Ari.medical.knowledgeRegistry;

    if (!registry?.register) {
      console.warn("ARI CARDIOLOGY MEDICATION REGISTRY: knowledge registry not loaded.");
      return null;
    }

    return registry.register({
      id: "cardiology_medications",
      version: this.version,
      domain: "pharmacology",
      category: "medication_class",
      source: "ari-cardiology-medications-registry",
      updated: "2026-07",
      advisoryOnly: true,
      entries: this.entries()
    });
  },

  entries() {
    return [
      {
        id: "ace_inhibitor",
        className: "ACE Inhibitors",
        aliases: [
          "ace inhibitor",
          "lisinopril", "zestril", "prinivil",
          "enalapril", "vasotec",
          "benazepril", "lotensin",
          "ramipril", "altace",
          "captopril", "capoten",
          "fosinopril", "monopril",
          "quinapril", "accupril"
        ],
        systems: ["cardiology", "nephrology"],
        riskTags: ["ace_arb", "bp_lowering", "renal_risk", "hyperkalemia_risk"],
        interactionRisks: ["hyperkalemia_risk", "renal_risk", "hypotension"],
        commonEffects: ["dry cough", "dizziness", "low blood pressure", "fatigue"],
        seriousEffects: ["angioedema", "kidney injury", "hyperkalemia"],
        warningSigns: ["swollen lips", "swollen tongue", "throat swelling", "trouble breathing", "fainting", "weakness", "palpitations"],
        monitoring: ["blood pressure", "potassium", "creatinine", "kidney function"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "arb",
        className: "Angiotensin Receptor Blockers",
        aliases: [
          "arb",
          "losartan", "cozaar",
          "valsartan", "diovan",
          "olmesartan", "benicar",
          "irbesartan", "avapro",
          "candesartan", "atacand",
          "telmisartan", "micardis",
          "azilsartan", "edarbi"
        ],
        systems: ["cardiology", "nephrology"],
        riskTags: ["ace_arb", "bp_lowering", "renal_risk", "hyperkalemia_risk"],
        interactionRisks: ["hyperkalemia_risk", "renal_risk", "hypotension"],
        commonEffects: ["dizziness", "low blood pressure", "fatigue"],
        seriousEffects: ["kidney injury", "hyperkalemia", "angioedema"],
        warningSigns: ["fainting", "weakness", "palpitations", "swelling", "trouble breathing"],
        monitoring: ["blood pressure", "potassium", "creatinine", "kidney function"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "beta_blocker",
        className: "Beta Blockers",
        aliases: [
          "beta blocker",
          "metoprolol", "lopressor", "toprol",
          "atenolol", "tenormin",
          "carvedilol", "coreg",
          "propranolol", "inderal",
          "bisoprolol", "zebeta",
          "nebivolol", "bystolic",
          "labetalol", "trandate",
          "nadolol", "corgard"
        ],
        systems: ["cardiology"],
        riskTags: ["bp_lowering", "heart_rate_lowering", "hypotension_risk", "bradycardia_risk"],
        interactionRisks: ["hypotension", "bradycardia", "cns_depressant"],
        commonEffects: ["fatigue", "dizziness", "low heart rate", "cold hands", "sexual dysfunction"],
        seriousEffects: ["bradycardia", "heart block", "worsening asthma symptoms", "severe hypotension"],
        withdrawalEffects: ["rebound hypertension", "chest pain", "palpitations"],
        warningSigns: ["fainting", "very slow heart rate", "trouble breathing", "chest pain", "severe dizziness"],
        monitoring: ["blood pressure", "heart rate", "dizziness", "asthma/COPD symptoms"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "calcium_channel_blocker",
        className: "Calcium Channel Blockers",
        aliases: [
          "calcium channel blocker",
          "ccb",
          "amlodipine", "norvasc",
          "nifedipine", "procardia", "adalat",
          "diltiazem", "cardizem", "tiazac",
          "verapamil", "calan", "verelan",
          "felodipine"
        ],
        systems: ["cardiology"],
        riskTags: ["bp_lowering", "heart_rate_lowering", "hypotension_risk", "edema_risk"],
        interactionRisks: ["hypotension", "bradycardia", "cyp_sensitive"],
        commonEffects: ["leg swelling", "ankle swelling", "dizziness", "flushing", "headache", "constipation"],
        seriousEffects: ["severe hypotension", "bradycardia", "heart block"],
        warningSigns: ["fainting", "very slow heart rate", "severe dizziness", "worsening swelling", "shortness of breath"],
        monitoring: ["blood pressure", "heart rate", "edema", "constipation"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "loop_diuretic",
        className: "Loop Diuretics",
        aliases: [
          "loop diuretic",
          "furosemide", "lasix",
          "bumetanide", "bumex",
          "torsemide", "demadex",
          "ethacrynic acid", "edecrin"
        ],
        systems: ["cardiology", "nephrology"],
        riskTags: ["diuretic", "dehydration_risk", "renal_risk", "electrolyte_risk", "bp_lowering"],
        interactionRisks: ["renal_risk", "hypotension", "lithium", "electrolyte_risk"],
        commonEffects: ["frequent urination", "dizziness", "dehydration", "low potassium", "muscle cramps"],
        seriousEffects: ["kidney injury", "severe dehydration", "severe electrolyte abnormality", "hearing problems"],
        warningSigns: ["fainting", "not peeing", "confusion", "severe weakness", "palpitations"],
        monitoring: ["blood pressure", "potassium", "sodium", "creatinine", "weight", "urine output"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "thiazide_diuretic",
        className: "Thiazide Diuretics",
        aliases: [
          "thiazide",
          "hydrochlorothiazide", "hctz", "microzide",
          "chlorthalidone",
          "indapamide",
          "metolazone", "zaroxolyn"
        ],
        systems: ["cardiology", "nephrology"],
        riskTags: ["diuretic", "dehydration_risk", "renal_risk", "electrolyte_risk", "bp_lowering"],
        interactionRisks: ["renal_risk", "hypotension", "lithium", "electrolyte_risk"],
        commonEffects: ["frequent urination", "dizziness", "low potassium", "increased uric acid", "increased glucose"],
        seriousEffects: ["severe electrolyte abnormality", "kidney injury", "gout flare"],
        warningSigns: ["fainting", "confusion", "severe weakness", "palpitations", "not peeing"],
        monitoring: ["blood pressure", "potassium", "sodium", "creatinine", "glucose", "uric acid"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "potassium_sparing_diuretic",
        className: "Potassium-Sparing Diuretics",
        aliases: [
          "potassium sparing diuretic",
          "spironolactone", "aldactone",
          "eplerenone", "inspra",
          "amiloride",
          "triamterene", "dyrenium"
        ],
        systems: ["cardiology", "nephrology", "endocrine"],
        riskTags: ["diuretic", "potassium_sparing", "hyperkalemia_risk", "renal_risk", "bp_lowering"],
        interactionRisks: ["hyperkalemia_risk", "renal_risk", "ace_arb"],
        commonEffects: ["dizziness", "breast tenderness", "frequent urination", "menstrual changes"],
        seriousEffects: ["hyperkalemia", "kidney injury", "severe hypotension"],
        warningSigns: ["weakness", "palpitations", "fainting", "confusion", "not peeing"],
        monitoring: ["potassium", "creatinine", "blood pressure", "kidney function"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "statin",
        className: "Statins",
        aliases: [
          "statin",
          "atorvastatin", "lipitor",
          "rosuvastatin", "crestor",
          "simvastatin", "zocor",
          "pravastatin", "pravachol",
          "lovastatin", "mevacor",
          "pitavastatin", "livalo",
          "fluvastatin", "lescol"
        ],
        systems: ["cardiology", "endocrine"],
        riskTags: ["lipid_lowering", "hepatic_risk", "muscle_injury_risk", "cyp_sensitive"],
        interactionRisks: ["cyp_sensitive", "hepatic_risk", "muscle_injury_risk"],
        commonEffects: ["muscle aches", "headache", "nausea"],
        seriousEffects: ["rhabdomyolysis", "liver injury"],
        warningSigns: ["severe muscle pain", "dark urine", "weakness", "jaundice", "severe abdominal pain"],
        monitoring: ["muscle symptoms", "liver symptoms", "lipid panel", "CK if severe muscle symptoms"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "antiplatelet",
        className: "Antiplatelet Medications",
        aliases: [
          "antiplatelet",
          "aspirin",
          "asa",
          "clopidogrel", "plavix",
          "prasugrel", "effient",
          "ticagrelor", "brilinta",
          "dipyridamole",
          "aggrenox"
        ],
        systems: ["cardiology", "neurology"],
        riskTags: ["antiplatelet", "bleeding_risk"],
        interactionRisks: ["bleeding_risk", "nsaid", "anticoagulant"],
        commonEffects: ["bruising", "nosebleeds", "stomach upset"],
        seriousEffects: ["serious bleeding", "GI bleeding", "intracranial bleeding"],
        warningSigns: ["black stool", "blood in stool", "vomiting blood", "severe headache", "uncontrolled bleeding", "easy bruising"],
        monitoring: ["bleeding", "bruising", "stool color", "fall/head injury risk"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "anticoagulant",
        className: "Anticoagulants",
        aliases: [
          "anticoagulant",
          "blood thinner",
          "warfarin", "coumadin",
          "apixaban", "eliquis",
          "rivaroxaban", "xarelto",
          "dabigatran", "pradaxa",
          "edoxaban", "savaysa",
          "heparin",
          "enoxaparin", "lovenox"
        ],
        systems: ["cardiology", "hematology", "neurology"],
        riskTags: ["anticoagulant", "bleeding_risk"],
        interactionRisks: ["bleeding_risk", "nsaid", "antiplatelet"],
        commonEffects: ["bruising", "nosebleeds", "bleeding gums"],
        seriousEffects: ["serious bleeding", "GI bleeding", "intracranial bleeding"],
        warningSigns: ["black stool", "blood in stool", "vomiting blood", "severe headache", "head injury", "uncontrolled bleeding", "weakness"],
        monitoring: ["bleeding", "bruising", "INR for warfarin", "kidney function for DOACs", "fall/head injury risk"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "nitrate",
        className: "Nitrates",
        aliases: [
          "nitrate",
          "nitroglycerin", "nitrostat", "nitro",
          "isosorbide mononitrate", "imdur",
          "isosorbide dinitrate", "isordil"
        ],
        systems: ["cardiology"],
        riskTags: ["vasodilator", "bp_lowering", "hypotension_risk"],
        interactionRisks: ["hypotension", "pde5_inhibitor"],
        commonEffects: ["headache", "dizziness", "flushing", "low blood pressure"],
        seriousEffects: ["severe hypotension", "fainting"],
        warningSigns: ["fainting", "severe dizziness", "chest pain not relieved", "severe weakness"],
        monitoring: ["blood pressure", "chest pain response", "dizziness", "PDE5 inhibitor use"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "antiarrhythmic",
        className: "Antiarrhythmics",
        aliases: [
          "antiarrhythmic",
          "amiodarone", "cordarone", "pacerone",
          "sotalol", "betapace",
          "flecainide", "tambocor",
          "propafenone", "rythmol",
          "dofetilide", "tikosyn",
          "dronedarone", "multaq"
        ],
        systems: ["cardiology"],
        riskTags: ["qt_risk", "bradycardia_risk", "heart_rhythm_med", "cyp_sensitive"],
        interactionRisks: ["qt_risk", "bradycardia", "cyp_sensitive"],
        commonEffects: ["dizziness", "fatigue", "nausea", "low heart rate"],
        seriousEffects: ["dangerous arrhythmia", "qt prolongation", "bradycardia", "thyroid problems", "lung toxicity", "liver injury"],
        warningSigns: ["fainting", "palpitations", "irregular heartbeat", "shortness of breath", "severe dizziness"],
        monitoring: ["ECG", "heart rate", "QT interval", "thyroid", "liver function", "pulmonary symptoms for amiodarone"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "heart_failure_medication",
        className: "Heart Failure Medications",
        aliases: [
          "heart failure medication",
          "sacubitril valsartan", "entresto",
          "digoxin", "lanoxin",
          "ivabradine", "corlanor",
          "hydralazine",
          "isosorbide dinitrate",
          "vericiguat", "verquvo"
        ],
        systems: ["cardiology"],
        riskTags: ["heart_failure_med", "bp_lowering", "renal_risk", "bradycardia_risk", "toxicity_risk"],
        interactionRisks: ["hypotension", "renal_risk", "bradycardia", "digoxin_toxicity"],
        commonEffects: ["dizziness", "low blood pressure", "fatigue", "nausea"],
        seriousEffects: ["kidney injury", "hyperkalemia", "digoxin toxicity", "bradycardia", "severe hypotension"],
        warningSigns: ["fainting", "confusion", "vision changes", "nausea vomiting", "irregular heartbeat", "severe dizziness"],
        monitoring: ["blood pressure", "heart rate", "creatinine", "potassium", "digoxin level when applicable"],
        pediatricCaution: true,
        pregnancyCaution: true
      }
    ];
  }
};

window.Ari.medical.registries.cardiologyMedications.register();

window.AriCardiologyMedicationsRegistry =
  window.Ari.medical.registries.cardiologyMedications;

console.log(
  "ARI CARDIOLOGY MEDICATIONS REGISTRY LOADED:",
  window.Ari.medical.registries.cardiologyMedications.version
);