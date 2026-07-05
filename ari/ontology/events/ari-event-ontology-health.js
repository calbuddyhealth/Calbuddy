// ari/ontology/events/ari-event-ontology-health.js
// Purpose: Health and medical event definitions for Ari Event Understanding.
// V0.1.0 — Symptoms / Diagnosis / Treatment / Recovery / Medical Concern Ontology

window.Ari = window.Ari || {};

window.AriEventOntologyHealth = {
  version: "0.1.0",

  definitions: [
    {
      category: "health_event",
      type: "symptom",
      subtype: "new_symptom",
      label: "New Symptom",
      importance: "major",
      expectedDuration: "hours_to_days",
      polarity: "negative_or_concern",
      outcome: "health_uncertainty",
      stage: "active_or_recent",
      affects: ["health", "stress", "routine", "safety"],
      commonEmotions: ["concern", "anxiety", "uncertainty"],
      commonNeeds: ["safe_guidance", "red_flag_awareness", "clinician_boundary"],
      possibleNextEvents: ["symptom_monitoring", "doctor_visit", "urgent_evaluation"],
      threshold: 5,
      signals: [
        ["raw", /\b(new symptom|weird symptom|started having|suddenly.*pain|suddenly.*symptom)\b/, 4],
        ["domain", "health", 3],
        ["knowledgeMedical", true, 1]
      ]
    },

    {
      category: "health_event",
      type: "symptom",
      subtype: "pain",
      label: "Pain Concern",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_concern",
      outcome: "pain_or_discomfort",
      stage: "active",
      affects: ["health", "routine", "sleep", "mood"],
      commonEmotions: ["frustration", "worry", "fatigue"],
      commonNeeds: ["safe_first_steps", "red_flag_awareness", "clinician_boundary"],
      possibleNextEvents: ["doctor_visit", "self_care_attempt", "urgent_evaluation"],
      threshold: 5,
      signals: [
        ["raw", /\b(pain|hurts|aching|sharp pain|dull pain|sore|tender)\b/, 4],
        ["domain", "health", 3]
      ]
    },

    {
      category: "health_event",
      type: "symptom",
      subtype: "worsening_symptom",
      label: "Worsening Symptom",
      importance: "critical",
      expectedDuration: "hours_to_days",
      polarity: "negative_or_urgent",
      outcome: "symptom_escalation",
      stage: "active",
      affects: ["health", "safety", "stress", "routine"],
      commonEmotions: ["fear", "anxiety", "urgency"],
      commonNeeds: ["red_flag_awareness", "clinician_contact", "safety"],
      possibleNextEvents: ["urgent_care", "emergency_evaluation", "doctor_visit"],
      threshold: 5,
      signals: [
        ["raw", /\b(getting worse|worsening|more severe|severe pain|can't tolerate|unbearable)\b/, 4],
        ["domain", "health", 3],
        ["knowledgeMedical", true, 1]
      ]
    },

    {
      category: "health_event",
      type: "urgent_symptom",
      subtype: "chest_pain_or_breathing",
      label: "Chest Pain or Breathing Concern",
      importance: "critical",
      expectedDuration: "minutes_to_hours",
      polarity: "urgent",
      outcome: "potential_emergency",
      stage: "active",
      affects: ["safety", "health", "family"],
      commonEmotions: ["fear", "panic", "uncertainty"],
      commonNeeds: ["emergency_guidance", "immediate_safety", "clinician_boundary"],
      possibleNextEvents: ["emergency_services", "urgent_evaluation"],
      threshold: 5,
      signals: [
        ["raw", /\b(chest pain|trouble breathing|shortness of breath|can't breathe|difficulty breathing)\b/, 5],
        ["domain", "health", 3],
        ["knowledgeMedical", true, 2]
      ]
    },

    {
      category: "health_event",
      type: "urgent_symptom",
      subtype: "neurological_concern",
      label: "Neurological Red Flag Concern",
      importance: "critical",
      expectedDuration: "minutes_to_hours",
      polarity: "urgent",
      outcome: "potential_emergency",
      stage: "active",
      affects: ["safety", "health", "family"],
      commonEmotions: ["fear", "shock", "urgency"],
      commonNeeds: ["emergency_guidance", "red_flag_awareness", "immediate_help"],
      possibleNextEvents: ["emergency_services", "stroke_evaluation", "urgent_evaluation"],
      threshold: 5,
      signals: [
        ["raw", /\b(face drooping|slurred speech|one sided weakness|sudden weakness|stroke symptoms|confusion suddenly|worst headache)\b/, 5],
        ["domain", "health", 3],
        ["knowledgeMedical", true, 2]
      ]
    },

    {
      category: "health_event",
      type: "illness",
      subtype: "acute_illness",
      label: "Acute Illness",
      importance: "moderate_to_major",
      expectedDuration: "days_to_weeks",
      polarity: "negative_or_concern",
      outcome: "temporary_illness",
      stage: "active",
      affects: ["health", "routine", "sleep", "work"],
      commonEmotions: ["fatigue", "frustration", "worry"],
      commonNeeds: ["symptom_care", "rest", "red_flag_awareness"],
      possibleNextEvents: ["recovery", "doctor_visit", "missed_work"],
      threshold: 5,
      signals: [
        ["raw", /\b(sick|cold|flu|fever|cough|infection|virus|stomach bug)\b/, 4],
        ["domain", "health", 3]
      ]
    },

    {
      category: "health_event",
      type: "diagnosis",
      subtype: "new_diagnosis",
      label: "New Diagnosis",
      importance: "critical",
      expectedDuration: "weeks_to_years",
      polarity: "negative_or_uncertain",
      outcome: "health_identity_change",
      stage: "new_information",
      affects: ["health", "identity", "family", "future_planning", "finances"],
      commonEmotions: ["shock", "fear", "grief", "uncertainty"],
      commonNeeds: ["understanding", "medical_followup", "emotional_support"],
      possibleNextEvents: ["treatment_decision", "second_opinion", "lifestyle_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(diagnosed with|diagnosis|doctor said I have|found out I have|new diagnosis)\b/, 4],
        ["domain", "health", 3],
        ["knowledgeMedical", true, 1]
      ]
    },

    {
      category: "health_event",
      type: "diagnosis",
      subtype: "serious_diagnosis",
      label: "Serious Diagnosis",
      importance: "critical",
      expectedDuration: "months_to_years",
      polarity: "negative_or_uncertain",
      outcome: "major_health_change",
      stage: "new_or_active",
      affects: ["health", "identity", "family", "work", "future_planning"],
      commonEmotions: ["fear", "grief", "shock", "numbness"],
      commonNeeds: ["medical_support", "emotional_support", "planning"],
      possibleNextEvents: ["treatment_plan", "family_conversation", "second_opinion"],
      threshold: 5,
      signals: [
        ["raw", /\b(cancer|heart attack|stroke|kidney failure|tumor|serious illness|life threatening)\b/, 5],
        ["domain", "health", 3],
        ["knowledgeMedical", true, 2]
      ]
    },

    {
      category: "health_event",
      type: "appointment",
      subtype: "doctor_visit",
      label: "Doctor Visit",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "neutral_or_mixed",
      outcome: "medical_evaluation",
      stage: "planned_or_recent",
      affects: ["health", "stress", "routine"],
      commonEmotions: ["anxiety", "hope", "uncertainty", "relief"],
      commonNeeds: ["question_list", "preparation", "followup_clarity"],
      possibleNextEvents: ["diagnosis", "lab_results", "treatment_plan"],
      threshold: 5,
      signals: [
        ["raw", /\b(doctor appointment|doctor visit|seeing my doctor|clinic appointment|medical appointment)\b/, 4],
        ["domain", "health", 3]
      ]
    },

    {
      category: "health_event",
      type: "appointment",
      subtype: "lab_or_test_result",
      label: "Lab or Test Result",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "neutral_or_concern",
      outcome: "medical_information_received",
      stage: "recent_or_pending",
      affects: ["health", "stress", "future_planning"],
      commonEmotions: ["anxiety", "relief", "confusion", "fear"],
      commonNeeds: ["interpretation_boundary", "clinician_followup", "calm_context"],
      possibleNextEvents: ["diagnosis", "treatment_plan", "repeat_testing"],
      threshold: 5,
      signals: [
        ["raw", /\b(lab results|blood work|test results|mri results|ct results|ultrasound results|xray results)\b/, 4],
        ["domain", "health", 3],
        ["knowledgeMedical", true, 1]
      ]
    },

    {
      category: "health_event",
      type: "treatment",
      subtype: "new_medication",
      label: "New Medication",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "neutral_or_mixed",
      outcome: "medication_change",
      stage: "starting_or_recent",
      affects: ["health", "routine", "side_effects", "confidence"],
      commonEmotions: ["hope", "concern", "uncertainty"],
      commonNeeds: ["safe_medication_boundary", "side_effect_awareness", "clinician_guidance"],
      possibleNextEvents: ["side_effect", "symptom_improvement", "followup_visit"],
      threshold: 5,
      signals: [
        ["raw", /\b(started medication|new medication|prescribed|doctor gave me|started taking)\b/, 4],
        ["domain", "health", 3],
        ["knowledgeMedical", true, 1]
      ]
    },

    {
      category: "health_event",
      type: "treatment",
      subtype: "medication_side_effect",
      label: "Medication Side Effect",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_concern",
      outcome: "possible_medication_effect",
      stage: "active_or_recent",
      affects: ["health", "routine", "stress", "treatment_adherence"],
      commonEmotions: ["worry", "frustration", "confusion"],
      commonNeeds: ["clinician_boundary", "safety_awareness", "symptom_tracking"],
      possibleNextEvents: ["doctor_contact", "dose_question", "medication_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(side effect|side effects|reaction to medication|after taking.*felt|medication made me)\b/, 4],
        ["domain", "health", 3],
        ["knowledgeMedical", true, 2]
      ]
    },

    {
      category: "health_event",
      type: "treatment",
      subtype: "surgery_planned",
      label: "Planned Surgery",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "mixed_or_stressful",
      outcome: "planned_medical_procedure",
      stage: "anticipated",
      affects: ["health", "work", "family", "routine", "anxiety"],
      commonEmotions: ["anxiety", "hope", "fear", "vulnerability"],
      commonNeeds: ["preparation", "recovery_plan", "reassurance"],
      possibleNextEvents: ["surgery", "postoperative_recovery", "pain_management"],
      threshold: 5,
      signals: [
        ["raw", /\b(surgery scheduled|upcoming surgery|having surgery|operation scheduled|procedure coming up)\b/, 4],
        ["domain", "health", 3]
      ]
    },

    {
      category: "health_event",
      type: "treatment",
      subtype: "postoperative_recovery",
      label: "Postoperative Recovery",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "mixed",
      outcome: "recovery_after_procedure",
      stage: "active",
      affects: ["health", "pain", "routine", "work", "sleep"],
      commonEmotions: ["fatigue", "relief", "frustration", "vulnerability"],
      commonNeeds: ["recovery_guidance", "red_flag_awareness", "patience"],
      possibleNextEvents: ["pain_management", "followup_visit", "return_to_work"],
      threshold: 5,
      signals: [
        ["raw", /\b(after surgery|post-op|postoperative|recovering from surgery|surgery recovery)\b/, 4],
        ["domain", "health", 3]
      ]
    },

    {
      category: "health_event",
      type: "recovery",
      subtype: "symptom_improving",
      label: "Symptom Improving",
      importance: "moderate",
      expectedDuration: "days_to_weeks",
      polarity: "positive",
      outcome: "health_improvement",
      stage: "active_or_recent",
      affects: ["health", "mood", "confidence", "routine"],
      commonEmotions: ["relief", "hope", "gratitude"],
      commonNeeds: ["reinforcement", "continued_monitoring", "reasonable_expectations"],
      possibleNextEvents: ["recovery", "return_to_work", "maintenance"],
      threshold: 5,
      signals: [
        ["raw", /\b(feeling better|symptoms improving|getting better|pain is better|starting to recover)\b/, 4],
        ["domain", "health", 3],
        ["polarity", "positive", 1]
      ]
    },

    {
      category: "health_event",
      type: "recovery",
      subtype: "rehabilitation",
      label: "Rehabilitation",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed",
      outcome: "function_rebuilding",
      stage: "active",
      affects: ["health", "routine", "identity", "work", "patience"],
      commonEmotions: ["frustration", "hope", "fatigue", "impatience"],
      commonNeeds: ["paced_plan", "encouragement", "realistic_expectations"],
      possibleNextEvents: ["physical_therapy", "return_to_activity", "setback"],
      threshold: 5,
      signals: [
        ["raw", /\b(rehab|rehabilitation|physical therapy|pt exercises|recovering function)\b/, 4],
        ["domain", "health", 3]
      ]
    },

    {
      category: "health_event",
      type: "chronic_health",
      subtype: "chronic_condition_management",
      label: "Chronic Condition Management",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "mixed_or_stressful",
      outcome: "ongoing_health_management",
      stage: "ongoing",
      affects: ["health", "identity", "routine", "finances", "mood"],
      commonEmotions: ["frustration", "acceptance", "fatigue", "hope"],
      commonNeeds: ["routine_design", "clinician_partnership", "self_compassion"],
      possibleNextEvents: ["flare_up", "medication_change", "lifestyle_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(chronic illness|chronic condition|manage my condition|long term condition|ongoing medical)\b/, 4],
        ["domain", "health", 3]
      ]
    },

    {
      category: "health_event",
      type: "chronic_health",
      subtype: "flare_up",
      label: "Health Flare-Up",
      importance: "major",
      expectedDuration: "days_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "condition_worsening",
      stage: "active",
      affects: ["health", "routine", "mood", "work", "sleep"],
      commonEmotions: ["frustration", "fear", "fatigue", "discouragement"],
      commonNeeds: ["symptom_tracking", "clinician_boundary", "pacing"],
      possibleNextEvents: ["doctor_visit", "medication_change", "recovery"],
      threshold: 5,
      signals: [
        ["raw", /\b(flare up|flare-up|condition flaring|symptoms came back|flare)\b/, 4],
        ["domain", "health", 3]
      ]
    },

    {
      category: "health_event",
      type: "body_function",
      subtype: "sleep_problem",
      label: "Sleep Problem",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "sleep_disruption",
      stage: "active",
      affects: ["sleep", "mood", "health", "work", "relationships"],
      commonEmotions: ["frustration", "fatigue", "anxiety", "irritability"],
      commonNeeds: ["sleep_hygiene", "medical_boundary", "routine_review"],
      possibleNextEvents: ["fatigue", "mood_change", "doctor_visit"],
      threshold: 5,
      signals: [
        ["raw", /\b(can't sleep|insomnia|trouble sleeping|not sleeping|sleep problem|waking up all night)\b/, 4],
        ["domainAny", ["health", "sleep", "mental_health"], 2]
      ]
    },

    {
      category: "health_event",
      type: "body_function",
      subtype: "fatigue",
      label: "Fatigue",
      importance: "moderate_to_major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "low_energy",
      stage: "active",
      affects: ["health", "work", "mood", "exercise", "relationships"],
      commonEmotions: ["frustration", "discouragement", "worry"],
      commonNeeds: ["cause_review", "routine_adjustment", "clinician_boundary"],
      possibleNextEvents: ["doctor_visit", "sleep_problem", "burnout"],
      threshold: 5,
      signals: [
        ["raw", /\b(fatigued|fatigue|tired all the time|low energy|exhausted physically)\b/, 4],
        ["domainAny", ["health", "sleep", "work"], 2]
      ]
    },

    {
      category: "health_event",
      type: "body_function",
      subtype: "digestive_issue",
      label: "Digestive Issue",
      importance: "moderate",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_concern",
      outcome: "digestive_discomfort",
      stage: "active",
      affects: ["health", "comfort", "routine", "diet"],
      commonEmotions: ["discomfort", "concern", "frustration"],
      commonNeeds: ["safe_guidance", "red_flag_awareness", "hydration_or_diet_context"],
      possibleNextEvents: ["doctor_visit", "symptom_monitoring", "diet_adjustment"],
      threshold: 5,
      signals: [
        ["raw", /\b(stomach pain|diarrhea|constipation|nausea|vomiting|heartburn|acid reflux)\b/, 4],
        ["domain", "health", 3]
      ]
    },

    {
      category: "health_event",
      type: "injury",
      subtype: "acute_injury",
      label: "Acute Injury",
      importance: "major",
      expectedDuration: "days_to_weeks",
      polarity: "negative_or_concern",
      outcome: "physical_injury",
      stage: "active_or_recent",
      affects: ["health", "mobility", "work", "exercise", "routine"],
      commonEmotions: ["frustration", "fear", "pain", "impatience"],
      commonNeeds: ["safe_first_steps", "red_flag_awareness", "recovery_plan"],
      possibleNextEvents: ["doctor_visit", "rehabilitation", "activity_limitation"],
      threshold: 5,
      signals: [
        ["raw", /\b(injured|injury|sprained|twisted|pulled muscle|hurt my back|hurt my knee)\b/, 4],
        ["domain", "health", 3]
      ]
    },

    {
      category: "health_event",
      type: "fitness_health",
      subtype: "exercise_related_pain",
      label: "Exercise-Related Pain",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "activity_related_discomfort",
      stage: "active_or_recent",
      affects: ["exercise", "health", "confidence", "routine"],
      commonEmotions: ["frustration", "worry", "impatience"],
      commonNeeds: ["safe_modification", "red_flag_awareness", "recovery_pacing"],
      possibleNextEvents: ["rest", "rehabilitation", "doctor_visit"],
      threshold: 5,
      signals: [
        ["raw", /\b(pain after workout|hurt while lifting|squat pain|running pain|exercise injury|gym injury)\b/, 4],
        ["domainAny", ["health", "fitness", "exercise"], 2]
      ]
    },

    {
      category: "health_event",
      type: "preventive_health",
      subtype: "vaccination_or_screening",
      label: "Vaccination or Screening",
      importance: "moderate",
      expectedDuration: "hours_to_weeks",
      polarity: "neutral_or_positive",
      outcome: "preventive_care",
      stage: "planned_or_completed",
      affects: ["health", "routine", "risk_reduction"],
      commonEmotions: ["relief", "uncertainty", "mild_anxiety"],
      commonNeeds: ["information", "expectations", "followup_clarity"],
      possibleNextEvents: ["side_effect", "test_result", "followup_visit"],
      threshold: 5,
      signals: [
        ["raw", /\b(vaccine|vaccination|booster|screening|colonoscopy|mammogram|annual physical)\b/, 4],
        ["domain", "health", 3]
      ]
    },

    {
      category: "health_event",
      type: "health_behavior",
      subtype: "lifestyle_change",
      label: "Health Lifestyle Change",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "health_behavior_change",
      stage: "planning_or_active",
      affects: ["health", "identity", "routine", "confidence"],
      commonEmotions: ["motivation", "pressure", "hope", "frustration"],
      commonNeeds: ["realistic_plan", "accountability", "non_perfectionism"],
      possibleNextEvents: ["weight_change", "fitness_goal", "habit_relapse"],
      threshold: 5,
      signals: [
        ["raw", /\b(lifestyle change|eat healthier|start exercising|lose weight|health goal|change my habits)\b/, 4],
        ["domainAny", ["health", "fitness", "nutrition"], 2]
      ]
    },

    {
      category: "health_event",
      type: "weight_health",
      subtype: "weight_loss_goal",
      label: "Weight Loss Goal",
      importance: "moderate_to_major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "body_weight_goal",
      stage: "planning_or_active",
      affects: ["health", "confidence", "routine", "nutrition"],
      commonEmotions: ["motivation", "frustration", "hope", "self_criticism"],
      commonNeeds: ["realistic_plan", "accountability", "self_compassion"],
      possibleNextEvents: ["diet_change", "exercise_plan", "plateau"],
      threshold: 5,
      signals: [
        ["raw", /\b(lose weight|weight loss|cut weight|drop pounds|calorie deficit)\b/, 4],
        ["domainAny", ["health", "fitness", "nutrition"], 2]
      ]
    },

    {
      category: "health_event",
      type: "reproductive_health",
      subtype: "pregnancy_related_health_question",
      label: "Pregnancy-Related Health Question",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "concern_or_mixed",
      outcome: "pregnancy_health_uncertainty",
      stage: "active_or_question",
      affects: ["health", "family", "stress", "safety"],
      commonEmotions: ["worry", "protectiveness", "uncertainty"],
      commonNeeds: ["safe_guidance", "clinician_boundary", "red_flags"],
      possibleNextEvents: ["ob_contact", "symptom_monitoring", "prenatal_visit"],
      threshold: 5,
      signals: [
        ["raw", /\b(pregnant|pregnancy|weeks pregnant|baby moving|pregnancy pain|obgyn|ob-gyn)\b/, 4],
        ["domainAny", ["health", "family", "parenthood"], 2],
        ["knowledgeMedical", true, 1]
      ]
    },

    {
      category: "health_event",
      type: "child_health",
      subtype: "baby_or_child_symptom",
      label: "Baby or Child Symptom",
      importance: "critical",
      expectedDuration: "hours_to_days",
      polarity: "negative_or_concern",
      outcome: "child_health_uncertainty",
      stage: "active",
      affects: ["health", "family", "stress", "safety"],
      commonEmotions: ["fear", "protectiveness", "anxiety"],
      commonNeeds: ["pediatric_boundary", "red_flags", "calm_guidance"],
      possibleNextEvents: ["pediatrician_contact", "urgent_care", "home_monitoring"],
      threshold: 5,
      signals: [
        ["raw", /\b(baby.*fever|child.*fever|baby sick|kid sick|baby rash|baby breathing|newborn.*symptom)\b/, 4],
        ["domainAny", ["health", "family", "parenthood"], 2],
        ["knowledgeMedical", true, 1]
      ]
    },

    {
      category: "health_event",
      type: "health_anxiety",
      subtype: "worry_about_symptom",
      label: "Worry About Symptom",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "health_worry",
      stage: "active",
      affects: ["stress", "sleep", "health", "attention"],
      commonEmotions: ["anxiety", "fear", "rumination"],
      commonNeeds: ["grounding", "red_flag_filter", "clinician_boundary"],
      possibleNextEvents: ["doctor_visit", "symptom_monitoring", "reassurance_seeking"],
      threshold: 5,
      signals: [
        ["raw", /\b(worried about.*symptom|scared it might be|health anxiety|am I dying|is this serious)\b/, 4],
        ["domainAny", ["health", "mental_health"], 2],
        ["emotion", "anxiety", 1]
      ]
    },

    {
      category: "health_event",
      type: "substance_health",
      subtype: "alcohol_concern",
      label: "Alcohol Concern",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "substance_use_concern",
      stage: "active_or_reflective",
      affects: ["health", "mood", "relationships", "safety", "goals"],
      commonEmotions: ["shame", "concern", "defensiveness", "motivation"],
      commonNeeds: ["nonjudgmental_reflection", "harm_reduction", "support_options"],
      possibleNextEvents: ["cutting_back", "blackout_event", "support_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(drinking too much|alcohol problem|blackout|hungover|cut back drinking|stop drinking)\b/, 4],
        ["domainAny", ["health", "mental_health", "substance_use"], 2]
      ]
    },

    {
      category: "health_event",
      type: "health_system",
      subtype: "medical_access_issue",
      label: "Medical Access Issue",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_stressful",
      outcome: "care_access_barrier",
      stage: "active",
      affects: ["health", "stress", "finances", "safety"],
      commonEmotions: ["frustration", "fear", "helplessness"],
      commonNeeds: ["navigation", "resource_options", "advocacy_language"],
      possibleNextEvents: ["doctor_visit", "insurance_issue", "urgent_care"],
      threshold: 5,
      signals: [
        ["raw", /\b(can't get an appointment|doctor won't see me|insurance denied|can't afford doctor|no access to care)\b/, 4],
        ["domainAny", ["health", "finance", "legal"], 2]
      ]
    }
  ]
};

window.Ari.eventOntologyHealth = window.AriEventOntologyHealth;

console.log(
  "ARI EVENT ONTOLOGY HEALTH LOADED:",
  window.AriEventOntologyHealth.version
);