// =====================================================
// ARI REBIRTH
// File: js/training/exercises/exercise-validator.js
// Version: 1.0.0
// Purpose:
//   Deep validation layer for the ARI Training exercise
//   library.
//
// Architecture:
//   individual exercise modules
//            ↓
//   exercise-registry.js
//            ↓
//   exercise-validator.js
//
// What this validates:
//   - Duplicate exercise IDs
//   - Missing required fields
//   - Invalid body-part references
//   - Invalid muscle references
//   - Invalid movement-pattern references
//   - Invalid exercise-type references
//   - Broken substitution references
//   - Self-referencing substitutions
//   - Duplicate substitutions
//   - Missing / malformed logging definitions
//   - Invalid goal scores
//   - Invalid difficulty values
//   - Invalid energyProfile metadata
//   - Suspicious aliases
//   - Duplicate aliases shared by different exercises
//   - Invalid module metadata
//   - Empty / malformed arrays
//
// Notes:
//   - "errors" should be fixed before production.
//   - "warnings" are recommended cleanup items.
//   - This file does not mutate exercise data.
// =====================================================

import ExerciseRegistry
  from "./exercise-registry.js";

import BodyParts
  from "../anatomy/body-parts.js";

import Muscles
  from "../anatomy/muscles.js";

import MovementPatterns
  from "../movements/movement-patterns.js";

import ExerciseTypes
  from "../movements/exercise-types.js";


const VERSION =
  "1.0.0";

const SOURCE =
  "js/training/exercises/exercise-validator";


// =====================================================
// VALIDATION CONSTANTS
// =====================================================

const VALID_DIFFICULTIES =
  new Set([
    "beginner",
    "intermediate",
    "advanced"
  ]);


const VALID_ENERGY_METHODS =
  new Set([
    "met"
  ]);


const VALID_ENERGY_INTENSITIES =
  new Set([
    "light",
    "moderate",
    "vigorous"
  ]);


const KNOWN_LOGGING_TYPES =
  new Set([
    "sets_reps",
    "sets_reps_weight",
    "sets_duration",
    "sets_weight_distance",
    "duration",
    "duration_distance",
    "duration_distance_pace",
    "intervals"
  ]);


const RECOMMENDED_FIELDS =
  Object.freeze([
    "id",
    "name",
    "category",
    "exerciseTypes",
    "bodyParts",
    "primaryMuscles",
    "secondaryMuscles",
    "movementPatterns",
    "equipment",
    "difficulty",
    "goals",
    "summary",
    "instructions",
    "cues",
    "logging"
  ]);


// =====================================================
// HELPERS
// =====================================================

function normalizeText(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(
    value
  )
    .trim()
    .toLowerCase();
}


function slugify(
  value
) {
  return normalizeText(
    value
  )
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /['’]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );
}


function isPlainObject(
  value
) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}


function asArray(
  value
) {
  return Array.isArray(
    value
  )
    ? value
    : [];
}


function uniqueNormalized(
  values
) {
  return new Set(
    asArray(
      values
    )
      .map(
        normalizeText
      )
      .filter(Boolean)
  );
}


function makeIssue({
  severity,
  code,
  exerciseId = null,
  moduleId = null,
  field = null,
  value = null,
  message
}) {
  return {
    severity,
    code,
    exerciseId,
    moduleId,
    field,
    value,
    message
  };
}


function addError(
  errors,
  data
) {
  errors.push(
    makeIssue({
      severity:
        "error",

      ...data
    })
  );
}


function addWarning(
  warnings,
  data
) {
  warnings.push(
    makeIssue({
      severity:
        "warning",

      ...data
    })
  );
}


// =====================================================
// MODULE VALIDATION
// =====================================================

