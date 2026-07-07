// ari/medical/pharmacology/registries/ari-psychiatry-medications-registry.js
// Purpose: Register high-yield psychiatry medication classes and aliases.
// V1.0.0 — Psychiatry Medication Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};

window.Ari.medical.registries.psychiatryMedications = {
  version: "1.0.0",

  register() {
    const registry = window.Ari.medical.knowledgeRegistry;

    if (!registry?.register) {
      console.warn("ARI PSYCHIATRY MEDICATION REGISTRY: knowledge registry not loaded.");
      return null;
    }

    return registry.register({
      id: "psychiatry_medications",
      version: this.version,
      domain: "pharmacology",
      category: "medication_class",
      source: "ari-psychiatry-medications-registry",
      updated: "2026-07",
      advisoryOnly: true,
      entries: this.entries()
    });
  },

  entries() {
    return [
      {
        id: "ssri",
        className: "Selective Serotonin Reuptake Inhibitors",
        aliases: [
          "ssri",
          "sertraline", "zoloft",
          "fluoxetine", "prozac",
          "escitalopram", "lexapro",
          "citalopram", "celexa",
          "paroxetine", "paxil",
          "fluvoxamine", "luvox"
        ],
        systems: ["psychiatry"],
        riskTags: ["serotonergic", "bleeding_risk", "qt_risk", "mania_risk", "withdrawal_risk"],
        interactionRisks: ["serotonergic", "bleeding_risk", "qt_risk"],
        commonEffects: [
          "nausea",
          "diarrhea",
          "headache",
          "insomnia",
          "sedation",
          "sexual dysfunction",
          "weight change",
          "anxiety"
        ],
        seriousEffects: [
          "serotonin syndrome",
          "mania",
          "suicidal thoughts",
          "hyponatremia",
          "qt prolongation"
        ],
        withdrawalEffects: [
          "dizziness",
          "brain zaps",
          "irritability",
          "flu like symptoms",
          "insomnia",
          "anxiety"
        ],
        warningSigns: [
          "suicidal thoughts",
          "mania",
          "confusion",
          "fever",
          "rigidity",
          "tremor"
        ],
        monitoring: ["mood", "sleep", "suicidal thoughts", "serotonin syndrome symptoms"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "snri",
        className: "Serotonin Norepinephrine Reuptake Inhibitors",
        aliases: [
          "snri",
          "venlafaxine", "effexor",
          "desvenlafaxine", "pristiq",
          "duloxetine", "cymbalta",
          "levomilnacipran", "fetzima"
        ],
        systems: ["psychiatry", "pain"],
        riskTags: ["serotonergic", "bleeding_risk", "bp_lowering", "bp_increasing", "mania_risk", "withdrawal_risk"],
        interactionRisks: ["serotonergic", "bleeding_risk", "bp_risk"],
        commonEffects: [
          "nausea",
          "headache",
          "insomnia",
          "sedation",
          "sweating",
          "sexual dysfunction",
          "blood pressure change"
        ],
        seriousEffects: [
          "serotonin syndrome",
          "mania",
          "suicidal thoughts",
          "hypertension",
          "hyponatremia"
        ],
        withdrawalEffects: [
          "dizziness",
          "brain zaps",
          "irritability",
          "flu like symptoms",
          "insomnia",
          "anxiety"
        ],
        warningSigns: [
          "suicidal thoughts",
          "mania",
          "confusion",
          "fever",
          "rigidity",
          "severe blood pressure change"
        ],
        monitoring: ["mood", "sleep", "blood pressure", "suicidal thoughts"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "atypical_antidepressant",
        className: "Atypical Antidepressants",
        aliases: [
          "bupropion", "wellbutrin", "zyban",
          "mirtazapine", "remeron",
          "trazodone", "desyrel",
          "vilazodone", "viibryd",
          "vortioxetine", "trintellix"
        ],
        systems: ["psychiatry"],
        riskTags: ["seizure_risk", "sedative", "serotonergic", "mania_risk", "withdrawal_risk"],
        interactionRisks: ["serotonergic", "seizure_risk", "cns_depressant"],
        commonEffects: [
          "insomnia",
          "sedation",
          "dry mouth",
          "nausea",
          "dizziness",
          "weight change",
          "headache"
        ],
        seriousEffects: [
          "seizure",
          "serotonin syndrome",
          "mania",
          "suicidal thoughts"
        ],
        withdrawalEffects: [
          "insomnia",
          "anxiety",
          "irritability",
          "flu like symptoms"
        ],
        warningSigns: [
          "seizure",
          "suicidal thoughts",
          "mania",
          "confusion",
          "fever",
          "rigidity"
        ],
        monitoring: ["mood", "sleep", "suicidal thoughts", "seizure risk"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "benzodiazepine",
        className: "Benzodiazepines",
        aliases: [
          "benzodiazepine", "benzo", "benzos",
          "lorazepam", "ativan",
          "alprazolam", "xanax",
          "clonazepam", "klonopin",
          "diazepam", "valium",
          "temazepam", "restoril",
          "chlordiazepoxide", "librium",
          "oxazepam", "serax"
        ],
        systems: ["psychiatry", "neurology"],
        riskTags: ["benzodiazepine", "sedative", "cns_depressant", "respiratory_depression_risk", "withdrawal_risk", "fall_risk"],
        interactionRisks: ["cns_depressant", "respiratory_depression", "alcohol"],
        commonEffects: [
          "sedation",
          "dizziness",
          "confusion",
          "memory problems",
          "falls",
          "slowed reaction time"
        ],
        seriousEffects: [
          "respiratory depression",
          "overdose",
          "severe confusion",
          "dependence"
        ],
        withdrawalEffects: [
          "anxiety",
          "insomnia",
          "tremor",
          "seizure",
          "agitation"
        ],
        warningSigns: [
          "slow breathing",
          "blue lips",
          "hard to wake",
          "overdose",
          "seizure",
          "severe confusion"
        ],
        monitoring: ["sedation", "falls", "breathing", "dependence", "withdrawal"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "first_generation_antipsychotic",
        className: "First-Generation Antipsychotics",
        aliases: [
          "typical antipsychotic",
          "haloperidol", "haldol",
          "chlorpromazine", "thorazine",
          "fluphenazine", "prolixin",
          "perphenazine", "trilafon",
          "loxapine",
          "thiothixene", "navane"
        ],
        systems: ["psychiatry"],
        riskTags: ["antipsychotic", "eps_risk", "qt_risk", "sedative", "anticholinergic", "nms_risk"],
        interactionRisks: ["qt_risk", "cns_depressant", "anticholinergic"],
        commonEffects: [
          "sedation",
          "eps",
          "akathisia",
          "stiff muscles",
          "dry mouth",
          "constipation",
          "dizziness"
        ],
        seriousEffects: [
          "neuroleptic malignant syndrome",
          "qt prolongation",
          "tardive dyskinesia",
          "severe dystonia"
        ],
        withdrawalEffects: [
          "insomnia",
          "nausea",
          "agitation",
          "rebound psychosis"
        ],
        warningSigns: [
          "fever",
          "rigidity",
          "confusion",
          "irregular heartbeat",
          "severe muscle stiffness"
        ],
        monitoring: ["EPS", "akathisia", "QT risk", "temperature", "rigidity"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "second_generation_antipsychotic",
        className: "Second-Generation Antipsychotics",
        aliases: [
          "atypical antipsychotic",
          "risperidone", "risperdal",
          "olanzapine", "zyprexa",
          "quetiapine", "seroquel",
          "aripiprazole", "abilify",
          "ziprasidone", "geodon",
          "lurasidone", "latuda",
          "paliperidone", "invega",
          "clozapine", "clozaril",
          "asenapine", "saphris",
          "brexpiprazole", "rexulti",
          "cariprazine", "vraylar"
        ],
        systems: ["psychiatry"],
        riskTags: ["antipsychotic", "metabolic_risk", "sedative", "qt_risk", "eps_risk", "nms_risk", "anticholinergic"],
        interactionRisks: ["qt_risk", "cns_depressant", "metabolic_risk", "anticholinergic"],
        commonEffects: [
          "sedation",
          "weight gain",
          "dizziness",
          "akathisia",
          "eps",
          "dry mouth",
          "constipation"
        ],
        seriousEffects: [
          "neuroleptic malignant syndrome",
          "metabolic syndrome",
          "diabetes",
          "qt prolongation",
          "agranulocytosis"
        ],
        withdrawalEffects: [
          "insomnia",
          "nausea",
          "agitation",
          "rebound psychosis"
        ],
        warningSigns: [
          "fever",
          "rigidity",
          "confusion",
          "irregular heartbeat",
          "severe muscle stiffness",
          "infection symptoms on clozapine"
        ],
        monitoring: ["weight", "glucose", "lipids", "EPS", "QT risk", "CBC for clozapine"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "lithium",
        className: "Lithium Mood Stabilizer",
        aliases: [
          "lithium",
          "lithobid",
          "eskalith"
        ],
        systems: ["psychiatry"],
        riskTags: ["lithium", "renal_risk", "dehydration_sensitive", "toxicity_risk", "thyroid_risk"],
        interactionRisks: ["lithium", "renal_risk", "nsaid", "ace_arb", "diuretic"],
        commonEffects: [
          "tremor",
          "increased thirst",
          "increased urination",
          "nausea",
          "diarrhea",
          "weight gain"
        ],
        seriousEffects: [
          "lithium toxicity",
          "kidney injury",
          "hypothyroidism",
          "confusion",
          "seizure"
        ],
        withdrawalEffects: [
          "mood relapse",
          "mania relapse",
          "depression relapse"
        ],
        warningSigns: [
          "vomiting",
          "diarrhea",
          "confusion",
          "tremor",
          "unsteady gait",
          "seizure"
        ],
        monitoring: ["lithium level", "creatinine", "TSH", "sodium", "hydration"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "anticonvulsant_mood_stabilizer",
        className: "Anticonvulsant Mood Stabilizers",
        aliases: [
          "valproate", "valproic acid", "depakote", "divalproex",
          "carbamazepine", "tegretol",
          "oxcarbazepine", "trileptal",
          "lamotrigine", "lamictal"
        ],
        systems: ["psychiatry", "neurology"],
        riskTags: ["mood_stabilizer", "seizure_med", "rash_risk", "hepatic_risk", "hyponatremia_risk", "teratogenic_risk"],
        interactionRisks: ["cns_depressant", "hepatic_risk", "cyp_inducer"],
        commonEffects: [
          "sedation",
          "dizziness",
          "nausea",
          "headache",
          "tremor",
          "rash"
        ],
        seriousEffects: [
          "stevens johnson syndrome",
          "liver injury",
          "pancreatitis",
          "hyponatremia",
          "birth defects"
        ],
        withdrawalEffects: [
          "seizure",
          "mood relapse",
          "mania relapse"
        ],
        warningSigns: [
          "rash",
          "skin peeling",
          "mouth sores",
          "fever",
          "severe abdominal pain",
          "jaundice",
          "confusion"
        ],
        monitoring: ["rash", "LFTs", "CBC", "sodium", "pregnancy risk", "drug levels when applicable"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "stimulant",
        className: "Stimulants",
        aliases: [
          "stimulant",
          "amphetamine", "dextroamphetamine",
          "adderall",
          "vyvanse", "lisdexamfetamine",
          "methylphenidate", "ritalin", "concerta", "focalin",
          "dexmethylphenidate",
          "modafinil", "provigil",
          "armodafinil", "nuvigil"
        ],
        systems: ["psychiatry", "neurology"],
        riskTags: ["stimulant", "activating", "bp_increasing", "anxiety_risk", "mania_risk", "appetite_loss", "insomnia_risk"],
        interactionRisks: ["stimulant", "mania_risk", "bp_risk", "anxiety_risk"],
        commonEffects: [
          "appetite loss",
          "insomnia",
          "anxiety",
          "palpitations",
          "headache",
          "dry mouth",
          "weight loss"
        ],
        seriousEffects: [
          "mania",
          "psychosis",
          "severe hypertension",
          "chest pain",
          "arrhythmia"
        ],
        withdrawalEffects: [
          "fatigue",
          "depression",
          "sleepiness",
          "increased appetite"
        ],
        warningSigns: [
          "chest pain",
          "fainting",
          "mania",
          "psychosis",
          "severe anxiety",
          "palpitations"
        ],
        monitoring: ["blood pressure", "heart rate", "sleep", "appetite", "mood", "psychosis"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "alpha2_agonist_adhd",
        className: "Alpha-2 Agonists for ADHD",
        aliases: [
          "guanfacine", "intuniv",
          "clonidine", "kapvay", "catapres"
        ],
        systems: ["psychiatry", "cardiology"],
        riskTags: ["bp_lowering", "sedative", "rebound_hypertension_risk"],
        interactionRisks: ["hypotension", "cns_depressant"],
        commonEffects: [
          "sedation",
          "dizziness",
          "low blood pressure",
          "dry mouth",
          "constipation"
        ],
        seriousEffects: [
          "fainting",
          "bradycardia",
          "rebound hypertension"
        ],
        withdrawalEffects: [
          "rebound hypertension",
          "anxiety",
          "agitation",
          "headache"
        ],
        warningSigns: [
          "fainting",
          "very slow heart rate",
          "severe dizziness",
          "severe headache after stopping"
        ],
        monitoring: ["blood pressure", "heart rate", "sedation", "missed doses"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "nonstimulant_adhd",
        className: "Non-Stimulant ADHD Medications",
        aliases: [
          "atomoxetine", "strattera",
          "viloxazine", "qelbree"
        ],
        systems: ["psychiatry"],
        riskTags: ["activating", "bp_increasing", "suicidal_thoughts_risk", "mania_risk"],
        interactionRisks: ["bp_risk", "mania_risk"],
        commonEffects: [
          "nausea",
          "appetite loss",
          "sleepiness",
          "insomnia",
          "dizziness",
          "dry mouth"
        ],
        seriousEffects: [
          "suicidal thoughts",
          "liver injury",
          "mania",
          "severe blood pressure change"
        ],
        withdrawalEffects: [
          "fatigue",
          "mood change"
        ],
        warningSigns: [
          "suicidal thoughts",
          "jaundice",
          "severe abdominal pain",
          "mania",
          "chest pain"
        ],
        monitoring: ["mood", "suicidal thoughts", "blood pressure", "heart rate", "liver symptoms"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "sedative_hypnotic",
        className: "Sedative-Hypnotics",
        aliases: [
          "zolpidem", "ambien",
          "eszopiclone", "lunesta",
          "zaleplon", "sonata",
          "ramelteon", "rozerem",
          "suvorexant", "belsomra",
          "lemborexant", "dayvigo"
        ],
        systems: ["psychiatry", "sleep"],
        riskTags: ["sleep_med", "sedative", "cns_depressant", "fall_risk"],
        interactionRisks: ["cns_depressant", "alcohol", "respiratory_depression"],
        commonEffects: [
          "sedation",
          "dizziness",
          "sleepiness",
          "confusion",
          "abnormal dreams"
        ],
        seriousEffects: [
          "complex sleep behaviors",
          "falls",
          "severe confusion",
          "respiratory depression"
        ],
        withdrawalEffects: [
          "rebound insomnia",
          "anxiety",
          "irritability"
        ],
        warningSigns: [
          "sleep walking",
          "sleep driving",
          "hard to wake",
          "slow breathing",
          "severe confusion"
        ],
        monitoring: ["sedation", "falls", "complex sleep behaviors", "alcohol use"],
        pediatricCaution: true,
        pregnancyCaution: true
      },

      {
        id: "maoi",
        className: "Monoamine Oxidase Inhibitors",
        aliases: [
          "maoi",
          "phenelzine", "nardil",
          "tranylcypromine", "parnate",
          "isocarboxazid", "marplan",
          "selegiline", "emsam"
        ],
        systems: ["psychiatry"],
        riskTags: ["maoi", "serotonergic", "hypertensive_crisis_risk", "interaction_high_risk"],
        interactionRisks: ["maoi", "serotonergic", "bp_risk"],
        commonEffects: [
          "dizziness",
          "insomnia",
          "sedation",
          "dry mouth",
          "weight gain"
        ],
        seriousEffects: [
          "serotonin syndrome",
          "hypertensive crisis",
          "severe interaction"
        ],
        withdrawalEffects: [
          "mood relapse",
          "anxiety",
          "agitation"
        ],
        warningSigns: [
          "severe headache",
          "chest pain",
          "very high blood pressure",
          "fever",
          "rigidity",
          "confusion"
        ],
        monitoring: ["blood pressure", "diet interactions", "serotonergic combinations", "medication interactions"],
        pediatricCaution: true,
        pregnancyCaution: true
      }
    ];
  }
};

window.Ari.medical.registries.psychiatryMedications.register();

window.AriPsychiatryMedicationsRegistry =
  window.Ari.medical.registries.psychiatryMedications;

console.log(
  "ARI PSYCHIATRY MEDICATIONS REGISTRY LOADED:",
  window.Ari.medical.registries.psychiatryMedications.version
);