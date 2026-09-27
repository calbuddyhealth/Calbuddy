import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const orchestrator = await readFile(new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url), "utf8");
const api = await readFile(new URL("../api/ari-vnext.js", import.meta.url), "utf8");
const bridge = await readFile(new URL("../ari/vnext/ari-vnext-bridge.js", import.meta.url), "utf8");
const runtime = await readFile(new URL("../ari/runtime/ari-runtime-controller.js", import.meta.url), "utf8");

test("vNext provider failover stays inside the primary semantic runtime", () => {
  assert.match(orchestrator, /ARI_FALLBACK_PROVIDER_API_KEY/);
  assert.match(orchestrator, /ARI_FALLBACK_RESPONSES_URL/);
  assert.match(orchestrator, /openai_fallback/);
  assert.match(orchestrator, /isRecoverableProviderFailure/);
  assert.match(orchestrator, /seen\.has\(fingerprint\)/);
  assert.doesNotMatch(runtime, /return await runReadOnlyLegacyFallback\(input, error\)/);
});

test("provider credit exhaustion is classified separately from Ari cognition failure", () => {
  assert.match(api, /ARI_PROVIDER_CREDITS_EXHAUSTED/);
  assert.match(api, /creditsExhausted/);
  assert.match(api, /insufficient/);
  assert.match(api, /no credits/);
  assert.match(api, /source: "ari_vnext_provider_capacity"/);
  assert.match(api, /status: 503/);
});

test("browser bridge preserves provider capacity failures instead of throwing a generic runtime error", () => {
  assert.match(bridge, /ARI_PROVIDER_CREDITS_EXHAUSTED/);
  assert.match(bridge, /ARI_PROVIDER_RATE_LIMITED/);
  assert.match(bridge, /ARI_PROVIDER_TIMEOUT/);
  assert.match(bridge, /providerUnavailable: true/);
  assert.match(bridge, /version: "1\.12\.1"/);
});
