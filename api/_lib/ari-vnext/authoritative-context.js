// ARI vNext — authoritative user/profile context resolver.
// Live account/profile state outranks browser cache and learned world-model copies.

export const ARI_AUTHORITATIVE_CONTEXT_VERSION = "1.2.0";
const READ_TIMEOUT_MS = 900;
const USER_PROFILE_FIELDS = ["displayName", "age", "dateOfBirth", "sex", "height", "activityLevel"];
const GOAL_PROFILE_FIELDS = ["dailyGoal", "currentWeight", "goalWeight", "goalType", "weeklyWeightChangeGoal", "activityLevel"];
const WORLD_MODEL_VOLATILE_GOAL_FIELDS = [
  ...GOAL_PROFILE_FIELDS,
  "caloriesConsumed",
  "caloriesBurned",
  "caloriesLeft"
];

export async function mergeAuthoritativeAriContext({ userId, context = {} } = {}) {
  const id = clean(userId, 200);
  const incoming = context && typeof context === "object" && !Array.isArray(context) ? clone(context) : {};
  if (!id) return { context: incoming, profileLoaded: false, accountStateLoaded: false };

  const config = supabaseConfig();
  if (!config) return { context: incoming, profileLoaded: false, accountStateLoaded: false };

  const [profileResult, accountResult] = await Promise.allSettled([
    readProfile(config, id),
    readAccountState(config, id)
  ]);
  const profile = profileResult.status === "fulfilled" ? profileResult.value : null;
  const accountState = accountResult.status === "fulfilled" ? accountResult.value : null;
  const profileLoaded = Boolean(profile?.id);
  const accountStateLoaded = Boolean(accountState?.user_id);

  if (!profileLoaded && !accountStateLoaded) {
    return {
      context: {
        ...incoming,
        authoritativeContext: {
          version: ARI_AUTHORITATIVE_CONTEXT_VERSION,
          source: "client_fallback",
          profileLoaded: false,
          accountStateLoaded: false,
          volatileFieldsAreLive: false
        }
      },
      profileLoaded: false,
      accountStateLoaded: false
    };
  }

  const incomingUser = object(incoming.user);
  const incomingGoals = object(incoming.goals);
  const birthDate = clean(accountState?.date_of_birth || profile?.birthday, 40) || null;
  const computedAge = ageFromDateOfBirth(birthDate);
  const authoritativeAge = computedAge ?? finiteOrNull(profile?.age);
  const currentWeight = firstFinite(profile?.weight_lbs, profile?.current_weight);
  const goalWeight = firstFinite(profile?.target_weight_lbs, profile?.goal_weight);
  const height = firstFinite(profile?.height_in, profile?.height);
  const dailyGoal = firstFinite(profile?.daily_calorie_goal);
  const activityLevel = firstValue(profile?.activity_level);
  const goalType = firstValue(profile?.goal, profile?.goal_type);
  const sex = firstValue(profile?.sex, profile?.gender);
  const displayName = firstValue(profile?.display_name, profile?.name);
  const weeklyWeightChangeGoal = firstFinite(profile?.weekly_weight_change_goal);

  const authoritativeUser = {
    displayName,
    age: authoritativeAge,
    dateOfBirth: birthDate,
    sex,
    height,
    activityLevel
  };
  const authoritativeGoals = {
    dailyGoal,
    currentWeight,
    goalWeight,
    goalType,
    weeklyWeightChangeGoal,
    activityLevel
  };

  let mergedUser = { ...incomingUser, id };
  let mergedGoals = { ...incomingGoals };

  if (profileLoaded) {
    mergedUser = replaceFields(mergedUser, authoritativeUser, USER_PROFILE_FIELDS);
    mergedGoals = replaceFields(mergedGoals, authoritativeGoals, GOAL_PROFILE_FIELDS);
  } else if (accountStateLoaded) {
    mergedUser = replaceFields(mergedUser, {
      age: authoritativeAge,
      dateOfBirth: birthDate
    }, ["age", "dateOfBirth"]);
  }
  mergedUser.id = id;

  // caloriesLeft may have been computed with a stale client-side daily target.
  // Recompute it only when all components are available. If the authoritative
  // profile has no target, remove the stale derived value instead of preserving it.
  const consumed = finiteOrNull(incomingGoals.caloriesConsumed);
  const burned = finiteOrNull(incomingGoals.caloriesBurned);
  if (profileLoaded && dailyGoal === null) {
    delete mergedGoals.caloriesLeft;
  } else if (dailyGoal !== null && consumed !== null && burned !== null) {
    mergedGoals.caloriesLeft = Math.max(dailyGoal - consumed + burned, 0);
  }

  return {
    context: {
      ...incoming,
      user: mergedUser,
      goals: mergedGoals,
      authoritativeContext: {
        version: ARI_AUTHORITATIVE_CONTEXT_VERSION,
        source: profileLoaded ? "supabase_profile" : "supabase_account_state",
        profileLoaded,
        accountStateLoaded,
        ageSource: computedAge !== null ? "account_or_profile_birth_date" : authoritativeAge !== null ? "profile_age" : null,
        volatileFieldsAreLive: profileLoaded,
        authoritativeUserFields: profileLoaded ? USER_PROFILE_FIELDS : ["age", "dateOfBirth"],
        authoritativeGoalFields: profileLoaded ? GOAL_PROFILE_FIELDS : [],
        precedence: [
          "live_profile_and_account_state",
          "current_conversation",
          "durable_memory",
          "learned_user_model",
          "client_cache"
        ]
      }
    },
    profileLoaded,
    accountStateLoaded,
    profile,
    accountState
  };
}

