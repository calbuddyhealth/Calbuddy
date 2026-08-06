// =====================================================
// ARI REBIRTH
// File: js/training/templates/workout-template-registry.js
// Version: 1.0.0
// Purpose:
//   Central registry for ready-made weekly workout plans
//   used by ARI Training.
//
// Design:
//   - Templates reference approved workout-focus IDs.
//   - Exercises are referenced by exercise IDs only.
//   - Users can copy a template into My Week and then edit it.
//   - Templates can target strength, muscle building,
//     running, endurance, cardio, mobility, or general fitness.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/templates/workout-template-registry";

const WORKOUT_TEMPLATES = Object.freeze([
  {
    id: "beginner_full_body_3_day",
    name: "Beginner Full Body - 3 Day",
    shortName: "Beginner Full Body",
    description:
      "A simple three-day full-body plan with recovery days between resistance sessions.",
    level: "beginner",
    primaryGoals: [
      "general_fitness",
      "strength",
      "muscle_building"
    ],
    trainingDaysPerWeek: 3,
    tags: [
      "beginner",
      "full_body",
      "strength",
      "general_fitness"
    ],
    schedule: {
      monday: {
        type: "workout",
        focusId: "full_body",
        title: "Full Body A",
        exercises: [
          {
            exerciseId: "goblet_squat",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "dumbbell_bench_press",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "seated_cable_row",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "romanian_deadlift",
            sets: 3,
            reps: 8
          },
          {
            exerciseId: "front_plank",
            sets: 3,
            durationSeconds: 30
          }
        ]
      },

      tuesday: {
        type: "off",
        focusId: "off_day",
        title: "Off Day",
        exercises: []
      },

      wednesday: {
        type: "workout",
        focusId: "full_body",
        title: "Full Body B",
        exercises: [
          {
            exerciseId: "leg_press",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "dumbbell_overhead_press",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "lat_pulldown",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "walking_lunge",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "side_plank",
            sets: 3,
            durationSeconds: 25
          }
        ]
      },

      thursday: {
        type: "off",
        focusId: "off_day",
        title: "Off Day",
        exercises: []
      },

      friday: {
        type: "workout",
        focusId: "full_body",
        title: "Full Body C",
        exercises: [
          {
            exerciseId: "barbell_back_squat",
            sets: 3,
            reps: 8
          },
          {
            exerciseId: "push_up",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "one_arm_dumbbell_row",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "glute_bridge",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "pallof_press",
            sets: 3,
            reps: 10
          }
        ]
      },

      saturday: {
        type: "recovery",
        focusId: "active_recovery",
        title: "Active Recovery",
        exercises: [
          {
            exerciseId: "walking_general",
            durationMinutes: 30,
            intensity: "light"
          }
        ]
      },

      sunday: {
        type: "off",
        focusId: "off_day",
        title: "Off Day",
        exercises: []
      }
    }
  },

  {
    id: "push_pull_legs_6_day",
    name: "Push / Pull / Legs - 6 Day",
    shortName: "Push Pull Legs",
    description:
      "A six-day split that rotates push, pull, and leg sessions twice per week.",
    level: "intermediate",
    primaryGoals: [
      "muscle_building",
      "strength"
    ],
    trainingDaysPerWeek: 6,
    tags: [
      "push_pull_legs",
      "hypertrophy",
      "strength"
    ],
    schedule: {
      monday: {
        type: "workout",
        focusId: "push_day",
        title: "Push Day",
        exercises: [
          {
            exerciseId: "barbell_bench_press",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "incline_dumbbell_press",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "dumbbell_overhead_press",
            sets: 3,
            reps: 8
          },
          {
            exerciseId: "dumbbell_lateral_raise",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "cable_triceps_pushdown",
            sets: 3,
            reps: 12
          }
        ]
      },

      tuesday: {
        type: "workout",
        focusId: "pull_day",
        title: "Pull Day",
        exercises: [
          {
            exerciseId: "lat_pulldown",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "barbell_bent_over_row",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "seated_cable_row",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "face_pull",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "dumbbell_biceps_curl",
            sets: 3,
            reps: 12
          }
        ]
      },

      wednesday: {
        type: "workout",
        focusId: "leg_day",
        title: "Leg Day",
        exercises: [
          {
            exerciseId: "barbell_back_squat",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "romanian_deadlift",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "leg_press",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "seated_leg_curl",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "standing_calf_raise",
            sets: 4,
            reps: 12
          }
        ]
      },

      thursday: {
        type: "workout",
        focusId: "push_day",
        title: "Push Day",
        exercises: [
          {
            exerciseId: "dumbbell_bench_press",
            sets: 4,
            reps: 10
          },
          {
            exerciseId: "machine_chest_press",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "dumbbell_overhead_press",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "dumbbell_lateral_raise",
            sets: 3,
            reps: 15
          },
          {
            exerciseId: "overhead_triceps_extension",
            sets: 3,
            reps: 12
          }
        ]
      },

      friday: {
        type: "workout",
        focusId: "pull_day",
        title: "Pull Day",
        exercises: [
          {
            exerciseId: "pull_up",
            sets: 4,
            reps: 6
          },
          {
            exerciseId: "one_arm_dumbbell_row",
            sets: 4,
            reps: 10
          },
          {
            exerciseId: "seated_cable_row",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "reverse_fly",
            sets: 3,
            reps: 15
          },
          {
            exerciseId: "hammer_curl",
            sets: 3,
            reps: 12
          }
        ]
      },

      saturday: {
        type: "workout",
        focusId: "leg_day",
        title: "Leg Day",
        exercises: [
          {
            exerciseId: "leg_press",
            sets: 4,
            reps: 10
          },
          {
            exerciseId: "walking_lunge",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "barbell_hip_thrust",
            sets: 4,
            reps: 10
          },
          {
            exerciseId: "leg_extension",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "standing_calf_raise",
            sets: 4,
            reps: 15
          }
        ]
      },

      sunday: {
        type: "off",
        focusId: "off_day",
        title: "Off Day",
        exercises: []
      }
    }
  },

  {
    id: "upper_lower_4_day",
    name: "Upper / Lower - 4 Day",
    shortName: "Upper Lower",
    description:
      "A balanced four-day resistance plan alternating upper- and lower-body sessions.",
    level: "intermediate",
    primaryGoals: [
      "muscle_building",
      "strength"
    ],
    trainingDaysPerWeek: 4,
    tags: [
      "upper_lower",
      "strength",
      "hypertrophy"
    ],
    schedule: {
      monday: {
        type: "workout",
        focusId: "upper_body",
        title: "Upper Body A",
        exercises: [
          {
            exerciseId: "barbell_bench_press",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "lat_pulldown",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "dumbbell_overhead_press",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "seated_cable_row",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "cable_triceps_pushdown",
            sets: 3,
            reps: 12
          }
        ]
      },

      tuesday: {
        type: "workout",
        focusId: "lower_body",
        title: "Lower Body A",
        exercises: [
          {
            exerciseId: "barbell_back_squat",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "romanian_deadlift",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "walking_lunge",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "standing_calf_raise",
            sets: 4,
            reps: 12
          }
        ]
      },

      wednesday: {
        type: "off",
        focusId: "off_day",
        title: "Off Day",
        exercises: []
      },

      thursday: {
        type: "workout",
        focusId: "upper_body",
        title: "Upper Body B",
        exercises: [
          {
            exerciseId: "dumbbell_bench_press",
            sets: 4,
            reps: 10
          },
          {
            exerciseId: "one_arm_dumbbell_row",
            sets: 4,
            reps: 10
          },
          {
            exerciseId: "dumbbell_lateral_raise",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "face_pull",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "dumbbell_biceps_curl",
            sets: 3,
            reps: 12
          }
        ]
      },

      friday: {
        type: "workout",
        focusId: "lower_body",
        title: "Lower Body B",
        exercises: [
          {
            exerciseId: "leg_press",
            sets: 4,
            reps: 10
          },
          {
            exerciseId: "barbell_hip_thrust",
            sets: 4,
            reps: 10
          },
          {
            exerciseId: "seated_leg_curl",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "leg_extension",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "standing_calf_raise",
            sets: 4,
            reps: 15
          }
        ]
      },

      saturday: {
        type: "recovery",
        focusId: "active_recovery",
        title: "Active Recovery",
        exercises: [
          {
            exerciseId: "walking_general",
            durationMinutes: 30,
            intensity: "light"
          }
        ]
      },

      sunday: {
        type: "off",
        focusId: "off_day",
        title: "Off Day",
        exercises: []
      }
    }
  },

  {
    id: "five_day_body_part_split",
    name: "5-Day Body-Part Split",
    shortName: "5-Day Split",
    description:
      "A traditional five-day gym split using familiar body-part workout days.",
    level: "intermediate",
    primaryGoals: [
      "muscle_building"
    ],
    trainingDaysPerWeek: 5,
    tags: [
      "body_part_split",
      "hypertrophy",
      "gym"
    ],
    schedule: {
      monday: {
        type: "workout",
        focusId: "chest_day",
        title: "Chest Day",
        exercises: [
          {
            exerciseId: "barbell_bench_press",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "incline_dumbbell_press",
            sets: 4,
            reps: 10
          },
          {
            exerciseId: "machine_chest_press",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "cable_chest_fly",
            sets: 3,
            reps: 12
          }
        ]
      },

      tuesday: {
        type: "workout",
        focusId: "back_day",
        title: "Back Day",
        exercises: [
          {
            exerciseId: "lat_pulldown",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "barbell_bent_over_row",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "seated_cable_row",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "face_pull",
            sets: 3,
            reps: 12
          }
        ]
      },

      wednesday: {
        type: "workout",
        focusId: "leg_day",
        title: "Leg Day",
        exercises: [
          {
            exerciseId: "barbell_back_squat",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "romanian_deadlift",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "leg_press",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "seated_leg_curl",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "standing_calf_raise",
            sets: 4,
            reps: 15
          }
        ]
      },

      thursday: {
        type: "workout",
        focusId: "shoulder_day",
        title: "Shoulder Day",
        exercises: [
          {
            exerciseId: "dumbbell_overhead_press",
            sets: 4,
            reps: 8
          },
          {
            exerciseId: "dumbbell_lateral_raise",
            sets: 4,
            reps: 12
          },
          {
            exerciseId: "reverse_fly",
            sets: 4,
            reps: 12
          },
          {
            exerciseId: "face_pull",
            sets: 3,
            reps: 15
          }
        ]
      },

      friday: {
        type: "workout",
        focusId: "arm_day",
        title: "Arm Day",
        exercises: [
          {
            exerciseId: "dumbbell_biceps_curl",
            sets: 4,
            reps: 10
          },
          {
            exerciseId: "hammer_curl",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "cable_triceps_pushdown",
            sets: 4,
            reps: 10
          },
          {
            exerciseId: "overhead_triceps_extension",
            sets: 3,
            reps: 12
          }
        ]
      },

      saturday: {
        type: "recovery",
        focusId: "active_recovery",
        title: "Active Recovery",
        exercises: [
          {
            exerciseId: "walking_general",
            durationMinutes: 30,
            intensity: "light"
          }
        ]
      },

      sunday: {
        type: "off",
        focusId: "off_day",
        title: "Off Day",
        exercises: []
      }
    }
  },

  {
    id: "beginner_running_4_day",
    name: "Beginner Running - 4 Day",
    shortName: "Beginner Running",
    description:
      "A beginner-friendly running week combining easy running, intervals, a longer run, and recovery.",
    level: "beginner",
    primaryGoals: [
      "running",
      "cardio",
      "endurance"
    ],
    trainingDaysPerWeek: 4,
    tags: [
      "running",
      "beginner",
      "cardio",
      "endurance"
    ],
    schedule: {
      monday: {
        type: "workout",
        focusId: "running",
        title: "Easy Run",
        exercises: [
          {
            exerciseId: "easy_run",
            durationMinutes: 25,
            intensity: "light"
          }
        ]
      },

      tuesday: {
        type: "recovery",
        focusId: "active_recovery",
        title: "Recovery Walk",
        exercises: [
          {
            exerciseId: "walking_general",
            durationMinutes: 30,
            intensity: "light"
          }
        ]
      },

      wednesday: {
        type: "workout",
        focusId: "running",
        title: "Intervals",
        exercises: [
          {
            exerciseId: "running_intervals",
            rounds: 6,
            workSeconds: 60,
            restSeconds: 90,
            intensity: "vigorous"
          }
        ]
      },

      thursday: {
        type: "off",
        focusId: "off_day",
        title: "Off Day",
        exercises: []
      },

      friday: {
        type: "workout",
        focusId: "legs_core",
        title: "Runner Strength",
        exercises: [
          {
            exerciseId: "step_up",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "romanian_deadlift",
            sets: 3,
            reps: 8
          },
          {
            exerciseId: "standing_calf_raise",
            sets: 3,
            reps: 15
          },
          {
            exerciseId: "side_plank",
            sets: 3,
            durationSeconds: 25
          }
        ]
      },

      saturday: {
        type: "workout",
        focusId: "running",
        title: "Long Easy Run",
        exercises: [
          {
            exerciseId: "easy_run",
            durationMinutes: 40,
            intensity: "moderate"
          }
        ]
      },

      sunday: {
        type: "off",
        focusId: "off_day",
        title: "Off Day",
        exercises: []
      }
    }
  },

  {
    id: "cardio_endurance_5_day",
    name: "Cardio + Endurance - 5 Day",
    shortName: "Cardio Endurance",
    description:
      "A mixed cardio plan using walking, running, cycling, rowing, and recovery.",
    level: "beginner",
    primaryGoals: [
      "cardio",
      "endurance",
      "general_fitness"
    ],
    trainingDaysPerWeek: 5,
    tags: [
      "cardio",
      "endurance",
      "mixed_modal"
    ],
    schedule: {
      monday: {
        type: "workout",
        focusId: "cardio",
        title: "Moderate Bike",
        exercises: [
          {
            exerciseId: "stationary_bike",
            durationMinutes: 35,
            intensity: "moderate"
          }
        ]
      },

      tuesday: {
        type: "workout",
        focusId: "cardio",
        title: "Brisk Walk",
        exercises: [
          {
            exerciseId: "walking_general",
            durationMinutes: 40,
            intensity: "moderate"
          }
        ]
      },

      wednesday: {
        type: "workout",
        focusId: "endurance",
        title: "Rowing",
        exercises: [
          {
            exerciseId: "rowing_machine",
            durationMinutes: 30,
            intensity: "moderate"
          }
        ]
      },

      thursday: {
        type: "recovery",
        focusId: "active_recovery",
        title: "Mobility + Recovery",
        exercises: [
          {
            exerciseId: "hip_flexor_stretch",
            sets: 2,
            durationSeconds: 30
          },
          {
            exerciseId: "ankle_dorsiflexion_mobility",
            sets: 2,
            reps: 10
          }
        ]
      },

      friday: {
        type: "workout",
        focusId: "running",
        title: "Easy Run",
        exercises: [
          {
            exerciseId: "easy_run",
            durationMinutes: 30,
            intensity: "moderate"
          }
        ]
      },

      saturday: {
        type: "workout",
        focusId: "cardio",
        title: "Elliptical",
        exercises: [
          {
            exerciseId: "elliptical_trainer",
            durationMinutes: 30,
            intensity: "moderate"
          }
        ]
      },

      sunday: {
        type: "off",
        focusId: "off_day",
        title: "Off Day",
        exercises: []
      }
    }
  },

  {
    id: "general_fitness_5_day",
    name: "General Fitness - 5 Day",
    shortName: "General Fitness",
    description:
      "A balanced week combining resistance training, cardio, core, mobility, and recovery.",
    level: "beginner",
    primaryGoals: [
      "general_fitness",
      "cardio",
      "strength"
    ],
    trainingDaysPerWeek: 5,
    tags: [
      "general_fitness",
      "balanced",
      "strength",
      "cardio"
    ],
    schedule: {
      monday: {
        type: "workout",
        focusId: "full_body",
        title: "Full Body Strength",
        exercises: [
          {
            exerciseId: "goblet_squat",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "dumbbell_bench_press",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "seated_cable_row",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "front_plank",
            sets: 3,
            durationSeconds: 30
          }
        ]
      },

      tuesday: {
        type: "workout",
        focusId: "cardio",
        title: "Cardio",
        exercises: [
          {
            exerciseId: "stationary_bike",
            durationMinutes: 30,
            intensity: "moderate"
          }
        ]
      },

      wednesday: {
        type: "workout",
        focusId: "upper_body",
        title: "Upper Body",
        exercises: [
          {
            exerciseId: "dumbbell_overhead_press",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "lat_pulldown",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "push_up",
            sets: 3,
            reps: 12
          },
          {
            exerciseId: "dumbbell_biceps_curl",
            sets: 3,
            reps: 12
          }
        ]
      },

      thursday: {
        type: "recovery",
        focusId: "active_recovery",
        title: "Mobility",
        exercises: [
          {
            exerciseId: "hip_flexor_stretch",
            sets: 2,
            durationSeconds: 30
          },
          {
            exerciseId: "ankle_dorsiflexion_mobility",
            sets: 2,
            reps: 10
          }
        ]
      },

      friday: {
        type: "workout",
        focusId: "lower_body",
        title: "Lower Body",
        exercises: [
          {
            exerciseId: "leg_press",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "romanian_deadlift",
            sets: 3,
            reps: 8
          },
          {
            exerciseId: "walking_lunge",
            sets: 3,
            reps: 10
          },
          {
            exerciseId: "standing_calf_raise",
            sets: 3,
            reps: 15
          }
        ]
      },

      saturday: {
        type: "workout",
        focusId: "cardio",
        title: "Easy Cardio",
        exercises: [
          {
            exerciseId: "walking_general",
            durationMinutes: 40,
            intensity: "moderate"
          }
        ]
      },

      sunday: {
        type: "off",
        focusId: "off_day",
        title: "Off Day",
        exercises: []
      }
    }
  }
]);

