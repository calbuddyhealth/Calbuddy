import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const core = fs.readFileSync("calbuddy-core.js", "utf8");
const api = fs.readFileSync("api/ari-visual-inspector.js", "utf8");
const worker = fs.readFileSync("scripts/ari-visual-inspector.mjs", "utf8");
const workflow = fs.readFileSync(".github/workflows/ari-visual-inspector.yml", "utf8");
const isolation = fs.readFileSync("js/account-isolation-guard.js", "utf8");

test("Live Owner implementation stays syntactically valid", () => {
  for (const path of [
    "calbuddy-core.js",
    "api/ari-visual-inspector.js",
    "scripts/ari-visual-inspector.mjs"
  ]) {
    execFileSync(process.execPath, ["--check", path], { stdio: "pipe" });
  }
});

test("Live Owner activation is a normal owner-confirmed chat action", () => {
  assert.match(core, /CalBuddy\.isLiveOwnerEnableCommand/);
  assert.match(core, /CalBuddy\.isLiveOwnerDisableCommand/);
  assert.match(core, /enable_visual_live_owner_session/);
  assert.match(core, /CalBuddy\.createPendingAction/);
  assert.match(core, /Enable Live Owner Session for up to 45 minutes/);
  assert.match(core, /CalBuddy\.enableVisualLiveOwnerSession/);
  assert.match(core, /verifyOwnerSession\(\{ force: true \}\)/);
  assert.match(core, /calbuddyVisualLiveOwnerSession/);
});

test("Live Owner state is account-bound and time-bound", () => {
  assert.match(core, /state\?\.userId/);
  assert.match(core, /Number\(state\.expiresAt\) <= Date\.now\(\)/);
  assert.match(core, /String\(session\.user\.id\) !== String\(state\.userId\)/);
  assert.match(isolation, /calbuddyVisualLiveOwnerSession/);
  assert.match(isolation, /const VERSION = "1\.0\.2"/);
});

test("visual inspection automatically uses active Live Owner mode", () => {
  assert.match(core, /isVisualLiveOwnerSessionActive/);
  assert.match(core, /resolvedVisualMode/);
  assert.match(core, /"live_owner"/);
  assert.match(core, /visualMode: resolvedVisualMode/);
  assert.match(core, /messageRequiresLiveOwner/);
  assert.match(core, /This inspection depends on your real ARI XP account state/);
});

test("Live Owner delegation never sends the raw owner token as a workflow input", () => {
  assert.match(api, /extractBearerToken\(req\)/);
  assert.match(api, /createCipheriv\("aes-256-gcm"/);
  assert.match(api, /LIVE_GRANT_TTL_MS = 3 \* 60 \* 1000/);
  assert.match(api, /exchange_live_grant/);
  assert.match(workflow, /live_grant:/);
  assert.doesNotMatch(workflow, /access_token|refresh_token|SUPABASE_SERVICE_ROLE_KEY/);
});

test("worker injects real owner auth but blocks browser-side production mutations", () => {
  assert.match(worker, /installLiveOwnerSession/);
  assert.match(worker, /calbuddy-auth-session/);
  assert.match(worker, /shouldBlockLiveMutation/);
  assert.match(worker, /live_owner_read_only_guard/);
  assert.match(worker, /blockedMutations/);
  assert.match(worker, /ari-live-owner-read-only-no-refresh/);
  assert.match(worker, /request\.method\(\)/);
  assert.match(worker, /route\.abort\("blockedbyclient"\)/);
});

test("the delegated worker receives no refresh token from the owner browser", () => {
  assert.doesNotMatch(api, /refreshToken/);
  assert.doesNotMatch(api, /refresh_token:\s*payload/);
  assert.match(api, /accessToken: payload\.accessToken/);
  assert.match(api, /mutationAuthority: false/);
});
