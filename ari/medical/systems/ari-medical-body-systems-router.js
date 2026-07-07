// ari/medical/systems/ari-medical-body-systems-router.js
// Purpose: Route medical questions to likely body-system knowledge files without diagnosing.
// V1.0.0 — Body System Router / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.bodySystemsRouter = {
  version: "1.0.0",

  route(input = {}) {
    const summary = input.summary || input || {};

    const text = window.Ari.medical.utils.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const pattern =
      summary.medicalSymptomPattern?.primaryPattern ||
      summary.symptomPatternPacket?.primaryPattern ||
      null;

    const systems = this.detectSystems(text, pattern);
    const primarySystem = systems[0] || null;

    return window.Ari.medical.contract.create({
      engine: "ari-medical-body-systems-router",
      version: this.version,
      activated: systems.length > 0,
      confidence: primarySystem?.confidence || "low",
      urgency: pattern?.urgency || "routine",
      primarySystem,
      systems,
      findings: systems,
      reasoning:
        primarySystem?.reason ||
        "No specific body-system route was strong enough from the available message.",
      nextStep:
        primarySystem?.nextStep ||
        "Use broad symptom mapping first, then route to the best matching body system.",
      responsePosture: {
        label: "body_system_routing",
        advisoryOnly: true,
        canUseMultipleSystems: true,
        avoidSingleCauseLockIn: true
      }
    });
  },

  detectSystems(text = "", pattern = null) {
    const routes = [
      this.routeCardiology(text, pattern),
      this.routePulmonology(text, pattern),
      this.routeNeurology(text, pattern),
      this.routeGastroenterology(text, pattern),
      this.routeUrology(text, pattern),
      this.routeRenal(text, pattern),
      this.routeEndocrine(text, pattern),
      this.routeHematology(text, pattern),
      this.routeInfectiousDisease(text, pattern),
      this.routeMusculoskeletal(text, pattern),
      this.routeDermatology(text, pattern),
      this.routeENT(text, pattern),
      this.routeOBGYN(text, pattern),
      this.routePediatrics(text, pattern),
      this.routePsychiatry(text, pattern),
      this.routePharmacology(text, pattern)
    ].filter(Boolean);

    return routes.sort((a, b) => this.scoreRank(b) - this.scoreRank(a));
  },

  routeCardiology(text = "", pattern = null) {
    const hits = this.collect(text, [
      "chest pain",
      "palpitations",
      "heart",
      "edema",
      "leg swelling",
      "jvd",
      "jugular vein",
      "syncope",
      "fainting",
      "shortness of breath lying flat",
      "orthopnea"
    ]);

    if (pattern?.system === "cardiovascular_respiratory") hits.push("cardiopulmonary_pattern");

    return this.routeIfHits({
      id: "cardiology",
      label: "Cardiology",
      file: "ari/medical/systems/ari-medical-cardiology-engine.js",
      hits,
      reason:
        "Heart-related symptoms may involve circulation, rhythm, fluid overload, chest pain, or reduced cardiac output.",
      nextStep:
        "Check emergency red flags, then connect symptoms to circulation, rhythm, fluid status, and exertional tolerance."
    });
  },

  routePulmonology(text = "", pattern = null) {
    const hits = this.collect(text, [
      "shortness of breath",
      "sob",
      "wheezing",
      "cough",
      "coughing blood",
      "chest tightness",
      "low oxygen",
      "blue lips",
      "pleuritic pain"
    ]);

    if (pattern?.system === "cardiovascular_respiratory") hits.push("cardiopulmonary_pattern");

    return this.routeIfHits({
      id: "pulmonology",
      label: "Pulmonology",
      file: "ari/medical/systems/ari-medical-pulmonology-engine.js",
      hits,
      reason:
        "Breathing symptoms may involve airway, lung tissue, oxygenation, infection, clot risk, or heart-lung interaction.",
      nextStep:
        "Assess breathing effort, oxygen concerns, chest pain, cough, fever, wheeze, and clot/heart red flags."
    });
  },

  routeNeurology(text = "", pattern = null) {
    const hits = this.collect(text, [
      "weakness",
      "numbness",
      "facial droop",
      "slurred speech",
      "seizure",
      "confusion",
      "headache",
      "vision loss",
      "dizziness",
      "loss of balance"
    ]);

    if (pattern?.system === "neurology") hits.push("neurologic_pattern");

    return this.routeIfHits({
      id: "neurology",
      label: "Neurology",
      file: "ari/medical/systems/ari-medical-neurology-engine.js",
      hits,
      reason:
        "Neurologic symptoms need fast separation of stroke-like, seizure, migraine, trauma, metabolic, and medication causes.",
      nextStep:
        "Clarify onset, new deficits, mental status, seizure activity, trauma, headache severity, and medication/substance factors."
    });
  },

  routeGastroenterology(text = "", pattern = null) {
    const hits = this.collect(text, [
      "abdominal pain",
      "stomach pain",
      "nausea",
      "vomiting",
      "diarrhea",
      "constipation",
      "blood in stool",
      "black stool",
      "jaundice",
      "heartburn"
    ]);

    if (pattern?.system === "gastrointestinal") hits.push("gi_pattern");

    return this.routeIfHits({
      id: "gastroenterology",
      label: "Gastroenterology",
      file: "ari/medical/systems/ari-medical-gastroenterology-engine.js",
      hits,
      reason:
        "GI symptoms need localization, bleeding/dehydration screening, infection pattern review, and medication/diet context.",
      nextStep:
        "Ask location, duration, stool/vomit changes, fever, hydration, pregnancy status if relevant, and severity."
    });
  },

  routeUrology(text = "", pattern = null) {
    const hits = this.collect(text, [
      "burning when peeing",
      "painful urination",
      "blood in urine",
      "testicle pain",
      "pelvic pain",
      "urinary retention",
      "can't pee",
      "frequent urination"
    ]);

    if (pattern?.system === "urology_genitourinary") hits.push("gu_pattern");

    return this.routeIfHits({
      id: "urology",
      label: "Urology / GU",
      file: "ari/medical/systems/ari-medical-urology-engine.js",
      hits,
      reason:
        "Urinary and reproductive symptoms need separation of infection, obstruction, stones, torsion, prostate, pelvic, and STI-related patterns.",
      nextStep:
        "Ask urinary symptoms, flank pain, fever, testicular pain, pelvic pain, discharge, pregnancy status if relevant, and ability to urinate."
    });
  },

  routeRenal(text = "", pattern = null) {
    const hits = this.collect(text, [
      "kidney",
      "flank pain",
      "decreased urine",
      "no urine",
      "swelling",
      "edema",
      "high potassium",
      "creatinine",
      "bun",
      "protein in urine"
    ]);

    return this.routeIfHits({
      id: "renal",
      label: "Renal",
      file: "ari/medical/systems/ari-medical-renal-engine.js",
      hits,
      reason:
        "Kidney patterns may involve fluid balance, urine output, electrolytes, blood pressure, infection, stones, or renal injury.",
      nextStep:
        "Ask urine output, swelling, flank pain, fever, blood pressure, kidney history, meds, and relevant labs."
    });
  },

  routeEndocrine(text = "", pattern = null) {
    const hits = this.collect(text, [
      "blood sugar",
      "glucose",
      "diabetes",
      "thyroid",
      "weight loss",
      "weight gain",
      "excessive thirst",
      "peeing a lot",
      "heat intolerance",
      "cold intolerance"
    ]);

    return this.routeIfHits({
      id: "endocrine",
      label: "Endocrine",
      file: "ari/medical/systems/ari-medical-endocrine-engine.js",
      hits,
      reason:
        "Endocrine symptoms often overlap with mood, energy, weight, heart rate, temperature tolerance, and metabolism.",
      nextStep:
        "Ask timing, weight/appetite changes, thirst/urination, heart rate symptoms, temperature intolerance, meds, and labs."
    });
  },

  routeHematology(text = "", pattern = null) {
    const hits = this.collect(text, [
      "anemia",
      "bleeding",
      "bruising",
      "clot",
      "dvt",
      "platelets",
      "low hemoglobin",
      "high wbc",
      "low wbc",
      "neutropenia"
    ]);

    return this.routeIfHits({
      id: "hematology",
      label: "Hematology",
      file: "ari/medical/systems/ari-medical-hematology-engine.js",
      hits,
      reason:
        "Blood-related patterns can involve anemia, clotting, bleeding risk, infection risk, or abnormal cell counts.",
      nextStep:
        "Ask bleeding/clot symptoms, fatigue, infection signs, meds, cancer history if relevant, and CBC/coagulation results."
    });
  },

  routeInfectiousDisease(text = "", pattern = null) {
    const hits = this.collect(text, [
      "fever",
      "chills",
      "infection",
      "pus",
      "wound",
      "rash",
      "stiff neck",
      "sepsis",
      "antibiotics",
      "covid",
      "flu"
    ]);

    if (pattern?.system === "infectious_disease") hits.push("infection_pattern");

    return this.routeIfHits({
      id: "infectious_disease",
      label: "Infectious Disease",
      file: "ari/medical/systems/ari-medical-infectious-disease-engine.js",
      hits,
      reason:
        "Infection patterns need source, severity, immune risk, age/pregnancy status, and spread/worsening review.",
      nextStep:
        "Ask temperature, duration, source symptoms, exposure, immune status, pregnancy/infant status, and red flags."
    });
  },

  routeMusculoskeletal(text = "", pattern = null) {
    const hits = this.collect(text, [
      "back pain",
      "joint pain",
      "muscle pain",
      "injury",
      "fall",
      "sprain",
      "fracture",
      "swelling joint",
      "neck pain",
      "hip pain"
    ]);

    return this.routeIfHits({
      id: "musculoskeletal",
      label: "Musculoskeletal",
      file: "ari/medical/systems/ari-medical-musculoskeletal-engine.js",
      hits,
      reason:
        "Musculoskeletal symptoms need trauma, function, neurologic deficits, infection signs, and pain location review.",
      nextStep:
        "Ask injury mechanism, location, ability to bear weight/use limb, numbness/weakness, fever, and severity."
    });
  },

  routeDermatology(text = "", pattern = null) {
    const hits = this.collect(text, [
      "rash",
      "hives",
      "itching",
      "skin",
      "wound",
      "blister",
      "cellulitis",
      "burn",
      "swollen lips",
      "skin peeling"
    ]);

    return this.routeIfHits({
      id: "dermatology",
      label: "Dermatology",
      file: "ari/medical/systems/ari-medical-dermatology-engine.js",
      hits,
      reason:
        "Skin findings can reflect allergy, infection, medication reaction, autoimmune disease, burn, or local irritation.",
      nextStep:
        "Ask onset, spread, fever, pain, medication exposure, mucous membrane involvement, breathing/swelling, and photos if available."
    });
  },

  routeENT(text = "", pattern = null) {
    const hits = this.collect(text, [
      "ear pain",
      "sore throat",
      "sinus",
      "nasal",
      "hearing loss",
      "dizziness",
      "trouble swallowing",
      "tonsil",
      "neck swelling"
    ]);

    return this.routeIfHits({
      id: "ent",
      label: "ENT",
      file: "ari/medical/systems/ari-medical-ent-engine.js",
      hits,
      reason:
        "Ear, nose, throat, swallowing, and sinus symptoms can overlap with infection, allergy, airway, reflux, or neurologic issues.",
      nextStep:
        "Ask fever, breathing/swallowing difficulty, voice changes, neck swelling, duration, pain location, and immune risk."
    });
  },

  routeOBGYN(text = "", pattern = null) {
    const hits = this.collect(text, [
      "pregnant",
      "pregnancy",
      "vaginal bleeding",
      "pelvic pain",
      "contractions",
      "water broke",
      "decreased fetal movement",
      "period",
      "discharge"
    ]);

    if (pattern?.system === "obstetrics") hits.push("pregnancy_pattern");

    return this.routeIfHits({
      id: "obgyn",
      label: "OB/GYN",
      file: "ari/medical/systems/ari-medical-obgyn-engine.js",
      hits,
      reason:
        "Pregnancy and reproductive symptoms require different thresholds and age/gestational context.",
      nextStep:
        "Ask pregnancy status/gestational age, bleeding/fluid leakage, pain, fever, discharge, fetal movement if applicable, and severity."
    });
  },

  routePediatrics(text = "", pattern = null) {
    const hits = this.collect(text, [
      "baby",
      "infant",
      "newborn",
      "toddler",
      "child",
      "pediatric",
      "fever baby",
      "no wet diapers",
      "not feeding"
    ]);

    if (pattern?.system === "pediatrics") hits.push("pediatric_pattern");

    return this.routeIfHits({
      id: "pediatrics",
      label: "Pediatrics",
      file: "ari/medical/systems/ari-medical-pediatrics-engine.js",
      hits,
      reason:
        "Pediatric cases need age-specific physiology, medication dosing caution, hydration review, and lower threshold for escalation.",
      nextStep:
        "Ask exact age, temperature, feeding, wet diapers/urination, breathing effort, alertness, rash, and duration."
    });
  },

  routePsychiatry(text = "", pattern = null) {
    const hits = this.collect(text, [
      "anxiety",
      "panic",
      "depressed",
      "suicidal",
      "hallucinations",
      "paranoid",
      "mania",
      "not sleeping",
      "agitated",
      "psychosis"
    ]);

    if (pattern?.system === "psychiatry") hits.push("psychiatric_pattern");

    return this.routeIfHits({
      id: "psychiatry",
      label: "Psychiatry",
      file: "ari/medical/systems/ari-medical-psychiatry-engine.js",
      hits,
      reason:
        "Psych symptoms require separation of safety risk, primary illness, substance effect, medical cause, medication side effect, and sleep disruption.",
      nextStep:
        "Ask safety questions first, then onset, sleep, substances, medication changes, psychosis/mania symptoms, and medical red flags."
    });
  },

  routePharmacology(text = "", pattern = null) {
    const hits = this.collect(text, [
      "medication",
      "medicine",
      "dose",
      "side effect",
      "reaction",
      "withdrawal",
      "overdose",
      "allergy",
      "started",
      "stopped medication"
    ]);

    if (pattern?.system === "pharmacology") hits.push("medication_reaction_pattern");

    return this.routeIfHits({
      id: "pharmacology",
      label: "Pharmacology",
      file: "ari/medical/pharmacology/ari-medical-pharmacology-engine.js",
      hits,
      reason:
        "Medication questions may involve side effects, interactions, allergies, toxicity, withdrawal, dosing, and special populations.",
      nextStep:
        "Ask medication name, dose, start/stop/change timing, other meds/substances, age/pregnancy status, symptoms, and allergy red flags."
    });
  },

  routeIfHits({
    id = "",
    label = "",
    file = "",
    hits = [],
    reason = "",
    nextStep = ""
  } = {}) {
    const uniqueHits = this.dedupe(hits);
    if (!uniqueHits.length) return null;

    return {
      id,
      label,
      file,
      evidence: uniqueHits,
      confidence: uniqueHits.length >= 3 ? "high" : uniqueHits.length >= 2 ? "medium" : "low",
      score: uniqueHits.length,
      reason,
      nextStep
    };
  },

  collect(text = "", terms = []) {
    return terms.filter(term => window.Ari.medical.utils.hasTerm(text, term));
  },

  dedupe(list = []) {
    return [...new Set(list.filter(Boolean))];
  },

  scoreRank(route = {}) {
    const confidenceRank = { high: 30, medium: 20, low: 10 };
    return (confidenceRank[route.confidence] || 0) + (route.score || 0);
  }
};

window.AriMedicalBodySystemsRouter = window.Ari.medical.bodySystemsRouter;

console.log(
  "ARI MEDICAL BODY SYSTEMS ROUTER LOADED:",
  window.Ari.medical.bodySystemsRouter.version
);