import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const authority = fs.readFileSync(
  new URL("../js/ari-circle/profile/profile-connection-authority.js", import.meta.url),
  "utf8"
);

const loader = fs.readFileSync(
  new URL("../js/ari-circle/profile/profile-v3-loader.js", import.meta.url),
  "utf8"
);

test("visitor profile connection authority is idempotent", () => {
  assert.match(authority, /if \(target\.textContent !== desired\.text\)/);
  assert.match(authority, /if \(target\.dataset\.circleAction !== "connection"\)/);
  assert.match(authority, /if \(target\.getAttribute\("aria-label"\) !== desired\.ariaLabel\)/);
  assert.match(authority, /state\.scheduled/);
  assert.match(authority, /function scheduleApply\(\)/);
  assert.doesNotMatch(authority, /subtree:\s*true/);
});

test("profile loader requests the fixed connection authority", () => {
  assert.match(
    loader,
    /profile-connection-authority\.js\?v=1\.0\.1/
  );
});
