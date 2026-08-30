import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const quickLog = await readFile(
  new URL("../js/training/activity-quick-log.js", import.meta.url),
  "utf8"
);

const training = await readFile(
  new URL("../js/ari-training.js", import.meta.url),
  "utf8"
);

test("manual and Ari activity logs surface as completed Training activities", () => {
  assert.match(quickLog, /const VERSION = "1\.2\.0"/);
  assert.match(quickLog, /COMPLETED ACTIVITY/);
  assert.match(quickLog, /activities\.length === 1\s*\? \(activities\[0\]\?\.activity_name \|\| "Completed activity"\)/);
});

test("completed activity projection opens once per selected date instead of hiding the entry", () => {
  assert.match(quickLog, /const revealedActivityDates = new Set\(\)/);
  assert.match(quickLog, /!revealedActivityDates\.has\(date\)/);
  assert.match(quickLog, /card\.open = true/);
  assert.match(quickLog, /window\.addEventListener\("ari:activityLogged", \(\) => void renderManualActivities\(\{ open: true \}\)\)/);
});

test("activity projection remains separate from planned workout completion storage", () => {
  assert.doesNotMatch(quickLog, /\.from\("ari_workout_sessions"\)/);
  assert.doesNotMatch(quickLog, /todaysTrainingCompletedDay[^\n]*hidden\s*=\s*false/);
  assert.match(training, /\.from\(\s*"ari_workout_sessions"\s*\)/);
});