const TEMPLATE_MAP = new Map(
  WORKOUT_TEMPLATES.map(
    template => [
      template.id,
      template
    ]
  )
);

const TEMPLATE_ALIAS_MAP =
  new Map();

function normalizeText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase();
}

for (
  const template
  of WORKOUT_TEMPLATES
) {
  const aliases = [
    template.id,
    template.name,
    template.shortName,
    ...(template.tags || [])
  ];

  for (const alias of aliases) {
    TEMPLATE_ALIAS_MAP.set(
      normalizeText(alias),
      template.id
    );
  }
}

function getWorkoutTemplate(
  idOrName
) {
  const normalized =
    normalizeText(idOrName);

  if (!normalized) {
    return null;
  }

  const resolvedId =
    TEMPLATE_ALIAS_MAP.get(
      normalized
    ) || normalized;

  return TEMPLATE_MAP.get(
    resolvedId
  ) || null;
}

function hasWorkoutTemplate(
  idOrName
) {
  return Boolean(
    getWorkoutTemplate(
      idOrName
    )
  );
}

function getWorkoutTemplates({
  level = null,
  goal = null,
  trainingDaysPerWeek = null,
  tag = null
} = {}) {
  const normalizedLevel =
    normalizeText(level);

  const normalizedGoal =
    normalizeText(goal);

  const normalizedTag =
    normalizeText(tag);

  const normalizedDays =
    Number(
      trainingDaysPerWeek
    );

  return WORKOUT_TEMPLATES.filter(
    template => {
      if (
        normalizedLevel &&
        normalizeText(
          template.level
        ) !== normalizedLevel
      ) {
        return false;
      }

      if (
        normalizedGoal &&
        !(
          template.primaryGoals ||
          []
        ).some(
          item =>
            normalizeText(item) ===
            normalizedGoal
        )
      ) {
        return false;
      }

      if (
        Number.isFinite(
          normalizedDays
        ) &&
        normalizedDays > 0 &&
        template.trainingDaysPerWeek !==
          normalizedDays
      ) {
        return false;
      }

      if (
        normalizedTag &&
        !(
          template.tags ||
          []
        ).some(
          item =>
            normalizeText(item) ===
            normalizedTag
        )
      ) {
        return false;
      }

      return true;
    }
  );
}

