// ari/medical/infectious-disease/infection-control/ari-reportable-disease-engine.js
// Purpose: Detect potentially reportable infectious diseases and recommend
// Infection Prevention / Public Health workflow.
// V1.0.0 — Reportable Disease Engine / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.infectionControl =
  window.Ari.medical.infectiousDisease.infectionControl || {};

window.Ari.medical.infectiousDisease.infectionControl.reportableDiseaseEngine = {

  version: "1.0.0",

  evaluate(room = {}, input = {}) {

    const registry =
      window.Ari.medical.infectiousDisease
        .infectionControl
        .reportableDiseaseRegistry;

    if (!registry?.search) {
      return this.empty();
    }

    const text = this.buildSearchText(room, input);

    const matches = registry.search(text);

    return {
      engine: "ari-reportable-disease-engine",
      version: this.version,

      reportableDiseases: matches,

      notifyInfectionPrevention:
        matches.some(x =>
          x.reporting?.notifyInfectionPrevention
        ),

      notifyPublicHealth:
        matches.some(x =>
          x.reporting?.notifyPublicHealth
        ),

      actions:
        this.collectActions(matches),

      precautions:
        this.collectPrecautions(matches),

      followUpQuestions:
        this.collectQuestions(matches),

      advisoryOnly: true
    };

  },

  writeToRoom(room = {}, input = {}) {

    const result = this.evaluate(room, input);

    const situationRoom =
      window.Ari.medical.executive?.situationRoom;

    if (!situationRoom?.write) return room;

    result.reportableDiseases.forEach(disease => {

      situationRoom.write(room, {

        section: "reportableDiseases",

        engine: "ari-reportable-disease-engine",

        type: "reportable_disease",

        value: disease.diseaseName,

        umkoId: disease.umkoId,

        confidence: "medium",

        priority:
          disease.urgency === "critical"
            ? "critical"
            : disease.urgency === "urgent"
            ? "high"
            : "moderate",

        rationale: [
          "Matched Reportable Disease Registry."
        ]

      });

    });

    result.actions.forEach(actionId => {

      situationRoom.write(room, {

        section: "providerActions",

        engine: "ari-reportable-disease-engine",

        type: "recommended_action",

        value: actionId,

        actionId,

        confidence: "medium",

        priority: "high",

        rationale: [
          "Triggered by reportable disease workflow."
        ]

      });

    });

    result.precautions.forEach(precaution => {

      situationRoom.write(room, {

        section: "precautions",

        engine: "ari-reportable-disease-engine",

        type: "infection_precaution",

        value: precaution,

        confidence: "medium",

        priority: "high",

        rationale: [
          "Recommended from Reportable Disease Registry."
        ]

      });

    });

    result.followUpQuestions.forEach(question => {

      situationRoom.write(room, {

        section: "questions",

        engine: "ari-reportable-disease-engine",

        type: "follow_up",

        value: question,

        confidence: "medium",

        priority: "routine",

        rationale: [
          "Needed to refine reportable disease assessment."
        ]

      });

    });

    return room;

  },

  collectActions(matches = []) {

    return [
      ...new Set(
        matches.flatMap(
          x => x.infectionControl?.actions || []
        )
      )
    ];

  },

  collectPrecautions(matches = []) {

    return [
      ...new Set(
        matches.flatMap(
          x => x.infectionControl?.precautions || []
        )
      )
    ];

  },

  collectQuestions(matches = []) {

    return [
      ...new Set(
        matches.flatMap(
          x => x.followUpQuestions || []
        )
      )
    ];

  },

  buildSearchText(room = {}, input = {}) {

    return JSON.stringify({

      chiefComplaint:
        room.chiefComplaint,

      symptoms:
        room.symptoms,

      organisms:
        room.suspectedOrganisms,

      diseases:
        room.suspectedDiseases,

      observations:
        room.observations,

      message:
        input.userMessage ||
        input.message ||
        input.input ||
        ""

    }).toLowerCase();

  },

  empty() {

    return {

      engine: "ari-reportable-disease-engine",

      version: this.version,

      reportableDiseases: [],

      notifyInfectionPrevention: false,

      notifyPublicHealth: false,

      actions: [],

      precautions: [],

      followUpQuestions: [],

      advisoryOnly: true

    };

  }

};

window.AriReportableDiseaseEngine =
  window.Ari.medical.infectiousDisease
    .infectionControl
    .reportableDiseaseEngine;

console.log(
  "ARI REPORTABLE DISEASE ENGINE LOADED:",
  window.Ari.medical.infectiousDisease
    .infectionControl
    .reportableDiseaseEngine.version
);