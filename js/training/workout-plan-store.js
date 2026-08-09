// =====================================================
// ARI REBIRTH
// File: js/training/workout-plan-store.js
// Version: 3.0.0
// Purpose:
//   Persistent calendar-based workout planning store for
//   ARI Training.
//
// V3.0.0 MAJOR ARCHITECTURE CHANGE:
//
//   OLD V2 MODEL:
//     week.monday
//     week.tuesday
//     week.wednesday
//     ...
//
//   Problem:
//     A workout assigned to "Monday" behaved like a
//     permanently recurring Monday workout.
//
//   NEW V3 MODEL:
//     scheduledDays["2026-08-09"]
//     scheduledDays["2026-08-10"]
//     scheduledDays["2026-08-11"]
//     ...
//
//   Each planned workout belongs to an ACTUAL CALENDAR DATE.
//
// Calendar model:
//   - Weeks run Sunday -> Saturday.
//   - Future weeks are independent.
//   - An unscheduled date behaves as an Off Day.
//   - Unscheduled dates are NOT unnecessarily persisted.
//   - Users may plan future dates independently.
//   - Templates apply to a selected calendar week only.
//   - A template never becomes a permanent repeating week.
//   - Entire weeks can be cleared.
//   - Entire months can be cleared.
//   - Weeks can be copied to another week.
//
// Compatibility:
//   - getDay("monday")
//   - setDay("monday", ...)
//   - clearDay("monday")
//   - getWeek()
//
//   remain available temporarily.
//
//   These compatibility methods resolve the weekday against
//   a specific calendar week, defaulting to the current week.
//
// V2 migration:
//   Existing V2 Monday-Sunday plans are migrated into the
//   CURRENT calendar week so existing user plans are not lost.
//
// Important separation:
//
//   workout-plan-store.js
//     = what the user PLANS to do on specific dates.
//
//   workout-progress-store.js
//     = what the user ACTUALLY did.
//
// This file must NOT persist:
//   - completed sets
//   - workout timer state
//   - live session substitutions
//   - workout heart rate
//   - session completion
//   - exercise completion
// =====================================================

const VERSION =
  "3.0.0";

const SCHEMA_VERSION =
  3;

const SOURCE =
  "js/training/workout-plan-store";

const STORAGE_KEY =
  "ari_training_calendar_plan_v3";

const LEGACY_STORAGE_KEYS =
  Object.freeze([
    "ari_training_weekly_plan_v2",
    "ari_training_weekly_plan_v1"
  ]);


// =====================================================
// CALENDAR CONSTANTS
// =====================================================

const WEEKDAY_IDS =
  Object.freeze([
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ]);


const DAY_LABELS =
  Object.freeze({
    sunday:
      "Sunday",

    monday:
      "Monday",

    tuesday:
      "Tuesday",

    wednesday:
      "Wednesday",

    thursday:
      "Thursday",

    friday:
      "Friday",

    saturday:
      "Saturday"
  });


/*
 * Temporary compatibility export.
 *
 * Existing V2 files refer to DAYS.
 * In V3, DAYS follows the calendar week:
 *
 * Sunday -> Saturday
 */
const DAYS =
  WEEKDAY_IDS;


const VALID_DAY_TYPES =
  Object.freeze([
    "workout",
    "recovery",
    "off"
  ]);


// =====================================================
// BASIC HELPERS
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


function createStableId(
  prefix =
    "plan"
) {
  const random =
    Math.random()
      .toString(36)
      .slice(
        2,
        10
      );

  return (
    `${prefix}_` +
    `${Date.now()}_` +
    `${random}`
  );
}


function normalizePositiveNumber(
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
    number > 0
  )
    ? number
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


function uniqueStrings(
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
// LOCAL DATE HELPERS
// =====================================================

/*
 * IMPORTANT:
 *
 * Calendar plan dates intentionally use LOCAL calendar
 * dates instead of UTC ISO-date conversion.
 *
 * Using:
 *   new Date().toISOString().slice(0, 10)
 *
 * can shift the calendar day around midnight depending on
 * timezone.
 */

function padNumber(
  value
) {
  return String(
    value
  ).padStart(
    2,
    "0"
  );
}


function formatDateKey(
  date
) {
  if (
    !(date instanceof Date) ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return (
    `${date.getFullYear()}-` +
    `${padNumber(
      date.getMonth() + 1
    )}-` +
    `${padNumber(
      date.getDate()
    )}`
  );
}


function parseDateKey(
  value
) {
  const text =
    normalizeText(
      value
    );

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/
      .exec(
        text
      );

  if (!match) {
    return null;
  }

  const year =
    Number(
      match[1]
    );

  const month =
    Number(
      match[2]
    );

  const day =
    Number(
      match[3]
    );

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  if (
    date.getFullYear() !==
      year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !==
      day
  ) {
    return null;
  }

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}


function normalizeDate(
  value =
    new Date()
) {
  if (
    value instanceof Date
  ) {
    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return null;
    }

    const date =
      new Date(
        value.getFullYear(),
        value.getMonth(),
        value.getDate()
      );

    return date;
  }

  if (
    typeof value ===
      "string"
  ) {
    const parsedKey =
      parseDateKey(
        value
      );

    if (parsedKey) {
      return parsedKey;
    }

    const parsed =
      new Date(
        value
      );

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
      );
    }
  }

  return null;
}


function normalizeDateKey(
  value
) {
  const date =
    normalizeDate(
      value
    );

  return date
    ? formatDateKey(
        date
      )
    : null;
}


function addDays(
  value,
  amount
) {
  const date =
    normalizeDate(
      value
    );

  if (!date) {
    return null;
  }

  date.setDate(
    date.getDate() +
    Number(
      amount || 0
    )
  );

  return date;
}


function getWeekStartDate(
  anchor =
    new Date()
) {
  const date =
    normalizeDate(
      anchor
    );

  if (!date) {
    return null;
  }

  /*
   * JavaScript:
   * Sunday = 0
   * Saturday = 6
   *
   * ARI V3 calendar weeks intentionally use:
   * Sunday -> Saturday
   */
  date.setDate(
    date.getDate() -
    date.getDay()
  );

  return date;
}


function getWeekEndDate(
  anchor =
    new Date()
) {
  const start =
    getWeekStartDate(
      anchor
    );

  return start
    ? addDays(
        start,
        6
      )
    : null;
}


function getWeekKey(
  anchor =
    new Date()
) {
  return formatDateKey(
    getWeekStartDate(
      anchor
    )
  );
}


function getCurrentWeekKey() {
  return getWeekKey(
    new Date()
  );
}


function getWeekdayIdFromDate(
  value
) {
  const date =
    normalizeDate(
      value
    );

  if (!date) {
    return null;
  }

  return WEEKDAY_IDS[
    date.getDay()
  ] || null;
}


function normalizeWeekdayId(
  value
) {
  const normalized =
    normalizeText(
      value
    )
      .toLowerCase();

  return WEEKDAY_IDS
    .includes(
      normalized
    )
      ? normalized
      : null;
}


function resolveWeekdayDate(
  weekday,
  anchor =
    new Date()
) {
  const weekdayId =
    normalizeWeekdayId(
      weekday
    );

  if (!weekdayId) {
    return null;
  }

  const start =
    getWeekStartDate(
      anchor
    );

  if (!start) {
    return null;
  }

  const index =
    WEEKDAY_IDS.indexOf(
      weekdayId
    );

  return addDays(
    start,
    index
  );
}


function resolveDateReference(
  value,
  {
    anchorDate =
      new Date()
  } = {}
) {
  /*
   * Actual YYYY-MM-DD dates always win.
   */
  const dateKey =
    normalizeDateKey(
      value
    );

  if (
    typeof value ===
      "string" &&
    /^\d{4}-\d{2}-\d{2}$/
      .test(
        value
      ) &&
    dateKey
  ) {
    return dateKey;
  }

  /*
   * Compatibility:
   * "monday" resolves against anchor week.
   */
  const weekday =
    normalizeWeekdayId(
      value
    );

  if (weekday) {
    const resolved =
      resolveWeekdayDate(
        weekday,
        anchorDate
      );

    return formatDateKey(
      resolved
    );
  }

  /*
   * Date / parseable date support.
   */
  return dateKey;
}


function getDateParts(
  value
) {
  const date =
    normalizeDate(
      value
    );

  if (!date) {
    return null;
  }

  return {
    year:
      date.getFullYear(),

    month:
      date.getMonth() + 1,

    monthIndex:
      date.getMonth(),

    dayOfMonth:
      date.getDate(),

    weekdayIndex:
      date.getDay(),

    weekdayId:
      WEEKDAY_IDS[
        date.getDay()
      ],

    dateKey:
      formatDateKey(
        date
      )
  };
}


function getDisplayDateLabel(
  value
) {
  const parts =
    getDateParts(
      value
    );

  if (!parts) {
    return "";
  }

  return (
    `${DAY_LABELS[
      parts.weekdayId
    ]} ${parts.dayOfMonth}`
  );
}


// =====================================================
// DAY TYPE
// =====================================================

