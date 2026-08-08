// =====================================================
// ARI REBIRTH
// File: js/training/workout-session-api.js
// Version: 2.0.0
// Purpose:
//   Supabase persistence boundary for ARI Training live
//   workout sessions, session exercises, sets, heart-rate
//   readings, and completed workout history.
//
// Built specifically for ari-training.js V4.1.1+.
//
// IMPORTANT:
//   This version matches the CURRENT production schema:
//
//   ari_workout_sessions
//   ari_workout_session_exercises
//   ari_workout_session_sets
//   ari_workout_heart_rate_readings
//
// Existing runtime statuses:
//
//   Session:
//     active
//     paused
//     finishing
//     completed
//     abandoned
//
//   Session Exercise:
//     pending
//     current
//     completed
//     skipped
//
// Existing exercise sources:
//
//     planned
//     ad_hoc
//
// Design:
//   - Does NOT create a second Supabase client.
//   - Keeps all Supabase calls out of ari-training.js.
//   - Keeps the current SQL/table structure intact.
//   - Supports local/offline callers by failing cleanly when
//     a Supabase client or authenticated user is unavailable.
//   - All user-owned reads/writes are scoped by user_id.
//   - Returns raw-ish runtime-shaped records so ari-training.js
//     does not need an additional mapping layer.
// =====================================================

const VERSION =
  "2.0.0";

const SOURCE =
  "js/training/workout-session-api";


const DEFAULT_TABLES =
  Object.freeze({
    sessions:
      "ari_workout_sessions",

    exercises:
      "ari_workout_session_exercises",

    sets:
      "ari_workout_session_sets",

    heartRateReadings:
      "ari_workout_heart_rate_readings"
  });


const OPEN_SESSION_STATUSES =
  Object.freeze([
    "active",
    "paused",
    "finishing"
  ]);


const SESSION_STATUSES =
  Object.freeze([
    "active",
    "paused",
    "finishing",
    "completed",
    "abandoned"
  ]);


const EXERCISE_STATUSES =
  Object.freeze([
    "pending",
    "current",
    "completed",
    "skipped"
  ]);


const EXERCISE_SOURCES =
  Object.freeze([
    "planned",
    "ad_hoc"
  ]);


const COMPLETION_MODES =
  Object.freeze([
    "sets",
    "single"
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
  ).trim();
}


function normalizeId(
  value
) {
  const text =
    normalizeText(
      value
    );

  return text ||
    null;
}


function normalizeDateKey(
  value
) {
  const text =
    normalizeText(
      value
    );

  return /^\d{4}-\d{2}-\d{2}$/.test(
    text
  )
    ? text
    : null;
}


function normalizeStatus(
  value
) {
  const normalized =
    normalizeText(
      value
    )
      .toLowerCase();

  return SESSION_STATUSES
    .includes(
      normalized
    )
      ? normalized
      : null;
}


function normalizeExerciseStatus(
  value
) {
  const normalized =
    normalizeText(
      value
    )
      .toLowerCase();

  return EXERCISE_STATUSES
    .includes(
      normalized
    )
      ? normalized
      : null;
}


function normalizeExerciseSource(
  value
) {
  const normalized =
    normalizeText(
      value
    )
      .toLowerCase();

  return EXERCISE_SOURCES
    .includes(
      normalized
    )
      ? normalized
      : null;
}


function normalizeCompletionMode(
  value
) {
  const normalized =
    normalizeText(
      value
    )
      .toLowerCase();

  return COMPLETION_MODES
    .includes(
      normalized
    )
      ? normalized
      : null;
}


function normalizePositiveInteger(
  value
) {
  const number =
    Number(
      value
    );

  return (
    Number.isInteger(
      number
    ) &&
    number > 0
  )
    ? number
    : null;
}


function normalizeNonNegativeInteger(
  value
) {
  const number =
    Number(
      value
    );

  return (
    Number.isInteger(
      number
    ) &&
    number >= 0
  )
    ? number
    : null;
}


function normalizeNonNegativeNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(
      value
    );

  return (
    Number.isFinite(
      number
    ) &&
    number >= 0
  )
    ? number
    : null;
}


function normalizeHeartRate(
  value
) {
  const number =
    Number(
      value
    );

  return (
    Number.isFinite(
      number
    ) &&
    number >= 30 &&
    number <= 240
  )
    ? Math.round(
        number
      )
    : null;
}


function clone(
  value
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    typeof structuredClone ===
      "function"
  ) {
    try {
      return structuredClone(
        value
      );
    } catch {
      // Fall through.
    }
  }

  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}


