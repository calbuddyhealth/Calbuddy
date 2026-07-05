// ari/ontology/events/ari-event-ontology-index.js
// Purpose: Combine all Ari event ontology modules into one global event ontology.
// V0.1.0 — Event Ontology Index

window.Ari = window.Ari || {};

window.AriEventOntology = {
  version: "0.1.0",

  definitions: [
    ...(window.AriEventOntologyLifeTransitions?.definitions || []),
    ...(window.AriEventOntologyRelationships?.definitions || []),
    ...(window.AriEventOntologyFamilyParenthood?.definitions || []),
    ...(window.AriEventOntologySocialLife?.definitions || []),
    ...(window.AriEventOntologyEducation?.definitions || []),
    ...(window.AriEventOntologyCareerMilitary?.definitions || []),
    ...(window.AriEventOntologyHealth?.definitions || []),
    ...(window.AriEventOntologyMentalHealth?.definitions || []),
    ...(window.AriEventOntologyFinanceLegal?.definitions || []),
    ...(window.AriEventOntologyCrisisAchievementLifestyleTech?.definitions || [])
  ]
};

window.Ari.eventOntology = window.AriEventOntology;

console.log(
  "ARI EVENT ONTOLOGY INDEX LOADED:",
  window.AriEventOntology.version,
  "definitions:",
  window.AriEventOntology.definitions.length
);