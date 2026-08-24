import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  mergeAuthoritativeAriContext,
  reconcileWorldModelWithAuthoritativeContext
} from "../api/_lib/ari-vnext/authoritative-context.js";
import { buildCurrentTurn } from "../api/_lib/ari-vnext/current-turn.js";

const originalFetch = globalThis.fetch;
const originalUrl = process.env.SUPABASE_URL;
const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function response(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return data; }
  };
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.SUPABASE_URL = originalUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
});

test("authoritative profile overrides stale browser identity and goals", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key";
  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.includes("/profiles?")) {
      return response([{
        id: "user-1",
        age: 34,
        weight_lbs: 199.8,
        target_weight_lbs: 180,
        daily_calorie_goal: 2100,
        height_in: 69.8,
        sex: "male",
        activity_level: "1.55",
        goal: "lose"
      }]);
    }
    if (value.includes("/ari_account_state?")) return response([]);
    throw new Error(`Unexpected URL: ${value}`);
  };

  const result = await mergeAuthoritativeAriContext({
    userId: "user-1",
    context: {
      user: { id: "user-1", age: 31, height: 69.8, sex: "male" },
      goals: {
        currentWeight: 198,
        goalWeight: 185,
        dailyGoal: 2377,
        caloriesConsumed: 0,
        caloriesBurned: 0,
        caloriesLeft: 2377
      }
    }
  });

  assert.equal(result.context.user.age, 34);
  assert.equal(result.context.goals.currentWeight, 199.8);
  assert.equal(result.context.goals.goalWeight, 180);
  assert.equal(result.context.goals.dailyGoal, 2100);
  assert.equal(result.context.goals.caloriesLeft, 2100);
  assert.equal(result.context.authoritativeContext.source, "supabase_profile");
  assert.equal(result.context.authoritativeContext.profileLoaded, true);
});

test("live authoritative context reconciles stale learned user-model snapshots before reasoning", () => {
  const stale = {
    identity: { age: 31, height: 69.8, sex: "male" },
    goals: { current: { currentWeight: 198, goalWeight: 185, dailyGoal: 2377 } },
    sourceSummary: { profile: true }
  };
  const context = {
    user: { id: "user-1", age: 34, height: 69.8, sex: "male" },
    goals: { currentWeight: 199.8, goalWeight: 180, dailyGoal: 2100 },
    authoritativeContext: { profileLoaded: true, accountStateLoaded: true }
  };

  const reconciled = reconcileWorldModelWithAuthoritativeContext(stale, context);
  assert.equal(reconciled.identity.age, 34);
  assert.equal(reconciled.goals.current.currentWeight, 199.8);
  assert.equal(reconciled.goals.current.goalWeight, 180);
  assert.equal(reconciled.goals.current.dailyGoal, 2100);
  assert.equal(reconciled.sourceSummary.authoritativeProfileReconciled, true);

  // Reconciliation must not mutate the originally loaded object by itself.
  assert.equal(stale.identity.age, 31);
});

test("current turn carries one stable conversation identity", () => {
  const conversationId = "11111111-1111-4111-8111-111111111111";
  const turn = buildCurrentTurn({
    turnId: "turn-1",
    conversationId,
    message: "Continue from earlier",
    context: { surface: "/home.html" }
  }, "user-1");
  assert.equal(turn.conversationId, conversationId);
});

test("browser light context uses live profile before local fallback", async () => {
  const source = await readFile(new URL("../js/ari-latency-hotfix.js", import.meta.url), "utf8");
  assert.match(source, /loadLiveProfile\(session\)/);
  assert.match(source, /profile\.weight_lbs[\s\S]*localStorage\.getItem\("calbuddyCurrentWeight"\)/);
  assert.match(source, /profile\.daily_calorie_goal[\s\S]*calbuddyDailyCalorieGoal/);
  assert.match(source, /ari_light_chat_profile_v2/);
});

test("vNext bridge, API, and continuity writer share the conversation id", async () => {
  const bridge = await readFile(new URL("../ari/vnext/ari-vnext-bridge.js", import.meta.url), "utf8");
  const api = await readFile(new URL("../api/ari-vnext.js", import.meta.url), "utf8");
  const continuity = await readFile(new URL("../api/_lib/ari-vnext/continuity-service.js", import.meta.url), "utf8");
  const homePersistence = await readFile(new URL("../js/home-conversation-persistence.js", import.meta.url), "utf8");

  assert.match(bridge, /conversationId:\s*normalizeTurnId\(options\?\.conversationId \|\| window\.CalBuddy\?\.getConversationId\?\.\(\)\)/);
  assert.match(api, /conversationId:\s*turn\.conversationId/);
  assert.match(continuity, /conversation_id/);
  assert.match(continuity, /ari_chat_sessions/);
  assert.match(continuity, /on_conflict:\s*"id"/);
  assert.match(homePersistence, /serverAuthoritative === true/);
  assert.match(homePersistence, /turnStored === true/);
});

test("vNext API reconciles the learned model before model reasoning", async () => {
  const api = await readFile(new URL("../api/ari-vnext.js", import.meta.url), "utf8");
  const loadIndex = api.indexOf("loadUserWorldModel");
  const reconcileIndex = api.indexOf("reconcileWorldModelWithAuthoritativeContext(persistedWorldModel, turn.context)");
  const runIndex = api.indexOf("const result = await runAriVNext(turn)");
  assert.ok(loadIndex >= 0);
  assert.ok(reconcileIndex > loadIndex);
  assert.ok(runIndex > reconcileIndex);
});

test("migration grants server continuity access without changing authenticated RLS policy", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/20260824043500_restore_ari_vnext_continuity_service_role_access.sql", import.meta.url),
    "utf8"
  );
  for (const table of ["ari_conversation_turns", "ari_user_memory", "ari_user_preferences", "ari_account_state"]) {
    assert.match(sql, new RegExp(`grant select, insert, update, delete on table public\\.${table} to service_role`, "i"));
  }
  assert.doesNotMatch(sql, /disable row level security/i);
  assert.doesNotMatch(sql, /grant .* to authenticated/i);
});
