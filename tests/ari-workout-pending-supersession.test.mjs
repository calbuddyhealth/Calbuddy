import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "ari/actions/ari-workout-plan-action.js"), "utf8");

test("workout action source remains syntactically valid JavaScript", () => {
  assert.doesNotThrow(() => new Function(source));
});

test("pending workout revisions are detected before normal workout routing", () => {
  assert.match(source, /function getPendingWorkout\(\)/);
  assert.match(source, /function isPendingWorkoutRevision\(/);
  assert.match(source, /const pendingWorkout = getPendingWorkout\(\);[\s\S]*isPendingWorkoutRevision\(message, decision, pendingWorkout\)/);
});

test("revisions inherit prior workout context instead of falling back to defaults", () => {
  assert.match(source, /function mergePendingWorkoutRequest\(/);
  assert.match(source, /priorPayload\.focus_id \|\| priorOptions\.focusId/);
  assert.match(source, /entities\.duration_minutes = Number\(priorOptions\.durationMinutes\)/);
  assert.match(source, /entities\.difficulty = clean\(priorOptions\.difficulty\)/);
  assert.match(source, /resolveRequestedDate\([\s\S]*\|\| clean\(priorPayload\.scheduled_date\)/);
});

test("old workout proposal is cancelled before the revised proposal is created", () => {
  const cancelIndex = source.indexOf("CalBuddy.cancelPendingAction?.();");
  const replacementIndex = source.indexOf("const replacement = buildPendingActionFromOptions", cancelIndex);
  const createIndex = source.indexOf("CalBuddy.createPendingAction(replacement)", replacementIndex);
  assert.ok(cancelIndex >= 0, "canonical cancel call must exist");
  assert.ok(replacementIndex > cancelIndex, "replacement must be built after cancellation");
  assert.ok(createIndex > replacementIndex, "replacement pending action must be created last");
});

test("replacement confirmation is tied to revised duration", () => {
  assert.match(source, /const durationLabel = Number\.isFinite\(duration\) \? `\$\{duration\}-minute ` : ""/);
  assert.match(source, /confirmation_text: `\$\{verb\} \$\{durationLabel\}\$\{title\}\$\{suffix\}`/);
});

test("unrelated turns do not auto-cancel a pending workout", () => {
  assert.match(source, /if \(!pending \|\| !isTrainingDecision\(decision\)\) return false/);
  assert.match(source, /if \(!isTrainingDecision\(decision\)\) return await previousAskInternal\(input\)/);
});