function normalizeDayType(
  value
) {
  const type =
    normalizeText(
      value
    )
      .toLowerCase();

  return VALID_DAY_TYPES
    .includes(
      type
    )
      ? type
      : "off";
}


// =====================================================
// EXERCISE ENTRY NORMALIZATION
// =====================================================

function normalizePlanExercise(
  exerciseEntry,
  {
    preserveEntryId =
      true
  } = {}
) {
  if (
    !exerciseEntry ||
    typeof exerciseEntry !==
      "object"
  ) {
    return null;
  }

  const exerciseId =
    normalizeId(
      exerciseEntry
        .exerciseId
    );

  if (!exerciseId) {
    return null;
  }

  const existingEntryId =
    preserveEntryId
      ? normalizeId(
          exerciseEntry
            .entryId
        )
      : null;

  const sets =
    normalizePositiveInteger(
      exerciseEntry.sets ??
      exerciseEntry
        .prescription
        ?.sets
    );

  const reps =
    normalizePositiveInteger(
      exerciseEntry.reps ??
      exerciseEntry
        .prescription
        ?.reps
    );

  const restSeconds =
    normalizeNonNegativeNumber(
      exerciseEntry
        .restSeconds ??
      exerciseEntry
        .rest_seconds ??
      exerciseEntry
        .prescription
        ?.restSeconds
    );

  const durationMinutes =
    normalizePositiveNumber(
      exerciseEntry
        .durationMinutes ??
      exerciseEntry
        .duration_minutes ??
      exerciseEntry
        .prescription
        ?.durationMinutes
    );

  const durationSeconds =
    normalizePositiveNumber(
      exerciseEntry
        .durationSeconds ??
      exerciseEntry
        .duration_seconds ??
      exerciseEntry
        .prescription
        ?.durationSeconds
    );

  const rounds =
    normalizePositiveInteger(
      exerciseEntry.rounds ??
      exerciseEntry
        .prescription
        ?.rounds
    );

  const workSeconds =
    normalizePositiveNumber(
      exerciseEntry
        .workSeconds ??
      exerciseEntry
        .work_seconds ??
      exerciseEntry
        .prescription
        ?.workSeconds
    );

  const weight =
    normalizeNonNegativeNumber(
      exerciseEntry.weight ??
      exerciseEntry
        .prescription
        ?.weight
    );

  const addedWeight =
    normalizeNonNegativeNumber(
      exerciseEntry
        .addedWeight ??
      exerciseEntry
        .added_weight ??
      exerciseEntry
        .prescription
        ?.addedWeight
    );

  const distance =
    normalizePositiveNumber(
      exerciseEntry.distance ??
      exerciseEntry
        .prescription
        ?.distance
    );

  const intensity =
    normalizeId(
      exerciseEntry.intensity ??
      exerciseEntry
        .prescription
        ?.intensity
    );

  const role =
    normalizeId(
      exerciseEntry.role
    );

  const notes =
    normalizeText(
      exerciseEntry.notes ??
      exerciseEntry.userNotes
    ) ||
    null;

  const normalized = {
    entryId:
      existingEntryId ||
      createStableId(
        "plan_exercise"
      ),

    exerciseId,

    role,

    sets,

    reps,

    restSeconds,

    durationMinutes,

    durationSeconds,

    rounds,

    workSeconds,

    weight,

    addedWeight,

    distance,

    intensity,

    notes,

    metadata: {
      ...(
        exerciseEntry.metadata &&
        typeof exerciseEntry
          .metadata ===
          "object"
          ? clone(
              exerciseEntry
                .metadata
            )
          : {}
      )
    }
  };


  /*
   * Preserve additional prescription values.
   */
  const passthroughFields =
    [
      "pace",
      "incline",
      "resistance",
      "assistance",
      "boxHeight",
      "box_height",
      "side",
      "stance",
      "speed",
      "level",
      "steps",
      "strokeRate",
      "stroke_rate"
    ];


  for (
    const field
    of passthroughFields
  ) {
    if (
      exerciseEntry[
        field
      ] !== undefined
    ) {
      normalized[
        field
      ] =
        clone(
          exerciseEntry[
            field
          ]
        );
    }
  }


  return normalized;
}


function normalizeExerciseList(
  exercises
) {
  if (
    !Array.isArray(
      exercises
    )
  ) {
    return [];
  }

  const normalized = [];

  const usedEntryIds =
    new Set();


  for (
    const exercise
    of exercises
  ) {
    const entry =
      normalizePlanExercise(
        exercise
      );

    if (!entry) {
      continue;
    }

    if (
      usedEntryIds.has(
        entry.entryId
      )
    ) {
      entry.entryId =
        createStableId(
          "plan_exercise"
        );
    }

    usedEntryIds.add(
      entry.entryId
    );

    normalized.push(
      entry
    );
  }


  return normalized;
}


// =====================================================
// SCHEDULED DAY CREATION
// =====================================================

function makeScheduledDay({
  date,

  type =
    "off",

  focusId =
    "off_day",

  title =
    null,

  goal =
    null,

  sport =
    null,

  workoutId =
    null,

  estimatedDurationMinutes =
    null,

  exercises =
    [],

  metadata =
    null
} = {}) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    throw new TypeError(
      "AriTrainingWorkoutPlanStore.makeScheduledDay requires a valid calendar date."
    );
  }

  const parts =
    getDateParts(
      dateKey
    );

  const normalizedType =
    normalizeDayType(
      type
    );

  const isOff =
    normalizedType ===
      "off";


  return {
    date:
      dateKey,

    day:
      parts.weekdayId,

    label:
      DAY_LABELS[
        parts.weekdayId
      ],

    dateLabel:
      getDisplayDateLabel(
        dateKey
      ),

    dayOfMonth:
      parts.dayOfMonth,

    month:
      parts.month,

    year:
      parts.year,

    type:
      normalizedType,

    focusId:
      isOff
        ? "off_day"
        : normalizeId(
            focusId
          ) ||
          "custom",

    title:
      normalizeText(
        title
      ) ||
      (
        isOff
          ? "Off Day"
          : DAY_LABELS[
              parts.weekdayId
            ]
      ),

    goal:
      isOff
        ? null
        : normalizeId(
            goal
          ),

    sport:
      isOff
        ? null
        : normalizeId(
            sport
          ),

    workoutId:
      isOff
        ? null
        : normalizeId(
            workoutId
          ),

    estimatedDurationMinutes:
      isOff
        ? null
        : normalizePositiveNumber(
            estimatedDurationMinutes
          ),

    exercises:
      isOff
        ? []
        : normalizeExerciseList(
            exercises
          ),

    isPlanned:
      true,

    metadata: {
      ...(
        metadata &&
        typeof metadata ===
          "object"
          ? clone(
              metadata
            )
          : {}
      )
    }
  };
}


// =====================================================
// V2 COMPATIBILITY: makeDay()
// =====================================================

function makeDay(
  options =
    {}
) {
  const {
    day,
    date,
    anchorDate =
      new Date(),
    ...rest
  } =
    options;

  const resolvedDate =
    date
      ? normalizeDateKey(
          date
        )
      : resolveDateReference(
          day,
          {
            anchorDate
          }
        );

  if (!resolvedDate) {
    throw new TypeError(
      "AriTrainingWorkoutPlanStore.makeDay requires a valid date or weekday."
    );
  }

  return makeScheduledDay({
    date:
      resolvedDate,

    ...rest
  });
}


// =====================================================
// VIRTUAL / UNSCHEDULED OFF DAY
// =====================================================

function createUnscheduledDay(
  date
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    return null;
  }

  const parts =
    getDateParts(
      dateKey
    );

  return {
    date:
      dateKey,

    day:
      parts.weekdayId,

    label:
      DAY_LABELS[
        parts.weekdayId
      ],

    dateLabel:
      getDisplayDateLabel(
        dateKey
      ),

    dayOfMonth:
      parts.dayOfMonth,

    month:
      parts.month,

    year:
      parts.year,

    type:
      "off",

    focusId:
      "off_day",

    title:
      "Off Day",

    goal:
      null,

    sport:
      null,

    workoutId:
      null,

    estimatedDurationMinutes:
      null,

    exercises:
      [],

    /*
     * Critical distinction:
     *
     * false = nothing was explicitly planned.
     *
     * The UI can therefore show:
     *
     *   PLAN WORKOUT
     *
     * instead of pretending this is a permanently scheduled
     * recovery/off-day record.
     */
    isPlanned:
      false,

    metadata: {
      virtual:
        true,

      unplanned:
        true
    }
  };
}


// =====================================================
// INITIAL STATE
// =====================================================

function createInitialState() {
  return {
    schemaVersion:
      SCHEMA_VERSION,

    version:
      VERSION,

    source:
      SOURCE,

    /*
     * planId may later be replaced by the Supabase record ID.
     */
    planId:
      null,

    name:
      "My Training Calendar",

    primaryGoalId:
      null,

    secondaryGoalIds:
      [],

    /*
     * THE CORE V3 CHANGE.
     */
    scheduledDays:
      {},

    metadata: {
      createdAt:
        null,

      updatedAt:
        null,

      migratedFrom:
        null,

      migratedAt:
        null,

      lastAppliedTemplateId:
        null,

      lastAppliedTemplateWeek:
        null,

      lastClearedWeek:
        null,

      lastClearedMonth:
        null,

      builderVersion:
        null
    }
  };
}


