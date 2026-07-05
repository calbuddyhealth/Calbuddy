// ari/ontology/events/ari-event-ontology-career-military.js
// Purpose: Career, work, and military event definitions for Ari Event Understanding.
// V0.1.0 — Career / Workplace / Leadership / Military Transition Ontology

window.Ari = window.Ari || {};

window.AriEventOntologyCareerMilitary = {
  version: "0.1.0",

  definitions: [
    {
      category: "career_military_event",
      type: "job_search",
      subtype: "starting_job_search",
      label: "Starting Job Search",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed_or_uncertain",
      outcome: "employment_search_beginning",
      stage: "planning_or_active",
      affects: ["finances", "identity", "future_planning", "stress"],
      commonEmotions: ["hope", "anxiety", "uncertainty", "motivation"],
      commonNeeds: ["strategy", "resume_support", "confidence_building"],
      possibleNextEvents: ["job_application", "interview", "rejection", "job_offer"],
      threshold: 5,
      signals: [
        ["raw", /\b(job search|looking for a job|start applying|finding a job|job hunt)\b/, 4],
        ["domainAny", ["career", "work", "finance"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "job_search",
      subtype: "job_application",
      label: "Job Application",
      importance: "moderate_to_major",
      expectedDuration: "days_to_weeks",
      polarity: "neutral_or_mixed",
      outcome: "employment_opportunity_attempt",
      stage: "active_or_recent",
      affects: ["career", "confidence", "future_planning", "finances"],
      commonEmotions: ["hope", "pressure", "anxiety", "anticipation"],
      commonNeeds: ["document_quality", "position_fit", "follow_up_plan"],
      possibleNextEvents: ["interview_invitation", "rejection", "job_offer"],
      threshold: 5,
      signals: [
        ["raw", /\b(applied for a job|job application|submitted my application|usa jobs|resume submitted)\b/, 4],
        ["domainAny", ["career", "work"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "job_search",
      subtype: "interview",
      label: "Job Interview",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "mixed_or_stressful",
      outcome: "employment_evaluation",
      stage: "planned_or_recent",
      affects: ["confidence", "career", "finances", "identity"],
      commonEmotions: ["anxiety", "hope", "pressure", "excitement"],
      commonNeeds: ["preparation", "rehearsal", "confidence_building"],
      possibleNextEvents: ["job_offer", "rejection", "second_interview"],
      threshold: 5,
      signals: [
        ["raw", /\b(job interview|interview tomorrow|interviewed for|second interview|panel interview)\b/, 4],
        ["domainAny", ["career", "work"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "job_search",
      subtype: "job_offer",
      label: "Job Offer",
      importance: "major",
      expectedDuration: "days_to_weeks",
      polarity: "positive_or_mixed",
      outcome: "employment_opportunity",
      stage: "recent_or_decision",
      affects: ["finances", "career", "identity", "family", "routine"],
      commonEmotions: ["relief", "excitement", "anxiety", "uncertainty"],
      commonNeeds: ["decision_support", "negotiation", "risk_assessment"],
      possibleNextEvents: ["salary_negotiation", "new_job", "relocation"],
      threshold: 5,
      signals: [
        ["raw", /\b(got a job offer|offered me the job|received an offer|tentative offer|final offer)\b/, 4],
        ["domainAny", ["career", "work"], 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "career_military_event",
      type: "job_search",
      subtype: "job_rejection",
      label: "Job Rejection",
      importance: "moderate_to_major",
      expectedDuration: "days_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "employment_opportunity_loss",
      stage: "recent",
      affects: ["confidence", "finances", "future_planning", "identity"],
      commonEmotions: ["disappointment", "shame", "frustration", "uncertainty"],
      commonNeeds: ["perspective", "resume_adjustment", "next_application_plan"],
      possibleNextEvents: ["job_search", "resume_revision", "career_reassessment"],
      threshold: 5,
      signals: [
        ["raw", /\b(didn't get the job|rejected from the job|job rejection|not selected|not referred)\b/, 4],
        ["domainAny", ["career", "work"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "career_military_event",
      type: "workplace_stress",
      subtype: "burnout",
      label: "Work Burnout",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "negative_or_mixed",
      outcome: "work_depletion",
      stage: "active_or_ongoing",
      affects: ["health", "mood", "relationship", "performance", "identity"],
      commonEmotions: ["exhaustion", "resentment", "numbness", "irritability"],
      commonNeeds: ["stabilization", "boundaries", "recovery_plan"],
      possibleNextEvents: ["career_change", "performance_issue", "health_concern"],
      threshold: 5,
      signals: [
        ["raw", /\b(work burnout|burned out at work|burnt out at work|exhausted from work|can't keep doing this job)\b/, 4],
        ["domainAny", ["work", "career", "health"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "workplace_stress",
      subtype: "toxic_work_environment",
      label: "Toxic Work Environment",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "negative",
      outcome: "workplace_distress",
      stage: "active_or_ongoing",
      affects: ["mental_health", "performance", "confidence", "career"],
      commonEmotions: ["anger", "dread", "anxiety", "helplessness"],
      commonNeeds: ["documentation", "boundaries", "exit_or_escalation_plan"],
      possibleNextEvents: ["job_search", "hr_report", "leadership_conflict"],
      threshold: 5,
      signals: [
        ["raw", /\b(toxic work|toxic workplace|hostile work environment|workplace bullying|bad leadership)\b/, 4],
        ["domainAny", ["work", "career"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "career_military_event",
      type: "workplace_stress",
      subtype: "workload_overload",
      label: "Workload Overload",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "capacity_exceeded",
      stage: "active",
      affects: ["stress", "sleep", "performance", "relationship", "health"],
      commonEmotions: ["overwhelm", "fatigue", "irritability", "pressure"],
      commonNeeds: ["prioritization", "delegation", "boundary_setting"],
      possibleNextEvents: ["burnout", "performance_issue", "support_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(too much work|workload|overloaded at work|short staffed|understaffed|drowning at work)\b/, 4],
        ["domainAny", ["work", "career", "health"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "workplace_relationship",
      subtype: "coworker_conflict",
      label: "Coworker Conflict",
      importance: "moderate_to_major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "workplace_tension",
      stage: "active_or_recent",
      affects: ["stress", "performance", "team_trust", "mood"],
      commonEmotions: ["frustration", "anger", "anxiety", "resentment"],
      commonNeeds: ["communication_strategy", "documentation", "boundary_setting"],
      possibleNextEvents: ["supervisor_conversation", "team_repair", "hr_report"],
      threshold: 5,
      signals: [
        ["raw", /\b(coworker conflict|fight with coworker|coworker drama|someone at work|work drama)\b/, 4],
        ["domainAny", ["work", "career"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "workplace_relationship",
      subtype: "boss_or_leader_conflict",
      label: "Boss or Leader Conflict",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "authority_conflict",
      stage: "active_or_recent",
      affects: ["career", "confidence", "stress", "job_security"],
      commonEmotions: ["anxiety", "anger", "helplessness", "defensiveness"],
      commonNeeds: ["strategy", "documentation", "professional_language"],
      possibleNextEvents: ["performance_issue", "hr_report", "job_search"],
      threshold: 5,
      signals: [
        ["raw", /\b(boss|manager|supervisor|chief|officer|leader).*\b(conflict|mad|unfair|targeting|problem)\b/, 4],
        ["domainAny", ["work", "career", "military"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "performance_event",
      subtype: "performance_praise",
      label: "Performance Praise",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "positive",
      outcome: "work_recognition",
      stage: "recent",
      affects: ["confidence", "career", "motivation", "identity"],
      commonEmotions: ["pride", "relief", "motivation", "gratitude"],
      commonNeeds: ["celebration", "confidence_integration", "momentum"],
      possibleNextEvents: ["promotion", "new_responsibility", "award"],
      threshold: 5,
      signals: [
        ["raw", /\b(got praised|recognized at work|good eval|good evaluation|boss complimented|great feedback)\b/, 4],
        ["domainAny", ["work", "career", "military"], 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "career_military_event",
      type: "performance_event",
      subtype: "performance_criticism",
      label: "Performance Criticism",
      importance: "major",
      expectedDuration: "days_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "work_feedback_stress",
      stage: "recent_or_active",
      affects: ["confidence", "job_security", "stress", "identity"],
      commonEmotions: ["shame", "defensiveness", "anxiety", "anger"],
      commonNeeds: ["grounding", "feedback_interpretation", "improvement_plan"],
      possibleNextEvents: ["performance_plan", "supervisor_conversation", "career_reassessment"],
      threshold: 5,
      signals: [
        ["raw", /\b(criticized at work|bad feedback|bad eval|performance issue|written up|counseled)\b/, 4],
        ["domainAny", ["work", "career", "military"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "career_military_event",
      type: "leadership_event",
      subtype: "new_leadership_role",
      label: "New Leadership Role",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "leadership_responsibility",
      stage: "starting_or_active",
      affects: ["identity", "confidence", "workload", "team_trust"],
      commonEmotions: ["pride", "pressure", "anxiety", "motivation"],
      commonNeeds: ["leadership_framework", "confidence", "prioritization"],
      possibleNextEvents: ["team_conflict", "performance_praise", "burnout"],
      threshold: 5,
      signals: [
        ["raw", /\b(new leadership role|became lead|charge nurse|team lead|supervisor role|leading a team)\b/, 4],
        ["domainAny", ["work", "career", "military"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "leadership_event",
      subtype: "leading_difficult_team",
      label: "Leading a Difficult Team",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed_or_stressful",
      outcome: "leadership_challenge",
      stage: "active",
      affects: ["stress", "confidence", "team_trust", "performance"],
      commonEmotions: ["frustration", "pressure", "self_doubt", "determination"],
      commonNeeds: ["communication_strategy", "boundaries", "leadership_plan"],
      possibleNextEvents: ["team_repair", "performance_issue", "burnout"],
      threshold: 5,
      signals: [
        ["raw", /\b(team won't listen|hard to lead|difficult team|leading is hard|staff problem|sailors problem)\b/, 4],
        ["domainAny", ["work", "career", "military"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "career_decision",
      subtype: "stay_or_leave_job",
      label: "Stay or Leave Job Decision",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "mixed_or_uncertain",
      outcome: "career_decision_point",
      stage: "active_or_reflective",
      affects: ["finances", "identity", "family", "career", "stress"],
      commonEmotions: ["confusion", "fear", "hope", "guilt"],
      commonNeeds: ["decision_support", "tradeoff_analysis", "next_step"],
      possibleNextEvents: ["job_search", "resignation", "promotion", "career_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(should I quit|stay or leave my job|leave this job|keep this job|job decision)\b/, 4],
        ["domainAny", ["work", "career"], 2],
        ["speechAct", "question", 1]
      ]
    },

    {
      category: "career_military_event",
      type: "career_decision",
      subtype: "school_vs_work_decision",
      label: "School vs Work Decision",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed_or_uncertain",
      outcome: "career_education_tradeoff",
      stage: "active_or_planning",
      affects: ["career", "finances", "family", "identity", "future_planning"],
      commonEmotions: ["uncertainty", "pressure", "hope", "fear"],
      commonNeeds: ["tradeoff_analysis", "financial_planning", "values_clarity"],
      possibleNextEvents: ["returning_to_school", "job_offer", "resignation"],
      threshold: 5,
      signals: [
        ["raw", /\b(school or work|job versus school|work versus school|quit work for school|go to school instead of working)\b/, 4],
        ["domainAny", ["career", "education", "finance"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "military_transition",
      subtype: "separation_planning",
      label: "Military Separation Planning",
      importance: "critical",
      expectedDuration: "months_to_years",
      polarity: "mixed_or_uncertain",
      outcome: "active_duty_exit_planning",
      stage: "planning_or_active",
      affects: ["identity", "career", "benefits", "finances", "family", "routine"],
      commonEmotions: ["relief", "anxiety", "hope", "grief", "uncertainty"],
      commonNeeds: ["transition_plan", "benefits_navigation", "career_strategy"],
      possibleNextEvents: ["dd214", "civilian_job_search", "reserve_transition", "school_enrollment"],
      threshold: 5,
      signals: [
        ["raw", /\b(separating from the navy|leaving active duty|getting out of the military|military separation|separation orders|transitioning out)\b/, 5],
        ["domainAny", ["military", "career", "finance"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "military_transition",
      subtype: "dd214_or_separation_documents",
      label: "DD214 or Separation Documents",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "neutral_or_stressful",
      outcome: "transition_documentation",
      stage: "active_or_planning",
      affects: ["benefits", "career", "legal_admin", "future_planning"],
      commonEmotions: ["stress", "relief", "confusion", "urgency"],
      commonNeeds: ["process_navigation", "document_checklist", "timeline_clarity"],
      possibleNextEvents: ["civilian_job_application", "va_benefits", "reserve_transition"],
      threshold: 5,
      signals: [
        ["raw", /\b(dd214|separation documents|separation paperwork|checkout sheet|final physical|tap class)\b/, 4],
        ["domainAny", ["military", "legal", "admin", "career"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "military_transition",
      subtype: "reserve_transition",
      label: "Reserve Transition",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "mixed_or_uncertain",
      outcome: "reserve_component_transition",
      stage: "planning_or_active",
      affects: ["career", "identity", "benefits", "routine", "family"],
      commonEmotions: ["hope", "uncertainty", "relief", "pressure"],
      commonNeeds: ["requirements_clarity", "bonus_navigation", "schedule_planning"],
      possibleNextEvents: ["drill_schedule", "bonus_question", "civilian_job_balance"],
      threshold: 5,
      signals: [
        ["raw", /\b(selres|reserves|reserve transition|navy reserve|drilling reserve|reserve bonus)\b/, 4],
        ["domainAny", ["military", "career"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "military_admin",
      subtype: "pcs_or_orders",
      label: "PCS or Orders",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed_or_stressful",
      outcome: "military_location_or_assignment_change",
      stage: "planned_or_changed",
      affects: ["family", "housing", "career", "finances", "routine"],
      commonEmotions: ["stress", "uncertainty", "excitement", "frustration"],
      commonNeeds: ["logistics", "timeline_clarity", "family_planning"],
      possibleNextEvents: ["relocation", "orders_change", "housing_search"],
      threshold: 5,
      signals: [
        ["raw", /\b(pcs|orders|new orders|orders changed|orders canceled|duty station|detailing)\b/, 4],
        ["domainAny", ["military", "career", "family"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "military_career",
      subtype: "promotion_board_or_advancement",
      label: "Military Promotion or Board",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_stressful",
      outcome: "military_career_evaluation",
      stage: "planned_or_recent",
      affects: ["identity", "career", "confidence", "status"],
      commonEmotions: ["pressure", "pride", "anxiety", "hope"],
      commonNeeds: ["preparation", "confidence_building", "performance_review"],
      possibleNextEvents: ["promotion", "not_selected", "career_reassessment"],
      threshold: 5,
      signals: [
        ["raw", /\b(promotion board|advancement|promoted to|selection board|eval ranking|fitrep|milestone promotion)\b/, 4],
        ["domainAny", ["military", "career"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "military_career",
      subtype: "military_award_or_recognition",
      label: "Military Award or Recognition",
      importance: "moderate_to_major",
      expectedDuration: "days_to_weeks",
      polarity: "positive",
      outcome: "service_recognition",
      stage: "recent_or_completed",
      affects: ["confidence", "identity", "career", "pride"],
      commonEmotions: ["pride", "gratitude", "relief", "motivation"],
      commonNeeds: ["celebration", "integration", "career_documentation"],
      possibleNextEvents: ["promotion_board", "resume_update", "leadership_opportunity"],
      threshold: 5,
      signals: [
        ["raw", /\b(award|nam|com|achievement medal|recognized by command|sailor of the quarter|marine of the quarter)\b/, 4],
        ["domainAny", ["military", "career"], 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "career_military_event",
      type: "clinical_work",
      subtype: "patient_care_stress",
      label: "Patient Care Stress",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "clinical_emotional_load",
      stage: "active_or_recent",
      affects: ["mood", "health", "sleep", "professional_identity"],
      commonEmotions: ["stress", "sadness", "anger", "fatigue", "protectiveness"],
      commonNeeds: ["decompression", "clinical_boundary", "support"],
      possibleNextEvents: ["burnout", "moral_distress", "team_support"],
      threshold: 5,
      signals: [
        ["raw", /\b(patient care|patient was aggressive|hard patient|clinical shift|psych patient|inpatient)\b/, 4],
        ["domainAny", ["healthcare", "work", "career"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "clinical_work",
      subtype: "moral_distress",
      label: "Moral Distress at Work",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "values_work_conflict",
      stage: "active_or_recent",
      affects: ["identity", "mood", "burnout", "professional_values"],
      commonEmotions: ["anger", "helplessness", "sadness", "disgust"],
      commonNeeds: ["validation", "values_clarity", "safe_escalation"],
      possibleNextEvents: ["burnout", "leadership_conversation", "career_reassessment"],
      threshold: 5,
      signals: [
        ["raw", /\b(moral distress|ethically wrong|unsafe care|this isn't right|patient safety issue|values at work)\b/, 4],
        ["domainAny", ["healthcare", "work", "career"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "career_identity",
      subtype: "professional_identity_growth",
      label: "Professional Identity Growth",
      importance: "major",
      expectedDuration: "weeks_to_years",
      polarity: "positive_or_mixed",
      outcome: "career_identity_strengthening",
      stage: "active_or_recent",
      affects: ["identity", "confidence", "career", "purpose"],
      commonEmotions: ["pride", "clarity", "motivation", "hope"],
      commonNeeds: ["reflection", "integration", "next_goal"],
      possibleNextEvents: ["promotion", "specialization", "leadership_role"],
      threshold: 5,
      signals: [
        ["raw", /\b(feel like a real nurse|feel like a leader|professional identity|becoming better at my job|growing professionally)\b/, 4],
        ["domainAny", ["career", "work", "identity"], 2],
        ["polarity", "positive", 1]
      ]
    },

    {
      category: "career_military_event",
      type: "career_identity",
      subtype: "career_doubt",
      label: "Career Doubt",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "professional_identity_uncertainty",
      stage: "active_or_reflective",
      affects: ["identity", "confidence", "future_planning", "stress"],
      commonEmotions: ["confusion", "fear", "sadness", "restlessness"],
      commonNeeds: ["values_clarity", "decision_support", "non_impulsive_planning"],
      possibleNextEvents: ["career_change", "job_search", "school_vs_work_decision"],
      threshold: 5,
      signals: [
        ["raw", /\b(wrong career|hate my career|not sure about my career|career doubt|don't know what career I want)\b/, 4],
        ["domainAny", ["career", "work", "identity"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "work_schedule",
      subtype: "night_shift_strain",
      label: "Night Shift Strain",
      importance: "major",
      expectedDuration: "weeks_to_years",
      polarity: "negative_or_mixed",
      outcome: "schedule_health_strain",
      stage: "active_or_ongoing",
      affects: ["sleep", "health", "relationship", "mood", "routine"],
      commonEmotions: ["fatigue", "irritability", "isolation", "frustration"],
      commonNeeds: ["sleep_strategy", "routine_design", "recovery"],
      possibleNextEvents: ["burnout", "relationship_stress", "health_concern"],
      threshold: 5,
      signals: [
        ["raw", /\b(night shift|graveyard shift|working nights|7p to 7a|shift work)\b/, 4],
        ["domainAny", ["work", "health", "routine"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "work_schedule",
      subtype: "schedule_change",
      label: "Work Schedule Change",
      importance: "moderate_to_major",
      expectedDuration: "days_to_months",
      polarity: "mixed_or_stressful",
      outcome: "routine_change",
      stage: "planned_or_active",
      affects: ["sleep", "relationship", "routine", "health", "family"],
      commonEmotions: ["stress", "hope", "frustration", "uncertainty"],
      commonNeeds: ["planning", "sleep_adjustment", "communication"],
      possibleNextEvents: ["routine_rebuild", "relationship_stress", "workload_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(schedule changed|new schedule|shift change|changing shifts|work hours changed)\b/, 4],
        ["domainAny", ["work", "routine", "health"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "career_admin",
      subtype: "resume_or_cv_update",
      label: "Resume or CV Update",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "neutral_or_mixed",
      outcome: "career_document_preparation",
      stage: "active_or_planning",
      affects: ["career", "confidence", "future_planning"],
      commonEmotions: ["pressure", "hope", "uncertainty", "motivation"],
      commonNeeds: ["wording_help", "achievement_framing", "clarity"],
      possibleNextEvents: ["job_application", "interview", "job_offer"],
      threshold: 5,
      signals: [
        ["raw", /\b(resume|cv|cover letter|statement of service|update my resume|resume bullet)\b/, 4],
        ["domainAny", ["career", "work", "military"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "career_admin",
      subtype: "salary_or_benefits_decision",
      label: "Salary or Benefits Decision",
      importance: "major",
      expectedDuration: "days_to_weeks",
      polarity: "mixed_or_stressful",
      outcome: "compensation_decision",
      stage: "active_or_planning",
      affects: ["finances", "career", "family", "future_planning"],
      commonEmotions: ["anxiety", "hope", "pressure", "uncertainty"],
      commonNeeds: ["calculation", "negotiation_strategy", "risk_assessment"],
      possibleNextEvents: ["job_offer_acceptance", "negotiation", "financial_planning"],
      threshold: 5,
      signals: [
        ["raw", /\b(salary|benefits|pay cut|pay raise|negotiate pay|compensation|bonus)\b/, 4],
        ["domainAny", ["career", "finance", "work"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "work_achievement",
      subtype: "major_project_success",
      label: "Major Work Project Success",
      importance: "moderate_to_major",
      expectedDuration: "days_to_weeks",
      polarity: "positive",
      outcome: "professional_accomplishment",
      stage: "completed_or_recent",
      affects: ["confidence", "career", "identity", "motivation"],
      commonEmotions: ["pride", "relief", "satisfaction", "motivation"],
      commonNeeds: ["celebration", "documentation", "momentum"],
      possibleNextEvents: ["promotion", "resume_update", "new_responsibility"],
      threshold: 5,
      signals: [
        ["raw", /\b(project went well|finished the project|successful project|work project success|launched at work)\b/, 4],
        ["domainAny", ["work", "career"], 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "career_military_event",
      type: "work_failure",
      subtype: "mistake_at_work",
      label: "Mistake at Work",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "work_error_stress",
      stage: "active_or_recent",
      affects: ["confidence", "stress", "job_security", "identity"],
      commonEmotions: ["guilt", "fear", "shame", "anxiety"],
      commonNeeds: ["accountability", "damage_control", "learning_plan"],
      possibleNextEvents: ["supervisor_conversation", "performance_criticism", "repair_action"],
      threshold: 5,
      signals: [
        ["raw", /\b(made a mistake at work|messed up at work|work error|I screwed up at work|mistake on the job)\b/, 4],
        ["domainAny", ["work", "career"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "career_military_event",
      type: "professional_boundary",
      subtype: "setting_work_boundaries",
      label: "Setting Work Boundaries",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "mixed",
      outcome: "work_boundary_change",
      stage: "planned_or_active",
      affects: ["stress", "health", "performance", "relationships"],
      commonEmotions: ["guilt", "anxiety", "relief", "strength"],
      commonNeeds: ["clear_language", "consistency", "professionalism"],
      possibleNextEvents: ["boss_conflict", "burnout_recovery", "schedule_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(boundaries at work|set work boundaries|say no at work|stop taking extra shifts|protect my time)\b/, 4],
        ["domainAny", ["work", "career", "health"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "professional_growth",
      subtype: "mentorship",
      label: "Mentorship",
      importance: "moderate_to_major",
      expectedDuration: "weeks_to_years",
      polarity: "positive_or_mixed",
      outcome: "professional_guidance_relationship",
      stage: "active_or_goal",
      affects: ["career", "confidence", "identity", "skills"],
      commonEmotions: ["hope", "gratitude", "uncertainty", "motivation"],
      commonNeeds: ["guidance", "specific_questions", "accountability"],
      possibleNextEvents: ["promotion", "skill_growth", "career_decision"],
      threshold: 5,
      signals: [
        ["raw", /\b(mentor|mentorship|career mentor|someone to guide me|professional guidance)\b/, 4],
        ["domainAny", ["career", "work", "education"], 2]
      ]
    },

    {
      category: "career_military_event",
      type: "civilian_transition",
      subtype: "civilian_identity_adjustment",
      label: "Civilian Identity Adjustment",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "mixed_or_uncertain",
      outcome: "post_military_identity_shift",
      stage: "active_or_anticipated",
      affects: ["identity", "career", "social_life", "family", "routine"],
      commonEmotions: ["grief", "relief", "confusion", "hope"],
      commonNeeds: ["identity_support", "routine_rebuild", "community_connection"],
      possibleNextEvents: ["job_search", "school_enrollment", "reserve_transition", "purpose_search"],
      threshold: 5,
      signals: [
        ["raw", /\b(civilian transition|civilian life|after the military|post military|leaving uniform|identity after military)\b/, 4],
        ["domainAny", ["military", "career", "identity"], 2]
      ]
    }
  ]
};

window.Ari.eventOntologyCareerMilitary = window.AriEventOntologyCareerMilitary;

console.log(
  "ARI EVENT ONTOLOGY CAREER MILITARY LOADED:",
  window.AriEventOntologyCareerMilitary.version
);