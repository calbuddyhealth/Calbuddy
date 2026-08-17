import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const runtime = fs.readFileSync(path.join(root, "js/native-runtime.js"), "utf8");
const mobileBuild = fs.readFileSync(path.join(root, "scripts/build-mobile-web.mjs"), "utf8");
const capacitorConfig = JSON.parse(fs.readFileSync(path.join(root, "capacitor.config.json"), "utf8"));
const trainingHeader = fs.readFileSync(path.join(root, "assets/css/ari-training-native-header.css"), "utf8");
const settingsHeader = fs.readFileSync(path.join(root, "assets/css/native-settings-header.css"), "utf8");
const sharedHeader = fs.readFileSync(path.join(root, "assets/css/header.css"), "utf8");
const nutrition = fs.readFileSync(path.join(root, "assets/css/nutrition.css"), "utf8");
const goals = fs.readFileSync(path.join(root, "assets/css/goals.css"), "utf8");
const blockedUsers = fs.readFileSync(path.join(root, "assets/css/blocked-users.css"), "utf8");
const circlePrimaryNav = fs.readFileSync(path.join(root, "assets/css/ari-circle-primary-nav.css"), "utf8");

test("iOS owns the native safe area at the UIScrollView layer", () => {
  assert.equal(capacitorConfig?.ios?.contentInset, "always");
});

test("native runtime does not permanently fall back before Capacitor is ready", () => {
  assert.match(runtime, /function detectNativeRuntime\(/);
  assert.match(runtime, /protocol === "capacitor:" \|\| protocol === "ionic:"/);
  assert.match(runtime, /setInterval\(/);
  assert.match(runtime, /installNativeRuntime\(\)/);
});

test("native runtime no longer adds a second CSS safe-area shim", () => {
  assert.doesNotMatch(runtime, /native-safe-area\.css/);
  assert.doesNotMatch(runtime, /ensureViewportSafeArea/);
  assert.match(runtime, /ios\.contentInset = "always"/);
});

test("Training keeps Build 4 native sizing inside the iOS safe content area", () => {
  assert.match(runtime, /ari-training-native-header\.css\?v=1\.1\.0/);
  assert.match(trainingHeader, /\.ari-training-header/);
  assert.match(trainingHeader, /padding:\s*\n\s*8px\s*\n\s*0\s*\n\s*12px/);
  assert.doesNotMatch(trainingHeader, /safe-area-inset-top/);
});

test("Account-family and Preferences keep Build 4 native sizing inside the iOS safe content area", () => {
  assert.match(runtime, /native-settings-header\.css\?v=1\.1\.0/);
  for (const page of [
    "account",
    "ari-preference-settings",
    "privacy-memory",
    "notification-settings",
    "help-safety",
    "owner-moderation",
    "support-ari",
    "blocked-users",
    "community-guidelines"
  ]) {
    assert.match(runtime, new RegExp(page.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(settingsHeader, /\.ari-account-page/);
  assert.match(settingsHeader, /padding-top:\s*\n\s*24px/);
  assert.match(settingsHeader, /\.ari-account-header/);
  assert.match(settingsHeader, /\.ari-preference-settings__topbar/);
  assert.match(settingsHeader, /min-height:\s*\n\s*76px/);
  assert.doesNotMatch(settingsHeader, /safe-area-inset-top/);
});

test("mobile bundle does not force pages edge-to-edge under the camera", () => {
  assert.doesNotMatch(mobileBuild, /ensureNativeViewportFitCover/);
  assert.doesNotMatch(mobileBuild, /viewport-fit=cover/);
  assert.match(mobileBuild, /native-runtime\.js\?v=1\.6\.0/);
});

test("Build 4 shared Home header keeps its web safe area", () => {
  assert.match(sharedHeader, /\.ari-header-v4/);
  assert.match(sharedHeader, /max\(8px, env\(safe-area-inset-top\)\)/);
});

test("Build 4 Nutrition header keeps its web safe area", () => {
  assert.match(nutrition, /main#ariNutritionApp/);
  assert.match(nutrition, /\.ari-nutrition-header/);
  assert.match(nutrition, /max\(18px, env\(safe-area-inset-top\)\)/);
});

test("Build 4 Goals header keeps its web safe area", () => {
  assert.match(goals, /\.ari-goals-page/);
  assert.match(goals, /\.ari-goals-header/);
  assert.match(goals, /max\(18px, env\(safe-area-inset-top\)\)/);
});

test("Build 4 Blocked Users header keeps its web safe area", () => {
  assert.match(blockedUsers, /\.ari-blocked-users-page \.ari-account-page/);
  assert.match(blockedUsers, /env\(safe-area-inset-top\)/);
  assert.match(blockedUsers, /\.ari-blocked-users-page \.ari-account-header/);
});

test("ARI Circle profile header and primary navigation keep their web safe area", () => {
  assert.match(circlePrimaryNav, /\.circle-v4-profile-header/);
  assert.match(circlePrimaryNav, /calc\(env\(safe-area-inset-top\) \+ 12px\)/);
  assert.match(circlePrimaryNav, /\.circle-soft-primary-nav/);
  assert.match(circlePrimaryNav, /calc\(64px \+ env\(safe-area-inset-top\)\)/);
});