const state =
  createInitialState();

const listeners =
  new Set();


// =====================================================
// EVENTS
// =====================================================

function touch() {
  const now =
    nowIso();

  if (
    !state.metadata
      .createdAt
  ) {
    state.metadata
      .createdAt =
        now;
  }

  state.metadata
    .updatedAt =
      now;
}


function emit() {
  const snapshot =
    getState();

  for (
    const listener
    of listeners
  ) {
    try {
      listener(
        snapshot
      );
    } catch (
      error
    ) {
      console.warn(
        "ARI Training workout-plan listener failed.",
        error
      );
    }
  }
}


function subscribe(
  listener
) {
  if (
    typeof listener !==
      "function"
  ) {
    throw new TypeError(
      "AriTrainingWorkoutPlanStore.subscribe requires a function."
    );
  }

  listeners.add(
    listener
  );

  return () => {
    listeners.delete(
      listener
    );
  };
}


// =====================================================
// STATE READS
// =====================================================

function getState() {
  return clone(
    state
  );
}


function getScheduledDays() {
  return clone(
    state.scheduledDays
  );
}


function getScheduledDateKeys() {
  return Object.keys(
    state.scheduledDays
  ).sort();
}


function hasScheduledDate(
  date
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    return false;
  }

  return Boolean(
    state.scheduledDays[
      dateKey
    ]
  );
}


// =====================================================
// DATE READS
// =====================================================

function getDate(
  date
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    return null;
  }

  const existing =
    state.scheduledDays[
      dateKey
    ];

  if (existing) {
    return clone(
      existing
    );
  }

  /*
   * No record means:
   *   unplanned / off
   */
  return createUnscheduledDay(
    dateKey
  );
}


function getDateRaw(
  date
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    return null;
  }

  const record =
    state.scheduledDays[
      dateKey
    ];

  return record
    ? clone(
        record
      )
    : null;
}


// =====================================================
// WEEK READS
// =====================================================

function getWeekDates(
  anchorDate =
    new Date()
) {
  const start =
    getWeekStartDate(
      anchorDate
    );

  if (!start) {
    return [];
  }

  return WEEKDAY_IDS.map(
    (
      weekday,
      index
    ) => {
      const date =
        addDays(
          start,
          index
        );

      return {
        weekday,

        date:
          formatDateKey(
            date
          ),

        dayOfMonth:
          date.getDate(),

        month:
          date.getMonth() +
          1,

        year:
          date.getFullYear()
      };
    }
  );
}


/*
 * Compatibility shape:
 *
 * {
 *   sunday: {...},
 *   monday: {...},
 *   ...
 * }
 */
function getWeek(
  anchorDate =
    new Date()
) {
  const result = {};

  for (
    const item
    of getWeekDates(
      anchorDate
    )
  ) {
    result[
      item.weekday
    ] =
      getDate(
        item.date
      );
  }

  return result;
}


/*
 * Rich V3 week record intended for new UI/controller code.
 */
function getCalendarWeek(
  anchorDate =
    new Date()
) {
  const start =
    getWeekStartDate(
      anchorDate
    );

  const end =
    getWeekEndDate(
      anchorDate
    );

  if (
    !start ||
    !end
  ) {
    return null;
  }

  const dates =
    getWeekDates(
      anchorDate
    );

  const days =
    dates.map(
      item =>
        getDate(
          item.date
        )
    );

  return {
    weekKey:
      formatDateKey(
        start
      ),

    startDate:
      formatDateKey(
        start
      ),

    endDate:
      formatDateKey(
        end
      ),

    days,

    byWeekday:
      days.reduce(
        (
          result,
          day
        ) => {
          result[
            day.day
          ] =
            day;

          return result;
        },
        {}
      )
  };
}


// =====================================================
// MONTH READS
// =====================================================

function getMonth(
  yearOrDate =
    new Date(),
  monthNumber =
    null
) {
  let year;
  let monthIndex;

  if (
    monthNumber !==
      null &&
    monthNumber !==
      undefined
  ) {
    year =
      Number(
        yearOrDate
      );

    monthIndex =
      Number(
        monthNumber
      ) - 1;
  } else {
    const date =
      normalizeDate(
        yearOrDate
      );

    if (!date) {
      return null;
    }

    year =
      date.getFullYear();

    monthIndex =
      date.getMonth();
  }

  if (
    !Number.isInteger(
      year
    ) ||
    !Number.isInteger(
      monthIndex
    ) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return null;
  }

  const first =
    new Date(
      year,
      monthIndex,
      1
    );

  const last =
    new Date(
      year,
      monthIndex + 1,
      0
    );

  const days = [];

  for (
    let day = 1;
    day <=
      last.getDate();
    day += 1
  ) {
    const date =
      new Date(
        year,
        monthIndex,
        day
      );

    days.push(
      getDate(
        date
      )
    );
  }

  return {
    year,

    month:
      monthIndex + 1,

    firstDate:
      formatDateKey(
        first
      ),

    lastDate:
      formatDateKey(
        last
      ),

    days
  };
}


// =====================================================
// V2 COMPATIBILITY: getDay()
// =====================================================

function getDay(
  dayOrDate,
  {
    anchorDate =
      new Date()
  } = {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      {
        anchorDate
      }
    );

  if (!dateKey) {
    return null;
  }

  return getDate(
    dateKey
  );
}


// =====================================================
// EXERCISE READS
// =====================================================

function getExerciseByEntryId(
  dayOrDate,
  entryId,
  options =
    {}
) {
  const current =
    getDay(
      dayOrDate,
      options
    );

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  if (
    !current ||
    !normalizedEntryId
  ) {
    return null;
  }

  return (
    current.exercises
      .find(
        exercise =>
          exercise.entryId ===
            normalizedEntryId
      ) ||
    null
  );
}


function getExerciseIndexByEntryId(
  dayOrDate,
  entryId,
  options =
    {}
) {
  const current =
    getDay(
      dayOrDate,
      options
    );

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  if (
    !current ||
    !normalizedEntryId
  ) {
    return -1;
  }

  return current.exercises
    .findIndex(
      exercise =>
        exercise.entryId ===
          normalizedEntryId
    );
}


// =====================================================
// PLAN METADATA
// =====================================================

function setPlanName(
  name
) {
  const normalized =
    normalizeText(
      name
    );

  if (!normalized) {
    return false;
  }

  state.name =
    normalized;

  touch();
  emit();

  return true;
}


function setPrimaryGoal(
  goalId
) {
  state.primaryGoalId =
    normalizeId(
      goalId
    );

  touch();
  emit();

  return true;
}


function setSecondaryGoals(
  goalIds =
    []
) {
  state.secondaryGoalIds =
    uniqueStrings(
      goalIds
    );

  touch();
  emit();

  return true;
}


// =====================================================
// DATE MUTATIONS
// =====================================================

function setDate(
  date,
  dayState =
    {}
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    return false;
  }

  const existing =
    state.scheduledDays[
      dateKey
    ] ||
    null;

  const merged = {
    ...(
      existing ||
      {}
    ),

    ...clone(
      dayState
    ),

    date:
      dateKey
  };


  state.scheduledDays[
    dateKey
  ] =
    makeScheduledDay(
      merged
    );

  touch();
  emit();

  return true;
}


function setDateType(
  date,
  type
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    return false;
  }

  const current =
    getDate(
      dateKey
    );

  const normalizedType =
    normalizeDayType(
      type
    );


  if (
    normalizedType ===
      "off"
  ) {
    return setDate(
      dateKey,
      {
        type:
          "off",

        focusId:
          "off_day",

        title:
          "Off Day",

        goal:
          null,

        sport:
          null,

        workoutId:
          null,

        estimatedDurationMinutes:
          null,

        exercises:
          []
      }
    );
  }


  return setDate(
    dateKey,
    {
      ...current,

      type:
        normalizedType,

      focusId:
        current.focusId ===
          "off_day"
          ? "custom"
          : current.focusId ||
            "custom",

      title:
        current.title ===
          "Off Day"
          ? current.label
          : current.title
    }
  );
}


function setDateFocus(
  date,
  focusId,
  title =
    null
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  const normalizedFocusId =
    normalizeId(
      focusId
    );

  if (
    !dateKey ||
    !normalizedFocusId
  ) {
    return false;
  }

  const current =
    getDate(
      dateKey
    );


  if (
    normalizedFocusId ===
      "off_day"
  ) {
    return setDate(
      dateKey,
      {
        type:
          "off",

        focusId:
          "off_day",

        title:
          normalizeText(
            title
          ) ||
          "Off Day",

        goal:
          null,

        sport:
          null,

        workoutId:
          null,

        estimatedDurationMinutes:
          null,

        exercises:
          []
      }
    );
  }


  return setDate(
    dateKey,
    {
      ...current,

      type:
        current.type ===
          "recovery"
          ? "recovery"
          : "workout",

      focusId:
        normalizedFocusId,

      title:
        normalizeText(
          title
        ) ||
        (
          current.title ===
            "Off Day"
            ? current.label
            : current.title
        )
    }
  );
}


