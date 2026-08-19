import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  ageBandForDate,
  deriveAccountEntitlements
} from "../api/_lib/ari-vnext/account-entitlements.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { classifySafety, safetyToInstruction } from "../api/_lib/ari-vnext/safety-policy.js";
import { getAriTools, validateToolCall } from "../api/_lib/ari-vnext/tools.js";

const NOW = new Date("2026-08-18T22:18:00.000Z");

function names(route) {
  return getAriTools(route).map((tool) => tool.name);
}

test("age bands honor the 13+ app and 18+ Circle boundaries", () => {
  assert.equal(ageBandForDate("2013-08-19", NOW), "under_13");
  assert.equal(ageBandForDate("2013-08-18", NOW), "teen");
  assert.equal(ageBandForDate("2008-08-19", NOW), "teen");
  assert.equal(ageBandForDate("2008-08-18", NOW), "adult");
});

test("teen account can use ARI XP but cannot use ARI Circle", () => {
  const state = deriveAccountEntitlements({ status: "active", date_of_birth: "2010-04-05" }, NOW);
  assert.equal(state.ageBand, "teen");
  assert.equal(state.appAllowed, true);
  assert.equal(state.teenMode, true);
  assert.equal(state.circleAllowed, false);
  assert.equal(state.circleMinimumAge, 18);
});

test("active verified adult account receives Circle entitlement", () => {
  const state = deriveAccountEntitlements({ status: "active", date_of_birth: "1990-04-05" }, NOW);
  assert.equal(state.ageBand, "adult");
  assert.equal(state.appAllowed, true);
  assert.equal(state.teenMode, false);
  assert.equal(state.circleAllowed, true);
});

test("inactive adult account cannot use Circle", () => {
  const state = deriveAccountEntitlements({ status: "paused", date_of_birth: "1990-04-05" }, NOW);
  assert.equal(state.ageBand, "adult");
  assert.equal(state.circleAllowed, false);
  assert.equal(state.appAllowed, false);
});

test("route carries server-derived Teen Ari mode", () => {
  const route = routeContext({
    message: "Can you change my weight goal?",
    context: { accountEntitlements: { ageBand: "teen", teenMode: true, circleAllowed: false } }
  });
  assert.equal(route.goals, true);
  assert.equal(route.teenMode, true);
  assert.equal(route.circleAllowed, false);
});

test("Teen Ari cannot receive the goal-mutation tool but can log neutral weight", () => {
  const teenTools = names({ goals: true, teenMode: true });
  assert.ok(teenTools.includes("propose_log_weight"));
  assert.ok(!teenTools.includes("propose_update_goal"));

  const adultTools = names({ goals: true, teenMode: false });
  assert.ok(adultTools.includes("propose_update_goal"));

  const rejected = validateToolCall({
    name: "propose_update_goal",
    arguments: JSON.stringify({ goalType: "weekly_weight_change", value: -2, unit: "lb/week", instruction: "lose 2 lb/week" })
  }, { goals: true, teenMode: true });
  assert.equal(rejected.valid, false);
  assert.equal(rejected.error, "tool_not_allowed_for_turn");
});

test("Teen Ari safety policy blocks Circle bypass and aggressive body-composition coaching", () => {
  const safety = classifySafety({
    message: "Help me get into Circle and lose weight really fast",
    history: [],
    context: { accountEntitlements: { ageBand: "teen", teenMode: true, circleAllowed: false } }
  }, { goals: true });
  const instruction = safetyToInstruction(safety);
  assert.equal(safety.teenMode, true);
  assert.equal(safety.circleAllowed, false);
  assert.match(instruction, /ARI Circle is an adults-only/i);
  assert.match(instruction, /rapid weight-loss|extreme restriction/i);
  assert.match(instruction, /dependency|exclusive confidant/i);
});

test("home hides Circle until an adult entitlement explicitly reveals it", () => {
  const source = fs.readFileSync(new URL("../home.html", import.meta.url), "utf8");
  assert.match(source, /data-ari-circle-link hidden aria-hidden="true"/);
  assert.match(source, /js\/age-entitlements\.js/);
});

test("all Circle pages inherit the adults-only client guard through the shared menu", () => {
  const source = fs.readFileSync(new URL("../js/ari-circle/circle-menu-v5.js", import.meta.url), "utf8");
  const guard = fs.readFileSync(new URL("../js/ari-circle/adult-only-guard.js", import.meta.url), "utf8");
  assert.doesNotThrow(() => new Function(source));
  assert.doesNotThrow(() => new Function(guard));
  assert.match(source, /adult-only-guard\.js/);
  assert.match(source, /visibility = "hidden"/);
  assert.match(guard, /ageBand === "adult"/);
  assert.match(guard, /home\.html\?circle=unavailable/);
});

test("Circle badge system does not request social data without adult authorization", () => {
  const source = fs.readFileSync(new URL("../js/ari-circle/social-badges.js", import.meta.url), "utf8");
  assert.doesNotThrow(() => new Function(source));
  assert.match(source, /resolveAdultEntitlement/);
  assert.match(source, /if \(!state\.authorized\)/);
  assert.match(source, /circleAllowed === true/);
});

test("Circle moderation checks adult entitlement before AI consent or OpenAI moderation", () => {
  const source = fs.readFileSync(new URL("../api/ari-circle-moderation.js", import.meta.url), "utf8");
  const accessIndex = source.indexOf("const access = await getCircleAccessState(authorization)");
  const consentIndex = source.indexOf("if (!hasCurrentAiConsent(user))");
  const rateIndex = source.indexOf("const rateLimit = await enforceAiRateLimit");
  assert.ok(accessIndex > 0);
  assert.ok(consentIndex > accessIndex);
  assert.ok(rateIndex > consentIndex);
  assert.match(source, /ari_circle_my_age_state/);
  assert.match(source, /ARI_CIRCLE_ADULTS_ONLY/);
  assert.match(source, /paid_classifier_used: false/);
});

test("staged SQL enforces one adults-only entitlement across RLS, writes, RPC helpers, and storage", () => {
  const source = fs.readFileSync(new URL("../supabase/migrations/20260818223000_ari_circle_adults_only.sql", import.meta.url), "utf8");
  assert.match(source, /ari_circle_current_user_is_adult/);
  assert.match(source, /circle_allowed/);
  assert.match(source, /circle_minimum_age', 18/);
  assert.match(source, /as restrictive\s+for all\s+to authenticated/i);
  assert.match(source, /ari_circle_adult_mutation_guard/);
  assert.match(source, /ari-circle-teen-media/);
  assert.match(source, /ARI Circle is available to adults age 18 and older/);
  assert.match(source, /when public\.ari_account_age_band_for_date\(date_of_birth\) = 'teen' then 'under_18'/);
});

test("legal copy states that teens can use eligible ARI XP features but not Circle", () => {
  const privacy = fs.readFileSync(new URL("../privacy.html", import.meta.url), "utf8");
  const terms = fs.readFileSync(new URL("../terms.html", import.meta.url), "utf8");
  const guidelines = fs.readFileSync(new URL("../community-guidelines.html", import.meta.url), "utf8");
  assert.match(privacy, /Users ages 13 through 17 may use eligible non-social ARI XP features/i);
  assert.match(terms, /ARI Circle is a separate adults-only community feature/i);
  assert.match(guidelines, /ARI Circle is for adults 18\+/i);
});
