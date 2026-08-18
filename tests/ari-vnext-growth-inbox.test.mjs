import test from "node:test";
import assert from "node:assert/strict";

import { buildGrowthInbox, classifyGrowthReflection } from "../api/_lib/ari-vnext/growth-inbox.js";

test("wording feedback is something Ari can absorb herself", () => {
  const item = classifyGrowthReflection({
    id: "one",
    content: "Ari peer reflection (conversation): Ari should be more direct and avoid overexplaining routine questions. Future question: Can the next answer stay concise?"
  });
  assert.equal(item.level, "ari_handles");
  assert.equal(item.area, "personality");
});

test("missing capability becomes owner help", () => {
  const item = classifyGrowthReflection({
    id: "two",
    content: "Ari peer reflection (training): Ari cannot access the user's recovery field, so the recommendation rests on incomplete data. Future question: Does Ari need access to the canonical recovery source?"
  });
  assert.equal(item.level, "help_ari");
  assert.ok(["data_access", "fitness_reasoning"].includes(item.area));
  assert.match(item.ownerAction, /data|source|access|signal/i);
});

test("a single ambiguous reflection stays watch", () => {
  const item = classifyGrowthReflection({
    id: "three",
    content: "Ari peer reflection (training): The recommendation may need stronger evidence before changing the program. Future question: Is another week of adherence enough?"
  });
  assert.equal(item.level, "watch");
});

test("repeated watch feedback escalates to owner help", () => {
  const inbox = buildGrowthInbox([
    {
      id: "a",
      updated_at: "2026-08-18T01:00:00Z",
      content: "Ari peer reflection (training): The recommendation may need stronger evidence before changing the program."
    },
    {
      id: "b",
      updated_at: "2026-08-17T01:00:00Z",
      content: "Ari peer reflection (training): Ari should consider another performance sample before changing the program."
    }
  ]);

  assert.equal(inbox.summary.helpAri, 2);
  assert.ok(inbox.items.every((item) => item.repeatedPattern));
  assert.ok(inbox.items.every((item) => item.level === "help_ari"));
});

test("safety gap is owner priority", () => {
  const item = classifyGrowthReflection({
    id: "safety",
    content: "Ari peer reflection (conversation): There may be a safety gap because the response failed to recognize the high-stakes medical context."
  });
  assert.equal(item.level, "help_ari");
  assert.equal(item.area, "safety");
});