function setDateTitle(
  date,
  title
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  const normalized =
    normalizeText(
      title
    );

  if (
    !dateKey ||
    !normalized
  ) {
    return false;
  }

  const current =
    getDate(
      dateKey
    );

  return setDate(
    dateKey,
    {
      ...current,

      title:
        normalized
    }
  );
}


function setDateGoal(
  date,
  goalId
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    return false;
  }

  const current =
    getDate(
      dateKey
    );

  if (
    current.type ===
      "off"
  ) {
    return false;
  }

  return setDate(
    dateKey,
    {
      ...current,

      goal:
        normalizeId(
          goalId
        )
    }
  );
}


function setDateSport(
  date,
  sportId
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    return false;
  }

  const current =
    getDate(
      dateKey
    );

  if (
    current.type ===
      "off"
  ) {
    return false;
  }

  return setDate(
    dateKey,
    {
      ...current,

      sport:
        normalizeId(
          sportId
        )
    }
  );
}


function setDateDuration(
  date,
  minutes
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    return false;
  }

  const current =
    getDate(
      dateKey
    );

  if (
    current.type ===
      "off"
  ) {
    return false;
  }

  return setDate(
    dateKey,
    {
      ...current,

      estimatedDurationMinutes:
        normalizePositiveNumber(
          minutes
        )
    }
  );
}


// =====================================================
// V2 COMPATIBILITY DAY MUTATIONS
// =====================================================

function setDay(
  dayOrDate,
  dayState,
  {
    anchorDate =
      new Date()
  } = {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      {
        anchorDate
      }
    );

  return dateKey
    ? setDate(
        dateKey,
        dayState
      )
    : false;
}


function setDayType(
  dayOrDate,
  type,
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? setDateType(
        dateKey,
        type
      )
    : false;
}


function setDayFocus(
  dayOrDate,
  focusId,
  title =
    null,
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? setDateFocus(
        dateKey,
        focusId,
        title
      )
    : false;
}


function setDayTitle(
  dayOrDate,
  title,
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? setDateTitle(
        dateKey,
        title
      )
    : false;
}


function setDayGoal(
  dayOrDate,
  goalId,
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? setDateGoal(
        dateKey,
        goalId
      )
    : false;
}


function setDaySport(
  dayOrDate,
  sportId,
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? setDateSport(
        dateKey,
        sportId
      )
    : false;
}


function setDayDuration(
  dayOrDate,
  minutes,
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? setDateDuration(
        dateKey,
        minutes
      )
    : false;
}


// =====================================================
// BUILDER / WORKOUT IMPORT
// =====================================================

function convertBuilderWorkoutToDay(
  workout,
  date
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    return null;
  }

  const mainExercises =
    Array.isArray(
      workout.blocks
    )
      ? workout.blocks
          .flatMap(
            block =>
              Array.isArray(
                block.exercises
              )
                ? block.exercises
                : []
          )
          .filter(
            entry =>
              ![
                "warmup",
                "cooldown"
              ].includes(
                entry.role
              )
          )
      : [];


  return {
    date:
      dateKey,

    type:
      workout.type ===
        "mobility" &&
      workout.goal ===
        "recovery"
        ? "recovery"
        : "workout",

    title:
      normalizeText(
        workout.title
      ) ||
      getDisplayDateLabel(
        dateKey
      ),

    goal:
      normalizeId(
        workout.goal
      ),

    sport:
      normalizeId(
        workout.sport
      ),

    workoutId:
      normalizeId(
        workout.workoutId
      ),

    estimatedDurationMinutes:
      normalizePositiveNumber(
        workout
          .estimatedDurationMinutes ??
        workout
          .plannedDurationMinutes
      ),

    exercises:
      mainExercises.map(
        entry => ({
          entryId:
            entry.entryId,

          exerciseId:
            entry.exerciseId,

          role:
            entry.role,

          ...(
            entry.prescription &&
            typeof entry
              .prescription ===
              "object"
              ? clone(
                  entry.prescription
                )
              : {}
          ),

          metadata: {
            builderEntry:
              true
          }
        })
      ),

    metadata: {
      source:
        workout.metadata
          ?.source ||
        "workout-builder",

      builderVersion:
        workout.metadata
          ?.version ||
        workout.metadata
          ?.builderVersion ||
        null,

      originalWorkoutMetadata:
        workout.metadata
          ? clone(
              workout.metadata
            )
          : {}
    }
  };
}


function setBuiltWorkoutForDate(
  date,
  workoutOrPlanDay,
  {
    focusId =
      null
  } = {}
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (
    !dateKey ||
    !workoutOrPlanDay ||
    typeof workoutOrPlanDay !==
      "object"
  ) {
    return false;
  }

  const planDay =
    workoutOrPlanDay.blocks
      ? convertBuilderWorkoutToDay(
          workoutOrPlanDay,
          dateKey
        )
      : {
          ...clone(
            workoutOrPlanDay
          ),

          date:
            dateKey
        };


  return setDate(
    dateKey,
    {
      ...planDay,

      type:
        planDay.type ===
          "off"
          ? "off"
          : planDay.type ===
              "recovery"
            ? "recovery"
            : "workout",

      focusId:
        normalizeId(
          focusId
        ) ||
        normalizeId(
          planDay.focusId
        ) ||
        "custom",

      metadata: {
        ...(
          planDay.metadata &&
          typeof planDay
            .metadata ===
            "object"
            ? clone(
                planDay.metadata
              )
            : {}
        ),

        importedAt:
          nowIso()
      }
    }
  );
}


/*
 * V2 compatibility.
 */
function setBuiltWorkout(
  dayOrDate,
  workoutOrPlanDay,
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      {
        anchorDate:
          options.anchorDate ||
          new Date()
      }
    );

  if (!dateKey) {
    return false;
  }

  return setBuiltWorkoutForDate(
    dateKey,
    workoutOrPlanDay,
    options
  );
}


// =====================================================
// PLAN EXERCISE MUTATIONS
// =====================================================

function addExerciseToDate(
  date,
  exerciseEntry
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    return false;
  }

  const current =
    getDate(
      dateKey
    );

  if (
    !current ||
    current.type ===
      "off"
  ) {
    return false;
  }

  const normalized =
    normalizePlanExercise(
      exerciseEntry
    );

  if (!normalized) {
    return false;
  }

  if (
    current.exercises
      .some(
        exercise =>
          exercise.entryId ===
            normalized.entryId
      )
  ) {
    normalized.entryId =
      createStableId(
        "plan_exercise"
      );
  }

  current.exercises.push(
    normalized
  );

  return setDate(
    dateKey,
    current
  );
}


function updateExerciseOnDate(
  date,
  index,
  patch =
    {}
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  const position =
    Number(
      index
    );

  if (!dateKey) {
    return false;
  }

  const current =
    getDate(
      dateKey
    );

  if (
    !current ||
    current.type ===
      "off" ||
    !Number.isInteger(
      position
    ) ||
    position < 0 ||
    position >=
      current.exercises.length ||
    !patch ||
    typeof patch !==
      "object"
  ) {
    return false;
  }

  const merged = {
    ...current.exercises[
      position
    ],

    ...clone(
      patch
    ),

    entryId:
      current.exercises[
        position
      ].entryId
  };

  const normalized =
    normalizePlanExercise(
      merged
    );

  if (!normalized) {
    return false;
  }

  current.exercises[
    position
  ] =
    normalized;

  return setDate(
    dateKey,
    current
  );
}


function updateExerciseByIdOnDate(
  date,
  entryId,
  patch =
    {}
) {
  const index =
    getExerciseIndexByEntryId(
      date,
      entryId
    );

  if (
    index < 0
  ) {
    return false;
  }

  return updateExerciseOnDate(
    date,
    index,
    patch
  );
}


function removeExerciseFromDate(
  date,
  index
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  const position =
    Number(
      index
    );

  if (!dateKey) {
    return false;
  }

  const current =
    getDate(
      dateKey
    );

  if (
    !current ||
    current.type ===
      "off" ||
    !Number.isInteger(
      position
    ) ||
    position < 0 ||
    position >=
      current.exercises.length
  ) {
    return false;
  }

  current.exercises.splice(
    position,
    1
  );

  return setDate(
    dateKey,
    current
  );
}


function removeExerciseByIdFromDate(
  date,
  entryId
) {
  const index =
    getExerciseIndexByEntryId(
      date,
      entryId
    );

  if (
    index < 0
  ) {
    return false;
  }

  return removeExerciseFromDate(
    date,
    index
  );
}


