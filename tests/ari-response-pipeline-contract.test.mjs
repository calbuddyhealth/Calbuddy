import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const runtimeSource = fs.readFileSync("ari/runtime/ari-runtime-controller.js", "utf8");
const bridgeSource = fs.readFileSync("ari/vnext/ari-vnext-bridge.js", "utf8");
const resilienceSource = fs.readFileSync("js/home-resilience.js", "utf8");
const authSource = fs.readFileSync("js/auth.js", "utf8");
const routerSource = fs.readFileSync("ari/intent/ari-central-intent-router.js", "utf8");
const homeSource = fs.readFileSync("home.html", "utf8");

function storage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

class FakeCustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
}

function runtimeSandbox() {
  const events = [];
  let legacyCalls = 0;
  const calBuddy = {
    askAri: async () => {
      legacyCalls += 1;
      return { reply: "legacy" };
    },
    confirmPendingAction: async () => ({ success: true }),
    cancelPendingAction: () => ({ success: true }),
    getPendingAction: () => null
  };
  const local = storage();
  const session = storage();
  const windowObject = {
    Ari: {},
    CalBuddy: calBuddy,
    location: { pathname: "/home.html" },
    dispatchEvent(event) { events.push(event); },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };
  const document = {
    scripts: [],
    createElement() {
      return {
        dataset: {},
        addEventListener() {},
        set src(value) { this._src = value; },
        getAttribute(name) { return name === "src" ? this._src || "" : ""; }
      };
    },
    head: { appendChild() {} }
  };
  const sandbox = {
    window: windowObject,
    CalBuddy: calBuddy,
    localStorage: local,
    sessionStorage: session,
    document,
    CustomEvent: FakeCustomEvent,
    AbortController,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: "ari-runtime-controller.js" });
  return { sandbox, events, getLegacyCalls: () => legacyCalls };
}

function bridgeSandbox(fetchImpl) {
  const calBuddy = {
    getCurrentSession: async () => ({ access_token: "test-token", user: { id: "user-1" } })
  };
  const windowObject = {
    Ari: {},
    CalBuddy: calBuddy,
    location: { pathname: "/home.html" },
    dispatchEvent() {},
    setTimeout,
    clearTimeout
  };
  const sandbox = {
    window: windowObject,
    sessionStorage: storage(),
    localStorage: storage(),
    CustomEvent: FakeCustomEvent,
    fetch: fetchImpl,
    console,
    setTimeout,
    clearTimeout
  };
  vm.createContext(sandbox);
  vm.runInContext(bridgeSource, sandbox, { filename: "ari-vnext-bridge.js" });
  return sandbox;
}

test("Home cache chain points at current repaired runtime and bridge assets", () => {
  assert.match(homeSource, /js\/auth\.js\?v=1\.10\.16/);
  assert.match(homeSource, /js\/home-resilience\.js\?v=1\.3\.2/);
  assert.match(authSource, /account-isolation-guard\.js\?v=1\.0\.0/);
  assert.match(authSource, /ari-central-intent-router\.js\?v=1\.5\.3/);
  assert.match(routerSource, /ari\/runtime\/ari-runtime-controller\.js\?v=1\.3\.\d+/);
  assert.match(runtimeSource, /const VERSION = "1\.3\.6"/);
  assert.match(runtimeSource, /ari-vnext-bridge\.js\?v=1\.7\.2/);
  assert.match(runtimeSource, /ari-vnext-context-guard\.js\?v=1\.2\.2/);
});

test("runtime publishes canonical and compatibility identities together", () => {
  const { sandbox, events } = runtimeSandbox();
  assert.equal(sandbox.window.Ari.Runtime, sandbox.window.AriRuntime);
  assert.equal(sandbox.window.Ari.Runtime.version, "1.3.6");
  assert.equal(typeof sandbox.window.Ari.Runtime.ask, "function");
  assert.ok(events.some((event) => event.type === "ari:runtimeReady"));
});

test("an aborted Home turn never falls back into legacy Rebirth", async () => {
  const { sandbox, getLegacyCalls } = runtimeSandbox();
  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    sandbox.window.Ari.Runtime.ask({ message: "hello", signal: controller.signal }),
    (error) => error?.name === "AbortError" && error?.code === "ARI_REQUEST_ABORTED"
  );
  assert.equal(getLegacyCalls(), 0);
});

test("bridge forwards Home AbortSignal to /api/ari-vnext and exposes 202 as processing", async () => {
  let capturedSignal = null;
  const sandbox = bridgeSandbox(async (url, init = {}) => {
    assert.equal(url, "/api/ari-vnext");
    capturedSignal = init.signal || null;
    return {
      ok: true,
      status: 202,
      json: async () => ({
        success: false,
        ready: false,
        pending: true,
        code: "ARI_TURN_IN_PROGRESS",
        turnId: "turn-test"
      })
    };
  });

  const controller = new AbortController();
  await assert.rejects(
    sandbox.window.AriVNextBridge.ask("hello", {
      turnId: "turn-test",
      signal: controller.signal,
      userContext: {}
    }),
    (error) => error?.code === "ARI_TURN_IN_PROGRESS" && error?.transient === true
  );
  assert.equal(capturedSignal, controller.signal);
});

test("Home loader is version-aware, dual-namespace aware, and bounded", () => {
  assert.match(resilienceSource, /window\.AriRuntime, window\.Ari\?\.Runtime/);
  assert.match(resilienceSource, /REQUIRED_RUNTIME_VERSION\s*=\s*"1\.3\.6"/);
  assert.match(resilienceSource, /RUNTIME_LOAD_TIMEOUT_MS\s*=\s*5000/);
  assert.match(resilienceSource, /loadRuntimeController\(\{ signal \}\)/);
  assert.match(resilienceSource, /ARI_TURN_IN_PROGRESS/);
});
