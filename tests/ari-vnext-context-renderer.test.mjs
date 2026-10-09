import assert from "node:assert/strict";
import test from "node:test";

import { normalizeHistory } from "../api/_lib/ari-vnext/current-turn.js";

test("request normalization preserves the newest continuation when the character cap is reached", () => {
  const history = Array.from({ length: 16 }, (_, index) => ({
    role: index % 2 ? "assistant" : "user",
    content: `turn-${index} ${String(index).repeat(2180)}`
  }));

  const normalized = normalizeHistory(history);

  assert.ok(normalized.length > 0);
  assert.match(normalized.at(-1).content, /turn-15/);
  assert.equal(normalized.some((item) => item.content.includes("turn-0")), false);
  assert.ok(normalized.reduce((sum, item) => sum + item.content.length, 0) <= 14000);
});
