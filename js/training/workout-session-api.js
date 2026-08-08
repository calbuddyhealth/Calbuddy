// =====================================================
// ARI REBIRTH
// File: js/training/workout-session-api.js
// Version: 1.0.0
// Purpose:
//   Supabase persistence boundary for ARI Training live
//   workout sessions, session exercises, completed sets,
//   and completed workout history.
//
// Architecture:
//
//   workout-plan-store.js
//        = permanent weekly prescription
//
//   workout-progress-store.js
//        = fast local live execution state
//
//   workout-session-api.js
//        = Supabase persistence for live/completed sessions
//
//   ari-training.js / controller
//        = coordinates the UI and both persistence layers
//
// Responsibilities:
//   - Save/update an active workout session.
//   - Restore an unfinished session.
//   - Save session exercise order.
//   - Save planned, added, substituted, and skipped exercises.
//   - Save completed set details.
//   - Save average workout heart rate.
//   - Save elapsed workout time.
//   - Save estimated training calories.
//   - Mark workout sessions complete.
//   - Load workout history by date/month.
//   - Delete a session when explicitly requested.
//   - Scope all database access to the authenticated user.
//   - Never create a second Supabase client.
//
// Expected Supabase tables:
//
//   ari_workout_sessions
//   ari_workout_session_exercises
//   ari_workout_sets
//
// IMPORTANT:
//   This API assumes the Supabase SQL for those tables has
//   already been created.
//
//   The API intentionally keeps JSON snapshots in addition
//   to normalized exercise/set rows. That gives ARI:
//     - simple recovery
//     - richer history
//     - migration flexibility
//     - easy debugging
//
// =====================================================

const VERSION =
  "1.0.0";

const SCHEMA_VERSION =
  1;

const SOURCE =
  "js/training/workout-session-api";


const DEFAULT_TABLES =
  Object.freeze({
    sessions:
      "ari_workout_sessions",

    sessionExercises:
      "ari_workout_session_exercises",

    sets:
      "ari_workout_sets"
  });


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


function normalizeDay(
  value
) {
  const day =
    normalizeText(
      value
    )
      .toLowerCase();

  return [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
  ].includes(
    day
  )
    ? day
    : null;
}


function normalizeStatus(
  value
) {
  const status =
    normalizeText(
      value
    )
      .toLowerCase();

  return [
    "not_started",
    "in_progress",
    "paused",
    "complete",
    "cancelled"
  ].includes(
    status
  )
    ? status
    : "not_started";
}


function normalizeEntryStatus(
  value
) {
  const status =
    normalizeText(
      value
    )
      .toLowerCase();

  return [
    "not_started",
    "in_progress",
    "complete",
    "skipped"
  ].includes(
    status
  )
    ? status
    : "not_started";
}


