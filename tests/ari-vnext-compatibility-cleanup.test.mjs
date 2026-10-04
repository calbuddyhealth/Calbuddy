import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function source(path) {
  return fs.readFileSync(path, "utf8");
}

function loadBrowserEngine(path, exportedName) {
  const context = {
    window: { Ari: {} },
    console: { log() {}, warn() {}, error() {} }
  };
  vm.runInNewContext(source(path), context, { filename: path });
  return context.window[exportedName];
}

const authorityMap = source("ari/authority/ari-authority-map.md");
const loader = source("ari/system/ari-loader.js");
const evidenceSource = source("ari/developer/ari-rebirth-code-evidence-engine.js");
const latency = source("js/ari-latency-hotfix.js");

test("legacy architecture loader now exposes the canonical vNext authority map", () => {
  assert.match(authorityMap, /canonical live model-facing authority map is `docs\/ARI_COGNITION_AUTHORITY_MAP\.md`/i);
  assert.match(authorityMap, /Companion Core/);
  assert.match(authorityMap, /Ari Executive/);
  assert.match(authorityMap, /Deliberation Harness/);
  assert.match(loader, /authority:\s*"docs\/ARI_COGNITION_AUTHORITY_MAP\.md"/);
  assert.match(loader, /legacyAuthority:\s*"ari\/authority\/ari-authority-map\.md"/);
  assert.match(loader, /runtimeAuthority:\s*"vnext"/);
});

test("compatibility code evidence filters stale Rebirth defaults and seeds current vNext owners", () => {
  const engine = loadBrowserEngine(
    "ari/developer/ari-rebirth-code-evidence-engine.js",
    "AriRebirthCodeEvidenceEngine"
  );
  const files = Array.from(engine.expandLikelyFiles({
    isDeveloperWork: true,
    targetArea: "homepage_ui",
    intentFamily: "homepage_redesign_or_patch",
    targetObject: { kind: "concept", name: "Home" },
    likelyFiles: [
      "index.html",
      "style.css",
      "api/ask-calbuddy.js",
      "ari/ari-rebirth-app-bridge.js"
    ]
  }));

  assert.ok(files.includes("home.html"));
  assert.ok(files.includes("js/home.js"));
  assert.ok(files.includes("assets/css/home.css"));
  assert.equal(files.includes("index.html"), false);
  assert.equal(files.includes("style.css"), false);
  assert.equal(files.includes("api/ask-calbuddy.js"), false);
  assert.equal(files.includes("ari/ari-rebirth-app-bridge.js"), false);
  assert.match(evidenceSource, /classifyFailingTestsByCausalRelevance:\s*true/);
});

test("an explicitly named compatibility file remains inspectable even when it is not a default seed", () => {
  const engine = loadBrowserEngine(
    "ari/developer/ari-rebirth-code-evidence-engine.js",
    "AriRebirthCodeEvidenceEngine"
  );
  const files = Array.from(engine.expandLikelyFiles({
    isDeveloperWork: true,
    targetArea: "specific_file",
    intentFamily: "specific_file_work",
    targetObject: { kind: "file", name: "index.html", filePath: "index.html" },
    likelyFiles: ["index.html"]
  }));
  assert.ok(files.includes("index.html"));
});

test("bug diagnosis starts from current vNext causal surfaces instead of historical homepage seeds", () => {
  const engine = loadBrowserEngine(
    "ari/developer/ari-rebirth-bug-diagnosis-engine.js",
    "AriRebirthBugDiagnosisEngine"
  );
  const result = engine.diagnose({
    appContext: { ownerMode: true },
    message: "The home screen button is broken"
  });
  const files = Array.from(result.recommendedFiles || []);
  assert.equal(result.canonicalRuntime, "ari-vnext");
  assert.ok(files.includes("home.html"));
  assert.ok(files.includes("js/home.js"));
  assert.equal(files.includes("index.html"), false);
  assert.equal(files.includes("style.css"), false);
});

test("architecture compatibility layer designs against vNext rather than the old Rebirth stack", () => {
  const engine = loadBrowserEngine(
    "ari/developer/ari-rebirth-architecture-engine.js",
    "AriRebirthArchitectureEngine"
  );
  const result = engine.design({
    appContext: { ownerMode: true },
    message: "Redesign the home screen"
  });
  const files = Array.from(result.requiredFiles || []);
  assert.equal(result.canonicalRuntime, "ari-vnext");
  assert.ok(files.includes("home.html"));
  assert.ok(files.includes("ari/runtime/ari-runtime-controller.js"));
  assert.equal(files.includes("index.html"), false);
  assert.equal(files.includes("style.css"), false);
});

test("Home performance compatibility no longer disables initiative and clears stale runtime mode", () => {
  assert.doesNotMatch(latency, /home_latency_guard/);
  assert.doesNotMatch(latency, /client\.check = async function/);
  assert.match(latency, /setAriRuntimeMode\?\.\("vnext"\)/);
  assert.match(latency, /localStorage\.setItem\("ari_runtime_mode_v1", "vnext"\)/);
});
