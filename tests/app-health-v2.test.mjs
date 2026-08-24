import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("App Health v2 uses one controller workflow and commit-aware release metadata", async () => {
  const api = await read("api/ari-app-health/index.js");

  assert.match(api, /app-health-sweep\.yml/);
  assert.match(api, /APP_HEALTH_BRANCH/);
  assert.doesNotMatch(api, /process\.env\.GITHUB_BRANCH/);
  assert.match(api, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(api, /validForCurrentCommit/);
  assert.match(api, /impactsWorkflow/);
  assert.match(api, /state: "stale"/);
  assert.match(api, /APP_HEALTH_ACTIONS_WRITE_REQUIRED/);

  const dispatchMatches = api.match(/\/dispatches/g) || [];
  assert.equal(dispatchMatches.length, 1, "manual App Health should dispatch only the controller workflow");
});

test("App Health controller supports Smart Sweep and Full Release Sweep", async () => {
  const workflow = await read(".github/workflows/app-health-sweep.yml");

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /mode:/);
  assert.match(workflow, /smart/);
  assert.match(workflow, /full/);
  assert.match(workflow, /name: ARI XP Readiness/);
  assert.match(workflow, /name: Ari \+ Nutrition Trust/);
  assert.match(workflow, /name: iOS Native Validation/);
  assert.match(workflow, /git diff --name-only/);
  assert.match(workflow, /needs\.plan\.outputs\.run_ios/);
  assert.match(workflow, /needs\.plan\.outputs\.run_ari/);
});

test("App Health UI separates release health from sweep control", async () => {
  const page = await read("app-health.html");
  const client = await read("js/app-health.js");

  assert.match(page, /SMART SWEEP/);
  assert.match(page, /FULL RELEASE SWEEP/);
  assert.match(page, /id="appHealthSweepState"/);
  assert.match(page, /data-workflow-id="deployment"/);
  assert.match(page, /id="appHealthProductionCommit"/);

  assert.match(client, /runBugSweep\("smart"\)/);
  assert.match(client, /runBugSweep\("full"\)/);
  assert.match(client, /APP_HEALTH_ACTIONS_WRITE_REQUIRED/);
  assert.match(client, /Production:/);
  assert.match(client, /RETEST REQUIRED/);
});