function normalizeEntrySource(
  value
) {
  const source =
    normalizeText(
      value
    )
      .toLowerCase();

  return [
    "planned",
    "added",
    "substitution"
  ].includes(
    source
  )
    ? source
    : "planned";
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


function normalizeCalories(
  value
) {
  const number =
    normalizeNonNegativeNumber(
      value
    );

  return number ===
    null
      ? 0
      : Math.round(
          number *
          10
        ) /
        10;
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


function nowIso() {
  return new Date()
    .toISOString();
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


function getMonthKey(
  date =
    new Date()
) {
  return (
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, "0")}`
  );
}


function createMonthBounds(
  monthKey
) {
  const normalized =
    normalizeText(
      monthKey
    );

  const match =
    normalized.match(
      /^(\d{4})-(\d{2})$/
    );

  if (!match) {
    return null;
  }

  const year =
    Number(
      match[1]
    );

  const monthIndex =
    Number(
      match[2]
    ) - 1;

  const start =
    new Date(
      year,
      monthIndex,
      1
    );

  const next =
    new Date(
      year,
      monthIndex + 1,
      1
    );

  return {
    start:
      getLocalDateKey(
        start
      ),

    endExclusive:
      getLocalDateKey(
        next
      )
  };
}


// =====================================================
// API
// =====================================================

const AriTrainingWorkoutSessionApi = {
  version:
    VERSION,

  schemaVersion:
    SCHEMA_VERSION,

  source:
    SOURCE,

  state: {
    client:
      null,

    configured:
      false,

    tables: {
      ...DEFAULT_TABLES
    },

    lastLoadedAt:
      null,

    lastSavedAt:
      null,

    lastDeletedAt:
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
        ?.supabase,

      globalThis
        .supabaseClient,

      globalThis
        .calbuddySupabase
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

    return normalizeId(
      user.id
    );
  },


  // ===================================================
  // SNAPSHOT NORMALIZATION
  // ===================================================

  normalizeSnapshot(
    snapshot
  ) {
    if (
      !snapshot ||
      typeof snapshot !==
        "object"
    ) {
      throw new TypeError(
        "A workout session snapshot is required."
      );
    }

    const sessionId =
      normalizeId(
        snapshot.sessionId
      );

    if (!sessionId) {
      throw new TypeError(
        "Workout session snapshot requires sessionId."
      );
    }

    return {
      schemaVersion:
        Number(
          snapshot.schemaVersion
        ) ||
        SCHEMA_VERSION,

      sessionId,

      planKey:
        normalizeId(
          snapshot.planKey
        ),

      weekKey:
        normalizeId(
          snapshot.weekKey
        ),

      day:
        normalizeDay(
          snapshot.day
        ),

      plannedWorkoutId:
        normalizeId(
          snapshot.plannedWorkoutId
        ),

      status:
        normalizeStatus(
          snapshot.status
        ),

      startedAt:
        snapshot.startedAt ||
        null,

      completedAt:
        snapshot.completedAt ||
        null,

      elapsedSeconds:
        normalizeNonNegativeInteger(
          snapshot.elapsedSeconds
        ) ||
        0,

      averageHeartRate:
        normalizeHeartRate(
          snapshot.averageHeartRate
        ),

      estimatedCalories:
        normalizeCalories(
          snapshot.estimatedCalories
        ),

      originalOrder:
        Array.isArray(
          snapshot.originalOrder
        )
          ? snapshot
              .originalOrder
              .map(
                normalizeId
              )
              .filter(Boolean)
          : [],

      sessionOrder:
        Array.isArray(
          snapshot.sessionOrder
        )
          ? snapshot
              .sessionOrder
              .map(
                normalizeId
              )
              .filter(Boolean)
          : [],

      exercises:
        Array.isArray(
          snapshot.exercises
        )
          ? snapshot.exercises
              .map(
                exercise =>
                  this
                    .normalizeExerciseSnapshot(
                      exercise
                    )
              )
              .filter(Boolean)
          : [],

      notes:
        normalizeText(
          snapshot.notes
        ) ||
        null,

      metadata:
        snapshot.metadata &&
        typeof snapshot.metadata ===
          "object"
          ? clone(
              snapshot.metadata
            )
          : {}
    };
  },


  normalizeExerciseSnapshot(
    exercise
  ) {
    if (
      !exercise ||
      typeof exercise !==
        "object"
    ) {
      return null;
    }

    const entryId =
      normalizeId(
        exercise.entryId
      );

    const exerciseId =
      normalizeId(
        exercise.exerciseId
      );

    if (
      !entryId ||
      !exerciseId
    ) {
      return null;
    }

    const completedSets = [];

    if (
      exercise.completedSets &&
      typeof exercise.completedSets ===
        "object"
    ) {
      for (
        const [
          setKey,
          setRecord
        ]
        of Object.entries(
          exercise.completedSets
        )
      ) {
        const setNumber =
          normalizePositiveInteger(
            setRecord?.setNumber ??
            setKey
          );

        if (!setNumber) {
          continue;
        }

        completedSets.push({
          setNumber,

          completed:
            Boolean(
              setRecord?.completed
            ),

          completedAt:
            setRecord?.completedAt ||
            null,

          reps:
            normalizeNonNegativeInteger(
              setRecord?.reps
            ),

          weight:
            normalizeNonNegativeNumber(
              setRecord?.weight
            ),

          durationSeconds:
            normalizeNonNegativeNumber(
              setRecord
                ?.durationSeconds
            ),

          estimatedCalories:
            normalizeCalories(
              setRecord
                ?.estimatedCalories
            ),

          notes:
            normalizeText(
              setRecord?.notes
            ) ||
            null
        });
      }
    }

    return {
      entryId,

      exerciseId,

      source:
        normalizeEntrySource(
          exercise.source
        ),

      status:
        normalizeEntryStatus(
          exercise.status
        ),

      substitutedFromEntryId:
        normalizeId(
          exercise
            .substitutedFromEntryId
        ),

      substitutedFromExerciseId:
        normalizeId(
          exercise
            .substitutedFromExerciseId
        ),

      originalIndex:
        normalizeNonNegativeInteger(
          exercise.originalIndex
        ),

      role:
        normalizeId(
          exercise.role
        ),

      completionMode:
        normalizeId(
          exercise.completionMode
        ) ||
        "single",

      requiredSets:
        normalizePositiveInteger(
          exercise.requiredSets
        ),

      completed:
        Boolean(
          exercise.completed
        ),

      startedAt:
        exercise.startedAt ||
        null,

      completedAt:
        exercise.completedAt ||
        null,

      skippedAt:
        exercise.skippedAt ||
        null,

      prescription:
        exercise.prescription &&
        typeof exercise.prescription ===
          "object"
          ? clone(
              exercise.prescription
            )
          : {},

      actual:
        exercise.actual &&
        typeof exercise.actual ===
          "object"
          ? clone(
              exercise.actual
            )
          : {},

      estimatedCalories:
        normalizeCalories(
          exercise.estimatedCalories
        ),

      completedSets,

      metadata:
        exercise.metadata &&
        typeof exercise.metadata ===
          "object"
          ? clone(
              exercise.metadata
            )
          : {}
    };
  },


  // ===================================================
  // DATABASE PAYLOADS
  // ===================================================

  makeSessionPayload({
    snapshot,
    userId,
    localDate =
      null
  }) {
    const normalized =
      this.normalizeSnapshot(
        snapshot
      );

    const dateKey =
      normalizeText(
        localDate
      ) ||
      (
        normalized.completedAt ||
        normalized.startedAt
          ? getLocalDateKey(
              new Date(
                normalized.completedAt ||
                normalized.startedAt
              )
            )
          : getLocalDateKey()
      );

    return {
      id:
        normalized.sessionId,

      user_id:
        userId,

      plan_key:
        normalized.planKey,

      week_key:
        normalized.weekKey,

      weekday:
        normalized.day,

      local_date:
        dateKey,

      planned_workout_id:
        normalized.plannedWorkoutId,

      status:
        normalized.status,

      started_at:
        normalized.startedAt,

      completed_at:
        normalized.completedAt,

      elapsed_seconds:
        normalized.elapsedSeconds,

      average_heart_rate:
        normalized.averageHeartRate,

      estimated_calories:
        normalized.estimatedCalories,

      notes:
        normalized.notes,

      session_data: {
        ...normalized,

        schemaVersion:
          SCHEMA_VERSION,

        apiVersion:
          VERSION
      },

      updated_at:
        nowIso()
    };
  },


  makeExercisePayload({
    sessionId,
    userId,
    exercise,
    position
  }) {
    return {
      session_id:
        sessionId,

      user_id:
        userId,

      entry_id:
        exercise.entryId,

      exercise_id:
        exercise.exerciseId,

      position:
        normalizeNonNegativeInteger(
          position
        ) ??
        0,

      original_position:
        exercise.originalIndex,

      source:
        exercise.source,

      status:
        exercise.status,

      role:
        exercise.role,

      substituted_from_entry_id:
        exercise.substitutedFromEntryId,

      substituted_from_exercise_id:
        exercise.substitutedFromExerciseId,

      completion_mode:
        exercise.completionMode,

      required_sets:
        exercise.requiredSets,

      completed:
        exercise.completed,

      started_at:
        exercise.startedAt,

      completed_at:
        exercise.completedAt,

      skipped_at:
        exercise.skippedAt,

      estimated_calories:
        exercise.estimatedCalories,

      prescription_data:
        exercise.prescription,

      actual_data:
        exercise.actual,

      exercise_data: {
        ...exercise,

        completedSets:
          undefined
      },

      updated_at:
        nowIso()
    };
  },


  makeSetPayload({
    sessionId,
    userId,
    exerciseEntryId,
    exerciseId,
    setRecord
  }) {
    return {
      session_id:
        sessionId,

      user_id:
        userId,

      exercise_entry_id:
        exerciseEntryId,

      exercise_id:
        exerciseId,

      set_number:
        setRecord.setNumber,

      completed:
        Boolean(
          setRecord.completed
        ),

      completed_at:
        setRecord.completedAt,

      reps:
        setRecord.reps,

      weight:
        setRecord.weight,

      duration_seconds:
        setRecord.durationSeconds,

      estimated_calories:
        setRecord.estimatedCalories,

      notes:
        setRecord.notes,

      set_data:
        clone(
          setRecord
        ),

      updated_at:
        nowIso()
    };
  },


  // ===================================================
  // SAVE COMPLETE SESSION SNAPSHOT
  // ===================================================

  async saveSession({
    snapshot,
    userId =
      null,
    localDate =
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

      const normalized =
        this.normalizeSnapshot(
          snapshot
        );

      const sessionPayload =
        this.makeSessionPayload({
          snapshot:
            normalized,

          userId:
            resolvedUserId,

          localDate
        });

      const sessionTable =
        this.state.tables
          .sessions;

      const {
        data:
          savedSession,
        error:
          sessionError
      } =
        await client
          .from(
            sessionTable
          )
          .upsert(
            sessionPayload,
            {
              onConflict:
                "id"
            }
          )
          .select("*")
          .single();

      if (
        sessionError
      ) {
        throw sessionError;
      }

      await this
        .saveSessionExercises({
          snapshot:
            normalized,

          userId:
            resolvedUserId
        });

      this.state.lastSavedAt =
        nowIso();

      return this
        .mapSessionRow(
          savedSession
        );
    } catch (
      error
    ) {
      this.state.lastError =
        error;

      throw error;
    }
  },


  // ===================================================
  // SAVE SESSION EXERCISES
  // ===================================================

  async saveSessionExercises({
    snapshot,
    userId =
      null
  } = {}) {
    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const normalized =
      this.normalizeSnapshot(
        snapshot
      );

    const table =
      this.state.tables
        .sessionExercises;

    const positions =
      new Map(
        normalized
          .sessionOrder
          .map(
            (
              entryId,
              index
            ) => [
              entryId,
              index
            ]
          )
      );

    const rows =
      normalized.exercises
        .map(
          exercise =>
            this
              .makeExercisePayload({
                sessionId:
                  normalized.sessionId,

                userId:
                  resolvedUserId,

                exercise,

                position:
                  positions.get(
                    exercise.entryId
                  ) ??
                  0
              })
        );

    if (
      rows.length >
      0
    ) {
      const {
        error
      } =
        await client
          .from(
            table
          )
          .upsert(
            rows,
            {
              onConflict:
                "session_id,entry_id"
            }
          );

      if (error) {
        throw error;
      }
    }

    /*
     * Remove stale session-exercise rows that no longer exist
     * in the snapshot. This primarily affects temporary
     * "added" or substitution entries that the user removes.
     */
    const activeEntryIds =
      normalized.exercises
        .map(
          exercise =>
            exercise.entryId
        );

    let staleQuery =
      client
        .from(
          table
        )
        .delete()
        .eq(
          "session_id",
          normalized.sessionId
        )
        .eq(
          "user_id",
          resolvedUserId
        );

    if (
      activeEntryIds.length >
      0
    ) {
      staleQuery =
        staleQuery.not(
          "entry_id",
          "in",
          `(${activeEntryIds.join(",")})`
        );
    }

    const {
      error:
        staleError
    } =
      await staleQuery;

    if (
      staleError
    ) {
      /*
       * This cleanup is non-critical. If the Supabase client
       * or SQL dialect rejects the dynamic NOT IN syntax,
       * the next full session save still preserves the active
       * snapshot in session_data.
       */
      console.warn(
        "[ARI Training] Could not remove stale session exercise rows.",
        staleError
      );
    }

    for (
      const exercise
      of normalized.exercises
    ) {
      await this
        .saveExerciseSets({
          sessionId:
            normalized.sessionId,

          exercise,

          userId:
            resolvedUserId
        });
    }

    return true;
  },


  // ===================================================
  // SAVE SETS
  // ===================================================

  async saveExerciseSets({
    sessionId,
    exercise,
    userId =
      null
  } = {}) {
    const resolvedSessionId =
      normalizeId(
        sessionId
      );

    if (
      !resolvedSessionId ||
      !exercise
    ) {
      return false;
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const table =
      this.state.tables
        .sets;

    const rows =
      Array.isArray(
        exercise.completedSets
      )
        ? exercise.completedSets
            .filter(
              setRecord =>
                setRecord
                  ?.setNumber
            )
            .map(
              setRecord =>
                this
                  .makeSetPayload({
                    sessionId:
                      resolvedSessionId,

                    userId:
                      resolvedUserId,

                    exerciseEntryId:
                      exercise.entryId,

                    exerciseId:
                      exercise.exerciseId,

                    setRecord
                  })
            )
        : [];

    if (
      rows.length >
      0
    ) {
      const {
        error
      } =
        await client
          .from(
            table
          )
          .upsert(
            rows,
            {
              onConflict:
                "session_id,exercise_entry_id,set_number"
            }
          );

      if (error) {
        throw error;
      }
    }

    return true;
  },


  // ===================================================
  // SAVE ONLY SESSION HEADER
  // ===================================================

  async saveSessionHeader({
    snapshot,
    userId =
      null,
    localDate =
      null
  } = {}) {
    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const payload =
      this.makeSessionPayload({
        snapshot,
        userId:
          resolvedUserId,
        localDate
      });

    const {
      data,
      error
    } =
      await client
        .from(
          this.state.tables
            .sessions
        )
        .upsert(
          payload,
          {
            onConflict:
              "id"
          }
        )
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    this.state.lastSavedAt =
      nowIso();

    return this
      .mapSessionRow(
        data
      );
  },


  // ===================================================
  // LOAD SESSION
  // ===================================================

  async loadSession({
    sessionId,
    userId =
      null,
    includeChildren =
      true
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

      if (!data) {
        return null;
      }

      const session =
        this.mapSessionRow(
          data
        );

      if (
        includeChildren
      ) {
        const children =
          await this
            .loadSessionChildren({
              sessionId:
                resolvedSessionId,

              userId:
                resolvedUserId
            });

        session.exercises =
          children.exercises;
      }

      this.state.lastLoadedAt =
        nowIso();

      return session;
    } catch (
      error
    ) {
      this.state.lastError =
        error;

      throw error;
    }
  },


  // ===================================================
  // LOAD ACTIVE SESSION
  // ===================================================

  async loadActiveSession({
    userId =
      null,
    weekKey =
      null,
    day =
      null,
    includeChildren =
      true
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

      let query =
        client
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
              "in_progress",
              "paused"
            ]
          );

      const normalizedWeekKey =
        normalizeId(
          weekKey
        );

      if (
        normalizedWeekKey
      ) {
        query =
          query.eq(
            "week_key",
            normalizedWeekKey
          );
      }

      const normalizedDay =
        normalizeDay(
          day
        );

      if (
        normalizedDay
      ) {
        query =
          query.eq(
            "weekday",
            normalizedDay
          );
      }

      const {
        data,
        error
      } =
        await query
          .order(
            "updated_at",
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

      const session =
        this.mapSessionRow(
          data
        );

      if (
        includeChildren
      ) {
        const children =
          await this
            .loadSessionChildren({
              sessionId:
                session.sessionId,

              userId:
                resolvedUserId
            });

        session.exercises =
          children.exercises;
      }

      this.state.lastLoadedAt =
        nowIso();

      return session;
    } catch (
      error
    ) {
      this.state.lastError =
        error;

      throw error;
    }
  },


  // ===================================================
  // LOAD CHILD ROWS
  // ===================================================

  async loadSessionChildren({
    sessionId,
    userId =
      null
  } = {}) {
    const resolvedSessionId =
      normalizeId(
        sessionId
      );

    if (!resolvedSessionId) {
      return {
        exercises: [],
        sets: []
      };
    }

    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const [
      exerciseResult,
      setResult
    ] =
      await Promise.all([
        client
          .from(
            this.state.tables
              .sessionExercises
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
            "position",
            {
              ascending:
                true
            }
          ),

        client
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
          )
      ]);

    if (
      exerciseResult.error
    ) {
      throw exerciseResult
        .error;
    }

    if (
      setResult.error
    ) {
      throw setResult
        .error;
    }

    const sets =
      (
        setResult.data ||
        []
      )
        .map(
          row =>
            this.mapSetRow(
              row
            )
        );

    const setsByEntry =
      new Map();

    for (
      const setRecord
      of sets
    ) {
      if (
        !setsByEntry.has(
          setRecord
            .exerciseEntryId
        )
      ) {
        setsByEntry.set(
          setRecord
            .exerciseEntryId,
          []
        );
      }

      setsByEntry
        .get(
          setRecord
            .exerciseEntryId
        )
        .push(
          setRecord
        );
    }

    const exercises =
      (
        exerciseResult.data ||
        []
      )
        .map(
          row => {
            const exercise =
              this
                .mapExerciseRow(
                  row
                );

            exercise.completedSets =
              setsByEntry.get(
                exercise.entryId
              ) ||
              [];

            return exercise;
          }
        );

    return {
      exercises,
      sets
    };
  },


  // ===================================================
  // COMPLETE SESSION
  // ===================================================

  async completeSession({
    snapshot,
    userId =
      null,
    localDate =
      null
  } = {}) {
    const normalized =
      this.normalizeSnapshot(
        snapshot
      );

    normalized.status =
      "complete";

    normalized.completedAt =
      normalized.completedAt ||
      nowIso();

    return this.saveSession({
      snapshot:
        normalized,

      userId,

      localDate
    });
  },


  // ===================================================
  // HISTORY
  // ===================================================

  async loadHistory({
    userId =
      null,
    startDate =
      null,
    endDate =
      null,
    limit =
      100,
    includeChildren =
      false
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

      let query =
        client
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
            "complete"
          );

      if (
        normalizeText(
          startDate
        )
      ) {
        query =
          query.gte(
            "local_date",
            normalizeText(
              startDate
            )
          );
      }

      if (
        normalizeText(
          endDate
        )
      ) {
        query =
          query.lt(
            "local_date",
            normalizeText(
              endDate
            )
          );
      }

      const {
        data,
        error
      } =
        await query
          .order(
            "local_date",
            {
              ascending:
                false
            }
          )
          .order(
            "completed_at",
            {
              ascending:
                false
            }
          )
          .limit(
            Math.max(
              1,
              Number(
                limit
              ) ||
              100
            )
          );

      if (error) {
        throw error;
      }

      const sessions =
        (
          data ||
          []
        )
          .map(
            row =>
              this.mapSessionRow(
                row
              )
          );

      if (
        includeChildren
      ) {
        for (
          const session
          of sessions
        ) {
          const children =
            await this
              .loadSessionChildren({
                sessionId:
                  session.sessionId,

                userId:
                  resolvedUserId
              });

          session.exercises =
            children.exercises;
        }
      }

      this.state.lastLoadedAt =
        nowIso();

      return sessions;
    } catch (
      error
    ) {
      this.state.lastError =
        error;

      throw error;
    }
  },


  async loadMonthHistory({
    monthKey =
      getMonthKey(),

    userId =
      null,

    includeChildren =
      false,

    limit =
      200
  } = {}) {
    const bounds =
      createMonthBounds(
        monthKey
      );

    if (!bounds) {
      throw new TypeError(
        "loadMonthHistory requires monthKey in YYYY-MM format."
      );
    }

    return this
      .loadHistory({
        userId,

        startDate:
          bounds.start,

        endDate:
          bounds.endExclusive,

        includeChildren,

        limit
      });
  },


  async loadDateHistory({
    date =
      getLocalDateKey(),

    userId =
      null,

    includeChildren =
      true
  } = {}) {
    const normalizedDate =
      normalizeText(
        date
      );

    if (!normalizedDate) {
      return [];
    }

    const nextDate =
      new Date(
        `${normalizedDate}T12:00:00`
      );

    nextDate.setDate(
      nextDate.getDate() +
      1
    );

    return this
      .loadHistory({
        userId,

        startDate:
          normalizedDate,

        endDate:
          getLocalDateKey(
            nextDate
          ),

        includeChildren
      });
  },


  // ===================================================
  // HISTORY SUMMARY
  // ===================================================

  summarizeSessions(
    sessions =
      []
  ) {
    const records =
      Array.isArray(
        sessions
      )
        ? sessions
        : [];

    const workoutCount =
      records.length;

    const calories =
      records.reduce(
        (
          total,
          session
        ) =>
          total +
          (
            normalizeCalories(
              session
                .estimatedCalories
            ) ||
            0
          ),
        0
      );

    const elapsedSeconds =
      records.reduce(
        (
          total,
          session
        ) =>
          total +
          (
            normalizeNonNegativeInteger(
              session
                .elapsedSeconds
            ) ||
            0
          ),
        0
      );

    const averageHeartRates =
      records
        .map(
          session =>
            normalizeHeartRate(
              session
                .averageHeartRate
            )
        )
        .filter(
          value =>
            value !==
              null
        );

    const averageHeartRate =
      averageHeartRates
        .length >
        0
        ? Math.round(
            averageHeartRates
              .reduce(
                (
                  total,
                  value
                ) =>
                  total +
                  value,
                0
              ) /
            averageHeartRates
              .length
          )
        : null;

    return {
      workoutCount,

      estimatedCalories:
        Math.round(
          calories *
          10
        ) /
        10,

      elapsedSeconds,

      averageHeartRate
    };
  },


  // ===================================================
  // DELETE SESSION
  // ===================================================

  async deleteSession({
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
       * If FK cascade is configured, deleting the session row
       * removes exercise/set children automatically. If cascade
       * is not configured, delete children explicitly first.
       */
      const [
        setDelete,
        exerciseDelete
      ] =
        await Promise.all([
          client
            .from(
              this.state.tables
                .sets
            )
            .delete()
            .eq(
              "session_id",
              resolvedSessionId
            )
            .eq(
              "user_id",
              resolvedUserId
            ),

          client
            .from(
              this.state.tables
                .sessionExercises
            )
            .delete()
            .eq(
              "session_id",
              resolvedSessionId
            )
            .eq(
              "user_id",
              resolvedUserId
            )
        ]);

      if (
        setDelete.error
      ) {
        throw setDelete
          .error;
      }

      if (
        exerciseDelete.error
      ) {
        throw exerciseDelete
          .error;
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

      this.state.lastDeletedAt =
        nowIso();

      return true;
    } catch (
      error
    ) {
      this.state.lastError =
        error;

      throw error;
    }
  },


  // ===================================================
  // MAPPERS
  // ===================================================

  mapSessionRow(
    row
  ) {
    if (
      !row ||
      typeof row !==
        "object"
    ) {
      return null;
    }

    const payload =
      row.session_data &&
      typeof row.session_data ===
        "object"
        ? row.session_data
        : {};

    return {
      schemaVersion:
        Number(
          payload.schemaVersion
        ) ||
        SCHEMA_VERSION,

      sessionId:
        normalizeId(
          row.id ||
          payload.sessionId
        ),

      userId:
        normalizeId(
          row.user_id
        ),

      planKey:
        normalizeId(
          row.plan_key ||
          payload.planKey
        ),

      weekKey:
        normalizeId(
          row.week_key ||
          payload.weekKey
        ),

      day:
        normalizeDay(
          row.weekday ||
          payload.day
        ),

      localDate:
        row.local_date ||
        payload.localDate ||
        null,

      plannedWorkoutId:
        normalizeId(
          row.planned_workout_id ||
          payload.plannedWorkoutId
        ),

      status:
        normalizeStatus(
          row.status ||
          payload.status
        ),

      startedAt:
        row.started_at ||
        payload.startedAt ||
        null,

      completedAt:
        row.completed_at ||
        payload.completedAt ||
        null,

      elapsedSeconds:
        normalizeNonNegativeInteger(
          row.elapsed_seconds ??
          payload.elapsedSeconds
        ) ||
        0,

      averageHeartRate:
        normalizeHeartRate(
          row.average_heart_rate ??
          payload.averageHeartRate
        ),

      estimatedCalories:
        normalizeCalories(
          row.estimated_calories ??
          payload.estimatedCalories
        ),

      originalOrder:
        Array.isArray(
          payload.originalOrder
        )
          ? clone(
              payload.originalOrder
            )
          : [],

      sessionOrder:
        Array.isArray(
          payload.sessionOrder
        )
          ? clone(
              payload.sessionOrder
            )
          : [],

      exercises:
        Array.isArray(
          payload.exercises
        )
          ? clone(
              payload.exercises
            )
          : [],

      notes:
        row.notes ||
        payload.notes ||
        null,

      metadata: {
        ...(
          payload.metadata &&
          typeof payload.metadata ===
            "object"
            ? clone(
                payload.metadata
              )
            : {}
        ),

        createdAt:
          row.created_at ||
          payload
            ?.metadata
            ?.createdAt ||
          null,

        updatedAt:
          row.updated_at ||
          payload
            ?.metadata
            ?.updatedAt ||
          null
      }
    };
  },


  mapExerciseRow(
    row
  ) {
    if (
      !row ||
      typeof row !==
        "object"
    ) {
      return null;
    }

    const payload =
      row.exercise_data &&
      typeof row.exercise_data ===
        "object"
        ? row.exercise_data
        : {};

    return {
      entryId:
        normalizeId(
          row.entry_id ||
          payload.entryId
        ),

      exerciseId:
        normalizeId(
          row.exercise_id ||
          payload.exerciseId
        ),

      source:
        normalizeEntrySource(
          row.source ||
          payload.source
        ),

      status:
        normalizeEntryStatus(
          row.status ||
          payload.status
        ),

      position:
        normalizeNonNegativeInteger(
          row.position ??
          payload.position
        ) ||
        0,

      originalIndex:
        normalizeNonNegativeInteger(
          row.original_position ??
          payload.originalIndex
        ),

      role:
        normalizeId(
          row.role ||
          payload.role
        ),

      substitutedFromEntryId:
        normalizeId(
          row.substituted_from_entry_id ||
          payload
            .substitutedFromEntryId
        ),

      substitutedFromExerciseId:
        normalizeId(
          row.substituted_from_exercise_id ||
          payload
            .substitutedFromExerciseId
        ),

      completionMode:
        normalizeId(
          row.completion_mode ||
          payload.completionMode
        ) ||
        "single",

      requiredSets:
        normalizePositiveInteger(
          row.required_sets ??
          payload.requiredSets
        ),

      completed:
        Boolean(
          row.completed ??
          payload.completed
        ),

      startedAt:
        row.started_at ||
        payload.startedAt ||
        null,

      completedAt:
        row.completed_at ||
        payload.completedAt ||
        null,

      skippedAt:
        row.skipped_at ||
        payload.skippedAt ||
        null,

      prescription:
        row.prescription_data &&
        typeof row.prescription_data ===
          "object"
          ? clone(
              row.prescription_data
            )
          : payload.prescription &&
            typeof payload.prescription ===
              "object"
            ? clone(
                payload.prescription
              )
            : {},

      actual:
        row.actual_data &&
        typeof row.actual_data ===
          "object"
          ? clone(
              row.actual_data
            )
          : payload.actual &&
            typeof payload.actual ===
              "object"
            ? clone(
                payload.actual
              )
            : {},

      estimatedCalories:
        normalizeCalories(
          row.estimated_calories ??
          payload.estimatedCalories
        ),

      completedSets:
        [],

      metadata:
        payload.metadata &&
        typeof payload.metadata ===
          "object"
          ? clone(
              payload.metadata
            )
          : {}
    };
  },


  mapSetRow(
    row
  ) {
    if (
      !row ||
      typeof row !==
        "object"
    ) {
      return null;
    }

    const payload =
      row.set_data &&
      typeof row.set_data ===
        "object"
        ? row.set_data
        : {};

    return {
      setId:
        normalizeId(
          row.id
        ),

      sessionId:
        normalizeId(
          row.session_id
        ),

      exerciseEntryId:
        normalizeId(
          row.exercise_entry_id
        ),

      exerciseId:
        normalizeId(
          row.exercise_id
        ),

      setNumber:
        normalizePositiveInteger(
          row.set_number ??
          payload.setNumber
        ),

      completed:
        Boolean(
          row.completed ??
          payload.completed
        ),

      completedAt:
        row.completed_at ||
        payload.completedAt ||
        null,

      reps:
        normalizeNonNegativeInteger(
          row.reps ??
          payload.reps
        ),

      weight:
        normalizeNonNegativeNumber(
          row.weight ??
          payload.weight
        ),

      durationSeconds:
        normalizeNonNegativeNumber(
          row.duration_seconds ??
          payload.durationSeconds
        ),

      estimatedCalories:
        normalizeCalories(
          row.estimated_calories ??
          payload.estimatedCalories
        ),

      notes:
        row.notes ||
        payload.notes ||
        null
    };
  },


  // ===================================================
  // DESTROY
  // ===================================================

  destroy() {
    this.state.client =
      null;

    this.state.configured =
      false;

    this.state.tables = {
      ...DEFAULT_TABLES
    };

    this.state.lastLoadedAt =
      null;

    this.state.lastSavedAt =
      null;

    this.state.lastDeletedAt =
      null;

    this.state.lastError =
      null;

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

      schemaVersion:
        SCHEMA_VERSION,

      configured:
        Boolean(
          this.findClient()
        ),

      tables: {
        ...this.state.tables
      },

      lastLoadedAt:
        this.state.lastLoadedAt,

      lastSavedAt:
        this.state.lastSavedAt,

      lastDeletedAt:
        this.state.lastDeletedAt,

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
        saveSession:
          typeof this
            .saveSession ===
            "function",

        loadSession:
          typeof this
            .loadSession ===
            "function",

        loadActiveSession:
          typeof this
            .loadActiveSession ===
            "function",

        completeSession:
          typeof this
            .completeSession ===
            "function",

        loadHistory:
          typeof this
            .loadHistory ===
            "function",

        loadMonthHistory:
          typeof this
            .loadMonthHistory ===
            "function",

        loadDateHistory:
          typeof this
            .loadDateHistory ===
            "function",

        deleteSession:
          typeof this
            .deleteSession ===
            "function"
      }
    };
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
  SCHEMA_VERSION,
  SOURCE,

  DEFAULT_TABLES,

  AriTrainingWorkoutSessionApi
};

export default
  AriTrainingWorkoutSessionApi;
