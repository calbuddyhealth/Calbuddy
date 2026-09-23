import { applyGoalEvent, createGoal, stableId } from "./conviction-learning.js";

export function goalStoreEnabled() { return process.env.ARI_CONVICTION_LEARNING_ENABLED !== "false"; }
export async function goalRequest(path, { method = "GET", body, query, fetcher = fetch } = {}) {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, reason: "persistence_unavailable", data: null };
  try {
    const response = await fetcher(`${url}/rest/v1/${path}${query ? `?${new URLSearchParams(query)}` : ""}`, {
      method, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(5000)
    });
    const data = await response.json().catch(() => null);
    return { ok: response.ok, data, reason: response.ok ? null : String(data?.code || `http_${response.status}`) };
  } catch (error) { return { ok: false, data: null, reason: error?.name || "persistence_failed" }; }
}

export async function loadGoals({ userId, goalId = null, includeClosed = false, limit = 100 } = {}) {
  return (await readGoalRecords({ userId, goalId, includeClosed, limit })).goals;
}

export async function readGoalRecords({ userId, goalId = null, includeClosed = false, limit = 100 } = {}) {
  if (!userId || !goalStoreEnabled()) return { ok: false, goals: [], reason: "goal_store_disabled_or_user_missing" };
  const query = { user_id: `eq.${userId}`, select: "state", order: "updated_at.desc", limit: String(Math.max(1, Math.min(200, Number(limit) || 100))) };
  if (goalId) query.id = `eq.${goalId}`;
  else if (!includeClosed) query.status = "in.(candidate,active,waiting,paused)";
  const r = await goalRequest("ari_vnext_project_goals", { query });
  return { ok: r.ok, goals: r.ok && Array.isArray(r.data) ? r.data.map(row => row.state).filter(state => state?.id) : [], reason: r.reason };
}

export async function saveGoalEvent({ userId, goalId, event, initial = null, request = goalRequest } = {}) {
  if (!userId || !goalStoreEnabled()) return { stored: false, reason: "goal_store_disabled_or_user_missing" };
  if (!goalId || !event?.id) return { stored: false, reason: "invalid_goal_event" };
  for (let retry = 0; retry < 4; retry++) {
    const read = await request("ari_vnext_project_goals", { query: { user_id: `eq.${userId}`, id: `eq.${goalId}`, select: "state", limit: "1" } });
    if (!read.ok) return { stored: false, reason: read.reason };
    const previous = read.data?.[0]?.state || initial;
    if (!previous) return { stored: false, reason: "goal_not_found" };
    const recorded = await request("ari_vnext_goal_events", { query: {
      user_id: `eq.${userId}`, event_id: `eq.${event.id}`, select: "goal_id", limit: "1"
    } });
    if (!recorded.ok) return { stored: false, reason: recorded.reason };
    if (recorded.data?.length) return recorded.data[0].goal_id === goalId
      ? { stored: true, duplicate: true, goal: previous }
      : { stored: false, reason: "event_id_conflict" };
    let state;
    try { state = applyGoalEvent(previous, event); }
    catch (error) { return { stored: false, reason: error.message }; }
    const saved = await request("rpc/ari_append_goal_event", { method: "POST", body: {
      p_user_id: userId, p_goal_id: goalId, p_expected_revision: Number(previous.revision || 0), p_state: state, p_event: event
    } });
    if (saved.ok && saved.data?.stored) return { stored: true, duplicate: saved.data.duplicate === true, goal: saved.data.state || state };
    if (saved.data?.reason !== "revision_conflict") return { stored: false, reason: saved.data?.reason || saved.reason };
  }
  return { stored: false, reason: "concurrent_update_retry_exhausted" };
}

export async function ensureGoal({ userId, input, actor = "ari", sourceId } = {}) {
  if (!userId || !goalStoreEnabled()) return { stored: false, reason: "goal_store_disabled_or_user_missing" };
  if (!input?.purpose || !input?.successCriteria) return { stored: false, reason: "goal_purpose_and_success_criteria_required" };
  const goalId = stableId(`${actor}:${input.title || input.purpose}`.toLowerCase());
  const existing = await loadGoals({ userId, goalId });
  if (existing[0]?.revision > 0) return { stored: true, existing: true, goal: existing[0] };
  if (existing.length) return saveCreationEvent(existing[0]);
  let goal;
  try { goal = createGoal(input, { id: goalId, actor }); }
  catch (error) { return { stored: false, reason: error.message }; }
  const inserted = await goalRequest("ari_vnext_project_goals", {
    method: "POST",
    body: {
      user_id: userId,
      id: goal.id,
      status: goal.status,
      revision: goal.revision,
      state: goal,
      created_at: goal.createdAt,
      updated_at: goal.updatedAt
    }
  });
  if (!inserted.ok) {
    // A concurrent creator may have won the unique key. Re-read before
    // reporting failure so both callers converge on the same goal.
    const concurrent = await loadGoals({ userId, goalId });
    if (concurrent.length) return concurrent[0].revision > 0
      ? { stored: true, existing: true, goal: concurrent[0] }
      : saveCreationEvent(concurrent[0]);
    return { stored: false, reason: inserted.reason || "goal_create_failed" };
  }
  return saveCreationEvent(goal);
  function saveCreationEvent(state) {
    return saveGoalEvent({ userId, goalId, initial: state, event: {
      id: `create:${goalId}`, type: "goal_created", at: state.createdAt, source: actor, sourceId,
      payload: { initialState: state }
    } });
  }
}

export async function exportGoalContinuity({ userId, offset = 0 } = {}) {
  if (!userId || !goalStoreEnabled()) return { version: "1.0.0", events: [], complete: false, reason: "goal_store_disabled_or_user_missing" };
  const result = await goalRequest("ari_vnext_goal_events", { query: { user_id: `eq.${userId}`, select: "*", order: "created_at.asc,event_id.asc", limit: "200", offset: String(Math.max(0, offset)) } });
  return { version: "1.0.0", portable: true, events: result.ok ? result.data : [], nextOffset: result.data?.length === 200 ? offset + 200 : null, complete: result.ok && result.data?.length < 200, reason: result.reason };
}