function moveExerciseOnDate(
  date,
  fromIndex,
  toIndex
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  const from =
    Number(
      fromIndex
    );

  const to =
    Number(
      toIndex
    );

  if (!dateKey) {
    return false;
  }

  const current =
    getDate(
      dateKey
    );

  if (
    !current ||
    current.type ===
      "off" ||
    !Number.isInteger(
      from
    ) ||
    !Number.isInteger(
      to
    ) ||
    from < 0 ||
    to < 0 ||
    from >=
      current.exercises.length ||
    to >=
      current.exercises.length
  ) {
    return false;
  }

  if (
    from ===
      to
  ) {
    return true;
  }

  const [
    moved
  ] =
    current.exercises.splice(
      from,
      1
    );

  current.exercises.splice(
    to,
    0,
    moved
  );

  return setDate(
    dateKey,
    current
  );
}


function moveExerciseByIdOnDate(
  date,
  entryId,
  toIndex
) {
  const fromIndex =
    getExerciseIndexByEntryId(
      date,
      entryId
    );

  if (
    fromIndex < 0
  ) {
    return false;
  }

  return moveExerciseOnDate(
    date,
    fromIndex,
    toIndex
  );
}


// =====================================================
// V2 COMPATIBILITY EXERCISE MUTATIONS
// =====================================================

function addExercise(
  dayOrDate,
  exerciseEntry,
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? addExerciseToDate(
        dateKey,
        exerciseEntry
      )
    : false;
}


function updateExercise(
  dayOrDate,
  index,
  patch =
    {},
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? updateExerciseOnDate(
        dateKey,
        index,
        patch
      )
    : false;
}


function updateExerciseById(
  dayOrDate,
  entryId,
  patch =
    {},
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? updateExerciseByIdOnDate(
        dateKey,
        entryId,
        patch
      )
    : false;
}


function removeExercise(
  dayOrDate,
  index,
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? removeExerciseFromDate(
        dateKey,
        index
      )
    : false;
}


function removeExerciseById(
  dayOrDate,
  entryId,
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? removeExerciseByIdFromDate(
        dateKey,
        entryId
      )
    : false;
}


function moveExercise(
  dayOrDate,
  fromIndex,
  toIndex,
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? moveExerciseOnDate(
        dateKey,
        fromIndex,
        toIndex
      )
    : false;
}


function moveExerciseById(
  dayOrDate,
  entryId,
  toIndex,
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? moveExerciseByIdOnDate(
        dateKey,
        entryId,
        toIndex
      )
    : false;
}


// =====================================================
// CLEAR DATE
// =====================================================

function clearDate(
  date
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    return false;
  }

  /*
   * Removing the stored record makes this date become an
   * unplanned virtual Off Day.
   */
  delete state.scheduledDays[
    dateKey
  ];

  touch();
  emit();

  return true;
}


/*
 * Explicitly schedule an Off Day.
 *
 * This is different from clearDate().
 *
 * clearDate():
 *   Nothing planned.
 *
 * scheduleOffDate():
 *   User intentionally scheduled an Off Day.
 */
function scheduleOffDate(
  date,
  {
    title =
      "Off Day",

    metadata =
      {}
  } = {}
) {
  const dateKey =
    normalizeDateKey(
      date
    );

  if (!dateKey) {
    return false;
  }

  return setDate(
    dateKey,
    {
      type:
        "off",

      focusId:
        "off_day",

      title,

      exercises:
        [],

      metadata: {
        ...metadata,

        explicitlyScheduledOff:
          true
      }
    }
  );
}


// =====================================================
// V2 COMPATIBILITY CLEAR DAY
// =====================================================

function clearDay(
  dayOrDate,
  options =
    {}
) {
  const dateKey =
    resolveDateReference(
      dayOrDate,
      options
    );

  return dateKey
    ? clearDate(
        dateKey
      )
    : false;
}


// =====================================================
// CLEAR WEEK
// =====================================================

function clearWeek(
  anchorDate =
    new Date()
) {
  const dates =
    getWeekDates(
      anchorDate
    );

  if (
    dates.length ===
      0
  ) {
    return false;
  }

  for (
    const item
    of dates
  ) {
    delete state.scheduledDays[
      item.date
    ];
  }

  state.metadata
    .lastClearedWeek =
      getWeekKey(
        anchorDate
      );

  touch();
  persist();
  emit();

  return true;
}


// =====================================================
// CLEAR MONTH
// =====================================================

function clearMonth(
  yearOrDate =
    new Date(),
  monthNumber =
    null
) {
  const month =
    getMonth(
      yearOrDate,
      monthNumber
    );

  if (!month) {
    return false;
  }

  for (
    const day
    of month.days
  ) {
    delete state.scheduledDays[
      day.date
    ];
  }

  state.metadata
    .lastClearedMonth =
      `${month.year}-${padNumber(
        month.month
      )}`;

  touch();
  persist();
  emit();

  return true;
}


// =====================================================
// COPY WEEK
// =====================================================

function copyWeek(
  sourceAnchorDate,
  targetAnchorDate,
  {
    overwrite =
      true
  } = {}
) {
  const sourceStart =
    getWeekStartDate(
      sourceAnchorDate
    );

  const targetStart =
    getWeekStartDate(
      targetAnchorDate
    );

  if (
    !sourceStart ||
    !targetStart
  ) {
    return false;
  }

  const sourceRecords = [];

  /*
   * Snapshot source week before changing target.
   *
   * This matters if users copy a week into itself or into
   * an overlapping range.
   */
  for (
    let index = 0;
    index < 7;
    index += 1
  ) {
    const sourceDate =
      addDays(
        sourceStart,
        index
      );

    const sourceKey =
      formatDateKey(
        sourceDate
      );

    const sourceRecord =
      state.scheduledDays[
        sourceKey
      ]
        ? clone(
            state.scheduledDays[
              sourceKey
            ]
          )
        : null;

    sourceRecords.push(
      sourceRecord
    );
  }


  for (
    let index = 0;
    index < 7;
    index += 1
  ) {
    const targetDate =
      addDays(
        targetStart,
        index
      );

    const targetKey =
      formatDateKey(
        targetDate
      );

    const sourceRecord =
      sourceRecords[
        index
      ];

    if (
      !sourceRecord
    ) {
      if (
        overwrite
      ) {
        delete state.scheduledDays[
          targetKey
        ];
      }

      continue;
    }

    if (
      !overwrite &&
      state.scheduledDays[
        targetKey
      ]
    ) {
      continue;
    }

    state.scheduledDays[
      targetKey
    ] =
      makeScheduledDay({
        ...sourceRecord,

        date:
          targetKey,

        workoutId:
          null,

        exercises:
          sourceRecord.exercises
            .map(
              exercise => ({
                ...exercise,

                /*
                 * New calendar copy receives new stable
                 * plan-entry IDs.
                 */
                entryId:
                  createStableId(
                    "plan_exercise"
                  )
              })
            ),

        metadata: {
          ...(
            sourceRecord
              .metadata ||
            {}
          ),

          copiedFromDate:
            sourceRecord.date,

          copiedAt:
            nowIso()
        }
      });
  }

  touch();
  persist();
  emit();

  return true;
}


// =====================================================
// TEMPLATE SUPPORT
// =====================================================

function applyTemplate(
  template,
  {
    anchorDate =
      new Date(),

    weekStartDate =
      null,

    overwrite =
      true
  } = {}
) {
  if (
    !template ||
    typeof template !==
      "object" ||
    !template.schedule
  ) {
    return false;
  }

  const targetStart =
    getWeekStartDate(
      weekStartDate ||
      anchorDate
    );

  if (!targetStart) {
    return false;
  }

  /*
   * A template only owns the SELECTED WEEK.
   *
   * It never becomes a repeating schedule.
   */
  if (
    overwrite
  ) {
    for (
      let index = 0;
      index < 7;
      index += 1
    ) {
      const dateKey =
        formatDateKey(
          addDays(
            targetStart,
            index
          )
        );

      delete state
        .scheduledDays[
          dateKey
        ];
    }
  }


  for (
    let index = 0;
    index < 7;
    index += 1
  ) {
    const weekdayId =
      WEEKDAY_IDS[
        index
      ];

    const templateDay =
      template.schedule[
        weekdayId
      ];

    if (!templateDay) {
      continue;
    }

    const date =
      addDays(
        targetStart,
        index
      );

    const dateKey =
      formatDateKey(
        date
      );

    if (
      !overwrite &&
      state.scheduledDays[
        dateKey
      ]
    ) {
      continue;
    }


    /*
     * Template Off Days remain explicit template dates.
     *
     * This keeps template intent visible while still
     * preventing recurrence into future weeks.
     */
    state.scheduledDays[
      dateKey
    ] =
      makeScheduledDay({
        date:
          dateKey,

        ...templateDay,

        exercises:
          Array.isArray(
            templateDay.exercises
          )
            ? templateDay.exercises
                .map(
                  exercise => ({
                    ...exercise,

                    entryId:
                      createStableId(
                        "plan_exercise"
                      )
                  })
                )
            : [],

        metadata: {
          ...(
            templateDay.metadata &&
            typeof templateDay
              .metadata ===
              "object"
              ? clone(
                  templateDay.metadata
                )
              : {}
          ),

          sourceTemplateId:
            normalizeId(
              template.id
            ),

          templateAppliedAt:
            nowIso(),

          templateWeek:
            formatDateKey(
              targetStart
            )
        }
      });
  }


  /*
   * Applying a template does NOT replace the identity of
   * the user's entire calendar plan.
   */
  if (
    !state.primaryGoalId &&
    Array.isArray(
      template.primaryGoals
    )
  ) {
    state.primaryGoalId =
      normalizeId(
        template.primaryGoals[
          0
        ]
      );

    state.secondaryGoalIds =
      uniqueStrings(
        template.primaryGoals
          .slice(
            1
          )
      );
  }


  state.metadata
    .lastAppliedTemplateId =
      normalizeId(
        template.id
      );

  state.metadata
    .lastAppliedTemplateWeek =
      formatDateKey(
        targetStart
      );


  if (
    !state.metadata
      .createdAt
  ) {
    state.metadata
      .createdAt =
        nowIso();
  }

  touch();
  persist();
  emit();

  return true;
}


