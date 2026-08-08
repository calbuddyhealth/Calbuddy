// =====================================================
// ARI REBIRTH
// File: js/training/workout-plan-api.js
// Version: 2.0.0
// Purpose:
//   Supabase persistence boundary for ARI Training weekly
//   workout plans.
//
// V2.0.0:
//   - Preserves richer V2 plan/day/exercise records.
//   - Stores schemaVersion with the plan payload.
//   - Remains backward-compatible with V1 rows.
//   - Continues to keep database access separate from
//     workout-plan-store.js.
//   - Saves one active weekly plan per authenticated user.
//   - Stores the complete Monday-Sunday plan as JSON.
//   - Supports load, save/upsert, delete, existence checks,
//     diagnostics, and plan normalization.
//   - Does NOT create a second Supabase client.
//   - Does NOT persist live workout/session progress.
//
// Important separation:
//   workout-plan-api.js
//     = permanent weekly-plan persistence.
//
//   workout-progress/session API
//     = live/completed workout execution persistence.
// =====================================================

const VERSION =
  "2.0.0";

const SCHEMA_VERSION =
  2;

const SOURCE =
  "js/training/workout-plan-api";


const DEFAULT_TABLES =
  Object.freeze({
    workoutPlans:
      "ari_training_workout_plans"
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


function normalizeInteger(
  value
) {
  const number =
    Number(
      value
    );

  return Number.isInteger(
    number
  )
    ? number
    : null;
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


function nowIso() {
  return new Date()
    .toISOString();
}


function uniqueIds(
  values
) {
  if (
    !Array.isArray(
      values
    )
  ) {
    return [];
  }

  return [
    ...new Set(
      values
        .map(
          normalizeId
        )
        .filter(Boolean)
    )
  ];
}


// =====================================================
// API OBJECT
// =====================================================

const AriTrainingWorkoutPlanApi = {
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
        "AriTrainingWorkoutPlanApi.configure received an invalid Supabase client."
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
        "ARI Training workout plan API has no Supabase client."
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
  // PLAN NORMALIZATION
  // ===================================================

  normalizePlanForSave(
    plan
  ) {
    if (
      !plan ||
      typeof plan !==
        "object"
    ) {
      throw new TypeError(
        "A workout plan object is required."
      );
    }

    const schemaVersion =
      normalizeInteger(
        plan.schemaVersion
      ) ||
      SCHEMA_VERSION;

    const normalized = {
      schemaVersion,

      planId:
        normalizeId(
          plan.planId
        ),

      name:
        normalizeText(
          plan.name
        ) ||
        "My Weekly Plan",

      primaryGoalId:
        normalizeId(
          plan.primaryGoalId
        ),

      secondaryGoalIds:
        uniqueIds(
          plan.secondaryGoalIds
        ),

      week:
        (
          plan.week &&
          typeof plan.week ===
            "object"
        )
          ? clone(
              plan.week
            )
          : {},

      metadata:
        (
          plan.metadata &&
          typeof plan.metadata ===
            "object"
        )
          ? clone(
              plan.metadata
            )
          : {}
    };

    normalized.metadata = {
      ...normalized.metadata,

      schemaVersion,

      apiVersion:
        VERSION
    };

    return normalized;
  },


  // ===================================================
  // ROW MAPPING
  // ===================================================

  mapRowToPlan(
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
      (
        row.plan_data &&
        typeof row.plan_data ===
          "object"
      )
        ? row.plan_data
        : {};

    const rowWeek =
      (
        row.week_data &&
        typeof row.week_data ===
          "object"
      )
        ? row.week_data
        : null;

    const payloadWeek =
      (
        payload.week &&
        typeof payload.week ===
          "object"
      )
        ? payload.week
        : null;

    const schemaVersion =
      normalizeInteger(
        payload.schemaVersion ??
        payload
          ?.metadata
          ?.schemaVersion ??
        row.schema_version
      ) ||
      1;

    const mapped = {
      schemaVersion,

      planId:
        normalizeId(
          row.id ||
          payload.planId
        ),

      name:
        normalizeText(
          row.name ||
          payload.name
        ) ||
        "My Weekly Plan",

      primaryGoalId:
        normalizeId(
          row.primary_goal_id ||
          payload.primaryGoalId
        ),

      secondaryGoalIds:
        Array.isArray(
          row.secondary_goal_ids
        )
          ? clone(
              row.secondary_goal_ids
            )
          : Array.isArray(
              payload.secondaryGoalIds
            )
            ? clone(
                payload.secondaryGoalIds
              )
            : [],

      week:
        rowWeek
          ? clone(
              rowWeek
            )
          : payloadWeek
            ? clone(
                payloadWeek
              )
            : {},

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

        sourceTemplateId:
          normalizeId(
            row.source_template_id ||
            payload
              ?.metadata
              ?.sourceTemplateId
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
          null,

        schemaVersion,

        loadedByApiVersion:
          VERSION
      }
    };

    return mapped;
  },


  // ===================================================
  // SELECT FIELDS
  // ===================================================

  getSelectFields() {
    return [
      "id",
      "user_id",
      "name",
      "primary_goal_id",
      "secondary_goal_ids",
      "source_template_id",
      "week_data",
      "plan_data",
      "created_at",
      "updated_at"
    ].join(",");
  },


  // ===================================================
  // LOAD
  // ===================================================

  async loadPlan({
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

      const table =
        this.state.tables
          .workoutPlans;

      const {
        data,
        error
      } =
        await client
          .from(
            table
          )
          .select(
            this
              .getSelectFields()
          )
          .eq(
            "user_id",
            resolvedUserId
          )
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

      this.state.lastLoadedAt =
        nowIso();

      if (!data) {
        return null;
      }

      return this
        .mapRowToPlan(
          data
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
  // SAVE / UPSERT
  // ===================================================

  async savePlan({
    plan,
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

      const normalizedPlan =
        this
          .normalizePlanForSave(
            plan
          );

      const now =
        nowIso();

      const table =
        this.state.tables
          .workoutPlans;

      const planPayload = {
        ...normalizedPlan,

        metadata: {
          ...normalizedPlan
            .metadata,

          updatedAt:
            now,

          schemaVersion:
            normalizedPlan
              .schemaVersion,

          apiVersion:
            VERSION
        }
      };

      const payload = {
        user_id:
          resolvedUserId,

        name:
          normalizedPlan
            .name,

        primary_goal_id:
          normalizedPlan
            .primaryGoalId,

        secondary_goal_ids:
          normalizedPlan
            .secondaryGoalIds,

        source_template_id:
          normalizeId(
            normalizedPlan
              .metadata
              ?.sourceTemplateId
          ),

        week_data:
          normalizedPlan
            .week,

        plan_data:
          planPayload,

        updated_at:
          now
      };

      let query;

      if (
        normalizedPlan
          .planId
      ) {
        query =
          client
            .from(
              table
            )
            .update(
              payload
            )
            .eq(
              "id",
              normalizedPlan
                .planId
            )
            .eq(
              "user_id",
              resolvedUserId
            );
      } else {
        query =
          client
            .from(
              table
            )
            .upsert(
              payload,
              {
                onConflict:
                  "user_id"
              }
            );
      }

      const {
        data,
        error
      } =
        await query
          .select(
            this
              .getSelectFields()
          )
          .single();

      if (error) {
        throw error;
      }

      this.state.lastSavedAt =
        nowIso();

      return this
        .mapRowToPlan(
          data
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
  // DELETE
  // ===================================================

  async deletePlan({
    planId =
      null,

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

      const table =
        this.state.tables
          .workoutPlans;

      let query =
        client
          .from(
            table
          )
          .delete()
          .eq(
            "user_id",
            resolvedUserId
          );

      const resolvedPlanId =
        normalizeId(
          planId
        );

      if (resolvedPlanId) {
        query =
          query.eq(
            "id",
            resolvedPlanId
          );
      }

      const {
        error
      } =
        await query;

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
  // EXISTS
  // ===================================================

  async planExists({
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

      const table =
        this.state.tables
          .workoutPlans;

      const {
        data,
        error
      } =
        await client
          .from(
            table
          )
          .select(
            "id"
          )
          .eq(
            "user_id",
            resolvedUserId
          )
          .limit(
            1
          )
          .maybeSingle();

      if (error) {
        throw error;
      }

      return Boolean(
        data?.id
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
  // CURRENT ROW
  // ===================================================

  async getPlanRow({
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

      const table =
        this.state.tables
          .workoutPlans;

      const {
        data,
        error
      } =
        await client
          .from(
            table
          )
          .select(
            this
              .getSelectFields()
          )
          .eq(
            "user_id",
            resolvedUserId
          )
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


  // ===================================================
  // SCHEMA INFO
  // ===================================================

  getPlanSchemaInfo(
    plan
  ) {
    if (
      !plan ||
      typeof plan !==
        "object"
    ) {
      return {
        schemaVersion:
          null,

        current:
          false,

        legacy:
          false
      };
    }

    const schemaVersion =
      normalizeInteger(
        plan.schemaVersion ??
        plan
          ?.metadata
          ?.schemaVersion
      );

    return {
      schemaVersion,

      current:
        schemaVersion ===
          SCHEMA_VERSION,

      legacy:
        schemaVersion !==
          null &&
        schemaVersion <
          SCHEMA_VERSION
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
    const client =
      this.findClient();

    return {
      source:
        SOURCE,

      version:
        VERSION,

      schemaVersion:
        SCHEMA_VERSION,

      configured:
        Boolean(
          client
        ),

      table:
        this.state.tables
          .workoutPlans,

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
        loadPlan:
          typeof this
            .loadPlan ===
            "function",

        savePlan:
          typeof this
            .savePlan ===
            "function",

        deletePlan:
          typeof this
            .deletePlan ===
            "function",

        planExists:
          typeof this
            .planExists ===
            "function",

        getPlanRow:
          typeof this
            .getPlanRow ===
            "function",

        normalizePlanForSave:
          typeof this
            .normalizePlanForSave ===
            "function",

        mapRowToPlan:
          typeof this
            .mapRowToPlan ===
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

  Ari.training.workoutPlanApi =
    AriTrainingWorkoutPlanApi;

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
  AriTrainingWorkoutPlanApi
};

export default
  AriTrainingWorkoutPlanApi;
