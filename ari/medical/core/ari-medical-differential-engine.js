// ari/medical/core/ari-medical-differential-engine.js
// Purpose: Generate and rank possible medical explanations from evidence without diagnosing.
// V1.0.0 — Differential Reasoning Engine / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.differentialEngine = {
  version: "1.0.0",

  build(input = {}) {
    const summary = input.summary || input || {};

    const evidencePacket =
      summary.medicalEvidence ||
      summary.evidencePacket ||
      null;

    const evidence = evidencePacket?.evidence || [];
    const redFlags = evidencePacket?.redFlags || [];
    const urgency = evidencePacket?.urgency || "routine";

    const hypotheses = this.rankHypotheses({
      evidence,
      redFlags,
      urgency
    });

    const primaryHypothesis = hypotheses[0] || null;

    return window.Ari.medical.contract.create({
      engine: "ari-medical-differential-engine",
      version: this.version,
      activated: hypotheses.length > 0,
      confidence: primaryHypothesis?.confidence || "low",
      urgency,

      primaryHypothesis,
      hypotheses,
      possibleExplanations: hypotheses,

      supportingEvidence: primaryHypothesis?.supportingEvidence || [],
      contradictingEvidence: primaryHypothesis?.contradictingEvidence || [],
      missingInformation: primaryHypothesis?.missingInformation || [],

      reasoning:
        primaryHypothesis
          ? `Most supported explanation pattern: ${primaryHypothesis.label}. This is not a diagnosis.`
          : "Not enough evidence to generate a useful differential.",

      nextStep:
        primaryHypothesis?.nextStep ||
        "Ask focused questions, screen red flags, and gather more evidence.",

      responsePosture: {
        label: "medical_differential_reasoning",
        advisoryOnly: true,
        avoidDiagnosis: true,
        presentAsPossibilities: true,
        includeWhyAndWhyNot: true,
        preserveUncertainty: true
      },

      cannotSet: [
        "diagnosis",
        "finalDiagnosis",
        "prescription",
        "medicationDoseChange",
        "ignoreEmergencyCare",
        "replaceClinician"
      ]
    });
  },

  rankHypotheses({ evidence = [], redFlags = [], urgency = "routine" } = {}) {
    const candidates = this.hypothesisTemplates();

    return candidates
      .map(template => this.scoreHypothesis(template, evidence, redFlags, urgency))
      .filter(item => item.score >= item.threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  },

  scoreHypothesis(template = {}, evidence = [], redFlags = [], urgency = "routine") {
    const evidenceText = this.combineEvidenceText(evidence);
    const redFlagText = this.combineEvidenceText(redFlags);

    const supportingEvidence = this.matchTerms(template.supports || [], evidenceText);
    const contradictingEvidence = this.matchTerms(template.against || [], evidenceText);
    const redFlagMatches = this.matchTerms(template.redFlags || [], redFlagText + " " + evidenceText);

    const score =
      supportingEvidence.length * 3 +
      redFlagMatches.length * 5 -
      contradictingEvidence.length * 2 +
      (urgency === "emergency" && template.emergencyRelevant ? 4 : 0);

    return {
      id: template.id,
      label: template.label,
      system: template.system,
      category: template.category,

      score,
      threshold: template.threshold || 3,
      confidence: score >= 12 ? "high" : score >= 7 ? "medium" : "low",

      supportingEvidence,
      contradictingEvidence,
      redFlagMatches,

      missingInformation: template.missingInformation || [],
      whyItFits: template.whyItFits,
      whyItMayNotFit: template.whyItMayNotFit,
      nextStep: template.nextStep,

      advisoryOnly: true,
      notDiagnosis: true
    };
  },

  hypothesisTemplates() {
    return [
      {
        id: "acute_coronary_syndrome_possible",
        label: "Possible acute coronary syndrome / cardiac ischemia pattern",
        system: "cardiology",
        category: "dangerous_cardiac",
        supports: [
          "chest pain",
          "chest pressure",
          "shortness of breath",
          "fainting",
          "diaphoresis",
          "radiation",
          "palpitations"
        ],
        against: [
          "reproducible with palpation",
          "sharp with movement",
          "young healthy no risk factors"
        ],
        redFlags: [
          "chest pain",
          "shortness of breath",
          "syncope",
          "blue lips"
        ],
        missingInformation: [
          "onset and duration",
          "exertional component",
          "radiation to arm/jaw/back",
          "ECG",
          "troponin",
          "cardiac risk factors"
        ],
        whyItFits:
          "Chest pain, pressure, shortness of breath, syncope, or concerning associated symptoms can fit a cardiac ischemia pattern.",
        whyItMayNotFit:
          "Some chest pain is musculoskeletal, reflux-related, anxiety-related, or pulmonary, so more evidence is needed.",
        nextStep:
          "If chest pain or shortness of breath is active, severe, or worsening, lead with emergency evaluation.",
        emergencyRelevant: true,
        threshold: 3
      },

      {
        id: "heart_failure_fluid_overload_possible",
        label: "Possible fluid overload / heart failure pattern",
        system: "cardiology",
        category: "cardiopulmonary_fluid",
        supports: [
          "shortness of breath",
          "leg edema",
          "jvd",
          "jugular vein",
          "orthopnea",
          "rapid weight gain",
          "ankle swelling"
        ],
        against: [
          "isolated anxiety",
          "no swelling",
          "no breathing symptoms"
        ],
        redFlags: [
          "shortness of breath at rest",
          "blue lips",
          "syncope",
          "chest pain"
        ],
        missingInformation: [
          "oxygen saturation",
          "blood pressure",
          "heart rate",
          "weight change",
          "orthopnea",
          "BNP",
          "kidney function",
          "chest imaging"
        ],
        whyItFits:
          "Shortness of breath with leg swelling, JVD, orthopnea, or rapid weight gain supports a fluid-overload pattern.",
        whyItMayNotFit:
          "Swelling and shortness of breath can also come from kidney, liver, venous, medication, lung, or clot-related causes.",
        nextStep:
          "Screen breathing severity, chest pain, fainting, oxygen level, and speed of swelling.",
        emergencyRelevant: true,
        threshold: 6
      },

      {
        id: "pulmonary_embolism_possible",
        label: "Possible pulmonary embolism / clot pattern",
        system: "pulmonology",
        category: "dangerous_respiratory",
        supports: [
          "shortness of breath",
          "chest pain",
          "coughing blood",
          "leg swelling",
          "calf pain",
          "fainting",
          "palpitations"
        ],
        against: [
          "gradual chronic symptoms",
          "clear infection symptoms only"
        ],
        redFlags: [
          "coughing blood",
          "syncope",
          "shortness of breath at rest",
          "blue lips"
        ],
        missingInformation: [
          "sudden onset",
          "one-sided leg swelling",
          "recent surgery",
          "immobility",
          "pregnancy/postpartum",
          "estrogen use",
          "history of clots",
          "heart rate",
          "oxygen saturation"
        ],
        whyItFits:
          "Sudden shortness of breath, chest pain, hemoptysis, fainting, or leg swelling can fit a clot pattern.",
        whyItMayNotFit:
          "Many lung, heart, infection, and anxiety patterns can overlap, so risk factors and vitals matter.",
        nextStep:
          "If symptoms are sudden, severe, or current, recommend urgent/emergency evaluation.",
        emergencyRelevant: true,
        threshold: 6
      },

      {
        id: "stroke_tia_possible",
        label: "Possible stroke / TIA pattern",
        system: "neurology",
        category: "dangerous_neurologic",
        supports: [
          "facial droop",
          "slurred speech",
          "one sided weakness",
          "new numbness",
          "vision loss",
          "confusion",
          "loss of balance"
        ],
        against: [
          "symptoms chronic unchanged",
          "bilateral tingling during panic"
        ],
        redFlags: [
          "facial droop",
          "slurred speech",
          "one sided weakness",
          "seizure"
        ],
        missingInformation: [
          "last known normal",
          "current symptoms",
          "blood glucose",
          "blood pressure",
          "anticoagulant use",
          "head trauma",
          "seizure activity"
        ],
        whyItFits:
          "New focal neurologic deficits are time-sensitive and can fit stroke/TIA patterns.",
        whyItMayNotFit:
          "Migraine, seizure, low glucose, medication effects, intoxication, or functional symptoms can mimic stroke.",
        nextStep:
          "If symptoms are new or current, emergency care now.",
        emergencyRelevant: true,
        threshold: 3
      },

      {
        id: "serious_infection_sepsis_possible",
        label: "Possible serious infection / sepsis pattern",
        system: "infectious_disease",
        category: "dangerous_infection",
        supports: [
          "fever",
          "chills",
          "confusion",
          "weakness",
          "rapid heart rate",
          "low blood pressure",
          "shortness of breath",
          "rash"
        ],
        against: [
          "no fever",
          "mild localized symptoms"
        ],
        redFlags: [
          "confusion",
          "neck stiffness",
          "blue lips",
          "low blood pressure"
        ],
        missingInformation: [
          "temperature",
          "heart rate",
          "blood pressure",
          "respiratory rate",
          "oxygen saturation",
          "source symptoms",
          "immune status",
          "lactate/CBC if clinically indicated"
        ],
        whyItFits:
          "Fever or infection symptoms with confusion, weakness, low blood pressure, breathing issues, or severe systemic symptoms can suggest serious infection risk.",
        whyItMayNotFit:
          "Many infections are mild or localized, and noninfectious inflammation can mimic infection.",
        nextStep:
          "Screen severity, vitals, immune risk, pregnancy/infant/elderly status, and mental status.",
        emergencyRelevant: true,
        threshold: 6
      },

      {
        id: "medication_side_effect_or_toxicity_possible",
        label: "Possible medication side effect, toxicity, or withdrawal pattern",
        system: "pharmacology",
        category: "medication_related",
        supports: [
          "started medication",
          "new medication",
          "changed dose",
          "stopped medication",
          "side effect",
          "dizzy after medication",
          "rash after medication",
          "withdrawal",
          "overdose"
        ],
        against: [
          "symptoms started before medication",
          "no medication change"
        ],
        redFlags: [
          "throat swelling",
          "tongue swelling",
          "trouble breathing after medication",
          "overdose"
        ],
        missingInformation: [
          "medication name",
          "dose",
          "start date",
          "recent dose changes",
          "other medications",
          "substances/alcohol",
          "allergy symptoms",
          "timing of symptoms"
        ],
        whyItFits:
          "Symptoms that begin after starting, stopping, or changing a medication may reflect side effects, toxicity, withdrawal, allergy, or interaction.",
        whyItMayNotFit:
          "The timing may be coincidental, and underlying illness can mimic medication effects.",
        nextStep:
          "Clarify medication timeline and screen for allergy, overdose, severe neurologic symptoms, and safety risk.",
        emergencyRelevant: true,
        threshold: 3
      },

      {
        id: "psychiatric_or_behavioral_crisis_possible",
        label: "Possible psychiatric or behavioral crisis pattern",
        system: "psychiatry",
        category: "mental_health_safety",
        supports: [
          "suicidal",
          "homicidal",
          "hallucinations",
          "paranoid",
          "mania",
          "not sleeping",
          "severe anxiety",
          "panic attack",
          "depressed"
        ],
        against: [
          "denies safety concerns",
          "brief mild stress"
        ],
        redFlags: [
          "suicidal",
          "homicidal",
          "overdose",
          "psychosis"
        ],
        missingInformation: [
          "danger to self",
          "danger to others",
          "plan or intent",
          "psychosis",
          "mania",
          "substance use",
          "medication changes",
          "sleep duration",
          "support available"
        ],
        whyItFits:
          "Safety concerns, psychosis, mania, severe anxiety, or mood symptoms require careful risk and medical/substance/medication screening.",
        whyItMayNotFit:
          "Behavioral symptoms can also be driven by substances, medications, sleep deprivation, endocrine issues, neurologic illness, or acute stress.",
        nextStep:
          "Safety first: ask about self-harm, harm to others, psychosis, overdose, intoxication, and immediate support.",
        emergencyRelevant: true,
        threshold: 3
      },

      {
        id: "pregnancy_complication_possible",
        label: "Possible pregnancy-related complication pattern",
        system: "obstetrics",
        category: "pregnancy",
        supports: [
          "pregnant",
          "vaginal bleeding",
          "decreased fetal movement",
          "severe headache",
          "vision changes",
          "right upper belly pain",
          "swelling pregnant",
          "shortness of breath"
        ],
        against: [
          "not pregnant"
        ],
        redFlags: [
          "vaginal bleeding",
          "decreased fetal movement",
          "severe headache",
          "vision changes",
          "syncope"
        ],
        missingInformation: [
          "gestational age",
          "bleeding amount",
          "fluid leakage",
          "fetal movement",
          "blood pressure",
          "headache/vision symptoms",
          "abdominal pain",
          "fever"
        ],
        whyItFits:
          "Pregnancy lowers the threshold for urgent evaluation when bleeding, severe headache, vision changes, swelling, abdominal pain, shortness of breath, or decreased fetal movement appear.",
        whyItMayNotFit:
          "Some symptoms can be normal pregnancy discomforts, but red flags need higher caution.",
        nextStep:
          "Recommend OB triage or same-day clinician guidance when red flags are present.",
        emergencyRelevant: true,
        threshold: 4
      },

      {
        id: "pediatric_serious_illness_possible",
        label: "Possible pediatric serious illness / dehydration pattern",
        system: "pediatrics",
        category: "pediatric",
        supports: [
          "baby",
          "infant",
          "newborn",
          "fever",
          "not feeding",
          "no wet diapers",
          "lethargic",
          "vomiting",
          "diarrhea",
          "trouble breathing"
        ],
        against: [
          "adult",
          "normal feeding",
          "normal wet diapers"
        ],
        redFlags: [
          "newborn fever",
          "lethargic",
          "blue lips",
          "seizure",
          "trouble breathing"
        ],
        missingInformation: [
          "exact age",
          "temperature",
          "feeding",
          "wet diapers/urination",
          "breathing effort",
          "alertness",
          "rash",
          "duration"
        ],
        whyItFits:
          "Infants and children can worsen faster, especially with fever, poor feeding, dehydration, lethargy, or breathing symptoms.",
        whyItMayNotFit:
          "Mild viral illness is common, but pediatric red flags change urgency.",
        nextStep:
          "Ask age, fever, feeding, wet diapers, breathing, alertness, and recommend pediatric guidance if concerning.",
        emergencyRelevant: true,
        threshold: 4
      }
    ];
  },

  combineEvidenceText(list = []) {
    return list
      .map(item => {
        if (typeof item === "string") return item;

        return [
          item.claim,
          item.label,
          item.term,
          item.type,
          item.system,
          ...(Array.isArray(item.evidence) ? item.evidence : []),
          ...(Array.isArray(item.requiredHits) ? item.requiredHits : []),
          ...(Array.isArray(item.supportingHits) ? item.supportingHits : [])
        ]
          .filter(Boolean)
          .join(" ");
      })
      .join(" ")
      .toLowerCase();
  },

  matchTerms(terms = [], text = "") {
    return terms.filter(term =>
      window.Ari.medical.utils.hasTerm(text, term)
    );
  }
};

window.AriMedicalDifferentialEngine = window.Ari.medical.differentialEngine;

console.log(
  "ARI MEDICAL DIFFERENTIAL ENGINE LOADED:",
  window.Ari.medical.differentialEngine.version
);