// =====================================================
// SUMMARY HELPERS
// =====================================================

function getTrainingDates({
  startDate =
    null,

  endDate =
    null
} = {}) {
  const startKey =
    startDate
      ? normalizeDateKey(
          startDate
        )
      : null;

  const endKey =
    endDate
      ? normalizeDateKey(
          endDate
        )
      : null;


  return getScheduledDateKeys()
    .filter(
      dateKey => {
        if (
          startKey &&
          dateKey < startKey
        ) {
          return false;
        }

        if (
          endKey &&
          dateKey > endKey
        ) {
          return false;
        }

        return (
          state.scheduledDays[
            dateKey
          ]?.type !==
          "off"
        );
      }
    )
    .map(
      dateKey =>
        clone(
          state.scheduledDays[
            dateKey
          ]
        )
    );
}


function getOffDates({
  startDate =
    null,

  endDate =
    null,

  includeUnplanned =
    false
} = {}) {
  const startKey =
    startDate
      ? normalizeDateKey(
          startDate
        )
      : null;

  const endKey =
    endDate
      ? normalizeDateKey(
          endDate
        )
      : null;


  if (
    includeUnplanned &&
    startKey &&
    endKey
  ) {
    const start =
      parseDateKey(
        startKey
      );

    const end =
      parseDateKey(
        endKey
      );

    const result = [];

    for (
      let cursor =
        normalizeDate(
          start
        );
      cursor <= end;
      cursor =
        addDays(
          cursor,
          1
        )
    ) {
      const day =
        getDate(
          cursor
        );

      if (
        day.type ===
          "off"
      ) {
        result.push(
          day
        );
      }
    }

    return result;
  }


  return getScheduledDateKeys()
    .filter(
      dateKey => {
        if (
          startKey &&
          dateKey < startKey
        ) {
          return false;
        }

        if (
          endKey &&
          dateKey > endKey
        ) {
          return false;
        }

        return (
          state.scheduledDays[
            dateKey
          ]?.type ===
          "off"
        );
      }
    )
    .map(
      dateKey =>
        clone(
          state.scheduledDays[
            dateKey
          ]
        )
    );
}


// =====================================================
// CURRENT-WEEK COMPATIBILITY HELPERS
// =====================================================

function getTrainingDays(
  anchorDate =
    new Date()
) {
  return Object.values(
    getWeek(
      anchorDate
    )
  )
    .filter(
      dayState =>
        dayState.type !==
          "off"
    );
}


function getOffDays(
  anchorDate =
    new Date()
) {
  return Object.values(
    getWeek(
      anchorDate
    )
  )
    .filter(
      dayState =>
        dayState.type ===
          "off"
    );
}


// =====================================================
// SUMMARY
// =====================================================

function summarizeDays(
  days
) {
  const values =
    Array.isArray(
      days
    )
      ? days
      : [];

  const trainingDays =
    values.filter(
      day =>
        day?.type !==
        "off"
    );

  const offDays =
    values.filter(
      day =>
        day?.type ===
        "off"
    );

  const plannedDays =
    values.filter(
      day =>
        day?.isPlanned ===
        true
    );

  const unplannedDays =
    values.filter(
      day =>
        day?.isPlanned !==
        true
    );

  const exerciseCount =
    values.reduce(
      (
        total,
        day
      ) =>
        total +
        (
          day?.exercises
            ?.length ||
          0
        ),
      0
    );

  const plannedMinutes =
    values.reduce(
      (
        total,
        day
      ) =>
        total +
        (
          normalizePositiveNumber(
            day
              ?.estimatedDurationMinutes
          ) ||
          0
        ),
      0
    );


  return {
    trainingDayCount:
      trainingDays.length,

    offDayCount:
      offDays.length,

    plannedDayCount:
      plannedDays.length,

    unplannedDayCount:
      unplannedDays.length,

    exerciseCount,

    plannedMinutes
  };
}


function getWeekSummary(
  anchorDate =
    new Date()
) {
  const calendarWeek =
    getCalendarWeek(
      anchorDate
    );

  if (!calendarWeek) {
    return null;
  }

  return {
    weekKey:
      calendarWeek.weekKey,

    startDate:
      calendarWeek.startDate,

    endDate:
      calendarWeek.endDate,

    ...summarizeDays(
      calendarWeek.days
    )
  };
}


function getMonthSummary(
  yearOrDate =
    new Date(),
  monthNumber =
    null
) {
  const month =
    getMonth(
      yearOrDate,
      monthNumber
    );

  if (!month) {
    return null;
  }

  return {
    year:
      month.year,

    month:
      month.month,

    firstDate:
      month.firstDate,

    lastDate:
      month.lastDate,

    ...summarizeDays(
      month.days
    )
  };
}


/*
 * Existing UI expects getSummary().
 *
 * For backward compatibility, this reports the CURRENT WEEK,
 * while also exposing calendar-wide totals.
 */
function getSummary(
  anchorDate =
    new Date()
) {
  const weekSummary =
    getWeekSummary(
      anchorDate
    ) ||
    {
      trainingDayCount:
        0,

      offDayCount:
        7,

      plannedDayCount:
        0,

      unplannedDayCount:
        7,

      exerciseCount:
        0,

      plannedMinutes:
        0,

      weekKey:
        getCurrentWeekKey(),

      startDate:
        null,

      endDate:
        null
    };


  const allScheduled =
    getScheduledDateKeys()
      .map(
        dateKey =>
          state.scheduledDays[
            dateKey
          ]
      );


  const calendarTotals =
    summarizeDays(
      allScheduled
    );


  return {
    schemaVersion:
      state.schemaVersion,

    name:
      state.name,

    primaryGoalId:
      state.primaryGoalId,

    secondaryGoalIds:
      [
        ...state
          .secondaryGoalIds
      ],

    /*
     * Backward-compatible current-week values.
     */
    trainingDayCount:
      weekSummary
        .trainingDayCount,

    offDayCount:
      weekSummary
        .offDayCount,

    exerciseCount:
      weekSummary
        .exerciseCount,

    plannedMinutes:
      weekSummary
        .plannedMinutes,

    plannedDayCount:
      weekSummary
        .plannedDayCount,

    unplannedDayCount:
      weekSummary
        .unplannedDayCount,

    weekKey:
      weekSummary.weekKey,

    weekStartDate:
      weekSummary.startDate,

    weekEndDate:
      weekSummary.endDate,

    calendarScheduledDateCount:
      getScheduledDateKeys()
        .length,

    calendarTrainingDayCount:
      calendarTotals
        .trainingDayCount,

    calendarExerciseCount:
      calendarTotals
        .exerciseCount,

    lastAppliedTemplateId:
      state.metadata
        .lastAppliedTemplateId,

    lastAppliedTemplateWeek:
      state.metadata
        .lastAppliedTemplateWeek,

    builderVersion:
      state.metadata
        .builderVersion,

    updatedAt:
      state.metadata
        .updatedAt
  };
}


// =====================================================
// EMPTY WEEK COMPATIBILITY
// =====================================================

function createEmptyWeek(
  anchorDate =
    new Date()
) {
  const result = {};

  for (
    const item
    of getWeekDates(
      anchorDate
    )
  ) {
    result[
      item.weekday
    ] =
      createUnscheduledDay(
        item.date
      );
  }

  return result;
}


// =====================================================
// STATE NORMALIZATION
// =====================================================

