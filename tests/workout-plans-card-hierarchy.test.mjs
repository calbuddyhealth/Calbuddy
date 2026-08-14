import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const bootstrap = readFileSync("supabase-config.js", "utf8");
const polish = readFileSync("js/training/workout-plans-card-polish.js", "utf8");
const css = readFileSync("assets/css/workout-plans-card-hierarchy.css", "utf8");

test("Workout Plans loads the isolated My Week hierarchy layer", () => {
  assert.match(bootstrap, /workout-plans\.html/);
  assert.match(bootstrap, /workout-plans-card-polish\.js\?v=1\.0\.0/);
  assert.match(bootstrap, /loadWorkoutPlanCardPolish\(\)/);
});

test("My Week cards distinguish date, title, details and status", () => {
  assert.match(polish, /`\$\{match\[1\]\} • \$\{match\[2\]\}`/);
  assert.match(polish, /kind: "custom", label: "CUSTOM"/);
  assert.match(polish, /kind: "endurance", label: "ENDURANCE"/);
  assert.match(polish, /kind: "recovery", label: "RECOVERY"/);
  assert.match(polish, /kind: "off", label: "OFF DAY"/);
  assert.match(polish, /kind: "workout", label: "WORKOUT"/);
  assert.match(polish, /summary\.textContent = "Build your session"/);
  assert.match(polish, /summary\.textContent = "Rest and recover"/);
});

test("My Week visual hierarchy keeps the workout name dominant", () => {
  assert.match(css, /\.workout-day-card__day[\s\S]*font-size:\s*0\.58rem/);
  assert.match(css, /\.workout-day-card__day[\s\S]*color:\s*#64748b/);
  assert.match(css, /\.workout-day-card__title[\s\S]*font-size:\s*clamp\(1\.02rem, 4\.6vw, 1\.22rem\)/);
  assert.match(css, /\.workout-day-card__title[\s\S]*color:\s*#071326/);
  assert.match(css, /data-plan-kind="custom"/);
  assert.match(css, /data-plan-kind="endurance"/);
  assert.match(css, /data-plan-kind="off"/);
});
