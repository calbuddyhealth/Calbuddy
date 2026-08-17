import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const runtime = fs.readFileSync(path.join(root, "js/native-runtime.js"), "utf8");
const mobileBuild = fs.readFileSync(path.join(root, "scripts/build-mobile-web.mjs"), "utf8");
const trainingHeader = fs.readFileSync(path.join(root, "assets/css/ari-training-native-header.css"), "utf8");
const settingsHeader = fs.readFileSync(path.join(root, "assets/css/native-settings-header.css"), "utf8");

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

test("mobile bundle injects the current native runtime", () => {
  assert.match(mobileBuild, /native-runtime\.js\?v=1\.4\.0/);
});