function searchWorkoutTemplates(
  query
) {
  const normalized =
    normalizeText(query);

  if (!normalized) {
    return [
      ...WORKOUT_TEMPLATES
    ];
  }

  return WORKOUT_TEMPLATES.filter(
    template => {
      const searchable = [
        template.id,
        template.name,
        template.shortName,
        template.description,
        template.level,
        ...(template.primaryGoals || []),
        ...(template.tags || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(
        normalized
      );
    }
  );
}

function cloneWorkoutTemplate(
  idOrName
) {
  const template =
    getWorkoutTemplate(
      idOrName
    );

  if (!template) {
    return null;
  }

  return JSON.parse(
    JSON.stringify(
      template
    )
  );
}

function getWorkoutTemplateIds() {
  return WORKOUT_TEMPLATES.map(
    template => template.id
  );
}

const AriTrainingWorkoutTemplates =
  Object.freeze({
    version:
      VERSION,

    source:
      SOURCE,

    all:
      WORKOUT_TEMPLATES,

    get:
      getWorkoutTemplate,

    has:
      hasWorkoutTemplate,

    list:
      getWorkoutTemplates,

    search:
      searchWorkoutTemplates,

    clone:
      cloneWorkoutTemplate,

    ids:
      getWorkoutTemplateIds
  });

if (
  typeof globalThis !==
  "undefined"
) {
  const Ari =
    globalThis.Ari ||
    {};

  Ari.training =
    Ari.training ||
    {};

  Ari.training.workoutTemplates =
    AriTrainingWorkoutTemplates;

  globalThis.Ari =
    Ari;
}

export {
  VERSION,
  SOURCE,
  WORKOUT_TEMPLATES,
  getWorkoutTemplate,
  hasWorkoutTemplate,
  getWorkoutTemplates,
  searchWorkoutTemplates,
  cloneWorkoutTemplate,
  getWorkoutTemplateIds,
  AriTrainingWorkoutTemplates
};

export default AriTrainingWorkoutTemplates;
