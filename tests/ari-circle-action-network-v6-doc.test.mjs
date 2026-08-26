import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const doc = await readFile(new URL("../docs/ARI_CIRCLE_V6_EXPERIENCE.md", import.meta.url), "utf8");

test("Circle V6 documentation keeps the Action Network product contract explicit", () => {
  assert.match(doc, /Intent → best current actions → commitment → real-world activity → verified history → Crew\/community → next action/i);
  assert.match(doc, /not another social feed/i);
  assert.match(doc, /Internal match scores are not displayed/i);
  assert.match(doc, /no automatic browser GPS prompt/i);
  assert.match(doc, /other founding members receive invitations/i);
  assert.match(doc, /pay-to-rank or premium social advantage/i);
  assert.match(doc, /one persistent three-destination navigation model/i);
  assert.match(doc, /Moments.*Feed content type.*not a separate global destination/i);
  assert.match(doc, /ari-circle-v6\.html.*canonical.*ARI Next/i);
  assert.doesNotMatch(doc, /lab route/i);
  assert.doesNotMatch(doc, /Production Circle navigation is intentionally unchanged/i);
});