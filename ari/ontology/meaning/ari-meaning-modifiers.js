// ari/ontology/meaning/ari-meaning-modifiers.js
// Purpose: Universal meaning modifiers.
// V0.1.0 — Meaning Experience Modifiers

window.Ari = window.Ari || {};

window.AriMeaningModifiers = {
  version: "0.1.0",

  modifiers: [

    // --------------------------------------------------
    // TIME
    // --------------------------------------------------

    {
      id: "new",
      family: "time",
      label: "New",
      description: "Recently started or recently discovered."
    },

    {
      id: "ongoing",
      family: "time",
      label: "Ongoing",
      description: "Still happening."
    },

    {
      id: "resolved",
      family: "time",
      label: "Resolved",
      description: "Has already been resolved."
    },

    {
      id: "recurring",
      family: "time",
      label: "Recurring",
      description: "Has happened multiple times."
    },

    {
      id: "anticipated",
      family: "time",
      label: "Anticipated",
      description: "Expected to happen in the future."
    },

    // --------------------------------------------------
    // CERTAINTY
    // --------------------------------------------------

    {
      id: "certain",
      family: "certainty",
      label: "Certain",
      description: "The user speaks with confidence."
    },

    {
      id: "uncertain",
      family: "certainty",
      label: "Uncertain",
      description: "The user is unsure."
    },

    {
      id: "suspected",
      family: "certainty",
      label: "Suspected",
      description: "The user believes something may be true."
    },

    // --------------------------------------------------
    // CONTROL
    // --------------------------------------------------

    {
      id: "voluntary",
      family: "control",
      label: "Voluntary",
      description: "The person chose the situation."
    },

    {
      id: "forced",
      family: "control",
      label: "Forced",
      description: "The situation happened without the person's choice."
    },

    {
      id: "controllable",
      family: "control",
      label: "Controllable",
      description: "The person has meaningful influence."
    },

    {
      id: "uncontrollable",
      family: "control",
      label: "Uncontrollable",
      description: "The situation is largely outside the person's control."
    },

    // --------------------------------------------------
    // PERSONAL IMPORTANCE
    // --------------------------------------------------

    {
      id: "minor",
      family: "importance",
      label: "Minor",
      description: "Low personal significance."
    },

    {
      id: "moderate",
      family: "importance",
      label: "Moderate",
      description: "Moderately important."
    },

    {
      id: "major",
      family: "importance",
      label: "Major",
      description: "Highly significant."
    },

    {
      id: "life_changing",
      family: "importance",
      label: "Life Changing",
      description: "Fundamentally alters life direction."
    },

    // --------------------------------------------------
    // STABILITY
    // --------------------------------------------------

    {
      id: "temporary",
      family: "stability",
      label: "Temporary",
      description: "Likely to pass."
    },

    {
      id: "long_term",
      family: "stability",
      label: "Long-Term",
      description: "Likely to persist."
    },

    {
      id: "permanent",
      family: "stability",
      label: "Permanent",
      description: "Not realistically reversible."
    },

    // --------------------------------------------------
    // SOCIAL
    // --------------------------------------------------

    {
      id: "private",
      family: "social",
      label: "Private",
      description: "Known only to a few people."
    },

    {
      id: "public",
      family: "social",
      label: "Public",
      description: "Visible to many people."
    },

    {
      id: "shared",
      family: "social",
      label: "Shared",
      description: "Experienced together with others."
    },

    {
      id: "isolated",
      family: "social",
      label: "Isolated",
      description: "Experienced alone."
    },

    // --------------------------------------------------
    // EMOTIONAL DIRECTION
    // --------------------------------------------------

    {
      id: "hopeful",
      family: "emotion",
      label: "Hopeful",
      description: "Carries optimism."
    },

    {
      id: "discouraging",
      family: "emotion",
      label: "Discouraging",
      description: "Reduces hope or motivation."
    },

    {
      id: "celebratory",
      family: "emotion",
      label: "Celebratory",
      description: "Deserves celebration."
    },

    {
      id: "threatening",
      family: "emotion",
      label: "Threatening",
      description: "Feels dangerous or risky."
    },

    {
      id: "confusing",
      family: "emotion",
      label: "Confusing",
      description: "Creates uncertainty or lack of clarity."
    },

    // --------------------------------------------------
    // IDENTITY
    // --------------------------------------------------

    {
      id: "identity_building",
      family: "identity",
      label: "Identity Building",
      description: "Strengthens who the person is becoming."
    },

    {
      id: "identity_threatening",
      family: "identity",
      label: "Identity Threatening",
      description: "Challenges the person's self-concept."
    },

    {
      id: "identity_confirming",
      family: "identity",
      label: "Identity Confirming",
      description: "Reinforces existing identity."
    },

    // --------------------------------------------------
    // RELATIONSHIPS
    // --------------------------------------------------

    {
      id: "relationship_strengthening",
      family: "relationship",
      label: "Relationship Strengthening",
      description: "Improves closeness or trust."
    },

    {
      id: "relationship_straining",
      family: "relationship",
      label: "Relationship Straining",
      description: "Creates distance or conflict."
    },

    // --------------------------------------------------
    // GOALS
    // --------------------------------------------------

    {
      id: "goal_aligned",
      family: "goals",
      label: "Goal Aligned",
      description: "Moves the person toward an important goal."
    },

    {
      id: "goal_blocking",
      family: "goals",
      label: "Goal Blocking",
      description: "Interferes with progress."
    },

    // --------------------------------------------------
    // RESPONSE STYLE
    // --------------------------------------------------

    {
      id: "needs_empathy",
      family: "response",
      label: "Needs Empathy",
      description: "Responding emotionally first is important."
    },

    {
      id: "needs_information",
      family: "response",
      label: "Needs Information",
      description: "The user primarily needs facts."
    },

    {
      id: "needs_problem_solving",
      family: "response",
      label: "Needs Problem Solving",
      description: "The user likely wants practical solutions."
    },

    {
      id: "needs_clarification",
      family: "response",
      label: "Needs Clarification",
      description: "Ari should ask before assuming."
    },

    {
      id: "needs_action",
      family: "response",
      label: "Needs Action",
      description: "Immediate practical steps are appropriate."
    }

  ]
};

window.Ari.meaningModifiers = window.AriMeaningModifiers;

console.log(
  "ARI MEANING MODIFIERS LOADED:",
  window.AriMeaningModifiers.version,
  "modifiers:",
  window.AriMeaningModifiers.modifiers.length
);