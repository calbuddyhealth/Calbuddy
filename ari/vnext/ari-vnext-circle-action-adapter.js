// ARI vNext — trusted ARI Circle lifecycle action adapter.
// The model only proposes actions. Existing guarded Circle RPCs remain the
// authority for adult access, blocking, capacity, host ownership, and state.

(() => {
  "use strict";

  const VERSION = "1.1.0";
  const SOURCE = "ari_vnext_circle_action_adapter";
  const MISSION_PROGRESS_EVENTS = new Map();
  const ACTIONS = new Set([
    "create_circle_meetup",
    "join_circle_meetup",
    "leave_circle_meetup",
    "cancel_circle_meetup",
    "create_circle_mission",
    "join_circle_mission",
    "submit_circle_mission_progress"
  ]);

  function clean(value = "", max = 220) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function number(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function failure(code, message) {
    return { success: false, code, message };
  }

  function successAction(pending, action) {
    return {
      success: true,
      action: {
        ...action,
        source: action.source || SOURCE,
        vnext_action_id: pending?.id || null,
        vnext_source_turn_id: pending?.sourceTurnId || null
      }
    };
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "the selected time";
    try {
      return date.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return "the selected time";
    }
  }

  function stableUuid() {
    try {
      if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    } catch {}
    const bytes = new Uint8Array(16);
    try {
      globalThis.crypto?.getRandomValues?.(bytes);
    } catch {
      for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function missionProgressEventId(pending = {}, missionId = "") {
    const key = clean(pending?.id, 160) || `${clean(pending?.sourceTurnId, 160)}:${clean(missionId, 120)}`;
    if (MISSION_PROGRESS_EVENTS.has(key)) return MISSION_PROGRESS_EVENTS.get(key);
    const id = stableUuid();
    MISSION_PROGRESS_EVENTS.set(key, id);
    return id;
  }

  function missionUnit(objectiveType, supplied = "") {
    const explicit = clean(supplied, 40).toLowerCase();
    if (objectiveType === "count") return explicit || "actions";
    if (objectiveType === "distance") return explicit || "miles";
    if (objectiveType === "duration") return explicit || "minutes";
    return explicit;
  }

  function mapCircleAction(pending = {}, args = {}) {
    const name = clean(pending?.name, 120);

    if (name === "create_circle_meetup") {
      const title = clean(args?.title, 90);
      const activity = clean(args?.activity, 40).toLowerCase();
      const area = clean(args?.area, 100);
      const startsAt = clean(args?.startsAt, 80);
      const durationMinutes = Math.round(number(args?.durationMinutes) || 60);
      const guestSpots = Math.round(number(args?.guestSpots) || 3);
      const joinMode = clean(args?.joinMode, 20).toLowerCase() || "instant";

      if (!title || !activity || !area || !startsAt) {
        return failure("circle_meetup_fields_required", "Meetup title, activity, area, and start time are required.");
      }

      return successAction(pending, {
        action_type: "circle_create_meetup",
        payload: {
          requested_title: title,
          requested_activity: activity,
          requested_area: area,
          requested_starts_at: startsAt,
          requested_duration_minutes: durationMinutes,
          requested_max_participants: guestSpots + 1,
          requested_description: clean(args?.description, 500) || null,
          requested_join_mode: joinMode
        },
        confirmation_text: `Host “${title}” in ${area} at ${formatDate(startsAt)} for up to ${guestSpots} guest${guestSpots === 1 ? "" : "s"}?`
      });
    }

    if (name === "create_circle_mission") {
      const title = clean(args?.title, 90);
      const scope = clean(args?.scope, 20).toLowerCase();
      const category = clean(args?.category, 20).toLowerCase() || scope;
      const verificationMode = clean(args?.verificationMode, 30).toLowerCase();
      const objectiveType = clean(args?.objectiveType, 30).toLowerCase();
      const progressMode = clean(args?.progressMode, 30).toLowerCase();
      const targetValue = number(args?.targetValue);
      const endsAt = clean(args?.endsAt, 80);
      const maxParticipants = args?.maxParticipants === null || args?.maxParticipants === undefined
        ? null
        : Math.round(number(args?.maxParticipants) || 0);

      if (!title || !scope || !verificationMode || !objectiveType || !progressMode || !targetValue || !endsAt) {
        return failure("circle_mission_fields_required", "Mission title, scope, verification, objective, target, and end time are required.");
      }

      return successAction(pending, {
        action_type: "circle_create_mission",
        payload: {
          requested_title: title,
          requested_description: clean(args?.description, 1000) || null,
          requested_scope: scope,
          requested_category: category,
          requested_verification_mode: verificationMode,
          requested_objective_type: objectiveType,
          requested_progress_mode: progressMode,
          requested_target_value: targetValue,
          requested_unit: missionUnit(objectiveType, args?.unit),
          requested_ends_at: endsAt,
          requested_max_participants: maxParticipants
        },
        confirmation_text: `Create “${title}” as a ${progressMode} ${objectiveType} Mission with a target of ${targetValue} ${missionUnit(objectiveType, args?.unit)} ending ${formatDate(endsAt)}?`
      });
    }

    const meetupId = clean(args?.meetupId, 120);

    if (name === "join_circle_meetup") {
      if (!meetupId) return failure("circle_meetup_id_required", "A specific ARI Circle meetup is required.");
      return successAction(pending, {
        action_type: "circle_join_meetup",
        payload: { requested_meetup_id: meetupId },
        confirmation_text: "Join this ARI Circle meetup? If the host uses approval, this will send a join request instead."
      });
    }

    if (name === "leave_circle_meetup") {
      if (!meetupId) return failure("circle_meetup_id_required", "A specific ARI Circle meetup is required.");
      return successAction(pending, {
        action_type: "circle_leave_meetup",
        payload: { requested_meetup_id: meetupId },
        confirmation_text: "Leave this meetup? If your request is still pending or waitlisted, this will withdraw it instead."
      });
    }

    if (name === "cancel_circle_meetup") {
      if (!meetupId) return failure("circle_meetup_id_required", "A specific ARI Circle meetup is required.");
      return successAction(pending, {
        action_type: "circle_cancel_meetup",
        payload: { requested_meetup_id: meetupId },
        confirmation_text: "Cancel this hosted meetup for everyone?"
      });
    }

    const missionId = clean(args?.missionId, 120);

    if (name === "join_circle_mission") {
      if (!missionId) return failure("circle_mission_id_required", "A specific ARI Circle Mission is required.");
      return successAction(pending, {
        action_type: "circle_join_mission",
        payload: { requested_quest_id: missionId },
        confirmation_text: "Join this ARI Circle Mission?"
      });
    }

    if (name === "submit_circle_mission_progress") {
      if (!missionId) return failure("circle_mission_id_required", "A specific ARI Circle Mission is required.");
      const amount = number(args?.amount);
      if (!amount || amount <= 0) return failure("circle_mission_progress_required", "Mission progress must be greater than zero.");
      return successAction(pending, {
        action_type: "circle_submit_mission_progress",
        payload: {
          requested_quest_id: missionId,
          requested_amount: amount,
          requested_note: clean(args?.note, 500) || null,
          requested_client_event_id: missionProgressEventId(pending, missionId)
        },
        confirmation_text: `Submit ${amount} ${clean(args?.unit, 40) || "units"} of progress to this Mission?`
      });
    }

    return failure("unsupported_circle_action", `Unsupported ARI Circle action: ${name}.`);
  }

  function resolveClient() {
    return window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient || null;
  }

  async function rpc(name, params = {}) {
    const client = resolveClient();
    if (!client?.rpc) throw new Error("ARI Circle could not connect to its trusted data service.");
    const { data, error } = await client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function emitChanged(kind, result = null) {
    window.dispatchEvent(new CustomEvent("ari:circleChanged", {
      detail: { kind, result, source: SOURCE, version: VERSION }
    }));
  }

  async function executeCircleAction(action = {}) {
    const type = clean(action?.action_type || action?.type, 120);
    const payload = object(action?.payload);

    if (type === "circle_create_meetup") {
      const meetupId = await rpc("ari_circle_create_meetup", payload);
      if (!meetupId) return failure("circle_meetup_create_failed", "The meetup was not created.");
      const result = { meetupId: clean(meetupId, 120), resolution: "created" };
      emitChanged("meetup_created", result);
      return { success: true, result, reply: `Meetup created. You're the host and point of contact.` };
    }

    if (type === "circle_join_meetup") {
      const data = await rpc("ari_circle_apply_join_intent", payload);
      const resolution = clean(data?.resolution, 40) || "unchanged";
      const replies = {
        joined: "You're in. The Meetup Room is available now.",
        requested: "Join request sent to the host.",
        waitlisted: "You're on the waitlist.",
        declined: "That request has already been declined by the host.",
        already_joined: "You're already in this meetup.",
        already_host: "You're hosting this meetup."
      };
      emitChanged("meetup_join_state", data);
      return { success: true, result: data, reply: replies[resolution] || "Your meetup join state was updated." };
    }

    if (type === "circle_leave_meetup") {
      const data = await rpc("ari_circle_apply_leave_intent", payload);
      const resolution = clean(data?.resolution, 40) || "unchanged";
      const replies = {
        left: "You left the meetup.",
        withdrawn: "Your join request was withdrawn.",
        unchanged: "There wasn't an active meetup participation or request to remove."
      };
      emitChanged("meetup_leave_state", data);
      return { success: true, result: data, reply: replies[resolution] || "Your meetup participation was updated." };
    }

    if (type === "circle_cancel_meetup") {
      const cancelled = await rpc("ari_circle_cancel_meetup", payload);
      if (cancelled !== true) {
        return failure("circle_meetup_cancel_not_applied", "That meetup could not be cancelled. It may no longer be active or you may not be its host.");
      }
      const result = { meetupId: clean(payload?.requested_meetup_id, 120), resolution: "cancelled" };
      emitChanged("meetup_cancelled", result);
      return { success: true, result, reply: "Meetup cancelled." };
    }

    if (type === "circle_create_mission") {
      const missionId = await rpc("ari_circle_create_mission_v2", payload);
      if (!missionId) return failure("circle_mission_create_failed", "The Mission was not created.");
      const result = { missionId: clean(missionId, 120), resolution: "created" };
      emitChanged("mission_created", result);
      return { success: true, result, reply: "Mission created." };
    }

    if (type === "circle_join_mission") {
      const joined = await rpc("ari_circle_join_quest", payload);
      if (joined !== true) return failure("circle_mission_join_not_applied", "That Mission could not be joined.");
      const result = { missionId: clean(payload?.requested_quest_id, 120), resolution: "joined" };
      emitChanged("mission_joined", result);
      return { success: true, result, reply: "You're in the Mission." };
    }

    if (type === "circle_submit_mission_progress") {
      const data = await rpc("ari_circle_submit_mission_progress", payload);
      if (!data) return failure("circle_mission_progress_not_applied", "Mission progress was not submitted.");
      const result = object(data);
      emitChanged("mission_progress_submitted", result);
      return {
        success: true,
        result,
        reply: result?.status === "verified" ? "Mission progress added and verified." : "Mission progress submitted for verification."
      };
    }

    return failure("unsupported_circle_executor_action", `Unsupported Circle executor action: ${type}.`);
  }

  function patchVNextAdapter() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter) return false;
    if (adapter.__circleLifecycleV1) return true;

    const originalPrepare = adapter.prepareCalBuddyAction.bind(adapter);
    const originalToCalBuddy = adapter.toCalBuddyAction.bind(adapter);

    adapter.prepareCalBuddyAction = async function patchedPrepare(pendingAction = {}) {
      const name = clean(pendingAction?.name, 120);
      if (ACTIONS.has(name)) return mapCircleAction(pendingAction, object(pendingAction?.arguments));
      return await originalPrepare(pendingAction);
    };

    adapter.toCalBuddyAction = function patchedSyncMap(pendingAction = {}) {
      const name = clean(pendingAction?.name, 120);
      if (ACTIONS.has(name)) return mapCircleAction(pendingAction, object(pendingAction?.arguments));
      return originalToCalBuddy(pendingAction);
    };

    Object.defineProperty(adapter, "__circleLifecycleV1", {
      configurable: false,
      enumerable: false,
      value: true
    });
    return true;
  }

  function patchCalBuddyExecutor() {
    window.CalBuddy = window.CalBuddy || {};
    if (window.CalBuddy.__circleLifecycleExecutorV1) return true;
    if (typeof window.CalBuddy.executeAction !== "function") return false;

    const originalExecute = window.CalBuddy.executeAction.bind(window.CalBuddy);

    window.CalBuddy.executeAction = async function patchedExecute(action = {}) {
      const type = clean(action?.action_type || action?.type, 120);
      if (!type.startsWith("circle_")) return await originalExecute(action);
      return await executeCircleAction(action);
    };

    Object.defineProperty(window.CalBuddy, "__circleLifecycleExecutorV1", {
      configurable: false,
      enumerable: false,
      value: true
    });
    return true;
  }

  function install() {
    const adapterReady = patchVNextAdapter();
    const executorReady = patchCalBuddyExecutor();
    if (!adapterReady || !executorReady) return false;

    window.AriVNextCircleActionAdapter = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true,
      prepare: mapCircleAction,
      execute: executeCircleAction
    });

    window.dispatchEvent(new CustomEvent("ari:vnextCircleActionReady", {
      detail: { version: VERSION }
    }));
    return true;
  }

  if (!install()) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 300) window.clearInterval(timer);
    }, 25);
  }
})();