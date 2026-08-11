import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";

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
    },
    end() {
      return this;
    }
  };
}

test("OpenAI-authority reasoning stage returns canonical handoff fields", async () => {
  const { context, window } = createBrowserContext();

  window.AriOpenAICognitiveOrchestrator = {
    async run() {
      return {
        ready: true,
        source: "openai-test",
        interpretation: { primaryIntent: "developer_file_analysis" },
        semanticFrame: { primaryIntent: "developer_file_analysis" },
        reasoningDecision: { decision: "answer" },
        responseStrategy: { mode: "direct" },
        authoritativeDraft: "The GitHub file was analyzed successfully.",
        authority: {
          semanticSource: "openai",
          reasoningSource: "openai",
          responseStrategySource: "openai",
          draftSource: "openai"
        }
      };
    }
  };
  window.Ari.openAICognitiveOrchestrator =
    window.AriOpenAICognitiveOrchestrator;

  await loadBrowserScript(
    context,
    "ari/pipeline-stages/deliberation/ari-reasoning-stage.js"
  );
  const result = await window.AriReasoningStage.run(
    { requestText: "Analyze calbuddy-core.js" },
    { mark() {} }
  );

  assert.equal(result.reasoningStageRan, true);
  assert.equal(result.reasoningStageReady, true);
  assert.equal(result.reasoningStagePacket?.ready, true);
  assert.equal(result.semanticFrame?.primaryIntent, "developer_file_analysis");
  assert.equal(result.authoritativeDraft, "The GitHub file was analyzed successfully.");
});

test("lean knowledge transport returns one authoritative OpenAI draft", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-openai-key";

  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.messages[1].role, "user");
    const outbound = JSON.stringify(request);
    assert.match(outbound, /Analyze calbuddy-core\.js/);
    assert.doesNotMatch(outbound, /PRIVATE_MEMORY_SENTINEL/);
    assert.doesNotMatch(outbound, /PRIVATE_APP_STATE_SENTINEL/);
    assert.doesNotMatch(outbound, /PRIVATE_DEVELOPER_EVIDENCE_SENTINEL/);

    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  interpretation: { primaryIntent: "developer_file_analysis" },
                  semanticFrame: { primaryIntent: "developer_file_analysis" },
                  reasoningDecision: { decision: "answer" },
                  responseStrategy: { mode: "direct" },
                  authoritativeDraft: "The file analysis completed.",
                  proposedActions: []
                })
              }
            }
          ],
          usage: { total_tokens: 100 }
        });
      }
    };
  };

  try {
    const moduleUrl = pathToFileURL(
      path.join(REPOSITORY_ROOT, "api/knowledge.js")
    );
    moduleUrl.searchParams.set("test", String(Date.now()));
    const { default: handler } = await import(moduleUrl.href);
    const response = makeResponse();

    await handler(
      {
        method: "POST",
        body: {
          action: "cognitive_orchestration",
          requestText: "Analyze calbuddy-core.js",
          cognitivePacket: {
            requestText: "Analyze calbuddy-core.js",
            request: {
              original: "Analyze calbuddy-core.js",
              effective: "Analyze calbuddy-core.js"
            },
            memory: { items: ["PRIVATE_MEMORY_SENTINEL"] },
            applicationContext: { state: "PRIVATE_APP_STATE_SENTINEL" },
            developerContext: { evidence: "PRIVATE_DEVELOPER_EVIDENCE_SENTINEL" }
          }
        }
      },
      response
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.success, true);
    assert.equal(
      response.payload.cognitiveReasoningResult?.authoritativeDraft,
      "The file analysis completed."
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
  }
});

test("app bridge cache-busts every replaced runtime and all page entry points", async () => {
  const bridge = await readFile(
    path.join(REPOSITORY_ROOT, "ari/ari-rebirth-app-bridge.js"),
    "utf8"
  );

  const versionedRuntimePaths = [
    "ari/bridge/ari-runtime-delivery.js?v=2.0.1",
    "ari/reasoning/ari-openai-reasoning-client.js?v=3.0.1",
    "ari/reasoning/ari-openai-cognitive-orchestrator.js?v=1.1.0",
    "ari/pipeline-stages/deliberation/ari-reasoning-stage.js?v=4.0.0"
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
