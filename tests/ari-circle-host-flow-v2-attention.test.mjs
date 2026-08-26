import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const v6Html = await readFile(new URL("../ari-circle-v6.html", import.meta.url), "utf8");
const attention = await readFile(new URL("../js/ari-circle/meetups/host-flow-v2.js", import.meta.url), "utf8");

test("Host Flow V2 vacancy attention remains valid browser JavaScript", () => {
  assert.doesNotThrow(() => new Function(attention));
  assert.match(v6Html, /js\/ari-circle\/meetups\/host-flow-v2\.js\?v=2\.0\.1/);
});

test("opened-seat events tell the host what action to take", () => {
  assert.match(attention, /A spot opened in one of your current matches/);
  assert.match(attention, /A spot opened in your meetup/);
  assert.match(attention, /choose someone from the waitlist/i);
  assert.match(attention, /MutationObserver/);
});
