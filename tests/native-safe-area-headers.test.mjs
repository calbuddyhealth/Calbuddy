import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const runtime = fs.readFileSync(path.join(root, "js/native-runtime.js"), "utf8");
const mobileBuild = fs.readFileSync(path.join(root, "scripts/build-mobile-web.mjs"), "utf8");
const nativeSafeArea = fs.readFileSync(path.join(root, "assets/css/native-safe-area.css"), "utf8");
const trainingHeader = fs.readFileSync(path.join(root, "assets/css/ari-training-native-header.css"), "utf8");
const settingsHeader = fs.readFileSync(path.join(root, "assets/css/native-settings-header.css"), "utf8");
const sharedHeader = fs.readFileSync(path.join(root, "assets/css/header.css"), "utf8");
const nutrition = fs.readFileSync(path.join(root, "assets/css/nutrition.css"), "utf8");
const goals = fs.readFileSync(path.join(root, "assets/css/goals.css"), "utf8");
const blockedUsers = fs.readFileSync(path.join(root, "assets/css/blocked-users.css"), "utf8");
const circleV5 = fs.readFileSync(path.join(root, "assets/css/ari-circle-v5-visual-authority.css"), "utf8");

test("mobile bundle marks native HTML before runtime detection", () => {
  assert.match(mobileBuild, /function markNativeDocument\(/);
  assert.match(mobileBuild, /data-ari-native="true"/);
  assert.match(mobileBuild, /html = markNativeDocument\(html\)/);
});

test("affected native pages receive deterministic camera clearance", () => {
  for (const page of [
    "account.html",
    "ari-preference-settings.html",
    "privacy-memory.html",
    "notification-settings.html",
    "help-safety.html",
    "owner-moderation.html",
    "support-ari.html",
    "blocked-users.html",
    "community-guidelines.html",
    "ari-training.html",
    "nutrition.html"
  ]) {
    assert.match(mobileBuild, new RegExp(page.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(mobileBuild, /native-safe-area\.css\?v=1\.2\.0/);
  assert.match(nativeSafeArea, /\.ari-account-page/);
  assert.match(nativeSafeArea, /\.ari-preference-settings__topbar/);
  assert.match(nativeSafeArea, /body\.ari-training-page \.ari-training-header/);
  assert.match(nativeSafeArea, /main#ariNutritionApp/);
  assert.match(nativeSafeArea, /56px/);
});

test("Training Build 4 native header is linked at build time and kept as a runtime fallback", () => {
  assert.match(mobileBuild, /ari-training-native-header\.css\?v=1\.1\.0/);
  assert.match(runtime, /ari-training-native-header\.css\?v=1\.1\.0/);
  assert.match(trainingHeader, /\.ari-training-header__inner/);
  assert.match(trainingHeader, /56px minmax\(0, 1fr\) 56px/);
});

test("Account-family and Preferences Build 4 native headers are linked at build time", () => {
  assert.match(mobileBuild, /native-settings-header\.css\?v=1\.1\.0/);
  assert.match(runtime, /native-settings-header\.css\?v=1\.1\.0/);
  assert.match(settingsHeader, /\.ari-account-header/);
  assert.match(settingsHeader, /\.ari-preference-settings__topbar/);
  assert.match(settingsHeader, /56px minmax\(0, 1fr\) 80px/);
});

test("native runtime remains resilient if Capacitor becomes available late", () => {
  assert.match(runtime, /function detectNativeRuntime\(/);
  assert.match(runtime, /protocol === "capacitor:" \|\| protocol === "ionic:"/);
  assert.match(runtime, /setInterval\(/);
  assert.match(runtime, /installNativeRuntime\(\)/);
});

test("mobile bundle does not rewrite hosted viewport metadata", () => {
  assert.doesNotMatch(mobileBuild, /ensureNativeViewportFitCover/);
  assert.match(mobileBuild, /native-runtime\.js\?v=1\.6\.0/);
});

test("Build 4 shared Home header keeps its web safe area", () => {
  assert.match(sharedHeader, /\.ari-header-v4|\.ari-header-v5/);
  assert.match(sharedHeader, /safe-area-inset-top/);
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

test("ARI Circle V5 header and bottom navigation keep their web safe areas", () => {
  assert.match(circleV5, /CONSOLIDATED VISUAL AUTHORITY/);
  assert.match(circleV5, /\.circle-v51-halo-header/);
  assert.match(circleV5, /safe-area-inset-top/);
  assert.match(circleV5, /\.circle-v5-bottom-nav/);
  assert.match(circleV5, /safe-area-inset-bottom/);
});
