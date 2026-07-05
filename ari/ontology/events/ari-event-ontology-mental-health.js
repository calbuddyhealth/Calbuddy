// ari/ontology/events/ari-event-ontology-mental-health.js
// Purpose: Mental health and emotional-state event definitions for Ari Event Understanding.
// V0.1.0 — Emotional State / Distress / Burnout / Loneliness / Safety Ontology

window.Ari = window.Ari || {};

window.AriEventOntologyMentalHealth = {
  version: "0.1.0",

  definitions: [
    {
      category: "mental_health_event",
      type: "anxiety",
      subtype: "nervousness_report",
      label: "Nervousness Report",
      importance: "moderate",
      expectedDuration: "minutes_to_days",
      polarity: "negative_or_mixed",
      outcome: "anxious_activation",
      stage: "active",
      affects: ["mood", "body", "attention", "decision_making"],
      commonEmotions: ["anxiety", "uncertainty", "fear"],
      commonNeeds: ["grounding", "context", "small_next_step"],
      possibleNextEvents: ["panic_spike", "reassurance_seeking", "problem_solving"],
      threshold: 5,
      signals: [
        ["raw", /\b(nervous|getting nervous|feeling nervous|uneasy|on edge)\b/, 4],
        ["emotion", "anxiety", 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "anxiety",
      subtype: "worry_loop",
      label: "Worry Loop",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative",
      outcome: "rumination_cycle",
      stage: "active",
      affects: ["attention", "sleep", "mood", "decision_making"],
      commonEmotions: ["anxiety", "fear", "uncertainty"],
      commonNeeds: ["grounding", "thought_sorting", "uncertainty_tolerance"],
      possibleNextEvents: ["sleep_problem", "avoidance", "reassurance_seeking"],
      threshold: 5,
      signals: [
        ["raw", /\b(can't stop worrying|keep thinking about it|spiraling|overthinking|what if)\b/, 4],
        ["domainAny", ["mental_health", "emotion"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "anxiety",
      subtype: "panic_spike",
      label: "Panic Spike",
      importance: "critical",
      expectedDuration: "minutes_to_hours",
      polarity: "negative_or_urgent",
      outcome: "acute_anxiety_surge",
      stage: "active",
      affects: ["body", "safety_feeling", "attention", "breathing"],
      commonEmotions: ["panic", "fear", "helplessness"],
      commonNeeds: ["grounding", "breathing_support", "safety_check"],
      possibleNextEvents: ["grounding", "medical_concern", "support_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(panic attack|panicking|can't calm down|heart racing from anxiety|feel like I'm dying)\b/, 5],
        ["emotion", "anxiety", 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "sadness",
      subtype: "sadness_report",
      label: "Sadness Report",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "negative",
      outcome: "low_mood",
      stage: "active",
      affects: ["mood", "energy", "connection", "motivation"],
      commonEmotions: ["sadness", "heaviness", "loneliness"],
      commonNeeds: ["presence", "validation", "gentle_context"],
      possibleNextEvents: ["crying", "withdrawal", "support_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(sad|feeling down|heavy|low mood|bummed out)\b/, 4],
        ["emotion", "sadness", 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "sadness",
      subtype: "crying_episode",
      label: "Crying Episode",
      importance: "moderate_to_major",
      expectedDuration: "minutes_to_hours",
      polarity: "negative",
      outcome: "emotional_release",
      stage: "active_or_recent",
      affects: ["mood", "body", "connection", "stress"],
      commonEmotions: ["sadness", "grief", "overwhelm"],
      commonNeeds: ["presence", "soft_validation", "safety_check_if_needed"],
      possibleNextEvents: ["support_request", "rest", "meaning_making"],
      threshold: 5,
      signals: [
        ["raw", /\b(crying|cried|can't stop crying|teared up|broke down)\b/, 4],
        ["domainAny", ["mental_health", "emotion"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "depression_like_state",
      subtype: "loss_of_motivation",
      label: "Loss of Motivation",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative",
      outcome: "reduced_drive",
      stage: "active_or_ongoing",
      affects: ["motivation", "routine", "self_care", "work", "relationships"],
      commonEmotions: ["numbness", "sadness", "frustration", "hopelessness"],
      commonNeeds: ["small_steps", "non_shame_support", "screen_for_safety_if_needed"],
      possibleNextEvents: ["withdrawal", "burnout", "support_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(no motivation|can't get myself to|don't care anymore|lost motivation|nothing feels worth it)\b/, 4],
        ["domainAny", ["mental_health", "life"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "depression_like_state",
      subtype: "emotional_numbness",
      label: "Emotional Numbness",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_protective",
      outcome: "reduced_emotional_access",
      stage: "active",
      affects: ["mood", "connection", "motivation", "identity"],
      commonEmotions: ["numbness", "emptiness", "confusion"],
      commonNeeds: ["gentle_presence", "low_pressure_reflection", "safety_check_if_needed"],
      possibleNextEvents: ["withdrawal", "sadness", "support_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(numb|feel nothing|empty|emotionless|can't feel anything)\b/, 4],
        ["domainAny", ["mental_health", "emotion"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "anger",
      subtype: "anger_report",
      label: "Anger Report",
      importance: "moderate",
      expectedDuration: "minutes_to_days",
      polarity: "negative_or_protective",
      outcome: "anger_activation",
      stage: "active",
      affects: ["communication", "body", "decision_making", "relationships"],
      commonEmotions: ["anger", "frustration", "hurt"],
      commonNeeds: ["deescalation", "naming_trigger", "safe_expression"],
      possibleNextEvents: ["argument", "boundary_setting", "repair"],
      threshold: 5,
      signals: [
        ["raw", /\b(angry|mad|furious|pissed|irritated|annoyed)\b/, 4],
        ["emotion", "anger", 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "anger",
      subtype: "explosive_reaction",
      label: "Explosive Reaction",
      importance: "major",
      expectedDuration: "minutes_to_days",
      polarity: "negative",
      outcome: "emotion_regulation_break",
      stage: "active_or_recent",
      affects: ["relationships", "trust", "self_control", "guilt"],
      commonEmotions: ["anger", "shame", "guilt", "regret"],
      commonNeeds: ["repair", "accountability", "trigger_review"],
      possibleNextEvents: ["apology", "relationship_repair", "boundary_setting"],
      threshold: 5,
      signals: [
        ["raw", /\b(blew up|snapped|lost it|yelled|exploded|said things I regret)\b/, 4],
        ["emotion", "anger", 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "shame",
      subtype: "shame_spiral",
      label: "Shame Spiral",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative",
      outcome: "self_worth_threat",
      stage: "active",
      affects: ["identity", "confidence", "connection", "motivation"],
      commonEmotions: ["shame", "guilt", "embarrassment", "worthlessness"],
      commonNeeds: ["dignity", "reframing", "repair_if_needed"],
      possibleNextEvents: ["withdrawal", "apology", "support_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(ashamed|feel like a failure|hate myself|embarrassed|I'm a bad person|worthless)\b/, 4],
        ["domainAny", ["mental_health", "identity"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "guilt",
      subtype: "guilt_after_action",
      label: "Guilt After Action",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_repairing",
      outcome: "moral_discomfort",
      stage: "recent_or_active",
      affects: ["identity", "relationships", "mood", "decision_making"],
      commonEmotions: ["guilt", "regret", "anxiety", "sadness"],
      commonNeeds: ["accountability", "repair", "proportion"],
      possibleNextEvents: ["apology", "repair_conversation", "self_forgiveness"],
      threshold: 5,
      signals: [
        ["raw", /\b(feel guilty|guilt|I regret|shouldn't have done|I messed up)\b/, 4],
        ["domainAny", ["mental_health", "relationship", "life"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "loneliness",
      subtype: "loneliness_report",
      label: "Loneliness Report",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative",
      outcome: "connection_deficit",
      stage: "active_or_ongoing",
      affects: ["belonging", "mood", "identity", "motivation"],
      commonEmotions: ["loneliness", "sadness", "longing", "shame"],
      commonNeeds: ["connection_plan", "validation", "small_social_steps"],
      possibleNextEvents: ["friendship_building", "romantic_connection_goal", "withdrawal"],
      threshold: 5,
      signals: [
        ["raw", /\b(lonely|alone|no one cares|no friends|isolated|no one to talk to)\b/, 4],
        ["emotion", "loneliness", 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "burnout",
      subtype: "emotional_burnout",
      label: "Emotional Burnout",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "negative_or_mixed",
      outcome: "emotional_depletion",
      stage: "active_or_ongoing",
      affects: ["mood", "body", "work", "relationships", "self_care"],
      commonEmotions: ["exhaustion", "numbness", "resentment", "irritability"],
      commonNeeds: ["recovery_plan", "boundaries", "reduced_load"],
      possibleNextEvents: ["work_burnout", "relationship_stress", "health_concern"],
      threshold: 5,
      signals: [
        ["raw", /\b(burned out|burnt out|emotionally drained|can't keep doing this|depleted)\b/, 4],
        ["domainAny", ["mental_health", "work", "life"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "overwhelm",
      subtype: "life_overwhelm",
      label: "Life Overwhelm",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "capacity_exceeded",
      stage: "active",
      affects: ["attention", "mood", "body", "decision_making"],
      commonEmotions: ["overwhelm", "anxiety", "fatigue", "helplessness"],
      commonNeeds: ["triage", "small_next_step", "load_reduction"],
      possibleNextEvents: ["burnout", "avoidance", "support_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(overwhelmed|too much|can't handle everything|everything at once|drowning)\b/, 4],
        ["domainAny", ["mental_health", "life"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "stress",
      subtype: "acute_stress",
      label: "Acute Stress",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_days",
      polarity: "negative_or_mixed",
      outcome: "stress_activation",
      stage: "active",
      affects: ["body", "mood", "attention", "sleep"],
      commonEmotions: ["stress", "pressure", "irritability", "anxiety"],
      commonNeeds: ["decompression", "prioritization", "grounding"],
      possibleNextEvents: ["conflict", "sleep_problem", "problem_solving"],
      threshold: 5,
      signals: [
        ["raw", /\b(stressed|stressful|under pressure|rough week|hard week)\b/, 4],
        ["domainAny", ["mental_health", "life", "work"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "grief",
      subtype: "grief_response",
      label: "Grief Response",
      importance: "critical",
      expectedDuration: "weeks_to_years",
      polarity: "negative",
      outcome: "loss_processing",
      stage: "active_or_recent",
      affects: ["mood", "identity", "routine", "relationships", "meaning"],
      commonEmotions: ["grief", "sadness", "anger", "numbness", "longing"],
      commonNeeds: ["presence", "compassion", "practical_support", "time"],
      possibleNextEvents: ["funeral", "anniversary_grief", "support_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(grieving|grief|lost someone|passed away|died|mourning)\b/, 4],
        ["domainAny", ["grief", "loss", "mental_health"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "trauma_response",
      subtype: "triggered_response",
      label: "Triggered Response",
      importance: "major",
      expectedDuration: "minutes_to_days",
      polarity: "negative",
      outcome: "trauma_activation",
      stage: "active_or_recent",
      affects: ["body", "safety_feeling", "mood", "relationships"],
      commonEmotions: ["fear", "anger", "numbness", "panic"],
      commonNeeds: ["grounding", "safety", "choice", "support"],
      possibleNextEvents: ["avoidance", "support_request", "therapy_context"],
      threshold: 5,
      signals: [
        ["raw", /\b(triggered|flashback|felt unsafe|brought me back|trauma response)\b/, 4],
        ["domainAny", ["mental_health", "safety"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "avoidance",
      subtype: "avoidance_pattern",
      label: "Avoidance Pattern",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_protective",
      outcome: "delayed_confrontation",
      stage: "active_or_recurring",
      affects: ["decision_making", "relationships", "work", "confidence"],
      commonEmotions: ["anxiety", "guilt", "fear", "relief"],
      commonNeeds: ["gentle_start", "low_pressure_plan", "non_shame_accountability"],
      possibleNextEvents: ["procrastination", "conflict", "small_step_success"],
      threshold: 5,
      signals: [
        ["raw", /\b(avoiding|avoidance|putting it off|don't want to deal with it|can't face it)\b/, 4],
        ["domainAny", ["mental_health", "life"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "reassurance_seeking",
      subtype: "repeated_reassurance_need",
      label: "Reassurance Seeking",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "uncertainty_relief_cycle",
      stage: "active_or_recurring",
      affects: ["anxiety", "decision_making", "relationships", "attention"],
      commonEmotions: ["anxiety", "fear", "uncertainty"],
      commonNeeds: ["grounding", "uncertainty_tolerance", "clear_limit"],
      possibleNextEvents: ["worry_loop", "health_anxiety", "decision_delay"],
      threshold: 5,
      signals: [
        ["raw", /\b(are you sure|reassure me|need reassurance|keep asking|can't stop checking)\b/, 4],
        ["domainAny", ["mental_health", "anxiety"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "self_criticism",
      subtype: "harsh_inner_voice",
      label: "Harsh Inner Voice",
      importance: "major",
      expectedDuration: "hours_to_months",
      polarity: "negative",
      outcome: "self_attack",
      stage: "active",
      affects: ["confidence", "identity", "motivation", "relationships"],
      commonEmotions: ["shame", "sadness", "anger", "hopelessness"],
      commonNeeds: ["self_compassion", "reframing", "evidence_check"],
      possibleNextEvents: ["withdrawal", "motivation_loss", "support_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(I suck|I'm stupid|I'm useless|I'm worthless|I'm pathetic|hate myself)\b/, 4],
        ["domainAny", ["mental_health", "identity"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "emotional_recovery",
      subtype: "feeling_better",
      label: "Feeling Better Emotionally",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "positive",
      outcome: "emotional_improvement",
      stage: "active_or_recent",
      affects: ["mood", "confidence", "routine", "relationships"],
      commonEmotions: ["relief", "hope", "gratitude", "calm"],
      commonNeeds: ["reinforcement", "reflection", "momentum"],
      possibleNextEvents: ["routine_rebuild", "connection", "confidence_gain"],
      threshold: 5,
      signals: [
        ["raw", /\b(feel better|feeling better emotionally|more calm|less anxious|doing better mentally)\b/, 4],
        ["domainAny", ["mental_health", "emotion"], 2],
        ["polarity", "positive", 1]
      ]
    },

    {
      category: "mental_health_event",
      type: "emotional_growth",
      subtype: "insight_or_breakthrough",
      label: "Emotional Insight or Breakthrough",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "positive_or_mixed",
      outcome: "self_understanding_gain",
      stage: "recent_or_active",
      affects: ["identity", "relationships", "decision_making", "confidence"],
      commonEmotions: ["relief", "clarity", "sadness", "hope"],
      commonNeeds: ["integration", "next_step", "reflection"],
      possibleNextEvents: ["behavior_change", "repair_conversation", "growth_plan"],
      threshold: 5,
      signals: [
        ["raw", /\b(realized something|breakthrough|it clicked|I understand now|I figured out why)\b/, 4],
        ["domainAny", ["mental_health", "growth", "identity"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "confidence",
      subtype: "confidence_gain",
      label: "Confidence Gain",
      importance: "moderate",
      expectedDuration: "hours_to_weeks",
      polarity: "positive",
      outcome: "self_efficacy_increase",
      stage: "active_or_recent",
      affects: ["identity", "motivation", "relationships", "performance"],
      commonEmotions: ["pride", "relief", "hope", "motivation"],
      commonNeeds: ["celebration", "reinforcement", "next_challenge"],
      possibleNextEvents: ["achievement", "social_success", "goal_progress"],
      threshold: 5,
      signals: [
        ["raw", /\b(feel confident|more confident|proud of myself|I can do this|felt strong)\b/, 4],
        ["domainAny", ["mental_health", "identity", "growth"], 2],
        ["polarity", "positive", 1]
      ]
    },

    {
      category: "mental_health_event",
      type: "confidence",
      subtype: "confidence_loss",
      label: "Confidence Loss",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative",
      outcome: "self_efficacy_drop",
      stage: "active_or_recent",
      affects: ["identity", "motivation", "performance", "decision_making"],
      commonEmotions: ["shame", "fear", "sadness", "uncertainty"],
      commonNeeds: ["evidence_review", "reframing", "small_win"],
      possibleNextEvents: ["avoidance", "support_request", "motivation_loss"],
      threshold: 5,
      signals: [
        ["raw", /\b(lost confidence|don't trust myself|can't do anything right|doubting myself|confidence is gone)\b/, 4],
        ["domainAny", ["mental_health", "identity"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "decision_distress",
      subtype: "feeling_stuck",
      label: "Feeling Stuck",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "decision_or_life_stagnation",
      stage: "active",
      affects: ["decision_making", "motivation", "identity", "future_planning"],
      commonEmotions: ["frustration", "hopelessness", "confusion", "restlessness"],
      commonNeeds: ["clarity", "small_next_step", "values_sorting"],
      possibleNextEvents: ["purpose_search", "decision_request", "avoidance"],
      threshold: 5,
      signals: [
        ["raw", /\b(feel stuck|stuck in life|can't move forward|don't know what to do|trapped)\b/, 4],
        ["domainAny", ["mental_health", "life", "identity"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "safety_risk",
      subtype: "passive_suicidal_ideation",
      label: "Passive Suicidal Thoughts",
      importance: "critical",
      expectedDuration: "minutes_to_days",
      polarity: "urgent",
      outcome: "safety_risk",
      stage: "active_or_recent",
      affects: ["safety", "mental_health", "support", "family"],
      commonEmotions: ["hopelessness", "numbness", "despair", "exhaustion"],
      commonNeeds: ["immediate_safety_check", "trusted_support", "crisis_resources"],
      possibleNextEvents: ["urgent_support", "safety_plan", "emergency_help"],
      threshold: 5,
      signals: [
        ["raw", /\b(don't want to be here|wish I wouldn't wake up|life isn't worth it|better off dead|want to disappear)\b/, 5],
        ["domainAny", ["mental_health", "safety"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "safety_risk",
      subtype: "active_suicidal_ideation",
      label: "Active Suicidal Thoughts",
      importance: "critical",
      expectedDuration: "minutes_to_hours",
      polarity: "urgent",
      outcome: "immediate_safety_risk",
      stage: "active",
      affects: ["safety", "mental_health", "support", "family"],
      commonEmotions: ["despair", "hopelessness", "panic", "numbness"],
      commonNeeds: ["immediate_safety", "emergency_support", "do_not_leave_alone"],
      possibleNextEvents: ["emergency_help", "crisis_line", "trusted_person_contact"],
      threshold: 5,
      signals: [
        ["raw", /\b(want to kill myself|going to kill myself|suicidal|end my life|I have a plan to die)\b/, 5],
        ["domainAny", ["mental_health", "safety"], 3]
      ]
    },

    {
      category: "mental_health_event",
      type: "safety_risk",
      subtype: "self_harm_urge",
      label: "Self-Harm Urge",
      importance: "critical",
      expectedDuration: "minutes_to_hours",
      polarity: "urgent",
      outcome: "self_harm_risk",
      stage: "active",
      affects: ["safety", "body", "mental_health", "support"],
      commonEmotions: ["despair", "numbness", "panic", "shame"],
      commonNeeds: ["immediate_safety", "urge_delay", "trusted_support"],
      possibleNextEvents: ["crisis_support", "safety_plan", "emergency_help"],
      threshold: 5,
      signals: [
        ["raw", /\b(want to hurt myself|self harm|cut myself|hurt myself|urge to self harm)\b/, 5],
        ["domainAny", ["mental_health", "safety"], 3]
      ]
    },

    {
      category: "mental_health_event",
      type: "support_seeking",
      subtype: "asking_for_emotional_help",
      label: "Asking for Emotional Help",
      importance: "major",
      expectedDuration: "minutes_to_days",
      polarity: "mixed",
      outcome: "support_request",
      stage: "active",
      affects: ["connection", "mood", "safety_feeling", "trust"],
      commonEmotions: ["vulnerability", "hope", "fear", "sadness"],
      commonNeeds: ["presence", "validation", "gentle_next_step"],
      possibleNextEvents: ["emotional_disclosure", "problem_solving", "safety_check_if_needed"],
      threshold: 5,
      signals: [
        ["raw", /\b(help me emotionally|I need support|can you comfort me|I need someone|please be here)\b/, 4],
        ["domainAny", ["mental_health", "emotion", "support"], 2]
      ]
    },

    {
      category: "mental_health_event",
      type: "therapy_or_treatment",
      subtype: "considering_therapy",
      label: "Considering Therapy",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "positive_or_mixed",
      outcome: "help_seeking_consideration",
      stage: "planning_or_reflective",
      affects: ["mental_health", "identity", "finances", "routine"],
      commonEmotions: ["hope", "fear", "shame", "uncertainty"],
      commonNeeds: ["normalization", "options", "first_step"],
      possibleNextEvents: ["therapy_start", "avoidance", "support_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(therapy|therapist|counseling|should I get help|mental health help)\b/, 4],
        ["domainAny", ["mental_health", "health"], 2]
      ]
    }
  ]
};

window.Ari.eventOntologyMentalHealth = window.AriEventOntologyMentalHealth;

console.log(
  "ARI EVENT ONTOLOGY MENTAL HEALTH LOADED:",
  window.AriEventOntologyMentalHealth.version
);