// ari/medical/infectious-disease/infection-control/ari-exposure-management-engine.js
// Purpose: Detect exposure scenarios and write PEP/exposure workflows to the Situation Room.
// V1.0.0 — Exposure Management Engine / PEP Workflow

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.infectionControl =
  window.Ari.medical.infectiousDisease.infectionControl || {};

window.Ari.medical.infectiousDisease.infectionControl.exposureManagementEngine = {
  version: "1.0.0",

  evaluate(input = {}) {
    const room = input.room || input.situationRoom || {};
    const registry =
      window.Ari.medical.infectiousDisease.infectionControl.postExposureRegistry;

    if (!registry?.entries) {
      return this.empty("Post-Exposure Registry not loaded.");
    }

    const text = this.normalize(
      [
        input.text,
        input.userMessage,
        input.message,
        input.input,
        room.chiefComplaint,
        JSON.stringify(room || {})
      ].filter(Boolean).join(" ")
    );

    const matches = registry.entries().filter(entry =>
      this.matchesEntry(text, entry)
    );

    return {
      engine: "ari-exposure-management-engine",
      version: this.version,
      activated: matches.length > 0,
      exposures: matches,
      actions: this.collect(matches, "recommendedActions"),
      questions: this.collect(matches, "followUpQuestions"),
      priority: this.priorityFor(matches),
      rationale: matches.map(entry =>
        `Exposure workflow matched: ${entry.exposure}.`
      ),
      advisoryOnly: true
    };
  },

  writeToRoom(room = {}, input = {}) {
    const result = this.evaluate({
      ...input,
      room
    });

    const situationRoom = window.Ari.medical.executive?.situationRoom;

    if (!situationRoom?.write) return room;

    result.exposures.forEach(exposure => {
      situationRoom.write(room, {
        section: "risks",
        engine: "ari-exposure-management-engine",
        type: "exposure_risk",
        value: exposure.exposure,
        umkoId: exposure.umkoId,
        confidence: "medium",
        priority: this.priorityFor([exposure]),
        rationale: [
          `Matched post-exposure workflow: ${exposure.exposure}.`
        ]
      });
    });

    result.actions.forEach(actionId => {
      situationRoom.write(room, {
        section: "providerActions",
        engine: "ari-exposure-management-engine",
        type: "exposure_action",
        value: actionId,
        actionId,
        confidence: "medium",
        priority: result.priority,
        rationale: result.rationale
      });
    });

    result.questions.forEach(question => {
      situationRoom.write(room, {
        section: "questions",
        engine: "ari-exposure-management-engine",
        type: "exposure_follow_up",
        value: question,
        confidence: "medium",
        priority: "routine",
        rationale: [
          "Needed to refine post-exposure prophylaxis workflow."
        ]
      });
    });

    return room;
  },

  matchesEntry(text = "", entry = {}) {
    const aliases = entry.aliases || [];
    return aliases.some(alias =>
      text.includes(this.normalize(alias))
    );
  },

  collect(entries = [], field = "") {
    return [
      ...new Set(
        entries.flatMap(entry => entry[field] || [])
      )
    ];
  },

  priorityFor(entries = []) {
    if (entries.some(entry => entry.urgency === "critical")) return "critical";
    if (entries.some(entry => entry.urgency === "urgent")) return "high";
    return "routine";
  },

  empty(error = "") {
    return {
      engine: "ari-exposure-management-engine",
      version: this.version,
      activated: false,
      exposures: [],
      actions: [],
      questions: [],
      priority: "routine",
      rationale: [],
      error,
      advisoryOnly: true
    };
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

window.AriExposureManagementEngine =
  window.Ari.medical.infectiousDisease
    .infectionControl.exposureManagementEngine;

console.log(
  "ARI EXPOSURE MANAGEMENT ENGINE LOADED:",
  window.Ari.medical.infectiousDisease
    .infectionControl.exposureManagementEngine.version
);