function normalizeV3IncomingState(
  incoming
) {
  const fresh =
    createInitialState();

  const scheduledDays =
    {};

  const incomingDays =
    incoming.scheduledDays &&
    typeof incoming
      .scheduledDays ===
      "object"
      ? incoming.scheduledDays
      : {};


  for (
    const [
      rawDateKey,
      rawDay
    ]
    of Object.entries(
      incomingDays
    )
  ) {
    const dateKey =
      normalizeDateKey(
        rawDateKey
      );

    if (
      !dateKey ||
      !rawDay ||
      typeof rawDay !==
        "object"
    ) {
      continue;
    }

    try {
      scheduledDays[
        dateKey
      ] =
        makeScheduledDay({
          ...rawDay,

          date:
            dateKey
        });
    } catch (
      error
    ) {
      console.warn(
        `[ARI Training] Ignoring invalid scheduled day "${rawDateKey}".`,
        error
      );
    }
  }


  return {
    schemaVersion:
      SCHEMA_VERSION,

    version:
      VERSION,

    source:
      SOURCE,

    planId:
      normalizeId(
        incoming.planId
      ),

    name:
      normalizeText(
        incoming.name
      ) ||
      fresh.name,

    primaryGoalId:
      normalizeId(
        incoming
          .primaryGoalId
      ),

    secondaryGoalIds:
      uniqueStrings(
        incoming
          .secondaryGoalIds
      ),

    scheduledDays,

    metadata: {
      ...fresh.metadata,

      ...(
        incoming.metadata &&
        typeof incoming
          .metadata ===
          "object"
          ? clone(
              incoming.metadata
            )
          : {}
      )
    }
  };
}


// =====================================================
// V2 -> V3 MIGRATION
// =====================================================

function migrateV2State(
  legacyState,
  {
    targetWeek =
      new Date()
  } = {}
) {
  if (
    !legacyState ||
    typeof legacyState !==
      "object"
  ) {
    return null;
  }

  const migrated =
    createInitialState();

  migrated.planId =
    normalizeId(
      legacyState.planId
    );

  migrated.name =
    normalizeText(
      legacyState.name
    ) ||
    migrated.name;

  migrated.primaryGoalId =
    normalizeId(
      legacyState
        .primaryGoalId
    );

  migrated.secondaryGoalIds =
    uniqueStrings(
      legacyState
        .secondaryGoalIds
    );


  const start =
    getWeekStartDate(
      targetWeek
    );

  if (!start) {
    return null;
  }


  const legacyWeek =
    legacyState.week &&
    typeof legacyState
      .week ===
      "object"
      ? legacyState.week
      : {};


  for (
    let index = 0;
    index < 7;
    index += 1
  ) {
    const weekdayId =
      WEEKDAY_IDS[
        index
      ];

    const oldDay =
      legacyWeek[
        weekdayId
      ];

    if (
      !oldDay ||
      typeof oldDay !==
        "object"
    ) {
      continue;
    }

    const targetDate =
      formatDateKey(
        addDays(
          start,
          index
        )
      );


    /*
     * V2 plans generally contained explicit "off" entries
     * for every unused weekday.
     *
     * We preserve them during migration so the exact current
     * week survives migration.
     */
    migrated.scheduledDays[
      targetDate
    ] =
      makeScheduledDay({
        ...clone(
          oldDay
        ),

        date:
          targetDate,

        metadata: {
          ...(
            oldDay.metadata &&
            typeof oldDay
              .metadata ===
              "object"
              ? clone(
                  oldDay.metadata
                )
              : {}
          ),

          migratedFromRecurringWeek:
            true,

          migratedFromWeekday:
            weekdayId
        }
      });
  }


  migrated.metadata = {
    ...migrated.metadata,

    ...(
      legacyState.metadata &&
      typeof legacyState
        .metadata ===
        "object"
        ? clone(
            legacyState.metadata
          )
        : {}
    ),

    /*
     * IMPORTANT:
     *
     * sourceTemplateId from V2 is intentionally NOT treated
     * as the identity of the V3 calendar plan.
     *
     * This prevents a template from effectively owning or
     * locking future calendar weeks.
     */
    lastAppliedTemplateId:
      normalizeId(
        legacyState
          .metadata
          ?.sourceTemplateId
      ) ||
      null,

    sourceTemplateId:
      undefined,

    migratedFrom:
      `schema_v${
        legacyState.schemaVersion ||
        2
      }`,

    migratedAt:
      nowIso(),

    migratedIntoWeek:
      formatDateKey(
        start
      )
  };


  delete migrated
    .metadata
    .sourceTemplateId;


  return migrated;
}


// =====================================================
// GENERIC INCOMING STATE NORMALIZATION
// =====================================================

function normalizeIncomingState(
  incoming
) {
  if (
    !incoming ||
    typeof incoming !==
      "object"
  ) {
    return null;
  }


  /*
   * Native V3.
   */
  if (
    incoming.scheduledDays &&
    typeof incoming
      .scheduledDays ===
      "object"
  ) {
    return normalizeV3IncomingState(
      incoming
    );
  }


  /*
   * V2 / V1 weekly structure.
   */
  if (
    incoming.week &&
    typeof incoming.week ===
      "object"
  ) {
    return migrateV2State(
      incoming
    );
  }


  return normalizeV3IncomingState(
    incoming
  );
}


// =====================================================
// STATE REPLACEMENT
// =====================================================

function replaceState(
  nextState
) {
  if (
    !nextState ||
    typeof nextState !==
      "object"
  ) {
    return false;
  }

  const normalized =
    normalizeIncomingState(
      nextState
    );

  if (!normalized) {
    return false;
  }

  state.schemaVersion =
    SCHEMA_VERSION;

  state.version =
    VERSION;

  state.source =
    SOURCE;

  state.planId =
    normalized.planId;

  state.name =
    normalized.name;

  state.primaryGoalId =
    normalized
      .primaryGoalId;

  state.secondaryGoalIds =
    normalized
      .secondaryGoalIds;

  state.scheduledDays =
    normalized
      .scheduledDays;

  state.metadata =
    normalized.metadata;

  emit();

  return true;
}


// =====================================================
// LEGACY HYDRATION
// =====================================================

function hydrateLegacy() {
  if (
    typeof localStorage ===
      "undefined"
  ) {
    return false;
  }


  for (
    const legacyKey
    of LEGACY_STORAGE_KEYS
  ) {
    try {
      const raw =
        localStorage.getItem(
          legacyKey
        );

      if (!raw) {
        continue;
      }

      const parsed =
        JSON.parse(
          raw
        );

      const migrated =
        migrateV2State(
          parsed,
          {
            targetWeek:
              new Date()
          }
        );

      if (!migrated) {
        continue;
      }

      migrated.metadata
        .migratedFrom =
          legacyKey;

      migrated.metadata
        .migratedAt =
          nowIso();


      replaceState(
        migrated
      );

      persist();

      console.info(
        `[ARI Training] Migrated legacy workout plan "${legacyKey}" into calendar-plan V3.`
      );

      return true;
    } catch (
      error
    ) {
      console.warn(
        `[ARI Training] Workout plan could not migrate legacy key "${legacyKey}".`,
        error
      );
    }
  }


  return false;
}


// =====================================================
// PERSISTENCE
// =====================================================

function persist() {
  if (
    typeof localStorage ===
      "undefined"
  ) {
    return false;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        state
      )
    );

    return true;
  } catch (
    error
  ) {
    console.warn(
      "ARI Training calendar workout plan could not persist locally.",
      error
    );

    return false;
  }
}


function hydrate() {
  if (
    typeof localStorage ===
      "undefined"
  ) {
    return false;
  }

  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (raw) {
      const parsed =
        JSON.parse(
          raw
        );

      const replaced =
        replaceState(
          parsed
        );

      if (
        replaced
      ) {
        return true;
      }
    }

    return hydrateLegacy();
  } catch (
    error
  ) {
    console.warn(
      "ARI Training calendar workout plan could not hydrate.",
      error
    );

    return hydrateLegacy();
  }
}


function save() {
  touch();

  const persisted =
    persist();

  emit();

  return persisted;
}


// =====================================================
// RESET
// =====================================================

function reset() {
  const fresh =
    createInitialState();

  state.schemaVersion =
    fresh.schemaVersion;

  state.version =
    fresh.version;

  state.source =
    fresh.source;

  state.planId =
    fresh.planId;

  state.name =
    fresh.name;

  state.primaryGoalId =
    fresh.primaryGoalId;

  state.secondaryGoalIds =
    fresh.secondaryGoalIds;

  state.scheduledDays =
    fresh.scheduledDays;

  state.metadata =
    fresh.metadata;

  persist();
  emit();

  return true;
}


// =====================================================
// VALIDATION
// =====================================================

