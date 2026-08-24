import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const engineSource = fs.readFileSync(
  "ari/personalization/ari-personalization-engine.js",
  "utf8"
);

const memoryStageSource = fs.readFileSync(
  "ari/pipeline-stages/deliberation/ari-memory-stage.js",
  "utf8"
);

function loadEngine() {
  const window = {
    Ari: {},
    addEventListener() {}
  };

  const sandbox = {
    window,
    console: {
      log() {},
      warn() {},
      error() {}
    },
    Date,
    Math,
    Map,
    Set,
    Object,
    Array,
    Number,
    String,
    JSON,
    Promise
  };

  vm.createContext(sandbox);
  vm.runInContext(engineSource, sandbox, {
    filename: "ari-personalization-engine.js"
  });

  return sandbox.window.AriPersonalizationEngine;
}

function activity(day, hour, duration, name = "Strength training") {
  const created = new Date(`2026-08-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00`);
  return {
    activity_name: name,
    duration_minutes: duration,
    calories_burned: 320,
    intensity: "moderate",
    log_date: `2026-08-${String(day).padStart(2, "0")}`,
    created_at: created.toISOString()
  };
}

function meal(day, name, calories, protein) {
  return {
    name,
    calories,
    protein_g: protein,
    carbs_g: 30,
    fat_g: 12,
    nutrition_date: `2026-08-${String(day).padStart(2, "0")}`,
    created_at: `2026-08-${String(day).padStart(2, "0")}T12:00:00.000Z`
  };
}

test("personalization learns deterministic Training and Nutrition patterns", async () => {
  const engine = loadEngine();

  const activities = [
    activity(10, 18, 45),
    activity(11, 18, 50),
    activity(12, 19, 55),
    activity(13, 18, 50),
    activity(14, 20, 40),
    activity(15, 18, 60)
  ];

  const meals = [
    meal(10, "Greek yogurt", 300, 28),
    meal(10, "Chicken bowl", 650, 52),
    meal(11, "Greek yogurt", 300, 28),
    meal(11, "Chicken bowl", 650, 52),
    meal(12, "Greek yogurt", 300, 28),
    meal(12, "Salmon rice", 700, 48),
    meal(13, "Greek yogurt", 300, 28),
    meal(13, "Chicken bowl", 650, 52)
  ];

  const packet = await engine.analyze({
    userId: "user-a",
    activities,
    meals,
    now: "2026-08-23T19:00:00.000Z"
  });

  assert.equal(packet.ready, true);
  assert.equal(packet.available, true);
  assert.deepEqual([...packet.domains], ["training", "nutrition"]);
  assert.equal(packet.training.medianDurationMinutes, 50);
  assert.equal(packet.nutrition.loggedDayCount, 4);
  assert.ok(packet.patterns.some(item => item.id === "training.typical_duration"));
  assert.ok(packet.patterns.some(item => item.id === "training.usual_window"));
  assert.ok(packet.patterns.some(item => item.id === "nutrition.logged_day_baseline"));
  assert.ok(packet.facts.some(text => /historical baseline, not a nutrition target/i.test(text)));
});

test("sparse behavior does not become a learned recommendation", async () => {
  const engine = loadEngine();

  const packet = await engine.analyze({
    userId: "user-a",
    activities: [
      activity(20, 18, 45),
      activity(21, 7, 60)
    ],
    meals: [
      meal(20, "One-off meal", 500, 30),
      meal(21, "One-off meal", 500, 30)
    ]
  });

  assert.equal(packet.available, false);
  assert.equal(packet.confidence, "insufficient");
  assert.equal(packet.facts.length, 0);
});

test("learned patterns remain advisory and cannot overwrite explicit preferences", async () => {
  const engine = loadEngine();
  const packet = await engine.analyze({
    userId: "user-a",
    activities: [
      activity(10, 18, 45),
      activity(11, 18, 45),
      activity(12, 18, 45),
      activity(13, 18, 45),
      activity(14, 18, 45)
    ],
    meals: []
  });

  assert.equal(packet.authority.mayOverrideExplicitUserPreference, false);
  assert.equal(packet.authority.mayPersistPreferenceChanges, false);
  assert.equal(packet.authority.mayOverrideSafety, false);
  assert.match(packet.instructionText, /Explicit user instructions.*take precedence/i);
});

test("Circle and social behavior are excluded from personalization", async () => {
  const engine = loadEngine();
  const packet = await engine.analyze({
    userId: "user-a",
    activities: [
      { ...activity(10, 18, 45), circle_likes: 999 },
      { ...activity(11, 18, 45), circle_likes: 999 },
      { ...activity(12, 18, 45), circle_likes: 999 }
    ],
    meals: []
  });

  assert.equal(packet.authority.mayUseCircleData, false);
  assert.ok(packet.excludedDomains.includes("circle"));
  assert.doesNotMatch(engineSource, /\.from\(["'](?:ari_)?circle/i);
  assert.doesNotMatch(engineSource, /\.from\(["'](?:social|friends|challenges)/i);
});

test("memory stage passes personalization as advisory context without granting authority", () => {
  assert.match(memoryStageSource, /ari\/personalization\/ari-personalization-engine\.js\?v=1\.0\.0/);
  assert.match(memoryStageSource, /circleSocialPatterns:\s*false/);
  assert.match(memoryStageSource, /canUseCircleSocialBehavior:\s*false/);
  assert.match(memoryStageSource, /canOverrideExplicitPreferences:\s*false/);
  assert.match(memoryStageSource, /canPersistPreferenceChanges:\s*false/);
  assert.match(memoryStageSource, /Treat learned behavioral patterns as advisory observations only/);
});
