import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  normalizeSavedCommunicationPreferences
} from "../api/_lib/ari-vnext/saved-communication-preferences.js";
import {
  resolveCommunicationProfile
} from "../api/_lib/ari-vnext/communication-profile.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("legacy default preference records become Automatic instead of fixed locks", () => {
  const result = normalizeSavedCommunicationPreferences({
    active_preset: "default",
    preference_overrides: {
      language: {
        tone: "natural",
        directness: "balanced",
        humor: "occasional",
        profanity: "default",
        complexity: "balanced",
        detail: "balanced"
      }
    }
  });

  assert.equal(result.automatic, true);
  assert.equal(result.legacyDefaultTreatedAsAutomatic, true);
  assert.deepEqual(result.preferences, {});
  assert.deepEqual(result.explicitLocks, []);
});

test("custom style saves only non-Auto settings as explicit vNext locks", () => {
  const result = normalizeSavedCommunicationPreferences({
    active_preset: "custom",
    preference_overrides: {
      language: {
        tone: "auto",
        directness: "blunt",
        humor: "auto",
        profanity: "never",
        complexity: "advanced",
        detail: "concise"
      }
    }
  });

  assert.equal(result.automatic, false);
  assert.deepEqual(result.preferences, {
    directness: "direct",
    detail: "brief",
    profanity: "never",
    complexity: "advanced"
  });
  assert.deepEqual(result.explicitLocks, [
    "directness",
    "detail",
    "profanity",
    "complexity"
  ]);
});

test("legacy adaptive profanity and all-Auto custom style remain learnable", () => {
  const result = normalizeSavedCommunicationPreferences({
    active_preset: "custom",
    preference_overrides: {
      language: {
        tone: "auto",
        directness: "auto",
        humor: "auto",
        profanity: "default",
        complexity: "adaptive",
        detail: "auto"
      }
    }
  });

  assert.equal(result.automatic, true);
  assert.deepEqual(result.preferences, {});
  assert.deepEqual(result.explicitLocks, []);
});

test("existing Natural tone remains a valid manual vNext lock", () => {
  const profile = resolveCommunicationProfile({ tone: "natural" });
  assert.equal(profile.tone, "natural");
});

test("Conversation Style UI installs Auto before the existing controller", async () => {
  const html = await read("ari-preference-settings.html");
  const contractIndex = html.indexOf("ari-conversation-style-auto-contract.js?v=1.0.0");
  const uiIndex = html.indexOf("ari-conversation-style-auto-ui.js?v=1.0.0");
  const controllerIndex = html.indexOf("js/ari-preference-settings-controller.js?v=3.0.0");

  assert.ok(contractIndex > 0);
  assert.ok(uiIndex > contractIndex);
  assert.ok(controllerIndex > uiIndex);
});

test("Auto compatibility layer covers all six communication settings", async () => {
  const source = await read("ari/profile/ari-conversation-style-auto-contract.js");
  for (const key of ["tone", "directness", "humor", "profanity", "complexity", "detail"]) {
    assert.match(source, new RegExp(`\\[\\"${key}\\"`));
  }
  assert.match(source, /runtimeDefaults = automaticSnapshot\(\)/);
  assert.match(source, /legacyDefaultTreatedAsAutomatic/);
  assert.match(source, /options\.never/);
});

test("settings UI makes Automatic the visible default and manual choices optional", async () => {
  const source = await read("js/ari-conversation-style-auto-ui.js");
  assert.match(source, /value=\\"auto\\"/);
  assert.match(source, /data-default=\\"true\\"/);
  assert.match(source, /Reset to Automatic/);
  assert.match(source, /Save style/);
  assert.match(source, /Automatic is the default/);
  assert.match(source, /value = "never"/);
});

test("Rebirth fallback receives the same Automatic compatibility layer", async () => {
  const source = await read("ari/ari-rebirth-app-bridge.js");
  const runtimeIndex = source.indexOf("ari/profile/ari-preference-runtime.js?v=1.1.0");
  const autoIndex = source.indexOf("ari/profile/ari-conversation-style-auto-contract.js?v=1.0.0");
  assert.ok(runtimeIndex > 0);
  assert.ok(autoIndex > runtimeIndex);
});

test("vNext hydrates saved Conversation Style and exposes only non-sensitive lock metadata", async () => {
  const source = await read("api/ari-vnext.js");
  assert.match(source, /loadSavedCommunicationPreferences/);
  assert.match(source, /savedCommunicationPreferences/);
  assert.match(source, /turn\.preferences = \{/);
  assert.match(source, /conversationStyleAutomatic/);
  assert.match(source, /conversationStyleLockCount/);
  assert.match(source, /explicitLocks/);
});

test("saved style loader is user-scoped and does not use Circle or another OpenAI call", async () => {
  const source = await read("api/_lib/ari-vnext/saved-communication-preferences.js");
  assert.match(source, /user_id: `eq\.\$\{id\}`/);
  assert.match(source, /ari_user_preferences/);
  assert.doesNotMatch(source, /circle|social|feed|friends|challenge/i);
  assert.doesNotMatch(source, /openai|responses api|chat\/completions/i);
});
