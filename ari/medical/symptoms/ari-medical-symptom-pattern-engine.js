// ari/medical/symptoms/ari-medical-symptom-pattern-engine.js
// Purpose: Detect high-yield symptom clusters using modular scoring.
// V1.0.0 — Symptom Pattern Scoring Engine / Advisory Only

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

    const tokens = this.extractTokens(text);
    const patterns = this.scorePatterns(tokens);
    const primaryPattern = patterns[0] || null;

    return window.Ari.medical.contract.create({
      engine: "ari-medical-symptom-pattern-engine",
      version: this.version,
      activated: patterns.length > 0,
      confidence: primaryPattern?.confidence || "low",
      urgency: primaryPattern?.urgency || "routine",
      primaryPattern,
      patterns,
      symptomTokens: tokens,
      reasoning:
        primaryPattern
          ? `Matched symptom pattern: ${primaryPattern.label}.`
          : "No strong symptom pattern matched.",
      nextStep:
        primaryPattern?.nextStep ||
        "Use red flags, body-system routing, and focused questions.",
      responsePosture: {
        label: "symptom_pattern_scoring",
        advisoryOnly: true,
        avoidDiagnosis: true,
        avoidSingleCauseLockIn: true
      }
    });
  },

  extractTokens(text = "") {
    const tokenMap = this.symptomVocabulary();
    const tokens = [];

    Object.entries(tokenMap).forEach(([token, terms]) => {
      if (terms.some(term => window.Ari.medical.utils.hasTerm(text, term))) {
        tokens.push(token);
      }
    });

    return [...new Set(tokens)];
  },

  scorePatterns(tokens = []) {
    const patterns = this.patternClusters();

    return patterns
      .map(pattern => this.scorePattern(pattern, tokens))
      .filter(result => result.matched)
      .sort((a, b) => b.score - a.score);
  },

  scorePattern(pattern = {}, tokens = []) {
    const tokenSet = new Set(tokens);

    const requiredHits = this.hits(pattern.requiredAny, tokenSet);
    const supportingHits = this.hits(pattern.supportingAny, tokenSet);
    const emergencyHits = this.hits(pattern.emergencyAny, tokenSet);
    const negativeHits = this.hits(pattern.negativeClues, tokenSet);

    const hasRequired =
      !pattern.requiredAny?.length || requiredHits.length > 0;

    const score =
      requiredHits.length * 4 +
      supportingHits.length * 2 +
      emergencyHits.length * 6 -
      negativeHits.length * 2;

    const matched =
      hasRequired &&
      score >= (pattern.threshold || 4);

    const urgency =
      emergencyHits.length ? "emergency" :
      pattern.baseUrgency || "routine";

    return {
      id: pattern.id,
      label: pattern.label,
      system: pattern.system,
      matched,
      score,
      confidence: score >= 10 ? "high" : score >= 6 ? "medium" : "low",
      urgency,
      requiredHits,
      supportingHits,
      emergencyHits,
      negativeHits,
      reason: pattern.reason,
      nextStep: pattern.nextStep,
      advisoryOnly: true
    };
  },

  hits(list = [], tokenSet = new Set()) {
    return (list || []).filter(token => tokenSet.has(token));
  },

  symptomVocabulary() {
    return {
      shortness_of_breath: ["shortness of breath", "sob", "trouble breathing", "dyspnea"],
      chest_pain: ["chest pain", "chest pressure", "chest tightness"],
      leg_edema: ["leg swelling", "swollen legs", "ankle swelling", "edema"],
      jvd: ["jvd", "jugular vein", "neck vein bulging", "jugular vein bulging"],
      orthopnea: ["shortness of breath lying flat", "orthopnea", "need pillows to breathe"],
      rapid_weight_gain: ["rapid weight gain", "gained weight quickly"],
      syncope: ["fainting", "passed out", "syncope"],
      blue_lips: ["blue lips", "cyanosis"],
      severe_respiratory_distress: ["can't breathe", "cannot breathe", "gasping"],

      facial_droop: ["facial droop", "face drooping"],
      slurred_speech: ["slurred speech", "trouble speaking"],
      one_sided_weakness: ["one sided weakness", "weak on one side"],
      confusion: ["confusion", "confused", "altered mental status"],
      seizure: ["seizure", "convulsion"],

      fever: ["fever", "high temperature"],
      chills: ["chills", "rigors"],
      stiff_neck: ["stiff neck", "neck stiffness"],
      rash: ["rash", "skin rash"],
      vomiting: ["vomiting", "throwing up"],
      diarrhea: ["diarrhea", "loose stool"],
      abdominal_pain: ["abdominal pain", "stomach pain", "belly pain"],
      blood_in_stool: ["blood in stool", "bloody stool"],
      black_stool: ["black stool", "tarry stool"],

      suicidal_thoughts: ["suicidal", "kill myself", "end my life"],
      homicidal_thoughts: ["homicidal", "hurt someone", "kill someone"],
      hallucinations: ["hallucinations", "hearing voices", "seeing things"],
      mania: ["mania", "manic", "no sleep with energy"],
      medication_change: ["started medication", "changed dose", "stopped medication"],
      overdose: ["overdose", "took too much"],

      pregnant: ["pregnant", "pregnancy", "weeks pregnant"],
      vaginal_bleeding: ["vaginal bleeding", "bleeding while pregnant"],
      decreased_fetal_movement: ["decreased fetal movement", "baby not moving"],
      severe_headache: ["severe headache", "worst headache"],
      vision_changes: ["vision changes", "blurry vision"],

      infant: ["infant", "newborn", "baby"],
      not_feeding: ["not feeding", "won't feed", "poor feeding"],
      no_wet_diapers: ["no wet diapers", "not peeing"],
      lethargy: ["lethargic", "hard to wake", "very sleepy"]
    };
  },

  patternClusters() {
    return [
      {
        id: "cardiopulmonary_fluid_overload",
        label: "Cardiopulmonary fluid overload pattern",
        system: "cardiovascular_respiratory",
        requiredAny: ["shortness_of_breath"],
        supportingAny: ["leg_edema", "jvd", "orthopnea", "rapid_weight_gain"],
        emergencyAny: ["chest_pain", "syncope", "blue_lips", "severe_respiratory_distress"],
        threshold: 6,
        baseUrgency: "urgent",
        reason:
          "Shortness of breath plus swelling/JVD/orthopnea can suggest fluid overload or cardiopulmonary strain.",
        nextStep:
          "Screen for emergency breathing symptoms, chest pain, fainting, oxygen issues, and rapid worsening."
      },

      {
        id: "stroke_like_neurologic_deficit",
        label: "Stroke-like neurologic deficit pattern",
        system: "neurology",
        requiredAny: ["facial_droop", "slurred_speech", "one_sided_weakness"],
        supportingAny: ["confusion", "severe_headache", "vision_changes"],
        emergencyAny: ["seizure", "syncope"],
        threshold: 4,
        baseUrgency: "emergency",
        reason:
          "New one-sided weakness, facial droop, speech difficulty, or severe neurologic change can be time-sensitive.",
        nextStep:
          "Recommend emergency evaluation now if symptoms are current or new."
      },

      {
        id: "infection_possible_sepsis_or_meningitis",
        label: "Serious infection / sepsis concern pattern",
        system: "infectious_disease",
        requiredAny: ["fever"],
        supportingAny: ["chills", "confusion", "vomiting", "rash"],
        emergencyAny: ["stiff_neck", "severe_respiratory_distress", "blue_lips"],
        threshold: 6,
        baseUrgency: "urgent",
        reason:
          "Fever with systemic symptoms or neurologic/respiratory red flags can become urgent quickly.",
        nextStep:
          "Clarify temperature, duration, mental status, breathing, hydration, rash, neck stiffness, and immune risk."
      },

      {
        id: "pregnancy_red_flag_pattern",
        label: "Pregnancy red-flag pattern",
        system: "obstetrics",
        requiredAny: ["pregnant"],
        supportingAny: ["vaginal_bleeding", "severe_headache", "vision_changes", "abdominal_pain"],
        emergencyAny: ["decreased_fetal_movement", "syncope", "severe_respiratory_distress"],
        threshold: 6,
        baseUrgency: "urgent",
        reason:
          "Pregnancy changes the threshold for symptoms like bleeding, severe headache, vision changes, abdominal pain, or decreased fetal movement.",
        nextStep:
          "Ask gestational age and recommend OB triage or urgent evaluation for red flags."
      },

      {
        id: "pediatric_dehydration_or_serious_illness",
        label: "Pediatric dehydration / serious illness pattern",
        system: "pediatrics",
        requiredAny: ["infant"],
        supportingAny: ["not_feeding", "no_wet_diapers", "fever", "vomiting", "diarrhea", "lethargy"],
        emergencyAny: ["severe_respiratory_distress", "blue_lips", "seizure"],
        threshold: 6,
        baseUrgency: "urgent",
        reason:
          "Infants and young children can worsen faster with fever, poor feeding, dehydration, lethargy, or breathing problems.",
        nextStep:
          "Ask exact age, temperature, feeding, wet diapers, breathing, alertness, and duration."
      },

      {
        id: "psychiatric_safety_or_medication_overlap",
        label: "Psychiatric safety / medication overlap pattern",
        system: "psychiatry",
        requiredAny: ["suicidal_thoughts", "homicidal_thoughts", "hallucinations", "mania"],
        supportingAny: ["medication_change", "confusion"],
        emergencyAny: ["overdose"],
        threshold: 4,
        baseUrgency: "urgent",
        reason:
          "Psychiatric symptoms may involve safety risk, medication effects, substances, sleep disruption, or medical causes.",
        nextStep:
          "Ask safety questions first, then medication/substance changes, sleep, psychosis, mania, and medical symptoms."
      }
    ];
  }
};

window.AriMedicalSymptomPatternEngine = window.Ari.medical.symptomPatternEngine;

console.log(
  "ARI MEDICAL SYMPTOM PATTERN ENGINE LOADED:",
  window.Ari.medical.symptomPatternEngine.version
);