function validateModules(
  errors,
  warnings
) {
  const modules =
    ExerciseRegistry
      .getModules?.() ||
    [];

  const seenIds =
    new Set();

  const seenPaths =
    new Set();


  for (
    const moduleRecord
    of modules
  ) {
    const id =
      normalizeText(
        moduleRecord?.id
      );

    const path =
      normalizeText(
        moduleRecord?.path
      );


    if (!id) {
      addError(
        errors,
        {
          code:
            "module_missing_id",

          message:
            "Exercise module is missing an id."
        }
      );

      continue;
    }


    if (
      seenIds.has(
        id
      )
    ) {
      addError(
        errors,
        {
          code:
            "duplicate_module_id",

          moduleId:
            id,

          value:
            id,

          message:
            `Duplicate exercise module id "${id}".`
        }
      );
    } else {
      seenIds.add(
        id
      );
    }


    if (!path) {
      addWarning(
        warnings,
        {
          code:
            "module_missing_path",

          moduleId:
            id,

          message:
            `Module "${id}" does not expose a source path.`
        }
      );
    } else if (
      seenPaths.has(
        path
      )
    ) {
      addWarning(
        warnings,
        {
          code:
            "duplicate_module_path",

          moduleId:
            id,

          value:
            path,

          message:
            `Multiple exercise modules report path "${path}".`
        }
      );
    } else {
      seenPaths.add(
        path
      );
    }


    if (
      !Number.isFinite(
        Number(
          moduleRecord?.count
        )
      )
    ) {
      addWarning(
        warnings,
        {
          code:
            "module_invalid_count",

          moduleId:
            id,

          value:
            moduleRecord?.count,

          message:
            `Module "${id}" does not report a valid exercise count.`
        }
      );
    }
  }
}


// =====================================================
// EXERCISE CORE VALIDATION
// =====================================================

function validateExerciseCore(
  exercise,
  errors,
  warnings
) {
  const exerciseId =
    normalizeText(
      exercise?.id
    ) ||
    null;

  const moduleId =
    normalizeText(
      exercise?.moduleId
    ) ||
    null;


  if (!exerciseId) {
    addError(
      errors,
      {
        code:
          "exercise_missing_id",

        moduleId,

        field:
          "id",

        message:
          "Exercise is missing a stable id."
      }
    );

    return;
  }


  if (
    !/^[a-z0-9_]+$/
      .test(
        exerciseId
      )
  ) {
    addError(
      errors,
      {
        code:
          "exercise_invalid_id_format",

        exerciseId,
        moduleId,

        field:
          "id",

        value:
          exercise.id,

        message:
          `Exercise id "${exercise.id}" should use lowercase snake_case only.`
      }
    );
  }


  if (
    !normalizeText(
      exercise.name
    )
  ) {
    addError(
      errors,
      {
        code:
          "exercise_missing_name",

        exerciseId,
        moduleId,

        field:
          "name",

        message:
          `Exercise "${exerciseId}" is missing a display name.`
      }
    );
  }


  for (
    const field
    of RECOMMENDED_FIELDS
  ) {
    if (
      exercise[
        field
      ] === undefined ||
      exercise[
        field
      ] === null
    ) {
      addWarning(
        warnings,
        {
          code:
            "recommended_field_missing",

          exerciseId,
          moduleId,

          field,

          message:
            `Exercise "${exerciseId}" is missing recommended field "${field}".`
        }
      );
    }
  }


  const expectedSlug =
    slugify(
      exercise.name
    );

  if (
    expectedSlug &&
    expectedSlug !==
      exerciseId
  ) {
    /*
     * This is intentionally only a warning.
     * Stable IDs do not need to match the display name exactly.
     */
    addWarning(
      warnings,
      {
        code:
          "exercise_id_name_mismatch",

        exerciseId,
        moduleId,

        field:
          "id",

        value:
          expectedSlug,

        message:
          `Exercise "${exerciseId}" has display-name slug "${expectedSlug}". This is valid if the existing id is intentionally stable.`
      }
    );
  }


  if (
    !normalizeText(
      exercise.category
    )
  ) {
    addWarning(
      warnings,
      {
        code:
          "exercise_missing_category",

        exerciseId,
        moduleId,

        field:
          "category",

        message:
          `Exercise "${exerciseId}" has no category.`
      }
    );
  }


  const difficulty =
    normalizeText(
      exercise.difficulty
    );

  if (
    difficulty &&
    !VALID_DIFFICULTIES.has(
      difficulty
    )
  ) {
    addWarning(
      warnings,
      {
        code:
          "exercise_unknown_difficulty",

        exerciseId,
        moduleId,

        field:
          "difficulty",

        value:
          exercise.difficulty,

        message:
          `Exercise "${exerciseId}" uses unknown difficulty "${exercise.difficulty}".`
      }
    );
  }


  if (
    exercise.summary !==
      undefined &&
    !normalizeText(
      exercise.summary
    )
  ) {
    addWarning(
      warnings,
      {
        code:
          "exercise_empty_summary",

        exerciseId,
        moduleId,

        field:
          "summary",

        message:
          `Exercise "${exerciseId}" has an empty summary.`
      }
    );
  }


  if (
    !Array.isArray(
      exercise.instructions
    ) ||
    exercise.instructions
      .length === 0
  ) {
    addWarning(
      warnings,
      {
        code:
          "exercise_missing_instructions",

        exerciseId,
        moduleId,

        field:
          "instructions",

        message:
          `Exercise "${exerciseId}" should include at least one instruction.`
      }
    );
  }


  if (
    !Array.isArray(
      exercise.cues
    ) ||
    exercise.cues
      .length === 0
  ) {
    addWarning(
      warnings,
      {
        code:
          "exercise_missing_cues",

        exerciseId,
        moduleId,

        field:
          "cues",

        message:
          `Exercise "${exerciseId}" should include at least one coaching cue.`
      }
    );
  }
}


