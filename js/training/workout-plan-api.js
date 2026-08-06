// =====================================================
// ARI REBIRTH
// File: js/training/workout-plan-api.js
// Version: 1.0.0
// Purpose:
//   Supabase persistence boundary for ARI Training weekly
//   workout plans.
//
// Design:
//   - Keeps database access separate from workout-plan-store.js.
//   - Saves one active weekly plan per authenticated user.
//   - Stores the complete Monday-Sunday plan as JSON.
//   - Supports load, save/upsert, delete, and diagnostics.
//   - Does NOT create a second Supabase client.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/workout-plan-api";

const DEFAULT_TABLES = Object.freeze({
  workoutPlans:
    "ari_training_workout_plans"
});

function normalizeText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim();
}

function normalizeId(value) {
  const text =
    normalizeText(value);

  return text || null;
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

function clone(value) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}

const AriTrainingWorkoutPlanApi = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    client:
      null,

    configured:
      false,

    tables: {
      ...DEFAULT_TABLES
    }
  },

  configure({
    client = null,
    tables = null
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
        this.state.client
      );

    return this.getDiagnostics();
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
        .supabaseClient
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
    userId = null
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

    return {
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
        Array.isArray(
          plan.secondaryGoalIds
        )
          ? [
              ...new Set(
                plan
                  .secondaryGoalIds
                  .map(
                    normalizeId
                  )
                  .filter(Boolean)
              )
            ]
          : [],

      week:
        plan.week &&
        typeof plan.week ===
          "object"
          ? clone(
              plan.week
            )
          : {},

      metadata:
        plan.metadata &&
        typeof plan.metadata ===
          "object"
          ? clone(
              plan.metadata
            )
          : {}
    };
  },

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
      row.plan_data &&
      typeof row.plan_data ===
        "object"
        ? row.plan_data
        : {};

    return {
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
        row.week_data &&
        typeof row.week_data ===
          "object"
          ? clone(
              row.week_data
            )
          : payload.week &&
            typeof payload.week ===
              "object"
            ? clone(
                payload.week
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
          null
      }
    };
  },

  async loadPlan({
    userId = null
  } = {}) {
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
        .from(table)
        .select(
          [
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
          ].join(",")
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
        .limit(1)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return this
      .mapRowToPlan(
        data
      );
  },

  async savePlan({
    plan,
    userId = null
  } = {}) {
    const client =
      this.requireClient();

    const resolvedUserId =
      await this
        .resolveUserId(
          userId
        );

    const normalizedPlan =
      this.normalizePlanForSave(
        plan
      );

    const now =
      new Date()
        .toISOString();

    const table =
      this.state.tables
        .workoutPlans;

    const payload = {
      user_id:
        resolvedUserId,

      name:
        normalizedPlan.name,

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
        normalizedPlan.week,

      plan_data: {
        ...normalizedPlan,

        metadata: {
          ...normalizedPlan.metadata,

          updatedAt:
            now
        }
      },

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
          .from(table)
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
          .from(table)
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
          [
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
          ].join(",")
        )
        .single();

    if (error) {
      throw error;
    }

    return this
      .mapRowToPlan(
        data
      );
  },

  async deletePlan({
    planId = null,
    userId = null
  } = {}) {
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
        .from(table)
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

    return true;
  },

  async planExists({
    userId = null
  } = {}) {
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
        .from(table)
        .select(
          "id"
        )
        .eq(
          "user_id",
          resolvedUserId
        )
        .limit(1)
        .maybeSingle();

    if (error) {
      throw error;
    }

    return Boolean(
      data?.id
    );
  },

  destroy() {
    this.state.client =
      null;

    this.state.configured =
      false;

    this.state.tables = {
      ...DEFAULT_TABLES
    };

    return true;
  },

  getDiagnostics() {
    return {
      source:
        SOURCE,

      version:
        VERSION,

      configured:
        Boolean(
          this.state.client
        ),

      table:
        this.state.tables
          .workoutPlans,

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
            "function"
      }
    };
  }
};

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

export {
  VERSION,
  SOURCE,
  DEFAULT_TABLES,
  AriTrainingWorkoutPlanApi
};

export default AriTrainingWorkoutPlanApi;
