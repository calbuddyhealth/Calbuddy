import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contract = await readFile(
  new URL("../docs/ARI_CIRCLE_DOMAIN_EVENTS_V1.md", import.meta.url),
  "utf8"
);

test("Domain Events V1 documentation preserves the product trust boundary", () => {
  assert.match(contract, /short-lived, server-authoritative coordination layer/i);
  assert.match(contract, /not durable Ari social memory/i);
  assert.match(contract, /Browsers and normal authenticated callers cannot insert\/update\/delete event rows/i);
  assert.match(contract, /Private coordination events are limited to involved users/i);
  assert.match(contract, /exact meeting points/i);
  assert.match(contract, /user coordinates/i);
  assert.match(contract, /payment\/subscription state/i);
  assert.match(contract, /spot_opened.*previously full scheduled Meetup to exactly one available spot/is);
});
