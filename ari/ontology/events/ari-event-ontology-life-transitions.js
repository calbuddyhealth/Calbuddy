// ari/ontology/events/ari-event-ontology-life-transitions.js
// Purpose: Life transition event definitions for Ari Event Understanding.
// V0.1.0 — Life Transition Ontology / Foundation Set

window.Ari = window.Ari || {};

window.AriEventOntologyLifeTransitions = {
  version: "0.1.0",

  definitions: [
    {
      category: "life_transition",
      type: "career_transition",
      subtype: "first_job",
      label: "First Job",
      importance: "major",
      expectedDuration: "months",
      polarity: "positive_or_mixed",
      outcome: "new_work_identity",
      stage: "starting",
      affects: ["identity", "routine", "finances", "confidence"],
      commonEmotions: ["excitement", "anxiety", "pride", "uncertainty"],
      commonNeeds: ["encouragement", "orientation", "confidence_building"],
      possibleNextEvents: ["new_schedule_adjustment", "first_paycheck", "workplace_adaptation"],
      threshold: 5,
      signals: [
        ["raw", /\b(first job|my first job|starting work for the first time)\b/, 4],
        ["domainAny", ["career", "work"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "career_transition",
      subtype: "new_job",
      label: "New Job",
      importance: "major",
      expectedDuration: "months",
      polarity: "positive_or_mixed",
      outcome: "role_change",
      stage: "starting_or_planning",
      affects: ["routine", "finances", "identity", "relationships"],
      commonEmotions: ["hope", "anxiety", "excitement", "pressure"],
      commonNeeds: ["planning", "encouragement", "adjustment_support"],
      possibleNextEvents: ["onboarding", "schedule_change", "income_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(new job|starting a new job|got a job|job offer|accepted a job)\b/, 4],
        ["domainAny", ["career", "work"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "career_transition",
      subtype: "promotion",
      label: "Promotion",
      importance: "major",
      expectedDuration: "months",
      polarity: "positive_or_mixed",
      outcome: "increased_responsibility",
      stage: "completed_or_starting",
      affects: ["identity", "finances", "status", "workload"],
      commonEmotions: ["pride", "pressure", "excitement", "imposter_syndrome"],
      commonNeeds: ["celebration", "planning", "confidence_building"],
      possibleNextEvents: ["new_responsibilities", "salary_change", "leadership_stress"],
      threshold: 5,
      signals: [
        ["raw", /\b(promoted|promotion|got promoted|made manager|advanced to)\b/, 4],
        ["domainAny", ["career", "work", "military"], 2],
        ["action", "achievement", 2]
      ]
    },

    {
      category: "life_transition",
      type: "career_transition",
      subtype: "demotion_or_role_loss",
      label: "Demotion or Role Loss",
      importance: "major",
      expectedDuration: "months",
      polarity: "negative_or_mixed",
      outcome: "reduced_role_or_status",
      stage: "active_or_recent",
      affects: ["identity", "confidence", "finances", "workplace_trust"],
      commonEmotions: ["shame", "anger", "sadness", "uncertainty"],
      commonNeeds: ["dignity", "stabilization", "next_step_planning"],
      possibleNextEvents: ["job_search", "performance_plan", "career_reassessment"],
      threshold: 5,
      signals: [
        ["raw", /\b(demoted|lost my position|removed from my role|stepped down|got replaced)\b/, 4],
        ["domainAny", ["career", "work"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "life_transition",
      type: "career_transition",
      subtype: "career_change",
      label: "Career Change",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "mixed_or_uncertain",
      outcome: "professional_identity_shift",
      stage: "planning_or_active",
      affects: ["identity", "finances", "education", "family", "routine"],
      commonEmotions: ["hope", "fear", "uncertainty", "motivation"],
      commonNeeds: ["decision_support", "planning", "risk_assessment"],
      possibleNextEvents: ["returning_to_school", "job_search", "income_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(career change|changing careers|switch careers|new career path|different field)\b/, 4],
        ["domainAny", ["career", "work", "education"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "career_transition",
      subtype: "military_separation",
      label: "Military Separation",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "mixed_or_uncertain",
      outcome: "civilian_transition",
      stage: "planning_or_active",
      affects: ["identity", "finances", "benefits", "family", "routine", "career"],
      commonEmotions: ["relief", "anxiety", "grief", "hope", "uncertainty"],
      commonNeeds: ["transition_planning", "identity_support", "benefits_navigation"],
      possibleNextEvents: ["dd214", "civilian_job_search", "school_enrollment", "reserve_transition"],
      threshold: 5,
      signals: [
        ["raw", /\b(leaving the navy|leaving the military|separating from the navy|military separation|getting out of the military|active duty|dd214|selres|eas|ets)\b/, 4],
        ["domainAny", ["military", "career", "work"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "career_transition",
      subtype: "job_loss",
      label: "Job Loss",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "negative_or_mixed",
      outcome: "employment_loss",
      stage: "active_or_recent",
      affects: ["finances", "identity", "routine", "security"],
      commonEmotions: ["fear", "anger", "shame", "uncertainty"],
      commonNeeds: ["stabilization", "financial_planning", "job_search_support"],
      possibleNextEvents: ["unemployment_claim", "job_search", "financial_pressure"],
      threshold: 5,
      signals: [
        ["raw", /\b(lost my job|got fired|laid off|let go|terminated|unemployed)\b/, 4],
        ["domainAny", ["career", "work", "finance"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "life_transition",
      type: "career_transition",
      subtype: "retirement",
      label: "Retirement",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "positive_or_mixed",
      outcome: "workforce_exit",
      stage: "planning_or_completed",
      affects: ["identity", "routine", "finances", "relationships", "purpose"],
      commonEmotions: ["relief", "uncertainty", "grief", "freedom"],
      commonNeeds: ["purpose_rebuilding", "financial_planning", "routine_design"],
      possibleNextEvents: ["identity_shift", "financial_adjustment", "new_hobbies"],
      threshold: 5,
      signals: [
        ["raw", /\b(retiring|retirement|retired|leaving work permanently)\b/, 4],
        ["domainAny", ["career", "finance", "life"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "education_transition",
      subtype: "starting_school",
      label: "Starting School",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "positive_or_mixed",
      outcome: "education_beginning",
      stage: "starting_or_planning",
      affects: ["identity", "routine", "finances", "career", "stress"],
      commonEmotions: ["excitement", "anxiety", "hope", "overwhelm"],
      commonNeeds: ["planning", "encouragement", "study_structure"],
      possibleNextEvents: ["class_schedule", "tuition_payment", "exam_stress"],
      threshold: 5,
      signals: [
        ["raw", /\b(starting school|going back to school|starting college|starting university|starting my program)\b/, 4],
        ["domainAny", ["school", "education", "career"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "education_transition",
      subtype: "graduation",
      label: "Graduation",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "education_completion",
      stage: "completed_or_upcoming",
      affects: ["identity", "career", "family", "future_planning"],
      commonEmotions: ["pride", "relief", "uncertainty", "excitement"],
      commonNeeds: ["celebration", "transition_planning", "recognition"],
      possibleNextEvents: ["job_search", "career_transition", "licensure_exam"],
      threshold: 5,
      signals: [
        ["raw", /\b(graduated|graduating|graduation|finished school|completed my degree)\b/, 4],
        ["domainAny", ["school", "education", "career"], 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "life_transition",
      type: "education_transition",
      subtype: "certification_or_license",
      label: "Certification or License",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "credential_change",
      stage: "completed_or_planning",
      affects: ["career", "identity", "confidence", "income_potential"],
      commonEmotions: ["pride", "relief", "pressure", "hope"],
      commonNeeds: ["celebration", "next_step_planning", "confidence_building"],
      possibleNextEvents: ["job_application", "promotion", "career_transition"],
      threshold: 5,
      signals: [
        ["raw", /\b(certified|certification|license|licensure|passed boards|credential|board certified)\b/, 4],
        ["domainAny", ["education", "career", "work"], 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "life_transition",
      type: "home_transition",
      subtype: "moving_home",
      label: "Moving Home",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed_or_uncertain",
      outcome: "environment_change",
      stage: "planning_or_active",
      affects: ["routine", "finances", "relationships", "stress", "identity"],
      commonEmotions: ["stress", "hope", "sadness", "excitement"],
      commonNeeds: ["planning", "logistics", "emotional_transition_support"],
      possibleNextEvents: ["packing", "lease_change", "new_commute", "social_adjustment"],
      threshold: 5,
      signals: [
        ["raw", /\b(moving|relocating|new apartment|new house|moving out|moving in)\b/, 4],
        ["domainAny", ["home", "life", "family"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "home_transition",
      subtype: "buying_home",
      label: "Buying Home",
      importance: "major",
      expectedDuration: "months",
      polarity: "positive_or_stressful",
      outcome: "housing_commitment",
      stage: "planning_or_active",
      affects: ["finances", "family", "identity", "security"],
      commonEmotions: ["excitement", "anxiety", "pressure", "pride"],
      commonNeeds: ["financial_planning", "decision_support", "risk_assessment"],
      possibleNextEvents: ["mortgage", "inspection", "moving_home"],
      threshold: 5,
      signals: [
        ["raw", /\b(buying a house|buying a home|mortgage|home purchase|offer on a house)\b/, 4],
        ["domainAny", ["home", "finance", "family"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "home_transition",
      subtype: "housing_loss",
      label: "Housing Loss",
      importance: "critical",
      expectedDuration: "days_to_months",
      polarity: "negative",
      outcome: "housing_instability",
      stage: "active_or_imminent",
      affects: ["safety", "finances", "family", "mental_health", "routine"],
      commonEmotions: ["fear", "shame", "panic", "grief"],
      commonNeeds: ["immediate_stabilization", "resources", "safety_planning"],
      possibleNextEvents: ["temporary_housing", "financial_crisis", "legal_admin_process"],
      threshold: 5,
      signals: [
        ["raw", /\b(evicted|eviction|homeless|lost my home|can't pay rent|housing crisis)\b/, 4],
        ["domainAny", ["home", "finance", "legal", "life"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "life_transition",
      type: "parenthood_transition",
      subtype: "expecting_child",
      label: "Expecting Child",
      importance: "major",
      expectedDuration: "months",
      polarity: "positive_or_mixed",
      outcome: "family_expansion",
      stage: "anticipation",
      affects: ["identity", "family", "finances", "relationship", "routine"],
      commonEmotions: ["joy", "anxiety", "protectiveness", "uncertainty"],
      commonNeeds: ["preparation", "reassurance", "planning"],
      possibleNextEvents: ["prenatal_visit", "birth_or_labor", "parenthood_role_shift"],
      threshold: 5,
      signals: [
        ["raw", /\b(pregnant|pregnancy|expecting|having a baby|baby on the way|due date|ultrasound)\b/, 4],
        ["domainAny", ["family", "health", "parenthood"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "parenthood_transition",
      subtype: "birth_or_labor",
      label: "Birth or Labor",
      importance: "critical",
      expectedDuration: "hours_to_weeks",
      polarity: "high_importance",
      outcome: "birth_event",
      stage: "active_or_imminent",
      affects: ["family", "health", "identity", "routine", "relationship"],
      commonEmotions: ["joy", "fear", "awe", "stress", "protectiveness"],
      commonNeeds: ["calm_guidance", "support", "safety_awareness"],
      possibleNextEvents: ["newborn_care", "postpartum_recovery", "sleep_disruption"],
      threshold: 5,
      signals: [
        ["raw", /\b(giving birth|labor|water broke|contractions|delivery room|baby was born|newborn)\b/, 5],
        ["domainAny", ["family", "health", "parenthood"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "parenthood_transition",
      subtype: "adoption",
      label: "Adoption",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "positive_or_mixed",
      outcome: "family_expansion",
      stage: "planning_or_completed",
      affects: ["family", "identity", "legal", "finances", "routine"],
      commonEmotions: ["hope", "anxiety", "joy", "uncertainty"],
      commonNeeds: ["process_navigation", "emotional_support", "family_preparation"],
      possibleNextEvents: ["legal_process", "home_adjustment", "parenthood_role_shift"],
      threshold: 5,
      signals: [
        ["raw", /\b(adopting|adoption|adopted a child|foster to adopt|adoption process)\b/, 4],
        ["domainAny", ["family", "legal", "parenthood"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "parenthood_transition",
      subtype: "miscarriage_or_pregnancy_loss",
      label: "Pregnancy Loss",
      importance: "critical",
      expectedDuration: "weeks_to_years",
      polarity: "negative",
      outcome: "family_loss",
      stage: "active_or_recent",
      affects: ["grief", "health", "relationship", "identity", "family"],
      commonEmotions: ["grief", "sadness", "shock", "guilt", "numbness"],
      commonNeeds: ["compassion", "safety", "grief_support", "medical_guidance"],
      possibleNextEvents: ["medical_followup", "grief_processing", "relationship_support"],
      threshold: 5,
      signals: [
        ["raw", /\b(miscarriage|pregnancy loss|lost the baby|stillbirth)\b/, 5],
        ["domainAny", ["family", "health", "grief", "parenthood"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "relationship_transition",
      subtype: "engagement",
      label: "Engagement",
      importance: "major",
      expectedDuration: "months",
      polarity: "positive_or_mixed",
      outcome: "relationship_commitment",
      stage: "completed_or_planning",
      affects: ["relationship", "family", "finances", "identity", "future_planning"],
      commonEmotions: ["joy", "excitement", "pressure", "anxiety"],
      commonNeeds: ["celebration", "planning", "values_clarification"],
      possibleNextEvents: ["wedding_planning", "financial_planning", "family_negotiation"],
      threshold: 5,
      signals: [
        ["raw", /\b(engaged|engagement|proposed|proposal|fiance|fiancée)\b/, 4],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "life_transition",
      type: "relationship_transition",
      subtype: "marriage_or_commitment",
      label: "Marriage or Commitment",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "positive_or_mixed",
      outcome: "relationship_role_change",
      stage: "completed_or_planning",
      affects: ["relationship", "family", "finances", "identity", "legal_status"],
      commonEmotions: ["joy", "pressure", "gratitude", "anxiety"],
      commonNeeds: ["celebration", "planning", "relationship_alignment"],
      possibleNextEvents: ["shared_finances", "family_planning", "legal_admin_process"],
      threshold: 5,
      signals: [
        ["raw", /\b(got married|getting married|wedding|wife|husband|spouse|marriage)\b/, 4],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "life_transition",
      type: "relationship_transition",
      subtype: "separation_or_divorce",
      label: "Separation or Divorce",
      importance: "critical",
      expectedDuration: "months_to_years",
      polarity: "negative_or_mixed",
      outcome: "relationship_dissolution",
      stage: "planning_or_active_or_recent",
      affects: ["identity", "family", "finances", "housing", "mental_health"],
      commonEmotions: ["grief", "anger", "relief", "fear", "uncertainty"],
      commonNeeds: ["stabilization", "legal_financial_planning", "emotional_support"],
      possibleNextEvents: ["housing_change", "custody_process", "financial_separation"],
      threshold: 5,
      signals: [
        ["raw", /\b(separating|separation|divorce|getting divorced|leaving my spouse|marriage ending)\b/, 4],
        ["domain", "relationship", 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "life_transition",
      type: "health_transition",
      subtype: "major_diagnosis",
      label: "Major Diagnosis",
      importance: "critical",
      expectedDuration: "months_to_years",
      polarity: "negative_or_uncertain",
      outcome: "health_identity_shift",
      stage: "active_or_recent",
      affects: ["health", "identity", "family", "finances", "future_planning"],
      commonEmotions: ["fear", "shock", "grief", "uncertainty"],
      commonNeeds: ["medical_guidance", "emotional_support", "planning"],
      possibleNextEvents: ["treatment_decision", "second_opinion", "family_conversation"],
      threshold: 5,
      signals: [
        ["raw", /\b(diagnosed with|diagnosis|cancer|stroke|heart attack|chronic illness|serious illness)\b/, 4],
        ["domain", "health", 3],
        ["knowledgeMedical", true, 1]
      ]
    },

    {
      category: "life_transition",
      type: "health_transition",
      subtype: "surgery",
      label: "Surgery",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "medical_intervention",
      stage: "planned_or_recovering",
      affects: ["health", "routine", "work", "family", "body"],
      commonEmotions: ["anxiety", "hope", "pain", "vulnerability"],
      commonNeeds: ["recovery_guidance", "reassurance", "practical_support"],
      possibleNextEvents: ["recovery", "pain_management", "follow_up_visit"],
      threshold: 5,
      signals: [
        ["raw", /\b(surgery|operation|procedure|post-op|pre-op|recovering from surgery)\b/, 4],
        ["domain", "health", 3]
      ]
    },

    {
      category: "life_transition",
      type: "health_transition",
      subtype: "recovery_or_rehabilitation",
      label: "Recovery or Rehabilitation",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed",
      outcome: "health_rebuilding",
      stage: "active",
      affects: ["health", "routine", "identity", "work", "patience"],
      commonEmotions: ["frustration", "hope", "fatigue", "impatience"],
      commonNeeds: ["encouragement", "paced_planning", "realistic_expectations"],
      possibleNextEvents: ["physical_therapy", "return_to_work", "setback_or_progress"],
      threshold: 5,
      signals: [
        ["raw", /\b(recovery|rehab|rehabilitation|physical therapy|recovering|getting better)\b/, 4],
        ["domain", "health", 2]
      ]
    },

    {
      category: "life_transition",
      type: "financial_transition",
      subtype: "bankruptcy",
      label: "Bankruptcy",
      importance: "critical",
      expectedDuration: "months_to_years",
      polarity: "negative_or_relief",
      outcome: "financial_restructuring",
      stage: "planning_or_active",
      affects: ["finances", "identity", "stress", "legal", "future_planning"],
      commonEmotions: ["shame", "relief", "fear", "uncertainty"],
      commonNeeds: ["dignity", "process_navigation", "financial_rebuild_plan"],
      possibleNextEvents: ["legal_admin_process", "credit_rebuilding", "budget_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(bankruptcy|filing bankruptcy|chapter 7|chapter 13|debt discharge)\b/, 4],
        ["domainAny", ["finance", "legal"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "financial_transition",
      subtype: "debt_free",
      label: "Becoming Debt Free",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "positive",
      outcome: "financial_relief",
      stage: "completed_or_near_completion",
      affects: ["finances", "confidence", "future_planning", "stress"],
      commonEmotions: ["relief", "pride", "hope", "freedom"],
      commonNeeds: ["celebration", "maintenance_plan", "future_planning"],
      possibleNextEvents: ["savings_plan", "major_purchase", "investment_planning"],
      threshold: 5,
      signals: [
        ["raw", /\b(debt free|paid off my debt|paid everything off|no more debt)\b/, 4],
        ["domain", "finance", 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "life_transition",
      type: "legal_transition",
      subtype: "immigration_process",
      label: "Immigration Process",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "mixed_or_stressful",
      outcome: "legal_status_process",
      stage: "active_or_planning",
      affects: ["family", "legal_status", "security", "identity", "future_planning"],
      commonEmotions: ["hope", "fear", "frustration", "uncertainty"],
      commonNeeds: ["process_navigation", "documentation", "emotional_support"],
      possibleNextEvents: ["citizenship", "visa_decision", "legal_admin_process"],
      threshold: 5,
      signals: [
        ["raw", /\b(immigration|green card|visa|uscis|deportation|citizenship application|legal status)\b/, 4],
        ["domainAny", ["legal", "government", "family"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "legal_transition",
      subtype: "citizenship",
      label: "Citizenship",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "positive_or_stressful",
      outcome: "legal_identity_change",
      stage: "planning_or_completed",
      affects: ["identity", "family", "legal_status", "security", "future_planning"],
      commonEmotions: ["hope", "pride", "anxiety", "relief"],
      commonNeeds: ["process_navigation", "celebration", "documentation_support"],
      possibleNextEvents: ["passport", "family_petition", "legal_admin_process"],
      threshold: 5,
      signals: [
        ["raw", /\b(citizenship|naturalization|becoming a citizen|citizenship interview|oath ceremony)\b/, 4],
        ["domainAny", ["legal", "government", "identity"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "identity_transition",
      subtype: "religious_or_spiritual_shift",
      label: "Religious or Spiritual Shift",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "mixed_or_meaningful",
      outcome: "belief_identity_change",
      stage: "active_or_reflective",
      affects: ["identity", "family", "values", "community", "meaning"],
      commonEmotions: ["hope", "confusion", "peace", "fear", "grief"],
      commonNeeds: ["nonjudgmental_reflection", "values_clarification", "community_navigation"],
      possibleNextEvents: ["community_change", "family_conversation", "purpose_search"],
      threshold: 5,
      signals: [
        ["raw", /\b(finding faith|lost my faith|leaving religion|coming back to church|spiritual journey|religious conversion)\b/, 4],
        ["domainAny", ["identity", "spirituality", "family"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "identity_transition",
      subtype: "purpose_search",
      label: "Purpose Search",
      importance: "major",
      expectedDuration: "weeks_to_years",
      polarity: "mixed_or_uncertain",
      outcome: "meaning_reassessment",
      stage: "active_or_reflective",
      affects: ["identity", "career", "relationships", "values", "future_planning"],
      commonEmotions: ["restlessness", "uncertainty", "hope", "sadness"],
      commonNeeds: ["reflection", "values_clarification", "small_next_step"],
      possibleNextEvents: ["career_change", "spiritual_shift", "life_reassessment"],
      threshold: 5,
      signals: [
        ["raw", /\b(what is my purpose|finding my purpose|what am i doing with my life|meaning of my life|life direction)\b/, 4],
        ["domainAny", ["identity", "life", "career"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "identity_transition",
      subtype: "midlife_or_life_reassessment",
      label: "Life Reassessment",
      importance: "major",
      expectedDuration: "weeks_to_years",
      polarity: "mixed_or_uncertain",
      outcome: "life_direction_reassessment",
      stage: "active_or_reflective",
      affects: ["identity", "career", "relationships", "health", "values"],
      commonEmotions: ["regret", "urgency", "hope", "confusion"],
      commonNeeds: ["grounding", "honest_reflection", "reversible_next_step"],
      possibleNextEvents: ["career_change", "relationship_reassessment", "health_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(midlife crisis|life reassessment|starting over|too late for me|wasted my life|change my life)\b/, 4],
        ["domainAny", ["identity", "life", "mental_health"], 2]
      ]
    }
  ]
};

window.Ari.eventOntologyLifeTransitions = window.AriEventOntologyLifeTransitions;

console.log(
  "ARI EVENT ONTOLOGY LIFE TRANSITIONS LOADED:",
  window.AriEventOntologyLifeTransitions.version
);