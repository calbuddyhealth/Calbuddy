// ari/simulation-system/ari-simulation-engine.js
// Ari Simulation Engine
// Purpose: Explore possible future outcomes, tradeoffs, and consequences.
// V1.0

window.Ari = window.Ari || {};

window.Ari.simulationEngine = {
  version: "1.0.0",

  simulate({
    values = {},
    identity = {},
    conflicts = {},
    executive = {},
    meaning = {},
    personModel = {},
    beliefModel = {}
  } = {}) {

    const simulations = [];

    this.simulateFamilyVsCareer({
      values,
      identity,
      conflicts,
      meaning,
      personModel,
      beliefModel,
      simulations
    });

    this.simulateAccelerationVsPresence({
      values,
      meaning,
      beliefModel,
      simulations
    });

    this.simulateRestVsResponsibility({
      values,
      beliefModel,
      simulations
    });

    const primarySimulation =
      this.choosePrimarySimulation(simulations);

    return {
      simulations,
      primarySimulation,
      source: "ari-simulation-engine"
    };
  },

  simulateFamilyVsCareer({
    values = {},
    identity = {},
    conflicts = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    simulations = []
  } = {}) {

    const dominantValue = values.dominantValue;
    const lifeChapter = personModel.lifeChapter?.name;
    const conflict = conflicts.primaryConflict?.name;
    const belief = beliefModel.primaryBelief?.name;

    if (
      dominantValue === "family" ||
      lifeChapter === "fatherhood_and_transition" ||
      conflict === "service_vs_family"
    ) {

      simulations.push({
        name: "family_vs_career",

        confidence: "medium",

        pathA: {
          name: "career_acceleration",

          gains: [
            "professional growth",
            "career momentum",
            "future opportunities"
          ],

          costs: [
            "reduced family presence",
            "higher stress",
            "less recovery"
          ]
        },

        pathB: {
          name: "family_presence",

          gains: [
            "relationship investment",
            "family memories",
            "emotional availability"
          ],

          costs: [
            "slower career growth",
            "fear of falling behind"
          ]
        },

        likelyRegret:
          belief === "achievement_creates_security"
            ? "missing irreplaceable family moments"
            : "unclear",

        theme: "presence_vs_acceleration"
      });
    }
  },

  simulateAccelerationVsPresence({
    values = {},
    meaning = {},
    beliefModel = {},
    simulations = []
  } = {}) {

    const belief = beliefModel.primaryBelief?.name;
    const theme = meaning.theme;

    if (
      belief === "achievement_creates_security" ||
      theme === "family_transition"
    ) {

      simulations.push({
        name: "acceleration_vs_presence",

        confidence: "medium",

        pathA: {
          name: "keep_accelerating",

          gains: [
            "achievement",
            "progress",
            "sense of momentum"
          ],

          costs: [
            "less presence",
            "constant pressure",
            "future dependency on achievement"
          ]
        },

        pathB: {
          name: "practice_presence",

          gains: [
            "relationships",
            "recovery",
            "emotional availability"
          ],

          costs: [
            "temporary discomfort",
            "fear of stagnation"
          ]
        },

        theme: "achievement_vs_presence"
      });
    }
  },

  simulateRestVsResponsibility({
    values = {},
    beliefModel = {},
    simulations = []
  } = {}) {

    const dominantValue = values.dominantValue;
    const belief = beliefModel.primaryBelief?.name;

    if (
      dominantValue === "responsibility" ||
      belief === "responsibility_comes_before_rest"
    ) {

      simulations.push({
        name: "rest_vs_responsibility",

        confidence: "medium",

        pathA: {
          name: "carry_more",

          gains: [
            "short-term productivity",
            "more completed tasks"
          ],

          costs: [
            "fatigue",
            "burnout risk",
            "reduced recovery"
          ]
        },

        pathB: {
          name: "protect_capacity",

          gains: [
            "sustainability",
            "energy",
            "better long-term performance"
          ],

          costs: [
            "temporary guilt"
          ]
        },

        theme: "capacity_protection"
      });
    }
  },

  choosePrimarySimulation(simulations = []) {

    if (!simulations.length) {
      return null;
    }

    const confidenceRank = {
      high: 3,
      medium: 2,
      low: 1
    };

    return [...simulations].sort((a, b) => {
      return (
        (confidenceRank[b.confidence] || 0) -
        (confidenceRank[a.confidence] || 0)
      );
    })[0];
  }
};