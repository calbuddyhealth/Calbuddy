// ari/ontology/events/ari-event-ontology-relationships.js
// Purpose: Relationship event definitions for Ari Event Understanding.
// V0.1.0 — Relationship Ontology / Partner Bond / Conflict / Repair / Trust

window.Ari = window.Ari || {};

window.AriEventOntologyRelationships = {
  version: "0.1.0",

  definitions: [
    {
      category: "relationship_event",
      type: "positive_connection",
      subtype: "thoughtful_gesture",
      label: "Thoughtful Gesture",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_days",
      polarity: "positive",
      outcome: "felt_cared_for",
      stage: "completed_or_recent",
      affects: ["trust", "bond", "gratitude", "emotional_security"],
      commonEmotions: ["gratitude", "joy", "warmth", "love"],
      commonNeeds: ["celebration", "appreciation", "reflection"],
      possibleNextEvents: ["expressing_appreciation", "relationship_closeness", "reciprocal_gesture"],
      threshold: 5,
      signals: [
        ["raw", /\b(surprised me|made dinner|brought me|did something sweet|thoughtful|sweet gesture)\b/, 4],
        ["actorAny", ["partner", "wife", "husband", "girlfriend", "boyfriend", "spouse"], 2],
        ["semantic", "support_received", 2]
      ]
    },

    {
      category: "relationship_event",
      type: "positive_connection",
      subtype: "emotional_support",
      label: "Partner Emotional Support",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "positive",
      outcome: "felt_supported",
      stage: "active_or_recent",
      affects: ["trust", "emotional_security", "bond", "stress"],
      commonEmotions: ["relief", "gratitude", "love", "safety"],
      commonNeeds: ["appreciation", "emotional_reflection", "connection"],
      possibleNextEvents: ["relationship_deepening", "vulnerability", "gratitude_expression"],
      threshold: 5,
      signals: [
        ["raw", /\b(listened to me|supported me|comforted me|was there for me|held me|helped me through)\b/, 4],
        ["actorAny", ["partner", "wife", "husband", "girlfriend", "boyfriend", "spouse"], 2]
      ]
    },

    {
      category: "relationship_event",
      type: "positive_connection",
      subtype: "quality_time",
      label: "Quality Time",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "positive",
      outcome: "shared_connection",
      stage: "completed_or_planned",
      affects: ["bond", "routine", "intimacy", "relationship_satisfaction"],
      commonEmotions: ["joy", "closeness", "comfort", "gratitude"],
      commonNeeds: ["presence", "appreciation", "protecting_connection"],
      possibleNextEvents: ["date_night", "relationship_repair", "shared_memory"],
      threshold: 5,
      signals: [
        ["raw", /\b(date night|spent time together|quality time|hung out together|went out together)\b/, 4],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "relationship_event",
      type: "relationship_conflict",
      subtype: "argument",
      label: "Relationship Argument",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_days",
      polarity: "negative_or_mixed",
      outcome: "relationship_tension",
      stage: "active_or_recent",
      affects: ["trust", "mood", "communication", "emotional_safety"],
      commonEmotions: ["anger", "hurt", "guilt", "defensiveness"],
      commonNeeds: ["deescalation", "repair", "clarity"],
      possibleNextEvents: ["apology", "repair_conversation", "emotional_distance"],
      threshold: 5,
      signals: [
        ["raw", /\b(argument|argued|fight|fought|fighting|disagreement|blew up)\b/, 4],
        ["actorAny", ["partner", "wife", "husband", "girlfriend", "boyfriend", "spouse"], 2],
        ["semantic", "relationship_repair", 1]
      ]
    },

    {
      category: "relationship_event",
      type: "relationship_conflict",
      subtype: "recurring_conflict",
      label: "Recurring Relationship Conflict",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "negative_or_mixed",
      outcome: "repeated_pattern",
      stage: "active_or_ongoing",
      affects: ["trust", "communication", "emotional_security", "relationship_satisfaction"],
      commonEmotions: ["exhaustion", "resentment", "sadness", "frustration"],
      commonNeeds: ["pattern_identification", "repair_plan", "boundaries"],
      possibleNextEvents: ["therapy_discussion", "boundary_setting", "separation_consideration"],
      threshold: 5,
      signals: [
        ["raw", /\b(keeps happening|same fight|always argue|again and again|recurring argument|same issue)\b/, 4],
        ["domain", "relationship", 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "relationship_event",
      type: "relationship_repair",
      subtype: "apology",
      label: "Apology",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_days",
      polarity: "positive_or_mixed",
      outcome: "repair_attempt",
      stage: "active_or_recent",
      affects: ["trust", "communication", "accountability", "emotional_safety"],
      commonEmotions: ["relief", "guilt", "hope", "vulnerability"],
      commonNeeds: ["accountability", "clarity", "forgiveness_process"],
      possibleNextEvents: ["repair_conversation", "trust_rebuilding", "boundary_setting"],
      threshold: 5,
      signals: [
        ["raw", /\b(apologized|said sorry|I said sorry|she said sorry|he said sorry|apology)\b/, 4],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "relationship_event",
      type: "relationship_repair",
      subtype: "repair_conversation",
      label: "Repair Conversation",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "positive_or_mixed",
      outcome: "relationship_repair_attempt",
      stage: "planned_or_active",
      affects: ["trust", "communication", "relationship_direction", "emotional_safety"],
      commonEmotions: ["hope", "anxiety", "vulnerability", "relief"],
      commonNeeds: ["clear_language", "deescalation", "honest_next_step"],
      possibleNextEvents: ["apology", "agreement", "boundary_setting", "reconnection"],
      threshold: 5,
      signals: [
        ["raw", /\b(talk it out|repair|have a conversation|clear the air|make things right|work through it)\b/, 4],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "relationship_event",
      type: "trust_event",
      subtype: "trust_building",
      label: "Trust Building",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "increased_trust",
      stage: "active_or_developing",
      affects: ["trust", "security", "commitment", "vulnerability"],
      commonEmotions: ["hope", "safety", "gratitude", "cautiousness"],
      commonNeeds: ["consistency", "recognition", "patience"],
      possibleNextEvents: ["greater_vulnerability", "commitment_deepening", "relationship_stability"],
      threshold: 5,
      signals: [
        ["raw", /\b(trust her more|trust him more|building trust|proving herself|proving himself|showed me I can trust)\b/, 4],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "relationship_event",
      type: "trust_event",
      subtype: "trust_breach",
      label: "Trust Breach",
      importance: "critical",
      expectedDuration: "weeks_to_years",
      polarity: "negative",
      outcome: "trust_damage",
      stage: "active_or_recent",
      affects: ["trust", "emotional_security", "commitment", "identity"],
      commonEmotions: ["hurt", "anger", "shock", "betrayal", "fear"],
      commonNeeds: ["truth", "stabilization", "boundaries", "repair_or_decision"],
      possibleNextEvents: ["confrontation", "repair_attempt", "separation_consideration"],
      threshold: 5,
      signals: [
        ["raw", /\b(betrayed me|lied to me|broke my trust|kept it from me|hid it from me|deceived me)\b/, 4],
        ["domain", "relationship", 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "relationship_event",
      type: "trust_event",
      subtype: "infidelity",
      label: "Infidelity",
      importance: "critical",
      expectedDuration: "months_to_years",
      polarity: "negative",
      outcome: "major_trust_breach",
      stage: "active_or_recent",
      affects: ["trust", "identity", "commitment", "family", "emotional_safety"],
      commonEmotions: ["betrayal", "rage", "grief", "numbness", "fear"],
      commonNeeds: ["stabilization", "truth", "support", "decision_space"],
      possibleNextEvents: ["confrontation", "therapy_discussion", "separation_or_repair"],
      threshold: 5,
      signals: [
        ["raw", /\b(cheated|cheating|affair|infidelity|slept with someone|was unfaithful)\b/, 5],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "relationship_event",
      type: "emotional_distance",
      subtype: "feeling_disconnected",
      label: "Feeling Disconnected",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "relationship_distance",
      stage: "active_or_ongoing",
      affects: ["bond", "communication", "intimacy", "security"],
      commonEmotions: ["loneliness", "sadness", "confusion", "anxiety"],
      commonNeeds: ["connection", "clarity", "gentle_conversation"],
      possibleNextEvents: ["repair_conversation", "quality_time", "conflict"],
      threshold: 5,
      signals: [
        ["raw", /\b(feel disconnected|distant from her|distant from him|growing apart|not close anymore|emotionally distant)\b/, 4],
        ["domain", "relationship", 2],
        ["emotionAny", ["loneliness", "sadness", "anxiety"], 1]
      ]
    },

    {
      category: "relationship_event",
      type: "intimacy_event",
      subtype: "increased_closeness",
      label: "Increased Closeness",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "positive",
      outcome: "deeper_bond",
      stage: "active_or_recent",
      affects: ["intimacy", "trust", "security", "commitment"],
      commonEmotions: ["love", "gratitude", "comfort", "hope"],
      commonNeeds: ["presence", "appreciation", "protecting_connection"],
      possibleNextEvents: ["commitment_deepening", "vulnerability", "future_planning"],
      threshold: 5,
      signals: [
        ["raw", /\b(feel closer|closer than ever|more connected|deep conversation|opened up to me|vulnerable with me)\b/, 4],
        ["domain", "relationship", 2],
        ["polarity", "positive", 1]
      ]
    },

    {
      category: "relationship_event",
      type: "intimacy_event",
      subtype: "intimacy_mismatch",
      label: "Intimacy Mismatch",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "negative_or_mixed",
      outcome: "unmet_intimacy_need",
      stage: "active_or_ongoing",
      affects: ["intimacy", "confidence", "communication", "relationship_satisfaction"],
      commonEmotions: ["rejection", "confusion", "frustration", "shame"],
      commonNeeds: ["gentle_conversation", "non_blame_framing", "clarity"],
      possibleNextEvents: ["repair_conversation", "medical_context", "relationship_conflict"],
      threshold: 5,
      signals: [
        ["raw", /\b(no intimacy|not intimate|sex life|doesn't want sex|intimacy mismatch|physical distance)\b/, 4],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "relationship_event",
      type: "commitment_event",
      subtype: "future_planning",
      label: "Future Planning Together",
      importance: "major",
      expectedDuration: "weeks_to_years",
      polarity: "positive_or_mixed",
      outcome: "shared_future_consideration",
      stage: "planning",
      affects: ["commitment", "finances", "family", "identity", "security"],
      commonEmotions: ["hope", "pressure", "excitement", "anxiety"],
      commonNeeds: ["values_alignment", "planning", "honest_conversation"],
      possibleNextEvents: ["marriage", "moving_together", "children_discussion", "financial_planning"],
      threshold: 5,
      signals: [
        ["raw", /\b(future together|planning our future|talked about kids|talked about marriage|moving in together|buying a house together)\b/, 4],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "relationship_event",
      type: "commitment_event",
      subtype: "commitment_uncertainty",
      label: "Commitment Uncertainty",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed_or_negative",
      outcome: "relationship_direction_uncertain",
      stage: "active_or_reflective",
      affects: ["security", "future_planning", "trust", "identity"],
      commonEmotions: ["anxiety", "confusion", "fear", "sadness"],
      commonNeeds: ["clarity", "values_alignment", "decision_support"],
      possibleNextEvents: ["repair_conversation", "relationship_reassessment", "separation_consideration"],
      threshold: 5,
      signals: [
        ["raw", /\b(not sure about us|unsure about the relationship|commitment issues|not ready to commit|where this is going)\b/, 4],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "relationship_event",
      type: "boundary_event",
      subtype: "boundary_setting",
      label: "Boundary Setting",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "mixed",
      outcome: "relationship_boundary_change",
      stage: "planned_or_active",
      affects: ["trust", "communication", "autonomy", "emotional_safety"],
      commonEmotions: ["anxiety", "relief", "guilt", "strength"],
      commonNeeds: ["clear_language", "dignity", "consistency"],
      possibleNextEvents: ["conflict", "respect", "repair_conversation"],
      threshold: 5,
      signals: [
        ["raw", /\b(boundary|boundaries|set a limit|told her I can't|told him I can't|need space)\b/, 4],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "relationship_event",
      type: "boundary_event",
      subtype: "boundary_violation",
      label: "Boundary Violation",
      importance: "critical",
      expectedDuration: "days_to_months",
      polarity: "negative",
      outcome: "safety_or_respect_concern",
      stage: "active_or_recent",
      affects: ["trust", "safety", "autonomy", "emotional_security"],
      commonEmotions: ["anger", "fear", "hurt", "confusion"],
      commonNeeds: ["safety", "clarity", "support", "protective_next_step"],
      possibleNextEvents: ["boundary_setting", "separation_consideration", "trusted_support"],
      threshold: 5,
      signals: [
        ["raw", /\b(crossed my boundary|ignored my boundary|wouldn't stop|kept pushing|disrespected my boundary)\b/, 4],
        ["domain", "relationship", 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "relationship_event",
      type: "support_event",
      subtype: "caregiving_support",
      label: "Caregiving Support",
      importance: "major",
      expectedDuration: "days_to_years",
      polarity: "positive_or_mixed",
      outcome: "caregiving_dynamic",
      stage: "active_or_recent",
      affects: ["relationship", "health", "routine", "stress", "trust"],
      commonEmotions: ["gratitude", "fatigue", "love", "pressure"],
      commonNeeds: ["appreciation", "role_balance", "support"],
      possibleNextEvents: ["burnout", "deeper_bond", "care_plan"],
      threshold: 5,
      signals: [
        ["raw", /\b(taking care of me|caring for me|helping me recover|looking after me|caregiver)\b/, 4],
        ["actorAny", ["partner", "wife", "husband", "girlfriend", "boyfriend", "spouse"], 2]
      ]
    },

    {
      category: "relationship_event",
      type: "stress_event",
      subtype: "external_stress_affecting_relationship",
      label: "External Stress Affecting Relationship",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "relationship_under_stress",
      stage: "active_or_ongoing",
      affects: ["communication", "mood", "patience", "intimacy", "trust"],
      commonEmotions: ["irritability", "guilt", "exhaustion", "sadness"],
      commonNeeds: ["context", "repair", "stress_reduction", "shared_plan"],
      possibleNextEvents: ["argument", "repair_conversation", "support_received"],
      threshold: 5,
      signals: [
        ["raw", /\b(stress is affecting us|work stress affecting relationship|taking it out on her|taking it out on him|rough week affecting us)\b/, 4],
        ["domainAny", ["relationship", "work", "life"], 2]
      ]
    },

    {
      category: "relationship_event",
      type: "relationship_reassessment",
      subtype: "questioning_relationship",
      label: "Questioning the Relationship",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "mixed_or_negative",
      outcome: "relationship_evaluation",
      stage: "active_or_reflective",
      affects: ["future_planning", "identity", "trust", "emotional_security"],
      commonEmotions: ["confusion", "fear", "sadness", "ambivalence"],
      commonNeeds: ["clarity", "non_impulsive_decision", "values_alignment"],
      possibleNextEvents: ["repair_conversation", "commitment_uncertainty", "separation_or_divorce"],
      threshold: 5,
      signals: [
        ["raw", /\b(should I stay|should I leave|is this relationship right|questioning the relationship|do I still love)\b/, 4],
        ["domain", "relationship", 2],
        ["speechAct", "question", 1]
      ]
    },

    {
      category: "relationship_event",
      type: "relationship_ending",
      subtype: "breakup",
      label: "Breakup",
      importance: "critical",
      expectedDuration: "weeks_to_years",
      polarity: "negative_or_mixed",
      outcome: "relationship_end",
      stage: "active_or_recent",
      affects: ["identity", "routine", "grief", "social_life", "future_planning"],
      commonEmotions: ["grief", "relief", "anger", "loneliness", "shock"],
      commonNeeds: ["stabilization", "grief_support", "practical_next_step"],
      possibleNextEvents: ["no_contact", "reconciliation_attempt", "social_rebuilding"],
      threshold: 5,
      signals: [
        ["raw", /\b(broke up|breakup|ended things|relationship ended|she left me|he left me)\b/, 4],
        ["domain", "relationship", 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "relationship_event",
      type: "relationship_repair",
      subtype: "reconciliation",
      label: "Reconciliation",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "relationship_reconnection",
      stage: "active_or_recent",
      affects: ["trust", "future_planning", "emotional_security", "communication"],
      commonEmotions: ["hope", "fear", "relief", "caution"],
      commonNeeds: ["clear_terms", "trust_rebuilding", "slow_pacing"],
      possibleNextEvents: ["repair_conversation", "boundary_setting", "commitment_reassessment"],
      threshold: 5,
      signals: [
        ["raw", /\b(getting back together|reconciled|working things out|trying again|second chance)\b/, 4],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "relationship_event",
      type: "family_partner_event",
      subtype: "pregnancy_affecting_relationship",
      label: "Pregnancy Affecting Relationship",
      importance: "major",
      expectedDuration: "months",
      polarity: "mixed",
      outcome: "relationship_role_shift",
      stage: "active_or_anticipatory",
      affects: ["relationship", "family", "identity", "stress", "future_planning"],
      commonEmotions: ["joy", "anxiety", "protectiveness", "pressure"],
      commonNeeds: ["teamwork", "planning", "empathy", "support"],
      possibleNextEvents: ["birth_or_labor", "parenthood_transition", "financial_planning"],
      threshold: 5,
      signals: [
        ["raw", /\b(pregnancy affecting us|pregnant wife|pregnant girlfriend|we're expecting|having a baby together)\b/, 4],
        ["domainAny", ["relationship", "family", "health"], 2]
      ]
    },

    {
      category: "relationship_event",
      type: "communication_event",
      subtype: "misunderstanding",
      label: "Misunderstanding",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "negative_or_mixed",
      outcome: "communication_gap",
      stage: "active_or_recent",
      affects: ["communication", "trust", "mood", "clarity"],
      commonEmotions: ["frustration", "confusion", "hurt", "defensiveness"],
      commonNeeds: ["clarification", "repair", "slower_language"],
      possibleNextEvents: ["repair_conversation", "argument", "apology"],
      threshold: 5,
      signals: [
        ["raw", /\b(misunderstood|miscommunication|took it wrong|I didn't mean it that way|she misunderstood|he misunderstood)\b/, 4],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "relationship_event",
      type: "communication_event",
      subtype: "hard_conversation",
      label: "Hard Conversation",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "mixed_or_stressful",
      outcome: "important_relationship_discussion",
      stage: "planned_or_active",
      affects: ["trust", "future_planning", "emotional_safety", "communication"],
      commonEmotions: ["anxiety", "hope", "fear", "vulnerability"],
      commonNeeds: ["wording_help", "deescalation", "clarity"],
      possibleNextEvents: ["repair_conversation", "boundary_setting", "decision_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(need to talk to her|need to talk to him|hard conversation|serious conversation|bring this up)\b/, 4],
        ["domain", "relationship", 2]
      ]
    }
  ]
};

window.Ari.eventOntologyRelationships = window.AriEventOntologyRelationships;

console.log(
  "ARI EVENT ONTOLOGY RELATIONSHIPS LOADED:",
  window.AriEventOntologyRelationships.version
);