// =====================================================
// ARRAY / DUPLICATE VALIDATION
// =====================================================

function validateArrayField({
  exercise,
  field,
  errors,
  warnings,
  allowEmpty = true
}) {
  const exerciseId =
    normalizeText(
      exercise.id
    );

  const moduleId =
    normalizeText(
      exercise.moduleId
    ) ||
    null;

  const value =
    exercise[
      field
    ];


  if (
    value === undefined ||
    value === null
  ) {
    return;
  }


  if (
    !Array.isArray(
      value
    )
  ) {
    addError(
      errors,
      {
        code:
          "field_not_array",

        exerciseId,
        moduleId,

        field,

        value,

        message:
          `Exercise "${exerciseId}" field "${field}" must be an array.`
      }
    );

    return;
  }


  if (
    !allowEmpty &&
    value.length === 0
  ) {
    addWarning(
      warnings,
      {
        code:
          "field_empty_array",

        exerciseId,
        moduleId,

        field,

        message:
          `Exercise "${exerciseId}" field "${field}" is empty.`
      }
    );
  }


  const seen =
    new Set();


  for (
    const item
    of value
  ) {
    const normalized =
      normalizeText(
        item
      );

    if (!normalized) {
      addWarning(
        warnings,
        {
          code:
            "array_contains_empty_value",

          exerciseId,
          moduleId,

          field,

          value:
            item,

          message:
            `Exercise "${exerciseId}" field "${field}" contains an empty value.`
        }
      );

      continue;
    }


    if (
      seen.has(
        normalized
      )
    ) {
      addWarning(
        warnings,
        {
          code:
            "duplicate_array_value",

          exerciseId,
          moduleId,

          field,

          value:
            item,

          message:
            `Exercise "${exerciseId}" field "${field}" contains duplicate value "${item}".`
        }
      );
    } else {
      seen.add(
        normalized
      );
    }
  }
}


// =====================================================
// REFERENCE VALIDATION
// =====================================================

function validateReferences(
  exercise,
  errors
) {
  const exerciseId =
    normalizeText(
      exercise.id
    );

  const moduleId =
    normalizeText(
      exercise.moduleId
    ) ||
    null;


  for (
    const bodyPartId
    of asArray(
      exercise.bodyParts
    )
  ) {
    if (
      !BodyParts.has(
        bodyPartId
      )
    ) {
      addError(
        errors,
        {
          code:
            "invalid_body_part_reference",

          exerciseId,
          moduleId,

          field:
            "bodyParts",

          value:
            bodyPartId,

          message:
            `Exercise "${exerciseId}" references unknown body part "${bodyPartId}".`
        }
      );
    }
  }


  for (
    const muscleId
    of [
      ...asArray(
        exercise.primaryMuscles
      ),

      ...asArray(
        exercise.secondaryMuscles
      )
    ]
  ) {
    if (
      !Muscles.has(
        muscleId
      )
    ) {
      addError(
        errors,
        {
          code:
            "invalid_muscle_reference",

          exerciseId,
          moduleId,

          field:
            "muscles",

          value:
            muscleId,

          message:
            `Exercise "${exerciseId}" references unknown muscle "${muscleId}".`
        }
      );
    }
  }


  for (
    const movementId
    of asArray(
      exercise.movementPatterns
    )
  ) {
    if (
      !MovementPatterns.has(
        movementId
      )
    ) {
      addError(
        errors,
        {
          code:
            "invalid_movement_reference",

          exerciseId,
          moduleId,

          field:
            "movementPatterns",

          value:
            movementId,

          message:
            `Exercise "${exerciseId}" references unknown movement pattern "${movementId}".`
        }
      );
    }
  }


  for (
    const typeId
    of asArray(
      exercise.exerciseTypes
    )
  ) {
    if (
      !ExerciseTypes.has(
        typeId
      )
    ) {
      addError(
        errors,
        {
          code:
            "invalid_exercise_type_reference",

          exerciseId,
          moduleId,

          field:
            "exerciseTypes",

          value:
            typeId,

          message:
            `Exercise "${exerciseId}" references unknown exercise type "${typeId}".`
        }
      );
    }
  }
}


