// =====================================================
// ARI REBIRTH
// File: js/training/exercises/exercise-registry.js
// Version: 2.0.1
// Purpose:
//   Central Exercise Library registry for ARI Training.
//
// V2.0.1:
//   - Removed nonexistent mobility/mobility.js import.
//   - Removed mobility module registration.
//   - Prevents the entire ES-module dependency tree from
//     failing when ARI Training boots.
//
// Architecture:
//   anatomy/body-parts.js
//   anatomy/muscles.js
//   movements/movement-patterns.js
//   movements/exercise-types.js
//            ↓
//   Individual exercise data modules
//            ↓
//   exercise-registry.js
//            ↓
//   Search / recommendations / workout builder / training UI
//
// Design:
//   - Every selectable exercise is registered exactly once.
//   - Individual category files own exercise records.
//   - Workout plans reference stable exercise IDs.
//   - Supports aliases, search, filtering, recommendations,
//     substitutions, and reference validation.
//   - Detects duplicate IDs across modules.
//   - Validates body parts, muscles, movement patterns,
//     exercise types, and substitution references.
// =====================================================

import BodyParts
  from "../anatomy/body-parts.js";

import Muscles
  from "../anatomy/muscles.js";

import MovementPatterns
  from "../movements/movement-patterns.js";

import ExerciseTypes
  from "../movements/exercise-types.js";


// =====================================================
// STRENGTH MODULES
// =====================================================

import CHEST_EXERCISES
  from "./strength/chest.js";

import BACK_EXERCISES
  from "./strength/back.js";

import SHOULDER_EXERCISES
  from "./strength/shoulders.js";

import BICEPS_EXERCISES
  from "./strength/biceps.js";

import TRICEPS_EXERCISES
  from "./strength/triceps.js";

import LEG_EXERCISES
  from "./strength/legs.js";

import GLUTE_EXERCISES
  from "./strength/glutes.js";

import CALF_EXERCISES
  from "./strength/calves.js";

import FOREARM_EXERCISES
  from "./strength/forearms.js";


// =====================================================
// CORE
// =====================================================

import CORE_EXERCISES
  from "./core/core.js";


// =====================================================
// CARDIO
// =====================================================

import CARDIO_EXERCISES
  from "./cardio/cardio.js";


// =====================================================
// FUNCTIONAL
// =====================================================

import FUNCTIONAL_EXERCISES
  from "./functional/functional.js";


// =====================================================
// SPORTS
// =====================================================

import SPORTS_EXERCISES
  from "./sports/sports.js";

import SURFING_EXERCISES
  from "./sports/surfing.js";


const VERSION =
  "2.0.1";

const SOURCE =
  "js/training/exercises/exercise-registry";


// =====================================================
// MODULE DEFINITIONS
// =====================================================

const EXERCISE_MODULES =
  Object.freeze([
    {
      id: "chest",
      label: "Chest",
      path: "./strength/chest.js",
      exercises:
        CHEST_EXERCISES
    },

    {
      id: "back",
      label: "Back",
      path: "./strength/back.js",
      exercises:
        BACK_EXERCISES
    },

    {
      id: "shoulders",
      label: "Shoulders",
      path: "./strength/shoulders.js",
      exercises:
        SHOULDER_EXERCISES
    },

    {
      id: "biceps",
      label: "Biceps",
      path: "./strength/biceps.js",
      exercises:
        BICEPS_EXERCISES
    },

    {
      id: "triceps",
      label: "Triceps",
      path: "./strength/triceps.js",
      exercises:
        TRICEPS_EXERCISES
    },

    {
      id: "legs",
      label: "Legs",
      path: "./strength/legs.js",
      exercises:
        LEG_EXERCISES
    },

    {
      id: "glutes",
      label: "Glutes",
      path: "./strength/glutes.js",
      exercises:
        GLUTE_EXERCISES
    },

    {
      id: "calves",
      label: "Calves",
      path: "./strength/calves.js",
      exercises:
        CALF_EXERCISES
    },

    {
      id: "forearms",
      label: "Forearms",
      path: "./strength/forearms.js",
      exercises:
        FOREARM_EXERCISES
    },

    {
      id: "core",
      label: "Core",
      path: "./core/core.js",
      exercises:
        CORE_EXERCISES
    },

    {
      id: "cardio",
      label: "Cardio",
      path: "./cardio/cardio.js",
      exercises:
        CARDIO_EXERCISES
    },

    {
      id: "functional",
      label: "Functional",
      path: "./functional/functional.js",
      exercises:
        FUNCTIONAL_EXERCISES
    },

    {
      id: "sports",
      label: "Sports",
      path: "./sports/sports.js",
      exercises:
        SPORTS_EXERCISES
    },

    {
      id: "surfing",
      label: "Surfing",
      path: "./sports/surfing.js",
      exercises:
        SURFING_EXERCISES
    }
  ]);

export default {
  VERSION,
  SOURCE,
  EXERCISE_MODULES
};