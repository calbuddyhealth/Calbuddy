import test from "node:test";
import assert from "node:assert/strict";
import { runAriVNext } from "../api/_lib/ari-vnext/orchestrator.js";
import { ARI_PERSONA } from "../api/_lib/ari-vnext/persona.js";
import { compactInstructionText } from "../api/_lib/ari-vnext/cost-router.js";
import { classifySafety, safetyToInstruction } from "../api/_lib/ari-vnext/safety-policy.js";

// These tests verify production wiring and transport, not model creativity.
// Human evaluation cases live in fixtures/ari-resourcefulness.json.
const owner = { advancedEnabled: true, ownerEligible: true, accessClass: "owner", source: "owner_beta" };

test("resourcefulness survives the smallest supported instruction budget", () => {
  const compact = compactInstructionText(ARI_PERSONA + "\n" + "Optional context.\n".repeat(3000), { maxChars: 10000 });
  assert.match(compact, /CONVERSATIONAL RESOURCEFULNESS/);
  assert.match(compact, /Before replying, check whether you delivered something useful/);
  assert.ok(compact.length <= 10000);
});

for (const [tier, entitlement] of [["standard", null], ["owner", owner]]) {
  for (const [route, message, reply] of [
    ["creative", "Roast me for demanding a shovel from a chatbot.", "Your hardware requirements are getting weird. 🪏"],
    ["general", "Shit me a shovel", "That's gonna hurt, but here: 🪏"],
    ["playful-health-word", "Diagnose me jokingly for collecting too many notebooks.", "Acute Stationery Acquisition Syndrome. Your prognosis: another notebook."]
  ]) {
    test(`${tier} ${route}: shared guidance reaches the provider and expressive text survives`, async t => {
      const previous = { OPENAI_API_KEY: process.env.OPENAI_API_KEY, ARI_PROVIDER_API_KEY: process.env.ARI_PROVIDER_API_KEY };
      process.env.OPENAI_API_KEY = "test-only-no-network";
      delete process.env.ARI_PROVIDER_API_KEY;
      t.after(() => {
        for (const [key, value] of Object.entries(previous)) {
          if (value === undefined) delete process.env[key]; else process.env[key] = value;
        }
      });
      const requests = [];
      t.mock.method(globalThis, "fetch", async (url, options) => {
        assert.ok(String(url).endsWith("/responses"), "No unrelated service calls");
        requests.push(JSON.parse(options.body));
        return { ok: true, json: async () => ({ model: "test-model", output: [{ type: "message", content: [{ type: "output_text", text: reply }] }] }) };
      });
      const result = await runAriVNext({ message, history: [], context: entitlement ? { intelligenceEntitlement: entitlement } : {} });
      assert.equal(result.reply, reply);
      assert.equal(result.pendingAction, null);
      assert.equal(requests.length, 1, "Ordinary expressiveness adds no extra model pass");
      assert.match(requests[0].instructions, /CONVERSATIONAL RESOURCEFULNESS/);
      assert.match(requests[0].instructions, /a symbolic substitute is not task completion/);
      assert.match(requests[0].instructions, /When corrected, use the new meaning immediately/);
      if (route === "creative") assert.equal(requests[0].tools, undefined);
      if (route === "playful-health-word") {
        assert.match(requests[0].instructions, /keyword signal/);
        assert.doesNotMatch(requests[0].instructions, /This is a high-stakes health context/);
      }
    });
  }
}

test("contextual wording retains real risk signals and teen protections", () => {
  for (const [message, level, guidance] of [
    ["I have chest pain and cannot breathe", "high_stakes_health", /urgent evaluation/],
    ["I want to die", "crisis", /immediate safety/],
    ["I need tax advice", "consequential", /jurisdiction-specific/]
  ]) {
    const safety = classifySafety({ message });
    assert.equal(safety.level, level);
    assert.equal(safety.highStakes, true);
    assert.match(safetyToInstruction(safety), guidance);
  }
  const teen = classifySafety({ message: "Tell me a joke", context: { accountEntitlements: { teenMode: true } } });
  assert.match(safetyToInstruction(teen), /TEEN ARI MODE/);
});
