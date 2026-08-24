import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import appHealthHandler from "../api/ari-app-health/index.js";

function makeResponse() {
  return {
    headers: {},
    statusCode: 200,
    payload: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

test("App Health endpoint fails closed without verified owner authentication", async () => {
  for (const request of [
    { method: "GET", headers: {}, body: {} },
    { method: "POST", headers: {}, body: { action: "run_sweep", owner_access: true } }
  ]) {
    const response = makeResponse();
    await appHealthHandler(request, response);

    assert.equal(response.statusCode, 401);
    assert.equal(response.payload?.success, false);
    assert.equal(response.payload?.code, "OWNER_AUTH_REQUIRED");
  }
});

test("App Health API uses owner verification and the existing release workflows", async () => {
  const source = await readFile(
    new URL("../api/ari-app-health/index.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /verifyOwnerRequest/);
  assert.doesNotMatch(source, /\bowner_access\b/);
  assert.match(source, /app-store-readiness-tests\.yml/);
  assert.match(source, /ios-native-generate\.yml/);
  assert.match(source, /ari-vnext-tests\.yml/);
  assert.match(source, /run_sweep/);
  assert.match(source, /GITHUB_TOKEN/);
});

test("App Health targets main independently from legacy GitHub edit branch", async () => {
  const source = await readFile(
    new URL("../api/ari-app-health/index.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /APP_HEALTH_BRANCH \|\| "main"/);
  assert.doesNotMatch(source, /process\.env\.GITHUB_BRANCH/);
});

test("App Health is prominent for the owner but hidden by default from normal users", async () => {
  const home = await readFile(new URL("../home.html", import.meta.url), "utf8");
  const nav = await readFile(new URL("../js/app-health-nav.js", import.meta.url), "utf8");
  const page = await readFile(new URL("../app-health.html", import.meta.url), "utf8");

  assert.match(home, /id="ariAppHealthNav"/);
  assert.match(home, /APP HEALTH/);
  assert.match(home, /OWNER/);
  assert.match(home, /data-ari-owner-health[^>]*hidden[^>]*aria-hidden="true"/);
  assert.match(home, /js\/app-health-nav\.js/);

  assert.match(nav, /verifyOwnerSession/);
  assert.match(nav, /if \(!isOwner\) return/);
  assert.match(nav, /nav\.hidden = false/);

  assert.match(page, /OWNER DIAGNOSTICS/);
  assert.match(page, /SMART SWEEP/);
  assert.match(page, /FULL RELEASE SWEEP/);
  assert.match(page, /App Health detects and reports failures/);
});