export function reconcileWorldModelWithAuthoritativeContext(model = null, context = {}) {
  if (!model || typeof model !== "object") return model;
  const metadata = object(context?.authoritativeContext);
  if (metadata.profileLoaded !== true && metadata.accountStateLoaded !== true) return model;

  const next = clone(model);
  const liveUser = object(context?.user);
  const liveGoals = object(context?.goals);

  if (metadata.profileLoaded === true) {
    next.identity = replaceFields(object(next.identity), liveUser, ["id", ...USER_PROFILE_FIELDS]);
    next.goals = {
      ...object(next.goals),
      current: replaceFields(object(next.goals?.current), liveGoals, WORLD_MODEL_VOLATILE_GOAL_FIELDS)
    };
  } else {
    next.identity = replaceFields(object(next.identity), liveUser, ["id", "age", "dateOfBirth"]);
  }

  next.sourceSummary = {
    ...object(next.sourceSummary),
    profile: metadata.profileLoaded === true || Boolean(next.sourceSummary?.profile),
    authoritativeProfileReconciled: true,
    authoritativeContextVersion: ARI_AUTHORITATIVE_CONTEXT_VERSION,
    volatileAppStateSource: "live_context_not_learned_truth"
  };
  return next;
}

async function readProfile(config, userId) {
  const params = new URLSearchParams({
    select: "id,name,display_name,age,birthday,height_in,height,weight_lbs,current_weight,target_weight_lbs,goal_weight,daily_calorie_goal,sex,gender,activity_level,goal,goal_type,weekly_weight_change_goal,updated_at",
    id: `eq.${userId}`,
    limit: "1"
  });
  return await readSingle(`${config.url}/rest/v1/profiles?${params.toString()}`, config.key);
}

async function readAccountState(config, userId) {
  const params = new URLSearchParams({
    select: "user_id,status,date_of_birth,age_verified_at,updated_at",
    user_id: `eq.${userId}`,
    limit: "1"
  });
  return await readSingle(`${config.url}/rest/v1/ari_account_state?${params.toString()}`, config.key);
}

async function readSingle(url, key) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), READ_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: serverHeaders(key),
      signal: controller.signal
    });
    if (!response.ok) return null;
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows[0] || null : rows || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function ageFromDateOfBirth(value) {
  const raw = clean(value, 40);
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const now = new Date();
  let age = now.getUTCFullYear() - year;
  const beforeBirthday =
    now.getUTCMonth() + 1 < month ||
    (now.getUTCMonth() + 1 === month && now.getUTCDate() < day);
  if (beforeBirthday) age -= 1;
  return Number.isInteger(age) && age >= 0 && age <= 130 ? age : null;
}

function replaceFields(target = {}, source = {}, fields = []) {
  const next = object(target);
  const input = source && typeof source === "object" && !Array.isArray(source) ? source : {};
  for (const field of fields) {
    const value = input[field];
    if (value === null || value === undefined || value === "") {
      delete next[field];
    } else {
      next[field] = cloneValue(value);
    }
  }
  return next;
}

function cloneValue(value) {
  if (value === null || typeof value !== "object") return value;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function firstFinite(...values) {
  for (const value of values) {
    const number = finiteOrNull(value);
    if (number !== null) return number;
  }
  return null;
}

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstValue(...values) {
  for (const value of values) {
    const text = clean(value, 500);
    if (text) return text;
  }
  return null;
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? clone(value) : {};
}

function clone(value) {
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
  return url && key ? { url, key } : null;
}

function serverHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json"
  };
}

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
