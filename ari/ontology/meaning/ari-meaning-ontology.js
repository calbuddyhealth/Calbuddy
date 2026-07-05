// ari/ontology/meaning/ari-meaning-ontology.js
// Purpose: Core reusable human meaning definitions.
// V0.1.0 — Meaning Ontology / Stable Core Meanings

window.Ari = window.Ari || {};

window.AriMeaningOntology = {
  version: "0.1.0",

  meanings: [
    {
      id: "body_change_concern",
      family: "body_or_health",
      label: "Body Change Concern",
      description: "The person notices an unwanted or meaningful change in their body.",
      commonImpacts: ["confidence", "health", "identity", "goals"],
      commonResponseNeeds: ["validate_then_clarify", "gentle_coaching_if_requested"]
    },

    {
      id: "health_worry",
      family: "body_or_health",
      label: "Health Worry",
      description: "The person may be worried something is medically wrong or risky.",
      commonImpacts: ["health", "safety", "stress", "future"],
      commonResponseNeeds: ["calm_guidance", "red_flags", "clinician_boundary"]
    },

    {
      id: "self_criticism",
      family: "identity",
      label: "Self-Criticism",
      description: "The person is judging themselves harshly or attacking their own worth.",
      commonImpacts: ["confidence", "identity", "motivation", "mood"],
      commonResponseNeeds: ["soften_shame", "reframe", "ground_before_advice"]
    },

    {
      id: "confidence_threat",
      family: "identity",
      label: "Confidence Threat",
      description: "The situation may make the person doubt their ability, value, or competence.",
      commonImpacts: ["confidence", "identity", "performance", "motivation"],
      commonResponseNeeds: ["validate", "evidence_check", "small_next_step"]
    },

    {
      id: "achievement_shared",
      family: "achievement",
      label: "Achievement Shared",
      description: "The person is sharing a success or milestone that deserves recognition.",
      commonImpacts: ["confidence", "identity", "motivation", "future"],
      commonResponseNeeds: ["celebrate", "reflect_strength", "next_momentum"]
    },

    {
      id: "setback_shared",
      family: "setback",
      label: "Setback Shared",
      description: "The person experienced a failure, loss, rejection, or disappointing outcome.",
      commonImpacts: ["confidence", "future", "identity", "mood"],
      commonResponseNeeds: ["validate", "stabilize", "next_step"]
    },

    {
      id: "future_uncertainty",
      family: "uncertainty",
      label: "Future Uncertainty",
      description: "The person is unsure what happens next or what future path is safe.",
      commonImpacts: ["future", "decision_making", "security", "stress"],
      commonResponseNeeds: ["clarify_tradeoff", "organize_options", "next_step"]
    },

    {
      id: "decision_pressure",
      family: "decision",
      label: "Decision Pressure",
      description: "The person feels pressure to choose between competing options.",
      commonImpacts: ["future", "values", "finances", "relationships"],
      commonResponseNeeds: ["tradeoff_analysis", "recommend_if_enough_context", "small_next_step"]
    },

    {
      id: "life_transition_meaning",
      family: "life_transition",
      label: "Life Transition Meaning",
      description: "The event changes the person’s role, routine, identity, or future path.",
      commonImpacts: ["identity", "routine", "future", "relationships"],
      commonResponseNeeds: ["normalize_transition", "name_shift", "planning_support"]
    },

    {
      id: "identity_shift",
      family: "identity",
      label: "Identity Shift",
      description: "The person’s sense of who they are or who they are becoming is changing.",
      commonImpacts: ["identity", "purpose", "confidence", "future"],
      commonResponseNeeds: ["reflect_meaning", "slow_down", "values_clarity"]
    },

    {
      id: "increased_responsibility",
      family: "responsibility",
      label: "Increased Responsibility",
      description: "The person is taking on more duty, obligation, or care for others.",
      commonImpacts: ["routine", "family", "career", "stress"],
      commonResponseNeeds: ["validate_weight", "prioritize", "support_planning"]
    },

    {
      id: "loss_of_control",
      family: "control",
      label: "Loss of Control",
      description: "The person may feel like events, emotions, body, money, or relationships are slipping out of control.",
      commonImpacts: ["stress", "confidence", "safety", "future"],
      commonResponseNeeds: ["ground", "restore_agency", "small_controllable_step"]
    },

    {
      id: "connection_need",
      family: "connection",
      label: "Connection Need",
      description: "The person wants closeness, belonging, friendship, intimacy, or companionship.",
      commonImpacts: ["belonging", "mood", "identity", "relationships"],
      commonResponseNeeds: ["validate_need", "practical_connection_step", "dignity"]
    },

    {
      id: "support_received",
      family: "connection",
      label: "Support Received",
      description: "Someone showed up for the person in a helpful or caring way.",
      commonImpacts: ["belonging", "trust", "gratitude", "mood"],
      commonResponseNeeds: ["celebrate_connection", "reflect_care", "encourage_appreciation"]
    },

    {
      id: "support_needed",
      family: "connection",
      label: "Support Needed",
      description: "The person likely needs help, comfort, backup, resources, or presence.",
      commonImpacts: ["stress", "safety", "belonging", "routine"],
      commonResponseNeeds: ["offer_support", "identify_need", "small_request"]
    },

    {
      id: "rejection_or_exclusion",
      family: "connection",
      label: "Rejection or Exclusion",
      description: "The person may feel left out, unwanted, ignored, rejected, or socially unsafe.",
      commonImpacts: ["belonging", "confidence", "trust", "mood"],
      commonResponseNeeds: ["validate_hurt", "avoid_overreaction", "next_social_step"]
    },

    {
      id: "relationship_repair_need",
      family: "relationship",
      label: "Relationship Repair Need",
      description: "Trust, communication, or closeness may need repair after tension or conflict.",
      commonImpacts: ["trust", "emotional_safety", "communication", "bond"],
      commonResponseNeeds: ["deescalate", "repair_language", "one_next_step"]
    },

    {
      id: "trust_threat",
      family: "relationship",
      label: "Trust Threat",
      description: "The event may damage trust or make the person question someone’s reliability.",
      commonImpacts: ["trust", "security", "relationships", "decision_making"],
      commonResponseNeeds: ["validate", "clarify_facts", "boundary_or_repair"]
    },

    {
      id: "belonging_gain",
      family: "connection",
      label: "Belonging Gain",
      description: "The person feels included, accepted, valued, or socially connected.",
      commonImpacts: ["belonging", "confidence", "mood", "identity"],
      commonResponseNeeds: ["celebrate", "reflect_belonging", "reinforce_connection"]
    },

    {
      id: "belonging_loss",
      family: "connection",
      label: "Belonging Loss",
      description: "The person feels disconnected from a group, community, friend, or identity space.",
      commonImpacts: ["belonging", "identity", "mood", "support"],
      commonResponseNeeds: ["validate", "meaning_make", "connection_rebuild"]
    },

    {
      id: "grief_or_loss",
      family: "loss",
      label: "Grief or Loss",
      description: "The person is dealing with death, loss, separation, or something meaningful ending.",
      commonImpacts: ["grief", "identity", "routine", "meaning"],
      commonResponseNeeds: ["presence", "compassion", "no_rushing"]
    },

    {
      id: "safety_risk",
      family: "safety",
      label: "Safety Risk",
      description: "The situation may involve immediate danger, self-harm risk, medical emergency, or safety instability.",
      commonImpacts: ["safety", "health", "support", "decision_making"],
      commonResponseNeeds: ["immediate_safety", "trusted_help", "emergency_boundary"]
    },

    {
      id: "practical_help_request",
      family: "practical",
      label: "Practical Help Request",
      description: "The person wants concrete help, instructions, planning, wording, or a solution.",
      commonImpacts: ["time", "stress", "goals", "decision_making"],
      commonResponseNeeds: ["direct_answer", "step_by_step", "avoid_overexplaining"]
    },

    {
      id: "knowledge_request",
      family: "information",
      label: "Knowledge Request",
      description: "The person wants facts, explanation, definitions, or current information.",
      commonImpacts: ["understanding", "decision_making", "confidence"],
      commonResponseNeeds: ["clear_answer", "explain_enough", "cite_if_needed"]
    },

    {
      id: "meaning_request",
      family: "reflection",
      label: "Meaning Request",
      description: "The person is asking what something means emotionally, relationally, morally, or personally.",
      commonImpacts: ["identity", "values", "relationships", "future"],
      commonResponseNeeds: ["interpret_carefully", "hold_uncertainty", "reflect_options"]
    },

    {
      id: "celebration",
      family: "positive",
      label: "Celebration",
      description: "The person is sharing something good, meaningful, joyful, or worthy of celebration.",
      commonImpacts: ["mood", "confidence", "relationships", "identity"],
      commonResponseNeeds: ["celebrate", "join_emotion", "do_not_overcoach"]
    },

    {
      id: "hope_or_progress",
      family: "positive",
      label: "Hope or Progress",
      description: "The person is experiencing improvement, momentum, recovery, or possibility.",
      commonImpacts: ["motivation", "confidence", "future", "mood"],
      commonResponseNeeds: ["reinforce_progress", "name_strength", "next_momentum"]
    },

    {
      id: "shame_or_guilt",
      family: "moral_emotion",
      label: "Shame or Guilt",
      description: "The person may feel bad about themselves or about something they did.",
      commonImpacts: ["identity", "relationships", "confidence", "mood"],
      commonResponseNeeds: ["reduce_shame", "separate_action_from_worth", "repair_if_needed"]
    },

    {
      id: "conflict_or_threat",
      family: "threat",
      label: "Conflict or Threat",
      description: "The person is facing interpersonal, social, workplace, legal, or physical threat.",
      commonImpacts: ["safety", "trust", "stress", "decision_making"],
      commonResponseNeeds: ["deescalate", "protective_next_step", "clarify_risk"]
    },

    {
      id: "values_conflict",
      family: "values",
      label: "Values Conflict",
      description: "The person is torn between competing values, duties, loyalties, or priorities.",
      commonImpacts: ["identity", "relationships", "future", "decision_making"],
      commonResponseNeeds: ["name_tradeoff", "values_clarity", "choose_next_step"]
    },

    {
      id: "goal_frustration",
      family: "goals",
      label: "Goal Frustration",
      description: "The person feels they are drifting from or failing to meet a goal.",
      commonImpacts: ["confidence", "motivation", "identity", "routine"],
      commonResponseNeeds: ["normalize_slip", "restart_plan", "small_step"]
    },

    {
      id: "habit_drift",
      family: "goals",
      label: "Habit Drift",
      description: "The person may be noticing routines, discipline, or habits slipping.",
      commonImpacts: ["routine", "confidence", "health", "goals"],
      commonResponseNeeds: ["non_shame_reset", "pattern_check", "small_next_step"]
    },

    {
      id: "overwhelm",
      family: "capacity",
      label: "Overwhelm",
      description: "The person feels overloaded by too much happening at once.",
      commonImpacts: ["attention", "stress", "decision_making", "energy"],
      commonResponseNeeds: ["triage", "reduce_load", "one_step"]
    },

    {
      id: "burnout_or_depletion",
      family: "capacity",
      label: "Burnout or Depletion",
      description: "The person may be emotionally, physically, or mentally depleted.",
      commonImpacts: ["energy", "mood", "work", "relationships"],
      commonResponseNeeds: ["validate_depletion", "recovery_plan", "boundaries"]
    },

    {
      id: "unclear_need",
      family: "uncertainty",
      label: "Unclear Need",
      description: "The person’s statement has meaning, but it is unclear whether they want empathy, advice, information, or action.",
      commonImpacts: ["communication", "response_quality"],
      commonResponseNeeds: ["reflect_then_clarify", "avoid_assuming"]
    }
  ]
};

window.Ari.meaningOntology = window.AriMeaningOntology;

console.log(
  "ARI MEANING ONTOLOGY LOADED:",
  window.AriMeaningOntology.version,
  "meanings:",
  window.AriMeaningOntology.meanings.length
);