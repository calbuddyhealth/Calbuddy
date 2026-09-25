import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Ari Signal cards open details before engaging Ari", async () => {
  const source = await readFile(new URL("../js/ari-signals.js", import.meta.url), "utf8");
  assert.match(source, /View details/);
  assert.match(source, /function openSignalDetail/);
  assert.match(source, /WHAT I MEAN/);
  assert.match(source, /WHY I SENT THIS/);
  assert.match(source, /WHAT I NEED FROM JOSE/);
  assert.match(source, /WHAT I NEED FROM CHATGPT/);
  assert.match(source, /COPY FOR CHATGPT/);
  assert.match(source, /openPanel\(\);\s*openSignalDetail\(id\);/);
  assert.doesNotMatch(source, /data-signal-id[\s\S]{0,700}await engageSignal\(node\.getAttribute/);
});

test("Ari Signal detail assets are cache-busted and styled", async () => {
  const [home, css] = await Promise.all([
    readFile(new URL("../home.html", import.meta.url), "utf8"),
    readFile(new URL("../assets/css/ari-signals.css", import.meta.url), "utf8")
  ]);
  assert.match(home, /ari-signals\.css\?v=1\.1\.0/);
  assert.match(home, /ari-signals\.js\?v=1\.1\.0/);
  assert.match(css, /\.ari-signal-detail/);
  assert.match(css, /\.ari-signal-view/);
  assert.match(css, /\.ari-signal-detail-actions/);
});
