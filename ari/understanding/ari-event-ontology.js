// ari/understanding/ari-event-ontology.js
// V0.1.0 — Universal Event Ontology Starter

window.Ari = window.Ari || {};

window.AriEventOntology = {
  version: "0.1.0",

  definitions: [
    {
      category: "life_transition",
      type: "career_transition",
      subtype: "job_or_role_change",
      label: "Career Transition",
      threshold: 5,
      polarity: "mixed_or_uncertain",
      outcome: "life_role_change",
      stage: "planning_or_active",
      signals: [
        ["raw", /\b(new job|quit my job|leaving my job|career change|promotion|resign|resignation|retire|retirement)\b/, 3],
        ["domainAny", ["work", "career", "military"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "career_transition",
      subtype: "military_separation",
      label: "Military Separation",
      threshold: 5,
      polarity: "mixed_or_uncertain",
      outcome: "major_life_change",
      stage: "planning_or_active",
      signals: [
        ["raw", /\b(leaving the navy|separating from the navy|military separation|getting out of the military|active duty|dd214|selres)\b/, 4],
        ["domainAny", ["military", "career", "work"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "parenthood_transition",
      subtype: "expecting_child",
      label: "Expecting Child",
      threshold: 5,
      polarity: "mixed_or_positive",
      outcome: "family_expansion",
      stage: "anticipation",
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
      threshold: 5,
      polarity: "high_importance",
      outcome: "birth_event",
      stage: "active_or_imminent",
      signals: [
        ["raw", /\b(giving birth|labor|water broke|contractions|delivery room|baby was born|newborn)\b/, 5],
        ["domainAny", ["family", "health", "parenthood"], 2]
      ]
    },

    {
      category: "life_transition",
      type: "relationship_transition",
      subtype: "marriage_or_commitment",
      label: "Marriage or Commitment",
      threshold: 5,
      polarity: "positive_or_mixed",
      outcome: "relationship_role_change",
      stage: "completed_or_planning",
      signals: [
        ["raw", /\b(got married|getting married|wedding|wife|husband|fiance|fiancée|engaged|engagement)\b/, 4],
        ["domain", "relationship", 2]
      ]
    },

    {
      category: "social_event",
      type: "support_received",
      subtype: "practical_help",
      label: "Practical Support Received",
      threshold: 5,
      polarity: "positive",
      outcome: "received_support",
      stage: "completed",
      signals: [
        ["action", "supportReceived", 3],
        ["semantic", "support_received", 3],
        ["actorAny", ["friends", "partner", "family"], 2],
        ["raw", /\b(helped me|chores|errands|went out of their way|showed up)\b/, 1]
      ]
    },

    {
      category: "social_event",
      type: "support_received",
      subtype: "thoughtful_gesture",
      label: "Thoughtful Gesture Received",
      threshold: 5,
      polarity: "positive",
      outcome: "received_care",
      stage: "completed",
      signals: [
        ["action", "supportReceived", 3],
        ["semantic", "support_received", 2],
        ["actorAny", ["partner", "friends", "family"], 2],
        ["raw", /\b(surprised me|made dinner|dinner|gift|thoughtful|sweet)\b/, 2]
      ]
    },

    {
      category: "social_event",
      type: "social_rejection",
      subtype: "excluded_or_ignored",
      label: "Social Rejection or Exclusion",
      threshold: 5,
      polarity: "negative",
      outcome: "felt_excluded",
      stage: "active_or_recent",
      signals: [
        ["raw", /\b(left me out|ignored me|didn't invite me|excluded|rejected|ghosted)\b/, 4],
        ["domainAny", ["friendship", "relationship", "social"], 2],
        ["emotionAny", ["sadness", "loneliness", "anger"], 1]
      ]
    },

    {
      category: "social_event",
      type: "social_conflict",
      subtype: "friend_or_group_conflict",
      label: "Social Conflict",
      threshold: 5,
      polarity: "negative_or_mixed",
      outcome: "conflict",
      stage: "active_or_recent",
      signals: [
        ["raw", /\b(argument|fight|drama|tension|conflict|falling out)\b/, 3],
        ["actorAny", ["friends", "family", "partner"], 2]
      ]
    },

    {
      category: "connection_goal",
      type: "friendship_building",
      subtype: "expand_social_circle",
      label: "Friendship Building Goal",
      threshold: 5,
      polarity: "neutral_or_mixed",
      outcome: "desired_connection",
      stage: "goal_or_intention",
      signals: [
        ["domainAny", ["friendship", "social"], 2],
        ["action", "connectionSeeking", 3],
        ["semantic", "connection_seeking", 2],
        ["raw", /\b(make friends|social circle|meet people|build friendships|expand my circle)\b/, 2]
      ]
    },

    {
      category: "connection_goal",
      type: "romantic_connection",
      subtype: "seeking_relationship",
      label: "Romantic Connection Goal",
      threshold: 5,
      polarity: "neutral_or_mixed",
      outcome: "desired_relationship",
      stage: "goal_or_intention",
      signals: [
        ["domain", "relationship", 2],
        ["action", "connectionSeeking", 3],
        ["semantic", "connection_seeking", 2],
        ["raw", /\b(relationship with someone|dating|find someone|lonely|alone|romantic)\b/, 2]
      ]
    },

    {
      category: "achievement_event",
      type: "academic_result",
      subtype: "academic_success",
      label: "Academic Success",
      threshold: 5,
      polarity: "positive",
      outcome: "success",
      stage: "completed",
      signals: [
        ["domain", "school", 2],
        ["action", "achievement", 3],
        ["semantic", "achievement_shared", 2],
        ["raw", /\b(got an a|passed|aced|did well|final|exam|test|grade)\b/, 1]
      ]
    },

    {
      category: "setback_event",
      type: "academic_result",
      subtype: "academic_setback",
      label: "Academic Setback",
      threshold: 5,
      polarity: "negative",
      outcome: "setback",
      stage: "completed",
      signals: [
        ["domain", "school", 2],
        ["action", "setback", 3],
        ["raw", /\b(got an f|failed|didn't pass|did not pass|bad grade|final|exam|test)\b/, 2]
      ]
    },

    {
      category: "health_event",
      type: "symptom_or_concern",
      subtype: "medical_concern",
      label: "Health Concern",
      threshold: 5,
      polarity: "negative_or_concern",
      outcome: "health_uncertainty",
      stage: "active_or_recent",
      signals: [
        ["domain", "health", 3],
        ["semantic", "medical_concern", 3],
        ["knowledgeMedical", true, 2],
        ["raw", /\b(pain|symptom|pregnant|bleeding|fever|doctor|hospital|medicine|medication)\b/, 1]
      ]
    },

    {
      category: "financial_event",
      type: "financial_pressure",
      subtype: "money_stress",
      label: "Financial Pressure",
      threshold: 5,
      polarity: "negative_or_mixed",
      outcome: "resource_pressure",
      stage: "active_or_planning",
      signals: [
        ["raw", /\b(money is tight|can't afford|debt|bills|rent|budget|financial stress|paycheck)\b/, 4],
        ["domainAny", ["finance", "life", "work"], 2]
      ]
    },

    {
      category: "legal_admin_event",
      type: "paperwork_or_case",
      subtype: "admin_process",
      label: "Legal or Administrative Process",
      threshold: 5,
      polarity: "neutral_or_stressful",
      outcome: "requires_process_navigation",
      stage: "active_or_planning",
      signals: [
        ["raw", /\b(uscis|immigration|case|paperwork|application|orders|letter|senator|congressman|legal)\b/, 4],
        ["domainAny", ["legal", "admin", "government"], 2]
      ]
    },

    {
      category: "technical_event",
      type: "debug_or_build_issue",
      subtype: "system_development",
      label: "Technical Build or Debug Event",
      threshold: 5,
      polarity: "neutral_or_problem",
      outcome: "needs_technical_action",
      stage: "active",
      signals: [
        ["domain", "developer", 3],
        ["semantic", "developer_debug", 3],
        ["knowledgeProject", true, 2],
        ["raw", /\b(code|file|bug|patch|engine|pipeline|router|composer|blueprint)\b/, 1]
      ]
    },

    {
      category: "emotional_event",
      type: "emotional_disclosure",
      subtype: "nervousness_report",
      label: "Nervousness Reported",
      threshold: 4,
      polarity: "negative",
      outcome: "emotional_disclosure",
      stage: "active",
      signals: [
        ["emotion", "anxiety", 3],
        ["speechAct", "emotional_disclosure", 2],
        ["raw", /\b(nervous|anxious|worried|scared)\b/, 2]
      ]
    },

    {
      category: "daily_life_event",
      type: "general_event_share",
      subtype: "unspecified_event",
      label: "General Event Share",
      threshold: 2,
      polarity: "unknown",
      outcome: "shared_context",
      stage: "unknown",
      signals: [
        ["speechActAny", ["event_share", "statement"], 1],
        ["semanticAny", ["casual_share", "support_received", "achievement_shared"], 1]
      ]
    }
  ]
};

window.Ari.eventOntology = window.AriEventOntology;

console.log("ARI EVENT ONTOLOGY LOADED:", window.AriEventOntology.version);