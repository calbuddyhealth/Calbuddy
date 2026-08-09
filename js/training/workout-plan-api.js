// =====================================================
// ARI REBIRTH
// File: js/training/workout-plan-api.js
// Version: 3.0.0
// Purpose:
//   Supabase persistence boundary for ARI Training
//   calendar-specific workout plans.
//
// V3.0.0:
//   - Matches workout-plan-store.js V3.
//   - Persists the FULL date-specific calendar plan state.
//   - Preserves selectedWeekKey and weeks{}.
//   - Keeps one active plan row per authenticated user.
//   - Uses plan_data as the authoritative V3 payload.
//   - Continues writing week_data for backward compatibility.
//   - Can load legacy V1/V2 rows and convert them into a
//     V3-compatible current-week state.
//   - Does NOT create a second Supabase client.
//   - Does NOT persist live workout/session progress.
// =====================================================

const VERSION = "3.0.0";
const SCHEMA_VERSION = 3;
const SOURCE = "js/training/workout-plan-api";

const DEFAULT_TABLES = Object.freeze({
  workoutPlans: "ari_training_workout_plans"
});

const DAYS = Object.freeze([
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
]);

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeId(value) {
  return normalizeText(value) || null;
}

function normalizeInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function looksLikeSupabaseClient(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.from === "function"
  );
}

function clone(value) {
  if (value === undefined) return undefined;

  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // Fall through.
    }
  }

  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function uniqueIds(values) {
  if (!Array.isArray(values)) return [];

  return [
    ...new Set(
      values
        .map(normalizeId)
        .filter(Boolean)
    )
  ];
}

function toLocalDateOnly(value = new Date()) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;

    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );
  }

  const text = normalizeText(value);
  if (!text) return null;

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);

    const date = new Date(year, month, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );
}

function formatDateKey(value = new Date()) {
  const date = toLocalDateOnly(value);
  if (!date) return null;

  return (
    `${date.getFullYear()}-` +
    `${pad2(date.getMonth() + 1)}-` +
    `${pad2(date.getDate())}`
  );
}

function addDays(value, amount) {
  const date = toLocalDateOnly(value);
  if (!date) return null;

  const next = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  next.setDate(next.getDate() + Number(amount || 0));
  return next;
}

function getWeekKey(value = new Date()) {
  const date = toLocalDateOnly(value);
  if (!date) return null;

  const sunday = addDays(date, -date.getDay());
  return formatDateKey(sunday);
}

function getDayDateForWeek(weekKey, day) {
  const index = DAYS.indexOf(
    normalizeText(day).toLowerCase()
  );

  const start = toLocalDateOnly(weekKey);

  if (index < 0 || !start) return null;

  return formatDateKey(
    addDays(start, index)
  );
}

function normalizeSelectedWeekKey(value) {
  return getWeekKey(value) || getWeekKey(new Date());
}

function getSelectedWeek(plan) {
  if (!plan || typeof plan !== "object") return null;

  const selectedWeekKey = normalizeSelectedWeekKey(
    plan.selectedWeekKey
  );

  return plan.weeks?.[selectedWeekKey] || null;
}

function makeOffDay(day, date) {
  return {
    day,
    label: day.charAt(0).toUpperCase() + day.slice(1),
    date,
    type: "off",
    focusId: "off_day",
    title: "Off Day",
    goal: null,
    sport: null,
    workoutId: null,
    estimatedDurationMinutes: null,
    exercises: [],
    metadata: {}
  };
}

function makeEmptyWeek(weekKey) {
  const normalizedWeekKey = normalizeSelectedWeekKey(weekKey);
  const days = {};

  for (const day of DAYS) {
    days[day] = makeOffDay(
      day,
      getDayDateForWeek(normalizedWeekKey, day)
    );
  }

  return {
    weekKey: normalizedWeekKey,
    startDate: normalizedWeekKey,
    endDate: formatDateKey(
      addDays(normalizedWeekKey, 6)
    ),
    primaryGoalId: null,
    secondaryGoalIds: [],
    name: "My Weekly Plan",
    days,
    metadata: {
      createdAt: null,
      updatedAt: null,
      sourceTemplateId: null,
      repeatedFromWeekKey: null,
      copiedFromWeekKey: null,
      builderVersion: null
    }
  };
}

