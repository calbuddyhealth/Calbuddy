import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const runtime = fs.readFileSync(path.join(root, "js/native-runtime.js"), "utf8");
const mobileBuild = fs.readFileSync(path.join(root, "scripts/build-mobile-web.mjs"), "utf8");
const trainingHeader = fs.readFileSync(path.join(root, "assets/css/ari-training-native-header.css"), "utf8");
const settingsHeader = fs.readFileSync(path.join(root, "assets/css/native-settings-header.css"), "utf8");
const sharedHeader = fs.readFileSync(path.join(root, "assets/css/header.css"), "utf8");
const nutrition = fs.readFileSync(path.join(root, "assets/css/nutrition.css"), "utf8");
const goals = fs.readFileSync(path.join(root, "assets/css/goals.css"), "utf8");
const blockedUsers = fs.readFileSync(path.join(root, "assets/css/blocked-users.css"), "utf8");
const circlePrimaryNav = fs.readFileSync(path.join(root, "assets/css/ari-circle-primary-nav.css"), "utf8");

test("native runtime does not permanently fall back before Capacitor is ready", () => {
  assert.match(runtime, /function detectNativeRuntime\(/);
  assert.match(runtime, /protocol === "capacitor:" \|\| protocol === "ionic:"/);
  assert.match(runtime, /setInterval\(/);
  assert.match(runtime, /installNativeRuntime\(\)/);
});

test("Training native header protection remains wired", () => {
  assert.match(runtime, /ari-training-native-header\.css\?v=1\.0\.1/);
  assert.match(trainingHeader, /env\(safe-area-inset-top\)/);
  assert.match(trainingHeader, /\.ari-training-header/);
});

test("Account and Preferences native header protection remains wired", () => {
  assert.match(runtime, /native-settings-header\.css\?v=1\.0\.1/);
  assert.match(settingsHeader, /\.ari-account-header/);
  assert.match(settingsHeader, /\.ari-preference-settings__topbar/);
  assert.match(settingsHeader, /env\(safe-area-inset-top\)/);
});

test("Build 4 shared Home header keeps its iPhone safe area", () => {
  assert.match(sharedHeader, /\.ari-header-v4/);
  assert.match(sharedHeader, /max\(8px, env\(safe-area-inset-top\)\)/);
});

test("Build 4 Nutrition header keeps its iPhone safe area", () => {
  assert.match(nutrition, /main#ariNutritionApp/);
  assert.match(nutrition, /\.ari-nutrition-header/);
  assert.match(nutrition, /max\(18px, env\(safe-area-inset-top\)\)/);
});

test("Build 4 Goals header keeps its iPhone safe area", () => {
  assert.match(goals, /\.ari-goals-page/);
  assert.match(goals, /\.ari-goals-header/);
  assert.match(goals, /max\(18px, env\(safe-area-inset-top\)\)/);
});

test("Build 4 Blocked Users header keeps its iPhone safe area", () => {
  assert.match(blockedUsers, /\.ari-blocked-users-page \.ari-account-page/);
  assert.match(blockedUsers, /env\(safe-area-inset-top\)/);
  assert.match(blockedUsers, /\.ari-blocked-users-page \.ari-account-header/);
});

test("ARI Circle profile header and primary navigation stay below the iPhone safe area", () => {
  assert.match(circlePrimaryNav, /\.circle-v4-profile-header/);
  assert.match(circlePrimaryNav, /calc\(env\(safe-area-inset-top\) \+ 12px\)/);
  assert.match(circlePrimaryNav, /\.circle-soft-primary-nav/);
  assert.match(circlePrimaryNav, /calc\(64px \+ env\(safe-area-inset-top\)\)/);
});

test("mobile bundle injects the current native runtime", () => {
  assert.match(mobileBuild, /native-runtime\.js\?v=1\.4\.0/);
});
