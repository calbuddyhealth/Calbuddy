// ari/medical/pharmacology/ari-medical-medication-interaction-engine.js
// Purpose: Detect medication/substance interaction risk patterns using reusable risk tags.
// V1.0.0 — Medication Interaction Risk Engine / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.medicationInteractionEngine = {
  version: "1.0.0",

  analyze(input = {}) {
    const summary = input.summary || input || {};

    const medPacket =
      summary.medicalMedicationClass ||
      summary.medicationClassPacket ||
      summary.medicationClass ||
      {};

    const medications = medPacket.medicationsDetected || [];
    const substanceTags = this.detectSubstanceTags(summary);

    const risks = this.scoreInteractionRisks({
      medications,
      substanceTags
    });

    const primaryRisk = risks[0] || null;

    return window.Ari.medical.contract.create({
      engine: "ari-medical-medication-interaction-engine",
      version: this.version,
      activated: risks.length > 0,
      confidence: primaryRisk?.confidence || "low",
      urgency: primaryRisk?.urgency || "routine",

      interactionRisks: risks,
      primaryInteractionRisk: primaryRisk,
      medicationsDetected: medications,
      substanceTags,

      findings: risks,
      supportingEvidence: risks.map(risk => ({
        claim: `${risk.label}: ${risk.matchedNames.join(" + ")}`,
        source: "ari-medical-medication-interaction-engine",
        confidence: risk.confidence,
        raw: risk
      })),

      reasoning:
        primaryRisk
          ? `Interaction risk pattern detected: ${primaryRisk.label}.`
          : "No medication interaction risk pattern was detected.",

      nextStep:
        primaryRisk?.nextStep ||
        "If medication names are incomplete, ask for the full medication list, doses, timing, and alcohol/substance use.",

      responsePosture: {
        label: "medication_interaction_risk_reasoning",
        advisoryOnly: true,
        avoidDiagnosis: true,
        avoidMedicationChangeAdvice: true,
        compareRiskTagsNotDrugPairs: true,
        preserveUncertainty: true
      },

      cannotSet: [
        "diagnosis",
        "prescription",
        "medicationDoseChange",
        "stopMedication",
        "startMedication"
      ]
    });
  },

  scoreInteractionRisks({ medications = [], substanceTags = [] } = {}) {
    const medItems = this.toRiskItems(medications);
    const substanceItems = substanceTags.map(tag => ({
      id: tag,
      name: tag,
      riskTags: [tag],
      source: "substance_context"
    }));

    const items = [...medItems, ...substanceItems];
    const patterns = this.interactionPatterns();

    return patterns
      .map(pattern => this.scorePattern(pattern, items))
      .filter(result => result.matched)
      .sort((a, b) => b.score - a.score);
  },

  toRiskItems(medications = []) {
    return medications.map(med => ({
      id: med.id,
      name: med.name || med.className || med.id,
      className: med.className || med.name || med.id,
      riskTags: [
        ...(med.interactionRisks || []),
        ...(med.riskTags || []),
        ...(med.systems || [])
      ].map(tag => String(tag).toLowerCase()),
      source: med.source || "medication_class_engine",
      raw: med
    }));
  },

  scorePattern(pattern = {}, items = []) {
    const requiredGroups = pattern.requiredTagGroups || [];
    const matchedGroups = [];
    const matchedItems = [];

    requiredGroups.forEach(group => {
      const matches = items.filter(item =>
        group.some(tag => item.riskTags.includes(tag))
      );

      if (matches.length) {
        matchedGroups.push(group);
        matchedItems.push(...matches);
      }
    });

    const uniqueItems = this.uniqueItems(matchedItems);
    const uniqueNames = uniqueItems.map(item => item.name);

    const hasEnoughGroups = matchedGroups.length >= requiredGroups.length;
    const hasEnoughItems =
      uniqueItems.length >= (pattern.minDistinctItems || 2);

    const score =
      matchedGroups.length * 4 +
      uniqueItems.length * 2 +
      (pattern.highRisk ? 4 : 0);

    const matched =
      hasEnoughGroups &&
      hasEnoughItems &&
      score >= (pattern.threshold || 6);

    return {
      id: pattern.id,
      label: pattern.label,
      matched,
      score,
      confidence: score >= 14 ? "high" : score >= 8 ? "medium" : "low",
      urgency: pattern.urgency || "soon",

      matchedTagGroups: matchedGroups,
      matchedNames: uniqueNames,
      matchedItems: uniqueItems,

      risk: pattern.risk,
      warningSigns: pattern.warningSigns || [],
      nextStep: pattern.nextStep,

      advisoryOnly: true,
      notDiagnosis: true
    };
  },

  interactionPatterns() {
    return [
      {
        id: "serotonergic_stack",
        label: "Serotonergic medication stack",
        requiredTagGroups: [["serotonergic"], ["serotonergic"]],
        minDistinctItems: 2,
        risk:
          "Multiple serotonergic agents can increase serotonin toxicity risk.",
        warningSigns: ["agitation", "confusion", "sweating", "diarrhea", "tremor", "rigidity", "fever"],
        nextStep:
          "Ask for medication names, doses, recent changes, and symptoms like agitation, sweating, diarrhea, tremor, rigidity, or fever.",
        urgency: "urgent",
        highRisk: true
      },

      {
        id: "cns_depressant_stack",
        label: "CNS depressant stack",
        requiredTagGroups: [["sedative", "benzodiazepine", "sleep_med"], ["opioid", "alcohol", "sedative"]],
        minDistinctItems: 2,
        risk:
          "Sedating medications/substances can combine and increase oversedation, falls, confusion, and breathing risk.",
        warningSigns: ["extreme sleepiness", "confusion", "slow breathing", "blue lips", "hard to wake"],
        nextStep:
          "Screen for extreme sedation, slow breathing, confusion, falls, alcohol use, opioid use, and benzodiazepine/sleep-med use.",
        urgency: "urgent",
        highRisk: true
      },

      {
        id: "respiratory_depression_stack",
        label: "Respiratory depression risk stack",
        requiredTagGroups: [["opioid"], ["benzodiazepine", "alcohol", "sedative", "sleep_med"]],
        minDistinctItems: 2,
        risk:
          "Opioids combined with benzodiazepines, alcohol, or sedatives can increase life-threatening breathing suppression risk.",
        warningSigns: ["slow breathing", "cannot stay awake", "blue lips", "gasping"],
        nextStep:
          "If slow breathing, blue lips, overdose, or inability to stay awake is present, treat as emergency.",
        urgency: "emergency",
        highRisk: true
      },

      {
        id: "qt_prolongation_stack",
        label: "QT prolongation stack",
        requiredTagGroups: [["qt_risk"], ["qt_risk"]],
        minDistinctItems: 2,
        risk:
          "Multiple QT-risk medications can increase abnormal heart rhythm risk, especially with low potassium/magnesium or heart disease.",
        warningSigns: ["fainting", "palpitations", "irregular heartbeat", "seizure-like episode"],
        nextStep:
          "Ask about fainting, palpitations, heart history, electrolyte problems, and whether an ECG has been checked.",
        urgency: "urgent",
        highRisk: true
      },

      {
        id: "bleeding_risk_stack",
        label: "Bleeding risk stack",
        requiredTagGroups: [["bleeding_risk"], ["nsaid", "anticoagulant", "antiplatelet"]],
        minDistinctItems: 2,
        risk:
          "Bleeding-risk medications can combine, especially SSRIs/SNRIs with NSAIDs, anticoagulants, or antiplatelets.",
        warningSigns: ["black stool", "blood in stool", "vomiting blood", "easy bruising", "uncontrolled bleeding"],
        nextStep:
          "Ask about black stool, blood in stool, vomiting blood, bruising, anticoagulants, NSAID use, and bleeding history.",
        urgency: "urgent",
        highRisk: true
      },

      {
        id: "renal_injury_stack",
        label: "Kidney injury risk stack",
        requiredTagGroups: [["renal_risk"], ["nsaid", "ace_arb", "diuretic", "dehydration_risk"]],
        minDistinctItems: 2,
        risk:
          "NSAIDs, ACE/ARB medications, diuretics, dehydration, and kidney-risk medications can combine to increase kidney injury risk.",
        warningSigns: ["not peeing", "dehydration", "confusion", "severe weakness", "swelling"],
        nextStep:
          "Ask about kidney disease, dehydration, NSAID use, ACE/ARB, diuretics, urine output, and recent labs.",
        urgency: "soon",
        highRisk: false
      },

      {
        id: "hyperkalemia_stack",
        label: "High potassium risk stack",
        requiredTagGroups: [["hyperkalemia_risk"], ["hyperkalemia_risk", "potassium_sparing", "ace_arb"]],
        minDistinctItems: 2,
        risk:
          "Potassium-raising medications can combine and increase high potassium risk.",
        warningSigns: ["weakness", "palpitations", "fainting", "abnormal ECG"],
        nextStep:
          "Ask about ACE/ARB, spironolactone, potassium supplements, kidney disease, weakness, palpitations, and potassium labs.",
        urgency: "urgent",
        highRisk: true
      },

      {
        id: "hypotension_stack",
        label: "Low blood pressure risk stack",
        requiredTagGroups: [["bp_lowering"], ["bp_lowering", "diuretic", "sedative"]],
        minDistinctItems: 2,
        risk:
          "Blood-pressure-lowering medications can combine and increase dizziness, falls, or fainting risk.",
        warningSigns: ["fainting", "near fainting", "falls", "severe dizziness"],
        nextStep:
          "Ask about blood pressure readings, dizziness on standing, falls, dehydration, dose changes, and fainting.",
        urgency: "soon",
        highRisk: false
      },

      {
        id: "stimulant_activation_stack",
        label: "Stimulant / activation risk pattern",
        requiredTagGroups: [["stimulant", "activating"], ["mania_risk", "anxiety_risk", "stimulant"]],
        minDistinctItems: 1,
        risk:
          "Stimulants or activating medications can worsen anxiety, insomnia, irritability, or mania risk in susceptible people.",
        warningSigns: ["no sleep with energy", "mania", "severe anxiety", "agitation", "paranoia"],
        nextStep:
          "Ask about sleep, energy, impulsivity, anxiety, paranoia, bipolar history, stimulant dose, and recent changes.",
        urgency: "urgent",
        highRisk: false
      },

      {
        id: "anticholinergic_burden",
        label: "Anticholinergic burden pattern",
        requiredTagGroups: [["anticholinergic"], ["anticholinergic"]],
        minDistinctItems: 2,
        risk:
          "Multiple anticholinergic medications can increase confusion, constipation, urinary retention, dry mouth, blurry vision, and falls.",
        warningSigns: ["confusion", "urinary retention", "severe constipation", "overheating"],
        nextStep:
          "Ask about confusion, constipation, urinary retention, dry mouth, blurry vision, falls, and medication list.",
        urgency: "soon",
        highRisk: false
      },

      {
        id: "seizure_threshold_stack",
        label: "Seizure threshold lowering stack",
        requiredTagGroups: [["seizure_risk"], ["seizure_risk", "withdrawal_risk"]],
        minDistinctItems: 2,
        risk:
          "Some medications/substances can combine to lower seizure threshold, especially with withdrawal, overdose, or electrolyte problems.",
        warningSigns: ["seizure", "confusion", "tremor", "overdose"],
        nextStep:
          "Ask about seizure history, bupropion/tramadol/stimulants, alcohol/benzo withdrawal, overdose, and electrolyte issues.",
        urgency: "urgent",
        highRisk: true
      },

      {
        id: "hypoglycemia_stack",
        label: "Low blood sugar risk stack",
        requiredTagGroups: [["hypoglycemia_risk"], ["hypoglycemia_risk", "insulin", "sulfonylurea"]],
        minDistinctItems: 1,
        risk:
          "Insulin and some diabetes medications can cause low blood sugar, especially with missed meals, alcohol, or dose changes.",
        warningSigns: ["sweating", "shaking", "confusion", "fainting", "seizure"],
        nextStep:
          "Ask about glucose reading, diabetes meds, missed meals, alcohol, sweating, shaking, confusion, and fainting.",
        urgency: "urgent",
        highRisk: true
      },

      {
        id: "maoi_serotonin_high_risk",
        label: "MAOI / linezolid serotonergic high-risk pattern",
        requiredTagGroups: [["maoi", "linezolid"], ["serotonergic"]],
        minDistinctItems: 2,
        risk:
          "MAOIs or linezolid with serotonergic agents can create high serotonin toxicity risk.",
        warningSigns: ["fever", "rigidity", "confusion", "agitation", "diarrhea", "tremor"],
        nextStep:
          "If fever, rigidity, severe agitation, confusion, or tremor occurs with this combination, treat as urgent/emergency.",
        urgency: "emergency",
        highRisk: true
      },

      {
        id: "lithium_toxicity_risk",
        label: "Lithium toxicity risk pattern",
        requiredTagGroups: [["lithium"], ["nsaid", "ace_arb", "diuretic", "dehydration_risk", "renal_risk"]],
        minDistinctItems: 2,
        risk:
          "Lithium levels can rise with dehydration, kidney changes, NSAIDs, ACE/ARBs, or diuretics.",
        warningSigns: ["vomiting", "diarrhea", "confusion", "tremor", "unsteady gait", "seizure"],
        nextStep:
          "Ask about lithium dose, level, kidney function, dehydration, NSAIDs, ACE/ARB, diuretics, tremor, vomiting, diarrhea, and confusion.",
        urgency: "urgent",
        highRisk: true
      },

      {
        id: "cyp_metabolism_placeholder",
        label: "CYP metabolism interaction placeholder",
        requiredTagGroups: [["cyp_inhibitor", "cyp_inducer"], ["cyp_sensitive"]],
        minDistinctItems: 2,
        risk:
          "Some medications alter metabolism of other medications, increasing toxicity or reducing effectiveness.",
        warningSigns: ["new side effects after adding medication", "loss of medication effect"],
        nextStep:
          "Ask exact medication names, start dates, dose changes, and pharmacist/clinician review need.",
        urgency: "soon",
        highRisk: false
      }
    ];
  },

  detectSubstanceTags(summary = {}) {
    const text = window.Ari.medical.utils.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const tags = [];

    if (this.hasAny(text, ["alcohol", "drinking", "whiskey", "beer", "wine"])) {
      tags.push("alcohol");
    }

    if (this.hasAny(text, ["marijuana", "weed", "thc", "cannabis"])) {
      tags.push("sedative");
    }

    if (this.hasAny(text, ["missed meals", "not eating", "skipped meal"])) {
      tags.push("hypoglycemia_risk");
    }

    if (this.hasAny(text, ["dehydrated", "vomiting", "diarrhea", "not drinking water"])) {
      tags.push("dehydration_risk");
    }

    return [...new Set(tags)];
  },

  hasAny(text = "", phrases = []) {
    return phrases.some(phrase => window.Ari.medical.utils.hasTerm(text, phrase));
  },

  uniqueItems(items = []) {
    const seen = new Set();

    return items.filter(item => {
      const key = String(item.id || item.name || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

window.AriMedicalMedicationInteractionEngine =
  window.Ari.medical.medicationInteractionEngine;

console.log(
  "ARI MEDICAL MEDICATION INTERACTION ENGINE LOADED:",
  window.Ari.medical.medicationInteractionEngine.version
);