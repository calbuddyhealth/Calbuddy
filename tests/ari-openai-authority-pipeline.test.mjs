import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(TEST_DIRECTORY, "..");

async function loadBrowserScript(context, relativePath) {
  const absolutePath = path.join(REPOSITORY_ROOT, relativePath);
  const source = await readFile(absolutePath, "utf8");
  vm.runInContext(source, context, { filename: relativePath });
}

function createBrowserContext() {
  const window = { Ari: {} };
  const context = vm.createContext({
    window,
    console,
    performance,
    setTimeout,
    clearTimeout,
    AbortController,
    URL
  });

  return { context, window };
}

test("reasoning client sends only the current request in a non-executing packet", async () => {
  const { context, window } = createBrowserContext();
  let outbound = null;

  context.fetch = async (_url, options) => {
    outbound = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          success: true,
          cognitiveReasoningResult: {
            interpretation: { primaryIntent: "conversation" },
            semanticFrame: { operation: "respond" },
            reasoningDecision: { decision: "answer" },
            responseStrategy: { mode: "direct" },
            authoritativeDraft: "The conversation response completed.",
            proposedActions: []
          }
        });
      }
    };
  };

  await loadBrowserScript(
    context,
    "ari/reasoning/ari-openai-reasoning-client.js"
  );

  const result = await window.AriOpenAIReasoningClient.reason({
    requestText: "I just like talking to people.",
    cognitivePacket: {
      memory: { items: ["PRIVATE_MEMORY_SENTINEL"] },
      applicationContext: { state: "PRIVATE_APP_STATE_SENTINEL" },
      developerContext: { evidence: "PRIVATE_DEVELOPER_EVIDENCE_SENTINEL" }
    }
  });

  const serialized = JSON.stringify(outbound);
  assert.equal(outbound.action, "openai_reasoning");
  assert.equal(outbound.cognitivePacket.request.effective, "I just like talking to people.");
  assert.equal(outbound.cognitivePacket.authority.mayExecuteActions, false);
  assert.equal(outbound.cognitivePacket.authority.mayPersistState, false);
  assert.deepEqual(
    Array.from(outbound.operationContract.allowedOperations),
    ["respond", "clarify"]
  );
  assert.doesNotMatch(serialized, /PRIVATE_MEMORY_SENTINEL/);
  assert.doesNotMatch(serialized, /PRIVATE_APP_STATE_SENTINEL/);
  assert.doesNotMatch(serialized, /PRIVATE_DEVELOPER_EVIDENCE_SENTINEL/);
  assert.equal(result.authoritativeDraft, "The conversation response completed.");
});

test("app bridge cache-busts every replaced runtime and all page entry points", async () => {
  const bridge = await readFile(
    path.join(REPOSITORY_ROOT, "ari/ari-rebirth-app-bridge.js"),
    "utf8"
  );

  const versionedRuntimePaths = [
    "ari/bridge/ari-runtime-delivery.js?v=2.0.1",
    "ari/reasoning/ari-openai-reasoning-client.js?v=2.1.1"
  ];

  for (const runtimePath of versionedRuntimePaths) {
    assert.match(bridge, new RegExp(runtimePath.replace(/[.?]/g, "\\$&")));
  }

  for (const page of ["home.html", "nutrition.html", "ari-lab.html"]) {
    const html = await readFile(path.join(REPOSITORY_ROOT, page), "utf8");
    assert.match(html, /ari-rebirth-app-bridge\.js\?v=2\.5\.2/);
  }
});

test("failed Rebirth turns fall back without exposing internal boundaries", async () => {
  const [core, delivery] = await Promise.all([
    readFile(path.join(REPOSITORY_ROOT, "calbuddy-core.js"), "utf8"),
    readFile(
      path.join(REPOSITORY_ROOT, "ari/bridge/ari-runtime-delivery.js"),
      "utf8"
    )
  ]);

  assert.match(core, /CalBuddy\.isInternalAriFailureText = function/);
  assert.match(core, /const rebirthSucceeded =/);
  assert.match(core, /ARI REBIRTH FAILED; USING EMERGENCY CHAT FALLBACK/);
  assert.match(core, /CalBuddy\.api\("\/api\/ask-calbuddy"/);
  assert.match(core, /I hit a temporary connection problem/);

  assert.match(delivery, /const internalMessage =/);
  assert.match(delivery, /const publicMessage =/);
  assert.match(delivery, /options\.exposeInternalErrors === true/);
  assert.match(delivery, /\? internalMessage \|\| publicMessage/);
});