// =====================================================
// SUBSTITUTION VALIDATION
// =====================================================

function validateSubstitutions(
  exercise,
  errors,
  warnings
) {
  const exerciseId =
    normalizeText(
      exercise.id
    );

  const moduleId =
    normalizeText(
      exercise.moduleId
    ) ||
    null;

  const substitutions =
    asArray(
      exercise.substitutions
    );

  const seen =
    new Set();


  for (
    const substitutionIdRaw
    of substitutions
  ) {
    const substitutionId =
      normalizeText(
        substitutionIdRaw
      );


    if (!substitutionId) {
      addWarning(
        warnings,
        {
          code:
            "empty_substitution",

          exerciseId,
          moduleId,

          field:
            "substitutions",

          message:
            `Exercise "${exerciseId}" contains an empty substitution reference.`
        }
      );

      continue;
    }


    if (
      substitutionId ===
        exerciseId
    ) {
      addError(
        errors,
        {
          code:
            "self_substitution",

          exerciseId,
          moduleId,

          field:
            "substitutions",

          value:
            substitutionIdRaw,

          message:
            `Exercise "${exerciseId}" cannot substitute itself.`
        }
      );
    }


    if (
      seen.has(
        substitutionId
      )
    ) {
      addWarning(
        warnings,
        {
          code:
            "duplicate_substitution",

          exerciseId,
          moduleId,

          field:
            "substitutions",

          value:
            substitutionIdRaw,

          message:
            `Exercise "${exerciseId}" repeats substitution "${substitutionIdRaw}".`
        }
      );
    } else {
      seen.add(
        substitutionId
      );
    }


    if (
      !ExerciseRegistry.has(
        substitutionId
      )
    ) {
      addError(
        errors,
        {
          code:
            "broken_substitution",

          exerciseId,
          moduleId,

          field:
            "substitutions",

          value:
            substitutionIdRaw,

          message:
            `Exercise "${exerciseId}" references missing substitution "${substitutionIdRaw}".`
        }
      );
    }
  }
}


// =====================================================
// GOAL VALIDATION
// =====================================================

function validateGoals(
  exercise,
  errors,
  warnings
) {
  const exerciseId =
    normalizeText(
      exercise.id
    );

  const moduleId =
    normalizeText(
      exercise.moduleId
    ) ||
    null;

  const goals =
    exercise.goals;


  if (
    goals === undefined ||
    goals === null
  ) {
    addWarning(
      warnings,
      {
        code:
          "missing_goals",

        exerciseId,
        moduleId,

        field:
          "goals",

        message:
          `Exercise "${exerciseId}" has no goal scores.`
      }
    );

    return;
  }


  if (
    !isPlainObject(
      goals
    )
  ) {
    addError(
      errors,
      {
        code:
          "invalid_goals_object",

        exerciseId,
        moduleId,

        field:
          "goals",

        value:
          goals,

        message:
          `Exercise "${exerciseId}" goals must be an object.`
      }
    );

    return;
  }


  for (
    const [
      goalId,
      scoreRaw
    ]
    of Object.entries(
      goals
    )
  ) {
    const score =
      Number(
        scoreRaw
      );


    if (
      !normalizeText(
        goalId
      )
    ) {
      addWarning(
        warnings,
        {
          code:
            "empty_goal_id",

          exerciseId,
          moduleId,

          field:
            "goals",

          value:
            goalId,

          message:
            `Exercise "${exerciseId}" contains an empty goal id.`
        }
      );

      continue;
    }


    if (
      !Number.isFinite(
        score
      )
    ) {
      addError(
        errors,
        {
          code:
            "invalid_goal_score",

          exerciseId,
          moduleId,

          field:
            "goals",

          value:
            scoreRaw,

          message:
            `Exercise "${exerciseId}" goal "${goalId}" does not have a numeric score.`
        }
      );

      continue;
    }


    if (
      score < 0 ||
      score > 10
    ) {
      addWarning(
        warnings,
        {
          code:
            "goal_score_out_of_range",

          exerciseId,
          moduleId,

          field:
            "goals",

          value:
            score,

          message:
            `Exercise "${exerciseId}" goal "${goalId}" score ${score} is outside the recommended 0-10 range.`
        }
      );
    }
  }
}


