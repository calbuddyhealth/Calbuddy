// ari/ontology/events/ari-event-ontology-social-life.js
// Purpose: Friendship and social-life event definitions for Ari Event Understanding.
// V0.1.0 — Friendship / Belonging / Social Circle / Exclusion / Community Ontology

window.Ari = window.Ari || {};

window.AriEventOntologySocialLife = {
  version: "0.1.0",

  definitions: [
    {
      category: "social_life_event",
      type: "friendship_building",
      subtype: "making_new_friends",
      label: "Making New Friends",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "new_social_connection",
      stage: "goal_or_active",
      affects: ["belonging", "confidence", "routine", "identity"],
      commonEmotions: ["hope", "anxiety", "excitement", "vulnerability"],
      commonNeeds: ["small_social_steps", "confidence_building", "normalization"],
      possibleNextEvents: ["social_invitation", "friendship_deepening", "social_anxiety"],
      threshold: 5,
      signals: [
        ["raw", /\b(make friends|making friends|meet new people|find friends|new friends)\b/, 4],
        ["domainAny", ["friendship", "social", "community"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "friendship_building",
      subtype: "expanding_social_circle",
      label: "Expanding Social Circle",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "broader_social_network",
      stage: "goal_or_active",
      affects: ["belonging", "routine", "confidence", "community"],
      commonEmotions: ["hope", "uncertainty", "motivation", "anxiety"],
      commonNeeds: ["strategy", "low_pressure_steps", "consistency"],
      possibleNextEvents: ["joining_group", "social_invitation", "new_friendship"],
      threshold: 5,
      signals: [
        ["raw", /\b(expand my social circle|build my social circle|get out more|meet more people|social life)\b/, 4],
        ["domainAny", ["friendship", "social", "community"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "friendship_building",
      subtype: "joining_group",
      label: "Joining a Group or Community",
      importance: "moderate_to_major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "community_entry",
      stage: "planning_or_active",
      affects: ["belonging", "routine", "identity", "confidence"],
      commonEmotions: ["curiosity", "anxiety", "hope", "awkwardness"],
      commonNeeds: ["low_pressure_entry", "encouragement", "social_plan"],
      possibleNextEvents: ["first_group_event", "social_anxiety", "new_friendship"],
      threshold: 5,
      signals: [
        ["raw", /\b(join a group|joining a club|community group|meetup|church group|sports league|class to meet people)\b/, 4],
        ["domainAny", ["social", "community", "friendship"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "social_invitation",
      subtype: "invited_out",
      label: "Invited Out",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "positive_or_mixed",
      outcome: "social_opportunity",
      stage: "planned_or_recent",
      affects: ["belonging", "confidence", "routine", "social_energy"],
      commonEmotions: ["excitement", "anxiety", "gratitude", "hesitation"],
      commonNeeds: ["decision_support", "confidence", "social_energy_check"],
      possibleNextEvents: ["attending_event", "declining_invitation", "friendship_deepening"],
      threshold: 5,
      signals: [
        ["raw", /\b(invited me out|invited to|asked me to hang out|asked me out with friends|got invited)\b/, 4],
        ["domainAny", ["social", "friendship"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "social_invitation",
      subtype: "not_invited",
      label: "Not Invited",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative",
      outcome: "felt_excluded",
      stage: "active_or_recent",
      affects: ["belonging", "confidence", "trust", "mood"],
      commonEmotions: ["hurt", "loneliness", "anger", "embarrassment"],
      commonNeeds: ["validation", "perspective", "next_step_without_overreacting"],
      possibleNextEvents: ["social_repair", "friendship_reassessment", "withdrawal"],
      threshold: 5,
      signals: [
        ["raw", /\b(didn't invite me|not invited|left me out|everyone went without me|excluded me)\b/, 4],
        ["domainAny", ["social", "friendship"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "social_life_event",
      type: "social_rejection",
      subtype: "ignored_or_ghosted",
      label: "Ignored or Ghosted",
      importance: "major",
      expectedDuration: "days_to_weeks",
      polarity: "negative",
      outcome: "connection_uncertainty",
      stage: "active_or_recent",
      affects: ["belonging", "confidence", "trust", "mood"],
      commonEmotions: ["hurt", "anxiety", "confusion", "anger"],
      commonNeeds: ["grounding", "non_desperate_next_step", "self_respect"],
      possibleNextEvents: ["follow_up_message", "friendship_reassessment", "moving_on"],
      threshold: 5,
      signals: [
        ["raw", /\b(ghosted|ignored my text|left me on read|not replying|stopped responding)\b/, 4],
        ["domainAny", ["social", "friendship", "relationship"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "friendship_conflict",
      subtype: "argument_with_friend",
      label: "Argument With Friend",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "friendship_tension",
      stage: "active_or_recent",
      affects: ["trust", "belonging", "mood", "communication"],
      commonEmotions: ["anger", "hurt", "guilt", "confusion"],
      commonNeeds: ["deescalation", "repair", "clear_language"],
      possibleNextEvents: ["apology", "friendship_repair", "friendship_distance"],
      threshold: 5,
      signals: [
        ["raw", /\b(fight with my friend|argued with my friend|friend argument|drama with my friend|falling out)\b/, 4],
        ["domainAny", ["friendship", "social"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "friendship_repair",
      subtype: "making_amends",
      label: "Friendship Repair",
      importance: "major",
      expectedDuration: "days_to_weeks",
      polarity: "positive_or_mixed",
      outcome: "repair_attempt",
      stage: "planned_or_active",
      affects: ["trust", "belonging", "communication", "friendship_stability"],
      commonEmotions: ["hope", "anxiety", "guilt", "relief"],
      commonNeeds: ["repair_script", "accountability", "patience"],
      possibleNextEvents: ["apology", "reconnection", "boundary_setting"],
      threshold: 5,
      signals: [
        ["raw", /\b(make amends|repair the friendship|fix things with my friend|apologize to my friend|clear the air)\b/, 4],
        ["domainAny", ["friendship", "social"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "friendship_change",
      subtype: "growing_apart",
      label: "Growing Apart From Friends",
      importance: "major",
      expectedDuration: "weeks_to_years",
      polarity: "mixed_or_negative",
      outcome: "friendship_distance",
      stage: "active_or_reflective",
      affects: ["belonging", "identity", "routine", "grief"],
      commonEmotions: ["sadness", "nostalgia", "confusion", "acceptance"],
      commonNeeds: ["meaning_making", "non_blame_framing", "next_social_step"],
      possibleNextEvents: ["friendship_reassessment", "new_friendship", "social_grief"],
      threshold: 5,
      signals: [
        ["raw", /\b(growing apart|not close anymore|friends changed|drifting from friends|lost touch)\b/, 4],
        ["domainAny", ["friendship", "social"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "friendship_loss",
      subtype: "friendship_ending",
      label: "Friendship Ending",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "negative_or_mixed",
      outcome: "social_loss",
      stage: "active_or_recent",
      affects: ["belonging", "grief", "identity", "routine"],
      commonEmotions: ["sadness", "anger", "relief", "loneliness"],
      commonNeeds: ["grief_support", "perspective", "social_rebuilding"],
      possibleNextEvents: ["social_withdrawal", "new_friendship", "friendship_repair"],
      threshold: 5,
      signals: [
        ["raw", /\b(friendship ended|not friends anymore|lost a friend|cut off my friend|friend cut me off)\b/, 4],
        ["domainAny", ["friendship", "social"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "social_life_event",
      type: "belonging",
      subtype: "feeling_accepted",
      label: "Feeling Accepted",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "positive",
      outcome: "felt_belonging",
      stage: "active_or_recent",
      affects: ["belonging", "confidence", "identity", "mood"],
      commonEmotions: ["relief", "joy", "gratitude", "confidence"],
      commonNeeds: ["celebration", "reflection", "connection_protection"],
      possibleNextEvents: ["friendship_deepening", "social_confidence", "joining_group"],
      threshold: 5,
      signals: [
        ["raw", /\b(felt accepted|they accepted me|felt included|felt like I belonged|real friends)\b/, 4],
        ["domainAny", ["social", "friendship", "community"], 2],
        ["polarity", "positive", 1]
      ]
    },

    {
      category: "social_life_event",
      type: "belonging",
      subtype: "feeling_like_outsider",
      label: "Feeling Like an Outsider",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative",
      outcome: "low_belonging",
      stage: "active_or_ongoing",
      affects: ["belonging", "confidence", "identity", "mental_health"],
      commonEmotions: ["loneliness", "sadness", "awkwardness", "shame"],
      commonNeeds: ["validation", "normalization", "small_connection_steps"],
      possibleNextEvents: ["social_withdrawal", "joining_group", "friendship_building"],
      threshold: 5,
      signals: [
        ["raw", /\b(feel like an outsider|don't belong|never fit in|out of place|everyone has friends but me)\b/, 4],
        ["domainAny", ["social", "friendship", "community"], 2],
        ["emotionAny", ["loneliness", "sadness"], 1]
      ]
    },

    {
      category: "social_life_event",
      type: "loneliness",
      subtype: "wanting_connection",
      label: "Wanting Connection",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "connection_need",
      stage: "active",
      affects: ["belonging", "mental_health", "routine", "identity"],
      commonEmotions: ["loneliness", "hope", "sadness", "anxiety"],
      commonNeeds: ["gentle_encouragement", "practical_social_steps", "dignity"],
      possibleNextEvents: ["friendship_building", "joining_group", "romantic_connection_goal"],
      threshold: 5,
      signals: [
        ["raw", /\b(lonely|feel alone|want connection|need friends|wish I had people|no one to talk to)\b/, 4],
        ["domainAny", ["social", "friendship", "relationship"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "social_anxiety",
      subtype: "fear_of_socializing",
      label: "Fear of Socializing",
      importance: "major",
      expectedDuration: "days_to_years",
      polarity: "negative_or_mixed",
      outcome: "social_avoidance_pressure",
      stage: "active_or_anticipatory",
      affects: ["confidence", "belonging", "routine", "mental_health"],
      commonEmotions: ["anxiety", "fear", "shame", "hope"],
      commonNeeds: ["low_pressure_steps", "normalization", "self_compassion"],
      possibleNextEvents: ["declining_invitation", "social_success", "therapy_consideration"],
      threshold: 5,
      signals: [
        ["raw", /\b(social anxiety|afraid to socialize|nervous around people|awkward socially|scared to meet people)\b/, 4],
        ["domainAny", ["social", "mental_health", "friendship"], 2],
        ["emotion", "anxiety", 1]
      ]
    },

    {
      category: "social_life_event",
      type: "social_confidence",
      subtype: "positive_social_experience",
      label: "Positive Social Experience",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "positive",
      outcome: "social_confidence_gain",
      stage: "completed_or_recent",
      affects: ["confidence", "belonging", "mood", "identity"],
      commonEmotions: ["relief", "joy", "pride", "hope"],
      commonNeeds: ["celebration", "reinforcement", "next_step"],
      possibleNextEvents: ["new_friendship", "social_momentum", "joining_group"],
      threshold: 5,
      signals: [
        ["raw", /\b(had a good time|socializing went well|people liked me|made a connection|great conversation)\b/, 4],
        ["domainAny", ["social", "friendship"], 2],
        ["polarity", "positive", 1]
      ]
    },

    {
      category: "social_life_event",
      type: "social_overwhelm",
      subtype: "too_many_social_demands",
      label: "Social Overwhelm",
      importance: "moderate",
      expectedDuration: "days_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "social_energy_depletion",
      stage: "active",
      affects: ["energy", "boundaries", "mood", "relationships"],
      commonEmotions: ["overwhelm", "guilt", "fatigue", "irritability"],
      commonNeeds: ["boundary_setting", "permission_to_rest", "prioritization"],
      possibleNextEvents: ["declining_invitation", "burnout", "social_balance"],
      threshold: 5,
      signals: [
        ["raw", /\b(too many plans|socially drained|people keep asking me|overwhelmed by friends|need space from everyone)\b/, 4],
        ["domainAny", ["social", "friendship", "mental_health"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "group_dynamics",
      subtype: "friend_group_drama",
      label: "Friend Group Drama",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "group_tension",
      stage: "active_or_recent",
      affects: ["belonging", "trust", "stress", "social_routine"],
      commonEmotions: ["frustration", "anxiety", "anger", "confusion"],
      commonNeeds: ["deescalation", "boundaries", "not_taking_sides"],
      possibleNextEvents: ["friendship_conflict", "social_withdrawal", "repair_conversation"],
      threshold: 5,
      signals: [
        ["raw", /\b(friend group drama|group chat drama|everyone is fighting|drama in the group|taking sides)\b/, 4],
        ["domainAny", ["social", "friendship"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "group_dynamics",
      subtype: "being_used_socially",
      label: "Feeling Used by Friends",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative",
      outcome: "social_exploitation_concern",
      stage: "active_or_recent",
      affects: ["trust", "boundaries", "self_respect", "belonging"],
      commonEmotions: ["resentment", "hurt", "anger", "confusion"],
      commonNeeds: ["boundary_clarity", "pattern_recognition", "self_respect"],
      possibleNextEvents: ["boundary_setting", "friendship_reassessment", "friendship_conflict"],
      threshold: 5,
      signals: [
        ["raw", /\b(using me|only call when they need something|fake friends|taken advantage of|one-sided friendship)\b/, 4],
        ["domainAny", ["friendship", "social"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "social_life_event",
      type: "support_received",
      subtype: "friends_helping",
      label: "Friends Helping",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_days",
      polarity: "positive",
      outcome: "received_friend_support",
      stage: "completed_or_recent",
      affects: ["belonging", "trust", "gratitude", "mood"],
      commonEmotions: ["gratitude", "joy", "relief", "love"],
      commonNeeds: ["celebration", "appreciation", "connection"],
      possibleNextEvents: ["friendship_deepening", "expressing_appreciation", "social_confidence"],
      threshold: 5,
      signals: [
        ["raw", /\b(friends helped me|my friends helped|went out of their way|real friends|helped me with errands|helped me with chores)\b/, 4],
        ["actorAny", ["friends"], 2],
        ["semantic", "support_received", 2]
      ]
    },

    {
      category: "social_life_event",
      type: "support_requested",
      subtype: "asking_friends_for_help",
      label: "Asking Friends for Help",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_days",
      polarity: "mixed",
      outcome: "support_request",
      stage: "planned_or_active",
      affects: ["vulnerability", "trust", "belonging", "pride"],
      commonEmotions: ["anxiety", "hope", "embarrassment", "relief"],
      commonNeeds: ["wording_help", "permission", "specific_request"],
      possibleNextEvents: ["support_received", "rejection", "friendship_deepening"],
      threshold: 5,
      signals: [
        ["raw", /\b(ask my friends for help|need help from friends|should I ask them for help|how do I ask my friend)\b/, 4],
        ["domainAny", ["friendship", "social"], 2],
        ["speechAct", "question", 1]
      ]
    },

    {
      category: "social_life_event",
      type: "social_boundary",
      subtype: "setting_boundaries_with_friends",
      label: "Setting Boundaries With Friends",
      importance: "major",
      expectedDuration: "days_to_weeks",
      polarity: "mixed",
      outcome: "social_boundary_change",
      stage: "planned_or_active",
      affects: ["trust", "self_respect", "belonging", "communication"],
      commonEmotions: ["guilt", "anxiety", "relief", "strength"],
      commonNeeds: ["clear_language", "validation", "consistency"],
      possibleNextEvents: ["friendship_conflict", "respect", "friendship_reassessment"],
      threshold: 5,
      signals: [
        ["raw", /\b(boundaries with friends|set boundaries with my friend|tell my friend no|need space from my friends)\b/, 4],
        ["domainAny", ["friendship", "social"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "social_status",
      subtype: "feeling_judged",
      label: "Feeling Judged Socially",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "social_evaluation_concern",
      stage: "active_or_recent",
      affects: ["confidence", "belonging", "identity", "mood"],
      commonEmotions: ["shame", "anxiety", "anger", "self_consciousness"],
      commonNeeds: ["grounding", "perspective", "self_respect"],
      possibleNextEvents: ["social_withdrawal", "boundary_setting", "confidence_rebuild"],
      threshold: 5,
      signals: [
        ["raw", /\b(judging me|felt judged|they think I'm weird|people are judging|embarrassed in front of everyone)\b/, 4],
        ["domainAny", ["social", "friendship", "mental_health"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "community_belonging",
      subtype: "finding_community",
      label: "Finding Community",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "community_belonging",
      stage: "active_or_goal",
      affects: ["belonging", "identity", "routine", "support"],
      commonEmotions: ["hope", "relief", "excitement", "cautiousness"],
      commonNeeds: ["encouragement", "consistency", "values_alignment"],
      possibleNextEvents: ["joining_group", "friendship_building", "identity_growth"],
      threshold: 5,
      signals: [
        ["raw", /\b(find my community|found a community|people like me|my people|sense of community)\b/, 4],
        ["domainAny", ["community", "social", "identity"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "community_loss",
      subtype: "leaving_group",
      label: "Leaving a Group or Community",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "community_departure",
      stage: "planned_or_recent",
      affects: ["belonging", "identity", "routine", "social_support"],
      commonEmotions: ["grief", "relief", "fear", "uncertainty"],
      commonNeeds: ["meaning_making", "transition_support", "new_connection_plan"],
      possibleNextEvents: ["finding_community", "social_loneliness", "identity_reassessment"],
      threshold: 5,
      signals: [
        ["raw", /\b(leaving the group|left my community|leaving church group|quit the club|not going back to that group)\b/, 4],
        ["domainAny", ["community", "social", "identity"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "social_event",
      subtype: "party_or_gathering",
      label: "Party or Gathering",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "positive_or_mixed",
      outcome: "social_gathering",
      stage: "planned_or_completed",
      affects: ["belonging", "social_energy", "routine", "relationships"],
      commonEmotions: ["excitement", "anxiety", "joy", "fatigue"],
      commonNeeds: ["decision_support", "social_plan", "energy_boundary"],
      possibleNextEvents: ["positive_social_experience", "social_anxiety", "social_overwhelm"],
      threshold: 5,
      signals: [
        ["raw", /\b(party|gathering|barbecue|bbq|hangout|social event|get-together|get together)\b/, 4],
        ["domainAny", ["social", "friendship"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "social_event",
      subtype: "holiday_social_pressure",
      label: "Holiday Social Pressure",
      importance: "moderate_to_major",
      expectedDuration: "days_to_weeks",
      polarity: "mixed_or_stressful",
      outcome: "social_obligation_pressure",
      stage: "anticipated_or_active",
      affects: ["family", "friendship", "energy", "boundaries", "mood"],
      commonEmotions: ["stress", "guilt", "excitement", "dread"],
      commonNeeds: ["boundaries", "planning", "values_alignment"],
      possibleNextEvents: ["family_conflict", "social_overwhelm", "connection"],
      threshold: 5,
      signals: [
        ["raw", /\b(holiday plans|thanksgiving|christmas|new years|family gathering|holiday party)\b/, 4],
        ["domainAny", ["social", "family", "friendship"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "social_reputation",
      subtype: "rumor_or_gossip",
      label: "Rumor or Gossip",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative",
      outcome: "reputation_threat",
      stage: "active_or_recent",
      affects: ["trust", "belonging", "confidence", "anger"],
      commonEmotions: ["anger", "shame", "anxiety", "betrayal"],
      commonNeeds: ["grounding", "boundary_strategy", "reputation_repair"],
      possibleNextEvents: ["friendship_conflict", "hard_conversation", "social_withdrawal"],
      threshold: 5,
      signals: [
        ["raw", /\b(gossip|rumor|talking behind my back|spreading things|people are saying)\b/, 4],
        ["domainAny", ["social", "friendship"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "social_life_event",
      type: "social_repair",
      subtype: "apologizing_socially",
      label: "Social Apology",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_days",
      polarity: "positive_or_mixed",
      outcome: "social_repair_attempt",
      stage: "planned_or_active",
      affects: ["trust", "belonging", "self_respect", "communication"],
      commonEmotions: ["guilt", "anxiety", "hope", "relief"],
      commonNeeds: ["accountability", "clear_wording", "patience"],
      possibleNextEvents: ["friendship_repair", "acceptance", "rejection"],
      threshold: 5,
      signals: [
        ["raw", /\b(apologize to everyone|say sorry to my friends|social apology|make things right with them)\b/, 4],
        ["domainAny", ["social", "friendship"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "social_withdrawal",
      subtype: "pulling_away",
      label: "Pulling Away Socially",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_protective",
      outcome: "reduced_social_contact",
      stage: "active_or_ongoing",
      affects: ["belonging", "mental_health", "routine", "support"],
      commonEmotions: ["numbness", "sadness", "relief", "loneliness"],
      commonNeeds: ["gentle_check_in", "low_pressure_reconnection", "self_compassion"],
      possibleNextEvents: ["loneliness", "friendship_loss", "reconnection_attempt"],
      threshold: 5,
      signals: [
        ["raw", /\b(isolating|pulling away from friends|stopped talking to people|don't want to see anyone|avoiding everyone)\b/, 4],
        ["domainAny", ["social", "friendship", "mental_health"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "friendship_deepening",
      subtype: "vulnerability_with_friend",
      label: "Vulnerability With Friend",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "positive_or_mixed",
      outcome: "friendship_depth_increase",
      stage: "active_or_recent",
      affects: ["trust", "belonging", "emotional_security", "identity"],
      commonEmotions: ["relief", "fear", "gratitude", "closeness"],
      commonNeeds: ["validation", "appreciation", "trust_protection"],
      possibleNextEvents: ["support_received", "friendship_deepening", "fear_of_rejection"],
      threshold: 5,
      signals: [
        ["raw", /\b(opened up to my friend|told my friend something personal|vulnerable with my friend|deep talk with friend)\b/, 4],
        ["domainAny", ["friendship", "social"], 2]
      ]
    },

    {
      category: "social_life_event",
      type: "social_success",
      subtype: "making_a_good_impression",
      label: "Making a Good Impression",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "positive",
      outcome: "social_confidence_gain",
      stage: "completed_or_recent",
      affects: ["confidence", "belonging", "identity", "mood"],
      commonEmotions: ["pride", "relief", "joy", "hope"],
      commonNeeds: ["celebration", "reinforcement", "momentum"],
      possibleNextEvents: ["new_friendship", "social_invitation", "community_belonging"],
      threshold: 5,
      signals: [
        ["raw", /\b(made a good impression|they liked me|conversation went well|hit it off|clicked with them)\b/, 4],
        ["domainAny", ["social", "friendship"], 2],
        ["polarity", "positive", 1]
      ]
    }
  ]
};

window.Ari.eventOntologySocialLife = window.AriEventOntologySocialLife;

console.log(
  "ARI EVENT ONTOLOGY SOCIAL LIFE LOADED:",
  window.AriEventOntologySocialLife.version
);