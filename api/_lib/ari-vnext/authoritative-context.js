// ARI vNext — authoritative user/profile context resolver.
// Live account/profile state outranks browser cache and learned world-model copies.

export const ARI_AUTHORITATIVE_CONTEXT_VERSION = "1.1.0";
const READ_TIMEOUT_MS = 900;

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
          accountStateLoaded: false
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

  const authoritativeUser = compact({
    id,
    displayName,
    age: authoritativeAge,
    dateOfBirth: birthDate,
    sex,
    height,
    activityLevel
  });
  const authoritativeGoals = compact({
    dailyGoal,
    currentWeight,
    goalWeight,
    goalType,
    weeklyWeightChangeGoal,
    activityLevel
  });

  const mergedUser = { ...incomingUser, ...authoritativeUser, id };
  const mergedGoals = { ...incomingGoals, ...authoritativeGoals };

  // caloriesLeft may have been computed with a stale client-side daily target.
  // Recompute it only when all components are available; otherwise preserve the
  // live ledger value already supplied by the client.
  const consumed = finiteOrNull(incomingGoals.caloriesConsumed);
  const burned = finiteOrNull(incomingGoals.caloriesBurned);
  if (dailyGoal !== null && consumed !== null && burned !== null) {
    mergedGoals.caloriesLeft = Math.max(dailyGoal - consumed + burned, 0);
  }

  return {
    context: {
      ...incoming,
      user: mergedUser,
      goals: mergedGoals,
      authoritativeContext: {
        version: ARI_AUTHORITATIVE_CONTEXT_VERSION,
        source: "supabase_profile",
        profileLoaded,
        accountStateLoaded,
        ageSource: computedAge !== null ? "account_or_profile_birth_date" : authoritativeAge !== null ? "profile_age" : null,
        volatileFieldsAreLive: true,
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
  next.identity = { ...object(next.identity), ...liveUser };
  next.goals = {
    ...object(next.goals),
    current: { ...object(next.goals?.current), ...liveGoals }
  };
  next.sourceSummary = {
    ...object(next.sourceSummary),
    profile: true,
    authoritativeProfileReconciled: true,
    authoritativeContextVersion: ARI_AUTHORITATIVE_CONTEXT_VERSION
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

function compact(value = {}) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== null && item !== undefined && item !== "")
  );
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