// =====================================================
// LOGGING VALIDATION
// =====================================================

function validateLogging(
  exercise,
  errors,
  warnings
) {
  const exerciseId =
    normalizeText(
      exercise.id
    );

  const moduleId =
    normalizeText(
      exercise.moduleId
    ) ||
    null;

  const logging =
    exercise.logging;


  if (
    !isPlainObject(
      logging
    )
  ) {
    addError(
      errors,
      {
        code:
          "missing_or_invalid_logging",

        exerciseId,
        moduleId,

        field:
          "logging",

        value:
          logging,

        message:
          `Exercise "${exerciseId}" must define a logging object.`
      }
    );

    return;
  }


  const type =
    normalizeText(
      logging.type
    );


  if (!type) {
    addError(
      errors,
      {
        code:
          "missing_logging_type",

        exerciseId,
        moduleId,

        field:
          "logging.type",

        message:
          `Exercise "${exerciseId}" is missing logging.type.`
      }
    );
  } else if (
    !KNOWN_LOGGING_TYPES.has(
      type
    )
  ) {
    addWarning(
      warnings,
      {
        code:
          "unknown_logging_type",

        exerciseId,
        moduleId,

        field:
          "logging.type",

        value:
          logging.type,

        message:
          `Exercise "${exerciseId}" uses unknown logging type "${logging.type}".`
      }
    );
  }


  if (
    !Array.isArray(
      logging.fields
    ) ||
    logging.fields
      .length === 0
  ) {
    addError(
      errors,
      {
        code:
          "missing_logging_fields",

        exerciseId,
        moduleId,

        field:
          "logging.fields",

        value:
          logging.fields,

        message:
          `Exercise "${exerciseId}" must define at least one logging field.`
      }
    );

    return;
  }


  const seen =
    new Set();


  for (
    const fieldRaw
    of logging.fields
  ) {
    const field =
      normalizeText(
        fieldRaw
      );


    if (!field) {
      addWarning(
        warnings,
        {
          code:
            "empty_logging_field",

          exerciseId,
          moduleId,

          field:
            "logging.fields",

          message:
            `Exercise "${exerciseId}" contains an empty logging field.`
        }
      );

      continue;
    }


    if (
      seen.has(
        field
      )
    ) {
      addWarning(
        warnings,
        {
          code:
            "duplicate_logging_field",

          exerciseId,
          moduleId,

          field:
            "logging.fields",

          value:
            fieldRaw,

          message:
            `Exercise "${exerciseId}" repeats logging field "${fieldRaw}".`
        }
      );
    } else {
      seen.add(
        field
      );
    }
  }
}


// =====================================================
// ENERGY PROFILE VALIDATION
// =====================================================

function validateEnergyProfile(
  exercise,
  errors,
  warnings
) {
  const exerciseId =
    normalizeText(
      exercise.id
    );

  const moduleId =
    normalizeText(
      exercise.moduleId
    ) ||
    null;

  const profile =
    exercise.energyProfile;


  if (
    profile === undefined ||
    profile === null
  ) {
    return;
  }


  if (
    !isPlainObject(
      profile
    )
  ) {
    addError(
      errors,
      {
        code:
          "invalid_energy_profile",

        exerciseId,
        moduleId,

        field:
          "energyProfile",

        value:
          profile,

        message:
          `Exercise "${exerciseId}" energyProfile must be an object.`
      }
    );

    return;
  }


  const method =
    normalizeText(
      profile.method
    );


  if (
    method &&
    !VALID_ENERGY_METHODS.has(
      method
    )
  ) {
    addWarning(
      warnings,
      {
        code:
          "unknown_energy_method",

        exerciseId,
        moduleId,

        field:
          "energyProfile.method",

        value:
          profile.method,

        message:
          `Exercise "${exerciseId}" uses unknown energy method "${profile.method}".`
      }
    );
  }


  if (
    profile.intensityOptions !==
      undefined
  ) {
    if (
      !Array.isArray(
        profile.intensityOptions
      )
    ) {
      addError(
        errors,
        {
          code:
            "invalid_energy_intensity_options",

          exerciseId,
          moduleId,

          field:
            "energyProfile.intensityOptions",

          value:
            profile.intensityOptions,

          message:
            `Exercise "${exerciseId}" energyProfile.intensityOptions must be an array.`
        }
      );
    } else {
      for (
        const intensityRaw
        of profile
          .intensityOptions
      ) {
        const intensity =
          normalizeText(
            intensityRaw
          );

        if (
          !VALID_ENERGY_INTENSITIES
            .has(
              intensity
            )
        ) {
          addWarning(
            warnings,
            {
              code:
                "unknown_energy_intensity",

              exerciseId,
              moduleId,

              field:
                "energyProfile.intensityOptions",

              value:
                intensityRaw,

              message:
                `Exercise "${exerciseId}" uses unknown energy intensity "${intensityRaw}".`
            }
          );
        }
      }
    }
  }
}


