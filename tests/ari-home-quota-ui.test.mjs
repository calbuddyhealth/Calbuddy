import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync("home.html", "utf8");
const ui = fs.readFileSync("js/ari-quota-ui.js", "utf8");
const css = fs.readFileSync("assets/css/ari-quota-ui.css", "utf8");

test("Home surfaces daily Ari usage beside ASK ARI", () => {
  assert.match(home, /class="ari-composer-meta"/);
  assert.match(home, /id="ariDailyQuotaPill"/);
  assert.match(home, /id="ariDailyQuotaDetail"/);
  assert.match(home, /ari-quota-ui\.css\?v=1\.0\.0/);
  assert.match(home, /ari-quota-ui\.js\?v=1\.0\.0/);
});

test("quota UI loads authenticated status before the first question", () => {
  assert.match(ui, /\/api\/ari-daily-chat-quota/);
  assert.match(ui, /client\.auth\.getSession\(\)/);
  assert.match(ui, /method: "GET"/);
  assert.match(ui, /window\.setTimeout\(loadQuota, 650\)/);
});

test("regular users see compact remaining state and a midnight explanation", () => {
  assert.match(ui, /`\$\{remaining\} LEFT`/);
  assert.match(ui, /LIMIT REACHED/);
  assert.match(ui, /Resets at midnight/);
  assert.match(ui, /remaining <= 3 \? "low" : "normal"/);
  assert.match(css, /\.ari-quota-pill\[data-state="low"\]/);
  assert.match(css, /body\.ari-home-page #ariDailyQuotaStatus/);
});

test("zero quota blocks both SEND and Enter while owner remains unlimited", () => {
  assert.match(ui, /send\.disabled = true/);
  assert.match(ui, /event\.stopImmediatePropagation\(\)/);
  assert.match(ui, /new MutationObserver/);
  assert.match(ui, /next\.unlimited === true/);
  assert.match(ui, /pill\.textContent = "UNLIMITED"/);
});
