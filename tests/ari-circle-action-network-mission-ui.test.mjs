import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../ari-circle-quests.html", import.meta.url), "utf8");
const controller = await readFile(new URL("../js/ari-circle/quests/missions-v2.js", import.meta.url), "utf8");
const css = await readFile(new URL("../assets/css/ari-circle-mission-v2.css", import.meta.url), "utf8");

test("Mission V2 becomes the primary measurable surface while classic Quests remain compatible", () => {
  assert.match(html, /<h1 id="questTitle">Missions<\/h1>/i);
  assert.match(html, /id="missionList"/i);
  assert.match(html, /id="questList"/i);
  assert.ok(html.indexOf('id="missionList"') < html.indexOf('id="questList"'));
  assert.match(html, /Classic Quest/i);
  assert.match(html, /quests-v5\.js\?v=5\.0\.0/);
  assert.match(html, /missions-v2\.js\?v=2\.0\.1/);
});

test("Mission V2 controller remains valid browser JavaScript", () => {
  assert.doesNotThrow(() => new Function(controller));
  assert.match(controller, /const VERSION = "2\.0\.1"/);
});

test("Mission V2 controller uses guarded RPCs and never direct table writes", () => {
  for (const rpc of [
    "ari_circle_list_missions_v2",
    "ari_circle_create_mission_v2",
    "ari_circle_join_quest",
    "ari_circle_submit_mission_progress",
    "ari_circle_list_mission_contributions",
    "ari_circle_review_mission_contribution"
  ]) {
    assert.match(controller, new RegExp(rpc));
  }
  assert.doesNotMatch(controller, /\.from\s*\(/);
  assert.doesNotMatch(controller, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("Mission creation exposes measurable objective shape without XP purchasing or location collection", () => {
  for (const id of [
    "missionFormObjective",
    "missionFormProgressMode",
    "missionFormTarget",
    "missionFormUnit",
    "missionFormVerification",
    "missionFormEnds"
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /Measurable Missions are 0 XP in this phase/i);
  assert.doesNotMatch(html, /missionFormXp/i);
  assert.doesNotMatch(html, /meeting point|latitude|longitude/i);
});

test("Mission progress retries preserve one client event identity until success", () => {
  assert.match(html, /id="missionProgressEventId"/);
  assert.match(controller, /\$\("missionProgressEventId"\)\.value = randomEventId\(\)/);
  assert.match(controller, /requested_client_event_id: eventId/);
  assert.match(controller, /\$\("missionProgressEventId"\)\.value = ""/);
  assert.match(controller, /window\.crypto\?\.randomUUID/);
  assert.match(controller, /window\.crypto\?\.getRandomValues/);
  assert.match(controller, /Math\.random\(\) \* 256/);
  assert.match(html, /same contribution identity is reused if a submission needs to be retried/i);
});

test("Mission review refresh never reopens an already-open modal", () => {
  assert.match(controller, /const dialog = \$\("missionReviewDialog"\)/);
  assert.match(controller, /if \(!dialog\.open\) dialog\.showModal\?\.\(\)/);
});

test("Mission cards render verified progress rather than engagement counters", () => {
  assert.match(controller, /verified_progress/);
  assert.match(controller, /viewer_pending_progress/);
  assert.match(controller, /progress_percent/);
  assert.match(controller, /role="progressbar"/);
  assert.doesNotMatch(controller, /\b(likes|reactions|followers|views)\b/i);
});

test("Mission UI keeps verification evidence inside review rather than public cards", () => {
  const cardFunction = controller.split(/function createMissionCard\(row\)/)[1]?.split(/function button\(/)[0] || "";
  assert.doesNotMatch(cardFunction, /proof_note/i);
  assert.match(controller, /ari_circle_list_mission_contributions/);
  assert.match(controller, /proof_note/);
});

test("Mission V2 styling has one dedicated lightweight layer", () => {
  assert.match(html, /ari-circle-mission-v2\.css\?v=2\.0\.0/);
  assert.match(css, /\.circle-mission-v2-card/);
  assert.match(css, /\.circle-mission-v2-progress/);
  assert.doesNotMatch(css, /position\s*:\s*fixed/i);
});