// =====================================================
// ALIAS VALIDATION
// =====================================================

function validateAliases(
  exercise,
  errors,
  warnings
) {
  const exerciseId =
    normalizeText(
      exercise.id
    );

  const moduleId =
    normalizeText(
      exercise.moduleId
    ) ||
    null;


  if (
    exercise.aliases ===
      undefined ||
    exercise.aliases ===
      null
  ) {
    return;
  }


  if (
    !Array.isArray(
      exercise.aliases
    )
  ) {
    addError(
      errors,
      {
        code:
          "aliases_not_array",

        exerciseId,
        moduleId,

        field:
          "aliases",

        value:
          exercise.aliases,

        message:
          `Exercise "${exerciseId}" aliases must be an array.`
      }
    );

    return;
  }


  const seen =
    new Set();


  for (
    const aliasRaw
    of exercise.aliases
  ) {
    const alias =
      normalizeText(
        aliasRaw
      );


    if (!alias) {
      addWarning(
        warnings,
        {
          code:
            "empty_alias",

          exerciseId,
          moduleId,

          field:
            "aliases",

          message:
            `Exercise "${exerciseId}" contains an empty alias.`
        }
      );

      continue;
    }


    if (
      alias ===
        exerciseId
    ) {
      addWarning(
        warnings,
        {
          code:
            "alias_duplicates_id",

          exerciseId,
          moduleId,

          field:
            "aliases",

          value:
            aliasRaw,

          message:
            `Exercise "${exerciseId}" repeats its id as an alias.`
        }
      );
    }


    if (
      seen.has(
        alias
      )
    ) {
      addWarning(
        warnings,
        {
          code:
            "duplicate_alias",

          exerciseId,
          moduleId,

          field:
            "aliases",

          value:
            aliasRaw,

          message:
            `Exercise "${exerciseId}" repeats alias "${aliasRaw}".`
        }
      );
    } else {
      seen.add(
        alias
      );
    }
  }
}


function validateGlobalAliasCollisions(
  exercises,
  warnings
) {
  const aliasOwners =
    new Map();


  for (
    const exercise
    of exercises
  ) {
    const aliases =
      new Set([
        normalizeText(
          exercise.id
        ),

        normalizeText(
          exercise.name
        ),

        slugify(
          exercise.name
        ),

        ...asArray(
          exercise.aliases
        )
          .map(
            normalizeText
          )
          .filter(Boolean)
      ]);


    for (
      const alias
      of aliases
    ) {
      if (!alias) {
        continue;
      }


      if (
        !aliasOwners.has(
          alias
        )
      ) {
        aliasOwners.set(
          alias,
          new Set()
        );
      }

      aliasOwners
        .get(
          alias
        )
        .add(
          exercise.id
        );
    }
  }


  for (
    const [
      alias,
      owners
    ]
    of aliasOwners
  ) {
    if (
      owners.size <= 1
    ) {
      continue;
    }


    addWarning(
      warnings,
      {
        code:
          "global_alias_collision",

        field:
          "aliases",

        value:
          alias,

        message:
          `Alias "${alias}" resolves to multiple exercises: ${Array.from(owners).join(", ")}.`
      }
    );
  }
}


// =====================================================
// TARGET EMPHASIS VALIDATION
// =====================================================

