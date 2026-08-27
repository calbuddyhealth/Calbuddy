import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const hotfix = fs.readFileSync("js/ari-latency-hotfix.js", "utf8");
const home = fs.readFileSync("home.html", "utf8");

test("ordinary conversation uses lightweight authoritative profile context instead of full app hydration", () => {
  assert.match(hotfix, /needsAuthoritativeAppContext/);
  assert.match(hotfix, /loadLiveProfile\(session\)/);
  assert.match(hotfix, /profile\.weight_lbs[\s\S]*calbuddyCurrentWeight/);
  assert.match(hotfix, /profile\.daily_calorie_goal[\s\S]*calbuddyDailyCalorieGoal/);
  assert.match(hotfix, /ari_light_chat_profile_v2/);
  assert.match(hotfix, /ari_light_chat_fallback_v2/);
  assert.match(hotfix, /return await originalGetUserContext/);
  assert.match(hotfix, /return context;/);
});

test("stored-state and mutation questions retain authoritative context", () => {
  assert.match(hotfix, /log\|add\|save\|record\|edit\|delete\|remove\|change\|update\|undo\|complete\|mark/);
  assert.match(hotfix, /what did i eat/);
  assert.match(hotfix, /calories left/);
});

test("ordinary chat cannot trigger browser GitHub owner verification", () => {
  assert.match(hotfix, /originalVerifyOwnerSession/);
  assert.match(hotfix, /message && !isDeveloperMessage\(message\)/);
  assert.match(hotfix, /ownerSessionCache\?\.isOwner === true/);
});

test("Home startup initiative scanning is suppressed while latency hotfix is active", () => {
  assert.match(hotfix, /home_latency_guard/);
  assert.match(hotfix, /client\.check = async function/);
  assert.match(hotfix, /languageModelCalls:\s*0/);
});

test("Home requests current resilience and authoritative latency assets", () => {
  assert.match(home, /home-resilience\.js\?v=1\.3\.4/);
  assert.match(home, /ari-latency-hotfix\.js\?v=1\.1\.0/);
});