const AriTrainingWorkoutPlanApi = {
  version: VERSION,
  schemaVersion: SCHEMA_VERSION,
  source: SOURCE,

  state: {
    client: null,
    configured: false,
    tables: {
      ...DEFAULT_TABLES
    },
    lastLoadedAt: null,
    lastSavedAt: null,
    lastDeletedAt: null,
    lastError: null
  },

  configure({
    client = null,
    tables = null
  } = {}) {
    if (
      client &&
      !looksLikeSupabaseClient(client)
    ) {
      throw new TypeError(
        "AriTrainingWorkoutPlanApi.configure received an invalid Supabase client."
      );
    }

    if (client) {
      this.state.client = client;
    }

    if (
      tables &&
      typeof tables === "object"
    ) {
      this.state.tables = {
        ...this.state.tables,
        ...tables
      };
    }

    this.state.configured = Boolean(
      this.findClient()
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
      globalThis.AriTrainingConfig?.supabaseClient,
      globalThis.AriTrainingConfig?.client,
      globalThis.Ari?.supabaseClient,
      globalThis.Ari?.supabase,
      globalThis.ARI?.supabaseClient,
      globalThis.ARI?.supabase,
      globalThis.supabaseClient,
      globalThis.calbuddySupabase
    ];

    for (const candidate of candidates) {
      if (looksLikeSupabaseClient(candidate)) {
        this.state.client = candidate;
        this.state.configured = true;
        return candidate;
      }
    }

    return null;
  },

  requireClient() {
    const client = this.findClient();

    if (!client) {
      throw new Error(
        "ARI Training workout plan API has no Supabase client."
      );
    }

    return client;
  },

  async getAuthenticatedUser() {
    const client = this.requireClient();

    if (
      !client.auth ||
      typeof client.auth.getUser !== "function"
    ) {
      throw new Error(
        "Supabase auth.getUser() is unavailable."
      );
    }

    const { data, error } =
      await client.auth.getUser();

    if (error) throw error;

    const user = data?.user || null;

    if (!user?.id) {
      throw new Error(
        "No authenticated user is available."
      );
    }

    return user;
  },

  async resolveUserId(userId = null) {
    const explicit = normalizeId(userId);
    if (explicit) return explicit;

    const user =
      await this.getAuthenticatedUser();

    return normalizeId(user.id);
  },

  normalizePlanForSave(plan) {
    if (
      !plan ||
      typeof plan !== "object"
    ) {
      throw new TypeError(
        "A workout plan object is required."
      );
    }

    const selectedWeekKey =
      normalizeSelectedWeekKey(
        plan.selectedWeekKey || new Date()
      );

    const weeks =
      plan.weeks &&
      typeof plan.weeks === "object" &&
      !Array.isArray(plan.weeks)
        ? clone(plan.weeks)
        : {};

    return {
      schemaVersion: SCHEMA_VERSION,
      version: normalizeText(plan.version) || "3.0.0",
      source:
        normalizeText(plan.source) ||
        "js/training/workout-plan-store",
      planId: normalizeId(plan.planId),
      selectedWeekKey,
      weeks,
      metadata: {
        ...(
          plan.metadata &&
          typeof plan.metadata === "object"
            ? clone(plan.metadata)
            : {}
        ),
        schemaVersion: SCHEMA_VERSION,
        apiVersion: VERSION
      }
    };
  },

  normalizeV3LoadedPlan(payload, row = null) {
    if (
      !payload ||
      typeof payload !== "object"
    ) {
      return null;
    }

    const selectedWeekKey =
      normalizeSelectedWeekKey(
        payload.selectedWeekKey ||
        payload.metadata?.selectedWeekKey ||
        row?.updated_at ||
        new Date()
      );

    const weeks =
      payload.weeks &&
      typeof payload.weeks === "object" &&
      !Array.isArray(payload.weeks)
        ? clone(payload.weeks)
        : {};

    return {
      schemaVersion: SCHEMA_VERSION,
      version: normalizeText(payload.version) || "3.0.0",
      source:
        normalizeText(payload.source) ||
        "js/training/workout-plan-store",
      planId: normalizeId(
        row?.id || payload.planId
      ),
      selectedWeekKey,
      weeks,
      metadata: {
        ...(
          payload.metadata &&
          typeof payload.metadata === "object"
            ? clone(payload.metadata)
            : {}
        ),
        loadedByApiVersion: VERSION,
        schemaVersion: SCHEMA_VERSION,
        createdAt:
          row?.created_at ||
          payload.metadata?.createdAt ||
          null,
        updatedAt:
          row?.updated_at ||
          payload.metadata?.updatedAt ||
          null
      }
    };
  },

  migrateLegacyRowToV3(row) {
    if (
      !row ||
      typeof row !== "object"
    ) {
      return null;
    }

    const payload =
      row.plan_data &&
      typeof row.plan_data === "object"
        ? row.plan_data
        : {};

    const selectedWeekKey =
      normalizeSelectedWeekKey(
        payload.selectedWeekKey ||
        payload.weekKey ||
        row.updated_at ||
        new Date()
      );

    const week =
      makeEmptyWeek(
        selectedWeekKey
      );

    week.name =
      normalizeText(
        row.name || payload.name
      ) || "My Weekly Plan";

    week.primaryGoalId =
      normalizeId(
        row.primary_goal_id ||
        payload.primaryGoalId
      );

    week.secondaryGoalIds =
      Array.isArray(
        row.secondary_goal_ids
      )
        ? uniqueIds(
            row.secondary_goal_ids
          )
        : uniqueIds(
            payload.secondaryGoalIds
          );

    const legacyWeek =
      row.week_data &&
      typeof row.week_data === "object"
        ? row.week_data
        : (
            payload.week &&
            typeof payload.week === "object"
              ? payload.week
              : {}
          );

    const legacyDays =
      legacyWeek.days &&
      typeof legacyWeek.days === "object"
        ? legacyWeek.days
        : legacyWeek;

    for (const day of DAYS) {
      const incoming =
        legacyDays?.[day];

      if (
        !incoming ||
        typeof incoming !== "object"
      ) {
        continue;
      }

      week.days[day] = {
        ...clone(incoming),
        day,
        date:
          getDayDateForWeek(
            selectedWeekKey,
            day
          )
      };
    }

    week.metadata = {
      ...week.metadata,
      sourceTemplateId:
        normalizeId(
          row.source_template_id ||
          payload.metadata?.sourceTemplateId
        ),
      createdAt:
        row.created_at ||
        payload.metadata?.createdAt ||
        null,
      updatedAt:
        row.updated_at ||
        payload.metadata?.updatedAt ||
        null,
      migratedFromRemoteSchema:
        normalizeInteger(
          payload.schemaVersion
        ) || 1,
      migratedAt: nowIso()
    };

    return {
      schemaVersion: SCHEMA_VERSION,
      version: "3.0.0",
      source:
        "js/training/workout-plan-store",
      planId: normalizeId(
        row.id || payload.planId
      ),
      selectedWeekKey,
      weeks: {
        [selectedWeekKey]: week
      },
      metadata: {
        createdAt:
          row.created_at ||
          payload.metadata?.createdAt ||
          null,
        updatedAt:
          row.updated_at ||
          payload.metadata?.updatedAt ||
          null,
        migratedFrom:
          `remote_schema_v${
            normalizeInteger(
              payload.schemaVersion
            ) || 1
          }`,
        migratedAt: nowIso(),
        loadedByApiVersion: VERSION
      }
    };
  },

  mapRowToPlan(row) {
    if (
      !row ||
      typeof row !== "object"
    ) {
      return null;
    }

    const payload =
      row.plan_data &&
      typeof row.plan_data === "object"
        ? row.plan_data
        : {};

    const payloadSchemaVersion =
      normalizeInteger(
        payload.schemaVersion ??
        payload.metadata?.schemaVersion
      );

    const isV3Payload =
      payloadSchemaVersion >= 3 &&
      payload.weeks &&
      typeof payload.weeks === "object";

    if (isV3Payload) {
      return this.normalizeV3LoadedPlan(
        payload,
        row
      );
    }

    return this.migrateLegacyRowToV3(
      row
    );
  },

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

  async loadPlan({
    userId = null
  } = {}) {
    this.state.lastError = null;

    try {
      const client = this.requireClient();
      const resolvedUserId =
        await this.resolveUserId(userId);
      const table =
        this.state.tables.workoutPlans;

      const { data, error } =
        await client
          .from(table)
          .select(
            this.getSelectFields()
          )
          .eq(
            "user_id",
            resolvedUserId
          )
          .order(
            "updated_at",
            {
              ascending: false
            }
          )
          .limit(1)
          .maybeSingle();

      if (error) throw error;

      this.state.lastLoadedAt =
        nowIso();

      if (!data) return null;

      return this.mapRowToPlan(data);
    } catch (error) {
      this.state.lastError = error;
      throw error;
    }
  },

  async savePlan({
    plan,
    userId = null
  } = {}) {
    this.state.lastError = null;

    try {
      const client = this.requireClient();
      const resolvedUserId =
        await this.resolveUserId(userId);
      const normalizedPlan =
        this.normalizePlanForSave(plan);
      const selectedWeek =
        getSelectedWeek(normalizedPlan);
      const now = nowIso();
      const table =
        this.state.tables.workoutPlans;

      const planPayload = {
        ...normalizedPlan,
        metadata: {
          ...normalizedPlan.metadata,
          updatedAt: now,
          schemaVersion:
            SCHEMA_VERSION,
          apiVersion: VERSION
        }
      };

      const payload = {
        user_id: resolvedUserId,

        name:
          normalizeText(
            selectedWeek?.name
          ) || "My Weekly Plan",

        primary_goal_id:
          normalizeId(
            selectedWeek?.primaryGoalId
          ),

        secondary_goal_ids:
          uniqueIds(
            selectedWeek?.secondaryGoalIds
          ),

        source_template_id:
          normalizeId(
            selectedWeek
              ?.metadata
              ?.sourceTemplateId
          ),

        week_data:
          selectedWeek?.days
            ? clone(
                selectedWeek.days
              )
            : {},

        plan_data:
          planPayload,

        updated_at:
          now
      };

      let query;

      if (normalizedPlan.planId) {
        query =
          client
            .from(table)
            .update(payload)
            .eq(
              "id",
              normalizedPlan.planId
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
                onConflict: "user_id"
              }
            );
      }

      const { data, error } =
        await query
          .select(
            this.getSelectFields()
          )
          .single();

      if (error) throw error;

      this.state.lastSavedAt =
        nowIso();

      return this.mapRowToPlan(data);
    } catch (error) {
      this.state.lastError = error;
      throw error;
    }
  },

  async deletePlan({
    planId = null,
    userId = null
  } = {}) {
    this.state.lastError = null;

    try {
      const client = this.requireClient();
      const resolvedUserId =
        await this.resolveUserId(userId);
      const table =
        this.state.tables.workoutPlans;

      let query =
        client
          .from(table)
          .delete()
          .eq(
            "user_id",
            resolvedUserId
          );

      const resolvedPlanId =
        normalizeId(planId);

      if (resolvedPlanId) {
        query = query.eq(
          "id",
          resolvedPlanId
        );
      }

      const { error } =
        await query;

      if (error) throw error;

      this.state.lastDeletedAt =
        nowIso();

      return true;
    } catch (error) {
      this.state.lastError = error;
      throw error;
    }
  },

  async planExists({
    userId = null
  } = {}) {
    this.state.lastError = null;

    try {
      const client = this.requireClient();
      const resolvedUserId =
        await this.resolveUserId(userId);
      const table =
        this.state.tables.workoutPlans;

      const { data, error } =
        await client
          .from(table)
          .select("id")
          .eq(
            "user_id",
            resolvedUserId
          )
          .limit(1)
          .maybeSingle();

      if (error) throw error;

      return Boolean(data?.id);
    } catch (error) {
      this.state.lastError = error;
      throw error;
    }
  },

  async getPlanRow({
    userId = null
  } = {}) {
    this.state.lastError = null;

    try {
      const client = this.requireClient();
      const resolvedUserId =
        await this.resolveUserId(userId);
      const table =
        this.state.tables.workoutPlans;

      const { data, error } =
        await client
          .from(table)
          .select(
            this.getSelectFields()
          )
          .eq(
            "user_id",
            resolvedUserId
          )
          .order(
            "updated_at",
            {
              ascending: false
            }
          )
          .limit(1)
          .maybeSingle();

      if (error) throw error;

      return data || null;
    } catch (error) {
      this.state.lastError = error;
      throw error;
    }
  },

  getPlanSchemaInfo(plan) {
    if (
      !plan ||
      typeof plan !== "object"
    ) {
      return {
        schemaVersion: null,
        current: false,
        legacy: false,
        calendarWeeks: false
      };
    }

    const schemaVersion =
      normalizeInteger(
        plan.schemaVersion ??
        plan.metadata?.schemaVersion
      );

    const calendarWeeks =
      Boolean(
        plan.weeks &&
        typeof plan.weeks === "object"
      );

    return {
      schemaVersion,
      current:
        schemaVersion ===
          SCHEMA_VERSION &&
        calendarWeeks,
      legacy:
        schemaVersion !== null &&
        schemaVersion <
          SCHEMA_VERSION,
      calendarWeeks
    };
  },

  destroy() {
    this.state.client = null;
    this.state.configured = false;
    this.state.tables = {
      ...DEFAULT_TABLES
    };
    this.state.lastLoadedAt = null;
    this.state.lastSavedAt = null;
    this.state.lastDeletedAt = null;
    this.state.lastError = null;
    return true;
  },

  getDiagnostics() {
    const client = this.findClient();

    return {
      source: SOURCE,
      version: VERSION,
      schemaVersion:
        SCHEMA_VERSION,
      configured:
        Boolean(client),
      table:
        this.state.tables
          .workoutPlans,
      persistenceModel: {
        authoritativeField:
          "plan_data",
        compatibilityField:
          "week_data",
        storesSelectedWeekKey:
          true,
        storesAllCalendarWeeks:
          true,
        legacyRowMigration:
          true
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
                this.state.lastError
                  ?.message ||
                String(
                  this.state.lastError
                )
            }
          : null,
      methods: {
        loadPlan:
          typeof this.loadPlan ===
          "function",
        savePlan:
          typeof this.savePlan ===
          "function",
        deletePlan:
          typeof this.deletePlan ===
          "function",
        planExists:
          typeof this.planExists ===
          "function",
        getPlanRow:
          typeof this.getPlanRow ===
          "function",
        normalizePlanForSave:
          typeof this
            .normalizePlanForSave ===
          "function",
        normalizeV3LoadedPlan:
          typeof this
            .normalizeV3LoadedPlan ===
          "function",
        migrateLegacyRowToV3:
          typeof this
            .migrateLegacyRowToV3 ===
          "function",
        mapRowToPlan:
          typeof this.mapRowToPlan ===
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
    globalThis.Ari || {};

  Ari.training =
    Ari.training || {};

  Ari.training.workoutPlanApi =
    AriTrainingWorkoutPlanApi;

  globalThis.Ari = Ari;
}

export {
  VERSION,
  SCHEMA_VERSION,
  SOURCE,
  DEFAULT_TABLES,
  DAYS,
  formatDateKey,
  getWeekKey,
  getDayDateForWeek,
  AriTrainingWorkoutPlanApi
};

export default
  AriTrainingWorkoutPlanApi;