function validateTargetEmphasis(
  exercise,
  warnings
) {
  const exerciseId =
    normalizeText(
      exercise.id
    );

  const moduleId =
    normalizeText(
      exercise.moduleId
    ) ||
    null;

  const emphasis =
    exercise.targetEmphasis;


  if (
    emphasis === undefined ||
    emphasis === null
  ) {
    return;
  }


  if (
    !isPlainObject(
      emphasis
    )
  ) {
    addWarning(
      warnings,
      {
        code:
          "invalid_target_emphasis",

        exerciseId,
        moduleId,

        field:
          "targetEmphasis",

        value:
          emphasis,

        message:
          `Exercise "${exerciseId}" targetEmphasis should be an object.`
      }
    );

    return;
  }


  const muscleId =
    normalizeText(
      emphasis.muscle
    );


  if (
    muscleId &&
    !Muscles.has(
      muscleId
    )
  ) {
    addWarning(
      warnings,
      {
        code:
          "target_emphasis_unknown_muscle",

        exerciseId,
        moduleId,

        field:
          "targetEmphasis.muscle",

        value:
          emphasis.muscle,

        message:
          `Exercise "${exerciseId}" targetEmphasis references unknown muscle "${emphasis.muscle}".`
      }
    );
  }


  if (
    !normalizeText(
      emphasis.label
    )
  ) {
    addWarning(
      warnings,
      {
        code:
          "target_emphasis_missing_label",

        exerciseId,
        moduleId,

        field:
          "targetEmphasis.label",

        message:
          `Exercise "${exerciseId}" targetEmphasis has no user-facing label.`
      }
    );
  }
}


// =====================================================
// FULL VALIDATION
// =====================================================

function validateExerciseLibrary() {
  const errors = [];
  const warnings = [];

  const exercises =
    Array.isArray(
      ExerciseRegistry.all
    )
      ? ExerciseRegistry.all
      : [];


  validateModules(
    errors,
    warnings
  );


  /*
   * Pull in registry-level diagnostics first.
   * This catches duplicate IDs and anything already detected
   * directly by the central registry.
   */
  try {
    const registryValidation =
      ExerciseRegistry
        .validate?.();

    for (
      const item
      of registryValidation
        ?.invalid ||
      []
    ) {
      addError(
        errors,
        {
          code:
            `registry_${item.type || "invalid_reference"}`,

          exerciseId:
            item.exerciseId ||
            null,

          moduleId:
            item.moduleId ||
            null,

          value:
            item.value,

          message:
            `Exercise registry reported ${item.type || "an invalid reference"} for "${item.exerciseId || "unknown exercise"}"${item.value ? `: ${item.value}` : ""}.`
        }
      );
    }


    for (
      const item
      of registryValidation
        ?.warnings ||
      []
    ) {
      addWarning(
        warnings,
        {
          code:
            `registry_${item.type || "warning"}`,

          exerciseId:
            item.exerciseId ||
            null,

          moduleId:
            item.moduleId ||
            null,

          value:
            item.value,

          message:
            `Exercise registry warning for "${item.exerciseId || "unknown exercise"}": ${item.type || "warning"}${item.value ? ` (${item.value})` : ""}.`
        }
      );
    }
  } catch (error) {
    addError(
      errors,
      {
        code:
          "registry_validation_failed",

        value:
          error?.message ||
          String(error),

        message:
          "ExerciseRegistry.validate() threw an exception."
      }
    );
  }


  if (
    exercises.length === 0
  ) {
    addError(
      errors,
      {
        code:
          "exercise_library_empty",

        message:
          "Exercise registry contains no exercises."
      }
    );
  }


  for (
    const exercise
    of exercises
  ) {
    validateExerciseCore(
      exercise,
      errors,
      warnings
    );


    for (
      const config
      of [
        {
          field:
            "exerciseTypes",

          allowEmpty:
            false
        },

        {
          field:
            "bodyParts",

          allowEmpty:
            false
        },

        {
          field:
            "primaryMuscles",

          allowEmpty:
            exercise.category ===
              "cardio"
        },

        {
          field:
            "secondaryMuscles",

          allowEmpty:
            true
        },

        {
          field:
            "movementPatterns",

          allowEmpty:
            true
        },

        {
          field:
            "equipment",

          allowEmpty:
            false
        },

        {
          field:
            "aliases",

          allowEmpty:
            true
        },

        {
          field:
            "substitutions",

          allowEmpty:
            true
        }
      ]
    ) {
      validateArrayField({
        exercise,
        errors,
        warnings,
        ...config
      });
    }


    validateReferences(
      exercise,
      errors
    );

    validateSubstitutions(
      exercise,
      errors,
      warnings
    );

    validateGoals(
      exercise,
      errors,
      warnings
    );

    validateLogging(
      exercise,
      errors,
      warnings
    );

    validateEnergyProfile(
      exercise,
      errors,
      warnings
    );

    validateAliases(
      exercise,
      errors,
      warnings
    );

    validateTargetEmphasis(
      exercise,
      warnings
    );
  }


  validateGlobalAliasCollisions(
    exercises,
    warnings
  );


  const errorsByCode =
    countIssuesByCode(
      errors
    );

  const warningsByCode =
    countIssuesByCode(
      warnings
    );


  return {
    valid:
      errors.length === 0,

    version:
      VERSION,

    source:
      SOURCE,

    exerciseCount:
      exercises.length,

    moduleCount:
      ExerciseRegistry
        .getModules?.()
        ?.length ||
      0,

    errorCount:
      errors.length,

    warningCount:
      warnings.length,

    errorsByCode,

    warningsByCode,

    errors,
    warnings,

    checkedAt:
      new Date()
        .toISOString()
  };
}