function validate() {
  const errors = [];
  const warnings = [];


  if (
    state.schemaVersion !==
      SCHEMA_VERSION
  ) {
    errors.push(
      `Plan schema version is ${state.schemaVersion}; expected ${SCHEMA_VERSION}.`
    );
  }


  if (
    !state.scheduledDays ||
    typeof state
      .scheduledDays !==
      "object" ||
    Array.isArray(
      state.scheduledDays
    )
  ) {
    errors.push(
      "scheduledDays must be an object keyed by YYYY-MM-DD."
    );

    return {
      valid:
        false,

      schemaVersion:
        SCHEMA_VERSION,

      errorCount:
        errors.length,

      warningCount:
        warnings.length,

      errors,

      warnings
    };
  }


  for (
    const [
      dateKey,
      dayState
    ]
    of Object.entries(
      state.scheduledDays
    )
  ) {
    if (
      !parseDateKey(
        dateKey
      )
    ) {
      errors.push(
        `Invalid scheduled date key "${dateKey}".`
      );

      continue;
    }


    if (
      !dayState ||
      typeof dayState !==
        "object"
    ) {
      errors.push(
        `Scheduled date "${dateKey}" has invalid day data.`
      );

      continue;
    }


    if (
      dayState.date !==
        dateKey
    ) {
      errors.push(
        `Scheduled date "${dateKey}" contains mismatched date "${dayState.date}".`
      );
    }


    const expectedWeekday =
      getWeekdayIdFromDate(
        dateKey
      );

    if (
      dayState.day !==
        expectedWeekday
    ) {
      errors.push(
        `Scheduled date "${dateKey}" reports weekday "${dayState.day}" but should be "${expectedWeekday}".`
      );
    }


    if (
      !VALID_DAY_TYPES
        .includes(
          dayState.type
        )
    ) {
      errors.push(
        `Scheduled date "${dateKey}" has invalid type "${dayState.type}".`
      );
    }


    if (
      dayState.type ===
        "off" &&
      (
        dayState.exercises
          ?.length ||
        0
      ) >
        0
    ) {
      warnings.push(
        `Off Day "${dateKey}" contains exercises.`
      );
    }


    const entryIds =
      new Set();


    for (
      const exercise
      of dayState.exercises ||
      []
    ) {
      if (
        !exercise
          ?.exerciseId
      ) {
        errors.push(
          `Scheduled date "${dateKey}" contains an exercise without exerciseId.`
        );
      }


      if (
        !exercise
          ?.entryId
      ) {
        errors.push(
          `Scheduled date "${dateKey}" contains exercise "${exercise?.exerciseId || "unknown"}" without entryId.`
        );

        continue;
      }


      if (
        entryIds.has(
          exercise.entryId
        )
      ) {
        errors.push(
          `Scheduled date "${dateKey}" contains duplicate entryId "${exercise.entryId}".`
        );
      } else {
        entryIds.add(
          exercise.entryId
        );
      }
    }
  }


  return {
    valid:
      errors.length ===
        0,

    schemaVersion:
      SCHEMA_VERSION,

    scheduledDateCount:
      getScheduledDateKeys()
        .length,

    errorCount:
      errors.length,

    warningCount:
      warnings.length,

    errors,

    warnings
  };
}


// =====================================================
// DIAGNOSTICS
// =====================================================

function getDiagnostics() {
  const currentWeek =
    getCalendarWeek(
      new Date()
    );

  const currentMonth =
    getMonth(
      new Date()
    );

  return {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    source:
      SOURCE,

    storageKey:
      STORAGE_KEY,

    legacyStorageKeys: [
      ...LEGACY_STORAGE_KEYS
    ],

    calendarModel:
      "date_based",

    weekStartsOn:
      "sunday",

    currentDate:
      formatDateKey(
        new Date()
      ),

    currentWeekKey:
      currentWeek
        ?.weekKey ||
      null,

    currentWeekEnd:
      currentWeek
        ?.endDate ||
      null,

    currentMonth:
      currentMonth
        ? {
            year:
              currentMonth.year,

            month:
              currentMonth.month
          }
        : null,

    scheduledDateCount:
      getScheduledDateKeys()
        .length,

    summary:
      getSummary(),

    validation:
      validate()
  };
}


// =====================================================
// PUBLIC STORE
// =====================================================

const AriTrainingWorkoutPlanStore =
  Object.freeze({
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    source:
      SOURCE,

    storageKey:
      STORAGE_KEY,

    legacyStorageKeys:
      LEGACY_STORAGE_KEYS,

    days:
      DAYS,

    weekdays:
      WEEKDAY_IDS,

    dayLabels:
      DAY_LABELS,


    // -----------------------------------------------
    // DATE UTILITIES
    // -----------------------------------------------

    formatDateKey,

    parseDateKey,

    normalizeDateKey,

    getWeekStartDate,

    getWeekEndDate,

    getWeekKey,

    getCurrentWeekKey,

    getWeekDates,

    getDisplayDateLabel,

    resolveDateReference,


    // -----------------------------------------------
    // READS
    // -----------------------------------------------

    getState,

    getScheduledDays,

    getScheduledDateKeys,

    hasScheduledDate,

    getDate,

    getDateRaw,

    getWeek,

    getCalendarWeek,

    getMonth,

    getDay,

    getExerciseByEntryId,

    getExerciseIndexByEntryId,

    getSummary,

    getWeekSummary,

    getMonthSummary,

    getTrainingDays,

    getOffDays,

    getTrainingDates,

    getOffDates,


    // -----------------------------------------------
    // PLAN METADATA
    // -----------------------------------------------

    setPlanName,

    setPrimaryGoal,

    setSecondaryGoals,


    // -----------------------------------------------
    // DATE MUTATIONS
    // -----------------------------------------------

    setDate,

    setDateType,

    setDateFocus,

    setDateTitle,

    setDateGoal,

    setDateSport,

    setDateDuration,

    scheduleOffDate,

    clearDate,

    clearWeek,

    clearMonth,

    copyWeek,


    // -----------------------------------------------
    // COMPATIBILITY DAY MUTATIONS
    // -----------------------------------------------

    setDay,

    setDayType,

    setDayFocus,

    setDayTitle,

    setDayGoal,

    setDaySport,

    setDayDuration,

    clearDay,


    // -----------------------------------------------
    // BUILDER
    // -----------------------------------------------

    setBuiltWorkoutForDate,

    setBuiltWorkout,


    // -----------------------------------------------
    // EXERCISE MUTATIONS
    // -----------------------------------------------

    addExerciseToDate,

    updateExerciseOnDate,

    updateExerciseByIdOnDate,

    removeExerciseFromDate,

    removeExerciseByIdFromDate,

    moveExerciseOnDate,

    moveExerciseByIdOnDate,


    // -----------------------------------------------
    // COMPATIBILITY EXERCISE MUTATIONS
    // -----------------------------------------------

    addExercise,

    updateExercise,

    updateExerciseById,

    removeExercise,

    removeExerciseById,

    moveExercise,

    moveExerciseById,


    // -----------------------------------------------
    // TEMPLATES
    // -----------------------------------------------

    applyTemplate,


    // -----------------------------------------------
    // STATE / MIGRATION
    // -----------------------------------------------

    replaceState,

    normalizeIncomingState,

    migrateV2State,

    hydrate,

    save,

    persist,

    reset,

    subscribe,

    validate,

    diagnostics:
      getDiagnostics
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

  Ari.training.workoutPlan =
    AriTrainingWorkoutPlanStore;

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

  STORAGE_KEY,
  LEGACY_STORAGE_KEYS,

  DAYS,
  WEEKDAY_IDS,
  DAY_LABELS,


  // Calendar helpers
  formatDateKey,
  parseDateKey,
  normalizeDateKey,
  getWeekStartDate,
  getWeekEndDate,
  getWeekKey,
  getCurrentWeekKey,
  getWeekDates,
  getDisplayDateLabel,
  resolveDateReference,


  // Day creation
  createEmptyWeek,
  createUnscheduledDay,
  makeScheduledDay,
  makeDay,


  // Exercise normalization
  normalizePlanExercise,


  // Reads
  getState,
  getScheduledDays,
  getScheduledDateKeys,
  hasScheduledDate,

  getDate,
  getDateRaw,

  getWeek,
  getCalendarWeek,
  getMonth,
  getDay,

  getExerciseByEntryId,
  getExerciseIndexByEntryId,

  getSummary,
  getWeekSummary,
  getMonthSummary,

  getTrainingDays,
  getOffDays,

  getTrainingDates,
  getOffDates,


  // Plan metadata
  setPlanName,
  setPrimaryGoal,
  setSecondaryGoals,


  // Date mutations
  setDate,
  setDateType,
  setDateFocus,
  setDateTitle,
  setDateGoal,
  setDateSport,
  setDateDuration,

  scheduleOffDate,

  clearDate,
  clearWeek,
  clearMonth,

  copyWeek,


  // Compatibility mutations
  setDay,
  setDayType,
  setDayFocus,
  setDayTitle,
  setDayGoal,
  setDaySport,
  setDayDuration,
  clearDay,


  // Builder
  setBuiltWorkoutForDate,
  setBuiltWorkout,


  // Date exercise mutations
  addExerciseToDate,
  updateExerciseOnDate,
  updateExerciseByIdOnDate,
  removeExerciseFromDate,
  removeExerciseByIdFromDate,
  moveExerciseOnDate,
  moveExerciseByIdOnDate,


  // Compatibility exercise mutations
  addExercise,
  updateExercise,
  updateExerciseById,
  removeExercise,
  removeExerciseById,
  moveExercise,
  moveExerciseById,


  // Templates
  applyTemplate,


  // Migration / persistence
  normalizeIncomingState,
  migrateV2State,
  replaceState,

  hydrate,
  save,
  persist,
  reset,

  subscribe,

  validate,
  getDiagnostics,

  AriTrainingWorkoutPlanStore
};

export default
  AriTrainingWorkoutPlanStore;