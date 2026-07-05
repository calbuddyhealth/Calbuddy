// ari/ontology/events/ari-event-ontology-family-parenthood.js
// Purpose: Family and parenthood event definitions for Ari Event Understanding.
// V0.1.0 — Family / Pregnancy / Birth / Parenting / Caregiving Ontology

window.Ari = window.Ari || {};

window.AriEventOntologyFamilyParenthood = {
  version: "0.1.0",

  definitions: [
    {
      category: "family_parenthood_event",
      type: "pregnancy",
      subtype: "pregnancy_announcement",
      label: "Pregnancy Announcement",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "family_expansion_known",
      stage: "new_information",
      affects: ["family", "identity", "relationship", "future_planning", "finances"],
      commonEmotions: ["joy", "shock", "anxiety", "hope"],
      commonNeeds: ["celebration", "reassurance", "planning"],
      possibleNextEvents: ["prenatal_care", "gender_reveal", "birth_planning"],
      threshold: 5,
      signals: [
        ["raw", /\b(she's pregnant|we're pregnant|we are pregnant|pregnancy test|found out.*pregnant|having a baby)\b/, 4],
        ["domainAny", ["family", "parenthood", "health"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "pregnancy",
      subtype: "prenatal_milestone",
      label: "Prenatal Milestone",
      importance: "moderate_to_major",
      expectedDuration: "days_to_weeks",
      polarity: "positive_or_mixed",
      outcome: "pregnancy_progress",
      stage: "ongoing",
      affects: ["family", "health", "identity", "future_planning"],
      commonEmotions: ["excitement", "relief", "anxiety", "awe"],
      commonNeeds: ["understanding", "reassurance", "celebration"],
      possibleNextEvents: ["ultrasound", "prenatal_visit", "birth_preparation"],
      threshold: 5,
      signals: [
        ["raw", /\b(ultrasound|heartbeat|baby kicking|felt the baby move|anatomy scan|prenatal appointment|weeks pregnant)\b/, 4],
        ["domainAny", ["family", "health", "parenthood"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "pregnancy",
      subtype: "pregnancy_discomfort",
      label: "Pregnancy Discomfort",
      importance: "moderate_to_major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "pregnancy_symptom",
      stage: "active",
      affects: ["health", "relationship", "routine", "sleep", "mood"],
      commonEmotions: ["concern", "frustration", "fatigue", "protectiveness"],
      commonNeeds: ["safe_guidance", "reassurance", "red_flag_awareness"],
      possibleNextEvents: ["medical_check", "symptom_management", "birth_preparation"],
      threshold: 5,
      signals: [
        ["raw", /\b(pregnancy pain|hip pain|pelvic pain|back pain|nausea|pregnancy symptom|pregnant.*hurts)\b/, 4],
        ["domainAny", ["health", "family", "parenthood"], 2],
        ["knowledgeMedical", true, 1]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "pregnancy",
      subtype: "high_risk_concern",
      label: "Pregnancy Red Flag Concern",
      importance: "critical",
      expectedDuration: "hours_to_days",
      polarity: "negative_or_urgent",
      outcome: "potential_medical_risk",
      stage: "active_or_imminent",
      affects: ["health", "safety", "family", "stress"],
      commonEmotions: ["fear", "panic", "protectiveness", "uncertainty"],
      commonNeeds: ["urgent_guidance", "medical_boundary", "safety"],
      possibleNextEvents: ["call_clinician", "emergency_evaluation", "monitoring"],
      threshold: 5,
      signals: [
        ["raw", /\b(pregnant.*bleeding|severe pain.*pregnant|water broke|contractions.*early|decreased movement|can't feel baby|pregnancy emergency)\b/, 5],
        ["domainAny", ["health", "family", "parenthood"], 2],
        ["knowledgeMedical", true, 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "birth",
      subtype: "labor_starting",
      label: "Labor Starting",
      importance: "critical",
      expectedDuration: "hours_to_days",
      polarity: "high_importance",
      outcome: "birth_process_beginning",
      stage: "active_or_imminent",
      affects: ["family", "health", "routine", "relationship", "identity"],
      commonEmotions: ["excitement", "fear", "awe", "urgency"],
      commonNeeds: ["calm_guidance", "support", "logistics"],
      possibleNextEvents: ["hospital_arrival", "delivery", "newborn_care"],
      threshold: 5,
      signals: [
        ["raw", /\b(labor started|contractions|water broke|going into labor|delivery room|heading to hospital)\b/, 5],
        ["domainAny", ["family", "health", "parenthood"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "birth",
      subtype: "baby_born",
      label: "Baby Born",
      importance: "critical",
      expectedDuration: "days_to_months",
      polarity: "positive_or_mixed",
      outcome: "new_child_arrived",
      stage: "completed_or_recent",
      affects: ["identity", "family", "sleep", "relationship", "routine", "finances"],
      commonEmotions: ["joy", "awe", "exhaustion", "protectiveness", "anxiety"],
      commonNeeds: ["celebration", "support", "newborn_guidance", "rest"],
      possibleNextEvents: ["newborn_care", "postpartum_recovery", "sleep_disruption"],
      threshold: 5,
      signals: [
        ["raw", /\b(baby was born|we had the baby|newborn|became a dad|became a mom|delivered the baby)\b/, 5],
        ["domainAny", ["family", "parenthood", "health"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "postpartum",
      subtype: "postpartum_recovery",
      label: "Postpartum Recovery",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed",
      outcome: "post_birth_recovery",
      stage: "active",
      affects: ["health", "family", "relationship", "sleep", "mood"],
      commonEmotions: ["fatigue", "tenderness", "anxiety", "gratitude"],
      commonNeeds: ["support", "medical_awareness", "practical_help", "rest"],
      possibleNextEvents: ["newborn_care", "postpartum_mood_concern", "family_adjustment"],
      threshold: 5,
      signals: [
        ["raw", /\b(postpartum|after birth|recovering from delivery|c-section recovery|after delivery)\b/, 4],
        ["domainAny", ["health", "family", "parenthood"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "postpartum",
      subtype: "postpartum_mood_concern",
      label: "Postpartum Mood Concern",
      importance: "critical",
      expectedDuration: "days_to_months",
      polarity: "negative_or_concern",
      outcome: "postpartum_emotional_risk",
      stage: "active",
      affects: ["mental_health", "family", "safety", "relationship", "sleep"],
      commonEmotions: ["sadness", "anxiety", "numbness", "guilt", "fear"],
      commonNeeds: ["compassion", "safety", "medical_support", "nonjudgmental_help"],
      possibleNextEvents: ["clinician_contact", "family_support_plan", "urgent_help_if_safety_risk"],
      threshold: 5,
      signals: [
        ["raw", /\b(postpartum depression|postpartum anxiety|baby blues|after birth.*sad|after birth.*anxious|doesn't feel like herself)\b/, 5],
        ["domainAny", ["mental_health", "health", "family"], 2],
        ["knowledgeMedical", true, 1]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "newborn_care",
      subtype: "sleep_disruption",
      label: "Newborn Sleep Disruption",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "negative_or_mixed",
      outcome: "sleep_loss",
      stage: "active",
      affects: ["sleep", "mood", "relationship", "routine", "health"],
      commonEmotions: ["exhaustion", "irritability", "love", "overwhelm"],
      commonNeeds: ["practical_support", "normalization", "rest_strategy"],
      possibleNextEvents: ["parent_burnout", "relationship_stress", "routine_adjustment"],
      threshold: 5,
      signals: [
        ["raw", /\b(newborn won't sleep|baby won't sleep|up all night|no sleep with baby|sleep deprived.*baby)\b/, 4],
        ["domainAny", ["family", "parenthood", "health"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "newborn_care",
      subtype: "feeding_concern",
      label: "Baby Feeding Concern",
      importance: "major",
      expectedDuration: "days_to_weeks",
      polarity: "negative_or_concern",
      outcome: "infant_care_uncertainty",
      stage: "active",
      affects: ["health", "family", "stress", "confidence"],
      commonEmotions: ["worry", "guilt", "frustration", "protectiveness"],
      commonNeeds: ["safe_guidance", "reassurance", "clinician_boundary"],
      possibleNextEvents: ["pediatrician_contact", "feeding_plan", "parent_confidence_rebuilding"],
      threshold: 5,
      signals: [
        ["raw", /\b(baby won't eat|not feeding|breastfeeding problem|formula problem|baby not gaining weight|feeding issue)\b/, 4],
        ["domainAny", ["family", "health", "parenthood"], 2],
        ["knowledgeMedical", true, 1]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "parent_identity",
      subtype: "becoming_parent",
      label: "Becoming a Parent",
      importance: "critical",
      expectedDuration: "months_to_years",
      polarity: "positive_or_mixed",
      outcome: "identity_expansion",
      stage: "active_or_anticipatory",
      affects: ["identity", "family", "relationship", "finances", "routine", "purpose"],
      commonEmotions: ["joy", "fear", "awe", "responsibility", "uncertainty"],
      commonNeeds: ["identity_support", "planning", "encouragement", "realistic_expectations"],
      possibleNextEvents: ["birth_or_labor", "newborn_care", "work_family_balance"],
      threshold: 5,
      signals: [
        ["raw", /\b(becoming a parent|becoming a dad|becoming a mom|first time dad|first time mom|about to be a father|about to be a mother)\b/, 4],
        ["domainAny", ["family", "parenthood", "identity"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "parenting_stage",
      subtype: "toddler_stage",
      label: "Toddler Stage",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "mixed",
      outcome: "child_development_stage",
      stage: "active",
      affects: ["routine", "patience", "family", "identity", "relationship"],
      commonEmotions: ["joy", "frustration", "fatigue", "pride"],
      commonNeeds: ["patience", "development_context", "practical_strategy"],
      possibleNextEvents: ["behavior_challenge", "developmental_milestone", "childcare_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(toddler|terrible twos|two year old|three year old|tantrums)\b/, 4],
        ["domainAny", ["family", "parenthood"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "child_development",
      subtype: "developmental_milestone",
      label: "Child Developmental Milestone",
      importance: "moderate_to_major",
      expectedDuration: "days_to_weeks",
      polarity: "positive_or_mixed",
      outcome: "child_growth_marker",
      stage: "completed_or_recent",
      affects: ["family", "pride", "identity", "caregiving"],
      commonEmotions: ["pride", "joy", "awe", "relief"],
      commonNeeds: ["celebration", "understanding", "encouragement"],
      possibleNextEvents: ["new_parenting_stage", "childcare_adjustment", "health_question"],
      threshold: 5,
      signals: [
        ["raw", /\b(first steps|first word|started walking|started talking|milestone|developmental milestone)\b/, 4],
        ["domainAny", ["family", "parenthood", "health"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "child_concern",
      subtype: "child_health_concern",
      label: "Child Health Concern",
      importance: "critical",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_concern",
      outcome: "child_health_uncertainty",
      stage: "active",
      affects: ["family", "health", "stress", "safety", "routine"],
      commonEmotions: ["fear", "protectiveness", "anxiety", "helplessness"],
      commonNeeds: ["safe_guidance", "pediatric_boundary", "reassurance", "red_flags"],
      possibleNextEvents: ["pediatrician_contact", "urgent_care", "home_monitoring"],
      threshold: 5,
      signals: [
        ["raw", /\b(baby has fever|child has fever|baby sick|kid sick|child sick|baby breathing|baby rash)\b/, 4],
        ["domainAny", ["family", "health", "parenthood"], 2],
        ["knowledgeMedical", true, 1]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "parenting_stress",
      subtype: "parent_burnout",
      label: "Parent Burnout",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "caregiving_depletion",
      stage: "active_or_ongoing",
      affects: ["mental_health", "family", "relationship", "sleep", "identity"],
      commonEmotions: ["exhaustion", "guilt", "irritability", "sadness"],
      commonNeeds: ["validation", "support_plan", "rest", "self_compassion"],
      possibleNextEvents: ["relationship_stress", "support_request", "routine_rebuild"],
      threshold: 5,
      signals: [
        ["raw", /\b(parent burnout|burned out as a parent|tired of parenting|overwhelmed with the kids|can't do this parenting)\b/, 4],
        ["domainAny", ["family", "parenthood", "mental_health"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "work_family_balance",
      subtype: "balancing_work_and_parenting",
      label: "Balancing Work and Parenting",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "mixed_or_stressful",
      outcome: "role_conflict",
      stage: "active_or_planning",
      affects: ["career", "family", "identity", "sleep", "relationship"],
      commonEmotions: ["guilt", "stress", "pressure", "love"],
      commonNeeds: ["prioritization", "realistic_planning", "support"],
      possibleNextEvents: ["childcare_change", "career_transition", "relationship_stress"],
      threshold: 5,
      signals: [
        ["raw", /\b(work and parenting|balance work and kids|new baby and work|going back to work after baby|parenting and job)\b/, 4],
        ["domainAny", ["family", "career", "parenthood"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "childcare",
      subtype: "childcare_change",
      label: "Childcare Change",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed_or_stressful",
      outcome: "care_arrangement_change",
      stage: "planning_or_active",
      affects: ["family", "finances", "routine", "career", "trust"],
      commonEmotions: ["anxiety", "relief", "guilt", "uncertainty"],
      commonNeeds: ["decision_support", "planning", "trust_assessment"],
      possibleNextEvents: ["return_to_work", "financial_pressure", "routine_adjustment"],
      threshold: 5,
      signals: [
        ["raw", /\b(daycare|childcare|babysitter|nanny|who will watch the baby|care for the kids)\b/, 4],
        ["domainAny", ["family", "parenthood", "finance"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "family_role",
      subtype: "caregiving_for_parent",
      label: "Caregiving for Parent",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "mixed_or_stressful",
      outcome: "adult_child_caregiving_role",
      stage: "active_or_planning",
      affects: ["family", "identity", "time", "finances", "stress"],
      commonEmotions: ["love", "guilt", "grief", "fatigue", "protectiveness"],
      commonNeeds: ["care_planning", "support", "boundaries", "medical_navigation"],
      possibleNextEvents: ["health_decline", "family_conflict", "care_plan_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(taking care of my dad|taking care of my mom|caregiving for my parent|aging parent|parent is sick)\b/, 4],
        ["domainAny", ["family", "health", "caregiving"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "family_health",
      subtype: "parent_health_decline",
      label: "Parent Health Decline",
      importance: "critical",
      expectedDuration: "weeks_to_years",
      polarity: "negative_or_concern",
      outcome: "family_health_stress",
      stage: "active_or_ongoing",
      affects: ["family", "grief", "stress", "future_planning", "caregiving"],
      commonEmotions: ["fear", "grief", "protectiveness", "helplessness"],
      commonNeeds: ["medical_navigation", "emotional_support", "care_planning"],
      possibleNextEvents: ["caregiving_role", "hospitalization", "family_decision"],
      threshold: 5,
      signals: [
        ["raw", /\b(my dad.*sick|my mom.*sick|father.*stroke|mother.*stroke|parent.*health|dad.*hospital|mom.*hospital)\b/, 4],
        ["domainAny", ["family", "health", "caregiving"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "family_conflict",
      subtype: "parent_child_conflict",
      label: "Parent-Child Conflict",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "family_tension",
      stage: "active_or_recent",
      affects: ["family", "identity", "stress", "communication"],
      commonEmotions: ["anger", "guilt", "hurt", "frustration"],
      commonNeeds: ["boundaries", "repair", "clarity"],
      possibleNextEvents: ["hard_conversation", "boundary_setting", "family_repair"],
      threshold: 5,
      signals: [
        ["raw", /\b(fight with my mom|fight with my dad|argued with my parent|parent doesn't understand|family argument)\b/, 4],
        ["domainAny", ["family", "relationship"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "family_conflict",
      subtype: "extended_family_conflict",
      label: "Extended Family Conflict",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "family_system_tension",
      stage: "active_or_recent",
      affects: ["family", "relationship", "stress", "boundaries"],
      commonEmotions: ["frustration", "loyalty_conflict", "anger", "guilt"],
      commonNeeds: ["boundary_clarity", "deescalation", "values_alignment"],
      possibleNextEvents: ["boundary_setting", "family_event_stress", "relationship_stress"],
      threshold: 5,
      signals: [
        ["raw", /\b(in-laws|mother in law|father in law|siblings|brother|sister|family drama|extended family)\b/, 4],
        ["domainAny", ["family", "relationship"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "family_event",
      subtype: "family_celebration",
      label: "Family Celebration",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_days",
      polarity: "positive_or_mixed",
      outcome: "family_connection_event",
      stage: "planned_or_completed",
      affects: ["family", "tradition", "relationships", "belonging"],
      commonEmotions: ["joy", "gratitude", "stress", "nostalgia"],
      commonNeeds: ["celebration", "planning", "presence"],
      possibleNextEvents: ["family_conflict", "shared_memory", "tradition_building"],
      threshold: 5,
      signals: [
        ["raw", /\b(family party|family celebration|birthday party|baby shower|gender reveal|holiday with family)\b/, 4],
        ["domainAny", ["family", "social"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "family_loss",
      subtype: "loss_of_family_member",
      label: "Loss of Family Member",
      importance: "critical",
      expectedDuration: "months_to_years",
      polarity: "negative",
      outcome: "family_grief",
      stage: "active_or_recent",
      affects: ["grief", "family", "identity", "routine", "meaning"],
      commonEmotions: ["grief", "shock", "sadness", "numbness", "anger"],
      commonNeeds: ["compassion", "presence", "grief_support", "practical_help"],
      possibleNextEvents: ["funeral", "estate_process", "family_reorganization"],
      threshold: 5,
      signals: [
        ["raw", /\b(my dad died|my mom died|lost my father|lost my mother|family member died|death in the family)\b/, 5],
        ["domainAny", ["family", "grief", "loss"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "family_transition",
      subtype: "empty_nest",
      label: "Empty Nest",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "mixed",
      outcome: "parenting_role_shift",
      stage: "active_or_recent",
      affects: ["identity", "family", "relationship", "routine", "purpose"],
      commonEmotions: ["sadness", "pride", "freedom", "loneliness"],
      commonNeeds: ["identity_rebuild", "relationship_reconnection", "new_routine"],
      possibleNextEvents: ["purpose_search", "relationship_reassessment", "new_hobbies"],
      threshold: 5,
      signals: [
        ["raw", /\b(empty nest|kid moved out|child moved out|kids left home|last child left)\b/, 4],
        ["domainAny", ["family", "parenthood", "identity"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "family_transition",
      subtype: "becoming_grandparent",
      label: "Becoming a Grandparent",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "positive_or_mixed",
      outcome: "new_family_role",
      stage: "active_or_anticipatory",
      affects: ["identity", "family", "legacy", "relationships"],
      commonEmotions: ["joy", "pride", "nostalgia", "protectiveness"],
      commonNeeds: ["celebration", "role_clarity", "family_connection"],
      possibleNextEvents: ["birth_or_labor", "family_celebration", "caregiving_support"],
      threshold: 5,
      signals: [
        ["raw", /\b(becoming a grandparent|going to be a grandpa|going to be a grandma|first grandchild|grandbaby)\b/, 4],
        ["domainAny", ["family", "parenthood", "identity"], 2]
      ]
    },

    {
      category: "family_parenthood_event",
      type: "co_parenting",
      subtype: "co_parenting_conflict",
      label: "Co-Parenting Conflict",
      importance: "major",
      expectedDuration: "weeks_to_years",
      polarity: "negative_or_mixed",
      outcome: "parenting_coordination_conflict",
      stage: "active_or_ongoing",
      affects: ["family", "child_wellbeing", "stress", "communication", "legal"],
      commonEmotions: ["frustration", "anger", "fear", "protectiveness"],
      commonNeeds: ["boundaries", "child_centered_framing", "communication_structure"],
      possibleNextEvents: ["custody_process", "boundary_setting", "family_mediation"],
      threshold: 5,
      signals: [
        ["raw", /\b(co-parent|coparent|custody|child support|parenting schedule|other parent)\b/, 4],
        ["domainAny", ["family", "legal", "parenthood"], 2],
        ["polarity", "negative", 1]
      ]
    }
  ]
};

window.Ari.eventOntologyFamilyParenthood = window.AriEventOntologyFamilyParenthood;

console.log(
  "ARI EVENT ONTOLOGY FAMILY PARENTHOOD LOADED:",
  window.AriEventOntologyFamilyParenthood.version
);