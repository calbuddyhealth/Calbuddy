// ari/medical/pharmacology/ari-medical-medication-side-effect-engine.js
// Purpose: Compare detected medications/classes against symptoms and timing.
// V1.0.0 — Medication Side Effect Matcher / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.medicationSideEffectEngine = {
  version: "1.0.0",

  analyze(input = {}) {
    const summary = input.summary || input || {};

    const medPacket =
      summary.medicalMedicationClass ||
      summary.medicationClassPacket ||
      summary.medicationClass ||
      {};

    const text = window.Ari.medical.utils.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const medications = medPacket.medicationsDetected || [];
    const symptomTokens = this.extractSymptomTokens(text);
    const timing = this.detectTiming(text);

    const matches = this.scoreMedicationMatches({
      medications,
      symptomTokens,
      timing,
      text
    });

    const primaryMatch = matches[0] || null;

    return window.Ari.medical.contract.create({
      engine: "ari-medical-medication-side-effect-engine",
      version: this.version,
      activated: matches.length > 0,
      confidence: primaryMatch?.confidence || "low",
      urgency: primaryMatch?.urgency || "routine",

      medicationSideEffectMatches: matches,
      primaryMedicationSideEffect: primaryMatch,
      symptomTokens,
      timing,

      findings: matches,
      supportingEvidence: matches.map(match => ({
        claim: `${match.medicationName} may explain: ${match.matchedEffects.join(", ")}.`,
        source: "ari-medical-medication-side-effect-engine",
        confidence: match.confidence,
        raw: match
      })),

      reasoning:
        primaryMatch
          ? `Medication-related pattern detected for ${primaryMatch.medicationName}.`
          : "No medication side-effect pattern was strong enough from the available message.",

      nextStep:
        primaryMatch?.nextStep ||
        "Clarify medication name, dose, start date, recent changes, other meds, substances, and symptom timing.",

      responsePosture: {
        label: "medication_side_effect_reasoning",
        advisoryOnly: true,
        avoidDiagnosis: true,
        avoidMedicationChangeAdvice: true,
        compareMedicationVsIllness: true,
        preserveUncertainty: true
      },

      cannotSet: [
        "diagnosis",
        "finalDiagnosis",
        "prescription",
        "medicationDoseChange",
        "stopMedication",
        "startMedication"
      ]
    });
  },

  scoreMedicationMatches({ medications = [], symptomTokens = [], timing = {}, text = "" } = {}) {
    return medications
      .map(med => this.scoreMedication(med, symptomTokens, timing, text))
      .filter(match => match.score >= 3)
      .sort((a, b) => b.score - a.score);
  },

  scoreMedication(med = {}, symptomTokens = [], timing = {}, text = "") {
    const commonHits = this.matchEffects(symptomTokens, med.commonEffects);
    const seriousHits = this.matchEffects(symptomTokens, med.seriousEffects);
    const withdrawalHits = this.matchEffects(symptomTokens, med.withdrawalEffects);
    const warningHits = this.matchEffects(symptomTokens, med.warningSigns);
    const allergyHits = this.matchEffects(symptomTokens, this.allergyWarningTokens());
    const toxicityHits = this.matchEffects(symptomTokens, this.toxicityWarningTokens());

    let score =
      commonHits.length * 2 +
      seriousHits.length * 5 +
      withdrawalHits.length * 4 +
      warningHits.length * 6 +
      allergyHits.length * 6 +
      toxicityHits.length * 5;

    if (timing.startedOrChanged) score += 4;
    if (timing.stoppedOrMissed) score += 4;
    if (timing.afterTakingMedication) score += 5;
    if (timing.noTimingEvidence) score -= 1;

    const matchedEffects = [
      ...commonHits,
      ...seriousHits,
      ...withdrawalHits,
      ...warningHits,
      ...allergyHits,
      ...toxicityHits
    ];

    const urgency =
      allergyHits.length || warningHits.length || toxicityHits.length
        ? "emergency"
        : seriousHits.length || withdrawalHits.length
          ? "urgent"
          : score >= 5
            ? "soon"
            : "routine";

    return {
      medicationId: med.id,
      medicationName: med.name || med.className || med.id,
      className: med.className || med.name || med.id,

      score,
      confidence: score >= 12 ? "high" : score >= 6 ? "medium" : "low",
      urgency,

      matchedEffects: [...new Set(matchedEffects)],
      commonHits,
      seriousHits,
      withdrawalHits,
      warningHits,
      allergyHits,
      toxicityHits,
      timing,

      reason: this.reasonFor({ med, matchedEffects, timing, urgency }),
      nextStep: this.nextStepFor({ urgency, timing }),

      advisoryOnly: true,
      notDiagnosis: true
    };
  },

  extractSymptomTokens(text = "") {
    const tokenMap = this.symptomEffectVocabulary();
    const tokens = [];

    Object.entries(tokenMap).forEach(([token, terms]) => {
      if (terms.some(term => window.Ari.medical.utils.hasTerm(text, term))) {
        tokens.push(token);
      }
    });

    return [...new Set(tokens)];
  },

  matchEffects(symptomTokens = [], effects = []) {
    const effectTokens = (effects || []).map(effect =>
      this.normalizeEffect(effect)
    );

    return symptomTokens.filter(token =>
      effectTokens.includes(token)
    );
  },

  normalizeEffect(effect = "") {
    return window.Ari.medical.utils.normalize(effect)
      .replace(/\s+/g, "_");
  },

  detectTiming(text = "") {
    return {
      startedOrChanged: this.hasAny(text, [
        "started",
        "new medication",
        "changed dose",
        "increased dose",
        "decreased dose",
        "dose change",
        "switched medication"
      ]),
      stoppedOrMissed: this.hasAny(text, [
        "stopped",
        "missed dose",
        "ran out",
        "withdrawal",
        "discontinued",
        "quit taking"
      ]),
      afterTakingMedication: this.hasAny(text, [
        "after taking",
        "after i took",
        "after starting",
        "since starting",
        "since taking",
        "right after"
      ]),
      noTimingEvidence: !this.hasAny(text, [
        "started",
        "changed dose",
        "stopped",
        "missed dose",
        "after taking",
        "since starting",
        "new medication"
      ])
    };
  },

  reasonFor({ med = {}, matchedEffects = [], timing = {}, urgency = "routine" } = {}) {
    const name = med.name || med.className || med.id || "the medication";

    if (!matchedEffects.length) {
      return `No strong symptom overlap was found for ${name}.`;
    }

    const timingText =
      timing.startedOrChanged || timing.afterTakingMedication
        ? "The timing also supports a possible medication relationship."
        : timing.stoppedOrMissed
          ? "Stopping or missing the medication may support a withdrawal or rebound pattern."
          : "Timing is unclear, so this remains uncertain.";

    return `${name} has symptom overlap with ${matchedEffects.join(", ")}. ${timingText} Urgency: ${urgency}.`;
  },

  nextStepFor({ urgency = "routine", timing = {} } = {}) {
    if (urgency === "emergency") {
      return "If there is trouble breathing, throat/tongue/lip swelling, overdose, severe confusion, fainting, severe rash, or rapidly worsening symptoms, seek emergency care now.";
    }

    if (urgency === "urgent") {
      return "Contact a clinician or pharmacist promptly, especially if symptoms are worsening, severe, or started after a medication change.";
    }

    if (timing.noTimingEvidence) {
      return "Clarify when the medication started or changed and when symptoms began.";
    }

    return "Compare symptom timing with medication start/change and consider clinician or pharmacist guidance before changing medication.";
  },

  allergyWarningTokens() {
    return [
      "rash",
      "hives",
      "swollen_lips",
      "swollen_tongue",
      "throat_swelling",
      "trouble_breathing",
      "wheezing"
    ];
  },

  toxicityWarningTokens() {
    return [
      "confusion",
      "seizure",
      "fainting",
      "severe_vomiting",
      "tremor",
      "rigidity",
      "irregular_heartbeat",
      "overdose"
    ];
  },

  symptomEffectVocabulary() {
    return {
      nausea: ["nausea", "nauseous"],
      vomiting: ["vomiting", "throwing up"],
      severe_vomiting: ["severe vomiting", "can't stop vomiting"],
      diarrhea: ["diarrhea"],
      constipation: ["constipation"],
      dizziness: ["dizzy", "dizziness", "lightheaded"],
      sedation: ["sedated", "sleepy", "drowsy", "very tired"],
      insomnia: ["insomnia", "can't sleep", "trouble sleeping"],
      headache: ["headache"],
      tremor: ["tremor", "shaking"],
      akathisia: ["akathisia", "can't sit still", "restless"],
      eps: ["eps", "stiff muscles", "muscle stiffness"],
      rigidity: ["rigidity", "rigid muscles"],
      rash: ["rash"],
      hives: ["hives"],
      swollen_lips: ["swollen lips", "lip swelling"],
      swollen_tongue: ["swollen tongue", "tongue swelling"],
      throat_swelling: ["throat swelling", "throat closing"],
      trouble_breathing: ["trouble breathing", "shortness of breath", "can't breathe"],
      wheezing: ["wheezing"],
      confusion: ["confusion", "confused", "altered mental status"],
      seizure: ["seizure"],
      fainting: ["fainting", "passed out", "syncope"],
      irregular_heartbeat: ["irregular heartbeat", "palpitations"],
      overdose: ["overdose", "took too much"],
      suicidal_thoughts: ["suicidal", "kill myself", "end my life"],
      mania: ["mania", "manic", "no sleep with energy"],
      anxiety: ["anxiety", "panic", "panic attack"],
      sexual_dysfunction: ["sexual dysfunction", "low libido"],
      appetite_loss: ["appetite loss", "not hungry"],
      weight_gain: ["weight gain"],
      cough: ["cough", "dry cough"],
      swelling: ["swelling", "edema"],
      bleeding: ["bleeding", "bruising easily", "blood in stool", "black stool"]
    };
  },

  hasAny(text = "", phrases = []) {
    return phrases.some(phrase => window.Ari.medical.utils.hasTerm(text, phrase));
  }
};

window.AriMedicalMedicationSideEffectEngine =
  window.Ari.medical.medicationSideEffectEngine;

console.log(
  "ARI MEDICAL MEDICATION SIDE EFFECT ENGINE LOADED:",
  window.Ari.medical.medicationSideEffectEngine.version
);