// =====================================================
// REPORTING HELPERS
// =====================================================

function countIssuesByCode(
  issues
) {
  const result = {};

  for (
    const issue
    of issues
  ) {
    const code =
      issue.code ||
      "unknown";

    result[
      code
    ] =
      (
        result[
          code
        ] ||
        0
      ) +
      1;
  }

  return result;
}


function getExerciseIssues(
  exerciseId
) {
  const normalized =
    normalizeText(
      exerciseId
    );

  if (!normalized) {
    return {
      errors: [],
      warnings: []
    };
  }


  const report =
    validateExerciseLibrary();


  return {
    errors:
      report.errors
        .filter(
          issue =>
            normalizeText(
              issue.exerciseId
            ) ===
              normalized
        ),

    warnings:
      report.warnings
        .filter(
          issue =>
            normalizeText(
              issue.exerciseId
            ) ===
              normalized
        )
  };
}


function getModuleIssues(
  moduleId
) {
  const normalized =
    normalizeText(
      moduleId
    );

  if (!normalized) {
    return {
      errors: [],
      warnings: []
    };
  }


  const report =
    validateExerciseLibrary();


  return {
    errors:
      report.errors
        .filter(
          issue =>
            normalizeText(
              issue.moduleId
            ) ===
              normalized
        ),

    warnings:
      report.warnings
        .filter(
          issue =>
            normalizeText(
              issue.moduleId
            ) ===
              normalized
        )
  };
}


function formatValidationSummary(
  report =
    validateExerciseLibrary()
) {
  const status =
    report.valid
      ? "VALID"
      : "INVALID";


  return [
    "===== ARI TRAINING EXERCISE VALIDATION =====",
    "",
    `Status: ${status}`,
    `Exercises: ${report.exerciseCount}`,
    `Modules: ${report.moduleCount}`,
    `Errors: ${report.errorCount}`,
    `Warnings: ${report.warningCount}`,
    `Checked: ${report.checkedAt}`,
    "",
    report.valid
      ? "Exercise library passed required validation."
      : "Exercise library contains errors that should be fixed before production.",
    "",
    "============================================"
  ].join(
    "\n"
  );
}


function printValidationReport() {
  const report =
    validateExerciseLibrary();

  const summary =
    formatValidationSummary(
      report
    );


  if (
    typeof console !==
      "undefined"
  ) {
    if (
      report.valid
    ) {
      console.info(
        summary
      );
    } else {
      console.error(
        summary
      );
    }


    if (
      report.errors.length
    ) {
      console.group?.(
        `[ARI Exercise Validator] ${report.errors.length} error(s)`
      );

      for (
        const error
        of report.errors
      ) {
        console.error(
          error
        );
      }

      console.groupEnd?.();
    }


    if (
      report.warnings.length
    ) {
      console.group?.(
        `[ARI Exercise Validator] ${report.warnings.length} warning(s)`
      );

      for (
        const warning
        of report.warnings
      ) {
        console.warn(
          warning
        );
      }

      console.groupEnd?.();
    }
  }


  return report;
}


// =====================================================
// PUBLIC API
// =====================================================

const AriTrainingExerciseValidator =
  Object.freeze({
    version:
      VERSION,

    source:
      SOURCE,

    validate:
      validateExerciseLibrary,

    validateAll:
      validateExerciseLibrary,

    getExerciseIssues,

    getModuleIssues,

    formatSummary:
      formatValidationSummary,

    print:
      printValidationReport
  });


// =====================================================
// GLOBAL API
// =====================================================

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

  Ari.training.exerciseValidator =
    AriTrainingExerciseValidator;

  globalThis.Ari =
    Ari;
}


// =====================================================
// EXPORTS
// =====================================================

export {
  VERSION,
  SOURCE,

  validateExerciseLibrary,
  getExerciseIssues,
  getModuleIssues,
  formatValidationSummary,
  printValidationReport,

  AriTrainingExerciseValidator
};

export default
  AriTrainingExerciseValidator;
