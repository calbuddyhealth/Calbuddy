// Canonical Training proposal validation.
// Converts Ari's bounded workout requests into registry-validated Training actions.

import TrainingService from "./training-service.js?v=1.1.0";

const VERSION = "1.0.0";
const SOURCE = "training_proposal_service";

function clean(value = "", max = 200) { return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max); }
function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function clampNumber(value, min, max, fallback = null) { const parsed = number(value); if (parsed === null) return fallback; return Math.max(min, Math.min(max, parsed)); }
function clampInteger(value, min, max, fallback = null) { const parsed = clampNumber(value, min, max, fallback); return parsed === null ? null : Math.round(parsed); }
function failure(code, message, extra = {}) { return { success: false, code, message, ...extra }; }
function successAction(pending, action) {
  return { success: true, action: { ...action, status: "pending", vnext_action_id: pending.id, vnext_source_turn_id: pending.sourceTurnId, vnext_expires_at: pending.expiresAt || null } };
}
function hasWorkout(day) { return Boolean(day?.type === "workout" && Array.isArray(day?.exercises) && day.exercises.length > 0); }
function normalize(value = "") { return clean(value, 200).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function makeStableId(prefix = "ari") {
  try { if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`; } catch {}
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
function resolveFocus(value) {
  const text = clean(value, 160).toLowerCase();
  const rules = [
    { test: /chest|pec/, id: "chest", title: "Chest Workout", goal: "muscle_building", bodyParts: ["chest"] },
    { test: /back|lat/, id: "back", title: "Back Workout", goal: "muscle_building", bodyParts: ["back"] },
    { test: /shoulder|delt/, id: "shoulders", title: "Shoulder Workout", goal: "muscle_building", bodyParts: ["shoulders"] },
    { test: /bicep/, id: "biceps", title: "Biceps Workout", goal: "muscle_building", bodyParts: ["arms"] },
    { test: /tricep/, id: "triceps", title: "Triceps Workout", goal: "muscle_building", bodyParts: ["arms"] },
    { test: /leg|lower body|quad|hamstring|glute/, id: "legs", title: "Lower Body Workout", goal: "lower_body_strength", bodyParts: ["lower_body"] },
    { test: /core|abs/, id: "core", title: "Core Workout", goal: "core_strength", bodyParts: ["core"] },
    { test: /cardio|conditioning|run/, id: "cardio", title: "Cardio Workout", goal: "cardio", bodyParts: [] },
    { test: /mobility|stretch/, id: "mobility", title: "Mobility Workout", goal: "mobility", bodyParts: [] },
    { test: /full body|total body/, id: "full_body", title: "Full Body Workout", goal: "general_fitness", bodyParts: [] }
  ];
  return rules.find((rule) => rule.test.test(text)) || { id: "custom", title: text ? `${text.charAt(0).toUpperCase()}${text.slice(1)} Workout` : "Workout", goal: "general_fitness", bodyParts: [] };
}
function resolveWorkoutType(focus) { return focus?.goal === "cardio" ? "cardio" : focus?.goal === "mobility" ? "mobility" : "strength"; }
function toIso(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function fromIso(value) { const [y, m, d] = String(value).split("-").map(Number); return new Date(y, m - 1, d); }
function validDate(year, month, day) { const date = new Date(year, month - 1, day); return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? toIso(date) : null; }
function resolveDate(value) {
  const text = clean(value, 120).toLowerCase();
  const base = new Date(); base.setHours(0, 0, 0, 0);
  const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/); if (iso) return validDate(+iso[1], +iso[2], +iso[3]);
  const slash = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}|\d{2}))?\b/);
  if (slash) { let year = slash[3] ? +slash[3] : base.getFullYear(); if (year < 100) year += 2000; let result = validDate(year, +slash[1], +slash[2]); if (result && !slash[3] && fromIso(result) < base) result = validDate(year + 1, +slash[1], +slash[2]); return result; }
  if (/\btoday\b/.test(text)) return toIso(base);
  if (/\btomorrow\b/.test(text)) { const date = new Date(base); date.setDate(date.getDate() + 1); return toIso(date); }
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let target = 0; target < weekdays.length; target += 1) { const match = text.match(new RegExp(`\\b(next\\s+|this\\s+)?${weekdays[target]}\\b`)); if (!match) continue; let delta = (target - base.getDay() + 7) % 7; if (clean(match[1], 20).toLowerCase() === "next" && delta === 0) delta = 7; const date = new Date(base); date.setDate(date.getDate() + delta); return toIso(date); }
  return null;
}
function formatDateLabel(value) { try { return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(fromIso(value)); } catch { return value; } }
function resolveCanonicalExercise(controller, requestedName) {
  const query = clean(requestedName, 180); if (!query) return { accepted: false, exercise: null, match: "missing", candidates: [] };
  const exact = controller.getExercise(query); if (exact?.id) return { accepted: true, exercise: exact, match: "registry_exact", candidates: [exact.name] };
  const results = controller.findExercises(query, { limit: 4, fuzzy: true }) || []; const candidates = results.map((item) => item?.name).filter(Boolean).slice(0, 4); const top = results[0];
  if (!top?.id) return { accepted: false, exercise: null, match: "none", candidates };
  const reasons = Array.isArray(top.searchReasons) ? top.searchReasons : []; const score = Number(top.searchScore || 0);
  const accepted = reasons.some((reason) => ["exact_id", "exact_name", "exact_alias", "name_starts_with_query", "alias_starts_with_query"].includes(reason)) || score >= 6500;
  return { accepted, exercise: accepted ? top : null, match: accepted ? reasons[0] || `score_${score}` : "ambiguous", candidates };
}
function dayExerciseCandidates(controller, day) { return (Array.isArray(day?.exercises) ? day.exercises : []).map((entry) => clean(controller.getExercise(entry?.exerciseId)?.name || entry?.name || entry?.title || entry?.exerciseId, 160)).filter(Boolean).slice(0, 20); }
function resolveDayExercise(controller, day, queryValue) {
  const query = normalize(queryValue); const exercises = Array.isArray(day?.exercises) ? day.exercises : []; const candidates = dayExerciseCandidates(controller, day); if (!query) return { accepted: false, candidates };
  const direct = exercises.map((entry, index) => ({ entry, index, canonical: controller.getExercise(entry?.exerciseId) })).filter(({ entry, canonical }) => query === normalize(entry?.exerciseId) || query === normalize(canonical?.name || entry?.name || entry?.title));
  if (direct.length === 1) return { accepted: true, index: direct[0].index, exerciseId: clean(direct[0].entry?.exerciseId, 120), name: clean(direct[0].canonical?.name || direct[0].entry?.name || direct[0].entry?.title, 180) };
  const registry = resolveCanonicalExercise(controller, queryValue);
  if (registry.accepted && registry.exercise?.id) { const byId = exercises.map((entry, index) => ({ entry, index })).filter(({ entry }) => clean(entry?.exerciseId, 120) === registry.exercise.id); if (byId.length === 1) return { accepted: true, index: byId[0].index, exerciseId: registry.exercise.id, name: registry.exercise.name }; }
  const contains = exercises.map((entry, index) => ({ entry, index, canonical: controller.getExercise(entry?.exerciseId) })).filter(({ entry, canonical }) => normalize(canonical?.name || entry?.name || entry?.title).includes(query));
  if (contains.length === 1) return { accepted: true, index: contains[0].index, exerciseId: clean(contains[0].entry?.exerciseId, 120), name: clean(contains[0].canonical?.name || contains[0].entry?.name || contains[0].entry?.title, 180) };
  return { accepted: false, candidates };
}
function prescriptionPatch(args) { const patch = {}; if (args?.sets != null) patch.sets = clampInteger(args.sets, 1, 12, 3); if (args?.reps != null) patch.reps = clampInteger(args.reps, 1, 100, 10); if (args?.restSeconds != null) patch.restSeconds = clampNumber(args.restSeconds, 0, 900, 60); return patch; }
function makeWorkoutBlock(id, label, entries, startingIndex) { return { id, label, type: id, exercises: entries.map(({ request, exercise }, localIndex) => ({ entryId: makeStableId("vnext_entry"), exerciseId: exercise.id, role: startingIndex + localIndex === 0 ? "primary" : id === "main" ? "main" : "accessory", prescription: { mode: "sets_reps", sets: clampInteger(request?.sets, 1, 12, id === "main" ? 4 : 3), reps: clampInteger(request?.reps, 1, 100, id === "main" ? 8 : 12), restSeconds: clampNumber(request?.restSeconds, 0, 900, id === "main" ? 90 : 60), weight: null, intensity: null }, metadata: { source: "ari-vnext", canonicalName: exercise.name, userVisibleNotes: clean(request?.notes, 300) || null } })) }; }
function compactNotes(args) { return clean(args?.instruction || args?.notes, 600) || null; }
function describePatch(patch = {}) { return [patch.sets ? `${patch.sets} sets` : "", patch.reps ? `${patch.reps} reps` : "", patch.restSeconds !== undefined ? `${patch.restSeconds}s rest` : ""].filter(Boolean).join(", "); }
function editConfirmation(prepared, day) { const label = formatDateLabel(prepared.scheduledDate); if (prepared.operation === "add") return `Add ${prepared.replacementName} to ${label}'s workout?`; if (prepared.operation === "remove") return `Remove ${prepared.targetName} from ${label}'s workout?`; if (prepared.operation === "replace") return `Replace ${prepared.targetName} with ${prepared.replacementName} on ${label}?`; if (prepared.operation === "move") return `Move ${prepared.targetName} to position ${prepared.position} on ${label}?`; if (prepared.operation === "update" && prepared.targetName) { const details = describePatch(prepared.patch); return `Update ${prepared.targetName}${details ? ` to ${details}` : ""} on ${label}?`; } const details = [prepared.title ? `title to “${prepared.title}”` : "", prepared.durationMinutes ? `duration to ${prepared.durationMinutes} minutes` : ""].filter(Boolean).join(" and "); return `Update ${clean(day?.title, 140) || "the workout"}${details ? ` — ${details}` : ""} on ${label}?`; }

export async function prepareWorkoutPlan(pending = {}, args = object(pending?.arguments)) {
  const scheduledDate = resolveDate(args.dateText); if (!scheduledDate) return failure("workout_date_required", "An exact workout date is required before ARI XP can save the plan.");
  const requestedExercises = Array.isArray(args.exercises) ? args.exercises.slice(0, 16) : []; if (!requestedExercises.length) return failure("workout_exercises_required", "Ari needs at least one exercise before this workout can be saved.");
  const controller = await TrainingService.getController(); const focus = resolveFocus(args.focus); const duration = clampNumber(args.durationMinutes, 10, 180, 45); const difficulty = ["beginner", "intermediate", "advanced"].includes(clean(args.difficulty, 40).toLowerCase()) ? clean(args.difficulty, 40).toLowerCase() : "intermediate";
  const resolved = []; const unresolved = []; const usedIds = new Set();
  for (const request of requestedExercises) { const match = resolveCanonicalExercise(controller, request?.name); if (!match.accepted || !match.exercise?.id) { unresolved.push({ requested: clean(request?.name, 160), candidates: match.candidates }); continue; } if (usedIds.has(match.exercise.id)) continue; usedIds.add(match.exercise.id); resolved.push({ request, exercise: match.exercise, match: match.match }); }
  if (unresolved.length) return failure("workout_exercise_resolution_required", `I couldn't safely match ${unresolved.length} exercise${unresolved.length === 1 ? "" : "s"} to the ARI XP exercise library.`, { unresolved });
  if (!resolved.length) return failure("workout_exercises_unresolved", "None of the proposed exercises could be validated against ARI XP's exercise library.");
  const mainCount = resolved.length <= 3 ? resolved.length : Math.ceil(resolved.length * 0.6); const blocks = [makeWorkoutBlock("main", "Main Work", resolved.slice(0, mainCount), 0), makeWorkoutBlock("accessory", "Accessory Work", resolved.slice(mainCount), mainCount)].filter((block) => block.exercises.length);
  const workout = { workoutId: makeStableId("ari_vnext_workout"), title: focus.title, type: resolveWorkoutType(focus), goal: focus.goal, secondaryGoals: [], sport: null, difficulty, plannedDurationMinutes: duration, estimatedDurationMinutes: duration, bodyParts: [...focus.bodyParts], muscles: [], movementPatterns: [], equipment: [], blocks, notes: compactNotes(args), metadata: { version: VERSION, source: SOURCE, createdAt: new Date().toISOString(), requestedDurationMinutes: duration, selectedExerciseCount: resolved.length, registryValidated: true, vnextActionId: pending.id, vnextSourceTurnId: pending.sourceTurnId } };
  return { ...successAction(pending, { action_type: "plan_workout", source: SOURCE, payload: { scheduled_date: scheduledDate, focus_id: focus.id, existing_workout_mode: "create", requested_from_message: pending.sourceMessage || "", vnext_prebuilt_workout: workout }, confirmation_text: `Create Ari's ${focus.title} with ${resolved.length} validated exercise${resolved.length === 1 ? "" : "s"} for ${formatDateLabel(scheduledDate)}?` }), resolution: { registryValidated: true, exercises: resolved.map(({ request, exercise, match }) => ({ requested: clean(request?.name, 160), exerciseId: exercise.id, canonicalName: exercise.name, match })) } };
}

export async function prepareWorkoutEdit(pending = {}, args = object(pending?.arguments)) {
  const scheduledDate = resolveDate(args.dateText); if (!scheduledDate) return failure("workout_edit_date_required", "An exact workout date is required before Ari can edit the plan.");
  const controller = await TrainingService.getController(); const day = controller.getDate(scheduledDate); if (!hasWorkout(day)) return failure("workout_edit_target_missing", `There isn't a workout to edit on ${formatDateLabel(scheduledDate)}.`); if (day?.completed === true || day?.progress?.completed === true) return failure("workout_edit_completed_session", "A completed workout cannot be rewritten through Ari.");
  const operation = clean(args.operation, 40).toLowerCase(); const targetQuery = clean(args.exercise, 180); const target = targetQuery ? resolveDayExercise(controller, day, targetQuery) : null; const patch = prescriptionPatch(args);
  const prepared = { version: VERSION, scheduledDate, operation, targetExerciseId: target?.accepted ? target.exerciseId : null, targetIndex: target?.accepted ? target.index : null, targetName: target?.accepted ? target.name : null, replacementExerciseId: null, replacementName: null, patch, position: args.position == null ? null : clampInteger(args.position, 1, Math.max(1, day.exercises.length + 1), 1), durationMinutes: args.durationMinutes == null ? null : clampNumber(args.durationMinutes, 10, 240, null), title: clean(args.title, 160) || null, originalExerciseCount: day.exercises.length };
  if (["remove", "replace", "move"].includes(operation) || (operation === "update" && targetQuery)) { if (!target?.accepted) return failure("workout_edit_target_resolution_required", `I couldn't safely match ${targetQuery || "that exercise"} to one exercise in ${formatDateLabel(scheduledDate)}'s workout.`, { candidates: target?.candidates || dayExerciseCandidates(controller, day) }); }
  if (operation === "add" || operation === "replace") { const requested = clean(operation === "add" ? (args.replacementExercise || args.exercise) : args.replacementExercise, 180); const match = resolveCanonicalExercise(controller, requested); if (!match.accepted || !match.exercise?.id) return failure(operation === "add" ? "workout_edit_add_resolution_required" : "workout_edit_replacement_resolution_required", `I couldn't safely match ${requested || "that exercise"} to the ARI XP exercise library.`, { candidates: match.candidates }); if (match.exercise.id !== prepared.targetExerciseId && day.exercises.some((entry) => clean(entry?.exerciseId, 120) === match.exercise.id)) return failure(operation === "add" ? "workout_edit_duplicate_exercise" : "workout_edit_duplicate_replacement", `${match.exercise.name} is already in that workout.`); prepared.replacementExerciseId = match.exercise.id; prepared.replacementName = match.exercise.name; }
  if (operation === "update" && !targetQuery && !prepared.title && prepared.durationMinutes === null) return failure("workout_edit_update_fields_required", "Ari needs a specific workout detail to update.");
  return { ...successAction(pending, { action_type: "edit_workout", source: SOURCE, payload: { scheduled_date: scheduledDate, requested_from_message: pending.sourceMessage || "", vnext_prepared_edit: prepared }, confirmation_text: editConfirmation(prepared, day) }), resolution: { registryValidated: true, operation, scheduledDate, target: prepared.targetName ? { exerciseId: prepared.targetExerciseId, canonicalName: prepared.targetName, index: prepared.targetIndex } : null, replacement: prepared.replacementName ? { exerciseId: prepared.replacementExerciseId, canonicalName: prepared.replacementName } : null } };
}

export const TrainingProposalService = Object.freeze({ version: VERSION, source: SOURCE, prepareWorkoutPlan, prepareWorkoutEdit });
export default TrainingProposalService;
