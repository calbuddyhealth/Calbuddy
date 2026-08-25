import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../ari-circle-v6.html", import.meta.url), "utf8");
const controller = await readFile(new URL("../js/ari-circle/v6/action-network-v6.js", import.meta.url), "utf8");

test("Circle V6 copy is action-oriented without social pressure", () => {
  const combined = `${html}\n${controller}`;
  assert.match(combined, /What are you up for\?/i);
  assert.match(combined, /worthwhile opportunities/i);
  assert.match(combined, /nobody is silently added/i);
  assert.doesNotMatch(combined, /hurry|last chance|everyone is going|don't miss out|lonely|people are waiting for you/i);
});