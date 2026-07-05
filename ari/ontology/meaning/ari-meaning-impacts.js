// ari/ontology/meaning/ari-meaning-impacts.js
// Purpose: Universal human impact areas for Ari Meaning Interpreter.
// V0.1.0 — Meaning Impact Areas

window.Ari = window.Ari || {};

window.AriMeaningImpacts = {
  version: "0.1.0",

  impacts: [
    {
      id: "identity",
      label: "Identity",
      description: "Affects how the person sees themselves."
    },
    {
      id: "confidence",
      label: "Confidence",
      description: "Affects belief in self, ability, or worth."
    },
    {
      id: "health",
      label: "Health",
      description: "Affects physical health, symptoms, body, or wellness."
    },
    {
      id: "safety",
      label: "Safety",
      description: "Affects immediate safety or risk."
    },
    {
      id: "mood",
      label: "Mood",
      description: "Affects emotional state."
    },
    {
      id: "stress",
      label: "Stress",
      description: "Adds pressure, urgency, or emotional load."
    },
    {
      id: "motivation",
      label: "Motivation",
      description: "Affects drive, discipline, or willingness to act."
    },
    {
      id: "routine",
      label: "Routine",
      description: "Affects daily structure, habits, sleep, or schedule."
    },
    {
      id: "relationships",
      label: "Relationships",
      description: "Affects romantic, family, friend, or social bonds."
    },
    {
      id: "family",
      label: "Family",
      description: "Affects family roles, caregiving, parenting, or household life."
    },
    {
      id: "belonging",
      label: "Belonging",
      description: "Affects feeling included, accepted, or socially connected."
    },
    {
      id: "trust",
      label: "Trust",
      description: "Affects confidence in another person or system."
    },
    {
      id: "career",
      label: "Career",
      description: "Affects work, professional identity, advancement, or employment."
    },
    {
      id: "education",
      label: "Education",
      description: "Affects school, learning, exams, credentials, or academic progress."
    },
    {
      id: "finances",
      label: "Finances",
      description: "Affects money, debt, income, spending, or security."
    },
    {
      id: "future",
      label: "Future",
      description: "Affects plans, direction, stability, or long-term path."
    },
    {
      id: "decision_making",
      label: "Decision Making",
      description: "Affects choice, uncertainty, tradeoffs, or next steps."
    },
    {
      id: "autonomy",
      label: "Autonomy",
      description: "Affects control, freedom, independence, or boundaries."
    },
    {
      id: "purpose",
      label: "Purpose",
      description: "Affects meaning, values, direction, or life mission."
    },
    {
      id: "values",
      label: "Values",
      description: "Affects moral priorities, beliefs, loyalty, or integrity."
    },
    {
      id: "goals",
      label: "Goals",
      description: "Affects progress toward something the person wants."
    },
    {
      id: "time",
      label: "Time",
      description: "Affects schedule, bandwidth, deadlines, or availability."
    },
    {
      id: "energy",
      label: "Energy",
      description: "Affects fatigue, capacity, burnout, or ability to function."
    },
    {
      id: "grief",
      label: "Grief",
      description: "Affects mourning, loss, attachment, or emotional processing."
    },
    {
      id: "responsibility",
      label: "Responsibility",
      description: "Affects duty, obligation, leadership, caregiving, or burden."
    },
    {
      id: "support",
      label: "Support",
      description: "Affects whether the person has help, backup, or emotional presence."
    },
    {
      id: "communication",
      label: "Communication",
      description: "Affects what needs to be said, clarified, repaired, or asked."
    },
    {
      id: "legal_admin",
      label: "Legal / Admin",
      description: "Affects paperwork, legal status, benefits, records, or official process."
    },
    {
      id: "spirituality",
      label: "Spirituality",
      description: "Affects faith, belief, sacred meaning, or spiritual identity."
    },
    {
      id: "creativity",
      label: "Creativity",
      description: "Affects building, writing, designing, making, or expressing something."
    }
  ]
};

window.Ari.meaningImpacts = window.AriMeaningImpacts;

console.log(
  "ARI MEANING IMPACTS LOADED:",
  window.AriMeaningImpacts.version,
  "impacts:",
  window.AriMeaningImpacts.impacts.length
);