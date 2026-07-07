// ari/medical/symptoms/ari-medical-symptom-pattern-engine.js
// Purpose: Recognize symptom clusters and suggest likely body-system patterns without diagnosing.
// V1.0.0 — Chief Complaint Pattern Mapper / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.symptomPatternEngine = {
  version: "1.0.0",

  analyze(input = {}) {
    const summary = input.summary || input || {};

    const text = window.Ari.medical.utils.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const patterns = this.detectPatterns(text);
    const primaryPattern = this.pickPrimaryPattern(patterns);

    return window.Ari.medical.contract.create({
      engine: "ari-medical-symptom-pattern-engine",
      version: this.version,
      activated: patterns.length > 0,
      confidence: primaryPattern?.confidence || "low",
      urgency: primaryPattern?.urgency || "routine",
      primaryPattern,
      patterns,
      findings: patterns,
      supportingEvidence: patterns,
      reasoning:
        primaryPattern?.reason ||
        "No strong symptom cluster was detected from the available message.",
      nextStep:
        primaryPattern?.nextStep ||
        "Ask broad chief-complaint questions, then narrow based on body system.",
      responsePosture: {
        label: "symptom_pattern_mapping",
        canAskFollowUp: true,
        explainBriefly: true,
        advisoryOnly: true
      }
    });
  },

  detectPatterns(text = "") {
    return [
      this.detectCardiopulmonary(text),
      this.detectNeurologic(text),
      this.detectGI(text),
      this.detectGU(text),
      this.detectInfection(text),
      this.detectPsychiatric(text),
      this.detectPregnancy(text),
      this.detectPediatric(text),
      this.detectMedicationReaction(text)
    ].filter(Boolean);
  },

  detectCardiopulmonary(text = "") {
    const hits = this.collect(text, [
      "shortness of breath",
      "sob",
      "chest pain",
      "leg swelling",
      "leg edema",
      "ankle swelling",
      "jvd",
      "jugular vein",
      "bulging neck vein",
      "coughing blood",
      "blue lips",
      "cyanosis",
      "palpitations",
      "fainting"
    ]);

    if (!hits.length) return null;

    const highRisk =
      hits.includes("shortness of breath") ||
      hits.includes("sob") ||
      hits.includes("chest pain") ||
      hits.includes("jvd") ||
      hits.includes("jugular vein") ||
      hits.includes("bulging neck vein") ||
      hits.includes("coughing blood") ||
      hits.includes("blue lips") ||
      hits.includes("cyanosis");

    return {
      type: "cardiopulmonary_pattern",
      system: "cardiovascular_respiratory",
      label: "Possible heart/lung circulation pattern",
      evidence: hits,
      confidence: hits.length >= 3 ? "high" : "medium",
      urgency: highRisk ? "emergency" : "urgent",
      reason:
        "Symptoms involving breathing, chest symptoms, swelling, or neck-vein distention can point toward heart/lung strain and should be treated carefully.",
      nextStep:
        "Screen for emergency red flags first: active shortness of breath, chest pain, fainting, blue lips, coughing blood, severe weakness, or rapidly worsening swelling."
    };
  },

  detectNeurologic(text = "") {
    const hits = this.collect(text, [
      "weakness",
      "one sided weakness",
      "facial droop",
      "slurred speech",
      "confusion",
      "worst headache",
      "seizure",
      "new numbness",
      "vision loss",
      "loss of balance"
    ]);

    if (!hits.length) return null;

    return {
      type: "neurologic_pattern",
      system: "neurology",
      label: "Possible neurologic pattern",
      evidence: hits,
      confidence: hits.length >= 2 ? "high" : "medium",
      urgency: "emergency",
      reason:
        "New weakness, speech changes, seizure, severe headache, confusion, or vision loss can signal time-sensitive neurologic illness.",
      nextStep:
        "Clarify onset time, new deficits, trauma, seizure activity, headache severity, and whether symptoms are happening now."
    };
  },

  detectGI(text = "") {
    const hits = this.collect(text, [
      "abdominal pain",
      "stomach pain",
      "vomiting",
      "diarrhea",
      "blood in stool",
      "black stool",
      "constipation",
      "right lower quadrant",
      "ruq pain",
      "jaundice"
    ]);

    if (!hits.length) return null;

    return {
      type: "gastrointestinal_pattern",
      system: "gastrointestinal",
      label: "Possible GI pattern",
      evidence: hits,
      confidence: hits.length >= 2 ? "medium" : "low",
      urgency:
        hits.includes("blood in stool") ||
        hits.includes("black stool") ||
        hits.includes("jaundice")
          ? "urgent"
          : "soon",
      reason:
        "Digestive symptoms need narrowing by location, timing, stool/vomit changes, hydration, fever, and severity.",
      nextStep:
        "Ask pain location, duration, fever, vomiting, stool color, hydration, pregnancy status if applicable, and severity."
    };
  },

  detectGU(text = "") {
    const hits = this.collect(text, [
      "burning when peeing",
      "painful urination",
      "blood in urine",
      "flank pain",
      "kidney pain",
      "testicle pain",
      "pelvic pain",
      "urinary retention",
      "can't pee",
      "frequent urination"
    ]);

    if (!hits.length) return null;

    return {
      type: "genitourinary_pattern",
      system: "urology_genitourinary",
      label: "Possible urinary/reproductive pattern",
      evidence: hits,
      confidence: hits.length >= 2 ? "medium" : "low",
      urgency:
        hits.includes("testicle pain") ||
        hits.includes("urinary retention") ||
        hits.includes("can't pee") ||
        hits.includes("flank pain")
          ? "urgent"
          : "soon",
      reason:
        "Urinary, pelvic, flank, or testicular symptoms can range from routine infection to urgent obstruction or torsion patterns.",
      nextStep:
        "Ask urinary symptoms, fever, flank pain, pregnancy status if applicable, discharge, testicular pain, and ability to urinate."
    };
  },

  detectInfection(text = "") {
    const hits = this.collect(text, [
      "fever",
      "chills",
      "sweats",
      "infection",
      "pus",
      "red streak",
      "wound",
      "stiff neck",
      "rash",
      "sepsis"
    ]);

    if (!hits.length) return null;

    return {
      type: "infection_pattern",
      system: "infectious_disease",
      label: "Possible infection/inflammation pattern",
      evidence: hits,
      confidence: hits.length >= 2 ? "medium" : "low",
      urgency:
        hits.includes("stiff neck") ||
        hits.includes("red streak") ||
        hits.includes("sepsis")
          ? "emergency"
          : "soon",
      reason:
        "Fever or infection signs need severity screening, source identification, and immune-risk review.",
      nextStep:
        "Ask temperature, duration, source symptoms, immune status, pregnancy/infant/elderly status, and signs of worsening."
    };
  },

  detectPsychiatric(text = "") {
    const hits = this.collect(text, [
      "suicidal",
      "kill myself",
      "hurt myself",
      "hearing voices",
      "hallucinations",
      "paranoid",
      "mania",
      "not sleeping",
      "panic attack",
      "severe anxiety",
      "depressed"
    ]);

    if (!hits.length) return null;

    return {
      type: "psychiatric_behavioral_pattern",
      system: "psychiatry",
      label: "Possible psychiatric/behavioral pattern",
      evidence: hits,
      confidence: hits.length >= 2 ? "high" : "medium",
      urgency:
        hits.includes("suicidal") ||
        hits.includes("kill myself") ||
        hits.includes("hurt myself") ||
        hits.includes("hearing voices") ||
        hits.includes("hallucinations")
          ? "emergency"
          : "urgent",
      reason:
        "Psychiatric symptoms need safety screening first, then differentiation between illness, substances, medications, sleep loss, and stress.",
      nextStep:
        "Screen for danger to self/others, psychosis, mania, intoxication/withdrawal, medication changes, sleep, and support."
    };
  },

  detectPregnancy(text = "") {
    const hits = this.collect(text, [
      "pregnant",
      "pregnancy",
      "vaginal bleeding",
      "water broke",
      "contractions",
      "decreased fetal movement",
      "severe headache pregnant",
      "right upper abdominal pain pregnant",
      "swelling pregnant"
    ]);

    if (!hits.length) return null;

    return {
      type: "pregnancy_pattern",
      system: "obstetrics",
      label: "Possible pregnancy-related pattern",
      evidence: hits,
      confidence: "medium",
      urgency:
        hits.includes("vaginal bleeding") ||
        hits.includes("water broke") ||
        hits.includes("decreased fetal movement")
          ? "urgent"
          : "soon",
      reason:
        "Pregnancy changes the risk threshold and should route symptoms more cautiously.",
      nextStep:
        "Ask gestational age, bleeding/fluid leakage, fetal movement if far enough along, pain, headache, vision changes, BP concerns, and fever."
    };
  },

  detectPediatric(text = "") {
    const hits = this.collect(text, [
      "baby",
      "infant",
      "newborn",
      "toddler",
      "child",
      "pediatric",
      "not feeding",
      "no wet diapers",
      "lethargic baby",
      "fever baby"
    ]);

    if (!hits.length) return null;

    return {
      type: "pediatric_pattern",
      system: "pediatrics",
      label: "Possible pediatric pattern",
      evidence: hits,
      confidence: "medium",
      urgency:
        hits.includes("newborn") ||
        hits.includes("not feeding") ||
        hits.includes("no wet diapers") ||
        hits.includes("lethargic baby") ||
        hits.includes("fever baby")
          ? "urgent"
          : "soon",
      reason:
        "Children, infants, and newborns need age-specific thresholds because symptoms can worsen faster.",
      nextStep:
        "Ask exact age, temperature, feeding, wet diapers/urination, breathing effort, alertness, rash, and duration."
    };
  },

  detectMedicationReaction(text = "") {
    const hits = this.collect(text, [
      "started medication",
      "new medication",
      "side effect",
      "rash after medication",
      "swollen lips",
      "tongue swelling",
      "throat swelling",
      "trouble breathing after medication",
      "dizzy after medication",
      "serotonin syndrome",
      "akathisia",
      "eps",
      "withdrawal"
    ]);

    if (!hits.length) return null;

    return {
      type: "medication_reaction_pattern",
      system: "pharmacology",
      label: "Possible medication side effect/reaction pattern",
      evidence: hits,
      confidence: hits.length >= 2 ? "high" : "medium",
      urgency:
        hits.includes("swollen lips") ||
        hits.includes("tongue swelling") ||
        hits.includes("throat swelling") ||
        hits.includes("trouble breathing after medication")
          ? "emergency"
          : "urgent",
      reason:
        "Medication reactions can mimic illness, behavior changes, allergy, toxicity, withdrawal, or side effects.",
      nextStep:
        "Ask medication name, dose, start date, recent dose changes, other meds/substances, allergy symptoms, neurologic symptoms, and timing."
    };
  },

  pickPrimaryPattern(patterns = []) {
    if (!patterns.length) return null;

    const rank = {
      emergency: 4,
      urgent: 3,
      soon: 2,
      routine: 1
    };

    return [...patterns].sort((a, b) => {
      const urgencyDiff = (rank[b.urgency] || 0) - (rank[a.urgency] || 0);
      if (urgencyDiff) return urgencyDiff;

      const confidenceRank = { high: 3, medium: 2, low: 1 };
      return (confidenceRank[b.confidence] || 0) - (confidenceRank[a.confidence] || 0);
    })[0];
  },

  collect(text = "", terms = []) {
    return terms.filter(term => window.Ari.medical.utils.hasTerm(text, term));
  }
};

window.AriMedicalSymptomPatternEngine = window.Ari.medical.symptomPatternEngine;

console.log(
  "ARI MEDICAL SYMPTOM PATTERN ENGINE LOADED:",
  window.Ari.medical.symptomPatternEngine.version
);