function looksLikeSupabaseClient(
  value
) {
  return Boolean(
    value &&
    typeof value ===
      "object" &&
    typeof value.from ===
      "function"
  );
}


function getLocalDateKey(
  date =
    new Date()
) {
  return (
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, "0")}-` +
    `${String(date.getDate()).padStart(2, "0")}`
  );
}


function getMonthBounds(
  dateKey =
    getLocalDateKey()
) {
  const normalized =
    normalizeDateKey(
      dateKey
    );

  if (!normalized) {
    return null;
  }

  const [
    year,
    month
  ] =
    normalized
      .split("-")
      .map(Number);

  const start =
    new Date(
      year,
      month - 1,
      1
    );

  const end =
    new Date(
      year,
      month,
      0
    );

  return {
    start:
      getLocalDateKey(
        start
      ),

    end:
      getLocalDateKey(
        end
      )
  };
}


// =====================================================
// API
// =====================================================

const AriTrainingWorkoutSessionApi = {
  version:
    VERSION,

  source:
    SOURCE,

  openSessionStatuses:
    OPEN_SESSION_STATUSES,

  state: {
    client:
      null,

    configured:
      false,

    tables: {
      ...DEFAULT_TABLES
    },

    lastLoadAt:
      null,

    lastSaveAt:
      null,

    lastDeleteAt:
      null,

    lastError:
      null
  },


  // ===================================================
  // CONFIGURATION
  // ===================================================

  configure({
    client =
      null,

    tables =
      null
  } = {}) {
    if (
      client &&
      !looksLikeSupabaseClient(
        client
      )
    ) {
      throw new TypeError(
        "AriTrainingWorkoutSessionApi.configure received an invalid Supabase client."
      );
    }

    if (client) {
      this.state.client =
        client;
    }

    if (
      tables &&
      typeof tables ===
        "object"
    ) {
      this.state.tables = {
        ...this.state.tables,
        ...tables
      };
    }

    this.state.configured =
      Boolean(
        this.findClient()
      );

    return this
      .getDiagnostics();
  },


  findClient() {
    if (
      looksLikeSupabaseClient(
        this.state.client
      )
    ) {
      return this.state.client;
    }

    const candidates = [
      globalThis
        .calbuddySupabase,

      globalThis
        .supabaseClient,

      globalThis
        .AriTrainingConfig
        ?.supabaseClient,

      globalThis
        .AriTrainingConfig
        ?.client,

      globalThis
        .Ari
        ?.supabaseClient,

      globalThis
        .Ari
        ?.supabase,

      globalThis
        .ARI
        ?.supabaseClient,

      globalThis
        .ARI
        ?.supabase
    ];

    for (
      const candidate
      of candidates
    ) {
      if (
        looksLikeSupabaseClient(
          candidate
        )
      ) {
        this.state.client =
          candidate;

        this.state.configured =
          true;

        return candidate;
      }
    }

    return null;
  },


  requireClient() {
    const client =
      this.findClient();

    if (!client) {
      throw new Error(
        "ARI Training workout session API has no Supabase client."
      );
    }

    return client;
  },


  // ===================================================
  // AUTH
  // ===================================================

  async getAuthenticatedUser() {
    const client =
      this.requireClient();

    if (
      !client.auth ||
      typeof client.auth
        .getUser !==
        "function"
    ) {
      throw new Error(
        "Supabase auth.getUser() is unavailable."
      );
    }

    const {
      data,
      error
    } =
      await client.auth
        .getUser();

    if (error) {
      throw error;
    }

    const user =
      data?.user ||
      null;

    if (!user?.id) {
      throw new Error(
        "No authenticated user is available."
      );
    }

    return user;
  },


  async resolveUserId(
    userId =
      null
  ) {
    const explicit =
      normalizeId(
        userId
      );

    if (explicit) {
      return explicit;
    }

    const user =
      await this
        .getAuthenticatedUser();

    return user.id;
  },


  // ===================================================
  // SESSION CREATION
  // ===================================================

  async createSession({
    userId =
      null,

    planId =
      null,

    localDate,

    timezone =
      null,

    plannedWeekday =
      null,

    title =
      "Workout",

    source =
      "planned",

    status =
      "active"
  } = {}) {
    this.state.lastError =
      null;

    try {
      const client =
        this.requireClient();

      const resolvedUserId =
        await this
          .resolveUserId(
            userId
          );

      const normalizedDate =
        normalizeDateKey(
          localDate
        );

      if (!normalizedDate) {
        throw new TypeError(
          "createSession requires localDate in YYYY-MM-DD format."
        );
      }

      const normalizedStatus =
        normalizeStatus(
          status
        ) ||
        "active";

      const payload = {
        user_id:
          resolvedUserId,

        plan_id:
          normalizeId(
            planId
          ),

        local_date:
          normalizedDate,

        timezone:
          normalizeText(
            timezone
          ) ||
          null,

        planned_weekday:
          normalizeText(
            plannedWeekday
          )
            .toLowerCase() ||
          null,

        title:
          normalizeText(
            title
          ) ||
          "Workout",

        source:
          normalizeText(
            source
          ) ||
          "planned",

        status:
          normalizedStatus
      };

      const {
        data,
        error
      } =
        await client
          .from(
            this.state.tables
              .sessions
          )
          .insert(
            payload
          )
          .select()
          .single();

      if (error) {
        throw error;
      }

      this.state.lastSaveAt =
        new Date()
          .toISOString();

      return data;
    } catch (
      error
    ) {
      this.state.lastError =
        error;

      throw error;
    }
  },


  // ===================================================
  // SESSION READS
  // ===================================================

  async getOpenSession({
    userId =
      null
  } = {}) {
    this.state.lastError =
      null;

    try {
      const client =
        this.requireClient();

      const resolvedUserId =
        await this
          .resolveUserId(
            userId
          );

      const {
        data,
        error
      } =
        await client
          .from(
            this.state.tables
              .sessions
          )
          .select("*")
          .eq(
            "user_id",
            resolvedUserId
          )
          .in(
            "status",
            [
              ...OPEN_SESSION_STATUSES
            ]
          )
          .order(
            "started_at",
            {
              ascending:
                false
            }
          )
          .limit(
            1
          )
          .maybeSingle();

      if (error) {
        throw error;
      }

      this.state.lastLoadAt =
        new Date()
          .toISOString();

      return data ||
        null;
    } catch (
      error
    ) {
      this.state.lastError =
        error;

      throw error;
    }
  },


  async getSession({
    sessionId,

    userId =
      null
  } = {}) {
    const client =
      this.requireClient();

    const resolvedSessionId =
      normalizeId(
        sessionId
      );

    if (!resolvedSessionId) {
      return null;
    }

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .sessions
        )
        .select("*")
        .eq(
          "id",
          resolvedSessionId
        )
        .eq(
          "user_id",
          resolvedUserId
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    return data ||
      null;
  },


  async getFullSession({
    sessionId,

    userId =
      null
  } = {}) {
    this.state.lastError =
      null;

    try {
      const resolvedSessionId =
        normalizeId(
          sessionId
        );

      if (!resolvedSessionId) {
        return null;
      }

      const resolvedUserId =
        await this
          .resolveUserId(
            userId
          );

      const [
        session,
        exercises,
        sets,
        heartRateReadings
      ] =
        await Promise.all([
          this.getSession({
            sessionId:
              resolvedSessionId,

            userId:
              resolvedUserId
          }),

          this.getSessionExercises({
            sessionId:
              resolvedSessionId,

            userId:
              resolvedUserId
          }),

          this.getSessionSets({
            sessionId:
              resolvedSessionId,

            userId:
              resolvedUserId
          }),

          this.getHeartRateReadings({
            sessionId:
              resolvedSessionId,

            userId:
              resolvedUserId
          })
        ]);

      if (!session) {
        return null;
      }

      for (
        const exercise
        of exercises
      ) {
        exercise.sets =
          sets.filter(
            set =>
              String(
                set.session_exercise_id
              ) ===
              String(
                exercise.id
              )
          );
      }

      this.state.lastLoadAt =
        new Date()
          .toISOString();

      return {
        ...session,

        exercises,

        heartRateReadings
      };
    } catch (
      error
    ) {
      this.state.lastError =
        error;

      throw error;
    }
  },


  // ===================================================
  // SESSION UPDATE
  // ===================================================

  async updateSession({
    sessionId,

    userId =
      null,

    patch =
      {}
  } = {}) {
    const resolvedSessionId =
      normalizeId(
        sessionId
      );

    if (
      !resolvedSessionId ||
      !patch ||
      typeof patch !==
        "object"
    ) {
      return null;
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const nextPatch = {
      ...clone(
        patch
      )
    };

    if (
      "status" in
      nextPatch
    ) {
      const normalizedStatus =
        normalizeStatus(
          nextPatch.status
        );

      if (!normalizedStatus) {
        throw new TypeError(
          `Invalid workout session status: ${nextPatch.status}`
        );
      }

      nextPatch.status =
        normalizedStatus;
    }

    if (
      "average_heart_rate" in
      nextPatch
    ) {
      nextPatch.average_heart_rate =
        normalizeHeartRate(
          nextPatch.average_heart_rate
        );
    }

    if (
      "peak_heart_rate" in
      nextPatch
    ) {
      nextPatch.peak_heart_rate =
        normalizeHeartRate(
          nextPatch.peak_heart_rate
        );
    }

    if (
      "estimated_calories" in
      nextPatch
    ) {
      nextPatch.estimated_calories =
        normalizeNonNegativeNumber(
          nextPatch.estimated_calories
        ) ||
        0;
    }

    if (
      "paused_duration_seconds" in
      nextPatch
    ) {
      nextPatch.paused_duration_seconds =
        normalizeNonNegativeInteger(
          nextPatch.paused_duration_seconds
        ) ||
        0;
    }

    if (
      "duration_seconds" in
      nextPatch
    ) {
      nextPatch.duration_seconds =
        normalizeNonNegativeInteger(
          nextPatch.duration_seconds
        );
    }

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .sessions
        )
        .update(
          nextPatch
        )
        .eq(
          "id",
          resolvedSessionId
        )
        .eq(
          "user_id",
          resolvedUserId
        )
        .select()
        .single();

    if (error) {
      throw error;
    }

    this.state.lastSaveAt =
      new Date()
        .toISOString();

    return data;
  },


  async completeSession({
    sessionId,

    userId =
      null,

    durationSeconds,

    selectedIntensity =
      null,

    resolvedIntensity =
      null,

    averageHeartRate =
      null,

    peakHeartRate =
      null,

    estimatedCalories =
      0,

    completedAt =
      new Date()
        .toISOString()
  } = {}) {
    return this.updateSession({
      sessionId,

      userId,

      patch: {
        status:
          "completed",

        completed_at:
          completedAt,

        duration_seconds:
          normalizeNonNegativeInteger(
            durationSeconds
          ) ||
          0,

        selected_intensity:
          normalizeText(
            selectedIntensity
          ) ||
          null,

        resolved_intensity:
          normalizeText(
            resolvedIntensity
          ) ||
          null,

        average_heart_rate:
          normalizeHeartRate(
            averageHeartRate
          ),

        peak_heart_rate:
          normalizeHeartRate(
            peakHeartRate
          ),

        estimated_calories:
          normalizeNonNegativeNumber(
            estimatedCalories
          ) ||
          0
      }
    });
  },


  async abandonSession({
    sessionId,

    userId =
      null
  } = {}) {
    return this.updateSession({
      sessionId,

      userId,

      patch: {
        status:
          "abandoned"
      }
    });
  },


  // ===================================================
  // SESSION EXERCISES
  // ===================================================

  async createExercise({
    sessionId,

    userId =
      null,

    exerciseId,

    exerciseName,

    exerciseType =
      null,

    sortOrder =
      0,

    source =
      "planned",

    status =
      "pending",

    completionMode =
      "sets",

    plannedSets =
      null,

    plannedReps =
      null,

    plannedWeight =
      null,

    plannedDurationSeconds =
      null,

    actualDurationSeconds =
      null,

    estimatedCalories =
      0
  } = {}) {
    const resolvedSessionId =
      normalizeId(
        sessionId
      );

    const resolvedExerciseId =
      normalizeId(
        exerciseId
      );

    if (
      !resolvedSessionId ||
      !resolvedExerciseId
    ) {
      throw new TypeError(
        "createExercise requires sessionId and exerciseId."
      );
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const resolvedSource =
      normalizeExerciseSource(
        source
      ) ||
      "planned";

    const resolvedStatus =
      normalizeExerciseStatus(
        status
      ) ||
      "pending";

    const resolvedCompletionMode =
      normalizeCompletionMode(
        completionMode
      ) ||
      "sets";

    const payload = {
      session_id:
        resolvedSessionId,

      user_id:
        resolvedUserId,

      exercise_id:
        resolvedExerciseId,

      exercise_name:
        normalizeText(
          exerciseName
        ) ||
        resolvedExerciseId,

      exercise_type:
        normalizeText(
          exerciseType
        ) ||
        null,

      sort_order:
        normalizeNonNegativeInteger(
          sortOrder
        ) ||
        0,

      source:
        resolvedSource,

      status:
        resolvedStatus,

      completion_mode:
        resolvedCompletionMode,

      planned_sets:
        normalizePositiveInteger(
          plannedSets
        ),

      planned_reps:
        normalizePositiveInteger(
          plannedReps
        ),

      planned_weight:
        normalizeNonNegativeNumber(
          plannedWeight
        ),

      planned_duration_seconds:
        normalizeNonNegativeInteger(
          plannedDurationSeconds
        ),

      actual_duration_seconds:
        normalizeNonNegativeInteger(
          actualDurationSeconds
        ),

      estimated_calories:
        normalizeNonNegativeNumber(
          estimatedCalories
        ) ||
        0
    };

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .exercises
        )
        .insert(
          payload
        )
        .select()
        .single();

    if (error) {
      throw error;
    }

    this.state.lastSaveAt =
      new Date()
        .toISOString();

    return data;
  },


  async updateExercise({
    exerciseRowId,

    userId =
      null,

    patch =
      {}
  } = {}) {
    const resolvedExerciseRowId =
      normalizeId(
        exerciseRowId
      );

    if (
      !resolvedExerciseRowId ||
      !patch ||
      typeof patch !==
        "object"
    ) {
      return null;
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const nextPatch = {
      ...clone(
        patch
      )
    };

    if (
      "status" in
      nextPatch
    ) {
      const normalized =
        normalizeExerciseStatus(
          nextPatch.status
        );

      if (!normalized) {
        throw new TypeError(
          `Invalid session exercise status: ${nextPatch.status}`
        );
      }

      nextPatch.status =
        normalized;
    }

    if (
      "source" in
      nextPatch
    ) {
      const normalized =
        normalizeExerciseSource(
          nextPatch.source
        );

      if (!normalized) {
        throw new TypeError(
          `Invalid session exercise source: ${nextPatch.source}`
        );
      }

      nextPatch.source =
        normalized;
    }

    if (
      "completion_mode" in
      nextPatch
    ) {
      const normalized =
        normalizeCompletionMode(
          nextPatch.completion_mode
        );

      if (!normalized) {
        throw new TypeError(
          `Invalid session exercise completion mode: ${nextPatch.completion_mode}`
        );
      }

      nextPatch.completion_mode =
        normalized;
    }

    const numericFields = [
      "sort_order",
      "planned_sets",
      "planned_reps",
      "planned_duration_seconds",
      "actual_duration_seconds"
    ];

    for (
      const field
      of numericFields
    ) {
      if (
        field in
        nextPatch
      ) {
        nextPatch[
          field
        ] =
          field ===
            "sort_order"
            ? (
                normalizeNonNegativeInteger(
                  nextPatch[
                    field
                  ]
                ) ||
                0
              )
            : normalizeNonNegativeInteger(
                nextPatch[
                  field
                ]
              );
      }
    }

    if (
      "planned_weight" in
      nextPatch
    ) {
      nextPatch.planned_weight =
        normalizeNonNegativeNumber(
          nextPatch.planned_weight
        );
    }

    if (
      "estimated_calories" in
      nextPatch
    ) {
      nextPatch.estimated_calories =
        normalizeNonNegativeNumber(
          nextPatch.estimated_calories
        ) ||
        0;
    }

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .exercises
        )
        .update(
          nextPatch
        )
        .eq(
          "id",
          resolvedExerciseRowId
        )
        .eq(
          "user_id",
          resolvedUserId
        )
        .select()
        .single();

    if (error) {
      throw error;
    }

    this.state.lastSaveAt =
      new Date()
        .toISOString();

    return data;
  },


  async getSessionExercises({
    sessionId,

    userId =
      null
  } = {}) {
    const resolvedSessionId =
      normalizeId(
        sessionId
      );

    if (!resolvedSessionId) {
      return [];
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .exercises
        )
        .select("*")
        .eq(
          "session_id",
          resolvedSessionId
        )
        .eq(
          "user_id",
          resolvedUserId
        )
        .order(
          "sort_order",
          {
            ascending:
              true
          }
        );

    if (error) {
      throw error;
    }

    return data ||
      [];
  },


  async reorderExercises({
    sessionId,

    userId =
      null,

    orderedExerciseRowIds =
      []
  } = {}) {
    const resolvedSessionId =
      normalizeId(
        sessionId
      );

    if (
      !resolvedSessionId ||
      !Array.isArray(
        orderedExerciseRowIds
      )
    ) {
      return false;
    }

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    for (
      let index = 0;
      index <
        orderedExerciseRowIds.length;
      index += 1
    ) {
      const exerciseRowId =
        normalizeId(
          orderedExerciseRowIds[
            index
          ]
        );

      if (!exerciseRowId) {
        continue;
      }

      await this.updateExercise({
        exerciseRowId,

        userId:
          resolvedUserId,

        patch: {
          sort_order:
            index
        }
      });
    }

    return true;
  },


  // ===================================================
  // SETS
  // ===================================================

  async createSets({
    sessionId,

    sessionExerciseId,

    userId =
      null,

    count,

    plannedReps =
      null,

    plannedWeight =
      null
  } = {}) {
    const resolvedSessionId =
      normalizeId(
        sessionId
      );

    const resolvedSessionExerciseId =
      normalizeId(
        sessionExerciseId
      );

    const resolvedCount =
      normalizePositiveInteger(
        count
      );

    if (
      !resolvedSessionId ||
      !resolvedSessionExerciseId ||
      !resolvedCount
    ) {
      return [];
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const rows = [];

    for (
      let setNumber = 1;
      setNumber <=
        resolvedCount;
      setNumber += 1
    ) {
      rows.push({
        session_id:
          resolvedSessionId,

        session_exercise_id:
          resolvedSessionExerciseId,

        user_id:
          resolvedUserId,

        set_number:
          setNumber,

        planned_reps:
          normalizePositiveInteger(
            plannedReps
          ),

        planned_weight:
          normalizeNonNegativeNumber(
            plannedWeight
          ),

        actual_reps:
          null,

        actual_weight:
          normalizeNonNegativeNumber(
            plannedWeight
          ),

        completed:
          false,

        estimated_calories:
          0
      });
    }

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .sets
        )
        .insert(
          rows
        )
        .select();

    if (error) {
      throw error;
    }

    this.state.lastSaveAt =
      new Date()
        .toISOString();

    return data ||
      [];
  },


  async createExerciseWithSets(
    options =
      {}
  ) {
    const exercise =
      await this
        .createExercise(
          options
        );

    if (
      exercise &&
      exercise.completion_mode ===
        "sets" &&
      Number(
        exercise.planned_sets
      ) >
        0
    ) {
      exercise.sets =
        await this
          .createSets({
            sessionId:
              exercise.session_id,

            sessionExerciseId:
              exercise.id,

            userId:
              exercise.user_id,

            count:
              exercise.planned_sets,

            plannedReps:
              exercise.planned_reps,

            plannedWeight:
              exercise.planned_weight
          });
    } else if (
      exercise
    ) {
      exercise.sets =
        [];
    }

    return exercise;
  },


  async updateSet({
    setId,

    userId =
      null,

    patch =
      {}
  } = {}) {
    const resolvedSetId =
      normalizeId(
        setId
      );

    if (
      !resolvedSetId ||
      !patch ||
      typeof patch !==
        "object"
    ) {
      return null;
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const nextPatch = {
      ...clone(
        patch
      )
    };

    const numericFields = [
      "actual_reps",
      "planned_reps",
      "set_number"
    ];

    for (
      const field
      of numericFields
    ) {
      if (
        field in
        nextPatch
      ) {
        nextPatch[
          field
        ] =
          normalizeNonNegativeInteger(
            nextPatch[
              field
            ]
          );
      }
    }

    const decimalFields = [
      "actual_weight",
      "planned_weight",
      "estimated_calories"
    ];

    for (
      const field
      of decimalFields
    ) {
      if (
        field in
        nextPatch
      ) {
        nextPatch[
          field
        ] =
          normalizeNonNegativeNumber(
            nextPatch[
              field
            ]
          ) ??
          (
            field ===
              "estimated_calories"
              ? 0
              : null
          );
      }
    }

    if (
      "completed" in
      nextPatch
    ) {
      nextPatch.completed =
        Boolean(
          nextPatch.completed
        );
    }

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .sets
        )
        .update(
          nextPatch
        )
        .eq(
          "id",
          resolvedSetId
        )
        .eq(
          "user_id",
          resolvedUserId
        )
        .select()
        .single();

    if (error) {
      throw error;
    }

    this.state.lastSaveAt =
      new Date()
        .toISOString();

    return data;
  },


  async completeSet({
    setId,

    userId =
      null,

    actualWeight =
      null,

    actualReps =
      null,

    estimatedCalories =
      0,

    completedAt =
      new Date()
        .toISOString()
  } = {}) {
    return this.updateSet({
      setId,

      userId,

      patch: {
        actual_weight:
          normalizeNonNegativeNumber(
            actualWeight
          ),

        actual_reps:
          normalizeNonNegativeInteger(
            actualReps
          ),

        completed:
          true,

        completed_at:
          completedAt,

        estimated_calories:
          normalizeNonNegativeNumber(
            estimatedCalories
          ) ||
          0
      }
    });
  },


  async getSessionSets({
    sessionId,

    userId =
      null
  } = {}) {
    const resolvedSessionId =
      normalizeId(
        sessionId
      );

    if (!resolvedSessionId) {
      return [];
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .sets
        )
        .select("*")
        .eq(
          "session_id",
          resolvedSessionId
        )
        .eq(
          "user_id",
          resolvedUserId
        )
        .order(
          "set_number",
          {
            ascending:
              true
          }
        );

    if (error) {
      throw error;
    }

    return data ||
      [];
  },


  async countCompletedSets({
    sessionId,

    userId =
      null
  } = {}) {
    const resolvedSessionId =
      normalizeId(
        sessionId
      );

    if (!resolvedSessionId) {
      return 0;
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const {
      count,
      error
    } =
      await client
        .from(
          this.state.tables
            .sets
        )
        .select(
          "id",
          {
            count:
              "exact",
            head:
              true
          }
        )
        .eq(
          "session_id",
          resolvedSessionId
        )
        .eq(
          "user_id",
          resolvedUserId
        )
        .eq(
          "completed",
          true
        );

    if (error) {
      throw error;
    }

    return count ||
      0;
  },


  // ===================================================
  // HEART RATE
  // ===================================================

  async addHeartRateReading({
    sessionId,

    userId =
      null,

    bpm,

    elapsedSeconds =
      0,

    source =
      "manual"
  } = {}) {
    const resolvedSessionId =
      normalizeId(
        sessionId
      );

    const resolvedBpm =
      normalizeHeartRate(
        bpm
      );

    if (
      !resolvedSessionId ||
      !resolvedBpm
    ) {
      throw new TypeError(
        "addHeartRateReading requires sessionId and a valid bpm."
      );
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .heartRateReadings
        )
        .insert({
          session_id:
            resolvedSessionId,

          user_id:
            resolvedUserId,

          bpm:
            resolvedBpm,

          elapsed_seconds:
            normalizeNonNegativeInteger(
              elapsedSeconds
            ) ||
            0,

          source:
            normalizeText(
              source
            ) ||
            "manual"
        })
        .select()
        .single();

    if (error) {
      throw error;
    }

    this.state.lastSaveAt =
      new Date()
        .toISOString();

    return data;
  },


  async getHeartRateReadings({
    sessionId,

    userId =
      null
  } = {}) {
    const resolvedSessionId =
      normalizeId(
        sessionId
      );

    if (!resolvedSessionId) {
      return [];
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .heartRateReadings
        )
        .select("*")
        .eq(
          "session_id",
          resolvedSessionId
        )
        .eq(
          "user_id",
          resolvedUserId
        )
        .order(
          "recorded_at",
          {
            ascending:
              true
          }
        );

    if (error) {
      throw error;
    }

    return data ||
      [];
  },


  // ===================================================
  // HISTORY
  // ===================================================

  async getCompletedSessionForDate({
    dateKey,

    userId =
      null
  } = {}) {
    const normalizedDate =
      normalizeDateKey(
        dateKey
      );

    if (!normalizedDate) {
      return null;
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .sessions
        )
        .select("*")
        .eq(
          "user_id",
          resolvedUserId
        )
        .eq(
          "local_date",
          normalizedDate
        )
        .eq(
          "status",
          "completed"
        )
        .order(
          "completed_at",
          {
            ascending:
              false
          }
        )
        .limit(
          1
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      ...data,

      completed_sets:
        await this
          .countCompletedSets({
            sessionId:
              data.id,

            userId:
              resolvedUserId
          })
    };
  },


  async getCompletedSessionsForDate({
    dateKey,

    userId =
      null
  } = {}) {
    const normalizedDate =
      normalizeDateKey(
        dateKey
      );

    if (!normalizedDate) {
      return [];
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .sessions
        )
        .select("*")
        .eq(
          "user_id",
          resolvedUserId
        )
        .eq(
          "local_date",
          normalizedDate
        )
        .eq(
          "status",
          "completed"
        )
        .order(
          "completed_at",
          {
            ascending:
              false
          }
        );

    if (error) {
      throw error;
    }

    return this
      .enrichCompletedSessions({
        sessions:
          data ||
          [],

        userId:
          resolvedUserId
      });
  },


  async getCompletedSessionsForMonth({
    dateKey =
      getLocalDateKey(),

    userId =
      null
  } = {}) {
    const bounds =
      getMonthBounds(
        dateKey
      );

    if (!bounds) {
      return [];
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .sessions
        )
        .select("*")
        .eq(
          "user_id",
          resolvedUserId
        )
        .eq(
          "status",
          "completed"
        )
        .gte(
          "local_date",
          bounds.start
        )
        .lte(
          "local_date",
          bounds.end
        )
        .order(
          "completed_at",
          {
            ascending:
              false
          }
        );

    if (error) {
      throw error;
    }

    return this
      .enrichCompletedSessions({
        sessions:
          data ||
          [],

        userId:
          resolvedUserId
      });
  },


  async enrichCompletedSessions({
    sessions =
      [],

    userId =
      null
  } = {}) {
    const records = [];

    for (
      const session
      of Array.isArray(
        sessions
      )
        ? sessions
        : []
    ) {
      records.push({
        ...session,

        completed_sets:
          await this
            .countCompletedSets({
              sessionId:
                session.id,

              userId
            })
      });
    }

    return records;
  },


  // ===================================================
  // REPEAT WORKOUT SUPPORT
  // ===================================================

  async getExercisesForCompletedSession({
    sessionId,

    userId =
      null
  } = {}) {
    return this
      .getSessionExercises({
        sessionId,
        userId
      });
  },


  // ===================================================
  // DELETE
  // ===================================================

  async deleteSession({
    sessionId,

    userId =
      null
  } = {}) {
    const resolvedSessionId =
      normalizeId(
        sessionId
      );

    if (!resolvedSessionId) {
      return false;
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    /*
     * Explicit child deletion keeps this safe even if the
     * current database foreign keys do not use ON DELETE CASCADE.
     */

    const childTables = [
      this.state.tables
        .heartRateReadings,

      this.state.tables
        .sets,

      this.state.tables
        .exercises
    ];

    for (
      const table
      of childTables
    ) {
      const {
        error
      } =
        await client
          .from(
            table
          )
          .delete()
          .eq(
            "session_id",
            resolvedSessionId
          )
          .eq(
            "user_id",
            resolvedUserId
          );

      if (error) {
        throw error;
      }
    }

    const {
      error
    } =
      await client
        .from(
          this.state.tables
            .sessions
        )
        .delete()
        .eq(
          "id",
          resolvedSessionId
        )
        .eq(
          "user_id",
          resolvedUserId
        );

    if (error) {
      throw error;
    }

    this.state.lastDeleteAt =
      new Date()
        .toISOString();

    return true;
  },


  // ===================================================
  // DIAGNOSTICS
  // ===================================================

  getDiagnostics() {
    return {
      source:
        SOURCE,

      version:
        VERSION,

      configured:
        Boolean(
          this.findClient()
        ),

      tables: {
        ...this.state.tables
      },

      statuses: {
        open:
          [
            ...OPEN_SESSION_STATUSES
          ],

        session:
          [
            ...SESSION_STATUSES
          ],

        exercise:
          [
            ...EXERCISE_STATUSES
          ]
      },

      lastLoadAt:
        this.state.lastLoadAt,

      lastSaveAt:
        this.state.lastSaveAt,

      lastDeleteAt:
        this.state.lastDeleteAt,

      lastError:
        this.state.lastError
          ? {
              message:
                this.state
                  .lastError
                  ?.message ||
                String(
                  this.state
                    .lastError
                )
            }
          : null,

      methods: {
        createSession:
          typeof this
            .createSession ===
            "function",

        getOpenSession:
          typeof this
            .getOpenSession ===
            "function",

        getFullSession:
          typeof this
            .getFullSession ===
            "function",

        updateSession:
          typeof this
            .updateSession ===
            "function",

        completeSession:
          typeof this
            .completeSession ===
            "function",

        createExercise:
          typeof this
            .createExercise ===
            "function",

        createExerciseWithSets:
          typeof this
            .createExerciseWithSets ===
            "function",

        updateExercise:
          typeof this
            .updateExercise ===
            "function",

        createSets:
          typeof this
            .createSets ===
            "function",

        updateSet:
          typeof this
            .updateSet ===
            "function",

        completeSet:
          typeof this
            .completeSet ===
            "function",

        addHeartRateReading:
          typeof this
            .addHeartRateReading ===
            "function",

        getCompletedSessionsForMonth:
          typeof this
            .getCompletedSessionsForMonth ===
            "function"
      }
    };
  },


  // ===================================================
  // RESET
  // ===================================================

  destroy() {
    this.state.client =
      null;

    this.state.configured =
      false;

    this.state.tables = {
      ...DEFAULT_TABLES
    };

    this.state.lastLoadAt =
      null;

    this.state.lastSaveAt =
      null;

    this.state.lastDeleteAt =
      null;

    this.state.lastError =
      null;

    return true;
  }
};


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

  Ari.training
    .workoutSessionApi =
      AriTrainingWorkoutSessionApi;

  globalThis.Ari =
    Ari;
}


// =====================================================
// EXPORTS
// =====================================================

export {
  VERSION,
  SOURCE,

  DEFAULT_TABLES,

  OPEN_SESSION_STATUSES,
  SESSION_STATUSES,
  EXERCISE_STATUSES,
  EXERCISE_SOURCES,
  COMPLETION_MODES,

  AriTrainingWorkoutSessionApi
};

export default
  AriTrainingWorkoutSessionApi;
